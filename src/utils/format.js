// Palier 23 : teintes assombries pour que la lettre blanche reste lisible (contraste WCAG AA, au moins 4,5:1 ; avant, 6 teintes sur 8 étaient sous le seuil)
const AVATAR_COLORS = ["#0e7fa8", "#c6476c", "#248254", "#a16821", "#3371c8", "#c2478b", "#117f7f", "#c04b43"];

function avatarColor(username) {
  const str = username || "?";
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function slugify(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatPrice(cents) {
  if (!cents) return "Gratuit";
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// Montant (revenus, totaux) : « 0,00 € » plutôt que « Gratuit »
function formatAmount(cents) {
  return ((cents || 0) / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// Réglages d'affichage des dates (langue, fuseau, formats) : fournis par le moteur de réglages, rechargés à chaque modification.
// Les dates enregistrées restent en temps universel (UTC) : seule leur AFFICHAGE change. Sans réglage : français, fuseau de Paris.
const FALLBACK = { locale: "fr-FR", timeZone: "Europe/Paris", dateFormat: "long", timeFormat: "24h" };
// Lu à chaque appel (le moteur de réglages mémorise le résultat : aucune requête en base par date affichée)
function current() {
  try {
    const m = require("../services/settings").main();
    return { locale: m.locale.replace("_", "-"), timeZone: m.timezone, dateFormat: m.dateFormat, timeFormat: m.timeFormat };
  } catch { return FALLBACK; }
}
const refresh = () => {};
const optsFor = (cfg, withTime) => ({ dateStyle: withTime && cfg.dateFormat === "long" ? "medium" : cfg.dateFormat, ...(withTime ? { timeStyle: "short", hour12: cfg.timeFormat === "12h" } : {}), timeZone: cfg.timeZone });
// Date d'un instant (millisecondes ou texte UTC) selon la configuration d'un site (ou du site principal)
function formatInstant(value, cfg = null, { withTime = false } = {}) {
  const c = cfg || current();
  const date = typeof value === "number" ? new Date(value) : new Date(String(value).replace(" ", "T").replace(/Z?$/, "Z"));
  if (Number.isNaN(date.getTime())) return "";
  try { return date.toLocaleString(c.locale, optsFor(c, withTime)); } catch { return date.toLocaleString("fr-FR", optsFor(FALLBACK, withTime)); }
}
function formatDate(iso) {
  return formatInstant(`${iso}`, null, { withTime: false }).replace(/ à /, " ");
}
function formatDateTime(iso) {
  return formatInstant(`${iso}`, null, { withTime: true });
}

// 135 -> "2 h 15", 45 -> "45 min", 120 -> "2 h" ; renvoie "" si la durée est inconnue
function formatDuration(minutes) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

// Une formation est « nouvelle » pendant 30 jours après sa création (created_at est en UTC)
function isNewCourse(createdAt) {
  const ageMs = Date.now() - new Date(`${createdAt.replace(" ", "T")}Z`).getTime();
  return ageMs < 30 * 24 * 60 * 60 * 1000;
}

// Temps de lecture : 90 -> "1:30", 3725 -> "1:02:05"
function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

const LEVEL_LABELS = { debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé" };

// Langues proposées pour une formation (code → libellé). Une valeur inconnue retombe sur le français.
const LANGUAGES = { fr: "Français", en: "Anglais", es: "Espagnol", pt: "Portugais", ar: "Arabe", de: "Allemand", it: "Italien" };
const cleanLanguage = (code) => (Object.prototype.hasOwnProperty.call(LANGUAGES, code) ? code : "fr");
const languageLabel = (code) => LANGUAGES[cleanLanguage(code)];

function levelLabel(level) {
  return LEVEL_LABELS[level] || level;
}

module.exports = { refresh, formatInstant, LANGUAGES, cleanLanguage, languageLabel, avatarColor, slugify, formatPrice, formatAmount, formatDate, formatDateTime, formatDuration, formatClock, isNewCourse, levelLabel };
