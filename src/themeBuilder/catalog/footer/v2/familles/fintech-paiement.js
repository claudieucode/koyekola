// Famille v2 « Fintech et paiement » — 6 modèles (ft2-272 à ft2-277), pieds « inspirés de captures », REFAITS avec de vraies illustrations SVG (aides-illus-engfin.js).
// ANGLES DROITS partout, marques fictives, aucun chiffre, tarif ni coordonnée inventés ; libellés de produits = EXEMPLES. MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms, un carré qui respire par modèle.
const A = require("../aides-illus-engfin");
const { modeleV2, identifiantV2, identite, GK, racineDe, lien, caps, trait, souffle, carre, lettre, nomDuSite, rangee, panneau, rangeeDe, mentionsBande, pastilles, fantome, colLiens, svgDeux, coordonnees } = A;
const FAM = "fintech-paiement";
const RES = ["linkedin", "youtube", "instagram", "facebook"];
const bas = (k, env, G, fond, mute, liens, filet) => mentionsBande(k, env, G, fond, mute, liens, filet ? { filetHaut: { epaisseur: "1px", couleur: filet } } : {});
const abo = (k, env, G, o) => lettre(k, env, G, { titre: "", intro: o.intro, bouton: o.bouton || "S'abonner", largeur: o.largeur || "100%", accent: o.accent, texte: o.texte, surBouton: o.surBouton, fond: o.fond, fondChamp: o.fondChamp, rembChamp: "10px", focus: o.focus || o.texte, survolBouton: o.survolBouton, survolTexte: o.survolTexte });
const bouton = (k, t, o) => lien(k, t, "/contact", { taille: o.taille || 18, poids: "800", couleur: o.texte, h: "60px", padH: "32px", survol: { backgroundColor: o.survol, color: o.surSurvol, transform: { y: -3 } }, focus: o.focus || o.survol, extra: { backgroundColor: o.fond, borderStyle: "solid", borderWidth: "2px", borderColor: o.fond } });

// ═════════ ft2-272 « Appel à l'encaissement » — capture 2 : héros en dégradé lumineux (phrase + bouton) et PILE DE CARTES dessinée dans un halo lilas ; puis nom, liens, pastilles ═════════
const appelXxl = identite({ key: "c272", label: "Violet électrique et lavande pâle", humeur: "light", fond: "#f3f0ff", texte: "#1a1233", discret: "#554a78", accent: "#4a1fe0", surface: "#ffffff", encre: "#1a1233", police: "font.instrument-sans", titres: "font.epilogue", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#1a123333" });
const VIOLET = "#4a1fe0", LAVANDE = "#f3f0ff", ENCRE_V = "#1a1233";
const appelEncaissement = modeleV2({
  id: identifiantV2(272, "appel-a-l-encaissement"), concept: "c-272-appel-a-l-encaissement", name: "Appel à l'encaissement", family: FAM,
  description: "Pour une solution d'encaissement : un héros violet électrique en dégradé avec une phrase gigantesque, deux boutons et un éventail de cartes de paiement dessinées dans un halo lilas ; dessous, sur lavande, le nom, une colonne de liens et des pastilles de réseaux.",
  tags: ["fintech", "encaissement", "cartes dessinées", "halo", "dégradé", "violet", "lavande", "angles droits"],
  identity: appelXxl, racine: racineDe(LAVANDE),
  widgets: ["html", "sitetitle", "text", "link", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = k.T("<p>Encaissez partout, sans friction.</p>", { fontSize: "fluid:44-112", lineHeight: 0.98, fontWeight: "800", fontFamily: S.head, color: "#ffffff", letterSpacing: "-0.03em", maxWidth: "760px", overflowWrap: "anywhere" });
    const parler = lien(k, "Parler à un conseiller", "/contact", { taille: 18, poids: "700", couleur: "#ffffff", h: "60px", padH: "8px", survol: { color: "#d9ceff", transform: { x: 6 } }, focus: "#ffffff", extra: { textDecoration: "underline", textDecorationThickness: "2px", textUnderlineOffset: "6px" } });
    const texte = k.col([k.row([souffle(carre(k, "#ffffff", "12px"), 3000), caps(k, "Paiements en ligne et en boutique", { couleur: "#ffffff", suivi: "0.24em" })], { gap: "12px", alignItems: "center" }), phrase, k.row([bouton(k, "Ouvrir un compte", { texte: VIOLET, fond: "#ffffff", survol: ENCRE_V, surSurvol: "#ffffff" }), parler], { rowGap: "12px", columnGap: "28px", alignItems: "center", flexWrap: "wrap" })], { gap: "32px", flexGrow: 1.3, flexBasis: "0px", minWidth: "300px" });
    const cartes = k.col(svgDeux(k, A.illCartes(), null, { maxWidth: "540px" }), { flexGrow: 1, flexBasis: "0px", minWidth: "260px", alignItems: "center" });
    const heros = G.bande(k, [k.row([texte, cartes], { columnGap: "40px", rowGap: "24px", alignItems: "center", width: "100%", flexWrap: "wrap" })], { fond: VIOLET, degrade: { from: "#2a0f9a", to: "#6c3cf0", angle: 120, type: "linear" }, colonne: true, padV: ["88px", "64px", "44px"], padB: ["72px", "52px", "40px"], padH: ["48px", "32px", "20px"], nom: "Héros" });
    const nom = nomDuSite(k, env, 40, ENCRE_V, { fontWeight: "800" });
    const gauche = k.col([nom, k.T("<p>Des paiements clairs pour les commerçants, les associations et les équipes en ligne.</p>", { fontSize: "18px", lineHeight: 1.55, color: S.mute, fontFamily: S.font, maxWidth: "400px" }), pastilles(k, env, RES, { couleur: ENCRE_V, contour: "#1a123388", survolFond: VIOLET, survolCouleur: "#ffffff", focus: VIOLET })], { gap: "22px", flexGrow: 1, flexBasis: "0px", minWidth: "280px" });
    const liens = ["Encaissement en ligne", "Terminaux en boutique", "Facturation", "Liens de paiement", "Documentation", "Entreprise", "Contact"].map((t) => rangee(k, t, "/contact", { couleur: ENCRE_V, taille: 16, poids: "600", h: "48px", padH: "4px", fondSurvol: "#ffffff", couleurSurvol: VIOLET, focus: VIOLET, ligne: "#1a123344" }));
    const etroite = k.col(liens, { gap: "0px", width: "300px", flexShrink: 0 }, undefined, { width: "100%" });
    const corps = G.bande(k, [k.row([gauche, etroite], { rowGap: "36px", columnGap: "80px", alignItems: "flex-start", flexWrap: "wrap", width: "100%", justifyContent: "space-between" })], { fond: LAVANDE, colonne: true, padV: ["56px", "44px", "36px"], padB: ["40px", "36px", "28px"], padH: ["48px", "32px", "20px"], nom: "Liens" });
    return [G.racine(k, [heros, corps, bas(k, env, G, LAVANDE, "#554a78", ENCRE_V, "#1a123333")])];
  },
}, FAM);

// ═════════ ft2-273 « Barre de règlement » — capture 2 inversée : TERMINAL DE PAIEMENT géant à gauche sur citron, message et liens en capitales mono à droite ═════════
const reglement = identite({ key: "c273", label: "Vert citron et noir", humeur: "light", fond: "#d8ff3c", texte: "#0d0f08", discret: "#33380f", accent: "#0d0f08", surface: "#e7ff7a", encre: "#0d0f08", police: "font.martian-mono", titres: "font.martian-mono", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "1px", ligne: "#0d0f0855" });
const CITRON = "#d8ff3c", NOIR_C = "#0d0f08";
const barreDeReglement = modeleV2({
  id: identifiantV2(273, "barre-de-reglement"), concept: "c-273-barre-de-reglement", name: "Barre de règlement", family: FAM,
  description: "Pour une néobanque d'indépendants : sur vert citron, un grand terminal de paiement noir dessiné à gauche ; à droite, une phrase, un bouton noir, cinq liens en capitales mono qui se remplissent de noir au survol, le nom et des pastilles de réseaux.",
  tags: ["néobanque", "indépendants", "terminal dessiné", "mono", "vert citron", "noir", "angles droits", "réseaux"],
  identity: reglement, racine: racineDe(CITRON),
  widgets: ["html", "sitetitle", "text", "link", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const terminal = k.col(svgDeux(k, A.illTerminal(), null, { maxWidth: "420px" }), { flexGrow: 0.9, flexBasis: "0px", minWidth: "240px", alignItems: "center" });
    const phrase = k.T("<p>Vos règlements, enfin au clair.</p>", { fontSize: "fluid:36-88", lineHeight: 1, fontWeight: "700", fontFamily: S.head, color: NOIR_C, maxWidth: "720px", overflowWrap: "anywhere" });
    const liens = ["Comptes", "Cartes", "Virements", "Factures", "Aide"].map((t) => lien(k, t, "/contact", { taille: 15, poids: "700", casse: "uppercase", suivi: "0.08em", couleur: NOIR_C, padH: "12px", h: "48px", survol: { backgroundColor: NOIR_C, color: CITRON, transform: { y: -2 } }, focus: NOIR_C, extra: { borderStyle: "solid", borderWidth: "2px", borderColor: NOIR_C } }));
    const nom = nomDuSite(k, env, 26, NOIR_C, { fontWeight: "700", textTransform: "uppercase" });
    const droite = k.col([k.row([souffle(carre(k, NOIR_C, "12px"), 3000), caps(k, "Néobanque pour indépendants", { couleur: NOIR_C, suivi: "0.16em" })], { gap: "12px", alignItems: "center" }), phrase, bouton(k, "Ouvrir un compte", { texte: CITRON, fond: NOIR_C, survol: "#ffffff", surSurvol: NOIR_C, focus: NOIR_C }), k.row(liens, { columnGap: "12px", rowGap: "12px", flexWrap: "wrap" }), trait(k, NOIR_C, "3px"), k.row([nom, pastilles(k, env, RES, { couleur: NOIR_C, survolFond: NOIR_C, survolCouleur: CITRON, focus: NOIR_C })], { columnGap: "32px", rowGap: "16px", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", width: "100%" })], { gap: "28px", flexGrow: 1.4, flexBasis: "0px", minWidth: "300px" });
    const corps = G.bande(k, [k.row([terminal, droite], { columnGap: "64px", rowGap: "32px", alignItems: "center", width: "100%", flexWrap: "wrap" })], { fond: CITRON, colonne: true, padV: ["72px", "56px", "36px"], padB: ["56px", "44px", "32px"], padH: ["48px", "32px", "20px"], nom: "Terminal" });
    return [G.racine(k, [corps, bas(k, env, G, CITRON, "#33380f", NOIR_C, null)])];
  },
}, FAM);

// ═════════ ft2-274 « Rives du paiement » — capture 3 : deux demi-pages (message / PAYSAGE de rives et fleuve), liens, et NOM GÉANT fantôme rogné en bas ═════════
const rives = identite({ key: "c274", label: "Vert sapin et menthe pâle", humeur: "light", fond: "#e4f6ec", texte: "#0a2a24", discret: "#3d5e55", accent: "#0f6b55", surface: "#ffffff", encre: "#0a2a24", police: "font.golos-text", titres: "font.ibm-plex-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#0a2a2433" });
const SAPIN = "#0a2a24", MENTHE = "#e4f6ec", MENTHE_VIVE = "#7be3b5";
const deuxRives = modeleV2({
  id: identifiantV2(274, "deux-rives"), concept: "c-274-deux-rives", name: "Rives du paiement", family: FAM,
  description: "Pour une plateforme de paiement d'associations : phrase italique sur sapin, paysage dessiné (deux rives, fleuve, pont, soleil en halo), liens et pastilles de réseaux, puis le nom du site géant, ton sur ton.",
  tags: ["paiement", "associations", "paysage dessiné", "fleuve", "nom fantôme", "vert sapin", "menthe", "angles droits"],
  identity: rives, racine: racineDe(MENTHE),
  widgets: ["html", "sitetitle", "text", "link", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = k.T("<p><em>Chaque don arrive de l'autre côté.</em></p>", { fontSize: "fluid:36-76", lineHeight: 1.06, fontWeight: "400", fontFamily: S.head, color: "#ffffff", maxWidth: "620px", overflowWrap: "anywhere" });
    const gauche = panneau(k, [souffle(carre(k, MENTHE_VIVE, "12px"), 3200), phrase, k.T("<p>Des encaissements simples et traçables pour les associations et leurs bénévoles.</p>", { fontSize: "18px", lineHeight: 1.55, color: "#cfe9dd", fontFamily: S.font, maxWidth: "460px" }), bouton(k, "Collecter un don  →", { texte: SAPIN, fond: MENTHE_VIVE, survol: "#ffffff", surSurvol: SAPIN })], { fond: SAPIN, gap: "28px", justifie: "center", base: "0px", poids: 1, min: "320px", padV: ["80px", "56px", "44px"], padH: ["64px", "40px", "20px"] });
    const paysage = k.col(svgDeux(k, A.illRives()), { flexGrow: 1, flexBasis: "0px", minWidth: "320px", backgroundColor: "#0a2a24" });
    const nom = nomDuSite(k, env, 30, SAPIN, { fontWeight: "600" });
    const g2 = k.col([nom, k.T("<p>Paiements pour associations, clairs de bout en bout.</p>", { fontSize: "17px", lineHeight: 1.55, color: S.mute, fontFamily: S.font, maxWidth: "380px" })], { gap: "16px", flexGrow: 1.5, flexBasis: "0px", minWidth: "260px" });
    const l1 = colLiens(k, "Accueil", ["Collectes", "Dons réguliers", "Aide", "Contact"], { couleurTitre: SAPIN, couleur: S.mute, taille: 17, survol: { color: "#0f6b55", transform: { x: 4 } }, focus: SAPIN, gap: "2px" });
    const suivre = k.col([caps(k, "Suivez-nous", { couleur: SAPIN }), pastilles(k, env, RES, { couleur: SAPIN, contour: "#0a2a2488", survolFond: SAPIN, survolCouleur: MENTHE, focus: SAPIN })], { gap: "14px", flexGrow: 1, flexBasis: "0px", minWidth: "240px" });
    const liens = G.bande(k, [k.row([g2, l1, suivre], { rowGap: "36px", columnGap: "48px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" })], { fond: MENTHE, colonne: true, padV: ["56px", "44px", "36px"], padB: ["24px", "20px", "16px"], padH: ["48px", "32px", "20px"], nom: "Liens" });
    const geant = k.col([fantome(k, env, { couleur: "#2f6f5b", fond: MENTHE, casse: "uppercase", poids: "600" })], { width: "100%", backgroundColor: MENTHE, paddingLeft: "24px", paddingRight: "24px" });
    return [G.racine(k, [G.bande(k, [rangeeDe(k, [gauche, paysage])], { fond: SAPIN, colonne: true, max: "100%", ...A.PAGE_LARGEUR, aligne: "stretch", nom: "Pleine largeur" }), liens, geant, bas(k, env, G, MENTHE, "#3d5e55", SAPIN, "#0a2a2433")])];
  },
}, FAM);

// ═════════ ft2-275 « Mosaïque de comptes » — capture 3 : GRANDE CASE (phrase + nom fantôme) et colonne de deux cases (BLOCS ISOMÉTRIQUES dessinés / liens et pastilles) ═════════
const mosaique = identite({ key: "c275", label: "Marine, jaune, blanc et corail", humeur: "dark", fond: "#0b1f4b", texte: "#ffffff", discret: "#b9c7ec", accent: "#ffd84d", surface: "#12306e", encre: "#0b1f4b", police: "font.lexend-deca", titres: "font.unbounded", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#ffffff33" });
const MARINE = "#0b1f4b", JAUNE_M = "#ffd84d", CORAIL = "#ff6b57";
const mosaiqueDeComptes = modeleV2({
  id: identifiantV2(275, "mosaique-de-comptes"), concept: "c-275-mosaique-de-comptes", name: "Mosaïque de comptes", family: FAM,
  description: "Pour une banque en ligne de PME : une grande case marine avec phrase, bouton jaune et le nom géant, à côté d'une colonne de deux cases, l'une avec des blocs isométriques dessinés dans un halo jaune, l'autre corail avec liens et pastilles de réseaux.",
  tags: ["banque", "PME", "blocs isométriques", "mosaïque", "halo", "marine", "jaune", "corail", "angles droits"],
  identity: mosaique, racine: racineDe(MARINE),
  widgets: ["html", "sitetitle", "text", "link", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = k.T("<p>Vos comptes d'entreprise, d'un seul regard.</p>", { fontSize: "fluid:34-72", lineHeight: 1.04, fontWeight: "600", fontFamily: S.head, color: "#ffffff", maxWidth: "640px", overflowWrap: "anywhere" });
    const grande = k.col([k.col([souffle(carre(k, JAUNE_M, "12px"), 3000), phrase, bouton(k, "Ouvrir un compte", { texte: MARINE, fond: JAUNE_M, survol: "#ffffff", surSurvol: MARINE })], { gap: "28px", paddingTop: "72px", paddingLeft: "56px", paddingRight: "40px", paddingBottom: "56px" }, { paddingTop: "48px", paddingLeft: "32px", paddingRight: "24px" }, { paddingTop: "36px", paddingLeft: "20px", paddingRight: "20px" }), fantome(k, env, { couleur: "#86a2ee", fond: MARINE, casse: "uppercase", poids: "700", taille: "fluid:70-170" })], { flexGrow: 1.4, flexBasis: "0px", minWidth: "320px", backgroundColor: MARINE, justifyContent: "space-between", gap: "0px" });
    const blocs = k.col(svgDeux(k, A.illBlocs(), null, { maxWidth: "460px" }), { backgroundColor: "#12306e", alignItems: "center", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", width: "100%", boxSizing: "border-box" });
    const nom = nomDuSite(k, env, 28, MARINE, { fontWeight: "700" });
    const liens = ["Comptes", "Cartes", "Factures", "Aide", "Contact"].map((t) => lien(k, t, "/contact", { taille: 17, poids: "700", couleur: MARINE, bloc: true, h: "44px", survol: { color: "#ffffff", transform: { x: 6 } }, focus: MARINE }));
    const corail = k.col([nom, k.col(liens, { gap: "0px" }), pastilles(k, env, RES, { couleur: MARINE, survolFond: MARINE, survolCouleur: "#ffffff", focus: MARINE })], { backgroundColor: CORAIL, gap: "18px", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "40px", paddingRight: "40px", width: "100%", flexGrow: 1 }, { paddingLeft: "28px", paddingRight: "28px" }, { paddingLeft: "20px", paddingRight: "20px" });
    const droite = k.col([blocs, corail], { flexGrow: 1, flexBasis: "0px", minWidth: "300px", gap: "0px", alignItems: "stretch" });
    return [G.racine(k, [G.bande(k, [rangeeDe(k, [grande, droite])], { fond: MARINE, colonne: true, max: "100%", ...A.PAGE_LARGEUR, aligne: "stretch", nom: "Mosaïque" }), bas(k, env, G, "#081739", "#b9c7ec", "#ffffff")])];
  },
}, FAM);

// ═════════ ft2-276 « Chemin du virement » — capture 3 en PANORAMA : phrase, SCHÉMA dessiné pleine largeur (banque, chemin de carrés, banque), liens en ligne, nom fantôme ═════════
const chemin = identite({ key: "c276", label: "Papier chaud, indigo et orange", humeur: "light", fond: "#fbf9f3", texte: "#1b1f3b", discret: "#4f5375", accent: "#c4410f", surface: "#ffffff", encre: "#1b1f3b", police: "font.familjen-grotesk", titres: "font.michroma", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#1b1f3b33" });
const INDIGO = "#1b1f3b", PAPIER = "#fbf9f3", ORANGE_V = "#c4410f";
const cheminDuVirement = modeleV2({
  id: identifiantV2(276, "chemin-du-virement"), concept: "c-276-chemin-du-virement", name: "Chemin du virement", family: FAM,
  description: "Pour un service de virements : sur papier chaud, une phrase et un bouton, puis un grand schéma dessiné pleine largeur (deux banques et un chemin de carrés orange qui grossissent), une ligne de liens et le nom du site géant, ton sur ton.",
  tags: ["virements", "schéma dessiné", "panorama", "nom fantôme", "papier chaud", "indigo", "orange", "angles droits"],
  identity: chemin, racine: racineDe(PAPIER),
  widgets: ["html", "sitetitle", "text", "link", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = k.T("<p>De votre compte au sien, sans détour.</p>", { fontSize: "fluid:34-72", lineHeight: 1.04, fontWeight: "400", fontFamily: S.head, color: INDIGO, maxWidth: "700px", overflowWrap: "anywhere", textTransform: "uppercase" });
    const tete = G.ligne(k, [k.col([k.row([souffle(carre(k, ORANGE_V, "12px"), 3000), caps(k, "Virements nationaux et internationaux", { couleur: ORANGE_V, suivi: "0.2em" })], { gap: "12px", alignItems: "center" }), phrase], { gap: "20px", flexGrow: 1, flexBasis: "0px", minWidth: "300px" }), bouton(k, "Faire un virement", { texte: "#ffffff", fond: INDIGO, survol: ORANGE_V, surSurvol: "#ffffff" })], { largeur: "100%", justifie: "space-between", rowGap: "24px", columnGap: "40px" });
    const schema = k.col(svgDeux(k, A.illVirement()), { width: "100%" });
    const nom = nomDuSite(k, env, 26, INDIGO, { fontWeight: "400", textTransform: "uppercase" });
    const ligneLiens = k.row([nom, ...["Virements", "Bénéficiaires", "Suivi", "Aide", "Contact"].map((t) => lien(k, t, "/contact", { taille: 16, poids: "700", couleur: INDIGO, padH: "6px", survol: { color: ORANGE_V, transform: { y: -2 } }, focus: INDIGO })), pastilles(k, env, RES.slice(0, 3), { couleur: INDIGO, survolFond: INDIGO, survolCouleur: PAPIER, focus: INDIGO })], { columnGap: "24px", rowGap: "8px", alignItems: "center", flexWrap: "wrap", width: "100%", justifyContent: "space-between" });
    const corps = G.bande(k, [tete, schema, trait(k, "#1b1f3b33"), ligneLiens], { fond: PAPIER, colonne: true, gap: "40px", padV: ["72px", "56px", "40px"], padB: ["24px", "20px", "16px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "28px" }, nom: "Panorama" });
    const geant = k.col([fantome(k, env, { couleur: "#5e6385", fond: PAPIER, casse: "uppercase", poids: "400", suivi: "-0.04em", taille: "fluid:60-150" })], { width: "100%", backgroundColor: PAPIER, paddingLeft: "24px", paddingRight: "24px" });
    return [G.racine(k, [corps, geant, bas(k, env, G, PAPIER, "#4f5375", INDIGO, "#1b1f3b33")])];
  },
}, FAM);

// ═════════ ft2-277 « Papier du trésorier » — capture 3 : médaillon central (ROSACE guillochée dessinée), texte et lien centrés, nom fantôme serif rogné ═════════
const papier = identite({ key: "c277", label: "Crème, bordeaux et or sourd", humeur: "light", fond: "#f6efe2", texte: "#3a0f1c", discret: "#6a4b52", accent: "#8c1d3f", surface: "#fffaf0", encre: "#3a0f1c", police: "font.commissioner", titres: "font.libre-baskerville", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#3a0f1c33" });
const BORDEAUX = "#5c1428", CREME_P = "#f6efe2", ENCRE_P = "#3a0f1c";
const papierDuTresorier = modeleV2({
  id: identifiantV2(277, "papier-du-tresorier"), concept: "c-277-papier-du-tresorier", name: "Papier du trésorier", family: FAM,
  description: "Pour un établissement de paiement : sur crème, une grande rosace guillochée bordeaux au centre, une phrase en serif italique, un coupon de lettre d'information, liens et pastilles centrés, puis le nom du site géant, ton sur ton.",
  tags: ["établissement de paiement", "rosace guillochée", "serif", "symétrique", "nom fantôme", "crème", "bordeaux", "angles droits"],
  identity: papier, racine: racineDe(CREME_P),
  widgets: ["html", "sitetitle", "text", "link", "social", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const rosace = k.col(svgDeux(k, A.illRosace(), null, { maxWidth: "340px" }), { width: "100%", alignItems: "center" });
    const phrase = k.T("<p><em>La confiance se règle à l'avance.</em></p>", { fontSize: "fluid:32-64", lineHeight: 1.1, fontWeight: "400", fontFamily: S.head, color: ENCRE_P, textAlign: "center", maxWidth: "680px", overflowWrap: "anywhere" });
    const aboC = k.col([abo(k, env, G, { intro: "Recevez nos avis réglementaires par e-mail.", bouton: "S'abonner", accent: BORDEAUX, texte: ENCRE_P, surBouton: "#ffffff", fond: CREME_P, fondChamp: "#ffffff", survolBouton: ENCRE_P, survolTexte: "#ffffff" })], { width: "100%", maxWidth: "520px" });
    const liens = k.row(["Services", "Documents", "Conformité", "Aide", "Contact"].map((t) => lien(k, t, "/contact", { taille: 16, poids: "700", couleur: ENCRE_P, padH: "8px", survol: { color: BORDEAUX, transform: { y: -2 } }, focus: BORDEAUX })), { columnGap: "20px", rowGap: "0px", flexWrap: "wrap", justifyContent: "center" });
    const nom = nomDuSite(k, env, 26, ENCRE_P, { fontWeight: "700", letterSpacing: "0.14em", textTransform: "uppercase" });
    const corps = G.bande(k, [rosace, k.row([souffle(carre(k, BORDEAUX, "12px"), 3200), caps(k, "Établissement de paiement", { couleur: BORDEAUX, suivi: "0.22em" })], { gap: "12px", alignItems: "center", justifyContent: "center" }), phrase, aboC, trait(k, "#3a0f1c33"), nom, liens, pastilles(k, env, RES, { couleur: ENCRE_P, survolFond: BORDEAUX, survolCouleur: "#ffffff", focus: BORDEAUX })], { fond: CREME_P, colonne: true, aligne: "center", gap: "26px", padV: ["72px", "52px", "36px"], padB: ["24px", "20px", "16px"], padH: ["48px", "32px", "20px"], innerMobile: { rowGap: "22px" }, nom: "Feuille" });
    const geant = k.col([fantome(k, env, { couleur: "#7a4f5a", fond: CREME_P, casse: "uppercase", poids: "400", taille: "fluid:60-140", suivi: "0em" })], { width: "100%", backgroundColor: CREME_P, paddingLeft: "24px", paddingRight: "24px" });
    return [G.racine(k, [corps, geant, bas(k, env, G, CREME_P, "#6a4b52", ENCRE_P, "#3a0f1c33")])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Fintech et paiement", target: 6, built: true,
  description: "Pieds standard et très professionnels, angles droits, avec de vraies illustrations dessinées : cartes dans un halo, terminal de paiement, paysage de rives, blocs isométriques, schéma de virement, rosace guillochée.",
  models: [appelEncaissement, barreDeReglement, deuxRives, mosaiqueDeComptes, cheminDuVirement, papierDuTresorier],
};
