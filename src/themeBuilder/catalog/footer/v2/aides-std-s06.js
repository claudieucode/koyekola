// Aides LOCALES de l'agent s06 (familles « Nettoyage et services généraux » et « Sécurité et serrurerie », ft2-484 à ft2-493).
// Tout est à angles droits (aucun border-radius non nul) ; transitions de 360 ms ; état de survol visible (couleur différente) sur chaque lien.
const { identifiantV2, identite, modeleV2, G: GK, Moteur } = require("./kit-v2");
const { sty, compact } = require("../../kit");

const DOUX = 360;
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const texte = (k, html, o = {}) => k.T(`<p>${html}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, maxWidth: o.max, fontWeight: o.poids, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, borderRadius: "0px", flexShrink: 0 });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: false, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "200px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
// colonne de liens groupés : titre + liste
const liste = (k, titre, liens, o = {}) => bloc(k, titre, liens.map(([t, u]) => lien(k, t, u, { taille: o.taille || 15, poids: o.poids || "500", couleur: o.couleur, survol: o.survol || { color: o.accent, transform: { x: 4 } }, focus: o.focus || o.accent })), { couleurTitre: o.couleurTitre, gap: "0px", min: o.min || "170px", poids: o.pds, police: o.policeTitre });
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
// bouton carré plein / contour
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 15, poids: "700", casse: o.casse, suivi: o.suivi, couleur: o.couleur, h: "52px", padH: "28px", survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.contour || o.fond || o.couleur, justifyContent: "center", alignSelf: o.soi, ...(o.extra || {}) } });
// carte carrée cliquable-au-survol (se soulève)
const cartel = (k, enfants, o) => {
  const c = k.col(enfants, compact({ flexGrow: 1, flexBasis: "0px", minWidth: o.min || "220px", gap: o.gap || "10px", paddingTop: o.pad || "26px", paddingBottom: o.pad || "26px", paddingLeft: o.padx || o.pad || "26px", paddingRight: o.padx || o.pad || "26px", backgroundColor: o.fond, borderStyle: "solid", borderWidth: o.bord || "1px", borderColor: o.contour, borderRadius: "0px", transitionDuration: DOUX, boxSizing: "border-box" }));
  c.states = { hover: { backgroundColor: o.fondSurvol || o.fond, borderColor: o.contourSurvol || o.contour, transform: { y: -5 } } };
  return c;
};
// ligne légale dont les liens ont un survol / focus VISIBLES sur le fond de la dernière bande (l'accent du modèle peut être proche de ce fond)
const legale = (G, k, env, o, survol) => {
  const row = G.ligneLegale(o)(k, env);
  for (const c of row.children || []) if (c.type === "bizlegal") partie(c, "link", {}, { hover: { textDecoration: "underline", color: survol }, focus: GK.focus(survol) });
  return row;
};
module.exports = { legale, identifiantV2, identite, modeleV2, GK, Moteur, sty, compact, DOUX, racineDe, lien, caps, texte, trait, souffle, carre, partie, horaires, coordonnees, bloc, liste, lettre, nomDuSite, bouton, cartel };
