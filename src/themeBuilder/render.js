// Branchement du Theme Builder au RENDU PUBLIC (programme 23.1, lot 5). Trois entrées :
//  · partsFor  — en-tête / pied de page d'une page de site (utilisé par pages.withSiteParts, uniquement pour la page publiée et l'aperçu ; jamais par le canevas de l'éditeur) ;
//  · pickRegion — modèle de page (produit, archive produits…) pour themeRender.renderRegion d'un site ;
// Règle de repli : s'il n'y a AUCUN modèle publié qui s'applique, le comportement historique (colonnes du site, anciens modèles) reste exactement le même. Une erreur ne casse jamais la page.
const Types = require("./types");
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
const homeOf = (ctx, siteId) => { try { const s = require("../marketing/pages").getSite(ctx, siteId); return s && s.home_page_id; } catch { return null; } };
// page : ligne de page ({ id, site_id }) → { header: id de composant | undefined, footer: … } ; undefined = aucun modèle ne s'applique (repli historique)
function partsFor(ctx, page) {
  const out = { header: undefined, footer: undefined };
  try {
    if (!page || !page.site_id) return out;
    const list = published(ctx, page.site_id);
    if (!list.length) return out;
    const view = homeOf(ctx, page.site_id) === page.id ? "front" : "page";
    const c = { siteId: page.site_id, view, id: page.id, parents: [], authorId: null, categories: [], categoryAncestors: [], tags: [] };
    for (const type of ["header", "footer"]) {
      const w = Res.resolve(list, c, { type }).winner;
      if (w && w.sourceKind === "component") out[type] = w.sourceId;
    }
  } catch { /* jamais bloquant : repli historique */ }
  return out;
}
// themeRender.renderRegion : famille historique → type de modèle + contexte. Renvoie une ligne de page publiée { slug… } ou null.
const FAMILY = { product: { type: "single_product", view: "product" }, product_archive: { type: "product_archive", view: "product_archive" } };
function pickRegion(ctx, siteId, families, { category = "", categories = [], tag = "", tags = [], postId = null } = {}) {
  try {
    if (!siteId) return null;
    const list = published(ctx, siteId);
    if (!list.length) return null;
    for (const fam of [].concat(families)) {
      const m = FAMILY[fam]; if (!m) continue;
      const c = { siteId, view: m.view, id: postId, authorId: null, categories: [category, ...categories].filter(Boolean), categoryAncestors: [], tags: tags || [], archive: m.view === "product_archive" ? { kind: category ? "category" : "shop", name: category, ancestors: categories || [] } : undefined };
      const w = Res.resolve(list, c, { type: m.type }).winner;
      if (w && w.sourceKind === "page") { const row = ctx.db.prepare("SELECT * FROM mk_landing_pages WHERE id = ? AND organization_id = ? AND site_id = ? AND status = 'published' AND archived_at IS NULL").get(w.sourceId, ctx.organizationId, siteId); if (row) return row; }
    }
  } catch { /* repli historique */ }
  return null;
}
module.exports = { partsFor, pickRegion, published, FAMILY };
