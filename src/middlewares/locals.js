const { LANGUAGES, languageLabel, avatarColor, formatPrice, formatAmount, formatDate, formatDateTime, formatDuration, formatClock, isNewCourse, levelLabel } = require("../utils/format");
const { icon, starRow } = require("../utils/icons");
const { illu } = require("../utils/illustrations");
const db = require("../config/database");
const { parseVideoUrl } = require("../utils/video");
const { asset } = require("../utils/assets");
const { renderMarkdown } = require("../utils/markdown");
const { imageSource } = require("../marketing/media/variants");
const { signedBunnyUrl } = require("../utils/bunny");
const { absoluteUrl, plainText, jsonLdTags } = require("../utils/seo");
const { slugify } = require("../utils/format");
const seoResolver = require("../seo/resolver");
const { paidCheckoutOpen } = require("../services/payment");
const navigation = require("../services/navigation");
const appearance = require("../services/appearance");
const cmsAccess = require("../services/cmsAccess");

// Espaces privés et pages sans intérêt pour les moteurs de recherche
const NOINDEX_PREFIXES = ["/formateur", "/mes-cours", "/panier", "/commande", "/apprendre", "/certificat", "/favoris", "/support", "/notifications", "/connexion", "/inscription", "/deconnexion", "/mon-compte"];

// Adresse de la page de confidentialité choisie dans les réglages (page publiée du CMS) ; sinon aucune
function privacyUrlOf(m) {
  if (!m.privacyPage) return null;
  const row = require("../config/database").prepare("SELECT id, slug, site_id, status, archived_at FROM mk_landing_pages WHERE id = ?").get(m.privacyPage);
  return row && row.status === "published" && !row.archived_at ? require("../services/urls").pagePath(row, { hostSite: null }) : null;
}
function injectLocals(req, res, next) {
  res.locals.absoluteUrl = (urlPath) => absoluteUrl(req, urlPath);
  res.locals.currentPath = req.path;
  res.locals.plainText = plainText;
  res.locals.slugify = slugify;
  res.locals.jsonLdTags = jsonLdTags;
  // Réglages du site principal (palier 14) : langue de la page, dates dans le fuseau et les formats choisis
  try { const m = require("../services/settings").main(); res.locals.htmlLang = m.htmlLang; res.locals.privacyUrl = privacyUrlOf(m); } catch { res.locals.htmlLang = "fr"; res.locals.privacyUrl = null; }
  // Page de confidentialité d'un site du CMS (réglage du site) ou, à défaut, celle du site principal
  res.locals.privacyFor = (site) => {
    const id = site && site.settings && site.settings.general ? site.settings.general.privacyPageId : null;
    if (!id) return res.locals.privacyUrl;
    const row = db.prepare("SELECT id, slug, site_id, status, archived_at FROM mk_landing_pages WHERE id = ?").get(id);
    return row && row.status === "published" && !row.archived_at ? require("../services/urls").pagePath(row, { hostSite: req.kwSite || null }) : null;
  };
  // Date d'un instant dans la langue, le fuseau et les formats d'un site (ou du site principal) : jamais de fuseau codé en dur
  res.locals.siteDate = (value, site = null, withTime = false) => {
    const g = site && site.settings && site.settings.general;
    const cfg = g ? { locale: ({ fr: "fr-FR", en: "en-US", es: "es-ES", pt: "pt-PT", de: "de-DE", it: "it-IT", ar: "ar", sw: "sw" })[(site.settings.extras || {}).language] || "fr-FR", timeZone: g.timezone, dateFormat: g.dateFormat, timeFormat: g.timeFormat } : null;
    return require("../utils/format").formatInstant(value, cfg, { withTime });
  };
  res.locals.seoHead = (seo, title) => seoResolver.finalize(req, req.path, seo, title);
  // Balises SEO d'une page du CMS (/p/…) : même moteur, avec les réglages de la page et du site
  res.locals.webPageSeo = (page, site, preview) => require("../seo/webPages").head(req, { page, site, preview: Boolean(preview) });
  // Réglages de référencement de la page (les routes publiques les précisent en passant `seo` à la vue)
  res.locals.seo = NOINDEX_PREFIXES.some((p) => req.path === p || req.path.startsWith(p + "/")) ? { noindex: true } : {};
  res.locals.signedBunnyUrl = signedBunnyUrl;
  res.locals.parseVideoUrl = parseVideoUrl;
  res.locals.renderMarkdown = renderMarkdown;
  res.locals.nodeLinkCount = (node) => { try { return require("../marketing/landing").linksOf({ sections: [{ type: "layout", children: [node] }] }).length; } catch { return 0; } }; // liens cliquables d'un élément (recalage du compteur si son rendu échoue)
  res.locals.imageSource = imageSource; // résolution choisie d'un widget image (src, srcset, sizes)
  res.locals.asset = asset;
  res.locals.httpStatus = () => res.statusCode; // code de la réponse en cours (pages d'erreur : titre et message adaptés)
  // Apparence du site (CMS → Apparence) : styles, en-tête, pied de page. Version publiée ; en aperçu (?kwpreview=1, équipe seulement) le brouillon.
  // Une configuration absente = l'affichage d'origine, intact. Une seule lecture par requête.
  let apCache = null;
  res.locals.appearance = () => {
    if (!apCache) {
      let preview = false;
      if (req.query && req.query.kwpreview === "1" && req.session && req.session.user) {
        const u = req.session.user;
        try { const org = (db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get() || {}).id; preview = u.role === "formateur" || Boolean(org && cmsAccess.can(u.id, "appearance.styles", { organizationId: org })); } catch { preview = false; }
      }
      try { apCache = appearance.parts({ preview }); } catch { apCache = appearance.parts({ preview: false }); }
    }
    return apCache;
  };
  if (req.query && req.query.kwtheme) require("./themePreview").attach(req, res); // aperçu d'un thème (équipe autorisée seulement)
  if (req.query && req.query.kwcustom === "1") require("./customizerPreview").attach(req, res); // aperçu du personnalisateur (réglages en cours de la session, équipe autorisée seulement)
  // Zones de widgets (Apparence → Widgets) : HTML déjà validé de la zone DU SITE de la requête (domaine d'un site, sinon site principal) ; « » si rien à afficher.
  // widgetZoneFor(siteId, zone) : pour les gabarits qui connaissent leur site (pages d'un site). Lecture à la demande, jamais mise en cache.
  res.locals.widgetZone = (zone) => require("../services/widgets").renderZone(req.kwSite ? req.kwSite.id : null, zone);
  res.locals.widgetZoneFor = (siteId, zone) => require("../services/widgets").renderZone(Number.isInteger(siteId) && siteId > 0 ? siteId : null, zone);
  // Menus de navigation du CMS par emplacement (header, footer, mobile) : null = aucun menu affecté, la page garde son affichage d'origine.
  // Calculés à la demande (seulement par l'en-tête et le pied de page publics) et une seule fois par requête, toujours à jour.
  const menus = new Map();
  res.locals.navMenu = (location) => {
    if (!menus.has(location)) menus.set(location, navigation.forLocation(location, { siteId: req.kwSite ? req.kwSite.id : null, user: req.session && req.session.user ? req.session.user : null }));
    return menus.get(location);
  };
  // Élément « courant » : son adresse (sans paramètres ni ancre) est celle de la page affichée
  res.locals.navIsCurrent = (href) => Boolean(href) && href.startsWith("/") && href.split(/[?#]/)[0].replace(/\/+$/, "") === String(req.path).replace(/\/+$/, "") && !(href === "/" && req.path !== "/");
  // Catégories des formations publiées, pour le menu « Catégories » de l'en-tête
  res.locals.navCategories = db
    .prepare("SELECT DISTINCT category FROM courses WHERE published = 1 ORDER BY category")
    .all()
    .map((row) => row.category);
  // Le panier n'existe que pour les utilisateurs connectés : un simple visiteur (ou un robot)
  // ne doit pas créer de session enregistrée en base à chaque page vue.
  if (req.session.user && !req.session.cart) req.session.cart = {};
  res.locals.currentUser = req.session.user || null;
  res.locals.cartCount = Object.keys(req.session.cart || {}).length;
  // Achat des formations payantes possible (mode démonstration) ou fermé tant qu'aucun paiement réel n'est branché
  res.locals.paidCheckoutOpen = paidCheckoutOpen();
  // Cloche de l'en-tête : notifications non lues d'un élève (le formateur a le flux d'activité de Mon espace). Une panne n'affiche rien.
  res.locals.notifCount = 0;
  if (req.session.user && req.session.user.role !== "formateur") {
    try { res.locals.notifCount = require("../services/notifications").unreadCount(req.session.user.id); } catch { /* pas de badge */ }
  }
  // « Mon espace » : coquille de tableau de bord (barre latérale, apparence personnelle) au lieu de l'en-tête public
  res.locals.dash = null;
  if (req.session.user && req.session.user.role === "formateur" && /^\/formateur(\/|$)/.test(req.path)) {
    const dashboard = require("../services/dashboard");
    const prefs = dashboard.prefsOf(req.session.user.id);
    const seo = dashboard.isSeoPath(req.path);
    const gestion = dashboard.isGestionPath(req.path);
    res.locals.dash = {
      seo, gestion, module: seo ? dashboard.MODULES.seo : gestion ? dashboard.MODULES.gestion : null, globalNav: dashboard.NAV, path: req.path, crumbs: (title) => dashboard.crumbs(req.path, title),
      active: seo ? dashboard.seoActiveKey(req.path) : gestion ? dashboard.gestionActiveKey(req.path) : dashboard.activeKey(req.path), nav: seo ? dashboard.SEO_NAV : gestion ? dashboard.GESTION_NAV : dashboard.NAV, prefs, style: dashboard.style(prefs),
      tasks: seo ? require("../seo/tasks").openCount() : 0,
      support: (() => { try { return require("../services/support").openCount(req.session.user.id); } catch { return 0; } })(), // tickets en attente de réponse
      unread: db.prepare("SELECT COUNT(*) n FROM contact_messages WHERE read_at IS NULL").get().n,
      // Notifications non lues du Centre de gestion (données réelles ; badge de la navigation)
      // (un échec ne doit jamais empêcher l'affichage de Mon espace : pas de badge dans ce cas)
      notifications: (() => { try { return require("../services/gestion/activity").unreadCount(req.session.user.id); } catch (error) { console.error("[KOLAKISA] Badge des notifications :", error.message); return 0; } })(),
    };
  }
  // Espace Marketing (application à part, sous /marketing) : la navigation générale de « Mon espace » reste visible (rail)
  res.locals.appRail = null;
  if (req.session.user && req.session.user.role === "formateur" && /^\/marketing(\/|$)/.test(req.path)) {
    const dashboard = require("../services/dashboard");
    const prefs = dashboard.prefsOf(req.session.user.id);
    res.locals.appRail = { path: req.originalUrl.split("?")[0], nav: dashboard.NAV, active: "marketing", style: dashboard.style(prefs), unread: db.prepare("SELECT COUNT(*) n FROM contact_messages WHERE read_at IS NULL").get().n };
  }
  res.locals.avatarColor = avatarColor;
  res.locals.LANGUAGES = LANGUAGES;
  res.locals.languageLabel = languageLabel;
  res.locals.formatPrice = formatPrice;
  res.locals.formatAmount = formatAmount;
  res.locals.formatDate = formatDate;
  res.locals.formatDateTime = formatDateTime;
  res.locals.formatDuration = formatDuration;
  res.locals.formatClock = formatClock;
  res.locals.isNewCourse = isNewCourse;
  res.locals.levelLabel = levelLabel;
  res.locals.icon = icon;
  res.locals.illu = illu; // illustrations de l'administration (src/utils/illustrations.js)
  // Adresses publiques des articles et des archives : celles du moteur de permaliens (structure et préfixes du site), jamais un « /blog/… » écrit à la main
  const urlsSvc = require("../services/urls");
  res.locals.postUrl = (post) => urlsSvc.publicPath("post", post);
  res.locals.termUrl = (key, slug) => `${require("../services/permalinks").baseFor(key, req.kwSite ? req.kwSite.id : null) || require("../services/taxonomy").defaultBase(key)}/${slug}`;
  res.locals.starRow = starRow;
  next();
}

module.exports = { injectLocals };
