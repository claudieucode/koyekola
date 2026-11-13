// Aides locales de l'agent s04 (extension « standard pro animé » : familles Syndics et gestion locative, Intérim et emploi).
// Tout est à ANGLES DROITS (aucun border-radius non nul), sans illustration ; transitions de 360 ms ; animations : carré de statut qui « respire », fond de rangée qui s'éclaire, carte qui se soulève, flèche qui glisse.
const { G: GK, Moteur } = require("./kit-v2");
const { compact } = require("../../kit");

const DOUX = 360; // ms : transitions de survol / focus

const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });

function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, transform: { x: 4 } }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const para = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.55, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, maxWidth: o.max, fontWeight: o.poids, ...(o.extra || {}) }));
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
// bloc : titre en petites capitales + contenu, en colonne
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.policeTitre, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "200px", gap: o.gap || "8px", extra: o.extra, mobile: o.mobile, tablette: o.tablette, aligne: o.aligne });
// colonne de liens : tableau [[libellé, url], …]
const listeLiens = (k, liste, o = {}) => liste.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "500", couleur: o.couleur, police: o.police, survol: o.survol || { color: o.accent || k.S.accent, transform: { x: o.decal ?? 5 } }, focus: o.focus || o.accent, soulign: o.soulign, extra: o.extra }));
// Lettre d'information habillée pour un fond précis (angles droits). o : titre, intro, bouton, largeur, accent, texte, couleurTitre, surBouton, fond, survolBouton, survolTexte, focus, fondChamp, rembChamp
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
// rangée numérotée cliquable : [numéro] [libellé-lien] [→] ; le fond de la rangée s'éclaire au survol et le libellé glisse
function rangee(k, num, label, url, o = {}) {
  const S = k.S, c = o.couleur || S.fg;
  if (o.simple) { // version légère : le lien lui-même est la rangée (filet bas, fond qui s'éclaire, libellé qui glisse)
    return lien(k, `${label}  →`, url, { taille: o.taille || 18, poids: o.poids || "600", couleur: c, police: o.police, h: "52px", padH: o.pad || "12px", survol: { color: o.couleurSurvol || c, backgroundColor: o.survolFond || S.surface, transform: { x: 6 } }, focus: o.focus || S.accent, extra: { width: "100%", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: o.filet || S.line } });
  }
  const l = lien(k, label, url, { taille: o.taille || 18, poids: o.poids || "600", couleur: c, police: o.police, survol: { color: o.couleurSurvol || c, transform: { x: 6 } }, focus: o.focus || S.accent, h: "52px", extra: { flexGrow: 1 } });
  const fleche = k.T("<p>→</p>", { fontSize: "20px", lineHeight: 1, color: o.fleche || o.accent || S.accent, fontFamily: S.font, flexShrink: 0 });
  const r = k.row([caps(k, num, { couleur: o.accent || S.accent, suivi: "0.16em", extra: { minWidth: "28px" } }), l, fleche], { alignItems: "center", flexWrap: "nowrap", gap: "14px", width: "100%", paddingLeft: o.pad || "12px", paddingRight: o.pad || "12px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: o.filet || S.line, borderRadius: "0px", transitionDuration: DOUX, boxSizing: "border-box" });
  r.states = { hover: { backgroundColor: o.survolFond || S.surface } };
  return r;
}
module.exports = { DOUX, racineDe, lien, caps, para, trait, souffle, carre, partie, horaires, coordonnees, bloc, listeLiens, lettre, nomDuSite, rangee };
