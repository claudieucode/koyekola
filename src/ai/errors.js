// Erreurs NORMALISÉES du Kolakisa AI Core. Un code stable, un message sûr en français (jamais de secret, jamais le texte envoyé),
// et deux indicateurs qui commandent les réessais :
//   possiblyBilled : le fournisseur a PEUT-ÊTRE traité (donc facturé) la demande → jamais de réessai ni de basculement automatique ;
//   retryable      : l'échec est survenu AVANT tout traitement (limite de débit, service saturé) → un réessai contrôlé est permis.
const { scrub } = require("../services/connectors/errors");

const CODES = Object.freeze({
  invalid_request: { text: "Requête invalide", billed: false },
  not_authorized: { text: "Action non autorisée", billed: false },
  ai_disabled: { text: "Fonctions IA désactivées", billed: false },
  provider_not_configured: { text: "Fournisseur non configuré", billed: false },
  provider_unknown: { text: "Fournisseur inconnu", billed: false },
  model_unknown: { text: "Modèle inconnu ou non autorisé", billed: false },
  no_compatible_model: { text: "Aucun modèle compatible", billed: false },
  quota_exceeded: { text: "Limite d'utilisation atteinte", billed: false },
  cost_unverified: { text: "Tarif non vérifié", billed: false },
  duplicate_request: { text: "Requête déjà exécutée", billed: false },
  circuit_open: { text: "Fournisseur mis en pause", billed: false, retryable: true },
  auth_invalid: { text: "Clé du fournisseur refusée", billed: false },
  provider_quota: { text: "Crédit ou quota du fournisseur épuisé", billed: false },
  rate_limited: { text: "Limite de débit du fournisseur", billed: false, retryable: true },
  model_unavailable: { text: "Modèle indisponible chez le fournisseur", billed: false },
  provider_unavailable: { text: "Fournisseur indisponible", billed: true },
  provider_overloaded: { text: "Fournisseur saturé", billed: false, retryable: true },
  timeout: { text: "Délai dépassé", billed: true },
  network: { text: "Interruption réseau", billed: true },
  malformed_response: { text: "Réponse illisible ou non conforme", billed: true },
  empty_response: { text: "Réponse vide", billed: true },
  refused: { text: "Demande refusée par le fournisseur", billed: false },
  unknown: { text: "Erreur inattendue", billed: true },
});

class AiError extends Error {
  constructor(code, message, extra = {}) {
    const known = Object.hasOwn(CODES, code) ? code : "unknown";
    // scrub retire les clés connues ; on masque aussi les clés « partiellement masquées » que certains fournisseurs recopient (sk-test-****3456)
    super(scrub(message || CODES[known].text).replace(/\b(sk|key|AIza)[A-Za-z0-9_-]*-?\**[A-Za-z0-9*_-]{4,}/g, (m) => (/\*|^sk-/.test(m) ? "[clé masquée]" : m)).slice(0, 400));
    this.name = "AiError";
    this.code = known;
    this.retryable = Boolean(CODES[known].retryable);
    this.possiblyBilled = CODES[known].billed;
    Object.assign(this, extra);
  }
  toJSON() { return { code: this.code, message: this.message, retryable: this.retryable, possiblyBilled: this.possiblyBilled }; }
}

// ConnectorError (couche réseau commune aux connecteurs) → AiError. Aucune fausse précision : tout ce qui n'est pas reconnu devient « unknown », réputé facturé.
function fromConnector(error, secrets = []) {
  if (error instanceof AiError) return error;
  const code = error && error.code, status = error && error.status;
  const msg = scrub(error && error.message, secrets);
  if (code === "auth_invalid" || code === "permission_denied") return new AiError("auth_invalid", msg);
  if (code === "quota_exceeded") return new AiError("provider_quota", msg);
  if (code === "rate_limited") return new AiError("rate_limited", msg);
  if (code === "model_not_found") return new AiError("model_unavailable", msg);
  if (code === "unavailable") return status === 503 || status === 529 ? new AiError("provider_overloaded", msg) : new AiError("provider_unavailable", msg);
  if (code === "timeout") return new AiError("timeout", msg);
  if (code === "network") return new AiError("network", msg);
  if (code === "invalid_response" || code === "response_too_large") return new AiError("malformed_response", msg);
  if (code === "bad_request") return new AiError("refused", msg);
  if (code === "not_configured" || code === "disabled" || code === "unavailable_here") return new AiError("provider_not_configured", msg);
  if (code === "blocked_destination") return new AiError("provider_unavailable", msg, { possiblyBilled: false });
  return new AiError("unknown", msg);
}
module.exports = { AiError, CODES, fromConnector };
