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
  return { title: post.title, url: require("../../services/urls").publicPath("post", post), excerpt: String(post.excerpt || "").replace(/\s+/g, " ").trim().slice(0, 300), image: safeImg(post.cover_path),
    date: MS(post.published_at), category: post.category || "", author, minutes: minutes || null, contentHtml,
    id: post.id, slug: post.slug, authorId: post.author_id || null, tags: String(post.tags || "").split(",").map((t) => t.trim()).filter(Boolean), modified: MS(post.updated_at),
    ...extras(post), views: post.views || 0, commentsOpen: post.comments_enabled !== 0,
    seoTitle: String(post.seo_title || "").slice(0, 160), seoDescription: String(post.seo_description || "").replace(/\s+/g, " ").trim().slice(0, 320) };
}

// Habillage d'un modèle rendu hors Page Builder : jetons du site, feuille des pages, CSS généré (jetons → thème → éléments → personnalisé) ; même code pour les modèles de page ET les parties globales
function wrapHtml(res, vm, siteOk, body, cls) {
  // Source de vérité unique : si l'apparence du site (Apparence → Styles) est publiée, ses jetons habillent aussi les modèles de thème
  const main = require("../../services/appearance").publishedTokens();
  const faces = require("../../utils/fontLibrary").faceCssFor(tokens.tokensToCss(main || (siteOk && siteOk.tokens) || {}), { siteId: main ? null : siteOk ? siteOk.id : undefined });
  // Partie globale (en-tête, pied) : même colonne de contenu que les pages du site (réglage de largeur du site, comme dans le Page Builder) ; la feuille de la plateforme ne doit pas changer l'aspect des liens non stylés
  const band = cls.includes("kw-theme-part") ? ".kw-theme-part { color: var(--kw-text, #10222f); } :where(.kw-theme-part) a:not([class]) { color: revert; text-decoration: revert; }" : "";
  const css = [faces, main ? require("../pages/themeCss").themeCss(main) : siteOk && siteOk.assets.theme, band, vm.nodeCss, siteOk && siteOk.assets.custom, vm.customCss].filter(Boolean).join("\n").replace(/</g, "");
  const style = siteOk || main ? ` style="${tokens.tokensToCss(main || siteOk.tokens).replace(/"/g, "&quot;")} --lp-accent: var(--kw-primary)"` : "";
  return `<div class="${cls}${siteOk || main ? " lp-site" : ""}"${style}><link rel="stylesheet" href="${res.locals.asset ? res.locals.asset("/css/landing.css") : "/css/landing.css"}"><style>${css}</style><div class="lp-main">${body}</div></div>`;
}
const siteOf = (ctx, page) => { const site = page.site_id ? pages.getSite(ctx, page.site_id) : null; return site && site.status === "active" ? site : null; };
// Rend le modèle de vue `vm` avec les éléments du Page Builder (callback : html | null). Un callback passé à res.render ne passe jamais par themeLayout (rendu de fragment).
function renderVm(res, vm, siteOk, cls, done) {
  res.render("marketing-public/_sections", { page: vm, form: null, preview: true, thanks: null, error: null, values: {}, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: [], builder: false }, (err, body) => {
    if (err) return done(null);
    try { done(wrapHtml(res, vm, siteOk, body, cls)); } catch { done(null); }
  });
}
// Site dont on cherche les modèles : celui du domaine de la requête (req.kwSite) sauf indication contraire de la route ; le site principal n'a pas de Theme Builder (null)
const siteIdOf = (req, siteId) => (siteId !== undefined ? siteId : req.kwSite && Number.isInteger(req.kwSite.id) ? req.kwSite.id : null);

// done(html | null)
// type : une famille ou une liste ordonnée (la première qui a un modèle en ligne gagne : ex. archive de catégorie, puis liste du blog)
function renderRegion(req, res, db, type, { category = "", categories = [], tag = "", tags = [], postId = null, authorId = null, scope = {}, query = {}, siteId } = {}, done) {
  let finished = false;
  const end = (html) => { if (!finished) { finished = true; done(html); } };
  try {
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return end(null);
    const ctx = ctxOf(db, marketing);
    const visitor = visitorContext(db, marketing.organizationId, req);
    const opts = { category, categories, tag, tags, postId, authorId };
    // Theme Builder (23.1) : modèles du site de la requête, toutes familles. Le contexte de la page est mémorisé pour l'en-tête et le pied de page (themeLayout)
    const tbSite = siteIdOf(req, siteId);
    const TB = require("../../themeBuilder/render");
    if (tbSite) { const first = [].concat(type)[0]; res.locals.themeCtx = TB.regionContext(tbSite, first, opts) || res.locals.themeCtx; }
    let row = TB.pickRegion(ctx, tbSite, type, opts);
    // Sans modèle applicable, l'ancien système décide exactement comme avant
    if (!row) for (const t of [].concat(type)) { row = themeTemplates.pick(ctx, t, { category, categories, tag, tags, postId, visitor, siteId }); if (row) break; }
    if (!row) return end(null);
    const page = landing.getPublishedPage(db, row.slug);
    if (!page) return end(null);
    const sections = pages.resolveSections(ctx, page.sections).filter((s) => !s.hidden && audienceMatches(s.audience, visitor));
    const vm = landing.viewModel(ctx, { ...page, visitor: { ...visitor, query: { ...visitor.query, ...query } }, scope, sections });
    renderVm(res, vm, siteOf(ctx, page), "kw-theme-template", end);
  } catch (error) { end(null); }
}

// En-tête et pied de page d'un site pour la requête : { header, footer } en HTML (null = rien ne s'applique, l'habillage d'origine reste). Utilisé par themeLayout ; jamais bloquant.
function renderParts(req, res) {
  return new Promise((resolve) => {
    try {
      const site = req.kwSite;
      const marketing = req.app.locals.marketing;
      if (!site || !Number.isInteger(site.id) || !marketing || !marketing.ready) return resolve({});
      const db = require("../../config/database");
      const ctx = ctxOf(db, marketing);
      const TB = require("../../themeBuilder/render");
      if (!TB.hasParts(ctx, site.id)) return resolve({});
      const win = TB.resolveParts(ctx, site.id, res.locals.themeCtx || TB.defaultContext(site.id, String(req.originalUrl || req.url || "/").split("?")[0]));
      const visitor = visitorContext(db, marketing.organizationId, req);
      const out = {};
      const jobs = ["header", "footer"].filter((w) => win[w]).map((which) => new Promise((ok) => {
        const section = pages.partSection(ctx, win[which].sourceId, which);
        if (!section) { console.warn(`[KOLAKISA] Theme Builder : ${which === "header" ? "en-tête" : "pied de page"} « ${win[which].name} » sans version publiée ; habillage d'origine conservé.`); return ok(); }
        const vm = landing.viewModel(ctx, { id: null, slug: "", site_id: site.id, organization_id: marketing.organizationId, visitor, theme: {}, scope: {}, sections: [section] });
        renderVm(res, vm, siteOf(ctx, { site_id: site.id }), `kw-theme-part kw-theme-${which}`, (html) => { if (html) out[which] = html; ok(); });
      }));
      Promise.all(jobs).then(() => resolve(out), () => resolve({}));
    } catch { resolve({}); }
  });
}

// Pendant qu'on dessine un modèle d'article : données du dernier article publié (aperçu réaliste)
function previewScope(db, ctx, page) {
  try {
    const types = themeTemplates.typesOfPage(ctx, page.id);
    if (types.includes("single_course")) {
      const c = db.prepare("SELECT * FROM courses WHERE published = 1 ORDER BY created_at DESC, id DESC LIMIT 1").get();
      if (!c) return {};
      return { course: { id: c.id, title: c.title, subtitle: c.subtitle || "", priceCents: c.price_cents || 0, url: `/cours/${encodeURIComponent(c.slug)}`, image: c.thumbnail_path || "", category: c.category || "", instructor: "", description: String(c.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400) } };
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

module.exports = { renderRegion, renderParts, postScope, previewScope };
