// Groupe 10 — Créatif et expérimental (94-100) : compositions à fort parti pris, toujours en flux (aucun positionnement absolu)
const h = require("./h");
const { dir, L, W, p, H1, content, desc, sect, band, head, boxes, cards, steps, faq, tabs, quote, note, cta, counter, marquee, person, slot } = h;
module.exports = [
  L(dir(94), "creatif-asymetrique", "Composition asymétrique", ["créatif", "asymétrique", "colonnes inégales"], "Colonnes inégales et décalées : titre en haut à gauche, visuel à droite en retrait, texte en escalier.", (k) => [
    sect(k, [k.grid(2, [k.col([H1(k, 64), desc(k)], { alignSelf: "start" }), k.col([slot(k, "Visuel principal", 360)], { marginTop: "64px" })], { gridTemplate: "3fr 2fr", alignItems: "start" }), k.grid(2, [k.col([k.dyn("post.category", { fontSize: "13px" })]), content(k)], { gridTemplate: "1fr 3fr", alignItems: "start" })], "1180px")]),
  L(dir(95), "creatif-immersif", "Page immersive", ["créatif", "immersif", "plein écran"], "Sections de la hauteur de l'écran sur fond sombre, l'une après l'autre : un parcours de lecture continu.", (k) => [
    band(k, [k.col([H1(k, 72, { textAlign: "center" })], { maxWidth: "1000px", alignItems: "center" })], { minHeight: "70vh", justifyContent: "center", paddingTop: "96px", paddingBottom: "96px" }),
    band(k, [k.col([desc(k, { fontSize: "26px", textAlign: "center" })], { maxWidth: "760px" })], { backgroundColor: k.S.alt, minHeight: "50vh", justifyContent: "center" }),
    sect(k, [content(k)], "760px")]),
  L(dir(96), "creatif-narratif", "Page narrative", ["créatif", "narratif", "chapitres"], "Histoire en chapitres numérotés qui se révèlent à la lecture, avec citation de clôture.", (k) => [
    sect(k, [H1(k, 56), desc(k), W(k, "motionstickystory", {}, { width: "100%" }), content(k), quote(k)], "960px")]),
  L(dir(97), "creatif-horizontal", "Défilement horizontal", ["créatif", "horizontal", "rail"], "Rail horizontal de visuels sur ordinateur, empilé sur mobile : une galerie qui se parcourt de côté.", (k) => [
    sect(k, [H1(k, 50), W(k, "motionhgallery", {}, { width: "100%" }), content(k)], "1200px")]),
  L(dir(98), "creatif-typographique", "Page typographique", ["créatif", "typographie", "texte monumental"], "Mots en très grand corps qui se révèlent, texte courant discret : la typographie comme seul décor.", (k) => [
    sect(k, [W(k, "motionkinetictext", {}, { width: "100%" }), H1(k, 80, { lineHeight: 0.98, letterSpacing: "-3px" }), k.grid(2, [desc(k, { fontSize: "17px" }), content(k)], { gridTemplate: "1fr 2fr", alignItems: "start" })], "1180px")]),
  L(dir(99), "creatif-photo", "Photographie plein écran", ["créatif", "photographie", "une image par écran"], "Une image par écran, légendes discrètes et texte réduit : un récit presque sans mots.", (k) => [
    band(k, [slot(k, "Photographie 1", 560)], { paddingLeft: "0px", paddingRight: "0px", paddingTop: "0px", paddingBottom: "0px" }),
    sect(k, [H1(k, 44, { textAlign: "center" }), desc(k, { textAlign: "center" })], "720px"),
    band(k, [slot(k, "Photographie 2", 560)], { paddingLeft: "0px", paddingRight: "0px", paddingTop: "0px", paddingBottom: "0px" }),
    sect(k, [content(k)], "680px")]),
  L(dir(100), "creatif-plans", "Plans multiples", ["créatif", "couches", "contraste"], "Bandes superposées de couleurs et d'échelles contrastées, jouant des plans sans positionnement absolu.", (k) => [
    band(k, [k.col([H1(k, 84, { lineHeight: 0.95 })], { maxWidth: "1100px" })], { paddingTop: "80px", paddingBottom: "120px" }),
    band(k, [k.grid(2, [slot(k, "Visuel", 300), k.col([desc(k), content(k)])], { gridTemplate: "1fr 1fr", alignItems: "center" })], { backgroundColor: k.S.alt, marginTop: "-48px", paddingTop: "64px", paddingBottom: "64px" }),
    sect(k, [cta(k, "Une idée ?", "Comment nous écrire.")], "760px")]),
];
