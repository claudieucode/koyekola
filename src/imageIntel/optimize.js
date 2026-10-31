// Image Format & Optimization Engine : CONSEILS d'optimisation et dérivation non destructive. L'original n'est jamais modifié ni remplacé ; les versions réduites réelles sont déjà fabriquées à la demande par
// `marketing/media/variants` (WebP, largeurs en liste blanche, jamais d'agrandissement) : ce module ne les duplique pas, il dit quelle conversion est pertinente et applique les règles de préservation.
let sharp = null;
try { sharp = require("sharp"); } catch { /* absent */ }
const KB = 1024;

// analysis : sortie de analyzer.analyze ; ctx : { displayWidth } largeur d'affichage maximale (px CSS)
function advise(a, ctx = {}) {
  if (!a || !a.available) return { evaluable: false, advice: [] };
  const advice = [], keep = [];
  if (a.animated) keep.push("Image animée : ne pas la convertir en image fixe (l'animation serait perdue). Pour un long clip, préférer une vidéo MP4/WebM.");
  if (a.hasAlpha) keep.push("Transparence présente : formats à conserver ou convertir vers WebP/AVIF (qui la gardent), jamais vers JPEG.");
  const display = ctx.displayWidth || 0, need = display ? Math.min(a.width, Math.ceil(display * 2)) : null; // 2x pour les écrans denses
  if (need && a.width > need * 1.5) advice.push({ code: "trop_grande", text: `Largeur d'origine ${a.width} px pour un affichage de ${display} px : des versions de ${need} px suffisent (l'original est conservé).` });
  if (a.bytes > 1.5 * 1024 * KB) advice.push({ code: "lourde", text: "Fichier de plus de 1,5 Mo : compresser (WebP qualité ≈ 80) réduirait nettement le poids sans toucher l'original." });
  if (!a.animated && !a.hasAlpha && ["png", "bmp", "tiff"].includes(a.format) && a.bytes > 300 * KB) advice.push({ code: "format", text: `${a.format.toUpperCase()} sans transparence : une photographie pèse généralement bien moins en WebP ou JPEG.` });
  if (a.format === "gif" && !a.animated) advice.push({ code: "gif_fixe", text: "GIF non animé : PNG ou WebP est plus léger et plus fidèle." });
  const target = a.animated ? a.format : a.hasAlpha ? "webp" : "webp";
  return { evaluable: true, targetFormat: target, targetWidth: need, keep, advice, originalPreserved: true };
}
// Dérivation en mémoire (le fichier d'origine n'est pas touché ; l'appelant décide de stocker ou non)
async function derive(buffer, { width, format = "webp", quality = 80, force = false } = {}) {
  if (!sharp) throw new Error("Bibliothèque d'images indisponible.");
  if (!["webp", "jpeg", "avif", "png"].includes(format)) throw new Error("Format de sortie non pris en charge.");
  const meta = await sharp(buffer, { limitInputPixels: 60e6, animated: true }).metadata();
  if ((meta.pages || 1) > 1 && !force) throw new Error("Image animée : conversion refusée (l'animation serait perdue).");
  if (meta.hasAlpha && format === "jpeg" && !force) throw new Error("Transparence présente : JPEG la supprimerait. Choisissez WebP, AVIF ou PNG.");
  let p = sharp(buffer, { limitInputPixels: 60e6 }).rotate();
  if (width && meta.width > width) p = p.resize({ width: Math.round(width), withoutEnlargement: true });
  const out = await p[format]({ quality: Math.min(100, Math.max(30, quality)) }).toBuffer({ resolveWithObject: true });
  return { buffer: out.data, format, width: out.info.width, height: out.info.height, bytes: out.data.length, savedPct: Math.round((1 - out.data.length / buffer.length) * 100) };
}
// SVG : refusé à l'envoi (peut contenir du code). Ce contrôle sert au diagnostic : il LISTE les constructions dangereuses, il ne rend jamais un SVG acceptable.
const SVG_DANGERS = [[/<script/i, "balise <script>"], [/\son[a-z]+\s*=/i, "attribut d'événement (onload, onclick…)"], [/javascript:/i, "adresse javascript:"], [/<foreignObject/i, "<foreignObject> (HTML embarqué)"], [/<iframe|<embed|<object/i, "contenu embarqué"], [/<!ENTITY|<!DOCTYPE[^>]*\[/i, "entité XML externe (XXE)"], [/(xlink:)?href\s*=\s*["']\s*https?:/i, "référence externe"], [/@import|url\(\s*["']?https?:/i, "ressource externe dans le style"]];
function scanSvg(text) {
  const t = String(text || "");
  const found = SVG_DANGERS.filter(([re]) => re.test(t)).map(([, label]) => label);
  return { isSvg: /<svg[\s>]/i.test(t), dangerous: found.length > 0, found, policy: "Les SVG ne sont pas acceptés à l'envoi (médiathèque) ; seuls les SVG purement graphiques du moteur de pages sont assainis." };
}
module.exports = { advise, derive, scanSvg };
