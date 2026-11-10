// Génère la fiche de conception des 100 modèles d'archive (docs/theme-builder/archive-v4/FICHES_100_MODELES.md) à partir des données réelles du catalogue :
// aucune valeur recopiée à la main, la fiche ne peut donc pas diverger du code. Usage : node scripts/doc-archives.js
const fs = require("node:fs"), path = require("node:path");
const concepts = require("../src/themeBuilder/catalog/archive-lib/concepts");
const maisons = require("../src/themeBuilder/catalog/archive-lib/maisons");
const Archive = require("../src/themeBuilder/catalog/archive");
const Catalog = require("../src/themeBuilder/catalog");
const BARRE = { 0: "aucune", G: "gauche", D: "droite", H: "filtres en haut" }, NAV = { N: "numéros", M: "charger plus", PS: "précédent / suivant", I: "défilement infini" }, FIL = { C: "rubriques", CS: "rubriques + recherche", T: "étiquettes", S: "recherche" };
const HEAD = { minimal: "minimal", centré: "centré", bandeau: "bandeau teinté pleine largeur", éditorial: "grand titre + double filet", marge: "titre à gauche, contenu à droite", typo: "typographique", barre: "barre de titre inversée" };
const CARD = { plat: "sans fond, filet bas", aplat: "aplat de couleur", cadre: "cadre fin", ombre: "ombre portée" };
const META = { full: "auteur · date · temps de lecture", "cat-date": "rubrique + date", date: "date seule" };
const depth = (n) => 1 + Math.max(0, ...(n.children || []).map(depth)), count = (n) => 1 + (n.children || []).reduce((a, c) => a + count(c), 0);
const out = [`# Archives v4 — fiches de conception des 100 modèles\n\n> Généré par \`node scripts/doc-archives.js\` à partir du catalogue : ne pas modifier à la main.\n\n## Les 25 maisons\n\n| Maison | Secteur | Palette (fond / encre / accent / second) | Polices (titres + texte) | Geste mémorable | Interaction | En-tête | Cartes | Image | Méta |\n|---|---|---|---|---|---|---|---|---|---|`];
for (const m of maisons) { const t = m[8]; out.push(`| ${m[0]} ${m[1]} | ${m[2]} | ${m[3].join(" / ")} | ${m[4].join(" + ")} | ${m[5]} | ${m[7]} | ${HEAD[t.head]} | ${CARD[t.card]}, arrondi ${t.rad} | ${t.aspect} | ${META[t.meta]} |`); }
out.push(`\n## Les 100 modèles\n\n| Clé | Nom | Maison | Composition | Col. | Barre latérale | En-tête | Navigation | Filtre | Éléments | Niveaux | Mode sombre |\n|---|---|---|---|---|---|---|---|---|---|---|---|`);
for (const c of concepts) { const d = Catalog.build("archive", c.key).sections[0], s = Archive.skins.find((x) => x.key === c.key); out.push(`| \`${c.key}\` | ${c.nom} | ${c.maison} | ${c.comp} | ${c.cols} | ${BARRE[c.barre]} | ${HEAD[c.tete]} | ${NAV[c.nav]} | ${FIL[c.filtre]} | ${count(d)} | ${depth(d)} | ${s.mood === "dark" ? "oui" : "non"} |`); }
fs.writeFileSync(path.join(__dirname, "..", "docs", "theme-builder", "archive-v4", "FICHES_100_MODELES.md"), out.join("\n") + "\n");
console.log("fiches écrites :", concepts.length, "modèles,", maisons.length, "maisons");
