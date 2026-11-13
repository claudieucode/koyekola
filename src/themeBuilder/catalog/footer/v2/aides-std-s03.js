// Aides communes aux familles « Banques et mutuelles » et « Télécoms et accès internet » (agent s03) : angles droits, transitions de 360 ms, aucun arrondi.
const { identite, G: GK, Moteur } = require("./kit-v2");
const { compact } = require("../../kit");

const MV = 360; // ms : durée des transitions de survol (douces)
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });

// Lien fini (44 px de haut) : survol par défaut = couleur d'accent + soulignement
function lien(k, label, url, o = {}) {
  const S = k.S;
  const n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, transitionDuration: MV, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
// Petites capitales espacées
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.16em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const texte = (k, html, o = {}) => k.T(`<p>${html}</p>`, compact({ fontSize: `${o.taille || 15}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, maxWidth: o.largeur, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const court = (k, couleur, epaisseur = "4px", largeur = "56px") => k.divider({ width: largeur, borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
// Pulse lent (aucun repli animé en mouvement réduit)
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
// Colonne titrée
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre, extra: o.extraTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "200px", gap: o.gap || "4px", extra: o.extra, mobile: o.mobile });
// Colonne de liens : liste [[libellé, url], …]
const liensCol = (k, liste, o = {}) => liste.map(([t, u]) => lien(k, t, u, { taille: o.taille || 15, poids: o.poids || "500", couleur: o.couleur, survol: o.survol || { color: o.accent || k.S.accent, transform: { x: 4 } }, focus: o.focus || o.accent }));
// Abonnement carré
function abonnement(k, env, o) {
  const abo = GK.abonnement({ titre: o.titre, intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "380px", accent: o.accent, texte: o.texte, rayonBouton: "0px", rayonChamp: "0px", soulignement: o.soulignement || "2px", survolBouton: o.survolBouton, survolTexte: o.survolTexte })(k, env);
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.couleurTitre, lineHeight: 1.4, fontFamily: o.police };
  abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.couleurIntro || abo.parts.intro.styles.desktop.color };
  abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, transitionDuration: MV, color: o.surBouton || abo.parts.button.styles.desktop.color };
  abo.parts.missing.styles.desktop = { ...abo.parts.missing.styles.desktop, color: o.texte || abo.parts.missing.styles.desktop.color };
  if (o.fondChamp) abo.parts.input.styles.desktop = { ...abo.parts.input.styles.desktop, backgroundColor: o.fondChamp };
  return abo;
}
// Carte-lien : titre + sous-texte, filet haut, se soulève et change de fond au survol
function carteLien(k, o) {
  const S = k.S;
  const t = k.LINK(o.titre, o.url, { fontFamily: o.police || S.head, fontSize: o.tailleTitre || "22px", fontWeight: o.poidsTitre || "700", color: o.couleur, textDecoration: "none", lineHeight: 1.15, display: "flex", alignItems: "center", minHeight: "44px", transitionDuration: MV });
  GK.fini(k, t, { hover: { color: o.survolCouleur || o.accent, textDecoration: "underline" }, focus: GK.focus(o.accent) });
  const enfants = [o.num ? caps(k, o.num, { couleur: o.couleurNum || o.accent, suivi: "0.2em" }) : null, t, o.sous ? texte(k, o.sous, { taille: 14, couleur: o.couleurSous || S.mute, lh: 1.5 }) : null].filter(Boolean);
  const c = k.col(enfants, { flexGrow: 1, flexBasis: "0px", minWidth: o.min || "200px", gap: "8px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "22px", paddingRight: "22px", borderStyle: "solid", borderWidth: "1px", borderColor: o.contour, borderRadius: "0px", backgroundColor: o.fond, transitionDuration: MV });
  c.states = { hover: { backgroundColor: o.fondSurvol || o.fond, borderColor: o.accent, transform: { y: -6 } } };
  return c;
}
// Ligne d'index : numéro + libellé grands, le fond se remplit et le texte se décale au survol
function ligneIndex(k, num, label, url, o) {
  const n = k.LINK(`${num}   ${label}`, url, compact({ fontFamily: o.police, fontSize: o.taille || "fluid:24-44", fontWeight: o.poids || "600", textTransform: o.casse, letterSpacing: "0.01em", color: o.couleur, textDecoration: "none", display: "flex", alignItems: "center", width: "100%", minHeight: o.h || "68px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: o.filet, paddingLeft: "0px", paddingRight: "12px", lineHeight: 1.1, transitionDuration: MV }));
  return GK.fini(k, n, { hover: { backgroundColor: o.fondSurvol, color: o.couleurSurvol, paddingLeft: "24px", textDecoration: "none" }, focus: GK.focus(o.focus) });
}
// Bouton carré plein
const bouton = (k, label, url, o = {}) => lien(k, label, url, { taille: 15, poids: "700", casse: "uppercase", suivi: "0.08em", couleur: o.couleur, h: "52px", padH: "28px", survol: { backgroundColor: o.survolFond, color: o.survolCouleur, transform: { y: -3 } }, focus: o.focus || o.survolFond, extra: { backgroundColor: o.fond, borderRadius: "0px", justifyContent: "center", alignSelf: o.soi || "flex-start", ...(o.extra || {}) } });
// Dernière bande : la ligne légale reprend la couleur de la bande
const dernier = (b, couleur) => { b.styles.desktop = { ...b.styles.desktop, color: couleur }; return b; };

// Ligne légale en PILE (copyright au-dessus des liens légaux, alignée à gauche) : forme différente de la rangée habituelle
// Ligne légale sans cadre (le kit encadre la ligne dès qu'une couleur est imposée)
function legale(k, env, G, o = {}) {
  const r = G.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env);
  const d = { ...r.styles.desktop }; for (const c of ["borderStyle", "borderWidth", "borderColor", "borderRadius", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight"]) delete d[c];
  r.styles.desktop = d; if (r.styles.mobile) { const m = { ...r.styles.mobile }; for (const c of ["paddingTop", "paddingBottom", "paddingLeft", "paddingRight"]) delete m[c]; r.styles.mobile = m; }
  return r;
}
function legalePile(k, env, G, o = {}) {
  const r = legale(k, env, G, o);
  r.styles.desktop = { ...r.styles.desktop, flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", rowGap: "6px" };
  if (r.styles.mobile) r.styles.mobile = { ...r.styles.mobile, rowGap: "6px" };
  for (const c of r.children || []) c.styles = { ...(c.styles || {}), desktop: { ...((c.styles || {}).desktop || {}), textAlign: "left", alignSelf: "flex-start", justifyContent: "flex-start" } };
  return r;
}
module.exports = { legale, legalePile, MV, racineDe, lien, caps, texte, trait, court, souffle, carre, partie, horaires, coordonnees, bloc, liensCol, abonnement, carteLien, ligneIndex, bouton, dernier, identite, GK };
