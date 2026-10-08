// Éditeur de pages — MODÈLES DE THÈME : une page du Page Builder remplace l'en-tête + le texte de l'article du blog, la liste du
// blog ou la page introuvable ; conditions (catégorie, public) ; sans modèle EN LIGNE, l'affichage d'origine reste ; un modèle
// ne casse ni le sommaire, ni les commentaires, ni le SEO de l'article.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const themeTemplates = require("../src/marketing/pages/themeTemplates");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";
const layout = (children) => ({ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children }] });

describe("modèles de thème (sans serveur)", () => {
  test("types connus, textes d'aide, aucune dépendance cachée", () => {
    assert.deepEqual(Object.keys(themeTemplates.TYPES), ["single_post", "blog_archive", "not_found"]);
    for (const t of Object.values(themeTemplates.TYPES)) assert.ok(t.label && t.hint);
  });
});

describe("vrai serveur : blog et 404", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const newPage = async (name, sections, publish = true) => {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } } })).status, 200);
    if (publish) assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    return id;
  };
  const assign = (fields) => boss.post("/marketing/site-web/modeles-de-theme", fields);
  const anon = () => new Client(srv.base);
  const get = (path, client = anon()) => client.get(path, { headers: { "User-Agent": UA } }).then((r) => r.text);
  const read = () => JSON.parse(db.prepare("SELECT value FROM mk_settings WHERE key = 'theme.templates'").get().value);

  test("article : modèle appliqué (titre, données, texte de l'article), reste du blog intact ; sans modèle en ligne : affichage d'origine", async () => {
    db.prepare("INSERT INTO posts (slug, title, excerpt, content, content_format, category, published, published_at, status, comments_enabled) VALUES ('bien-demarrer', 'Bien démarrer', 'Le résumé.', '<h2>Première partie</h2><p>Contenu VRAI de l''article.</p><h2>Seconde partie</h2><p>Suite.</p>', 'html', 'Conseils', 1, datetime('now', '-1 hour'), 'published', 1)").run();
    const before = await get("/blog/bien-demarrer");
    assert.match(before, /<h1 class="post-title">Bien démarrer<\/h1>/, "affichage d'origine");
    const id = await newPage("Modèle article", [layout([
      { id: "head00000001", type: "heading", props: { text: "MODELE : {{post.title}} ({{post.category}})", level: 1 } },
      { id: "text00000001", type: "text", props: { html: "<p>par {{post.author | fallback: l'équipe}} · {{post.reading_time}}</p>" } },
      { id: "post00000001", type: "postcontent", props: {} },
    ])], false);
    // brouillon : refusé comme modèle actif (non publié) → aucun effet
    assert.equal((await assign({ type: "single_post", page_id: String(id) })).status, 302);
    assert.doesNotMatch(await get("/blog/bien-demarrer"), /MODELE :/, "page non publiée : le blog garde son affichage");
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    const html = await get("/blog/bien-demarrer");
    assert.match(html, /MODELE : Bien démarrer \(Conseils\)/);
    assert.match(html, /par Prof · \d+ min/, "auteur et temps de lecture du blog");
    assert.match(html, /Contenu VRAI de l(?:'|&#39;)article/, "l'élément « Contenu de l'article » affiche le vrai texte");
    assert.match(html, /<h2[^>]*>Première partie/);
    assert.doesNotMatch(html, /<h1 class="post-title">/, "l'en-tête d'origine est remplacé");
    assert.match(html, /id="commentaires"/, "commentaires du blog conservés");
    assert.match(html, /"@type":"BlogPosting"/, "données structurées de l'article conservées");
    assert.match(html, /<link rel="canonical"/);
    assert.match(html, /article-pager|article-author|article-final-cta|article-comments/, "reste de la page de l'article conservé");
    // retrait → affichage d'origine
    const tid = read()[0].id;
    assert.equal((await boss.post(`/marketing/site-web/modeles-de-theme/${tid}/supprimer`, {})).status, 302);
    assert.match(await get("/blog/bien-demarrer"), /<h1 class="post-title">Bien démarrer<\/h1>/);
  });

  test("conditions : catégorie et public ; le modèle le plus précis gagne ; doublon refusé", async () => {
    db.prepare("INSERT INTO posts (slug, title, content, content_format, category, published, published_at, status) VALUES ('autre', 'Un autre', '<p>Texte autre.</p>', 'html', 'Actus', 1, datetime('now', '-2 hour'), 'published')").run();
    const general = await newPage("Modèle général", [layout([{ id: "head00000002", type: "heading", props: { text: "GENERAL {{post.title}}", level: 1 } }, { id: "post00000002", type: "postcontent", props: {} }])]);
    const conseils = await newPage("Modèle conseils", [layout([{ id: "head00000003", type: "heading", props: { text: "CONSEILS {{post.title}}", level: 1 } }, { id: "post00000003", type: "postcontent", props: {} }])]);
    const membres = await newPage("Modèle membres", [layout([{ id: "head00000004", type: "heading", props: { text: "MEMBRES {{post.title}}", level: 1 } }, { id: "post00000004", type: "postcontent", props: {} }])]);
    await assign({ type: "single_post", page_id: String(general) });
    await assign({ type: "single_post", page_id: String(conseils), category: "Conseils" });
    const dup = await assign({ type: "single_post", page_id: String(conseils), category: "conseils" });
    assert.equal(dup.status, 302);
    assert.equal(read().length, 2, "doublon (même type, même catégorie, même public) refusé");
    assert.match(await get("/blog/bien-demarrer"), /CONSEILS Bien démarrer/, "catégorie précise gagne");
    assert.match(await get("/blog/autre"), /GENERAL Un autre/, "autre catégorie : modèle général");
    // public : élèves connectés seulement
    await assign({ type: "single_post", page_id: String(membres), audience: "student" });
    assert.match(await get("/blog/autre"), /GENERAL Un autre/, "visiteur non connecté : pas le modèle des membres");
    const student = await newStudent(srv);
    assert.match(await get("/blog/autre", student), /MEMBRES Un autre/, "élève connecté : modèle des membres");
    for (const t of read()) await boss.post(`/marketing/site-web/modeles-de-theme/${t.id}/supprimer`, {});
    assert.equal(read().length, 0);
  });

  test("liste du blog (boucle + catégorie) et page introuvable (404)", async () => {
    const list = await newPage("Modèle liste", [layout([
      { id: "head00000010", type: "heading", props: { text: "LISTE {{query.categorie | fallback: tous}}", level: 1 } },
      { id: "grid00000010", type: "grid", props: { loop: { source: "posts", count: 6, urlFilter: true } }, children: [{ id: "card00000010", type: "container", children: [{ id: "head00000011", type: "heading", props: { text: "• {{post.title}}", level: 3 } }] }] },
    ])]);
    await assign({ type: "blog_archive", page_id: String(list) });
    const hub = await get("/blog");
    assert.match(hub, /LISTE tous/); assert.match(hub, /• Bien démarrer/); assert.match(hub, /• Un autre/);
    const cat = await get("/blog/categorie/conseils");
    assert.match(cat, /LISTE Conseils/); assert.match(cat, /• Bien démarrer/); assert.doesNotMatch(cat, /• Un autre/, "filtré par la catégorie courante");
    assert.match(cat, /blog-search|blog-cats/, "recherche et catégories du blog conservées");
    const nf = await newPage("Modèle 404", [layout([{ id: "head00000020", type: "heading", props: { text: "ICI RIEN {{page.title}}", level: 1 } }])]);
    assert.match(await get("/cette-page-nexiste-pas"), /Page introuvable|Oups/, "avant : page d'erreur d'origine");
    await assign({ type: "not_found", page_id: String(nf) });
    const res = await anon().get("/cette-page-nexiste-pas", { headers: { "User-Agent": UA } });
    assert.equal(res.status, 404, "le statut reste 404");
    assert.match(res.text, /ICI RIEN Modèle 404/);
    // un 404 précis (article introuvable) garde son message d'origine
    assert.match(await get("/blog/introuvable-xyz"), /Article introuvable/);
  });

  test("écran d'administration : liste, droits, page supprimée", async () => {
    const html = await get("/marketing/site-web/modeles-de-theme", boss);
    assert.match(html, /Modèles de thème/); assert.match(html, /Liste du blog/); assert.match(html, /Page introuvable/);
    assert.equal((await anon().get("/marketing/site-web/modeles-de-theme")).status, 302, "réservé aux comptes connectés");
    const tpl = read().find((t) => t.type === "blog_archive");
    db.prepare("DELETE FROM mk_landing_pages WHERE id = ?").run(tpl.pageId);
    assert.match(await get("/marketing/site-web/modeles-de-theme", boss), /Page supprimée/);
    assert.match(await get("/blog"), /Blog/, "page modèle supprimée : le blog reprend son affichage d'origine");
  });
});
