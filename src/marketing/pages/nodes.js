// Éléments imbriqués du Page Builder (« Section libre ») : un ARBRE d'éléments typés, chacun avec un identifiant unique,
// des propriétés (contenu), des styles par écran (ordinateur / tablette / mobile, hérités de l'écran plus grand) et par
// état (survol, focus, clic). Grammaire FERMÉE, comme les sections : chaque type est déclaré dans le registre NODE_TYPES
// (libellé, catégorie, conteneur ou non, normalisation) ; chaque propriété de style est déclarée dans STYLE_PROPS avec
// son validateur. Aucune valeur libre n'atteint la page : le CSS est généré à partir de valeurs validées, sous une classe
// propre à l'élément (.kw-n-<id>). Pas de HTML, CSS ni JavaScript libres (les pages sont servies sur le même domaine que
// les comptes des élèves : un script pourrait voler leurs sessions).
const elementorNames = require("./elementorNames");
const sanitizeHtml = require("sanitize-html");
const crypto = require("crypto");
const { getCourse } = require("../bridge/catalog");
const { parseVideoUrl } = require("../../utils/video");
const dynamic = require("./dynamic");

// Fichiers vidéo et audio de la médiathèque du CMS : adresse locale permanente (/uploads/marketing/<organisation>/<fichier>)
const LOCAL_VIDEO = /^\/uploads\/marketing\/\d+\/(?:site-\d{1,9}\/)?(?:\d{4}\/(?:0[1-9]|1[0-2])\/)?[A-Za-z0-9._-]+\.(mp4|webm)$/i;
const LOCAL_AUDIO = /^\/uploads\/marketing\/\d+\/(?:site-\d{1,9}\/)?(?:\d{4}\/(?:0[1-9]|1[0-2])\/)?[A-Za-z0-9._-]+\.(mp3|m4a|ogg|wav)$/i;
const MAX_NODES = 400;   // éléments d'une page (toutes sections libres confondues)
const MAX_DEPTH = 8;
const NODE_ID = /^[a-z0-9]{6,20}$/;
const ANCHOR = /^[a-z][a-z0-9-]{0,39}$/;
const RESERVED_ANCHORS = new Set(["main", "contenu", "top", "haut", "kw-consent"]);
// Écrans : la liste peut s'allonger (ordinateur portable, écran personnalisé) sans changer le modèle
const BREAKPOINTS = [
  { key: "desktop", label: "Ordinateur", media: null },
  // Grand écran (comme les écrans supplémentaires d'Elementor) : réglages propres au-delà d'une largeur réglable (1920 px par défaut) ; hérite de l'ordinateur, jamais de la tablette
  { key: "wide", label: "Grand écran", media: "(min-width: 1920px)" },
  { key: "tablet", label: "Tablette", media: "(max-width: 1023px)" },
  { key: "mobile", label: "Mobile", media: "(max-width: 767px)" },
];
// « scrolled » (Header Builder) : style d'un élément de l'EN-TÊTE quand la page a défilé au-delà du seuil ; la règle porte sur l'ancêtre (`pre`), pas sur l'élément lui-même.
const STATES = [{ key: "hover", label: "Survol", sel: ":hover" }, { key: "focus", label: "Focus", sel: ":focus-visible" }, { key: "active", label: "Clic", sel: ":active" }, { key: "scrolled", label: "Après défilement", sel: "", pre: ".lp-site-header.is-scrolled" }, { key: "menuOpen", label: "Menu ouvert", sel: "", pre: ".lp-site-header.is-menu-open" }];
const stateRule = (state, sel, d) => (state.pre ? `${state.pre} ${sel}{${d}}` : `${sel}${state.sel}{${d}}`);

const newNodeId = () => crypto.randomBytes(6).toString("hex");
const clean = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, max) : "");
const line = (v, max) => clean(v, max).replace(/\s+/g, " ");

// ---------- Valeurs de style (validées une à une) ----------
const FLUID = require("../../responsive/fluid");
const LEN = /^(-?\d{1,4}(?:\.\d{1,3})?)(px|%|rem|em|vh|vw)$/;
const INTRINSIC = new Set(["fit-content", "min-content", "max-content"]); // dimensions intrinsèques : liste fermée, jamais de CSS libre
const lengthOf = ({ auto = false, negative = false, intrinsic = false } = {}) => (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "0") return "0";
  if (auto && s === "auto") return "auto";
  if (intrinsic && INTRINSIC.has(s)) return s;
  const m = s.match(LEN);
  if (!m) return null;
  if (!negative && Number(m[1]) < 0) return null;
  return `${Number(m[1])}${m[2]}`;
};
// Valeurs GLOBALES du site référençables par un élément (comme les couleurs) : espacements, rayons, tailles de texte. L'élément enregistre « token:space-md » ;
// le rendu écrit var(--kw-space-md, <valeur par défaut>) : changer le jeton dans les réglages du site met à jour tous les éléments qui le référencent, une valeur propre
// reste intacte. Le repli sert aux pages hors site (jetons non posés).
// (construit à la première utilisation : tokens.js et nodes.js se référencent mutuellement au chargement)
let LEN_TOKENS_CACHE = null;
const lenTokens = () => {
  if (LEN_TOKENS_CACHE) return LEN_TOKENS_CACHE;
  const siteTokens = require("./tokens");
  LEN_TOKENS_CACHE = {
    space: Object.fromEntries(siteTokens.SPACE_KEYS.map((k) => [`space-${k}`, `${siteTokens.DEFAULT_TOKENS.space[k]}px`])),
    radius: Object.fromEntries(Object.keys(siteTokens.DEFAULT_TOKENS.radius).map((k) => [`radius-${k}`, `${siteTokens.DEFAULT_TOKENS.radius[k]}px`])),
    type: Object.fromEntries(siteTokens.TYPE_KEYS.map((k) => [`${k}-size`, `${siteTokens.DEFAULT_TOKENS.type[k].size}px`])),
  };
  return LEN_TOKENS_CACHE;
};
const lenTokenValue = (name) => { const t = lenTokens(); return t.space[name] || t.radius[name] || t.type[name] || null; };
// check : accepte « token:<famille> » en plus de la longueur ; out : le convertit en var() avec repli
const withLenToken = (family, check) => (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (s.startsWith("token:")) return Object.hasOwn(lenTokens()[family], s.slice(6)) ? s : null;
  return check(v);
};
const lenTokenOut = (v) => (String(v).startsWith("token:") ? `var(--kw-${v.slice(6)}, ${lenTokenValue(v.slice(6))})` : v);
const COLOR_TOKENS = ["primary", "secondary", "accent", "background", "surface", "text", "muted", "success", "warning", "error", "on-primary", "on-accent"];
const color = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(s)) return s;
  if (s === "transparent") return s;
  if (s.startsWith("token:") && (COLOR_TOKENS.includes(s.slice(6)) || /^c-[a-z0-9]{1,20}$/.test(s.slice(6)))) return s;
  return null;
};
// Couleur du site → var(--kw-<clé>, <valeur d'origine>) : le repli sert aux pages HORS site (aucune variable posée, sinon la couleur serait ignorée
// en silence) ; comme pour les longueurs du site. Une couleur personnalisée (c-…) n'existe que dans un site : pas de repli possible.
const colorFallback = (key) => {
  const t = require("./tokens");
  if (Object.hasOwn(t.DEFAULT_TOKENS.colors, key)) return t.DEFAULT_TOKENS.colors[key];
  if (key === "on-primary") return t.onColor(t.DEFAULT_TOKENS.colors.primary);
  if (key === "on-accent") return t.onColor(t.DEFAULT_TOKENS.colors.accent);
  return null;
};
const colorCss = (v) => { if (!v.startsWith("token:")) return v; const key = v.slice(6), f = colorFallback(key); return f ? `var(--kw-${key}, ${f})` : `var(--kw-${key})`; };
const fontLib = require("../../utils/fontLibrary");
const oneOf = (...list) => (v) => (list.includes(v) ? v : null);
// Résolution d'image (service commun : media/variants.js). « full » (l'original) est la valeur par défaut et n'est pas enregistrée.
const imageSize = (p) => { const v = oneOf(...require("../media/variants").SIZE_CHOICES)(p && p.size); return v && v !== "full" ? { size: v } : {}; };
const numberIn = (min, max, { integer = false } = {}) => (v) => {
  const n = Number(v);
  if (v === "" || v === null || v === undefined || !Number.isFinite(n) || n < min || n > max) return null;
  if (integer && !Number.isInteger(n)) return null;
  return Math.round(n * 1000) / 1000;
};
const FONT_STACKS = { heading: "var(--kw-font-heading, inherit)", body: "var(--kw-font-body, inherit)", system: "system-ui, -apple-system, 'Segoe UI', sans-serif", serif: "Georgia, 'Times New Roman', serif", mono: "ui-monospace, Menlo, Consolas, monospace" };
const TEXT_SHADOWS = { none: "none", sm: "0 1px 2px rgba(15,23,42,.25)", md: "0 2px 6px rgba(15,23,42,.35)", lg: "0 4px 16px rgba(15,23,42,.45)", glow: "0 0 12px rgba(255,255,255,.8)" };
const SHADOWS = { none: "none", sm: "0 1px 3px rgba(15,23,42,.12)", md: "0 6px 16px rgba(15,23,42,.12)", lg: "0 14px 34px rgba(15,23,42,.16)", xl: "0 24px 60px rgba(15,23,42,.2)" };

// Propriétés de style : clé du modèle → propriété CSS et validateur. Chaque contrôle de l'inspecteur correspond à une ligne.
// Pistes de grille : 1 à 12 valeurs parmi Nfr, Npx, N%, auto (rien d'autre n'atteint la page)
const gridTrack = (v) => {
  const s = String(v ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  const parts = s.split(" ");
  if (!s || parts.length > 12) return null;
  return parts.every((t) => /^(\d{1,2}(\.\d)?fr|\d{1,4}px|\d{1,3}%|auto)$/.test(t)) ? s : null;
};
const len = lengthOf(), lenAuto = lengthOf({ auto: true }), lenSize = lengthOf({ intrinsic: true }), lenSizeAuto = lengthOf({ auto: true, intrinsic: true }), lenNeg = lengthOf({ negative: true }), marginLen = lengthOf({ auto: true, negative: true });
const partsLib = require("./parts");
// Épaisseurs (bordure, contour) : le pourcentage n'a pas de sens en CSS (il serait ignoré par le navigateur) : refusé ici plutôt que publié en silence
const lenNoPercent = (v) => (/%\s*$/.test(String(v)) ? null : len(v));
const STYLE_PROPS = {
  display: { css: "display", check: oneOf("block", "flex", "grid", "inline-block", "inline", "inline-flex", "none"), group: "layout" },
  flexDirection: { css: "flex-direction", check: oneOf("row", "column", "row-reverse", "column-reverse"), group: "layout" },
  flexWrap: { css: "flex-wrap", check: oneOf("wrap", "nowrap", "wrap-reverse"), group: "layout" },
  justifyContent: { css: "justify-content", check: oneOf("flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly", "start", "end", "stretch"), group: "layout" },
  alignItems: { css: "align-items", check: oneOf("stretch", "flex-start", "center", "flex-end", "baseline", "start", "end"), group: "layout" },
  // Répartition des LIGNES (flex avec retour à la ligne) ou des pistes de la grille sur la hauteur du conteneur
  alignContent: { css: "align-content", check: oneOf("stretch", "flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly", "start", "end"), group: "layout" },
  alignSelf: { css: "align-self", check: oneOf("auto", "flex-start", "center", "flex-end", "stretch", "start", "end"), group: "layout" },
  // Alignement d'un enfant de grille sur l'axe horizontal de sa case
  justifySelf: { css: "justify-self", check: oneOf("auto", "start", "center", "end", "stretch"), group: "layout" },
  // Ordre d'affichage d'un enfant (flex ou grille), sans changer sa place dans les calques
  order: { css: "order", check: numberIn(-20, 20, { integer: true }), group: "layout" },
  gap: { css: "gap", check: withLenToken("space", len), out: lenTokenOut, group: "layout" },
  rowGap: { css: "row-gap", check: withLenToken("space", len), out: lenTokenOut, group: "layout" },
  columnGap: { css: "column-gap", check: withLenToken("space", len), out: lenTokenOut, group: "layout" },
  columns: { css: "grid-template-columns", check: numberIn(1, 12, { integer: true }), out: (n) => `repeat(${n}, minmax(0, 1fr))`, group: "layout" },
  // Largeurs des colonnes d'une grille, ex. « 2fr 1fr » ou « 240px 1fr » (remplace le nombre de colonnes égales)
  gridTemplate: { css: "grid-template-columns", check: gridTrack, out: (v) => v.split(" ").map((t) => (/fr$/.test(t) ? `minmax(0, ${t})` : t)).join(" "), group: "layout" },
  gridRows: { css: "grid-template-rows", check: numberIn(1, 12, { integer: true }), out: (n) => `repeat(${n}, auto)`, group: "layout" },
  // Hauteurs des lignes (ex. « 200px 1fr ») : remplace le nombre de lignes égales (écrit après lui)
  gridRowsTemplate: { css: "grid-template-rows", check: gridTrack, out: (v) => v.split(" ").map((t) => (/fr$/.test(t) ? `minmax(0, ${t})` : t)).join(" "), group: "layout" },
  // Pistes créées automatiquement quand il y a plus d'éléments que de cases (ex. « minmax(120px, auto) »)
  gridAutoRows: { css: "grid-auto-rows", check: gridTrack, group: "layout" },
  gridAutoColumns: { css: "grid-auto-columns", check: gridTrack, group: "layout" },
  gridAutoFlow: { css: "grid-auto-flow", check: oneOf("row", "column", "row dense", "column dense"), group: "layout" },
  justifyItems: { css: "justify-items", check: oneOf("stretch", "start", "center", "end"), group: "layout" },
  // Élément enfant d'une grille : nombre de colonnes / lignes occupées
  gridColumnSpan: { css: "grid-column", check: numberIn(1, 12, { integer: true }), out: (n) => `span ${n}`, group: "layout" },
  gridRowSpan: { css: "grid-row", check: numberIn(1, 6, { integer: true }), out: (n) => `span ${n}`, group: "layout" },
  // Placement explicite d'un enfant de grille : lignes de la grille (1 = première ligne). Avec « occupées », la fin est « span N »
  // (écrit en un seul « grid-column: début / fin » : voir declarations()).
  gridColumnStart: { css: "grid-column-start", check: numberIn(1, 13, { integer: true }), group: "layout" },
  gridColumnEnd: { css: "grid-column-end", check: numberIn(1, 13, { integer: true }), group: "layout" },
  gridRowStart: { css: "grid-row-start", check: numberIn(1, 13, { integer: true }), group: "layout" },
  gridRowEnd: { css: "grid-row-end", check: numberIn(1, 13, { integer: true }), group: "layout" },
  width: { css: "width", check: lenSizeAuto, group: "size" },
  height: { css: "height", check: lenSizeAuto, group: "size" },
  minWidth: { css: "min-width", check: lenSize, group: "size" },
  maxWidth: { css: "max-width", check: lenSize, group: "size" },
  minHeight: { css: "min-height", check: lenSize, group: "size" },
  maxHeight: { css: "max-height", check: lenSize, group: "size" },
  // Part de largeur d'une colonne dans « Colonnes » (proportions : 1 / 1 = moitié-moitié, 2 / 1 = deux tiers - un tiers)
  flexGrow: { css: "flex-grow", check: numberIn(0, 20), group: "size" },
  flexShrink: { css: "flex-shrink", check: numberIn(0, 20), group: "size" },
  flexBasis: { css: "flex-basis", check: lenAuto, group: "size" },
  marginTop: { css: "margin-top", check: withLenToken("space", marginLen), out: lenTokenOut, group: "spacing" },
  marginRight: { css: "margin-right", check: withLenToken("space", marginLen), out: lenTokenOut, group: "spacing" },
  marginBottom: { css: "margin-bottom", check: withLenToken("space", marginLen), out: lenTokenOut, group: "spacing" },
  marginLeft: { css: "margin-left", check: withLenToken("space", marginLen), out: lenTokenOut, group: "spacing" },
  paddingTop: { css: "padding-top", check: withLenToken("space", len), out: lenTokenOut, group: "spacing" },
  paddingRight: { css: "padding-right", check: withLenToken("space", len), out: lenTokenOut, group: "spacing" },
  paddingBottom: { css: "padding-bottom", check: withLenToken("space", len), out: lenTokenOut, group: "spacing" },
  paddingLeft: { css: "padding-left", check: withLenToken("space", len), out: lenTokenOut, group: "spacing" },
  // Police : un des cinq réglages historiques du site OU une famille de la bibliothèque (Font Manager, identifiant « font.inter »)
  fontFamily: { css: "font-family", check: (v) => (Object.hasOwn(FONT_STACKS, v) || fontLib.isId(v) ? v : null), out: (v) => FONT_STACKS[v] || fontLib.stackOf(v), group: "typography" },
  // « fluid:min-max » (22.8) : taille fluide bornée, rendue en clamp() calculé à partir de deux nombres seulement (jamais d'expression saisie)
  fontSize: { css: "font-size", check: (v) => (FLUID.isFluid(v) ? FLUID.check(v) : withLenToken("type", len)(v)), out: (v) => (FLUID.isFluid(v) ? FLUID.css(v) : lenTokenOut(v)), group: "typography" },
  fontWeight: { css: "font-weight", check: oneOf("300", "400", "500", "600", "700", "800", "900"), group: "typography" },
  fontStyle: { css: "font-style", check: oneOf("normal", "italic"), group: "typography" },
  lineHeight: { css: "line-height", check: numberIn(0.8, 3), group: "typography" },
  columnCount: { css: "column-count", check: numberIn(1, 6, { integer: true }), group: "typography" }, // texte en colonnes (journal) ; l'écart utilise « columnGap »
  lineClamp: { css: "-webkit-line-clamp", check: numberIn(1, 10, { integer: true }), group: "typography" }, // nombre de lignes maximum (le reste est coupé) : voir declarations()
  letterSpacing: { css: "letter-spacing", check: lenNeg, group: "typography" },
  wordSpacing: { css: "word-spacing", check: lenNeg, group: "typography" },
  textIndent: { css: "text-indent", check: lenNeg, group: "typography" },
  textTransform: { css: "text-transform", check: oneOf("none", "uppercase", "lowercase", "capitalize"), group: "typography" },
  textAlign: { css: "text-align", check: oneOf("left", "center", "right", "justify"), group: "typography" },
  textDecoration: { css: "text-decoration", check: oneOf("none", "underline", "line-through"), group: "typography" },
  textShadow: { css: "text-shadow", check: oneOf(...Object.keys(TEXT_SHADOWS)), out: (v) => TEXT_SHADOWS[v], group: "typography" },
  // Contour du texte (comme « Text Stroke » d'Elementor) : épaisseur + couleur, deux propriétés simples (la couleur peut être un jeton du site)
  direction: { css: "direction", check: oneOf("ltr", "rtl"), group: "typography" }, // sens d'écriture (langues écrites de droite à gauche)
  textStrokeWidth: { css: "-webkit-text-stroke-width", check: len, group: "typography" },
  textStrokeColor: { css: "-webkit-text-stroke-color", check: color, out: colorCss, group: "typography" },
  // Retours à la ligne et débordement du texte (les points de suspension demandent « sans retour » + débordement masqué)
  whiteSpace: { css: "white-space", check: oneOf("normal", "nowrap", "pre", "pre-wrap", "pre-line"), group: "typography" },
  textWrap: { css: "text-wrap", check: oneOf("wrap", "nowrap", "balance", "pretty"), group: "typography" },
  overflowWrap: { css: "overflow-wrap", check: oneOf("normal", "break-word", "anywhere"), group: "typography" },
  textOverflow: { css: "text-overflow", check: oneOf("clip", "ellipsis"), group: "typography" },
  color: { css: "color", check: color, out: colorCss, group: "color" },
  backgroundColor: { css: "background-color", check: color, out: colorCss, group: "color" },
  borderWidth: { css: "border-width", check: lenNoPercent, group: "border" },
  // Épaisseur côté par côté (bordure « déliée ») : écrite après l'épaisseur générale, qu'elle précise
  borderTopWidth: { css: "border-top-width", check: lenNoPercent, group: "border" },
  borderRightWidth: { css: "border-right-width", check: lenNoPercent, group: "border" },
  borderBottomWidth: { css: "border-bottom-width", check: lenNoPercent, group: "border" },
  borderLeftWidth: { css: "border-left-width", check: lenNoPercent, group: "border" },
  borderStyle: { css: "border-style", check: oneOf("none", "solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"), group: "border" },
  borderColor: { css: "border-color", check: color, out: colorCss, group: "border" },
  borderRadius: { css: "border-radius", check: withLenToken("radius", len), out: lenTokenOut, group: "border" },
  // Arrondi coin par coin (arrondi « délié ») : toujours écrit après l'arrondi général, qu'il précise
  borderTopLeftRadius: { css: "border-top-left-radius", check: len, group: "border" },
  borderTopRightRadius: { css: "border-top-right-radius", check: len, group: "border" },
  borderBottomRightRadius: { css: "border-bottom-right-radius", check: len, group: "border" },
  borderBottomLeftRadius: { css: "border-bottom-left-radius", check: len, group: "border" },
  boxShadow: { css: "box-shadow", check: oneOf(...Object.keys(SHADOWS)), out: (v) => SHADOWS[v], group: "effects" },
  opacity: { css: "opacity", check: numberIn(0, 1), group: "effects" },
  overflow: { css: "overflow", check: oneOf("visible", "hidden", "auto"), group: "effects" },
  // Flou de ce qui est DERRIÈRE l'élément (effet verre dépoli, avec un fond semi-transparent)
  backdropBlur: { css: "backdrop-filter", check: numberIn(1, 40, { integer: true }), out: (n) => `blur(${n}px)`, group: "effects" },
  // Visibilité sans toucher à la mise en page (l'élément garde sa place), souris, curseur, fusion avec ce qui est derrière, débordement par axe
  visibility: { css: "visibility", check: oneOf("visible", "hidden"), group: "effects" },
  cursor: { css: "cursor", check: oneOf("auto", "default", "pointer", "text", "move", "grab", "not-allowed", "help", "zoom-in", "zoom-out"), group: "effects" },
  pointerEvents: { css: "pointer-events", check: oneOf("auto", "none"), group: "effects" },
  mixBlendMode: { css: "mix-blend-mode", check: oneOf("normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn", "soft-light", "hard-light", "difference", "exclusion"), group: "effects" },
  overflowX: { css: "overflow-x", check: oneOf("visible", "hidden", "auto", "scroll", "clip"), group: "effects" },
  overflowY: { css: "overflow-y", check: oneOf("visible", "hidden", "auto", "scroll", "clip"), group: "effects" },
  // Contour (hors de la bordure, ne change pas la taille) : accessibilité du focus, repères visuels
  outlineWidth: { css: "outline-width", check: lenNoPercent, group: "border" },
  outlineStyle: { css: "outline-style", check: oneOf("none", "solid", "dashed", "dotted"), group: "border" },
  outlineColor: { css: "outline-color", check: color, out: colorCss, group: "border" },
  outlineOffset: { css: "outline-offset", check: lenNeg, group: "border" },
  // Absolue : placée par rapport au parent positionné (relatif) ; fixe : par rapport à l'écran (bandeau, bouton flottant)
  position: { css: "position", check: oneOf("static", "relative", "sticky", "absolute", "fixed"), group: "position" },
  top: { css: "top", check: lenNeg, group: "position" },
  right: { css: "right", check: lenNeg, group: "position" },
  bottom: { css: "bottom", check: lenNeg, group: "position" },
  left: { css: "left", check: lenNeg, group: "position" },
  transformOrigin: { css: "transform-origin", check: oneOf("center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"), group: "position" },
  // Durée des changements au survol / focus / clic (couleurs, ombre, transformation…)
  transitionDuration: { css: "transition", check: numberIn(0, 2000, { integer: true }), out: (n) => `color ${n}ms ease, background-color ${n}ms ease, border-color ${n}ms ease, box-shadow ${n}ms ease, transform ${n}ms ease, opacity ${n}ms ease`, group: "effects" },
  // Accélération des transitions (écrite APRÈS « transition » : la propriété détaillée remplace l'accélération par défaut de la durée)
  transitionEasing: { css: "transition-timing-function", check: oneOf("ease", "linear", "ease-in", "ease-out", "ease-in-out"), group: "effects" },
  zIndex: { css: "z-index", check: numberIn(-100, 9999, { integer: true }), group: "position" },
  objectFit: { css: "object-fit", check: oneOf("cover", "contain", "fill", "none"), group: "media" },
  objectPosition: { css: "object-position", check: oneOf("center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"), group: "media" },
  aspectRatio: { css: "aspect-ratio", check: oneOf("auto", "1/1", "4/3", "3/2", "16/9", "21/9", "3/4"), out: (v) => v.replace("/", " / "), group: "media" },
  backgroundClip: { css: "background-clip", check: oneOf("border-box", "padding-box", "content-box", "text"), group: "background" }, // « text » : le fond (dégradé, image) se voit à travers les lettres ; voir declarations()
  scrollMarginTop: { css: "scroll-margin-top", check: len, group: "position" }, // décalage d'ancre : distance au haut de l'écran quand un lien #ancre saute ici (en-tête collant)
  backgroundSize: { css: "background-size", check: oneOf("cover", "contain", "auto"), group: "background" },
  backgroundPosition: { css: "background-position", check: oneOf("center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"), group: "background" },
  backgroundRepeat: { css: "background-repeat", check: oneOf("no-repeat", "repeat", "repeat-x", "repeat-y"), group: "background" },
  backgroundAttachment: { css: "background-attachment", check: oneOf("scroll", "fixed"), group: "background" },
};
// Propriétés composées (plusieurs valeurs → une déclaration)
const COMPOSED = {
  backgroundImage: { group: "background" },     // { src } : image de la médiathèque ou https://
  gradient: { group: "background" },            // { from, to, angle }
  overlay: { group: "background" },
  shadow: { group: "effects" },
  backdrop: { group: "effects" },               // { blur, brightness, contrast, grayscale, saturate, sepia, hueRotate, invert } : filtres appliqués à ce qui se trouve DERRIÈRE l'élément (verre dépoli)
  filter: { group: "effects" },                 // { blur, brightness, contrast, grayscale, saturate, sepia, hueRotate }                 // { x, y, blur, spread, color } : ombre personnalisée (remplace le préréglage)             // { color } : voile posé sur l'image ou le dégradé (lisibilité du texte)
  transform: { group: "position" },             // { x, y, rotate, scale, skewX, skewY }
  mask: { group: "mask" },                      // { shape, src, size, position, repeat } : découpe en forme ou masque d'image
};

// Un jeu de styles (un écran ou un état) : seules les clés connues et valides sont gardées, jamais d'erreur bloquante
// pour une valeur vide (« hériter ») ; une valeur invalide est refusée avec un message clair.
function normalizeStyleSet(raw, at, { imageUrl }) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === "" || v === null || v === undefined) continue;
    if (Object.hasOwn(STYLE_PROPS, k)) {
      const ok = STYLE_PROPS[k].check(typeof v === "number" ? (k === "fontWeight" ? String(v) : v) : String(v).trim());
      if (ok === null) throw new Error(`${at} : valeur invalide pour « ${k} » (${String(v).slice(0, 40)}).`);
      out[k] = ok;
    } else if (k === "backgroundImage") {
      const src = imageUrl(v && v.src, `${at} (image de fond)`);
      if (src) { const sz = oneOf(...require("../media/variants").KEYS)(v && v.size); out.backgroundImage = sz ? { src, size: sz } : { src }; }
    } else if (k === "overlay") {
      const c = color(v && v.color);
      if (c) out.overlay = { color: c };
    } else if (k === "gradient") {
      const from = color(v && v.from), to = color(v && v.to), angle = numberIn(0, 360, { integer: true })(v && v.angle);
      // Dégradé linéaire (angle) ou radial, avec la position de chaque couleur en % (comme « Location » d'Elementor) ; valeurs par défaut non enregistrées
      const at = (x, d) => { const n = numberIn(0, 100, { integer: true })(x); return n === null || n === d ? null : n; };
      const fromAt = at(v && v.fromAt, 0), toAt = at(v && v.toAt, 100);
      // Couleurs intermédiaires (jusqu'à 3), chacune avec sa position en % : « extra: [{ color, at }] »
      const extra = (Array.isArray(v && v.extra) ? v.extra : []).slice(0, 3).map((e) => { const c = color(e && e.color), a = numberIn(0, 100, { integer: true })(e && e.at); return c && a !== null ? { color: c, at: a } : null; }).filter(Boolean);
      if (from && to) out.gradient = { from, to, angle: angle === null ? 180 : angle, ...(v && v.type === "radial" ? { type: "radial" } : {}), ...(fromAt !== null ? { fromAt } : {}), ...(toAt !== null ? { toAt } : {}), ...(extra.length ? { extra } : {}) };
    } else if (k === "filter" || k === "backdrop") {
      const f = {};
      const put = (name, min, max) => { const x = numberIn(min, max, { integer: true })(v && v[name]); if (x !== null) f[name] = x; };
      put("blur", 0, 40); put("brightness", 0, 300); put("contrast", 0, 300); put("grayscale", 0, 100); put("saturate", 0, 300); put("sepia", 0, 100); put("hueRotate", -360, 360); put("invert", 0, 100);
      // Valeurs neutres retirées (100 % de luminosité, 0 de flou…)
      for (const [name, neutral] of Object.entries({ blur: 0, brightness: 100, contrast: 100, grayscale: 0, saturate: 100, sepia: 0, hueRotate: 0, invert: 0 })) if (f[name] === neutral) delete f[name];
      if (Object.keys(f).length) out[k] = f;
    } else if (k === "shadow") {
      const c = color(v && v.color);
      const px = (n, min, max) => { const x = numberIn(min, max, { integer: true })(n); return x === null ? 0 : x; };
      if (c) out.shadow = { x: px(v.x, -100, 100), y: px(v.y, -100, 100), blur: px(v.blur, 0, 200), spread: px(v.spread, -50, 100), color: c, ...(v.inset === true ? { inset: true } : {}) };
    } else if (k === "mask") {
      const m = {};
      const shape = oneOf(...Object.keys(MASK_SHAPES))(v && v.shape);
      if (shape) m.shape = shape;
      const src = imageUrl(v && v.src, `${at} (masque)`);
      if (src) {
        m.src = src;
        m.size = oneOf("contain", "cover", "auto")(v.size) || "contain";
        m.position = oneOf("center", "top", "bottom", "left", "right")(v.position) || "center";
        m.repeat = oneOf("no-repeat", "repeat", "space", "round")(v.repeat) || "no-repeat";
      }
      if (Object.keys(m).length) out.mask = m;
    } else if (k === "transform") {
      const t = {};
      const x = lenNeg(v && v.x), y = lenNeg(v && v.y), r = numberIn(-360, 360, { integer: true })(v && v.rotate), s = numberIn(0.1, 3)(v && v.scale);
      const kx = numberIn(-60, 60, { integer: true })(v && v.skewX), ky = numberIn(-60, 60, { integer: true })(v && v.skewY);
      if (x) t.x = x; if (y) t.y = y; if (r !== null && r !== 0) t.rotate = r; if (s !== null && s !== 1) t.scale = s;
      if (kx) t.skewX = kx; if (ky) t.skewY = ky;
      if (Object.keys(t).length) out.transform = t;
    }
  }
  return out;
}

// Placement dans la grille : écrit en « grid-column: début / fin » (même chose pour les lignes), jamais en déclarations qui
// s'écrasent : début seul, fin seule, début + occupées (« 2 / span 3 ») ou occupées seules (« span 3 »)
const PLACEMENT = new Set(["gridColumnStart", "gridColumnEnd", "gridColumnSpan", "gridRowStart", "gridRowEnd", "gridRowSpan"]);
const CORNERS = new Set(["overflowX", "overflowY", "gridTemplate", "gridRowsTemplate", "borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth"]);
// band : conteneur « fond pleine largeur, contenu encadré » : ses intérieurs gauche / droite sont écrits dans des variables (--kw-pl, --kw-pr) que
// la règle .kw-band de landing.css combine avec le retrait qui centre le contenu à la largeur du site : le réglage de l'auteur reste effectif
function declarations(set, band = false) {
  const d = [];
  const entries = Object.entries(set);
  // Coins après l'arrondi général (sinon « border-radius » les écraserait)
  for (const [k, v] of entries.filter(([k]) => !CORNERS.has(k) && !PLACEMENT.has(k) && k !== "transitionEasing").concat(entries.filter(([k]) => CORNERS.has(k) || k === "transitionEasing"))) {
    const p = STYLE_PROPS[k];
    if (k === "fontFamily" && p) { const fv = p.out ? p.out(v) : v; d.push(`font-family:${fv}`, `--kw-font-link:${fv}`, `--kw-font-button:${fv}`, `--kw-font-heading:${fv}`); continue; } // la police réglée sur un élément atteint ses liens, boutons et titres (le site leur impose la sienne par ces variables)
    if (p) d.push(band && (k === "paddingLeft" || k === "paddingRight") ? `--kw-p${k === "paddingLeft" ? "l" : "r"}:${p.out ? p.out(v) : v}` : `${p.css}:${p.out ? p.out(v) : v}`);
  }
  if (set.columnCount !== undefined && set.columnGap === undefined) d.push("column-gap:2rem"); // écart par défaut entre les colonnes de texte
  if (set.lineClamp !== undefined) d.push("display:-webkit-box", "-webkit-box-orient:vertical", "overflow:hidden");
  for (const [axis, css] of [["Column", "grid-column"], ["Row", "grid-row"]]) {
    const start = set[`grid${axis}Start`], end = set[`grid${axis}End`], span = set[`grid${axis}Span`];
    if (start !== undefined || end !== undefined) d.push(`${css}:${start !== undefined ? start : "auto"} / ${end !== undefined ? end : span !== undefined ? `span ${span}` : "auto"}`);
    else if (span !== undefined) d.push(`${css}:span ${span}`);
  }
  const layers = [];
  if (set.overlay) layers.push(`linear-gradient(${colorCss(set.overlay.color)}, ${colorCss(set.overlay.color)})`);
  if (set.gradient) {
    const g = set.gradient;
    const stops = g.extra && g.extra.length
      ? [{ c: g.from, at: g.fromAt || 0 }, ...g.extra.map((e) => ({ c: e.color, at: e.at })), { c: g.to, at: g.toAt === undefined ? 100 : g.toAt }].sort((a, b) => a.at - b.at).map((s) => `${colorCss(s.c)} ${s.at}%`).join(", ")
      : `${colorCss(g.from)}${g.fromAt ? ` ${g.fromAt}%` : ""}, ${colorCss(g.to)}${g.toAt !== undefined ? ` ${g.toAt}%` : ""}`;
    layers.push(g.type === "radial" ? `radial-gradient(circle at center, ${stops})` : `linear-gradient(${g.angle}deg, ${stops})`);
  }
  if (set.backgroundImage) layers.push(`url("${require("../media/variants").sourceFor(set.backgroundImage.src, set.backgroundImage.size)}")`);
  if (layers.length) d.push(`background-image:${layers.join(", ")}`);
  if (set.filter) {
    const f = set.filter, unit = { blur: "px", hueRotate: "deg" }, fn = { hueRotate: "hue-rotate" };
    d.push(`filter:${Object.entries(f).map(([k, v]) => `${fn[k] || k}(${v}${unit[k] || (k === "blur" ? "px" : "%")})`).join(" ")}`);
  }
  if (set.backdrop) { // « verre dépoli » : prime sur le simple flou d'arrière-plan
    const f = set.backdrop, unit = { blur: "px", hueRotate: "deg" }, fn = { hueRotate: "hue-rotate" };
    const v = Object.entries(f).map(([k, x]) => `${fn[k] || k}(${x}${unit[k] || "%"})`).join(" ");
    d.push(`-webkit-backdrop-filter:${v}`, `backdrop-filter:${v}`);
  }
  if (set.backgroundClip === "text") d.push("-webkit-background-clip:text", "-webkit-text-fill-color:transparent"); // le fond apparaît dans les lettres
  if (set.shadow) { const h = set.shadow; d.push(`box-shadow:${h.inset ? "inset " : ""}${h.x}px ${h.y}px ${h.blur}px ${h.spread}px ${colorCss(h.color)}`); }
  if (set.mask) {
    const m = set.mask;
    if (m.shape) d.push(`clip-path:${MASK_SHAPES[m.shape][1]}`);
    if (m.src) for (const pre of ["-webkit-", ""]) d.push(`${pre}mask-image:url("${m.src}")`, `${pre}mask-size:${m.size}`, `${pre}mask-position:${m.position}`, `${pre}mask-repeat:${m.repeat}`);
  }
  if (set.transform) {
    const t = set.transform, parts = [];
    if (t.x || t.y) parts.push(`translate(${t.x || "0"}, ${t.y || "0"})`);
    if (t.rotate) parts.push(`rotate(${t.rotate}deg)`);
    if (t.scale) parts.push(`scale(${t.scale})`);
    if (t.skewX) parts.push(`skewX(${t.skewX}deg)`);
    if (t.skewY) parts.push(`skewY(${t.skewY}deg)`);
    d.push(`transform:${parts.join(" ")}`, `--kw-tf:${parts.join(" ")}`); // --kw-tf : lue par les animations d'entrée pour composer leur mouvement avec cette transformation
  }
  return d.join(";");
}

// ---------- Registre des éléments ----------
// container : accepte des enfants. Les éléments « feuilles » portent leur contenu dans props.
// Balise HTML d'un conteneur (sens de la zone pour les lecteurs d'écran et les moteurs de recherche) : « div » par défaut,
// jamais enregistrée. Pas de « main » : la page a déjà sa zone principale.
const BOX_TAGS = ["div", "section", "header", "footer", "article", "aside", "nav"];
const boxTag = (p) => { const tag = oneOf(...BOX_TAGS)(p.tag); return tag && tag !== "div" ? { tag } : {}; };
// Lien d'un conteneur : toute la zone devient cliquable (page du site, ancre ou https://). Nouvel onglet seulement pour https://.
// Voir aussi INTERACTIVE_INSIDE_LINK : un lien ne peut pas en contenir un autre.
// Boucle d'une grille : source, nombre, catégorie, tri, pagination, filtrage par l'adresse (?q=, ?categorie=). Valeurs bornées.
const LEGACY_SORTS = { recent: ["date", "desc"], old: ["date", "asc"], title: ["title", "asc"], price: ["price", "asc"] };
const EMPTY_LOOP = { posts: "Aucun article ne correspond.", courses: "Aucune formation ne correspond.", products: "Aucun produit ne correspond." };
const loopProps = (p) => {
  const l = p.loop;
  if (!l || typeof l !== "object") return {};
  const query = require("./query");
  const source = oneOf(...query.SOURCES.keys())(l.source) || "posts";
  const sorts = source === "courses" || source === "products" ? ["recent", "title", "price"] : ["recent", "old", "title"];
  const sort = oneOf(...sorts)(l.sort) || "recent";
  // Réglages avancés (tri, filtres, pagination) : validés par le moteur de requêtes commun, jamais recopiés tels quels
  const [orderby, order] = LEGACY_SORTS[sort];
  const explicit = query.SOURCES.get(source).orderby.includes(l.orderby);
  const q = query.normalizeQuery({ ...l, source, count: numberIn(1, query.MAX_COUNT, { integer: true })(l.count) || 6, orderby: explicit ? l.orderby : orderby, order: explicit ? l.order : order, categories: l.categories || (l.category ? [l.category] : undefined) });
  const { source: _s, count: _c, offset, orderby: ob, order: od, pagination, ...filters } = q;
  const paginate = l.paginate === true || pagination !== "none";
  return { loop: {
    source, count: q.count, category: line(l.category, 80), sort,
    ...(explicit ? { orderby: ob, order: od } : {}), ...(offset ? { offset } : {}), ...filters,
    // Défilement horizontal (carrousel) : pas de pagination (les éléments défilent, ils ne se tournent pas en pages)
    ...(l.slider === true ? { slider: true } : paginate ? { paginate: true, pagination: pagination !== "none" ? pagination : "numbers" } : {}),
    ...(l.urlFilter === true ? { urlFilter: true } : {}),
    // Carte insérée : un conteneur enfant marqué « loopInsert » s'intercale après le N-ième résultat (une fois, ou tous les N résultats)
    ...(numberIn(1, 50, { integer: true })(l.insertAt) ? { insertAt: numberIn(1, 50, { integer: true })(l.insertAt), ...(l.insertEvery === true ? { insertEvery: true } : {}) } : {}),
    empty: line(l.empty, 160) || EMPTY_LOOP[source] || "Aucun résultat ne correspond.",
  } };
};
// Adresse ou image : une étiquette dynamique seule (« {{post.url}} ») est acceptée telle quelle et revalidée à l'affichage
const dynamicHelpers = (h) => ({
  ...h,
  linkUrl: (v, label) => (dynamic.isPureToken(v) ? clean(v, 300) : h.linkUrl(v, label)),
  imageUrl: (v, label) => (dynamic.isPureToken(v) ? clean(v, 300) : h.imageUrl(v, label)),
});
const boxProps = (p, at, h) => {
  const link = h.linkUrl(p.link, `${at} (lien du conteneur)`);
  return { ...boxTag(p), ...(p.loopInsert === true ? { loopInsert: true } : {}), ...(link ? { link, ...(p.newTab === true && link.startsWith("https://") ? { newTab: true } : {}) } : {}) };
};
// Éléments qui sont eux-mêmes un lien, un bouton ou un champ (ou qui peuvent en contenir) : interdits dans un conteneur cliquable
const INTERACTIVE_INSIDE_LINK = new Set(["button", "link", "menu", "search", "account", "toggle", "tabs", "accordion", "modal", "carousel", "tooltip", "hotspot", "html", "embed", "social", "breadcrumb", "course", "courselist", "posts", "pricing", "iconlist", "gallery", "table", "postcontent"]);
const nestedProps = (p) => {
  const mode = oneOf("tabs", "carousel", "accordion")(p.mode);
  if (!mode) return {};
  // Accordéon : chaque conteneur enfant est un volet (titre = son nom) qui peut contenir n'importe quel élément ; ouvert au départ : le premier, aucun ou tous ; un seul volet ouvert à la fois ou plusieurs
  if (mode === "accordion") return { mode, accStart: oneOf("none", "all")(p.accStart) || "first", accSingle: p.accSingle === true };
  if (mode === "tabs") return { mode, tabsLook: oneOf("line", "pills")(p.tabsLook) || "line", tabsStart: numberIn(1, 12, { integer: true })(p.tabsStart) || 1 };
  return { mode, dots: p.dots !== false, loop: p.loop === true, autoplay: p.autoplay === true, interval: numberIn(2, 20, { integer: true })(p.interval) || 5 };
};
const NODE_TYPES = {
  // Largeur du contenu : encadrée (1100 px centrés, par défaut) ou pleine largeur
  // Mode d'affichage des enfants (facultatif ; absent = conteneur ordinaire, comme avant) : « onglets » (un enfant = un onglet, titre = son nom) ou
  // « carrousel » (un enfant = une diapositive, avec le carrousel du site). Les enfants restent de vrais conteneurs, modifiables dans le canevas.
  // headerFx : effet d'un EN-TÊTE au défilement, lu sur le premier conteneur de l'en-tête (themeRender.partMode, _sections.ejs) : « shrink » (la rangée se réduit), « solid » (un en-tête superposé devient plein), « both ». Sans rapport avec motion.scrollFx (effets de mouvement d'un élément).
  container: { label: "Conteneur", category: "structure", container: true, props: (p, at, h) => ({ ...boxProps(p, at, h), ...(p.full === true ? { full: true } : p.band === true ? { band: true } : {}), ...nestedProps(p), ...(oneOf("shrink", "solid", "both", "hide")(p.headerFx) ? { headerFx: p.headerFx } : {}), ...(p.headerIdentity === "site" ? { headerIdentity: "site" } : {}), ...(p.dismissible === true ? { dismissible: true } : {}), ...(typeof p.libraryKey === "string" && /^[a-z0-9.-]{3,80}$/.test(p.libraryKey) ? { libraryKey: p.libraryKey } : {}) }) },
  columns: { label: "Colonnes", category: "structure", container: true, props: () => ({}) },
  column: { label: "Colonne", category: "structure", container: true, props: () => ({}) },
  // Grille : peut devenir une BOUCLE (« Répéter pour chaque article / formation ») : ses enfants sont le modèle d'un élément
  grid: { label: "Grille", category: "structure", container: true, props: (p, at, h) => ({ ...boxProps(p, at, h), ...loopProps(p) }) },
  stack: { label: "Pile", category: "structure", container: true, props: boxProps },
  group: { label: "Groupe", category: "structure", container: true, props: boxProps },
  spacer: { label: "Espace", category: "structure", props: (p) => ({ size: oneOf("8", "16", "24", "32", "48", "64", "80", "96", "128")(String(p.size)) || "32" }) },
  // Séparateur : trait seul, ou trait avec un court texte (à gauche, au centre ou à droite)
  divider: { label: "Séparateur", category: "structure", props: (p) => {
    const text = line(p.text, 60);
    return {
      lineStyle: oneOf("solid", "dashed", "dotted", "double")(p.lineStyle) || "solid",
      thickness: numberIn(1, 12, { integer: true })(p.thickness) || 1,
      ...(color(p.color) ? { color: color(p.color) } : {}),
      // La position du texte est conservée même quand le texte est vide : choisir « à droite » AVANT de saisir le texte ne doit pas perdre le choix
      ...(text ? { text, align: oneOf("left", "center", "right")(p.align) || "center" } : oneOf("left", "right")(p.align) ? { align: p.align } : {}),
    };
  } },
  heading: { label: "Titre", category: "text", props: (p, at, h) => {
    // Vide permis dans le brouillon (bloc en cours d'écriture) : jamais affiché sur la page publique
    const text = line(p.text, 200);
    // Lien facultatif sur tout le titre (compté comme les autres liens de la page)
    const link = h.linkUrl(p.link, `${at} (lien du titre)`);
    // Balise : un titre H1–H6 par défaut ; « p », « div » ou « span » pour un texte d'apparence de titre qui n'entre pas dans le plan de la page
    const tag = oneOf("p", "div", "span")(p.tag);
    return { text, level: oneOf("1", "2", "3", "4", "5", "6")(String(p.level)) || "2", ...(tag ? { tag } : {}), ...(link ? { link, newTab: p.newTab === true && link.startsWith("https://") } : {}) };
  } },
  text: { label: "Texte", category: "text", props: (p, at) => {
    const html = sanitizeRich(p.html); // vide permis (paragraphe en cours d'écriture), jamais affiché sur la page publique
    return { html, ...(p.dropCap === true ? { dropCap: true } : {}) }; // lettrine : première lettre agrandie (classe CSS fixe)
  } },
  list: { label: "Liste", category: "text", props: (p, at) => {
    const items = (Array.isArray(p.items) ? p.items : []).map((x) => line(x, 300)).filter(Boolean).slice(0, 30);
    if (!items.length) throw new Error(`${at} (liste) : au moins un élément.`);
    return { items, ordered: p.ordered === true };
  } },
  quote: { label: "Citation", category: "text", props: (p, at) => {
    const text = clean(p.text, 600);
    if (!text) throw new Error(`${at} (citation) : le texte est obligatoire.`);
    return { text, author: line(p.author, 100) };
  } },
  code: { label: "Code (texte)", category: "text", props: (p, at) => {
    const text = clean(p.text, 4000);
    if (!text) throw new Error(`${at} (code) : le texte est obligatoire.`);
    // Langage de coloration : facultatif (absent = texte brut, comme avant) ; une valeur inconnue est ignorée
    const language = require("./highlight").LANGUAGES.includes(p.language) && p.language !== "text" ? p.language : "";
    // Numéros de ligne, bouton « Copier » et lignes surlignées (plages « 2-4, 7 ») : réglages d'affichage, le texte reste du texte
    const hl = [...new Set(String(p.highlight || "").split(",").flatMap((part) => { const m = /^\s*(\d{1,4})(?:\s*-\s*(\d{1,4}))?\s*$/.exec(part); if (!m) return []; const a = Number(m[1]), b = m[2] ? Number(m[2]) : a; return a >= 1 && b >= a && b - a < 200 ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : []; }))].filter((x) => x <= 500).sort((a, b) => a - b).slice(0, 60);
    return { text, ...(language ? { language } : {}), ...(p.lineNumbers === true ? { lineNumbers: true } : {}), ...(p.copy === true ? { copy: true } : {}), ...(hl.length ? { highlight: hl.join(",") } : {}) };
  } },
  image: { label: "Image", category: "media", props: (p, at, h) => {
    const src = h.imageUrl(p.src, `${at} (image)`);
    if (!src) throw new Error(`${at} (image) : choisissez une image.`);
    const alt = line(p.alt, 200);
    if (!alt && p.decorative !== true) throw new Error(`${at} (image) : un texte de remplacement est obligatoire (ou cochez « image décorative »).`);
    const link = h.linkUrl(p.link, `${at} (lien de l'image)`);
    return { src, alt, decorative: p.decorative === true && !alt, link, caption: line(p.caption, 200), title: line(p.title, 150), newTab: p.newTab === true && link.startsWith("https://"), ...(p.lightbox === true && !link ? { lightbox: true } : {}), ...imageSize(p) };
  } },
  gallery: { label: "Galerie", category: "media", props: (p, at, h) => {
    const images = (Array.isArray(p.images) ? p.images : []).slice(0, 24).map((im, i) => {
      const src = h.imageUrl(im && im.src, `${at} (image ${i + 1} de la galerie)`);
      const alt = line(im && im.alt, 200);
      if (src && !alt) throw new Error(`${at} (galerie) : texte de remplacement manquant pour l'image ${i + 1}.`);
      if (!src) return null;
      const caption = line(im && im.caption, 200), link = h.linkUrl(im && im.link, `${at} (lien de l'image ${i + 1})`);
      const tag = line(im && im.tag, 30);
      return { src, alt, ...(caption ? { caption } : {}), ...(link ? { link } : {}), ...(tag ? { tag } : {}) };
    }).filter(Boolean);
    if (!images.length) throw new Error(`${at} (galerie) : au moins une image.`);
    // lightbox : clic = image en grand (sauf image avec lien) ; masonry : hauteurs naturelles en colonnes ; justified : lignes de même hauteur
    // colonnes (grille), ratio d'aspect (grille), hauteur de ligne (justifiée), légende en surcouche au survol, barre de filtres par étiquette (valeurs par défaut non enregistrées)
    const layout = p.masonry === true ? "" : oneOf("justified")(p.layout);
    const columns = numberIn(1, 12, { integer: true })(p.columns), ratio = oneOf("4:3", "3:2", "16:9", "9:16", "21:9")(p.ratio), rowHeight = oneOf("120", "160", "260", "320")(String(p.rowHeight));
    return { images, lightbox: p.lightbox === true, masonry: p.masonry === true, ...(layout ? { layout } : {}), ...(columns && columns !== 3 ? { columns } : {}), ...(ratio ? { ratio } : {}), ...(layout && rowHeight ? { rowHeight } : {}), ...(p.overlay === true ? { overlay: true } : {}), ...(p.filters === true && images.some((im) => im.tag) ? { filters: true } : {}), ...imageSize(p) };
  } },
  video: { label: "Vidéo", category: "media", props: (p, at, h) => {
    const url = line(p.url, 500);
    if (!url || !(parseVideoUrl(url) || LOCAL_VIDEO.test(url))) throw new Error(`${at} (vidéo) : adresse YouTube, Vimeo, fichier vidéo https:// ou vidéo de la médiathèque attendue.`);
    const title = line(p.title, 150);
    if (!title) throw new Error(`${at} (vidéo) : un titre est obligatoire (accessibilité).`);
    // Lecture : les navigateurs n'acceptent la lecture automatique que sans le son ; sans commandes, il faut la lecture
    // automatique (sinon la vidéo ne peut pas démarrer). L'image d'attente ne vaut que pour un fichier vidéo.
    const out = { url, title };
    if (p.autoplay === true) { out.autoplay = true; out.muted = true; }
    else if (p.muted === true) out.muted = true;
    if (p.loop === true) out.loop = true;
    if (p.controls === false) {
      if (!out.autoplay) throw new Error(`${at} (vidéo) : sans commandes de lecture, activez la lecture automatique (sinon la vidéo ne peut pas démarrer).`);
      out.controls = false;
    }
    const poster = p.poster ? h.imageUrl(p.poster, `${at} (image d'attente de la vidéo)`) : "";
    if (poster) out.poster = poster;
    // Début et fin de lecture (secondes), comme « Start Time / End Time » d'Elementor
    const start = numberIn(1, 86399, { integer: true })(p.start), end = numberIn(2, 86400, { integer: true })(p.end);
    if (start) out.start = start;
    if (end) { if (end <= (start || 0)) throw new Error(`${at} (vidéo) : la fin doit venir après le début.`); out.end = end; }
    return out;
  } },
  audio: { label: "Audio", category: "media", props: (p, at) => {
    const src = line(p.src, 1000);
    if (!LOCAL_AUDIO.test(src) && !/^https:\/\/[^\s<>"'`\\/@]+\/[^\s<>"'`\\]*\.(mp3|m4a|ogg|wav)(\?[^\s<>"'`\\]*)?$/i.test(src)) throw new Error(`${at} (audio) : adresse https:// d'un fichier .mp3, .m4a, .ogg ou .wav, ou fichier audio de la médiathèque attendu.`);
    return { src, title: line(p.title, 150), loop: p.loop === true };
  } },
  button: { label: "Bouton", category: "interaction", props: (p, at, h) => {
    const label = line(p.label, 80), url = h.linkUrl(p.url, `${at} (bouton)`);
    if (!label || !url) throw new Error(`${at} (bouton) : un texte et une adresse sont obligatoires.`);
    const icon = h.iconNames.includes(String(p.icon || "")) ? String(p.icon) : "";
    return { label, url, variant: oneOf("primary", "outline", "ghost")(p.variant) || "primary", newTab: p.newTab === true && url.startsWith("https://"),
      ...(icon ? { icon, iconPos: oneOf("before", "after")(p.iconPos) || "before" } : {}),
      // Taille : petite, normale (par défaut, non enregistrée) ou grande
      ...(["sm", "lg"].includes(p.size) ? { size: p.size } : {}),
      // Lien payé ou non recommandé (indication aux moteurs de recherche)
      rel: oneOf("", "nofollow", "sponsored")(String(p.rel || "")) || "" };
  } },
  link: { label: "Lien", category: "interaction", props: (p, at, h) => {
    const label = line(p.label, 120), url = h.linkUrl(p.url, `${at} (lien)`);
    if (!label || !url) throw new Error(`${at} (lien) : un texte et une adresse sont obligatoires.`);
    return { label, url, newTab: p.newTab === true && url.startsWith("https://") };
  } },
  accordion: { label: "Accordéon / FAQ", category: "interaction", props: (p, at) => {
    const items = (Array.isArray(p.items) ? p.items : []).map((x) => ({ q: line(x && x.q, 200), a: clean(x && x.a, 2000) })).filter((x) => x.q && x.a).slice(0, 30);
    if (!items.length) throw new Error(`${at} (accordéon) : au moins une question avec sa réponse.`);
    // single : une seule réponse ouverte à la fois (accordéon exclusif natif du navigateur, sans script)
    return { items, faqSchema: p.faqSchema === true, openFirst: p.openFirst === true, single: p.single === true, icon: oneOf("chevron", "plus", "none")(p.icon) || "chevron" };
  } },
  tabs: { label: "Onglets", category: "interaction", props: (p, at) => {
    const items = (Array.isArray(p.items) ? p.items : []).map((x) => ({ title: line(x && x.title, 60), text: clean(x && x.text, 2000), ...(iconNames().includes(String(x && x.icon)) ? { icon: String(x.icon) } : {}) })).filter((x) => x.title && x.text).slice(0, 20);
    if (items.length < 2) throw new Error(`${at} (onglets) : au moins deux onglets avec un titre et un texte.`);
    return { items, vertical: p.vertical === true };
  } },
  badge: { label: "Badge", category: "text", props: (p, at) => {
    const text = line(p.text, 40);
    if (!text) throw new Error(`${at} (badge) : un texte est obligatoire.`);
    return { text, tone: oneOf("neutral", "primary", "success", "warning", "error")(p.tone) || "primary" };
  } },
  timeline: { label: "Chronologie", category: "text", props: (p, at) => {
    const items = (Array.isArray(p.items) ? p.items : []).map((x) => ({ date: line(x && x.date, 40), title: line(x && x.title, 120), text: clean(x && x.text, 600) })).filter((x) => x.title).slice(0, 30);
    if (!items.length) throw new Error(`${at} (chronologie) : au moins une étape avec un titre.`);
    return { items };
  } },
  progress: { label: "Barre de progression", category: "marketing", props: (p, at) => {
    const label = line(p.label, 80);
    const value = numberIn(0, 100, { integer: true })(p.value);
    if (!label) throw new Error(`${at} (barre de progression) : un libellé est obligatoire (lu par les lecteurs d'écran).`);
    if (value === null) throw new Error(`${at} (barre de progression) : valeur entre 0 et 100.`);
    const dur = numberIn(200, 5000, { integer: true })(p.duration), ease = oneOf("linear", "out")(p.easing);
    return { label, value, showValue: p.showValue !== false, animate: p.animate === true, ...(dur ? { duration: dur } : {}), ...(ease ? { easing: ease } : {}) };
  } },
  menu: { label: "Menu de navigation", category: "interaction", props: (p, at, h) => {
    // Un niveau de sous-menu (liste déroulante) ; sur mobile, le menu peut se replier derrière un bouton
    const item = (x, where) => {
      const label = line(x && x.label, 60);
      const url = label ? h.linkUrl(x && x.url, `${at} (menu, ${where})`) : "";
      return label && url ? { label, url } : null;
    };
    const items = (Array.isArray(p.items) ? p.items : []).slice(0, 12).map((x, i) => {
      const it = item(x, `lien ${i + 1}`);
      if (!it) return null;
      const children = (Array.isArray(x.children) ? x.children : []).slice(0, 10).map((c, j) => item(c, `lien ${i + 1}.${j + 1}`)).filter(Boolean);
      return children.length ? { ...it, children } : it;
    }).filter(Boolean);
    // Source des liens : « manual » (liste écrite ici : état historique, valeur par défaut des éléments déjà enregistrés), « location » (le menu AFFECTÉ à un emplacement dans Apparence → Menus) ou « name » (un menu précis du site).
    // Pour les deux dernières, la liste n'est PAS écrite dans la page : elle est lue dans le moteur de navigation à l'affichage (une seule source de vérité) ; les liens manuels éventuels sont conservés mais non affichés.
    const source = ["manual", "location", "name"].includes(p.source) ? p.source : "manual";
    if (source === "manual" && !items.length) throw new Error(`${at} (menu) : au moins un lien avec un texte et une adresse.`);
    const out = { items, label: line(p.label, 60) || "Menu", vertical: p.vertical === true, mobileToggle: p.mobileToggle === true };
    // Sur mobile : liste dépliée sous le bouton (par défaut) ou tiroir latéral (Header Builder) ; le tiroir suppose le bouton « Menu »
    if (out.mobileToggle && p.mobileMode === "drawer") { out.mobileMode = "drawer"; out.drawerSide = p.drawerSide === "left" ? "left" : "right"; }
    // Méga-menu : « identifiant de l'élément du menu → identifiant du composant (panneau) », pour les rubriques de premier niveau d'un menu du CMS. Seuls des entiers positifs ;
    // le composant doit appartenir au MÊME site (vérifié à l'affichage et à l'enregistrement du panneau).
    if (source !== "manual" && p.mega && typeof p.mega === "object" && !Array.isArray(p.mega)) {
      const mega = {};
      for (const [k, v] of Object.entries(p.mega).slice(0, 12)) { const id = Number(k), cid = Number(v); if (Number.isInteger(id) && id > 0 && Number.isInteger(cid) && cid > 0) mega[String(id)] = cid; }
      if (Object.keys(mega).length) { out.mega = mega; out.megaTrigger = p.megaTrigger === "click" ? "click" : "hover"; out.megaWidth = p.megaWidth === "full" ? "full" : "item"; }
    }
    if (source === "location") { out.source = source; out.location = ["header", "footer", "mobile"].includes(p.location) ? p.location : "header"; }
    else if (source === "name") { out.source = source; out.menuName = line(p.menuName, 80); }
    return out;
  } },
  carousel: { label: "Carrousel d'images", category: "media", props: (p, at, h) => {
    const images = (Array.isArray(p.images) ? p.images : []).slice(0, 24).map((im, i) => {
      const src = h.imageUrl(im && im.src, `${at} (image ${i + 1} du carrousel)`);
      const alt = line(im && im.alt, 200);
      if (src && !alt) throw new Error(`${at} (carrousel) : texte de remplacement manquant pour l'image ${i + 1}.`);
      return src ? { src, alt, caption: line(im && im.caption, 200) } : null;
    }).filter(Boolean);
    if (images.length < 2) throw new Error(`${at} (carrousel) : au moins deux images.`);
    return { images, label: line(p.label, 80) || "Carrousel d'images", dots: p.dots !== false, autoplay: p.autoplay === true, interval: numberIn(2, 20, { integer: true })(p.interval) || 5, loop: p.loop === true, ...(p.effect === "fade" ? { effect: "fade" } : {}), ...(numberIn(2, 4, { integer: true })(p.perView) ? { perView: numberIn(2, 4, { integer: true })(p.perView) } : {}), ...imageSize(p) };
  } },
  toggle: { label: "Bascule", category: "interaction", props: (p, at) => {
    const title = line(p.title, 150), text = clean(p.text, 4000);
    if (!title || !text) throw new Error(`${at} (bascule) : un titre et un contenu sont obligatoires.`);
    return { title, text, open: p.open === true };
  } },
  alert: { label: "Alerte", category: "text", props: (p, at) => {
    const text = clean(p.text, 1000);
    if (!text) throw new Error(`${at} (alerte) : un message est obligatoire.`);
    return { tone: oneOf("info", "success", "warning", "error")(p.tone) || "info", title: line(p.title, 120), text, dismissible: p.dismissible === true };
  } },
  counter: { label: "Compteur", category: "marketing", props: (p, at) => {
    const value = numberIn(-1e9, 1e9)(p.value);
    if (value === null) throw new Error(`${at} (compteur) : un nombre réel est obligatoire.`);
    const label = line(p.label, 120);
    if (!label) throw new Error(`${at} (compteur) : dites ce que mesure ce nombre (et sa source).`);
    const sep = oneOf("dot", "none")(p.separator); // séparateur des milliers : espace (défaut), point ou aucun
    return { value, prefix: line(p.prefix, 10), suffix: line(p.suffix, 16), label, decimals: numberIn(0, 2, { integer: true })(p.decimals) || 0, duration: numberIn(0, 5000, { integer: true })(p.duration) ?? 1500, ...(sep ? { separator: sep } : {}), ...(numberIn(100, 5000, { integer: true })(p.delay) ? { delay: numberIn(100, 5000, { integer: true })(p.delay) } : {}), ...(numberIn(-1e9, 1e9)(p.start) ? { start: numberIn(-1e9, 1e9)(p.start) } : {}), ...(oneOf("linear", "out")(p.easing) ? { easing: oneOf("linear", "out")(p.easing) } : {}) };
  } },
  testimonial: { label: "Témoignage", category: "marketing", props: (p, at, h) => {
    const text = clean(p.text, 1200), name = line(p.name, 80);
    if (!text || !name) throw new Error(`${at} (témoignage) : le texte et le nom de la personne sont obligatoires (témoignage réel, avec son accord).`);
    const avatar = p.avatar ? h.imageUrl(p.avatar, `${at} (photo du témoignage)`) : "";
    return { text, name, role: line(p.role, 120), ...(avatar ? { avatar, ...(oneOf("above", "left", "right")(p.avatarPos) ? { avatarPos: p.avatarPos } : {}), ...imageSize(p) } : {}), rating: numberIn(0, 5, { integer: true })(p.rating) || 0 };
  } },
  pricing: { label: "Offre tarifaire", category: "marketing", props: (p, at, h) => {
    const title = line(p.title, 80), price = line(p.price, 30);
    if (!title || !price) throw new Error(`${at} (offre) : un nom et un prix réel sont obligatoires.`);
    const features = (Array.isArray(p.features) ? p.features : []).map((x) => line(x, 160)).filter(Boolean).slice(0, 20);
    const ctaUrl = h.linkUrl(p.ctaUrl, `${at} (bouton de l'offre)`), ctaLabel = line(p.ctaLabel, 60);
    return { title, price, period: line(p.period, 40), description: line(p.description, 300), features, ...(ctaUrl && ctaLabel ? { ctaLabel, ctaUrl } : {}), badge: line(p.badge, 40), highlight: p.highlight === true };
  } },
  breadcrumb: { label: "Fil d'Ariane", category: "interaction", props: (p, at, h) => {
    const items = (Array.isArray(p.items) ? p.items : []).slice(0, 8).map((x, i, all) => {
      const label = line(x && x.label, 60);
      if (!label) return null;
      const url = i < all.length - 1 ? h.linkUrl(x && x.url, `${at} (fil d'Ariane, niveau ${i + 1})`) : ""; // dernier niveau = la page actuelle
      return url ? { label, url } : { label };
    }).filter(Boolean);
    if (items.length < 2) throw new Error(`${at} (fil d'Ariane) : au moins deux niveaux.`);
    return { items, separator: oneOf("chevron", "slash", "dot")(p.separator) || "chevron" };
  } },
  social: { label: "Réseaux sociaux", category: "interaction", props: (p, at, h) => {
    const items = (Array.isArray(p.items) ? p.items : []).slice(0, 12).map((x, i) => {
      if (!x || !Object.hasOwn(SOCIAL_NETWORKS, x.network)) return null;
      const url = x.network === "email" ? (/^mailto:[^\s<>"'`\\@]+@[^\s<>"'`\\@]+$/.test(String(x.url || "").trim()) ? String(x.url).trim() : "") : h.linkUrl(x.url, `${at} (réseau ${i + 1})`);
      if (!url) throw new Error(`${at} (réseaux sociaux) : adresse manquante pour ${SOCIAL_NETWORKS[x.network]}${x.network === "email" ? " (mailto:adresse@exemple.fr)" : ""}.`);
      return { network: x.network, url };
    }).filter(Boolean);
    if (!items.length) throw new Error(`${at} (réseaux sociaux) : au moins un lien.`);
    return { items, size: oneOf("24", "32", "40", "48")(String(p.size)) || "32", shape: oneOf("circle", "square", "plain")(p.shape) || "circle", label: line(p.label, 60) || "Nos réseaux" };
  } },
  // Boutons de partage : de vrais liens « partager cette page » (adresse publique de la page, construite à l'affichage par le
  // serveur : jamais saisie). Réseaux de partage uniquement ; l'adresse de la page n'existe qu'en https (sinon rien n'est affiché).
  sharebuttons: { label: "Boutons de partage", category: "interaction", props: (p, at) => {
    const networks = (Array.isArray(p.networks) ? p.networks : []).filter((k, i, a) => Object.hasOwn(SHARE_NETWORKS, k) && a.indexOf(k) === i).slice(0, 9);
    if (!networks.length) throw new Error(`${at} (partage) : au moins un réseau (${Object.values(SHARE_NETWORKS).join(", ")}).`);
    return { networks, size: oneOf("24", "32", "40", "48")(String(p.size)) || "32", shape: oneOf("circle", "square", "plain")(p.shape) || "circle", label: line(p.label, 60) || "Partager cette page", message: line(p.message, 120) };
  } },
  modal: { label: "Fenêtre (modale)", category: "interaction", props: (p, at, h) => {
    const buttonLabel = line(p.buttonLabel, 60), title = line(p.title, 120), text = clean(p.text, 4000);
    if (!buttonLabel || !title || !text) throw new Error(`${at} (fenêtre) : le texte du bouton, le titre et le contenu sont obligatoires.`);
    const ctaUrl = h.linkUrl(p.ctaUrl, `${at} (bouton de la fenêtre)`), ctaLabel = line(p.ctaLabel, 60);
    return { buttonLabel, variant: oneOf("primary", "outline", "ghost")(p.variant) || "primary", title, text, ...(ctaUrl && ctaLabel ? { ctaLabel, ctaUrl } : {}), size: oneOf("sm", "md", "lg")(p.size) || "md",
      // centre : fenêtre ; gauche / droite : panneau qui glisse depuis le bord (« off-canvas »)
      position: oneOf("center", "left", "right", "corner", "bar")(p.position) || "center",
      // Ouverture automatique (comme les déclencheurs d'une popup Elementor) : au chargement après un délai, au défilement, à la sortie de la page ou après inactivité ; fréquence limitée
      ...modalAuto(p), ...modalLook(p) };
  } },
  html: { label: "HTML (sécurisé)", category: "advanced", props: (p, at) => {
    const html = sanitizeHtmlBlock(p.html);
    if (!html) throw new Error(`${at} (HTML) : contenu vide (ou entièrement retiré par la sécurité : scripts, formulaires, styles et cadres sont refusés).`);
    return { html };
  } },
  embed: { label: "Contenu intégré", category: "advanced", props: (p, at) => {
    const url = line(p.url, 2000), e = embedOf(url);
    if (!e) throw new Error(`${at} (contenu intégré) : adresse d'un service accepté (${EMBED_PROVIDERS.map((x) => x.key === "maps" ? "Google Maps" : x.label.replace(/ \(.*\)/, "")).join(", ")}).`);
    const title = line(p.title, 150);
    if (!title) throw new Error(`${at} (contenu intégré) : un titre est obligatoire (lu par les lecteurs d'écran).`);
    return { url, title, height: numberIn(150, 1200, { integer: true })(p.height) || null };
  } },
  iconlist: { label: "Liste d'icônes", category: "text", props: (p, at, h) => {
    const items = (Array.isArray(p.items) ? p.items : []).slice(0, 30).map((x, i) => {
      const text = line(x && x.text, 200);
      if (!text) return null;
      const link = h.linkUrl(x && x.link, `${at} (liste d'icônes, ligne ${i + 1})`);
      return { text, icon: h.iconNames.includes(String(x.icon)) ? String(x.icon) : "check", ...(link ? { link } : {}) };
    }).filter(Boolean);
    if (!items.length) throw new Error(`${at} (liste d'icônes) : au moins une ligne.`);
    // Disposition en ligne et séparateurs entre éléments (comme « Layout: Inline » et « Divider » de la liste d'icônes d'Elementor)
    return { items, iconColor: color(p.iconColor) || "", ...(p.inline === true ? { inline: true } : {}), ...(p.divider === true ? { divider: true } : {}) };
  } },
  tooltip: { label: "Infobulle", category: "interaction", props: (p, at) => {
    const text = line(p.text, 120), tip = line(p.tip, 300);
    if (!text || !tip) throw new Error(`${at} (infobulle) : le texte et l'explication sont obligatoires.`);
    return { text, tip, position: oneOf("top", "bottom")(p.position) || "top" };
  } },
  hotspot: { label: "Image à points d'intérêt", category: "media", props: (p, at, h) => {
    const src = h.imageUrl(p.src, `${at} (image à points)`);
    if (!src) throw new Error(`${at} (image à points) : choisissez une image.`);
    const alt = line(p.alt, 200);
    if (!alt) throw new Error(`${at} (image à points) : un texte de remplacement est obligatoire.`);
    const spots = (Array.isArray(p.spots) ? p.spots : []).slice(0, 12).map((x) => {
      const title = line(x && x.title, 80);
      const xx = numberIn(0, 100)(x && x.x), yy = numberIn(0, 100)(x && x.y);
      return title && xx !== null && yy !== null ? { x: xx, y: yy, title, text: line(x.text, 300) } : null;
    }).filter(Boolean);
    return { src, alt, spots, ...(p.trigger === "hover" ? { trigger: "hover" } : {}), ...(p.pulse === true ? { pulse: true } : {}), ...imageSize(p) };
  } },
  posts: { label: "Derniers articles du blog", category: "dynamic", props: (p) => ({
    count: numberIn(1, 12, { integer: true })(p.count) || 3, category: line(p.category, 80),
    layout: oneOf("grid", "list")(p.layout) || "grid", showExcerpt: p.showExcerpt !== false, showDate: p.showDate !== false, showImage: p.showImage !== false,
    empty: line(p.empty, 160) || "Aucun article publié pour le moment.",
  }) },
  courselist: { label: "Formations du catalogue", category: "dynamic", props: (p) => ({
    count: numberIn(1, 12, { integer: true })(p.count) || 3, category: line(p.category, 80), sort: oneOf("recent", "title", "price")(p.sort) || "recent",
    showPrice: p.showPrice !== false, cta: line(p.cta, 40) || "Découvrir", empty: line(p.empty, 160) || "Aucune formation publiée pour le moment.",
  }) },
  // skin « overlay » (Header Builder) : une loupe qui ouvre la recherche en plein écran ; suggest : suggestions pendant la frappe (cible « site » : articles et pages publiés du site, mêmes règles que /recherche)
  search: { label: "Recherche", category: "dynamic", props: (p) => {
    const target = oneOf("blog", "catalogue", "site")(p.target) || "catalogue";
    return { target, placeholder: line(p.placeholder, 80) || "Rechercher…", button: line(p.button, 30) || "Rechercher", ...(p.skin === "overlay" ? { skin: "overlay" } : {}), ...(p.suggest === true && target === "site" ? { suggest: true } : {}) };
  } },
  // skin « menu » (Header Builder) : un visiteur connecté voit un menu déroulant (Mon compte, Panier, Se déconnecter) ; un visiteur non connecté garde les liens habituels
  account: { label: "Compte du visiteur", category: "dynamic", props: (p) => ({
    login: line(p.login, 40) || "Se connecter", account: line(p.account, 40) || "Mon compte", showCart: p.showCart !== false, cart: line(p.cart, 30) || "Panier", ...(p.skin === "menu" ? { skin: "menu" } : {}),
  }) },
  dyntext: { label: "Texte dynamique", category: "dynamic", props: (p, at) => {
    const source = oneOf("firstName", "today", "year", "pageTitle", "courseCount", "postCount")(p.source);
    if (!source) throw new Error(`${at} (texte dynamique) : source inconnue.`);
    // Avant / après : les espaces au bord comptent (« Bonjour » + prénom + « ! »), ils sont gardés
    const edge = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").slice(0, max);
    return { source, before: edge(p.before, 120), after: edge(p.after, 120), fallback: line(p.fallback, 80), tag: oneOf("p", "span", "h2", "h3")(p.tag) || "p" };
  } },
  table: { label: "Tableau", category: "text", props: (p, at) => {
    const rows = (Array.isArray(p.rows) ? p.rows : []).slice(0, 40).map((r) => (Array.isArray(r) ? r.slice(0, 8).map((c) => line(c, 200)) : [])).filter((r) => r.some(Boolean));
    if (!rows.length) throw new Error(`${at} (tableau) : au moins une ligne.`);
    const width = Math.max(...rows.map((r) => r.length));
    return { rows: rows.map((r) => r.concat(Array(width - r.length).fill(""))), header: p.header !== false, caption: line(p.caption, 150),
      footer: p.footer === true && rows.length > (p.header !== false ? 2 : 1), striped: p.striped === true, align: oneOf("left", "center", "right")(p.align) || "left" };
  } },
  countdown: { label: "Compte à rebours", category: "marketing", props: (p, at, h) => {
    const until = String(p.until || "");
    const t = Date.parse(until);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(until) || !Number.isFinite(t)) throw new Error(`${at} (compte à rebours) : date et heure de fin invalides.`);
    const out = { until: new Date(t).toISOString(), endText: line(p.endText, 120) || "C'est terminé." };
    // Minuteur « évolutif » (par visiteur, comme Elementor) : chaque visiteur dispose de la durée donnée à partir de sa première visite ; la date fixe sert de repli sans JavaScript
    if (p.mode === "evergreen") {
      const minutes = numberIn(1, 14400, { integer: true })(p.minutes);
      if (!minutes) throw new Error(`${at} (compte à rebours) : durée du minuteur par visiteur (1 à 14 400 minutes) attendue.`);
      out.mode = "evergreen"; out.minutes = minutes;
    }
    // Que faire à la fin : afficher le texte (défaut), masquer le compte à rebours, ou rediriger vers une page du site
    const expire = oneOf("hide", "redirect")(p.expire);
    if (expire === "redirect") {
      const url = h.linkUrl(p.redirectUrl, `${at} (adresse de redirection)`);
      if (!url || !/^(\/(?!\/)|https:\/\/)/.test(url)) throw new Error(`${at} (compte à rebours) : adresse de redirection attendue (page du site « /… » ou https://…).`);
      out.expire = "redirect"; out.redirectUrl = url;
    } else if (expire === "hide") out.expire = "hide";
    const hideUnits = (Array.isArray(p.hideUnits) ? p.hideUnits : []).filter((u, i, a) => ["days", "hours", "minutes", "seconds"].includes(u) && a.indexOf(u) === i);
    if (hideUnits.length && hideUnits.length < 4) out.hideUnits = hideUnits;
    return out;
  } },
  course: { label: "Formation", category: "commerce", props: (p, at, h) => {
    const courseId = Number(p.courseId);
    if (!getCourse(h.ctx, courseId)) throw new Error(`${at} (formation) : formation introuvable ou non publiée.`);
    return { courseId, cta: line(p.cta, 60) || "Découvrir la formation" };
  } },
  // Logo, titre du site, copyright : contenu lu à l'affichage (logo et nom des réglages SEO, nom du site de la page,
  // année en cours) ; seuls les réglages d'affichage sont enregistrés
  // logoTop : logo affiché tant que la page n'a pas défilé ; logoMobile : logo des petits écrans (Header Builder, images du site) ; scrollHeight / scrollText : taille et texte alternatifs au défilement (réglages existants).
  sitelogo: { label: "Logo du site", category: "dynamic", props: (p, at, h) => {
    const top = p.logoTop ? h.imageUrl(p.logoTop, `${at} (logo en haut de page)`) : "", mobile = p.logoMobile ? h.imageUrl(p.logoMobile, `${at} (logo mobile)`) : "";
    const sh = numberIn(16, 160, { integer: true })(p.scrollHeight), st = line(p.scrollText, 40);
    return { height: numberIn(20, 160, { integer: true })(p.height) || 48, link: p.link !== false, ...(sh ? { scrollHeight: sh } : {}), ...(st ? { scrollText: st } : {}), ...(top ? { logoTop: top } : {}), ...(mobile ? { logoMobile: mobile } : {}) };
  } },
  // Corps de l'article du blog affiché par un modèle « Article du blog » (HTML déjà produit et nettoyé par le blog)
  postcontent: { label: "Contenu de l'article", category: "dynamic", props: () => ({}) },
  // Filtre par catégorie : liens « ?categorie=… » vers la même page (à associer à une grille en boucle « filtrer avec l'adresse »)
  catfilter: { label: "Filtre par catégorie", category: "dynamic", props: (p) => ({ source: oneOf("posts", "courses")(p.source) || "posts", allLabel: line(p.allLabel, 40) || "Toutes", showCount: p.showCount !== false }) },
  sitetitle: { label: "Titre du site", category: "dynamic", props: (p) => ({ tag: oneOf("p", "span", "h1", "h2", "h3")(p.tag) || "p", link: p.link !== false, ...(line(p.scrollText, 40) ? { scrollText: line(p.scrollText, 40) } : {}) }) },
  copyright: { label: "Copyright", category: "dynamic", props: (p) => ({ owner: line(p.owner, 80), text: line(p.text, 160) }) },
  // Bouton d'achat : ajoute la formation au VRAI panier de KOLAKISA (POST /panier/ajouter/:id), ou mène directement à la commande.
  // La formation doit exister et être publiée ; le prix affiché vient du catalogue à l'affichage (jamais saisi).
  addtocart: { label: "Bouton d'achat", category: "commerce", props: (p, at, h) => {
    const courseId = Number(p.courseId);
    if (!getCourse(h.ctx, courseId)) throw new Error(`${at} (bouton d'achat) : formation introuvable ou non publiée.`);
    const mode = oneOf("cart", "buy")(p.mode) || "cart";
    return { courseId, mode, label: line(p.label, 60) || (mode === "buy" ? "Acheter maintenant" : "Ajouter au panier"), variant: oneOf("primary", "outline", "ghost")(p.variant) || "primary", size: oneOf("sm", "md", "lg")(p.size) || "md", showPrice: p.showPrice === true };
  } },
  // Avis de la formation : note moyenne et nombre d'avis RÉELS (table des avis), lus à l'affichage ; sans avis : un texte honnête
  courserating: { label: "Avis de la formation", category: "commerce", props: (p, at, h) => {
    const courseId = Number(p.courseId);
    if (!getCourse(h.ctx, courseId)) throw new Error(`${at} (avis de la formation) : formation introuvable ou non publiée.`);
    return { courseId, showCount: p.showCount !== false, empty: line(p.empty, 80) || "Pas encore d'avis" };
  } },
  // Titre animé : début fixe, mots qui se succèdent (2 à 8), fin fixe. Lu en entier par les lecteurs d'écran.
  animatedheading: { label: "Titre animé", category: "text", props: (p, at) => {
    const words = (Array.isArray(p.words) ? p.words : []).map((w) => line(w, 40)).filter(Boolean).slice(0, 8);
    if (words.length < 2) throw new Error(`${at} (titre animé) : au moins deux mots qui se succèdent.`);
    return { before: line(p.before, 80), words, after: line(p.after, 80), level: oneOf("1", "2", "3", "4", "5", "6")(String(p.level)) || "2", effect: oneOf("fade", "type", "slide", "blur", "zoom")(p.effect) || "fade", interval: numberIn(1500, 6000, { integer: true })(p.interval) || 2500, ...(p.cursor === false ? { cursor: false } : {}) };
  } },
  // Boîte retournable : recto (icône, titre, texte) au repos, verso (titre, texte, bouton) au survol, au focus ou au toucher
  flipbox: { label: "Boîte retournable", category: "interaction", props: (p, at, h) => {
    const frontTitle = line(p.frontTitle, 80), backTitle = line(p.backTitle, 80);
    if (!frontTitle) throw new Error(`${at} (boîte retournable) : le titre du recto est obligatoire.`);
    const icon = h.iconNames.includes(String(p.icon || "")) ? String(p.icon) : "";
    const ctaUrl = h.linkUrl(p.ctaUrl, `${at} (bouton du verso)`), ctaLabel = line(p.ctaLabel, 40);
    return { icon, frontTitle, frontText: clean(p.frontText, 300), backTitle, backText: clean(p.backText, 400), ...(ctaUrl && ctaLabel ? { ctaLabel, ctaUrl } : {}), effect: oneOf("flip", "fade")(p.effect) || "flip", height: numberIn(160, 600, { integer: true })(p.height) || 280, ...(p.direction === "vertical" ? { direction: "vertical" } : {}), ...(numberIn(200, 1500, { integer: true })(p.duration) ? { duration: numberIn(200, 1500, { integer: true })(p.duration) } : {}) };
  } },
  // Liste de prix : prestations réelles (nom, prix, description, lien facultatif), points de conduite jusqu'au prix
  pricelist: { label: "Liste de prix", category: "marketing", props: (p, at, h) => {
    const items = (Array.isArray(p.items) ? p.items : []).slice(0, 30).map((it, i) => {
      const title = line(it && it.title, 80), price = line(it && it.price, 30);
      if (!title && !price) return null;
      if (!title || !price) throw new Error(`${at} (liste de prix) : ligne ${i + 1} : un nom et un prix réel.`);
      const link = h.linkUrl(it.link, `${at} (lien de la ligne ${i + 1})`);
      return { title, price, text: line(it.text, 200), ...(link ? { link } : {}) };
    }).filter(Boolean);
    if (!items.length) throw new Error(`${at} (liste de prix) : au moins une ligne.`);
    return { items };
  } },
  // Table des matières : construite à l'affichage à partir des titres de la page (jamais une liste recopiée à la main)
  toc: { label: "Table des matières", category: "interaction", props: (p) => ({ title: line(p.title, 80) || "Sommaire", depth: oneOf("2", "3", "4")(String(p.depth)) || "3", numbered: p.numbered === true }) },
  // Barre de lecture : progression du défilement de la page, en haut ou en bas de l'écran
  readingprogress: { label: "Barre de lecture", category: "interaction", props: (p) => ({ position: oneOf("top", "bottom")(p.position) || "top", thickness: numberIn(2, 10, { integer: true })(p.thickness) || 4, ...(p.shape === "circle" ? { shape: "circle" } : {}) }) },
  // Formulaire : un formulaire du module « Formulaires d'inscription » (champs, consentement, anti-robot, double
  // confirmation, étiquettes : tout vient du formulaire). Plusieurs par page, chacun à son emplacement.
  signupform: { label: "Formulaire", category: "marketing", props: (p, at, h) => {
    const formId = Number(p.formId);
    const row = Number.isInteger(formId) && h.ctx && h.ctx.db ? h.ctx.db.prepare("SELECT id FROM mk_forms WHERE id = ? AND organization_id = ?").get(formId, h.ctx.organizationId) : null;
    if (!row) throw new Error(`${at} (formulaire) : choisissez un formulaire existant (Audience → Formulaires d'inscription).`);
    return { formId, heading: line(p.heading, 150), intro: clean(p.intro, 400), button: line(p.button, 40) || "S'inscrire" };
  } },
  // Google Maps : carte d'une adresse, sans clé d'API (lien d'intégration public de Google, construit ici : l'adresse
  // est encodée, rien d'autre n'atteint la page)
  map: { label: "Google Maps", category: "media", props: (p, at) => {
    const address = line(p.address, 200);
    if (!address) throw new Error(`${at} (Google Maps) : indiquez une adresse ou un lieu.`);
    return { address, zoom: numberIn(1, 20, { integer: true })(p.zoom) || 14, height: numberIn(150, 800, { integer: true })(p.height) || 350, title: line(p.title, 150) || `Carte : ${address}` };
  } },
  // Boîte d'image / boîte d'icône : visuel + titre + texte (+ lien sur le titre et le visuel), visuel en haut, à gauche
  // ou à droite (empilé sur mobile)
  imagebox: { label: "Boîte d'image", category: "media", props: (p, at, h) => {
    const src = h.imageUrl(p.src, `${at} (boîte d'image)`);
    if (!src) throw new Error(`${at} (boîte d'image) : choisissez une image.`);
    const alt = line(p.alt, 200), title = line(p.title, 120);
    if (!title) throw new Error(`${at} (boîte d'image) : le titre est obligatoire.`);
    const link = h.linkUrl(p.link, `${at} (lien de la boîte d'image)`);
    return { src, alt, title, text: clean(p.text, 600), titleLevel: oneOf("2", "3", "4", "5", "6")(String(p.titleLevel)) || "3", position: oneOf("top", "left", "right")(p.position) || "top", ...(link ? { link, newTab: p.newTab === true && link.startsWith("https://") } : {}), ...imageSize(p) };
  } },
  iconbox: { label: "Boîte d'icône", category: "media", props: (p, at, h) => {
    const icon = String(p.icon || "");
    if (!h.iconNames.includes(icon)) throw new Error(`${at} (boîte d'icône) : icône inconnue.`);
    const title = line(p.title, 120);
    if (!title) throw new Error(`${at} (boîte d'icône) : le titre est obligatoire.`);
    const link = h.linkUrl(p.link, `${at} (lien de la boîte d'icône)`);
    return { icon, title, text: clean(p.text, 600), titleLevel: oneOf("2", "3", "4", "5", "6")(String(p.titleLevel)) || "3", position: oneOf("top", "left", "right")(p.position) || "top", size: oneOf("24", "32", "48", "64")(String(p.size)) || "48", ...(link ? { link, newTab: p.newTab === true && link.startsWith("https://") } : {}) };
  } },
  // Évaluation : note réelle (demandée à l'ajout), demi-étoiles permises, sur 5 ou sur 10
  rating: { label: "Évaluation", category: "marketing", props: (p, at) => {
    const scale = oneOf("5", "10")(String(p.scale)) === "10" ? 10 : 5;
    const value = Math.round(Number(String(p.value).replace(",", ".")) * 2) / 2;
    if (!Number.isFinite(value) || value < 0 || value > scale) throw new Error(`${at} (évaluation) : une note entre 0 et ${scale}.`);
    return { value, scale, title: line(p.title, 80), showValue: p.showValue !== false };
  } },
  // Ancre de menu : point d'arrivée invisible d'un lien « #nom » (le nom est l'ancre de l'élément, unique dans la page)
  menuanchor: { label: "Ancre de menu", category: "interaction", props: () => ({}) },
  icon: { label: "Icône", category: "media", props: (p, at, h) => {
    const name = String(p.name || "");
    if (!h.iconNames.includes(name)) throw new Error(`${at} (icône) : icône inconnue.`);
    const link = h.linkUrl(p.link, `${at} (lien de l'icône)`);
    if (link && !line(p.label, 80)) throw new Error(`${at} (icône) : une icône cliquable a besoin d'une description (lue par les lecteurs d'écran).`);
    return { name, label: line(p.label, 80), size: oneOf("16", "24", "32", "48", "64", "96", "128")(String(p.size)) || "32", link, newTab: p.newTab === true && link.startsWith("https://") };
  } },
};
// ---------- Bibliothèque de widgets (panneau « Éléments ») ----------
// Catégories dans l'ordre d'Elementor. Chaque type d'élément y a une fiche : catégorie, mots de recherche (ce que l'on tape
// naturellement), permission exigée pour l'AJOUTER ou le MODIFIER (le cadenas de la bibliothèque, vérifié aussi à
// l'enregistrement, voir lockedWidgetChanges) et version du schéma de ses réglages.
const WIDGET_GROUPS = { layout: "Mise en page", basic: "Basique", general: "Général", form: "Formulaire", advanced: "Avancé", site: "Site", commerce: "E-commerce", social: "Réseaux sociaux" };
const WIDGETS = {
  container: ["layout", "boite bloc conteneur div section flexbox flex zone"],
  grid: ["layout", "grille tableau colonnes lignes cases grid"],
  columns: ["layout", "colonnes grille mise en page layout cote a cote"],
  column: ["layout", "colonne"],
  stack: ["layout", "pile empiler vertical"],
  group: ["layout", "groupe regrouper ensemble"],
  heading: ["basic", "titre h1 h2 h3 intertitre texte"],
  image: ["basic", "photo visuel illustration media image"],
  text: ["basic", "editeur de texte paragraphe texte riche"],
  video: ["basic", "youtube vimeo film media"],
  button: ["basic", "bouton cta appel action lien"],
  divider: ["basic", "separateur ligne trait"],
  spacer: ["basic", "espaceur espace vide marge"],
  icon: ["basic", "icone pictogramme symbole"],
  map: ["basic", "carte google maps plan adresse localisation itineraire lieu"],
  imagebox: ["general", "boite d'image carte image titre texte fonctionnalite"],
  iconbox: ["general", "boite d'icone carte icone titre texte avantage fonctionnalite"],
  rating: ["general", "evaluation note etoiles avis notation score"],
  menuanchor: ["general", "ancre de menu lien interne defilement section id"],
  signupform: ["form", "formulaire inscription newsletter email contact champs abonnement"],
  animatedheading: ["advanced", "titre anime mots defilants rotation machine a ecrire accroche"],
  flipbox: ["advanced", "boite retournable carte retournee flip recto verso survol"],
  pricelist: ["advanced", "liste de prix tarifs prestations menu carte"],
  toc: ["advanced", "table des matieres sommaire plan titres navigation"],
  readingprogress: ["advanced", "barre de lecture progression defilement scroll article"],
  sitelogo: ["site", "logo du site marque image accueil en-tete"],
  sitetitle: ["site", "titre du site nom marque accueil en-tete"],
  catfilter: ["site", "filtre categorie taxonomie etiquette trier boucle blog catalogue"],
  postcontent: ["site", "contenu article texte principal corps blog modele theme single post"],
  copyright: ["site", "copyright droits reserves annee pied de page mentions"],
  link: ["basic", "lien url"],
  list: ["basic", "liste puces numerotee"],
  tabs: ["general", "onglets"],
  accordion: ["general", "faq questions reponses accordeon"],
  toggle: ["general", "bascule deplier details afficher plus"],
  carousel: ["general", "carrousel slider diaporama images defilant photos media"],
  gallery: ["general", "galerie photos images diaporama media basique"],
  iconlist: ["general", "liste icones puces avantages"],
  counter: ["general", "compteur chiffre statistique nombre"],
  progress: ["general", "progression barre pourcentage jauge"],
  testimonial: ["general", "temoignage avis client citation note etoiles evaluation"],
  alert: ["general", "alerte avertissement information notice message"],
  audio: ["general", "son musique podcast mp3 audio"],
  html: ["general", "html code balises svg", "pages.code"],
  quote: ["general", "citation temoignage"],
  badge: ["general", "etiquette label pastille nouveau"],
  table: ["general", "tableau"],
  timeline: ["general", "chronologie etapes histoire parcours programme"],
  code: ["general", "code texte brut preformate"],
  countdown: ["advanced", "compte a rebours minuteur urgence"],
  pricing: ["advanced", "tarif prix offre abonnement"],
  modal: ["advanced", "fenetre modale popup pop-up dialogue panneau off-canvas lateral"],
  tooltip: ["advanced", "infobulle aide explication survol"],
  hotspot: ["advanced", "points interet image interactive hotspot"],
  embed: ["advanced", "integrer embed iframe carte google maps calendly spotify soundcloud typeform loom canva"],
  dyntext: ["advanced", "texte dynamique prenom date personnalise variable"],
  menu: ["site", "menu navigation liens nav"],
  breadcrumb: ["site", "fil ariane chemin navigation"],
  search: ["site", "recherche rechercher champ"],
  account: ["site", "compte connexion panier utilisateur"],
  posts: ["site", "articles blog actualites derniers dynamique"],
  course: ["commerce", "formation cours produit vente acheter"],
  courselist: ["commerce", "formations catalogue produits cours boutique dynamique"],
  courserating: ["commerce", "avis note etoiles evaluation formation produit commentaires moyenne"],
  addtocart: ["commerce", "acheter achat panier ajouter commande boutique bouton prix formation produit"],
  social: ["social", "reseaux sociaux facebook instagram linkedin youtube"],
  sharebuttons: ["social", "partager partage facebook x twitter linkedin whatsapp email diffuser reseaux sociaux"],
};
// Raccourcis : entrée de bibliothèque qui crée un élément existant préréglé (ex. SoundCloud = contenu intégré limité à
// SoundCloud). Le serveur valide l'élément créé comme tout autre.
// Sous-catégories de la catégorie « Site » (ordre d'affichage) et rattachement des éléments qui ne sont pas des raccourcis
const SITE_SUBS = ["Navigation et identité", "Contenu de l'article", "Archives et recherche", "Listes dynamiques", "Compte et panier"];
const SITE_SUB = { cmsmenu: SITE_SUBS[0], sitelogo: SITE_SUBS[0], sitetitle: SITE_SUBS[0], menu: SITE_SUBS[0], breadcrumb: SITE_SUBS[0], search: SITE_SUBS[0], copyright: SITE_SUBS[0], postnav: SITE_SUBS[0],
  postcontent: SITE_SUBS[1], postmeta: SITE_SUBS[1], postterms: SITE_SUBS[1], authorbox: SITE_SUBS[1], postcomments: SITE_SUBS[1], toc: SITE_SUBS[1],
  archiveinfo: SITE_SUBS[2], catfilter: SITE_SUBS[2], querylist: SITE_SUBS[3], posts: SITE_SUBS[3], account: SITE_SUBS[4], minicart: SITE_SUBS[4] };
const WIDGET_SHORTCUTS = [
  { key: "soundcloud", label: "SoundCloud", group: "general", icon: "play", keywords: "soundcloud son musique podcast audio lecteur", type: "embed", provider: "soundcloud" },
  { key: "youtubeplaylist", label: "Playlist YouTube", group: "general", icon: "video", keywords: "playlist youtube liste de lecture videos serie video", type: "embed", provider: "youtubelist" },
  { key: "facebookpage", label: "Page Facebook", group: "social", icon: "users", keywords: "facebook page fil actualites abonnes plugin", type: "embed", provider: "facebookpage" },
  { key: "facebookpost", label: "Publication Facebook", group: "social", icon: "fileText", keywords: "facebook publication post video integrer embed", type: "embed", provider: "facebookpost" },
  { key: "instagrampost", label: "Instagram", group: "social", icon: "image", keywords: "instagram publication reel photo integrer embed", type: "embed", provider: "instagram" },
  { key: "tiktokvideo", label: "TikTok", group: "social", icon: "video", keywords: "tiktok video integrer embed", type: "embed", provider: "tiktok" },
  // Titre de la page : texte dynamique (source « titre de la page ») préréglé, rien à demander
  { key: "pagetitle", label: "Titre de la page", group: "site", sub: SITE_SUBS[0], icon: "type", keywords: "titre de la page nom h1 h2", type: "dyntext", preset: { source: "pageTitle", tag: "h2", before: "", after: "", fallback: "" } },
  { key: "posttitle", label: "Titre de l'article", group: "site", sub: "Contenu de l'article", icon: "type", keywords: "titre article billet h1 post title", type: "heading", preset: {"text": "{{post.title | fallback: Titre de l'article}}", "level": "1"} },
  { key: "postexcerpt", label: "Résumé de l'article", group: "site", sub: "Contenu de l'article", icon: "alignLeft", keywords: "extrait resume chapeau article", type: "text", preset: {"html": "<p>{{post.excerpt}}</p>"} },
  { key: "postimage", label: "Image à la une", group: "site", sub: "Contenu de l'article", icon: "image", keywords: "image a la une couverture article vignette", type: "image", preset: {"src": "{{post.image}}", "alt": "{{post.title}}"} },
  { key: "postdate", label: "Date de publication", group: "site", sub: "Contenu de l'article", icon: "clock", keywords: "date publication article publie le", type: "text", preset: {"html": "<p>{{post.date}}</p>"} },
  { key: "postupdated", label: "Date de mise à jour", group: "site", sub: "Contenu de l'article", icon: "clock", keywords: "mise a jour modifie article date", type: "text", preset: {"html": "<p>Mis à jour le {{post.modified}}</p>"} },
  { key: "postauthor", label: "Nom de l'auteur", group: "site", sub: "Contenu de l'article", icon: "user", keywords: "auteur nom ecrit par article", type: "text", preset: {"html": "<p>Par {{post.author}}</p>"} },
  { key: "postauthorimg", label: "Photo de l'auteur", group: "site", sub: "Contenu de l'article", icon: "user", keywords: "avatar photo auteur article", type: "image", preset: {"src": "{{post.author_avatar}}", "alt": "{{post.author}}"} },
  { key: "postcategory", label: "Catégorie de l'article", group: "site", sub: "Contenu de l'article", icon: "tag", keywords: "categorie article rubrique", type: "text", preset: {"html": "<p>{{post.category}}</p>"} },
  { key: "posttags", label: "Étiquettes de l'article (texte)", group: "site", sub: "Contenu de l'article", icon: "tag", keywords: "etiquettes tags article mots cles", type: "text", preset: {"html": "<p>{{post.tags}}</p>"} },
  { key: "postreading", label: "Temps de lecture", group: "site", sub: "Contenu de l'article", icon: "clock", keywords: "temps de lecture minutes article", type: "text", preset: {"html": "<p>{{post.reading_time}}</p>"} },
  { key: "postcommentcount", label: "Nombre de commentaires", group: "site", sub: "Contenu de l'article", icon: "quote", keywords: "nombre commentaires article", type: "text", preset: {"html": "<p>{{post.comments}} commentaire(s)</p>"} },
  { key: "postviews", label: "Nombre de lectures", group: "site", sub: "Contenu de l'article", icon: "eye", keywords: "vues lectures compteur article", type: "text", preset: {"html": "<p>{{post.views}} lectures</p>"} },
  { key: "postreadmore", label: "Bouton « Lire la suite »", group: "site", sub: "Contenu de l'article", icon: "mousePointer", keywords: "lire la suite lien article bouton", type: "button", preset: {"label": "Lire la suite", "url": "{{post.url}}", "variant": "primary"} },
  { key: "postbacklink", label: "Lien « Retour au blog »", group: "site", sub: "Contenu de l'article", icon: "arrowRight", keywords: "retour blog liste articles lien", type: "link", preset: {"label": "‹ Retour au blog", "url": "/blog"} },
  { key: "archivetitle", label: "Titre de l'archive", group: "site", sub: "Archives et recherche", icon: "type", keywords: "titre archive categorie etiquette auteur recherche", type: "heading", preset: {"text": "{{archive.title | fallback: Blog}}", "level": "1"} },
  { key: "archivedesc", label: "Description de l'archive", group: "site", sub: "Archives et recherche", icon: "alignLeft", keywords: "description archive categorie texte intro", type: "text", preset: {"html": "<p>{{archive.description}}</p>"} },
  { key: "archivecount", label: "Nombre de résultats", group: "site", sub: "Archives et recherche", icon: "list", keywords: "nombre resultats archive recherche total", type: "text", preset: {"html": "<p>{{archive.count}} résultat(s)</p>"} },
  { key: "searchtitle", label: "Titre des résultats de recherche", group: "site", sub: "Archives et recherche", icon: "search", keywords: "resultats recherche titre vous avez cherche", type: "heading", preset: {"text": "Résultats pour « {{query.q | fallback: votre recherche}} »", "level": "1"} },
  { key: "recentposts", label: "Articles récents", group: "site", sub: "Listes dynamiques", icon: "list", keywords: "articles recents derniers blog liste", type: "querylist", preset: {"title": "Articles récents", "source": "posts", "mode": "recent", "count": 5} },
  { key: "popularposts", label: "Articles populaires", group: "site", sub: "Listes dynamiques", icon: "list", keywords: "articles populaires plus lus vues liste", type: "querylist", preset: {"title": "Les plus lus", "source": "posts", "mode": "popular", "count": 5} },
  { key: "commentedposts", label: "Articles les plus commentés", group: "site", sub: "Listes dynamiques", icon: "list", keywords: "articles commentes discutes liste", type: "querylist", preset: {"title": "Les plus commentés", "source": "posts", "mode": "commented", "count": 5} },
  { key: "relatedposts", label: "Articles liés", group: "site", sub: "Listes dynamiques", icon: "list", keywords: "articles lies similaires suggestions meme categorie", type: "querylist", preset: {"title": "À lire aussi", "source": "posts", "mode": "related", "count": 3, "layout": "cards"} },
  { key: "authorposts", label: "Autres articles de l'auteur", group: "site", sub: "Listes dynamiques", icon: "user", keywords: "articles meme auteur autres liste", type: "querylist", preset: {"title": "Du même auteur", "source": "posts", "mode": "sameauthor", "count": 3} },
  { key: "archiveposts", label: "Articles de l'archive", group: "site", sub: "Listes dynamiques", icon: "list", keywords: "articles archive categorie etiquette auteur liste suivre", type: "querylist", preset: {"source": "posts", "mode": "archive", "count": 9, "layout": "cards", "showExcerpt": true} },
  { key: "randomposts", label: "Articles au hasard", group: "site", sub: "Listes dynamiques", icon: "list", keywords: "articles hasard aleatoire decouvrir", type: "querylist", preset: {"title": "À découvrir", "source": "posts", "mode": "random", "count": 3} },
  { key: "categorylist", label: "Liste des catégories", group: "site", sub: "Listes dynamiques", icon: "tag", keywords: "categories liste blog menu rubriques", type: "querylist", preset: {"title": "Catégories", "source": "categories", "mode": "recent", "count": 12, "layout": "compact"} },
  { key: "tagcloud", label: "Nuage d'étiquettes", group: "site", sub: "Listes dynamiques", icon: "tag", keywords: "etiquettes tags nuage mots cles", type: "querylist", preset: {"title": "Étiquettes", "source": "tags", "mode": "popular", "count": 24, "layout": "inline"} },
  { key: "authorlist", label: "Liste des auteurs", group: "site", sub: "Listes dynamiques", icon: "users", keywords: "auteurs equipe redacteurs liste", type: "querylist", preset: {"title": "Nos auteurs", "source": "authors", "mode": "popular", "count": 8, "showExcerpt": true} },
  { key: "pagelist", label: "Liste des pages du site", group: "site", sub: "Listes dynamiques", icon: "list", keywords: "pages du site menu plan navigation liste", type: "querylist", preset: {"title": "Pages", "source": "pages", "mode": "recent", "count": 12, "layout": "compact", "showImage": false, "showDate": false} },
  // Produit = formation : mêmes données que la fiche d'une formation (modèle « Fiche d'une formation » du thème) ; l'élément se remplit à l'affichage
  { key: "producttitle", label: "Titre du produit", group: "commerce", icon: "type", keywords: "produit titre formation nom product title", type: "heading", preset: {"text": "{{product.title | fallback: Titre de la formation}}", "level": "1"} },
  { key: "productprice", label: "Prix du produit", group: "commerce", icon: "coin", keywords: "produit prix tarif formation product price", type: "text", preset: {"html": "<p><strong>{{product.price}}</strong></p>"} },
  { key: "productimage", label: "Image du produit", group: "commerce", icon: "image", keywords: "produit image vignette couverture formation product images", type: "image", preset: {"src": "{{product.image}}", "alt": "{{product.title}}"} },
  { key: "productshort", label: "Description du produit", group: "commerce", icon: "alignLeft", keywords: "produit description courte resume formation short description", type: "text", preset: {"html": "<p>{{product.subtitle}}</p><p>{{product.description}}</p>"} },
  { key: "productmeta", label: "Informations du produit", group: "commerce", icon: "info", keywords: "produit meta categorie formateur informations product meta", type: "text", preset: {"html": "<p>Catégorie : {{product.category}} · Formateur : {{product.instructor}}</p>"} },
  { key: "productrelated", label: "Produits apparentés", group: "commerce", icon: "list", keywords: "produits apparentes lies similaires formations related upsells", type: "querylist", preset: {"title": "Vous aimerez aussi", "source": "courses", "mode": "recent", "count": 3, "layout": "cards", "showDate": false, "excludeCurrent": true} },
  { key: "shoprelated", label: "Produits apparentés (boutique)", group: "commerce", icon: "list", keywords: "produits apparentes lies similaires boutique meme categorie related upsells", type: "querylist", preset: {"title": "Vous aimerez aussi", "source": "products", "mode": "related", "count": 3, "layout": "cards", "showDate": false, "excludeCurrent": true} },
  { key: "courselist2", label: "Formations (liste dynamique)", group: "site", sub: "Listes dynamiques", icon: "list", keywords: "formations cours catalogue liste dynamique recents", type: "querylist", preset: {"title": "Nos formations", "source": "courses", "mode": "recent", "count": 6, "layout": "cards", "showDate": false} },
];

// Description courte de chaque élément (infobulle de la bibliothèque) : ce qu'il fait, en une phrase. Les widgets personnalisés portent la leur (widgets/*.js).
const WIDGET_DESCRIPTIONS = {
  container: "Une boîte qui range d'autres éléments (colonne, ligne, section)", columns: "Plusieurs colonnes côte à côte", column: "Une colonne d'un ensemble de colonnes", grid: "Une grille de cases à colonnes réglables", stack: "Des éléments empilés avec un espacement régulier", group: "Un groupe d'éléments qui se déplacent ensemble",
  spacer: "Un espace vertical réglable", divider: "Un trait de séparation, avec un texte au milieu si besoin", heading: "Un titre (H1 à H6)", text: "Un paragraphe de texte mis en forme", list: "Une liste à puces ou numérotée", quote: "Une citation mise en valeur", code: "Un bloc de code affiché tel quel, coloré selon le langage choisi",
  image: "Une image avec son texte de remplacement et un lien possible", gallery: "Plusieurs images en grille, avec agrandissement", video: "Une vidéo YouTube, Vimeo ou un fichier", audio: "Un lecteur pour un fichier audio", button: "Un bouton d'appel à l'action", link: "Un lien texte",
  accordion: "Des questions qui se déplient (FAQ)", tabs: "Des onglets pour organiser un contenu", badge: "Une petite étiquette (nouveau, promo…)", timeline: "Des étapes sur une ligne du temps", progress: "Une barre de progression", menu: "Le menu de navigation du site", carousel: "Des images qui défilent", toggle: "Un titre qui déplie son contenu",
  alert: "Un message d'information, d'alerte ou de succès", counter: "Un nombre qui s'incrémente en arrivant à l'écran", testimonial: "Un témoignage avec son auteur", pricing: "Une offre tarifaire avec ses avantages et son bouton", breadcrumb: "Le fil d'Ariane de la page", social: "Des liens vers vos réseaux sociaux", sharebuttons: "Des boutons pour partager la page",
  modal: "Une fenêtre qui s'ouvre au clic, ou un panneau latéral (off-canvas) à gauche ou à droite", html: "Du HTML sécurisé (réservé aux administrateurs)", embed: "Un contenu d'un service accepté (YouTube, Facebook, Spotify…)", iconlist: "Une liste d'éléments avec des icônes", tooltip: "Une infobulle au survol", hotspot: "Une image avec des points d'intérêt cliquables",
  posts: "Les derniers articles du blog", courselist: "Les formations du catalogue", search: "Un champ de recherche dans le site", account: "Connexion ou compte du visiteur", dyntext: "Un texte rempli avec une donnée (prénom, page, site…)", table: "Un tableau de données", countdown: "Un compte à rebours jusqu'à une date",
  course: "Une formation du catalogue en carte", sitelogo: "Le logo du site", postcontent: "Le contenu de l'article affiché", catfilter: "Un filtre par catégorie", sitetitle: "Le nom du site", copyright: "La ligne de copyright avec l'année", addtocart: "Un bouton pour acheter ou ajouter une formation au panier", courserating: "Les avis et la note d'une formation",
  animatedheading: "Un titre dont un mot change ou s'écrit", flipbox: "Une boîte qui se retourne au survol", pricelist: "Une liste de prix avec descriptions", toc: "Une table des matières construite depuis les titres", readingprogress: "Une barre qui montre l'avancée de la lecture", signupform: "Un formulaire d'inscription du module Formulaires",
  map: "Une carte Google Maps à partir d'une adresse", imagebox: "Une image avec un titre et un texte", iconbox: "Une icône avec un titre et un texte", rating: "Une note en étoiles", menuanchor: "Une ancre pour les liens internes (#nom)", icon: "Une icône du site, seule, avec sa taille, sa couleur et un lien possible", profilecard: "La fiche d'une personne (photo, nom, rôle)",
  querylist: "Une liste dynamique de contenus (articles, pages, formations…)", postmeta: "Auteur, date, catégorie et lecture de l'article", postterms: "Les catégories et étiquettes de l'article", postnav: "Les liens vers l'article précédent et suivant", authorbox: "La présentation de l'auteur de l'article", archiveinfo: "Le titre et la description d'une archive", postcomments: "Les commentaires de l'article et leur formulaire",
  cmsmenu: "Un menu géré dans le CMS", minicart: "Une icône de panier avec le nombre d'articles",
};
// ---------- Widgets personnalisés (src/marketing/pages/widgets/*.js) ----------
// Chaque description (champs typés) devient un type d'élément ordinaire : validation, fiche de bibliothèque, contenu de
// départ, champs de l'inspecteur, liens comptés, versions. Voir docs/widgets-personnalises.md.
const CUSTOM_WIDGETS = {};
const emptyValue = (v) => v === undefined || v === null || v === "";
// Valide UN champ d'un widget personnalisé selon son type (aussi utilisé pour les sous-champs d'une liste)
function validateField(f, raw, where, h) {
  let v;
  if (f.kind === "text") v = line(raw === undefined ? f.default : raw, f.max || 200);
  else if (f.kind === "textarea") v = clean(raw === undefined ? f.default : raw, f.max || 1000);
  else if (f.kind === "number") { v = numberIn(f.min, f.max, { integer: f.integer === true })(raw); if (v === null) v = numberIn(f.min, f.max)(f.default); }
  else if (f.kind === "select") v = f.options.some((o) => o[0] === raw) ? raw : f.default !== undefined ? f.default : f.options[0][0];
  else if (f.kind === "bool") v = typeof raw === "boolean" ? raw : f.default === true;
  else if (f.kind === "link") v = h.linkUrl(raw, where);
  else if (f.kind === "image") v = raw ? h.imageUrl(raw, where) : "";
  else if (f.kind === "icon") v = h.iconNames.includes(String(raw || "")) ? String(raw) : h.iconNames.includes(String(f.default || "")) ? f.default : "";
  else if (f.kind === "color") v = color(raw) || "";
  else if (f.kind === "items") {
    const list = raw === undefined ? (f.default || []) : raw;
    if (!Array.isArray(list)) throw new Error(`${where} : une liste d'éléments est attendue.`);
    if (list.length > f.max) throw new Error(`${where} : ${f.max} élément(s) au plus.`);
    if (list.length < (f.min || 0)) throw new Error(`${where} : ${f.min} élément(s) au moins.`);
    v = list.map((it, i) => {
      if (!it || typeof it !== "object" || Array.isArray(it)) throw new Error(`${where} : l'élément ${i + 1} est invalide.`);
      return Object.fromEntries(f.fields.map((sf) => [sf.key, validateField(sf, it[sf.key], `${where}, élément ${i + 1} (${sf.label})`, h)]));
    });
  }
  if (f.required && (f.kind === "items" ? !v.length : emptyValue(v))) throw new Error(`${where} : obligatoire.`);
  return v === null ? "" : v;
}
function schemaProps(def) {
  return (p, at, h) => {
    const out = {};
    for (const f of def.schema) out[f.key] = validateField(f, p[f.key], `${at} (${def.label}, ${f.label})`, h);
    if (def.validate) def.validate(out, `${at} (${def.label})`, h); // règles qui portent sur l'ensemble des réglages (h : contexte de l'enregistrement, ex. organisation et site de la page)
    return out;
  };
}
// Enregistrement (au chargement ; les tests peuvent en enregistrer un à part)
function registerWidget(def) {
  require("./widgets").check(def, def && def.type);
  if (Object.hasOwn(NODE_TYPES, def.type)) throw new Error(`Widget personnalisé « ${def.type} » : ce type existe déjà.`);
  if (!WIDGET_GROUPS[def.group]) throw new Error(`Widget personnalisé « ${def.type} » : catégorie « ${def.group} » inconnue.`);
  if (def.requires && !WIDGET_PERMISSIONS[def.requires]) throw new Error(`Widget personnalisé « ${def.type} » : permission « ${def.requires} » inconnue.`);
  CUSTOM_WIDGETS[def.type] = def;
  NODE_TYPES[def.type] = { label: def.label, category: "marketing", custom: true, version: def.version, props: schemaProps(def) };
  WIDGETS[def.type] = [def.group, def.keywords, def.requires || undefined];
  if (paletteReady) PALETTE[def.type] = paletteEntry(def);
  return def;
}
// Contenu de départ : valeurs par défaut des champs (+ version)
let paletteReady = false;
const paletteEntry = (def) => ({ icon: def.icon, blank: () => ({ props: Object.fromEntries(def.schema.filter((f) => f.default !== undefined).map((f) => [f.key, Array.isArray(f.default) ? JSON.parse(JSON.stringify(f.default)) : f.default])), ...(def.version > 1 ? { v: def.version } : {}) }) });
// Permissions exigées par des widgets : libellé affiché sur le cadenas
const WIDGET_PERMISSIONS = { "pages.code": "réservé aux administrateurs (le HTML s'affiche sur le même domaine que les comptes des élèves)" };
const LOADED_WIDGETS = require("./widgets").load();
for (const def of LOADED_WIDGETS) registerWidget(def);
for (const type of Object.keys(NODE_TYPES)) if (!WIDGETS[type] || !WIDGET_GROUPS[WIDGETS[type][0]]) throw new Error(`Widget sans fiche de bibliothèque : ${type}`);
const widgetRequires = (type) => (WIDGETS[type] && WIDGETS[type][2]) || null;

// Widgets réservés : une personne sans la permission peut déplacer ou supprimer ceux qui existent, mais ni en ajouter, ni en
// modifier les réglages. before / after : listes de sections ; can(permission) → booléen. Lève une erreur sinon.
function lockedWidgetChanges(before, after, can) {
  const known = new Map();
  const collect = (sections, fn) => (sections || []).forEach((s) => { if (s && s.type === "layout") walk(s.children, fn); });
  collect(before, (n) => { if (widgetRequires(n.type)) known.set(String(n.id), JSON.stringify(n.props || {})); });
  let refused = null;
  collect(after, (n) => {
    const need = widgetRequires(n.type);
    if (refused || !need || can(need)) return;
    if (known.get(String(n.id)) !== JSON.stringify(n.props || {})) refused = n;
  });
  if (refused) {
    const err = new Error(`« ${NODE_TYPES[refused.type].label} » : ${WIDGET_PERMISSIONS[widgetRequires(refused.type)]}. Vous pouvez le déplacer ou le supprimer, mais pas l'ajouter ni le modifier.`);
    err.code = "forbidden_widget";
    throw err;
  }
}

const CATEGORIES = { structure: "Structure", text: "Texte", media: "Média", interaction: "Interaction", marketing: "Marketing", commerce: "Formations", dynamic: "Contenu dynamique", advanced: "Avancé" };

// Contenu de départ de chaque élément (toujours VALIDE : un élément ajouté s'enregistre tout de suite) et icône de la
// palette. Les éléments qui demandent une donnée réelle (image, vidéo, formation…) la demandent à l'ajout (`asks`).
const PALETTE = {
  // Un conteneur ajouté naît avec un écart de 20 px entre ses enfants (valeur courante des constructeurs de pages) ; les conteneurs existants gardent le leur
  container: { icon: "borderBox", blank: () => ({ children: [], styles: { desktop: { gap: "20px" } } }) },
  columns: { icon: "columns", blank: () => ({ children: [{ type: "column", children: [] }, { type: "column", children: [] }] }) },
  column: { icon: "moveVertical", blank: () => ({ children: [] }) },
  grid: { icon: "layout", blank: () => ({ children: [] }) },
  stack: { icon: "layers", blank: () => ({ children: [] }) },
  group: { icon: "copy", blank: () => ({ children: [] }) },
  spacer: { icon: "spacing", blank: () => ({ props: { size: "32" } }) },
  divider: { icon: "minus", blank: () => ({}) },
  heading: { icon: "type", blank: () => ({ props: { text: "Un titre clair et précis", level: "2" } }) },
  text: { icon: "alignLeft", blank: () => ({ props: { html: "<p>Votre texte. Double-cliquez pour l'écrire directement dans la page.</p>" } }) },
  list: { icon: "list", blank: () => ({ props: { items: ["Premier point", "Deuxième point"], ordered: false } }) },
  quote: { icon: "quote", blank: () => ({ props: { text: "Une phrase marquante.", author: "" } }) },
  code: { icon: "braces", blank: () => ({ props: { text: "Texte affiché tel quel" } }) },
  image: { icon: "image", asks: "image", blank: () => ({ props: {} }) },
  gallery: { icon: "columns", asks: "images", blank: () => ({ props: {} }) },
  video: { icon: "video", asks: "video", blank: () => ({ props: {} }) },
  audio: { icon: "play", asks: "audio", blank: () => ({ props: {} }) },
  button: { icon: "mousePointer", blank: () => ({ props: { label: "Découvrir", url: "/catalogue", variant: "primary" } }) },
  link: { icon: "link", blank: () => ({ props: { label: "En savoir plus", url: "/catalogue" } }) },
  accordion: { icon: "listChecks", blank: () => ({ props: { items: [{ q: "Votre question ?", a: "La réponse, claire et courte." }] } }) },
  tabs: { icon: "layers", blank: () => ({ props: { items: [{ title: "Onglet 1", text: "Contenu du premier onglet." }, { title: "Onglet 2", text: "Contenu du deuxième onglet." }] } }) },
  table: { icon: "listOrdered", blank: () => ({ props: { rows: [["Colonne 1", "Colonne 2"], ["Valeur", "Valeur"]], header: true } }) },
  countdown: { icon: "clock", blank: () => ({ props: { until: new Date(Date.now() + 7 * 86400000).toISOString().replace(/:\d{2}\.\d{3}Z$/, ":00Z"), endText: "C'est terminé." } }) },
  course: { icon: "graduation", asks: "course", blank: () => ({ props: {} }) },
  addtocart: { icon: "cart", asks: "course", blank: () => ({ props: {} }) },
  courserating: { icon: "star", asks: "course", blank: () => ({ props: {} }) },
  icon: { icon: "star", blank: () => ({ props: { name: "star", size: "32" } }) },
  map: { icon: "mapPin", asks: "map", blank: () => ({ props: {} }) },
  imagebox: { icon: "image", asks: "image", blank: () => ({ props: {} }) },
  iconbox: { icon: "star", blank: () => ({ props: { icon: "star", title: "Un atout clair", text: "Expliquez en une phrase ce que la personne y gagne." } }) },
  rating: { icon: "star", asks: "rating", blank: () => ({ props: {} }) },
  menuanchor: { icon: "link", asks: "anchor", blank: () => ({ props: {} }) },
  signupform: { icon: "fileText", asks: "form", blank: () => ({ props: {} }) },
  animatedheading: { icon: "type", blank: () => ({ props: { before: "Apprenez", words: ["Photoshop", "Illustrator", "Blender"], after: "à votre rythme", level: "2", effect: "fade", interval: 2500 } }) },
  flipbox: { icon: "copy", blank: () => ({ props: { icon: "star", frontTitle: "Un atout clair", frontText: "Survolez ou touchez pour en savoir plus.", backTitle: "Le détail", backText: "Expliquez ici ce que la personne y gagne.", effect: "flip", height: 280 } }) },
  pricelist: { icon: "listOrdered", blank: () => ({ props: { items: [{ title: "[Prestation]", price: "[Prix]", text: "" }] } }) },
  toc: { icon: "listOrdered", blank: () => ({ props: { title: "Sommaire", depth: "3", numbered: false } }) },
  readingprogress: { icon: "activity", blank: () => ({ props: { position: "top", thickness: 4 } }) },
  sitelogo: { icon: "image", blank: () => ({ props: { height: 48, link: true } }) },
  sitetitle: { icon: "type", blank: () => ({ props: { tag: "p", link: true } }) },
  postcontent: { icon: "fileText", blank: () => ({ props: {} }) },
  catfilter: { icon: "listChecks", blank: () => ({ props: { source: "posts", allLabel: "Toutes" } }) },
  copyright: { icon: "fileText", blank: () => ({ props: { owner: "", text: "Tous droits réservés." } }) },
  badge: { icon: "tag", blank: () => ({ props: { text: "Nouveau", tone: "primary" } }) },
  timeline: { icon: "history", blank: () => ({ props: { items: [{ date: "Étape 1", title: "Inscription", text: "Ce qui se passe à cette étape." }, { date: "Étape 2", title: "Premier module", text: "Ce qui se passe ensuite." }] } }) },
  progress: { icon: "activity", blank: () => ({ props: { label: "Progression", value: 60, showValue: true } }) },
  // Nouveau widget Menu : il affiche le menu AFFECTÉ à l'emplacement choisi (en-tête par défaut) — aucun lien de démonstration : le contenu vient d'Apparence → Menus
  menu: { icon: "menu", blank: () => ({ props: { label: "Navigation", source: "location", location: "header", items: [] } }) },
  carousel: { icon: "image", asks: "images", blank: () => ({ props: {} }) },
  toggle: { icon: "chevronDown", blank: () => ({ props: { title: "Afficher les détails", text: "Le contenu qui apparaît quand on ouvre.", open: false } }) },
  alert: { icon: "info", blank: () => ({ props: { tone: "info", title: "À savoir", text: "Une information importante pour la personne qui lit." } }) },
  counter: { icon: "barChart", blank: () => ({ props: { value: 0, label: "[ce que mesure ce nombre, et sa source]", suffix: "", prefix: "", duration: 1500 } }) },
  testimonial: { icon: "quote", blank: () => ({ props: { text: "[Le témoignage réel, avec l'accord de la personne.]", name: "[Prénom N.]", role: "", rating: 0 } }) },
  pricing: { icon: "tag", blank: () => ({ props: { title: "[Nom de l'offre]", price: "[prix réel]", period: "", features: ["[Ce qui est inclus]"], ctaLabel: "Choisir", ctaUrl: "/catalogue" } }) },
  breadcrumb: { icon: "chevronRight", blank: () => ({ props: { items: [{ label: "Accueil", url: "/" }, { label: "Cette page" }], separator: "chevron" } }) },
  sharebuttons: { icon: "share2", blank: () => ({ props: { networks: ["facebook", "x", "linkedin", "whatsapp"], size: "32", shape: "circle", label: "Partager cette page" } }) },
  social: { icon: "share2", blank: () => ({ props: { items: [{ network: "website", url: "/" }], size: "32", shape: "circle" } }) },
  html: { icon: "braces", blank: () => ({ props: { html: "<p>Votre <strong>HTML</strong> (balises de texte, listes, tableaux, images, SVG ; scripts et styles refusés).</p>" } }) },
  embed: { icon: "externalLink", asks: "embed", blank: () => ({ props: {} }) },
  iconlist: { icon: "listChecks", blank: () => ({ props: { items: [{ text: "Premier avantage", icon: "check" }, { text: "Deuxième avantage", icon: "check" }] } }) },
  tooltip: { icon: "help", blank: () => ({ props: { text: "Mot à expliquer", tip: "L'explication qui s'affiche au survol ou au focus.", position: "top" } }) },
  hotspot: { icon: "image", asks: "image", blank: () => ({ props: { spots: [] } }) },
  posts: { icon: "fileText", blank: () => ({ props: { count: 3, layout: "grid" } }) },
  courselist: { icon: "graduation", blank: () => ({ props: { count: 3 } }) },
  search: { icon: "search", blank: () => ({ props: { target: "catalogue" } }) },
  account: { icon: "user", blank: () => ({ props: { showCart: true } }) },
  dyntext: { icon: "type", blank: () => ({ props: { source: "firstName", before: "Bonjour ", after: " !", fallback: "à vous", tag: "p" } }) },
  modal: { icon: "layers", blank: () => ({ props: { buttonLabel: "En savoir plus", title: "Plus d'informations", text: "Le contenu de la fenêtre.", variant: "outline", size: "md" } }) },
};
// Contenu de départ des widgets personnalisés chargés plus haut (le registre PALETTE n'existait pas encore)
for (const def of LOADED_WIDGETS) PALETTE[def.type] = paletteEntry(def);
paletteReady = true;

// Libellés et contrôles des propriétés de style (inspecteur) : un contrôle = une propriété réelle de STYLE_PROPS
const STYLE_UI = {
  display: ["Affichage", { block: "Bloc", flex: "Flex", grid: "Grille", "inline-block": "Bloc en ligne", inline: "En ligne", "inline-flex": "Flex en ligne", none: "Caché" }],
  flexDirection: ["Direction", { row: "En ligne", column: "En colonne", "row-reverse": "Ligne inversée", "column-reverse": "Colonne inversée" }],
  flexWrap: ["Retour à la ligne", { wrap: "Oui", nowrap: "Non", "wrap-reverse": "Oui, inversé" }],
  justifyContent: ["Répartition", { "flex-start": "Début", center: "Centre", "flex-end": "Fin", "space-between": "Espacés", "space-around": "Autour", "space-evenly": "Égaux", start: "Début (grille)", end: "Fin (grille)", stretch: "Étirées (grille)" }],
  alignItems: ["Alignement des enfants", { stretch: "Étirés", "flex-start": "Début", center: "Centre", "flex-end": "Fin", baseline: "Ligne de base", start: "Début (grille)", end: "Fin (grille)" }],
  alignContent: ["Répartition des lignes", { stretch: "Étirées", "flex-start": "Début", center: "Centre", "flex-end": "Fin", "space-between": "Espacées", "space-around": "Autour", "space-evenly": "Égales", start: "Début (grille)", end: "Fin (grille)" }],
  alignSelf: ["Alignement dans le parent", { auto: "Auto", "flex-start": "Début", center: "Centre", "flex-end": "Fin", stretch: "Étiré", start: "Début (grille)", end: "Fin (grille)" }],
  justifySelf: ["Alignement horizontal dans la case", { auto: "Auto", start: "Début", center: "Centre", end: "Fin", stretch: "Étiré" }],
  order: ["Ordre d'affichage"],
  gridColumnStart: ["Colonne : début (ligne)"], gridColumnEnd: ["Colonne : fin (ligne)"], gridRowStart: ["Ligne : début (ligne)"], gridRowEnd: ["Ligne : fin (ligne)"],
  flexShrink: ["Rétrécissement (flex-shrink)"], flexBasis: ["Base de taille (flex-basis)"],
  gridTemplate: ["Largeurs des colonnes (ex. 2fr 1fr)"], gridRows: ["Lignes (grille)"], gridRowsTemplate: ["Hauteurs des lignes (ex. 200px 1fr)"], gridColumnSpan: ["Colonnes occupées"], gridRowSpan: ["Lignes occupées"],
  gap: ["Écart entre enfants"], rowGap: ["Écart entre lignes"], columnGap: ["Écart entre colonnes"], columns: ["Colonnes (grille)"],
  width: ["Largeur"], height: ["Hauteur"], flexGrow: ["Croissance (flex-grow)"], minWidth: ["Largeur min."], maxWidth: ["Largeur max."], minHeight: ["Hauteur min."], maxHeight: ["Hauteur max."],
  marginTop: ["Marge haut"], marginRight: ["Marge droite"], marginBottom: ["Marge bas"], marginLeft: ["Marge gauche"],
  paddingTop: ["Intérieur haut"], paddingRight: ["Intérieur droite"], paddingBottom: ["Intérieur bas"], paddingLeft: ["Intérieur gauche"],
  fontFamily: ["Police", { heading: "Titres du site", body: "Texte du site", system: "Système", serif: "Avec empattements", mono: "Chasse fixe" }],
  fontSize: ["Taille"], fontWeight: ["Graisse", { 300: "Légère", 400: "Normale", 500: "Moyenne", 600: "Demi-grasse", 700: "Grasse", 800: "Extra-grasse", 900: "Noire" }],
  fontStyle: ["Style", { normal: "Normal", italic: "Italique" }], lineHeight: ["Interligne"], lineClamp: ["Lignes maximum"], columnCount: ["Colonnes de texte"], textStrokeWidth: ["Contour du texte : épaisseur"], textStrokeColor: ["Contour du texte : couleur"], letterSpacing: ["Espacement des lettres"], wordSpacing: ["Espacement des mots"], textIndent: ["Retrait de première ligne"],
  textTransform: ["Casse", { none: "Normale", uppercase: "MAJUSCULES", lowercase: "minuscules", capitalize: "Première Lettre" }],
  textAlign: ["Alignement du texte", { left: "Gauche", center: "Centre", right: "Droite", justify: "Justifié" }],
  textShadow: ["Ombre du texte", { none: "Aucune", sm: "Légère", md: "Moyenne", lg: "Forte", glow: "Halo clair" }],
  textDecoration: ["Décoration", { none: "Aucune", underline: "Soulignée", "line-through": "Barrée" }],
  color: ["Couleur du texte"], backgroundColor: ["Couleur de fond"],
  borderWidth: ["Épaisseur de bordure"], borderStyle: ["Style de bordure", { none: "Aucune", solid: "Pleine", dashed: "Tirets", dotted: "Points", double: "Double", groove: "Gravée", ridge: "En relief", inset: "Creusée", outset: "Bombée" }], borderColor: ["Couleur de bordure"], borderRadius: ["Arrondi"],
  borderTopWidth: ["Épaisseur haut"], borderRightWidth: ["Épaisseur droite"], borderBottomWidth: ["Épaisseur bas"], borderLeftWidth: ["Épaisseur gauche"],
  borderTopLeftRadius: ["Arrondi haut gauche"], borderTopRightRadius: ["Arrondi haut droit"], borderBottomRightRadius: ["Arrondi bas droit"], borderBottomLeftRadius: ["Arrondi bas gauche"],
  backdropBlur: ["Flou de l'arrière-plan (px)"],
  direction: ["Sens d'écriture", { ltr: "De gauche à droite", rtl: "De droite à gauche" }], scrollMarginTop: ["Décalage d'ancre (lien #…)"],
  backgroundClip: ["Découpe du fond", { "border-box": "Jusqu'à la bordure", "padding-box": "Jusqu'au remplissage", "content-box": "Au contenu seulement", text: "Dans les lettres du texte" }],
  boxShadow: ["Ombre", { none: "Aucune", sm: "Légère", md: "Moyenne", lg: "Forte", xl: "Très forte" }], opacity: ["Opacité"],
  overflow: ["Débordement", { visible: "Visible", hidden: "Masqué", auto: "Défilement" }],
  overflowX: ["Débordement horizontal", { visible: "Visible", hidden: "Masqué", auto: "Auto", scroll: "Défilement", clip: "Coupé" }], overflowY: ["Débordement vertical", { visible: "Visible", hidden: "Masqué", auto: "Auto", scroll: "Défilement", clip: "Coupé" }],
  visibility: ["Visibilité (garde sa place)", { visible: "Visible", hidden: "Invisible" }],
  cursor: ["Curseur de la souris", { auto: "Automatique", default: "Flèche", pointer: "Main", text: "Texte", move: "Déplacer", grab: "Attraper", "not-allowed": "Interdit", help: "Aide", "zoom-in": "Zoom +", "zoom-out": "Zoom −" }],
  pointerEvents: ["Réaction à la souris", { auto: "Normale", none: "Aucune (traversée)" }],
  mixBlendMode: ["Fusion avec l'arrière-plan", { normal: "Normale", multiply: "Produit", screen: "Écran", overlay: "Incrustation", darken: "Assombrir", lighten: "Éclaircir", "color-dodge": "Densité couleur −", "color-burn": "Densité couleur +", "soft-light": "Lumière tamisée", "hard-light": "Lumière crue", difference: "Différence", exclusion: "Exclusion" }],
  whiteSpace: ["Retour à la ligne", { normal: "Normal", nowrap: "Jamais", pre: "Conserver les espaces", "pre-wrap": "Conserver + retour", "pre-line": "Conserver les sauts" }],
  textWrap: ["Équilibrage du texte", { wrap: "Normal", nowrap: "Sans retour", balance: "Équilibré (titres)", pretty: "Soigné (paragraphes)" }],
  overflowWrap: ["Mots trop longs", { normal: "Normal", "break-word": "Couper si besoin", anywhere: "Couper partout" }],
  textOverflow: ["Texte coupé (avec « Masqué » et « Jamais »)", { clip: "Net", ellipsis: "Points de suspension" }],
  outlineWidth: ["Contour : épaisseur"], outlineStyle: ["Contour : style", { none: "Aucun", solid: "Plein", dashed: "Tirets", dotted: "Points" }], outlineColor: ["Contour : couleur"], outlineOffset: ["Contour : décalage"],
  gridAutoRows: ["Lignes automatiques (ex. minmax(120px, auto))"], gridAutoColumns: ["Colonnes automatiques (ex. 1fr)"],
  gridAutoFlow: ["Remplissage", { row: "Ligne par ligne", column: "Colonne par colonne", "row dense": "Lignes, sans trous", "column dense": "Colonnes, sans trous" }],
  justifyItems: ["Alignement horizontal des cases", { stretch: "Étirer", start: "Début", center: "Centre", end: "Fin" }],
  position: ["Position", { static: "Normale", relative: "Relative", sticky: "Collante", absolute: "Absolue (dans le parent)", fixed: "Fixe (à l'écran)" }], top: ["Décalage haut"], right: ["Décalage droite"], bottom: ["Décalage bas"], left: ["Décalage gauche"],
  transformOrigin: ["Origine des transformations", { center: "Centre", top: "Haut", bottom: "Bas", left: "Gauche", right: "Droite", "top left": "Haut gauche", "top right": "Haut droit", "bottom left": "Bas gauche", "bottom right": "Bas droit" }],
  transitionDuration: ["Durée des transitions (ms)"], transitionEasing: ["Accélération des transitions", { ease: "Douce", linear: "Linéaire", "ease-in": "Départ lent", "ease-out": "Arrivée lente", "ease-in-out": "Départ et arrivée lents" }], zIndex: ["Plan (z-index)"],
  objectFit: ["Cadrage", { cover: "Remplir", contain: "Contenir", fill: "Étirer", none: "Taille réelle" }],
  objectPosition: ["Point focal", { center: "Centre", top: "Haut", bottom: "Bas", left: "Gauche", right: "Droite", "top left": "Haut gauche", "top right": "Haut droit", "bottom left": "Bas gauche", "bottom right": "Bas droit" }],
  aspectRatio: ["Proportions", { auto: "Libres", "1/1": "1:1", "4/3": "4:3", "3/2": "3:2", "16/9": "16:9", "21/9": "21:9", "3/4": "3:4" }],
  backgroundSize: ["Taille du fond", { cover: "Couvrir", contain: "Contenir", auto: "Réelle" }],
  backgroundRepeat: ["Répétition du fond", { "no-repeat": "Aucune", repeat: "Mosaïque", "repeat-x": "Horizontale", "repeat-y": "Verticale" }],
  backgroundAttachment: ["Défilement du fond", { scroll: "Avec la page", fixed: "Fixe (effet parallaxe)" }],
  backgroundPosition: ["Position du fond", { center: "Centre", top: "Haut", bottom: "Bas", left: "Gauche", right: "Droite", "top left": "Haut gauche", "top right": "Haut droit", "bottom left": "Bas gauche", "bottom right": "Bas droit" }],
};
const GROUP_LABELS = { layout: "Mise en page", size: "Dimensions", spacing: "Espacement", typography: "Typographie", color: "Couleurs", background: "Fond", border: "Bordure", effects: "Effets", position: "Position", media: "Image", mask: "Masque" };
// Description de l'éditeur (envoyée au navigateur) : types, palette, propriétés de style, écrans, états
function editorSpec() {
  const kind = (k) => {
    const p = STYLE_PROPS[k];
    if (p.check === color || [ "color", "backgroundColor", "borderColor" ].includes(k)) return "color";
    if (["columns", "columnCount", "lineHeight", "lineClamp", "opacity", "zIndex", "flexGrow", "flexShrink", "order", "gridRows", "gridColumnSpan", "gridRowSpan", "gridColumnStart", "gridColumnEnd", "gridRowStart", "gridRowEnd", "transitionDuration", "backdropBlur"].includes(k)) return "number";
    if (k === "gridTemplate" || k === "gridRowsTemplate" || k === "gridAutoRows" || k === "gridAutoColumns") return "text";
    return STYLE_UI[k] && STYLE_UI[k][1] ? "enum" : "length";
  };
  return {
    types: Object.entries(NODE_TYPES).map(([type, d]) => ({ type, label: d.label, category: d.category, group: WIDGETS[type][0], ...(partsLib.PARTS[type] ? { parts: partsLib.spec(type) } : {}), ...(SITE_SUB[type] ? { sub: SITE_SUB[type] } : {}), keywords: elementorNames.withAliases(type, WIDGETS[type][1]), description: (CUSTOM_WIDGETS[type] && CUSTOM_WIDGETS[type].description) || WIDGET_DESCRIPTIONS[type] || "", requires: widgetRequires(type), capabilities: capsOf(type), version: d.version || 1, ...(d.custom ? { schema: CUSTOM_WIDGETS[type].schema.map((f) => ({ ...f })), style: CUSTOM_WIDGETS[type].style || "text", ...(CUSTOM_WIDGETS[type].status ? { status: CUSTOM_WIDGETS[type].status } : {}), ...(CUSTOM_WIDGETS[type].dependencies ? { dependencies: CUSTOM_WIDGETS[type].dependencies } : {}), ...(CUSTOM_WIDGETS[type].motion ? { motion: STUDIO.widgetSpec(CUSTOM_WIDGETS[type].motion) } : {}) } : {}), container: Boolean(d.container), icon: PALETTE[type].icon, asks: PALETTE[type].asks || null, blank: PALETTE[type].blank() })),
    codeLanguages: Object.entries(require("./highlight").LABELS), categories: CATEGORIES, presetCategories: require("./stylePresets").CATEGORIES, widgetGroups: WIDGET_GROUPS, siteSubs: SITE_SUBS, scrollFx: Object.entries(SCROLL_FX).map(([key, r]) => ({ key, ...r })), scrollRange: Object.entries(SCROLL_RANGE).map(([key, r]) => ({ key, ...r })), scrollDirs: Object.entries(SCROLL_DIRS), mouseRange: Object.entries(MOUSE_RANGE).map(([key, r]) => ({ key, ...r })), mouseModes: Object.entries(MOUSE_MODES), maskShapes: Object.entries(MASK_SHAPES).map(([k, v]) => [k, v[0]]), shortcuts: WIDGET_SHORTCUTS.map((s) => ({ ...s, keywords: elementorNames.withAliases(s.key, s.keywords), pattern: s.provider ? EMBED_PROVIDERS.find((x) => x.key === s.provider).re.source : null })), widgetPermissions: WIDGET_PERMISSIONS, boxTags: BOX_TAGS,
    styleProps: Object.entries(STYLE_PROPS).map(([key, p]) => ({ key, css: p.css, group: p.group, label: STYLE_UI[key][0], kind: kind(key), options: STYLE_UI[key][1] ? Object.entries(STYLE_UI[key][1]).map(([v, l]) => [v, l]) : null })),
    ixTriggers: Object.entries(IX_TRIGGERS), ixActions: Object.entries(IX_ACTIONS), easings: Object.keys(EASINGS), embedProviders: EMBED_PROVIDERS.map((p) => p.label),
    shapeDividers: Object.entries(SHAPE_DIVIDERS), modalTriggers: Object.entries(MODAL_TRIGGERS), modalAnims: Object.entries(MODAL_ANIMS), modalSources: Object.entries(MODAL_SOURCES), socialNetworks: Object.entries(SOCIAL_NETWORKS), shareNetworks: Object.entries(SHARE_NETWORKS), audiences: Object.entries(AUDIENCES), entrances: Object.entries(ENTRANCES), animations: MOTION.catalog(), animationCategories: MOTION.CATEGORY_ORDER, motionCss: MOTION.allKeyframesCss(), motionTriggers: Object.entries(MOTION.TRIGGERS), motionEasings: Object.keys(EASINGS), hovers: Object.entries(HOVERS), groups: GROUP_LABELS, breakpoints: BREAKPOINTS.map(({ key, label }) => ({ key, label })), states: STATES.map(({ key, label }) => ({ key, label })),
    structureKinds: require("./structures").KINDS, structures: require("./structures").STRUCTURES,
    colorTokens: COLOR_TOKENS, lengthTokens: Object.fromEntries(Object.entries(lenTokens()).map(([f, m]) => [f, Object.entries(m).map(([k, v]) => ({ key: k, value: v }))])), spacingScale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 80, 96], icons: iconNames(),
    limits: { nodes: MAX_NODES, depth: MAX_DEPTH }, dynamic: dynamic.catalog(), motionStudio: STUDIO.editorSpec(),
  };
}

// Icônes disponibles (bibliothèque d'icônes du site, src/utils/icons.js)
let ICON_NAMES = null;
const iconNames = () => {
  if (!ICON_NAMES) { const icons = require("../../utils/icons"); ICON_NAMES = Object.keys(icons.ICONS); }
  return ICON_NAMES;
};

// Texte riche : liste blanche (balises, attributs, styles), liens vérifiés comme ceux des boutons
function sanitizeRich(input) {
  const html = sanitizeHtml(String(input || "").slice(0, 20000), {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "sup", "sub", "a", "ul", "ol", "li", "blockquote", "code", "mark", "h2", "h3", "h4", "h5", "h6", "span"],
    allowedAttributes: { a: ["href", "target", "rel"], p: ["style"], h2: ["style"], h3: ["style"], h4: ["style"], h5: ["style"], h6: ["style"], li: ["style"], span: ["style"], mark: [] },
    allowedStyles: { "*": { "text-align": [/^(left|center|right|justify)$/], color: [/^#[0-9a-f]{3,8}$/i], "background-color": [/^#[0-9a-f]{3,8}$/i], "padding-left": [/^\d{1,3}px$/] } },
    allowedSchemes: ["https"],
    allowProtocolRelative: false,
    transformTags: {
      a: (tag, attribs) => {
        const href = String(attribs.href || "");
        const ok = /^\/(?!\/)[^\s<>"'`\\]*$/.test(href) || /^https:\/\/[^\s<>"'`\\/@]+(\/[^\s<>"'`\\]*)?$/i.test(href);
        if (!ok) return { tagName: "span", attribs: {} };
        return { tagName: "a", attribs: { href, ...(attribs.target === "_blank" && href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {}) } };
      },
      b: "strong", i: "em",
    },
    exclusiveFilter: (frame) => frame.tag === "span" && !frame.attribs.style && !frame.text.trim(),
  }).trim();
  return html.replace(/^(<p>\s*<\/p>)+|(<p>\s*<\/p>)+$/g, "").trim();
}

// ---------- Personnalisation : à qui s'affiche une section ou un élément ----------
// Évaluée sur la page publique avec ce que le site sait RÉELLEMENT du visiteur : compte connecté, ou contact relié à
// son navigateur (mesure d'audience acceptée). Sans information, le visiteur est « inconnu ».
const AUDIENCES = {
  known: "Contacts connus", anonymous: "Visiteurs inconnus",
  subscribed: "Abonnés (consentement e-mail)", not_subscribed: "Non abonnés",
  customer: "Clients (au moins un achat)", not_customer: "Pas encore clients",
  student: "Élèves connectés", not_student: "Personnes non connectées",
  tag: "Contacts avec l'étiquette…", not_tag: "Contacts sans l'étiquette…",
  score_min: "Score au moins égal à…",
  has_cart: "Panier non vide", empty_cart: "Panier vide", instructor: "Formateur connecté", param: "Adresse contenant le paramètre…",
};
// Extension : une condition d'affichage ajoutée par un module (registerCondition) — libellé, valeur éventuelle (texte ou nombre),
// validation et test sur le visiteur. Les conditions fournies par KOLAKISA restent dans AUDIENCES / audienceMatches.
const CUSTOM_CONDITIONS = new Map();
function registerCondition(key, def) {
  if (!/^[a-z][a-z0-9_]{1,30}$/.test(key) || Object.hasOwn(AUDIENCES, key)) throw new Error(`Condition « ${key} » : nom invalide ou déjà pris.`);
  if (!def || !def.label || typeof def.match !== "function") throw new Error(`Condition « ${key} » : libellé et fonction match(valeur, visiteur) obligatoires.`);
  if (def.value !== undefined && !["text", "number"].includes(def.value)) throw new Error(`Condition « ${key} » : valeur « text » ou « number ».`);
  CUSTOM_CONDITIONS.set(key, def);
  AUDIENCES[key] = def.label;
}
function normalizeAudienceOne(raw, at) {
  if (!raw || typeof raw !== "object" || !raw.who) return undefined;
  if (!Object.hasOwn(AUDIENCES, raw.who)) throw new Error(`${at} : public d'affichage inconnu.`);
  if (CUSTOM_CONDITIONS.has(raw.who)) {
    const def = CUSTOM_CONDITIONS.get(raw.who);
    if (!def.value) return { who: raw.who };
    const v = def.value === "number" ? Number(raw.value) : line(raw.value, 100);
    if (def.value === "number" ? !Number.isFinite(v) : !v) throw new Error(`${at} : valeur de « ${def.label} » invalide.`);
    if (def.validate && !def.validate(v)) throw new Error(`${at} : valeur de « ${def.label} » refusée.`);
    return { who: raw.who, value: v };
  }
  if (raw.who === "tag" || raw.who === "not_tag") {
    const tag = line(raw.value, 60);
    if (!tag) throw new Error(`${at} : indiquez l'étiquette.`);
    return { who: raw.who, value: tag };
  }
  // Paramètre d'adresse : « clé » (présente) ou « clé=valeur » (ex. campagne=printemps)
  if (raw.who === "param") {
    const v = line(raw.value, 110);
    if (!/^[a-z0-9_-]{1,40}(=[A-Za-z0-9_.\-]{0,60})?$/i.test(v)) throw new Error(`${at} : paramètre invalide (« clé » ou « clé=valeur », lettres, chiffres, _ - .).`);
    return { who: raw.who, value: v };
  }
  if (raw.who === "score_min") {
    const n = Number(raw.value);
    if (!Number.isInteger(n) || n < 0 || n > 100000) throw new Error(`${at} : score minimal invalide (nombre entier positif).`);
    return { who: raw.who, value: n };
  }
  return { who: raw.who };
}
// Groupes de conditions (comme les conditions d'affichage d'Elementor) : la condition principale ET celles de « and » forment le premier groupe ;
// chaque groupe de « or » en est une alternative (ET entre ses conditions) ; l'élément s'affiche si UN groupe est satisfait.
function normalizeAudience(raw, at) {
  const first = normalizeAudienceOne(raw, at);
  if (!first) return undefined;
  const more = (list) => (Array.isArray(list) ? list : []).slice(0, 3).map((c) => normalizeAudienceOne(c, at)).filter(Boolean);
  const and = more(raw.and), or = (Array.isArray(raw.or) ? raw.or : []).slice(0, 3).map((g) => {
    const head = normalizeAudienceOne(g, at);
    if (!head) return null;
    const gand = more(g.and);
    return gand.length ? { ...head, and: gand } : head;
  }).filter(Boolean);
  return { ...first, ...(and.length ? { and } : {}), ...(or.length ? { or } : {}) };
}
// Le visiteur correspond-il ? visitor = { known, student, subscribed, customer, tags: Set, score }
function audienceMatches(audience, visitor) {
  if (!audience) return true;
  const group = (g) => audienceMatchesOne(g, visitor) && (g.and || []).every((c) => audienceMatchesOne(c, visitor));
  return group(audience) || (audience.or || []).some(group);
}
function audienceMatchesOne(audience, visitor) {
  if (!audience) return true;
  const v = visitor || { known: false, student: false, subscribed: false, customer: false, tags: new Set(), score: 0 };
  switch (audience.who) {
    case "known": return v.known;
    case "anonymous": return !v.known;
    case "subscribed": return v.subscribed;
    case "not_subscribed": return !v.subscribed;
    case "customer": return v.customer;
    case "not_customer": return !v.customer;
    case "student": return v.student;
    case "not_student": return !v.student;
    case "tag": return v.tags.has(String(audience.value).toLowerCase());
    case "not_tag": return !v.tags.has(String(audience.value).toLowerCase());
    case "score_min": return v.score >= audience.value;
    case "has_cart": return (v.cartCount || 0) > 0;
    case "empty_cart": return !(v.cartCount || 0);
    case "instructor": return v.role === "formateur";
    case "param": {
      const [key, ...rest] = String(audience.value).split("=");
      const got = v.query && Object.hasOwn(v.query, key) ? v.query[key] : undefined;
      return got !== undefined && (rest.length === 0 || got === rest.join("="));
    }
    default: {
      const custom = CUSTOM_CONDITIONS.get(audience.who);
      if (!custom) return true;
      try { return Boolean(custom.match(audience.value, v)); } catch { return false; } // une condition qui échoue ne montre rien
    }
  }
}
const audienceLabel = (a) => (a ? `${AUDIENCES[a.who]}${a.value !== undefined ? ` ${a.value}` : ""}`.replace("… ", " : ") : "");

// HTML saisi : liste blanche (aucun script, formulaire, cadre, style ni événement ; liens et images vérifiés). Le SVG
// est permis dans une forme sûre (formes, dégradés, sans lien ni objet étranger).
const SVG_TAGS = ["svg", "g", "path", "circle", "rect", "line", "polyline", "polygon", "ellipse", "title", "desc", "defs", "lineargradient", "radialgradient", "stop"];
const SVG_ATTRS = ["viewbox", "viewBox", "width", "height", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "d", "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "points", "transform", "opacity", "fill-rule", "clip-rule", "offset", "stop-color", "stop-opacity", "gradientTransform", "gradientUnits", "id", "xmlns", "role", "aria-label", "aria-hidden", "focusable", "preserveAspectRatio"];
function sanitizeHtmlBlock(input) {
  const tags = ["div", "span", "p", "br", "hr", "h2", "h3", "h4", "h5", "h6", "strong", "em", "b", "i", "u", "s", "small", "mark", "sub", "sup", "ul", "ol", "li", "dl", "dt", "dd", "blockquote", "q", "cite", "code", "pre", "kbd", "abbr", "figure", "figcaption", "img", "a", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption", "details", "summary", "section", "article", "aside", "header", "footer", "address", "time", ...SVG_TAGS];
  const common = ["class", "title", "role", "lang", "aria-*", "data-*"];
  const attrs = { "*": common, a: ["href", "target", "rel", ...common], img: ["src", "alt", "width", "height", "loading", ...common], td: ["colspan", "rowspan", ...common], th: ["colspan", "rowspan", "scope", ...common], time: ["datetime", ...common], ol: ["start", "reversed", ...common], details: ["open", ...common] };
  for (const t of SVG_TAGS) attrs[t] = SVG_ATTRS.concat(common);
  return sanitizeHtml(String(input || "").slice(0, 20000), {
    allowedTags: tags, allowedAttributes: attrs, allowedSchemes: ["https", "mailto"], allowedSchemesByTag: { img: ["https"] }, allowProtocolRelative: false,
    parser: { lowerCaseAttributeNames: false },
    transformTags: {
      a: (tag, a) => {
        const href = String(a.href || "");
        const ok = /^\/(?!\/)[^\s<>"'`\\]*$/.test(href) || /^https:\/\/[^\s<>"'`\\/@]+(\/[^\s<>"'`\\]*)?$/i.test(href) || /^#[a-z][a-z0-9-]{0,39}$/.test(href) || /^mailto:[^\s<>"'`\\]+$/.test(href);
        const keep = Object.fromEntries(Object.entries(a).filter(([k]) => k !== "href" && k !== "target" && k !== "rel"));
        return ok ? { tagName: "a", attribs: { ...keep, href, ...(a.target === "_blank" ? { target: "_blank", rel: "noopener noreferrer" } : {}) } } : { tagName: "span", attribs: keep };
      },
      img: (tag, a) => {
        const src = String(a.src || "");
        const ok = /^https:\/\/[^\s<>"'`\\/@]+\/[^\s<>"'`\\]*$/i.test(src) || /^\/uploads\/[^\s<>"'`\\]+$/.test(src);
        return ok ? { tagName: "img", attribs: { ...a, src, alt: a.alt || "", loading: "lazy" } } : { tagName: "span", attribs: {} };
      },
    },
  }).trim();
}
// Contenus intégrés : uniquement des services connus, dans un cadre isolé (jamais l'adresse saisie telle quelle)
const EMBED_PROVIDERS = [
  { key: "youtube", label: "YouTube", re: /^https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,20})/i, src: (m) => `https://www.youtube-nocookie.com/embed/${m[1]}`, ratio: "16/9" },
  { key: "vimeo", label: "Vimeo", re: /^https:\/\/(?:www\.|player\.)?vimeo\.com\/(?:video\/)?(\d{4,12})/i, src: (m) => `https://player.vimeo.com/video/${m[1]}`, ratio: "16/9" },
  { key: "maps", label: "Google Maps (lien « Intégrer une carte »)", re: /^https:\/\/www\.google\.com\/maps\/embed\?pb=([\w!.%:-]{10,2000})$/i, src: (m) => `https://www.google.com/maps/embed?pb=${m[1]}`, ratio: "4/3" },
  { key: "calendly", label: "Calendly", re: /^https:\/\/calendly\.com\/([\w-]{1,60}(?:\/[\w-]{1,80})?)\/?$/i, src: (m) => `https://calendly.com/${m[1]}?embed_type=Inline`, ratio: "3/4" },
  { key: "spotify", label: "Spotify", re: /^https:\/\/open\.spotify\.com\/(?:embed\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]{10,40})/i, src: (m) => `https://open.spotify.com/embed/${m[1]}/${m[2]}`, ratio: "spotify" },
  { key: "soundcloud", label: "SoundCloud", re: /^https:\/\/soundcloud\.com\/([\w-]{1,80}\/[\w-]{1,120})\/?$/i, src: (m) => `https://w.soundcloud.com/player/?url=${encodeURIComponent(`https://soundcloud.com/${m[1]}`)}`, ratio: "soundcloud" },
  { key: "gforms", label: "Google Forms", re: /^https:\/\/docs\.google\.com\/forms\/d\/e\/([\w-]{20,80})\/viewform/i, src: (m) => `https://docs.google.com/forms/d/e/${m[1]}/viewform?embedded=true`, ratio: "3/4" },
  { key: "typeform", label: "Typeform", re: /^https:\/\/([\w-]{1,40})\.typeform\.com\/to\/([A-Za-z0-9]{4,20})/i, src: (m) => `https://${m[1]}.typeform.com/to/${m[2]}`, ratio: "3/4" },
  { key: "loom", label: "Loom", re: /^https:\/\/(?:www\.)?loom\.com\/(?:share|embed)\/([a-f0-9]{20,40})/i, src: (m) => `https://www.loom.com/embed/${m[1]}`, ratio: "16/9" },
  { key: "youtubelist", label: "Playlist YouTube", re: /^https:\/\/(?:www\.)?youtube\.com\/playlist\?list=([\w-]{10,60})/i, src: (m) => `https://www.youtube-nocookie.com/embed/videoseries?list=${m[1]}`, ratio: "16/9" },
  // Facebook : modules officiels d'intégration (cadres, sans clé ni script) ; l'adresse est reconstruite, jamais copiée telle quelle
  { key: "facebookpage", label: "Page Facebook", re: /^https:\/\/(?:www\.)?facebook\.com\/([\w.-]{3,80})\/?$/i, src: (m) => `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(`https://www.facebook.com/${m[1]}`)}&tabs=timeline&width=500&height=600&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`, ratio: "5/6" },
  { key: "facebookpost", label: "Publication ou vidéo Facebook", re: /^https:\/\/(?:www\.)?facebook\.com\/([\w.-]{3,80})\/(posts|videos)\/([\w.-]{5,120})\/?$/i, src: (m) => `https://www.facebook.com/plugins/${m[2] === "videos" ? "video" : "post"}.php?href=${encodeURIComponent(`https://www.facebook.com/${m[1]}/${m[2]}/${m[3]}`)}&show_text=true&width=500`, ratio: "4/5" },
  { key: "instagram", label: "Instagram (publication ou reel)", re: /^https:\/\/www\.instagram\.com\/(p|reel|tv)\/([\w-]{5,30})\/?/i, src: (m) => `https://www.instagram.com/${m[1]}/${m[2]}/embed`, ratio: "4/5" },
  { key: "tiktok", label: "TikTok", re: /^https:\/\/www\.tiktok\.com\/@([\w.]{2,40})\/video\/(\d{10,25})/i, src: (m) => `https://www.tiktok.com/embed/v2/${m[2]}`, ratio: "9/16" },
  { key: "canva", label: "Canva (lien « Intégrer »)", re: /^https:\/\/www\.canva\.com\/design\/([\w-]{6,40})\/([\w-]{6,40})\/view/i, src: (m) => `https://www.canva.com/design/${m[1]}/${m[2]}/view?embed`, ratio: "16/9" },
];
function embedOf(url) {
  const u = String(url || "").trim();
  for (const p of EMBED_PROVIDERS) { const m = p.re.exec(u); if (m) return { provider: p.key, label: p.label, src: p.src(m), ratio: p.ratio }; }
  return null;
}

// Réseaux sociaux proposés (pictogrammes dessinés pour KOLAKISA, dans views/marketing-public/_social-icon.ejs)
const SHARE_NETWORKS = { facebook: "Facebook", x: "X (Twitter)", linkedin: "LinkedIn", whatsapp: "WhatsApp", telegram: "Telegram", pinterest: "Pinterest", reddit: "Reddit", threads: "Threads", email: "E-mail" };
const SOCIAL_NETWORKS = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", youtube: "YouTube", x: "X (Twitter)", tiktok: "TikTok", whatsapp: "WhatsApp", email: "E-mail", telegram: "Telegram", pinterest: "Pinterest", reddit: "Reddit", threads: "Threads", website: "Site web" };

// ---------- CSS personnalisé, classes, attributs ----------
// Sécurité : les pages sont servies sur le domaine des comptes des élèves. Le CSS saisi ne peut charger AUCUNE ressource
// (pas d'url(), d'@import, d'image-set, de police externe) : il ne peut donc ni faire appel à un autre site, ni lire ce
// que tape le visiteur. Pas d'échappements (\), pas de chevrons, pas de commentaires. Le CSS d'un élément ne contient que
// des déclarations, appliquées à cet élément seulement ; celui de la page est confiné au contenu de la page (.lp-main).
const CSS_BAD = /url\s*\(|image-set|@|\\|<|>|\/\*|\*\/|expression|javascript:|behavior|-moz-binding|[{}]/i;
function cssDeclarations(text, at, max = 2000) {
  const src = String(text ?? "").slice(0, max + 1);
  if (src.length > max) throw new Error(`${at} : CSS trop long (${max} caractères au plus).`);
  const out = [];
  for (const part of src.split(";")) {
    const decl = part.trim();
    if (!decl) continue;
    const m = /^(-{0,2}[a-z][a-z0-9-]{0,40})\s*:\s*([^;]{1,300})$/i.exec(decl);
    if (!m) throw new Error(`${at} : déclaration CSS invalide « ${decl.slice(0, 40)} » (forme attendue : propriété: valeur).`);
    if (CSS_BAD.test(m[2]) || CSS_BAD.test(m[1])) throw new Error(`${at} : « ${decl.slice(0, 40)} » n'est pas autorisé (aucune ressource externe, aucun @, \\, < ou >).`);
    out.push(`${m[1].toLowerCase()}:${m[2].trim().replace(/\s+/g, " ")}`);
  }
  return out.join(";");
}
// CSS de la page : des règles « sélecteurs { déclarations } », chaque sélecteur étant préfixé par .lp-main
function normalizePageCss(text) {
  const src = String(text ?? "").trim();
  if (!src) return "";
  if (src.length > 8000) throw new Error("CSS de la page : 8 000 caractères au plus.");
  if (/@|\\|<|>|\/\*/.test(src)) throw new Error("CSS de la page : @, \\, <, > et commentaires ne sont pas autorisés.");
  const rules = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m, used = 0;
  while ((m = re.exec(src))) {
    used += m[0].length;
    const sels = m[1].split(",").map((x) => x.trim()).filter(Boolean);
    if (!sels.length || sels.some((x) => !/^[a-z0-9 .#:_>+~*()\[\]="'-]{1,200}$/i.test(x) || /^(html|body|:root)\b/i.test(x))) throw new Error(`CSS de la page : sélecteur non autorisé « ${m[1].trim().slice(0, 50)} ».`);
    const decl = cssDeclarations(m[2], "CSS de la page");
    if (decl) rules.push(`${sels.map((x) => `.lp-main ${x}`).join(", ")}{${decl}}`);
  }
  if (src.replace(/\s+/g, "").length > 0 && used === 0) throw new Error("CSS de la page : écrivez des règles « .ma-classe { color: #0b2a40; } ».");
  return rules.join("\n");
}
const CLASS_RE = /^[a-z][a-z0-9_-]{0,40}$/i;
function normalizeClasses(v) {
  const list = [...new Set(String(v ?? "").trim().split(/\s+/).filter(Boolean))];
  if (list.length > 8) throw new Error("Classes : 8 au plus.");
  for (const c of list) if (!CLASS_RE.test(c) || /^(kw|lp|pb|mk)-/i.test(c)) throw new Error(`Classe « ${c} » invalide (lettres, chiffres, - et _ ; les préfixes kw-, lp-, pb-, mk- sont réservés).`);
  return list.join(" ");
}
// Attributs : data-*, aria-*, title, role, lang (jamais d'événement, de style, de lien ou de source)
const ATTR_RE = /^(data-[a-z0-9-]{1,40}|aria-[a-z]{2,30}|title|role|lang)$/;
function normalizeAttrs(list) {
  return (Array.isArray(list) ? list : []).slice(0, 10).map((a) => {
    const name = String(a && a.name || "").trim().toLowerCase();
    if (!name) return null;
    if (!ATTR_RE.test(name)) throw new Error(`Attribut « ${name.slice(0, 40)} » non autorisé (data-…, aria-…, title, role, lang).`);
    return { name, value: line(a.value, 200) };
  }).filter(Boolean);
}

// ---------- Interactions : déclencheur → action sur un élément de la page ----------
const IX_TRIGGERS = { click: "Au clic", hover: "Au survol", viewport: "En arrivant à l'écran", load: "Au chargement de la page" };
const IX_ACTIONS = { show: "Afficher l'élément", hide: "Masquer l'élément", toggle: "Afficher / masquer l'élément", scroll: "Faire défiler jusqu'à l'élément", open: "Ouvrir la fenêtre (élément « Fenêtre »)", animate: "Rejouer l'animation de l'élément" };
function normalizeInteractions(list) {
  return (Array.isArray(list) ? list : []).slice(0, 6).map((x) => {
    if (!x || !Object.hasOwn(IX_TRIGGERS, x.trigger) || !Object.hasOwn(IX_ACTIONS, x.action) || !NODE_ID.test(String(x.target || ""))) return null;
    return { trigger: x.trigger, action: x.action, target: String(x.target) };
  }).filter(Boolean);
}
// Programmation : visible seulement entre deux dates (heure du serveur, évaluée à chaque affichage)
function normalizeSchedule(raw, at) {
  if (!raw || typeof raw !== "object") return undefined;
  const d = (v) => { if (!v) return null; const t = Date.parse(String(v)); return Number.isFinite(t) ? new Date(t).toISOString() : NaN; };
  const from = d(raw.from), until = d(raw.until);
  if (Number.isNaN(from) || Number.isNaN(until)) throw new Error(`${at} : date de programmation invalide.`);
  if (from && until && from >= until) throw new Error(`${at} : la fin de la programmation doit suivre le début.`);
  // Jours de la semaine (1 = lundi … 7 = dimanche) et plage horaire de la journée, en heure de Paris (comme « Day of the week » / « Time of day » d'Elementor, mais sur l'heure du site)
  const days = [...new Set((Array.isArray(raw.days) ? raw.days : []).map(Number).filter((x) => Number.isInteger(x) && x >= 1 && x <= 7))].sort((a, b) => a - b);
  const hm = (v) => (/^([01]\d|2[0-3]):[0-5]\d$/.test(String(v || "")) ? String(v) : null);
  const hours = raw.hours && typeof raw.hours === "object" ? { from: hm(raw.hours.from), to: hm(raw.hours.to) } : null;
  if (hours && (hours.from === null) !== (hours.to === null)) throw new Error(`${at} : plage horaire incomplète (début et fin attendus, au format HH:MM).`);
  if (hours && hours.from && hours.from === hours.to) throw new Error(`${at} : la plage horaire doit avoir une durée.`);
  const out = { ...(from ? { from } : {}), ...(until ? { until } : {}), ...(days.length && days.length < 7 ? { days } : {}), ...(hours && hours.from ? { hours } : {}) };
  return Object.keys(out).length ? out : undefined;
}
// Jour (1–7) et minutes écoulées depuis minuit à Paris
const parisClock = (now) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(now)).map((x) => [x.type, x.value]));
  return { day: { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[p.weekday], minutes: Number(p.hour) * 60 + Number(p.minute) };
};
const scheduleMatches = (s, now = Date.now()) => {
  if (!s) return true;
  if ((s.from && Date.parse(s.from) > now) || (s.until && Date.parse(s.until) <= now)) return false;
  if (s.days || s.hours) {
    const c = parisClock(now);
    if (s.days && !s.days.includes(c.day)) return false;
    if (s.hours) {
      const [fh, fm] = s.hours.from.split(":").map(Number), [th, tm] = s.hours.to.split(":").map(Number), a = fh * 60 + fm, b = th * 60 + tm;
      if (!(a < b ? c.minutes >= a && c.minutes < b : c.minutes >= a || c.minutes < b)) return false; // une plage qui passe minuit (22:00 → 06:00) est permise
    }
  }
  return true;
};

// ---------- Animations : entrée (à l'apparition à l'écran) et effet au survol ----------
// Registre central des animations : src/marketing/pages/motion.js (une animation = une ligne ; le panneau, la validation, le CSS publié et l'aperçu le lisent)
const MOTION = require("./motion");
const STUDIO = require("./motionStudio");
const { ANIMATIONS, EASINGS } = MOTION;
const ENTRANCES = Object.fromEntries(Object.values(ANIMATIONS).map((a) => [a.id, a.label]));
// Capacités « avancées » d'un élément : elles décident des sections proposées dans l'inspecteur (effets de défilement, de
// souris, épinglage, transformation, masque, attributs, CSS) et de ce que le serveur accepte d'enregistrer.
const CAP_BOX = ["container", "grid", "stack", "group", "columns", "column"];
const CAP_MASK = ["image", "gallery", "video", "imagebox", "hotspot"];
const CAP_NONE = ["spacer", "modal"];
const CAP_BASE = ["motion", "scroll", "mouse", "transform", "attrs", "css", "responsive"];
function capsOf(type) {
  if (CAP_NONE.includes(type)) return ["attrs", "css", "responsive"];
  const caps = CAP_BASE.slice();
  if (CAP_BOX.includes(type)) caps.splice(caps.indexOf("transform"), 0, "sticky");
  if (CAP_MASK.includes(type)) caps.splice(caps.indexOf("attrs"), 0, "mask");
  return caps;
}
// Formes de découpe (masque) : tracés CSS « clip-path », sans fichier à charger
// Ouverture automatique d'une fenêtre : déclencheur, délai (s), seuil de défilement (%), fréquence, fermeture automatique (s), fermeture verrouillée
const MODAL_TRIGGERS = { load: "Au chargement de la page", scroll: "Après un défilement", exit: "Quand le visiteur s'apprête à quitter la page", idle: "Après un temps d'inactivité", clicks: "Après un nombre de clics sur la page", scrollup: "Quand le visiteur remonte dans la page", element: "Quand un élément de la page (ancre) devient visible" };
// Animations d'entrée / de sortie de la fenêtre (Elementor : Entrance / Exit Animation) ; absentes = comportement historique
const MODAL_ANIMS = { none: "Aucune", fade: "Fondu", zoom: "Zoom", "slide-up": "Glisse depuis le bas", "slide-down": "Glisse depuis le haut" };
const MODAL_SOURCES = { direct: "Visiteur arrivé directement (sans site d'origine)", search: "Visiteur venu d'un moteur de recherche", social: "Visiteur venu d'un réseau social", other: "Visiteur venu d'un autre site" };
function modalAuto(p) {
  const auto = oneOf(...Object.keys(MODAL_TRIGGERS))(p.auto);
  if (!auto) return {};
  const out = { auto };
  if (auto === "load" || auto === "idle") out.delay = numberIn(1, 600, { integer: true })(p.delay) || (auto === "idle" ? 20 : 5);
  if (auto === "clicks") out.clicks = numberIn(1, 50, { integer: true })(p.clicks) || 3;
  if (auto === "scroll") out.scrollAt = numberIn(5, 95, { integer: true })(p.scrollAt) || 50;
  if (auto === "element") {
    const target = String(p.target || "").replace(/^#/, "");
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test(target)) throw new Error("fenêtre : le déclencheur « élément visible » demande le nom d'une ancre (lettres, chiffres, tirets ; ex. tarifs).");
    out.target = target;
  }
  out.freq = oneOf("always", "session", "once")(p.freq) || "session";
  const close = numberIn(1, 600, { integer: true })(p.autoClose);
  if (close) out.autoClose = close;
  if (p.lock === true) out.lock = true;
  // Règles d'affichage : nombre minimum de pages vues pendant la visite, provenance du visiteur
  const views = numberIn(2, 20, { integer: true })(p.minViews);
  if (views) out.minViews = views;
  const source = oneOf(...Object.keys(MODAL_SOURCES))(p.source);
  if (source) out.source = source;
  // Période d'affichage (dates incluses) et bouton « Ne plus afficher »
  const day = (v) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v || "")); if (!m) return null; const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])); return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? String(v) : null; };
  const from = day(p.startDate), until = day(p.endDate);
  if (from) out.startDate = from;
  if (until) out.endDate = until;
  if (from && until && from > until) throw new Error("fenêtre : la date de fin doit suivre la date de début.");
  if (p.dismissBtn === true) out.dismissBtn = true;
  return out;
}
// Apparence de la fenêtre, valable pour toutes les fenêtres (ouverture au clic comprise) : animations, superposition (couleur, flou), défilement de la page
function modalLook(p) {
  const out = {};
  const inA = oneOf(...Object.keys(MODAL_ANIMS))(p.animIn), outA = oneOf(...Object.keys(MODAL_ANIMS))(p.animOut);
  if (inA && inA !== "none") out.animIn = inA;
  if (outA && outA !== "none") out.animOut = outA;
  if (p.overlayColor !== undefined && p.overlayColor !== "") { const c = color(String(p.overlayColor)); if (!c) throw new Error("fenêtre : couleur de superposition invalide."); out.overlayColor = c; }
  const blur = numberIn(0, 20, { integer: true })(p.overlayBlur);
  if (blur) out.overlayBlur = blur;
  if (p.noScroll === true) out.noScroll = true;
  return out;
}
const MASK_SHAPES = {
  circle: ["Cercle", "circle(50% at 50% 50%)"], ellipse: ["Ellipse", "ellipse(50% 38% at 50% 50%)"], triangle: ["Triangle", "polygon(50% 0%, 100% 100%, 0% 100%)"],
  diamond: ["Losange", "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"], pentagon: ["Pentagone", "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)"],
  hexagon: ["Hexagone", "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)"],
  octagon: ["Octogone", "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)"],
  star: ["Étoile", "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"],
  // Formes organiques (comme « Fleur », « Croquis » et « Blob » d'Elementor) : polygones calculés, valeurs en % (s'adaptent à la taille de l'élément)
  flower: ["Fleur", "polygon(100% 50%, 95% 55%, 84% 58%, 76% 59%, 74% 62%, 80% 69%, 86% 78%, 85% 85%, 78% 86%, 69% 80%, 62% 74%, 59% 76%, 58% 84%, 55% 95%, 50% 100%, 45% 95%, 42% 84%, 41% 76%, 38% 74%, 31% 80%, 22% 86%, 15% 85%, 14% 78%, 20% 69%, 26% 62%, 24% 59%, 16% 58%, 5% 55%, 0% 50%, 5% 45%, 16% 42%, 24% 41%, 26% 38%, 20% 31%, 14% 22%, 15% 15%, 22% 14%, 31% 20%, 38% 26%, 41% 24%, 42% 16%, 45% 5%, 50% 0%, 55% 5%, 58% 16%, 59% 24%, 62% 26%, 69% 20%, 78% 14%, 85% 15%, 86% 22%, 80% 31%, 74% 38%, 76% 41%, 84% 42%, 95% 45%)"],
  blob: ["Blob", "polygon(96% 50%, 95% 56%, 93% 61%, 90% 67%, 87% 72%, 85% 77%, 81% 81%, 77% 85%, 71% 87%, 66% 88%, 60% 87%, 55% 86%, 50% 86%, 45% 86%, 40% 87%, 34% 89%, 27% 89%, 21% 88%, 15% 85%, 12% 79%, 10% 73%, 10% 66%, 11% 60%, 12% 55%, 12% 50%, 12% 45%, 12% 40%, 13% 35%, 15% 30%, 18% 25%, 22% 22%, 26% 18%, 29% 14%, 34% 10%, 38% 6%, 44% 3%, 50% 2%, 56% 3%, 62% 6%, 66% 11%, 69% 17%, 72% 22%, 75% 25%, 78% 28%, 83% 31%, 88% 34%, 92% 39%, 95% 44%)"],
  sketch: ["Croquis", "polygon(91% 50%, 93% 56%, 96% 64%, 91% 69%, 83% 71%, 78% 74%, 77% 81%, 76% 90%, 68% 91%, 62% 90%, 56% 90%, 50% 90%, 44% 89%, 38% 92%, 31% 93%, 25% 90%, 23% 81%, 21% 75%, 15% 72%, 9% 69%, 5% 63%, 8% 56%, 5% 50%, 9% 44%, 14% 40%, 15% 34%, 11% 25%, 12% 17%, 22% 18%, 29% 18%, 33% 13%, 38% 9%, 44% 6%, 50% 7%, 56% 6%, 62% 9%, 66% 15%, 70% 18%, 79% 16%, 87% 18%, 88% 26%, 86% 34%, 90% 38%, 92% 44%)"],
};
// Séparateurs de forme (Elementor : « Shape Divider ») : formes dessinées en CSS (clip-path en %), liste fermée
const SHAPE_DIVIDERS = { wave: "Vague", curve: "Courbe", triangle: "Triangle", tilt: "Incliné", slope: "Pente", arrow: "Flèche", zigzag: "Zigzag" };
const HOVERS = {
  grow: "Grossit", shrink: "Rétrécit", lift: "Se soulève", tilt: "S'incline",
  // Animations de survol d'Elementor (liste officielle : /help/hover-animations/), en CSS pur, désactivées si « réduire les animations »
  float: "Flotte vers le haut", sink: "S'enfonce", rotate: "Pivote", skew: "Se penche", push: "Appuie", pop: "Surgit", pulse: "Pulse", bounce: "Rebondit", bob: "Flotte (va-et-vient)", hang: "Se balance (suspendu)", wobble: "Vacille", buzz: "Vibre",
};
// Effets au DÉFILEMENT : chaque effet a une amplitude appliquée selon la position de l'élément dans la fenêtre (p = -1 quand
// il entre par le bas, 0 au centre, +1 quand il sort par le haut). Valeurs entières bornées ; zéro = pas d'effet.
const SCROLL_FX = {
  y: { label: "Décalage vertical", min: -200, max: 200, unit: "px" }, x: { label: "Décalage horizontal", min: -200, max: 200, unit: "px" },
  opacity: { label: "Transparence aux bords", min: 0, max: 100, unit: "%" }, blur: { label: "Flou aux bords", min: 0, max: 20, unit: "px" },
  scale: { label: "Échelle", min: -50, max: 50, unit: "%" }, rotate: { label: "Rotation", min: -180, max: 180, unit: "°" },
};
const MOUSE_MODES = { track: "Suit le curseur", tilt: "Inclinaison 3D" };
// Défilement « de → à » (scrollFx) : chaque effet va d'une valeur de départ à une valeur d'arrivée pendant que l'élément traverse la fenêtre
// (plage start–end en %, sens, inversion). Bornes : valeurs réelles uniquement, jamais de CSS libre.
const SCROLL_RANGE = {
  translateY: { label: "Déplacement vertical", min: -2000, max: 2000, unit: "px", step: 1, def: [0, 100] },
  translateX: { label: "Déplacement horizontal", min: -2000, max: 2000, unit: "px", step: 1, def: [0, 100] },
  rotate: { label: "Rotation", min: -360, max: 360, unit: "°", step: 1, def: [0, 45] },
  rotateX: { label: "Rotation 3D (perspective)", min: -180, max: 180, unit: "°", step: 1, def: [45, 0] },
  scale: { label: "Échelle", min: 0.1, max: 3, unit: "×", step: 0.01, def: [1, 1.2] },
  opacity: { label: "Opacité", min: 0, max: 1, unit: "", step: 0.01, def: [0, 1] },
  blur: { label: "Flou", min: 0, max: 50, unit: "px", step: 0.5, def: [10, 0] },
};
const SCROLL_DIRS = { both: "Dans les deux sens", down: "Vers le bas seulement", up: "Vers le haut seulement" };
// Souris « amplitudes » (mouseFx) : déplacement, rotation 3D, échelle et lissage ; amplitude atteinte quand le curseur est au bord de la fenêtre
const MOUSE_RANGE = {
  translateX: { label: "Déplacement horizontal", min: -300, max: 300, unit: "px", step: 1 },
  translateY: { label: "Déplacement vertical", min: -300, max: 300, unit: "px", step: 1 },
  rotateX: { label: "Rotation X", min: -60, max: 60, unit: "°", step: 1 },
  rotateY: { label: "Rotation Y", min: -60, max: 60, unit: "°", step: 1 },
  rotateZ: { label: "Rotation Z", min: -60, max: 60, unit: "°", step: 1 },
  scale: { label: "Échelle", min: -50, max: 100, unit: "%", step: 1 },
};
function normalizeMotion(raw, type) {
  if (!raw || typeof raw !== "object") return undefined;
  const out = {};
  // Défilement et souris : seulement pour les types qui en ont la capacité (voir CAPABILITIES) ; le reste est ignoré sans erreur
  if (capsOf(type).includes("scroll") && raw.scroll && typeof raw.scroll === "object") {
    const sc = {};
    for (const [k, r] of Object.entries(SCROLL_FX)) { const n = numberIn(r.min, r.max, { integer: true })(raw.scroll[k]); if (n) sc[k] = n; }
    if (Object.keys(sc).length) out.scroll = sc;
  }
  if (capsOf(type).includes("mouse") && raw.mouse && typeof raw.mouse === "object" && Object.hasOwn(MOUSE_MODES, raw.mouse.mode)) {
    const strength = numberIn(1, 100, { integer: true })(raw.mouse.strength);
    out.mouse = { mode: raw.mouse.mode, strength: strength === null ? 30 : strength, ...(raw.mouse.mode === "track" && raw.mouse.invert === true ? { invert: true } : {}) };
  }
  // L'inclinaison à la souris et la rotation au défilement utilisent la même propriété CSS « rotate » : l'inclinaison l'emporte
  if (out.mouse && out.mouse.mode === "tilt" && out.scroll && out.scroll.rotate) { delete out.scroll.rotate; if (!Object.keys(out.scroll).length) delete out.scroll; }
  if (capsOf(type).includes("scroll") && raw.scrollFx && typeof raw.scrollFx === "object") {
    const sfx = {};
    for (const [k, r] of Object.entries(SCROLL_RANGE)) {
      const v = raw.scrollFx[k];
      if (!v || typeof v !== "object") continue;
      const from = numberIn(r.min, r.max)(v.from), to = numberIn(r.min, r.max)(v.to);
      if (from !== null && to !== null && from !== to) sfx[k] = { from, to };
    }
    if (Object.keys(sfx).length) {
      const start = numberIn(0, 99, { integer: true })(raw.scrollFx.start), end = numberIn(1, 100, { integer: true })(raw.scrollFx.end);
      if (start !== null && end !== null && start < end) { if (start !== 0) sfx.start = start; if (end !== 100) sfx.end = end; }
      if (Object.hasOwn(SCROLL_DIRS, raw.scrollFx.dir) && raw.scrollFx.dir !== "both") sfx.dir = raw.scrollFx.dir;
      if (raw.scrollFx.invert === true) sfx.invert = true;
      const pers = numberIn(200, 3000, { integer: true })(raw.scrollFx.perspective);
      if (sfx.rotateX && pers !== null && pers !== 1000) sfx.perspective = pers;
      out.scrollFx = sfx;
    }
  }
  if (capsOf(type).includes("mouse") && raw.mouseFx && typeof raw.mouseFx === "object") {
    const mfx = {};
    for (const [k, r] of Object.entries(MOUSE_RANGE)) { const n = numberIn(r.min, r.max)(raw.mouseFx[k]); if (n) mfx[k] = n; }
    if (Object.keys(mfx).length) {
      const pers = numberIn(200, 3000, { integer: true })(raw.mouseFx.perspective);
      if ((mfx.rotateX || mfx.rotateY) && pers !== null && pers !== 1000) mfx.perspective = pers;
      const speed = numberIn(2, 100, { integer: true })(raw.mouseFx.speed);
      if (speed !== null && speed !== 18) mfx.speed = speed;
      out.mouseFx = mfx;
    }
  }
  // Écrans où les effets de défilement et de souris sont COUPÉS (indépendant par écran)
  if ((out.scroll || out.mouse || out.scrollFx || out.mouseFx) && Array.isArray(raw.off)) {
    const off = BREAKPOINTS.map((b) => b.key).filter((k) => raw.off.includes(k));
    if (off.length && !["desktop", "tablet", "mobile"].every((k) => off.includes(k))) out.off = off; // « ordinateur » couvre aussi le grand écran
  }
  if (Object.hasOwn(ENTRANCES, raw.entrance)) {
    out.entrance = raw.entrance;
    out.duration = numberIn(100, 10000, { integer: true })(raw.duration) ?? 600;
    out.delay = numberIn(0, 10000, { integer: true })(raw.delay) ?? 0;
    const ease = raw.easing === undefined || raw.easing === "" ? null : MOTION.normalizeEasing(raw.easing);
    if (ease && ease !== "smooth") out.easing = ease;
    if (raw.repeat === true) out.repeat = true; // rejouée à chaque arrivée à l'écran (« Jouer une seule fois » décoché)
    // Répétition : 1 par défaut (jamais infinie sans demande explicite) ; direction ; déclencheur
    const it = raw.iterations === "infinite" ? "infinite" : numberIn(1, 3, { integer: true })(raw.iterations);
    if (it && it !== 1) out.iterations = it;
    if (MOTION.DIRECTIONS.includes(raw.direction) && raw.direction !== "normal") out.direction = raw.direction;
    if (Object.hasOwn(MOTION.TRIGGERS, raw.trigger) && raw.trigger !== "viewport") out.trigger = raw.trigger;
    // Écrans : « none » coupe l'animation, un identifiant la remplace ; vide = hérite de l'écran plus grand
    if (raw.screens && typeof raw.screens === "object") {
      const sc = {};
      for (const bp of ["tablet", "mobile"]) { const v = raw.screens[bp]; if (v === "none" || (typeof v === "string" && Object.hasOwn(ENTRANCES, v))) sc[bp] = v; }
      if (Object.keys(sc).length) out.screens = sc;
    }
  }
  // Mouvement réduit : l'animation s'adapte (ou disparaît) quand le visiteur le demande ; « toujours animer » doit être choisi explicitement
  if (raw.alwaysMotion === true && (out.entrance || out.scroll || out.mouse || out.scrollFx || out.mouseFx)) out.alwaysMotion = true;
  if (Object.hasOwn(HOVERS, raw.hover)) out.hover = raw.hover;
  // Parallaxe d'arrière-plan : amplitude (en %) du déplacement de l'image de fond ; valeur hors liste ignorée
  if ([10, 20, 35, 50].includes(raw.bgParallax)) out.bgParallax = raw.bgParallax;
  // Motion Studio : réglages versionnés (motionStudio.js) ; préréglages et paramètres validés par la fiche `motion` du widget
  if (raw.studio) { const st = STUDIO.normalize(raw.studio, CUSTOM_WIDGETS[type] ? CUSTOM_WIDGETS[type].motion : null); if (st) out.studio = st; }
  return Object.keys(out).length ? out : undefined;
}

// ---------- Normalisation d'un arbre ----------
// Premier élément cliquable (ou pouvant contenir un lien) à l'intérieur de ces enfants, nom lisible ; "" s'il n'y en a pas
function firstInteractive(children) {
  for (const c of children || []) {
    if (!c || !c.type) continue;
    if (INTERACTIVE_INSIDE_LINK.has(c.type) || (c.props && c.props.link)) return (NODE_TYPES[c.type] && NODE_TYPES[c.type].label) || c.type;
    const deeper = firstInteractive(c.children);
    if (deeper) return deeper;
  }
  return "";
}
function normalizeNode(raw, at, h, depth, counter) {
  if (!raw || typeof raw !== "object") throw new Error(`${at} : élément invalide.`);
  const def = Object.hasOwn(NODE_TYPES, raw.type) ? NODE_TYPES[raw.type] : null;
  if (!def) throw new Error(`${at} : type d'élément inconnu.`);
  if (depth > MAX_DEPTH) throw new Error(`${at} : trop de niveaux imbriqués (${MAX_DEPTH} au plus).`);
  if (++counter.n > MAX_NODES) throw new Error(`Trop d'éléments sur la page (${MAX_NODES} au plus).`);
  const id = raw.id === undefined ? newNodeId() : String(raw.id);
  if (!NODE_ID.test(id)) throw new Error(`${at} : identifiant d'élément invalide.`);
  if (counter.ids.has(id)) throw new Error(`${at} : deux éléments portent le même identifiant.`);
  counter.ids.add(id);
  const label = raw.name && line(raw.name, 60) ? line(raw.name, 60) : null;
  const where = `${at} « ${label || def.label} »`;
  // Widget personnalisé d'une version plus ancienne : ses réglages sont mis à niveau (migrate[v]) avant validation
  let rawProps = raw.props && typeof raw.props === "object" ? raw.props : {};
  const cw = def.custom ? CUSTOM_WIDGETS[raw.type] : null;
  if (cw && cw.version > 1) for (let v = Number.isInteger(raw.v) && raw.v >= 1 ? raw.v : 1; v < cw.version; v++) rawProps = cw.migrate[v + 1]({ ...rawProps });
  const node = { id, type: raw.type, props: def.props(rawProps, where, dynamicHelpers(h)) };
  if (cw && cw.version > 1) node.v = cw.version;
  if (label) node.name = label;
  // Note privée de l'équipe (jamais écrite dans la page publique)
  const note = clean(raw.note, 500);
  if (note) node.note = note;
  if (raw.hidden === true) node.hidden = true;
  if (raw.locked === true) node.locked = true;
  // Ancre : identifiant HTML pour les liens internes (« /p/ma-page#tarifs »), unique dans la page
  if (raw.anchor) {
    const anchor = String(raw.anchor).trim().toLowerCase();
    if (!ANCHOR.test(anchor)) throw new Error(`${where} : ancre invalide (lettres minuscules, chiffres et tirets, commence par une lettre).`);
    if (RESERVED_ANCHORS.has(anchor) || anchor.startsWith("kw-") || anchor.startsWith("lp-")) throw new Error(`${where} : l'ancre « ${anchor} » est réservée.`);
    counter.anchors = counter.anchors || new Set();
    if (counter.anchors.has(anchor)) throw new Error(`${where} : l'ancre « ${anchor} » est déjà utilisée sur la page.`);
    counter.anchors.add(anchor);
    node.anchor = anchor;
  }
  if (raw.type === "menuanchor" && !node.anchor) throw new Error(`${where} : donnez un nom à l'ancre (ex. tarifs), utilisé dans les liens « #tarifs ».`);
  const audience = normalizeAudience(raw.audience, where);
  if (audience) node.audience = audience;
  // Visible sur certains écrans seulement (au moins un)
  if (Array.isArray(raw.hideOn)) {
    const hideOn = [...new Set(raw.hideOn.filter((b) => BREAKPOINTS.some((x) => x.key === b)))];
    if (["desktop", "tablet", "mobile"].every((k) => hideOn.includes(k))) throw new Error(`${where} : un élément ne peut pas être masqué sur tous les écrans (utilisez « Masquer »).`);
    if (hideOn.length) node.hideOn = hideOn;
  }
  const motion = normalizeMotion(raw.motion, raw.type);
  if (motion) node.motion = motion;
  // Avancé : CSS propre à l'élément, classes, attributs, interactions, état initial masqué, programmation, vidéo de fond
  if (raw.css) { const css = cssDeclarations(raw.css, `${where} (CSS)`); if (css) node.css = css; }
  if (raw.cssHover) { const css = cssDeclarations(raw.cssHover, `${where} (CSS au survol)`); if (css) node.cssHover = css; }
  if (raw.classes) { const c = normalizeClasses(raw.classes); if (c) node.classes = c; }
  const attrs = normalizeAttrs(raw.attrs);
  if (attrs.length) node.attrs = attrs;
  const ix = normalizeInteractions(raw.interactions);
  if (ix.length) node.interactions = ix;
  if (raw.startHidden === true) node.startHidden = true;
  const schedule = normalizeSchedule(raw.schedule, where);
  if (schedule) node.schedule = schedule;
  // Séparateur de forme (haut et / ou bas d'un conteneur) : forme d'une liste fixe, couleur validée, hauteur bornée ; rien d'autre n'atteint la page
  if (def.container && Array.isArray(raw.shapes)) {
    const seen = new Set(), shapes = [];
    for (const s of raw.shapes.slice(0, 2)) {
      const position = oneOf("top", "bottom")(s && s.position), shape = oneOf(...Object.keys(SHAPE_DIVIDERS))(s && s.shape);
      if (!position || !shape || seen.has(position)) continue;
      seen.add(position);
      const colorV = s.color ? color(String(s.color).trim()) : null;
      const height = numberIn(20, 300, { integer: true })(s.height);
      shapes.push({ position, shape, ...(colorV ? { color: colorV } : {}), ...(height && height !== 100 ? { height } : {}), ...(s.flip === true ? { flip: true } : {}), ...(s.front === true ? { front: true } : {}) });
    }
    if (shapes.length) node.shapes = shapes;
  }
  // Diaporama en arrière-plan (comme « Background Slideshow » d'Elementor) : 2 à 8 images de la médiathèque qui se succèdent en fondu, temps par image, effet Ken Burns facultatif
  if (def.container && raw.bgSlides && Array.isArray(raw.bgSlides.images)) {
    const images = raw.bgSlides.images.slice(0, 8).map((src, i) => h.imageUrl(src, `${where} (diaporama de fond, image ${i + 1})`)).filter(Boolean);
    if (images.length) { const seconds = numberIn(2, 30, { integer: true })(raw.bgSlides.seconds); node.bgSlides = { images, ...(seconds && seconds !== 5 ? { seconds } : {}), ...(raw.bgSlides.kenBurns === true ? { kenBurns: true } : {}) }; }
  }
  if (def.container && raw.bgVideo && raw.bgVideo.src) {
    const src = line(raw.bgVideo.src, 1000);
    if (!/^(https:\/\/[^\s<>"'`\\/@]+\/[^\s<>"'`\\]*|\/uploads\/[a-z0-9/_.-]+)\.(mp4|webm)(\?[^\s<>"'`\\]*)?$/i.test(src)) throw new Error(`${where} : vidéo de fond : fichier .mp4 ou .webm (https:// ou médiathèque).`);
    // Début / fin (secondes), image de secours (affichée si la vidéo ne charge pas) et lecture unique, comme « Background Video » d'Elementor
    const bs = numberIn(1, 86399, { integer: true })(raw.bgVideo.start), be = numberIn(2, 86400, { integer: true })(raw.bgVideo.end);
    if (be && be <= (bs || 0)) throw new Error(`${where} : vidéo de fond : la fin doit venir après le début.`);
    const poster = raw.bgVideo.poster ? h.imageUrl(raw.bgVideo.poster, `${where} (image de secours de la vidéo de fond)`) : "";
    node.bgVideo = { src, ...(bs ? { start: bs } : {}), ...(be ? { end: be } : {}), ...(poster ? { poster } : {}), ...(raw.bgVideo.once === true ? { once: true } : {}) };
  }
  const styles = normalizeStyles(raw.styles, raw.states, where, h);
  if (styles.styles) node.styles = styles.styles;
  if (styles.states) node.states = styles.states;
  const parts = normalizeParts(raw.type, raw.parts, where, h, raw.id);
  if (parts) node.parts = parts;
  if (def.container) {
    const kids = Array.isArray(raw.children) ? raw.children : [];
    node.children = kids.map((c, i) => normalizeNode(c, `${where} › élément ${i + 1}`, h, depth + 1, counter));
    if (node.props && node.props.link) {
      const found = firstInteractive(node.children);
      if (found) throw new Error(`${where} : un conteneur cliquable ne peut pas contenir « ${found} » (un lien ne peut pas en contenir un autre). Retirez le lien du conteneur ou cet élément.`);
    }
  }
  return node;
}
// Parties stylables d'un widget (voir parts.js) : chaque partie reçoit le jeu de styles COMPLET validé comme celui de la racine, restreint aux groupes
// et aux états que le registre autorise pour elle. Une partie inconnue ou une propriété hors de ses groupes est refusée (jamais ignorée en silence).
// Diagnostics non bloquants collectés pendant la validation (lus par l'enregistrement du brouillon : ctx.__warnings)
function ignored(h, w) { if (h && h.ctx && Array.isArray(h.ctx.__warnings) && h.ctx.__warnings.length < 50) h.ctx.__warnings.push(w); }
function normalizeParts(type, raw, at, h, nodeId) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) throw new Error(`${at} : parties invalides.`);
  const defs = partsLib.PARTS[type];
  const groupOf = (k) => (k === "backgroundColor" ? "background" : (STYLE_PROPS[k] || COMPOSED[k] || {}).group); // la couleur de fond est réglée dans « Fond » (comme dans l'Inspector)
  const out = {};
  for (const [key, val] of Object.entries(raw)) {
    const def = defs && Object.hasOwn(defs, key) ? defs[key] : null;
    if (!def) throw new Error(`${at} : « ${key} » n'est pas une partie stylable de cet élément.`);
    const st = normalizeStyles(val && val.styles, val && val.states, `${at} › ${def.label}`, h);
    // Réglage valide dans la grammaire mais que cette partie n'accepte pas (ex. « alignement dans le parent » sur « Question + réponse ») : il n'a aucun effet
    // légitime ici. Il est écarté, le reste est enregistré, et la personne est prévenue (diagnostic non bloquant, jamais une erreur qui bloque la page).
    const drop = (set, scope) => { for (const k of Object.keys(set)) if (!partsLib.allows(def, k, groupOf)) { delete set[k]; ignored(h, { kind: "part_prop", nodeId, part: key, partLabel: def.label, prop: k, scope, message: `Le réglage « ${(STYLE_UI[k] || [k])[0]} » n'existe pas pour la partie « ${def.label} » : il n'a pas été appliqué (le reste est enregistré).` }); } };
    for (const [bp, set] of Object.entries(st.styles || {})) drop(set, bp);
    for (const [state, set] of Object.entries(st.states || {})) {
      if (!def.states.includes(state)) { delete st.states[state]; ignored(h, { kind: "part_state", nodeId, part: key, partLabel: def.label, state, message: `L'état « ${state} » n'existe pas pour la partie « ${def.label} » : il n'a pas été appliqué.` }); continue; }
      drop(set, state);
    }
    for (const bag of [st.styles, st.states]) if (bag) for (const [k, set] of Object.entries(bag)) if (!Object.keys(set).length) delete bag[k];
    if (st.styles && !Object.keys(st.styles).length) delete st.styles;
    if (st.states && !Object.keys(st.states).length) delete st.states;
    if (st.styles || st.states) out[key] = st;
  }
  return Object.keys(out).length ? out : null;
}
function normalizeStyles(styles, states, at, h) {
  const out = {};
  const s = {};
  for (const bp of BREAKPOINTS) {
    const set = normalizeStyleSet(styles && styles[bp.key], `${at} (${bp.label.toLowerCase()})`, h);
    if (Object.keys(set).length) s[bp.key] = set;
  }
  if (Object.keys(s).length) out.styles = s;
  const st = {};
  for (const state of STATES) {
    const set = normalizeStyleSet(states && states[state.key], `${at} (${state.label.toLowerCase()})`, h);
    if (Object.keys(set).length) st[state.key] = set;
  }
  if (Object.keys(st).length) out.states = st;
  return out;
}

// Parcours en profondeur (ordre d'affichage) : même ordre pour le rendu, les liens cliquables et les contrôles
function walk(nodes, fn, parent = null) {
  for (const n of nodes || []) {
    fn(n, parent);
    if (n.children) walk(n.children, fn, n);
  }
}
// Arbre affiché au public : éléments masqués retirés, et ceux dont le public ne correspond pas au visiteur
const visibleTree = (nodes, visitor, now = Date.now()) => (nodes || []).filter((n) => !n.hidden && scheduleMatches(n.schedule, now) && (visitor === undefined || audienceMatches(n.audience, visitor))).map((n) => (n.children ? { ...n, children: visibleTree(n.children, visitor) } : n));

// Animation d'entrée d'un élément : variables (durée, délai, courbe) + nom, répétition, direction et remplissage ; un autre écran peut
// remplacer l'animation ou la couper (« none ») sans toucher à l'héritage des autres propriétés
function entranceRules(n, rules, used) {
  const m = n.motion;
  if (!m || !m.entrance || !NODE_ID.test(String(n.id || "")) || !Object.hasOwn(ANIMATIONS, m.entrance)) return;
  const sel = `.kw-n-${n.id}`, on = `${sel}.is-in,${sel}.kw-ix-replay,${sel}.pb-anim-replay`, a = ANIMATIONS[m.entrance];
  used.add(m.entrance);
  rules.base.push(`${sel}{--kw-anim-dur:${m.duration}ms;--kw-anim-delay:${m.delay}ms${m.easing ? `;--kw-anim-ease:${MOTION.easingCss(m.easing)}` : ""}}`);
  rules.base.push(`${on}{animation-name:kw-a-${m.entrance};animation-iteration-count:${m.iterations || 1};animation-direction:${m.direction || "normal"};animation-fill-mode:${a.fill}}`);
  for (const bp of ["tablet", "mobile"]) {
    const v = m.screens && m.screens[bp];
    if (v === undefined || !rules.media[bp]) continue;
    if (v === "none") rules.media[bp].push(`${sel}.is-in,${sel}.kw-ix-replay{animation:none}.kw-anim-ready ${sel}[data-kw-anim]:not(.is-in){opacity:1}`);
    else { used.add(v); rules.media[bp].push(`${on}{animation-name:kw-a-${v};animation-fill-mode:${ANIMATIONS[v].fill}}.kw-anim-ready ${sel}[data-kw-anim]:not([data-kw-anim-vis]):not(.is-in){opacity:0}`); }
  }
}
// Attributs de mouvement d'un élément (page publiée, aperçu et canevas) : UNE seule source pour l'entrée, le défilement et la souris
function motionAttrs(n) {
  const m = n && n.motion;
  const studioAttrs = STUDIO.attrs(n, CUSTOM_WIDGETS[n && n.type] ? CUSTOM_WIDGETS[n.type].motion : null); // composant Motion Studio : module + réglages effectifs
  if (!m) return studioAttrs;
  const esc = (v) => String(v).replace(/[&"<>]/g, (c) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[c]);
  let a = "";
  if (m.entrance && Object.hasOwn(ANIMATIONS, m.entrance)) {
    const an = ANIMATIONS[m.entrance], trig = m.trigger || "viewport";
    a += ` data-kw-anim="${m.entrance}"${m.repeat ? " data-kw-anim-repeat" : ""}`;
    if (an.kind !== "in" || trig === "click" || trig === "hover") a += " data-kw-anim-vis"; // visible avant son déclenchement
    if (trig !== "viewport") a += ` data-kw-anim-trigger="${trig}"`;
    if (an.reducedMotionBehavior === "fade") a += ' data-kw-anim-rm="fade"';
  }
  if (m.scroll) a += ` data-kw-scroll="${esc(JSON.stringify(m.scroll))}"`;
  if (m.mouse) a += ` data-kw-mouse="${esc(JSON.stringify(m.mouse))}"`;
  if (m.scrollFx) a += ` data-kw-sfx="${esc(JSON.stringify(m.scrollFx))}"`;
  if (m.mouseFx) a += ` data-kw-mfx="${esc(JSON.stringify(m.mouseFx))}"`;
  if (m.off && (m.scroll || m.mouse || m.scrollFx || m.mouseFx)) a += ` data-kw-fx-off="${m.off.join(" ")}"`;
  if (m.alwaysMotion) a += " data-kw-motion-always";
  if (m.bgParallax) a += ` data-kw-bgpar="${m.bgParallax}"`;
  return a + studioAttrs.replace(" data-kw-motion-always", m.alwaysMotion ? "" : " data-kw-motion-always");
}

// CSS d'une page : une règle par élément stylé (et par section stylée), par écran et par état. Valeurs déjà validées.
// breakpoints : { tablet, mobile } = largeurs maximales (px) des écrans « Tablette » et « Mobile » du site (réglages du site)
const DEFAULT_BREAKPOINTS = { tablet: 1023, mobile: 767, wide: 1920 };
// ---------- Classes globales du site ----------
// Une classe globale = un nom + des styles (par écran et par état), définis une fois pour le site et appliqués à tout élément
// qui porte ce nom dans « Classes ». Modifier la classe met à jour tous les éléments. Le style PROPRE d'un élément l'emporte
// toujours sur celui de la classe (même spécificité, règles de l'élément écrites après).
const GLOBAL_CLASS_MAX = 40;
function normalizeClassDefs(raw, h, { strict = false } = {}) {
  const out = [], seen = new Set();
  for (const c of Array.isArray(raw) ? raw : []) {
    try {
      const name = String(c && c.name || "").trim().toLowerCase();
      if (!/^[a-z][a-z0-9-]{0,29}$/.test(name) || /^(kw|lp|pb|mk)-/.test(name)) throw new Error(`Classe globale « ${name || "?"} » : nom invalide (minuscules, chiffres et tirets ; préfixes kw-, lp-, pb-, mk- réservés).`);
      if (seen.has(name)) throw new Error(`Classe globale « ${name} » : nom déjà utilisé.`);
      if (out.length >= GLOBAL_CLASS_MAX) throw new Error(`${GLOBAL_CLASS_MAX} classes globales au plus.`);
      const st = normalizeStyles(c.styles, c.states, `Classe « ${name} »`, h);
      seen.add(name);
      // Origine du style (type d'élément source, catégories choisies, date) : informatif, sert à la compatibilité et à l'affichage
      const m = c.meta && typeof c.meta === "object" ? c.meta : null, sp = require("./stylePresets");
      const meta = m ? {
        ...(Object.hasOwn(NODE_TYPES, m.source) ? { source: m.source } : {}),
        ...(Array.isArray(m.categories) ? { categories: sp.CATEGORIES.map((x) => x.id).filter((id) => m.categories.includes(id)) } : {}),
        ...(/^\d{4}-\d{2}-\d{2}$/.test(String(m.updated || "")) ? { updated: m.updated } : {}),
      } : null;
      out.push({ name, ...(line(c.label, 60) ? { label: line(c.label, 60) } : {}), ...(st.styles ? { styles: st.styles } : {}), ...(st.states ? { states: st.states } : {}), ...(meta && Object.keys(meta).length ? { meta } : {}) });
    } catch (e) { if (strict) throw e; }
  }
  return out;
}
function classCss(classes, breakpoints = DEFAULT_BREAKPOINTS) {
  const base = [], media = { wide: [], tablet: [], mobile: [] };
  const mediaOf = (key) => (key === "wide" ? `(min-width: ${breakpoints.wide || 1920}px)` : key === "tablet" ? `(max-width: ${breakpoints.tablet}px)` : `(max-width: ${breakpoints.mobile}px)`);
  for (const c of classes || []) {
    if (!/^[a-z][a-z0-9-]{0,29}$/.test(c.name)) continue;
    const sel = `.lp-site :where(.${c.name})`;
    for (const bp of BREAKPOINTS) { const d = c.styles && c.styles[bp.key] ? declarations(c.styles[bp.key]) : ""; if (d) (bp.media ? media[bp.key] : base).push(`${sel}{${d}}`); }
    for (const state of STATES) { const d = c.states && c.states[state.key] ? declarations(c.states[state.key]) : ""; if (d) base.push(stateRule(state, sel, d)); }
  }
  return [...base, ...["wide", "tablet", "mobile"].filter((k) => media[k].length).map((k) => `@media ${mediaOf(k)}{${media[k].join("")}}`)].join("\n");
}
// Lisibilité garantie : un texte et un fond en couleurs HEXADÉCIMALES réglés sur le même écran avec un contraste inférieur à 2:1 (noir sur noir, blanc sur blanc)
// rendraient le texte invisible. Le fond choisi est conservé ; le texte prend la couleur lisible la plus proche (blanc ou presque noir). Les valeurs en variables
// (var(--kw-…)), transparentes ou en dégradé ne sont jamais modifiées : seul un réglage littéral, donc vérifiable, est corrigé.
const HEX_RGB = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const lumHex = (h) => { let x = String(h).slice(1); if (x.length === 3) x = x.split("").map((c) => c + c).join(""); const v = [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
const contrastHex = (a, b) => { const l1 = lumHex(a), l2 = lumHex(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
function guardContrast(styles) {
  if (!styles || typeof styles !== "object") return styles;
  let out = null;
  for (const [bp, st] of Object.entries(styles)) {
    if (!st || !HEX_RGB.test(String(st.color || "")) || !HEX_RGB.test(String(st.backgroundColor || ""))) continue;
    if (contrastHex(st.color, st.backgroundColor) >= 2) continue;
    out = out || { ...styles };
    out[bp] = { ...st, color: lumHex(st.backgroundColor) < 0.4 ? "#ffffff" : "#111111" };
  }
  return out || styles;
}

function pageCss(sections, breakpoints = DEFAULT_BREAKPOINTS) {
  const mediaOf = (bp) => (bp.key === "wide" ? `(min-width: ${breakpoints.wide || 1920}px)` : bp.key === "tablet" ? `(max-width: ${breakpoints.tablet}px)` : bp.key === "mobile" ? `(max-width: ${breakpoints.mobile}px)` : bp.media);
  const rules = { base: [], custom: [], media: Object.fromEntries(BREAKPOINTS.filter((b) => b.media).map((b) => [b.key, []])) };
  const usedAnims = new Set(); // animations réellement utilisées : seules leurs images-clés sont écrites dans la page
  const clamps = { tablet: [], mobile: [] }; // cases de grille ramenées au nombre de colonnes de l'écran : écrites après toutes les autres règles
  // Parties d'un widget : mêmes écrans et mêmes états que la racine, sélecteur fixé par le registre (parts.js). `.kw-node.kw-n-<id>` donne à la règle une
  // spécificité supérieure aux styles par défaut du site pour ces zones : le réglage de l'auteur l'emporte sans « !important ».
  const addParts = (n) => {
    const defs = partsLib.PARTS[n.type];
    if (!defs || !n.parts || !NODE_ID.test(String(n.id || ""))) return;
    for (const [key, set] of Object.entries(n.parts)) {
      const def = defs[key];
      if (!def) continue;
      const sel = `.kw-node.kw-n-${n.id} ${def.select}`;
      for (const bp of BREAKPOINTS) {
        let st = set.styles && set.styles[bp.key];
        // Menu horizontal : « Écart » règle l'espace ENTRE les liens d'une ligne ; il ne doit pas devenir un vide démesuré quand la liste passe en colonne (menu mobile)
        if (n.type === "menu" && key === "list" && st && st.gap !== undefined && st.rowGap === undefined && st.columnGap === undefined && !(n.props && n.props.vertical)) { const { gap, ...rest } = st; st = { ...rest, columnGap: gap, rowGap: "4px" }; }
        const d = st ? declarations(st) : "";
        if (d) (bp.media ? rules.media[bp.key] : rules.base).push(`${sel}{${d}}`);
      }
      for (const state of STATES) {
        const d = set.states && set.states[state.key] ? declarations(set.states[state.key]) : "";
        if (d) rules.base.push(stateRule(state, sel, d));
      }
    }
  };
  const add = (id, styles, states, band = false) => {
    if (!NODE_ID.test(String(id || ""))) return;
    const sel = `.kw-n-${id}`;
    for (const bp of BREAKPOINTS) {
      const d = styles && styles[bp.key] ? declarations(styles[bp.key], band) : "";
      if (!d) continue;
      (bp.media ? rules.media[bp.key] : rules.base).push(`${sel}{${d}}`);
    }
    for (const state of STATES) {
      const d = states && states[state.key] ? declarations(states[state.key], band) : "";
      if (d) rules.base.push(stateRule(state, sel, d));
    }
  };
  // Un conteneur centre sa propre largeur par des marges automatiques (landing.css : :where(.kw-container)). Dans une disposition EN LIGNE ou EN GRILLE
  // d'un parent, ces marges se partageraient l'espace libre et prendraient le pas sur « Répartition » et « Écart » : c'est le PARENT qui doit répartir
  // ses enfants. Pour chaque parent, on écrit donc (par écran, avec l'héritage ordinateur → tablette → mobile) une règle à spécificité nulle qui retire
  // ces marges quand le parent est en ligne / en grille, et les rend quand un écran plus étroit repasse en colonne. Les marges choisies par l'auteur
  // sur l'enfant (.kw-n-<id>) l'emportent toujours.
  const DEFAULT_LAYOUT = { layout: ["flex", "column"], columns: ["flex", "row"], grid: ["grid", "row"] };
  const rowMarginRules = (id, type, styles, kids, wrapper) => {
    if (!NODE_ID.test(String(id || "")) || !(kids || []).some((k) => k && k.type === "container")) return;
    const sel = `:where(.kw-n-${id} > ${wrapper ? ".kw-layout > " : ""}.kw-container)`;
    let [display, dir] = DEFAULT_LAYOUT[type] || ["flex", "column"], prev = null;
    for (const bp of BREAKPOINTS) {
      const st = (styles && styles[bp.key]) || {};
      if (st.display) display = st.display;
      if (st.flexDirection) dir = st.flexDirection;
      const row = display === "grid" || display === "inline-grid" || (/flex/.test(display) && /^row/.test(dir));
      if (row !== prev && !(prev === null && !row)) (bp.media ? rules.media[bp.key] : rules.base).push(`${sel}{margin-left:${row ? "0" : "auto"};margin-right:${row ? "0" : "auto"}}`);
      prev = row;
    }
  };
  const seenIds = new Set(); // les copies d'un modèle de boucle partagent leur identifiant : règles écrites une seule fois
  for (const s of sections || []) {
    add(s.id, s.styles, s.states);
    if (s.type === "layout") rowMarginRules(s.id, "layout", s.styles, s.children, true);
    if (s.type === "layout") walk(s.children, (n) => {
      if (seenIds.has(n.id)) return;
      seenIds.add(n.id);
      add(n.id, guardContrast(n.styles), n.states, n.type === "container" && Boolean(n.props && n.props.band && !n.props.full));
    addParts(n);
      if (n.children && n.children.length) rowMarginRules(n.id, n.type, n.styles, n.children, false);
      // Image : « Hauteur » et « Proportions » de l'élément s'appliquent à la boîte (<figure>) ; l'image doit la REMPLIR pour que « Cadrage » et « Point focal »
      // aient un effet (sans cela l'image garde sa hauteur naturelle et la boîte reste vide en dessous). Seulement pour un écran qui fixe l'une de ces valeurs :
      // une image sans hauteur ni proportions garde sa taille naturelle.
      if (n.type === "image" && NODE_ID.test(String(n.id || ""))) for (const bp of BREAKPOINTS) {
        const st = n.styles && n.styles[bp.key];
        if (st && ((st.height && st.height !== "auto") || (st.aspectRatio && st.aspectRatio !== "auto"))) (bp.media ? rules.media[bp.key] : rules.base).push(`.kw-n-${n.id} img{width:100%;height:100%}`);
      }
      entranceRules(n, rules, usedAnims);
      // CSS personnalisé de l'élément (validé à l'enregistrement, revalidé ici : rien d'autre n'atteint la page)
      if (n.css && NODE_ID.test(String(n.id || ""))) { try { const c = cssDeclarations(n.css, "CSS"); if (c) rules.custom.push(`.kw-node.kw-n-${n.id}{${c}}`); } catch { /* ignoré */ } }
      if (n.cssHover && NODE_ID.test(String(n.id || ""))) { try { const c = cssDeclarations(n.cssHover, "CSS"); if (c) rules.custom.push(`.kw-node.kw-n-${n.id}:hover{${c}}`); } catch { /* ignoré */ } }
      // Barre de progression : sa largeur vient de sa valeur (validée 0–100), pas d'un style écrit dans la page
      if (n.shapes && NODE_ID.test(String(n.id || ""))) {
        rules.base.push(`:where(.kw-n-${n.id}){position:relative;isolation:isolate}`);
        for (const sh of n.shapes) rules.base.push(`.kw-n-${n.id}>.kw-shape-${sh.position}{height:${sh.height || 100}px;${sh.color ? "color:" + colorCss(sh.color) + ";" : ""}}`);
      }
      if (n.type === "hotspot" && NODE_ID.test(String(n.id || "")) && n.props) n.props.spots.forEach((sp, k) => rules.base.push(`.kw-n-${n.id}-s${k}{left:${Number(sp.x)}%;top:${Number(sp.y)}%}`));
      if (n.type === "iconlist" && NODE_ID.test(String(n.id || "")) && n.props && n.props.iconColor) rules.base.push(`.kw-n-${n.id} .kw-iconlist-icon{color:${colorCss(n.props.iconColor)}}`);
      if ((n.type === "social" || n.type === "sharebuttons") && NODE_ID.test(String(n.id || "")) && n.props) rules.base.push(`.kw-n-${n.id}{--kw-soc:${Number(n.props.size) || 32}px}`);
      if (n.type === "divider" && NODE_ID.test(String(n.id || "")) && n.props && (n.props.lineStyle !== "solid" || n.props.thickness > 1 || n.props.color)) rules.base.push(`.kw-n-${n.id}${n.props.text ? "::before,.kw-n-" + n.id + "::after" : ""}{${n.props.text ? "" : "border:0;"}border-top:${n.props.thickness}px ${n.props.lineStyle} ${n.props.color ? colorCss(n.props.color) : "currentColor"}}`);
      if (n.type === "sitelogo" && NODE_ID.test(String(n.id || "")) && n.props && Number.isInteger(n.props.height)) { rules.base.push(`.kw-n-${n.id} .kw-sitelogo-img{height:${n.props.height}px}`); if (Number.isInteger(n.props.scrollHeight)) rules.base.push(`.lp-block.lp-site-header.lp-site-part.is-scrolled .kw-n-${n.id} .kw-sitelogo-img{height:${n.props.scrollHeight}px;max-height:none}`); }
      if (n.type === "flipbox" && NODE_ID.test(String(n.id || "")) && n.props && Number.isInteger(n.props.height)) rules.base.push(`.kw-n-${n.id}{min-height:${n.props.height}px}`);
      if (n.type === "readingprogress" && NODE_ID.test(String(n.id || "")) && n.props && Number.isInteger(n.props.thickness)) rules.base.push(`.kw-n-${n.id} .kw-readbar{height:${n.props.thickness}px}`);
      if (n.type === "rating" && NODE_ID.test(String(n.id || "")) && n.props && Number.isFinite(n.props.value)) rules.base.push(`.kw-n-${n.id} .kw-rating-fill{width:${Math.round((n.props.value / (n.props.scale || 5)) * 1000) / 10}%}`);
      if (n.type === "map" && NODE_ID.test(String(n.id || "")) && n.props && Number.isInteger(n.props.height)) rules.base.push(`.kw-n-${n.id} .kw-map-frame{height:${n.props.height}px}`);
      if (n.type === "progress" && NODE_ID.test(String(n.id || "")) && Number.isInteger(n.props && n.props.value)) { rules.base.push(`.kw-n-${n.id} .kw-progress-bar{width:${n.props.value}%}`); if (n.props.duration || n.props.easing) rules.base.push(`.kw-n-${n.id}.kw-progress-anim .kw-progress-bar{${n.props.duration ? `transition-duration:${n.props.duration}ms;` : ""}${n.props.easing === "linear" ? "transition-timing-function:linear" : n.props.easing === "out" ? "transition-timing-function:cubic-bezier(.16,1,.3,1)" : ""}}`); }
      if (n.type === "flipbox" && NODE_ID.test(String(n.id || "")) && n.props && Number.isInteger(n.props.duration)) rules.base.push(`.kw-n-${n.id} .kw-flip-inner{transition-duration:${n.props.duration}ms}`);
      // Grille réglée pour l'ordinateur : sur tablette et mobile, elle se resserre d'elle-même (2 colonnes au plus, puis 1)
      // tant qu'aucune valeur propre à l'écran n'est réglée — comme une grille sans réglage
      if (n.type === "grid" && NODE_ID.test(String(n.id || ""))) {
        const st = n.styles || {}, own = (bp) => st[bp] && (st[bp].columns !== undefined || st[bp].gridTemplate !== undefined);
        const d = st.desktop || {}, cols = d.gridTemplate ? String(d.gridTemplate).split(" ").length : Number(d.columns) || 0;
        if (cols > 2 && !own("tablet") && rules.media.tablet) rules.media.tablet.push(`.kw-n-${n.id}{grid-template-columns:repeat(2,minmax(0,1fr))}`);
        if (cols > 1 && !own("tablet") && !own("mobile") && rules.media.mobile) rules.media.mobile.push(`.kw-n-${n.id}{grid-template-columns:minmax(0,1fr)}`);
        // Colonnes réellement affichées sur chaque écran (valeur propre, sinon celle de l'écran plus grand, sinon le resserrement ci-dessus)
        const countOf = (set) => (set ? (set.gridTemplate ? String(set.gridTemplate).split(" ").length : Number(set.columns) || 0) : 0);
        const colsT = countOf(st.tablet) || (cols > 2 ? 2 : cols);
        const colsM = countOf(st.mobile) || countOf(st.tablet) || (cols > 1 ? 1 : cols);
        // Une case ne peut pas occuper plus de colonnes que la grille n'en a sur cet écran (sinon elle créerait des colonnes
        // en trop, par exemple « 2 colonnes » réglées pour l'ordinateur sur une grille à 1 colonne sur mobile) : elle est ramenée
        for (const c of n.children || []) {
          if (!NODE_ID.test(String(c.id || "")) || !c.styles) continue;
          for (const [bpKey, count, chain] of [["tablet", colsT, ["tablet", "desktop"]], ["mobile", colsM, ["mobile", "tablet", "desktop"]]]) {
            if (!count || !rules.media[bpKey]) continue;
            const eff = (key) => { for (const k of chain) if (c.styles[k] && c.styles[k][key] !== undefined) return c.styles[k][key]; return undefined; };
            const span = eff("gridColumnSpan"), start = eff("gridColumnStart"), end = eff("gridColumnEnd");
            let fit = null;
            if (start) {
              if (start > count) fit = "auto";
              else if (end === undefined && start + (span || 1) - 1 > count) fit = `${start} / span ${count - start + 1}`;
              else if (end !== undefined && end > count + 1) fit = `${start} / ${count + 1}`;
            } else if (span && span > count) fit = `span ${count}`;
            else if (end && end > count + 1) fit = `auto / ${count + 1}`;
            if (fit) clamps[bpKey].push(`.kw-n-${c.id}{grid-column:${fit}}`);
          }
        }
      }
    });
  }
  for (const k of Object.keys(clamps)) if (rules.media[k]) rules.media[k].push(...clamps[k]);
  let css = rules.base.join("\n");
  if (usedAnims.size) css = `${MOTION.keyframesCss([...usedAnims])}\n${css}`;
  for (const bp of BREAKPOINTS) if (bp.media && rules.media[bp.key].length) css += `\n@media ${mediaOf(bp)}{${rules.media[bp.key].join("")}}`;
  // « Masquer sur cet écran » : mêmes seuils que les écrans du site (réglages du site)
  // (écrites seulement si la page masque quelque chose selon l'écran)
  if (/"hideOn":\["/.test(JSON.stringify(sections))) {
    css += `\n@media (min-width:${breakpoints.tablet + 1}px){.lp-hide-desktop{display:none}}\n@media (min-width:${breakpoints.wide || 1920}px){.lp-hide-wide{display:none}}\n@media (min-width:${breakpoints.mobile + 1}px) and (max-width:${breakpoints.tablet}px){.lp-hide-tablet{display:none}}\n@media (max-width:${breakpoints.mobile}px){.lp-hide-mobile{display:none}}`;
  }
  // Le CSS personnalisé vient en dernier (il précise les réglages de l'inspecteur), avec une spécificité plus forte
  if (rules.custom.length) css += `\n${rules.custom.join("\n")}`;
  return css.replace(/</g, "");
}

// Ancien widget Menu NON TOUCHÉ : sa valeur par défaut était une liste de démonstration (Programme → /catalogue, Blog → /blog), enregistrée telle quelle dans l'en-tête de nombreux sites.
// Ce n'est pas une navigation configurée par une personne : à l'affichage, elle cède la place au menu affecté à l'emplacement (voir landing/index.js). Toute liste modifiée, même d'un seul mot, reste une liste explicite.
function isDemoMenu(props) {
  const p = props || {};
  if (p.source && p.source !== "manual") return false;
  const items = Array.isArray(p.items) ? p.items : [];
  const same = (x, label, url) => x && x.label === label && x.url === url && !(x.children && x.children.length);
  return items.length === 2 && same(items[0], "Programme", "/catalogue") && same(items[1], "Blog", "/blog") && ["Menu de la page", "Menu"].includes(p.label || "Menu");
}

module.exports = {
  isDemoMenu, dynamic, registerCondition, normalizeClassDefs, classCss, GLOBAL_CLASS_MAX,
  NODE_TYPES, CATEGORIES, WIDGET_GROUPS, WIDGETS, CUSTOM_WIDGETS, registerWidget, lockedWidgetChanges, PALETTE, STYLE_UI, editorSpec, STYLE_PROPS, COMPOSED, BREAKPOINTS, STATES, SHADOWS, FONT_STACKS, COLOR_TOKENS, MAX_NODES, MAX_DEPTH,
  capsOf, MOTION, STUDIO, motionAttrs, MASK_SHAPES, SCROLL_FX, SCROLL_RANGE, MOUSE_RANGE, MOUSE_MODES, AUDIENCES, normalizeAudience, audienceMatches, audienceLabel, normalizePageCss, cssDeclarations, scheduleMatches, embedOf, sanitizeHtmlBlock, normalizeNode, normalizeStyles, sanitizeRich, walk, visibleTree, pageCss, newNodeId, iconNames,
};
