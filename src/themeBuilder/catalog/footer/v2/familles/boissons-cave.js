// Famille v2 « Cave, bières et spiritueux » — 6 modèles (ft2-338 à ft2-343), pieds inspirés de captures (mosaïque de cartes sombres, bandeau d'inscription XXL, grille de liens).
// ANGLES DROITS partout. Marques fictives, AUCUNE coordonnée ni chiffre inventé (horaires, adresse, téléphone viennent des « Données de l'entreprise »).
// Archétypes : 338 H mosaïque asymétrique · 339 F bandeau XXL + colonne étroite · 340 C damier de cases · 341 G index en lignes · 342 B nom monumental · 343 D barre unique.
// Mouvement : transitions de 320 ms (fond, couleur, décalage), une animation visible par modèle (case qui se soulève, flèche qui glisse, ligne qui se remplit, point qui respire) ; rien sous « mouvement réduit ».
const { modeleV2, identifiantV2, identite, G: GK } = require("../kit-v2");
const A = require("../aides-inspire-b");
const { racineDe, lien, caps, texte, trait, souffle, horaires, coordonnees, abo, case_, sansCookies } = A;

const FAM = "boissons-cave";
const RES = [["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"]];

// ═══ ft2-338 « Chai de nuit » — mosaïque asymétrique (H), cave à vins, bordeaux profond et champagne ═════════════════════════════════════════
const chai = identite({
  key: "c338", label: "Bordeaux de nuit et champagne", humeur: "dark",
  fond: "#1f0b12", texte: "#f5e9d8", discret: "#d3bfb4", accent: "#e3b565", surface: "#2f121d", encre: "#1f0b12", surEncre: "#f5e9d8",
  police: "font.work-sans", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f5e9d833",
});
const chaiDeNuit = modeleV2({
  id: identifiantV2(338, "chai-de-nuit"), concept: "c-338-chai-de-nuit", name: "Chai de nuit", family: FAM,
  description: "Pour une cave à vins : mosaïque de cases bordeaux à angles droits, une grande case de bienvenue avec les rayons, trois petites (horaires, adresse, signature). Les cases se soulèvent au survol.",
  tags: ["cave à vins", "caviste", "mosaïque", "sombre", "bordeaux", "champagne", "angles droits"],
  identity: chai, racine: racineDe("#1f0b12"),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, OR = "#e3b565", SURF = "#2f121d", SURV = { backgroundColor: "#421a29", transform: { y: -4 } };
    const phrase = G.geant(`<p>Les belles bouteilles<br><span style="color:${OR}">se partagent.</span></p>`, { taille: [44, 96], tablette: { taille: [64, 84] }, mobile: { taille: [44, 60] }, lh: 1.02, suivi: "-0.015em", poids: "600", police: S.head, couleur: S.fg })(k, env);
    const mot = texte(k, "Un conseil, une carafe, un cadeau à emballer : passez au comptoir, on vous guide sans jargon.", { taille: 17, couleur: S.mute, max: "480px", lh: 1.65 });
    const rayons = k.row([["Vins", "/catalogue"], ["Bières", "/catalogue"], ["Spiritueux", "/catalogue"], ["Coffrets", "/catalogue"]].map(([t, u]) => lien(k, t, u, { taille: 17, poids: "700", couleur: OR, soulign: true, padH: "2px", survol: { color: "#ffffff", transform: { x: 4 } }, focus: "#ffffff" })), { ...GK.gaps("0px 26px"), alignItems: "center" });
    const grande = case_(k, [caps(k, "Cave et dégustations", { couleur: OR }), phrase, mot, trait(k, "#e3b56555"), rayons], { fond: SURF, pad: "44px", gap: "24px", poids: 7, min: "300px", justifie: "space-between", survol: { backgroundColor: "#3a1624" } });
    const tH = case_(k, [caps(k, "Horaires", { couleur: OR }), horaires(k, { taille: 15 })], { fond: SURF, pad: "26px", min: "200px", survol: SURV });
    const tC = case_(k, [caps(k, "Nous trouver", { couleur: OR }), coordonnees(k, { taille: 15, lien: S.fg, survol: OR, focus: OR })], { fond: SURF, pad: "26px", min: "200px", survol: SURV });
    const sig = k.T("<p>Le Chai Noir</p>", { fontFamily: S.head, fontSize: "fluid:30-44", fontWeight: "600", fontStyle: "italic", color: OR, lineHeight: 1.05 });
    const tS = case_(k, [sig, G.reseauxTexte(RES, { taille: 15, poids: "700", couleur: S.fg, survol: OR, focus: OR })(k, env)], { fond: "#150609", cadre: "1px", cadreCouleur: "#e3b56566", pad: "26px", justifie: "center", survol: { transform: { y: -4 }, backgroundColor: "#2a0f19" } });
    const duo = G.ligne(k, [tH, tC], { gap: "12px", aligne: "stretch", largeur: "100%" });
    const petites = G.colonne(k, [duo, tS], { poids: 5, min: "280px", gap: "12px", aligne: "stretch" });
    const mosaique = G.bande(k, [grande, petites], { fond: "#1f0b12", gap: "12px", aligne: "stretch", padV: ["56px", "44px", "28px"], padB: ["12px", "12px", "12px"], padH: ["32px", "24px", "16px"], nom: "Mosaïque" });
    const mentions = G.bande(k, [sansCookies(k, env, G)], { fond: "#1f0b12", colonne: true, padV: ["28px", "24px", "20px"], padB: ["24px", "20px", "16px"], padH: ["32px", "24px", "16px"], nom: "Mentions" });
    return [G.racine(k, [mosaique, mentions])];
  },
}, FAM);

// ═══ ft2-339 « Mousse haute » — bandeau d'inscription XXL + colonne de liens étroite (F), brasserie ═════════════════════════════════════════════
const mousse = identite({
  key: "c339", label: "Jaune houblon et anthracite", humeur: "dark",
  fond: "#1a1a17", texte: "#f4efe2", discret: "#c9c4b4", accent: "#f4b400", surface: "#262620", encre: "#1a1405", surEncre: "#f4efe2",
  police: "font.archivo", titres: "font.anton", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#f4efe233",
});
const mousseHaute = modeleV2({
  id: identifiantV2(339, "mousse-haute"), concept: "c-339-mousse-haute", name: "Mousse haute", family: FAM,
  description: "Pour une brasserie : un énorme bandeau jaune d'inscription à la lettre en tête, puis une bande anthracite avec horaires, adresse et une seule colonne étroite de liens qui glissent au survol.",
  tags: ["brasserie", "bière", "lettre d'information", "bandeau", "jaune", "anthracite", "angles droits"],
  identity: mousse, racine: racineDe("#1a1a17"),
  widgets: ["text", "link", "emailsubscribe", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, JAUNE = "#f4b400", ENCRE = "#1a1405";
    const phrase = G.geant(`<p>Rejoins<br>la mousse.</p>`, { taille: [60, 150], tablette: { taille: [96, 130] }, mobile: { taille: [60, 96] }, lh: 0.95, suivi: "-0.005em", poids: "400", police: S.head, couleur: ENCRE, extra: { textTransform: "uppercase" } })(k, env);
    const intro = texte(k, "Nouvelles cuvées, soirées dégustation, fûts à emporter : un message à chaque brassin.", { taille: 18, couleur: ENCRE, max: "460px" });
    const form = abo(k, env, G, { titre: "La lettre du brassin", intro: "", bouton: "Je m'abonne", largeur: "480px", accent: ENCRE, texte: ENCRE, consentCouleur: ENCRE, styleTitre: { color: ENCRE, fontFamily: S.font, fontWeight: "800" }, survolBouton: "#000000", survolTexte: JAUNE });
    form.parts.button.styles.desktop = { ...form.parts.button.styles.desktop, color: JAUNE, backgroundColor: ENCRE };
    form.parts.intro.styles.desktop = { ...form.parts.intro.styles.desktop, color: ENCRE };
    form.parts.missing.styles.desktop = { ...form.parts.missing.styles.desktop, color: ENCRE };
    const g = G.colonne(k, [phrase, intro], { poids: 7, min: "300px", gap: "20px" });
    const d = G.colonne(k, [form], { poids: 5, min: "290px", soi: "flex-end" });
    const banniere = G.bande(k, [g, d], { fond: JAUNE, gap: "40px 64px", aligne: "flex-end", padV: ["96px", "72px", "52px"], padB: ["88px", "64px", "48px"], padH: ["48px", "32px", "20px"], nom: "Bandeau" });
    const nom = k.T("<p>Houblon &amp; Fils</p>", { fontFamily: S.head, fontSize: "fluid:32-52", textTransform: "uppercase", color: S.fg, lineHeight: 1.05, letterSpacing: "0.01em" });
    const infos = G.ligne(k, [G.colonne(k, [caps(k, "Horaires", { couleur: JAUNE }), horaires(k, { taille: 15 })], { poids: 1, min: "220px" }), G.colonne(k, [caps(k, "Brasserie", { couleur: JAUNE }), coordonnees(k, { taille: 15, lien: S.fg, survol: JAUNE, focus: JAUNE })], { poids: 1, min: "220px" })], { gap: "32px", aligne: "flex-start", largeur: "100%" });
    const gauche = G.colonne(k, [nom, infos], { poids: 8, min: "300px", gap: "32px" });
    const L = [["Blondes", "/catalogue"], ["Ambrées et brunes", "/catalogue"], ["Fûts et location", "/catalogue"], ["Visite de la brasserie", "/catalogue"], ["La boutique", "/boutique"]];
    const colonne = G.colonne(k, [caps(k, "Dans la cave", { couleur: JAUNE }), ...L.map(([t, u]) => lien(k, t, u, { taille: 17, poids: "700", couleur: S.fg, bloc: true, survol: { color: JAUNE, transform: { x: 8 } }, focus: JAUNE, extra: { width: "100%" } }))], { poids: 3, min: "200px", gap: "0px", extra: { maxWidth: "280px" } });
    const bas = G.bande(k, [gauche, colonne], { fond: "#1a1a17", gap: "48px 72px", aligne: "flex-start", padV: ["64px", "52px", "40px"], padB: ["16px", "16px", "12px"], padH: ["48px", "32px", "20px"], nom: "Cave" });
    const mentions = G.bande(k, [trait(k, S.line), sansCookies(k, env, G)], { fond: "#1a1a17", colonne: true, gap: "20px", padV: ["16px", "16px", "12px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Mentions" });
    return [G.racine(k, [banniere, bas, mentions])];
  },
}, FAM);

// ═══ ft2-340 « Damier du comptoir » — grille de huit cases égales (C), spiritueux ═════════════════════════════════════════════════════════════
const damier = identite({
  key: "c340", label: "Papier, encre et vert bouteille", humeur: "light",
  fond: "#efe9dc", texte: "#111111", discret: "#46463f", accent: "#0f5c4d", surface: "#e2dac6", encre: "#111111", surEncre: "#efe9dc",
  police: "font.dm-mono", titres: "font.league-gothic", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#11111133",
});
const damierComptoir = modeleV2({
  id: identifiantV2(340, "damier-du-comptoir"), concept: "c-340-damier-du-comptoir", name: "Damier du comptoir", family: FAM,
  description: "Pour une boutique de spiritueux : huit cases égales à filets noirs, quatre rayons, horaires, adresse, retrait en cave et conseils. Chaque case est un lien ou une information et se remplit de vert au survol.",
  tags: ["spiritueux", "whisky", "rhum", "damier", "grille", "papier", "vert bouteille", "angles droits"],
  identity: damier, racine: racineDe("#efe9dc"),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, PAPIER = "#efe9dc", ENCRE = "#111111", VERT = "#0f5c4d";
    const caseRayon = (t, u, sous) => {
      const n = lien(k, t, u, { taille: 44, police: S.head, poids: "400", casse: "uppercase", couleur: ENCRE, bloc: true, lh: 1, h: "56px", survol: { color: "#ffffff", transform: { x: 6 } }, focus: VERT, extra: { width: "100%", letterSpacing: "0.02em" } });
      return case_(k, [caps(k, sous, { couleur: S.mute, suivi: "0.12em", taille: "11px" }), n], { fond: PAPIER, pad: "22px", h: "168px", justifie: "space-between", min: "160px", survol: { backgroundColor: VERT } });
    };
    const caseInfo = (titre, enfant) => case_(k, [caps(k, titre, { couleur: VERT }), enfant], { fond: PAPIER, pad: "22px", h: "168px", min: "160px" });
    const l1 = k.row([caseRayon("Whiskys", "/catalogue", "Rayon"), caseRayon("Rhums", "/catalogue", "Rayon"), caseRayon("Gins et vodkas", "/catalogue", "Rayon"), caseRayon("Cognacs", "/catalogue", "Rayon")], { gap: "2px", flexWrap: "wrap", alignItems: "stretch", width: "100%" });
    const l2 = k.row([caseInfo("Horaires", horaires(k, { taille: 13 })), caseInfo("Adresse", coordonnees(k, { taille: 13, lien: ENCRE, survol: VERT, focus: VERT })), caseRayon("Retrait en cave", "/catalogue", "Service"), caseRayon("Conseils", "/catalogue", "Dégustation")], { gap: "2px", flexWrap: "wrap", alignItems: "stretch", width: "100%" });
    const grille = k.col([l1, l2], { gap: "2px", backgroundColor: ENCRE, paddingTop: "2px", paddingBottom: "2px", paddingLeft: "2px", paddingRight: "2px", width: "100%" });
    const haut = G.ligne(k, [k.T("<p>Cave des Quatre Vents</p>", { fontFamily: S.head, fontSize: "fluid:28-40", textTransform: "uppercase", color: ENCRE, lineHeight: 1 }), G.reseauxTexte(RES, { taille: 14, poids: "500", couleur: ENCRE, survol: VERT, focus: VERT })(k, env)], { justifie: "space-between", aligne: "center", gap: "8px 24px", largeur: "100%" });
    const intro = G.ligne(k, [texte(k, "Un rayon, une question, un cadeau : choisissez une case.", { taille: 14, couleur: S.mute, max: "420px" }), lien(k, "Toute la cave", "/catalogue", { taille: 14, poids: "700", couleur: ENCRE, soulign: true, survol: { color: VERT, transform: { x: 4 } }, focus: VERT })], { justifie: "space-between", gap: "8px 24px", largeur: "100%" });
    const corps = G.bande(k, [haut, intro, grille], { fond: PAPIER, colonne: true, gap: "20px", padV: ["56px", "44px", "32px"], padB: ["20px", "20px", "16px"], padH: ["32px", "24px", "16px"], nom: "Damier" });
    const mentions = G.bande(k, [sansCookies(k, env, G)], { fond: PAPIER, colonne: true, padV: ["8px", "8px", "8px"], padB: ["24px", "20px", "16px"], padH: ["32px", "24px", "16px"], nom: "Mentions" });
    return [G.racine(k, [corps, mentions])];
  },
}, FAM);

// ═══ ft2-341 « Sommaire des vignes » — index en lignes pleine largeur (G), vins ═══════════════════════════════════════════════════════════════
const sommaire = identite({
  key: "c341", label: "Crème et lie-de-vin", humeur: "light",
  fond: "#f3ede1", texte: "#2a1015", discret: "#5c4247", accent: "#7a1f2b", surface: "#e9dfcd", encre: "#2a1015", surEncre: "#f3ede1",
  police: "font.manrope", titres: "font.cormorant-garamond", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#2a101533",
});
const sommaireDesVignes = modeleV2({
  id: identifiantV2(341, "sommaire-des-vignes"), concept: "c-341-sommaire-des-vignes", name: "Sommaire des vignes", family: FAM,
  description: "Pour un caviste : un sommaire en grandes lignes pleine largeur (rouges, blancs, bulles, liquoreux, coffrets), chaque ligne se remplit de lie-de-vin au survol, puis horaires et adresse en bas.",
  tags: ["vin", "caviste", "sommaire", "index", "crème", "lie-de-vin", "typographie", "angles droits"],
  identity: sommaire, racine: racineDe("#f3ede1"),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, VIN = "#7a1f2b", CREME = "#f3ede1", ENCRE = "#2a1015";
    const haut = G.ligne(k, [caps(k, "Sommaire de la cave", { couleur: VIN, suivi: "0.2em" }), texte(k, "Cave des Terrasses", { taille: 15, couleur: S.mute, poids: "700" })], { justifie: "space-between", gap: "8px 24px", largeur: "100%" });
    const rangee = (t, u) => lien(k, t, u, { taille: 16, police: S.head, poids: "500", couleur: ENCRE, bloc: true, h: "92px", lh: 1.05, survol: { backgroundColor: VIN, color: CREME, paddingLeft: "28px" }, focus: ENCRE, extra: { width: "100%", fontSize: "fluid:32-72", fontStyle: "italic", transitionDuration: 360, borderStyle: "solid", borderWidth: "0px", borderTopWidth: "1px", borderColor: "#2a101555" } });
    const liste = k.col([["Rouges de garde", "/catalogue"], ["Blancs et rosés", "/catalogue"], ["Bulles et champagnes", "/catalogue"], ["Liquoreux et vins doux", "/catalogue"], ["Coffrets et cadeaux", "/catalogue"]].map(([t, u]) => rangee(t, u)), { gap: "0px", width: "100%" });
    const index = G.bande(k, [haut, liste], { fond: CREME, colonne: true, gap: "20px", padV: ["72px", "56px", "40px"], padB: ["0px", "0px", "0px"], padH: ["48px", "32px", "20px"], nom: "Sommaire" });
    const info = G.ligne(k, [G.colonne(k, [caps(k, "Horaires", { couleur: VIN }), horaires(k, { taille: 15 })], { poids: 1, min: "220px" }), G.colonne(k, [caps(k, "Adresse", { couleur: VIN }), coordonnees(k, { taille: 15, lien: ENCRE, survol: VIN, focus: VIN })], { poids: 1, min: "220px" }), G.colonne(k, [caps(k, "Suivre la cave", { couleur: VIN }), G.reseauxTexte(RES, { taille: 15, poids: "700", couleur: ENCRE, survol: VIN, focus: VIN })(k, env)], { poids: 1, min: "200px" })], { gap: "32px 48px", aligne: "flex-start", largeur: "100%" });
    const bas = G.bande(k, [trait(k, "#2a101555"), info, trait(k, S.line), sansCookies(k, env, G)], { fond: CREME, colonne: true, gap: "28px", padV: ["36px", "32px", "28px"], padB: ["28px", "24px", "20px"], padH: ["48px", "32px", "20px"], nom: "Infos" });
    return [G.racine(k, [index, bas])];
  },
}, FAM);

// ═══ ft2-342 « Tourbe et fût » — nom monumental seul au centre (B), whisky ═══════════════════════════════════════════════════════════════════
const tourbe = identite({
  key: "c342", label: "Noir de tourbe et cuivre", humeur: "dark",
  fond: "#15110d", texte: "#efe3cf", discret: "#c1b095", accent: "#c98a4b", surface: "#211a13", encre: "#15110d", surEncre: "#efe3cf",
  police: "font.ibm-plex-mono", titres: "font.abril-fatface", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#efe3cf33",
});
const tourbeEtFut = modeleV2({
  id: identifiantV2(342, "tourbe-et-fut"), concept: "c-342-tourbe-et-fut", name: "Tourbe et fût", family: FAM,
  description: "Pour une distillerie ou une cave à whiskies : un nom monumental centré dans un grand vide noir, un carré de cuivre qui respire, trois liens et la ligne légale. Presque rien, mais tout de suite une marque.",
  tags: ["whisky", "distillerie", "monogramme", "nom monumental", "noir", "cuivre", "minimal", "angles droits"],
  identity: tourbe, racine: racineDe("#15110d"),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S, CUIVRE = "#c98a4b";
    const carre = souffle(k.col([], { width: "14px", height: "14px", backgroundColor: CUIVRE, borderRadius: "0px", flexShrink: 0 }), 3600);
    const nom = G.geant(`<p>TOURBE</p>`, { taille: [64, 200], tablette: { taille: [110, 150] }, mobile: { taille: [60, 84] }, lh: 0.95, suivi: "0.02em", poids: "400", police: S.head, couleur: S.fg, align: "center" })(k, env, true);
    const sous = caps(k, "Single malt &nbsp;·&nbsp; fût de chêne", { couleur: CUIVRE, suivi: "0.3em", extra: { textAlign: "center" } });
    const filet = G.filet({ largeur: "72px", epaisseur: "2px", couleur: CUIVRE })(k, env, true);
    const lienV = (t, u) => lien(k, t, u, { taille: 15, poids: "500", couleur: S.fg, casse: "uppercase", suivi: "0.16em", survol: { color: CUIVRE, transform: { x: 6 } }, focus: CUIVRE });
    const colL = G.colonne(k, [caps(k, "La maison", { couleur: CUIVRE }), lienV("La cave", "/catalogue"), lienV("Visites", "/catalogue"), lienV("Contact", "/contact")], { poids: 1, min: "200px", gap: "0px", aligne: "flex-start" });
    const colA = G.colonne(k, [caps(k, "Nous trouver", { couleur: CUIVRE }), coordonnees(k, { taille: 14, couleur: S.mute, lien: S.fg, survol: CUIVRE, focus: CUIVRE })], { poids: 1, min: "200px", gap: "12px", aligne: "flex-start" });
    const deux = G.ligne(k, [colL, colA], { gap: "32px 96px", aligne: "flex-start", justifie: "center", largeur: "100%" });
    deux.styles.desktop = { ...deux.styles.desktop, maxWidth: "640px", marginLeft: "auto", marginRight: "auto" };
    const centre = G.bande(k, [k.col([carre, nom, sous, filet], { gap: "28px", alignItems: "center", width: "100%" }), deux], { fond: "#15110d", colonne: true, aligne: "stretch", gap: "96px", padV: ["168px", "120px", "88px"], padB: ["96px", "72px", "56px"], padH: ["32px", "24px", "16px"], nom: "Marque" });
    const mentions = G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true })(k, env, true)], { fond: "#15110d", colonne: true, padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: ["32px", "24px", "16px"], nom: "Mentions" });
    return [G.racine(k, [centre, mentions])];
  },
}, FAM);

// ═══ ft2-343 « Barre de comptoir » — ligne unique compacte (D), cidrerie ═════════════════════════════════════════════════════════════════════
const barre = identite({
  key: "c343", label: "Rouge coquelicot et blanc", humeur: "dark",
  fond: "#c8281c", texte: "#ffffff", discret: "#ffe9e6", accent: "#fff3c4", surface: "#a81f15", encre: "#c8281c", surEncre: "#ffffff",
  police: "font.dm-sans", titres: "font.syne", rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "700", bordure: "0px", ligne: "#ffffff55",
});
const barreDeComptoir = modeleV2({
  id: identifiantV2(343, "barre-de-comptoir"), concept: "c-343-barre-de-comptoir", name: "Barre de comptoir", family: FAM,
  description: "Pour une cidrerie ou un bar à bières : tout tient sur une barre rouge d'une ou deux lignes (nom, liens, bouton Commander) et la ligne légale. Compact, franc, efficace.",
  tags: ["cidre", "bière", "barre", "compact", "rouge", "une ligne", "angles droits"],
  identity: barre, racine: racineDe("#c8281c"),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S, ROUGE = "#c8281c";
    const point = souffle(k.col([], { width: "12px", height: "12px", backgroundColor: "#ffffff", borderRadius: "0px", flexShrink: 0 }), 2600);
    const nom = k.row([point, k.T("<p>Pomme-Rouge</p>", { fontFamily: S.head, fontSize: "24px", fontWeight: "800", color: "#ffffff", lineHeight: 1.1, letterSpacing: "-0.01em" })], { gap: "12px", alignItems: "center", flexWrap: "nowrap" });
    const liens = k.row([["Cidres", "/catalogue"], ["Bières", "/catalogue"], ["Cadeaux", "/catalogue"], ["Contact", "/contact"]].map(([t, u]) => lien(k, t, u, { taille: 16, poids: "700", couleur: "#ffffff", padH: "6px", survol: { color: "#fff3c4", textDecoration: "underline", transform: { y: -2 } }, focus: "#ffffff" })), { ...GK.gaps("0px 18px"), alignItems: "center" });
    const bt = lien(k, "Commander", "/boutique", { taille: 16, poids: "800", casse: "uppercase", suivi: "0.1em", couleur: ROUGE, h: "64px", padH: "40px", survol: { backgroundColor: "#fff3c4", color: "#7a120b" }, focus: "#111111", extra: { backgroundColor: "#ffffff", justifyContent: "center", alignSelf: "stretch", minHeight: "72px" } });
    const gauche = k.row([nom, liens], { ...GK.gaps("12px 40px"), alignItems: "center", flexGrow: 1 });
    const corpsBarre = k.row([k.col([gauche], { flexGrow: 1, justifyContent: "center", paddingTop: "12px", paddingBottom: "12px", paddingLeft: "40px", paddingRight: "24px" }), bt], { gap: "0px", alignItems: "stretch", flexWrap: "wrap", width: "100%" });
    const ligne1 = { type: "container", props: { full: true }, name: "Barre", children: [corpsBarre], ...A.sty({ display: "flex", flexDirection: "column", width: "100%", backgroundColor: ROUGE, gap: "0px", paddingTop: "0px" }) };
    const ligne2 = G.bande(k, [G.reseauxTexte(RES, { taille: 14, poids: "700", couleur: "#ffffff", survol: "#fff3c4", focus: "#ffffff" })(k, env), coordonnees(k, { taille: 14, couleur: "#ffffff", lien: "#ffffff", survol: "#fff3c4", focus: "#ffffff", align: "left" }), sansCookies(k, env, G, { liens: "#ffffff", couleur: "#ffe9e6" })], { fond: ROUGE, gap: "8px 32px", aligne: "center", padV: ["8px", "8px", "8px"], padB: ["24px", "20px", "16px"], padH: ["40px", "28px", "20px"], nom: "Mentions" });
    return [G.racine(k, [ligne1, ligne2])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Cave, bières et spiritueux", target: 6, built: true,
  description: "Pieds de caves, brasseries, distilleries et cidreries : mosaïque, bandeau XXL, damier, sommaire, nom monumental, barre unique.",
  models: [chaiDeNuit, mousseHaute, damierComptoir, sommaireDesVignes, tourbeEtFut, barreDeComptoir],
};
