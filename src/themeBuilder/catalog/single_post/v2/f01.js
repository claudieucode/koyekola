// Famille 1 — Blogs minimalistes (8 concepts)
const { L, META, COL, T, BODY, EX, IMG, SHR, REL } = require("./h");
module.exports = [
  L("page-blanche", "Page blanche", ["minimaliste", "colonne unique", "sobre"], "Une seule colonne étroite, titre centré, métadonnées reléguées en pied de texte : rien ne distrait de la lecture.", "clair", (k) => [k.section([
    T(k, 40, { textAlign: "center" }), BODY(k, "640px", { fontSize: "19px", lineHeight: 1.8 }), k.divider(), k.W("postmeta", META({ align: "center", separator: "dot" }))], { maxWidth: "720px" })]),
  L("typo-pure", "Typographie pure", ["typographique", "serif", "sans image"], "Corps de texte en serif très lisible, titre monumental à gauche et aucune carte ni cadre.", "editorial", (k) => [k.section([
    T(k, 64, { textTransform: "none", letterSpacing: "-1px" }), EX(k, { fontSize: "22px", fontStyle: "italic" }), BODY(k, "700px", { fontSize: "20px", lineHeight: 1.85 })], { maxWidth: "820px" })]),
  L("large-lecture", "Large lecture", ["large", "confort", "image en tête"], "Colonne large de 920 px à interligne généreux pour grands écrans, image en tête puis texte aéré.", "clair", (k) => [k.section([
    T(k, 44), k.W("postmeta", META()), IMG(k, { maxHeight: "420px" }), BODY(k, "920px", { fontSize: "19px", lineHeight: 1.9 }), k.W("postterms", { show: "tags", look: "text" })], { maxWidth: "960px" })]),
  L("etroit-marge", "Colonne étroite et notes de marge", ["étroit", "marge", "sobre"], "Colonne de 520 px accompagnée d'une marge fine où se placent date, auteur et rubrique.", "doux", (k) => [k.section([
    k.grid(2, [k.col([k.W("postmeta", META({ showReading: false, separator: "none" })), k.W("postterms", { show: "category", look: "text" })], { position: "sticky", top: "32px", fontSize: "14px" }, null, { position: "static" }),
      k.col([T(k, 36), BODY(k, "520px", { fontSize: "18px", lineHeight: 1.8 })], { gap: "24px" })], { gridTemplate: "1fr 2fr", alignItems: "start" })], { maxWidth: "980px" })]),
  L("meta-fantome", "Métadonnées fantômes", ["discret", "métadonnées", "épuré"], "Image en incrustation, texte seul, et une unique ligne de métadonnées en dessous du titre.", "clair", (k) => [k.section([
    k.dyn("post.date", { fontSize: "13px", color: k.S.mute }), T(k, 38), IMG(k, { maxHeight: "300px", borderRadius: "4px" }), BODY(k, "680px", { lineHeight: 1.8 }), k.W("authorbox", { showAvatar: false, heading: "" })], { maxWidth: "720px" })]),
  L("titre-colossal", "Titre colossal", ["titre géant", "typographie", "sans image"], "Titre sur toute la largeur en très grand corps, date en exposant, texte en colonne décalée à droite.", "nuit", (k) => [k.section([
    k.dyn("post.date", { fontSize: "14px", color: k.S.mute, textTransform: "uppercase" }), T(k, 92, { lineHeight: 1.0, letterSpacing: "-2px" }), k.grid(2, [k.col([EX(k, { fontSize: "18px" })]), BODY(k, "680px", { fontSize: "18px" })], { gridTemplate: "1fr 2fr", alignItems: "start" })], { maxWidth: "1180px" })]),
  L("sommaire-nu", "Texte nu et sommaire replié", ["sommaire", "replié", "minimaliste"], "Aucun décor : un sommaire discret avant le texte, puis la lecture continue jusqu'à la navigation.", "clair", (k) => [k.section([
    T(k, 36), k.W("toc", { title: "Sommaire", depth: "2", numbered: false }), BODY(k, "680px"), k.W("postnav", {})], { maxWidth: "720px" })]),
  L("respiration", "Respiration et exergue", ["aéré", "citation", "centré"], "Grands blancs, image modeste, une grande citation tirée du chapô et un texte à largeur de lecture idéale.", "doux", (k) => [k.section([
    k.W("badge", { text: "À lire", tone: "neutral" }), T(k, 42, { textAlign: "center" }), IMG(k, { maxHeight: "260px", ...COL("560px") }), k.W("quote", { text: "{{post.excerpt}}", author: "" }, { fontSize: "26px", textAlign: "center", ...COL("620px") }), BODY(k, "660px", { lineHeight: 1.8 })], { maxWidth: "820px", gap: "40px" })]),
];
