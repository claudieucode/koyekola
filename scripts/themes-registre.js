// Registre des thèmes et de leurs ressources : node scripts/themes-registre.js → écrit docs/KOLAKISA_THEMES_REGISTRE.md (160 thèmes, catégories, polices avec licence et source, visuels).
// Rien n'est inventé : les polices et leurs licences viennent du manifeste de la bibliothèque de polices (public/fonts/library/manifest.json), les visuels sont les illustrations
// originales générées par Kolakisa (themes/library/art.js, motifs et graine déclarés par chaque fiche). Aucune photographie ni image tierce n'est embarquée.
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.join(__dirname, "..");
const library = require(path.join(ROOT, "src", "marketing", "themes", "library"));
const fontLib = require(path.join(ROOT, "src", "utils", "fontLibrary"));
const tokensLib = require(path.join(ROOT, "src", "marketing", "pages", "tokens"));

const fontRow = (id) => { const f = fontLib.byId(id); if (f) return `${f.family} (${f.license}, ${f.source})`; return tokensLib.FONTS[id] ? `${tokensLib.FONTS[id].label} (police intégrée à Kolakisa)` : String(id); };
const lines = [];
lines.push("# Registre des thèmes Kolakisa : catégories, polices et visuels", "", `Généré par \`node scripts/themes-registre.js\` : ${library.load().specs.length} thèmes.`, "",
  "**Visuels.** Tous les visuels des thèmes sont des illustrations vectorielles originales générées par Kolakisa à partir de la palette du thème (aucune photographie, aucune image de banque d'images, aucune attribution requise). Les conditions des banques d'images ont été relues le 23/10/2026 : Pexels interdit de « redistribuer ou vendre les photos sur d'autres plateformes » et de vendre des copies non modifiées (sa page ne dit rien de l'inclusion dans une bibliothèque de thèmes distribuée) ; Unsplash interdit de compiler ses images « pour reproduire un service similaire ou concurrent » et leur revente sans modification importante. Aucun droit de redistribution dans un produit n'étant établi, aucune photographie tierce n'est livrée avec les thèmes : les photos réelles se choisissent dans la médiathèque du site.", "",
  "**Polices.** Bibliothèque de polices libres de Kolakisa (licence indiquée par le manifeste de chaque famille), hébergées localement : aucun appel à un service tiers.", "");
for (const c of library.CATEGORIES) {
  const specs = library.load().specs.filter((s) => s.category === c.key);
  lines.push(`## ${c.label} (${specs.length})`, "", "| Clé | Nom | Type de site | Styles | Polices (titres / texte) | Visuels (motifs) |", "|---|---|---|---|---|---|");
  for (const s of specs) lines.push(`| \`${s.key}\` | ${s.name} | ${s.siteType} | ${s.tags.join(", ")} | ${fontRow(s.tokens.fonts.heading)} / ${fontRow(s.tokens.fonts.body)} | original (SVG) : ${((s.art && s.art.motifs) || ["dunes"]).join(", ")} |`);
  lines.push("");
}
fs.writeFileSync(path.join(ROOT, "docs", "KOLAKISA_THEMES_REGISTRE.md"), lines.join("\n"));
console.log(`docs/KOLAKISA_THEMES_REGISTRE.md écrit (${library.load().specs.length} thèmes).`);
