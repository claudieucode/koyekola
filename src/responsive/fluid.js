// Typographie fluide (programme 22.8). On STOCKE une intention bornée « fluid:<min>-<max> » (pixels entiers, 8–200) ; le rendu calcule un clamp() à partir de ces deux
// nombres uniquement : aucune expression libre n'est jamais acceptée (calc()/clamp() saisis par l'utilisateur restent refusés par le normaliseur). Interpolation linéaire entre
// 320 px et 1440 px de viewport, en rem (le zoom du texte par l'utilisateur est respecté).
const RE = /^fluid:(\d{1,3})-(\d{1,3})$/;
const MIN_VW = 320, MAX_VW = 1440, MIN_PX = 8, MAX_PX = 200;
const r4 = (n) => Math.round(n * 10000) / 10000;
const isFluid = (v) => RE.test(String(v ?? "").trim().toLowerCase());
function check(v) {
  const m = RE.exec(String(v ?? "").trim().toLowerCase());
  if (!m) return null;
  const a = Number(m[1]), b = Number(m[2]);
  if (a < MIN_PX || b > MAX_PX || a > b) return null;
  return `fluid:${a}-${b}`;
}
// Valeur CSS : clamp(min rem, intercept rem + pente vw, max rem). Les deux bornes sont atteintes exactement à 320 et 1440 px.
function css(v) {
  const s = check(v); if (!s) return null;
  const [a, b] = s.slice(6).split("-").map(Number);
  if (a === b) return `${r4(a / 16)}rem`;
  const slope = (b - a) / (MAX_VW - MIN_VW);          // px par px de viewport
  const intercept = a - slope * MIN_VW;               // px
  return `clamp(${r4(a / 16)}rem, ${r4(intercept / 16)}rem + ${r4(slope * 100)}vw, ${r4(b / 16)}rem)`;
}
// Valeur de départ conseillée pour un titre de taille ordinateur donnée (jamais sous 28 px pour un titre, jamais de texte courant sous 16 px)
const forHeading = (desktopPx, level = 2) => {
  const hi = Math.min(MAX_PX, Math.round(desktopPx)), floor = level === 1 ? 30 : level === 2 ? 26 : 20;
  const lo = Math.max(floor, Math.round(hi * (level === 1 ? 0.55 : 0.68)));
  return lo >= hi ? null : `fluid:${lo}-${hi}`;
};
module.exports = { isFluid, check, css, forHeading, MIN_VW, MAX_VW, MIN_PX, MAX_PX };
