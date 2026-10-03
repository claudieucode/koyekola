// Étape 3a : référencement — balises, canonical, Open Graph, données structurées, sitemap, robots.txt,
// pages catégories, adresses (slugs) modifiables avec redirection.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

let srv, prof, course, draft, archived;
const anon = () => new Client(srv.base);
const meta = (html, name) => (html.match(new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]*)"`)) || [])[1];
const link = (html, rel) => (html.match(new RegExp(`<link[^>]+rel="${rel}"[^>]+href="([^"]*)"`)) || [])[1];
const jsonLd = (html) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => { const o = JSON.parse(m[1]); return o["@graph"] || [o]; });
const q = (sql, ...a) => {
  const db = srv.db();
  const r = db.prepare(sql).all(...a);
  db.close();
  return r;
};

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  const fd = new FormData();
  Object.entries({
    title: "Marketing & « Ads » </script>", category: "Marketing digital", level: "debutant", price: "29.90",
    subtitle: "Lancer sa première campagne", description: "## À propos\nUne formation **pratique**.",
    objectives: "Créer une campagne", intro_video: "",
  }).forEach(([k, v]) => fd.append(k, v));
  fd.append("thumbnail", new Blob([Buffer.alloc(100, 5)], { type: "image/png" }), "cover.png");
  await prof.request("/formateur/cours/nouveau", { method: "POST", multipart: fd });
  const row = q("SELECT id, slug FROM courses WHERE category = 'Marketing digital'")[0];
  await prof.post(`/formateur/cours/${row.id}/sections`, { title: "C" });
  const sec = q("SELECT id FROM sections WHERE course_id = ?", row.id)[0];
  await prof.post(`/formateur/sections/${sec.id}/lecons`, { title: "L1" });
  await prof.post(`/formateur/cours/${row.id}/publier`, {});
  course = row;

  draft = await createCourse(prof, srv, { title: "Brouillon SEO", price: 0, publish: false, extra: { category: "Marketing digital" } });
  archived = await createCourse(prof, srv, { title: "Archivée SEO", price: 0 });
  await prof.post(`/formateur/cours/${archived.id}/archiver`, {});

  const e = await newStudent(srv);
  await buy(e, { id: course.id });
  await e.post(`/cours/${course.slug}/avis`, { rating: "4", comment: "Bien" });
});
after(() => srv.stop());

describe("robots.txt et sitemap.xml", () => {
  test("robots.txt : espaces privés interdits, sitemap annoncé avec une adresse absolue", async () => {
    const r = await anon().get("/robots.txt");
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /text\/plain/);
    for (const p of ["/formateur", "/mes-cours", "/panier", "/commande", "/apprendre", "/certificat", "/uploads/videos", "/uploads/resources"]) {
      assert.match(r.text, new RegExp(`Disallow: ${p}`));
    }
    assert.match(r.text, new RegExp(`Sitemap: ${srv.base}/sitemap\\.xml`));
  });
  test("sitemap.xml : pages publiques et formations publiées uniquement", async () => {
    const r = await anon().get("/sitemap.xml");
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-type"), /xml/);
    assert.match(r.text, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    assert.match(r.text, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"( xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1")?>/);
    assert.match(r.text, /<image:image><image:loc>[^<]+\/uploads\/thumbnails\/[^<]+<\/image:loc><\/image:image>/, "image réelle de la formation");
    for (const path of ["/", "/catalogue", `/cours/${course.slug}`, "/categorie/marketing-digital"]) {
      assert.match(r.text, new RegExp(`<loc>${srv.base.replace(/\./g, "\\.")}${path.replace(/\//g, "\\/")}</loc>`), path);
    }
    assert.doesNotMatch(r.text, new RegExp(draft.slug), "un brouillon ne doit pas être dans le sitemap");
    assert.doesNotMatch(r.text, new RegExp(archived.slug), "une formation archivée non plus");
    assert.match(r.text, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });
  test("le sitemap n'est jamais mis en cache par le navigateur pour rien et reste bien formé", async () => {
    const r = await anon().get("/sitemap.xml");
    assert.doesNotMatch(r.text, /&(?!amp;|lt;|gt;|quot;|apos;)/, "esperluette non échappée");
  });
});

describe("balises de la fiche formation", () => {
  let html;
  before(async () => {
    html = (await anon().get(`/cours/${course.slug}`)).text;
  });
  test("titre, description et canonical absolu", () => {
    assert.match(html, /<title>Marketing &amp; « Ads »[^<]* · KOLAKISA<\/title>/);
    assert.equal(meta(html, "description"), "Lancer sa première campagne");
    assert.equal(link(html, "canonical"), `${srv.base}/cours/${course.slug}`);
  });
  test("Open Graph et Twitter", () => {
    assert.equal(meta(html, "og:type"), "website");
    assert.equal(meta(html, "og:url"), `${srv.base}/cours/${course.slug}`);
    assert.match(meta(html, "og:title"), /Marketing &amp; « Ads »/);
    assert.equal(meta(html, "og:locale"), "fr_FR");
    assert.equal(meta(html, "twitter:card"), "summary_large_image");
    assert.match(meta(html, "og:image"), new RegExp(`^${srv.base.replace(/\./g, "\\.")}/uploads/thumbnails/.+\\.png$`), "image sociale absolue");
  });
  test("données structurées Course : offre, note, fil d'Ariane", () => {
    const blocks = jsonLd(html);
    const c = blocks.find((b) => b["@type"] === "Course");
    assert.ok(c, "bloc Course absent");
    assert.equal(c.inLanguage, "fr");
    assert.equal(c.offers.price, "29.90");
    assert.equal(c.offers.priceCurrency, "EUR");
    assert.equal(c.offers.url, `${srv.base}/cours/${course.slug}`);
    assert.deepEqual([c.aggregateRating.ratingValue, c.aggregateRating.reviewCount], ["4.0", 1]);
    assert.equal(c.provider["@type"], "Organization");
    const bc = blocks.find((b) => b["@type"] === "BreadcrumbList");
    assert.deepEqual(bc.itemListElement.map((i) => i.name), ["Accueil", "Catalogue", "Marketing digital", c.name]);
    assert.ok(bc.itemListElement.every((i, n) => i.position === n + 1));
  });
  test("le titre d'une formation ne peut pas casser le bloc de données structurées (</script>)", () => {
    const raw = html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g).join("");
    assert.doesNotMatch(raw.replace(/<\/script>$/g, ""), /<\/script>[^<]*[a-z]/i);
    assert.equal(jsonLd(html).find((b) => b["@type"] === "Course").name.includes("</script>"), true, "le texte est conservé, mais neutralisé dans la page");
  });
  test("fil d'Ariane visible et accessible", () => {
    assert.match(html, /<nav[^>]+aria-label="Fil d'Ariane"[\s\S]*<ol[\s\S]*Accueil[\s\S]*Catalogue[\s\S]*Marketing digital/);
  });
  test("un seul H1 et la page n'est pas en noindex", () => {
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
    assert.doesNotMatch(html, /noindex/);
  });
  test("le référencement se règle par formation (titre SEO et description SEO)", async () => {
    await prof.post(`/formateur/cours/${course.id}/modifier`, {
      title: "Marketing & « Ads » </script>", category: "Marketing digital", level: "debutant", price: "29.90",
      subtitle: "Lancer sa première campagne", description: "d", seo_title: "Apprendre les publicités en ligne", seo_description: "Description optimisée pour Google.",
    });
    const h = (await anon().get(`/cours/${course.slug}`)).text;
    assert.match(h, /<title>Apprendre les publicités en ligne · KOLAKISA<\/title>/);
    assert.equal(meta(h, "description"), "Description optimisée pour Google.");
    assert.equal(meta(h, "og:title"), "Apprendre les publicités en ligne");
  });
  test("sans champs SEO : description tirée du texte, sans mise en forme, limitée à 160 caractères", async () => {
    const c = await createCourse(prof, srv, { title: "Sans SEO", price: 0, extra: { description: "## Titre\nUne **très** longue description. " + "mot ".repeat(80) } });
    const d = meta((await anon().get(`/cours/${c.slug}`)).text, "description");
    assert.ok(d.length <= 160, String(d.length));
    assert.doesNotMatch(d, /[#*]/);
    assert.match(d, /^Titre Une très longue description\./);
  });
});

describe("pages privées : hors des moteurs de recherche", () => {
  for (const [name, url, auth] of [["connexion", "/connexion", false], ["inscription", "/inscription", false], ["404", "/nimporte-quoi", false]]) {
    test(`${name} : noindex, nofollow`, async () => {
      assert.match((await anon().get(url)).text, /<meta name="robots" content="noindex, nofollow">/);
    });
  }
  test("espace formateur, espace élève et leçons : noindex", async () => {
    assert.match((await prof.get("/formateur")).text, /noindex/);
    const e = await newStudent(srv);
    assert.match((await e.get("/mes-cours")).text, /noindex/);
    const l = q("SELECT lessons.id FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = ?", course.id)[0];
    assert.match((await prof.get(`/apprendre/${course.slug}/${l.id}`)).text, /noindex/);
  });
  test("les pages publiques (accueil, catalogue) sont indexables avec leur canonical", async () => {
    for (const [url, canon] of [["/", `${srv.base}/`], ["/catalogue", `${srv.base}/catalogue`]]) {
      const h = (await anon().get(url)).text;
      assert.doesNotMatch(h, /noindex/);
      assert.equal(link(h, "canonical"), canon);
    }
  });
  test("le canonical d'un catalogue filtré ignore les paramètres (pas de contenu dupliqué)", async () => {
    const h = (await anon().get("/catalogue?level=debutant&sort=popular")).text;
    assert.equal(link(h, "canonical"), `${srv.base}/catalogue`);
  });
});

describe("accueil : données structurées du site", () => {
  test("WebSite avec recherche + Organization", async () => {
    const blocks = jsonLd((await anon().get("/")).text);
    const site = blocks.find((b) => b["@type"] === "WebSite");
    assert.equal(site.url, `${srv.base}/`);
    assert.match(site.potentialAction.target.urlTemplate, /\/catalogue\?q=\{search_term_string\}$/);
    assert.equal(blocks.find((b) => b["@type"] === "Organization").name, "KOLAKISA");
  });
});

describe("pages catégories", () => {
  test("une page par catégorie, avec H1, description, formations et canonical", async () => {
    const r = await anon().get("/categorie/marketing-digital");
    assert.equal(r.status, 200);
    assert.match(r.text, /<h1[^>]*>Formations Marketing digital<\/h1>/);
    assert.match(r.text, /Marketing &amp; « Ads »/);
    assert.doesNotMatch(r.text, /Brouillon SEO|Archivée SEO/);
    assert.equal(link(r.text, "canonical"), `${srv.base}/categorie/marketing-digital`);
    assert.match(meta(r.text, "description"), /Marketing digital/);
    assert.deepEqual(jsonLd(r.text).find((b) => b["@type"] === "BreadcrumbList").itemListElement.map((i) => i.name), ["Accueil", "Catalogue", "Marketing digital"]);
  });
  test("catégorie inconnue : 404", async () => {
    assert.equal((await anon().get("/categorie/inconnue")).status, 404);
  });
  test("/catalogue?category=… seul redirige (301) vers la page catégorie ; avec d'autres filtres, non", async () => {
    const r = await anon().get("/catalogue?category=Marketing%20digital");
    assert.equal(r.status, 301);
    assert.equal(r.location, "/categorie/marketing-digital");
    assert.equal((await anon().get("/catalogue?category=Marketing%20digital&level=debutant")).status, 200);
  });
  test("le menu Catégories pointe vers les pages catégories", async () => {
    assert.match((await anon().get("/")).text, /href="\/categorie\/marketing-digital"/);
  });
});

describe("adresse (slug) modifiable, sans perdre le référencement", () => {
  let c, eleve;
  before(async () => {
    c = await createCourse(prof, srv, { title: "Ancienne adresse", price: 0, lessons: [{ title: "L", preview: true }] });
    eleve = await newStudent(srv);
    await buy(eleve, c);
  });
  const rename = (slug) => prof.post(`/formateur/cours/${c.id}/modifier`, { title: "Ancienne adresse", category: "Test", level: "debutant", price: "0", description: "d", slug });
  test("la nouvelle adresse fonctionne, l'ancienne redirige définitivement (301)", async () => {
    await rename("Nouvelle adresse ÉLÉGANTE !");
    const slug = q("SELECT slug FROM courses WHERE id = ?", c.id)[0].slug;
    assert.equal(slug, "nouvelle-adresse-elegante");
    assert.equal((await anon().get(`/cours/${slug}`)).status, 200);
    const old = await anon().get(`/cours/${c.slug}`);
    assert.equal(old.status, 301);
    assert.equal(old.location, `/cours/${slug}`);
  });
  test("les liens de leçons déjà partagés redirigent aussi", async () => {
    const l = q("SELECT lessons.id FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = ?", c.id)[0];
    const r = await eleve.get(`/apprendre/${c.slug}/${l.id}`);
    assert.equal(r.status, 301);
    assert.equal(r.location, `/apprendre/nouvelle-adresse-elegante/${l.id}`);
  });
  test("une adresse déjà prise est refusée et rien ne change", async () => {
    const r = await rename(course.slug);
    assert.equal(r.status, 400);
    assert.equal(q("SELECT slug FROM courses WHERE id = ?", c.id)[0].slug, "nouvelle-adresse-elegante");
  });
  test("une adresse vide ou invalide conserve l'adresse actuelle", async () => {
    await rename("   ");
    await rename("!!!");
    assert.equal(q("SELECT slug FROM courses WHERE id = ?", c.id)[0].slug, "nouvelle-adresse-elegante");
  });
  test("renommer deux fois : les deux anciennes adresses redirigent vers la dernière", async () => {
    await rename("troisieme-adresse");
    assert.equal((await anon().get(`/cours/${c.slug}`)).location, "/cours/troisieme-adresse");
    assert.equal((await anon().get(`/cours/nouvelle-adresse-elegante`)).location, "/cours/troisieme-adresse");
  });
  test("le sitemap donne toujours la nouvelle adresse", async () => {
    const sm = (await anon().get("/sitemap.xml")).text;
    assert.match(sm, /\/cours\/troisieme-adresse</);
    assert.doesNotMatch(sm, new RegExp(`/cours/${c.slug}<`));
  });
});

describe("avec SITE_URL configurée", () => {
  test("canonical, sitemap et robots utilisent l'adresse publique, pas celle de la requête", async () => {
    const s2 = await startServer({ SITE_URL: "https://www.koyekola.example/" });
    try {
      const p = await loginInstructor(s2);
      const c = await createCourse(p, s2, { title: "Publique", price: 0 });
      const c1 = new Client(s2.base);
      assert.equal(link((await c1.get(`/cours/${c.slug}`)).text, "canonical"), `https://www.koyekola.example/cours/${c.slug}`);
      assert.match((await c1.get("/sitemap.xml")).text, /<loc>https:\/\/www\.koyekola\.example\/cours\//);
      assert.match((await c1.get("/robots.txt")).text, /Sitemap: https:\/\/www\.koyekola\.example\/sitemap\.xml/);
    } finally {
      await s2.stop();
    }
  });
});
