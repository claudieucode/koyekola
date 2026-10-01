// Interface web du module marketing : routeur d'administration (/marketing, session + rôle) et routes publiques.
const express = require("express");
const { membershipsOf, can } = require("../organizations");
const helpers = require("./helpers");

function createMarketingRouters({ db }) {
  const admin = express.Router();

  // Accès : connecté, module disponible, MEMBRE de l'organisation (rôle relu à chaque requête : un retrait est immédiat)
  admin.use((req, res, next) => {
    const user = req.session.user;
    if (!user) return res.redirect(`/connexion?redirect=${encodeURIComponent(req.originalUrl)}`);
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return res.status(503).render("error", { message: "Le module marketing est indisponible. Consultez le journal du serveur." });
    const membership = membershipsOf(db, user.id).find((m) => m.organization_id === marketing.organizationId);
    if (!membership) return res.status(403).render("error", { message: "Accès réservé à l'équipe marketing." });
    const allowed = (permission) => can(membership.role, permission);
    req.mk = {
      role: membership.role, can: allowed, marketing,
      ctx: { db, organizationId: marketing.organizationId, userId: user.id, bus: marketing.bus, settings: marketing.settings, tokenKey: process.env.ENCRYPTION_KEY, baseUrl: process.env.SITE_URL },
    };
    res.locals.mk = { role: membership.role, can: allowed };
    res.locals.mkh = helpers;
    // Message « flash » : affiché une seule fois après une action
    res.locals.flash = req.session.mkFlash ?? null;
    if (req.session.mkFlash) delete req.session.mkFlash;
    next();
  });

  admin.use(require("./segments")({ db }));
  admin.use(require("./templates")({ db }));
  admin.use(require("./campaigns")({ db }));
  admin.use(require("./automations")({ db }));
  admin.use(require("./imports")({ db }));
  admin.use(require("./analytics")({ db }));
  admin.use(require("./apiKeys")({ db }));
  admin.use(require("./webhooksOut")({ db }));
  admin.use(require("./forms")({ db }));
  admin.use(require("./admin")({ db }));
  // Pages publiques (désinscription, préférences, suivi, formulaires) ; les webhooks sont montés à part (corps brut, avant l'analyse JSON)
  const publicRoutes = express.Router();
  publicRoutes.use(require("./public")({ db }));
  publicRoutes.use(require("./tracking")({ db }));
  publicRoutes.use(require("./formsPublic")({ db }));
  // API /api/v1 : authentification par clé, jamais par cookie — montée séparément (voir server.js)
  const { createApiRouter } = require("../api/router");
  return { admin, publicRoutes, webhooks: require("./webhooks")({ db }), api: createApiRouter({ db }) };
}

module.exports = { createMarketingRouters };
