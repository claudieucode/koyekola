// Activation / désactivation d'une extension POUR UN SITE. Atomique : une seule transaction (état + journal + étape propre à l'extension) ; au moindre échec TOUT est annulé, l'état reste celui d'avant,
// et l'échec est journalisé APRÈS l'annulation. Jamais de suppression de données : désactiver ne fait que passer `enabled` à 0 (les tables de l'extension ne sont pas touchées).
// Règles : équipe seulement (jamais une personne limitée à un site) ; permission `sites.modules` si le contexte la fournit ; dépendances et conflits vérifiés ; extension en maintenance non activable ; désactivation confirmée.
const path = require("node:path");
const { MarketingError } = require("../marketing/errors");
const { transaction } = require("../marketing/db/tx");
const { recordAudit } = require("../marketing/audit");
const primarySite = require("../services/primarySite");
const registry = require("./registry");
const state = require("./state");

const ROOT = path.resolve(__dirname, "..", "..");
const team = (ctx) => ctx.siteScope === undefined || ctx.siteScope === null;

function logEvent(db, e) {
  db.prepare("INSERT INTO mk_extension_events (organization_id, site_id, extension, action, version, user_id, detail) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(e.organizationId, e.siteId, e.extension, e.action, e.version ?? null, e.userId ?? null, JSON.stringify(e.detail || {}));
}
function loadSite(ctx, siteId) {
  const site = ctx.db.prepare(`SELECT id, name, deleted_at FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(ctx.db)}`).get(siteId, ctx.organizationId);
  if (!site || site.deleted_at) throw new MarketingError("not_found", "Site introuvable.");
  return site;
}
function access(ctx) {
  if (!team(ctx)) throw new MarketingError("forbidden", "L'activation des modules est réservée à l'équipe de l'organisation.");
  if (typeof ctx.can === "function" && !ctx.can("sites.modules")) throw new MarketingError("forbidden", "Vous n'avez pas le droit d'activer ou de désactiver des extensions.");
}
function extension(id) {
  const m = registry.load().get(id);
  if (!m) throw new MarketingError("invalid_field", "Module inconnu.");
  return m;
}
// Étape propre à l'extension (optionnelle) : chargée seulement ici, à l'activation (jamais au démarrage), et seulement depuis le dépôt.
function lifecycle(m) {
  const rel = m.entry && m.entry.lifecycle;
  if (!rel) return null;
  const abs = path.resolve(ROOT, rel);
  if (!abs.startsWith(ROOT + path.sep)) throw new MarketingError("invalid_field", "Point d'entrée hors du dépôt.");
  return require(abs);
}

// Ce qui se passerait, sans rien écrire : sert à l'écran de confirmation ET aux contrôles de enable/disable.
function plan(ctx, siteId, id, wantEnabled) {
  const m = extension(id);
  loadSite(ctx, siteId);
  const on = new Set(state.enabledIds(ctx.db, ctx.organizationId, siteId));
  const blockers = [];
  const effects = [];
  if (wantEnabled) {
    if (m.availability === "unavailable") blockers.push({ code: "unavailable", message: `« ${m.name} » n'est pas encore disponible.` });
    if (m.maintenance === "maintenance") blockers.push({ code: "maintenance", message: `« ${m.name} » est en maintenance : elle ne peut pas être activée pour le moment.` });
    for (const d of m.dependencies) {
      const dep = registry.load().get(d.id);
      if (!on.has(d.id)) blockers.push({ code: "dependency_missing", message: `Active d'abord « ${dep.name} » : « ${m.name} » en dépend.`, extension: d.id });
    }
    for (const c of m.conflicts) if (on.has(c)) blockers.push({ code: "conflict", message: `« ${m.name} » est incompatible avec « ${registry.load().get(c).name} », déjà activée sur ce site.`, extension: c });
    if (m.maintenance === "deprecated") effects.push("Cette extension est obsolète : elle sera retirée dans une prochaine version.");
    effects.push(`Les menus et pages de « ${m.name} » deviennent accessibles sur ce site.`);
  } else {
    for (const dep of registry.load().dependentsOf(id)) if (on.has(dep)) blockers.push({ code: "dependents_active", message: `Désactive d'abord « ${registry.load().get(dep).name} » : elle dépend de « ${m.name} ».`, extension: dep });
    effects.push(`Les menus, pages et routes de « ${m.name} » ne seront plus accessibles sur ce site.`, "Aucune donnée n'est supprimée : tout est retrouvé à la réactivation.");
  }
  return { extension: m, enabledNow: on.has(id), blockers, effects, needsConfirm: !wantEnabled || m.maintenance === "deprecated" };
}

function change(ctx, siteId, id, wantEnabled, { confirm = false } = {}) {
  access(ctx);
  const m = extension(id);
  const site = loadSite(ctx, siteId);
  const refuse = (code, message, detail) => {
    try { logEvent(ctx.db, { organizationId: ctx.organizationId, siteId, extension: id, action: "refused", version: m.version, userId: ctx.userId, detail: { wanted: wantEnabled ? "enable" : "disable", code, ...detail } }); } catch { /* la trace ne bloque jamais */ }
    throw new MarketingError(code, message);
  };
  const before = ctx.db.prepare("SELECT enabled FROM mk_site_modules WHERE site_id = ? AND module = ?").get(siteId, id);
  const current = before ? before.enabled === 1 : false;
  if (current === wantEnabled) return { changed: false, enabled: wantEnabled };
  const p = plan(ctx, siteId, id, wantEnabled);
  if (p.blockers.length) refuse(p.blockers[0].code, p.blockers[0].message, { blockers: p.blockers.map((b) => b.code) });
  if (p.needsConfirm && !confirm) refuse("confirm_required", `Confirmation requise : ${p.effects.join(" ")}`);
  const value = wantEnabled ? 1 : 0;
  try {
    transaction(ctx.db, () => {
      ctx.db.prepare("INSERT INTO mk_site_modules (site_id, organization_id, module, enabled, updated_by) VALUES (?, ?, ?, ?, ?) ON CONFLICT (site_id, module) DO UPDATE SET enabled = excluded.enabled, updated_by = excluded.updated_by, updated_at = datetime('now')")
        .run(siteId, ctx.organizationId, id, value, ctx.userId ?? null);
      const life = lifecycle(m);
      const step = life && (wantEnabled ? life.onEnable : life.onDisable);
      if (step) step({ db: ctx.db, organizationId: ctx.organizationId, userId: ctx.userId ?? null }, siteId);
      logEvent(ctx.db, { organizationId: ctx.organizationId, siteId, extension: id, action: wantEnabled ? "enable" : "disable", version: m.version, userId: ctx.userId, detail: { site: site.name } });
    });
  } catch (error) {
    state.invalidate(ctx.db, ctx.organizationId, siteId);
    try { logEvent(ctx.db, { organizationId: ctx.organizationId, siteId, extension: id, action: "failed", version: m.version, userId: ctx.userId, detail: { wanted: wantEnabled ? "enable" : "disable", error: String(error.message).slice(0, 300) } }); } catch { /* idem */ }
    if (error instanceof MarketingError) throw error;
    throw new MarketingError("activation_failed", `L'opération a échoué et a été annulée : l'état du site n'a pas changé. (${String(error.message).slice(0, 120)})`);
  }
  state.invalidate(ctx.db, ctx.organizationId, siteId); // cache : le prochain contrôle relit la base
  try { recordAudit(ctx.db, { organizationId: ctx.organizationId, userId: ctx.userId ?? null, action: value ? "site_module.enabled" : "site_module.disabled", resourceType: "site_module", resourceId: id, metadata: { module: id, version: m.version }, siteId }); } catch { /* la trace ne bloque jamais */ }
  return { changed: true, enabled: wantEnabled };
}
const enable = (ctx, siteId, id, opts) => change(ctx, siteId, id, true, opts);
const disable = (ctx, siteId, id, opts) => change(ctx, siteId, id, false, opts);

// Historique : journal de l'organisation (ou d'un site), plus récent d'abord. Un accès limité à un site ne voit que SON site.
function history(ctx, { siteId = null, extension: ext = null, limit = 50 } = {}) {
  const where = ["e.organization_id = ?"]; const args = [ctx.organizationId];
  if (!team(ctx)) { where.push("e.site_id = ?"); args.push(ctx.siteScope); } else if (Number.isInteger(siteId)) { where.push("e.site_id = ?"); args.push(siteId); }
  if (ext) { where.push("e.extension = ?"); args.push(String(ext)); }
  args.push(Math.min(Math.max(Number(limit) || 50, 1), 200));
  return ctx.db.prepare(`SELECT e.id, e.site_id, s.name AS site_name, e.extension, e.action, e.version, e.user_id, e.detail, e.created_at FROM mk_extension_events e JOIN mk_sites s ON s.id = e.site_id WHERE ${where.join(" AND ")} ORDER BY e.id DESC LIMIT ?`).all(...args)
    .map((r) => ({ ...r, detail: (() => { try { return JSON.parse(r.detail); } catch { return {}; } })() }));
}

// Paramètres d'une extension pour un site : validés par le manifeste, jamais lus d'un autre site.
function getSettings(ctx, siteId, id) {
  const m = extension(id);
  loadSite(ctx, siteId);
  if (!team(ctx) && ctx.siteScope !== siteId) throw new MarketingError("forbidden", "Accès refusé à ce site.");
  const rows = new Map(ctx.db.prepare("SELECT key, value FROM mk_extension_settings WHERE site_id = ? AND organization_id = ? AND extension = ?").all(siteId, ctx.organizationId, id).map((r) => [r.key, r.value]));
  return m.settings.map((s) => ({ ...s, value: rows.has(s.key) ? coerce(s, rows.get(s.key)) : s.default }));
}
function coerce(s, raw) {
  if (s.type === "number") { const n = Number(raw); if (!Number.isFinite(n)) throw new MarketingError("invalid_field", `Paramètre « ${s.label} » : nombre attendu.`); return n; }
  if (s.type === "boolean") return raw === true || raw === "1" || raw === "true" || raw === 1;
  if (s.type === "select") { if (!(s.options || []).includes(String(raw))) throw new MarketingError("invalid_field", `Paramètre « ${s.label} » : valeur non proposée.`); return String(raw); }
  return String(raw).slice(0, 500);
}
function setSetting(ctx, siteId, id, key, raw) {
  access(ctx);
  const m = extension(id);
  loadSite(ctx, siteId);
  const s = m.settings.find((x) => x.key === key);
  if (!s) throw new MarketingError("invalid_field", "Paramètre inconnu.");
  if (!state.isEnabled(ctx.db, ctx.organizationId, siteId, id)) throw new MarketingError("module_disabled", `« ${m.name} » n'est pas activée pour ce site.`);
  const value = coerce(s, raw);
  transaction(ctx.db, () => {
    ctx.db.prepare("INSERT INTO mk_extension_settings (site_id, organization_id, extension, key, value, updated_by) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT (site_id, extension, key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = datetime('now')")
      .run(siteId, ctx.organizationId, id, key, typeof value === "boolean" ? (value ? "1" : "0") : String(value), ctx.userId ?? null);
    logEvent(ctx.db, { organizationId: ctx.organizationId, siteId, extension: id, action: "settings", version: m.version, userId: ctx.userId, detail: { key } });
  });
  return { value };
}

module.exports = { plan, enable, disable, history, getSettings, setSetting };
