// API publique /api/v1 — bout en bout : authentification par clé, portées, pagination, événements idempotents,
// révocation immédiate, aucun accès sans clé.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, Client } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

describe("API publique /api/v1", () => {
  let srv, boss, writeKey, readKey;

  const rawKeyFrom = (html) => html.match(/<code>(mk_live_[0-9a-f]{48})<\/code>/)[1];
  const call = (path, opts = {}) => new Client(srv.base).request(`/api/v1${path}`, opts);
  const withKey = (key) => (path, opts = {}) => call(path, { ...opts, headers: { ...opts.headers, authorization: `Bearer ${key}` } });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    await boss.post("/marketing/api", { name: "Écriture", scope: "write" });
    writeKey = rawKeyFrom((await boss.get("/marketing/api")).text);
    await boss.post("/marketing/api", { name: "Lecture", scope: "read" });
    readKey = rawKeyFrom((await boss.get("/marketing/api")).text);
  });
  after(() => srv.stop());

  test("sans en-tête Authorization : refusé", async () => {
    const res = await call("/contacts");
    assert.equal(res.status, 401);
    assert.match(res.text, /"code":"unauthorized"/);
  });
  test("clé inconnue : refusée", async () => {
    const res = await call("/contacts", { headers: { authorization: "Bearer mk_live_0000000000000000000000000000000000000000000000" } });
    assert.equal(res.status, 401);
  });
  test("format d'en-tête sans « Bearer » : refusé", async () => {
    const res = await call("/contacts", { headers: { authorization: writeKey } });
    assert.equal(res.status, 401);
  });
  test("route inconnue de l'API : 404 JSON (jamais la page d'erreur du site)", async () => {
    const res = await withKey(readKey)("/nimporteQuoi");
    assert.equal(res.status, 404);
    assert.match(res.text, /"code":"not_found"/);
  });

  test("clé valide : liste des contacts, enveloppe { data }", async () => {
    const res = await withKey(readKey)("/contacts");
    assert.equal(res.status, 200);
    const body = JSON.parse(res.text);
    assert.ok(Array.isArray(body.data));
  });

  test("créer un contact (portée écriture) : jamais abonné d'office", async () => {
    const res = await withKey(writeKey)("/contacts", { method: "POST", json: { email: "api-nouveau@ex.fr" } });
    assert.equal(res.status, 201);
    const body = JSON.parse(res.text);
    assert.equal(body.data.email, "api-nouveau@ex.fr");
    assert.equal(body.data.status, "unknown");
    assert.equal(body.created, true);
  });
  test("le même contact renvoyé (jamais recréé), created: false", async () => {
    const res = await withKey(writeKey)("/contacts", { method: "POST", json: { email: "api-nouveau@ex.fr", first_name: "Ada" } });
    assert.equal(res.status, 200);
    assert.equal(JSON.parse(res.text).created, false);
  });
  test("adresse invalide : 400 avec le code d'erreur", async () => {
    const res = await withKey(writeKey)("/contacts", { method: "POST", json: { email: "pas-un-email" } });
    assert.equal(res.status, 400);
    assert.match(res.text, /"code":"invalid_email"/);
  });
  test("clé en lecture seule : écriture refusée (403)", async () => {
    const res = await withKey(readKey)("/contacts", { method: "POST", json: { email: "refuse@ex.fr" } });
    assert.equal(res.status, 403);
    assert.match(res.text, /"code":"read_only"/);
  });
  test("clé en lecture seule : la lecture fonctionne", async () => {
    assert.equal((await withKey(readKey)("/contacts")).status, 200);
  });

  test("fiche d'un contact par identifiant ; introuvable : 404", async () => {
    const created = JSON.parse((await withKey(writeKey)("/contacts", { method: "POST", json: { email: "fiche@ex.fr" } })).text).data;
    const ok = await withKey(readKey)(`/contacts/${created.id}`);
    assert.equal(ok.status, 200);
    assert.equal(JSON.parse(ok.text).data.email, "fiche@ex.fr");
    assert.equal((await withKey(readKey)("/contacts/999999")).status, 404);
  });

  test("pagination par curseur : next_cursor permet d'avancer sans doublon", async () => {
    for (let i = 0; i < 3; i++) await withKey(writeKey)("/contacts", { method: "POST", json: { email: `page${i}@ex.fr` } });
    const page1 = JSON.parse((await withKey(readKey)("/contacts?limit=2")).text);
    assert.equal(page1.data.length, 2);
    assert.ok(Number.isInteger(page1.next_cursor));
    const page2 = JSON.parse((await withKey(readKey)(`/contacts?limit=2&after=${page1.next_cursor}`)).text);
    assert.ok(page2.data.every((c) => c.id > page1.next_cursor));
    assert.ok(!page2.data.some((c) => page1.data.some((p) => p.id === c.id)), "aucun contact vu deux fois");
  });

  test("événement personnalisé : Idempotency-Key évite le doublon, même identifiant renvoyé", async () => {
    const headers = { "idempotency-key": "api-test-evenement-1" };
    const r1 = await withKey(writeKey)("/events", { method: "POST", json: { name: "custom.demo", email: "api-nouveau@ex.fr" }, headers });
    const r2 = await withKey(writeKey)("/events", { method: "POST", json: { name: "custom.demo", email: "api-nouveau@ex.fr" }, headers });
    assert.equal(r1.status, 201);
    assert.equal(r2.status, 200);
    const b1 = JSON.parse(r1.text), b2 = JSON.parse(r2.text);
    assert.equal(b1.data.duplicate, false);
    assert.equal(b2.data.duplicate, true);
    assert.equal(b1.data.id, b2.data.id);
  });
  test("nom d'événement invalide : 400, message lisible", async () => {
    const res = await withKey(writeKey)("/events", { method: "POST", json: { name: "Pas Valide !" } });
    assert.equal(res.status, 400);
  });
  test("événement en lecture seule : refusé", async () => {
    assert.equal((await withKey(readKey)("/events", { method: "POST", json: { name: "custom.x" } })).status, 403);
  });

  test("une clé révoquée est refusée immédiatement, même en cours de session", async () => {
    await boss.post("/marketing/api", { name: "Jetable", scope: "read" });
    const html = (await boss.get("/marketing/api")).text;
    const key = rawKeyFrom(html);
    assert.equal((await withKey(key)("/contacts")).status, 200);
    const row = srv.db().prepare("SELECT id FROM mk_api_keys WHERE prefix = ?").get(key.slice(0, 12));
    await boss.post(`/marketing/api/${row.id}/revoquer`);
    assert.equal((await withKey(key)("/contacts")).status, 401);
  });

  test("isolation : une clé d'une autre organisation ne voit rien ici (aucune autre organisation créée dans ce test, donc juste : l'organisation est bien celle de la clé)", async () => {
    const res = await withKey(writeKey)("/contacts", { method: "POST", json: { email: "org-check@ex.fr" } });
    const contact = JSON.parse(res.text).data;
    const db = srv.db();
    const row = db.prepare("SELECT organization_id FROM mk_contacts WHERE id = ?").get(contact.id);
    assert.equal(row.organization_id, 1);
  });

  test("plafond : 120 requêtes par minute et par clé, la 121e est ralentie (429, Retry-After)", async () => {
    await boss.post("/marketing/api", { name: "Plafond", scope: "read" });
    const key = rawKeyFrom((await boss.get("/marketing/api")).text);
    let last;
    for (let i = 0; i < 121; i++) last = await withKey(key)("/contacts");
    assert.equal(last.status, 429);
    assert.match(last.text, /"code":"rate_limited"/);
    assert.equal(last.headers.get("retry-after"), "60");
    // Une autre clé n'est pas affectée : le plafond est bien PAR CLÉ, pas global au serveur
    assert.equal((await withKey(readKey)("/contacts")).status, 200);
  });
});
