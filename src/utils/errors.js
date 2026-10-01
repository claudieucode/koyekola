// Erreur dont le message est destiné à l'utilisateur (validation, fichier refusé…).
// Toute autre erreur est considérée comme technique : journalisée côté serveur, jamais affichée.
class UserError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "UserError";
    this.status = status;
  }
}

module.exports = { UserError };
