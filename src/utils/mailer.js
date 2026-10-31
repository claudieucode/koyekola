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
  // Adresse administrative choisie dans Paramètres → Général, sinon celle configurée par l'hébergeur
  let adminEmail = "";
  try { adminEmail = require("../services/settings").main().adminEmail; } catch { adminEmail = ""; }
  const to = adminEmail || process.env.CONTACT_EMAIL || fromAddress();
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

function sendSignupWelcomeEmail(db, { to, username, verifyUrl = null }) {
  return queueMail(db, {
    kind: "signup_welcome", to, subject: "Bienvenue sur KOLAKISA !",
    text: [
      `Bonjour ${oneLine(username)},`, "",
      "Votre compte KOLAKISA est créé. Vous pouvez dès maintenant parcourir le catalogue et suivre vos formations :", "",
      `${siteUrl()}/catalogue`, "",
      ...(verifyUrl ? ["Confirmez votre adresse e-mail en ouvrant ce lien (valable 7 jours) :", "", verifyUrl, ""] : []),
      "Si vous n'êtes pas à l'origine de cette inscription, répondez simplement à cet e-mail.", "", "À très vite !",
    ].join("\n"),
  });
}

// Nouveau lien de confirmation de l'adresse, demandé depuis « Mon compte »
function sendEmailVerification(db, { to, username, verifyUrl }) {
  return queueMail(db, {
    kind: "email_verification", to, subject: "Confirmez votre adresse e-mail KOLAKISA",
    text: [
      `Bonjour ${oneLine(username)},`, "",
      "Confirmez votre adresse e-mail en ouvrant ce lien (valable 7 jours) :", "",
      verifyUrl, "",
      "Si vous n'avez rien demandé, ignorez cet e-mail.",
    ].join("\n"),
  });
}

// Changement d'adresse e-mail (Comptes → Profil) : envoyé à la NOUVELLE adresse ; tant que le lien n'est pas ouvert, l'adresse du compte ne change pas.
function sendEmailChange(db, { to, username, url }) {
  return queueMail(db, {
    kind: "email_change", to, subject: "Confirmez votre nouvelle adresse e-mail KOLAKISA", sensitive: true,
    text: [
      `Bonjour ${oneLine(username)},`, "",
      "Vous avez demandé à utiliser cette adresse pour votre compte KOLAKISA. Pour la confirmer (lien valable 24 heures) :", "", url, "",
      "Tant que vous n'ouvrez pas ce lien, votre adresse actuelle reste inchangée.",
      "Si vous n'avez rien demandé, ignorez cet e-mail.",
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

// Support : réponse du formateur à l'élève (le texte du message est repris tel quel ; le lien mène au ticket, connexion demandée)
function sendSupportReplyEmail(db, { to, ticketId, subject, text }) {
  return queueMail(db, {
    kind: "support_reply", to, subject: `Réponse à votre demande : ${oneLine(subject)}`.slice(0, 200),
    text: [`Le formateur a répondu à votre demande #${ticketId} « ${oneLine(subject)} » :`, "", String(text).slice(0, 1500), "", `Pour lui répondre : ${siteUrl()}/support/${ticketId}`].join("\n"),
  });
}
// Support : nouvelle demande ou nouvelle réponse d'un élève, adressée au formateur (Répondre à = l'élève)
function sendSupportStaffEmail(db, { to, ticketId, student, subject, text, isReply, replyTo = "" }) {
  return queueMail(db, {
    kind: "support_staff", to, replyTo, subject: `${isReply ? "Nouvelle réponse" : "Nouvelle demande"} de support #${ticketId} : ${oneLine(subject)}`.slice(0, 200),
    text: [`${oneLine(student)} ${isReply ? "a répondu à la" : "a envoyé une"} demande #${ticketId} « ${oneLine(subject)} » :`, "", String(text).slice(0, 1500), "", `Répondre : ${siteUrl()}/formateur/gestion/support/${ticketId}`].join("\n"),
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

// Notification à l'équipe : un formulaire vient d'être envoyé. Contient des données personnelles : e-mail « sensible » (texte effacé après envoi).
function sendFormNotification(db, { to, formName, email, values = {}, page = "" }) {
  const lines = Object.entries(values).filter(([, v]) => String(v ?? "").trim()).slice(0, 20).map(([k, v]) => `- ${oneLine(k)} : ${oneLine(v).slice(0, 300)}`);
  return queueMail(db, {
    kind: "form_notification", to, subject: `Nouvel envoi : ${oneLine(formName).slice(0, 80)}`, sensitive: true, replyTo: email,
    text: ["Bonjour,", "", `Le formulaire « ${oneLine(formName)} » vient d'être envoyé.`, "", `Adresse e-mail : ${oneLine(email)}`, ...lines, ...(page ? ["", `Page : ${oneLine(page).slice(0, 200)}`] : []), "", "Retrouvez le contact dans Marketing → Contacts."].join("\n"),
  });
}

// Invitation à rejoindre l'équipe du site (CMS → Utilisateurs). Le lien est à usage unique : l'e-mail est « sensible » (texte effacé après envoi).
function sendInvitationEmail(db, { to, inviter, roleName, siteName, url, days, name = "", message = "" }) {
  return queueMail(db, {
    kind: "team_invitation", to, subject: "Invitation à rejoindre l'équipe KOLAKISA", sensitive: true,
    text: [
      name ? `Bonjour ${oneLine(name)},` : "Bonjour,", "",
      `${oneLine(inviter)} vous invite à rejoindre l'équipe KOLAKISA avec le rôle « ${oneLine(roleName)} »${siteName ? ` sur le site « ${oneLine(siteName)} »` : ""}.`, "",
      `Pour créer votre compte et accepter l'invitation (lien personnel, valable ${days} jours, utilisable une seule fois) :`, "", url, "",
      ...(message ? ["", `Message de ${oneLine(inviter)} :`, ...String(message).split(/\r?\n/).map((l) => `> ${oneLine(l)}`).slice(0, 8)] : []), "",
      "Si vous n'attendiez pas cette invitation, ignorez cet e-mail : aucun compte ne sera créé.",
    ].join("\n"),
  });
}

// Compte créé par un administrateur : JAMAIS le mot de passe (ni en clair, ni sous aucune forme) — un lien personnel, valable plusieurs jours, pour choisir le sien
// (lien de définition du mot de passe, à usage unique) et un lien de confirmation de l'adresse. Le texte est effacé dès que l'e-mail est parti (sensible).
function sendAccountCreatedEmail(db, { to, username, creator, siteName = "", activateUrl, verifyUrl = null, days = 7, choosePassword = true }) {
  return queueMail(db, {
    kind: "account_created", to, subject: `Votre compte KOLAKISA${siteName ? ` — ${oneLine(siteName)}` : ""}`, sensitive: true,
    text: [
      `Bonjour ${oneLine(username)},`, "",
      `${oneLine(creator)} vient de créer un compte pour vous sur KOLAKISA${siteName ? ` (site « ${oneLine(siteName)} »)` : ""}.`,
      `Votre identifiant : ${oneLine(username)}`, "",
      choosePassword ? `Pour choisir votre mot de passe et activer votre accès (lien personnel, valable ${days} jours, utilisable une seule fois) :` : "Pour vous connecter, utilisez le mot de passe que la personne qui a créé votre compte vous a communiqué. Vous pourrez le changer après connexion. Pour définir un nouveau mot de passe tout de suite (lien personnel, usage unique) :", "", activateUrl,
      ...(verifyUrl ? ["", "Pour confirmer que cette adresse e-mail est bien la vôtre :", "", verifyUrl] : []), "",
      "Si vous n'attendiez pas ce compte, ignorez cet e-mail : sans ce lien, personne ne peut se connecter à votre place.",
    ].join("\n"),
  });
}

module.exports = {
  sendSupportReplyEmail, sendSupportStaffEmail,
  sendAccountCreatedEmail,
  sendInvitationEmail, TIMEOUTS, buildTransport, fromAddress, siteUrl,
  sendPurchaseWelcomeEmail, sendContactNotification, sendContactAcknowledgement, sendSignupWelcomeEmail, sendEmailVerification, sendEmailChange, sendPasswordResetEmail, sendSubscriptionConfirmation, sendFormNotification,
};
