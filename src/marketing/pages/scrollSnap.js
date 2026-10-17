// Magnétisme de défilement d'une page (comme « Scroll Snap » d'Elementor, Réglages de la page → Avancé) : en faisant défiler, la page « s'accroche » au début de chaque
// section. Réglages enregistrés dans le thème de la page : { position: "start" | "center" | "end", padding: 0–300 px (pour un en-tête collant), always: true }.
// Le CSS est fabriqué ici à partir de valeurs validées ; il ne s'applique pas dans l'éditeur (on y défile librement).
const POSITIONS = { start: "Haut de l'écran", center: "Centre de l'écran", end: "Bas de l'écran" };
function normalize(raw) {
  if (!raw || typeof raw !== "object") return null;
  const position = Object.hasOwn(POSITIONS, raw.position) ? raw.position : null;
  if (!position) return null;
  const padding = Number.isInteger(Number(raw.padding)) ? Math.min(300, Math.max(0, Number(raw.padding))) : 0;
  return { position, ...(padding ? { padding } : {}), ...(raw.always === true ? { always: true } : {}) };
}
function css(snap) {
  const s = normalize(snap);
  if (!s) return "";
  return `html:not(:has(body.lp-builder)){scroll-snap-type:y ${s.always ? "mandatory" : "proximity"};${s.padding ? `scroll-padding-top:${s.padding}px;` : ""}}\nhtml:not(:has(body.lp-builder)) .lp-main>*{scroll-snap-align:${s.position};${s.always ? "scroll-snap-stop:always;" : ""}}`;
}
module.exports = { POSITIONS, normalize, css };
