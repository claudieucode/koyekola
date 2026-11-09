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
  // Site visé par la requête : table déclarative des règles (R3, anomalie A-07) — web/routeScopes.js. Le comportement est celui de l'ancienne cascade d'expressions régulières.
  const { siteOfRequest: scopeOf } = require("./routeScopes");
  const siteOfRequest = (req) => scopeOf(db, req);
  // Site choisi (?site=) ; pour les écrans de contenu (articles, commentaires) un formulaire l'envoie aussi dans le champ « site » (R6 lot 2) : lu seulement pour ces écrans
  const contentSiteRaw = (req) => (req.query.site !== undefined ? req.query.site : /^\/site-web\/(?:articles|commentaires)(?:\/|$)/.test(req.path) && req.body ? req.body.site : undefined);
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
      const allowedHere = req.path === "/site-web/mes-sites" || /^\/site-web\/profil(?:\/|$)/.test(req.path) || (siteId !== null && mySites.some((s) => s.site_id === siteId));
      if (!allowedHere) return (scope || req.method !== "GET") ? res.status(403).render("error", { message: "Vous n'avez pas accès à cette ressource." }) : res.redirect("/marketing/site-web/mes-sites");
    }
    const perms = access.effectivePermissions(user.id, { organizationId: orgId, siteId });
    const allowed = (permission) => permission === "profile.self" || perms.has(permission); // « profile.self » : son PROPRE profil, ouvert à toute personne connectée qui a accès à l'administration
    const role = membership ? membership.role : "site";
    // Contexte de site (palier 2) : calculé pour CETTE requête seulement, à partir de la base (jamais d'état partagé). req.mk.site = le site visé,
    // ou null (site principal / écran sans site) ; req.mk.siteContext = le détail du contrôle (reason : not_found, deleted, archived, forbidden).
    const siteContext = require("../../services/siteContext");
    const sc = siteId !== null ? siteContext.resolve(db, { userId: user.id, organizationId: orgId }, siteId, { allowArchived: true, allowDeleted: true }) : null;
    req.mk = {
      site: sc && sc.ok ? sc.site : null, siteContext: sc,
      role, can: allowed, perms, siteId, marketing, siteOnly: !membership,
      // Email Engine (palier 16) : accès limité à un site → siteScope impose ce site à tout le moteur (jamais lu dans l'adresse) ; équipe de l'organisation → simple filtre d'affichage
      ctx: { db, organizationId: orgId, userId: user.id, can: allowed, canOn: (target, permission) => siteContext.canOn(db, { userId: user.id, organizationId: orgId }, target, permission), bus: marketing.bus, settings: marketing.settings, tokenKey: process.env.ENCRYPTION_KEY, baseUrl: process.env.SITE_URL,
        ...(membership ? { siteFilter: /^\d{1,12}$/.test(String(contentSiteRaw(req) ?? "")) ? Number(contentSiteRaw(req)) : req.query.site === "principal" ? "principal" : undefined } : { siteScope: Number.isInteger(siteId) ? siteId : -1 }) },
    };
    res.locals.mk = { role, can: allowed, ctx: req.mk.ctx };
    // R7 lot 6.0 : écrans des six moteurs secondaires — un accès LIMITÉ à un site n'y entre que si le module est activé pour CE site (en plus des permissions et de la portée des routes) ; jamais pour un site inconnu
    if (require("../siteModules").denies(req.mk, req.path, db, orgId)) return res.status(403).render("error", { message: "Ce module n'est pas activé pour ce site." });
    // Écrans de contenu d'un site (R6 lot 2) : le site courant est conservé dans les formulaires (champ caché « site »)
    res.locals.mkToken = () => require("crypto").randomBytes(16).toString("hex"); // jeton à usage unique d'un formulaire (idempotence des créations : PAGES-02)
    { const s = require("../../services/siteContent").siteParam(req.mk.ctx); res.locals.mkSiteField = s ? `<input type="hidden" name="site" value="${s}">` : ""; res.locals.mkSiteId = s; res.locals.mkNavUrl = (u) => (s && typeof u === "string" && /^\/marketing\/site-web\/(?:articles|commentaires)(?:[/?#]|$)/.test(u) && !/[?&]site=/.test(u) ? u + (u.includes("?") ? "&" : "?") + "site=" + s : u); res.locals.mkRestricted = Number.isInteger(req.mk.ctx.siteScope) && req.mk.ctx.siteScope > 0; }
    // R8 lot 3 : écrans Contacts et Formulaires — le site vérifié par le serveur est conservé dans leurs liens et formulaires
    if (/^\/(?:contacts|formulaires)(?:\/|$)/.test(req.path) || /^\/site-web\/(?:navigation|apparence\/menus)(?:\/|$)/.test(req.path) || /^\/site-web\/sites\/\d+\/(?:contacts|formulaires|navigation)(?:\/|$)/.test(req.path)) require("./siteCarry").install(req, res, (() => { const p = /^\/site-web\/sites\/(\d+)\//.exec(req.path); if (p && req.mk.siteId === Number(p[1])) return Number(p[1]); if (req.mk.site && Number.isInteger(req.mk.siteId)) return req.mk.siteId; return require("../../services/siteContent").siteParam(req.mk.ctx); })()); // site vérifié par le serveur : celui de l'adresse d'un espace, ou de la ressource (fiche d'un formulaire du site), ou du paramètre validé
    // Email Engine (palier 16) : sites proposés / site imposé, disponibles pour les écrans des audiences, segments, modèles et campagnes
    if (/^\/(?:campagnes|listes|segments|modeles|automatisations|tunnels)(?:\/|$)/.test(req.path)) Object.assign(res.locals, require("./kit").siteChoices(req));
    res.locals.mkTheme = themeOf(marketing.settings, orgId, user.id); // Paramètres → Apparence
    res.locals.mkUserTheme = require("../../services/accountProfile").themeOf(user.id); // Comptes → Profil : thème enregistré (repris sur chaque appareil sans choix local)
    res.locals.mkh = helpers;
    // Message « flash » : affiché une seule fois après une action
    res.locals.flash = req.session.mkFlash ?? null;
    if (req.session.mkFlash) delete req.session.mkFlash;
    next();
  });

  // R9-4 : la ligne dédiée du site principal (créée par la migration explicite R9-3) n'est pas un site ordinaire : son adresse « /sites/<id> » renvoie vers l'espace du principal (aucun contenu ne peut lui être rattaché par erreur)
  admin.use((req, res, next) => {
    const m = req.method === "GET" ? /^\/site-web\/sites\/(\d{1,12})(\/.*)?$/.exec(req.path) : null;
    if (!m || req.mk.siteOnly) return next();
    const prim = require("../../services/primarySite").row(db, req.mk.ctx.organizationId);
    if (prim && prim.id === Number(m[1])) return res.redirect(302, `/marketing/site-web/principal${m[2] || "/tableau-de-bord"}`);
    next();
  });
  admin.use(require("./siteSpace").attach); // contexte de l'espace d'un site (palier 3, B1) : avant les routeurs qui affichent des écrans
  admin.use(require("./siteModules")()); // R7 lot 6.0 : activation des modules par site (équipe seulement)
  admin.use(require("./aiMedia")()); // Programme 21.7 : médias IA et gestionnaire de ressources (génération asynchrone, provenance, affectation aux pages)
  admin.use(require("./designGenerator")()); // Programme 21.5 : direction artistique générée (brouillon des styles)
  admin.use(require("./pageGenerator")()); // Programme 21.4 : générateur de pages natives à partir d'un plan (brouillons uniquement)
  admin.use(require("./contentGenerator")()); // Programme 21.6 : générateur de contenus (textes des sections natives, SEO, révisions, brouillon)
  admin.use(require("./regeneration")()); // Programme 21.9 : régénération intelligente et historique (brouillons seulement)
  admin.use(require("./layouts")()); // Programme 22.3 : mises en page avancées (compositions natives, brouillons seulement)
  admin.use(require("./performance")()); // Programme 22.9 : tableau de bord de performance des pages publiées
  admin.use(require("./responsiveStudio")()); // Programme 22.8 : diagnostic et corrections responsive (brouillons seulement)
  admin.use(require("./themeBuilder")()); // Programme 23.1 : Theme Builder par site (modèles, conditions, résolution)
  admin.use(require("./footerAppearance")()); // Pied de page : apparence indépendante / charte du site / ancien comportement (frontière de pied)
  admin.use(require("./footerRevisions")()); // Pied de page, chantier E : historique des révisions, aperçu, comparaison, restauration en brouillon
  admin.use(require("./contentIntel")()); // Programme 22.6 : intelligence éditoriale et qualité SEO (analyse, propositions ; brouillons seulement)
  admin.use(require("./aiBuilder")()); // Programme 21.8 : interface « Assistant IA » de création de site (orchestre 21.3 à 21.6, aucune logique de moteur)
  admin.use(require("./aiShop")()); // Programme 21.10 : constructeur de boutique par IA (orchestre le moteur e-commerce 20.5, aucune logique commerciale)
  admin.use(require("./siteWizard")()); // Programme 20.6 : assistant de création guidée d'un site (orchestre les services existants)
  admin.use(require("./siteDomains")()); // TITAN XXXII : domaines des sites (registre, vérification de propriété, DNS, HTTPS)
  admin.use(require("./contactRequests")()); // R7 lot 5 : demandes de rattachement de contacts entre sites — avant contactCore et admin.js (« /contacts/:id »)
  admin.use(require("./contactCore")()); // Contact Core (palier 15) : doublons, fusion, cycle de vie, état, journal — avant admin.js (« /contacts/:id »)
  admin.use(require("./segments")({ db }));
  admin.use(require("./templates")({ db }));
  admin.use(require("./campaigns")({ db }));
  admin.use(require("./rss")());
  admin.use(require("./landing")());
  admin.use(require("./siteWeb")());
  admin.use(require("./shopAdmin")()); // Programme 20.5 : boutique d'un site (produits, commandes, clients, réglages) — avant l'espace du site
  admin.use(require("./siteSeo")()); // R8 lot 6C : SEO d'un site (réglages, redirections, 404) — avant l'espace du site (ses routes /sites/:id/redirections sont plus précises)
  admin.use(require("./siteSpace")()); // Espace d'administration d'UN site (palier 3, B1) : après siteWeb (ses routes /sites/:id/… sont plus précises)
  admin.use(require("./funnels")());
  admin.use(require("./pageTests")());
  admin.use(require("./articles")()); // KOLAKISA CMS → Articles (palier 4) : gestion des articles du blog
  admin.use(require("./taxonomies")()); // Catégories et étiquettes (palier 5)
  admin.use(require("./businessSettings")()); // Paramètres → Données de l'entreprise (pied de page) — avant le moteur de réglages
  admin.use(require("./settings")()); // Paramètres : moteur de réglages (palier 14) — avant les modules qui avaient leur propre écran
  admin.use(require("./comments")()); // Commentaires : modération et réglages (palier 6)
  admin.use(require("./navigation")()); // Navigation : menus, éléments, emplacements (palier 7)
  admin.use(require("./history")()); // Historique des modifications et corbeille commune (palier 10)
  admin.use(require("./users")()); // Utilisateurs, rôles, permissions, invitations (palier 9)
  admin.use(require("./profile")()); // Comptes → Profil : profil personnel de la personne connectée
  admin.use(require("./siteUsers")()); // Utilisateurs d'UN site : équipe locale, invitations, rôles et permissions (lecture)
  admin.use(require("./themes")()); // Apparence → Thèmes : thèmes installés et thème actif par site
  admin.use(require("./themeDemo")()); // Apparence → Thèmes : aperçu complet (site de démonstration isolé) d'un thème de la bibliothèque
  admin.use(require("./fonts")()); // Apparence → Polices : bibliothèque, téléversement et installation de polices par site
  admin.use(require("./adminBar")()); // Barre d'administration : notifications du site actif
  admin.use(require("./widgets")()); // Apparence → Widgets : zones, blocs et widgets désactivés par site
  admin.use(require("./personnaliser")()); // Personnaliser : coque de l'écran plein cadre (étape 1)
  admin.use(require("./styles")()); // Apparence → Styles : gestionnaire de styles globaux par site 
  admin.use(require("./siteEditor")()); // Apparence → Éditeur du site : espace de travail par site autour du Page Builder (pages, parties globales, aperçu, publication)
  admin.use(require("./templatesLibrary")()); // Apparence → Templates : packs de site, gabarits de pages et « Mes modèles » par site (aperçu, importation)
  admin.use(require("./patternsLibrary")()); // Apparence → Patterns : bibliothèque de compositions réutilisables par site (aperçu, insertion dans une page)
  admin.use(require("./appearanceEditor")()); // Apparence : éditeur du site, styles, en-tête, pied de page, templates, patterns (palier 8)
  admin.use(require("./tools")()); // Outils : santé, import, export, diagnostic, maintenance (palier 13)
  admin.use(require("./cmsSearch")()); // Recherche d'administration : pages, articles, médias, menus (palier 23)
  admin.use(require("./urls")()); // Redirections, liens cassés, permaliens et adresses (palier 12)
  admin.use(require("./mediaLibrary")()); // KOLAKISA CMS → Médias (palier 3) : page et API de la médiathèque
  admin.use(require("./cmsScreens")()); // écrans de KOLAKISA CMS (lecture seule, tables existantes) : après les routes /site-web déjà en place
  admin.use(require("./scoring")());
  admin.use(require("./surveys")());
  admin.use(require("./ai")());
  admin.use(require("./aiPlanner")()); // Programme 21.3 : Brief Analyzer et Site Planner (API JSON, /ia/site/…)
  admin.use(require("./domains")());
  admin.use(require("./social")());
  admin.use(require("./automations")({ db }));
  admin.use(require("./imports")({ db }));
  admin.use(require("./analytics")({ db }));
  admin.use(require("./revenue")({ db }));
  admin.use(require("./apiKeys")({ db }));
  admin.use(require("./webhooksOut")({ db }));
  admin.use(require("./mailchimp")({ db })); // Intégration Mailchimp (API Marketing v3 et Transactional)
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
  publicRoutes.use(require("./shopPublic")({ db })); // Programme 20.5 : boutique publique (/boutique) du site de l'hôte
  publicRoutes.use(require("./surveysPublic")({ db }));
  publicRoutes.use(require("./smsPublic")({ db }));
  publicRoutes.use(require("./socialPublic")({ db }));
  publicRoutes.use(require("./themeArtPublic")()); // visuels originaux des thèmes de la bibliothèque (SVG générés)
  publicRoutes.use(require("./themePackPublic")()); // fichiers CSS et JS des thèmes autonomes (paquets)
  publicRoutes.use(require("./privacyExportPublic")({ db })); // confirmation et téléchargement d'un export de données personnelles (lien à jeton)
  // API /api/v1 : authentification par clé, jamais par cookie — montée séparément (voir server.js)
  const { createApiRouter } = require("../api/router");
  return { admin, publicRoutes, webhooks: require("./webhooks")({ db }), api: createApiRouter({ db }) };
}

module.exports = { createMarketingRouters };
