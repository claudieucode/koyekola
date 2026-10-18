// R9-5 — garde-fous de la répétition (scripts/r9/repetition-r9-5.js) : autorisation exigée, recette R8 réussie exigée, rien n'est créé sans ces conditions. (Le déroulement complet a été exécuté sur la copie de production : voir le rapport.)
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");

const S = path.join(__dirname, "..", "scripts", "r9", "repetition-r9-5.js");
describe("répétition R9-5 : garde-fous", () => {
  let dir, R;
  const NM = process.env.NODE_PATH || path.join(__dirname, "..", "node_modules");
  const run = (...a) => spawnSync(process.execPath, [S, ...a], { encoding: "utf8" });
  before(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "r9-rep-")); assert.deepEqual(fs.readdirSync(dir), []); R = path.join(dir, "RECETTE-R8-essai"); fs.mkdirSync(R); fs.writeFileSync(path.join(R, "copie-A.db"), "x"); });
  test("refus sans --recette-autorisee, sans domaine principal, sur un dossier au nom non conforme, sans recette R8 réussie ; aucun dossier de travail créé", () => {
    assert.match(run(R, "--principal", "k.test", "--node-modules", NM).stdout, /--recette-autorisee/);
    assert.match(run(R, "--recette-autorisee", "--node-modules", NM).stdout, /--principal/);
    const other = path.join(dir, "autre"); fs.mkdirSync(other); assert.match(run(other, "--recette-autorisee", "--principal", "k.test", "--node-modules", NM).stdout, /recette|copie/);
    const r = run(R, "--recette-autorisee", "--principal", "k.test", "--node-modules", NM); assert.notEqual(r.status, 0); assert.match(r.stdout, /aucune recette R8 réussie/);
    assert.deepEqual(fs.readdirSync(R), ["copie-A.db"]);
  });
  test("un verdict R8 incomplet est refusé", () => {
    const W8 = path.join(R, "travail-20260101000000"); fs.mkdirSync(W8); fs.writeFileSync(path.join(W8, "copie-B.db"), "x"); fs.writeFileSync(path.join(W8, "verdict.json"), JSON.stringify({ etapes: [{ ok: true }, { ok: false }] }));
    const r = run(R, "--recette-autorisee", "--principal", "k.test", "--node-modules", NM); assert.notEqual(r.status, 0); assert.match(r.stdout, /pas entièrement réussi/); assert.ok(!fs.readdirSync(R).some((x) => x.startsWith("r9-")));
  });
  test("le code ne supprime rien, ne contacte aucun hôte distant et n'ouvre que des copies", () => {
    const c = fs.readFileSync(S, "utf8"); assert.doesNotMatch(c, /rmSync|unlinkSync|rmdirSync|\bssh\b|scp /); assert.match(c, /127\.0\.0\.1/); assert.match(c, /SMTP_HOST: ""/); assert.doesNotMatch(c, /MARKETING_WORKER\s*:/);
  });
});
