// Famille v2 « Vétérinaires et animaux » — 5 modèles (ft2-261 à ft2-265), extension « carrée 2 » : ANGLES DROITS partout (aucun border-radius non nul), sites standard très professionnels.
// Pieds : clinique vétérinaire, toilettage, pension, éducateur canin, animalerie. Urgences en texte GÉNÉRIQUE (« appelez votre clinique ou le service de garde de votre secteur ») : aucun numéro d'urgence inventé,
// aucun chiffre, tarif ni horaire inventé : adresse, téléphone et horaires viennent des Données de l'entreprise du site (sans données, les widgets restent sobres). Aucune image.
// Rubriques, prestations et rayons = intitulés d'EXEMPLE à renommer dans l'éditeur ; adresses de réseaux = exemples. Chaque modèle a sa palette, ses polices (2 au plus) et son archétype de composition (mode « solo »).
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») :
//   · transitions longues et douces (360 ms) de couleur, de fond, de contour et de décalage (2 à 6 px) ;
//   · UNE animation visible par modèle : carré d'urgence qui respire, case qui s'éclaire, étape qui se remplit, curseur de console qui clignote doucement (pulse), rayon qui se soulève ;
//   · pas d'animation d'entrée, pas de widget « Défilement continu » (limites du moteur : voir BRIEF_CARRE.md).
const { modeleV2, identifiantV2, identite, G: GK, Moteur } = require("../kit-v2");
const { compact } = require("../../../kit");

const FAM = "veterinaires-animaux";

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
  const n = Moteur.finishNode(k.S, k.W("bizcontact", { title: "", showName: false, showAddress: true, showPhone: true, showEmail: true, showIcons: o.icones === true, layout: "stack" }, { color: o.couleur || k.S.fg, fontSize: `${o.taille || 15}px`, fontFamily: o.police || k.S.font, lineHeight: 1.55, width: "100%" }));
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

const PV = ["72px", "56px", "44px"], PB = ["64px", "52px", "40px"], PH = ["48px", "32px", "20px"];
const ZERO = ["0px", "0px", "0px"];
const ABO_STYLE = (abo, o) => { // habille le widget e-mail : titre, texte, bouton et survol du bouton
  abo.parts.title.styles.desktop = { ...abo.parts.title.styles.desktop, color: o.titre };
  abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: o.intro };
  abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: o.boutonTexte };
  abo.parts.button.states = { hover: { backgroundColor: o.survolFond, color: o.survolTexte }, focus: GK.focus(o.focus) };
  return abo;
};

// ═══ ft2-261 « Garde et urgences » — clinique vétérinaire — ARCHÉTYPE F : bandeau d'appel XXL + colonne étroite de liens ═══
// Idée : en tête, un BANDEAU ROUGE XXL « Urgence ? Appelez sans attendre. » (texte générique : clinique ou service de garde de votre secteur, aucun numéro inventé) avec un carré qui respire et un bouton blanc vers les coordonnées.
// En dessous, une grande zone blanche (carte de la clinique : coordonnées + horaires du widget) et, à droite, UNE colonne étroite de liens (soins, vaccination, chirurgie, imagerie, rendez-vous). Blanc, vert sapin, rouge urgence.
// Polices : Red Hat Display (titres) et Nunito Sans (texte). Mobile : le bandeau garde sa taille, la colonne de liens passe sous la carte.
const clinique = identite({
  key: "c261", label: "Blanc, vert sapin et rouge urgence", humeur: "light",
  fond: "#ffffff", texte: "#12302b", discret: "#44605a", accent: "#0b6b5c", surface: "#eef5f3", encre: "#12302b", surEncre: "#ffffff",
  police: "font.nunito-sans", titres: "font.red-hat-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#12302b33",
});
const BLANC = "#ffffff", SAPIN = "#12302b", TEAL = "#0b6b5c", URGENCE = "#b3131b";
const gardeUrgences = modeleV2({
  id: identifiantV2(261, "garde-et-urgences"), concept: "c-261-garde-et-urgences",
  name: "Garde et urgences", family: FAM,
  description: "Pour une clinique vétérinaire : bandeau rouge XXL « Urgence ? Appelez sans attendre » (texte générique, aucun numéro inventé), carte blanche de la clinique (coordonnées et horaires) et une seule colonne étroite de liens. Blanc, vert sapin, rouge.",
  tags: ["clinique vétérinaire", "vétérinaire", "urgences", "garde", "horaires", "rendez-vous", "rouge", "blanc"],
  identity: clinique,
  racine: racineDe(BLANC),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Urgence&nbsp;?<br>Appelez sans attendre.</p>`, { taille: [40, 100], tablette: { taille: [64, 88] }, mobile: { taille: [40, 56] }, lh: 0.98, suivi: "-0.025em", poids: "800", police: S.head, couleur: BLANC })(k, env);
    const marque = k.row([souffle(carre(k, BLANC, "14px"), 2200), caps(k, "Urgences vétérinaires", { couleur: BLANC, suivi: "0.22em", police: S.head })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const txt = k.T("<p>En cas d'urgence vitale, appelez sans attendre votre clinique ou le service de garde de votre secteur. Hors des heures d'ouverture, suivez les indications du répondeur.</p>", { fontSize: "18px", lineHeight: 1.6, color: BLANC, fontFamily: S.font, maxWidth: "460px" });
    const b1 = bouton(k, "Voir les coordonnées", "/contact", { texte: URGENCE, fond: BLANC, survol: { backgroundColor: SAPIN, borderColor: SAPIN, color: BLANC, transform: { y: -3 } }, focus: SAPIN });
    const haut = G.bande(k, [G.colonne(k, [marque, phrase], { poids: 7, min: "300px", gap: "22px" }), G.colonne(k, [txt, k.row([b1], { gap: "12px" })], { poids: 5, min: "280px", gap: "24px", soi: "flex-end" })], { fond: URGENCE, gap: "36px 64px", aligne: "flex-end", padV: ["72px", "56px", "44px"], padB: ["64px", "52px", "40px"], padH: PH, nom: "Bandeau d'urgence" });
    // zone blanche : carte + colonne étroite
    const carteGauche = G.colonne(k, [caps(k, "Clinique vétérinaire", { couleur: TEAL, police: S.head }), coordonnees(k, { couleur: SAPIN, lien: SAPIN, survol: TEAL, focus: TEAL, taille: 17 })], { poids: 1, min: "240px", gap: "14px" });
    const carteDroite = G.colonne(k, [caps(k, "Horaires d'ouverture", { couleur: TEAL, police: S.head }), horaires(k, { couleur: SAPIN, taille: 16 })], { poids: 1, min: "240px", gap: "14px" });
    const carte = k.row([carteGauche, carteDroite], { rowGap: "32px", columnGap: "48px", flexWrap: "wrap", alignItems: "flex-start", flexGrow: 1, flexBasis: "0px", minWidth: "300px", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "32px", paddingRight: "32px", backgroundColor: "#eef5f3", borderStyle: "solid", borderWidth: "2px", borderColor: SAPIN });
    const li = (t, u) => lien(k, t, u, { taille: 17, poids: "700", couleur: SAPIN, h: "52px", bloc: true, survol: { color: TEAL, transform: { x: 6 } }, focus: TEAL, extra: { width: "100%", borderBottomStyle: "solid", borderBottomWidth: "1px", borderBottomColor: "#12302b44" } });
    const etroite = G.colonne(k, [caps(k, "Accès rapide", { couleur: TEAL, police: S.head }), li("Prendre rendez-vous", "/contact"), li("Consultations", "/blog"), li("Vaccination et identification", "/blog"), li("Chirurgie et imagerie", "/blog"), li("Conseils aux propriétaires", "/blog"), li("Questions fréquentes", "/faq")], { poids: 0, base: "270px", min: "250px", gap: "0px", extra: { flexGrow: 0, flexShrink: 0 } });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [carte, etroite, trait(k, S.line), mentions], { fond: BLANC, gap: "36px 56px", aligne: "flex-start", padV: ["56px", "44px", "36px"], padB: ["28px", "24px", "20px"], padH: PH, innerMobile: { rowGap: "28px" }, nom: "Carte et accès rapide" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-262 « Bain moussant » — toilettage — ARCHÉTYPE H : mosaïque asymétrique (une grande case + trois petites) ═══
// Idée : une MOSAÏQUE de cases collées. À gauche, une grande case framboise (« Bain, coupe, câlins. » et la carte du salon à filets pointillés) ; à droite, trois petites cases empilées : crème (« Prendre rendez-vous »),
// prune (horaires du salon), rose pâle (contact). Chaque petite case s'éclaire au survol ; barre prune pour mentions. Framboise, crème, prune. Polices : Fredoka (titres) et Nunito (texte). Prestations d'exemple, sans tarif.
const bain = identite({
  key: "c262", label: "Framboise, crème et prune", humeur: "dark",
  fond: "#c2255c", texte: "#ffffff", discret: "#ffe3ec", accent: "#fff3c4", surface: "#a81d4d", encre: "#c2255c", surEncre: "#ffffff",
  police: "font.nunito", titres: "font.fredoka",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#ffffff55",
});
const FRAMB = "#c2255c", CREMEB = "#fff3c4", PRUNE = "#5c1238", ROSEP = "#fbd5e1", INKB = "#3b0a22";
const bainMoussant = modeleV2({
  id: identifiantV2(262, "bain-moussant"), concept: "c-262-bain-moussant",
  name: "Bain moussant", family: FAM,
  description: "Pour un salon de toilettage : mosaïque de cases collées, une grande case framboise (« Bain, coupe, câlins. » et carte du salon à filets pointillés) et trois petites (rendez-vous, horaires, contact) qui s'éclairent. Framboise, crème, prune.",
  tags: ["toilettage", "salon de toilettage", "chiens et chats", "mosaïque", "rendez-vous", "framboise", "crème"],
  identity: bain,
  racine: racineDe(PRUNE),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Bain, coupe,<br>câlins<span style="color:${CREMEB}">.</span></p>`, { taille: [44, 96], tablette: { taille: [64, 88] }, mobile: { taille: [44, 60] }, lh: 1.0, suivi: "-0.01em", poids: "600", police: S.head, couleur: "#ffffff" })(k, env);
    const ligneCarte = (nom, note) => {
      const l = lien(k, nom, "/blog", { taille: 19, poids: "700", couleur: "#ffffff", h: "48px", survol: { color: CREMEB, transform: { x: 6 } }, focus: CREMEB });
      const pointilles = k.col([], { flexGrow: 1, height: "1px", minWidth: "24px", borderBottomStyle: "dotted", borderBottomWidth: "2px", borderBottomColor: "#ffffffaa", alignSelf: "center" });
      const n = k.T(`<p>${note}</p>`, { fontSize: "15px", color: "#ffe3ec", fontFamily: S.font, fontStyle: "italic" });
      return k.row([l, pointilles, n], { gap: "12px", flexWrap: "nowrap", alignItems: "center", width: "100%" });
    };
    const grande = k.col([caps(k, "Salon de toilettage", { couleur: CREMEB, suivi: "0.2em", police: S.head }), phrase, k.col([ligneCarte("Bain et séchage", "selon le poil"), ligneCarte("Coupe et tonte", "selon la race"), ligneCarte("Démêlage", "selon l'état du pelage"), ligneCarte("Griffes et oreilles", "soins du quotidien")], { gap: "0px", width: "100%", maxWidth: "560px" })], { flexGrow: 3, flexBasis: "0px", minWidth: "320px", backgroundColor: FRAMB, gap: "24px", justifyContent: "space-between", paddingTop: "56px", paddingBottom: "48px", paddingLeft: "44px", paddingRight: "44px" }, undefined, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px" });
    const rdv = lien(k, "Prendre rendez-vous", "/contact", { taille: 26, poids: "600", couleur: INKB, police: S.head, h: "132px", bloc: true, padH: "32px", survol: { backgroundColor: INKB, color: CREMEB, transform: { y: -3 } }, focus: INKB, extra: { width: "100%", backgroundColor: CREMEB, justifyContent: "space-between", flexGrow: 1 } });
    const petiteHor = k.col([caps(k, "Horaires du salon", { couleur: CREMEB, police: S.head }), horaires(k, { couleur: "#ffffff", taille: 15 })], { backgroundColor: PRUNE, gap: "12px", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "32px", paddingRight: "32px", width: "100%" });
    const petiteContact = k.col([caps(k, "Nous trouver", { couleur: "#8a1c4a", police: S.head }), coordonnees(k, { couleur: INKB, lien: INKB, survol: "#8a1c4a", focus: INKB, taille: 15 })], { backgroundColor: ROSEP, gap: "12px", paddingTop: "26px", paddingBottom: "26px", paddingLeft: "32px", paddingRight: "32px", width: "100%" });
    const droite = k.col([rdv, petiteHor, petiteContact], { flexGrow: 2, flexBasis: "0px", minWidth: "300px", gap: "0px" });
    const mosaique = G.bande(k, [k.row([grande, droite], { gap: "0px", flexWrap: "wrap", width: "100%", alignItems: "stretch" })], { fond: FRAMB, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", nom: "Mosaïque" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"]], { taille: 15, poids: "700", couleur: "#ffffff", survol: CREMEB, focus: CREMEB })(k, env);
    const mentions = G.ligneLegale({ taille: 13, couleur: "#f3c4d4", liens: "#ffffff", sansCookies: true })(k, env);
    const bas = G.bande(k, [reseaux, mentions], { fond: PRUNE, gap: "12px 40px", aligne: "center", padV: ["24px", "22px", "18px"], padH: PH, innerMobile: { rowGap: "12px" }, nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [mosaique, bas])];
  },
}, FAM);

// ═══ ft2-263 « Maison de garde » — pension — ARCHÉTYPE B : nom monumental seul au centre ═══
// Idée : presque rien. Un seul MOT géant centré, « Pension », en Zilla Slab sur ardoise, un petit libellé ambre au-dessus et trois liens (réserver, visiter, questions) sous le mot, dans un grand vide.
// Tout en bas, une petite bande plus sombre avec les horaires d'accueil et le contact (Données de l'entreprise) puis les mentions. Pas de lettre. Ardoise du soir, ambre, lin. Polices : Zilla Slab (titres) et Karla (texte).
const pension = identite({
  key: "c263", label: "Ardoise du soir et ambre", humeur: "dark",
  fond: "#2f3e4e", texte: "#f3efe6", discret: "#c3ccd4", accent: "#f2b84b", surface: "#3a4c5f", encre: "#2f3e4e", surEncre: "#f3efe6",
  police: "font.karla", titres: "font.zilla-slab",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f3efe655",
});
const ARDOISE = "#2f3e4e", ARDOISE2 = "#263341", AMBRE = "#f2b84b", LIN = "#f3efe6";
const sejour = modeleV2({
  id: identifiantV2(263, "maison-de-garde"), concept: "c-263-maison-de-garde",
  name: "Maison de garde", family: FAM,
  description: "Pour une pension canine et féline : un seul mot géant, « Pension », centré sur ardoise dans un grand vide, trois liens (réserver, visiter, questions), puis une petite bande avec horaires d'accueil, contact et mentions. Ardoise, ambre, lin.",
  tags: ["pension", "pension canine", "pension féline", "nom monumental", "minimal", "ardoise", "ambre"],
  identity: pension,
  racine: racineDe(ARDOISE2),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, centre = { textAlign: "center" };
    const etiq = caps(k, "Pension canine et féline", { couleur: AMBRE, suivi: "0.4em", police: S.head, extra: centre });
    const mot = G.geant(`<p>Pension<span style="color:${AMBRE}">.</span></p>`, { taille: [64, 200], tablette: { taille: [120, 190] }, mobile: { taille: [60, 100] }, lh: 0.95, suivi: "-0.03em", poids: "700", police: S.head, couleur: LIN, extra: centre })(k, env);
    const liens = k.row([["Réserver un séjour", "/contact"], ["Visiter la pension", "/blog"], ["Questions", "/faq"]].map(([t, u]) => lien(k, t, u, { taille: 17, poids: "700", couleur: LIN, casse: "uppercase", suivi: "0.14em", survol: { color: AMBRE, transform: { y: -3 } }, focus: AMBRE, extra: { borderBottomStyle: "solid", borderBottomWidth: "2px", borderBottomColor: AMBRE } })), { rowGap: "8px", columnGap: "44px", justifyContent: "center", alignItems: "center" });
    const haut = G.bande(k, [etiq, mot, liens], { fond: ARDOISE, colonne: true, aligne: "center", gap: "30px", padV: ["120px", "96px", "72px"], padB: ["128px", "100px", "76px"], padH: PH, innerMobile: { rowGap: "24px" }, nom: "Mot monumental" });
    const colH = bloc(k, "Horaires d'accueil", [horaires(k, { couleur: LIN, taille: 14 })], { couleurTitre: AMBRE, min: "240px", poids: 1, police: S.head });
    const colC = bloc(k, "Nous trouver", [coordonnees(k, { couleur: LIN, lien: LIN, survol: AMBRE, focus: AMBRE, taille: 14 })], { couleurTitre: AMBRE, min: "240px", poids: 1, police: S.head });
    const mentions = G.ligneLegale({ taille: 13, couleur: "#c3ccd4", liens: LIN, sansCookies: true })(k, env);
    const bas = G.bande(k, [colH, colC, trait(k, "#f3efe640"), mentions], { fond: ARDOISE2, gap: "28px 64px", aligne: "flex-start", padV: ["36px", "32px", "28px"], padB: ["24px", "20px", "18px"], padH: PH, innerMobile: { rowGap: "22px" }, nom: "Horaires et contact" });
    bas.styles.desktop.color = LIN;
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══ ft2-264 « Séance en cours » — éducateur canin — ARCHÉTYPE K : fenêtre / console ═══
// Idée : le pied ressemble à une FENÊTRE d'application posée sur fond lin : barre de titre vert avec trois carrés et « seance.txt », à gauche une liste de commandes en police mono (« > education-chiot », « > rappel »…) qui se
// colorent d'orange au survol, à droite le contact, et, en bas de la fenêtre, un petit formulaire (lettre) sur une ligne ; le curseur « _ » respire. Lin, vert prairie, orange récompense. Polices : DM Mono (titres) et Mulish (texte).
const canin = identite({
  key: "c264", label: "Lin, vert prairie et orange récompense", humeur: "light",
  fond: "#ece9e1", texte: "#1f2a1f", discret: "#4a564a", accent: "#2f6b3a", surface: "#fffdf8", encre: "#1f2a1f", surEncre: "#fffdf8",
  police: "font.mulish", titres: "font.dm-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#1f2a1f40",
});
const LINC = "#ece9e1", FENETRE = "#fffdf8", PRAIRIE = "#2f6b3a", ORREC = "#f08a24", NOIRV = "#1f2a1f";
const seance = modeleV2({
  id: identifiantV2(264, "seance-en-cours"), concept: "c-264-seance-en-cours",
  name: "Séance en cours", family: FAM,
  description: "Pour un éducateur canin : le pied est une fenêtre à angles droits avec barre de titre verte, commandes en police mono (éducation du chiot, rappel, marche en laisse…) qui s'orangent au survol, contact et petit formulaire de lettre.",
  tags: ["éducateur canin", "éducation canine", "dressage", "fenêtre", "console", "formulaire", "vert", "orange"],
  identity: canin,
  racine: racineDe(LINC),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const carres = k.row([0, 1, 2].map(() => k.col([], { width: "12px", height: "12px", borderStyle: "solid", borderWidth: "2px", borderColor: FENETRE, backgroundColor: PRAIRIE })), { gap: "6px", flexWrap: "nowrap", alignItems: "center" });
    const titreBarre = k.row([carres, k.T("<p>seance.txt — éducation canine</p>", { fontSize: "14px", fontFamily: S.head, fontWeight: "500", color: FENETRE, letterSpacing: "0.04em" })], { gap: "16px", flexWrap: "nowrap", alignItems: "center", backgroundColor: PRAIRIE, paddingTop: "12px", paddingBottom: "12px", paddingLeft: "16px", paddingRight: "16px", width: "100%" });
    const cmd = (t, u) => lien(k, `> ${t}`, u, { taille: 18, poids: "500", couleur: NOIRV, police: S.head, h: "48px", bloc: true, survol: { backgroundColor: ORREC, color: NOIRV, transform: { x: 8 } }, focus: PRAIRIE, extra: { width: "100%", paddingLeft: "8px" } });
    const curseur = souffle(k.T("<p>_</p>", { fontSize: "20px", fontFamily: S.head, color: PRAIRIE, fontWeight: "700", minHeight: "24px" }), 1800);
    const gauche = G.colonne(k, [caps(k, "Commandes", { couleur: PRAIRIE, police: S.head }), cmd("education-chiot", "/blog"), cmd("rappel", "/blog"), cmd("marche-en-laisse", "/blog"), cmd("comportement", "/blog"), cmd("cours-collectifs", "/blog"), curseur], { poids: 1, min: "260px", gap: "0px" });
    const droite = G.colonne(k, [caps(k, "Prochaine séance ?", { couleur: PRAIRIE, police: S.head }), k.T("<p>Parlez-nous de votre chien : âge, caractère, ce que vous aimeriez améliorer. Nous vous proposons une première séance.</p>", { fontSize: "16px", lineHeight: 1.6, color: S.mute, fontFamily: S.font }), coordonnees(k, { couleur: NOIRV, lien: NOIRV, survol: PRAIRIE, focus: PRAIRIE, taille: 16 }),
      bouton(k, "Réserver une séance", "/contact", { texte: NOIRV, fond: ORREC, survol: { backgroundColor: NOIRV, borderColor: NOIRV, color: ORREC, transform: { y: -3 } }, focus: PRAIRIE })], { poids: 1, min: "280px", gap: "16px" });
    const corps = k.row([gauche, droite], { rowGap: "28px", columnGap: "56px", flexWrap: "wrap", alignItems: "flex-start", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", width: "100%" });
    const abo = ABO_STYLE(abonnement(k, env, { titre: "Conseils d'éducation", intro: "Un message de temps en temps, sans spam.", bouton: "Je m'abonne", largeur: "420px", accent: PRAIRIE, texte: NOIRV }), { titre: PRAIRIE, intro: S.mute, boutonTexte: "#ffffff", survolFond: NOIRV, survolTexte: "#ffffff", focus: NOIRV });
    const formulaire = k.col([abo], { backgroundColor: "#f4f1e7", borderTopStyle: "solid", borderTopWidth: "2px", borderTopColor: NOIRV, paddingTop: "20px", paddingBottom: "20px", paddingLeft: "28px", paddingRight: "28px", width: "100%" });
    const fenetre = k.col([titreBarre, corps, formulaire], { width: "100%", maxWidth: "960px", backgroundColor: FENETRE, borderStyle: "solid", borderWidth: "2px", borderColor: NOIRV, gap: "0px" });
    const reseaux = G.reseauxTexte([["Facebook", "https://www.facebook.com/"], ["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, poids: "700", couleur: NOIRV, survol: PRAIRIE, focus: PRAIRIE })(k, env);
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const page = G.bande(k, [fenetre, k.row([reseaux, mentions], { rowGap: "12px", columnGap: "40px", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: "960px" })], { fond: LINC, colonne: true, aligne: "center", gap: "24px", padV: ["64px", "48px", "36px"], padB: ["28px", "24px", "20px"], padH: PH, innerMobile: { rowGap: "20px" }, nom: "Fenêtre" });
    return [G.racine(k, [page])];
  },
}, FAM);

// ═══ ft2-265 « Rayons du jardin » — animalerie — ARCHÉTYPE L : pied en escalier (bandes de largeurs décroissantes) ═══
// Idée : trois MARCHES alignées à gauche, de plus en plus étroites : la plus large, jaune, porte les cinq rayons (Chiens, Chats, Oiseaux, Rongeurs, Aquariophilie) en grands liens ; la suivante, turquoise clair, les horaires et le contact ;
// la dernière, encre, la lettre. Mentions sous l'escalier. Crème, jaune, turquoise, encre. Polices : Lexend (titres) et Onest (texte). Rayons d'exemple. Mobile : les marches reprennent toute la largeur.
const animalerie = identite({
  key: "c265", label: "Crème, jaune, turquoise et encre", humeur: "light",
  fond: "#fff8ec", texte: "#1d1b16", discret: "#4f4a3f", accent: "#0a6d5e", surface: "#ffffff", encre: "#1d1b16", surEncre: "#fff8ec",
  police: "font.onest", titres: "font.lexend",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#1d1b1640",
});
const CREMEA = "#fff8ec", JAUNE = "#ffd23f", TURQ = "#58d3bd", ENCREA = "#1d1b16", VERTA = "#0a6d5e";
const rayons = modeleV2({
  id: identifiantV2(265, "rayons-du-jardin"), concept: "c-265-rayons-du-jardin",
  name: "Rayons du jardin", family: FAM,
  description: "Pour une animalerie : pied en escalier, trois marches alignées à gauche de plus en plus étroites : rayons en grands liens (jaune), horaires et contact (turquoise), lettre (encre). Crème, jaune, turquoise.",
  tags: ["animalerie", "rayons", "chiens", "chats", "aquariophilie", "escalier", "jaune", "turquoise"],
  identity: animalerie,
  racine: racineDe(CREMEA),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const marche = (largeur, fond, enfants, o = {}) => k.col(enfants, { width: largeur, backgroundColor: fond, gap: o.gap || "16px", paddingTop: o.pv || "36px", paddingBottom: o.pv || "36px", paddingLeft: "48px", paddingRight: "40px", marginRight: "auto" }, { width: "92%", paddingLeft: "32px" }, { width: "100%", paddingLeft: "20px", paddingRight: "20px" });
    const rayon = (t) => lien(k, t, "/blog", { taille: 30, poids: "700", couleur: ENCREA, police: S.head, h: "72px", padH: "0px", survol: { transform: { x: 10 }, textDecoration: "underline" }, focus: ENCREA, extra: { flexGrow: 0 } });
    const m1 = marche("100%", JAUNE, [caps(k, "Nos rayons", { couleur: ENCREA, police: S.head, suivi: "0.2em" }), k.row(["Chiens", "Chats", "Oiseaux", "Rongeurs", "Aquariophilie"].map(rayon), { rowGap: "4px", columnGap: "44px", flexWrap: "wrap", alignItems: "center" })], { pv: "44px" });
    const m2 = marche("72%", TURQ, [G.ligne(k, [bloc(k, "Horaires du magasin", [horaires(k, { couleur: ENCREA })], { couleurTitre: ENCREA, min: "240px", poids: 1, police: S.head }), bloc(k, "Nous trouver", [coordonnees(k, { couleur: ENCREA, lien: ENCREA, survol: "#06483e", focus: ENCREA })], { couleurTitre: ENCREA, min: "240px", poids: 1, police: S.head })], { gap: "28px 48px", aligne: "flex-start", largeur: "100%" })]);
    const abo = ABO_STYLE(abonnement(k, env, { titre: "La lettre de l'animalerie", intro: "Conseils de saison et arrivages.", bouton: "Je m'abonne", largeur: "340px", accent: JAUNE, texte: CREMEA }), { titre: JAUNE, intro: "#e2dccd", boutonTexte: ENCREA, survol: null, survolFond: CREMEA, survolTexte: ENCREA, focus: CREMEA });
    const m3 = marche("46%", ENCREA, [abo]);
    const escalier = G.bande(k, [m1, m2, m3], { fond: CREMEA, padV: ZERO, padB: ZERO, padH: ZERO, max: "100%", colonne: true, gap: "0px", aligne: "stretch", nom: "Escalier" });
    const reseaux = G.reseauxTexte([["Facebook", "https://www.facebook.com/"], ["Instagram", "https://www.instagram.com/"]], { taille: 15, poids: "700", couleur: ENCREA, survol: VERTA, focus: VERTA })(k, env);
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [reseaux, mentions], { fond: CREMEA, gap: "12px 40px", aligne: "center", padV: ["24px", "22px", "18px"], padH: PH, innerMobile: { rowGap: "12px" }, nom: "Mentions" });
    return [G.racine(k, [escalier, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Vétérinaires et animaux", target: 5, built: true,
  description: "Pieds standard et très professionnels, angles droits, animations fluides : clinique vétérinaire, toilettage, pension, éducateur canin, animalerie.",
  models: [gardeUrgences, bainMoussant, sejour, seance, rayons],
};
