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
  if (s.startsWith("token:") && COLOR_TOKENS.includes(s.slice(6))) return s;
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
const SHADOWS = { none: "none", sm: "0 1px 3px rgba(15,23,42,.12)", md: "0 6px 16px rgba(15,23,42,.12)", lg: "0 14px 34px rgba(15,23,42,.16)", xl: "0 24px 60px rgba(15,23,42,.2)" };

// Propriétés de style : clé du modèle → propriété CSS et validateur. Chaque contrôle de l'inspecteur correspond à une ligne.
const len = lengthOf(), lenAuto = lengthOf({ auto: true }), lenNeg = lengthOf({ negative: true }), marginLen = lengthOf({ auto: true, negative: true });
const STYLE_PROPS = {
  display: { css: "display", check: oneOf("block", "flex", "grid", "inline-block", "none"), group: "layout" },
  flexDirection: { css: "flex-direction", check: oneOf("row", "column", "row-reverse", "column-reverse"), group: "layout" },
  flexWrap: { css: "flex-wrap", check: oneOf("wrap", "nowrap"), group: "layout" },
  justifyContent: { css: "justify-content", check: oneOf("flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"), group: "layout" },
  alignItems: { css: "align-items", check: oneOf("stretch", "flex-start", "center", "flex-end", "baseline"), group: "layout" },
  alignSelf: { css: "align-self", check: oneOf("auto", "flex-start", "center", "flex-end", "stretch"), group: "layout" },
  gap: { css: "gap", check: len, group: "layout" },
  columns: { css: "grid-template-columns", check: numberIn(1, 12, { integer: true }), out: (n) => `repeat(${n}, minmax(0, 1fr))`, group: "layout" },
  width: { css: "width", check: lenAuto, group: "size" },
  height: { css: "height", check: lenAuto, group: "size" },
  minWidth: { css: "min-width", check: len, group: "size" },
  maxWidth: { css: "max-width", check: len, group: "size" },
  minHeight: { css: "min-height", check: len, group: "size" },
  maxHeight: { css: "max-height", check: len, group: "size" },
  // Part de largeur d'une colonne dans « Colonnes » (proportions : 1 / 1 = moitié-moitié, 2 / 1 = deux tiers - un tiers)
  flexGrow: { css: "flex-grow", check: numberIn(0.05, 20), group: "size" },
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
  textTransform: { css: "text-transform", check: oneOf("none", "uppercase", "lowercase", "capitalize"), group: "typography" },
  textAlign: { css: "text-align", check: oneOf("left", "center", "right", "justify"), group: "typography" },
  textDecoration: { css: "text-decoration", check: oneOf("none", "underline", "line-through"), group: "typography" },
  color: { css: "color", check: color, out: colorCss, group: "color" },
  backgroundColor: { css: "background-color", check: color, out: colorCss, group: "color" },
  borderWidth: { css: "border-width", check: len, group: "border" },
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
  position: { css: "position", check: oneOf("static", "relative", "sticky"), group: "position" },
  top: { css: "top", check: lenNeg, group: "position" },
  left: { css: "left", check: lenNeg, group: "position" },
  zIndex: { css: "z-index", check: numberIn(-10, 100, { integer: true }), group: "position" },
  objectFit: { css: "object-fit", check: oneOf("cover", "contain", "fill", "none"), group: "media" },
  objectPosition: { css: "object-position", check: oneOf("center", "top", "bottom", "left", "right"), group: "media" },
  aspectRatio: { css: "aspect-ratio", check: oneOf("auto", "1/1", "4/3", "3/2", "16/9", "21/9", "3/4"), out: (v) => v.replace("/", " / "), group: "media" },
  backgroundSize: { css: "background-size", check: oneOf("cover", "contain", "auto"), group: "background" },
  backgroundPosition: { css: "background-position", check: oneOf("center", "top", "bottom", "left", "right"), group: "background" },
};
// Propriétés composées (plusieurs valeurs → une déclaration)
const COMPOSED = {
  backgroundImage: { group: "background" },     // { src } : image de la médiathèque ou https://
  gradient: { group: "background" },            // { from, to, angle }
  transform: { group: "position" },             // { x, y, rotate, scale }
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
    } else if (k === "gradient") {
      const from = color(v && v.from), to = color(v && v.to), angle = numberIn(0, 360, { integer: true })(v && v.angle);
      if (from && to) out.gradient = { from, to, angle: angle === null ? 180 : angle };
    } else if (k === "transform") {
      const t = {};
      const x = lenNeg(v && v.x), y = lenNeg(v && v.y), r = numberIn(-360, 360, { integer: true })(v && v.rotate), s = numberIn(0.1, 3)(v && v.scale);
      if (x) t.x = x; if (y) t.y = y; if (r !== null && r !== 0) t.rotate = r; if (s !== null && s !== 1) t.scale = s;
      if (Object.keys(t).length) out.transform = t;
    }
  }
  return out;
}

const CORNERS = new Set(["borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius"]);
function declarations(set) {
  const d = [];
  const entries = Object.entries(set);
  // Coins après l'arrondi général (sinon « border-radius » les écraserait)
  for (const [k, v] of entries.filter(([k]) => !CORNERS.has(k)).concat(entries.filter(([k]) => CORNERS.has(k)))) {
    const p = STYLE_PROPS[k];
    if (p) d.push(`${p.css}:${p.out ? p.out(v) : v}`);
  }
  const layers = [];
  if (set.gradient) layers.push(`linear-gradient(${set.gradient.angle}deg, ${colorCss(set.gradient.from)}, ${colorCss(set.gradient.to)})`);
  if (set.backgroundImage) layers.push(`url("${set.backgroundImage.src}")`);
  if (layers.length) d.push(`background-image:${layers.join(", ")}`);
  if (set.transform) {
    const t = set.transform, parts = [];
    if (t.x || t.y) parts.push(`translate(${t.x || "0"}, ${t.y || "0"})`);
    if (t.rotate) parts.push(`rotate(${t.rotate}deg)`);
    if (t.scale) parts.push(`scale(${t.scale})`);
    d.push(`transform:${parts.join(" ")}`);
  }
  return d.join(";");
}

// ---------- Registre des éléments ----------
// container : accepte des enfants. Les éléments « feuilles » portent leur contenu dans props.
const NODE_TYPES = {
  container: { label: "Conteneur", category: "structure", container: true, props: () => ({}) },
  columns: { label: "Colonnes", category: "structure", container: true, props: () => ({}) },
  column: { label: "Colonne", category: "structure", container: true, props: () => ({}) },
  grid: { label: "Grille", category: "structure", container: true, props: () => ({}) },
  stack: { label: "Pile", category: "structure", container: true, props: () => ({}) },
  group: { label: "Groupe", category: "structure", container: true, props: () => ({}) },
  spacer: { label: "Espace", category: "structure", props: (p) => ({ size: oneOf("8", "16", "24", "32", "48", "64", "80", "96", "128")(String(p.size)) || "32" }) },
  divider: { label: "Séparateur", category: "structure", props: () => ({}) },
  heading: { label: "Titre", category: "text", props: (p, at) => {
    // Vide permis dans le brouillon (bloc en cours d'écriture) : jamais affiché sur la page publique
    const text = line(p.text, 200);
    return { text, level: oneOf("1", "2", "3", "4", "5", "6")(String(p.level)) || "2" };
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
    return { src, alt, decorative: p.decorative === true && !alt, link: h.linkUrl(p.link, `${at} (lien de l'image)`), caption: line(p.caption, 200) };
  } },
  gallery: { label: "Galerie", category: "media", props: (p, at, h) => {
    const images = (Array.isArray(p.images) ? p.images : []).slice(0, 24).map((im, i) => {
      const src = h.imageUrl(im && im.src, `${at} (image ${i + 1} de la galerie)`);
      const alt = line(im && im.alt, 200);
      if (src && !alt) throw new Error(`${at} (galerie) : texte de remplacement manquant pour l'image ${i + 1}.`);
      return src ? { src, alt } : null;
    }).filter(Boolean);
    if (!images.length) throw new Error(`${at} (galerie) : au moins une image.`);
    return { images };
  } },
  video: { label: "Vidéo", category: "media", props: (p, at, h) => {
    const url = line(p.url, 500);
    if (!url || !parseVideoUrl(url)) throw new Error(`${at} (vidéo) : adresse YouTube, Vimeo ou fichier vidéo https:// attendue.`);
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
    if (!/^https:\/\/[^\s<>"'`\\/@]+\/[^\s<>"'`\\]*\.(mp3|m4a|ogg|wav)(\?[^\s<>"'`\\]*)?$/i.test(src)) throw new Error(`${at} (audio) : adresse https:// d'un fichier .mp3, .m4a, .ogg ou .wav attendue.`);
    return { src, title: line(p.title, 150) };
  } },
  button: { label: "Bouton", category: "interaction", props: (p, at, h) => {
    const label = line(p.label, 80), url = h.linkUrl(p.url, `${at} (bouton)`);
    if (!label || !url) throw new Error(`${at} (bouton) : un texte et une adresse sont obligatoires.`);
    return { label, url, variant: oneOf("primary", "outline", "ghost")(p.variant) || "primary", newTab: p.newTab === true && url.startsWith("https://") };
  } },
  link: { label: "Lien", category: "interaction", props: (p, at, h) => {
    const label = line(p.label, 120), url = h.linkUrl(p.url, `${at} (lien)`);
    if (!label || !url) throw new Error(`${at} (lien) : un texte et une adresse sont obligatoires.`);
    return { label, url, newTab: p.newTab === true && url.startsWith("https://") };
  } },
  accordion: { label: "Accordéon / FAQ", category: "interaction", props: (p, at) => {
    const items = (Array.isArray(p.items) ? p.items : []).map((x) => ({ q: line(x && x.q, 200), a: clean(x && x.a, 2000) })).filter((x) => x.q && x.a).slice(0, 30);
    if (!items.length) throw new Error(`${at} (accordéon) : au moins une question avec sa réponse.`);
    return { items, faqSchema: p.faqSchema === true, openFirst: p.openFirst === true };
  } },
  tabs: { label: "Onglets", category: "interaction", props: (p, at) => {
    const items = (Array.isArray(p.items) ? p.items : []).map((x) => ({ title: line(x && x.title, 60), text: clean(x && x.text, 2000) })).filter((x) => x.title && x.text).slice(0, 8);
    if (items.length < 2) throw new Error(`${at} (onglets) : au moins deux onglets avec un titre et un texte.`);
    return { items };
  } },
  table: { label: "Tableau", category: "text", props: (p, at) => {
    const rows = (Array.isArray(p.rows) ? p.rows : []).slice(0, 40).map((r) => (Array.isArray(r) ? r.slice(0, 8).map((c) => line(c, 200)) : [])).filter((r) => r.some(Boolean));
    if (!rows.length) throw new Error(`${at} (tableau) : au moins une ligne.`);
    const width = Math.max(...rows.map((r) => r.length));
    return { rows: rows.map((r) => r.concat(Array(width - r.length).fill(""))), header: p.header !== false, caption: line(p.caption, 150) };
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
  icon: { label: "Icône", category: "media", props: (p, at, h) => {
    const name = String(p.name || "");
    if (!h.iconNames.includes(name)) throw new Error(`${at} (icône) : icône inconnue.`);
    return { name, label: line(p.label, 80), size: oneOf("16", "24", "32", "48", "64")(String(p.size)) || "32" };
  } },
};
const CATEGORIES = { structure: "Structure", text: "Texte", media: "Média", interaction: "Interaction", marketing: "Marketing", commerce: "Formations" };

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
  icon: { icon: "star", blank: () => ({ props: { name: "star", size: "32" } }) },
};

// Libellés et contrôles des propriétés de style (inspecteur) : un contrôle = une propriété réelle de STYLE_PROPS
const STYLE_UI = {
  display: ["Affichage", { block: "Bloc", flex: "Flex", grid: "Grille", "inline-block": "En ligne", none: "Caché" }],
  flexDirection: ["Direction", { row: "En ligne", column: "En colonne", "row-reverse": "Ligne inversée", "column-reverse": "Colonne inversée" }],
  flexWrap: ["Retour à la ligne", { wrap: "Oui", nowrap: "Non" }],
  justifyContent: ["Répartition", { "flex-start": "Début", center: "Centre", "flex-end": "Fin", "space-between": "Espacés", "space-around": "Autour", "space-evenly": "Égaux" }],
  alignItems: ["Alignement des enfants", { stretch: "Étirés", "flex-start": "Début", center: "Centre", "flex-end": "Fin", baseline: "Ligne de base" }],
  alignSelf: ["Alignement dans le parent", { auto: "Auto", "flex-start": "Début", center: "Centre", "flex-end": "Fin", stretch: "Étiré" }],
  gap: ["Écart entre enfants"], columns: ["Colonnes (grille)"],
  width: ["Largeur"], height: ["Hauteur"], flexGrow: ["Proportion de la colonne"], minWidth: ["Largeur min."], maxWidth: ["Largeur max."], minHeight: ["Hauteur min."], maxHeight: ["Hauteur max."],
  marginTop: ["Marge haut"], marginRight: ["Marge droite"], marginBottom: ["Marge bas"], marginLeft: ["Marge gauche"],
  paddingTop: ["Intérieur haut"], paddingRight: ["Intérieur droite"], paddingBottom: ["Intérieur bas"], paddingLeft: ["Intérieur gauche"],
  fontFamily: ["Police", { heading: "Titres du site", body: "Texte du site", system: "Système", serif: "Avec empattements", mono: "Chasse fixe" }],
  fontSize: ["Taille"], fontWeight: ["Graisse", { 300: "Légère", 400: "Normale", 500: "Moyenne", 600: "Demi-grasse", 700: "Grasse", 800: "Extra-grasse", 900: "Noire" }],
  fontStyle: ["Style", { normal: "Normal", italic: "Italique" }], lineHeight: ["Interligne"], letterSpacing: ["Espacement des lettres"],
  textTransform: ["Casse", { none: "Normale", uppercase: "MAJUSCULES", lowercase: "minuscules", capitalize: "Première Lettre" }],
  textAlign: ["Alignement du texte", { left: "Gauche", center: "Centre", right: "Droite", justify: "Justifié" }],
  textDecoration: ["Décoration", { none: "Aucune", underline: "Soulignée", "line-through": "Barrée" }],
  color: ["Couleur du texte"], backgroundColor: ["Couleur de fond"],
  borderWidth: ["Épaisseur de bordure"], borderStyle: ["Style de bordure", { none: "Aucune", solid: "Pleine", dashed: "Tirets", dotted: "Points" }], borderColor: ["Couleur de bordure"], borderRadius: ["Arrondi"],
  borderTopLeftRadius: ["Arrondi haut gauche"], borderTopRightRadius: ["Arrondi haut droit"], borderBottomRightRadius: ["Arrondi bas droit"], borderBottomLeftRadius: ["Arrondi bas gauche"],
  boxShadow: ["Ombre", { none: "Aucune", sm: "Légère", md: "Moyenne", lg: "Forte", xl: "Très forte" }], opacity: ["Opacité"],
  overflow: ["Débordement", { visible: "Visible", hidden: "Masqué", auto: "Défilement" }],
  position: ["Position", { static: "Normale", relative: "Relative", sticky: "Collante" }], top: ["Décalage haut"], left: ["Décalage gauche"], zIndex: ["Plan (z-index)"],
  objectFit: ["Cadrage", { cover: "Remplir", contain: "Contenir", fill: "Étirer", none: "Taille réelle" }],
  objectPosition: ["Point focal", { center: "Centre", top: "Haut", bottom: "Bas", left: "Gauche", right: "Droite" }],
  aspectRatio: ["Proportions", { auto: "Libres", "1/1": "1:1", "4/3": "4:3", "3/2": "3:2", "16/9": "16:9", "21/9": "21:9", "3/4": "3:4" }],
  backgroundSize: ["Taille du fond", { cover: "Couvrir", contain: "Contenir", auto: "Réelle" }],
  backgroundPosition: ["Position du fond", { center: "Centre", top: "Haut", bottom: "Bas", left: "Gauche", right: "Droite" }],
};
const GROUP_LABELS = { layout: "Mise en page", size: "Dimensions", spacing: "Espacement", typography: "Typographie", color: "Couleurs", background: "Fond", border: "Bordure", effects: "Effets", position: "Position", media: "Image" };
// Description de l'éditeur (envoyée au navigateur) : types, palette, propriétés de style, écrans, états
function editorSpec() {
  const kind = (k) => {
    const p = STYLE_PROPS[k];
    if (p.check === color || [ "color", "backgroundColor", "borderColor" ].includes(k)) return "color";
    if (["columns", "lineHeight", "opacity", "zIndex", "flexGrow"].includes(k)) return "number";
    return STYLE_UI[k] && STYLE_UI[k][1] ? "enum" : "length";
  };
  return {
    types: Object.entries(NODE_TYPES).map(([type, d]) => ({ type, label: d.label, category: d.category, container: Boolean(d.container), icon: PALETTE[type].icon, asks: PALETTE[type].asks || null, blank: PALETTE[type].blank() })),
    categories: CATEGORIES,
    styleProps: Object.entries(STYLE_PROPS).map(([key, p]) => ({ key, group: p.group, label: STYLE_UI[key][0], kind: kind(key), options: STYLE_UI[key][1] ? Object.entries(STYLE_UI[key][1]).map(([v, l]) => [v, l]) : null })),
    audiences: Object.entries(AUDIENCES), groups: GROUP_LABELS, breakpoints: BREAKPOINTS.map(({ key, label }) => ({ key, label })), states: STATES.map(({ key, label }) => ({ key, label })),
    colorTokens: COLOR_TOKENS, spacingScale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 80, 96], icons: iconNames(),
    limits: { nodes: MAX_NODES, depth: MAX_DEPTH },
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
};
function normalizeAudience(raw, at) {
  if (!raw || typeof raw !== "object" || !raw.who) return undefined;
  if (!Object.hasOwn(AUDIENCES, raw.who)) throw new Error(`${at} : public d'affichage inconnu.`);
  if (raw.who === "tag" || raw.who === "not_tag") {
    const tag = line(raw.value, 60);
    if (!tag) throw new Error(`${at} : indiquez l'étiquette.`);
    return { who: raw.who, value: tag };
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
    default: return true;
  }
}
const audienceLabel = (a) => (a ? `${AUDIENCES[a.who]}${a.value !== undefined ? ` ${a.value}` : ""}`.replace("… ", " : ") : "");

// ---------- Normalisation d'un arbre ----------
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
  const node = { id, type: raw.type, props: def.props(raw.props && typeof raw.props === "object" ? raw.props : {}, where, h) };
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
  const audience = normalizeAudience(raw.audience, where);
  if (audience) node.audience = audience;
  const styles = normalizeStyles(raw.styles, raw.states, where, h);
  if (styles.styles) node.styles = styles.styles;
  if (styles.states) node.states = styles.states;
  if (def.container) {
    const kids = Array.isArray(raw.children) ? raw.children : [];
    node.children = kids.map((c, i) => normalizeNode(c, `${where} › élément ${i + 1}`, h, depth + 1, counter));
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
const visibleTree = (nodes, visitor) => (nodes || []).filter((n) => !n.hidden && (visitor === undefined || audienceMatches(n.audience, visitor))).map((n) => (n.children ? { ...n, children: visibleTree(n.children, visitor) } : n));

// CSS d'une page : une règle par élément stylé (et par section stylée), par écran et par état. Valeurs déjà validées.
function pageCss(sections) {
  const rules = { base: [], media: Object.fromEntries(BREAKPOINTS.filter((b) => b.media).map((b) => [b.key, []])) };
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
  for (const s of sections || []) {
    add(s.id, s.styles, s.states);
    if (s.type === "layout") walk(s.children, (n) => add(n.id, n.styles, n.states));
  }
  let css = rules.base.join("\n");
  for (const bp of BREAKPOINTS) if (bp.media && rules.media[bp.key].length) css += `\n@media ${bp.media}{${rules.media[bp.key].join("")}}`;
  return css.replace(/</g, "");
}

module.exports = {
  NODE_TYPES, CATEGORIES, PALETTE, STYLE_UI, editorSpec, STYLE_PROPS, COMPOSED, BREAKPOINTS, STATES, SHADOWS, FONT_STACKS, COLOR_TOKENS, MAX_NODES, MAX_DEPTH,
  AUDIENCES, normalizeAudience, audienceMatches, audienceLabel, normalizeNode, normalizeStyles, sanitizeRich, walk, visibleTree, pageCss, newNodeId, iconNames,
};
