// KOLAKISA — registre central des blocs (DT-4) : l'éditeur (nœuds Tiptap) et le serveur (liste blanche de sanitisation) ne peuvent plus diverger.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { BLOCKS, SCHEMA_VERSION, topNames } = require("../src/shared/blockRegistry");
const { sanitizeBlogHtml } = require("../src/utils/blogHtml");

const root = path.join(__dirname, "..");
const nodesSrc = fs.readFileSync(path.join(root, "src", "editor", "blog", "nodes.js"), "utf8");
const editingSrc = fs.readFileSync(path.join(root, "src", "editor", "blog", "editing.js"), "utf8");
const EXTENSIONS = new Set(["kbPullquote"]); // extensions d'attributs (pas des blocs)
const CORE = new Set(["paragraph", "heading", "bulletList", "orderedList", "taskList", "blockquote", "codeBlock", "table", "horizontalRule"]); // fournis par Tiptap (StarterKit, TaskList, TableKit)

describe("registre central des blocs", () => {
  test("chaque bloc du registre a son nœud dans l'éditeur (ou vient du noyau Tiptap)", () => {
    const declared = new Set([...nodesSrc.matchAll(/(?:name:\s*"|simpleBlock\("|preBlock\(\{\s*name:\s*")(\w+)"/g)].map((m) => m[1]));
    for (const b of BLOCKS) assert.ok(CORE.has(b.name) || declared.has(b.name), `${b.name} : déclaré au registre mais sans nœud dans nodes.js`);
  });
  test("chaque nœud personnalisé de l'éditeur est déclaré au registre", () => {
    const declared = [...nodesSrc.matchAll(/(?:name:\s*"|simpleBlock\("|preBlock\(\{\s*name:\s*")(\w+)"/g)].map((m) => m[1]).filter((n) => (/^kb[A-Z]|^callout$/.test(n)) && !EXTENSIONS.has(n));
    const known = new Set(BLOCKS.map((b) => b.name));
    for (const n of declared) assert.ok(known.has(n), `${n} : nœud de l'éditeur absent du registre (sanitisation et verrouillage non garantis)`);
  });
  test("le serveur conserve chaque bloc du registre à l'enregistrement (aucun bloc « perdu au premier enregistrement »)", () => {
    for (const b of BLOCKS.filter((x) => x.sample)) {
      const out = sanitizeBlogHtml(b.sample);
      assert.ok(out, `${b.name} : exemple vidé par la sanitisation`);
      assert.ok(out.includes(`<${b.tag}`), `${b.name} : balise <${b.tag}> perdue → ${out}`);
      if (b.cls) assert.ok(out.includes(b.cls), `${b.name} : classe ${b.cls} perdue → ${out}`);
    }
  });
  test("la liste des blocs verrouillables de l'éditeur vient du registre (aucune seconde liste à maintenir)", () => {
    assert.match(editingSrc, /LOCKABLE_TYPES = topNames\(\)/);
    assert.ok(topNames().includes("kbCover") && topNames().includes("kbFile") && !topNames().includes("kbColumn"));
  });
  test("noms et libellés uniques ; version de schéma cohérente", () => {
    assert.equal(new Set(BLOCKS.map((b) => b.name)).size, BLOCKS.length);
    for (const b of BLOCKS) assert.ok(b.label && b.since >= 1, b.name);
    assert.equal(SCHEMA_VERSION, Math.max(...BLOCKS.map((b) => b.since)));
  });
});
