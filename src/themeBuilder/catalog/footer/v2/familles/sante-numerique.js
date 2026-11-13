// Famille v2 « Santé numérique et pharmacie » — 6 modèles (ft2-392 à ft2-397), famille « inspirée de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Passe « ILLUSTRATION » : chaque pied reprend le parti pris visuel d'UNE capture et porte un vrai dessin (SVG inline en formes pleines, voir ../aides-illus-collsante.js) :
//  - capture « KENNEDY » (nom monumental pleine largeur sous des colonnes de liens) : ft2-393 (devanture de pharmacie), ft2-397 (panneau d'anneaux violets) ;
//  - capture « YMGrad » (bloc de marque + pastilles à gauche, colonnes en capitales) : ft2-394 (moniteur de battements), ft2-395 (chemin de soin en paysage) ;
//  - capture « Bruno » (grande phrase + boutons, marque fantôme tracée, colonnes, lueur d'angle) : ft2-392 (halo et battement), ft2-396 (plante au soleil miel).
// Marques FICTIVES ; AUCUNE coordonnée, horaire, chiffre ni promesse médicale inventés : horaires, adresse et téléphone viennent des Données de l'entreprise. Aucun conseil médical.
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; UNE animation visible par modèle (carré, croix ou bouton qui « respire ») ; pas d'animation d'entrée.
const { modeleV2, identifiantV2, identite, G: GK } = require("../kit-v2");
const I = require("../aides-illus-collsante");

const PH = I.PH;
const RS = [["Fb", "https://www.facebook.com/"], ["Ig", "https://www.instagram.com/"], ["Yt", "https://www.youtube.com/"]];
const FAM = "sante-numerique";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-392 « Deux consultations » — capture « Bruno » : fond sombre, grande phrase serif centrée et deux boutons sur un halo, marque AUBÉPINE tracée en filigrane sous un filet, colonnes, lueur d'angle à étincelles.
const deuxId = identite({
  key: "c392", label: "Sarcelle profond et menthe", humeur: "dark",
  fond: "#05414a", texte: "#f3fbfa", discret: "#b6d9d6", accent: "#8ff0dc", surface: "#0a525c", encre: "#05414a", surEncre: "#f3fbfa",
  police: "font.instrument-sans", titres: "font.instrument-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f3fbfa40",
});
const deuxConsultations = modeleV2({
  id: identifiantV2(392, "deux-consultations"), concept: "c-392-deux-consultations",
  name: "Deux consultations", family: FAM,
  description: "Pour un cabinet connecté : « Se soigner, simplement. » en grand serif centré sur un halo d'anneaux menthe et un tracé de battement, deux boutons, la marque Aubépine tracée en filigrane, quatre colonnes dont les horaires, lueur menthe. Sarcelle et menthe.",
  tags: ["cabinet", "téléconsultation", "halo", "illustration", "marque tracée", "grand serif", "sarcelle", "menthe", "angles droits"],
  identity: deuxId,
  racine: { desktop: { backgroundColor: "#05414a", gap: "0px" } },
  widgets: ["html", "text", "link", "bizhours", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, o = I.outils(k, env, G), SARC = "#05414a", MENTHE = "#8ff0dc";
    const etiquette = k.row([o.souffle(o.carre(MENTHE, "12px"), 3200), o.caps("Cabinet Aubépine · santé en ligne", { couleur: MENTHE, suivi: "0.2em" })], { gap: "12px", alignItems: "center", justifyContent: "center", flexWrap: "nowrap", width: "100%" });
    const phrase = G.geant(`<p>Se soigner,<br><em>simplement.</em></p>`, { taille: [48, 112], tablette: { taille: [72, 100] }, mobile: { taille: [48, 64] }, lh: 0.98, suivi: "-0.015em", poids: "400", police: S.head, couleur: S.fg, align: "center" })(k, env, true);
    const b1 = o.souffle(o.bouton("Prendre rendez-vous", "/contact", { texte: SARC, fond: MENTHE, bord: MENTHE, survol: { backgroundColor: "#ffffff", borderColor: "#ffffff", color: SARC, transform: { y: -3 } }, focus: "#ffffff" }), 4200);
    const b2 = o.bouton("Mon espace patient", "/connexion", { texte: S.fg, fond: "#0a525c", bord: "#0a525c", survol: { backgroundColor: MENTHE, borderColor: MENTHE, color: SARC, transform: { y: -3 } }, focus: MENTHE });
    const appel = I.surFond(G.bande(k, [etiquette, phrase, G.ligne(k, [b1, b2], { gap: "12px", justifie: "center", largeur: "100%" })], { fond: SARC, colonne: true, gap: "32px", aligne: "stretch", padV: ["96px", "72px", "56px"], padB: ["112px", "88px", "72px"], padH: PH, nom: "Appel et halo" }), [I.calque(I.plein("0 0 1600 340", I.haloCentre(), "xMidYMid slice"))]);
    const m = I.mot("AUBE'PINE", { couleur: "#0c5964", trait: 1.5 });
    const lueur = I.calque(I.plein("0 0 1200 400", I.lueurCoin("#8ff0dc", "#8ff0dc", 560, 0), "xMaxYMax meet"));
    const marque = I.surFond(G.bande(k, [I.unique(k, m.corps, m.vb), o.trait("#f3fbfa40", "1px")], { fond: SARC, colonne: true, gap: "0px", padV: ["16px", "12px", "8px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Marque tracée" }), [lueur]);
    const ligneLiens = G.ligne(k, [["Prendre rendez-vous", "/contact"], ["Consulter à distance", "/contact"], ["Ordonnances", "/connexion"], ["Espace patient", "/connexion"], ["Questions fréquentes", "/faq"], ["Nous écrire", "/contact"]].map(([t, u]) => o.lien(t, u, { taille: 16, poids: "600", couleur: S.fg, padH: "14px", survol: { color: MENTHE, textDecoration: "underline" }, focus: MENTHE })), { gap: "0px 8px", aligne: "center", justifie: "center", largeur: "100%" });
    const accueil = G.colonne(k, [o.caps("Accueil", { couleur: MENTHE, extra: { textAlign: "center", width: "100%" } }), k.col([o.horaires({ couleur: S.mute, taille: 14 })], { maxWidth: "420px", width: "100%" })], { poids: 1, min: "260px", gap: "8px", aligne: "center" });
    const bas1 = G.bande(k, [ligneLiens, accueil], { fond: SARC, colonne: true, gap: "24px", padV: ["28px", "24px", "20px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Liens et accueil" });
    const bas = G.bande(k, [o.mentions({ couleur: S.mute, liens: S.fg })], { fond: SARC, colonne: true, padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [appel, marque, bas1, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-393 « Enseigne verte » — capture « KENNEDY » : filet, mention et deux colonnes en haut, MONUMENTAL en bas. Ici : la devanture de la pharmacie (enseigne à croix, auvent rayé festonné, vitrine à flacons) coiffe le pied.
const croixId = identite({
  key: "c393", label: "Vert pharmacie et jaune citron", humeur: "dark",
  fond: "#087a45", texte: "#ffffff", discret: "#d6f2e3", accent: "#f3ff8a", surface: "#066338", encre: "#04301c", surEncre: "#ffffff",
  police: "font.barlow", titres: "font.barlow-semi-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff59",
});
const enseigneVerte = modeleV2({
  id: identifiantV2(393, "enseigne-verte"), concept: "c-393-enseigne-verte",
  name: "Enseigne verte", family: FAM,
  description: "Pour une pharmacie : la devanture dessinée en haut (croix, auvent rayé festonné, vitrine à flacons), puis sur vert deux colonnes de liens, une mention d'urgence, et « Pharmacie du Marché » en capitales monumentales. Vert pharmacie et jaune citron.",
  tags: ["pharmacie", "devanture", "auvent", "illustration", "nom monumental", "croix", "vert", "jaune citron", "angles droits"],
  identity: croixId,
  racine: { desktop: { backgroundColor: "#04301c", gap: "0px" } },
  widgets: ["html", "text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, o = I.outils(k, env, G), VERT = "#087a45", CITRON = "#f3ff8a", SOMBRE = "#04301c";
    const devanture = I.double(k, I.devanture(), "0 0 1600 260", "480 0 640 260", { maxWidth: "1600px", marginLeft: "auto", marginRight: "auto" });
    const vitrine = G.bande(k, devanture, { fond: SOMBRE, colonne: true, padV: ["32px", "24px", "16px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Devanture" });
    const croix = o.souffle(k.col([k.T("<p>+</p>", { fontFamily: S.head, fontSize: "36px", fontWeight: "700", lineHeight: 1, color: VERT })], { backgroundColor: "#ffffff", width: "48px", height: "48px", alignItems: "center", justifyContent: "center", borderRadius: "0px", flexShrink: 0 }), 3000);
    const nom = G.geant(`<p>PHARMACIE<br>DU MARCHÉ</p>`, { taille: [44, 190], lh: 0.84, suivi: "-0.01em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env);
    const grand = G.bande(k, [nom], { fond: VERT, colonne: true, padV: ["40px", "32px", "24px"], padB: ["16px", "12px", "8px"], padH: ["32px", "24px", "16px"], max: "100%", nom: "Nom monumental" });
    const cols = G.ligne(k, [
      G.colonne(k, [croix, o.texte("Ce site ne remplace pas un avis médical. En cas d'urgence vitale, contactez immédiatement les secours.", { couleur: "#d6f2e3", largeur: "340px", taille: 14 })], { poids: 1.4, min: "260px", gap: "14px" }),
      o.colLiens("Mon officine", [["Ordonnances", "/connexion"], ["Conseils", "/blog"], ["Horaires et garde", "/contact"]], { survol: CITRON, couleur: "#ffffff", min: "170px" }),
      o.colLiens("Pratique", [["Nous écrire", "/contact"], ["Questions fréquentes", "/faq"], ["Actualités", "/blog"]], { survol: CITRON, couleur: "#ffffff", min: "170px" }),
    ], { gap: "28px 48px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const haut = G.bande(k, [o.trait("#ffffff", "1px"), cols], { fond: VERT, colonne: true, gap: "28px", padV: ["8px", "8px", "8px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Mention et liens" });
    const bas = G.bande(k, [o.mentions({ couleur: "#b9dcc8", liens: "#ffffff" })], { fond: SOMBRE, colonne: true, padV: ["20px", "18px", "16px"], padB: ["20px", "18px", "16px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [vitrine, grand, haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-394 « Console patient » — capture « YMGrad » inversée : les colonnes de liens à GAUCHE (police mono, capitales), le bloc de marque, les pastilles et le moniteur de battements dessiné à DROITE ; lien souligné menthe et retour en haut.
const consoleId = identite({
  key: "c394", label: "Graphite et menthe", humeur: "dark",
  fond: "#0b1118", texte: "#e6edf3", discret: "#9fb0c3", accent: "#5eead4", surface: "#121b26", encre: "#0b1118", surEncre: "#e6edf3",
  police: "font.geist", titres: "font.jetbrains-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#2b3b4e",
});
const consolePatient = modeleV2({
  id: identifiantV2(394, "console-patient"), concept: "c-394-console-patient",
  name: "Console patient", family: FAM,
  description: "Pour un service de santé numérique : trois colonnes de liens en police mono et la lettre d'information à gauche ; à droite le bloc de marque, les réseaux en pastilles et un moniteur de battements dessiné sur quadrillage. Graphite et menthe.",
  tags: ["santé numérique", "moniteur", "illustration", "police mono", "colonnes", "graphite", "menthe", "formulaire", "angles droits"],
  identity: consoleId,
  racine: { desktop: { backgroundColor: "#0b1118", gap: "0px" } },
  widgets: ["html", "text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, o = I.outils(k, env, G), MENTHE = "#5eead4", BORD = "#2b3b4e";
    const cols = G.ligne(k, [
      o.colLiens("Patients", [["rendez-vous", "/contact"], ["ordonnances", "/connexion"], ["messagerie", "/connexion"], ["documents", "/connexion"]], { survol: MENTHE, police: S.head, policeTitre: S.head, min: "170px", taille: 14 }),
      o.colLiens("Aide", [["questions", "/faq"], ["contact", "/contact"], ["actualités", "/blog"]], { survol: MENTHE, police: S.head, policeTitre: S.head, min: "150px", taille: 14 }),
      o.colLiens("Service", [["à propos", "/blog"], ["connexion", "/connexion"], ["inscription", "/inscription"]], { survol: MENTHE, police: S.head, policeTitre: S.head, min: "150px", taille: 14 }),
    ], { gap: "24px 36px", aligne: "flex-start", justifie: "flex-start", largeur: "100%" });
    const abo = GK.abonnement({ rayonBouton: "0px", rayonChamp: "0px", soulignement: "2px", titre: "$ lettre --abonner", intro: "Des nouvelles du service, rarement, sans publicité.", bouton: "Envoyer", largeur: "100%", accent: MENTHE, texte: S.fg, fondChamp: "#0b1118", rembChamp: "12px", policeChamp: S.head, tailleChamp: "15px", survolBouton: "#ffffff", survolTexte: "#0b1118", styleTitre: { fontFamily: S.head, color: MENTHE, fontSize: "15px", fontWeight: "500", marginBottom: "6px" } })(k, env);
    abo.parts.missing.styles.desktop = { ...abo.parts.missing.styles.desktop, color: S.fg };
    abo.parts.input.styles.desktop = { ...abo.parts.input.styles.desktop, borderWidth: "1px", borderColor: BORD, borderBottomWidth: "1px", borderStyle: "solid" };
    abo.parts.button.styles.desktop = { ...abo.parts.button.styles.desktop, color: "#0b1118", fontFamily: S.head };
    abo.parts.intro.styles.desktop = { ...abo.parts.intro.styles.desktop, color: S.mute };
    const gauche = G.colonne(k, [cols, o.trait(BORD, "1px"), k.col([abo], { width: "100%", maxWidth: "460px" })], { poids: 1.3, base: "420px", min: "300px", gap: "32px", aligne: "stretch" });
    const logo = o.souffle(o.logo("S", "soignio", { fond: MENTHE, encre: "#0b1118", couleur: S.fg, police: S.head, tailleNom: "28px" }), 2800);
    const moniteur = I.unique(k, I.moniteur(), "0 0 640 150", { maxWidth: "560px" });
    const droite = G.colonne(k, [logo, o.pastilles(RS, { couleur: S.fg, fond: "#121b26", bord: BORD, survolFond: MENTHE, survolCouleur: "#0b1118" }), moniteur, o.texte("© Soignio · service fictif d'exemple", { taille: 13, couleur: S.mute, police: S.head }), o.lien("Voir tous les services", "/faq", { taille: 15, poids: "600", couleur: MENTHE, soulign: true, survol: { color: "#ffffff" }, focus: MENTHE })], { poids: 1, base: "420px", min: "300px", gap: "20px", extra: { backgroundColor: "#121b26", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "32px", paddingRight: "32px", boxSizing: "border-box" }, mobile: { paddingLeft: "16px", paddingRight: "16px" } });
    const corps = G.bande(k, [gauche, droite], { fond: "#0b1118", gap: "48px", aligne: "stretch", padV: ["72px", "56px", "40px"], padB: ["56px", "44px", "32px"], padH: PH, nom: "Colonnes et marque" });
    const bas = G.bande(k, [G.ligne(k, [o.mentions({ couleur: S.mute, liens: S.fg }), o.haut(S.fg, "#0b1118")], { justifie: "space-between", largeur: "100%" })], { fond: "#0b1118", colonne: true, padV: ["16px", "14px", "12px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [corps, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-395 « Parcours de soin » — capture « YMGrad » : sur bleu nuit, un paysage dessiné (collines, chemin sinueux jalonné de quatre étapes) coiffe le pied ; dessous, bloc de marque et pastilles à gauche, quatre listes en grille 2 x 2 à droite.
const parcoursId = identite({
  key: "c395", label: "Bleu nuit et ciel", humeur: "dark",
  fond: "#0b2a4a", texte: "#eef5fd", discret: "#a9c3e0", accent: "#8fbaff", surface: "#12365e", encre: "#0b2a4a", surEncre: "#eef5fd",
  police: "font.mulish", titres: "font.lexend",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#eef5fd40",
});
const parcoursDeSoin = modeleV2({
  id: identifiantV2(395, "parcours-de-soin"), concept: "c-395-parcours-de-soin",
  name: "Parcours de soin", family: FAM,
  description: "Pour un service de santé en ligne : un paysage dessiné en tête (collines bleues, chemin sinueux, quatre étapes), puis sur bleu nuit le bloc de marque, les pastilles de réseaux, quatre listes en grille et la mention d'urgence. Bleu nuit et ciel.",
  tags: ["paysage", "chemin", "illustration", "étapes", "parcours patient", "bleu nuit", "ciel", "santé en ligne", "angles droits"],
  identity: parcoursId,
  racine: { desktop: { backgroundColor: "#0b2a4a", gap: "0px" } },
  widgets: ["html", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, o = I.outils(k, env, G), CIEL = "#8fbaff", NUIT = "#0b2a4a";
    const paysage = I.double(k, I.chemin(), "0 0 1200 220", "0 0 560 220", { maxWidth: "1600px", marginLeft: "auto", marginRight: "auto" });
    const hautBande = G.bande(k, paysage, { fond: "#e8f1fb", colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Paysage" });
    const logo = o.souffle(o.logo("CS", "Cap Santé", { fond: CIEL, encre: NUIT, couleur: S.fg, police: S.head }), 3000);
    const cols = G.ligne(k, [
      o.colLiens("Je prends rendez-vous", [["En cabinet", "/contact"], ["À distance", "/contact"], ["Urgences", "/faq"]], { survol: CIEL, min: "180px" }),
      o.colLiens("Je consulte", [["Mon espace patient", "/connexion"], ["Messagerie", "/connexion"], ["Documents", "/connexion"]], { survol: CIEL, min: "180px" }),
      o.colLiens("Mon traitement", [["Ordonnances", "/connexion"], ["Conseils", "/blog"], ["Questions fréquentes", "/faq"]], { survol: CIEL, min: "180px" }),
      G.colonne(k, [o.caps("Nous écrire", { couleur: S.fg }), o.coordonnees({ couleur: S.mute, lien: S.fg, survol: CIEL, focus: CIEL, taille: 14 })], { poids: 1.2, min: "220px", gap: "8px" }),
    ], { gap: "28px 32px", aligne: "flex-start", justifie: "space-between", largeur: "100%" });
    const pied = G.ligne(k, [logo, o.pastilles(RS, { couleur: S.fg, fond: "#12365e", survolFond: CIEL, survolCouleur: NUIT }), o.texte("En cas d'urgence vitale, contactez immédiatement les secours. Ce site ne remplace pas un avis médical.", { taille: 13, largeur: "420px" })], { gap: "20px 40px", aligne: "center", justifie: "space-between", largeur: "100%" });
    const corps = G.bande(k, [cols, o.trait("#eef5fd40", "1px"), pied], { fond: NUIT, colonne: true, gap: "32px", padV: ["48px", "40px", "32px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Listes et marque" });
    const bas = G.bande(k, [G.ligne(k, [o.mentions({ couleur: S.mute, liens: S.fg }), o.haut(S.fg, NUIT)], { justifie: "space-between", largeur: "100%" })], { fond: NUIT, colonne: true, padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [hautBande, corps, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-396 « Mosaïque santé » — capture « Bruno » sur pêche : en haut la grande phrase serif et les boutons à gauche, une plante en pot sous un soleil miel à droite ; trois cartes de liens à angles droits ; marque CLAIRVIE tracée en filigrane qui déborde en bas.
const mosaId = identite({
  key: "c396", label: "Pêche, ardoise et miel", humeur: "light",
  fond: "#fff7ef", texte: "#3a1208", discret: "#6a4638", accent: "#b8300f", surface: "#ffd9c7", encre: "#1f2a37", surEncre: "#ffffff",
  police: "font.hanken-grotesk", titres: "font.young-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#3a120840",
});
const mosaiqueSante = modeleV2({
  id: identifiantV2(396, "mosaique-sante"), concept: "c-396-mosaique-sante",
  name: "Mosaïque santé", family: FAM,
  description: "Pour un service de santé : « Votre santé, en clair. » et un bouton à gauche, une plante en pot sous un soleil miel dessinée à droite, trois cartes (contact, annuaire, réseaux) et la marque Clairvie tracée en filigrane. Pêche, ardoise et miel.",
  tags: ["plante", "soleil", "illustration", "marque tracée", "cartes", "annuaire", "pêche", "ardoise", "miel", "angles droits"],
  identity: mosaId,
  racine: { desktop: { backgroundColor: "#fff7ef", gap: "0px" } },
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, o = I.outils(k, env, G), ENCRE = "#3a1208", ROUGE = "#b8300f", ARDOISE = "#1f2a37", MIEL = "#ffe7a8", PECHE = "#ffd9c7";
    const phrase = G.geant(`<p>Votre santé,<br>en clair.</p>`, { taille: [48, 104], tablette: { taille: [72, 96] }, mobile: { taille: [48, 64] }, lh: 1.0, suivi: "-0.02em", poids: "400", police: S.head, couleur: ENCRE })(k, env);
    const b = o.souffle(o.bouton("Créer mon espace", "/inscription", { texte: "#ffffff", fond: ROUGE, bord: ROUGE, survol: { backgroundColor: ENCRE, borderColor: ENCRE, color: "#ffffff", transform: { y: -3 } }, focus: ENCRE }), 4200);
    const texteG = G.colonne(k, [o.caps("Clairvie, la santé qui se simplifie", { couleur: ENCRE, suivi: "0.16em" }), phrase, o.texte("Rendez-vous, documents et échanges avec vos professionnels de santé, au même endroit.", { taille: 17, couleur: ENCRE, largeur: "420px" }), b], { poids: 1, base: "340px", min: "300px", gap: "24px", aligne: "flex-start" });
    const plante = G.colonne(k, [I.unique(k, I.plante(), "0 0 480 250", { maxWidth: "560px" })], { poids: 1, base: "340px", min: "280px", gap: "0px", aligne: "stretch" });
    const tete = G.bande(k, [G.ligne(k, [texteG, plante], { gap: "32px 48px", aligne: "center", justifie: "space-between", largeur: "100%" })], { fond: PECHE, colonne: true, padV: ["64px", "52px", "36px"], padB: ["64px", "52px", "36px"], padH: PH, nom: "Phrase et plante" });
    const contact = k.col([o.caps("Contact", { couleur: ROUGE }), o.horaires({ couleur: ENCRE, taille: 14 }), o.coordonnees({ couleur: ENCRE, lien: ENCRE, survol: ROUGE, focus: ROUGE, taille: 14 })], { backgroundColor: "#ffffff", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px", gap: "10px", boxSizing: "border-box", flexGrow: 1.4, flexBasis: "280px", minWidth: "0px", borderRadius: "0px" });
    const annuaire = o.lien("Annuaire des professionnels ↗", "/blog", { taille: 24, poids: "400", police: S.head, couleur: "#ffffff", bloc: true, h: "160px", aligne: "flex-end", padH: "24px", padV: "20px", lh: 1.15, survol: { backgroundColor: "#ffffff", color: ARDOISE, textDecoration: "none", transform: { y: -3 } }, focus: ROUGE, extra: { backgroundColor: ARDOISE, flexGrow: 1, flexBasis: "240px", minWidth: "0px", boxSizing: "border-box" } });
    const suivre = k.col([o.caps("Suivre Clairvie", { couleur: ROUGE }), k.col(RS.map(([t, u], i) => o.lien(["Facebook", "Instagram", "YouTube"][i] + " ↗", u, { taille: 15, poids: "700", couleur: ENCRE, survol: { color: ROUGE, transform: { x: 4 }, textDecoration: "underline" }, focus: ROUGE })), { gap: "0px" })], { backgroundColor: MIEL, paddingTop: "20px", paddingBottom: "20px", paddingLeft: "24px", paddingRight: "24px", gap: "6px", boxSizing: "border-box", flexGrow: 1, flexBasis: "220px", minWidth: "0px", borderRadius: "0px" });
    const cartes = G.bande(k, [k.row([contact, annuaire, suivre], { gap: "6px", alignItems: "stretch", flexWrap: "wrap", width: "100%" })], { fond: "#fff7ef", colonne: true, padV: ["48px", "40px", "28px"], padB: ["16px", "12px", "8px"], padH: PH, nom: "Cartes" });
    const m = I.mot("CLAIRVIE", { couleur: "#f6dccb", trait: 1.5 });
    const marque = G.bande(k, [I.unique(k, m.corps, m.vb), o.trait("#3a120840", "1px"), o.mentions({ couleur: S.mute, liens: ENCRE })], { fond: "#fff7ef", colonne: true, gap: "20px", padV: ["24px", "20px", "16px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Marque tracée et mentions" });
    return [G.racine(k, [tete, cartes, marque])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-397 « Étages du cabinet » — capture « KENNEDY » : filet, mention et colonnes en haut, MEDILIS monumental pleine largeur en bas ; à gauche, un panneau dessiné (anneaux violets, croix lavande, battement, petites marches).
const etagesId = identite({
  key: "c397", label: "Lavande, violet vif et nuit", humeur: "dark",
  fond: "#140e33", texte: "#f4f1ff", discret: "#c3b9f0", accent: "#b7a4ff", surface: "#201650", encre: "#140e33", surEncre: "#f4f1ff",
  police: "font.onest", titres: "font.sora",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f4f1ff40",
});
const etagesCabinet = modeleV2({
  id: identifiantV2(397, "etages-du-cabinet"), concept: "c-397-etages-du-cabinet",
  name: "Étages du cabinet", family: FAM,
  description: "Pour une plateforme de santé : un panneau dessiné à gauche (anneaux violets, croix lavande, battement, marches), services, horaires et contact à droite, puis « Medilis » en capitales monumentales lavande pleine largeur. Lavande, violet et nuit.",
  tags: ["panneau", "anneaux", "illustration", "nom monumental", "plateforme santé", "lavande", "violet", "nuit", "angles droits"],
  identity: etagesId,
  racine: { desktop: { backgroundColor: "#140e33", gap: "0px" } },
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, o = I.outils(k, env, G), NUIT = "#140e33", LAV = "#ede9ff", MID = "#c9bdff";
    const panneau = o.souffle(I.unique(k, I.panneau(), "0 0 340 520", { maxWidth: "320px" }), 3400);
    const nom = G.geant(`<p>MEDILIS</p>`, { taille: [44, 200], lh: 0.88, suivi: "-0.04em", poids: "800", police: S.head, couleur: LAV })(k, env);
    const grand = G.bande(k, [nom, o.trait("#f4f1ff40", "1px")], { fond: NUIT, colonne: true, gap: "0px", padV: ["40px", "32px", "24px"], padB: ["0px", "0px", "0px"], padH: ["32px", "24px", "16px"], max: "100%", nom: "Nom monumental" });
    const liste = ["Prendre rendez-vous", "Téléconsultation", "Ordonnances", "Espace patient"].map((t, i) => o.lien(t, ["/contact", "/contact", "/connexion", "/connexion"][i], { taille: 20, poids: "600", police: S.head, couleur: S.fg, bloc: true, h: "52px", survol: { color: MID, transform: { x: 6 }, textDecoration: "none" }, focus: MID, extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#f4f1ff40" } }));
    const gauche = G.colonne(k, [o.caps("Plateforme de santé en ligne", { couleur: MID, suivi: "0.2em" }), k.col(liste, { gap: "0px", width: "100%" }), G.ligne(k, [G.colonne(k, [o.caps("Accueil", { couleur: S.fg }), o.horaires({ couleur: S.mute, taille: 14 })], { poids: 1, min: "200px", gap: "8px" }), G.colonne(k, [o.caps("Nous joindre", { couleur: S.fg }), o.coordonnees({ couleur: S.mute, lien: S.fg, survol: MID, focus: MID, taille: 14 })], { poids: 1, min: "200px", gap: "8px" })], { gap: "24px 40px", aligne: "flex-start", largeur: "100%" })], { poids: 1, base: "420px", min: "280px", gap: "24px", aligne: "stretch" });
    const droite = G.colonne(k, [panneau], { poids: 0, base: "320px", min: "260px", gap: "0px", aligne: "center" });
    const haut = G.bande(k, [G.ligne(k, [gauche, droite], { gap: "32px 64px", aligne: "flex-start", justifie: "space-between", largeur: "100%" })], { fond: NUIT, colonne: true, padV: ["32px", "28px", "24px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Liens et panneau" });
    const bas = G.bande(k, [o.mentions({ couleur: S.mute, liens: S.fg })], { fond: "#1b1340", colonne: true, padV: ["24px", "22px", "20px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [grand, haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Santé numérique et pharmacie", target: 6, built: true,
  description: "Pieds de cabinets connectés, pharmacies et services de santé en ligne, angles droits, inspirés de captures et illustrés : halo, devanture, moniteur, paysage, plante, panneau d'anneaux.",
  models: [deuxConsultations, enseigneVerte, consolePatient, parcoursDeSoin, mosaiqueSante, etagesCabinet],
};
