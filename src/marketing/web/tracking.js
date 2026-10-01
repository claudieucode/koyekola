// Routes publiques de suivi : /t/c/:token (clic → redirection) et /t/o/:token.gif (ouverture).
// Sécurité : jeton signé (type « click » / « open ») ; la destination est lue en base, jamais dans l'adresse ; aucune fuite du
// jeton par le Referer ; jamais de mise en cache ; le pixel répond toujours par une image (aucune information sur la validité).
const express = require("express");
const { verifyToken } = require("../security/tokens");
const tracking = require("../sending/tracking");
const { createRateLimiter } = require("../../middlewares/security");

const GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

module.exports = ({ db }) => {
  const router = express.Router();
  const limiter = createRateLimiter(600, 60 * 1000);

  router.use("/t", (req, res, next) => {
    res.set({ "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" });
    next();
  });

  const resolve = (req, token, kind) => {
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready || !process.env.ENCRYPTION_KEY) return null;
    try {
      const check = verifyToken(token, process.env.ENCRYPTION_KEY, { kind });
      const p = check.payload;
      if (!check.ok || !Number.isInteger(p.o) || !Number.isInteger(p.m) || (kind === "click" && !Number.isInteger(p.l))) return null;
      return p;
    } catch {
      return null;
    }
  };

  const notFound = (res) => res.status(404).render("marketing-public/message", {
    title: "Lien invalide", heading: "Ce lien n'est plus valide", text: "Ce lien de suivi est incorrect ou a expiré.",
  });

  router.get("/t/c/:token", (req, res) => {
    if (limiter.isLimited(req.ip)) return res.status(429).render("marketing-public/message", { title: "Trop de requêtes", heading: "Trop de requêtes", text: "Réessayez dans une minute." });
    limiter.hit(req.ip);
    const p = resolve(req, req.params.token, "click");
    if (!p) return notFound(res);
    const url = tracking.recordClick({ db, organizationId: p.o }, { messageId: p.m, linkId: p.l, userAgent: req.get("user-agent") });
    if (!url) return notFound(res);
    res.redirect(302, url);
  });

  router.get("/t/o/:file", (req, res) => {
    const token = String(req.params.file).replace(/\.gif$/i, "");
    const p = limiter.isLimited(req.ip) ? null : resolve(req, token, "open");
    limiter.hit(req.ip);
    if (p) tracking.recordOpen({ db, organizationId: p.o }, { messageId: p.m, userAgent: req.get("user-agent") });
    res.set("Content-Type", "image/gif").send(GIF);
  });

  return router;
};
