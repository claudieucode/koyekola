// Famille 6 — E-commerce (7 modèles) : recherche de produits, rayons, populaires, promotions, panier, étiquette, suggestions du compte. Produits RÉELS de la boutique (message vide propre sinon).
const { skin, MSG, WHY, deco, stage, LK, U, shape, W, draw, shop, popular } = require("./h");
const A = require("./art");
const S_RECH = skin("recherche-produits", "Boutique claire", { bg: "#ffffff", fg: "#101828", mute: "#667085", alt: "#f2f4f7", accent: "#7a5af8", onAccent: "#ffffff", line: "#e4e7ec", font: "font.dm-sans", head: "font.dm-sans", weight: "800", btn: "solid", radius: "14px", btnRadius: "999px" });
const S_RAYONS = skin("rayons", "Marché", { bg: "#fff7e8", fg: "#3b2a14", mute: "#7d6644", alt: "#ffffff", accent: "#e76f51", onAccent: "#ffffff", line: "#3b2a14", font: "font.nunito", head: "font.fredoka", weight: "600", btn: "solid", radius: "18px", btnRadius: "999px" });
const S_POP = skin("populaires", "Vitrine noire", { bg: "#0d0d0d", fg: "#fafafa", mute: "#a3a3a3", alt: "#181818", accent: "#fafafa", onAccent: "#0d0d0d", line: "#2a2a2a", font: "font.inter", head: "font.inter-tight", weight: "800", btn: "solid" });
const S_PROMO = skin("promotions", "Soldes", { bg: "#fff1f2", fg: "#4c0519", mute: "#9f1239", alt: "#ffffff", accent: "#e11d48", onAccent: "#ffffff", line: "#e11d48", font: "font.poppins", head: "font.anton", weight: "400", btn: "solid" });
const S_PANIER = skin("panier", "Vert épicerie", { bg: "#eaf6ec", fg: "#14361f", mute: "#4d7a5a", alt: "#ffffff", accent: "#15803d", onAccent: "#ffffff", line: "#14361f", font: "font.mulish", head: "font.fraunces", weight: "700", btn: "solid", radius: "12px" });
const S_ETIQ = skin("etiquette", "Étiquette kraft", { bg: "#f1e6d2", fg: "#2d2418", mute: "#6e5e45", alt: "#fffaf0", accent: "#b91c1c", onAccent: "#ffffff", line: "#2d2418", font: "font.courier-prime", head: "font.rubik-mono-one", weight: "400", btn: "solid" });
const S_SUGG = skin("suggestions", "Application boutique", { bg: "#f8fafc", fg: "#0f172a", mute: "#64748b", alt: "#ffffff", accent: "#0ea5e9", onAccent: "#ffffff", line: "#e2e8f0", font: "font.figtree", head: "font.figtree", weight: "700", btn: "solid", radius: "12px" });

module.exports = [
  { key: "recherche-produits", family: "ecommerce", skin: S_RECH, name: "Recherche de produits", tags: ["boutique", "recherche", "produits"],
    desc: "Une grande barre de recherche de produits au centre, puis les nouveautés de la boutique.", decl: { C: 1, N: 2, P: 5, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.L("404 — ce produit ou cette page n'existe plus", { textAlign: "center" }), k.H("Que cherchiez-vous ?", "1", { fontSize: "46px", textAlign: "center" }),
      W(k, "shopsearch", { placeholder: "Rechercher un produit…", button: "Rechercher" }, { maxWidth: "620px", width: "100%", alignSelf: "center" }),
      shop(k, 4), k.B("Voir toute la boutique", "/boutique", "outline", { alignSelf: "center" }),
    ], { gap: "22px", width: "100%" })], { gap: "0px" })] },

  { key: "rayons", family: "ecommerce", skin: S_RAYONS, name: "Rayons", tags: ["boutique", "catégories", "tuiles"],
    desc: "Six rayons colorés sous forme de tuiles pour reprendre ses achats, puis quelques produits du moment.", decl: { C: 5, N: 6, P: 5, T: 8 },
    build: (k) => [stage(k, [k.col([
      k.H("Cette étagère est vide", "1", { fontSize: "40px", textAlign: "center" }),
      k.grid(3, [["Nouveautés", "/boutique", "#ffd6a5"], ["Cadeaux", "/boutique", "#caffbf"], ["Promotions", "/boutique", "#ffadad"], ["Mon compte", "/compte", "#bdb2ff"], ["Contact", "/contact", "#9bf6ff"], ["Accueil", "/", "#fdffb6"]].map(([l, u, c]) => k.card([LK(k, l, u, { fontSize: "20px", fontFamily: "font.fredoka" })], { backgroundColor: c, alignItems: "center", minHeight: "88px", justifyContent: "center" })), { gap: "12px", width: "100%" }),
      shop(k, 3),
    ], { gap: "20px", width: "100%" })], { gap: "0px" })] },

  { key: "produits-populaires", family: "ecommerce", skin: S_POP, name: "Produits populaires", tags: ["boutique", "vitrine", "populaires"],
    desc: "Un message court sur fond noir et une vitrine de produits : tout est fait pour continuer à acheter.", decl: { C: 6, N: 2, P: 2, T: 1 },
    build: (k) => [stage(k, [k.row([
      k.col([k.L("Erreur 404"), k.H("Cette page est en rupture", "1", { fontSize: "44px", lineHeight: 1.05 }), k.T("<p>" + WHY + " Les produits les plus demandés sont à droite.</p>"), k.B("Aller à la boutique", "/boutique", "solid")], { flexBasis: "30%", flexGrow: 1, minWidth: "240px", gap: "16px" }),
      W(k, "shopgrid", { count: 3, columns: "3", source: "all", orderby: "popular" }, { flexBasis: "62%", flexGrow: 1, minWidth: "280px" }),
    ], { alignItems: "center", gap: "32px", width: "100%" })])] },

  { key: "promotions", family: "ecommerce", skin: S_PROMO, name: "Promotions", tags: ["boutique", "promotions", "bandeau"],
    desc: "Un bandeau défilant « promotions » et les produits actuellement en promotion dans la boutique.", decl: { C: 15, N: 6, P: 4, T: 4 },
    build: (k) => [stage(k, [k.col([
      W(k, "marquee", { items: [{ text: "PROMOTIONS" }, { text: "PAGE INTROUVABLE" }, { text: "BONNES AFFAIRES" }], speed: "normal", direction: "left", separator: "★" }, { fontFamily: "font.anton", fontSize: "34px", color: "#e11d48" }),
      k.H("La page n'est pas en solde… mais ceux-ci le sont", "1", { fontSize: "34px", fontFamily: "font.anton", fontWeight: "400", textAlign: "center" }),
      W(k, "shopgrid", { count: 4, columns: "4", source: "sale", orderby: "newest" }, { width: "100%" }),
      k.B("Toutes les promotions", "/boutique", "solid", { alignSelf: "center" }),
    ], { gap: "20px", width: "100%" })], { gap: "0px" })] },

  { key: "panier-perdu", family: "ecommerce", skin: S_PANIER, name: "Panier perdu", tags: ["boutique", "illustration", "compte"],
    desc: "Un panier dessiné, au centre, qui cherche sa page ; le compte client et le panier du visiteur sont à portée de main.", decl: { C: 1, N: 6, P: 5, T: 2 },
    build: (k) => [stage(k, [k.col([
      draw(k, A.panier, { alt: "Un panier vide", width: 260, stroke: 3.4, color: "#15803d" }),
      k.H("Votre panier cherche cette page", "1", { fontSize: "40px", lineHeight: 1.1, fontFamily: "font.fraunces", textAlign: "center" }), k.T("<p>" + MSG + ". " + WHY + "</p>", { textAlign: "center", maxWidth: "520px" }),
      k.account({ justifyContent: "center" }), k.B("Retourner à la boutique", "/boutique", "solid", { alignSelf: "center" }),
    ], { gap: "16px", alignItems: "center", width: "100%" })])] },

  { key: "etiquette-de-prix", family: "ecommerce", skin: S_ETIQ, name: "Étiquette de prix", tags: ["boutique", "étiquette", "humour"],
    desc: "Le 404 est une étiquette de prix barrée « 404 € → introuvable » : un clin d'œil, puis la boutique.", decl: { C: 3, N: 3, P: 7, T: 7 },
    build: (k) => [stage(k, [k.row([
      k.card([k.L("Prix catalogue"), deco("404", { fontSize: "13vw", fontFamily: "font.rubik-mono-one", textDecoration: "line-through", color: "#b91c1c", lineHeight: 0.9 }), k.L("Prix aujourd'hui : introuvable")], { backgroundColor: "#fffaf0", borderStyle: "dashed", borderWidth: "3px", borderColor: "#2d2418", alignItems: "center", flexBasis: "40%", flexGrow: 1, minWidth: "260px" }),
      k.col([k.H("Cet article n'est plus en rayon", "1", { fontSize: "34px", fontFamily: "font.rubik-mono-one", lineHeight: 1.15 }), k.T("<p>" + WHY + "</p>"), k.row([k.B("Voir la boutique", "/boutique", "solid"), k.B("Demander à un vendeur", "/contact", "outline")], { gap: "12px" })], { flexBasis: "48%", flexGrow: 1, minWidth: "260px", gap: "16px" }),
    ], { alignItems: "center", gap: "32px", width: "100%" })])] },

  { key: "suggestions-pour-vous", family: "ecommerce", skin: S_SUGG, name: "Suggestions pour vous", tags: ["boutique", "compte", "application"],
    desc: "Une interface d'application boutique : à gauche le compte et la recherche, à droite des suggestions réelles.", decl: { C: 8, N: 6, P: 1, T: 1 },
    build: (k) => [stage(k, [k.row([
      k.col([k.H(MSG, "1", { fontSize: "26px" }), k.account({ justifyContent: "flex-start" }), W(k, "shopsearch", { placeholder: "Rechercher un produit…", button: "OK" }, { width: "100%" }), U(k, "Retour à l'accueil", "/")], { flexBasis: "28%", flexGrow: 1, minWidth: "240px", gap: "14px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: "#e2e8f0", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "20px", paddingRight: "20px" }),
      k.col([k.L("Pour vous"), shop(k, 3), popular(k, "Articles populaires", 3)], { flexBasis: "66%", flexGrow: 1, minWidth: "280px", gap: "14px" }),
    ], { alignItems: "flex-start", gap: "24px", width: "100%" })])] },
];
