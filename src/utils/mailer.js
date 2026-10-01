const nodemailer = require("nodemailer");

function buildTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
}

// Envoie un email de bienvenue après un achat. L'acheteur a déjà un compte (créé via
// /inscription avant l'achat, comme l'exige le site) : cet email ne contient donc jamais
// de mot de passe, seulement une confirmation et un lien pour commencer à suivre la ou
// les formations achetées.
//
// Sans SMTP_HOST configuré dans .env, l'email n'est pas envoyé : son contenu est
// simplement affiché dans les logs du serveur, pour pouvoir développer/tester sans
// service d'email réel.
async function sendPurchaseWelcomeEmail({ to, username, courseTitles }) {
  const transport = buildTransport();
  const siteUrl = process.env.SITE_URL || "http://localhost:3002";
  const subject =
    courseTitles.length > 1 ? "Bienvenue dans vos nouvelles formations !" : `Bienvenue dans la formation « ${courseTitles[0]} » !`;
  const text = [
    `Bonjour ${username},`,
    "",
    "Merci pour votre achat sur KOYEKOLA ! Votre ou vos formations sont disponibles dès maintenant :",
    "",
    ...courseTitles.map((t) => `- ${t}`),
    "",
    `Accédez-y ici : ${siteUrl}/mes-cours`,
    "",
    "Bon apprentissage !",
  ].join("\n");

  if (!transport) {
    console.log("--- [KOYEKOLA] SMTP non configuré : email de bienvenue non envoyé, contenu ci-dessous ---");
    console.log(`À : ${to}\nSujet : ${subject}\n\n${text}`);
    console.log("--- fin de l'email ---");
    return { sent: false, reason: "smtp_not_configured" };
  }

  try {
    await transport.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text });
    return { sent: true };
  } catch (err) {
    console.error("Échec de l'envoi de l'email de bienvenue :", err.message);
    return { sent: false, reason: "send_error" };
  }
}

// Prévient le formateur d'un nouveau message de contact. Adresse de réception : CONTACT_EMAIL, sinon SMTP_FROM / SMTP_USER.
// Sans SMTP_HOST, rien n'est envoyé (le message est de toute façon conservé dans « Mon espace »).
async function sendContactNotification({ name, email, subject, message }) {
  const transport = buildTransport();
  const to = process.env.CONTACT_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!transport || !to) {
    console.log("[KOYEKOLA] Nouveau message de contact (aucune messagerie configurée : consultez-le dans Mon espace).");
    return { sent: false, reason: "smtp_not_configured" };
  }
  const clean = (value) => String(value || "").replace(/[\r\n]+/g, " ");
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    replyTo: clean(email),
    subject: `[KOYEKOLA] Message de ${clean(name)}${subject ? " : " + clean(subject) : ""}`,
    text: `${clean(name)} <${clean(email)}>\n\n${message}`,
  });
  return { sent: true };
}

module.exports = { sendPurchaseWelcomeEmail, sendContactNotification, buildTransport };
