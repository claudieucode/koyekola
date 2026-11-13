// Famille v2 « Luxe et hôtellerie de prestige » — 6 modèles (ft2-428 à ft2-433), lot « inspiré de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Inspirations (idées de composition seulement) : capture 40 = grand nom à deux tons et lettre à gauche, liens à droite, filet puis copyright et réseaux ; capture 41 = bandeau marque + réseaux, filet pleine largeur,
// colonnes à petit soulignement d'accent, abonnement, bande sombre de mentions. Traduit ici en index, mosaïque, chronologie, papier à en-tête, console, escalier.
// Marques fictives ; AUCUNE coordonnée, tarif, classement, étoile ni label inventé : adresse, téléphone et horaires viennent des Données de l'entreprise du site. Libellés d'EXEMPLE à renommer dans l'éditeur.
// Chaque modèle : palette, polices (2 au plus) et archétype de composition propres (mode « solo »).
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms, décalages de 2 à 6 px ; UNE animation visible par modèle (carré-signal qui « respire », ligne qui s'indente, case qui se soulève).
// Ni animation d'entrée ni défilement continu.
const FAM = "luxe-hotellerie";
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");


const DOUX = 360; // ms : durée des transitions de survol / focus

// ── Aides LOCALES à la famille (toutes à angles droits) ──────────────────────────────────────────────────────────────────────────────────────
const racineDe = (fond) => ({ desktop: { backgroundColor: fond, gap: "0px" } });
function lien(k, label, url, o = {}) {
  const S = k.S, n = k.LINK(label, url, compact({ fontSize: `${o.taille || 15}px`, fontWeight: o.poids || "500", fontFamily: o.police || S.font, color: o.couleur || S.fg, textDecoration: o.soulign ? "underline" : "none", display: o.bloc ? "flex" : "inline-flex", alignItems: "center", minHeight: o.h || "44px", paddingLeft: o.padH, paddingRight: o.padH, lineHeight: o.lh, letterSpacing: o.suivi, textTransform: o.casse, borderRadius: "0px", transitionDuration: DOUX, ...(o.extra || {}) }));
  return GK.fini(k, n, { hover: o.survol || { color: S.accent, textDecoration: "underline" }, focus: GK.focus(o.focus || S.accent) });
}
const caps = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: o.taille || "12px", lineHeight: 1.4, fontWeight: o.poids || "700", textTransform: "uppercase", letterSpacing: o.suivi || "0.14em", color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, ...(o.extra || {}) }));
const trait = (k, couleur, epaisseur = "1px") => k.divider({ width: "100%", borderColor: couleur, borderTopWidth: epaisseur, marginTop: "0px", marginBottom: "0px" });
const souffle = (n, ms = 3200) => { n.motion = { entrance: "pulse", trigger: "load", duration: ms, iterations: "infinite", easing: "ease-in-out" }; return n; };
const carre = (k, couleur, t = "12px") => k.col([], { width: t, height: t, backgroundColor: couleur, flexShrink: 0, borderRadius: "0px" });
function partie(n, nom, styles, etats) {
  const p = (n.parts || {})[nom] || {};
  n.parts = { ...(n.parts || {}), [nom]: { ...p, styles: { ...(p.styles || {}), desktop: { ...((p.styles || {}).desktop || {}), ...styles } }, states: { ...(p.states || {}), ...(etats || {}) } } };
  return n;
}
const horaires = (k, o = {}) => Moteur.finishNode(k.S, k.W("bizhours", { title: "", showOpenNow: false, /* le point rond « ouvert / fermé » du widget a un arrondi de 50 % imposé : écarté */ groupDays: true, showExceptions: true, showNote: true, closedLabel: "Fermé" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
const coordonnees = (k, o = {}) => {
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones === true, layout: o.layout || "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%", textAlign: o.align, ...(o.align === "center" ? { display: "flex", justifyContent: "center" } : {}) }));
  return partie(n, "link", { color: o.lien || o.couleur || k.S.fg, textDecoration: "underline", transitionDuration: DOUX }, { hover: { color: o.survol || k.S.accent }, focus: GK.focus(o.focus || k.S.accent) });
};
const bloc = (k, titre, enfants, o = {}) => GK.colonne(k, [caps(k, titre, { couleur: o.couleurTitre, police: o.police, taille: o.tailleTitre, suivi: o.suiviTitre }), ...enfants], { poids: o.poids ?? 1, min: o.min || "220px", gap: o.gap || "12px", extra: o.extra, mobile: o.mobile });
const abonnement = (k, env, o) => {
  const n = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", ...o })(k, env);
  n.parts.missing.styles.desktop = { ...n.parts.missing.styles.desktop, color: o.texte || k.S.fg }; // message « non configuré » lisible sur le fond de SA bande
  return n;
};
// Bouton plein ou à contour, angles droits, qui se soulève et change de couleur au survol
const bouton = (k, t, u, o) => lien(k, t, u, { taille: o.taille || 16, poids: "800", casse: "uppercase", suivi: "0.08em", couleur: o.texte, h: "54px", padH: "28px", police: o.police, survol: o.survol, focus: o.focus, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.bord || o.fond || o.texte, justifyContent: "center", ...(o.extra || {}) } });
// Bande de couleur franche (barre pleine largeur de hauteur fixe)
const barre = (G, k, couleur, h = ["12px", "10px", "8px"]) => G.bande(k, [], { fond: couleur, padV: h, padB: h, padH: ["0px", "0px", "0px"], nom: "Barre" });
// Lettre d'information habillée aux couleurs de la bande (titre, intro, bouton plein à angles droits)
const lettre = (k, env, o) => {
  const abo = abonnement(k, env, { titre: o.titre, intro: o.intro, bouton: o.bouton || "Je m'abonne", largeur: o.largeur || "340px", accent: o.accent, texte: o.texte });
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.couleurTitre || o.accent, lineHeight: 1.4 };
  abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.couleurIntro || o.texte };
  abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: o.surBouton };
  abo.parts.button.states = { hover: { backgroundColor: o.survolBouton || o.texte, color: o.surSurvol || o.surBouton }, focus: GK.focus(o.focus || o.texte) };
  return abo;
};
const MARGES = ["48px", "32px", "20px"];
// Texte courant simple
const para = (k, texte, o = {}) => k.T(`<p>${texte}</p>`, compact({ fontSize: `${o.taille || 16}px`, lineHeight: o.lh || 1.6, color: o.couleur || k.S.mute, fontFamily: o.police || k.S.font, maxWidth: o.max, textAlign: o.align, fontWeight: o.poids }));
// Ligne-index : grand libellé, flèche, filet bas (pleine largeur)
const indexLigne = (k, label, url, o) => k.row([lien(k, label, url, { taille: o.taille || 44, poids: o.poids || "400", police: o.police, couleur: o.couleur, h: o.h || "72px", survol: { color: o.survol, paddingLeft: "16px" }, focus: o.survol, extra: { flexGrow: 1 } }), k.T("<p>→</p>", { fontSize: "28px", color: o.survol, fontFamily: k.S.font, flexShrink: 0 })], { width: "100%", alignItems: "center", flexWrap: "nowrap", gap: "12px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: o.filet });
const filetC = (k, couleur, l = "28px", e = "3px") => k.divider({ width: l, borderColor: couleur, borderTopWidth: e, marginTop: "0px", marginBottom: "0px" });
const reseauxEx = [["Facebook", "https://www.facebook.com/"], ["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"]];
// Colonne de liens : titre en capitales, petit filet d'accent, liens qui s'indentent au survol
const colLiens = (k, titre, items, o) => k.col([caps(k, titre, { couleur: o.titre, suivi: "0.16em", taille: "13px", police: o.policeTitre }), filetC(k, o.filet || o.titre), ...items.map(([t, u]) => lien(k, t, u, { taille: o.taille || 16, poids: o.poids || "500", couleur: o.lien, survol: { color: o.survol, paddingLeft: "6px" }, focus: o.survol }))], { flexGrow: 1, flexBasis: o.base || "160px", minWidth: o.min || "140px", gap: "6px" });

// ═══ ft2-428 « Registre des maisons » — palace  [archétype G : index en lignes pleine largeur]
// Idée : un sommaire de livre d'or. Six grandes lignes pleine largeur (Cormorant 40 px, flèche, filet) : Les suites, Le spa, La table, Les événements, La conciergerie, Réserver. Chaque ligne s'indente en or au survol.
// En tête, le nom et les réseaux ; en pied, adresse en ligne et mentions. Aucune carte. Ivoire, encre, or. Polices : Cormorant Garamond (titres) et Jost (texte). Mobile : lignes plus petites.
const IVO = "#f7f2e8", ENCRE2 = "#1c1a17", OR2 = "#8d6b2a";
const registreId = identite({ key: "c428", label: "Ivoire, encre et or", humeur: "light", fond: IVO, texte: ENCRE2, discret: "#4d4840", accent: OR2, surface: "#fffdf8", encre: ENCRE2, surEncre: IVO, police: "font.jost", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#1c1a174d" });
const registre = modeleV2({
  id: identifiantV2(428, "registre-des-maisons"), concept: "c-428-registre-des-maisons", name: "Registre des maisons", family: FAM,
  description: "Pour un palace ou un hôtel de prestige : un sommaire en six grandes lignes pleine largeur (suites, spa, table, événements, conciergerie, réserver) qui s'indentent en or, nom et réseaux en tête. Ivoire, encre, or.",
  tags: ["palace", "hôtel de luxe", "index", "sommaire", "grandes lignes", "ivoire", "or"],
  identity: registreId, racine: racineDe(IVO),
  widgets: [ "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = k.row([souffle(carre(k, OR2, "10px"), 3400), lien(k, "Maison Aurélien", "/", { taille: 22, poids: "600", police: S.head, suivi: "0.12em", casse: "uppercase", couleur: ENCRE2, survol: { color: OR2 }, focus: OR2 })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const reseaux = G.reseauxTexte(reseauxEx, { taille: 14, couleur: ENCRE2, survol: OR2, focus: OR2 })(k, env);
    const tete = k.row([nom, reseaux], { width: "100%", justifyContent: "space-between", alignItems: "center", rowGap: "6px", columnGap: "32px" });
    const idx = (t, u) => lien(k, `${t}   →`, u, { taille: 40, poids: "500", police: S.head, couleur: ENCRE2, bloc: true, h: "84px", survol: { color: OR2, paddingLeft: "24px" }, focus: OR2, extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#1c1a174d", boxSizing: "border-box" } });
    const lignes = k.col([idx("Les suites", "/catalogue"), idx("Le spa", "/blog"), idx("La table", "/blog"), idx("Les événements", "/faq"), idx("La conciergerie", "/faq"), idx("Réserver", "/contact")], { width: "100%", gap: "0px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: ENCRE2 });
    const adresse = coordonnees(k, { layout: "inline", couleur: "#4d4840", lien: ENCRE2, survol: OR2, focus: OR2, taille: 14 });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#4d4840", liens: ENCRE2, sansCookies: true })(k, env);
    const bande = G.bande(k, [tete, lignes, k.row([adresse, mentions], { width: "100%", justifyContent: "space-between", alignItems: "center", rowGap: "10px", columnGap: "36px" })], { fond: IVO, colonne: true, aligne: "stretch", gap: "36px", padV: ["56px", "44px", "32px"], padB: ["40px", "32px", "26px"], padH: MARGES, nom: "Registre" });
    bande.styles.desktop.color = ENCRE2;
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═══ ft2-429 « Mosaïque de la maison » — maison d'exception  [archétype H : une grande case et trois petites]
// Idée : mosaïque asymétrique à joints d'émeraude. Grande case CHAMPAGNE à gauche (grande phrase en Bodoni Moda, bouton de réservation dont le carré respire) ; à droite trois cases empilées : adresse (vert clair),
// lettre (ivoire), liens et mentions (vert nuit). Émeraude, champagne, ivoire. Polices : Bodoni Moda (titres) et Raleway (texte). Mobile : les quatre cases s'empilent.
const EME = "#0f2a22", EME2 = "#1b4637", EME3 = "#0a1c16", CHAMP = "#d8c18a", IV3 = "#f4efe2";
const mosId = identite({ key: "c429", label: "Émeraude, champagne et ivoire", humeur: "dark", fond: EME, texte: IV3, discret: "#c5d6cd", accent: CHAMP, surface: EME2, encre: EME, surEncre: IV3, police: "font.raleway", titres: "font.bodoni-moda", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f4efe24d" });
const mosaique = modeleV2({
  id: identifiantV2(429, "mosaique-de-la-maison"), concept: "c-429-mosaique-de-la-maison", name: "Mosaïque de la maison", family: FAM,
  description: "Pour une maison d'exception : une grande case champagne avec phrase et réservation, et trois cases (adresse, lettre, liens et mentions) à joints d'émeraude. Émeraude, champagne, ivoire.",
  tags: ["maison d'exception", "mosaïque", "asymétrique", "réservation", "émeraude", "champagne", "cases"],
  identity: mosId, racine: racineDe(EME),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>L'art de recevoir, sans compter le temps<span style="color:#7a1f2b">.</span></p>`, { taille: [34, 64], lh: 1.08, suivi: "-0.01em", poids: "500", police: S.head, couleur: EME })(k, env);
    const b = souffle(bouton(k, "Réserver un séjour", "/contact", { texte: CHAMP, fond: EME, survol: { backgroundColor: "#7a1f2b", borderColor: "#7a1f2b", color: "#ffffff", transform: { y: -3 } }, focus: "#7a1f2b", taille: 15 }), 4000);
    const grande = k.col([caps(k, "Hôtel Villa Émeraude", { couleur: "#5a3d00", suivi: "0.24em", poids: "800" }), phrase, b], { flexGrow: 1, flexBasis: "55%", minWidth: "300px", gap: "30px", justifyContent: "space-between", backgroundColor: CHAMP, paddingTop: "56px", paddingBottom: "56px", paddingLeft: "48px", paddingRight: "48px", boxSizing: "border-box", borderRadius: "0px" }, { flexBasis: "100%" }, { flexBasis: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "36px", paddingBottom: "36px" });
    const petite = (fond, enfants) => k.col(enfants, { width: "100%", gap: "12px", backgroundColor: fond, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "32px", paddingRight: "32px", boxSizing: "border-box", borderRadius: "0px" }, undefined, { paddingLeft: "20px", paddingRight: "20px" });
    const abo = lettre(k, env, { titre: "La lettre de la villa", intro: "Une nouvelle de temps en temps.", largeur: "100%", accent: EME, texte: EME, couleurTitre: "#7a1f2b", couleurIntro: "#26443a", surBouton: IV3, survolBouton: "#7a1f2b", surSurvol: "#ffffff" });
    const liens = k.row([["Chambres", "/catalogue"], ["Table", "/blog"], ["Spa", "/blog"], ["Contact", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 15, poids: "600", couleur: IV3, padH: "4px", survol: { color: CHAMP, transform: { y: -2 } }, focus: CHAMP })), { rowGap: "0px", columnGap: "20px" });
    const droite = k.col([
      petite(EME2, [caps(k, "Adresse", { couleur: CHAMP, suivi: "0.2em", poids: "800" }), coordonnees(k, { couleur: IV3, lien: IV3, survol: CHAMP, focus: CHAMP, taille: 15 })]),
      petite(IV3, [abo]),
      petite(EME3, [liens, G.ligneLegale({ taille: 13, couleur: "#c5d6cd", liens: IV3, sansCookies: true })(k, env)]),
    ], { flexGrow: 1, flexBasis: "38%", minWidth: "300px", gap: "6px", borderRadius: "0px" }, { flexBasis: "100%" }, { flexBasis: "100%" });
    const bande = G.bande(k, [grande, droite], { fond: EME, gap: "6px", aligne: "stretch", max: "100%", padV: ["6px", "6px", "6px"], padB: ["6px", "6px", "6px"], padH: ["6px", "6px", "6px"], nom: "Mosaïque" });
    bande.styles.desktop.color = IV3;
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═══ ft2-430 « Chronologie du séjour » — hôtel de charme  [archétype I : chronologie à points carrés]
// Idée : à droite, une CHRONOLOGIE VERTICALE sur un filet d'or : cinq points carrés (Arrivée, Les suites, La table, Le bien-être, Le départ), chacun avec son titre-lien en Gloock et une ligne d'explication ; le
// premier point respire. À gauche, une grande phrase, l'adresse et les mentions. Bordeaux, or pâle, crème. Polices : Gloock (titres) et Mulish (texte). Mobile : phrase puis chronologie.
const BORD = "#3a0f1c", OR3 = "#e3c37b", CREME = "#f7ecdd";
const chronoId = identite({ key: "c430", label: "Bordeaux, or pâle et crème", humeur: "dark", fond: BORD, texte: CREME, discret: "#e1cbc0", accent: OR3, surface: "#4a1a2a", encre: BORD, surEncre: CREME, police: "font.mulish", titres: "font.gloock", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f7ecdd4d" });
const chrono = modeleV2({
  id: identifiantV2(430, "chronologie-du-sejour"), concept: "c-430-chronologie-du-sejour", name: "Chronologie du séjour", family: FAM,
  description: "Pour un hôtel de charme : chronologie verticale sur filet d'or à cinq points carrés (arrivée, suites, table, bien-être, départ), grande phrase, adresse et mentions à gauche. Bordeaux, or pâle, crème.",
  tags: ["hôtel de charme", "chronologie", "séjour", "points carrés", "bordeaux", "or", "vertical"],
  identity: chronoId, racine: racineDe(BORD),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Cinq temps, un seul séjour<span style="color:${OR3}">.</span></p>`, { taille: [38, 76], tablette: { taille: [48, 64] }, mobile: { taille: [36, 46] }, lh: 1.04, suivi: "-0.01em", poids: "400", police: S.head, couleur: CREME })(k, env);
    const gauche = k.col([caps(k, "Hôtel Le Vermeil", { couleur: OR3, suivi: "0.24em", poids: "800" }), phrase, coordonnees(k, { couleur: "#e1cbc0", lien: CREME, survol: OR3, focus: OR3, taille: 15 }), G.ligneLegale({ taille: 13, couleur: "#e1cbc0", liens: CREME, sansCookies: true, pile: true })(k, env)], { flexGrow: 1, flexBasis: "45%", minWidth: "280px", gap: "28px", justifyContent: "space-between" });
    const etape = (n, nom, texte, url, pulse) => k.row([pulse ? souffle(carre(k, OR3, "15px"), 3000) : carre(k, OR3, "15px"), k.col([lien(k, nom, url, { taille: 30, poids: "400", police: S.head, couleur: CREME, h: "48px", survol: { color: OR3, paddingLeft: "10px" }, focus: OR3 }), para(k, texte, { taille: 15, couleur: "#e1cbc0", max: "360px" })], { gap: "2px" })], { width: "100%", flexWrap: "nowrap", alignItems: "flex-start", gap: "29px", marginLeft: "-44px", paddingTop: "4px", boxSizing: "border-box" });
    const rail = k.col([etape(1, "L'arrivée", "Conditions d'arrivée et accès.", "/faq", true), etape(2, "Les suites", "Les chambres, une à une.", "/catalogue"), etape(3, "La table", "La carte et les salons.", "/blog"), etape(4, "Le bien-être", "Soins, bassin et détente.", "/blog"), etape(5, "Le départ", "Conditions de départ.", "/faq")], { width: "100%", gap: "34px", paddingLeft: "44px", paddingTop: "8px", paddingBottom: "8px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: OR3, boxSizing: "border-box" });
    const droite = k.col([rail], { flexGrow: 1, flexBasis: "45%", minWidth: "280px", paddingLeft: "7px", boxSizing: "border-box" });
    const bande = G.bande(k, [gauche, droite], { fond: BORD, gap: "40px 96px", aligne: "stretch", padV: ["80px", "64px", "44px"], padB: ["72px", "56px", "40px"], padH: MARGES, nom: "Chronologie" });
    bande.styles.desktop.color = CREME;
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═══ ft2-431 « Papier du palace » — maison historique  [archétype J : papier à en-tête centré]
// Idée : un papier à en-tête. Tout est centré : double filet cuivre, monogramme dans un carré, nom en Italiana et grandes capitales, cartouche à double bordure (adresse et horaires), ligne de liens centrée, double filet, mentions.
// Papier blanc, bleu nuit, cuivre. Polices : Italiana (nom) et EB Garamond (texte). Mobile : tout reste centré et s'empile.
const PAPB = "#fbfaf7", MIN = "#0f1b33", CUIV = "#a4632f";
const papierId = identite({ key: "c431", label: "Papier blanc, bleu nuit et cuivre", humeur: "light", fond: PAPB, texte: MIN, discret: "#454e63", accent: CUIV, surface: "#ffffff", encre: MIN, surEncre: PAPB, police: "font.eb-garamond", titres: "font.italiana", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#0f1b334d" });
const papier = modeleV2({
  id: identifiantV2(431, "papier-du-palace"), concept: "c-431-papier-du-palace", name: "Papier du palace", family: FAM,
  description: "Pour une maison historique : pied en papier à en-tête, entièrement centré, double filet cuivre, monogramme carré, nom en grandes capitales, cartouche à double bordure (adresse, horaires) et liens en ligne. Papier blanc, bleu nuit, cuivre.",
  tags: ["maison historique", "papier à en-tête", "centré", "cartouche", "double filet", "cuivre", "bleu nuit"],
  identity: papierId, racine: racineDe(PAPB),
  widgets: ["text", "link", "bizcontact", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const regle = k.row([trait(k, CUIV, "3px"), souffle(carre(k, CUIV, "12px"), 4200), trait(k, CUIV, "3px")], { width: "100%", alignItems: "center", flexWrap: "nowrap", gap: "16px" });
    const mono = k.col([k.T(`<p style="text-align:center">V</p>`, { fontSize: "34px", color: MIN, fontFamily: S.head, textAlign: "center", lineHeight: 1 })], { width: "64px", height: "64px", alignItems: "center", justifyContent: "center", borderStyle: "solid", borderWidth: "2px", borderColor: CUIV, boxSizing: "border-box", borderRadius: "0px" });
    const nom = G.geant(`<p style="text-align:center">HÔTEL VALMONT</p>`, { taille: [36, 84], tablette: { taille: [44, 64] }, mobile: { taille: [30, 40] }, lh: 1, suivi: "0.12em", poids: "400", police: S.head, couleur: MIN })(k, env);
    const cell = (titre, enfant) => k.col([caps(k, titre, { couleur: CUIV, suivi: "0.22em", poids: "800", extra: { textAlign: "center" } }), enfant], { flexGrow: 1, flexBasis: "240px", minWidth: "220px", gap: "8px", alignItems: "center", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "22px", paddingRight: "22px", boxSizing: "border-box", borderStyle: "solid", borderWidth: "1px", borderColor: MIN, borderRadius: "0px" });
    const cartouche = k.row([cell("Adresse", coordonnees(k, { align: "center", couleur: MIN, lien: MIN, survol: CUIV, focus: CUIV, taille: 17 })), cell("Horaires", horaires(k, { couleur: MIN, taille: 17 }))], { width: "100%", maxWidth: "820px", gap: "6px", padding: "6px", boxSizing: "border-box", borderStyle: "solid", borderWidth: "3px", borderColor: MIN, borderRadius: "0px" });
    const liens = k.row([["Chambres", "/catalogue"], ["Restaurant", "/blog"], ["Salons", "/faq"], ["Histoire", "/"], ["Réserver", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 17, poids: "500", couleur: MIN, casse: "uppercase", suivi: "0.16em", padH: "12px", survol: { color: CUIV, transform: { y: -2 } }, focus: CUIV })), { rowGap: "0px", columnGap: "12px", justifyContent: "center", alignItems: "center" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#454e63", liens: MIN, sansCookies: true })(k, env, true);
    const bande = G.bande(k, [regle, mono, nom, cartouche, liens, trait(k, CUIV, "1px"), mentions], { fond: PAPB, colonne: true, aligne: "center", gap: "28px", padV: ["48px", "40px", "28px"], padB: ["36px", "30px", "24px"], padH: MARGES, nom: "Papier à en-tête" });
    bande.styles.desktop.color = MIN; bande.styles.desktop.textAlign = "center";
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═══ ft2-432 « Console du concierge » — conciergerie  [archétype K : fenêtre / console]
// Idée : le pied est une fenêtre de conciergerie sur fond anthracite : barre de titre platine avec trois carrés, colonne d'onglets verticaux (Suites, Spa, Table, Événements, Conciergerie) qui s'allument en or rose, panneau
// de droite avec message, bouton « Écrire au concierge » (le carré respire), adresse, horaires et lettre ; barre d'état avec les mentions. Anthracite, platine, or rose. Polices : Tenor Sans et Manrope.
const ANT = "#1b1b1f", PLAT = "#e7e5e0", ROSEOR = "#d7a28c", ANT2 = "#26262c";
const consoleId = identite({ key: "c432", label: "Anthracite, platine et or rose", humeur: "dark", fond: ANT, texte: PLAT, discret: "#b9b7b1", accent: ROSEOR, surface: ANT2, encre: ANT, surEncre: PLAT, police: "font.manrope", titres: "font.tenor-sans", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#e7e5e04d" });
const consoleC = modeleV2({
  id: identifiantV2(432, "console-du-concierge"), concept: "c-432-console-du-concierge", name: "Console du concierge", family: FAM,
  description: "Pour une conciergerie ou un hôtel de luxe : pied en fenêtre avec onglets verticaux, panneau de contact (adresse, horaires, lettre, bouton au concierge) et barre d'état de mentions. Anthracite, platine, or rose.",
  tags: ["conciergerie", "hôtel de luxe", "fenêtre", "onglets", "console", "anthracite", "or rose"],
  identity: consoleId, racine: racineDe(ANT),
  widgets: ["text", "link", "bizcontact", "bizhours", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titreBarre = k.row([caps(k, "Conciergerie · Hôtel Solstice", { couleur: ANT, suivi: "0.2em", poids: "800" }), k.row([carre(k, ANT, "12px"), carre(k, ROSEOR, "12px"), carre(k, ANT, "12px")], { gap: "6px", flexWrap: "nowrap" })], { width: "100%", justifyContent: "space-between", alignItems: "center", backgroundColor: PLAT, paddingTop: "12px", paddingBottom: "12px", paddingLeft: "20px", paddingRight: "20px", flexWrap: "nowrap", boxSizing: "border-box" });
    const onglet = (t, u) => lien(k, t, u, { taille: 17, poids: "500", police: S.head, couleur: PLAT, bloc: true, h: "56px", padH: "22px", survol: { backgroundColor: ROSEOR, color: ANT, paddingLeft: "32px" }, focus: ROSEOR, extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#e7e5e033", boxSizing: "border-box" } });
    const onglets = k.col([onglet("Les suites", "/catalogue"), onglet("Le spa", "/blog"), onglet("La table", "/blog"), onglet("Les événements", "/faq"), onglet("La conciergerie", "/faq")], { flexGrow: 0, flexShrink: 0, flexBasis: "260px", minWidth: "220px", gap: "0px", backgroundColor: ANT2, borderStyle: "solid", borderWidth: "0px", borderRightWidth: "1px", borderColor: "#e7e5e066", borderRadius: "0px" }, { flexBasis: "100%", borderRightWidth: "0px" }, { flexBasis: "100%", borderRightWidth: "0px" });
    const b = souffle(bouton(k, "Écrire au concierge", "/contact", { texte: ANT, fond: ROSEOR, survol: { backgroundColor: PLAT, borderColor: PLAT, color: ANT, transform: { y: -3 } }, focus: PLAT, taille: 15 }), 4200);
    const abo = lettre(k, env, { titre: "Lettre du concierge", intro: "Adresses et attentions, de temps en temps.", largeur: "320px", accent: ROSEOR, texte: PLAT, couleurTitre: ROSEOR, couleurIntro: "#b9b7b1", surBouton: ANT, survolBouton: PLAT, surSurvol: ANT });
    const panneau = k.col([caps(k, "Demande au concierge", { couleur: ROSEOR, suivi: "0.22em", poids: "800" }), para(k, "Une demande particulière, un transfert, une table : écrivez-nous, nous nous en occupons.", { taille: 17, couleur: "#d4d2cc", max: "480px" }), b], { flexGrow: 1, flexBasis: "0px", minWidth: "300px", gap: "22px", justifyContent: "center", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "36px", paddingRight: "36px", boxSizing: "border-box", backgroundColor: ANT, borderRadius: "0px" }, undefined, { paddingLeft: "18px", paddingRight: "18px" });
    const corps = k.row([onglets, panneau], { width: "100%", gap: "0px", alignItems: "stretch", flexWrap: "wrap" });
    const cC = (enfants, poids) => k.col(enfants, { flexGrow: poids, flexBasis: "200px", minWidth: "200px", gap: "8px" });
    const contact = k.row([cC([caps(k, "Adresse", { couleur: "#b9b7b1" }), coordonnees(k, { couleur: PLAT, lien: PLAT, survol: ROSEOR, focus: ROSEOR, taille: 15 })], 1), cC([caps(k, "Horaires", { couleur: "#b9b7b1" }), horaires(k, { couleur: PLAT, taille: 15 })], 1), cC([abo], 1.2)], { width: "100%", rowGap: "24px", columnGap: "40px", alignItems: "flex-start", paddingTop: "24px", paddingBottom: "28px", paddingLeft: "36px", paddingRight: "36px", boxSizing: "border-box", backgroundColor: ANT, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#e7e5e066" }, undefined, { paddingLeft: "18px", paddingRight: "18px" });
    const etat = k.col([G.ligneLegale({ taille: 13, couleur: "#b9b7b1", liens: PLAT, sansCookies: true })(k, env)], { width: "100%", backgroundColor: ANT2, paddingTop: "12px", paddingBottom: "12px", paddingLeft: "24px", paddingRight: "24px", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#e7e5e066", borderRadius: "0px" }, undefined, { paddingLeft: "18px", paddingRight: "18px" });
    const fenetre = k.col([titreBarre, corps, contact, etat], { width: "100%", maxWidth: "1100px", gap: "0px", borderStyle: "solid", borderWidth: "2px", borderColor: PLAT, boxSizing: "border-box", borderRadius: "0px" });
    const bande = G.bande(k, [fenetre], { fond: ANT, colonne: true, aligne: "center", padV: ["56px", "44px", "28px"], padB: ["56px", "44px", "28px"], padH: MARGES, nom: "Console" });
    bande.styles.desktop.color = PLAT;
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═══ ft2-433 « Marches du palace » — grand hôtel  [archétype L : escalier de bandes décroissantes]
// Idée : quatre marches alignées à gauche, de plus en plus étroites (100 %, 78 %, 56 %, 34 %) et de plus en plus claires en prune : le nom en Prata sur la grande marche, les cinq liens, l'adresse et les horaires, puis
// la lettre et les mentions sur la petite marche. Le vide à droite reste ivoire. Prune, ivoire, or. Polices : Prata (titres) et Jost (texte). Mobile : les marches prennent toute la largeur.
const PR1 = "#2b1030", PR2 = "#43204a", PR3 = "#5e3267", PR4 = "#7a4a85", IV4 = "#f6efe4", OR4 = "#e6c27a";
const marchesId = identite({ key: "c433", label: "Prune, ivoire et or", humeur: "light", fond: IV4, texte: "#2b1030", discret: "#52445a", accent: "#8a5a10", surface: "#fffaf2", encre: PR1, surEncre: IV4, police: "font.jost", titres: "font.prata", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#2b10304d" });
const marches = modeleV2({
  id: identifiantV2(433, "marches-du-palace"), concept: "c-433-marches-du-palace", name: "Marches du palace", family: FAM,
  description: "Pour un grand hôtel : quatre marches alignées à gauche, de plus en plus étroites et claires (nom, liens, adresse et horaires, lettre et mentions), sur fond ivoire. Prune, ivoire, or.",
  tags: ["grand hôtel", "escalier", "étagé", "bandes décroissantes", "prune", "ivoire", "or"],
  identity: marchesId, racine: racineDe(IV4),
  widgets: ["text", "link", "bizcontact", "bizhours", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const marche = (fond, largeur, enfants, pad) => k.col(enfants, { width: largeur, gap: "20px", backgroundColor: fond, paddingTop: pad, paddingBottom: pad, paddingLeft: "48px", paddingRight: "48px", boxSizing: "border-box", borderRadius: "0px" }, { width: largeur === "100%" ? "100%" : "88%" }, { width: "100%", paddingLeft: "20px", paddingRight: "20px" });
    const nom = G.geant(`<p>Grand Hôtel Sélène<span style="color:${OR4}">.</span></p>`, { taille: [36, 92], tablette: { taille: [44, 64] }, mobile: { taille: [32, 42] }, lh: 1.02, suivi: "-0.01em", poids: "400", police: S.head, couleur: IV4 })(k, env);
    const m1 = marche(PR1, "100%", [k.row([souffle(carre(k, OR4, "12px"), 3400), caps(k, "Hôtel de prestige", { couleur: OR4, suivi: "0.26em", poids: "800" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" }), nom], "56px");
    const liens = k.row([["Chambres", "/catalogue"], ["Restaurant", "/blog"], ["Spa", "/blog"], ["Séminaires", "/faq"], ["Réserver", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 18, poids: "500", police: S.head, couleur: IV4, survol: { color: OR4, transform: { y: -3 } }, focus: OR4 })), { rowGap: "2px", columnGap: "32px" });
    const m2 = marche(PR2, "78%", [liens], "20px");
    const m3 = marche(PR3, "56%", [G.ligne(k, [G.colonne(k, [caps(k, "Adresse", { couleur: OR4, suivi: "0.2em", poids: "800" }), coordonnees(k, { couleur: IV4, lien: IV4, survol: OR4, focus: OR4, taille: 15 })], { poids: 1, min: "200px", gap: "8px" }), G.colonne(k, [caps(k, "Horaires", { couleur: OR4, suivi: "0.2em", poids: "800" }), horaires(k, { couleur: IV4, taille: 15 })], { poids: 1, min: "200px", gap: "8px" })], { gap: "20px 40px", aligne: "flex-start", largeur: "100%" })], "28px");
    const abo = lettre(k, env, { titre: "Lettre du Grand Hôtel", intro: "Une nouvelle de temps en temps.", largeur: "100%", accent: IV4, texte: IV4, couleurTitre: "#ffffff", couleurIntro: "#ffffff", surBouton: PR1, survolBouton: OR4, surSurvol: PR1 });
    const m4 = marche(PR4, "34%", [abo, G.ligneLegale({ taille: 13, couleur: "#ffffff", liens: "#ffffff", sansCookies: true, pile: true })(k, env)], "28px");
    const bande = G.bande(k, [m1, m2, m3, m4], { fond: IV4, colonne: true, aligne: "flex-start", gap: "0px", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Marches" });
    bande.styles.desktop.color = "#2b1030";
    return [G.racine(k, [bande])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Luxe et hôtellerie de prestige", target: 6, built: true,
  description: "Pieds inspirés de captures, angles droits, animations fluides : palace, maison d'exception, hôtel de charme, maison historique, conciergerie, grand hôtel.",
  models: [registre, mosaique, chrono, papier, consoleC, marches],
};
