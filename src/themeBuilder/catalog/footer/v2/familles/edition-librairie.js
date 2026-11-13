// Famille v2 « Édition et librairie » — 6 modèles (ft2-362 à ft2-367), pieds « inspirés de captures », REFAITS autour de vraies illustrations dessinées (SVG) : ANGLES DROITS partout.
// Trois captures, deux partis pris chacune : « Timon » (objet 3D à côtes + cartes flottantes sur fond noir) → 362 ; « Horizon » (bande grise de colonnes + MOT GÉANT rogné) → 364, 365, 366 ;
// « Amplifyed » (halo lumineux orange + nom géant dégradé + colonnes à droite) → 363, 367. Marques fictives (Maison Verso, Épilogue, Éditions Marge, Alinéa, Rayonnage, Page Double).
// AUCUNE coordonnée, horaire ni chiffre inventé : horaires, adresse et téléphone viennent des Données de l'entreprise. Rubriques = intitulés d'EXEMPLE ; adresses de réseaux = exemples.
// MOUVEMENT (tout disparaît sous « prefers-reduced-motion: reduce ») : transitions de 360 ms ; UNE animation visible par modèle (carré qui « respire », flèche qui glisse, case qui se soulève).
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const { DOUX, Moteur, racineDe, lien, caps, texte, trait, souffle, carre, horaires, coordonnees, bloc, abonnement, bouton, PH } = require("../aides-inspire");
const I = require("../aides-illus-a08");

const FAM = "edition-librairie";
const MENTIONS = (G, k, env, o = {}) => G.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env);
const RESEAUX = [["Instagram", "https://www.instagram.com/"], ["Facebook", "https://www.facebook.com/"], ["YouTube", "https://www.youtube.com/"]];
// réseaux en pastilles d'icônes carrées (widget social)
const icones = (k, env, o = {}) => {
  const n = Moteur.item(k, "socials:instagram+facebook+youtube+tiktok", env);
  n.props.size = String(o.taille || 44); n.props.shape = "square";
  Moteur.mergePart(n, "link", { styles: { desktop: { color: o.couleur, backgroundColor: o.fond, transitionDuration: DOUX } }, states: { hover: { backgroundColor: o.survolFond, color: o.survolCouleur }, focus: { outlineStyle: "solid", outlineWidth: "2px", outlineColor: o.focus || o.survolFond, outlineOffset: "2px" } } });
  return n;
};
const colLiens = (k, titre, liens, o) => bloc(k, titre, liens.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "500", couleur: o.c, survol: { color: o.h, transform: { x: 5 } }, focus: o.h })), { couleurTitre: o.t, police: o.police, tailleTitre: o.tt || "13px", suiviTitre: o.suivi, casse: o.casse, gap: "0px", min: o.min || "160px", poids: o.poids ?? 0, extra: o.extra });

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-362 « Marque-page » — maison d'édition et librairie. Parti pris de la capture « Timon » : fond quasi noir, GRAND OBJET 3D côtelé à droite (ici une pelote de pages bordeaux et or) avec trois étiquettes inclinées flottantes, petites colonnes à gauche, bande claire en bas (marque, copyright, icônes).
const bordeaux = identite({
  key: "i362", label: "Bordeaux nuit, or et crème", humeur: "dark",
  fond: "#f8f0e2", texte: "#2a0d14", discret: "#4a3a3d", accent: "#6b1b2a", surface: "#efe4d0", encre: "#6b1b2a", surEncre: "#f8f0e2",
  police: "font.hanken-grotesk", titres: "font.cormorant-garamond",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f8f0e233",
});
const NUIT = "#16080d", CREME = "#f8f0e2", OR = "#e3b95f", BORD = "#6b1b2a";
const marquePage = modeleV2({
  id: identifiantV2(362, "marque-page"), concept: "c-362-marque-page", name: "Marque-page", family: FAM,
  description: "Pour une maison d'édition et sa librairie : une pelote de pages bordeaux et or dessinée en grand avec trois étiquettes flottantes, la phrase de la maison, trois petites colonnes et une bande crème (marque, réseaux en icônes).",
  tags: ["maison d'édition", "librairie", "objet 3D", "illustration", "bordeaux", "or", "icônes réseaux", "angles droits"],
  identity: bordeaux, racine: racineDe(CREME),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const cartes = (s) => I.cartes([[s * 0.02, 380 * s, -9, 250, 64, OR], [s * 0.1 + 20, 450 * s, 5, 250, 64, "#f8f0e2"], [s * 0.04, 530 * s, -4, 250, 64, "#b3405a"]].map(([x, y, rot, w, h, c]) => [x, y, rot, w, h, c]), { fond: "#240d15", bord: OR, trait: CREME, ic: OR });
    const grand = I.sphere("a", 760, 640, { cx: 470, cy: 310, r: 270, bg: ["#16080d", "#16080d"], rib: ["#f4d38c", "#7a1f31"], halo: "#8a2438", cuve: "#1d0a10", n: 17, rot: -20, cartes: cartes(1) });
    const petit = I.sphere("b", 390, 380, { cx: 215, cy: 170, r: 140, bg: ["#16080d", "#16080d"], rib: ["#f4d38c", "#7a1f31"], halo: "#8a2438", cuve: "#1d0a10", n: 13, rot: -20, cartes: I.cartes([[8, 245, -8, 200, 56, OR], [30, 305, 5, 200, 56, CREME]], { fond: "#240d15", bord: OR, trait: CREME }) });
    const objet = G.colonne(k, dessin(k, grand, petit, S), { poids: 1.15, min: "300px", aligne: "stretch", extra: { overflow: "hidden" } });
    const phrase = G.geant(`<p>Des livres choisis,<br>un monde <em>à lire.</em></p>`, { taille: [40, 76], tablette: { taille: [44, 64] }, mobile: { taille: [38, 48] }, lh: 1, suivi: "-0.01em", poids: "500", police: S.head, couleur: CREME })(k, env);
    const tt = { c: CREME, h: OR, t: OR, police: S.head, tt: "20px", suivi: "0em", casse: false };
    const c1 = colLiens(k, "Catalogue", [["Nouveautés", "/catalogue"], ["Romans", "/catalogue"], ["Essais", "/catalogue"], ["Poésie", "/catalogue"]], tt);
    const c2 = bloc(k, "La librairie", [horaires(k, { couleur: CREME, taille: 15 })], { couleurTitre: OR, police: S.head, tailleTitre: "20px", suiviTitre: "0em", casse: false, min: "200px" });
    const c3 = bloc(k, "La maison", [lien(k, "Auteurs", "/blog", { couleur: CREME, survol: { color: OR }, focus: OR }), lien(k, "Questions", "/faq", { couleur: CREME, survol: { color: OR }, focus: OR }), coordonnees(k, { couleur: CREME, lien: CREME, survol: OR, focus: OR })], { couleurTitre: OR, police: S.head, tailleTitre: "20px", suiviTitre: "0em", casse: false, min: "200px", gap: "0px" });
    const texteGauche = G.colonne(k, [souffle(carre(k, OR, "14px"), 3600), phrase, texte(k, "Éditeur et libraire indépendant : des livres choisis, des lecteurs accompagnés.", { couleur: "#d8c3bd", taille: 17, largeur: "380px" })], { poids: 1, min: "300px", gap: "28px", justifie: "center" });
    const haut = G.bande(k, [texteGauche, objet], { fond: NUIT, gap: "24px 40px", aligne: "stretch", max: "1280px", padV: ["64px", "52px", "40px"], padB: ["0px", "0px", "0px"], padH: PH, nom: "Phrase et objet" });
    const marque = k.T(`<p>Maison <em>Verso</em></p>`, { fontFamily: S.head, fontSize: "30px", lineHeight: 1, fontWeight: "600", color: BORD });
    const colonnes = G.bande(k, [c1, c2, c3], { fond: "#1e0b12", gap: "28px 56px", aligne: "flex-start", padV: ["36px", "32px", "28px"], padB: ["36px", "32px", "28px"], padH: PH, filetHaut: { epaisseur: "1px", couleur: "#e3b95f55" }, nom: "Colonnes" });
    const bas = G.bande(k, [marque, MENTIONS(G, k, env, { couleur: "#4a3a3d", liens: "#2a0d14" }), icones(k, env, { couleur: CREME, fond: BORD, survolFond: "#2a0d14", survolCouleur: OR })], { fond: CREME, gap: "14px 32px", aligne: "center", padV: ["22px", "20px", "20px"], padB: ["22px", "20px", "20px"], padH: PH, nom: "Marque et mentions" });
    return [G.racine(k, [haut, colonnes, bas])];
  },
}, FAM);
function dessin(k, large, etroit, S) { return I.dessin(k, large, etroit, {}); }

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-363 « Épilogue » — maison d'édition de romans et de poésie. Parti pris de la capture « Amplifyed » : fond nuit, halo flou pistache à gauche avec rideaux verticaux, trois colonnes de liens à droite en haut, nom GÉANT dégradé qui s'efface par le bas.
const sombreVert = identite({
  key: "i363", label: "Vert nuit et pistache", humeur: "dark",
  fond: "#0a1d17", texte: "#e9f5dc", discret: "#b7cdb9", accent: "#d3f0b4", surface: "#0f2a22", encre: "#0f2a22", surEncre: "#e9f5dc",
  police: "font.inter-tight", titres: "font.instrument-serif",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#e9f5dc33",
});
const VN2 = "#0a1d17", PIST = "#d3f0b4";
const epilogue = modeleV2({
  id: identifiantV2(363, "epilogue"), concept: "c-363-epilogue", name: "Épilogue", family: FAM,
  description: "Pour une petite maison d'édition : halo pistache flouté sur fond vert nuit, rideaux de lumière, trois colonnes de liens en haut et le nom Épilogue géant qui s'efface par le bas.",
  tags: ["maison d'édition", "halo lumineux", "nom monumental", "illustration", "vert nuit", "pistache", "angles droits"],
  identity: sombreVert, racine: racineDe("#08140f"),
  widgets: ["html", "text", "link", "divider", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const marque = G.colonne(k, [k.T(`<p>Épilogue</p>`, { fontFamily: S.head, fontSize: "34px", lineHeight: 1, color: "#e9f5dc" }), souffle(carre(k, PIST, "12px"), 3400), texte(k, "Romans et poésie, une page après l'autre.", { couleur: "#b7cdb9", taille: 16, largeur: "260px" })], { poids: 2, min: "240px", gap: "16px" });
    const tt = { c: "#e9f5dc", h: PIST, t: PIST, tt: "13px", suivi: "0.16em", min: "170px" };
    const cols = [colLiens(k, "Catalogue", [["Nouveautés", "/catalogue"], ["Romans", "/catalogue"], ["Poésie", "/catalogue"]], tt), colLiens(k, "La maison", [["Auteurs", "/blog"], ["Actualités", "/blog"], ["Questions", "/faq"]], tt), colLiens(k, "Écrire", [["Soumettre un manuscrit", "/contact"], ["Presse", "/contact"], ["Contact", "/contact"]], { ...tt, min: "200px" })];
    const haut = G.bande(k, [marque, G.colonne(k, [G.ligne(k, cols, { gap: "24px 48px", aligne: "flex-start", largeur: "100%" }), trait(k, "#e9f5dc33")], { poids: 3, min: "300px", gap: "20px" })], { fond: VN2, gap: "28px 48px", aligne: "flex-start", padV: ["64px", "52px", "40px"], padB: ["24px", "20px", "20px"], padH: PH, nom: "Marque et colonnes" });
    const blobs = (w, h) => [[w * 0.14, h * 0.78, w * 0.3, h * 0.4, "#9bd86a", 0.55], [w * 0.3, h * 0.45, w * 0.22, h * 0.3, "#2f8f64", 0.5], [w * 0.8, h * 0.9, w * 0.3, h * 0.3, "#1c5a49", 0.5]];
    const gr = (w, h, taille, ty, n) => I.glow("g", w, h, { bg: ["#0a1d17", "#08140f"], blobs: blobs(w, h), stries: { c: "#e9f5dc", op: 0.16, n, x0: 0, x1: w * 0.7, foyer: [w * 0.18, h * 0.75] }, mot: "ÉPILOGUE", mot_y: ty, mot_l: w * 0.9, trait: taille, mot_fill: ["#f6ffe8", "#d3f0b4", 0.12], graine: 363, apres: `<g stroke="#d3f0b4" stroke-width="2" fill="none"><path d="M${w * 0.82} ${h * 0.2}l${w * 0.012} ${w * 0.012}m${-w * 0.012} 0l${w * 0.012} ${-w * 0.012}"/></g>` });
    const halo = G.bande(k, I.dessin(k, gr(1440, 460, 34, 430, 64), gr(390, 280, 20, 262, 24), { fontFamily: S.head }), { fond: "#08140f", colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Halo et nom géant" });
    const bas = G.bande(k, [MENTIONS(G, k, env, { couleur: "#b7cdb9", liens: "#e9f5dc" })], { fond: "#08140f", colonne: true, padV: ["20px", "18px", "18px"], padB: ["28px", "24px", "22px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [haut, halo, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-364 « Table des matières » — éditeur d'essais. Parti pris de la capture « Horizon » : bande blanche (marque + phrase), bande grise de colonnes (sommaire, aide, lettre avec icônes), puis MOT GÉANT gris rogné par le bas, point jaune, rangée de livres dessinés devant.
const encre = identite({
  key: "i364", label: "Blanc, gris, noir et jaune", humeur: "light",
  fond: "#ffffff", texte: "#111111", discret: "#4f4f4f", accent: "#111111", surface: "#f4f4f1", encre: "#111111", surEncre: "#ffffff",
  police: "font.ibm-plex-sans", titres: "font.newsreader",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#11111133",
});
const JAUNE = "#ffd400";
const tableMatieres = modeleV2({
  id: identifiantV2(364, "table-des-matieres"), concept: "c-364-table-des-matieres", name: "Table des matières", family: FAM,
  description: "Pour un éditeur d'essais : bande blanche, bande grise de colonnes (sommaire, aide, lettre et icônes), puis « Marge » géant gris rogné, point jaune et rangée de livres dessinés.",
  tags: ["éditeur d'essais", "mot géant", "illustration", "livres dessinés", "gris", "jaune", "lettre d'information", "angles droits"],
  identity: encre, racine: racineDe("#ffffff"),
  widgets: ["html", "text", "link", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const tete = G.bande(k, [k.T(`<p>Éditions Marge<span style="color:#7a5f00">.</span></p>`, { fontFamily: S.head, fontSize: "40px", lineHeight: 1, fontWeight: "600", color: "#111111" }), texte(k, "Maison d'essais et d'idées — lire, discuter, douter.", { couleur: "#4f4f4f", taille: 17, police: S.head, extra: { fontStyle: "italic" } })], { fond: "#ffffff", colonne: true, gap: "8px", aligne: "flex-start", padV: ["48px", "40px", "32px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Marque" });
    const tt = { c: "#111111", h: "#7a5f00", t: "#4f4f4f", tt: "13px", suivi: "0.04em", casse: false, poids: 1 };
    const sommaire = colLiens(k, "Sommaire", [["Nouveautés", "/catalogue"], ["Essais", "/catalogue"], ["Auteurs", "/blog"], ["Rencontres", "/blog"], ["Librairie", "/contact"]], tt);
    const aide = colLiens(k, "Aide", [["Questions", "/faq"], ["Commander", "/contact"], ["Presse", "/contact"], ["Contact", "/contact"]], tt);
    const abo = abonnement(k, env, { titre: "Rester informé", intro: "Un message à chaque parution.", bouton: "Écrire", largeur: "100%", accent: "#111111", texte: "#111111", couleurTitre: "#4f4f4f", couleurIntro: "#4f4f4f", texteBouton: "#ffffff", survolBouton: JAUNE, survolTexte: "#111111", fondChamp: "#ffffff", rembChamp: "12px", soulignement: "2px" });
    const lettre = G.colonne(k, [caps(k, "Suivre", { couleur: "#4f4f4f", suivi: "0.04em", casse: false, taille: "13px", poids: "600" }), icones(k, env, { couleur: "#111111", fond: "#ffd400", survolFond: "#111111", survolCouleur: "#ffffff" }), abo], { poids: 1.5, min: "280px", gap: "18px" });
    const gris = G.bande(k, [sommaire, aide, lettre], { fond: "#f4f4f1", gap: "32px 56px", aligne: "flex-start", padV: ["56px", "44px", "36px"], padB: ["56px", "44px", "36px"], padH: PH, nom: "Colonnes" });
    const pile = (w, h, y) => I.dos(w, y, ["#111111", "#ffd400", "#ffffff", "#8a8a85", "#111111"], 364, h * 0.3, h * 0.55);
    const mot = (w, h, ty, taille, n) => I.crop("m", w, h, { bg: "#ffffff", mot: "MARGE", mot_y: ty, mot_l: w * 0.84, mot_x: w * 0.04, trait: taille, fill: "#d3d3ce", point: [JAUNE, w * 0.93, ty - 20, taille * 0.5], apres: pile(w, h, h) + `<rect x="0" y="${h - 6}" width="${w}" height="6" fill="#111111"/>` });
    const geante = G.bande(k, I.dessin(k, mot(1440, 360, 410, 60), mot(390, 200, 250, 30), { fontFamily: S.head }), { fond: "#ffffff", colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Mot géant et livres" });
    const bas = G.bande(k, [MENTIONS(G, k, env, { couleur: "#4f4f4f", liens: "#111111" })], { fond: "#ffffff", colonne: true, padV: ["22px", "20px", "18px"], padB: ["24px", "20px", "18px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [tete, gris, geante, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-365 « Papier d'Alinéa » — librairie-papeterie. Capture « Horizon » en papier ivoire : en-tête centré, bande « papier réglé » de quatre colonnes (rubriques, horaires, adresse), puis « Alinéa » géant rogné en bleu marine pâle, traversé d'une plume dessinée.
const papier = identite({
  key: "i365", label: "Ivoire et bleu marine", humeur: "light",
  fond: "#f3ecdc", texte: "#1c2a4a", discret: "#50597a", accent: "#1c2a4a", surface: "#e9e0cc", encre: "#1c2a4a", surEncre: "#f3ecdc",
  police: "font.lato", titres: "font.cardo",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "400", bordure: "0px", ligne: "#1c2a4a55",
});
const IVOIRE = "#f3ecdc", MARINE = "#1c2a4a";
const alinea = modeleV2({
  id: identifiantV2(365, "papier-d-alinea"), concept: "c-365-papier-d-alinea", name: "Papier d'Alinéa", family: FAM,
  description: "Pour une librairie-papeterie : en-tête centré, bande de papier réglé (rayons, horaires, adresse, icônes), puis « Alinéa » géant bleu marine pâle rogné et traversé d'une plume dessinée.",
  tags: ["librairie", "papeterie", "papier réglé", "plume", "illustration", "mot géant", "ivoire", "marine", "angles droits"],
  identity: papier, racine: racineDe(IVOIRE),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const marque = G.colonne(k, [souffle(carre(k, MARINE, "10px"), 3800), caps(k, "Librairie · Papeterie", { couleur: MARINE, suivi: "0.3em" }), texte(k, "Du papier, des mots, du temps pour les deux.", { couleur: "#50597a", taille: 20, police: S.head, largeur: "260px", extra: { fontStyle: "italic" } })], { poids: 1.3, min: "240px", gap: "12px" });
    const tt = { c: MARINE, h: "#50597a", t: "#50597a", tt: "12px", suivi: "0.22em", poids: 1, min: "180px" };
    const livres = colLiens(k, "Rayons", [["Livres", "/catalogue"], ["Papeterie", "/boutique"], ["Commander", "/contact"], ["Questions", "/faq"]], tt);
    const h = bloc(k, "Horaires", [horaires(k, { couleur: MARINE, taille: 15 })], { couleurTitre: "#50597a", tailleTitre: "12px", suiviTitre: "0.22em", min: "220px", poids: 1.2 });
    const a = bloc(k, "Adresse", [coordonnees(k, { couleur: MARINE, lien: MARINE, survol: "#50597a", focus: MARINE }), icones(k, env, { couleur: IVOIRE, fond: MARINE, survolFond: "#50597a", survolCouleur: IVOIRE })], { couleurTitre: "#50597a", tailleTitre: "12px", suiviTitre: "0.22em", min: "220px", poids: 1.2, gap: "16px" });
    const lignes = `<g stroke="#ddd3bb" stroke-width="2">${Array.from({ length: 7 }, (_, i) => `<line x1="0" x2="1440" y1="${40 + i * 44}" y2="${40 + i * 44}"/>`).join("")}</g><line x1="150" x2="150" y1="0" y2="340" stroke="#e0b5a8" stroke-width="2"/>`;
    const plume = (w, h, x, y, s) => `<g transform="translate(${x} ${y}) rotate(-28) scale(${s})"><path d="M0 -150 C 40 -100 52 -30 30 40 L0 110 L-30 40 C-52 -30 -40 -100 0 -150 Z" fill="#1c2a4a"/><path d="M0 -150 C 12 -100 12 -40 0 20 C -12 -40 -12 -100 0 -150Z" fill="#6a7394"/><circle cx="0" cy="-20" r="11" fill="#f3ecdc"/><line x1="0" y1="-20" x2="0" y2="105" stroke="#f3ecdc" stroke-width="3"/><path d="M-28 110 h56 l-6 22 h-44z" fill="#50597a"/></g><path d="M${x - 60 * s} ${y + 150 * s} C ${x - 20 * s} ${y + 120 * s} ${x + 40 * s} ${y + 180 * s} ${x + 120 * s} ${y + 140 * s}" fill="none" stroke="#1c2a4a" stroke-width="4"/>`;
    const mot = (w, h, ty, taille, px, py, s, wide) => I.crop("n", w, h, { bg: "#e9e0cc", mot: "ALINÉA", mot_y: ty, mot_l: w * 0.8, mot_x: w * 0.04, trait: taille, fill: "#cfc5ac", point: ["#1c2a4a", w * 0.9, ty - 14, taille * 0.45], avant: wide ? lignes : "", apres: plume(w, h, px, py, s) });
    const papierReglé = G.bande(k, [marque, livres, h, a], { fond: "#e9e0cc", gap: "32px 56px", aligne: "flex-start", padV: ["48px", "40px", "32px"], padB: ["24px", "24px", "24px"], padH: PH, nom: "Colonnes" });
    const geante = G.bande(k, I.dessin(k, mot(1440, 320, 330, 26, 1180, 150, 1.2, true), mot(390, 200, 190, 14, 300, 110, 0.7, false), { fontFamily: S.head }), { fond: "#e9e0cc", colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Alinéa géant et plume" });
    const bas = G.bande(k, [G.ligneLegale({ taille: 13, sansCookies: true, couleur: "#50597a", liens: MARINE })(k, env)], { fond: IVOIRE, colonne: true, padV: ["22px", "20px", "18px"], padB: ["26px", "22px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [papierReglé, geante, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-366 « Rayonnage » — librairie indépendante. Capture « Horizon » : bande moutarde avec « Lisez. » et la lettre sur une ligne, bande blanche de colonnes, puis ÉTAGÈRE dessinée (livres, plante, chat) rognée par le bas sous le mot « Lisez » géant pâle.
const rayon = identite({
  key: "i366", label: "Moutarde, canard et écru", humeur: "light",
  fond: "#161616", texte: "#f6f0e4", discret: "#d8d2c4", accent: "#e8b630", surface: "#2c2c2c", encre: "#161616", surEncre: "#f6f0e4",
  police: "font.karla", titres: "font.dm-serif-display",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#16161633",
});
const MOUT = "#e8b630", CANARD = "#0e5c5c", ECRU = "#f6f0e4", NOIRL = "#161616";
const rayonnage = modeleV2({
  id: identifiantV2(366, "rayonnage"), concept: "c-366-rayonnage", name: "Rayonnage", family: FAM,
  description: "Pour une librairie indépendante : bande moutarde (« Lisez. » et lettre), colonnes claires (rayons, horaires, contact) et une étagère dessinée (livres, plante, chat) rognée par le bas.",
  tags: ["librairie", "étagère", "illustration", "livres dessinés", "moutarde", "canard", "lettre d'information", "angles droits"],
  identity: rayon, racine: racineDe("#161616"),
  widgets: ["html", "text", "link", "bizhours", "bizcontact", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const lisez = G.geant(`<p>Lisez.</p>`, { taille: [72, 150], tablette: { taille: [84, 130] }, mobile: { taille: [72, 96] }, lh: 0.9, suivi: "-0.02em", poids: "400", police: S.head, couleur: NOIRL })(k, env);
    const abo = abonnement(k, env, { titre: "La lettre de la librairie", intro: "Nouveautés et coups de cœur des libraires.", bouton: "S'abonner", largeur: "440px", accent: NOIRL, texte: NOIRL, couleurTitre: NOIRL, couleurIntro: "#2d2d2a", texteBouton: MOUT, survolBouton: CANARD, survolTexte: "#ffffff" });
    const abo2 = abo;
    const jaune = G.bande(k, [G.colonne(k, [souffle(carre(k, NOIRL, "14px"), 3600), lisez], { poids: 1, min: "260px", gap: "14px" }), G.colonne(k, [abo2], { poids: 1, min: "280px" })], { fond: MOUT, gap: "24px 56px", aligne: "flex-end", padV: ["52px", "44px", "36px"], padB: ["36px", "32px", "28px"], padH: PH, nom: "Lisez et lettre" });
    const tt = { c: NOIRL, h: CANARD, t: CANARD, tt: "13px", suivi: "0.14em", poids: 1 };
    const rayons = colLiens(k, "Rayons", [["Romans", "/catalogue"], ["Essais", "/catalogue"], ["Jeunesse", "/catalogue"], ["Papeterie", "/boutique"]], tt);
    const h = bloc(k, "Horaires", [horaires(k, { couleur: NOIRL, taille: 15 })], { couleurTitre: CANARD, tailleTitre: "13px", suiviTitre: "0.14em", min: "220px", poids: 1.2 });
    const c = bloc(k, "Nous trouver", [coordonnees(k, { couleur: NOIRL, lien: NOIRL, survol: CANARD, focus: CANARD }), icones(k, env, { couleur: ECRU, fond: CANARD, survolFond: NOIRL, survolCouleur: MOUT })], { couleurTitre: CANARD, tailleTitre: "13px", suiviTitre: "0.14em", min: "220px", poids: 1.2, gap: "16px" });
    const colonnes = G.bande(k, [G.colonne(k, [rayons], { poids: 0, base: "180px" }), h, c], { fond: "#ffffff", gap: "28px 56px", aligne: "flex-start", padV: ["48px", "40px", "32px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Colonnes" });
    const etagere = (w, h, ligne, hmin, hmax, sc) => I.crop("r", w, h, { bg: ECRU, mot: "LISEZ", mot_y: h * 0.62, mot_l: w * 0.7, mot_x: w * 0.04, trait: 30, fill: "#ebe0c3",
      apres: I.dos(w, ligne, [MOUT, CANARD, NOIRL, "#b5452d", "#f6f0e4", "#3b5ba5", "#e8b630"], 366, hmin, hmax) +
        `<rect x="0" y="${ligne}" width="${w}" height="${h - ligne}" fill="#8a5a2b"/><rect x="0" y="${ligne}" width="${w}" height="6" fill="#b07a3e"/>` +
        `<g transform="translate(${w * 0.86} ${ligne})"><rect x="-26" y="-34" width="52" height="34" fill="#b5452d"/><path d="M0 -34 C -40 -80 -50 -110 -30 -140 C -20 -100 -8 -90 0 -34Z M0 -34 C 40 -90 56 -120 40 -150 C 22 -110 8 -80 0 -34Z M0 -34 C -6 -90 6 -130 0 -170 C 14 -120 14 -80 0 -34Z" fill="#0e5c5c"/></g>` +
        `<g transform="translate(${w * 0.62} ${ligne - sc * 4})"><ellipse cx="0" cy="-24" rx="30" ry="26" fill="#161616"/><circle cx="0" cy="-62" r="20" fill="#161616"/><polygon points="-20,-72 -14,-96 -4,-78" fill="#161616"/><polygon points="20,-72 14,-96 4,-78" fill="#161616"/><circle cx="-7" cy="-62" r="3" fill="#e8b630"/><circle cx="7" cy="-62" r="3" fill="#e8b630"/><path d="M26 -8 C 70 -10 74 -50 50 -50" fill="none" stroke="#161616" stroke-width="9"/></g>` });
    const rayonSvg = G.bande(k, I.dessin(k, etagere(1440, 330, 300, 110, 220, 1), etagere(390, 220, 200, 60, 140, 0.6), { fontFamily: S.head }), { fond: ECRU, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Étagère" });
    const bas = G.bande(k, [MENTIONS(G, k, env, { couleur: "#f6f0e4", liens: "#ffffff" })], { fond: "#161616", colonne: true, padV: ["22px", "20px", "18px"], padB: ["24px", "22px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [rayonSvg, jaune, colonnes, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-367 « Page double » — éditeur de livres d'art. Capture « Amplifyed » : fond indigo, GRAND soleil pêche flouté qui se lève derrière un livre ouvert dessiné, phrase géante à gauche, deux boutons et deux colonnes à droite.
const livre = identite({
  key: "i367", label: "Indigo et pêche", humeur: "dark",
  fond: "#1d1b4d", texte: "#fbe9dc", discret: "#d3cdea", accent: "#ffb48a", surface: "#15133a", encre: "#1d1b4d", surEncre: "#fbe3d3",
  police: "font.public-sans", titres: "font.fraunces",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#fbe9dc33",
});
const INDIGO = "#1d1b4d", PECHE = "#fbe3d3";
const pageDouble = modeleV2({
  id: identifiantV2(367, "page-double"), concept: "c-367-page-double", name: "Page double", family: FAM,
  description: "Pour un éditeur de livres d'art : un soleil pêche flouté se lève derrière un livre ouvert dessiné sur fond indigo ; phrase géante, deux boutons et deux colonnes de liens. Le bouton principal respire.",
  tags: ["livres d'art", "halo lumineux", "livre ouvert", "illustration", "indigo", "pêche", "angles droits"],
  identity: livre, racine: racineDe("#120f33"),
  widgets: ["html", "text", "link", "bizcontact", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const msg = G.geant(`<p>Un livre,<br>puis un<br><em style="color:#ffb48a">autre.</em></p>`, { taille: [52, 112], tablette: { taille: [64, 96] }, mobile: { taille: [52, 72] }, lh: 1, suivi: "-0.02em", poids: "500", police: S.head, couleur: "#fbe9dc" })(k, env);
    const b1 = souffle(bouton(k, "Parcourir le catalogue", "/catalogue", { texte: INDIGO, fond: "#ffb48a", bord: "#ffb48a", casse: false, suivi: "0.02em", poids: "700", survol: { backgroundColor: PECHE, borderColor: PECHE, color: INDIGO, transform: { y: -3 } }, focus: PECHE, police: S.font }), 4200);
    const b2 = bouton(k, "Nous écrire", "/contact", { texte: "#fbe9dc", bord: "#fbe9dc", casse: false, suivi: "0.02em", poids: "700", survol: { backgroundColor: "#fbe9dc", color: INDIGO, transform: { y: -3 } }, focus: PECHE, police: S.font });
    const gauche = G.colonne(k, [caps(k, "Éditions Page Double", { couleur: "#ffb48a", suivi: "0.26em" }), msg, G.ligne(k, [b1, b2], { gap: "12px" })], { poids: 1.3, min: "300px", gap: "28px" });
    const tt = { c: "#fbe9dc", h: "#ffb48a", t: "#ffb48a", tt: "13px", suivi: "0.16em", min: "180px" };
    const c1 = colLiens(k, "Catalogue", [["Nouveautés", "/catalogue"], ["Monographies", "/catalogue"], ["Catalogues d'exposition", "/catalogue"]], tt);
    const c2 = bloc(k, "La maison", [lien(k, "Actualités", "/blog", { couleur: "#fbe9dc", survol: { color: "#ffb48a" }, focus: "#ffb48a" }), lien(k, "Questions", "/faq", { couleur: "#fbe9dc", survol: { color: "#ffb48a" }, focus: "#ffb48a" }), coordonnees(k, { couleur: "#fbe9dc", lien: "#fbe9dc", survol: "#ffb48a", focus: "#ffb48a" })], { couleurTitre: "#ffb48a", tailleTitre: "13px", suiviTitre: "0.16em", min: "200px", gap: "0px", poids: 0 });
    const haut = G.bande(k, [gauche, G.ligne(k, [c1, c2], { gap: "28px 40px", aligne: "flex-start", largeur: "100%" })], { fond: INDIGO, gap: "32px 48px", aligne: "flex-start", padV: ["64px", "52px", "40px"], padB: ["24px", "20px", "20px"], padH: PH, nom: "Phrase et colonnes" });
    const livreOuvert = (w, h, cx, base, s) => `<g transform="translate(${cx} ${base}) scale(${s})"><path d="M-330 0 C -200 -30 -90 -20 0 20 C 90 -20 200 -30 330 0 L 330 -190 C 200 -220 90 -210 0 -170 C -90 -210 -200 -220 -330 -190 Z" fill="#fbe3d3"/><path d="M-330 0 C -200 -30 -90 -20 0 20 L 0 -170 C -90 -210 -200 -220 -330 -190Z" fill="#f3cfb6"/><path d="M-310 -150 C -200 -180 -110 -170 -26 -140 M-310 -120 C -200 -150 -110 -140 -26 -110 M-310 -90 C -200 -120 -110 -110 -26 -80" stroke="#c9a899" stroke-width="5" fill="none"/><rect x="40" y="-150" width="120" height="90" fill="#ffb48a"/><circle cx="100" cy="-118" r="22" fill="#fbe3d3"/><path d="M40 -60 l45 -40 l35 28 l40 -45 v57z" fill="#1d1b4d"/><path d="M40 -170 C 120 -190 220 -180 300 -150" stroke="#c9a899" stroke-width="5" fill="none"/><path d="M-330 0 C -200 -30 -90 -20 0 20 C 90 -20 200 -30 330 0 L330 24 C 200 -4 90 4 0 44 C -90 4 -200 -4 -330 24Z" fill="#e3b79c"/></g>`;
    const soleil = (w, h, cx, base, s) => I.glow("p", w, h, { bg: ["#1d1b4d", "#120f33"], blobs: [[w * 0.5, h * 0.95, w * 0.34, h * 0.8, "#ff8d5c", 0.85], [w * 0.5, h * 0.9, w * 0.2, h * 0.5, "#ffd2a8", 0.8], [w * 0.15, h * 0.6, w * 0.2, h * 0.3, "#6a3fa8", 0.5], [w * 0.88, h * 0.7, w * 0.2, h * 0.3, "#c24d7a", 0.45]], stries: { c: "#ffd2a8", op: 0.2, n: 56, x0: w * 0.15, x1: w * 0.85, foyer: [w * 0.5, h * 0.9] }, graine: 367,
      avant: `<circle cx="${w * 0.5}" cy="${h * 0.72}" r="${h * 0.34}" fill="#ffb48a" opacity="0.9"/>`, apres: livreOuvert(w, h, cx, base, s) });
    const scene = G.bande(k, I.dessin(k, soleil(1440, 420, 720, 400, 1.35), soleil(390, 260, 195, 250, 0.55), {}), { fond: "#120f33", colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom: "Soleil et livre ouvert" });
    const bas = G.bande(k, [MENTIONS(G, k, env, { couleur: "#d3cdea", liens: "#fbe9dc" })], { fond: "#120f33", colonne: true, padV: ["20px", "18px", "18px"], padB: ["24px", "22px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [scene, haut, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Édition et librairie", target: 6, built: true,
  description: "Pieds illustrés inspirés de captures, angles droits, animations fluides : maison d'édition, librairie, éditeur d'essais, papeterie, livres d'art. Objet 3D à côtes, mot géant rogné sur bande grise, halo lumineux avec nom géant.",
  models: [marquePage, epilogue, tableMatieres, alinea, rayonnage, pageDouble],
};
