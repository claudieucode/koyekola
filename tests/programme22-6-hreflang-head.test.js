// Programme 22.6 (suite) — hreflang réellement publié dans le <head> des pages du CMS : réciproque, par site, jamais pour une page non publiée / noindex / seule.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, Client } = require("./helpers");

describe("hreflang dans le head (serveur réel)", () => {
  let srv, db, boss, A, B, ids = {};
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const api = (site, p) => `/marketing/site-web/sites/${site}/contenu-seo/api${p}`;
  const link = (site, body) => boss.request(api(site, "/langues"), { method: "POST", json: body });
  const publish = (name, site, seo = {}) => {
    const sections = JSON.stringify([{ id: "sechero1", type: "hero", title: name, subtitle: "Sous-titre." }]);
    db.prepare("UPDATE mk_landing_pages SET sections = ?, draft = NULL, status = 'published', title = ?, seo = ? WHERE name = ?").run(sections, name, JSON.stringify(seo), name);
    return one("SELECT id, slug FROM mk_landing_pages WHERE name = ?", name);
  };
  const alternates = (html) => [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => [m[1], m[2]]);
  const pub = async (p) => new Client(srv.base).get(`/p/${p.slug}`);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Hl Alpha"); B = await mk("Site Hl Bravo");
    for (const [n, s] of [["Accueil fr", A], ["Home en", A], ["Home ca", A], ["Seule", A], ["Brouillon es", A], ["Autre site", B]]) await boss.post("/marketing/pages", { name: n, site_id: s, kind: "page" });
    ids.fr = publish("Accueil fr", A); ids.en = publish("Home en", A); ids.ca = publish("Home ca", A, { noindex: true }); ids.solo = publish("Seule", A); ids.other = publish("Autre site", B);
    ids.es = one("SELECT id, slug FROM mk_landing_pages WHERE name = 'Brouillon es'");
    db.prepare("UPDATE mk_landing_pages SET status = 'draft' WHERE id = ?").run(ids.es.id);
  });
  after(async () => { db.close(); await srv.stop(); });

  test("sans liaison : aucune balise hreflang", async () => {
    const r = await pub(ids.fr); assert.equal(r.status, 200); assert.deepEqual(alternates(r.text), []);
  });
  test("deux pages publiées reliées : balises réciproques avec auto-référence ; brouillon et noindex exclus", async () => {
    const k = JSON.parse((await link(A, { pageId: ids.fr.id, lang: "fr" })).text).groupKey;
    for (const [p, lang] of [[ids.en, "en"], [ids.ca, "ca"], [ids.es, "es"]]) assert.equal(JSON.parse((await link(A, { pageId: p.id, lang, groupKey: k })).text).ok !== false, true);
    const fr = alternates((await pub(ids.fr)).text), en = alternates((await pub(ids.en)).text);
    assert.deepEqual(fr.map((x) => x[0]), ["en", "fr"]); assert.deepEqual(fr, en, "réciprocité");
    assert.ok(fr.every((x) => x[1].startsWith("https://")) && fr.some((x) => x[1].includes(ids.en.slug)));
    assert.equal(fr.some((x) => x[0] === "es" || x[0] === "ca"), false, "brouillon et noindex jamais annoncés");
    assert.deepEqual(alternates((await pub(ids.ca)).text), [], "une page noindex n'émet rien");
  });
  test("page seule ou d'un autre site : rien ; une seule page publiée restante : rien", async () => {
    assert.deepEqual(alternates((await pub(ids.solo)).text), []); assert.deepEqual(alternates((await pub(ids.other)).text), []);
    db.prepare("UPDATE mk_landing_pages SET status = 'draft' WHERE id = ?").run(ids.en.id);
    assert.deepEqual(alternates((await pub(ids.fr)).text), [], "plus de réciprocité possible");
  });
  test("une page d'un autre site ne peut pas être reliée au groupe", async () => {
    const k = one("SELECT group_key FROM mk_ci_translations WHERE page_id = ?", ids.fr.id).group_key;
    const r = await link(A, { pageId: ids.other.id, lang: "de", groupKey: k }); assert.notEqual(r.status, 200);
    assert.equal(one("SELECT COUNT(*) n FROM mk_ci_translations WHERE page_id = ?", ids.other.id).n, 0);
  });
});
