// Blog éditorial : mise en forme (sommaire, encadrés, images, formation citée), page d'un article en trois zones,
// partage, auteur, précédent/suivant, similaires, populaires, catégories, étiquettes, newsletter, SEO/Open Graph, éditeur.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");
const { renderArticle } = require("../src/utils/articleMarkdown");

let srv, prof;
const anon = () => new Client(srv.base);
const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
const run = (sql, ...a) => { const db = srv.db(); db.prepare(sql).run(...a); db.close(); };
const meta = (html, name) => (html.match(new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]*)"`)) || [])[1];
const metas = (html, name) => [...html.matchAll(new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]*)"`, "g"))].map((m) => m[1]);
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const count = (html, re) => (html.match(re) || []).length;
const PNG = { name: "c.png", type: "image/png" };

async function save(client, url, fields = {}, filesToSend = {}) {
  const fd = new FormData();
  Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
  for (const [field, f] of Object.entries(filesToSend)) fd.append(field, new Blob([f.data || Buffer.alloc(80, 3)], { type: f.type }), f.name);
  return client.request(url, { method: "POST", multipart: fd });
}
const create = (fields, files) => save(prof, "/formateur/blog/nouveau", { excerpt: "Résumé.", content: "Texte.", ...fields }, files);
const byTitle = (title) => q("SELECT * FROM posts WHERE title = ?", title)[0];
const publish = (title, at) => {
  run("UPDATE posts SET published = 1, published_at = ? WHERE id = ?", at, byTitle(title).id);
};

const LONG = `Introduction sur la **formation en ligne**.

## Pourquoi se former en ligne ?
Apprendre à son rythme.

### Les avantages
- Flexibilité
- Accès à vie

## Apprendre à son propre rythme
:::a-retenir
La formation en ligne permet d'apprendre à son rythme.
:::

:::conseil Astuce du formateur
Bloquez 30 minutes par jour.
:::

![Capture de l'interface](/uploads/thumbnails/demo.webp "Interface")
Légende : L'interface du logiciel

[[formation:excel-avance]]

## Transformer ses connaissances en projets
> Apprendre est important, pratiquer l'est encore plus.

[[bouton:Voir les formations|/catalogue]]
`;

describe("mise en forme d'un article (sans serveur)", () => {
  test("sommaire tiré des ## et ###, ancres uniques, temps de lecture", () => {
    const r = renderArticle(LONG);
    assert.deepEqual(r.toc.map((t) => [t.level, t.id]), [[2, "pourquoi-se-former-en-ligne"], [3, "les-avantages"], [2, "apprendre-a-son-propre-rythme"], [2, "transformer-ses-connaissances-en-projets"]]);
    assert.match(r.html, /<h2 id="pourquoi-se-former-en-ligne">Pourquoi se former en ligne \?<\/h2>/);
    assert.equal(renderArticle("## A\n\n## A").toc[1].id, "a-2");
    assert.ok(r.words > 40 && r.minutes === 1);
    assert.equal(renderArticle("mot ".repeat(1150)).minutes, 5, "230 mots par minute");
  });
  test("encadrés (titre par défaut ou personnalisé), image avec légende, bouton", () => {
    const r = renderArticle(LONG);
    assert.match(r.html, /<aside class="callout callout-a-retenir" role="note"><p class="callout-title">À retenir<\/p><p>La formation/);
    assert.match(r.html, /<aside class="callout callout-conseil" role="note"><p class="callout-title">Astuce du formateur<\/p>/);
    assert.match(r.html, /<figure class="article-figure"><img src="\/uploads\/thumbnails\/demo\.webp" alt="Capture de l&#39;interface" title="Interface" loading="lazy" decoding="async"><figcaption>L&#39;interface du logiciel<\/figcaption><\/figure>/);
    assert.match(r.html, /<p class="article-cta"><a class="btn btn-primary" href="\/catalogue">Voir les formations<\/a><\/p>/);
  });
  test("sûreté : HTML neutralisé, image externe jamais chargée, bouton javascript: refusé, formation inconnue ignorée", () => {
    const r = renderArticle("<img src=x onerror=alert(1)>\n\n![suivi](https://pisteur.example/p.gif)\n\n[[bouton:Piège|javascript:alert(1)]]\n\n[[formation:inconnue]]\n\n:::inconnu\ntexte\n:::");
    assert.doesNotMatch(r.html, /<img src=x/);
    assert.doesNotMatch(r.html, /<img[^>]+pisteur/);
    assert.doesNotMatch(r.html, /href="javascript:/);
    assert.doesNotMatch(r.html, /formation:inconnue|class="article-course"/);
    assert.match(r.html, /:::inconnu/, "encadré inconnu : laissé en texte");
  });
});

describe("page d'un article", () => {
  let html, p, course;
  before(async () => {
    srv = await startServer();
    prof = await loginInstructor(srv);
    run("UPDATE users SET bio = 'Formateur en bureautique depuis 10 ans.' WHERE role = 'formateur'");
    course = await createCourse(prof, srv, { title: "Excel avancé", price: 49 });
    run("UPDATE courses SET slug = 'excel-avance' WHERE id = ?", course.id);
    await create({ title: "Article ancien", category: "Bureautique", tags: "Excel, Productivité" });
    await create({ title: "Article principal", excerpt: "Découvrez comment la formation en ligne aide à progresser.", content: LONG, category: "Bureautique", tags: "Excel, formation", cover_alt: "Une personne qui suit un cours", og_title: "Titre de partage", og_description: "Description de partage", focus_keyword: "formation en ligne" }, { thumbnail: PNG, og_image: { name: "og.png", type: "image/png" } });
    await create({ title: "Article récent", category: "Marketing digital", tags: "SEO" });
    await create({ title: "Article proche", category: "Bureautique", tags: "Word" });
    publish("Article ancien", "2026-01-01 10:00:00");
    publish("Article principal", "2026-02-01 10:00:00");
    publish("Article proche", "2026-02-15 10:00:00");
    publish("Article récent", "2026-03-01 10:00:00");
    p = byTitle("Article principal");
    html = (await anon().get(`/blog/${p.slug}`)).text;
  });
  after(() => srv.stop());

  test("un seul H1, une seule image principale (avec son texte alternatif), métadonnées une fois", () => {
    assert.equal(count(html, /<h1[\s>]/g), 1);
    assert.equal(count(html, /class="post-cover"/g), 1);
    assert.match(html, /<img class="post-cover" src="\/uploads\/thumbnails\/[^"]+\.png" alt="Une personne qui suit un cours" width="1200" height="675" fetchpriority="high"/);
    assert.equal(count(html, /class="post-meta article-meta"/g), 1);
  });
  test("en-tête : catégorie (lien), titre, résumé, date, auteur, temps de lecture", () => {
    assert.match(html, /<a class="article-category" href="\/blog\/categorie\/bureautique">Bureautique<\/a>/);
    assert.match(html, /<p class="article-lead">Découvrez comment la formation en ligne aide à progresser\.<\/p>/);
    assert.match(html, /<time datetime="2026-02-01T10:00:00Z">1 février 2026<\/time>/);
    assert.match(html, /par <a href="\/blog\/auteur\/\d+">Prof<\/a>/);
    assert.match(html, /1 min de lecture/);
  });
  test("sommaire numéroté (ordinateur) et repliable (mobile), liens vers les ancres ; progression de lecture", () => {
    assert.match(html, /<nav class="article-toc" aria-labelledby="toc-title">/);
    assert.match(html, /href="#pourquoi-se-former-en-ligne" data-toc-link="pourquoi-se-former-en-ligne"><span class="toc-num" aria-hidden="true">01<\/span>/);
    assert.match(html, /<li class="toc-l3"><a href="#les-avantages"/);
    assert.match(html, /<details class="article-toc-mobile">\s*<summary>Sommaire <span class="toc-count">\(3 parties\)<\/span>/);
    assert.match(html, /data-progress-bar/);
    assert.match(html, /Lecture : <strong data-progress-text>0 %<\/strong>/);
    assert.match(html, /src="\/js\/blog-article\.js(\?v=[^"]*)?" defer/);
  });
  test("partage : Facebook, LinkedIn, X, WhatsApp (adresses officielles encodées), copier le lien, partage natif", () => {
    const url = encodeURIComponent(`${srv.base}/blog/${p.slug}`);
    assert.match(html, new RegExp(`https://www\\.facebook\\.com/sharer/sharer\\.php\\?u=${url.replace(/[.%]/g, "\\$&")}`));
    assert.ok(html.includes(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`));
    assert.ok(html.includes(`https://x.com/intent/post?url=${url}&amp;text=Article%20principal`));
    assert.ok(html.includes(`https://wa.me/?text=Article%20principal%20${url}`));
    assert.match(html, /data-copy-link="http[^"]+\/blog\/article-principal"/);
    assert.match(html, /aria-label="Partager sur Facebook \(nouvelle fenêtre\)"/);
    assert.match(html, /data-native-share[^>]* hidden/);
  });
  test("contenu riche : encadrés, image, carte de la formation citée (lien interne)", () => {
    assert.match(html, /callout-a-retenir/);
    assert.match(html, /<aside class="article-course" aria-label="Formation recommandée">[\s\S]*<a href="\/cours\/excel-avance">Excel avancé<\/a>[\s\S]*49,00/);
  });
  test("étiquettes, bloc auteur (biographie), précédent / suivant, appel final vers les formations", () => {
    assert.match(html, /<a href="\/blog\/etiquette\/excel">#Excel<\/a>/);
    assert.match(html, /À propos de l(?:'|&#39;)auteur[\s\S]*Formateur en bureautique depuis 10 ans\./);
    assert.match(html, /href="\/blog\/article-ancien" rel="prev"[\s\S]*Article ancien/);
    assert.match(html, /href="\/blog\/article-proche" rel="next"[\s\S]*Article proche/);
    assert.match(html, /<h2>Prêt à développer vos compétences \?<\/h2>[\s\S]*href="\/catalogue" class="btn btn-primary">Découvrir les formations/);
  });
  test("colonne de droite : récents, catégories avec effectifs, appel vers les formations ; pas de newsletter sans formulaire publié", () => {
    assert.match(html, /<h2 class="side-title">Articles récents<\/h2>[\s\S]*Article récent/);
    assert.match(html, /href="\/blog\/categorie\/bureautique" aria-current="page">Bureautique <span class="side-count">3<\/span>/);
    assert.match(html, /Envie de développer vos compétences \?/);
    assert.doesNotMatch(html, /data-blog-newsletter/);
  });
  test("articles similaires : même catégorie et étiquettes d'abord", () => {
    const section = html.slice(html.indexOf("Vous pourriez également aimer"));
    const titles = [...section.matchAll(/<h3><a href="\/blog\/[^"]+">([^<]+)<\/a><\/h3>/g)].map((m) => m[1]);
    assert.deepEqual(titles.slice(0, 2).sort(), ["Article ancien", "Article proche"]);
    assert.match(section, /Lire l(?:'|&#39;)article/);
  });
  test("Open Graph, carte X et données structurées complètes (sans données inventées)", () => {
    assert.equal(meta(html, "og:title"), "Titre de partage");
    assert.equal(meta(html, "og:description"), "Description de partage");
    assert.match(meta(html, "og:image"), /^http.+\/uploads\/thumbnails\/.+\.png$/);
    assert.equal(meta(html, "og:image:alt"), "Une personne qui suit un cours");
    assert.equal(meta(html, "twitter:card"), "summary_large_image");
    assert.equal(meta(html, "twitter:title"), "Titre de partage");
    assert.equal(meta(html, "article:section"), "Bureautique");
    assert.deepEqual(metas(html, "article:tag"), ["Excel", "formation"]);
    assert.ok(meta(html, "article:modified_time"));
    const b = jsonLd(html).find((x) => x["@type"] === "BlogPosting");
    assert.equal(b.headline, "Article principal");
    assert.equal(b.articleSection, "Bureautique");
    assert.equal(b.keywords, "Excel, formation");
    assert.ok(b.wordCount > 0);
    assert.match(b.author.url, /\/blog\/auteur\/\d+$/);
    assert.equal(Array.isArray(b.image) ? b.image.length : 1, 2, "image de partage + image principale");
    assert.equal(b.publisher.logo, undefined, "aucun logo inventé");
    assert.deepEqual(jsonLd(html).find((x) => x["@type"] === "BreadcrumbList").itemListElement.map((i) => i.name), ["Accueil", "Blog", "Bureautique", "Article principal"]);
  });
  test("article court sans titres : pas de sommaire, page lisible", async () => {
    const short = (await anon().get("/blog/article-recent")).text;
    assert.doesNotMatch(short, /class="article-toc"/);
    assert.match(short, /article-layout article-layout-no-toc/);
    assert.equal(count(short, /<h1[\s>]/g), 1);
  });
  test("lectures : comptées pour un visiteur, pas pour un robot ni pour le formateur ; « populaires » ensuite", async () => {
    const before = byTitle("Article ancien").views;
    await anon().get("/blog/article-ancien");
    await anon().request("/blog/article-ancien", { headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" } });
    await prof.get("/blog/article-ancien");
    assert.equal(byTitle("Article ancien").views, before + 1);
    const again = (await anon().get("/blog/article-recent")).text;
    assert.match(again, /<h2 class="side-title">Articles populaires<\/h2>[\s\S]*Article ancien/);
  });
  test("pages catégorie (indexable), étiquette et auteur (non indexées) ; 404 si inconnues ; plan du site", async () => {
    const cat = (await anon().get("/blog/categorie/bureautique")).text;
    assert.match(cat, /<h1>Bureautique<\/h1>/);
    assert.equal(count(cat, /class="post-card"/g), 3);
    assert.doesNotMatch(cat, /noindex/);
    const tag = (await anon().get("/blog/etiquette/excel")).text;
    assert.match(tag, /<h1>Articles : Excel<\/h1>/);
    assert.equal(count(tag, /class="post-card"/g), 2);
    assert.match(tag, /noindex/);
    const authorId = q("SELECT id FROM users WHERE role = 'formateur'")[0].id;
    assert.equal(count((await anon().get(`/blog/auteur/${authorId}`)).text, /class="post-card"/g), 4);
    for (const bad of ["/blog/categorie/inconnue", "/blog/etiquette/inconnue", "/blog/auteur/99999"]) assert.equal((await anon().get(bad)).status, 404, bad);
    assert.match((await anon().get("/sitemap.xml")).text, /\/blog\/categorie\/bureautique/);
    assert.match((await anon().get("/blog")).text, /<nav class="blog-categories"/);
  });
  test("newsletter : formulaire marketing publié → bloc d'inscription (consentement, champ piège) ; choix du formulaire par le formateur", async () => {
    run("INSERT INTO mk_forms (organization_id, name, slug, status, consent_text) VALUES (1, 'Lettre du blog', 'lettre-du-blog', 'published', 'J''accepte de recevoir la lettre du blog.')");
    run("INSERT INTO mk_forms (organization_id, name, slug, status, consent_text) VALUES (1, 'Autre', 'autre', 'published', 'Autre consentement.')");
    let page = (await anon().get("/blog/article-principal")).text;
    assert.match(page, /<form action="\/f\/(autre|lettre-du-blog)" method="post" data-blog-newsletter>/);
    assert.match((await prof.post("/formateur/blog/newsletter", { form: "lettre-du-blog" })).location, /\/formateur\/blog\?enregistre=1/);
    page = (await anon().get("/blog/article-principal")).text;
    assert.match(page, /<form action="\/f\/lettre-du-blog" method="post" data-blog-newsletter>/);
    assert.match(page, /name="website"/);
    assert.match(page, /<input type="checkbox" name="consent" value="1" required> <span>J(?:'|&#39;)accepte de recevoir la lettre du blog\.<\/span>/);
    assert.equal((await prof.post("/formateur/blog/newsletter", { form: "inexistant" })).status, 400);
    const signup = await anon().request("/f/lettre-du-blog", { method: "POST", form: { email: "lecteur@ex.fr", consent: "1", website: "" }, headers: { "x-mk-popup": "1" } });
    assert.equal(signup.status, 200);
    assert.match(signup.text, /"ok":true/);
  });
});

describe("éditeur d'article", () => {
  before(async () => {
    srv = await startServer();
    prof = await loginInstructor(srv);
  });
  after(() => srv.stop());

  test("tous les champs : catégorie, étiquettes nettoyées, auteur, textes alternatif et de partage, mot-clé, temps de lecture", async () => {
    const r = await create({ title: "Complet", category: "SEO", tags: " Google , google, Référencement ,, ", cover_alt: "Alt", focus_keyword: "référencement", og_title: "OG", og_description: "OG desc", reading_minutes: "12", slug: "Mon Adresse Choisie!" });
    assert.equal(r.status, 302);
    const p = byTitle("Complet");
    assert.deepEqual([p.slug, p.category, p.tags, p.cover_alt, p.focus_keyword, p.og_title, p.og_description, p.reading_minutes], ["mon-adresse-choisie", "SEO", "Google, Référencement", "Alt", "référencement", "OG", "OG desc", 12]);
    assert.ok(p.author_id);
    const form = (await prof.get(`/formateur/blog/${p.id}/modifier`)).text;
    for (const id of ["post-category", "post-tags-input", "post-author", "post-cover-alt", "post-minutes", "post-slug", "post-keyword", "post-canonical", "post-og-title", "post-og-desc", "post-og-image"]) {
      assert.match(form, new RegExp(`<label[^>]+for="${id}"`), id);
    }
    assert.match(form, /data-block-toolbar/);
    assert.match(form, /src="\/js\/blog-editor\.js(\?v=[^"]*)?" defer/);
  });
  test("refus clairs : temps de lecture hors bornes, adresse canonique non https, auteur inconnu", async () => {
    assert.equal((await create({ title: "X1", reading_minutes: "0" })).status, 400);
    assert.equal((await create({ title: "X2", canonical_url: "http://ailleurs.example/a" })).status, 400);
    assert.equal((await create({ title: "X3", author_id: "99999" })).status, 400);
    assert.equal(q("SELECT COUNT(*) n FROM posts WHERE title LIKE 'X_'")[0].n, 0);
  });
  test("adresse : modifiable avant la première publication, figée ensuite ; date de publication modifiable", async () => {
    await create({ title: "Adresse" });
    let p = byTitle("Adresse");
    await save(prof, `/formateur/blog/${p.id}/modifier`, { title: "Adresse", content: "x", slug: "nouvelle-adresse" });
    assert.equal(byTitle("Adresse").slug, "nouvelle-adresse");
    await prof.post(`/formateur/blog/${p.id}/publier`, {});
    await save(prof, `/formateur/blog/${p.id}/modifier`, { title: "Adresse", content: "x", slug: "encore-une-autre", published_at_utc: "2026-05-04T08:30:00.000Z" });
    p = byTitle("Adresse");
    assert.equal(p.slug, "nouvelle-adresse");
    assert.equal(p.published_at, "2026-05-04 08:30:00");
  });
  test("image insérée dans le contenu : enregistrée sur le site (adresse renvoyée) ; SVG refusé ; réservé au formateur", async () => {
    const fd = new FormData();
    fd.append("article_image", new Blob([Buffer.alloc(60, 1)], { type: "image/webp" }), "a.webp");
    const ok = await prof.request("/formateur/blog/images", { method: "POST", multipart: fd });
    assert.match(ok.text, /"path":"\/uploads\/thumbnails\/[^"]+\.webp"/);
    const bad = new FormData();
    bad.append("article_image", new Blob(["<svg/>"], { type: "image/svg+xml" }), "a.svg");
    assert.equal((await prof.request("/formateur/blog/images", { method: "POST", multipart: bad })).status, 400);
    const student = await newStudent(srv);
    const fd2 = new FormData();
    fd2.append("article_image", new Blob([Buffer.alloc(60, 1)], { type: "image/png" }), "a.png");
    assert.equal((await student.request("/formateur/blog/images", { method: "POST", multipart: fd2 })).status, 403);
  });
  test("image de partage : remplacée puis retirée (fichier supprimé)", async () => {
    await create({ title: "Partage" }, { og_image: { name: "og.png", type: "image/png" } });
    const p = byTitle("Partage");
    assert.match(p.og_image_path, /\.png$/);
    await save(prof, `/formateur/blog/${p.id}/modifier`, { title: "Partage", content: "x", remove_og_image: "1" });
    assert.equal(byTitle("Partage").og_image_path, null);
  });
});
