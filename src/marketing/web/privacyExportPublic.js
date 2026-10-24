// Pages publiques de l'export de données personnelles : confirmation de la demande et téléchargement de l'archive, par lien à jeton.
// Un GET ne modifie JAMAIS rien (antivirus et aperçus de liens ouvrent les adresses) : la confirmation et le téléchargement partent d'un bouton (POST).
// Réponse volontairement identique pour un lien inconnu, expiré ou déjà utilisé ; tentatives invalides limitées par adresse ; le jeton ne fuit pas par le Referer (politique « same-origin » : rien vers un autre site, et le navigateur envoie bien son en-tête Origin au bouton de confirmation — avec « no-referrer », Chrome envoie « Origin: null » et le contrôle d'origine refuserait le POST).
const express = require("express");
const requests = require("../../services/privacy/exportRequests");
const auditLog = require("../../services/auditLog");
const { createRateLimiter } = require("../../middlewares/security");

module.exports = ({ db }) => {
  const router = express.Router();
  const general = createRateLimiter(120, 60 * 1000);
  const failures = createRateLimiter(10, 15 * 60 * 1000);

  router.use("/donnees-personnelles", (req, res, next) => {
    res.set({ "Referrer-Policy": "same-origin", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" });
    if (general.isLimited(req.ip) || failures.isLimited(req.ip)) return res.status(429).render("marketing-public/message", { title: "Trop de requêtes", heading: "Trop de tentatives", text: "Réessayez dans quelques minutes." });
    general.hit(req.ip);
    next();
  });

  const invalid = (req, res, what) => {
    failures.hit(req.ip);
    res.status(404).render("marketing-public/message", {
      title: "Lien invalide", heading: "Ce lien n'est plus valable",
      text: what === "download" ? "Il a expiré, a déjà servi trop de fois ou n'existe pas. Demandez au site de vous envoyer un nouveau lien." : "Il a déjà été utilisé, a expiré ou n'existe pas. Si vous avez bien fait une demande, demandez au site de vous renvoyer un e-mail.",
    });
  };

  // ----- Confirmation -----
  router.get("/donnees-personnelles/confirmer/:token", (req, res) => {
    const found = requests.peekConfirmation(db, req.params.token);
    if (!found) return invalid(req, res, "confirm");
    res.render("marketing-public/privacy-confirm", { title: "Confirmer la demande", siteName: found.siteName, done: false });
  });
  router.post("/donnees-personnelles/confirmer/:token", (req, res) => {
    const out = requests.confirmByToken(db, req.params.token);
    if (!out.ok) return invalid(req, res, "confirm");
    auditLog.record(null, { action: "tools.privacy_confirm", resourceType: "tools", resourceId: out.requestId, summary: "Demande d'export de données confirmée par la personne", details: { requestId: out.requestId } });
    res.render("marketing-public/privacy-confirm", { title: "Demande confirmée", siteName: out.siteName, done: true });
  });

  // ----- Téléchargement -----
  router.get("/donnees-personnelles/telecharger/:token", (req, res) => {
    const found = requests.peekDownload(db, req.params.token);
    if (!found) return invalid(req, res, "download");
    res.render("marketing-public/privacy-download", { title: "Télécharger vos données", siteName: found.siteName, expiresAt: found.row.download_expires_at });
  });
  router.post("/donnees-personnelles/telecharger/:token", (req, res) => {
    const out = requests.downloadByToken(db, req.params.token);
    if (!out.ok) return invalid(req, res, "download");
    auditLog.record(null, { action: "tools.privacy_download", resourceType: "tools", resourceId: out.requestId, summary: "Archive d'export de données téléchargée par la personne (lien)", details: { requestId: out.requestId, siteId: out.siteId } });
    res.set({ "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${out.name}"`, "Content-Length": String(out.data.length), "X-Content-Type-Options": "nosniff" }).send(out.data);
  });

  return router;
};
