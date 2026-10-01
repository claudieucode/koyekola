// Erreur métier du module marketing : un code stable (pour les tests, l'API, l'interface) + un message en français.
class MarketingError extends Error {
  constructor(code, message, detail) {
    super(message);
    this.name = "MarketingError";
    this.code = code;
    if (detail) this.detail = detail; // détail technique facultatif, affiché replié sous le message
  }
}
module.exports = { MarketingError };
