// Conformité : consentement, désinscription, suppression, préférences (le point d'entrée unique du module).
module.exports = { ...require("./consent"), ...require("./suppression"), ...require("./preferences"), ...require("./sendable") };
