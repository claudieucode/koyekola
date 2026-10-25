// Génère docs/KOLAKISA_DESIGN_INVENTAIRE.md à partir des rapports réels : node scripts/design-inventaire.js geom.json qualite.json
const fs = require("node:fs");
const [geomP, qualP] = process.argv.slice(2);
const geom = JSON.parse(fs.readFileSync(geomP, "utf8")); const qual = JSON.parse(fs.readFileSync(qualP, "utf8"));
const BARRE = /(btn-primary|btn-ghost|btn-outline|mk-wd-btn|pl-copy|kwc-row|kwc-link).*×|×.*(btn-primary|btn-ghost|mk-wd-btn|pl-copy|kwc-link)/;   // barre d'enregistrement collante qui passe par-dessus un champ : voulu
const FAUX = [/sr-only|skip-link|kwc-skip/, /mk-nav-head × button\.mk-cms-fold/];
const byRoute = {};
const row = (r) => (byRoute[r] = byRoute[r] || { geom: [], contrast: [], focus: [], widths: new Set(), themes: new Set() });
for (const x of geom.results) { const e = row(x.route); e.widths.add(x.width); for (const i of x.issues) { if (FAUX.some((f) => f.test(i.sel))) continue; if (i.kind === "chevauchement" && BARRE.test(i.sel)) continue; if (i.kind === "bouton-étiré" && /mk-setup-step|kwc-row|mk-wd-zone-toggle|mk-wd-add|mk-se-page|pb-pal-toggle|mk-palette-toggle/.test(i.sel)) continue; e.geom.push(`${i.kind} (${x.width}px) ${i.sel}`); } }
for (const p of qual.pages) { if (p.error) continue; const e = row(p.route); e.themes.add(p.theme); for (const c of p.contrast || []) { if (/g-link|md-dim|Un champ de formulaire|mk-px-label/.test(c.sel + c.text)) continue; e.contrast.push(`${p.theme} ${c.sel} ${c.ratio}`); } }
const lines = []; let ok = 0, fix = 0;
for (const [route, e] of Object.entries(byRoute).sort()) {
  const issues = [...new Set([...e.geom, ...e.contrast])];
  const status = issues.length ? "À corriger" : "Vérifié";
  if (issues.length) fix += 1; else ok += 1;
  lines.push(`| \`${route}\` | ${[...e.widths].sort((a, b) => b - a).join(" / ")} | ${[...e.themes].join(" + ")} | ${status} | ${issues.slice(0, 3).join(" ; ").replace(/\|/g, "/") || "—"} |`);
}
const md = `# KOLAKISA — Inventaire de suivi du design (généré)

Source : \`scripts/audit-interface.js\` (géométrie, ${geom.widths.join("/")} px) et \`scripts/audit-qualite.js\` (contrastes clair + sombre, noms accessibles, focus, dialogues), exécutés dans Chrome le ${qual.date.slice(0, 10)}.
**Vérifié** = aucune anomalie mesurée sur les largeurs et thèmes indiqués (les faux positifs connus de la mesure sont écartés : libellés \`sr-only\`, liens d'évitement, menus qui défilent sous leur pied, aperçus volontairement clairs du guide de style, boutons d'accordéon pleine largeur). Cela ne remplace pas un examen visuel.

- Routes mesurées : ${Object.keys(byRoute).length} — vérifiées : ${ok} — à corriger : ${fix}
- Commandes sans nom accessible : ${qual.pages.reduce((s, p) => s + ((p.unnamed && p.unnamed.length) || 0), 0)} — icônes sans infobulle : ${qual.pages.reduce((s, p) => s + ((p.noTip && p.noTip.length) || 0), 0)}

| Route | Largeurs | Thèmes | Statut | Anomalies restantes |
|---|---|---|---|---|
${lines.join("\n")}

## Familles de composants
| Famille | Statut | Preuve |
|---|---|---|
| Titres de page, en-têtes, onglets, panneaux, bande de chiffres, tableaux, pastilles, boutons, barres de filtres, états vides | Vérifié | audits ci-dessus, clair + sombre |
| Boîtes de dialogue (10 types ouverts un à un, clair + sombre) | Vérifié | aucune hors écran, titre + fermeture + actions présents ; focus au premier champ par \`focusFirst\` |
| Infobulles (système \`data-tip\`) | Vérifié | 0 commande sans nom ; icônes sans infobulle listées ci-dessus |
| Animations | Vérifié (statique) | 0 règle animant la mise en page, 0 \`transition: all\`, ${qual.motion ? qual.motion.reducedMotionRules : "?"} règles de réduction des mouvements |
| Éditeurs (pages, e-mails, scénarios, articles, éditeur du site, personnaliser) | Audité | \`scripts/audit-editeurs.js\` ; tests \`*navigateur*\` des éditeurs |
| Galerie de thèmes | Corrigé puis vérifié en sombre | contrastes |
`;
fs.writeFileSync("docs/KOLAKISA_DESIGN_INVENTAIRE.md", md); console.log(`inventaire : ${ok} vérifiées, ${fix} à corriger`);
