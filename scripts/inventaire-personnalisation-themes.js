// Génère docs/themes/kolakisa-theme-customization-inventory.md : les réglages de personnalisation de CHAQUE thème (manifeste mesuré).
//   node scripts/inventaire-personnalisation-themes.js
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.resolve(__dirname, "..");
const cz = require(path.join(ROOT, "src/marketing/themes/customization"));
const customizer = require(path.join(ROOT, "src/services/customizer"));

const inv = cz.inventory();
const staticLabel = new Map(customizer.catalog(1, "").map((c) => [c.id, c.label]));
const lines = [];
lines.push("# Inventaire des réglages de personnalisation par thème", "");
lines.push(`Généré par \`scripts/inventaire-personnalisation-themes.js\` à partir des manifestes mesurés (${inv.length} thèmes). Un réglage listé a été vu agissant sur le rendu du thème dans Chrome ; les valeurs par défaut sont les valeurs d'origine mesurées.`, "");
lines.push("| Thème | Réglages du thème | Réglages par composant | Réglages du moteur | Total |", "|---|---:|---:|---:|---:|");
for (const t of inv) {
  const own = t.panels.filter((p) => p.id === "theme").reduce((n, p) => n + p.controls.length, 0);
  const gen = t.panels.filter((p) => p.id !== "theme").reduce((n, p) => n + p.controls.length, 0);
  lines.push(`| ${t.name} (\`${t.key}\`) | ${own} | ${gen} | ${t.staticControls} | ${own + gen + t.staticControls} |`);
}
lines.push("");
for (const t of inv) {
  lines.push(`## ${t.name} (\`${t.key}\`)`, "");
  for (const p of t.panels) {
    lines.push(`**${p.label}** — ${p.controls.map((c) => (c.source === "theme" ? `${c.label} *(propre au thème)*` : c.label)).join(" · ")}`, "");
  }
  const eff = [...cz.staticFor(t.key)];
  if (eff.length) lines.push(`**Réglages du moteur** — ${eff.map((id) => staticLabel.get(id) || id).join(" · ")}`, "");
}
const out = path.join(ROOT, "docs/themes/kolakisa-theme-customization-inventory.md");
fs.writeFileSync(out, lines.join("\n"));
console.log(`${inv.length} thèmes → ${path.relative(ROOT, out)}`);
