// Catégorie « Site » de l'éditeur : raccourcis dynamiques valides, widgets de la famille (liste dynamique, informations de
// l'article, catégorie/étiquettes, précédent/suivant, boîte auteur, en-tête d'archive, commentaires, mini-panier) rendus par
// un vrai serveur sur un modèle d'article et un modèle d'archive, contenu publié seulement, échappement, sous-catégories.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const nodes = require("../src/marketing/pages/nodes");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";
const layout = (children) => ({ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children }] });
const w = (id, type, props = {}) => ({ id, type, props });

describe("catégorie Site (sans serveur)", () => {
  test("sous-catégories déclarées, chaque raccourci de la catégorie a une sous-catégorie et un type connu", () => {
    const spec = nodes.editorSpec();
    assert.ok(spec.siteSubs.length >= 4);
    const types = new Set(spec.types.map((t) => t.type));
    for (const s of spec.shortcuts.filter((x) => x.group === "site")) {
      assert.ok(spec.siteSubs.includes(s.sub), `sous-catégorie de ${s.key}`);
      assert.ok(types.has(s.type), `type de ${s.key}`);
    }
    for (const t of ["querylist", "postmeta", "postterms", "postnav", "authorbox", "archiveinfo", "postcomments", "minicart"]) assert.ok(types.has(t), t);
  });
  test("réglages des widgets : valeurs hors liste ramenées à la valeur par défaut", () => {
    const def = nodes.CUSTOM_WIDGETS.querylist;
    assert.ok(def.data, "chargement des données");
    assert.equal(def.schema.find((f) => f.key === "source").options.length, 6);
  });
});

describe("vrai serveur : widgets du site", () => {
  let srv, boss, db, authorId;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db();
    authorId = db.prepare("SELECT id FROM users WHERE role = 'formateur' ORDER BY id LIMIT 1").get().id;
    db.prepare("UPDATE users SET bio = 'Formatrice <b>passionnée</b>.' WHERE id = ?").run(authorId);
    const ins = db.prepare("INSERT INTO posts (slug, title, excerpt, content, content_format, category, tags, author_id, views, published, published_at, status, comments_enabled) VALUES (?, ?, 'Résumé.', '<p>Texte.</p>', 'html', ?, ?, ?, ?, 1, datetime('now', ?), 'published', 1)");
    ins.run("a-un", "Article un", "Conseils", "photo, lumière", authorId, 5, "-4 days");
    ins.run("a-deux", "Article <i>deux</i>", "Conseils", "photo", authorId, 50, "-3 days");
    ins.run("a-trois", "Article trois", "Actus", "vidéo", null, 20, "-2 days");
    db.prepare("INSERT INTO posts (slug, title, published, status) VALUES ('secret', 'Brouillon secret', 0, 'draft')").run();
    db.prepare("INSERT INTO posts (slug, title, category, published, published_at, status, comments_enabled) VALUES ('ferme', 'Commentaires fermés', 'Conseils', 1, datetime('now', '-1 days'), 'published', 0)").run();
  });
  after(() => srv.stop());
  const newPage = async (name, sections) => {
    const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    const r = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } } });
    assert.equal(r.status, 200, await r.text);
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    return id;
  };
  const assign = (fields) => boss.post("/marketing/site-web/modeles-de-theme", fields);
  const anon = () => new Client(srv.base);
  const get = (path, client = anon()) => client.get(path, { headers: { "User-Agent": UA } }).then((r) => r.text);

  test("tous les raccourcis dynamiques sont acceptés par le serveur (validation réelle)", async () => {
    const shortcuts = nodes.editorSpec().shortcuts.filter((s) => s.group === "site" && s.preset);
    assert.ok(shortcuts.length >= 25);
    const children = shortcuts.map((s, i) => w(`sc${String(i).padStart(10, "0")}`, s.type, JSON.parse(JSON.stringify(s.preset))));
    await newPage("Tous les raccourcis", [layout(children)]);
  });

  test("modèle d'article : informations, termes, boîte auteur, précédent/suivant, commentaires, liste liée", async () => {
    const id = await newPage("Modèle article site", [layout([
      w("meta00000001", "postmeta"), w("term00000001", "postterms", { label: "Dans :" }), w("body00000001", "postcontent"),
      w("auth00000001", "authorbox"), w("navi00000001", "postnav"), w("comm00000001", "postcomments"),
      w("list00000001", "querylist", { title: "À lire aussi", mode: "related", count: 5 }), w("cart00000001", "minicart", { label: "Panier" }),
    ])]);
    assert.equal((await assign({ type: "single_post", page_id: String(id) })).status, 302);
    const html = await get("/blog/a-deux");
    assert.match(html, /data-part="category">Conseils</, "informations de l'article");
    assert.match(html, /class="kw-pt-term" data-kind="category" href="\/blog\/categorie\/conseils"/, "catégorie liée");
    assert.match(html, /data-kind="tag" href="\/blog\/etiquette\/photo">#photo/, "étiquette liée");
    assert.match(html, /kw-ab-name">/, "boîte auteur"); assert.match(html, /Formatrice &lt;b&gt;passionnée/, "bio échappée");
    assert.match(html, /kw-pn-prev"[^>]*href="\/blog\/a-un"|href="\/blog\/a-un"[^>]*kw-pn-prev/, "article précédent");
    assert.match(html, /kw-pn-next/, "article suivant");
    assert.match(html, /kw-pc-heading/, "commentaires du modèle");
    assert.equal((html.match(/id="commentaires"/g) || []).length, 1, "pas de doublon avec les commentaires du blog");
    assert.doesNotMatch(html, /class="article-author"|class="article-pager"|class="article-comments"/, "sections d'origine retirées (déjà dans le modèle)");
    assert.match(html, /Connectez-vous pour laisser un commentaire/);
    // liste « articles liés » : même catégorie ou étiquette, jamais l'article courant ni un brouillon
    const list = html.slice(html.indexOf("À lire aussi"));
    assert.match(list, /Article un/); assert.doesNotMatch(list, /Brouillon secret/);
    assert.doesNotMatch(list.split("</section>")[0], /Article &lt;i&gt;deux/, "l'article courant est exclu");
    assert.match(html, /kw-minicart/);
    // titre échappé dans le modèle (jamais de HTML venu des données)
    assert.doesNotMatch(html, /<i>deux<\/i>/);
  });

  test("commentaires fermés : aucun formulaire ; l'élément reste sage sans article (page ordinaire)", async () => {
    const html = await get("/blog/ferme");
    assert.doesNotMatch(html, /kw-pc-form/);
    const id = await newPage("Page ordinaire", [layout([w("meta00000002", "postmeta"), w("comm00000002", "postcomments"), w("list00000002", "querylist", { mode: "related" }), w("nav000000002", "postnav")])]);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const page = await get(`/p/${slug}`);
    assert.doesNotMatch(page, /kw-pm-item|kw-pc-form|kw-pn-link/, "rien d'inventé hors d'un article");
    assert.doesNotMatch(page, /Article un/, "« liés » sans article courant : aucun résultat");
  });

  test("liste dynamique : populaires, catégories, étiquettes, auteurs ; publié seulement", async () => {
    const id = await newPage("Listes", [layout([
      w("pop000000001", "querylist", { title: "POP", mode: "popular", count: 2, showImage: false }),
      w("cat000000001", "querylist", { title: "CATS", source: "categories", layout: "compact" }),
      w("tag000000001", "querylist", { title: "TAGS", source: "tags", layout: "inline" }),
      w("aut000000001", "querylist", { title: "AUTEURS", source: "authors" }),
    ])]);
    const page = await get(`/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`);
    const part = (t) => page.slice(page.indexOf(`>${t}<`), page.indexOf("</section>", page.indexOf(`>${t}<`)));
    const pop = part("POP");
    assert.ok(pop.indexOf("deux") < pop.indexOf("Article trois"), "les plus lus d'abord"); assert.doesNotMatch(pop, /Article un/, "2 éléments seulement");
    assert.match(part("CATS"), /Conseils[\s\S]*\(3\)/); assert.match(part("CATS"), /href="\/blog\/categorie\/actus"/);
    assert.match(part("TAGS"), /photo/); assert.match(part("TAGS"), /href="\/blog\/etiquette\/photo"/);
    assert.match(part("AUTEURS"), /href="\/blog\/auteur\/\d+"/);
    assert.doesNotMatch(page, /Brouillon secret/);
  });

  test("archives : en-tête, liste qui suit l'archive, recherche", async () => {
    const id = await newPage("Modèle archive", [layout([
      w("arch00000001", "archiveinfo"),
      w("arlist0000001", "querylist", { title: "DANS L'ARCHIVE", mode: "archive", count: 10, showImage: false }),
    ])]);
    assert.equal((await assign({ type: "blog_archive", page_id: String(id) })).status, 302);
    const cat = await get("/blog/categorie/actus");
    assert.match(cat, /kw-ai-title">Actus</); assert.match(cat, /Article trois/); assert.doesNotMatch(cat.slice(cat.indexOf("DANS L")), /Article un/, "seulement la catégorie");
    const tag = await get("/blog/etiquette/photo");
    assert.match(tag.slice(tag.indexOf("DANS L")), /Article un/); assert.doesNotMatch(tag.slice(tag.indexOf("DANS L")), /Article trois/);
    const home = await get("/blog");
    assert.match(home.slice(home.indexOf("DANS L")), /Article trois/, "hors archive : tous les articles");
  });

  test("commentaire publié depuis le widget : route existante du blog, affiché ensuite", async () => {
    const student = await newStudent(srv);
    const form = await get("/blog/a-un", student);
    assert.match(form, /class="kw-pc-form" method="post" action="\/blog\/a-un\/commentaires"/);
    const r = await student.post("/blog/a-un/commentaires", { body: "Très utile, merci !" });
    assert.equal(r.status, 302);
    assert.match(await get("/blog/a-un"), /Très utile, merci !/);
  });
});
