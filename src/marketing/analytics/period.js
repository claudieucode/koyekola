// Périodes d'analyse (palier 21) — jours calendaires du fuseau horaire configuré (Paramètres → Général), jamais « UTC par défaut ».
// Une période est un intervalle [start, end[ en millisecondes ; la période précédente a la MÊME durée et la précède immédiatement.
const { zonedToUtc, localYmd, isTimeZone, DEFAULT_TZ } = require("../sending/sendtime");
const { MarketingError } = require("../errors");

const DAY = 86400000;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const PRESETS = {
  today: "Aujourd'hui", yesterday: "Hier", "7d": "7 derniers jours", "30d": "30 derniers jours", "90d": "90 derniers jours",
  month: "Ce mois-ci", last_month: "Mois dernier", year: "Cette année", custom: "Dates personnalisées",
};
const DEFAULT_PRESET = "30d";
const MAX_DAYS = 800;

const validYmd = (v) => typeof v === "string" && YMD.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;
const ymdPlus = (ymd, days) => new Date(Date.parse(`${ymd}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
const firstOfMonth = (ymd) => `${ymd.slice(0, 8)}01`;

// Fuseau du site : Paramètres (cms.timezone) ; sinon fuseau de l'organisation ; sinon Europe/Paris
function timeZoneOf(ctx) {
  try {
    const row = ctx.db.prepare("SELECT value FROM mk_settings WHERE organization_id = ? AND key = 'cms.timezone'").get(ctx.organizationId);
    if (row && isTimeZone(row.value)) return row.value;
  } catch { /* réglage illisible : repli */ }
  return DEFAULT_TZ;
}

function resolvePeriod(ctx, { range, from, to, now = typeof ctx.now === "function" ? ctx.now() : Date.now() } = {}) {
  const tz = timeZoneOf(ctx);
  const today = localYmd(now, tz);
  const key = Object.hasOwn(PRESETS, range) ? range : DEFAULT_PRESET;
  let fromYmd, toYmd; // inclus
  switch (key) {
    case "today": fromYmd = toYmd = today; break;
    case "yesterday": fromYmd = toYmd = ymdPlus(today, -1); break;
    case "7d": fromYmd = ymdPlus(today, -6); toYmd = today; break;
    case "90d": fromYmd = ymdPlus(today, -89); toYmd = today; break;
    case "month": fromYmd = firstOfMonth(today); toYmd = today; break;
    case "last_month": { const last = ymdPlus(firstOfMonth(today), -1); fromYmd = firstOfMonth(last); toYmd = last; break; }
    case "year": fromYmd = `${today.slice(0, 4)}-01-01`; toYmd = today; break;
    case "custom":
      if (!validYmd(from) || !validYmd(to)) throw new MarketingError("invalid_field", "Dates personnalisées : indiquez un début et une fin (AAAA-MM-JJ).");
      if (from > to) throw new MarketingError("invalid_field", "La date de début doit précéder la date de fin.");
      fromYmd = from; toYmd = to; break;
    default: fromYmd = ymdPlus(today, -29); toYmd = today;
  }
  const days = Math.round((Date.parse(`${toYmd}T00:00:00Z`) - Date.parse(`${fromYmd}T00:00:00Z`)) / DAY) + 1;
  if (days > MAX_DAYS) throw new MarketingError("invalid_field", `Période trop longue (${MAX_DAYS} jours au plus).`);
  const start = zonedToUtc(fromYmd, 0, 0, tz);
  const end = zonedToUtc(ymdPlus(toYmd, 1), 0, 0, tz);
  const prevFrom = ymdPlus(fromYmd, -days);
  const prevStart = zonedToUtc(prevFrom, 0, 0, tz);
  return { key, label: PRESETS[key], tz, fromYmd, toYmd, days, start, end, prevStart, prevEnd: start, prevFromYmd: prevFrom, prevToYmd: ymdPlus(fromYmd, -1) };
}

// Jours de la période (début de chaque jour local, en ms) : sert au regroupement par jour sans supposer des jours de 24 h (heure d'été)
function dayBoundaries(P, which = "current") {
  const [fromYmd, toYmd] = which === "previous" ? [P.prevFromYmd, P.prevToYmd] : [P.fromYmd, P.toYmd];
  const out = [];
  for (let d = fromYmd; d <= toYmd; d = ymdPlus(d, 1)) out.push({ ymd: d, start: zonedToUtc(d, 0, 0, P.tz) });
  return out;
}
// Indice du jour d'un instant (recherche dichotomique) ; -1 si hors période
function dayIndex(bounds, endMs, t) {
  if (!bounds.length || t < bounds[0].start || t >= endMs) return -1;
  let lo = 0, hi = bounds.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (bounds[mid].start <= t) lo = mid; else hi = mid - 1; }
  return lo;
}
const sqlUtc = (ms) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");

// Variation entre la période courante et la précédente.
//  - nombre / montant : variation RELATIVE en % (précédente à 0 → « nouveau », jamais une division par zéro) ;
//  - taux : variation en POINTS de pourcentage (jamais un % de %).
function delta(cur, prev, kind = "count") {
  if (cur === null || cur === undefined || prev === null || prev === undefined) return { state: "nodata" };
  if (kind === "rate") { const points = Math.round((cur - prev) * 100) / 100; return { state: points === 0 ? "flat" : points > 0 ? "up" : "down", points }; }
  if (prev === 0) return { state: cur === 0 ? "flat" : "new" };
  const pct = Math.round(((cur - prev) / prev) * 1000) / 10;
  return { state: pct === 0 ? "flat" : pct > 0 ? "up" : "down", pct };
}

module.exports = { PRESETS, DEFAULT_PRESET, resolvePeriod, dayBoundaries, dayIndex, sqlUtc, delta, timeZoneOf, ymdPlus, validYmd };
