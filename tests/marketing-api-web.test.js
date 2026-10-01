// Page « Clés d'API » (/marketing/api) — création avec révélation unique, liste sans secret, révocation, permissions.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

describe("page Clés d'API", () => {
  let srv, boss;
  const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
  const member = async (role) => {
    const c = await newStudent(srv);
    run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
    return c;
  };
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv.stop());

  test("est dans le registre de navigation", async () => {
    assert.match((await boss.get("/marketing")).text, /href="\/marketing\/api"/);
  });

  test("sans clé : état vide", async () => {
    const html = (await boss.get("/marketing/api")).text;
    assert.match(html, /<h1>Clés d'API/);
    assert.match(html, /Aucune clé d'API/);
  });

  test("création : la clé complète est affichée une fois, avec son avertissement", async () => {
    await boss.post("/marketing/api", { name: "Ma première clé", scope: "write" });
    const html = (await boss.get("/marketing/api")).text;
    assert.match(html, /ne sera plus jamais affichée/);
    assert.match(html, /<code>mk_live_[0-9a-f]{48}<\/code>/);
    assert.match(html, /Lecture et écriture/);
  });

  test("après un second chargement, la clé complète n'apparaît plus jamais — seul le préfixe reste", async () => {
    const html = (await boss.get("/marketing/api")).text;
    assert.doesNotMatch(html, /<code>mk_live_[0-9a-f]{48}<\/code>/);
    assert.match(html, /<code>mk_live_[0-9a-f]{4}…<\/code>/);
    assert.match(html, /Ma première clé/);
  });

  test("nom déjà utilisé : message d'erreur clair, aucune clé créée en double", async () => {
    await boss.post("/marketing/api", { name: "Ma première clé", scope: "read" });
    const html = (await boss.get("/marketing/api")).text;
    assert.match(html, /existe déjà/);
    // Une seule LIGNE de tableau porte ce nom (le nom réapparaît légitimement dans l'attribut de confirmation
    // de révocation et l'étiquette accessible du bouton, pour cette même ligne : compter les <tr> plutôt que le texte brut)
    assert.equal((html.match(/data-label="Nom">Ma première clé</g) || []).length, 1);
  });

  test("révocation : la clé apparaît « Révoquée », sans bouton pour la révoquer à nouveau", async () => {
    const db = srv.db();
    const { id } = db.prepare("SELECT id FROM mk_api_keys WHERE name = 'Ma première clé'").get();
    db.close();
    await boss.post(`/marketing/api/${id}/revoquer`);
    const html = (await boss.get("/marketing/api")).text;
    assert.match(html, /Révoquée/);
    assert.doesNotMatch(html, new RegExp(`/marketing/api/${id}/revoquer`));
  });

  test("lecteur : accès refusé (api_keys.manage est réservé aux administrateurs)", async () => {
    const viewer = await member("viewer");
    assert.equal((await viewer.get("/marketing/api")).status, 403);
  });

  test("éditeur : accès refusé (toujours réservé aux administrateurs)", async () => {
    const editor = await member("editor");
    assert.equal((await editor.get("/marketing/api")).status, 403);
  });
});
