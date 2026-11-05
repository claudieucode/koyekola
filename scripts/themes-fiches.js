// Fiches d'identité de tous les thèmes (concept, catégorie, polices, palette, options, pages, empreinte à 8 axes) → docs/themes/FICHES_IDENTITE.md
//   node scripts/themes-fiches.js
const fs = require("node:fs");
const path = require("node:path");
const library = require("../src/marketing/themes/library");
const audit = require("../src/marketing/themes/packs/audit");

const specs = library.allMeta().map((m) => library.specOf(m.key));
const cats = new Map(library.CATEGORIES.map((c) => [c.key, c.label]));
const font = (id) => String(id).replace("font.", "");
const out = [`# Fiches d'identité des thèmes (${specs.length})`, "", "Généré par `node scripts/themes-fiches.js`. Chaque thème est un paquet autonome dans `src/marketing/themes/packs/<clé>/`.", ""];
const rows = ["| Clé | Nom | Catégorie | Concept | Polices (titres / texte) | Palette | Pages | Options |", "|---|---|---|---|---|---|---|---|"];
for (const s of specs) {
  const c = s.tokens.colors;
  rows.push(`| ${s.key} | ${s.name} | ${cats.get(s.category) || s.category} | ${s.concept} | ${font(s.tokens.fonts.heading)} / ${font(s.tokens.fonts.body)} | ${c.primary} sur ${c.background} | ${s.pages.length} | ${(s.options || []).map((o) => o.key).join(", ")} |`);
}
out.push("## Vue d'ensemble", "", ...rows, "", "## Empreinte structurelle à 8 axes", "");
const head = ["Clé", ...audit.AXES];
out.push(`| ${head.join(" | ")} |`, `|${"---|".repeat(head.length)}`);
for (const s of specs) out.push(`| ${s.key} | ${audit.AXES.map((k) => (k === "typo" ? `${font(s.tokens.fonts.heading)} + ${font(s.tokens.fonts.body)}` : s.dna[k])).join(" | ")} |`);
fs.mkdirSync(path.join(__dirname, "..", "docs", "themes"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "..", "docs", "themes", "FICHES_IDENTITE.md"), out.join("\n") + "\n");
console.log(`${specs.length} fiches écrites`);
