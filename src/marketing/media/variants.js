// Résolutions d'image de la médiathèque (Page Builder) : un seul service, utilisé par le widget Image, la Galerie, la
// Boîte d'image et les autres widgets à source d'image.
//
// Principe : l'original n'est JAMAIS modifié ni remplacé. Une version réduite (WebP) est fabriquée à la demande, à la
// première visite de son adresse, puis conservée sur le disque (UPLOADS_DIR/marketing/<organisation>/v/<largeur>/…).
// Aucune version n'est précalculée : les images déjà importées en profitent sans migration, et le stockage ne grossit
// que pour les tailles réellement choisies. Cinq largeurs seulement sont acceptées (liste blanche) : on ne peut pas
// provoquer la fabrication d'un nombre illimité de fichiers.
// Aucun lien cassé possible : si la bibliothèque de redimensionnement (sharp) est absente, si l'image est plus petite que
// la largeur demandée ou si la fabrication échoue, l'adresse renvoie vers l'original.
//
// Tailles nommées PAR SITE (Paramètres → Médias, services/mediaSettings) : « thumbnail », « medium » et « large » prennent les dimensions réglées pour le site PROPRIÉTAIRE de l'image
// (dossier site-<id>, sinon le site principal). Tant que le réglage est celui d'origine, l'adresse reste « v/<largeur>/ » (aucune page publiée ne change) ; dès qu'il change, la version
// s'appelle « v/<largeur>x<hauteur>[c]/ » (c = recadrée) et n'est fabriquée que si ces dimensions sont ou ont été réglées pour CE site (liste blanche : pas de fabrication illimitée).
// Une image plus petite que la cible n'est jamais agrandie : l'original est servi. SVG : jamais traité (non accepté par la médiathèque). Limite de pixels : protection contre les « bombes de décompression ».
const fs = require("fs");
const path = require("path");
const { uploadsRoot } = require("../../config/paths");
const mediaSettings = require("../../services/mediaSettings");

let sharp = null;
try { sharp = require("sharp"); sharp.cache(false); sharp.concurrency(1); } catch { /* sharp absent : seules les images d'origine sont servies */ }
const MAX_PIXELS = 80_000_000; // ~ 8 000 × 10 000 : au-delà, l'image n'est pas décodée (décompression bomb)
const input = (file) => sharp(file, { failOn: "none", limitInputPixels: MAX_PIXELS });

// Largeurs en pixels ; la hauteur suit le ratio de l'image (aucun recadrage).
// Les paliers d'Elementor / WordPress (miniature 150, moyenne, moyenne grande 768, grande 1024, 1536, 2048) y figurent ; les clés historiques (small, medium, xlarge) restent valides.
const SIZES = {
  thumbnail: { width: 150, label: "Miniature" },
  small: { width: 320, label: "Petite" },
  medium: { width: 640, label: "Moyenne" },
  mediumlarge: { width: 768, label: "Moyenne grande" },
  large: { width: 1024, label: "Grande" },
  w1536: { width: 1536, label: "1536 px" },
  xlarge: { width: 1600, label: "Très grande" },
  w2048: { width: 2048, label: "2048 px" },
};
const KEYS = Object.keys(SIZES).sort((a, b) => SIZES[a].width - SIZES[b].width);
const WIDTHS = new Set(KEYS.map((k) => SIZES[k].width));
const SIZE_CHOICES = ["full", ...KEYS, "auto"]; // full = original (défaut) ; auto = adaptatif (srcset)
// noms fabriqués par saveUpload ; MEDIA-ROUTING : les images d'un site (dossier site-<id>) ont leurs versions réduites DANS le dossier de CE site (jamais dans un dossier commun)
// Forme d'une adresse de fichier : /uploads/marketing/<org>[/site-<id>][/<aaaa>/<mm>]/<horodatage>-<hasard>.<ext> (dossiers aaaa/mm : option « organiser par mois et année »)
const SRC_RE = /^(\/uploads\/marketing\/(\d{1,9})(?:\/site-(\d{1,9}))?)(?:\/(\d{4})\/(0[1-9]|1[0-2]))?\/(\d{10,16}-[0-9a-f]{12})\.(jpg|png|webp|avif)$/;
const folderOf = (org, site, year, month) => path.join(uploadsRoot, "marketing", org, ...(site ? [`site-${site}`] : []), ...(year ? [year, month] : []));
// Dossier d'un fichier d'après son NOM (l'horodatage du nom est la date d'envoi, en UTC) : plat d'abord, puis aaaa/mm. null si introuvable.
function locate(org, site, base) {
  const flat = folderOf(org, site);
  for (const e of EXTS) if (fs.existsSync(path.join(flat, `${base}.${e}`))) return { dir: flat, ext: e, urlDir: "" };
  const d = new Date(Number(String(base).split("-")[0]));
  if (Number.isNaN(d.getTime())) return null;
  const y = String(d.getUTCFullYear()), mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dated = folderOf(org, site, y, mo);
  for (const e of EXTS) if (fs.existsSync(path.join(dated, `${base}.${e}`))) return { dir: dated, ext: e, urlDir: `/${y}/${mo}` };
  return null;
}
const VARIANT_RE = /^[0-9]{10,16}-[0-9a-f]{12}$/;
const EXTS = ["jpg", "png", "webp", "avif"];
const QUALITY = 80;

const available = () => Boolean(sharp);
// Essai réel (pas seulement « le module se charge ») : fabrique une minuscule image WebP. Résultat gardé en mémoire ; utilisé par /sante pour vérifier la production.
let selfTestResult = null;
async function selfTest() {
  if (selfTestResult !== null) return selfTestResult;
  if (!sharp) return (selfTestResult = false);
  try {
    const out = await sharp({ create: { width: 8, height: 6, channels: 3, background: { r: 10, g: 120, b: 200 } } }).resize({ width: 4 }).webp().toBuffer();
    selfTestResult = out.length > 0 && out.subarray(8, 12).toString("latin1") === "WEBP";
  } catch { selfTestResult = false; }
  return selfTestResult;
}
const isLocal = (src) => SRC_RE.test(String(src || ""));
const NAMED = new Set(mediaSettings.NAMED);
// Site propriétaire de l'image d'après son adresse (dossier site-<id>) ; null = site principal
const siteOfSrc = (m) => (m && m[3] ? Number(m[3]) : null);
// Dimensions réellement appliquées à (image, taille) : { w, h, crop, code, legacy } ; les autres tailles (largeurs historiques) : largeur seule
function specFor(m, key) {
  if (NAMED.has(key)) {
    const site = siteOfSrc(m);
    const sp = mediaSettings.spec(site, key);
    return { ...sp, legacy: mediaSettings.isLegacy(site, key) };
  }
  return { key, w: SIZES[key].width, h: 0, crop: false, code: String(SIZES[key].width), legacy: true };
}
// Adresse de la version : « v/<largeur>/ » (historique) ou « v/<largeur>x<hauteur>[c]/ » (dimensions réglées pour le site)
const variantUrl = (src, key) => {
  const m = SRC_RE.exec(String(src || ""));
  if (!m || !SIZES[key]) return null;
  const sp = specFor(m, key);
  return `${m[1]}/v/${sp.legacy ? sp.w : sp.code}/${m[6]}.webp`;
};

// Adresse à afficher pour une taille choisie. Renvoie l'original quand la taille ne s'applique pas (« full », adresse
// externe ou dynamique, GIF, sharp absent) : l'affichage ne dépend jamais d'une version qui pourrait manquer.
function sourceFor(src, size) {
  if (!available() || !SIZES[size] || !isLocal(src)) return src;
  return variantUrl(src, size);
}

// Tailles proposables pour une image de largeur connue (et de site connu) : seulement celles qui sont plus petites que l'original
// (une « version » aussi grande que l'original n'apporterait que du poids de calcul). Les dimensions des tailles nommées sont celles du site.
function offered(width, siteId = null) {
  if (!available()) return [];
  const w = Number(width) || 0;
  return KEYS.map((k) => {
    if (NAMED.has(k)) { const sp = mediaSettings.spec(siteId, k); return { key: k, label: SIZES[k].label, width: sp.w, height: sp.h, crop: sp.crop }; }
    return { key: k, label: SIZES[k].label, width: SIZES[k].width, height: 0, crop: false };
  }).filter((v) => !w || v.width < w).sort((a, b) => a.width - b.width);
}

// Image adaptative : src moyen + srcset des versions plus petites que l'original, plus l'original lui-même.
// `width` : largeur de l'original (la médiathèque la connaît). Sans elle, ou sans sharp : l'original seul.
function adaptive(src, width) {
  const w = Number(width) || 0;
  const m = SRC_RE.exec(String(src || ""));
  if (!available() || !m || !w) return { src, srcset: "", sizes: "" };
  // srcset : seulement les versions SANS recadrage (une miniature recadrée n'a pas le même cadrage que l'image : elle ne se mêle pas aux autres)
  const list = offered(w, siteOfSrc(m)).filter((v) => !v.crop);
  if (!list.length) return { src, srcset: "", sizes: "" };
  const pick = list.find((v) => v.key === "medium") || list[list.length - 1];
  const parts = list.map((v) => `${variantUrl(src, v.key)} ${v.width}w`);
  parts.push(`${src} ${w}w`);
  return { src: variantUrl(src, pick.key), srcset: parts.join(", "), sizes: "(max-width: 1024px) 100vw, 1024px" };
}

// Largeur et hauteur de l'original, lues dans son en-tête (les 256 premiers Ko suffisent) puis gardées en mémoire :
// un fichier de la médiathèque ne change jamais (nom unique). null si illisible ou inconnue (AVIF).
const sizes = new Map();
function dimensions(src) {
  const m = SRC_RE.exec(String(src || ""));
  if (!m) return null;
  if (sizes.has(src)) return sizes.get(src);
  let d = null;
  try {
    const fd = fs.openSync(path.join(folderOf(m[2], m[3], m[4], m[5]), `${m[6]}.${m[7]}`), "r");
    try { const buf = Buffer.alloc(262144); const n = fs.readSync(fd, buf, 0, buf.length, 0); const info = require("./index").sniff(buf.subarray(0, n)); d = info && info.width ? { width: info.width, height: info.height } : null; } finally { fs.closeSync(fd); }
  } catch { d = null; }
  if (sizes.size > 2000) sizes.clear();
  sizes.set(src, d);
  return d;
}

// Ce que le rendu doit écrire dans <img> pour la taille choisie d'un widget : { src, srcset, sizes }.
function imageSource(src, size) {
  if (size === "auto") { const d = dimensions(src); return adaptive(src, d && d.width); }
  return { src: sourceFor(src, size), srcset: "", sizes: "" };
}

// Retire les versions d'une image supprimée définitivement (toutes les tailles fabriquées, historiques comprises).
function purge(src) {
  const m = SRC_RE.exec(String(src || ""));
  if (!m) return 0;
  let n = 0;
  const vroot = path.join(folderOf(m[2], m[3]), "v");
  let dirs = [];
  try { dirs = fs.readdirSync(vroot, { withFileTypes: true }).filter((e) => e.isDirectory() && /^\d{2,4}(?:x\d{1,4}c?)?$/.test(e.name)); } catch { return 0; }
  for (const d of dirs) { try { fs.unlinkSync(path.join(vroot, d.name, `${m[6]}.webp`)); n++; } catch { /* absente */ } }
  return n;
}

const building = new Map(); // fabrication en cours (même fichier demandé plusieurs fois : une seule fabrication)
function build(origin, target, sp) {
  if (building.has(target)) return building.get(target);
  const job = (async () => {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    try {
      let pipeline = input(origin).rotate();
      if (sp.crop) pipeline = pipeline.resize({ width: sp.w, height: sp.h, fit: "cover", position: "centre", withoutEnlargement: true }); // recadrage centré, jamais de déformation
      else pipeline = pipeline.resize({ width: sp.w, height: sp.h || undefined, fit: "inside", withoutEnlargement: true }); // proportions conservées dans la boîte
      await pipeline.webp({ quality: QUALITY }).toFile(tmp);
      fs.renameSync(tmp, target);
    } catch (error) { try { fs.unlinkSync(tmp); } catch { /* rien à retirer */ } throw error; }
  })().finally(() => building.delete(target));
  building.set(target, job);
  return job;
}

// Intergiciel : GET /uploads/marketing/<org>[/site-<id>]/v/<largeur>[x<hauteur>[c]]/<nom>.webp, monté AVANT le dossier statique. Une version déjà
// fabriquée est rendue au dossier statique (mêmes en-têtes, mêmes protections) ; sinon elle est fabriquée ici.
function middleware(req, res, next) {
  const m = /^\/(\d{1,9})(?:\/site-(\d{1,9}))?\/v\/(\d{2,4}(?:x\d{1,4}c?)?)\/([^/]+)\.webp$/.exec(req.path);
  if (!m || (req.method !== "GET" && req.method !== "HEAD")) return next();
  const [, org, site, code, base] = m;
  if (!VARIANT_RE.test(base)) return next(); // adresse inventée : le dossier statique répondra 404
  // Liste blanche : une largeur historique, ou des dimensions réglées (ou l'ayant été) pour le site propriétaire — jamais des dimensions libres
  let sp;
  if (/^\d+$/.test(code)) { if (!WIDTHS.has(Number(code))) return next(); sp = { w: Number(code), h: 0, crop: false }; }
  else {
    if (!mediaSettings.allowedCodes(site ? Number(site) : null).has(code)) return next();
    const d = /^(\d+)x(\d+)(c?)$/.exec(code);
    sp = { w: Number(d[1]), h: Number(d[2]), crop: d[3] === "c" };
    if (sp.w < mediaSettings.MIN || sp.w > mediaSettings.MAX || (sp.h && (sp.h < mediaSettings.MIN || sp.h > mediaSettings.MAX))) return next();
  }
  const dir = folderOf(org, site);
  const target = path.join(dir, "v", code, `${base}.webp`);
  if (fs.existsSync(target)) return next();
  const found = locate(org, site, base);
  if (!found) return next();
  const origin = path.join(found.dir, `${base}.${found.ext}`), originUrl = `/uploads/marketing/${org}${site ? `/site-${site}` : ""}${found.urlDir}/${base}.${found.ext}`;
  const original = () => res.set("Cache-Control", "public, max-age=300").redirect(302, originUrl);
  if (!sharp) return original();
  input(origin).metadata().then((meta) => {
    if (!meta.width || !meta.height) return original();
    // Jamais d'agrandissement : image déjà contenue dans la boîte (ou plus petite que le recadrage exact) → l'original
    const orient = meta.orientation && meta.orientation >= 5 ? { w: meta.height, h: meta.width } : { w: meta.width, h: meta.height };
    const tooSmall = sp.crop ? orient.w < sp.w || orient.h < sp.h : orient.w <= sp.w && (!sp.h || orient.h <= sp.h);
    if (tooSmall) return original();
    return build(origin, target, sp).then(() => next(), () => original());
  }).catch(original);
}

const siteOf = (src) => siteOfSrc(SRC_RE.exec(String(src || "")));
module.exports = { siteOf, selfTest, SIZES, KEYS, SIZE_CHOICES, available, isLocal, variantUrl, sourceFor, offered, adaptive, dimensions, imageSource, purge, middleware, SRC_RE, locate, MAX_PIXELS };
