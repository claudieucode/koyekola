// Apparences de l'éditeur : chaque thème définit tous ses jetons et respecte les contrastes essentiels (WCAG AA).
// Garde-fou : un thème ajouté ou modifié qui rendrait un texte, une icône ou un champ illisible fait échouer ce test.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const editorTheme = require("../src/services/editorTheme");

const CSS = fs.readFileSync(path.join(__dirname, "..", "public", "css", "blog-editor.css"), "utf8");
const blockOf = (selector) => {
  const i = CSS.indexOf(`${selector} {`);
  if (i < 0) return null;
  return CSS.slice(i, CSS.indexOf("}", i));
};
const tokensOf = (block) => Object.fromEntries([...block.matchAll(/(--ed-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const REQUIRED = ["--ed-bg", "--ed-surface", "--ed-surface-2", "--ed-hover", "--ed-active", "--ed-text", "--ed-text-2", "--ed-muted", "--ed-border", "--ed-border-strong",
  "--ed-primary", "--ed-primary-hover", "--ed-on-primary", "--ed-primary-fg", "--ed-primary-soft", "--ed-pressed-bg", "--ed-pressed-fg", "--ed-input-bg", "--ed-input-border",
  "--ed-input-text", "--ed-placeholder", "--ed-focus", "--ed-success", "--ed-warning", "--ed-danger", "--ed-link", "--ed-toast-bg", "--ed-toast-fg"];
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const base = tokensOf(blockOf(".wp-body"));
const resolve = (t, v) => { for (let i = 0; i < 4 && /^var\(/.test(v); i++) v = t[v.match(/var\((--[a-z0-9-]+)\)/)[1]]; return v; };

test("chaque thème prédéfini a un bloc de jetons complet (aucune couleur héritée par accident du thème clair)", () => {
  for (const t of editorTheme.THEMES.filter((x) => !["clair", "perso"].includes(x.key))) {
    const block = blockOf(`.wp-body[data-ed-theme="${t.key}"]`);
    assert.ok(block, `bloc absent pour ${t.key}`);
    const own = tokensOf(block);
    const missing = REQUIRED.filter((k) => !(k in own));
    assert.deepEqual(missing, [], `${t.key} : jetons manquants`);
  }
  for (const k of REQUIRED) assert.ok(k in base, `thème clair : ${k}`);
});

test("contrastes essentiels de chaque thème (texte, secondaire, liens, champs, boutons, états)", () => {
  const themes = [["clair", base], ...editorTheme.THEMES.filter((x) => !["clair", "perso"].includes(x.key)).map((x) => [x.key, { ...base, ...tokensOf(blockOf(`.wp-body[data-ed-theme="${x.key}"]`)) }])];
  for (const [key, t] of themes) {
    const v = (k) => resolve(t, t[k]);
    const pairs = [
      ["texte / surface", v("--ed-text"), v("--ed-surface"), 4.5], ["texte / surface posée", v("--ed-text"), v("--ed-surface-2"), 4.5],
      ["texte secondaire / surface", v("--ed-muted"), v("--ed-surface"), 4.5], ["texte secondaire / surface posée", v("--ed-muted"), v("--ed-surface-2"), 4.5],
      ["lien / surface", v("--ed-link"), v("--ed-surface"), 4.5], ["accent actif / sélection douce", v("--ed-primary-fg"), v("--ed-primary-soft"), 4.5],
      ["texte du champ / champ", v("--ed-input-text"), v("--ed-input-bg"), 4.5], ["indication du champ / champ", v("--ed-placeholder"), v("--ed-input-bg"), 4.5],
      ["bouton principal", v("--ed-on-primary"), v("--ed-primary"), 4.5], ["bouton principal (survol)", v("--ed-on-primary"), v("--ed-primary-hover"), 4.5],
      ["bouton enfoncé", v("--ed-pressed-fg"), v("--ed-pressed-bg"), 4.5], ["notification", v("--ed-toast-fg"), v("--ed-toast-bg"), 4.5],
      ["danger / surface", v("--ed-danger"), v("--ed-surface"), 4.5], ["succès / surface", v("--ed-success"), v("--ed-surface"), 4.5], ["avertissement / surface", v("--ed-warning"), v("--ed-surface"), 4.5],
      ["bordure de champ / panneau", v("--ed-input-border"), v("--ed-surface"), 1.25], ["anneau de focus / panneau", v("--ed-focus"), v("--ed-surface"), 3],
    ];
    for (const [label, fg, bg, min] of pairs) {
      assert.match(fg, /^#[0-9a-f]{6}$/i, `${key} ${label} : couleur ${fg}`);
      const r = ratio(fg, bg);
      assert.ok(r >= min, `${key} — ${label} : ${r.toFixed(2)} < ${min} (${fg} sur ${bg})`);
    }
  }
});

test("la feuille d'écriture garde la palette claire et les champs suivent le thème (plus de champ blanc forcé)", () => {
  assert.match(CSS, /\.wp-body \.wp-content, [^{]*\{[^}]*--ed-input-bg: #ffffff/);
  assert.doesNotMatch(CSS, /\.wp\[data-ed-theme\]/, "ancien système retiré");
  assert.doesNotMatch(CSS, /background: #fff; color: #10222f; border-color: rgba\(16, 34, 47, 0\.28\)/, "plus de champ blanc imposé");
});
