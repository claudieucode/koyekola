// Famille 13 — Univers sectoriels (6 concepts) : automobile, architecture, immobilier, mode, art, recherche. Même règles que les autres familles (un seul titre {{post.title}}, un seul contenu, aucune donnée inventée).
const { L, META, COL, CRUMB, T, BODY, EX, IMG, SHR, REL, ALERT } = require("./h");
const band0 = { paddingTop: "0px", paddingBottom: "0px", paddingLeft: "0px", paddingRight: "0px" };
module.exports = [
  L("essai-automobile", "Essai automobile", ["automobile", "fiche technique", "sombre"], "Image panoramique en ouverture, titre en capitales, trois cases de repères (rubrique, date, lecture) puis essai en colonne large et partage.", "nuit", (k) => [
    k.band([IMG(k, { maxHeight: "560px", borderRadius: "0px" })], band0),
    k.section([k.W("postterms", { show: "category", look: "text" }), T(k, 60, { textTransform: "uppercase", letterSpacing: "1px" }),
      k.grid(3, [k.card([k.L("Rubrique"), k.dyn("post.category", { fontWeight: "700", fontSize: "20px" })]), k.card([k.L("Publié le"), k.dyn("post.date", { fontWeight: "700", fontSize: "20px" })]), k.card([k.L("Lecture"), k.dyn("post.reading_time", { fontWeight: "700", fontSize: "20px" })])]),
      BODY(k, "820px", { fontSize: "18px", lineHeight: 1.8 }), k.W("sharebuttons", SHR("Partager l'essai")), k.W("querylist", REL({ title: "Autres essais", count: 3 }))], { maxWidth: "1100px" })]),
  L("projet-architecture", "Projet d'architecture", ["architecture", "fiche projet", "asymétrique"], "Fiche projet étroite à gauche (auteur, dates, étiquettes), grand titre et texte à droite sous une image en pleine largeur, projets voisins en pied.", "editorial", (k) => [
    k.band([IMG(k, { maxHeight: "600px", borderRadius: "0px" })], band0),
    k.section([k.grid(2, [k.col([k.W("badge", { text: "Projet", tone: "neutral" }), k.W("postmeta", META({ separator: "none" })), k.W("postterms", { show: "tags", look: "text" }), k.W("authorbox", { showAvatar: true, heading: "" })], { position: "sticky", top: "32px", gap: "20px", fontSize: "14px" }, null, { position: "static" }),
      k.col([T(k, 54), EX(k, { fontSize: "21px" }), BODY(k, "720px", { lineHeight: 1.85 })], { gap: "28px" })], { gridTemplate: "1fr 3fr", alignItems: "start" }),
      k.W("querylist", REL({ title: "Projets voisins", count: 3 }))], { maxWidth: "1180px" })]),
  L("guide-immobilier", "Guide immobilier", ["immobilier", "à retenir", "conseil"], "Titre et chapô en tête, texte du guide à gauche, encadré collant « À retenir » à droite avec rubrique, date et invitation à poursuivre sur le blog.", "clair", (k) => [k.section([
    k.W("breadcrumb", CRUMB), T(k, 44), EX(k),
    k.grid(2, [k.col([IMG(k, { maxHeight: "420px" }), BODY(k, "720px", { lineHeight: 1.8 })], { gap: "28px" }),
      k.card([k.L("À retenir"), k.dyn("post.category", { fontWeight: "700" }), k.dyn("post.date", { color: k.S.mute }), k.dyn("post.reading_time", { color: k.S.mute }), k.divider(), k.B("Voir tous les articles", "/blog"), k.W("sharebuttons", SHR("Envoyer ce guide"))], { position: "sticky", top: "32px" }, null, { position: "static" })], { gridTemplate: "2fr 1fr", alignItems: "start" })], { maxWidth: "1100px" })]),
  L("lookbook-mode", "Lookbook mode", ["mode", "lookbook", "élégant"], "Visuel haut en pleine hauteur à gauche, édition et titre en serif à droite, texte étroit, puis quatre suggestions de la même rubrique.", "doux", (k) => [k.section([
    k.grid(2, [IMG(k, { maxHeight: "680px", borderRadius: "0px" }), k.col([k.L("Édition"), T(k, 56, { fontStyle: "italic", fontWeight: "400" }), EX(k, { fontSize: "20px" }), k.W("postmeta", META({ showReading: false, separator: "dot" }))], { gap: "22px", justifyContent: "center" })], { gridTemplate: "1fr 1fr", alignItems: "center" }),
    BODY(k, "600px", { lineHeight: 1.9 }), k.W("querylist", REL({ title: "Dans la même rubrique", mode: "samecategory", count: 4 }))], { maxWidth: "1180px" })]),
  L("critique-art", "Critique d'exposition", ["art", "critique", "encadré"], "Citation du chapô en ouverture, image présentée dans un cadre épais comme au mur d'une galerie, cartel (rubrique, date) puis critique en colonne étroite.", "editorial", (k) => [k.section([
    k.W("badge", { text: "Critique", tone: "neutral" }), T(k, 50, { textAlign: "center", fontStyle: "italic" }), k.W("quote", { text: "{{post.excerpt}}", author: "" }, { fontSize: "24px", textAlign: "center", ...COL("640px") }),
    k.col([IMG(k, { maxHeight: "480px", borderRadius: "0px" }), k.row([k.dyn("post.category", { fontWeight: "700" }), k.dyn("post.date", { color: k.S.mute })], { justifyContent: "center" })], { borderStyle: "solid", borderWidth: "10px", borderColor: k.S.fg, paddingTop: "28px", paddingBottom: "20px", paddingLeft: "28px", paddingRight: "28px", ...COL("760px") }),
    BODY(k, "600px", { lineHeight: 1.9 }), k.W("authorbox", { showAvatar: true, heading: "La critique" })], { maxWidth: "860px", gap: "36px" })]),
  L("publication-recherche", "Publication de recherche", ["recherche", "résumé", "références"], "Résumé encadré et mots-clés sous le titre, plan numéroté collant à gauche, texte à droite, encart « Comment citer » modifiable et auteur.", "clair", (k) => [k.section([
    T(k, 38), k.card([k.L("Résumé"), k.dyn("post.excerpt", { fontSize: "17px" }), k.W("postterms", { show: "tags", look: "text" })]), k.W("postmeta", META({ showUpdated: true })),
    k.grid(2, [k.col([k.W("toc", { title: "Plan", depth: "3", numbered: true })], { position: "sticky", top: "32px" }, null, { position: "static" }),
      k.col([BODY(k, "720px", { lineHeight: 1.75 }), k.W("alert", ALERT("info", "Comment citer cet article", "Indiquez l'auteur, le titre, la date de publication et l'adresse de la page. Ce texte est modifiable."))], { gap: "28px" })], { gridTemplate: "1fr 3fr", alignItems: "start" }),
    k.W("authorbox", { showAvatar: true, heading: "Auteur" })], { maxWidth: "1100px" })]),
];
