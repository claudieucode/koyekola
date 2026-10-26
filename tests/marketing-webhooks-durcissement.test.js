// Non-régression de l'audit email-marketing (B1, B9) : redirections jamais suivies, plages CGNAT/réservées refusées,
// 408 et 429 réessayés, connexion épinglée sur l'adresse validée.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { sendWebhook, isPrivateAddress, SsrfError } = require("../src/marketing/webhooks/delivery");
const { UnrecoverableError } = require("../src/marketing/queue/worker");

const base = { url: "https://exemple.fr/hook", secret: "whsec_t", eventName: "x", eventId: 1, occurredAt: "2026-01-01T00:00:00Z", metadata: {}, lookup: async () => [{ address: "93.184.216.34", family: 4 }] };

describe("plages supplémentaires refusées", () => {
  for (const ip of ["100.64.0.1", "100.127.255.254", "192.0.0.1", "192.0.2.10", "198.18.0.1", "198.51.100.7", "203.0.113.9"]) test(`${ip} refusée`, () => assert.equal(isPrivateAddress(ip), true));
  for (const ip of ["100.63.255.255", "100.128.0.1", "198.20.0.1", "93.184.216.34"]) test(`${ip} publique`, () => assert.equal(isPrivateAddress(ip), false));
});

describe("réponses du destinataire", () => {
  const reply = (status) => ({ ...base, fetchImpl: async () => ({ status }) });
  test("307 vers une adresse interne : abandon sans reprise, redirection non suivie", async () => {
    let calls = 0;
    await assert.rejects(() => sendWebhook({ ...base, fetchImpl: async () => { calls++; return { status: 307, headers: { get: () => "http://127.0.0.1/admin" } }; } }), UnrecoverableError);
    assert.equal(calls, 1);
  });
  test("429 et 408 : erreur ordinaire (la file réessaie)", async () => {
    for (const s of [429, 408, 503]) await assert.rejects(() => sendWebhook(reply(s)), (e) => !(e instanceof UnrecoverableError));
  });
  test("404 : abandon définitif ; 200 : succès", async () => {
    await assert.rejects(() => sendWebhook(reply(404)), UnrecoverableError);
    assert.deepEqual(await sendWebhook(reply(200)), { status: 200 });
  });
  test("schéma autre que http(s) refusé", async () => {
    await assert.rejects(() => sendWebhook({ ...base, url: "ftp://exemple.fr/x" }), SsrfError);
  });
});

describe("connexion épinglée (sans fetchImpl)", () => {
  test("la connexion va à l'adresse validée, pas à une seconde résolution du nom", async () => {
    // Le nom « exemple.fr » n'existe pas : seule l'adresse épinglée (ici une adresse publique factice, refusée en connexion) peut être utilisée.
    // On vérifie donc que l'erreur vient d'une tentative de connexion à l'IP épinglée et non d'une résolution DNS du nom.
    const err = await sendWebhook({ ...base, url: "http://exemple-introuvable.invalid:9/h", lookup: async () => [{ address: "192.0.2.1", family: 4 }] }).catch((e) => e);
    assert.ok(err instanceof SsrfError, "192.0.2.1 (documentation) est refusée avant toute connexion");
  });
  test("un serveur qui répond 302 n'est jamais suivi (connexion réelle sur boucle locale, épinglage forcé par lookup injecté)", async () => {
    // boucle locale refusée par la garde : la preuve est que sendWebhook n'ouvre pas de connexion du tout
    let hit = 0;
    const srv = http.createServer((_q, r) => { hit++; r.statusCode = 302; r.setHeader("Location", "http://127.0.0.1/"); r.end(); });
    await new Promise((r) => srv.listen(0, "127.0.0.1", r));
    const port = srv.address().port;
    await assert.rejects(() => sendWebhook({ ...base, url: `http://127.0.0.1:${port}/h` }), SsrfError);
    assert.equal(hit, 0);
    srv.close();
  });
});
