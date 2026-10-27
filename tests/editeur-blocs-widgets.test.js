// KOLAKISA — blocs dynamiques (widgets), notes de bas de page, pages multiples, HTML personnalisé signé, flux RSS : règles du serveur et isolation entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || TEST_KEY;
const { sanitizeBlogHtml, renderBlogHtml, blogPlainText } = require("../src/utils/blogHtml");
const customHtml = require("../src/utils/customHtml");
const { DYNAMIC, cleanSocial } = require("../src/shared/dynamicBlocks");

const widgets = {
  latest: ({ count }) => [{ title: "Article <b>un</b>", url: "/blog/un", date: "1er octobre 2026", excerpt: "Résumé", image: "/uploads/thumbnails/a.png", alt: "A" }, { title: "Article deux", url: "/blog/deux", date: "2 octobre 2026", excerpt: "", image: "", alt: "" }].slice(0, count),
  categories: () => [{ name: "Marketing", count: 3, url: "/blog/categorie/marketing" }],
  tags: () => [{ name: "seo", count: 5, url: "/blog/etiquette/seo" }, { name: "mail", count: 1, url: "/blog/etiquette/mail" }],
  archives: () => [{ label: "octobre 2026", count: 2, url: "/blog?date=2026-10" }],
  calendar: () => ({ year: 2026, month: 10, label: "octobre 2026", ym: "2026-10", days: { 5: 1, 12: 2 } }),
  pages: () => [{ title: "Contact", url: "/contact" }],
  comments: () => [{ author: "Awa", excerpt: "Très utile <b>merci</b>", title: "Mon article", url: "/blog/mon-article", date: "1er octobre 2026" }],
  feed: () => ({ title: "Flux", items: [{ title: "Dehors", url: "https://exemple.org/a", date: "2026-10-01", excerpt: "Extrait" }] }),
};

describe("blocs dynamiques — assainissement", () => {
  test("chaque bloc conserve ses réglages valides et perd les autres", () => {
    assert.match(sanitizeBlogHtml('<div class="kb-latest" data-count="7" data-view="grid" data-date="true" data-category="Marketing" data-evil="x"></div>'), /data-count="7" data-view="grid" data-date="true" data-category="Marketing"/);
    assert.doesNotMatch(sanitizeBlogHtml('<div class="kb-latest" data-count="99" data-view="<script>"></div>'), /data-count|data-view|script/);
    assert.match(sanitizeBlogHtml('<div class="kb-toc" data-depth="2"></div>'), /data-depth="2"/);
    assert.doesNotMatch(sanitizeBlogHtml('<div class="kb-toc" data-depth="7"></div>'), /data-depth/);
    assert.match(sanitizeBlogHtml('<div class="kb-search" data-button="Go"></div>'), /data-button="Go"/);
  });
  test("réseaux sociaux : seulement les réseaux connus, sur leur propre domaine, en https (ou e-mail)", () => {
    assert.equal(cleanSocial("facebook=https://www.facebook.com/page x=https://twitter.com/me email=mailto:a@b.co"), "facebook=https://www.facebook.com/page x=https://twitter.com/me email=mailto:a@b.co");
    for (const bad of ["facebook=https://facebook.com.evil.test/x", "facebook=http://facebook.com/x", "facebook=javascript:alert(1)", "inconnu=https://x.com/a", "email=https://a.b", "x=https://x.com/a\"onclick=\"y"]) assert.equal(cleanSocial(bad), "", bad);
    assert.equal(cleanSocial(Array.from({ length: 20 }, (_, i) => `mastodon=https://m${i}.example/@a`).join(" ")).split(" ").length, 1, "un seul compte par réseau");
  });
  test("flux RSS : adresse https publique obligatoire, sinon le bloc disparaît", () => {
    assert.match(sanitizeBlogHtml('<div class="kb-rss" data-url="https://exemple.org/feed.xml"></div>'), /kb-rss/);
    for (const bad of ["http://exemple.org/f", "javascript:x", "https://user:pw@exemple.org/f", "https://exemple.org:8443/f", ""]) assert.doesNotMatch(sanitizeBlogHtml(`<div class="kb-rss" data-url="${bad}"></div>`), /kb-rss/, bad);
  });
  test("les onze blocs dynamiques sont décrits (nom, classe, libellé, champs du panneau)", () => {
    assert.equal(DYNAMIC.length, 11);
    for (const d of DYNAMIC) for (const [, , , spec] of Object.values(d.attrs)) assert.ok(spec && spec.label && spec.kind, `${d.name} : champ sans description`);
  });
});

describe("blocs dynamiques — rendu", () => {
  const render = (html, extra = {}) => renderBlogHtml(sanitizeBlogHtml(html), { widgets, ...extra });
  test("derniers articles : texte échappé, image seulement de la médiathèque, date et extrait au choix", () => {
    const h = render('<div class="kb-latest" data-count="2" data-date="true" data-excerpt="true" data-image="true" data-title="Récents"></div>').html;
    assert.match(h, /<aside class="kb-latest kb-widget"[^>]*><p class="kb-widget-title">Récents<\/p>/);
    assert.match(h, /Article &lt;b&gt;un&lt;\/b&gt;/); assert.doesNotMatch(h, /<b>un/);
    assert.match(h, /kb-latest-date">1er octobre 2026/); assert.match(h, /kb-latest-excerpt">Résumé/); assert.match(h, /<img src="\/uploads\/thumbnails\/a\.png"/);
    assert.doesNotMatch(render('<div class="kb-latest"></div>').html, /kb-latest-date|<img/);
  });
  test("catégories, étiquettes (poids), archives, liste des pages, réseaux sociaux, recherche", () => {
    assert.match(render('<div class="kb-categories" data-count="true"></div>').html, /<a href="\/blog\/categorie\/marketing">Marketing<\/a> <span class="kb-widget-count">\(3\)/);
    const tags = render('<div class="kb-tags"></div>').html;
    assert.match(tags, /data-weight="5"><a href="\/blog\/etiquette\/seo"/); assert.match(tags, /data-weight="1"><a href="\/blog\/etiquette\/mail"/);
    assert.match(render('<div class="kb-archives"></div>').html, /href="\/blog\?date=2026-10">octobre 2026/);
    assert.match(render('<div class="kb-pagelist"></div>').html, /<a href="\/contact">Contact<\/a>/);
    const soc = render('<div class="kb-social" data-links="facebook=https://facebook.com/x email=mailto:a@b.co" data-size="l"></div>').html;
    assert.match(soc, /kb-social-facebook" aria-label="Facebook" target="_blank" rel="noopener noreferrer nofollow me"/); assert.match(soc, /href="mailto:a@b\.co"/); assert.match(soc, /data-size="l"/);
    const form = render('<div class="kb-search" data-placeholder="Chercher" data-button="Go"></div>').html;
    assert.match(form, /<form class="kb-search kb-widget" role="search" action="\/blog" method="get">/); assert.match(form, /name="q"/); assert.match(form, /<label class="sr-only" for="kb-search-\d+">Chercher<\/label>/);
  });
  test("derniers commentaires : auteur, extrait en texte, lien vers l'article", () => {
    const h = render('<div class="kb-comments" data-count="3"></div>').html;
    assert.match(h, /<span class="kb-comment-author">Awa<\/span> sur <a href="\/blog\/mon-article">Mon article<\/a>/);
    assert.match(h, /« Très utile &lt;b&gt;merci&lt;\/b&gt; »/);
  });
  test("calendrier : jours avec articles liés, jours vides en texte, semaine commençant le lundi", () => {
    const h = render('<div class="kb-calendar"></div>').html;
    assert.match(h, /<caption>octobre 2026<\/caption>/);
    assert.match(h, /<a href="\/blog\?date=2026-10-05" aria-label="1 article le 5 octobre">5<\/a>/);
    assert.match(h, /<a href="\/blog\?date=2026-10-12" aria-label="2 articles le 12 octobre">12<\/a>/);
    assert.match(h, /<td>6<\/td>/);
    assert.match(h, /<th scope="col"><abbr title="lundi">Lu<\/abbr>/);
    // 1er octobre 2026 = jeudi : trois cellules vides avant le 1
    assert.match(h, /<tbody><tr><td><\/td><td><\/td><td><\/td><td>1<\/td>/);
  });
  test("flux RSS : éléments du cache, liens externes en nofollow ; pas de données = rien d'affiché", () => {
    const h = render('<div class="kb-rss" data-url="https://exemple.org/feed.xml" data-date="true" data-excerpt="true"></div>').html;
    assert.match(h, /<a href="https:\/\/exemple\.org\/a" target="_blank" rel="noopener noreferrer nofollow">Dehors<\/a>/); assert.match(h, /<time datetime="2026-10-01">/);
    assert.equal(render('<div class="kb-rss" data-url="https://exemple.org/feed.xml"></div>', { widgets: { ...widgets, feed: () => ({ items: [] }) } }).html, "");
  });
  test("sans données de site (aperçu hors site), un widget n'affiche rien plutôt qu'un cadre vide", () => {
    assert.equal(renderBlogHtml(sanitizeBlogHtml('<div class="kb-latest"></div><div class="kb-categories"></div>')).html, "");
  });
  test("sommaire en bloc : niveaux choisis, ancres des titres", () => {
    const h = renderBlogHtml('<div class="kb-toc" data-depth="2"></div><h2>Un</h2><h3>Sous-partie</h3><h2>Deux</h2>').html;
    assert.match(h, /<li data-level="2"><a href="#un">Un<\/a><\/li><li data-level="2"><a href="#deux">Deux<\/a><\/li>/);
    assert.doesNotMatch(h.slice(0, h.indexOf("<h2")), /Sous-partie/);
    assert.match(renderBlogHtml('<div class="kb-toc" data-depth="3"></div><h2>Un</h2><h3>Sous-partie</h3>').html, /data-level="3"><a href="#sous-partie"/);
  });
});

describe("notes de bas de page et pages multiples", () => {
  test("notes numérotées dans l'ordre, liste en fin d'article avec lien de retour, texte échappé", () => {
    const r = renderBlogHtml('<p>A<sup class="kb-fn" data-note="Première &lt;i&gt;note&lt;/i&gt;">x</sup> et B<sup class="kb-fn" data-note="Seconde">y</sup></p>');
    assert.match(r.html, /<sup class="kb-fn-ref" id="fnref-1"><a href="#fn-1" aria-label="Note 1">1<\/a><\/sup>/);
    assert.match(r.html, /<sup class="kb-fn-ref" id="fnref-2"><a href="#fn-2" aria-label="Note 2">2<\/a><\/sup>/);
    assert.match(r.html, /<li id="fn-1" value="1">Première &lt;i&gt;note&lt;\/i&gt; <a href="#fnref-1"/);
    assert.match(r.html, /<aside class="kb-footnotes"/);
    assert.doesNotMatch(sanitizeBlogHtml('<p>x<sup class="kb-fn">sans note</sup></p>'), /kb-fn/);
    assert.doesNotMatch(sanitizeBlogHtml('<p>x<sup class="kb-fn" data-note="n" onclick="x()">1</sup></p>'), /onclick/);
  });
  test("« Page suivante » : l'article est découpé, le sommaire pointe vers la bonne page, chaque page porte ses notes", () => {
    const html = '<h2>Un</h2><p>a<sup class="kb-fn" data-note="N1">1</sup></p><div class="kb-nextpage"></div><h2>Deux</h2><p>b<sup class="kb-fn" data-note="N2">2</sup></p><div class="kb-nextpage"></div><h2>Trois</h2><p>c</p><div class="kb-toc" data-depth="2"></div>';
    const r = renderBlogHtml(sanitizeBlogHtml(html));
    assert.equal(r.pages.length, 3);
    assert.deepEqual(r.toc.map((t) => t.page), [1, 2, 3]);
    assert.match(r.pages[1], /<h2 id="deux">Deux<\/h2>/); assert.match(r.pages[1], /N2/); assert.doesNotMatch(r.pages[1], /N1/);
    assert.match(r.pages[2], /href="\?page=2#deux"/);
    assert.doesNotMatch(r.html, /kb-nextpage/);
    assert.equal(renderBlogHtml("<h2>Un</h2><p>a</p>").pages, null);
    assert.equal(renderBlogHtml('<p>a</p><div class="kb-nextpage"></div>').pages, null, "une page finale vide ne crée pas de page");
  });
});

describe("HTML personnalisé — signature", () => {
  const code = "<script>window.x=1</script><p>Mon code</p>";
  const block = (c, extra = "") => `<div class="kb-html" data-code="${customHtml.encode(c)}"${extra}></div>`;
  test("le compte créateur signe, le contenu est restitué tel quel ; une autre personne voit le bloc refusé", () => {
    const signed = customHtml.signBlocks(block(code), { allowed: true });
    assert.match(signed, /data-sig=/);
    assert.match(renderBlogHtml(sanitizeBlogHtml(signed)).html, /<div class="kb-html-block"><script>window\.x=1<\/script><p>Mon code<\/p><\/div>/);
    assert.equal(sanitizeBlogHtml(customHtml.signBlocks(block(code), { allowed: false })), "");
  });
  test("signature falsifiée, copiée sur un autre code, ou code modifié après signature : refusé", () => {
    const signed = customHtml.signBlocks(block(code), { allowed: true });
    const sig = /data-sig="([^"]+)"/.exec(signed)[1];
    assert.equal(sanitizeBlogHtml(block(code, ' data-sig="AAAA"')), "");
    assert.equal(sanitizeBlogHtml(block("<script>evil()</script>", ` data-sig="${sig}"`)), "");
    assert.equal(sanitizeBlogHtml(customHtml.signBlocks(block("<script>evil()</script>", ` data-sig="${sig}"`), { allowed: false })), "");
  });
  test("une valeur injectée en base sans signature n'est jamais restituée ; les flux et le texte brut ne contiennent pas le code", () => {
    assert.doesNotMatch(renderBlogHtml(block(code)).html, /script/);
    const signed = sanitizeBlogHtml(customHtml.signBlocks(block(code), { allowed: true }));
    assert.doesNotMatch(renderBlogHtml(signed, { allowCustomHtml: false }).html, /script|Mon code/);
    assert.doesNotMatch(blogPlainText(signed), /Mon code|window/);
    const r = renderBlogHtml(`<p>un deux trois</p>${signed}`);
    assert.equal(r.words, 3, "le code n'est pas compté dans les mots de l'article");
  });
  test("sans clé de chiffrement le bloc est indisponible (jamais signé)", () => {
    const keep = process.env.ENCRYPTION_KEY; delete process.env.ENCRYPTION_KEY;
    try { assert.equal(customHtml.available(), false); assert.equal(sanitizeBlogHtml(customHtml.signBlocks(block(code), { allowed: true })), ""); } finally { process.env.ENCRYPTION_KEY = keep; }
  });
});

describe("blocs dynamiques — isolation entre sites et pages publiées", () => {
  let srv, boss, db, A, B;
  const json = (r) => JSON.parse(r.text);
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const term = async (name, qs = "") => json(await boss.postJson(`/formateur/blog/api/termes${qs}`, { taxonomy: "category", name })).term.id;
  async function article(title, content, { qs = "", categoryId = null, extra = {} } = {}) {
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", title, content, status: "published", ...(categoryId ? { category_ids: String(categoryId), primary_category_id: String(categoryId) } : {}), ...extra })) fd.append(k, v);
    const saved = json(await boss.request(`/formateur/blog/nouveau${qs}`, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }));
    assert.ok(saved.id, JSON.stringify(saved));
    return saved;
  }
  const page = async (slug, qs = "") => { const r = await fetch(`${srv.base}/blog/${slug}${qs}`); return { status: r.status, html: await r.text() }; };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
  });
  after(() => srv.stop());

  test("« Derniers articles », « Catégories » et « Archives » d'un site ne montrent JAMAIS les contenus d'un autre site", async () => {
    const [catA, catB, catMain] = [await term("Cat Alpha", `?site=${A}`), await term("Cat Beta", `?site=${B}`), await term("Cat Principal")];
    await article("Secret Alpha", "<p>x</p>", { qs: `?site=${A}`, categoryId: catA });
    await article("Public principal", "<p>x</p>", { categoryId: catMain });
    await article("Autre article Beta", "<p>x</p>", { qs: `?site=${B}`, categoryId: catB });
    const region = (html) => html.slice(html.indexOf('article-content">'), html.indexOf("<p>FIN-ARTICLE</p>")); // le contenu de l'article seulement (la colonne latérale du thème a ses propres règles)
    const widgetsHtml = '<div class="kb-latest" data-count="10"></div><div class="kb-categories" data-count="true"></div><div class="kb-archives"></div><div class="kb-pagelist"></div><p>FIN-ARTICLE</p>';
    const inB = await article("Article Beta", widgetsHtml, { qs: `?site=${B}`, categoryId: catB });
    const b = region((await page(inB.slug)).html);
    assert.match(b, /Autre article Beta/); assert.match(b, /Cat Beta/);
    assert.doesNotMatch(b, /Secret Alpha|Public principal|Cat Alpha|Cat Principal/);
    assert.doesNotMatch(b, /À propos|Catalogue/, "la liste des pages d'un site ne reprend pas les pages du site principal");
    const inMain = await article("Article principal 2", '<div class="kb-latest" data-count="10"></div><div class="kb-categories"></div><p>FIN-ARTICLE</p>', { categoryId: catMain });
    const m = region((await page(inMain.slug)).html);
    assert.match(m, /Public principal/); assert.match(m, /Cat Principal/);
    assert.doesNotMatch(m, /Secret Alpha|Article Beta|Autre article Beta|Cat Alpha|Cat Beta/);
    assert.doesNotMatch(m, /Article principal 2<\/a>/, "l'article lui-même n'est pas listé");
  });

  test("« Derniers commentaires » : seulement les commentaires approuvés des articles du même site", async () => {
    const mk = async (title, qs = "") => article(title, "<p>x</p>", { qs });
    const a = await mk("Article com Alpha", `?site=${A}`); const b = await mk("Article com Beta", `?site=${B}`);
    const add = (postId, name, body, status = "approved") => db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, author_name, body, status) VALUES (?, 'post', ?, ?, ?, ?)").run(postId, postId, name, body, status);
    add(a.id, "Lecteur Alpha", "Commentaire secret Alpha"); add(b.id, "Lecteur Beta", "Commentaire visible Beta"); add(b.id, "Spammeur", "Commentaire en attente", "pending");
    const widget = await article("Page widget commentaires", '<div class="kb-comments" data-count="10"></div><p>FIN-ARTICLE</p>', { qs: `?site=${B}` });
    const html = (await page(widget.slug)).html;
    const region = html.slice(html.indexOf('article-content">'), html.indexOf("<p>FIN-ARTICLE</p>"));
    assert.match(region, /Lecteur Beta/); assert.match(region, /Commentaire visible Beta/);
    assert.doesNotMatch(region, /secret Alpha|Lecteur Alpha|en attente|Spammeur/);
  });

  test("pages multiples : ?page=N, navigation, sommaire par page, canonique propre à chaque page", async () => {
    const art = await article("Guide en pages", '<h2>Début</h2><p>un</p><div class="kb-nextpage"></div><h2>Milieu</h2><p>deux</p><div class="kb-nextpage"></div><h2>Fin</h2><p>trois</p><div class="kb-toc" data-depth="2"></div>');
    const p1 = (await page(art.slug)).html;
    assert.match(p1, /Début/); assert.doesNotMatch(p1.slice(p1.indexOf('class="markdown article-content"')), /<h2 id="milieu"/);
    assert.match(p1, /<nav class="article-pages"/); assert.match(p1, /Page 1 sur 3/); assert.match(p1, /rel="next" href="\?page=2"/);
    const p2 = (await page(art.slug, "?page=2")).html;
    assert.match(p2, /<h2 id="milieu">Milieu<\/h2>/); assert.match(p2, /Page 2 sur 3/); assert.match(p2, /rel="prev" href="\?page=1"/); assert.match(p2, /rel="canonical" href="[^"]*\?page=2"/);
    assert.match((await page(art.slug, "?page=99")).html, /Page 1 sur 3/, "numéro hors limites : première page");
  });

  test("archives par date : ?date=AAAA-MM filtre la liste du blog ; valeur piégée ignorée", async () => {
    await article("Article d'octobre", "<p>x</p>");
    db.prepare("UPDATE posts SET published_at = '2026-10-05 10:00:00' WHERE title = 'Article d''octobre'").run();
    db.prepare("UPDATE posts SET published_at = '2026-03-02 10:00:00' WHERE title = 'Public principal'").run();
    const octRes = await fetch(`${srv.base}/blog?date=2026-10`);
    const oct = await octRes.text();
    assert.equal(octRes.status, 200, srv.log().slice(-1500));
    assert.match(oct, /Article d&#39;octobre|Article d'octobre/); assert.doesNotMatch(oct, /Public principal/);
    assert.match(oct, /noindex, follow/);
    const bad = await (await fetch(`${srv.base}/blog?date=2026-13'%20OR%201=1`)).text();
    assert.match(bad, /Public principal/, "une date invalide est ignorée");
  });

  test("HTML personnalisé : le compte créateur l'enregistre (signé) et il est publié ; une valeur injectée en base ne l'est pas", async () => {
    const code = '<p id="mon-widget">Widget</p><script>window.__kb = 1</script>';
    const art = await article("Avec HTML", `<p>Avant</p><div class="kb-html" data-code="${customHtml.encode(code)}"></div>`);
    const stored = one("SELECT content FROM posts WHERE id = ?", art.id).content;
    assert.match(stored, /data-sig=/);
    const pub = (await page(art.slug)).html;
    assert.match(pub, /<div class="kb-html-block"><p id="mon-widget">Widget<\/p><script>window\.__kb = 1<\/script><\/div>/);
    db.prepare("UPDATE posts SET content = ? WHERE id = ?").run(`<p>Avant</p><div class="kb-html" data-code="${customHtml.encode("<script>pirate()</script>")}" data-sig="AAAA"></div>`, art.id);
    assert.doesNotMatch((await page(art.slug)).html, /pirate/);
    // Flux RSS du blog : jamais de script
    const feed = await (await fetch(`${srv.base}/blog/flux.xml`)).text().catch(() => "");
    assert.doesNotMatch(feed, /window\.__kb/);
  });

  test("l'aperçu d'un flux RSS est réservé au compte créateur et refuse les adresses internes", async () => {
    const bad = await boss.get("/formateur/blog/api/flux?url=" + encodeURIComponent("https://127.0.0.1/feed"));
    assert.equal(bad.status, 400);
    const internal = await boss.get("/formateur/blog/api/flux?url=" + encodeURIComponent("http://exemple.org/feed"));
    assert.equal(internal.status, 400);
    const student = await newStudent(srv);
    assert.notEqual((await student.get("/formateur/blog/api/flux?url=" + encodeURIComponent("https://exemple.org/feed.xml"))).status, 200, "un élève ne déclenche aucune requête sortante");
  });
});
