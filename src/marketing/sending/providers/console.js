// Fournisseur « console » : n'envoie RIEN. Pour le développement, les essais et tant qu'aucun vrai fournisseur n'est choisi.
function createConsoleProvider({ log = console } = {}) {
  const sent = [];
  return {
    name: "console",
    capabilities: { webhooks: false, idempotency: false },
    sent,
    async send(message) {
      sent.push({ ...message });
      log.log?.(`[KOYEKOLA] (fournisseur console : rien n'est envoyé) message « ${String(message.subject).slice(0, 60)} » pour ${message.to}`);
      return { providerMessageId: `console-${sent.length}` };
    },
  };
}
module.exports = { createConsoleProvider };
