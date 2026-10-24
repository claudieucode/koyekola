// KOLAKISA CMS → Comptes → Profil : le profil PERSONNEL de la personne connectée (identité, préférences, e-mail, mot de passe, photo, sessions).
// Aucune adresse ne porte d'identifiant de compte : tout s'applique à req.session.user, jamais à un identifiant venu de la requête (pas d'IDOR possible).
// Les droits de l'équipe (users.*) ne sont pas nécessaires : chacun gère son propre compte. Mot de passe, e-mail et sessions passent par services/accountProfile
// et par le contrôle de session existant (middlewares/sessionUser : les autres sessions sont fermées dès que le mot de passe change).
const express = require("express");
const db = require("../../config/database");
const profile = require("../../services/accountProfile");
const { upload } = require("../../middlewares/upload");
const { createRateLimiter } = require("../../middlewares/security");
const { removeUploadedFile } = require("../../utils/uploads");
const { sendEmailChange, siteUrl } = require("../../utils/mailer");
const { recordAudit } = require("../audit");
const { UserError } = require("../../utils/errors");

const BASE = "/marketing/site-web/profil";
const FRAMED = /^\/marketing\/site-web\/(?:sites\/\d{1,12}|principal)\/equipe-profil\/?$/;
// Essais de mot de passe actuel : 10 par heure et par compte ; demandes d'e-mail : 5 par heure
const passwordLimiter = createRateLimiter(10, 60 * 60 * 1000);
const emailLimiter = createRateLimiter(5, 60 * 60 * 1000);

module.exports = () => {
  const router = express.Router();
  const me = (req) => req.session.user.id;
  const flash = (req, type, text) => { req.session.mkFlash = { type, text, noReopen: true }; };
  // Retour sur l'écran d'où l'on vient : le cadre du site (même module) est conservé ; toute autre origine ramène à l'adresse centrale (jamais de redirection ouverte)
  const back = (req) => {
    try { const p = new URL(req.get("referer") || "", "http://x.invalid").pathname; if (FRAMED.test(p)) return p; } catch { /* référent absent ou illisible */ }
    return BASE;
  };
  const audit = (req, action, metadata = {}) => {
    try { recordAudit(db, { organizationId: req.mk.ctx.organizationId, userId: me(req), action, resourceType: "user", resourceId: me(req), metadata }); } catch { /* l'audit ne bloque jamais l'action */ }
  };
  // Saisie conservée après une erreur : posée en session, lue UNE fois par l'écran (jamais le mot de passe)
  const stash = (req, section, values, errors) => { req.session.profileForm = { section, values, errors }; };

  router.use("/site-web/profil", (req, res, next) => { res.locals.profileJs = true; next(); });

  router.get("/site-web/profil", (req, res) => {
    const p = profile.profileOf(me(req));
    if (!p) return res.status(404).render("error", { message: "Compte introuvable." });
    const form = req.session.profileForm || null;
    delete req.session.profileForm;
    const v = form && form.section === "profile" ? form.values : {};
    const merged = { ...p, firstName: v.first_name ?? p.firstName, lastName: v.last_name ?? p.lastName, nickname: v.nickname ?? p.nickname, website: v.website ?? p.website, bio: v.bio ?? p.bio, displayName: v.display_name ?? p.displayName, theme: v.theme ?? p.prefs.theme };
    res.render("marketing/profile", {
      title: "Profil", active: "utilisateurs/profil", p: merged, BASE, errors: form ? form.errors : {}, formSection: form ? form.section : "",
      emailValue: form && form.section === "email" ? form.values.email : "", sessions: profile.sessionsOf(me(req), req.sessionID), displayOptions: profile.displayOptions(merged),
      themes: profile.THEMES, maxBio: profile.MAX_BIO, minPassword: profile.MIN_PASSWORD, canApiKeys: req.mk.can("api_keys.manage"), appliedTheme: req.query.theme === "1" ? p.prefs.theme : null,
    });
  });

  // Identité, préférences, biographie, photo
  router.post("/site-web/profil", (req, res, next) => {
    upload.single("thumbnail")(req, res, (error) => {
      if (error) { flash(req, "error", error instanceof UserError ? error.message : "La photo n'a pas pu être envoyée."); return res.redirect(back(req)); }
      next();
    });
  }, (req, res, next) => {
    const file = req.file;
    const discard = () => { if (file) removeUploadedFile(`/uploads/thumbnails/${file.filename}`); };
    try {
      if (file) profile.checkImageFile(file);
      const result = profile.saveProfile(me(req), req.body);
      if (!result.ok) { discard(); stash(req, "profile", req.body, result.errors); flash(req, "error", "Le profil n'a pas été enregistré : corrigez les champs indiqués."); return res.redirect(back(req)); }
      const row = db.prepare("SELECT avatar_path FROM users WHERE id = ?").get(me(req));
      let avatar = row.avatar_path;
      if (file) avatar = `/uploads/thumbnails/${file.filename}`;
      else if (req.body.remove_avatar) avatar = null;
      if (avatar !== row.avatar_path) {
        db.prepare("UPDATE users SET avatar_path = ? WHERE id = ?").run(avatar, me(req));
        if (row.avatar_path) removeUploadedFile(row.avatar_path); // l'ancienne photo n'est effacée qu'une fois la base à jour (et seulement si elle est à ce compte)
      }
      audit(req, "profile.updated", { avatar: avatar !== row.avatar_path });
      flash(req, "ok", "Profil enregistré.");
      res.redirect(`${back(req)}?theme=1`);
    } catch (error) {
      discard();
      if (error instanceof UserError) { stash(req, "profile", req.body, {}); flash(req, "error", error.message); return res.redirect(back(req)); }
      next(error);
    }
  });

  // Mot de passe : mot de passe actuel exigé, politique du site, confirmation ; les autres sessions sont fermées (pwStamp) et celle-ci est conservée
  router.post("/site-web/profil/mot-de-passe", async (req, res, next) => {
    try {
      const key = `pwd:${me(req)}`;
      if (passwordLimiter.isLimited(key)) { flash(req, "error", "Trop d'essais : réessayez dans une heure."); return res.redirect(back(req)); }
      const r = await profile.changePassword(me(req), { current: req.body.current_password, next: req.body.new_password, confirm: req.body.confirm_password });
      if (!r.ok) {
        if (r.wrongCurrent) passwordLimiter.hit(key);
        stash(req, "password", {}, r.errors);
        flash(req, "error", "Le mot de passe n'a pas été changé : corrigez les champs indiqués.");
        return res.redirect(back(req));
      }
      req.session.pwStamp = r.stamp; // cette session reste ouverte ; toutes les autres sont fermées à leur prochaine requête
      audit(req, "profile.password_changed");
      flash(req, "ok", "Mot de passe changé. Vos autres sessions ont été déconnectées.");
      res.redirect(back(req));
    } catch (error) { next(error); }
  });

  // Adresse e-mail : l'adresse actuelle reste active jusqu'à l'ouverture du lien envoyé à la nouvelle
  router.post("/site-web/profil/email", (req, res, next) => {
    try {
      const key = `mail:${me(req)}`;
      if (emailLimiter.isLimited(key)) { flash(req, "error", "Trop de demandes : réessayez dans une heure."); return res.redirect(back(req)); }
      emailLimiter.hit(key);
      let r;
      try { r = profile.requestEmailChange(me(req), req.body.email); } catch (error) {
        if (!(error instanceof UserError)) throw error;
        stash(req, "email", { email: String(req.body.email || "").slice(0, 254) }, { email: error.message });
        flash(req, "error", error.message);
        return res.redirect(back(req));
      }
      sendEmailChange(db, { to: r.to, username: r.username, url: `${siteUrl()}/mon-compte/changer-email/${r.token}` });
      audit(req, "profile.email_requested");
      flash(req, "ok", `Un lien de confirmation vient d'être envoyé à ${r.to}. Votre adresse actuelle reste active tant que vous ne l'avez pas ouvert.`);
      res.redirect(back(req));
    } catch (error) { next(error); }
  });
  router.post("/site-web/profil/email/annuler", (req, res) => {
    profile.cancelEmailChange(me(req));
    flash(req, "ok", "Demande de changement d'adresse annulée.");
    res.redirect(back(req));
  });

  // Sessions : fermer les autres, ou une seule (repérée par une clé non devinable, jamais par l'identifiant de session)
  router.post("/site-web/profil/sessions/revoquer", (req, res) => {
    const n = profile.revokeSessions(me(req), req.sessionID);
    audit(req, "profile.sessions_revoked", { count: n });
    flash(req, "ok", n ? `${n} autre${n > 1 ? "s" : ""} session${n > 1 ? "s" : ""} déconnectée${n > 1 ? "s" : ""}.` : "Aucune autre session n'était ouverte.");
    res.redirect(back(req));
  });
  router.post("/site-web/profil/sessions/:key([0-9a-f]{16})/revoquer", (req, res) => {
    const n = profile.revokeSessions(me(req), req.sessionID, req.params.key);
    if (n) audit(req, "profile.sessions_revoked", { count: n });
    flash(req, n ? "ok" : "error", n ? "Session déconnectée." : "Cette session n'existe plus.");
    res.redirect(back(req));
  });
  return router;
};
