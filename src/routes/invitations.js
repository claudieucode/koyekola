// Acceptation d'une invitation à rejoindre l'équipe (CMS → Utilisateurs → Inviter). Le lien est personnel, à usage unique, valable 7 jours ;
// seule son empreinte est conservée. Le compte créé ici est un compte ordinaire du site (mêmes règles d'inscription, même session) : aucun
// second système d'authentification. Jamais de mot de passe dans l'e-mail.
const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/database");
const access = require("../services/cmsAccess");
const { openSession } = require("../middlewares/sessionUser");
const { createRateLimiter } = require("../middlewares/security");

const router = express.Router();
const limiter = createRateLimiter(10, 15 * 60 * 1000);

function load(req, res) {
  const token = String(req.params.token || "").slice(0, 80);
  const inv = /^[A-Za-z0-9_-]{20,60}$/.test(token) ? access.invitationByToken(token) : null;
  if (!inv) { res.status(404).render("error", { message: "Cette invitation n'est plus valable (expirée, déjà utilisée ou révoquée). Demandez-en une nouvelle." }); return null; }
  const role = access.getRole(inv.role);
  const site = inv.site_id ? db.prepare("SELECT name FROM mk_sites WHERE id = ?").get(inv.site_id) : null;
  return { inv, roleName: role ? role.name : inv.role, siteName: site ? site.name : "" };
}

router.get("/invitation/:token", (req, res) => {
  const ctx = load(req, res);
  if (!ctx) return;
  res.render("invitation", { error: null, token: req.params.token, email: ctx.inv.email, roleName: ctx.roleName, siteName: ctx.siteName, values: {}, existing: Boolean(db.prepare("SELECT 1 FROM users WHERE email = ?").get(ctx.inv.email)) });
});

router.post("/invitation/:token", (req, res, next) => {
  const ctx = load(req, res);
  if (!ctx) return;
  const view = (error, status = 400) => res.status(status).render("invitation", { error, token: req.params.token, email: ctx.inv.email, roleName: ctx.roleName, siteName: ctx.siteName, values: req.body || {}, existing: false });
  try {
    if (limiter.isLimited(`inv:${req.ip}`)) return view("Trop de tentatives : réessayez dans quelques minutes.", 429);
    limiter.hit(`inv:${req.ip}`);
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    if (db.prepare("SELECT 1 FROM users WHERE email = ?").get(ctx.inv.email)) return view("Un compte existe déjà avec cette adresse : connectez-vous, puis demandez à l'administrateur de vous ajouter.");
    if (username.length < 3 || username.length > 30) return view("Le nom d'utilisateur doit contenir entre 3 et 30 caractères.");
    if (password.length < 8) return view("Le mot de passe doit contenir au moins 8 caractères.");
    if (db.prepare("SELECT 1 FROM users WHERE username = ?").get(username)) return view("Ce nom d'utilisateur est déjà pris.");
    const hash = bcrypt.hashSync(password, 10);
    const id = Number(db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'etudiant')").run(username, ctx.inv.email, hash).lastInsertRowid);
    access.acceptInvitation(ctx.inv, id);
    openSession(req, { id, username, email: ctx.inv.email, role: "etudiant", password_hash: hash }, (error) => {
      if (error) return next(error);
      res.redirect(ctx.inv.site_id ? "/marketing/site-web/mes-sites" : "/marketing/site-web");
    });
  } catch (error) { next(error); }
});

module.exports = router;
