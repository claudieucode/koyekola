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

// Espaces privés et pages sans intérêt pour les moteurs de recherche
const NOINDEX_PREFIXES = ["/formateur", "/mes-cours", "/panier", "/commande", "/apprendre", "/certificat", "/favoris", "/connexion", "/inscription", "/deconnexion"];

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
  // « Mon espace » : coquille de tableau de bord (barre latérale, apparence personnelle) au lieu de l'en-tête public
  res.locals.dash = null;
  if (req.session.user && req.session.user.role === "formateur" && /^\/formateur(\/|$)/.test(req.path)) {
    const dashboard = require("../services/dashboard");
    const prefs = dashboard.prefsOf(req.session.user.id);
    res.locals.dash = {
      active: dashboard.activeKey(req.path), nav: dashboard.NAV, prefs, style: dashboard.style(prefs),
      unread: db.prepare("SELECT COUNT(*) n FROM contact_messages WHERE read_at IS NULL").get().n,
    };
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
