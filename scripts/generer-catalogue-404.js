// Génère docs/theme-builder/404/CATALOGUE_FINAL.md depuis le catalogue (axes réels de chacun des 100 modèles).
// Usage : node scripts/generer-catalogue-404.js
const fs = require("fs");
const path = require("path");
const C = require("../src/themeBuilder/catalog");
const L = {
  C: { 1: "centré", 2: "scindé", 3: "asymétrique", 4: "plein cadre", 5: "grille / bento", 6: "colonnes éditoriales", 7: "terminal", 8: "fenêtre d'application", 9: "affiche", 10: "escalier / diagonale", 11: "parcours vertical", 12: "horizontal / carrousel", 13: "plan / schéma", 14: "conversation", 15: "bandeau + contenu", 16: "overlay / palette", 17: "pile typographique", 18: "sommaire / liste pleine largeur", 19: "onglets" },
  N: { 1: "géant", 2: "discret", 3: "4 · objet · 4", 4: "intégré à l'illustration", 5: "dégradé", 6: "aucun", 7: "animé", 8: "glitch", 9: "pixel", 10: "console", 11: "contour" },
  P: { 1: "clair", 2: "sombre", 3: "monochrome", 4: "vive", 5: "pastel", 6: "néon", 7: "terre", 8: "luxe", 9: "duotone", 10: "couleurs du site" },
  T: { 1: "sans", 2: "serif", 3: "chasse fixe", 4: "condensée", 5: "manuscrite", 6: "pixel", 7: "slab", 8: "mixte" },
  D: { 1: "≤ 6", 2: "7–12", 3: "13–22", 4: "> 22" },
};
const E = C.entries("not_found");
let md = `# Catalogue final — les 100 modèles de la page 404 (axes réels)

> Fichier généré par \`node scripts/generer-catalogue-404.js\` à partir du catalogue (\`catalog/not_found2\`). Axes **déclarés** : composition (C), numéro (N), palette (P), typographie (T) ; axes **dérivés du document construit** : média (M), animation (A), parcours (R), densité (D). Tous les couples de modèles diffèrent sur au moins 5 axes sur 8 (dont 3 structurels sur 6) et leurs arbres se ressemblent à 85 % au plus : voir \`tests/theme-builder-404-diversite.test.js\`.

| ID | Famille | Nom | Composition | Numéro | Média | Animation | Parcours | Palette | Typo | Densité |
|---|---|---|---|---|---|---|---|---|---|---|
`;
for (const e of E) { const a = e.axes; md += `| ${e.code} | ${e.layoutLabel} | ${e.name} | ${L.C[a.C]} | ${L.N[a.N]} | ${a.M} | ${a.A} | ${a.R} | ${L.P[a.P]} | ${L.T[a.T]} | ${L.D[a.D]} |\n`; }
const fam = {}; E.forEach((e) => { fam[e.layoutLabel] = (fam[e.layoutLabel] || 0) + 1; });
md += "\n## Répartition par famille\n" + Object.entries(fam).map(([k, v]) => `- ${k} : ${v}`).join("\n") + "\n";
fs.writeFileSync(path.join(__dirname, "../docs/theme-builder/404/CATALOGUE_FINAL.md"), md);
console.log(E.length, "modèles écrits dans docs/theme-builder/404/CATALOGUE_FINAL.md");
