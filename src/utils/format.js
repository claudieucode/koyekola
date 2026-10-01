const AVATAR_COLORS = ["#0e7fa8","#e0507a", "#2fa66b", "#e0912e", "#3d8bf5", "#c2478b", "#17a2a2", "#e2574f"];

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

function formatDate(iso) {
  return new Date(`${iso}Z`).toLocaleDateString("fr-FR", { dateStyle: "long" });
}

function formatDateTime(iso) {
  return new Date(`${iso}Z`).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
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

module.exports = { LANGUAGES, cleanLanguage, languageLabel, avatarColor, slugify, formatPrice, formatDate, formatDateTime, formatDuration, formatClock, isNewCourse, levelLabel };
