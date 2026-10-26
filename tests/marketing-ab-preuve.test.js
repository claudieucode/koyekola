// Audit module 8 : le gagnant d'un test A/B d'e-mail était le meilleur taux brut, même avec 2 destinataires par version.
// evidence() dit maintenant si l'avantage est établi (test du Z, 95 %), insuffisant, ou non testable.
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { evidence } = require("../src/marketing/sending/abtest");

const r = (index, sent, clicks, opens = 0, revenueCents = 0) => ({ index, sent, clicks, opens, revenueCents });

describe("valeur probante d'un gagnant", () => {
  test("2 destinataires par version : données insuffisantes, aucun avantage affirmé", () => {
    const e = evidence([r(0, 2, 0), r(1, 2, 1)], "clicks", 1);
    assert.equal(e.level, "insufficient");
    assert.match(e.caveat, /insuffisantes/);
  });
  test("écart net sur de gros effectifs : significatif", () => {
    const e = evidence([r(0, 2000, 100), r(1, 2000, 180)], "clicks", 1);
    assert.equal(e.level, "significant");
    assert.ok(e.p < 0.05);
  });
  test("écart faible sur effectifs moyens : non significatif, avec avertissement de hasard", () => {
    const e = evidence([r(0, 300, 30), r(1, 300, 36)], "clicks", 1);
    assert.equal(e.level, "not_significant");
    assert.match(e.caveat, /hasard/);
  });
  test("ouvertures : toujours signalées comme indicatives", () => {
    const e = evidence([r(0, 2000, 0, 400), r(1, 2000, 0, 520)], "opens", 1);
    assert.equal(e.level, "significant");
    assert.match(e.caveat, /indicative/);
  });
  test("revenu et choix manuel : non testés, jamais « prouvés »", () => {
    assert.equal(evidence([r(0, 100, 5, 0, 1000), r(1, 100, 5, 0, 9000)], "revenue", 1).level, "not_tested");
    assert.equal(evidence([r(0, 100, 5), r(1, 100, 5)], "manual", 0).level, "not_tested");
  });
  test("entrées invalides : pas d'exception", () => {
    assert.equal(evidence([], "clicks", 0).level, "not_tested");
    assert.equal(evidence(null, "clicks", 0).level, "not_tested");
    assert.equal(evidence([r(0, 10, 1), r(1, 10, 1)], "clicks", 5).level, "not_tested");
  });
});
