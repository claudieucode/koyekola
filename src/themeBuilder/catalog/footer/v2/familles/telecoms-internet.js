// Famille v2 « Télécoms et accès internet » — 5 modèles (ft2-459 à ft2-463), extension « standard pro animé » (angles droits, sans illustration).
// Pieds de fournisseur d'accès à internet, d'opérateur mobile, de service d'assistance, d'opérateur local et d'opérateur pour entreprises : offres, assistance, éligibilité, raccordement, espace client,
// coordonnées et horaires, lettre d'information, mentions. Aucun débit, prix, couverture ni chiffre inventé : seules les « Données de l'entreprise » fournissent adresse, téléphone, e-mail et horaires.
// Marques fictives. Chaque modèle a son squelette, sa palette et ses polices (mode « solo »).
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; cartes qui se soulèvent ; lignes dont le fond s'éclaire ; flèches qui avancent ; carré de statut qui « respire ».
// Aucune animation d'entrée, aucun défilement continu. ANGLES DROITS partout.
const { modeleV2, identifiantV2 } = require("../kit-v2");
const { sty } = require("../../../kit");
const A = require("../aides-std-s03");
const { MV, racineDe, lien, caps, texte, trait, court, souffle, carre, horaires, coordonnees, bloc, liensCol, abonnement, carteLien, ligneIndex, bouton, dernier, identite } = A;

const FAM = "telecoms-internet";
const PAD = ["48px", "32px", "20px"];

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-459 « Fibre ouverte » — fournisseur d'accès à internet
// Idée : nuit violette. Grand bandeau d'éligibilité « Votre adresse est-elle raccordable ? » avec bouton plein et carré qui respire ; puis quatre colonnes (Offres, Assistance, Espace client, Société) à filet
// qui s'illumine ; lettre et mentions. Polices : Space Grotesk (titres) et Inter.
const fibre = identite({ key: "s459", label: "Nuit violette et menthe", humeur: "dark", fond: "#130c2e", texte: "#f1eefc", discret: "#b6aedc", accent: "#5eead4", surface: "#1d1442", encre: "#130c2e", surEncre: "#f1eefc", police: "font.inter", titres: "font.space-grotesk", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f1eefc30" });
const fibreModele = modeleV2({
  id: identifiantV2(459, "fibre-ouverte"), concept: "c-459-fibre-ouverte", name: "Fibre ouverte", family: FAM,
  description: "Pour un fournisseur d'accès à internet : bandeau d'éligibilité sur nuit violette avec bouton plein, quatre colonnes (offres, assistance, espace client, société) à filet qui s'illumine, lettre et mentions.",
  tags: ["fibre", "internet", "fournisseur d'accès", "violet", "éligibilité", "sombre", "angles droits"],
  identity: fibre, racine: racineDe("#130c2e"),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "bizhours", "bizcontact"],
  compose(k, env, G) {
    const S = k.S, NUIT = "#130c2e", NUIT2 = "#1d1442", MENTHE = "#5eead4", BLANC = "#f1eefc";
    const statut = souffle(carre(k, MENTHE, "12px"), 3200);
    const phrase = G.geant(`<p>Votre adresse est-elle<br>raccordable à la fibre ?</p>`, { taille: [36, 88], tablette: { taille: [52, 76] }, mobile: { taille: [34, 48] }, lh: 1.04, suivi: "-0.03em", poids: "700", police: S.head, couleur: BLANC })(k, env);
    const gauche = G.colonne(k, [k.row([statut, caps(k, "Test d'éligibilité", { couleur: MENTHE, suivi: "0.22em" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" }), phrase], { poids: 7, min: "300px", gap: "20px" });
    const bt = bouton(k, "Tester mon adresse", "/contact", { couleur: NUIT, fond: MENTHE, survolFond: BLANC, survolCouleur: NUIT });
    const intro = texte(k, "Indiquez votre adresse : nous vérifions pour vous et vous répondons avec les offres disponibles.", { taille: 16, couleur: S.mute, largeur: "400px" });
    const droite = G.colonne(k, [intro, bt], { poids: 5, min: "280px", gap: "22px", soi: "flex-end" });
    const haut = G.bande(k, [gauche, droite], { fond: NUIT, gap: "40px 72px", aligne: "flex-end", padV: ["96px", "72px", "52px"], padB: ["64px", "52px", "40px"], padH: PAD, nom: "Éligibilité" });
    const col = (t, l, P) => bloc(k, t, liensCol(k, l, { taille: 15, poids: "500", accent: MENTHE }), { couleurTitre: MENTHE, min: "170px", poids: P, extra: { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: "#f1eefc40", paddingTop: "16px", transitionDuration: MV } });
    const colonnes = G.ligne(k, [col("Offres", [["Nos offres internet", "/catalogue"], ["Fibre", "/catalogue"], ["Options et services", "/catalogue"]], 1.4), col("Assistance", [["Questions fréquentes", "/faq"], ["Nous contacter", "/contact"], ["Guides pratiques", "/blog"]], 1.1), col("Espace client", [["Se connecter", "/connexion"], ["Créer mon compte", "/inscription"]], 0.8), col("Société", [["Accueil", "/"], ["Actualités", "/blog"], ["Contact", "/contact"]], 0.9)], { gap: "32px 40px", aligne: "flex-start", largeur: "100%" });
    const milieu = G.bande(k, [colonnes], { fond: NUIT2, colonne: true, padV: ["56px", "48px", "40px"], padB: ["56px", "48px", "40px"], padH: PAD, nom: "Colonnes" });
    const abo = abonnement(k, env, { titre: "Lettre du réseau", intro: "Informations pratiques et nouveautés, sans excès.", bouton: "S'abonner", largeur: "380px", accent: MENTHE, texte: BLANC, couleurTitre: MENTHE, couleurIntro: "#b6aedc", survolBouton: BLANC, survolTexte: NUIT, surBouton: NUIT });
    const cCoo = bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, lien: BLANC, survol: MENTHE, focus: MENTHE })], { couleurTitre: MENTHE, gap: "12px", min: "200px", poids: 1 });
    const cHor = bloc(k, "Horaires de l'assistance", [horaires(k, { taille: 15 })], { couleurTitre: MENTHE, gap: "12px", min: "200px", poids: 1 });
    const mentions = A.legale(k, env, G, { couleur: "#b6aedc", liens: BLANC });
    const contact = G.bande(k, [G.colonne(k, [G.ligne(k, [cCoo, cHor], { gap: "28px 40px", aligne: "flex-start", largeur: "100%" })], { poids: 5, min: "300px" }), G.colonne(k, [abo], { poids: 4, min: "280px" })], { fond: NUIT, gap: "40px 72px", aligne: "flex-start", padV: ["48px", "40px", "36px"], padB: ["32px", "28px", "24px"], padH: PAD, nom: "Contact" });
    const bas = dernier(G.bande(k, [mentions], { fond: NUIT, colonne: true, padV: ["24px", "20px", "20px"], padB: ["28px", "24px", "20px"], padH: PAD, filetHaut: { epaisseur: "1px", couleur: "#f1eefc30" }, nom: "Mentions" }), BLANC);
    return [G.racine(k, [haut, milieu, contact, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-460 « Forfaits en grille » — opérateur mobile
// Idée : jaune franc et noir. À gauche un grand titre noir « Le mobile, simplement. » et le contact ; à droite une grille 2 x 2 de gros blocs noirs (Forfaits, Mobiles, Options, Assistance) qui se soulèvent et
// virent au blanc au survol. Barre basse noire : liens, lettre, mentions. Polices : Archivo Black (titres) et Work Sans.
const mobile = identite({ key: "s460", label: "Jaune franc et noir", humeur: "light", fond: "#ffd400", texte: "#111111", discret: "#3d3a2c", accent: "#111111", surface: "#ffffff", encre: "#111111", police: "font.work-sans", titres: "font.archivo-black", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#11111133" });
const mobileModele = modeleV2({
  id: identifiantV2(460, "forfaits-en-grille"), concept: "c-460-forfaits-en-grille", name: "Forfaits en grille", family: FAM,
  description: "Pour un opérateur mobile : jaune franc et noir, grand titre et contact à gauche, grille 2 x 2 de blocs noirs (forfaits, mobiles, options, assistance) qui se soulèvent, barre basse avec lettre. Franc, graphique.",
  tags: ["mobile", "opérateur", "forfaits", "jaune", "noir", "grille", "angles droits"],
  identity: mobile, racine: racineDe("#ffd400"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, JAUNE = "#ffd400", NOIR = "#111111";
    const titre = G.geant(`<p>Le mobile,<br>simplement.</p>`, { taille: [36, 64], tablette: { taille: [52, 72] }, mobile: { taille: [36, 48] }, lh: 1.02, suivi: "-0.03em", poids: "400", police: S.head, couleur: NOIR })(k, env);
    const gauche = G.colonne(k, [caps(k, "Opérateur mobile", { couleur: NOIR, suivi: "0.22em" }), titre, court(k, NOIR, "6px", "72px"), coordonnees(k, { taille: 15, couleur: NOIR, lien: NOIR, survol: "#5c4a00", focus: NOIR }), horaires(k, { taille: 15, couleur: NOIR })], { poids: 5, min: "300px", gap: "22px" });
    const bloc2 = (n, t, s, u) => {
      const tl = k.LINK(t, u, { fontFamily: S.head, fontSize: "26px", fontWeight: "400", color: JAUNE, textDecoration: "none", lineHeight: 1.1, display: "flex", alignItems: "center", minHeight: "44px", transitionDuration: MV });
      GK2.fini(k, tl, { hover: { color: "#ffffff", textDecoration: "underline" }, focus: GK2.focus(JAUNE) });
      const c = k.col([caps(k, n, { couleur: JAUNE, suivi: "0.2em" }), tl, texte(k, s, { taille: 14, couleur: "#e6e0c0", lh: 1.5 })], { flexGrow: 1, flexBasis: "240px", minWidth: "220px", gap: "10px", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "28px", paddingRight: "28px", backgroundColor: NOIR, borderRadius: "0px", transitionDuration: MV });
      c.states = { hover: { transform: { y: -6 }, backgroundColor: "#262626" } };
      return c;
    };
    const grille = G.ligne(k, [bloc2("01", "Forfaits", "Trouvez le forfait adapté à votre usage.", "/catalogue"), bloc2("02", "Mobiles", "Choisissez votre téléphone.", "/boutique"), bloc2("03", "Options", "Ajoutez ce dont vous avez besoin.", "/catalogue"), bloc2("04", "Assistance", "Aide, guides, contact.", "/faq")], { gap: "16px", aligne: "stretch", largeur: "100%" });
    const droite = G.colonne(k, [grille], { poids: 7, min: "300px" });
    const haut = G.bande(k, [gauche, droite], { fond: JAUNE, gap: "48px 56px", aligne: "stretch", padV: ["88px", "72px", "48px"], padB: ["72px", "56px", "40px"], padH: PAD, nom: "Grille" });
    const abo = abonnement(k, env, { titre: "Lettre mobile", intro: "Les nouveautés, une fois par mois au plus.", bouton: "S'abonner", largeur: "380px", accent: JAUNE, texte: "#ffffff", couleurTitre: JAUNE, couleurIntro: "#e6e0c0", survolBouton: "#ffffff", survolTexte: NOIR, surBouton: NOIR });
    const liens = G.ligne(k, liensCol(k, [["Espace client", "/connexion"], ["Créer mon compte", "/inscription"], ["Questions fréquentes", "/faq"], ["Actualités", "/blog"]], { taille: 15, couleur: "#ffffff", accent: JAUNE }), { gap: "0px 28px", aligne: "flex-start" });
    const mentions = A.legalePile(k, env, G, { couleur: "#e6e0c0", liens: "#ffffff" });
    const bas = dernier(G.bande(k, [G.ligne(k, [G.colonne(k, [liens, mentions], { poids: 3, min: "280px", gap: "20px" }), G.colonne(k, [abo], { poids: 2, min: "280px" })], { gap: "28px 56px", aligne: "flex-start", largeur: "100%" })], { fond: NOIR, colonne: true, gap: "28px", padV: ["40px", "36px", "32px"], padB: ["28px", "24px", "20px"], padH: PAD, innerMobile: { rowGap: "24px" }, nom: "Barre" }), "#ffffff");
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-461 « Assistance dégagée » — centre d'aide et d'assistance d'un opérateur
// Idée : une BARRE LATÉRALE bleue « Besoin d'aide ? » (carré de statut qui respire, coordonnées, horaires, bouton) à gauche ; à droite, sur gris bleuté, trois rubriques d'aide numérotées en police à chasse fixe
// (Connexion, Facture et compte, Matériel) puis lettre. Polices : IBM Plex Mono (étiquettes) et IBM Plex Sans.
const aide = identite({ key: "s461", label: "Bleu et gris bleuté", humeur: "light", fond: "#eef2f9", texte: "#0d2147", discret: "#43557a", accent: "#0b4fcf", surface: "#ffffff", encre: "#0d2147", police: "font.ibm-plex-sans", titres: "font.ibm-plex-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#0d214733" });
const aideModele = modeleV2({
  id: identifiantV2(461, "assistance-degagee"), concept: "c-461-assistance-degagee", name: "Assistance dégagée", family: FAM,
  description: "Pour l'assistance d'un opérateur : barre latérale bleue « besoin d'aide ? » avec coordonnées, horaires et bouton, trois rubriques d'aide numérotées en police à chasse fixe sur gris bleuté, lettre. Technique, clair.",
  tags: ["assistance", "support", "opérateur", "bleu", "barre latérale", "chasse fixe", "angles droits"],
  identity: aide, racine: racineDe("#eef2f9"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, BLEU = "#0b4fcf", MARINE = "#0a2a66", CIEL = "#b9d0fb", ENCRE = "#0d2147";
    const statut = souffle(carre(k, CIEL, "12px"), 3600);
    const rub = (num, t, liste, P) => G.colonne(k, [caps(k, num, { couleur: BLEU, police: S.head, taille: "13px", suivi: "0.12em" }), k.T(`<p>${t}</p>`, { fontFamily: S.head, fontSize: "22px", fontWeight: "600", color: ENCRE, lineHeight: 1.2 }), ...liensCol(k, liste, { taille: 15, accent: BLEU, couleur: ENCRE })], { poids: P, min: "190px", gap: "6px", extra: { borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: BLEU, paddingTop: "16px" } });
    const rubriques = G.ligne(k, [rub("[01]", "Connexion", [["Guides pratiques", "/blog"], ["Questions fréquentes", "/faq"], ["Signaler un souci", "/contact"]], 1.2), rub("[02]", "Facture et compte", [["Espace client", "/connexion"], ["Créer mon compte", "/inscription"], ["Nous écrire", "/contact"]], 1), rub("[03]", "Matériel", [["Équipements", "/boutique"], ["Options", "/catalogue"], ["Accueil", "/"]], 0.85)], { gap: "28px 40px", aligne: "flex-start", largeur: "100%" });
    const rangRub = G.bande(k, [rubriques], { fond: "#eef2f9", colonne: true, padV: ["72px", "56px", "44px"], padB: ["56px", "44px", "36px"], padH: PAD, nom: "Rubriques" });
    const titre = G.geant(`<p>Besoin<br>d'aide ?</p>`, { taille: [44, 84], tablette: { taille: [60, 80] }, mobile: { taille: [44, 60] }, lh: 1.0, suivi: "-0.04em", poids: "600", police: S.head, couleur: "#ffffff" })(k, env);
    const bt = bouton(k, "Écrire à l'assistance", "/contact", { couleur: MARINE, fond: "#ffffff", survolFond: CIEL, survolCouleur: MARINE });
    const cA = G.colonne(k, [k.row([statut, caps(k, "Assistance", { couleur: CIEL, suivi: "0.2em", police: S.head })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" }), titre], { poids: 2, min: "260px", gap: "18px" });
    const cB = G.colonne(k, [caps(k, "Nous joindre", { couleur: CIEL, police: S.head }), coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: CIEL, focus: CIEL })], { poids: 1.3, min: "240px", gap: "14px" });
    const cC = G.colonne(k, [caps(k, "Horaires", { couleur: CIEL, police: S.head }), horaires(k, { taille: 15, couleur: "#ffffff" }), bt], { poids: 1.3, min: "240px", gap: "14px" });
    const bandeur = G.bande(k, [cA, cB, cC], { fond: MARINE, gap: "36px 48px", aligne: "flex-start", padV: ["72px", "56px", "44px"], padB: ["64px", "52px", "40px"], padH: PAD, nom: "Besoin d'aide" });
    const abo = abonnement(k, env, { titre: "Lettre de l'assistance", intro: "Conseils et informations de service, rarement.", bouton: "S'abonner", largeur: "400px", accent: BLEU, texte: ENCRE, couleurTitre: BLEU, couleurIntro: "#43557a", survolBouton: ENCRE, survolTexte: "#ffffff", surBouton: "#ffffff", fondChamp: "#ffffff", police: S.head });
    const mentions = A.legalePile(k, env, G, { couleur: "#43557a", liens: ENCRE });
    const bas = G.bande(k, [abo, mentions], { fond: "#eef2f9", gap: "32px 64px", aligne: "flex-end", padV: ["48px", "40px", "36px"], padB: ["28px", "24px", "20px"], padH: PAD, nom: "Lettre" });
    return [G.racine(k, [rangRub, bandeur, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-462 « Étapes de raccordement » — opérateur local et raccordement
// Idée : fond blanc, vert forêt. Trois grandes ÉTAPES numérotées 01, 02, 03 (Vérifier l'éligibilité, Choisir une offre, Suivre l'installation) séparées par des filets verticaux, chacune un lien dont le numéro
// glisse ; puis une rangée de liens, coordonnées, horaires et lettre ; barre basse verte. Polices : Sora (titres) et Manrope.
const etapes = identite({ key: "s462", label: "Blanc et vert forêt", humeur: "light", fond: "#ffffff", texte: "#10261b", discret: "#4a5f54", accent: "#0a6b3a", surface: "#eef6f0", encre: "#10261b", police: "font.manrope", titres: "font.sora", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#10261b33" });
const etapesModele = modeleV2({
  id: identifiantV2(462, "etapes-de-raccordement"), concept: "c-462-etapes-de-raccordement", name: "Étapes de raccordement", family: FAM,
  description: "Pour un opérateur local : trois grandes étapes numérotées (éligibilité, offre, installation) séparées par des filets, rangée de liens, coordonnées, horaires et lettre sur blanc et vert forêt. Pédagogique, aéré.",
  tags: ["opérateur local", "raccordement", "étapes", "vert", "blanc", "numéros", "angles droits"],
  identity: etapes, racine: racineDe("#ffffff"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, VERT = "#0a6b3a", FORET = "#0b3b24", ENCRE = "#10261b", MENTHE = "#d9efe1";
    const etape = (n, t, s, u, dernier2) => {
      const num = k.T(`<p>${n}</p>`, { fontFamily: S.head, fontSize: "fluid:56-96", lineHeight: 1, fontWeight: "300", color: VERT, transitionDuration: MV });
      const tl = lien(k, `${t}   →`, u, { taille: 20, poids: "700", police: S.head, couleur: ENCRE, survol: { color: VERT, transform: { x: 6 } }, focus: VERT });
      const c = k.col([num, tl, texte(k, s, { taille: 15, couleur: S.mute, largeur: "300px" })], { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "10px", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "32px", paddingRight: "24px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: dernier2 === "premier" ? "0px" : "1px", borderColor: "#10261b33", transitionDuration: MV, backgroundColor: "#ffffff" }, undefined, { paddingLeft: "0px", borderLeftWidth: "0px", borderTopWidth: "1px", paddingTop: "20px" });
      c.states = { hover: { backgroundColor: MENTHE } };
      return c;
    };
    const ligneEtapes = G.ligne(k, [etape("01", "Vérifier l'éligibilité", "Dites-nous votre adresse : nous contrôlons ce qui est disponible.", "/contact", "premier"), etape("02", "Choisir une offre", "Comparez nos offres et sélectionnez celle qui vous convient.", "/catalogue"), etape("03", "Suivre l'installation", "Retrouvez l'avancement de votre raccordement dans votre espace.", "/connexion")], { gap: "0px", aligne: "stretch", largeur: "100%" });
    const haut = G.bande(k, [caps(k, "Raccordement en trois étapes", { couleur: VERT, suivi: "0.22em" }), trait(k, ENCRE, "3px"), ligneEtapes], { fond: "#ffffff", colonne: true, gap: "24px", padV: ["80px", "64px", "44px"], padB: ["56px", "48px", "40px"], padH: PAD, nom: "Étapes" });
    const liensRang = G.ligne(k, liensCol(k, [["Nos offres", "/catalogue"], ["Espace client", "/connexion"], ["Questions fréquentes", "/faq"], ["Actualités", "/blog"], ["Nous contacter", "/contact"]], { taille: 15, poids: "700", accent: VERT, couleur: ENCRE }), { gap: "0px 32px", aligne: "center", largeur: "100%" });
    const c1 = bloc(k, "Coordonnées", [coordonnees(k, { taille: 15, lien: ENCRE, survol: VERT, focus: VERT })], { couleurTitre: VERT, gap: "12px", poids: 1.1 });
    const c2 = bloc(k, "Horaires", [horaires(k, { taille: 15 })], { couleurTitre: VERT, gap: "12px", poids: 1.1 });
    const abo = abonnement(k, env, { titre: "Lettre du réseau", intro: "Avancement des travaux et conseils, rarement.", bouton: "S'abonner", largeur: "360px", accent: VERT, texte: ENCRE, couleurTitre: VERT, couleurIntro: "#4a5f54", survolBouton: ENCRE, survolTexte: "#ffffff", surBouton: "#ffffff" });
    const grille = G.ligne(k, [c1, c2, G.colonne(k, [abo], { poids: 1.5, min: "260px" })], { gap: "36px 56px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const milieu = G.bande(k, [liensRang, grille], { fond: "#eef6f0", colonne: true, gap: "40px", padV: ["48px", "40px", "36px"], padB: ["48px", "40px", "36px"], padH: PAD, filetHaut: { epaisseur: "1px", couleur: "#10261b33" }, innerMobile: { rowGap: "28px" }, nom: "Liens" });
    const mentions = A.legale(k, env, G, { taille: 13, sansCookies: true, couleur: "#cfe6d8", liens: "#ffffff" });
    const bas = dernier(G.bande(k, [mentions], { fond: FORET, colonne: true, gap: "0px", padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: PAD, nom: "Mentions" }), "#ffffff");
    return [G.racine(k, [haut, milieu, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-463 « Ligne entreprise » — opérateur télécoms pour entreprises
// Idée : anthracite et orange. À gauche, double rangée de liens : solutions (Téléphonie, Internet pro, Réseau, Mobilité : grandes lignes à flèche) et ressources ; à droite, encadré orange « Parler à un conseiller »
// (téléphone, horaires, bouton). Barre basse : lettre et mentions. Polices : Barlow Condensed (titres) et Barlow.
const ligneE = identite({ key: "s463", label: "Anthracite et orange", humeur: "dark", fond: "#1b1e23", texte: "#f2f3f5", discret: "#aeb4bd", accent: "#ff8a2b", surface: "#262a31", encre: "#1b1e23", surEncre: "#f2f3f5", police: "font.barlow", titres: "font.barlow-condensed", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#f2f3f530" });
const ligneModele = modeleV2({
  id: identifiantV2(463, "ligne-entreprise"), concept: "c-463-ligne-entreprise", name: "Ligne entreprise", family: FAM,
  description: "Pour un opérateur télécoms pour entreprises : solutions en grandes lignes à flèche et ressources à gauche, encadré orange « parler à un conseiller » à droite, barre basse avec lettre. Dense, industriel, lisible.",
  tags: ["télécoms", "entreprises", "anthracite", "orange", "solutions", "encadré", "angles droits"],
  identity: ligneE, racine: racineDe("#1b1e23"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ANTH = "#1b1e23", ANTH2 = "#262a31", ORANGE = "#ff8a2b", BLANC = "#f2f3f5";
    const sol = (t, s, u) => ligneIndex(k, "→", `${t}`, u, { police: S.head, couleur: BLANC, filet: "#f2f3f530", fondSurvol: ANTH2, couleurSurvol: ORANGE, focus: ORANGE, taille: "fluid:30-52", poids: "600", casse: "uppercase", h: "72px" });
    const solutions = G.colonne(k, [caps(k, "Solutions pour entreprises", { couleur: ORANGE, suivi: "0.22em" }), sol("Téléphonie", "", "/catalogue"), sol("Internet professionnel", "", "/catalogue"), sol("Réseau d'entreprise", "", "/catalogue"), sol("Mobilité", "", "/catalogue")], { poids: 1, min: "280px", gap: "6px" });
    const res = G.ligne(k, liensCol(k, [["Questions fréquentes", "/faq"], ["Actualités", "/blog"], ["Espace client", "/connexion"], ["Accueil", "/"]], { taille: 15, poids: "600", accent: ORANGE }), { gap: "0px 28px", aligne: "center" });
    const gauche = G.colonne(k, [solutions, res], { poids: 7, min: "300px", gap: "20px" });
    const bt = bouton(k, "Parler à un conseiller", "/contact", { couleur: ANTH, fond: "#ffffff", survolFond: ANTH, survolCouleur: "#ffffff" });
    const statut = souffle(carre(k, ANTH, "12px"), 3400);
    const encadre = k.col([k.row([statut, caps(k, "Un conseiller vous répond", { couleur: ANTH })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" }), coordonnees(k, { taille: 16, couleur: ANTH, lien: ANTH, survol: "#ffffff", focus: ANTH }), horaires(k, { taille: 15, couleur: ANTH }), bt], { backgroundColor: ORANGE, flexGrow: 4, flexBasis: "0px", minWidth: "290px", gap: "22px", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "36px", paddingRight: "36px", borderRadius: "0px", alignSelf: "flex-start" });
    const haut = G.bande(k, [gauche, encadre], { fond: ANTH, gap: "40px 64px", aligne: "flex-start", padV: ["80px", "64px", "44px"], padB: ["56px", "48px", "40px"], padH: PAD, nom: "Solutions" });
    const abo = abonnement(k, env, { titre: "Lettre professionnelle", intro: "Nouveautés et conseils pour votre entreprise, rarement.", bouton: "S'abonner", largeur: "420px", accent: ORANGE, texte: BLANC, couleurTitre: ORANGE, couleurIntro: "#aeb4bd", survolBouton: BLANC, survolTexte: ANTH, surBouton: ANTH });
    const mentions = A.legale(k, env, G, { taille: 13, sansCookies: true, couleur: "#aeb4bd", liens: BLANC });
    const bas = dernier(G.bande(k, [abo, trait(k, "#f2f3f530"), mentions], { fond: ANTH, colonne: true, gap: "32px", padV: ["40px", "36px", "32px"], padB: ["28px", "24px", "20px"], padH: PAD, filetHaut: { epaisseur: "1px", couleur: "#f2f3f530" }, nom: "Lettre" }), BLANC);
    return [G.racine(k, [haut, bas])];
  },
}, FAM);
const GK2 = require("../kit-v2").G;

module.exports = {
  key: FAM, label: "Télécoms et accès internet", target: 5, built: true,
  description: "Pieds standard pros et animés, angles droits, sans illustration : fournisseur d'accès, opérateur mobile, assistance, opérateur local et télécoms pour entreprises.",
  models: [fibreModele, mobileModele, aideModele, etapesModele, ligneModele],
};
