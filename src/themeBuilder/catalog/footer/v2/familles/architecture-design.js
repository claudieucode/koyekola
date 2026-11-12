// Famille v2 « Architecture et design d'intérieur » — 6 modèles (ft2-308 à ft2-313), « inspirés de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Agences d'architecture, architectes d'intérieur, maîtrise d'œuvre, design d'espace. AUCUNE image inventée, aucun chiffre, label ni coordonnée inventés : adresse, téléphone et horaires viennent des Données de l'entreprise ;
// les rubriques (maisons, intérieurs, rénovations…) sont des intitulés d'EXEMPLE à renommer dans l'éditeur.
// Inspirations : (10) logo et baseline à gauche, colonnes de liens à droite, grande phrase centrée ; (11) carte d'appel sombre, colonnes adresse / liens / réseaux ; (12) bloc d'accueil, bandeau de lettre, liens rapides en deux colonnes.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; UNE animation visible par modèle (barre qui se remplit, carré qui respire, ligne qui s'éclaire, case qui se soulève). Pas d'animation d'entrée.
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const A = require("../aides-inspire-studios");
const { DOUX, racineDe, lien, caps, trait, souffle, carre, horaires, coordonnees, lettre, nomDuSite } = A;
const FAM = "architecture-design";
const MARGE = ["56px", "32px", "20px"];

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-308 « Montant d'agence » — agence d'architecture — archétype A : COLONNE LATÉRALE pleine hauteur (barre graphite à gauche) + zone principale
// Idée (capture 10) : à gauche le nom de l'agence et sa colonne de liens, comme un montant de cloison ; à droite sur béton clair, une phrase en grand serif, un bouton terre cuite et les horaires d'accueil.
// Polices : Archivo (montant) et Source Serif 4 (phrase). Mobile : le montant passe au-dessus de la zone principale.
const montant = identite({
  key: "i308", label: "Béton clair, graphite et terre cuite", humeur: "light",
  fond: "#e6e3dc", texte: "#1f2326", discret: "#4d5357", accent: "#a8451f", surface: "#d9d5cc", encre: "#1f2326", surEncre: "#f1ede4",
  police: "font.archivo", titres: "font.source-serif-4",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#1f232633",
});
const BETON = "#e6e3dc", GRAPHITE = "#1f2326", TERRE = "#a8451f";
const montantAgence = modeleV2({
  id: identifiantV2(308, "montant-d-agence"), concept: "c-308-montant-d-agence",
  name: "Montant d'agence", family: FAM,
  description: "Pour une agence d'architecture : une colonne graphite pleine hauteur à gauche (nom, liens, coordonnées) et, sur béton clair, une grande phrase en serif, un bouton terre cuite et les horaires d'accueil.",
  tags: ["architecture", "colonne latérale", "graphite", "béton", "terre cuite", "serif", "angles droits"],
  identity: montant,
  racine: racineDe(BETON),
  widgets: ["sitetitle", "text", "link", "bizcontact", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 30, "#f1ede4", { fontFamily: S.font, fontWeight: "800", letterSpacing: "0.02em" });
    const pt = souffle(carre(k, "#e8a07f", "12px"), 3400);
    const liens = [["Accueil", "/"], ["Réalisations", "/catalogue"], ["Journal", "/blog"], ["Questions", "/faq"], ["Contact", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "600", couleur: "#f1ede4", bloc: true, h: "50px", padH: "14px", survol: { backgroundColor: TERRE, color: "#ffffff", transform: { x: 8 } }, focus: "#ffffff", extra: { width: "100%", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "3px", borderColor: "#f1ede455" } }));
    const barre = k.col([k.row([pt, caps(k, "Architecture", { couleur: "#e8a07f", suivi: "0.3em" })], { gap: "10px", alignItems: "center" }), nom, k.col(liens, { gap: "4px", width: "100%", marginTop: "18px" }), caps(k, "Nous joindre", { couleur: "#e8a07f", suivi: "0.22em", extra: { marginTop: "26px" } }), coordonnees(k, { taille: 14, couleur: "#e9e4d8", lien: "#ffffff", survol: "#e8a07f", focus: "#ffffff" })],
      { flexGrow: 0, flexShrink: 0, flexBasis: "340px", minWidth: "300px", backgroundColor: GRAPHITE, gap: "12px", alignItems: "flex-start", paddingTop: "56px", paddingBottom: "56px", paddingLeft: "40px", paddingRight: "40px", borderRadius: "0px" },
      undefined, { flexBasis: "100%", minWidth: "0px", paddingTop: "40px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" });
    const phrase = k.T("<p>Des lieux<br>à habiter,<br>à vivre,<br>à partager.</p>", { fontSize: "fluid:40-96", lineHeight: 1.02, fontFamily: S.head, fontWeight: "600", color: GRAPHITE, letterSpacing: "-0.02em" });
    const mot = k.T("<p>Une maison, un appartement, un lieu de travail : racontez-nous l'usage, nous dessinons l'espace qui va avec.</p>", { fontSize: "17px", lineHeight: 1.65, color: "#3a4146", fontFamily: S.font, maxWidth: "520px" });
    const bouton = lien(k, "Parler de mon projet  →", "/contact", { taille: 17, poids: "700", couleur: "#ffffff", h: "60px", padH: "30px", survol: { backgroundColor: GRAPHITE, color: "#ffffff", transform: { x: 8 } }, focus: GRAPHITE, extra: { backgroundColor: TERRE, borderStyle: "solid", borderWidth: "2px", borderColor: TERRE } });
    const barreH = k.col([k.col([], { width: "96px", height: "6px", backgroundColor: TERRE, borderRadius: "0px", transitionDuration: DOUX }, undefined, undefined)], { width: "100%" });
    barreH.children[0].states = { hover: { width: "200px" } };
    const accueil = k.col([caps(k, "Accueil à l'agence", { couleur: TERRE, suivi: "0.22em" }), horaires(k, { taille: 16, couleur: GRAPHITE })], { gap: "10px", width: "100%", maxWidth: "460px" });
    const zone = k.col([barreH, phrase, mot, bouton, accueil], { flexGrow: 1, flexBasis: "0px", minWidth: "320px", gap: "24px", alignItems: "flex-start", justifyContent: "center", paddingTop: "72px", paddingBottom: "72px", paddingLeft: "72px", paddingRight: "56px", borderRadius: "0px" },
      { paddingTop: "56px", paddingBottom: "56px", paddingLeft: "40px", paddingRight: "32px" }, { paddingTop: "40px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px", minWidth: "0px", flexBasis: "100%" });
    const haut = G.bande(k, [k.row([barre, zone], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" })], { fond: BETON, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], aligne: "stretch", nom: "Montant" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#3a4146", liens: GRAPHITE })(k, env);
    const bas = G.bande(k, [mentions], { fond: BETON, filetHaut: { epaisseur: "1px", couleur: "#1f232644" }, colonne: true, padV: ["22px", "20px", "18px"], padB: ["22px", "20px", "18px"], padH: MARGE, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-309 « Maquette en blocs » — architecte d'intérieur — archétype H : MOSAÏQUE ASYMÉTRIQUE (une grande case + trois petites)
// Idée (capture 11, carte d'appel sombre) : une grande case bleu Klein porte l'appel en serif de Bodoni ; à sa droite, trois cases empilées — ivoire (réalisations), jaune (coordonnées), nuit (lettre d'information) — comme les volumes d'une maquette.
// Polices : Bodoni Moda (appel) et Inter Tight. Mobile : les cases s'empilent.
const blocs = identite({
  key: "i309", label: "Bleu Klein, ivoire, jaune et nuit", humeur: "dark",
  fond: "#1b3fd0", texte: "#ffffff", discret: "#dbe3ff", accent: "#ffd23f", surface: "#102a9a", surEncre: "#ffffff", encre: "#101828",
  police: "font.inter-tight", titres: "font.bodoni-moda",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#ffffff44",
});
const KLEIN = "#1b3fd0", IVOIRE2 = "#f4f1e8", JAUNE = "#ffd23f", NUIT = "#101828";
const maquette = modeleV2({
  id: identifiantV2(309, "maquette-en-blocs"), concept: "c-309-maquette-en-blocs",
  name: "Maquette en blocs", family: FAM,
  description: "Pour un architecte d'intérieur : une mosaïque asymétrique, une grande case bleu Klein avec l'appel en serif et trois petites cases (réalisations sur ivoire, coordonnées sur jaune, lettre d'information sur nuit).",
  tags: ["architecte d'intérieur", "mosaïque", "bleu Klein", "jaune", "ivoire", "cases", "angles droits"],
  identity: blocs,
  racine: racineDe(NUIT),
  widgets: ["text", "link", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const cellule = (enfants, fond, o = {}) => k.col(enfants, { width: "100%", flexGrow: 1, flexBasis: "auto", minWidth: "0px", backgroundColor: fond, gap: "12px", alignItems: "flex-start", justifyContent: o.justifie || "space-between", paddingTop: "30px", paddingBottom: "30px", paddingLeft: "34px", paddingRight: "34px", borderRadius: "0px", minHeight: o.h, boxSizing: "border-box" }, undefined, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "24px", paddingBottom: "24px", minHeight: "0px" });
    const pt = souffle(carre(k, JAUNE, "14px"), 3200);
    const appel = k.T("<p>Imaginons ensemble<br>l'intérieur qui vous ressemble.</p>", { fontSize: "fluid:34-74", lineHeight: 1.04, fontFamily: S.head, fontWeight: "500", color: "#ffffff", letterSpacing: "-0.02em" });
    const bouton = lien(k, "Prendre rendez-vous  →", "/contact", { taille: 17, poids: "700", couleur: NUIT, h: "60px", padH: "30px", survol: { backgroundColor: "#ffffff", color: KLEIN, transform: { x: 8 } }, focus: "#ffffff", extra: { backgroundColor: JAUNE, borderStyle: "solid", borderWidth: "2px", borderColor: JAUNE } });
    const grande = k.col([k.row([pt, caps(k, "Architecture d'intérieur", { couleur: "#ffffff", suivi: "0.24em" })], { gap: "12px", alignItems: "center" }), appel, bouton], { flexGrow: 3, flexBasis: "0px", minWidth: "320px", backgroundColor: KLEIN, gap: "28px", alignItems: "flex-start", justifyContent: "space-between", paddingTop: "56px", paddingBottom: "56px", paddingLeft: "56px", paddingRight: "56px", borderRadius: "0px", boxSizing: "border-box" }, { paddingLeft: "36px", paddingRight: "36px" }, { paddingLeft: "20px", paddingRight: "20px", paddingTop: "40px", paddingBottom: "40px", minWidth: "0px", flexBasis: "100%" });
    const c1 = lien(k, "Voir nos réalisations  ↗", "/catalogue", { taille: 26, poids: "500", police: S.head, couleur: NUIT, bloc: true, h: "150px", lh: 1.15, survol: { backgroundColor: JAUNE, color: NUIT, transform: { y: -4 } }, focus: KLEIN, extra: { backgroundColor: IVOIRE2, width: "100%", flexGrow: 1, flexBasis: "auto", minWidth: "0px", paddingLeft: "34px", paddingRight: "34px", alignItems: "flex-end", boxSizing: "border-box" } });
    const c2 = cellule([caps(k, "Passer nous voir", { couleur: NUIT, suivi: "0.2em" }), coordonnees(k, { taille: 15, couleur: NUIT, lien: NUIT, survol: KLEIN, focus: NUIT })], JAUNE);
    const abo = lettre(k, env, { titre: "Lettre de l'agence", intro: "Chantiers terminés et coulisses, de temps en temps.", bouton: "S'abonner", largeur: "100%", accent: JAUNE, texte: "#f4f1e8", surBouton: NUIT, fond: NUIT, survolBouton: "#ffffff", survolTexte: NUIT, soulignement: "2px", couleurTitre: JAUNE, focus: "#ffffff" });
    const c3 = cellule([abo], NUIT);
    const petites = k.col([c1, c2, c3], { flexGrow: 2, flexBasis: "0px", minWidth: "300px", gap: "0px", alignItems: "stretch", borderRadius: "0px" }, undefined, { minWidth: "0px", flexBasis: "100%" });
    const mosaique = k.row([grande, petites], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const haut = G.bande(k, [mosaique], { fond: NUIT, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], aligne: "stretch", nom: "Mosaïque" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d7deef", liens: "#ffffff" })(k, env);
    const bas = G.bande(k, [mentions], { fond: NUIT, colonne: true, padV: ["24px", "20px", "18px"], padB: ["24px", "20px", "18px"], padH: MARGE, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-310 « En-tête d'agence » — agence de design d'espace — archétype J : PAPIER À EN-TÊTE (cartouche centré, filets doubles, liens en ligne centrée)
// Idée : un papier à en-tête sauge : filet épais puis filet fin, nom de l'agence centré en grand serif, liens en une seule ligne centrée, adresse centrée, de nouveau un double filet. Sobre, à l'ancienne, très lisible.
// Polices : Cormorant Garamond et Work Sans. Mobile : tout reste centré, les liens passent à la ligne.
const enTete = identite({
  key: "i310", label: "Sauge et vert encre", humeur: "light",
  fond: "#e3e8df", texte: "#1e2b22", discret: "#3d4d42", accent: "#4a5a2a", surface: "#d3dacd", encre: "#1e2b22", surEncre: "#e3e8df",
  police: "font.work-sans", titres: "font.cormorant-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#1e2b2255",
});
const SAUGE = "#e3e8df", VERT_ENCRE = "#1e2b22", OLIVE = "#4a5a2a";
const enTeteAgence = modeleV2({
  id: identifiantV2(310, "en-tete-d-agence"), concept: "c-310-en-tete-d-agence",
  name: "En-tête d'agence", family: FAM,
  description: "Pour une agence de design d'espace : un papier à en-tête sauge, avec doubles filets, le nom centré en grand serif, une ligne de liens centrée et l'adresse et les horaires de part et d'autre.",
  tags: ["design d'espace", "papier à en-tête", "centré", "sauge", "serif", "doubles filets", "angles droits"],
  identity: enTete,
  racine: racineDe(SAUGE),
  widgets: ["sitetitle", "text", "link", "divider", "bizcontact", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 64, VERT_ENCRE, { fontWeight: "500", fontSize: "fluid:36-72", letterSpacing: "0.02em", lineHeight: 1.0, textAlign: "center", overflowWrap: "anywhere" });
    nom.parts.link.styles.desktop.textAlign = "center";
    const double = () => k.col([trait(k, VERT_ENCRE, "4px"), k.col([], { height: "5px" }), trait(k, VERT_ENCRE, "1px")], { gap: "0px", width: "100%" });
    const pt = souffle(carre(k, OLIVE, "10px"), 3600);
    const gauche = k.col([caps(k, "Adresse", { couleur: OLIVE, suivi: "0.3em" }), coordonnees(k, { taille: 15, couleur: VERT_ENCRE, lien: VERT_ENCRE, survol: OLIVE, focus: OLIVE })], { flexGrow: 1, flexBasis: "0px", minWidth: "220px", gap: "8px", alignItems: "flex-start" }, undefined, { alignItems: "center", textAlign: "center", flexBasis: "100%" });
    const centre = k.col([pt, nom, caps(k, "Agence de design d'espace", { couleur: OLIVE, suivi: "0.4em", extra: { textAlign: "center" } })], { flexGrow: 1.4, flexBasis: "0px", minWidth: "260px", gap: "14px", alignItems: "center", textAlign: "center" }, undefined, { flexBasis: "100%" });
    const droite = k.col([caps(k, "Accueil", { couleur: OLIVE, suivi: "0.3em", extra: { textAlign: "right" } }), horaires(k, { taille: 15, couleur: VERT_ENCRE, align: "right" })], { flexGrow: 1, flexBasis: "0px", minWidth: "220px", gap: "8px", alignItems: "flex-end" }, undefined, { alignItems: "center", flexBasis: "100%" });
    const tete = k.row([gauche, centre, droite], { rowGap: "24px", columnGap: "32px", alignItems: "flex-start", width: "100%", flexWrap: "wrap", paddingTop: "10px", paddingBottom: "10px" });
    const liens = k.row([["Accueil", "/"], ["Réalisations", "/catalogue"], ["Journal", "/blog"], ["Questions", "/faq"], ["Contact", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 15, poids: "500", couleur: VERT_ENCRE, suivi: "0.12em", casse: "uppercase", padH: "16px", survol: { color: OLIVE, transform: { y: -2 }, textDecoration: "underline" }, focus: OLIVE })), { gap: "0px", justifyContent: "center", alignItems: "center", width: "100%" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#3d4d42", liens: VERT_ENCRE })(k, env, true);
    const cartouche = k.col([double(), tete, double(), liens, mentions], { alignItems: "center", gap: "20px", width: "100%", maxWidth: "1100px", marginLeft: "auto", marginRight: "auto", textAlign: "center" });
    const haut = G.bande(k, [cartouche], { fond: SAUGE, colonne: true, aligne: "center", padV: ["72px", "56px", "36px"], padB: ["28px", "24px", "20px"], padH: MARGE, nom: "En-tête" });
    return [G.racine(k, [haut])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-311 « Cote unique » — bureau d'études et d'architecture — archétype D : LIGNE UNIQUE type « barre de navigation inversée » (tout sur une à deux lignes)
// Idée : un filet rouge de 4 px, puis une seule ligne blanche en monospace : le nom du site, quatre liens en capitales, l'e-mail ; en dessous la ligne légale. Très compact, façon cote de plan.
// Police : DM Mono (tout). Mobile : la ligne passe à la ligne, chaque lien garde 44 px.
const cote = identite({
  key: "i311", label: "Blanc, noir et rouge de cote", humeur: "light",
  fond: "#ffffff", texte: "#111111", discret: "#505050", accent: "#d42a0b", surface: "#f0f0f0", encre: "#111111", surEncre: "#ffffff",
  police: "font.dm-mono", titres: "font.dm-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#11111133",
});
const ROUGE = "#d42a0b", NOIR3 = "#111111";
const coteUnique = modeleV2({
  id: identifiantV2(311, "cote-unique"), concept: "c-311-cote-unique",
  name: "Cote unique", family: FAM,
  description: "Pour un bureau d'architecture : un filet rouge puis une seule ligne blanche en monospace (nom du site, quatre liens en capitales, e-mail) et la ligne légale dessous. Compact, façon cote de plan.",
  tags: ["architecture", "ligne unique", "compact", "monospace", "rouge", "blanc", "cote", "angles droits"],
  identity: cote,
  racine: racineDe("#ffffff"),
  widgets: ["sitetitle", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const pt = souffle(carre(k, ROUGE, "12px"), 3000);
    const nom = nomDuSite(k, env, 20, NOIR3, { fontFamily: S.font, fontWeight: "500", letterSpacing: "0.02em" });
    const sep = () => k.col([], { width: "1px", height: "26px", backgroundColor: "#11111144", flexShrink: 0, borderRadius: "0px" }, undefined, { display: "none" });
    const liens = [["Réalisations", "/catalogue"], ["Journal", "/blog"], ["Questions", "/faq"], ["Contact", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 13, poids: "500", couleur: NOIR3, suivi: "0.14em", casse: "uppercase", padH: "14px", survol: { backgroundColor: NOIR3, color: "#ffffff", transform: { y: -2 } }, focus: ROUGE }));
    const mail = coordonnees(k, { taille: 14, couleur: NOIR3, lien: ROUGE, survol: NOIR3, focus: ROUGE, adresse: false, telephone: false, largeur: "auto" });
    const ligne = k.row([pt, nom, sep(), k.row(liens, { gap: "0px", flexWrap: "wrap", alignItems: "center", flexGrow: 1 }), sep(), mail], { rowGap: "12px", columnGap: "18px", alignItems: "center", width: "100%", flexWrap: "wrap" });
    const mentions = G.ligneLegale({ taille: 12, sansCookies: true, couleur: "#505050", liens: NOIR3 })(k, env);
    const bande = G.bande(k, [ligne, mentions], { fond: "#ffffff", colonne: true, gap: "6px", filetHaut: { epaisseur: "4px", couleur: ROUGE }, padV: ["26px", "22px", "18px"], padB: ["18px", "16px", "14px"], padH: MARGE, nom: "Cote" });
    return [G.racine(k, [bande])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-312 « Gradins d'atelier » — atelier de design d'intérieur — archétype L : PIED EN ESCALIER / ÉTAGÉ (quatre bandes de largeurs décroissantes alignées à gauche)
// Idée : quatre gradins posés à gauche sur papier blanc, de plus en plus étroits et de plus en plus foncés, du sable clair au brun : chacun une seule ligne (étiquette + contenu) : le nom et le bouton, les pages, les coordonnées, l'accueil.
// Polices : Barlow Condensed (étiquettes) et Zilla Slab. Mobile : les gradins prennent toute la largeur, empilés.
const gradins = identite({
  key: "i312", label: "Sable, terre et brun", humeur: "light",
  fond: "#faf6ee", texte: "#2b1d14", discret: "#5c4636", accent: "#8a3b12", surface: "#e6d3b9", encre: "#2b1d14", surEncre: "#faf6ee",
  police: "font.zilla-slab", titres: "font.barlow-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#2b1d1433",
});
const PAPIER = "#faf6ee", BRUN = "#2b1d14", G1 = "#f0e6d4", G2 = "#e4cfb1", G3 = "#d4b48e", G4 = "#c39a6e";
const gradinsAtelier = modeleV2({
  id: identifiantV2(312, "gradins-d-atelier"), concept: "c-312-gradins-d-atelier",
  name: "Gradins d'atelier", family: FAM,
  description: "Pour un atelier de design d'intérieur : quatre gradins alignés à gauche, de plus en plus étroits et foncés (nom et bouton, pages, coordonnées, accueil), chacun sur une seule ligne, sur papier blanc.",
  tags: ["design d'intérieur", "escalier", "gradins", "sable", "brun", "étagé", "angles droits"],
  identity: gradins,
  racine: racineDe(PAPIER),
  widgets: ["sitetitle", "text", "link", "bizcontact", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const gradin = (largeur, fond, etiquette, contenu, o = {}) => k.row([k.col([caps(k, etiquette, { couleur: o.couleurE || "#8a3b12", police: S.head, taille: "15px", suivi: "0.22em", extra: { fontWeight: "700" } })], { flexGrow: 0, flexShrink: 0, flexBasis: "110px", minWidth: "90px" }), contenu], { width: largeur, maxWidth: "100%", backgroundColor: fond, rowGap: "12px", columnGap: "24px", alignItems: o.aligne || "center", flexWrap: "wrap", paddingTop: o.padV || "26px", paddingBottom: o.padV || "26px", paddingLeft: "56px", paddingRight: "40px", borderRadius: "0px", boxSizing: "border-box" }, { paddingLeft: "32px", paddingRight: "24px" }, { width: "100%", paddingLeft: "20px", paddingRight: "20px", paddingTop: "22px", paddingBottom: "22px" });
    const nom = nomDuSite(k, env, 44, BRUN, { fontWeight: "700", letterSpacing: "0.02em", textTransform: "uppercase" });
    const pt = souffle(carre(k, "#8a3b12", "12px"), 3400);
    const bouton = lien(k, "Écrire à l'atelier  →", "/contact", { taille: 16, poids: "700", couleur: "#ffffff", h: "52px", padH: "24px", survol: { backgroundColor: BRUN, color: "#ffffff", transform: { x: 8 } }, focus: BRUN, extra: { backgroundColor: "#8a3b12", borderStyle: "solid", borderWidth: "2px", borderColor: "#8a3b12" } });
    const g1 = gradin("100%", G1, "Atelier", k.row([pt, nom, k.col([bouton], { marginLeft: "auto" })], { rowGap: "16px", columnGap: "28px", alignItems: "center", flexGrow: 1, flexWrap: "wrap" }), { padV: "44px" });
    const pages = k.row([["Accueil", "/"], ["Réalisations", "/catalogue"], ["Journal", "/blog"], ["Questions", "/faq"]].map(([t, u]) => lien(k, t, u, { taille: 17, poids: "600", couleur: BRUN, soulign: true, survol: { color: "#8a3b12", transform: { y: -2 } }, focus: "#8a3b12", extra: { textUnderlineOffset: "5px", marginRight: "22px" } })), { gap: "0px", flexGrow: 1, flexWrap: "wrap" });
    const g2 = gradin("76%", G2, "Pages", pages);
    const g3 = gradin("54%", G3, "Écrire", coordonnees(k, { taille: 15, couleur: BRUN, lien: BRUN, survol: "#8a3b12", focus: BRUN }), { aligne: "flex-start", couleurE: BRUN });
    const g4 = gradin("32%", G4, "Accueil", horaires(k, { taille: 14, couleur: BRUN }), { aligne: "flex-start", couleurE: BRUN });
    g4.styles.mobile = { ...(g4.styles.mobile || {}), width: "100%" };
    const escalier = k.col([g1, g2, g3, g4], { gap: "0px", alignItems: "flex-start", width: "100%" });
    const haut = G.bande(k, [escalier], { fond: PAPIER, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], aligne: "stretch", nom: "Gradins" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#5c4636", liens: BRUN })(k, env);
    const bas = G.bande(k, [mentions], { fond: PAPIER, colonne: true, padV: ["24px", "20px", "18px"], padB: ["24px", "20px", "18px"], padH: MARGE, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-313 « Table des réalisations » — agence d'architecture et d'aménagement — archétype G : INDEX / SOMMAIRE en lignes pleine largeur (grand libellé, descripteur, flèche, filet), sans cartes
// Idée : sur vert nuit, cinq lignes pleine largeur en grandes capitales condensées, chacune terminée par une flèche ; au survol la ligne entière vire au vert vif. Un nom discret en haut, une seule ligne de coordonnées en bas.
// Rubriques d'EXEMPLE. Polices : Oswald (lignes) et Schibsted Grotesk. Mobile : les libellés se réduisent et passent à la ligne.
const table = identite({
  key: "i313", label: "Vert nuit et vert vif", humeur: "dark",
  fond: "#0f1a14", texte: "#eef3ea", discret: "#aebcb2", accent: "#c8f04a", surface: "#16251c", surEncre: "#eef3ea", encre: "#0f1a14",
  police: "font.schibsted-grotesk", titres: "font.oswald",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#eef3ea33",
});
const VERT_N = "#0f1a14", VIF = "#c8f04a";
const tableRealisations = modeleV2({
  id: identifiantV2(313, "table-des-realisations"), concept: "c-313-table-des-realisations",
  name: "Table des réalisations", family: FAM,
  description: "Pour une agence d'architecture : un sommaire de cinq lignes pleine largeur en grandes capitales condensées sur vert nuit, avec flèche, qui virent au vert vif au survol, et une ligne de coordonnées.",
  tags: ["architecture", "sommaire", "index", "vert nuit", "vert vif", "capitales", "angles droits"],
  identity: table,
  racine: racineDe(VERT_N),
  widgets: ["sitetitle", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const nom = nomDuSite(k, env, 22, "#eef3ea", { fontFamily: S.font, fontWeight: "700" });
    const pt = souffle(carre(k, VIF, "12px"), 3200);
    const tete = k.row([k.row([pt, nom], { gap: "12px", alignItems: "center" }), caps(k, "Table des réalisations", { couleur: VIF, suivi: "0.3em" })], { rowGap: "12px", columnGap: "32px", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap" });
    const rub = [["Maisons", "/catalogue"], ["Intérieurs", "/catalogue"], ["Équipements publics", "/blog"], ["Rénovations", "/faq"], ["Mobilier sur mesure", "/boutique"]];
    const lignes = rub.map(([t, u]) => lien(k, `${t}  ↗`, u, { taille: 40, poids: "600", police: S.head, couleur: "#eef3ea", bloc: true, h: "96px", padH: "8px", casse: "uppercase", lh: 1.0, suivi: "0.01em", survol: { backgroundColor: VIF, color: VERT_N, transform: { x: 10 } }, focus: VIF, extra: { width: "100%", justifyContent: "space-between", fontSize: "fluid:30-72", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#eef3ea55" } }));
    const liste = k.col(lignes, { gap: "0px", width: "100%", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#eef3ea55" });
    const mail = coordonnees(k, { taille: 14, couleur: "#eef3ea", lien: "#ffffff", survol: VIF, focus: VIF, adresse: false, telephone: false });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#aebcb2", liens: "#eef3ea" })(k, env);
    const corps = G.bande(k, [tete, liste, k.row([mail, mentions], { rowGap: "10px", columnGap: "40px", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap" })], { fond: VERT_N, colonne: true, gap: "28px", padV: ["52px", "40px", "28px"], padB: ["26px", "22px", "18px"], padH: MARGE, nom: "Index" });
    return [G.racine(k, [corps])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Architecture et design d'intérieur", target: 6, built: true,
  description: "Pieds d'architecture et de design d'intérieur, angles droits : montant graphite, mosaïque bleu Klein, papier à en-tête sauge, cote unique, gradins sable et brun, table des réalisations.",
  models: [montantAgence, maquette, enTeteAgence, coteUnique, gradinsAtelier, tableRealisations],
};
