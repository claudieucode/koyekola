// Programme 20.3 — exclusions, modification et droits des modèles de thème, par les vraies routes d'un vrai serveur,
// avec contrôle du rendu public (article exclu = affichage d'origine, article non exclu = modèle).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const idFrom = (location) => Number(location.match(/(\d+)(#.*)?$/)[1]);

describe("Theme Builder 20.3 (vrai serveur)", () => {
  let srv, boss, db, reader, tplPage;
  const json = (who, method, path, body) => who.request(path, { method, json: body || {}, headers: { Origin: srv.base } });
  const read = () => { const r = db.prepare("SELECT value FROM mk_settings WHERE key = 'theme.templates'").get(); return r ? JSON.parse(r.value) : []; };
  const html = async (path) => (await new Client(srv.base).get(path, { headers: UA })).text;
  const url = "/marketing/site-web/modeles-de-theme";

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
    reader = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'viewer')").run(reader.email);
    for (const [slug, cat] of [["art-conseils", "Conseils"], ["art-actu", "Actualités"]]) {
      db.prepare("INSERT INTO posts (slug, title, excerpt, content, content_format, category, published, published_at, status, comments_enabled) VALUES (?, ?, 'Résumé.', '<p>Texte réel.</p>', 'html', ?, 1, datetime('now', '-1 hour'), 'published', 1)").run(slug, `Article ${cat}`, cat);
    }
    tplPage = idFrom((await boss.post("/marketing/pages", { name: "Modèle 20.3" })).location);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(tplPage).revision;
    await json(boss, "PUT", `/marketing/pages/${tplPage}/brouillon`, { revision: rev, content: { sections: [{ id: "sect00000003", type: "layout", children: [{ id: "cont00000003", type: "container", children: [{ id: "head00000003", type: "heading", props: { text: "TPL203 {{post.title}}", level: 1 } }, { id: "post00000003", type: "postcontent", props: {} }] }] }] } });
    await json(boss, "POST", `/marketing/pages/${tplPage}/publier.json`, {});
  });
  after(() => srv.stop());

  test("modèle général + catégorie exclue : le modèle s'applique aux autres articles, pas à la catégorie exclue", async () => {
    const r = await boss.post(url, { type: "single_post", page_id: String(tplPage), exclude_category: "Actualités" });
    assert.equal(r.status, 302);
    assert.equal(read().length, 1);
    assert.deepEqual(read()[0].exclude, { category: ["Actualités"] });
    assert.match(await html("/blog/art-conseils"), /TPL203 Article Conseils/);
    assert.doesNotMatch(await html("/blog/art-actu"), /TPL203/, "article exclu : affichage d'origine");
    assert.match(await html("/blog/art-actu"), /Article Actualités/, "l'article exclu reste lisible");
  });

  test("modification des conditions : l'identifiant est conservé, le rendu public suit", async () => {
    const id = read()[0].id;
    const r = await boss.post(`${url}/${id}/modifier`, { page_id: String(tplPage), exclude_category: "Conseils" });
    assert.equal(r.status, 302);
    assert.equal(read().length, 1);
    assert.equal(read()[0].id, id);
    assert.doesNotMatch(await html("/blog/art-conseils"), /TPL203/);
    assert.match(await html("/blog/art-actu"), /TPL203 Article Actualités/);
  });

  test("droits côté serveur : un lecteur ne peut ni ajouter ni modifier ; l'écran reste lisible", async () => {
    const before = JSON.stringify(read());
    assert.equal((await reader.post(url, { type: "not_found", page_id: String(tplPage) })).status, 403);
    assert.equal((await reader.post(`${url}/${read()[0].id}/modifier`, { exclude_category: "" })).status, 403);
    assert.equal(JSON.stringify(read()), before);
    assert.equal((await reader.get(url)).status, 200);
  });

  test("anonyme : aucune écriture possible, aucune donnée de l'écran", async () => {
    const anon = new Client(srv.base);
    const r = await anon.post(url, { type: "not_found", page_id: String(tplPage) });
    assert.notEqual(r.status, 200);
    assert.equal(read().length, 1);
    const g = await anon.get(url);
    assert.doesNotMatch(g.text, /Modèle 20\.3/);
  });

  test("identifiants hostiles : modèle inexistant, page d'un autre contexte, article inexistant", async () => {
    const n = read().length;
    await boss.post(`${url}/ffffffff/modifier`, { exclude_category: "" });
    await boss.post(url, { type: "single_post", page_id: "999999" });
    await boss.post(url, { type: "single_post", page_id: String(tplPage), exclude_post: "999999" });
    await boss.post(url, { type: "single_post", page_id: String(tplPage), exclude_post: "1;DROP TABLE posts" });
    assert.equal(read().length, n, "aucune écriture");
    assert.ok(db.prepare("SELECT COUNT(*) n FROM posts").get().n >= 2, "table intacte");
  });

  test("brouillon : une page repassée en brouillon n'est plus utilisée publiquement", async () => {
    db.prepare("UPDATE mk_landing_pages SET status = 'draft' WHERE id = ?").run(tplPage);
    assert.doesNotMatch(await html("/blog/art-actu"), /TPL203/);
    db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(tplPage);
    assert.match(await html("/blog/art-actu"), /TPL203/);
  });
});
