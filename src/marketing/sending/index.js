// Envoi : fournisseurs, configuration, campagnes, contrôle avant envoi, lancement et envoi par lots.
module.exports = {
  ...require("./campaigns"), ...require("./list"), ...require("./audience"), ...require("./dispatch"), ...require("./events"), ...require("./builder"), ...require("./tracking"), ...require("./stats"), applyProviderEvent: require("./webhooks").applyEvent,
};
