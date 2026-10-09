const path = require("path");
const fs = require("fs");
// Blog : pages publiques (liste, catégories, étiquettes, auteur, article éditorial) et éditeur éditorial du formateur
// (texte riche, statuts et programmation, sauvegarde automatique, versions, médiathèque, liens internes, analyse SEO, IA).
const express = require("express");
const db = require("../config/database");
const { requireInstructor } = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");
const { createRateLimiter } = require("../middlewares/security");
const commentsEngine = require("../services/comments");
const antispam = require("../marketing/forms/antispam"); // jeton d'heure d'affichage déjà utilisé par les formulaires publics
const { roleAtLeast, membershipsOf } = require("../marketing/organizations");
const { slugify } = require("../utils/format");
const { UserError } = require("../utils/errors");
const { removeUploadedFile } = require("../utils/uploads");
const { uploadsRoot } = require("../config/paths");
const { fileExists } = require("../config/mediaAudit");
const { themeFor } = require("../utils/blogThemes");
const { absoluteUrl, breadcrumbLd, isoDate, isoDateTime } = require("../utils/seo");
const { sanitizeBlogHtml, markdownToEditorHtml } = require("../utils/blogHtml");
const { escapeHtml } = require("../utils/markdown");
const blog = require("../services/blog");
const taxonomy = require("../services/taxonomy");
const themeRender = require("../marketing/web/themeRender");
const blockTrash = require("../services/blockTrash");
const blogAi = require("../services/blogAi");
const editorTheme = require("../services/editorTheme");
const seoPages = require("../seo/pages");
const seoSchema = require("../seo/schema");
const seoGuard = require("../seo/guard");
const seoStore = require("../seo/store");
const seoAudit = require("../seo/audit");
const seoRules = require("../seo/rules");
const seoWorkspace = require("../seo/workspace");
const reusable = require("../services/reusableBlocks");
const { transaction } = require("../marketing/db/tx");
const seoImages = require("../seo/images");
const seoIntegrations = require("../seo/integrations");
const SEO_LOGGED = ["title", "slug", "seo_title", "seo_description", "canonical_url", "robots_index", "robots_follow", "og_title", "og_description", "og_image_path", "twitter_title", "twitter_description", "twitter_card", "focus_keyword", "secondary_keywords", "schema_type", "status"];
// Contrôle avant publication côté serveur : si le réglage le demande, une erreur critique bloque la publication
function guardPublication(fields, status, req, extra = {}) {
  if (status !== "published" && status !== "scheduled") return;
  const r = seoGuard.checkPost({ ...fields, ...extra }, { req });
  if (r.blocking) throw new UserError(`Publication bloquée par le contrôle SEO (Réglages SEO → Contrôle avant publication) : ${r.critical.join(" ")}`);
}

const router = express.Router();
const PER_PAGE = 10;
const MAX_MARKDOWN = 50000;
const MAX_HTML = 250000;
const NEWSLETTER_KEY = "blog.newsletter_form";
const LANGUAGES = { fr: "fr-FR", en: "en", es: "es", pt: "pt", de: "de", it: "it", ln: "ln" };
const IMG_PATH = /^\/uploads\/thumbnails\/[A-Za-z0-9_.-]{1,200}\.(?:png|jpe?g|webp|gif|avif)$/i;
// Image de la médiathèque du CMS (palier 3) : /uploads/marketing/<organisation>/<fichier> ; elle doit exister dans mk_media
const CMS_IMG_PATH = /^\/uploads\/marketing\/\d{1,9}\/[A-Za-z0-9_.-]{1,200}\.(?:png|jpe?g|webp|gif|avif)$/i;
const cmsMedia = (value) => {
  if (!CMS_IMG_PATH.test(String(value || ""))) return null;
  try { return db.prepare("SELECT id, path, alt FROM mk_media WHERE path = ? AND deleted_at IS NULL AND type = 'image'").get(value) || null; } catch { return null; }
};

// ---------- Pages publiques ----------

const isInstructor = (req) => Boolean(req.session.user && req.session.user.role === "formateur");
const { excerptOf } = blog;

// Les articles programmés dont l'heure est venue sont publiés avant toute lecture publique
router.use("/blog", (req, res, next) => { blog.promoteScheduled(); next(); });

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

// Bloc « newsletter » placé dans le contenu d'un article : même formulaire que la colonne de droite
function newsletterBlockHtml(form) {
  if (!form) return null;
  const id = `nl-in-${Math.random().toString(36).slice(2, 8)}`;
  return `<aside class="kb-newsletter-box side-newsletter" aria-label="Inscription à la newsletter"><p class="kb-newsletter-title">Recevez nos nouveaux articles et conseils</p>`
    + `<form action="/f/${escapeHtml(form.slug)}" method="post" data-blog-newsletter><div class="hp-field" aria-hidden="true"><label for="${id}-w">Ne pas remplir</label><input id="${id}-w" type="text" name="website" tabindex="-1" autocomplete="off"></div>`
    + `<label class="sr-only" for="${id}">Votre adresse e-mail</label><input id="${id}" type="email" name="email" required autocomplete="email" placeholder="Votre adresse e-mail">`
    + `<label class="side-consent"><input type="checkbox" name="consent" value="1" required> <span>${escapeHtml(form.consentText)}</span></label>`
    + `<button type="submit" class="btn btn-primary">S'inscrire</button><p class="side-newsletter-msg" role="status" data-newsletter-msg hidden></p></form></aside>`;
}

// Recherche : sans accents ni majuscules (« referencement » trouve « Référencement »)
const fold = (text) => String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Temps de lecture affiché sur les cartes : celui saisi dans l'éditeur, sinon calculé comme sur la page de l'article (230 mots/min)
function readingMinutes(p) {
  if (Number.isInteger(p.reading_minutes) && p.reading_minutes > 0) return p.reading_minutes;
  const words = String(blog.textOf(p) || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

// Liste du blog, éventuellement filtrée (catégorie, étiquette, auteur) et/ou recherchée (?q=).
// Page d'accueil du blog (sans filtre ni recherche, page 1) : « hub » éditorial — à la une, derniers articles,
// thèmes, articles populaires (vraies lectures), à découvrir.
function renderList(req, res, { filter = null } = {}) {
  const where = ["published = 1"];
  const params = [];
  // Catégorie ou étiquette : relations de la taxonomie (une catégorie montre aussi les articles de ses sous-catégories)
  if (filter && (filter.type === "category" || filter.type === "tag")) { const f = taxonomy.contentFilter("post", filter.termIds); where.push(f.sql); params.push(...f.args); }
  if (filter && filter.type === "author") { where.push("(author_id = ? OR (author_id IS NULL AND ? = (SELECT MIN(id) FROM users WHERE role = 'formateur')))"); params.push(filter.id, filter.id); }
  let rows = db.prepare(`SELECT * FROM posts WHERE ${where.join(" AND ")} ORDER BY published_at DESC, id DESC`).all(...params);
  // Recherche : titre, extrait, catégorie, sous-catégorie, étiquettes et texte de l'article ; tous les mots doivent figurer
  const q = String(req.query.q || "").replace(/\s+/g, " ").trim().slice(0, 100);
  if (q) {
    const terms = fold(q).split(" ");
    rows = rows.filter((p) => {
      const hay = fold([p.title, p.excerpt, p.category, p.subcategory, p.tags, blog.textOf(p)].join(" \n "));
      return terms.every((t) => hay.includes(t));
    });
  }
  const hub = !filter && !q;
  // Article à la une : celui marqué « à la une » dans l'éditeur, sinon le plus récent (accueil du blog seulement)
  let featured = null;
  if (hub && rows.length) {
    featured = rows.find((p) => p.featured) || rows[0];
    rows = rows.filter((p) => p.id !== featured.id);
  }
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const asked = Number.parseInt(req.query.page, 10);
  const page = Number.isInteger(asked) && asked >= 1 && asked <= pages ? asked : 1;
  // Couverture : uniquement si le fichier existe vraiment (sinon visuel neutre du thème, jamais d'image cassée)
  const decorate = (p) => ({
    ...p, summary: excerptOf(p), categorySlug: p.category ? taxonomy.categorySlugOfName(p.category) : "", minutes: readingMinutes(p),
    cover: p.cover_path && fileExists(uploadsRoot, p.cover_path) ? p.cover_path : null,
    theme: themeFor({ name: p.category || "", slug: p.category ? slugify(p.category) : "" }),
  });
  const posts = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(decorate);
  const basePath = filter ? filter.path : "/blog";
  const heading = filter ? filter.heading : "Blog";
  const crumbs = filter ? [{ name: "Accueil", url: "/" }, { name: "Blog", url: "/blog" }, ...(filter.ancestors || []), { name: filter.label }] : [{ name: "Accueil", url: "/" }, { name: "Blog" }];
  // Données structurées : l'article à la une fait partie de la liste (en tête), comme les autres articles de la page
  const listed = featured && page === 1 ? [featured, ...posts] : posts;
  const seo = seoPages.blogList(req, { filter, page, basePath, heading, crumbs, posts: listed });
  // Résultats de recherche : pas d'indexation (contenu en double des listes), liens suivis
  if (q) seo.robots = "noindex, follow";
  const categories = blog.categories().map((c) => ({ ...c, theme: themeFor(c) }));
  // Sections éditoriales de l'accueil du blog
  let popular = [], discover = null;
  if (hub && page === 1) {
    popular = blog.popular(3).map((p) => decorate(db.prepare("SELECT * FROM posts WHERE id = ?").get(p.id)));
    const shown = new Set([featured && featured.id, ...posts.map((p) => p.id), ...popular.map((p) => p.id)]);
    const other = rows.find((p) => !shown.has(p.id));
    if (other) discover = { type: "post", post: decorate(other) };
    else {
      const courses = db.prepare("SELECT COUNT(*) n FROM courses WHERE published = 1 AND archived = 0").get().n;
      if (courses) discover = { type: "courses", count: courses };
    }
  }
  // Modèle de thème « Liste du blog » (Page Builder) : remplace la liste ; la catégorie courante se lit avec {{query.categorie}}
  const themeQuery = {};
  if (filter && filter.type === "category") themeQuery.categorie = filter.name;
  // Famille de modèle : recherche, archive de catégorie, archive d'étiquette, sinon liste du blog (la première qui a un modèle en ligne gagne)
  const isCat = Boolean(filter && filter.type === "category"), isTag = Boolean(filter && filter.type === "tag");
  if (isTag) themeQuery.etiquette = filter.name;
  if (q) themeQuery.q = q;
  const families = q ? ["search_results", "blog_archive"] : isCat ? ["category_archive", "blog_archive"] : isTag ? ["tag_archive", "blog_archive"] : "blog_archive";
  themeRender.renderRegion(req, res, db, families, { category: isCat ? filter.name : "", categories: isCat ? (filter.ancestors || []).map((a) => a.name).reverse() : [], tag: isTag ? filter.name : "", query: themeQuery }, (themeTemplate) => {
  res.render("blog/index", {
    themeTemplate, posts, page, pages, crumbs, basePath, heading, filter, q, hub, total, categories, popular, discover,
    featured: featured && page === 1 ? decorate(featured) : null,
    lead: filter ? filter.lead : "Conseils, idées, ressources et actualités pour apprendre, créer et progresser.", seo,
  });
  });
}

// Articles venus d'une autre voie que l'éditeur : leurs anciens textes deviennent des relations avant toute page publique du blog
router.use(/^\/blog(\/|$)/, (req, res, next) => { if (req.method === "GET") taxonomy.reconcile(); next(); });
router.get("/blog", (req, res) => renderList(req, res));

// Archives : adresses configurables (taxonomy.baseOf) ; un terme inexistant est une vraie 404 (jamais une archive « vide » inventée)
const categoryBase = taxonomy.baseOf("category");
const tagBase = taxonomy.baseOf("tag");
router.get(`${categoryBase}/:slug`, (req, res) => {
  const term = taxonomy.bySlug("category", req.params.slug);
  if (!term) return res.status(404).render("error", { message: "Catégorie introuvable." });
  const lineage = taxonomy.ancestors(term.id);
  renderList(req, res, { filter: { type: "category", termIds: taxonomy.subtreeIds(term.id), name: term.name, path: taxonomy.urlOf(term), label: term.name, heading: term.name, ancestors: lineage.map((a) => ({ name: a.name, url: taxonomy.urlOf(a) })),
    lead: term.description || `Nos articles « ${term.name} » : conseils, méthodes et ressources.` } });
});

router.get(`${tagBase}/:slug`, (req, res) => {
  const term = taxonomy.bySlug("tag", req.params.slug);
  if (!term) return res.status(404).render("error", { message: "Étiquette introuvable." });
  renderList(req, res, { filter: { type: "tag", termIds: [term.id], name: term.name, slug: term.slug, path: taxonomy.urlOf(term), label: `#${term.name}`, heading: `Articles : ${term.name}`, lead: term.description || `Tous nos articles sur « ${term.name} ».` } });
});

router.get("/blog/auteur/:id", (req, res) => {
  const author = db.prepare("SELECT id, username FROM users WHERE id = ? AND role = 'formateur'").get(Number(req.params.id));
  if (!author) return res.status(404).render("error", { message: "Auteur introuvable." });
  renderList(req, res, { filter: { type: "author", id: author.id, path: `/blog/auteur/${author.id}`, label: author.username, heading: `Articles de ${author.username}`, lead: `Les articles écrits par ${author.username}.` } });
});

// Page d'un article (aussi utilisée par l'aperçu de l'éditeur : preview = true)
function renderPostPage(req, res, post, { preview = false } = {}) {
  const commentThread = commentsEngine.thread("post", post.id, { page: req.query.cpage });
  // « Répondre » : le formulaire se prépare pour ce commentaire (il doit être approuvé et son fil prolongeable)
  let replyTarget = null;
  const wanted = /^\d{1,9}$/.test(String(req.query.repondre || req.session.commentForm?.parent || "")) ? Number(req.query.repondre || req.session.commentForm.parent) : 0;
  if (wanted && commentThread.repliesAllowed) {
    const target = commentsEngine.get(wanted);
    if (target && target.status === "approved" && target.content_type === "post" && target.content_id === post.id && commentsEngine.levelOf(target.id) < commentThread.maxDepth) {
      const owner = target.user_id ? db.prepare("SELECT username FROM users WHERE id = ?").get(target.user_id) : null;
      replyTarget = { id: target.id, name: owner ? owner.username : target.author_name || "Anonyme" };
    }
  }
  const newsletter = newsletterForm(req);
  const article = blog.renderPost(post, { newsletterHtml: newsletterBlockHtml(newsletter) });
  const minutes = Number.isInteger(post.reading_minutes) && post.reading_minutes > 0 ? post.reading_minutes : article.minutes;
  const tags = blog.parseTags(post.tags);
  const description = post.seo_description || excerptOf(post);
  const title = post.seo_title || post.title;
  const crumbs = [{ name: "Accueil", url: "/" }, { name: "Blog", url: "/blog" }];
  // Fil d'Ariane : la catégorie principale et ses ancêtres (Marketing › SEO › article) ; sans relation, repli sur le texte historique
  const postTerms = taxonomy.termsOf("post", post.id);
  if (postTerms.primary) { const root = taxonomy.ancestors(postTerms.primary.id)[0]; crumbs.push(root ? { name: root.name, url: taxonomy.urlOf(root) } : { name: postTerms.primary.name, url: postTerms.primary.url }); } // fil d'Ariane : catégorie racine, comme avant
  else if (post.category) crumbs.push({ name: post.category, url: `${taxonomy.baseOf("category")}/${taxonomy.categorySlugOfName(post.category)}` });
  crumbs.push({ name: post.title });
  const ownUrl = absoluteUrl(req, `/blog/${post.slug}`);
  const canonical = post.canonical_url && /^https:\/\//i.test(post.canonical_url) ? post.canonical_url : ownUrl;
  const cover = post.cover_path ? absoluteUrl(req, post.cover_path) : null;
  const socialImage = post.og_image_path ? absoluteUrl(req, post.og_image_path) : cover;
  const author = blog.authorOf(post);
  const lang = LANGUAGES[post.language] || "fr-FR";
  // « Mis à jour le » : seulement si l'article a été modifié un autre jour que celui de sa publication
  const modified = post.published_at && post.updated_at && post.updated_at.slice(0, 10) > post.published_at.slice(0, 10) ? post.updated_at : null;

  const seo = { title, description, canonical };
  if (!post.published || preview) {
    seo.noindex = true;
  } else {
    if (!post.robots_index || !post.robots_follow) seo.robots = `${post.robots_index ? "index" : "noindex"}, ${post.robots_follow ? "follow" : "nofollow"}`;
    seo.ogType = "article";
    seo.ogUrl = ownUrl;
    seo.image = socialImage;
    seo.imageAlt = post.cover_alt || post.title;
    seo.ogTitle = post.og_title || title;
    seo.ogDescription = post.og_description || description;
    seo.twitterCard = post.twitter_card === "summary" ? "summary" : "summary_large_image";
    seo.twitterTitle = post.twitter_title || seo.ogTitle;
    seo.twitterDescription = post.twitter_description || seo.ogDescription;
    seo.twitterImage = post.twitter_image_path ? absoluteUrl(req, post.twitter_image_path) : socialImage;
    seo.publishedTime = isoDateTime(post.published_at);
    seo.modifiedTime = isoDateTime(post.updated_at);
    seo.section = post.category || null;
    seo.tags = tags;
    // Graphe relié : page → article (BlogPosting / Article) → auteur (Person) et éditeur (organisation) ; FAQ et HowTo
    // seulement s'ils existent vraiment dans l'article
    const ids = seoSchema.ids(req);
    const personId = author ? `${ids.base}/#/person/${author.id}` : null;
    const imagePath = post.og_image_path || post.cover_path || null;
    // Images réelles de l'article (partage puis principale), sans doublon et seulement si le fichier existe
    const imgs = [post.og_image_path, post.cover_path].filter((x, i, a) => x && a.indexOf(x) === i).map((x) => seoSchema.imageObject(req, x, null)).filter(Boolean).map((o) => o.url);
    const articleNode = {
      "@type": post.schema_type === "Article" ? "Article" : "BlogPosting",
      "@id": `${ownUrl}#article`,
      headline: post.title,
      description,
      ...(imgs.length ? { image: imgs.length > 1 ? imgs : imgs[0] } : {}),
      datePublished: isoDateTime(post.published_at),
      dateModified: isoDateTime(post.updated_at),
      mainEntityOfPage: { "@id": `${ownUrl}#webpage` },
      ...(author ? { author: { "@type": "Person", "@id": personId, name: author.username, url: absoluteUrl(req, `/blog/auteur/${author.id}`) } } : {}),
      publisher: seoSchema.orgRef(req),
      ...(post.category ? { articleSection: post.category } : {}),
      ...(tags.length ? { keywords: tags.join(", ") } : {}),
      wordCount: article.words,
      inLanguage: lang,
      ...(post.comments_enabled ? { commentCount: blog.countComments(post.id) } : {}),
    };
    const main = [articleNode];
    if (article.faq.length) main.push({ "@type": "FAQPage", "@id": `${ownUrl}#faq`, mainEntity: article.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
    article.howto.forEach((h, i) => main.push({ "@type": "HowTo", "@id": `${ownUrl}#howto-${i + 1}`, name: h.name || post.title, step: h.steps.map((st, n) => ({ "@type": "HowToStep", position: n + 1, name: st.name, text: st.text || st.name })) }));
    seo.imagePath = imagePath;
    seo.locale = seoPages.LOCALES[post.language] || undefined;
    seo.graph = { page: { type: "WebPage", url: ownUrl, crumbs, imagePath, inLanguage: lang, datePublished: isoDateTime(post.published_at), dateModified: isoDateTime(post.updated_at) }, main };
  }
  const { previous, next } = post.published ? blog.neighbours(post) : { previous: null, next: null };
  const toc = post.toc_enabled === 0 ? [] : article.toc;
  // Modèle de thème « Article du blog » (Page Builder) : remplace l'en-tête, l'image et le texte ; sans modèle publié, rien ne change
  const postTaxo = taxonomy.termsOf("post", post.id);
  const primaryTerm = postTaxo.primary;
  const nearestCats = primaryTerm ? [primaryTerm.name, ...taxonomy.ancestors(primaryTerm.id).map((a) => a.name).reverse()] : [];
  themeRender.renderRegion(req, res, db, "single_post", { category: nearestCats[0] || post.category || "", categories: nearestCats.slice(1), tags: (postTaxo.tags || []).map((t) => t.name), postId: post.id, scope: { post: themeRender.postScope(post, { contentHtml: article.html, minutes, author: author ? author.username : "" }) } }, (themeTemplate) => {
  res.render("blog/show", {
    themeTemplate, post, crumbs, author, seo, article: { ...article, toc }, minutes, tags, modified, previous, next, shareUrl: ownUrl, lang: post.language && post.language !== "fr" ? post.language : null,
    tocTitle: post.toc_title || "Sommaire", tocNumbering: post.toc_numbering || "h2", preview,
    categorySlug: post.category ? taxonomy.categorySlugOfName(post.category) : "", postTerms,
    sidebar: { popular: blog.popular(4, post.id), recent: blog.recent(4, post.id), categories: blog.categories(), newsletter },
    similar: post.published ? blog.similar(post, 3) : [],
    comments: commentThread,
    replyTo: replyTarget,
    commentHtml: (body) => commentsEngine.html(body, { links: commentsEngine.settings().links_allowed }),
    commentCfg: commentsEngine.settings(),
    commentForm: req.session.commentForm || {},
    commentToken: antispam.issue(),
    commentsOpen: Boolean(post.comments_enabled && post.published && !preview),
    commentMax: blog.COMMENT_MAX,
    commentError: req.session.commentError || null,
    commentDraft: req.session.commentDraft || "",
    commentNotice: req.session.commentNotice || null,
    me: req.session.user || null,
  });
  delete req.session.commentError;
  delete req.session.commentDraft; delete req.session.commentForm; delete req.session.commentNotice;
  });
}

// ---------- Commentaires : moteur générique (src/services/comments.js) ----------
const commentLimiter = createRateLimiter(6, 10 * 60 * 1000); // 6 commentaires par tranche de 10 minutes et par membre
const guestLimiter = createRateLimiter(3, 10 * 60 * 1000);   // invités : 3 commentaires par tranche de 10 minutes et par adresse
const burstLimiter = createRateLimiter(1, 5 * 1000);         // jamais deux envois en moins de 5 secondes depuis la même adresse (invités)
// Un formateur ou un membre de l'équipe (éditeur et plus) est publié tout de suite
const canModerate = (user) => Boolean(user && (user.role === "formateur" || membershipsOf(db, user.id).some((m) => roleAtLeast(m.role, "editor"))));
router.post("/blog/:slug/commentaires", (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE slug = ? AND published = 1").get(req.params.slug);
  if (!post) return res.status(404).render("error", { message: "Article introuvable." });
  const back = `/blog/${post.slug}`;
  const user = req.session.user || null;
  const cfg = commentsEngine.settings();
  if (!user && !cfg.guests_allowed) return res.redirect(`/connexion?redirect=${encodeURIComponent(`${back}#commentaires`)}`);
  if (!post.comments_enabled) return res.redirect(`${back}#commentaires`);
  const ip = req.ip;
  const key = user ? `comment:${user.id}` : `guest:${commentsEngine.ipHash(ip)}`;
  try {
    if (user ? commentLimiter.isLimited(key) : guestLimiter.isLimited(key) || burstLimiter.isLimited(key)) throw new UserError("Vous avez publié beaucoup de commentaires en peu de temps : réessayez dans quelques minutes.");
    const full = user ? db.prepare("SELECT id, username, email, role FROM users WHERE id = ?").get(user.id) : null;
    const result = commentsEngine.create({ type: "post", contentId: post.id, parentId: /^\d{1,9}$/.test(String(req.body.parent_id || "")) ? Number(req.body.parent_id) : null, user: full, name: req.body.author_name, email: req.body.author_email, body: req.body.body, ip, honeypot: String(req.body.contact_url || "").trim() ? "honeypot" : (!user && !antispam.check(req.body.form_token) ? "timing" : ""), trusted: canModerate(full) });
    if (user) commentLimiter.hit(key); else { guestLimiter.hit(key); burstLimiter.hit(key); }
    if (result.status === "approved") return res.redirect(`${back}#commentaire-${result.id}`);
    req.session.commentNotice = result.status === "spam" ? "Votre commentaire a bien été reçu." : "Merci ! Votre commentaire est en attente de modération : il apparaîtra dès qu'il sera approuvé.";
    res.redirect(`${back}#commentaires`);
  } catch (err) {
    if (!(err instanceof UserError)) throw err;
    req.session.commentError = err.message;
    req.session.commentDraft = String(req.body.body || "").slice(0, blog.COMMENT_MAX + 200);
    req.session.commentForm = { name: String(req.body.author_name || "").slice(0, 80), email: String(req.body.author_email || "").slice(0, 120), parent: String(req.body.parent_id || "").slice(0, 9) };
    res.redirect(`${back}#commentaires`);
  }
});
// Suppression : par son auteur, ou par un formateur (modération)
router.post("/blog/commentaires/:id/supprimer", (req, res) => {
  const comment = /^\d{1,9}$/.test(req.params.id) ? blog.getComment(Number(req.params.id)) : null;
  const user = req.session.user;
  if (!comment) return res.status(404).render("error", { message: "Commentaire introuvable." });
  if (!user || (user.id !== comment.user_id && user.role !== "formateur")) return res.status(403).render("error", { message: "Vous ne pouvez pas supprimer ce commentaire." });
  blog.deleteComment(comment.id);
  const post = db.prepare("SELECT slug FROM posts WHERE id = ?").get(comment.post_id);
  res.redirect(post ? `/blog/${post.slug}#commentaires` : "/blog");
});

router.get("/blog/:slug", (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE slug = ?").get(req.params.slug);
  if (!post) {
    const moved = db.prepare("SELECT posts.slug FROM post_slug_history JOIN posts ON posts.id = post_slug_history.post_id WHERE post_slug_history.old_slug = ?").get(req.params.slug);
    if (moved) return res.redirect(301, `/blog/${moved.slug}`);
  }
  // Brouillon, relecture, programmé ou archivé : visible seulement par le formateur (prévisualisation, non indexée)
  if (!post || (!post.published && !isInstructor(req))) return res.status(404).render("error", { message: "Article introuvable." });
  blog.countView(post, req);
  renderPostPage(req, res, post);
});

// Plan du site : le blog, ses catégories et ses articles publiés et indexables
router.sitemapEntries = () => {
  blog.promoteScheduled();
  return [
    { path: "/blog" },
    ...taxonomy.publicTerms("category").map((t) => ({ path: taxonomy.urlOf(t) })),
    ...db
      .prepare("SELECT slug, updated_at FROM posts WHERE published = 1 AND robots_index = 1 AND (canonical_url IS NULL OR canonical_url = '') ORDER BY published_at DESC")
      .all()
      .map((p) => ({ path: `/blog/${p.slug}`, lastmod: isoDate(p.updated_at) })),
  ];
};

// ---------- Éditeur (formateur) ----------

// Vérifié AVANT la réception d'un fichier : un élève ne peut rien envoyer
router.use("/formateur/blog", requireInstructor);

const oneLine = (value, max) => String(value || "").replace(/[\r\n\u2028\u2029]+/g, " ").trim().slice(0, max);
// Case à cocher précédée d'un champ caché « 0 » : la dernière valeur reçue l'emporte
const lastOf = (v) => (Array.isArray(v) ? v[v.length - 1] : v);
const flag = (v, fallback) => { const x = lastOf(v); return x === undefined ? fallback : x === "1" || x === "on" || x === "true" || x === true ? 1 : 0; };
const wantsJson = (req) => req.get("x-blog-editor") === "1";

// Classement d'un article : par identifiants (sélecteur de l'éditeur : category_ids, primary_category_id, tag_ids) ou, sans eux,
// par l'ancienne saisie texte (category / subcategory / tags) ; les relations de la taxonomie sont la source, le texte en est le miroir
function applyTaxonomy(postId, body) {
  const has = (k) => Object.hasOwn(body, k);
  if (has("category_ids") || has("primary_category_id") || has("tag_ids")) {
    taxonomy.setTerms("post", postId, {
      categoryIds: has("category_ids") ? body.category_ids : undefined,
      primaryId: has("primary_category_id") ? Number(lastOf(body.primary_category_id)) || null : undefined,
      tagIds: has("tag_ids") ? body.tag_ids : undefined,
    });
  } else if (has("category") || has("subcategory") || has("tags")) {
    taxonomy.assignByNames("post", postId, { category: lastOf(body.category), subcategory: lastOf(body.subcategory), tags: lastOf(body.tags) });
  }
}

function readFields(body, existing = null) {
  const minutes = String(body.reading_minutes || "").trim();
  const canonical = oneLine(body.canonical_url, 500);
  const format = body.content_format === "html" ? "html" : "markdown";
  const raw = String(body.content || "").trim();
  if (raw.length > (format === "html" ? MAX_HTML : MAX_MARKDOWN)) throw new UserError(format === "html" ? "Le contenu est trop long." : "Le contenu est trop long (50 000 caractères au plus).");
  const exceptId = existing ? existing.id : 0;
  const category = blog.canonicalCategory(body.category, exceptId);
  const fields = {
    title: oneLine(body.title, 150),
    excerpt: oneLine(body.excerpt, 300),
    content: format === "html" ? reusable.pruneMissing(sanitizeBlogHtml(raw)) : raw,
    content_format: format,
    seo_title: oneLine(body.seo_title, 70),
    seo_description: oneLine(body.seo_description, 160),
    category,
    subcategory: blog.canonicalSubcategory(category, body.subcategory, exceptId),
    tags: blog.canonicalTags(body.tags),
    cover_alt: oneLine(body.cover_alt, 200),
    focus_keyword: oneLine(body.focus_keyword, 80),
    secondary_keywords: blog.parseTags(body.secondary_keywords).join(", "),
    og_title: oneLine(body.og_title, 95),
    og_description: oneLine(body.og_description, 200),
    twitter_title: oneLine(body.twitter_title, 70),
    twitter_description: oneLine(body.twitter_description, 200),
    twitter_card: body.twitter_card === "summary" ? "summary" : "summary_large_image",
    canonical_url: canonical,
    reading_minutes: minutes ? Number(minutes) : null,
    author_id: /^\d{1,9}$/.test(String(body.author_id || "")) ? Number(body.author_id) : null,
    language: Object.hasOwn(LANGUAGES, body.language) ? body.language : (existing && existing.language) || "fr",
    featured: flag(body.featured, existing ? existing.featured : 0),
    robots_index: flag(body.robots_index, existing ? existing.robots_index : 1),
    robots_follow: flag(body.robots_follow, existing ? existing.robots_follow : 1),
    toc_enabled: flag(body.toc_enabled, existing ? existing.toc_enabled : 1),
    toc_depth: ["2", "3", "4"].includes(String(body.toc_depth)) ? Number(body.toc_depth) : existing ? existing.toc_depth : 3,
    toc_numbering: ["none", "h2", "full"].includes(body.toc_numbering) ? body.toc_numbering : existing ? existing.toc_numbering || "h2" : "h2",
    toc_title: oneLine(body.toc_title, 60),
    schema_type: body.schema_type === "Article" ? "Article" : "BlogPosting",
    reviewed: flag(body.reviewed, existing ? existing.reviewed : 0),
    comments_enabled: flag(body.comments_enabled, existing ? existing.comments_enabled : (commentsEngine.settings().enabled_default ? 1 : 0)),
  };
  if (!fields.title) throw new UserError("Le titre de l'article est obligatoire.");
  if (fields.reading_minutes !== null && !(Number.isInteger(fields.reading_minutes) && fields.reading_minutes >= 1 && fields.reading_minutes <= 120)) throw new UserError("Temps de lecture : un nombre de minutes entre 1 et 120 (ou vide pour le calcul automatique).");
  if (canonical && !/^https:\/\/[^\s]+$/i.test(canonical)) throw new UserError("L'adresse canonique doit commencer par https:// (ou rester vide).");
  if (fields.author_id && !db.prepare("SELECT 1 FROM users WHERE id = ? AND role = 'formateur'").get(fields.author_id)) throw new UserError("Auteur inconnu.");
  return fields;
}

// Date choisie dans l'éditeur, envoyée en UTC par le navigateur
function readDate(body, name = "published_at_utc") {
  const raw = String(body[name] || "").trim();
  if (!raw) return null;
  const ms = Date.parse(raw);
  if (!Number.isFinite(ms)) throw new UserError("Date invalide.");
  return new Date(ms).toISOString().slice(0, 19).replace("T", " ");
}

// Adresse : celle saisie (nettoyée) ou tirée du titre, rendue unique (voir services/blog.js)
const uniqueSlug = blog.uniqueSlug;

// Statut demandé → colonnes published / published_at / status. Les contrôles bloquants sont refaits ici (jamais seulement dans le navigateur).
function applyStatus(body, current, fields) {
  const wanted = Object.hasOwn(blog.STATUSES, body.status) ? body.status : current ? current.status : "draft";
  const chosenDate = readDate(body);
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  if (wanted === "published" || wanted === "scheduled") {
    const plain = fields.content_format === "html" ? fields.content.replace(/<[^>]*>/g, "").trim() : fields.content.trim();
    if (!plain && !/<(img|div class="kb-)/.test(fields.content)) throw new UserError("Impossible de publier un article vide : écrivez d'abord son contenu.");
  }
  if (wanted === "scheduled") {
    // Date effacée explicitement (« Effacer » dans le calendrier) : jamais de retour silencieux à l'ancienne date
    const cleared = Object.hasOwn(body, "published_at_utc") && !String(body.published_at_utc || "").trim();
    const at = chosenDate || (!cleared && current && current.status === "scheduled" ? current.published_at : null);
    if (!at || at <= now) throw new UserError("Programmation : choisissez une date et une heure dans le futur.");
    return { status: "scheduled", published: 0, published_at: at };
  }
  if (wanted === "published") return { status: "published", published: 1, published_at: chosenDate || (current && current.published_at) || now };
  // Brouillon, relecture, archivé : hors ligne ; la date de première publication est conservée
  return { status: wanted, published: 0, published_at: current ? current.published_at : null };
}

const files = upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "og_image", maxCount: 1 }, { name: "twitter_image", maxCount: 1 }]);
const fileOf = (req, name) => (req.files && req.files[name] && req.files[name][0]) || null;
const FILE_FIELDS = ["thumbnail", "og_image", "twitter_image"];

// Si l'enregistrement échoue, les images déjà reçues ne restent pas sur le disque ; l'éditeur reçoit l'erreur en JSON
function withCleanup(handler) {
  return (req, res, next) => {
    try {
      handler(req, res, next);
    } catch (err) {
      for (const name of FILE_FIELDS) { const f = fileOf(req, name); if (f) removeUploadedFile(`/uploads/thumbnails/${f.filename}`, "enregistrement de l'article refusé : fichier jamais utilisé"); }
      if (wantsJson(req) && err instanceof UserError) return res.status(400).json({ error: err.message });
      next(err);
    }
  };
}

// Image choisie dans la médiathèque (au lieu d'un nouvel envoi) : seulement une image connue du site
const libraryImage = (value) => ((IMG_PATH.test(String(value || "")) && blog.mediaByPath(value)) || cmsMedia(value) ? value : null);
// Nouveau fichier envoyé → enregistré aussi dans la médiathèque
function registerUpload(req, file, alt = "") {
  if (!file) return null;
  const path = `/uploads/thumbnails/${file.filename}`;
  blog.addMedia({ path, kind: "image", mime: file.mimetype, size: file.size, alt, userId: req.session.user.id });
  return path;
}

// Une image qui ne sert plus à aucun article est retirée du disque et de la médiathèque
// Image remplacée ou article supprimé : fichier et médiathèque libérés si plus rien ne l'utilise (révisions comprises)
const forgetIfUnused = (path) => blog.releaseImage(path);

function loadPost(req, res, next) {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(Number(req.params.id));
  if (!post) return wantsJson(req) || req.path.includes("/api/") ? res.status(404).json({ error: "Article introuvable." }) : res.status(404).render("error", { message: "Article introuvable." });
  req.post = post;
  next();
}

function editorData(req, post) {
  const autosave = post ? blog.getAutosave(post.id) : null;
  const marketing = req.app.locals.marketing;
  return {
    post,
    editorHtml: post ? (post.content_format === "html" ? post.content : markdownToEditorHtml(post.content)) : "",
    // Sauvegarde automatique plus récente que la dernière version enregistrée : proposée à la restauration
    autosave: autosave && post && autosave.saved_at > post.updated_at ? autosave : null,
    revisions: post ? blog.listRevisions(post.id) : [], revisionTotal: post ? blog.countRevisions(post.id) : 0,
    instructors: blog.instructors(), categories: blog.categories(), subcategories: blog.subcategories(), tags: blog.allTags(),
    taxo: { categories: taxonomy.tree("category").map(termJson), selected: post ? taxonomy.termsOf("post", post.id) : { categories: [], tags: [], primary: null } },
    courses: db.prepare("SELECT slug, title FROM courses WHERE published = 1 AND archived = 0 ORDER BY title COLLATE NOCASE").all(),
    statuses: blog.STATUSES, languages: Object.keys(LANGUAGES), currentUserId: req.session.user.id,
    aiConfigured: blogAi.isConfigured(), siteUrl: absoluteUrl(req, "/").replace(/\/$/, ""),
    newsletterReady: Boolean(marketing && marketing.ready && newsletterForm(req)),
    editorTheme: editorTheme.describe(db.prepare("SELECT editor_theme, editor_color FROM user_prefs WHERE user_id = ?").get(req.session.user.id)), editorThemes: editorTheme.THEMES,
    seoWorkspace: seoWorkspace.prefsOf(req.session.user.id),
    editorPrefs: reusable.prefsOf(req.session.user.id),
  };
}

// Contrôle SEO avant publication (panneau de publication de l'éditeur) et historique SEO de l'article
router.post("/formateur/blog/api/seo-check", upload.none(), (req, res) => {
  const existing = /^\d{1,9}$/.test(String(req.body.post_id || "")) ? db.prepare("SELECT * FROM posts WHERE id = ?").get(Number(req.body.post_id)) : null;
  let f;
  // Données incomplètes (ex. titre vide) : le contrôle porte alors sur les valeurs brutes, pour tout signaler d'un coup
  try { f = readFields(req.body, existing); } catch (error) { if (!(error instanceof UserError)) throw error; f = { ...req.body, robots_index: req.body.robots_index === "0" ? 0 : 1 }; }
  const cover = libraryImage(req.body.cover_media) || (req.body.remove_cover === "1" ? null : existing && existing.cover_path);
  const og = libraryImage(req.body.og_image_media) || (req.body.remove_og_image === "1" ? null : existing && existing.og_image_path);
  res.json(seoGuard.checkPost({ ...f, slug: req.body.slug || (existing && existing.slug) || f.title, cover_path: cover, og_image_path: og }, { req, postId: existing ? existing.id : null }));
});
router.get("/formateur/blog/:id/seo-historique", loadPost, (req, res) => {
  res.json({ changes: seoStore.listChanges({ entityType: "post", entityKey: req.post.id, limit: 100 }).map((c) => ({ field: c.field, before: c.old_value, after: c.new_value, at: c.created_at, by: c.username, source: c.source })) });
});

// SEO CORE dans l'éditeur : problèmes trouvés par le dernier audit du site pour cet article, et analyse à la demande
// de la page réellement en ligne (mêmes règles que l'audit). Lecture seule : rien n'est modifié dans l'article.
const seoIssueJson = (i) => {
  const rule = seoRules.BY_ID[i.rule_id] || {};
  return { rule: i.rule_id, title: rule.title || i.rule_id, severity: i.severity, severityLabel: (seoRules.SEVERITIES[i.severity] || {}).label || i.severity, category: seoRules.CATEGORIES[i.category] || i.category, detail: i.detail, recommendation: rule.recommendation || null };
};
const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
const bySeverity = (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
router.get("/formateur/blog/:id/seo-audit", loadPost, (req, res) => res.json(seoWorkspace.auditPart(req.post)));
router.post("/formateur/blog/:id/seo-analyse", loadPost, async (req, res) => {
  if (!req.post.published) return res.status(409).json({ error: "L'article n'est pas en ligne : publiez-le pour analyser la page réelle. Le contrôle avant publication vérifie déjà le brouillon." });
  const path = `/blog/${req.post.slug}`;
  try {
    const r = await seoAudit.analyzePage(path, req);
    if (r.status !== 200) return res.status(502).json({ error: r.error ? `Page injoignable : ${r.error}` : `La page en ligne a répondu ${r.status}.` });
    res.json({ path, at: new Date().toISOString(), issues: r.issues.map(seoIssueJson).sort(bySeverity), score: r.scores && r.scores.overall ? r.scores.overall.score : null });
  } catch (e) {
    console.error("[KOLAKISA] Analyse SEO de l'article :", e && e.message);
    res.status(500).json({ error: "Analyse impossible pour le moment." });
  }
});

// ---------- Espace de travail SEO (panneaux de l'éditeur) ----------
// Données réelles de l'article, par partie, en un seul appel (couche de données partagée des panneaux)
router.get("/formateur/blog/:id(\\d+)/espace-seo", loadPost, async (req, res) => {
  const parts = String(req.query.parties || "").split(",").map((x) => x.trim()).filter(Boolean);
  try { res.json(await seoWorkspace.articleData(req.post, req, parts)); } catch (e) {
    console.error("[KOLAKISA] Espace SEO :", e && e.message);
    res.status(500).json({ error: "Données SEO indisponibles pour le moment." });
  }
});
// Mesure PageSpeed de la page de l'article (Google PageSpeed Insights, réelle)
router.post("/formateur/blog/:id(\\d+)/espace-seo/pagespeed", express.json({ limit: "2kb" }), loadPost, async (req, res) => {
  const { psi: p } = await seoWorkspace.articleData(req.post, req, ["psi"]);
  if (!p.canRun) return res.status(409).json({ error: p.reason || "Mesure impossible." });
  const r = await seoIntegrations.runPageSpeed(p.url, req.body && req.body.strategy === "desktop" ? "desktop" : "mobile");
  if (!r.ok) return res.status(502).json({ error: r.error });
  res.json({ ok: true, result: r.result });
});
// Images du contenu en cours d'écriture : fichier réellement présent, dimensions, poids
router.post("/formateur/blog/api/espace-seo/images", express.json({ limit: "64kb" }), (req, res) => {
  const srcs = (Array.isArray(req.body && req.body.srcs) ? req.body.srcs : []).slice(0, 60).map(String);
  res.json({ images: srcs.map((src) => ({ src, ...(src.startsWith("/uploads/") ? seoImages.probe(src) : { external: /^https?:\/\//i.test(src), exists: null }) })) });
});
// Disposition : la dernière (enregistrée automatiquement) et les dispositions nommées
router.put("/formateur/blog/api/espace-seo/disposition", express.json({ limit: "64kb" }), (req, res) => {
  const r = seoWorkspace.saveLayout(req.session.user.id, req.body && req.body.layout);
  res.status(r.ok ? 200 : 400).json(r.ok ? { ok: true } : { error: r.error });
});
router.post("/formateur/blog/api/espace-seo/dispositions", express.json({ limit: "64kb" }), (req, res) => {
  const r = seoWorkspace.saveNamed(req.session.user.id, req.body && req.body.name, req.body && req.body.layout);
  res.status(r.ok ? 200 : 400).json(r.ok ? { ok: true, name: r.name, saved: seoWorkspace.prefsOf(req.session.user.id).saved } : { error: r.error });
});
router.get("/formateur/blog/api/espace-seo/dispositions/:name", (req, res) => {
  const layout = seoWorkspace.getNamed(req.session.user.id, req.params.name);
  if (!layout) return res.status(404).json({ error: "Disposition introuvable." });
  res.json({ layout });
});
router.delete("/formateur/blog/api/espace-seo/dispositions/:name", (req, res) => {
  seoWorkspace.deleteNamed(req.session.user.id, req.params.name);
  res.json({ ok: true, saved: seoWorkspace.prefsOf(req.session.user.id).saved });
});
// Mode Fun : préférences et progression ludiques uniquement (aucune donnée SEO n'est accessible par cette route)
router.put("/formateur/blog/api/espace-seo/fun", express.json({ limit: "8kb" }), (req, res) => {
  res.json({ ok: true, fun: seoWorkspace.saveFun(req.session.user.id, req.body && req.body.fun) });
});

// ---------- Blocs réutilisables et préférences de l'éditeur ----------
const reusableJson = (b) => { const u = reusable.usage(b.id); return { id: b.id, name: b.name, category: b.category, content: b.content, createdAt: b.created_at, updatedAt: b.updated_at, uses: u.posts.length, occurrences: u.occurrences }; };
const userError = (res, e) => { if (e instanceof UserError) return res.status(400).json({ error: e.message }); throw e; };
router.get("/formateur/blog/api/blocs", (req, res) => res.json({ blocks: reusable.list({ q: String(req.query.q || "") }).map(reusableJson) }));
router.get("/formateur/blog/api/blocs/:bid(\\d+)", (req, res) => { const b = reusable.get(Number(req.params.bid)); if (!b) return res.status(404).json({ error: "Bloc introuvable." }); res.json({ block: reusableJson(b) }); });
router.post("/formateur/blog/api/blocs", express.json({ limit: "600kb" }), (req, res) => {
  try { res.json({ block: reusableJson(reusable.create(req.body || {}, req.session.user.id)) }); } catch (e) { userError(res, e); }
});
router.post("/formateur/blog/api/blocs/:bid(\\d+)", express.json({ limit: "600kb" }), (req, res) => {
  try { res.json({ block: reusableJson(reusable.update(Number(req.params.bid), req.body || {})) }); } catch (e) { userError(res, e); }
});
router.post("/formateur/blog/api/blocs/:bid(\\d+)/supprimer", express.json({ limit: "2kb" }), (req, res) => {
  try { res.json({ ok: true, ...reusable.remove(Number(req.params.bid), { mode: (req.body || {}).mode || null }) }); } catch (e) { userError(res, e); }
});
// Où le bloc est utilisé (articles et nombre d'occurrences)
router.get("/formateur/blog/api/blocs/:bid(\\d+)/utilisations", (req, res) => {
  if (!reusable.get(Number(req.params.bid))) return res.status(404).json({ error: "Bloc introuvable." });
  res.json(reusable.usage(Number(req.params.bid)));
});
router.post("/formateur/blog/api/blocs/:bid(\\d+)/dupliquer", (req, res) => {
  try { res.json({ block: reusableJson(reusable.duplicate(Number(req.params.bid), req.session.user.id)) }); } catch (e) { userError(res, e); }
});
router.put("/formateur/blog/api/preferences", express.json({ limit: "16kb" }), (req, res) => res.json({ prefs: reusable.savePrefs(req.session.user.id, req.body || {}) }));

// Apparence des barres latérales de l'éditeur (choix personnel, enregistré sur le compte)
router.post("/formateur/blog/api/apparence", express.json(), (req, res) => {
  const { key, color } = editorTheme.normalize(String((req.body || {}).theme || ""), (req.body || {}).color);
  if (String((req.body || {}).theme) === "perso" && key !== "perso") return res.status(400).json({ error: "Couleur invalide : choisissez une couleur au format #rrggbb." });
  db.prepare("INSERT INTO user_prefs (user_id, editor_theme, editor_color) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET editor_theme = excluded.editor_theme, editor_color = excluded.editor_color").run(req.session.user.id, key, color);
  res.json({ ok: true, ...editorTheme.describe({ editor_theme: key, editor_color: color }) });
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
  blog.promoteScheduled();
  res.render("instructor/blog-list", { posts: db.prepare("SELECT * FROM posts WHERE deleted_at IS NULL ORDER BY id DESC").all(), newsletter, saved: req.query.enregistre === "1", statuses: blog.STATUSES });
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

router.get("/formateur/blog/nouveau", (req, res) => {
  res.render("instructor/blog-form", { ...editorData(req, null), saved: false });
});

router.get("/formateur/blog/:id/modifier", loadPost, (req, res) => {
  res.render("instructor/blog-form", { ...editorData(req, req.post), saved: req.query.enregistre === "1" });
});

// Création (formulaire classique ou éditeur)
router.post("/formateur/blog/nouveau", files, withCleanup((req, res) => {
  const f = readFields(req.body);
  const st = applyStatus(req.body, null, f);
  guardPublication(f, st.status, req, { slug: req.body.slug });
  const cover = registerUpload(req, fileOf(req, "thumbnail"), f.cover_alt) || libraryImage(req.body.cover_media);
  const og = registerUpload(req, fileOf(req, "og_image")) || libraryImage(req.body.og_image_media);
  const tw = registerUpload(req, fileOf(req, "twitter_image")) || libraryImage(req.body.twitter_image_media);
  const slugWanted = oneLine(req.body.slug, 120);
  const cols = { ...f, slug: uniqueSlug(slugWanted || f.title), cover_path: cover, featured_media_id: (cmsMedia(cover) || {}).id || null, og_image_path: og, twitter_image_path: tw, author_id: f.author_id ?? req.session.user.id,
    seo_title: f.seo_title || null, seo_description: f.seo_description || null, og_title: f.og_title || null, og_description: f.og_description || null,
    twitter_title: f.twitter_title || null, twitter_description: f.twitter_description || null, canonical_url: f.canonical_url || null, ...st };
  const names = Object.keys(cols);
  // Article et classement (catégories, étiquettes) enregistrés ensemble : tout ou rien
  const newId = transaction(db, () => {
    const info = db.prepare(`INSERT INTO posts (${names.join(", ")}) VALUES (${names.map(() => "?").join(", ")})`).run(...names.map((n) => cols[n]));
    const id = Number(info.lastInsertRowid);
    applyTaxonomy(id, req.body);
    return id;
  });
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(newId);
  blog.addRevision(post, req.session.user.id, "Création de l'article", "create");
  if (wantsJson(req)) return res.json({ ok: true, id: post.id, slug: post.slug, status: post.status, published: post.published, publishedAt: post.published_at, editUrl: `/formateur/blog/${post.id}/modifier`, updatedAt: post.updated_at, coverPath: post.cover_path, ogImagePath: post.og_image_path, twitterImagePath: post.twitter_image_path, revisions: blog.listRevisions(post.id).slice(0, 20) });
  res.redirect(`/formateur/blog/${post.id}/modifier?enregistre=1`);
}));

// Enregistrement (formulaire classique ou éditeur)
router.post("/formateur/blog/:id/modifier", loadPost, files, withCleanup((req, res) => {
  const p = req.post;
  const f = readFields(req.body, p);
  const st = applyStatus(req.body, p, f);
  guardPublication(f, st.status, req, { slug: req.body.slug || p.slug, cover_path: libraryImage(req.body.cover_media) || (req.body.remove_cover === "1" ? null : p.cover_path) });
  // L'adresse ne change pas quand on retouche le titre ; elle ne change que si le formateur la modifie lui-même.
  // Article déjà publié : l'ancienne adresse est gardée et redirige (301) vers la nouvelle, les liens partagés restent valides.
  const slugWanted = oneLine(req.body.slug, 120);
  const slug = slugWanted && slugify(slugWanted) !== p.slug ? uniqueSlug(slugWanted, p.id) : p.slug;
  if (slug !== p.slug) {
    if (p.published_at) db.prepare("INSERT OR REPLACE INTO post_slug_history (old_slug, post_id) VALUES (?, ?)").run(p.slug, p.id);
    db.prepare("DELETE FROM post_slug_history WHERE old_slug = ?").run(slug);
  }
  const pick = (field, remove, media) => {
    const uploaded = registerUpload(req, fileOf(req, field), field === "thumbnail" ? f.cover_alt : "");
    if (uploaded) return uploaded;
    const fromLibrary = libraryImage(req.body[media]);
    if (fromLibrary) return fromLibrary;
    return req.body[remove] === "1" ? null : p[field === "thumbnail" ? "cover_path" : `${field}_path`];
  };
  const cols = {
    ...f, slug, cover_path: pick("thumbnail", "remove_cover", "cover_media"), featured_media_id: null, og_image_path: pick("og_image", "remove_og_image", "og_image_media"), twitter_image_path: pick("twitter_image", "remove_twitter_image", "twitter_image_media"),
    author_id: f.author_id ?? p.author_id, seo_title: f.seo_title || null, seo_description: f.seo_description || null, og_title: f.og_title || null, og_description: f.og_description || null,
    twitter_title: f.twitter_title || null, twitter_description: f.twitter_description || null, canonical_url: f.canonical_url || null, ...st,
  };
  cols.featured_media_id = (cmsMedia(cols.cover_path) || {}).id || null; // référence stable vers la médiathèque du CMS (null si l'image vient d'ailleurs)
  const names = Object.keys(cols);
  transaction(db, () => {
    db.prepare(`UPDATE posts SET ${names.map((n) => `${n} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`).run(...names.map((n) => cols[n]), p.id);
    applyTaxonomy(p.id, req.body); // classement : relations de la taxonomie, puis miroir texte de l'article
  });
  const after = db.prepare("SELECT * FROM posts WHERE id = ?").get(p.id);
  blog.addRevision(after, req.session.user.id, blog.describeChange(p, after), blog.revisionKind(p, after));
  blockTrash.settle(p.id, after.content); // blocs de nouveau dans l'article (restaurés ou « Annuler ») : retirés de la corbeille
  for (const field of SEO_LOGGED) seoStore.logChange({ entityType: "post", entityKey: String(p.id), field, before: p[field], after: after[field], userId: req.session.user.id, source: "editor" });
  blog.clearAutosave(p.id);
  // Images remplacées : supprimées (fichier et médiathèque) seulement si plus aucun article ne les utilise
  for (const col of ["cover_path", "og_image_path", "twitter_image_path"]) {
    if (p[col] && p[col] !== after[col]) forgetIfUnused(p[col]);
  }
  if (wantsJson(req)) return res.json({ ok: true, id: after.id, slug: after.slug, status: after.status, published: after.published, publishedAt: after.published_at, updatedAt: after.updated_at, coverPath: after.cover_path, ogImagePath: after.og_image_path, twitterImagePath: after.twitter_image_path, revisions: blog.listRevisions(after.id, { limit: 20 }), revisionTotal: blog.countRevisions(after.id) });
  res.redirect(`/formateur/blog/${p.id}/modifier?enregistre=1`);
}));

// Publier / dépublier (liste des articles) ; la date de première publication est conservée
router.post("/formateur/blog/:id/publier", loadPost, (req, res) => {
  const p = req.post;
  const publish = !p.published;
  if (publish && !String(p.content || "").replace(/<[^>]*>/g, "").trim()) throw new UserError("Impossible de publier un article vide.");
  db.prepare("UPDATE posts SET published = ?, status = ?, published_at = CASE WHEN ? = 1 THEN COALESCE(published_at, datetime('now')) ELSE published_at END, updated_at = datetime('now') WHERE id = ?")
    .run(publish ? 1 : 0, publish ? "published" : "draft", publish ? 1 : 0, p.id);
  blog.addRevision(db.prepare("SELECT * FROM posts WHERE id = ?").get(p.id), req.session.user.id, publish ? "Statut : Publié" : "Statut : Brouillon", publish ? "publish" : "status");
  res.redirect("/formateur/blog");
});

router.post("/formateur/blog/:id/supprimer", loadPost, (req, res) => {
  const kept = blog.revisionImages(db.prepare("SELECT meta FROM post_revisions WHERE post_id = ?").all(req.post.id));
  db.prepare("DELETE FROM posts WHERE id = ?").run(req.post.id); // révisions supprimées avec l'article (ON DELETE CASCADE)
  for (const p of new Set([...["cover_path", "og_image_path", "twitter_image_path"].map((col) => req.post[col]).filter(Boolean), ...kept])) forgetIfUnused(p);
  res.redirect("/formateur/blog");
});

// ---------- Sauvegarde automatique ----------
// Un nouvel article reçoit un brouillon dès la première sauvegarde automatique (rien n'est perdu en cas de rafraîchissement)
router.post("/formateur/blog/api/brouillon", upload.none(), (req, res) => {
  const title = oneLine(req.body.title, 150) || "Article sans titre";
  const info = db.prepare("INSERT INTO posts (slug, title, content_format, status, author_id) VALUES (?, ?, 'html', 'draft', ?)").run(uniqueSlug(title), title, req.session.user.id);
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(Number(info.lastInsertRowid));
  blog.addRevision(post, req.session.user.id, "Création de l'article (sauvegarde automatique)", "create");
  res.json({ ok: true, id: post.id, slug: post.slug, editUrl: `/formateur/blog/${post.id}/modifier` });
});

router.post("/formateur/blog/:id/autosave", loadPost, upload.none(), (req, res) => {
  const data = {};
  for (const [k, v] of Object.entries(req.body)) if (typeof v === "string" && /^[a-z_]{1,40}$/.test(k)) data[k] = v.slice(0, k === "content" ? MAX_HTML : 5000);
  if (data.content) data.content = reusable.pruneMissing(sanitizeBlogHtml(data.content));
  const savedAt = blog.setAutosave(req.post.id, req.session.user.id, data);
  res.json({ ok: true, savedAt });
});

router.post("/formateur/blog/:id/autosave/abandonner", loadPost, (req, res) => {
  blog.clearAutosave(req.post.id);
  res.json({ ok: true });
});

// ---------- Aperçu (ordinateur, tablette, mobile) : la dernière sauvegarde automatique, sinon l'article enregistré ----------
router.get("/formateur/blog/:id/apercu", loadPost, (req, res) => {
  const auto = blog.getAutosave(req.post.id);
  const merged = { ...req.post };
  if (auto && auto.saved_at >= req.post.updated_at) {
    const d = auto.data;
    for (const k of ["title", "excerpt", "category", "tags", "cover_alt", "seo_title", "seo_description"]) if (typeof d[k] === "string") merged[k] = d[k];
    if (typeof d.content === "string") { merged.content = d.content; merged.content_format = "html"; }
    if (d.toc_enabled !== undefined) merged.toc_enabled = flag(d.toc_enabled, 1);
    if (d.toc_depth) merged.toc_depth = ["2", "3", "4"].includes(String(d.toc_depth)) ? Number(d.toc_depth) : 3;
    if (["none", "h2", "full"].includes(d.toc_numbering)) merged.toc_numbering = d.toc_numbering;
    if (typeof d.toc_title === "string") merged.toc_title = d.toc_title;
    if (IMG_PATH.test(d.cover_media || "") || cmsMedia(d.cover_media)) merged.cover_path = d.cover_media;
  }
  res.set("Cache-Control", "no-store");
  renderPostPage(req, res, merged, { preview: true });
});

// ---------- Corbeille des blocs (Structure de l'article → Corbeille) ----------
router.get("/formateur/blog/:id(\\d+)/corbeille", loadPost, (req, res) => res.json({ items: blockTrash.list(req.post.id) }));
router.post("/formateur/blog/:id(\\d+)/corbeille", express.json({ limit: "512kb" }), loadPost, (req, res) => {
  try { res.json({ item: blockTrash.add(req.post.id, req.body || {}, req.session.user.id) }); } catch (e) { if (e instanceof UserError) return res.status(400).json({ error: e.message }); throw e; }
});
router.delete("/formateur/blog/:id(\\d+)/corbeille/:blockId", loadPost, (req, res) => {
  try { res.json({ ok: blockTrash.purge(req.post.id, req.params.blockId) }); } catch (e) { if (e instanceof UserError) return res.status(400).json({ error: e.message }); throw e; }
});
router.delete("/formateur/blog/:id(\\d+)/corbeille", loadPost, (req, res) => res.json({ removed: blockTrash.empty(req.post.id) }));

// ---------- Versions (révisions) ----------
// Accès : tout formateur connecté (comme l'édition de l'article, router.use(requireInstructor)) ; une révision n'est lue ou
// restaurée qu'à travers SON article (post_id vérifié par blog.getRevision) : jamais celle d'un autre article.
const revisionId = (raw) => (/^\d{1,12}$/.test(String(raw)) ? Number(raw) : 0);
router.get("/formateur/blog/:id(\\d+)/versions", loadPost, (req, res) => {
  const limit = Math.min(Number(req.query.limite) || 30, 100);
  const revisions = blog.listRevisions(req.post.id, { before: revisionId(req.query.avant), limit });
  res.json({ revisions, total: blog.countRevisions(req.post.id), more: revisions.length === limit && blog.listRevisions(req.post.id, { before: revisions[revisions.length - 1].id, limit: 1 }).length > 0 });
});

router.get("/formateur/blog/:id(\\d+)/versions/:rid", loadPost, (req, res) => {
  const r = blog.getRevision(req.post.id, revisionId(req.params.rid));
  if (!r) return res.status(404).json({ error: "Version introuvable." });
  const html = blog.renderPost({ ...req.post, content: r.content, content_format: r.content_format }).html;
  res.json({
    id: r.id, title: r.title, excerpt: r.excerpt, content: r.content, content_format: r.content_format, note: r.note, kind: r.kind, kindLabel: r.kindLabel, author: r.author, created_at: r.created_at, html,
    meta: r.meta, // réglages enregistrés avec la révision (vide pour les révisions antérieures à leur prise en charge)
    current: { title: req.post.title, excerpt: req.post.excerpt || "", content: req.post.content || "", content_format: req.post.content_format, meta: blog.metaOf(req.post) }, // article tel qu'enregistré
    isCurrent: r.fingerprint !== "" && r.fingerprint === blog.revisionFingerprint(req.post),
    restored: blog.RESTORED_META,
  });
});

// Restauration : une seule transaction. L'état actuel est d'abord garanti dans l'historique (« Avant restauration » s'il n'y
// est pas déjà), puis la révision choisie devient le contenu de l'article, et la restauration est elle-même une révision.
// Rien n'est supprimé : on peut toujours revenir à l'état d'avant.
router.post("/formateur/blog/:id(\\d+)/versions/:rid/restaurer", loadPost, (req, res) => {
  const fail = (status, error) => (wantsJson(req) ? res.status(status).json({ error }) : res.status(status).render("error", { message: error }));
  const r = blog.getRevision(req.post.id, revisionId(req.params.rid));
  if (!r) return fail(404, "Version introuvable.");
  const before = req.post;
  const kept = []; // réglages non rendus (image d'origine supprimée…)
  const result = transaction(db, () => {
    const current = db.prepare("SELECT * FROM posts WHERE id = ?").get(before.id);
    const cols = { title: r.title, excerpt: r.excerpt, content: r.content_format === "html" ? reusable.pruneMissing(r.content) : r.content, content_format: r.content_format };
    for (const k of blog.RESTORED_META) {
      if (!Object.hasOwn(r.meta, k)) continue; // révision ancienne : réglage non connu, valeur actuelle gardée
      let v = r.meta[k];
      if (/_path$/.test(k) && v && !fs.existsSync(path.join(uploadsRoot, String(v).replace(/^\/uploads\//, "")))) { if (v !== current[k]) kept.push(k); continue; }
      if (k === "author_id" && v && !db.prepare("SELECT 1 FROM users WHERE id = ? AND role = 'formateur'").get(v)) { kept.push(k); continue; }
      cols[k] = v;
    }
    const restoredState = { ...current, ...cols };
    if (blog.revisionFingerprint(restoredState) === blog.revisionFingerprint(current)) return { same: true };
    // L'état actuel doit être dans l'historique avant d'être remplacé (sans doublon s'il y est déjà)
    blog.addRevision(current, req.session.user.id, "État de l'article avant la restauration", "before_restore");
    const names = Object.keys(cols);
    db.prepare(`UPDATE posts SET ${names.map((n) => `${n} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`).run(...names.map((n) => cols[n]), current.id);
    const after = db.prepare("SELECT * FROM posts WHERE id = ?").get(current.id);
    const when = new Date(`${r.created_at.replace(" ", "T")}Z`).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });
    const revision = blog.addRevision(after, req.session.user.id, `Restauration de la version du ${when}`, "restore");
    blog.clearAutosave(current.id);
    blockTrash.settle(current.id, after.content);
    for (const field of SEO_LOGGED) seoStore.logChange({ entityType: "post", entityKey: String(current.id), field, before: current[field], after: after[field], userId: req.session.user.id, source: "editor" });
    return { after, revision };
  });
  if (result.same) return fail(409, "Cette version est déjà la version actuelle.");
  if (wantsJson(req)) return res.json({ ok: true, revision: result.revision, kept, revisions: blog.listRevisions(req.post.id), revisionTotal: blog.countRevisions(req.post.id) });
  res.redirect(`/formateur/blog/${req.post.id}/modifier?restaure=1`);
});

// ---------- Médiathèque ----------
router.get("/formateur/blog/api/medias", (req, res) => {
  const media = blog.listMedia({ q: String(req.query.q || ""), kind: String(req.query.type || "") });
  // missing : fiche présente mais fichier absent du serveur — affiché « Fichier introuvable », jamais en image cassée muette
  res.json({ media: media.map((m) => ({ ...m, used: blog.imageReferences(m.path).length, missing: !fileExists(uploadsRoot, m.path) })) });
});

const mediaUpload = upload.fields([{ name: "article_image", maxCount: 1 }, { name: "article_video", maxCount: 1 }, { name: "article_audio", maxCount: 1 }, { name: "image_variant", maxCount: 4 }]);
// Versions réduites d'une image (WebP, préparées par le navigateur) : <nom>-<largeur>w.webp à côté de l'original.
// Chaque fichier est vérifié (vraiment du WebP, largeur annoncée = largeur réelle, plus petit que l'original) sinon supprimé.
function keepVariants(req, mainFile, mainWidth) {
  const files = (req.files && req.files.image_variant) || [];
  const widths = String(req.body.variant_widths || "").split(",").map((w) => Number(w));
  const base = mainFile.filename.replace(/\.[a-z0-9]+$/i, "");
  const kept = [];
  files.forEach((f, i) => {
    const w = widths[i];
    const dims = seoImages.readDimensions(fs.readFileSync(f.path));
    const ok = f.mimetype === "image/webp" && Number.isInteger(w) && [480, 960, 1600].includes(w) && dims && dims.format === "webp" && dims.width === w && (!mainWidth || w < mainWidth);
    if (!ok) { fs.unlink(f.path, () => {}); return; }
    const target = path.join(path.dirname(f.path), `${base}-${w}w.webp`);
    fs.renameSync(f.path, target);
    kept.push(w);
  });
  return kept;
}
router.post("/formateur/blog/api/medias", mediaUpload, (req, res) => {
  const image = fileOf(req, "article_image");
  const video = fileOf(req, "article_video");
  const audio = fileOf(req, "article_audio");
  const file = image || video || audio;
  if (!file) return res.status(400).json({ error: "Choisissez un fichier (image, vidéo MP4/WebM ou audio MP3)." });
  const kind = image ? "image" : video ? "video" : "audio";
  const path = image ? `/uploads/thumbnails/${file.filename}` : `/uploads/blog/${file.filename}`;
  const dim = (v) => (/^\d{1,5}$/.test(String(v || "")) ? Number(v) : null);
  const media = blog.addMedia({ path, kind, mime: file.mimetype, size: file.size, width: dim(req.body.width), height: dim(req.body.height), alt: oneLine(req.body.alt, 300), title: oneLine(req.body.title, 200), userId: req.session.user.id });
  const variants = image ? keepVariants(req, file, dim(req.body.width)) : [];
  if (!image) for (const f of (req.files && req.files.image_variant) || []) fs.unlink(f.path, () => {});
  res.json({ media, path, variants });
});

// Ancienne adresse d'envoi d'image (barre d'outils précédente) : conservée, l'image rejoint la médiathèque
router.post("/formateur/blog/images", upload.single("article_image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Choisissez une image (JPEG, PNG, WebP, GIF ou AVIF)." });
  const path = registerUpload(req, req.file);
  res.json({ path });
});

router.post("/formateur/blog/api/medias/:mid", (req, res) => {
  const m = blog.getMedia(Number(req.params.mid));
  if (!m) return res.status(404).json({ error: "Fichier introuvable." });
  res.json({ media: blog.updateMedia(m.id, req.body || {}) });
});

router.post("/formateur/blog/api/medias/:mid/supprimer", (req, res) => {
  const m = blog.getMedia(Number(req.params.mid));
  if (!m) return res.status(404).json({ error: "Fichier introuvable." });
  const usage = blog.imageReferences(m.path); // partout où l'image est citée, pas seulement dans les articles
  if (usage.length) return res.status(400).json({ error: `Ce fichier est encore utilisé : ${usage.slice(0, 5).join(", ")}${usage.length > 5 ? "…" : ""}. Retirez-le d'abord de ces endroits.` });
  db.prepare("DELETE FROM media WHERE id = ?").run(m.id);
  removeUploadedFile(m.path, "supprimée à la main depuis la médiathèque");
  for (const v of blog.imageVariants(m.path)) removeUploadedFile(v.src, "version réduite d'une image supprimée");
  res.json({ ok: true });
});

// ---------- Classement : catégories et étiquettes (sélecteur de l'éditeur, création rapide) ----------
// GET : catégories en arbre (sans recherche) ou termes qui correspondent (étiquettes : saisie semi-automatique) ; POST : création réelle
const termJson = (t) => ({ id: t.id, name: t.name, slug: t.slug, taxonomy: t.taxonomy, parent_id: t.parent_id, depth: t.depth || 0, count: t.n ?? t.total ?? 0 });
router.get("/formateur/blog/api/termes", (req, res) => {
  const key = req.query.taxonomy === "tag" ? "tag" : "category";
  const q = String(req.query.q || "").trim().slice(0, 60);
  if (key === "category" && !q) return res.json({ terms: taxonomy.tree("category").map(termJson) });
  const found = taxonomy.list({ taxonomy: key, q, sort: q ? "nom" : "utilisation", perPage: Math.min(Number(req.query.limite) || 12, 50) });
  res.json({ terms: found.rows.map(termJson) });
});
router.post("/formateur/blog/api/termes", express.json({ limit: "4kb" }), (req, res) => {
  const b = req.body || {};
  try {
    const key = b.taxonomy === "tag" ? "tag" : "category";
    const term = key === "tag" ? taxonomy.findOrCreateTag(b.name) : taxonomy.create({ taxonomy: "category", name: b.name, parentId: b.parent_id ? Number(b.parent_id) : null });
    res.status(201).json({ term: termJson({ ...term, depth: key === "category" && term.parent_id ? taxonomy.ancestors(term.id).length : 0 }) });
  } catch (e) { if (e instanceof UserError) return res.status(400).json({ error: e.message }); throw e; }
});

// ---------- Liens internes ----------
router.get("/formateur/blog/api/liens", (req, res) => res.json({ results: blog.searchLinks(String(req.query.q || "").slice(0, 80), 12) }));

router.post("/formateur/blog/api/suggestions", (req, res) => {
  const b = req.body || {};
  const linked = Array.isArray(b.linked) ? b.linked.map(String).slice(0, 200) : [];
  res.json({ suggestions: blog.suggestLinks({ text: String(b.text || "").slice(0, 60000), postId: Number(b.postId) || 0, alreadyLinked: linked }) });
});

// ---------- Assistant IA (propositions uniquement) ----------
const aiLimiter = createRateLimiter(40, 60 * 60 * 1000); // 40 demandes par heure et par formateur
router.get("/formateur/blog/api/ia", (req, res) => res.json({ configured: blogAi.isConfigured(), actions: Object.fromEntries(Object.entries(blogAi.ACTIONS).map(([k, a]) => [k, { label: a.label, scope: a.scope }])) }));
router.post("/formateur/blog/api/ia", async (req, res, next) => {
  const key = `ia:${req.session.user.id}`;
  if (aiLimiter.isLimited(key)) return res.status(429).json({ error: "Limite atteinte : 40 demandes à l'IA par heure. Réessayez plus tard." });
  aiLimiter.hit(key);
  try {
    const b = req.body || {};
    const input = { action: String(b.action || ""), text: String(b.text || ""), article: String(b.article || ""), title: String(b.title || ""), keyword: String(b.keyword || "").slice(0, 80) };
    if (input.action === "liens") input.candidates = blog.searchLinks("", 60);
    res.json(await blogAi.assist(input));
  } catch (error) {
    if (error instanceof blogAi.AiError) return res.status(error.code === "not_configured" ? 503 : 400).json({ error: error.message, code: error.code });
    // Erreur imprévue : message compréhensible pour l'éditeur (l'article n'est jamais modifié) ; au journal, seulement le
    // type d'erreur — jamais la requête, ses en-têtes ni la clé
    console.error("[KOLAKISA] Assistant IA : erreur imprévue :", error && error.name, error && error.status ? `(statut ${error.status})` : "");
    res.status(502).json({ error: "L'assistant IA a rencontré une erreur inattendue. Votre article n'a pas été modifié : réessayez dans un instant.", code: "unexpected" });
  }
});

module.exports = router;
