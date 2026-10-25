// Journal d'activité (voir la table audit_log) : enregistre les opérations importantes du site.
//  - record() ne lève JAMAIS d'erreur : la journalisation ne doit pas faire échouer l'action qu'elle décrit ;
//  - les valeurs sensibles (mots de passe, jetons, clés…) sont masquées avant l'écriture, les détails trop gros tronqués ;
//  - en écriture seule : aucune fonction de modification ou de suppression n'existe ici (et la base les refuse).
const db = require("../config/database");

const ACTION = /^[a-z][a-z_]*\.[a-z][a-z_]*$/;
// « pass » seul = mot de passe ; « pass_percentage » (seuil d'un quiz) n'est PAS un secret
const SENSITIVE = /(password|passwd|passphrase|secret|token|api[_-]?key|authorization|cookie|signature|encryption|^pass$)/i;
const MAX_DETAILS = 4096;

function redact(value, depth = 0) {
  if (depth > 5) return "[profondeur maximale]";
  if (Array.isArray(value)) return value.slice(0, 50).map((v) => redact(v, depth + 1));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SENSITIVE.test(k) ? "[masqué]" : redact(v, depth + 1)]));
  return value;
}
function serialize(details) {
  try {
    const json = JSON.stringify(redact(details ?? {}));
    return json.length > MAX_DETAILS ? JSON.stringify({ _tronque: true, _taille: json.length }) : json;
  } catch {
    return JSON.stringify({ _illisible: true });
  }
}

// actor : req (Express) ou { id, name }. → l'identifiant de l'entrée, ou null si l'écriture a échoué
function record(actor, spec) {
  try {
    const { action, resourceType, resourceId = null, summary, details = {}, result = "ok" } = spec || {};
    if (!ACTION.test(String(action)) || !resourceType || !summary) return null;
    const user = actor && actor.session ? actor.session.user : actor;
    const ip = actor && actor.ip ? String(actor.ip).slice(0, 64) : null;
    return Number(db.prepare("INSERT INTO audit_log (actor_id, actor_name, action, resource_type, resource_id, summary, details, result, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(user ? user.id ?? null : null, user ? String(user.username || user.name || "").slice(0, 80) : "", action, String(resourceType).slice(0, 40), resourceId == null ? null : String(resourceId).slice(0, 80),
        String(summary).slice(0, 300), serialize(details), result === "refused" || result === "error" ? result : "ok", ip).lastInsertRowid);
  } catch (error) {
    console.error("[KOLAKISA] Journal d'activité non écrit :", error.message);
    return null;
  }
}

const LIKE = (v) => `%${String(v).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
// Filtres : type (préfixe d'action, ex. « course »), q (texte libre), page. → { rows, total }
function list({ type = "", q = "", result = "", from = "", to = "", limit = 50, offset = 0 } = {}) {
  const where = [], args = [];
  if (/^[a-z_]{1,30}$/.test(type)) { where.push("action LIKE ? ESCAPE '\\'"); args.push(`${type}.%`); }
  if (RESULTS[result]) { where.push("result = ?"); args.push(result); }
  if (from) { where.push("at >= ?"); args.push(from); }
  if (to) { where.push("at < ?"); args.push(to); }
  const text = String(q || "").trim().slice(0, 80);
  if (text) { where.push("(summary LIKE ? ESCAPE '\\' OR actor_name LIKE ? ESCAPE '\\' OR action LIKE ? ESCAPE '\\')"); args.push(LIKE(text), LIKE(text), LIKE(text)); }
  const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
  return {
    total: db.prepare(`SELECT COUNT(*) n FROM audit_log ${w}`).get(...args).n,
    rows: db.prepare(`SELECT * FROM audit_log ${w} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...args, limit, offset).map((r) => ({ ...r, details: safeParse(r.details) })),
  };
}
const safeParse = (t) => { try { return JSON.parse(t); } catch { return {}; } };
const TYPES = { course: "Formations", offer: "Offres", coupon: "Codes promo", certificate: "Certificats", quiz: "Quiz", order: "Commandes", category: "Catégories", tools: "Outils (exports, données personnelles)" };
const RESULTS = { ok: "Réussi", refused: "Refusé", error: "Erreur" };

module.exports = { record, list, TYPES, RESULTS };
