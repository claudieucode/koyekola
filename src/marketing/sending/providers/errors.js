// Erreur d'envoi normalisée : le TYPE décide de la suite (réessayer, abandonner, suspendre) ; le message est toujours
// générique en français, jamais le texte brut du serveur ou de l'API (qui peut contenir des identifiants ou une clé).
const MESSAGES = {
  temporary: "Erreur temporaire du serveur de messagerie : nouvelle tentative plus tard.",
  permanent: "Message refusé par le serveur de messagerie.",
  recipient_rejected: "Adresse refusée par le serveur du destinataire (elle n'existe probablement pas).",
  rate_limited: "Limite de débit du fournisseur atteinte : envoi ralenti.",
  config: "Authentification ou configuration du fournisseur d'envoi refusée : vérifiez la clé ou les identifiants.",
};

class SendError extends Error {
  constructor(kind, { retryAfterMs, status } = {}) {
    super(MESSAGES[kind] ?? MESSAGES.temporary);
    this.name = "SendError";
    this.kind = MESSAGES[kind] ? kind : "temporary";
    if (retryAfterMs !== undefined) this.retryAfterMs = retryAfterMs;
    if (status !== undefined) this.status = status; // code HTTP/SMTP : utile au diagnostic, sans données sensibles
  }
}

module.exports = { SendError };
