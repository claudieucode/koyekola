// Personnalisation ciblée (22.11) : une modification LOCALE (style d'un élément de page) n'écrit que la règle de CET élément ; elle ne touche ni l'autre élément de même nature,
// ni les jetons du site, ni la page identique d'un AUTRE site. Vrai serveur, rendu public réel.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, Client } = require("./helpers");

const sections = (color) => [{ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children: [
  { id: "head00000001", type: "heading", props: { text: "Premier titre", level: 2 }, ...(color ? { styles: { desktop: { color } } } : {}) },
  { id: "head00000002", type: "heading", props: { text: "Second titre", level: 2 } },
] }] }];

describe("personnalisation ciblée (portée locale)", () => {
  let srv, db, anon, A, B, pageA, pageB, orgId;
  const html = async (slug) => (await anon.get(`/p/${slug}`)).text;
  const setSections = (id, s) => db.prepare("UPDATE mk_landing_pages SET sections = ? WHERE id = ?").run(JSON.stringify(s), id);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
    const mkSite = (n, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, slug).lastInsertRowid);
    const mkPage = (site, slug) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, 'Accueil', ?, 'published', 'page', ?, datetime('now'))").run(orgId, `Accueil ${slug}`, slug, JSON.stringify(sections()), site).lastInsertRowid);
    A = mkSite("Alpha", "alpha"); B = mkSite("Beta", "beta");
    pageA = mkPage(A, "accueil-alpha"); pageB = mkPage(B, "accueil-beta");
  });
  after(async () => { db.close(); await srv.stop(); });

  test("le style local d'un titre ne produit une règle que pour lui", async () => {
    const avant = await html("accueil-alpha");
    assert.ok(!/#aa3300/i.test(avant));
    setSections(pageA, sections("#aa3300"));
    const apres = await html("accueil-alpha");
    assert.match(apres, /\.kw-n-head00000001\s*\{[^}]*#aa3300/i, "la règle locale existe pour l'élément modifié");
    assert.ok(!/\.kw-n-head00000002\s*\{[^}]*#aa3300/i.test(apres), "l'autre titre n'est pas touché");
    assert.equal((apres.match(/#aa3300/gi) || []).length, (apres.match(/\.kw-n-head00000001[^{]*\{[^}]*#aa3300/gi) || []).length, "la couleur n'apparaît nulle part ailleurs (jetons, sélecteurs génériques)");
  });

  test("la même page d'un autre site reste strictement identique", async () => {
    const b1 = await html("accueil-beta");
    setSections(pageA, sections("#112233"));
    const b2 = await html("accueil-beta");
    assert.equal(b2, b1, "le HTML et le CSS du site Beta ne changent pas quand Alpha est modifié");
    assert.ok(!/#112233/i.test(b2));
  });

  test("retirer le style local rétablit l'état initial de l'élément", async () => {
    setSections(pageA, sections(null));
    assert.ok(!/#112233|#aa3300/i.test(await html("accueil-alpha")));
  });
});
