// Theme Builder — « Aperçu avec » un contenu réel choisi (équivalent de Preview Dynamic Content As) : liste des contenus, aperçu du modèle avec l'article choisi,
// repli sur le plus récent, refus d'un brouillon / d'un identifiant invalide, droits et absence d'écriture.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("Theme Builder : aperçu avec un contenu choisi", () => {
  let srv, boss, db, site, tpl, reader;
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  const json = (r) => JSON.parse(r.text);
  const post = (id, title, published = 1, at = "2026-01-01 10:00:00") => db.prepare("INSERT INTO posts (slug, title, content, excerpt, published, published_at) VALUES (?, ?, 'corps', 'résumé', ?, ?)").run(`s-${id}`, title, published, at).lastInsertRowid;
  const ids = {};
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); reader = await newStudent(srv);
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site aperçu" })).location.match(/sites\/(\d+)/)[1]);
    await boss.post("/marketing/pages", { name: "Accueil", site_id: site, kind: "page" });
    ids.old = post("a", "ARTICLE-ANCIEN-ZZ", 1, "2026-01-01 10:00:00");
    ids.new = post("b", "ARTICLE-RECENT-ZZ", 1, "2026-06-01 10:00:00");
    ids.draft = post("c", "ARTICLE-BROUILLON-ZZ", 0, null);
    tpl = json(await boss.request(U("/api/modeles"), { method: "POST", json: { type: "single_post", name: "Article" } })).template;
    const doc = { title: "t", sections: [{ id: "sect00000009", type: "layout", children: [{ id: "hed000000009", type: "heading", props: { text: "{{post.title}}", level: "1" } }] }] };
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(tpl.sourceId).revision;
    assert.equal((await boss.request(`/marketing/pages/${tpl.sourceId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: doc } })).status, 200);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("liste des contenus : articles publiés seulement, le plus récent d'abord ; autres types sans liste ; droits", async () => {
    const l = json(await boss.get(U("/api/contenus-apercu?type=single_post")));
    assert.deepEqual(l.items.map((i) => i.title), ["ARTICLE-RECENT-ZZ", "ARTICLE-ANCIEN-ZZ"]);
    assert.deepEqual(json(await boss.get(U("/api/contenus-apercu?type=header"))).items, []);
    assert.notEqual((await reader.get(U("/api/contenus-apercu?type=single_post"))).status, 200);
  });
  test("aperçu du modèle : plus récent par défaut, article choisi si demandé, brouillon et identifiants invalides ignorés", async () => {
    const A = `/marketing/pages/${tpl.sourceId}/apercu`;
    assert.ok((await boss.get(A)).text.includes("ARTICLE-RECENT-ZZ"));
    const chosen = (await boss.get(`${A}?contenu=${ids.old}`)).text;
    assert.ok(chosen.includes("ARTICLE-ANCIEN-ZZ") && !chosen.includes("ARTICLE-RECENT-ZZ"), "l'article choisi s'affiche");
    for (const bad of [ids.draft, 99999, "abc", "1;DROP", "-3"]) { const t = (await boss.get(`${A}?contenu=${bad}`)).text; assert.ok(t.includes("ARTICLE-RECENT-ZZ") && !t.includes("ARTICLE-BROUILLON-ZZ"), `repli pour ${bad}`); }
  });
  test("aucune écriture : le modèle reste en brouillon, même révision", async () => {
    const before = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(tpl.sourceId).revision;
    await boss.get(`/marketing/pages/${tpl.sourceId}/apercu?contenu=${ids.old}`);
    assert.equal(db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(tpl.sourceId).revision, before);
    assert.equal(json(await boss.get(U(`/api/modeles?type=single_post`))).templates[0].status, "draft");
  });
});
