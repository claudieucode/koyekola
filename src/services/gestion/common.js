// Centre de gestion : outils communs (périodes en heure de Paris, pagination, recherche).
// Les dates de la base sont en UTC (« AAAA-MM-JJ HH:MM:SS », datetime('now')).
const TZ = "Europe/Paris";
const PER_PAGE = 20;

// Décalage (minutes) de l'heure de Paris à une date donnée (heure d'été comprise)
function parisOffset(date) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}
const sqlUtc = (d) => d.toISOString().slice(0, 19).replace("T", " ");
// « 2026-10-04 » (jour à Paris) → instant UTC de minuit à Paris
function parisDayStart(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d));
  return new Date(guess.getTime() - parisOffset(guess) * 60000);
}
function parisToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
function addDays(ymd, n) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
const isYmd = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || "")) && !Number.isNaN(Date.parse(v));

// Période d'analyse : { key, label, from, to (UTC SQL, borne haute exclue), days, fromYmd, toYmd, error }
const PERIODS = [["today", "Aujourd'hui"], ["7j", "7 jours"], ["30j", "30 jours"], ["90j", "90 jours"], ["annee", "Cette année"], ["perso", "Personnalisé"]];
function period(query = {}, now = new Date()) {
  const key = PERIODS.some(([k]) => k === query.periode) ? query.periode : "30j";
  const today = parisToday(now);
  let fromYmd, toYmd, error = null;
  if (key === "today") { fromYmd = today; toYmd = today; }
  else if (key === "annee") { fromYmd = `${today.slice(0, 4)}-01-01`; toYmd = today; }
  else if (key === "perso") {
    fromYmd = isYmd(query.du) ? query.du : addDays(today, -29);
    toYmd = isYmd(query.au) ? query.au : today;
    if (!isYmd(query.du) || !isYmd(query.au)) error = "Choisissez une date de début et une date de fin.";
    else if (fromYmd > toYmd) { error = "La date de début est après la date de fin : période inversée."; [fromYmd, toYmd] = [toYmd, fromYmd]; }
    else if ((Date.parse(toYmd) - Date.parse(fromYmd)) / 864e5 > 3660) { error = "Période limitée à 10 ans."; fromYmd = addDays(toYmd, -3660); }
  } else { const n = { "7j": 7, "30j": 30, "90j": 90 }[key]; fromYmd = addDays(today, -(n - 1)); toYmd = today; }
  const days = Math.round((Date.parse(toYmd) - Date.parse(fromYmd)) / 864e5) + 1;
  return { key, label: PERIODS.find(([k]) => k === key)[1], fromYmd, toYmd, days, from: sqlUtc(parisDayStart(fromYmd)), to: sqlUtc(parisDayStart(addDays(toYmd, 1))), error };
}

function page(query) { const n = Number.parseInt(query && query.page, 10); return Number.isInteger(n) && n > 0 ? n : 1; }
function paginate(total, current, perPage = PER_PAGE) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  const p = Math.min(current, pages);
  return { page: p, pages, total, offset: (p - 1) * perPage, limit: perPage };
}
// Recherche « LIKE » sûre (les % et _ saisis sont cherchés tels quels)
const likeOf = (q) => `%${String(q).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
const cleanQ = (q) => String(q || "").replace(/\s+/g, " ").trim().slice(0, 100);

module.exports = { TZ, PER_PAGE, PERIODS, period, page, paginate, likeOf, cleanQ, parisToday, parisDayStart, addDays, sqlUtc, isYmd };
