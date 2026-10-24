// Erreurs NORMALISÉES des connecteurs : un code stable (testable, affichable), un message sûr (jamais de secret) et un indicateur de nouvelle tentative utile.
const CODES = Object.freeze({
  not_configured: "Configuration incomplète", disabled: "Connecteur désactivé", unavailable_here: "Connecteur indisponible ici",
  auth_invalid: "Identifiants refusés", permission_denied: "Permissions insuffisantes", quota_exceeded: "Quota ou crédit épuisé", rate_limited: "Trop de demandes",
  model_not_found: "Modèle introuvable", bad_request: "Demande refusée", unavailable: "Service indisponible", timeout: "Délai dépassé", network: "Réseau injoignable",
  response_too_large: "Réponse trop volumineuse", invalid_response: "Réponse illisible", blocked_destination: "Destination non autorisée", unsupported: "Fonction non prise en charge", unknown: "Erreur inconnue",
});
class ConnectorError extends Error {
  constructor(code, message, { status = null, retryable = false } = {}) {
    super(String(message || CODES[code] || CODES.unknown).slice(0, 400));
    this.name = "ConnectorError"; this.code = Object.hasOwn(CODES, code) ? code : "unknown"; this.status = status; this.retryable = retryable;
  }
}
// Retire des textes tout secret connu et les formes courantes de clés (sk-…, AIza…, Bearer …) : appelé avant TOUT enregistrement ou affichage d'un message venu d'un fournisseur
function scrub(text, secrets = []) {
  let out = String(text ?? "");
  for (const s of secrets) if (typeof s === "string" && s.length >= 6) out = out.split(s).join("[secret masqué]");
  return out.replace(/\bsk-[A-Za-z0-9_-]{8,}/g, "[clé masquée]").replace(/\bAIza[0-9A-Za-z_-]{10,}/g, "[clé masquée]").replace(/Bearer\s+[A-Za-z0-9._~+/=-]{8,}/gi, "Bearer [masqué]").slice(0, 400);
}
module.exports = { ConnectorError, CODES, scrub };
