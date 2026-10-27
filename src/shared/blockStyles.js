// Réglages de style communs des blocs (équivalent des « block supports » de Gutenberg : typographie, couleur, espacement, bordure, ombre, dimensions,
// position, alignement). UNE description, utilisée par :
//   - l'éditeur (src/editor/blog/supports.js : attributs des nœuds ; blog-editor.js : panneau de réglages) ;
//   - le serveur (src/utils/blogHtml.js : valeurs acceptées à l'enregistrement, couleurs libres déposées en variables CSS à l'affichage).
// Principe de sécurité : AUCUN style libre. Chaque réglage est un attribut data-* à valeurs fermées (liste) ou à couleur #rrggbb validée ;
// la mise en forme vient de règles CSS fixes (public/css/style.css). Une valeur hors liste est retirée à l'enregistrement.
// CommonJS : utilisable par le serveur et par esbuild.
const HEX = /^#[0-9a-f]{6}$/i;
const SIZES = [["", "Par défaut"], ["none", "Aucun"], ["xs", "Très petit"], ["s", "Petit"], ["m", "Moyen"], ["l", "Grand"], ["xl", "Très grand"]];

// group : section du panneau ; scope : "text" (blocs de texte) ou "all" (tous les blocs de premier niveau et imbriqués)
const STYLE_PROPS = [
  // --- Typographie ---
  { key: "ff", attr: "data-ff", label: "Police", group: "Typographie", scope: "text", values: [["", "Par défaut"], ["sans", "Figtree (texte)"], ["display", "Bricolage Grotesque (titres)"], ["serif", "Georgia (à empattements)"], ["mono", "Chasse fixe"]] },
  { key: "fz", attr: "data-fz", label: "Taille du texte", group: "Typographie", scope: "text", values: [["", "Par défaut"], ["s", "Petite"], ["l", "Grande"], ["xl", "Très grande"], ["xxl", "Énorme"], ["display", "Affiche"]] },
  { key: "fw", attr: "data-fw", label: "Graisse", group: "Typographie", scope: "text", values: [["", "Par défaut"], ["light", "Fine"], ["medium", "Moyenne"], ["semibold", "Demi-grasse"], ["bold", "Grasse"], ["black", "Très grasse"]] },
  { key: "fst", attr: "data-fst", label: "Style", group: "Typographie", scope: "text", values: [["", "Normal"], ["italic", "Italique"]] },
  { key: "lh", attr: "data-lh", label: "Interligne", group: "Typographie", scope: "text", values: [["", "Par défaut"], ["tight", "Serré (1,2)"], ["snug", "Compact (1,4)"], ["normal", "Normal (1,6)"], ["loose", "Aéré (1,8)"], ["airy", "Très aéré (2)"]] },
  { key: "ls", attr: "data-ls", label: "Espacement des lettres", group: "Typographie", scope: "text", values: [["", "Par défaut"], ["tighter", "Très serré"], ["tight", "Serré"], ["wide", "Large"], ["wider", "Très large"], ["widest", "Maximal"]] },
  { key: "tt", attr: "data-tt", label: "Casse", group: "Typographie", scope: "text", values: [["", "Par défaut"], ["uppercase", "MAJUSCULES"], ["lowercase", "minuscules"], ["capitalize", "Première Lettre"]] },
  { key: "td", attr: "data-td", label: "Décoration", group: "Typographie", scope: "text", values: [["", "Aucune"], ["underline", "Soulignée"], ["line-through", "Barrée"]] },
  { key: "tcols", attr: "data-tcols", label: "Colonnes de texte", group: "Typographie", scope: "text", values: [["", "Une colonne"], ["2", "2 colonnes"], ["3", "3 colonnes"]] },
  { key: "ti", attr: "data-ti", label: "Retrait de première ligne", group: "Typographie", scope: "text", values: [["", "Aucun"], ["1", "1 em"], ["2", "2 em"]] },
  { key: "wm", attr: "data-wm", label: "Sens d'écriture", group: "Typographie", scope: "text", values: [["", "Horizontal"], ["vertical", "Vertical"]] },
  // --- Couleur ---
  { key: "color", attr: "data-color", label: "Couleur du texte", group: "Couleur", scope: "all", color: true },
  { key: "bgc", attr: "data-bgc", label: "Couleur de fond", group: "Couleur", scope: "all", color: true },
  { key: "linkc", attr: "data-linkc", label: "Couleur des liens", group: "Couleur", scope: "all", color: true },
  { key: "gradient", attr: "data-gradient", label: "Dégradé de fond", group: "Couleur", scope: "all", values: [["", "Aucun"], ["navy", "Bleu nuit"], ["ocean", "Océan"], ["dusk", "Crépuscule"], ["sand", "Sable"], ["mist", "Brume"], ["sunrise", "Aurore"]] },
  // --- Dimensions ---
  { key: "minh", attr: "data-minh", label: "Hauteur minimale", group: "Dimensions", scope: "all", values: [["", "Aucune"], ["s", "120 px"], ["m", "240 px"], ["l", "400 px"], ["xl", "600 px"], ["screen", "Hauteur de l'écran"]] },
  { key: "maxw", attr: "data-maxw", label: "Largeur maximale", group: "Dimensions", scope: "all", values: [["", "Aucune"], ["narrow", "Étroite (420 px)"], ["medium", "Moyenne (640 px)"], ["wide", "Large (960 px)"]] },
  { key: "w", attr: "data-w", label: "Largeur du bloc", group: "Dimensions", scope: "all", values: [["", "Pleine"], ["25", "25 %"], ["33", "33 %"], ["50", "50 %"], ["66", "66 %"], ["75", "75 %"]] },
  { key: "aspect", attr: "data-aspect", label: "Proportions", group: "Dimensions", scope: "all", values: [["", "Libres"], ["1-1", "Carré (1:1)"], ["4-3", "4:3"], ["3-2", "3:2"], ["16-9", "16:9"], ["21-9", "21:9"], ["3-4", "Portrait 3:4"], ["9-16", "Portrait 9:16"]] },
  { key: "balign", attr: "data-balign", label: "Alignement du bloc", group: "Dimensions", scope: "all", values: [["", "Par défaut"], ["left", "À gauche (texte autour)"], ["center", "Centré"], ["right", "À droite (texte autour)"], ["wide", "Large"], ["full", "Pleine largeur"]] },
  { key: "sticky", attr: "data-sticky", label: "Position", group: "Dimensions", scope: "all", values: [["", "Normale"], ["top", "Fixé en haut au défilement"]] },
  // --- Espacement ---
  { key: "mt", attr: "data-mt", label: "Marge haute", group: "Espacement", scope: "all", values: SIZES },
  { key: "mb", attr: "data-mb", label: "Marge basse", group: "Espacement", scope: "all", values: SIZES },
  { key: "pt", attr: "data-pt", label: "Marge intérieure haute", group: "Espacement", scope: "all", values: SIZES },
  { key: "pb", attr: "data-pb", label: "Marge intérieure basse", group: "Espacement", scope: "all", values: SIZES },
  { key: "pl", attr: "data-pl", label: "Marge intérieure gauche", group: "Espacement", scope: "all", values: SIZES },
  { key: "pr", attr: "data-pr", label: "Marge intérieure droite", group: "Espacement", scope: "all", values: SIZES },
  { key: "bgap", attr: "data-bgap", label: "Espace entre les blocs internes", group: "Espacement", scope: "container", values: [["", "Par défaut"], ["none", "Aucun"], ["xs", "Très petit"], ["s", "Petit"], ["m", "Moyen"], ["l", "Grand"], ["xl", "Très grand"]] },
  // --- Bordure et ombre ---
  { key: "bdw", attr: "data-bdw", label: "Épaisseur de la bordure", group: "Bordure et ombre", scope: "all", values: [["", "Aucune"], ["1", "1 px"], ["2", "2 px"], ["4", "4 px"], ["8", "8 px"]] },
  { key: "bds", attr: "data-bds", label: "Trait", group: "Bordure et ombre", scope: "all", values: [["", "Plein"], ["dashed", "Tirets"], ["dotted", "Points"], ["double", "Double"]] },
  { key: "bdside", attr: "data-bdside", label: "Côtés de la bordure", group: "Bordure et ombre", scope: "all", values: [["", "Tous"], ["top", "Haut"], ["bottom", "Bas"], ["left", "Gauche"], ["right", "Droite"], ["top-bottom", "Haut et bas"], ["left-right", "Gauche et droite"]] },
  { key: "bdc", attr: "data-bdc", label: "Couleur de la bordure", group: "Bordure et ombre", scope: "all", color: true },
  { key: "bdr", attr: "data-bdr", label: "Coins arrondis", group: "Bordure et ombre", scope: "all", values: [["", "Par défaut"], ["none", "Droits"], ["s", "Petits"], ["m", "Moyens"], ["l", "Grands"], ["pill", "Pilule"], ["circle", "Cercle"]] },
  { key: "shadow", attr: "data-shadow", label: "Ombre", group: "Bordure et ombre", scope: "all", values: [["", "Aucune"], ["natural", "Naturelle"], ["deep", "Profonde"], ["sharp", "Nette"], ["outlined", "Cernée"], ["crisp", "Décalée"]] },
];

const BY_KEY = new Map(STYLE_PROPS.map((p) => [p.key, p]));
const GROUPS = [...new Set(STYLE_PROPS.map((p) => p.group))];
const isValid = (p, v) => (p.color ? HEX.test(v) : Boolean(v) && p.values.some(([x]) => x === v));

// Valeur acceptée (sinon ""), normalisée : couleurs en minuscules
function cleanValue(key, raw) {
  const p = BY_KEY.get(key);
  if (!p) return "";
  const v = String(raw == null ? "" : raw).trim();
  if (!isValid(p, v)) return "";
  return p.color ? v.toLowerCase() : v;
}

// Attributs data-* à poser sur le HTML enregistré, depuis les attributs d'un nœud de l'éditeur
function styleDataOf(attrs) {
  const out = {};
  for (const p of STYLE_PROPS) {
    const v = attrs && attrs[p.key] ? cleanValue(p.key, attrs[p.key]) : "";
    if (v) out[p.attr] = v;
  }
  return out;
}

// Variables CSS pour les couleurs libres (déposées à l'affichage et dans l'éditeur)
const COLOR_VARS = { color: "--kb-color", bgc: "--kb-bgc", linkc: "--kb-linkc", bdc: "--kb-bdc" };
function colorStyle(attrs) {
  const parts = [];
  for (const [key, cssVar] of Object.entries(COLOR_VARS)) {
    const v = attrs && attrs[key] ? cleanValue(key, attrs[key]) : "";
    if (v) parts.push(`${cssVar}: ${v}`);
  }
  return parts.join("; ");
}
const colorStyleFromData = (attribs) => {
  const parts = [];
  for (const [key, cssVar] of Object.entries(COLOR_VARS)) {
    const p = BY_KEY.get(key);
    const v = attribs && attribs[p.attr] ? cleanValue(key, attribs[p.attr]) : "";
    if (v) parts.push(`${cssVar}: ${v}`);
  }
  return parts.join("; ");
};

module.exports = { STYLE_PROPS, BY_KEY, GROUPS, HEX, cleanValue, styleDataOf, colorStyle, colorStyleFromData, COLOR_VARS };
