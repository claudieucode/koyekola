// Famille 2 — Créatives et artistiques (7 modèles) : typographie éclatée, collage, géométrie, superpositions, aquarelle, constructivisme, mosaïque.
const { skin, MSG, WHY, deco, stage, LK, U, shape, W, NAV } = require("./h");
const S_ECLAT = skin("eclat", "Corail et encre", { bg: "#ff5a36", fg: "#1b1b1b", mute: "#3a1a12", alt: "#ffd9cf", accent: "#1b1b1b", onAccent: "#ffffff", line: "#1b1b1b", font: "font.dm-sans", head: "font.playfair-display", weight: "800", btn: "solid" });
const S_COLLAGE = skin("collage", "Papier kraft", { bg: "#e8dcc4", fg: "#2b2118", mute: "#6b5a44", alt: "#f6efe0", accent: "#c8432b", onAccent: "#ffffff", line: "#2b2118", font: "font.space-grotesk", head: "font.rubik", weight: "700", btn: "solid" });
const S_BAU = skin("bauhaus", "Primaires", { bg: "#f5f0e6", fg: "#111111", mute: "#444444", alt: "#ffffff", accent: "#d62828", onAccent: "#ffffff", line: "#111111", font: "font.jost", head: "font.jost", weight: "700", btn: "solid" });
const S_SUPER = skin("super", "Trichromie", { bg: "#fffdf5", fg: "#14213d", mute: "#4a5568", alt: "#ffffff", accent: "#14213d", onAccent: "#fffdf5", line: "#14213d", font: "font.inter", head: "font.archivo-black", weight: "400", btn: "outline" });
const S_AQUA = skin("aquarelle", "Aquarelle", { bg: "#fbf7f2", fg: "#3b3a4a", mute: "#6f6d80", alt: "#ffffff", accent: "#7b6cf6", onAccent: "#ffffff", line: "#d9d3e8", font: "font.nunito", head: "font.caveat", weight: "700", btn: "solid", radius: "24px", btnRadius: "999px" });
const S_CONSTR = skin("constructiviste", "Rouge et noir", { bg: "#f2ead8", fg: "#111111", mute: "#333333", alt: "#111111", accent: "#c1121f", onAccent: "#ffffff", line: "#111111", font: "font.oswald", head: "font.oswald", weight: "700", caps: "uppercase", track: "2px", btn: "solid" });
const S_MOSA = skin("mosaique", "Mosaïque", { bg: "#101828", fg: "#ffffff", mute: "#cbd5e1", alt: "#1d2939", accent: "#ffd166", onAccent: "#101828", line: "#334155", font: "font.poppins", head: "font.poppins", weight: "700", btn: "solid" });
const big = (t, st) => deco(t, { fontWeight: "800", lineHeight: 0.8, letterSpacing: "-0.04em", ...st });

module.exports = [
  { key: "typographie-eclatee", family: "creatives", skin: S_ECLAT, name: "Typographie éclatée", tags: ["créatif", "typographie", "escalier"],
    desc: "Les trois chiffres du 404 descendent en escalier à des tailles différentes ; le message se glisse dans le vide.", decl: { C: 10, N: 3, P: 4, T: 2 },
    build: (k) => [stage(k, [k.col([
      big("4", { fontSize: "18vw", lineHeight: 0.85, color: "#1b1b1b", fontFamily: "font.playfair-display", fontStyle: "italic" }),
      big("0", { fontSize: "13vw", lineHeight: 0.85, color: "#ffffff", marginLeft: "14vw", fontFamily: "font.playfair-display" }),
      big("4", { fontSize: "22vw", lineHeight: 0.85, color: "#1b1b1b", marginLeft: "30vw", fontFamily: "font.playfair-display", fontStyle: "italic" }),
      k.col([k.H(MSG, "1", { fontSize: "30px", fontFamily: "font.playfair-display" }), k.B("Retour à l'accueil", "/", "solid")], { gap: "14px", marginLeft: "30vw", marginTop: "60px" }, { marginLeft: "0px", marginTop: "10px" }),
    ], { gap: "0px", width: "100%" })], { gap: "0px" })] },

  { key: "collage-de-papier", family: "creatives", skin: S_COLLAGE, name: "Collage de papier", tags: ["créatif", "collage", "formes"],
    desc: "Des morceaux de papier de couleur se chevauchent derrière une carte blanche qui porte le message.", decl: { C: 3, N: 1, P: 7, T: 8 },
    build: (k) => [stage(k, [k.row([
      k.col([
        k.row([shape("34%", "120px", "#c8432b"), shape("22%", "120px", "#1f6f5c", { marginLeft: "-6%", marginTop: "40px" }), shape("26%", "120px", "#f2b705", { marginLeft: "-8%" })], { gap: "0px", flexWrap: "nowrap", width: "100%" }),
        deco("404", { fontSize: "18vw", color: "#2b2118", fontWeight: "800", lineHeight: 0.8, marginTop: "-30px", letterSpacing: "-0.03em" }),
      ], { flexBasis: "46%", flexGrow: 1, minWidth: "280px", gap: "0px" }),
      k.card([k.L("Erreur 404"), k.H(MSG, "1", { fontSize: "34px" }), k.T("<p>" + WHY + "</p>"), k.row([k.B("Accueil", "/", "solid"), k.B("Blog", "/blog", "outline")], { gap: "12px" })], { backgroundColor: "#fffaf0", flexBasis: "42%", flexGrow: 1, minWidth: "280px", borderStyle: "solid", borderWidth: "2px", borderColor: "#2b2118", paddingTop: "28px", paddingBottom: "28px", paddingLeft: "28px", paddingRight: "28px" }),
    ], { alignItems: "center", gap: "32px", width: "100%" })])] },

  { key: "geometrie-bauhaus", family: "creatives", skin: S_BAU, name: "Géométrie de Bauhaus", tags: ["créatif", "bauhaus", "formes"],
    desc: "Un 4, un cercle rouge, un 4 : le 404 est construit avec des formes ; à droite, la recherche et deux sorties.", decl: { C: 2, N: 3, P: 4, T: 1 },
    build: (k) => [stage(k, [k.row([
      k.row([big("4", { fontSize: "16vw", color: "#111111" }), shape("12vw", "12vw", "#d62828", { borderRadius: "50%", minWidth: "70px", minHeight: "70px" }), big("4", { fontSize: "16vw", color: "#1d4ed8" })], { flexBasis: "46%", flexGrow: 1, minWidth: "280px", gap: "10px", flexWrap: "nowrap", justifyContent: "center" }),
      k.col([k.shape ? null : null, shape("64px", "12px", "#f2b705"), k.H(MSG, "1", { fontSize: "36px" }), k.search("blog", { maxWidth: "380px", width: "100%" }), k.row([U(k, "Accueil", "/"), U(k, "Contact", "/contact")], { gap: "20px" })].filter(Boolean), { flexBasis: "44%", flexGrow: 1, minWidth: "260px", gap: "18px" }),
    ], { alignItems: "center", gap: "32px", width: "100%" })])] },

  { key: "superposition", family: "creatives", skin: S_SUPER, name: "Superposition", tags: ["créatif", "calques", "trichromie"],
    desc: "Trois calques du même 404 se chevauchent en cyan, magenta et jaune avec fusion de couleurs.", decl: { C: 1, N: 1, P: 9, T: 4 },
    build: (k) => [stage(k, [k.col([
      k.col([
        big("404", { fontSize: "24vw", color: "#00b4d8", mixBlendMode: "multiply" }),
        big("404", { fontSize: "24vw", color: "#f72585", mixBlendMode: "multiply", marginTop: "-19vw", marginLeft: "1.2vw" }),
        big("404", { fontSize: "24vw", color: "#ffd60a", mixBlendMode: "multiply", marginTop: "-19vw", marginLeft: "2.4vw" }),
      ], { gap: "0px", alignItems: "center", width: "100%" }),
      k.H(MSG, "1", { fontSize: "30px", textAlign: "center", marginTop: "1vw" }),
      k.B("Retrouver la sortie", "/", "outline", { alignSelf: "center" }),
    ], { gap: "18px", alignItems: "center", width: "100%" })], { gap: "0px" })] },

  { key: "aquarelle", family: "creatives", skin: S_AQUA, name: "Aquarelle", tags: ["créatif", "doux", "manuscrit"],
    desc: "De grandes taches pastel floues, un message à la main et les derniers articles pour reprendre le fil.", decl: { C: 1, N: 6, P: 5, T: 5 },
    build: (k) => [stage(k, [k.col([
      k.row([shape("18vw", "18vw", "#f7c6d9", { borderRadius: "50%", minWidth: "90px", minHeight: "90px" }), shape("14vw", "14vw", "#c7d7ff", { borderRadius: "50%", marginLeft: "-5vw", marginTop: "3vw", minWidth: "70px", minHeight: "70px" }), shape("10vw", "10vw", "#c9f0dd", { borderRadius: "50%", marginLeft: "-3vw", minWidth: "56px", minHeight: "56px" })], { gap: "0px", justifyContent: "center", flexWrap: "nowrap" }),
      k.H("Oups… cette page s'est envolée", "1", { fontSize: "48px", textAlign: "center", fontWeight: "700" }, { fontSize: "36px" }),
      k.T("<p>" + WHY + " Voici de quoi vous consoler.</p>", { textAlign: "center", maxWidth: "520px", alignSelf: "center" }),
      recentPosts(k),
      k.B("Retour à l'accueil", "/", "solid", { alignSelf: "center" }),
    ], { gap: "20px", width: "100%", alignItems: "center" })])] },

  { key: "constructivisme", family: "creatives", skin: S_CONSTR, name: "Constructivisme", tags: ["créatif", "affiche", "rouge et noir"],
    desc: "Un bloc noir, un bloc rouge et un slogan en capitales : ni ici, ni ailleurs — la sortie est en bas à droite.", decl: { C: 5, N: 6, P: 4, T: 4 },
    build: (k) => [stage(k, [k.grid(3, [
      k.card([k.L("Erreur 404", { color: "#f2ead8" }), k.H("Ni ici", "1", { fontSize: "7vw", color: "#f2ead8", textTransform: "uppercase" })], { backgroundColor: "#111111", minHeight: "260px", justifyContent: "space-between", gridColumnSpan: 2 }, { gridColumnSpan: 1 }),
      k.card([k.H("Ni ailleurs", "2", { fontSize: "3vw", color: "#ffffff", textTransform: "uppercase" })], { backgroundColor: "#c1121f", minHeight: "260px", justifyContent: "flex-end" }),
      k.card([k.T("<p>" + WHY + "</p>", { color: "#111111" }), U(k, "Chercher dans le blog", "/blog")], { backgroundColor: "#f2ead8", borderStyle: "solid", borderWidth: "3px", borderColor: "#111111", minHeight: "180px" }),
      k.card([k.B("→ Sortie", "/", "solid", { backgroundColor: "#111111", color: "#f2ead8", fontSize: "22px", width: "100%", justifyContent: "center" })], { backgroundColor: "#f2b705", minHeight: "180px", justifyContent: "center", gridColumnSpan: 2 }, { gridColumnSpan: 1 }),
    ], { gap: "14px", width: "100%" })], { gap: "0px" })] },

  { key: "mosaique", family: "creatives", skin: S_MOSA, name: "Mosaïque", tags: ["créatif", "tuiles", "navigation"],
    desc: "Six tuiles de couleur qui sont les six sorties du site, composées comme une mosaïque.", decl: { C: 5, N: 6, P: 4, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.H(MSG, "1", { fontSize: "34px", textAlign: "center" }),
      k.grid(3, [["Accueil", "/", "#ef476f"], ["Blog", "/blog", "#ffd166"], ["Catalogue", "/catalogue", "#06d6a0"], ["Contact", "/contact", "#118ab2"], ["Boutique", "/boutique", "#9b5de5"], ["Mon compte", "/compte", "#f78c6b"]].map(([l, u, c]) =>
        k.card([LK(k, l, u, { color: "#101828", fontSize: "20px", fontWeight: "800" })], { backgroundColor: c, minHeight: "120px", justifyContent: "flex-end" })), { gap: "12px", width: "100%", maxWidth: "820px", alignSelf: "center" }),
    ], { gap: "24px", width: "100%", alignItems: "center" })])] },
];

function recentPosts(k) { return k.W("posts", { count: 3, layout: "grid", showExcerpt: false, showDate: true, showImage: true, empty: "Les articles apparaîtront ici." }, { width: "100%" }); }
