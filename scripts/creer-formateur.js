// Crée (ou met à jour) le compte formateur : npm run creer-formateur -- email pseudo motdepasse
// Contrairement à `npm run seed`, n'efface rien.
require("dotenv").config();
const { upsertInstructor } = require("../src/config/bootstrap");

const [email, username, password] = process.argv.slice(2);
try {
  const result = upsertInstructor({ email, username, password });
  console.log(result === "cree" ? `Compte formateur créé pour ${email}.` : `Compte ${email} mis à jour (formateur, nouveau mot de passe).`);
} catch (err) {
  console.error(`Erreur : ${err.message}`);
  console.error("Usage : npm run creer-formateur -- email pseudo motdepasse   (mot de passe : 10 caractères minimum)");
  process.exit(1);
}
