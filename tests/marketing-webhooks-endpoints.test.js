// Webhooks sortants — points d'accès : création (secret révélé une fois), validation de l'adresse et des
// événements, liste sans secret, révélation à la demande (auditée), pause/activation, suppression, isolation.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const { createEndpoint, listEndpoints, getEndpoint, revealSecret, setEnabled, deleteEndpoint, endpointsFor, validateUrl, validateEvents } = require("../src/marketing/webhooks/endpoints");
const { MarketingError } = require("../src/marketing/errors");

let m, A, B;
beforeEach(() => { m = freshMarketing(); A = m.A; B = m.B; });

describe("validation", () => {
  test("adresse : http(s) seulement", () => {
    assert.equal(validateUrl("https://exemple.fr/hook"), "https://exemple.fr/hook");
    assert.equal(validateUrl("http://exemple.fr/hook"), "http://exemple.fr/hook");
    assert.throws(() => validateUrl("ftp://exemple.fr"), MarketingError);
    assert.throws(() => validateUrl("javascript:alert(1)"), MarketingError);
    assert.throws(() => validateUrl("pas une adresse"), MarketingError);
  });
  test("adresse : aucun identifiant intégré (user:pass@hôte)", () => {
    assert.throws(() => validateUrl("https://admin:secret@exemple.fr/hook"), MarketingError);
  });
  test("événements : au moins un, tous connus, « * » absorbe le reste", () => {
    assert.throws(() => validateEvents([]), MarketingError);
    assert.throws(() => validateEvents(["invente.pas"]), MarketingError);
    assert.deepEqual(validateEvents(["contact.created", "contact.created"]), ["contact.created"]);
    assert.deepEqual(validateEvents(["contact.created", "*"]), ["*"]);
  });
});

describe("création", () => {
  test("le secret complet est renvoyé une fois, jamais stocké en clair", () => {
    const result = createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    assert.match(result.secret, /^whsec_[0-9a-f]{48}$/);
    const row = m.db.prepare("SELECT secret FROM mk_webhook_endpoints WHERE id = ?").get(result.id);
    assert.notEqual(row.secret, result.secret);
    assert.doesNotMatch(row.secret, /whsec_/);
  });
  test("nom obligatoire, doublon refusé dans la même organisation", () => {
    assert.throws(() => createEndpoint(A, { name: "  ", url: "https://exemple.fr", events: ["*"], encryptionKey: TEST_KEY }), MarketingError);
    createEndpoint(A, { name: "Dup", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    assert.throws(() => createEndpoint(A, { name: "Dup", url: "https://exemple.fr/b", events: ["*"], encryptionKey: TEST_KEY }), MarketingError);
  });
  test("régression : sans ENCRYPTION_KEY valide, AUCUNE ligne n'est créée (pas de webhook au secret vide en base)", () => {
    assert.throws(() => createEndpoint(A, { name: "Sans clé", url: "https://exemple.fr/a", events: ["*"], encryptionKey: "" }));
    assert.throws(() => createEndpoint(A, { name: "Clé invalide", url: "https://exemple.fr/a", events: ["*"], encryptionKey: "trop-courte" }));
    assert.deepEqual(listEndpoints(A), []);
  });
  test("actif par défaut", () => {
    const { id } = createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    assert.equal(getEndpoint(A, id).enabled, true);
  });
});

describe("liste et lecture", () => {
  test("jamais le secret, même chiffré", () => {
    createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    const [row] = listEndpoints(A);
    // R2 : portée de site ; toujours jamais le secret
    assert.deepEqual(Object.keys(row).sort(), ["created_at", "enabled", "events", "id", "name", "reach", "siteId", "siteName", "updated_at", "url"].sort());
  });
  test("isolation : les points d'accès de l'autre organisation n'apparaissent jamais", () => {
    createEndpoint(B, { name: "Chez B", url: "https://exemple.fr/b", events: ["*"], encryptionKey: TEST_KEY });
    assert.deepEqual(listEndpoints(A), []);
  });
  test("fiche introuvable ou d'une autre organisation : erreur", () => {
    const { id } = createEndpoint(B, { name: "Chez B", url: "https://exemple.fr/b", events: ["*"], encryptionKey: TEST_KEY });
    assert.throws(() => getEndpoint(A, id), MarketingError);
    assert.throws(() => getEndpoint(A, 999999), MarketingError);
  });
});

describe("révélation du secret", () => {
  test("redonne exactement le secret généré à la création", () => {
    const created = createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    assert.equal(revealSecret(A, created.id, { encryptionKey: TEST_KEY }), created.secret);
  });
  test("une autre organisation ne peut pas révéler le secret d'un point d'accès qui n'est pas le sien", () => {
    const created = createEndpoint(B, { name: "Chez B", url: "https://exemple.fr/b", events: ["*"], encryptionKey: TEST_KEY });
    assert.throws(() => revealSecret(A, created.id, { encryptionKey: TEST_KEY }), MarketingError);
  });
});

describe("pause / activation", () => {
  test("bascule l'état, journalisé", () => {
    const { id } = createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    setEnabled(A, id, false);
    assert.equal(getEndpoint(A, id).enabled, false);
    setEnabled(A, id, true);
    assert.equal(getEndpoint(A, id).enabled, true);
  });
});

describe("suppression", () => {
  test("supprime la ligne ; introuvable ensuite", () => {
    const { id } = createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    deleteEndpoint(A, id);
    assert.throws(() => getEndpoint(A, id), MarketingError);
  });
});

describe("endpointsFor (utilisé par la distribution)", () => {
  test("« * » correspond à tout, une liste explicite ne correspond qu'à ses événements, une organisation à la fois", () => {
    createEndpoint(A, { name: "Tout", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    createEndpoint(A, { name: "Ciblé", url: "https://exemple.fr/b", events: ["contact.created"], encryptionKey: TEST_KEY });
    createEndpoint(B, { name: "Chez B", url: "https://exemple.fr/c", events: ["*"], encryptionKey: TEST_KEY });
    const matches = endpointsFor(m.db, 1, "contact.created").map((e) => e.name).sort();
    assert.deepEqual(matches, ["Ciblé", "Tout"]);
    assert.deepEqual(endpointsFor(m.db, 1, "campaign.sent").map((e) => e.name), ["Tout"]);
  });
  test("un point d'accès en pause n'est jamais renvoyé, même abonné", () => {
    const { id } = createEndpoint(A, { name: "E1", url: "https://exemple.fr/a", events: ["*"], encryptionKey: TEST_KEY });
    setEnabled(A, id, false);
    assert.deepEqual(endpointsFor(m.db, 1, "contact.created"), []);
  });
});
