// Erreur d'envoi SMS normalisée, sur le modèle de SendError (e-mail) : le TYPE décide de la suite (réessayer,
// abandonner, suspendre) ; le message est toujours générique, jamais le texte brut de l'API (qui peut contenir un numéro).
const MESSAGES = {
  temporary: "Erreur temporaire du fournisseur de SMS : nouvelle tentative plus tard.",
  permanent: "SMS refusé par le fournisseur.",
  recipient_rejected: "Numéro refusé par le fournisseur (inexistant, fixe ou non joignable par SMS).",
  opted_out: "Ce numéro a demandé à ne plus recevoir de SMS (STOP) auprès du fournisseur.",
  rate_limited: "Limite de débit du fournisseur de SMS atteinte : envoi ralenti.",
  config: "Identifiants ou réglages du fournisseur de SMS refusés : vérifiez l'identifiant de compte, le jeton, l'expéditeur et les pays autorisés.",
};

class SmsSendError extends Error {
  constructor(kind, { retryAfterMs, status, code } = {}) {
    super(MESSAGES[kind] ?? MESSAGES.temporary);
    this.name = "SmsSendError";
    this.kind = MESSAGES[kind] ? kind : "temporary";
    if (retryAfterMs !== undefined) this.retryAfterMs = retryAfterMs;
    if (status !== undefined) this.status = status; // code HTTP : utile au diagnostic, sans donnée personnelle
    if (code !== undefined) this.code = code; // code d'erreur du fournisseur (ex. Twilio 21211)
  }
}

module.exports = { SmsSendError };
