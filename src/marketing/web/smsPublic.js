// Liens courts des SMS (« /s/<code> »), sans compte : clic suivi puis redirection, ou désinscription des SMS.
// Un GET ne désinscrit JAMAIS (les aperçus de liens des messageries ouvrent les adresses) : il faut cliquer le bouton.
const express = require("express");
const tracking = require("../sms/tracking");
const { createRateLimiter } = require("../../middlewares/security");

module.exports = ({ db }) => {
  const router = express.Router();
  const limiter = createRateLimiter(120, 60 * 1000);

  router.use("/s", (req, res, next) => {
    res.set({ "Referrer-Policy": "no-referrer", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
    if (limiter.isLimited(req.ip)) return res.status(429).render("marketing-public/message", { title: "Trop de requêtes", heading: "Trop de requêtes", text: "Réessayez dans une minute." });
    limiter.hit(req.ip);
    next();
  });

  const invalid = (res) => res.status(404).render("marketing-public/message", {
    title: "Lien invalide", heading: "Ce lien n'est plus valide", text: "Vérifiez que l'adresse a été recopiée en entier depuis le SMS.",
  });

  router.get("/s/:code", (req, res) => {
    const resolved = tracking.resolveCode(db, req.params.code);
    if (!resolved) return invalid(res);
    if (resolved.short.kind === "link") {
      const url = tracking.recordSmsClick(db, resolved, { userAgent: req.get("user-agent") });
      return url ? res.redirect(302, url) : invalid(res);
    }
    const info = tracking.optOutInfo(db, resolved);
    res.render("marketing-public/sms-unsubscribe", { title: "Ne plus recevoir de SMS", ...info });
  });

  router.post("/s/:code", (req, res) => {
    const resolved = tracking.resolveCode(db, req.params.code);
    if (!resolved || resolved.short.kind !== "unsubscribe") return invalid(res);
    const marketing = req.app.locals.marketing;
    tracking.unsubscribeFromCode(db, resolved, { bus: marketing && marketing.ready ? marketing.bus : null });
    res.render("marketing-public/message", {
      title: "Désinscription confirmée", heading: "C'est fait", text: "Vous ne recevrez plus nos SMS. Vos e-mails ne changent pas : chaque message contient son propre lien de désinscription.",
    });
  });

  return router;
};
