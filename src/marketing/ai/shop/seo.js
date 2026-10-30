// SEO e-commerce : contrôles sur les brouillons ET sur le catalogue réel. Les données structurées « Product » n'existent pas dans le moteur (documenté) ; aucun avis, aucune note n'est jamais généré.
const len = (s) => String(s || "").length;
function checkDrafts(drafts) {
  const out = []; const titles = new Map(), metas = new Map();
  for (const d of drafts) {
    const c = d.content; if (!c) { out.push({ key: d.key, level: "info", message: `« ${d.name} » : contenu non généré.` }); continue; }
    if (!c.seoTitle) out.push({ key: d.key, level: "warn", message: `« ${d.name} » : titre SEO vide.` }); else if (len(c.seoTitle) > 60) out.push({ key: d.key, level: "warn", message: `« ${d.name} » : titre SEO trop long (${len(c.seoTitle)} > 60).` });
    if (!c.metaDescription) out.push({ key: d.key, level: "warn", message: `« ${d.name} » : méta-description vide.` }); else if (len(c.metaDescription) > 155) out.push({ key: d.key, level: "warn", message: `« ${d.name} » : méta-description trop longue.` });
    if (!c.altText && d.image) out.push({ key: d.key, level: "warn", message: `« ${d.name} » : texte alternatif de l'image absent.` });
    const t = String(c.seoTitle).toLowerCase(), m = String(c.metaDescription).toLowerCase();
    if (t && titles.has(t)) out.push({ key: d.key, level: "warn", message: `« ${d.name} » : même titre SEO que « ${titles.get(t)} » (contenu dupliqué).` }); else if (t) titles.set(t, d.name);
    if (m && metas.has(m)) out.push({ key: d.key, level: "warn", message: `« ${d.name} » : même méta-description que « ${metas.get(m)} ».` }); else if (m) metas.set(m, d.name);
  }
  return out;
}
function checkCatalog(db, organizationId, siteId) {
  const rows = db.prepare("SELECT name, slug, seo_title, seo_description, image_url, status FROM mk_shop_products WHERE organization_id = ? AND site_id IS ? AND deleted_at IS NULL").all(organizationId, siteId);
  const out = []; const seen = new Map();
  for (const p of rows) {
    if (!p.seo_description) out.push({ level: "warn", message: `Produit « ${p.name} » : description SEO absente.` });
    if (!p.seo_title) out.push({ level: "info", message: `Produit « ${p.name} » : titre SEO absent (le nom sera utilisé).` });
    if (p.seo_title) { const t = p.seo_title.toLowerCase(); if (seen.has(t)) out.push({ level: "warn", message: `Produits « ${p.name} » et « ${seen.get(t)} » : même titre SEO.` }); else seen.set(t, p.name); }
  }
  return { products: rows.length, issues: out, limits: ["Données structurées schema.org « Product » : non prises en charge par le moteur.", "Avis et notes : absents (jamais générés).", "Plan du site des produits : non fourni par le moteur."] };
}
module.exports = { checkDrafts, checkCatalog };
