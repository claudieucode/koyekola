// Identité graphique d'un modèle Fiche produit : changer de mode (indépendante / héritée du site / hybride) sans détruire les personnalisations.
// Le modèle d'origine est reconstruit dans l'ancien et le nouveau mode ; seules les valeurs que l'utilisateur n'a PAS modifiées sont converties (voir catalog/identityModes.js).
// L'état avant conversion est conservé dans l'historique de la page : l'opération s'annule en restaurant ce point. Rien n'est publié : la conversion agit sur le brouillon.
const { MarketingError } = require("../marketing/errors");
const { transaction } = require("../marketing/db/tx");
const store = require("./store");
const Catalog = require("./catalog");
const Modes = require("./catalog/identityModes");
const { siteFormId } = require("./catalog/use");

const P = () => require("../marketing/pages");
const bad = (m, code = "invalid_field") => new MarketingError(code, m);
const clone = (v) => JSON.parse(JSON.stringify(v));

function switchMode(ctx, siteId, templateId, mode) {
  if (!Modes.MODES.includes(mode)) throw bad("Mode d'identité inconnu.");
  const t = store.get(ctx, siteId, templateId);
  if (t.type !== "single_product" || t.sourceKind !== "page") throw bad("Le mode d'identité s'applique aux modèles « Fiche produit » installés depuis la bibliothèque.");
  if (t.status === "archived") throw bad("Ce modèle est archivé : restaurez-le avant de le modifier.", "conflict");
  const row = ctx.db.prepare("SELECT origin_key, identity_mode FROM mk_tb_templates WHERE id = ? AND organization_id = ? AND site_id IS ?").get(t.id, ctx.organizationId, siteId);
  if (!row || !row.origin_key) throw bad("Ce modèle n'a pas été installé depuis la bibliothèque : son identité d'origine n'est pas connue.");
  if (!Catalog.find("single_product", row.origin_key)) throw bad("Le modèle d'origine n'existe plus dans la bibliothèque.", "not_found");
  const from = Modes.MODES.includes(row.identity_mode) ? row.identity_mode : "own";
  if (from === mode) return { template: store.get(ctx, siteId, t.id), mode, changed: 0, version: null };
  const env = { formId: siteFormId(ctx, siteId) };
  const before = Catalog.build("single_product", row.origin_key, { ...env, identity: from });
  const after = Catalog.build("single_product", row.origin_key, { ...env, identity: mode });
  return transaction(ctx.db, () => {
    const page = P().getPage(ctx, t.sourceId);
    if (!page) throw bad("Le document du modèle est introuvable.", "not_found");
    // Point de retour : l'état AVANT la conversion rejoint l'historique de la page (jamais bloquant) ; la conversion elle-même crée le point suivant
    try { require("../services/revisions").hooks.pageDraft(ctx, page, page.working); } catch { /* historique indisponible : la conversion reste possible */ }
    const version = null;
    const sections = clone(page.working.sections);
    const changed = Modes.convertNodes(sections, clone(before.sections), clone(after.sections));
    P().saveDraft(ctx, t.sourceId, { sections }, { revision: page.revision });
    ctx.db.prepare("UPDATE mk_tb_templates SET identity_mode = ? WHERE id = ? AND organization_id = ? AND site_id IS ?").run(mode, t.id, ctx.organizationId, siteId);
    return { template: store.get(ctx, siteId, t.id), mode, changed, version };
  });
}
const modeOf = (ctx, siteId, templateId) => {
  const r = ctx.db.prepare("SELECT identity_mode FROM mk_tb_templates WHERE id = ? AND organization_id = ? AND site_id IS ?").get(Number(templateId), ctx.organizationId, siteId);
  return r && Modes.MODES.includes(r.identity_mode) ? r.identity_mode : "own";
};
module.exports = { switchMode, modeOf, MODES: Modes.MODES };
