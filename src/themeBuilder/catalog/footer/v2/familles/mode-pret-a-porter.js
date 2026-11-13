// Famille v2 « Mode et prêt-à-porter » — 6 modèles (ft2-314 à ft2-319), pieds « inspirés de captures » REFAITS avec de vraies illustrations vectorielles : ANGLES DROITS partout.
// Marques fictives (Orme, Saison, Fil & Maille, Cobalt, Sillage, Rosalie) ; aucune coordonnée ni chiffre inventé : horaires, adresse et téléphone viendraient des Données de l'entreprise du site.
// Rubriques (Femme, Homme, Soldes…) = intitulés d'EXEMPLE à renommer dans l'éditeur ; adresses de réseaux = exemples.
// Partis pris : 314 et 315 = nom monumental dessiné (capture « static ») · 316 et 317 = appel centré, curseurs flottants, rangée de pictos, pied de colonnes (capture « WorkScale ») · 318 et 319 = grande scène illustrée en bas + mascotte (capture « BOTSnDOTS »).
// MOUVEMENT (coupé sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; une animation visible par modèle (bouton ou carré qui respire) ; pas d'animation d'entrée.
const { modeleV2, identifiantV2 } = require("../kit-v2");
const A = require("../aides-a04");
const IB = require("../aides-illus-a04b");
const I_ = require("../aides-illus-a04");
const { identite, PAD, racineDe, lien, caps, texte, trait, souffle, carre, bouton, bloc, mentions, reseaux, abonnement } = A;
const FAM = "mode-pret-a-porter";
const liensCol = (k, l, o) => l.map(([a, u]) => lien(k, a, u, { taille: 16, poids: "500", couleur: o.c, survol: { color: o.s, transform: { x: 4 } }, focus: o.s }));

// ── ft2-314 « Orme monumental » — capture 14 : gris papier, phrase d'accueil et deux colonnes en haut, NOM DESSINÉ géant dessous (cintre accroché sur le « m », carré orange).
const orme = identite({ key: "i314", label: "Gris papier, noir et orange brûlé", humeur: "light", fond: "#efeeea", texte: "#0d0d0d", discret: "#55554f", accent: "#c8381a", surface: "#e4e3dd", encre: "#efeeea", surEncre: "#0d0d0d", police: "font.inter-tight", titres: "font.archivo-black", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#0d0d0d33" });
const ormeMod = modeleV2({
  id: identifiantV2(314, "orme-monumental"), concept: "c-314-orme-monumental", name: "Orme monumental", family: FAM,
  description: "Pour une marque de prêt-à-porter : une phrase d'accueil et deux colonnes de liens sobres, puis le nom « orme » dessiné en lettres géantes sur toute la largeur, avec un cintre accroché au m et un carré orange. Gris papier, noir et orange brûlé.",
  tags: ["prêt-à-porter", "nom monumental", "illustration", "cintre", "gris", "noir", "orange", "angles droits"],
  identity: orme, racine: racineDe("#efeeea"), widgets: ["text", "link", "html", "copyright", "bizlegal", "divider"],
  compose(k0, env, G) {
    const k = A.fixe(k0); const S = k.S;
    const mot = k.T("<p>Une question sur une taille, une commande ou un retour ?</p>", { fontSize: "22px", lineHeight: 1.3, fontWeight: "700", color: "#0d0d0d", fontFamily: S.font, maxWidth: "460px" });
    const intro = texte(k, "Notre équipe répond à la boutique, par écrit, du lundi au samedi. Les vêtements sont conçus pour durer plusieurs saisons.", { taille: 16, couleur: "#55554f", largeur: "440px" });
    const ecrire = k.row([souffle(carre(k, "#c8381a", "12px"), 3000), lien(k, "Écrire à la boutique", "/contact", { taille: 16, poids: "700", couleur: "#0d0d0d", soulign: true, survol: { color: "#c8381a" }, focus: "#c8381a" })], { gap: "12px" });
    const col = (t, l) => bloc(k, t, liensCol(k, l, { c: "#55554f", s: "#0d0d0d" }), { couleurTitre: "#0d0d0d", gap: "0px", min: "150px", poids: 0.45, extra: { flexBasis: "190px" } });
    const gauche = G.colonne(k, [k.col([mot, intro], { gap: "14px" }), ecrire], { poids: 2.7, min: "280px", gap: "28px", justifie: "space-between" });
    const c1 = col("Boutique", [["Femme", "/boutique"], ["Homme", "/boutique"], ["Nouveautés", "/boutique"], ["Soldes", "/boutique"]]);
    const c2 = col("Service", [["Livraison", "/faq"], ["Retours", "/faq"], ["Guide des tailles", "/faq"], ["Contact", "/contact"]]);
    const haut = G.bande(k, [gauche, k.row([c1, c2], { gap: "40px", alignItems: "flex-start", flexWrap: "wrap", flexGrow: 1, flexBasis: "420px", maxWidth: "460px" })], { fond: "#efeeea", gap: "40px 64px", aligne: "flex-start", padV: ["72px", "56px", "44px"], padB: ["72px", "56px", "40px"], padH: PAD, nom: "Accueil et liens" });
    const mono = IB.bandeMot(k, G, { texte: "orme", couleur: "#0d0d0d", fond: "#efeeea", marge: 56, sw: 28, ecart: 22,
      deco: () => `<rect x="408" y="-20" width="34" height="34" fill="#c8381a"/><path d="M310,6 V-26 H326" stroke="#c8381a" stroke-width="7" fill="none"/><path d="M262,34 L310,6 L358,34 Z" stroke="#c8381a" stroke-width="7" fill="none"/>` });
    const bas = G.bande(k, [reseaux(k, env, { couleur: "#0d0d0d", survol: "#c8381a", focus: "#c8381a" }), trait(k, "#0d0d0d33"), mentions(k, env, { couleur: "#55554f", liens: "#0d0d0d" })], { fond: "#efeeea", colonne: true, gap: "18px", padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: PAD, nom: "Mentions" });
    bas.styles.desktop.color = "#55554f";
    return [G.racine(k, [haut, mono, bas])];
  },
}, FAM);

// ── ft2-315 « Deux saisons » — capture 14 : terre cuite, grande phrase + lettre d'information en haut, NOM « saison » dessiné en crème, un soleil et son halo au-dessus du i.
const saison = identite({ key: "i315", label: "Terre cuite et crème", humeur: "dark", fond: "#a63f22", texte: "#f6ecdd", discret: "#f6dcc9", accent: "#f6ecdd", surface: "#8f3219", encre: "#f6ecdd", surEncre: "#a63f22", police: "font.karla", titres: "font.instrument-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f6ecdd55" });
const saisonMod = modeleV2({
  id: identifiantV2(315, "deux-saisons"), concept: "c-315-deux-saisons", name: "Deux saisons", family: FAM,
  description: "Pour une boutique de mode : sur terre cuite, la grande phrase d'accueil, les rayons, l'aide et la lettre d'information, puis le nom « saison » dessiné en crème sur toute la largeur, un soleil et son halo posés sur le i.",
  tags: ["boutique de mode", "nom monumental", "illustration", "soleil", "terre cuite", "crème", "angles droits"],
  identity: saison, racine: racineDe("#a63f22"), widgets: ["text", "link", "html", "emailsubscribe", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0); const S = k.S, T = "#a63f22", C = "#f6ecdd", D = "#f6dcc9";
    const phrase = G.geant(`<p>Habillez<br>la saison.</p>`, { taille: [48, 104], tablette: { taille: [64, 88] }, mobile: { taille: [48, 60] }, lh: 0.95, suivi: "-0.01em", poids: "400", police: S.head, couleur: C })(k, env);
    const gros = souffle(bouton(k, "Voir la collection", "/boutique", { texte: T, fond: C, bord: C, survol: { backgroundColor: "#2a1a12", borderColor: "#2a1a12", color: C, transform: { y: -3 } }, focus: C }), 4200);
    const gauche = G.colonne(k, [caps(k, "Collection d'hiver", { couleur: D, suivi: "0.22em" }), phrase, gros], { poids: 1.5, min: "300px", gap: "24px" });
    const col = (t, l) => bloc(k, t, liensCol(k, l, { c: C, s: "#2a1a12" }), { couleurTitre: D, gap: "0px", min: "130px" });
    const abo = abonnement(k, env, { titre: "Le courrier de saison", intro: "Nouveautés et ventes privées, de temps en temps.", bouton: "Je m'abonne", largeur: "100%", accent: C, texte: C, titreC: C, introC: D, boutonC: T, boutonH: ["#2a1a12", C] });
    const droite = G.colonne(k, [col("Rayons", [["Femme", "/boutique"], ["Homme", "/boutique"], ["Soldes", "/boutique"]]), col("Aide", [["Livraison", "/faq"], ["Retours", "/faq"], ["Contact", "/contact"]]), abo], { poids: 1.3, min: "300px", gap: "24px", aligne: "stretch" });
    const haut = G.bande(k, [gauche, droite], { fond: T, gap: "40px 64px", aligne: "flex-start", padV: ["72px", "56px", "44px"], padB: ["56px", "44px", "32px"], padH: PAD, nom: "Phrase et lettre" });
    const mono = IB.bandeMot(k, G, { texte: "saison", couleur: C, fond: T, marge: 130, sw: 28, ecart: 22,
      deco0: () => I_.halo(244, -46, 125, "#ffd9a0", 6, 0.12),
      deco: () => `<circle cx="244" cy="-46" r="34" fill="#ffd9a0"/>` + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `<line x1="${244 + Math.cos(i * 0.5236) * 46}" y1="${-46 + Math.sin(i * 0.5236) * 46}" x2="${244 + Math.cos(i * 0.5236) * 64}" y2="${-46 + Math.sin(i * 0.5236) * 64}" stroke="#ffd9a0" stroke-width="6"/>`).join("") });
    const bas = G.bande(k, [mentions(k, env, { couleur: D, liens: C })], { fond: T, colonne: true, padV: ["20px", "18px", "16px"], padB: ["24px", "20px", "18px"], padH: PAD, nom: "Mentions" });
    bas.styles.desktop.color = D;
    return [G.racine(k, [haut, mono, bas])];
  },
}, FAM);

// ── ft2-316 « Barre de cintre » — capture 13 : appel centré, curseurs flottants, rangée de pictos de vêtements, pied de quatre colonnes, pastilles de réseaux.
const maille = identite({ key: "i316", label: "Noir, ivoire et ocre", humeur: "light", fond: "#fafaf7", texte: "#161616", discret: "#5a5a54", accent: "#8a6414", surface: "#efeee8", encre: "#fafaf7", surEncre: "#161616", police: "font.work-sans", titres: "font.bodoni-moda", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#16161633" });
const mailleMod = modeleV2({
  id: identifiantV2(316, "barre-de-cintre"), concept: "c-316-barre-de-cintre", name: "Barre de cintre", family: FAM,
  description: "Pour une maison de maille : un grand appel centré avec deux boutons, des étiquettes de curseurs qui flottent sur des guides pointillés, une rangée de cinq vêtements dessinés, puis la marque et quatre colonnes de liens avec pastilles de réseaux. Noir, ivoire, ocre.",
  tags: ["maille", "prêt-à-porter", "appel centré", "curseurs", "vêtements dessinés", "ivoire", "ocre", "angles droits"],
  identity: maille, racine: racineDe("#fafaf7"), widgets: ["text", "link", "html", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const bandes = IB.heros(k, env, G, { v: 1, cv: 3, fond: "#fafaf7", fondRangee: "#efeee8", fondPied: "#fafaf7", encre: "#161616", discret: "#5a5a54", accent: "#161616", accent2: "#8a6414", survol: "#8a6414", surTexte: "#ffffff", titreCol: "#8a6414", filet: "#16161633", emblemeForme: "pelote",
      curseurs: ["#161616", "#8a6414", "#b23a2a", "#2d5a8c", "#4a6b3a"], pictos: I_.garments, traitRangee: "#8c8c84", accentRangee: "#8a6414", poidsTitre: "500", suivi: "-0.01em", ordre: "chrp",
      titre: "<p>Un fil, une forme,<br>des hivers.</p>", sous: "Pulls, gilets et écharpes tricotés pour durer. Posez une question, l'équipe répond par écrit.", b1: ["Voir la maille", "/boutique", "#161616", "#fafaf7"], b2: ["Écrire à la boutique", "/contact", "#fafaf7"], marqueNom: "Fil &amp; Maille",
      phrase: "Maison de maille : un fil, une forme, des années.", cols: [["Femme", [["Robes", "/boutique"], ["Mailles", "/boutique"], ["Manteaux", "/boutique"]]], ["Homme", [["Chemises", "/boutique"], ["Mailles", "/boutique"], ["Vestes", "/boutique"]]], ["Boutique", [["Nouveautés", "/boutique"], ["Soldes", "/boutique"], ["Cartes cadeaux", "/boutique"]]], ["Aide", [["Livraison", "/faq"], ["Retours", "/faq"], ["Contact", "/contact"]]]] });
    return [G.racine(k, bandes)];
  },
}, FAM);

// ── ft2-317 « Damier des rayons » — capture 13 en cobalt : titre centré en tête, pictos urbains, curseurs, pied sombre.
const cobalt = identite({ key: "i317", label: "Cobalt, jaune et blanc", humeur: "dark", fond: "#1b34c7", texte: "#ffffff", discret: "#dfe5ff", accent: "#ffe14d", surface: "#2a42d6", encre: "#1b34c7", surEncre: "#ffffff", police: "font.epilogue", titres: "font.unbounded", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff66" });
const cobaltMod = modeleV2({
  id: identifiantV2(317, "damier-des-rayons"), concept: "c-317-damier-des-rayons", name: "Damier des rayons", family: FAM,
  description: "Pour une marque de mode urbaine : un appel centré jaune sur cobalt, une rangée de cinq objets de la rue dessinés (basket, casquette, veste, sac, bouteille), des étiquettes de curseurs flottantes, puis un pied bleu nuit à quatre colonnes. Cobalt, jaune, blanc.",
  tags: ["mode urbaine", "appel centré", "curseurs", "objets dessinés", "cobalt", "jaune", "angles droits"],
  identity: cobalt, racine: racineDe("#1b34c7"), widgets: ["text", "link", "html", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const bandes = IB.heros(k, env, G, { v: 2, cv: 3, fond: "#1b34c7", fondPied: "#0f1f84", fondRangee: "#0f1f84", encre: "#ffffff", discret: "#dfe5ff", accent: "#ffe14d", accent2: "#ffe14d", survol: "#ffffff", surTexte: "#1b34c7", titreCol: "#ffe14d", filet: "#ffffff44", emblemeForme: "cube",
      curseurs: ["#ffe14d", "#ff5a8a", "#0f1f84", "#16b87f", "#8a4ff0"], pictos: I_.urbains, traitRangee: "#dfe5ff", accentRangee: "#ffe14d", poidsTitre: "800", suivi: "-0.03em", ordre: "hrcp",
      titre: "<p>La rue<br>se porte ici.</p>", sous: "Sweats, vestes et accessoires pour la ville. Les rayons, la livraison et les retours en un clic.", b1: ["Voir la boutique", "/boutique", "#ffe14d", "#1b34c7"], b2: ["Livraison et retours", "/faq", "#1b34c7"], marqueNom: "Cobalt",
      phrase: "Mode urbaine pour tous les jours.", cols: [["Rayons", [["Femme", "/boutique"], ["Homme", "/boutique"], ["Enfant", "/boutique"]]], ["Nouveautés", [["Cette semaine", "/boutique"], ["Soldes", "/boutique"]]], ["Services", [["Livraison", "/faq"], ["Retours", "/faq"], ["Guide des tailles", "/faq"]]], ["Marque", [["Contact", "/contact"], ["Questions", "/faq"]]]] });
    return [G.racine(k, bandes)];
  },
}, FAM);

// ── ft2-318 « Ligne de caisse » — capture 15 : marque et phrase à gauche, mouette-mascotte, quatre colonnes à titres or, grande scène de mer et de phare en bas.
const sillage = identite({ key: "i318", label: "Vert sapin, sable et or", humeur: "dark", fond: "#10261c", texte: "#f1ead9", discret: "#c9d3c3", accent: "#e8c872", surface: "#173428", encre: "#10261c", surEncre: "#f1ead9", police: "font.hanken-grotesk", titres: "font.syne", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f1ead933" });
const sillageMod = modeleV2({
  id: identifiantV2(318, "ligne-de-caisse"), concept: "c-318-ligne-de-caisse", name: "Ligne de caisse", family: FAM,
  description: "Pour une boutique de mode : la marque Sillage, ses coordonnées et ses pastilles de réseaux à gauche, une mouette qui salue, quatre colonnes de liens aux titres or, et en bas une grande scène dessinée de mer au couchant avec phare et voilier. Vert sapin, sable, or.",
  tags: ["boutique de mode", "scène illustrée", "mer", "phare", "mascotte", "vert sapin", "or", "angles droits"],
  identity: sillage, racine: racineDe("#10261c"), widgets: ["text", "link", "html", "bizcontact", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const bandes = IB.paysage(k, env, G, { v: 1, cv: 3, fond: "#10261c", encre: "#f1ead9", discret: "#c9d3c3", accent: "#e8c872", accent2: "#e8c872", titreCol: "#e8c872", filet: "#f1ead933", emblemeForme: "voile", marqueNom: "Sillage", casse: "uppercase", suivi: "0.08em", contact: true,
      phrase: "Mode femme et homme : des vêtements simples, faits pour durer.", cols: [["Femme", [["Robes", "/boutique"], ["Manteaux", "/boutique"], ["Soldes", "/boutique"]]], ["Homme", [["Chemises", "/boutique"], ["Vestes", "/boutique"], ["Soldes", "/boutique"]]], ["Accessoires", [["Écharpes", "/boutique"], ["Sacs", "/boutique"]]], ["Aide", [["Livraison", "/faq"], ["Retours", "/faq"], ["Contact", "/contact"]]]],
      scene: I_.merPhare, mascotte: I_.mouette });
    return [G.racine(k, bandes)];
  },
}, FAM);

// ── ft2-319 « Soldes en grand » — capture 15 en rose : colonnes à gauche, marque à droite, mannequin qui salue, champ de mannequins sous des fanions.
const rosalie = identite({ key: "i319", label: "Rose poudré et bleu nuit", humeur: "light", fond: "#f8e6ea", texte: "#1b1a3d", discret: "#4a4870", accent: "#1b1a3d", surface: "#f3c6cf", encre: "#1b1a3d", surEncre: "#f8e6ea", police: "font.karla", titres: "font.gloock", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#1b1a3d33" });
const rosalieMod = modeleV2({
  id: identifiantV2(319, "soldes-en-grand"), concept: "c-319-soldes-en-grand", name: "Soldes en grand", family: FAM,
  description: "Pour une boutique de mode : quatre colonnes de liens à gauche, la marque Rosalie à droite avec ses pastilles de réseaux, un mannequin qui salue, et en bas une grande scène dessinée : fanions, collines roses et bleu nuit, six mannequins en robes.",
  tags: ["boutique de mode", "scène illustrée", "mannequins", "fanions", "mascotte", "rose", "bleu nuit", "angles droits"],
  identity: rosalie, racine: racineDe("#f8e6ea"), widgets: ["text", "link", "html", "copyright", "bizlegal"],
  compose(k0, env, G) {
    const k = A.fixe(k0);
    const bandes = IB.paysage(k, env, G, { v: 2, cv: 2, fond: "#f8e6ea", encre: "#1b1a3d", discret: "#4a4870", accent: "#1b1a3d", accent2: "#b0305a", titreCol: "#b0305a", filet: "#1b1a3d33", emblemeForme: "cintre", marqueNom: "Rosalie",
      phrase: "Robes, blouses et manteaux à porter longtemps. Les soldes arrivent en grand.", cols: [["Femme", [["Robes", "/boutique"], ["Blouses", "/boutique"], ["Manteaux", "/boutique"]]], ["Soldes", [["Nouveautés", "/boutique"], ["Dernières pièces", "/boutique"]]], ["Aide", [["Livraison", "/faq"], ["Retours", "/faq"], ["Guide des tailles", "/faq"]]], ["Boutique", [["Contact", "/contact"], ["Questions", "/faq"]]]],
      scene: I_.champMannequins, mascotte: I_.mannequinSalut });
    return [G.racine(k, bandes)];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Mode et prêt-à-porter", target: 6, built: true,
  description: "Pieds inspirés de captures, angles droits, vraies illustrations vectorielles : nom monumental dessiné, appel centré avec curseurs et pictos, scènes illustrées avec mascotte.",
  models: [ormeMod, saisonMod, mailleMod, cobaltMod, sillageMod, rosalieMod],
};
