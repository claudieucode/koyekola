// Webhooks sortants — livraison : blocage SSRF (adresses privées/locales, résolues à CHAQUE envoi), signature
// HMAC vérifiable, distribution idempotente depuis un événement, gestionnaire de travail (succès, pannes, abandons).
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");
const { freshMarketing, T0, TEST_KEY } = require("./marketing-helpers");
const { createEndpoint } = require("../src/marketing/webhooks/endpoints");
const { sendWebhook, signPayload, isPrivateAddress, assertPublicHost, SsrfError, eventHandler, jobHandlers, sendTestEvent } = require("../src/marketing/webhooks/delivery");
const { claim } = require("../src/marketing/queue/jobs");
const { UnrecoverableError } = require("../src/marketing/queue/worker");

describe("adresses privées / locales détectées", () => {
  const cases = [
    ["127.0.0.1", true], ["10.0.0.5", true], ["172.16.0.1", true], ["172.31.255.255", true], ["172.32.0.1", false],
    ["192.168.1.1", true], ["169.254.169.254", true], ["0.0.0.0", true], ["8.8.8.8", false], ["93.184.216.34", false],
    ["::1", true], ["fe80::1", true], ["fc00::1", true], ["::ffff:127.0.0.1", true], ["2001:4860:4860::8888", false],
  ];
  for (const [ip, expected] of cases) test(`${ip} → ${expected ? "privée/locale" : "publique"}`, () => assert.equal(isPrivateAddress(ip), expected));

  test("assertPublicHost : adresse IP littérale privée refusée sans résolution DNS", async () => {
    await assert.rejects(() => assertPublicHost("127.0.0.1"), SsrfError);
  });
  test("assertPublicHost : nom qui résout vers une IP publique, accepté", async () => {
    await assert.doesNotReject(() => assertPublicHost("exemple.fr", { lookup: async () => [{ address: "93.184.216.34" }] }));
  });
  test("assertPublicHost : nom qui résout (même partiellement) vers une IP privée, refusé (DNS rebinding)", async () => {
    await assert.rejects(() => assertPublicHost("exemple.fr", { lookup: async () => [{ address: "93.184.216.34" }, { address: "127.0.0.1" }] }), SsrfError);
  });
  test("assertPublicHost : échec de résolution DNS → erreur ordinaire (reprise possible), pas SsrfError", async () => {
    await assert.rejects(() => assertPublicHost("inconnu.invalid", { lookup: async () => { throw new Error("ENOTFOUND"); } }), (e) => !(e instanceof SsrfError));
  });
});

describe("signature", () => {
  test("HMAC-SHA256 vérifiable par le destinataire avec le même secret", () => {
    const sig = signPayload('{"a":1}', "whsec_test", 1700000000);
    const expected = crypto.createHmac("sha256", "whsec_test").update("1700000000." + '{"a":1}').digest("hex");
    assert.equal(sig, expected);
  });
  test("un secret différent donne une signature différente", () => {
    assert.notEqual(signPayload("x", "a", 1), signPayload("x", "b", 1));
  });
});

describe("sendWebhook (un seul essai HTTP)", () => {
  test("succès : en-têtes de signature et d'événement présents, corps JSON correct", async () => {
    let captured;
    const fetchImpl = async (url, opts) => { captured = { url, opts }; return { status: 200 }; };
    await sendWebhook({ url: "https://exemple.fr/hook", secret: "whsec_x", eventName: "contact.created", eventId: 42, occurredAt: T0, metadata: { email: "a@ex.fr" }, lookup: async () => [{ address: "93.184.216.34" }], fetchImpl });
    assert.equal(captured.url, "https://exemple.fr/hook");
    assert.equal(captured.opts.method, "POST");
    assert.equal(captured.opts.headers["X-KOYEKOLA-Event"], "contact.created");
    assert.match(captured.opts.headers["X-KOYEKOLA-Signature"], /^t=\d+,v1=[0-9a-f]{64}$/);
    const body = JSON.parse(captured.opts.body);
    assert.deepEqual(body, { id: "evt_42", event: "contact.created", occurred_at: T0, data: { email: "a@ex.fr" } });
  });
  test("adresse privée : refusée AVANT toute requête réseau (SsrfError)", async () => {
    let called = false;
    await assert.rejects(
      () => sendWebhook({ url: "http://127.0.0.1:9999/hook", secret: "s", eventName: "x", eventId: 1, occurredAt: T0, fetchImpl: async () => { called = true; return { status: 200 }; } }),
      SsrfError
    );
    assert.equal(called, false, "aucune requête réseau ne doit partir vers une adresse privée");
  });
  test("statut 2xx accepté, statut serveur (5xx) : erreur ordinaire (reprise possible)", async () => {
    const fetchImpl = async () => ({ status: 503 });
    await assert.rejects(() => sendWebhook({ url: "https://exemple.fr/hook", secret: "s", eventName: "x", eventId: 1, occurredAt: T0, lookup: async () => [{ address: "1.2.3.4" }], fetchImpl }), (e) => !(e instanceof UnrecoverableError));
  });
  test("statut 4xx : erreur DÉFINITIVE (la faute est au destinataire, aucune reprise)", async () => {
    const fetchImpl = async () => ({ status: 410 });
    await assert.rejects(() => sendWebhook({ url: "https://exemple.fr/hook", secret: "s", eventName: "x", eventId: 1, occurredAt: T0, lookup: async () => [{ address: "1.2.3.4" }], fetchImpl }), UnrecoverableError);
  });
});

let m, A;
beforeEach(() => { m = freshMarketing(); A = m.A; });

describe("distribution depuis un événement", () => {
  test("un événement abonné met en file une livraison par point d'accès concerné", () => {
    createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["contact.created"], encryptionKey: TEST_KEY });
    createEndpoint(A, { name: "E2", url: "https://exemple.fr/b", events: ["campaign.sent"], encryptionKey: TEST_KEY }); // pas abonné
    createEndpoint(A, { name: "E3", url: "https://exemple.fr/c", events: ["*"], encryptionKey: TEST_KEY });
    eventHandler({ db: m.db, env: { ENCRYPTION_KEY: TEST_KEY } })({ organizationId: 1, id: 5, name: "contact.created", occurredAt: T0, metadata: {} });
    const jobs = m.db.prepare("SELECT type, payload FROM mk_jobs WHERE type = 'webhook.deliver'").all().map((r) => JSON.parse(r.payload));
    assert.equal(jobs.length, 2);
    assert.deepEqual(jobs.map((j) => j.eventName).sort(), ["contact.created", "contact.created"]);
  });
  test("un point d'accès en pause n'est jamais notifié", () => {
    createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    m.db.prepare("UPDATE mk_webhook_endpoints SET enabled = 0").run();
    eventHandler({ db: m.db, env: { ENCRYPTION_KEY: TEST_KEY } })({ organizationId: 1, id: 5, name: "contact.created", occurredAt: T0, metadata: {} });
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE type = 'webhook.deliver'").get().n, 0);
  });
  test("rejouer le même événement (même id) n'enfile jamais deux fois la même livraison (idempotence)", () => {
    createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    const h = eventHandler({ db: m.db, env: { ENCRYPTION_KEY: TEST_KEY } });
    h({ organizationId: 1, id: 5, name: "contact.created", occurredAt: T0, metadata: {} });
    h({ organizationId: 1, id: 5, name: "contact.created", occurredAt: T0, metadata: {} });
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE type = 'webhook.deliver'").get().n, 1);
  });
  test("sans ENCRYPTION_KEY : rien n'est mis en file (le secret serait de toute façon illisible)", () => {
    createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    eventHandler({ db: m.db, env: {} })({ organizationId: 1, id: 5, name: "contact.created", occurredAt: T0, metadata: {} });
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE type = 'webhook.deliver'").get().n, 0);
  });
});

describe("événement de test manuel (sendTestEvent)", () => {
  test("met en file une VRAIE livraison (même mécanisme qu'un événement réel), quels que soient les événements abonnés", () => {
    const { id } = createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["campaign.sent"], encryptionKey: TEST_KEY }); // abonné à autre chose
    sendTestEvent(A, id);
    const jobs = m.db.prepare("SELECT type, payload FROM mk_jobs WHERE type = 'webhook.deliver'").all().map((r) => JSON.parse(r.payload));
    assert.equal(jobs.length, 1);
    assert.equal(jobs[0].endpointId, id);
    assert.equal(jobs[0].eventName, "test.ping");
  });
  test("point d'accès introuvable ou d'une autre organisation : not_found, rien mis en file", () => {
    assert.throws(() => sendTestEvent(A, 999999), /introuvable/);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE type = 'webhook.deliver'").get().n, 0);
  });
  test("deux tests successifs : deux livraisons distinctes (jamais dédupliquées comme un événement rejoué)", () => {
    const { id } = createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    sendTestEvent(A, id);
    sendTestEvent(A, id);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE type = 'webhook.deliver'").get().n, 2);
  });
});

describe("gestionnaire de travail (webhook.deliver)", () => {
  const run = async (payload, opts = {}) => jobHandlers({ db: m.db, env: { ENCRYPTION_KEY: TEST_KEY }, ...opts })["webhook.deliver"](payload);

  test("livraison réussie : la requête part avec le bon secret déchiffré", async () => {
    const { id } = createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    let usedSignature;
    await run({ endpointId: id, eventName: "contact.created", eventId: 1, occurredAt: T0, metadata: {} }, {
      lookup: async () => [{ address: "1.2.3.4" }],
      fetchImpl: async (url, opts) => { usedSignature = opts.headers["X-KOYEKOLA-Signature"]; return { status: 200 }; },
    });
    assert.match(usedSignature, /^t=\d+,v1=[0-9a-f]{64}$/);
  });
  test("point d'accès introuvable : abandon immédiat (pas de reprise)", async () => {
    await assert.rejects(() => run({ endpointId: 999999, eventName: "x", eventId: 1, occurredAt: T0 }), UnrecoverableError);
  });
  test("point d'accès en pause : abandon immédiat", async () => {
    const { id } = createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    m.db.prepare("UPDATE mk_webhook_endpoints SET enabled = 0 WHERE id = ?").run(id);
    await assert.rejects(() => run({ endpointId: id, eventName: "x", eventId: 1, occurredAt: T0 }), UnrecoverableError);
  });
  test("adresse privée au moment de l'envoi : abandon immédiat (SSRF), jamais une simple reprise", async () => {
    const { id } = createEndpoint(A, { name: "E1", url: "http://127.0.0.1/a", events: ["*"], encryptionKey: TEST_KEY });
    await assert.rejects(() => run({ endpointId: id, eventName: "x", eventId: 1, occurredAt: T0 }), UnrecoverableError);
  });
});

describe("bout en bout avec la vraie file (mk_jobs)", () => {
  test("un événement enfilé peut être réservé et traité par le worker générique", async () => {
    const { id } = createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    eventHandler({ db: m.db, env: { ENCRYPTION_KEY: TEST_KEY } })({ organizationId: 1, id: 7, name: "contact.created", occurredAt: T0, metadata: {} });
    const [job] = claim(m.db, { workerId: "w1", now: T0 });
    assert.equal(job.type, "webhook.deliver");
    assert.equal(job.payload.endpointId, id);
  });
});
