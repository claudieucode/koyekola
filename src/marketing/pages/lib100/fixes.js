// Réparations communes appliquées à TOUS les modèles officiels au moment de leur construction.
// · Bouton « outline » ou « ghost » posé sur un fond de couleur du site (primaire, secondaire, accent) : sa couleur par défaut est l'accent du site, donc illisible sur ce fond.
//   On lui donne la couleur de texte « sur le fond » (on-primary / on-accent), comme le font déjà les titres et textes de ces bandeaux. Un réglage explicite du modèle est toujours respecté.
const ON = { "token:primary": "token:on-primary", "token:secondary": "token:on-primary", "token:accent": "token:on-accent" };
function repair(x, bg = null) {
  if (Array.isArray(x)) { x.forEach((y) => repair(y, bg)); return x; }
  if (!x || typeof x !== "object") return x;
  let here = bg;
  const d = x.styles && x.styles.desktop;
  if (d && typeof d.backgroundColor === "string") here = ON[d.backgroundColor] || null;
  if (x.type === "button" && here && x.props && (x.props.variant === "outline" || x.props.variant === "ghost")) {
    x.styles = x.styles || {}; x.styles.desktop = x.styles.desktop || {};
    if (!x.styles.desktop.color) x.styles.desktop.color = here;
    if (x.props.variant === "outline" && !x.styles.desktop.borderColor) x.styles.desktop.borderColor = here;
  }
  for (const k of ["children", "sections", "section"]) if (x[k]) repair(x[k], here);
  return x;
}
// Enveloppe une fonction de construction : renvoie le même résultat, réparé.
const wrap = (build) => (...args) => repair(build(...args));
module.exports = { repair, wrap };
