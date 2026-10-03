// Marketing M1b — consentement, désinscription, liste de suppression, préférences, garde d'envoi (isSendable).
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const { verifyToken } = require("../src/marketing/security/tokens");

let m, A, B, c;
beforeEach(() => {
  m = freshMarketing(); A = m.A; B = m.B;
  c = audience.upsertContact(A, { email: "a@b.fr" }).contact;
});
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const status = (ctx = A, id = c.id) => audience.getContact(ctx, id).status;
const PROOF = { source: "form", textShown: "Oui, je veux recevoir les actualités de KOLAKISA", ip: "203.0.113.57" };

describe("consentement", () => {
  test("un consentement prouvé abonne le contact et laisse une trace complète (IP tronquée)", () => {
    const r = compliance.recordConsent(A, c.id, PROOF);
    assert.deepEqual([r.ok, r.status], [true, "subscribed"]);
    assert.equal(status(), "subscribed");
    const [row] = compliance.consentHistory(A, c.id);
    assert.deepEqual([row.action, row.source, row.text_shown, row.ip], ["granted", "form", PROOF.textShown, "203.0.113.0"]);
    assert.ok(row.created_at);
  });
  test("sans texte de preuve (ou source invalide), aucun abonnement", () => {
    assert.equal(code(() => compliance.recordConsent(A, c.id, { source: "form", textShown: "" })), "proof_required");
    assert.equal(code(() => compliance.recordConsent(A, c.id, { source: "Formulaire!", textShown: "ok ok" })), "invalid_field");
    assert.equal(status(), "unknown");
  });
  test("les preuves ne se modifient ni ne se suppriment directement (base protégée)", () => {
    compliance.recordConsent(A, c.id, PROOF);
    assert.throws(() => m.db.exec("UPDATE mk_consents SET text_shown = 'autre'"), /lecture seule/);
    assert.throws(() => m.db.exec("DELETE FROM mk_consents"), /lecture seule/);
  });
  test("l'effacement du contact emporte ses preuves (droit à l'effacement)", () => {
    compliance.recordConsent(A, c.id, PROOF);
    assert.equal(audience.deleteContact(A, c.id), true);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_consents").get().n, 0);
  });
  test("consentement d'un contact d'une autre organisation : introuvable", () => {
    assert.equal(code(() => compliance.recordConsent(B, c.id, PROOF)), "not_found");
    assert.equal(status(), "unknown");
  });
  test("événement contact.subscribed émis une fois par consentement", () => {
    compliance.recordConsent(A, c.id, PROOF);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_events WHERE name = 'contact.subscribed'").get().n, 1);
  });
});

describe("désinscription", () => {
  test("globale : statut, date, historique, événement ; idempotente", () => {
    compliance.recordConsent(A, c.id, PROOF);
    assert.deepEqual(compliance.unsubscribe(A, c.id, { source: "link" }), { ok: true, already: false });
    assert.equal(status(), "unsubscribed");
    assert.ok(audience.getContact(A, c.id).unsubscribed_at);
    assert.deepEqual(compliance.consentHistory(A, c.id).map((h) => h.action), ["withdrawn", "granted"]);
    assert.equal(compliance.unsubscribe(A, c.id, { source: "link" }).already, true);
    assert.equal(compliance.consentHistory(A, c.id).length, 2, "pas de doublon d'historique");
  });
  test("un contact « unknown » peut aussi se désinscrire (il ne veut rien recevoir)", () => {
    compliance.unsubscribe(A, c.id, { source: "link" });
    assert.equal(status(), "unsubscribed");
  });
  test("les importations, l'API, l'admin ne peuvent PAS le réabonner ; seule la personne le peut", () => {
    compliance.recordConsent(A, c.id, PROOF);
    compliance.unsubscribe(A, c.id, { source: "link" });
    for (const source of ["import", "api", "admin", "lms"]) {
      const r = compliance.recordConsent(A, c.id, { source, textShown: "Déclaré par l'administrateur" });
      assert.deepEqual([r.ok, r.reason], [false, "unsubscribed"], source);
    }
    assert.equal(status(), "unsubscribed");
    assert.equal(compliance.recordConsent(A, c.id, { source: "preference_center", textShown: "Je me réinscris" }).ok, true);
    assert.equal(status(), "subscribed");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_unsubscribes").get().n, 0);
  });
  test("par liste : n'affecte pas le statut global", () => {
    const l = audience.createList(A, { name: "Promos" });
    compliance.recordConsent(A, c.id, PROOF);
    compliance.unsubscribe(A, c.id, { scope: "list", listId: l.id, source: "link" });
    assert.equal(status(), "subscribed");
    assert.equal(compliance.isSendable(A, c.id, { listId: l.id }).reason, "list_unsubscribed");
    assert.equal(compliance.isSendable(A, c.id).ok, true);
    assert.equal(code(() => compliance.unsubscribe(A, c.id, { scope: "list", listId: 999, source: "link" })), "not_found");
    assert.equal(code(() => compliance.unsubscribe(A, c.id, { scope: "list", source: "link" })), "invalid_field");
  });
  test("un contact suppressed/bounced/complained garde son statut lors d'une désinscription", () => {
    compliance.addSuppression(A, { email: "a@b.fr", reason: "complained" });
    compliance.unsubscribe(A, c.id, { source: "link" });
    assert.equal(status(), "complained");
  });
});

describe("liste de suppression", () => {
  test("ajout : contact bloqué selon le motif ; ajout idempotent", () => {
    for (const [reason, expected] of [["bounced", "bounced"], ["complained", "complained"], ["manual", "suppressed"]]) {
      const x = audience.upsertContact(A, { email: `${reason}@x.fr` }).contact;
      assert.equal(compliance.addSuppression(A, { email: `${reason}@x.fr`, reason }).added, true);
      assert.equal(status(A, x.id), expected);
      assert.equal(compliance.addSuppression(A, { email: `${reason}@x.fr`, reason }).added, false);
    }
  });
  test("adresse sans contact : la suppression est enregistrée quand même", () => {
    compliance.addSuppression(A, { email: "inconnu@x.fr", reason: "manual", note: "demande par courrier" });
    assert.equal(compliance.listSuppressions(A).rows[0].email, "inconnu@x.fr");
  });
  test("un contact suppressed ne peut JAMAIS être réabonné, même par la personne", () => {
    compliance.addSuppression(A, { email: "a@b.fr", reason: "bounced" });
    const r = compliance.recordConsent(A, c.id, PROOF);
    assert.deepEqual([r.ok, r.reason], [false, "suppressed"]);
    assert.equal(status(), "bounced");
    assert.equal(compliance.consentHistory(A, c.id).length, 0);
  });
  test("retrait : seulement pour « manual » ; le contact revient à « unsubscribed » (jamais abonné d'office)", () => {
    compliance.addSuppression(A, { email: "a@b.fr", reason: "manual" });
    assert.equal(compliance.removeSuppression(A, "A@b.fr").removed, true);
    assert.equal(status(), "unsubscribed");
    assert.equal(compliance.isSendable(A, c.id).ok, false);
    compliance.addSuppression(A, { email: "a@b.fr", reason: "complained" });
    assert.equal(code(() => compliance.removeSuppression(A, "a@b.fr")), "not_removable");
    assert.equal(compliance.removeSuppression(A, "absent@b.fr").removed, false);
  });
  test("motif invalide refusé ; e-mail invalide refusé", () => {
    assert.equal(code(() => compliance.addSuppression(A, { email: "a@b.fr", reason: "erasure" })), "invalid_field");
    assert.equal(code(() => compliance.addSuppression(A, { email: "nimporte", reason: "manual" })), "invalid_email");
  });
  test("recherche (q) : sous-chaîne de l'adresse, insensible à la casse", () => {
    compliance.addSuppression(A, { email: "newsletter-bounce@x.fr", reason: "bounced" });
    compliance.addSuppression(A, { email: "autre@y.fr", reason: "manual" });
    const rows = compliance.listSuppressions(A, { q: "NEWSLETTER" }).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].email, "newsletter-bounce@x.fr");
  });
  test("filtre par motif : n'affiche que le motif demandé", () => {
    compliance.addSuppression(A, { email: "b1@x.fr", reason: "bounced" });
    compliance.addSuppression(A, { email: "c1@x.fr", reason: "complained" });
    const bounced = compliance.listSuppressions(A, { reason: "bounced" }).rows;
    assert.ok(bounced.every((r) => r.reason === "bounced"));
    assert.ok(bounced.some((r) => r.email === "b1@x.fr"));
    assert.ok(!bounced.some((r) => r.email === "c1@x.fr"));
  });
  test("recherche + filtre combinés ; motif inconnu ignoré (pas d'erreur)", () => {
    compliance.addSuppression(A, { email: "combo@x.fr", reason: "manual" });
    const rows = compliance.listSuppressions(A, { q: "combo", reason: "manual" }).rows;
    assert.equal(rows.length, 1);
    assert.doesNotThrow(() => compliance.listSuppressions(A, { reason: "n_importe_quoi" }));
  });
});

describe("préférences par catégorie", () => {
  test("catégories, choix par contact, et effet sur l'envoi", () => {
    compliance.createCategory(A, { key: "promotions", label: "Promotions" });
    compliance.createCategory(A, { key: "nouveautes", label: "Nouveautés", description: "Nouveaux cours" });
    assert.equal(code(() => compliance.createCategory(A, { key: "promotions", label: "x" })), "duplicate");
    assert.equal(code(() => compliance.createCategory(A, { key: "Promo!", label: "x" })), "invalid_field");
    compliance.recordConsent(A, c.id, PROOF);
    assert.deepEqual(compliance.preferencesOf(A, c.id).map((p) => [p.key, p.subscribed]), [["promotions", true], ["nouveautes", true]]);
    compliance.setPreference(A, c.id, "promotions", false);
    assert.equal(compliance.isSendable(A, c.id, { category: "promotions" }).reason, "category_opted_out");
    assert.equal(compliance.isSendable(A, c.id, { category: "nouveautes" }).ok, true);
    compliance.setPreference(A, c.id, "promotions", true);
    assert.equal(compliance.isSendable(A, c.id, { category: "promotions" }).ok, true);
    assert.equal(code(() => compliance.setPreference(A, c.id, "inconnue", true)), "not_found");
  });
  test("choisir une catégorie ne réabonne pas un désinscrit", () => {
    compliance.createCategory(A, { key: "promotions", label: "Promotions" });
    compliance.unsubscribe(A, c.id, { source: "link" });
    compliance.setPreference(A, c.id, "promotions", true);
    assert.equal(status(), "unsubscribed");
  });
});

describe("garde d'envoi isSendable : la seule porte vers le marketing", () => {
  test("refus pour chaque état non abonné, avec la raison", () => {
    assert.equal(compliance.isSendable(A, c.id).reason, "not_subscribed");
    assert.equal(compliance.isSendable(A, 9999).reason, "not_found");
    compliance.recordConsent(A, c.id, PROOF);
    assert.equal(compliance.isSendable(A, c.id).ok, true);
    compliance.unsubscribe(A, c.id, { source: "link" });
    assert.equal(compliance.isSendable(A, c.id).reason, "unsubscribed");
  });
  test("incohérence détectée : « subscribed » sans preuve de consentement n'est pas envoyable", () => {
    m.db.prepare("UPDATE mk_contacts SET status = 'subscribed' WHERE id = ?").run(c.id);
    assert.equal(compliance.isSendable(A, c.id).reason, "no_consent");
  });
  test("adresse en liste de suppression : refus même si le statut a été trafiqué", () => {
    compliance.recordConsent(A, c.id, PROOF);
    m.db.prepare("INSERT INTO mk_suppressions (organization_id, email, reason) VALUES (1, 'a@b.fr', 'manual')").run();
    assert.equal(compliance.isSendable(A, c.id).reason, "suppressed");
  });
  test("contact d'une autre organisation : not_found", () => {
    assert.equal(compliance.isSendable(B, c.id).reason, "not_found");
  });
});

describe("liens signés", () => {
  test("le lien de désinscription contient un jeton valide, sans expiration, propre au contact", () => {
    const token = compliance.unsubscribeToken(A, c.id, TEST_KEY, { listId: 3 });
    const v = verifyToken(token, TEST_KEY, { kind: "unsub" });
    assert.deepEqual([v.ok, v.payload.o, v.payload.c, v.payload.l, v.payload.exp], [true, 1, c.id, 3, undefined]);
  });
  test("désinscription depuis un jeton : marche, refuse un jeton faux ou d'un autre type", () => {
    compliance.recordConsent(A, c.id, PROOF);
    const token = compliance.unsubscribeToken(A, c.id, TEST_KEY);
    assert.equal(compliance.unsubscribeWithToken(m.db, token, TEST_KEY, { source: "link" }).ok, true);
    assert.equal(status(), "unsubscribed");
    assert.equal(compliance.unsubscribeWithToken(m.db, "n'importe quoi", TEST_KEY, { source: "link" }).ok, false);
    assert.equal(compliance.unsubscribeWithToken(m.db, compliance.preferencesToken(A, c.id, TEST_KEY), TEST_KEY, { source: "link" }).ok, false);
  });
  test("jeton d'un contact supprimé : réponse neutre, sans planter", () => {
    const token = compliance.unsubscribeToken(A, c.id, TEST_KEY);
    audience.deleteContact(A, c.id);
    assert.equal(compliance.unsubscribeWithToken(m.db, token, TEST_KEY, { source: "link" }).ok, false);
  });
});

describe("adresse IP tronquée", () => {
  test("IPv4, IPv6, IPv4 mappée, valeur invalide", () => {
    const t = compliance.truncateIp;
    assert.equal(t("203.0.113.57"), "203.0.113.0");
    assert.equal(t("2001:db8:85a3:8d3:1319:8a2e:370:7348"), "2001:db8:85a3::");
    assert.equal(t("::ffff:198.51.100.23"), "198.51.100.0");
    assert.equal(t("pas une ip"), "");
    assert.equal(t(undefined), "");
  });
});
