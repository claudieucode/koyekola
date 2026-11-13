// Famille v2 « Luxe et hôtellerie de prestige » — 6 modèles (ft2-428 à ft2-433), lot « inspiré de captures », REFAIT avec de vraies illustrations vectorielles : ANGLES DROITS partout.
// Capture 40 (FoodFiesta, fond sombre) : marque monumentale à deux tons + lettre à gauche, trois colonnes à droite, filet, copyright en italique et icônes de réseaux → ft2-428, 429, 430.
// Capture 41 (CodingLab, bleu nuit) : barre marque dessinée + pastilles de réseaux colorées, filet, colonnes à petit soulignement + abonnement, bande sombre de mentions → ft2-431, 432, 433.
// Marques fictives ; AUCUNE coordonnée, chiffre ni certification inventés (adresse, téléphone, horaires = Données de l'entreprise). Dessins : aides-illus-a13.js (SVG inline, aria-hidden).
// MOUVEMENT : transitions 360 ms ; UNE animation douce par modèle (carré qui respire / bouton qui se soulève) ; tout est immobile sous « prefers-reduced-motion ». Ni animation d'entrée ni défilement.
const FAM = "luxe-hotellerie";
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const { racineDe, MARGES, reseauxIcones, trait, colLiens, reseauxEx, lien, caps, souffle, carre, horaires, coordonnees, lettre, para, bouton, filetC, pied40, pied41, art, dessin, duo, glyphe } = require("../aides-illus-a13");

// ═══ ft2-428 « Registre des maisons » — palace  [archétype G : index en lignes pleine largeur]
// Idée : un sommaire de livre d'or. Six grandes lignes pleine largeur (Cormorant 40 px, flèche, filet) : Les suites, Le spa, La table, Les événements, La conciergerie, Réserver. Chaque ligne s'indente en or au survol.
// En tête, le nom et les réseaux ; en pied, adresse en ligne et mentions. Aucune carte. Ivoire, encre, or. Polices : Cormorant Garamond (titres) et Jost (texte). Mobile : lignes plus petites.
const IVO = "#f7f2e8", ENCRE2 = "#1c1a17", OR2 = "#7a5b1f";
const registreId = identite({ key: "c428", label: "Ivoire, encre et or", humeur: "light", fond: IVO, texte: ENCRE2, discret: "#4d4840", accent: OR2, surface: "#fffdf8", encre: ENCRE2, surEncre: IVO, police: "font.jost", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#1c1a174d" });
const registre = modeleV2({
  id: identifiantV2(428, "registre-des-maisons"), concept: "c-428-registre-des-maisons", name: "Registre des maisons", family: FAM,
  description: "Pour un palace ou un hôtel de prestige : un sommaire en six grandes lignes pleine largeur (suites, spa, table, événements, conciergerie, réserver) qui s'indentent en or, nom et réseaux en tête. Ivoire, encre, or.",
  tags: ["palace", "hôtel de luxe", "index", "sommaire", "grandes lignes", "ivoire", "or"],
  identity: registreId, racine: racineDe(IVO),
  widgets: ["bizcontact", "bizlegal", "copyright", "emailsubscribe", "html", "link", "social", "text"],
  compose(k, env, G) {
    const S = k.S;
    const nom = G.geant(`<p>Maison <span style="color:${OR2}">Aurélien</span></p>`, { taille: [44, 112], tablette: { taille: [52, 84] }, mobile: { taille: [40, 52] }, lh: 0.98, suivi: "0", poids: "600", police: S.head, couleur: ENCRE2 })(k, env);
    const blasonN = k.col([dessin(k, 320, 320, art.blason(320, 320), { width: "100%", maxWidth: "280px" })], { flexGrow: 0, flexBasis: "260px", minWidth: "200px" });
    const abo = lettre(k, env, { titre: "", intro: "Recevoir le carnet de la maison.", largeur: "360px", accent: OR2, texte: ENCRE2, couleurIntro: "#4d4840", surBouton: IVO, survolBouton: ENCRE2, surSurvol: IVO });
    const haut = G.bande(k, [k.col([caps(k, "Palace", { couleur: "#7a5a1e", suivi: "0.3em", poids: "800" }), nom, abo], { flexGrow: 1, flexBasis: "50%", minWidth: "280px", gap: "22px" }), blasonN], { fond: IVO, aligne: "center", gap: "32px 64px", padV: ["72px", "56px", "40px"], padB: ["32px", "28px", "24px"], padH: MARGES, nom: "Marque et blason" });
    const idx = (t, u) => lien(k, `${t}   →`, u, { taille: 34, poids: "500", police: S.head, couleur: ENCRE2, bloc: true, h: "68px", survol: { color: OR2, paddingLeft: "22px" }, focus: OR2, extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#1c1a174d", boxSizing: "border-box" } });
    const lignes = k.col([idx("Les suites", "/catalogue"), idx("Le spa", "/blog"), idx("La table", "/blog"), idx("Les événements", "/faq"), idx("Réserver", "/contact")], { width: "100%", gap: "0px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: ENCRE2 });
    const milieu = G.bande(k, [lignes], { fond: IVO, colonne: true, aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["36px", "28px", "24px"], padH: MARGES, nom: "Index" });
    const fin = G.bande(k, [coordonnees(k, { layout: "inline", couleur: "#4d4840", lien: ENCRE2, survol: OR2, focus: OR2, taille: 14 }), reseauxIcones(k, env, ["instagram", "facebook", "linkedin"], { contour: ENCRE2, couleur: ENCRE2, survolFond: OR2, survolCouleur: "#ffffff" }), G.ligneLegale({ taille: 13, couleur: "#4d4840", liens: ENCRE2, sansCookies: true })(k, env)], { fond: "#efe6d2", colonne: true, aligne: "stretch", gap: "14px", padV: ["24px", "22px", "20px"], padB: ["24px", "22px", "20px"], padH: MARGES, nom: "Adresse et mentions" });
    [haut, milieu, fin].forEach((b) => { b.styles.desktop.color = ENCRE2; });
    return [G.racine(k, [haut, milieu, fin])];
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
  widgets: ["bizcontact", "bizlegal", "copyright", "emailsubscribe", "html", "link", "social", "text"],
  compose(k, env, G) {
    const S = k.S;
    const vign = G.bande(k, duo(k, art.vignettes, [1200, 210], [480, 360]), { fond: EME, colonne: true, aligne: "stretch", gap: "0px", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Vignettes" });
    const nom = G.geant(`<p style="text-align:center">Villa <span style="color:${CHAMP}">Émeraude</span></p>`, { taille: [44, 110], tablette: { taille: [52, 84] }, mobile: { taille: [38, 50] }, lh: 1, suivi: "0", poids: "600", police: S.head, couleur: IV3 })(k, env);
    const liens = k.row([["Chambres", "/catalogue"], ["Table", "/blog"], ["Spa", "/blog"], ["Contact", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", casse: "uppercase", suivi: "0.16em", couleur: IV3, padH: "10px", survol: { color: CHAMP, transform: { y: -3 } }, focus: CHAMP })), { rowGap: "0px", columnGap: "16px", justifyContent: "center" });
    const abo = lettre(k, env, { titre: "", intro: "La lettre de la villa.", largeur: "420px", accent: CHAMP, texte: IV3, couleurIntro: "#c5d6cd", surBouton: EME, survolBouton: IV3, surSurvol: EME });
    const centre = G.bande(k, [caps(k, "Hôtel Villa", { couleur: CHAMP, suivi: "0.3em", poids: "800" }), nom, liens, abo, coordonnees(k, { align: "center", layout: "inline", couleur: "#c5d6cd", lien: IV3, survol: CHAMP, focus: CHAMP, taille: 14 }), reseauxIcones(k, env, ["instagram", "facebook", "youtube"], { fond: CHAMP, couleur: EME, survolFond: IV3, survolCouleur: EME }), trait(k, "#f4efe24d"), G.ligneLegale({ taille: 13, couleur: "#c5d6cd", liens: IV3, sansCookies: true })(k, env, true)], { fond: EME, colonne: true, aligne: "center", gap: "26px", padV: ["64px", "48px", "36px"], padB: ["32px", "28px", "24px"], padH: MARGES, nom: "Maison centrée" });
    centre.styles.desktop.color = IV3; centre.styles.desktop.textAlign = "center";
    return [G.racine(k, [vign, centre])];
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
  widgets: ["bizcontact", "bizlegal", "copyright", "emailsubscribe", "html", "link", "social", "text"],
  compose(k, env, G) {
    const S = k.S;
    const waves = G.bande(k, duo(k, art.vaguesOr, [1200, 190], [480, 170]), { fond: BORD, colonne: true, aligne: "stretch", gap: "0px", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Vagues" });
    const nom = G.geant(`<p style="text-align:center">LE <span style="color:${OR3}">VERMEIL</span></p>`, { taille: [48, 128], tablette: { taille: [56, 92] }, mobile: { taille: [44, 58] }, lh: 1, suivi: "0.04em", poids: "400", police: S.head, couleur: CREME })(k, env);
    const liens = k.row([["L'arrivée", "/faq"], ["Les suites", "/catalogue"], ["La table", "/blog"], ["Le bien-être", "/blog"], ["Le départ", "/faq"]].map(([t, u], i) => lien(k, t, u, { taille: 17, poids: "500", police: S.head, couleur: CREME, padH: "8px", survol: { color: OR3, transform: { y: -3 } }, focus: OR3 })), { rowGap: "0px", columnGap: "24px", justifyContent: "center" });
    const haut = G.bande(k, [souffle(carre(k, OR3, "14px"), 3200), nom, liens], { fond: BORD, colonne: true, aligne: "center", gap: "22px", padV: ["40px", "32px", "28px"], padB: ["32px", "28px", "24px"], padH: MARGES, nom: "Nom et liens" });
    const abo = lettre(k, env, { titre: "La lettre du Vermeil", intro: "Une nouvelle de temps en temps.", largeur: "400px", accent: OR3, texte: CREME, couleurTitre: OR3, couleurIntro: "#e1cbc0", surBouton: BORD, survolBouton: CREME, surSurvol: BORD });
    const pied = G.bande(k, [k.col([caps(k, "Hôtel de charme", { couleur: OR3, suivi: "0.24em", poids: "800" }), coordonnees(k, { couleur: "#e1cbc0", lien: CREME, survol: OR3, focus: OR3, taille: 15 })], { flexGrow: 1, flexBasis: "260px", minWidth: "240px", gap: "12px" }), abo, reseauxIcones(k, env, ["instagram", "facebook"], { fond: OR3, couleur: BORD, survolFond: CREME, survolCouleur: BORD })], { fond: "#2a0a14", aligne: "center", gap: "28px 56px", padV: ["36px", "30px", "26px"], padB: ["24px", "22px", "20px"], padH: MARGES, nom: "Adresse et lettre" });
    const fin = G.bande(k, [G.ligneLegale({ taille: 13, couleur: "#e1cbc0", liens: CREME, sansCookies: true })(k, env)], { fond: "#2a0a14", colonne: true, aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["24px", "22px", "20px"], padH: MARGES, nom: "Mentions" });
    [waves, haut, pied, fin].forEach((b) => { b.styles.desktop.color = CREME; });
    return [G.racine(k, [waves, haut, pied, fin])];
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
  widgets: ["bizcontact", "bizhours", "bizlegal", "copyright", "emailsubscribe", "html", "link", "social", "text"],
  compose(k, env, G) {
    const S = k.S;
    const guil = G.bande(k, duo(k, art.guilloche, [1200, 56], [480, 56]), { fond: MIN, colonne: true, aligne: "stretch", gap: "0px", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Guilloché" });
    const emb = k.col([dessin(k, 260, 260, art.emblemeGrave(260, 260), { width: "100%", maxWidth: "220px" })], { alignItems: "center", width: "100%" });
    const nom = G.geant(`<p style="text-align:center">HÔTEL VALMONT</p>`, { taille: [34, 84], tablette: { taille: [44, 64] }, mobile: { taille: [30, 40] }, lh: 1, suivi: "0.14em", poids: "400", police: S.head, couleur: MIN })(k, env);
    const cell = (titre, enfant) => k.col([caps(k, titre, { couleur: CUIV, suivi: "0.22em", poids: "800", extra: { textAlign: "center" } }), enfant], { flexGrow: 1, flexBasis: "240px", minWidth: "220px", gap: "8px", alignItems: "center", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "22px", paddingRight: "22px", boxSizing: "border-box", borderStyle: "solid", borderWidth: "1px", borderColor: MIN, borderRadius: "0px" });
    const cellules = k.row([cell("Adresse", coordonnees(k, { align: "center", couleur: MIN, lien: MIN, survol: CUIV, focus: CUIV, taille: 16 })), cell("Horaires", horaires(k, { couleur: MIN, taille: 16 })), cell("Courrier", lettre(k, env, { titre: "", intro: "Une lettre de temps en temps.", largeur: "100%", accent: CUIV, texte: MIN, couleurIntro: "#454e63", surBouton: "#ffffff", survolBouton: MIN, surSurvol: "#ffffff" }))], { width: "100%", maxWidth: "1000px", gap: "6px", padding: "6px", boxSizing: "border-box", borderStyle: "solid", borderWidth: "3px", borderColor: MIN, borderRadius: "0px" });
    const liens = k.row([["Chambres", "/catalogue"], ["Restaurant", "/blog"], ["Salons", "/faq"], ["Histoire", "/"], ["Réserver", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "500", couleur: MIN, casse: "uppercase", suivi: "0.16em", padH: "12px", survol: { color: CUIV, transform: { y: -2 } }, focus: CUIV })), { rowGap: "0px", columnGap: "12px", justifyContent: "center" });
    const corps = G.bande(k, [emb, nom, liens, cellules, reseauxIcones(k, env, ["facebook", "instagram", "linkedin"], { fond: MIN, couleur: PAPB, survolFond: CUIV, survolCouleur: "#ffffff" })], { fond: PAPB, colonne: true, aligne: "center", gap: "24px", padV: ["40px", "32px", "28px"], padB: ["40px", "32px", "28px"], padH: MARGES, nom: "Papier à en-tête" });
    const fin = G.bande(k, [G.ligneLegale({ taille: 13, couleur: "#454e63", liens: MIN, sansCookies: true })(k, env)], { fond: "#eee7d6", colonne: true, aligne: "stretch", padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: MARGES, nom: "Mentions" });
    [guil, corps, fin].forEach((b) => { b.styles.desktop.color = MIN; b.styles.desktop.textAlign = "center"; });
    return [G.racine(k, [guil, corps, fin])];
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
  widgets: ["bizcontact", "bizlegal", "copyright", "html", "link", "social", "text"],
  compose(k, env, G) {
    const S = k.S;
    const marque = [glyphe(k, "cloche", ROSEOR, ANT, 48), k.T(`<p>Hôtel Solstice</p>`, { fontSize: "30px", lineHeight: 1.1, letterSpacing: "0.08em", fontFamily: S.head, color: PLAT })];
    const cloche = k.col([dessin(k, 300, 260, art.clocheCles(300, 260), { width: "100%", maxWidth: "300px" })], { flexGrow: 0, flexBasis: "280px", minWidth: "220px" });
    const b = souffle(bouton(k, "Écrire au concierge", "/contact", { texte: ANT, fond: ROSEOR, survol: { backgroundColor: PLAT, borderColor: PLAT, color: ANT, transform: { y: -3 } }, focus: PLAT, taille: 15 }), 4200);
    const abo = k.col([caps(k, "Conciergerie", { couleur: ROSEOR, suivi: "0.16em", taille: "13px" }), filetC(k, ROSEOR), para(k, "Une table, un transfert, une attention : écrivez-nous.", { taille: 15, couleur: "#d4d2cc" }), b, coordonnees(k, { couleur: PLAT, lien: PLAT, survol: ROSEOR, focus: ROSEOR, taille: 15 })], { flexGrow: 1, flexBasis: "260px", minWidth: "220px", gap: "14px" });
    return pied41(k, env, G, { fond: ANT, fondBas: "#111114", fg: PLAT, mute: "#b9b7b1", titre: ROSEOR, accent: ROSEOR, ligne: "#e7e5e066", marque, reseaux: { liste: ["instagram", "facebook", "youtube"], fond: ROSEOR, couleur: ANT, survolFond: PLAT, survolCouleur: ANT }, sansFilet: true,
      colonnes: [["Séjour", [["Les suites", "/catalogue"], ["Le spa", "/blog"], ["La table", "/blog"]]], ["Services", [["Événements", "/faq"], ["Conciergerie", "/faq"]]]], fin: [abo, cloche] });
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
  widgets: ["bizcontact", "bizhours", "bizlegal", "copyright", "emailsubscribe", "html", "link", "social", "text"],
  compose(k, env, G) {
    const S = k.S;
    const arcades = G.bande(k, duo(k, art.arcades, [1200, 260], [480, 280]), { fond: "#26092f", colonne: true, aligne: "stretch", gap: "0px", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Arcades" });
    const marque = k.row([glyphe(k, "arche", PR1, OR4, 48), k.T(`<p>Grand Hôtel Sélène</p>`, { fontSize: "32px", lineHeight: 1.1, fontFamily: S.head, color: PR1 })], { alignItems: "center", columnGap: "16px", flexWrap: "nowrap" });
    const haut = G.bande(k, [marque, k.row([["Chambres", "/catalogue"], ["Restaurant", "/blog"], ["Spa", "/blog"], ["Réserver", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 17, poids: "500", police: S.head, couleur: PR1, padH: "6px", survol: { color: "#8a5a10", transform: { y: -3 } }, focus: "#8a5a10" })), { rowGap: "0px", columnGap: "20px" })], { fond: IV4, aligne: "center", gap: "12px 40px", padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: MARGES, nom: "Marque et liens" });
    const carte = (fond, fg, enfants) => k.col(enfants, { flexGrow: 1, flexBasis: "220px", minWidth: "200px", gap: "10px", backgroundColor: fond, color: fg, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", boxSizing: "border-box", borderRadius: "0px" });
    const abo = lettre(k, env, { titre: "", intro: "Une nouvelle de temps en temps.", largeur: "100%", accent: IV4, texte: IV4, couleurIntro: "#ffffff", surBouton: PR1, survolBouton: OR4, surSurvol: PR1 });
    const cartes = G.bande(k, [carte(PR2, IV4, [caps(k, "Adresse", { couleur: OR4, suivi: "0.2em", poids: "800" }), coordonnees(k, { couleur: IV4, lien: IV4, survol: OR4, focus: OR4, taille: 15 })]), carte(PR3, "#ffffff", [caps(k, "Horaires", { couleur: OR4, suivi: "0.2em", poids: "800" }), horaires(k, { couleur: "#ffffff", taille: 15 })]), carte(PR4, "#ffffff", [caps(k, "Lettre", { couleur: "#ffffff", suivi: "0.2em", poids: "800" }), abo, reseauxIcones(k, env, ["facebook", "instagram", "linkedin"], { fond: IV4, couleur: PR1, survolFond: OR4, survolCouleur: PR1 })])], { fond: IV4, aligne: "stretch", gap: "6px", max: "100%", padV: ["6px", "6px", "6px"], padB: ["6px", "6px", "6px"], padH: ["6px", "6px", "6px"], nom: "Cartes" });
    const fin = G.bande(k, [G.ligneLegale({ taille: 13, couleur: "#52445a", liens: PR1, sansCookies: true })(k, env)], { fond: "#efe6d2", colonne: true, aligne: "stretch", padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: MARGES, nom: "Mentions" });
    [arcades, haut, cartes, fin].forEach((b) => { b.styles.desktop.color = "#2b1030"; });
    return [G.racine(k, [arcades, haut, cartes, fin])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Luxe et hôtellerie de prestige", target: 6, built: true,
  description: "Pieds inspirés de captures, angles droits, animations fluides : palace, maison d'exception, hôtel de charme, maison historique, conciergerie, grand hôtel.",
  models: [registre, mosaique, chrono, papier, consoleC, marches],
};
