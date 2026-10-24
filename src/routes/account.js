// « Mon compte » : informations du compte, téléchargement de ses données et suppression du compte (RGPD)
const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middlewares/auth");
const { createRateLimiter } = require("../middlewares/security");
const account = require("../services/account");
const emailVerification = require("../services/emailVerification");
const { sendEmailVerification, siteUrl } = require("../utils/mailer");

const router = express.Router();
// Confirmation par mot de passe : 10 essais par heure et par compte
const deleteLimiter = createRateLimiter(10, 60 * 60 * 1000);
// Nouveau lien de confirmation de l'adresse : 3 par heure et par compte
const resendLimiter = createRateLimiter(3, 60 * 60 * 1000);

function render(req, res, { status = 200, error = null, notice = null } = {}) {
  const user = db.prepare("SELECT id, username, email, role, created_at, email_verified_at FROM users WHERE id = ?").get(req.session.user.id);
  const count = (sql) => db.prepare(sql).get(user.id).n;
  res.status(status).render("account", {
    account: user,
    stats: {
      courses: count("SELECT COUNT(*) n FROM enrollments WHERE user_id = ?"),
      orders: count("SELECT COUNT(*) n FROM orders WHERE user_id = ?"),
    },
    canDelete: account.canDelete(user),
    error,
    notice,
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

// Changement d'adresse demandé depuis Comptes → Profil : même principe (un clic sur « Confirmer », jamais l'ouverture seule du lien)
const profile = require("../services/accountProfile");
router.get("/mon-compte/changer-email/:token", noStore, (req, res) => {
  const t = profile.readEmailToken(req.params.token);
  res.status(t ? 200 : 410).render("confirm-email-change", { token: req.params.token, valid: Boolean(t), email: t ? t.email : "", result: null });
});
router.post("/mon-compte/changer-email/:token", noStore, (req, res) => {
  const result = profile.confirmEmailChange(req.params.token);
  res.status(result === "invalide" ? 410 : 200).render("confirm-email-change", { token: req.params.token, valid: result !== "invalide", email: "", result });
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
