// Création du compte formateur (le vôtre) sans passer par le script de démonstration « seed »,
// qui efface toutes les données. Utilisé au démarrage (variables FORMATEUR_*) et par
// `npm run creer-formateur`.
const bcrypt = require("bcryptjs");
const db = require("./database");

const MIN_PASSWORD_LENGTH = 10;

// Crée le compte formateur, ou le met à jour si l'email existe déjà.
// Renvoie "cree" | "mis-a-jour". Lève une erreur si les informations sont invalides.
function upsertInstructor({ email, username, password }) {
  if (!email || !username || !password) throw new Error("Email, nom d'utilisateur et mot de passe sont obligatoires.");
  if (!email.includes("@")) throw new Error("L'adresse email n'est pas valide.");
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);

  const hash = bcrypt.hashSync(password, 10);
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);

  if (existing) {
    db.prepare("UPDATE users SET username = ?, password_hash = ?, role = 'formateur' WHERE id = ?").run(username, hash, existing.id);
    return "mis-a-jour";
  }
  db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'formateur')").run(username, email, hash);
  return "cree";
}

// Au démarrage : si FORMATEUR_EMAIL / FORMATEUR_USERNAME / FORMATEUR_PASSWORD sont définies
// et qu'aucun formateur n'existe encore, on le crée. Sinon on ne touche à rien.
function bootstrapInstructorFromEnv() {
  const { FORMATEUR_EMAIL: email, FORMATEUR_USERNAME: username, FORMATEUR_PASSWORD: password } = process.env;
  if (!email && !username && !password) return;

  const hasInstructor = db.prepare("SELECT 1 FROM users WHERE role = 'formateur' LIMIT 1").get();
  if (hasInstructor) {
    console.log("[KOLAKISA] Un compte formateur existe déjà : les variables FORMATEUR_* sont ignorées (vous pouvez les supprimer).");
    return;
  }

  try {
    upsertInstructor({ email, username, password });
    console.log(`[KOLAKISA] Compte formateur créé pour ${email}. Supprimez maintenant la variable FORMATEUR_PASSWORD de la configuration.`);
  } catch (err) {
    console.error(`[KOLAKISA] Compte formateur non créé : ${err.message}`);
  }
}

module.exports = { upsertInstructor, bootstrapInstructorFromEnv };
