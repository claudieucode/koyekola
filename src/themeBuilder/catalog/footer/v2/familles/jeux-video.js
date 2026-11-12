// Famille v2 « Jeux vidéo et esport » — 6 modèles (ft2-368 à ft2-373), pieds « inspirés de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Idées de composition reprises des captures (grande phrase sur fond sombre, colonnes discrètes, marque monumentale), traduites sans copie : autres marques fictives, autres couleurs, autres proportions.
// Six ARCHÉTYPES différents (DIVERSITE_STRICTE.md) : C damier de cases, D barre unique, F bandeau XXL + colonne étroite, I frise en niveaux, K fenêtre console, L escalier.
// Marques fictives (Super Cases, Néon Éclipse, Prêt Joueur, Carte du jeu, Terminal Quartz, Next Level) ; AUCUNE coordonnée, horaire ni chiffre inventé. Rubriques (Actualités, Tournois…) = intitulés d'EXEMPLE à renommer.
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; UNE animation visible par modèle (carré qui « respire », case qui s'inverse, étape qui se remplit, curseur qui bat lentement, bouton qui respire).
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const { DOUX, racineDe, lien, caps, texte, trait, souffle, carre, bloc, abonnement, bouton, PH } = require("../aides-inspire");

const FAM = "jeux-video";
const MENTIONS = (G, k, env, o = {}) => G.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-368 « Super cases » — média de jeux vidéo (archétype C : damier de 8 cases égales, chacune un lien ou une information)
// Idée : un DAMIER d'arcade bleu, jaune, blanc, noir. Huit cases à angles droits : la première porte la marque, six sont des liens (qui s'inversent au survol), la dernière contient la lettre d'information.
const arcade = identite({
  key: "i368", label: "Bleu électrique, jaune, blanc, noir", humeur: "dark",
  fond: "#0b0b0f", texte: "#ffffff", discret: "#c9c9d6", accent: "#ffe14a", surface: "#16161d", encre: "#0b0b0f", surEncre: "#ffffff",
  police: "font.chakra-petch", titres: "font.press-start-2p",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#ffffff33",
});
const BLEU = "#1d3bff", JAUNE2 = "#ffe14a", NOIR2 = "#0b0b0f";
const superCases = modeleV2({
  id: identifiantV2(368, "super-cases"), concept: "c-368-super-cases", name: "Super cases", family: FAM,
  description: "Pour un média ou une communauté de jeux vidéo : un damier de huit cases égales à angles droits (marque, six liens qui s'inversent au survol, lettre d'information). Bleu électrique, jaune, blanc et noir, Press Start 2P.",
  tags: ["jeux vidéo", "damier", "cases", "arcade", "bleu électrique", "jaune", "angles droits"],
  identity: arcade, racine: racineDe(NOIR2),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const cellule = (enfants, fond, o = {}) => { const c = k.col(enfants, { flexGrow: 1, flexBasis: "23%", minWidth: "200px", minHeight: "190px", backgroundColor: fond, paddingTop: "22px", paddingBottom: "22px", paddingLeft: "22px", paddingRight: "22px", justifyContent: "space-between", boxSizing: "border-box", transitionDuration: DOUX, borderRadius: "0px", gap: "14px" }); if (o.survol) c.states = { hover: o.survol }; return c; };
    const caseLien = (num, titre, url, fond, fg, inverse) => cellule([caps(k, num, { couleur: fg, suivi: "0.2em" }), lien(k, titre, url, { taille: 13, poids: "400", police: S.head, couleur: fg, lh: 1.5, casse: "uppercase", h: "44px", extra: { width: "100%" } })], fond, { survol: { backgroundColor: inverse, transform: { y: -4 } } });
    const marque = cellule([souffle(carre(k, JAUNE2, "16px"), 3000), G.geant(`<p>SUPER<br>CASES</p>`, { taille: [22, 40], tablette: { taille: [28, 36] }, mobile: { taille: [26, 30] }, lh: 1.3, suivi: "0", poids: "400", police: S.head, couleur: "#ffffff" })(k, env)], BLEU);
    const abo = abonnement(k, env, { titre: "Lettre", intro: "Les sorties de la semaine.", bouton: "OK", largeur: "100%", accent: NOIR2, texte: NOIR2, couleurTitre: NOIR2, couleurIntro: "#2b2b30", texteBouton: JAUNE2, survolBouton: BLEU, survolTexte: "#ffffff", fondChamp: "#ffffff", policeChamp: S.font, tailleChamp: "16px", rembChamp: "10px" });
    const cases = [
      marque,
      caseLien("01", "Actualités", "/blog", "#ffffff", NOIR2, JAUNE2),
      caseLien("02", "Tests", "/blog", JAUNE2, NOIR2, "#ffffff"),
      caseLien("03", "Tournois", "/blog", NOIR2, "#ffffff", BLEU),
      caseLien("04", "Guides", "/faq", JAUNE2, NOIR2, "#ffffff"),
      caseLien("05", "Boutique", "/boutique", BLEU, "#ffffff", NOIR2),
      caseLien("06", "Contact", "/contact", NOIR2, "#ffffff", BLEU),
      cellule([abo], "#ffffff"),
    ];
    // damier : alternance de couleurs entre les deux rangées (1re rangée : bleu blanc jaune noir ; 2e : jaune bleu noir blanc)
    const grille = G.bande(k, [k.row(cases, { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" })], { fond: NOIR2, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Damier" });
    const reseaux = G.reseauxTexte([["YouTube", "https://www.youtube.com/"], ["Twitch", "https://www.twitch.tv/"], ["Discord", "https://discord.com/"]], { taille: 15, poids: "700", couleur: "#ffffff", survol: JAUNE2, focus: JAUNE2 })(k, env);
    const bas = G.bande(k, [reseaux, MENTIONS(G, k, env, { couleur: "#c9c9d6", liens: "#ffffff" })], { fond: NOIR2, colonne: true, gap: "8px", padV: ["24px", "20px", "18px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [grille, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-369 « Barre HUD » — plateforme de jeux (archétype D : une seule ligne type barre de navigation inversée, compacte)
// Idée : le pied tient en UNE ligne de console : nom en Orbitron, six liens en ligne, bouton « Se connecter » qui respire ; filet cyan en haut ; ligne légale dessous. Violet nuit et cyan.
const hud = identite({
  key: "i369", label: "Violet nuit et cyan", humeur: "dark",
  fond: "#1a1033", texte: "#efeaff", discret: "#bdb2e0", accent: "#2de2e6", surface: "#241647", encre: "#1a1033", surEncre: "#efeaff",
  police: "font.exo-2", titres: "font.orbitron",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#efeaff33",
});
const VIOLET = "#1a1033", CYAN = "#2de2e6";
const barreHud = modeleV2({
  id: identifiantV2(369, "barre-hud"), concept: "c-369-barre-hud", name: "Barre HUD", family: FAM,
  description: "Pour une plateforme de jeux : tout tient sur une ligne de console (nom en Orbitron, six liens, bouton qui respire), filet cyan en haut et ligne légale dessous. Compact. Violet nuit et cyan.",
  tags: ["plateforme de jeux", "barre", "compact", "console", "violet", "cyan", "angles droits"],
  identity: hud, racine: racineDe(VIOLET),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = k.row([carre(k, CYAN, "12px"), caps(k, "NÉON ÉCLIPSE", { couleur: "#efeaff", police: S.head, taille: "20px", suivi: "0.12em", poids: "700", casse: false })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const lk = (t, u) => lien(k, t, u, { taille: 15, poids: "500", couleur: "#efeaff", padH: "12px", survol: { color: CYAN, transform: { y: -2 } }, focus: CYAN, extra: { borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "2px", borderColor: VIOLET } });
    const liens = k.row([lk("Jeux", "/catalogue"), lk("Classements", "/blog"), lk("Événements", "/blog"), lk("Aide", "/faq"), lk("Recrutement", "/contact"), lk("Contact", "/contact")], { gap: "0px", alignItems: "center", justifyContent: "center", flexGrow: 1 });
    const cta = souffle(bouton(k, "Se connecter", "/connexion", { texte: VIOLET, fond: CYAN, bord: CYAN, h: "48px", padH: "22px", taille: 14, survol: { backgroundColor: "#efeaff", borderColor: "#efeaff", color: VIOLET, transform: { y: -3 } }, focus: "#efeaff", police: S.font }), 3800);
    const ligneUnique = G.bande(k, [nom, liens, cta], { fond: VIOLET, gap: "14px 28px", aligne: "center", padV: ["28px", "26px", "24px"], padB: ["14px", "12px", "12px"], padH: PH, filetHaut: { epaisseur: "3px", couleur: CYAN }, nom: "Barre" });
    const bas = G.bande(k, [MENTIONS(G, k, env, { couleur: "#bdb2e0", liens: "#efeaff" })], { fond: VIOLET, colonne: true, padV: ["6px", "6px", "6px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [ligneUnique, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-370 « Prêt, joueur ? » — studio de jeux indépendant (archétype F : bandeau d'appel XXL + liens en UNE colonne étroite à droite)
// Idée (capture « grande phrase ») : un bandeau orange avec « Prêt, joueur ? » en Anton géant et un énorme bouton noir qui respire ; dessous, noir : un petit mot du studio à gauche et UNE colonne étroite de liens à filets à droite.
const studio = identite({
  key: "i370", label: "Orange vif et noir", humeur: "dark",
  fond: "#111111", texte: "#f5f5f0", discret: "#bdbdb5", accent: "#ff5a1f", surface: "#1c1c1c", encre: "#111111", surEncre: "#f5f5f0",
  police: "font.barlow", titres: "font.anton",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f5f5f033",
});
const ORANGE = "#ff5a1f", NOIR3 = "#111111", BLANC3 = "#f5f5f0";
const pretJoueur = modeleV2({
  id: identifiantV2(370, "pret-joueur"), concept: "c-370-pret-joueur", name: "Prêt, joueur ?", family: FAM,
  description: "Pour un studio de jeux indépendant : bandeau orange avec « Prêt, joueur ? » en Anton géant et énorme bouton noir qui respire ; dessous, un mot du studio et une seule colonne étroite de liens à filets qui glissent au survol.",
  tags: ["studio de jeux", "indépendant", "appel à l'action", "bandeau XXL", "colonne étroite", "orange", "noir", "angles droits"],
  identity: studio, racine: racineDe(NOIR3),
  widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>PRÊT,<br>JOUEUR ?</p>`, { taille: [72, 200], tablette: { taille: [96, 170] }, mobile: { taille: [72, 100] }, lh: 0.92, suivi: "0", poids: "400", police: S.head, couleur: NOIR3 })(k, env);
    const grosBouton = souffle(bouton(k, "Télécharger la démo", "/inscription", { texte: ORANGE, fond: NOIR3, bord: NOIR3, h: "72px", padH: "40px", taille: 20, survol: { backgroundColor: BLANC3, borderColor: NOIR3, color: NOIR3, transform: { y: -4 } }, focus: NOIR3, police: S.head, suivi: "0.06em", poids: "400" }), 4000);
    const banniere = G.bande(k, [G.colonne(k, [phrase], { poids: 3, min: "300px" }), G.colonne(k, [texte(k, "Un jeu fait à la main, par une petite équipe. Essayez-le avant tout le monde.", { couleur: NOIR3, taille: 18, largeur: "360px", poids: "600" }), grosBouton], { poids: 2, min: "280px", gap: "24px", soi: "flex-end" })], { fond: ORANGE, gap: "32px 56px", aligne: "flex-end", padV: ["72px", "56px", "40px"], padB: ["72px", "56px", "40px"], padH: PH, nom: "Appel XXL" });
    const rangee = (t, u) => k.col([lien(k, t, u, { taille: 20, poids: "600", couleur: BLANC3, h: "52px", bloc: true, survol: { color: ORANGE, transform: { x: 8 } }, focus: ORANGE, extra: { width: "100%" } }), trait(k, "#f5f5f040")], { gap: "0px", width: "100%" });
    const colonne = G.colonne(k, [caps(k, "Le studio", { couleur: ORANGE, suivi: "0.24em" }), ...[["Nos jeux", "/catalogue"], ["Journal de développement", "/blog"], ["Presse", "/contact"], ["Aide", "/faq"], ["Recrutement", "/contact"]].map(([t, u]) => rangee(t, u))], { poids: 0, base: "320px", min: "260px", gap: "6px" });
    const mot = G.colonne(k, [caps(k, "Studio Prêt Joueur", { couleur: BLANC3, suivi: "0.26em", poids: "800" }), texte(k, "Jeux indépendants, mises à jour régulières, une équipe qui lit vos retours.", { couleur: "#bdbdb5", taille: 18, largeur: "420px" }), G.reseauxTexte([["YouTube", "https://www.youtube.com/"], ["Discord", "https://discord.com/"], ["Instagram", "https://www.instagram.com/"]], { taille: 15, poids: "700", couleur: BLANC3, survol: ORANGE, focus: ORANGE })(k, env)], { poids: 1, min: "260px", gap: "20px" });
    const milieu = G.bande(k, [mot, colonne], { fond: NOIR3, gap: "40px 80px", aligne: "flex-start", padV: ["64px", "48px", "36px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Mot et liens" });
    const bas = G.bande(k, [trait(k, "#f5f5f040"), MENTIONS(G, k, env, { couleur: "#bdbdb5", liens: BLANC3 })], { fond: NOIR3, colonne: true, gap: "18px", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [banniere, milieu, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-371 « Carte du jeu » — communauté de joueurs (archétype I : frise horizontale en étapes à points carrés)
// Idée : une FRISE de cinq niveaux, du premier pas à la contribution : chaque étape a son point carré ambre sur une ligne marine, un titre-lien et une phrase ; l'étape se remplit de marine au survol. Fond bleu glacier.
const frise = identite({
  key: "i371", label: "Bleu glacier, marine et ambre", humeur: "light",
  fond: "#e8f1f6", texte: "#0a2a43", discret: "#3d5a70", accent: "#0a2a43", surface: "#d9e7ef", encre: "#0a2a43", surEncre: "#e8f1f6",
  police: "font.albert-sans", titres: "font.oxanium",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#0a2a4344",
});
const GLACE = "#e8f1f6", MARINE2 = "#0a2a43", AMBRE = "#ffb000";
const carteDuJeu = modeleV2({
  id: identifiantV2(371, "carte-du-jeu"), concept: "c-371-carte-du-jeu", name: "Carte du jeu", family: FAM,
  description: "Pour une communauté de joueurs : une frise de cinq niveaux (découvrir, jouer, rejoindre, concourir, contribuer), points carrés ambre sur une ligne marine, chaque étape se remplit au survol. Bleu glacier, marine et ambre.",
  tags: ["communauté", "frise", "étapes", "niveaux", "chronologie", "glacier", "marine", "ambre", "angles droits"],
  identity: frise, racine: racineDe(GLACE),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    // chaque étape est plus HAUTE que la précédente (marge haute décroissante) : la frise monte comme une courbe de progression
    const etape = (n, titre, url) => {
      const c = k.row([souffle(carre(k, AMBRE, "16px"), 3400 + n * 200), k.T(`<p>0${n}</p>`, { fontFamily: S.head, fontSize: "28px", lineHeight: 1, fontWeight: "700", color: MARINE2 }), lien(k, titre, url, { taille: 24, poids: "700", couleur: MARINE2, survol: { color: MARINE2, transform: { x: 6 } }, focus: MARINE2 })], { alignItems: "center", flexWrap: "nowrap", gap: "16px", width: "100%", paddingTop: "14px", paddingBottom: "14px", boxSizing: "border-box", transitionDuration: DOUX, borderRadius: "0px" });
      c.states = { hover: { backgroundColor: "#d9e7ef" } };
      return c;
    };
    const liste = k.col([etape(1, "Découvrir", "/catalogue"), trait(k, MARINE2, "3px"), etape(2, "Jouer", "/faq"), trait(k, MARINE2, "1px"), etape(3, "Rejoindre", "/inscription"), trait(k, MARINE2, "1px"), etape(4, "Concourir", "/blog"), trait(k, MARINE2, "1px"), etape(5, "Contribuer", "/contact")], { flexGrow: 1, flexBasis: "320px", minWidth: "240px", gap: "0px" });
    const titre = G.geant(`<p>La carte du jeu</p>`, { taille: [36, 72], tablette: { taille: [40, 56] }, mobile: { taille: [34, 44] }, lh: 1, suivi: "-0.01em", poids: "700", police: S.head, couleur: MARINE2 })(k, env);
    const gauche = k.col([titre], { flexGrow: 1, flexBasis: "320px", minWidth: "240px", justifyContent: "flex-end" });
    const haut = G.bande(k, [k.row([gauche, liste], { gap: "48px", alignItems: "stretch", flexWrap: "wrap", width: "100%" })], { fond: GLACE, colonne: true, gap: "20px", padV: ["72px", "56px", "40px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Frise" });
    const reseaux = G.reseauxTexte([["YouTube", "https://www.youtube.com/"], ["Twitch", "https://www.twitch.tv/"], ["Discord", "https://discord.com/"]], { taille: 15, poids: "700", couleur: MARINE2, survol: MARINE2, focus: MARINE2 })(k, env);
    const bas = G.bande(k, [trait(k, "#0a2a4344"), k.row([caps(k, "Communauté Carte du jeu", { couleur: MARINE2, suivi: "0.22em" }), reseaux], { justifyContent: "space-between", alignItems: "center", rowGap: "4px", columnGap: "32px", width: "100%" }), MENTIONS(G, k, env, { couleur: "#3d5a70", liens: MARINE2 })], { fond: GLACE, colonne: true, gap: "10px", padV: ["16px", "16px", "14px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-372 « Terminal Quartz » — équipe d'esport (archétype K : le pied ressemble à une fenêtre de console)
// Idée : une FENÊTRE de terminal à angles droits (barre de titre à trois carrés, contour menthe) : lignes de commande « > actualités », « > calendrier »… qui s'inversent au survol, et une ligne « s'abonner » avec le champ e-mail. Un curseur bloc bat lentement.
const terminal = identite({
  key: "i372", label: "Vert terminal et menthe", humeur: "dark",
  fond: "#0b130e", texte: "#d6ffe9", discret: "#9cc9b0", accent: "#4dffa6", surface: "#101c15", encre: "#0b130e", surEncre: "#d6ffe9",
  police: "font.jetbrains-mono", titres: "font.jetbrains-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#4dffa644",
});
const TERM = "#0b130e", TERM2 = "#101c15", MENTHE = "#4dffa6";
const terminalQuartz = modeleV2({
  id: identifiantV2(372, "terminal-quartz"), concept: "c-372-terminal-quartz", name: "Terminal Quartz", family: FAM,
  description: "Pour une équipe d'esport : le pied est une fenêtre de terminal à angles droits (barre de titre, lignes de commande qui s'inversent au survol, champ e-mail en ligne de commande, curseur qui bat). Vert terminal et menthe, JetBrains Mono.",
  tags: ["esport", "équipe", "terminal", "console", "fenêtre", "vert", "menthe", "monospace", "angles droits"],
  identity: terminal, racine: racineDe(TERM),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = k.row([k.row([carre(k, TERM, "10px"), carre(k, TERM, "10px"), carre(k, TERM, "10px")], { gap: "6px", flexWrap: "nowrap" }), caps(k, "quartz@equipe — pied de page", { couleur: TERM, suivi: "0.04em", casse: false, taille: "13px", poids: "700" })], { gap: "16px", alignItems: "center", flexWrap: "nowrap", width: "100%", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "16px", paddingRight: "16px", backgroundColor: MENTHE, boxSizing: "border-box" });
    const cmd = (t, u, desc) => {
      const l = lien(k, `> ${t}`, u, { taille: 17, poids: "600", couleur: MENTHE, h: "44px", padH: "10px", survol: { backgroundColor: MENTHE, color: TERM, transform: { x: 6 } }, focus: "#d6ffe9" });
      return k.row([l, texte(k, `# ${desc}`, { couleur: "#8fb8a2", taille: 14 })], { alignItems: "center", rowGap: "4px", columnGap: "16px", width: "100%" });
    };
    const lignes = k.col([
      k.row([caps(k, "$ ls pages/", { couleur: "#d6ffe9", casse: false, suivi: "0", taille: "15px", poids: "700" })], { paddingBottom: "4px" }),
      cmd("actualites", "/blog", "résultats et annonces"), cmd("calendrier", "/blog", "matchs et tournois"), cmd("effectif", "/blog", "joueuses et joueurs"), cmd("partenaires", "/contact", "nous soutenir"), cmd("recrutement", "/contact", "rejoindre l'équipe"), cmd("aide", "/faq", "questions fréquentes"),
    ], { gap: "0px", width: "100%" });
    const abo = abonnement(k, env, { titre: "$ subscribe --lettre", intro: "Résultats et calendrier, un message par mois.", bouton: "ENTRÉE", largeur: "420px", accent: MENTHE, texte: "#d6ffe9", couleurTitre: MENTHE, couleurIntro: "#9cc9b0", texteBouton: TERM, survolBouton: "#d6ffe9", survolTexte: TERM, policeChamp: S.font, tailleChamp: "15px" });
    const curseur = souffle(k.col([], { width: "12px", height: "22px", backgroundColor: MENTHE }), 1800);
    const invite = k.row([caps(k, "$", { couleur: "#d6ffe9", casse: false, taille: "15px", poids: "700" }), curseur], { gap: "8px", alignItems: "center" });
    const corps = k.col([lignes, trait(k, "#4dffa644"), abo, invite], { gap: "22px", width: "100%", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "20px", paddingRight: "20px", boxSizing: "border-box", backgroundColor: TERM2 });
    const fenetre = k.col([titre, corps], { width: "100%", maxWidth: "880px", gap: "0px", borderStyle: "solid", borderWidth: "2px", borderColor: MENTHE, borderRadius: "0px", boxSizing: "border-box" });
    const haut = G.bande(k, [fenetre], { fond: TERM, colonne: true, aligne: "flex-start", padV: ["64px", "52px", "36px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Fenêtre" });
    const bas = G.bande(k, [MENTIONS(G, k, env, { couleur: "#9cc9b0", liens: "#d6ffe9" })], { fond: TERM, colonne: true, padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-373 « Next level » — éditeur de jeux mobiles (archétype L : pied en escalier, bandes de largeurs décroissantes alignées à gauche)
// Idée : des MARCHES qui se rétrécissent : 100 % rose avec « NEXT LEVEL » géant (Bowlby One), 75 % noir (liens), 50 % jaune (lettre), 25 % violet (réseaux). Les marches s'étirent au survol. Crème, rose, noir, jaune, violet.
const escalier = identite({
  key: "i373", label: "Crème, rose, noir, jaune et violet", humeur: "light",
  fond: "#fff4e0", texte: "#111111", discret: "#4d4d46", accent: "#5b3df5", surface: "#ffe9c4", encre: "#111111", surEncre: "#ffffff",
  police: "font.mulish", titres: "font.bowlby-one",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#11111133",
});
const CREME2 = "#fff4e0", ROSE = "#ff3d8b", NOIR4 = "#111111", JAUNE4 = "#ffd23f", VIOLET4 = "#5b3df5";
const nextLevel = modeleV2({
  id: identifiantV2(373, "next-level"), concept: "c-373-next-level", name: "Next level", family: FAM,
  description: "Pour un éditeur de jeux mobiles : un pied en escalier, quatre marches de largeurs décroissantes alignées à gauche (rose avec « NEXT LEVEL » géant, noir pour les liens, jaune pour la lettre, violet pour les réseaux).",
  tags: ["jeux mobiles", "escalier", "étagé", "marches", "rose", "jaune", "violet", "angles droits"],
  identity: escalier, racine: racineDe(CREME2),
  widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const marche = (enfants, fond, largeur, o = {}) => { const m = k.col(enfants, { width: largeur, backgroundColor: fond, boxSizing: "border-box", paddingTop: o.padV || "28px", paddingBottom: o.padV || "28px", paddingLeft: "32px", paddingRight: "32px", gap: "16px", transitionDuration: DOUX, borderRadius: "0px", minHeight: o.h }, undefined, { width: "100%", paddingLeft: "20px", paddingRight: "20px" }); m.states = { hover: { width: o.survolLargeur || largeur } }; return m; };
    const titre = G.geant(`<p>NEXT<br>LEVEL</p>`, { taille: [64, 180], tablette: { taille: [84, 150] }, mobile: { taille: [64, 90] }, lh: 0.92, suivi: "0", poids: "400", police: S.head, couleur: NOIR4 })(k, env);
    const m1 = marche([titre, texte(k, "Des petits jeux pour les trajets, les pauses et les grands rendez-vous.", { couleur: NOIR4, taille: 18, largeur: "420px", poids: "600" }), souffle(bouton(k, "Voir nos jeux", "/catalogue", { texte: ROSE, fond: NOIR4, bord: NOIR4, casse: false, poids: "800", suivi: "0.02em", survol: { backgroundColor: "#ffffff", borderColor: NOIR4, color: NOIR4, transform: { y: -3 } }, focus: NOIR4, police: S.font }), 4200)], ROSE, "100%", { padV: "56px" });
    const lk = (t, u) => lien(k, t, u, { taille: 18, poids: "700", couleur: "#ffffff", padH: "0px", survol: { color: JAUNE4, textDecoration: "underline", transform: { y: -2 } }, focus: JAUNE4 });
    const m2 = marche([k.row([lk("Nos jeux", "/catalogue"), lk("Actualités", "/blog"), lk("Aide", "/faq"), lk("Presse", "/contact"), lk("Contact", "/contact")], { rowGap: "6px", columnGap: "28px" })], NOIR4, "75%", { padV: "20px" });
    const abo = abonnement(k, env, { titre: "Les nouveautés", intro: "Mises à jour et sorties, sans spam.", bouton: "Je m'abonne", largeur: "420px", accent: NOIR4, texte: NOIR4, couleurTitre: NOIR4, couleurIntro: "#3d3320", texteBouton: JAUNE4, survolBouton: VIOLET4, survolTexte: "#ffffff" });
    const m3 = marche([abo], JAUNE4, "50%", { padV: "24px" });
    const m4 = marche([G.reseauxTexte([["YouTube", "https://www.youtube.com/"], ["Instagram", "https://www.instagram.com/"], ["TikTok", "https://www.tiktok.com/"]], { taille: 15, poids: "800", couleur: "#ffffff", survol: JAUNE4, focus: JAUNE4 })(k, env)], VIOLET4, "25%", { padV: "10px" });
    const escaliers = G.bande(k, [k.col([m1, m2, m3, m4], { width: "100%", gap: "0px", alignItems: "flex-start" })], { fond: CREME2, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Marches" });
    const bas = G.bande(k, [MENTIONS(G, k, env, { couleur: "#4d4d46", liens: NOIR4 })], { fond: CREME2, colonne: true, padV: ["24px", "20px", "18px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [escaliers, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Jeux vidéo et esport", target: 6, built: true,
  description: "Pieds inspirés de captures, angles droits, animations fluides : média de jeux, plateforme, studio indépendant, communauté, équipe d'esport, jeux mobiles. Six compositions : damier, barre unique, bandeau XXL, frise, fenêtre de console, escalier.",
  models: [superCases, barreHud, pretJoueur, carteDuJeu, terminalQuartz, nextLevel],
};
