// Page « Formulaires » (/marketing/formulaires) : création, édition, publication, statistiques, permissions.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

describe("page Formulaires", () => {
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
    assert.match((await boss.get("/marketing")).text, /href="\/marketing\/formulaires"/);
  });

  test("sans formulaire : état vide", async () => {
    const html = (await boss.get("/marketing/formulaires")).text;
    assert.match(html, /<h1>Formulaires/);
    assert.match(html, /Aucun formulaire/);
  });

  let formId;
  test("création : redirige vers la fiche", async () => {
    const res = await boss.post("/marketing/formulaires", { name: "Liste attente", consentText: "Oui, je veux être prévenu." });
    assert.equal(res.status, 302);
    assert.match(res.location, /\/marketing\/formulaires\/\d+/);
    formId = Number(res.location.match(/\/marketing\/formulaires\/(\d+)/)[1]);
    const html = (await boss.get(res.location)).text;
    assert.match(html, /Liste attente/);
    assert.match(html, /Brouillon/);
  });

  test("nom vide : erreur, aucun doublon créé", async () => {
    const before = (await boss.get("/marketing/formulaires")).text.match(/<tr>/g)?.length || 0;
    await boss.post("/marketing/formulaires", { name: "", consentText: "Oui" });
    const after = (await boss.get("/marketing/formulaires")).text.match(/<tr>/g)?.length || 0;
    assert.equal(after, before);
  });

  test("publication : apparaît « Publié » avec son adresse publique", async () => {
    await boss.post(`/marketing/formulaires/${formId}/publier`);
    const html = (await boss.get(`/marketing/formulaires/${formId}`)).text;
    assert.match(html, />Publié</);
    assert.match(html, /https:\/\/k\.test\/f\/liste-attente/);
  });

  test("édition : nom, champs, message de remerciement enregistrés", async () => {
    // Cases de même nom → un tableau réel : le corps encodé en formulaire du client de test joint les valeurs par
    // des virgules (voir le même correctif sur les tests Webhooks) ; JSON transporte un vrai tableau.
    const res = await boss.postJson(`/marketing/formulaires/${formId}`, { name: "Liste attente VIP", fields: ["first_name", "phone"], consentText: "Oui, contactez-moi.", thankYouText: "À très vite !" });
    assert.equal(res.status, 302);
    const html = (await boss.get(`/marketing/formulaires/${formId}`)).text;
    assert.match(html, /Liste attente VIP/);
    assert.match(html, /value="first_name" checked/);
    assert.match(html, /value="phone" checked/);
    assert.doesNotMatch(html, /value="last_name" checked/);
  });

  test("pop-up : désactivé par défaut, section repliable présente sur la fiche", async () => {
    const html = (await boss.get(`/marketing/formulaires/${formId}`)).text;
    assert.match(html, /Pop-up sur le site/);
    assert.doesNotMatch(html, /name="popupEnabled" value="1" checked/);
  });

  test("activer le pop-up : coché à la relecture, réglages enregistrés", async () => {
    await boss.postJson(`/marketing/formulaires/${formId}`, { name: "Liste attente VIP", fields: [], consentText: "Oui, contactez-moi.", popupEnabled: "1", popupTrigger: "exit", popupTriggerValue: 0, popupFrequencyDays: 21 });
    const html = (await boss.get(`/marketing/formulaires/${formId}`)).text;
    assert.match(html, /name="popupEnabled" value="1" checked/);
    assert.match(html, /<option value="exit" selected>/);
    assert.match(html, /id="ff-freq"[^>]+value="21"/);
  });

  test("dépublication : l'adresse publique redevient introuvable, note affichée dans l'admin", async () => {
    await boss.post(`/marketing/formulaires/${formId}/depublier`);
    const html = (await boss.get(`/marketing/formulaires/${formId}`)).text;
    assert.match(html, />Brouillon</);
    assert.match(html, /répond « introuvable »/);
    assert.equal((await new (require("./helpers").Client)(srv.base).get("/f/liste-attente")).status, 404);
  });

  test("suppression : disparaît de la liste", async () => {
    await boss.post(`/marketing/formulaires/${formId}/supprimer`);
    assert.doesNotMatch((await boss.get("/marketing/formulaires")).text, new RegExp(`href="/marketing/formulaires/${formId}"`));
    assert.equal((await boss.get(`/marketing/formulaires/${formId}`)).status, 404);
  });

  test("lecteur : peut consulter (forms.read) mais pas créer", async () => {
    const viewer = await member("viewer");
    const html = (await viewer.get("/marketing/formulaires")).text;
    assert.equal((await viewer.get("/marketing/formulaires")).status, 200);
    assert.doesNotMatch(html, /<form[^>]+action="\/marketing\/formulaires"[^>]+method="post"/);
  });

  test("étudiant hors équipe marketing : accès refusé", async () => {
    const outsider = await newStudent(srv);
    assert.equal((await outsider.get("/marketing/formulaires")).status, 403);
  });
});
