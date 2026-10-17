// Clés d'API — données réelles : création (clé visible une seule fois), empreinte non réversible, authentification,
// révocation immédiate, isolation entre organisations.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const { createApiKey, listApiKeys, revokeApiKey, authenticate, hashOf, generateRawKey, SCOPES } = require("../src/marketing/api/keys");
const { MarketingError } = require("../src/marketing/errors");

let m, A, B;
beforeEach(() => { m = freshMarketing(); A = m.A; B = m.B; });

describe("création", () => {
  test("la clé complète est renvoyée une fois, jamais stockée en clair", () => {
    const result = createApiKey(A, { name: "Site vitrine", scope: "read" });
    assert.match(result.key, /^mk_live_[0-9a-f]{48}$/);
    const row = m.db.prepare("SELECT key_hash, prefix FROM mk_api_keys WHERE id = ?").get(result.id);
    assert.notEqual(row.key_hash, result.key);
    assert.equal(row.key_hash, hashOf(result.key));
    assert.equal(row.prefix, result.key.slice(0, 12));
  });
  test("le nom est obligatoire", () => {
    assert.throws(() => createApiKey(A, { name: "  ", scope: "read" }), MarketingError);
  });
  test("une portée inconnue est refusée", () => {
    assert.throws(() => createApiKey(A, { name: "X", scope: "admin" }), MarketingError);
  });
  test("deux clés de même nom dans la même organisation : refusé", () => {
    createApiKey(A, { name: "Doublon", scope: "read" });
    assert.throws(() => createApiKey(A, { name: "Doublon", scope: "read" }), MarketingError);
  });
  test("le même nom est permis dans une autre organisation", () => {
    createApiKey(A, { name: "Partagé", scope: "read" });
    assert.doesNotThrow(() => createApiKey(B, { name: "Partagé", scope: "read" }));
  });
  test("deux clés générées ne sont jamais identiques", () => {
    assert.notEqual(generateRawKey(), generateRawKey());
  });
});

describe("liste", () => {
  test("jamais l'empreinte ni la clé, seulement le préfixe", () => {
    createApiKey(A, { name: "K", scope: "write" });
    const [row] = listApiKeys(A);
    // R2 : portée de site (reach, site_id, site_name) ; toujours ni empreinte ni clé
    assert.deepEqual(Object.keys(row).sort(), ["created_at", "id", "last_used_at", "name", "prefix", "reach", "revoked_at", "scope", "site_id", "site_name"].sort());
  });
  test("isolation : les clés de l'autre organisation n'apparaissent jamais", () => {
    createApiKey(B, { name: "Chez B", scope: "read" });
    assert.deepEqual(listApiKeys(A), []);
  });
});

describe("authentification", () => {
  test("clé valide : renvoie l'organisation et la portée", () => {
    const { key } = createApiKey(A, { name: "K", scope: "write" });
    const auth = authenticate(m.db, key);
    assert.deepEqual(auth, { keyId: auth.keyId, organizationId: 1, scope: "write", reach: "organization", siteId: null }); // R2 : une clé sans site garde la portée « organisation »
  });
  test("clé inconnue, vide, ou sans le bon préfixe : refusée", () => {
    assert.equal(authenticate(m.db, "mk_live_0000000000000000000000000000000000000000000000"), null);
    assert.equal(authenticate(m.db, ""), null);
    assert.equal(authenticate(m.db, "Bearer autre-chose"), null);
    assert.equal(authenticate(m.db, null), null);
  });
  test("une clé révoquée n'authentifie plus, immédiatement", () => {
    const { key, id } = createApiKey(A, { name: "K", scope: "read" });
    assert.ok(authenticate(m.db, key));
    revokeApiKey(A, id);
    assert.equal(authenticate(m.db, key), null);
  });
  test("la dernière utilisation est enregistrée", () => {
    const { key, id } = createApiKey(A, { name: "K", scope: "read" });
    assert.equal(listApiKeys(A).find((k) => k.id === id).last_used_at, null);
    authenticate(m.db, key);
    assert.notEqual(listApiKeys(A).find((k) => k.id === id).last_used_at, null);
  });
});

describe("révocation", () => {
  test("clé inconnue ou d'une autre organisation : introuvable", () => {
    const { id } = createApiKey(B, { name: "K", scope: "read" });
    assert.throws(() => revokeApiKey(A, id), MarketingError);
    assert.throws(() => revokeApiKey(A, 999999), MarketingError);
  });
  test("révoquer deux fois ne provoque pas d'erreur (message informatif)", () => {
    const { id } = createApiKey(A, { name: "K", scope: "read" });
    revokeApiKey(A, id);
    const msg = revokeApiKey(A, id);
    assert.match(msg, /déjà révoquée/);
  });
});

test("les portées valides sont read et write, rien d'autre", () => {
  assert.deepEqual(SCOPES, ["read", "write"]);
});
