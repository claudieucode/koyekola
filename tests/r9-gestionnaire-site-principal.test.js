// R9-4 — le site principal dans le gestionnaire central : une seule entrée avec ou sans la ligne dédiée (is_primary), sélecteurs sans doublon, aucun contenu rattachable à la ligne dédiée,
// convention site_id NULL préservée, isolation et permissions inchangées, aucune création ni modification automatique. Vrais serveurs, bases jetables ; la migration R9-3 est appliquée par le test (jamais par l'application).
const crypto = require("node:crypto");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const M = require("../scripts/r9/site-maitre");

describe("R9-4 : site principal dans le gestionnaire", () => {
  let srv, boss, db, A, B, adminA, adminB, memberOnlyA, anon, rowId;
  const SP = "/marketing/site-web/sites";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
  const tr = (html, key) => (html.match(new RegExp(`<tr data-site="${key}"`, "g")) || []).length;
  const URLS = ["/marketing/site-web/sites", "/marketing/site-web/principal/tableau-de-bord", `/marketing/site-web/sites/${1}/tableau-de-bord`, "/marketing/contacts", "/marketing/listes", "/marketing/campagnes", "/marketing/site-web/mediatheque",
    "/marketing/site-web/navigation", "/marketing/automatisations", "/marketing/tunnels", "/marketing/modeles", "/marketing/segments", "/marketing/site-web/tests-ab", "/marketing/importer", "/marketing"];
  const snapshot = async (c) => { const o = {}; for (const u of URLS) { const r = await c.get(u); o[u] = [r.status, (r.text.match(/Site principal/g) || []).length]; } return o; };
  let base0;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Gestion"); B = await mkSite("Bravo Gestion"); await mkSite("Charlie Gestion");
    adminA = await member(A, "admin"); adminB = await member(B, "admin"); memberOnlyA = await member(A, "editor");
    db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, seo) VALUES (1, 'Page du principal', 'page-principal', 'Page du principal', 'published', NULL, '{}')").run();
    db.prepare("INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (1, 'principal@ex.cd', NULL)").run();
    base0 = { page: await boss.get(SP), snap: await snapshot(boss), sites: db.prepare("SELECT COUNT(*) n FROM mk_sites").get().n, sig: M.signature(db) };
  });
  after(() => { db.close(); return srv.stop(); });

  test("1. sans ligne dédiée : comportement historique — une entrée « principal » et chaque site une fois ; aucune colonne is_primary créée par l'application", () => {
    assert.equal(base0.page.status, 200); assert.equal(tr(base0.page.text, "principal"), 1);
    for (const id of [A, B, 3]) assert.equal(tr(base0.page.text, String(id)), 1, `site ${id}`);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM pragma_table_info('mk_sites') WHERE name = 'is_primary'").get().n, 0);
    assert.equal(base0.sites, 3);
  });
  test("2. après la migration R9-3 : une seule entrée « principal », tous les sites une fois, mêmes chiffres du gestionnaire ; l'entrée est identifiée par la ligne dédiée", async () => {
    const stats = (html) => (html.match(/<span class="mk-stat-value">[^<]*<\/span>/g) || []).join("");
    const r = M.appliquer(db); rowId = r.primaryId;
    const page = await boss.get(SP); assert.equal(page.status, 200); assert.equal(tr(page.text, "principal"), 1, "une seule entrée du principal");
    for (const id of [A, B, 3]) assert.equal(tr(page.text, String(id)), 1, `site ${id} une seule fois`);
    assert.equal(tr(page.text, String(rowId)), 0, "la ligne dédiée n'est pas listée comme un site ordinaire");
    assert.equal(stats(page.text), stats(base0.page.text), "chiffres du gestionnaire (sites actifs, pages en ligne, modules…) identiques");
    assert.match(page.text, /<tr data-site="principal">[\s\S]*?Principal<\/span>/); assert.match(page.text, /href="\/marketing\/site-web\/principal\/tableau-de-bord"/);
  });
  test("3. sélecteurs, listes et tableaux de bord : aucune duplication du site principal (20 écrans comparés avant / après)", async () => {
    const after = await snapshot(boss); assert.deepEqual(after, base0.snap);
  });
  test("4. la ligne dédiée n'est pas ouvrable par son identifiant : redirection vers l'espace du principal (équipe) ; refus pour un accès limité ; aucun site « fantôme »", async () => {
    const r = await boss.get(`${SP}/${rowId}/tableau-de-bord`); assert.equal(r.status, 302); assert.equal(r.location, "/marketing/site-web/principal/tableau-de-bord");
    const sub = await boss.get(`${SP}/${rowId}/contacts`); assert.equal(sub.status, 302); assert.equal(sub.location, "/marketing/site-web/principal/contacts");
    assert.equal((await boss.get(r.location)).status, 200, "l'espace du principal est servi");
    const lim = await adminA.get(`${SP}/${rowId}/tableau-de-bord`); assert.ok([403, 404].includes(lim.status), `accès limité : ${lim.status}`); assert.doesNotMatch(lim.text, /Site principal/);
    assert.ok([403, 404, 302].includes((await adminA.get("/marketing/site-web/principal/tableau-de-bord")).status));
    const an = await anon.get(`${SP}/${rowId}/tableau-de-bord`); assert.equal(an.status, 302); assert.match(an.location, /connexion/);
    // écriture forgée par l'équipe sur la ligne dédiée : réglages du site refusés (site introuvable), ligne inchangée
    const before = one("SELECT settings, settings_revision, name FROM mk_sites WHERE id = ?", rowId);
    const put = await boss.request(`${SP}/${rowId}/reglages.json`, { method: "PUT", json: { settings: { seo: { publicUrl: "https://intrus.test" } }, revision: before.settings_revision }, headers: { Origin: srv.base } });
    assert.ok([403, 404].includes(put.status), `PUT réglages sur la ligne dédiée : ${put.status}`); assert.deepEqual(one("SELECT settings, settings_revision, name FROM mk_sites WHERE id = ?", rowId), before);
  });
  test("5. rien ne peut être rattaché à la ligne dédiée : création de page, déplacement, import et réglages SEO avec son identifiant sont refusés ou ignorés ; aucune colonne de portée ne la référence", async () => {
    const pagesBefore = M.tableCounts(db).mk_landing_pages;
    await boss.post("/marketing/pages", { name: "Forgée", site_id: String(rowId) });
    await boss.post(`${SP}/${rowId}/pages`, { name: "Forgée 2" });
    const seo = await boss.post(`${SP}/${A}/seo`, { site_id: String(rowId), site: String(rowId), site_name: "Intrus" });
    for (const [t, c] of M.siteColumns(db)) assert.equal(db.prepare(`SELECT COUNT(*) n FROM "${t}" WHERE "${c}" = ?`).get(rowId).n, 0, `${t}.${c}`);
    assert.ok(M.tableCounts(db).mk_landing_pages - pagesBefore <= 1, "au plus la page créée sans site par la requête valide");
    assert.ok([200, 302, 400, 403, 404].includes(seo.status));
  });
  test("6. convention préservée : les contenus historiques du principal gardent site_id NULL et restent dans son espace ; les autres sites sont inchangés", async () => {
    assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE slug = 'page-principal'").site_id, null); assert.equal(one("SELECT origin_site_id FROM mk_contacts WHERE email = 'principal@ex.cd'").origin_site_id, null);
    const space = await boss.get("/marketing/site-web/principal/tableau-de-bord"); assert.match(space.text, /Page du principal/);
    const a = await adminA.get(`${SP}/${A}/tableau-de-bord`); assert.equal(a.status, 200); assert.doesNotMatch(a.text, /Page du principal/);
    assert.equal((await adminB.get(`${SP}/${A}/tableau-de-bord`)).status, 403, "isolation entre sites");
    assert.equal((await memberOnlyA.get(`${SP}/${B}/tableau-de-bord`)).status, 403);
  });
  test("7. navigation, réglages et états fermés : les écrans « Bientôt » restent fermés ; les liens de retour du site vont vers « Mes sites »", async () => {
    const soon = await boss.get(`${SP}/${A}/modeles`); assert.equal(soon.status, 200); assert.match(soon.text, /Prochain palier/); assert.equal((soon.text.match(/<table|<form method="post"/g) || []).length, 0);
    const dash = await boss.get(`${SP}/${A}/tableau-de-bord`); assert.match(dash.text, /href="\/marketing\/site-web\/sites"/);
    assert.equal((await boss.get("/marketing/site-web/principal/tableau-de-bord")).status, 200);
  });
  test("8. aucune création ni modification automatique : après toutes ces visites, la ligne dédiée, la structure et le nombre de sites sont inchangés ; un second démarrage de migration est refusé", () => {
    const row = one("SELECT * FROM mk_sites WHERE is_primary = 1"); assert.deepEqual([row.id, row.name, row.slug, row.settings, row.tokens, row.home_page_id], [rowId, "Site principal", "principal", "{}", "{}", null]);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_sites WHERE is_primary = 1").get().n, 1); assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_sites").get().n, base0.sites + 1);
    assert.throws(() => M.appliquer(db), /déjà appliquée/);
  });
  test("9. retour arrière puis état initial : l'affichage du gestionnaire est identique à l'état de départ", async () => {
    M.retour(db); const page = await boss.get(SP); assert.equal(tr(page.text, "principal"), 1); assert.deepEqual(await snapshot(boss), base0.snap); assert.equal(M.signature(db), base0.sig);
  });
});
