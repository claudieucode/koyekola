// Famille v2 « Jeux vidéo et esport » — 6 modèles (ft2-368 à ft2-373), pieds « inspirés de captures », REFAITS autour de vraies illustrations dessinées (SVG) : ANGLES DROITS partout.
// Trois captures : « Timon » (grand objet 3D à côtes + étiquettes flottantes sur fond noir) → 369 (anneau néon), 371 (relief en terrasses), 372 (cristal) ; « Horizon » (bande de colonnes + mot géant rogné) → 368 (pixel art) ;
// « Amplifyed » (halo lumineux + nom géant dégradé) → 370 (orange), 373 (violet et rose avec escalier). Marques fictives (Super Cases, Néon Éclipse, Prêt Joueur, Carte du jeu, Terminal Quartz, Next Level).
// AUCUNE coordonnée, horaire ni chiffre inventé. Rubriques (Actualités, Tournois…) = intitulés d'EXEMPLE à renommer. Mouvement : transitions de 360 ms, UNE animation visible par modèle, tout est immobile sous « prefers-reduced-motion ».
const { modeleV2, identifiantV2, identite } = require("../kit-v2");
const { DOUX, Moteur, racineDe, lien, caps, texte, trait, souffle, carre, bloc, abonnement, bouton, PH } = require("../aides-inspire");
const I = require("../aides-illus-a08");

const FAM = "jeux-video";
const MENTIONS = (G, k, env, o = {}) => G.ligneLegale({ taille: 13, sansCookies: true, ...o })(k, env);
const icones = (k, env, o = {}) => {
  const n = Moteur.item(k, "socials:youtube+x+instagram+tiktok", env);
  n.props.size = String(o.taille || 44); n.props.shape = "square";
  Moteur.mergePart(n, "link", { styles: { desktop: { color: o.couleur, backgroundColor: o.fond, transitionDuration: DOUX } }, states: { hover: { backgroundColor: o.survolFond, color: o.survolCouleur }, focus: { outlineStyle: "solid", outlineWidth: "2px", outlineColor: o.focus || o.survolFond, outlineOffset: "2px" } } });
  return n;
};
const colLiens = (k, titre, liens, o) => bloc(k, titre, liens.map(([t, u]) => lien(k, t, u, { taille: 16, poids: "500", couleur: o.c, survol: { color: o.h, transform: { x: 5 } }, focus: o.h, police: o.policeLien })), { couleurTitre: o.t, police: o.police, tailleTitre: o.tt || "13px", suiviTitre: o.suivi, casse: o.casse, gap: "0px", min: o.min || "160px", poids: o.poids ?? 0 });
const bandeSvg = (G, k, large, etroit, fond, st = {}, nom = "Illustration") => G.bande(k, I.dessin(k, large, etroit, st), { fond, colonne: true, padV: ["0px", "0px", "0px"], padB: ["0px", "0px", "0px"], padH: ["0px", "0px", "0px"], max: "100%", nom });

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-368 « Super cases » — média de jeux vidéo. Capture « Horizon » : bande blanche (marque), bande bleue de colonnes (liens, aide, lettre + icônes), puis SUPER CASES géant jaune rogné sur une scène en pixel art (invaders, nuages, sol de briques).
const arcade = identite({
  key: "i368", label: "Bleu électrique, jaune, blanc, noir", humeur: "dark",
  fond: "#0b0b0f", texte: "#ffffff", discret: "#c9c9d6", accent: "#ffe14a", surface: "#16161d", encre: "#0b0b0f", surEncre: "#ffffff",
  police: "font.chakra-petch", titres: "font.press-start-2p",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#ffffff33",
});
const BLEU = "#1d3bff", JAUNE2 = "#ffe14a", NOIR2 = "#0b0b0f";
const superCases = modeleV2({
  id: identifiantV2(368, "super-cases"), concept: "c-368-super-cases", name: "Super cases", family: FAM,
  description: "Pour un média de jeux vidéo : bande blanche, bande bleue de colonnes (liens, aide, icônes) puis SUPER CASES géant jaune rogné sur une scène en pixel art (invaders, nuages, briques). Bleu électrique, jaune, noir.",
  tags: ["jeux vidéo", "pixel art", "mot géant", "illustration", "bleu électrique", "jaune", "icônes réseaux", "angles droits"],
  identity: arcade, racine: racineDe(NOIR2),
  widgets: ["html", "text", "link", "divider", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
        const marque = G.colonne(k, [I.dessin(k, `<svg viewBox="0 0 44 32" width="44" height="32" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${I.pix(I.INVADER, 0, 0, 4, "#ffe14a")}</svg>`, null, { width: "44px" })[0], k.T(`<p>SUPER CASES</p>`, { fontFamily: S.head, fontSize: "20px", lineHeight: 1.3, color: "#ffffff" }), texte(k, "Le média des joueuses et des joueurs.", { couleur: "#e3e8ff", taille: 16 })], { poids: 1.2, min: "260px", gap: "14px" });
    const tt = { c: "#ffffff", h: JAUNE2, t: JAUNE2, tt: "11px", suivi: "0.16em", min: "160px", poids: 1 };
    const c1 = colLiens(k, "Lire", [["Actualités", "/blog"], ["Tests", "/blog"], ["Guides", "/faq"], ["Tournois", "/blog"]], tt);
    const c2 = colLiens(k, "Jouer", [["Boutique", "/boutique"], ["Se connecter", "/connexion"], ["Créer un compte", "/inscription"], ["Contact", "/contact"]], tt);
        const c3 = G.colonne(k, [caps(k, "Suivre", { couleur: JAUNE2, suivi: "0.16em", taille: "11px", poids: "700" }), trait(k, "#6f86ff", "2px"), icones(k, env, { couleur: NOIR2, fond: JAUNE2, survolFond: "#ffffff", survolCouleur: NOIR2 })], { poids: 0, base: "240px", min: "200px", gap: "16px" });
    const bleue = G.bande(k, [marque, G.colonne(k, [G.ligne(k, [c1, c2], { gap: "24px 48px", aligne: "flex-start", largeur: "100%" })], { poids: 1.6, min: "300px" }), c3], { fond: BLEU, gap: "32px 48px", aligne: "flex-start", padV: ["48px", "40px", "32px"], padB: ["48px", "40px", "32px"], padH: PH, nom: "Colonnes" });
    const scene = (w, h, ty, etire, p) => {
      const al = I.alea(368); let ciel = "";
      for (let i = 0; i < Math.floor(w / 140); i++) ciel += I.pix(I.NUAGE, Math.round(al() * (w - 60) / p) * p, Math.round((8 + al() * 26)) * p * 0 + Math.round(al() * 3) * p * 4, p, "#2c4cff");
      const inv = [0.08, 0.5, 0.9].map((fx, i) => I.pix(I.INVADER, Math.round((w * fx) / p) * p, (6 + i * 3) * p, p, i === 1 ? "#ffffff" : "#6f86ff")).join("");
      let briques = `<rect x="0" y="${h - 3 * p}" width="${w}" height="${3 * p}" fill="#c46a00"/>`;
      for (let x = 0; x < w; x += 4 * p) briques += `<rect x="${x}" y="${h - 3 * p}" width="${p}" height="${3 * p}" fill="#0b0b0f"/><rect x="${x}" y="${h - 3 * p}" width="${4 * p}" height="${p}" fill="#ffb347"/>`;
      return I.crop("s", w, h, { bg: "#0b0b0f", mot: "SUPER CASES", mot_y: ty, mot_l: w * 0.9, mot_x: w * 0.05, trait: 34, etire, fill: JAUNE2, gap: 28, avant: ciel + inv, apres: briques, point: null });
    };
    const geant = bandeSvg(G, k, scene(1440, 420, 400, 1.6, 8), scene(390, 220, 200, 1.5, 4), NOIR2, {}, "Pixel art et mot géant");
    const bas = G.bande(k, [MENTIONS(G, k, env, { couleur: "#c9c9d6", liens: "#ffffff" })], { fond: NOIR2, colonne: true, padV: ["22px", "20px", "18px"], padB: ["24px", "22px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [bleue, geant, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-369 « Barre HUD » — plateforme de jeux. Capture « Timon » : grande phrase centrée en haut, à gauche trois petites colonnes, à droite un ANNEAU néon 3D incliné avec étiquettes flottantes, bande claire en bas (nom, copyright, icônes).
const hud = identite({
  key: "i369", label: "Violet nuit et cyan", humeur: "dark",
  fond: "#efeaff", texte: "#1a1033", discret: "#3d3366", accent: "#1a1033", surface: "#ddd5f5", encre: "#1a1033", surEncre: "#efeaff",
  police: "font.exo-2", titres: "font.orbitron",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#efeaff33",
});
const VIOLET = "#120a26", CYAN = "#2de2e6";
const barreHud = modeleV2({
  id: identifiantV2(369, "barre-hud"), concept: "c-369-barre-hud", name: "Barre HUD", family: FAM,
  description: "Pour une plateforme de jeux : une grande phrase centrée, trois colonnes de liens à gauche, un anneau néon 3D incliné avec étiquettes flottantes à droite, et une bande claire en bas (nom, mentions, icônes). Violet nuit et cyan.",
  tags: ["plateforme de jeux", "anneau 3D", "néon", "illustration", "violet", "cyan", "icônes réseaux", "angles droits"],
  identity: hud, racine: racineDe("#efeaff"),
  widgets: ["html", "text", "link", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const phrase = G.geant(`<p>Votre prochaine<br>partie <span style="color:#2de2e6">commence ici.</span></p>`, { taille: [36, 88], tablette: { taille: [44, 72] }, mobile: { taille: [32, 44] }, lh: 1.05, suivi: "0", poids: "700", police: S.head, couleur: "#efeaff", align: "center" })(k, env, true);
    const haut = G.bande(k, [phrase], { fond: VIOLET, colonne: true, aligne: "center", padV: ["72px", "56px", "44px"], padB: ["8px", "8px", "8px"], padH: PH, nom: "Phrase" });
    const tt = { c: "#efeaff", h: CYAN, t: CYAN, police: S.head, tt: "14px", suivi: "0.06em", casse: false, min: "150px", poids: 0 };
    const cols = G.ligne(k, [colLiens(k, "Jeux", [["Catalogue", "/catalogue"], ["Classements", "/blog"], ["Événements", "/blog"]], tt), colLiens(k, "Aide", [["Questions", "/faq"], ["Contact", "/contact"], ["Recrutement", "/contact"]], tt), colLiens(k, "Compte", [["Se connecter", "/connexion"], ["S'inscrire", "/inscription"], ["Cookies", "/cookies"]], tt)], { gap: "28px 40px", aligne: "flex-start", largeur: "100%" });
    const cta = souffle(bouton(k, "Se connecter", "/connexion", { texte: VIOLET, fond: CYAN, bord: CYAN, h: "52px", padH: "26px", taille: 15, survol: { backgroundColor: "#efeaff", borderColor: "#efeaff", color: VIOLET, transform: { y: -3 } }, focus: "#efeaff", police: S.font }), 3800);
    const gauche = G.colonne(k, [cols, cta], { poids: 1, min: "300px", gap: "32px", justifie: "center", extra: { paddingTop: "24px", paddingBottom: "24px" } });
    const cc = (s) => I.cartes([[16 * s, 40 * s, -8, 230, 60, CYAN], [60 * s, 110 * s, 5, 230, 60, "#ff4fd8"], [10 * s, 180 * s, -3, 230, 60, "#efeaff"]], { fond: "#1d1240", bord: CYAN, trait: "#efeaff" });
    const grand = I.torus("t", 700, 440, { cx: 400, cy: 230, R: 280, bg: ["#120a26", "#120a26"], c1: "#2de2e6", c2: "#7b5cff", c3: "#ff4fd8", rot: -12, cartes: cc(1.1) });
    const petit = I.torus("u", 390, 280, { cx: 230, cy: 140, R: 150, bg: ["#120a26", "#120a26"], c1: "#2de2e6", c2: "#7b5cff", c3: "#ff4fd8", rot: -12, cartes: I.cartes([[8, 150, -6, 180, 52, CYAN], [40, 205, 4, 180, 52, "#ff4fd8"]], { fond: "#1d1240", bord: CYAN, trait: "#efeaff" }) });
    const objet = G.colonne(k, I.dessin(k, grand, petit, {}), { poids: 1.1, min: "300px", aligne: "stretch" });
    const milieu = G.bande(k, [gauche, objet], { fond: VIOLET, gap: "16px 32px", aligne: "center", padV: ["8px", "8px", "8px"], padB: ["24px", "20px", "16px"], padH: PH, nom: "Colonnes et anneau" });
    const nom = k.T(`<p>NÉON ÉCLIPSE</p>`, { fontFamily: S.head, fontSize: "20px", lineHeight: 1, fontWeight: "700", color: "#1a1033", letterSpacing: "0.1em" });
    const bas = G.bande(k, [nom, MENTIONS(G, k, env, { couleur: "#3d3366", liens: "#1a1033" }), icones(k, env, { couleur: "#efeaff", fond: "#1a1033", survolFond: "#2de2e6", survolCouleur: "#1a1033" })], { fond: "#efeaff", gap: "14px 32px", aligne: "center", padV: ["22px", "20px", "20px"], padB: ["22px", "20px", "20px"], padH: PH, nom: "Nom et mentions" });
    return [G.racine(k, [haut, milieu, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-370 « Prêt, joueur ? » — studio de jeux indépendant. Capture « Amplifyed » : grand halo orange et rouge sur fond nuit avec rideaux de lumière, PRÊT JOUEUR géant blanc qui s'efface par le bas, colonnes de liens dessous, ligne légale.
const studio = identite({
  key: "i370", label: "Orange vif et noir", humeur: "dark",
  fond: "#0d0b0c", texte: "#f5f5f0", discret: "#d4cfc8", accent: "#ff5a1f", surface: "#1c1c1c", encre: "#111111", surEncre: "#f5f5f0",
  police: "font.barlow", titres: "font.anton",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#f5f5f033",
});
const ORANGE = "#ff5a1f", NOIR3 = "#0d0b0c", BLANC3 = "#f5f5f0";
const pretJoueur = modeleV2({
  id: identifiantV2(370, "pret-joueur"), concept: "c-370-pret-joueur", name: "Prêt, joueur ?", family: FAM,
  description: "Pour un studio de jeux indépendant : grand halo orange et rouge avec rideaux de lumière, PRÊT JOUEUR géant qui s'efface par le bas, puis colonnes de liens et un gros bouton qui respire. Orange et noir.",
  tags: ["studio de jeux", "halo lumineux", "nom géant", "illustration", "orange", "noir", "angles droits"],
  identity: studio, racine: racineDe(NOIR3),
  widgets: ["html", "text", "link", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const g = (w, h, my, etire, n) => I.glow("j", w, h, { bg: ["#0d0b0c", "#1a0c0a"], blobs: [[w * 0.12, h * 0.6, w * 0.34, h * 0.75, "#ff4a1a", 0.9], [w * 0.28, h * 0.45, w * 0.22, h * 0.5, "#ffa43a", 0.8], [w * 0.7, h * 0.95, w * 0.3, h * 0.4, "#b3203a", 0.55], [w * 0.5, h * 0.2, w * 0.2, h * 0.25, "#5a1f60", 0.4]], stries: { c: "#ffb36b", op: 0.3, n, x0: 0, x1: w * 0.75, foyer: [w * 0.15, h * 0.65] }, graine: 370,
      mot: "PRÊT JOUEUR", mot_y: my, mot_l: w * 0.9, etire, trait: 34, gap: 26, mot_fill: ["#ffffff", "#ffd2b0", 0.2] });
    const halo = bandeSvg(G, k, g(1440, 560, 520, 1.9, 70), g(390, 300, 275, 1.2, 26), NOIR3, {}, "Halo et nom géant");
    const rangee = (t, u) => lien(k, t, u, { taille: 17, poids: "600", couleur: BLANC3, survol: { color: ORANGE, transform: { x: 6 } }, focus: ORANGE });
    const tt = { c: BLANC3, h: ORANGE, t: ORANGE, tt: "12px", suivi: "0.24em", poids: 1, min: "170px" };
    const cta = souffle(bouton(k, "Télécharger la démo", "/inscription", { texte: NOIR3, fond: ORANGE, bord: ORANGE, h: "64px", padH: "36px", taille: 20, survol: { backgroundColor: BLANC3, borderColor: BLANC3, color: NOIR3, transform: { y: -4 } }, focus: BLANC3, police: S.head, suivi: "0.06em", poids: "400" }), 4000);
    const mot = G.colonne(k, [caps(k, "Studio Prêt Joueur", { couleur: BLANC3, suivi: "0.26em", poids: "800" }), texte(k, "Jeux indépendants, mises à jour régulières, une équipe qui lit vos retours.", { couleur: "#d4cfc8", taille: 17, largeur: "320px" }), cta], { poids: 1.6, min: "260px", gap: "18px" });
    const milieu = G.bande(k, [mot, colLiens(k, "Jeux", [["Nos jeux", "/catalogue"], ["Journal de développement", "/blog"], ["Aide", "/faq"]], tt), colLiens(k, "Studio", [["Presse", "/contact"], ["Recrutement", "/contact"], ["Contact", "/contact"]], tt)], { fond: NOIR3, gap: "32px 56px", aligne: "flex-start", padV: ["16px", "16px", "12px"], padB: ["36px", "32px", "28px"], padH: PH, nom: "Mot et colonnes" });
    const reseaux = G.reseauxTexte([["YouTube", "https://www.youtube.com/"], ["Discord", "https://discord.com/"], ["Instagram", "https://www.instagram.com/"]], { taille: 15, poids: "700", couleur: BLANC3, survol: ORANGE, focus: ORANGE })(k, env);
    const bas = G.bande(k, [reseaux, MENTIONS(G, k, env, { couleur: "#d4cfc8", liens: BLANC3 })], { fond: NOIR3, colonne: true, gap: "6px", padV: ["8px", "8px", "8px"], padB: ["28px", "24px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [halo, milieu, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-371 « Carte du jeu » — communauté de joueurs. Capture « Timon » : à droite un RELIEF EN TERRASSES 3D (gâteau de niveaux, chemin pointillé, cinq jalons carrés) avec étiquettes flottantes ; à gauche la grande phrase et la liste des cinq niveaux.
const frise = identite({
  key: "i371", label: "Marine, glacier et ambre", humeur: "dark",
  fond: "#ffb000", texte: "#0a2a43", discret: "#3a2a00", accent: "#0a2a43", surface: "#ffd060", encre: "#0a2a43", surEncre: "#e8f1f6",
  police: "font.albert-sans", titres: "font.oxanium",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#e8f1f644",
});
const GLACE = "#e8f1f6", MARINE2 = "#0a2a43", MARINE0 = "#071b2e", AMBRE = "#ffb000";
const carteDuJeu = modeleV2({
  id: identifiantV2(371, "carte-du-jeu"), concept: "c-371-carte-du-jeu", name: "Carte du jeu", family: FAM,
  description: "Pour une communauté de joueurs : un relief en terrasses dessiné en 3D (chemin et cinq jalons) avec étiquettes flottantes, la liste des cinq niveaux à gauche, bande ambre en bas. Marine, glacier et ambre.",
  tags: ["communauté", "relief 3D", "carte", "niveaux", "illustration", "marine", "ambre", "angles droits"],
  identity: frise, racine: racineDe(AMBRE),
  widgets: ["html", "text", "link", "divider", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const etape = (n, titre, url) => {
      const c = k.row([souffle(carre(k, AMBRE, "16px"), 3400 + n * 200), k.T(`<p>0${n}</p>`, { fontFamily: S.head, fontSize: "26px", lineHeight: 1, fontWeight: "700", color: AMBRE }), lien(k, titre, url, { taille: 22, poids: "700", couleur: GLACE, survol: { color: AMBRE, transform: { x: 6 } }, focus: AMBRE })], { alignItems: "center", flexWrap: "nowrap", gap: "16px", width: "100%", paddingTop: "10px", paddingBottom: "10px", boxSizing: "border-box", transitionDuration: DOUX, borderRadius: "0px" });
      return c;
    };
    const liste = k.col([etape(1, "Découvrir", "/catalogue"), trait(k, "#e8f1f655"), etape(2, "Jouer", "/faq"), trait(k, "#e8f1f655"), etape(3, "Rejoindre", "/inscription"), trait(k, "#e8f1f655"), etape(4, "Concourir", "/blog"), trait(k, "#e8f1f655"), etape(5, "Contribuer", "/contact")], { width: "100%", gap: "0px" });
    const titre = G.geant(`<p>La carte<br>du jeu</p>`, { taille: [40, 84], tablette: { taille: [44, 64] }, mobile: { taille: [38, 48] }, lh: 1, suivi: "-0.01em", poids: "700", police: S.head, couleur: GLACE })(k, env);
    const gauche = G.colonne(k, [caps(k, "Communauté Carte du jeu", { couleur: AMBRE, suivi: "0.22em" }), titre, liste], { poids: 1, min: "300px", gap: "28px" });
    const cc = I.cartes([[14, 60, -7, 230, 60, AMBRE], [20, 460, 5, 230, 60, "#6fd0ff"]], { fond: MARINE2, bord: AMBRE, trait: GLACE });
    const grand = I.terraces("e", 700, 560, { cx: 400, by: 410, rx0: 270, N: 8, dh: 38, bg: MARINE0, mur: ["#0e3a5c", "#2a7aa8"], dessus: ["#134d78", "#9fdcff"], contour: "#bfe6ff", jalon: AMBRE, cartes: cc });
    const petit = I.terraces("f", 390, 330, { cx: 210, by: 250, rx0: 150, N: 7, dh: 24, bg: MARINE0, mur: ["#0e3a5c", "#2a7aa8"], dessus: ["#134d78", "#9fdcff"], contour: "#bfe6ff", jalon: AMBRE, cartes: I.cartes([[4, 14, -6, 170, 48, AMBRE]], { fond: MARINE2, bord: AMBRE, trait: GLACE }) });
    const objet = G.colonne(k, I.dessin(k, grand, petit, {}), { poids: 1, min: "300px", aligne: "stretch" });
    const haut = G.bande(k, [gauche, objet], { fond: MARINE0, gap: "24px 40px", aligne: "center", padV: ["64px", "52px", "40px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Niveaux et relief" });
    const bas = G.bande(k, [k.T(`<p>Communauté Carte du jeu</p>`, { fontFamily: S.head, fontSize: "18px", fontWeight: "700", color: MARINE2 }), MENTIONS(G, k, env, { couleur: "#3a2a00", liens: MARINE2 }), icones(k, env, { couleur: AMBRE, fond: MARINE2, survolFond: "#ffffff", survolCouleur: MARINE2 })], { fond: AMBRE, gap: "14px 32px", aligne: "center", padV: ["22px", "20px", "20px"], padB: ["22px", "20px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-372 « Terminal Quartz » — équipe d'esport. Capture « Timon » : un CRISTAL 3D à facettes sur grille de sol, avec étiquettes flottantes, à droite ; à gauche la fenêtre de terminal (lignes de commande, lettre) ; bande menthe en bas.
const terminal = identite({
  key: "i372", label: "Vert terminal et menthe", humeur: "dark",
  fond: "#4dffa6", texte: "#06301d", discret: "#06301d", accent: "#06301d", surface: "#9cf5cd", encre: "#0b130e", surEncre: "#d6ffe9",
  police: "font.jetbrains-mono", titres: "font.jetbrains-mono",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "500", bordure: "0px", ligne: "#4dffa644",
});
const TERM = "#06100a", TERM2 = "#101c15", MENTHE = "#4dffa6";
const terminalQuartz = modeleV2({
  id: identifiantV2(372, "terminal-quartz"), concept: "c-372-terminal-quartz", name: "Terminal Quartz", family: FAM,
  description: "Pour une équipe d'esport : un cristal 3D à facettes sur grille de sol avec étiquettes flottantes, une fenêtre de terminal à angles droits (commandes, e-mail, curseur qui bat) et une bande menthe en bas. Vert terminal et menthe.",
  tags: ["esport", "équipe", "cristal 3D", "terminal", "illustration", "vert", "menthe", "angles droits"],
  identity: terminal, racine: racineDe(MENTHE),
  widgets: ["html", "text", "link", "divider", "emailsubscribe", "social", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const titre = k.row([k.row([carre(k, TERM, "10px"), carre(k, TERM, "10px"), carre(k, TERM, "10px")], { gap: "6px", flexWrap: "nowrap" }), caps(k, "quartz@equipe — pied de page", { couleur: TERM, suivi: "0.04em", casse: false, taille: "13px", poids: "700" })], { gap: "16px", alignItems: "center", flexWrap: "nowrap", width: "100%", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "16px", paddingRight: "16px", backgroundColor: MENTHE, boxSizing: "border-box" });
    const cmd = (t, u, desc) => {
      const l = lien(k, `> ${t}`, u, { taille: 17, poids: "600", couleur: MENTHE, h: "44px", padH: "10px", survol: { backgroundColor: MENTHE, color: TERM, transform: { x: 6 } }, focus: "#d6ffe9" });
      return k.row([l, texte(k, `# ${desc}`, { couleur: "#8fb8a2", taille: 14 })], { alignItems: "center", rowGap: "4px", columnGap: "16px", width: "100%" });
    };
    const lignes = k.col([caps(k, "$ ls pages/", { couleur: "#d6ffe9", casse: false, suivi: "0", taille: "15px", poids: "700" }), cmd("actualites", "/blog", "résultats et annonces"), cmd("calendrier", "/blog", "matchs et tournois"), cmd("effectif", "/blog", "joueuses et joueurs"), cmd("partenaires", "/contact", "nous soutenir"), cmd("aide", "/faq", "questions fréquentes")], { gap: "0px", width: "100%" });
    const abo = abonnement(k, env, { titre: "$ subscribe --lettre", intro: "Résultats et calendrier, un message par mois.", bouton: "ENTRÉE", largeur: "420px", accent: MENTHE, texte: "#d6ffe9", couleurTitre: MENTHE, couleurIntro: "#9cc9b0", texteBouton: TERM, survolBouton: "#d6ffe9", survolTexte: TERM, policeChamp: S.font, tailleChamp: "15px" });
    const invite = k.row([caps(k, "$", { couleur: "#d6ffe9", casse: false, taille: "15px", poids: "700" }), souffle(k.col([], { width: "12px", height: "22px", backgroundColor: MENTHE }), 1800)], { gap: "8px", alignItems: "center" });
    const corps = k.col([lignes, trait(k, "#1d5a3f"), abo, invite], { gap: "22px", width: "100%", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "20px", paddingRight: "20px", boxSizing: "border-box", backgroundColor: TERM2 });
    const fenetre = k.col([titre, corps], { flexGrow: 1.4, flexBasis: "0px", minWidth: "300px", gap: "0px", borderStyle: "solid", borderWidth: "2px", borderColor: MENTHE, borderRadius: "0px", boxSizing: "border-box" });
    const cc = I.cartes([[10, 70, -8, 230, 60, MENTHE], [90, 150, 5, 230, 60, "#d6ffe9"]], { fond: "#0b1a12", bord: MENTHE, trait: "#d6ffe9" });
    const grand = I.crystal("q", 520, 560, { bg: ["#06100a", "#06100a"], halo: "#2fdc8f", f: ["#0f5a3a", "#1d9a63", "#4dffa6", "#c9ffe6"], cartes: cc });
    const petit = I.crystal("r", 390, 330, { bg: ["#06100a", "#06100a"], halo: "#2fdc8f", f: ["#0f5a3a", "#1d9a63", "#4dffa6", "#c9ffe6"], cartes: I.cartes([[8, 40, -7, 190, 52, MENTHE]], { fond: "#0b1a12", bord: MENTHE, trait: "#d6ffe9" }) });
    const objet = G.colonne(k, I.dessin(k, grand, petit, {}), { poids: 1, min: "280px", aligne: "stretch" });
    const haut = G.bande(k, [fenetre, objet], { fond: TERM, gap: "24px 36px", aligne: "center", padV: ["64px", "52px", "36px"], padB: ["32px", "28px", "24px"], padH: PH, nom: "Fenêtre et cristal" });
    const bas = G.bande(k, [caps(k, "Équipe Quartz", { couleur: TERM, suivi: "0.2em" }), MENTIONS(G, k, env, { couleur: "#06301d", liens: TERM }), icones(k, env, { couleur: MENTHE, fond: TERM, survolFond: "#ffffff", survolCouleur: TERM })], { fond: MENTHE, gap: "14px 32px", aligne: "center", padV: ["22px", "20px", "20px"], padB: ["22px", "20px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [haut, bas])];
  },
}, FAM);

// ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// ft2-373 « Next level » — éditeur de jeux mobiles. Capture « Amplifyed » : halo rose, jaune et violet sur nuit, NEXT LEVEL géant, et un ESCALIER dessiné (quatre marches de couleurs) que gravit un petit personnage vers une étoile.
const escalier = identite({
  key: "i373", label: "Nuit violette, rose, jaune", humeur: "dark",
  fond: "#150a33", texte: "#fff4e0", discret: "#d9cdf5", accent: "#ffd23f", surface: "#1f1148", encre: "#111111", surEncre: "#ffffff",
  police: "font.mulish", titres: "font.bowlby-one",
  rayon: "0px", rayonBouton: "0px", ombre: "none", poids: "600", bordure: "0px", ligne: "#fff4e033",
});
const NOIR4 = "#111111", ROSE = "#ff3d8b", JAUNE4 = "#ffd23f", VIOLET4 = "#5b3df5", NUIT4 = "#150a33";
const nextLevel = modeleV2({
  id: identifiantV2(373, "next-level"), concept: "c-373-next-level", name: "Next level", family: FAM,
  description: "Pour un éditeur de jeux mobiles : halo rose, jaune et violet sur nuit, NEXT LEVEL géant et un escalier dessiné de quatre marches qu'un petit personnage gravit vers une étoile ; lettre d'information et liens dessous.",
  tags: ["jeux mobiles", "halo lumineux", "escalier", "illustration", "rose", "jaune", "violet", "lettre d'information", "angles droits"],
  identity: escalier, racine: racineDe("#0d0620"),
  widgets: ["html", "text", "link", "emailsubscribe", "copyright", "bizlegal"],
  compose(k, env, G) {
    const S = k.S;
    const abo = abonnement(k, env, { titre: "Les nouveautés", intro: "Mises à jour et sorties, sans spam.", bouton: "Je m'abonne", largeur: "460px", accent: JAUNE4, texte: "#fff4e0", couleurTitre: JAUNE4, couleurIntro: "#d9cdf5", texteBouton: NOIR4, survolBouton: ROSE, survolTexte: "#ffffff" });
    const phrase = G.geant(`<p>Des petits jeux,<br>des <span style="color:#ff3d8b">grands</span> moments.</p>`, { taille: [34, 68], tablette: { taille: [40, 56] }, mobile: { taille: [32, 42] }, lh: 1.05, suivi: "0", poids: "400", police: S.head, couleur: "#fff4e0" })(k, env);
    const cta = souffle(bouton(k, "Voir nos jeux", "/catalogue", { texte: NOIR4, fond: JAUNE4, bord: JAUNE4, casse: false, poids: "800", suivi: "0.02em", survol: { backgroundColor: ROSE, borderColor: ROSE, color: "#ffffff", transform: { y: -3 } }, focus: "#ffffff", police: S.font }), 4200);
    const haut = G.bande(k, [G.colonne(k, [phrase, cta], { poids: 1.2, min: "300px", gap: "26px" }), G.colonne(k, [abo], { poids: 1, min: "280px" })], { fond: NUIT4, gap: "32px 56px", aligne: "flex-end", padV: ["64px", "52px", "40px"], padB: ["40px", "32px", "28px"], padH: PH, nom: "Phrase et lettre" });
    const marches = (w, h, ty, etire) => {
      const s = w / 1440, bx = w * 0.56; let st = "";
      const cols = [ROSE, NOIR4, JAUNE4, VIOLET4];
      for (let i = 0; i < 4; i++) { const sw = w * 0.11, sh = (i + 1) * h * 0.1, x = bx + i * sw; st += `<rect x="${I.r1(x)}" y="${I.r1(h - sh)}" width="${I.r1(sw)}" height="${I.r1(sh)}" fill="${cols[i]}"/><rect x="${I.r1(x)}" y="${I.r1(h - sh)}" width="${I.r1(sw)}" height="${I.r1(6 * Math.max(0.5, s * 1.4))}" fill="#ffffff" opacity="0.55"/>`; }
      const px = bx + w * 0.22, py = h - 3 * h * 0.1, u = 22 * Math.max(0.6, s * 1.5);
      const hero = `<rect x="${I.r1(px)}" y="${I.r1(py - 2 * u)}" width="${I.r1(u)}" height="${I.r1(1.3 * u)}" fill="#ffffff"/><rect x="${I.r1(px - u * 0.15)}" y="${I.r1(py - 3.2 * u)}" width="${I.r1(1.3 * u)}" height="${I.r1(1.2 * u)}" fill="${ROSE}"/><rect x="${I.r1(px + u * 0.5)}" y="${I.r1(py - 2.8 * u)}" width="${I.r1(u * 0.3)}" height="${I.r1(u * 0.3)}" fill="#111111"/><rect x="${I.r1(px)}" y="${I.r1(py - 0.7 * u)}" width="${I.r1(0.4 * u)}" height="${I.r1(0.7 * u)}" fill="#ffffff"/><rect x="${I.r1(px + 0.6 * u)}" y="${I.r1(py - 0.7 * u)}" width="${I.r1(0.4 * u)}" height="${I.r1(0.7 * u)}" fill="#ffffff"/>`;
      const sx = bx + 3.3 * w * 0.11, sy = h * 0.12, R = h * 0.09, pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? R * 0.45 : R; return `${I.r1(sx + rr * Math.cos(a))},${I.r1(sy + rr * Math.sin(a))}`; }).join(" ");
      return I.glow("n", w, h, { bg: ["#150a33", "#0d0620"], blobs: [[w * 0.18, h * 0.55, w * 0.3, h * 0.7, "#ff3d8b", 0.8], [w * 0.38, h * 0.8, w * 0.22, h * 0.45, "#ffd23f", 0.6], [w * 0.7, h * 0.4, w * 0.3, h * 0.6, "#5b3df5", 0.65]], stries: { c: "#ffb3d5", op: 0.25, n: 60, x0: 0, x1: w * 0.7, foyer: [w * 0.2, h * 0.6] }, graine: 373,
        mot: "NEXT LEVEL", mot_y: ty, mot_l: w * 0.52, mot_x: w * 0.04, etire, trait: 32, gap: 24, mot_fill: ["#ffffff", "#ffd2e6", 0.25], apres: st + hero + `<polygon points="${pts}" fill="${JAUNE4}"/>` });
    };
    const scene = bandeSvg(G, k, marches(1440, 520, 470, 2.3), marches(390, 300, 130, 1.2), "#0d0620", {}, "Halo, nom géant et escalier");
    const tt = { c: "#fff4e0", h: JAUNE4, t: JAUNE4, tt: "12px", suivi: "0.2em", min: "150px", poids: 1 };
    const liens = G.bande(k, [colLiens(k, "Jeux", [["Nos jeux", "/catalogue"], ["Actualités", "/blog"]], tt), colLiens(k, "Aide et réseaux", [["Questions", "/faq"], ["Presse", "/contact"], ["YouTube", "https://www.youtube.com/"], ["Instagram", "https://www.instagram.com/"]], tt)], { fond: "#0d0620", gap: "24px 48px", aligne: "flex-start", padV: ["28px", "24px", "20px"], padB: ["12px", "12px", "12px"], padH: PH, nom: "Liens" });
    const bas = G.bande(k, [MENTIONS(G, k, env, { couleur: "#d9cdf5", liens: "#fff4e0" })], { fond: "#0d0620", colonne: true, padV: ["8px", "8px", "8px"], padB: ["26px", "22px", "20px"], padH: PH, nom: "Mentions" });
    return [G.racine(k, [scene, haut, liens, bas])];
  },
}, FAM);

module.exports = {
  key: FAM, label: "Jeux vidéo et esport", target: 6, built: true,
  description: "Pieds illustrés inspirés de captures, angles droits, animations fluides : média de jeux, plateforme, studio indépendant, communauté, équipe d'esport, jeux mobiles. Pixel art, anneau néon, halos lumineux, relief et cristal 3D.",
  models: [superCases, barreHud, pretJoueur, carteDuJeu, terminalQuartz, nextLevel],
};
