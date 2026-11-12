// Famille v2 « Mode et prêt-à-porter » — 6 modèles (ft2-314 à ft2-319), pieds « inspirés de captures » : ANGLES DROITS partout.
// Marques fictives (Orme, Saison, Fil & Maille, Cobalt, Sillage, Rosalie) ; aucune coordonnée ni chiffre inventé : horaires, adresse et téléphone viendraient des Données de l'entreprise du site.
// Rubriques (Femme, Homme, Soldes…) = intitulés d'EXEMPLE à renommer dans l'éditeur ; adresses de réseaux = exemples.
// Archétypes : 314 B (nom monumental) · 315 E (deux demi-pages) · 316 A (colonne latérale) · 317 C (damier de cases) · 318 D (ligne unique) · 319 F (appel XXL + colonne étroite).
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; une animation visible par modèle (carré qui respire, case qui se remplit, bouton qui respire, ligne qui s'indente) ; pas d'animation d'entrée.
const { modeleV2, identifiantV2 } = require("../kit-v2");
const A = require("../aides-a04");
const { identite, GK, DOUX, PAD, racineDe, lien, caps, texte, trait, souffle, carre, bouton, bloc, mentions, reseaux, abonnement, horaires, coordonnees } = A;
const FAM = "mode-pret-a-porter";

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-314 « Orme monumental » — marque de prêt-à-porter. Archétype B : nom monumental, peu de liens (inspiré d'une capture au nom géant en bas, phrase d'accueil à gauche, deux colonnes de liens).
const orme = identite({ key: "i314", label: "Gris papier, noir et orange brûlé", humeur: "light", fond: "#efeeea", texte: "#0d0d0d", discret: "#55554f", accent: "#c8381a", surface: "#e4e3dd", encre: "#efeeea", surEncre: "#0d0d0d", police: "font.inter-tight", titres: "font.archivo-black", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#0d0d0d33" });
const ormeMod = modeleV2({
  id: identifiantV2(314, "orme-monumental"), concept: "c-314-orme-monumental", name: "Orme monumental", family: FAM,
  description: "Pour une marque de prêt-à-porter : une phrase d'accueil et deux colonnes de liens sobres, puis le nom de la marque en lettres géantes qui occupe toute la largeur. Gris papier, noir et orange brûlé.",
  tags: ["prêt-à-porter", "nom monumental", "minimal", "marque", "gris", "noir", "angles droits"],
  identity: orme, racine: racineDe("#efeeea"), widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const S = k.S;
    const mot = k.T("<p>Une question sur une taille, une commande ou un retour ?</p>", { fontSize: "22px", lineHeight: 1.3, fontWeight: "700", color: "#0d0d0d", fontFamily: S.font, maxWidth: "460px" });
    const intro = texte(k, "Notre équipe répond à la boutique, par écrit, du lundi au samedi. Les vêtements sont conçus pour durer plusieurs saisons.", { taille: 16, couleur: "#55554f", largeur: "440px" });
    const ecrire = k.row([souffle(carre(k, "#c8381a", "12px"), 3000), lien(k, "Écrire à la boutique", "/contact", { taille: 16, poids: "700", couleur: "#0d0d0d", soulign: true, survol: { color: "#c8381a" }, focus: "#c8381a" })], { gap: "12px" });
    const col = (t, l) => bloc(k, t, l.map(([a, u]) => lien(k, a, u, { taille: 16, poids: "500", couleur: "#55554f", survol: { color: "#0d0d0d", transform: { x: 4 } }, focus: "#c8381a" })), { couleurTitre: "#0d0d0d", gap: "0px", min: "150px", poids: 0.45, extra: { flexBasis: "190px", justifyContent: "space-between" } });
    const gauche = G.colonne(k, [k.col([mot, intro], { gap: "14px", flexGrow: 0.7 }), ecrire], { poids: 2.7, min: "280px", gap: "28px", justifie: "space-between" });
    const c1 = col("Boutique", [["Femme", "/boutique"], ["Homme", "/boutique"], ["Nouveautés", "/boutique"], ["Soldes", "/boutique"]]);
    const c2 = col("Service", [["Livraison", "/faq"], ["Retours", "/faq"], ["Guide des tailles", "/faq"], ["Contact", "/contact"]]);
    const haut = G.bande(k, [gauche, k.row([c1, c2], { gap: "40px", alignItems: "flex-start", flexWrap: "wrap", flexGrow: 1, flexBasis: "420px", maxWidth: "460px" })], { fond: "#efeeea", gap: "40px 64px", aligne: "flex-start", padV: ["72px", "56px", "44px"], padB: ["96px", "72px", "48px"], padH: PAD, nom: "Accueil et liens" });
    const nom = G.geant(`<p>orme<span style="color:#c8381a">&amp;</span>co</p>`, { taille: [80, 200], tablette: { taille: [110, 150] }, mobile: { taille: [56, 70] }, lh: 0.82, suivi: "-0.04em", poids: "400", police: S.head, couleur: "#0d0d0d" })(k, env);
    const mono = G.bande(k, [nom], { fond: "#efeeea", colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: PAD, nom: "Nom monumental" });
    const bas = G.bande(k, [reseaux(k, env, { couleur: "#0d0d0d", survol: "#c8381a", focus: "#c8381a" }), trait(k, "#0d0d0d33"), mentions(k, env, { couleur: "#55554f", liens: "#0d0d0d" })], { fond: "#efeeea", colonne: true, gap: "18px", padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: PAD, nom: "Mentions" });
    bas.styles.desktop.color = "#55554f";
    return [G.racine(k, [haut, mono, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-315 « Deux saisons » — boutique de mode. Archétype E : deux demi-pages bord à bord (terre cuite = message, crème = liens et lettre).
const saison = identite({ key: "i315", label: "Terre cuite et crème", humeur: "light", fond: "#f6ecdd", texte: "#2a1a12", discret: "#6b5446", accent: "#a63f22", surface: "#efe2cf", encre: "#f6ecdd", surEncre: "#2a1a12", police: "font.karla", titres: "font.instrument-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#2a1a1233" });
const saisonMod = modeleV2({
  id: identifiantV2(315, "deux-saisons"), concept: "c-315-deux-saisons", name: "Deux saisons", family: FAM,
  description: "Pour une boutique de mode : deux demi-pages bord à bord, terre cuite avec la grande phrase et le bouton de collection, crème avec les liens des rayons, l'aide et la lettre d'information. Angles droits.",
  tags: ["boutique de mode", "deux panneaux", "bord à bord", "collection", "terre cuite", "crème", "angles droits"],
  identity: saison, racine: racineDe("#f6ecdd"), widgets: ["text", "link", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const S = k.S, T = "#a63f22", C = "#f6ecdd", INK = "#2a1a12";
    const g1 = caps(k, "Collection d'hiver", { couleur: "#f6ecdd", suivi: "0.22em" });
    const g2 = G.geant(`<p>Habillez<br>la saison.</p>`, { taille: [56, 112], tablette: { taille: [72, 96] }, mobile: { taille: [52, 68] }, lh: 0.95, suivi: "-0.01em", poids: "400", police: S.head, couleur: "#ffffff" })(k, env);
    const g3 = souffle(bouton(k, "Voir la collection", "/boutique", { texte: T, fond: "#ffffff", bord: "#ffffff", survol: { backgroundColor: INK, borderColor: INK, color: "#ffffff", transform: { y: -3 } }, focus: INK }), 4200);
    const gauche = k.col([g1, g2, g3], { flexGrow: 1, flexBasis: "420px", minWidth: "280px", backgroundColor: T, boxSizing: "border-box", paddingTop: "88px", paddingBottom: "88px", paddingLeft: "56px", paddingRight: "56px", gap: "28px", alignItems: "flex-start", justifyContent: "space-between" }, { paddingTop: "64px", paddingBottom: "64px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "48px", paddingBottom: "48px", paddingLeft: "20px", paddingRight: "20px" });
    const col = (t, l) => bloc(k, t, l.map(([a, u]) => lien(k, a, u, { taille: 17, poids: "600", couleur: INK, survol: { color: T, transform: { x: 5 } }, focus: T })), { couleurTitre: T, gap: "0px", min: "140px" });
    const liens = k.row([col("Rayons", [["Femme", "/boutique"], ["Homme", "/boutique"], ["Enfant", "/boutique"], ["Soldes", "/boutique"]]), col("Aide", [["Livraison", "/faq"], ["Retours", "/faq"], ["Tailles", "/faq"], ["Contact", "/contact"]])], { gap: "32px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" });
    const abo = abonnement(k, env, { titre: "Le courrier de saison", intro: "Nouveautés et ventes privées, de temps en temps.", bouton: "Je m'abonne", largeur: "100%", accent: T, texte: INK, titreC: T, introC: "#6b5446", boutonC: "#ffffff", boutonH: [INK, "#ffffff"] });
    const droite = k.col([liens, trait(k, "#2a1a1233"), abo], { flexGrow: 1, flexBasis: "420px", minWidth: "280px", backgroundColor: C, boxSizing: "border-box", paddingTop: "88px", paddingBottom: "72px", paddingLeft: "56px", paddingRight: "56px", gap: "32px", alignItems: "stretch" }, { paddingTop: "64px", paddingBottom: "56px", paddingLeft: "32px", paddingRight: "32px" }, { paddingTop: "48px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" });
    const moitiés = G.bande(k, [k.row([gauche, droite], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" })], { fond: C, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Deux demi-pages" });
    const bas = G.bande(k, [mentions(k, env, { couleur: "#6b5446", liens: INK })], { fond: C, colonne: true, padV: ["20px", "18px", "16px"], padB: ["20px", "18px", "16px"], padH: PAD, nom: "Mentions" });
    bas.styles.desktop.color = "#6b5446";
    return [G.racine(k, [moitiés, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-316 « Barre de cintre » — maison de maille. Archétype A : colonne latérale noire pleine hauteur (nom, réseaux, mentions) + zone claire à quatre colonnes (inspiré d'une capture : marque à gauche, colonnes de liens à droite).
const maille = identite({ key: "i316", label: "Noir, ivoire et ocre", humeur: "light", fond: "#fafaf7", texte: "#161616", discret: "#5a5a54", accent: "#8a6414", surface: "#efeee8", encre: "#fafaf7", surEncre: "#161616", police: "font.work-sans", titres: "font.bodoni-moda", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#16161633" });
const mailleMod = modeleV2({
  id: identifiantV2(316, "barre-de-cintre"), concept: "c-316-barre-de-cintre", name: "Barre de cintre", family: FAM,
  description: "Pour une maison de maille : une haute barre noire à gauche avec le nom, une phrase et les réseaux, et à droite quatre colonnes de liens clairs (femme, homme, boutique, aide) qui s'indentent au survol. Noir, ivoire, ocre.",
  tags: ["maille", "prêt-à-porter", "colonne latérale", "barre noire", "ivoire", "ocre", "angles droits"],
  identity: maille, racine: racineDe("#fafaf7"), widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const S = k.S, N = "#161616", IV = "#fafaf7", OC = "#e0b25a", OCF = "#8a6414";
    const nom = G.geant(`<p>Fil<br>&amp; Maille</p>`, { taille: [44, 64], tablette: { taille: [48, 60] }, mobile: { taille: [44, 52] }, lh: 1, suivi: "0em", poids: "500", police: S.head, couleur: IV })(k, env);
    const mot = texte(k, "Pulls, gilets et écharpes tricotés pour l'hiver. Un fil, une forme, des années.", { taille: 15, couleur: "#d9d6cc", largeur: "240px" });
    const rs = k.col(["Instagram", "Facebook", "Pinterest"].map((n) => lien(k, `${n} ↗`, `https://www.${n.toLowerCase()}.com/`, { taille: 15, poids: "700", couleur: IV, survol: { color: OC, transform: { x: 5 } }, focus: OC })), { gap: "0px", alignItems: "flex-start" });
    const barre = k.col([k.col([carre(k, OC, "14px"), nom, mot], { gap: "20px", alignItems: "flex-start" }), k.col([rs, trait(k, "#fafaf733"), mentions(k, env, { couleur: "#d9d6cc", liens: IV })], { gap: "16px", alignItems: "stretch" })], { flexGrow: 0, flexShrink: 0, flexBasis: "340px", minWidth: "280px", backgroundColor: N, boxSizing: "border-box", paddingTop: "64px", paddingBottom: "40px", paddingLeft: "40px", paddingRight: "40px", justifyContent: "space-between", gap: "48px", alignItems: "stretch" }, { flexBasis: "100%", paddingLeft: "32px", paddingRight: "32px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "44px" });
    souffle(barre.children[0].children[0], 3200);
    const col = (t, l) => bloc(k, t, l.map(([a, u]) => lien(k, a, u, { taille: 16, poids: "500", couleur: N, survol: { color: OCF, transform: { x: 6 } }, focus: OCF })), { couleurTitre: OCF, gap: "0px", min: "150px", tailleTitre: "12px" });
    const zone = k.row([col("Femme", [["Robes", "/boutique"], ["Manteaux", "/boutique"], ["Mailles", "/boutique"], ["Pantalons", "/boutique"]]), col("Homme", [["Chemises", "/boutique"], ["Vestes", "/boutique"], ["Mailles", "/boutique"], ["Pantalons", "/boutique"]]), col("Boutique", [["Nouveautés", "/boutique"], ["Soldes", "/boutique"], ["Cartes cadeaux", "/boutique"]]), col("Aide", [["Livraison", "/faq"], ["Retours", "/faq"], ["Guide des tailles", "/faq"], ["Contact", "/contact"]])], { gap: "36px 40px", alignItems: "flex-start", flexWrap: "wrap", flexGrow: 1, flexBasis: "560px", boxSizing: "border-box", paddingTop: "72px", paddingBottom: "56px", paddingLeft: "56px", paddingRight: "40px", justifyContent: "space-between" }, { paddingLeft: "32px", paddingRight: "32px", paddingTop: "56px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px" });
    const corps = G.bande(k, [k.row([barre, zone], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" })], { fond: IV, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Barre et colonnes" });
    corps.styles.desktop.color = "#5a5a54";
    return [G.racine(k, [corps])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-317 « Damier des rayons » — marque urbaine. Archétype C : damier de huit cases égales à angles droits, chacune est un lien ou le nom.
const cobalt = identite({ key: "i317", label: "Cobalt, jaune et blanc", humeur: "dark", fond: "#1b34c7", texte: "#ffffff", discret: "#dfe5ff", accent: "#ffe14d", surface: "#2a42d6", encre: "#1b34c7", surEncre: "#ffffff", police: "font.epilogue", titres: "font.unbounded", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff66" });
const cobaltMod = modeleV2({
  id: identifiantV2(317, "damier-des-rayons"), concept: "c-317-damier-des-rayons", name: "Damier des rayons", family: FAM,
  description: "Pour une marque de mode urbaine : un damier de huit cases carrées, le nom de la marque sur fond jaune puis les rayons et les services (femme, homme, livraison, retours, tailles) qui se remplissent de jaune au survol. Cobalt, jaune, blanc.",
  tags: ["mode urbaine", "damier", "cases", "rayons", "cobalt", "jaune", "angles droits"],
  identity: cobalt, racine: racineDe("#0f1f84"), widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const S = k.S, B = "#1b34c7", J = "#ffe14d", D = "#0f1f84";
    const stylesCase = { flexGrow: 1.4, flexBasis: "200px", minWidth: "150px", minHeight: "150px", boxSizing: "border-box", paddingTop: "18px", paddingBottom: "18px", paddingLeft: "20px", paddingRight: "20px", borderStyle: "solid", borderWidth: "1px", borderColor: "#ffffff80", justifyContent: "space-between", alignItems: "flex-start", transitionDuration: DOUX, borderRadius: "0px" };
    const info = k.col([souffle(carre(k, B, "16px"), 2800), k.T("<p>Cobalt</p>", { fontSize: "30px", fontWeight: "800", color: B, fontFamily: S.head, lineHeight: 1.1 })], { ...stylesCase, backgroundColor: J, borderColor: J });
    const c = (n, t, u) => { const l = lien(k, t, u, { taille: 22, poids: "600", police: S.head, couleur: "#ffffff", h: "44px", survol: { color: B }, focus: D, extra: { width: "100%" } }); const x = k.col([caps(k, n, { couleur: "#dfe5ff", suivi: "0.2em" }), l], { ...stylesCase, backgroundColor: B }); x.states = { hover: { backgroundColor: J } }; return x; };
    const rang = (...cs) => k.row(cs, { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%", justifyContent: "space-between" });
    const grille = k.col([rang(info, c("Rayon", "Femme", "/boutique"), c("Rayon", "Homme", "/boutique"), c("Rayon", "Enfant", "/boutique")), rang(c("Rayon", "Nouveautés", "/boutique"), c("Service", "Livraison", "/faq"), c("Service", "Retours", "/faq"), c("Service", "Guide des tailles", "/faq"))], { gap: "0px", width: "100%", alignItems: "stretch", flexGrow: 1.5 });
    const damier = G.bande(k, [grille], { fond: B, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Damier" });
    const bas = G.bande(k, [reseaux(k, env, { couleur: "#ffffff", survol: J, focus: J }), mentions(k, env, { couleur: "#dfe5ff", liens: "#ffffff" })], { fond: D, gap: "16px 40px", aligne: "center", padV: ["28px", "24px", "22px"], padB: ["28px", "24px", "22px"], padH: PAD, innerMobile: { rowGap: "14px" }, nom: "Mentions" });
    bas.styles.desktop.color = "#dfe5ff";
    return [G.racine(k, [damier, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-318 « Ligne de caisse » — boutique de mode. Archétype D : une seule barre sombre, tout sur une ligne (nom, six liens, bouton), puis la ligne légale.
const sillage = identite({ key: "i318", label: "Vert sapin, sable et or", humeur: "dark", fond: "#10261c", texte: "#f1ead9", discret: "#c9d3c3", accent: "#e8c872", surface: "#173428", encre: "#10261c", surEncre: "#f1ead9", police: "font.hanken-grotesk", titres: "font.syne", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f1ead933" });
const sillageMod = modeleV2({
  id: identifiantV2(318, "ligne-de-caisse"), concept: "c-318-ligne-de-caisse", name: "Ligne de caisse", family: FAM,
  description: "Pour une boutique de mode : une barre compacte vert sapin, nom, six liens en ligne et bouton « Boutique » d'un seul tenant, puis un filet et les mentions légales. Un pied discret, rapide à lire. Vert sapin, sable, or.",
  tags: ["boutique de mode", "barre compacte", "une ligne", "navigation inversée", "vert sapin", "or", "angles droits"],
  identity: sillage, racine: racineDe("#10261c"), widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const S = k.S, V = "#10261c", SB = "#f1ead9", OR = "#e8c872";
    const marque = k.row([souffle(carre(k, OR, "12px"), 3000), k.T("<p>Sillage</p>", { fontSize: "28px", fontWeight: "800", color: SB, fontFamily: S.head, lineHeight: 1.1, letterSpacing: "-0.01em" })], { gap: "12px", flexWrap: "nowrap" });
    const liens = k.row([["Femme", "/boutique"], ["Homme", "/boutique"], ["Accessoires", "/boutique"], ["Soldes", "/boutique"], ["Livraison", "/faq"], ["Contact", "/contact"]].map(([a, u]) => lien(k, a, u, { taille: 15, poids: "600", couleur: SB, padH: "8px", survol: { color: OR, backgroundColor: "#173428" }, focus: OR })), { gap: "4px 8px", alignItems: "center", flexWrap: "wrap" });
    const b = bouton(k, "Boutique", "/boutique", { texte: V, fond: OR, bord: OR, h: "48px", taille: 14, survol: { backgroundColor: SB, borderColor: SB, color: V, transform: { y: -3 } }, focus: SB });
    const barre = G.bande(k, [marque, G.colonne(k, [liens], { poids: 2.3, min: "260px", aligne: "center" }), b], { fond: V, gap: "20px 32px", aligne: "center", padV: ["40px", "32px", "28px"], padB: ["24px", "20px", "18px"], padH: PAD, nom: "Barre" });
    const bas = G.bande(k, [k.col([caps(k, "Mode femme et homme", { couleur: OR, suivi: "0.24em" }), reseaux(k, env, { couleur: SB, survol: OR, focus: OR })], { gap: "0px", flexGrow: 0.5, alignItems: "flex-start" }), k.col([mentions(k, env, { couleur: "#c9d3c3", liens: SB })], { flexGrow: 2.2, minWidth: "280px", alignItems: "stretch" })], { fond: V, aligne: "center", gap: "8px 40px", padV: ["16px", "14px", "12px"], padB: ["24px", "20px", "18px"], padH: PAD, filetHaut: { epaisseur: "1px", couleur: "#f1ead933" }, nom: "Mentions" });
    bas.styles.desktop.color = "#c9d3c3";
    return [G.racine(k, [barre, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-319 « Soldes en grand » — boutique de mode. Archétype F : bandeau d'appel XXL rose (phrase géante + très gros bouton) puis une colonne étroite de liens à droite (inspiré d'une capture : grand appel centré puis pied à deux zones).
const rosalie = identite({ key: "i319", label: "Rose poudré et bleu nuit", humeur: "dark", fond: "#1b1a3d", texte: "#f8e6ea", discret: "#d3cde8", accent: "#f3c6cf", surface: "#26255a", encre: "#1b1a3d", surEncre: "#f8e6ea", police: "font.karla", titres: "font.gloock", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f3c6cf4d" });
const rosalieMod = modeleV2({
  id: identifiantV2(319, "soldes-en-grand"), concept: "c-319-soldes-en-grand", name: "Soldes en grand", family: FAM,
  description: "Pour une boutique de mode : un immense bandeau rose avec la phrase d'appel et un très gros bouton qui respire, puis une bande bleu nuit avec une phrase de marque et une seule colonne étroite de liens à filets, à droite.",
  tags: ["boutique de mode", "appel à l'action", "bandeau XXL", "colonne étroite", "rose", "bleu nuit", "angles droits"],
  identity: rosalie, racine: racineDe("#1b1a3d"), widgets: ["text", "link", "copyright", "bizlegal", "divider"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const S = k.S, R = "#f3c6cf", NUIT = "#1b1a3d", CR = "#f8e6ea";
    const phrase = G.geant(`<p>Nouvelle<br>collection,<br>première.</p>`, { taille: [56, 150], tablette: { taille: [84, 120] }, mobile: { taille: [52, 72] }, lh: 0.96, suivi: "-0.02em", poids: "400", police: S.head, couleur: NUIT })(k, env);
    const gros = souffle(bouton(k, "Découvrir", "/boutique", { texte: R, fond: NUIT, bord: NUIT, h: "84px", taille: 22, extra: { paddingLeft: "56px", paddingRight: "56px" }, survol: { backgroundColor: "#ffffff", color: NUIT, transform: { y: -4 } }, focus: "#ffffff" }), 4400);
    const haut = G.bande(k, [G.colonne(k, [phrase], { poids: 3, min: "300px" }), G.colonne(k, [caps(k, "Avant tout le monde", { couleur: NUIT, suivi: "0.22em" }), gros], { poids: 1, min: "240px", gap: "20px", soi: "flex-end" })], { fond: R, gap: "40px 64px", aligne: "flex-end", padV: ["88px", "64px", "48px"], padB: ["88px", "64px", "48px"], padH: PAD, nom: "Appel" });
    const nom = k.T("<p>Rosalie</p>", { fontSize: "36px", fontFamily: S.head, color: CR, lineHeight: 1.1 });
    const mot = texte(k, "Robes, blouses et manteaux à porter longtemps. Du lundi au samedi, la boutique répond à vos questions.", { taille: 16, couleur: "#d3cde8", largeur: "400px" });
    const gauche = G.colonne(k, [nom, mot, reseaux(k, env, { couleur: CR, survol: R, focus: R })], { poids: 2, min: "280px", gap: "18px" });
    const liens = k.col([k.col([["Femme", "/boutique"], ["Nouveautés", "/boutique"], ["Soldes", "/boutique"]].map(([a, u]) => lien(k, a, u, { taille: 17, poids: "600", couleur: CR, bloc: true, h: "52px", survol: { color: R, transform: { x: 8 } }, focus: R, extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#f3c6cf4d" } })), { gap: "0px", flexGrow: 1.2, justifyContent: "space-between" }), k.row([["Livraison et retours", "/faq"], ["Contact", "/contact"]].map(([a, u]) => lien(k, a, u, { taille: 15, poids: "700", couleur: R, survol: { color: "#ffffff" }, focus: "#ffffff", soulign: true })), { gap: "4px 24px", justifyContent: "space-between", flexGrow: 0.5 })], { gap: "16px", alignItems: "stretch", flexGrow: 0, flexBasis: "300px", minWidth: "240px", maxWidth: "360px" });
    const bas = G.bande(k, [gauche, liens, k.col([trait(k, "#f3c6cf4d"), mentions(k, env, { couleur: "#d3cde8", liens: CR })], { gap: "16px", width: "100%" })], { fond: NUIT, gap: "40px 64px", aligne: "flex-start", padV: ["64px", "52px", "40px"], padB: ["28px", "24px", "20px"], padH: PAD, nom: "Marque et liens" });
    bas.styles.desktop.color = "#d3cde8";
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Mode et prêt-à-porter", target: 6, built: true,
  description: "Pieds inspirés de captures, angles droits, animations fluides : nom monumental, deux demi-pages, barre latérale, damier de cases, ligne unique, appel XXL.",
  models: [ormeMod, saisonMod, mailleMod, cobaltMod, sillageMod, rosalieMod],
};
