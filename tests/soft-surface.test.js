// Soft Surface : surfaces douces à la place des contours — feuille centrale, chargement en dernier, jetons, aucune couleur en dur, états conservés
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (...p) => fs.readFileSync(path.join(__dirname, "..", ...p), "utf8");
const css = read("public", "css", "kola-soft.css");

describe("Soft Surface", () => {
  test("la feuille est chargée en dernier dans l'administration/Marketing et dans les gabarits site, élève et Mon espace", () => {
    const top = read("views", "marketing", "partials", "top.ejs");
    assert.ok(top.indexOf("kola-soft.css") > top.indexOf("kola-brand.css"), "après kola-brand.css");
    assert.ok(top.indexOf("kola-soft.css") < top.indexOf("</head>"));
    const header = read("views", "partials", "header.ejs");
    assert.ok(header.indexOf("kola-soft.css") > header.indexOf("dashboard.css"), "après dashboard.css");
    assert.ok(header.indexOf("kola-soft.css") > header.indexOf("kola-v3.css"), "après kola-v3.css");
  });
  test("jetons centralisés : surface, survol, focus, désactivé, erreur, filets, panneau, séparateur", () => {
    for (const t of ["--soft-field", "--soft-field-hover", "--soft-field-focus", "--soft-field-off", "--soft-field-err", "--soft-edge", "--soft-panel", "--soft-sep", "--soft-card-edge", "--soft-ring", "--soft-ring-err"]) assert.match(css, new RegExp(`${t}:`), t);
  });
  test("aucune couleur écrite en dur ni !important : tout passe par les jetons du contexte (thèmes clair/sombre et Mon espace)", () => {
    const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
    assert.doesNotMatch(code.replace(/var\([^)]*\)/g, ""), /#[0-9a-f]{3,8}\b|rgba?\(/i);
    assert.doesNotMatch(code, /!important/);
  });
  test("états conservés : focus visible (filet d'accent + anneau), erreur (filet + nuance), désactivé, survol ; pas de changement d'épaisseur de filet", () => {
    assert.match(css, /:focus:not\(\.rt-editor \*\)\s*\{[^}]*border-color:\s*var\(--accent[^}]*box-shadow:\s*var\(--soft-ring\)/);
    assert.match(css, /aria-invalid="true"[^{]*\{[^}]*border-color:\s*var\(--danger/);
    assert.match(css, /:disabled[^{]*\{[^}]*cursor:\s*not-allowed/);
    assert.doesNotMatch(css, /border(-top|-bottom|-left|-right)?-width/);
    assert.doesNotMatch(css, /outline:\s*none;[^}]*\}\s*[^{]*:focus-visible\s*\{\s*outline:\s*none/);
  });
  test("le bouton principal et « Créer » ne sont pas touchés", () => {
    assert.doesNotMatch(css, /\.btn-primary|mk-create|btn-create/);
  });
  test("la documentation liste les exceptions", () => {
    assert.match(read("docs", "KOLAKISA_SOFT_SURFACE.md"), /## 4\. Exceptions/);
  });
});
