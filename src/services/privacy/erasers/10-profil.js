// Profil du compte (nom d'utilisateur et e-mail conservés : le COMPTE n'est pas supprimé ici, c'est une opération distincte).
const { count } = require("./_kit");
const { removeUploadedFile } = require("../../../utils/uploads");

const userOf = (env, s) => env.db.prepare("SELECT * FROM users WHERE deleted_at IS NULL AND (id = ? OR lower(email) = ?) ORDER BY id = ? DESC LIMIT 1").get(s.userId ?? -1, s.email || "", s.userId ?? -1) || null;

module.exports = {
  id: "profile", order: 10, scope: "main",
  title: "Profil du compte",
  description: "Présentation (bio), photo de profil, fuseau horaire et demandes de réinitialisation de mot de passe d'un compte d'élève.",
  categories: ["Profil", "Photo", "Réinitialisations de mot de passe"],
  preview(env, s) {
    const u = userOf(env, s);
    if (!u) return { erase: 0, anonymize: 0, retained: [], manual: [] };
    if (u.role !== "etudiant") return { erase: 0, anonymize: 0, retained: [], manual: [{ label: "Compte de gestion", reason: `Le compte a le rôle « ${u.role} » : il porte les formations, articles et réglages du site. Son profil se modifie depuis le compte lui-même.` }] };
    const fields = (u.bio ? 1 : 0) + (u.avatar_path ? 1 : 0) + (u.timezone ? 1 : 0);
    return { erase: count(env.db, "SELECT COUNT(*) n FROM password_resets WHERE user_id = ?", u.id), anonymize: fields,
      retained: [{ label: "Nom d'utilisateur, adresse e-mail et mot de passe", reason: "Le compte reste actif : l'effacement des données et la suppression du compte sont deux opérations distinctes (la personne peut supprimer son compte depuis « Mon compte »)." }], manual: [] };
  },
  run(env, s) {
    const u = userOf(env, s);
    if (!u || u.role !== "etudiant") return { done: true, erased: 0, anonymized: 0, outcome: u ? { manual: [{ label: "Compte de gestion", reason: `Rôle « ${u.role} » : à traiter depuis le compte lui-même.` }] } : {} };
    const after = [];
    let anonymized = 0;
    if (u.bio || u.avatar_path || u.timezone) {
      env.db.prepare("UPDATE users SET bio = '', avatar_path = NULL, timezone = '' WHERE id = ?").run(u.id);
      anonymized = (u.bio ? 1 : 0) + (u.avatar_path ? 1 : 0) + (u.timezone ? 1 : 0);
      if (u.avatar_path) after.push(() => removeUploadedFile(u.avatar_path, "effacement de données"));
    }
    const erased = Number(env.db.prepare("DELETE FROM password_resets WHERE user_id = ?").run(u.id).changes) || 0;
    return { done: true, erased, anonymized, after, outcome: { retained: [{ label: "Nom d'utilisateur, adresse e-mail, mot de passe et rôle", reason: "Le compte n'est pas supprimé (opération distincte, à la demande de la personne)." }] } };
  },
};
