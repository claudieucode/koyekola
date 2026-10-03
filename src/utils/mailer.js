// E-mails du site (« transactionnels ») : confirmation d'achat, alerte de nouveau message de contact, accusé de réception,
// bienvenue à l'inscription, mot de passe oublié, confirmation d'inscription à la newsletter.
// Ils passent par la file d'envoi (src/utils/outbox.js) : une page (achat, contact…) n'attend JAMAIS le serveur
// d'e-mail ; un échec est enregistré et réessayé. Envoi par SMTP (variables SMTP_* : chez Resend, smtp.resend.com).
const nodemailer = require("nodemailer");
const { queueMail } = require("./outbox");

// Délais maximum : un serveur SMTP lent ou injoignable ne bloque jamais plus de quelques secondes
const TIMEOUTS = { connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000 };

function buildTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    ...TIMEOUTS,
  });
}

const fromAddress = () => process.env.SMTP_FROM || process.env.SMTP_USER || "";
const siteUrl = () => String(process.env.SITE_URL || "http://localhost:3002").replace(/\/+$/, "");
const oneLine = (value) => String(value || "").replace(/[\r\n\u2028\u2029]+/g, " ").trim();

// Après un achat. L'acheteur a déjà un compte : jamais de mot de passe dans cet e-mail.
function sendPurchaseWelcomeEmail(db, { to, username, courseTitles }) {
  const subject = courseTitles.length > 1 ? "Bienvenue dans vos nouvelles formations !" : `Bienvenue dans la formation « ${oneLine(courseTitles[0])} » !`;
  const text = [
    `Bonjour ${oneLine(username)},`, "",
    "Merci pour votre achat sur KOLAKISA ! Votre ou vos formations sont disponibles dès maintenant :", "",
    ...courseTitles.map((t) => `- ${oneLine(t)}`), "",
    `Accédez-y ici : ${siteUrl()}/mes-cours`, "", "Bon apprentissage !",
  ].join("\n");
  return queueMail(db, { kind: "purchase", to, subject, text });
}

// Prévient le formateur d'un nouveau message de contact. Réception : CONTACT_EMAIL, sinon SMTP_FROM / SMTP_USER.
// Le message est de toute façon conservé dans « Mon espace ».
function sendContactNotification(db, { name, email, subject, message }) {
  const to = process.env.CONTACT_EMAIL || fromAddress();
  if (!to) return { queued: false, reason: "no_recipient" };
  return queueMail(db, {
    kind: "contact_notification", to, replyTo: oneLine(email),
    subject: `[KOLAKISA] Message de ${oneLine(name)}${subject ? " : " + oneLine(subject) : ""}`,
    text: `${oneLine(name)} <${oneLine(email)}>\n\n${message}`,
  });
}

// Accusé de réception envoyé à la personne qui a écrit. Texte FIXE : ni son nom ni son message ne sont recopiés,
// pour que le formulaire ne puisse pas servir à envoyer un texte choisi à une adresse tierce.
function sendContactAcknowledgement(db, { email }) {
  return queueMail(db, {
    kind: "contact_ack", to: oneLine(email), subject: "Nous avons bien reçu votre message",
    text: [
      "Bonjour,", "",
      "Nous avons bien reçu votre message envoyé depuis le formulaire de contact de KOLAKISA. Nous vous répondrons dès que possible.", "",
      "Si vous n'êtes pas à l'origine de ce message, ignorez simplement cet e-mail.", "", siteUrl(),
    ].join("\n"),
  });
}

function sendSignupWelcomeEmail(db, { to, username }) {
  return queueMail(db, {
    kind: "signup_welcome", to, subject: "Bienvenue sur KOLAKISA !",
    text: [
      `Bonjour ${oneLine(username)},`, "",
      "Votre compte KOLAKISA est créé. Vous pouvez dès maintenant parcourir le catalogue et suivre vos formations :", "",
      `${siteUrl()}/catalogue`, "",
      "Si vous n'êtes pas à l'origine de cette inscription, répondez simplement à cet e-mail.", "", "À très vite !",
    ].join("\n"),
  });
}

// Lien de réinitialisation (valable 1 heure, usage unique). Le texte est effacé de la file une fois l'e-mail parti.
function sendPasswordResetEmail(db, { to, username, url }) {
  return queueMail(db, {
    kind: "password_reset", to, subject: "Réinitialiser votre mot de passe KOLAKISA", sensitive: true,
    text: [
      `Bonjour ${oneLine(username)},`, "",
      "Vous avez demandé à réinitialiser le mot de passe de votre compte KOLAKISA. Choisissez-en un nouveau ici (lien valable 1 heure, utilisable une seule fois) :", "",
      url, "",
      "Si vous n'avez rien demandé, ignorez cet e-mail : votre mot de passe actuel reste valable.",
    ].join("\n"),
  });
}

// Double confirmation (double opt-in) d'une inscription à la newsletter
function sendSubscriptionConfirmation(db, { to, formName, url }) {
  return queueMail(db, {
    kind: "newsletter_confirm", to, subject: "Confirmez votre inscription", sensitive: true,
    text: [
      "Bonjour,", "",
      `Vous (ou quelqu'un utilisant votre adresse) avez demandé à vous inscrire : « ${oneLine(formName)} ».`,
      "Pour confirmer, ouvrez ce lien (valable 7 jours) :", "", url, "",
      "Sans confirmation, vous ne recevrez aucun e-mail de notre part.",
    ].join("\n"),
  });
}

module.exports = {
  TIMEOUTS, buildTransport, fromAddress, siteUrl,
  sendPurchaseWelcomeEmail, sendContactNotification, sendContactAcknowledgement, sendSignupWelcomeEmail, sendPasswordResetEmail, sendSubscriptionConfirmation,
};
