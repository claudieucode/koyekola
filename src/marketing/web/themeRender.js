// Rendu d'un MODÈLE DE THÈME dans une page du site (blog, 404) : la page du Page Builder choisie est affichée dans la zone
// de contenu, avec ses données (article courant, catégorie demandée). Toute erreur renvoie null : la page garde alors son
// affichage d'origine (un modèle ne peut jamais casser le blog ni la page d'erreur).
const pages = require("../pages");
const landing = require("../landing");
const forms = require("../forms");
const tokens = require("../pages/tokens");
const themeTemplates = require("../pages/themeTemplates");
const { visitorContext } = require("../pages/visitorContext");
const { audienceMatches } = require("../pages/nodes");

const ctxOf = (db, marketing) => ({ db, organizationId: marketing.organizationId, userId: null, bus: marketing.bus, settings: marketing.settings, baseUrl: process.env.SITE_URL });
const MS = (v) => { const t = Date.parse(`${String(v || "").replace(" ", "T")}Z`); return Number.isFinite(t) ? t : null; };

// Données d'un article pour les étiquettes {{post.…}} ; contentHtml : corps déjà produit (et nettoyé) par le blog
// Compléments lus dans la base (nombre de commentaires, auteur, adresse de la catégorie) ; jamais bloquants
function extras(post) {
  const out = {};
  try { out.commentsCount = require("../../services/blog").countComments(post.id); } catch { /* ignoré */ }
  try {
    const query = require("../pages/query");
    if (post.category) out.categoryUrl = query.termUrl("category", post.category);
    if (post.author_id) out.authorView = query.authorView(require("../../config/database").prepare("SELECT id, username, bio, avatar_path FROM users WHERE id = ?").get(post.author_id));
  } catch { /* ignoré */ }
  return out;
}
function postScope(post, { contentHtml = "", minutes = null, author = "" } = {}) {
  const safeImg = (p) => (typeof p === "string" && (/^\/uploads\/thumbnails\/[A-Za-z0-9._-]+$/.test(p) || /^https:\/\/[^\s"'<>]+$/.test(p)) ? p : "");
  return { title: post.title, url: `/blog/${encodeURIComponent(post.slug)}`, excerpt: String(post.excerpt || "").replace(/\s+/g, " ").trim().slice(0, 300), image: safeImg(post.cover_path),
    date: MS(post.published_at), category: post.category || "", author, minutes: minutes || null, contentHtml,
    id: post.id, slug: post.slug, authorId: post.author_id || null, tags: String(post.tags || "").split(",").map((t) => t.trim()).filter(Boolean), modified: MS(post.updated_at),
    ...extras(post), views: post.views || 0, commentsOpen: post.comments_enabled !== 0,
    seoTitle: String(post.seo_title || "").slice(0, 160), seoDescription: String(post.seo_description || "").replace(/\s+/g, " ").trim().slice(0, 320) };
}

// done(html | null)
// type : une famille ou une liste ordonnée (la première qui a un modèle en ligne gagne : ex. archive de catégorie, puis liste du blog)
function renderRegion(req, res, db, type, { category = "", categories = [], tag = "", tags = [], postId = null, scope = {}, query = {} } = {}, done) {
  let finished = false;
  const end = (html) => { if (!finished) { finished = true; done(html); } };
  try {
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return end(null);
    const ctx = ctxOf(db, marketing);
    const visitor = visitorContext(db, marketing.organizationId, req);
    let row = null;
    for (const t of [].concat(type)) { row = themeTemplates.pick(ctx, t, { category, categories, tag, tags, postId, visitor }); if (row) break; }
    if (!row) return end(null);
    const page = landing.getPublishedPage(db, row.slug);
    if (!page) return end(null);
    const sections = pages.resolveSections(ctx, page.sections).filter((s) => !s.hidden && audienceMatches(s.audience, visitor));
    const vm = landing.viewModel(ctx, { ...page, visitor: { ...visitor, query: { ...visitor.query, ...query } }, scope, sections });
    const site = page.site_id ? pages.getSite(ctx, page.site_id) : null;
    const siteOk = site && site.status === "active" ? site : null;
    res.render("marketing-public/_sections", { page: vm, form: null, preview: true, thanks: null, error: null, values: {}, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: [], builder: false }, (err, body) => {
      if (err) return end(null);
      // Source de vérité unique : si l'apparence du site (Apparence → Styles) est publiée, ses jetons habillent aussi les modèles de thème
      const main = require("../../services/appearance").publishedTokens();
      const faces = require("../../utils/fontLibrary").faceCssFor(tokens.tokensToCss(main || (siteOk && siteOk.tokens) || {}));
      const css = [faces, main ? require("../pages/themeCss").themeCss(main) : siteOk && siteOk.assets.theme, vm.nodeCss, siteOk && siteOk.assets.custom, vm.customCss].filter(Boolean).join("\n").replace(/</g, "");
      const style = siteOk || main ? ` style="${tokens.tokensToCss(main || siteOk.tokens).replace(/"/g, "&quot;")} --lp-accent: var(--kw-primary)"` : "";
      end(`<div class="kw-theme-template${siteOk || main ? " lp-site" : ""}"${style}><link rel="stylesheet" href="${res.locals.asset ? res.locals.asset("/css/landing.css") : "/css/landing.css"}"><style>${css}</style><div class="lp-main">${body}</div></div>`);
    });
  } catch (error) { end(null); }
}

// Pendant qu'on dessine un modèle d'article : données du dernier article publié (aperçu réaliste)
function previewScope(db, ctx, page) {
  try {
    const types = themeTemplates.typesOfPage(ctx, page.id);
    if (types.includes("single_course")) {
      const c = db.prepare("SELECT * FROM courses WHERE published = 1 ORDER BY created_at DESC, id DESC LIMIT 1").get();
      if (!c) return {};
      return { course: { title: c.title, subtitle: c.subtitle || "", priceCents: c.price_cents || 0, url: `/cours/${encodeURIComponent(c.slug)}`, image: c.thumbnail_path || "", category: c.category || "", instructor: "", description: String(c.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400) } };
    }
    if (types.some((t) => ["blog_archive", "author_archive", "search_results"].includes(t)) && !types.includes("single_post")) {
      const total = db.prepare("SELECT COUNT(*) n FROM posts WHERE published = 1 AND deleted_at IS NULL").get().n;
      return { archive: { type: "blog", name: "", id: null, termIds: [], title: "Titre de l'archive (exemple)", description: "Description de l'archive : elle viendra de la catégorie, de l'étiquette ou de l'auteur affiché.", count: total, url: "/blog", search: "" } };
    }
    if (!types.includes("single_post")) return {};
    const post = db.prepare("SELECT * FROM posts WHERE published = 1 ORDER BY published_at DESC, id DESC LIMIT 1").get();
    if (!post) return {};
    const blog = require("../../services/blog");
    let html = "";
    try { html = blog.renderPost(post, {}).html; } catch { html = ""; }
    const author = post.author_id ? db.prepare("SELECT username FROM users WHERE id = ?").get(post.author_id) : null;
    return { post: postScope(post, { contentHtml: html, author: author ? author.username : "" }) };
  } catch { return {}; }
}

module.exports = { renderRegion, postScope, previewScope };
