const { LANGUAGES, languageLabel, avatarColor, formatPrice, formatAmount, formatDate, formatDateTime, formatDuration, formatClock, isNewCourse, levelLabel } = require("../utils/format");
const { icon, starRow } = require("../utils/icons");
const db = require("../config/database");
const { parseVideoUrl } = require("../utils/video");
const { asset } = require("../utils/assets");
const { renderMarkdown } = require("../utils/markdown");
const { signedBunnyUrl } = require("../utils/bunny");
const { absoluteUrl, plainText, jsonLdTags } = require("../utils/seo");
const { slugify } = require("../utils/format");
const seoResolver = require("../seo/resolver");
const { paidCheckoutOpen } = require("../services/payment");
const navigation = require("../services/navigation");

// Espaces privés et pages sans intérêt pour les moteurs de recherche
const NOINDEX_PREFIXES = ["/formateur", "/mes-cours", "/panier", "/commande", "/apprendre", "/certificat", "/favoris", "/support", "/notifications", "/connexion", "/inscription", "/deconnexion", "/mon-compte"];

function injectLocals(req, res, next) {
  res.locals.absoluteUrl = (urlPath) => absoluteUrl(req, urlPath);
  res.locals.currentPath = req.path;
  res.locals.plainText = plainText;
  res.locals.slugify = slugify;
  res.locals.jsonLdTags = jsonLdTags;
  res.locals.seoHead = (seo, title) => seoResolver.finalize(req, req.path, seo, title);
  // Réglages de référencement de la page (les routes publiques les précisent en passant `seo` à la vue)
  res.locals.seo = NOINDEX_PREFIXES.some((p) => req.path === p || req.path.startsWith(p + "/")) ? { noindex: true } : {};
  res.locals.signedBunnyUrl = signedBunnyUrl;
  res.locals.parseVideoUrl = parseVideoUrl;
  res.locals.renderMarkdown = renderMarkdown;
  res.locals.asset = asset;
  // Menus de navigation du CMS par emplacement (header, footer, mobile) : null = aucun menu affecté, la page garde son affichage d'origine.
  // Calculés à la demande (seulement par l'en-tête et le pied de page publics) et une seule fois par requête, toujours à jour.
  const menus = new Map();
  res.locals.navMenu = (location) => {
    if (!menus.has(location)) menus.set(location, navigation.forLocation(location, { user: req.session && req.session.user ? req.session.user : null }));
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
  res.locals.starRow = starRow;
  next();
}

module.exports = { injectLocals };
