// Famille 2 — Magazines professionnels (10 concepts)
const { L, META, COL, CRUMB, T, BODY, EX, IMG, SHR, REL } = require("./h");
module.exports = [
  L("une-editoriale", "Une éditoriale à chapô", ["magazine", "chapô", "filet double"], "Deux tiers de texte, un tiers de marge ; chapô encadré de filets doubles et fiche d'auteur en bas.", "editorial", (k) => [k.section([
    k.W("postterms", { show: "category", look: "text" }), T(k, 56), k.divider({ borderTopWidth: "4px", borderTopStyle: "double" }), EX(k, { fontSize: "21px", fontStyle: "italic" }),
    k.grid(2, [BODY(k, "720px", { margin: "0" }), k.col([k.W("postmeta", META({ separator: "bar" })), k.W("sharebuttons", SHR()), k.W("toc", { title: "Dans ce numéro", depth: "2", numbered: false })], { position: "sticky", top: "24px" }, null, { position: "static" })], { gridTemplate: "2fr 1fr", alignItems: "start" }),
    k.W("authorbox", {})], { maxWidth: "1100px" })]),
  L("magazine-bandeau", "Magazine à bandeau coloré", ["magazine moderne", "bandeau", "couleur"], "Bandeau de couleur de marque portant le titre, auteur en carte flottante au-dessus du texte.", "marque", (k) => [
    k.band([k.inner([k.col([k.W("badge", { text: "Magazine", tone: "neutral" }), T(k, 54)], { maxWidth: "820px" })])], { paddingTop: "64px", paddingBottom: "64px" }),
    k.section([k.W("authorbox", { heading: "" }, { marginTop: "-32px" }), BODY(k, "720px"), k.W("postterms", { show: "both", look: "pills" }), k.W("postnav", { sameCategory: true })], { maxWidth: "820px" })]),
  L("magazine-culture", "Magazine culturel à notes de marge", ["culture", "notes", "citation"], "Image partagée en deux avec le titre, texte principal et grande citation, notes sur le côté.", "doux", (k) => [k.section([
    k.grid(2, [k.col([k.dyn("post.category", { textTransform: "uppercase", fontSize: "13px" }), T(k, 46), EX(k)], { justifyContent: "center" }), IMG(k, { maxHeight: "460px" })], { alignItems: "center" }),
    k.grid(2, [BODY(k, "680px", { margin: "0" }), k.col([k.W("quote", { text: "{{post.excerpt}}", author: "{{post.author}}" }), k.W("postmeta", META({ separator: "dot" }))], { position: "sticky", top: "24px" }, null, { position: "static" })], { gridTemplate: "2fr 1fr", alignItems: "start" })], { maxWidth: "1100px" })]),
  L("magazine-lifestyle", "Magazine lifestyle en duo", ["lifestyle", "duo", "cartes"], "Image et texte en duo alterné sous un titre centré, puis cartes d'articles liés en fin de lecture.", "doux", (k) => [k.section([
    T(k, 44, { textAlign: "center" }), k.W("postmeta", META({ align: "center", separator: "dot" })), IMG(k, { maxHeight: "400px" }), BODY(k, "720px"), k.W("sharebuttons", SHR("Faire suivre")), k.W("querylist", REL({ title: "Dans le même esprit", count: 3 }))], { maxWidth: "1000px" })]),
  L("magazine-eco", "Magazine économique à chiffres clés", ["économie", "trois colonnes", "chiffres"], "Trois colonnes : sommaire, texte, et encadré « à retenir » collé à droite.", "clair", (k) => [k.section([
    T(k, 44), k.W("postmeta", META({ showUpdated: true })),
    k.grid(3, [k.W("toc", { title: "Plan", depth: "2", numbered: true }), BODY(k, "680px", { margin: "0" }), k.card([k.L("À retenir"), EX(k, { fontSize: "16px" }), k.W("iconlist", { items: [{ text: "Contexte", icon: "check" }, { text: "Analyse", icon: "check" }, { text: "Perspectives", icon: "check" }] })], { position: "sticky", top: "24px" }, null, { position: "static" })], { gridTemplate: "1fr 3fr 1.4fr", alignItems: "start" })], { maxWidth: "1180px" })]),
  L("magazine-tech", "Magazine technologique à panneau collant", ["technologie", "panneau", "sticky"], "Deux colonnes : texte à gauche, panneau collant avec auteur, partage et sommaire à droite.", "nuit", (k) => [k.section([
    k.W("breadcrumb", CRUMB), IMG(k, { maxHeight: "380px" }), T(k, 46),
    k.grid(2, [BODY(k, "720px", { margin: "0" }), k.card([k.W("authorbox", { heading: "" }), k.W("toc", { title: "Sommaire", depth: "3", numbered: false }), k.W("sharebuttons", SHR())], { position: "sticky", top: "24px" }, null, { position: "static" })], { gridTemplate: "2fr 1fr", alignItems: "start" })], { maxWidth: "1180px" })]),
  L("magazine-photo", "Magazine photo : image plein cadre", ["photographie", "plein cadre", "légende"], "Image très large en ouverture, titre sous l'image avec filet, texte en colonne centrée.", "clair", (k) => [
    k.band([IMG(k, { maxHeight: "560px", borderRadius: "0px" })], { paddingTop: "0px", paddingBottom: "0px", paddingLeft: "0px", paddingRight: "0px" }),
    k.section([T(k, 48, { textAlign: "center" }), k.divider({ ...COL("120px"), borderTopWidth: "3px" }), k.W("postmeta", META({ align: "center", separator: "bar" })), BODY(k, "700px"), k.W("postterms", { show: "tags", look: "pills" })], { maxWidth: "860px" })]),
  L("magazine-rail", "Magazine à rail de navigation", ["rail", "navigation latérale", "collant"], "Rail gauche collant regroupant sommaire et partage, colonne de texte au centre.", "clair", (k) => [k.section([
    k.grid(2, [k.col([k.W("toc", { title: "Rubriques", depth: "2", numbered: false }), k.W("sharebuttons", SHR())], { position: "sticky", top: "24px" }, null, { position: "static" }),
      k.col([T(k, 44), IMG(k, { maxHeight: "360px" }), BODY(k, "700px", { margin: "0" })], { gap: "24px" })], { gridTemplate: "1fr 3fr", alignItems: "start" })], { maxWidth: "1100px" })]),
  L("magazine-fiche-meta", "Magazine à fiche de métadonnées", ["métadonnées", "fiche", "catégories"], "Fiche complète en tête : auteur, dates, catégories, étiquettes, lecture, commentaires.", "marque", (k) => [k.section([
    T(k, 46), k.card([k.W("postmeta", META({ showUpdated: true, showComments: true, separator: "bar" })), k.W("postterms", { show: "both", look: "pills" })]), IMG(k, { maxHeight: "380px" }), BODY(k, "720px")], { maxWidth: "860px" })]),
  L("magazine-recommandes", "Magazine à rail de recommandations", ["recommandations", "articles liés", "rail"], "Texte à gauche, rail de cartes d'articles liés à droite, sans quitter la lecture.", "clair", (k) => [k.section([
    k.W("postterms", { show: "category", look: "text" }), T(k, 42), IMG(k, { maxHeight: "360px" }),
    k.grid(2, [BODY(k, "700px", { margin: "0" }), k.W("querylist", REL({ title: "Recommandés", count: 4, layout: "compact", mode: "related", showImage: true }))], { gridTemplate: "2fr 1fr", alignItems: "start" })], { maxWidth: "1100px" })]),
];
