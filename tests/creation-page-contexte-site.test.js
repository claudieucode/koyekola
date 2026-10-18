// Incident « création de page renvoyée vers le site principal » : le site de la page doit être conservé de bout en bout (création, redirection, écran de la page, éditeur, enregistrement, retour, archivage, suppression),
// sans aucune sortie injustifiée vers le tableau de bord du principal, et sans accès ni écriture dans un autre site. Vrais serveurs, base jetable.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("création de page : le site est conservé", () => {
  let srv, boss, db, A, B, adminA, adminB, viewerA, anon;
  const SP = "/marketing/site-web/sites", PRINCIPAL_DASH = "/marketing/site-web/principal/tableau-de-bord";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
  const pageId = (name) => one("SELECT id FROM mk_landing_pages WHERE name = ?", name).id;
  const siteOf = (id) => one("SELECT site_id FROM mk_landing_pages WHERE id = ?", id).site_id;
  const links = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const navLinks = (html) => [...((html.match(/<nav[^>]*class="[^"]*mk-cms-nav[^"]*"[\s\S]*?<\/nav>/) || [""])[0]).matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  const banner = (html) => (html.match(/mk-site-banner-name">([^<]*)</) || [])[1] || null;
  const backLink = (html) => (html.match(/<p class="mk-back"><a href="([^"]+)">← Pages/) || [])[1];
  const noPrincipal = (loc, label) => assert.ok(!String(loc).includes("/principal"), `${label} : redirection injustifiée vers le principal (${loc})`);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Pages"); B = await mkSite("Bravo Pages"); adminA = await member(A, "admin"); adminB = await member(B, "admin"); viewerA = await member(A, "viewer");
  });
  after(() => { db.close(); return srv.stop(); });

  test("principal : une page créée sans site reste au principal, s'ouvre dans le cadre du principal, et son retour va à la liste des pages", async () => {
    const r = await boss.post("/marketing/pages", { name: "Page principale" }); assert.equal(r.status, 302); const id = pageId("Page principale"); assert.equal(siteOf(id), null);
    assert.equal(r.location, `/marketing/pages/${id}`);
    const screen = await boss.get(r.location); assert.equal(screen.status, 200);
    assert.equal(banner(screen.text), null, "cadre central historique (aucun bandeau de site)"); assert.ok(navLinks(screen.text).includes("/marketing/pages"), "menu central historique inchangé"); assert.equal(backLink(screen.text), "/marketing/pages", "← Pages : la liste centrale");
    const ed = await boss.get(`/marketing/pages/${id}/editeur?retour=pages`); assert.equal(ed.status, 200); assert.ok(links(ed.text).includes("/marketing/pages"), "retour de l'éditeur : liste centrale");
  });
  test("site secondaire : création depuis l'espace du site → bon site en base ; l'écran de la page est dans le cadre DU SITE (menu, tableau de bord, retour) ; l'éditeur revient aux pages DU SITE", async () => {
    const r = await adminA.post("/marketing/pages", { name: "Page Alpha", site_id: String(A) }, { headers: { Referer: `${srv.base}${SP}/${A}/pages` } }); assert.equal(r.status, 302); const id = pageId("Page Alpha");
    assert.equal(siteOf(id), A, "page créée dans le site Alpha"); noPrincipal(r.location, "création");
    const screen = await adminA.get(r.location); assert.equal(screen.status, 200); const nav = navLinks(screen.text);
    assert.equal(banner(screen.text), "Alpha Pages", "bandeau du site"); assert.ok(nav.includes(`${SP}/${A}/tableau-de-bord`), "menu : tableau de bord DU SITE"); assert.ok(nav.includes(`${SP}/${A}/pages`), "menu : pages du site");
    assert.ok(!nav.includes("/marketing/pages") && !nav.includes("/marketing/site-web") && !nav.includes(PRINCIPAL_DASH), "menu : plus de cadre central ni de tableau de bord du principal"); assert.equal(backLink(screen.text), `${SP}/${A}/pages`, "← Pages : la liste des pages du site");
    const ed = await adminA.get(`/marketing/pages/${id}/editeur?retour=pages`); assert.equal(ed.status, 200); const el = links(ed.text);
    assert.ok(el.includes(`${SP}/${A}/pages`), "éditeur : retour aux pages du site"); assert.ok(!el.includes("/marketing/pages") && !el.some((h) => h.includes("/principal")), "éditeur : aucun retour vers le principal");
    assert.equal(siteOf(id), A);
  });
  test("conservation du site après ouverture, modification et enregistrement ; un « site_id » forgé à l'enregistrement ne déplace pas la page", async () => {
    const id = pageId("Page Alpha");
    const save = await adminA.post(`/marketing/pages/${id}`, { name: "Page Alpha", slug: "alpha-modifiee", site_id: String(B), site: String(B), action: "save" }); noPrincipal(save.location, "enregistrement");
    assert.equal(save.location, `/marketing/pages/${id}`); assert.equal(siteOf(id), A, "toujours dans Alpha après enregistrement"); assert.equal(one("SELECT slug FROM mk_landing_pages WHERE id = ?", id).slug, "alpha-modifiee", "la modification est bien enregistrée");
    const again = await adminA.get(save.location); assert.equal(banner(again.text), "Alpha Pages"); assert.ok(navLinks(again.text).includes(`${SP}/${A}/tableau-de-bord`) && !navLinks(again.text).includes(PRINCIPAL_DASH));
    const pub = await adminA.post(`/marketing/pages/${id}/publier`, {}); noPrincipal(pub.location, "publication"); assert.equal(siteOf(id), A);
    const list = (await adminA.get(`${SP}/${A}/pages`)).text; assert.match(list, /Page Alpha/);
  });
  test("échec de création depuis le site (nom déjà pris) : retour à la liste des pages DU SITE, pas à celle du principal ; rien n'est créé", async () => {
    const before = one("SELECT COUNT(*) n FROM mk_landing_pages").n;
    const r = await adminA.post("/marketing/pages", { name: "Page Alpha", site_id: String(A) }, { headers: { Referer: `${srv.base}${SP}/${A}/pages` } });
    assert.equal(r.status, 302); assert.equal(r.location, `${SP}/${A}/pages`, "retour à l'espace du site"); assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages").n, before);
    const empty = await adminA.post("/marketing/pages", { name: "   ", site_id: String(A) }); assert.equal(empty.location, `${SP}/${A}/pages`);
  });
  test("archivage et suppression d'une page de site : retour à la liste des pages DU SITE", async () => {
    await adminA.post("/marketing/pages", { name: "Page à ranger", site_id: String(A) }); const id = pageId("Page à ranger");
    const arch = await adminA.post(`/marketing/pages/${id}/archiver`, {}); assert.equal(arch.location, `${SP}/${A}/pages`, "archivage");
    const del = await adminA.post(`/marketing/pages/${id}/supprimer`, {}); assert.equal(del.location, `${SP}/${A}/pages`, "suppression");
  });
  test("sécurité : un autre site, un lecteur et un anonyme ne peuvent ni voir, ni créer, ni écrire dans Alpha ; un site_id forgé est refusé", async () => {
    const id = pageId("Page Alpha"), before = one("SELECT COUNT(*) n FROM mk_landing_pages").n;
    assert.ok([403, 404].includes((await adminB.get(`/marketing/pages/${id}`)).status)); assert.ok([403, 404].includes((await adminB.get(`/marketing/pages/${id}/editeur`)).status));
    assert.ok([403, 404].includes((await adminB.post(`/marketing/pages/${id}`, { name: "Piratée", action: "save" })).status)); assert.equal(one("SELECT name FROM mk_landing_pages WHERE id = ?", id).name, "Page Alpha", "rien n'a été modifié par un autre site");
    const forged = await adminB.post("/marketing/pages", { name: "Intrus dans Alpha", site_id: String(A) }); assert.ok([302, 403, 404].includes(forged.status));
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE name = 'Intrus dans Alpha'").get().n, 0, "rien créé dans Alpha par un autre site"); assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages").n, before);
    const v = await viewerA.post("/marketing/pages", { name: "Par lecteur", site_id: String(A) }); assert.equal(v.status, 403); assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE name = 'Par lecteur'").get().n, 0);
    const an = await anon.post("/marketing/pages", { name: "Anonyme", site_id: String(A) }); assert.equal(an.status, 302); assert.match(an.location, /connexion/);
    const own = await adminA.post("/marketing/pages", { name: "Alpha vers Bravo", site_id: String(B) }); assert.ok([302, 403, 404].includes(own.status)); assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE name = 'Alpha vers Bravo' AND site_id = ?").get(B).n, 0, "Alpha ne crée pas dans Bravo");
  });
});
