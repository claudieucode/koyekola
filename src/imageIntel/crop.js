// Image Composition & Crop Intelligence : recadrage NON DESTRUCTIF. Le fichier d'origine n'est jamais modifié ; on produit seulement des consignes d'affichage (object-fit, object-position,
// ratio, région de recadrage). Le point focal vient de l'analyse (heuristique de contraste, pas une détection de sujet) et peut être corrigé à la main (`focal` fourni par la personne).
const FITS = ["cover", "contain", "fill", "none", "custom"];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const parseRatio = (r) => { const m = String(r).match(/^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/); if (!m || +m[2] === 0) throw new Error("Proportions invalides (ex. 16:9)."); return +m[1] / +m[2]; };
// Valeurs acceptées par le moteur de pages (nodes.js objectPosition) : le plus proche mot-clé natif
const KEYWORDS = [["top left", 0, 0], ["top", 0.5, 0], ["top right", 1, 0], ["left", 0, 0.5], ["center", 0.5, 0.5], ["right", 1, 0.5], ["bottom left", 0, 1], ["bottom", 0.5, 1], ["bottom right", 1, 1]];
const nativeKeyword = (f) => KEYWORDS.reduce((b, k) => (Math.hypot(k[1] - f.x, k[2] - f.y) < Math.hypot(b[1] - f.x, b[2] - f.y) ? k : b))[0];

// image : { width, height, focal? } ; target : { ratio: "16:9", mode, focal?, region? }
function plan(image, target = {}) {
  const { width: iw, height: ih } = image;
  if (!(iw > 0 && ih > 0)) throw new Error("Dimensions de l'image inconnues.");
  const mode = target.mode || "cover";
  if (!FITS.includes(mode)) throw new Error(`Mode inconnu : ${mode}.`);
  const focal = { x: clamp(Number((target.focal || image.focal || {}).x ?? 0.5), 0, 1), y: clamp(Number((target.focal || image.focal || {}).y ?? 0.5), 0, 1) };
  const manual = Boolean(target.focal);
  const out = { mode, focal, focalSource: manual ? "manuel" : image.focal ? "analyse (heuristique)" : "centre par défaut", destructive: false, objectPosition: `${Math.round(focal.x * 100)}% ${Math.round(focal.y * 100)}%`, nativePosition: nativeKeyword(focal), warnings: [] };
  const src = iw / ih;
  if (mode === "contain" || mode === "none") return { ...out, region: { x: 0, y: 0, w: iw, h: ih }, kept: 1, aspectRatio: null };
  if (mode === "custom") {
    const r = target.region || {};
    const ok = [r.x, r.y, r.w, r.h].every(Number.isFinite) && r.w > 0 && r.h > 0 && r.x >= 0 && r.y >= 0 && r.x + r.w <= iw && r.y + r.h <= ih;
    if (!ok) throw new Error("Région de recadrage hors de l'image.");
    return { ...out, region: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h) }, kept: (r.w * r.h) / (iw * ih), aspectRatio: r.w / r.h };
  }
  const dst = parseRatio(target.ratio || `${iw}:${ih}`);
  out.aspectRatio = dst;
  if (mode === "fill") {
    const dist = Math.abs(Math.log(dst / src));
    if (dist > 0.08) out.warnings.push("« Étirer » déforme l'image : les proportions de la boîte diffèrent de celles de l'image. Préférez « Remplir » (recadrage).");
    return { ...out, region: { x: 0, y: 0, w: iw, h: ih }, kept: 1 };
  }
  // cover : région centrée sur le point focal, bornée à l'image
  let w = iw, h = ih;
  if (dst > src) h = iw / dst; else w = ih * dst;
  const x = clamp(focal.x * iw - w / 2, 0, iw - w), y = clamp(focal.y * ih - h / 2, 0, ih - h);
  const region = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) }, kept = (w * h) / (iw * ih);
  out.warnings.push(...risks(kept, focal, region, iw, ih));
  return { ...out, region, kept: Math.round(kept * 100) / 100 };
}
function risks(kept, focal, r, iw, ih) {
  const w = [];
  if (kept < 0.4) w.push(`Le recadrage supprime ${Math.round((1 - kept) * 100)} % de l'image : le sujet peut être coupé. Utilisez une variante dédiée à cet appareil ou corrigez le point focal.`);
  const fx = focal.x * iw, fy = focal.y * ih, mx = r.w * 0.08, my = r.h * 0.08;
  if (fx < r.x + mx || fx > r.x + r.w - mx || fy < r.y + my || fy > r.y + r.h - my) w.push("Le point focal est proche du bord du cadrage : le sujet risque d'être coupé.");
  return w;
}
// Cadrage par appareil : le bureau et le mobile n'ont pas les mêmes proportions. Si le mobile perd trop de l'image, on le dit et on propose une variante dédiée plutôt qu'un fichier de plus par défaut.
const DEVICES = { desktop: "16:9", tablet: "4:3", mobile: "4:5" };
function perDevice(image, opts = {}) {
  const res = {};
  for (const [d, ratio] of Object.entries(DEVICES)) {
    const p = plan(image, { ratio: (opts.ratios || {})[d] || ratio, mode: "cover", focal: (opts.focals || {})[d] });
    res[d] = { ratio: (opts.ratios || {})[d] || ratio, objectPosition: p.objectPosition, nativePosition: p.nativePosition, kept: p.kept, warnings: p.warnings, dedicatedVariantAdvised: p.kept < 0.4 };
  }
  return res;
}
module.exports = { plan, perDevice, nativeKeyword, parseRatio, FITS, DEVICES };
