// Branchement du Theme Builder au RENDU PUBLIC (programme 23.1) : UN service de résolution pour TOUS les types de modèles.
//  · regionContext / defaultContext — construisent le contexte de résolution (site, vue, contenu affiché) à partir de ce que la route connaît ;
//  · resolveParts / partsFor — en-tête et pied de page : le modèle publié applicable à ce contexte (pages du Page Builder ET pages du site : blog, recherche, 404…) ;
//  · pickRegion — modèle de PAGE applicable (article, archives, recherche, 404, page statique, produit, archives produits) pour themeRender.renderRegion.
// Règle de repli : s'il n'y a AUCUN modèle publié qui s'applique, le comportement historique reste exactement le même. Une erreur ne casse jamais la page.
// Voir docs/theme-builder/KOLAKISA_THEME_BUILDER_RENDU_CAUSES_RACINES.md.
const Res = require("./resolve");
const store = require("./store");

// Cache : liste des modèles PUBLIÉS d'un site, invalidée par le marqueur de store.stampOf (change à toute écriture, même dans la même seconde)
const cache = new Map();
function published(ctx, siteId) {
  const key = `${ctx.organizationId}:${siteId}`, stamp = store.stampOf(ctx, siteId), hit = cache.get(key);
  if (hit && hit.stamp === stamp) return hit.list;
  const list = store.list(ctx, siteId).filter((t) => t.status === "published");
  if (cache.size > 200) cache.clear();
  cache.set(key, { stamp, list });
  return list;
}
const homeOf = (ctx, siteId) => { try { if (siteId === null) return null;  const s = require("../marketing/pages").getSite(ctx, siteId); return s && s.home_page_id; } catch { return null; } };

// Famille de l'ancien système (nom utilisé par les routes : themeRender.renderRegion) → type de modèle du Theme Builder + vue de résolution (+ sorte d'archive)
const FAMILY = {
  product: { type: "single_product", view: "product" },
  product_archive: { type: "product_archive", view: "product_archive" },
  single_post: { type: "single_post", view: "post" },
  blog_archive: { type: "archive", view: "archive", kind: "blog" },
  category_archive: { type: "archive", view: "archive", kind: "category" },
  tag_archive: { type: "archive", view: "archive", kind: "tag" },
  author_archive: { type: "archive", view: "archive", kind: "author" },
  search_results: { type: "search_results", view: "search", kind: "search" },
  not_found: { type: "not_found", view: "not_found" },
  static_page: { type: "single_page", view: "page" },
};
const list = (v) => [].concat(v || []).filter(Boolean).map(String);

// Contexte de résolution d'une page de CONTENU (voir match.js pour la forme). `o` : ce que la route sait du contenu affiché.
function regionContext(siteId, family, o = {}) {
  const m = FAMILY[family];
  if (!m) return null;
  const cats = list([o.category, ...list(o.categories)]);
  const c = { siteId, view: m.view, id: o.postId ?? null, authorId: o.authorId ?? null, parents: list(o.parents).map(Number).filter(Number.isInteger), categories: cats, categoryAncestors: list(o.categories), tags: list(o.tags) };
  if (m.view === "product_archive") c.archive = { kind: o.category ? "category" : "shop", name: o.category || "", ancestors: list(o.categories) };
  else if (m.view === "archive" || m.view === "search") c.archive = { kind: m.kind, name: m.kind === "category" ? (o.category || "") : m.kind === "tag" ? (o.tag || "") : "", ancestors: m.kind === "category" ? list(o.categories) : [], authorId: m.kind === "author" ? (o.authorId ?? null) : null };
  return c;
}
// Contexte par défaut d'une page du site qui ne déclare rien (catalogue, formation, compte…) : accueil si « / », sinon page
const defaultContext = (siteId, path = "/") => ({ siteId, view: path === "/" ? "front" : "page", id: null, authorId: null, parents: [], categories: [], categoryAncestors: [], tags: [] });

// Modèles de parties globales (en-tête, pied de page) applicables à un contexte : { header, footer } (modèle complet ou null)
function resolveParts(ctx, siteId, c) {
  const out = { header: null, footer: null };
  const pool = published(ctx, siteId);
  if (!pool.length) return out;
  for (const type of ["header", "footer"]) { const w = Res.resolve(pool, c, { type }).winner; if (w && w.sourceKind === "component") out[type] = w; }
  return out;
}
// Barre latérale (un seul modèle : le plus précis) et modèles personnalisés (TOUS ceux dont les conditions correspondent, du plus précis au moins précis), applicables à un contexte.
// Les deux s'affichent sous le contenu de la page, avant le pied de page (themeLayout → footer.ejs). Renvoie { sidebar: modèle|null, custom: [modèles] }.
function resolveExtras(ctx, siteId, c) {
  const out = { sidebar: null, custom: [] };
  const pool = published(ctx, siteId);
  if (!pool.length) return out;
  const side = Res.resolve(pool, c, { type: "sidebar" }).winner;
  if (side && side.sourceKind === "component") out.sidebar = side;
  const r = Res.resolve(pool, c, { type: "custom" });
  const byId = new Map(pool.map((t) => [t.id, t]));
  out.custom = r.candidates.map((x) => byId.get(x.id)).filter((t) => t && t.sourceKind === "page");
  return out;
}
// Pages du Page Builder (accueil, pages libres) : mêmes extras, vue « accueil » ou « page » comme pour l'en-tête et le pied
function extrasFor(ctx, page) {
  try {
    if (!page || page.site_id === undefined) return { sidebar: null, custom: [] };
    const view = homeOf(ctx, page.site_id) === page.id ? "front" : "page";
    return resolveExtras(ctx, page.site_id, { siteId: page.site_id, view, id: page.id, parents: [], authorId: null, categories: [], categoryAncestors: [], tags: [] });
  } catch { return { sidebar: null, custom: [] }; }
}
// Ligne de page publiée portée par un modèle de type page (ou null) : même contrôle de site et d'organisation que pickRegion
const pageRowOf = (ctx, siteId, t) => ctx.db.prepare("SELECT * FROM mk_landing_pages WHERE id = ? AND organization_id = ? AND site_id IS ? AND status = 'published' AND archived_at IS NULL").get(t.sourceId, ctx.organizationId, siteId) || null;
// Y a-t-il au moins un en-tête ou un pied publié sur ce site ? (court-circuit : le rendu historique ne paie qu'une lecture en cache)
const hasParts = (ctx, siteId) => published(ctx, siteId).some((t) => ["header", "footer", "sidebar", "custom"].includes(t.type));

// page : ligne de page ({ id, site_id }) → { header: id de composant | undefined, footer: … } ; undefined = aucun modèle ne s'applique (repli historique)
function partsFor(ctx, page) {
  const out = { header: undefined, footer: undefined, meta: {}, managed: { header: false, footer: false } };
  try {
    if (!page || page.site_id === undefined) return out;
    // Dès qu'un modèle PUBLIÉ de ce type existe sur le site, le Theme Builder est l'unique source de vérité de la partie : aucun ancien réglage ne la remplace en silence
    const pool = published(ctx, page.site_id);
    out.managed.header = pool.some((t) => t.type === "header"); out.managed.footer = pool.some((t) => t.type === "footer");
    const view = homeOf(ctx, page.site_id) === page.id ? "front" : "page";
    const w = resolveParts(ctx, page.site_id, { siteId: page.site_id, view, id: page.id, parents: [], authorId: null, categories: [], categoryAncestors: [], tags: [] });
    if (w.header) { out.header = w.header.sourceId; out.meta.header = { id: w.header.id, name: w.header.name }; }
    if (w.footer) { out.footer = w.footer.sourceId; out.meta.footer = { id: w.footer.id, name: w.footer.name }; }
  } catch { /* jamais bloquant : repli historique */ }
  return out;
}

// themeRender.renderRegion : modèle de PAGE applicable (toutes familles). Renvoie une ligne de page publiée { slug… } ou null.
function pickRegion(ctx, siteId, families, o = {}) {
  try {
    if (siteId === undefined) return null;
    const pool = published(ctx, siteId);
    if (!pool.length) return null;
    for (const fam of [].concat(families)) {
      const m = FAMILY[fam]; if (!m) continue;
      const w = Res.resolve(pool, regionContext(siteId, fam, o), { type: m.type }).winner;
      if (w && w.sourceKind === "page") { const row = ctx.db.prepare("SELECT * FROM mk_landing_pages WHERE id = ? AND organization_id = ? AND site_id IS ? AND status = 'published' AND archived_at IS NULL").get(w.sourceId, ctx.organizationId, siteId); if (row) return row; }
    }
  } catch { /* repli historique */ }
  return null;
}
module.exports = { partsFor, pickRegion, published, FAMILY, regionContext, defaultContext, resolveParts, resolveExtras, extrasFor, pageRowOf, hasParts };
