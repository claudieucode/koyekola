// « Utiliser ce modèle » : crée la copie du catalogue dans CE site (composant pour l'en-tête et le pied de page, page pour les autres types) puis le modèle du Theme Builder (brouillon).
// La copie est indépendante : modifier ou supprimer le modèle du site ne touche jamais le catalogue ni un autre site.
const { MarketingError } = require("../../marketing/errors");
const { transaction } = require("../../marketing/db/tx");
const store = require("../store");
const Types = require("../types");
const Catalog = require("./index");

const P = () => require("../../marketing/pages");
const bad = (m, code = "invalid_field") => new MarketingError(code, m);

// Premier formulaire d'inscription réel du site (le catalogue n'invente jamais de formulaire) ; null s'il n'y en a pas
function siteFormId(ctx, siteId) {
  try { const r = ctx.db.prepare("SELECT id FROM mk_forms WHERE organization_id = ? AND (site_id = ? OR site_id IS NULL) ORDER BY (site_id = ?) DESC, id LIMIT 1").get(ctx.organizationId, siteId, siteId); return r ? r.id : null; } catch { return null; }
}
function useTemplate(ctx, siteId, type, key, { name, conditions, identity } = {}) {
  store.site(ctx, siteId);
  if (!Types.has(type) || !Catalog.types().includes(type)) throw bad("Ce type de modèle n'a pas de catalogue.");
  const meta = Catalog.find(type, String(key || ""));
  if (!meta) throw bad("Modèle du catalogue introuvable.", "not_found");
  const doc = Catalog.build(type, meta.key, { formId: siteFormId(ctx, siteId), identity });
  const label = String(name || meta.name).slice(0, 100);
  return transaction(ctx.db, () => {
    let created;
    if (doc.kind === "component") created = P().createComponent(ctx, { name: store.docName(ctx, siteId, "component", label), section: JSON.parse(JSON.stringify(doc.section)), siteId, kind: "standard" });
    else created = P().createPage(ctx, { name: store.docName(ctx, siteId, "page", label), siteId, kind: "page", sections: JSON.parse(JSON.stringify(doc.sections)) });
    const tpl = store.create(ctx, siteId, { type, name: label, conditions: conditions || {}, sourceKind: doc.kind, sourceId: created.id });
    if (type === "footer") ctx.db.prepare("UPDATE mk_tb_templates SET origin_key = ? WHERE id = ? AND organization_id = ?").run(meta.key, tpl.id, ctx.organizationId); // mémoire du modèle d'origine (« Revenir au modèle d'origine »)
    return tpl;
  });
}
module.exports = { useTemplate, siteFormId };
