// KOLAKISA SEO CORE — lot 1 : réglages, modèles, réglages par contenu, moteur unique, graphe JSON-LD, administration, journal.
// Chaque test vérifie le résultat RÉEL : base de données → page publique (HTML) ; aucune valeur supposée.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");
const { render, unknownVariables } = require("../src/seo/templates");
const { readDimensions } = require("../src/seo/images");

const meta = (html, key) => { const m = html.match(new RegExp(`<meta (?:name|property)="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}" content="([^"]*)">`)); return m ? m[1].replace(/&#39;/g, "'").replace(/&#34;/g, '"').replace(/&amp;/g, "&") : undefined; };
const titleOf = (html) => ((html.match(/<title>([^<]*)<\/title>/) || [])[1] || "").replace(/&#39;/g, "'").replace(/&#34;/g, '"').replace(/&amp;/g, "&");
const nodes = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => { const o = JSON.parse(m[1]); return o["@graph"] || [o]; });
// PNG minimal : signature + en-tête IHDR (largeur × hauteur)
const png = (w, h) => { const b = Buffer.alloc(64); Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0); b.writeUInt32BE(13, 8); b.write("IHDR", 12, "ascii"); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20); return b; };

describe("SEO CORE : outils", () => {
  test("modèles : variables remplacées, variables inconnues détectées", () => {
    assert.equal(render("{title}{sep}{site_name}", { title: "Excel", sep: " · ", site_name: "KOLAKISA" }), "Excel · KOLAKISA");
    assert.equal(render("Formations {category}", {}), "Formations");
    assert.deepEqual(unknownVariables("{title} {inconnue}", ["title"]), ["inconnue"]);
  });
  test("dimensions lues dans l'en-tête des images (PNG, GIF, WebP, JPEG)", () => {
    assert.deepEqual(readDimensions(png(1200, 630)), { width: 1200, height: 630, format: "png" });
    const gif = Buffer.from("GIF89a\x40\x01\xf0\x00", "latin1");
    assert.deepEqual(readDimensions(Buffer.concat([gif, Buffer.alloc(10)])), { width: 320, height: 240, format: "gif" });
    const webp = Buffer.alloc(30); webp.write("RIFF", 0, "ascii"); webp.write("WEBP", 8, "ascii"); webp.write("VP8X", 12, "ascii"); webp.writeUIntLE(799, 24, 3); webp.writeUIntLE(599, 27, 3);
    assert.deepEqual(readDimensions(webp), { width: 800, height: 600, format: "webp" });
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0xe0, 0x02, 0x80, 0, 0, 0, 0, 0]);
    assert.deepEqual(readDimensions(jpeg), { width: 640, height: 480, format: "jpeg" });
    assert.equal(readDimensions(Buffer.from("pas une image")), null);
  });
});

describe("SEO CORE : réglages, contenus, HTML public", () => {
  let srv, prof, course, imagePath;
  const anon = () => new Client(srv.base);
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
  const run = (sql, ...a) => { const db = srv.db(); db.prepare(sql).run(...a); db.close(); };
  const saveSettings = (form) => prof.post("/formateur/seo/reglages", form);
  const saveMeta = (type, key, form) => prof.post(`/formateur/seo/contenus/${type}/${key}`, form);
  before(async () => {
    srv = await startServer({ SITE_URL: "https://kolakisa.test" });
    prof = await loginInstructor(srv);
    course = await createCourse(prof, srv, { title: "Excel avancé", price: 49 });
    run("INSERT INTO posts (slug, title, content, content_format, published, published_at, status, category, tags, author_id) VALUES ('guide', 'Guide', '<p>x</p>', 'html', 1, datetime('now'), 'published', 'Bureautique', 'excel', (SELECT id FROM users WHERE role = 'formateur'))");
    const fd = new FormData();
    fd.append("article_image", new Blob([png(1200, 630)], { type: "image/png" }), "partage.png");
    fd.append("width", "1200"); fd.append("height", "630");
    imagePath = JSON.parse((await prof.request("/formateur/blog/api/medias", { method: "POST", multipart: fd })).text).media.path;
  });
  after(() => srv.stop());

  test("accès : visiteur renvoyé à la connexion, élève refusé, formateur autorisé", async () => {
    assert.equal((await anon().get("/formateur/seo")).status, 302);
    const student = await newStudent(srv);
    assert.notEqual((await student.get("/formateur/seo")).status, 200);
    for (const p of ["/formateur/seo", "/formateur/seo/reglages", "/formateur/seo/contenus", "/formateur/seo/journal"]) assert.equal((await prof.get(p)).status, 200, p);
  });

  test("valeurs par défaut : le site publie exactement comme avant le SEO CORE", async () => {
    const home = (await anon().get("/")).text;
    assert.equal(titleOf(home), "KOLAKISA — Formations en ligne, à apprendre à votre rythme");
    assert.equal(meta(home, "og:site_name"), "KOLAKISA");
    assert.equal(titleOf((await anon().get("/catalogue")).text), "Toutes les formations · KOLAKISA");
  });

  test("réglages refusés : variable inconnue, adresse non https, image hors médiathèque — rien n'est enregistré", async () => {
    const r = await saveSettings({ site_name: "Autre", title_template: "{title} {pirate}", social_profiles: "http://facebook.com/x", org_logo: "/etc/passwd" });
    assert.equal(r.status, 400);
    assert.match(r.text, /variable inconnue \{pirate\}/);
    assert.match(r.text, /n&#39;est pas une adresse https valide/);
    assert.match(r.text, /choisissez une image de la médiathèque/);
    assert.equal(q("SELECT COUNT(*) n FROM seo_settings")[0].n, 0);
  });

  test("réglages du site appliqués partout : nom, séparateur, modèle, description, organisation, logo, profils", async () => {
    const r = await saveSettings({ site_name: "KOLAKISA Formation", title_separator: " | ", title_template: "{title}{sep}{site_name}", default_description: "Description par défaut testée.", org_type: "EducationalOrganization", org_logo: imagePath, social_profiles: "https://www.facebook.com/kolakisa\nhttps://www.youtube.com/@kolakisa", home_title: "{site_name} — Accueil testé" });
    assert.equal(r.status, 302);
    const page = (await anon().get("/catalogue")).text;
    assert.equal(titleOf(page), "Toutes les formations | KOLAKISA Formation");
    assert.equal(meta(page, "og:site_name"), "KOLAKISA Formation");
    assert.equal(meta((await anon().get("/connexion")).text, "description"), "Description par défaut testée.");
    const home = (await anon().get("/")).text;
    assert.equal(titleOf(home), "KOLAKISA Formation — Accueil testé");
    const org = nodes(home).find((n) => n["@id"] === "https://kolakisa.test/#organization");
    assert.equal(org["@type"], "EducationalOrganization");
    assert.deepEqual(org.sameAs, ["https://www.facebook.com/kolakisa", "https://www.youtube.com/@kolakisa"]);
    assert.deepEqual([org.logo.url, org.logo.width, org.logo.height], [`https://kolakisa.test${imagePath}`, 1200, 630]);
    // journal : qui, quand, avant → après
    const log = q("SELECT field, old_value, new_value, user_id FROM seo_changes WHERE entity_type = 'settings' AND field = 'site_name'")[0];
    assert.deepEqual([log.old_value, log.new_value], ["KOLAKISA", "KOLAKISA Formation"]);
    assert.ok(log.user_id);
    assert.match((await prof.get("/formateur/seo/journal")).text, /KOLAKISA Formation/);
    // persistance : la page des réglages recharge les valeurs enregistrées
    assert.match((await prof.get("/formateur/seo/reglages")).text, /value="KOLAKISA Formation"/);
    await saveSettings({ site_name: "KOLAKISA", title_separator: " · ", default_description: "Découvrez et suivez mes formations en ligne, à votre rythme.", org_type: "Organization", home_title: "{site_name} — Formations en ligne, à apprendre à votre rythme" });
  });

  test("formation : titre et description SEO (colonne existante), partage, image avec dimensions, noindex, canonical", async () => {
    const r = await saveMeta("course", course.id, { seo_title: "Excel avancé : le cours complet", seo_description: "Tout Excel, du tableau croisé aux macros.", og_title: "Partage Excel", og_image_path: imagePath, twitter_card: "summary", robots_index: "0", robots_follow: "1", canonical_url: "https://ailleurs.example/excel" });
    assert.equal(r.status, 302);
    assert.equal(q("SELECT seo_title FROM courses WHERE id = ?", course.id)[0].seo_title, "Excel avancé : le cours complet", "une seule source : la colonne de la formation");
    const html = (await anon().get(`/cours/${course.slug}`)).text;
    assert.equal(titleOf(html), "Excel avancé : le cours complet · KOLAKISA");
    assert.equal(meta(html, "description"), "Tout Excel, du tableau croisé aux macros.");
    assert.equal(meta(html, "og:title"), "Partage Excel");
    assert.equal(meta(html, "og:image"), `https://kolakisa.test${imagePath}`);
    assert.deepEqual([meta(html, "og:image:width"), meta(html, "og:image:height")], ["1200", "630"]);
    assert.equal(meta(html, "twitter:card"), "summary");
    assert.equal(meta(html, "robots"), "noindex, follow");
    assert.match(html, /<link rel="canonical" href="https:\/\/ailleurs\.example\/excel">/);
    const c = nodes(html).find((n) => n["@type"] === "Course");
    assert.equal(c.mainEntityOfPage["@id"], `https://kolakisa.test/cours/${course.slug}#webpage`);
    // la page d'administration relit le HTML public et confirme chaque réglage
    const admin = (await prof.get(`/formateur/seo/contenus/course/${course.id}`)).text;
    assert.match(admin, /✓ Titre SEO → &lt;title&gt;/);
    assert.match(admin, /✓ Image de partage → og:image/);
    assert.doesNotMatch(admin, /class="is-bad"/);
    // retour à l'automatique : champs vides
    await saveMeta("course", course.id, { seo_title: "", seo_description: "", og_title: "", og_image_path: "", twitter_card: "", robots_index: "", robots_follow: "", canonical_url: "" });
    const back = (await anon().get(`/cours/${course.slug}`)).text;
    assert.equal(titleOf(back), "Excel avancé · KOLAKISA");
    assert.equal(meta(back, "robots"), undefined);
  });

  test("image de partage dont le fichier a disparu : jamais publiée (pas de lien cassé)", async () => {
    await saveMeta("page", "contact", { og_image_path: "/uploads/thumbnails/fichier-absent.png" });
    const html = (await anon().get("/contact")).text;
    assert.equal(meta(html, "og:image"), undefined);
    assert.match((await prof.get("/formateur/seo/contenus/page/contact")).text, /✗ Image de partage → og:image/);
    await saveMeta("page", "contact", { og_image_path: "" });
  });

  test("catégorie de formations, catégorie d'articles, étiquette, auteur, accueil : réglables", async () => {
    await saveMeta("course_category", "test", { seo_title: "Les formations Test", seo_description: "Description de catégorie." });
    const cat = (await anon().get("/categorie/test")).text;
    assert.equal(titleOf(cat), "Les formations Test · KOLAKISA");
    assert.ok(nodes(cat).find((n) => n["@type"] === "ItemList").itemListElement.length >= 1);
    await saveMeta("blog_category", "bureautique", { seo_description: "Articles de bureautique." });
    assert.equal(meta((await anon().get("/blog/categorie/bureautique")).text, "description"), "Articles de bureautique.");
    // étiquette : noindex, follow par défaut ; réglable par contenu et pour toutes les étiquettes
    assert.equal(meta((await anon().get("/blog/etiquette/excel")).text, "robots"), "noindex, follow");
    await saveMeta("blog_tag", "excel", { robots_index: "1" });
    assert.equal(meta((await anon().get("/blog/etiquette/excel")).text, "robots"), undefined);
    await saveMeta("blog_tag", "excel", { robots_index: "" });
    await saveSettings({ index_blog_tags: "1" });
    assert.equal(meta((await anon().get("/blog/etiquette/excel")).text, "robots"), undefined);
    await saveSettings({ index_blog_tags: "0" });
    const authorId = q("SELECT id FROM users WHERE role = 'formateur'")[0].id;
    const author = nodes((await anon().get(`/blog/auteur/${authorId}`)).text);
    assert.equal(author.find((n) => n["@type"] === "ProfilePage").mainEntity["@id"], author.find((n) => n["@type"] === "Person")["@id"]);
    await saveMeta("page", "home", { seo_title: "Titre complet de l'accueil" });
    assert.equal(titleOf((await anon().get("/")).text), "Titre complet de l'accueil", "accueil : titre complet, sans le modèle");
    await saveMeta("page", "home", { seo_title: "" });
  });

  test("réglages par contenu refusés : texte trop long, canonical non https, contenu inconnu", async () => {
    const r = await saveMeta("page", "faq", { seo_title: "x".repeat(71), canonical_url: "javascript:alert(1)" });
    assert.equal(r.status, 400);
    assert.match(r.text, /70 caractères au plus/);
    assert.match(r.text, /https:\/\//);
    assert.equal((await saveMeta("page", "inconnue", { seo_title: "x" })).status, 404);
    assert.equal((await saveMeta("course", "999999", { seo_title: "x" })).status, 404);
  });

  test("données structurées valides sur toutes les pages publiques : une seule organisation, références résolues", async () => {
    const schema = require("../src/seo/schema");
    for (const p of ["/", "/catalogue", "/categorie/test", `/cours/${course.slug}`, "/a-propos", "/faq", "/contact", "/blog", "/blog/guide", "/blog/categorie/bureautique"]) {
      const html = (await anon().get(p)).text;
      const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
      assert.deepEqual(schema.validate(blocks), [], p);
      assert.equal(nodes(html).filter((n) => n["@id"] === "https://kolakisa.test/#organization").length, 1, p);
    }
  });

  test("liste des contenus : tous les contenus publics, avec leur adresse", async () => {
    const html = (await prof.get("/formateur/seo/contenus")).text;
    for (const path of ["/", "/catalogue", `/cours/${course.slug}`, "/categorie/test", "/blog/guide", "/blog/categorie/bureautique", "/blog/etiquette/excel"]) assert.match(html, new RegExp(`href="${path.replace(/[/.]/g, "\\$&")}"`), path);
    assert.match((await prof.get("/formateur/seo/contenus?type=course")).text, /Excel avancé/);
  });
});
