// Notification à l'équipe : e-mail interne envoyé à des MEMBRES de l'organisation (jamais à une adresse saisie librement : aucun
// risque d'envoi à des tiers). Envoyé par la file (« automation.notify »), donc : jamais dans le passage du scénario, reprises
// automatiques si le fournisseur est momentanément indisponible, une seule fois par passage, étape et destinataire. Message
// transactionnel (« Auto-Submitted »), sans lien de désinscription : ce n'est pas du marketing.
const { UnrecoverableError } = require("../queue/worker");
const { SendError } = require("../sending/providers/errors");
const { getSendingConfig, createProviderFor } = require("../sending/config");

const FALLBACK_FROM = "KOLAKISA <no-reply@exemple.invalid>"; // fournisseur console uniquement (rien n'est envoyé)
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const memberOf = (db, organizationId, userId) => db
  .prepare("SELECT u.id, u.email FROM mk_org_members m JOIN users u ON u.id = m.user_id WHERE m.organization_id = ? AND m.user_id = ? AND u.email IS NOT NULL AND u.email <> ''")
  .get(organizationId, userId);

function buildMessage({ config, to, subject, text, automationName }) {
  const body = `${text}\n\n—\nNotification automatique du scénario « ${automationName} ».`;
  const html = `<p>${esc(text).replace(/\n/g, "<br>")}</p><p style="color:#5d6f7e;font-size:12px">Notification automatique du scénario « ${esc(automationName)} ».</p>`;
  return { from: config.from || FALLBACK_FROM, to, replyTo: config.replyTo || undefined, subject, html, text: body, headers: { "Auto-Submitted": "auto-generated" } };
}

function jobHandlers({ db, bus = null, settings, env = process.env, providerFor, log = console }) {
  return {
    "automation.notify": async (payload) => {
      const ctx = { db, organizationId: payload.organizationId, userId: null, bus, settings, tokenKey: env.ENCRYPTION_KEY, log };
      const member = memberOf(db, payload.organizationId, payload.userId);
      if (!member) throw new UnrecoverableError("Le destinataire n'est plus membre de l'équipe : notification abandonnée.");
      const message = buildMessage({ config: getSendingConfig(ctx), to: member.email, subject: payload.subject, text: payload.text, automationName: payload.automationName });
      const provider = providerFor ? providerFor(ctx) : createProviderFor(ctx);
      try {
        await provider.send({ ...message, idempotencyKey: payload.key });
      } catch (error) {
        // Indisponibilité passagère : la file réessaie ; tout le reste (adresse refusée, configuration) est définitif
        if (error instanceof SendError && (error.kind === "temporary" || error.kind === "rate_limited")) throw error;
        throw new UnrecoverableError(error instanceof SendError ? `Envoi impossible (${error.kind}).` : "Envoi impossible.");
      }
    },
  };
}

module.exports = { jobHandlers, buildMessage, memberOf };
