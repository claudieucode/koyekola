// Partie « pure » du prix effectif (aucun accès à la base à l'import) : le module Marketing peut l'importer sans effet de bord.
// Règle (identique à pricing.js, vérifiée par les tests de parité) : l'offre active la moins chère l'emporte, et elle ne
// peut que BAISSER le prix standard de la formation.

// « AAAA-MM-JJ HH:MM:SS » en UTC : même format que les colonnes created_at du site
const sqlNow = (now = new Date()) => new Date(now).toISOString().slice(0, 19).replace("T", " ");

// Offre dans sa période : actif, début passé (ou vide), fin pas encore atteinte (ou vide). Deux « ? » : l'instant courant.
const ACTIVE = "o.active = 1 AND (o.starts_at IS NULL OR o.starts_at <= ?) AND (o.ends_at IS NULL OR ? < o.ends_at)";

// Fragment SQL du prix effectif ; `alias` = alias de la table courses. Lier les deux « ? » avec nowParams().
const effectivePriceSql = (alias = "courses") =>
  `COALESCE((SELECT MIN(o.price_cents) FROM offers o WHERE o.course_id = ${alias}.id AND o.price_cents < ${alias}.price_cents AND ${ACTIVE}), ${alias}.price_cents)`;
const nowParams = (now = new Date()) => [sqlNow(now), sqlNow(now)];

module.exports = { sqlNow, ACTIVE, effectivePriceSql, nowParams };
