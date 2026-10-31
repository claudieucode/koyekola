// Image Quality / Composition / Style Analyzer (programme 22.7) — analyse RÉELLE des pixels avec sharp (déjà utilisé par la médiathèque). Aucun modèle de vision :
// le SUJET d'une image n'est jamais deviné (`subject: null`) ; ce module mesure seulement ce qui est mesurable : format, dimensions, poids, orientation, luminosité, contraste,
// saturation, couleurs dominantes, netteté, point d'intérêt (heuristique de contraste local, PAS une détection de sujet) et côté le plus calme (place possible pour du texte).
let sharp = null;
try { sharp = require("sharp"); } catch { /* absent : analyse indisponible, jamais simulée */ }

const available = () => Boolean(sharp);
const MAX_PIXELS = 60e6; // protection contre les « bombes de décompression »
const round = (n, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return [h, s, l];
}
const lum = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const orientationOf = (w, h) => { const q = w / h; return q >= 1.15 ? "paysage" : q <= 0.87 ? "portrait" : "carré"; };
const RATIOS = [["1:1", 1], ["4:3", 4 / 3], ["3:2", 3 / 2], ["16:9", 16 / 9], ["21:9", 21 / 9], ["3:4", 3 / 4], ["2:3", 2 / 3], ["9:16", 9 / 16]];
const nearestRatio = (w, h) => RATIOS.reduce((b, r) => (Math.abs(Math.log(w / h / r[1])) < Math.abs(Math.log(w / h / b[1])) ? r : b))[0];

// buffer : contenu du fichier ; opts.bytes : poids sur disque si différent de buffer.length
async function analyze(buffer, opts = {}) {
  if (!sharp) return { available: false, reason: "La bibliothèque d'images (sharp) n'est pas installée : aucune analyse n'est faite." };
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw new Error("Image vide.");
  const base = { limitInputPixels: MAX_PIXELS };
  const meta = await sharp(buffer, base).metadata();
  if (!meta.width || !meta.height) throw new Error("Dimensions illisibles.");
  const bytes = opts.bytes || buffer.length;
  // 48 px sur le grand côté pour les couleurs, 256 px pour la netteté
  const small = await sharp(buffer, base).rotate().resize(48, 48, { fit: "inside" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = small, W = info.width, H = info.height;
  const L = new Float32Array(W * H), S = new Float32Array(W * H);
  const bins = new Float32Array(12); let sumL = 0, sumS = 0, neutral = 0;
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2], [h, s, l] = rgb2hsl(r, g, b);
    L[i] = lum(r, g, b); S[i] = s; sumL += L[i]; sumS += s;
    if (s < 0.15 || l < 0.08 || l > 0.94) neutral++; else bins[Math.floor(h / 30) % 12] += s;
  }
  const n = W * H, meanL = sumL / n, meanS = sumS / n;
  let varL = 0; for (let i = 0; i < n; i++) varL += (L[i] - meanL) ** 2;
  const contrast = Math.sqrt(varL / n);
  const tot = bins.reduce((a, b) => a + b, 0);
  const dominantHues = tot ? [...bins].map((v, i) => ({ hue: i * 30 + 15, share: v / tot })).filter((x) => x.share >= 0.12).sort((a, b) => b.share - a.share).slice(0, 3).map((x) => ({ hue: x.hue, share: round(x.share, 2) })) : [];
  // énergie de contraste local → point d'intérêt et côté calme
  const E = new Float32Array(n); let colL = 0, colR = 0, rowT = 0, rowB = 0, sx = 0, sy = 0, sw = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, e = (x + 1 < W ? Math.abs(L[i + 1] - L[i]) : 0) + (y + 1 < H ? Math.abs(L[i + W] - L[i]) : 0);
    E[i] = e; const w = e * (0.5 + S[i]);
    sx += w * x; sy += w * y; sw += w;
    if (x < W / 2) colL += e; else colR += e;
    if (y < H / 2) rowT += e; else rowB += e;
  }
  const focal = sw > 1e-6 ? { x: round((sx / sw + 0.5) / W, 2), y: round((sy / sw + 0.5) / H, 2) } : { x: 0.5, y: 0.5 };
  const calmSide = Math.abs(colL - colR) < 0.1 * (colL + colR + 1e-9) ? null : colL < colR ? "gauche" : "droite";
  const calmVertical = Math.abs(rowT - rowB) < 0.1 * (rowT + rowB + 1e-9) ? null : rowT < rowB ? "haut" : "bas";
  // netteté : variance du laplacien sur 256 px (échelle de gris)
  const g = await sharp(buffer, base).rotate().resize(256, 256, { fit: "inside" }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const gw = g.info.width, gh = g.info.height; let sum = 0, sum2 = 0, cnt = 0;
  for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
    const i = y * gw + x, v = 4 * g.data[i] - g.data[i - 1] - g.data[i + 1] - g.data[i - gw] - g.data[i + gw];
    sum += v; sum2 += v * v; cnt++;
  }
  const sharpness = cnt ? sum2 / cnt - (sum / cnt) ** 2 : 0;
  const ow = meta.autoOrient ? meta.autoOrient.width : meta.width, oh = meta.autoOrient ? meta.autoOrient.height : meta.height;
  const out = {
    available: true, method: "pixels (sharp, échantillon 48 px + netteté 256 px)", subject: null, subjectNote: "Le sujet n'est pas identifié : aucun modèle de vision n'est utilisé.",
    format: meta.format, width: ow, height: oh, bytes, orientation: orientationOf(ow, oh), ratio: nearestRatio(ow, oh), hasAlpha: Boolean(meta.hasAlpha), animated: (meta.pages || 1) > 1,
    luminance: round(meanL), contrast: round(contrast), saturation: round(meanS), neutralShare: round(neutral / n, 2), dominantHues,
    sharpness: round(sharpness, 1), focal, calmSide, calmVertical,
  };
  out.flags = flagsOf(out);
  return out;
}

// Seuils prudents (mesurés sur des images de test synthétiques et photographiques ; à ajuster avec de vraies images)
const T = { dark: 0.16, bright: 0.88, lowContrast: 0.06, blurry: 15, tiny: 400, heavyBytes: 1.5 * 1024 * 1024, bpp: 1.6 };
function flagsOf(a) {
  const f = [];
  if (a.luminance < T.dark) f.push({ code: "trop_sombre", level: "warn", text: "Image très sombre : le texte posé dessus risque d'être peu lisible." });
  if (a.luminance > T.bright) f.push({ code: "surexposee", level: "warn", text: "Image très claire (possible surexposition)." });
  if (a.contrast < T.lowContrast) f.push({ code: "peu_contrastee", level: "info", text: "Image très uniforme (peu de contraste) : convient à un fond, pas à un visuel principal." });
  if (a.sharpness < T.blurry && a.contrast >= T.lowContrast) f.push({ code: "floue", level: "warn", text: "Image probablement floue (peu de détails nets)." });
  if (a.width < T.tiny) f.push({ code: "petite", level: "warn", text: `Image petite (${a.width} px de large) : elle sera floue si elle est agrandie.` });
  if (a.bytes > T.heavyBytes) f.push({ code: "lourde", level: "warn", text: `Fichier lourd (${(a.bytes / 1048576).toFixed(1)} Mo) : une version plus légère est servie aux visiteurs, mais l'original pèse sur le stockage.` });
  else if (a.format === "png" && !a.hasAlpha && a.bytes > 400 * 1024) f.push({ code: "png_sans_transparence", level: "info", text: "PNG sans transparence : WebP ou JPEG serait plus léger (l'original reste conservé)." });
  return f;
}
module.exports = { analyze, available, flagsOf, orientationOf, nearestRatio, rgb2hsl, T };
