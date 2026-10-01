// Fournisseur SMTP (nodemailer et les variables SMTP_* déjà présentes). Bon pour démarrer ; peu d'événements de retour :
// seul un refus synchrone du serveur (adresse inexistante…) est connu, pas les rebonds différés.
const { SendError } = require("./errors");

const NETWORK = new Set(["ECONNECTION", "ETIMEDOUT", "ESOCKET", "ECONNRESET", "EDNS", "ECONNREFUSED", "EAI_AGAIN"]);
const AUTH = new Set([530, 534, 535]);
const RECIPIENT = new Set([550, 551, 553]);

function classify(error) {
  const code = Number(error && error.responseCode);
  if (AUTH.has(code)) return new SendError("config", { status: code });
  if (RECIPIENT.has(code)) return new SendError("recipient_rejected", { status: code });
  if (code >= 400 && code < 500) return new SendError("temporary", { status: code });
  if (code >= 500 && code < 600) return new SendError("permanent", { status: code });
  if (error && NETWORK.has(error.code)) return new SendError("temporary");
  return new SendError("temporary");
}

function createSmtpProvider({ transport }) {
  if (!transport) throw new Error("Le transport SMTP n'est pas configuré : renseignez SMTP_HOST (et SMTP_PORT, SMTP_USER, SMTP_PASS) dans la configuration du serveur.");
  return {
    name: "smtp",
    capabilities: { webhooks: false, idempotency: false },
    async send(message) {
      try {
        const info = await transport.sendMail({
          from: message.from, to: message.to, replyTo: message.replyTo || undefined, subject: message.subject,
          html: message.html, text: message.text, headers: message.headers,
        });
        return { providerMessageId: String((info && info.messageId) || "") || `smtp-${Date.now()}` };
      } catch (error) {
        throw classify(error);
      }
    },
  };
}
module.exports = { createSmtpProvider };
