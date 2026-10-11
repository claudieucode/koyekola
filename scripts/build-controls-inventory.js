// Génère docs/KOLAKISA_PROPERTY_CONTROLS_INVENTORY.md : une ligne par propriété de style (STYLE_PROPS), calculée à partir du code
// (valeurs acceptées, bornes, unités) et des résultats réels de la matrice navigateur (docs/property-controls/matrice-resultats.json,
// produit par `MATRICE_SORTIE=… node --test tests/controles-matrice-navigateur.test.js`). Aucune case n'est remplie à la main :
// ce que la matrice n'a pas piloté est écrit « non piloté par la matrice ».
// Usage : node scripts/build-controls-inventory.js
const fs = require("fs");
const path = require("path");
const nodes = require("../src/marketing/pages/nodes");

const root = path.join(__dirname, "..");
const spec = nodes.editorSpec();
const source = fs.readFileSync(path.join(root, "public", "js", "page-builder.js"), "utf8");
const table = (name) => {
  const at = source.indexOf(`var ${name} = {`);
  let depth = 0, i = source.indexOf("{", at);
  const start = i;
  for (; i < source.length; i++) { if (source[i] === "{") depth++; else if (source[i] === "}" && --depth === 0) break; }
  return (0, eval)(`(${source.slice(start, i + 1)})`);
};
const NUM = table("NUM"), UNITS = table("UNITS");
for (const s of ["Top", "Right", "Bottom", "Left"]) { UNITS[`margin${s}`] = ["px", "%", "rem", "em", "auto"]; UNITS[`padding${s}`] = ["px", "%", "rem", "em"]; }

let matrix = { inventory: {}, problems: [] };
const matrixFile = path.join(root, "docs", "property-controls", "matrice-resultats.json");
if (fs.existsSync(matrixFile)) matrix = JSON.parse(fs.readFileSync(matrixFile, "utf8"));

// Contrôles spécialisés (hors ligne générique de l'inspecteur) : atteints par un composant dédié, éprouvés par leurs propres tests
const SPECIAL = {
  marginTop: "cellules Espacement (4 côtés liés ou non, unité commune)", marginRight: "cellules Espacement", marginBottom: "cellules Espacement", marginLeft: "cellules Espacement",
  paddingTop: "cellules Espacement", paddingRight: "cellules Espacement", paddingBottom: "cellules Espacement", paddingLeft: "cellules Espacement",
  fontFamily: "sélecteur de la bibliothèque de polices (Font Manager)",
  borderTopWidth: "bordure déliée (4 côtés)", borderRightWidth: "bordure déliée", borderBottomWidth: "bordure déliée", borderLeftWidth: "bordure déliée",
  borderTopLeftRadius: "arrondi délié (4 coins)", borderTopRightRadius: "arrondi délié", borderBottomRightRadius: "arrondi délié", borderBottomLeftRadius: "arrondi délié",
  order: "ordre : premier / dernier / personnalisé", flexGrow: "bascule Grandir / Rétrécir (flex) ou proportion de colonne", flexShrink: "bascule Grandir / Rétrécir", flexBasis: "bascule Grandir / Rétrécir",
  columns: "colonnes de la grille (boutons + / − et champ)", gridRows: "lignes de la grille", gridTemplate: "largeurs des colonnes (texte)", gridRowsTemplate: "hauteurs des lignes (texte)", gridAutoRows: "pistes automatiques (texte)", gridAutoColumns: "pistes automatiques (texte)", gridAutoFlow: "remplissage de la grille", justifyItems: "alignement des cases",
  lineClamp: "Typographie des textes",
};

const accepted = (key, p) => {
  const srv = nodes.STYLE_PROPS[key];
  if (p.kind === "enum") return p.options.map(([v]) => `\`${v}\``).join(" ");
  if (p.kind === "color") return "`#rgb`, `#rrggbb`, `#rrggbbaa`, `transparent`, `token:<couleur du site>`";
  if (p.kind === "number") {
    const [min, max] = NUM[key] || [];
    return `nombre ${min} … ${max}${srv.check("1.5") === null && max - min > 1 ? ", entier" : ""}`;
  }
  if (p.kind === "text") return "pistes de grille (`fr`, `px`, `%`, `auto`; 12 au plus)";
  const flags = [];
  if (srv.check("-1px") !== null) flags.push("négatif");
  if (srv.check("auto") !== null) flags.push("`auto`");
  if (srv.check("fit-content") !== null) flags.push("`fit-content` `min-content` `max-content`");
  if (srv.check("token:space-md") !== null) flags.push("valeur du site (`token:`)");
  if (srv.check("5%") === null) flags.push("pas de %");
  return `longueur ${(UNITS[key] || ["px", "%", "rem", "em"]).filter((u) => !["auto", "fit-content", "min-content", "max-content"].includes(u)).join(" ")}${flags.length ? " ; " + flags.join(", ") : ""}`;
};
// Fichiers de tests (hors chantier courant) qui citent la propriété : trace réelle des tests préexistants des contrôles spécialisés
const testFiles = fs.readdirSync(path.join(root, "tests")).filter((f) => f.endsWith(".test.js") && !/^controles-(matrice|contrat|coherence|contenu)/.test(f));
const mentions = {};
for (const f of testFiles) { const text = fs.readFileSync(path.join(root, "tests", f), "utf8"); for (const k of Object.keys(nodes.STYLE_PROPS)) if (new RegExp(`\\b${k}\\b`).test(text)) (mentions[k] = mentions[k] || []).push(f.replace(/\.test\.js$/, "")); }
const test = (key) => {
  const m = matrix.inventory[key];
  const out = [];
  if (m) out.push(`matrice navigateur : ${Object.entries(m).map(([el, kind]) => `${el} (${kind})`).join(", ")}`);
  else out.push("**non piloté par la matrice**");
  out.push("contrat serveur");
  const other = (mentions[key] || []).slice(0, 3);
  if (!m) out.push(other.length ? `tests préexistants : ${other.join(", ")}` : "**aucun test préexistant trouvé : non validé**");
  return out.join(" ; ");
};

const lines = [];
lines.push("# Inventaire des contrôles de style de KOLAKISA", "");
lines.push("> Généré par `node scripts/build-controls-inventory.js` à partir du code (`STYLE_PROPS`, `STYLE_UI`, tables de l'inspecteur) et des résultats de la matrice navigateur. Ne pas modifier à la main.", "");
const total = spec.styleProps.length, piloted = spec.styleProps.filter((p) => matrix.inventory[p.key]).length;
lines.push(`**${total} propriétés de style** — ${piloted} pilotées une par une depuis l'inspecteur réel par la matrice (liste, icônes, nombre, couleur) ; ${total - piloted} atteintes par un contrôle spécialisé (voir colonne « Contrôle ») dont les tests sont ceux d'avant ce chantier (colonne « Éprouvé par » : fichiers qui citent la propriété).`, "");
const groups = Object.entries(spec.groups);
for (const [g, label] of groups) {
  const rows = spec.styleProps.filter((p) => p.group === g);
  if (!rows.length) continue;
  lines.push(`## ${label} (${rows.length})`, "", "| Propriété | Libellé | CSS | Contrôle | Valeurs acceptées | Écrans / états | Éprouvé par |", "|---|---|---|---|---|---|---|");
  for (const p of rows) {
    const m = matrix.inventory[p.key];
    const kinds = m ? [...new Set(Object.values(m))].join(", ") : "";
    const control = SPECIAL[p.key] || kinds || "—";
    lines.push(`| \`${p.key}\` | ${p.label} | \`${p.css}\` | ${control} | ${accepted(p.key, p)} | écrans + survol / focus / clic | ${test(p.key)} |`);
  }
  lines.push("");
}
lines.push("## Propriétés composées", "", "| Propriété | Contenu | Contrôle |", "|---|---|---|");
for (const [k, v] of Object.entries({
  backgroundImage: ["`{ src, size }` image de la médiathèque ou https", "type de fond « Image » + résolution"],
  gradient: ["`{ from, to, angle, type, fromAt, toAt, extra[≤3] }`", "type de fond « Dégradé »"],
  overlay: ["`{ color }` voile", "type de fond"],
  shadow: ["`{ x, y, blur, spread, color, inset }`", "Effets › Ombre personnalisée (4 champs numériques + couleur)"],
  filter: ["flou, luminosité, contraste, noir et blanc, saturation, sépia, teinte", "Effets › Filtres (curseur + nombre)"],
  backdrop: ["mêmes filtres sur l'arrière-plan", "Effets › Verre dépoli"],
  transform: ["`{ x, y, rotate, scale, skewX, skewY }`", "Avancé › Transformer"],
  mask: ["`{ shape, src, size, position, repeat }`", "Effets › Masque"],
})) lines.push(`| \`${k}\` | ${v[0]} | ${v[1]} |`);
lines.push("");
if (matrix.problems && matrix.problems.length) lines.push("## Anomalies relevées par la matrice", "", ...matrix.problems.map((x) => `- ${x}`), "");
fs.writeFileSync(path.join(root, "docs", "KOLAKISA_PROPERTY_CONTROLS_INVENTORY.md"), lines.join("\n"));
console.log(`inventaire écrit : ${total} propriétés, ${piloted} pilotées par la matrice`);
