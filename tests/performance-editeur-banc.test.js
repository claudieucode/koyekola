// Les outils de mesure de l'éditeur de pages restent valides (syntaxe) et la documentation de performance existe.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const ROOT = path.join(__dirname, "..");
for (const f of ["scripts/perf/bench-page-builder.js", "scripts/perf/mesure-ouverture-editeur.js"]) {
  test(`${f} : syntaxe valide`, () => { const r = spawnSync(process.execPath, ["--check", path.join(ROOT, f)], { encoding: "utf8" }); assert.equal(r.status, 0, r.stderr); });
}
test("rapports de performance de l'éditeur présents", () => {
  for (const f of ["AUDIT", "RESULTS", "OPTIMIZATION_REPORT"]) assert.ok(fs.existsSync(path.join(ROOT, "docs/performance", `PAGE_EDITOR_PERFORMANCE_${f}.md`)) || fs.existsSync(path.join(ROOT, "docs/performance", `PAGE_EDITOR_${f}.md`)), f);
});
