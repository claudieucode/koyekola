// Famille 4 — Illustratives (8 modèles) : dessins vectoriels originaux au trait (astronaute, route, désert, ville, monstre, forêt, océan, labyrinthe).
const { skin, MSG, WHY, deco, stage, LK, U, shape, W, draw, recent, cats } = require("./h");
const A = require("./art");
const S_ASTRO = skin("astro", "Nuit étoilée", { bg: "#0f1b3d", fg: "#eef2ff", mute: "#a5b4fc", alt: "#1a2a5c", accent: "#fbbf24", onAccent: "#0f1b3d", line: "#3b4a8a", font: "font.nunito", head: "font.fredoka", weight: "600", btn: "solid", radius: "16px", btnRadius: "999px" });
const S_ROUTE = skin("route", "Campagne", { bg: "#f3ecd9", fg: "#2f3b2a", mute: "#5d6b55", alt: "#e5dcc2", accent: "#b45309", onAccent: "#ffffff", line: "#2f3b2a", font: "font.lora", head: "font.lora", weight: "700", btn: "solid" });
const S_DESERT = skin("desert", "Sable", { bg: "#f6d9a8", fg: "#5b2a12", mute: "#8a4b26", alt: "#fbe9c8", accent: "#c2410c", onAccent: "#ffffff", line: "#5b2a12", font: "font.quicksand", head: "font.abril-fatface", weight: "400", btn: "solid", btnRadius: "999px" });
const S_VILLE = skin("ville", "Nuit urbaine", { bg: "#14142b", fg: "#f1f5ff", mute: "#a0a8d0", alt: "#1e1e42", accent: "#ffd166", onAccent: "#14142b", line: "#38386e", font: "font.work-sans", head: "font.bebas-neue", weight: "400", btn: "outline" });
const S_MONSTRE = skin("monstre", "Bonbon", { bg: "#ffe8f0", fg: "#4a1d3d", mute: "#7a4a6c", alt: "#ffffff", accent: "#7c3aed", onAccent: "#ffffff", line: "#4a1d3d", font: "font.baloo-2", head: "font.baloo-2", weight: "800", btn: "solid", radius: "20px", btnRadius: "999px" });
const S_FORET = skin("foret", "Sous-bois", { bg: "#173a2a", fg: "#eaf6ee", mute: "#9fcfb0", alt: "#1f4a37", accent: "#f4a261", onAccent: "#173a2a", line: "#3f7a5a", font: "font.merriweather", head: "font.merriweather", weight: "700", btn: "solid" });
const S_OCEAN = skin("ocean", "Marine", { bg: "#e6f4f8", fg: "#0b3a53", mute: "#3d6f85", alt: "#ffffff", accent: "#0e7490", onAccent: "#ffffff", line: "#0b3a53", font: "font.mulish", head: "font.fraunces", weight: "600", btn: "solid", radius: "14px", btnRadius: "999px" });
const S_LABY = skin("labyrinthe", "Papier ligné", { bg: "#fffdf6", fg: "#1f2937", mute: "#6b7280", alt: "#f3f0e4", accent: "#dc2626", onAccent: "#ffffff", line: "#1f2937", font: "font.patrick-hand", head: "font.patrick-hand", weight: "400", btn: "solid" });

module.exports = [
  { key: "astronaute-perdu", family: "illustratives", skin: S_ASTRO, name: "Astronaute perdu", tags: ["illustration", "espace", "humour"],
    desc: "Un astronaute flotte près d'une planète à anneau : la page est partie en orbite, le bouton sert de capsule de retour.", decl: { C: 2, N: 4, P: 2, T: 8 },
    build: (k) => [stage(k, [k.row([
      draw(k, A.planete, { alt: "Un astronaute flottant près d'une planète à anneau", width: 440, stroke: 2.6, color: "#fbbf24" }, { flexBasis: "52%", flexGrow: 1, minWidth: "280px" }),
      k.col([k.L("Erreur 404", { color: "#a5b4fc" }), k.H("Houston, cette page est introuvable", "1", { fontSize: "40px", lineHeight: 1.1 }), k.T("<p>" + WHY + " L'astronaute vous attend à l'accueil.</p>"), k.B("Revenir sur Terre", "/", "solid")], { flexBasis: "40%", flexGrow: 1, minWidth: "260px", gap: "16px" }),
    ], { alignItems: "center", gap: "32px", width: "100%" })])] },

  { key: "chemin-interrompu", family: "illustratives", skin: S_ROUTE, name: "Chemin interrompu", tags: ["illustration", "route", "panneaux"],
    desc: "Une route coupée par un panneau ; les trois directions possibles sont des panneaux cliquables.", decl: { C: 3, N: 6, P: 7, T: 2 },
    build: (k) => [stage(k, [k.row([
      k.col([k.H("Route barrée : " + MSG.toLowerCase(), "1", { fontSize: "36px", lineHeight: 1.15 }), k.T("<p>" + WHY + " Suivez un panneau.</p>"),
        k.col([k.B("→ Accueil", "/", "solid", { width: "260px", justifyContent: "flex-start" }), k.B("→ Blog", "/blog", "outline", { width: "260px", justifyContent: "flex-start" }), k.B("→ Contact", "/contact", "outline", { width: "260px", justifyContent: "flex-start" })], { gap: "10px" })], { flexBasis: "44%", flexGrow: 1, minWidth: "280px", gap: "16px" }),
      draw(k, A.route, { alt: "Une route coupée par un panneau", width: 480, stroke: 3, color: "#2f3b2a" }, { flexBasis: "48%", flexGrow: 1, minWidth: "280px" }),
    ], { alignItems: "center", gap: "32px", width: "100%" })])] },

  { key: "desert", family: "illustratives", skin: S_DESERT, name: "Désert", tags: ["illustration", "désert", "oasis"],
    desc: "Dunes, soleil et cactus ; au milieu du désert, un seul point d'eau : le bouton de l'accueil.", decl: { C: 4, N: 6, P: 7, T: 5 },
    build: (k) => [stage(k, [k.col([
      draw(k, A.dunes, { alt: "Des dunes, un soleil et un cactus", width: 620, stroke: 3.2, color: "#5b2a12" }),
      k.H("Rien à l'horizon…", "1", { fontSize: "52px", textAlign: "center", fontFamily: "font.abril-fatface" }),
      k.T("<p>" + MSG + ". " + WHY + "</p>", { textAlign: "center", maxWidth: "520px", alignSelf: "center" }),
      k.B("Marcher jusqu'à l'oasis", "/", "solid", { alignSelf: "center" }),
    ], { gap: "14px", alignItems: "center", width: "100%" })])] },

  { key: "ville-imaginaire", family: "illustratives", skin: S_VILLE, name: "Ville imaginaire", tags: ["illustration", "ville", "horizon"],
    desc: "Une ligne d'horizon de gratte-ciel dessinée au trait ; chaque fenêtre éclairée en dessous est une sortie.", decl: { C: 12, N: 1, P: 2, T: 4 },
    build: (k) => [stage(k, [k.col([
      deco("404", { fontSize: "14vw", fontFamily: "font.bebas-neue", color: "#ffd166", fontWeight: "400", lineHeight: 0.85, textAlign: "center" }),
      draw(k, A.ville, { alt: "Les toits d'une ville la nuit", width: 900, stroke: 2.4, color: "#f1f5ff" }),
      k.H(MSG + " dans cette ville", "1", { fontSize: "34px", textAlign: "center", fontFamily: "font.bebas-neue", letterSpacing: "2px" }),
      k.grid(4, [["Accueil", "/"], ["Blog", "/blog"], ["Catalogue", "/catalogue"], ["Contact", "/contact"]].map(([l, u]) => k.card([LK(k, l, u, { color: "#ffd166" })], { alignItems: "center", backgroundColor: "#1e1e42" })), { gap: "12px", width: "100%", maxWidth: "760px", alignSelf: "center" }),
    ], { gap: "14px", width: "100%" })])] },

  { key: "monstre-gentil", family: "illustratives", skin: S_MONSTRE, name: "Monstre gentil", tags: ["illustration", "humour", "personnage"],
    desc: "Un monstre rond et souriant brandit un panneau « 404 » ; ton drôle, retour rapide à l'accueil.", decl: { C: 2, N: 3, P: 5, T: 8 },
    build: (k) => [stage(k, [k.row([
      k.col([k.H("Oups ! Le monstre a mangé la page", "1", { fontSize: "40px", lineHeight: 1.1 }), k.T("<p>" + MSG + " (erreur 404). " + WHY + "</p>"), k.row([k.B("On la cherche ailleurs", "/", "solid"), k.B("Parler au monstre", "/contact", "outline")], { gap: "12px" })], { flexBasis: "46%", flexGrow: 1, minWidth: "260px", gap: "16px" }),
      draw(k, A.monstre, { alt: "Un monstre rond tenant un panneau", width: 340, stroke: 3.4, color: "#7c3aed" }, { flexBasis: "42%", flexGrow: 1, minWidth: "240px" }),
    ], { alignItems: "center", gap: "32px", width: "100%" })])] },

  { key: "foret-enchantee", family: "illustratives", skin: S_FORET, name: "Forêt enchantée", tags: ["illustration", "forêt", "catégories"],
    desc: "Une forêt dessinée au trait ; les sentiers qui s'ouvrent entre les arbres sont les catégories du blog.", decl: { C: 13, N: 6, P: 7, T: 2 },
    build: (k) => [stage(k, [k.col([
      draw(k, A.foret, { alt: "Une forêt de sapins", width: 620, stroke: 3, color: "#9fcfb0" }),
      k.H("Vous vous êtes égaré(e) dans la forêt", "1", { fontSize: "36px", textAlign: "center" }),
      k.T("<p>" + MSG + ". Choisissez un sentier :</p>", { textAlign: "center" }),
      cats(k, "", { title: "" }),
      U(k, "Rejoindre la clairière (accueil)", "/", { alignSelf: "center" }),
    ], { gap: "14px", alignItems: "center", width: "100%" })])] },

  { key: "ocean", family: "illustratives", skin: S_OCEAN, name: "Océan", tags: ["illustration", "mer", "message"],
    desc: "Des vagues dessinées et une bouteille à la mer : le message est dedans, le lien aussi.", decl: { C: 3, N: 6, P: 5, T: 2 },
    build: (k) => [stage(k, [k.row([
      draw(k, A.ocean, { alt: "Une bouteille flottant sur les vagues", width: 460, stroke: 3, color: "#0e7490" }, { flexBasis: "46%", flexGrow: 1, minWidth: "280px" }),
      k.card([k.L("Message trouvé en mer"), k.H("« La page que vous cherchez est introuvable »", "1", { fontSize: "30px", fontFamily: "font.fraunces", lineHeight: 1.2 }), k.T("<p>" + WHY + "</p>"), recent(k, "Pêchez plutôt ceci", 3), k.B("Revenir au port", "/", "solid")], { flexBasis: "44%", flexGrow: 1, minWidth: "280px", gap: "14px", backgroundColor: "#ffffff" }),
    ], { alignItems: "center", gap: "32px", width: "100%" })])] },

  { key: "labyrinthe", family: "illustratives", skin: S_LABY, name: "Labyrinthe", tags: ["illustration", "jeu", "sortie"],
    desc: "Un labyrinthe dessiné à la main ; la sortie est le bouton rouge — ou le plan du site à droite.", decl: { C: 11, N: 3, P: 1, T: 5 },
    build: (k) => [stage(k, [k.row([
      draw(k, A.labyrinthe, { alt: "Un labyrinthe", width: 320, stroke: 3, color: "#1f2937" }, { flexBasis: "34%", flexGrow: 0, minWidth: "240px" }),
      k.col([k.H("Vous êtes dans le labyrinthe des pages perdues", "1", { fontSize: "34px", lineHeight: 1.15 }), k.T("<p>4 · 0 · 4 : trois virages, une impasse. " + WHY + "</p>"),
        k.col([k.row([k.L("1."), U(k, "Retourner à l'entrée (accueil)", "/")], { gap: "8px" }), k.row([k.L("2."), U(k, "Demander son chemin (contact)", "/contact")], { gap: "8px" }), k.row([k.L("3."), U(k, "Lire les cartes du blog", "/blog")], { gap: "8px" })], { gap: "8px" }), k.B("Sortie", "/", "solid", { backgroundColor: "#dc2626", alignSelf: "flex-start" })], { flexBasis: "52%", flexGrow: 1, minWidth: "280px", gap: "16px" }),
    ], { alignItems: "center", gap: "36px", width: "100%" })])] },
];
