// Aides LOCALES partagées par les familles « mode-pret-a-porter » et « cosmetique-parfumerie » (angles droits partout, transitions de 360 ms).
// Non chargé par index.js : seulement importé par ces deux familles.
const { identite, G: GK, Moteur } = require("./kit-v2");
const { compact } = require("../../kit");
const DOUX = 360;
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
const PAD = ["48px", "32px", "20px"];
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const texte = (k, html, o = {}) => k.T(`<p>${html}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, fontWeight: o.poids, maxWidth: o.largeur, textAlign: o.align, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
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
// Widget e-mail aux angles droits ; `o.texte` = couleur lisible sur le fond de SA bande ; `o.titreC`, `o.introC`, `o.boutonC` = couleurs des parties
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg };
  if (o.titreC) n.parts.title.styles.desktop = { ...n.parts.title.styles.desktop, color: o.titreC, lineHeight: 1.4 };
  if (o.introC) n.parts.intro.styles.desktop = { ...n.parts.intro.styles.desktop, color: o.introC };
  if (o.boutonC) n.parts.button.styles.desktop = { ...n.parts.button.styles.desktop, color: o.boutonC };
  if (o.boutonH) n.parts.button.states = { hover: { backgroundColor: o.boutonH[0], color: o.boutonH[1] }, focus: GK.focus(o.boutonH[0]) };
  return n;
};
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: o.texte, h: o.h || "54px", padH: "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "200px", gap: o.gap || "8px", extra: o.extra });
const mentions = (k, env, o = {}) => GK.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env, o.centre);
const reseaux = (k, env, o) => GK.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["Pinterest", "https://www.pinterest.com/"]], { taille: 15, poids: "700", couleur: o.couleur, survol: o.survol, focus: o.focus })(k, env, o.centre);
// Le moteur refuse « gap » à deux valeurs sur un groupe / une pile : on le sépare en rowGap / columnGap
const scinde = (st) => { if (st && typeof st.gap === "string" && /^\S+\s+\S+$/.test(st.gap.trim())) { const [r, c] = st.gap.trim().split(/\s+/); const { gap, ...reste } = st; return { ...reste, rowGap: r, columnGap: c }; } return st; };
const fixe = (k) => { const o = Object.create(k); o.row = (ch, st, t, m) => k.row(ch, scinde(st), scinde(t), scinde(m)); o.col = (ch, st, t, m) => k.col(ch, scinde(st), scinde(t), scinde(m)); return o; };
module.exports = { fixe, identite, GK, Moteur, compact, DOUX, PAD, racineDe, lien, caps, texte, trait, souffle, carre, partie, horaires, coordonnees, abonnement, bouton, bloc, mentions, reseaux };
