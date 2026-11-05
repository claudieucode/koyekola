// Matrice anti-clone : empreinte à 8 axes de chaque thème + nombre d'axes partagés par paire. Écrit docs/themes/MATRICE_ANTI_CLONE.md et échoue si une règle est violée.
//   node scripts/themes-matrice.js
const fs = require("node:fs");
const path = require("node:path");
const library = require("../src/marketing/themes/library");
const audit = require("../src/marketing/themes/packs/audit");
const specs = library.allMeta().map((m) => library.specOf(m.key));
const label = (s, k) => (k === "typo" ? `${s.tokens.fonts.heading.replace("font.", "")} / ${s.tokens.fonts.body.replace("font.", "")}` : s.dna[k]);
const rows = [`| Thème | ${audit.AXES.join(" | ")} | Palette |`, `|${"---|".repeat(audit.AXES.length + 2)}`];
for (const s of specs) rows.push(`| ${s.key} | ${audit.AXES.map((k) => label(s, k)).join(" | ")} | ${s.tokens.colors.primary} sur ${s.tokens.colors.background} |`);
let max = 0, worst = "";
for (let i = 0; i < specs.length; i++) for (let j = i + 1; j < specs.length; j++) { const n = audit.sharedAxes(specs[i], specs[j]).length; if (n > max) { max = n; worst = `${specs[i].key}/${specs[j].key}`; } }
const problems = [...library.problems(), ...audit.auditDiversity(specs)];
const md = `# Matrice anti-clone (${specs.length} thèmes)\n\nRègle : deux thèmes ne partagent jamais plus de 3 axes sur 8, ni la paire typographique, ni la palette dominante.\nMaximum constaté : ${max} axe(s) partagé(s)${worst ? ` (${worst})` : ""}. Problèmes : ${problems.length ? problems.join(" ; ") : "aucun"}.\n\n${rows.join("\n")}\n`;
fs.mkdirSync(path.join(__dirname, "..", "docs", "themes"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "..", "docs", "themes", "MATRICE_ANTI_CLONE.md"), md);
console.log(`${specs.length} thèmes, max ${max} axes partagés, ${problems.length} problème(s)`);
process.exit(problems.length ? 1 : 0);
