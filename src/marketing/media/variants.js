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
const fs = require("fs");
const path = require("path");
const { uploadsRoot } = require("../../config/paths");

let sharp = null;
try { sharp = require("sharp"); sharp.cache(false); sharp.concurrency(1); } catch { /* sharp absent : seules les images d'origine sont servies */ }

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
const SRC_RE = /^(\/uploads\/marketing\/(\d{1,9})(?:\/site-(\d{1,9}))?)\/(\d{10,16}-[0-9a-f]{12})\.(jpg|png|webp|avif)$/;
const folderOf = (org, site) => path.join(uploadsRoot, "marketing", org, ...(site ? [`site-${site}`] : []));
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
const variantUrl = (src, key) => {
  const m = SRC_RE.exec(String(src || ""));
  return m ? `${m[1]}/v/${SIZES[key].width}/${m[4]}.webp` : null;
};

// Adresse à afficher pour une taille choisie. Renvoie l'original quand la taille ne s'applique pas (« full », adresse
// externe ou dynamique, GIF, sharp absent) : l'affichage ne dépend jamais d'une version qui pourrait manquer.
function sourceFor(src, size) {
  if (!available() || !SIZES[size] || !isLocal(src)) return src;
  return variantUrl(src, size);
}

// Tailles proposables pour une image de largeur connue : seulement celles qui sont plus petites que l'original
// (une « version » aussi grande que l'original n'apporterait que du poids de calcul).
function offered(width) {
  if (!available()) return [];
  const w = Number(width) || 0;
  return KEYS.filter((k) => !w || SIZES[k].width < w).map((k) => ({ key: k, label: SIZES[k].label, width: SIZES[k].width }));
}

// Image adaptative : src moyen + srcset des versions plus petites que l'original, plus l'original lui-même.
// `width` : largeur de l'original (la médiathèque la connaît). Sans elle, ou sans sharp : l'original seul.
function adaptive(src, width) {
  const w = Number(width) || 0;
  if (!available() || !isLocal(src) || !w) return { src, srcset: "", sizes: "" };
  const list = offered(w);
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
    const fd = fs.openSync(path.join(folderOf(m[2], m[3]), `${m[4]}.${m[5]}`), "r");
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

// Retire les versions d'une image supprimée définitivement.
function purge(src) {
  const m = SRC_RE.exec(String(src || ""));
  if (!m) return 0;
  let n = 0;
  for (const w of WIDTHS) {
    const file = path.join(folderOf(m[2], m[3]), "v", String(w), `${m[4]}.webp`);
    try { fs.unlinkSync(file); n++; } catch { /* absente */ }
  }
  return n;
}

const building = new Map(); // fabrication en cours (même fichier demandé plusieurs fois : une seule fabrication)
function build(origin, target, width) {
  if (building.has(target)) return building.get(target);
  const job = (async () => {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
    try {
      await sharp(origin, { failOn: "none" }).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(tmp);
      fs.renameSync(tmp, target);
    } catch (error) { try { fs.unlinkSync(tmp); } catch { /* rien à retirer */ } throw error; }
  })().finally(() => building.delete(target));
  building.set(target, job);
  return job;
}

// Intergiciel : GET /uploads/marketing/<org>/v/<largeur>/<nom>.webp, monté AVANT le dossier statique. Une version déjà
// fabriquée est rendue au dossier statique (mêmes en-têtes, mêmes protections) ; sinon elle est fabriquée ici.
function middleware(req, res, next) {
  const m = /^\/(\d{1,9})(?:\/site-(\d{1,9}))?\/v\/(\d{2,4})\/([^/]+)\.webp$/.exec(req.path);
  if (!m || (req.method !== "GET" && req.method !== "HEAD")) return next();
  const [, org, site, w, base] = m, width = Number(w);
  if (!WIDTHS.has(width) || !VARIANT_RE.test(base)) return next(); // adresse inventée : le dossier statique répondra 404
  const dir = folderOf(org, site);
  const target = path.join(dir, "v", w, `${base}.webp`);
  if (fs.existsSync(target)) return next();
  const ext = EXTS.find((e) => fs.existsSync(path.join(dir, `${base}.${e}`)));
  if (!ext) return next();
  const origin = path.join(dir, `${base}.${ext}`), originUrl = `/uploads/marketing/${org}${site ? `/site-${site}` : ""}/${base}.${ext}`;
  const original = () => res.set("Cache-Control", "public, max-age=300").redirect(302, originUrl);
  if (!sharp) return original();
  sharp(origin, { failOn: "none" }).metadata().then((meta) => {
    if (!meta.width || meta.width <= width) return original(); // pas de version plus grande que l'original
    return build(origin, target, width).then(() => next(), () => original());
  }).catch(original);
}

module.exports = { selfTest, SIZES, KEYS, SIZE_CHOICES, available, isLocal, variantUrl, sourceFor, offered, adaptive, dimensions, imageSource, purge, middleware };
