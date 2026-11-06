// Contrôle permanent « responsive » de TOUS les thèmes de la bibliothèque, dans un vrai Chrome (voir docs/themes/THEME_MODULE_PERFORMANCE_AND_RESPONSIVE_REPORT.md).
// Un thème qui échoue ici n'est pas prêt à être publié : défilement horizontal sur tablette ou mobile, image cassée, menu inaccessible.
// Les scripts scripts/audit-themes-responsive.js et scripts/audit-themes-navigation.js font les mesures ; ce test les exécute et juge le résultat.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs"), os = require("os"), path = require("path");
const { spawnSync } = require("child_process");
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
let pw = true; try { require("playwright-core"); } catch { pw = false; }
const SKIP = !pw || !CHROME ? "Playwright ou Chrome absent" : false;
const run = (script, env) => {
  const out = path.join(os.tmpdir(), `${path.basename(script, ".js")}-${process.pid}.json`);
  const r = spawnSync(process.execPath, [path.join(__dirname, "../scripts", script), out], { env: { ...process.env, ...env }, encoding: "utf8", timeout: 2400000 });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const rows = JSON.parse(fs.readFileSync(out, "utf8")); fs.unlinkSync(out);
  return rows;
};

test("aucun thème ne fait défiler la page horizontalement (tablette portrait, mobile, petit mobile) et aucune image n'est cassée", { skip: SKIP, timeout: 2500000 }, () => {
  const rows = run("audit-themes-responsive.js", { PAGES: "home", VIEWPORTS: "tablette portrait,mobile,petit mobile", SETTLE: "1300" });
  assert.ok(rows.length >= 300, `trop peu de mesures : ${rows.length}`);
  assert.deepEqual(rows.filter((r) => r.err).map((r) => `${r.key}/${r.vp} : ${r.err}`), []);
  assert.deepEqual(rows.filter((r) => r.overflowX > 1).map((r) => `${r.key}/${r.page}/${r.vp} : la page déborde de ${r.overflowX}px`), []);
  assert.deepEqual(rows.filter((r) => r.broken).map((r) => `${r.key}/${r.vp} : ${r.broken} image(s) cassée(s)`), []);
});

test("sur petit écran, le menu de chaque thème est accessible (liens visibles ou bouton qui les affiche)", { skip: SKIP, timeout: 2500000 }, () => {
  const rows = run("audit-themes-navigation.js", {});
  assert.ok(rows.length >= 300, `trop peu de mesures : ${rows.length}`);
  // « souffle » range son menu dans une barre d'onglets fixée en bas de l'écran (hors de la première zone mesurée) : c'est sa conception
  const bad = rows.filter((r) => ["INACCESSIBLE", "BOUTON-SANS-EFFET", "ERREUR"].includes(r.status) && r.key !== "souffle");
  assert.deepEqual(bad.map((r) => `${r.key}/${r.vp} : ${r.status}`), []);
});
