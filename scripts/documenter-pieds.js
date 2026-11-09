// Génère docs/footer-builder/CATALOGUE_100_MODELES.md et docs/footer-builder/ALIAS_ANCIENS_MODELES.md à partir du code (aucune saisie à la main).
// Usage : node scripts/documenter-pieds.js
const fs = require("fs");
const path = require("path");
const Footer = require("../src/themeBuilder/catalog/footer");
const Emp = require("../src/themeBuilder/catalog/footer/empreinte");
const Aliases = require("../src/themeBuilder/catalog/footer-aliases");
const Ancien = require("../src/themeBuilder/catalog/footer/ancien");
const { kit } = require("../src/themeBuilder/catalog/kit");

const dir = path.join(__dirname, "../docs/footer-builder");
const nouveaux = Footer.layouts.filter((l) => !l.legacy);
const docOf = (l) => ({ type: "layout", children: l.build(kit(Footer.skins.find((s) => s.key === l.skin)), {}) });
const jet = nouveaux.map((l) => Emp.jetons(docOf(l)));
const walk = (list, fn) => { for (const n of list || []) { fn(n); walk(n.children, fn); } };
const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
const WIDGETS = new Set(["social", "newsletter", "emailsubscribe", "bizlegal", "bizhours", "bizcontact", "bizpayments", "shopcategories", "shoplinks", "contactform", "querylist", "menu", "backtotop", "map", "search", "language"]);

// matrice 100×100 : similarité maximale de chaque modèle et son plus proche voisin
const proche = nouveaux.map((l, i) => { let best = -1, who = -1; for (let j = 0; j < nouveaux.length; j++) if (j !== i) { const s = Emp.similarite(jet[i], jet[j]); if (s > best) { best = s; who = j; } } return { s: best, who }; });
const paires = []; for (let i = 0; i < nouveaux.length; i++) for (let j = i + 1; j < nouveaux.length; j++) paires.push(Emp.similarite(jet[i], jet[j]));
const moy = paires.reduce((a, b) => a + b, 0) / paires.length, max = Math.max(...paires);
const sup = (t) => paires.filter((p) => p > t).length;

let md = `# Catalogue des 100 modèles de pied de page\n\n**Généré par code** (\`node scripts/documenter-pieds.js\`) à partir de \`src/themeBuilder/catalog/footer/familles/*.js\`. Ne pas modifier à la main.\n\n`;
md += `- Modèles : ${nouveaux.length} en ${Footer.familles.length} familles (toutes construites).\n- Similarité de structure entre deux modèles (0 = rien en commun, 1 = identique ; seuil d'échec du test : 0,85) : **maximum ${max.toFixed(3)}**, moyenne ${moy.toFixed(3)}, paires > 0,70 : ${sup(0.7)}, > 0,75 : ${sup(0.75)}, > 0,80 : ${sup(0.8)}, > 0,85 : ${sup(0.85)} (sur ${paires.length} paires).\n- « Rangées » = bandes empilées ; « Colonnes » = zones de chaque rangée (ex. 4/2). « Accordéon » = rubriques qui se déplient sur mobile. « Voisin » = modèle le plus proche et sa similarité.\n\n`;
for (const f of Footer.familles) {
  md += `## ${f.label} (${nouveaux.filter((l) => l.family === f.key).length}/${f.target})\n\n${f.description}\n\n| Identifiant | Nom | Description | Rangées | Colonnes | Widgets | Accordéon mobile | Ambiance | Voisin le plus proche |\n|---|---|---|---|---|---|---|---|---|\n`;
  nouveaux.forEach((l, i) => {
    if (l.family !== f.key) return;
    const doc = docOf(l), rows = ((doc.children[0] && doc.children[0].children) || []);
    const cols = rows.map((b) => { const inner = (b.children || [])[0] || {}; return (inner.children || []).length; });
    const types = new Set(); let acc = false;
    walk(doc.children, (n) => { if (WIDGETS.has(n.type)) types.add(n.type); if (n.props && n.props.mode === "accordion" && n.props.accMobile) acc = true; });
    const amb = Footer.skins.find((s) => s.key === l.skin);
    md += `| \`${l.fullKey}\` | ${esc(l.label)} | ${esc(l.desc)} | ${rows.length} | ${cols.join("/")} | ${[...types].sort().join(", ") || "-"} | ${acc ? "oui" : "non"} | ${esc((amb && (amb.label || amb.name)) || l.skin)} | ${proche[i].s.toFixed(2)} (\`${nouveaux[proche[i].who].fullKey.replace(/^ft-/, "")}\`) |\n`;
  });
  md += "\n";
}
fs.writeFileSync(path.join(dir, "CATALOGUE_100_MODELES.md"), md);

// Table d'alias : ancien → nouveau, avec la raison lue dans les commentaires de footer-aliases.js
const src = fs.readFileSync(path.join(__dirname, "../src/themeBuilder/catalog/footer-aliases.js"), "utf8");
const raison = {}; let groupe = ""; const parGroupe = {};
for (const ligne of src.split("\n")) {
  const g = ligne.match(/^  \/\/ (.+)$/); if (g) { groupe = g[1]; continue; }
  const m = ligne.match(/^  "([^"]+)": "([^"]+)",(?: \/\/ (.+))?$/); if (m) { raison[m[1]] = m[3] || ""; (parGroupe[groupe] = parGroupe[groupe] || []).push(m[1]); }
}
const nomAncien = Object.fromEntries(Ancien.layouts.map((l) => [`${l.key}.${l.keySkin || l.skin}`, l.label || l.name || ""]));
const parId = Object.fromEntries(nouveaux.map((l) => [l.fullKey, l]));
let a = `# Alias : anciens modèles de pied de page vers les nouveaux\n\n**Généré par code** (\`node scripts/documenter-pieds.js\`) à partir de \`src/themeBuilder/catalog/footer-aliases.js\`.\n\n`;
const cibles = new Set(Object.values(Aliases.ALIAS));
a += `Les 100 anciens identifiants restent ouvrables (aperçu, vignette, « Utiliser », « Revenir au modèle d'origine ») mais ne sont plus jamais listés. Chacun mène au nouveau modèle le plus proche par usage et par structure. Plusieurs anciens peuvent mener au même nouveau (${cibles.size} nouveaux modèles servent de remplaçants).\n\nLes pieds déjà installés sur des sites ne changent pas : ce sont des copies indépendantes. Seul « Revenir au modèle d'origine » donne le nouveau modèle (une révision de sécurité est enregistrée avant).\n\n`;
for (const [g, ids] of Object.entries(parGroupe)) {
  a += `## ${g}\n\n| Ancien identifiant | Ancien nom | Nouveau modèle | Famille | Raison |\n|---|---|---|---|---|\n`;
  for (const id of ids) { const n = parId[Aliases.ALIAS[id]]; a += `| \`${id}\` | ${esc(nomAncien[id])} | \`${Aliases.ALIAS[id]}\` (${esc(n.label)}) | ${n.family} | ${esc(raison[id])} |\n`; }
  a += "\n";
}
fs.writeFileSync(path.join(dir, "ALIAS_ANCIENS_MODELES.md"), a);
console.log("ok", nouveaux.length, Object.keys(raison).length, cibles.size, max.toFixed(3), moy.toFixed(3));
