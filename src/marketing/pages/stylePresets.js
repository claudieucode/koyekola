// Styles enregistrés (« Enregistrer comme style ») : catégories de propriétés VISUELLES.
// Un style enregistré est une classe globale du site (nodes.normalizeClassDefs) : pas de second format. Ce module ne fait que
// déclarer quelles clés de STYLE_PROPS / COMPOSED entrent dans quelle catégorie, afin que l'éditeur et le serveur parlent de la même liste.
// Sont volontairement HORS catégories (structure, contexte parent ou fonction, jamais un « style ») : mise en page (display, flex,
// grille, placement dans le parent), position, z-index, visibilité, curseur, événements du pointeur, débordement, image de fond
// (contenu), animations d'entrée / défilement / souris (propriétés du nœud, pas du style).
const CATEGORIES = [
  { id: "colors", label: "Couleurs et arrière-plans", keys: ["color", "backgroundColor", "gradient", "overlay", "backgroundSize", "backgroundPosition", "backgroundRepeat", "backgroundAttachment"] },
  { id: "dimensions", label: "Dimensions et espacements", keys: ["width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight", "marginTop", "marginRight", "marginBottom", "marginLeft", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"] },
  { id: "typography", label: "Typographie", keys: ["fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "lineClamp", "textStrokeWidth", "textStrokeColor", "letterSpacing", "wordSpacing", "textIndent", "textTransform", "textAlign", "textDecoration", "textShadow", "whiteSpace", "textWrap", "overflowWrap", "textOverflow"] },
  { id: "borders", label: "Bordures et contours", keys: ["borderWidth", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "borderStyle", "borderColor", "borderRadius", "borderTopLeftRadius", "borderTopRightRadius", "borderBottomRightRadius", "borderBottomLeftRadius", "outlineWidth", "outlineStyle", "outlineColor", "outlineOffset"] },
  { id: "shadows", label: "Ombres et flou d'arrière-plan", keys: ["boxShadow", "shadow", "backdropBlur"] },
  { id: "motion", label: "Transformations et transitions", keys: ["transform", "transformOrigin", "transitionDuration", "transitionEasing"] },
  { id: "objects", label: "Opacité, filtres et masques", keys: ["opacity", "filter", "mixBlendMode", "mask", "objectFit", "objectPosition", "aspectRatio"] },
];
const CATEGORY_OF = new Map();
for (const c of CATEGORIES) for (const k of c.keys) CATEGORY_OF.set(k, c.id);

const categoryOf = (key) => CATEGORY_OF.get(key) || null;
const isStyleKey = (key) => CATEGORY_OF.has(key);

// Garde, dans des styles / états d'un élément, uniquement les clés des catégories choisies (et, si fourni, de la liste `only`)
// et des écrans / états choisis. Ne modifie jamais l'entrée. Les valeurs sont copiées telles quelles : absent ≠ vide.
function pick(styles, states, { categories, only, screens, stateKeys } = {}) {
  const cats = new Set(categories || CATEGORIES.map((c) => c.id));
  const keep = (k) => cats.has(categoryOf(k)) && (!only || only.includes(k));
  const slice = (src, allowed) => {
    const out = {};
    for (const [scope, set] of Object.entries(src || {})) {
      if (allowed && !allowed.includes(scope)) continue;
      const sub = {};
      for (const [k, v] of Object.entries(set || {})) if (keep(k)) sub[k] = JSON.parse(JSON.stringify(v));
      if (Object.keys(sub).length) out[scope] = sub;
    }
    return out;
  };
  return { styles: slice(styles, screens), states: slice(states, stateKeys) };
}

const counts = (styles, states) => {
  const out = {};
  for (const src of [styles, states]) for (const set of Object.values(src || {})) for (const k of Object.keys(set || {})) { const c = categoryOf(k); if (c) (out[c] = out[c] || new Set()).add(k); }
  return Object.fromEntries(Object.entries(out).map(([c, s]) => [c, s.size]));
};

module.exports = { CATEGORIES, categoryOf, isStyleKey, pick, counts };
