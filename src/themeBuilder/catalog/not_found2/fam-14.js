// Famille 14 — Élégantes et premium (6 modèles).
const { skin, MSG, WHY, deco, stage, LK, U, shape, W, draw, recent, navRow } = require("./h");
const A = require("./art");
const S_COUTURE = skin("couture", "Maison de couture", { bg: "#f8f4ee", fg: "#2a2420", mute: "#8a7d70", alt: "#ffffff", accent: "#2a2420", onAccent: "#f8f4ee", line: "#c8b48a", font: "font.jost", head: "font.cormorant-garamond", weight: "400", caps: "uppercase", track: "3px", btn: "outline" });
const S_GALERIE = skin("galerie", "Galerie", { bg: "#e9e6e1", fg: "#1c1b19", mute: "#6c6860", alt: "#fdfcfa", accent: "#1c1b19", onAccent: "#fdfcfa", line: "#1c1b19", font: "font.libre-franklin", head: "font.playfair-display", weight: "400", btn: "outline" });
const S_MONO = skin("monochrome", "Noir et blanc", { bg: "#ffffff", fg: "#000000", mute: "#555555", alt: "#f0f0f0", accent: "#000000", onAccent: "#ffffff", line: "#000000", font: "font.playfair-display", head: "font.playfair-display", weight: "400", btn: "solid" });
const S_ARCHI = skin("architectural", "Tirage bleu", { bg: "#0e3a8a", fg: "#e8f0ff", mute: "#a9c2f0", alt: "#134aa8", accent: "#e8f0ff", onAccent: "#0e3a8a", line: "#e8f0ff", font: "font.dm-sans", head: "font.dm-sans", weight: "500", btn: "outline" });
const S_NOCT = skin("nocturne", "Nocturne dorée", { bg: "#0a0a0a", fg: "#f1e6c8", mute: "#a89a73", alt: "#141414", accent: "#d4af37", onAccent: "#0a0a0a", line: "#d4af37", font: "font.cormorant-garamond", head: "font.cinzel", weight: "500", btn: "outline" });
const S_INVIT = skin("invitation", "Carton d'invitation", { bg: "#efe6da", fg: "#3a2f26", mute: "#8b7b69", alt: "#fffdf9", accent: "#3a2f26", onAccent: "#fffdf9", line: "#b9a58a", font: "font.cormorant-garamond", head: "font.great-vibes", weight: "500", btn: "outline" });

module.exports = [
  { key: "maison-de-couture", family: "premium", skin: S_COUTURE, name: "Maison de couture", tags: ["premium", "mode", "serif fin"],
    desc: "Typographie fine en capitales espacées, filets dorés, immense respiration ; un menu discret comme sur un site de couture.", decl: { C: 3, N: 2, P: 8, T: 2 },
    build: (k) => [stage(k, [k.row([
      k.col([k.L("Erreur 404", { color: "#8a7d70" }), shape("56px", "1px", "#c8b48a"), k.H("La page que vous cherchez n'est plus de saison", "1", { fontSize: "44px", fontFamily: "font.cormorant-garamond", fontWeight: "400", lineHeight: 1.1, textTransform: "none", letterSpacing: "0px" }), navRow(k, { gap: "28px" }, { textTransform: "uppercase", letterSpacing: "3px", fontSize: "12px", fontWeight: "400", textDecoration: "none" })], { flexBasis: "56%", flexGrow: 1, minWidth: "280px", gap: "22px" }),
    ], { justifyContent: "flex-end", width: "100%" })], { gap: "0px", minHeight: "74vh" })] },

  { key: "galerie-d-art", family: "premium", skin: S_GALERIE, name: "Galerie", tags: ["premium", "cadre", "cartel"],
    desc: "Un cadre vide au mur, un cartel de musée en dessous : « Sans titre — page introuvable, 404 ».", decl: { C: 1, N: 6, P: 3, T: 8 },
    build: (k) => [stage(k, [k.col([
      k.card([k.col([k.L("Œuvre non exposée", { textAlign: "center" })], { alignItems: "center", justifyContent: "center", minHeight: "260px" })], { backgroundColor: "#fdfcfa", borderStyle: "solid", borderWidth: "14px", borderColor: "#1c1b19", maxWidth: "460px", width: "100%", alignSelf: "center", boxShadow: "lg" }),
      k.card([k.H("Sans titre (page introuvable)", "1", { fontSize: "22px", fontFamily: "font.playfair-display", fontWeight: "400" }), k.T("<p>Erreur 404, " + WHY.toLowerCase() + "</p>", { fontSize: "14px", color: "#6c6860" }), U(k, "Poursuivre la visite →", "/", { fontSize: "14px" })], { backgroundColor: "#fdfcfa", maxWidth: "340px", alignSelf: "center", gap: "8px", borderStyle: "solid", borderWidth: "1px", borderColor: "#1c1b19" }),
    ], { gap: "28px", width: "100%" })])] },

  { key: "monochrome", family: "premium", skin: S_MONO, name: "Monochrome", tags: ["premium", "noir et blanc", "italique"],
    desc: "Du noir sur du blanc, un grand 404 en serif italique qui déborde, une seule phrase.", decl: { C: 9, N: 1, P: 3, T: 2 },
    build: (k) => [stage(k, [k.col([
      deco("404", { fontSize: "34vw", fontStyle: "italic", fontWeight: "400", lineHeight: 0.8, color: "#000000", letterSpacing: "-0.05em" }),
      k.row([k.H("Introuvable.", "1", { fontSize: "34px", fontStyle: "italic", fontWeight: "400" }), U(k, "Retour →", "/", { fontSize: "22px", fontStyle: "italic" })], { gap: "32px", justifyContent: "space-between", width: "100%", borderTopStyle: "solid", borderTopWidth: "1px", borderColor: "#000000", paddingTop: "18px" }),
    ], { gap: "10px", width: "100%" })], { gap: "0px" })] },

  { key: "architectural", family: "premium", skin: S_ARCHI, name: "Architectural", tags: ["premium", "plan", "cotes"],
    desc: "Une page de plan d'architecte : grille orthogonale, cotes, légende ; les rubriques sont des « plans » numérotés.", decl: { C: 13, N: 2, P: 9, T: 1 },
    build: (k) => [stage(k, [k.row([
      k.col([k.row([k.L("PLAN 404"), k.L("ÉCH. 1/1")], { justifyContent: "space-between", width: "100%", borderBottomStyle: "solid", borderBottomWidth: "1px", borderColor: "#e8f0ff", paddingBottom: "8px" }), k.H("Page introuvable — élévation inexistante", "1", { fontSize: "30px", fontFamily: "font.dm-sans" }), k.T("<p>" + WHY + "</p>", { fontFamily: "font.dm-sans", fontSize: "14px" }),
        k.row([shape("90px", "1px", "#e8f0ff"), k.L("90 px de cote")], { gap: "10px" })], { flexBasis: "48%", flexGrow: 1, minWidth: "280px", gap: "14px" }),
      k.col([k.L("LÉGENDE"), ...[["01", "Accueil", "/"], ["02", "Blog", "/blog"], ["03", "Catalogue", "/catalogue"], ["04", "Contact", "/contact"]].map(([n, l, u]) => k.row([k.L(n), U(k, l, u, { fontFamily: "font.dm-sans" })], { gap: "14px", paddingTop: "8px", paddingBottom: "8px", borderBottomStyle: "dashed", borderBottomWidth: "1px", borderColor: "#e8f0ff" }))], { flexBasis: "40%", flexGrow: 1, minWidth: "260px", gap: "4px", borderStyle: "solid", borderWidth: "1px", borderColor: "#e8f0ff", paddingTop: "18px", paddingBottom: "18px", paddingLeft: "20px", paddingRight: "20px" }),
    ], { alignItems: "flex-start", gap: "36px", width: "100%" })])] },

  { key: "nocturne-doree", family: "premium", skin: S_NOCT, name: "Nocturne dorée", tags: ["premium", "noir et or", "scintillement"],
    desc: "Un fond noir, un filet d'or et un message en lettres dorées qui se révèlent lentement ; un menu fin dessous.", decl: { C: 1, N: 5, P: 8, T: 2 },
    build: (k) => [stage(k, [k.col([
      W(k, "motiongradienttext", { text: "404", tag: "p", color: "#d4af37" }, { fontSize: "18vw", fontFamily: "font.cinzel", fontWeight: "500", textAlign: "center", lineHeight: 0.9 }),
      k.H("Cette page demeure introuvable", "1", { fontSize: "30px", fontFamily: "font.cinzel", fontWeight: "500", textAlign: "center", color: "#f1e6c8" }),
      shape("120px", "1px", "#d4af37", { alignSelf: "center" }), k.menu("header", { justifyContent: "center", color: "#a89a73" }, false), U(k, "Revenir à l'accueil", "/", { alignSelf: "center" }),
    ], { gap: "18px", alignItems: "center", width: "100%" })], { gap: "0px" })] },

  { key: "carton-d-invitation", family: "premium", skin: S_INVIT, name: "Carton d'invitation", tags: ["premium", "invitation", "calligraphie"],
    desc: "Un carton d'invitation à double filet : « Votre page vous attend ailleurs » en calligraphie, avec un bouton d'accès.", decl: { C: 16, N: 6, P: 5, T: 5 },
    build: (k) => [stage(k, [k.card([
      k.L("Vous êtes cordialement invité(e)", { textAlign: "center", fontSize: "14px", letterSpacing: "4px", textTransform: "uppercase" }), k.H("Votre page vous attend ailleurs", "1", { fontSize: "54px", fontFamily: "font.great-vibes", fontWeight: "400", textAlign: "center", lineHeight: 1.15 }),
      k.T("<p>Erreur 404 — " + WHY + "</p>", { textAlign: "center", fontStyle: "italic" }), k.B("Accepter l'invitation", "/", "outline", { alignSelf: "center" }),
    ], { backgroundColor: "#fffdf9", maxWidth: "620px", width: "100%", marginLeft: "auto", marginRight: "auto", gap: "16px", borderStyle: "double", borderWidth: "6px", borderColor: "#b9a58a", paddingTop: "42px", paddingBottom: "42px", paddingLeft: "42px", paddingRight: "42px" })], { gap: "0px" })] },
];
