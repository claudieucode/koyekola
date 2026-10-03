// Vérifie la configuration SMTP (variables SMTP_* du fichier .env ou de l'hébergeur) et envoie un e-mail de test.
//   npm run test-email -- adresse@exemple.com
// Affiche un diagnostic clair en français ; n'affiche jamais le mot de passe SMTP.
require("dotenv").config();
const { buildTransport, fromAddress } = require("../src/utils/mailer");
const { describeError } = require("../src/utils/outbox");

const to = process.argv[2];
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;

(async () => {
  if (!to || !EMAIL.test(to)) {
    console.log("Usage : npm run test-email -- votre-adresse@exemple.com");
    process.exit(1);
  }
  console.log("Configuration lue :");
  console.log(`  SMTP_HOST   = ${process.env.SMTP_HOST || "(vide)"}`);
  console.log(`  SMTP_PORT   = ${process.env.SMTP_PORT || "587 (par défaut)"}  SMTP_SECURE = ${process.env.SMTP_SECURE || "false"}`);
  console.log(`  SMTP_USER   = ${process.env.SMTP_USER || "(vide)"}  SMTP_PASS = ${process.env.SMTP_PASS ? "(défini)" : "(vide)"}`);
  console.log(`  Expéditeur  = ${fromAddress() || "(vide : définissez SMTP_FROM)"}`);
  const transport = buildTransport();
  if (!transport) { console.log("\n✗ SMTP_HOST est vide : aucun e-mail ne peut partir."); process.exit(1); }
  if (!fromAddress()) { console.log("\n✗ Aucun expéditeur : définissez SMTP_FROM (ex. KOLAKISA <contact@kolakisa.com>)."); process.exit(1); }
  try {
    await transport.verify();
    console.log("\n✓ Connexion au serveur SMTP réussie (identifiants acceptés).");
  } catch (error) {
    console.log(`\n✗ Connexion SMTP impossible : ${describeError(error)}.`);
    console.log("  Vérifiez SMTP_HOST, SMTP_USER, SMTP_PASS, et le port : 465 avec SMTP_SECURE=true, ou 587 avec SMTP_SECURE=false.");
    process.exit(1);
  }
  try {
    const info = await transport.sendMail({
      from: fromAddress(), to, subject: "[TEST] KOLAKISA : votre configuration e-mail fonctionne",
      text: "Bonjour,\n\nCet e-mail de test a été envoyé par la commande « npm run test-email » de KOLAKISA.\nS'il est arrivé dans votre boîte de réception (et non dans les indésirables), la configuration est bonne.",
    });
    console.log(`✓ E-mail de test accepté par le serveur pour ${to} (identifiant : ${info.messageId}). Vérifiez votre boîte de réception et les indésirables.`);
  } catch (error) {
    console.log(`✗ Envoi refusé : ${describeError(error)}. L'expéditeur doit appartenir à un domaine authentifié chez votre fournisseur.`);
    process.exit(1);
  }
})();
