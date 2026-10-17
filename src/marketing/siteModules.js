// R7 (lot 6.0) — Socle PARTAGÉ d'activation des modules par site (décision produit du 17/10/2026). Un seul mécanisme pour les six moteurs secondaires (un seul registre, une seule table `mk_site_modules`).
// Règles :
//  - désactivé PAR DÉFAUT pour un site (pas de ligne = désactivé) ; le site principal n'est jamais soumis à l'activation (comportement historique) ;
//  - l'activation est explicite et réservée à l'ÉQUIPE de l'organisation (jamais à une personne limitée à un site, même administrateur de ce site) ;
//  - désactiver ne supprime AUCUNE donnée ; l'activation ne remplace NI les permissions NI l'isolation par site (contrôle supplémentaire seulement) ;
//  - côté serveur : `assertEnabled(ctx, module)` pour les services, `isEnabled` / `moduleOfPath` pour les routes (garde dans web/index.js).
const { MarketingError } = require("./errors");
const { recordAudit } = require("./audit");

// Registre fermé. `phase` : sous-lot qui rend le moteur sensible au site ; `ready` : le moteur honore le site (false = activation possible mais SANS effet visible tant que le sous-lot n'est pas livré).
const MODULES = Object.freeze({
  sms: { label: "SMS", phase: "R7-6.1", ready: true },
  ai: { label: "Intelligence artificielle", phase: "R7-6.2", ready: false },
  social: { label: "Réseaux sociaux", phase: "R7-6.3", ready: false },
  scoring: { label: "Score des contacts", phase: "R7-6.4", ready: false },
  commerce: { label: "Commerce", phase: "R7-6.5", ready: false },
  lms: { label: "Formations", phase: "R7-6.6", ready: false },
});
const KEYS = Object.keys(MODULES);

// Écrans d'administration de chaque moteur (déclaration unique ; les pages publiques /s/…, /go/…, /e/… ne sont pas concernées). Un module sans écran ici (lms) est gardé par ses propres routes.
const ROUTES = Object.freeze({
  sms: /^\/(?:sms(?:\/|$)|contacts\/\d+\/sms(?:\/|$))/,
  social: /^\/reseaux(?:\/|$)/,
  scoring: /^\/score(?:\/|$)/,
  ai: /^\/ia(?:\/|$)/,
  commerce: /^\/revenus(?:\/|$)/,
});
function moduleOfPath(path) {
  for (const [key, re] of Object.entries(ROUTES)) if (re.test(path)) return key;
  return null;
}

const isModule = (key) => typeof key === "string" && Object.hasOwn(MODULES, key);
// Site principal (null / undefined) : toujours actif. Site : activé seulement par une ligne explicite enabled = 1.
function isEnabled(db, organizationId, siteId, module) {
  if (!isModule(module)) return false;
  if (siteId === null || siteId === undefined) return true;
  if (!Number.isInteger(siteId) || siteId < 1) return false;
  try { return Boolean(db.prepare("SELECT 1 FROM mk_site_modules WHERE site_id = ? AND organization_id = ? AND module = ? AND enabled = 1").get(siteId, organizationId, module)); } catch { return false; }
}

// Garde de SERVICE : un accès limité à un site (ctx.siteScope, imposé par le serveur) exige que le module soit activé pour CE site ; l'équipe (sans siteScope) n'est jamais bloquée (elle gère les données).
function assertEnabled(ctx, module) {
  if (!isModule(module)) throw new MarketingError("invalid_field", "Module inconnu.");
  if (ctx.siteScope === undefined || ctx.siteScope === null) return;
  if (!isEnabled(ctx.db, ctx.organizationId, ctx.siteScope, module)) throw new MarketingError("module_disabled", `Le module « ${MODULES[module].label} » n'est pas activé pour ce site.`);
}

// Décision de garde d'un écran (utilisée par web/index.js) : refuse un accès LIMITÉ à un site (`siteOnly`) sur l'écran d'un module qui n'est pas activé pour CE site, ou dont le site n'est pas un site valide.
// L'équipe et les écrans qui n'appartiennent à aucun module ne sont jamais refusés ici (les permissions et la portée des routes s'appliquent par ailleurs).
function denies({ siteOnly, siteId }, path, db, organizationId) {
  const mod = moduleOfPath(path);
  if (!mod || !siteOnly) return false;
  return !(Number.isInteger(siteId) && isEnabled(db, organizationId, siteId, mod));
}

function listFor(ctx, siteId) {
  const site = ctx.db.prepare("SELECT id FROM mk_sites WHERE id = ? AND organization_id = ?").get(siteId, ctx.organizationId);
  if (!site) throw new MarketingError("not_found", "Site introuvable.");
  const rows = new Map(ctx.db.prepare("SELECT module, enabled FROM mk_site_modules WHERE site_id = ? AND organization_id = ?").all(siteId, ctx.organizationId).map((r) => [r.module, r.enabled === 1]));
  return KEYS.map((key) => ({ key, label: MODULES[key].label, phase: MODULES[key].phase, ready: MODULES[key].ready, enabled: rows.get(key) === true }));
}

// Activation / désactivation : ÉQUIPE seulement (jamais une personne limitée à un site), site existant non supprimé, module du registre. Idempotent. Aucune donnée de moteur touchée.
function setEnabled(ctx, siteId, module, enabled) {
  if (ctx.siteScope !== undefined && ctx.siteScope !== null) throw new MarketingError("forbidden", "L'activation des modules est réservée à l'équipe de l'organisation.");
  if (!isModule(module)) throw new MarketingError("invalid_field", "Module inconnu.");
  const site = ctx.db.prepare("SELECT id, deleted_at FROM mk_sites WHERE id = ? AND organization_id = ?").get(siteId, ctx.organizationId);
  if (!site || site.deleted_at) throw new MarketingError("not_found", "Site introuvable.");
  const value = enabled ? 1 : 0;
  const before = ctx.db.prepare("SELECT enabled FROM mk_site_modules WHERE site_id = ? AND module = ?").get(siteId, module);
  if ((before ? before.enabled : 0) === value) return { changed: false, enabled: Boolean(value) };
  ctx.db.prepare("INSERT INTO mk_site_modules (site_id, organization_id, module, enabled, updated_by) VALUES (?, ?, ?, ?, ?) ON CONFLICT (site_id, module) DO UPDATE SET enabled = excluded.enabled, updated_by = excluded.updated_by, updated_at = datetime('now')")
    .run(siteId, ctx.organizationId, module, value, ctx.userId ?? null);
  try { recordAudit(ctx.db, { organizationId: ctx.organizationId, userId: ctx.userId ?? null, action: value ? "site_module.enabled" : "site_module.disabled", resourceType: "site_module", resourceId: module, metadata: { module }, siteId }); } catch { /* la trace ne bloque jamais */ }
  return { changed: true, enabled: Boolean(value) };
}
module.exports = { MODULES, KEYS, ROUTES, moduleOfPath, isModule, isEnabled, assertEnabled, denies, listFor, setEnabled };
