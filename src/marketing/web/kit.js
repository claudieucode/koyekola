// Outils communs aux routes d'administration : exécution d'une action avec message flash, contrôle de permission.
const { MarketingError } = require("../errors");

// Exécute une action d'écriture : un message de réussite (texte renvoyé) ou l'erreur métier en message flash, puis redirection
function attempt(req, res, next, back, action) {
  try {
    // L'action renvoie un texte, ou { text, detail } quand un détail technique (replié à l'affichage) l'accompagne
    const message = action();
    if (message) req.session.mkFlash = typeof message === "string" ? { type: "ok", text: message } : { type: "ok", text: message.text, detail: message.detail };
  } catch (error) {
    if (!(error instanceof MarketingError)) return next(error);
    req.session.mkFlash = { type: "error", text: error.message, detail: error.detail };
  }
  res.redirect(typeof back === "function" ? back() : back);
}

const need = (permission) => (req, res, next) => {
  if (req.mk.can(permission)) return next();
  res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
};

const flashError = (req, text) => { req.session.mkFlash = { type: "error", text }; };
const flashOk = (req, text) => { req.session.mkFlash = { type: "ok", text }; };

// Données intégrées dans une balise <script type="application/json"> : « < » et les séparateurs de ligne sont échappés,
// aucune valeur (nom de modèle, libellé…) ne peut donc fermer la balise ni injecter du HTML.
const safeJson = (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(new RegExp("\\u2028", "g"), "\\u2028").replace(new RegExp("\\u2029", "g"), "\\u2029");

module.exports = { attempt, need, flashError, flashOk, safeJson };
