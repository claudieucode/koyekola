// Famille v2 « Studios créatifs » — 6 modèles (ft2-302 à ft2-307), REFAITS à partir des captures 10 / 11 / 12 : ANGLES DROITS partout, vraies illustrations SVG (aides-illus-a03.js).
// Capture 10 (302 à 305) : phrase d'appel monumentale centrée + deux boutons, marque dessinée à gauche, colonnes de liens à droite, grande scène illustrée en bas de pied.
// Capture 11 (306, 307) : carte d'appel sombre illustrée, fondu du clair vers le sombre, pied sombre en colonnes.
// Capture 12 (notamment 306 en pied) : voir architecture-design. AUCUN chiffre ni coordonnée inventés ; rubriques et réseaux = EXEMPLES à renommer dans l'éditeur.
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; UNE animation visible par modèle (carré / curseur qui respire) ; pas d'animation d'entrée.
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const A = require("../aides-inspire-studios");
const I = require("../aides-illus-a03");
const { DOUX, racineDe, lien, caps, trait, souffle, carre, horaires, coordonnees, lettre, nomDuSite } = A;
const { dessin, piece, bouton, colLiens, pied11 } = I;
const FAM = "studios-creatifs";
const MARGE = ["56px", "32px", "20px"];
const PAGES = [["Accueil", "/"], ["Réalisations", "/catalogue"], ["Journal", "/blog"], ["Questions", "/faq"], ["Espace client", "/connexion"]];
const texte = (k, t, o = {}) => k.T(`<p>${t}</p>`, { fontSize: `${o.taille || 16}px`, lineHeight: 1.65, color: o.couleur, fontFamily: o.police || k.S.font, maxWidth: o.max || "520px", textAlign: o.align, fontWeight: o.poids });

// ═══ ft2-302 « Appel de plateau » — studio de design graphique — capture 10 : phrase géante centrée, marque à gauche, une colonne de liens, skyline d'affiches au soleil couchant ═══
const plateau = identite({
  key: "i302", label: "Crème, encre et orange brûlé", humeur: "light",
  fond: "#f3ede2", texte: "#14110f", discret: "#55504a", accent: "#b8400a", surface: "#e8dfcf", encre: "#14110f",
  police: "font.ibm-plex-mono", titres: "font.syne",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#14110f33",
});
const ENCRE = "#14110f", ORANGE = "#b8400a", PECHE = "#f6c8a0", RUST = "#8a2f05";
const appelPlateau = modeleV2({
  id: identifiantV2(302, "appel-de-plateau"), concept: "c-302-appel-de-plateau",
  name: "Appel de plateau", family: FAM,
  description: "Pour un studio de design graphique : une phrase d'appel gigantesque centrée sur un dégradé crème vers pêche, deux boutons, une marque dessinée (pile d'affiches), coordonnées et liens, puis une skyline d'affiches au soleil couchant, ponton et promeneurs.",
  tags: ["studio", "design graphique", "appel à l'action", "phrase géante", "illustration", "soleil couchant", "orange", "angles droits"],
  identity: plateau, racine: racineDe(PECHE),
  widgets: ["html", "text", "link", "sitetitle", "bizcontact", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const etiquette = k.row([souffle(carre(k, ORANGE, "12px"), 3400), caps(k, "Studio de design graphique", { couleur: RUST, suivi: "0.2em" })], { gap: "12px", alignItems: "center", justifyContent: "center" });
    const phrase = G.geant("<p>On fait quoi<br>ensemble ?</p>", { taille: [40, 120], lh: 0.95, suivi: "-0.03em", poids: "800", police: S.head, couleur: ENCRE })(k, env, true);
    const sous = texte(k, "Une marque, une affiche, un livre, un site : racontez-nous l'idée, même brouillonne.", { taille: 18, couleur: "#3a352f", align: "center", max: "560px" });
    const boutons = k.row([bouton(k, "Ouvrir un dossier  →", "/contact", { couleur: "#ffffff", fond: ORANGE, survolFond: ENCRE, survolTexte: "#ffffff", focus: ENCRE }), bouton(k, "Voir les réalisations", "/catalogue", { couleur: ENCRE, bord: ENCRE, survolFond: ENCRE, survolTexte: "#ffffff", focus: ORANGE })], { gap: "14px", justifyContent: "center", flexWrap: "wrap" });
    const haut = G.bande(k, [etiquette, phrase, sous, boutons], { fond: "#f3ede2", degrade: { from: "#f3ede2", to: PECHE, angle: 180 }, colonne: true, gap: "26px", aligne: "center", padV: ["96px", "72px", "52px"], padB: ["72px", "56px", "40px"], padH: MARGE, nom: "Appel" });
    const marque = k.col([piece(k, I.marque302(), { width: "104px" }), nomDuSite(k, env, 30, ENCRE, { fontWeight: "800" }), texte(k, "Le studio qui dessine ce qui se voit.", { taille: 15, couleur: "#3a352f", max: "300px" }), G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Behance", "https://www.behance.net/"]], { taille: 15, couleur: ENCRE, survol: ORANGE, focus: ORANGE })(k, env)], { gap: "12px", alignItems: "flex-start", flexGrow: 3, flexBasis: "0px", minWidth: "260px" });
    const contact = k.col([caps(k, "Nous écrire", { couleur: RUST, suivi: "0.2em" }), coordonnees(k, { taille: 15, couleur: ENCRE, lien: RUST, survol: ENCRE, focus: ORANGE })], { gap: "10px", flexGrow: 2, flexBasis: "0px", minWidth: "220px", alignItems: "flex-start" });
    const liens = colLiens(k, "Le studio", PAGES, { titre: RUST, texte: ENCRE, survol: ORANGE, focus: ORANGE, min: "180px" });
    const milieu = G.bande(k, [k.row([marque, liens, contact], { rowGap: "36px", columnGap: "48px", alignItems: "flex-start", width: "100%", flexWrap: "wrap" }), trait(k, "#14110f55", "1px"), G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#3a352f", liens: ENCRE })(k, env)], { fond: PECHE, colonne: true, gap: "30px", padV: ["24px", "20px", "12px"], padB: ["26px", "22px", "18px"], padH: MARGE, nom: "Liens" });
    const scene = G.bande(k, dessin(k, I.sceneAffiches(1440, 380), I.sceneAffiches(480, 320)), { fond: PECHE, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", aligne: "stretch", gap: "0px", nom: "Skyline d'affiches" });
    return [G.racine(k, [haut, milieu, scene])];
  },
}, FAM);

// ═══ ft2-303 « Tirages en damier » — studio photo — capture 10 : halo au sommet, objectif dessiné, phrase centrée, colonnes à droite, planche de vignettes dessinées en bas ═══
const tirages = identite({
  key: "i303", label: "Noir graphite et lime acide", humeur: "dark",
  fond: "#0e0e10", texte: "#f4f4ef", discret: "#b4b4ae", accent: "#d4ff3a", surface: "#17171b", surEncre: "#f4f4ef", encre: "#0e0e10",
  police: "font.space-mono", titres: "font.space-grotesk",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#f4f4ef26",
});
const NOIR = "#0e0e10", LIME = "#d4ff3a";
const tiragesDamier = modeleV2({
  id: identifiantV2(303, "tirages-en-damier"), concept: "c-303-tirages-en-damier",
  name: "Tirages en damier", family: FAM,
  description: "Pour un studio photo : un halo lime sur noir graphite, un objectif dessiné (diaphragme à six lames), une phrase d'appel centrée, trois colonnes de liens et de coordonnées, puis une planche de quatre vignettes dessinées en pellicule.",
  tags: ["studio photo", "objectif", "pellicule", "vignettes", "halo", "noir", "lime", "angles droits"],
  identity: tirages, racine: racineDe(NOIR),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const mono = piece(k, I.marque303(), { width: "128px", alignSelf: "center" });
    const phrase = G.geant("<p>Le prochain tirage,<br>c'est le vôtre ?</p>", { taille: [38, 104], lh: 0.98, suivi: "-0.03em", poids: "600", police: S.head, couleur: "#f4f4ef" })(k, env, true);
    const sous = texte(k, "Portraits, produits, éditoriaux : un rendez-vous, une première planche contact.", { taille: 18, couleur: "#d4d4cd", align: "center" });
    const boutons = k.row([bouton(k, "Parlons projet  ↗", "/contact", { couleur: NOIR, fond: LIME, survolFond: "#ffffff", survolTexte: NOIR, focus: "#ffffff" }), bouton(k, "Voir le portfolio", "/catalogue", { couleur: "#f4f4ef", bord: "#f4f4ef88", survolFond: "#f4f4ef", survolTexte: NOIR, focus: LIME })], { gap: "14px", justifyContent: "center", flexWrap: "wrap" });
    const haut = G.bande(k, [mono, phrase, sous, boutons], { fond: NOIR, degrade: { from: "#33460a", to: NOIR, angle: 180 }, colonne: true, gap: "26px", aligne: "center", padV: ["88px", "68px", "48px"], padB: ["64px", "52px", "40px"], padH: MARGE, nom: "Appel" });
    const ligneLiens = k.row(PAGES.map(([t, u]) => lien(k, t, u, { taille: 15, poids: "500", couleur: "#f4f4ef", survol: { color: LIME, transform: { y: -3 } }, focus: LIME })), { rowGap: "0px", columnGap: "26px", alignItems: "center", flexWrap: "wrap" });
    const entete = k.row([nomDuSite(k, env, 28, "#f4f4ef", { fontWeight: "700" }), ligneLiens], { rowGap: "12px", columnGap: "40px", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap" });
    const contact = k.row([coordonnees(k, { taille: 14, couleur: "#f4f4ef", lien: "#ffffff", survol: LIME, focus: LIME, layout: "inline" }), G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Vimeo", "https://vimeo.com/"]], { taille: 15, couleur: "#f4f4ef", survol: LIME, focus: LIME })(k, env)], { rowGap: "12px", columnGap: "40px", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap" });
    const scene = G.bande(k, dessin(k, I.sceneVignettes(1440, 250, 4), I.sceneVignettes(480, 250, 2)), { fond: NOIR, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", aligne: "stretch", gap: "0px", nom: "Planche" });
    const milieu = G.bande(k, [entete, contact, trait(k, "#f4f4ef33", "1px"), G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#b4b4ae", liens: "#f4f4ef" })(k, env)], { fond: NOIR, colonne: true, gap: "22px", padV: ["40px", "32px", "28px"], padB: ["32px", "28px", "24px"], padH: MARGE, nom: "Colonnes" });
    return [G.racine(k, [haut, scene, milieu])];
  },
}, FAM);

// ═══ ft2-304 « Console de montage » — studio de motion design et de jeu — capture 10 : phrase centrée, marque pixel, liste de commandes, paysage de synthèse en bas ═══
const console_ = identite({
  key: "i304", label: "Console graphite et violet", humeur: "dark",
  fond: "#1d0a55", texte: "#e6edf3", discret: "#c5b8f0", accent: "#5eead4", surface: "#2a1470", surEncre: "#e6edf3", encre: "#1d0a55",
  police: "font.jetbrains-mono", titres: "font.jetbrains-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#e6edf333",
});
const NUIT_V = "#1d0a55", MENTHE = "#5eead4";
const consoleMontage = modeleV2({
  id: identifiantV2(304, "console-de-montage"), concept: "c-304-console-de-montage",
  name: "Console de montage", family: FAM,
  description: "Pour un studio de motion design ou de jeu : un fantôme en pixels, une phrase d'appel centrée en monospace, des commandes cliquables et une sortie de coordonnées au curseur qui respire, puis un paysage de synthèse (soleil en tranches, montagnes, grille en perspective).",
  tags: ["motion design", "jeu", "console", "pixel", "synthwave", "violet", "menthe", "monospace", "angles droits"],
  identity: console_, racine: racineDe(NUIT_V),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const mono = piece(k, I.marque304(), { width: "104px", alignSelf: "center" });
    const phrase = G.geant("<p>Prêts pour la<br>prochaine scène ?</p>", { taille: [34, 96], lh: 1, suivi: "-0.04em", poids: "700", police: S.font, couleur: "#ffffff" })(k, env, true);
    const boutons = k.row([bouton(k, "$ ouvrir portfolio", "/catalogue", { couleur: NUIT_V, fond: MENTHE, survolFond: "#ffffff", survolTexte: NUIT_V, focus: "#ffffff" }), bouton(k, "$ nous écrire", "/contact", { couleur: "#ffffff", bord: "#ffffff99", survolFond: "#ffffff", survolTexte: NUIT_V, focus: MENTHE })], { gap: "14px", justifyContent: "center", flexWrap: "wrap" });
    const haut = G.bande(k, [mono, caps(k, "# studio de motion design et de jeu", { couleur: MENTHE, suivi: "0.12em", extra: { textAlign: "center" } }), phrase, boutons], { fond: NUIT_V, degrade: { from: "#12062f", to: NUIT_V, angle: 180 }, colonne: true, gap: "24px", aligne: "center", padV: ["88px", "68px", "48px"], padB: ["56px", "44px", "36px"], padH: MARGE, nom: "Appel" });
    const cmd = (t, u) => lien(k, `$ ouvrir ${t}`, u, { taille: 16, poids: "500", couleur: "#e6edf3", bloc: true, h: "46px", survol: { color: MENTHE, backgroundColor: "#2a1470", transform: { x: 8 } }, focus: MENTHE, extra: { flexGrow: 1, flexBasis: "40%", minWidth: "190px", paddingLeft: "10px", paddingRight: "10px" } });
    const barre = k.row([carre(k, "#ff6b6b", "12px"), carre(k, "#ffd166", "12px"), carre(k, MENTHE, "12px"), k.T("<p>studio — console de montage</p>", { fontSize: "13px", color: "#c5b8f0", fontFamily: S.font, marginLeft: "10px" })], { gap: "8px", alignItems: "center", backgroundColor: "#2a1470", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "18px", paddingRight: "18px", width: "100%" });
    const curseur = souffle(k.col([], { width: "12px", height: "22px", backgroundColor: MENTHE, borderRadius: "0px" }), 1600);
    const corps = k.col([nomDuSite(k, env, 26, MENTHE, { fontWeight: "700", fontFamily: S.font }), k.row([cmd("journal", "/blog"), cmd("questions", "/faq"), cmd("espace-client", "/connexion"), cmd("accueil", "/")], { rowGap: "0px", columnGap: "20px", width: "100%", flexWrap: "wrap" }), k.row([k.T("<p>&gt; contact --afficher</p>", { fontSize: "13px", color: MENTHE, fontFamily: S.font }), curseur], { gap: "10px", alignItems: "center", marginTop: "10px" }), coordonnees(k, { taille: 15, couleur: "#e6edf3", lien: "#ffffff", survol: MENTHE, focus: MENTHE })], { gap: "12px", alignItems: "flex-start", width: "100%", paddingTop: "26px", paddingBottom: "30px", paddingLeft: "28px", paddingRight: "28px" }, { paddingLeft: "20px", paddingRight: "20px" }, { paddingLeft: "16px", paddingRight: "16px" });
    const fenetre = k.col([barre, corps], { backgroundColor: "#12062f", gap: "0px", width: "100%", maxWidth: "1040px", marginLeft: "auto", marginRight: "auto", borderStyle: "solid", borderWidth: "2px", borderColor: MENTHE, borderRadius: "0px", transitionDuration: DOUX });
    const milieu = G.bande(k, [fenetre, G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d9d0f5", liens: "#ffffff" })(k, env)], { fond: NUIT_V, colonne: true, gap: "26px", padV: ["16px", "16px", "8px"], padB: ["32px", "28px", "24px"], padH: MARGE, nom: "Fenêtre" });
    const scene = G.bande(k, dessin(k, I.sceneSynth(1440, 380), I.sceneSynth(480, 320)), { fond: NUIT_V, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", aligne: "stretch", gap: "0px", nom: "Paysage" });
    return [G.racine(k, [haut, milieu, scene])];
  },
}, FAM);

// ═══ ft2-305 « Signature du studio » — studio de lettrage — capture 10 : phrase géante, grand monogramme dessiné à gauche, lettre et liens à droite, bandes ondulées en bas ═══
const signature = identite({
  key: "i305", label: "Moutarde et encre", humeur: "light",
  fond: "#f2c230", texte: "#141414", discret: "#3a2f00", accent: "#141414", surface: "#e5b41a", encre: "#141414",
  police: "font.manrope", titres: "font.instrument-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#14141466",
});
const MOUTARDE = "#f2c230", NOIR2 = "#141414";
const signatureStudio = modeleV2({
  id: identifiantV2(305, "signature-du-studio"), concept: "c-305-signature-du-studio",
  name: "Signature du studio", family: FAM,
  description: "Pour un studio de lettrage : une phrase géante en serif sur jaune moutarde, un grand monogramme S dessiné à gauche, la lettre d'information et les liens à droite, puis cinq bandes ondulées qui montent du bas, un soleil pâle en fond.",
  tags: ["lettrage", "monogramme", "moutarde", "serif", "vagues", "ondulations", "lettre d'information", "angles droits"],
  identity: signature, racine: racineDe(MOUTARDE),
  widgets: ["html", "sitetitle", "text", "link", "emailsubscribe", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant("<p>On dessine<br>vos lettres.</p>", { taille: [48, 150], lh: 0.92, suivi: "-0.03em", poids: "400", police: S.head, couleur: NOIR2 })(k, env, true);
    const boutons = k.row([bouton(k, "Commander un lettrage  →", "/contact", { couleur: MOUTARDE, fond: NOIR2, survolFond: "#ffffff", survolTexte: NOIR2, focus: "#ffffff" }), bouton(k, "Voir les planches", "/catalogue", { couleur: NOIR2, bord: NOIR2, survolFond: NOIR2, survolTexte: MOUTARDE, focus: NOIR2 })], { gap: "14px", justifyContent: "center", flexWrap: "wrap" });
    const haut = G.bande(k, [souffle(carre(k, NOIR2, "16px"), 3600), phrase, boutons], { fond: MOUTARDE, colonne: true, gap: "28px", aligne: "center", padV: ["96px", "72px", "52px"], padB: ["64px", "48px", "36px"], padH: MARGE, nom: "Appel" });
    const gauche = k.col([piece(k, I.marque305(), { width: "190px" }), nomDuSite(k, env, 30, NOIR2, { fontWeight: "400", fontSize: "fluid:28-40" })], { gap: "14px", alignItems: "flex-start", flexGrow: 2, flexBasis: "0px", minWidth: "220px" });
    const abo = lettre(k, env, { titre: "Lettre du studio", intro: "Un lettrage du mois, les coulisses, de temps en temps.", bouton: "S'abonner", largeur: "100%", accent: NOIR2, texte: NOIR2, surBouton: MOUTARDE, fond: MOUTARDE, survolBouton: "#ffffff", survolTexte: NOIR2, soulignement: "2px", couleurTitre: NOIR2, focus: NOIR2 });
    const liens = k.row([["Réalisations", "/catalogue"], ["Journal", "/blog"], ["Questions", "/faq"], ["Contact", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 17, poids: "700", couleur: NOIR2, soulign: true, survol: { color: "#6b4f00", transform: { y: -3 } }, focus: NOIR2, extra: { textUnderlineOffset: "6px", marginRight: "22px" } })), { gap: "0px", flexWrap: "wrap", alignItems: "center" });
    const droite = k.col([abo, liens], { gap: "18px", flexGrow: 3, flexBasis: "0px", minWidth: "300px", alignItems: "stretch" });
    const milieu = G.bande(k, [k.row([gauche, droite], { rowGap: "32px", columnGap: "56px", alignItems: "flex-start", width: "100%", flexWrap: "wrap" }), trait(k, NOIR2, "2px"), G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#2b2000", liens: NOIR2 })(k, env)], { fond: MOUTARDE, colonne: true, gap: "30px", padV: ["16px", "16px", "8px"], padB: ["40px", "32px", "24px"], padH: MARGE, nom: "Monogramme" });
    const scene = G.bande(k, dessin(k, I.sceneVagues(1440, 300), I.sceneVagues(480, 240)), { fond: MOUTARDE, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", aligne: "stretch", gap: "0px", nom: "Vagues" });
    return [G.racine(k, [haut, milieu, scene])];
  },
}, FAM);

// ═══ ft2-306 « Plateau et régie » — studio de production — capture 11 : carte d'appel sombre (faisceaux de projecteurs), fondu, pied sombre en colonnes ═══
const regie = identite({
  key: "i306", label: "Noir brique et crème", humeur: "dark",
  fond: "#1a0e0b", texte: "#f8ece6", discret: "#e3d4c8", accent: "#e8a07f", surface: "#2a1710", encre: "#1a0e0b",
  police: "font.mulish", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#2a171033",
});
const CRM = "#efe4d0", BRIQUE = "#9c2f22", SOMBRE6 = "#1a0e0b";
const plateauRegie = modeleV2({
  id: identifiantV2(306, "plateau-et-regie"), concept: "c-306-plateau-et-regie",
  name: "Plateau et régie", family: FAM,
  description: "Pour un studio de production : une carte d'appel sombre éclairée par quatre faisceaux de projecteurs sur un plateau, un fondu crème vers noir brique, puis un pied en colonnes (clap dessiné, adresse, horaires, pages, réseaux).",
  tags: ["production", "projecteurs", "carte d'appel", "fondu", "brique", "crème", "horaires", "angles droits"],
  identity: regie, racine: racineDe(SOMBRE6),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "bizhours", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const art = piece(k, I.artFaisceaux(1200, 250));
    const contenu = [k.row([souffle(carre(k, "#f3ede2", "12px"), 3400), caps(k, "Plateau ouvert", { couleur: "#f3ede2", suivi: "0.22em" })], { gap: "12px", alignItems: "center" }),
      G.geant("<p>Prêts à tourner ?</p>", { taille: [40, 96], lh: 1, suivi: "-0.02em", poids: "600", police: S.head, couleur: "#f8ece6" })(k, env, true),
      k.row([bouton(k, "Réserver le plateau  →", "/contact", { couleur: BRIQUE, fond: "#f3ede2", survolFond: "#ffffff", survolTexte: BRIQUE, focus: "#ffffff" }), bouton(k, "Voir les tournages", "/catalogue", { couleur: "#f8ece6", bord: "#f8ece699", survolFond: "#f8ece6", survolTexte: "#1d0f0d", focus: "#ffffff" })], { gap: "14px", justifyContent: "center", flexWrap: "wrap" })];
    const marque = k.col([piece(k, I.marque306(), { width: "110px" }), nomDuSite(k, env, 26, "#f8ece6", { fontWeight: "600" }), texte(k, "Plateaux, régie et post-production.", { taille: 15, couleur: "#e3d4c8", max: "260px" })], { gap: "12px", alignItems: "flex-start", flexGrow: 2, flexBasis: "0px", minWidth: "220px" });
    const adresse = k.col([caps(k, "Adresse", { couleur: "#e8a07f", suivi: "0.16em" }), coordonnees(k, { taille: 15, couleur: "#f8ece6", lien: "#ffffff", survol: "#e8a07f", focus: "#ffffff" })], { gap: "10px", flexGrow: 2, flexBasis: "0px", minWidth: "220px", alignItems: "flex-start" });
    const heures = k.col([caps(k, "Horaires", { couleur: "#e8a07f", suivi: "0.16em" }), horaires(k, { taille: 15, couleur: "#f8ece6" })], { gap: "10px", flexGrow: 2, flexBasis: "0px", minWidth: "220px", alignItems: "flex-start" });
    const pages = colLiens(k, "Pages", PAGES, { titre: "#e8a07f", texte: "#f8ece6", survol: "#e8a07f", focus: "#ffffff" });
    const reseaux = k.col([caps(k, "Réseaux", { couleur: "#e8a07f", suivi: "0.16em" }), G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, couleur: "#f8ece6", survol: "#e8a07f", focus: "#ffffff" })(k, env)], { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "160px", alignItems: "flex-start" });
    return [G.racine(k, pied11(k, env, G, { pos: "haut", art, carteFond: "#1d0f0d", clair: CRM, sombre: SOMBRE6, contenu, pied: [k.row([marque, adresse, heures, pages, reseaux], { rowGap: "32px", columnGap: "36px", alignItems: "flex-start", width: "100%", flexWrap: "wrap" }), trait(k, "#f8ece633", "1px"), G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#e3d4c8", liens: "#ffffff" })(k, env)] }))];
  },
}, FAM);

// ═══ ft2-307 « Du brief à la livraison » — agence de marque — capture 11 : carte verte avec frise de motifs de marque en bas, fondu menthe vers vert forêt, pied en colonnes ═══
const frise = identite({
  key: "i307", label: "Vert forêt profond et menthe", humeur: "dark",
  fond: "#07241b", texte: "#ffffff", discret: "#d9f2e6", accent: "#ffb08a", surface: "#0c3b2e", encre: "#07241b",
  police: "font.lexend", titres: "font.epilogue",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "1px", ligne: "#0c3b2e44",
});
const MENTHE_P = "#d9f2e6", FORET = "#0c3b2e", ROUILLE = "#b23a08";
const friseLivraison = modeleV2({
  id: identifiantV2(307, "du-brief-a-la-livraison"), concept: "c-307-du-brief-a-la-livraison",
  name: "Du brief à la livraison", family: FAM,
  description: "Pour une agence de marque : une carte vert forêt qui se termine par une frise de motifs de marque (carrés, quarts de cercle, triangles), un fondu menthe vers vert forêt, puis un pied en colonnes avec cube dessiné, parcours en étapes et coordonnées.",
  tags: ["agence de marque", "motifs", "frise", "carte d'appel", "menthe", "vert forêt", "angles droits"],
  identity: frise, racine: racineDe("#07241b"),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const art = piece(k, I.artMotifs(1200, 200));
    const contenu = [k.row([souffle(carre(k, "#d9f2e6", "12px"), 3000), caps(k, "Agence de marque", { couleur: "#d9f2e6", suivi: "0.22em" })], { gap: "12px", alignItems: "center" }),
      G.geant("<p>Du brief à la livraison,<br>le chemin est visible.</p>", { taille: [32, 80], lh: 1.02, suivi: "-0.02em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env, true),
      k.row([bouton(k, "Lancer un brief  →", "/contact", { couleur: "#ffffff", fond: ROUILLE, survolFond: "#d9f2e6", survolTexte: FORET, focus: "#ffffff" }), bouton(k, "Voir les marques", "/catalogue", { couleur: "#ffffff", bord: "#ffffffaa", survolFond: "#ffffff", survolTexte: FORET, focus: "#d9f2e6" })], { gap: "14px", justifyContent: "center", flexWrap: "wrap" })];
    const etape = (n, t, u) => k.col([caps(k, `Étape ${n}`, { couleur: "#ffb08a", suivi: "0.18em" }), lien(k, t, u, { taille: 18, poids: "700", police: S.head, couleur: "#ffffff", bloc: true, h: "52px", survol: { color: "#ffb08a", transform: { x: 6 } }, focus: "#ffffff" })], { gap: "2px", flexGrow: 1, flexBasis: "0px", minWidth: "170px", alignItems: "flex-start", paddingTop: "14px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "3px", borderColor: "#d9f2e6", borderRadius: "0px" });
    const cellules = k.row([etape("1", "Poser un brief", "/contact"), etape("2", "Lire le journal", "/blog"), etape("3", "Questions", "/faq"), etape("4", "Réalisations", "/catalogue"), etape("5", "Espace client", "/connexion")], { rowGap: "18px", columnGap: "20px", width: "100%", alignItems: "flex-start", flexWrap: "wrap" });
    const bas = k.row([k.row([piece(k, I.marque307(), { width: "84px" }), nomDuSite(k, env, 24, "#ffffff", { fontWeight: "800" })], { gap: "16px", alignItems: "center" }), coordonnees(k, { taille: 15, couleur: "#ffffff", lien: "#ffffff", survol: "#ffb08a", focus: "#ffffff", layout: "inline" })], { rowGap: "18px", columnGap: "40px", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap" });
    return [G.racine(k, pied11(k, env, G, { pos: "bas", art, carteFond: FORET, clair: MENTHE_P, sombre: "#07241b", contenu, pied: [cellules, bas, trait(k, "#ffffff33", "1px"), G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d9f2e6", liens: "#ffffff" })(k, env)] }))];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Studios créatifs", target: 6, built: true,
  description: "Pieds de studios créatifs, angles droits, illustrés : skyline d'affiches, planche de vignettes, paysage de synthèse, vagues et monogramme, carte d'appel à faisceaux, carte à motifs de marque.",
  models: [appelPlateau, tiragesDamier, consoleMontage, signatureStudio, plateauRegie, friseLivraison],
};
