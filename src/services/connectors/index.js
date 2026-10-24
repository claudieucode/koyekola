// KOLAKISA CMS → Connecteurs : registre, moteur d'intégration et couche de services pour les modules. Un seul endroit pour : découvrir les connecteurs, enregistrer leur configuration (secrets chiffrés),
// tester la connexion, activer / désactiver, choisir le fournisseur d'une capacité et EXÉCUTER une capacité (invoke) avec validation, limites, erreurs normalisées et journal sans secret.
//   • Registre : un fichier par fournisseur dans ./adapters (contrat décrit dans docs/KOLAKISA_CMS_CONNECTEURS.md). Le chargement est limité à ce dossier du dépôt : aucun code n'est chargé parce qu'un nom
//     apparaît dans une réponse, un formulaire ou la base.
//   • Portée : { siteId: null } = niveau central (site principal et organisation) · { siteId: N } = un site. Un site n'utilise QUE sa connexion, ou celle du niveau central si l'équipe l'a explicitement partagée.
//   • Secrets : jamais dans mk_connections ; chiffrés (AES-256-GCM, liés au contexte) dans mk_settings sous « connector.<id>.<champ> » ; jamais renvoyés, journalisés ni affichés.
const fs = require("node:fs");
const path = require("node:path");
const db = require("../../config/database");
const { createSettings } = require("../../marketing/settings");
const { parseKey } = require("../../marketing/security/crypto");
const { recordAudit } = require("../../marketing/audit");
const primarySite = require("../primarySite");
const { UserError } = require("../../utils/errors");
const { transaction } = require("../../marketing/db/tx");
const http = require("./http");
const { ConnectorError, scrub, CODES } = require("./errors");
const { CAPABILITIES } = require("./capabilities");
const externals = require("./external");

const CATEGORIES = Object.freeze({ ai: "Intelligence artificielle", email: "E-mail", messaging: "Messagerie", payments: "Paiements", storage: "Stockage", seo: "SEO et analyse", automation: "Automatisation" });
const STATES = Object.freeze({ configured: "Configuré", connected: "Connecté", error: "En erreur", disabled: "Désactivé", pending: "En attente d'autorisation" });
const FIELD_TYPES = ["secret", "text", "select", "boolean", "number"];
const registry = new Map();

function validateAdapter(a) {
  const fail = (m) => { throw new Error(`Connecteur invalide (${a && a.id}) : ${m}`); };
  if (!a || !/^[a-z0-9-]{2,40}$/.test(a.id || "")) fail("identifiant");
  if (!a.name || !Object.hasOwn(CATEGORIES, a.category)) fail("nom ou catégorie");
  if (a.kind === "external") return a;
  if (!/^https:\/\/[a-z0-9.-]+\/?$/.test(a.baseUrl || "")) fail("baseUrl HTTPS d'un nom d'hôte déclaré");
  if (!Array.isArray(a.fields) || a.fields.some((f) => !/^[a-zA-Z][a-zA-Z0-9]{0,30}$/.test(f.key || "") || !FIELD_TYPES.includes(f.type))) fail("champs");
  if (typeof a.test !== "function") fail("test de connexion manquant");
  if (!a.capabilities || !Object.keys(a.capabilities).length) fail("aucune capacité");
  for (const [cap, fn] of Object.entries(a.capabilities)) if (!Object.hasOwn(CAPABILITIES, cap) || typeof fn !== "function") fail(`capacité « ${cap} » inconnue ou sans implémentation`);
  return a;
}
// Enregistrement : réservé au code du dépôt (dossier adapters, ou module chargé par le démarrage) ; refuse un doublon
function register(adapter) {
  validateAdapter(adapter);
  if (registry.has(adapter.id)) throw new Error(`Connecteur déjà enregistré : ${adapter.id}`);
  registry.set(adapter.id, adapter);
}
const dir = path.join(__dirname, "adapters");
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".js")).sort()) register(require(path.join(dir, file)));
for (const e of externals) register(e);

const get = (id) => registry.get(String(id));
const adapters = () => [...registry.values()];
const snake = (k) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
const secretKey = (rowId, field) => `connector.${rowId}.${snake(field)}`;
const isoNow = () => new Date().toISOString().slice(0, 19).replace("T", " ");

const settingsOf = (ctx) => ctx.settings || createSettings(db, { encryptionKey: process.env.ENCRYPTION_KEY });
function encryptionReady() { try { parseKey(process.env.ENCRYPTION_KEY); return true; } catch { return false; } }
const availability = (a) => {
  if (a.kind === "external") return { available: true, reason: "" };
  if (!encryptionReady()) return { available: false, reason: "Le chiffrement des secrets n'est pas configuré sur le serveur (variable ENCRYPTION_KEY) : aucune clé ne peut être enregistrée." };
  return { available: true, reason: "" };
};

// ---------- Lignes (toujours relues avec leur portée : jamais une ligne d'un autre site) ----------
const parse = (r) => (r ? { ...r, config: JSON.parse(r.config || "{}"), secretFields: JSON.parse(r.secret_fields || "[]"), shared: Boolean(r.shared) } : null);
const rowAt = (org, siteId, connector) => parse(db.prepare("SELECT * FROM mk_connections WHERE organization_id = ? AND site_id IS ? AND connector = ?").get(org, siteId ?? null, connector));
function ownRow(ctx, scope, id) {
  const row = Number.isInteger(id) ? parse(db.prepare("SELECT * FROM mk_connections WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId)) : null;
  if (!row || (row.site_id ?? null) !== (scope.siteId ?? null)) throw new UserError("Connexion introuvable pour ce site.");
  return row;
}
// Connexion EFFECTIVE d'un niveau : la sienne ; pour un site, sinon celle du niveau central SI elle est partagée (explicite, jamais par défaut)
function effective(ctx, scope, connector) {
  const own = rowAt(ctx.organizationId, scope.siteId ?? null, connector);
  if (own) return { row: own, source: scope.siteId ? "site" : "central" };
  if (scope.siteId) { const central = rowAt(ctx.organizationId, null, connector); if (central && central.shared) return { row: central, source: "central" }; }
  return { row: null, source: null };
}
const audit = (ctx, scope, action, row, metadata = {}) => { try { recordAudit(db, { organizationId: ctx.organizationId, userId: ctx.userId ?? null, action, resourceType: "connection", resourceId: row ? row.id : null, metadata: { connector: row ? row.connector : metadata.connector, ...metadata }, siteId: scope.siteId ?? null }); } catch { /* le journal ne casse jamais l'action */ } };

// Ce que l'interface a le droit de voir d'une connexion : jamais une valeur secrète
function publicView(row) {
  if (!row) return null;
  return { id: row.id, state: row.state, stateLabel: STATES[row.state], config: row.config, secretFields: row.secretFields, shared: row.shared, siteId: row.site_id,
    lastTest: row.last_test_at ? { at: row.last_test_at, ok: Boolean(row.last_test_ok), code: row.last_test_code, message: row.last_test_message } : null,
    lastError: row.last_error_at ? { at: row.last_error_at, code: row.last_error_code, message: row.last_error_message } : null, usageCount: row.usage_count, lastUsedAt: row.last_used_at, updatedAt: row.updated_at };
}

// ---------- Catalogue ----------
function catalog(ctx, scope = { siteId: null }) {
  return adapters().filter((a) => a.kind !== "external" || !scope.siteId).map((a) => {
    const av = availability(a);
    if (a.kind === "external") {
      let st = { state: "unknown", detail: "" }; try { st = a.status(ctx); } catch { /* état inconnu */ }
      return { id: a.id, kind: "external", name: a.name, provider: a.provider, category: a.category, categoryLabel: CATEGORIES[a.category], mark: a.mark, description: a.description, docsUrl: a.docsUrl || "", capabilities: [], available: true, availabilityReason: "", managedBy: a.managedBy, manage: a.manage, external: { state: st.state, detail: st.detail }, connection: null, source: null };
    }
    const eff = effective(ctx, scope, a.id);
    return { id: a.id, kind: "native", name: a.name, provider: a.provider, category: a.category, categoryLabel: CATEGORIES[a.category], mark: a.mark, version: a.version, description: a.description, longDescription: a.longDescription || "", docsUrl: a.docsUrl, credentialsUrl: a.credentialsUrl || "",
      auth: a.auth.method, capabilities: Object.keys(a.capabilities), requirements: a.requirements || [], costNote: a.costNote || "", privacyNote: a.privacyNote || "",
      fields: a.fields.map((f) => ({ key: f.key, label: f.label, type: f.type, required: Boolean(f.required), help: f.help || "", default: f.default ?? "", options: f.options || null })),
      available: av.available, availabilityReason: av.reason, connection: publicView(eff.row), source: eff.source };
  });
}

// ---------- Configuration ----------
function cleanInput(a, input, row) {
  const errors = [], config = { ...(row ? row.config : {}) }, secrets = {};
  for (const f of a.fields) {
    const raw = input[f.key];
    if (f.type === "secret") {
      const v = typeof raw === "string" ? raw.trim() : "";
      if (!v) { if (f.required && !(row && row.secretFields.includes(f.key))) errors.push(`${f.label} : obligatoire.`); continue; }
      if (v.length > 500) { errors.push(`${f.label} : 500 caractères au plus.`); continue; }
      if (f.pattern && !f.pattern.test(v)) { errors.push(`${f.label} : ${f.patternHelp || "format invalide."}`); continue; }
      secrets[f.key] = v;
    } else {
      let v = raw === undefined ? (row ? config[f.key] : f.default) : raw;
      if (f.type === "boolean") v = v === true || v === "true" || v === "1" || v === "on";
      else if (f.type === "number") { v = v === "" || v === undefined || v === null ? "" : Number(v); if (v !== "" && !Number.isFinite(v)) { errors.push(`${f.label} : un nombre est attendu.`); continue; } }
      else { v = v === undefined || v === null ? "" : String(v).trim(); if (v.length > 200) { errors.push(`${f.label} : 200 caractères au plus.`); continue; } if (f.type === "select" && v && !(f.options || []).some(([k]) => k === v)) { errors.push(`${f.label} : choix inconnu.`); continue; } if (v && f.pattern && !f.pattern.test(v)) { errors.push(`${f.label} : ${f.patternHelp || "format invalide."}`); continue; } }
      if (f.required && (v === "" || v === undefined)) { errors.push(`${f.label} : obligatoire.`); continue; }
      config[f.key] = v;
    }
  }
  if (errors.length) throw new UserError(errors.join(" "));
  return { config, secrets };
}
function configure(ctx, scope, connectorId, input = {}) {
  const a = get(connectorId);
  if (!a || a.kind === "external") throw new UserError(a ? "Ce connecteur se configure dans son propre module." : "Connecteur inconnu.");
  const av = availability(a); if (!av.available) throw new UserError(av.reason);
  if (scope.siteId && !db.prepare(`SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ? AND status = 'active'${primarySite.excludeSql(db)}`).get(scope.siteId, ctx.organizationId)) throw new UserError("Site introuvable ou archivé.");
  const row = rowAt(ctx.organizationId, scope.siteId ?? null, a.id);
  const { config, secrets } = cleanInput(a, input, row);
  const settings = settingsOf(ctx);
  let id = row ? row.id : null;
  transaction(db, () => {
    if (!row) id = Number(db.prepare("INSERT INTO mk_connections (organization_id, site_id, connector, state, config, created_by) VALUES (?, ?, ?, 'configured', ?, ?)").run(ctx.organizationId, scope.siteId ?? null, a.id, JSON.stringify(config), ctx.userId ?? null).lastInsertRowid);
    for (const [field, value] of Object.entries(secrets)) settings.set(ctx.organizationId, secretKey(id, field), value, { secret: true });
    const names = [...new Set([...(row ? row.secretFields : []), ...Object.keys(secrets)])];
    // Toute modification de configuration ou de secret invalide l'ancien test : l'état « connecté » ne se déduit jamais d'avant
    const changed = !row || JSON.stringify(config) !== JSON.stringify(row.config) || Object.keys(secrets).length > 0;
    db.prepare(`UPDATE mk_connections SET config = ?, secret_fields = ?, ${changed ? "state = CASE WHEN state = 'disabled' THEN 'disabled' ELSE 'configured' END, last_test_at = NULL, last_test_ok = NULL, last_test_code = '', last_test_message = '', last_error_at = NULL, last_error_code = '', last_error_message = '', " : ""}updated_at = datetime('now') WHERE id = ?`).run(JSON.stringify(config), JSON.stringify(names), id);
  });
  const after = rowAt(ctx.organizationId, scope.siteId ?? null, a.id);
  audit(ctx, scope, row ? "connection.updated" : "connection.created", after, { fields: a.fields.map((f) => f.key).filter((k) => !a.fields.find((f) => f.key === k && f.type === "secret")), secretsReplaced: Object.keys(secrets) });
  return publicView(after);
}
// Lit les secrets d'une connexion. Un secret illisible (donnée altérée, clé de chiffrement changée, ligne copiée d'une autre connexion) n'est JAMAIS une erreur technique : le champ est traité comme manquant
// et signalé (`unreadable`) pour que la personne le saisisse à nouveau.
function secretsOf(ctx, a, row) {
  const settings = settingsOf(ctx), out = {}, unreadable = [];
  for (const f of a.fields) if (f.type === "secret" && row.secretFields.includes(f.key)) {
    try { const v = settings.get(ctx.organizationId, secretKey(row.id, f.key)); if (v) out[f.key] = v; }
    catch { unreadable.push(f.label); }
  }
  Object.defineProperty(out, "unreadable", { value: unreadable, enumerable: false });
  return out;
}
const missingSecrets = (a, secrets) => a.fields.filter((f) => f.type === "secret" && f.required && !secrets[f.key]).map((f) => f.label + ((secrets.unreadable || []).includes(f.label) ? " (illisible : saisissez-le à nouveau)" : ""));
const callerFor = (a, secrets) => (opts) => http.request(a, { ...opts, secrets: Object.values(secrets) });

// ---------- Test de connexion (vrai appel au fournisseur, non destructif) ----------
async function test(ctx, scope, id) {
  const row = ownRow(ctx, scope, id), a = get(row.connector);
  if (row.state === "disabled") throw new UserError("Connecteur désactivé : réactivez-le avant de le tester.");
  const secrets = secretsOf(ctx, a, row), missing = missingSecrets(a, secrets);
  const record = (ok, code, message, state) => { db.prepare("UPDATE mk_connections SET state = ?, last_test_at = datetime('now'), last_test_ok = ?, last_test_code = ?, last_test_message = ?, updated_at = datetime('now') WHERE id = ?").run(state, ok ? 1 : 0, code, scrub(message, Object.values(secrets)), row.id); };
  let result;
  if (missing.length) { record(false, "not_configured", `Configuration incomplète : ${missing.join(", ")}.`, "configured"); result = { ok: false, code: "not_configured", message: `Configuration incomplète : ${missing.join(", ")}.` }; }
  else {
    try { const r = await a.test({ http: callerFor(a, secrets), config: row.config, secrets }); record(true, "ok", r.message || "Connexion réussie.", "connected"); result = { ok: true, code: "ok", message: r.message || "Connexion réussie." }; }
    catch (error) {
      const e = error instanceof ConnectorError ? error : new ConnectorError("unknown", "Erreur inattendue pendant le test.");
      record(false, e.code, e.message, e.code === "auth_invalid" || e.code === "permission_denied" || e.code === "model_not_found" || e.code === "quota_exceeded" ? "error" : (row.state === "connected" ? "error" : "error"));
      result = { ok: false, code: e.code, message: scrub(e.message, Object.values(secrets)) };
    }
  }
  audit(ctx, scope, "connection.tested", row, { ok: result.ok, code: result.code });
  return { ...result, connection: publicView(ownRow(ctx, scope, id)) };
}

// ---------- Cycle de vie ----------
function setDisabled(ctx, scope, id, disabled) {
  const row = ownRow(ctx, scope, id);
  const state = disabled ? "disabled" : (row.last_test_ok ? "connected" : "configured");
  db.prepare("UPDATE mk_connections SET state = ?, updated_at = datetime('now') WHERE id = ?").run(state, row.id);
  audit(ctx, scope, disabled ? "connection.disabled" : "connection.enabled", row);
  return publicView(ownRow(ctx, scope, id));
}
// Révoque les identifiants (secrets supprimés), conserve la configuration non secrète : « à configurer »
function revokeSecrets(ctx, scope, id) {
  const row = ownRow(ctx, scope, id), settings = settingsOf(ctx);
  transaction(db, () => {
    for (const f of row.secretFields) settings.remove(ctx.organizationId, secretKey(row.id, f));
    db.prepare("UPDATE mk_connections SET secret_fields = '[]', state = CASE WHEN state = 'disabled' THEN 'disabled' ELSE 'configured' END, last_test_at = NULL, last_test_ok = NULL, last_test_code = '', last_test_message = '', updated_at = datetime('now') WHERE id = ?").run(row.id);
  });
  audit(ctx, scope, "connection.secrets_revoked", row, { secrets: row.secretFields });
  return publicView(ownRow(ctx, scope, id));
}
// Supprime la connexion, ses secrets et les préférences qui la citent
function remove(ctx, scope, id) {
  const row = ownRow(ctx, scope, id), settings = settingsOf(ctx);
  transaction(db, () => {
    for (const f of row.secretFields) settings.remove(ctx.organizationId, secretKey(row.id, f));
    db.prepare("DELETE FROM mk_connector_prefs WHERE organization_id = ? AND site_id = ? AND connector = ?").run(ctx.organizationId, scope.siteId ?? 0, row.connector);
    db.prepare("DELETE FROM mk_connections WHERE id = ?").run(row.id);
  });
  audit(ctx, scope, "connection.removed", row, { connector: row.connector });
}
// Partage d'une connexion CENTRALE avec les sites (explicite ; réservé au niveau central)
function setShared(ctx, scope, id, shared) {
  if (scope.siteId) throw new UserError("Seul le niveau central peut partager une connexion.");
  const row = ownRow(ctx, scope, id);
  db.prepare("UPDATE mk_connections SET shared = ?, updated_at = datetime('now') WHERE id = ?").run(shared ? 1 : 0, row.id);
  audit(ctx, scope, "connection.sharing_changed", row, { shared: Boolean(shared) });
  return publicView(ownRow(ctx, scope, id));
}

// ---------- Fournisseur d'une capacité (préférence par niveau ; jamais de basculement automatique) ----------
function setPreference(ctx, scope, capability, connector) {
  if (!Object.hasOwn(CAPABILITIES, capability)) throw new UserError("Capacité inconnue.");
  if (!connector) { db.prepare("DELETE FROM mk_connector_prefs WHERE organization_id = ? AND site_id = ? AND capability = ?").run(ctx.organizationId, scope.siteId ?? 0, capability); audit(ctx, scope, "connection.preference_cleared", null, { capability, connector: "—" }); return; }
  const a = get(connector);
  if (!a || a.kind === "external" || !a.capabilities[capability]) throw new UserError("Ce connecteur ne fournit pas cette capacité.");
  db.prepare("INSERT INTO mk_connector_prefs (organization_id, site_id, capability, connector) VALUES (?, ?, ?, ?) ON CONFLICT (organization_id, site_id, capability) DO UPDATE SET connector = excluded.connector, updated_at = datetime('now')").run(ctx.organizationId, scope.siteId ?? 0, capability, connector);
  audit(ctx, scope, "connection.preference_set", null, { capability, connector });
}
const preferenceOf = (ctx, scope, capability) => { const r = db.prepare("SELECT connector FROM mk_connector_prefs WHERE organization_id = ? AND site_id = ? AND capability = ?").get(ctx.organizationId, scope.siteId ?? 0, capability); return r ? r.connector : null; };
const preferences = (ctx, scope) => Object.fromEntries(Object.keys(CAPABILITIES).map((c) => [c, preferenceOf(ctx, scope, c)]));

// ---------- Exploitation par les modules ----------
const USABLE = new Set(["configured", "connected"]);
const windows = new Map();
function takeSlot(rowId, perMinute) {
  const now = Date.now(), list = (windows.get(rowId) || []).filter((t) => now - t < 60000);
  if (list.length >= perMinute) { windows.set(rowId, list); return false; }
  list.push(now); windows.set(rowId, list); return true;
}
// Connecteurs capables de la capacité, avec leur état à ce niveau
function providersFor(ctx, scope, capability) {
  return adapters().filter((a) => a.kind !== "external" && a.capabilities[capability]).map((a) => { const e = effective(ctx, scope, a.id); return { id: a.id, name: a.name, state: e.row ? e.row.state : "absent", source: e.source, usable: Boolean(e.row && USABLE.has(e.row.state)) }; });
}
function choose(ctx, scope, capability, wanted) {
  const list = providersFor(ctx, scope, capability);
  const pick = wanted || preferenceOf(ctx, scope, capability);
  if (pick) {
    const p = list.find((x) => x.id === pick);
    if (!p) throw new ConnectorError("unsupported", "Ce connecteur ne fournit pas cette capacité.");
    if (!p.usable) throw new ConnectorError(p.state === "disabled" ? "disabled" : "not_configured", p.state === "absent" ? `« ${p.name} » n'est pas configuré pour ce site : Réglages → Connecteurs.` : p.state === "disabled" ? `« ${p.name} » est désactivé : réactivez-le dans Réglages → Connecteurs.` : `« ${p.name} » est en erreur : corrigez-le et testez la connexion (Réglages → Connecteurs).`);
    return p;
  }
  const usable = list.filter((x) => x.usable);
  if (usable.length === 1) return usable[0];
  if (usable.length > 1) throw new ConnectorError("not_configured", `Plusieurs fournisseurs sont disponibles (${usable.map((u) => u.name).join(", ")}) : choisissez celui à utiliser dans Réglages → Connecteurs.`);
  throw new ConnectorError("not_configured", "Aucun connecteur n'est configuré pour cette fonction : ajoutez-en un dans Réglages → Connecteurs.");
}
// Disponibilité sans exécuter : { available, provider?, reason? } — pour griser un bouton « Rédiger avec l'IA » avec une explication vraie
function status(ctx, scope, capability) {
  try { const p = choose(ctx, scope, capability); return { available: true, provider: p.id, name: p.name }; }
  catch (e) { return { available: false, code: e.code || "unknown", reason: e.message }; }
}
async function invoke(ctx, scope, capability, rawInput, { connector = null } = {}) {
  const cap = CAPABILITIES[capability];
  if (!cap) throw new ConnectorError("unsupported", "Capacité inconnue.");
  const input = cap.validateInput(rawInput);
  const p = choose(ctx, scope, capability, connector), a = get(p.id), eff = effective(ctx, scope, a.id), row = eff.row;
  const secrets = secretsOf(ctx, a, row), missing = missingSecrets(a, secrets);
  if (missing.length) throw new ConnectorError("not_configured", `« ${a.name} » : configuration incomplète (${missing.join(", ")}).`);
  if (!takeSlot(row.id, a.limits && a.limits.perMinute || 30)) throw new ConnectorError("rate_limited", `Limite de ${a.limits && a.limits.perMinute || 30} demandes par minute atteinte pour « ${a.name} ».`, { retryable: true });
  try {
    const raw = await a.capabilities[capability]({ http: callerFor(a, secrets), config: row.config, secrets, input });
    const out = cap.validateOutput(raw);
    db.prepare("UPDATE mk_connections SET usage_count = usage_count + 1, last_used_at = datetime('now') WHERE id = ?").run(row.id);
    return { ...out, provider: a.id, source: eff.source };
  } catch (error) {
    const e = error instanceof ConnectorError ? error : new ConnectorError("unknown", "Erreur inattendue du connecteur.");
    const msg = scrub(e.message, Object.values(secrets));
    const bad = ["auth_invalid", "permission_denied", "quota_exceeded"].includes(e.code);
    db.prepare(`UPDATE mk_connections SET last_error_at = datetime('now'), last_error_code = ?, last_error_message = ?${bad ? ", state = CASE WHEN state = 'disabled' THEN 'disabled' ELSE 'error' END" : ""} WHERE id = ?`).run(e.code, msg, row.id);
    throw new ConnectorError(e.code, msg, { status: e.status, retryable: e.retryable });
  }
}
// Clé et modèle EFFECTIFS d'un connecteur pour un niveau (usage interne du serveur : ne jamais afficher ni journaliser) — sert à migrer les modules qui lisaient une variable d'environnement
function credentialsFor(ctx, scope, connector) {
  const a = get(connector), eff = effective(ctx, scope, connector);
  if (!a || !eff.row || !USABLE.has(eff.row.state)) return null;
  return { config: eff.row.config, secrets: secretsOf(ctx, a, eff.row), source: eff.source };
}

module.exports = { CATEGORIES, STATES, CODES, CAPABILITIES, ConnectorError, register, get, adapters, catalog, configure, test, setDisabled, revokeSecrets, remove, setShared, setPreference, preferences, providersFor, status, invoke, credentialsFor, effective, publicView, availability, secretKey };
