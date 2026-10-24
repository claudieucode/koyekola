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
const cmsAccess = require("../services/cmsAccess");
const marketingOrgId = () => (db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get() || {}).id || null;
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
const siteContent = require("../services/siteContent");
const primarySite = require("../services/primarySite");
const urls = require("../services/urls");
const { transaction: siteTransaction } = require("../marketing/db/tx");
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
// Articles par page : réglage « Lecture » (Paramètres), 10 par défaut
// Lecture (Paramètres → Lecture) : valeurs du site de la requête (domaine propre) ou du site principal
const readingOf = (req) => (req && req.kwSite ? req.kwSite : require("../services/settings").main());
const perPage = (req) => readingOf(req).postsPerPage;
const MAX_MARKDOWN = 50000;
const MAX_HTML = 250000;
const NEWSLETTER_KEY = "blog.newsletter_form";
const LANGUAGES = { fr: "fr-FR", en: "en", es: "es", pt: "pt", de: "de", it: "it", ln: "ln" };
const IMG_PATH = /^\/uploads\/thumbnails\/[A-Za-z0-9_.-]{1,200}\.(?:png|jpe?g|webp|gif|avif)$/i;
// Image de la médiathèque du CMS : /uploads/marketing/<organisation>/[site-<id>/]<fichier> ; elle doit exister dans mk_media
const CMS_IMG_PATH = /^\/uploads\/marketing\/\d{1,9}\/(?:site-\d{1,9}\/)?[A-Za-z0-9_.-]{1,200}\.(?:png|jpe?g|webp|gif|avif)$/i;
// Fiche de la médiathèque pour cette adresse (sans contrôle de site : sert à retrouver l'identifiant d'une image DÉJÀ choisie)
const cmsMediaRow = (value) => {
  if (!CMS_IMG_PATH.test(String(value || ""))) return null;
  try { return db.prepare("SELECT id, path, alt, reach, site_id FROM mk_media WHERE path = ? AND deleted_at IS NULL AND type = 'image'").get(value) || null; } catch { return null; }
};
// MEDIA-01 : image CHOISIE pour un article du site `site` (null = site principal) : elle doit appartenir à la médiathèque de CE site (jamais celle d'un autre site, même si l'adresse est connue)
const cmsMedia = (value, site = null) => {
  const row = cmsMediaRow(value);
  if (!row) return null;
  return (row.reach === "site" ? row.site_id === site : site === null) ? row : null;
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
  // Contenus par site (R6 lot 4) : le domaine demandé ne montre QUE ses articles (domaine d'un site) ; le domaine principal ne montre pas ceux des sites qui ont leur domaine
  const scope = urls.contentScope("post", "posts.id", req.kwSite || null);
  if (scope) { where.push(scope.sql); params.push(...scope.params); }
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
  const PER_PAGE = perPage(req);
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
  const listed0 = req.kwList || null; // accueil en mode articles, ou page des articles : l'adresse publique n'est pas /blog
  const basePath = filter ? filter.path : listed0 ? listed0.basePath : "/blog";
  const heading = filter ? filter.heading : listed0 && listed0.title ? listed0.title : "Blog";
  const crumbs = filter ? [{ name: "Accueil", url: "/" }, { name: "Blog", url: "/blog" }, ...(filter.ancestors || []), { name: filter.label }] : [{ name: "Accueil", url: "/" }, { name: "Blog" }];
  // Données structurées : l'article à la une fait partie de la liste (en tête), comme les autres articles de la page
  const listed = featured && page === 1 ? [featured, ...posts] : posts;
  const seo = seoPages.blogList(req, { filter, page, basePath, heading, crumbs, posts: listed });
  // Résultats de recherche : pas d'indexation (contenu en double des listes), liens suivis
  if (q) seo.robots = "noindex, follow";
  const categories = blog.categories(scope).map((c) => ({ ...c, theme: themeFor(c) }));
  // Sections éditoriales de l'accueil du blog
  let popular = [], discover = null;
  if (hub && page === 1) {
    popular = blog.popular(3, 0, scope).map((p) => decorate(db.prepare("SELECT * FROM posts WHERE id = ?").get(p.id)));
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
  const isAuthor = Boolean(filter && filter.type === "author");
  const families = q ? ["search_results", "blog_archive"] : isAuthor ? ["author_archive", "blog_archive"] : isCat ? ["category_archive", "blog_archive"] : isTag ? ["tag_archive", "blog_archive"] : "blog_archive";
  // Archive affichée (catégorie, étiquette, auteur) : lue par les éléments « En-tête d'archive » et les listes « suivre l'archive »
  const archive = { type: filter ? filter.type : q ? "search" : "blog", name: filter ? (filter.name || filter.label) : "", id: filter && filter.type === "author" ? filter.id : null, termIds: filter && filter.termIds ? filter.termIds : [],
    title: filter ? filter.heading : q ? `Résultats pour « ${q} »` : "Blog", description: filter ? filter.lead : "", count: total, url: basePath, search: q || "" };
  themeRender.renderRegion(req, res, db, families, { category: isCat ? filter.name : "", categories: isCat ? (filter.ancestors || []).map((a) => a.name).reverse() : [], tag: isTag ? filter.name : "", query: { ...themeQuery, ...(q ? { q } : {}) }, scope: { archive } }, (themeTemplate) => {
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

// Flux RSS 2.0 du blog (palier 23) : les 20 derniers articles PUBLIÉS (jamais un brouillon, une programmation ou la corbeille) ; tout le texte est échappé.
// /feed est l'adresse que les lecteurs de flux essaient d'abord : elle redirige vers le vrai flux.
router.get("/feed", (req, res) => res.redirect(301, "/blog/feed.xml"));
// Recherche dans le site (palier 23) : articles PUBLIÉS et pages de site PUBLIÉES (jamais un brouillon, une page archivée, une étape de tunnel ni une page d'un autre domaine).
// Tous les mots saisis doivent figurer (sans tenir compte des accents ni des majuscules). Page en « noindex » : un résultat de recherche ne se référence pas.
router.get("/recherche", (req, res) => {
  const fold = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const q = String(req.query.q || "").replace(/\s+/g, " ").trim().slice(0, 100);
  let articles = [], pages = [];
  if (q) {
    const terms = fold(q).split(" ").filter(Boolean);
    const matches = (parts) => { const hay = fold(parts.join(" \n ")); return terms.every((t) => hay.includes(t)); };
    const scope = urls.contentScope("post", "posts.id", req.kwSite || null);
    articles = db.prepare(`SELECT * FROM posts WHERE published = 1 AND deleted_at IS NULL${scope ? " AND " + scope.sql : ""} ORDER BY published_at DESC, id DESC`).all(...(scope ? scope.params : []))
      .filter((p) => matches([p.title, p.excerpt, p.category, p.subcategory, p.tags, blog.textOf(p)])).slice(0, 30)
      .map((p) => ({ title: p.title, url: urls.publicPath("post", p), summary: excerptOf(p) }));
    pages = db.prepare("SELECT name, title, slug, description FROM mk_landing_pages WHERE status = 'published' AND archived_at IS NULL AND kind = 'page' AND site_id IS NULL ORDER BY published_at DESC, id DESC").all()
      .filter((p) => matches([p.name, p.title, p.description])).slice(0, 30)
      .map((p) => ({ title: p.title || p.name, url: `/p/${encodeURIComponent(p.slug)}`, summary: p.description || "" }));
  }
  res.set("Cache-Control", "private, no-cache").render("search", { q, articles, pages, seo: { noindex: true }, title: q ? `Recherche : ${q}` : "Recherche" });
});

router.get("/blog/feed.xml", (req, res) => {
  const { escapeXml } = require("../utils/seo");
  const feedScope = urls.contentScope("post", "posts.id", req.kwSite || null); // le flux d'un domaine ne contient que les articles de ce domaine
  const rows = db.prepare(`SELECT * FROM posts WHERE published = 1 AND deleted_at IS NULL${feedScope ? " AND " + feedScope.sql : ""} ORDER BY published_at DESC, id DESC LIMIT ?`).all(...(feedScope ? feedScope.params : []), readingOf(req).feedItems);
  const full = readingOf(req).feedContent === "full"; // Paramètres → Lecture : texte complet ou extrait
  const siteName = (req.kwSite && req.kwSite.name) || require("../seo/settings").get("site_name") || "KOLAKISA";
  const date = (value) => { const d = new Date(String(value || "").replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(value)) ? "" : "Z")); return Number.isNaN(d.getTime()) ? new Date(0).toUTCString() : d.toUTCString(); };
  const items = rows.map((p) => {
    const url = absoluteUrl(req, urls.publicPath("post", p));
    return `<item><title>${escapeXml(p.title)}</title><link>${escapeXml(url)}</link><guid isPermaLink="true">${escapeXml(url)}</guid><pubDate>${date(p.published_at)}</pubDate><description>${escapeXml(excerptOf(p))}</description>${full ? `<content:encoded><![CDATA[${String(blog.renderPost(p).html || "").replace(/\]\]>/g, "]]]]><![CDATA[>")}]]></content:encoded>` : ""}</item>`;
  }).join("");
  const channelLast = rows.length ? date(rows[0].published_at) : new Date(0).toUTCString();
  res.set("Content-Type", "application/rss+xml; charset=utf-8").set("Cache-Control", "public, no-cache");
  res.send(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>${escapeXml(siteName)} — Blog</title><link>${escapeXml(absoluteUrl(req, "/blog"))}</link><description>Les derniers articles du blog.</description><language>fr</language><lastBuildDate>${channelLast}</lastBuildDate><atom:link href="${escapeXml(absoluteUrl(req, "/blog/feed.xml"))}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`);
});

// Archives : adresses configurables (taxonomy.baseOf) ; un terme inexistant est une vraie 404 (jamais une archive « vide » inventée)
const categoryBase = taxonomy.defaultBase("category");
const tagBase = taxonomy.defaultBase("tag");
router.get(`${categoryBase}/:slug`, (req, res) => {
  const term = urls.resolveTerm("category", req.params.slug, req.kwSite || null);
  if (!term) return res.status(404).render("error", { message: "Catégorie introuvable." });
  const lineage = taxonomy.ancestors(term.id);
  renderList(req, res, { filter: { type: "category", termIds: taxonomy.subtreeIds(term.id), name: term.name, path: taxonomy.urlOf(term), label: term.name, heading: term.name, ancestors: lineage.map((a) => ({ name: a.name, url: taxonomy.urlOf(a) })),
    lead: term.description || `Nos articles « ${term.name} » : conseils, méthodes et ressources.` } });
});

router.get(`${tagBase}/:slug`, (req, res) => {
  const term = urls.resolveTerm("tag", req.params.slug, req.kwSite || null);
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
  const ownUrl = absoluteUrl(req, urls.publicPath("post", post));
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
  const pageScope = urls.contentScope("post", "posts.id", req.kwSite || null);
  const { previous, next } = post.published ? blog.neighbours(post, pageScope) : { previous: null, next: null };
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
    sidebar: { popular: blog.popular(4, post.id, pageScope), recent: blog.recent(4, post.id, pageScope), categories: blog.categories(pageScope), newsletter },
    similar: post.published ? blog.similar(post, 3, pageScope) : [],
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
const canModerate = (user) => Boolean(user && (user.role === "formateur" || (marketingOrgId() && cmsAccess.can(user.id, "comments.moderate", { organizationId: marketingOrgId() }))));
router.post("/blog/:slug/commentaires", (req, res) => {
  const found = urls.resolvePost(req.params.slug, req.kwSite || null); // même résolution que la page : un article d'un autre domaine est « introuvable » (aucun commentaire déposé ailleurs)
  const post = found && !found.redirect && found.row.published ? found.row : null;
  if (!post) return res.status(404).render("error", { message: "Article introuvable." });
  const back = `/blog/${req.params.slug}`;
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
  // Résolution dans le contexte du domaine (R6 lot 4) : adresse logique du site, ancienne adresse, article d'un autre domaine (301 vers SON domaine) ou introuvable
  const found = urls.resolvePost(req.params.slug, req.kwSite || null);
  const post = found ? found.row : null;
  // Brouillon, relecture, programmé ou archivé : visible seulement par le formateur (prévisualisation, non indexée) ; jamais révélé par une redirection
  if (!post || (!post.published && !isInstructor(req))) return res.status(404).render("error", { message: "Article introuvable." });
  if (found.redirect) return res.redirect(301, found.redirect);
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
      .prepare("SELECT * FROM posts WHERE published = 1 AND robots_index = 1 AND (canonical_url IS NULL OR canonical_url = '') ORDER BY published_at DESC")
      .all()
      .map((p) => ({ path: urls.publicPath("post", p), lastmod: isoDate(p.updated_at) })),
  ];
};

// ---------- Éditeur (formateur) ----------

// Vérifié AVANT la réception d'un fichier : un élève ne peut rien envoyer.
// Le compte créateur garde tous les droits. Les AUTRES membres de l'équipe n'ouvrent que de quoi RÉDIGER (créer, modifier, aperçu, sauvegarde
// automatique, versions), selon leurs droits : « articles.write » = tous les articles ; « articles.edit_own » = seulement les leurs. Publier reste
// un droit à part (« articles.publish ») ; tout le reste de l'espace du blog (liste du créateur, SEO, apparence, IA, bibliothèque) reste réservé au créateur.
const WRITER_ROUTES = [
  /^\/nouveau$/, /^\/api\/brouillon$/, /^\/api\/(?:liens|suggestions|seo-check|termes)$/,
  /^\/\d+\/(?:modifier|apercu|autosave|autosave\/abandonner|versions|corbeille)$/, /^\/\d+\/versions\/\d+(?:\/restaurer)?$/, /^\/\d+\/corbeille\/[^/]+$/,
];
function requireBlogAccess(req, res, next) {
  const user = req.session.user;
  if (!user) return res.redirect(`/connexion?redirect=${encodeURIComponent(req.originalUrl)}`);
  if (user.role === "formateur") return next();
  const asJson = wantsJson(req) || req.path.startsWith("/api/");
  const deny = (message) => (asJson ? res.status(403).json({ error: message }) : res.status(403).render("error", { message }));
  const orgId = marketingOrgId();
  // Accès limité à certains sites (décision A-D9 : l'éditeur s'ouvre « avec les droits articles.* de leur site ») : le site vient de l'ARTICLE (adresse) ou de « ?site= » pour les appels sans article,
  // jamais d'un champ libre ; l'équipe de l'organisation garde exactement son fonctionnement d'avant
  const team = Boolean(orgId && cmsAccess.membershipOf(user.id, orgId));
  let siteId = null;
  if (!team) {
    const where = limitedSite(req, user);
    if (where.error) return deny(where.error);
    siteId = where.siteId;
  }
  const can = (permission) => Boolean(orgId && cmsAccess.can(user.id, permission, team ? { organizationId: orgId } : { organizationId: orgId, siteId }));
  const all = can("articles.write"), own = can("articles.edit_own");
  if (!all && !own) return deny("Réservé aux personnes autorisées à rédiger des articles.");
  if (!WRITER_ROUTES.some((re) => re.test(req.path))) return deny("Réservé au compte créateur.");
  if (req.path === "/api/termes" && req.method !== "GET" && !can("taxonomies.write")) return deny("Vous n'avez pas la permission de créer des catégories ou des étiquettes.");
  const m = /^\/(\d+)\//.exec(req.path);
  const canPublish = can("articles.publish");
  if (m) {
    const post = db.prepare("SELECT author_id, status FROM posts WHERE id = ?").get(Number(m[1]));
    if (post) {
      if (!all && post.author_id !== user.id) return deny("Cet article appartient à une autre personne.");
      // Restaurer une version modifie l'article : refusé sur un article en ligne à qui ne peut pas publier
      if (/\/restaurer$/.test(req.path) && !canPublish && ["published", "scheduled"].includes(post.status)) return deny("Cet article est en ligne : seule une personne autorisée à publier peut restaurer une version.");
    }
  }
  req.blogActor = { all, own, canPublish };
  if (!team) req.blogSite = siteId; // accès limité : portée de site imposée à toute la suite de la requête
  next();
}
// Site d'une requête de l'éditeur pour un accès limité à certains sites ; { error } si la requête sort de ses sites. Refus uniformes (aucune fuite d'existence).
const LIMITED_API = new Set(["/api/termes", "/api/liens", "/api/suggestions", "/api/seo-check", "/nouveau"]);
function limitedSite(req, user) {
  const mine = new Set(cmsAccess.siteMemberships(user.id).map((s) => s.site_id));
  const queried = /^\d{1,12}$/.test(String(req.query.site ?? "")) ? Number(req.query.site) : null;
  const m = /^\/(\d+)\//.exec(req.path);
  let siteId;
  if (m) {
    const site = siteContent.siteOf(db, "post", Number(m[1]));
    if (site === undefined || site === null || !mine.has(site)) return { error: "Vous n'avez pas accès à cet article." }; // inconnu, du site principal ou d'un autre site : même réponse
    siteId = site;
  } else if (LIMITED_API.has(req.path)) {
    if (queried === null) return { error: "Site non précisé." };
    siteId = queried;
  } else return { error: "Créez l'article depuis la liste des articles de votre site : l'éditeur s'ouvre ensuite sur cet article." };
  if (queried !== null && queried !== siteId) return { error: "Site incohérent avec l'article demandé." }; // paramètre falsifié
  if (!mine.has(siteId)) return { error: "Vous n'avez pas accès à ce site." };
  return { siteId };
}
// Rédacteur sans droit de publication : jamais d'article mis en ligne ou programmé par lui, et pas de modification d'un article déjà en ligne
function guardActorStatus(req, wanted, current) {
  const actor = req.blogActor;
  if (!actor || actor.canPublish) return;
  const live = (status) => status === "published" || status === "scheduled";
  if (live(wanted.status) || (current && live(current.status))) throw new UserError("Votre rôle ne publie pas : enregistrez l'article en brouillon, une personne autorisée à publier le mettra en ligne. Un article déjà en ligne ne se modifie pas sans ce droit.");
}
router.use("/formateur/blog", requireBlogAccess);

const oneLine = (value, max) => String(value || "").replace(/[\r\n\u2028\u2029]+/g, " ").trim().slice(0, max);
// Case à cocher précédée d'un champ caché « 0 » : la dernière valeur reçue l'emporte
const lastOf = (v) => (Array.isArray(v) ? v[v.length - 1] : v);
const flag = (v, fallback) => { const x = lastOf(v); return x === undefined ? fallback : x === "1" || x === "on" || x === "true" || x === true ? 1 : 0; };
const wantsJson = (req) => req.get("x-blog-editor") === "1";

// Classement d'un article : par identifiants (sélecteur de l'éditeur : category_ids, primary_category_id, tag_ids) ou, sans eux,
// par l'ancienne saisie texte (category / subcategory / tags) ; les relations de la taxonomie sont la source, le texte en est le miroir
function applyTaxonomy(postId, body) {
  const has = (k) => Object.hasOwn(body, k);
  // Les termes choisis appartiennent au MÊME site que l'article (refus avant toute écriture, même réponse qu'un terme inconnu) ; le classement par noms (ancienne saisie) crée des termes
  // sans site : refusé pour un article d'un site
  const site = siteContent.siteOf(db, "post", postId) ?? null;
  const asked = [].concat(body.category_ids || [], body.tag_ids || [], body.primary_category_id || []).flatMap((v) => String(v).split(",")).map(Number);
  if (siteContent.termsOutsideSite(db, asked, site).length) throw new UserError("Terme introuvable.");
  if (site !== null && !(has("category_ids") || has("primary_category_id") || has("tag_ids")) && (has("category") || has("subcategory") || has("tags"))) throw new UserError("Choisissez les catégories et étiquettes dans le sélecteur de l'éditeur.");
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
const libraryImage = (value, site = null) => ((IMG_PATH.test(String(value || "")) && blog.mediaByPath(value)) || cmsMedia(value, site) ? value : null);
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

// Site de l'article en cours d'édition (ou du site de la requête pour un nouvel article) ; null = site principal
// Nouvel article : accès limité = son site (imposé par le serveur) ; équipe = « ?site= » entier, vérifié (site existant de l'organisation, jamais le principal) ; sinon site principal
function newArticleSite(req) {
  if (req.blogSite !== undefined && req.blogSite !== null) return req.blogSite;
  const raw = String(req.query.site ?? "");
  if (!raw) return null;
  if (!/^\d{1,12}$/.test(raw)) throw new UserError("Site introuvable.");
  const orgId = marketingOrgId();
  if (!orgId || !db.prepare(`SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ? AND deleted_at IS NULL${primarySite.excludeSql(db)}`).get(Number(raw), orgId)) throw new UserError("Site introuvable.");
  return Number(raw);
}
// Nouvel article : la catégorie par défaut du site est cochée d'avance (l'auteur peut la décocher ou en choisir une autre)
function defaultSelection(siteId) {
  const id = require("../services/writing").defaultCategoryId(siteId ?? null);
  const t = id ? taxonomy.get(id) : null;
  return t ? { categories: [{ ...t, isPrimary: true }], tags: [], primary: { ...t, isPrimary: true } } : { categories: [], tags: [], primary: null };
}
const editorSite = (req, post) => (post ? (siteContent.siteOf(db, "post", post.id) ?? null) : newArticleSite(req));

// Premier jour de la semaine du calendrier de l'éditeur : réglage « La semaine commence le » (Paramètres → Général) du site de l'article, sinon du site principal
function weekStartOf(req) {
  try {
    const engine = require("../services/settings");
    if (Number.isInteger(req.blogSite) && req.blogSite > 0) {
      const org = db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get();
      return engine.readAll({ siteId: req.blogSite }, { organizationId: org && org.id, can: () => true, orgLevel: true }).week_start.value;
    }
    return engine.main().weekStart;
  } catch { return "monday"; }
}
function editorData(req, post) {
  const autosave = post ? blog.getAutosave(post.id) : null;
  const marketing = req.app.locals.marketing;
  return {
    weekStart: weekStartOf(req),
    post,
    editorHtml: post ? (post.content_format === "html" ? post.content : markdownToEditorHtml(post.content)) : "",
    // Sauvegarde automatique plus récente que la dernière version enregistrée : proposée à la restauration
    autosave: autosave && post && autosave.saved_at > post.updated_at ? autosave : null,
    revisions: post ? blog.listRevisions(post.id) : [], revisionTotal: post ? blog.countRevisions(post.id) : 0,
    // Les listes de l'éditeur ne montrent que ce qui appartient au site de l'article (aucun terme ni suggestion d'un autre site) ; accès limité : pas de listes globales
    siteId: editorSite(req, post), restrictedSite: req.blogSite ?? null,
    instructors: blog.instructors(), categories: req.blogSite ? [] : blog.categories(), subcategories: req.blogSite ? [] : blog.subcategories(), tags: req.blogSite ? [] : blog.allTags(),
    taxo: { categories: taxonomy.tree("category", siteContent.scopeForSite("term", "t.id", editorSite(req, post))).map(termJson), selected: post ? taxonomy.termsOf("post", post.id) : defaultSelection(editorSite(req, post)) },
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
  // Accès limité : l'article contrôlé est celui de son site (jamais celui d'un autre site, même désigné par son identifiant)
  if (req.blogSite !== undefined && existing && siteContent.siteOf(db, "post", existing.id) !== req.blogSite) return res.status(403).json({ error: "Vous n'avez pas accès à cet article." });
  let f;
  // Données incomplètes (ex. titre vide) : le contrôle porte alors sur les valeurs brutes, pour tout signaler d'un coup
  try { f = readFields(req.body, existing); } catch (error) { if (!(error instanceof UserError)) throw error; f = { ...req.body, robots_index: req.body.robots_index === "0" ? 0 : 1 }; }
  const mediaSite = existing ? (siteContent.siteOf(db, "post", existing.id) ?? null) : (req.blogSite ?? null);
  const cover = libraryImage(req.body.cover_media, mediaSite) || (req.body.remove_cover === "1" ? null : existing && existing.cover_path);
  const og = libraryImage(req.body.og_image_media, mediaSite) || (req.body.remove_og_image === "1" ? null : existing && existing.og_image_path);
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
  const site = newArticleSite(req);
  const f = readFields(req.body);
  if (req.blogActor) f.author_id = null; // un rédacteur ne signe qu'en son nom
  const st = applyStatus(req.body, null, f);
  guardActorStatus(req, st, null);
  guardPublication(f, st.status, req, { slug: req.body.slug });
  const cover = registerUpload(req, fileOf(req, "thumbnail"), f.cover_alt) || libraryImage(req.body.cover_media, site);
  const og = registerUpload(req, fileOf(req, "og_image")) || libraryImage(req.body.og_image_media, site);
  const tw = registerUpload(req, fileOf(req, "twitter_image")) || libraryImage(req.body.twitter_image_media, site);
  const slugWanted = oneLine(req.body.slug, 120);
  const cols = { ...f, slug: uniqueSlug(slugWanted || f.title), cover_path: cover, featured_media_id: (cmsMediaRow(cover) || {}).id || null, og_image_path: og, twitter_image_path: tw, author_id: f.author_id ?? req.session.user.id,
    seo_title: f.seo_title || null, seo_description: f.seo_description || null, og_title: f.og_title || null, og_description: f.og_description || null,
    twitter_title: f.twitter_title || null, twitter_description: f.twitter_description || null, canonical_url: f.canonical_url || null, ...st };
  const names = Object.keys(cols);
  // Article et classement (catégories, étiquettes) enregistrés ensemble : tout ou rien
  const newId = transaction(db, () => {
    const info = db.prepare(`INSERT INTO posts (${names.join(", ")}) VALUES (${names.map(() => "?").join(", ")})`).run(...names.map((n) => cols[n]));
    const id = Number(info.lastInsertRowid);
    // L'article naît dans le site administré (avant le classement : les termes choisis doivent être de ce site)
    if (site) siteContent.adopt({ db, organizationId: marketingOrgId(), userId: req.session.user.id, siteFilter: site }, { type: "post", id });
    applyTaxonomy(id, req.body);
    require("../services/writing").applyDefaults(id); // aucune catégorie choisie : celle du site par défaut
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
  // Conflit d'enregistrement (palier 10) : l'article a été modifié depuis la version que cet écran a chargée → rien n'est écrasé
  const base = String(req.body.base_updated_at || "").trim();
  if (base && base !== p.updated_at) {
    const message = "Cet article a été modifié depuis votre dernière sauvegarde (dans un autre onglet ou depuis la liste des articles). Rien n'a été écrasé : votre texte reste dans l'éditeur et dans ce navigateur. Rechargez la page pour voir la version la plus récente, puis reportez vos changements.";
    return wantsJson(req) ? res.status(409).json({ error: message, conflict: true, currentUpdatedAt: p.updated_at }) : res.status(409).render("error", { message });
  }
  const f = readFields(req.body, p);
  if (req.blogActor) f.author_id = null; // un rédacteur ne change pas l'auteur d'un article
  const st = applyStatus(req.body, p, f);
  guardActorStatus(req, st, p);
  guardPublication(f, st.status, req, { slug: req.body.slug || p.slug, cover_path: libraryImage(req.body.cover_media, editorSite(req, p)) || (req.body.remove_cover === "1" ? null : p.cover_path) });
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
    const fromLibrary = libraryImage(req.body[media], editorSite(req, p));
    if (fromLibrary) return fromLibrary;
    return req.body[remove] === "1" ? null : p[field === "thumbnail" ? "cover_path" : `${field}_path`];
  };
  const cols = {
    ...f, slug, cover_path: pick("thumbnail", "remove_cover", "cover_media"), featured_media_id: null, og_image_path: pick("og_image", "remove_og_image", "og_image_media"), twitter_image_path: pick("twitter_image", "remove_twitter_image", "twitter_image_media"),
    author_id: f.author_id ?? p.author_id, seo_title: f.seo_title || null, seo_description: f.seo_description || null, og_title: f.og_title || null, og_description: f.og_description || null,
    twitter_title: f.twitter_title || null, twitter_description: f.twitter_description || null, canonical_url: f.canonical_url || null, ...st,
  };
  cols.featured_media_id = (cmsMediaRow(cols.cover_path) || {}).id || null; // référence stable vers la médiathèque du CMS (null si l'image vient d'ailleurs)
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
    if (IMG_PATH.test(d.cover_media || "") || cmsMedia(d.cover_media, editorSite(req, req.post))) merged.cover_path = d.cover_media;
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
// Site des appels d'API de l'éditeur (termes) : celui de l'accès limité ; pour l'équipe, « ?site= » s'il est donné (sinon aucune restriction, comme avant)
const apiSite = (req) => (req.blogSite !== undefined ? req.blogSite : /^\d{1,12}$/.test(String(req.query.site ?? "")) ? Number(req.query.site) : undefined);
const termJson = (t) => ({ id: t.id, name: t.name, slug: t.slug, taxonomy: t.taxonomy, parent_id: t.parent_id, depth: t.depth || 0, count: t.n ?? t.total ?? 0 });
router.get("/formateur/blog/api/termes", (req, res) => {
  const key = req.query.taxonomy === "tag" ? "tag" : "category";
  const q = String(req.query.q || "").trim().slice(0, 60);
  const scope = siteContent.scopeForSite("term", "t.id", apiSite(req));
  if (key === "category" && !q) return res.json({ terms: taxonomy.tree("category", scope).map(termJson) });
  const found = taxonomy.list({ taxonomy: key, q, sort: q ? "nom" : "utilisation", perPage: Math.min(Number(req.query.limite) || 12, 50), scope });
  res.json({ terms: found.rows.map(termJson) });
});
router.post("/formateur/blog/api/termes", express.json({ limit: "4kb" }), (req, res) => {
  const b = req.body || {};
  try {
    const key = b.taxonomy === "tag" ? "tag" : "category";
    const site = apiSite(req);
    if (b.parent_id && (siteContent.siteOf(db, "term", Number(b.parent_id)) ?? null) !== (site ?? null)) throw new UserError("La catégorie parente doit appartenir au même site.");
    // Tout ou rien : le terme et son rattachement au site (s'il y en a un) sont écrits ensemble
    const term = siteTransaction(db, () => {
      const created = key === "tag" ? taxonomy.findOrCreateTag(b.name, site ?? null) : taxonomy.create({ taxonomy: "category", name: b.name, parentId: b.parent_id ? Number(b.parent_id) : null });
      const there = siteContent.siteOf(db, "term", created.id) ?? null;
      if (site != null && there !== null && there !== site) throw new UserError("Ce nom n'est pas disponible : choisissez-en un autre."); // étiquette existante d'un autre site : jamais renvoyée
      if (site != null && there === null) siteContent.adopt({ db, organizationId: marketingOrgId(), userId: req.session.user.id, siteScope: site }, { type: "term", id: created.id });
      return created;
    });
    res.status(201).json({ term: termJson({ ...term, depth: key === "category" && term.parent_id ? taxonomy.ancestors(term.id).length : 0 }) });
  } catch (e) { if (e instanceof UserError) return res.status(400).json({ error: e.message }); throw e; }
});

// ---------- Liens internes ----------
// Liens internes proposés : accès limité = seulement les articles et catégories DE SON SITE (formations et pages publiques inchangées)
const inLinkScope = (req, item) => {
  if (req.blogSite === undefined) return true;
  let m = /^\/blog\/categorie\/([^/?#]+)$/.exec(item.url || "");
  if (m) { const t = db.prepare("SELECT id FROM taxonomy_terms WHERE taxonomy = 'category' AND slug = ?").get(m[1]); return Boolean(t) && siteContent.siteOf(db, "term", t.id) === req.blogSite; }
  m = /^\/blog\/([^/?#]+)$/.exec(item.url || "");
  if (m) { const p = db.prepare("SELECT id FROM posts WHERE slug = ?").get(m[1]); return Boolean(p) && siteContent.siteOf(db, "post", p.id) === req.blogSite; }
  return true;
};
router.get("/formateur/blog/api/liens", (req, res) => res.json({ results: blog.searchLinks(String(req.query.q || "").slice(0, 80), req.blogSite === undefined ? 12 : 300).filter((r) => inLinkScope(req, r)).slice(0, 12) }));

router.post("/formateur/blog/api/suggestions", (req, res) => {
  const b = req.body || {};
  const linked = Array.isArray(b.linked) ? b.linked.map(String).slice(0, 200) : [];
  res.json({ suggestions: blog.suggestLinks({ text: String(b.text || "").slice(0, 60000), postId: Number(b.postId) || 0, alreadyLinked: linked }).filter((s) => inLinkScope(req, s)) });
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
