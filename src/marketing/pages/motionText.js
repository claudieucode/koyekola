// Motion Studio, lot « t » (textes et cascade) : petites fonctions PURES partagées par les fiches de widgets (widgets/motion-*.js).
// Elles préparent les valeurs que les gabarits écrivent dans des variables CSS (`style="--kw-…"`) : couleurs du site, images, nombres formatés.
// Aucune valeur libre : tout ce qui arrive ici a déjà été validé par le schéma du widget (couleur du design system ou #rrggbb, image sûre).

// Couleur validée (« token:primary » ou « #rrggbb ») → valeur CSS (variable du site avec repli ; même règle que nodes.js colorCss)
function cssColor(v, fallback = "") {
  const s = String(v || "");
  if (!s) return fallback;
  if (!s.startsWith("token:")) return s;
  const key = s.slice(6);
  let fb = null;
  try {
    const t = require("./tokens");
    if (Object.hasOwn(t.DEFAULT_TOKENS.colors, key)) fb = t.DEFAULT_TOKENS.colors[key];
    else if (key === "on-primary") fb = t.onColor(t.DEFAULT_TOKENS.colors.primary);
    else if (key === "on-accent") fb = t.onColor(t.DEFAULT_TOKENS.colors.accent);
  } catch { fb = null; }
  return fb ? `var(--kw-${key}, ${fb})` : `var(--kw-${key})`;
}

// Adresse d'image validée → url("…") sûr dans une propriété CSS (guillemets, parenthèses, espaces et barres inverses encodés)
function cssUrl(u) {
  const s = String(u || "").replace(/[\s"'()\\<>]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0"));
  return s ? `url("${s}")` : "";
}

module.exports = { cssColor, cssUrl };
