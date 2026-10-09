// Éléments imbriqués du Page Builder (« Section libre ») : un ARBRE d'éléments typés, chacun avec un identifiant unique,
// des propriétés (contenu), des styles par écran (ordinateur / tablette / mobile, hérités de l'écran plus grand) et par
// état (survol, focus, clic). Grammaire FERMÉE, comme les sections : chaque type est déclaré dans le registre NODE_TYPES
// (libellé, catégorie, conteneur ou non, normalisation) ; chaque propriété de style est déclarée dans STYLE_PROPS avec
// son validateur. Aucune valeur libre n'atteint la page : le CSS est généré à partir de valeurs validées, sous une classe
// propre à l'élément (.kw-n-<id>). Pas de HTML, CSS ni JavaScript libres (les pages sont servies sur le même domaine que
// les comptes des élèves : un script pourrait voler leurs sessions).
const sanitizeHtml = require("sanitize-html");
const crypto = require("crypto");
const { getCourse } = require("../bridge/catalog");
const { parseVideoUrl } = require("../../utils/video");
const dynamic = require("./dynamic");

// Fichiers vidéo et audio de la médiathèque du CMS : adresse locale permanente (/uploads/marketing/<organisation>/<fichier>)
const LOCAL_VIDEO = /^\/uploads\/marketing\/\d+\/[A-Za-z0-9._-]+\.(mp4|webm)$/i;
const LOCAL_AUDIO = /^\/uploads\/marketing\/\d+\/[A-Za-z0-9._-]+\.(mp3|m4a|ogg|wav)$/i;
const MAX_NODES = 400;   // éléments d'une page (toutes sections libres confondues)
const MAX_DEPTH = 8;
const NODE_ID = /^[a-z0-9]{6,20}$/;
const ANCHOR = /^[a-z][a-z0-9-]{0,39}$/;
const RESERVED_ANCHORS = new Set(["main", "contenu", "top", "haut", "kw-consent"]);
// Écrans : la liste peut s'allonger (ordinateur portable, écran personnalisé) sans changer le modèle
const BREAKPOINTS = [
  { key: "desktop", label: "Ordinateur", media: null },
  { key: "tablet", label: "Tablette", media: "(max-width: 1023px)" },
  { key: "mobile", label: "Mobile", media: "(max-width: 767px)" },
];
const STATES = [{ key: "hover", label: "Survol", sel: ":hover" }, { key: "focus", label: "Focus", sel: ":focus-visible" }, { key: "active", label: "Clic", sel: ":active" }];

const newNodeId = () => crypto.randomBytes(6).toString("hex");
const clean = (v, max) => (typeof v === "string" ? v.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "").trim().slice(0, max) : "");
const line = (v, max) => clean(v, max).replace(/\s+/g, " ");

// ---------- Valeurs de style (validées une à une) ----------
const LEN = /^(-?\d{1,4}(?:\.\d{1,3})?)(px|%|rem|em|vh|vw)$/;
const lengthOf = ({ auto = false, negative = false } = {}) => (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "0") return "0";
  if (auto && s === "auto") return "auto";
  const m = s.match(LEN);
  if (!m) return null;
  if (!negative && Number(m[1]) < 0) return null;
  return `${Number(m[1])}${m[2]}`;
};
const COLOR_TOKENS = ["primary", "secondary", "accent", "background", "surface", "text", "muted", "success", "warning", "error", "on-primary", "on-accent"];
const color = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(s)) return s;
  if (s === "transparent") return s;
  if (s.startsWith("token:") && (COLOR_TOKENS.includes(s.slice(6)) || /^c-[a-z0-9]{1,20}$/.test(s.slice(6)))) return s;
  return null;
};
const colorCss = (v) => (v.startsWith("token:") ? `var(--kw-${v.slice(6)})` : v);
const oneOf = (...list) => (v) => (list.includes(v) ? v : null);
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
const len = lengthOf(), lenAuto = lengthOf({ auto: true }), lenNeg = lengthOf({ negative: true }), marginLen = lengthOf({ auto: true, negative: true });
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
  gap: { css: "gap", check: len, group: "layout" },
  rowGap: { css: "row-gap", check: len, group: "layout" },
  columnGap: { css: "column-gap", check: len, group: "layout" },
  columns: { css: "grid-template-columns", check: numberIn(1, 12, { integer: true }), out: (n) => `repeat(${n}, minmax(0, 1fr))`, group: "layout" },
  // Largeurs des colonnes d'une grille, ex. « 2fr 1fr » ou « 240px 1fr » (remplace le nombre de colonnes égales)
  gridTemplate: { css: "grid-template-columns", check: gridTrack, out: (v) => v.split(" ").map((t) => (/fr$/.test(t) ? `minmax(0, ${t})` : t)).join(" "), group: "layout" },
  gridRows: { css: "grid-template-rows", check: numberIn(1, 12, { integer: true }), out: (n) => `repeat(${n}, auto)`, group: "layout" },
  // Hauteurs des lignes (ex. « 200px 1fr ») : remplace le nombre de lignes égales (écrit après lui)
  gridRowsTemplate: { css: "grid-template-rows", check: gridTrack, out: (v) => v.split(" ").map((t) => (/fr$/.test(t) ? `minmax(0, ${t})` : t)).join(" "), group: "layout" },
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
  width: { css: "width", check: lenAuto, group: "size" },
  height: { css: "height", check: lenAuto, group: "size" },
  minWidth: { css: "min-width", check: len, group: "size" },
  maxWidth: { css: "max-width", check: len, group: "size" },
  minHeight: { css: "min-height", check: len, group: "size" },
  maxHeight: { css: "max-height", check: len, group: "size" },
  // Part de largeur d'une colonne dans « Colonnes » (proportions : 1 / 1 = moitié-moitié, 2 / 1 = deux tiers - un tiers)
  flexGrow: { css: "flex-grow", check: numberIn(0, 20), group: "size" },
  flexShrink: { css: "flex-shrink", check: numberIn(0, 20), group: "size" },
  flexBasis: { css: "flex-basis", check: lenAuto, group: "size" },
  marginTop: { css: "margin-top", check: marginLen, group: "spacing" },
  marginRight: { css: "margin-right", check: marginLen, group: "spacing" },
  marginBottom: { css: "margin-bottom", check: marginLen, group: "spacing" },
  marginLeft: { css: "margin-left", check: marginLen, group: "spacing" },
  paddingTop: { css: "padding-top", check: len, group: "spacing" },
  paddingRight: { css: "padding-right", check: len, group: "spacing" },
  paddingBottom: { css: "padding-bottom", check: len, group: "spacing" },
  paddingLeft: { css: "padding-left", check: len, group: "spacing" },
  fontFamily: { css: "font-family", check: oneOf(...Object.keys(FONT_STACKS)), out: (v) => FONT_STACKS[v], group: "typography" },
  fontSize: { css: "font-size", check: len, group: "typography" },
  fontWeight: { css: "font-weight", check: oneOf("300", "400", "500", "600", "700", "800", "900"), group: "typography" },
  fontStyle: { css: "font-style", check: oneOf("normal", "italic"), group: "typography" },
  lineHeight: { css: "line-height", check: numberIn(0.8, 3), group: "typography" },
  letterSpacing: { css: "letter-spacing", check: lenNeg, group: "typography" },
  wordSpacing: { css: "word-spacing", check: lenNeg, group: "typography" },
  textIndent: { css: "text-indent", check: lenNeg, group: "typography" },
  textTransform: { css: "text-transform", check: oneOf("none", "uppercase", "lowercase", "capitalize"), group: "typography" },
  textAlign: { css: "text-align", check: oneOf("left", "center", "right", "justify"), group: "typography" },
  textDecoration: { css: "text-decoration", check: oneOf("none", "underline", "line-through"), group: "typography" },
  textShadow: { css: "text-shadow", check: oneOf(...Object.keys(TEXT_SHADOWS)), out: (v) => TEXT_SHADOWS[v], group: "typography" },
  color: { css: "color", check: color, out: colorCss, group: "color" },
  backgroundColor: { css: "background-color", check: color, out: colorCss, group: "color" },
  borderWidth: { css: "border-width", check: len, group: "border" },
  // Épaisseur côté par côté (bordure « déliée ») : écrite après l'épaisseur générale, qu'elle précise
  borderTopWidth: { css: "border-top-width", check: len, group: "border" },
  borderRightWidth: { css: "border-right-width", check: len, group: "border" },
  borderBottomWidth: { css: "border-bottom-width", check: len, group: "border" },
  borderLeftWidth: { css: "border-left-width", check: len, group: "border" },
  borderStyle: { css: "border-style", check: oneOf("none", "solid", "dashed", "dotted"), group: "border" },
  borderColor: { css: "border-color", check: color, out: colorCss, group: "border" },
  borderRadius: { css: "border-radius", check: len, group: "border" },
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
  // Absolue : placée par rapport au parent positionné (relatif) ; fixe : par rapport à l'écran (bandeau, bouton flottant)
  position: { css: "position", check: oneOf("static", "relative", "sticky", "absolute", "fixed"), group: "position" },
  top: { css: "top", check: lenNeg, group: "position" },
  right: { css: "right", check: lenNeg, group: "position" },
  bottom: { css: "bottom", check: lenNeg, group: "position" },
  left: { css: "left", check: lenNeg, group: "position" },
  transformOrigin: { css: "transform-origin", check: oneOf("center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"), group: "position" },
  // Durée des changements au survol / focus / clic (couleurs, ombre, transformation…)
  transitionDuration: { css: "transition", check: numberIn(0, 2000, { integer: true }), out: (n) => `color ${n}ms ease, background-color ${n}ms ease, border-color ${n}ms ease, box-shadow ${n}ms ease, transform ${n}ms ease, opacity ${n}ms ease`, group: "effects" },
  zIndex: { css: "z-index", check: numberIn(-100, 9999, { integer: true }), group: "position" },
  objectFit: { css: "object-fit", check: oneOf("cover", "contain", "fill", "none"), group: "media" },
  objectPosition: { css: "object-position", check: oneOf("center", "top", "bottom", "left", "right"), group: "media" },
  aspectRatio: { css: "aspect-ratio", check: oneOf("auto", "1/1", "4/3", "3/2", "16/9", "21/9", "3/4"), out: (v) => v.replace("/", " / "), group: "media" },
  backgroundSize: { css: "background-size", check: oneOf("cover", "contain", "auto"), group: "background" },
  backgroundPosition: { css: "background-position", check: oneOf("center", "top", "bottom", "left", "right"), group: "background" },
  backgroundRepeat: { css: "background-repeat", check: oneOf("no-repeat", "repeat", "repeat-x", "repeat-y"), group: "background" },
  backgroundAttachment: { css: "background-attachment", check: oneOf("scroll", "fixed"), group: "background" },
};
// Propriétés composées (plusieurs valeurs → une déclaration)
const COMPOSED = {
  backgroundImage: { group: "background" },     // { src } : image de la médiathèque ou https://
  gradient: { group: "background" },            // { from, to, angle }
  overlay: { group: "background" },
  shadow: { group: "effects" },
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
      if (src) out.backgroundImage = { src };
    } else if (k === "overlay") {
      const c = color(v && v.color);
      if (c) out.overlay = { color: c };
    } else if (k === "gradient") {
      const from = color(v && v.from), to = color(v && v.to), angle = numberIn(0, 360, { integer: true })(v && v.angle);
      if (from && to) out.gradient = { from, to, angle: angle === null ? 180 : angle };
    } else if (k === "filter") {
      const f = {};
      const put = (name, min, max) => { const x = numberIn(min, max, { integer: true })(v && v[name]); if (x !== null) f[name] = x; };
      put("blur", 0, 40); put("brightness", 0, 300); put("contrast", 0, 300); put("grayscale", 0, 100); put("saturate", 0, 300); put("sepia", 0, 100); put("hueRotate", -360, 360);
      // Valeurs neutres retirées (100 % de luminosité, 0 de flou…)
      for (const [name, neutral] of Object.entries({ blur: 0, brightness: 100, contrast: 100, grayscale: 0, saturate: 100, sepia: 0, hueRotate: 0 })) if (f[name] === neutral) delete f[name];
      if (Object.keys(f).length) out.filter = f;
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
const CORNERS = new Set(["gridTemplate", "gridRowsTemplate", "borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth"]);
function declarations(set) {
  const d = [];
  const entries = Object.entries(set);
  // Coins après l'arrondi général (sinon « border-radius » les écraserait)
  for (const [k, v] of entries.filter(([k]) => !CORNERS.has(k) && !PLACEMENT.has(k)).concat(entries.filter(([k]) => CORNERS.has(k)))) {
    const p = STYLE_PROPS[k];
    if (p) d.push(`${p.css}:${p.out ? p.out(v) : v}`);
  }
  for (const [axis, css] of [["Column", "grid-column"], ["Row", "grid-row"]]) {
    const start = set[`grid${axis}Start`], end = set[`grid${axis}End`], span = set[`grid${axis}Span`];
    if (start !== undefined || end !== undefined) d.push(`${css}:${start !== undefined ? start : "auto"} / ${end !== undefined ? end : span !== undefined ? `span ${span}` : "auto"}`);
    else if (span !== undefined) d.push(`${css}:span ${span}`);
  }
  const layers = [];
  if (set.overlay) layers.push(`linear-gradient(${colorCss(set.overlay.color)}, ${colorCss(set.overlay.color)})`);
  if (set.gradient) layers.push(`linear-gradient(${set.gradient.angle}deg, ${colorCss(set.gradient.from)}, ${colorCss(set.gradient.to)})`);
  if (set.backgroundImage) layers.push(`url("${set.backgroundImage.src}")`);
  if (layers.length) d.push(`background-image:${layers.join(", ")}`);
  if (set.filter) {
    const f = set.filter, unit = { blur: "px", hueRotate: "deg" }, fn = { hueRotate: "hue-rotate" };
    d.push(`filter:${Object.entries(f).map(([k, v]) => `${fn[k] || k}(${v}${unit[k] || (k === "blur" ? "px" : "%")})`).join(" ")}`);
  }
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
const EMPTY_LOOP = { posts: "Aucun article ne correspond.", courses: "Aucune formation ne correspond." };
const loopProps = (p) => {
  const l = p.loop;
  if (!l || typeof l !== "object") return {};
  const query = require("./query");
  const source = oneOf(...query.SOURCES.keys())(l.source) || "posts";
  const sorts = source === "courses" ? ["recent", "title", "price"] : ["recent", "old", "title"];
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
    ...(paginate ? { paginate: true, pagination: pagination !== "none" ? pagination : "numbers" } : {}),
    ...(l.urlFilter === true ? { urlFilter: true } : {}),
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
  return { ...boxTag(p), ...(link ? { link, ...(p.newTab === true && link.startsWith("https://") ? { newTab: true } : {}) } : {}) };
};
// Éléments qui sont eux-mêmes un lien, un bouton ou un champ (ou qui peuvent en contenir) : interdits dans un conteneur cliquable
const INTERACTIVE_INSIDE_LINK = new Set(["button", "link", "menu", "search", "account", "toggle", "tabs", "accordion", "modal", "carousel", "tooltip", "hotspot", "html", "embed", "social", "breadcrumb", "course", "courselist", "posts", "pricing", "iconlist", "gallery", "table", "postcontent"]);
const NODE_TYPES = {
  // Largeur du contenu : encadrée (1100 px centrés, par défaut) ou pleine largeur
  container: { label: "Conteneur", category: "structure", container: true, props: (p, at, h) => ({ ...boxProps(p, at, h), ...(p.full === true ? { full: true } : {}) }) },
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
      ...(text ? { text, align: oneOf("left", "center", "right")(p.align) || "center" } : {}),
    };
  } },
  heading: { label: "Titre", category: "text", props: (p, at, h) => {
    // Vide permis dans le brouillon (bloc en cours d'écriture) : jamais affiché sur la page publique
    const text = line(p.text, 200);
    // Lien facultatif sur tout le titre (compté comme les autres liens de la page)
    const link = h.linkUrl(p.link, `${at} (lien du titre)`);
    return { text, level: oneOf("1", "2", "3", "4", "5", "6")(String(p.level)) || "2", ...(link ? { link, newTab: p.newTab === true && link.startsWith("https://") } : {}) };
  } },
  text: { label: "Texte", category: "text", props: (p, at) => {
    const html = sanitizeRich(p.html); // vide permis (paragraphe en cours d'écriture), jamais affiché sur la page publique
    return { html };
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
    return { text };
  } },
  image: { label: "Image", category: "media", props: (p, at, h) => {
    const src = h.imageUrl(p.src, `${at} (image)`);
    if (!src) throw new Error(`${at} (image) : choisissez une image.`);
    const alt = line(p.alt, 200);
    if (!alt && p.decorative !== true) throw new Error(`${at} (image) : un texte de remplacement est obligatoire (ou cochez « image décorative »).`);
    const link = h.linkUrl(p.link, `${at} (lien de l'image)`);
    return { src, alt, decorative: p.decorative === true && !alt, link, caption: line(p.caption, 200), title: line(p.title, 150), newTab: p.newTab === true && link.startsWith("https://") };
  } },
  gallery: { label: "Galerie", category: "media", props: (p, at, h) => {
    const images = (Array.isArray(p.images) ? p.images : []).slice(0, 24).map((im, i) => {
      const src = h.imageUrl(im && im.src, `${at} (image ${i + 1} de la galerie)`);
      const alt = line(im && im.alt, 200);
      if (src && !alt) throw new Error(`${at} (galerie) : texte de remplacement manquant pour l'image ${i + 1}.`);
      if (!src) return null;
      const caption = line(im && im.caption, 200), link = h.linkUrl(im && im.link, `${at} (lien de l'image ${i + 1})`);
      return { src, alt, ...(caption ? { caption } : {}), ...(link ? { link } : {}) };
    }).filter(Boolean);
    if (!images.length) throw new Error(`${at} (galerie) : au moins une image.`);
    // lightbox : clic = image en grand (sauf image avec lien) ; masonry : hauteurs naturelles en colonnes
    return { images, lightbox: p.lightbox === true, masonry: p.masonry === true };
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
    return { label, value, showValue: p.showValue !== false, animate: p.animate === true };
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
    if (!items.length) throw new Error(`${at} (menu) : au moins un lien avec un texte et une adresse.`);
    return { items, label: line(p.label, 60) || "Menu", vertical: p.vertical === true, mobileToggle: p.mobileToggle === true };
  } },
  carousel: { label: "Carrousel d'images", category: "media", props: (p, at, h) => {
    const images = (Array.isArray(p.images) ? p.images : []).slice(0, 24).map((im, i) => {
      const src = h.imageUrl(im && im.src, `${at} (image ${i + 1} du carrousel)`);
      const alt = line(im && im.alt, 200);
      if (src && !alt) throw new Error(`${at} (carrousel) : texte de remplacement manquant pour l'image ${i + 1}.`);
      return src ? { src, alt, caption: line(im && im.caption, 200) } : null;
    }).filter(Boolean);
    if (images.length < 2) throw new Error(`${at} (carrousel) : au moins deux images.`);
    return { images, label: line(p.label, 80) || "Carrousel d'images", dots: p.dots !== false, autoplay: p.autoplay === true, interval: numberIn(2, 20, { integer: true })(p.interval) || 5, loop: p.loop === true };
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
    return { value, prefix: line(p.prefix, 10), suffix: line(p.suffix, 16), label, decimals: numberIn(0, 2, { integer: true })(p.decimals) || 0, duration: numberIn(0, 5000, { integer: true })(p.duration) ?? 1500 };
  } },
  testimonial: { label: "Témoignage", category: "marketing", props: (p, at, h) => {
    const text = clean(p.text, 1200), name = line(p.name, 80);
    if (!text || !name) throw new Error(`${at} (témoignage) : le texte et le nom de la personne sont obligatoires (témoignage réel, avec son accord).`);
    const avatar = p.avatar ? h.imageUrl(p.avatar, `${at} (photo du témoignage)`) : "";
    return { text, name, role: line(p.role, 120), ...(avatar ? { avatar } : {}), rating: numberIn(0, 5, { integer: true })(p.rating) || 0 };
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
    const networks = (Array.isArray(p.networks) ? p.networks : []).filter((k, i, a) => Object.hasOwn(SHARE_NETWORKS, k) && a.indexOf(k) === i).slice(0, 6);
    if (!networks.length) throw new Error(`${at} (partage) : au moins un réseau (${Object.values(SHARE_NETWORKS).join(", ")}).`);
    return { networks, size: oneOf("24", "32", "40", "48")(String(p.size)) || "32", shape: oneOf("circle", "square", "plain")(p.shape) || "circle", label: line(p.label, 60) || "Partager cette page", message: line(p.message, 120) };
  } },
  modal: { label: "Fenêtre (modale)", category: "interaction", props: (p, at, h) => {
    const buttonLabel = line(p.buttonLabel, 60), title = line(p.title, 120), text = clean(p.text, 4000);
    if (!buttonLabel || !title || !text) throw new Error(`${at} (fenêtre) : le texte du bouton, le titre et le contenu sont obligatoires.`);
    const ctaUrl = h.linkUrl(p.ctaUrl, `${at} (bouton de la fenêtre)`), ctaLabel = line(p.ctaLabel, 60);
    return { buttonLabel, variant: oneOf("primary", "outline", "ghost")(p.variant) || "primary", title, text, ...(ctaUrl && ctaLabel ? { ctaLabel, ctaUrl } : {}), size: oneOf("sm", "md", "lg")(p.size) || "md",
      // centre : fenêtre ; gauche / droite : panneau qui glisse depuis le bord (« off-canvas »)
      position: oneOf("center", "left", "right")(p.position) || "center" };
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
    return { items, iconColor: color(p.iconColor) || "" };
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
    return { src, alt, spots };
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
  search: { label: "Recherche", category: "dynamic", props: (p) => ({
    target: oneOf("blog", "catalogue")(p.target) || "catalogue", placeholder: line(p.placeholder, 80) || "Rechercher…", button: line(p.button, 30) || "Rechercher",
  }) },
  account: { label: "Compte du visiteur", category: "dynamic", props: (p) => ({
    login: line(p.login, 40) || "Se connecter", account: line(p.account, 40) || "Mon compte", showCart: p.showCart !== false, cart: line(p.cart, 30) || "Panier",
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
  countdown: { label: "Compte à rebours", category: "marketing", props: (p, at) => {
    const until = String(p.until || "");
    const t = Date.parse(until);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(until) || !Number.isFinite(t)) throw new Error(`${at} (compte à rebours) : date et heure de fin invalides.`);
    return { until: new Date(t).toISOString(), endText: line(p.endText, 120) || "C'est terminé." };
  } },
  course: { label: "Formation", category: "commerce", props: (p, at, h) => {
    const courseId = Number(p.courseId);
    if (!getCourse(h.ctx, courseId)) throw new Error(`${at} (formation) : formation introuvable ou non publiée.`);
    return { courseId, cta: line(p.cta, 60) || "Découvrir la formation" };
  } },
  // Logo, titre du site, copyright : contenu lu à l'affichage (logo et nom des réglages SEO, nom du site de la page,
  // année en cours) ; seuls les réglages d'affichage sont enregistrés
  sitelogo: { label: "Logo du site", category: "dynamic", props: (p) => ({ height: numberIn(20, 160, { integer: true })(p.height) || 48, link: p.link !== false }) },
  // Corps de l'article du blog affiché par un modèle « Article du blog » (HTML déjà produit et nettoyé par le blog)
  postcontent: { label: "Contenu de l'article", category: "dynamic", props: () => ({}) },
  // Filtre par catégorie : liens « ?categorie=… » vers la même page (à associer à une grille en boucle « filtrer avec l'adresse »)
  catfilter: { label: "Filtre par catégorie", category: "dynamic", props: (p) => ({ source: oneOf("posts", "courses")(p.source) || "posts", allLabel: line(p.allLabel, 40) || "Toutes", showCount: p.showCount !== false }) },
  sitetitle: { label: "Titre du site", category: "dynamic", props: (p) => ({ tag: oneOf("p", "span", "h1", "h2", "h3")(p.tag) || "p", link: p.link !== false }) },
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
    return { before: line(p.before, 80), words, after: line(p.after, 80), level: oneOf("1", "2", "3", "4", "5", "6")(String(p.level)) || "2", effect: oneOf("fade", "type")(p.effect) || "fade", interval: numberIn(1500, 6000, { integer: true })(p.interval) || 2500 };
  } },
  // Boîte retournable : recto (icône, titre, texte) au repos, verso (titre, texte, bouton) au survol, au focus ou au toucher
  flipbox: { label: "Boîte retournable", category: "interaction", props: (p, at, h) => {
    const frontTitle = line(p.frontTitle, 80), backTitle = line(p.backTitle, 80);
    if (!frontTitle) throw new Error(`${at} (boîte retournable) : le titre du recto est obligatoire.`);
    const icon = h.iconNames.includes(String(p.icon || "")) ? String(p.icon) : "";
    const ctaUrl = h.linkUrl(p.ctaUrl, `${at} (bouton du verso)`), ctaLabel = line(p.ctaLabel, 40);
    return { icon, frontTitle, frontText: clean(p.frontText, 300), backTitle, backText: clean(p.backText, 400), ...(ctaUrl && ctaLabel ? { ctaLabel, ctaUrl } : {}), effect: oneOf("flip", "fade")(p.effect) || "flip", height: numberIn(160, 600, { integer: true })(p.height) || 280 };
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
  readingprogress: { label: "Barre de lecture", category: "interaction", props: (p) => ({ position: oneOf("top", "bottom")(p.position) || "top", thickness: numberIn(2, 10, { integer: true })(p.thickness) || 4 }) },
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
    return { src, alt, title, text: clean(p.text, 600), titleLevel: oneOf("2", "3", "4", "5", "6")(String(p.titleLevel)) || "3", position: oneOf("top", "left", "right")(p.position) || "top", ...(link ? { link, newTab: p.newTab === true && link.startsWith("https://") } : {}) };
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
const SITE_SUB = { sitelogo: SITE_SUBS[0], sitetitle: SITE_SUBS[0], menu: SITE_SUBS[0], breadcrumb: SITE_SUBS[0], search: SITE_SUBS[0], copyright: SITE_SUBS[0], postnav: SITE_SUBS[0],
  postcontent: SITE_SUBS[1], postmeta: SITE_SUBS[1], postterms: SITE_SUBS[1], authorbox: SITE_SUBS[1], postcomments: SITE_SUBS[1], toc: SITE_SUBS[1],
  archiveinfo: SITE_SUBS[2], catfilter: SITE_SUBS[2], querylist: SITE_SUBS[3], posts: SITE_SUBS[3], account: SITE_SUBS[4], minicart: SITE_SUBS[4] };
const WIDGET_SHORTCUTS = [
  { key: "soundcloud", label: "SoundCloud", group: "general", icon: "play", keywords: "soundcloud son musique podcast audio lecteur", type: "embed", provider: "soundcloud" },
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
  { key: "courselist2", label: "Formations (liste dynamique)", group: "site", sub: "Listes dynamiques", icon: "list", keywords: "formations cours catalogue liste dynamique recents", type: "querylist", preset: {"title": "Nos formations", "source": "courses", "mode": "recent", "count": 6, "layout": "cards", "showDate": false} },
];

// ---------- Widgets personnalisés (src/marketing/pages/widgets/*.js) ----------
// Chaque description (champs typés) devient un type d'élément ordinaire : validation, fiche de bibliothèque, contenu de
// départ, champs de l'inspecteur, liens comptés, versions. Voir docs/widgets-personnalises.md.
const CUSTOM_WIDGETS = {};
const emptyValue = (v) => v === undefined || v === null || v === "";
function schemaProps(def) {
  return (p, at, h) => {
    const out = {};
    for (const f of def.schema) {
      const raw = p[f.key], where = `${at} (${def.label}, ${f.label})`;
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
      if (f.required && emptyValue(v)) throw new Error(`${where} : obligatoire.`);
      out[f.key] = v === null ? "" : v;
    }
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
const paletteEntry = (def) => ({ icon: def.icon, blank: () => ({ props: Object.fromEntries(def.schema.filter((f) => f.default !== undefined).map((f) => [f.key, f.default])), ...(def.version > 1 ? { v: def.version } : {}) }) });
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
  container: { icon: "borderBox", blank: () => ({ children: [] }) },
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
  menu: { icon: "menu", blank: () => ({ props: { label: "Menu de la page", items: [{ label: "Programme", url: "/catalogue" }, { label: "Blog", url: "/blog" }] } }) },
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
  fontStyle: ["Style", { normal: "Normal", italic: "Italique" }], lineHeight: ["Interligne"], letterSpacing: ["Espacement des lettres"], wordSpacing: ["Espacement des mots"], textIndent: ["Retrait de première ligne"],
  textTransform: ["Casse", { none: "Normale", uppercase: "MAJUSCULES", lowercase: "minuscules", capitalize: "Première Lettre" }],
  textAlign: ["Alignement du texte", { left: "Gauche", center: "Centre", right: "Droite", justify: "Justifié" }],
  textShadow: ["Ombre du texte", { none: "Aucune", sm: "Légère", md: "Moyenne", lg: "Forte", glow: "Halo clair" }],
  textDecoration: ["Décoration", { none: "Aucune", underline: "Soulignée", "line-through": "Barrée" }],
  color: ["Couleur du texte"], backgroundColor: ["Couleur de fond"],
  borderWidth: ["Épaisseur de bordure"], borderStyle: ["Style de bordure", { none: "Aucune", solid: "Pleine", dashed: "Tirets", dotted: "Points" }], borderColor: ["Couleur de bordure"], borderRadius: ["Arrondi"],
  borderTopWidth: ["Épaisseur haut"], borderRightWidth: ["Épaisseur droite"], borderBottomWidth: ["Épaisseur bas"], borderLeftWidth: ["Épaisseur gauche"],
  borderTopLeftRadius: ["Arrondi haut gauche"], borderTopRightRadius: ["Arrondi haut droit"], borderBottomRightRadius: ["Arrondi bas droit"], borderBottomLeftRadius: ["Arrondi bas gauche"],
  backdropBlur: ["Flou de l'arrière-plan (px)"],
  boxShadow: ["Ombre", { none: "Aucune", sm: "Légère", md: "Moyenne", lg: "Forte", xl: "Très forte" }], opacity: ["Opacité"],
  overflow: ["Débordement", { visible: "Visible", hidden: "Masqué", auto: "Défilement" }],
  gridAutoFlow: ["Remplissage", { row: "Ligne par ligne", column: "Colonne par colonne", "row dense": "Lignes, sans trous", "column dense": "Colonnes, sans trous" }],
  justifyItems: ["Alignement horizontal des cases", { stretch: "Étirer", start: "Début", center: "Centre", end: "Fin" }],
  position: ["Position", { static: "Normale", relative: "Relative", sticky: "Collante", absolute: "Absolue (dans le parent)", fixed: "Fixe (à l'écran)" }], top: ["Décalage haut"], right: ["Décalage droite"], bottom: ["Décalage bas"], left: ["Décalage gauche"],
  transformOrigin: ["Origine des transformations", { center: "Centre", top: "Haut", bottom: "Bas", left: "Gauche", right: "Droite", "top left": "Haut gauche", "top right": "Haut droit", "bottom left": "Bas gauche", "bottom right": "Bas droit" }],
  transitionDuration: ["Durée des transitions (ms)"], zIndex: ["Plan (z-index)"],
  objectFit: ["Cadrage", { cover: "Remplir", contain: "Contenir", fill: "Étirer", none: "Taille réelle" }],
  objectPosition: ["Point focal", { center: "Centre", top: "Haut", bottom: "Bas", left: "Gauche", right: "Droite" }],
  aspectRatio: ["Proportions", { auto: "Libres", "1/1": "1:1", "4/3": "4:3", "3/2": "3:2", "16/9": "16:9", "21/9": "21:9", "3/4": "3:4" }],
  backgroundSize: ["Taille du fond", { cover: "Couvrir", contain: "Contenir", auto: "Réelle" }],
  backgroundRepeat: ["Répétition du fond", { "no-repeat": "Aucune", repeat: "Mosaïque", "repeat-x": "Horizontale", "repeat-y": "Verticale" }],
  backgroundAttachment: ["Défilement du fond", { scroll: "Avec la page", fixed: "Fixe (effet parallaxe)" }],
  backgroundPosition: ["Position du fond", { center: "Centre", top: "Haut", bottom: "Bas", left: "Gauche", right: "Droite" }],
};
const GROUP_LABELS = { layout: "Mise en page", size: "Dimensions", spacing: "Espacement", typography: "Typographie", color: "Couleurs", background: "Fond", border: "Bordure", effects: "Effets", position: "Position", media: "Image", mask: "Masque" };
// Description de l'éditeur (envoyée au navigateur) : types, palette, propriétés de style, écrans, états
function editorSpec() {
  const kind = (k) => {
    const p = STYLE_PROPS[k];
    if (p.check === color || [ "color", "backgroundColor", "borderColor" ].includes(k)) return "color";
    if (["columns", "lineHeight", "opacity", "zIndex", "flexGrow", "flexShrink", "order", "gridRows", "gridColumnSpan", "gridRowSpan", "gridColumnStart", "gridColumnEnd", "gridRowStart", "gridRowEnd", "transitionDuration", "backdropBlur"].includes(k)) return "number";
    if (k === "gridTemplate" || k === "gridRowsTemplate") return "text";
    return STYLE_UI[k] && STYLE_UI[k][1] ? "enum" : "length";
  };
  return {
    types: Object.entries(NODE_TYPES).map(([type, d]) => ({ type, label: d.label, category: d.category, group: WIDGETS[type][0], ...(SITE_SUB[type] ? { sub: SITE_SUB[type] } : {}), keywords: WIDGETS[type][1], requires: widgetRequires(type), capabilities: capsOf(type), version: d.version || 1, ...(d.custom ? { schema: CUSTOM_WIDGETS[type].schema.map((f) => ({ ...f })), style: CUSTOM_WIDGETS[type].style || "text" } : {}), container: Boolean(d.container), icon: PALETTE[type].icon, asks: PALETTE[type].asks || null, blank: PALETTE[type].blank() })),
    categories: CATEGORIES, widgetGroups: WIDGET_GROUPS, siteSubs: SITE_SUBS, scrollFx: Object.entries(SCROLL_FX).map(([key, r]) => ({ key, ...r })), scrollRange: Object.entries(SCROLL_RANGE).map(([key, r]) => ({ key, ...r })), scrollDirs: Object.entries(SCROLL_DIRS), mouseRange: Object.entries(MOUSE_RANGE).map(([key, r]) => ({ key, ...r })), mouseModes: Object.entries(MOUSE_MODES), maskShapes: Object.entries(MASK_SHAPES).map(([k, v]) => [k, v[0]]), shortcuts: WIDGET_SHORTCUTS.map((s) => ({ ...s, pattern: s.provider ? EMBED_PROVIDERS.find((x) => x.key === s.provider).re.source : null })), widgetPermissions: WIDGET_PERMISSIONS, boxTags: BOX_TAGS,
    styleProps: Object.entries(STYLE_PROPS).map(([key, p]) => ({ key, group: p.group, label: STYLE_UI[key][0], kind: kind(key), options: STYLE_UI[key][1] ? Object.entries(STYLE_UI[key][1]).map(([v, l]) => [v, l]) : null })),
    ixTriggers: Object.entries(IX_TRIGGERS), ixActions: Object.entries(IX_ACTIONS), easings: Object.keys(EASINGS), embedProviders: EMBED_PROVIDERS.map((p) => p.label),
    socialNetworks: Object.entries(SOCIAL_NETWORKS), shareNetworks: Object.entries(SHARE_NETWORKS), audiences: Object.entries(AUDIENCES), entrances: Object.entries(ENTRANCES), animations: MOTION.catalog(), animationCategories: MOTION.CATEGORY_ORDER, motionCss: MOTION.allKeyframesCss(), motionTriggers: Object.entries(MOTION.TRIGGERS), motionEasings: Object.keys(EASINGS), hovers: Object.entries(HOVERS), groups: GROUP_LABELS, breakpoints: BREAKPOINTS.map(({ key, label }) => ({ key, label })), states: STATES.map(({ key, label }) => ({ key, label })),
    structureKinds: require("./structures").KINDS, structures: require("./structures").STRUCTURES,
    colorTokens: COLOR_TOKENS, spacingScale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 80, 96], icons: iconNames(),
    limits: { nodes: MAX_NODES, depth: MAX_DEPTH }, dynamic: dynamic.catalog(),
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
function normalizeAudience(raw, at) {
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
// Le visiteur correspond-il ? visitor = { known, student, subscribed, customer, tags: Set, score }
function audienceMatches(audience, visitor) {
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
  { key: "canva", label: "Canva (lien « Intégrer »)", re: /^https:\/\/www\.canva\.com\/design\/([\w-]{6,40})\/([\w-]{6,40})\/view/i, src: (m) => `https://www.canva.com/design/${m[1]}/${m[2]}/view?embed`, ratio: "16/9" },
];
function embedOf(url) {
  const u = String(url || "").trim();
  for (const p of EMBED_PROVIDERS) { const m = p.re.exec(u); if (m) return { provider: p.key, label: p.label, src: p.src(m), ratio: p.ratio }; }
  return null;
}

// Réseaux sociaux proposés (pictogrammes dessinés pour KOLAKISA, dans views/marketing-public/_social-icon.ejs)
const SHARE_NETWORKS = { facebook: "Facebook", x: "X (Twitter)", linkedin: "LinkedIn", whatsapp: "WhatsApp", email: "E-mail" };
const SOCIAL_NETWORKS = { facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn", youtube: "YouTube", x: "X (Twitter)", tiktok: "TikTok", whatsapp: "WhatsApp", email: "E-mail", website: "Site web" };

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
  return from || until ? { ...(from ? { from } : {}), ...(until ? { until } : {}) } : undefined;
}
const scheduleMatches = (s, now = Date.now()) => !s || ((!s.from || Date.parse(s.from) <= now) && (!s.until || Date.parse(s.until) > now));

// ---------- Animations : entrée (à l'apparition à l'écran) et effet au survol ----------
// Registre central des animations : src/marketing/pages/motion.js (une animation = une ligne ; le panneau, la validation, le CSS publié et l'aperçu le lisent)
const MOTION = require("./motion");
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
const MASK_SHAPES = {
  circle: ["Cercle", "circle(50% at 50% 50%)"], ellipse: ["Ellipse", "ellipse(50% 38% at 50% 50%)"], triangle: ["Triangle", "polygon(50% 0%, 100% 100%, 0% 100%)"],
  diamond: ["Losange", "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"], pentagon: ["Pentagone", "polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)"],
  hexagon: ["Hexagone", "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)"],
  octagon: ["Octogone", "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)"],
  star: ["Étoile", "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"],
};
const HOVERS = { grow: "Grossit", shrink: "Rétrécit", lift: "Se soulève", tilt: "S'incline" };
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
    if (off.length && off.length < BREAKPOINTS.length) out.off = off;
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
    if (hideOn.length === BREAKPOINTS.length) throw new Error(`${where} : un élément ne peut pas être masqué sur tous les écrans (utilisez « Masquer »).`);
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
  if (def.container && raw.bgVideo && raw.bgVideo.src) {
    const src = line(raw.bgVideo.src, 1000);
    if (!/^(https:\/\/[^\s<>"'`\\/@]+\/[^\s<>"'`\\]*|\/uploads\/[a-z0-9/_.-]+)\.(mp4|webm)(\?[^\s<>"'`\\]*)?$/i.test(src)) throw new Error(`${where} : vidéo de fond : fichier .mp4 ou .webm (https:// ou médiathèque).`);
    node.bgVideo = { src };
  }
  const styles = normalizeStyles(raw.styles, raw.states, where, h);
  if (styles.styles) node.styles = styles.styles;
  if (styles.states) node.states = styles.states;
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
  if (!m) return "";
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
  return a;
}

// CSS d'une page : une règle par élément stylé (et par section stylée), par écran et par état. Valeurs déjà validées.
// breakpoints : { tablet, mobile } = largeurs maximales (px) des écrans « Tablette » et « Mobile » du site (réglages du site)
const DEFAULT_BREAKPOINTS = { tablet: 1023, mobile: 767 };
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
      out.push({ name, ...(line(c.label, 60) ? { label: line(c.label, 60) } : {}), ...(st.styles ? { styles: st.styles } : {}), ...(st.states ? { states: st.states } : {}) });
    } catch (e) { if (strict) throw e; }
  }
  return out;
}
function classCss(classes, breakpoints = DEFAULT_BREAKPOINTS) {
  const base = [], media = { tablet: [], mobile: [] };
  const mediaOf = (key) => (key === "tablet" ? `(max-width: ${breakpoints.tablet}px)` : `(max-width: ${breakpoints.mobile}px)`);
  for (const c of classes || []) {
    if (!/^[a-z][a-z0-9-]{0,29}$/.test(c.name)) continue;
    const sel = `.lp-site :where(.${c.name})`;
    for (const bp of BREAKPOINTS) { const d = c.styles && c.styles[bp.key] ? declarations(c.styles[bp.key]) : ""; if (d) (bp.media ? media[bp.key] : base).push(`${sel}{${d}}`); }
    for (const state of STATES) { const d = c.states && c.states[state.key] ? declarations(c.states[state.key]) : ""; if (d) base.push(`${sel}${state.sel}{${d}}`); }
  }
  return [...base, ...["tablet", "mobile"].filter((k) => media[k].length).map((k) => `@media ${mediaOf(k)}{${media[k].join("")}}`)].join("\n");
}
function pageCss(sections, breakpoints = DEFAULT_BREAKPOINTS) {
  const mediaOf = (bp) => (bp.key === "tablet" ? `(max-width: ${breakpoints.tablet}px)` : bp.key === "mobile" ? `(max-width: ${breakpoints.mobile}px)` : bp.media);
  const rules = { base: [], custom: [], media: Object.fromEntries(BREAKPOINTS.filter((b) => b.media).map((b) => [b.key, []])) };
  const usedAnims = new Set(); // animations réellement utilisées : seules leurs images-clés sont écrites dans la page
  const clamps = { tablet: [], mobile: [] }; // cases de grille ramenées au nombre de colonnes de l'écran : écrites après toutes les autres règles
  const add = (id, styles, states) => {
    if (!NODE_ID.test(String(id || ""))) return;
    const sel = `.kw-n-${id}`;
    for (const bp of BREAKPOINTS) {
      const d = styles && styles[bp.key] ? declarations(styles[bp.key]) : "";
      if (!d) continue;
      (bp.media ? rules.media[bp.key] : rules.base).push(`${sel}{${d}}`);
    }
    for (const state of STATES) {
      const d = states && states[state.key] ? declarations(states[state.key]) : "";
      if (d) rules.base.push(`${sel}${state.sel}{${d}}`);
    }
  };
  const seenIds = new Set(); // les copies d'un modèle de boucle partagent leur identifiant : règles écrites une seule fois
  for (const s of sections || []) {
    add(s.id, s.styles, s.states);
    if (s.type === "layout") walk(s.children, (n) => {
      if (seenIds.has(n.id)) return;
      seenIds.add(n.id);
      add(n.id, n.styles, n.states);
      entranceRules(n, rules, usedAnims);
      // CSS personnalisé de l'élément (validé à l'enregistrement, revalidé ici : rien d'autre n'atteint la page)
      if (n.css && NODE_ID.test(String(n.id || ""))) { try { const c = cssDeclarations(n.css, "CSS"); if (c) rules.custom.push(`.kw-node.kw-n-${n.id}{${c}}`); } catch { /* ignoré */ } }
      if (n.cssHover && NODE_ID.test(String(n.id || ""))) { try { const c = cssDeclarations(n.cssHover, "CSS"); if (c) rules.custom.push(`.kw-node.kw-n-${n.id}:hover{${c}}`); } catch { /* ignoré */ } }
      // Barre de progression : sa largeur vient de sa valeur (validée 0–100), pas d'un style écrit dans la page
      if (n.type === "hotspot" && NODE_ID.test(String(n.id || "")) && n.props) n.props.spots.forEach((sp, k) => rules.base.push(`.kw-n-${n.id}-s${k}{left:${Number(sp.x)}%;top:${Number(sp.y)}%}`));
      if (n.type === "iconlist" && NODE_ID.test(String(n.id || "")) && n.props && n.props.iconColor) rules.base.push(`.kw-n-${n.id} .kw-iconlist-icon{color:${colorCss(n.props.iconColor)}}`);
      if ((n.type === "social" || n.type === "sharebuttons") && NODE_ID.test(String(n.id || "")) && n.props) rules.base.push(`.kw-n-${n.id}{--kw-soc:${Number(n.props.size) || 32}px}`);
      if (n.type === "divider" && NODE_ID.test(String(n.id || "")) && n.props && (n.props.lineStyle !== "solid" || n.props.thickness > 1 || n.props.color)) rules.base.push(`.kw-n-${n.id}${n.props.text ? "::before,.kw-n-" + n.id + "::after" : ""}{${n.props.text ? "" : "border:0;"}border-top:${n.props.thickness}px ${n.props.lineStyle} ${n.props.color ? colorCss(n.props.color) : "currentColor"}}`);
      if (n.type === "sitelogo" && NODE_ID.test(String(n.id || "")) && n.props && Number.isInteger(n.props.height)) rules.base.push(`.kw-n-${n.id} .kw-sitelogo-img{height:${n.props.height}px}`);
      if (n.type === "flipbox" && NODE_ID.test(String(n.id || "")) && n.props && Number.isInteger(n.props.height)) rules.base.push(`.kw-n-${n.id}{min-height:${n.props.height}px}`);
      if (n.type === "readingprogress" && NODE_ID.test(String(n.id || "")) && n.props && Number.isInteger(n.props.thickness)) rules.base.push(`.kw-n-${n.id} .kw-readbar{height:${n.props.thickness}px}`);
      if (n.type === "rating" && NODE_ID.test(String(n.id || "")) && n.props && Number.isFinite(n.props.value)) rules.base.push(`.kw-n-${n.id} .kw-rating-fill{width:${Math.round((n.props.value / (n.props.scale || 5)) * 1000) / 10}%}`);
      if (n.type === "map" && NODE_ID.test(String(n.id || "")) && n.props && Number.isInteger(n.props.height)) rules.base.push(`.kw-n-${n.id} .kw-map-frame{height:${n.props.height}px}`);
      if (n.type === "progress" && NODE_ID.test(String(n.id || "")) && Number.isInteger(n.props && n.props.value)) rules.base.push(`.kw-n-${n.id} .kw-progress-bar{width:${n.props.value}%}`);
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
    css += `\n@media (min-width:${breakpoints.tablet + 1}px){.lp-hide-desktop{display:none}}\n@media (min-width:${breakpoints.mobile + 1}px) and (max-width:${breakpoints.tablet}px){.lp-hide-tablet{display:none}}\n@media (max-width:${breakpoints.mobile}px){.lp-hide-mobile{display:none}}`;
  }
  // Le CSS personnalisé vient en dernier (il précise les réglages de l'inspecteur), avec une spécificité plus forte
  if (rules.custom.length) css += `\n${rules.custom.join("\n")}`;
  return css.replace(/</g, "");
}

module.exports = {
  dynamic, registerCondition, normalizeClassDefs, classCss, GLOBAL_CLASS_MAX,
  NODE_TYPES, CATEGORIES, WIDGET_GROUPS, WIDGETS, CUSTOM_WIDGETS, registerWidget, lockedWidgetChanges, PALETTE, STYLE_UI, editorSpec, STYLE_PROPS, COMPOSED, BREAKPOINTS, STATES, SHADOWS, FONT_STACKS, COLOR_TOKENS, MAX_NODES, MAX_DEPTH,
  capsOf, MOTION, motionAttrs, MASK_SHAPES, SCROLL_FX, SCROLL_RANGE, MOUSE_RANGE, MOUSE_MODES, AUDIENCES, normalizeAudience, audienceMatches, audienceLabel, normalizePageCss, cssDeclarations, scheduleMatches, embedOf, sanitizeHtmlBlock, normalizeNode, normalizeStyles, sanitizeRich, walk, visibleTree, pageCss, newNodeId, iconNames,
};
