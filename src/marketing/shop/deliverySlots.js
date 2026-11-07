// Créneaux de livraison : le vendeur définit des créneaux récurrents ; une méthode de livraison peut en exiger un (ex. froid).
// Les créneaux proposés au client sont CALCULÉS à la demande (jamais stockés) : jour de la semaine, délai minimum, horizon, jours exclus,
// et capacité restante = capacité − commandes déjà enregistrées sur ce créneau et cette date (hors annulées/remboursées).
const { MarketingError } = require("../errors");

const siteCond = (s, a = "") => (s.siteId == null ? `${a}site_id IS NULL` : `${a}site_id = ?`);
const siteArgs = (s) => (s.siteId == null ? [] : [s.siteId]);
const json = (v, f) => { try { const x = JSON.parse(v); return Array.isArray(x) ? x : f; } catch { return f; } };
const DAYS = ["", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoDay = (d) => (d.getDay() === 0 ? 7 : d.getDay());
const validDate = (str) => { if (!DATE.test(str)) return false; const [y, m, d] = str.split("-").map(Number); const x = new Date(y, m - 1, d); return x.getFullYear() === y && x.getMonth() === m - 1 && x.getDate() === d; };
const intIn = (v, min, max, label) => { const n = Number(v); if (v === "" || v == null || !Number.isInteger(n) || n < min || n > max) throw new MarketingError("invalid_field", `${label} : nombre entier entre ${min} et ${max} attendu.`); return n; };
const dateLabel = (str) => { const [y, m, d] = str.split("-").map(Number); return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d))); };

function shape(r) { return { ...r, weekdays: json(r.weekdays, []).map(Number), excluded: json(r.excluded_dates, []) }; }
function list(s, { onlyActive = false } = {}) {
  return s.db.prepare(`SELECT * FROM mk_shop_delivery_slots WHERE organization_id = ? AND ${siteCond(s)}${onlyActive ? " AND active = 1" : ""} ORDER BY start_time, id`).all(s.organizationId, ...siteArgs(s)).map(shape);
}
function summary(slot) { return `${slot.weekdays.map((d) => DAYS[d]).join(", ")} · ${slot.start_time}–${slot.end_time}`; }

function save(s, input) {
  const weekdays = [...new Set([].concat(input.weekdays || []).flatMap((x) => String(x).split(",")).map(Number))].filter((d) => Number.isInteger(d) && d >= 1 && d <= 7).sort();
  if (!weekdays.length) throw new MarketingError("invalid_field", "Choisissez au moins un jour de la semaine.");
  const start = String(input.start_time || "").trim(); const end = String(input.end_time || "").trim();
  if (!TIME.test(start) || !TIME.test(end)) throw new MarketingError("invalid_field", "Indiquez l'heure de début et de fin (format HH:MM).");
  if (end <= start) throw new MarketingError("invalid_field", "L'heure de fin doit être après l'heure de début.");
  const capacity = intIn(input.capacity, 1, 1000, "Capacité");
  const notice = intIn(input.min_notice_hours === undefined || input.min_notice_hours === "" ? 24 : input.min_notice_hours, 0, 720, "Délai minimum (heures)");
  const horizon = intIn(input.horizon_days === undefined || input.horizon_days === "" ? 14 : input.horizon_days, 1, 90, "Horizon (jours)");
  const excluded = [...new Set(String(input.excluded_dates || "").split(/[\s,;]+/).filter(Boolean))];
  const bad = excluded.find((d) => !validDate(d));
  if (bad) throw new MarketingError("invalid_field", `Date exclue invalide : « ${bad.slice(0, 20)} » (format AAAA-MM-JJ).`);
  const label = String(input.label || "").replace(/[\u0000-\u001f\u007f<>]+/g, " ").trim().slice(0, 60) || null;
  return Number(s.db.prepare("INSERT INTO mk_shop_delivery_slots (organization_id, site_id, label, weekdays, start_time, end_time, capacity, min_notice_hours, horizon_days, excluded_dates) VALUES (?,?,?,?,?,?,?,?,?,?)")
    .run(s.organizationId, s.siteId ?? null, label, JSON.stringify(weekdays), start, end, capacity, notice, horizon, JSON.stringify(excluded.sort())).lastInsertRowid);
}
function ownSlot(s, id) {
  const r = s.db.prepare(`SELECT * FROM mk_shop_delivery_slots WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).get(Number(id) || 0, s.organizationId, ...siteArgs(s));
  return r ? shape(r) : null;
}
function remove(s, id) {
  if (!ownSlot(s, id)) throw new MarketingError("not_found", "Créneau introuvable.");
  s.db.prepare("DELETE FROM mk_shop_delivery_slots WHERE id = ?").run(Number(id));
}
function setActive(s, id, active) {
  if (!ownSlot(s, id)) throw new MarketingError("not_found", "Créneau introuvable.");
  s.db.prepare("UPDATE mk_shop_delivery_slots SET active = ? WHERE id = ?").run(active ? 1 : 0, Number(id));
}
function setMethodRequires(s, methodId, on) {
  const r = s.db.prepare(`UPDATE mk_shop_shipping_methods SET requires_slot = ? WHERE id = ? AND organization_id = ? AND ${siteCond(s)}`).run(on ? 1 : 0, Number(methodId) || 0, s.organizationId, ...siteArgs(s));
  if (!r.changes) throw new MarketingError("not_found", "Méthode introuvable.");
}

// Nombre de commandes déjà enregistrées sur un créneau et une date (les commandes annulées ou remboursées libèrent la place).
function used(s, slotId, date) {
  return s.db.prepare("SELECT COUNT(*) AS n FROM mk_shop_orders WHERE delivery_slot_id = ? AND delivery_date = ? AND status NOT IN ('cancelled','refunded')").get(slotId, date).n;
}
// Dates où un créneau est réellement proposable (jour de semaine, jour non exclu, délai minimum, horizon).
function datesOf(slot, now) {
  const out = [];
  const [hh, mm] = slot.start_time.split(":").map(Number);
  const earliest = now.getTime() + slot.min_notice_hours * 3600e3;
  for (let i = 0; i <= slot.horizon_days; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    if (!slot.weekdays.includes(isoDay(day))) continue;
    const date = ymd(day);
    if (slot.excluded.includes(date)) continue;
    if (new Date(day.getFullYear(), day.getMonth(), day.getDate(), hh, mm).getTime() < earliest) continue;
    out.push(date);
  }
  return out;
}
// → [{ date, label, slots:[{ slotId, value, start, end, name, remaining }] }] : uniquement des créneaux avec de la place.
function available(s, { now = new Date() } = {}) {
  const days = new Map();
  for (const slot of list(s, { onlyActive: true })) {
    for (const date of datesOf(slot, now)) {
      const remaining = slot.capacity - used(s, slot.id, date);
      if (remaining <= 0) continue;
      if (!days.has(date)) days.set(date, { date, label: dateLabel(date), slots: [] });
      days.get(date).slots.push({ slotId: slot.id, value: `${slot.id}|${date}`, start: slot.start_time, end: slot.end_time, name: slot.label, remaining });
    }
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ ...d, slots: d.slots.sort((a, b) => a.start.localeCompare(b.start) || a.slotId - b.slotId) }));
}
// Pour l'écran de commande : null si aucune méthode proposée n'exige de créneau.
function forCheckout(s, priced, opts) {
  const needing = ((priced.shipping && priced.shipping.options) || []).filter((o) => o.requiresSlot);
  if (!needing.length) return null;
  return { days: available(s, opts), methods: needing.map((o) => ({ id: o.id, name: o.name })) };
}
// Revalidation SERVEUR du créneau choisi ("idCréneau|AAAA-MM-JJ"), à appeler dans la transaction de création de commande.
// → { slotId, date, start, end } ; MarketingError si absent, invalide, hors délai/horizon ou complet.
function validateChoice(s, raw, { now = new Date() } = {}) {
  const [id, date] = String(raw || "").split("|");
  if (!id || !date) throw new MarketingError("slot_required", "Choisissez un créneau de livraison pour cette méthode.");
  const slot = ownSlot(s, id);
  if (!slot || !slot.active || !validDate(date) || !datesOf(slot, now).includes(date)) throw new MarketingError("slot_unavailable", "Ce créneau de livraison n'est plus disponible. Choisissez-en un autre.");
  if (used(s, slot.id, date) >= slot.capacity) throw new MarketingError("slot_full", "Ce créneau de livraison est complet. Choisissez-en un autre.");
  return { slotId: slot.id, date, start: slot.start_time, end: slot.end_time };
}
function record(s, orderId, choice) {
  s.db.prepare("UPDATE mk_shop_orders SET delivery_slot_id = ?, delivery_date = ?, delivery_start = ?, delivery_end = ? WHERE id = ?").run(choice.slotId, choice.date, choice.start, choice.end, orderId);
}
// Phrase lisible pour la commande (page, e-mail, admin) ; null si la commande n'a pas de créneau.
function describe(order) {
  if (!order || !order.delivery_date) return null;
  return `${dateLabel(order.delivery_date)}, de ${order.delivery_start} à ${order.delivery_end}`;
}
module.exports = { list, save, remove, setActive, setMethodRequires, available, forCheckout, validateChoice, record, describe, summary, DAYS };
