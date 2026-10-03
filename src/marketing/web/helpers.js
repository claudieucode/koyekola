// Aides d'affichage de l'interface marketing (libellés français, dates, adresses masquées).
const STATUS = {
  unknown: { label: "Pas de consentement", cls: "badge-muted" },
  subscribed: { label: "Abonné", cls: "badge-success" },
  unsubscribed: { label: "Désinscrit", cls: "badge-warning" },
  bounced: { label: "Rebond", cls: "mk-badge-danger" },
  complained: { label: "Plainte", cls: "mk-badge-danger" },
  suppressed: { label: "Bloqué", cls: "mk-badge-danger" },
};

const REASONS = {
  not_found: "Contact introuvable.",
  suppressed: "Adresse bloquée (rebond, plainte ou blocage manuel) : aucun envoi.",
  unsubscribed: "Désinscrit : aucun envoi marketing.",
  not_subscribed: "Pas de consentement enregistré : aucun envoi marketing possible.",
  no_consent: "Statut « abonné » sans preuve de consentement : envoi refusé par sécurité.",
  list_unsubscribed: "Désinscrit de cette liste.",
  category_opted_out: "A refusé cette catégorie de messages.",
};

const statusLabel = (status) => (STATUS[status] ?? { label: String(status) }).label;
const statusClass = (status) => (STATUS[status] ?? { cls: "badge-muted" }).cls;
const reasonLabel = (reason) => REASONS[reason] ?? "Envoi impossible.";

// Source d'un contact (mk_contacts.source, jamais modifiée ici — seulement son AFFICHAGE) : la valeur brute
// « lms » se lit « Ims » dans beaucoup de polices (le « l » minuscule ressemble au « I » majuscule), pas une
// erreur de donnée. Repli sur la valeur brute pour toute source inconnue (ex. fournie librement par l'API).
const SOURCES = { manual: "Manuel", import: "Import", form: "Formulaire", lms: "KOYEKOLA", signup: "Inscription", api: "API" };
const sourceLabel = (source) => SOURCES[source] ?? String(source || "—");

// « 2027-01-10 10:00:00 » → « 10/01/2027 »
function fdate(value) {
  const m = typeof value === "string" ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null;
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
}

// Horodatage → « 25/09/2026 14:30 » (heure du serveur). Accepte des millisecondes (colonnes INTEGER du module)
// ou « 2026-09-25 14:30:00 » (datetime('now') de SQLite, en UTC). Chaîne vide si la valeur est illisible.
const DATETIME = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });
function fdatetime(value) {
  const t = typeof value === "number" ? value : typeof value === "string" ? Date.parse(`${value.replace(" ", "T")}${/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? "" : "Z"}`) : NaN;
  return Number.isFinite(t) ? DATETIME.format(new Date(t)).replace(",", "") : "";
}

// Événements (mk_events) : libellé français repris du catalogue existant (webhooks/catalog.js, source unique des
// noms réellement émis) ; null pour un événement personnalisé (envoyé par l'API, nom libre). Origine traduite.
const { EVENTS } = require("../webhooks/catalog");
const eventLabel = (name) => (Object.hasOwn(EVENTS, name) ? EVENTS[name] : null);
const EVENT_SOURCES = { lms: "Site KOYEKOLA", marketing: "Marketing", api: "API", admin: "Équipe", form: "Formulaire", import: "Import", manual: "Manuel", signup: "Inscription", preference_center: "Centre de préférences" };
const eventSourceLabel = (source) => EVENT_SOURCES[source] ?? String(source || "—");

const fmt = (n) => Number(n || 0).toLocaleString("fr-FR");
// Montant en centimes → « 1 234,50 € » (null → « — »)
const euros = (cents) => (cents === null || cents === undefined ? "—" : `${(Number(cents) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`);

// Adresse affichée sur les pages publiques : « a***@exemple.fr » (la page ne doit pas révéler l'adresse complète)
function maskEmail(email) {
  const [local = "", domain = ""] = String(email).split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}

const fullName = (c) => [c.first_name, c.last_name].filter(Boolean).join(" ");

const { buildNav } = require("./nav");
const { barChart, columnChart } = require("./charts");

// Taux en pourcentage à la française ; « — » quand il n'y a rien à mesurer (jamais un faux « 0 % »)
const rate = (r) => (r === null || r === undefined ? "—" : `${String(r).replace(".", ",")} %`);
const CAMPAIGN_STATUS = {
  draft: { label: "Brouillon", cls: "" }, scheduled: { label: "Programmée", cls: "mk-status-info" }, sending: { label: "En cours d'envoi", cls: "mk-status-info" },
  paused: { label: "En pause", cls: "mk-status-warn" }, sent: { label: "Envoyée", cls: "mk-status-ok" }, cancelled: { label: "Annulée", cls: "" }, failed: { label: "En échec", cls: "mk-status-err" },
};
const CONTACT_STATUS_CLASS = { subscribed: "mk-status-ok", unknown: "", unsubscribed: "mk-status-warn", bounced: "mk-status-err", complained: "mk-status-err", suppressed: "mk-status-err" };
const contactStatus = (status) => ({ cls: CONTACT_STATUS_CLASS[status] ?? "" });
const esc = (v) => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const campaignStatus = (status) => CAMPAIGN_STATUS[status] ?? { label: String(status), cls: "" };

const { WORKER_DETAIL, workerHuman } = require("../workerNotice");

module.exports = { WORKER_DETAIL, workerHuman, buildNav, barChart, columnChart, rate, campaignStatus, contactStatus, esc, statusLabel, statusClass, reasonLabel, sourceLabel, fdate, fdatetime, eventLabel, eventSourceLabel, fmt, euros, maskEmail, fullName, STATUS };
