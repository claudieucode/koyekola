// Aides partagées par les familles « Cave, bières et spiritueux » et « Cafés et boulangeries » (pieds inspirés, angles droits partout).
const { G: GK, Moteur } = require("./kit-v2");
const { sty, compact } = require("../../kit");

const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
// Lien de texte fini par le moteur (états, 44 px mobile) puis états propres. Angles droits : borderRadius 0.
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: GK.MOUVEMENT, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const texte = (k, html, o = {}) => k.T(`<p>${html}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.fg, fontFamily: o.police || k.S.font, maxWidth: o.max, fontWeight: o.poids, textAlign: o.align, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones === true, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: GK.MOUVEMENT }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
// Abonnement à angles droits, titre habillé
function abo(k, env, G, o = {}) {
  const n = G.abonnement({ rayonBouton: "0px", rayonChamp: "0px", ...o })(k, env);
  n.parts.title.styles.desktop = { ...n.parts.title.styles.desktop, color: o.couleurTitre || o.texte || k.S.fg, ...(o.styleTitre || {}) };
  return n;
}
// Tuile / case : conteneur à angles droits, fond, cadre facultatif, survol (fond + soulèvement)
function case_(k, enfants, o = {}) {
  const n = k.col(enfants, compact({ backgroundColor: o.fond, borderStyle: o.cadre ? "solid" : undefined, borderWidth: o.cadre, borderColor: o.cadreCouleur, borderRadius: "0px", paddingTop: o.pad || "28px", paddingBottom: o.pad || "28px", paddingLeft: o.pad || "28px", paddingRight: o.pad || "28px", gap: o.gap || "12px", flexGrow: o.poids ?? 1, flexBasis: o.base || "0px", minWidth: o.min || "0px", minHeight: o.h, justifyContent: o.justifie, transitionDuration: 320, ...(o.extra || {}) }));
  if (o.survol) n.states = { hover: o.survol };
  return n;
}
// Case entière-lien : un lien bloc (libellé en grand + légende), toute la case est cliquable
function caseLien(k, titre, sousTitre, url, o = {}) {
  const S = k.S;
  const n = lien(k, `${titre}${sousTitre ? "" : ""}`, url, { taille: o.taille || 24, poids: o.poids || "700", police: o.police || S.head, couleur: o.couleur || S.fg, bloc: true, h: o.h || "44px", lh: 1.1, survol: o.survolLien || { color: o.survolCouleur || S.accent }, focus: o.focus, suivi: o.suivi, casse: o.casse, extra: { width: "100%" } });
  return n;
}
const sansCookies = (k, env, G, o = {}) => G.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env);
const pctBande = (k, enfants, o) => ({ type: "container", props: { full: true }, name: o.nom, children: enfants, ...sty(compact({ display: "flex", flexDirection: "column", backgroundColor: o.fond, width: o.largeur, paddingTop: o.padV, paddingBottom: o.padV, paddingLeft: o.padH, paddingRight: o.padH, gap: o.gap || "16px", alignItems: "flex-start" }), undefined, { width: "100%", paddingLeft: "20px", paddingRight: "20px" }) });

module.exports = { racineDe, lien, caps, texte, trait, souffle, partie, horaires, coordonnees, abo, case_, caseLien, sansCookies, pctBande, GK, Moteur, sty, compact };
