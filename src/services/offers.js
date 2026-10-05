// Offres d'une formation (prix promo avec dates) : validation, lecture et écriture. Le prix à PAYER reste décidé par
// pricing.js (jamais ici). Toute écriture est limitée au propriétaire de la formation (instructor_id), vérifié côté serveur.
const db = require("../config/database");
const { isYmd, parisDayStart, addDays, sqlUtc, TZ } = require("./gestion/common");
const { sqlNow } = require("./pricing");

// États affichés : « on » en cours, « soon » à venir, « ended » terminée, « off » désactivée
function stateOf(offer, now = new Date()) {
  const t = sqlNow(now);
  if (!offer.active) return { key: "off", label: "Désactivée" };
  if (offer.starts_at && offer.starts_at > t) return { key: "soon", label: "À venir" };
  if (offer.ends_at && offer.ends_at <= t) return { key: "ended", label: "Terminée" };
  return { key: "on", label: "En cours" };
}

function listOffers(courseId, now = new Date()) {
  return db.prepare("SELECT * FROM offers WHERE course_id = ? ORDER BY active DESC, COALESCE(ends_at, '9999') ASC, id DESC").all(courseId)
    .map((o) => ({ ...o, state: stateOf(o, now), days: formOf(o) })); // days : début et fin en jours de Paris, pour l'affichage
}
const getOffer = (courseId, id) => db.prepare("SELECT * FROM offers WHERE id = ? AND course_id = ?").get(id, courseId) || null;

// Jour de Paris (« AAAA-MM-JJ ») d'une date SQL UTC ; pour une FIN (borne exclue), le dernier jour inclus
function dayOf(v, end = false) {
  if (!v) return "";
  const d = new Date(`${v.replace(" ", "T")}Z`);
  if (end) d.setTime(d.getTime() - 1000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

// Valeurs du formulaire à partir d'une offre enregistrée (dates affichées en jour de Paris, fin incluse)
function formOf(o) {
  const day = dayOf;
  return { name: o.name, price: (o.price_cents / 100).toFixed(2), starts_at: day(o.starts_at), ends_at: day(o.ends_at, true), active: o.active };
}

// → { errors, values } (erreurs par champ, en français) ; `course` = formation (prix standard de référence)
function validateOffer(course, input = {}) {
  const errors = {}, v = {};
  v.name = String(input.name || "").trim().replace(/\s+/g, " ");
  if (!v.name || v.name.length > 60) errors.name = "Donnez un nom à l'offre (60 caractères au plus), par exemple « Lancement ».";

  const raw = String(input.price ?? "").replace(",", ".").trim();
  const cents = Math.round(Number(raw) * 100);
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(raw)) errors.price = "Prix en euros (deux décimales au plus), par exemple 29,90. Mettez 0 pour une offre gratuite.";
  else if (cents >= course.price_cents) errors.price = `Le prix de l'offre doit être inférieur au prix standard (${(course.price_cents / 100).toFixed(2).replace(".", ",")} €) : une offre ne peut que baisser le prix.`;
  else v.price_cents = cents;

  const day = (field, endOfDay) => {
    const val = String(input[field] || "").trim();
    if (!val) return null;
    if (!isYmd(val)) { errors[field] = "Date invalide."; return null; }
    return sqlUtc(parisDayStart(endOfDay ? addDays(val, 1) : val)); // fin incluse : l'offre dure toute la journée choisie
  };
  v.starts_at = day("starts_at", false);
  v.ends_at = day("ends_at", true);
  if (v.starts_at && v.ends_at && v.ends_at <= v.starts_at) errors.ends_at = "La date de fin doit suivre la date de début.";
  v.active = input.active === "on" || input.active === "1" || input.active === true ? 1 : 0;
  return Object.keys(errors).length ? { errors, values: v } : { values: v };
}

function createOffer(instructorId, courseId, values) {
  return Number(db.prepare("INSERT INTO offers (course_id, instructor_id, name, price_cents, starts_at, ends_at, active) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(courseId, instructorId, values.name, values.price_cents, values.starts_at, values.ends_at, values.active).lastInsertRowid);
}
function updateOffer(courseId, id, values) {
  return db.prepare("UPDATE offers SET name = ?, price_cents = ?, starts_at = ?, ends_at = ?, active = ?, updated_at = datetime('now') WHERE id = ? AND course_id = ?")
    .run(values.name, values.price_cents, values.starts_at, values.ends_at, values.active, id, courseId).changes === 1;
}
const setOfferActive = (courseId, id, active) =>
  db.prepare("UPDATE offers SET active = ?, updated_at = datetime('now') WHERE id = ? AND course_id = ?").run(active ? 1 : 0, id, courseId).changes === 1;
const deleteOffer = (courseId, id) => db.prepare("DELETE FROM offers WHERE id = ? AND course_id = ?").run(id, courseId).changes === 1;

module.exports = { dayOf, stateOf, listOffers, getOffer, formOf, validateOffer, createOffer, updateOffer, setOfferActive, deleteOffer };
