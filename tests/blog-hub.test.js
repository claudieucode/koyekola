// Accueil éditorial du blog : à la une, grille, catégories, recherche, thèmes, articles populaires (vraies lectures),
// à découvrir, couvertures absentes (jamais d'image cassée), état vide, référencement préservé.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, Client } = require("./helpers");

let srv;
const anon = () => new Client(srv.base);
const run = (sql, ...a) => { const db = srv.db(); db.prepare(sql).run(...a); db.close(); };
const count = (html, re) => (html.match(re) || []).length;
const get = async (url) => (await anon().get(url)).text;

function addPost({ slug, title, category = "", excerpt = "", content = "<p>Texte.</p>", at, views = 0, featured = 0, cover = null, tags = "", minutes = null }) {
  run(`INSERT INTO posts (slug, title, excerpt, content, content_format, category, tags, published, published_at, views, featured, cover_path, reading_minutes)
       VALUES (?, ?, ?, ?, 'html', ?, ?, 1, ?, ?, ?, ?, ?)`, slug, title, excerpt, content, category, tags, at, views, featured, cover, minutes);
}

before(async () => {
  srv = await startServer();
  fs.mkdirSync(path.join(srv.dir, "uploads", "thumbnails"), { recursive: true });
  fs.writeFileSync(path.join(srv.dir, "uploads", "thumbnails", "existe.png"), "PNG");
  addPost({ slug: "guide-seo", title: "Guide du référencement naturel", category: "SEO", excerpt: "Les bases pour être trouvé.", at: "2026-09-01 10:00:00", views: 40, cover: "/uploads/thumbnails/existe.png", minutes: 6 });
  addPost({ slug: "boutique-lancer", title: "Lancer sa boutique", category: "E-commerce", excerpt: "Étapes clés.", content: "<p>Choisir un hébergeur et une passerelle de paiement.</p>", at: "2026-09-05 10:00:00", views: 12, cover: "/uploads/thumbnails/disparue.png" });
  addPost({ slug: "ia-createurs", title: "L'IA pour les créateurs", category: "IA", excerpt: "Un assistant.", at: "2026-09-10 10:00:00", featured: 1, tags: "ChatGPT, outils" });
  addPost({ slug: "palette-couleurs", title: "Choisir une palette", category: "Design", excerpt: "Harmonie des couleurs.", content: "<p>" + "mot ".repeat(690) + "</p>", at: "2026-09-12 10:00:00" });
});
after(() => srv && srv.stop());

describe("accueil éditorial du blog", () => {
  test("à la une : l'article marqué « à la une » (même s'il n'est pas le plus récent), avec catégorie, temps de lecture, date, bouton", async () => {
    const html = await get("/blog");
    const featured = html.match(/<article class="blog-featured">[\s\S]*?<\/article>/)[0];
    assert.match(featured, /L&#39;IA pour les créateurs/);
    assert.match(featured, /À la une/);
    assert.match(featured, /href="\/blog\/categorie\/ia"/);
    assert.match(featured, /min de lecture/);
    assert.match(featured, /<time datetime="2026-09-10T10:00:00Z">/);
    assert.match(featured, /class="btn btn-primary blog-featured-cta" href="\/blog\/ia-createurs"/);
    // L'article à la une n'est pas répété dans la grille ; la grille contient les 3 autres, du plus récent au plus ancien
    const grid = html.match(/<div class="blog-grid">[\s\S]*?<\/section>/)[0];
    assert.equal(count(grid, /class="blog-card"/g), 3);
    assert.doesNotMatch(grid, /ia-createurs/);
    assert.ok(grid.indexOf("palette-couleurs") < grid.indexOf("boutique-lancer") && grid.indexOf("boutique-lancer") < grid.indexOf("guide-seo"));
  });

  test("temps de lecture : celui saisi, sinon calculé (230 mots/min)", async () => {
    const html = await get("/blog");
    const card = (slug) => html.match(new RegExp(`<article class="blog-card">(?:(?!</article>)[\\s\\S])*?/blog/${slug}"[\\s\\S]*?</article>`))[0];
    assert.match(card("guide-seo"), /6 min de lecture/);
    assert.match(card("palette-couleurs"), /3 min de lecture/);
  });

  test("couvertures : image affichée si le fichier existe ; sinon visuel du thème (aucune balise image cassée)", async () => {
    const html = await get("/blog");
    assert.match(html, /<img src="\/uploads\/thumbnails\/existe\.png"/);
    assert.doesNotMatch(html, /disparue\.png/);
    assert.ok(count(html, /class="blog-cover-empty"/g) >= 2);
  });

  test("catégories : liens réels, état actif ; un clic filtre réellement", async () => {
    const html = await get("/blog");
    assert.match(html, /<nav class="blog-cats" aria-label="Catégories du blog">/);
    assert.match(html, /<a href="\/blog" aria-current="page">Tous<\/a>/);
    for (const slug of ["seo", "e-commerce", "ia", "design"]) assert.match(html, new RegExp(`href="/blog/categorie/${slug}"`));
    const seo = await get("/blog/categorie/seo");
    assert.match(seo, /<a href="\/blog\/categorie\/seo" aria-current="page">SEO/);
    assert.equal(count(seo, /class="blog-card"/g), 1);
    assert.match(seo, /guide-seo/);
    assert.doesNotMatch(seo, /class="blog-featured"/);
  });

  test("explorer par thème : une carte par catégorie, icône du registre, description, nombre d'articles, lien vers la catégorie", async () => {
    const html = await get("/blog");
    const themes = html.match(/<ul class="blog-themes">[\s\S]*?<\/ul>/)[0];
    assert.equal(count(themes, /class="blog-theme"/g), 4);
    assert.match(themes, /href="\/blog\/categorie\/e-commerce"[\s\S]*?<svg class="icon[\s\S]*?E-commerce[\s\S]*?boutique en ligne[\s\S]*?1 article/);
    assert.doesNotMatch(themes, /[\u{1F300}-\u{1FAFF}]/u, "aucun emoji utilisé comme icône");
  });

  test("articles populaires : classés par vraies lectures, sans aucun nombre de vues affiché ; masqués sans lectures", async () => {
    const html = await get("/blog");
    const pop = html.match(/<ol class="blog-ranking">[\s\S]*?<\/ol>/)[0];
    assert.ok(pop.indexOf("guide-seo") < pop.indexOf("boutique-lancer"));
    assert.doesNotMatch(pop, /palette-couleurs|ia-createurs/, "aucune lecture : pas dans le classement");
    assert.match(pop, /<span class="blog-rank" aria-hidden="true">01<\/span>/);
    assert.doesNotMatch(pop, /vues|lectures/i);
    run("UPDATE posts SET views = 0");
    assert.doesNotMatch(await get("/blog"), /Les articles populaires/);
    run("UPDATE posts SET views = 40 WHERE slug = 'guide-seo'");
    run("UPDATE posts SET views = 12 WHERE slug = 'boutique-lancer'");
  });

  test("à découvrir : article publié qui n'est pas déjà affiché, sinon les formations (vrai nombre), sinon rien", async () => {
    // Les 4 articles sont tous déjà affichés : pas de formation publiée → pas de section
    assert.doesNotMatch(await get("/blog"), /À découvrir/);
  });

  test("recherche : titre, extrait, catégorie, étiquettes, contenu ; sans accents ; non indexée ; dans une catégorie", async () => {
    const cases = { "referencement": "guide-seo", "Étapes clés": "boutique-lancer", "e-commerce": "boutique-lancer", "chatgpt": "ia-createurs", "passerelle paiement": "boutique-lancer" };
    for (const [q, slug] of Object.entries(cases)) {
      const html = await get(`/blog?q=${encodeURIComponent(q)}`);
      assert.match(html, new RegExp(`/blog/${slug}"`), q);
      assert.match(html, /<meta name="robots" content="noindex, follow">/, q);
      assert.match(html, /<strong>1<\/strong> article trouvé/, q);
      assert.doesNotMatch(html, /class="blog-featured"|Explorer par thème/, q);
    }
    assert.match(await get("/blog/categorie/seo?q=boutique"), /Aucun article trouvé/);
    const seoQ = await get("/blog/categorie/seo?q=naturel");
    assert.match(seoQ, /guide-seo/);
    assert.match(seoQ, /<form class="blog-search" action="\/blog\/categorie\/seo"/);
  });

  test("aucun résultat : état vide (icône, message, bouton « Voir tous les articles » vers /blog) ; texte saisi échappé", async () => {
    const html = await get(`/blog?q=${encodeURIComponent('zzz <script>alert(1)</script>')}`);
    assert.match(html, /<div class="blog-empty" role="status">[\s\S]*<svg class="icon[\s\S]*Aucun article trouvé[\s\S]*<a class="btn btn-outline" href="\/blog">Voir tous les articles<\/a>/);
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  });

  test("référencement préservé : canonical /blog, données structurées avec l'article à la une, adresses des articles", async () => {
    const html = await get("/blog");
    assert.match(html, /<link rel="canonical" href="[^"]+\/blog">/);
    assert.doesNotMatch(html, /noindex/);
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("");
    assert.match(ld, /\/blog\/ia-createurs/);
    assert.match(ld, /\/blog\/guide-seo/);
    assert.match(html, /<h1>Blog<\/h1>/);
    for (const slug of ["guide-seo", "ia-createurs"]) assert.equal((await anon().get(`/blog/${slug}`)).status, 200);
  });
});
