// R8 — l'outil de photographies HTTP de la recette : capture d'une vraie instance, comparaison identique, différence détectée (réglage robots modifié), usages invalides.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const SCRIPT = path.join(__dirname, "..", "scripts", "recette-r8-captures.js");
describe("photographies de recette", () => {
  let srv, boss, dir;
  const run = (...a) => spawnSync("/usr/local/bin/node", [SCRIPT, ...a], { encoding: "utf8" });
  before(async () => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "captures-")); srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" }); boss = await loginInstructor(srv); });
  after(async () => { fs.rmSync(dir, { recursive: true, force: true }); await srv.stop(); });
  test("capturer deux fois = aucune différence ; modifier les règles robots est détecté ; usages invalides refusés", async () => {
    const a = path.join(dir, "a.json"), b = path.join(dir, "b.json"), c = path.join(dir, "c.json");
    assert.equal(run("capture", srv.base, a, "--host", "k.test").status, 0);
    assert.equal(run("capture", srv.base, b, "--host", "k.test").status, 0);
    const same = run("comparer", a, b); assert.equal(same.status, 0, same.stdout + same.stderr); assert.match(same.stdout, /Aucune différence/);
    const robots = JSON.parse(fs.readFileSync(a, "utf8"))["k.test"]["/robots.txt"]; assert.equal(robots.status, 200); assert.match(robots.robots, /Sitemap: https:\/\/k\.test\/sitemap\.xml/);
    await boss.post("/formateur/seo/reglages", { robots_custom: "User-agent: *\nDisallow: /secret-recette" });
    assert.equal(run("capture", srv.base, c, "--host", "k.test").status, 0);
    const diff = run("comparer", a, c); assert.equal(diff.status, 1); assert.match(diff.stdout, /k\.test\/robots\.txt/); assert.match(diff.stdout, /secret-recette/);
    assert.equal(run("capture").status, 2); assert.equal(run("comparer", a).status, 2); assert.equal(run("inconnu").status, 2);
  });
});
