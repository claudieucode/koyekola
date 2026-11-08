// Famille 5 — Photographiques (6 modèles). Décision : aucune photo n'est inventée ni copiée ; ces compositions photographiques s'appuient sur les COUVERTURES RÉELLES du site (articles, produits, formations),
// affichées en grand, et sur de grands aplats de couleur ; l'utilisateur peut ensuite ajouter ses propres photos dans l'éditeur.
const { skin, MSG, WHY, deco, stage, LK, U, shape, W, posts, recent, shop, courses } = require("./h");
const S_PLEIN = skin("plein", "Ardoise", { bg: "#101418", fg: "#f4f6f8", mute: "#9aa7b4", alt: "#1a2128", accent: "#f4f6f8", onAccent: "#101418", line: "#2c3640", font: "font.inter", head: "font.inter-tight", weight: "800", btn: "solid" });
const S_TEXTE = skin("texte-photo", "Sépia", { bg: "#1c1511", fg: "#fbf3e8", mute: "#c8b79f", alt: "#2a201a", accent: "#e9b872", onAccent: "#1c1511", line: "#4a3a2e", font: "font.lora", head: "font.playfair-display", weight: "700", btn: "solid" });
const S_DEUX = skin("deux-colonnes", "Papier journal", { bg: "#f6f3ee", fg: "#161513", mute: "#5e5a52", alt: "#ffffff", accent: "#161513", onAccent: "#f6f3ee", line: "#161513", font: "font.source-serif-4", head: "font.source-serif-4", weight: "700", btn: "solid" });
const S_MUR = skin("mur", "Studio", { bg: "#ece9e4", fg: "#1b1b1b", mute: "#6a6660", alt: "#ffffff", accent: "#1b1b1b", onAccent: "#ffffff", line: "#1b1b1b", font: "font.dm-sans", head: "font.dm-sans", weight: "800", btn: "solid" });
const S_DIAPO = skin("diaporama", "Soir", { bg: "#1b2236", fg: "#eef1fb", mute: "#a7b0cf", alt: "#242d47", accent: "#8fb4ff", onAccent: "#1b2236", line: "#38456b", font: "font.manrope", head: "font.manrope", weight: "700", btn: "solid", radius: "16px" });
const S_PORTRAIT = skin("portrait", "Galerie claire", { bg: "#fafafa", fg: "#111111", mute: "#666666", alt: "#ffffff", accent: "#111111", onAccent: "#fafafa", line: "#dddddd", font: "font.jost", head: "font.cormorant-garamond", weight: "500", btn: "outline" });

module.exports = [
  { key: "plein-ecran", family: "photographiques", skin: S_PLEIN, name: "Plein écran", tags: ["photo", "couvertures", "sombre"],
    desc: "Une grande scène sombre : le 404, le message, puis une rangée de couvertures réelles du site en pleine largeur.", decl: { C: 4, N: 1, P: 2, T: 1 },
    build: (k) => [stage(k, [k.col([
      deco("404", { fontSize: "20vw", color: "#2b343d", fontWeight: "800", lineHeight: 0.8, letterSpacing: "-0.04em", textAlign: "center" }),
      k.H(MSG, "1", { fontSize: "34px", textAlign: "center", marginTop: "-6vw" }),
      posts(k, 3, { showDate: false }),
      k.B("Retour à l'accueil", "/", "solid", { alignSelf: "center" }),
    ], { gap: "22px", width: "100%" })], { minHeight: "88vh", gap: "0px" })] },

  { key: "texte-sur-photo", family: "photographiques", skin: S_TEXTE, name: "Texte sur photo", tags: ["photo", "carte superposée", "sépia"],
    desc: "Les couvertures des articles en fond ; une carte sombre translucide les recouvre en partie et porte le message.", decl: { C: 15, N: 2, P: 7, T: 8 },
    build: (k) => [stage(k, [k.col([
      posts(k, 3, { showDate: false }),
      k.card([k.L("Erreur 404 — " + MSG.toLowerCase()), k.H("Vous êtes un peu hors cadre", "1", { fontSize: "38px", fontFamily: "font.playfair-display" }), k.T("<p>" + WHY + "</p>"), k.B("Revenir à l'accueil", "/", "solid")], { backgroundColor: "#1c1511", marginTop: "-60px", marginLeft: "6%", marginRight: "6%", borderStyle: "solid", borderWidth: "1px", borderColor: "#4a3a2e", gap: "14px" }),
    ], { gap: "0px", width: "100%" })], { gap: "0px" })] },

  { key: "deux-colonnes-photo", family: "photographiques", skin: S_DEUX, name: "Deux colonnes", tags: ["photo", "éditorial", "couverture à la une"],
    desc: "À gauche la couverture à la une du dernier article en grand ; à droite un texte éditorial et les lectures du moment.", decl: { C: 6, N: 6, P: 1, T: 2 },
    build: (k) => [stage(k, [k.row([
      k.col([k.L("À la une"), W(k, "posts", { count: 1, layout: "grid", showExcerpt: true, showDate: true, showImage: true, empty: "La une apparaîtra ici." }, { width: "100%" })], { flexBasis: "44%", flexGrow: 1, minWidth: "280px", gap: "10px" }),
      k.col([k.H("La page que vous cherchez n'est pas à la une", "1", { fontSize: "40px", lineHeight: 1.1 }), k.T("<p>" + MSG + ". " + WHY + "</p>", { fontSize: "18px" }), recent(k, "Lectures du moment", 4), U(k, "Retour à l'accueil", "/")], { flexBasis: "46%", flexGrow: 1, minWidth: "280px", gap: "16px" }),
    ], { alignItems: "flex-start", gap: "40px", width: "100%" })])] },

  { key: "mur-de-couvertures", family: "photographiques", skin: S_MUR, name: "Mur de couvertures", tags: ["photo", "mosaïque", "produits et articles"],
    desc: "Un mur d'images : les couvertures de la boutique d'un côté, des articles de l'autre, avec le message au milieu.", decl: { C: 5, N: 6, P: 3, T: 1 },
    build: (k) => [stage(k, [k.col([
      shop(k, 4, { columns: "4" }),
      k.card([k.H(MSG, "1", { fontSize: "34px", textAlign: "center" }), k.row([k.B("Accueil", "/", "solid"), k.B("Contact", "/contact", "outline")], { gap: "12px", justifyContent: "center" })], { backgroundColor: "#ffffff", alignItems: "center", gap: "12px" }),
      posts(k, 3, { showDate: false }),
    ], { gap: "18px", width: "100%" })], { gap: "0px" })] },

  { key: "diaporama", family: "photographiques", skin: S_DIAPO, name: "Diaporama de pages", tags: ["photo", "carrousel", "interactif"],
    desc: "Un diaporama à faire défiler : le message, puis les articles récents, puis les formations — trois écrans pour se retrouver.", decl: { C: 12, N: 2, P: 2, T: 8 },
    build: (k) => [stage(k, [{ type: "container", props: { mode: "carousel", dots: true, loop: true }, children: [
      { type: "container", name: "Le message", children: [k.col([k.L("404"), k.H(MSG, "1", { fontSize: "44px" }), k.T("<p>" + WHY + "</p>"), k.B("Retour à l'accueil", "/", "solid")], { gap: "14px", alignItems: "flex-start", paddingTop: "30px", paddingBottom: "30px" })] },
      { type: "container", name: "Les articles", children: [k.col([k.H("Peut-être ces articles ?", "2", { fontSize: "28px" }), posts(k, 3)], { gap: "14px", paddingTop: "30px", paddingBottom: "30px" })] },
      { type: "container", name: "Les formations", children: [k.col([k.H("Ou ces formations ?", "2", { fontSize: "28px" }), courses(k, 3)], { gap: "14px", paddingTop: "30px", paddingBottom: "30px" })] },
    ], styles: { desktop: { width: "100%" } } }], { gap: "0px" })] },

  { key: "portrait", family: "photographiques", skin: S_PORTRAIT, name: "Portrait", tags: ["photo", "légende", "galerie"],
    desc: "Une seule couverture, très grande, comme un portrait au mur ; en légende, le message sur trois lignes.", decl: { C: 3, N: 6, P: 1, T: 2 },
    build: (k) => [stage(k, [k.row([
      W(k, "posts", { count: 1, layout: "grid", showExcerpt: false, showDate: false, showImage: true, empty: "Une couverture apparaîtra ici." }, { flexBasis: "42%", flexGrow: 1, minWidth: "260px" }),
      k.col([k.L("Légende"), k.H("Cette page n'est pas au mur.", "1", { fontSize: "46px", fontFamily: "font.cormorant-garamond", fontWeight: "500", lineHeight: 1.05 }), k.T("<p>" + WHY + "</p>", { color: "#666666" }), U(k, "Visiter l'accueil", "/", { fontFamily: "font.cormorant-garamond", fontSize: "22px" })], { flexBasis: "40%", flexGrow: 1, minWidth: "260px", gap: "16px", justifyContent: "flex-end" }),
    ], { alignItems: "flex-end", gap: "40px", width: "100%" })])] },
];
