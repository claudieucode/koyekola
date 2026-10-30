// Responsive Layout Transformer (programme 22.3) : à partir de la composition ORDINATEUR, calcule les réglages TABLETTE et MOBILE (écrans natifs : desktop / tablet ≤1023 px / mobile ≤767 px).
// Ce n'est pas une simple réduction : les colonnes se réorganisent, les placements de grille se réinitialisent, les titres suivent une échelle, les espacements baissent d'un cran, la hauteur
// plein écran se compacte. Les réglages déjà posés par le constructeur (tablette/mobile) sont conservés.
const { STEPS } = require("./base");

const isTok = (v) => typeof v === "string" && v.startsWith("token:space-");
const stepDownTok = (v) => { const i = STEPS.indexOf(v.slice(12)); return `token:space-${STEPS[Math.max(0, i - 1)]}`; };
const tracks = (t) => String(t || "").trim().split(/\s+/).filter(Boolean);
const px = (v) => { const m = /^(\d+(?:\.\d+)?)px$/.exec(String(v || "")); return m ? Number(m[1]) : null; };
const cols = (n) => Array(n).fill("1fr").join(" ");

function fillGrid(n, d, bp, hint, changes) {
  const t = n.styles && n.styles[bp];
  const has = (k) => t && t[k] !== undefined;
  const set = {};
  const nCols = d.columns ? Number(d.columns) : tracks(d.gridTemplate).length;
  if (d.display === "grid" && !has("gridTemplate") && !has("columns")) {
    if (d.columns === 12) { /* grille de 12 colonnes à placements : les enfants gèrent leur placement, la grille reste à 12 */ }
    else if (hint && hint.mosaic) set.gridTemplate = bp === "tablet" ? "1fr 1fr" : "1fr 1fr";
    else if (hint && hint.asym) set.gridTemplate = bp === "tablet" ? "1fr 1fr" : "1fr";
    else if (hint && hint.cols && hint.cols >= 3) set.gridTemplate = bp === "tablet" ? cols(2) : hint.keep2 ? cols(2) : "1fr";
    else if (hint && hint.cols === 2) set.gridTemplate = bp === "tablet" ? cols(2) : "1fr";
    else if (nCols >= 3) set.gridTemplate = bp === "tablet" ? cols(2) : "1fr";
    else if (nCols === 2) set.gridTemplate = "1fr";                    // séparation texte / image : on empile dès la tablette (lecture d'abord)
    if (set.gridTemplate) changes.push(`${bp} : ${nCols} colonnes → ${tracks(set.gridTemplate).length}`);
  }
  if (bp === "mobile" && d.gap && isTok(d.gap) && !has("gap")) set.gap = stepDownTok(d.gap);
  if (d.gridAutoRows && px(d.gridAutoRows) && !has("gridAutoRows")) set.gridAutoRows = `${Math.round(px(d.gridAutoRows) * (bp === "tablet" ? 0.8 : 0.9))}px`;
  return set;
}
function transformNode(n, parentGrid12, changes) {
  const d = (n.styles && n.styles.desktop) || {};
  const hint = n._r || null;
  for (const bp of ["tablet", "mobile"]) {
    const cur = (n.styles && n.styles[bp]) || {};
    const add = {};
    if (d.display === "grid") Object.assign(add, fillGrid(n, d, bp, hint, changes));
    // Enfant d'une grille de 12 colonnes sans placement propre à cet écran : pleine largeur ; la carte superposée passe sous l'image (ligne 2)
    if (parentGrid12 && (d.gridColumnStart !== undefined || d.gridColumnEnd !== undefined) && cur.gridColumnStart === undefined) { add.gridColumnStart = 1; add.gridColumnEnd = 13; }
    if (hint && hint.layered && cur.gridRowStart === undefined) { add.gridRowStart = 2; add.gridRowEnd = 3; add.boxShadow = "none"; changes.push(`${bp} : carte de texte sous l'image`); }
    // Titres expressifs : échelle réduite (jamais sous 28 px)
    const fs = px(d.fontSize);
    if (fs && fs > 40 && cur.fontSize === undefined) { add.fontSize = `${Math.max(28, Math.round(fs * (bp === "tablet" ? 0.8 : 0.58)))}px`; changes.push(`${bp} : titre ${fs}px → ${add.fontSize}`); }
    // Rythme vertical : un cran de moins sur mobile
    if (bp === "mobile" && isTok(d.paddingTop) && cur.paddingTop === undefined) { add.paddingTop = stepDownTok(d.paddingTop); if (isTok(d.paddingBottom)) add.paddingBottom = stepDownTok(d.paddingBottom); }
    // Hero immersif : plus compact sur téléphone
    if (d.minHeight && /vh$/.test(d.minHeight) && cur.minHeight === undefined) { const v = parseInt(d.minHeight, 10); if (v > 60) { add.minHeight = bp === "tablet" ? "70vh" : "60vh"; changes.push(`${bp} : hauteur ${d.minHeight} → ${add.minHeight}`); } }
    // Décalages négatifs (superpositions) neutralisés hors ordinateur
    for (const k of ["marginLeft", "marginRight", "marginTop"]) if (typeof d[k] === "string" && d[k].startsWith("-") && cur[k] === undefined) add[k] = "0";
    // Colonnes de texte → une colonne
    if (d.columnCount && cur.columnCount === undefined) add.columnCount = 1;
    // Cartes de recouvrement : retrait des ombres lourdes inutile ; la carte passe sous l'image (ordre source conservé)
    if (Object.keys(add).length) { n.styles = n.styles || {}; n.styles[bp] = { ...add, ...cur }; }
  }
  const is12 = d.display === "grid" && Number(d.columns) === 12;
  for (const k of n.children || []) transformNode(k, is12, changes);
}
// Applique la transformation à un arbre (modifie en place) ; renvoie la liste des adaptations (pour le rapport)
function transform(nodes) { const changes = []; for (const n of nodes) transformNode(n, false, changes); return changes; }
// Retire les indices internes (_r) avant validation
function strip(nodes) { for (const n of nodes) { delete n._r; if (n.children) strip(n.children); } return nodes; }
module.exports = { transform, strip };
