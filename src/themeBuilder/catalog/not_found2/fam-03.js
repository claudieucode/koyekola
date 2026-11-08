// Famille 3 — Technologiques (8 modèles) : terminal, glitch, radar, fenêtre système, grille néon, démarrage BIOS, circuit, matrice.
const { skin, MSG, WHY, deco, stage, LK, U, shape, W, draw, popular } = require("./h");
const A = require("./art");
const S_TERM = skin("terminal", "Console verte", { bg: "#0a0f0a", fg: "#b6f5b6", mute: "#6fbf73", alt: "#101a10", accent: "#39ff14", onAccent: "#0a0f0a", line: "#1f3a1f", font: "font.jetbrains-mono", head: "font.jetbrains-mono", weight: "600", btn: "outline" });
const S_GLITCH = skin("glitch", "Néon sombre", { bg: "#0b0b14", fg: "#f4f4ff", mute: "#9a9ab8", alt: "#15152a", accent: "#00e5ff", onAccent: "#0b0b14", line: "#2a2a4a", font: "font.share-tech-mono", head: "font.orbitron", weight: "700", btn: "outline" });
const S_RADAR = skin("radar", "Vert radar", { bg: "#04140d", fg: "#c8ffe6", mute: "#5fbf95", alt: "#082a1c", accent: "#00ff9c", onAccent: "#04140d", line: "#0d4a33", font: "font.ibm-plex-mono", head: "font.ibm-plex-mono", weight: "600", btn: "outline" });
const S_FENETRE = skin("fenetre", "Système clair", { bg: "#c0c7d4", fg: "#111827", mute: "#374151", alt: "#f3f4f6", accent: "#1d4ed8", onAccent: "#ffffff", line: "#111827", font: "font.ibm-plex-sans", head: "font.ibm-plex-sans", weight: "600", btn: "solid" });
const S_GRILLE = skin("grille", "Synthwave", { bg: "#1a0b3b", fg: "#ffe8ff", mute: "#c9a6ff", alt: "#2a1260", accent: "#ff2bd6", onAccent: "#1a0b3b", line: "#6d28d9", font: "font.rajdhani", head: "font.audiowide", weight: "400", btn: "outline" });
const S_BIOS = skin("bios", "BIOS bleu", { bg: "#0000aa", fg: "#ffffff", mute: "#c0c0ff", alt: "#0000cc", accent: "#ffff55", onAccent: "#0000aa", line: "#aaaaaa", font: "font.vt323", head: "font.vt323", weight: "400", btn: "outline" });
const S_CIRCUIT = skin("circuit", "Cuivre et vert", { bg: "#06281f", fg: "#e6fff7", mute: "#8fd9c0", alt: "#0a3a2d", accent: "#f0b429", onAccent: "#06281f", line: "#127a5c", font: "font.exo-2", head: "font.exo-2", weight: "700", btn: "solid" });
const S_MATRICE = skin("matrice", "Pluie numérique", { bg: "#000000", fg: "#7dff7d", mute: "#3fa83f", alt: "#041004", accent: "#7dff7d", onAccent: "#000000", line: "#0f3d0f", font: "font.source-code-pro", head: "font.source-code-pro", weight: "700", btn: "outline" });
const prompt = (k, t, st = {}) => k.T(`<p>${t}</p>`, { fontFamily: k.S.font, color: k.S.mute, fontSize: "16px", ...st });

module.exports = [
  { key: "terminal", family: "technologiques", skin: S_TERM, name: "Terminal", tags: ["tech", "console", "commandes"],
    desc: "Une console : la commande tapée en direct, l'erreur 404 et les sorties présentées comme des commandes.", decl: { C: 7, N: 10, P: 2, T: 3 },
    build: (k) => [stage(k, [k.card([
      W(k, "motiontypewriter", { prefix: "$ ", phrases: [{ text: "ouvrir page-demandee --code 404" }], suffix: "", tag: "p", cursor: "block" }, { color: "#39ff14", fontSize: "20px", fontFamily: "font.jetbrains-mono", fontWeight: "600" }),
      k.H("erreur : " + MSG.toLowerCase(), "1", { fontSize: "26px", color: "#ff5f56", fontFamily: "font.jetbrains-mono" }),
      prompt(k, "# " + WHY),
      k.col([prompt(k, "$ cd ~/", { color: "#b6f5b6" }), U(k, "~/accueil", "/", { fontSize: "18px" }), U(k, "~/blog", "/blog", { fontSize: "18px" }), U(k, "~/catalogue", "/catalogue", { fontSize: "18px" }), U(k, "~/contact", "/contact", { fontSize: "18px" })], { gap: "8px" }),
    ], { backgroundColor: "#0a0f0a", borderStyle: "solid", borderWidth: "1px", borderColor: "#1f3a1f", maxWidth: "760px", width: "100%", marginLeft: "auto", marginRight: "auto", gap: "18px", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px" })], { gap: "0px" })] },

  { key: "glitch", family: "technologiques", skin: S_GLITCH, name: "Glitch", tags: ["tech", "glitch", "néon"],
    desc: "Le 404 est dédoublé en rouge et cyan comme un signal vidéo abîmé ; le message se brouille puis se stabilise.", decl: { C: 1, N: 8, P: 6, T: 4 },
    build: (k) => [stage(k, [k.col([
      k.col([
        deco("404", { fontSize: "24vw", fontFamily: "font.orbitron", fontWeight: "700", color: "#00e5ff", mixBlendMode: "screen", lineHeight: 0.8, letterSpacing: "0.02em", textAlign: "center", marginLeft: "-1.4vw" }),
        deco("404", { fontSize: "24vw", fontFamily: "font.orbitron", fontWeight: "700", color: "#ff2a6d", mixBlendMode: "screen", lineHeight: 0.8, letterSpacing: "0.02em", textAlign: "center", marginTop: "-19vw", marginLeft: "1.4vw" }),
        deco("404", { fontSize: "24vw", fontFamily: "font.orbitron", fontWeight: "700", color: "#f4f4ff", opacity: 0.85, lineHeight: 0.8, letterSpacing: "0.02em", textAlign: "center", marginTop: "-19vw" }),
      ], { gap: "0px", width: "100%" }),
      W(k, "motiontextscramble", { phrases: [{ text: MSG }], tag: "h1" }, { color: "#00e5ff", fontFamily: "font.share-tech-mono", fontSize: "28px", textAlign: "center" }),
      k.B("Relancer la connexion", "/", "outline", { alignSelf: "center" }),
    ], { gap: "22px", alignItems: "center", width: "100%" })], { gap: "0px" })] },

  { key: "radar", family: "technologiques", skin: S_RADAR, name: "Radar", tags: ["tech", "radar", "plan"],
    desc: "Un radar qui balaie la page : aucun écho pour cette adresse ; les contacts détectés sont les pages du site.", decl: { C: 13, N: 2, P: 6, T: 3 },
    build: (k) => [stage(k, [k.row([
      draw(k, A.radar, { alt: "Radar sans écho", width: 380, stroke: 2.5, color: "#00ff9c" }, { flexBasis: "42%", flexGrow: 1, minWidth: "260px" }),
      k.col([k.L("404 — aucun écho", { color: "#5fbf95" }), k.H(MSG, "1", { fontSize: "34px" }), k.T("<p>Contacts détectés sur ce site :</p>", { color: "#5fbf95" }),
        k.menu("header", { color: "#c8ffe6" }, true), U(k, "Retour à la base", "/")], { flexBasis: "46%", flexGrow: 1, minWidth: "260px", gap: "14px" }),
    ], { alignItems: "center", gap: "40px", width: "100%" })])] },

  { key: "fenetre-systeme", family: "technologiques", skin: S_FENETRE, name: "Fenêtre système", tags: ["tech", "fenêtre", "boîte de dialogue"],
    desc: "Une boîte de dialogue d'erreur d'ancien système : barre de titre, icône, message et trois boutons.", decl: { C: 8, N: 2, P: 3, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.row([shape("12px", "12px", "#ef4444", { borderRadius: "50%" }), shape("12px", "12px", "#f59e0b", { borderRadius: "50%" }), shape("12px", "12px", "#22c55e", { borderRadius: "50%" }), k.L("Erreur — navigateur", { color: "#111827", marginLeft: "10px" })], { gap: "8px", backgroundColor: "#e5e7eb", paddingTop: "10px", paddingBottom: "10px", paddingLeft: "14px", paddingRight: "14px", borderBottomStyle: "solid", borderBottomWidth: "2px", borderColor: "#111827", flexWrap: "nowrap" }),
      k.col([k.row([deco("!", { fontSize: "56px", color: "#b91c1c", fontWeight: "800", lineHeight: 0.9 }), k.col([k.H(MSG, "1", { fontSize: "24px" }), k.T("<p>Code 404. " + WHY + "</p>", { color: "#374151" })], { gap: "6px" })], { gap: "18px", flexWrap: "nowrap", alignItems: "flex-start" }),
        k.row([k.B("Réessayer", "/", "solid"), k.B("Ouvrir le blog", "/blog", "outline"), k.B("Aide", "/contact", "outline")], { gap: "10px", justifyContent: "flex-end" })], { gap: "24px", paddingTop: "22px", paddingBottom: "18px", paddingLeft: "22px", paddingRight: "22px" }),
    ], { backgroundColor: "#f3f4f6", borderStyle: "solid", borderWidth: "2px", borderColor: "#111827", boxShadow: "lg", maxWidth: "560px", width: "100%", marginLeft: "auto", marginRight: "auto", gap: "0px" })], { gap: "0px", backgroundColor: "#c0c7d4" })] },

  { key: "grille-neon", family: "technologiques", skin: S_GRILLE, name: "Grille néon", tags: ["tech", "synthwave", "néon"],
    desc: "Un soleil couchant et une grille de perspective rétro ; le 404 brille en rose néon.", decl: { C: 4, N: 1, P: 6, T: 4 },
    build: (k) => [stage(k, [k.col([
      shape("14vw", "14vw", "#ff9e00", { borderRadius: "50%", minWidth: "80px", minHeight: "80px", alignSelf: "center" }),
      deco("404", { fontSize: "20vw", fontFamily: "font.audiowide", color: "#ff2bd6", textShadow: "glow", lineHeight: 0.85, textAlign: "center", marginTop: "-2vw" }),
      k.H(MSG, "1", { fontSize: "28px", textAlign: "center", fontFamily: "font.audiowide", textShadow: "glow" }),
      draw(k, '<svg viewBox="0 0 400 90"><path d="M0 10 H400 M0 30 H400 M0 56 H400 M0 90 H400"/><path d="M200 0 V90 M150 0 L60 90 M100 0 L-40 90 M250 0 L340 90 M300 0 L440 90" /></svg>', { alt: "", width: 640, stroke: 1.5, color: "#c9a6ff" }),
      k.B("Retour à la synthèse", "/", "outline", { alignSelf: "center" }),
    ], { gap: "10px", alignItems: "center", width: "100%" })], { gap: "0px" })] },

  { key: "boot-bios", family: "technologiques", skin: S_BIOS, name: "Boot BIOS", tags: ["tech", "rétro", "démarrage"],
    desc: "L'écran bleu d'un vieux démarrage : contrôle de la mémoire, « page demandée : introuvable » et un menu à touches.", decl: { C: 18, N: 2, P: 2, T: 6 },
    build: (k) => [stage(k, [k.col([
      k.T("<p>KOLAKISA BIOS v4.04 — (C) Tous droits réservés</p>", { fontFamily: "font.vt323", fontSize: "22px", color: "#c0c0ff" }),
      k.divider({ borderColor: "#aaaaaa", width: "100%" }),
      k.T("<p>Contrôle de la mémoire ................ OK</p><p>Page demandée ....................... INTROUVABLE</p>", { fontFamily: "font.vt323", fontSize: "26px", color: "#ffffff" }),
      k.H("ERREUR 404 : " + MSG.toUpperCase(), "1", { fontFamily: "font.vt323", fontSize: "36px", color: "#ffff55", fontWeight: "400" }),
      k.col([U(k, "[1] Redémarrer sur l'accueil", "/", { fontSize: "26px", fontFamily: "font.vt323" }), U(k, "[2] Lire le blog", "/blog", { fontSize: "26px", fontFamily: "font.vt323" }), U(k, "[3] Parcourir le catalogue", "/catalogue", { fontSize: "26px", fontFamily: "font.vt323" }), U(k, "[4] Contacter l'assistance", "/contact", { fontSize: "26px", fontFamily: "font.vt323" })], { gap: "6px" }),
    ], { gap: "14px", width: "100%", maxWidth: "820px", marginLeft: "auto", marginRight: "auto" })], { gap: "0px" })] },

  { key: "circuit-imprime", family: "technologiques", skin: S_CIRCUIT, name: "Circuit imprimé", tags: ["tech", "circuit", "schéma"],
    desc: "Un composant central relié par des pistes à six puces : chaque puce est une sortie vers une page du site.", decl: { C: 13, N: 6, P: 7, T: 3 },
    build: (k) => [stage(k, [k.col([
      k.H(MSG, "1", { fontSize: "32px", textAlign: "center" }),
      draw(k, A.circuit, { alt: "Schéma d'un circuit relié à six pages", width: 520, stroke: 2.5, color: "#f0b429" }),
      k.row([["Accueil", "/"], ["Blog", "/blog"], ["Catalogue", "/catalogue"], ["Contact", "/contact"], ["Boutique", "/boutique"], ["Compte", "/compte"]].map(([l, u]) => k.B(l, u, "outline", { fontSize: "14px" })), { gap: "10px", justifyContent: "center" }),
    ], { gap: "16px", alignItems: "center", width: "100%" })])] },

  { key: "matrice", family: "technologiques", skin: S_MATRICE, name: "Matrice", tags: ["tech", "matrice", "recherche"],
    desc: "Des lignes de caractères défilent en fond ; au centre, une recherche pour retrouver le fil.", decl: { C: 4, N: 6, P: 6, T: 3 },
    build: (k) => [stage(k, [k.col([
      W(k, "marquee", { items: [{ text: "01001010 11010 001 0110 1101" }, { text: "10 0110 0101 1001 0110" }, { text: "1100 0011 1010 0101 1111" }], speed: "slow", direction: "left", separator: "◦" }, { color: "#3fa83f", fontFamily: "font.source-code-pro", fontSize: "20px", opacity: 0.8 }),
      k.H(MSG, "1", { fontSize: "36px", textAlign: "center", marginTop: "20px" }),
      k.search("site", { maxWidth: "520px", width: "100%", alignSelf: "center" }),
      W(k, "marquee", { items: [{ text: "11 0010 1101 0001 0110 1001" }, { text: "0101 1110 0011 1000 0101" }, { text: "1010 0111 0100 1011 0010" }], speed: "slow", direction: "right", separator: "◦" }, { color: "#3fa83f", fontFamily: "font.source-code-pro", fontSize: "20px", opacity: 0.8, marginTop: "20px" }),
      U(k, "Quitter la matrice", "/", { alignSelf: "center" }),
    ], { gap: "14px", width: "100%" })], { gap: "0px" })] },
];
