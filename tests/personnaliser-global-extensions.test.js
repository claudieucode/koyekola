// Personnaliser › Global : fonctions ajoutées au modèle (unités, mots, éléments annexes, rôles de couleur, dégradés, états, conteneur large, boutons : désactivé, ombre, survol)
// et règles de priorité (variables, faible spécificité, un réglage vide n'écrit rien). Pur calcul : aucune base ni serveur.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const gs = require("../src/marketing/pages/globalStyles");

const css = (g, target = "site") => gs.globalCss(gs.normalizeGlobal(g, { strict: true }), target);

describe("typographie étendue", () => {
  test("unités de taille (px, em, rem, %, vw) avec bornes propres à chaque unité", () => {
    assert.ok(css({ typography: { h1: { size: 3, unit: "rem" } } }).includes("--kw-h1-size:3rem"));
    assert.ok(css({ typography: { h2: { size: 120, unit: "%" } } }).includes("--kw-h2-size:120%"));
    assert.ok(css({ typography: { bodyFont: { size: 1.1, unit: "em" } } }).includes("--kw-body-size:1.1em"));
    assert.throws(() => gs.normalizeGlobal({ typography: { h1: { size: 500, unit: "px" } } }, { strict: true }), /taille/);
    assert.throws(() => gs.normalizeGlobal({ typography: { h1: { size: 30, unit: "rem" } } }, { strict: true }), /taille/);
    assert.throws(() => gs.normalizeGlobal({ typography: { h1: { size: 2, unit: "pt" } } }, { strict: true }), /unité/);
  });
  test("la taille mobile reprend l'unité du titre et n'écrase jamais l'ordinateur", () => {
    const out = css({ typography: { h1: { size: 3, unit: "rem", mobile: { size: 1.8 } } } });
    const [desktop, rest] = out.split("@media (max-width: 767px)");
    assert.ok(desktop.includes("3rem") && !desktop.includes("1.8rem"));
    assert.ok(rest.includes("font-size:1.8rem") && rest.includes("--kw-h1-size:1.8rem"));
  });
  test("espacement des mots, largeur de lecture, citations / légendes / listes / texte secondaire", () => {
    const out = css({ typography: { bodyFont: { ws: 0.1 }, readWidth: 68, others: { quote: { style: "italic", size: 18 }, caption: { size: 13, color: "#445566" }, list: { lh: 1.7 }, small: { transform: "uppercase" }, secondary: { color: "#778899" } } } });
    assert.ok(out.includes("word-spacing:0.1em") && out.includes("max-width:68ch"));
    assert.match(out, /blockquote[^{]*\{[^}]*font-size:18px[^}]*font-style:italic/);
    assert.match(out, /figcaption[^{]*\{[^}]*font-size:13px[^}]*color:#445566/);
    assert.match(out, /\.kw-list[^{]*\{[^}]*line-height:1\.7/);
    assert.match(out, /small[^{]*\{[^}]*text-transform:uppercase/);
    assert.match(out, /\.kw-muted[^{]*\{[^}]*color:#778899/);
  });
  test("les liens passent par un sélecteur plus fort que la feuille du thème mais plus faible que les éléments locaux (ordre de la feuille)", () => {
    const out = css({ typography: { link: { color: "#c81e3c", hover: "#901030" } } });
    assert.match(out, /\.lp-site :where\([^)]*\) a\{color:#c81e3c/);
    assert.match(out, /\) a:hover\{color:#901030/);
  });
});

describe("couleurs étendues", () => {
  const grad = { id: "g1", name: "Océan", kind: "linear", angle: 45, stops: [{ c: "#0b2a40", p: 0 }, { c: "#0277b6", p: 100 }] };
  test("rôles de couleur : variables du thème ET noms publics --site-color-…", () => {
    const out = css({ colors: { accent: "#aa2244", secondary: "#112233", highlight: "#f59e0b", complementary: "#00aa88", textSecondary: "#667788", divider: "#dddddd", text: "#101820", headings: "#0b2a40", border: "#cccccc", siteBg: "#f8fafc", contentBg: "#ffffff" } });
    for (const v of ["--kw-primary:#aa2244", "--kw-secondary:#112233", "--kw-accent:#f59e0b", "--kw-complementary:#00aa88", "--kw-muted:#667788", "--kw-divider:#dddddd", "--site-color-primary:#aa2244", "--site-color-secondary:#112233", "--site-color-accent:#f59e0b", "--site-color-text-secondary:#667788", "--site-color-background:#f8fafc", "--site-color-border:#cccccc"]) assert.ok(out.includes(v), v);
  });
  test("dégradés : limites, ordre des points, fond du site et fond de bouton", () => {
    const out = css({ colors: { gradients: [grad], siteBgGradient: "g1" }, buttons: { primary: { normal: { bg: "g:g1" } } } });
    assert.ok(out.includes("--site-gradient-g1:linear-gradient(45deg, #0b2a40 0%, #0277b6 100%)"));
    assert.ok(out.includes("background-image:var(--site-gradient-g1)"));
    assert.match(out, /lp-btn\)\{background:var\(--site-gradient-g1\)/);
    assert.ok(css({ colors: { gradients: [{ ...grad, kind: "radial" }] } }).includes("radial-gradient(circle at center"));
    const bad = (g) => assert.throws(() => gs.normalizeGlobal({ colors: { gradients: [g] } }, { strict: true }), /Dégradé/);
    bad({ ...grad, stops: [{ c: "#000000", p: 0 }] });
    bad({ ...grad, stops: [{ c: "rouge", p: 0 }, { c: "#fff", p: 100 }] });
    bad({ ...grad, id: "x y" });
    assert.equal(gs.normalizeGlobal({ colors: { gradients: [grad], siteBgGradient: "g9" } }).colors.siteBgGradient, "", "un fond qui vise un dégradé inconnu est retiré");
  });
  test("états : contour du focus clavier et éléments désactivés", () => {
    const out = css({ colors: { states: { focus: "#ff5500", disabled: "#999999" } } });
    assert.match(out, /:focus-visible\{outline-color:#ff5500/);
    assert.match(out, /:disabled\{color:#999999/);
  });
  test("aucun réglage de couleur = aucune règle de couleur", () => assert.equal(css({}), ""));
});

describe("conteneur étendu", () => {
  test("largeur large, largeur maximale du site, alignement, débordement — par écran", () => {
    const out = css({ container: { wide: { d: 1400, m: 900 }, maxWidth: { d: 1600 }, align: "left", overflow: "hidden" } });
    assert.ok(out.includes("margin-inline:calc(50% - min(700px, 50vw - 16px))"));
    assert.match(out, /@media \(max-width: 767px\)\{[^@]*min\(450px/);
    assert.ok(out.includes("max-width:1600px") && out.includes("margin-inline:0 auto") && out.includes("overflow:hidden"));
    assert.throws(() => gs.normalizeGlobal({ container: { align: "diagonal" } }, { strict: true }), /Alignement/);
    assert.throws(() => gs.normalizeGlobal({ container: { wide: { d: 99999 } } }, { strict: true }), /large/);
  });
});

describe("boutons étendus", () => {
  test("état désactivé, ombre détaillée, survol (élévation, échelle), largeur min / max", () => {
    const out = css({ buttons: { primary: { disabled: { bg: "#cccccc", color: "#777777" }, shadowCustom: { on: true, x: 2, y: 6, blur: 14, spread: -1, color: "#000000", opacity: 0.25 }, hoverLift: 2, hoverScale: 1.04, minWidth: { d: 120 }, maxWidth: { d: 400, m: 280 } } } });
    assert.match(out, /:where\(:disabled, \[disabled\], \[aria-disabled="true"\]\)\{background:#cccccc;color:#777777;cursor:not-allowed/);
    assert.ok(out.includes("box-shadow:2px 6px 14px -1px #00000040"));
    assert.ok(out.includes("--kw-shadow-button:2px 6px 14px -1px #00000040"), "la variable lue par la feuille du thème est aussi posée");
    assert.ok(out.includes("transform:translateY(-2px) scale(1.04)"));
    assert.ok(out.includes("min-width:120px") && out.includes("max-width:400px"));
    assert.match(out, /@media \(max-width: 767px\)\{[^@]*max-width:280px/);
  });
  test("le rayon et la hauteur du bouton principal passent par les variables du thème (la feuille du thème les lit avec un sélecteur plus fort)", () => {
    const out = css({ buttons: { primary: { radius: { linked: true, unit: "px", d: { t: 20, r: 20, b: 20, l: 20 } }, minHeight: { d: 56 }, font: { size: 17, weight: 700 } } } });
    for (const v of ["--kw-radius-button:20px 20px 20px 20px", "--kw-button-height:56px", "--kw-button-size:17px", "--kw-button-weight:700"]) assert.ok(out.includes(v), v);
  });
  test("ombre : refus d'une valeur hors limites", () => {
    assert.throws(() => gs.normalizeGlobal({ buttons: { primary: { shadowCustom: { on: true, blur: 999 } } } }, { strict: true }), /flou/);
    assert.throws(() => gs.normalizeGlobal({ buttons: { primary: { hoverScale: 3 } } }, { strict: true }), /échelle/);
  });
});

describe("sécurité et cibles", () => {
  test("aucune valeur libre n'atteint la feuille : chevrons retirés, couleurs et listes fermées", () => {
    assert.throws(() => gs.normalizeGlobal({ colors: { gradients: [{ id: "g1", name: "x", kind: "linear", angle: 0, stops: [{ c: "#000000;}body{x:y", p: 0 }, { c: "#ffffff", p: 100 }] }] } }, { strict: true }), /Dégradé/);
    assert.ok(!css({ colors: { gradients: [{ id: "g1", name: "<b>x</b>", kind: "linear", angle: 0, stops: [{ c: "#000000", p: 0 }, { c: "#ffffff", p: 100 }] }] } }).includes("<"));
  });
  test("site principal : cibles propres au principal, jamais celles d'un site", () => {
    const out = css({ typography: { others: { quote: { style: "italic" } } }, container: { wide: { d: 1400 } } }, "principal");
    assert.match(out, /main :where\(blockquote\)\{font-style:italic/);
    assert.ok(!out.includes(".lp-site"));
  });
});
