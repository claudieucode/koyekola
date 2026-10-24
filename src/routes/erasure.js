// KOLAKISA — confirmation publique d'une demande d'effacement de données (lien reçu par e-mail). Voir services/privacy/erasureRequests.
// GET : affiche seulement un bouton (un aperçu de lien par une messagerie ne confirme rien) ; POST : confirme, une seule fois.
// Referrer-Policy « same-origin » (et non « no-referrer ») : avec « no-referrer » le navigateur envoie « Origin: null » et la protection CSRF refuserait la confirmation ; le jeton ne quitte jamais le site.
// Le site vient de l'adresse visitée (req.kwSite, vérifiée par le serveur) : le jeton d'un site ne fonctionne pas sur un autre.
const express = require("express");
const db = require("../config/database");
const requests = require("../services/privacy/erasureRequests");
const { createRateLimiter } = require("../middlewares/security");
const router = express.Router();
const limiter = createRateLimiter(30, 15 * 60 * 1000);

const orgId = (req) => { const m = req.app.locals.marketing; return m && m.ready ? m.organizationId : null; };
const hostSite = (req) => (req.kwSite ? req.kwSite.id : null);
const view = (req, res, state, status = 200) => res.status(status).set({ "Cache-Control": "no-store", "Referrer-Policy": "same-origin", "X-Robots-Tag": "noindex, nofollow" })
  .render("erasure-confirm", { state, token: req.params.token, title: "Confirmer la suppression de données" });

router.use((req, res, next) => {
  const key = req.ip || "?";
  if (limiter.isLimited(key)) return res.status(429).type("text/plain").send("Trop de tentatives. Réessayez plus tard.");
  limiter.hit(key);
  next();
});

router.get("/confirmer/:token", (req, res) => {
  const r = requests.confirmByToken(db, { db, organizationId: orgId(req) }, req.params.token, hostSite(req), { commit: false });
  if (r.state === "ok") return view(req, res, "ready");
  return view(req, res, r.state === "expired" ? "expired" : r.state === "already" ? "already" : "invalid", r.state === "invalid" ? 404 : 200);
});
router.post("/confirmer/:token", (req, res) => {
  const r = requests.confirmByToken(db, { db, organizationId: orgId(req) }, req.params.token, hostSite(req));
  return view(req, res, r.state === "ok" ? "done" : r.state, r.state === "invalid" ? 404 : 200);
});

module.exports = router;
