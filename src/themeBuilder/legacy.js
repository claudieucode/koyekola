// Import des anciens réglages (programme 23.1) : parties du site (en-tête, pied de page) et modèles de thème rattachés à ce site. LECTURE SEULE des anciennes données :
// rien n'est modifié ni supprimé, l'ancien système reste en place (retour arrière). Idempotent : `legacy_ref` unique par site, un second passage n'ajoute rien.
const { MarketingError } = require("../marketing/errors");
const Types = require("./types");
const store = require("./store");

const P = () => require("../marketing/pages");
const TT = () => require("../marketing/pages/themeTemplates");
// famille de l'ancien système → type + conditions équivalentes
function mapLegacy(t) {
  const names = (v) => (v ? [String(v)] : []);
  const crit = (o) => { const out = { ...o }; for (const k of Object.keys(out)) if (out[k] === undefined || (Array.isArray(out[k]) && !out[k].length)) delete out[k]; return out; };
  const ex = t.exclude || {};
  switch (t.type) {
    case "single_post": return { type: "single_post", include: [crit({ kind: "post", ids: t.postId ? [t.postId] : undefined, category: names(t.category), tag: names(t.tag) })], exclude: [ex.category && { kind: "post", category: ex.category }, ex.tag && { kind: "post", tag: ex.tag }, ex.postId && { kind: "post", ids: ex.postId }].filter(Boolean) };
    case "blog_archive": return { type: "archive", include: [t.category ? { kind: "archive", sub: "category", names: names(t.category) } : { kind: "archive" }], exclude: ex.category ? [{ kind: "archive", sub: "category", names: ex.category }] : [] };
    case "category_archive": return { type: "archive", include: [crit({ kind: "archive", sub: "category", names: names(t.category) })], exclude: ex.category ? [{ kind: "archive", sub: "category", names: ex.category }] : [] };
    case "tag_archive": return { type: "archive", include: [crit({ kind: "archive", sub: "tag", names: names(t.tag) })], exclude: ex.tag ? [{ kind: "archive", sub: "tag", names: ex.tag }] : [] };
    case "author_archive": return { type: "archive", include: [{ kind: "archive", sub: "author" }], exclude: [] };
    case "search_results": return { type: "search_results", include: [], exclude: [] };
    case "not_found": return { type: "not_found", include: [], exclude: [] };
    case "static_page": return { type: "single_page", include: [{ kind: "page" }], exclude: [] };
    case "product": return { type: "single_product", include: [crit({ kind: "product", category: names(t.category) })], exclude: [] };
    case "product_archive": return { type: "product_archive", include: [t.category ? { kind: "product_archive", sub: "category", names: names(t.category) } : { kind: "product_archive" }], exclude: [] };
    default: return null;
  }
}
function importLegacy(ctx, siteId) {
  store.site(ctx, siteId);
  const out = { imported: [], skipped: [] };
  const have = new Set(store.list(ctx, siteId, { archived: true }).map((t) => t.legacyRef).filter(Boolean));
  const add = (ref, label, fn) => {
    if (have.has(ref)) { out.skipped.push({ ref, label, reason: "déjà importé" }); return; }
    try { const t = fn(); have.add(ref); out.imported.push({ ref, label, id: t.id, type: t.type }); } catch (e) { out.skipped.push({ ref, label, reason: e instanceof MarketingError ? e.message : "erreur" }); }
  };
  const s = P().getSite(ctx, siteId);
  for (const [key, type, col] of [["header", "header", "header_component_id"], ["footer", "footer", "footer_component_id"]]) {
    const cid = s[col]; if (!cid) continue;
    const c = P().getComponent(ctx, cid); if (!c) { out.skipped.push({ ref: `site-part:${key}`, label: Types.TYPES[type].label, reason: "composant introuvable" }); continue; }
    add(`site-part:${key}`, c.name, () => store.create(ctx, siteId, { type, name: c.name, conditions: {}, sourceKind: "component", sourceId: c.id, legacyRef: `site-part:${key}`, status: "published" }));
  }
  for (const t of TT().list(ctx)) {
    const pg = ctx.db.prepare("SELECT id, site_id, status FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(t.pageId, ctx.organizationId);
    if (!pg || pg.site_id !== siteId) continue; // seuls les modèles dont la page est dans CE site
    const label = `${t.typeLabel} — ${t.pageName}`;
    if (t.audience) { out.skipped.push({ ref: `theme:${t.id}`, label, reason: "ciblage par public non pris en charge par les nouvelles conditions : conservé dans l'ancien système" }); continue; }
    const m = mapLegacy(t); if (!m) { out.skipped.push({ ref: `theme:${t.id}`, label, reason: "famille sans équivalent (conservée dans l'ancien système)" }); continue; }
    add(`theme:${t.id}`, label, () => store.create(ctx, siteId, { type: m.type, name: t.pageName, conditions: { include: m.include, exclude: m.exclude }, sourceKind: "page", sourceId: t.pageId, legacyRef: `theme:${t.id}`, status: pg.status === "published" ? "published" : "draft" }));
  }
  return out;
}
module.exports = { importLegacy, mapLegacy };
