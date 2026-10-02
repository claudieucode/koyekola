// Heures de silence : un SMS marketing ne part jamais la nuit, À L'HEURE DU DESTINATAIRE (pas celle du serveur).
// Plage réglable (par défaut 20 h → 8 h). Pour la France, en plus et sans réglage possible : ni le dimanche ni un jour
// férié (code de déontologie des opérateurs pour les SMS commerciaux).
const { COUNTRIES } = require("./phone");

const DEFAULT_TZ = "Africa/Kinshasa";
const formatters = new Map();
function partsAt(ms, tz) {
  if (!formatters.has(tz)) {
    formatters.set(tz, new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23" }));
  }
  const p = Object.fromEntries(formatters.get(tz).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day), hour: Number(p.hour), minute: Number(p.minute), weekday: p.weekday };
}

// Dimanche de Pâques (algorithme grégorien anonyme) → [mois, jour]
function easter(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  return [month, ((h + l - 7 * m + 114) % 31) + 1];
}
function frenchHolidays(year) {
  const [em, ed] = easter(year);
  const base = Date.UTC(year, em - 1, ed);
  const plus = (days) => { const d = new Date(base + days * 86400000); return `${d.getUTCMonth() + 1}-${d.getUTCDate()}`; };
  return new Set(["1-1", "5-1", "5-8", "7-14", "8-15", "11-1", "11-11", "12-25", plus(1), plus(39), plus(50)]); // lundi de Pâques, Ascension, lundi de Pentecôte
}

// at : horodatage (ms) ; country : code pays du numéro ; start/end : heures (0-23) de début et de fin du silence
function quietReason({ at, country, start = 20, end = 8 }) {
  const tz = (COUNTRIES[country] && COUNTRIES[country].tz) || DEFAULT_TZ;
  const p = partsAt(at, tz);
  if (country === "FR") {
    if (p.weekday === "Sun") return "sunday";
    if (frenchHolidays(p.year).has(`${p.month}-${p.day}`)) return "holiday";
  }
  if (start === end) return null; // plage vide : pas d'heures de silence
  const inQuiet = start > end ? p.hour >= start || p.hour < end : p.hour >= start && p.hour < end;
  return inQuiet ? "night" : null;
}

// Premier instant (par pas de 15 minutes, 8 jours au plus) où l'envoi est permis ; null si aucun (réglage absurde)
function nextAllowedTime(opts) {
  const step = 15 * 60 * 1000;
  let t = opts.at;
  for (let i = 0; i < 8 * 24 * 4; i += 1) {
    if (!quietReason({ ...opts, at: t })) return t;
    t = Math.ceil((t + 1) / step) * step;
  }
  return null;
}

module.exports = { quietReason, nextAllowedTime, frenchHolidays };
