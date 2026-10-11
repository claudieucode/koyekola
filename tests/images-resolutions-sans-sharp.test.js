// Repli sans bibliothèque de redimensionnement : « sharp » rendu introuvable dans un processus à part.
// Aucune adresse de version n'est jamais écrite, aucune taille n'est proposée, l'adresse d'une version renvoie vers l'original.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("child_process");
const path = require("path");

test("sans sharp : original partout, aucune taille proposée, adresse de version → redirection vers l'original", () => {
  const code = `
    const Module = require("module"); const orig = Module._load;
    Module._load = function (request, ...rest) { if (request === "sharp") { const e = new Error("Cannot find module 'sharp'"); e.code = "MODULE_NOT_FOUND"; throw e; } return orig.call(this, request, ...rest); };
    const v = require(${JSON.stringify(path.join(__dirname, "..", "src/marketing/media/variants.js"))});
    const src = "/uploads/marketing/1/1712345678901-abcdef012345.jpg";
    const out = {
      available: v.available(), medium: v.imageSource(src, "medium"), auto: v.imageSource(src, "auto"), offered: v.offered(2000),
      bg: v.sourceFor(src, "large"),
    };
    console.log(JSON.stringify(out));
  `;
  const r = spawnSync(process.execPath, ["-e", code], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const o = JSON.parse(r.stdout.trim().split("\n").pop());
  assert.equal(o.available, false);
  assert.deepEqual(o.medium, { src: "/uploads/marketing/1/1712345678901-abcdef012345.jpg", srcset: "", sizes: "" });
  assert.equal(o.auto.src, "/uploads/marketing/1/1712345678901-abcdef012345.jpg"); assert.equal(o.auto.srcset, "");
  assert.deepEqual(o.offered, []);
  assert.equal(o.bg, "/uploads/marketing/1/1712345678901-abcdef012345.jpg");
});
