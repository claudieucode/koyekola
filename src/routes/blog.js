// Blog : pages publiques (liste paginée, article) et éditeur réservé au formateur.
const express = require("express");
const db = require("../config/database");
const { requireInstructor } = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");
const { slugify } = require("../utils/format");
const { UserError } = require("../utils/errors");
const { removeUploadedFile } = require("../utils/uploads");
const { absoluteUrl, breadcrumbLd, plainText, isoDate, isoDateTime } = require("../utils/seo");

const router = express.Router();
const PER_PAGE = 10;
const MAX_CONTENT = 50000;

// ---------- Pages publiques ----------

const isInstructor = (req) => Boolean(req.session.user && req.session.user.role === "formateur");
const excerptOf = (post) => post.excerpt || plainText(post.content, 160);

router.get("/blog", (req, res) => {
  const total = db.prepare("SELECT COUNT(*) n FROM posts WHERE published = 1").get().n;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const asked = Number.parseInt(req.query.page, 10);
  const page = Number.isInteger(asked) && asked >= 1 && asked <= pages ? asked : 1;
  const posts = db
    .prepare("SELECT * FROM posts WHERE published = 1 ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?")
    .all(PER_PAGE, (page - 1) * PER_PAGE)
    .map((p) => ({ ...p, summary: excerptOf(p) }));
  const crumbs = [{ name: "Accueil", url: "/" }, { name: "Blog" }];
  res.render("blog/index", {
    posts, page, pages, crumbs,
    seo: {
      title: page > 1 ? `Blog (page ${page})` : "Blog",
      description: "Conseils, actualités et ressources autour de nos formations en ligne.",
      canonical: absoluteUrl(req, page > 1 ? `/blog?page=${page}` : "/blog"),
      jsonLd: [breadcrumbLd(crumbs.map((c) => ({ name: c.name, url: absoluteUrl(req, c.url || "/blog") })))],
    },
  });
});

router.get("/blog/:slug", (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE slug = ?").get(req.params.slug);
  // Un brouillon n'existe que pour le formateur (prévisualisation)
  if (!post || (!post.published && !isInstructor(req))) return res.status(404).render("error", { message: "Article introuvable." });

  const description = post.seo_description || excerptOf(post);
  const title = post.seo_title || post.title;
  const crumbs = [{ name: "Accueil", url: "/" }, { name: "Blog", url: "/blog" }, { name: post.title }];
  const url = absoluteUrl(req, `/blog/${post.slug}`);
  const image = post.cover_path ? absoluteUrl(req, post.cover_path) : null;
  const author = db.prepare("SELECT username FROM users WHERE role = 'formateur' ORDER BY id LIMIT 1").get();

  const seo = { title, description, canonical: url };
  if (!post.published) {
    seo.noindex = true;
  } else {
    seo.ogType = "article";
    seo.image = image;
    seo.publishedTime = isoDateTime(post.published_at);
    seo.jsonLd = [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description,
        ...(image ? { image } : {}),
        datePublished: isoDateTime(post.published_at),
        dateModified: isoDateTime(post.updated_at),
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        ...(author ? { author: { "@type": "Person", name: author.username } } : {}),
        publisher: { "@type": "Organization", name: "KOYEKOLA", url: absoluteUrl(req, "/") },
      },
      breadcrumbLd(crumbs.map((c) => ({ name: c.name, url: c.url ? absoluteUrl(req, c.url) : url }))),
    ];
  }
  res.render("blog/show", { post, crumbs, author, seo });
});

// Plan du site : le blog et ses articles publiés
router.sitemapEntries = () => [
  { path: "/blog" },
  ...db
    .prepare("SELECT slug, updated_at FROM posts WHERE published = 1 ORDER BY published_at DESC")
    .all()
    .map((p) => ({ path: `/blog/${p.slug}`, lastmod: isoDate(p.updated_at) })),
];

// ---------- Éditeur (formateur) ----------

// Vérifié AVANT la réception d'une image : un élève ne peut rien envoyer
router.use("/formateur/blog", requireInstructor);

const oneLine = (value, max) => String(value || "").replace(/[\r\n\u2028\u2029]+/g, " ").trim().slice(0, max);

function readFields(body) {
  const fields = {
    title: oneLine(body.title, 150),
    excerpt: oneLine(body.excerpt, 300),
    content: String(body.content || "").trim(),
    seo_title: oneLine(body.seo_title, 70),
    seo_description: oneLine(body.seo_description, 160),
  };
  if (!fields.title) throw new UserError("Le titre de l'article est obligatoire.");
  if (fields.content.length > MAX_CONTENT) throw new UserError("Le contenu est trop long (50 000 caractères au plus).");
  return fields;
}

// Adresse tirée du titre, rendue unique : « titre », « titre-2 », « titre-3 »…
function uniqueSlug(title, exceptId = 0) {
  const base = slugify(title) || "article";
  let slug = base;
  for (let n = 2; db.prepare("SELECT 1 FROM posts WHERE slug = ? AND id != ?").get(slug, exceptId); n++) slug = `${base}-${n}`;
  return slug;
}

// Si la validation échoue, l'image déjà reçue ne doit pas rester sur le disque
function withCoverCleanup(handler) {
  return (req, res, next) => {
    try {
      handler(req, res, next);
    } catch (err) {
      if (req.file) removeUploadedFile(`/uploads/thumbnails/${req.file.filename}`);
      next(err);
    }
  };
}

function loadPost(req, res, next) {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(Number(req.params.id));
  if (!post) return res.status(404).render("error", { message: "Article introuvable." });
  req.post = post;
  next();
}

router.get("/formateur/blog", (req, res) => {
  res.render("instructor/blog-list", { posts: db.prepare("SELECT * FROM posts ORDER BY id DESC").all() });
});

router.get("/formateur/blog/nouveau", (req, res) => {
  res.render("instructor/blog-form", { post: null, saved: false });
});

router.post("/formateur/blog/nouveau", upload.single("thumbnail"), withCoverCleanup((req, res) => {
  const f = readFields(req.body);
  const info = db
    .prepare("INSERT INTO posts (slug, title, excerpt, content, cover_path, seo_title, seo_description) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(uniqueSlug(f.title), f.title, f.excerpt, f.content, req.file ? `/uploads/thumbnails/${req.file.filename}` : null, f.seo_title || null, f.seo_description || null);
  res.redirect(`/formateur/blog/${info.lastInsertRowid}/modifier?enregistre=1`);
}));

router.get("/formateur/blog/:id/modifier", loadPost, (req, res) => {
  res.render("instructor/blog-form", { post: req.post, saved: req.query.enregistre === "1" });
});

router.post("/formateur/blog/:id/modifier", loadPost, upload.single("thumbnail"), withCoverCleanup((req, res) => {
  const f = readFields(req.body);
  // L'adresse ne change pas quand on retouche le titre : les liens déjà partagés continuent de fonctionner
  let cover = req.post.cover_path;
  if (req.file) cover = `/uploads/thumbnails/${req.file.filename}`;
  db.prepare("UPDATE posts SET title = ?, excerpt = ?, content = ?, cover_path = ?, seo_title = ?, seo_description = ?, updated_at = datetime('now') WHERE id = ?")
    .run(f.title, f.excerpt, f.content, cover, f.seo_title || null, f.seo_description || null, req.post.id);
  if (req.file) removeUploadedFile(req.post.cover_path);
  res.redirect(`/formateur/blog/${req.post.id}/modifier?enregistre=1`);
}));

// Publier / dépublier ; la date de première publication est conservée
router.post("/formateur/blog/:id/publier", loadPost, (req, res) => {
  db.prepare("UPDATE posts SET published = ?, published_at = CASE WHEN ? = 1 THEN COALESCE(published_at, datetime('now')) ELSE published_at END, updated_at = datetime('now') WHERE id = ?")
    .run(req.post.published ? 0 : 1, req.post.published ? 0 : 1, req.post.id);
  res.redirect("/formateur/blog");
});

router.post("/formateur/blog/:id/supprimer", loadPost, (req, res) => {
  db.prepare("DELETE FROM posts WHERE id = ?").run(req.post.id);
  removeUploadedFile(req.post.cover_path);
  res.redirect("/formateur/blog");
});

module.exports = router;
