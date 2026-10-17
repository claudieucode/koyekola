// Journal d'audit : qui a fait quoi, sur quelle ressource, quand. En écriture seule (voir la migration 001).
// Les valeurs sensibles (mots de passe, jetons, clés…) sont masquées avant l'écriture ; des métadonnées trop
// volumineuses sont tronquées : la journalisation ne doit jamais faire échouer l'action qu'elle décrit.
const ACTION = /^[a-z][a-z_]*\.[a-z][a-z_]*$/;
const RESOURCE = /^[a-z][a-z_]*$/;
const SENSITIVE = /(pass(word)?|secret|token|api[_-]?key|authorization|cookie|signature|encryption)/i;
const MAX_METADATA = 8192;

function redact(value, depth = 0) {
  if (depth > 6) return "[profondeur maximale]";
  if (Array.isArray(value)) return value.slice(0, 100).map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SENSITIVE.test(k) ? "[masqué]" : redact(v, depth + 1)]));
  }
  return value;
}

function serialize(metadata) {
  try {
    const json = JSON.stringify(redact(metadata ?? {}));
    return json.length > MAX_METADATA ? JSON.stringify({ _tronque: true, _taille: json.length }) : json;
  } catch {
    return JSON.stringify({ _illisible: true });
  }
}

// R7 (lot 4, migration 082) — site de l'événement. Jamais lu d'une requête : trois sources SERVEUR, dans cet ordre, toujours revalidées (site de la MÊME organisation) :
//   1. `siteId` explicite d'un appelant interne (ex. clé d'API de site, accès à un site) ;
//   2. le site de la RESSOURCE concernée, relu en base (page, formulaire, contact, tunnel, composant, média, campagne, liste, segment, modèle, automatisation, site) ;
//   3. `fallbackSiteId` : le site imposé à un accès LIMITÉ (ctx.siteScope), pour les ressources dont le site n'est pas relisible.
// Sinon NULL (organisation, site principal, inconnu) : un appel historique sans site reste sans site.
const SITE_OF = Object.freeze({
  landing: ["mk_landing_pages", "site_id"], form: ["mk_forms", "site_id"], contact: ["mk_contacts", "origin_site_id"], funnel: ["mk_funnels", "site_id"],
  component: ["mk_web_components", "site_id"], media: ["mk_media", "site_id"], campaign: ["mk_campaigns", "site_id"], list: ["mk_lists", "site_id"],
  segment: ["mk_segments", "site_id"], template: ["mk_templates", "site_id"], automation: ["mk_automations", "site_id"],
});
const validSite = (db, organizationId, siteId) => {
  if (!Number.isInteger(siteId) || siteId < 1) return null;
  try { return db.prepare("SELECT id FROM mk_sites WHERE id = ? AND organization_id = ?").get(siteId, organizationId) ? siteId : null; } catch { return null; }
};
function siteOfResource(db, organizationId, resourceType, resourceId) {
  if (resourceType === "site") { const id = Number(resourceId); return { known: Number.isInteger(id), siteId: validSite(db, organizationId, id) }; }
  const def = Object.hasOwn(SITE_OF, resourceType) ? SITE_OF[resourceType] : null;
  const id = Number(resourceId);
  if (!def || resourceId === null || !Number.isInteger(id)) return { known: false, siteId: null };
  try {
    const row = db.prepare(`SELECT ${def[1]} AS s FROM ${def[0]} WHERE id = ? AND organization_id = ?`).get(id, organizationId);
    return row ? { known: true, siteId: validSite(db, organizationId, row.s) } : { known: false, siteId: null };
  } catch { return { known: false, siteId: null }; } // table absente (base d'essai) : site inconnu
}

function recordAudit(db, { organizationId, userId = null, action, resourceType, resourceId = null, metadata = {}, siteId, fallbackSiteId } = {}) {
  if (!Number.isInteger(organizationId) || organizationId < 1) throw new Error("Identifiant d'organisation invalide.");
  if (typeof action !== "string" || !ACTION.test(action)) throw new Error("Action d'audit invalide (format attendu : ressource.action, ex. campaign.created).");
  if (typeof resourceType !== "string" || !RESOURCE.test(resourceType)) throw new Error("Type de ressource d'audit invalide.");
  let site = validSite(db, organizationId, siteId);
  if (site === null) {
    const d = siteOfResource(db, organizationId, resourceType, resourceId);
    site = d.known ? d.siteId : validSite(db, organizationId, fallbackSiteId);
  }
  const info = db
    .prepare("INSERT INTO mk_audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata, site_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(organizationId, userId, action, resourceType, resourceId === null ? null : String(resourceId), serialize(metadata), site);
  return Number(info.lastInsertRowid);
}

// Politique de LECTURE (décision option C, 16/10/2026) — appliquée côté serveur, jamais d'après une valeur du client :
//   - équipe de l'organisation (aucun `siteScope`) : toutes les lignes ; `siteFilter` (entier ou « principal ») n'est qu'un filtre d'affichage ;
//   - accès LIMITÉ à un site (`siteScope`, imposé par le serveur) : UNIQUEMENT les lignes de CE site — jamais celles d'un autre site, jamais celles sans site (organisation, historique,
//     connexions, sécurité de l'organisation) ; un `siteScope` invalide (ex. -1) ne voit rien.
function scopeSql(ctx, a = "l") {
  if (ctx && ctx.siteScope !== undefined && ctx.siteScope !== null) {
    return Number.isInteger(ctx.siteScope) && ctx.siteScope > 0 ? { sql: `${a}.site_id = ?`, params: [ctx.siteScope] } : { sql: "1 = 0", params: [] };
  }
  if (ctx && ctx.siteFilter === "principal") return { sql: `${a}.site_id IS NULL`, params: [] };
  if (ctx && Number.isInteger(ctx.siteFilter)) return { sql: `${a}.site_id = ?`, params: [ctx.siteFilter] };
  return { sql: "1 = 1", params: [] };
}

// Plus récent d'abord ; pagination par « beforeId ». `scope` (le contexte de la requête) applique la politique de lecture ci-dessus.
function listAudit(db, organizationId, { limit = 50, beforeId, resourceType, resourceId, scope } = {}) {
  if (!Number.isInteger(organizationId) || organizationId < 1) throw new Error("Identifiant d'organisation invalide.");
  const clauses = ["organization_id = ?"];
  const params = [organizationId];
  if (beforeId) (clauses.push("id < ?"), params.push(Number(beforeId)));
  if (resourceType) (clauses.push("resource_type = ?"), params.push(String(resourceType)));
  if (resourceId !== undefined) (clauses.push("resource_id = ?"), params.push(String(resourceId)));
  if (scope) { const s = scopeSql(scope, "mk_audit_logs"); clauses.push(s.sql); params.push(...s.params); }
  const cap = Math.min(Math.max(Number(limit) || 50, 1), 200);
  return db
    .prepare(`SELECT * FROM mk_audit_logs WHERE ${clauses.join(" AND ")} ORDER BY id DESC LIMIT ?`)
    .all(...params, cap)
    .map((r) => ({ ...r, metadata: JSON.parse(r.metadata) }));
}

module.exports = { recordAudit, listAudit, redact, scopeSql, siteOfResource };
