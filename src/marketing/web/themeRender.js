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
function postScope(post, { contentHtml = "", minutes = null, author = "" } = {}) {
  const safeImg = (p) => (typeof p === "string" && (/^\/uploads\/thumbnails\/[A-Za-z0-9._-]+$/.test(p) || /^https:\/\/[^\s"'<>]+$/.test(p)) ? p : "");
  return { title: post.title, url: `/blog/${encodeURIComponent(post.slug)}`, excerpt: String(post.excerpt || "").replace(/\s+/g, " ").trim().slice(0, 300), image: safeImg(post.cover_path),
    date: MS(post.published_at), category: post.category || "", author, minutes: minutes || null, contentHtml };
}

// done(html | null)
function renderRegion(req, res, db, type, { category = "", scope = {}, query = {} } = {}, done) {
  let finished = false;
  const end = (html) => { if (!finished) { finished = true; done(html); } };
  try {
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return end(null);
    const ctx = ctxOf(db, marketing);
    const visitor = visitorContext(db, marketing.organizationId, req);
    const row = themeTemplates.pick(ctx, type, { category, visitor });
    if (!row) return end(null);
    const page = landing.getPublishedPage(db, row.slug);
    if (!page) return end(null);
    const sections = pages.resolveSections(ctx, page.sections).filter((s) => !s.hidden && audienceMatches(s.audience, visitor));
    const vm = landing.viewModel(ctx, { ...page, visitor: { ...visitor, query: { ...visitor.query, ...query } }, scope, sections });
    const site = page.site_id ? pages.getSite(ctx, page.site_id) : null;
    const siteOk = site && site.status === "active" ? site : null;
    res.render("marketing-public/_sections", { page: vm, form: null, preview: true, thanks: null, error: null, values: {}, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: [], builder: false }, (err, body) => {
      if (err) return end(null);
      const css = [siteOk && siteOk.assets.theme, vm.nodeCss, siteOk && siteOk.assets.custom, vm.customCss].filter(Boolean).join("\n").replace(/</g, "");
      const style = siteOk ? ` style="${tokens.tokensToCss(siteOk.tokens).replace(/"/g, "&quot;")} --lp-accent: var(--kw-primary)"` : "";
      end(`<div class="kw-theme-template${siteOk ? " lp-site" : ""}"${style}><link rel="stylesheet" href="${res.locals.asset ? res.locals.asset("/css/landing.css") : "/css/landing.css"}"><style>${css}</style><div class="lp-main">${body}</div></div>`);
    });
  } catch (error) { end(null); }
}

// Pendant qu'on dessine un modèle d'article : données du dernier article publié (aperçu réaliste)
function previewScope(db, ctx, page) {
  try {
    if (!themeTemplates.typesOfPage(ctx, page.id).includes("single_post")) return {};
    const post = db.prepare("SELECT * FROM posts WHERE published = 1 ORDER BY published_at DESC, id DESC LIMIT 1").get();
    if (!post) return {};
    const blog = require("../../services/blog");
    let html = "";
    try { html = blog.renderPost(post, {}).html; } catch { html = ""; }
    return { post: postScope(post, { contentHtml: html }) };
  } catch { return {}; }
}

module.exports = { renderRegion, postScope, previewScope };
