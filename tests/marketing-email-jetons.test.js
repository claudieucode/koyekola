// Marketing M1 — normalisation/validation d'e-mail et jetons signés (désinscription, préférences).
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { normalizeEmail, validateEmail } = require("../src/marketing/audience/email");
const { signToken, verifyToken } = require("../src/marketing/security/tokens");
const { TEST_KEY } = require("./marketing-helpers");

describe("normalizeEmail", () => {
  test("espaces retirés, minuscules, préfixe mailto: et chevrons retirés", () => {
    assert.equal(normalizeEmail("  Marie.Dupont@Exemple.FR "), "marie.dupont@exemple.fr");
    assert.equal(normalizeEmail("mailto:a@b.fr"), "a@b.fr");
    assert.equal(normalizeEmail("<a@b.fr>"), "a@b.fr");
  });
  test("ne touche PAS aux « + » ni aux points (ce sont des adresses distinctes)", () => {
    assert.equal(normalizeEmail("Jean.Paul+promo@Gmail.com"), "jean.paul+promo@gmail.com");
  });
  test("domaine international converti en ASCII (punycode)", () => {
    assert.equal(normalizeEmail("a@Bücher.example"), "a@xn--bcher-kva.example");
  });
  test("valeurs non textuelles → chaîne vide", () => {
    for (const v of [null, undefined, 42, {}, []]) assert.equal(normalizeEmail(v), "");
  });
});

describe("validateEmail", () => {
  test("adresses valides", () => {
    for (const e of ["a@b.fr", "prenom.nom@sub.domaine.co.uk", "x+y@z.io", "o'brien@ex.com", "a_b-c@ex-ample.org"]) {
      const r = validateEmail(e);
      assert.equal(r.ok, true, e);
      assert.equal(r.email, e.toLowerCase());
    }
  });
  test("adresses invalides, avec une raison lisible", () => {
    const cases = [
      ["", /vide|absente/i], ["sans-arobase.fr", /@/], ["a@@b.fr", /@/], ["a b@c.fr", /espace|caract/i], ["a@b", /domaine/i],
      [".a@b.fr", /point/i], ["a..b@c.fr", /point/i], ["a.@b.fr", /point/i], ["a@-b.fr", /domaine/i], ["a@b..fr", /domaine/i],
      ["a@b.f", /domaine/i], ["a@1.2.3.4", /domaine/i], ["a\nb@c.fr", /caract|espace/i], ["a@b.fr,c@d.fr", /caract|espace|@/i],
      [`${"a".repeat(65)}@b.fr`, /trop long/i], [`a@${"b".repeat(250)}.fr`, /trop long/i],
    ];
    for (const [input, reason] of cases) {
      const r = validateEmail(input);
      assert.equal(r.ok, false, JSON.stringify(input));
      assert.match(r.reason, reason, JSON.stringify(input));
    }
  });
  test("injection d'en-têtes (retours à la ligne) impossible", () => {
    assert.equal(validateEmail("a@b.fr\r\nBcc: x@y.fr").ok, false);
  });
});

describe("jetons signés", () => {
  const payload = { o: 1, c: 42, k: "unsub" };
  test("aller-retour valide", () => {
    const token = signToken(payload, TEST_KEY);
    assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    assert.deepEqual(verifyToken(token, TEST_KEY, { kind: "unsub" }), { ok: true, payload });
  });
  test("le type est vérifié : un jeton de désinscription ne sert pas pour les préférences", () => {
    assert.equal(verifyToken(signToken(payload, TEST_KEY), TEST_KEY, { kind: "prefs" }).ok, false);
  });
  test("toute modification est détectée", () => {
    const [body, sig] = signToken(payload, TEST_KEY).split(".");
    const forged = Buffer.from(JSON.stringify({ ...payload, c: 43 })).toString("base64url");
    assert.equal(verifyToken(`${forged}.${sig}`, TEST_KEY, { kind: "unsub" }).ok, false);
    assert.equal(verifyToken(`${body}.${sig.slice(0, -2)}AA`, TEST_KEY, { kind: "unsub" }).ok, false);
    assert.equal(verifyToken("n'importe quoi", TEST_KEY, { kind: "unsub" }).ok, false);
    assert.equal(verifyToken("", TEST_KEY, { kind: "unsub" }).ok, false);
    assert.equal(verifyToken(undefined, TEST_KEY, { kind: "unsub" }).ok, false);
  });
  test("une autre clé ne valide pas le jeton", () => {
    assert.equal(verifyToken(signToken(payload, TEST_KEY), "f".repeat(64), { kind: "unsub" }).ok, false);
  });
  test("expiration respectée quand elle est fixée ; sans expiration, le jeton reste valable (lien de désinscription)", () => {
    const now = 1_000_000;
    const expired = signToken({ ...payload, k: "prefs", exp: now - 1 }, TEST_KEY);
    assert.equal(verifyToken(expired, TEST_KEY, { kind: "prefs", now }).ok, false);
    assert.equal(verifyToken(signToken({ ...payload, k: "prefs", exp: now + 1 }, TEST_KEY), TEST_KEY, { kind: "prefs", now }).ok, true);
    assert.equal(verifyToken(signToken(payload, TEST_KEY), TEST_KEY, { kind: "unsub", now: now * 1e6 }).ok, true);
  });
  test("clé absente ou invalide : erreur claire, jamais de jeton non signé", () => {
    assert.throws(() => signToken(payload, ""), /ENCRYPTION_KEY/);
  });
});
