// Heure d'envoi par destinataire (point 4 de la parité Mailchimp) :
//  · « local »     : même heure de l'horloge dans le fuseau de CHAQUE contact (comme Timewarp) ;
//  · « optimized » : meilleure heure de chaque contact, d'après SES ouvertures et clics réels (robots exclus), dans les
//                    24 h du jour choisi ; sans historique suffisant, l'heure la plus active de l'audience ; si l'audience
//                    elle-même n'a pas assez d'historique, le mode est indisponible (comme Send Time Optimization).
// Fuseau d'un contact, par ordre de fiabilité : fuseau du contact (formulaire, saisie, import) → fuseau du navigateur de
// son compte KOLAKISA → pays à fuseau unique → fuseau par défaut de l'organisation. Rien n'est deviné au-delà.
const { MarketingError } = require("../errors");

const DAY = 86400000;
const HOUR = 3600000;
const SETTING = "sending.timezone";
const DEFAULT_TZ = "Europe/Paris";
const MIN_PERSONAL = 3;          // ouvertures/clics d'un contact pour lui calculer SA meilleure heure
const MIN_AUDIENCE = 20;         // engagements de l'audience pour une heure de repli…
const MIN_AUDIENCE_CONTACTS = 5; // …provenant d'au moins 5 contacts différents
const HISTORY_MS = 365 * DAY;

// ---------- Fuseaux ----------
const tzCache = new Map();
function isTimeZone(tz) {
  if (typeof tz !== "string" || !tz || tz.length > 64 || !/^[A-Za-z_]+(\/[A-Za-z0-9_+-]+){0,2}$/.test(tz)) return false;
  if (tzCache.has(tz)) return tzCache.get(tz);
  let ok = false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); ok = true; } catch { ok = false; }
  tzCache.set(tz, ok);
  return ok;
}
const cleanTimeZone = (tz) => (isTimeZone(String(tz || "").trim()) ? String(tz).trim() : "");
const timeZoneList = () => (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [DEFAULT_TZ, "UTC"]);

const fmtCache = new Map();
function parts(instant, tz) {
  let f = fmtCache.get(tz);
  if (!f) { f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }); fmtCache.set(tz, f); }
  const p = Object.fromEntries(f.formatToParts(new Date(instant)).map((x) => [x.type, x.value]));
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day), h: Number(p.hour) % 24, mi: Number(p.minute), s: Number(p.second) };
}
const offsetMs = (instant, tz) => { const p = parts(instant, tz); return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - (instant - (instant % 1000)); };
// « 2026-10-05 09:00 » dans le fuseau tz → instant UTC (ms). Heure inexistante (passage à l'heure d'été) : l'heure juste après.
function zonedToUtc(ymd, hour, minute, tz) {
  const [y, m, d] = ymd.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  let utc = guess - offsetMs(guess, tz);
  utc = guess - offsetMs(utc, tz);
  return utc;
}
const localYmd = (instant, tz) => { const p = parts(instant, tz); return `${p.y}-${String(p.m).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`; };
const localHour = (instant, tz) => parts(instant, tz).h;

// Pays à fuseau UNIQUE (code ISO ou nom courant) : les pays à plusieurs fuseaux (RD Congo, Canada, États-Unis, Espagne,
// Portugal…) ne sont volontairement pas déduits du pays.
const COUNTRY_TZ = {
  FR: "Europe/Paris", BE: "Europe/Brussels", CH: "Europe/Zurich", LU: "Europe/Luxembourg", MC: "Europe/Monaco",
  DE: "Europe/Berlin", IT: "Europe/Rome", NL: "Europe/Amsterdam", GB: "Europe/London", IE: "Europe/Dublin",
  CG: "Africa/Brazzaville", CM: "Africa/Douala", GA: "Africa/Libreville", CF: "Africa/Bangui", TD: "Africa/Ndjamena",
  AO: "Africa/Luanda", RW: "Africa/Kigali", BI: "Africa/Bujumbura", CI: "Africa/Abidjan", SN: "Africa/Dakar",
  ML: "Africa/Bamako", BF: "Africa/Ouagadougou", NE: "Africa/Niamey", TG: "Africa/Lome", BJ: "Africa/Porto-Novo",
  GN: "Africa/Conakry", MA: "Africa/Casablanca", DZ: "Africa/Algiers", TN: "Africa/Tunis", NG: "Africa/Lagos",
  GH: "Africa/Accra", MG: "Indian/Antananarivo", HT: "America/Port-au-Prince",
};
const COUNTRY_NAMES = {
  france: "FR", belgique: "BE", suisse: "CH", luxembourg: "LU", monaco: "MC", allemagne: "DE", italie: "IT", "pays-bas": "NL",
  "royaume-uni": "GB", irlande: "IE", congo: "CG", "congo-brazzaville": "CG", "republique du congo": "CG", cameroun: "CM", gabon: "GA",
  centrafrique: "CF", "republique centrafricaine": "CF", tchad: "TD", angola: "AO", rwanda: "RW", burundi: "BI", "cote d'ivoire": "CI",
  senegal: "SN", mali: "ML", "burkina faso": "BF", niger: "NE", togo: "TG", benin: "BJ", guinee: "GN", maroc: "MA", algerie: "DZ",
  tunisie: "TN", nigeria: "NG", ghana: "GH", madagascar: "MG", haiti: "HT",
};
function countryTimeZone(country) {
  const raw = String(country || "").trim();
  if (!raw) return "";
  const code = /^[A-Za-z]{2}$/.test(raw) ? raw.toUpperCase() : COUNTRY_NAMES[raw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/’/g, "'")];
  return (code && COUNTRY_TZ[code]) || "";
}

function orgTimeZone(ctx) {
  const tz = ctx.settings ? ctx.settings.get(ctx.organizationId, SETTING, DEFAULT_TZ) : DEFAULT_TZ;
  return isTimeZone(tz) ? tz : DEFAULT_TZ;
}
function setOrgTimeZone(ctx, tz) {
  if (!isTimeZone(tz)) throw new MarketingError("invalid_field", "Fuseau horaire inconnu.");
  ctx.settings.set(ctx.organizationId, SETTING, tz);
}

const BASIS_LABELS = { contact: "fuseau du contact", account: "fuseau de son compte KOLAKISA", country: "déduit du pays", default: "fuseau par défaut" };
// Fuseau effectif de contacts (identifiants) : { [contactId]: { tz, basis } }
function contactZones(ctx, contactIds) {
  const out = {};
  if (!contactIds.length) return out;
  const fallback = orgTimeZone(ctx);
  const hasUserTz = ctx.db.prepare("PRAGMA table_info(users)").all().some((c) => c.name === "timezone");
  for (let i = 0; i < contactIds.length; i += 500) {
    const chunk = contactIds.slice(i, i + 500);
    const rows = ctx.db.prepare(`SELECT c.id, c.timezone, c.country, ${hasUserTz ? "u.timezone" : "NULL"} AS account_tz FROM mk_contacts c ${hasUserTz ? "LEFT JOIN users u ON u.id = c.lms_user_id" : ""} WHERE c.organization_id = ? AND c.id IN (${chunk.map(() => "?").join(",")})`).all(ctx.organizationId, ...chunk);
    for (const r of rows) {
      if (isTimeZone(r.timezone)) out[r.id] = { tz: r.timezone, basis: "contact" };
      else if (isTimeZone(r.account_tz)) out[r.id] = { tz: r.account_tz, basis: "account" };
      else if (countryTimeZone(r.country)) out[r.id] = { tz: countryTimeZone(r.country), basis: "country" };
      else out[r.id] = { tz: fallback, basis: "default" };
    }
  }
  return out;
}

// ---------- Meilleure heure ----------
// Heure locale (0-23) la plus fréquente parmi les ouvertures et clics réels (hors robots) de chaque contact
function engagementHours(ctx, contactIds, zones, now) {
  const perContact = new Map();
  const audience = new Array(24).fill(0);
  const contributors = new Set();
  for (let i = 0; i < contactIds.length; i += 500) {
    const chunk = contactIds.slice(i, i + 500);
    const rows = ctx.db.prepare(`SELECT m.contact_id, e.occurred_at FROM mk_message_events e JOIN mk_messages m ON m.id = e.message_id
      WHERE e.organization_id = ? AND e.type IN ('opened', 'clicked') AND e.bot = 0 AND e.occurred_at >= ? AND m.contact_id IN (${chunk.map(() => "?").join(",")})`).all(ctx.organizationId, now - HISTORY_MS, ...chunk);
    for (const r of rows) {
      const tz = (zones[r.contact_id] || {}).tz || DEFAULT_TZ;
      const h = localHour(r.occurred_at, tz);
      if (!perContact.has(r.contact_id)) perContact.set(r.contact_id, new Array(24).fill(0));
      perContact.get(r.contact_id)[h]++;
      audience[h]++;
      contributors.add(r.contact_id);
    }
  }
  const mode = (hist) => hist.reduce((best, n, h) => (n > hist[best] ? h : best), 0);
  const total = audience.reduce((s, n) => s + n, 0);
  const audienceHour = total >= MIN_AUDIENCE && contributors.size >= MIN_AUDIENCE_CONTACTS ? mode(audience) : null;
  const personal = new Map();
  for (const [id, hist] of perContact) if (hist.reduce((s, n) => s + n, 0) >= MIN_PERSONAL) personal.set(id, mode(hist));
  return { personal, audienceHour, total, contributors: contributors.size };
}

// ---------- Plan d'envoi ----------
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const HM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const isRealDay = (ymd) => { const d = new Date(`${ymd}T12:00:00Z`); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === ymd; };

// Calcule l'heure d'envoi de chaque destinataire. options : { mode: "local", date, time } ou { mode: "optimized", date }.
// Renvoie { times: Map(contactId → { at, tz, basis }), first, last, summary } ou lève une erreur claire (jamais d'envoi
// dans le passé : si l'heure choisie est déjà passée dans certains fuseaux, on le dit avec le nombre de contacts concernés).
function planSendTimes(ctx, contactIds, options, now = Date.now()) {
  const date = String(options.date || "").trim();
  if (!YMD.test(date) || !isRealDay(date)) throw new MarketingError("invalid_field", "Choisissez le jour d'envoi.");
  const zones = contactZones(ctx, contactIds);
  const times = new Map();
  const summary = { mode: options.mode, date, bases: {}, zones: {} };
  if (options.mode === "local") {
    const m = HM.exec(String(options.time || "").trim());
    if (!m) throw new MarketingError("invalid_field", "Choisissez l'heure d'envoi (heure de l'horloge de chaque contact).");
    const [hour, minute] = [Number(m[1]), Number(m[2])];
    summary.time = `${m[1]}:${m[2]}`;
    let late = 0;
    const lateZones = new Set();
    for (const id of contactIds) {
      const z = zones[id];
      const at = zonedToUtc(date, hour, minute, z.tz);
      if (at <= now) { late++; lateZones.add(z.tz); }
      times.set(id, { at, tz: z.tz, basis: z.basis });
    }
    if (late) throw new MarketingError("too_early", `Trop tard pour ${late} destinataire${late > 1 ? "s" : ""} : le ${date} à ${summary.time}, cette heure est déjà passée dans ${[...lateZones].slice(0, 3).join(", ")}${lateZones.size > 3 ? "…" : ""}. Choisissez un jour plus éloigné (au moins 24 h à l'avance couvre tous les fuseaux).`);
  } else if (options.mode === "optimized") {
    // Fenêtre de 24 h : le jour choisi, de minuit à minuit dans le fuseau de l'organisation
    const orgTz = orgTimeZone(ctx);
    const start = zonedToUtc(date, 0, 0, orgTz);
    if (start <= now) throw new MarketingError("too_early", "La meilleure heure se calcule sur une journée entière à venir : choisissez au plus tôt demain.");
    const eng = engagementHours(ctx, contactIds, zones, now);
    if (eng.audienceHour === null && eng.personal.size < contactIds.length) {
      throw new MarketingError("not_enough_data", `Pas assez d'historique pour calculer une meilleure heure : il faut au moins ${MIN_AUDIENCE} ouvertures ou clics de ${MIN_AUDIENCE_CONTACTS} contacts différents dans cette audience (actuellement ${eng.total}, de ${eng.contributors} contact${eng.contributors > 1 ? "s" : ""}). Envoyez d'abord quelques campagnes avec le suivi activé, ou choisissez une autre option.`);
    }
    summary.audienceHour = eng.audienceHour;
    summary.personal = eng.personal.size;
    for (const id of contactIds) {
      const z = zones[id];
      const hour = eng.personal.has(id) ? eng.personal.get(id) : eng.audienceHour;
      // Première occurrence de cette heure locale à partir du début de la fenêtre (donc toujours dans les 24 h)
      let at = zonedToUtc(localYmd(start, z.tz), hour, 0, z.tz);
      while (at < start) at += DAY;
      while (at >= start + DAY) at -= DAY;
      if (at < start) at = start;
      times.set(id, { at, tz: z.tz, basis: `${z.basis}:${eng.personal.has(id) ? "history" : "audience"}` });
    }
  } else {
    throw new MarketingError("invalid_field", "Mode d'envoi inconnu.");
  }
  let first = Infinity, last = -Infinity;
  for (const t of times.values()) {
    first = Math.min(first, t.at); last = Math.max(last, t.at);
    const b = t.basis.split(":")[0];
    summary.bases[b] = (summary.bases[b] || 0) + 1;
    summary.zones[t.tz] = (summary.zones[t.tz] || 0) + 1;
  }
  summary.first = Number.isFinite(first) ? first : null;
  summary.last = Number.isFinite(last) ? last : null;
  return { times, first: summary.first, last: summary.last, summary };
}

// Aperçu pour la fenêtre d'envoi (aucune écriture) : fuseaux connus, disponibilité de la meilleure heure
function sendTimePreview(ctx, contactIds, now = Date.now()) {
  const zones = contactZones(ctx, contactIds);
  const bases = {};
  const distinct = new Set();
  for (const id of contactIds) { const z = zones[id]; bases[z.basis] = (bases[z.basis] || 0) + 1; distinct.add(z.tz); }
  const eng = engagementHours(ctx, contactIds, zones, now);
  const optimizedReady = eng.audienceHour !== null || (contactIds.length > 0 && eng.personal.size === contactIds.length);
  return { orgTz: orgTimeZone(ctx), bases, zoneCount: distinct.size, personal: eng.personal.size, audienceHour: eng.audienceHour, engagement: eng.total, contributors: eng.contributors, optimizedReady, minAudience: MIN_AUDIENCE, minContacts: MIN_AUDIENCE_CONTACTS };
}

module.exports = {
  isTimeZone, cleanTimeZone, timeZoneList, zonedToUtc, localYmd, localHour, countryTimeZone, orgTimeZone, setOrgTimeZone,
  contactZones, engagementHours, planSendTimes, sendTimePreview, BASIS_LABELS, DEFAULT_TZ, MIN_PERSONAL, MIN_AUDIENCE, MIN_AUDIENCE_CONTACTS,
};
