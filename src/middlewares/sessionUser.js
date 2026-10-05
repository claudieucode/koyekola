// Session revérifiée à chaque requête : le compte est relu en base, au lieu de faire confiance à la copie
// gardée dans la session pendant 30 jours.
// - compte supprimé → session fermée ;
// - mot de passe changé (réinitialisation…) → toutes les autres sessions de ce compte sont fermées ;
// - rôle, nom ou e-mail modifiés → pris en compte tout de suite.
const crypto = require("crypto");
const db = require("../config/database");

// Empreinte courte du hachage du mot de passe : change dès que le mot de passe change. Gardée à part
// (req.session.pwStamp) pour ne jamais se retrouver dans currentUser, transmis aux vues.
function passwordStamp(hash) {
  return crypto.createHash("sha256").update(String(hash || "")).digest("base64url").slice(0, 22);
}

// Ouvre une session neuve pour ce compte (nouvel identifiant de session : protège contre la fixation de session)
function openSession(req, user, done) {
  req.session.regenerate((error) => {
    if (error) return done(error);
    req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role };
    req.session.pwStamp = passwordStamp(user.password_hash);
    done();
  });
}

function refreshSessionUser(req, res, next) {
  const current = req.session && req.session.user;
  if (!current) return next();
  const row = db.prepare("SELECT id, username, email, role, password_hash FROM users WHERE id = ?").get(current.id);
  const stamp = row && passwordStamp(row.password_hash);
  if (!row || (req.session.pwStamp && req.session.pwStamp !== stamp)) {
    // Session périmée : remplacée par une session vide (la personne est déconnectée)
    return req.session.regenerate((error) => next(error));
  }
  // Sessions ouvertes avant cette vérification : l'empreinte est posée maintenant
  if (!req.session.pwStamp) req.session.pwStamp = stamp;
  // Modifiée seulement si besoin : une session inchangée n'est pas réécrite en base
  if (current.username !== row.username || current.email !== row.email || current.role !== row.role) {
    req.session.user = { id: row.id, username: row.username, email: row.email, role: row.role };
  }
  next();
}

module.exports = { refreshSessionUser, openSession, passwordStamp };
