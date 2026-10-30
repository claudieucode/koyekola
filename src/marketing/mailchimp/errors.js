// Erreurs de l'intégration Mailchimp : toujours un code stable, un message FRANÇAIS actionnable pour l'utilisateur, jamais un secret.
// `detail` garde le texte technique renvoyé par Mailchimp (en anglais) pour le diagnostic.
class MailchimpError extends Error {
  constructor(code, message, { status = 0, detail = "", fields = [], retryable = false } = {}) {
    super(message);
    this.name = "MailchimpError";
    this.code = code;
    this.status = status;
    this.detail = detail;
    this.fields = fields;
    this.retryable = retryable;
  }
}

// Code HTTP de Mailchimp → code et message français. 403 : Mailchimp répond aussi 403 pour une clé invalide ou révoquée.
function fromResponse(status, body) {
  const problem = body && typeof body === "object" ? body : {};
  const detail = String(problem.detail || problem.title || "").slice(0, 500);
  const fields = Array.isArray(problem.errors) ? problem.errors.slice(0, 20).map((e) => ({ field: String(e.field || ""), message: String(e.message || "").slice(0, 300) })) : [];
  const title = String(problem.title || "");
  if (status === 401 || (status === 403 && /api key|invalid/i.test(`${title} ${detail}`))) return new MailchimpError("auth_invalid", "La clé d'API Mailchimp est refusée (invalide ou révoquée). Générez une nouvelle clé dans Mailchimp → Compte → Extras → Clés d'API, puis enregistrez-la ici.", { status, detail });
  if (status === 403) return new MailchimpError("forbidden", "Mailchimp refuse cette action pour ce compte (droits ou offre insuffisants). Vérifiez le rôle de l'utilisateur Mailchimp et votre offre.", { status, detail });
  if (status === 404) return new MailchimpError("not_found", "Élément introuvable chez Mailchimp : il a peut-être été supprimé. Relancez une synchronisation.", { status, detail });
  if (status === 429) return new MailchimpError("rate_limited", "Mailchimp limite le nombre de requêtes simultanées. L'opération sera réessayée automatiquement ; patientez quelques instants.", { status, detail, retryable: true });
  if (status === 400 || status === 422) {
    const first = fields[0] ? ` Champ « ${fields[0].field || "?"} » : ${fields[0].message}` : "";
    const exists = /already a list member|is already|Member Exists/i.test(`${title} ${detail}`);
    if (exists) return new MailchimpError("member_exists", "Ce contact est déjà présent dans l'audience Mailchimp.", { status, detail, fields });
    if (/compliance state|forgotten|permanently deleted/i.test(`${title} ${detail}`)) return new MailchimpError("compliance_state", "Mailchimp refuse de réabonner cette adresse (elle s'est désabonnée ou a été supprimée définitivement). Elle doit se réinscrire elle-même via un formulaire Mailchimp.", { status, detail, fields });
    return new MailchimpError("invalid_request", `Mailchimp a refusé la demande (données invalides).${first || (detail ? ` ${detail}` : "")}`, { status, detail, fields });
  }
  if (status === 405 || status === 414) return new MailchimpError("invalid_request", "Demande non acceptée par Mailchimp.", { status, detail });
  if (status >= 500) return new MailchimpError("server_error", "Mailchimp est momentanément indisponible. Réessayez dans quelques minutes.", { status, detail, retryable: true });
  return new MailchimpError("unknown", `Réponse inattendue de Mailchimp (code ${status}).`, { status, detail });
}

module.exports = { MailchimpError, fromResponse };
