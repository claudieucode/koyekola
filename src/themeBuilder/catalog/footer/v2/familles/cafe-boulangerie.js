// Famille v2 « Cafés et boulangeries » — 6 modèles (ft2-344 à ft2-349), refaits à partir des captures 19 (mosaïque de cartes sombres), 20 (bandeau d'inscription en dégradé + cartes de liens + grand dessin) et 21 (colonnes sobres + pictos + réseaux).
// ANGLES DROITS partout. Marques fictives, AUCUNE coordonnée ni chiffre inventé (horaires, adresse, téléphone viennent des « Données de l'entreprise »).
// Illustrations SVG dessinées (aides-illus-a06.js) : tasse fumante, corbeille de pains, médaillon de théière, croissant en pixels, moulin à vent, épi d'orge.
// Mouvement : transitions de 320 ms, une animation visible par modèle (cartes qui se soulèvent, liens qui glissent, point qui respire) ; rien sous « mouvement réduit ».
const { modeleV2, identifiantV2, identite, G: GK } = require("../kit-v2");
const A = require("../aides-inspire-b");
const I = require("../aides-illus-a06");
const { racineDe, lien, caps, texte, trait, souffle, horaires, coordonnees, case_, sansCookies, Moteur, sty } = A;
const { svgW, tuileIcone, colLiens, formulaire, badges } = I;

const FAM = "cafe-boulangerie";
const soc = (k, env, liste, look = "big", centre) => Moteur.item(k, `socials:${liste}|${look}`, env, centre);
const bandeFull = (k, enfants, o) => ({ type: "container", props: { full: true }, name: o.nom, children: enfants, ...sty({ display: "flex", flexDirection: "column", width: "100%", backgroundColor: o.fond, gap: "0px" }) });

const zinc = identite({
  key: "c344", label: "Espresso et crème, terre cuite", humeur: "light",
  fond: "#f6efe3", texte: "#2a1a12", discret: "#5d4a3d", accent: "#a8431f", surface: "#eadfcc", encre: "#2a1a12", surEncre: "#f6efe3",
  police: "font.karla", titres: "font.young-serif", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#2a1a1233",
});
const leZinc = modeleV2({
  id: identifiantV2(344, "le-zinc"), concept: "c-344-le-zinc", name: "Le zinc", family: FAM,
  description: "Café-torréfacteur : mosaïque de cartes espresso sur crème. Grande carte d'accueil avec barre de réservation, liens, tasse fumante dessinée en grand, tuiles d'icônes de réseaux, carte terre cuite pour la lettre.",
  tags: ["café", "torréfaction", "mosaïque", "cartes", "tasse dessinée", "espresso", "crème", "illustration", "angles droits"],
  identity: zinc, racine: racineDe("#f6efe3"),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ESP = "#2a1a12", CREME = "#f6efe3", TERRE = "#a8431f", CLAIR = "#e8b894", CARTE = "#2a1a12", SURV = { backgroundColor: "#3a261b", transform: { y: -4 } };
    const titre = G.geant(`<p>Un café ?<br>Entrez, on vous sert.</p>`, { taille: [30, 54], tablette: { taille: [34, 46] }, mobile: { taille: [28, 36] }, lh: 1.1, suivi: "-0.01em", poids: "400", police: S.head, couleur: CREME })(k, env);
    const marque = souffle(k.col([], { width: "40px", height: "40px", backgroundColor: CLAIR, flexShrink: 0 }), 3200);
    const bt = lien(k, "Réserver", "/contact", { taille: 15, poids: "800", casse: "uppercase", suivi: "0.1em", couleur: "#ffffff", h: "48px", padH: "24px", survol: { backgroundColor: "#c9552c" }, focus: CLAIR, extra: { backgroundColor: TERRE, justifyContent: "center" } });
    const barre = k.row([marque, texte(k, "Une table au comptoir", { taille: 15, couleur: CREME, extra: { flexGrow: 1 } }), bt], { gap: "14px", alignItems: "center", flexWrap: "wrap", borderStyle: "solid", borderWidth: "1px", borderColor: "#f6efe366", borderRadius: "0px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "14px", paddingRight: "10px", backgroundColor: "#1c110b", width: "100%" });
    const a1 = case_(k, [caps(k, "Café et torréfaction", { couleur: CLAIR }), titre, barre], { fond: CARTE, pad: "40px", gap: "28px", min: "0px", survol: SURV });
    const b1 = case_(k, [k.row([colLiens(k, "La carte", [["Cafés", "/catalogue"], ["Thés", "/catalogue"], ["Viennoiseries", "/catalogue"], ["Déjeuner", "/catalogue"]], { titre: CLAIR, couleur: CREME, survol: CLAIR, min: "130px" }), colLiens(k, "La maison", [["Torréfaction", "/catalogue"], ["Cartes cadeaux", "/boutique"], ["Contact", "/contact"]], { titre: CLAIR, couleur: CREME, survol: CLAIR, min: "130px" })], { gap: "8px 24px", flexWrap: "wrap", width: "100%" })], { fond: CARTE, pad: "32px", poids: 3, min: "260px", survol: SURV });
    const infos = case_(k, [caps(k, "Horaires", { couleur: CLAIR }), horaires(k, { taille: 14, couleur: CREME }), caps(k, "Adresse", { couleur: CLAIR }), coordonnees(k, { taille: 14, couleur: CREME, lien: CREME, survol: CLAIR, focus: CLAIR })], { fond: CARTE, pad: "32px", poids: 2, min: "220px", survol: SURV });
    const colG = G.colonne(k, [a1, b1, infos], { poids: 7, min: "320px", gap: "12px", aligne: "stretch" });
    const tasse = case_(k, [svgW(k, I.tasse())], { fond: ESP, pad: "0px", min: "0px", justifie: "center", survol: { transform: { y: -4 } } });
    const tuiles = k.row(["instagram", "facebook", "tiktok"].map((r) => tuileIcone(k, env, r, { fond: ESP, h: "110px" })), { gap: "12px", flexWrap: "nowrap", alignItems: "stretch", width: "100%" });
    const lettre = case_(k, [formulaire(k, env, G, { titre: "La lettre du zinc", intro: "Les cafés du mois.", bouton: "S'abonner", largeur: "100%", texte: "#ffffff", btnFond: CREME, btnTexte: ESP, survolFond: CLAIR, survolTexte: ESP, styleTitre: { textTransform: "uppercase", letterSpacing: "0.14em" } })], { fond: TERRE, pad: "28px", min: "0px", survol: { backgroundColor: "#963a19" } });
    const colD = G.colonne(k, [tasse, tuiles, lettre], { poids: 4, min: "300px", gap: "12px", aligne: "stretch" });
    const mosa = G.bande(k, [colG, colD], { fond: CREME, gap: "12px", aligne: "stretch", padV: ["40px", "32px", "20px"], padB: ["12px", "12px", "12px"], padH: ["32px", "24px", "16px"], nom: "Mosaïque" });
    const mentions = G.bande(k, [sansCookies(k, env, G)], { fond: CREME, colonne: true, padV: ["16px", "16px", "12px"], padB: ["24px", "20px", "16px"], padH: ["32px", "24px", "16px"], nom: "Mentions" });
    return [G.racine(k, [mosa, mentions])];
  },
}, FAM);

const fournees = identite({
  key: "c345", label: "Crème pain chaud et bleu de four", humeur: "light",
  fond: "#fff3dc", texte: "#3a1d0c", discret: "#6b4a34", accent: "#a64a14", surface: "#f7e2bd", encre: "#3a1d0c", surEncre: "#fff3dc",
  police: "font.red-hat-display", titres: "font.gloock", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#3a1d0c33",
});
const deuxFournees = modeleV2({
  id: identifiantV2(345, "deux-fournees"), concept: "c-345-deux-fournees", name: "Deux fournées", family: FAM,
  description: "Boulangerie : quatre cartes de liens bleu four à côté d'une corbeille de pains dessinée sur crème, puis un grand bandeau d'inscription en dégradé doré, une ligne de marque avec réseaux et la ligne légale.",
  tags: ["boulangerie", "pain", "corbeille dessinée", "dégradé", "cartes", "bleu", "doré", "illustration", "angles droits"],
  identity: fournees, racine: racineDe("#14304d"),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, CREME = "#fff3dc", BLEU = "#14304d", CARTE = "#1d4468", OR = "#f4b860", CUIVRE = "#a64a14", SURV = { backgroundColor: "#24527d", transform: { y: -4 } };
    const carte = (enf) => case_(k, enf, { fond: CARTE, pad: "28px", min: "220px", poids: 1, survol: SURV });
    const quatre = k.row([
      carte([colLiens(k, "Le pain", [["Les pains", "/catalogue"], ["Viennoiseries", "/catalogue"], ["Pâtisseries", "/catalogue"]], { titre: "#ffffff", couleur: "#e9eef4", survol: OR, filet: OR, min: "0px" })]),
      carte([colLiens(k, "Commander", [["Passer commande", "/boutique"], ["Retrait", "/faq"], ["Contact", "/contact"]], { titre: "#ffffff", couleur: "#e9eef4", survol: OR, filet: OR, min: "0px" })]),
      carte([caps(k, "Horaires", { couleur: "#ffffff", taille: "13px" }), trait(k, OR, "2px"), horaires(k, { taille: 14, couleur: "#e9eef4" })]),
      carte([caps(k, "Adresse", { couleur: "#ffffff", taille: "13px" }), trait(k, OR, "2px"), coordonnees(k, { taille: 14, couleur: "#e9eef4", lien: "#ffffff", survol: OR, focus: "#ffffff" })]),
    ], { gap: "12px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const pains = case_(k, [caps(k, "Boulangerie Fournil Doré", { couleur: CUIVRE }), k.T("<p>Du pain chaud, du matin au goûter.</p>", { fontFamily: S.head, fontSize: "fluid:26-40", color: "#3a1d0c", lineHeight: 1.1 }), svgW(k, I.pains())], { fond: CREME, pad: "28px", min: "280px", poids: 1, gap: "16px", survol: { backgroundColor: "#ffe9bf", transform: { y: -4 } } });
    const haut = G.bande(k, [G.colonne(k, [quatre], { poids: 3, min: "300px", aligne: "stretch" }), G.colonne(k, [pains], { poids: 2, min: "280px", aligne: "stretch" })], { fond: BLEU, gap: "12px", aligne: "stretch", padV: ["40px", "32px", "20px"], padB: ["12px", "12px", "12px"], padH: ["32px", "24px", "16px"], nom: "Cartes" });
    const phrase = G.geant(`<p>La lettre<br>de la fournée.</p>`, { taille: [36, 80], tablette: { taille: [48, 64] }, mobile: { taille: [36, 46] }, lh: 1, poids: "400", police: S.head, couleur: "#3a1d0c" })(k, env);
    const form = formulaire(k, env, G, { titre: "", intro: "Le pain du jour et les nouveautés.", bouton: "S'abonner", largeur: "480px", texte: "#3a1d0c", btnFond: BLEU, btnTexte: "#ffffff", survolFond: "#3a1d0c", survolTexte: OR });
    const ban = G.bande(k, [G.colonne(k, [phrase], { poids: 5, min: "280px" }), G.colonne(k, [form], { poids: 5, min: "290px", soi: "flex-end" })], { fond: OR, degrade: { from: "#ffd08a", to: "#e08a35", angle: 100, type: "linear" }, gap: "28px 64px", aligne: "center", padV: ["56px", "44px", "36px"], padB: ["56px", "44px", "36px"], padH: ["48px", "32px", "20px"], nom: "Inscription" });
    const marque = G.ligne(k, [k.T("<p>Fournil Doré</p>", { fontFamily: S.head, fontSize: "fluid:26-36", color: "#ffffff", lineHeight: 1.05 }), sansCookies(k, env, G, { liens: "#ffffff", couleur: "#d8e0ea" }), soc(k, env, "instagram+facebook+tiktok", "big")], { justifie: "space-between", aligne: "center", gap: "16px 32px", largeur: "100%" });
    const bas = G.bande(k, [marque], { fond: BLEU, couleur: "#ffffff", colonne: true, padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "16px"], nom: "Marque" });
    return [G.racine(k, [haut, ban, bas])];
  },
}, FAM);

const papier = identite({
  key: "c346", label: "Papier blanc, encre marine et rouge sang", humeur: "light",
  fond: "#fdfbf6", texte: "#1d2433", discret: "#4c5568", accent: "#8c1c13", surface: "#f1ede2", encre: "#1d2433", surEncre: "#fdfbf6",
  police: "font.source-serif-4", titres: "font.libre-caslon-text", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#1d243333",
});
const papierEnTete = modeleV2({
  id: identifiantV2(346, "papier-a-en-tete"), concept: "c-346-papier-a-en-tete", name: "Salon sur papier", family: FAM,
  description: "Salon de thé : médaillon de théière dans une couronne de lauriers à gauche, quatre colonnes de liens en capitales sur papier blanc comme la capture sobre, pictos de services et réseaux, ligne légale.",
  tags: ["café", "salon de thé", "médaillon", "théière dessinée", "colonnes", "papier", "classique", "illustration", "angles droits"],
  identity: papier, racine: racineDe("#fdfbf6"),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ENCRE = "#1d2433", ROUGE = "#8c1c13", PAPIER = "#fdfbf6";
    const nom = k.T("<p>Café Papillon</p>", { fontFamily: S.head, fontSize: "fluid:30-44", fontStyle: "italic", color: ENCRE, lineHeight: 1.05, textAlign: "center" });
    const sous = caps(k, "Salon de thé &nbsp;·&nbsp; pâtisserie", { couleur: ROUGE, suivi: "0.22em", extra: { textAlign: "center" } });
    const emb = k.col([svgW(k, I.medaillon(), { maxWidth: "260px" }), nom, sous], { gap: "14px", alignItems: "center", flexGrow: 1, flexBasis: "0px", minWidth: "240px", maxWidth: "300px" });
    const cols = k.row([
      colLiens(k, "La carte", [["Thés", "/catalogue"], ["Cafés", "/catalogue"], ["Pâtisseries", "/catalogue"], ["Brunch", "/catalogue"]], { titre: ENCRE, couleur: ENCRE, survol: ROUGE, min: "170px" }),
      colLiens(k, "Le salon", [["Réserver", "/contact"], ["Événements", "/catalogue"], ["Cartes cadeaux", "/boutique"], ["Contact", "/contact"]], { titre: ENCRE, couleur: ENCRE, survol: ROUGE, min: "170px" }),
      k.col([caps(k, "Horaires", { couleur: ENCRE, taille: "13px" }), horaires(k, { taille: 15, couleur: ENCRE })], { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "170px" }),
      k.col([caps(k, "Adresse", { couleur: ENCRE, taille: "13px" }), coordonnees(k, { taille: 15, couleur: ENCRE, lien: ENCRE, survol: ROUGE, focus: ROUGE })], { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "170px" }),
    ], { gap: "28px 32px", flexWrap: "wrap", alignItems: "flex-start", flexGrow: 3, flexBasis: "0px", minWidth: "320px" });
    const haut = k.row([emb, cols], { gap: "40px 64px", alignItems: "flex-start", flexWrap: "wrap", width: "100%" });
    const bas = k.row([badges(k, { trait: ENCRE, fond: PAPIER, accent: ROUGE, max: "340px" }), soc(k, env, "instagram+facebook+youtube+pinterest", "big")], { gap: "20px 40px", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", width: "100%" });
    const corps = G.bande(k, [haut, trait(k, ENCRE, "3px"), bas, sansCookies(k, env, G)], { fond: PAPIER, colonne: true, gap: "32px", padV: ["72px", "56px", "40px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "16px"], nom: "Papier" });
    return [G.racine(k, [corps])];
  },
}, FAM);

const console_ = identite({
  key: "c347", label: "Beurre jaune et console noire", humeur: "light",
  fond: "#ffd84d", texte: "#111111", discret: "#3a3200", accent: "#111111", surface: "#f2c836", encre: "#111111", surEncre: "#ffd84d",
  police: "font.jetbrains-mono", titres: "font.space-grotesk", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#11111155",
});
const consoleFournil = modeleV2({
  id: identifiantV2(347, "console-du-fournil"), concept: "c-347-console-du-fournil", name: "Console du fournil", family: FAM,
  description: "Boulangerie à l'humour geek : quatre fenêtres de console noires à angles droits sur fond beurre, comme la mosaïque de cartes de la capture. Croissant en pixels dessiné, commandes, horaires, lettre et tuiles d'icônes de réseaux.",
  tags: ["boulangerie", "console", "mosaïque", "pixel art", "monospace", "jaune", "noir", "illustration", "angles droits"],
  identity: console_, racine: racineDe("#ffd84d"),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, BEURRE = "#ffd84d", NOIR = "#111111", FOUR = "#0d0d0d", VERT = "#9cf0b0";
    const cmd = (t) => k.T(`<p><span style="color:${VERT}">$</span> ${t}</p>`, { fontFamily: S.font, fontSize: "15px", fontWeight: "700", color: "#ffffff", lineHeight: 1.4 });
    const carreBtn = () => k.col([], { width: "14px", height: "14px", backgroundColor: NOIR, flexShrink: 0 });
    const fenetre = (nomF, enfants, poids = 1, min = "300px") => case_(k, [k.row([carreBtn(), carreBtn(), carreBtn(), k.T(`<p>${nomF}</p>`, { fontFamily: S.font, fontSize: "14px", fontWeight: "700", color: NOIR, marginLeft: "12px" })], { gap: "8px", alignItems: "center", flexWrap: "nowrap", backgroundColor: BEURRE, paddingTop: "10px", paddingBottom: "10px", paddingLeft: "14px", paddingRight: "14px", width: "100%" }), k.col(enfants, { gap: "16px", backgroundColor: FOUR, paddingTop: "22px", paddingBottom: "24px", paddingLeft: "22px", paddingRight: "22px", width: "100%", flexGrow: 1 })], { fond: FOUR, pad: "0px", gap: "0px", poids, min, cadre: "3px", cadreCouleur: NOIR, extra: { alignItems: "stretch" }, survol: { transform: { y: -4 } } });
    const cmdLiens = G.ligne(k, [["carte", "/catalogue"], ["commander", "/boutique"], ["evenements", "/catalogue"], ["contact", "/contact"]].map(([t, u]) => lien(k, `./${t}`, u, { taille: 16, poids: "700", couleur: "#ffffff", padH: "4px", survol: { backgroundColor: BEURRE, color: NOIR, transform: { x: 4 } }, focus: BEURRE })), { gap: "0px 16px", aligne: "center", largeur: "100%" });
    const curseur = souffle(k.col([], { width: "12px", height: "20px", backgroundColor: BEURRE }), 1400);
    const w1 = fenetre("fournil — accueil", [svgW(k, I.pixels(), { maxWidth: "300px" }), cmd("ls ./pages"), cmdLiens, k.row([cmd("exit"), curseur], { gap: "8px", alignItems: "center", flexWrap: "nowrap" })], 3, "320px");
    const w2 = fenetre("horaires.sh", [cmd("horaires --aujourd-hui"), horaires(k, { taille: 15, couleur: "#e8e8e8" }), cmd("adresse"), coordonnees(k, { taille: 15, couleur: "#e8e8e8", lien: "#ffffff", survol: BEURRE, focus: BEURRE })], 2, "260px");
    const lettre = formulaire(k, env, G, { titre: "", intro: "Le pain du jour, une fois par semaine.", bouton: "Envoyer", largeur: "420px", texte: "#ffffff", btnFond: BEURRE, btnTexte: NOIR, survolFond: "#ffffff", survolTexte: NOIR, styleTitre: { fontSize: "1px", marginBottom: "0px" } });
    const w3 = fenetre("lettre.sh", [cmd("lettre --abonner"), lettre], 3, "300px");
    const tuiles = k.row(["instagram", "facebook", "youtube"].map((r) => tuileIcone(k, env, r, { fond: FOUR, h: "120px" })), { gap: "8px", flexWrap: "nowrap", alignItems: "stretch", width: "100%", borderStyle: "solid", borderWidth: "3px", borderColor: NOIR });
    const w4 = fenetre("reseaux.sh", [cmd("suivre --tous"), ...["instagram", "facebook", "youtube"].map((r) => tuileIcone(k, env, r, { fond: FOUR, h: "64px" }))], 2, "260px");
    const r1 = k.row([w1, w2], { gap: "12px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const r2 = k.row([w3, w4], { gap: "12px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const corps = G.bande(k, [r1, r2, G.ligneLegale({ taille: 13, sansCookies: true, liens: NOIR, couleur: "#3a3200" })(k, env)], { fond: BEURRE, colonne: true, gap: "12px", padV: ["56px", "44px", "28px"], padB: ["32px", "28px", "20px"], padH: ["48px", "32px", "16px"], max: "1200px", nom: "Console" });
    return [G.racine(k, [corps])];
  },
}, FAM);

const frise = identite({
  key: "c348", label: "Rose farine et brun de four", humeur: "light",
  fond: "#f9ddd2", texte: "#3b1f1a", discret: "#6a4038", accent: "#9e2f1a", surface: "#f2c9ba", encre: "#3b1f1a", surEncre: "#f9ddd2",
  police: "font.inter-tight", titres: "font.fraunces", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#3b1f1a33",
});
const moulinComptoir = modeleV2({
  id: identifiantV2(348, "du-moulin-au-comptoir"), concept: "c-348-du-moulin-au-comptoir", name: "Du moulin au comptoir", family: FAM,
  description: "Boulangerie artisanale : bandeau d'inscription en dégradé brique avec un moulin à vent dessiné sur sa colline, cinq cartes d'étapes du moulin au comptoir aux titres soulignés, puis horaires, réseaux et ligne légale.",
  tags: ["boulangerie", "moulin dessiné", "étapes", "cartes", "dégradé", "rose", "brique", "illustration", "angles droits"],
  identity: frise, racine: racineDe("#f9ddd2"),
  widgets: ["html", "text", "link", "bizhours", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ENCRE = "#3b1f1a", BRIQUE = "#9e2f1a", ROSE = "#f9ddd2", CARTE = "#f2c9ba";
    const phrase = G.geant(`<p>Du moulin<br>au comptoir.</p>`, { taille: [40, 84], tablette: { taille: [56, 72] }, mobile: { taille: [40, 52] }, lh: 1, suivi: "-0.02em", poids: "600", police: S.head, couleur: "#ffffff" })(k, env);
    const form = formulaire(k, env, G, { titre: "La lettre du levain", intro: "Les nouveautés de la semaine.", bouton: "S'abonner", largeur: "440px", texte: "#ffffff", btnFond: "#ffffff", btnTexte: BRIQUE, survolFond: ROSE, survolTexte: ENCRE, styleTitre: { textTransform: "uppercase", letterSpacing: "0.14em" } });
    const gauche = G.colonne(k, [caps(k, "Boulangerie Petit Levain", { couleur: "#ffe3d8" }), phrase, form], { poids: 6, min: "300px", gap: "24px" });
    const dessin = k.col([svgW(k, I.moulin())], { flexGrow: 4, flexBasis: "0px", minWidth: "260px", maxWidth: "460px", alignSelf: "center" });
    const ban = G.bande(k, [gauche, dessin], { fond: BRIQUE, degrade: { from: "#b8381f", to: "#6e1f10", angle: 110, type: "linear" }, gap: "32px 64px", aligne: "center", padV: ["64px", "48px", "36px"], padB: ["64px", "48px", "36px"], padH: ["48px", "32px", "20px"], nom: "Moulin" });
    const etapes = [["Le moulin", "Farines choisies, de petites minoteries.", "/catalogue"], ["Le pétrin", "Levain vivant, longues pauses.", "/catalogue"], ["Le façonnage", "Un pain à la fois, à la main.", "/catalogue"], ["Le four", "Cuisson en sole, croûte dorée.", "/catalogue"], ["Le comptoir", "Vitrine, commande et retrait.", "/boutique"]];
    const cartes = k.row(etapes.map(([t, d, u], i) => case_(k, [k.T(`<p>0${i + 1}</p>`, { fontFamily: S.head, fontSize: "28px", color: BRIQUE, lineHeight: 1 }), trait(k, ENCRE, "2px"), lien(k, t, u, { taille: 20, poids: "600", police: S.head, couleur: ENCRE, bloc: true, survol: { color: BRIQUE, transform: { x: 4 } }, focus: BRIQUE, extra: { width: "100%" } }), texte(k, d, { taille: 14, couleur: S.mute, lh: 1.5 })], { fond: CARTE, pad: "24px", min: "170px", gap: "10px", survol: { backgroundColor: "#ecb9a8", transform: { y: -4 } } })), { gap: "12px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const milieu = G.bande(k, [cartes], { fond: ROSE, colonne: true, padV: ["40px", "32px", "24px"], padB: ["24px", "20px", "16px"], padH: ["32px", "24px", "16px"], nom: "Étapes" });
    const bas = G.bande(k, [G.colonne(k, [caps(k, "Horaires", { couleur: BRIQUE }), horaires(k, { taille: 15 })], { poids: 2, min: "240px", gap: "10px" }), G.colonne(k, [caps(k, "Suivre le fournil", { couleur: BRIQUE }), soc(k, env, "instagram+facebook+tiktok", "big")], { poids: 1, min: "200px", gap: "10px" }), trait(k, S.line), sansCookies(k, env, G)], { fond: ROSE, gap: "28px 48px", aligne: "flex-start", padV: ["16px", "16px", "12px"], padB: ["28px", "24px", "20px"], padH: ["32px", "24px", "16px"], nom: "Infos" });
    return [G.racine(k, [ban, milieu, bas])];
  },
}, FAM);

const escalier = identite({
  key: "c349", label: "Verts de blé en escalier", humeur: "light",
  fond: "#e6eedb", texte: "#14291c", discret: "#3d5545", accent: "#1f5c36", surface: "#cfe0c0", encre: "#14291c", surEncre: "#e6eedb",
  police: "font.cabin", titres: "font.bodoni-moda", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#14291c33",
});
const escalierDuGrain = modeleV2({
  id: identifiantV2(349, "escalier-du-grain"), concept: "c-349-escalier-du-grain", name: "Escalier du grain", family: FAM,
  description: "Café-boulangerie : grand épi d'orge dessiné dans un soleil de cercles verts à côté du nom en grand, quatre colonnes de liens en capitales, rangée de pictos et de réseaux, ligne légale. Quatre bandes vertes en escalier.",
  tags: ["café", "boulangerie", "épi d'orge", "escalier", "colonnes", "vert", "sauge", "illustration", "angles droits"],
  identity: escalier, racine: racineDe("#e6eedb"),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, V1 = "#14291c", V2 = "#24593a", V3 = "#a9cf9b", V4 = "#cfe0c0", SAUGE = "#e6eedb";
    const nom = G.geant(`<p>Grain d'Orge</p>`, { taille: [48, 112], tablette: { taille: [72, 96] }, mobile: { taille: [44, 60] }, lh: 1, suivi: "-0.02em", poids: "700", police: S.head, couleur: SAUGE })(k, env);
    const epi = k.col([svgW(k, I.epi())], { flexGrow: 3, flexBasis: "0px", minWidth: "240px", maxWidth: "400px", alignSelf: "center" });
    const gauche = G.colonne(k, [caps(k, "Café &nbsp;·&nbsp; boulangerie", { couleur: V3 }), nom, texte(k, "Pains au levain, cafés de saison et déjeuners simples.", { taille: 17, couleur: "#dfead6", max: "460px" })], { poids: 6, min: "300px", gap: "20px" });
    const b1 = G.bande(k, [gauche, k.col([badges(k, { trait: SAUGE, fond: V1, accent: V3, max: "340px" }), soc(k, env, "instagram+facebook+youtube", "big")], { gap: "20px", flexGrow: 3, flexBasis: "0px", minWidth: "240px", alignSelf: "center" })], { fond: V1, gap: "32px 64px", aligne: "center", padV: ["56px", "44px", "32px"], padB: ["56px", "44px", "32px"], padH: ["56px", "32px", "20px"], nom: "Grain" });
    const cc = (enf) => case_(k, enf, { fond: V4, pad: "28px", min: "200px", poids: 1, survol: { backgroundColor: "#dcebcf", transform: { y: -4 } } });
    const cols = k.row([
      cc([colLiens(k, "Le pain", [["Pains", "/catalogue"], ["Viennoiseries", "/catalogue"], ["Commander", "/boutique"]], { titre: V1, couleur: V1, survol: V2, filet: V2, min: "0px" })]),
      cc([colLiens(k, "Le café", [["Cafés", "/catalogue"], ["Déjeuner", "/catalogue"], ["Contact", "/contact"]], { titre: V1, couleur: V1, survol: V2, filet: V2, min: "0px" })]),
      cc([caps(k, "Horaires", { couleur: V1, taille: "13px" }), trait(k, V2, "2px"), horaires(k, { taille: 15, couleur: V1 })]),
      cc([caps(k, "Adresse", { couleur: V1, taille: "13px" }), trait(k, V2, "2px"), coordonnees(k, { taille: 15, couleur: V1, lien: V1, survol: V2, focus: V1 })]),
    ], { gap: "12px", alignItems: "stretch", flexWrap: "wrap", flexGrow: 5, flexBasis: "0px", minWidth: "320px" });
    const b2 = G.bande(k, [epi, cols], { fond: V3, gap: "32px 48px", aligne: "center", padV: ["48px", "40px", "32px"], padB: ["40px", "32px", "28px"], padH: ["56px", "32px", "20px"], nom: "Colonnes" });
    const milieu = k.row([badges(k, { trait: V1, fond: V4, accent: V2, max: "340px" }), soc(k, env, "instagram+facebook+youtube", "big")], { gap: "20px 40px", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", width: "100%" });
    const b3 = G.bande(k, [formulaire(k, env, G, { titre: "La lettre du grain", intro: "Les pains de la semaine.", bouton: "S'abonner", largeur: "420px", texte: V1, btnFond: V1, btnTexte: SAUGE, survolFond: V2, survolTexte: "#ffffff", styleTitre: { textTransform: "uppercase", letterSpacing: "0.14em" } }), sansCookies(k, env, G)], { fond: V4, colonne: true, gap: "24px", padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: ["56px", "32px", "20px"], nom: "Infos" });
    return [G.racine(k, [b1, b2, b3])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Cafés et boulangeries", target: 6, built: true,
  description: "Pieds de cafés et boulangeries : mosaïque de cartes, bandeau en dégradé, colonnes sobres, avec des illustrations dessinées (tasse, pains, théière, croissant en pixels, moulin, épi).",
  models: [leZinc, deuxFournees, papierEnTete, consoleFournil, moulinComptoir, escalierDuGrain],
};
