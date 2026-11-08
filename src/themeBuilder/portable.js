// Export / import d'un modèle (programme 23.1). Format JSON fermé « kolakisa-theme-template@1 », revalidé à l'import par les normaliseurs natifs : aucun code exécutable n'est conservé.
// L'export retire ce qui est propre au site (identifiants d'articles, de pages, d'auteurs) : un modèle importé ailleurs ne cible jamais un contenu d'un autre site par hasard.
const { MarketingError } = require("../marketing/errors");
const Types = require("./types");
const Cond = require("./conditions");
const store = require("./store");

const FORMAT = "kolakisa-theme-template@1", MAX_BYTES = 2_000_000;
const P = () => require("../marketing/pages");
const bad = (m) => new MarketingError("invalid_field", m);
function portableConditions(c) {
  let stripped = 0;
  const side = (list) => list.map((x) => {
    const y = { ...x };
    for (const k of ["ids", "author", "parent"]) if (y[k] !== undefined) { delete y[k]; stripped += 1; }
    return y;
  }).filter((x) => !(x.kind === "child_of" && !x.parent));
  return { conditions: { include: side(c.include || []), exclude: side(c.exclude || []) }, stripped };
}
const FP = () => require("./footerPortable");
function exportTemplate(ctx, siteId, id, opts = {}) {
  const t = store.get(ctx, siteId, id);
  if (t.type === "footer") return FP().exportFooter(ctx, siteId, id, opts); // pied : format dédié (voir docs/footer-builder/FOOTER_IMPORT_EXPORT.md)
  const { conditions, stripped } = portableConditions(t.conditions);
  let document;
  if (t.sourceKind === "page") document = { kind: "page", data: P().exportPage(ctx, t.sourceId) };
  else { const c = P().getComponent(ctx, t.sourceId); if (!c) throw bad("Le document de ce modèle n'existe plus."); document = { kind: "component", name: c.name, section: c.section }; }
  return { format: FORMAT, exportedAt: new Date().toISOString(), template: { type: t.type, name: t.name, conditions }, document, notes: stripped ? [`${stripped} critère(s) propre(s) au site (identifiants) retiré(s) des conditions.`] : [] };
}
function importTemplate(ctx, siteId, payload) {
  store.site(ctx, siteId);
  if (payload && typeof payload === "object" && /^kolakisa-footer-/.test(String(payload.format || ""))) { const r = FP().importFooters(ctx, siteId, payload); return r.templates[0]; }
  if (!payload || typeof payload !== "object" || payload.format !== FORMAT) throw bad(`Fichier non reconnu : exportez un modèle depuis le Theme Builder (format ${FORMAT}).`);
  if (JSON.stringify(payload).length > MAX_BYTES) throw bad("Fichier trop volumineux.");
  const tpl = payload.template || {}, doc = payload.document || {};
  if (!Types.has(tpl.type)) throw bad("Type de modèle inconnu dans le fichier.");
  let cond; try { cond = Cond.normalize(tpl.conditions, tpl.type); } catch (e) { throw bad(e.message); }
  const expected = Types.TYPES[tpl.type].global && ["header", "footer", "sidebar"].includes(tpl.type) ? "component" : "page";
  if (doc.kind !== expected) throw bad(`Document inattendu pour un modèle « ${Types.TYPES[tpl.type].label} ».`);
  let created;
  if (doc.kind === "page") { if (!doc.data || typeof doc.data !== "object") throw bad("Document manquant."); created = P().importPage(ctx, doc.data, { siteId }); }
  else { if (!doc.section || typeof doc.section !== "object") throw bad("Document manquant."); created = P().createComponent(ctx, { name: store.docName(ctx, siteId, "component", String(tpl.name || "Import").slice(0, 60)), section: doc.section, siteId, kind: "standard" }); }
  return store.create(ctx, siteId, { type: tpl.type, name: tpl.name || "Modèle importé", conditions: cond, sourceKind: doc.kind, sourceId: created.id });
}
module.exports = { exportTemplate, importTemplate, FORMAT, exportFooters: (...a) => FP().exportFooters(...a), previewImport: (...a) => FP().preview(...a), importPackage: (...a) => FP().importFooters(...a), duplicateTemplate: (ctx, siteId, id) => FP().duplicateFooter(ctx, siteId, id) };
