// Les seuils d'écran par défaut (tablette 1023, mobile 767, grand écran 1920) sont écrits à trois endroits : le moteur de styles (nodes.js), les réglages du site (siteSettings.js)
// et le repli de l'éditeur (page-builder.js). Ce test échoue si l'un d'eux dérive, avant que le canvas et la page publiée ne divergent.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const num = (src, re, label) => { const m = re.exec(src); assert.ok(m, `${label} : valeur introuvable`); return Number(m[1]); };

test("les seuils par défaut sont identiques dans le moteur de styles, les réglages du site et l'éditeur", () => {
  const nodes = read("src/marketing/pages/nodes.js"), site = read("src/marketing/pages/siteSettings.js"), editor = read("public/js/page-builder.js");
  const fromNodes = { tablet: num(nodes, /const DEFAULT_BREAKPOINTS = \{ tablet: (\d+)/, "nodes.js tablette"), mobile: num(nodes, /const DEFAULT_BREAKPOINTS = \{[^}]*mobile: (\d+)/, "nodes.js mobile"), wide: num(nodes, /const DEFAULT_BREAKPOINTS = \{[^}]*wide: (\d+)/, "nodes.js grand écran") };
  const { DEFAULT_BREAKPOINTS } = require("../src/marketing/pages/siteSettings");
  assert.deepEqual(fromNodes, { ...DEFAULT_BREAKPOINTS }, "nodes.js et siteSettings.js doivent avoir les mêmes seuils par défaut");
  assert.equal(num(editor, /function desktopMin\(\) \{[^}]*Number\.isInteger\(bp\) \? bp : (\d+)\)/, "page-builder.js repli tablette"), DEFAULT_BREAKPOINTS.tablet, "repli de l'éditeur (tablette)");
  assert.equal(num(editor, /function wideFrom\(\) \{[^}]*Number\.isInteger\(w\) \? w : (\d+)/, "page-builder.js repli grand écran"), DEFAULT_BREAKPOINTS.wide, "repli de l'éditeur (grand écran)");
  assert.ok(site.includes("tablet: num(bp.tablet, 820, 1279") && site.includes("mobile: num(bp.mobile, 400, 767"), "bornes réglables des seuils");
});
