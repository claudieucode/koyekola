// Distance VISUELLE entre en-têtes, mesurée sur captures réelles (Chrome) : structure seulement, ni couleur ni texte.
// Méthode : texte rendu transparent (la structure = fonds, filets, cases, formes, boutons, espaces), capture de 1280 px × 320 px depuis le haut de l'en-tête,
// niveaux de gris, réduction 96×24, contraste normalisé (étirement min/max), distance L2 normalisée (0 = identiques, 1 = opposées).
// La polarité est ignorée (un en-tête noir sur blanc et son négatif sont « le même dessin ») : distance = min(L2(a, b), L2(a, inverse(b))).
const W = 96, H = 24, CLIP_W = 1280, CLIP_H = 320;
// Seuil : sous cette distance, deux en-têtes sont considérés comme jumeaux (calibré sur les rendus réels : voir docs/theme-builder/HEADER_LIBRARY_AUDIT_V3.md)
const SEUIL = Number(process.env.ENTETES_SEUIL) || 0.05;
const HIDE_TEXT = "*{color:transparent!important;text-shadow:none!important;-webkit-text-fill-color:transparent!important;text-decoration-color:transparent!important;caret-color:transparent!important}input::placeholder{color:transparent!important}*,*::before,*::after{animation:none!important;transition:none!important}";

// Capture d'une page déjà chargée (aperçu d'en-tête) → descripteur (Buffer 96×24, 1 octet par pixel)
async function descriptor(page, sharp) {
  await page.addStyleTag({ content: HIDE_TEXT });
  const box = await page.evaluate(() => { const r = (document.querySelector(".kw-theme-header") || document.body).getBoundingClientRect(); return { top: Math.max(0, Math.floor(r.top)), h: Math.ceil(r.height) }; });
  const png = await page.screenshot({ clip: { x: 0, y: box.top, width: CLIP_W, height: CLIP_H } });
  return fromPng(png, sharp, Math.min(CLIP_H, Math.max(8, box.h)));
}
// hh : hauteur de l'en-tête dans la capture ; le fond de page sous l'en-tête est remplacé par le gris moyen de l'en-tête (seul le dessin de l'en-tête compte, la polarité devient neutre)
async function fromPng(png, sharp, hh) {
  let img = sharp(png).removeAlpha().greyscale();
  if (hh && hh < CLIP_H) {
    const top = sharp(png).removeAlpha().greyscale().extract({ left: 0, top: 0, width: CLIP_W, height: hh }), mean = Math.round((await top.clone().stats()).channels[0].mean);
    img = sharp(await top.png().toBuffer()).extend({ bottom: CLIP_H - hh, background: { r: mean, g: mean, b: mean } }).greyscale();
  }
  const raw = await img.resize(W, H, { fit: "fill", kernel: "lanczos3" }).raw().toBuffer();
  let lo = 255, hi = 0; for (const v of raw) { if (v < lo) lo = v; if (v > hi) hi = v; }
  const out = Buffer.alloc(raw.length), span = Math.max(1, hi - lo);
  for (let i = 0; i < raw.length; i++) out[i] = Math.round(((raw[i] - lo) / span) * 255);
  return out;
}
const l2 = (a, b, inv) => { let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - (inv ? 255 - b[i] : b[i]); s += d * d; } return Math.sqrt(s / a.length) / 255; };
const distance = (a, b) => Math.min(l2(a, b, false), l2(a, b, true));

// descs : { clé: Buffer } → { voisins: [{ key, voisin, distance }], paires: [{ a, b, distance }] sous le seuil, plusProche }
function analyse(descs, seuil = SEUIL, only) {
  const keys = Object.keys(descs), voisins = [], paires = [];
  for (let i = 0; i < keys.length; i++) {
    let best = { distance: 9, voisin: "" };
    for (let j = 0; j < keys.length; j++) { if (i === j) continue; const d = distance(descs[keys[i]], descs[keys[j]]); if (d < best.distance) best = { distance: d, voisin: keys[j] }; if (j > i && d < seuil) paires.push({ a: keys[i] < keys[j] ? keys[i] : keys[j], b: keys[i] < keys[j] ? keys[j] : keys[i], distance: Math.round(d * 1000) / 1000 }); }
    if (!only || only.includes(keys[i])) voisins.push({ key: keys[i], voisin: best.voisin, distance: Math.round(best.distance * 1000) / 1000 });
  }
  voisins.sort((x, y) => x.distance - y.distance); paires.sort((x, y) => x.distance - y.distance);
  const pr = only ? paires.filter((p) => only.includes(p.a) || only.includes(p.b)) : paires;
  return { voisins, paires: pr, plusProche: voisins.length ? voisins[0].distance : null };
}
const encode = (d) => Buffer.from(d).toString("base64"), decode = (s) => Buffer.from(s, "base64");
module.exports = { W, H, CLIP_W, CLIP_H, SEUIL, HIDE_TEXT, descriptor, fromPng, distance, analyse, encode, decode };
