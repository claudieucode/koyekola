// Site builder multisite — étapes B/C : un site est créé STRICTEMENT VIERGE, ses modèles de pages lui sont privés, son aperçu et sa vitrine vide sont explicites
// (jamais le contenu ni l'habillage du site principal).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

function hostGet(srv, host, p) {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path: p, headers: { Host: host } }, (x) => { let text = ""; x.on("data", (d) => (text += d)); x.on("end", () => resolve({ status: x.statusCode, text, headers: x.headers })); });
    r.on("error", reject); r.end();
  });
}

describe("site strictement vierge, modèles privés, aperçu et vitrine vides", () => {
  let srv, boss, db, A, B, adminA, adminB, anon;
  const SP = "/marketing/site-web/sites", PR = "/marketing/site-web/principal", ORIGIN = () => ({ Origin: srv.base });
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const counts = () => Object.fromEntries(db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all().map((t) => [t.name, db.prepare(`SELECT COUNT(*) n FROM "${t.name}"`).get().n]));
  const setDomain = async (site, url) => {
    const cur = JSON.parse((await boss.get(`${SP}/${site}/reglages.json`)).text);
    return boss.request(`${SP}/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() });
  };
  const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, one("SELECT id FROM users WHERE email = ?", c.email).id, role); return c; };
  const dialog = (html) => (html.match(/<dialog[^>]*id="nouvelle"[\s\S]*?<\/dialog>/) || [""])[0];
  const body = { title: "T", description: "d", sections: [{ type: "text", markdown: "Contenu privé du modèle" }] };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Vierge"); B = await mkSite("Bravo Vierge");
    adminA = await member(A, "admin"); adminB = await member(B, "admin");
    const org = one("SELECT id FROM mk_organizations").id;
    db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, published_at, kind) VALUES (?, 'Principale', 'principale', 'MAIN-SECRET-TITRE', 'published', datetime('now'), 'page')").run(org);
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200);
  });
  after(() => { db.close(); return srv.stop(); });

  test("B1 — créer un site n'ajoute que la ligne du site (et son journal) : aucune page, menu, composant, modèle, formulaire, média, article ni réglage copié", async () => {
    const before = counts();
    const id = await mkSite("Totalement vide");
    const after = counts();
    const delta = Object.keys(after).filter((t) => after[t] !== before[t]).sort();
    assert.deepEqual(delta, ["mk_audit_logs", "mk_sites"], `seules ces tables changent : ${delta.join(", ")}`);
    const site = one("SELECT * FROM mk_sites WHERE id = ?", id);
    assert.equal(site.header_component_id, null); assert.equal(site.footer_component_id, null); assert.equal(site.home_page_id, null);
    const conf = JSON.parse(site.settings || "{}"); assert.ok(!conf.seo || !conf.seo.publicUrl, "aucun domaine hérité");
  });
  test("B2 — l'espace d'un site vierge est réellement vide (pages, tableau de bord) et ne montre rien du site principal", async () => {
    for (const u of [`${SP}/${B}/pages`, `${SP}/${B}/tableau-de-bord`]) { const r = await boss.get(u); assert.equal(r.status, 200); assert.doesNotMatch(r.text, /MAIN-SECRET-TITRE|principale/, u); }
    assert.match((await boss.get(`${SP}/${B}/tableau-de-bord`)).text, /Aucune page pour l(?:'|&#39;)instant/);
    assert.match((await boss.get(`${SP}/${B}/tableau-de-bord`)).text, new RegExp(`href="${SP}/${B}/apercu"`), "action « Aperçu du site »");
  });
  test("C1 — aperçu privé d'un site vierge : état explicatif + action pour commencer ; aucun contenu du principal ; réservé aux personnes autorisées", async () => {
    const r = await boss.get(`${SP}/${B}/apercu`); assert.equal(r.status, 200); assert.match(r.headers.get("cache-control") || "", /no-store/);
    assert.match(r.text, /Ce site n&#39;a pas encore été construit|Ce site n'a pas encore été construit/); assert.match(r.text, new RegExp(`href="${SP}/${B}/pages#nouvelle"`));
    assert.doesNotMatch(r.text, /MAIN-SECRET-TITRE/);
    assert.equal((await adminA.get(`${SP}/${B}/apercu`)).status, 403, "un autre site n'accède pas à cet aperçu");
    const a = await anon.get(`${SP}/${B}/apercu`); assert.equal(a.status, 302); assert.match(a.location, /connexion/);
  });
  test("C2 — aperçu d'un site construit : mène à l'aperçu de SA page (la page d'accueil, sinon la première), brouillon compris", async () => {
    await adminB.post("/marketing/pages", { name: "Première B", ouvrir: "editeur", template: "", layoutMode: "free", site_id: String(B) });
    const id = one("SELECT id FROM mk_landing_pages WHERE name = 'Première B'").id;
    const r = await adminB.get(`${SP}/${B}/apercu`); assert.equal(r.status, 302); assert.equal(r.location, `/marketing/pages/${id}/apercu`);
    assert.equal((await adminB.get(r.location)).status, 200);
  });
  test("C3 — vitrine d'un site non publié : message neutre « pas encore publié », sans l'habillage ni les liens de la plateforme", async () => {
    for (const p of ["/", "/inexistant"]) {
      const r = await hostGet(srv, "a.test", p); assert.equal(r.status, 404, p); assert.match(r.headers["x-robots-tag"] || "", /noindex/);
      assert.match(r.text, /pas encore publié/, p);
      assert.doesNotMatch(r.text, /KOLAKISA|Catalogue|Blog|Connexion|Commencer|Rechercher|MAIN-SECRET/i, `${p} : aucun habillage ni contenu du principal`);
    }
    const main = await hostGet(srv, "k.test", "/inexistant"); assert.equal(main.status, 404); assert.match(main.text, /KOLAKISA/i, "le site principal garde sa page d'erreur d'origine");
  });
  test("C4 — site construit sur son domaine : une adresse inconnue donne « Page introuvable » neutre (toujours sans habillage plateforme)", async () => {
    const org = one("SELECT id FROM mk_organizations").id;
    const home = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind) VALUES (?, 'Accueil Alpha', 'accueil-alpha', 'ACCUEIL-ALPHA', 'published', ?, datetime('now'), 'page')").run(org, A).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(home, A);
    await new Promise((r) => setTimeout(r, 5200)); // cache des domaines (5 s)
    const r = await hostGet(srv, "a.test", "/pas-ici"); assert.equal(r.status, 404); assert.match(r.text, /Page introuvable/); assert.doesNotMatch(r.text, /KOLAKISA|Catalogue|Connexion|MAIN-SECRET/i);
  });

  // ---- Modèles de pages enregistrés : privés à leur site ----
  test("B3 — un modèle enregistré depuis le site Alpha n'est proposé ni à Bravo ni au principal ; il l'est à Alpha", async () => {
    const save = await boss.request("/marketing/site-web/modeles", { method: "POST", json: { name: "Modèle Alpha", category: "Test", description: "d", content: body, siteId: A }, headers: ORIGIN() });
    assert.equal(save.status, 201, String(save.text));
    const tid = JSON.parse(save.text).template.id;
    assert.equal(one("SELECT site_id, shared FROM mk_page_templates WHERE id = ?", tid).site_id, A); assert.equal(one("SELECT shared FROM mk_page_templates WHERE id = ?", tid).shared, 0);
    assert.match(dialog((await boss.get(`${SP}/${A}/pages`)).text), /Modèle Alpha/);
    assert.doesNotMatch(dialog((await boss.get(`${SP}/${B}/pages`)).text), /Modèle Alpha/, "pas chez Bravo");
    assert.doesNotMatch(dialog((await boss.get(`${PR}/pages`)).text), /Modèle Alpha/, "pas au principal");
    assert.doesNotMatch(dialog((await boss.get("/marketing/pages")).text), /Modèle Alpha/, "pas dans la liste centrale (principal)");
    // l'API de l'éditeur respecte la même frontière
    assert.equal((await boss.get(`/marketing/site-web/modeles/${tid}.json?site=${B}`)).status, 404);
    assert.equal((await boss.get(`/marketing/site-web/modeles/${tid}.json`)).status, 404);
    assert.equal((await boss.get(`/marketing/site-web/modeles/${tid}.json?site=${A}`)).status, 200);
    assert.ok(!JSON.parse((await boss.get(`/marketing/site-web/modeles.json?site=${B}`)).text).templates.some((t) => t.id === tid));
  });
  test("B4 — créer une page dans Bravo avec le modèle d'Alpha est refusé (rien n'est créé) ; dans Alpha, ça marche", async () => {
    const tid = one("SELECT id FROM mk_page_templates WHERE name = 'Modèle Alpha'").id;
    const bad = await boss.post("/marketing/pages", { name: "Vol de modèle", ouvrir: "editeur", template: `mine:${tid}`, layoutMode: "free", site_id: String(B) });
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE name = 'Vol de modèle'").n, 0, "aucune page créée à partir du modèle d'un autre site"); assert.ok([302, 400, 403, 404, 422].includes(bad.status));
    const good = await boss.post("/marketing/pages", { name: "Avec modèle", ouvrir: "editeur", template: `mine:${tid}`, layoutMode: "free", site_id: String(A) });
    assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE name = 'Avec modèle'").site_id, A); assert.match(String(good.location), /editeur/);
  });
  test("B5 — un nom de modèle déjà pris par un autre site ne l'écrase JAMAIS (refus explicite, modèle d'Alpha intact) ; un accès limité ne voit ni n'écrit chez un autre site", async () => {
    const before = one("SELECT content, site_id FROM mk_page_templates WHERE name = 'Modèle Alpha'");
    const r = await boss.request("/marketing/site-web/modeles", { method: "POST", json: { name: "Modèle Alpha", category: "B", description: "", content: { ...body, sections: [{ type: "text", markdown: "Version Bravo" }] }, siteId: B }, headers: ORIGIN() });
    assert.equal(r.status, 409, String(r.text)); assert.match(String(r.text), /porte déjà ce nom/);
    const after = one("SELECT content, site_id FROM mk_page_templates WHERE name = 'Modèle Alpha'"); assert.deepEqual(after, before, "le modèle d'Alpha n'a pas bougé");
    assert.doesNotMatch(dialog((await adminB.get(`${SP}/${B}/pages`)).text), /Modèle Alpha/);
    const forged = await adminB.request("/marketing/site-web/modeles", { method: "POST", json: { name: "Intrus", content: body, siteId: A }, headers: ORIGIN() }); assert.ok([403, 404].includes(forged.status), `refusé (${forged.status})`);
    assert.equal(one("SELECT COUNT(*) n FROM mk_page_templates WHERE name = 'Intrus'").n, 0);
    const own = await adminB.request("/marketing/site-web/modeles", { method: "POST", json: { name: "Modèle de Bravo", content: body, siteId: B }, headers: ORIGIN() }); assert.equal(own.status, 201);
    const tid = one("SELECT id FROM mk_page_templates WHERE site_id = ?", A).id;
    await adminB.post(`/marketing/site-web/modeles/${tid}/supprimer`, {});
    assert.ok(one("SELECT id FROM mk_page_templates WHERE id = ?", tid), "le modèle d'Alpha existe toujours après une suppression tentée par Bravo");
  });
  test("B6 — les modèles hérités (avant l'isolation) restent communs ; la migration les a marqués", () => {
    const org = one("SELECT id FROM mk_organizations").id;
    db.prepare("INSERT INTO mk_page_templates (organization_id, site_id, shared, name, content) VALUES (?, NULL, 1, 'Hérité', ?)").run(org, JSON.stringify({ sections: body.sections }));
    return Promise.all([boss.get(`${SP}/${A}/pages`), boss.get(`${SP}/${B}/pages`), boss.get(`${PR}/pages`)]).then((rs) => rs.forEach((r) => assert.match(dialog(r.text), /Hérité/)));
  });
});
