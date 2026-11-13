// Famille v2 « Campings et villages de vacances » — 5 modèles (ft2-509 à ft2-513), extension « standard pro animé » : SANS illustration, ANGLES DROITS partout (aucun border-radius).
// Pieds de camping, de village de vacances ou de parc résidentiel de loisirs : sommaire numéroté du séjour, accueil et horaires, hébergements en cartes plates, panneau d'entrée, veillée et lettre au centre.
// Contenu utile et réel (coordonnées et horaires des « Données de l'entreprise », liens de la plateforme, lettre d'information, mentions légales) ; marques fictives ; AUCUN tarif, AUCUNE capacité,
// AUCUN classement ni label inventé. Les adresses de réseaux sont des exemples à remplacer dans l'éditeur.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce », le moteur coupe les transitions et les animations d'attention) :
//   · transitions longues et douces de 360 ms (couleur, fond, filet, décalage de 4 à 10 px, flèche qui glisse) ;
//   · au moins une animation visible par modèle : carré de statut qui « respire », carte qui se soulève, rangée qui glisse, bouton qui s'inverse, case qui s'éclaire.
//   Limites du moteur : pas d'animation d'ENTRÉE, pas de défilement continu.
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const A = require("../aides-std-s08");
const { racineDe, lien, caps, texte, trait, souffle, carre, horaires, coordonnees, bloc, rubrique, lettre, nomDuSite, bouton, carteLift, PH, DOUX } = A;

const FAM = "campings-vacances";
const SOC = [["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["YouTube", "https://www.youtube.com/"]];
const SEJOUR = [["Réserver un séjour", "/contact"], ["Nos hébergements", "/catalogue"], ["Arrivée et départ", "/faq"], ["Tarifs et conditions", "/faq"]];
const VIE = [["Règlement intérieur", "/faq"], ["Animaux acceptés ?", "/faq"], ["Actualités du camping", "/blog"], ["Questions fréquentes", "/faq"]];
const COMPTE = [["Espace client", "/connexion"], ["Créer un compte", "/inscription"], ["Nous contacter", "/contact"], ["Cookies", "/cookies"]];

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-509 « Sommaire du séjour » — camping et village de vacances qui organise l'information
// Idée : un SOMMAIRE en quatre grands numéros 01 à 04 (Séjourner, Sur place, Avant de venir, Mon compte) de 64 px sur fond ivoire, chacun avec sa liste de liens, séparés par des filets verticaux ; le numéro et le fond de la colonne
// s'éclairent au survol. En tête une bande vert forêt (nom du site, phrase, bouton ocre), en pied une bande forêt (contact, horaires avec carré qui respire, lettre). Polices : Zilla Slab (titres) et Work Sans.
const foretCamp = identite({
  key: "c509", label: "Vert forêt, ivoire et ocre", humeur: "dark",
  fond: "#123524", texte: "#f1ede0", discret: "#bcd0c3", accent: "#f0b44c", surface: "#1a4632", encre: "#123524", surEncre: "#f1ede0",
  police: "font.work-sans", titres: "font.zilla-slab",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "1px", ligne: "#f1ede040",
});
const FORET = "#123524", IVOIRE = "#f1ede0", OCRE = "#f0b44c", FORET_T = "#1d5a3b";
const sommaireSejour = modeleV2({
  id: identifiantV2(509, "sommaire-du-sejour"), concept: "c-509-sommaire-du-sejour",
  name: "Sommaire du séjour", family: FAM,
  description: "Pour un camping ou un village de vacances : un sommaire en quatre grands numéros (séjourner, sur place, avant de venir, mon compte) sur ivoire, entre une bande d'accueil et une bande de contact vert forêt. Rigoureux, très lisible.",
  tags: ["camping", "village de vacances", "sommaire numéroté", "vert forêt", "ivoire", "ocre", "slab", "angles droits"],
  identity: foretCamp,
  racine: racineDe(FORET),
  widgets: ["bizcontact", "bizhours", "bizlegal", "copyright", "divider", "emailsubscribe", "link", "sitetitle", "text"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 40, "#ffffff", { fontWeight: "700" });
    const mot = texte(k, "Un lieu, des vacances, une équipe à votre écoute de l'arrivée jusqu'au départ.", { taille: 18, couleur: "#d3e1d8", largeur: "460px", lh: 1.55 });
    const btn = bouton(k, "Réserver un séjour", "/contact", { texte: FORET, fond: OCRE, casse: "uppercase", suivi: "0.08em", survol: { backgroundColor: "#ffffff", color: FORET, transform: { x: 6 } }, focus: "#ffffff" });
    const g = G.colonne(k, [caps(k, "Bienvenue", { couleur: OCRE, suivi: "0.22em" }), nom, mot], { poids: 7, min: "300px", gap: "12px" });
    const d = G.colonne(k, [btn], { poids: 3, min: "240px", soi: "flex-end", aligne: "flex-end", mobile: { alignItems: "flex-start" } });
    const tete = G.bande(k, [g, d], { fond: FORET, gap: "28px 48px", aligne: "flex-end", padV: ["80px", "60px", "44px"], padB: ["56px", "44px", "36px"], padH: PH, nom: "Accueil" });
    const SECT = [["01", "Séjourner", SEJOUR], ["02", "Sur place", VIE], ["03", "Avant de venir", [["Arrivée et départ", "/faq"], ["Conditions de séjour", "/faq"], ["Nous écrire", "/contact"], ["Actualités", "/blog"]]], ["04", "Mon compte", COMPTE]];
    const section = ([num, titre, liste], i) => {
      const n = k.T(`<p>${num}</p>`, { fontSize: "64px", fontWeight: "700", fontFamily: S.head, color: "#1d5a3b", lineHeight: 1, transitionDuration: DOUX });
      n.states = { hover: { color: "#9a5b00" } };
      const c = k.col([n, caps(k, titre, { couleur: "#123524", suivi: "0.16em", taille: "13px" }), ...liste.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: FORET, survol: { color: "#8a4a00", transform: { x: 6 } }, focus: "#8a4a00" }))], { flexGrow: 1, flexBasis: "0px", minWidth: "220px", gap: "4px", backgroundColor: IVOIRE, borderStyle: "solid", borderWidth: "0px", borderRightWidth: i === 3 ? "0px" : "1px", borderColor: "#12352444", borderRadius: "0px", boxSizing: "border-box", paddingTop: "36px", paddingBottom: "36px", paddingLeft: i === 0 ? "0px" : "32px", paddingRight: i === 3 ? "0px" : "28px", transitionDuration: DOUX }, undefined, { minWidth: "100%", borderRightWidth: "0px", borderBottomWidth: i === 3 ? "0px" : "1px", paddingLeft: "0px", paddingRight: "0px" });
      c.states = { hover: { backgroundColor: "#e6e0cb" } };
      return c;
    };
    const sommaire = G.bande(k, SECT.map(section), { fond: IVOIRE, gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Sommaire" });
    const pt = souffle(carre(k, OCRE, "10px"), 3000);
    const cC = bloc(k, "Nous joindre", [coordonnees(k, { couleur: "#ecf2ee", lien: "#ffffff", survol: OCRE, focus: "#ffffff" })], { couleurTitre: OCRE, min: "220px", gap: "12px" });
    const cH = G.colonne(k, [k.row([pt, caps(k, "Horaires de l'accueil", { couleur: OCRE })], { gap: "10px", alignItems: "center" }), horaires(k, { couleur: "#ecf2ee" })], { poids: 1, min: "220px", gap: "12px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Les nouveautés du camping, avant la saison.", largeur: "360px", accent: OCRE, surBouton: FORET, texte: "#ecf2ee", couleurTitre: OCRE, fond: FORET, survolBouton: "#ffffff", survolTexte: FORET, focus: "#ffffff" });
    const cL = G.colonne(k, [abo], { poids: 1.4, min: "260px" });
    const grille = G.ligne(k, [cC, cH, cL], { gap: "36px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#cfe0d6", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#f1ede033"), mentions], { fond: FORET, colonne: true, gap: "32px", padV: ["60px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: PH, innerMobile: { rowGap: "26px" }, nom: "Contact" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [tete, sommaire, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-510 « Bienvenue à l'accueil » — camping familial avec une réception
// Idée : le comptoir d'accueil. À gauche, sur sable, « Bienvenue. » en grand serif, le nom du site et les horaires de la réception (carré qui respire) ; à droite trois rubriques de liens, un filet et la lettre.
// Une bande terre cuite en bas porte les réseaux, un lien vers l'accueil et les mentions. Polices : Young Serif (titres) et Karla.
const sableCamp = identite({
  key: "c510", label: "Sable chaud, terre cuite et brun", humeur: "light",
  fond: "#efe3cc", texte: "#3a2415", discret: "#5c4535", accent: "#9c3a17", surface: "#f8f0e0", encre: "#3a2415",
  police: "font.karla", titres: "font.young-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#3a241533",
});
const SABLE = "#efe3cc", CUIR = "#3a2415", TERRE = "#9c3a17";
const bienvenueAccueil = modeleV2({
  id: identifiantV2(510, "bienvenue-a-l-accueil"), concept: "c-510-bienvenue-a-l-accueil",
  name: "Bienvenue à l'accueil", family: FAM,
  description: "Pour un camping familial : « Bienvenue. » en grand serif avec nom et horaires de la réception à gauche, trois rubriques de liens et les réseaux à droite, puis une lettre dans la colonne de droite et une bande terre cuite (réseaux, contact, mentions). Chaleureux, sable et brun.",
  tags: ["camping familial", "accueil", "réception", "sable", "terre cuite", "serif", "horaires", "angles droits"],
  identity: sableCamp,
  racine: racineDe(TERRE),
  widgets: ["bizcontact", "bizhours", "bizlegal", "copyright", "divider", "emailsubscribe", "link", "sitetitle", "text"],
  compose(k, env, G) {
    const S = k.S;
    const titre = G.geant(`<p>Bienvenue.</p>`, { taille: [52, 104], tablette: { taille: [76, 96] }, mobile: { taille: [52, 68] }, lh: 1.0, suivi: "-0.02em", poids: "400", police: S.head, couleur: CUIR })(k, env);
    const nom = nomDuSite(k, env, 24, TERRE);
    const pt = souffle(carre(k, TERRE, "10px"), 3200);
    const gauche = G.colonne(k, [caps(k, "À la réception", { couleur: TERRE, suivi: "0.2em" }), titre, nom, k.row([pt, caps(k, "Horaires d'accueil", { couleur: TERRE })], { gap: "10px", alignItems: "center" }), horaires(k, { couleur: CUIR }), coordonnees(k, { couleur: CUIR, lien: CUIR, survol: TERRE, focus: TERRE })], { poids: 5, min: "300px", gap: "16px" });
    const ligneEt = (t, l, dernier) => k.row([k.col([caps(k, t, { couleur: TERRE, suivi: "0.16em" })], { width: "130px", flexShrink: 0, paddingTop: "14px" }), G.ligne(k, l.map(([x, u]) => lien(k, x, u, { taille: 16, poids: "600", couleur: CUIR, survol: { color: TERRE, transform: { y: -2 } }, focus: TERRE })), { gap: "0px 24px", aligne: "center", largeur: "100%" })], { width: "100%", flexWrap: "nowrap", alignItems: "flex-start", gap: "16px", paddingTop: "4px", paddingBottom: "6px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: dernier ? "0px" : "1px", borderColor: "#3a241555", borderRadius: "0px" }, undefined, { flexWrap: "wrap" });
    const trois = k.col([ligneEt("Séjourner", SEJOUR), ligneEt("Sur place", VIE), ligneEt("Compte", COMPTE, true)], { width: "100%", gap: "0px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: CUIR });
    const abo = lettre(k, env, G, { titre: "Restez au courant", intro: "Nos nouveautés et nos dates ouvertes, par courriel.", largeur: "100%", accent: TERRE, surBouton: "#ffffff", texte: CUIR, couleurTitre: TERRE, fond: SABLE, survolBouton: CUIR, survolTexte: "#ffffff", focus: CUIR });
    const droite = G.colonne(k, [trois, trait(k, "#3a241555", "2px"), abo], { poids: 7, min: "320px", gap: "28px", extra: { alignSelf: "stretch", justifyContent: "flex-end" } });
    const haut = G.bande(k, [gauche, droite], { fond: SABLE, gap: "44px 72px", aligne: "flex-end", padV: ["88px", "68px", "48px"], padB: ["72px", "56px", "40px"], padH: PH, nom: "Accueil" });
    const res = G.ligne(k, [caps(k, "Suivez-nous", { couleur: "#ffffff" }), G.reseauxTexte(SOC, { taille: 16, poids: "700", couleur: "#ffffff", survol: "#f6d9c8", focus: "#ffffff" })(k, env), lien(k, "Écrire à l'accueil →", "/contact", { taille: 16, poids: "700", couleur: "#ffffff", soulign: true, survol: { color: "#f6d9c8", transform: { x: 6 } }, focus: "#ffffff" })], { gap: "4px 32px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#f6e4da", liens: "#ffffff" })(k, env);
    const barre = G.bande(k, [res, trait(k, "#ffffff55"), mentions], { fond: TERRE, colonne: true, gap: "22px", padV: ["40px", "36px", "32px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    barre.styles.desktop.color = "#ffffff";
    return [G.racine(k, [haut, barre])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-511 « Hébergements en cartes » — camping qui propose plusieurs types d'hébergement
// Idée : à gauche le nom du camping et une grande phrase, à droite quatre CARTES PLATES 2 × 2 de couleurs franches (bleu lac, turquoise, sable, orange) pour Emplacements, Mobil-homes, Chalets, Tentes équipées ; chaque carte se soulève de 5 px et sa flèche glisse.
// Dessous sur bleu nuit : lettre, contact et horaires. Aucun tarif ni capacité. Polices : Outfit (titres) et Nunito Sans.
const lacCamp = identite({
  key: "c511", label: "Bleu lac, turquoise, sable et orange", humeur: "dark",
  fond: "#0b3954", texte: "#eaf4f8", discret: "#b5d0dc", accent: "#f4a259", surface: "#114866", encre: "#0b3954", surEncre: "#eaf4f8",
  police: "font.nunito-sans", titres: "font.outfit",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#eaf4f833",
});
const LAC = "#0b3954", LAC2 = "#14597f", TURQ = "#8fd8cc", SABLE2 = "#f2d8a7", ORANGE = "#f4a259";
const hebergementsCartes = modeleV2({
  id: identifiantV2(511, "hebergements-en-cartes"), concept: "c-511-hebergements-en-cartes",
  name: "Hébergements en cartes", family: FAM,
  description: "Pour un camping aux hébergements variés : quatre grandes cartes plates de couleurs franches (emplacements, mobil-homes, chalets, tentes équipées) qui se soulèvent au survol, puis la lettre, le contact et les horaires sur bleu lac.",
  tags: ["camping", "hébergements", "quatre cartes", "bleu lac", "turquoise", "sable", "orange", "angles droits"],
  identity: lacCamp,
  racine: racineDe(LAC),
  widgets: ["bizcontact", "bizhours", "bizlegal", "copyright", "divider", "emailsubscribe", "link", "sitetitle", "text"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 36, "#ffffff");
    const phr = G.geant(`<p>Choisissez<br>votre façon<br>de dormir dehors.</p>`, { taille: [40, 84], tablette: { taille: [56, 76] }, mobile: { taille: [40, 52] }, lh: 1.02, suivi: "-0.01em", poids: "700", police: S.head, couleur: "#ffffff" })(k, env);
    const gauche = G.colonne(k, [caps(k, "Hébergements", { couleur: ORANGE, suivi: "0.22em" }), nom, phr, lien(k, "Tous nos hébergements →", "/catalogue", { taille: 16, poids: "700", couleur: ORANGE, soulign: true, survol: { color: "#ffffff", transform: { x: 8 } }, focus: "#ffffff" })], { poids: 4, min: "280px", gap: "20px" });
    const HEB = [["Emplacements", "Pour tentes, caravanes et camping-cars.", LAC2, "#ffffff", "#ffffff", ORANGE], ["Mobil-homes", "Un séjour équipé, sans montage.", TURQ, LAC, LAC, "#ffffff"], ["Chalets", "Du bois, du calme, un vrai salon.", SABLE2, LAC, LAC, "#ffffff"], ["Tentes équipées", "Le camping, avec un vrai lit.", ORANGE, LAC, LAC, "#ffffff"]];
    const carte = ([t, d, fond, encre], i) => {
      const lt = lien(k, t, "/catalogue", { taille: 26, poids: "700", police: S.head, couleur: encre, survol: { color: encre, transform: { x: 8 } }, focus: encre, h: "48px", lh: 1.1 });
      const fl = k.T("<p>↗</p>", { fontSize: "26px", fontWeight: "700", color: encre, fontFamily: S.font, lineHeight: 1, transitionDuration: DOUX });
      const hautC = k.row([caps(k, `0${i + 1}`, { couleur: encre, suivi: "0.2em" }), fl], { justifyContent: "space-between", alignItems: "center", flexWrap: "nowrap", width: "100%" });
      return carteLift(k, [hautC, lt, texte(k, d, { taille: 16, couleur: encre })], { fond, min: "280px", gap: "8px", fondSurvol: fond, extra: { paddingTop: "28px", paddingBottom: "34px", paddingLeft: "28px", paddingRight: "28px", justifyContent: "space-between" } });
    };
    const grilleCartes = G.ligne(k, HEB.map(carte), { gap: "14px", aligne: "stretch", largeur: "100%" });
    const droiteC = G.colonne(k, [grilleCartes], { poids: 7, min: "320px" });
    const cartes = G.bande(k, [gauche, droiteC], { fond: LAC, gap: "40px 56px", aligne: "flex-start", padV: ["80px", "60px", "44px"], padB: ["64px", "52px", "40px"], padH: PH, nom: "Hébergements" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Les nouveautés du camping, avant la saison.", largeur: "380px", accent: ORANGE, surBouton: LAC, texte: "#eaf4f8", couleurTitre: ORANGE, fond: LAC, survolBouton: "#ffffff", survolTexte: LAC, focus: "#ffffff" });
    const pt = souffle(carre(k, ORANGE, "10px"), 3000);
    const cC = bloc(k, "Contact", [coordonnees(k, { couleur: "#eaf4f8", lien: "#ffffff", survol: ORANGE, focus: "#ffffff" })], { couleurTitre: ORANGE, min: "220px", gap: "12px" });
    const cH = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: ORANGE })], { gap: "10px", alignItems: "center" }), horaires(k, { couleur: "#eaf4f8" })], { poids: 1, min: "220px", gap: "12px" });
    const grille = G.ligne(k, [G.colonne(k, [abo], { poids: 1.5, min: "280px" }), cC, cH], { gap: "36px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const liens = G.ligne(k, [...SEJOUR.slice(2), ...VIE.slice(0, 1), ...COMPTE.slice(0, 1)].map(([t, u]) => lien(k, t, u, { taille: 15, poids: "600", couleur: "#eaf4f8", survol: { color: ORANGE, transform: { y: -2 } }, focus: "#ffffff" })), { gap: "0px 26px", aligne: "center", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c9dde6", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [grille, trait(k, "#eaf4f833"), liens, mentions], { fond: "#082b40", colonne: true, gap: "26px", padV: ["56px", "48px", "40px"], padB: ["28px", "24px", "20px"], padH: PH, innerMobile: { rowGap: "22px" }, nom: "Contact" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [cartes, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-512 « Panneau d'entrée » — camping, village de vacances, aire de loisirs
// Idée : un PANNEAU ROUTIER. Sur fond olive, un grand panneau à fort contour ivoire en deux champs : à gauche un champ jaune panneau (« Accueil », nom du site, horaires, contact), à droite un champ ivoire avec deux listes de liens
// en rangées à flèche (la flèche glisse, la rangée s'éclaire) et la lettre. Une barre olive ferme le tout. Polices : Bebas Neue (titres) et Cabin.
const olive = identite({
  key: "c512", label: "Olive, jaune panneau et ivoire", humeur: "dark",
  fond: "#2e3b17", texte: "#f5f1e3", discret: "#cdd4b8", accent: "#f2c230", surface: "#3a4a1e", encre: "#2e3b17", surEncre: "#f5f1e3",
  police: "font.cabin", titres: "font.bebas-neue",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "4px", ligne: "#f5f1e340",
});
const OLIVE = "#2e3b17", PANNEAU = "#f2c230", PAPIER = "#f5f1e3", BRIQUE = "#8a3b12";
const panneauEntree = modeleV2({
  id: identifiantV2(512, "panneau-d-entree"), concept: "c-512-panneau-d-entree",
  name: "Panneau d'entrée", family: FAM,
  description: "Pour un camping ou une aire de loisirs : un grand panneau à fort contour en deux champs, jaune (accueil, nom, horaires, contact) et ivoire (listes de liens à flèche qui glisse, lettre), sur fond olive. Franc, signalétique, angles droits.",
  tags: ["camping", "panneau", "signalétique", "olive", "jaune", "deux champs", "capitales condensées", "angles droits"],
  identity: olive,
  racine: racineDe(OLIVE),
  widgets: ["bizcontact", "bizhours", "bizlegal", "copyright", "divider", "emailsubscribe", "link", "sitetitle", "text"],
  compose(k, env, G) {
    const S = k.S;
    const accueil = G.geant(`<p>Accueil</p>`, { taille: [64, 132], tablette: { taille: [88, 120] }, mobile: { taille: [64, 88] }, lh: 0.95, suivi: "0.01em", poids: "400", police: S.head, couleur: OLIVE, extra: { textTransform: "uppercase" } })(k, env);
    const nom = nomDuSite(k, env, 26, OLIVE, { fontFamily: S.font, fontWeight: "800" });
    const pt = souffle(carre(k, OLIVE, "10px"), 3000);
    const champJaune = k.col([caps(k, "Réception du camping", { couleur: OLIVE, suivi: "0.2em" }), accueil, nom, k.row([pt, caps(k, "Horaires", { couleur: OLIVE })], { gap: "10px", alignItems: "center" }), horaires(k, { couleur: OLIVE }), coordonnees(k, { couleur: OLIVE, lien: OLIVE, survol: BRIQUE, focus: OLIVE })], { flexGrow: 4, flexBasis: "0px", minWidth: "300px", gap: "14px", backgroundColor: PANNEAU, borderRadius: "0px", boxSizing: "border-box", paddingTop: "44px", paddingBottom: "44px", paddingLeft: "40px", paddingRight: "40px" }, { paddingLeft: "28px", paddingRight: "28px" }, { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "32px" });
    const rangee = ([t, u], i) => {
      const l = lien(k, t, u, { taille: 17, poids: "700", couleur: OLIVE, survol: { color: BRIQUE }, focus: BRIQUE, h: "48px", extra: { flexGrow: 1 } });
      const fl = k.T("<p>›</p>", { fontSize: "24px", fontWeight: "700", color: BRIQUE, fontFamily: S.font, lineHeight: 1, transitionDuration: DOUX });
      const r = k.row([l, fl], { flexWrap: "nowrap", alignItems: "center", width: "100%", paddingLeft: "6px", paddingRight: "14px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: i === 0 ? "3px" : "0px", borderBottomWidth: "1px", borderColor: "#2e3b1766", borderRadius: "0px", backgroundColor: PAPIER, boxSizing: "border-box", transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: "#ebe5cc", paddingLeft: "20px", paddingRight: "6px" } };
      return r;
    };
    const liste = (t, l) => k.col([caps(k, t, { couleur: BRIQUE, suivi: "0.18em" }), ...l.map(rangee)], { flexGrow: 1, flexBasis: "0px", minWidth: "220px", gap: "0px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Les nouveautés du camping, avant la saison.", largeur: "100%", accent: OLIVE, surBouton: PANNEAU, texte: OLIVE, couleurTitre: BRIQUE, fond: PAPIER, survolBouton: BRIQUE, survolTexte: "#ffffff", focus: OLIVE });
    const champIvoire = k.row([liste("Séjourner", SEJOUR), liste("Sur place", VIE), abo], { flexGrow: 6, flexBasis: "0px", minWidth: "320px", flexWrap: "wrap", alignItems: "flex-start", rowGap: "32px", columnGap: "32px", backgroundColor: PAPIER, borderRadius: "0px", boxSizing: "border-box", paddingTop: "44px", paddingBottom: "44px", paddingLeft: "40px", paddingRight: "40px" }, { paddingLeft: "28px", paddingRight: "28px" }, { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "32px" });
    const panneau = k.row([champJaune, champIvoire], { width: "100%", flexWrap: "wrap", gap: "0px", alignItems: "stretch", borderStyle: "solid", borderWidth: "6px", borderColor: PAPIER, borderRadius: "0px", boxSizing: "border-box" });
    const bandePanneau = G.bande(k, [panneau], { fond: OLIVE, colonne: true, padV: ["72px", "56px", "36px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Panneau" });
    const social = G.ligne(k, [caps(k, "Suivez-nous", { couleur: PANNEAU }), G.reseauxTexte(SOC, { taille: 16, poids: "700", couleur: PAPIER, survol: PANNEAU, focus: PAPIER })(k, env), ...COMPTE.slice(0, 2).map(([t, u]) => lien(k, t, u, { taille: 16, poids: "700", couleur: PAPIER, survol: { color: PANNEAU, transform: { y: -2 } }, focus: PAPIER }))], { gap: "4px 28px", aligne: "center", largeur: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#dfe4cd", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [social, trait(k, "#f5f1e340"), mentions], { fond: OLIVE, colonne: true, gap: "22px", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [bandePanneau, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-513 « Veillée au feu » — village de vacances, camping nature
// Idée : un pied CENTRÉ, comme une veillée. Sur brun nuit, une phrase centrée en grand serif (« Restons en contact. »), la lettre d'information au centre, une rangée de liens centrés séparés par des filets,
// puis deux colonnes centrées (contact, horaires avec carré qui respire). Les liens se soulignent d'orange feu en s'étirant. Polices : DM Serif Display (titres) et Albert Sans.
const nuit = identite({
  key: "c513", label: "Brun nuit, crème et orange feu", humeur: "dark",
  fond: "#1d130d", texte: "#f6ead8", discret: "#cdb8a0", accent: "#ff8a3d", surface: "#2a1c13", encre: "#1d130d", surEncre: "#f6ead8",
  police: "font.albert-sans", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f6ead840",
});
const NUIT = "#1d130d", CREME = "#f6ead8", FEU = "#ff8a3d";
const veilleeAuFeu = modeleV2({
  id: identifiantV2(513, "veillee-au-feu"), concept: "c-513-veillee-au-feu",
  name: "Veillée au feu", family: FAM,
  description: "Pour un village de vacances ou un camping nature : un pied centré sur brun nuit, grande phrase serif, lettre au centre, liens en rangée séparés par des filets, puis contact et horaires centrés. Chaleureux, orange feu et crème.",
  tags: ["camping nature", "village de vacances", "centré", "brun nuit", "orange feu", "serif", "lettre au centre", "angles droits"],
  identity: nuit,
  racine: racineDe(NUIT),
  widgets: ["bizcontact", "bizhours", "bizlegal", "copyright", "divider", "emailsubscribe", "link", "sitetitle", "text"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Restons<br>en contact.</p>`, { taille: [52, 112], tablette: { taille: [76, 100] }, mobile: { taille: [52, 68] }, lh: 1.0, suivi: "-0.01em", poids: "400", police: S.head, couleur: CREME, align: "center" })(k, env);
    const nom = nomDuSite(k, env, 22, FEU, { textAlign: "center" });
    const intro = texte(k, "Une lettre de temps en temps : les dates ouvertes, les soirées, les conseils pour bien préparer votre séjour.", { taille: 17, couleur: "#e4d3bd", largeur: "520px", extra: { textAlign: "center", marginLeft: "auto", marginRight: "auto" } });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Sans spam, désabonnement en un clic.", largeur: "480px", accent: FEU, surBouton: NUIT, texte: "#f6ead8", couleurTitre: FEU, fond: NUIT, survolBouton: CREME, survolTexte: NUIT, focus: CREME });
    const haut = G.bande(k, [caps(k, "Veillée", { couleur: FEU, suivi: "0.26em", extra: { textAlign: "center" } }), nom, phrase, intro, abo], { fond: NUIT, colonne: true, aligne: "center", gap: "20px", padV: ["96px", "72px", "52px"], padB: ["56px", "44px", "36px"], padH: PH, nom: "Veillée" });
    const lienC = ([t, u]) => lien(k, t, u, { taille: 16, poids: "700", couleur: CREME, survol: { color: FEU, transform: { y: -2 } }, focus: FEU, extra: { justifyContent: "center" } });
    const liens = G.ligne(k, [...SEJOUR.slice(0, 2), ...VIE.slice(0, 1), ...COMPTE.slice(0, 1), ["Actualités", "/blog"]].map(lienC), { gap: "0px 34px", aligne: "center", justifie: "center", largeur: "100%" });
    const pt = souffle(carre(k, FEU, "10px"), 3200);
    const fixe = (n, w) => { n.styles.desktop = { ...n.styles.desktop, width: w }; return n; };
    const cC = G.colonne(k, [caps(k, "Nous joindre", { couleur: FEU, extra: { textAlign: "center" } }), fixe(coordonnees(k, { couleur: CREME, lien: "#ffffff", survol: FEU, focus: FEU, align: "center" }), "300px")], { poids: 1, min: "240px", gap: "12px", aligne: "center" });
    const cH = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: FEU })], { gap: "10px", alignItems: "center", justifyContent: "center" }), fixe(horaires(k, { couleur: CREME, align: "center" }), "320px")], { poids: 1, min: "240px", gap: "12px", aligne: "center" });
    const info = G.ligne(k, [cC, cH], { gap: "32px 64px", aligne: "flex-start", justifie: "center", largeur: "100%" });
    const res = G.reseauxTexte(SOC, { taille: 15, poids: "700", couleur: CREME, survol: FEU, focus: FEU })(k, env, true);
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d9c8b2", liens: "#ffffff" })(k, env, true);
    const bas = G.bande(k, [trait(k, "#f6ead855"), liens, trait(k, "#f6ead833"), info, res, mentions], { fond: NUIT, colonne: true, aligne: "center", gap: "28px", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: PH, innerMobile: { rowGap: "22px" }, nom: "Contact" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Campings et villages de vacances", target: 5, built: true,
  description: "Pieds standard très professionnels, à angles droits et sans illustration : sommaire du séjour, bienvenue à l'accueil, hébergements en cartes, panneau d'entrée, veillée centrée.",
  models: [sommaireSejour, bienvenueAccueil, hebergementsCartes, panneauEntree, veilleeAuFeu],
};
