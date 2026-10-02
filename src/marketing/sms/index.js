// Canal SMS du module marketing (point d'entrée unique) : numéros, longueur/segments, heures de silence, réglages,
// consentement et suppression, fournisseurs, SMS de test.
module.exports = {
  ...require("./phone"), ...require("./text"), ...require("./quiet"), ...require("./config"), ...require("./consent"),
  ...require("./testSend"), ...require("./providers"), ...require("./render"), ...require("./campaigns"),
  ...require("./tracking"), ...require("./webhooks"),
};
