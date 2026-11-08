// Famille 8 — Éditoriales et magazines (6 modèles) : une de magazine, classement, index, archives, flux horizontal, édito. Articles RÉELS du site.
const { skin, MSG, WHY, deco, stage, LK, U, shape, W, posts, recent, popular, cats } = require("./h");
const S_UNE = skin("une", "Une de magazine", { bg: "#fffaf0", fg: "#111111", mute: "#5a5a5a", alt: "#ffffff", accent: "#d90429", onAccent: "#ffffff", line: "#111111", font: "font.libre-franklin", head: "font.playfair-display", weight: "900", btn: "solid" });
const S_POPULAIRES = skin("classement", "Classement", { bg: "#fff4e0", fg: "#2a1608", mute: "#7a5a3a", alt: "#ffe7bd", accent: "#b3261e", onAccent: "#ffffff", line: "#2a1608", font: "font.roboto-slab", head: "font.roboto-slab", weight: "800", btn: "solid" });
const S_INDEX2 = skin("index-editorial", "Index alphabétique", { bg: "#f2efe6", fg: "#26231c", mute: "#6d6757", alt: "#faf8f1", accent: "#8c2f1b", onAccent: "#ffffff", line: "#26231c", font: "font.crimson-pro", head: "font.crimson-pro", weight: "700", btn: "solid" });
const S_ARCH = skin("archives", "Bibliothèque", { bg: "#0f2a2b", fg: "#f0f7f6", mute: "#9bbcb9", alt: "#173a3b", accent: "#ffcf5c", onAccent: "#0f2a2b", line: "#2c5f60", font: "font.merriweather-sans", head: "font.merriweather", weight: "700", btn: "solid" });
const S_FLUX = skin("derniers", "Presse du soir", { bg: "#eef1f5", fg: "#0e1a2b", mute: "#53627a", alt: "#ffffff", accent: "#0b5fff", onAccent: "#ffffff", line: "#cfd8e3", font: "font.public-sans", head: "font.public-sans", weight: "800", btn: "solid" });
const S_EDITO = skin("edito", "Lettre du rédacteur", { bg: "#fbf6ec", fg: "#2b2218", mute: "#76664c", alt: "#fffdf8", accent: "#2b2218", onAccent: "#fbf6ec", line: "#cdbf9f", font: "font.lora", head: "font.lora", weight: "600", btn: "outline" });

module.exports = [
  { key: "une-de-magazine", family: "editoriales", skin: S_UNE, name: "Une de magazine", tags: ["éditorial", "couverture", "articles"],
    desc: "Une couverture de magazine : titre de journal, 404 en manchette, accroches et trois articles à la une.", decl: { C: 6, N: 1, P: 8, T: 2 },
    build: (k) => [stage(k, [k.col([
      k.row([k.L("N° 404"), deco("LE QUOTIDIEN INTROUVABLE", { fontFamily: "font.playfair-display", fontSize: "26px", fontWeight: "900", letterSpacing: "4px" }), k.L("Édition spéciale")], { justifyContent: "space-between", borderBottomStyle: "solid", borderBottomWidth: "3px", borderColor: "#111111", paddingBottom: "10px", width: "100%" }),
      k.row([deco("404", { fontSize: "16vw", fontFamily: "font.playfair-display", fontWeight: "900", color: "#d90429", lineHeight: 0.8 }), k.col([k.H("En une : la page que vous cherchiez a disparu", "1", { fontSize: "32px", fontFamily: "font.playfair-display", lineHeight: 1.1 }), k.T("<p>" + WHY + "</p>")], { flexBasis: "46%", flexGrow: 1, minWidth: "260px", gap: "10px" })], { gap: "30px", alignItems: "center", width: "100%" }),
      posts(k, 3, { showExcerpt: true }),
    ], { gap: "20px", width: "100%" })])] },

  { key: "classement", family: "editoriales", skin: S_POPULAIRES, name: "Articles populaires", tags: ["éditorial", "classement", "populaires"],
    desc: "Le message à gauche et le classement numéroté des articles les plus lus à droite.", decl: { C: 2, N: 2, P: 7, T: 7 },
    build: (k) => [stage(k, [k.row([
      k.col([k.L("Erreur 404"), k.H("Cette page n'est pas au classement", "1", { fontSize: "42px", lineHeight: 1.05 }), k.T("<p>" + WHY + "</p>"), k.B("Retour à l'accueil", "/", "solid")], { flexBasis: "40%", flexGrow: 1, minWidth: "260px", gap: "14px" }),
      k.col([k.L("Le top des lectures"), popular(k, "", 6, { title: "", showDate: false })], { flexBasis: "46%", flexGrow: 1, minWidth: "280px", gap: "10px", borderLeftStyle: "solid", borderLeftWidth: "3px", borderColor: "#111111", paddingLeft: "28px" }),
    ], { alignItems: "flex-start", gap: "36px", width: "100%" })])] },

  { key: "index-alphabetique", family: "editoriales", skin: S_INDEX2, name: "Catégories éditoriales", tags: ["éditorial", "catégories", "index"],
    desc: "L'index d'un livre : toutes les catégories du blog en grand, comme des entrées d'un sommaire.", decl: { C: 18, N: 6, P: 7, T: 2 },
    build: (k) => [stage(k, [k.col([
      k.L("Index — page introuvable", { textTransform: "uppercase", letterSpacing: "3px" }), k.H("Voyez plutôt l'index", "1", { fontSize: "48px", fontStyle: "italic" }),
      k.divider({ width: "100%", borderColor: "#26231c" }), cats(k, "Rubriques du blog", { title: "Rubriques du blog" }),
      k.divider({ width: "100%", borderColor: "#26231c" }), k.row([U(k, "Accueil", "/"), U(k, "Contact", "/contact")], { gap: "24px" }),
    ], { gap: "16px", width: "100%", maxWidth: "820px" })])] },

  { key: "recherche-d-archives", family: "editoriales", skin: S_ARCH, name: "Recherche d'archives", tags: ["éditorial", "archives", "recherche"],
    desc: "Les archives d'une bibliothèque : une grande recherche plein texte et les articles à explorer par rubrique.", decl: { C: 1, N: 11, P: 2, T: 2 },
    build: (k) => [stage(k, [k.col([
      deco("404", { fontSize: "18vw", color: "transparent", textStrokeWidth: "2px", textStrokeColor: "#ffcf5c", fontWeight: "900", fontFamily: "font.merriweather", lineHeight: 0.9, textAlign: "center" }),
      k.H("Cette pièce manque aux archives", "1", { fontSize: "34px", textAlign: "center" }),
      k.search("blog", { maxWidth: "640px", width: "100%", alignSelf: "center" }), cats(k, "Explorer par rubrique", { title: "Explorer par rubrique" }),
    ], { gap: "18px", alignItems: "center", width: "100%" })])] },

  { key: "derniers-articles", family: "editoriales", skin: S_FLUX, name: "Derniers articles", tags: ["éditorial", "flux", "articles"],
    desc: "Un bandeau « dernière minute » puis les derniers articles en liste avec leurs images.", decl: { C: 15, N: 2, P: 4, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.row([k.L("DERNIÈRE MINUTE", { color: "#ffffff", backgroundColor: "#0b5fff", paddingLeft: "10px", paddingRight: "10px" }), k.H(MSG + " — erreur 404", "1", { fontSize: "24px" })], { gap: "14px", width: "100%" }),
      W(k, "posts", { count: 4, layout: "list", showExcerpt: true, showDate: true, showImage: true, empty: "Les articles apparaîtront ici." }, { width: "100%" }), U(k, "Toutes les nouvelles (accueil)", "/"),
    ], { gap: "18px", width: "100%" })])] },

  { key: "edito", family: "editoriales", skin: S_EDITO, name: "Édito", tags: ["éditorial", "lettre", "serif"],
    desc: "Un éditorial en colonne étroite : une lettre ouverte sur la page disparue, signée, avec une invitation à lire autre chose.", decl: { C: 3, N: 6, P: 7, T: 2 },
    build: (k) => [stage(k, [k.row([
      k.col([k.L("L'édito")], { flexBasis: "26%", flexGrow: 0, minWidth: "160px" }),
      k.col([k.H("Chers lecteurs, cette page n'existe plus", "1", { fontSize: "44px", fontStyle: "italic", lineHeight: 1.1 }),
        k.T("<p>« " + WHY + " Nous avons déplacé, renommé ou retiré certaines pages ; si celle-ci vous manquait, dites-le-nous. »</p><p>— La rédaction</p>", { fontSize: "19px", lineHeight: 1.7, maxWidth: "520px" }),
        recent(k, "Pour vous consoler", 3), k.row([U(k, "Revenir à l'accueil", "/"), U(k, "Écrire à la rédaction", "/contact")], { gap: "22px" })], { flexBasis: "56%", flexGrow: 1, minWidth: "280px", gap: "18px" }),
    ], { alignItems: "flex-start", gap: "36px", width: "100%" })])] },
];
