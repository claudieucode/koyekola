// EMPREINTE STRUCTURELLE d'un modèle de pied de page : sert à garantir que deux modèles ne sont pas le même squelette recoloré.
// L'empreinte ne dépend NI des couleurs, NI des textes, NI des adresses : seulement de l'arbre (types d'éléments, profondeur, ordre des blocs), de la disposition (direction, poids de colonne, centrage)
// et des widgets utilisés. Deux modèles ont la même empreinte s'ils ont la même suite de jetons.
const crypto = require("crypto");

// Jetons d'un document (section de composant) en parcours dans l'ordre d'affichage
function jetons(section) {
  const out = [];
  const walk = (n, depth) => {
    const st = (n.styles && n.styles.desktop) || {}, p = n.props || {};
    let t = `${depth}:${n.type}`;
    if (st.flexDirection === "column") t += "|v"; else if (st.flexDirection === "row") t += "|h";
    if (typeof st.flexGrow === "number") t += `|g${st.flexGrow}`;
    if (st.textAlign === "center" || st.alignItems === "center") t += "|c";
    if (st.justifyContent === "space-between") t += "|sb";
    if (p.mode) t += `|m:${p.mode}${p.accMobile ? "+mob" : ""}`;
    if (p.location) t += `|loc:${p.location}`;
    if (p.source) t += `|src:${p.source}`;
    if (p.fields) t += `|f:${p.fields}`;
    if (n.hideOn && n.hideOn.length) t += `|hide:${n.hideOn.join("+")}`;
    out.push(t);
    for (const c of n.children || []) walk(c, depth + 1);
  };
  // L'échafaudage commun à tous les modèles (conteneur racine → bande pleine largeur → contenu intérieur) ne distingue rien : on ne garde, par bande, que sa forme (nombre de blocs, fond ou non, filet) puis le contenu intérieur.
  const racine = ((section && section.children) || [])[0];
  for (const bande of (racine && racine.children) || []) {
    const inner = (bande.children || [])[0] || {}, d = (inner.styles && inner.styles.desktop) || {};
    out.push(`band|${(inner.children || []).length}|${d.flexDirection === "column" ? "v" : "h"}${inner.props && inner.props.mode ? "|acc" : ""}${d.borderStyle ? "|frame" : ""}${(bande.styles && bande.styles.desktop && bande.styles.desktop.borderTopWidth) || ""}`);
    for (const c of inner.children || []) walk(c, 0);
  }
  if (!racine) for (const c of (section && section.children) || []) walk(c, 0);
  return out;
}
const empreinte = (section) => crypto.createHash("sha1").update(jetons(section).join(">")).digest("hex");
// Similarité 0..1 : 2 × (plus longue sous-suite commune) / (longueur A + longueur B), comparée sur les jetons
function similarite(a, b) {
  const x = Array.isArray(a) ? a : jetons(a), y = Array.isArray(b) ? b : jetons(b);
  if (!x.length && !y.length) return 1;
  let prev = new Array(y.length + 1).fill(0);
  for (let i = 1; i <= x.length; i++) {
    const cur = new Array(y.length + 1).fill(0);
    for (let j = 1; j <= y.length; j++) cur[j] = x[i - 1] === y[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    prev = cur;
  }
  return (2 * prev[y.length]) / (x.length + y.length);
}
module.exports = { jetons, empreinte, similarite, SEUIL_SIMILARITE: 0.85 };
