const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/database");
const { loginBlocked, recordLoginFailure, clearLoginFailures } = require("../middlewares/security");
const { safePath } = require("../utils/safeRedirect");
const { SIGNUP_CONSENT_TEXT, registerLmsUserSafely } = require("../marketing/bridge/lms");
const { sendSignupWelcomeEmail } = require("../utils/mailer");
const { cleanTimeZone } = require("../marketing/sending/sendtime");
const { openSession } = require("../middlewares/sessionUser");

const router = express.Router();

router.get("/inscription", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.render("register", { error: null, formValues: {}, consentText: SIGNUP_CONSENT_TEXT, redirect: safePath(req.query.redirect, "") });
});

// L'inscription publique ne crée que des comptes étudiants : ce site n'a qu'un seul
// créateur (vous), dont le compte "formateur" est créé une fois via le script de seed.
router.post("/inscription", (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).render("register", { error: "Tous les champs sont obligatoires.", formValues: req.body, consentText: SIGNUP_CONSENT_TEXT, redirect: safePath(req.body.redirect, "") });
  }
  if (password.length < 8) {
    return res.status(400).render("register", { error: "Le mot de passe doit contenir au moins 8 caractères.", formValues: req.body, consentText: SIGNUP_CONSENT_TEXT, redirect: safePath(req.body.redirect, "") });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ? OR username = ?").get(email, username);
  if (existing) {
    return res.status(400).render("register", { error: "Ce nom d'utilisateur ou cet email est déjà pris.", formValues: req.body, consentText: SIGNUP_CONSENT_TEXT, redirect: safePath(req.body.redirect, "") });
  }

  const hash = bcrypt.hashSync(password, 10);
  // Fuseau du navigateur (champ caché « tz ») : enregistré seulement s'il est valide, pour l'envoi à l'heure locale
  const info = db
    .prepare("INSERT INTO users (username, email, password_hash, role, timezone) VALUES (?, ?, ?, 'etudiant', ?)")
    .run(username, email, hash, cleanTimeZone(req.body.tz));

  const userId = Number(info.lastInsertRowid);
  // Contact marketing : « unknown » par défaut ; la case FACULTATIVE, cochée par la personne (« on » exactement), enregistre
  // un consentement prouvé. Une panne du module marketing ne doit jamais empêcher l'inscription.
  registerLmsUserSafely(req.app.locals.marketing, db, { id: userId, username, email }, { optIn: req.body.marketing_optin === "on", ip: req.ip });

  sendSignupWelcomeEmail(db, { to: email, username }); // en arrière-plan : n'attend pas le serveur d'e-mail

  // Inscription lancée depuis une page (ex. « commenter un article ») : retour à cette page
  openSession(req, { id: userId, username, email, role: "etudiant", password_hash: hash }, (error) => {
    if (error) return next(error);
    res.redirect(safePath(req.body.redirect, "/mes-cours"));
  });
});

router.get("/connexion", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.render("login", { error: null, redirect: req.query.redirect || "", notice: req.query.reinitialise === "1" ? "Votre mot de passe a été changé. Connectez-vous avec le nouveau." : null });
});

router.post("/connexion", (req, res, next) => {
  const { email, password, redirect } = req.body;

  if (loginBlocked(req)) {
    return res.status(429).render("login", { error: "Trop de tentatives de connexion. Réessayez dans 15 minutes.", redirect: redirect || "" });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  if (!user || typeof password !== "string" || !bcrypt.compareSync(password, user.password_hash)) {
    recordLoginFailure(req);
    return res.status(400).render("login", { error: "Email ou mot de passe incorrect.", redirect: redirect || "" });
  }

  clearLoginFailures(req);
  // Fuseau du navigateur mis à jour à chaque connexion (un élève qui déménage ou voyage reçoit à son heure actuelle)
  const tz = cleanTimeZone(req.body.tz);
  if (tz && tz !== user.timezone) db.prepare("UPDATE users SET timezone = ? WHERE id = ?").run(tz, user.id);

  openSession(req, user, (error) => {
    if (error) return next(error);
    res.redirect(safePath(redirect, "/"));
  });
});

router.post("/deconnexion", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
