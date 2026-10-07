// Design system d'un site (Site Web) : jetons de couleurs, typographies, espacements, rayons, ombres, boutons et champs.
// Les pages ne contiennent jamais de valeurs en dur : elles utilisent ces jetons (variables CSS --kw-…). Changer un jeton
// change donc réellement toutes les sections qui l'utilisent, sur toutes les pages du site.
const { bad } = require("./sections");

const COLOR_KEYS = ["primary", "secondary", "accent", "background", "surface", "text", "muted", "success", "warning", "error"];
const COLOR_LABELS = { primary: "Principale", secondary: "Secondaire", accent: "Accent", background: "Fond", surface: "Surface", text: "Texte", muted: "Texte discret", success: "Succès", warning: "Avertissement", error: "Erreur" };
const TYPE_KEYS = ["h1", "h2", "h3", "h4", "h5", "h6", "body", "caption", "button"];
const TYPE_LABELS = { h1: "Titre 1", h2: "Titre 2", h3: "Titre 3", h4: "Titre 4", h5: "Titre 5", h6: "Titre 6", body: "Texte courant", caption: "Légende", button: "Bouton" };
const SPACE_KEYS = ["xs", "sm", "md", "lg", "xl", "xxl"];
// Polices proposées : celles du site (servies localement, aucun service tiers) et des polices système
const FONTS = {
  figtree: { label: "Figtree", stack: "Figtree, system-ui, sans-serif" },
  bricolage: { label: "Bricolage Grotesque", stack: "'Bricolage Grotesque', system-ui, sans-serif" },
  system: { label: "Police du système", stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  georgia: { label: "Georgia (serif)", stack: "Georgia, 'Times New Roman', serif" },
  mono: { label: "Monospace", stack: "ui-monospace, Menlo, Consolas, monospace" },
};
const SHADOWS = { none: "none", sm: "0 1px 3px rgba(11, 42, 64, 0.08)", md: "0 4px 16px rgba(11, 42, 64, 0.1)", lg: "0 12px 32px rgba(11, 42, 64, 0.14)" };

const DEFAULT_TOKENS = Object.freeze({
  colors: { primary: "#0277b6", secondary: "#0b2a40", accent: "#f59e0b", background: "#f3f8fc", surface: "#ffffff", text: "#10222f", muted: "#5b6b78", success: "#1e7e34", warning: "#8a5a00", error: "#c62828" },
  // button / link : par défaut la police du texte, pour que les sites existants ne changent pas d'aspect
  fonts: { heading: "bricolage", body: "figtree", button: "figtree", link: "figtree" },
  // Couleurs ajoutées par l'équipe : { key: "c-<identifiant>", label, hex }. Utilisables comme les couleurs du système
  // (référence « token:c-… » dans les styles des widgets).
  customColors: [],
  type: {
    h1: { size: 44, weight: 800, lineHeight: 1.1 }, h2: { size: 32, weight: 800, lineHeight: 1.15 }, h3: { size: 24, weight: 700, lineHeight: 1.2 },
    h4: { size: 19, weight: 700, lineHeight: 1.3 }, h5: { size: 17, weight: 700, lineHeight: 1.35 }, h6: { size: 15, weight: 700, lineHeight: 1.4 }, body: { size: 17, weight: 400, lineHeight: 1.6 }, caption: { size: 14, weight: 400, lineHeight: 1.4 },
    button: { size: 16, weight: 700, lineHeight: 1.2 },
  },
  space: { xs: 4, sm: 8, md: 16, lg: 32, xl: 56, xxl: 96 },
  radius: { sm: 6, md: 10, lg: 18, button: 10, field: 8, card: 14 },
  shadow: { card: "md", button: "none" },
  border: { width: 1, color: "#d6e2ec" },
  sizes: { content: 1080, narrow: 720, buttonHeight: 48, fieldHeight: 46 },
});

const HEX = /^#[0-9a-f]{6}$/i;
const CUSTOM_KEY = /^c-[a-z0-9]{1,20}$/;
const MAX_CUSTOM_COLORS = 30;
const FONT_ROLES = ["heading", "body", "button", "link"];
const FONT_LABELS = { heading: "Titres", body: "Texte courant", button: "Boutons", link: "Liens" };
const intIn = (v, min, max, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : fallback;
};
const numIn = (v, min, max, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 100) / 100 : fallback;
};

// Jetons complets et valides : toute valeur absente ou invalide reprend la valeur par défaut ; strict = refuser les
// valeurs invalides (enregistrement depuis l'éditeur) au lieu de les remplacer silencieusement
function normalizeTokens(input = {}, { strict = false } = {}) {
  const src = input && typeof input === "object" ? input : {};
  const D = DEFAULT_TOKENS;
  const colors = {};
  for (const k of COLOR_KEYS) {
    const v = src.colors && src.colors[k];
    if (v !== undefined && !HEX.test(String(v))) { if (strict) throw bad(`Couleur « ${COLOR_LABELS[k]} » : code hexadécimal attendu (ex. #0277b6).`); }
    colors[k] = HEX.test(String(v || "")) ? String(v).toLowerCase() : D.colors[k];
  }
  const customColors = [];
  const seenKeys = new Set();
  for (const c of Array.isArray(src.customColors) ? src.customColors : []) {
    const key = String((c && c.key) || "");
    const label = String((c && c.label) || "").trim().slice(0, 40);
    const hex = String((c && c.hex) || "");
    if (!CUSTOM_KEY.test(key) || seenKeys.has(key) || !HEX.test(hex) || !label) {
      if (strict) throw bad("Couleur personnalisée invalide : un nom et un code hexadécimal (ex. #0277b6) sont attendus.");
      continue;
    }
    if (customColors.length >= MAX_CUSTOM_COLORS) { if (strict) throw bad(`${MAX_CUSTOM_COLORS} couleurs personnalisées au plus.`); break; }
    seenKeys.add(key);
    customColors.push({ key, label, hex: hex.toLowerCase() });
  }
  if (strict) {
    const names = customColors.map((c) => c.label.toLowerCase());
    if (new Set(names).size !== names.length) throw bad("Deux couleurs personnalisées portent le même nom.");
  }
  const fonts = {};
  for (const k of FONT_ROLES) {
    const v = src.fonts && src.fonts[k];
    if (v !== undefined && !Object.hasOwn(FONTS, v) && strict) throw bad("Police inconnue.");
    fonts[k] = Object.hasOwn(FONTS, v) ? v : D.fonts[k];
  }
  const type = {};
  for (const k of TYPE_KEYS) {
    const v = (src.type && src.type[k]) || {};
    type[k] = { size: intIn(v.size, 10, 96, D.type[k].size), weight: [400, 500, 600, 700, 800].includes(Number(v.weight)) ? Number(v.weight) : D.type[k].weight, lineHeight: numIn(v.lineHeight, 1, 2, D.type[k].lineHeight) };
  }
  const space = {};
  for (const k of SPACE_KEYS) space[k] = intIn(src.space && src.space[k], 0, 200, D.space[k]);
  const radius = {};
  for (const k of Object.keys(D.radius)) radius[k] = intIn(src.radius && src.radius[k], 0, 48, D.radius[k]);
  const shadow = {};
  for (const k of Object.keys(D.shadow)) shadow[k] = Object.hasOwn(SHADOWS, src.shadow && src.shadow[k]) ? src.shadow[k] : D.shadow[k];
  const border = { width: intIn(src.border && src.border.width, 0, 4, D.border.width), color: HEX.test(String(src.border && src.border.color || "")) ? src.border.color.toLowerCase() : D.border.color };
  const sizes = { content: intIn(src.sizes && src.sizes.content, 640, 1600, D.sizes.content), narrow: intIn(src.sizes && src.sizes.narrow, 480, 1000, D.sizes.narrow), buttonHeight: intIn(src.sizes && src.sizes.buttonHeight, 32, 72, D.sizes.buttonHeight), fieldHeight: intIn(src.sizes && src.sizes.fieldHeight, 32, 72, D.sizes.fieldHeight) };
  return { colors, customColors, fonts, type, space, radius, shadow, border, sizes };
}

// Texte lisible sur une couleur pleine (boutons) : blanc ou texte foncé, celui qui contraste le plus (WCAG)
function luminance(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const onColor = (hex) => (contrast(hex, "#ffffff") >= contrast(hex, "#10222f") ? "#ffffff" : "#10222f");

// Variables CSS d'un site : la seule traduction des jetons en styles (les feuilles de style des pages ne lisent que ces
// variables). Valeurs déjà validées par normalizeTokens : aucune injection possible.
function tokensToCss(tokens) {
  const t = normalizeTokens(tokens);
  const v = [];
  for (const k of COLOR_KEYS) v.push(`--kw-${k}:${t.colors[k]}`);
  v.push(`--kw-on-primary:${onColor(t.colors.primary)}`, `--kw-on-accent:${onColor(t.colors.accent)}`);
  for (const c of t.customColors) v.push(`--kw-${c.key}:${c.hex}`);
  for (const k of FONT_ROLES) v.push(`--kw-font-${k}:${FONTS[t.fonts[k]].stack}`);
  for (const k of TYPE_KEYS) v.push(`--kw-${k}-size:${t.type[k].size}px`, `--kw-${k}-weight:${t.type[k].weight}`, `--kw-${k}-lh:${t.type[k].lineHeight}`);
  for (const k of SPACE_KEYS) v.push(`--kw-space-${k}:${t.space[k]}px`);
  for (const [k, n] of Object.entries(t.radius)) v.push(`--kw-radius-${k}:${n}px`);
  for (const [k, s] of Object.entries(t.shadow)) v.push(`--kw-shadow-${k}:${SHADOWS[s]}`);
  v.push(`--kw-border:${t.border.width}px solid ${t.border.color}`);
  for (const [k, n] of Object.entries(t.sizes)) v.push(`--kw-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${n}px`);
  return `${v.join(";")};`;
}

module.exports = { DEFAULT_TOKENS, CUSTOM_KEY, MAX_CUSTOM_COLORS, FONT_ROLES, FONT_LABELS, COLOR_KEYS, COLOR_LABELS, TYPE_KEYS, TYPE_LABELS, SPACE_KEYS, FONTS, SHADOWS, normalizeTokens, tokensToCss, onColor, contrast };
