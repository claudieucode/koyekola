// Typographie Kolakisa : Arial / Arial Bold par défaut, une seule source centrale (--font-sans dans style.css).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

describe("typographie : Arial par défaut", () => {
  const css = read("public/css/style.css");
  test("la pile centrale commence par Arial et finit par sans-serif", () => {
    assert.match(css, /--font-sans:\s*Arial,[^;]*Helvetica[^;]*sans-serif;/);
    assert.match(css, /--font-display-weight:\s*700;/);
  });
  test("le texte et les titres de l'interface passent par la pile centrale", () => {
    assert.match(css, /--font-body:\s*var\(--font-sans\)/);
    assert.match(css, /--font-display:\s*var\(--font-sans\)/);
    assert.doesNotMatch(css, /--font-(body|display):[^;]*(Figtree|Bricolage)/);
  });
  test("aucune feuille de l'interface n'impose en dur l'ancienne police (hors choix explicite de l'auteur [data-ff])", () => {
    for (const f of fs.readdirSync(path.join(ROOT, "public/css")).filter((n) => n.endsWith(".css"))) {
      const src = read(`public/css/${f}`).replace(/@font-face\s*\{[^}]*\}/g, "");
      const lines = src.split("\n").filter((l) => /font-family\s*:[^;}]*(Figtree|Bricolage)/.test(l) && !/data-ff/.test(l));
      assert.deepEqual(lines, [], f);
    }
  });
  test("les jetons par défaut des sites utilisent Arial ; les choix existants restent possibles", () => {
    const t = require("../src/marketing/pages/tokens");
    assert.deepEqual(t.DEFAULT_TOKENS.fonts, { heading: "arial", body: "arial", button: "arial", link: "arial" });
    assert.ok(t.FONTS.figtree && t.FONTS.bricolage, "polices historiques toujours proposées");
    assert.match(t.tokensToCss({}), /--kw-font-heading:Arial,/);
  });
  test("plus de préchargement des anciennes polices", () => {
    assert.doesNotMatch(read("views/partials/header.ejs") + read("views/partials/font-preload.ejs"), /figtree|bricolage/i);
  });
});
