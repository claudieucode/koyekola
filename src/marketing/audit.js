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

function recordAudit(db, { organizationId, userId = null, action, resourceType, resourceId = null, metadata = {} }) {
  if (!Number.isInteger(organizationId) || organizationId < 1) throw new Error("Identifiant d'organisation invalide.");
  if (typeof action !== "string" || !ACTION.test(action)) throw new Error("Action d'audit invalide (format attendu : ressource.action, ex. campaign.created).");
  if (typeof resourceType !== "string" || !RESOURCE.test(resourceType)) throw new Error("Type de ressource d'audit invalide.");
  const info = db
    .prepare("INSERT INTO mk_audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata) VALUES (?, ?, ?, ?, ?, ?)")
    .run(organizationId, userId, action, resourceType, resourceId === null ? null : String(resourceId), serialize(metadata));
  return Number(info.lastInsertRowid);
}

// Plus récent d'abord ; pagination par « beforeId »
function listAudit(db, organizationId, { limit = 50, beforeId, resourceType, resourceId } = {}) {
  if (!Number.isInteger(organizationId) || organizationId < 1) throw new Error("Identifiant d'organisation invalide.");
  const clauses = ["organization_id = ?"];
  const params = [organizationId];
  if (beforeId) (clauses.push("id < ?"), params.push(Number(beforeId)));
  if (resourceType) (clauses.push("resource_type = ?"), params.push(String(resourceType)));
  if (resourceId !== undefined) (clauses.push("resource_id = ?"), params.push(String(resourceId)));
  const cap = Math.min(Math.max(Number(limit) || 50, 1), 200);
  return db
    .prepare(`SELECT * FROM mk_audit_logs WHERE ${clauses.join(" AND ")} ORDER BY id DESC LIMIT ?`)
    .all(...params, cap)
    .map((r) => ({ ...r, metadata: JSON.parse(r.metadata) }));
}

module.exports = { recordAudit, listAudit, redact };
