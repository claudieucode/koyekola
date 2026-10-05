// Prix effectif d'une formation : l'UNIQUE endroit qui décide du prix à afficher et à payer.
//  - sans offre, c'est exactement courses.price_cents (aucun changement pour les formations existantes) ;
//  - une offre active (dans sa période) peut BAISSER le prix, jamais l'augmenter (une offre au prix ≥ standard est ignorée) ;
//  - plusieurs offres actives en même temps : la moins chère l'emporte (résultat prévisible, pas d'ordre caché) ;
//  - le prix barré affiché est toujours le prix standard de la formation.
const db = require("../config/database");
const { sqlNow, ACTIVE, effectivePriceSql, nowParams } = require("./pricingSql"); // partie SQL pure, partagée avec le module Marketing

function resolve(course, offer) {
  const list = course.price_cents;
  if (offer && offer.price_cents < list) {
    return { price_cents: offer.price_cents, list_price_cents: list, offer: { id: offer.id, name: offer.name, ends_at: offer.ends_at } };
  }
  return { price_cents: list, list_price_cents: list, offer: null };
}

// → { price_cents, list_price_cents, offer: { id, name, ends_at } | null }
function effectivePrice(course, now = new Date()) {
  const t = sqlNow(now);
  const offer = db.prepare(`SELECT o.id, o.name, o.price_cents, o.ends_at FROM offers o WHERE o.course_id = ? AND ${ACTIVE} ORDER BY o.price_cents ASC, o.id ASC LIMIT 1`).get(course.id, t, t);
  return resolve(course, offer);
}

// Même résultat pour une liste de formations, en une seule requête (listes, panier : pas de requête par ligne)
function effectivePrices(courses, now = new Date()) {
  const ids = courses.map((c) => c.id);
  const out = new Map();
  if (!ids.length) return out;
  const t = sqlNow(now);
  const rows = db.prepare(`SELECT o.id, o.course_id, o.name, o.price_cents, o.ends_at FROM offers o WHERE o.course_id IN (${ids.map(() => "?").join(",")}) AND ${ACTIVE} ORDER BY o.price_cents ASC, o.id ASC`).all(...ids, t, t);
  const best = new Map();
  for (const r of rows) if (!best.has(r.course_id)) best.set(r.course_id, r); // la moins chère d'abord grâce au tri
  for (const c of courses) out.set(c.id, resolve(c, best.get(c.id)));
  return out;
}

// Formations avec leur prix effectif : price_cents devient le prix à payer (tout le code existant qui lit price_cents
// — panier, remises, totaux — fonctionne donc sans changement) ; le prix standard est gardé dans standard_price_cents.
function applyEffectivePrices(courses, now = new Date()) {
  const prices = effectivePrices(courses, now);
  return courses.map((c) => {
    const p = prices.get(c.id);
    return { ...c, standard_price_cents: c.price_cents, price_cents: p.price_cents, offer: p.offer };
  });
}

// effectivePriceSql / nowParams (tri et filtre par prix du catalogue) viennent de pricingSql.js : même règle que
// effectivePrice, vérifiée par les tests de parité.
module.exports = { effectivePrice, effectivePrices, applyEffectivePrices, effectivePriceSql, nowParams, sqlNow };
