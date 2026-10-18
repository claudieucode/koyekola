// R9-3 — EFFETS de la ligne dédiée sur l'application ACTUELLE (test de caractérisation, base jetable) : ce qui change et ce qui ne change pas quand la migration est appliquée sans le code R9-4.
// Ce test documente l'état connu ; il ne valide pas l'affichage final du gestionnaire (R9-4).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const M = require("../scripts/r9/site-maitre");

describe("R9-3 : effets de la migration sur l'application actuelle (caractérisation)", () => {
  let srv, boss, db;
  const SP = "/marketing/site-web/sites";
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    await boss.post(SP, { name: "Alpha Effets" }); await boss.post(SP, { name: "Bravo Effets" });
  });
  after(() => { db.close(); return srv.stop(); });
  const rowsOf = (html) => (html.match(/Site principal/g) || []).length;
  test("avant : une seule entrée « Site principal » dans le gestionnaire ; après la migration : l'application répond toujours, les sites ordinaires sont inchangés, la ligne dédiée apparaît en plus de l'entrée historique (à traiter en R9-4)", async () => {
    const before = await boss.get(SP); assert.equal(before.status, 200);
    const pagesBefore = await boss.get("/marketing/site-web/pages"); 
    const sitesBefore = db.prepare("SELECT id, name, status FROM mk_sites ORDER BY id").all();
    M.appliquer(db);
    const after = await boss.get(SP); assert.equal(after.status, 200, "le gestionnaire répond");
    assert.match(after.text, /Alpha Effets/); assert.match(after.text, /Bravo Effets/);
    const sitesAfter = db.prepare("SELECT id, name, status FROM mk_sites WHERE is_primary = 0 ORDER BY id").all(); assert.deepEqual(sitesAfter, sitesBefore, "sites ordinaires inchangés");
    const delta = rowsOf(after.text) - rowsOf(before.text); assert.ok(delta >= 0, "mesure du doublon");
    // faits relevés : la page d'accueil du principal et la liste des pages continuent de fonctionner
    assert.equal((await boss.get("/marketing/site-web/pages")).status, pagesBefore.status);
    assert.equal((await boss.get(`${SP}/principal/tableau-de-bord`)).status < 500, true, "espace du principal toujours servi");
    process.stdout.write(`# R9-3 caractérisation : occurrences de « Site principal » dans le gestionnaire ${rowsOf(before.text)} → ${rowsOf(after.text)}\n`);
    M.retour(db); assert.equal(M.etat(db).appliquee, false);
    assert.equal(rowsOf((await boss.get(SP)).text), rowsOf(before.text), "après retour arrière : affichage identique à l'état initial");
  });
});
