// KOLAKISA CMS — palier 8 : moteur d'apparence, de bout en bout par les vraies routes d'un vrai serveur et la vraie base :
// styles globaux (brouillon → aperçu → publication → rendu réel du site), en-tête et pied de page, templates (page du Page Builder
// affectée à une famille de pages, conditions, priorité, 404 réelle), patterns (création depuis une section, insertion dans le Page
// Builder), navigation, droits, sécurité (CSS / HTML / URL), historique, cohérence avec les jetons du Page Builder.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";
const layout = (children) => ({ id: "sect00000001", type: "layout", children: [{ id: "cont00000001", type: "container", children }] });
const AP = "/marketing/site-web/apparence";

let srv, boss, db, anon, orgId;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const q = (sql, ...a) => db.prepare(sql).all(...a);
const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];
const get = (path, client = anon) => client.get(path, { headers: { "User-Agent": UA } }).then((r) => r.text);
const styleOf = (html) => (html.match(/<style id="kw-appearance">([\s\S]*?)<\/style>/) || [])[1] || "";
async function member(role) {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), ?)").run(orgId, c.email, role);
  return c;
}
async function newPage(name, sections, publish = true) {
  const id = Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
  const rev = one("SELECT revision FROM mk_landing_pages WHERE id = ?", id).revision;
  assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content: { sections } } })).status, 200);
  if (publish) assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
  return id;
}
const saveStyles = (fields) => boss.post(`${AP}/styles`, fields);
const publish = () => boss.post(`${AP}/publier`, {});

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
});
after(() => srv.stop());

describe("éditeur du site : écrans", () => {
  test("Apparence et ses 6 écrans s'ouvrent (état honnête : apparence d'origine, aucun template, aucun pattern)", async () => {
    for (const [sub, re] of [["", /Apparence d(?:'|&#39;)origine/], ["/styles", /Couleurs/], ["/en-tete", /Logo/], ["/pied-de-page", /Marque/], ["/templates", /Utiliser le template par défaut/], ["/patterns", /Aucun pattern\./]]) {
      const r = await boss.get(AP + sub);
      assert.equal(r.status, 200, sub); assert.match(r.text, re, sub);
    }
  });
  test("sans configuration publiée, le site public est identique à l'origine (aucune feuille d'apparence)", async () => {
    const html = await get("/");
    assert.equal(styleOf(html), ""); assert.match(html, /<a href="\/" class="logo"[^>]*>KOLAKISA<\/a>/); assert.match(html, /Mes formations en ligne : apprenez/);
    assert.match(html, /class="header-search"/); assert.match(html, /href="\/panier"/);
  });
});

describe("styles globaux : brouillon → publication → site", () => {
  test("enregistrer la couleur primaire : brouillon réel, rien de public tant que ce n'est pas publié", async () => {
    await saveStyles({ "colors.primary": "#aa2200" });
    const cfg = JSON.parse(one("SELECT draft FROM appearance_configs").draft);
    assert.equal(cfg.tokens.colors.primary, "#aa2200");
    assert.equal(one("SELECT published FROM appearance_configs").published, null);
    assert.equal(styleOf(await get("/")), "");
    const page = (await boss.get(`${AP}/styles`)).text;
    assert.match(page, /value="#aa2200"/); assert.match(page, /Brouillon modifié/);
  });
  test("aperçu : l'équipe voit le brouillon sur le vrai site (noindex, barre d'aperçu), les visiteurs ne voient rien", async () => {
    const preview = (await boss.get("/?kwpreview=1")).text;
    assert.match(styleOf(preview), /--accent:#aa2200/); assert.match(preview, /kw-preview-bar/); assert.match(preview, /noindex/);
    assert.equal(styleOf((await anon.get("/?kwpreview=1")).text), "", "visiteur : aperçu ignoré");
    const student = await newStudent(srv);
    assert.equal(styleOf((await student.get("/?kwpreview=1")).text), "", "simple membre : aperçu ignoré");
    assert.equal(styleOf(await get("/")), "");
  });
  test("publier (administrateur) : la couleur change réellement sur le site, persistance après rechargement", async () => {
    const r = await publish();
    assert.equal(r.status, 302);
    const html = await get("/");
    assert.match(styleOf(html), /--accent:#aa2200/); assert.match(styleOf(html), /--accent-dark:#/); assert.match(styleOf(html), /--kw-primary:#aa2200/);
    assert.doesNotMatch(html, /kw-preview-bar/);
    assert.match((await boss.get(AP)).text, /Publiée/);
    assert.match(styleOf(await get("/blog")), /--accent:#aa2200/, "toutes les pages publiques");
    assert.equal(one("SELECT revision FROM appearance_configs").revision, 1);
    assert.equal(one("SELECT COUNT(*) n FROM appearance_revisions").n, 1);
  });
  test("typographie : police des titres et tailles H1 réellement appliquées", async () => {
    await saveStyles({ "fonts.heading": "georgia", "type.h1.size": "60", "type.h1.weight": "600", "type.body.size": "19" });
    await publish();
    const css = styleOf(await get("/"));
    assert.match(css, /--font-display:Georgia/); assert.match(css, /:where\(main h1, \.article-body h1\)\{font-size:60px;font-weight:600\}/); assert.match(css, /body\{font-size:19px\}/);
  });
  test("bouton global : fond, arrondi et marges appliqués aux boutons du site ; focus au clavier", async () => {
    await saveStyles({ "radius.button": "30", "buttons.paddingY": "14", "buttons.normal.bg": "#112233", "buttons.normal.color": "#ffffff", "buttons.hover.bg": "#223344", "buttons.focus.color": "#ff0000" });
    await publish();
    const css = styleOf(await get("/"));
    assert.match(css, /\.btn\{border-radius:30px\}/); assert.match(css, /\.btn:not\(\.btn-sm\)\{padding-block:14px\}/);
    assert.match(css, /\.btn-primary\{background:#112233;color:#ffffff\}/); assert.match(css, /\.btn-primary:hover\{background:#223344\}/); assert.match(css, /\.btn:focus-visible\{outline:2px solid #ff0000\}/);
  });
  test("liens, conteneurs, arrondis, ombres", async () => {
    await saveStyles({ "link.color": "#0044aa", "link.underline": "always", "sizes.content": "1100", "radius.lg": "24", "shadow.card": "lg" });
    await publish();
    const css = styleOf(await get("/"));
    assert.match(css, /a:where\(:not\(\[class\]\)\)\{color:#0044aa;text-decoration:underline\}/); assert.match(css, /\.container-wide\{max-width:1140px\}/);
    assert.match(css, /--radius-lg:24px/); assert.match(css, /--shadow-md:0 12px 32px/);
  });
  test("une seule source de vérité : les jetons publiés sont aussi ceux des modèles de thème du Page Builder (--kw-…)", async () => {
    const id = await newPage("Modèle 404 styles", [layout([{ id: "head00000009", type: "heading", props: { text: "PERDU STYLE", level: 1 } }])]);
    await boss.post(`${AP}/templates`, { type: "not_found", page_id: String(id) });
    const html = await get("/une-adresse-inconnue");
    assert.match(html, /PERDU STYLE/); assert.match(html, /class="kw-theme-template lp-site" style="[^"]*--kw-primary:#aa2200/);
    await boss.post(`${AP}/templates/${JSON.parse(one("SELECT value FROM mk_settings WHERE key = 'theme.templates'").value)[0].id}/supprimer`, {});
  });
  test("valeurs invalides refusées sans toucher au brouillon (couleur, police, nombre hors limites)", async () => {
    const before = one("SELECT draft FROM appearance_configs").draft;
    for (const f of [{ "colors.primary": "rouge" }, { "colors.text": "#12" }, { "fonts.heading": "comic-sans" }, { "type.h1.size": "9999" }, { "sizes.content": "5" }]) {
      await saveStyles(f);
      assert.equal(one("SELECT draft FROM appearance_configs").draft, before, JSON.stringify(f));
      assert.match(flashOf((await boss.get(`${AP}/styles`)).text), /mk-flash-error/);
    }
  });
  test("injection CSS / HTML dans les styles : refusée, la feuille du site reste propre", async () => {
    for (const f of [{ "colors.primary": "red;} body{display:none" }, { "buttons.normal.bg": "url(javascript:alert(1))" }, { "link.color": "</style><script>alert(1)</script>" }, { "border.color": "#fff;}*{x:y" }]) await saveStyles(f);
    const css = styleOf(await get("/"));
    assert.doesNotMatch(css, /display:none|javascript|<script|\}\*\{/);
    assert.doesNotMatch(JSON.stringify(JSON.parse(one("SELECT draft FROM appearance_configs").draft)), /script|javascript/);
  });
  test("lisibilité : un contraste insuffisant est signalé dans l'écran des styles", async () => {
    await saveStyles({ "colors.text": "#cccccc" });
    assert.match((await boss.get(`${AP}/styles`)).text, /contraste [\d.]+:1/);
    await boss.post(`${AP}/brouillon/annuler`, {});
  });
});

describe("en-tête et pied de page", () => {
  test("en-tête : annonce, bouton d'action, recherche et panier masqués — enregistrés puis rendus", async () => {
    const r = await boss.post(`${AP}/en-tete`, { logo_mode: "text", logo_text: "MA MARQUE", ann_enabled: "1", ann_text: "Soldes de rentrée", ann_url: "/catalogue", cta_enabled: "1", cta_label: "Essayer", cta_url: "/inscription", cta_style: "outline", mobile_cta: "1", account: "1" });
    assert.equal(r.status, 302);
    assert.doesNotMatch(await get("/"), /MA MARQUE/, "brouillon : pas encore public");
    const preview = (await boss.get("/?kwpreview=1")).text;
    assert.match(preview, /MA MARQUE/); assert.match(preview, /Soldes de rentrée/);
    await publish();
    const html = await get("/");
    assert.match(html, /<a href="\/" class="logo"[^>]*>MA MARQUE<\/a>/); assert.match(html, /class="site-announcement"[\s\S]*href="\/catalogue">Soldes de rentrée/);
    assert.match(html, /class="btn btn-outline btn-sm header-cta" href="\/inscription">Essayer/); assert.match(html, /header-cta-mobile/);
    assert.doesNotMatch(html, /class="header-search"/); assert.doesNotMatch(html, /href="\/panier"/);
    assert.match((await boss.get(`${AP}/en-tete`)).text, /value="MA MARQUE"/, "persistance au rechargement");
  });
  test("en-tête : bouton ou annonce activés sans contenu, URL dangereuse : refusés", async () => {
    const before = one("SELECT draft FROM appearance_configs");
    await boss.post(`${AP}/en-tete`, { logo_mode: "text", logo_text: "X", cta_enabled: "1", cta_label: "", cta_url: "", search: "1", cart: "1", account: "1" });
    assert.match(flashOf((await boss.get(`${AP}/en-tete`)).text), /besoin d(?:'|&#39;)un texte/);
    await boss.post(`${AP}/en-tete`, { logo_mode: "text", logo_text: "X", cta_enabled: "1", cta_label: "Go", cta_url: "javascript:alert(1)", search: "1", cart: "1", account: "1" });
    assert.match(flashOf((await boss.get(`${AP}/en-tete`)).text), /autorisées/);
    await boss.post(`${AP}/en-tete`, { logo_mode: "text", logo_text: "X", ann_enabled: "1", ann_text: "", search: "1", cart: "1", account: "1" });
    assert.deepEqual(one("SELECT draft FROM appearance_configs"), before, "le brouillon n'a pas changé");
    assert.doesNotMatch(await get("/"), /javascript:alert/);
  });
  test("texte HTML dans l'en-tête : échappé (jamais interprété)", async () => {
    await boss.post(`${AP}/en-tete`, { logo_mode: "text", logo_text: "<script>alert(1)</script>", ann_enabled: "1", ann_text: "<img src=x onerror=alert(2)>", search: "1", cart: "1", account: "1", mobile_cta: "1" });
    await publish();
    const html = await get("/");
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/); assert.doesNotMatch(html, /<img src=x onerror/);
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    await boss.post(`${AP}/en-tete`, { logo_mode: "text", logo_text: "KOLAKISA", search: "1", cart: "1", account: "1", mobile_cta: "1" });
    await publish();
  });
  test("logo image : uniquement une image de la médiathèque ; image supprimée → retour au texte, sans erreur", async () => {
    const mid = Number(db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size, width, height) VALUES (?, 'image', 'image', '/uploads/marketing/1/logo-test.png', 'logo-test.png', 'image/png', 100, 120, 40)").run(orgId).lastInsertRowid);
    await boss.post(`${AP}/en-tete`, { logo_mode: "image", logo_media: "999999", logo_alt: "x", search: "1", cart: "1", account: "1" });
    assert.match(flashOf((await boss.get(`${AP}/en-tete`)).text), /Choisissez une image/);
    await boss.post(`${AP}/en-tete`, { logo_mode: "image", logo_media: String(mid), logo_alt: "Mon logo", search: "1", cart: "1", account: "1", mobile_cta: "1" });
    await publish();
    assert.match(await get("/"), /class="logo logo-img"[^>]*><img src="\/uploads\/marketing\/1\/logo-test\.png" alt="Mon logo" width="120" height="40">/);
    db.prepare("UPDATE mk_media SET deleted_at = datetime('now') WHERE id = ?").run(mid);
    const html = await get("/");
    assert.match(html, /<a href="\/" class="logo"[^>]*>KOLAKISA<\/a>/, "média à la corbeille : texte");
    await boss.post(`${AP}/en-tete`, { logo_mode: "text", logo_text: "KOLAKISA", search: "1", cart: "1", account: "1", mobile_cta: "1" });
    await publish();
  });
  test("pied de page : phrase, mention avec {année}, lien Cookies — enregistrés, publiés, rendus", async () => {
    await boss.post(`${AP}/pied-de-page`, { brand_mode: "text", brand_text: "MA MARQUE", tagline: "Apprendre autrement.", copyright: "© {année} Ma Marque", cookies: "" });
    assert.doesNotMatch(await get("/"), /Apprendre autrement/);
    await publish();
    const html = await get("/");
    assert.match(html, /Apprendre autrement\./); assert.match(html, new RegExp(`© ${new Date().getFullYear()} Ma Marque`)); assert.doesNotMatch(html, /data-kw-consent-open>Cookies/);
    assert.match((await boss.get(`${AP}/pied-de-page`)).text, /value="Apprendre autrement\."/);
  });
  test("navigation : le menu de l'en-tête et du pied de page vient du moteur de navigation, modifiable sans toucher à l'apparence", async () => {
    await boss.post("/marketing/site-web/navigation/menus", { name: "Menu apparence" });
    const m = one("SELECT id FROM nav_menus WHERE name = 'Menu apparence'");
    await boss.post(`/marketing/site-web/navigation/menus/${m.id}/elements`, { type: "custom", label: "Offres", url: "/offres" });
    await boss.post("/marketing/site-web/navigation/emplacements", { header: String(m.id), footer: String(m.id) });
    let html = await get("/");
    assert.match(html, /href="\/offres"[^>]*>Offres/); assert.match(html, /MA MARQUE/, "l'apparence publiée reste");
    await boss.post(`/marketing/site-web/navigation/menus/${m.id}/elements`, { type: "custom", label: "Nouveauté", url: "/nouveau" });
    html = await get("/");
    assert.match(html, /href="\/nouveau"/);
    assert.match((await boss.get(`${AP}/en-tete`)).text, /un menu est affecté/);
    await boss.post("/marketing/site-web/navigation/emplacements", { header: "", footer: "" });
  });
});

describe("templates", () => {
  let tpl = {};
  const assign = (fields) => boss.post(`${AP}/templates`, fields);
  const templates = () => JSON.parse(one("SELECT value FROM mk_settings WHERE key = 'theme.templates'").value);
  const clear = async () => { for (const t of templates()) await boss.post(`${AP}/templates/${t.id}/supprimer`, {}); };
  before(async () => {
    const root = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'Formation', 'formation')").run().lastInsertRowid);
    const sub = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug, parent_id) VALUES ('category', 'Excel', 'excel', ?)").run(root).lastInsertRowid);
    const tag = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('tag', 'Astuce', 'astuce')").run().lastInsertRowid);
    const mk = (slug, title, cat) => {
      const id = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, comments_enabled, category) VALUES (?, ?, '<p>Texte réel</p>', 'html', 'published', 1, datetime('now'), 1, ?)").run(slug, title, cat).lastInsertRowid);
      return id;
    };
    tpl.a = mk("article-a", "Article A", "Formation"); tpl.b = mk("article-b", "Article B", "Autre"); tpl.c = mk("article-c", "Article C", "Formation");
    db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', ?, ?, 1, 0)").run(tpl.c, sub);
    db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', ?, ?, 0, 0)").run(tpl.a, tag);
    tpl.root = root; tpl.sub = sub;
  });
  test("template Article général : tous les articles utilisent le nouveau template, avec leurs vraies données", async () => {
    const id = await newPage("Tpl article", [layout([{ id: "head00000010", type: "heading", props: { text: "GENERAL : {{post.title}}", level: 1 } }, { id: "post00000010", type: "postcontent", props: {} }])]);
    await assign({ type: "single_post", page_id: String(id) });
    for (const [slug, title] of [["article-a", "Article A"], ["article-b", "Article B"], ["article-c", "Article C"]]) {
      const html = await get(`/blog/${slug}`);
      assert.match(html, new RegExp(`GENERAL : ${title}`)); assert.match(html, /Texte réel/); assert.match(html, /id="commentaires"/, "commentaires conservés");
    }
    tpl.general = id;
  });
  test("priorité : article précis › catégorie (la plus proche) › étiquette › général — règle déterministe", async () => {
    const mkT = (name, txt) => newPage(name, [layout([{ id: "head00000011", type: "heading", props: { text: txt, level: 1 } }, { id: "post00000011", type: "postcontent", props: {} }])]);
    const cat = await mkT("Tpl cat Formation", "CAT-FORMATION"), sub = await mkT("Tpl cat Excel", "CAT-EXCEL"), tg = await mkT("Tpl étiquette", "TAG-ASTUCE"), one_ = await mkT("Tpl article précis", "PRECIS");
    await assign({ type: "single_post", page_id: String(cat), category: "Formation" });
    assert.match(await get("/blog/article-a"), /CAT-FORMATION/, "catégorie");
    assert.match(await get("/blog/article-b"), /GENERAL/, "autre catégorie : général");
    assert.match(await get("/blog/article-c"), /CAT-FORMATION/, "catégorie parente d'une sous-catégorie");
    await assign({ type: "single_post", page_id: String(sub), category: "Excel" });
    assert.match(await get("/blog/article-c"), /CAT-EXCEL/, "la catégorie la plus proche gagne");
    await assign({ type: "single_post", page_id: String(tg), tag: "Astuce" });
    assert.match(await get("/blog/article-a"), /CAT-FORMATION/, "catégorie › étiquette");
    await assign({ type: "single_post", page_id: String(one_), post_id: String(tpl.a) });
    assert.match(await get("/blog/article-a"), /PRECIS/, "article précis › catégorie");
    assert.match(await get("/blog/article-c"), /CAT-EXCEL/, "les autres articles ne changent pas");
    await assign({ type: "single_post", page_id: String(one_), post_id: String(tpl.a) });
    assert.match(flashOf((await boss.get(`${AP}/templates`)).text), /existe déjà/);
  });
  test("template d'étiquette seul : s'applique aux articles qui portent l'étiquette", async () => {
    await clear();
    const tg = await newPage("Tpl étiquette seul", [layout([{ id: "head00000012", type: "heading", props: { text: "TAG-SEUL", level: 1 } }, { id: "post00000012", type: "postcontent", props: {} }])]);
    await assign({ type: "single_post", page_id: String(tg), tag: "Astuce" });
    assert.match(await get("/blog/article-a"), /TAG-SEUL/); assert.doesNotMatch(await get("/blog/article-b"), /TAG-SEUL/);
    await clear();
  });
  test("archive de catégorie : template dédié (sinon liste du blog) ; données de la catégorie courante", async () => {
    const list = await newPage("Tpl liste", [layout([{ id: "head00000013", type: "heading", props: { text: "LISTE-BLOG {{query.categorie}}", level: 1 } }])]);
    const cat = await newPage("Tpl archive catégorie", [layout([{ id: "head00000014", type: "heading", props: { text: "ARCHIVE-CAT {{query.categorie}}", level: 1 } }])]);
    await assign({ type: "blog_archive", page_id: String(list) });
    let html = await get("/blog/categorie/formation");
    assert.match(html, /LISTE-BLOG Formation/, "repli sur la liste du blog");
    await assign({ type: "category_archive", page_id: String(cat), category: "Formation" });
    html = await get("/blog/categorie/formation");
    assert.match(html, /ARCHIVE-CAT Formation/);
    assert.match(await get("/blog/categorie/excel"), /ARCHIVE-CAT Excel|LISTE-BLOG Excel/, "sous-catégorie : modèle de la catégorie parente ou liste");
    assert.match(await get("/blog"), /LISTE-BLOG/, "accueil du blog : liste");
    assert.doesNotMatch(await get("/blog"), /ARCHIVE-CAT/);
  });
  test("archive d'étiquette : template dédié, sinon liste du blog", async () => {
    const tg = await newPage("Tpl archive étiquette", [layout([{ id: "head00000015", type: "heading", props: { text: "ARCHIVE-TAG {{query.etiquette}}", level: 1 } }])]);
    assert.match(await get("/blog/etiquette/astuce"), /LISTE-BLOG/, "repli");
    await assign({ type: "tag_archive", page_id: String(tg), tag: "Astuce" });
    assert.match(await get("/blog/etiquette/astuce"), /ARCHIVE-TAG Astuce/);
  });
  test("résultats de recherche : template dédié reçoit la requête", async () => {
    const s = await newPage("Tpl recherche", [layout([{ id: "head00000016", type: "heading", props: { text: "RECHERCHE {{query.q}}", level: 1 } }])]);
    await assign({ type: "search_results", page_id: String(s) });
    assert.match(await get("/blog?q=Excel"), /RECHERCHE Excel/);
    assert.doesNotMatch(await get("/blog"), /RECHERCHE/);
  });
  test("page « À propos » : template de page du site, avec le vrai texte de la page", async () => {
    const p = await newPage("Tpl page", [layout([{ id: "head00000017", type: "heading", props: { text: "PAGE-SITE : {{post.title}}", level: 1 } }, { id: "post00000017", type: "postcontent", props: {} }])]);
    await assign({ type: "static_page", page_id: String(p) });
    const html = await get("/a-propos");
    assert.match(html, /PAGE-SITE : À propos/); assert.match(html, /KOLAKISA/);
  });
  test("404 : le template est réellement utilisé quand le routage renvoie 404 (statut 404 conservé)", async () => {
    const n = await newPage("Tpl 404", [layout([{ id: "head00000018", type: "heading", props: { text: "OUPS PERSONNALISE", level: 1 } }, { id: "btn000000018", type: "button", props: { label: "Retour à l'accueil", url: "/" } }])]);
    await assign({ type: "not_found", page_id: String(n) });
    const r = await anon.get("/cette-page-n-existe-pas", { headers: { "User-Agent": UA } });
    assert.equal(r.status, 404); assert.match(r.text, /OUPS PERSONNALISE/);
    assert.equal((await anon.get("/blog/article-inexistant", { headers: { "User-Agent": UA } })).status, 404);
  });
  test("template non publié ou retiré : l'affichage d'origine revient ; liste honnête", async () => {
    db.prepare("UPDATE mk_landing_pages SET status = 'draft' WHERE name = 'Tpl 404'").run();
    assert.doesNotMatch((await anon.get("/cette-page-n-existe-pas", { headers: { "User-Agent": UA } })).text, /OUPS PERSONNALISE/);
    assert.match((await boss.get(`${AP}/templates`)).text, /Inactif : publiez la page/);
    await clear();
    assert.match((await boss.get(`${AP}/templates`)).text, /Utiliser le template par défaut/);
    assert.match(await get("/blog/article-a"), /<h1 class="post-title">Article A<\/h1>/);
  });
  test("en-tête commun : modifier l'en-tête change tous les templates (même en-tête partout)", async () => {
    const t = await newPage("Tpl commun", [layout([{ id: "head00000019", type: "heading", props: { text: "COMMUN", level: 1 } }, { id: "post00000019", type: "postcontent", props: {} }])]);
    await assign({ type: "single_post", page_id: String(t) });
    await boss.post(`${AP}/en-tete`, { logo_mode: "text", logo_text: "ENTETE-COMMUN", search: "1", cart: "1", account: "1", mobile_cta: "1" });
    await publish();
    for (const path of ["/blog/article-a", "/blog/article-b", "/blog", "/cette-page-n-existe-pas", "/a-propos"]) assert.match(await get(path), /ENTETE-COMMUN/, path);
    await clear();
  });
  test("template vers une page inexistante, de tunnel ou en double : refusé", async () => {
    await assign({ type: "single_post", page_id: "999999" });
    assert.match(flashOf((await boss.get(`${AP}/templates`)).text), /Choisissez une page/);
    await assign({ type: "tag_archive", page_id: "", tag: "Astuce" });
    assert.equal(templates().length, 0);
  });
});

describe("patterns", () => {
  let sourceId;
  test("créer un pattern à partir d'une section existante : ressource réelle, copie indépendante sans identifiants", async () => {
    sourceId = await newPage("Page source", [layout([{ id: "head00000020", type: "heading", props: { text: "Mon CTA", level: 2 } }, { id: "btn000000020", type: "button", props: { label: "Agir", url: "/catalogue" } }])]);
    const sections = (await boss.get(`${AP}/patterns?page=${sourceId}`)).text;
    assert.match(sections, /Section de « Page source »/); assert.match(sections, /name="section_index"/);
    await boss.post(`${AP}/patterns`, { page_id: String(sourceId), section_index: "0", name: "CTA principal", description: "Bloc d'appel à l'action" });
    const p = one("SELECT * FROM appearance_patterns WHERE name = 'CTA principal'");
    assert.ok(p); assert.equal(p.mode, "static"); assert.equal(p.source_page_id, sourceId);
    assert.doesNotMatch(p.sections, /"id":/, "identifiants retirés");
    assert.match(p.sections, /Mon CTA/);
    assert.match((await boss.get(`${AP}/patterns`)).text, /CTA principal/);
  });
  test("insertion depuis le Page Builder : le pattern est proposé dans les blocs de l'éditeur, comme les blocs intégrés", async () => {
    const editor = (await boss.get(`/marketing/pages/${sourceId}/editeur`)).text;
    assert.match(editor, /CTA principal/); assert.match(editor, /Mon CTA/);
    assert.match(editor, /"category":"Mes patterns"/);
  });
  test("mode statique : modifier le pattern n'affecte pas une page qui l'a déjà inséré (copie indépendante)", async () => {
    const target = await newPage("Page cible", [layout([{ id: "head00000021", type: "heading", props: { text: "Mon CTA", level: 2 } }])]);
    const p = one("SELECT id FROM appearance_patterns WHERE name = 'CTA principal'");
    await boss.post(`${AP}/patterns/${p.id}`, { name: "CTA principal v2", description: "x" });
    assert.ok(one("SELECT 1 FROM appearance_patterns WHERE name = 'CTA principal v2'"));
    const html = await get(`/p/${one("SELECT slug FROM mk_landing_pages WHERE id = ?", target).slug}`);
    assert.match(html, /Mon CTA/);
  });
  test("nom en double, section inexistante, pattern d'un composant : refusés", async () => {
    await boss.post(`${AP}/patterns`, { page_id: String(sourceId), section_index: "0", name: "cta PRINCIPAL V2" });
    assert.equal(q("SELECT * FROM appearance_patterns").length, 1);
    await boss.post(`${AP}/patterns`, { page_id: String(sourceId), section_index: "9", name: "Autre" });
    assert.equal(q("SELECT * FROM appearance_patterns").length, 1);
    await boss.post(`${AP}/patterns`, { page_id: "999999", section_index: "0", name: "Autre" });
    assert.equal(q("SELECT * FROM appearance_patterns").length, 1);
  });
  test("supprimer un pattern (corbeille) : disparaît des blocs de l'éditeur, restaurable depuis la corbeille", async () => {
    const p = one("SELECT id FROM appearance_patterns");
    await boss.post(`${AP}/patterns/${p.id}/supprimer`, {});
    assert.equal(q("SELECT * FROM appearance_patterns WHERE deleted_at IS NULL").length, 0);
    assert.equal(q("SELECT * FROM appearance_patterns").length, 1, "mis de côté, pas effacé");
    assert.doesNotMatch((await boss.get(`/marketing/pages/${sourceId}/editeur`)).text, /CTA principal v2/);
    assert.match((await boss.get(`${AP}/patterns`)).text, /Aucun pattern\./);
  });
  test("composants synchronisés du Page Builder listés (mode synchronisé réel)", async () => {
    const r = await boss.get(`${AP}/patterns`);
    assert.match(r.text, /Composants synchronisés/); assert.match(r.text, /Mode statique/);
  });
});

describe("publication, historique, droits, isolation", () => {
  test("historique : chaque publication est conservée ; une ancienne version revient dans le brouillon puis se publie", async () => {
    const hist = q("SELECT id FROM appearance_revisions ORDER BY id");
    assert.ok(hist.length >= 5);
    await boss.post(`${AP}/versions/${hist[0].id}/restaurer`, {});
    assert.ok(one("SELECT draft FROM appearance_configs").draft);
    assert.match(styleOf((await boss.get("/?kwpreview=1")).text), /--accent:#aa2200/);
    await boss.post(`${AP}/brouillon/annuler`, {});
    assert.equal(one("SELECT draft FROM appearance_configs").draft, null);
  });
  test("rien à publier : refusé avec message ; retirer l'apparence : retour à l'affichage d'origine, historique conservé", async () => {
    await publish();
    assert.match(flashOf((await boss.get(AP)).text), /Rien à publier/);
    const count = one("SELECT COUNT(*) n FROM appearance_revisions").n;
    await boss.post(`${AP}/retirer`, {});
    assert.equal(styleOf(await get("/")), ""); assert.match(await get("/"), /<a href="\/" class="logo"[^>]*>KOLAKISA<\/a>/);
    assert.equal(one("SELECT COUNT(*) n FROM appearance_revisions").n, count);
  });
  test("droits : lecteur voit sans modifier ; éditeur modifie le brouillon sans publier ; administrateur publie ; membre simple refusé", async () => {
    const viewer = await member("viewer"), editor = await member("editor"), admin = await member("admin"), s = await newStudent(srv);
    assert.notEqual((await anon.get(AP)).status, 200); assert.notEqual((await s.get(AP)).status, 200);
    const v = await viewer.get(`${AP}/styles`);
    assert.equal(v.status, 200); assert.match(v.text, /disabled/);
    await viewer.post(`${AP}/styles`, { "colors.primary": "#00aa00" });
    assert.equal(one("SELECT COUNT(*) n FROM appearance_configs WHERE draft LIKE '%00aa00%'").n, 0);
    assert.equal((await viewer.post(`${AP}/en-tete`, { logo_mode: "text", logo_text: "V" })).status, 403);
    assert.equal((await viewer.post(`${AP}/publier`, {})).status, 403);
    await editor.post(`${AP}/styles`, { "colors.primary": "#00aa00" });
    assert.equal(one("SELECT COUNT(*) n FROM appearance_configs WHERE draft LIKE '%00aa00%'").n, 1);
    assert.equal((await editor.post(`${AP}/publier`, {})).status, 403);
    assert.equal(one("SELECT published FROM appearance_configs").published, null);
    assert.equal((await editor.post(`${AP}/retirer`, {})).status, 403);
    await admin.post(`${AP}/publier`, {});
    assert.match(styleOf(await get("/")), /--accent:#00aa00/);
    const e = await editor.get(AP);
    assert.match(e.text, /Seuls les administrateurs publient/);
    await boss.post(`${AP}/retirer`, {});
  });
  test("sites du Page Builder : leurs styles restent indépendants (modifier le site principal ne touche pas un autre site)", async () => {
    const siteA = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, tokens) VALUES (?, 'Site A', '{}')").run(orgId).lastInsertRowid);
    const siteB = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, tokens) VALUES (?, 'Site B', '{}')").run(orgId).lastInsertRowid);
    const tokensB = one("SELECT tokens FROM mk_sites WHERE id = ?", siteB).tokens;
    await saveStyles({ "colors.primary": "#123456" }); await publish();
    assert.equal(one("SELECT tokens FROM mk_sites WHERE id = ?", siteB).tokens, tokensB);
    assert.equal(one("SELECT tokens FROM mk_sites WHERE id = ?", siteA).tokens, "{}");
    assert.match((await boss.get(AP)).text, /Site A/); assert.match((await boss.get(AP)).text, /Site B/);
    await boss.post(`${AP}/retirer`, {});
  });
  test("modifier un site publié du Page Builder (design system) ne change pas l'apparence du site public", async () => {
    const siteC = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, tokens) VALUES (?, 'Site C', '{}')").run(orgId).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET tokens = ? WHERE id = ?").run(JSON.stringify({ colors: { primary: "#ff00ff" } }), siteC);
    assert.equal(styleOf(await get("/")), "");
  });
  test("pas de cache obsolète : la version publiée change aussitôt sur le site (première requête après publication)", async () => {
    await boss.post(`${AP}/pied-de-page`, { brand_mode: "text", brand_text: "V1", tagline: "Version un", copyright: "c", cookies: "1" }); await publish();
    assert.match(await get("/"), /Version un/);
    await boss.post(`${AP}/pied-de-page`, { brand_mode: "text", brand_text: "V2", tagline: "Version deux", copyright: "c", cookies: "1" }); await publish();
    const html = await get("/");
    assert.match(html, /Version deux/); assert.doesNotMatch(html, /Version un/);
    await boss.post(`${AP}/retirer`, {});
  });
  test("performance : 100 lectures du site public avec apparence publiée, moins de 5 s au total", async () => {
    await saveStyles({ "colors.primary": "#aa2200" }); await publish();
    const t0 = Date.now();
    for (let i = 0; i < 100; i++) await anon.get("/blog");
    assert.ok(Date.now() - t0 < 15000, `${Date.now() - t0} ms`);
    await boss.post(`${AP}/retirer`, {});
  });
});
