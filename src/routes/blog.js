// Blog : pages publiques (liste paginée, catégories, étiquettes, auteur, article éditorial) et éditeur réservé au formateur.
const express = require("express");
const db = require("../config/database");
const { requireInstructor } = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");
const { slugify } = require("../utils/format");
const { UserError } = require("../utils/errors");
const { removeUploadedFile } = require("../utils/uploads");
const { absoluteUrl, breadcrumbLd, isoDate, isoDateTime } = require("../utils/seo");
const blog = require("../services/blog");

const router = express.Router();
const PER_PAGE = 10;
const MAX_CONTENT = 50000;
const NEWSLETTER_KEY = "blog.newsletter_form";

// ---------- Pages publiques ----------

const isInstructor = (req) => Boolean(req.session.user && req.session.user.role === "formateur");
const { excerptOf } = blog;

// Formulaire d'inscription du module marketing affiché dans le blog : celui choisi par le formateur, sinon le dernier publié.
// Même circuit que les autres formulaires (/f/:adresse) : preuve de consentement, double confirmation, champ piège.
function newsletterForm(req) {
  const marketing = req.app.locals.marketing;
  if (!marketing || !marketing.ready) return null;
  try {
    const forms = require("../marketing/forms");
    const chosen = marketing.settings.get(marketing.organizationId, NEWSLETTER_KEY, "");
    const slug = chosen || (db.prepare("SELECT slug FROM mk_forms WHERE organization_id = ? AND status = 'published' ORDER BY updated_at DESC, id DESC LIMIT 1").get(marketing.organizationId) || {}).slug;
    const form = slug ? forms.getPublishedForm(db, marketing.organizationId, slug) : null;
    return form ? { slug: form.slug, consentText: form.consentText } : null;
  } catch {
    return null; // le blog ne dépend jamais du module marketing pour s'afficher
  }
}

// Liste du blog, éventuellement filtrée (catégorie, étiquette, auteur)
function renderList(req, res, { filter = null } = {}) {
  const where = ["published = 1"];
  const params = [];
  if (filter && filter.type === "category") { where.push("category = ? COLLATE NOCASE"); params.push(filter.name); }
  if (filter && filter.type === "author") { where.push("(author_id = ? OR (author_id IS NULL AND ? = (SELECT MIN(id) FROM users WHERE role = 'formateur')))"); params.push(filter.id, filter.id); }
  let rows = db.prepare(`SELECT * FROM posts WHERE ${where.join(" AND ")} ORDER BY published_at DESC, id DESC`).all(...params);
  if (filter && filter.type === "tag") rows = rows.filter((p) => blog.parseTags(p.tags).some((t) => slugify(t) === filter.slug));
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const asked = Number.parseInt(req.query.page, 10);
  const page = Number.isInteger(asked) && asked >= 1 && asked <= pages ? asked : 1;
  const posts = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE).map((p) => ({ ...p, summary: excerptOf(p), categorySlug: p.category ? slugify(p.category) : "" }));
  const basePath = filter ? filter.path : "/blog";
  const heading = filter ? filter.heading : "Blog";
  const crumbs = filter ? [{ name: "Accueil", url: "/" }, { name: "Blog", url: "/blog" }, { name: filter.label }] : [{ name: "Accueil", url: "/" }, { name: "Blog" }];
  const seo = {
    title: page > 1 ? `${heading} (page ${page})` : heading,
    description: filter ? filter.lead : "Conseils, actualités et ressources autour de nos formations en ligne.",
    canonical: absoluteUrl(req, page > 1 ? `${basePath}?page=${page}` : basePath),
    jsonLd: [breadcrumbLd(crumbs.map((c) => ({ name: c.name, url: absoluteUrl(req, c.url || basePath) })))],
  };
  // Pages d'étiquette et d'auteur : utiles aux lecteurs, mais pas indexées (contenu en double des catégories)
  if (filter && filter.type !== "category") seo.noindex = true;
  res.render("blog/index", {
    posts, page, pages, crumbs, basePath, heading, filter, categories: blog.categories(),
    lead: filter ? filter.lead : "Conseils, actualités et ressources autour de nos formations.", seo,
  });
}

router.get("/blog", (req, res) => renderList(req, res));

router.get("/blog/categorie/:slug", (req, res) => {
  const category = blog.categoryBySlug(req.params.slug);
  if (!category) return res.status(404).render("error", { message: "Catégorie introuvable." });
  renderList(req, res, { filter: { type: "category", name: category.name, path: `/blog/categorie/${category.slug}`, label: category.name, heading: category.name, lead: `Nos articles « ${category.name} » : conseils, méthodes et ressources.` } });
});

router.get("/blog/etiquette/:slug", (req, res) => {
  const all = db.prepare("SELECT tags FROM posts WHERE published = 1 AND tags <> ''").all().flatMap((p) => blog.parseTags(p.tags));
  const tag = all.find((t) => slugify(t) === req.params.slug);
  if (!tag) return res.status(404).render("error", { message: "Étiquette introuvable." });
  renderList(req, res, { filter: { type: "tag", name: tag, slug: req.params.slug, path: `/blog/etiquette/${req.params.slug}`, label: `#${tag}`, heading: `Articles : ${tag}`, lead: `Tous nos articles sur « ${tag} ».` } });
});

router.get("/blog/auteur/:id", (req, res) => {
  const author = db.prepare("SELECT id, username FROM users WHERE id = ? AND role = 'formateur'").get(Number(req.params.id));
  if (!author) return res.status(404).render("error", { message: "Auteur introuvable." });
  renderList(req, res, { filter: { type: "author", id: author.id, path: `/blog/auteur/${author.id}`, label: author.username, heading: `Articles de ${author.username}`, lead: `Les articles écrits par ${author.username}.` } });
});

router.get("/blog/:slug", (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE slug = ?").get(req.params.slug);
  // Un brouillon n'existe que pour le formateur (prévisualisation)
  if (!post || (!post.published && !isInstructor(req))) return res.status(404).render("error", { message: "Article introuvable." });
  blog.countView(post, req);

  const article = blog.renderPost(post);
  const minutes = Number.isInteger(post.reading_minutes) && post.reading_minutes > 0 ? post.reading_minutes : article.minutes;
  const tags = blog.parseTags(post.tags);
  const description = post.seo_description || excerptOf(post);
  const title = post.seo_title || post.title;
  const crumbs = [{ name: "Accueil", url: "/" }, { name: "Blog", url: "/blog" }];
  if (post.category) crumbs.push({ name: post.category, url: `/blog/categorie/${slugify(post.category)}` });
  crumbs.push({ name: post.title });
  const ownUrl = absoluteUrl(req, `/blog/${post.slug}`);
  const canonical = post.canonical_url && /^https:\/\//i.test(post.canonical_url) ? post.canonical_url : ownUrl;
  const cover = post.cover_path ? absoluteUrl(req, post.cover_path) : null;
  const socialImage = post.og_image_path ? absoluteUrl(req, post.og_image_path) : cover;
  const author = blog.authorOf(post);
  // « Mis à jour le » : seulement si l'article a été modifié un autre jour que celui de sa publication
  const modified = post.published_at && post.updated_at && post.updated_at.slice(0, 10) > post.published_at.slice(0, 10) ? post.updated_at : null;

  const seo = { title, description, canonical };
  if (!post.published) {
    seo.noindex = true;
  } else {
    seo.ogType = "article";
    seo.image = socialImage;
    seo.imageAlt = post.cover_alt || post.title;
    seo.ogTitle = post.og_title || title;
    seo.ogDescription = post.og_description || description;
    seo.publishedTime = isoDateTime(post.published_at);
    seo.modifiedTime = isoDateTime(post.updated_at);
    seo.section = post.category || null;
    seo.tags = tags;
    const images = [socialImage, cover].filter((x, i, a) => x && a.indexOf(x) === i);
    seo.jsonLd = [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description,
        ...(images.length ? { image: images.length > 1 ? images : images[0] } : {}),
        datePublished: isoDateTime(post.published_at),
        dateModified: isoDateTime(post.updated_at),
        mainEntityOfPage: { "@type": "WebPage", "@id": ownUrl },
        ...(author ? { author: { "@type": "Person", name: author.username, url: absoluteUrl(req, `/blog/auteur/${author.id}`) } } : {}),
        publisher: { "@type": "Organization", name: "KOYEKOLA", url: absoluteUrl(req, "/") },
        ...(post.category ? { articleSection: post.category } : {}),
        ...(tags.length ? { keywords: tags.join(", ") } : {}),
        wordCount: article.words,
        inLanguage: "fr-FR",
      },
      breadcrumbLd(crumbs.map((c) => ({ name: c.name, url: c.url ? absoluteUrl(req, c.url) : ownUrl }))),
    ];
  }
  const { previous, next } = blog.neighbours(post);
  res.render("blog/show", {
    post, crumbs, author, seo, article, minutes, tags, modified, previous, next, shareUrl: ownUrl,
    categorySlug: post.category ? slugify(post.category) : "",
    sidebar: { popular: blog.popular(4, post.id), recent: blog.recent(4, post.id), categories: blog.categories(), newsletter: newsletterForm(req) },
    similar: post.published ? blog.similar(post, 3) : [],
  });
});

// Plan du site : le blog, ses catégories et ses articles publiés
router.sitemapEntries = () => [
  { path: "/blog" },
  ...blog.categories().map((c) => ({ path: `/blog/categorie/${c.slug}` })),
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
  const minutes = String(body.reading_minutes || "").trim();
  const canonical = oneLine(body.canonical_url, 500);
  const fields = {
    title: oneLine(body.title, 150),
    excerpt: oneLine(body.excerpt, 300),
    content: String(body.content || "").trim(),
    seo_title: oneLine(body.seo_title, 70),
    seo_description: oneLine(body.seo_description, 160),
    category: oneLine(body.category, 60),
    tags: blog.parseTags(body.tags).join(", "),
    cover_alt: oneLine(body.cover_alt, 200),
    focus_keyword: oneLine(body.focus_keyword, 80),
    og_title: oneLine(body.og_title, 95),
    og_description: oneLine(body.og_description, 200),
    canonical_url: canonical,
    reading_minutes: minutes ? Number(minutes) : null,
    author_id: /^\d{1,9}$/.test(String(body.author_id || "")) ? Number(body.author_id) : null,
  };
  if (!fields.title) throw new UserError("Le titre de l'article est obligatoire.");
  if (fields.content.length > MAX_CONTENT) throw new UserError("Le contenu est trop long (50 000 caractères au plus).");
  if (fields.reading_minutes !== null && !(Number.isInteger(fields.reading_minutes) && fields.reading_minutes >= 1 && fields.reading_minutes <= 120)) throw new UserError("Temps de lecture : un nombre de minutes entre 1 et 120 (ou vide pour le calcul automatique).");
  if (canonical && !/^https:\/\/[^\s]+$/i.test(canonical)) throw new UserError("L'adresse canonique doit commencer par https:// (ou rester vide).");
  if (fields.author_id && !db.prepare("SELECT 1 FROM users WHERE id = ? AND role = 'formateur'").get(fields.author_id)) throw new UserError("Auteur inconnu.");
  return fields;
}

// Date de publication modifiée (article déjà publié) : envoyée en UTC par le navigateur
function readPublishedAt(body) {
  const raw = String(body.published_at_utc || "").trim();
  if (!raw) return null;
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms)) throw new UserError("Date de publication invalide.");
  return new Date(ms).toISOString().slice(0, 19).replace("T", " ");
}

// Adresse : celle saisie (nettoyée) ou tirée du titre, rendue unique : « titre », « titre-2 », « titre-3 »…
function uniqueSlug(title, exceptId = 0) {
  const base = slugify(title).slice(0, 120).replace(/-+$/, "") || "article";
  let slug = base;
  for (let n = 2; db.prepare("SELECT 1 FROM posts WHERE slug = ? AND id != ?").get(slug, exceptId); n++) slug = `${base}-${n}`;
  return slug;
}

const files = upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "og_image", maxCount: 1 }]);
const fileOf = (req, name) => (req.files && req.files[name] && req.files[name][0]) || null;

// Si la validation échoue, les images déjà reçues ne doivent pas rester sur le disque
function withCoverCleanup(handler) {
  return (req, res, next) => {
    try {
      handler(req, res, next);
    } catch (err) {
      for (const name of ["thumbnail", "og_image"]) {
        const f = fileOf(req, name);
        if (f) removeUploadedFile(`/uploads/thumbnails/${f.filename}`);
      }
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

const formData = (req, post, extra = {}) => ({
  post, instructors: blog.instructors(), categories: blog.categories(), currentUserId: req.session.user.id,
  autoMinutes: post ? blog.renderPost(post).minutes : null,
  courses: db.prepare("SELECT slug, title FROM courses WHERE published = 1 AND archived = 0 ORDER BY title COLLATE NOCASE").all(), ...extra,
});

router.get("/formateur/blog", (req, res) => {
  const marketing = req.app.locals.marketing;
  let newsletter = null;
  if (marketing && marketing.ready) {
    newsletter = {
      forms: db.prepare("SELECT slug, name FROM mk_forms WHERE organization_id = ? AND status = 'published' ORDER BY name COLLATE NOCASE").all(marketing.organizationId),
      chosen: marketing.settings.get(marketing.organizationId, NEWSLETTER_KEY, ""),
    };
  }
  res.render("instructor/blog-list", { posts: db.prepare("SELECT * FROM posts ORDER BY id DESC").all(), newsletter, saved: req.query.enregistre === "1" });
});

// Formulaire d'inscription affiché dans le blog (bloc « newsletter ») : choisi parmi les formulaires publiés du marketing
router.post("/formateur/blog/newsletter", (req, res) => {
  const marketing = req.app.locals.marketing;
  if (!marketing || !marketing.ready) throw new UserError("Le module marketing est indisponible.");
  const slug = String(req.body.form || "").trim();
  if (slug && !db.prepare("SELECT 1 FROM mk_forms WHERE organization_id = ? AND slug = ? AND status = 'published'").get(marketing.organizationId, slug)) throw new UserError("Formulaire introuvable ou non publié.");
  marketing.settings.set(marketing.organizationId, NEWSLETTER_KEY, slug);
  res.redirect("/formateur/blog?enregistre=1");
});

// Image insérée dans le contenu : enregistrée sur le site, renvoie son adresse (JSON pour l'éditeur)
router.post("/formateur/blog/images", upload.single("article_image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choisissez une image (JPEG, PNG, WebP, GIF ou AVIF)." });
  res.json({ path: `/uploads/thumbnails/${req.file.filename}` });
});

router.get("/formateur/blog/nouveau", (req, res) => {
  res.render("instructor/blog-form", formData(req, null, { saved: false }));
});

router.post("/formateur/blog/nouveau", files, withCoverCleanup((req, res) => {
  const f = readFields(req.body);
  const cover = fileOf(req, "thumbnail");
  const og = fileOf(req, "og_image");
  const slugWanted = oneLine(req.body.slug, 120);
  const info = db
    .prepare(`INSERT INTO posts (slug, title, excerpt, content, cover_path, seo_title, seo_description, category, tags, author_id, cover_alt, focus_keyword, og_title, og_description, og_image_path, canonical_url, reading_minutes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uniqueSlug(slugWanted || f.title), f.title, f.excerpt, f.content, cover ? `/uploads/thumbnails/${cover.filename}` : null, f.seo_title || null, f.seo_description || null,
      f.category, f.tags, f.author_id ?? req.session.user.id, f.cover_alt, f.focus_keyword, f.og_title || null, f.og_description || null, og ? `/uploads/thumbnails/${og.filename}` : null, f.canonical_url || null, f.reading_minutes);
  res.redirect(`/formateur/blog/${info.lastInsertRowid}/modifier?enregistre=1`);
}));

router.get("/formateur/blog/:id/modifier", loadPost, (req, res) => {
  res.render("instructor/blog-form", formData(req, req.post, { saved: req.query.enregistre === "1" }));
});

router.post("/formateur/blog/:id/modifier", loadPost, files, withCoverCleanup((req, res) => {
  const f = readFields(req.body);
  const p = req.post;
  // L'adresse ne change pas quand on retouche le titre (les liens déjà partagés continuent de fonctionner) ;
  // elle ne change que si le formateur la modifie lui-même, et seulement tant que l'article n'a jamais été publié.
  const slugWanted = oneLine(req.body.slug, 120);
  const slug = !p.published_at && slugWanted && slugify(slugWanted) !== p.slug ? uniqueSlug(slugWanted, p.id) : p.slug;
  const coverFile = fileOf(req, "thumbnail");
  const ogFile = fileOf(req, "og_image");
  const cover = coverFile ? `/uploads/thumbnails/${coverFile.filename}` : p.cover_path;
  const removeOg = req.body.remove_og_image === "1" && !ogFile;
  const ogImage = ogFile ? `/uploads/thumbnails/${ogFile.filename}` : removeOg ? null : p.og_image_path;
  const publishedAt = p.published_at ? readPublishedAt(req.body) || p.published_at : null;
  db.prepare(`UPDATE posts SET slug = ?, title = ?, excerpt = ?, content = ?, cover_path = ?, seo_title = ?, seo_description = ?, category = ?, tags = ?, author_id = ?,
              cover_alt = ?, focus_keyword = ?, og_title = ?, og_description = ?, og_image_path = ?, canonical_url = ?, reading_minutes = ?, published_at = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(slug, f.title, f.excerpt, f.content, cover, f.seo_title || null, f.seo_description || null, f.category, f.tags, f.author_id ?? p.author_id,
      f.cover_alt, f.focus_keyword, f.og_title || null, f.og_description || null, ogImage, f.canonical_url || null, f.reading_minutes, publishedAt, p.id);
  if (coverFile) removeUploadedFile(p.cover_path);
  if ((ogFile || removeOg) && p.og_image_path) removeUploadedFile(p.og_image_path);
  res.redirect(`/formateur/blog/${p.id}/modifier?enregistre=1`);
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
  removeUploadedFile(req.post.og_image_path);
  res.redirect("/formateur/blog");
});

module.exports = router;
