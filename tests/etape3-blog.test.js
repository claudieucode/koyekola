// Étape 3d : blog — éditeur dans « Mon espace », pages publiques, référencement.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, prof, eleve;
const anon = () => new Client(srv.base);
const q = (sql, ...a) => {
  const db = srv.db();
  const r = db.prepare(sql).all(...a);
  db.close();
  return r;
};
const meta = (html, name) => (html.match(new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]*)"`)) || [])[1];
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => { const o = JSON.parse(m[1]); return o["@graph"] || [o]; });
const onDisk = (webPath) => fs.existsSync(path.join(srv.dir, "uploads", webPath.replace(/^\/uploads\//, "")));

async function createPost(client, fields = {}, cover) {
  const fd = new FormData();
  const data = { title: "Mon premier article", excerpt: "Un résumé court.", content: "## Introduction\nContenu **important**.", ...fields };
  Object.entries(data).forEach(([k, v]) => fd.append(k, v));
  if (cover) fd.append("thumbnail", new Blob([cover.data || Buffer.alloc(80, 3)], { type: cover.type || "image/png" }), cover.name || "cover.png");
  return client.request("/formateur/blog/nouveau", { method: "POST", multipart: fd });
}
const post = (title) => q("SELECT * FROM posts WHERE title = ? ORDER BY id DESC", title)[0];

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  eleve = await newStudent(srv);
});
after(() => srv.stop());

describe("blog vide", () => {
  test("/blog : page indexable avec un message clair", async () => {
    const r = await anon().get("/blog");
    assert.equal(r.status, 200);
    assert.match(r.text, /<h1[^>]*>Blog<\/h1>/);
    assert.match(r.text, /Aucun article/);
    assert.match(r.text, /<title>Blog · KOLAKISA<\/title>/);
  });
});

describe("éditeur (administration)", () => {
  test("liste, formulaire accessible", async () => {
    assert.equal((await prof.get("/formateur/blog")).status, 200);
    const form = await prof.get("/formateur/blog/nouveau");
    assert.equal(form.status, 200);
    for (const id of ["post-title", "post-excerpt", "post-content", "post-seo-title", "post-seo-desc", "post-cover"]) {
      assert.match(form.text, new RegExp(`<label[^>]+for="${id}"`));
      assert.match(form.text, new RegExp(`<(?:input|textarea)[^>]+id="${id}"`));
    }
  });
  test("créer un article : brouillon avec une adresse tirée du titre", async () => {
    const r = await createPost(prof, { title: "Mon Premier Article : Éléments clés !" });
    assert.equal(r.status, 302);
    const p = post("Mon Premier Article : Éléments clés !");
    assert.equal(p.slug, "mon-premier-article-elements-cles");
    assert.equal(p.published, 0);
    assert.equal(p.published_at, null);
    assert.match(r.location, new RegExp(`/formateur/blog/${p.id}/modifier`));
  });
  test("deux articles au même titre reçoivent des adresses différentes", async () => {
    await createPost(prof, { title: "Titre identique" });
    await createPost(prof, { title: "Titre identique" });
    const slugs = q("SELECT slug FROM posts WHERE title = 'Titre identique' ORDER BY id").map((r) => r.slug);
    assert.deepEqual(slugs, ["titre-identique", "titre-identique-2"]);
  });
  test("titre obligatoire, contenu limité", async () => {
    const before = q("SELECT COUNT(*) n FROM posts")[0].n;
    assert.equal((await createPost(prof, { title: "   " })).status, 400);
    assert.equal((await createPost(prof, { content: "x".repeat(50001) })).status, 400);
    assert.equal(q("SELECT COUNT(*) n FROM posts")[0].n, before);
  });
  test("image de couverture : PNG accepté (extension imposée), SVG refusé", async () => {
    await createPost(prof, { title: "Avec image" }, { name: "evil.html", type: "image/png" });
    const withCover = post("Avec image");
    assert.match(withCover.cover_path, /^\/uploads\/thumbnails\/.+\.png$/);
    assert.ok(onDisk(withCover.cover_path));
    const before = q("SELECT COUNT(*) n FROM posts")[0].n;
    const r = await createPost(prof, { title: "Image svg" }, { name: "a.svg", type: "image/svg+xml" });
    assert.equal(r.status, 400);
    assert.equal(q("SELECT COUNT(*) n FROM posts")[0].n, before);
  });
  test("modifier : l'adresse reste stable, le contenu change, l'ancienne image est remplacée", async () => {
    const p = post("Avec image");
    const fd = new FormData();
    Object.entries({ title: "Avec image (modifié)", excerpt: "Nouveau résumé", content: "Nouveau contenu" }).forEach(([k, v]) => fd.append(k, v));
    fd.append("thumbnail", new Blob([Buffer.alloc(60, 9)], { type: "image/webp" }), "n.webp");
    await prof.request(`/formateur/blog/${p.id}/modifier`, { method: "POST", multipart: fd });
    const after = q("SELECT * FROM posts WHERE id = ?", p.id)[0];
    assert.equal(after.slug, p.slug, "l'adresse ne change pas quand on retouche le titre");
    assert.equal(after.title, "Avec image (modifié)");
    assert.match(after.cover_path, /\.webp$/);
    assert.equal(onDisk(p.cover_path), false, "l'ancienne image est supprimée du disque");
    assert.ok(onDisk(after.cover_path));
  });
  test("réservé au formateur", async () => {
    assert.equal((await eleve.get("/formateur/blog")).status, 403);
    assert.equal((await createPost(eleve, { title: "Intrus" })).status, 403);
    assert.equal((await anon().get("/formateur/blog/nouveau")).status, 302);
    const id = q("SELECT id FROM posts LIMIT 1")[0].id;
    for (const action of ["publier", "supprimer"]) assert.equal((await eleve.post(`/formateur/blog/${id}/${action}`, {})).status, 403);
  });
});

describe("publication", () => {
  let p;
  before(async () => {
    await createPost(prof, { title: "Article publié", excerpt: "Le résumé de l'article publié.", content: "## Titre\nTexte avec **gras** et <script>alert(1)</script>." }, { name: "c.png", type: "image/png" });
    p = post("Article publié");
  });
  test("un brouillon est invisible : 404, absent de la liste et du sitemap", async () => {
    assert.equal((await anon().get(`/blog/${p.slug}`)).status, 404);
    assert.doesNotMatch((await anon().get("/blog")).text, /Article publié/);
    assert.doesNotMatch((await anon().get("/sitemap.xml")).text, new RegExp(p.slug));
  });
  test("le formateur peut prévisualiser son brouillon (non indexable)", async () => {
    const r = await prof.get(`/blog/${p.slug}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /noindex/);
  });
  test("publier : date de publication enregistrée, article visible", async () => {
    await prof.post(`/formateur/blog/${p.id}/publier`, {});
    const row = q("SELECT published, published_at FROM posts WHERE id = ?", p.id)[0];
    assert.equal(row.published, 1);
    assert.match(row.published_at, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    assert.equal((await anon().get(`/blog/${p.slug}`)).status, 200);
  });
  test("dépublier puis republier conserve la date de première publication", async () => {
    const first = q("SELECT published_at FROM posts WHERE id = ?", p.id)[0].published_at;
    await prof.post(`/formateur/blog/${p.id}/publier`, {});
    assert.equal(q("SELECT published FROM posts WHERE id = ?", p.id)[0].published, 0);
    assert.equal((await anon().get(`/blog/${p.slug}`)).status, 404);
    await prof.post(`/formateur/blog/${p.id}/publier`, {});
    assert.equal(q("SELECT published_at FROM posts WHERE id = ?", p.id)[0].published_at, first);
  });
});

describe("page d'un article", () => {
  let p, html;
  before(async () => {
    p = post("Article publié");
    html = (await anon().get(`/blog/${p.slug}`)).text;
  });
  test("titre, contenu mis en forme et HTML saisi neutralisé", () => {
    assert.match(html, /<h1[^>]*>Article publié<\/h1>/);
    assert.match(html, /<h2 id="titre">Titre<\/h2>/, "## → vrai titre de section (H2) avec ancre pour le sommaire");
    assert.match(html, /<strong>gras<\/strong>/);
    assert.doesNotMatch(html, /<script>alert\(1\)/);
  });
  test("image de couverture, date lisible et machine, fil d'Ariane", () => {
    assert.match(html, /<img[^>]+src="\/uploads\/thumbnails\/[^"]+\.png"[^>]+alt="Article publié"/);
    assert.match(html, /<time datetime="\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z">/);
    assert.match(html, /aria-label="Fil d'Ariane"[\s\S]*Blog[\s\S]*Article publié/);
  });
  test("balises : canonical, description = résumé, Open Graph article, image sociale absolue", () => {
    assert.match(html, new RegExp(`<link rel="canonical" href="${srv.base.replace(/\./g, "\\.")}/blog/${p.slug}">`));
    assert.equal(meta(html, "description"), "Le résumé de l'article publié.".replace(/'/g, "&#39;"));
    assert.equal(meta(html, "og:type"), "article");
    assert.match(meta(html, "article:published_time"), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    assert.match(meta(html, "og:image"), new RegExp(`^${srv.base.replace(/\./g, "\\.")}/uploads/thumbnails/`));
  });
  test("données structurées BlogPosting et fil d'Ariane", () => {
    const blocks = jsonLd(html);
    const b = blocks.find((x) => x["@type"] === "BlogPosting");
    assert.equal(b.headline, "Article publié");
    assert.match(b.datePublished, /^\d{4}-\d{2}-\d{2}T/);
    assert.ok(b.dateModified);
    assert.equal(b.mainEntityOfPage["@id"], `${srv.base}/blog/${p.slug}#webpage`, "relié à la page (graphe)");
    assert.equal(blocks.find((x) => x["@id"] === b.mainEntityOfPage["@id"]).url, `${srv.base}/blog/${p.slug}`);
    assert.equal(b.publisher["@type"], "Organization");
    assert.match(b.image, /^http/);
    assert.deepEqual(blocks.find((x) => x["@type"] === "BreadcrumbList").itemListElement.map((i) => i.name), ["Accueil", "Blog", "Article publié"]);
  });
  test("titre SEO et description SEO prioritaires quand ils sont renseignés", async () => {
    const fd = new FormData();
    Object.entries({ title: "Article publié", excerpt: "x", content: "y", seo_title: "Titre pour Google", seo_description: "Description pour Google." }).forEach(([k, v]) => fd.append(k, v));
    await prof.request(`/formateur/blog/${p.id}/modifier`, { method: "POST", multipart: fd });
    const h = (await anon().get(`/blog/${p.slug}`)).text;
    assert.match(h, /<title>Titre pour Google · KOLAKISA<\/title>/);
    assert.equal(meta(h, "description"), "Description pour Google.");
  });
  test("sans résumé : description tirée du contenu, sans mise en forme", async () => {
    await createPost(prof, { title: "Sans résumé", excerpt: "", content: "## Titre\nUn texte **sans** résumé rédigé à la main." });
    const s = post("Sans résumé");
    await prof.post(`/formateur/blog/${s.id}/publier`, {});
    const d = meta((await anon().get(`/blog/${s.slug}`)).text, "description");
    assert.match(d, /^Titre Un texte sans résumé rédigé à la main\./);
  });
  test("le titre ne peut pas casser les données structurées (</script>) ni la page (HTML)", async () => {
    await createPost(prof, { title: "<img src=x onerror=alert(1)> </script><b>x" });
    const s = q("SELECT * FROM posts ORDER BY id DESC")[0];
    await prof.post(`/formateur/blog/${s.id}/publier`, {});
    const h = (await anon().get(`/blog/${s.slug}`)).text;
    assert.doesNotMatch(h, /<img src=x/);
    assert.doesNotMatch(h.replace(/<\/script>\s*$/g, ""), /<\/script>[^<]*<b>x/);
    assert.ok(jsonLd(h).find((x) => x["@type"] === "BlogPosting").headline.includes("</script>"));
  });
  test("article inconnu : 404", async () => {
    assert.equal((await anon().get("/blog/inconnu")).status, 404);
  });
});

describe("liste et pagination", () => {
  before(async () => {
    for (let i = 1; i <= 11; i++) {
      await createPost(prof, { title: `Article de série ${String(i).padStart(2, "0")}`, excerpt: `Résumé numéro ${i}` });
      const p = post(`Article de série ${String(i).padStart(2, "0")}`);
      await prof.post(`/formateur/blog/${p.id}/publier`, {});
    }
  });
  test("10 articles par page, les plus récents d'abord", async () => {
    const page1 = (await anon().get("/blog")).text;
    const cards = page1.match(/class="post-card"/g) || [];
    assert.equal(cards.length, 10);
    assert.ok(page1.indexOf("Article de série 11") < page1.indexOf("Article de série 05"), "ordre du plus récent au plus ancien");
    const page2 = (await anon().get("/blog?page=2")).text;
    assert.ok((page2.match(/class="post-card"/g) || []).length >= 1);
  });
  test("navigation entre les pages et canonical propre à chaque page", async () => {
    const page1 = (await anon().get("/blog")).text;
    assert.match(page1, /aria-label="Pagination"[\s\S]*href="\/blog\?page=2"/);
    const page2 = (await anon().get("/blog?page=2")).text;
    assert.match(page2, new RegExp(`<link rel="canonical" href="${srv.base.replace(/\./g, "\\.")}/blog\\?page=2">`));
  });
  test("numéro de page invalide : première page", async () => {
    for (const bad of ["0", "-3", "abc", "9999"]) {
      const r = await anon().get(`/blog?page=${bad}`);
      assert.equal(r.status, 200);
      assert.ok((r.text.match(/class="post-card"/g) || []).length >= 1, bad);
    }
  });
  test("les cartes affichent titre, résumé et date", async () => {
    const html = (await anon().get("/blog")).text;
    assert.match(html, /Article de série 11/);
    assert.match(html, /Résumé numéro 11/);
    assert.match(html, /<time datetime=/);
  });
});

describe("sitemap, liens, suppression", () => {
  test("le sitemap contient /blog et les articles publiés (avec date), pas les brouillons", async () => {
    await createPost(prof, { title: "Reste brouillon" });
    const sm = (await anon().get("/sitemap.xml")).text;
    assert.match(sm, /<loc>[^<]*\/blog<\/loc>/);
    assert.match(sm, /<loc>[^<]*\/blog\/article-de-serie-11<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
    assert.doesNotMatch(sm, /reste-brouillon/);
  });
  test("le pied de page et le tableau de bord proposent le blog", async () => {
    assert.match((await anon().get("/")).text, /<footer[\s\S]*href="\/blog"/);
    assert.match((await prof.get("/formateur")).text, /href="\/formateur\/blog"/);
  });
  test("supprimer un article efface la ligne et son image", async () => {
    await createPost(prof, { title: "À supprimer" }, { name: "x.png", type: "image/png" });
    const p = post("À supprimer");
    assert.ok(onDisk(p.cover_path));
    await prof.post(`/formateur/blog/${p.id}/supprimer`, {});
    assert.equal(q("SELECT COUNT(*) n FROM posts WHERE id = ?", p.id)[0].n, 0);
    assert.equal(onDisk(p.cover_path), false);
  });
});
