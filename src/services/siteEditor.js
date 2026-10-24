// KOLAKISA CMS → Apparence → Éditeur du site : espace de travail d'UN site. Ce n'est PAS un second éditeur : il rassemble, pour le site vérifié par le serveur, ce que les moteurs existants
// savent déjà faire — pages et leur brouillon (Page Builder), parties globales (en-tête et pied de page = composants du site), menus affectés, brouillon de styles — et offre la publication des
// pages prêtes avec les contrôles habituels (pages.publish : formulaire publié, formation en ligne, widgets complets…). Toute lecture est limitée au site ; un identifiant de page d'un autre site est
// refusé. siteId : entier | null = site principal.
const db = require("../config/database");
const { UserError } = require("../utils/errors");

const pagesLib = () => require("../marketing/pages");
const landing = () => require("../marketing/landing");
const navigation = () => require("./navigation");
const customizer = () => require("./customizer");
const MAX_PAGES = 200;

function componentOf(ctx, id) {
  if (!id) return null;
  const c = pagesLib().getComponent(ctx, Number(id));
  return c ? { id: c.id, name: c.name, hasDraft: Boolean(c.hasDraft) } : null;
}
// Pages éditables du site : jamais une étape de tunnel ni une page archivée
function pages(ctx, siteId) {
  const site = siteId ? pagesLib().getSite(ctx, siteId) : null;
  const home = site ? site.home_page_id : null;
  return pagesLib().listPages(ctx, { siteId }).filter((p) => p.kind !== "step" && !p.archived_at).slice(0, MAX_PAGES)
    .map((p) => ({ id: p.id, name: p.name, slug: p.slug, status: p.status, published: Boolean(p.published_at), hasDraft: Boolean(p.has_draft), updatedAt: p.updated_at, home: p.id === home }));
}
function overview(ctx, siteId) {
  const site = siteId ? pagesLib().requireSite(ctx, siteId) : null;
  const assigned = navigation().assignments({ siteId }), menus = {};
  for (const [loc, id] of Object.entries(assigned)) { const m = navigation().menuRow(id); if (m && m.status === "published") menus[loc] = { id: m.id, name: m.name }; }
  const st = customizer().state(ctx, siteId, { can: () => true });
  return {
    site: { id: siteId, name: site ? site.name : "Site principal", principal: siteId === null, homePageId: site ? site.home_page_id : null, publicUrl: String((site && site.settings && site.settings.seo && site.settings.seo.publicUrl) || process.env.SITE_URL || "").replace(/\/+$/, "") },
    pages: pages(ctx, siteId), parts: site ? { header: componentOf(ctx, site.header_component_id), footer: componentOf(ctx, site.footer_component_id) } : { header: null, footer: null },
    menus, styles: { draftCount: st.draft.count, pendingEngineDraft: Boolean(st.pendingEngineDraft) },
  };
}
// Ce qui attend d'être publié : pages ayant un brouillon ET pages pas encore en ligne (nouvelles pages, importées d'un modèle), avec le verdict des contrôles de publication (jamais un faux « prêt »)
function pending(ctx, siteId) {
  return pages(ctx, siteId).filter((p) => p.hasDraft || p.status !== "published").map((p) => {
    const page = pagesLib().getPage(ctx, p.id);
    let ready = false, errors = [];
    try { const check = landing().preflight(ctx, { ...page, sections: pagesLib().resolveSections(ctx, page.working.sections) }); ready = check.ready; errors = check.errors; } catch (e) { errors = [e.message]; }
    return { id: p.id, name: p.name, status: p.status, kind: p.hasDraft ? "draft" : "new", ready, errors };
  });
}
// Publier des pages du site : chacune est contrôlée et publiée séparément (le résultat dit, page par page, ce qui a réussi ou non) ; une page d'un autre site est refusée
function publishPages(ctx, siteId, ids) {
  const list = [...new Set((Array.isArray(ids) ? ids : []).map(Number))].filter((n) => Number.isInteger(n) && n > 0);
  if (!list.length) throw new UserError("Choisissez au moins une page à publier.");
  if (list.length > 50) throw new UserError("50 pages au plus à la fois.");
  const mine = new Set(pages(ctx, siteId).map((p) => p.id));
  if (list.some((id) => !mine.has(id))) throw new UserError("Page introuvable pour ce site.");
  return list.map((id) => {
    try { pagesLib().publish(ctx, id); return { id, ok: true }; }
    catch (e) { return { id, ok: false, error: e && e.message ? e.message : "Publication impossible." }; }
  });
}
module.exports = { MAX_PAGES, pages, overview, pending, publishPages, db };
