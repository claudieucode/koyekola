// Famille 11 — Communautés (5 modèles). Aucun faux membre, aucune fausse publication : uniquement les contenus réels du site.
const { skin, MSG, WHY, deco, stage, LK, U, shape, W, draw, posts, recent, popular, cats, subscribe } = require("./h");
const A = require("./art");
const S_GROUPES = skin("groupes", "Communauté chaleureuse", { bg: "#fff4e6", fg: "#3b2000", mute: "#8a5a1f", alt: "#ffffff", accent: "#ea580c", onAccent: "#ffffff", line: "#fdba74", font: "font.baloo-2", head: "font.baloo-2", weight: "800", btn: "solid", radius: "22px", btnRadius: "999px" });
const S_FIL = skin("fil", "Fil pastel", { bg: "#eaf7ee", fg: "#12301c", mute: "#4d7a5b", alt: "#ffffff", accent: "#16a34a", onAccent: "#ffffff", line: "#bfe3c9", font: "font.nunito", head: "font.fraunces", weight: "700", btn: "solid", radius: "12px" });
const S_ANNU = skin("annuaire", "Annuaire", { bg: "#fdf4ff", fg: "#3b0a45", mute: "#8a4a96", alt: "#ffffff", accent: "#a21caf", onAccent: "#ffffff", line: "#f0abfc", font: "font.dm-sans", head: "font.dm-serif-display", weight: "400", btn: "solid", radius: "10px" });
const S_CAFE = skin("cafe", "Café", { bg: "#2b1d14", fg: "#f6e9d8", mute: "#c7a98a", alt: "#3a281b", accent: "#e0a96d", onAccent: "#2b1d14", line: "#5a3d28", font: "font.dm-sans", head: "font.dm-serif-display", weight: "400", btn: "solid" });
const S_SUGG2 = skin("suggestions-contenus", "Pastel curieux", { bg: "#f3e8ff", fg: "#3b0764", mute: "#7e57a3", alt: "#ffffff", accent: "#9333ea", onAccent: "#ffffff", line: "#d8b4fe", font: "font.outfit", head: "font.outfit", weight: "700", btn: "solid", radius: "20px", btnRadius: "999px" });

module.exports = [
  { key: "groupes", family: "communautes", skin: S_GROUPES, name: "Groupes", tags: ["communauté", "cartes", "rubriques"],
    desc: "Quatre « groupes » (blog, catalogue, boutique, contact) présentés comme des cercles à rejoindre.", decl: { C: 5, N: 6, P: 4, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.H("Cette porte ne mène à aucun groupe", "1", { fontSize: "38px", textAlign: "center" }), k.T("<p>" + MSG + ". Rejoignez plutôt l'un de ces espaces :</p>", { textAlign: "center" }),
      k.grid(4, [["Le blog", "Lire et commenter", "/blog", "#ffd6a5"], ["Le catalogue", "Apprendre ensemble", "/catalogue", "#fdffb6"], ["La boutique", "Découvrir et échanger", "/boutique", "#caffbf"], ["Le contact", "Nous parler", "/contact", "#bdb2ff"]].map(([t, d, u, c]) => k.card([shape("56px", "56px", "#ea580c", { borderRadius: "50%" }), k.H(t, "3", { fontSize: "20px" }), k.T("<p>" + d + "</p>", { fontSize: "15px" }), U(k, "Rejoindre", u)], { backgroundColor: c, alignItems: "center", textAlign: "center", minHeight: "190px" })), { gap: "14px", width: "100%" }),
    ], { gap: "18px", width: "100%" })])] },

  { key: "fil-de-publications", family: "communautes", skin: S_FIL, name: "Fil de publications", tags: ["communauté", "fil", "publications"],
    desc: "Un fil façon réseau social : la colonne du centre affiche les dernières publications réelles, à gauche le message.", decl: { C: 8, N: 2, P: 5, T: 8 },
    build: (k) => [stage(k, [k.row([
      k.col([k.H(MSG, "1", { fontSize: "24px" }), k.T("<p>" + WHY + "</p>", { color: "#65676b" }), k.B("Accueil", "/", "solid"), k.account({ justifyContent: "flex-start" })], { flexBasis: "26%", flexGrow: 1, minWidth: "240px", gap: "12px", backgroundColor: "#ffffff", paddingTop: "20px", paddingBottom: "20px", paddingLeft: "20px", paddingRight: "20px" }),
      k.col([k.L("Publications récentes"), W(k, "posts", { count: 4, layout: "list", showExcerpt: true, showDate: true, showImage: true, empty: "Les publications apparaîtront ici." }, { width: "100%" })], { flexBasis: "58%", flexGrow: 1, minWidth: "280px", gap: "10px" }),
    ], { alignItems: "flex-start", gap: "20px", width: "100%" })])] },

  { key: "annuaire-de-membres", family: "communautes", skin: S_ANNU, name: "Annuaire de membres", tags: ["communauté", "recherche", "compte"],
    desc: "Un annuaire : recherche sur tout le site et accès à son profil ; aucune fausse fiche de membre.", decl: { C: 2, N: 1, P: 9, T: 8 },
    build: (k) => [stage(k, [k.row([
      k.col([deco("404", { fontSize: "11vw", color: "#f0abfc", fontWeight: "800", lineHeight: 0.85, fontFamily: "font.dm-serif-display" }), k.L("Annuaire"), k.H("Personne (ni page) ne répond à cette adresse", "1", { fontSize: "34px", lineHeight: 1.15 }), k.search("site", { width: "100%", suggest: true })], { flexBasis: "50%", flexGrow: 1, minWidth: "280px", gap: "14px" }),
      k.card([k.L("Votre profil"), k.account({ justifyContent: "flex-start" }), k.T("<p>Retrouvez vos informations dans votre compte.</p>", { fontSize: "15px" }), U(k, "Retour à l'accueil", "/")], { flexBasis: "34%", flexGrow: 1, minWidth: "240px", backgroundColor: "#f5f7fa", gap: "12px" }),
    ], { alignItems: "center", gap: "32px", width: "100%" })])] },

  { key: "cafe-de-la-communaute", family: "communautes", skin: S_CAFE, name: "Café de la communauté", tags: ["communauté", "abonnement", "ambiance"],
    desc: "Une table au café : un message chaleureux, l'inscription à la lettre et une invitation à écrire.", decl: { C: 2, N: 6, P: 2, T: 8 },
    build: (k, env) => [stage(k, [k.row([
      k.col([k.L("404 — la chaise est vide"), k.H("Cette page est partie prendre un café", "1", { fontSize: "46px", fontFamily: "font.dm-serif-display", lineHeight: 1.1 }), k.T("<p>" + WHY + " Asseyez-vous, on vous tient au courant.</p>"), U(k, "Écrire à la communauté", "/contact")], { flexBasis: "48%", flexGrow: 1, minWidth: "280px", gap: "16px" }),
      k.card([subscribe(k, env, { title: "Recevoir la lettre de la communauté", button: "Je m'abonne", intro: "Rejoignez la conversation : écrivez-nous." }, { width: "100%" })], { flexBasis: "38%", flexGrow: 1, minWidth: "260px", backgroundColor: "#3a281b", borderStyle: "solid", borderWidth: "1px", borderColor: "#5a3d28" }),
    ], { alignItems: "center", gap: "40px", width: "100%" })])] },

  { key: "suggestions-de-contenus", family: "communautes", skin: S_SUGG2, name: "Suggestions de contenus", tags: ["communauté", "recommandations", "catégories"],
    desc: "« Selon vos centres d'intérêt » : les catégories les plus suivies puis les articles les plus lus.", decl: { C: 14, N: 6, P: 5, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.card([k.L("Message de la communauté"), k.H("Cette page n'existe plus, mais on a pensé à vous", "1", { fontSize: "30px", lineHeight: 1.15 })], { backgroundColor: "#ffffff", alignSelf: "flex-start", maxWidth: "620px" }),
      k.card([cats(k, "Vos centres d'intérêt ?", { title: "Vos centres d'intérêt ?" })], { backgroundColor: "#ffffff", alignSelf: "flex-end", maxWidth: "720px", width: "100%" }),
      k.card([popular(k, "Les plus lus par la communauté", 4)], { backgroundColor: "#ffffff", alignSelf: "flex-start", maxWidth: "620px", width: "100%" }),
      k.B("Retour à l'accueil", "/", "solid", { alignSelf: "center" }),
    ], { gap: "14px", width: "100%" })])] },
];
