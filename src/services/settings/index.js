// KOLAKISA — Moteur de réglages (palier 14). Une COUCHE de configuration au-dessus des stockages qui existent déjà : il n'ajoute ni table, ni second
// système de paramètres. Chaque réglage a une définition (clé, groupe, type, valeur par défaut, portée, validation, permission) et UNE source de vérité :
//   • réglages du SITE PRINCIPAL (organisation) : table mk_settings (clés « cms.* »), ou le moteur propriétaire quand il existe (SEO : seo_settings ;
//     commentaires : comments.settings ; langue : og_locale) — le moteur de réglages n'en garde jamais de copie ;
//   • réglages d'un SITE du CMS : mk_sites (nom, page d'accueil, colonne settings : identité, SEO du site, indexation, général) — avec révision et historique ;
//   • PRÉFÉRENCES D'UNE PERSONNE : table user_prefs (jamais modifiables par l'API des réglages du site) ;
//   • réglages de la PLATEFORME (variables d'environnement, secrets, indicateurs techniques) : lecture seule, jamais modifiables depuis le CMS.
// Les moteurs restent propriétaires de leur logique (URL, SEO, commentaires, médias…) : les réglages les CONFIGURENT et ils s'exécutent.
const db = require("../../config/database");
const primarySite = require("../primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire
const { transaction } = require("../../marketing/db/tx");
const { UserError } = require("../../utils/errors");

const PREFIX = "cms.";
const MAX_VALUE = 8192;
const GROUPS = {
  general: { label: "Général", intro: "Identité du site, langue, fuseau horaire et formats de date." },
  reading: { label: "Lecture", intro: "Page d'accueil et affichage des archives du blog." },
  comments: { label: "Commentaires", intro: "Réglages globaux du moteur de commentaires (la modération se fait dans Commentaires)." },
  media: { label: "Médias", intro: "Limites d'envoi des fichiers dans la médiathèque." },
  permalinks: { label: "Permaliens", intro: "Normalisation des adresses ; la structure est gérée par le moteur d'adresses." },
  seo: { label: "SEO", intro: "Valeurs par défaut du référencement (le moteur SEO reste la référence)." },
  privacy: { label: "Confidentialité", intro: "Page de politique de confidentialité, liée depuis le bandeau et le pied de page." },
  indexation: { label: "Indexation", intro: "Visibilité du site pour les moteurs de recherche." },
  tunnels: { label: "Tunnels", intro: "Quand considère-t-on qu'un parcours est abandonné ? Un abandon n'est jamais déduit d'une simple absence immédiate : il faut un délai sans aucune activité." },
  email: { label: "Emailing", intro: "Identité d'expédition des e-mails marketing. Le fournisseur, ses clés secrètes et les limites d'envoi se règlent dans Marketing → Envoi (jamais ici)." },
};
const TIMEZONES = (() => { try { return Intl.supportedValuesOf("timeZone"); } catch { return ["Europe/Paris", "UTC"]; } })();
const validTimezone = (tz) => typeof tz === "string" && tz.length <= 60 && (TIMEZONES.includes(tz) || tz === "UTC") ;

// ---------- Accès aux stockages ----------
const orgId = () => (db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get() || {}).id || null;
let kvCache = null;
function kvAll() {
  if (kvCache) return kvCache;
  const org = orgId();
  const rows = org ? db.prepare("SELECT key, value FROM mk_settings WHERE organization_id = ? AND key LIKE 'cms.%' AND is_secret = 0").all(org) : [];
  kvCache = Object.fromEntries(rows.map((r) => [r.key.slice(PREFIX.length), r.value]));
  return kvCache;
}
function kvSet(key, value) {
  const org = orgId();
  if (!org) throw new UserError("Aucune organisation.");
  if (String(value).length > MAX_VALUE) throw new UserError("Valeur trop longue.");
  db.prepare("INSERT INTO mk_settings (organization_id, key, value, is_secret) VALUES (?, ?, ?, 0) ON CONFLICT (organization_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')").run(org, PREFIX + key, String(value));
  kvCache = null;
}
function kvDel(key) {
  const org = orgId();
  if (org) db.prepare("DELETE FROM mk_settings WHERE organization_id = ? AND key = ?").run(org, PREFIX + key);
  kvCache = null;
}
const seo = () => require("../../seo/settings");
const pages = () => require("../../marketing/pages");
const comments = () => require("../comments");
const siteSettings = () => require("../../marketing/pages/siteSettings");

// Site du CMS : lecture et écriture passent par le service des sites (validation stricte, révision, historique)
const siteOf = (ctx, siteId) => pages().requireSite(ctx, siteId);
function writeSite(ctx, siteId, mutate) {
  const site = siteOf(ctx, siteId);
  const settings = JSON.parse(JSON.stringify(site.settings));
  mutate(settings);
  return pages().saveSiteDesign(ctx, siteId, { settings, revision: site.settings_revision });
}

// ---------- Définitions ----------
// scope : "main" (site principal) et / ou "site" (site du CMS) ; perm : droit requis ; sensitive : demande confirmation et le droit « settings.sensitive »
const LOCALES = { fr_FR: "Français (France)", fr_BE: "Français (Belgique)", fr_CA: "Français (Canada)", fr_CH: "Français (Suisse)", en_US: "English (US)", en_GB: "English (UK)" };
const DEFS = [];
const def = (d) => { DEFS.push({ perm: "settings.write", scopes: ["main", "site"], ...d }); };
const mainKv = (key, fallback) => ({ readMain: () => (key in kvAll() ? kvAll()[key] : fallback), writeMain: (v) => (v === "" || v === null || v === fallback ? kvDel(key) : kvSet(key, v)), defaultMain: fallback });
const seoField = (name) => ({ adapterValidate: (v) => seo().validate(name, typeof v === "boolean" ? (v ? "1" : "") : v), readMain: () => seo().get(name), writeMain: (v, ctx) => { const r = seo().save({ [name]: v }, ctx.userId); if (!r.ok) throw new UserError(r.errors.join(" ")); }, defaultMain: seo().FIELDS[name] ? seo().FIELDS[name].default : "" });

// --- Général ---
def({ key: "site_name", group: "general", label: "Nom du site", type: "string", max: 60, required: true, help: "Affiché dans les titres, le partage et les données structurées.",
  ...seoField("site_name"), readSite: (s) => s.name, writeSite: (v, ctx, siteId) => pages().updateSite(ctx, siteId, { name: v }), defaultSite: "" });
def({ key: "description", group: "general", label: "Slogan et description courte", type: "text", max: 160, maxSite: 300, help: "En quelques mots, ce que représente le site. Utilisé par les pages qui n'ont pas leur propre description (référencement, partage) : il n'est pas affiché automatiquement sur le site.",
  ...seoField("default_description"), readSite: (s) => s.settings.identity.description, writeSite: (v, ctx, siteId) => writeSite(ctx, siteId, (x) => { x.identity.description = v; }), defaultSite: "" });
def({ key: "language", group: "general", label: "Langue du site", type: "enum", help: "Langue déclarée dans chaque page (lecteurs d'écran, moteurs de recherche) et utilisée pour les dates. L'interface n'est pas traduite automatiquement.",
  options: (scope) => (scope.siteId ? Object.entries(siteSettings().LANGUAGES) : Object.entries(LOCALES)),
  ...seoField("og_locale"), readSite: (s) => s.settings.extras.language, writeSite: (v, ctx, siteId) => writeSite(ctx, siteId, (x) => { x.extras.language = v; }), defaultSite: "fr" });
def({ key: "timezone", group: "general", label: "Fuseau horaire", type: "timezone", help: "Fuseau d'affichage des dates. Les dates enregistrées restent en temps universel (UTC) : rien n'est converti en base.",
  ...mainKv("timezone", "Europe/Paris"), readSite: (s) => s.settings.general.timezone, writeSite: (v, ctx, siteId) => writeSite(ctx, siteId, (x) => { x.general.timezone = v; }), defaultSite: "Europe/Paris" });
def({ key: "date_format", group: "general", label: "Format de date", type: "enum", help: "Appliqué à toutes les dates affichées.",
  options: () => [["long", "Longue (9 octobre 2026)"], ["medium", "Moyenne (9 oct. 2026)"], ["short", "Courte, selon la langue (09/10/2026)"], ["iso", "AAAA-MM-JJ (2026-10-09)"], ["dmy", "JJ/MM/AAAA (09/10/2026)"], ["mdy", "MM/JJ/AAAA (10/09/2026)"], ["dots", "JJ.MM.AAAA (09.10.2026)"]],
  ...mainKv("date_format", "long"), readSite: (s) => s.settings.general.dateFormat, writeSite: (v, ctx, siteId) => writeSite(ctx, siteId, (x) => { x.general.dateFormat = v; }), defaultSite: "long" });
def({ key: "time_format", group: "general", label: "Format de l'heure", type: "enum", help: "24 heures ou 12 heures (AM / PM).",
  options: () => [["24h", "24 heures (14:30)"], ["12h", "12 heures (2:30 PM)"]],
  ...mainKv("time_format", "24h"), readSite: (s) => s.settings.general.timeFormat, writeSite: (v, ctx, siteId) => writeSite(ctx, siteId, (x) => { x.general.timeFormat = v; }), defaultSite: "24h" });
def({ key: "week_start", group: "general", label: "La semaine commence le", type: "enum", help: "Premier jour affiché dans les calendriers (sélecteur de date de l'éditeur d'articles).",
  options: () => [["monday", "Lundi"], ["sunday", "Dimanche"], ["saturday", "Samedi"]],
  ...mainKv("week_start", "monday"), readSite: (s) => s.settings.general.weekStart, writeSite: (v, ctx, siteId) => writeSite(ctx, siteId, (x) => { x.general.weekStart = v; }), defaultSite: "monday" });
def({ key: "site_slug", group: "general", label: "Identifiant du site", type: "slug", scopes: ["site"], sensitive: true, required: true, max: 60,
  help: "Lettres minuscules, chiffres et tirets. Il sert dans les adresses internes du site ; l'identifiant interne (n°) ne change jamais.",
  impact: "L'identifiant fait partie des adresses du site hébergé par KOLAKISA : les liens déjà diffusés avec l'ancien identifiant peuvent cesser de fonctionner.",
  readSite: (s) => s.slug, writeSite: (v, ctx, siteId) => pages().updateSite(ctx, siteId, { slug: v }), defaultSite: "" });
def({ key: "site_type", group: "general", label: "Type de site", type: "enum", scopes: ["site"], help: "Indicatif : aide à retrouver le site dans « Mes sites ».",
  options: () => Object.entries(pages().SITE_TYPES), readSite: (s) => s.site_type || "", writeSite: (v, ctx, siteId) => pages().updateSite(ctx, siteId, { siteType: v }), defaultSite: "" });
def({ key: "site_note", group: "general", label: "Note interne", type: "text", scopes: ["site"], max: 500, help: "Visible seulement dans « Mes sites » (jamais sur le site public).",
  readSite: (s) => s.description || "", writeSite: (v, ctx, siteId) => pages().updateSite(ctx, siteId, { description: v }), defaultSite: "" });
def({ key: "registration_open", group: "general", label: "Inscriptions publiques", type: "boolean", scopes: ["main"], sensitive: true,
  help: "Permet à tout visiteur de créer un compte étudiant (page « Inscription »). Décoché : la page d'inscription est fermée ; les comptes existants et les invitations de l'équipe ne changent pas.",
  impact: "Fermer les inscriptions empêche toute nouvelle personne de créer un compte étudiant sur la plateforme.",
  ...mainKv("registration_open", true) });
def({ key: "admin_email", group: "general", label: "E-mail administratif", type: "email", scopes: ["main"], help: "Reçoit les messages du formulaire de contact du site. Vide : l'adresse configurée par l'hébergeur est utilisée.", ...mainKv("admin_email", "") });
def({ key: "logo", group: "general", label: "Logo du site", type: "image", scopes: ["site"], help: "Image de la médiathèque (affichée dans le pied de page des pages du site). Le logo du site principal se règle dans Apparence.",
  readSite: (s) => s.settings.identity.logoUrl, writeSite: (v, ctx, siteId) => writeSite(ctx, siteId, (x) => { x.identity.logoUrl = v; }), defaultSite: "" });
def({ key: "favicon", group: "general", label: "Favicon", type: "image", scopes: ["site"], help: "Petite icône de l'onglet (PNG, SVG, ICO).",
  readSite: (s) => s.settings.identity.faviconUrl, writeSite: (v, ctx, siteId) => writeSite(ctx, siteId, (x) => { x.identity.faviconUrl = v; }), defaultSite: "" });
def({ key: "public_url", group: "general", label: "Domaine personnalisé", type: "url", scopes: ["site"], sensitive: true, help: "https://… sans chemin. Détermine le domaine servant ce site (adresses canoniques, plan du site, accueil à la racine).",
  impact: "Les adresses canoniques, le plan du site et l'accueil du site suivent ce domaine. Un domaine mal réglé fait sortir le site des moteurs de recherche.",
  readSite: (s) => s.settings.seo.publicUrl, writeSite: (v, ctx, siteId) => writeSite(ctx, siteId, (x) => { x.seo.publicUrl = v; }), defaultSite: "" });

// --- Lecture ---
def({ key: "homepage_page", group: "reading", label: "Page d'accueil", type: "page", sensitive: true, nullable: true, help: "Une page publiée du CMS affichée à la racine (« / »). Vide : l'accueil standard de KOLAKISA (site principal) ou aucune (site du CMS).",
  impact: "L'adresse « / » affichera cette page. Si la page est dépubliée ou supprimée plus tard, l'accueil standard reprend automatiquement.",
  ...mainKv("homepage_page", ""), readSite: (s) => s.home_page_id || null, writeSite: (v, ctx, siteId) => pages().setHomePage(ctx, siteId, v ? Number(v) : null), defaultSite: null });
def({ key: "posts_per_page", group: "reading", label: "Articles par page", type: "integer", min: 1, max: 50, scopes: ["main"], help: "Nombre d'articles affichés sur chaque page du blog et de ses archives.", ...mainKv("posts_per_page", 10) });

// --- Commentaires (moteur propriétaire : services/comments.js) ---
const comment = (key, label, extra) => def({ key: `comments_${key}`, group: "comments", label, scopes: ["main"], readMain: () => comments().settings()[key], writeMain: (v) => { comments().saveSettings({ [key]: v }); }, defaultMain: comments().DEFAULTS[key], ...extra });
comment("enabled_default", "Commentaires ouverts par défaut", { type: "boolean", help: "Pour chaque nouvel article." });
comment("guests_allowed", "Commentaires d'invités", { type: "boolean", help: "Autoriser les commentaires sans compte (avec nom et e-mail)." });
comment("moderation", "Modération", { type: "enum", options: () => [["none", "Aucune : publication immédiate"], ["first", "Premier commentaire d'une personne"], ["all", "Tous les commentaires"]], help: "Les commentaires en attente sont à approuver dans Commentaires." });
comment("replies_allowed", "Réponses imbriquées", { type: "boolean", help: "Autoriser de répondre à un commentaire." });
comment("max_depth", "Niveaux de réponses", { type: "integer", min: 1, max: 5, help: "1 = pas de réponses imbriquées." });
comment("links_allowed", "Liens dans les commentaires", { type: "boolean", help: "Sinon, un commentaire contenant un lien est refusé." });

// --- Médias (le moteur propriétaire : marketing/media) ---
const media = () => require("../../marketing/media");
const mediaLimit = (key, label, cap) => def({ key, group: "media", label, type: "integer", min: 1, scopes: ["main"], get max() { return Math.floor(cap() / 1048576); }, help: "En méga-octets. Le plafond du serveur ne peut pas être dépassé.", ...mainKv(key, null), defaultMain: null, dynamicDefault: () => Math.floor(cap() / 1048576) });
mediaLimit("media_max_image_mb", "Taille maximale d'une image", () => media().MAX_IMAGE);
mediaLimit("media_max_document_mb", "Taille maximale d'un document", () => media().MAX_DOCUMENT);
mediaLimit("media_max_audio_mb", "Taille maximale d'un fichier audio", () => media().MAX_AUDIO);
mediaLimit("media_max_video_mb", "Taille maximale d'une vidéo", () => media().MAX_VIDEO);

// --- Permaliens ---
def({ key: "normalize_paths", group: "permalinks", label: "Normaliser les adresses", type: "boolean", scopes: ["main"], sensitive: true, help: "Redirige (301) les adresses de contenu en majuscules ou avec une barre finale vers leur forme propre (/Blog/ → /blog).",
  impact: "Désactiver autorise des adresses en doublon (/Blog et /blog) : mauvais pour le référencement.", ...mainKv("normalize_paths", true) });

// --- SEO (moteur propriétaire : seo/) ---
def({ key: "title_separator", group: "seo", label: "Séparateur des titres", type: "enum", scopes: ["main"], perm: "seo.edit", options: () => seo().FIELDS.title_separator.choices.map((c) => [c, `« ${c.trim()} »`]), ...seoField("title_separator") });
def({ key: "title_template", group: "seo", label: "Modèle du titre des pages", type: "string", scopes: ["main"], perm: "seo.edit", max: 120, help: "Variables : {title}, {sep}, {site_name}.", ...seoField("title_template") });
def({ key: "default_social_image", group: "seo", label: "Image de partage par défaut", type: "image", scopes: ["main"], perm: "seo.edit", help: "Pour les pages sans image (idéalement 1200 × 630).", ...seoField("default_social_image") });
def({ key: "index_blog_tags", group: "seo", label: "Indexer les pages d'étiquettes", type: "boolean", scopes: ["main"], perm: "seo.edit", help: "Non conseillé : elles reprennent les articles des catégories.", ...seoField("index_blog_tags") });
def({ key: "index_authors", group: "seo", label: "Indexer les pages d'auteurs", type: "boolean", scopes: ["main"], perm: "seo.edit", ...seoField("index_authors") });
def({ key: "seo_site_title", group: "seo", label: "Nom du site dans les résultats", type: "string", scopes: ["site"], perm: "seo.edit", max: 70, help: "Ajouté après le titre de chaque page. Vide : le nom du site.",
  readSite: (s) => s.settings.seo.title, writeSite: (v, ctx, siteId) => writeSite(ctx, siteId, (x) => { x.seo.title = v; }), defaultSite: "" });
def({ key: "seo_site_image", group: "seo", label: "Image de partage par défaut", type: "image", scopes: ["site"], perm: "seo.edit", help: "Pour les pages du site sans image.",
  readSite: (s) => s.settings.seo.ogImage, writeSite: (v, ctx, siteId) => writeSite(ctx, siteId, (x) => { x.seo.ogImage = v; }), defaultSite: "" });
def({ key: "seo_follow", group: "seo", label: "Autoriser le suivi des liens", type: "boolean", scopes: ["site"], perm: "seo.edit", help: "Décoché : toutes les pages du site sont publiées en nofollow.",
  readSite: (s) => s.settings.seo.follow !== false, writeSite: (v, ctx, siteId) => writeSite(ctx, siteId, (x) => { x.seo.follow = v; }), defaultSite: true });

// --- Confidentialité ---
def({ key: "privacy_page", group: "privacy", label: "Page de politique de confidentialité", type: "page", nullable: true, help: "Une page publiée du CMS : un lien « Confidentialité » est ajouté au bandeau de consentement (site principal) ou au pied de page des pages du site. Aucune conformité juridique n'est déduite.",
  ...mainKv("privacy_page", ""), readSite: (s) => s.settings.general.privacyPageId || null, writeSite: (v, ctx, siteId) => writeSite(ctx, siteId, (x) => { x.general.privacyPageId = v ? Number(v) : null; }), defaultSite: null });

// --- Indexation ---
def({ key: "search_visibility", group: "indexation", label: "Visibilité pour les moteurs de recherche", type: "enum", sensitive: true,
  options: () => [["open", "Visible : les moteurs peuvent indexer le site"], ["closed", "Masqué : demander aux moteurs de ne pas indexer ce site"]],
  help: "Option extrêmement sensible : « masqué » retire le site des résultats de recherche.",
  impact: "Toutes les pages deviennent « noindex, nofollow » (balise, en-tête HTTP, robots.txt fermé pour le site principal) et sortent du plan du site. Le site disparaît des moteurs de recherche au fil de leurs passages.",
  ...mainKv("search_visibility", "open"), readSite: (s) => (s.settings.extras.noindex ? "closed" : "open"), writeSite: (v, ctx, siteId) => writeSite(ctx, siteId, (x) => { x.extras.noindex = v === "closed"; }), defaultSite: "open" });

// ---------- Validation (jamais de confiance envers le navigateur) ----------
const EMAIL = /^[^\s@<>"',;:\\()[\]]{1,64}@[A-Za-z0-9][A-Za-z0-9.-]{0,251}\.[A-Za-z]{2,}$/;
// --- Tunnels (palier 19) : délais d'abandon (lus par la détection des abandons, funnels/abandon.js) ---
def({ key: "analytics_retention_days", group: "privacy", label: "Conservation des visites suivies (jours)", type: "integer", min: 30, max: 1825, scopes: ["main"],
  help: "Durée de conservation des événements de visite (pages vues, clics…) des visiteurs ayant accepté la mesure. Au-delà, ils sont supprimés chaque jour. Par défaut 395 jours (13 mois).", ...mainKv("analytics_retention_days", 395) });
def({ key: "funnel_abandon_hours", group: "tunnels", label: "Abandon d'un tunnel après (heures sans activité)", type: "integer", min: 1, max: 720, scopes: ["main"],
  help: "Un contact qui a atteint une étape d'un tunnel, sans le terminer ni revenir pendant ce délai, produit « funnel.abandoned ». Par défaut 24 h.", ...mainKv("funnel_abandon_hours", 24) });
def({ key: "checkout_abandon_hours", group: "tunnels", label: "Abandon de commande après (heures)", type: "integer", min: 1, max: 168, scopes: ["main"],
  help: "Un contact qui a ouvert la page de commande sans commande terminée après ce délai produit « checkout.abandoned ». Par défaut 1 h.", ...mainKv("checkout_abandon_hours", 1) });
def({ key: "cart_abandon_hours", group: "tunnels", label: "Abandon du panier après (heures)", type: "integer", min: 1, max: 720, scopes: ["main"],
  help: "Un contact connu qui a ajouté une formation au panier, sans ouvrir la commande ni acheter pendant ce délai, produit « cart.abandoned ». Par défaut 24 h.", ...mainKv("cart_abandon_hours", 24) });

// --- Emailing (palier 16) : identité d'expédition ---
// Source de vérité : la configuration d'envoi du module Marketing (site principal) et mk_settings « email.site_<id>.* » (un site). Aucun secret ici :
// le fournisseur et ses clés restent dans Marketing → Envoi.
const sending = () => require("../../marketing/sending/config");
const parseFrom = (ctx) => { const c = sending().getSendingConfig(ctx); return c.from ? require("../../marketing/sending/providers").parseSender(c.from) : null; };
const siteKey = (siteId, f) => `email.site_${siteId}.${f}`;
const siteGet = (ctx, siteId, f) => ctx.settings.get(ctx.organizationId, siteKey(siteId, f), "") || "";
const siteSet = (ctx, siteId, f, v) => (v ? ctx.settings.set(ctx.organizationId, siteKey(siteId, f), v) : ctx.settings.remove(ctx.organizationId, siteKey(siteId, f)));
// Un site n'envoie que depuis un domaine déjà déclaré dans Marketing → Domaines (ou celui de l'expéditeur de l'organisation) et jamais depuis une messagerie gratuite
function authorizedSenderDomain(value, scope, ctx) {
  if (!value || !scope.siteId) return null;
  const domain = String(value).split("@").pop().toLowerCase();
  const domains = require("../../marketing/domains");
  if (domains.FREE_MAIL.has(domain)) return { error: `${domain} est une messagerie gratuite : utilisez une adresse de votre propre domaine.` };
  const org = parseFrom(ctx);
  const own = org && org.email.split("@").pop().toLowerCase() === domain;
  if (!own && !db.prepare("SELECT 1 FROM mk_sending_domains WHERE organization_id = ? AND domain = ?").get(ctx.organizationId, domain)) return { error: `le domaine ${domain} n'est pas déclaré dans Marketing → Domaines.` };
  return null;
}
def({ key: "email_from_name", group: "email", label: "Nom de l'expéditeur", type: "string", max: 100, help: "Nom affiché dans la boîte de réception. Vide sur un site : celui de l'organisation.",
  readMain: (ctx) => (parseFrom(ctx) || {}).name || "", defaultMain: "",
  writeMain: (v, ctx) => { const cur = parseFrom(ctx); if (!cur) throw new UserError("Renseignez d'abord l'adresse d'expédition."); sending().saveSendingConfig(ctx, { from: v ? `${v} <${cur.email}>` : cur.email }); },
  readSite: (s, ctx) => siteGet(ctx, s.id, "from_name"), writeSite: (v, ctx, siteId) => siteSet(ctx, siteId, "from_name", v), defaultSite: "" });
def({ key: "email_from_address", group: "email", label: "Adresse d'expédition", type: "email", help: "Adresse « De : » des e-mails marketing. Utilisez une adresse d'un domaine authentifié (SPF, DKIM, DMARC). Vide sur un site : celle de l'organisation.",
  readMain: (ctx) => (parseFrom(ctx) || {}).email || "", defaultMain: "", contextValidate: authorizedSenderDomain,
  writeMain: (v, ctx) => { const cur = parseFrom(ctx); sending().saveSendingConfig(ctx, { from: v ? (cur && cur.name ? `${cur.name} <${v}>` : v) : "" }); },
  readSite: (s, ctx) => siteGet(ctx, s.id, "from_address"), writeSite: (v, ctx, siteId) => siteSet(ctx, siteId, "from_address", v), defaultSite: "" });
def({ key: "email_reply_to", group: "email", label: "Adresse de réponse", type: "email", help: "Où arrivent les réponses des destinataires. Vide : on répond à l'adresse d'expédition.",
  readMain: (ctx) => sending().getSendingConfig(ctx).replyTo || "", defaultMain: "", writeMain: (v, ctx) => sending().saveSendingConfig(ctx, { replyTo: v }),
  readSite: (s, ctx) => siteGet(ctx, s.id, "reply_to"), writeSite: (v, ctx, siteId) => siteSet(ctx, siteId, "reply_to", v), defaultSite: "" });

function validate(d, raw, scope, ctx) {
  const label = d.label;
  if (raw !== null && typeof raw === "object") return { ok: false, error: `${label} : valeur invalide.` }; // tableaux et objets refusés (injection de structure)
  const clean = (v, n) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, n + 1);
  const fail = (msg) => ({ ok: false, error: `${label} : ${msg}` });
  switch (d.type) {
    case "boolean": return { ok: true, value: raw === true || raw === "true" || raw === "1" || raw === 1 || raw === "on" };
    case "integer": {
      const n = Number(raw);
      const max = d.max;
      if (!Number.isInteger(n) || n < d.min || n > max) return fail(`un nombre entier entre ${d.min} et ${max}.`);
      return { ok: true, value: n };
    }
    case "enum": {
      const opts = d.options(scope).map((o) => String(o[0]));
      return opts.includes(String(raw)) ? { ok: true, value: String(raw) } : fail("choix invalide.");
    }
    case "slug": {
      const v = clean(raw, d.max || 60).toLowerCase();
      if (!v) return fail("obligatoire.");
      return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) && v.length <= (d.max || 60) ? { ok: true, value: v } : fail("lettres minuscules, chiffres et tirets seulement (ex. mon-site).");
    }
    case "timezone": return validTimezone(String(raw)) ? { ok: true, value: String(raw) } : fail("fuseau horaire inconnu (ex. Europe/Paris, America/Chicago).");
    case "email": {
      const v = clean(raw, 254);
      if (!v) return d.required ? fail("obligatoire.") : { ok: true, value: "" };
      return EMAIL.test(v) && v.length <= 254 && !/[\r\n]/.test(String(raw)) ? { ok: true, value: v.toLowerCase() } : fail("adresse e-mail invalide.");
    }
    case "url": {
      const v = clean(raw, 200);
      if (!v) return { ok: true, value: "" };
      return /^https:\/\/[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:\d{2,5})?$/i.test(v) ? { ok: true, value: v.replace(/\/+$/, "") } : fail("une adresse https:// sans chemin (ex. https://www.monsite.com).");
    }
    case "string": case "text": {
      const max = scope.siteId && d.maxSite ? d.maxSite : d.max || 300;
      const v = clean(raw, max);
      if (d.required && !v) return fail("obligatoire.");
      return v.length > max ? fail(`${max} caractères au plus.`) : { ok: true, value: v };
    }
    case "image": {
      const v = String(raw ?? "").trim();
      if (!v) return { ok: true, value: "" };
      // Médiathèque du site : le fichier doit exister et ne pas être dans la corbeille (jamais une adresse arbitraire)
      if (/^\/uploads\/marketing\/\d{1,9}\/[A-Za-z0-9_.-]{1,200}$/.test(v) && db.prepare("SELECT 1 FROM mk_media WHERE path = ? AND deleted_at IS NULL").get(v)) return { ok: true, value: v };
      if (/^\/uploads\/thumbnails\/[A-Za-z0-9_.-]{1,200}\.(?:png|jpe?g|webp|gif|avif)$/i.test(v)) return { ok: true, value: v };
      return fail("choisissez un fichier de la médiathèque.");
    }
    case "page": {
      const v = String(raw ?? "").trim();
      if (!v) return d.nullable ? { ok: true, value: "" } : fail("obligatoire.");
      const id = Number(v);
      if (!Number.isInteger(id) || id < 1) return fail("page invalide.");
      const p = db.prepare("SELECT id, site_id, status, archived_at, kind, organization_id FROM mk_landing_pages WHERE id = ?").get(id);
      if (!p || p.organization_id !== ctx.organizationId) return fail("page introuvable.");
      if (p.archived_at) return fail("cette page est à la corbeille.");
      if (p.status !== "published") return fail("cette page n'est pas publiée : elle serait introuvable pour les visiteurs.");
      if (p.kind === "step") return fail("une étape de tunnel ne peut pas servir de page d'accueil.");
      if ((p.site_id ?? null) !== (scope.siteId ?? null)) return fail("cette page n'appartient pas à ce site.");
      return { ok: true, value: id };
    }
    default: return fail("type inconnu.");
  }
}
// Validation propre au moteur propriétaire (modèles de titre, adresses d'images SEO…) : exécutée avant toute écriture
function validateFull(d, raw, scope, ctx) {
  const v = validate(d, raw, scope, ctx);
  if (!v.ok) return v;
  // Contrôle qui dépend du contexte (ex. domaine d'expédition autorisé) : site ou site principal
  if (d.contextValidate) { const c = d.contextValidate(v.value, scope, ctx); if (c && c.error) return { ok: false, error: `${d.label} : ${c.error}` }; }
  if (!d.adapterValidate || scope.siteId) return v;
  const a = d.adapterValidate(v.value);
  return a && a.error ? { ok: false, error: a.error } : v;
}

// ---------- Lecture ----------
const defsFor = (scope) => DEFS.filter((d) => d.scopes.includes(scope.siteId ? "site" : "main"));
const byKey = (scope, key) => defsFor(scope).find((d) => d.key === key) || null;
const defaultOf = (d, scope) => (scope.siteId ? d.defaultSite : d.dynamicDefault ? d.dynamicDefault() : d.defaultMain);

// Les valeurs stockées en texte (table mk_settings) reprennent leur type
const coerce = (d, v) => {
  if (v === null || v === undefined || v === "") return v;
  if (d.type === "integer" || d.type === "page") return Number(v);
  if (d.type === "boolean" && typeof v === "string") return v === "true" || v === "1";
  return v;
};
// Valeurs effectives d'un périmètre : { clé: { value, default } }
function readAll(scope, ctx) {
  const out = {};
  const site = scope.siteId ? siteOf(ctx, scope.siteId) : null;
  for (const d of defsFor(scope)) {
    let value;
    try { value = coerce(d, scope.siteId ? d.readSite(site, ctx) : d.readMain(ctx)); } catch { value = undefined; }
    if (value === null || value === undefined || (value === "" && d.type === "integer")) value = defaultOf(d, scope);
    if (value === null || value === undefined) value = d.type === "boolean" ? false : "";
    out[d.key] = { value, default: defaultOf(d, scope) };
  }
  return out;
}

// Valeurs du site principal, lues à chaque page publique : un seul accès groupé, en cache, invalidé à chaque écriture
let mainMemo = null;
function main() {
  const kv = kvAll();
  const loc = (() => { try { return seo().get("og_locale") || "fr_FR"; } catch { return "fr_FR"; } })();
  if (mainMemo && mainMemo.kv === kv && mainMemo.loc === loc) return mainMemo.value;
  const value = computeMain(kv);
  mainMemo = { kv, loc, value };
  return value;
}
function computeMain(kv) {
  const num = (k, fallback, min, max) => { const n = Number(kv[k]); return Number.isInteger(n) && n >= min && n <= max ? n : fallback; };
  const locale = (() => { try { return seo().get("og_locale") || "fr_FR"; } catch { return "fr_FR"; } })();
  const tz = kv.timezone && validTimezone(kv.timezone) ? kv.timezone : "Europe/Paris";
  const cap = (fn) => { try { return fn(); } catch { return Infinity; } };
  const mb = (k, hard) => { const n = Number(kv[k]); return Number.isInteger(n) && n >= 1 ? Math.min(n * 1048576, hard) : hard; };
  return {
    locale, htmlLang: locale.split("_")[0], timezone: tz,
    dateFormat: require("../../utils/format").isValidDateFormat(kv.date_format) ? kv.date_format : "long", timeFormat: kv.time_format === "12h" ? "12h" : "24h",
    weekStart: ["monday", "sunday", "saturday"].includes(kv.week_start) ? kv.week_start : "monday", registrationOpen: kv.registration_open !== "false" && kv.registration_open !== "0",
    postsPerPage: num("posts_per_page", 10, 1, 50), homepagePage: /^\d+$/.test(kv.homepage_page || "") ? Number(kv.homepage_page) : null,
    searchVisibility: kv.search_visibility === "closed" ? "closed" : "open", adminEmail: kv.admin_email || "", privacyPage: /^\d+$/.test(kv.privacy_page || "") ? Number(kv.privacy_page) : null,
    normalizePaths: kv.normalize_paths !== "false" && kv.normalize_paths !== "0",
    mediaLimits: { image: mb("media_max_image_mb", cap(() => media().MAX_IMAGE)), document: mb("media_max_document_mb", cap(() => media().MAX_DOCUMENT)), audio: mb("media_max_audio_mb", cap(() => media().MAX_AUDIO)), video: mb("media_max_video_mb", cap(() => media().MAX_VIDEO)) },
  };
}

// ---------- Écriture ----------
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const display = (d, v) => (d.type === "boolean" ? (v ? "oui" : "non") : v === null || v === undefined || v === "" ? "(vide)" : String(v).slice(0, 120));

// Applique un lot de changements d'UN périmètre, tout ou rien. patch : { clé: valeur }. ctx : { can, orgLevel, organizationId, userId }.
function update(scope, patch, ctx, { confirm = false, actor = null } = {}) {
  assertScope(scope, ctx);
  const errors = [];
  const plan = [];
  const current = readAll(scope, ctx);
  for (const [key, raw] of Object.entries(patch || {})) {
    const d = byKey(scope, key);
    if (!d) { errors.push(`Réglage inconnu ou non disponible pour ce périmètre : ${String(key).slice(0, 40)}.`); continue; }
    if (!ctx.can(d.perm)) { errors.push(`${d.label} : permission « ${d.perm} » requise.`); continue; }
    if (d.sensitive && !ctx.can("settings.sensitive")) { errors.push(`${d.label} : réglage sensible, permission « settings.sensitive » requise.`); continue; }
    const v = validateFull(d, raw, scope, ctx);
    if (!v.ok) { errors.push(v.error); continue; }
    if (same(v.value === "" ? "" : v.value, current[key].value === null ? "" : current[key].value)) continue;
    plan.push({ d, value: v.value, before: current[key].value });
  }
  if (errors.length) return { ok: false, errors };
  const needConfirm = plan.filter((p) => p.d.sensitive);
  if (needConfirm.length && !confirm) return { ok: false, confirmRequired: needConfirm.map((p) => ({ key: p.d.key, label: p.d.label, impact: p.d.impact || "Ce réglage peut changer le comportement du site.", before: display(p.d, p.before), after: display(p.d, p.value) })) };
  if (!plan.length) return { ok: true, changed: [] };
  try {
    transaction(db, () => {
      for (const p of plan) {
        if (scope.siteId) p.d.writeSite(p.value, ctx, scope.siteId); else p.d.writeMain(p.value, ctx);
      }
    });
  } catch (error) {
    // Refus d'un moteur propriétaire (message métier) : rien n'est enregistré (transaction annulée), le message est renvoyé tel quel
    if (error instanceof UserError || (error && error.name === "MarketingError")) return { ok: false, errors: [error.message] };
    throw error;
  } finally { invalidate(); }
  const changed = plan.map((p) => ({ key: p.d.key, label: p.d.label, before: display(p.d, p.before), after: display(p.d, p.value), sensitive: Boolean(p.d.sensitive) }));
  // Journal d'activité : qui a changé quoi, de quelle valeur à laquelle (aucun secret : les réglages n'en contiennent pas)
  require("../auditLog").record(actor || { id: ctx.userId }, { action: "settings.updated", resourceType: "settings", summary: `Réglages modifiés (${scope.siteId ? `site n° ${scope.siteId}` : "site principal"}) : ${changed.map((c) => `${c.label} : ${c.before} → ${c.after}`).join(" ; ").slice(0, 400)}`, details: { scope: scope.siteId ? `site:${scope.siteId}` : "main", changed } });
  return { ok: true, changed };
}

// Valeur par défaut d'un réglage ou d'un groupe (jamais un « tout réinitialiser » global)
function reset(scope, target, ctx, { confirm = false, actor = null } = {}) {
  assertScope(scope, ctx);
  const keys = GROUPS[target] ? defsFor(scope).filter((d) => d.group === target).map((d) => d.key) : [target];
  if (!keys.every((k) => byKey(scope, k))) return { ok: false, errors: ["Réglage ou groupe inconnu."] };
  const patch = {};
  for (const k of keys) { const d = byKey(scope, k); const dv = defaultOf(d, scope); patch[k] = dv === null || dv === undefined ? "" : dv; }
  return update(scope, patch, ctx, { confirm, actor });
}

function assertScope(scope, ctx) {
  if (scope.siteId) {
    const row = db.prepare(`SELECT id FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(db)}`).get(scope.siteId, ctx.organizationId);
    if (!row) throw Object.assign(new UserError("Site introuvable."), { status: 404 });
  } else if (!ctx.orgLevel) throw Object.assign(new UserError("Les réglages du site principal sont réservés à l'équipe de l'organisation."), { status: 403 });
}

// Après une écriture : seulement ce qui dépend des réglages (jamais « tout vider »)
function invalidate() {
  kvCache = null;
  try { seo().resetCache(); } catch { /* module SEO indisponible */ }
  try { comments().resetCache(); } catch { /* idem */ }
  try { require("../urls").invalidateSites(); } catch { /* idem */ }
  try { require("../../utils/format").refresh(); } catch { /* idem */ }
}

// ---------- Plateforme (lecture seule) et préférences de la personne (séparées) ----------
function platform() {
  const env = (k) => process.env[k];
  return [
    ["Environnement", env("NODE_ENV") === "production" ? "Production" : env("NODE_ENV") === "test" ? "Test" : "Développement"],
    ["Adresse publique du site principal (SITE_URL)", env("SITE_URL") ? new URL(env("SITE_URL")).origin : "Non définie"],
    ["Traitement en arrière-plan (MARKETING_WORKER)", env("MARKETING_WORKER") === "on" ? "Actif" : "Inactif"],
    ["Indexation forcée (ALLOW_INDEXING)", env("ALLOW_INDEXING") === "1" ? "Ouverte" : env("ALLOW_INDEXING") === "0" ? "Fermée" : "Automatique"],
    ["Tâches SEO programmées (SEO_JOBS)", env("SEO_JOBS") === "off" ? "Arrêtées" : "Actives"],
    ["Serveur d'envoi (SMTP)", env("SMTP_HOST") ? "Configuré" : "Non configuré"],
    ["Clé de chiffrement / secret de session", env("ENCRYPTION_KEY") && env("SESSION_SECRET") ? "Définis (valeurs jamais affichées)" : "Incomplets"],
  ];
}
const USER_PREFS = [{ key: "editor_theme", label: "Apparence de l'éditeur d'articles", scope: "user" }, { key: "editor_color", label: "Couleur personnalisée de l'éditeur", scope: "user" }];
function userPrefs(userId) {
  const r = db.prepare("SELECT editor_theme, editor_color FROM user_prefs WHERE user_id = ?").get(userId) || {};
  return { editor_theme: r.editor_theme || "clair", editor_color: r.editor_color || null };
}
function setUserPrefs(userId, patch) {
  const theme = require("../editorTheme");
  const cur = userPrefs(userId);
  const next = theme.normalize(patch.editor_theme ?? cur.editor_theme, patch.editor_color ?? cur.editor_color);
  db.prepare("INSERT INTO user_prefs (user_id, editor_theme, editor_color) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET editor_theme = excluded.editor_theme, editor_color = excluded.editor_color").run(userId, next.key, next.color ?? null);
  return userPrefs(userId);
}

module.exports = { GROUPS, DEFS, LOCALES, TIMEZONES, defsFor, byKey, readAll, main, update, reset, validate, platform, userPrefs, setUserPrefs, USER_PREFS, invalidate, validTimezone };
