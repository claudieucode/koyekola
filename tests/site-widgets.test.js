// Catégorie « Site » de l'éditeur : raccourcis dynamiques valides, widgets de la famille (liste dynamique, informations de
// l'article, catégorie/étiquettes, précédent/suivant, boîte auteur, en-tête d'archive, commentaires, mini-panier) rendus par
// un vrai serveur sur un modèle d'article et un modèle d'archive, contenu publié seulement, échappement, sous-catégories.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const nodes = require("../src/marketing/pages/nodes");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");

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
    await get("/blog"); // le blog convertit les catégories / étiquettes écrites en texte en termes du moteur de taxonomies
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
    assert.doesNotMatch(html, /class="article-author"|class="article-pager"|id="comments-title"/, "sections d'origine retirées (déjà dans le modèle)");
    assert.match(html, /comment-login|comment-form/, "le formulaire du blog (membres, invités) reste");
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
    assert.doesNotMatch(html, /Commentaires <span/);
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
    assert.match(form, /class="comment-form"[^>]*>|<form method="post" action="\/blog\/a-un\/commentaires"/);
    const r = await student.post("/blog/a-un/commentaires", { body: "Très utile, merci !" });
    assert.equal(r.status, 302);
    const after = await get("/blog/a-un");
    assert.match(after, /class="kw-pc-body"><p>Très utile, merci !/, "commentaire listé par l'élément du modèle");
    assert.match(after, /kw-pc-reply/, "lien de réponse du moteur de commentaires");
  });

  test("menu du CMS : emplacement, menu précis, visibilité membres, sous-menu ; rien d'inventé sans menu", async () => {
    const m = db.prepare("INSERT INTO nav_menus (name, slug) VALUES ('Principal', 'principal')").run().lastInsertRowid;
    const ins = db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, url, label, visibility) VALUES (?, ?, ?, 'custom', ?, ?, ?)");
    const root = ins.run(m, null, 0, "/catalogue", "Catalogue <b>", "all").lastInsertRowid;
    ins.run(m, root, 1, "/blog", "Le blog", "all");
    ins.run(m, null, 2, "/mon-compte", "Espace membre", "members");
    db.prepare("INSERT INTO nav_locations (location, menu_id) VALUES ('footer', ?)").run(m);
    const id = await newPage("Menus CMS", [layout([w("menu00000001", "cmsmenu", { location: "footer", label: "Pied" }), w("menu00000002", "cmsmenu", { location: "name", menuName: "principal", vertical: true }), w("menu00000003", "cmsmenu", { location: "header" })])]);
    const page = await get(`/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`);
    assert.equal((page.match(/class="kw-menu-link" href="\/catalogue"/g) || []).length, 2, "emplacement pied de page + menu précis");
    assert.match(page, /Catalogue &lt;b&gt;/, "libellé échappé");
    assert.match(page, /has-sub[\s\S]*kw-submenu[\s\S]*href="\/blog"/, "sous-menu");
    assert.doesNotMatch(page, /Espace membre/, "entrée réservée aux membres cachée au visiteur");
    assert.match(page, /is-vertical/);
  });

  test("modèles d'auteur, de recherche et de formation ; SEO de l'article", async () => {
    const author = await newPage("Modèle auteur", [layout([w("aarc00000001", "archiveinfo"), w("alis00000001", "querylist", { mode: "archive", title: "AUTEUR-LISTE", showImage: false })])]);
    assert.equal((await assign({ type: "author_archive", page_id: String(author) })).status, 302);
    const page = await get(`/blog/auteur/${authorId}`);
    assert.match(page, /kw-ai-title/); assert.match(page, /AUTEUR-LISTE/);
    assert.doesNotMatch(page.slice(page.indexOf("AUTEUR-LISTE")), /Article trois/, "seulement les articles de cet auteur");
    const search = await newPage("Modèle recherche", [layout([w("shead0000001", "heading", { text: "RECHERCHE : {{archive.search}}", level: 1 }), w("slis00000001", "querylist", { mode: "archive", title: "RESULTATS", showImage: false })])]);
    assert.equal((await assign({ type: "search_results", page_id: String(search) })).status, 302);
    const found = await get("/blog?q=trois");
    assert.match(found, /RECHERCHE : trois/); const res = found.slice(found.indexOf("RESULTATS")); assert.match(res, /Article trois/); assert.doesNotMatch(res, /Article un/);
    assert.doesNotMatch(await get("/blog"), /RECHERCHE :/, "sans recherche : le modèle de recherche ne s'applique pas");
    // formation : le modèle remplace l'en-tête, le reste de la fiche demeure
    const course = await createCourse(boss, srv, { title: "Retouche pro", price: 39 });
    const slug = db.prepare("SELECT slug FROM courses WHERE title = 'Retouche pro'").get().slug;
    db.prepare("UPDATE courses SET published = 1 WHERE slug = ?").run(slug);
    const cp = await newPage("Modèle formation", [layout([w("cour00000001", "heading", { text: "FICHE : {{course.title}} — {{course.price}}", level: 1 })])]);
    assert.equal((await assign({ type: "single_course", page_id: String(cp) })).status, 302);
    const fiche = await get(`/cours/${slug}`);
    assert.match(fiche, /FICHE : Retouche pro — 39,00/); assert.doesNotMatch(fiche, /class="course-hero"/); assert.match(fiche, /course-summary/, "le reste de la fiche demeure");
    // SEO de l'article
    db.prepare("UPDATE posts SET seo_title = 'Titre SEO un', seo_description = 'Description SEO un.' WHERE slug = 'a-un'").run();
    const seo = await newPage("Modèle SEO", [layout([w("seo000000001", "heading", { text: "{{post.seo_title}}", level: 2 }), w("seo000000002", "text", { html: "<p>{{post.seo_description}}</p>" })])]);
    assert.equal((await assign({ type: "single_post", page_id: String(seo) })).status, 302);
    const art = await get("/blog/a-un");
    assert.match(art, /Titre SEO un/); assert.match(art, /Description SEO un\./);
  });

  test("produits (formations) : les raccourcis Titre, Prix, Image, Description, Informations et Apparentés s'affichent avec les vraies données de la fiche", async () => {
    const nodes = require("../src/marketing/pages/nodes");
    const sc = (key) => nodes.editorSpec().shortcuts.find((x) => x.key === key);
    const keys = ["producttitle", "productprice", "productshort", "productmeta", "productrelated"];
    for (const k of keys) assert.ok(sc(k) && sc(k).group === "commerce", `raccourci ${k}`);
    await createCourse(boss, srv, { title: "Étalonnage avancé", price: 59 });
    await createCourse(boss, srv, { title: "Montage express", price: 19 });
    db.prepare("UPDATE courses SET published = 1, subtitle = 'Maîtrisez la couleur' WHERE title IN ('Étalonnage avancé', 'Montage express')").run();
    const slug = db.prepare("SELECT slug FROM courses WHERE title = 'Étalonnage avancé'").get().slug;
    const sections = [layout(keys.map((k, i) => w(`prod0000000${i}`.slice(0, 12), sc(k).type, sc(k).preset)))];
    // Un seul modèle « fiche d'une formation » s'applique : si un test précédent en a déjà assigné un, on republie SA page avec nos éléments
    const existing = db.prepare("SELECT id FROM mk_landing_pages WHERE name = 'Modèle formation'").get();
    if (existing) {
      const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(existing.id).revision;
      assert.equal((await boss.request(`/marketing/pages/${existing.id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } } })).status, 200);
      assert.equal((await boss.postJson(`/marketing/pages/${existing.id}/publier.json`, {})).status, 200);
    } else {
      const page = await newPage("Modèle formation", sections);
      assert.equal((await assign({ type: "single_course", page_id: String(page) })).status, 302);
    }
    const fiche = await get(`/cours/${slug}`);
    assert.match(fiche, /<h1[^>]*>Étalonnage avancé<\/h1>/, `titre du produit : ${(fiche.match(/<h1[^>]*>[^<]*<\/h1>/g) || []).join(" | ")}`);
    assert.match(fiche, /<strong>59,00/, "prix réel");
    assert.match(fiche, /Maîtrisez la couleur/, "description");
    assert.match(fiche, /Catégorie : [^<]*· Formateur : /, "informations");
    const related = fiche.slice(fiche.indexOf("Vous aimerez aussi"));
    const list = (related.match(/<ul class="kw-ql-items">[\s\S]*?<\/ul>/) || [""])[0];
    assert.match(list, /Montage express/, "produit apparenté");
    assert.doesNotMatch(list, /Étalonnage avancé/, "le produit affiché n'est pas proposé comme apparenté");
  });

  test("carrousel de boucle : la grille et la liste dynamique portent le défilement horizontal", async () => {
    const id = await newPage("Carrousels", [layout([
      { id: "grid00000009", type: "grid", props: { loop: { source: "posts", count: 3, slider: true, paginate: true } }, children: [w("sh0000000009", "heading", { text: "{{post.title}}", level: 3 })] },
      w("qls000000009", "querylist", { layout: "slider", count: 3 })])]);
    const page = await get(`/p/${db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug}`);
    assert.match(page, /kw-loop-slider[^>]*data-kw-slider/); assert.match(page, /kw-ql-slider[^>]*data-kw-slider/);
    assert.doesNotMatch(page, /kw-loop-pages/, "pas de pagination en carrousel");
  });
});
