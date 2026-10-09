// Éditeur de pages — THÈMES : générateur de palette (calculs purs, contrastes WCAG) sur des couleurs extrêmes.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const T = require("../public/js/page-builder-theme.js");

const EXTREMES = ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffe9a0", "#808080"];
describe("générateur de palette de l'éditeur", () => {
  test("couleurs invalides : repli sur l'accent par défaut, sans erreur", () => {
    assert.ok(T.derive({ accent: "pas une couleur" }).tokens["--editor-panel"]);
    assert.ok(T.derive().tokens["--editor-accent"]);
  });
  for (const accent of EXTREMES) for (const panel of [undefined, "#111827", "#f4f6f8"]) {
    test(`accent ${accent} sur panneau ${panel || "automatique"} : texte, accent et couleur sur accent lisibles`, () => {
      const r = T.derive({ accent, panel }).report;
      assert.ok(r.text >= 7, `texte ${r.text}`);
      assert.ok(r.secondary >= 5.5 && r.muted >= 4.5, `secondaire ${r.secondary} / discret ${r.muted}`);
      assert.ok(r.accentText >= 4.5, `accent-texte ${r.accentText}`);
      assert.ok(r.onAccent >= 4.5, `texte sur accent ${r.onAccent}`);
      assert.ok(r.accent >= 3, `accent ${r.accent}`);
    });
  }
  test("panneau sombre → schéma sombre, panneau clair → schéma clair ; barre du haut toujours sombre", () => {
    assert.equal(T.derive({ accent: "#0277b6", panel: "#111827" }).scheme, "dark");
    assert.equal(T.derive({ accent: "#0277b6", panel: "#ffffff" }).scheme, "light");
    for (const top of ["#ffffff", "#ffff00", "#0b2a40"]) assert.ok(T.luminance(T.parseHex(T.derive({ accent: "#0277b6", top }).tokens["--editor-top"])) <= 0.12, top);
  });
  test("un accent déjà lisible n'est pas modifié ; un accent trop pâle est ajusté mais reste de la même teinte", () => {
    assert.equal(T.derive({ accent: "#0277b6" }).report.accentAdjusted, false);
    const y = T.derive({ accent: "#ffff00" });
    assert.equal(y.report.accentAdjusted, true);
    const hue = (hex) => T.rgbToHsl(T.parseHex(hex))[0];
    assert.ok(Math.abs(hue(y.tokens["--editor-accent"]) - 60) < 8);
  });
  test("tous les jetons de l'éditeur sont fournis", () => {
    const t = T.derive({ accent: "#a3203f" }).tokens;
    for (const k of ["bg", "panel", "panel-secondary", "card", "input", "border", "border-strong", "guide", "text", "text-secondary", "muted", "hover", "active", "accent", "accent-text", "on-accent", "danger", "danger-bg", "success", "success-bg", "shadow", "focus", "scheme", "select-arrow", "search-icon", "top", "top-border"]) assert.ok(t[`--editor-${k}`], k);
  });
  test("les présets donnent tous une palette lisible", () => {
    assert.equal(T.PRESETS.length, 8);
    for (const p of T.PRESETS) { const r = T.derive(p).report; assert.ok(r.text >= 7 && r.accentText >= 4.5 && r.onAccent >= 4.5, p.name); }
  });
});
