// Famille v2 « Cafés et boulangeries » — 6 modèles (ft2-344 à ft2-349), pieds inspirés de captures (colonnes de liens en cartes, bandeau d'inscription, colonnes sobres sur fond clair).
// ANGLES DROITS partout. Marques fictives, AUCUNE coordonnée ni chiffre inventé (horaires, adresse, téléphone viennent des « Données de l'entreprise »).
// Archétypes : 344 A colonne latérale pleine hauteur · 345 E deux demi-pages · 346 J papier à en-tête · 347 K console · 348 I frise à points carrés · 349 L escalier.
// Mouvement : transitions de 320 ms, une animation visible par modèle (filet qui s'étire, bouton qui se remplit, point qui respire, curseur qui bat) ; rien sous « mouvement réduit ».
const { modeleV2, identifiantV2, identite, G: GK } = require("../kit-v2");
const A = require("../aides-inspire-b");
const { racineDe, lien, caps, texte, trait, souffle, horaires, coordonnees, abo, case_, sansCookies, pctBande, sty } = A;

const FAM = "cafe-boulangerie";
const RES = [["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"]];
const bandeFull = (k, enfants, o) => ({ type: "container", props: { full: true }, name: o.nom, children: enfants, ...sty({ display: "flex", flexDirection: "column", width: "100%", backgroundColor: o.fond, gap: "0px" }) });

// ═══ ft2-344 « Le zinc » — colonne latérale pleine hauteur (A), café-torréfacteur ════════════════════════════════════════════════════════════
const zinc = identite({
  key: "c344", label: "Espresso et crème, terre cuite", humeur: "light",
  fond: "#f6efe3", texte: "#2a1a12", discret: "#5d4a3d", accent: "#a8431f", surface: "#eadfcc", encre: "#2a1a12", surEncre: "#f6efe3",
  police: "font.karla", titres: "font.young-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#2a1a1233",
});
const leZinc = modeleV2({
  id: identifiantV2(344, "le-zinc"), concept: "c-344-le-zinc", name: "Le zinc", family: FAM,
  description: "Pour un café-torréfacteur : une colonne espresso pleine hauteur à gauche (nom, horaires, adresse), et à droite trois colonnes de liens sur crème avec la lettre d'information. Les liens avancent au survol.",
  tags: ["café", "torréfaction", "colonne latérale", "espresso", "crème", "terre cuite", "angles droits"],
  identity: zinc, racine: racineDe("#f6efe3"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ESP = "#2a1a12", CREME = "#f6efe3", TERRE = "#a8431f", CLAIR = "#e8b894";
    const nom = k.T("<p>Le Zinc</p>", { fontFamily: S.head, fontSize: "fluid:44-72", color: CREME, lineHeight: 1, letterSpacing: "-0.01em" });
    const sous = caps(k, "Café et torréfaction", { couleur: CLAIR });
    const barre = k.col([sous, nom, trait(k, "#f6efe355"), caps(k, "Horaires", { couleur: CLAIR }), horaires(k, { taille: 15, couleur: CREME }), caps(k, "Adresse", { couleur: CLAIR }), coordonnees(k, { taille: 15, couleur: CREME, lien: CREME, survol: CLAIR, focus: CLAIR })], { backgroundColor: ESP, flexGrow: 0, flexBasis: "340px", minWidth: "280px", gap: "18px", paddingTop: "64px", paddingBottom: "48px", paddingLeft: "36px", paddingRight: "40px", alignItems: "flex-start" }, undefined, { flexBasis: "100%", paddingTop: "44px", paddingBottom: "36px", paddingLeft: "20px", paddingRight: "20px" });
    const groupe = (titre, liste) => G.colonne(k, [caps(k, titre, { couleur: TERRE }), ...liste.map(([t, u]) => lien(k, t, u, { taille: 17, poids: "600", couleur: S.fg, bloc: true, survol: { color: TERRE, transform: { x: 8 } }, focus: TERRE }))], { poids: 1, min: "150px", gap: "0px" });
    const colonnes = G.ligne(k, [groupe("La carte", [["Cafés", "/catalogue"], ["Thés", "/catalogue"], ["Viennoiseries", "/catalogue"], ["Déjeuner", "/catalogue"]]), groupe("La maison", [["Notre histoire", "/catalogue"], ["Torréfaction", "/catalogue"], ["Événements privés", "/catalogue"]]), groupe("Pratique", [["Réserver", "/catalogue"], ["Cartes cadeaux", "/catalogue"], ["Contact", "/contact"]])], { gap: "32px 40px", aligne: "flex-start", largeur: "100%" });
    const lettre = abo(k, env, G, { titre: "La lettre du zinc", intro: "Les cafés du mois et les rendez-vous, sans spam.", bouton: "S'abonner", largeur: "440px", accent: TERRE, texte: ESP, styleTitre: { color: TERRE, fontFamily: S.font, fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.14em" } });
    const mentions = sansCookies(k, env, G);
    const principal = k.col([colonnes, lettre, trait(k, S.line), mentions, G.reseauxTexte(RES, { taille: 15, poids: "700", couleur: ESP, survol: TERRE, focus: TERRE })(k, env)], { backgroundColor: CREME, flexGrow: 1, flexBasis: "0px", minWidth: "300px", gap: "32px", paddingTop: "64px", paddingBottom: "40px", paddingLeft: "56px", paddingRight: "48px", alignItems: "stretch" }, { paddingLeft: "32px", paddingRight: "28px" }, { flexBasis: "100%", paddingTop: "36px", paddingLeft: "20px", paddingRight: "20px" });
    const corps = k.row([principal, barre], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    return [G.racine(k, [bandeFull(k, [corps], { fond: CREME, nom: "Zinc" })])];
  },
}, FAM);

// ═══ ft2-345 « Deux fournées » — deux demi-pages bord à bord (E), boulangerie ═════════════════════════════════════════════════════════════════
const fournees = identite({
  key: "c345", label: "Crème pain chaud et bleu de four", humeur: "light",
  fond: "#fff3dc", texte: "#3a1d0c", discret: "#6b4a34", accent: "#a64a14", surface: "#f7e2bd", encre: "#3a1d0c", surEncre: "#fff3dc",
  police: "font.red-hat-display", titres: "font.gloock", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#3a1d0c33",
});
const deuxFournees = modeleV2({
  id: identifiantV2(345, "deux-fournees"), concept: "c-345-deux-fournees", name: "Deux fournées", family: FAM,
  description: "Pour une boulangerie : une moitié crème avec la phrase et les horaires, une moitié bleu profond avec un énorme bouton Passer commande, le contact et la lettre. Le bouton se remplit au survol.",
  tags: ["boulangerie", "pain", "deux moitiés", "crème", "bleu", "commande", "angles droits"],
  identity: fournees, racine: racineDe("#14304d"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, CREME = "#fff3dc", BLEU = "#14304d", CUIVRE = "#a64a14";
    const phrase = G.geant(`<p>Du pain chaud,<br><span style="color:${CUIVRE}">du matin au goûter.</span></p>`, { taille: [44, 88], tablette: { taille: [56, 72] }, mobile: { taille: [42, 56] }, lh: 1.04, suivi: "-0.015em", poids: "400", police: S.head, couleur: "#3a1d0c" })(k, env);
    const gauche = k.col([caps(k, "Boulangerie Fournil Doré", { couleur: CUIVRE }), phrase, trait(k, "#3a1d0c", "2px"), caps(k, "Nous ouvrons", { couleur: "#3a1d0c" }), horaires(k, { taille: 16, couleur: "#3a1d0c" })], { backgroundColor: CREME, flexGrow: 1, flexBasis: "0px", minWidth: "320px", gap: "24px", paddingTop: "96px", paddingBottom: "80px", paddingLeft: "56px", paddingRight: "56px", alignItems: "flex-start", justifyContent: "space-between" }, undefined, { paddingTop: "56px", paddingBottom: "48px", paddingLeft: "20px", paddingRight: "20px" });
    const gros = lien(k, "Passer commande", "/boutique", { taille: 26, poids: "800", police: S.head, couleur: BLEU, h: "88px", padH: "40px", bloc: true, survol: { backgroundColor: "#f4b860", color: BLEU, transform: { x: 8 } }, focus: "#ffffff", extra: { backgroundColor: "#fff3dc", justifyContent: "center", width: "100%", transitionDuration: 360 } });
    const second = lien(k, "Nous écrire", "/contact", { taille: 17, poids: "700", couleur: "#ffffff", soulign: true, survol: { color: "#f4b860" }, focus: "#ffffff" });
    const lettre = abo(k, env, G, { titre: "La lettre de la fournée", intro: "Le pain du jour, les nouveautés.", bouton: "S'abonner", largeur: "420px", accent: "#f4b860", texte: "#ffffff", consentCouleur: "#e9eef4", styleTitre: { color: "#f4b860", fontFamily: S.font, fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.14em" }, survolBouton: "#ffffff", survolTexte: BLEU });
    lettre.parts.button.styles.desktop = { ...lettre.parts.button.styles.desktop, color: BLEU };
    lettre.parts.intro.styles.desktop = { ...lettre.parts.intro.styles.desktop, color: "#e9eef4" };
    lettre.parts.missing.styles.desktop = { ...lettre.parts.missing.styles.desktop, color: "#ffffff" };
    const droite = k.col([caps(k, "Commander ou passer", { couleur: "#f4b860" }), gros, second, coordonnees(k, { taille: 16, couleur: "#e9eef4", lien: "#ffffff", survol: "#f4b860", focus: "#ffffff" }), lettre], { backgroundColor: BLEU, flexGrow: 1, flexBasis: "0px", minWidth: "320px", gap: "24px", paddingTop: "96px", paddingBottom: "80px", paddingLeft: "56px", paddingRight: "56px", alignItems: "stretch" }, undefined, { paddingTop: "56px", paddingBottom: "48px", paddingLeft: "20px", paddingRight: "20px" });
    const moitiés = k.row([gauche, droite], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const bas = G.bande(k, [sansCookies(k, env, G, { liens: "#ffffff", couleur: "#d8e0ea" })], { fond: BLEU, colonne: true, padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: ["56px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [bandeFull(k, [moitiés], { fond: BLEU, nom: "Demi-pages" }), bas])];
  },
}, FAM);

// ═══ ft2-346 « Papier à en-tête » — cartouche centré, filets doubles (J), café ════════════════════════════════════════════════════════════════
const papier = identite({
  key: "c346", label: "Papier blanc, encre marine et rouge sang", humeur: "light",
  fond: "#fdfbf6", texte: "#1d2433", discret: "#4c5568", accent: "#8c1c13", surface: "#f1ede2", encre: "#1d2433", surEncre: "#fdfbf6",
  police: "font.source-serif-4", titres: "font.libre-caslon-text", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#1d243333",
});
const papierEnTete = modeleV2({
  id: identifiantV2(346, "papier-a-en-tete"), concept: "c-346-papier-a-en-tete", name: "Salon sur papier", family: FAM,
  description: "Pour un café-salon de thé : un pied en papier à lettres, nom centré en italique, filets doubles, cartouche d'adresse et d'horaires, liens en ligne centrée. Sobre, classique, un petit losange qui respire.",
  tags: ["café", "salon de thé", "papier à lettres", "centré", "filets doubles", "classique", "angles droits"],
  identity: papier, racine: racineDe("#fdfbf6"),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ENCRE = "#1d2433", ROUGE = "#8c1c13", PAPIER = "#fdfbf6";
    const doubles = () => k.col([trait(k, ENCRE, "3px"), trait(k, ENCRE, "1px")], { gap: "4px", width: "100%" });
    const losange = souffle(k.col([], { width: "10px", height: "10px", backgroundColor: ROUGE, transform: { rotate: 45 }, borderRadius: "0px", flexShrink: 0 }), 3400);
    const nom = k.T("<p>Café Papillon</p>", { fontFamily: S.head, fontSize: "fluid:40-84", fontStyle: "italic", color: ENCRE, lineHeight: 1.05, textAlign: "center", letterSpacing: "-0.01em" });
    const sous = caps(k, "Salon de thé &nbsp;·&nbsp; pâtisserie", { couleur: ROUGE, suivi: "0.28em", extra: { textAlign: "center" } });
    const cote = (titre, enfant) => G.colonne(k, [caps(k, titre, { couleur: ROUGE, suivi: "0.22em", extra: { textAlign: "center", width: "100%" } }), enfant], { poids: 1, min: "220px", gap: "12px", aligne: "center" });
    const cartouche = k.row([cote("Adresse", coordonnees(k, { taille: 16, couleur: ENCRE, lien: ENCRE, survol: ROUGE, focus: ROUGE, align: "center" })), cote("Horaires", horaires(k, { taille: 16, couleur: ENCRE, align: "center" }))], { gap: "32px 72px", justifyContent: "center", alignItems: "flex-start", flexWrap: "wrap", borderStyle: "solid", borderWidth: "1px", borderColor: ENCRE, borderRadius: "0px", paddingTop: "32px", paddingBottom: "32px", paddingLeft: "40px", paddingRight: "40px", width: "100%", maxWidth: "760px" }, undefined, { paddingLeft: "16px", paddingRight: "16px" });
    const liens = k.row([["La carte", "/catalogue"], ["Réserver", "/catalogue"], ["Événements", "/catalogue"], ["Cartes cadeaux", "/catalogue"], ["Contact", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 17, poids: "600", couleur: ENCRE, padH: "6px", soulign: true, survol: { color: ROUGE, transform: { y: -2 } }, focus: ROUGE })), { ...GK.gaps("0px 28px"), justifyContent: "center", alignItems: "center" });
    const reseaux = G.reseauxTexte(RES, { taille: 15, poids: "600", couleur: ENCRE, survol: ROUGE, focus: ROUGE })(k, env, true);
    const corps = G.bande(k, [doubles(), k.col([losange, nom, sous], { gap: "14px", alignItems: "center", width: "100%" }), k.col([cartouche], { alignItems: "center", width: "100%" }), liens, reseaux, doubles(), G.ligneLegale({ taille: 13, sansCookies: true })(k, env, true)], { fond: PAPIER, colonne: true, aligne: "center", gap: "36px", padV: ["72px", "56px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], max: "1000px", nom: "Papier" });
    return [G.racine(k, [corps])];
  },
}, FAM);

// ═══ ft2-347 « Console du fournil » — fenêtre / console (K), boulangerie ═════════════════════════════════════════════════════════════════════
const console_ = identite({
  key: "c347", label: "Beurre jaune et console noire", humeur: "light",
  fond: "#ffd84d", texte: "#111111", discret: "#3a3200", accent: "#111111", surface: "#f2c836", encre: "#111111", surEncre: "#ffd84d",
  police: "font.jetbrains-mono", titres: "font.space-grotesk", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#11111155",
});
const consoleFournil = modeleV2({
  id: identifiantV2(347, "console-du-fournil"), concept: "c-347-console-du-fournil", name: "Console du fournil", family: FAM,
  description: "Pour une boulangerie qui aime l'humour : le pied est une fenêtre de console noire sur fond beurre, avec les commandes horaires, adresse, carte et lettre, et un curseur carré qui bat. Angles droits, mono, malin.",
  tags: ["boulangerie", "console", "fenêtre", "monospace", "jaune", "noir", "humour", "angles droits"],
  identity: console_, racine: racineDe("#ffd84d"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, BEURRE = "#ffd84d", NOIR = "#111111", FOUR = "#0d0d0d", VERT = "#9cf0b0";
    const carreBtn = (c) => k.col([], { width: "14px", height: "14px", backgroundColor: c, borderRadius: "0px", flexShrink: 0 });
    const titre = k.row([carreBtn("#111111"), carreBtn("#111111"), carreBtn("#111111"), k.T("<p>fournil — session ouverte</p>", { fontFamily: S.font, fontSize: "14px", fontWeight: "700", color: NOIR, marginLeft: "12px" })], { gap: "8px", alignItems: "center", flexWrap: "nowrap", backgroundColor: BEURRE, paddingTop: "10px", paddingBottom: "10px", paddingLeft: "16px", paddingRight: "16px", borderStyle: "solid", borderWidth: "0px", width: "100%" });
    const cmd = (t) => k.T(`<p><span style="color:${VERT}">$</span> ${t}</p>`, { fontFamily: S.font, fontSize: "15px", fontWeight: "700", color: "#ffffff", lineHeight: 1.4 });
    const commandes = G.ligne(k, [["carte", "/catalogue"], ["commander", "/boutique"], ["evenements", "/catalogue"], ["contact", "/contact"]].map(([t, u]) => lien(k, `./${t}`, u, { taille: 16, poids: "700", couleur: "#ffffff", padH: "4px", survol: { backgroundColor: BEURRE, color: NOIR, transform: { x: 4 } }, focus: BEURRE })), { gap: "0px 20px", aligne: "center", largeur: "100%" });
    const curseur = souffle(k.col([], { width: "12px", height: "20px", backgroundColor: BEURRE, borderRadius: "0px" }), 1400);
    const gauche = G.colonne(k, [cmd("horaires --aujourd-hui"), horaires(k, { taille: 15, couleur: "#e8e8e8" }), cmd("adresse"), coordonnees(k, { taille: 15, couleur: "#e8e8e8", lien: "#ffffff", survol: BEURRE, focus: BEURRE })], { poids: 1, min: "240px", gap: "14px" });
    const lettre = abo(k, env, G, { titre: "", intro: "Le pain du jour, une fois par semaine.", bouton: "Envoyer", largeur: "420px", accent: BEURRE, texte: "#ffffff", consentCouleur: "#d6d6d6", fondChamp: "#1c1c1c", rembChamp: "12px", survolBouton: "#ffffff", survolTexte: NOIR, styleTitre: { color: "#ffffff", fontSize: "1px", marginBottom: "0px" } });
    lettre.parts.button.styles.desktop = { ...lettre.parts.button.styles.desktop, color: NOIR };
    lettre.parts.intro.styles.desktop = { ...lettre.parts.intro.styles.desktop, color: "#e8e8e8" };
    lettre.parts.missing.styles.desktop = { ...lettre.parts.missing.styles.desktop, color: "#ffffff" };
    const droite = G.colonne(k, [cmd("lettre --abonner"), lettre], { poids: 1, min: "260px", gap: "14px" });
    const mentions = G.ligneLegale({ taille: 13, sansCookies: true, liens: "#ffffff", couleur: "#cfcfcf" })(k, env);
    const sortie = k.col([cmd("ls ./pages"), commandes, G.ligne(k, [gauche, droite], { gap: "32px 56px", aligne: "flex-start", largeur: "100%" }), trait(k, "#ffffff44"), k.row([cmd("exit"), curseur], { gap: "8px", alignItems: "center", flexWrap: "nowrap" }), mentions], { backgroundColor: FOUR, gap: "24px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", width: "100%" }, undefined, { paddingLeft: "16px", paddingRight: "16px" });
    const fenetre = k.col([titre, sortie], { gap: "0px", borderStyle: "solid", borderWidth: "3px", borderColor: NOIR, borderRadius: "0px", backgroundColor: FOUR, width: "100%", alignItems: "stretch" });
    const corps = G.bande(k, [fenetre], { fond: BEURRE, colonne: true, padV: ["72px", "56px", "36px"], padB: ["56px", "44px", "28px"], padH: ["48px", "32px", "16px"], max: "1100px", nom: "Console" });
    return [G.racine(k, [corps])];
  },
}, FAM);

// ═══ ft2-348 « Du moulin au comptoir » — frise à points carrés (I), boulangerie ═══════════════════════════════════════════════════════════════
const frise = identite({
  key: "c348", label: "Rose farine et brun de four", humeur: "light",
  fond: "#f9ddd2", texte: "#3b1f1a", discret: "#6a4038", accent: "#9e2f1a", surface: "#f2c9ba", encre: "#3b1f1a", surEncre: "#f9ddd2",
  police: "font.inter-tight", titres: "font.fraunces", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#3b1f1a33",
});
const moulinComptoir = modeleV2({
  id: identifiantV2(348, "du-moulin-au-comptoir"), concept: "c-348-du-moulin-au-comptoir", name: "Du moulin au comptoir", family: FAM,
  description: "Pour une boulangerie artisanale : une frise horizontale à points carrés du moulin au comptoir, cinq étapes cliquables, puis horaires et lettre. Le dernier point respire, chaque étape se soulève au survol.",
  tags: ["boulangerie", "frise", "étapes", "artisan", "rose", "brun", "chronologie", "angles droits"],
  identity: frise, racine: racineDe("#f9ddd2"),
  widgets: ["text", "link", "bizhours", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, ENCRE = "#3b1f1a", BRIQUE = "#9e2f1a";
    const phrase = G.geant(`<p>Du moulin<br><span style="color:${BRIQUE}">au comptoir.</span></p>`, { taille: [44, 92], tablette: { taille: [64, 80] }, mobile: { taille: [44, 58] }, lh: 1.02, suivi: "-0.02em", poids: "600", police: S.head, couleur: ENCRE })(k, env);
    const haut = G.bande(k, [G.colonne(k, [caps(k, "Boulangerie Petit Levain", { couleur: BRIQUE }), phrase], { poids: 7, min: "300px", gap: "16px" }), G.colonne(k, [texte(k, "Chaque pain passe par cinq mains et cinq étapes. Découvrez le chemin, de la farine à votre sac.", { taille: 17, couleur: ENCRE, max: "380px", lh: 1.65 })], { poids: 4, min: "260px", soi: "flex-end" })], { fond: "#f9ddd2", gap: "32px 64px", aligne: "flex-end", padV: ["88px", "64px", "44px"], padB: ["48px", "40px", "28px"], padH: ["48px", "32px", "20px"], nom: "Titre" });
    const etapes = [["Le moulin", "Farines choisies, de petites minoteries.", "/catalogue"], ["Le pétrin", "Levain vivant, longues pauses.", "/catalogue"], ["Le façonnage", "Gestes de la main, un pain à la fois.", "/catalogue"], ["Le four", "Cuisson en sole, croûte bien dorée.", "/catalogue"], ["Le comptoir", "Vitrine, commande et retrait.", "/boutique"]];
    const rails = etapes.map((_, i) => {
      const dernier = i === etapes.length - 1;
      const pt = k.col([], { width: "16px", height: "16px", backgroundColor: BRIQUE, borderRadius: "0px", flexShrink: 0 });
      if (dernier) souffle(pt, 2800);
      return k.row([pt, k.col([], { flexGrow: 1, height: "2px", backgroundColor: dernier ? "#f9ddd2" : ENCRE })], { gap: "0px", alignItems: "center", flexWrap: "nowrap", flexGrow: 1, flexBasis: "0px" });
    });
    const rail = k.row(rails, { gap: "0px", flexWrap: "nowrap", alignItems: "center", width: "100%" }, undefined, { display: "none" });
    const pas = etapes.map(([t, d, u]) => {
      const lt = lien(k, t, u, { taille: 24, poids: "600", police: S.head, couleur: ENCRE, bloc: true, lh: 1.15, survol: { color: BRIQUE, transform: { y: -3 } }, focus: BRIQUE, extra: { width: "100%" } });
      return case_(k, [lt, texte(k, d, { taille: 15, couleur: S.mute, lh: 1.55 })], { pad: "0px", gap: "10px", min: "170px", poids: 1, extra: { paddingRight: "20px" } });
    });
    const frise_ = G.bande(k, [rail, k.row(pas, { gap: "28px 0px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" })], { fond: "#f9ddd2", colonne: true, gap: "20px", padV: ["32px", "28px", "24px"], padB: ["56px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Frise" });
    const lettre = abo(k, env, G, { titre: "La lettre du levain", intro: "Les nouveautés de la semaine.", bouton: "S'abonner", largeur: "400px", accent: BRIQUE, texte: ENCRE, styleTitre: { color: BRIQUE, fontFamily: S.font, fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.14em" } });
    const bas = G.bande(k, [G.colonne(k, [caps(k, "Horaires", { couleur: BRIQUE }), horaires(k, { taille: 16 })], { poids: 1, min: "240px", gap: "12px" }), G.colonne(k, [lettre], { poids: 1, min: "280px" }), trait(k, S.line), sansCookies(k, env, G)], { fond: "#f2c9ba", gap: "36px 56px", aligne: "flex-start", padV: ["56px", "44px", "36px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Infos" });
    return [G.racine(k, [haut, frise_, bas])];
  },
}, FAM);

// ═══ ft2-349 « Escalier du grain » — bandes étagées décroissantes (L), café-boulangerie ═══════════════════════════════════════════════════════
const escalier = identite({
  key: "c349", label: "Verts de blé en escalier", humeur: "light",
  fond: "#e6eedb", texte: "#14291c", discret: "#3d5545", accent: "#1f5c36", surface: "#cfe0c0", encre: "#14291c", surEncre: "#e6eedb",
  police: "font.cabin", titres: "font.bodoni-moda", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#14291c33",
});
const escalierDuGrain = modeleV2({
  id: identifiantV2(349, "escalier-du-grain"), concept: "c-349-escalier-du-grain", name: "Escalier du grain", family: FAM,
  description: "Pour un café-boulangerie : quatre bandes vertes de largeur décroissante alignées à gauche, comme un escalier (nom, liens, horaires et adresse, lettre). Un pied graphique mais très lisible.",
  tags: ["café", "boulangerie", "escalier", "bandes", "vert", "sauge", "étagé", "angles droits"],
  identity: escalier, racine: racineDe("#e6eedb"),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, V1 = "#14291c", V2 = "#24593a", V3 = "#a9cf9b", V4 = "#cfe0c0", SAUGE = "#e6eedb";
    const nom = G.geant(`<p>Grain d'Orge</p>`, { taille: [48, 112], tablette: { taille: [72, 96] }, mobile: { taille: [48, 64] }, lh: 1, suivi: "-0.02em", poids: "700", police: S.head, couleur: SAUGE })(k, env);
    const b1 = pctBande(k, [caps(k, "Café &nbsp;·&nbsp; boulangerie", { couleur: "#a9cf9b" }), nom, texte(k, "Pains au levain, cafés de saison et déjeuners simples.", { taille: 17, couleur: "#dfead6", max: "460px" })], { fond: V1, largeur: "100%", padV: "64px", padH: "56px", gap: "16px", nom: "Marche 1" });
    const liens = k.row([["Le pain", "/catalogue"], ["Les cafés", "/catalogue"], ["Déjeuner", "/catalogue"], ["Commander", "/boutique"]].map(([t, u]) => lien(k, t, u, { taille: 18, poids: "700", couleur: "#ffffff", padH: "4px", survol: { color: "#e3f3b5", transform: { x: 6 } }, focus: "#ffffff" })), { ...GK.gaps("0px 28px"), alignItems: "center" });
    const b2 = pctBande(k, [liens], { fond: V2, largeur: "80%", padV: "28px", padH: "56px", nom: "Marche 2" });
    const b3 = pctBande(k, [k.row([G.colonne(k, [caps(k, "Horaires", { couleur: V1 }), horaires(k, { taille: 15, couleur: V1 })], { poids: 1, min: "200px", gap: "10px" }), G.colonne(k, [caps(k, "Adresse", { couleur: V1 }), coordonnees(k, { taille: 15, couleur: V1, lien: V1, survol: "#1f5c36", focus: V1 })], { poids: 1, min: "200px", gap: "10px" })], { gap: "24px 40px", alignItems: "flex-start", width: "100%" })], { fond: V3, largeur: "60%", padV: "36px", padH: "56px", nom: "Marche 3" });
    const lettre = abo(k, env, G, { titre: "La lettre du grain", intro: "Les pains de la semaine.", bouton: "S'abonner", largeur: "400px", accent: "#1f5c36", texte: V1, styleTitre: { color: "#1f5c36", fontFamily: S.font, fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.14em" } });
    const b4 = pctBande(k, [lettre], { fond: V4, largeur: "42%", padV: "32px", padH: "56px", nom: "Marche 4" });
    const bas = G.bande(k, [G.reseauxTexte(RES, { taille: 15, poids: "700", couleur: V1, survol: "#1f5c36", focus: "#1f5c36" })(k, env), sansCookies(k, env, G)], { fond: SAUGE, gap: "12px 32px", aligne: "center", padV: ["28px", "24px", "20px"], padB: ["24px", "20px", "16px"], padH: ["56px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [b1, b2, b3, b4, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Cafés et boulangeries", target: 6, built: true,
  description: "Pieds de cafés et boulangeries : colonne latérale, deux demi-pages, papier à en-tête, console, frise du pain, escalier de bandes.",
  models: [leZinc, deuxFournees, papierEnTete, consoleFournil, moulinComptoir, escalierDuGrain],
};
