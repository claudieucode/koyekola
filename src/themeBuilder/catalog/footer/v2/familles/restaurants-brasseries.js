// Famille v2 « Restaurants et brasseries » — 5 modèles (ft2-186 à ft2-190), extension « carrée 2 » : ANGLES DROITS partout (aucun border-radius non nul), sites standard très professionnels.
// Pieds de restaurant, brasserie, bistrot, traiteur et pizzeria : carte, réservation, horaires du service (widget « Données de l'entreprise »), lettre d'information, mentions légales.
// Marques fictives ; AUCUNE coordonnée, horaire, prix ni chiffre inventé : adresse, téléphone et horaires viennent des Données de l'entreprise du site (sans données, les widgets restent sobres).
// Les rubriques de la carte, formules et modes de service sont des intitulés d'EXEMPLE à renommer dans l'éditeur ; les adresses de réseaux sont des exemples. Chaque modèle a sa palette, ses polices (2 au plus) et sa composition (mode « solo »).
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions longues et douces (360 ms) de couleur, de fond et de décalage (2 à 6 px) ;
// UNE animation visible par modèle (carré de réservation qui « respire », ligne qui s'indente, carte qui se soulève) ; ni animation d'entrée ni défilement continu (limites du moteur : voir BRIEF_CARRE.md).
const FAM = "restaurants-brasseries";
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

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-186 « Ardoise du jour » — restaurant  [archétype G : index en lignes pleine largeur]
// Idée : le pied est une ARDOISE. Cinq grandes lignes de craie pleine largeur (Entrées, Plats, Desserts, Vins, Réserver une table), chacune avec sa flèche et son filet : la ligne s'indente et passe au safran au survol,
// la dernière porte un carré safran qui « respire ». En dessous, une seule bande claire à deux colonnes : horaires du service et adresse (pas de lettre). Rubriques d'exemple à renommer.
// Polices : Instrument Serif (titres) et Hanken Grotesk (texte). Mobile : lignes réduites, colonnes empilées.
const ardoise = identite({
  key: "c186", label: "Ardoise, craie et safran", humeur: "dark",
  fond: "#1e2a2d", texte: "#f2efe4", discret: "#b9c4c1", accent: "#f0b83e", surface: "#26363a", encre: "#1e2a2d", surEncre: "#f2efe4",
  police: "font.hanken-grotesk", titres: "font.instrument-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f2efe44d",
});
const ARDOISE = "#1e2a2d", CRAIE = "#f2efe4", SAFRAN = "#f0b83e", PAPIER = "#ebe7d8", OCRE = "#8a5a00";

const ardoiseDuJour = modeleV2({
  id: identifiantV2(186, "ardoise-du-jour"), concept: "c-186-ardoise-du-jour",
  name: "Ardoise du jour", family: FAM,
  description: "Pour un restaurant : cinq grandes lignes de craie pleine largeur (carte, vins, réservation) qui s'indentent au safran au survol, puis une bande claire avec les horaires du service et l'adresse. Ardoise, craie, safran.",
  tags: ["restaurant", "carte", "réservation", "horaires du service", "ardoise", "safran", "index"],
  identity: ardoise,
  racine: racineDe(PAPIER),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const L = (n, u) => indexLigne(k, n, u, { couleur: CRAIE, survol: SAFRAN, filet: "#f2efe44d", police: S.head, taille: 52, h: "84px" });
    const lignes = [L("Entrées", "/catalogue"), L("Plats", "/catalogue"), L("Desserts et fromages", "/catalogue"), L("Vins et boissons", "/catalogue")];
    const entete = k.row([souffle(carre(k, SAFRAN, "12px"), 3000), caps(k, "Cuisine maison", { couleur: SAFRAN, suivi: "0.22em" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const b1 = bouton(k, "Réserver une table", "/contact", { texte: ARDOISE, fond: SAFRAN, survol: { backgroundColor: CRAIE, borderColor: CRAIE, color: ARDOISE, transform: { y: -3 } }, focus: CRAIE, taille: 15 });
    const gauche = G.colonne(k, [entete, horaires(k, { taille: 15 })], { poids: 3, min: "260px", gap: "16px" });
    b1.styles.desktop = { ...b1.styles.desktop, width: "100%", justifyContent: "space-between" };
    const cadreArd = G.ligne(k, [gauche, G.colonne(k, [...lignes, b1], { poids: 8, min: "300px", gap: "0px" })], { gap: "36px 72px", aligne: "flex-start", largeur: "100%" });
    const haut = G.bande(k, [k.col([cadreArd], { width: "100%" })], { fond: ARDOISE, gap: "36px 72px", aligne: "flex-start", padV: ["72px", "56px", "40px"], padB: ["72px", "56px", "40px"], padH: MARGES, nom: "Ardoise" });
    const adresse = coordonnees(k, { layout: "inline", couleur: ARDOISE, lien: ARDOISE, survol: OCRE, focus: OCRE, taille: 15 });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#3b4a4d", liens: ARDOISE, sansCookies: true })(k, env);
    const bas = G.bande(k, [adresse, mentions], { fond: PAPIER, gap: "10px 40px", aligne: "center", padV: ["26px", "22px", "20px"], padB: ["26px", "22px", "20px"], padH: MARGES, nom: "Adresse et mentions" });
    bas.styles.desktop.color = ARDOISE;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-187 « Papier de brasserie » — brasserie  [archétype J : papier à en-tête]
// Idée : un PAPIER À EN-TÊTE de brasserie. Tout est centré : double filet rouge et noir, « Brasserie » en grandes capitales Playfair, un cartouche à double bordure qui réunit l'adresse et les horaires du service,
// une ligne centrée de liens séparés par des losanges carrés, les réseaux, et pour finir une mince bande noire de mentions. Pas de colonnes, pas de lettre. Crème, rouge brique, noir.
// Polices : Playfair Display (titres) et Libre Franklin (texte). Mobile : le cartouche passe sur une colonne, les liens se centrent sur plusieurs lignes.
const papier = identite({
  key: "c187", label: "Crème, rouge brique et noir", humeur: "light",
  fond: "#f3ead6", texte: "#1c1a17", discret: "#5b5446", accent: "#a8321f", surface: "#fbf5e8", encre: "#1c1a17", surEncre: "#f3ead6",
  police: "font.libre-franklin", titres: "font.playfair-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#1c1a174d",
});
const CREME = "#f3ead6", CREME2 = "#fbf5e8", BRIQUE = "#a8321f", ENCRE = "#1c1a17";

const papierBrasserie = modeleV2({
  id: identifiantV2(187, "papier-de-brasserie"), concept: "c-187-papier-de-brasserie",
  name: "Papier de brasserie", family: FAM,
  description: "Pour une brasserie : papier à en-tête centré, double filet rouge et noir, nom en grandes capitales, cartouche à double bordure avec adresse et horaires du service, ligne de liens centrée et mince bande de mentions. Crème et rouge brique.",
  tags: ["brasserie", "service continu", "papier à en-tête", "cartouche", "réservation", "crème", "rouge brique"],
  identity: papier,
  racine: racineDe(ENCRE),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const dbl = () => k.col([k.divider({ width: "100%", borderColor: BRIQUE, borderTopWidth: "4px", marginTop: "0px", marginBottom: "0px" }), k.divider({ width: "100%", borderColor: ENCRE, borderTopWidth: "1px", marginTop: "0px", marginBottom: "0px" })], { width: "100%", gap: "4px" });
    const nom = G.geant(`<p>Brasserie</p>`, { taille: [52, 150], tablette: { taille: [90, 130] }, mobile: { taille: [44, 70] }, lh: 1, suivi: "0.03em", poids: "900", police: S.head, couleur: ENCRE, align: "center", extra: { textTransform: "uppercase" } })(k, env, true);
    const sous = caps(k, "Service continu · cuisine de tradition", { couleur: BRIQUE, suivi: "0.3em", extra: { textAlign: "center" } });
    const cadre = k.col([
      k.row([G.colonne(k, [caps(k, "Adresse", { couleur: BRIQUE }), coordonnees(k, { couleur: ENCRE, lien: ENCRE, survol: BRIQUE, focus: BRIQUE })], { poids: 1, min: "230px", gap: "10px" }), G.colonne(k, [caps(k, "Horaires du service", { couleur: BRIQUE }), horaires(k, { couleur: ENCRE, taille: 15 })], { poids: 1, min: "230px", gap: "10px" })], { width: "100%", rowGap: "28px", columnGap: "56px", justifyContent: "center" }),
    ], { width: "100%", maxWidth: "820px", paddingTop: "30px", paddingBottom: "30px", paddingLeft: "36px", paddingRight: "36px", backgroundColor: CREME2, borderStyle: "double", borderWidth: "6px", borderColor: ENCRE, borderRadius: "0px" }, undefined, { paddingLeft: "18px", paddingRight: "18px" });
    const liens = [["La carte", "/catalogue"], ["Réserver une table", "/contact"], ["Privatiser la salle", "/contact"], ["Nous écrire", "/contact"]];
    const sep = () => carre(k, BRIQUE, "6px");
    const items = []; liens.forEach(([t, u], i) => { if (i) items.push(sep()); items.push(souffle2(lien(k, t, u, { taille: 17, poids: "700", couleur: ENCRE, survol: { color: BRIQUE, transform: { y: -2 } }, focus: BRIQUE, soulign: true }), i === 1)); });
    const ligneLiens = k.row(items, { rowGap: "10px", columnGap: "22px", justifyContent: "center", alignItems: "center" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"]], { taille: 14, poids: "600", couleur: "#5b5446", survol: BRIQUE, focus: BRIQUE })(k, env, true);
    const haut = G.bande(k, [dbl(), sous, nom, cadre, ligneLiens, reseaux, dbl()], { fond: CREME, colonne: true, aligne: "center", gap: "26px", padV: ["48px", "40px", "32px"], padB: ["44px", "36px", "28px"], padH: MARGES, innerMobile: { rowGap: "22px" }, nom: "Papier" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#d9d0bb", liens: CREME, sansCookies: true })(k, env, true);
    const bas = G.bande(k, [mentions], { fond: ENCRE, colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: MARGES, nom: "Mentions" });
    bas.styles.desktop.color = CREME;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);
function souffle2(n, oui) { return oui ? n : n; }

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-188 « Deux salles » — bistrot  [archétype E : deux demi-pages bord à bord]
// Idée : le pied coupé en DEUX SALLES de couleurs opposées, bord à bord. À gauche, demi-page olive : « Le bistrot. » en grand Fraunces, une phrase, le bouton de réservation (carré moutarde qui « respire »).
// À droite, demi-page lin : la note d'addition (horaires, adresse, trois lignes de liens à filet pointillé) et la lettre du bistrot. Mince bande de mentions dessous. Olive, lin, moutarde.
// Polices : Fraunces (titres) et Source Sans 3 (texte). Mobile : les deux demi-pages s'empilent.
const bistro = identite({
  key: "c188", label: "Olive, lin et moutarde", humeur: "dark",
  fond: "#3f4a22", texte: "#f4efdf", discret: "#d3d6bd", accent: "#e8bb45", surface: "#4a5628", encre: "#3f4a22", surEncre: "#f4efdf",
  police: "font.source-sans-3", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f4efdf4d",
});
const OLIVE = "#3f4a22", LIN = "#f4efdf", MOUTARDE = "#e8bb45", BRUN = "#2c2a18", ROUILLE = "#8c3d1c";

const deuxSalles = modeleV2({
  id: identifiantV2(188, "deux-salles"), concept: "c-188-deux-salles",
  name: "Deux salles", family: FAM,
  description: "Pour un bistrot : deux demi-pages bord à bord, olive à gauche avec le nom et la réservation, lin à droite avec horaires, adresse, lignes pointillées qui glissent et lettre du bistrot. Olive, lin, moutarde.",
  tags: ["bistrot", "formule du jour", "réservation", "deux demi-pages", "horaires", "olive", "moutarde"],
  identity: bistro,
  racine: racineDe(LIN),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = G.geant(`<p>Le<br>bistrot<span style="color:${MOUTARDE}">.</span></p>`, { taille: [64, 150], tablette: { taille: [100, 140] }, mobile: { taille: [60, 90] }, lh: 0.92, suivi: "-0.02em", poids: "600", police: S.head, couleur: LIN })(k, env);
    const phrase = para(k, "Cuisine de saison, produits du marché, une ardoise qui change avec les arrivages.", { taille: 19, couleur: S.mute, max: "420px" });
    const b1 = souffle(bouton(k, "Réserver", "/contact", { texte: BRUN, fond: MOUTARDE, survol: { backgroundColor: LIN, borderColor: LIN, color: OLIVE, transform: { y: -3 } }, focus: LIN }), 4000);
    const b2 = bouton(k, "La carte", "/catalogue", { texte: LIN, bord: LIN, survol: { backgroundColor: LIN, color: OLIVE, transform: { y: -3 } }, focus: MOUTARDE });
    const gauche = G.colonne(k, [caps(k, "Cuisine de bistrot", { couleur: MOUTARDE, suivi: "0.24em" }), nom, phrase, k.row([b1, b2], { gap: "12px" })], { poids: 1, min: "320px", gap: "22px", justifie: "center", extra: { backgroundColor: OLIVE, flexBasis: "50%", paddingTop: "72px", paddingBottom: "72px", paddingLeft: "64px", paddingRight: "48px" }, mobile: { paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", paddingBottom: "44px" } });
    const pointille = () => k.divider({ width: "100%", borderColor: "#2c2a1888", borderTopWidth: "2px", borderStyle: "dotted", marginTop: "0px", marginBottom: "0px" });
    const ligneT = (t, u) => k.col([lien(k, t, u, { taille: 17, poids: "600", couleur: BRUN, survol: { color: ROUILLE, paddingLeft: "10px" }, focus: ROUILLE, extra: { width: "100%" } }), pointille()], { width: "100%", gap: "0px" });
    const abo = lettre(k, env, { titre: "La lettre du bistrot", intro: "L'ardoise de la semaine, un message de temps en temps.", largeur: "100%", accent: BRUN, texte: BRUN, couleurTitre: ROUILLE, couleurIntro: "#4a4733", surBouton: LIN, survolBouton: ROUILLE, surSurvol: "#ffffff" });
    const droite = G.colonne(k, [caps(k, "Note d'addition", { couleur: ROUILLE, suivi: "0.24em", poids: "800" }), pointille(), horaires(k, { couleur: BRUN, taille: 16 }), pointille(), coordonnees(k, { couleur: BRUN, lien: BRUN, survol: ROUILLE, focus: ROUILLE }), pointille(), ligneT("Nous écrire", "/contact"), ligneT("Questions fréquentes", "/faq"), abo], { poids: 1, min: "320px", gap: "14px", justifie: "center", extra: { backgroundColor: LIN, flexBasis: "50%", paddingTop: "64px", paddingBottom: "56px", paddingLeft: "56px", paddingRight: "64px" }, mobile: { paddingLeft: "20px", paddingRight: "20px", paddingTop: "36px", paddingBottom: "36px" } });
    const salles = G.bande(k, [gauche, droite], { fond: LIN, gap: "0px", aligne: "stretch", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Deux salles" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#4a4733", liens: BRUN, sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: LIN, colonne: true, padV: ["20px", "18px", "16px"], padB: ["24px", "20px", "18px"], padH: MARGES, filetHaut: { epaisseur: "1px", couleur: "#2c2a1844" }, nom: "Mentions" });
    bas.styles.desktop.color = BRUN;
    return [G.racine(k, [salles, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-189 « Mosaïque de traiteur » — traiteur  [archétype H : mosaïque asymétrique]
// Idée : une MOSAÏQUE de quatre cases à angles droits, bord à bord. Une grande case noire (« À votre table, où que vous soyez. », bouton de devis dont le carré cuivre « respire », adresse)
// et, à sa droite, trois cases empilées de couleurs franches : « Cocktails et buffets » (sauge), « Banquets et repas assis » (cuivre), la lettre du traiteur (ivoire). Chaque case se teinte au survol. Pas de colonnes de liens.
// Formules d'exemple à renommer. Polices : Cormorant Garamond (titres) et Mulish (texte). Mobile : la grande case puis les trois petites, empilées.
const traiteur = identite({
  key: "c189", label: "Encre, cuivre, sauge et ivoire", humeur: "dark",
  fond: "#1b1b1f", texte: "#f6f1e7", discret: "#c7c3ba", accent: "#d98a4e", surface: "#26262b", encre: "#1b1b1f", surEncre: "#f6f1e7",
  police: "font.mulish", titres: "font.cormorant-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f6f1e74d",
});
const ENC = "#1b1b1f", IVOIRE = "#f6f1e7", CUIVRE = "#d98a4e", CUIVRE_F = "#8f4a1f", SAUGE = "#cfdcc3", VERT = "#2f4a2a";

const mosaiqueTraiteur = modeleV2({
  id: identifiantV2(189, "mosaique-de-traiteur"), concept: "c-189-mosaique-de-traiteur",
  name: "Mosaïque de traiteur", family: FAM,
  description: "Pour un traiteur : mosaïque asymétrique de quatre cases bord à bord (grande case noire avec devis et adresse, cocktails sur sauge, banquets sur cuivre, lettre sur ivoire) qui se teintent au survol. Encre, cuivre, sauge, ivoire.",
  tags: ["traiteur", "réceptions", "devis", "mosaïque", "cocktails", "banquets", "cuivre"],
  identity: traiteur,
  racine: racineDe(IVOIRE),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>À votre table,<br>où que vous soyez<span style="color:${CUIVRE}">.</span></p>`, { taille: [44, 92], tablette: { taille: [64, 84] }, mobile: { taille: [42, 60] }, lh: 1, suivi: "-0.01em", poids: "600", police: S.head, couleur: IVOIRE })(k, env);
    const b = souffle(bouton(k, "Demander un devis", "/contact", { texte: ENC, fond: CUIVRE, survol: { backgroundColor: IVOIRE, borderColor: IVOIRE, color: ENC, transform: { y: -3 } }, focus: IVOIRE }), 4200);
    const grande = k.col([caps(k, "Traiteur · réceptions et événements", { couleur: CUIVRE, suivi: "0.22em" }), phrase, b, coordonnees(k, { lien: IVOIRE, survol: CUIVRE, focus: CUIVRE, taille: 16 })], { flexGrow: 1, flexBasis: "56%", minWidth: "320px", gap: "26px", justifyContent: "space-between", backgroundColor: ENC, paddingTop: "64px", paddingBottom: "56px", paddingLeft: "64px", paddingRight: "56px", borderRadius: "0px" }, undefined, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", paddingBottom: "40px" });
    const petite = (fond, texte, accent, survolFond, titre, sous, url) => {
      const c = k.col([caps(k, sous, { couleur: accent, suivi: "0.2em" }), lien(k, titre + "  →", url, { taille: 34, poids: "600", police: S.head, couleur: texte, survol: { color: texte, paddingLeft: "10px" }, focus: texte, h: "52px" })], { flexGrow: 1, minHeight: "170px", justifyContent: "center", gap: "8px", backgroundColor: fond, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "36px", paddingRight: "28px", transitionDuration: DOUX, borderRadius: "0px" }, undefined, { paddingLeft: "20px", paddingRight: "20px" });
      c.states = { hover: { backgroundColor: survolFond } };
      return c;
    };
    const s1 = petite(SAUGE, ENC, "#2f4a2a", "#bccfae", "Cocktails et buffets", "Formule 1", "/contact");
    const s2 = petite(CUIVRE_F, "#ffffff", "#ffd9bd", "#733c19", "Banquets et repas assis", "Formule 2", "/contact");
    const abo = lettre(k, env, { titre: "La lettre du traiteur", intro: "Idées de menus et nouveautés : un message de temps en temps.", largeur: "100%", accent: ENC, texte: ENC, couleurTitre: CUIVRE_F, couleurIntro: "#4a463d", surBouton: IVOIRE, survolBouton: CUIVRE_F, surSurvol: "#ffffff" });
    const s3 = k.col([abo], { flexGrow: 1, minHeight: "170px", justifyContent: "center", backgroundColor: IVOIRE, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "36px", paddingRight: "28px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#1b1b1f33", borderRadius: "0px" }, undefined, { paddingLeft: "20px", paddingRight: "20px" });
    const pile = k.col([s1, s2, s3], { flexGrow: 1, flexBasis: "44%", minWidth: "300px", gap: "0px" });
    const mosaique = G.bande(k, [grande, pile], { fond: IVOIRE, gap: "0px", aligne: "stretch", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Mosaïque" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"]], { taille: 14, poids: "700", couleur: ENC, survol: CUIVRE_F, focus: CUIVRE_F })(k, env);
    const mentions = G.ligneLegale({ taille: 13, couleur: "#4a463d", liens: ENC, sansCookies: true })(k, env);
    const bas = G.bande(k, [reseaux, mentions], { fond: IVOIRE, gap: "8px 40px", aligne: "center", padV: ["18px", "16px", "14px"], padB: ["22px", "18px", "16px"], padH: MARGES, nom: "Mentions" });
    bas.styles.desktop.color = ENC;
    return [G.racine(k, [mosaique, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-190 « Damier du four » — pizzeria  [archétype C : grille de cases égales]
// Idée : un DAMIER de huit cases carrées bord à bord, tomate, crème et basilic, où CHAQUE case est un lien ou une information : Sur place, horaires du four (Données de l'entreprise), À emporter, La carte,
// adresse, Livraison, lettre de la pizzeria, réseaux. Les cases-liens se retournent (fond et texte s'inversent) au survol ; la case « Sur place » porte un carré qui « respire ». Mince bande basilic de mentions.
// Intitulés d'exemple à renommer. Polices : Anton (titres) et Karla (texte). Mobile : cases sur deux colonnes, cases d'information pleine largeur.
const four = identite({
  key: "c190", label: "Tomate, crème et basilic", humeur: "dark",
  fond: "#d3261f", texte: "#ffffff", discret: "#ffe3dc", accent: "#f6efdc", surface: "#b81d17", encre: "#d3261f", surEncre: "#ffffff",
  police: "font.karla", titres: "font.anton",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff66",
});
const TOMATE = "#d3261f", TOM_T = "#a81a14", CRM = "#f6efdc", BASILIC = "#14532d", FOUR = "#1c1412";

const damierFour = modeleV2({
  id: identifiantV2(190, "damier-du-four"), concept: "c-190-damier-du-four",
  name: "Damier du four", family: FAM,
  description: "Pour une pizzeria : damier de huit cases carrées bord à bord (sur place, horaires, à emporter, carte, adresse, livraison, lettre, réseaux) qui se retournent au survol, puis mince bande basilic. Tomate, crème, basilic.",
  tags: ["pizzeria", "à emporter", "livraison", "damier", "four à bois", "tomate", "basilic"],
  identity: four,
  racine: racineDe(BASILIC),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const cellule = (fond, enfants, o = {}) => k.col(enfants, { flexGrow: 1, flexBasis: "25%", minWidth: o.min || "150px", minHeight: "230px", justifyContent: "space-between", gap: "14px", backgroundColor: fond, paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", transitionDuration: DOUX, borderRadius: "0px" });
    // case-lien qui se retourne au survol
    const caseLien = (fond, texte, hoverFond, hoverTexte, etiquette, titre, url, pulse) => {
      const t = lien(k, titre, url, { taille: 42, poids: "400", police: S.head, casse: "uppercase", couleur: texte, survol: { color: hoverTexte }, focus: hoverTexte, h: "56px", lh: 1 });
      const haut = k.row([pulse ? souffle(carre(k, texte, "12px"), 3000) : carre(k, texte, "12px"), caps(k, etiquette, { couleur: texte, suivi: "0.2em" })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
      const c = cellule(fond, [haut, t]);
      c.states = { hover: { backgroundColor: hoverFond, transform: { y: -4 } } };
      return c;
    };
    const c1 = caseLien(TOMATE, "#ffffff", FOUR, "#ffffff", "À table", "Sur place", "/contact", true);
    const c2 = cellule(CRM, [caps(k, "Horaires du four", { couleur: TOM_T }), horaires(k, { couleur: FOUR, taille: 15 })], { min: "260px" });
    const c3 = caseLien(TOMATE, "#ffffff", FOUR, "#ffffff", "Au comptoir", "À emporter", "/contact");
    const c4 = caseLien(CRM, TOM_T, TOM_T, CRM, "Les pizzas", "La carte", "/catalogue");
    const c5 = cellule(CRM, [caps(k, "Adresse", { couleur: TOM_T }), coordonnees(k, { couleur: FOUR, lien: FOUR, survol: TOM_T, focus: TOM_T, taille: 15 })], { min: "260px" });
    const c6 = caseLien(TOMATE, "#ffffff", FOUR, "#ffffff", "Chez vous", "Livraison", "/contact");
    const abo = lettre(k, env, { titre: "La lettre de la pizzeria", intro: "Pizza du mois et soirées : un message de temps en temps.", largeur: "100%", accent: TOM_T, texte: FOUR, couleurTitre: TOM_T, couleurIntro: "#4a3a34", surBouton: "#ffffff", survolBouton: FOUR, surSurvol: "#ffffff" });
    const c7 = cellule(CRM, [abo], { min: "260px" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["Google Maps", "https://maps.google.com/"]], { taille: 17, poids: "700", couleur: "#ffffff", survol: CRM, focus: CRM })(k, env);
    const c8 = cellule(BASILIC, [caps(k, "Suivez le four", { couleur: "#d6efdc" }), k.col([reseaux], { gap: "0px" })], { min: "200px" });
    const damier = G.bande(k, [c1, c2, c3, c4, c5, c6, c7, c8], { fond: TOMATE, gap: "0px", aligne: "stretch", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Damier" });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#d6efdc", liens: "#ffffff", sansCookies: true })(k, env);
    const bas = G.bande(k, [mentions], { fond: BASILIC, colonne: true, padV: ["20px", "18px", "16px"], padB: ["20px", "18px", "16px"], padH: MARGES, nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [damier, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Restaurants et brasseries", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : restaurant, brasserie, bistrot, traiteur, pizzeria.",
  models: [ardoiseDuJour, papierBrasserie, deuxSalles, mosaiqueTraiteur, damierFour],
};
