// Briques propres au secteur « agence » (en-têtes créatifs) : rangées, cellules, bouton rond, navigation sur mesure.
// Tout est construit à partir des nœuds natifs du Page Builder (grammaire fermée) : aucune image, aucun HTML libre, aucun positionnement absolu dans une rangée.
const { sty, compact } = require("../kit");
const B = require("./blocks");
const X = require("./blocks2");

// Rangée : bande pleine largeur (fond, filets) + contenu borné à la largeur du site.
// o : bg, pv (padding vertical), top / bottom { w, c } filets, inn (styles du contenu), innT / innM (tablette / mobile du contenu), st / t / m (bande)
const row = (k, kids, o = {}) => {
  const S = k.S, rule = (side, r) => (r ? { borderStyle: "solid", [`border${side}Width`]: r.w || "1px", borderColor: r.c || S.line } : {});
  return B.band(S, [B.inner(kids, { justifyContent: "space-between", maxWidth: o.max || "1240px", ...(o.inn || {}) }, o.innT, o.innM)],
    compact({ backgroundColor: o.bg || S.bg, color: o.fg || S.fg, paddingTop: o.pv || "16px", paddingBottom: o.pv || "16px", paddingLeft: o.px, paddingRight: o.px, ...rule("Top", o.top), ...rule("Bottom", o.bottom), ...(o.st || {}) }), o.t, o.m);
};
// Rangée sans bornes (cellules collées au bord) : le contenu occupe toute la largeur
const flush = (k, kid, o = {}) => B.band(k.S, [kid], compact({ backgroundColor: o.bg || k.S.bg, paddingLeft: "0px", paddingRight: "0px", paddingTop: o.pv || "0px", paddingBottom: o.pv || "0px",
  ...(o.bottom ? { borderStyle: "solid", borderBottomWidth: o.bottom.w, borderColor: o.bottom.c } : {}), ...(o.top ? { borderStyle: "solid", borderTopWidth: o.top.w, borderColor: o.top.c } : {}) }), { paddingLeft: "0px", paddingRight: "0px" }, { paddingLeft: "0px", paddingRight: "0px" });

// Cellule de grille (case à bordures franches)
const cell = (kids, st = {}, t, m) => B.g(kids, { alignItems: "center", gap: "12px", ...st }, t, m);

// Bouton rond (cercle plein) : label court, texte centré, jamais d'image
const roundBtn = (k, label, url, o = {}) => B.btn(k, label, url, "solid", { bg: o.bg, fg: o.fg, radius: "999px", padV: "0px", padH: "8px", size: o.size || "12px", weight: "800", caps: o.caps, track: o.track, font: o.font, st: compact({ width: `${o.size2 || 96}px`, height: `${o.size2 || 96}px`, whiteSpace: "normal", textAlign: "center", justifyContent: "center", alignItems: "center", display: "flex", lineHeight: 1.1, ...(o.st || {}) }) });

// Navigation dont la liste occupe toute la largeur disponible (liens répartis) : parties « Liste » et « Lien » du menu affecté
const navSpread = (k, kind, o = {}) => {
  const n = B.nav(k, kind, o);
  n.parts = { ...n.parts, list: { styles: { desktop: { ...(n.parts.list && n.parts.list.styles.desktop), display: "flex", justifyContent: o.justify || "space-between", width: "100%", gap: o.gap || "18px" } } } };
  n.styles.desktop = { ...(n.styles.desktop || {}), flexGrow: 1, width: "100%" };
  return n;
};
// Adoucit tous les états (survol, focus) d'un menu : durée de transition natives
const smooth = (n, ms = 260) => { n.parts = { ...n.parts, link: { ...n.parts.link, styles: { ...n.parts.link.styles, desktop: { ...n.parts.link.styles.desktop, transitionDuration: ms } } } }; return n; };
// Fixe un style sur une partie d'un menu (liste, lien…) sans toucher au reste
const part = (n, name, desktop, extra = {}) => { n.parts = { ...n.parts, [name]: { ...(n.parts[name] || {}), styles: { ...((n.parts[name] || {}).styles || {}), desktop: { ...(((n.parts[name] || {}).styles || {}).desktop || {}), ...desktop }, ...extra } } }; return n; };
const style = (node, desktop, tablet, mobile) => ({ ...node, styles: { ...(node.styles || {}), desktop: { ...((node.styles || {}).desktop || {}), ...desktop }, ...(tablet ? { tablet: { ...((node.styles || {}).tablet || {}), ...tablet } } : {}), ...(mobile ? { mobile: { ...((node.styles || {}).mobile || {}), ...mobile } } : {}) } });

module.exports = { row, flush, cell, roundBtn, navSpread, smooth, part, style, sty, compact, B, X };
