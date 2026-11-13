// Famille v2 « Cave, bières et spiritueux » — 6 modèles (ft2-338 à ft2-343), refaits à partir des captures 19 (mosaïque de cartes sombres), 20 (bandeau d'inscription en dégradé + cartes de liens + grand dessin en bas) et 21 (colonnes sobres + pictos + réseaux).
// ANGLES DROITS partout. Marques fictives, AUCUNE coordonnée ni chiffre inventé (horaires, adresse, téléphone viennent des « Données de l'entreprise »).
// Chaque pied porte UNE illustration SVG dessinée (aides-illus-a06.js) : casier à bouteilles, mousse de bière, rangée de bouteilles, coteaux de vignes, alambic, frise de pommes.
// Mouvement : transitions de 320 ms, une animation visible par modèle (cartes et tuiles qui se soulèvent, liens qui glissent, point qui respire) ; rien sous « mouvement réduit ».
const { modeleV2, identifiantV2, identite, G: GK } = require("../kit-v2");
const A = require("../aides-inspire-b");
const I = require("../aides-illus-a06");
const { racineDe, lien, caps, texte, trait, souffle, horaires, coordonnees, case_, sansCookies, Moteur } = A;
const { svgW, tuileIcone, colLiens, formulaire, badges } = I;

const FAM = "boissons-cave";
const RES = [["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"]];
const soc = (k, env, liste, look = "big", centre) => Moteur.item(k, `socials:${liste}|${look}`, env, centre);

// ═══ ft2-338 « Chai de nuit » — mosaïque de cartes sombres (capture 19) : bienvenue + casier à bouteilles dessiné, tuiles d'icônes, nom en grand ═══
const chai = identite({
  key: "c338", label: "Bordeaux de nuit et champagne", humeur: "dark",
  fond: "#150609", texte: "#f5e9d8", discret: "#d3bfb4", accent: "#e3b565", surface: "#2f121d", encre: "#1f0b12", surEncre: "#f5e9d8",
  police: "font.work-sans", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f5e9d833",
});
const chaiDeNuit = modeleV2({
  id: identifiantV2(338, "chai-de-nuit"), concept: "c-338-chai-de-nuit", name: "Chai de nuit", family: FAM,
  description: "Cave à vins : mosaïque de cartes bordeaux à angles droits. Grande carte de bienvenue avec un casier à bouteilles dessiné et une barre de réservation, rayons et horaires, trois tuiles d'icônes de réseaux, nom de la cave en grand.",
  tags: ["cave à vins", "caviste", "mosaïque", "cartes", "sombre", "bordeaux", "champagne", "illustration", "angles droits"],
  identity: chai, racine: racineDe("#150609"),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, OR = "#e3b565", SURF = "#2f121d", BG = "#150609", SURV = { backgroundColor: "#421a29", transform: { y: -4 } };
    const titre = G.geant(`<p>Une bouteille à ouvrir ?<br>Passez au comptoir.</p>`, { taille: [30, 54], tablette: { taille: [34, 46] }, mobile: { taille: [28, 36] }, lh: 1.1, suivi: "-0.01em", poids: "600", police: S.head, couleur: S.fg })(k, env);
    const marque = k.col([], { width: "40px", height: "40px", backgroundColor: OR, flexShrink: 0 });
    souffle(marque, 3200);
    const bt = lien(k, "Réserver", "/contact", { taille: 15, poids: "800", casse: "uppercase", suivi: "0.1em", couleur: "#1f0b12", h: "48px", padH: "24px", survol: { backgroundColor: "#ffffff" }, focus: "#ffffff", extra: { backgroundColor: OR, justifyContent: "center" } });
    const barre = k.row([marque, texte(k, "Dégustation avec le caviste", { taille: 15, couleur: S.fg, extra: { flexGrow: 1 } }), bt], { gap: "14px", alignItems: "center", flexWrap: "wrap", borderStyle: "solid", borderWidth: "1px", borderColor: "#e3b56566", borderRadius: "0px", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "14px", paddingRight: "10px", backgroundColor: "#1f0b12", width: "100%" });
    const casier = k.col([svgW(k, I.casier())], { flexGrow: 1, flexBasis: "0px", minWidth: "220px", maxWidth: "340px", alignSelf: "center" });
    const A1 = case_(k, [k.row([titre, casier], { gap: "28px", alignItems: "center", width: "100%" }), barre], { fond: SURF, pad: "36px", poids: 1, survol: { backgroundColor: "#3a1624" } });
    const B1 = case_(k, [caps(k, "Avant de partir", { couleur: OR, taille: "14px" }), k.row([colLiens(k, "La cave", [["Vins", "/catalogue"], ["Bières", "/catalogue"], ["Spiritueux", "/catalogue"], ["Coffrets", "/catalogue"]], { titre: OR, survol: OR, min: "130px" }), colLiens(k, "Service", [["Conseils", "/faq"], ["Contact", "/contact"], ["La boutique", "/boutique"]], { titre: OR, survol: OR, min: "130px" }), colLiens(k, "Légal", [["Cookies", "/cookies"]], { titre: OR, survol: OR, min: "130px" })], { gap: "8px 24px", flexWrap: "wrap", width: "100%" })], { fond: SURF, pad: "36px", poids: 1, survol: SURV });
    const C1 = case_(k, [k.T("<p>Où et quand ?</p>", { fontFamily: S.head, fontSize: "fluid:26-36", fontWeight: "600", color: S.fg, lineHeight: 1.15 }), caps(k, "Horaires et adresse", { couleur: S.mute }), k.row([k.col([horaires(k, { taille: 15 })], { flexGrow: 1, flexBasis: "0px", minWidth: "180px" }), k.col([coordonnees(k, { taille: 15, lien: S.fg, survol: OR, focus: OR })], { flexGrow: 1, flexBasis: "0px", minWidth: "180px" })], { gap: "16px 28px", flexWrap: "wrap", width: "100%" })], { fond: SURF, pad: "36px", poids: 1, survol: SURV });
    const tuiles = k.row([tuileIcone(k, env, "instagram", { fond: SURF }), tuileIcone(k, env, "facebook", { fond: SURF }), tuileIcone(k, env, "youtube", { fond: SURF })], { gap: "12px", flexWrap: "nowrap", alignItems: "stretch", width: "100%" });
    const nom = case_(k, [k.T("<p>Chai Noir</p>", { fontFamily: S.head, fontSize: "fluid:36-56", fontWeight: "600", fontStyle: "italic", color: OR, lineHeight: 1.05, textAlign: "center" })], { fond: "#1f0b12", cadre: "1px", cadreCouleur: "#e3b56566", pad: "28px", h: "130px", justifie: "center", survol: { transform: { y: -4 }, backgroundColor: "#2a0f19" } });
    const colG = G.colonne(k, [A1, B1], { poids: 1, min: "320px", gap: "12px", aligne: "stretch" });
    const colD = G.colonne(k, [C1, tuiles, nom], { poids: 1, min: "320px", gap: "12px", aligne: "stretch" });
    const mosaique = G.bande(k, [colG, colD], { fond: BG, gap: "12px", aligne: "stretch", padV: ["40px", "32px", "20px"], padB: ["12px", "12px", "12px"], padH: ["32px", "24px", "16px"], nom: "Mosaïque" });
    const mentions = G.bande(k, [sansCookies(k, env, G)], { fond: BG, colonne: true, padV: ["20px", "20px", "16px"], padB: ["24px", "20px", "16px"], padH: ["32px", "24px", "16px"], nom: "Mentions" });
    return [G.racine(k, [mosaique, mentions])];
  },
}, FAM);

// ═══ ft2-339 « Mousse haute » — bandeau d'inscription en dégradé jaune (capture 20) + mousse de bière dessinée qui coule + quatre cartes de liens ══════
const mousse = identite({
  key: "c339", label: "Jaune houblon et anthracite", humeur: "dark",
  fond: "#1a1a17", texte: "#f4efe2", discret: "#c9c4b4", accent: "#f4b400", surface: "#262620", encre: "#1a1405", surEncre: "#f4efe2",
  police: "font.archivo", titres: "font.anton", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f4efe233",
});
const mousseHaute = modeleV2({
  id: identifiantV2(339, "mousse-haute"), concept: "c-339-mousse-haute", name: "Mousse haute", family: FAM,
  description: "Brasserie : bandeau d'inscription en dégradé jaune houblon, mousse de bière dessinée qui déborde en bulles sur l'anthracite, quatre cartes de liens aux titres soulignés, ligne de marque avec réseaux.",
  tags: ["brasserie", "bière", "lettre d'information", "dégradé", "mousse", "jaune", "anthracite", "illustration", "angles droits"],
  identity: mousse, racine: racineDe("#1a1a17"),
  widgets: ["html", "text", "link", "emailsubscribe", "bizhours", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, JAUNE = "#f4b400", ENCRE = "#1a1405", CARTE = "#262620";
    const phrase = G.geant(`<p>Rejoins<br>la mousse.</p>`, { taille: [52, 120], tablette: { taille: [80, 104] }, mobile: { taille: [52, 76] }, lh: 0.95, poids: "400", police: S.head, couleur: ENCRE, extra: { textTransform: "uppercase" } })(k, env);
    const form = formulaire(k, env, G, { titre: "La lettre du brassin", intro: "Nouvelles cuvées et soirées dégustation.", bouton: "Je m'abonne", largeur: "480px", texte: ENCRE, btnFond: ENCRE, btnTexte: JAUNE, survolFond: "#000000", survolTexte: JAUNE });
    const g = G.colonne(k, [phrase], { poids: 6, min: "280px" });
    const d = G.colonne(k, [form], { poids: 5, min: "290px", soi: "flex-end" });
    const banniere = G.bande(k, [g, d], { fond: JAUNE, degrade: { from: "#ffc928", to: "#e08a00", angle: 100, type: "linear" }, gap: "32px 64px", aligne: "flex-end", padV: ["72px", "56px", "40px"], padB: ["24px", "20px", "16px"], padH: ["48px", "32px", "20px"], nom: "Bandeau" });
    const rang = (t, u) => lien(k, t, u, { taille: 28, police: S.head, poids: "400", casse: "uppercase", couleur: S.fg, bloc: true, h: "64px", lh: 1, survol: { color: JAUNE, paddingLeft: "16px" }, focus: JAUNE, extra: { width: "100%", letterSpacing: "0.02em", borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#f4efe233", transitionDuration: 360 } });
    const index = case_(k, [caps(k, "Dans la cave", { couleur: JAUNE, taille: "13px" }), k.col([["Blondes", "/catalogue"], ["Ambrées et brunes", "/catalogue"], ["Fûts et location", "/catalogue"], ["Visites", "/catalogue"], ["La boutique", "/boutique"]].map(([t, u]) => rang(t, u)), { gap: "0px", width: "100%" })], { fond: CARTE, pad: "32px", poids: 3, min: "280px", survol: { backgroundColor: "#30302a" } });
    const pile = G.colonne(k, [case_(k, [caps(k, "Horaires", { couleur: JAUNE, taille: "13px" }), horaires(k, { taille: 15 })], { fond: CARTE, pad: "28px", min: "0px", survol: { backgroundColor: "#30302a", transform: { y: -4 } } }), case_(k, [caps(k, "Nous trouver", { couleur: JAUNE, taille: "13px" }), coordonnees(k, { taille: 15, lien: S.fg, survol: JAUNE, focus: JAUNE })], { fond: CARTE, pad: "28px", min: "0px", survol: { backgroundColor: "#30302a", transform: { y: -4 } } })], { poids: 2, min: "240px", gap: "12px", aligne: "stretch" });
    const cartes = k.row([index, pile], { gap: "12px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const corps = G.bande(k, [cartes], { fond: "#1a1a17", colonne: true, padV: ["16px", "16px", "12px"], padB: ["12px", "12px", "12px"], padH: ["48px", "32px", "16px"], nom: "Cartes" });
    const marque = G.ligne(k, [k.T("<p>Houblon &amp; Fils</p>", { fontFamily: S.head, fontSize: "fluid:28-40", textTransform: "uppercase", color: S.fg, lineHeight: 1.05 }), sansCookies(k, env, G), soc(k, env, "instagram+facebook+youtube", "big")], { justifie: "space-between", aligne: "center", gap: "16px 32px", largeur: "100%" });
    const bas = G.bande(k, [marque], { fond: "#1a1a17", colonne: true, padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Marque" });
    return [G.racine(k, [banniere, bandeSvg(k, I.mousse()), corps, bas])];
  },
}, FAM);
const bandeSvg = (k, svg) => ({ type: "container", props: { full: true }, name: "Illustration", children: [svgW(k, svg)], ...A.sty({ display: "flex", flexDirection: "column", width: "100%", backgroundColor: "#1a1a17", gap: "0px" }) });

// ═══ ft2-340 « Damier du comptoir » — colonnes sobres sur papier (capture 21) + rangée de quatre bouteilles dessinées + pictos et réseaux ═══════════
const damier = identite({
  key: "c340", label: "Papier, encre et vert bouteille", humeur: "light",
  fond: "#efe9dc", texte: "#111111", discret: "#46463f", accent: "#0f5c4d", surface: "#e2dac6", encre: "#111111", surEncre: "#efe9dc",
  police: "font.dm-mono", titres: "font.league-gothic", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#11111133",
});
const damierComptoir = modeleV2({
  id: identifiantV2(340, "damier-du-comptoir"), concept: "c-340-damier-du-comptoir", name: "Damier du comptoir", family: FAM,
  description: "Spiritueux : quatre bouteilles dessinées au trait en vignettes sur papier, quatre colonnes de liens en capitales, rangée de pictos de services et de réseaux au centre, ligne légale.",
  tags: ["spiritueux", "whisky", "bouteilles dessinées", "vignettes", "colonnes", "papier", "vert bouteille", "illustration", "angles droits"],
  identity: damier, racine: racineDe("#efe9dc"),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, PAPIER = "#efe9dc", ENCRE = "#111111", VERT = "#0f5c4d";
    const nom = k.T("<p>Cave des Quatre Vents</p>", { fontFamily: S.head, fontSize: "fluid:32-52", textTransform: "uppercase", color: ENCRE, lineHeight: 1 });
    const vignettes = svgW(k, I.bouteilles());
    const cols = k.row([
      colLiens(k, "Rayons", [["Whiskys", "/catalogue"], ["Rhums", "/catalogue"], ["Gins et vodkas", "/catalogue"], ["Cognacs", "/catalogue"]], { titre: ENCRE, survol: VERT, color: ENCRE, couleur: ENCRE }),
      colLiens(k, "Services", [["Retrait en cave", "/catalogue"], ["Conseils", "/faq"], ["La boutique", "/boutique"], ["Contact", "/contact"]], { titre: ENCRE, survol: VERT, couleur: ENCRE }),
      k.col([caps(k, "Horaires", { couleur: ENCRE, taille: "13px" }), horaires(k, { taille: 14 })], { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "180px" }),
      k.col([caps(k, "Adresse", { couleur: ENCRE, taille: "13px" }), coordonnees(k, { taille: 14, lien: ENCRE, survol: VERT, focus: VERT })], { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "180px" }),
    ], { gap: "28px 32px", flexWrap: "wrap", alignItems: "flex-start", width: "100%" });
    const entete = G.ligne(k, [nom, badges(k, { trait: ENCRE, fond: PAPIER, accent: VERT, max: "300px" })], { justifie: "space-between", aligne: "center", gap: "16px 32px", largeur: "100%" });
    const pied = k.row([soc(k, env, "instagram+facebook+youtube+x", "big")], { gap: "16px 32px", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", width: "100%" });
    const corps = G.bande(k, [entete, vignettes, cols, pied], { fond: PAPIER, colonne: true, gap: "28px", padV: ["56px", "44px", "32px"], padB: ["16px", "16px", "12px"], padH: ["32px", "24px", "16px"], nom: "Colonnes" });
    const mentions = G.bande(k, [sansCookies(k, env, G)], { fond: PAPIER, colonne: true, padV: ["8px", "8px", "8px"], padB: ["24px", "20px", "16px"], padH: ["32px", "24px", "16px"], nom: "Mentions" });
    return [G.racine(k, [corps, mentions])];
  },
}, FAM);

// ═══ ft2-341 « Sommaire des vignes » — mosaïque en trois colonnes (capture 19) crème et lie-de-vin, coteaux de vignes dessinés en grande carte ═══════
const sommaire = identite({
  key: "c341", label: "Crème et lie-de-vin", humeur: "light",
  fond: "#f3ede1", texte: "#2a1015", discret: "#5c4247", accent: "#7a1f2b", surface: "#e9dfcd", encre: "#2a1015", surEncre: "#f3ede1",
  police: "font.manrope", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#2a101533",
});
const sommaireDesVignes = modeleV2({
  id: identifiantV2(341, "sommaire-des-vignes"), concept: "c-341-sommaire-des-vignes", name: "Sommaire des vignes", family: FAM,
  description: "Caviste : mosaïque claire en trois colonnes. Grande carte avec un paysage de coteaux de vignes dessiné et un soleil couchant, sommaire des rayons et horaires, tuiles d'icônes de réseaux.",
  tags: ["vin", "caviste", "mosaïque", "paysage", "vignes", "terrasses", "crème", "lie-de-vin", "illustration", "angles droits"],
  identity: sommaire, racine: racineDe("#f3ede1"),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, VIN = "#7a1f2b", CREME = "#f3ede1", ENCRE = "#2a1015", CARTE = "#e9dfcd", SURV = { backgroundColor: "#dccfb6", transform: { y: -4 } };
    const titre = G.geant(`<p>Cave des<br><span style="color:${VIN}">Terrasses.</span></p>`, { taille: [40, 84], tablette: { taille: [54, 72] }, mobile: { taille: [40, 52] }, lh: 1.02, suivi: "-0.015em", poids: "600", police: S.head, couleur: ENCRE })(k, env);
    const paysage = case_(k, [caps(k, "Cave et dégustations", { couleur: VIN }), titre, k.col([svgW(k, I.terrasses())], { width: "100%", marginTop: "auto" })], { fond: CARTE, pad: "36px", poids: 5, min: "300px", justifie: "space-between", survol: { backgroundColor: "#e2d6bd" }, extra: { overflow: "hidden" } });
    const rang = (t, u) => lien(k, t, u, { taille: 16, poids: "500", police: S.head, couleur: ENCRE, bloc: true, h: "58px", survol: { backgroundColor: VIN, color: CREME, paddingLeft: "20px" }, focus: ENCRE, extra: { width: "100%", fontSize: "fluid:22-30", fontStyle: "italic", transitionDuration: 360, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#2a101555" } });
    const somm = case_(k, [caps(k, "Sommaire", { couleur: VIN }), k.col([["Rouges de garde", "/catalogue"], ["Blancs et rosés", "/catalogue"], ["Bulles et champagnes", "/catalogue"], ["Liquoreux", "/catalogue"], ["Coffrets", "/catalogue"]].map(([t, u]) => rang(t, u)), { gap: "0px", width: "100%" })], { fond: CARTE, pad: "28px", min: "0px", survol: SURV });
    const infos = case_(k, [caps(k, "Horaires et adresse", { couleur: VIN }), horaires(k, { taille: 15 }), coordonnees(k, { taille: 15, lien: ENCRE, survol: VIN, focus: VIN })], { fond: CARTE, pad: "28px", min: "0px", survol: SURV });
    const milieu = G.colonne(k, [somm, infos], { poids: 4, min: "280px", gap: "12px", aligne: "stretch" });
    const tuiles = k.col(["instagram", "facebook", "youtube"].map((r) => tuileIcone(k, env, r, { fond: ENCRE, h: "120px" })), { gap: "12px", width: "100%" });
    const sig = case_(k, [k.T("<p>Les Terrasses</p>", { fontFamily: S.head, fontSize: "fluid:28-40", fontStyle: "italic", color: VIN, lineHeight: 1.05, textAlign: "center" })], { fond: CARTE, pad: "20px", h: "100px", justifie: "center", survol: SURV });
    const droite = G.colonne(k, [tuiles, sig], { poids: 2, min: "200px", gap: "12px", aligne: "stretch" });
    const mosa = G.bande(k, [paysage, milieu, droite], { fond: CREME, gap: "12px", aligne: "stretch", padV: ["40px", "32px", "20px"], padB: ["12px", "12px", "12px"], padH: ["32px", "24px", "16px"], nom: "Mosaïque" });
    const mentions = G.bande(k, [sansCookies(k, env, G)], { fond: CREME, colonne: true, padV: ["16px", "16px", "12px"], padB: ["24px", "20px", "16px"], padH: ["32px", "24px", "16px"], nom: "Mentions" });
    return [G.racine(k, [mosa, mentions])];
  },
}, FAM);

// ═══ ft2-342 « Tourbe et fût » — dégradé cuivre d'inscription + quatre cartes (capture 20) + grand alambic en cuivre sous un halo de braise ════════
const tourbe = identite({
  key: "c342", label: "Noir de tourbe et cuivre", humeur: "dark",
  fond: "#15110d", texte: "#efe3cf", discret: "#c1b095", accent: "#c98a4b", surface: "#211a13", encre: "#15110d", surEncre: "#efe3cf",
  police: "font.ibm-plex-mono", titres: "font.abril-fatface", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#efe3cf33",
});
const tourbeEtFut = modeleV2({
  id: identifiantV2(342, "tourbe-et-fut"), concept: "c-342-tourbe-et-fut", name: "Tourbe et fût", family: FAM,
  description: "Distillerie : bandeau d'inscription en dégradé cuivre, quatre cartes de liens aux titres soulignés, ligne de marque, puis un grand alambic de cuivre dessiné au centre d'un halo de braise.",
  tags: ["whisky", "distillerie", "alambic", "halo", "cuivre", "dégradé", "noir", "illustration", "angles droits"],
  identity: tourbe, racine: racineDe("#15110d"),
  widgets: ["html", "text", "link", "emailsubscribe", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, CUIVRE = "#c98a4b", CARTE = "#211a13";
    const phrase = G.geant(`<p>Le distillat<br>de la maison.</p>`, { taille: [32, 64], tablette: { taille: [40, 56] }, mobile: { taille: [32, 40] }, lh: 1.05, poids: "400", police: S.head, couleur: "#15110d" })(k, env);
    const form = formulaire(k, env, G, { titre: "", intro: "Lots limités et visites, une lettre par saison.", bouton: "S'inscrire", largeur: "520px", texte: "#15110d", btnFond: "#15110d", btnTexte: "#efe3cf", survolFond: "#000000", survolTexte: CUIVRE });
    const ban = G.bande(k, [G.colonne(k, [phrase], { poids: 4, min: "260px" }), G.colonne(k, [form], { poids: 6, min: "290px", soi: "flex-end" })], { fond: CUIVRE, degrade: { from: "#e0a060", to: "#b8793a", angle: 90, type: "linear" }, gap: "28px 64px", aligne: "center", padV: ["56px", "44px", "36px"], padB: ["56px", "44px", "36px"], padH: ["56px", "32px", "20px"], nom: "Inscription" });
    const reg = (enf) => k.col(enf, { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "200px", borderStyle: "solid", borderWidth: "0px", borderLeftWidth: "1px", borderColor: "#efe3cf44", paddingLeft: "24px", paddingTop: "4px", paddingBottom: "4px" });
    const cartes = k.row([
      reg([colLiens(k, "La distillerie", [["Visites", "/catalogue"], ["Le fût", "/catalogue"], ["Le journal", "/blog"]], { titre: CUIVRE, survol: CUIVRE, min: "0px" })]),
      reg([colLiens(k, "Boutique", [["Les flacons", "/boutique"], ["Coffrets", "/boutique"], ["Conseils", "/faq"]], { titre: CUIVRE, survol: CUIVRE, min: "0px" })]),
      reg([caps(k, "Horaires", { couleur: CUIVRE, taille: "13px" }), horaires(k, { taille: 14 })]),
      reg([caps(k, "Nous trouver", { couleur: CUIVRE, taille: "13px" }), coordonnees(k, { taille: 14, lien: S.fg, survol: CUIVRE, focus: CUIVRE })]),
    ], { gap: "24px 0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const corps = G.bande(k, [cartes], { fond: "#15110d", colonne: true, padV: ["56px", "44px", "32px"], padB: ["24px", "20px", "16px"], padH: ["56px", "32px", "16px"], nom: "Cartes" });
    const marque = G.ligne(k, [sansCookies(k, env, G), soc(k, env, "instagram+facebook+youtube", "big")], { justifie: "space-between", aligne: "center", gap: "16px 32px", largeur: "100%" });
    const m = G.bande(k, [marque], { fond: "#15110d", colonne: true, padV: ["28px", "24px", "20px"], padB: ["0px", "0px", "0px"], padH: ["56px", "32px", "16px"], nom: "Marque" });
    const grand = G.bande(k, [k.col([svgW(k, I.alambic())], { width: "100%", maxWidth: "820px", marginLeft: "auto", marginRight: "auto" })], { fond: "#15110d", colonne: true, padV: ["0px", "0px", "0px"], padB: ["24px", "20px", "16px"], padH: ["32px", "24px", "16px"], nom: "Alambic" });
    return [G.racine(k, [ban, corps, m, grand])];
  },
}, FAM);

// ═══ ft2-343 « Barre de comptoir » — colonnes sobres sur rouge (capture 21) + frise de pommes dessinées + pictos et réseaux ═════════════════════════
const barre = identite({
  key: "c343", label: "Rouge coquelicot et blanc", humeur: "dark",
  fond: "#c8281c", texte: "#ffffff", discret: "#ffe9e6", accent: "#fff3c4", surface: "#a81f15", encre: "#c8281c", surEncre: "#ffffff",
  police: "font.dm-sans", titres: "font.syne", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff55",
});
const barreDeComptoir = modeleV2({
  id: identifiantV2(343, "barre-de-comptoir"), concept: "c-343-barre-de-comptoir", name: "Barre de comptoir", family: FAM,
  description: "Cidrerie ou bar à bières : frise de pommes blanches dessinées sur pied rouge, quatre colonnes de liens en capitales, rangée de pictos de services et de réseaux au centre, ligne légale.",
  tags: ["cidre", "bière", "pommes", "frise", "colonnes", "rouge", "illustration", "angles droits"],
  identity: barre, racine: racineDe("#c8281c"),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ROUGE = "#c8281c", BL = "#ffffff", CL = "#fff3c4";
    const frise = G.bande(k, [svgW(k, I.pommes())], { fond: ROUGE, colonne: true, padV: ["28px", "20px", "12px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "1600px", nom: "Pommes" });
    const nom = G.geant(`<p>Pomme-Rouge</p>`, { taille: [40, 72], tablette: { taille: [52, 64] }, mobile: { taille: [44, 56] }, lh: 1, suivi: "-0.02em", poids: "800", police: S.head, couleur: BL })(k, env);
    const gauche = G.colonne(k, [caps(k, "Cidrerie et bar à bières", { couleur: CL }), nom, soc(k, env, "instagram+facebook+youtube+tiktok", "big")], { poids: 5, min: "300px", gap: "24px" });
    const liensH = k.row([["Cidres", "/catalogue"], ["Bières", "/catalogue"], ["Jus de pomme", "/catalogue"], ["Cadeaux", "/catalogue"], ["Commander", "/boutique"], ["Contact", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 17, poids: "700", couleur: BL, soulign: true, padH: "4px", survol: { color: CL, transform: { y: -2 } }, focus: BL })), { ...GK.gaps("4px 24px"), alignItems: "center" });
    const boite = k.col([k.row([k.col([caps(k, "Horaires", { couleur: CL, taille: "13px" }), horaires(k, { taille: 15, couleur: BL })], { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "170px" }), k.col([caps(k, "Adresse", { couleur: CL, taille: "13px" }), coordonnees(k, { taille: 15, couleur: BL, lien: BL, survol: CL, focus: BL })], { gap: "10px", flexGrow: 1, flexBasis: "0px", minWidth: "170px" })], { gap: "20px 28px", flexWrap: "wrap", width: "100%" }), trait(k, "#ffffff55"), badges(k, { trait: BL, fond: ROUGE, accent: CL, max: "340px" })], { gap: "22px", borderStyle: "solid", borderWidth: "1px", borderColor: "#ffffff88", borderRadius: "0px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", flexGrow: 6, flexBasis: "0px", minWidth: "300px" });
    const haut = G.bande(k, [gauche, boite], { fond: ROUGE, gap: "32px 56px", aligne: "stretch", padV: ["24px", "20px", "16px"], padB: ["24px", "20px", "16px"], padH: ["48px", "32px", "16px"], nom: "Marque" });
    const corps = G.bande(k, [liensH, sansCookies(k, env, G, { liens: "#ffffff", couleur: "#ffe9e6" })], { fond: "#a81f15", colonne: true, gap: "20px", padV: ["28px", "24px", "20px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "16px"], nom: "Liens" });
    return [G.racine(k, [frise, haut, corps])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Cave, bières et spiritueux", target: 6, built: true,
  description: "Pieds de caves, brasseries, distilleries et cidreries : mosaïque de cartes, bandeau en dégradé, colonnes sobres, avec des illustrations dessinées (casier, mousse, bouteilles, vignes, alambic, pommes).",
  models: [chaiDeNuit, mousseHaute, damierComptoir, sommaireDesVignes, tourbeEtFut, barreDeComptoir],
};
