// Listes déroulantes : une seule flèche pour tout le site (style.css), à distance constante du bord droit ; aucune
// règle de composant ne doit l'effacer (raccourci « background: ») ni la repositionner localement.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const CSS = ["style.css", "marketing.css", "dashboard.css", "blog-editor.css", "seo-workspace.css", "app-rail.css"].map((f) => [f, fs.readFileSync(path.join(__dirname, "../public/css", f), "utf8")]);

test("règle globale : flèche du site, marge droite réservée, hauteur d'origine conservée", () => {
  const css = CSS.find(([f]) => f === "style.css")[1];
  const rule = css.match(/select:not\(\[multiple\]\):not\(\[size\]\) \{([^}]*)\}/);
  assert.ok(rule, "règle globale présente");
  for (const re of [/appearance: none/, /background-image: var\(--select-arrow\)/, /background-position: right var\(--select-arrow-inset\) center/, /padding-right: calc\(var\(--select-arrow-inset\) \+ var\(--select-arrow-size\) \+ 8px\)/, /line-height: calc\(1\.17em \+ 2px\)/]) assert.match(rule[1], re);
  assert.match(css, /--select-arrow-inset: 12px;/);
});

test("aucune règle de liste n'efface ni ne déplace la flèche", () => {
  for (const [file, css] of CSS) {
    for (const m of css.matchAll(/([^{}]*\bselect\b[^{}]*)\{([^}]*)\}/g)) {
      const [sel, body] = [m[1].trim(), m[2]];
      if (/option|selected|\.wp-lv-select|::?(before|after)/.test(sel) || /^@/.test(sel)) continue;
      assert.doesNotMatch(body, /(^|[;\s])background:/, `${file} : « ${sel.slice(0, 80)} » utilise background: (efface la flèche) — utiliser background-color`);
      if (!/select:not\(\[multiple\]\)/.test(sel)) assert.doesNotMatch(body, /background-position/, `${file} : « ${sel.slice(0, 80)} » repositionne la flèche`);
    }
  }
});
