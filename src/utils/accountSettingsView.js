// Données communes des écrans « Profil et paramètres » du compte (Mon compte et Profil du formateur) : une seule source, le même moteur (services/accountProfile).
// Les messages et la saisie conservée après une erreur sont posés en session par les routes POST et lus UNE seule fois ici (jamais un mot de passe).
const db = require("../config/database");
const profile = require("../services/accountProfile");

// Écran d'où l'on vient : seules ces deux pages sont possibles (jamais de redirection ouverte)
const PAGES = ["/mon-compte", "/formateur/profil"];
function returnTo(req, anchor) {
  let path = "/mon-compte";
  try { const p = new URL(req.get("referer") || "", "http://x.invalid").pathname.replace(/\/+$/, ""); if (PAGES.includes(p)) path = p; } catch { /* référent absent ou illisible */ }
  return `${path}${anchor ? `#${anchor}` : ""}`;
}

function settingsData(req) {
  const id = req.session.user.id;
  const form = req.session.accountForm || null; delete req.session.accountForm;
  const flash = req.session.accountFlash || null; delete req.session.accountFlash;
  const account = db.prepare("SELECT id, username, email, role, created_at, email_verified_at FROM users WHERE id = ?").get(id);
  const p = profile.profileOf(id);
  const v = form && form.section === "profile" ? form.values : {};
  const merged = { ...p, firstName: v.first_name ?? p.firstName, lastName: v.last_name ?? p.lastName, nickname: v.nickname ?? (p.nickname || p.username), website: v.website ?? p.website, bio: v.bio ?? p.bio };
  return {
    account, p: merged, errors: form ? form.errors : {}, formSection: form ? form.section : "", emailValue: form && form.section === "email" ? form.values.email : "",
    displayOptions: profile.displayOptions(merged), sessions: profile.sessionsOf(id, req.sessionID), maxBio: profile.MAX_BIO, minPassword: profile.MIN_PASSWORD, flash,
  };
}
module.exports = { settingsData, returnTo };
