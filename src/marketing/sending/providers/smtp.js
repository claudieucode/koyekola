// Fournisseur SMTP (nodemailer et les variables SMTP_* déjà présentes). Bon pour démarrer ; peu d'événements de retour :
// seul un refus synchrone du serveur (adresse inexistante…) est connu, pas les rebonds différés.
const { SendError } = require("./errors");

const NETWORK = new Set(["ECONNECTION", "ETIMEDOUT", "ESOCKET", "ECONNRESET", "EDNS", "ECONNREFUSED", "EAI_AGAIN"]);
const AUTH = new Set([530, 534, 535]);
const RECIPIENT = new Set([550, 551, 553]);

// Un 550/551/553 ne signifie pas toujours « cette adresse n'existe pas » : « 550 5.7.1 rejeté pour réputation ou politique » vise l'EXPÉDITEUR et ne doit surtout
// pas mettre le destinataire en liste de suppression définitive. Seul le code détaillé 5.1.x (adresse du destinataire) ou un texte explicite l'établit.
const UNKNOWN_USER = /user unknown|no such user|unknown user|does not exist|invalid recipient|recipient (address )?rejected|mailbox (not found|unavailable|does not exist)|address (rejected|unknown|not found)/i;
function isRecipientProblem(error) {
  const text = String((error && (error.response || error.message)) || "");
  const enhanced = /\b5\.(\d)\.(\d{1,3})\b/.exec(text);
  if (enhanced) return enhanced[1] === "1" && enhanced[2] !== "8"; // 5.1.x = adresse du destinataire (5.1.8 = adresse de l'expéditeur)
  return UNKNOWN_USER.test(text);
}

function classify(error) {
  const code = Number(error && error.responseCode);
  if (AUTH.has(code)) return new SendError("config", { status: code });
  if (RECIPIENT.has(code)) return new SendError(isRecipientProblem(error) ? "recipient_rejected" : "permanent", { status: code });
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
