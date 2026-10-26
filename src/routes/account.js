// « Mon compte » : informations du compte, téléchargement de ses données et suppression du compte (RGPD)
const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middlewares/auth");
const { createRateLimiter } = require("../middlewares/security");
const account = require("../services/account");
const emailVerification = require("../services/emailVerification");
const { sendEmailVerification, sendEmailChange, siteUrl } = require("../utils/mailer");
const profile = require("../services/accountProfile");
const { upload } = require("../middlewares/upload");
const { removeUploadedFile } = require("../utils/uploads");
const { UserError } = require("../utils/errors");
const { settingsData, returnTo } = require("../utils/accountSettingsView");

const router = express.Router();
// Confirmation par mot de passe : 10 essais par heure et par compte
const deleteLimiter = createRateLimiter(10, 60 * 60 * 1000);
// Nouveau lien de confirmation de l'adresse : 3 par heure et par compte
const resendLimiter = createRateLimiter(3, 60 * 60 * 1000);
// Réauthentification (mot de passe actuel) : mêmes plafonds que le profil du CMS — 10 essais par heure et par compte, 5 demandes d'adresse par heure
const passwordLimiter = createRateLimiter(10, 60 * 60 * 1000);
const emailLimiter = createRateLimiter(5, 60 * 60 * 1000);

function render(req, res, { status = 200, error = null, notice = null } = {}) {
  const user = db.prepare("SELECT id, username, email, role, created_at, email_verified_at FROM users WHERE id = ?").get(req.session.user.id);
  const count = (sql) => db.prepare(sql).get(user.id).n;
  const data = settingsData(req);
  const flash = data.flash;
  res.status(status).render("account", {
    ...data,
    account: user,
    stats: {
      courses: count("SELECT COUNT(*) n FROM enrollments WHERE user_id = ?"),
      orders: count("SELECT COUNT(*) n FROM orders WHERE user_id = ?"),
    },
    canDelete: account.canDelete(user),
    error: error || (flash && flash.type === "error" ? flash.text : null),
    notice: notice || (flash && flash.type === "ok" ? flash.text : null),
  });
}

router.get("/mon-compte", requireAuth, (req, res) => render(req, res));

router.post("/mon-compte/confirmer-email", requireAuth, (req, res) => {
  const user = db.prepare("SELECT id, username, email, email_verified_at FROM users WHERE id = ?").get(req.session.user.id);
  if (user.email_verified_at) return render(req, res, { notice: "Votre adresse est déjà confirmée." });
  const key = `verify:${user.id}`;
  if (resendLimiter.isLimited(key)) return render(req, res, { status: 429, error: "Plusieurs liens ont déjà été envoyés : réessayez dans une heure (pensez à vérifier vos courriers indésirables)." });
  resendLimiter.hit(key);
  sendEmailVerification(db, { to: user.email, username: user.username, verifyUrl: `${siteUrl()}/confirmer-email/${emailVerification.tokenFor(user)}` });
  render(req, res, { notice: `Un lien de confirmation vient d'être envoyé à ${user.email}.` });
});

// Lien reçu par e-mail : la page demande un clic sur « Confirmer » (un outil qui ouvre les liens automatiquement,
// comme un antivirus de messagerie, ne confirme rien à la place de la personne)
const noStore = (req, res, next) => { res.set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" }); next(); };
router.get("/confirmer-email/:token", noStore, (req, res) => {
  res.status(emailVerification.readToken(req.params.token) ? 200 : 410).render("confirm-email", { token: req.params.token, valid: Boolean(emailVerification.readToken(req.params.token)), result: null });
});
router.post("/confirmer-email/:token", noStore, (req, res) => {
  const result = emailVerification.confirm(req.params.token);
  res.status(result ? 200 : 410).render("confirm-email", { token: req.params.token, valid: Boolean(result), result });
});

// Changement d'adresse demandé depuis Comptes → Profil ou depuis cette page : même principe (un clic sur « Confirmer », jamais l'ouverture seule du lien)
router.get("/mon-compte/changer-email/:token", noStore, (req, res) => {
  const t = profile.readEmailToken(req.params.token);
  res.status(t ? 200 : 410).render("confirm-email-change", { token: req.params.token, valid: Boolean(t), email: t ? t.email : "", result: null });
});
router.post("/mon-compte/changer-email/:token", noStore, (req, res) => {
  const result = profile.confirmEmailChange(req.params.token);
  res.status(result === "invalide" ? 410 : 200).render("confirm-email-change", { token: req.params.token, valid: result !== "invalide", email: "", result });
});

// ---------- Profil et sécurité du compte ----------
// Même moteur que « Comptes → Profil » du CMS (services/accountProfile) : un seul code pour les noms, la photo, l'adresse, le mot de passe et les sessions.
// Chaque action s'applique à req.session.user, jamais à un identifiant venu de la requête.
const me = (req) => req.session.user.id;
const flash = (req, type, text) => { req.session.accountFlash = { type, text }; };
const stash = (req, section, values, errors) => { req.session.accountForm = { section, values, errors }; };
const audit = (req, action, metadata = {}) => {
  try {
    const org = db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get();
    if (org) require("../marketing/audit").recordAudit(db, { organizationId: org.id, userId: me(req), action, resourceType: "user", resourceId: me(req), metadata });
  } catch { /* l'audit ne bloque jamais l'action */ }
};

router.post("/mon-compte/profil", requireAuth, (req, res, next) => {
  upload.single("thumbnail")(req, res, (error) => {
    if (error) { flash(req, "error", error instanceof UserError ? error.message : "La photo n'a pas pu être envoyée."); return res.redirect(returnTo(req, "acc-profile")); }
    next();
  });
}, (req, res, next) => {
  const file = req.file;
  const discard = () => { if (file) removeUploadedFile(`/uploads/thumbnails/${file.filename}`); };
  try {
    if (file) profile.checkImageFile(file);
    // Le thème d'administration n'existe pas côté élève : la valeur déjà enregistrée est conservée telle quelle
    const result = profile.saveProfile(me(req), { ...req.body, theme: profile.profileOf(me(req)).prefs.theme });
    if (!result.ok) { discard(); stash(req, "profile", req.body, result.errors); flash(req, "error", "Le profil n'a pas été enregistré : corrigez les champs indiqués."); return res.redirect(returnTo(req, "acc-profile")); }
    const avatar = profile.applyAvatar(me(req), { file, remove: Boolean(req.body.remove_avatar) });
    audit(req, "profile.updated", { avatar });
    flash(req, "ok", "Profil enregistré.");
    res.redirect(returnTo(req, "acc-profile"));
  } catch (error) {
    discard();
    if (error instanceof UserError) { stash(req, "profile", req.body, {}); flash(req, "error", error.message); return res.redirect(returnTo(req, "acc-profile")); }
    next(error);
  }
});

router.post("/mon-compte/mot-de-passe", requireAuth, async (req, res, next) => {
  try {
    const key = `pwd:${me(req)}`;
    if (passwordLimiter.isLimited(key)) { flash(req, "error", "Trop d'essais : réessayez dans une heure."); return res.redirect(returnTo(req, "acc-security")); }
    const r = await profile.changePassword(me(req), { current: req.body.current_password, next: req.body.new_password, confirm: req.body.confirm_password });
    if (!r.ok) {
      if (r.wrongCurrent) passwordLimiter.hit(key);
      stash(req, "password", {}, r.errors);
      flash(req, "error", "Le mot de passe n'a pas été changé : corrigez les champs indiqués.");
      return res.redirect(returnTo(req, "acc-security"));
    }
    req.session.pwStamp = r.stamp; // cette session reste ouverte ; toutes les autres sont fermées à leur prochaine requête
    audit(req, "profile.password_changed");
    flash(req, "ok", "Mot de passe changé. Vos autres sessions ont été déconnectées.");
    res.redirect(returnTo(req, "acc-security"));
  } catch (error) { next(error); }
});

// Le mot de passe actuel est exigé : une session volée ne doit pas suffire à détourner l'adresse du compte
router.post("/mon-compte/email", requireAuth, async (req, res, next) => {
  try {
    const key = `mail:${me(req)}`;
    if (emailLimiter.isLimited(key)) { flash(req, "error", "Trop de demandes : réessayez dans une heure."); return res.redirect(returnTo(req, "acc-security")); }
    emailLimiter.hit(key);
    const pwdKey = `pwd:${me(req)}`;
    if (passwordLimiter.isLimited(pwdKey)) { flash(req, "error", "Trop d'essais : réessayez dans une heure."); return res.redirect(returnTo(req, "acc-security")); }
    if (!(await account.checkPassword(me(req), req.body.current_password))) {
      passwordLimiter.hit(pwdKey);
      stash(req, "email", { email: String(req.body.email || "").slice(0, 254) }, { emailPassword: "Le mot de passe actuel est incorrect." });
      flash(req, "error", "L'adresse n'a pas été modifiée : confirmez avec votre mot de passe actuel.");
      return res.redirect(returnTo(req, "acc-security"));
    }
    let r;
    try { r = profile.requestEmailChange(me(req), req.body.email); } catch (error) {
      if (!(error instanceof UserError)) throw error;
      stash(req, "email", { email: String(req.body.email || "").slice(0, 254) }, { email: error.message });
      flash(req, "error", error.message);
      return res.redirect(returnTo(req, "acc-security"));
    }
    sendEmailChange(db, { to: r.to, username: r.username, url: `${siteUrl()}/mon-compte/changer-email/${r.token}` });
    audit(req, "profile.email_requested");
    flash(req, "ok", `Un lien de confirmation vient d'être envoyé à ${r.to}. Votre adresse actuelle reste active tant que vous ne l'avez pas ouvert.`);
    res.redirect(returnTo(req, "acc-security"));
  } catch (error) { next(error); }
});
router.post("/mon-compte/email/annuler", requireAuth, (req, res) => {
  profile.cancelEmailChange(me(req));
  flash(req, "ok", "Demande de changement d'adresse annulée.");
  res.redirect(returnTo(req, "acc-security"));
});

router.post("/mon-compte/sessions/revoquer", requireAuth, (req, res) => {
  const n = profile.revokeSessions(me(req), req.sessionID);
  audit(req, "profile.sessions_revoked", { count: n });
  flash(req, "ok", n ? `${n} autre${n > 1 ? "s" : ""} session${n > 1 ? "s" : ""} déconnectée${n > 1 ? "s" : ""}.` : "Aucune autre session n'était ouverte.");
  res.redirect(returnTo(req, "acc-sessions"));
});
router.post("/mon-compte/sessions/:key([0-9a-f]{16})/revoquer", requireAuth, (req, res) => {
  const n = profile.revokeSessions(me(req), req.sessionID, req.params.key);
  if (n) audit(req, "profile.sessions_revoked", { count: n });
  flash(req, n ? "ok" : "error", n ? "Session déconnectée." : "Cette session n'existe plus.");
  res.redirect(returnTo(req, "acc-sessions"));
});

router.get("/mon-compte/mes-donnees.json", requireAuth, (req, res) => {
  const data = account.exportData(req.session.user.id, req.app.locals.marketing);
  res.set({ "Content-Disposition": `attachment; filename="mes-donnees-kolakisa-${new Date().toISOString().slice(0, 10)}.json"`, "Cache-Control": "no-store" });
  res.type("application/json").send(JSON.stringify(data, null, 2));
});

router.post("/mon-compte/supprimer", requireAuth, async (req, res, next) => {
  try {
    const user = req.session.user;
    if (!account.canDelete(user)) return render(req, res, { status: 403, error: "Le compte du formateur ne peut pas être supprimé depuis cette page." });
    const key = `delete:${user.id}`;
    if (deleteLimiter.isLimited(key)) return render(req, res, { status: 429, error: "Trop d'essais. Réessayez dans une heure." });
    if (req.body.confirm !== "on") return render(req, res, { status: 400, error: "Cochez la case pour confirmer la suppression." });
    if (!(await account.checkPassword(user.id, req.body.password))) {
      deleteLimiter.hit(key);
      return render(req, res, { status: 400, error: "Mot de passe incorrect : votre compte n'a pas été supprimé." });
    }
    account.deleteAccount(user.id, req.app.locals.marketing);
    req.session.destroy(() => {
      // Page affichée déconnecté (l'en-tête ne montre plus le compte)
      res.locals.currentUser = null;
      res.locals.cartCount = 0;
      res.render("account-deleted");
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
