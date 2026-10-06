// Route publique du suivi des visiteurs : POST /w/e (lot d'événements envoyé par public/js/visitor.js).
// Ne fait RIEN sans accord : il faut le cookie de choix « kw_consent=1 » ET l'identifiant de visiteur posé après cet
// accord (cookie « kw_vid »), jamais un identifiant fourni dans le corps de la requête. Réponse toujours vide (204).
const express = require("express");
const visitors = require("../visitors");
const { createRateLimiter } = require("../../middlewares/security");

// Cookies de la requête (sans dépendance) : nom → valeur
function cookiesOf(req) {
  const out = {};
  for (const part of String(req.get("cookie") || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
// Identifiant de visiteur utilisable : accord donné et identifiant valide, sinon null
function consentedVisitor(req) {
  const c = cookiesOf(req);
  return c.kw_consent === "1" && visitors.isVisitorId(c.kw_vid) ? c.kw_vid : null;
}

module.exports = ({ db }) => {
  const router = express.Router();
  const limiter = createRateLimiter(240, 60 * 1000); // 240 lots par minute et par adresse IP : bien au-delà d'un humain

  router.post("/w/e", express.json({ limit: "32kb", type: () => true }), (req, res) => {
    res.set("Cache-Control", "no-store");
    const marketing = req.app.locals.marketing;
    const visitorId = consentedVisitor(req);
    if (!marketing || !marketing.ready || !visitorId || limiter.isLimited(req.ip)) return res.status(204).end();
    limiter.hit(req.ip);
    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const result = visitors.record(db, marketing.organizationId, { visitorId, sessionId: body.s, events: body.e, userAgent: req.get("user-agent") });
      // Personne connectée : ses visites sont reliées à son contact (même adresse que son compte)
      const user = req.session && req.session.user;
      if (user) {
        const contact = db.prepare("SELECT id FROM mk_contacts WHERE organization_id = ? AND email = lower(trim(?))").get(marketing.organizationId, user.email);
        if (contact) visitors.linkVisitor(db, marketing.organizationId, visitorId, contact.id);
      }
      // Contact connu : ses visites de pages et d'étapes de tunnels peuvent déclencher des automatisations
      if (result.ok && result.pageViews.length) {
        const known = db.prepare("SELECT contact_id FROM mk_web_visitors WHERE id = ?").get(visitorId);
        if (known && known.contact_id) require("../visitors/triggers").emitVisitEvents({ db, organizationId: marketing.organizationId, bus: marketing.bus }, { contactId: known.contact_id, sessionId: result.sessionId, pageViews: result.pageViews });
      }
    } catch (error) {
      console.error("[KOLAKISA] Suivi des visiteurs :", error.message); // jamais bloquant pour le visiteur
    }
    res.status(204).end();
  });
  return router;
};

module.exports.consentedVisitor = consentedVisitor;
