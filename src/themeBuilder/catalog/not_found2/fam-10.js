// Famille 10 — Éducation et formation (6 modèles) : plateforme LMS, cours populaires, recherche de cours, ressources, salle de classe, aide aux étudiants. Formations RÉELLES du catalogue.
const { skin, MSG, WHY, deco, stage, LK, U, shape, W, draw, courses, recent, cats } = require("./h");
const A = require("./art");
const S_LMS = skin("lms", "Campus", { bg: "#f5f7ff", fg: "#1b2559", mute: "#5c6aa6", alt: "#ffffff", accent: "#3b4cca", onAccent: "#ffffff", line: "#dce2ff", font: "font.nunito-sans", head: "font.nunito-sans", weight: "800", btn: "solid", radius: "14px" });
const S_COURS = skin("cours-populaires", "Campus chaud", { bg: "#fff8f0", fg: "#3d2314", mute: "#8b5e3c", alt: "#ffffff", accent: "#f97316", onAccent: "#ffffff", line: "#fed7aa", font: "font.poppins", head: "font.poppins", weight: "700", btn: "solid", radius: "18px", btnRadius: "999px" });
const S_RECHCOURS = skin("recherche-cours", "Catalogue", { bg: "#ffffff", fg: "#0f172a", mute: "#64748b", alt: "#f1f5f9", accent: "#0891b2", onAccent: "#ffffff", line: "#cbd5e1", font: "font.inter", head: "font.inter", weight: "800", btn: "solid" });
const S_RESS = skin("ressources", "Bibliothèque", { bg: "#f8f5ee", fg: "#2d2a22", mute: "#7a7360", alt: "#ffffff", accent: "#7c3f00", onAccent: "#ffffff", line: "#e0d8c3", font: "font.lora", head: "font.merriweather", weight: "700", btn: "solid" });
const S_CLASSE = skin("salle-de-classe", "Tableau noir", { bg: "#1f3d2b", fg: "#f3f6f1", mute: "#b6cbb9", alt: "#2a5239", accent: "#ffe08a", onAccent: "#1f3d2b", line: "#5c8a6b", font: "font.patrick-hand", head: "font.caveat", weight: "700", btn: "outline" });
const S_AIDE = skin("aide-etudiants", "Soutien", { bg: "#f0f9ff", fg: "#0c2d48", mute: "#456b8a", alt: "#ffffff", accent: "#0284c7", onAccent: "#ffffff", line: "#bae6fd", font: "font.quicksand", head: "font.quicksand", weight: "700", btn: "solid", radius: "16px", btnRadius: "999px" });

module.exports = [
  { key: "plateforme-lms", family: "education", skin: S_LMS, name: "Plateforme LMS", tags: ["formation", "compte", "catalogue"],
    desc: "L'écran d'une plateforme d'apprentissage : espace apprenant à gauche, formations récentes à droite.", decl: { C: 8, N: 6, P: 5, T: 1 },
    build: (k) => [stage(k, [k.row([
      k.col([k.L("Votre campus"), k.H(MSG, "1", { fontSize: "26px" }), k.account({ justifyContent: "flex-start" }), k.B("Reprendre mes cours", "/compte", "solid"), U(k, "Accueil", "/")], { flexBasis: "28%", flexGrow: 1, minWidth: "240px", gap: "14px", backgroundColor: "#ffffff", borderStyle: "solid", borderWidth: "1px", borderColor: "#dce2ff", paddingTop: "22px", paddingBottom: "22px", paddingLeft: "22px", paddingRight: "22px" }),
      k.col([k.L("Continuez à apprendre"), courses(k, 3)], { flexBasis: "64%", flexGrow: 1, minWidth: "280px", gap: "12px" }),
    ], { alignItems: "flex-start", gap: "24px", width: "100%" })])] },

  { key: "cours-populaires", family: "education", skin: S_COURS, name: "Cours populaires", tags: ["formation", "cartes", "populaires"],
    desc: "Un message encourageant puis les formations en cartes : on apprend autre chose en attendant de retrouver la page.", decl: { C: 1, N: 6, P: 4, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.H("Cette leçon n'existe pas… mais d'autres vous attendent", "1", { fontSize: "36px", textAlign: "center", lineHeight: 1.15 }),
      courses(k, 6, { sort: "recent" }), k.B("Voir tout le catalogue", "/catalogue", "solid", { alignSelf: "center" }),
    ], { gap: "20px", width: "100%" })])] },

  { key: "recherche-de-cours", family: "education", skin: S_RECHCOURS, name: "Recherche de cours", tags: ["formation", "recherche", "catalogue"],
    desc: "Une recherche dans le catalogue de formations au centre ; trois formations récentes en dessous.", decl: { C: 1, N: 2, P: 1, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.L("404 — formation ou page introuvable", { textAlign: "center" }), k.H("Quelle formation cherchez-vous ?", "1", { fontSize: "44px", textAlign: "center" }),
      k.search("catalogue", { maxWidth: "620px", width: "100%", alignSelf: "center", suggest: true }), courses(k, 3),
    ], { gap: "20px", width: "100%" })])] },

  { key: "ressources-pedagogiques", family: "education", skin: S_RESS, name: "Ressources", tags: ["formation", "ressources", "faq"],
    desc: "Une bibliothèque de ressources : questions fréquentes d'étudiants en accordéon et les derniers articles pédagogiques.", decl: { C: 6, N: 6, P: 7, T: 2 },
    build: (k) => [stage(k, [k.row([
      k.col([k.H("Ressource introuvable", "1", { fontSize: "36px" }), k.T("<p>" + WHY + "</p>"), W(k, "accordion", { items: [{ q: "Je ne retrouve plus un cours", a: "<p>Le catalogue liste toutes les formations ; la recherche vous aide à retrouver un titre.</p>" }, { q: "Un lien du cours est cassé", a: "<p>Écrivez-nous depuis la page de contact en indiquant le cours concerné.</p>" }, { q: "Où lire des conseils ?", a: "<p>Le blog regroupe nos conseils pédagogiques.</p>" }], single: true }, { width: "100%" })], { flexBasis: "50%", flexGrow: 1, minWidth: "280px", gap: "14px" }),
      k.col([recent(k, "Lectures pédagogiques", 5), cats(k, "Par thème", { title: "Par thème" }), U(k, "Retour à l'accueil", "/")], { flexBasis: "38%", flexGrow: 1, minWidth: "260px", gap: "16px" }),
    ], { alignItems: "flex-start", gap: "36px", width: "100%" })])] },

  { key: "salle-de-classe", family: "education", skin: S_CLASSE, name: "Salle de classe", tags: ["formation", "tableau noir", "calcul"],
    desc: "Un tableau noir à la craie : « 4 + 0 + 4 = ? » ; la bonne réponse, c'est de retourner à l'accueil.", decl: { C: 1, N: 6, P: 2, T: 5 },
    build: (k) => [stage(k, [k.col([
      deco("4 + 0 + 4 = ?", { fontSize: "9vw", fontFamily: "font.caveat", color: "#f3f6f1", lineHeight: 0.95 }),
      k.H("Page introuvable — exercice : retrouver son chemin", "1", { fontSize: "34px", fontFamily: "font.caveat", color: "#ffe08a" }),
      k.T("<p>Correction : " + WHY + "</p>", { fontFamily: "font.patrick-hand", fontSize: "22px" }),
      k.row([k.B("Réponse : l'accueil", "/", "outline"), k.B("Demander au professeur", "/contact", "outline")], { gap: "14px" }),
    ], { gap: "16px", width: "100%", borderStyle: "solid", borderWidth: "8px", borderColor: "#a16207", backgroundColor: "#1f3d2b", paddingTop: "34px", paddingBottom: "34px", paddingLeft: "34px", paddingRight: "34px" })], { gap: "0px", backgroundColor: "#d6c7a1" })] },

  { key: "aide-aux-etudiants", family: "education", skin: S_AIDE, name: "Aide aux étudiants", tags: ["formation", "soutien", "aide"],
    desc: "Une page de soutien : un message bienveillant, une fenêtre « besoin d'aide ? » et les formations pour continuer.", decl: { C: 14, N: 6, P: 5, T: 1 },
    build: (k) => [stage(k, [k.col([
      k.card([k.L("Ton assistant"), k.T("<p>Oups ! Je ne retrouve pas cette page (erreur 404). Je peux t'aider à retrouver ton cours.</p>", { fontSize: "18px" })], { backgroundColor: "#ffffff", alignSelf: "flex-start", maxWidth: "560px" }),
      k.card([k.H("Cette page est introuvable", "1", { fontSize: "26px" }), k.T("<p>Que veux-tu faire ?</p>")], { backgroundColor: "#e0f2fe", alignSelf: "flex-end", maxWidth: "460px" }),
      k.row([k.B("Voir mes formations", "/catalogue", "solid"), k.B("Parler à un tuteur", "/contact", "outline"), W(k, "modal", { buttonLabel: "Que s'est-il passé ?", variant: "outline", title: "Pourquoi cette page est-elle introuvable ?", text: "<p>" + WHY + "</p>", ctaLabel: "Retour à l'accueil", ctaUrl: "/" }, {})], { gap: "12px", alignSelf: "flex-end" }),
    ], { gap: "16px", width: "100%", maxWidth: "760px", marginLeft: "auto", marginRight: "auto" })])] },
];
