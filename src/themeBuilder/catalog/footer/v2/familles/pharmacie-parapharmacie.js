// Famille v2 « Pharmacie et parapharmacie » — 5 modèles (ft2-434 à ft2-438), extension « standard pro animé » : AUCUNE illustration, ANGLES DROITS partout.
// Pieds d'officine et de parapharmacie : bandeau d'appel et quatre colonnes, sommaire numéroté d'ordonnance, grille de rayons en cartes, panneau d'horaires latéral, questions fréquentes du pharmacien.
// Contenus utiles (coordonnées et horaires des « Données de l'entreprise », liens de la plateforme, lettre d'information, mentions légales) ; marques fictives ; AUCUNE coordonnée, AUCUN chiffre,
// AUCUNE affirmation médicale inventée : les rubriques sont des intitulés d'exemple à adapter dans l'éditeur.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce », le moteur coupe les transitions et les animations d'attention) :
//   · transitions longues et douces de 360 ms : couleur, fond de ligne qui s'éclaire, décalage de 2 à 10 px, filet qui s'épaissit, carte qui se soulève ;
//   · au moins une animation visible par modèle : carré de statut qui « respire » près des horaires, carte qui se soulève, rangée dont le retrait s'élargit, bouton qui s'inverse.
const { identite, GK, racineDe, lien, caps, texte, trait, souffle, carre, horaires, coordonnees, bloc, lettre, nomDuSite, bouton, listeLiens, DOUX } = require("../aides-std-s01");
const { modeleV2, identifiantV2 } = require("../kit-v2");

const FAM = "pharmacie-parapharmacie";
const PAD = (a, b, c) => [a, b, c];

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-434 « Comptoir de l'officine » — officine de quartier
// Idée : le pied d'un SITE D'OFFICINE classique. Un bandeau vert plein (« Un conseil ? Nous vous répondons ») avec bouton blanc carré ; en dessous quatre colonnes bien classées (Officine, Rayons, Informations,
// Coordonnées et horaires) sur blanc ; une bande vert très clair porte la lettre ; barre blanche de mentions. Les liens glissent de 5 px et se soulignent ; le bouton s'inverse ; carré de statut qui respire.
// Polices : Source Serif 4 (titres) et Public Sans.
const vert = identite({
  key: "c434", label: "Blanc, vert croix et menthe", humeur: "light",
  fond: "#ffffff", texte: "#12301f", discret: "#43584a", accent: "#00693e", surface: "#e8f5ee", encre: "#12301f",
  police: "font.public-sans", titres: "font.source-serif-4",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#12301f33",
});
const VERT = "#00693e", VERT2 = "#0b4a2d", MENTHE = "#e8f5ee", ENC1 = "#12301f";
const comptoir = modeleV2({
  id: identifiantV2(434, "comptoir-de-l-officine"), concept: "c-434-comptoir-de-l-officine",
  name: "Comptoir de l'officine", family: FAM,
  description: "Pour une officine de quartier : bandeau vert d'appel au conseil, quatre colonnes bien classées (officine, rayons, informations, contact et horaires), bande menthe pour la lettre. Blanc, vert croix, angles droits.",
  tags: ["pharmacie", "officine", "quatre colonnes", "bandeau d'appel", "vert", "blanc", "angles droits", "horaires"],
  identity: vert, racine: racineDe("#ffffff"), widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Un conseil ?<br>Nous sommes là.</p>`, { taille: [36, 64], tablette: { taille: [44, 56] }, mobile: { taille: [34, 44] }, lh: 1.05, suivi: "-0.01em", poids: "600", police: S.head, couleur: "#ffffff" })(k, env);
    const intro = texte(k, "Une question sur un traitement, un produit ou une ordonnance : l'équipe de l'officine vous répond.", { couleur: "#ffffff", taille: 17, max: "460px" });
    const gauche = G.colonne(k, [caps(k, "Équipe officinale", { couleur: "#ffffff", suivi: "0.2em" }), phrase, intro], { poids: 6, min: "300px", gap: "14px" });
    const btns = k.row([
      bouton(k, "Nous contacter", "/contact", { texte: VERT, fond: "#ffffff", survol: { backgroundColor: VERT2, color: "#ffffff", transform: { y: -3 } }, focus: "#ffffff" }),
      bouton(k, "Questions fréquentes", "/faq", { texte: "#ffffff", fond: undefined, bord: "#ffffff", survol: { backgroundColor: "#ffffff", color: VERT, transform: { y: -3 } }, focus: "#ffffff" }),
    ], { gap: "12px" });
    const droite = G.colonne(k, [btns], { poids: 4, min: "290px", aligne: "flex-end", mobile: { alignItems: "flex-start" } });
    const appel = G.bande(k, [gauche, droite], { fond: VERT, aligne: "center", gap: "28px 48px", padV: PAD("64px", "52px", "40px"), padH: PAD("48px", "32px", "20px"), nom: "Appel" });
    const nom = nomDuSite(k, env, 26, ENC1);
    const lie = (t, u) => [t, u];
    const c1 = G.colonne(k, [caps(k, "Officine", { couleur: VERT }), nom, texte(k, "Conseil, délivrance et suivi, avec le sourire.", { taille: 15 }), lien(k, "Haut de page ↑", "#haut", { taille: 14, poids: "600", couleur: ENC1, survol: { color: VERT, transform: { y: -3 } }, focus: VERT })], { poids: 1.1, min: "220px", gap: "12px" });
    const c2 = listeLiens(k, "Rayons", [lie("Parapharmacie", "/boutique"), lie("Catalogue", "/catalogue"), lie("Panier", "/boutique/panier"), lie("Mes envies", "/boutique/souhaits")], { couleur: ENC1, accent: VERT, couleurTitre: VERT });
    const c3 = listeLiens(k, "Informations", [lie("Conseils santé", "/blog"), lie("Questions fréquentes", "/faq"), lie("Mon compte", "/boutique/compte"), lie("Espace client", "/connexion")], { couleur: ENC1, accent: VERT, couleurTitre: VERT });
    const pt = souffle(carre(k, VERT, "10px"), 3200);
    const c4 = G.colonne(k, [caps(k, "Coordonnées", { couleur: VERT }), coordonnees(k, { lien: ENC1, survol: VERT, focus: VERT }), k.row([pt, caps(k, "Horaires", { couleur: VERT })], { gap: "10px", alignItems: "center" }), horaires(k, {})], { poids: 1.3, min: "240px", gap: "12px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Conseils de saison et nouveautés de l'officine.", largeur: "100%", accent: VERT, surBouton: "#ffffff", texte: ENC1, couleurTitre: VERT2, fond: MENTHE, survolBouton: ENC1, survolTexte: "#ffffff", focus: ENC1 });
    const c5 = k.col([abo], { flexGrow: 1.5, flexBasis: "0px", minWidth: "260px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", backgroundColor: MENTHE, borderRadius: "0px", boxSizing: "border-box" });
    const colonnes = G.bande(k, [c1, c2, c3, c4, c5], { fond: "#ffffff", aligne: "stretch", gap: "36px 40px", padV: PAD("72px", "56px", "44px"), padB: PAD("56px", "44px", "36px"), padH: PAD("48px", "32px", "20px"), nom: "Colonnes" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#43584a", liens: ENC1 })(k, env);
    const bas = G.bande(k, [mentions], { fond: MENTHE, colonne: true, padV: PAD("20px", "18px", "18px"), padH: PAD("48px", "32px", "20px"), nom: "Mentions" });
    return [G.racine(k, [appel, colonnes, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-435 « Ordonnance numérotée » — officine qui met le parcours en avant
// Idée : un SOMMAIRE comme une ordonnance. Sur vert sapin, à gauche six rangées numérotées 01 à 06 pleine largeur, filets fins ; la rangée s'éclaire et son retrait grandit au survol. À droite, une carte claire
// à angles droits avec coordonnées, horaires (statut qui respire) et lettre. Barre d'ardoise verte pour les mentions. Les six rubriques sont des intitulés d'exemple à renommer.
// Polices : IBM Plex Sans (titres) et IBM Plex Mono (numéros et libellés).
const sapin = identite({
  key: "c435", label: "Vert sapin, menthe et papier", humeur: "dark",
  fond: "#0b2a22", texte: "#e9f4ee", discret: "#a9c7b8", accent: "#7fd9ac", surface: "#103a2f", encre: "#0b2a22", surEncre: "#e9f4ee",
  police: "font.ibm-plex-mono", titres: "font.ibm-plex-sans",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#e9f4ee40",
});
const SAPIN = "#0b2a22", SAPIN2 = "#103a2f", SAPIN3 = "#07201a", MENTH = "#7fd9ac", PAPIER = "#f4f7f2";
const ordonnance = modeleV2({
  id: identifiantV2(435, "ordonnance-numerotee"), concept: "c-435-ordonnance-numerotee",
  name: "Ordonnance numérotée", family: FAM,
  description: "Pour une officine qui guide ses clients : un sommaire de six rangées numérotées qui s'éclairent au survol, une carte claire (contact, horaires, lettre) et une barre sapin pour les mentions. Vert sapin et menthe, angles droits.",
  tags: ["pharmacie", "sommaire numéroté", "ordonnance", "vert sapin", "menthe", "mono", "carte", "angles droits"],
  identity: sapin, racine: racineDe(SAPIN3), widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const titre = G.geant(`<p>Votre<br>officine.</p>`, { taille: [44, 88], tablette: { taille: [60, 80] }, mobile: { taille: [44, 60] }, lh: 1.0, suivi: "-0.02em", poids: "600", police: S.head, couleur: "#ffffff" })(k, env);
    const nom = nomDuSite(k, env, 22, MENTH, { fontFamily: S.font, fontWeight: "600" });
    const RUB = [["01", "Ordonnances", "/contact"], ["02", "Conseils au comptoir", "/faq"], ["03", "Parapharmacie", "/boutique"], ["04", "Catalogue des rayons", "/catalogue"], ["05", "Conseils santé", "/blog"], ["06", "Mon compte", "/connexion"]];
    const rang = ([num, t, u]) => {
      const l = lien(k, t, u, { taille: 21, poids: "600", police: S.head, couleur: "#ffffff", survol: { color: MENTH }, focus: MENTH, h: "56px", extra: { flexGrow: 1 } });
      const r = k.row([caps(k, num, { couleur: MENTH, suivi: "0.12em", extra: { minWidth: "34px" } }), l, k.T("<p>→</p>", { fontSize: "18px", color: MENTH, lineHeight: 1, fontFamily: S.font })], { flexWrap: "nowrap", alignItems: "center", gap: "14px", width: "100%", paddingLeft: "0px", paddingRight: "14px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#e9f4ee40", borderRadius: "0px", backgroundColor: SAPIN, transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: SAPIN2, paddingLeft: "18px" } };
      return r;
    };
    const moitie = (arr) => k.col(arr.map(rang), { flexGrow: 1, flexBasis: "0px", minWidth: "300px", gap: "0px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: MENTH });
    const tete = G.bande(k, [G.colonne(k, [k.row([caps(k, "Sommaire", { couleur: MENTH, suivi: "0.2em" }), nom], { gap: "16px", alignItems: "center" }), titre], { poids: 1, min: "300px", gap: "20px" }),
      G.colonne(k, [texte(k, "Choisissez une rubrique : l'équipe de l'officine vous guide pas à pas.", { couleur: "#c4dacd", max: "360px", taille: 17 }), bouton(k, "Nous contacter", "/contact", { texte: SAPIN, fond: MENTH, soi: "flex-start", survol: { backgroundColor: "#ffffff", color: SAPIN, transform: { x: 6 } }, focus: "#ffffff" })], { poids: 0.7, min: "260px", gap: "20px" })],
      { fond: SAPIN, aligne: "flex-end", gap: "28px 56px", padV: PAD("88px", "68px", "48px"), padB: PAD("40px", "32px", "28px"), padH: PAD("48px", "32px", "20px"), nom: "Titre" });
    const liste = G.bande(k, [moitie(RUB.slice(0, 3)), moitie(RUB.slice(3))], { fond: SAPIN, aligne: "flex-start", gap: "0px 64px", padV: PAD("8px", "8px", "4px"), padB: PAD("64px", "52px", "40px"), padH: PAD("48px", "32px", "20px"), nom: "Rubriques" });
    const pt = souffle(carre(k, MENTH, "10px"), 3000);
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Nouveautés et conseils de l'officine.", largeur: "100%", accent: MENTH, surBouton: SAPIN, texte: "#e9f4ee", couleurTitre: "#ffffff", fond: SAPIN2, survolBouton: "#ffffff", survolTexte: SAPIN, focus: "#ffffff" });
    const cH = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: MENTH })], { gap: "10px", alignItems: "center" }), horaires(k, { couleur: "#e9f4ee" })], { poids: 1, min: "240px", gap: "14px" });
    const cC = G.colonne(k, [caps(k, "Coordonnées", { couleur: MENTH }), coordonnees(k, { couleur: "#e9f4ee", lien: "#ffffff", survol: MENTH, focus: "#ffffff" })], { poids: 1, min: "240px", gap: "14px" });
    const cL = G.colonne(k, [abo], { poids: 1.2, min: "280px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c4dacd", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [cC, cH, cL, trait(k, "#e9f4ee33"), mentions], { fond: SAPIN2, gap: "36px 48px", aligne: "flex-start", padV: PAD("56px", "48px", "40px"), padB: PAD("24px", "20px", "20px"), padH: PAD("48px", "32px", "20px"), nom: "Contact" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [tete, liste, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-436 « Rayons de parapharmacie » — parapharmacie en ligne
// Idée : une GRILLE DE SIX RAYONS (Visage, Bébé et maman, Hygiène, Minceur et forme, Compléments, Vue et audition) en cartes carrées 3 × 2 sur ivoire : chaque carte se soulève et son filet corail s'étire.
// Au-dessus, titre serif et bouton « Voir la boutique » ; dessous une bande corail avec la lettre, puis coordonnées et horaires sur ivoire. Les rubriques sont des intitulés d'exemple.
// Polices : DM Serif Display (titres) et DM Sans.
const ivoire = identite({
  key: "c436", label: "Ivoire, corail et brun", humeur: "light",
  fond: "#f8f2e7", texte: "#2b1d16", discret: "#5c4a3f", accent: "#b23a1d", surface: "#ffffff", encre: "#2b1d16",
  police: "font.dm-sans", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#2b1d1633",
});
const IVOIRE = "#f8f2e7", CORAIL = "#b23a1d", BRUN = "#2b1d16";
const rayons = modeleV2({
  id: identifiantV2(436, "rayons-de-parapharmacie"), concept: "c-436-rayons-de-parapharmacie",
  name: "Rayons de parapharmacie", family: FAM,
  description: "Pour une parapharmacie en ligne : une grille de six rayons en cartes carrées qui se soulèvent, titre serif, bande corail pour la lettre puis contact et horaires. Ivoire, corail et brun, angles droits.",
  tags: ["parapharmacie", "grille de cartes", "rayons", "ivoire", "corail", "boutique", "serif", "angles droits"],
  identity: ivoire, racine: racineDe(BRUN), widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const titre = G.geant(`<p>Tous nos<br>rayons.</p>`, { taille: [48, 96], tablette: { taille: [64, 88] }, mobile: { taille: [48, 64] }, lh: 1.0, suivi: "-0.015em", poids: "400", police: S.head, couleur: BRUN })(k, env);
    const mot = texte(k, "Soins, hygiène, bien-être : choisissez un rayon et demandez conseil à l'équipe en cas de doute.", { max: "380px", taille: 17 });
    const btn = bouton(k, "Voir la boutique", "/boutique", { texte: "#ffffff", fond: CORAIL, soi: "flex-start", survol: { backgroundColor: BRUN, color: "#ffffff", transform: { y: -3 } }, focus: BRUN });
    const gauche = G.colonne(k, [caps(k, "Parapharmacie", { couleur: CORAIL, suivi: "0.22em" }), titre], { poids: 1, min: "300px", gap: "16px" });
    const droiteH = G.colonne(k, [mot, btn], { poids: 0.6, min: "260px", gap: "18px" });
    const entete = G.bande(k, [gauche, droiteH], { fond: IVOIRE, aligne: "flex-end", gap: "28px 56px", padV: PAD("84px", "64px", "44px"), padB: PAD("36px", "30px", "24px"), padH: PAD("48px", "32px", "20px"), nom: "Titre" });
    const R = [["Visage", "Soins et protection", "/boutique"], ["Bébé et maman", "Douceur au quotidien", "/boutique"], ["Hygiène", "Corps, bouche et cheveux", "/boutique"], ["Minceur et forme", "Équilibre et tonus", "/catalogue"], ["Compléments", "Cures et saisons", "/catalogue"], ["Vue et audition", "Conseil et accessoires", "/catalogue"]];
    const carteR = ([t, d, u], i) => {
      const barre = k.col([], { width: "36px", height: "4px", backgroundColor: CORAIL, borderRadius: "0px", transitionDuration: DOUX });
      barre.states = { hover: { width: "100%" } };
      const l = lien(k, t, u, { taille: 21, poids: "400", police: S.head, couleur: BRUN, survol: { color: CORAIL }, focus: CORAIL });
      const c = k.col([caps(k, `0${i + 1}`, { couleur: CORAIL, suivi: "0.16em" }), l, texte(k, d, { taille: 14.5 }), barre], { width: "100%", gap: "8px", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: "#2b1d1633", borderRadius: "0px", transitionDuration: DOUX, boxSizing: "border-box" });
      c.states = { hover: { transform: { y: -6 }, borderColor: CORAIL } };
      return c;
    };
    const ORDRE = [R[0], R[3], R[1], R[4], R[2], R[5]];
    const pile = (a) => G.colonne(k, a.map((x) => carteR(x, ORDRE.indexOf(x))), { poids: 1, min: "220px", gap: "14px", aligne: "stretch" });
    const haut = G.bande(k, [pile([R[0], R[3]]), pile([R[1], R[4]]), pile([R[2], R[5]])], { fond: IVOIRE, aligne: "flex-start", gap: "14px", padV: PAD("8px", "8px", "4px"), padB: PAD("64px", "52px", "40px"), padH: PAD("48px", "32px", "20px"), nom: "Rayons" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Nouveautés des rayons et conseils de saison, par courriel.", largeur: "520px", accent: "#ffffff", surBouton: CORAIL, texte: "#ffffff", couleurTitre: "#ffffff", fond: CORAIL, survolBouton: BRUN, survolTexte: "#ffffff", focus: "#ffffff" });
    const bandeCorail = G.bande(k, [G.colonne(k, [caps(k, "Restez informé", { couleur: "#ffffff", suivi: "0.2em" }), G.geant(`<p>Un courriel utile,<br>pas plus.</p>`, { taille: [28, 44], mobile: { taille: [26, 34] }, lh: 1.1, suivi: "-0.01em", poids: "400", police: S.head, couleur: "#ffffff" })(k, env)], { poids: 1, min: "260px", gap: "12px" }), G.colonne(k, [abo], { poids: 1.2, min: "280px" })], { fond: CORAIL, aligne: "center", gap: "28px 56px", padV: PAD("56px", "48px", "36px"), padH: PAD("48px", "32px", "20px"), nom: "Lettre" });
    const pt = souffle(carre(k, CORAIL, "10px"), 3200);
    const cc = bloc(k, "Coordonnées", [coordonnees(k, { lien: BRUN, survol: CORAIL, focus: CORAIL })], { couleurTitre: CORAIL });
    const ch = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: CORAIL })], { gap: "10px", alignItems: "center" }), horaires(k, {})], { poids: 1, min: "220px", gap: "12px" });
    const cl = listeLiens(k, "À savoir", [["Conseils santé", "/blog"], ["Questions fréquentes", "/faq"], ["Mon compte", "/boutique/compte"], ["Haut de page ↑", "#haut"]], { couleur: BRUN, accent: CORAIL, couleurTitre: CORAIL });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true })(k, env);
    const bas = G.bande(k, [G.ligne(k, [cc, ch, cl], { gap: "36px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" }), trait(k, S.line), mentions], { fond: IVOIRE, colonne: true, gap: "32px", padV: PAD("56px", "48px", "40px"), padB: PAD("24px", "20px", "20px"), padH: PAD("48px", "32px", "20px"), innerMobile: { rowGap: "26px" }, nom: "Contact" });
    return [G.racine(k, [entete, haut, bandeCorail, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-437 « Horaires de l'officine » — officine pour qui l'ouverture est l'information n°1
// Idée : une BARRE LATÉRALE. À gauche, un grand panneau bleu pâle à angles droits porte « Horaires » avec statut qui respire, le widget d'horaires en grand et le téléphone ; à droite, sur bleu nuit, un bandeau
// d'appel (« Une urgence ? Contactez l'officine ») puis deux rangées de liens en trois colonnes (Officine, Boutique, Aide) et la lettre. Les liens glissent ; le panneau se soulève.
// Polices : Barlow Condensed (titres en capitales) et Barlow.
const nuit = identite({
  key: "c437", label: "Bleu nuit, ciel et blanc", humeur: "dark",
  fond: "#0e2340", texte: "#eaf2fc", discret: "#adc2dc", accent: "#8ecbff", surface: "#14305a", encre: "#0e2340", surEncre: "#eaf2fc",
  police: "font.barlow", titres: "font.barlow-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#eaf2fc40",
});
const NUIT = "#0e2340", NUIT2 = "#0a1a30", CIEL = "#8ecbff", PALE = "#e6f0fb";
const horairesOfficine = modeleV2({
  id: identifiantV2(437, "horaires-de-l-officine"), concept: "c-437-horaires-de-l-officine",
  name: "Horaires de l'officine", family: FAM,
  description: "Pour une officine dont l'essentiel est l'ouverture : un grand panneau latéral pâle (horaires, contact), un bandeau d'appel et trois colonnes de liens sur bleu nuit, la lettre. Bleu nuit, ciel et blanc, angles droits.",
  tags: ["pharmacie", "horaires", "barre latérale", "bandeau d'appel", "bleu nuit", "capitales", "angles droits"],
  identity: nuit, racine: racineDe(NUIT2), widgets: ["sitetitle", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const pt = souffle(carre(k, "#0e2340", "12px"), 3000);
    const ttl = G.geant(`<p>Horaires<br>d'ouverture</p>`, { taille: [40, 68], tablette: { taille: [48, 60] }, mobile: { taille: [38, 48] }, lh: 1.0, suivi: "0em", poids: "700", police: S.head, couleur: NUIT, extra: { textTransform: "uppercase" } })(k, env);
    const nom = nomDuSite(k, env, 20, "#0e2340", { fontFamily: S.head, textTransform: "uppercase", letterSpacing: "0.06em" });
    const panneau = k.col([k.row([pt, caps(k, "Cette semaine", { couleur: "#1a4f8a" })], { gap: "10px", alignItems: "center" }), ttl, horaires(k, { couleur: NUIT, taille: 16 }), trait(k, "#0e234044"), caps(k, "Coordonnées", { couleur: "#1a4f8a" }), coordonnees(k, { couleur: NUIT, lien: "#1a4f8a", survol: NUIT, focus: NUIT, taille: 16 }), trait(k, "#0e234044"), nom],
      { flexGrow: 1, flexBasis: "0px", minWidth: "300px", gap: "16px", backgroundColor: PALE, borderRadius: "0px", boxSizing: "border-box", paddingTop: "44px", paddingBottom: "44px", paddingLeft: "40px", paddingRight: "40px", transitionDuration: DOUX }, undefined, { minWidth: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "32px", paddingBottom: "32px" });
    panneau.states = { hover: { transform: { y: -4 } } };
    const appel = k.row([G.colonne(k, [caps(k, "Besoin d'aide ?", { couleur: CIEL, suivi: "0.2em" }), k.T("<p>Une urgence ? Contactez l'officine.</p>", { fontSize: "26px", lineHeight: 1.2, fontWeight: "600", color: "#ffffff", fontFamily: S.head })], { poids: 2, min: "220px", gap: "8px" }), bouton(k, "Nous contacter", "/contact", { texte: NUIT, fond: CIEL, survol: { backgroundColor: "#ffffff", color: NUIT, transform: { x: 6 } }, focus: "#ffffff" })], { gap: "20px 32px", alignItems: "center", justifyContent: "space-between", width: "100%", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "32px", paddingRight: "32px", borderStyle: "solid", borderWidth: "2px", borderColor: CIEL, borderRadius: "0px", boxSizing: "border-box" }, undefined, { paddingLeft: "20px", paddingRight: "20px" });
    const opt = { couleur: "#ffffff", accent: CIEL, couleurTitre: CIEL, taille: 16, min: "150px" };
    const cols = G.ligne(k, [
      listeLiens(k, "Officine", [["Accueil", "/"], ["Conseils santé", "/blog"], ["Contact", "/contact"]], opt),
      listeLiens(k, "Boutique", [["Parapharmacie", "/boutique"], ["Catalogue", "/catalogue"], ["Panier", "/boutique/panier"]], opt),
      listeLiens(k, "Aide", [["Questions fréquentes", "/faq"], ["Mon compte", "/boutique/compte"], ["Espace client", "/connexion"]], opt),
    ], { gap: "28px 40px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Nouveautés et jours de changement d'horaires, par courriel.", largeur: "460px", accent: CIEL, surBouton: NUIT, texte: "#eaf2fc", couleurTitre: "#ffffff", fond: NUIT, survolBouton: "#ffffff", survolTexte: NUIT, focus: "#ffffff" });
    const droite = G.colonne(k, [appel, cols, trait(k, "#eaf2fc33"), abo], { poids: 7, min: "320px", gap: "36px", aligne: "stretch" });
    const corps = G.bande(k, [G.colonne(k, [panneau], { poids: 4, min: "300px", aligne: "stretch" }), droite], { fond: NUIT, aligne: "stretch", gap: "48px 64px", padV: PAD("80px", "60px", "40px"), padB: PAD("64px", "48px", "36px"), padH: PAD("48px", "32px", "20px"), nom: "Panneau" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#c4d4ea", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [mentions], { fond: NUIT2, colonne: true, padV: PAD("24px", "22px", "18px"), padH: PAD("48px", "32px", "20px"), nom: "Mentions" });
    bas.styles.desktop.color = "#ffffff";
    return [G.racine(k, [corps, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-438 « Le conseil du pharmacien » — officine qui répond aux questions
// Idée : DEUX PANNEAUX bord à bord. À gauche, aplat sarcelle profond : « Une question ? Demandez conseil. » en grand serif et quatre rangées de questions fréquentes (intitulés d'exemple) qui glissent et
// s'éclairent ; à droite, sur blanc : liens en deux colonnes, coordonnées, horaires et lettre. Barre sarcelle fine pour les mentions.
// Polices : Newsreader (titres) et Karla.
const sarcelle = identite({
  key: "c438", label: "Sarcelle, blanc et sable", humeur: "light",
  fond: "#ffffff", texte: "#10302f", discret: "#40605e", accent: "#0f6b66", surface: "#eef6f4", encre: "#10302f",
  police: "font.karla", titres: "font.newsreader",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#10302f33",
});
const SARC = "#0c4a47", SARC2 = "#0f5c58", SABLE = "#f2e8d5", TEXTE2 = "#10302f";
const conseilPharmacien = modeleV2({
  id: identifiantV2(438, "le-conseil-du-pharmacien"), concept: "c-438-le-conseil-du-pharmacien",
  name: "Le conseil du pharmacien", family: FAM,
  description: "Pour une officine qui répond aux questions : un grand panneau sarcelle (titre serif et quatre questions fréquentes qui glissent) face à un panneau blanc (liens, contact, horaires, lettre). Sarcelle, blanc et sable.",
  tags: ["pharmacie", "questions fréquentes", "deux panneaux", "sarcelle", "serif", "conseil", "angles droits"],
  identity: sarcelle, racine: racineDe(SARC), widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = G.geant(`<p>Une question ?<br>Demandez<br>conseil.</p>`, { taille: [44, 84], tablette: { taille: [60, 76] }, mobile: { taille: [42, 56] }, lh: 1.02, suivi: "-0.015em", poids: "500", police: S.head, couleur: "#ffffff" })(k, env);
    const Q = [["Comment renouveler mon ordonnance ?", "/faq"], ["Puis-je commander en ligne ?", "/faq"], ["Comment suivre ma commande ?", "/boutique/compte"], ["Un conseil sur un produit ?", "/contact"]];
    const rang = ([t, u]) => {
      const l = lien(k, t, u, { taille: 18, poids: "600", couleur: "#ffffff", survol: { color: SABLE }, focus: SABLE, h: "56px", extra: { flexGrow: 1 } });
      const r = k.row([l, k.T("<p>→</p>", { fontSize: "18px", color: SABLE, lineHeight: 1, fontFamily: S.font })], { flexWrap: "nowrap", alignItems: "center", gap: "12px", width: "100%", paddingLeft: "0px", paddingRight: "14px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#ffffff55", borderRadius: "0px", backgroundColor: SARC, transitionDuration: DOUX });
      r.states = { hover: { backgroundColor: SARC2, paddingLeft: "16px" } };
      return r;
    };
    const faq = k.col(Q.map(rang), { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#ffffff55" });
    const btn = bouton(k, "Poser ma question", "/contact", { texte: SARC, fond: SABLE, soi: "flex-start", survol: { backgroundColor: "#ffffff", color: SARC, transform: { x: 6 } }, focus: "#ffffff" });
    const gauche = G.colonne(k, [caps(k, "Équipe officinale", { couleur: SABLE, suivi: "0.2em" }), titre, btn], { poids: 5, min: "320px", gap: "26px" });
    const droite = G.colonne(k, [caps(k, "Questions fréquentes", { couleur: SABLE, suivi: "0.2em" }), faq], { poids: 6, min: "340px", gap: "14px", aligne: "stretch" });
    const haut = G.bande(k, [gauche, droite], { fond: SARC, aligne: "flex-end", gap: "40px 72px", padV: PAD("88px", "68px", "48px"), padB: PAD("72px", "56px", "40px"), padH: PAD("48px", "32px", "20px"), nom: "Conseil" });
    const l1 = listeLiens(k, "Officine", [["Accueil", "/"], ["Conseils santé", "/blog"], ["Contact", "/contact"]], { couleur: TEXTE2, accent: "#0f6b66", couleurTitre: "#0f6b66", min: "150px" });
    const l2 = listeLiens(k, "Boutique", [["Parapharmacie", "/boutique"], ["Panier", "/boutique/panier"], ["Mon compte", "/boutique/compte"]], { couleur: TEXTE2, accent: "#0f6b66", couleurTitre: "#0f6b66", min: "150px" });
    const pt = souffle(carre(k, "#0f6b66", "10px"), 3200);
    const cc = G.colonne(k, [caps(k, "Coordonnées", { couleur: "#0f6b66" }), coordonnees(k, { lien: TEXTE2, survol: "#0f6b66", focus: "#0f6b66" })], { poids: 1.3, min: "220px", gap: "12px" });
    const ch = G.colonne(k, [k.row([pt, caps(k, "Horaires", { couleur: "#0f6b66" })], { gap: "10px", alignItems: "center" }), horaires(k, {})], { poids: 1.3, min: "220px", gap: "12px" });
    const abo = lettre(k, env, G, { titre: "Lettre d'information", intro: "Les conseils de l'équipe, par courriel.", largeur: "100%", accent: "#0f6b66", surBouton: "#ffffff", texte: TEXTE2, couleurTitre: "#0f6b66", fond: SABLE, survolBouton: TEXTE2, survolTexte: "#ffffff", focus: TEXTE2, fondChamp: "#ffffff" });
    const encart = k.col([abo], { flexGrow: 1.6, flexBasis: "0px", minWidth: "280px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: SABLE, borderRadius: "0px", boxSizing: "border-box" });
    const bandeBlanche = G.bande(k, [G.ligne(k, [G.ligne(k, [l1, l2], { gap: "28px 36px", aligne: "flex-start" }), cc, ch], { gap: "36px 44px", aligne: "flex-start", justifie: "space-between", largeur: "100%" }), encart], { fond: "#ffffff", colonne: true, aligne: "stretch", gap: "40px", padV: PAD("64px", "52px", "40px"), padB: PAD("56px", "44px", "36px"), padH: PAD("48px", "32px", "20px"), nom: "Contact" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d3e4e2", liens: "#ffffff" })(k, env);
    const barre = G.bande(k, [mentions], { fond: SARC, colonne: true, padV: PAD("24px", "22px", "18px"), padH: PAD("48px", "32px", "20px"), nom: "Mentions" });
    barre.styles.desktop.color = "#ffffff";
    return [G.racine(k, [haut, bandeBlanche, barre])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Pharmacie et parapharmacie", target: 5, built: true,
  description: "Pieds d'officine et de parapharmacie, standard et pros, sans illustration : bandeau d'appel, sommaire d'ordonnance, grille de rayons, panneau d'horaires, questions du pharmacien. Angles droits.",
  models: [comptoir, ordonnance, rayons, horairesOfficine, conseilPharmacien],
};
