// Illustrations d'EXEMPLE des aperçus de la bibliothèque Archive : compositions abstraites générées (aucun fichier, aucune image protégée), aux couleurs de la maison du modèle.
// Servies uniquement par /themes-art/apercu-<maison>/<emplacement>-<n>.svg (voir web/themeArtPublic.js) pour illustrer l'aperçu ; jamais utilisées par un site publié.
const MAISONS = require("./maisons");
const { mix } = require("./skins");
const byId = new Map(MAISONS.map((m) => [m[0].toLowerCase(), m]));
const hash = (n) => { let h = (n * 2654435761) >>> 0; return () => { h = (h * 1664525 + 1013904223) >>> 0; return h / 4294967296; }; };

function svgFor(maisonId, n) {
  const m = byId.get(String(maisonId).toLowerCase());
  if (!m) return null;
  const [bg, ink, accent, second] = m[3], r = hash(Number(n) * 7 + m[0].charCodeAt(2) * 13);
  const W = 800, H = 600, motif = Number(n) % 8;
  const c1 = second, c2 = mix(accent, bg, 0.15), c3 = mix(ink, bg, 0.55), c4 = accent;
  const rnd = (a, b) => Math.round(a + (b - a) * r());
  let body = "";
  if (motif === 0) body = `<circle cx="${rnd(250, 550)}" cy="${rnd(200, 400)}" r="${rnd(150, 230)}" fill="${c2}"/><circle cx="${rnd(300, 600)}" cy="${rnd(250, 450)}" r="${rnd(70, 120)}" fill="${c4}"/><rect x="0" y="480" width="${W}" height="120" fill="${c3}" opacity=".35"/>`;
  else if (motif === 1) body = Array.from({ length: 9 }, (_, i) => `<rect x="${i * 90 - 20}" y="0" width="46" height="${H}" fill="${i % 3 === 0 ? c4 : i % 3 === 1 ? c2 : c3}" opacity="${0.4 + (i % 4) * 0.15}" transform="skewX(-14)"/>`).join("");
  else if (motif === 2) body = `<rect x="${rnd(40, 160)}" y="${rnd(60, 140)}" width="${rnd(300, 420)}" height="${rnd(280, 380)}" fill="${c2}"/><rect x="${rnd(300, 380)}" y="${rnd(180, 260)}" width="${rnd(260, 360)}" height="${rnd(220, 300)}" fill="${c4}" opacity=".85"/><rect x="${rnd(120, 220)}" y="${rnd(380, 440)}" width="${rnd(200, 300)}" height="90" fill="${c3}" opacity=".6"/>`;
  else if (motif === 3) body = `<path d="M0 ${rnd(380, 460)} Q 200 ${rnd(240, 320)} 400 ${rnd(380, 440)} T 800 ${rnd(360, 440)} V600 H0Z" fill="${c2}"/><path d="M0 ${rnd(470, 520)} Q 220 ${rnd(380, 440)} 420 ${rnd(470, 520)} T 800 ${rnd(450, 510)} V600 H0Z" fill="${c4}" opacity=".8"/><circle cx="${rnd(520, 680)}" cy="${rnd(110, 190)}" r="${rnd(50, 80)}" fill="${c3}" opacity=".7"/>`;
  else if (motif === 4) body = `<path d="M${rnd(100, 200)} 600 V${rnd(280, 340)} A${rnd(160, 220)} ${rnd(160, 220)} 0 0 1 ${rnd(480, 560)} ${rnd(280, 340)} V600Z" fill="${c2}"/><path d="M${rnd(420, 520)} 600 V${rnd(200, 280)} A${rnd(90, 140)} ${rnd(90, 140)} 0 0 1 ${rnd(640, 720)} ${rnd(200, 280)} V600Z" fill="${c4}" opacity=".85"/>`;
  else if (motif === 5) body = Array.from({ length: 48 }, (_, i) => `<circle cx="${60 + (i % 8) * 96}" cy="${70 + Math.floor(i / 8) * 96}" r="${i % 5 === 0 ? 26 : 10}" fill="${i % 5 === 0 ? c4 : c3}" opacity="${i % 5 === 0 ? 0.9 : 0.5}"/>`).join("");
  else if (motif === 6) body = `<rect x="0" y="0" width="${rnd(300, 460)}" height="${H}" fill="${c2}"/><rect x="${rnd(300, 460)}" y="0" width="${rnd(120, 200)}" height="${H}" fill="${c4}" opacity=".85"/><circle cx="${rnd(500, 660)}" cy="${rnd(180, 420)}" r="${rnd(70, 120)}" fill="${c3}" opacity=".6"/>`;
  else body = Array.from({ length: 7 }, (_, i) => `<circle cx="${rnd(120, 680)}" cy="${rnd(100, 500)}" r="${rnd(60, 150)}" fill="${[c2, c4, c3][i % 3]}" opacity="${0.35 + (i % 3) * 0.2}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration d'exemple"><rect width="${W}" height="${H}" fill="${c1}"/>${body}</svg>`;
}
module.exports = { svgFor };
