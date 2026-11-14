// Socle d'activation des modules par site — ADAPTATEUR du moteur d'extensions (src/extensions/). Les six moteurs historiques (sms, ai, social, scoring, commerce, lms) sont des extensions déclarées par manifeste ;
// ce fichier garde l'interface historique (MODULES, KEYS, isEnabled, assertEnabled, denies, listFor, setEnabled) pour que tout le code existant continue de fonctionner sans changement.
// Règles inchangées : désactivé PAR DÉFAUT pour un site ; le site principal n'est jamais soumis à l'activation ; équipe seulement ; désactiver ne supprime AUCUNE donnée ; l'activation s'ajoute aux permissions et à l'isolation.
const { MarketingError } = require("./errors");
const primarySite = require("../services/primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire
const registry = require("../extensions/registry");
const state = require("../extensions/state");
const activation = require("../extensions/activation");

const reg = registry.load();
const KEYS = reg.ids;
// Vue historique du registre : { label, phase, ready }. `ready` : l'extension est disponible (pas « unavailable »).
const MODULES = Object.freeze(Object.fromEntries(reg.list().map((m) => [m.id, Object.freeze({ label: m.name, phase: m.phase || "", ready: m.availability !== "unavailable" })])));
const isModule = (key) => reg.has(key);

// Chemin d'une écran d'administration : retire le préfixe d'espace d'un site (« /site-web/sites/N ») s'il y est, et rend l'identifiant du site ainsi désigné par l'ADRESSE (vérifiée par ailleurs).
function pathInfo(path) {
  const m = /^\/site-web\/sites\/(\d{1,12})(\/.*)?$/.exec(path);
  return m ? { siteId: Number(m[1]), rest: m[2] || "/" } : { siteId: null, rest: path };
}
const moduleOfPath = (path) => reg.ownerOfPath("admin", pathInfo(path).rest);
const isEnabled = (db, organizationId, siteId, module) => state.isEnabled(db, organizationId, siteId, module);

function assertEnabled(ctx, module) {
  if (!isModule(module)) throw new MarketingError("invalid_field", "Module inconnu.");
  if (ctx.siteScope === undefined || ctx.siteScope === null) return;
  if (!isEnabled(ctx.db, ctx.organizationId, ctx.siteScope, module)) throw new MarketingError("module_disabled", `Le module « ${MODULES[module].label} » n'est pas activé pour ce site.`);
}

// Garde d'un écran d'administration (web/index.js) :
//  - l'adresse désigne un SITE (/site-web/sites/N/…) : refus pour tout le monde si l'extension n'y est pas activée (l'équipe aussi : l'espace du site n'ouvre pas ce qui est désactivé pour lui) ;
//  - sinon, un accès LIMITÉ à un site est refusé sur l'écran d'une extension non activée pour CE site ; l'équipe sur un écran central n'est jamais refusée (elle gère les données).
function denies({ siteOnly, siteId }, path, db, organizationId) {
  const info = pathInfo(path);
  const ext = reg.ownerOfPath("admin", info.rest);
  if (!ext) return false;
  if (info.siteId !== null) {
    let prim = null; try { prim = primarySite.row(db, organizationId); } catch { prim = null; }
    if (prim && prim.id === info.siteId) return false; // la ligne dédiée du principal : redirigée plus loin vers l'espace du principal, jamais soumise à l'activation
    return !isEnabled(db, organizationId, info.siteId, ext);
  }
  if (!siteOnly) return false;
  return !(Number.isInteger(siteId) && isEnabled(db, organizationId, siteId, ext));
}

function listFor(ctx, siteId) {
  const site = ctx.db.prepare(`SELECT id FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(ctx.db)}`).get(siteId, ctx.organizationId);
  if (!site) throw new MarketingError("not_found", "Site introuvable.");
  const on = new Set(state.enabledIds(ctx.db, ctx.organizationId, siteId));
  return reg.list().length ? KEYS.map((key) => { const m = reg.get(key); return { key, label: m.name, phase: m.phase || "", ready: m.availability !== "unavailable", enabled: on.has(key), description: m.description, icon: m.icon, version: m.version, category: m.category, publisher: m.publisher, maintenance: m.maintenance, availability: m.availability, dependencies: m.dependencies.map((d) => d.id) }; }) : [];
}

// Activation / désactivation : délègue au moteur (atomique, dépendances, journal). Les appelants historiques (assistant de site, écran « Modules du site ») ont déjà recueilli leur confirmation.
function setEnabled(ctx, siteId, module, enabled) {
  const r = enabled ? activation.enable(ctx, siteId, module, { confirm: true }) : activation.disable(ctx, siteId, module, { confirm: true });
  return { changed: r.changed, enabled: r.enabled };
}
// ROUTES : conservé pour la lecture (documentation, tests) — expressions des écrans d'administration de chaque extension
const ROUTES = Object.freeze(Object.fromEntries(reg.list().filter((m) => m.adminRoutes.length).map((m) => [m.id, new RegExp(m.adminRoutes.join("|"))])));
module.exports = { MODULES, KEYS, ROUTES, moduleOfPath, pathInfo, isModule, isEnabled, assertEnabled, denies, listFor, setEnabled };
