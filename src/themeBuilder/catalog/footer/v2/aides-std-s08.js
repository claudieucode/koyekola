// Aides communes des pieds « standard pro animé » s08 (location de véhicules et VTC, campings et villages de vacances) : TOUT à angles droits, transitions de 360 ms.
// Liens qui glissent, capitales de rubrique, filets, carré de statut qui respire, horaires et coordonnées des « Données de l'entreprise », lettre d'information, nom du site, bouton carré.
// Fichier hors de familles/ : il n'est pas chargé comme famille.
const { G: GK, Moteur } = require("./kit-v2");
const { compact } = require("../../kit");

const DOUX = 360;
const PH = ["48px", "32px", "20px"];
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: o.casse === false ? undefined : "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const texte = (k, html, o = {}) => k.T(html.startsWith("<") ? html : `<p>${html}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, maxWidth: o.largeur, letterSpacing: o.suivi, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre, casse: o.casse }), ...enfants], { poids: o.poids ?? 1, min: o.min || "200px", gap: o.gap || "10px", extra: o.extra, mobile: o.mobile });
// Colonne de liens groupés sous un titre de rubrique : liste [[libellé, url], …]
const rubrique = (k, titre, liste, o = {}) => bloc(k, titre, liste.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "500", couleur: o.couleur, survol: o.survol || { color: o.accent, transform: { x: 5 } }, focus: o.focus || o.accent, police: o.police })), { couleurTitre: o.titreCouleur || o.accent, police: o.policeTitre, gap: "0px", min: o.min || "170px", poids: o.poids2 });
// Lettre d'information : habille toutes les parties du widget pour un fond précis (angles droits)
function lettre(k, env, G, o) {
  const abo = G.abonnement({ titre: o.titre, intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "380px", accent: o.accent, texte: o.texte, rayonBouton: "0px", rayonChamp: "0px", soulignement: o.soulignement || "2px", survolBouton: o.survolBouton, survolTexte: o.survolTexte, fondChamp: o.fondChamp, rembChamp: o.rembChamp })(k, env);
  const P = abo.parts;
  P.title.styles.desktop = { ...P.title.styles.desktop, color: o.couleurTitre || o.texte, lineHeight: 1.4 };
  P.intro.styles.desktop = { ...P.intro.styles.desktop, color: o.texte };
  P.consent.styles.desktop = { ...P.consent.styles.desktop, color: o.texte };
  P.missing.styles.desktop = { ...P.missing.styles.desktop, color: o.texte };
  P.button.styles.desktop = { ...P.button.styles.desktop, color: o.surBouton, backgroundColor: o.accent, borderRadius: "0px", transitionDuration: DOUX };
  P.button.states = { hover: { backgroundColor: o.survolBouton || o.texte, color: o.survolTexte || o.fond, transform: { y: -2 } }, focus: GK.focus(o.focus || o.texte) };
  return abo;
}
const nomDuSite = (k, env, taille, couleur, extra = {}) => {
  const S = k.S, nom = Moteur.item(k, `title:${taille}`, env);
  nom.styles.desktop = { ...nom.styles.desktop, color: couleur, fontFamily: S.head, fontWeight: "700", letterSpacing: "-0.01em", lineHeight: 1.1, ...extra };
  nom.parts = { ...(nom.parts || {}), link: { ...((nom.parts || {}).link || {}), styles: { desktop: { color: couleur, textDecoration: "none" }, mobile: { display: "inline-block", minHeight: "44px", paddingTop: "10px", paddingBottom: "10px" } } } };
  return nom;
};
// Bouton carré plein ou à contour
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "700", casse: o.casse, suivi: o.suivi, couleur: o.texte, h: o.h || "54px", padH: o.padH || "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
// Carte carrée qui se soulève : contenu = nœuds ; fond / bord / survol
function carteLift(k, enfants, o = {}) {
  const c = k.col(enfants, { flexGrow: 1, flexBasis: o.base || "0px", minWidth: o.min || "220px", gap: o.gap || "10px", backgroundColor: o.fond, borderStyle: "solid", borderWidth: o.bordure || "0px", borderColor: o.bord || o.fond, borderRadius: "0px", boxSizing: "border-box", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "26px", paddingRight: "26px", transitionDuration: DOUX, ...(o.extra || {}) }, undefined, { minWidth: "100%" });
  c.states = { hover: { transform: { y: -5 }, backgroundColor: o.fondSurvol || o.fond, borderColor: o.bordSurvol || o.bord || o.fond } };
  return c;
}
module.exports = { GK, Moteur, compact, DOUX, PH, racineDe, lien, caps, texte, trait, souffle, carre, partie, horaires, coordonnees, bloc, rubrique, lettre, nomDuSite, bouton, carteLift };
