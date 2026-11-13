// Famille v2 « Studios créatifs » — 6 modèles (ft2-302 à ft2-307), « inspirés de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Studio de design graphique, studio photo, motion design et jeu, lettrage, production, agence de marque. AUCUNE image inventée, aucun chiffre ni coordonnée inventés : adresse, téléphone et horaires
// viennent des Données de l'entreprise ; les intitulés de rubriques et adresses de réseaux sont des EXEMPLES à renommer dans l'éditeur.
// Inspirations : (10) gigantesque phrase d'appel centrée puis logo à gauche et colonnes de liens à droite ; (11) carte d'appel sombre puis colonnes adresse / liens / réseaux ; (12) demi-page d'information, bandeau de lettre, liens rapides en deux colonnes.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; UNE animation visible par modèle (carré qui respire, curseur de console, bouton qui glisse, case qui s'éclaire). Pas d'animation d'entrée.
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const A = require("../aides-inspire-studios");
const { DOUX, racineDe, lien, caps, trait, souffle, carre, horaires, coordonnees, lettre, nomDuSite, GK, compact } = A;
const FAM = "studios-creatifs";
const MARGE = ["56px", "32px", "20px"];

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-302 « Appel de plateau » — studio de design graphique — archétype F : bandeau d'appel XXL en haut + liens en UNE colonne étroite à droite
// Idée (capture 10) : une phrase gigantesque d'appel à gauche sur crème, un bouton orange brûlé, et à droite, étroite, la seule colonne de liens du pied ; en bas une bande encre avec les coordonnées. Pas de colonnes numérotées.
// Polices : Syne (titres) et IBM Plex Mono. Mobile : la colonne de liens passe sous l'appel.
const plateau = identite({
  key: "i302", label: "Crème, encre et orange brûlé", humeur: "light",
  fond: "#f3ede2", texte: "#14110f", discret: "#55504a", accent: "#b8400a", surface: "#e8dfcf", encre: "#14110f",
  police: "font.ibm-plex-mono", titres: "font.syne",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#14110f33",
});
const CREME = "#f3ede2", ENCRE = "#14110f", ORANGE = "#b8400a";
const appelPlateau = modeleV2({
  id: identifiantV2(302, "appel-de-plateau"), concept: "c-302-appel-de-plateau",
  name: "Appel de plateau", family: FAM,
  description: "Pour un studio de design graphique : un bandeau orange brûlé XXL avec une phrase d'appel gigantesque et un bouton blanc, puis, sur crème, les coordonnées et une seule colonne étroite de liens à droite.",
  tags: ["studio", "design graphique", "appel à l'action", "phrase géante", "crème", "orange", "angles droits"],
  identity: plateau,
  racine: racineDe(ENCRE),
  widgets: ["text", "link", "sitetitle", "bizcontact", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const pt = souffle(carre(k, "#ffffff", "12px"), 3400);
    const phrase = G.geant("<p>On fait quoi<br>ensemble ?</p>", { taille: [36, 118], lh: 0.92, suivi: "-0.03em", poids: "800", police: S.head, couleur: "#ffffff" })(k, env);
    const bouton = lien(k, "Ouvrir un dossier  →", "/contact", { taille: 18, poids: "700", couleur: ORANGE, h: "64px", padH: "34px", survol: { backgroundColor: ENCRE, color: "#ffffff", transform: { x: 10 } }, focus: "#ffffff", extra: { backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "2px", borderColor: "#ffffff" } });
    const appel = G.bande(k, [k.row([pt, caps(k, "Studio de design graphique", { couleur: "#ffffff", suivi: "0.2em" })], { gap: "12px", alignItems: "center", width: "100%" }), phrase, bouton], { fond: ORANGE, colonne: true, gap: "26px", aligne: "flex-start", padV: ["96px", "64px", "44px"], padB: ["72px", "52px", "40px"], padH: MARGE, nom: "Appel" });
    const nom = nomDuSite(k, env, 30, ENCRE, { fontWeight: "800" });
    const mot = k.T("<p>Une marque, une affiche, un livre, un site : racontez-nous l'idée, même brouillonne. Nous répondons avec une première piste.</p>", { fontSize: "16px", lineHeight: 1.65, color: "#3a352f", fontFamily: S.font, maxWidth: "520px" });
    const liens = [["Accueil", "/"], ["Réalisations", "/catalogue"], ["Journal", "/blog"], ["Questions", "/faq"], ["Espace client", "/connexion"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: ENCRE, bloc: true, h: "52px", survol: { color: ORANGE, transform: { x: 8 } }, focus: ORANGE, extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#14110f55" } }));
    const gauche = G.colonne(k, [nom, mot, caps(k, "Nous écrire", { couleur: ORANGE, suivi: "0.2em", extra: { marginTop: "14px" } }), coordonnees(k, { taille: 15, couleur: ENCRE, lien: ORANGE, survol: ENCRE, focus: ORANGE })], { poids: 4, min: "300px", gap: "12px" });
    const droite = G.colonne(k, [k.col(liens, { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "2px", borderColor: ENCRE })], { poids: 0, base: "260px", min: "240px", extra: { flexShrink: 0 } });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#3a352f", liens: ENCRE })(k, env);
    const milieu = G.bande(k, [k.row([gauche, droite], { rowGap: "40px", columnGap: "72px", alignItems: "flex-start", width: "100%", flexWrap: "wrap" }), trait(k, ENCRE, "2px"), mentions], { fond: CREME, colonne: true, gap: "36px", padV: ["56px", "44px", "36px"], padB: ["26px", "22px", "18px"], padH: MARGE, nom: "Liens" });
    return [G.racine(k, [appel, milieu])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-303 « Tirages en damier » — studio photo et marque — archétype C : GRILLE DE CASES ÉGALES (damier de 8 cases à angles droits), chaque case est un lien ou une information
// Idée (capture 11, colonnes → cases) : huit cases carrées sur noir, alternant deux gris, lime acide au survol ; nom du studio, portfolio, journal, projet, coordonnées, Instagram, questions, espace client.
// Polices : Space Grotesk et Space Mono. Mobile : deux cases par rangée.
const tirages = identite({
  key: "i303", label: "Noir graphite et lime acide", humeur: "dark",
  fond: "#0e0e10", texte: "#f4f4ef", discret: "#b4b4ae", accent: "#d4ff3a", surface: "#17171b", surEncre: "#f4f4ef", encre: "#0e0e10",
  police: "font.space-mono", titres: "font.space-grotesk",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#f4f4ef26",
});
const NOIR = "#0e0e10", GRIS1 = "#17171b", GRIS2 = "#202026", LIME = "#d4ff3a";
const tiragesDamier = modeleV2({
  id: identifiantV2(303, "tirages-en-damier"), concept: "c-303-tirages-en-damier",
  name: "Tirages en damier", family: FAM,
  description: "Pour un studio photo ou de marque : un damier de huit cases carrées sur noir (nom, portfolio, journal, projet, coordonnées, Instagram, questions, espace client) qui virent au lime acide au survol.",
  tags: ["studio photo", "damier", "cases", "noir", "lime", "grille", "angles droits"],
  identity: tirages,
  racine: racineDe(NOIR),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const base = { flexGrow: 1, flexBasis: "25%", minWidth: "150px", minHeight: "190px", borderStyle: "solid", borderWidth: "1px", borderColor: "#f4f4ef1f", borderRadius: "0px", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "22px", paddingRight: "22px", boxSizing: "border-box" };
    const caseLien = (t, u, fond, sous) => lien(k, t, u, { taille: 24, poids: "600", police: S.head, couleur: "#f4f4ef", bloc: true, h: "190px", lh: 1.1, survol: { backgroundColor: LIME, color: NOIR, transform: { y: -4 } }, focus: LIME, extra: { ...base, backgroundColor: fond, alignItems: "flex-end", justifyContent: "space-between", paddingLeft: "22px", paddingRight: "22px" } });
    const caseFixe = (enfants, fond) => k.col(enfants, { ...base, backgroundColor: fond, justifyContent: "space-between", gap: "12px" });
    const pt = souffle(carre(k, LIME, "14px"), 3000);
    const nom = nomDuSite(k, env, 28, "#f4f4ef", { fontWeight: "700" });
    const c1 = caseFixe([k.row([pt, caps(k, "Studio", { couleur: LIME, suivi: "0.2em" })], { gap: "10px", alignItems: "center" }), nom], GRIS2);
    const c5 = caseFixe([caps(k, "Contact", { couleur: LIME, suivi: "0.2em" }), coordonnees(k, { taille: 14, couleur: "#f4f4ef", lien: "#ffffff", survol: LIME, focus: LIME })], GRIS2);
    const cases = [c1, caseLien("Portfolio ↗", "/catalogue", GRIS1), caseLien("Journal ↗", "/blog", GRIS2), caseLien("Parlons projet ↗", "/contact", GRIS1),
      c5, caseLien("Instagram ↗", "https://www.instagram.com/", GRIS1), caseLien("Questions ↗", "/faq", GRIS2), caseLien("Espace client ↗", "/connexion", GRIS1)];
    const damier = k.row(cases, { gap: "0px", alignItems: "stretch", width: "100%", flexWrap: "wrap" });
    const haut = G.bande(k, [damier], { fond: NOIR, colonne: true, padV: ["56px", "40px", "20px"], padB: ["0px", "0px", "0px"], padH: MARGE, nom: "Damier" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#b4b4ae", liens: "#f4f4ef" })(k, env);
    const bas = G.bande(k, [mentions], { fond: NOIR, colonne: true, padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: MARGE, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-304 « Console de montage » — studio de motion design et de jeu — archétype K : FENÊTRE / CONSOLE (le pied ressemble à un bloc d'interface)
// Idée : une fenêtre de terminal posée sur un aplat violet : barre de titre à trois carrés, nom du studio en vert menthe, commandes cliquables (« ouvrir portfolio »…), sortie « contact » et curseur qui respire.
// Polices : JetBrains Mono (tout). Mobile : la fenêtre prend toute la largeur, les colonnes s'empilent.
const console_ = identite({
  key: "i304", label: "Console graphite et violet", humeur: "dark",
  fond: "#0d1117", texte: "#e6edf3", discret: "#9aa7b5", accent: "#5eead4", surface: "#161d29", surEncre: "#e6edf3", encre: "#0d1117",
  police: "font.jetbrains-mono", titres: "font.jetbrains-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#e6edf333",
});
const VIOLET = "#4b2fd0", FEN = "#0d1117", BARRE = "#1b2432", MENTHE = "#5eead4";
const consoleMontage = modeleV2({
  id: identifiantV2(304, "console-de-montage"), concept: "c-304-console-de-montage",
  name: "Console de montage", family: FAM,
  description: "Pour un studio de motion design ou de jeu : une fenêtre de terminal sur aplat violet, avec barre de titre, commandes cliquables vers les pages, sortie des coordonnées et curseur qui respire.",
  tags: ["motion design", "jeu", "console", "terminal", "violet", "menthe", "monospace", "angles droits"],
  identity: console_,
  racine: racineDe(VIOLET),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const barre = k.row([carre(k, "#ff6b6b", "12px"), carre(k, "#ffd166", "12px"), carre(k, MENTHE, "12px"), k.T("<p>studio — console de montage</p>", { fontSize: "13px", color: "#9aa7b5", fontFamily: S.font, marginLeft: "10px" })], { gap: "8px", alignItems: "center", backgroundColor: BARRE, paddingTop: "12px", paddingBottom: "12px", paddingLeft: "18px", paddingRight: "18px", width: "100%" });
    const nom = nomDuSite(k, env, 30, MENTHE, { fontWeight: "700", fontFamily: S.font });
    const cmd = (t, u) => lien(k, `$ ouvrir ${t}`, u, { taille: 17, poids: "500", couleur: "#e6edf3", bloc: true, h: "46px", survol: { color: MENTHE, backgroundColor: "#1b2432", transform: { x: 8 } }, focus: MENTHE, extra: { flexGrow: 1, flexBasis: "40%", minWidth: "220px", paddingLeft: "10px", paddingRight: "10px" } });
    const commandes = k.row([cmd("portfolio", "/catalogue"), cmd("journal", "/blog"), cmd("questions", "/faq"), cmd("espace-client", "/connexion"), cmd("contact", "/contact")], { rowGap: "0px", columnGap: "24px", width: "100%", flexWrap: "wrap" });
    const curseur = souffle(k.col([], { width: "12px", height: "22px", backgroundColor: MENTHE, borderRadius: "0px" }), 1600);
    const invite = k.row([k.T("<p>$</p>", { fontSize: "17px", color: MENTHE, fontFamily: S.font }), curseur], { gap: "10px", alignItems: "center", marginTop: "6px" });
    const sortie = k.col([k.T("<p>&gt; contact --afficher</p>", { fontSize: "13px", color: MENTHE, fontFamily: S.font }), coordonnees(k, { taille: 15, couleur: "#e6edf3", lien: "#ffffff", survol: MENTHE, focus: MENTHE })], { gap: "10px", width: "100%", paddingTop: "18px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#e6edf333", borderRadius: "0px" });
    const corps = k.col([k.T("<p># bienvenue au studio</p>", { fontSize: "13px", color: "#9aa7b5", fontFamily: S.font }), nom, commandes, sortie, invite], { gap: "12px", alignItems: "flex-start", width: "100%", paddingTop: "28px", paddingBottom: "32px", paddingLeft: "28px", paddingRight: "28px" }, { paddingLeft: "20px", paddingRight: "20px" }, { paddingLeft: "16px", paddingRight: "16px" });
    const fenetre = k.col([barre, corps], { backgroundColor: FEN, gap: "0px", width: "100%", maxWidth: "1040px", marginLeft: "auto", marginRight: "auto", borderStyle: "solid", borderWidth: "2px", borderColor: "#0d1117", borderRadius: "0px", transitionDuration: DOUX });
    const haut = G.bande(k, [fenetre], { fond: VIOLET, colonne: true, padV: ["72px", "52px", "32px"], padB: ["40px", "32px", "24px"], padH: MARGE, nom: "Fenêtre" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#ffffff", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [mentions], { fond: VIOLET, colonne: true, padV: ["16px", "14px", "12px"], padB: ["24px", "20px", "16px"], padH: MARGE, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-305 « Signature du studio » — studio de lettrage — archétype B : NOM MONUMENTAL seul au centre, très peu de liens, grand vide
// Idée : sur jaune moutarde, le nom du site en immense serif centré, un petit carré qui respire au-dessus, trois liens et une adresse e-mail en dessous : rien d'autre. Le vide fait la signature.
// Polices : Instrument Serif (nom) et Manrope. Mobile : le nom reste monumental mais se réduit (taille fluide).
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
  description: "Pour un studio de lettrage : le nom du site en immense serif centré sur jaune moutarde, un carré qui respire, trois liens et une adresse e-mail. Très peu d'éléments, beaucoup de vide.",
  tags: ["lettrage", "nom monumental", "moutarde", "serif", "minimal", "centré", "angles droits"],
  identity: signature,
  racine: racineDe(MOUTARDE),
  widgets: ["sitetitle", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const pt = souffle(carre(k, NOIR2, "16px"), 3600);
    const nom = nomDuSite(k, env, 160, NOIR2, { fontWeight: "400", letterSpacing: "-0.03em", lineHeight: 0.95, fontSize: "fluid:56-190", textAlign: "center", overflowWrap: "anywhere" });
    nom.parts.link.styles.desktop.textAlign = "center";
    const liens = k.row([["Réalisations", "/catalogue"], ["Journal", "/blog"], ["Nous écrire", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 18, poids: "700", couleur: NOIR2, soulign: true, survol: { color: "#6b4f00", transform: { y: -3 } }, focus: NOIR2, extra: { textUnderlineOffset: "6px", marginLeft: "14px", marginRight: "14px" } })), { gap: "0px", justifyContent: "center", alignItems: "center" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#2b2000", liens: NOIR2 })(k, env, true);
    const centre = k.col([pt, nom, liens, k.col([], { height: "56px" }), mentions], { alignItems: "center", gap: "26px", width: "100%", textAlign: "center" });
    const haut = G.bande(k, [centre], { fond: MOUTARDE, colonne: true, aligne: "center", padV: ["160px", "110px", "72px"], padB: ["40px", "32px", "28px"], padH: MARGE, nom: "Signature" });
    return [G.racine(k, [haut])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-306 « Plateau et régie » — studio de production — archétype E : DEUX DEMI-PAGES bord à bord de couleurs opposées (gauche = venir, droite = agir)
// Idée (capture 12) : à gauche, crème, « Venez au studio » avec adresse, téléphone et horaires ; à droite, brique, la lettre d'information puis les liens rapides sur deux colonnes et les réseaux. Une barre brique foncé ferme.
// Polices : Fraunces (titres) et Mulish. Mobile : les deux panneaux s'empilent.
const regie = identite({
  key: "i306", label: "Crème et brique", humeur: "light",
  fond: "#efe4d0", texte: "#2a1710", discret: "#5c4034", accent: "#9c2f22", surface: "#e3d4b8", encre: "#2a1710",
  police: "font.mulish", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#2a171033",
});
const CRM = "#efe4d0", BRIQUE = "#9c2f22", BRIQUE_F = "#5c1b13", ENC3 = "#2a1710";
const panneau = (k, enfants, fond) => k.col(enfants, { flexGrow: 1, flexBasis: "0px", minWidth: "320px", gap: "18px", alignItems: "flex-start", paddingTop: "72px", paddingBottom: "72px", paddingLeft: "64px", paddingRight: "64px", backgroundColor: fond, borderRadius: "0px" }, { paddingTop: "52px", paddingBottom: "52px", paddingLeft: "36px", paddingRight: "36px" }, { paddingTop: "40px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px", minWidth: "0px", flexBasis: "100%" });
const plateauRegie = modeleV2({
  id: identifiantV2(306, "plateau-et-regie"), concept: "c-306-plateau-et-regie",
  name: "Plateau et régie", family: FAM,
  description: "Pour un studio de production : deux demi-pages bord à bord, crème (venir au studio, adresse, horaires) et brique (lettre d'information, liens rapides sur deux colonnes, réseaux), puis une barre crème à filet brique foncé pour les mentions.",
  tags: ["production", "deux panneaux", "brique", "crème", "lettre d'information", "horaires", "angles droits"],
  identity: regie,
  racine: racineDe(CRM),
  widgets: ["text", "link", "bizcontact", "bizhours", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titreG = k.T("<p>Venez au studio</p>", { fontSize: "fluid:36-60", lineHeight: 1.05, fontFamily: S.head, fontWeight: "600", color: ENC3, letterSpacing: "-0.01em" });
    const intro = k.T("<p>Passez voir les plateaux, les tirages et les maquettes en cours, ou écrivez-nous pour fixer un rendez-vous.</p>", { fontSize: "16px", lineHeight: 1.65, color: "#4a3328", fontFamily: S.font, maxWidth: "480px" });
    const pt = souffle(carre(k, BRIQUE, "12px"), 3400);
    const g = panneau(k, [k.row([pt, caps(k, "Visite et horaires", { couleur: BRIQUE })], { gap: "10px", alignItems: "center" }), titreG, intro, coordonnees(k, { taille: 17, couleur: ENC3, lien: BRIQUE, survol: ENC3, focus: BRIQUE }), caps(k, "Horaires", { couleur: BRIQUE }), horaires(k, { taille: 16, couleur: ENC3 })], CRM);
    const abo = lettre(k, env, { titre: "Lettre du studio", intro: "Un message de temps en temps : projets terminés, coulisses, invitations.", bouton: "S'abonner", largeur: "440px", accent: CRM, texte: "#f8ece6", surBouton: ENC3, fond: BRIQUE, survolBouton: "#ffffff", survolTexte: BRIQUE, soulignement: "2px", couleurTitre: "#f8ece6", focus: "#ffffff" });
    const rapides = ["Réalisations|/catalogue", "Journal|/blog", "Questions|/faq", "Espace client|/connexion", "Contact|/contact", "Accueil|/"].map((s) => { const [t, u] = s.split("|"); return lien(k, t, u, { taille: 16, poids: "700", couleur: "#ffffff", bloc: true, h: "48px", survol: { color: CRM, transform: { x: 8 } }, focus: "#ffffff", extra: { flexGrow: 1, flexBasis: "40%", minWidth: "140px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#f8ece666" } }); });
    const liens = k.row(rapides, { columnGap: "28px", rowGap: "0px", width: "100%", maxWidth: "460px" });
    const d = panneau(k, [caps(k, "Rester en contact", { couleur: "#f8ece6" }), abo, caps(k, "Liens rapides", { couleur: "#f8ece6", extra: { marginTop: "18px" } }), liens, G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, couleur: "#ffffff", survol: CRM, focus: "#ffffff" })(k, env)], BRIQUE);
    const moitie = k.row([g, d], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const haut = G.bande(k, [moitie], { fond: CRM, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], aligne: "stretch", nom: "Deux panneaux" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#4a3328", liens: ENC3 })(k, env);
    const bas = G.bande(k, [mentions], { fond: CRM, filetHaut: { epaisseur: "4px", couleur: BRIQUE_F }, colonne: true, padV: ["24px", "20px", "18px"], padB: ["24px", "20px", "18px"], padH: MARGE, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-307 « Du brief à la livraison » — agence de marque — archétype I : FRISE HORIZONTALE EN ÉTAPES à points carrés
// Idée : sur menthe pâle, une frise de cinq étapes (brief, esquisses, épreuves, production, livraison) : un point carré sur un filet, et sous chaque point un lien vers la page utile. Le premier point respire. Une bande vert forêt porte les coordonnées.
// Polices : Epilogue (titres) et Lexend. Mobile : les étapes s'empilent verticalement.
const frise = identite({
  key: "i307", label: "Menthe pâle et vert forêt", humeur: "light",
  fond: "#d9f2e6", texte: "#0c3b2e", discret: "#2d5a4b", accent: "#b23a08", surface: "#c6e8d6", encre: "#0c3b2e",
  police: "font.lexend", titres: "font.epilogue",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "1px", ligne: "#0c3b2e44",
});
const MENTHE_P = "#d9f2e6", FORET = "#0c3b2e", ROUILLE = "#b23a08";
const friseLivraison = modeleV2({
  id: identifiantV2(307, "du-brief-a-la-livraison"), concept: "c-307-du-brief-a-la-livraison",
  name: "Du brief à la livraison", family: FAM,
  description: "Pour une agence de marque : une frise de cinq étapes à points carrés sur menthe pâle (brief, esquisses, épreuves, production, livraison), chaque étape menant à une page utile, les coordonnées et la ligne légale, le tout sur menthe pâle.",
  tags: ["agence de marque", "frise", "étapes", "menthe", "vert forêt", "processus", "angles droits"],
  identity: frise,
  racine: racineDe(MENTHE_P),
  widgets: ["text", "link", "divider", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = k.T("<p>Du brief à la livraison, le chemin est visible.</p>", { fontSize: "fluid:28-52", lineHeight: 1.08, fontFamily: S.head, fontWeight: "800", color: FORET, letterSpacing: "-0.02em", maxWidth: "720px" });
    const bouton = lien(k, "Lancer un brief  →", "/contact", { taille: 17, poids: "700", couleur: "#ffffff", h: "58px", padH: "28px", survol: { backgroundColor: FORET, color: "#ffffff", transform: { x: 8 } }, focus: FORET, extra: { backgroundColor: ROUILLE, borderStyle: "solid", borderWidth: "2px", borderColor: ROUILLE } });
    const etape = (nom, texte, url) => k.col([caps(k, nom, { couleur: ROUILLE, suivi: "0.18em" }), lien(k, texte, url, { taille: 19, poids: "700", police: S.head, couleur: FORET, bloc: true, h: "48px", lh: 1.2, survol: { color: ROUILLE, transform: { x: 6 } }, focus: ROUILLE })], { flexGrow: 1, flexBasis: "0px", minWidth: "180px", gap: "4px", alignItems: "flex-start" });
    const rail = k.row([souffle(carre(k, ROUILLE, "18px"), 3000), trait(k, FORET, "2px"), carre(k, FORET, "18px"), trait(k, FORET, "2px"), carre(k, FORET, "18px"), trait(k, FORET, "2px"), carre(k, FORET, "18px"), trait(k, FORET, "2px"), carre(k, FORET, "18px")], { gap: "0px", alignItems: "center", width: "100%", flexWrap: "nowrap" }, undefined, { display: "none" });
    const etapes = k.row([etape("Brief", "Poser un brief", "/contact"), etape("Esquisses", "Lire le journal", "/blog"), etape("Épreuves", "Questions fréquentes", "/faq"), etape("Production", "Voir les réalisations", "/catalogue"), etape("Livraison", "Espace client", "/connexion")], { rowGap: "0px", columnGap: "28px", alignItems: "flex-start", width: "100%", flexWrap: "wrap" }, undefined, { rowGap: "12px" });
    const coord = coordonnees(k, { taille: 15, couleur: FORET, lien: ROUILLE, survol: FORET, focus: ROUILLE });
    const tete = G.bande(k, [rail, etapes, trait(k, FORET, "1px"), k.row([G.colonne(k, [caps(k, "Notre façon de travailler", { couleur: ROUILLE, suivi: "0.22em" }), titre], { poids: 3, min: "300px", gap: "12px" }), G.colonne(k, [bouton, coord], { poids: 1, min: "260px", gap: "18px", soi: "flex-end" })], { rowGap: "28px", columnGap: "48px", alignItems: "flex-end", width: "100%", flexWrap: "wrap" }), trait(k, FORET, "1px"), G.ligneLegale({ taille: 13, sansCookies: true, couleur: FORET, liens: FORET })(k, env)], { fond: MENTHE_P, colonne: true, gap: "26px", padV: ["88px", "60px", "44px"], padB: ["64px", "48px", "36px"], padH: MARGE, nom: "Frise" });
    return [G.racine(k, [tete])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Studios créatifs", target: 6, built: true,
  description: "Pieds de studios créatifs, angles droits : appel géant, damier de cases, console de montage, nom monumental, demi-pages crème et brique, frise de production.",
  models: [appelPlateau, tiragesDamier, consoleMontage, signatureStudio, plateauRegie, friseLivraison],
};
