// Famille 15 — Expérimentales (6 modèles).
const { skin, MSG, WHY, deco, stage, LK, U, shape, W, draw, recent, cats } = require("./h");
const A = require("./art");
const S_MONUM = skin("monumental", "Papier journal", { bg: "#f4f1ea", fg: "#0d0d0d", mute: "#555555", alt: "#e7e2d6", accent: "#0d0d0d", onAccent: "#f4f1ea", line: "#0d0d0d", font: "font.archivo", head: "font.archivo-black", weight: "400", btn: "solid" });
const S_MOUVEMENT = skin("mouvement", "Électrique", { bg: "#0d1b2a", fg: "#e0fbfc", mute: "#98c1d9", alt: "#1b263b", accent: "#ee6c4d", onAccent: "#0d1b2a", line: "#3d5a80", font: "font.syne", head: "font.syne", weight: "800", btn: "solid" });
const S_NARR = skin("narratif", "Messagerie", { bg: "#e9edf5", fg: "#1a2238", mute: "#5a6785", alt: "#ffffff", accent: "#3a56e4", onAccent: "#ffffff", line: "#cfd6e6", font: "font.inter", head: "font.inter", weight: "700", btn: "solid", radius: "18px", btnRadius: "999px" });
const S_PLANS = skin("plans", "Quatre plans", { bg: "#1d3557", fg: "#f1faee", mute: "#a8dadc", alt: "#457b9d", accent: "#e63946", onAccent: "#ffffff", line: "#a8dadc", font: "font.dm-sans", head: "font.dm-sans", weight: "800", btn: "solid" });
const S_INVERSE = skin("inverse", "Miroir", { bg: "#fff8e7", fg: "#1f1300", mute: "#7a6a40", alt: "#ffe9b0", accent: "#1f1300", onAccent: "#fff8e7", line: "#1f1300", font: "font.work-sans", head: "font.bowlby-one", weight: "400", btn: "solid" });
const S_CABINET = skin("archive-erreurs", "Cabinet de curiosités", { bg: "#f7f1e1", fg: "#2f2616", mute: "#7f6e49", alt: "#fffaf0", accent: "#7a1f1f", onAccent: "#ffffff", line: "#2f2616", font: "font.lora", head: "font.playfair-display", weight: "700", btn: "solid" });

module.exports = [
  { key: "texte-monumental", family: "experimentales", skin: S_MONUM, name: "Texte monumental", tags: ["expérimental", "défilement", "typographie"],
    desc: "Un mot si grand qu'il défile en continu sur toute la largeur ; le message est lisible dessous.", decl: { C: 12, N: 1, P: 3, T: 4 },
    build: (k) => [stage(k, [k.col([
      W(k, "marquee", { items: [{ text: "INTROUVABLE" }, { text: "404" }, { text: "INTROUVABLE" }], speed: "slow", direction: "left", separator: "—" }, { fontFamily: "font.archivo-black", fontSize: "18vw", lineHeight: 0.9, color: "#0d0d0d" }),
      k.row([k.H(MSG, "1", { fontSize: "26px" }), k.B("Retour à l'accueil", "/", "solid")], { gap: "24px", justifyContent: "space-between", width: "100%", marginTop: "30px" }),
    ], { gap: "10px", width: "100%" })], { gap: "0px" })] },

  { key: "chiffres-en-mouvement", family: "experimentales", skin: S_MOUVEMENT, name: "Chiffres en mouvement", tags: ["expérimental", "animation", "contour"],
    desc: "Le 404 en contour s'anime en continu, le message apparaît lettre par lettre, la sortie suit.", decl: { C: 11, N: 11, P: 6, T: 8 },
    build: (k) => [stage(k, [k.col([
      W(k, "motionkinetictext", { lines: [{ text: "404", look: "outline" }], tag: "p", accent: "#ee6c4d" }, { fontSize: "20vw", fontFamily: "font.syne", textAlign: "center" }),
      W(k, "motionsplittext", { text: MSG, tag: "h1", split: "chars" }, { fontSize: "32px", textAlign: "center", color: "#e0fbfc" }),
      k.B("Retour à l'accueil", "/", "solid", { alignSelf: "center" }),
    ], { gap: "16px", width: "100%" })], { gap: "0px" })] },

  { key: "interface-narrative", family: "experimentales", skin: S_NARR, name: "Interface narrative", tags: ["expérimental", "conversation", "message"],
    desc: "Une conversation avec la page disparue : bulles de messages, réponses proposées sous forme de boutons.", decl: { C: 14, N: 6, P: 1, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.card([k.L("La page"), k.T("<p>Bonjour ! Vous me cherchiez ?</p>")], { backgroundColor: "#ffffff", alignSelf: "flex-start", maxWidth: "380px" }),
      k.card([k.H(MSG, "1", { fontSize: "20px" })], { backgroundColor: "#3a56e4", color: "#ffffff", alignSelf: "flex-start", maxWidth: "420px" }),
      k.card([k.T("<p>Je n'existe plus à cette adresse… " + WHY.toLowerCase() + "</p>")], { backgroundColor: "#ffffff", alignSelf: "flex-start", maxWidth: "460px" }),
      k.row([k.B("Où aller ?", "/", "solid"), k.B("Lire le blog", "/blog", "outline"), k.B("Écrire au support", "/contact", "outline")], { gap: "10px", alignSelf: "flex-end" }),
    ], { gap: "12px", width: "100%", maxWidth: "620px", marginLeft: "auto", marginRight: "auto" })])] },

  { key: "plans-multiples", family: "experimentales", skin: S_PLANS, name: "Plans multiples", tags: ["expérimental", "profondeur", "calques"],
    desc: "Quatre plans de couleur empilés (fond, collines, tour, soleil) avec le message au premier plan, tout en aplats.", decl: { C: 4, N: 4, P: 4, T: 1 },
    build: (k) => [stage(k, [k.col([
      shape("14vw", "14vw", "#f1faee", { borderRadius: "50%", alignSelf: "flex-end", minWidth: "70px", minHeight: "70px", marginRight: "8%" }),
      k.row([shape("46%", "140px", "#457b9d", { borderTopLeftRadius: "100%", borderTopRightRadius: "100%" }), shape("60%", "180px", "#a8dadc", { marginLeft: "-14%", borderTopLeftRadius: "100%", borderTopRightRadius: "100%" })], { gap: "0px", flexWrap: "nowrap", alignItems: "flex-end", marginTop: "-6vw", width: "100%" }),
      k.card([deco("404", { fontSize: "9vw", fontWeight: "800", color: "#1d3557", lineHeight: 0.9 }), k.H(MSG, "1", { fontSize: "28px", color: "#1d3557" }), k.B("Retour à l'accueil", "/", "solid")], { backgroundColor: "#f1faee", marginTop: "-60px", alignSelf: "center", alignItems: "center", gap: "10px" }),
    ], { gap: "0px", width: "100%" })], { gap: "0px", overflow: "hidden" })] },

  { key: "inverse", family: "experimentales", skin: S_INVERSE, name: "Inversé", tags: ["expérimental", "miroir", "asymétrie"],
    desc: "Tout est en miroir : le texte à droite, aligné à droite, la colonne d'actions à gauche ; le 404 en contour.", decl: { C: 10, N: 11, P: 5, T: 4 },
    build: (k) => [stage(k, [k.row([
      k.col([k.B("Accueil", "/", "solid"), k.B("Blog", "/blog", "outline"), k.B("Contact", "/contact", "outline")], { flexBasis: "24%", flexGrow: 0, minWidth: "160px", gap: "10px" }),
      k.col([deco("404", { fontSize: "16vw", fontFamily: "font.bowlby-one", color: "transparent", textStrokeWidth: "3px", textStrokeColor: "#1f1300", textAlign: "right", lineHeight: 0.85 }), k.H(MSG, "1", { fontSize: "36px", textAlign: "right", fontFamily: "font.bowlby-one" }), k.T("<p>" + WHY + "</p>", { textAlign: "right" })], { flexBasis: "62%", flexGrow: 1, minWidth: "280px", gap: "12px" }),
    ], { flexDirection: "row-reverse", alignItems: "center", gap: "40px", width: "100%" })])] },

  { key: "archive-des-erreurs", family: "experimentales", skin: S_CABINET, name: "Archive des erreurs", tags: ["expérimental", "cabinet de curiosités", "pédagogique"],
    desc: "Un cabinet de curiosités des codes d'erreur HTTP : la 404 est la pièce exposée, les autres sont expliquées.", decl: { C: 5, N: 6, P: 7, T: 8 },
    build: (k) => [stage(k, [k.col([
      k.H("Vous avez trouvé la pièce 404 du cabinet", "1", { fontSize: "34px", textAlign: "center", fontFamily: "font.playfair-display" }),
      k.grid(3, [["400", "Requête incorrecte", "L'adresse est mal formée."], ["403", "Accès interdit", "Cette page existe, mais pas pour tous."], ["404", "Introuvable", "Aucune page à cette adresse : vous y êtes."], ["410", "Disparue", "La page a été retirée volontairement."], ["500", "Erreur du serveur", "Un incident de notre côté."], ["503", "Indisponible", "Une maintenance est en cours."]].map(([c, t, d]) => k.card([deco(c, { fontSize: "38px", fontFamily: "font.playfair-display", color: c === "404" ? "#7a1f1f" : "#2f2616", fontWeight: "700", lineHeight: 0.95 }), k.H(t, "3", { fontSize: "16px" }), k.T("<p>" + d + "</p>", { fontSize: "14px", color: "#7f6e49" })], { backgroundColor: c === "404" ? "#ffe9e9" : "#fffaf0", borderStyle: "solid", borderWidth: c === "404" ? "2px" : "1px", borderColor: c === "404" ? "#7a1f1f" : "#2f2616", gap: "4px" })), { gap: "12px", width: "100%" }),
      k.B("Quitter le cabinet", "/", "solid", { alignSelf: "center" }),
    ], { gap: "18px", width: "100%" })])] },
];
