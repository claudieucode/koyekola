// Identité visuelle propre à CHAQUE pack de site (Apparence → Templates) : palette, polices, formes, ombres, motifs des illustrations. Rien n'est écrit à la main pack par pack :
// une « direction artistique » (24 au total : éditorial, luxe sombre, technique, brutaliste, doux…) est choisie selon l'activité du pack, puis déclinée par une teinte propre à chaque pack,
// de façon déterministe (même pack → même identité) et contrôlée (contrastes AA, teintes et directions suffisamment différentes : scripts/audit-bibliotheque.js).
// Les couleurs d'un pack sont des DONNÉES (jetons du moteur de design) : elles n'imposent rien au site tant que l'utilisateur n'a pas publié le brouillon de styles préparé à l'importation.
const crypto = require("node:crypto");

// ---------- Couleurs ----------
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
  const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${[f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
}
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = (hex) => { const [r, g, b] = rgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
// Texte du bouton sur une couleur : blanc ou #10222f, comme le moteur (tokens.js onColor)
const onColor = (hex) => (contrast(hex, "#ffffff") >= contrast(hex, "#10222f") ? "#ffffff" : "#10222f");
// Éloigne une couleur du fond (plus clair ou plus sombre) jusqu'au contraste demandé avec TOUS les fonds donnés
function reach(h, s, l, bgs, ratio, dir) {
  let L = l;
  for (let i = 0; i < 90 && !bgs.every((b) => contrast(hslToHex(h, s, L), b) >= ratio); i += 1) L = clamp(L + dir, 2, 98);
  return hslToHex(h, s, L);
}

// ---------- Directions artistiques ----------
// mood : light | dark ; bg : « tinted » (fond teinté) | « white » ; sat : saturation de la couleur principale ; fonts : [titres, texte] (bibliothèque locale, aucun service tiers) ;
// polices très larges : titre principal réduit pour ne jamais couper un mot
const WIDE = /syne|unbounded|archivo-black|lilita-one|anton|bebas/;
// radius : [petits éléments, cartes, grands blocs, boutons] ; h1 : taille, graisse, interlettrage (em), casse
const DIRECTIONS = [
  { key: "editorial", label: "Éditorial classique", mood: "light", bg: "tinted", sat: 52, fonts: ["font.playfair-display", "font.source-sans-3"], radius: [2, 2, 4, 2], shadow: ["none", "none"], h1: [52, 700, -0.01, "none"], motifs: ["arches", "plates"] },
  { key: "luxe", label: "Luxe sombre", mood: "dark", bg: "tinted", sat: 55, fonts: ["font.cormorant-garamond", "font.jost"], radius: [0, 0, 0, 0], shadow: ["none", "none"], h1: [56, 600, 0.02, "none"], motifs: ["mesh", "halftone"] },
  { key: "technique", label: "Technique net", mood: "light", bg: "white", sat: 78, fonts: ["font.space-grotesk", "font.inter"], radius: [6, 8, 12, 8], shadow: ["sm", "none"], h1: [48, 700, -0.03, "none"], motifs: ["tiles", "topo"] },
  { key: "brutal", label: "Brutalisme graphique", mood: "light", bg: "white", sat: 85, fonts: ["font.archivo-black", "font.work-sans"], radius: [0, 0, 0, 0], shadow: ["none", "none"], border: [3, "#000000"], h1: [58, 400, -0.02, "uppercase"], motifs: ["tiles", "rays"] },
  { key: "doux", label: "Doux et arrondi", mood: "light", bg: "tinted", sat: 55, fonts: ["font.nunito", "font.nunito-sans"], radius: [14, 26, 34, 999], shadow: ["md", "sm"], h1: [46, 800, 0, "none"], motifs: ["blobs", "bokeh"] },
  { key: "startup", label: "Start-up dynamique", mood: "light", bg: "white", sat: 82, fonts: ["font.plus-jakarta-sans", "font.inter"], radius: [8, 14, 20, 12], shadow: ["md", "sm"], h1: [50, 800, -0.025, "none"], motifs: ["mesh", "waves"] },
  { key: "artisan", label: "Artisan chaleureux", mood: "light", bg: "tinted", sat: 45, fonts: ["font.fraunces", "font.lora"], radius: [4, 8, 14, 6], shadow: ["sm", "none"], h1: [48, 700, 0, "none"], motifs: ["botanical", "objects"] },
  { key: "magazine", label: "Magazine contrasté", mood: "light", bg: "white", sat: 60, fonts: ["font.bodoni-moda", "font.dm-sans"], radius: [0, 0, 0, 0], shadow: ["none", "none"], border: [1, "#111111"], h1: [60, 700, -0.02, "none"], motifs: ["halftone", "ribbons"] },
  { key: "sport", label: "Sport énergique", mood: "dark", bg: "tinted", sat: 90, fonts: ["font.oswald", "font.barlow"], radius: [2, 4, 6, 2], shadow: ["none", "none"], h1: [56, 700, 0.01, "uppercase"], motifs: ["rays", "mountains"] },
  { key: "sante", label: "Santé apaisante", mood: "light", bg: "tinted", sat: 40, fonts: ["font.manrope", "font.figtree"], radius: [10, 16, 24, 14], shadow: ["sm", "none"], h1: [44, 700, -0.01, "none"], motifs: ["waves", "bokeh"] },
  { key: "corporate", label: "Corporate sobre", mood: "light", bg: "white", sat: 50, fonts: ["font.ibm-plex-sans", "font.ibm-plex-sans"], radius: [4, 6, 8, 4], shadow: ["sm", "none"], h1: [44, 600, -0.01, "none"], motifs: ["skyline", "plates"] },
  { key: "creatif", label: "Créatif expressif", mood: "dark", bg: "tinted", sat: 88, fonts: ["font.sora", "font.space-grotesk"], radius: [4, 12, 28, 999], shadow: ["lg", "md"], h1: [58, 800, -0.03, "none"], motifs: ["blobs", "objects"] },
  { key: "nature", label: "Nature organique", mood: "light", bg: "tinted", sat: 38, fonts: ["font.lora", "font.mulish"], radius: [8, 14, 28, 10], shadow: ["sm", "none"], h1: [46, 600, 0, "none"], motifs: ["botanical", "dunes"] },
  { key: "neon", label: "Nuit électrique", mood: "dark", bg: "tinted", sat: 92, fonts: ["font.unbounded", "font.geist"], radius: [6, 10, 16, 8], shadow: ["lg", "md"], h1: [44, 700, -0.02, "none"], motifs: ["mesh", "rays"] },
  { key: "mode", label: "Mode minimaliste", mood: "light", bg: "white", sat: 34, fonts: ["font.jost", "font.jost"], radius: [0, 0, 0, 0], shadow: ["none", "none"], h1: [42, 500, 0.12, "uppercase"], motifs: ["plates", "ribbons"] },
  { key: "retro", label: "Rétro chaleureux", mood: "light", bg: "tinted", sat: 60, fonts: ["font.instrument-serif", "font.dm-sans"], radius: [6, 10, 16, 999], shadow: ["none", "sm"], border: [2, "#2b1d14"], h1: [60, 400, 0, "none"], motifs: ["rays", "halftone"] },
  { key: "institution", label: "Institutionnel", mood: "light", bg: "white", sat: 55, fonts: ["font.merriweather", "font.source-sans-3"], radius: [2, 4, 6, 2], shadow: ["none", "none"], h1: [42, 700, 0, "none"], motifs: ["arches", "skyline"] },
  { key: "studio", label: "Studio grand format", mood: "dark", bg: "white", sat: 70, fonts: ["font.league-spartan", "font.inter-tight"], radius: [0, 0, 0, 0], shadow: ["none", "none"], h1: [64, 800, -0.04, "none"], motifs: ["plates", "topo"] },
  { key: "gastronomie", label: "Gastronomie raffinée", mood: "light", bg: "tinted", sat: 48, fonts: ["font.cormorant-garamond", "font.lato"], radius: [0, 2, 4, 0], shadow: ["none", "none"], h1: [56, 600, 0.01, "none"], motifs: ["objects", "bokeh"] },
  { key: "eco", label: "Éco-responsable", mood: "light", bg: "tinted", sat: 50, fonts: ["font.outfit", "font.nunito-sans"], radius: [10, 16, 24, 999], shadow: ["sm", "none"], h1: [48, 700, -0.01, "none"], motifs: ["botanical", "mountains"] },
  { key: "poster", label: "Affiche à fort impact", mood: "dark", bg: "tinted", sat: 90, fonts: ["font.bebas-neue", "font.roboto-condensed"], radius: [0, 0, 0, 0], shadow: ["none", "none"], h1: [72, 400, 0.02, "uppercase"], motifs: ["rays", "tiles"] },
  { key: "bureau", label: "Bureau moderne", mood: "light", bg: "white", sat: 60, fonts: ["font.geologica", "font.inter"], radius: [6, 10, 16, 8], shadow: ["sm", "none"], h1: [46, 700, -0.02, "none"], motifs: ["tiles", "waves"] },
  { key: "livre", label: "Livre et culture", mood: "light", bg: "tinted", sat: 42, fonts: ["font.libre-baskerville", "font.source-sans-3"], radius: [0, 2, 4, 2], shadow: ["none", "none"], h1: [44, 700, 0, "none"], motifs: ["plates", "arches"] },
  { key: "fun", label: "Joyeux et coloré", mood: "light", bg: "tinted", sat: 88, fonts: ["font.fredoka", "font.quicksand"], radius: [12, 20, 32, 999], shadow: ["md", "md"], h1: [52, 600, 0, "none"], motifs: ["blobs", "objects"] },
];

// Variantes de polices par direction : deux autres couples (le 2e, 3e pack d'une même direction ne reprennent pas les mêmes polices)
const ALT_FONTS = {
  editorial: [["font.lora", "font.nunito-sans"], ["font.eb-garamond", "font.work-sans"]], luxe: [["font.bodoni-moda", "font.manrope"], ["font.cinzel", "font.lato"]],
  technique: [["font.geist", "font.geist"], ["font.ibm-plex-sans", "font.inter"]], brutal: [["font.anton", "font.archivo"], ["font.rubik", "font.work-sans"]],
  doux: [["font.quicksand", "font.nunito"], ["font.comfortaa", "font.nunito-sans"]], startup: [["font.outfit", "font.dm-sans"], ["font.manrope", "font.manrope"]],
  artisan: [["font.zilla-slab", "font.mulish"], ["font.roboto-slab", "font.lato"]], magazine: [["font.playfair-display", "font.inter"], ["font.dm-sans", "font.libre-franklin"]],
  sport: [["font.barlow-condensed", "font.barlow"], ["font.anton", "font.roboto-condensed"]], sante: [["font.dm-sans", "font.dm-sans"], ["font.lexend", "font.figtree"]],
  corporate: [["font.work-sans", "font.work-sans"], ["font.public-sans", "font.public-sans"]], creatif: [["font.space-grotesk", "font.dm-sans"], ["font.unbounded", "font.plus-jakarta-sans"]],
  nature: [["font.fraunces", "font.mulish"], ["font.nunito", "font.lora"]], neon: [["font.sora", "font.inter-tight"], ["font.space-grotesk", "font.geist"]],
  mode: [["font.cormorant-garamond", "font.jost"], ["font.sora", "font.jost"]], retro: [["font.fraunces", "font.dm-sans"], ["font.dm-sans", "font.dm-sans"]],
  institution: [["font.libre-baskerville", "font.public-sans"], ["font.pt-serif", "font.pt-sans"]], studio: [["font.sora", "font.inter"], ["font.archivo", "font.archivo"]],
  gastronomie: [["font.playfair-display", "font.jost"], ["font.fraunces", "font.lato"]], eco: [["font.urbanist", "font.nunito-sans"], ["font.dm-sans", "font.mulish"]],
  poster: [["font.oswald", "font.roboto-condensed"], ["font.anton", "font.barlow"]], bureau: [["font.manrope", "font.inter"], ["font.plus-jakarta-sans", "font.dm-sans"]],
  livre: [["font.crimson-pro", "font.source-sans-3"], ["font.literata", "font.public-sans"]], fun: [["font.lilita-one", "font.nunito"], ["font.baloo-2", "font.quicksand"]],
};
const BY_DIRECTION = Object.fromEntries(DIRECTIONS.map((d) => [d.key, d]));

// Direction(s) conseillée(s) et teinte de départ selon l'activité (catégorie du pack)
const CATEGORY = {
  "Formation": { hue: 232, dirs: ["bureau", "startup", "doux", "institution", "technique", "fun"] },
  "Service": { hue: 215, dirs: ["corporate", "bureau", "institution", "editorial"] },
  "Entreprise": { hue: 212, dirs: ["corporate", "institution", "bureau", "studio"] },
  "Lancement": { hue: 262, dirs: ["startup", "neon", "poster", "creatif"] },
  "Hôtellerie": { hue: 38, dirs: ["luxe", "gastronomie", "editorial", "retro"] },
  "Santé": { hue: 172, dirs: ["sante", "doux", "nature", "eco", "corporate"] },
  "Coaching": { hue: 22, dirs: ["doux", "startup", "eco", "fun", "sante"] },
  "Musique": { hue: 284, dirs: ["neon", "creatif", "poster", "retro", "brutal"] },
  "Architecture": { hue: 205, dirs: ["studio", "mode", "magazine", "brutal"] },
  "Juridique": { hue: 222, dirs: ["institution", "editorial", "corporate", "livre"] },
  "Producteur local": { hue: 96, dirs: ["artisan", "nature", "eco", "retro"] },
  "Mariage": { hue: 338, dirs: ["gastronomie", "editorial", "doux", "luxe", "mode"] },
  "Sport": { hue: 8, dirs: ["sport", "poster", "neon", "brutal"] },
  "Logiciel": { hue: 252, dirs: ["technique", "startup", "neon", "bureau"] },
  "Artisan et BTP": { hue: 28, dirs: ["artisan", "brutal", "corporate", "retro"] },
  "Tourisme": { hue: 190, dirs: ["eco", "nature", "magazine", "fun", "doux"] },
  "Agence": { hue: 304, dirs: ["creatif", "studio", "magazine", "brutal", "startup"] },
  "Boutique": { hue: 330, dirs: ["mode", "fun", "doux", "magazine", "retro"] },
  "Association": { hue: 152, dirs: ["doux", "institution", "eco", "fun", "sante"] },
  "Restauration": { hue: 14, dirs: ["gastronomie", "retro", "artisan", "luxe", "fun"] },
  "Immobilier": { hue: 202, dirs: ["corporate", "luxe", "institution", "mode", "bureau"] },
  "Portfolio": { hue: 276, dirs: ["studio", "creatif", "mode", "brutal", "magazine"] },
  "Blog": { hue: 46, dirs: ["livre", "editorial", "magazine", "doux"] },
  "Événement": { hue: 318, dirs: ["poster", "creatif", "neon", "fun", "luxe"] },
};
const FALLBACK = { hue: 220, dirs: DIRECTIONS.map((d) => d.key) };

const h32 = (text) => crypto.createHash("sha256").update(String(text)).digest().readUInt32LE(0);

function colorsFor(dir, hue, jitter) {
  const s = dir.sat, hs = clamp(s + jitter.sat, 18, 96), warm = hue;
  if (dir.mood === "dark") {
    const background = hslToHex(hue, dir.bg === "white" ? 4 : 30, 7 + jitter.l), surface = hslToHex(hue, dir.bg === "white" ? 4 : 24, 13 + jitter.l);
    const text = hslToHex(hue, 14, 95), muted = reach(hue, 14, 62, [background, surface], 4.6, 2);
    const primary = reach(hue, hs, 62, [background, surface], 4.6, 2);
    const accent = reach(hue + 150 + jitter.acc, clamp(hs, 60, 96), 62, [background, surface], 4.6, 2);
    return { primary, secondary: hslToHex(hue, 30, 20), accent, background, surface, text, muted, success: "#1e7e34", warning: "#8a5a00", error: "#c62828", border: hslToHex(hue, 20, 24) };
  }
  const background = hslToHex(warm, dir.bg === "white" ? 12 : 38, dir.bg === "white" ? 98 : 96 - jitter.l), surface = dir.bg === "white" ? "#ffffff" : hslToHex(warm, 30, 99);
  const text = hslToHex(hue, 38, 11), muted = reach(hue, 14, 46, [background, surface], 4.6, -2);
  let primary = hslToHex(hue, hs, 34 + jitter.l); for (let i = 0; i < 60 && (contrast(primary, onColor(primary)) < 4.8 || contrast(primary, background) < 4.6 || contrast(primary, surface) < 4.6); i += 1) primary = hslToHex(hue, hs, 34 + jitter.l - i);
  const accent = reach(hue + 148 + jitter.acc, clamp(hs + 8, 55, 95), 40, [background, surface], 4.6, -2);
  return { primary, secondary: hslToHex(hue + 12, 40, 15), accent, background, surface, text, muted, success: "#1e7e34", warning: "#8a5a00", error: "#c62828", border: hslToHex(hue, 22, 86) };
}

const NEEDS_ORDER = (a, b) => (a.category + a.key < b.category + b.key ? -1 : 1);
let CACHE = null;
// packs : liste complète des packs (clé, catégorie, nom). Renvoie Map clé → identité. Calculé une fois pour toute la bibliothèque (l'ordre stable garantit des identités stables).
function assign(packs) {
  const out = new Map(), perCat = {}, used = new Set(), taken = {}, nDir = {};
  const usedDirCat = {};
  for (const pack of [...packs].sort(NEEDS_ORDER)) {
    const cat = CATEGORY[pack.category] || FALLBACK, n = (perCat[pack.category] = (perCat[pack.category] || 0) + 1) - 1;
    const hr = h32(`${pack.key}|hue`);
    // direction : on parcourt la liste conseillée à partir d'un point de départ propre au pack ; on évite d'en répéter une dans la même catégorie tant qu'il en reste
    const dirs = cat.dirs; let pick = null;
    for (let i = 0; i < dirs.length && !pick; i += 1) { const k = dirs[(n + i) % dirs.length]; if (!usedDirCat[`${pack.category}|${k}`]) pick = k; }
    if (!pick) pick = dirs[(n + (hr % dirs.length)) % dirs.length];
    usedDirCat[`${pack.category}|${pick}`] = true;
    const dir = BY_DIRECTION[pick];
    // teinte : point de départ de l'activité + décalage propre au pack (écart d'au moins 22° avec une teinte déjà prise pour la même direction)
    let hue = (cat.hue + n * 47 + (hr % 31) - 15 + 360) % 360, guard = 0;
    while (guard < 40 && [...used].some((u) => { const [d, hh] = u.split("|"); return d === dir.key && Math.min(Math.abs(hh - hue), 360 - Math.abs(hh - hue)) < 22; })) { hue = (hue + 23) % 360; guard += 1; }
    used.add(`${dir.key}|${Math.round(hue)}`);
    const jr = h32(`${pack.key}|j`), jitter = { sat: (jr % 13) - 6, l: ((jr >> 4) % 5) - 2, acc: ((jr >> 8) % 41) - 20 };
    // la couleur principale doit être nettement différente de celles déjà prises pour la même direction
    const seen = (nDir[dir.key] = (nDir[dir.key] || 0) + 1) - 1;
    jitter.sat += (seen % 4) * 13 - 13; jitter.l += (seen % 3) - 1;
    let colors = colorsFor(dir, hue, jitter), tries = 0;
    const far = (c) => (taken[dir.key] || []).every((o) => Math.hypot(...[1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) - parseInt(o.slice(i, i + 2), 16))) >= 56);
    while (tries < 60 && !far(colors.primary)) { hue = (hue + 19) % 360; colors = colorsFor(dir, hue, jitter); tries += 1; }
    (taken[dir.key] = taken[dir.key] || []).push(colors.primary);
    const pair = seen % 3 === 0 ? dir.fonts : ALT_FONTS[dir.key][(seen % 3) - 1];
    const [hf, bf] = pair, [rs, rc, rl, rb] = dir.radius;
    const motifs = [dir.motifs[hr % 2], dir.motifs[(hr + 1) % 2], ["dunes", "waves", "topo", "rays", "mountains", "bokeh", "blobs", "mesh", "tiles", "ribbons"][(hr >> 3) % 10]].filter((m, i, a) => a.indexOf(m) === i);
    out.set(pack.key, {
      key: pack.key, direction: dir.key, directionLabel: dir.label, mood: dir.mood, hue: Math.round(hue), colors, fonts: { heading: hf, body: bf },
      radius: { sm: rs, md: Math.round((rs + rc) / 2), lg: rl, button: rb, field: Math.min(rs + 2, 12), card: rc }, shadow: { card: dir.shadow[0], button: dir.shadow[1] },
      border: { width: dir.border ? dir.border[0] : 1, color: dir.border ? dir.border[1] : colors.border }, h1: { size: WIDE.test(hf) ? Math.min(dir.h1[0], 32) : dir.h1[0], weight: dir.h1[1], letterSpacing: dir.h1[2], transform: dir.h1[3] },
      art: { seed: pack.key, motifs },
    });
  }
  return out;
}
const all = (packs) => (CACHE && CACHE.size === packs.length ? CACHE : (CACHE = assign(packs)));
const identityOf = (packs, key) => all(packs).get(key) || null;

// Modifications du brouillon de styles (identifiants des styles : voir services/siteStyles.js)
function styleChanges(id) {
  const c = {};
  for (const k of ["primary", "secondary", "accent", "background", "surface", "text", "muted"]) c[`tokens.colors.${k}`] = id.colors[k];
  c["tokens.fonts.heading"] = id.fonts.heading; c["tokens.fonts.body"] = id.fonts.body; c["tokens.fonts.button"] = id.fonts.body; c["tokens.fonts.link"] = id.fonts.body;
  for (const [k, v] of Object.entries(id.radius)) c[`tokens.radius.${k}`] = Math.min(48, v);
  c["tokens.shadow.card"] = id.shadow.card; c["tokens.shadow.button"] = id.shadow.button;
  c["tokens.border.color"] = id.border.color; c["tokens.border.width"] = id.border.width;
  c["tokens.type.h1.letterSpacing"] = id.h1.letterSpacing;
  return c;
}
// Jetons complets pour l'aperçu (fusionnés avec ceux du site de la requête)
function previewTokens(id) {
  return { colors: Object.fromEntries(["primary", "secondary", "accent", "background", "surface", "text", "muted"].map((k) => [k, id.colors[k]])), fonts: { heading: id.fonts.heading, body: id.fonts.body, button: id.fonts.body, link: id.fonts.body },
    radius: { ...id.radius, sm: Math.min(48, id.radius.sm), button: Math.min(48, id.radius.button) }, shadow: id.shadow, border: id.border,
    type: { h1: { size: id.h1.size, weight: id.h1.weight, lineHeight: 1.08, letterSpacing: id.h1.letterSpacing, transform: id.h1.transform } } };
}
module.exports = { DIRECTIONS, CATEGORY, identityOf, all, assign, styleChanges, previewTokens, contrast, onColor, lum, hslToHex };
