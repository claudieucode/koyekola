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
    req.session.device = require("../services/accountProfile").deviceOf(req.get("user-agent")); // « Chrome sur macOS » : affiché dans Comptes → Profil → Sessions
    db.prepare("UPDATE users SET last_login_at = datetime('now'), last_seen_at = datetime('now') WHERE id = ?").run(user.id);
    done();
  });
}

function refreshSessionUser(req, res, next) {
  const current = req.session && req.session.user;
  if (!current) return next();
  const row = db.prepare("SELECT id, username, email, role, password_hash, status, last_seen_at FROM users WHERE id = ?").get(current.id);
  const stamp = row && passwordStamp(row.password_hash);
  // Compte suspendu ou désactivé (CMS → Utilisateurs) : la session est fermée à la requête suivante, sans attendre son expiration
  if (!row || (row.status && row.status !== "active") || (req.session.pwStamp && req.session.pwStamp !== stamp)) {
    // Session périmée : remplacée par une session vide (la personne est déconnectée)
    return req.session.regenerate((error) => next(error));
  }
  // Sessions ouvertes avant cette vérification : l'empreinte est posée maintenant
  if (!req.session.pwStamp) req.session.pwStamp = stamp;
  // Modifiée seulement si besoin : une session inchangée n'est pas réécrite en base
  if (current.username !== row.username || current.email !== row.email || current.role !== row.role) {
    req.session.user = { id: row.id, username: row.username, email: row.email, role: row.role };
  }
  // Dernière activité (CMS → Utilisateurs) : écrite au plus toutes les 5 minutes, jamais à chaque page
  if (!row.last_seen_at || Date.now() - Date.parse(`${String(row.last_seen_at).replace(" ", "T")}Z`) > 5 * 60 * 1000) db.prepare("UPDATE users SET last_seen_at = datetime('now') WHERE id = ?").run(row.id);
  next();
}

module.exports = { refreshSessionUser, openSession, passwordStamp };
