// Motion Studio, lot « v » (visuels et médias) : outils partagés par les composants Tracé SVG, Fonds animés et Lecteur Lottie.
//   - cssColor      : couleur validée → valeur CSS (variable du site avec repli) ; jamais de texte libre dans le CSS.
//   - SHAPES        : formes prédéfinies du Tracé SVG (chemins fixes, éditables par épaisseur / taille / extrémités).
//   - sanitizeSvg   : SVG collé par la personne → SVG sûr reconstruit à partir d'une liste blanche (aucune balise ni attribut hors liste).
//   - checkMediaPath: un fichier de la médiathèque cité par un composant doit appartenir à l'organisation (et au site) de la page.
const { parseDocument } = require("htmlparser2");

// ---------- Couleurs ----------
const TOKENS = ["primary", "secondary", "accent", "background", "surface", "text", "muted", "success", "warning", "error", "on-primary", "on-accent"];
function cssColor(v) {
  const s = String(v ?? "").trim().toLowerCase();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(s)) return s;
  if (s === "transparent") return s;
  if (s.startsWith("token:")) {
    const key = s.slice(6);
    if (!TOKENS.includes(key) && !/^c-[a-z0-9]{1,20}$/.test(key)) return "";
    let fallback = null;
    try { const t = require("./tokens"); if (Object.hasOwn(t.DEFAULT_TOKENS.colors, key)) fallback = t.DEFAULT_TOKENS.colors[key]; } catch { /* pas de repli */ }
    return fallback && /^#[0-9a-f]{3,8}$/i.test(fallback) ? `var(--kw-${key}, ${fallback})` : `var(--kw-${key})`;
  }
  return "";
}

// ---------- Formes prédéfinies du Tracé SVG ----------
// Chaque forme : zone de dessin (viewBox) et un ou plusieurs chemins. Tracé uniquement (fill none) : la couleur vient du texte du bloc (currentColor).
const SHAPES = {
  line: { label: "Trait", vb: "0 0 200 100", paths: ["M10 50 H190"] },
  wave: { label: "Vague", vb: "0 0 200 100", paths: ["M10 50 C40 5 70 5 100 50 S160 95 190 50"] },
  squiggle: { label: "Soulignement ondulé", vb: "0 0 200 100", paths: ["M10 55 q15 -22 30 0 t30 0 t30 0 t30 0 t30 0 t30 0"] },
  zigzag: { label: "Zigzag", vb: "0 0 200 100", paths: ["M10 70 L35 30 L60 70 L85 30 L110 70 L135 30 L160 70 L190 30"] },
  circle: { label: "Cercle", vb: "0 0 100 100", paths: ["M50 8 A42 42 0 1 1 49.99 8"] },
  box: { label: "Cadre arrondi", vb: "0 0 100 100", paths: ["M22 10 H78 A12 12 0 0 1 90 22 V78 A12 12 0 0 1 78 90 H22 A12 12 0 0 1 10 78 V22 A12 12 0 0 1 22 10 Z"] },
  check: { label: "Coche", vb: "0 0 100 100", paths: ["M18 54 L42 78 L84 26"] },
  arrow: { label: "Flèche", vb: "0 0 100 100", paths: ["M10 50 H88", "M62 24 L88 50 L62 76"] },
  star: { label: "Étoile", vb: "0 0 100 100", paths: ["M50 8 L61 38 L93 39 L68 59 L77 90 L50 72 L23 90 L32 59 L7 39 L39 38 Z"] },
  heart: { label: "Cœur", vb: "0 0 100 100", paths: ["M50 86 C8 56 8 20 31 17 C42 16 50 24 50 31 C50 24 58 16 69 17 C92 20 92 56 50 86 Z"] },
};
const SHAPE_OPTIONS = Object.entries(SHAPES).map(([k, s]) => [k, s.label]);

// ---------- SVG collé : liste blanche ----------
const NUM = /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?(?:px|%)?$/i;
const LEN = /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
const PAINT = /^(?:none|currentColor|#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\(\s*[\d.\s,%/]+\)|hsla?\(\s*[\d.\s,%deg/]+\)|[a-zA-Z]{3,20})$/;
const attrOk = {
  d: (v) => v.length <= 4000 && /^[MmLlHhVvCcSsQqTtAaZz0-9eE+\-.,\s]*$/.test(v),
  points: (v) => v.length <= 2000 && /^[0-9eE+\-.,\s]*$/.test(v),
  transform: (v) => v.length <= 200 && /^(?:\s*(?:translate|scale|rotate|skewX|skewY|matrix)\([0-9eE+\-.,\s]*\)\s*)*$/.test(v),
  fill: (v) => PAINT.test(v), stroke: (v) => PAINT.test(v),
  "stroke-linecap": (v) => ["butt", "round", "square"].includes(v),
  "stroke-linejoin": (v) => ["miter", "round", "bevel"].includes(v),
  "fill-rule": (v) => ["nonzero", "evenodd"].includes(v), "clip-rule": (v) => ["nonzero", "evenodd"].includes(v),
  "vector-effect": (v) => v === "non-scaling-stroke",
};
for (const k of ["cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "width", "height", "stroke-width", "stroke-miterlimit", "opacity", "fill-opacity", "stroke-opacity"]) attrOk[k] = (v) => NUM.test(v);
const SHAPE_ATTRS = {
  path: ["d"], circle: ["cx", "cy", "r"], ellipse: ["cx", "cy", "rx", "ry"], line: ["x1", "y1", "x2", "y2"], polyline: ["points"], polygon: ["points"], rect: ["x", "y", "width", "height", "rx", "ry"],
};
const COMMON = ["fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "opacity", "fill-opacity", "stroke-opacity", "fill-rule", "clip-rule", "transform", "vector-effect"];
const GROUP_ATTRS = ["transform", "opacity", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill-opacity", "stroke-opacity", "fill-rule"];
const MAX_INPUT = 12000, MAX_SHAPES = 60, MAX_DEPTH = 6;
const esc = (s) => String(s).replace(/[&"<>]/g, (c) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[c]);

// Résultat : { ok, viewBox, markup, shapes, dropped: [balises / attributs retirés], error? }. `markup` est du SVG intérieur reconstruit, avec data-kw-sd sur chaque forme.
function sanitizeSvg(source) {
  const src = String(source ?? "").trim();
  const fail = (error, dropped = []) => ({ ok: false, error, viewBox: "", markup: "", shapes: 0, dropped });
  if (!src) return fail("Collez le code d'un SVG (<svg …>…</svg>).");
  if (src.length > MAX_INPUT) return fail(`SVG trop long (${MAX_INPUT} caractères au plus).`);
  let doc;
  try { doc = parseDocument(src, { xmlMode: true, decodeEntities: true }); } catch { return fail("Ce texte n'est pas un SVG lisible."); }
  const root = doc.children.find((c) => c.type === "tag" && c.name.toLowerCase() === "svg");
  if (!root) return fail("Le texte collé doit commencer par <svg …> et se terminer par </svg>.");
  const dropped = new Set();
  let shapes = 0, bytes = 0;
  const cleanAttrs = (el, allowed) => {
    const out = [];
    for (const [name, raw] of Object.entries(el.attribs || {})) {
      const value = String(raw).trim();
      if (allowed.includes(name) && attrOk[name] && attrOk[name](value)) out.push(` ${name}="${esc(value)}"`);
      else if (!["xmlns", "version", "xml:space", "id", "class"].includes(name) && !name.startsWith("xmlns:") && !name.startsWith("data-")) dropped.add(name.toLowerCase() === "style" ? "style" : name);
    }
    return out.join("");
  };
  const walk = (list, depth) => {
    let html = "";
    for (const el of list) {
      if (el.type !== "tag") continue;
      const tag = el.name;
      if (tag === "g" && depth < MAX_DEPTH) { const inner = walk(el.children || [], depth + 1); if (inner) html += `<g${cleanAttrs(el, GROUP_ATTRS)}>${inner}</g>`; continue; }
      if (SHAPE_ATTRS[tag]) {
        if (shapes >= MAX_SHAPES) { dropped.add("formes en trop"); continue; }
        const attrs = cleanAttrs(el, [...SHAPE_ATTRS[tag], ...COMMON]);
        if (tag === "path" && !/ d="/.test(attrs)) continue;
        shapes++; html += `<${tag} data-kw-sd${attrs}></${tag}>`; bytes += attrs.length;
        continue;
      }
      dropped.add(tag); // script, style, use, image, filter, foreignObject, animate… : retirés avec leur contenu
    }
    return html;
  };
  for (const name of Object.keys(root.attribs || {})) if (!["xmlns", "version", "xml:space", "id", "class", "viewBox", "width", "height", "preserveAspectRatio", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"].includes(name) && !name.startsWith("xmlns:") && !name.startsWith("data-")) dropped.add(name);
  const markup = walk(root.children || [], 0);
  if (!shapes) return fail("Aucune forme utilisable dans ce SVG (formes acceptées : path, circle, ellipse, line, polyline, polygon, rect, g).", [...dropped]);
  if (markup.length > 24000) return fail("SVG trop détaillé.", [...dropped]);
  // Zone de dessin : viewBox (4 nombres) sinon largeur × hauteur
  let viewBox = String((root.attribs && root.attribs.viewBox) || "").trim();
  const four = viewBox.split(/[\s,]+/).filter(Boolean);
  if (!(four.length === 4 && four.every((n) => LEN.test(n)) && Number(four[2]) > 0 && Number(four[3]) > 0)) {
    const w = Number(String((root.attribs && root.attribs.width) || "").replace(/px$/, "")), h = Number(String((root.attribs && root.attribs.height) || "").replace(/px$/, ""));
    viewBox = w > 0 && h > 0 && w <= 10000 && h <= 10000 ? `0 0 ${w} ${h}` : "";
  } else viewBox = four.join(" ");
  if (!viewBox) return fail("Ajoutez un viewBox au SVG (ex. viewBox=\"0 0 200 100\") : il fixe la zone de dessin.", [...dropped]);
  return { ok: true, viewBox, markup, shapes, dropped: [...dropped] };
}
// Forme prédéfinie → même structure que sanitizeSvg
function presetSvg(key) {
  const k = Object.hasOwn(SHAPES, key) ? key : "wave", s = SHAPES[k];
  return { ok: true, viewBox: s.vb, markup: s.paths.map((d) => `<path data-kw-sd d="${esc(d)}"></path>`).join(""), shapes: s.paths.length, dropped: [], preset: k };
}

// ---------- Fichier de la médiathèque cité par un composant ----------
// Lie le chemin à l'organisation ET au site de la page : un chemin /uploads/marketing/<autre organisation>/… ou la médiathèque d'un autre site est refusé,
// de même qu'un fichier qui n'existe pas dans la médiathèque (ou n'est pas du bon type). Sans contexte (outil hors enregistrement) : refus sûr.
const MEDIA_PATH = /^\/uploads\/marketing\/(\d{1,9})\/(?:site-(\d{1,9})\/)?(?:\d{4}\/(?:0[1-9]|1[0-2])\/)?[A-Za-z0-9][A-Za-z0-9_.-]{0,150}$/;
function checkMediaPath(src, h, at, { type } = {}) {
  const m = MEDIA_PATH.exec(String(src || ""));
  if (!m) throw new Error(`${at} : choisissez un fichier de la médiathèque du site (adresse /uploads/marketing/…).`);
  const ctx = h && h.ctx;
  if (!ctx || !Number.isInteger(ctx.organizationId) || !ctx.db) throw new Error(`${at} : impossible de vérifier que ce fichier appartient à votre organisation.`);
  if (Number(m[1]) !== ctx.organizationId) throw new Error(`${at} : ce fichier n'appartient pas à la médiathèque de votre organisation.`);
  const siteInPath = m[2] ? Number(m[2]) : null;
  const row = ctx.db.prepare("SELECT type, reach, site_id, deleted_at FROM mk_media WHERE organization_id = ? AND path = ?").get(ctx.organizationId, String(src));
  if (!row) throw new Error(`${at} : ce fichier n'existe pas dans la médiathèque. Envoyez-le d'abord dans Médias.`);
  if (type && row.type !== type) throw new Error(`${at} : ce fichier n'est pas ${type === "lottie" ? "une animation Lottie" : "du bon type"}.`);
  if (siteInPath !== null && row.site_id !== siteInPath) throw new Error(`${at} : adresse incohérente avec la médiathèque.`);
  const own = Number.isInteger(ctx.siteScope) ? ctx.siteScope : ctx.pageSiteId; // accès limité à un site (imposé par le serveur) ou site de la page enregistrée
  if (row.reach === "site" && own !== undefined && own !== null && row.site_id !== own) throw new Error(`${at} : ce fichier appartient à la médiathèque d'un autre site.`);
  if (row.reach === "site" && own === null) throw new Error(`${at} : ce fichier appartient à la médiathèque d'un site ; cette page est celle du site principal.`);
  if (Number.isInteger(ctx.siteScope) && row.reach !== "site") throw new Error(`${at} : ce fichier appartient à la médiathèque commune, pas à celle de votre site.`);
  return String(src);
}

module.exports = { cssColor, SHAPES, SHAPE_OPTIONS, sanitizeSvg, presetSvg, checkMediaPath, MEDIA_PATH };
