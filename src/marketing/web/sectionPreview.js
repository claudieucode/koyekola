// Aperçu RÉEL de sections (pattern, page d'un modèle…) sans rien enregistrer : le même gabarit public que l'aperçu d'une page (marketing-public/landing), avec les styles
// du site de la requête (jetons, thème, polices). Aucune page n'est créée : la page affichée est un objet transitoire. Le site vient toujours du serveur, jamais du navigateur.
const landing = require("../landing");
const pages = require("../pages");
const forms = require("../forms");
const { tokensToCss, normalizeTokens, DEFAULT_TOKENS } = require("../pages/tokens");
const { renderMarkdown } = require("../../utils/markdown");

function renderSections(req, res, { siteId = null, sections, label = "", title = "Aperçu", tokens = null }) {
  const ctx = req.mk.ctx;
  const site = siteId ? pages.getSite(ctx, siteId) : null;
  const resolved = pages.withSiteParts(ctx, { site_id: siteId }, pages.resolveSections(ctx, sections));
  const page = landing.viewModel(ctx, {
    id: 0, organization_id: ctx.organizationId, name: title, slug: "apercu", title, description: "", status: "draft", kind: "page", site_id: siteId, form_id: null, tags: [], indexable: 0,
    theme: pages.normalizeTheme({}), seo: pages.normalizeSeo({}), sections: resolved, scope: {},
  });
  // Aperçu d'un pack : son identité (couleurs, polices, formes) remplace celle du site pour CET aperçu seulement ; rien n'est enregistré
  let previewStyle = "";
  if (tokens) {
    const base = (site && site.tokens) || DEFAULT_TOKENS, merged = { ...base, colors: { ...base.colors, ...tokens.colors }, fonts: { ...base.fonts, ...tokens.fonts }, radius: { ...base.radius, ...tokens.radius }, shadow: { ...base.shadow, ...tokens.shadow }, border: { ...base.border, ...tokens.border }, type: { ...base.type, h1: { ...(base.type || {}).h1, ...((tokens.type || {}).h1 || {}) } } };
    previewStyle = tokensToCss(normalizeTokens(merged));
  }
  res.set("Cache-Control", "no-store");
  res.render("marketing-public/landing", { page, site, tokensToCss, form: null, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: [], renderMarkdown, error: null, values: {}, thanks: null, preview: true, previewLabel: label, previewStyle });
}
module.exports = { renderSections };
