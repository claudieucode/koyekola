// Prise de rendez-vous (essayage, conseil, atelier). Service pur : les créneaux sont CALCULÉS à partir des disponibilités du vendeur, des exceptions,
// du délai minimum, de l'horizon et des rendez-vous déjà pris — jamais inventés. Une réservation re-vérifie le créneau au moment d'écrire ;
// l'unicité en base (site + heure de début) interdit la double réservation même si deux visiteurs valident en même temps.
// Heures « murales » de la boutique (fuseau des réglages), au format « AAAA-MM-JJ HH:MM ». Aucun paiement n'est géré ici.
const crypto = require("node:crypto");
const { MarketingError } = require("../errors");

const siteCond = (s, a = "") => (s.siteId == null ? `${a}site_id IS NULL` : `${a}site_id = ?`);
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, " ").replace(/<[^>]*>/g, "").trim().slice(0, max);
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const secret = () => process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || "kolakisa-dev";

const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const fromMin = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const validDate = (d) => { if (!DATE.test(d)) return false; const t = new Date(`${d}T00:00:00Z`); return !Number.isNaN(t.getTime()) && t.toISOString().slice(0, 10) === d; };
const addDays = (d, n) => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const isoWeekday = (d) => { const w = new Date(`${d}T00:00:00Z`).getUTCDay(); return w === 0 ? 7 : w; };

// « Maintenant » en heure murale du fuseau de la boutique → { date, minutes }
function localNow(tz, now = new Date()) {
  let parts;
  try { parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(now); } catch { parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(now); }
  const g = (t) => parts.find((p) => p.type === t).value;
  return { date: `${g("year")}-${g("month")}-${g("day")}`, minutes: Number(g("hour")) * 60 + Number(g("minute")) };
}

// ── Réglages ──
const DEFAULTS = { enabled: 0, step_min: 30, min_notice_hours: 24, horizon_days: 30, auto_confirm: 0, timezone: "Europe/Paris" };
function getSettings(s) {
  const row = s.db.prepare(`SELECT * FROM mk_shop_appt_settings WHERE organization_id = ? AND ${siteCond(s)}`).get(s.organizationId, ...siteArgs(s));
  return row || { ...DEFAULTS };
}
function saveSettings(s, input) {
  const cur = getSettings(s);
  const int = (v, lo, hi, label, fallback) => { if (v === undefined || v === "") return fallback; const n = Number(v); if (!Number.isInteger(n) || n < lo || n > hi) throw new MarketingError("invalid_field", `${label} : un nombre entier entre ${lo} et ${hi}.`); return n; };
  const tz = input.timezone === undefined ? cur.timezone : String(input.timezone).trim();
  try { new Intl.DateTimeFormat("fr-FR", { timeZone: tz }); } catch { throw new MarketingError("invalid_field", "Fuseau horaire inconnu (exemple : Europe/Paris)."); }
  const next = {
    enabled: input.enabled === undefined ? cur.enabled : (input.enabled === "1" || input.enabled === 1 || input.enabled === true ? 1 : 0),
    step_min: int(input.step_min, 5, 240, "Pas entre deux créneaux (minutes)", cur.step_min),
    min_notice_hours: int(input.min_notice_hours, 0, 720, "Délai minimum (heures)", cur.min_notice_hours),
    horizon_days: int(input.horizon_days, 1, 365, "Horizon (jours)", cur.horizon_days),
    auto_confirm: input.auto_confirm === undefined ? cur.auto_confirm : (input.auto_confirm === "1" || input.auto_confirm === 1 ? 1 : 0),
    timezone: tz,
  };
  if (cur.id) s.db.prepare("UPDATE mk_shop_appt_settings SET enabled=?, step_min=?, min_notice_hours=?, horizon_days=?, auto_confirm=?, timezone=?, updated_at=datetime('now') WHERE id=?").run(next.enabled, next.step_min, next.min_notice_hours, next.horizon_days, next.auto_confirm, next.timezone, cur.id);
  else s.db.prepare("INSERT INTO mk_shop_appt_settings (organization_id, site_id, enabled, step_min, min_notice_hours, horizon_days, auto_confirm, timezone) VALUES (?,?,?,?,?,?,?,?)").run(s.organizationId, s.siteId ?? null, next.enabled, next.step_min, next.min_notice_hours, next.horizon_days, next.auto_confirm, next.timezone);
  return getSettings(s);
}

// ── Types ──
function listTypes(s, { activeOnly = false } = {}) {
  return s.db.prepare(`SELECT * FROM mk_shop_appt_types WHERE organization_id = ? AND ${siteCond(s)}${activeOnly ? " AND active = 1" : ""} ORDER BY id`).all(s.organizationId, ...siteArgs(s));
}
function getType(s, id) {
  return s.db.prepare(`SELECT * FROM mk_shop_appt_types WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(id) || 0, s.organizationId, ...siteArgs(s)) || null;
}
function saveType(s, input) {
  const name = clean(input.name, 80);
  if (!name) throw new MarketingError("invalid_field", "Donnez un nom au type de rendez-vous.");
  const duration = Number(input.duration_min);
  if (!Number.isInteger(duration) || duration < 5 || duration > 480) throw new MarketingError("invalid_field", "La durée doit être de 5 à 480 minutes.");
  const kind = input.location_kind === "visio" ? "visio" : "place";
  const location = clean(input.location, 300);
  if (kind === "place" && !location) throw new MarketingError("invalid_field", "Indiquez le lieu du rendez-vous (adresse), ou choisissez « visio ».");
  const description = clean(input.description, 1000);
  const active = input.active === "0" || input.active === 0 ? 0 : 1;
  if (input.id) {
    const cur = getType(s, input.id);
    if (!cur) throw new MarketingError("not_found", "Type de rendez-vous introuvable.");
    s.db.prepare("UPDATE mk_shop_appt_types SET name=?, duration_min=?, location_kind=?, location=?, description=?, active=? WHERE id=?").run(name, duration, kind, location || null, description || null, active, cur.id);
    return cur.id;
  }
  return Number(s.db.prepare("INSERT INTO mk_shop_appt_types (organization_id, site_id, name, duration_min, location_kind, location, description, active) VALUES (?,?,?,?,?,?,?,?)").run(s.organizationId, s.siteId ?? null, name, duration, kind, location || null, description || null, active).lastInsertRowid);
}
// Supprime si aucun rendez-vous ne s'y rattache ; sinon le désactive (l'historique reste lisible).
function removeType(s, id) {
  const cur = getType(s, id);
  if (!cur) throw new MarketingError("not_found", "Type de rendez-vous introuvable.");
  if (s.db.prepare("SELECT 1 FROM mk_shop_appointments WHERE type_id = ?").get(cur.id)) { s.db.prepare("UPDATE mk_shop_appt_types SET active = 0 WHERE id = ?").run(cur.id); return "disabled"; }
  s.db.prepare("DELETE FROM mk_shop_appt_types WHERE id = ?").run(cur.id);
  return "deleted";
}

// ── Disponibilités et exceptions ──
function listRules(s) { return s.db.prepare(`SELECT * FROM mk_shop_appt_rules WHERE organization_id = ? AND ${siteCond(s)} ORDER BY weekday, start_time`).all(s.organizationId, ...siteArgs(s)); }
function addRule(s, input) {
  const days = [].concat(input.weekday === undefined ? [] : input.weekday).flatMap((x) => String(x).split(",")).map(Number);
  if (!days.length || days.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) throw new MarketingError("invalid_field", "Choisissez au moins un jour.");
  const start = String(input.start_time || ""); const end = String(input.end_time || "");
  if (!TIME.test(start) || !TIME.test(end)) throw new MarketingError("invalid_field", "Heures de début et de fin : format HH:MM.");
  if (start >= end) throw new MarketingError("invalid_field", "L'heure de fin doit suivre l'heure de début.");
  for (const d of [...new Set(days)]) s.db.prepare("INSERT INTO mk_shop_appt_rules (organization_id, site_id, weekday, start_time, end_time) VALUES (?,?,?,?,?)").run(s.organizationId, s.siteId ?? null, d, start, end);
}
function removeRule(s, id) { s.db.prepare(`DELETE FROM mk_shop_appt_rules WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).run(Number(id) || 0, s.organizationId, ...siteArgs(s)); }
function listExceptions(s) { return s.db.prepare(`SELECT * FROM mk_shop_appt_exceptions WHERE organization_id = ? AND ${siteCond(s)} ORDER BY day, start_time`).all(s.organizationId, ...siteArgs(s)); }
function addException(s, input) {
  const day = String(input.day || "");
  if (!validDate(day)) throw new MarketingError("invalid_field", "Date de l'exception invalide.");
  let start = String(input.start_time || ""); let end = String(input.end_time || "");
  if (start || end) {
    if (!TIME.test(start) || !TIME.test(end) || start >= end) throw new MarketingError("invalid_field", "Plage bloquée invalide : HH:MM à HH:MM, la fin après le début. Laissez vide pour fermer toute la journée.");
  } else { start = null; end = null; }
  s.db.prepare("INSERT INTO mk_shop_appt_exceptions (organization_id, site_id, day, start_time, end_time, reason) VALUES (?,?,?,?,?,?)").run(s.organizationId, s.siteId ?? null, day, start, end, clean(input.reason, 120) || null);
}
function removeException(s, id) { s.db.prepare(`DELETE FROM mk_shop_appt_exceptions WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).run(Number(id) || 0, s.organizationId, ...siteArgs(s)); }

// ── Créneaux ──
// Créneaux libres d'un type pour un jour : [{ time: "HH:MM" }]. { ignoreLimits: true } (report par le vendeur) ignore délai et horizon, jamais les règles ni les conflits.
function slotsFor(s, type, date, { now = new Date(), ignoreLimits = false, exceptAppointmentId = null, settings = getSettings(s) } = {}) {
  if (!type || !validDate(date)) return [];
  const ln = localNow(settings.timezone, now);
  if (!ignoreLimits) {
    if (date < ln.date || date > addDays(ln.date, settings.horizon_days)) return [];
  } else if (date < ln.date) return [];
  const rules = s.db.prepare(`SELECT start_time, end_time FROM mk_shop_appt_rules WHERE organization_id = ? AND ${siteCond(s)} AND weekday = ?`).all(s.organizationId, ...siteArgs(s), isoWeekday(date));
  if (!rules.length) return [];
  const blocks = s.db.prepare(`SELECT start_time, end_time FROM mk_shop_appt_exceptions WHERE organization_id = ? AND ${siteCond(s)} AND day = ?`).all(s.organizationId, ...siteArgs(s), date);
  if (blocks.some((b) => !b.start_time)) return [];
  const busy = s.db.prepare(`SELECT id, start_at, end_at FROM mk_shop_appointments WHERE organization_id = ? AND ${siteCond(s)} AND status <> 'cancelled' AND substr(start_at, 1, 10) = ?`).all(s.organizationId, ...siteArgs(s), date)
    .filter((a) => a.id !== exceptAppointmentId).map((a) => [toMin(a.start_at.slice(11)), toMin(a.end_at.slice(11))]);
  for (const b of blocks) busy.push([toMin(b.start_time), toMin(b.end_time)]);
  const dayOffset = (Date.parse(`${date}T00:00:00Z`) - Date.parse(`${ln.date}T00:00:00Z`)) / 60000; // minutes entre aujourd'hui 00:00 et ce jour 00:00
  const out = new Set();
  for (const r of rules) {
    for (let m = toMin(r.start_time); m + type.duration_min <= toMin(r.end_time); m += settings.step_min) {
      const end = m + type.duration_min;
      if (!ignoreLimits && m + dayOffset < ln.minutes + settings.min_notice_hours * 60) continue;
      if (busy.some(([a, b]) => m < b && end > a)) continue;
      out.add(m);
    }
  }
  return [...out].sort((a, b) => a - b).map((m) => ({ time: fromMin(m) }));
}
// Jours (dans l'horizon) qui ont au moins un créneau libre : [{ date, count }]
function availableDays(s, type, { now = new Date() } = {}) {
  const settings = getSettings(s);
  const today = localNow(settings.timezone, now).date;
  const days = [];
  for (let i = 0; i <= settings.horizon_days; i += 1) {
    const d = addDays(today, i);
    const n = slotsFor(s, type, d, { now, settings }).length;
    if (n) days.push({ date: d, count: n });
  }
  return days;
}

// ── Lien signé d'annulation (lié au rendez-vous, à l'e-mail et à la date de création ; jamais stocké) ──
function token(a) { return crypto.createHmac("sha256", secret()).update(`shop-appt:${a.id}:${a.customer_email}:${a.created_at}`).digest("hex").slice(0, 32); }
function tokenOk(a, given) { const x = Buffer.from(token(a)); const y = Buffer.from(String(given || "")); return x.length === y.length && crypto.timingSafeEqual(x, y); }

// ── Réservation ──
function get(s, id) {
  return s.db.prepare(`SELECT a.*, t.name AS type_name, t.duration_min, t.location_kind, t.location, p.name AS product_name, p.slug AS product_slug
    FROM mk_shop_appointments a JOIN mk_shop_appt_types t ON t.id = a.type_id LEFT JOIN mk_shop_products p ON p.id = a.product_id
    WHERE a.id = ? AND a.organization_id = ? AND ${siteCond(s, "a.")}`).get(Number(id) || 0, s.organizationId, ...siteArgs(s)) || null;
}
function book(s, input, { now = new Date() } = {}) {
  const settings = getSettings(s);
  if (!settings.enabled) throw new MarketingError("forbidden", "La prise de rendez-vous n'est pas ouverte.");
  const type = getType(s, input.type_id);
  if (!type || !type.active) throw new MarketingError("not_found", "Ce type de rendez-vous n'existe pas ou n'est plus proposé.");
  const name = clean(input.name, 80);
  if (name.length < 2) throw new MarketingError("invalid_field", "Indiquez votre nom.");
  const email = clean(input.email, 160).toLowerCase();
  if (!EMAIL.test(email)) throw new MarketingError("invalid_field", "Indiquez une adresse e-mail valide.");
  const phone = clean(input.phone, 30);
  if (phone && !/^[0-9+().\s-]{6,30}$/.test(phone)) throw new MarketingError("invalid_field", "Numéro de téléphone invalide.");
  const note = clean(input.note, 1000);
  const date = String(input.date || ""); const time = String(input.time || "");
  if (!validDate(date) || !TIME.test(time)) throw new MarketingError("invalid_field", "Choisissez un créneau.");
  let productId = null;
  if (input.product_id) {
    const p = s.db.prepare(`SELECT id FROM mk_shop_products WHERE id = ? AND organization_id = ? AND ${siteCond(s)} AND status = 'published' AND deleted_at IS NULL`).get(Number(input.product_id) || 0, s.organizationId, ...siteArgs(s));
    if (!p) throw new MarketingError("not_found", "Ce produit n'est plus disponible.");
    productId = p.id;
  }
  // Limite : au plus 3 rendez-vous à venir non annulés par adresse e-mail (évite de bloquer l'agenda)
  const ln = localNow(settings.timezone, now);
  const pending = s.db.prepare(`SELECT COUNT(*) AS n FROM mk_shop_appointments WHERE organization_id = ? AND ${siteCond(s)} AND lower(customer_email) = ? AND status <> 'cancelled' AND start_at >= ?`).get(s.organizationId, ...siteArgs(s), email, `${ln.date} 00:00`).n;
  if (pending >= 3) throw new MarketingError("invalid_field", "Vous avez déjà 3 rendez-vous à venir. Annulez-en un pour en prendre un autre.");
  if (!slotsFor(s, type, date, { now, settings }).some((x) => x.time === time)) throw new MarketingError("conflict", "Ce créneau n'est plus disponible. Choisissez-en un autre.");
  const start = `${date} ${time}`; const end = `${date} ${fromMin(toMin(time) + type.duration_min)}`;
  const status = settings.auto_confirm ? "confirmed" : "pending";
  let id;
  try {
    id = Number(s.db.prepare("INSERT INTO mk_shop_appointments (organization_id, site_id, type_id, product_id, start_at, end_at, customer_name, customer_email, customer_phone, note, status) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
      .run(s.organizationId, s.siteId ?? null, type.id, productId, start, end, name, email, phone || null, note || null, status).lastInsertRowid);
  } catch (error) {
    if (/UNIQUE/i.test(String(error.message))) throw new MarketingError("conflict", "Ce créneau vient d'être pris. Choisissez-en un autre.");
    throw error;
  }
  return get(s, id);
}

function cancelByCustomer(s, id, given) {
  const a = get(s, id);
  if (!a || !tokenOk(a, given)) throw new MarketingError("not_found", "Lien d'annulation invalide.");
  if (a.status === "cancelled") return { appointment: a, already: true };
  s.db.prepare("UPDATE mk_shop_appointments SET status = 'cancelled', cancelled_by = 'customer', updated_at = datetime('now') WHERE id = ?").run(a.id);
  return { appointment: get(s, a.id), already: false };
}

// ── Vendeur ──
function adminList(s, { status, scope = "upcoming", page = 1, perPage = 50, now = new Date() } = {}) {
  const settings = getSettings(s);
  const today = localNow(settings.timezone, now).date;
  const where = ["a.organization_id = ?", siteCond(s, "a.")]; const args = [s.organizationId, ...siteArgs(s)];
  if (["pending", "confirmed", "cancelled"].includes(status)) { where.push("a.status = ?"); args.push(status); }
  if (scope === "past") { where.push("a.start_at < ?"); args.push(`${today} 00:00`); } else { where.push("a.start_at >= ?"); args.push(`${today} 00:00`); }
  const total = s.db.prepare(`SELECT COUNT(*) AS n FROM mk_shop_appointments a WHERE ${where.join(" AND ")}`).get(...args).n;
  const p = Math.max(1, Number(page) || 1);
  const items = s.db.prepare(`SELECT a.*, t.name AS type_name, t.duration_min, p.name AS product_name FROM mk_shop_appointments a JOIN mk_shop_appt_types t ON t.id = a.type_id LEFT JOIN mk_shop_products p ON p.id = a.product_id
    WHERE ${where.join(" AND ")} ORDER BY a.start_at ${scope === "past" ? "DESC" : "ASC"} LIMIT ? OFFSET ?`).all(...args, perPage, (p - 1) * perPage);
  const pendingCount = s.db.prepare(`SELECT COUNT(*) AS n FROM mk_shop_appointments WHERE organization_id = ? AND ${siteCond(s)} AND status = 'pending' AND start_at >= ?`).get(s.organizationId, ...siteArgs(s), `${today} 00:00`).n;
  return { items, total, page: p, perPage, pending: pendingCount };
}
function setStatus(s, id, status) {
  const a = get(s, id);
  if (!a) throw new MarketingError("not_found", "Rendez-vous introuvable.");
  if (!["confirmed", "cancelled"].includes(status)) throw new MarketingError("invalid_field", "Statut inconnu.");
  if (a.status === status) return a;
  if (a.status === "cancelled") throw new MarketingError("conflict", "Ce rendez-vous est annulé : le créneau a pu être repris. Reportez-le ou demandez au client de reprendre rendez-vous.");
  s.db.prepare("UPDATE mk_shop_appointments SET status = ?, cancelled_by = ?, updated_at = datetime('now') WHERE id = ?").run(status, status === "cancelled" ? "seller" : null, a.id);
  return get(s, a.id);
}
// Report : le nouveau créneau doit être réellement libre (règles, exceptions, autres rendez-vous). Le client est prévenu par l'appelant.
function reschedule(s, id, date, time, { now = new Date() } = {}) {
  const a = get(s, id);
  if (!a) throw new MarketingError("not_found", "Rendez-vous introuvable.");
  if (a.status === "cancelled") throw new MarketingError("conflict", "Un rendez-vous annulé ne peut pas être reporté.");
  if (!validDate(String(date || "")) || !TIME.test(String(time || ""))) throw new MarketingError("invalid_field", "Choisissez une date et une heure (HH:MM).");
  const type = getType(s, a.type_id);
  if (!slotsFor(s, type, date, { now, ignoreLimits: true, exceptAppointmentId: a.id }).some((x) => x.time === time)) throw new MarketingError("conflict", "Ce créneau n'est pas libre (hors disponibilités, bloqué ou déjà pris).");
  const start = `${date} ${time}`; const end = `${date} ${fromMin(toMin(time) + type.duration_min)}`;
  try { s.db.prepare("UPDATE mk_shop_appointments SET start_at = ?, end_at = ?, updated_at = datetime('now') WHERE id = ?").run(start, end, a.id); } catch (error) {
    if (/UNIQUE/i.test(String(error.message))) throw new MarketingError("conflict", "Ce créneau est déjà pris.");
    throw error;
  }
  return get(s, a.id);
}

module.exports = { getSettings, saveSettings, listTypes, getType, saveType, removeType, listRules, addRule, removeRule, listExceptions, addException, removeException, slotsFor, availableDays, token, tokenOk, get, book, cancelByCustomer, adminList, setStatus, reschedule, localNow, validDate, isoWeekday };
