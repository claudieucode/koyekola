// E-mail de test d'un modèle. Garde-fous : destinataire = MEMBRE de l'équipe uniquement (jamais une adresse libre, donc
// aucun usage comme relais), objet préfixé [TEST], liens factices (jamais un vrai lien de désinscription), en-tête de test,
// et aucune erreur du serveur de messagerie n'est renvoyée telle quelle (elle peut contenir des identifiants).
// Passe par le fournisseur choisi dans Réglages d'envoi (Resend) ou, sinon, par le SMTP du serveur.
const { validateEmail } = require("../audience/email");
const { checkCtx, audit, MarketingError } = require("../audience/shared");
const templates = require("./index");
const { SAMPLE_URLS } = require("./context");

function teamRecipients(ctx) {
  checkCtx(ctx);
  return ctx.db
    .prepare("SELECT DISTINCT lower(u.email) AS email FROM mk_org_members m JOIN users u ON u.id = m.user_id WHERE m.organization_id = ? ORDER BY email")
    .all(ctx.organizationId)
    .map((r) => r.email)
    .filter((email) => validateEmail(email).ok);
}

// Canal : `provider` (fournisseur choisi dans Réglages d'envoi, ex. Resend : interface send()) ou `transport` (SMTP)
async function sendTestEmail(ctx, templateId, { to, transport, provider, from, contactId, log = console } = {}) {
  checkCtx(ctx);
  const check = typeof to === "string" ? validateEmail(to) : { ok: false };
  if (!check.ok || !teamRecipients(ctx).includes(check.email)) {
    throw new MarketingError("invalid_recipient", "L'e-mail de test ne peut être envoyé qu'à un membre de l'équipe marketing.");
  }
  const rendered = templates.renderTemplate(ctx, templateId, contactId ? { id: contactId } : null, { urls: SAMPLE_URLS });
  if (!transport && !provider) return { sent: false, reason: "smtp_not_configured" };
  const message = { from, to: check.email, subject: `[TEST] ${rendered.subject}`, html: rendered.html, text: rendered.text, headers: { "X-KOYEKOLA-Test": "1" } };
  try {
    if (provider) await provider.send(message);
    else await transport.sendMail(message);
  } catch (error) {
    log.error("[KOYEKOLA] Échec de l'envoi de l'e-mail de test (code :", String(error && (error.code || error.responseCode || error.name)), ")");
    return { sent: false, reason: "send_error" };
  }
  audit(ctx, "template.test_sent", "template", templateId, { personalized: Boolean(contactId) });
  return { sent: true, to: check.email };
}

module.exports = { sendTestEmail, teamRecipients };
