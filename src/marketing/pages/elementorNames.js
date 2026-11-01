// Noms Elementor des widgets (table officielle src/marketing/pages/elementorWidgets.json, relevée le 2026-11-01) : ils sont ajoutés aux mots-clés de recherche de la bibliothèque
// de l'éditeur, pour qu'un widget se retrouve par le nom qu'il porte dans Elementor (« Flip Box », « Price Table »…). UNE seule table : la recherche, la doc et les tests la lisent.
const MAP = require("./elementorWidgets.json");

const BY_KEY = new Map();
for (const w of MAP.widgets) {
  if (!w.kolakisa) continue;
  if (!BY_KEY.has(w.kolakisa)) BY_KEY.set(w.kolakisa, []);
  BY_KEY.get(w.kolakisa).push(w.name.replace(/[()]/g, " ").replace(/\s+/g, " ").trim());
}
// mots-clés d'origine + noms Elementor (sans doublon, sans casse)
function withAliases(key, keywords) {
  const names = BY_KEY.get(key);
  return names ? `${keywords || ""} ${names.join(" ")}`.trim() : keywords;
}
module.exports = { MAP, BY_KEY, withAliases };
