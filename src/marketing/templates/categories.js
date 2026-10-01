// Catégories de la bibliothèque de modèles (ordre d'affichage). Une catégorie est un simple rangement : aucun effet sur l'envoi.
const CATEGORIES = [
  { key: "general", label: "Général" },
  { key: "welcome", label: "Bienvenue" },
  { key: "newsletter", label: "Lettre d'information" },
  { key: "course", label: "Formation" },
  { key: "promo", label: "Promotion" },
  { key: "event", label: "Événement" },
  { key: "reengage", label: "Relance" },
  { key: "transactional", label: "Transactionnel" },
];
const KEYS = new Set(CATEGORIES.map((c) => c.key));
const isCategory = (key) => typeof key === "string" && KEYS.has(key);

module.exports = { CATEGORIES, isCategory };
