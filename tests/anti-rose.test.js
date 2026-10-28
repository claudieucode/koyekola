// Titan XXXV : plus aucun rose dans l'interface Kolakisa. Le script d'audit détecte par TEINTE (hex, rgb, hsl, mots-clés, jetons),
// pas seulement par le mot « pink » ; les exceptions (contenu des sites clients, marques externes) sont listées dans le script.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const css = (f) => fs.readFileSync(path.join(ROOT, "public/css", f), "utf8");

test("l'audit par teinte ne trouve aucun rose dans les feuilles de style, vues et services de l'interface", () => {
  const r = spawnSync(process.execPath, ["scripts/design/audit-rose.js", "--detail"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(r.status, 0, "rose résiduel :\n" + r.stdout);
});

test("les jetons magenta ont disparu et le module Marketing est bleu", () => {
  const vivid = css("kola-vivid.css");
  assert.doesNotMatch(vivid, /--v-magn|data-tone="magn"/);
  assert.match(vivid, /body\[data-kb-module="marketing"\]\s*\{\s*--vx-a:\s*var\(--v-azur\)/);
  assert.match(css("kola-brand.css"), /body\[data-kb-module="marketing"\] \{ --kb-mod: #0277b6;/);
});

test("les six cartes de l'instantané marketing : fond blanc, bordure fine, plus de teinte rose", () => {
  const vivid = css("kola-vivid.css");
  assert.match(vivid, /\.mk-body \.mk-kpi \{[^}]*background: var\(--surface, #fff\); border: 1px solid var\(--border, #dde6ed\)/);
  const view = fs.readFileSync(path.join(ROOT, "views/marketing/dashboard.ejs"), "utf8");
  const tones = [...view.matchAll(/<div class="mk-kpi[^"]*" data-tone="(\w+)"/g)].map((m) => m[1]);
  assert.deepEqual(tones, ["azur", "emer", "marine", "turq", "ambr", "neutre"]);
});
