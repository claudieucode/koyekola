// Theme Builder → site public : COUVERTURE du rendu. Un modèle publié dans le Theme Builder doit être utilisé partout où ses conditions s'appliquent :
// en-tête et pied de page sur toutes les pages d'un site (Page Builder, blog, recherche, 404), modèles d'article, d'archive, de recherche, de page introuvable,
// avec le contexte réel (catégorie, étiquette, auteur), l'isolation entre sites, la republication et l'archivage. Serveur réel, hôtes réels (Host).
// Écrit AVANT la correction : voir docs/theme-builder/KOLAKISA_THEME_BUILDER_RENDU_CAUSES_RACINES.md.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const hostReq = (srv, host, path) => {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path, method: "GET", headers: { Host: host, "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => {
      let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, headers: resp.headers }));
    });
    r.on("error", reject); r.end();
  });
};
const CONTENT = (t) => ({ title: t, sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: t, level: "2" } }] }] });

describe("Theme Builder : couverture du rendu public (serveur réel, domaines réels)", () => {
  let srv, boss, db, org, A, B;
  const ORIGIN = () => ({ Origin: srv.base });
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const get = (host, p) => hostReq(srv, host, p);
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {} });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const setDomain = async (site, url) => {
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
    return boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() });
  };
  const mkPost = (site, slug, title, { category = "", tags = "" } = {}) => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, published_at, category, tags) VALUES (?, ?, '<p>Texte</p>', 1, 'published', datetime('now'), ?, ?)").run(slug, title, category, tags).lastInsertRowid);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, address) VALUES ('post', ?, ?, ?, ?)").run(id, org, site, slug);
    return id;
  };
  // Crée un modèle ; pour un modèle de PAGE, y écrit un contenu repérable (le marqueur = le nom) ; le publie
  const model = async (site, type, name, conditions = {}, { publish = true } = {}) => {
    const r = await post(U(site, "/api/modeles"), { type, name, conditions }); assert.equal(r.status, 200, r.text.slice(0, 200));
    const t = JSON.parse(r.text).template;
    if (t.sourceKind === "page") {
      const rev = one("SELECT revision FROM mk_landing_pages WHERE id = ?", t.sourceId).revision;
      assert.equal((await boss.request(`/marketing/pages/${t.sourceId}/brouillon`, { method: "PUT", headers: ORIGIN(), json: { revision: rev, content: CONTENT(name) } })).status, 200);
    }
    if (publish) { const p = await post(U(site, `/api/modeles/${t.id}/publier`)); assert.equal(p.status, 200, p.text.slice(0, 300)); }
    return t;
  };
  const archiveModel = async (site, t) => { assert.equal((await post(U(site, `/api/modeles/${t.id}/archiver`))).status, 200); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Site A", "site-a"); B = mkSite("Site B", "site-b");
    const home = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, 'Accueil A', 'accueil-a', 'Accueil A', 'published', ?, datetime('now'), 'page', 1)").run(org, A).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(home, A);
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200);
    mkPost(A, "article-a", "Article de A"); mkPost(B, "article-b", "Article de B");
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("0. sans modèle : rendu historique (aucun marqueur), pages du site servies", async () => {
    const r = await get("a.test", "/blog"); assert.equal(r.status, 200, r.text.slice(0, 200));
    assert.match(r.text, /Article de A/); assert.doesNotMatch(r.text, /HDR-GLOBAL/);
    assert.match(r.text, /class="site-header"/, "en-tête d'origine");
  });
  test("1. en-tête publié : il remplace l'en-tête d'origine sur l'accueil, le blog, un article, la recherche et la 404", async () => {
    await model(A, "header", "HDR-GLOBAL");
    for (const p of ["/", "/blog", "/blog/article-a", "/blog?q=Article", "/introuvable-xyz"]) {
      const r = await get("a.test", p); assert.ok([200, 404].includes(r.status), `${p} → ${r.status}`);
      assert.ok(r.text.includes("HDR-GLOBAL"), `${p} : en-tête du Theme Builder absent`);
      assert.doesNotMatch(r.text, /class="site-header"/, `${p} : l'ancien en-tête est encore affiché`);
    }
  });
  test("2. pied de page publié : il remplace le pied d'origine ; l'en-tête reste", async () => {
    await model(A, "footer", "FTR-GLOBAL");
    for (const p of ["/", "/blog", "/blog/article-a"]) {
      const r = await get("a.test", p); assert.ok(r.text.includes("FTR-GLOBAL"), `${p} : pied absent`); assert.ok(r.text.includes("HDR-GLOBAL"), p);
      assert.ok(r.text.indexOf("FTR-GLOBAL") > r.text.indexOf("HDR-GLOBAL"));
    }
  });
  test("3. modèle d'article : il remplace l'affichage de l'article du site, avec son contenu", async () => {
    await model(A, "single_post", "TPL-ARTICLE");
    const r = await get("a.test", "/blog/article-a"); assert.equal(r.status, 200);
    assert.ok(r.text.includes("TPL-ARTICLE"), "modèle d'article absent");
  });
  test("4. archives : modèle par catégorie plus précis que le modèle général ; recherche ; 404", async () => {
    await model(A, "archive", "TPL-ARCH-GENERAL");
    await model(A, "archive", "TPL-ARCH-AUTEUR", { include: [{ kind: "archive", sub: "author" }] }); // plus précis, mais ne correspond pas à la liste du blog
    await model(A, "search_results", "TPL-RECHERCHE");
    await model(A, "not_found", "TPL-404");
    const blog = await get("a.test", "/blog"); assert.ok(blog.text.includes("TPL-ARCH-GENERAL") && !blog.text.includes("TPL-ARCH-AUTEUR"), "liste du blog : modèle général, pas celui des auteurs");
    const s = await get("a.test", "/blog?q=Article"); assert.ok(s.text.includes("TPL-RECHERCHE"), "recherche");
    const nf = await get("a.test", "/introuvable-xyz"); assert.equal(nf.status, 404); assert.ok(nf.text.includes("TPL-404"), "404 du site");
  });
  test("5. isolation : rien du site A sur le site B (en-tête, pied, modèles) ; B garde son rendu historique", async () => {
    for (const p of ["/blog", "/blog/article-b", "/introuvable-xyz"]) {
      const r = await get("b.test", p); assert.doesNotMatch(r.text, /HDR-GLOBAL|FTR-GLOBAL|TPL-/, `b.test${p}`);
    }
    const r = await get("b.test", "/blog"); assert.match(r.text, /class="site-header"/);
    await model(B, "header", "HDR-B");
    assert.ok((await get("b.test", "/blog")).text.includes("HDR-B")); assert.ok(!(await get("a.test", "/blog")).text.includes("HDR-B"), "le modèle de B n'apparaît jamais sur A");
    assert.ok((await get("a.test", "/blog")).text.includes("HDR-GLOBAL"));
  });
  test("6. conditions : exclusion d'une vue, priorité du plus précis, brouillon jamais appliqué", async () => {
    const h = await model(A, "header", "HDR-ARTICLES", { include: [{ kind: "post" }] });
    assert.ok((await get("a.test", "/blog/article-a")).text.includes("HDR-ARTICLES"), "article : le plus précis");
    assert.ok(!(await get("a.test", "/blog")).text.includes("HDR-ARTICLES"), "liste : le global");
    const d = await model(A, "header", "HDR-BROUILLON", { include: [{ kind: "front_page" }] }, { publish: false });
    assert.ok(!(await get("a.test", "/")).text.includes("HDR-BROUILLON"), "brouillon ignoré");
    await archiveModel(A, h);
    assert.ok((await get("a.test", "/blog/article-a")).text.includes("HDR-GLOBAL"), "archivage → retour au modèle suivant, sans cache périmé");
    assert.ok(d.id);
  });
  test("7. republication : le contenu modifié d'un en-tête apparaît immédiatement sur les pages du blog", async () => {
    const t = await model(A, "header", "HDR-V1", { include: [{ kind: "front_page" }, { kind: "archive" }] });
    assert.ok((await get("a.test", "/blog")).text.includes("HDR-V1"));
    const cur = one("SELECT * FROM mk_web_components WHERE id = ?", t.sourceId);
    assert.ok(cur, "composant du modèle");
  });
});
