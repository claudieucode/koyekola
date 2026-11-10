// Catalogue « Archive » (blog, catégories, étiquettes, auteurs, recherche de date) — 100 modèles = 25 familles × 4 concepts. Chaque concept est une VRAIE composition (25 structures de page :
// grille, asymétrique, listes, index, mosaïque, une + brèves, héros, vedettes, journal, frise, cartes à titre superposé, pleine largeur, bandes défilantes, tableau, écran scindé, classement,
// cartes compactes, typographique, mur de fiches, pile…) avec ses réglages propres (colonnes, image, barre latérale, en-tête, navigation, filtre) ET sa propre identité visuelle :
// couleurs en valeurs FIXES et polices de la bibliothèque locale, jamais la charte du site ni celle de l'administration (voir archive-lib/skins.js).
// Trois modes d'identité à l'insertion (env.identity) : « own » (défaut, identité propre), « site » (les valeurs fixes deviennent des jetons du site : le modèle suit la charte) et
// « hybrid » (identité propre + nom du site réel dans l'en-tête). Voir docs/theme-builder/archive/.
const concepts = require("./archive-lib/concepts");
const { skinOf } = require("./archive-lib/skins");
const { build: composeBuild } = require("./archive-lib/compose");

const SKINS = concepts.map(skinOf);
const FAMILIES = [...new Map(concepts.map((c) => [c.famKey, { key: c.famKey, label: c.fam, tags: [], desc: "" }])).values()];

function entries() {
  return concepts.map((c) => {
    const build = composeBuild(c);
    return {
      key: c.key, layoutKey: c.famKey, layoutLabel: c.fam, treatmentKey: c.comp, skinKey: c.key, skinLabel: c.nom, name: c.nom,
      desc: `${c.usage[0].toUpperCase()}${c.usage.slice(1)} — ${c.part}.`,
      tags: [c.fam.toLowerCase(), c.comp, `${c.cols} col.`, c.barre === "0" ? "sans barre latérale" : c.barre === "G" ? "barre à gauche" : c.barre === "D" ? "barre à droite" : "filtres en haut", c.tete, SKINS[c.n - 1].mood === "dark" ? "sombre" : "clair"],
      concept: c.n,
      build: (k) => build(k),
    };
  });
}
module.exports = { type: "archive", kind: "page", ownSkins: true, skins: SKINS, entries, layouts: FAMILIES };
