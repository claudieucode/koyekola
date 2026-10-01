// Page « Webhooks » — création (cases à cocher), révélation du secret une fois puis à la demande, pause/activation,
// suppression, journal de livraisons et rejeu, permissions.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

describe("page Webhooks", () => {
  let srv, boss;
  const run = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).run(...args); db.close(); return r; };
  const one = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).get(...args); db.close(); return r; };
  const member = async (role) => {
    const c = await newStudent(srv);
    run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
    return c;
  };
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); });
  after(() => srv.stop());

  test("est dans le registre de navigation", async () => {
    assert.match((await boss.get("/marketing")).text, /href="\/marketing\/webhooks"/);
  });

  test("sans webhook : état vide, catalogue d'événements proposé dans le formulaire", async () => {
    const html = (await boss.get("/marketing/webhooks")).text;
    assert.match(html, /<h1>Webhooks/);
    assert.match(html, /Aucun webhook/);
    assert.match(html, /Un compte est créé sur KOYEKOLA/);
  });

  let webhookId;
  test("création : redirige vers la fiche, secret affiché une seule fois", async () => {
    // Cases à cocher de même nom → un vrai navigateur envoie plusieurs valeurs pour "events" ; le corps encodé en
    // formulaire du client de test ne sait pas le faire (il joint un tableau par des virgules) : JSON, ici, le peut.
    const res = await boss.postJson("/marketing/webhooks", { name: "Zapier", url: "https://exemple.fr/hook", events: ["contact.created", "campaign.sent"] });
    assert.equal(res.status, 302);
    assert.match(res.location, /\/marketing\/webhooks\/\d+/);
    webhookId = Number(res.location.match(/\/marketing\/webhooks\/(\d+)/)[1]);
    const html = (await boss.get(res.location)).text;
    assert.match(html, /Visible maintenant seulement/);
    assert.match(html, /<code>whsec_[0-9a-f]{48}<\/code>/);
  });

  test("après un rechargement, le secret complet n'apparaît plus, mais peut être révélé de nouveau", async () => {
    let html = (await boss.get(`/marketing/webhooks/${webhookId}`)).text;
    assert.doesNotMatch(html, /<code>whsec_[0-9a-f]{48}<\/code>/);
    assert.match(html, /Révéler le secret/);
    await boss.post(`/marketing/webhooks/${webhookId}/secret`);
    html = (await boss.get(`/marketing/webhooks/${webhookId}`)).text;
    assert.match(html, /<code>whsec_[0-9a-f]{48}<\/code>/);
  });

  test("adresse invalide : message d'erreur, aucun webhook créé", async () => {
    const before = (await boss.get("/marketing/webhooks")).text.match(/<tr>/g)?.length || 0;
    await boss.post("/marketing/webhooks", { name: "Mauvais", url: "javascript:alert(1)", events: ["*"] });
    const html = (await boss.get("/marketing/webhooks")).text;
    const after = (html.match(/<tr>/g) || []).length;
    assert.equal(after, before);
  });

  test("mise en pause puis réactivation", async () => {
    await boss.post(`/marketing/webhooks/${webhookId}/pause`);
    assert.match((await boss.get(`/marketing/webhooks/${webhookId}`)).text, /En pause/);
    await boss.post(`/marketing/webhooks/${webhookId}/activer`);
    assert.match((await boss.get(`/marketing/webhooks/${webhookId}`)).text, />Actif</);
  });

  test("une livraison abandonnée (« dead ») peut être rejouée, puis redevient « en attente »", async () => {
    const jobId = Number(
      run(
        "INSERT INTO mk_jobs (organization_id, type, payload, state, run_at, attempts, max_attempts, last_error, created_at, updated_at, finished_at) VALUES (1, 'webhook.deliver', ?, 'dead', 0, 6, 6, 'Le point d''accès a répondu 500.', 0, 0, 0)",
        JSON.stringify({ endpointId: webhookId, eventName: "contact.created" })
      ).lastInsertRowid
    );
    let html = (await boss.get(`/marketing/webhooks/${webhookId}`)).text;
    assert.match(html, /Abandonnée/);
    assert.match(html, new RegExp(`/marketing/webhooks/${webhookId}/livraisons/${jobId}/rejouer`));
    await boss.post(`/marketing/webhooks/${webhookId}/livraisons/${jobId}/rejouer`);
    const row = one("SELECT state, attempts FROM mk_jobs WHERE id = ?", jobId);
    assert.equal(row.state, "pending");
    assert.equal(row.attempts, 0);
  });

  test("rejouer une livraison déjà en attente (pas « dead ») : message d'erreur, rien ne casse", async () => {
    const jobId = Number(
      run(
        "INSERT INTO mk_jobs (organization_id, type, payload, state, run_at, attempts, max_attempts, created_at, updated_at) VALUES (1, 'webhook.deliver', ?, 'pending', 0, 0, 6, 0, 0)",
        JSON.stringify({ endpointId: webhookId, eventName: "contact.created" })
      ).lastInsertRowid
    );
    const res = await boss.post(`/marketing/webhooks/${webhookId}/livraisons/${jobId}/rejouer`);
    assert.equal(res.status, 302);
  });

  test("suppression : le webhook disparaît de la liste", async () => {
    await boss.post(`/marketing/webhooks/${webhookId}/supprimer`);
    // Le nom réapparaît légitimement dans le message flash (« « Zapier » supprimé. ») : on vérifie l'absence du LIEN vers sa fiche, pas du texte brut
    assert.doesNotMatch((await boss.get("/marketing/webhooks")).text, new RegExp(`href="/marketing/webhooks/${webhookId}"`));
    assert.equal((await boss.get(`/marketing/webhooks/${webhookId}`)).status, 404);
  });

  test("lecteur : accès refusé (webhooks.manage est réservé aux administrateurs)", async () => {
    const viewer = await member("viewer");
    assert.equal((await viewer.get("/marketing/webhooks")).status, 403);
  });
});
