// Famille v2 « Aéronautique et spatial » — 6 modèles (ft2-422 à ft2-427), lot « inspiré de captures », REFAIT avec de vraies illustrations vectorielles : ANGLES DROITS partout.
// Capture 40 (FoodFiesta, fond sombre) : marque monumentale à deux tons + lettre à gauche, trois colonnes à droite, filet, copyright en italique et icônes de réseaux → ft2-422, 423, 424.
// Capture 41 (CodingLab, bleu nuit) : barre marque dessinée + pastilles de réseaux colorées, filet, colonnes à petit soulignement + abonnement, bande sombre de mentions → ft2-425, 426, 427.
// Marques fictives ; AUCUNE coordonnée, chiffre ni certification inventés (adresse, téléphone, horaires = Données de l'entreprise). Dessins : aides-illus-a13.js (SVG inline, aria-hidden).
// MOUVEMENT : transitions 360 ms ; UNE animation douce par modèle (carré qui respire / bouton qui se soulève) ; tout est immobile sous « prefers-reduced-motion ». Ni animation d'entrée ni défilement.
const FAM = "aeronautique-spatial";
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const { racineDe, MARGES, reseauxIcones, trait, colLiens, reseauxEx, lien, caps, souffle, carre, horaires, coordonnees, lettre, para, bouton, filetC, pied40, pied41, art, dessin, duo, glyphe } = require("../aides-illus-a13");

// ═══ ft2-422 « Tour de contrôle » — aéronautique  [archétype A : colonne latérale pleine hauteur]
// Idée : une colonne AMBRE pleine hauteur à gauche (nom en Exo 2, signal qui « respire », lettre technique) et, à droite sur marine profond, quatre colonnes de liens à petit filet d'accent puis réseaux et mentions.
// Marine, ambre, blanc glacé. Polices : Exo 2 (titres) et IBM Plex Sans (texte). Mobile : la colonne passe au-dessus.
const NAV = "#0e1a3d", AMB = "#f5b301", GLACE = "#eef2fb", NAV2 = "#14224d";
const tourId = identite({ key: "c422", label: "Marine profond et ambre", humeur: "dark", fond: NAV, texte: GLACE, discret: "#b5c0dd", accent: AMB, surface: NAV2, encre: NAV, surEncre: GLACE, police: "font.ibm-plex-sans", titres: "font.exo-2", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#eef2fb4d" });
const tour = modeleV2({
  id: identifiantV2(422, "tour-de-controle"), concept: "c-422-tour-de-controle", name: "Tour de contrôle", family: FAM,
  description: "Pour un constructeur ou un bureau d'études aéronautique : grande colonne ambre pleine hauteur avec nom et lettre technique, quatre colonnes de liens à petit filet sur marine profond, réseaux et mentions.",
  tags: ["aéronautique", "bureau d'études", "colonne latérale", "lettre", "marine", "ambre", "ingénierie"],
  identity: tourId, racine: racineDe(NAV),
  widgets: ["bizlegal", "copyright", "emailsubscribe", "html", "link", "social", "text"],
  compose(k, env, G) {
    const S = k.S;
    const nom = G.geant(`<p>AÉRO<span style="color:${AMB}">DYNE</span></p>`, { taille: [38, 84], tablette: { taille: [44, 72] }, mobile: { taille: [36, 48] }, lh: 0.95, suivi: "0.01em", poids: "800", police: S.head, couleur: GLACE })(k, env);
    const sig = k.row([souffle(carre(k, AMB, "12px"), 3200), caps(k, "Bureau d'études aéronautique", { couleur: AMB, suivi: "0.2em", poids: "800" })], { gap: "10px", alignItems: "center", flexWrap: "nowrap" });
    const cols = [["Programmes", [["Aéronefs", "/catalogue"], ["Systèmes embarqués", "/catalogue"], ["Maintenance", "/faq"], ["Essais en vol", "/blog"]]], ["Entreprise", [["Qui nous sommes", "/"], ["Engagements", "/faq"], ["Presse", "/blog"], ["Contact", "/contact"]]], ["Carrières", [["Métiers", "/blog"], ["Stages", "/faq"], ["Candidature", "/contact"]]]];
    return pied40(k, env, G, { fond: NAV, fg: GLACE, mute: "#b5c0dd", accent: AMB, avant: [sig], nom: [nom], lettre: { titre: "", intro: "Abonnez-vous à la lettre technique.", largeur: "360px", accent: AMB, texte: GLACE, couleurIntro: GLACE, surBouton: NAV, survolBouton: GLACE, surSurvol: NAV }, colonnes: cols,
      artMilieu: duo(k, art.horizonRadar, [1200, 210], [480, 190]), fondArtMilieu: "#0b1430", artPlein: true, fondBas: "#0b1430", ligne: "#f5b30166", reseaux: { fond: AMB, couleur: NAV, survolFond: GLACE, survolCouleur: NAV } });
  },
}, FAM);

// ═══ ft2-423 « Orbite silencieuse » — spatial  [archétype B : nom monumental seul au centre]
// Idée : presque rien. Un nom géant en deux tons (capture 40) centré sur noir profond, un carré orange qui « respire » au-dessus, trois liens, une ligne de mentions. Grand vide.
// Noir, ivoire, orange fusée. Polices : Syncopate (nom) et Space Grotesk (texte). Mobile : le nom rétrécit, les liens s'empilent.
const NOIR = "#07070a", IVOIRE = "#f1efe8", FUSEE = "#ff5a1f";
const orbiteId = identite({ key: "c423", label: "Noir profond, ivoire et orange fusée", humeur: "dark", fond: NOIR, texte: IVOIRE, discret: "#b9b7ae", accent: FUSEE, surface: "#101015", encre: NOIR, surEncre: IVOIRE, police: "font.space-grotesk", titres: "font.syncopate", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f1efe84d" });
const orbite = modeleV2({
  id: identifiantV2(423, "orbite-silencieuse"), concept: "c-423-orbite-silencieuse", name: "Orbite silencieuse", family: FAM,
  description: "Pour une entreprise spatiale ou un lanceur : un nom monumental en deux tons au centre d'un grand vide noir, un carré orange qui respire, trois liens et une ligne de mentions. Noir, ivoire, orange fusée.",
  tags: ["spatial", "lanceur", "nom monumental", "minimal", "noir", "orange", "centré"],
  identity: orbiteId, racine: racineDe(NOIR),
  widgets: ["bizlegal", "copyright", "emailsubscribe", "html", "link", "social", "text"],
  compose(k, env, G) {
    const S = k.S;
    const nom = G.geant(`<p style="text-align:left">ORBI<span style="color:${FUSEE}">TE</span></p>`, { taille: [30, 84], tablette: { taille: [36, 68] }, mobile: { taille: [26, 36] }, lh: 1, suivi: "0.02em", poids: "700", police: S.head, couleur: IVOIRE })(k, env);
    const liensCol = k.row(["Lanceurs", "Missions", "Contact"].map((t, i) => lien(k, t, ["/catalogue", "/blog", "/contact"][i], { taille: 15, poids: "600", casse: "uppercase", suivi: "0.2em", couleur: IVOIRE, padH: "0px", survol: { color: FUSEE, transform: { x: 4 } }, focus: FUSEE })), { rowGap: "0px", columnGap: "28px" });
    const planete = { ...dessin(k, 480, 440, art.planete(480, 440), { maxWidth: "480px", marginLeft: "auto" }) };
    return pied40(k, env, G, { fond: NOIR, fg: IVOIRE, mute: "#b9b7ae", accent: FUSEE, avant: [caps(k, "Accès à l'espace, sans bruit", { couleur: "#b9b7ae", suivi: "0.3em" })], nom: [nom, liensCol], lettre: { titre: "", intro: "La lettre des missions.", largeur: "340px", accent: FUSEE, texte: IVOIRE, couleurIntro: IVOIRE, surBouton: NOIR, survolBouton: IVOIRE, surSurvol: NOIR },
      baseG: "50%", baseD: "40%", colonnes: [], extraDroite: [souffle(carre(k, FUSEE, "14px"), 3600), planete], reseaux: { contour: "#f1efe8", couleur: IVOIRE, survolFond: FUSEE, survolCouleur: NOIR }, padV: ["96px", "64px", "40px"] });
  },
}, FAM);

// ═══ ft2-424 « Tableau des départs » — aviation commerciale  [archétype C : damier de huit cases]
// Idée : un tableau d'affichage de gare aérienne : titre en capitales condensées puis huit cases égales à angles droits séparées par un joint noir ; quatre cases-liens colorées (acier, blanc, rouge, acier foncé)
// qui se soulèvent, et quatre cases d'information (adresse, horaires, lettre, mentions). Papier, acier, rouge signal. Polices : Barlow Condensed (titres) et Barlow (texte). Mobile : une case par ligne.
const PAP = "#eef1f4", ACIER = "#1d3b5c", ROUGE = "#c8321c", ENCRE = "#0f1722";
const departsId = identite({ key: "c424", label: "Papier, acier et rouge signal", humeur: "light", fond: PAP, texte: ENCRE, discret: "#3f4a58", accent: ROUGE, surface: "#ffffff", encre: ENCRE, surEncre: PAP, police: "font.barlow", titres: "font.barlow-condensed", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#0f17224d" });
const departs = modeleV2({
  id: identifiantV2(424, "tableau-des-departs"), concept: "c-424-tableau-des-departs", name: "Tableau des départs", family: FAM,
  description: "Pour une compagnie ou un aéroport : damier de huit cases carrées (flotte, maintenance, formation, carrières, adresse, horaires, lettre, mentions) comme un tableau d'affichage. Papier, acier, rouge signal.",
  tags: ["aviation", "compagnie aérienne", "aéroport", "damier", "cases", "acier", "rouge"],
  identity: departsId, racine: racineDe(PAP),
  widgets: ["bizcontact", "bizhours", "bizlegal", "copyright", "emailsubscribe", "html", "link", "text"],
  compose(k, env, G) {
    const S = k.S;
    const L = (items, o = {}) => items.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "500", couleur: ENCRE, bloc: true, h: "40px", survol: { color: ROUGE, paddingLeft: "6px" }, focus: ROUGE, ...o }));
    const nom = G.geant(`<p>DÉPARTS<span style="color:${ROUGE}">.</span></p>`, { taille: [60, 150], tablette: { taille: [64, 110] }, mobile: { taille: [48, 64] }, lh: 0.95, suivi: "0.01em", poids: "800", police: S.head, couleur: ACIER, extra: { textTransform: "uppercase" } })(k, env);
    const abo = lettre(k, env, { titre: "", intro: "La lettre des départs.", largeur: "100%", accent: ACIER, texte: ENCRE, couleurIntro: "#3f4a58", surBouton: "#ffffff", survolBouton: ROUGE, surSurvol: "#ffffff" });
    const haut = G.bande(k, [k.col([caps(k, "Compagnie aérienne", { couleur: "#a52713", poids: "800", suivi: "0.2em" }), nom], { flexGrow: 1, flexBasis: "55%", minWidth: "280px", gap: "10px" }), k.col([abo], { flexGrow: 0, flexBasis: "360px", minWidth: "260px" })], { fond: PAP, aligne: "flex-end", gap: "32px 48px", padV: ["64px", "48px", "36px"], padB: ["32px", "28px", "24px"], padH: MARGES, nom: "Titre et lettre" });
    const piste = G.bande(k, duo(k, art.pisteAvion, [1200, 130], [480, 120]), { fond: ACIER, colonne: true, aligne: "stretch", gap: "0px", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Piste" });
    const carte = (titre, enfants) => k.col([caps(k, titre, { couleur: "#a52713", poids: "800", suivi: "0.16em", taille: "13px" }), ...enfants], { flexGrow: 1, flexBasis: "200px", minWidth: "180px", gap: "6px", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "20px", paddingRight: "20px", boxSizing: "border-box", borderStyle: "solid", borderWidth: "2px", borderColor: ACIER, borderRadius: "0px" });
    const cartes = G.bande(k, [carte("Compagnie", L([["Flotte", "/catalogue"], ["Maintenance", "/faq"], ["Formation", "/blog"]])), carte("Services", L([["Carrières", "/contact"], ["Presse", "/blog"], ["Aide", "/faq"]])), carte("Adresse", [coordonnees(k, { couleur: ENCRE, lien: ENCRE, survol: ROUGE, focus: ROUGE, taille: 15 })]), carte("Horaires", [horaires(k, { couleur: ENCRE, taille: 15 })])], { fond: PAP, aligne: "stretch", gap: "12px", padV: ["40px", "32px", "28px"], padB: ["28px", "24px", "20px"], padH: MARGES, nom: "Cartes" });
    const fin = G.bande(k, [G.reseauxTexte(reseauxEx, { taille: 14, couleur: ENCRE, survol: ROUGE, focus: ROUGE })(k, env), G.ligneLegale({ taille: 13, couleur: "#3f4a58", liens: ENCRE, sansCookies: true })(k, env)], { fond: PAP, colonne: true, aligne: "stretch", gap: "12px", padV: ["0px", "0px", "0px"], padB: ["32px", "28px", "24px"], padH: MARGES, nom: "Réseaux et mentions" });
    [haut, cartes, fin].forEach((b) => { b.styles.desktop.color = ENCRE; });
    return [G.racine(k, [haut, cartes, piste, fin])];
  },
}, FAM);

// ═══ ft2-425 « Plan de vol compact » — compagnie  [archétype D : barre unique inversée]
// Idée : tout tient sur DEUX lignes de bleu cobalt : la ligne de cap (carré jaune qui respire, nom, cinq liens, réseaux) et la ligne de service (adresse en ligne et mentions). Aucune colonne, aucune lettre.
// Cobalt, jaune, blanc. Polices : Space Grotesk (titres et texte) et IBM Plex Mono (petites mentions). Mobile : nom, liens en colonne, réseaux, mentions.
const COB = "#1b3fd8", COB2 = "#1432ad", JAUNE = "#ffe14d";
const planId = identite({ key: "c425", label: "Cobalt, jaune et blanc", humeur: "dark", fond: COB, texte: "#ffffff", discret: "#dbe2ff", accent: JAUNE, surface: COB2, encre: COB, surEncre: "#ffffff", police: "font.ibm-plex-mono", titres: "font.space-grotesk", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#ffffff66" });
const plan = modeleV2({
  id: identifiantV2(425, "plan-de-vol-compact"), concept: "c-425-plan-de-vol-compact", name: "Plan de vol compact", family: FAM,
  description: "Pour un aéroclub ou une compagnie régionale : pied sur deux lignes seulement, nom, cinq liens et réseaux sur la ligne de cap, adresse et mentions sur la ligne de service. Cobalt, jaune, blanc.",
  tags: ["aéroclub", "compagnie régionale", "compact", "barre", "cobalt", "jaune", "une ligne"],
  identity: planId, racine: racineDe(COB2),
  widgets: ["bizlegal", "copyright", "emailsubscribe", "html", "link", "social", "text"],
  compose(k, env, G) {
    const S = k.S;
    const marque = [glyphe(k, "rose", JAUNE, "#ffffff", 46), lien(k, "AEROLINE", "/", { taille: 30, poids: "700", police: S.head, suivi: "0.04em", couleur: "#ffffff", survol: { color: JAUNE }, focus: JAUNE })];
    const abo = k.col([caps(k, "Lettre de bord", { couleur: JAUNE, suivi: "0.16em", taille: "13px" }), filetC(k, JAUNE), lettre(k, env, { titre: "", intro: "Nouvelles des lignes.", largeur: "100%", accent: JAUNE, texte: "#ffffff", couleurIntro: "#dbe2ff", surBouton: COB, survolBouton: "#ffffff", surSurvol: COB })], { flexGrow: 1, flexBasis: "240px", minWidth: "220px", gap: "10px" });
    return pied41(k, env, G, { fond: COB, fondBas: "#0b1f6b", fg: "#ffffff", mute: "#dbe2ff", titre: "#ffffff", accent: JAUNE, marque, reseaux: { liste: ["facebook", "instagram", "linkedin"], fond: JAUNE, couleur: COB, survolFond: "#ffffff", survolCouleur: COB },
      colonnes: [["Flotte", [["Appareils", "/catalogue"], ["Escales", "/faq"], ["Services", "/faq"]]], ["Passagers", [["Réserver", "/contact"], ["Bagages", "/faq"], ["Aide", "/faq"]]], ["Société", [["Carrières", "/blog"], ["Presse", "/blog"], ["Contact", "/contact"]]]], fin: [abo],
      artBas: duo(k, art.nuagesRoute, [1200, 190], [480, 170]), artPlein: true, fondArt: "#0b1f6b" });
  },
}, FAM);

// ═══ ft2-426 « Ciel et nuit » — constructeur  [archétype E : deux demi-pages bord à bord]
// Idée : à gauche, la demi-page CIEL (bleu pâle) : grande phrase en Instrument Serif et coordonnées ; à droite, la demi-page NUIT (bleu-nuit) : cinq grandes lignes-liens à filet, lettre (capture 40) et réseaux.
// Une fine bande nuit en bas porte les mentions. Ciel, nuit, vermillon. Polices : Instrument Serif (titres) et Hanken Grotesk (texte). Mobile : les deux moitiés s'empilent.
const CIEL = "#dce8f2", NUIT = "#0a1128", VERM = "#ff6a3d", ENC2 = "#0a1128";
const cielId = identite({ key: "c426", label: "Ciel pâle, nuit et vermillon", humeur: "dark", fond: NUIT, texte: "#eaf1fa", discret: "#b6c3d8", accent: VERM, surface: "#121c3d", encre: NUIT, surEncre: CIEL, police: "font.hanken-grotesk", titres: "font.instrument-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#eaf1fa4d" });
const cielNuit = modeleV2({
  id: identifiantV2(426, "ciel-et-nuit"), concept: "c-426-ciel-et-nuit", name: "Ciel et nuit", family: FAM,
  description: "Pour un constructeur aéronautique : deux demi-pages bord à bord, ciel pâle avec grande phrase et coordonnées, nuit avec cinq grandes lignes de liens, lettre et réseaux. Ciel, nuit, vermillon.",
  tags: ["constructeur", "deux moitiés", "grande phrase", "lettre", "bleu nuit", "vermillon", "serif"],
  identity: cielId, racine: racineDe(NUIT),
  widgets: ["bizcontact", "bizlegal", "copyright", "emailsubscribe", "html", "link", "social", "text"],
  compose(k, env, G) {
    const S = k.S;
    const crete = G.bande(k, duo(k, art.crete, [1200, 240], [480, 210]), { fond: NUIT, colonne: true, aligne: "stretch", gap: "0px", max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], nom: "Crête" });
    const marqueCol = k.col([k.row([glyphe(k, "croissant", "#eaf1fa", NUIT, 46), k.T(`<p>Ciel &amp; nuit</p>`, { fontSize: "34px", lineHeight: 1.1, fontFamily: S.head, color: "#eaf1fa" })], { alignItems: "center", columnGap: "14px", flexWrap: "nowrap" }), para(k, "Constructeur aéronautique.", { taille: 16, couleur: "#b6c3d8" }), reseauxIcones(k, env, ["linkedin", "youtube", "instagram"], { fond: "#eaf1fa", couleur: NUIT, survolFond: VERM, survolCouleur: NUIT })], { flexGrow: 0, flexBasis: "300px", minWidth: "240px", gap: "18px" });
    const gros = (t, u) => lien(k, t, u, { taille: 38, poids: "400", police: S.head, couleur: "#eaf1fa", h: "60px", padH: "0px", survol: { color: VERM, paddingLeft: "10px" }, focus: VERM, extra: { flexBasis: "46%", flexGrow: 1 } });
    const index = k.row([gros("Appareils", "/catalogue"), gros("Services", "/faq"), gros("Recherche", "/blog"), gros("Carrières", "/blog"), gros("Contact", "/contact"), gros("Presse", "/blog")], { flexGrow: 1, flexBasis: "380px", minWidth: "260px", rowGap: "4px", columnGap: "24px" });
    const corps = G.bande(k, [marqueCol, index], { fond: NUIT, aligne: "flex-start", gap: "40px 72px", padV: ["48px", "40px", "32px"], padB: ["40px", "32px", "28px"], padH: MARGES, nom: "Marque et index" });
    const lettreB = G.bande(k, [lettre(k, env, { titre: "Lettre du constructeur", intro: "Une nouvelle de temps en temps.", largeur: "420px", accent: VERM, texte: "#eaf1fa", couleurTitre: VERM, couleurIntro: "#b6c3d8", surBouton: NUIT, survolBouton: "#eaf1fa", surSurvol: NUIT }), coordonnees(k, { couleur: "#eaf1fa", lien: "#eaf1fa", survol: VERM, focus: VERM, taille: 15 })], { fond: "#0d1636", aligne: "flex-start", gap: "28px 72px", padV: ["36px", "30px", "26px"], padB: ["36px", "30px", "26px"], padH: MARGES, nom: "Lettre et adresse" });
    const fin = G.bande(k, [G.ligneLegale({ taille: 13, couleur: "#b6c3d8", liens: "#eaf1fa", sansCookies: true })(k, env)], { fond: "#060b1c", colonne: true, aligne: "stretch", padV: ["20px", "18px", "16px"], padB: ["20px", "18px", "16px"], padH: MARGES, nom: "Mentions" });
    [crete, corps, lettreB, fin].forEach((b) => { b.styles.desktop.color = "#eaf1fa"; });
    return [G.racine(k, [crete, corps, lettreB, fin])];
  },
}, FAM);

// ═══ ft2-427 « Compte à rebours » — lancement  [archétype F : bandeau d'appel XXL + colonne étroite à droite]
// Idée : un bandeau d'appel GÉANT violet (« Décollons ensemble. » en Big Shoulders, jusqu'à 170 px, bouton lime qui respire), puis dessous une bande plus sombre : à gauche l'adresse et les horaires,
// à droite UNE colonne étroite de liens à flèche, bordée d'une barre lime. Pas de lettre. Violet, lime, lavande. Polices : Big Shoulders (titres) et DM Sans (texte). Mobile : bandeau, coordonnées, liens.
const VIO = "#2a1166", VIO2 = "#1d0b4a", LIME = "#c8ff3d", LAV = "#f3eeff";
const rebourId = identite({ key: "c427", label: "Violet, lime et lavande", humeur: "dark", fond: VIO, texte: LAV, discret: "#d3c7f5", accent: LIME, surface: VIO2, encre: VIO, surEncre: LAV, police: "font.dm-sans", titres: "font.big-shoulders", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#f3eeff4d" });
const rebours = modeleV2({
  id: identifiantV2(427, "compte-a-rebours"), concept: "c-427-compte-a-rebours", name: "Compte à rebours", family: FAM,
  description: "Pour une start-up spatiale ou un service de lancement : bandeau d'appel géant avec bouton lime, puis bande sombre avec adresse, horaires et une colonne étroite de liens à flèche. Violet, lime, lavande.",
  tags: ["lancement", "start-up spatiale", "appel à l'action", "bandeau géant", "violet", "lime", "colonne étroite"],
  identity: rebourId, racine: racineDe(VIO2),
  widgets: ["bizcontact", "bizlegal", "copyright", "html", "link", "social", "text"],
  compose(k, env, G) {
    const S = k.S;
    const marque = k.row([glyphe(k, "fusee", LIME, LAV, 46), k.T(`<p>ASTRÉA</p>`, { fontSize: "36px", fontWeight: "800", lineHeight: 1, letterSpacing: "0.04em", fontFamily: S.head, color: LAV })], { alignItems: "center", columnGap: "14px", flexWrap: "nowrap" });
    const haut = G.bande(k, [marque, reseauxIcones(k, env, ["facebook", "instagram", "linkedin"], { fond: LIME, couleur: VIO2, survolFond: LAV, survolCouleur: VIO2 })], { fond: VIO, aligne: "center", gap: "16px 32px", padV: ["32px", "28px", "24px"], padB: ["32px", "28px", "24px"], padH: MARGES, nom: "Marque et réseaux" });
    const rocket = k.col([dessin(k, 360, 400, art.fusee(360, 400), { width: "100%", maxWidth: "340px" })], { flexGrow: 0, flexBasis: "320px", minWidth: "220px" });
    const phrase = G.geant(`<p>DÉCOLLONS<br><span style="color:${LIME}">ENSEMBLE.</span></p>`, { taille: [36, 92], tablette: { taille: [40, 72] }, mobile: { taille: [34, 46] }, lh: 0.92, suivi: "0.005em", poids: "800", police: S.head, couleur: LAV })(k, env);
    const b = souffle(bouton(k, "Parler à l'équipe", "/contact", { texte: VIO2, fond: LIME, survol: { backgroundColor: LAV, borderColor: LAV, color: VIO2, transform: { y: -4 } }, focus: LAV, taille: 17 }), 3800);
    const centre = k.col([caps(k, "Lancements et services", { couleur: LIME, suivi: "0.26em" }), phrase, k.row([b, para(k, "Étude de mission, intégration et campagne de lancement.", { taille: 16, couleur: "#d3c7f5", max: "300px" })], { rowGap: "16px", columnGap: "24px", alignItems: "center" }), coordonnees(k, { couleur: LAV, lien: LAV, survol: LIME, focus: LIME, taille: 16 })], { flexGrow: 1, flexBasis: "360px", minWidth: "260px", gap: "24px" });
    const num = (i, t, u) => lien(k, `${i}   ${t}`, u, { taille: 19, poids: "700", couleur: LAV, survol: { color: LIME, paddingLeft: "10px" }, focus: LIME, h: "52px" });
    const colE = k.col([num("01", "Lanceurs", "/catalogue"), num("02", "Charges utiles", "/catalogue"), num("03", "Sites de tir", "/faq"), num("04", "Actualités", "/blog"), num("05", "Nous écrire", "/contact")], { flexGrow: 0, flexBasis: "260px", minWidth: "220px", paddingLeft: "22px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "4px", borderColor: LIME, boxSizing: "border-box" });
    const corps = G.bande(k, [rocket, centre, colE], { fond: VIO, aligne: "center", gap: "36px 56px", padV: ["24px", "20px", "20px"], padB: ["64px", "48px", "36px"], padH: MARGES, nom: "Fusée et appel" });
    const fin = G.bande(k, [G.ligneLegale({ taille: 13, couleur: "#d3c7f5", liens: LAV, sansCookies: true })(k, env)], { fond: VIO2, colonne: true, aligne: "stretch", padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: MARGES, nom: "Mentions" });
    [haut, corps, fin].forEach((b) => { b.styles.desktop.color = LAV; });
    return [G.racine(k, [haut, corps, fin])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Aéronautique et spatial", target: 6, built: true,
  description: "Pieds inspirés de captures, angles droits, animations fluides : bureau d'études aéronautique, lanceur, compagnie, constructeur, start-up spatiale.",
  models: [tour, orbite, departs, plan, cielNuit, rebours],
};
