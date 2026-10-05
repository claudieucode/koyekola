// Routes publiques des réseaux sociaux (point 12) : version web d'une campagne (/e/<jeton>, avec carte de partage
// Open Graph et boutons de partage) et liens courts suivis des publications (/go/<code>).
const express = require("express");
const web = require("../social/webVersion");
const social = require("../social");
const { isBot } = require("../landing");
const { createRateLimiter } = require("../../middlewares/security");

module.exports = ({ db }) => {
  const router = express.Router();
  const limiter = createRateLimiter(600, 60 * 1000);
  const ctxOf = (req, organizationId) => {
    const m = req.app.locals.marketing;
    return { db, organizationId, userId: null, settings: m.settings, tokenKey: process.env.ENCRYPTION_KEY, baseUrl: process.env.SITE_URL };
  };
  const gone = (res) => res.status(404).render("marketing-public/message", { title: "Page indisponible", heading: "Cette page n'est pas disponible", text: "Ce lien est incorrect, ou la version web de cet e-mail a été désactivée." });
  const load = (req, res) => {
    const m = req.app.locals.marketing;
    if (!m || !m.ready) { gone(res); return null; }
    const t = web.readWebToken(req.params.token, process.env.ENCRYPTION_KEY);
    const campaign = t && t.organizationId === m.organizationId ? web.publishableCampaign(db, t.organizationId, t.campaignId) : null;
    if (!campaign) { gone(res); return null; }
    return { campaign, ctx: ctxOf(req, t.organizationId) };
  };

  router.get("/e/:token", (req, res) => {
    const found = load(req, res);
    if (!found) return;
    const v = web.renderWebVersion(found.ctx, found.campaign);
    const url = `${String(process.env.SITE_URL || "").replace(/\/+$/, "")}/e/${req.params.token}`;
    res.set("Cache-Control", "public, max-age=300");
    res.render("marketing-public/web-version", { v, url, token: req.params.token, share: web.shareLinks(url, v.subject) });
  });
  // Contenu de l'e-mail, affiché dans un cadre isolé (aucun script ne peut s'y exécuter)
  router.get("/e/:token/contenu", (req, res) => {
    const found = load(req, res);
    if (!found) return;
    // Aucun script possible (default-src 'none', et le cadre n'a pas « allow-scripts ») ; même origine pour que la page
    // puisse lire la hauteur du contenu et ajuster le cadre (pas de double barre de défilement)
    res.set({ "Content-Security-Policy": "default-src 'none'; img-src https: data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'", "Cache-Control": "public, max-age=300", "X-Robots-Tag": "noindex" });
    res.type("html").send(web.renderWebVersion(found.ctx, found.campaign).html);
  });

  router.get("/go/:code", (req, res) => {
    if (limiter.isLimited(req.ip)) return res.status(429).send("Trop de requêtes.");
    limiter.hit(req.ip);
    const to = social.resolveShortLink(db, req.params.code, { bot: isBot(req) });
    if (!to) return res.status(404).render("marketing-public/message", { title: "Lien invalide", heading: "Ce lien n'existe pas", text: "Le lien est incorrect ou la publication a été supprimée." });
    res.set({ "Referrer-Policy": "no-referrer-when-downgrade", "Cache-Control": "no-store" });
    res.redirect(302, to);
  });
  return router;
};
