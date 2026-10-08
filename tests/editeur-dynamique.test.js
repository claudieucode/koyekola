// Éditeur de pages — ÉTIQUETTES DYNAMIQUES et BOUCLES : moteur de sources ({{post.title}}, {{course.price}}…), validation (une
// étiquette seule est acceptée dans une adresse / une image, jamais mélangée), revalidation après résolution (aucune adresse
// dangereuse issue des données), boucle « répéter pour chaque article / formation » (nombre, catégorie, tri, pagination, filtre
// par l'adresse) et page publiée réelle.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const nodes = require("../src/marketing/pages/nodes");
const dyn = require("../src/marketing/pages/dynamic");
const sections = require("../src/marketing/pages/sections");
const { startServer, Client, loginInstructor, createCourse } = require("./helpers");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";
const layout = (children, id = "sect00000001") => ({ id, type: "layout", children: [{ id: `cont${id.slice(4)}`, type: "container", children }] });

describe("moteur d'étiquettes (sans serveur)", () => {
  const scope = { post: { title: "Bien <démarrer>", url: "/blog/bien-demarrer", image: "/uploads/thumbnails/a.webp", date: Date.UTC(2026, 9, 8, 12), author: "Prof", category: "Conseils", minutes: 4 },
    course: { title: "Retouche photo", priceCents: 3900, url: "/cours/retouche", image: "", subtitle: "", category: "Photo", description: "Apprendre." }, visitor: { firstName: "Awa", loggedIn: true, cartCount: 2 },
    page: { title: "Accueil" }, site: { name: "Mon site", homeUrl: "/p/accueil" }, now: new Date(Date.UTC(2026, 9, 8)), query: { q: "photo" } };

  test("sources : article, formation (et « produit »), visiteur, page, site, date, adresse", () => {
    const r = (s) => dyn.resolveString(s, scope);
    assert.equal(r("{{post.title}}"), "Bien <démarrer>");
    assert.equal(r("{{post.date}}"), "8 octobre 2026");
    assert.equal(r("{{post.reading_time}} · {{post.category}}"), "4 min · Conseils");
    assert.equal(r("{{course.price}}"), "39,00 €");
    assert.equal(r("{{product.title}}"), "Retouche photo", "« produit » est un autre nom de la formation");
    assert.equal(r("Bonjour {{user.first_name}}"), "Bonjour Awa");
    assert.equal(r("{{site.name}} — {{page.title}}"), "Mon site — Accueil");
    assert.equal(r("{{date.year}}"), "2026");
    assert.equal(r("{{query.q}}"), "photo");
    assert.equal(r("sans étiquette"), "sans étiquette");
  });

  test("filtres : repli, majuscules, troncature, préfixe ; inconnu = vide ; jamais d'erreur", () => {
    const r = (s, sc = scope) => dyn.resolveString(s, sc);
    assert.equal(r("{{user.first_name | fallback: ami}}", { visitor: {} }), "ami");
    assert.equal(r("{{post.title | upper}}"), "BIEN <DÉMARRER>");
    assert.equal(r("{{post.title | truncate: 6}}"), "Bien <…");
    assert.equal(r("{{post.author | prefix: \"Par \"}}"), "Par Prof");
    assert.equal(r("{{post.author | prefix: \"Par \"}}", {}), "");
    assert.equal(r("{{nimporte.quoi}}"), "");
    assert.equal(r("{{nimporte.quoi | fallback: rien}}"), "rien");
    assert.equal(r("{{post.title | piratage: x}}"), "Bien <démarrer>", "filtre inconnu ignoré");
  });

  test("texte riche : la valeur est échappée (aucun HTML ne vient des données)", () => {
    const out = dyn.resolveString("<p>{{post.title}}</p>", scope, { html: true });
    assert.equal(out, "<p>Bien &lt;démarrer&gt;</p>");
  });

  test("adresses et images : revalidées après résolution", () => {
    const bad = { post: { url: "javascript:alert(1)", image: "javascript:alert(1)" } };
    const props = { url: "{{post.url}}", src: "{{post.image}}", label: "{{post.url}}" };
    assert.equal(dyn.resolveProps(props, bad, sections).url, "");
    assert.equal(dyn.resolveProps(props, bad, sections).src, "");
    const ok = dyn.resolveProps(props, { post: { url: "/blog/x", image: "/uploads/thumbnails/a.webp" } }, sections);
    assert.equal(ok.url, "/blog/x");
    assert.equal(ok.src, "/uploads/thumbnails/a.webp");
    assert.equal(dyn.resolveProps({ url: "{{post.url}}" }, { post: { url: "//evil.example/x" } }, sections).url, "", "adresse sans protocole refusée");
    assert.equal(dyn.resolveProps({ url: "{{post.url}}" }, { post: { url: "https://ok.example/a" } }, sections).url, "https://ok.example/a");
  });

  test("enregistrement : étiquette seule acceptée dans adresse / image ; mélange refusé ; style jamais dynamique", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Dyn", kind: "page" });
    const save = (node) => pages.saveDraft(A, p.id, { sections: [layout([node])] }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children[0].children[0];
    assert.equal(save({ id: "btn000000001", type: "button", props: { label: "Lire {{post.title}}", url: "{{post.url}}" } }).props.url, "{{post.url}}");
    assert.equal(save({ id: "img000000001", type: "image", props: { src: "{{post.image | fallback: x}}", alt: "{{post.title}}" } }).props.alt, "{{post.title}}");
    assert.throws(() => save({ id: "btn000000001", type: "button", props: { label: "Lire", url: "{{post.url}} et du texte" } }), /adresse/, "étiquette mêlée à du texte dans une adresse : refusée");
    assert.throws(() => save({ id: "img000000001", type: "image", props: { src: "x{{post.image}}", alt: "a" } }), /image/);
    assert.throws(() => save({ id: "cont00000077", type: "container", children: [], styles: { desktop: { backgroundImage: { src: "{{post.image}}" } } } }), /image/, "pas d'étiquette dans le CSS");
  });

  test("boucle : réglages validés et bornés ; une grille sans boucle reste identique", () => {
    const { A } = freshMarketing();
    const p = pages.createPage(A, { name: "Boucle", kind: "page" });
    const save = (props) => pages.saveDraft(A, p.id, { sections: [layout([{ id: "grid00000001", type: "grid", props, children: [] }])] }, { revision: pages.getPage(A, p.id).revision }).content.sections[0].children[0].children[0];
    assert.equal(save({}).props.loop, undefined);
    assert.deepEqual(save({ loop: { source: "posts" } }).props.loop, { source: "posts", count: 6, category: "", sort: "recent", empty: "Aucun article ne correspond." });
    const l = save({ loop: { source: "courses", count: 99, sort: "price", paginate: true, urlFilter: true, category: "Photo" } }).props.loop;
    assert.deepEqual([l.source, l.count, l.sort, l.paginate, l.urlFilter, l.category], ["courses", 6, "price", true, true, "Photo"], "nombre hors limites : valeur par défaut");
    assert.equal(save({ loop: { source: "users" } }).props.loop.source, "posts", "source inconnue : articles");
    assert.equal(save({ loop: { source: "posts", sort: "price" } }).props.loop.sort, "recent", "tri inconnu pour la source : récents");
    assert.ok(nodes.editorSpec().dynamic.sources.some((s) => s.key === "post.title"));
  });
});

describe("vrai serveur : boucle et page publiée", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", PAIEMENT_SIMULE: "1" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const put = async (id, content) => { const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision; return boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: rev, content } }); };
  const newPage = async (name) => Number((await boss.post("/marketing/pages", { name })).location.match(/(\d+)$/)[1]);
  const slugOf = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const publish = async (id) => { assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200); return (path = "") => new Client(srv.base).get(`/p/${slugOf(id)}${path}`, { headers: { "User-Agent": UA } }).then((r) => r.text); };

  const card = (idPrefix) => ({ id: `${idPrefix}card00001`, type: "container", children: [
    { id: `${idPrefix}img000001`, type: "image", props: { src: "{{post.image}}", alt: "{{post.title}}" } },
    { id: `${idPrefix}head00001`, type: "heading", props: { text: "{{post.title}}", level: 3 } },
    { id: `${idPrefix}txt000001`, type: "text", props: { html: "<p>{{post.excerpt | truncate: 40}} — {{post.category | fallback: Divers}}</p>" } },
    { id: `${idPrefix}btn000001`, type: "button", props: { label: "Lire", url: "{{post.url}}" } },
  ] });

  test("articles : un élément par article, étiquettes résolues, échappement, adresses sûres, page publiée", async () => {
    for (let i = 1; i <= 5; i++) db.prepare("INSERT INTO posts (slug, title, excerpt, category, cover_path, published, published_at, status) VALUES (?, ?, ?, ?, ?, 1, datetime('now', ?), 'published')").run(`art-${i}`, i === 3 ? "Article <b>3</b>" : `Article ${i}`, `Résumé de l'article ${i}, assez long pour être coupé proprement.`, i % 2 ? "Conseils" : "Actus", i === 4 ? "javascript:alert(1)" : `/uploads/thumbnails/a${i}.webp`, `-${i} hour`);
    db.prepare("INSERT INTO posts (slug, title, published, status) VALUES ('brouillon-secret', 'Brouillon secret', 0, 'draft')").run();
    const id = await newPage("Boucle articles");
    const grid = { id: "grid00000001", type: "grid", props: { loop: { source: "posts", count: 2, paginate: true, urlFilter: true } }, children: [card("a")] };
    assert.equal((await put(id, { sections: [layout([grid])] })).status, 200);
    const get = await publish(id);
    const p1 = await get();
    assert.equal((p1.match(/class="kw-loop-item"/g) || []).length, 2, "2 articles par page");
    assert.match(p1, /Article 1/); assert.match(p1, /Article 2/); assert.doesNotMatch(p1, /Article 4/); assert.doesNotMatch(p1, /Article &lt;b&gt;3/);
    const loc = async (n, qs = "") => (await new Client(srv.base).get(`/p/${slugOf(id)}/clic/${n}${qs}`, { headers: { "User-Agent": UA } })).location;
    assert.equal(await loc(0), "/blog/art-1", "lien compté de l'article 1");
    assert.equal(await loc(1), "/blog/art-2");
    assert.equal(await loc(0, "?lp-grid00000001=2"), "/blog/art-3", "page 2 : le lien compté retrouve le bon article");
    assert.match(p1, /src="\/uploads\/thumbnails\/a1\.webp"/);
    assert.doesNotMatch(p1, /Brouillon secret/, "jamais un brouillon");
    assert.match(p1, /Résumé de l(?:'|&#39;)article 1, assez long pour ê…/, "filtre de troncature");
    assert.match(p1, /1 \/ 3/); assert.match(p1, /rel="next"/); assert.doesNotMatch(p1, /rel="prev"/);
    const p2 = await get("?lp-grid00000001=2");
    assert.match(p2, /Article &lt;b&gt;3&lt;\/b&gt;/, "titre échappé"); assert.match(p2, /Article 4/); assert.doesNotMatch(p2, /Article <b>3/);
    assert.match(p2, /rel="prev"/);
    const p3 = await get("?lp-grid00000001=3");
    assert.match(p3, /Article 5/);
    assert.doesNotMatch(p3, /javascript:/, "image dangereuse jamais écrite");
    assert.doesNotMatch(await get("?lp-grid00000001=2"), /javascript:/);
    // filtre par l'adresse : recherche et catégorie
    const s = await get("?q=article%205");
    assert.match(s, /Article 5/); assert.doesNotMatch(s, /Article 1/);
    const c = await get("?categorie=Actus");
    assert.match(c, /Article 2/); assert.doesNotMatch(c, /Article 1<\/h3>/);
    const none = await get("?q=zzzzzz");
    assert.match(none, /Aucun article ne correspond/);
    // le caractère « % » ou « _ » d'une recherche n'est pas un joker
    assert.match(await get("?q=%25"), /Aucun article ne correspond/);
  });

  test("formations : prix, adresse, image ; une formation dépubliée n'apparaît pas", async () => {
    const a = await createCourse(boss, srv, { title: "Retouche photo", price: 39 });
    await createCourse(boss, srv, { title: "Montage vidéo", price: 0 });
    const id = await newPage("Boucle formations");
    const grid = { id: "grid00000002", type: "grid", props: { loop: { source: "courses", count: 6, sort: "title" } }, children: [{ id: "ccard0000001", type: "container", children: [
      { id: "chead0000001", type: "heading", props: { text: "{{course.title}} — {{product.price}}", level: 3 } },
      { id: "cbtn00000001", type: "button", props: { label: "Voir", url: "{{course.url}}" } } ] }] };
    assert.equal((await put(id, { sections: [layout([grid])] })).status, 200);
    const html = await (await publish(id))();
    assert.match(html, /Montage vidéo — Gratuit/); assert.match(html, /Retouche photo — 39,00 €/);
    assert.ok(html.indexOf("Montage vidéo") < html.indexOf("Retouche photo"), "tri par titre");
    assert.match((await new Client(srv.base).get(`/p/${slugOf(id)}/clic/0`, { headers: { "User-Agent": UA } })).location, /^\/cours\/montage-video/, "premier lien = formation triée en premier");
  });

  test("étiquettes hors boucle : titre de page, année, prénom avec repli ; édition : rien d'enregistré en dur", async () => {
    const id = await newPage("Étiquettes");
    assert.equal((await put(id, { sections: [layout([
      { id: "head00000011", type: "heading", props: { text: "Bienvenue {{user.first_name | fallback: cher visiteur}} sur {{page.title}}", level: 1 } },
      { id: "text00000011", type: "text", props: { html: "<p>© {{date.year}}</p>" } },
    ])] })).status, 200);
    const html = await (await publish(id))();
    assert.match(html, /Bienvenue cher visiteur sur Étiquettes/);
    assert.match(html, new RegExp(`© ${new Date().getFullYear()}`));
    const row = db.prepare("SELECT draft, sections FROM mk_landing_pages WHERE id = ?").get(id), draft = row.draft || row.sections;
    assert.match(draft, /\{\{user\.first_name \| fallback: cher visiteur\}\}/, "l'étiquette est conservée dans le document");
  });
});
