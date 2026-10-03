// Fournisseur SMS « console » : n'envoie RIEN. Réglage par défaut, pour les essais et tant que Twilio n'est pas branché.
// Le journal ne montre jamais le numéro entier.
const { maskPhone } = require("../phone");

function createConsoleSmsProvider({ log = console } = {}) {
  const sent = [];
  return {
    name: "console",
    capabilities: { statusCallbacks: false, inbound: false },
    sent,
    async send(message) {
      sent.push({ ...message });
      log.log?.(`[KOLAKISA] (SMS console : rien n'est envoyé) SMS de ${String(message.body).length} caractères pour ${maskPhone(message.to)}`);
      return { providerMessageId: `console-sms-${sent.length}` };
    },
  };
}

module.exports = { createConsoleSmsProvider };
