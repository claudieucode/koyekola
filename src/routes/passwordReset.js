// Mot de passe oublié. Règles (chacune testée) :
//  - la réponse est TOUJOURS la même, que l'adresse ait un compte ou non (on ne révèle pas qui est inscrit) ;
//  - le lien contient un jeton aléatoire de 32 octets ; seule son empreinte SHA-256 est en base ; valable 1 heure,
//    utilisable une seule fois ; une nouvelle demande annule les liens précédents ;
//  - limites : 5 demandes par heure et par adresse IP, 3 par heure et par adresse e-mail ;
//  - le nouveau mot de passe suit la règle de l'inscription (8 caractères au moins) et doit être tapé deux fois.
const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/database");
const { createRateLimiter, clearLoginFailures } = require("../middlewares/security");
const { sendPasswordResetEmail, siteUrl } = require("../utils/mailer");

const router = express.Router();
const TTL_MS = 60 * 60 * 1000;
const ipLimiter = createRateLimiter(5, 60 * 60 * 1000);
const emailLimiter = createRateLimiter(3, 60 * 60 * 1000);
const TOKEN = /^[A-Za-z0-9_-]{43}$/;
const NEUTRAL = "Si un compte existe pour cette adresse, un e-mail contenant un lien de réinitialisation vient de lui être envoyé. Pensez à vérifier vos courriers indésirables.";

const hash = (token) => crypto.createHash("sha256").update(token).digest("hex");

// Jeton → ligne valide (non utilisée, non expirée) ou null
function findValid(token, now = Date.now()) {
  if (typeof token !== "string" || !TOKEN.test(token)) return null;
  const row = db.prepare("SELECT * FROM password_resets WHERE token_hash = ?").get(hash(token));
  return row && row.used_at === null && row.expires_at > now ? row : null;
}

const noStore = (req, res, next) => { res.set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" }); next(); };

router.get("/mot-de-passe-oublie", noStore, (req, res) => {
  res.render("forgot-password", { error: null, notice: null, email: "" });
});

router.post("/mot-de-passe-oublie", noStore, (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase().slice(0, 254);
  if (!email) return res.status(400).render("forgot-password", { error: "Indiquez votre adresse e-mail.", notice: null, email });
  if (ipLimiter.isLimited(req.ip)) return res.status(429).render("forgot-password", { error: "Trop de demandes depuis votre connexion. Réessayez dans une heure.", notice: null, email });
  ipLimiter.hit(req.ip);
  // Limite par adresse : dépassée, on répond pareil (aucun indice), mais aucun nouvel e-mail ne part
  if (!emailLimiter.isLimited(email)) {
    emailLimiter.hit(email);
    const user = db.prepare("SELECT id, username, email FROM users WHERE lower(email) = ?").get(email);
    if (user) {
      const token = crypto.randomBytes(32).toString("base64url");
      const now = Date.now();
      db.prepare("DELETE FROM password_resets WHERE user_id = ?").run(user.id); // un seul lien valable à la fois
      db.prepare("INSERT INTO password_resets (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)").run(user.id, hash(token), now + TTL_MS, now);
      sendPasswordResetEmail(db, { to: user.email, username: user.username, url: `${siteUrl()}/reinitialiser-mot-de-passe/${token}` });
    }
  }
  res.render("forgot-password", { error: null, notice: NEUTRAL, email: "" });
});

const expired = (res) => res.status(410).render("reset-password", { error: null, token: null, invalid: true });

router.get("/reinitialiser-mot-de-passe/:token", noStore, (req, res) => {
  if (!findValid(req.params.token)) return expired(res);
  res.render("reset-password", { error: null, token: req.params.token, invalid: false });
});

router.post("/reinitialiser-mot-de-passe/:token", noStore, (req, res) => {
  const row = findValid(req.params.token);
  if (!row) return expired(res);
  const password = String(req.body.password || "");
  const again = String(req.body.password_confirm || "");
  const fail = (error) => res.status(400).render("reset-password", { error, token: req.params.token, invalid: false });
  if (password.length < 8) return fail("Le mot de passe doit contenir au moins 8 caractères.");
  if (password.length > 200) return fail("Le mot de passe est trop long (200 caractères au plus).");
  if (password !== again) return fail("Les deux mots de passe ne sont pas identiques.");
  db.exec("BEGIN");
  try {
    // Marqué utilisé AVANT de changer le mot de passe, sous condition : deux envois simultanés du même lien ne passent pas tous les deux
    const claimed = db.prepare("UPDATE password_resets SET used_at = ? WHERE id = ? AND used_at IS NULL").run(Date.now(), row.id).changes;
    if (!claimed) { db.exec("ROLLBACK"); return expired(res); }
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(bcrypt.hashSync(password, 10), row.user_id);
    db.prepare("DELETE FROM password_resets WHERE user_id = ? AND id <> ?").run(row.user_id, row.id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  clearLoginFailures(req);
  res.redirect("/connexion?reinitialise=1");
});

module.exports = router;
