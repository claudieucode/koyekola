// Réglages GLOBAUX du site (nouveau personnalisateur, rubrique « Global ») : Typographie, Couleurs, Conteneur, Boutons.
//
// Modèle de données (tokens.global, par site ; les sites ne partagent jamais rien) : chaque section est un objet dont les valeurs vides
// (null, "") signifient « hérité » : le design du thème actif reste intact tant qu'une valeur n'est pas choisie. Les valeurs de la tablette
// et du mobile sont des surcharges : une valeur mobile n'écrase jamais la valeur de l'ordinateur.
//
// Priorité des styles (du plus général au plus local ; le plus local gagne) :
//   1. valeurs par défaut du thème (tokens du site, feuille landing.css et paquet de thème)
//   2. réglages globaux du personnalisateur (CE fichier) : variables --kw-… et règles de faible spécificité
//   3. réglages d'un composant ou d'une page (.kw-n-<id>), écrits APRÈS : ils l'emportent toujours
//   4. états interactifs (survol, focus, clic) et adaptations par écran (media queries), au sein de chaque niveau
// Aucune valeur libre n'atteint une feuille de style : nombres bornés, couleurs #rrggbb[aa] / transparent / référence de palette, listes fermées.
const { bad } = require("./sections");
const tokensLib = require("./tokens");
const fontLib = require("../../utils/fontLibrary");

const SECTIONS = ["typography", "colors", "container", "buttons"];
const TABLET = "(max-width: 1023px)", MOBILE = "(max-width: 767px)"; // mêmes écrans que le Page Builder (BREAKPOINTS)
const HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;
const REF = /^(p:[a-z0-9]{1,12}|token:[a-z0-9-]{1,24}|g:[a-z0-9]{1,12})$/; // g:<id> = dégradé de la palette (fonds seulement)
const SIZE_UNITS = { px: [8, 160], em: [0.5, 12], rem: [0.5, 12], "%": [50, 500], vw: [0.5, 20] };
const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const TRANSFORMS = ["", "none", "uppercase", "lowercase", "capitalize"];
const STYLES = ["", "normal", "italic"];
const DECOS = ["", "none", "underline", "line-through", "overline"];
const LEVELS = ["h1", "h2", "h3", "h4", "h5", "h6"];
const OTHER_TYPO = [["quote", "Citations"], ["small", "Petits textes"], ["caption", "Légendes"], ["list", "Listes"], ["secondary", "Texte secondaire"]];
const ALIGNS = ["", "left", "center", "right"];
const BORDER_STYLES = ["", "none", "solid", "dashed", "dotted", "double"];
const SHADOW_KEYS = { "": "", none: "none", sm: "0 1px 3px rgba(11,42,64,.12)", md: "0 4px 16px rgba(11,42,64,.14)", lg: "0 12px 32px rgba(11,42,64,.2)" };

// ---------- Données proposées par l'écran ----------
// Six combinaisons de polices réellement différentes (titres / corps) ; « système » n'utilise aucune police téléchargée
const TYPE_PRESETS = [
  { id: "moderne", label: "Moderne", heading: "font.poppins", body: "font.inter", headingWeight: 700, bodyWeight: 400 },
  { id: "editorial", label: "Éditorial", heading: "font.playfair-display", body: "font.source-sans-3", headingWeight: 700, bodyWeight: 400 },
  { id: "classique", label: "Classique", heading: "font.lora", body: "font.open-sans", headingWeight: 600, bodyWeight: 400 },
  { id: "technique", label: "Technique", heading: "font.manrope", body: "font.ibm-plex-sans", headingWeight: 800, bodyWeight: 400 },
  { id: "elegant", label: "Élégant", heading: "font.eb-garamond", body: "font.lato", headingWeight: 600, bodyWeight: 400 },
  { id: "systeme", label: "Système", heading: "system", body: "system", headingWeight: 700, bodyWeight: 400 },
];
// Palettes : 9 couleurs nommées (accent, accent foncé, titres, texte, fond du contenu, fond du site, noir, bordure, noir doux)
const SLOTS = ["Accent", "Accent foncé", "Titres", "Texte", "Fond du contenu", "Fond du site", "Noir", "Bordure", "Noir doux"];
const PALETTES = [
  { key: "default", label: "Par défaut", colors: ["#2a6fcb", "#1f55a3", "#1e293b", "#374151", "#ffffff", "#f0f4f8", "#111111", "#d1d5db", "#1a1a1a"] },
  { key: "oak", label: "Chêne", colors: ["#2563eb", "#1d4fd8", "#0f172a", "#334155", "#ffffff", "#f8fafc", "#0b1220", "#cbd5e1", "#111827"] },
  { key: "viola", label: "Viola", colors: ["#6d3df0", "#4f1fdb", "#111827", "#4b5563", "#ffffff", "#f5f3ff", "#0b0b12", "#ddd6fe", "#1c1033"] },
  { key: "dark", label: "Sombre", colors: ["#3b82f6", "#2f74dd", "#ffffff", "#e5e7eb", "#111827", "#000000", "#ffffff", "#374151", "#f3f4f6"] },
];
const PALETTE_IDS = ["p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];
// Emplacements des « Couleurs du thème » et « de surface » : valeur par défaut = référence de la palette (le globe de la maquette)
const COLOR_FIELDS = [
  ["accent", "Couleur principale", "p:p0"], ["secondary", "Couleur secondaire", ""], ["highlight", "Accentuation", ""], ["complementary", "Couleur complémentaire", ""], ["link", "Liens", "p:p0"], ["linkHover", "Liens au survol", "p:p1"], ["headings", "Titres (H1-H6)", "p:p2"], ["text", "Texte principal", "p:p3"], ["textSecondary", "Texte secondaire", ""],
  ["border", "Bordures", "p:p7"], ["divider", "Séparateurs", ""], ["siteBg", "Fond du site", "p:p5"], ["contentBg", "Fond secondaire (contenu)", "p:p4"],
];
// Six styles de bouton ; « plein » = fond de la couleur d'accentuation, « contour » = fond transparent
const BUTTON_PRESETS = [
  { id: "rect", label: "Rectangle plein", radius: 0, outline: false }, { id: "round", label: "Rectangle arrondi", radius: 8, outline: false }, { id: "pill", label: "Pilule", radius: 999, outline: false },
  { id: "rect-outline", label: "Rectangle contour", radius: 0, outline: true }, { id: "round-outline", label: "Rectangle arrondi contour", radius: 8, outline: true }, { id: "pill-outline", label: "Pilule contour", radius: 999, outline: true },
];

// ---------- Utilitaires de validation (strict = refuser, sinon ignorer) ----------
const num = (v, min, max, label, { strict, dec = 2 } = {}) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (Number.isFinite(n) && n >= min && n <= max) return Math.round(n * 10 ** dec) / 10 ** dec;
  if (strict) throw bad(`${label} : un nombre entre ${min} et ${max} est attendu.`);
  return null;
};
const oneOf = (v, list, label, { strict } = {}) => {
  const x = v === undefined || v === null ? "" : String(v);
  if (list.includes(x)) return x;
  if (strict) throw bad(`${label} : valeur inconnue.`);
  return "";
};
const colorVal = (v, label, { strict } = {}) => {
  const x = v === undefined || v === null ? "" : String(v).trim().toLowerCase();
  if (x === "" || x === "transparent" || HEX.test(x) || REF.test(x)) return x;
  if (strict) throw bad(`${label} : couleur attendue (code #rrggbb, #rrggbbaa, « transparent » ou couleur de la palette).`);
  return "";
};
const fontVal = (v, label, { strict, fontScope } = {}) => {
  const x = v === undefined || v === null ? "" : String(v);
  if (x === "") return "";
  if (Object.hasOwn(tokensLib.FONTS, x) || fontLib.isTokenId(x, strict ? (fontScope || { siteId: NaN }) : undefined)) return x;
  if (strict) throw bad(`${label} : police inconnue.`);
  return "";
};
const weightVal = (v, label, o) => { if (v === undefined || v === null || v === "" || v === "inherit") return null; const n = Number(v); if (WEIGHTS.includes(n)) return n; if (o.strict) throw bad(`${label} : graisse inconnue.`); return null; };
const unitVal = (v, list, def, label, o) => { const x = v === undefined || v === null || v === "" ? def : String(v); if (list.includes(x)) return x; if (o.strict) throw bad(`${label} : unité inconnue.`); return def; };

// Une valeur par écran : { d (ordinateur), t (tablette), m (mobile) }, chacune nulle = héritée
const perDevice = (v, min, max, label, o, dec = 0) => ({ d: num(v && v.d, min, max, `${label} (ordinateur)`, { ...o, dec }), t: num(v && v.t, min, max, `${label} (tablette)`, { ...o, dec }), m: num(v && v.m, min, max, `${label} (mobile)`, { ...o, dec }) });
// Quatre côtés avec liaison : { linked, d: {t,r,b,l}, tablet: {...}, mobile: {...} }
const sides = (v, min, max, label, o, defLinked = true) => {
  const one = (s, lab) => ({ t: num(s && s.t, min, max, `${lab} (haut)`, { ...o, dec: 1 }), r: num(s && s.r, min, max, `${lab} (droite)`, { ...o, dec: 1 }), b: num(s && s.b, min, max, `${lab} (bas)`, { ...o, dec: 1 }), l: num(s && s.l, min, max, `${lab} (gauche)`, { ...o, dec: 1 }) });
  return { linked: v && typeof v.linked === "boolean" ? v.linked : defLinked, unit: unitVal(v && v.unit, ["px", "em", "rem"], "px", `${label} : unité`, o), d: one(v && v.d, label), t: one(v && v.t, `${label} (tablette)`), m: one(v && v.m, `${label} (mobile)`) };
};

// ---------- Typographie ----------
const typo = (v, o, label, { withFamily = true } = {}) => {
  const unit = unitVal(v && v.unit, Object.keys(SIZE_UNITS), "px", `${label} : unité de taille`, o);
  const [smin, smax] = SIZE_UNITS[unit];
  const resp = (r, lab) => ({ size: num(r && r.size, smin, smax, `${lab} : taille`, { ...o, dec: 2 }), lh: num(r && r.lh, 0.8, 3, `${lab} : hauteur de ligne`, o), ls: num(r && r.ls, -0.2, 1, `${lab} : espacement des lettres`, o) });
  const base = resp(v, label);
  return {
    family: withFamily ? fontVal(v && v.family, `${label} : police`, o) : "", unit, ...base, ws: num(v && v.ws, -0.5, 2, `${label} : espacement des mots`, o), weight: weightVal(v && v.weight, `${label} : graisse`, o),
    style: oneOf(v && v.style, STYLES, `${label} : style`, o), transform: oneOf(v && v.transform, TRANSFORMS, `${label} : casse`, o), deco: oneOf(v && v.deco, DECOS, `${label} : décoration`, o),
    color: colorVal(v && v.color, `${label} : couleur`, o), tablet: resp(v && v.tablet, `${label} (tablette)`), mobile: resp(v && v.mobile, `${label} (mobile)`),
  };
};
function normalizeTypography(v, o) {
  const src = v && typeof v === "object" ? v : {};
  const out = {
    preset: oneOf(src.preset, ["", ...TYPE_PRESETS.map((p) => p.id)], "Pré-réglage typographique", o),
    bodyFont: typo(src.bodyFont, o, "Corps de texte"), headingFont: { family: fontVal(src.headingFont && src.headingFont.family, "Police des titres", o), weight: weightVal(src.headingFont && src.headingFont.weight, "Police des titres : graisse", o) },
    body: typo(src.body, o, "Corps de texte", { withFamily: false }),
  };
  for (const k of LEVELS) out[k] = typo(src[k], o, `Titre ${k.toUpperCase()}`);
  const l = src.link || {};
  out.link = { family: fontVal(l.family, "Liens : police", o), color: colorVal(l.color, "Liens : couleur", o), hover: colorVal(l.hover, "Liens : couleur au survol", o), weight: weightVal(l.weight, "Liens : graisse", o), underline: oneOf(l.underline, ["", "always", "hover", "none"], "Liens : soulignement", o), deco: oneOf(l.deco, DECOS, "Liens : décoration", o), transition: num(l.transition, 0, 2000, "Liens : transition (ms)", { ...o, dec: 0 }) };
  out.others = {};
  for (const [k, lab] of OTHER_TYPO) out.others[k] = typo(src.others && src.others[k], o, lab);
  out.readWidth = num(src.readWidth, 20, 120, "Largeur de lecture (caractères)", o);
  out.paragraphMargin = { value: num(src.paragraphMargin && src.paragraphMargin.value, 0, 10, "Marge inférieure des paragraphes", o), unit: unitVal(src.paragraphMargin && src.paragraphMargin.unit, ["em", "px", "rem"], "em", "Marge inférieure : unité", o) };
  out.underlineLinks = src.underlineLinks === true;
  return out;
}

// ---------- Couleurs ----------
function normalizeColors(v, o) {
  const src = v && typeof v === "object" ? v : {};
  const custom = [];
  const seen = new Set();
  for (const c of Array.isArray(src.palette) ? src.palette : []) {
    const id = String((c && c.id) || "");
    const name = String((c && c.name) || "").replace(/[\u0000-\u001f\u007f<>]/g, " ").trim().slice(0, 30);
    const hex = String((c && c.hex) || "").toLowerCase();
    if (!/^p[a-z0-9]{1,11}$/.test(id) || seen.has(id) || !HEX.test(hex) || !name) { if (o.strict) throw bad("Couleur de la palette invalide : un identifiant, un nom et un code (#rrggbb ou #rrggbbaa) sont attendus."); continue; }
    if (custom.length >= 24) { if (o.strict) throw bad("24 couleurs de palette au plus."); break; }
    seen.add(id); custom.push({ id, name, hex });
  }
  const out = { paletteKey: oneOf(src.paletteKey, ["", ...PALETTES.map((p) => p.key), "custom"], "Palette globale", o), palette: custom };
  // Dégradés nommés (linéaires ou radiaux, 2 à 6 points de couleur) : réutilisables comme fond (« g:<id> »)
  out.gradients = [];
  const gseen = new Set();
  for (const gr of Array.isArray(src.gradients) ? src.gradients : []) {
    const id = String((gr && gr.id) || ""), name = String((gr && gr.name) || "").replace(/[\u0000-\u001f\u007f<>]/g, " ").trim().slice(0, 30);
    const stops = (Array.isArray(gr && gr.stops) ? gr.stops : []).map((st) => ({ c: String((st && st.c) || "").toLowerCase(), p: num(st && st.p, 0, 100, "Dégradé : position", { ...o, dec: 0 }) }));
    const okStops = stops.length >= 2 && stops.length <= 6 && stops.every((st) => (HEX.test(st.c) || st.c === "transparent") && st.p !== null);
    if (!/^g[a-z0-9]{1,11}$/.test(id) || gseen.has(id) || !name || !okStops) { if (o.strict) throw bad("Dégradé invalide : un identifiant, un nom et 2 à 6 points de couleur (#rrggbb[aa], position 0–100) sont attendus."); continue; }
    if (out.gradients.length >= 12) { if (o.strict) throw bad("12 dégradés au plus."); break; }
    gseen.add(id);
    out.gradients.push({ id, name, kind: oneOf(gr.kind, ["linear", "radial"], "Dégradé : type", o) || "linear", angle: num(gr.angle, 0, 360, "Dégradé : angle", { ...o, dec: 0 }) ?? 90, stops: stops.sort((a, b) => a.p - b.p) });
  }
  out.siteBgGradient = gseen.has(String(src.siteBgGradient || "")) ? String(src.siteBgGradient) : "";
  // Couleurs des états interactifs : contour du focus clavier, éléments désactivés
  out.states = { focus: colorVal(src.states && src.states.focus, "État focus : couleur", o), disabled: colorVal(src.states && src.states.disabled, "État désactivé : couleur", o) };
  for (const [k, label] of COLOR_FIELDS.map((f) => [f[0], f[1]])) out[k] = colorVal(src[k], label, o);
  // Une référence à une couleur supprimée de la palette est retirée (retour à l'héritage), jamais conservée en silence
  const known = new Set(custom.map((c) => c.id));
  for (const [k] of COLOR_FIELDS) if (out[k].startsWith("p:") && custom.length && !known.has(out[k].slice(2))) out[k] = "";
  return out;
}

// ---------- Conteneur ----------
function normalizeContainer(v, o) {
  const src = v && typeof v === "object" ? v : {};
  return {
    layout: oneOf(src.layout, ["", "full", "boxed", "narrow"], "Mise en page du conteneur", o), style: oneOf(src.style, ["", "open", "boxed"], "Style de conteneur", o),
    width: perDevice(src.width, 320, 2400, "Largeur du conteneur", o), narrow: perDevice(src.narrow, 280, 1600, "Largeur du conteneur étroit", o), wide: perDevice(src.wide, 600, 3000, "Largeur du conteneur large", o), maxWidth: perDevice(src.maxWidth, 320, 3000, "Largeur maximale du site", o),
    align: oneOf(src.align, ["", "center", "left"], "Alignement du conteneur", o), overflow: oneOf(src.overflow, ["", "visible", "hidden", "clip"], "Débordement du contenu", o),
    padX: perDevice(src.padX, 0, 200, "Marge interne horizontale", o), padY: perDevice(src.padY, 0, 300, "Marge interne verticale", o),
    margin: perDevice(src.margin, 0, 300, "Marges du contenu", o), sectionGap: perDevice(src.sectionGap, 0, 300, "Espacement des sections", o),
  };
}

// ---------- Boutons ----------
function normalizeButton(v, o, label) {
  const src = v && typeof v === "object" ? v : {};
  const state = (s, lab) => ({ color: colorVal(s && s.color, `${lab} : texte`, o), bg: colorVal(s && s.bg, `${lab} : fond`, o), border: colorVal(s && s.border, `${lab} : bordure`, o) });
  const font = src.font || {};
  return {
    preset: oneOf(src.preset, ["", ...BUTTON_PRESETS.map((p) => p.id)], `${label} : pré-réglage`, o),
    normal: state(src.normal, `${label}`), disabled: state(src.disabled, `${label} désactivé`), hover: state(src.hover, `${label} au survol`), focus: state(src.focus, `${label} au focus`), active: state(src.active, `${label} au clic`),
    font: { family: fontVal(font.family, `${label} : police`, o), size: num(font.size, 8, 60, `${label} : taille`, { ...o, dec: 1 }), weight: weightVal(font.weight, `${label} : graisse`, o), lh: num(font.lh, 0.8, 3, `${label} : hauteur de ligne`, o), ls: num(font.ls, -0.2, 1, `${label} : espacement des lettres`, o), transform: oneOf(font.transform, TRANSFORMS, `${label} : casse`, o) },
    padding: sides(src.padding, 0, 120, `${label} : marge interne`, o), borderWidth: sides(src.borderWidth, 0, 20, `${label} : largeur de bordure`, o), radius: sides(src.radius, 0, 999, `${label} : rayon de bordure`, o, true),
    borderStyle: oneOf(src.borderStyle, BORDER_STYLES, `${label} : style de bordure`, o), shadow: oneOf(src.shadow, Object.keys(SHADOW_KEYS), `${label} : ombre`, o),
    shadowCustom: { on: Boolean(src.shadowCustom && src.shadowCustom.on === true), x: num(src.shadowCustom && src.shadowCustom.x, -50, 50, `${label} : ombre horizontale`, { ...o, dec: 0 }), y: num(src.shadowCustom && src.shadowCustom.y, -50, 50, `${label} : ombre verticale`, { ...o, dec: 0 }), blur: num(src.shadowCustom && src.shadowCustom.blur, 0, 100, `${label} : flou`, { ...o, dec: 0 }), spread: num(src.shadowCustom && src.shadowCustom.spread, -50, 50, `${label} : diffusion`, { ...o, dec: 0 }), color: colorVal(src.shadowCustom && src.shadowCustom.color, `${label} : couleur de l'ombre`, o), opacity: num(src.shadowCustom && src.shadowCustom.opacity, 0, 1, `${label} : transparence de l'ombre`, o) },
    hoverLift: num(src.hoverLift, 0, 12, `${label} : élévation au survol`, { ...o, dec: 0 }), hoverScale: num(src.hoverScale, 0.9, 1.15, `${label} : échelle au survol`, o),
    minWidth: perDevice(src.minWidth, 0, 600, `${label} : largeur minimale`, o), maxWidth: perDevice(src.maxWidth, 0, 1200, `${label} : largeur maximale`, o),
    opacity: num(src.opacity, 0, 1, `${label} : opacité`, o), transition: num(src.transition, 0, 2000, `${label} : transition (ms)`, { ...o, dec: 0 }), iconGap: num(src.iconGap, 0, 40, `${label} : espace icône / texte`, { ...o, dec: 0 }),
    align: oneOf(src.align, ALIGNS, `${label} : alignement`, o), fullWidth: src.fullWidth === true, width: perDevice(src.width, 0, 1200, `${label} : largeur`, o), minHeight: perDevice(src.minHeight, 0, 300, `${label} : hauteur minimale`, o),
  };
}
const normalizeButtons = (v, o) => ({ primary: normalizeButton(v && v.primary, o, "Bouton principal"), secondary: normalizeButton(v && v.secondary, o, "Bouton secondaire") });

const NORMALIZERS = { typography: normalizeTypography, colors: normalizeColors, container: normalizeContainer, buttons: normalizeButtons };
// Une section seule (contrôle du personnalisateur) : valeur complète et validée
const normalizeSection = (name, raw, opts = {}) => {
  if (!NORMALIZERS[name]) throw bad("Section globale inconnue.");
  return NORMALIZERS[name](raw, opts);
};
const normalizeGlobal = (input, opts = {}) => {
  const src = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const out = {};
  for (const s of SECTIONS) out[s] = NORMALIZERS[s](src[s], opts);
  return out;
};
const defaults = () => normalizeGlobal({});

// ---------- Génération du CSS ----------
// Cibles : « site » = pages d'un site (Page Builder, .lp-site) ; « principal » = pages du site principal de la plateforme
const TARGETS = {
  site: { root: ".lp-site", body: ".lp-site", text: ".lp-site :where(.kw-text, .kw-list, .kw-quote, .kw-toggle-body, .kw-alert-body, .lp-text, .lp-lead)", para: ".lp-site .kw-text p, .lp-site .lp-text p", h: (k) => `.lp-site :where(${k})`, links: ".lp-site :where(.kw-text, .lp-text, .kw-list, .kw-quote, .kw-toggle-body, .kw-alert-body) a", primary: ".lp-site :where(.kw-btn-primary, .lp-btn)", secondary: ".lp-site :where(.kw-btn-outline, .kw-btn-ghost)", others: { quote: ".lp-site :where(blockquote, .kw-quote)", small: ".lp-site :where(small, .kw-small)", caption: ".lp-site :where(figcaption, .kw-caption)", list: ".lp-site :where(.kw-list, .kw-text ul, .kw-text ol)", secondary: ".lp-site :where(.kw-muted, .lp-muted)" }, wide: ".lp-site :where(.lp-w-wide)", focus: ".lp-site :where(a, button, input, select, textarea, [tabindex]):focus-visible", disabled: ".lp-site :where(button, input, select, textarea):disabled", main: ".lp-site :where(.lp-main)", container: ".lp-site :where(.kw-container:not(.kw-full):not(.kw-band), .lp-main)", narrow: ".lp-site :where(.lp-w-narrow)", blocks: ".lp-site .lp-block + .lp-block" },
  principal: { root: "body", body: "body", text: "main :where(p, li, blockquote)", para: "main :where(p)", h: (k) => `main :where(${k})`, links: "main :where(a:not([class]))", primary: ":where(.btn-primary)", secondary: ":where(.btn-secondary, .btn-outline, .btn-ghost)", others: { quote: "main :where(blockquote)", small: "main :where(small)", caption: "main :where(figcaption)", list: "main :where(ul, ol)", secondary: "main :where(.text-muted, .muted)" }, wide: "main :where(.container-wide)", focus: "main :where(a, button, input, select, textarea, [tabindex]):focus-visible", disabled: "main :where(button, input, select, textarea):disabled", main: "main", container: ":where(.container-wide)", narrow: ":where(.container)", blocks: "main > section + section" },
};
const px = (n) => `${n}px`;
const sz = (n, u) => `${n}${u || "px"}`;
const gradCss = (gr) => `${gr.kind === "radial" ? "radial-gradient(circle at center" : `linear-gradient(${gr.angle}deg`}, ${gr.stops.map((st) => `${st.c} ${st.p}%`).join(", ")})`;
const refColor = (v, g) => {
  if (!v) return "";
  if (v === "transparent" || HEX.test(v)) return v;
  if (v.startsWith("token:")) return `var(--kw-${v.slice(6)})`; // couleur du site (jetons du thème)
  if (v.startsWith("g:")) return `var(--site-gradient-${v.slice(2)})`; // dégradé de la palette (fonds)
  const id = v.slice(2), list = paletteOf(g);
  const hit = list.find((c) => c.id === id);
  return hit ? hit.hex : "";
};
// Palette effective : liste enregistrée, sinon celle de la palette choisie ; sans choix, aucune (les couleurs restent celles du thème)
function paletteOf(g) {
  const c = g.colors;
  if (c.palette.length) return c.palette;
  const p = PALETTES.find((x) => x.key === c.paletteKey);
  return p ? p.colors.map((hex, i) => ({ id: PALETTE_IDS[i], name: SLOTS[i], hex })) : [];
}
const effColor = (g, key) => {
  const c = g.colors, own = c[key];
  if (own) return refColor(own, g);
  const f = COLOR_FIELDS.find((x) => x[0] === key);
  // Sans choix propre : la couleur de la palette choisie (ou personnalisée) ; sans palette, rien (le thème garde ses couleurs)
  return c.paletteKey || c.palette.length ? refColor(f[2], g) : "";
};
const fontStack = (key) => (Object.hasOwn(tokensLib.FONTS, key) ? tokensLib.FONTS[key].stack : fontLib.stackOf(key));
const sidesCss = (s, dev) => { const q = s[dev]; const u = s.unit; const vals = ["t", "r", "b", "l"].map((k) => q[k]); if (vals.every((x) => x === null)) return null; return { vals, u }; };

function globalCss(global, target = "site") {
  const g = normalizeGlobal(global);
  const T = TARGETS[target] || TARGETS.site;
  const base = [], tab = [], mob = [];
  // Les variables --kw-… sont aussi posées en ligne sur <body> par le moteur de rendu (style="--kw-…") : seule une règle « !important » de la feuille de style l'emporte sur un style en ligne
  const emit = (arr, sel, decls) => { const d = decls.filter(Boolean).map((x) => (x.startsWith("--") ? `${x} !important` : x)).join(";"); if (d) arr.push(`${sel}{${d}}`); };
  const by = (dev) => (dev === "tablet" ? tab : dev === "mobile" ? mob : base);

  // ---- Couleurs : surcharges de variables lues par tout le site ----
  const vars = [];
  const col = (k) => effColor(g, k);
  if (col("accent")) vars.push(`--kw-primary:${col("accent")}`, `--lp-accent:${col("accent")}`);
  if (col("text")) vars.push(`--kw-text:${col("text")}`);
  if (col("siteBg")) vars.push(`--kw-background:${col("siteBg")}`);
  if (col("contentBg")) vars.push(`--kw-surface:${col("contentBg")}`);
  if (col("border")) vars.push(`--kw-border-color:${col("border")}`);
  if (col("secondary")) vars.push(`--kw-secondary:${col("secondary")}`);
  if (col("highlight")) vars.push(`--kw-accent:${col("highlight")}`);
  if (col("complementary")) vars.push(`--kw-complementary:${col("complementary")}`);
  if (col("textSecondary")) vars.push(`--kw-muted:${col("textSecondary")}`);
  if (col("divider")) vars.push(`--kw-divider:${col("divider")}`);
  // Noms de jetons publics (--site-color-…) : un seul vocabulaire pour les éditeurs et les thèmes ; seulement les rôles réellement définis
  for (const [k, name] of [["accent", "primary"], ["secondary", "secondary"], ["highlight", "accent"], ["complementary", "complementary"], ["text", "text"], ["textSecondary", "text-secondary"], ["headings", "heading"], ["siteBg", "background"], ["contentBg", "background-alt"], ["border", "border"], ["divider", "divider"], ["link", "link"], ["linkHover", "link-hover"]]) if (col(k)) vars.push(`--site-color-${name}:${col(k)}`);
  for (const gr of g.colors.gradients) vars.push(`--site-gradient-${gr.id}:${gradCss(gr)}`);
  // ---- Typographie : variables lues par landing.css (taille, graisse, hauteur de ligne) ----
  const ty = g.typography;
  const preset = TYPE_PRESETS.find((p) => p.id === ty.preset);
  const bodyFam = ty.bodyFont.family || (preset ? preset.body : "");
  const headFam = ty.headingFont.family || (preset ? preset.heading : "");
  if (bodyFam) vars.push(`--kw-font-body:${fontStack(bodyFam)}`);
  if (headFam) vars.push(`--kw-font-heading:${fontStack(headFam)}`);
  if (ty.link.family) vars.push(`--kw-font-link:${fontStack(ty.link.family)}`);
  const bodyW = ty.bodyFont.weight !== null ? ty.bodyFont.weight : preset ? preset.bodyWeight : null;
  if (ty.bodyFont.size !== null) vars.push(`--kw-body-size:${sz(ty.bodyFont.size, ty.bodyFont.unit)}`);
  if (bodyW !== null) vars.push(`--kw-body-weight:${bodyW}`);
  if (ty.bodyFont.lh !== null) vars.push(`--kw-body-lh:${ty.bodyFont.lh}`);
  const headW = ty.headingFont.weight !== null ? ty.headingFont.weight : preset ? preset.headingWeight : null;
  for (const k of LEVELS) {
    const e = ty[k];
    if (e.size !== null) vars.push(`--kw-${k}-size:${sz(e.size, e.unit)}`);
    const w = e.weight !== null ? e.weight : headW;
    if (w !== null) vars.push(`--kw-${k}-weight:${w}`);
    if (e.lh !== null) vars.push(`--kw-${k}-lh:${e.lh}`);
  }
  // ---- Conteneur : largeur, marges ----
  const ct = g.container;
  if (vars.length) emit(base, T.root, vars);
  if (g.colors.siteBgGradient) emit(base, T.root, [`background-image:var(--site-gradient-${g.colors.siteBgGradient})`]);
  const fc = refColor(g.colors.states.focus, g), dc = refColor(g.colors.states.disabled, g);
  if (fc) emit(base, T.focus, [`outline-color:${fc}`]);
  if (dc) emit(base, T.disabled, [`color:${dc}`]);

  // Typographie : règles détaillées (espacement, casse, style, décoration, couleur, famille d'un niveau)
  const lvlRules = (dev, e, sel, withFont) => {
    const r = dev === "d" ? e : e[dev === "t" ? "tablet" : "mobile"];
    const arr = dev === "d" ? base : dev === "t" ? tab : mob;
    emit(arr, sel, [
      dev === "d" && withFont && e.family ? `font-family:${fontStack(e.family)}` : "",
      dev !== "d" && r.size !== null ? `font-size:${sz(r.size, e.unit)}` : "", r.lh !== null && dev !== "d" ? `line-height:${r.lh}` : "", r.ls !== null ? `letter-spacing:${r.ls}em` : "",
      dev === "d" && e.style ? `font-style:${e.style}` : "", dev === "d" && e.transform ? `text-transform:${e.transform}` : "", dev === "d" && e.deco ? `text-decoration:${e.deco}` : "",
      dev === "d" && e.color ? `color:${refColor(e.color, g)}` : "",
    ]);
  };
  const headColor = col("headings");
  for (const k of LEVELS) {
    const e = ty[k];
    lvlRules("d", e, T.h(k), true);
    lvlRules("t", e, T.h(k), true); lvlRules("m", e, T.h(k), true);
    if (headColor && !e.color) emit(base, T.h(k), [`color:${headColor}`]);
    // tablette / mobile : la taille passe par la variable (les composants qui lisent la variable suivent aussi)
    for (const dev of ["tablet", "mobile"]) { const r = e[dev]; if (r.size !== null) emit(by(dev), T.root, [`--kw-${k}-size:${sz(r.size, e.unit)}`]); if (r.lh !== null) emit(by(dev), T.root, [`--kw-${k}-lh:${r.lh}`]); }
  }
  const bf = ty.bodyFont;
  emit(base, T.text, [bf.ls !== null ? `letter-spacing:${bf.ls}em` : "", bf.ws !== null ? `word-spacing:${bf.ws}em` : "", bf.style ? `font-style:${bf.style}` : "", bf.transform ? `text-transform:${bf.transform}` : "", bf.deco ? `text-decoration:${bf.deco}` : "", bf.color ? `color:${refColor(bf.color, g)}` : ""]);
  for (const dev of ["tablet", "mobile"]) { const r = bf[dev]; emit(by(dev), T.root, [r.size !== null ? `--kw-body-size:${sz(r.size, bf.unit)}` : "", r.lh !== null ? `--kw-body-lh:${r.lh}` : ""]); if (r.ls !== null) emit(by(dev), T.text, [`letter-spacing:${r.ls}em`]); }
  if (ty.readWidth !== null) emit(base, T.para, [`max-width:${ty.readWidth}ch`]);
  // Citations, petits textes, légendes, listes, texte secondaire
  for (const [k] of OTHER_TYPO) {
    const e = ty.others[k], sel = T.others[k];
    emit(base, sel, [e.family ? `font-family:${fontStack(e.family)}` : "", e.size !== null ? `font-size:${sz(e.size, e.unit)}` : "", e.weight !== null ? `font-weight:${e.weight}` : "", e.lh !== null ? `line-height:${e.lh}` : "", e.ls !== null ? `letter-spacing:${e.ls}em` : "", e.ws !== null ? `word-spacing:${e.ws}em` : "", e.style ? `font-style:${e.style}` : "", e.transform ? `text-transform:${e.transform}` : "", e.deco ? `text-decoration:${e.deco}` : "", e.color ? `color:${refColor(e.color, g)}` : ""]);
    for (const dev of ["tablet", "mobile"]) { const r = e[dev]; emit(by(dev), sel, [r.size !== null ? `font-size:${sz(r.size, e.unit)}` : "", r.lh !== null ? `line-height:${r.lh}` : "", r.ls !== null ? `letter-spacing:${r.ls}em` : ""]); }
  }
  if (ty.paragraphMargin.value !== null) emit(base, T.para, [`margin-block-end:${ty.paragraphMargin.value}${ty.paragraphMargin.unit}`]);
  // Liens
  const L = ty.link;
  const linkColor = L.color ? refColor(L.color, g) : col("link");
  const linkHover = L.hover ? refColor(L.hover, g) : col("linkHover");
  const under = ty.underlineLinks ? "underline" : L.underline === "always" ? "underline" : L.underline === "none" || L.underline === "hover" ? "none" : L.deco || "";
  emit(base, T.links, [linkColor ? `color:${linkColor}` : "", L.weight !== null ? `font-weight:${L.weight}` : "", under ? `text-decoration:${under}` : "", L.transition !== null ? `transition:color ${L.transition}ms ease` : ""]);
  const hoverUnder = L.underline === "hover" ? "underline" : ty.underlineLinks ? "underline" : "";
  emit(base, `${T.links}:hover`, [linkHover ? `color:${linkHover}` : "", hoverUnder ? `text-decoration:${hoverUnder}` : ""]);

  // ---- Conteneur ----
  const layout = ct.layout, boxedStyle = ct.style === "boxed";
  const nw = ct.narrow.d;
  const cw = (dev) => (dev === "d" ? ct.width.d : ct.width[dev]);
  const mainW = (dev) => {
    const ww = cw(dev);
    if (layout === "full") return "none";
    if (layout === "narrow") { const n = dev === "d" ? ct.narrow.d : ct.narrow[dev]; return n !== null ? px(n) : ww !== null ? px(ww) : ""; }
    return ww !== null ? px(ww) : "";
  };
  for (const dev of ["d", "t", "m"]) {
    const arr = dev === "d" ? base : dev === "t" ? tab : mob;
    const mw = mainW(dev);
    const nwv = dev === "d" ? nw : ct.narrow[dev];
    emit(arr, T.container, [mw ? `max-width:${mw}` : ""]);
    emit(arr, T.narrow, [nwv !== null ? `max-width:${px(nwv)}` : ""]);
    const wv = ct.wide[dev === "d" ? "d" : dev], sm = ct.maxWidth[dev === "d" ? "d" : dev];
    if (wv !== null) emit(arr, T.wide, [`margin-inline:calc(50% - min(${wv / 2}px, 50vw - 16px))`]);
    if (sm !== null) emit(arr, T.root, [`max-width:${px(sm)}`, "margin-inline:auto"]);
    const px_ = dev === "d" ? ct.padX.d : ct.padX[dev], py = dev === "d" ? ct.padY.d : ct.padY[dev], mg = dev === "d" ? ct.margin.d : ct.margin[dev], gap = dev === "d" ? ct.sectionGap.d : ct.sectionGap[dev];
    emit(arr, T.main, [px_ !== null ? `padding-inline:${px(px_)}` : "", py !== null ? `padding-block:${px(py)}` : "", mg !== null ? `margin-block:${px(mg)}` : ""]);
    emit(arr, T.blocks, [gap !== null ? `margin-top:${px(gap)}` : ""]);
  }
  if (layout === "full") emit(base, T.container, ["margin-inline:0"]);
  if (ct.align) emit(base, T.container, [ct.align === "left" ? "margin-inline:0 auto" : "margin-inline:auto"]);
  if (ct.overflow) emit(base, T.main, [`overflow:${ct.overflow}`]);
  if (boxedStyle) {
    const cbg = effColor(g, "contentBg") || "var(--kw-surface, #fff)";
    emit(base, T.main, [`background:${cbg}`, "box-shadow:0 1px 3px rgba(11,42,64,.12), 0 8px 24px rgba(11,42,64,.06)", "border-radius:var(--kw-radius-md, 10px)"]);
    emit(base, T.body === "body" ? "body" : ".lp-site", ["background:var(--kw-background)"]);
  } else if (ct.style === "open") emit(base, T.main, ["background:transparent", "box-shadow:none"]);

  // ---- Boutons ----
  const btn = (b, sel, isPrimary) => {
    const st = (s) => [s.bg ? `background:${refColor(s.bg, g) || s.bg}` : "", s.color ? `color:${refColor(s.color, g) || s.color}` : "", s.border ? `border-color:${refColor(s.border, g) || s.border}` : ""];
    const hasBorderW = (dev) => sidesCss(b.borderWidth, dev);
    const f = b.font, sc = b.shadowCustom;
    const shadowColor = (c) => { const base_ = refColor(c.color, g) || "#0b2a40"; if (c.opacity === null || !HEX.test(base_)) return base_; const m = /^#([0-9a-f]{6})/i.exec(base_)[1]; const a = Math.round(c.opacity * 255).toString(16).padStart(2, "0"); return `#${m}${a}`; };
    emit(base, sel, [
      ...st(b.normal), f.family ? `font-family:${fontStack(f.family)}` : "", f.size !== null ? `font-size:${px(f.size)}` : "", f.weight !== null ? `font-weight:${f.weight}` : "", f.lh !== null ? `line-height:${f.lh}` : "", f.ls !== null ? `letter-spacing:${f.ls}em` : "", f.transform ? `text-transform:${f.transform}` : "",
      b.borderStyle ? `border-style:${b.borderStyle}` : "", sc.on ? `box-shadow:${sc.x ?? 0}px ${sc.y ?? 4}px ${sc.blur ?? 12}px ${sc.spread ?? 0}px ${shadowColor(sc)}` : b.shadow ? `box-shadow:${SHADOW_KEYS[b.shadow]}` : "", b.opacity !== null ? `opacity:${b.opacity}` : "", b.transition !== null ? `transition:all ${b.transition}ms ease` : "",
      b.iconGap !== null ? `gap:${px(b.iconGap)}` : "", b.align ? `text-align:${b.align}` : "", b.fullWidth ? "display:flex;width:100%;justify-content:center" : "",
    ]);
    if (isPrimary && target === "site") {
      const four_ = (o) => (o ? o.vals.map((x) => (x === null ? "0" : `${x}${o.u}`)).join(" ") : "");
      const shadowVar = sc.on ? `${sc.x ?? 0}px ${sc.y ?? 4}px ${sc.blur ?? 12}px ${sc.spread ?? 0}px ${shadowColor(sc)}` : b.shadow ? SHADOW_KEYS[b.shadow] : "";
      emit(base, T.root, [shadowVar ? `--kw-shadow-button:${shadowVar}` : "", f.size !== null ? `--kw-button-size:${px(f.size)}` : "", f.weight !== null ? `--kw-button-weight:${f.weight}` : ""]);
      for (const dev of ["d", "t", "m"]) {
        const rd_ = sidesCss(b.radius, dev), mh_ = dev === "d" ? b.minHeight.d : b.minHeight[dev];
        emit(by(dev === "d" ? "desktop" : dev === "t" ? "tablet" : "mobile"), T.root, [rd_ ? `--kw-radius-button:${four_(rd_)}` : "", mh_ !== null ? `--kw-button-height:${px(mh_)}` : ""]);
      }
    }
    emit(base, `${sel}:hover`, [...st(b.hover), b.hoverLift !== null || b.hoverScale !== null ? `transform:translateY(-${b.hoverLift || 0}px) scale(${b.hoverScale || 1})` : ""]);
    if (st(b.disabled).some(Boolean)) emit(base, `${sel}:where(:disabled, [disabled], [aria-disabled="true"])`, [...st(b.disabled), "cursor:not-allowed"]); emit(base, `${sel}:focus-visible`, [b.focus.color ? `color:${refColor(b.focus.color, g) || b.focus.color}` : "", b.focus.bg ? `background:${refColor(b.focus.bg, g) || b.focus.bg}` : "", b.focus.border ? `outline:2px solid ${refColor(b.focus.border, g) || b.focus.border}` : ""]);
    emit(base, `${sel}:active`, st(b.active));
    for (const dev of ["d", "t", "m"]) {
      const arr = dev === "d" ? base : dev === "t" ? tab : mob;
      const p = sidesCss(b.padding, dev), bw = hasBorderW(dev), rd = sidesCss(b.radius, dev);
      const four = (o, prop) => (o ? `${prop}:${o.vals.map((x) => (x === null ? "0" : `${x}${o.u}`)).join(" ")}` : "");
      const w_ = dev === "d" ? b.width.d : b.width[dev], mh = dev === "d" ? b.minHeight.d : b.minHeight[dev];
      emit(arr, sel, [four(p, "padding"), bw ? four(bw, "border-width") : "", four(rd, "border-radius"), w_ !== null ? `width:${px(w_)}` : "", b.minWidth[dev] !== null ? `min-width:${px(b.minWidth[dev])}` : "", b.maxWidth[dev] !== null ? `max-width:${px(b.maxWidth[dev])}` : "", mh !== null ? `min-height:${px(mh)}` : ""]);
    }
  };
  btn(g.buttons.primary, T.primary, true); btn(g.buttons.secondary, T.secondary, false);

  const css = [base.join("\n"), tab.length ? `@media ${TABLET}{\n${tab.join("\n")}\n}` : "", mob.length ? `@media ${MOBILE}{\n${mob.join("\n")}\n}` : ""].filter(Boolean).join("\n");
  return css.replace(/[<>]/g, "");
}

// Données de l'écran : tout ce que l'interface propose (palettes, polices, pré-réglages) vient d'ici, jamais d'une copie dans le navigateur
function uiSpec(siteId) {
  const fonts = [...Object.entries(tokensLib.FONTS).map(([id, f]) => ({ id, label: f.label })), ...fontLib.list().slice(0, 120).map((f) => ({ id: f.id, label: f.family }))];
  void siteId;
  return { defaults: defaults(), typePresets: TYPE_PRESETS, palettes: PALETTES, slots: SLOTS, paletteIds: PALETTE_IDS, colorFields: COLOR_FIELDS.map(([key, label, ref]) => ({ key, label, ref })), buttonPresets: BUTTON_PRESETS, fonts, weights: WEIGHTS, levels: LEVELS, otherTypo: OTHER_TYPO.map(([key, label]) => ({ key, label })), sizeUnits: SIZE_UNITS };
}

module.exports = { SECTIONS, TYPE_PRESETS, PALETTES, BUTTON_PRESETS, COLOR_FIELDS, normalizeGlobal, normalizeSection, defaults, globalCss, uiSpec, paletteOf, refColor };
