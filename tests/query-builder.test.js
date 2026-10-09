// Moteur de requêtes du Page Builder (src/marketing/pages/query.js) : une description de requête validée, partagée par tous les
// éléments dynamiques. Vraie base (schéma réel), contenus publiés seulement, filtres, tris, pagination, contenu courant,
// sources extensibles, sécurité (valeurs en paramètres, tri dans une liste fermée).
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-qb-"));
process.env.DATA_DIR = path.join(dir, "data");
process.env.UPLOADS_DIR = path.join(dir, "uploads");
process.env.NODE_ENV = "test";
assert.equal(spawnSync(process.execPath, [path.join(__dirname, "..", "src", "config", "seed.js")], { env: process.env }).status, 0, "seed de la base isolée");

const db = require("../src/config/database");
const query = require("../src/marketing/pages/query");

const ctx = { db, organizationId: 1, baseUrl: "https://k.test", now: () => Date.parse("2026-10-10T12:00:00Z") };
let A, B;
const insertUser = (name, bio = "") => Number(db.prepare("INSERT INTO users (username, email, password_hash, role, bio, avatar_path) VALUES (?, ?, 'x', 'formateur', ?, ?)").run(name, `${name}@ex.fr`, bio, name === "awa" ? "/uploads/thumbnails/awa.png" : null).lastInsertRowid);
let n = 0;
function post(over = {}) {
  n += 1;
  const row = { slug: `article-${n}`, title: `Article ${n}`, excerpt: `Résumé ${n}`, content: `Contenu ${n}`, cover_path: null, published: 1, status: "published", published_at: "2026-09-01 10:00:00", updated_at: "2026-09-02 10:00:00", category: "Marketing", tags: "seo, blog", author_id: A, views: 0, deleted_at: null, comments_enabled: 1, ...over };
  const keys = Object.keys(row);
  return Number(db.prepare(`INSERT INTO posts (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`).run(...keys.map((k) => row[k])).lastInsertRowid);
}
const titles = (r) => r.items.map((i) => i.title);
const run = (q, env) => query.runQuery(ctx, q, env);

before(() => {
  db.exec("DELETE FROM blog_comments; DELETE FROM posts;");
  A = insertUser("awa", "Formatrice SEO"); B = insertUser("marc");
});

describe("contenus publiés seulement", () => {
  test("brouillon, programmé dans le futur, corbeille : jamais renvoyés", () => {
    db.exec("DELETE FROM posts;");
    post({ title: "Publié" });
    post({ title: "Brouillon", published: 0, status: "draft" });
    post({ title: "Futur", published: 0, status: "scheduled", published_at: "2027-01-01 10:00:00" });
    post({ title: "Programmé passé", published: 0, status: "scheduled", published_at: "2026-09-15 10:00:00" });
    post({ title: "Corbeille", deleted_at: "2026-10-01 10:00:00", published: 0 });
    post({ title: "Sans date", published_at: null });
    const r = run({ source: "posts", count: 24, orderby: "title", order: "asc" });
    assert.deepEqual(titles(r), ["Programmé passé", "Publié"]);
    assert.equal(r.total, 2);
  });
});

describe("normalisation (valeurs bornées, réglages inconnus ignorés)", () => {
  test("source inconnue → articles ; nombre, tri et ordre bornés ; listes nettoyées ; réglages non gérés ignorés", () => {
    const q = query.normalizeQuery({ source: "hack", count: 999, orderby: "'; DROP TABLE posts;--", order: "sideways", categories: ["  A ", "A", "", "B".repeat(200)], include: [1, "2", "x", -3, 1], dateAfter: "pas une date", withinDays: 99999, pagination: "partout" });
    assert.equal(q.source, "posts"); assert.equal(q.count, query.MAX_COUNT); assert.equal(q.orderby, "date"); assert.equal(q.order, "desc"); assert.equal(q.pagination, "none");
    assert.equal(q.categories[0], "A"); assert.equal(q.categories.length, 2); assert.equal(q.categories[1].length, 80);
    assert.deepEqual(q.include, [1, 2]); assert.equal(q.dateAfter, undefined); assert.equal(q.withinDays, undefined);
    const a = query.normalizeQuery({ source: "authors", categories: ["x"], tags: ["y"], related: "tags" });
    assert.equal(a.categories, undefined, "une source qui ne gère pas ce filtre l'ignore"); assert.equal(a.tags, undefined); assert.equal(a.related, undefined);
    assert.equal(query.normalizeQuery({ orderby: "random", pagination: "numbers" }).pagination, "none", "un tri aléatoire ne se pagine pas");
    assert.equal(query.normalizeQuery({ orderby: "title" }).order, "asc");
  });
  test("un tri ou un filtre malveillant n'atteint jamais le SQL : aucune table touchée", () => {
    db.exec("DELETE FROM posts;"); post({ title: "Seul" });
    const r = run({ orderby: "title; DROP TABLE posts", search: "%' OR 1=1 --", categories: ["x' OR '1'='1"], tags: ["a' --"] });
    assert.equal(r.items.length, 0);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM posts").get().n, 1);
  });
});

describe("articles : filtres", () => {
  before(() => {
    db.exec("DELETE FROM posts;");
    post({ title: "SEO débutant", category: "Référencement", tags: "seo, débutant", author_id: A, published_at: "2026-01-10 10:00:00", views: 50 });
    post({ title: "SEO avancé", category: "Référencement", tags: "seo, avancé", author_id: A, published_at: "2026-02-10 10:00:00", views: 300 });
    post({ title: "Blog et réseaux", category: "Marketing", tags: "blog, réseaux", author_id: B, published_at: "2026-03-10 10:00:00", views: 120 });
    post({ title: "Newsletter", category: "Marketing", tags: "email", author_id: B, published_at: "2025-12-31 10:00:00", views: 10 });
  });
  const f = (q, env) => titles(run({ count: 24, orderby: "title", order: "asc", ...q }, env));

  test("catégories (plusieurs), étiquettes (mot entier, sans tenir compte de la casse), auteur", () => {
    assert.deepEqual(f({ categories: ["référencement"] }), ["SEO avancé", "SEO débutant"]);
    assert.deepEqual(f({ categories: ["Marketing", "Référencement"] }).length, 4);
    assert.deepEqual(f({ tags: ["SEO"] }), ["SEO avancé", "SEO débutant"]);
    assert.deepEqual(f({ tags: ["se"] }), [], "« se » n'est pas l'étiquette « seo »");
    assert.deepEqual(f({ tags: ["email", "blog"] }), ["Blog et réseaux", "Newsletter"]);
    assert.deepEqual(f({ author: B }), ["Blog et réseaux", "Newsletter"]);
  });
  test("dates : après, avant, année, mois", () => {
    assert.deepEqual(f({ dateAfter: "2026-02-01" }), ["Blog et réseaux", "SEO avancé"]);
    assert.deepEqual(f({ dateBefore: "2026-01-31" }), ["Newsletter", "SEO débutant"]);
    assert.deepEqual(f({ year: 2025 }), ["Newsletter"]);
    assert.deepEqual(f({ year: 2026, month: 3 }), ["Blog et réseaux"]);
  });
  test("inclure, exclure, recherche (titre, résumé, contenu)", () => {
    const all = run({ count: 24 }).items;
    const seo = all.find((x) => x.title === "SEO avancé").id, nl = all.find((x) => x.title === "Newsletter").id;
    assert.deepEqual(f({ include: [seo, nl] }), ["Newsletter", "SEO avancé"]);
    assert.equal(f({ exclude: [seo, nl] }).length, 2);
    assert.deepEqual(f({ search: "avancé" }), ["SEO avancé"]);
    assert.deepEqual(f({ search: "100%" }), [], "les jokers de recherche sont neutralisés");
  });
  test("tris : date, titre, vues, aléatoire ; sens", () => {
    assert.deepEqual(f({ orderby: "date", order: "desc" }).slice(0, 2), ["Blog et réseaux", "SEO avancé"]);
    assert.deepEqual(f({ orderby: "views", order: "desc" }).slice(0, 2), ["SEO avancé", "Blog et réseaux"]);
    assert.equal(f({ orderby: "views", order: "asc" })[0], "Newsletter");
    assert.equal(f({ orderby: "title", order: "desc" })[0], "SEO débutant");
    assert.equal(f({ orderby: "random" }).length, 4);
  });
  test("tri par commentaires et auteur", () => {
    const id = run({ count: 24 }).items.find((x) => x.title === "Newsletter").id;
    db.prepare("INSERT INTO blog_comments (post_id, user_id, body) VALUES (?, ?, 'Bravo')").run(id, A);
    db.prepare("INSERT INTO blog_comments (post_id, user_id, body) VALUES (?, ?, 'Merci')").run(id, B);
    const r = run({ count: 24, orderby: "comments", order: "desc" });
    assert.equal(r.items[0].title, "Newsletter"); assert.equal(r.items[0].commentsCount, 2);
    assert.equal(f({ orderby: "author", order: "asc" })[0].startsWith("SEO"), true, "auteur « awa » avant « marc »");
  });
});

describe("contenu courant : articles liés, auteur courant, exclure l'actuel", () => {
  test("liés par catégorie, par étiquettes ou les deux ; l'article courant exclu", () => {
    const all = run({ count: 24 }).items;
    const cur = all.find((x) => x.title === "SEO débutant");
    const scope = { post: { id: cur.id, category: cur.category, tags: cur.tags, authorId: cur.authorId } };
    const f = (related) => titles(run({ count: 24, orderby: "title", order: "asc", related }, { scope }));
    assert.deepEqual(f("category"), ["SEO avancé"]);
    assert.deepEqual(f("tags"), ["SEO avancé"]);
    assert.deepEqual(f("both"), ["SEO avancé"]);
    assert.deepEqual(titles(run({ count: 24, orderby: "title", order: "asc", categories: ["Référencement"], excludeCurrent: true }, { scope })), ["SEO avancé"]);
    assert.equal(run({ count: 24, related: "both" }, { scope: {} }).items.length, 4, "sans article courant, « liés » ne filtre rien (aucun contexte)");
    assert.deepEqual(titles(run({ count: 24, orderby: "title", order: "asc", author: "current" }, { scope: { author: { id: B } } })), ["Blog et réseaux", "Newsletter"]);
    assert.equal(run({ count: 24, author: "current" }, { scope: {} }).items.length, 0, "auteur courant inconnu : aucun résultat (jamais tout)");
  });
});

describe("pagination", () => {
  test("pages, total, décalage ; page hors bornes ramenée dans les bornes", () => {
    const r1 = run({ count: 2, orderby: "title", order: "asc", pagination: "numbers" }, { pageNo: 1 });
    const r2 = run({ count: 2, orderby: "title", order: "asc", pagination: "numbers" }, { pageNo: 2 });
    assert.equal(r1.total, 4); assert.equal(r1.pages, 2);
    assert.deepEqual([...titles(r1), ...titles(r2)], ["Blog et réseaux", "Newsletter", "SEO avancé", "SEO débutant"]);
    assert.equal(run({ count: 2, pagination: "numbers" }, { pageNo: 9999 }).pageNo, 500);
    assert.equal(run({ count: 2, pagination: "none" }, { pageNo: 2 }).pageNo, 1, "sans pagination, toujours la première page");
    const off = run({ count: 2, offset: 1, orderby: "title", order: "asc", pagination: "numbers" }, { pageNo: 1 });
    assert.deepEqual(titles(off), ["Newsletter", "SEO avancé"]); assert.equal(off.total, 3, "le décalage retire des résultats du total");
  });
});

describe("vue d'un article", () => {
  test("auteur (nom, avatar, biographie, page), catégorie et étiquettes avec adresses, commentaires, image sûre", () => {
    db.exec("DELETE FROM posts;");
    post({ title: "Complet", category: "Études de cas", tags: "seo, cas pratique", author_id: A, cover_path: "/uploads/thumbnails/une.png", cover_alt: "", views: 7 });
    post({ title: "Image dangereuse", cover_path: "javascript:alert(1)" });
    const r = run({ count: 24, orderby: "title", order: "asc" });
    const p = r.items.find((x) => x.title === "Complet");
    assert.equal(p.url, `https://k.test/blog/${p.slug}`);
    assert.equal(p.image, "https://k.test/uploads/thumbnails/une.png"); assert.equal(p.imageAlt, "Complet", "texte alternatif : le titre à défaut");
    assert.equal(p.category, "Études de cas"); assert.equal(p.categoryUrl, "https://k.test/blog/categorie/etudes-de-cas");
    assert.deepEqual(p.tags, ["seo", "cas pratique"]);
    assert.deepEqual(p.authorView, { id: A, name: "awa", bio: "Formatrice SEO", avatar: "https://k.test/uploads/thumbnails/awa.png", url: `https://k.test/blog/auteur/${A}` });
    assert.equal(p.views, 7);
    assert.equal(r.items.find((x) => x.title === "Image dangereuse").image, "", "image non valide : jamais renvoyée");
  });
});

describe("autres sources", () => {
  test("auteurs : seulement ceux qui ont un article publié, avec leur nombre d'articles", () => {
    db.exec("DELETE FROM posts;"); post({ author_id: A }); post({ author_id: A }); post({ author_id: B, published: 0, status: "draft" });
    const r = run({ source: "authors", count: 24, orderby: "posts", order: "desc" });
    assert.deepEqual(r.items.map((a) => [a.name, a.postsCount]), [["awa", 2]]);
    assert.equal(r.items[0].url, `https://k.test/blog/auteur/${A}`);
  });
  test("catégories et étiquettes : décompte des articles publiés, adresses", () => {
    db.exec("DELETE FROM posts;");
    post({ category: "Marketing", tags: "seo, blog" }); post({ category: "marketing", tags: "SEO" }); post({ category: "Design", tags: "" }); post({ category: "Caché", published: 0, status: "draft", tags: "secret" });
    const c = run({ source: "categories", count: 24, orderby: "count", order: "desc" });
    assert.deepEqual(c.items.map((x) => [x.name.toLowerCase(), x.count]), [["marketing", 2], ["design", 1]]);
    assert.equal(c.items[0].url, "https://k.test/blog/categorie/marketing");
    const t = run({ source: "tags", count: 24, orderby: "count", order: "desc" });
    assert.deepEqual(t.items.map((x) => [x.name.toLowerCase(), x.count]), [["seo", 2], ["blog", 1]]);
    assert.ok(!JSON.stringify(t.items).includes("secret"));
  });
  test("formations : publiées seulement, filtres, prix ; formations archivées exclues", () => {
    const r = run({ source: "courses", count: 24, orderby: "title", order: "asc" });
    assert.ok(r.total >= 1 && r.items.every((c) => c.url.startsWith("/cours/") && Number.isInteger(c.priceCents)));
    assert.equal(run({ source: "courses", categories: ["inexistante"] }).items.length, 0);
  });
});

describe("extension : une nouvelle source se déclare sans toucher aux éléments", () => {
  test("registerQuerySource : validation et résultat", () => {
    assert.throws(() => query.registerQuerySource("posts", { label: "x", run() {}, scopeKey: "x", orderby: ["a"] }), /déjà déclarée/);
    assert.throws(() => query.registerQuerySource("Mauvais Nom", {}), /nom invalide/);
    assert.throws(() => query.registerQuerySource("evenements", { label: "Événements" }), /obligatoires/);
    query.registerQuerySource("evenements_essai", { label: "Événements", scopeKey: "event", orderby: ["date"], filters: ["search"], run: (c, q) => ({ total: 1, items: [{ title: `x${q.count}` }] }) });
    const r = run({ source: "evenements_essai", count: 3 });
    assert.deepEqual(r.items, [{ title: "x3" }]);
    assert.ok(query.catalog().some((s) => s.key === "evenements_essai" && s.scopeKey === "event"));
  });
  test("une source qui plante renvoie une liste vide, jamais une erreur", () => {
    query.registerQuerySource("plante_essai", { label: "Plante", scopeKey: "x", orderby: ["id"], run: () => { throw new Error("boom"); } });
    assert.deepEqual(run({ source: "plante_essai" }).items, []);
  });
});
