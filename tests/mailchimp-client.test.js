// Client HTTP Mailchimp : format de clé, authentification, erreurs normalisées (messages français), nouvelles tentatives (429 toujours, 5xx jamais sur un POST),
// plafond de requêtes simultanées, délai d'attente, panne réseau, pagination, journal sans secret.
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createFakeMailchimp } = require("./fake-mailchimp");
const { createClient, parseApiKey, baseUrlFor, logPath } = require("../src/marketing/mailchimp/client");

describe("client Mailchimp", () => {
  let fake;
  const env = () => ({ MAILCHIMP_API_BASE: fake.base });
  const noWait = async () => {};
  const make = (opts = {}) => createClient({ apiKey: fake.key, env: env(), sleep: noWait, ...opts });
  before(async () => { fake = await createFakeMailchimp(); });
  after(() => fake.close());
  beforeEach(() => fake.reset());

  test("format de clé : 32 hexadécimaux, tiret, centre de données ; l'hôte en dépend", () => {
    assert.deepEqual(parseApiKey("0123456789abcdef0123456789abcdef-us21"), { dc: "us21" });
    assert.equal(parseApiKey("n'importe quoi"), null);
    assert.equal(parseApiKey("0123456789abcdef0123456789abcdef-http://evil.test"), null);
    assert.equal(baseUrlFor("0123456789abcdef0123456789abcdef-us21", {}), "https://us21.api.mailchimp.com/3.0");
    assert.throws(() => baseUrlFor("mauvaise", {}), (e) => e.code === "key_format" && /Format de clé invalide/.test(e.message));
    assert.throws(() => baseUrlFor("0123456789abcdef0123456789abcdef-us21", { MAILCHIMP_API_BASE: "http://x.test", NODE_ENV: "production" }), (e) => e.code === "config");
  });

  test("authentification Basic avec la clé, jamais dans l'adresse ; /ping répond", async () => {
    const r = await make().ping();
    assert.match(r.health_status, /Chimpy/);
    const req = fake.requests[0];
    assert.match(req.auth, /^Basic /);
    assert.equal(Buffer.from(req.auth.slice(6), "base64").toString().split(":")[1], fake.key);
    assert.doesNotMatch(req.path + JSON.stringify(req.query), /0123456789abcdef/);
  });

  test("clé refusée : auth_invalid, message français actionnable, aucune nouvelle tentative", async () => {
    const c = createClient({ apiKey: "ffffffffffffffffffffffffffffffff-us21", env: env(), sleep: noWait });
    await assert.rejects(c.ping(), (e) => e.code === "auth_invalid" && /clé d'API Mailchimp est refusée/.test(e.message) && /Clés d'API/.test(e.message) && e.status === 401);
    assert.equal(fake.requests.length, 1);
  });

  test("404, 400 (avec champ fautif), membre existant, état de conformité : codes et messages français", async () => {
    const c = make();
    await assert.rejects(c.get("/lists/aaaaaaaaaa"), (e) => e.code === "not_found" && /introuvable/.test(e.message));
    await assert.rejects(c.post("/lists", {}), (e) => e.code === "invalid_request" && /Champ « name »/.test(e.message) && e.fields[0].field === "name");
    const l = fake.addList("Test");
    fake.addMember(l.id, "a@exemple.fr");
    await assert.rejects(c.post(`/lists/${l.id}/members`, { email_address: "a@exemple.fr", status: "subscribed" }), (e) => e.code === "member_exists" && /déjà présent/.test(e.message));
    fake.addMember(l.id, "b@exemple.fr", "unsubscribed");
    await assert.rejects(c.put(`/lists/${l.id}/members/${fake.md5("b@exemple.fr")}`, { email_address: "b@exemple.fr", status: "subscribed" }), (e) => e.code === "compliance_state" && /réinscrire elle-même/.test(e.message));
  });

  test("429 : réessayé (même pour un POST) en respectant Retry-After, puis réussi", async () => {
    const waits = [];
    const c = make({ sleep: async (ms) => { waits.push(ms); } });
    fake.failNext(429, { times: 2, headers: { "Retry-After": "2" } });
    const l = await c.post("/lists", { name: "Après 429" });
    assert.ok(l.id);
    assert.equal(fake.requests.length, 3);
    assert.deepEqual(waits, [2000, 2000]);
  });

  test("429 persistant : abandon après les tentatives autorisées, code rate_limited", async () => {
    const c = make({ maxRetries: 2 });
    fake.failNext(429, { times: 10 });
    await assert.rejects(c.get("/lists"), (e) => e.code === "rate_limited" && /réessayée automatiquement/.test(e.message));
    assert.equal(fake.requests.length, 3);
  });

  test("délai exponentiel avec gigue quand Retry-After est absent", async () => {
    const waits = [];
    const c = make({ sleep: async (ms) => { waits.push(ms); }, random: () => 0 });
    fake.failNext(429, { times: 3 });
    await c.get("/lists");
    assert.deepEqual(waits, [500, 1000, 2000]);
  });

  test("5xx : un GET est réessayé, un POST ne l'est JAMAIS (risque de doublon)", async () => {
    const c = make();
    fake.failNext(503, { times: 1 });
    assert.ok(await c.get("/lists"));
    assert.equal(fake.requests.length, 2);
    fake.reset();
    fake.failNext(503, { times: 1 });
    await assert.rejects(c.post("/lists", { name: "Doublon" }), (e) => e.code === "server_error" && /momentanément indisponible/.test(e.message));
    assert.equal(fake.requests.length, 1);
    assert.equal(fake.state.lists.size >= 0, true);
  });

  test("au plus 10 requêtes simultanées quoi que demande l'appelant ; 4 si 4 sont demandées", async () => {
    fake.setDelay(25);
    const c4 = make({ maxConcurrent: 4 });
    await Promise.all(Array.from({ length: 24 }, () => c4.get("/lists")));
    assert.ok(fake.maxInflight <= 4, `pic ${fake.maxInflight}`);
    assert.ok(fake.maxInflight >= 2);
    fake.reset(); fake.setDelay(25);
    const c50 = make({ maxConcurrent: 50 });
    await Promise.all(Array.from({ length: 40 }, () => c50.get("/lists")));
    assert.ok(fake.maxInflight <= 10, `pic ${fake.maxInflight}`);
    fake.setDelay(0);
  });

  test("délai d'attente dépassé : code timeout, message français", async () => {
    fake.setDelay(300);
    const c = make({ timeoutMs: 40, maxRetries: 0 });
    await assert.rejects(c.get("/lists"), (e) => e.code === "timeout" && /n'a pas répondu à temps/.test(e.message));
    fake.setDelay(0);
  });

  test("panne réseau : code network, message français", async () => {
    const c = createClient({ apiKey: fake.key, env: { MAILCHIMP_API_BASE: "http://127.0.0.1:1/3.0" }, sleep: noWait, maxRetries: 1 });
    await assert.rejects(c.get("/lists"), (e) => e.code === "network" && /Impossible de joindre Mailchimp/.test(e.message));
  });

  test("pagination : toutes les pages sont lues (count/offset), plafond respecté", async () => {
    const l = fake.addList("Pagination");
    for (let i = 0; i < 25; i++) fake.addMember(l.id, `p${i}@exemple.fr`);
    const c = make();
    const all = await c.collect(`/lists/${l.id}/members`, "members", { pageSize: 10 });
    assert.equal(all.items.length, 25);
    assert.equal(all.truncated, false);
    const capped = await c.collect(`/lists/${l.id}/members`, "members", { pageSize: 10, maxItems: 12 });
    assert.equal(capped.items.length, 12);
    assert.equal(capped.truncated, true);
  });

  test("journal : méthode, chemin sans paramètres, empreinte masquée, durée, tentatives — jamais la clé", async () => {
    const entries = [];
    const c = make({ onLog: (e) => entries.push(e) });
    const l = fake.addList("Journal");
    fake.addMember(l.id, "j@exemple.fr");
    await c.get(`/lists/${l.id}/members/${fake.md5("j@exemple.fr")}`, { fields: "id" });
    await assert.rejects(c.get("/lists/aaaaaaaaaa"));
    assert.equal(entries[0].path, `/lists/${l.id}/members/:hash`);
    assert.equal(entries[0].status, 200);
    assert.equal(entries[1].errorCode, "not_found");
    assert.ok(entries.every((e) => typeof e.durationMs === "number" && e.attempts >= 1));
    assert.doesNotMatch(JSON.stringify(entries), /0123456789abcdef0123456789abcdef/);
    assert.equal(logPath("/a/b?token=secret"), "/a/b");
  });

  test("chemins suspects refusés avant tout appel réseau ; le bloc _links est retiré des réponses", async () => {
    const c = make();
    await assert.rejects(c.request("GET", "/lists/../x"), (e) => e.code === "invalid_request");
    await assert.rejects(c.request("GET", "lists"), (e) => e.code === "invalid_request");
    await assert.rejects(c.request("GET", "/a b"), (e) => e.code === "invalid_request");
    assert.equal(fake.requests.length, 0);
    const root = await c.get("/");
    assert.equal(root._links, undefined);
    assert.equal(root.account_name, "Société Démo");
  });
});
