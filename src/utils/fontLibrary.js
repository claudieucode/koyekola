// Font Manager central de Kolakisa : UNE source de vérité typographique pour tous les éditeurs (pages, e-mails, réglages du site, blog).
// La bibliothèque (public/fonts/library/manifest.json) est produite par scripts/fonts/build-library.js : familles Google Fonts sous licence
// ouverte, fichiers WOFF2 hébergés avec l'application (aucun appel à un service tiers, rien à installer à la main). Le nombre de familles
// n'est écrit nulle part : il vient du manifeste.
// Un contenu référence une famille par son identifiant stable (« font.inter ») ; les anciennes valeurs (« heading », « system », « Arial »…)
// restent comprises par chaque éditeur et ne sont jamais réécrites.
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "../../public/fonts/library");
const URL_BASE = "/fonts/library";
let cache = null;

function load() {
  if (cache) return cache;
  let families = [];
  try { families = JSON.parse(fs.readFileSync(path.join(DIR, "manifest.json"), "utf8")).families || []; } catch { families = []; }
  const byId = new Map(families.map((f) => [f.id, f]));
  const byName = new Map(families.map((f) => [f.family.toLowerCase(), f]));
  cache = { families, byId, byName };
  return cache;
}
const reload = () => { cache = null; return load(); };
const list = () => load().families;
const byId = (id) => load().byId.get(String(id || "")) || null;
const byName = (name) => load().byName.get(String(name || "").toLowerCase()) || null;
const isId = (v) => typeof v === "string" && /^font\.[a-z0-9-]{1,60}$/.test(v) && Boolean(byId(v));

// Pile CSS d'une famille : nom entre guillemets simples (jamais de valeur libre) + repli de sa catégorie
const stack = (f) => `'${f.family.replace(/['"\;{}<>]/g, "")}', ${f.fallback || "sans-serif"}`;
const stackOf = (id) => { const f = byId(id); return f ? stack(f) : null; };

// Pile pour un e-mail : repli renforcé (Arial / Georgia / Courier New) car beaucoup de clients ignorent les polices web
const EMAIL_FALLBACK = { "sans-serif": "Arial, Helvetica, sans-serif", serif: "Georgia, 'Times New Roman', serif", monospace: "'Courier New', Courier, monospace", cursive: "'Brush Script MT', cursive", display: "Arial, Helvetica, sans-serif" };
const emailStack = (f) => `'${f.family.replace(/['"\;{}<>]/g, "")}', ${EMAIL_FALLBACK[f.category] || "Arial, Helvetica, sans-serif"}`;

const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
// Règles @font-face d'une famille : une règle par graisse (ou une seule pour une police variable) et par style, chargées à la demande
function faceCss(f, { base = "" } = {}) {
  const out = [];
  for (const style of ["normal", "italic"]) {
    const files = f.files && f.files[style];
    if (!files) continue;
    const src = (file) => `url(${base}${URL_BASE}/${f.slug}/${file}) format("woff2")`;
    const fam = `font-family:'${f.family.replace(/['"\;{}<>]/g, "")}'`;
    if (files.variable && f.axes && f.axes.wght) out.push(`@font-face{${fam};font-style:${style};font-weight:${f.axes.wght.min} ${f.axes.wght.max};font-display:swap;src:${src(files.variable)};unicode-range:${LATIN}}`);
    else for (const [w, file] of Object.entries(files)) if (w !== "variable") out.push(`@font-face{${fam};font-style:${style};font-weight:${w};font-display:swap;src:${src(file)};unicode-range:${LATIN}}`);
  }
  return out.join("\n");
}
// Familles de la bibliothèque citées dans un texte CSS (« font-family: 'Inter', sans-serif ») : sert à ne livrer que les polices utilisées
function usedIn(css) {
  const found = new Map();
  const names = load().byName;
  for (const m of String(css || "").matchAll(/(?:font-family|--kw-font-[a-z]+)\s*:\s*([^;}"]+)/gi)) {
    for (const q of m[1].matchAll(/'([^'"]{1,80})'/g)) { const f = names.get(q[1].toLowerCase()); if (f) found.set(f.id, f); }
  }
  return [...found.values()];
}
const faceCssFor = (css, opts) => usedIn(css).map((f) => faceCss(f, opts)).join("\n");
// Valeur enregistrée (identifiant de la bibliothèque) → pile CSS ; null si ce n'est pas une famille de la bibliothèque
const resolve = (value) => (isId(value) ? stackOf(value) : null);

module.exports = { list, byId, byName, isId, stack, stackOf, emailStack, faceCss, faceCssFor, usedIn, resolve, reload, URL_BASE, DIR };
