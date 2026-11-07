// Identité d'un en-tête installé : « le modèle » (couleurs et polices fixes du modèle, par défaut) ou « le site » (couleurs et polices du site).
// Le réglage est la propriété `headerIdentity: "site"` du premier conteneur de l'en-tête. Il n'est jamais appliqué sans choix : sans la propriété, rien ne change.
// En mode « site », la vue rendue (public, aperçu, canevas) perd les COULEURS et POLICES propres du modèle : le document enregistré n'est jamais modifié ici,
// repasser sur « le modèle » restitue donc exactement la composition d'origine.
const COLOR_KEYS = ["color", "backgroundColor", "borderColor", "textStrokeColor", "outlineColor", "fontFamily", "backgroundImage", "gradient", "overlay", "shadow", "textShadow", "boxShadow"];
// Propriétés d'élément (hors styles) qui portent une couleur propre au modèle
const PROP_COLORS = ["iconColor", "color", "background", "bg", "accent"];

const isSite = (section) => {
  const first = section && Array.isArray(section.children) ? section.children[0] : null;
  return Boolean(first && first.props && first.props.headerIdentity === "site");
};
const clean = (styles) => {
  if (!styles || typeof styles !== "object") return styles;
  const out = {};
  for (const [bp, st] of Object.entries(styles)) {
    if (!st || typeof st !== "object") { out[bp] = st; continue; }
    const c = {};
    for (const [k, v] of Object.entries(st)) if (!COLOR_KEYS.includes(k)) c[k] = v;
    out[bp] = c;
  }
  return out;
};
function strip(n) {
  if (!n || typeof n !== "object") return n;
  const out = { ...n };
  if (out.styles) out.styles = clean(out.styles);
  if (out.states) { out.states = {}; for (const [k, v] of Object.entries(n.states)) out.states[k] = clean({ x: v }).x; }
  if (out.parts) { out.parts = {}; for (const [k, v] of Object.entries(n.parts)) out.parts[k] = v && v.styles ? { ...v, styles: clean(v.styles) } : v; }
  if (out.props && typeof out.props === "object") { out.props = { ...out.props }; for (const k of PROP_COLORS) if (Object.hasOwn(out.props, k) && typeof out.props[k] === "string") delete out.props[k]; }
  delete out.shapes; delete out.bgSlides; delete out.bgVideo;
  if (Array.isArray(n.children)) out.children = n.children.map(strip);
  return out;
}
// Section (layout) → même section en identité du site ; la section d'origine est renvoyée telle quelle sans le réglage
function apply(section) {
  if (!isSite(section)) return section;
  return { ...section, children: section.children.map(strip), identitySite: true };
}
module.exports = { apply, isSite, strip };
