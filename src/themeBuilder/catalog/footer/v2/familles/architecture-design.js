// Famille v2 « Architecture et design d'intérieur » — 6 modèles (ft2-308 à ft2-313), REFAITS à partir des captures 11 et 12 : ANGLES DROITS partout, vraies illustrations SVG (aides-illus-a03.js).
// Capture 11 (308, 309) : carte d'appel sombre illustrée (élévation d'immeuble, volumes isométriques), fondu clair vers sombre, pied sombre en colonnes.
// Capture 12 (310 à 313) : demi-page d'accueil (adresse, téléphone, horaires) face à une CARTE dessinée, bandeau de lettre en couleur, pied coloré avec grande marque dessinée et liens rapides.
// AUCUN chiffre, label ni coordonnée inventés : adresse, téléphone et horaires viennent des Données de l'entreprise ; les rubriques sont des EXEMPLES à renommer.
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; UNE animation visible par modèle (carré qui respire) ; pas d'animation d'entrée.
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const A = require("../aides-inspire-studios");
const I = require("../aides-illus-a03");
const { racineDe, lien, caps, trait, souffle, carre, horaires, coordonnees, lettre, nomDuSite } = A;
const { dessin, piece, bouton, colLiens, pied11 } = I;
const FAM = "architecture-design";
const MARGE = ["56px", "32px", "20px"];
const PAGES = [["Accueil", "/"], ["Réalisations", "/catalogue"], ["Journal", "/blog"], ["Questions", "/faq"], ["Contact", "/contact"]];
const texte = (k, t, o = {}) => k.T(`<p>${t}</p>`, { fontSize: `${o.taille || 16}px`, lineHeight: 1.65, color: o.couleur, fontFamily: o.police || k.S.font, maxWidth: o.max || "480px", textAlign: o.align });
// Demi-page de la capture 12 : un panneau + un côté illustré, en ligne qui passe à la ligne
const panneau = (k, enfants, fond) => k.col(enfants, { flexGrow: 1, flexBasis: "0px", minWidth: "320px", gap: "18px", alignItems: "flex-start", justifyContent: "center", backgroundColor: fond, paddingTop: "64px", paddingBottom: "64px", paddingLeft: "64px", paddingRight: "56px", boxSizing: "border-box", borderRadius: "0px" }, { paddingLeft: "40px", paddingRight: "32px", paddingTop: "48px", paddingBottom: "48px" }, { paddingTop: "40px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px", minWidth: "0px", flexBasis: "100%" });
const cote = (k, svg) => k.col([piece(k, svg)], { flexGrow: 1, flexBasis: "0px", minWidth: "320px", alignItems: "stretch", justifyContent: "center", boxSizing: "border-box" }, undefined, { minWidth: "0px", flexBasis: "100%" });
const demi = (k, G, gauche, droite, fond) => G.bande(k, [k.row([gauche, droite], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" })], { fond, colonne: true, max: "100%", padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], aligne: "stretch", nom: "Accueil et carte" });

// ═══ ft2-308 « Montant d'agence » — agence d'architecture — capture 11 : carte graphite avec élévation d'immeuble en plan coté, fondu béton vers graphite, pied en colonnes ═══
const montant = identite({
  key: "i308", label: "Graphite et terre cuite", humeur: "dark",
  fond: "#14181a", texte: "#f1ede4", discret: "#d9d5cc", accent: "#e8a07f", surface: "#1f2326", encre: "#14181a", surEncre: "#f1ede4",
  police: "font.archivo", titres: "font.source-serif-4",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#1f232633",
});
const BETON = "#e6e3dc", GRAPHITE = "#1f2326", TERRE = "#a8451f";
const montantAgence = modeleV2({
  id: identifiantV2(308, "montant-d-agence"), concept: "c-308-montant-d-agence",
  name: "Montant d'agence", family: FAM,
  description: "Pour une agence d'architecture : une carte graphite portant une grande phrase en serif face à un plan d'élévation dessiné et coté, un fondu béton vers graphite, puis un pied en colonnes (coupe dessinée, adresse, horaires, pages, réseaux).",
  tags: ["architecture", "élévation", "plan coté", "carte d'appel", "fondu", "graphite", "béton", "angles droits"],
  identity: montant, racine: racineDe("#14181a"),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "bizhours", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const art = piece(k, I.artPlan(520, 460));
    const contenu = [k.row([souffle(carre(k, "#e8a07f", "12px"), 3400), caps(k, "Agence d'architecture", { couleur: "#e8a07f", suivi: "0.26em" })], { gap: "12px", alignItems: "center" }),
      G.geant("<p>Des lieux à habiter, à vivre, à partager.</p>", { taille: [34, 80], lh: 1.02, suivi: "-0.02em", poids: "600", police: S.head, couleur: "#f1ede4" })(k, env),
      texte(k, "Une maison, un appartement, un lieu de travail : racontez-nous l'usage, nous dessinons l'espace.", { taille: 17, couleur: "#d9d5cc" }),
      k.row([bouton(k, "Parler de mon projet  →", "/contact", { couleur: "#ffffff", fond: TERRE, survolFond: "#f1ede4", survolTexte: GRAPHITE, focus: "#ffffff" }), bouton(k, "Réalisations", "/catalogue", { couleur: "#f1ede4", bord: "#f1ede499", survolFond: "#f1ede4", survolTexte: GRAPHITE, focus: "#e8a07f" })], { gap: "14px", flexWrap: "wrap" })];
    const carte = (enfants) => k.col(enfants, { flexGrow: 1, flexBasis: "0px", minWidth: "240px", gap: "12px", alignItems: "flex-start", paddingTop: "24px", paddingBottom: "24px", paddingLeft: "24px", paddingRight: "24px", borderStyle: "solid", borderWidth: "1px", borderColor: "#e8a07f88", borderRadius: "0px", boxSizing: "border-box" });
    const tete = k.row([k.row([piece(k, I.marque308(), { width: "84px" }), nomDuSite(k, env, 28, "#f1ede4", { fontFamily: S.font, fontWeight: "800" })], { gap: "18px", alignItems: "center" }), G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"]], { taille: 15, couleur: "#f1ede4", survol: "#e8a07f", focus: "#ffffff" })(k, env)], { rowGap: "16px", columnGap: "40px", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap" });
    const cartes = k.row([carte([caps(k, "Adresse", { couleur: "#e8a07f", suivi: "0.16em" }), coordonnees(k, { taille: 15, couleur: "#f1ede4", lien: "#ffffff", survol: "#e8a07f", focus: "#ffffff" })]), carte([caps(k, "Accueil à l'agence", { couleur: "#e8a07f", suivi: "0.16em" }), horaires(k, { taille: 15, couleur: "#f1ede4" })]), carte([colLiens(k, "Pages", PAGES, { titre: "#e8a07f", texte: "#f1ede4", survol: "#e8a07f", focus: "#ffffff" })])], { rowGap: "20px", columnGap: "20px", alignItems: "stretch", width: "100%", flexWrap: "wrap" });
    return [G.racine(k, pied11(k, env, G, { pos: "droite", aligne: "flex-start", art, carteFond: GRAPHITE, clair: BETON, sombre: "#14181a", contenu, pied: [tete, cartes, G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d9d5cc", liens: "#ffffff" })(k, env)] }))];
  },
}, FAM);

// ═══ ft2-309 « Maquette en blocs » — architecte d'intérieur — capture 11 : carte bleu Klein avec volumes isométriques en halo à gauche, fondu ivoire vers nuit, pied avec lettre ═══
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
  description: "Pour un architecte d'intérieur : une carte bleu Klein avec, à gauche, six volumes isométriques jaune, ivoire et nuit sous un halo, et l'appel en serif de Bodoni à droite ; fondu ivoire vers nuit ; pied avec lettre d'information, coordonnées et pages.",
  tags: ["architecte d'intérieur", "isométrique", "volumes", "halo", "bleu Klein", "jaune", "ivoire", "angles droits"],
  identity: blocs, racine: racineDe(NUIT),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "emailsubscribe", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const art = piece(k, I.artBlocs(520, 460));
    const contenu = [k.row([souffle(carre(k, JAUNE, "14px"), 3200), caps(k, "Architecture d'intérieur", { couleur: "#ffffff", suivi: "0.24em" })], { gap: "12px", alignItems: "center" }),
      G.geant("<p>Imaginons ensemble l'intérieur qui vous ressemble.</p>", { taille: [34, 76], lh: 1.04, suivi: "-0.02em", poids: "500", police: S.head, couleur: "#ffffff" })(k, env),
      k.row([bouton(k, "Prendre rendez-vous  →", "/contact", { couleur: NUIT, fond: JAUNE, survolFond: "#ffffff", survolTexte: KLEIN, focus: "#ffffff" }), bouton(k, "Nos réalisations", "/catalogue", { couleur: "#ffffff", bord: "#ffffffaa", survolFond: "#ffffff", survolTexte: KLEIN, focus: JAUNE })], { gap: "14px", flexWrap: "wrap" })];
    const abo = lettre(k, env, { titre: "Lettre de l'agence", intro: "Chantiers terminés et coulisses, de temps en temps.", bouton: "S'abonner", largeur: "460px", accent: JAUNE, texte: "#f4f1e8", surBouton: NUIT, fond: NUIT, survolBouton: "#ffffff", survolTexte: NUIT, soulignement: "2px", couleurTitre: JAUNE, focus: "#ffffff" });
    const haut = k.row([k.row([piece(k, I.marque309(), { width: "96px" }), nomDuSite(k, env, 30, "#ffffff", { fontWeight: "500" })], { gap: "18px", alignItems: "center" }), abo], { rowGap: "24px", columnGap: "48px", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap" });
    const ligne = k.row([coordonnees(k, { taille: 15, couleur: "#f4f1e8", lien: "#ffffff", survol: JAUNE, focus: "#ffffff", layout: "inline" }), k.row(PAGES.map(([t, u]) => lien(k, t, u, { taille: 15, poids: "500", couleur: "#f4f1e8", survol: { color: JAUNE, transform: { y: -3 } }, focus: "#ffffff" })), { rowGap: "0px", columnGap: "24px", flexWrap: "wrap", alignItems: "center" })], { rowGap: "12px", columnGap: "40px", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap" });
    return [G.racine(k, pied11(k, env, G, { pos: "gauche", aligne: "flex-start", art, carteFond: KLEIN, clair: IVOIRE2, sombre: NUIT, contenu, pied: [haut, trait(k, "#ffffff33", "1px"), ligne, G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d7deef", liens: "#ffffff" })(k, env)] }))];
  },
}, FAM);

// ═══ ft2-310 « En-tête d'agence » — design d'espace — capture 12 : accueil à gauche + médaillon, CARTE dessinée à droite, bandeau de lettre olive, pied vert encre avec arche dessinée ═══
const enTete = identite({
  key: "i310", label: "Vert encre et sauge", humeur: "dark",
  fond: "#1e2b22", texte: "#e3e8df", discret: "#d3dacd", accent: "#c9d6a6", surface: "#16201a", encre: "#1e2b22", surEncre: "#e3e8df",
  police: "font.work-sans", titres: "font.cormorant-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#1e2b2255",
});
const SAUGE = "#e3e8df", VERT_ENCRE = "#1e2b22", OLIVE = "#4a5a2a";
const enTeteAgence = modeleV2({
  id: identifiantV2(310, "en-tete-d-agence"), concept: "c-310-en-tete-d-agence",
  name: "En-tête d'agence", family: FAM,
  description: "Pour une agence de design d'espace : accueil sauge (adresse, horaires, médaillon) face à une carte de quartier dessinée, bandeau de lettre olive, puis pied vert encre avec grande arche dessinée et liens rapides.",
  tags: ["design d'espace", "carte dessinée", "médaillon", "lettre d'information", "sauge", "olive", "serif", "angles droits"],
  identity: enTete, racine: racineDe(VERT_ENCRE),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "bizhours", "emailsubscribe", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = k.T("<p>Venez nous voir</p>", { fontSize: "fluid:38-68", lineHeight: 1.02, fontFamily: S.head, fontWeight: "500", color: VERT_ENCRE, letterSpacing: "-0.01em" });
    const entete = k.row([k.col([titre], { flexGrow: 1, flexBasis: "0px", minWidth: "200px" }), piece(k, I.badge310(), { width: "118px", flexShrink: 0 })], { gap: "20px", alignItems: "flex-start", width: "100%", flexWrap: "nowrap" });
    const g = panneau(k, [k.row([souffle(carre(k, OLIVE, "10px"), 3600), caps(k, "Agence de design d'espace", { couleur: OLIVE, suivi: "0.3em" })], { gap: "10px", alignItems: "center" }), entete, texte(k, "Passez voir les maquettes et les échantillons de matériaux, ou écrivez-nous pour fixer un rendez-vous.", { couleur: "#3d4d42" }), caps(k, "Adresse et contact", { couleur: OLIVE, suivi: "0.2em" }), coordonnees(k, { taille: 16, couleur: VERT_ENCRE, lien: OLIVE, survol: VERT_ENCRE, focus: OLIVE }), caps(k, "Accueil", { couleur: OLIVE, suivi: "0.2em" }), horaires(k, { taille: 15, couleur: VERT_ENCRE })], SAUGE);
    const haut = demi(k, G, g, cote(k, I.carte310(720, 640)), SAUGE);
    const abo = lettre(k, env, { titre: "Lettre de l'agence", intro: "Un message de temps en temps : projets terminés, matières, rencontres.", bouton: "S'abonner", largeur: "460px", accent: SAUGE, texte: "#f1f4ea", surBouton: VERT_ENCRE, fond: OLIVE, survolBouton: "#ffffff", survolTexte: OLIVE, soulignement: "2px", couleurTitre: "#f1f4ea", focus: "#ffffff" });
    const bandeau = G.bande(k, [k.row([caps(k, "Rester en contact", { couleur: "#f1f4ea", suivi: "0.22em" }), abo], { rowGap: "20px", columnGap: "48px", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap" })], { fond: OLIVE, colonne: true, padV: ["44px", "36px", "32px"], padB: ["44px", "36px", "32px"], padH: MARGE, nom: "Lettre" });
    const marque = k.row([piece(k, I.marque310(), { width: "140px" }), k.col([nomDuSite(k, env, 30, "#e3e8df", { fontWeight: "500" }), texte(k, "Agence de design d'espace : plans, matières, lumière.", { taille: 15, couleur: "#d3dacd", max: "300px" })], { gap: "10px" })], { gap: "22px", alignItems: "center", flexWrap: "wrap" });
    const ligneLiens = k.row(PAGES.map(([t, u]) => lien(k, t, u, { taille: 15, poids: "500", couleur: "#e3e8df", survol: { color: "#ffffff", transform: { y: -3 } }, focus: "#ffffff" })), { rowGap: "0px", columnGap: "26px", alignItems: "center", flexWrap: "wrap" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Pinterest", "https://www.pinterest.com/"]], { taille: 15, couleur: "#e3e8df", survol: "#ffffff", focus: "#ffffff" })(k, env);
    const pied = G.bande(k, [marque, k.row([ligneLiens, reseaux], { rowGap: "12px", columnGap: "40px", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap" }), trait(k, "#e3e8df44", "1px"), G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#d3dacd", liens: "#ffffff" })(k, env)], { fond: VERT_ENCRE, colonne: true, gap: "26px", padV: ["48px", "40px", "32px"], padB: ["24px", "20px", "16px"], padH: MARGE, nom: "Pied" });
    return [G.racine(k, [haut, bandeau, pied])];
  },
}, FAM);

// ═══ ft2-311 « Cote unique » — bureau d'études — capture 12 inversée : CARTE cadastrale à gauche, accueil blanc à droite, bandeau noir, pied rouge de cote ═══
const cote311 = identite({
  key: "i311", label: "Rouge de cote et blanc", humeur: "dark",
  fond: "#d42a0b", texte: "#ffffff", discret: "#ffffff", accent: "#ffffff", surface: "#b82208", encre: "#d42a0b", surEncre: "#ffffff",
  police: "font.dm-mono", titres: "font.dm-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#11111133",
});
const ROUGE = "#d42a0b", NOIR3 = "#111111";
const coteUnique = modeleV2({
  id: identifiantV2(311, "cote-unique"), concept: "c-311-cote-unique",
  name: "Cote unique", family: FAM,
  description: "Pour un bureau d'architecture : un plan cadastral dessiné à gauche (parcelles, hachures, cotes rouges, flèche du nord), l'accueil blanc en monospace à droite, un bandeau noir de lettre d'information, puis un pied rouge avec marque en équerre et liens rapides.",
  tags: ["architecture", "cadastre", "cotes", "plan", "monospace", "rouge", "noir", "angles droits"],
  identity: cote311, racine: racineDe(ROUGE),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "bizhours", "emailsubscribe", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = k.T("<p>Passez nous voir.</p>", { fontSize: "fluid:34-64", lineHeight: 1.04, fontFamily: S.head, fontWeight: "500", color: NOIR3, letterSpacing: "-0.03em" });
    const d = panneau(k, [k.row([souffle(carre(k, ROUGE, "12px"), 3000), caps(k, "Bureau d'études", { couleur: ROUGE, suivi: "0.2em" })], { gap: "10px", alignItems: "center" }), titre, texte(k, "Plans, cotes et maquettes sur rendez-vous : écrivez-nous ou venez au bureau.", { couleur: "#3a3a3a", taille: 15 }), coordonnees(k, { taille: 15, couleur: NOIR3, lien: ROUGE, survol: NOIR3, focus: ROUGE }), caps(k, "Horaires", { couleur: ROUGE, suivi: "0.2em" }), horaires(k, { taille: 14, couleur: NOIR3 })], "#ffffff");
    const haut = demi(k, G, cote(k, I.carte311(720, 640)), d, "#ffffff");
    const abo = lettre(k, env, { titre: "Journal de chantier", intro: "Un message de temps en temps : plans, coupes, chantiers.", bouton: "S'abonner", largeur: "100%", accent: NOIR3, texte: "#ffffff", surBouton: "#ffffff", fond: ROUGE, survolBouton: "#ffffff", survolTexte: ROUGE, soulignement: "2px", couleurTitre: "#ffffff", focus: "#ffffff" });
    const marque = k.row([piece(k, I.marque311(), { width: "120px" }), k.col([nomDuSite(k, env, 22, "#ffffff", { fontFamily: S.font, fontWeight: "500" }), texte(k, "Études, plans et suivi de chantier.", { taille: 14, couleur: "#ffffff", max: "260px" })], { gap: "8px" })], { gap: "18px", alignItems: "center", flexGrow: 3, flexBasis: "0px", minWidth: "260px", flexWrap: "wrap" });
    const liens = colLiens(k, "Liens rapides", PAGES, { titre: "#ffffff", texte: "#ffffff", survol: "#111111", focus: "#ffffff", taille: 15 });
    const colAbo = k.col([abo], { flexGrow: 3, flexBasis: "0px", minWidth: "280px" });
    const pied = G.bande(k, [k.row([marque, liens, colAbo], { rowGap: "28px", columnGap: "48px", alignItems: "flex-start", width: "100%", flexWrap: "wrap" }), trait(k, "#ffffff66", "1px"), G.ligneLegale({ taille: 12, sansCookies: true, couleur: "#ffffff", liens: "#ffffff" })(k, env)], { fond: ROUGE, colonne: true, gap: "28px", padV: ["48px", "40px", "32px"], padB: ["24px", "20px", "16px"], padH: MARGE, nom: "Pied" });
    return [G.racine(k, [haut, pied])];
  },
}, FAM);

// ═══ ft2-312 « Gradins d'atelier » — design d'intérieur — capture 12 : accueil en trois colonnes sable, plan d'appartement dessiné en grande bande, bandeau de lettre brun, pied papier avec fauteuil dessiné ═══
const gradins = identite({
  key: "i312", label: "Sable, terre et brun", humeur: "light",
  fond: "#faf6ee", texte: "#2b1d14", discret: "#5c4636", accent: "#8a3b12", surface: "#e6d3b9", encre: "#2b1d14", surEncre: "#faf6ee",
  police: "font.zilla-slab", titres: "font.barlow-condensed",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "1px", ligne: "#2b1d1433",
});
const PAPIER = "#faf6ee", BRUN = "#2b1d14", G1 = "#f0e6d4", BRUN_T = "#8a3b12";
const gradinsAtelier = modeleV2({
  id: identifiantV2(312, "gradins-d-atelier"), concept: "c-312-gradins-d-atelier",
  name: "Gradins d'atelier", family: FAM,
  description: "Pour un atelier de design d'intérieur : accueil sable en trois colonnes, grand plan d'appartement dessiné pleine largeur, bandeau de lettre brun, puis pied papier avec fauteuil dessiné et liens rapides.",
  tags: ["design d'intérieur", "plan d'appartement", "mobilier", "sable", "brun", "lettre d'information", "angles droits"],
  identity: gradins, racine: racineDe(PAPIER),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "bizhours", "emailsubscribe", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const plan = G.bande(k, dessin(k, I.plan312(1440, 340), I.plan312(480, 420)), { fond: G1, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", aligne: "stretch", gap: "0px", nom: "Plan" });
    const titre = k.T("<p>Entrez dans l'atelier.</p>", { fontSize: "fluid:40-76", lineHeight: 1, fontFamily: S.head, fontWeight: "700", color: BRUN, textTransform: "uppercase", letterSpacing: "0.01em", textAlign: "center" });
    const abo = lettre(k, env, { titre: "Lettre de l'atelier", intro: "Un message de temps en temps : matières, essais, rencontres.", bouton: "S'abonner", largeur: "480px", accent: BRUN_T, texte: BRUN, surBouton: "#ffffff", fond: G1, survolBouton: BRUN, survolTexte: "#ffffff", soulignement: "2px", couleurTitre: BRUN, focus: BRUN_T });
    const infos = k.row([k.col([caps(k, "Adresse et contact", { couleur: BRUN_T, suivi: "0.2em", police: S.head }), coordonnees(k, { taille: 16, couleur: BRUN, lien: BRUN, survol: BRUN_T, focus: BRUN_T })], { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "240px", alignItems: "center", textAlign: "center" }), k.col([caps(k, "Accueil", { couleur: BRUN_T, suivi: "0.2em", police: S.head }), horaires(k, { taille: 15, couleur: BRUN })], { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "240px", alignItems: "center" })], { rowGap: "24px", columnGap: "64px", alignItems: "flex-start", justifyContent: "center", width: "100%", maxWidth: "820px", flexWrap: "wrap" });
    const centre = G.bande(k, [k.row([souffle(carre(k, BRUN_T, "12px"), 3400), caps(k, "Atelier de design d'intérieur", { couleur: BRUN_T, suivi: "0.22em", police: S.head })], { gap: "10px", alignItems: "center", justifyContent: "center" }), titre, infos, abo], { fond: G1, colonne: true, aligne: "center", gap: "28px", padV: ["64px", "52px", "40px"], padB: ["64px", "52px", "40px"], padH: MARGE, nom: "Accueil" });
    const marque = k.col([piece(k, I.marque312(), { width: "120px", alignSelf: "center" }), nomDuSite(k, env, 34, BRUN, { fontWeight: "700", textTransform: "uppercase", textAlign: "center" })], { gap: "10px", alignItems: "center" });
    const liens = k.row(PAGES.map(([t, u]) => lien(k, t, u, { taille: 17, poids: "600", couleur: BRUN, soulign: true, survol: { color: BRUN_T, transform: { y: -3 } }, focus: BRUN_T, extra: { textUnderlineOffset: "5px", marginLeft: "12px", marginRight: "12px" } })), { gap: "0px", justifyContent: "center", alignItems: "center", flexWrap: "wrap" });
    const pied = G.bande(k, [marque, liens, G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Pinterest", "https://www.pinterest.com/"]], { taille: 15, couleur: BRUN, survol: BRUN_T, focus: BRUN_T })(k, env), trait(k, "#2b1d1444", "1px"), G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#5c4636", liens: BRUN })(k, env, true)], { fond: PAPIER, colonne: true, aligne: "center", gap: "22px", padV: ["48px", "40px", "32px"], padB: ["24px", "20px", "16px"], padH: MARGE, nom: "Pied" });
    return [G.racine(k, [plan, centre, pied])];
  },
}, FAM);

// ═══ ft2-313 « Table des réalisations » — agence d'architecture — capture 12 : accueil nuit à gauche, CARTE de nuit à droite (itinéraire lime), bandeau lime, pied avec skyline-monogramme ═══
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
  description: "Pour une agence d'architecture : un accueil vert nuit en capitales condensées (adresse, horaires, bouton vert vif) face à une carte de nuit dessinée avec itinéraire lime, un bandeau vert vif de lettre d'information, puis un pied avec monogramme skyline et liens rapides.",
  tags: ["architecture", "carte de nuit", "itinéraire", "vert nuit", "vert vif", "capitales", "angles droits"],
  identity: table, racine: racineDe(VERT_N),
  widgets: ["html", "sitetitle", "text", "link", "bizcontact", "bizhours", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = k.T("<p>Passez à l'agence</p>", { fontSize: "fluid:40-84", lineHeight: 1, fontFamily: S.head, fontWeight: "600", color: "#eef3ea", textTransform: "uppercase", letterSpacing: "0.01em" });
    const g = k.col([k.row([souffle(carre(k, VIF, "12px"), 3200), caps(k, "Agence d'architecture", { couleur: VIF, suivi: "0.3em" })], { gap: "10px", alignItems: "center" }), titre, texte(k, "Projets en cours, maquettes et matériaux : venez les voir, ou prenez rendez-vous.", { couleur: "#c9d4cc" }), bouton(k, "Prendre rendez-vous  →", "/contact", { couleur: VERT_N, fond: VIF, survolFond: "#ffffff", survolTexte: VERT_N, focus: "#ffffff" })], { gap: "18px", flexGrow: 3, flexBasis: "0px", minWidth: "300px", alignItems: "flex-start" });
    const d = k.col([caps(k, "Adresse et contact", { couleur: VIF, suivi: "0.2em" }), coordonnees(k, { taille: 16, couleur: "#eef3ea", lien: "#ffffff", survol: VIF, focus: VIF }), caps(k, "Accueil", { couleur: VIF, suivi: "0.2em" }), horaires(k, { taille: 15, couleur: "#eef3ea" })], { gap: "12px", flexGrow: 2, flexBasis: "0px", minWidth: "260px", alignItems: "flex-start" });
    const carteBande = G.bande(k, dessin(k, I.carte313(1440, 340), I.carte313(480, 360)), { fond: VERT_N, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", aligne: "stretch", gap: "0px", nom: "Carte" });
    const accueil = G.bande(k, [k.row([g, d], { rowGap: "28px", columnGap: "56px", alignItems: "flex-start", width: "100%", flexWrap: "wrap" })], { fond: VERT_N, colonne: true, padV: ["56px", "44px", "36px"], padB: ["56px", "44px", "36px"], padH: MARGE, nom: "Accueil" });
    const abo = lettre(k, env, { titre: "Lettre de l'agence", intro: "Un message de temps en temps : chantiers, maquettes, rencontres.", bouton: "S'abonner", largeur: "460px", accent: VERT_N, texte: VERT_N, surBouton: VIF, fond: VIF, survolBouton: "#ffffff", survolTexte: VERT_N, soulignement: "2px", couleurTitre: VERT_N, focus: VERT_N });
    const bandeau = G.bande(k, [k.row([caps(k, "Rester en contact", { couleur: VERT_N, suivi: "0.22em" }), abo], { rowGap: "20px", columnGap: "48px", alignItems: "center", justifyContent: "space-between", width: "100%", flexWrap: "wrap" })], { fond: VIF, colonne: true, padV: ["44px", "36px", "32px"], padB: ["44px", "36px", "32px"], padH: MARGE, nom: "Lettre" });
    const marque = k.col([piece(k, I.marque313(), { width: "130px" }), nomDuSite(k, env, 28, "#eef3ea", { fontWeight: "600", textTransform: "uppercase" }), G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["LinkedIn", "https://www.linkedin.com/"]], { taille: 15, couleur: "#eef3ea", survol: VIF, focus: VIF })(k, env)], { gap: "12px", alignItems: "flex-start", flexGrow: 2, flexBasis: "0px", minWidth: "240px" });
    const rang = (t, u) => A.rangee(k, `${t}  ↗`, u, { taille: 22, police: S.head, couleur: "#eef3ea", fondSurvol: VIF, couleurSurvol: VERT_N, ligne: "#eef3ea55", focus: VIF, h: "60px", extra: { textTransform: "uppercase" } });
    const index = k.col([rang("Maisons", "/catalogue"), rang("Intérieurs", "/catalogue"), rang("Équipements publics", "/blog"), rang("Mobilier sur mesure", "/boutique"), rang("Contact", "/contact")], { gap: "0px", flexGrow: 3, flexBasis: "0px", minWidth: "280px", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#eef3ea55" });
    const pied = G.bande(k, [k.row([marque, index], { rowGap: "28px", columnGap: "56px", alignItems: "flex-start", width: "100%", flexWrap: "wrap" }), G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#aebcb2", liens: "#eef3ea" })(k, env)], { fond: VERT_N, colonne: true, gap: "28px", padV: ["48px", "40px", "32px"], padB: ["24px", "20px", "16px"], padH: MARGE, nom: "Pied" });
    return [G.racine(k, [carteBande, accueil, bandeau, pied])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Architecture et design d'intérieur", target: 6, built: true,
  description: "Pieds d'architecture et de design d'intérieur, angles droits, illustrés : plan coté, volumes isométriques, cartes dessinées (quartier, cadastre, nuit), plan d'appartement.",
  models: [montantAgence, maquette, enTeteAgence, coteUnique, gradinsAtelier, tableRealisations],
};
