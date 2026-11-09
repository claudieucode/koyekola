// Trois modes d'identité graphique d'un modèle (Fiche produit). Un modèle est TOUJOURS construit à partir de sa propre identité (valeurs fixes) ;
// les deux autres modes en dérivent de façon déterministe, ce qui rend le passage de l'un à l'autre réversible sans table de correspondance stockée.
//  · own    : identité indépendante — couleurs en valeurs fixes, polices de la bibliothèque locale. Une modification de la charte du site ne la change pas.
//  · site   : hérité — les couleurs deviennent les jetons du site (token:*), les polices les rôles du site (corps / titres). La forme (arrondis, bordures, casse, densité) reste celle du modèle.
//  · hybrid : le modèle garde sa direction artistique (fonds, textes, polices) mais prend la COULEUR DE MARQUE du site pour ses accents et ses boutons.
const MODES = ["own", "site", "hybrid"];
const siteSkin = (S) => ({ ...S, bg: "token:background", fg: "token:text", mute: "token:muted", alt: "token:surface", accent: "token:primary", onAccent: "token:on-primary", line: "token:surface", font: "body", head: "heading" });
const hybridSkin = (S) => ({ ...S, accent: "token:primary", onAccent: "token:on-primary" });
function skinFor(S, mode) {
  if (!S || !mode || mode === "own") return S;
  if (mode === "site") return siteSkin(S);
  if (mode === "hybrid") return hybridSkin(S);
  return S;
}

// Convertit un document DÉJÀ ENREGISTRÉ d'un mode à un autre sans écraser ce que l'utilisateur a modifié :
// les trois arbres (document courant, modèle reconstruit dans l'ancien mode, modèle reconstruit dans le nouveau) sont parcourus ensemble ;
// une valeur du document courant n'est remplacée que si elle est ENCORE égale à celle du modèle d'origine (donc jamais personnalisée).
// Un élément ajouté, supprimé ou déplacé par l'utilisateur (type différent à la même position) n'est pas touché.
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
function swapValues(cur, from, to) {
  if (!isObj(cur) || !isObj(from) || !isObj(to)) return 0;
  let n = 0;
  for (const k of Object.keys(to)) {
    if (isObj(to[k])) { if (isObj(cur[k]) && isObj(from[k])) n += swapValues(cur[k], from[k], to[k]); continue; }
    if (k in from && cur[k] === from[k] && from[k] !== to[k]) { cur[k] = to[k]; n++; }
  }
  return n;
}
function convertNodes(cur, from, to) {
  let n = 0;
  const m = Math.min(cur.length, from.length, to.length);
  for (let i = 0; i < m; i++) {
    const c = cur[i], f = from[i], t = to[i];
    if (!c || !f || !t || c.type !== f.type || f.type !== t.type) continue;
    n += swapValues(c.styles, f.styles, t.styles);
    n += swapValues(c.parts, f.parts, t.parts);
    n += swapValues(c.props, f.props, t.props);
    if (Array.isArray(c.children) && Array.isArray(f.children) && Array.isArray(t.children)) n += convertNodes(c.children, f.children, t.children);
  }
  return n;
}
module.exports = { MODES, skinFor, siteSkin, hybridSkin, convertNodes };
