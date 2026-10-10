// Interface web du module marketing : routeur d'administration (/marketing, session + rôle) et routes publiques.
const express = require("express");
const { membershipsOf, can } = require("../organizations");
const helpers = require("./helpers");
const appearance = require("./appearance");
const { themeOf } = appearance;

function createMarketingRouters({ db }) {
  const admin = express.Router();

  // Accès : connecté, module disponible, MEMBRE de l'équipe (organisation) OU titulaire d'un accès à un site. Les droits sont relus à chaque
  // requête (un retrait ou une suspension est immédiat) et calculés par UNE seule fonction : cmsAccess.effectivePermissions(utilisateur, site).
  // Quand l'adresse vise un site (page, fiche de site, composant), les droits sont ceux de CE site : rôle d'équipe + rôle sur ce site.
  const access = require("../../services/cmsAccess");
  const siteOfRequest = (req) => {
    const p = req.path;
    let m = /^\/pages\/(\d+)(?:\/|$)/.exec(p);
    if (m) { const r = db.prepare("SELECT site_id FROM mk_landing_pages WHERE id = ?").get(Number(m[1])); return r ? { siteId: r.site_id } : { siteId: null, missing: true }; }
    m = /^\/site-web\/sites\/(\d+)(?:\/|$)/.exec(p);
    if (m) return { siteId: Number(m[1]) };
    m = /^\/site-web\/historique\/page\/(\d+)(?:\/|$)/.exec(p);
    if (m) { const r = db.prepare("SELECT site_id FROM mk_landing_pages WHERE id = ?").get(Number(m[1])); return r ? { siteId: r.site_id } : { siteId: null, missing: true }; }
    m = /^\/site-web\/composants\/(\d+)/.exec(p);
    if (m) { const r = db.prepare("SELECT site_id FROM mk_web_components WHERE id = ?").get(Number(m[1])); return r ? { siteId: r.site_id } : { siteId: null, missing: true }; }
    // Outils (palier 13) : le site choisi (?site=) fixe le contexte des droits ; sans lui, l'organisation / le site principal
    if (/^\/site-web\/(?:outils|parametres)(?:\/|$)/.test(p)) {
      const raw = (req.query && req.query.site) ?? (req.body && req.body.site);
      if (/^\d{1,12}$/.test(String(raw ?? ""))) return { siteId: Number(raw) };
      return null;
    }
    // Contact Core (palier 15) : lecture des contacts d'UN site (?site=) — c'est ce qui ouvre l'écran aux personnes qui n'ont accès qu'à ce site
    if (req.method === "GET" && /^\/contacts(?:\/\d+(?:\/evenements\.json)?)?$/.test(p) && /^\d{1,12}$/.test(String((req.query && req.query.site) ?? ""))) return { siteId: Number(req.query.site) };
    if (req.method === "POST" && (p === "/pages" || p === "/site-web/composants") && req.body && /^\d+$/.test(String(req.body.site_id || ""))) return { siteId: Number(req.body.site_id) };
    return null;
  };
  admin.use((req, res, next) => {
    const user = req.session.user;
    if (!user) return res.redirect(`/connexion?redirect=${encodeURIComponent(req.originalUrl)}`);
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return res.status(503).render("error", { message: "Le module marketing est indisponible. Consultez le journal du serveur." });
    const orgId = marketing.organizationId;
    const membership = membershipsOf(db, user.id).find((m) => m.organization_id === orgId) || null;
    const mySites = membership ? [] : access.siteMemberships(user.id);
    if (!membership && !mySites.length) return res.status(403).render("error", { message: "Accès réservé à l'équipe." });
    const scope = siteOfRequest(req);
    const siteId = scope && Number.isInteger(scope.siteId) ? scope.siteId : null;
    // Personne qui n'a accès qu'à certains sites : seules les adresses d'un de SES sites (et son écran « Mes sites ») sont ouvertes
    if (!membership) {
      const allowedHere = req.path === "/site-web/mes-sites" || (siteId !== null && mySites.some((s) => s.site_id === siteId));
      if (!allowedHere) return (scope || req.method !== "GET") ? res.status(403).render("error", { message: "Vous n'avez pas accès à cette ressource." }) : res.redirect("/marketing/site-web/mes-sites");
    }
    const perms = access.effectivePermissions(user.id, { organizationId: orgId, siteId });
    const allowed = (permission) => perms.has(permission);
    const role = membership ? membership.role : "site";
    req.mk = {
      role, can: allowed, perms, siteId, marketing, siteOnly: !membership,
      ctx: { db, organizationId: orgId, userId: user.id, can: allowed, bus: marketing.bus, settings: marketing.settings, tokenKey: process.env.ENCRYPTION_KEY, baseUrl: process.env.SITE_URL },
    };
    res.locals.mk = { role, can: allowed, ctx: req.mk.ctx };
    res.locals.mkTheme = themeOf(marketing.settings, orgId, user.id); // Paramètres → Apparence
    res.locals.mkh = helpers;
    // Message « flash » : affiché une seule fois après une action
    res.locals.flash = req.session.mkFlash ?? null;
    if (req.session.mkFlash) delete req.session.mkFlash;
    next();
  });

  admin.use(require("./contactCore")()); // Contact Core (palier 15) : doublons, fusion, cycle de vie, état, journal — avant admin.js (« /contacts/:id »)
  admin.use(require("./segments")({ db }));
  admin.use(require("./templates")({ db }));
  admin.use(require("./campaigns")({ db }));
  admin.use(require("./rss")());
  admin.use(require("./landing")());
  admin.use(require("./siteWeb")());
  admin.use(require("./funnels")());
  admin.use(require("./pageTests")());
  admin.use(require("./articles")()); // KOLAKISA CMS → Articles (palier 4) : gestion des articles du blog
  admin.use(require("./taxonomies")()); // Catégories et étiquettes (palier 5)
  admin.use(require("./settings")()); // Paramètres : moteur de réglages (palier 14) — avant les modules qui avaient leur propre écran
  admin.use(require("./comments")()); // Commentaires : modération et réglages (palier 6)
  admin.use(require("./navigation")()); // Navigation : menus, éléments, emplacements (palier 7)
  admin.use(require("./history")()); // Historique des modifications et corbeille commune (palier 10)
  admin.use(require("./users")()); // Utilisateurs, rôles, permissions, invitations (palier 9)
  admin.use(require("./appearanceEditor")()); // Apparence : éditeur du site, styles, en-tête, pied de page, templates, patterns (palier 8)
  admin.use(require("./tools")()); // Outils : santé, import, export, diagnostic, maintenance (palier 13)
  admin.use(require("./urls")()); // Redirections, liens cassés, permaliens et adresses (palier 12)
  admin.use(require("./mediaLibrary")()); // KOLAKISA CMS → Médias (palier 3) : page et API de la médiathèque
  admin.use(require("./cmsScreens")()); // écrans de KOLAKISA CMS (lecture seule, tables existantes) : après les routes /site-web déjà en place
  admin.use(require("./scoring")());
  admin.use(require("./surveys")());
  admin.use(require("./ai")());
  admin.use(require("./domains")());
  admin.use(require("./social")());
  admin.use(require("./automations")({ db }));
  admin.use(require("./imports")({ db }));
  admin.use(require("./analytics")({ db }));
  admin.use(require("./revenue")({ db }));
  admin.use(require("./apiKeys")({ db }));
  admin.use(require("./webhooksOut")({ db }));
  admin.use(require("./forms")({ db }));
  admin.use(require("./sms")());
  admin.use(require("./smsCampaigns")());
  admin.use(appearance.router());
  admin.use(require("./admin")({ db }));
  // Pages publiques (désinscription, préférences, suivi, formulaires) ; les webhooks sont montés à part (corps brut, avant l'analyse JSON)
  const publicRoutes = express.Router();
  publicRoutes.use(require("./public")({ db }));
  publicRoutes.use(require("./tracking")({ db }));
  publicRoutes.use(require("./visitorsPublic")({ db }));
  publicRoutes.use(require("./formsPublic")({ db }));
  publicRoutes.use(require("./landingPublic")({ db }));
  publicRoutes.use(require("./surveysPublic")({ db }));
  publicRoutes.use(require("./smsPublic")({ db }));
  publicRoutes.use(require("./socialPublic")({ db }));
  // API /api/v1 : authentification par clé, jamais par cookie — montée séparément (voir server.js)
  const { createApiRouter } = require("../api/router");
  return { admin, publicRoutes, webhooks: require("./webhooks")({ db }), api: createApiRouter({ db }) };
}

module.exports = { createMarketingRouters };
