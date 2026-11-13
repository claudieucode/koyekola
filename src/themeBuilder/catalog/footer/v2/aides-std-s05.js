// Aides locales des familles « Coworking et incubateurs » et « Imprimerie et signalétique » (agent s05, extension standard).
// Tout est à ANGLES DROITS (aucun arrondi), transitions de 360 ms, aucun widget html, aucune illustration.
const { G: GK, Moteur } = require("./kit-v2");
const { compact } = require("../../kit");

const MV = 360; // ms : durée des transitions de survol (douces)
const NBSP = " ";
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });

// Lien du pied : 44 px de haut, survol et focus soignés (couleur, soulignement, décalage, fond)
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, transitionDuration: MV, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.16em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const texte = (k, html, o = {}) => k.T(`<p>${html}</p>`, compact({ fontSize: `${o.taille || 15}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, maxWidth: o.largeur, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
// Animation d'attention en boucle lente (coupée sous « mouvement réduit »)
const souffle = (n, ms = 3600) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "10px") => k.col([], { width: t, height: t, backgroundColor: couleur, borderRadius: "0px", flexShrink: 0 });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: MV }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const reseaux = (k, env, G, liste, o = {}) => G.code(`socials:${liste}${o.look ? "|" + o.look : ""}`)(k, env);
// Colonne titrée : titre en petites capitales + enfants
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre, extra: o.extraTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "200px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
// Liste de liens en colonne
const liste = (k, items, o = {}) => items.map(([t, u]) => lien(k, t, u, { taille: o.taille || 15, poids: o.poids || "500", couleur: o.couleur, survol: o.survol, focus: o.focus, police: o.police, extra: o.extra }));
// Abonnement carré
function abonnement(k, env, o) {
  const abo = GK.abonnement({ titre: o.titre, intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "380px", accent: o.accent, texte: o.texte, rayonBouton: "0px", rayonChamp: "0px", soulignement: o.soulignement || "2px", survolBouton: o.survolBouton, survolTexte: o.survolTexte })(k, env);
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.couleurTitre, lineHeight: 1.4, fontFamily: o.police };
  abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.couleurIntro || abo.parts.intro.styles.desktop.color };
  abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, transitionDuration: MV, color: o.surBouton || abo.parts.button.styles.desktop.color };
  if (o.fondChamp) abo.parts.input.styles.desktop = { ...abo.parts.input.styles.desktop, backgroundColor: o.fondChamp };
  return abo;
}
// Bouton plein à angles droits (soulève et s'inverse au survol)
const bouton = (k, label, url, o) => lien(k, label, url, { taille: 15, poids: "700", casse: "uppercase", suivi: "0.08em", couleur: o.texte, h: "52px", padH: "28px", survol: { backgroundColor: o.survolFond, color: o.survolTexte, transform: { y: -3 } }, focus: o.focus || o.survolFond, extra: { backgroundColor: o.fond, borderRadius: "0px", justifyContent: "center", alignSelf: o.soi || "flex-start" } });
// Ligne d'index : numéro + libellé ; le fond s'éclaire et le texte glisse au survol
function ligneIndex(k, num, label, url, o) {
  const n = k.LINK(`${num}${NBSP}${NBSP}${label}`, url, compact({ fontFamily: o.police, fontSize: o.taille || "fluid:22-40", fontWeight: o.poids || "700", textTransform: o.casse, letterSpacing: "0.01em", color: o.couleur, textDecoration: "none", display: "flex", alignItems: "center", width: "100%", minHeight: o.h || "68px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: o.filet, paddingLeft: "0px", paddingRight: "12px", lineHeight: 1.1, transitionDuration: MV }));
  return GK.fini(k, n, { hover: { backgroundColor: o.fondSurvol, color: o.couleurSurvol, paddingLeft: "24px", textDecoration: "none" }, focus: GK.focus(o.focus) });
}
module.exports = { MV, NBSP, racineDe, lien, caps, texte, trait, souffle, carre, partie, horaires, coordonnees, reseaux, bloc, liste, abonnement, bouton, ligneIndex };
