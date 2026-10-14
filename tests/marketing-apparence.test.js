// Paramètres → Apparence : thème personnel de l'espace marketing (Clair, Bleu foncé, Gris, Noir).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

describe("apparence de l'espace marketing", () => {
  let srv, boss;
  const run = (sql, ...a) => { const db = srv.db(); db.prepare(sql).run(...a); db.close(); };
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY }); boss = await loginInstructor(srv); });
  after(() => srv.stop());

  test("par défaut : menu bleu foncé (marine, identité Kolakisa), feuille de thème chargée", async () => {
    const html = (await boss.get("/marketing")).text;
    assert.match(html, /<html lang="fr" data-mk-theme="nuit">/);
    assert.match(html, /marketing-themes\.css/);
    assert.match(html, /href="\/marketing\/apparence"/);
  });
  test("la page propose les 4 thèmes, Bleu foncé coché par défaut", async () => {
    const html = (await boss.get("/marketing/apparence")).text;
    for (const label of ["Clair", "Bleu foncé", "Gris", "Noir"]) assert.match(html, new RegExp(`<strong>${label}</strong>`));
    assert.match(html, /value="nuit" checked/);
  });
  for (const theme of ["nuit", "gris", "noir"]) {
    test(`choisir « ${theme} » : appliqué sur toutes les pages marketing, sans flash (posé par le serveur)`, async () => {
      await boss.post("/marketing/apparence", { theme });
      for (const page of ["/marketing", "/marketing/sms", "/marketing/contacts"]) {
        const html = (await boss.get(page)).text;
        assert.match(html, new RegExp(`<html lang="fr" data-mk-theme="${theme}">`), page);
        assert.match(html, /marketing-themes\.css\?v=/);
      }
    });
  }
  test("le site public n'est jamais concerné", async () => {
    assert.doesNotMatch((await boss.get("/")).text, /data-mk-theme|marketing-themes/);
  });
  test("thème inconnu refusé ; revenir au clair retire l'attribut", async () => {
    await boss.post("/marketing/apparence", { theme: "rose" });
    assert.match((await boss.get("/marketing/apparence")).text, /Thème inconnu/);
    await boss.post("/marketing/apparence", { theme: "clair" });
    assert.match((await boss.get("/marketing")).text, /<html lang="fr">/);
  });
  test("choix personnel : un autre membre (lecteur) garde le sien et peut choisir", async () => {
    await boss.post("/marketing/apparence", { theme: "noir" });
    const c = await newStudent(srv);
    run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'viewer')", c.email);
    assert.match((await c.get("/marketing")).text, /<html lang="fr" data-mk-theme="nuit">/, "sans choix : le défaut (bleu foncé), pas celui du chef");
    await c.post("/marketing/apparence", { theme: "gris" });
    assert.match((await c.get("/marketing")).text, /data-mk-theme="gris"/);
    assert.match((await boss.get("/marketing")).text, /data-mk-theme="noir"/);
  });
});
