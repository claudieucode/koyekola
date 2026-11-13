// Famille v2 « Édition et librairie » — 6 modèles (ft2-362 à ft2-367), pieds « inspirés de captures » : ANGLES DROITS partout (aucun border-radius non nul).
// Idées de composition reprises des captures (marque monumentale rognée, colonne de marque, grille de colonnes sur aplat gris), traduites sans copie : autres marques fictives, autres couleurs, autres proportions.
// Six ARCHÉTYPES différents (DIVERSITE_STRICTE.md) : A colonne latérale, B nom monumental, G index en lignes, J papier à en-tête, H mosaïque asymétrique, E deux demi-pages.
// Marques fictives (Maison Verso, Épilogue, Éditions Marge, Alinéa, Rayonnage, Page Double) ; AUCUNE coordonnée, horaire ni chiffre inventé : horaires, adresse et téléphone viennent des Données de l'entreprise (sans données, les widgets restent sobres).
// Rubriques (Romans, Essais, Poésie…) = intitulés d'EXEMPLE à renommer ; adresses de réseaux = exemples. Polices : bibliothèque locale, 2 au plus par modèle.
//
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; UNE animation visible par modèle (carré qui « respire », ligne qui se remplit, case qui se soulève, flèche qui glisse).
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const { DOUX, racineDe, lien, caps, texte, trait, souffle, carre, horaires, coordonnees, bloc, abonnement, bouton, PH } = require("../aides-inspire");

const FAM = "edition-librairie";
const MENTIONS = (G, k, env, o = {}) => G.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-362 « Marque-page » — maison d'édition et librairie (archétype A : colonne latérale pleine hauteur)
// Idée (capture « logo + colonnes »): une COLONNE DE MARQUE bordeaux pleine hauteur à gauche (monogramme, phrase, lettre), et à droite une grande zone crème en trois colonnes (catalogue, librairie, maison). Carré doré qui « respire ».
const bordeaux = identite({
  key: "i362", label: "Bordeaux, crème et or", humeur: "light",
  fond: "#f8f0e2", texte: "#2a0d14", discret: "#5a4a4d", accent: "#6b1b2a", surface: "#efe4d0", encre: "#6b1b2a", surEncre: "#f8f0e2",
  police: "font.hanken-grotesk", titres: "font.cormorant-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#2a0d1433",
});
const BORD = "#6b1b2a", CREME = "#f8f0e2", OR = "#e3b95f", ENCRE1 = "#2a0d14";
const marquePage = modeleV2({
  id: identifiantV2(362, "marque-page"), concept: "c-362-marque-page", name: "Marque-page", family: FAM,
  description: "Pour une maison d'édition et sa librairie : colonne de marque bordeaux pleine hauteur (monogramme, phrase, lettre d'information) et grande zone crème en trois colonnes : catalogue, horaires de la librairie, la maison.",
  tags: ["maison d'édition", "librairie", "colonne latérale", "bordeaux", "crème", "lettre d'information", "angles droits"],
  identity: bordeaux, racine: racineDe(CREME),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const mono = G.geant(`<p>Maison<br><em>Verso</em></p>`, { taille: [56, 96], tablette: { taille: [64, 88] }, mobile: { taille: [56, 72] }, lh: 0.95, suivi: "-0.01em", poids: "500", police: S.head, couleur: CREME })(k, env);
    const abo = abonnement(k, env, { titre: "La lettre de la maison", intro: "Parutions, rencontres, coups de cœur : un message de temps en temps.", bouton: "Je m'abonne", largeur: "320px", accent: OR, texte: CREME, couleurTitre: OR, couleurIntro: "#e3cfc6", texteBouton: ENCRE1, survolBouton: CREME, survolTexte: BORD });
    const lateral = G.colonne(k, [souffle(carre(k, OR, "14px"), 3600), mono, texte(k, "Éditeur et libraire indépendant : des livres choisis, des lecteurs accompagnés.", { taille: 16, couleur: "#e3cfc6", largeur: "300px" }), abo], { poids: 0, base: "340px", min: "280px", gap: "28px", extra: { backgroundColor: BORD, paddingTop: "64px", paddingBottom: "56px", paddingLeft: "40px", paddingRight: "36px", boxSizing: "border-box" }, mobile: { paddingTop: "40px", paddingLeft: "20px", paddingRight: "20px", paddingBottom: "40px" } });
    const lk = (t, u) => lien(k, t, u, { taille: 17, poids: "500", couleur: ENCRE1, survol: { color: BORD, transform: { x: 5 } }, focus: BORD });
    const tt = { couleurTitre: BORD, police: S.head, tailleTitre: "20px", suiviTitre: "0em", casse: false };
    const c1 = bloc(k, "Catalogue", ["Nouveautés", "Romans", "Essais", "Poésie", "Jeunesse"].map((t) => lk(t, "/catalogue")), { ...tt, gap: "0px" });
    const c2 = bloc(k, "La librairie", [horaires(k, { couleur: ENCRE1, taille: 15 })], { ...tt, min: "220px", poids: 1.3 });
    const c3 = bloc(k, "La maison", [lk("Auteurs", "/blog"), lk("Actualités", "/blog"), lk("Questions", "/faq"), coordonnees(k, { couleur: ENCRE1, lien: ENCRE1, survol: BORD, focus: BORD })], { ...tt, gap: "0px", min: "220px" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, poids: "600", couleur: ENCRE1, survol: BORD, focus: BORD })(k, env);
    const principal = G.colonne(k, [G.ligne(k, [c1, c2, c3], { gap: "36px 40px", aligne: "flex-start", largeur: "100%", justifie: "space-between" }), trait(k, "#2a0d1440"), reseaux], { poids: 1, min: "300px", gap: "36px", extra: { paddingTop: "64px", paddingBottom: "40px", paddingLeft: "56px", paddingRight: "48px", boxSizing: "border-box", justifyContent: "space-between" }, mobile: { paddingTop: "36px", paddingLeft: "20px", paddingRight: "20px", paddingBottom: "28px" } });
    const corps = G.bande(k, [lateral, principal], { fond: CREME, gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Marque et rubriques" });
    const bas = G.bande(k, [MENTIONS(G, k, env, { couleur: "#4a3a3d", liens: ENCRE1 })], { fond: CREME, colonne: true, padV: ["20px", "20px", "18px"], padB: ["20px", "20px", "18px"], padH: PH, filetHaut: { epaisseur: "1px", couleur: "#2a0d1433" }, nom: "Mentions" });
    return [G.racine(k, [corps, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-363 « Épilogue » — maison d'édition de romans et de poésie (archétype B : nom monumental, presque rien d'autre)
// Idée (captures « marque monumentale ») : un grand vide vert très sombre, le nom « Épilogue » géant, rogné par le bas, et seulement trois liens. Un carré pistache « respire » devant la phrase.
const sombreVert = identite({
  key: "i363", label: "Vert nuit et pistache", humeur: "dark",
  fond: "#0f2a22", texte: "#e9f5dc", discret: "#b7cdb9", accent: "#d3f0b4", surface: "#0a1d17", encre: "#0f2a22", surEncre: "#e9f5dc",
  police: "font.inter-tight", titres: "font.instrument-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#e9f5dc33",
});
const VN = "#0f2a22", VN2 = "#0a1d17", PIST = "#d3f0b4";
const epilogue = modeleV2({
  id: identifiantV2(363, "epilogue"), concept: "c-363-epilogue", name: "Épilogue", family: FAM,
  description: "Pour une petite maison d'édition : un grand vide vert nuit, le nom géant rogné par le bas et seulement trois liens. Presque rien, mais tout est dit. Vert nuit et pistache, Instrument Serif.",
  tags: ["maison d'édition", "nom monumental", "minimal", "vert nuit", "pistache", "angles droits"],
  identity: sombreVert, racine: racineDe(VN2),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = k.row([souffle(carre(k, PIST, "12px"), 3400), caps(k, "Éditeur de romans et de poésie", { couleur: PIST, suivi: "0.22em" })], { gap: "14px", alignItems: "center", flexWrap: "nowrap" });
    const lk = (t, u) => lien(k, t, u, { taille: 17, poids: "500", couleur: "#e9f5dc", padH: "14px", survol: { backgroundColor: PIST, color: VN, transform: { y: -2 } }, focus: PIST });
    const nav = k.row([lk("Catalogue", "/catalogue"), lk("Soumettre un manuscrit", "/contact"), lk("Contact", "/contact")], { gap: "4px", alignItems: "center" });
    const entete = G.bande(k, [phrase, nav], { fond: VN, gap: "16px 32px", aligne: "center", padV: ["40px", "32px", "28px"], padB: ["12px", "12px", "12px"], padH: PH, nom: "Phrase et liens" });
    const mentions = G.bande(k, [MENTIONS(G, k, env)], { fond: VN, colonne: true, padV: ["0px", "0px", "0px"], padB: ["120px", "90px", "48px"], padH: PH, nom: "Mentions" });
    const nom = G.nomRogne("Épilogue", { taille: [56, 200], visible: 1, poids: "400", suivi: "-0.035em", couleur: PIST })(k);
    const monument = G.bande(k, [nom], { fond: VN, colonne: true, padV: ["0px", "0px", "0px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Nom monumental" });
    return [G.racine(k, [entete, mentions, monument])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-364 « Table des matières » — éditeur d'essais (archétype G : index en lignes pleine largeur, sans cartes)
// Idée : le pied EST une table des matières : chaque rubrique est une ligne pleine largeur (numéro, grand titre, précision, flèche) séparée par un filet ; au survol la ligne se remplit de jaune et le titre glisse.
const encre = identite({
  key: "i364", label: "Blanc, noir et jaune", humeur: "light",
  fond: "#ffffff", texte: "#111111", discret: "#4f4f4f", accent: "#111111", surface: "#f4f4f1", encre: "#111111", surEncre: "#ffffff",
  police: "font.ibm-plex-sans", titres: "font.newsreader",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#11111133",
});
const JAUNE = "#ffd400";
const tableMatieres = modeleV2({
  id: identifiantV2(364, "table-des-matieres"), concept: "c-364-table-des-matieres", name: "Table des matières", family: FAM,
  description: "Pour un éditeur d'essais : le pied est une table des matières. Six rubriques en lignes pleine largeur (numéro, grand titre, précision, flèche) qui se remplissent de jaune au survol. Blanc, noir et jaune, Newsreader.",
  tags: ["éditeur d'essais", "sommaire", "index", "lignes", "noir et blanc", "jaune", "angles droits"],
  identity: encre, racine: racineDe("#ffffff"),
  widgets: ["text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const ligneIdx = (num, titre, note, url) => {
      const t = lien(k, titre, url, { taille: 38, poids: "500", police: S.head, couleur: "#111111", lh: 1.1, h: "56px", survol: { color: "#111111", transform: { x: 10 } }, focus: "#111111" });
      const r = k.row([caps(k, num, { couleur: "#111111", suivi: "0.1em", extra: { minWidth: "40px" } }), t, k.col([], { flexGrow: 1, minWidth: "8px" }), texte(k, note, { taille: 15, couleur: "#4f4f4f", extra: { maxWidth: "260px" } }), caps(k, "→", { couleur: "#111111", taille: "22px", casse: false, suivi: "0" })], { alignItems: "center", rowGap: "12px", columnGap: "20px", flexWrap: "wrap", width: "100%", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "16px", paddingRight: "16px", boxSizing: "border-box", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "1px", borderColor: "#11111155", transitionDuration: DOUX, borderRadius: "0px" }, undefined, { paddingLeft: "0px", paddingRight: "0px" });
      r.states = { hover: { backgroundColor: JAUNE } };
      return r;
    };
    const rubriques = [["01", "Nouveautés", "Les derniers titres parus", "/catalogue"], ["02", "Essais", "Sciences humaines et idées", "/catalogue"], ["03", "Auteurs", "Qui écrit pour la maison", "/blog"], ["04", "Librairie", "Commander, retirer, être conseillé", "/contact"], ["05", "Rencontres", "Lectures, débats, signatures", "/blog"], ["06", "Contact", "Écrire à l'équipe", "/contact"]];
    const tete = k.row([caps(k, "Sommaire", { couleur: "#111111", suivi: "0.24em" }), texte(k, "Maison Marge — essais et idées", { taille: 15, couleur: "#4f4f4f", police: S.head, extra: { fontStyle: "italic" } })], { justifyContent: "space-between", alignItems: "baseline", width: "100%", rowGap: "8px", columnGap: "24px", paddingBottom: "18px", borderStyle: "solid", borderWidth: "0px", borderBottomWidth: "3px", borderColor: "#111111", boxSizing: "border-box" });
    const liste = G.colonne(k, [tete, ...rubriques.map((r) => ligneIdx(...r))], { gap: "0px", extra: { width: "100%" }, poids: 1 });
    const haut = G.bande(k, [liste], { fond: "#ffffff", colonne: true, padV: ["72px", "56px", "40px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Sommaire" });
    const reseaux = G.reseauxTexte([["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["YouTube", "https://www.youtube.com/"]], { taille: 15, poids: "600", couleur: "#111111", survol: "#111111", focus: "#111111" })(k, env);
    const bas = G.bande(k, [reseaux, MENTIONS(G, k, env, { couleur: "#4f4f4f", liens: "#111111" })], { fond: "#ffffff", colonne: true, gap: "6px", padV: ["12px", "12px", "12px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-365 « Papier d'Alinéa » — librairie-papeterie (archétype J : cartouche centré, filets doubles, liens en ligne centrée)
// Idée : le pied est un PAPIER À EN-TÊTE ivoire : double filet, nom « Alinéa » centré en Cardo entre horaires et adresse (Données de l'entreprise), une seule ligne de rubriques centrée, double filet de clôture.
const papier = identite({
  key: "i365", label: "Ivoire et bleu marine", humeur: "light",
  fond: "#f3ecdc", texte: "#1c2a4a", discret: "#50597a", accent: "#1c2a4a", surface: "#e9e0cc", encre: "#1c2a4a", surEncre: "#f3ecdc",
  police: "font.lato", titres: "font.cardo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "0px", ligne: "#1c2a4a55",
});
const IVOIRE = "#f3ecdc", MARINE = "#1c2a4a";
const alinea = modeleV2({
  id: identifiantV2(365, "papier-d-alinea"), concept: "c-365-papier-d-alinea", name: "Papier d'Alinéa", family: FAM,
  description: "Pour une librairie-papeterie : un papier à en-tête ivoire, double filet, nom centré en Cardo, cartouche à trois volets (horaires, nom, adresse) et une ligne de rubriques. Sans lettre. Ivoire et bleu marine.",
  tags: ["librairie", "papeterie", "papier à en-tête", "double filet", "centré", "ivoire", "marine", "angles droits"],
  identity: papier, racine: racineDe(IVOIRE),
  widgets: ["text", "link", "bizhours", "bizcontact", "copyright", "bizlegal", "divider"],
  compose(k, env, G) {
    const S = k.S;
    const doubleFilet = () => k.col([trait(k, MARINE, "3px"), trait(k, MARINE, "1px")], { gap: "4px", width: "100%" });
    const nom = G.geant(`<p>Alinéa</p>`, { taille: [64, 132], tablette: { taille: [72, 110] }, mobile: { taille: [64, 84] }, lh: 1, suivi: "0.04em", poids: "400", police: S.head, couleur: MARINE, align: "center" })(k, env);
    const sous = caps(k, "Librairie · Papeterie", { couleur: MARINE, suivi: "0.3em", extra: { textAlign: "center" } });
    const centre = G.colonne(k, [souffle(carre(k, MARINE, "10px"), 3800), nom, sous], { poids: 2, min: "260px", aligne: "center", gap: "12px", extra: { textAlign: "center" } });
    const cote = (titre, enfant) => G.colonne(k, [caps(k, titre, { couleur: "#50597a", suivi: "0.22em", extra: { textAlign: "center" } }), enfant], { poids: 1, min: "220px", aligne: "center", gap: "10px", extra: { textAlign: "center" } });
    const gauche = cote("Horaires", horaires(k, { couleur: MARINE, taille: 15, align: "center" }));
    const droite = cote("Adresse", coordonnees(k, { couleur: MARINE, lien: MARINE, survol: "#50597a", focus: MARINE, taille: 15, align: "center" }));
    const cartouche = G.ligne(k, [gauche, centre, droite], { gap: "28px 32px", aligne: "center", justifie: "center", largeur: "100%" });
    const lk = (t, u) => lien(k, t, u, { taille: 15, poids: "700", casse: "uppercase", suivi: "0.12em", couleur: MARINE, padH: "14px", survol: { color: MARINE, textDecoration: "underline" }, focus: MARINE });
    const rubriques = k.row([lk("Livres", "/catalogue"), lk("Papeterie", "/boutique"), lk("Commander", "/contact"), lk("Questions", "/faq"), lk("Contact", "/contact")], { gap: "0px", justifyContent: "center", alignItems: "center", width: "100%" });
    const haut = G.bande(k, [doubleFilet(), cartouche, doubleFilet(), rubriques], { fond: IVOIRE, colonne: true, aligne: "center", gap: "26px", max: "1000px", padV: ["56px", "44px", "32px"], padB: ["20px", "18px", "16px"], padH: PH, nom: "Papier à en-tête" });
    const bas = G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#50597a", liens: MARINE })(k, env, true)], { fond: IVOIRE, colonne: true, aligne: "center", max: "900px", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-366 « Rayonnage » — librairie indépendante (archétype H : mosaïque asymétrique, une grande case et trois petites)
// Idée : un RAYONNAGE de cases à angles droits. Grande case moutarde (« Lisez. » en DM Serif Display + lettre), et trois petites cases empilées : catalogue (canard), horaires (écru), contact (noir). Les cases se soulèvent au survol.
const rayon = identite({
  key: "i366", label: "Moutarde, canard et écru", humeur: "light",
  fond: "#f6f0e4", texte: "#161616", discret: "#4a4a44", accent: "#0e5c5c", surface: "#ece3d0", encre: "#161616", surEncre: "#f6f0e4",
  police: "font.karla", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#16161633",
});
const MOUT = "#e8b630", CANARD = "#0e5c5c", ECRU = "#f6f0e4", NOIRL = "#161616";
const rayonnage = modeleV2({
  id: identifiantV2(366, "rayonnage"), concept: "c-366-rayonnage", name: "Rayonnage", family: FAM,
  description: "Pour une librairie indépendante : mosaïque asymétrique de cases à angles droits, une grande case moutarde (« Lisez. » et lettre d'information) et trois petites (catalogue, horaires, contact) qui se soulèvent au survol.",
  tags: ["librairie", "mosaïque", "cases", "moutarde", "canard", "lettre d'information", "angles droits"],
  identity: rayon, racine: racineDe(ECRU),
  widgets: ["text", "link", "bizhours", "bizcontact", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const caseBase = (enfants, fond, o = {}) => { const c = k.col(enfants, { backgroundColor: fond, paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px", gap: "14px", boxSizing: "border-box", transitionDuration: DOUX, borderRadius: "0px", flexGrow: o.grow ?? 1, flexBasis: o.base || "0px", minWidth: o.min || "240px", justifyContent: o.justifie || "flex-start" }); c.states = { hover: { transform: { y: -5 } } }; return c; };
    const lisez = G.geant(`<p>Lisez.</p>`, { taille: [72, 180], tablette: { taille: [84, 150] }, mobile: { taille: [72, 96] }, lh: 0.9, suivi: "-0.02em", poids: "400", police: S.head, couleur: NOIRL })(k, env);
    const abo = abonnement(k, env, { titre: "La lettre de la librairie", intro: "Nouveautés et coups de cœur des libraires.", bouton: "S'abonner", largeur: "380px", accent: NOIRL, texte: NOIRL, couleurTitre: NOIRL, couleurIntro: "#2d2d2a", texteBouton: MOUT, survolBouton: CANARD, survolTexte: "#ffffff" });
    const grande = caseBase([souffle(carre(k, NOIRL, "14px"), 3600), lisez, texte(k, "Une librairie de quartier : conseils, commandes, rencontres.", { couleur: "#2d2d2a", taille: 17, largeur: "380px" }), abo], MOUT, { grow: 2, base: "0px", min: "300px", justifie: "space-between" });
    const lkCat = lien(k, "Catalogue →", "/catalogue", { taille: 28, poids: "400", police: S.head, couleur: "#ffffff", survol: { color: MOUT, transform: { x: 6 } }, focus: MOUT, extra: { width: "100%" } });
    const petite1 = caseBase([caps(k, "Rayons", { couleur: "#cde5e3" }), lkCat, k.row([lien(k, "Romans", "/catalogue", { couleur: "#ffffff", taille: 15, survol: { color: MOUT, textDecoration: "underline" }, focus: MOUT, padH: "0px" }), lien(k, "Essais", "/catalogue", { couleur: "#ffffff", taille: 15, survol: { color: MOUT, textDecoration: "underline" }, focus: MOUT }), lien(k, "Jeunesse", "/catalogue", { couleur: "#ffffff", taille: 15, survol: { color: MOUT, textDecoration: "underline" }, focus: MOUT })], { gap: "18px" })], CANARD, { min: "240px" });
    const petite2 = caseBase([caps(k, "Horaires", { couleur: "#4a4a44" }), horaires(k, { couleur: NOIRL, taille: 15 })], "#ffffff", { min: "240px" });
    const petite3 = caseBase([caps(k, "Nous trouver", { couleur: "#cfcfc8" }), coordonnees(k, { couleur: "#f6f0e4", lien: "#f6f0e4", survol: MOUT, focus: MOUT })], NOIRL, { min: "240px" });
    const colPetites = G.colonne(k, [petite1, petite2, petite3], { poids: 1, min: "260px", gap: "6px", aligne: "stretch", extra: { alignSelf: "stretch" } });
    const mosaique = G.bande(k, [grande, colPetites], { fond: ECRU, gap: "6px", aligne: "stretch", padV: ["56px", "44px", "32px"], padB: ["6px", "6px", "6px"], padH: PH, nom: "Mosaïque" });
    const bas = G.bande(k, [MENTIONS(G, k, env, { couleur: "#4a4a44", liens: NOIRL })], { fond: ECRU, colonne: true, padV: ["28px", "24px", "22px"], padB: ["28px", "24px", "22px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [mosaique, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-367 « Page double » — éditeur de livres d'art (archétype E : deux demi-pages bord à bord de couleurs opposées)
// Idée : un livre OUVERT. Page gauche indigo : le message en grand Fraunces. Page droite pêche : les actions (deux boutons, liste de liens, contact). Bord à bord, sans marge. Le bouton principal « respire ».
const livre = identite({
  key: "i367", label: "Indigo et pêche", humeur: "light",
  fond: "#fbe3d3", texte: "#1d1b4d", discret: "#4a4670", accent: "#1d1b4d", surface: "#f3d2bd", encre: "#1d1b4d", surEncre: "#fbe3d3",
  police: "font.public-sans", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#fbe9dc33",
});
const INDIGO = "#1d1b4d", PECHE = "#fbe3d3";
const pageDouble = modeleV2({
  id: identifiantV2(367, "page-double"), concept: "c-367-page-double", name: "Page double", family: FAM,
  description: "Pour un éditeur de livres d'art : un livre ouvert, deux demi-pages bord à bord. À gauche, indigo : le message en grand Fraunces. À droite, pêche : boutons, liens et contact. Le bouton principal respire.",
  tags: ["livres d'art", "deux demi-pages", "indigo", "pêche", "bord à bord", "angles droits"],
  identity: livre, racine: racineDe(PECHE),
  widgets: ["text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const msg = G.geant(`<p>Un livre,<br>puis un<br><em style="color:#ffb48a">autre.</em></p>`, { taille: [52, 112], tablette: { taille: [64, 96] }, mobile: { taille: [52, 72] }, lh: 1, suivi: "-0.02em", poids: "500", police: S.head, couleur: "#fbe9dc" })(k, env);
    const gauche = G.colonne(k, [caps(k, "Éditions Page Double", { couleur: "#ffb48a", suivi: "0.26em" }), msg, texte(k, "Monographies, catalogues d'exposition, livres d'artistes.", { couleur: "#d3cdea", taille: 17, largeur: "360px" })], { poids: 1, min: "300px", gap: "30px", justifie: "space-between", extra: { backgroundColor: INDIGO, paddingTop: "72px", paddingBottom: "64px", paddingLeft: "56px", paddingRight: "48px", boxSizing: "border-box" }, mobile: { paddingTop: "44px", paddingBottom: "40px", paddingLeft: "20px", paddingRight: "20px" } });
    const b1 = souffle(bouton(k, "Parcourir le catalogue", "/catalogue", { texte: PECHE, fond: INDIGO, bord: INDIGO, casse: false, suivi: "0.02em", poids: "700", survol: { backgroundColor: PECHE, color: INDIGO, transform: { y: -3 } }, focus: INDIGO, police: S.font }), 4200);
    const b2 = bouton(k, "Nous écrire", "/contact", { texte: INDIGO, bord: INDIGO, casse: false, suivi: "0.02em", poids: "700", survol: { backgroundColor: INDIGO, color: PECHE, transform: { y: -3 } }, focus: INDIGO, police: S.font });
    const lk = (t, u) => lien(k, t, u, { taille: 17, poids: "600", couleur: INDIGO, survol: { color: "#9a3b12", transform: { x: 5 } }, focus: INDIGO, extra: { width: "100%" } });
    const liste = k.col(["Nouveautés", "Monographies", "Catalogues d'exposition", "Actualités", "Questions fréquentes"].map((t, i) => k.col([lk(t, i < 3 ? "/catalogue" : i === 3 ? "/blog" : "/faq"), trait(k, "#1d1b4d33")], { gap: "0px", width: "100%" })), { gap: "0px", width: "100%" });
    const droite = G.colonne(k, [caps(k, "Page de droite", { couleur: INDIGO, suivi: "0.26em" }), k.row([b1, b2], { gap: "12px" }), liste, coordonnees(k, { couleur: INDIGO, lien: INDIGO, survol: "#9a3b12", focus: INDIGO, taille: 15 })], { poids: 1, min: "300px", gap: "28px", extra: { backgroundColor: PECHE, paddingTop: "72px", paddingBottom: "56px", paddingLeft: "56px", paddingRight: "48px", boxSizing: "border-box" }, mobile: { paddingTop: "40px", paddingBottom: "36px", paddingLeft: "20px", paddingRight: "20px" } });
    const livreBande = G.bande(k, [gauche, droite], { fond: PECHE, gap: "0px", aligne: "stretch", padV: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Deux pages" });
    const bas = G.bande(k, [MENTIONS(G, k, env, { couleur: "#4a4670", liens: INDIGO })], { fond: PECHE, colonne: true, padV: ["20px", "20px", "18px"], padB: ["20px", "20px", "18px"], padH: PH, filetHaut: { epaisseur: "1px", couleur: "#1d1b4d44" }, nom: "Mentions" });
    return [G.racine(k, [livreBande, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Édition et librairie", target: 6, built: true,
  description: "Pieds inspirés de captures, angles droits, animations fluides : maison d'édition, librairie, éditeur d'essais, papeterie, livres d'art. Six compositions : colonne latérale, nom monumental, index, papier à en-tête, mosaïque, deux demi-pages.",
  models: [marquePage, epilogue, tableMatieres, alinea, rayonnage, pageDouble],
};
