// Phase 13a — score des contacts : règles configurables (événement réel → points, filtre, plafond), niveaux modifiables,
// changement de niveau → événement (déclencheur d'automatisation), score jamais négatif, recalcul depuis l'historique,
// champ « Score » des segments, clic dans un e-mail devenu un événement.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const scoring = require("../src/marketing/scoring");
const segments = require("../src/marketing/segments");
const auto = require("../src/marketing/automations");
const { startServer, loginInstructor } = require("./helpers");

const ev = (db, name, contact, metadata = {}) => {
  const id = Number(db.prepare("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, metadata, created_at) VALUES (1, ?, ?, ?, 'test', ?, ?, ?)").run(name, contact.email, contact.id, Date.now(), JSON.stringify(metadata), Date.now()).lastInsertRowid);
  return { id, organizationId: 1, name, contactId: contact.id, email: contact.email, metadata, occurredAt: Date.now() };
};

describe("moteur (sans serveur)", () => {
  test("points, filtre, plafond, jamais négatif, niveaux et événement de changement de niveau", () => {
    const { db, A } = freshMarketing();
    const { contact } = audience.upsertContact(A, { email: "lead@ex.fr" });
    assert.deepEqual(scoring.levels(A).map((l) => [l.name, l.min_score]), [["Froid", 0], ["Intéressé", 21], ["Chaud", 51], ["Très chaud", 101]]);
    scoring.createRule(A, { event: "page.visited", points: 5, maxTimes: 2 });
    scoring.createRule(A, { event: "lms.cart_added", points: 30, filterValue: "7" });
    scoring.createRule(A, { event: "contact.unsubscribed", points: -100 });
    assert.throws(() => scoring.createRule(A, { event: "contact.score_level_changed", points: 5 }), /Choisissez un événement/);
    assert.throws(() => scoring.createRule(A, { event: "page.visited", points: 0 }), /différent de 0/);
    const score = () => db.prepare("SELECT score FROM mk_contacts WHERE id = ?").get(contact.id).score;
    for (let i = 0; i < 3; i++) scoring.applyEvent(A, ev(db, "page.visited", contact, { pageId: "1" }));
    assert.equal(score(), 10, "plafond : 2 fois au plus");
    scoring.applyEvent(A, ev(db, "lms.cart_added", contact, { courseId: 3 }));
    assert.equal(score(), 10, "filtre : autre formation, pas de points");
    const e = ev(db, "lms.cart_added", contact, { courseId: 7 });
    scoring.applyEvent(A, e);
    scoring.applyEvent(A, e);
    assert.equal(score(), 40, "même événement rejoué : compté une fois");
    const lvl = db.prepare("SELECT metadata FROM mk_events WHERE name = 'contact.score_level_changed'").all().map((r) => JSON.parse(r.metadata));
    assert.deepEqual(lvl.map((m) => [m.previousLevel, m.level, m.score, m.direction]), [["Froid", "Intéressé", 40, "up"]]);
    scoring.applyEvent(A, ev(db, "contact.unsubscribed", contact));
    assert.equal(score(), 0, "jamais sous 0");
    assert.equal(scoring.contactScore(A, contact.id).history[0].points, -100);
  });

  test("recalcul depuis l'historique (silencieux), niveaux modifiables, segment « Score »", () => {
    const { db, A } = freshMarketing();
    const c1 = audience.upsertContact(A, { email: "a@ex.fr" }).contact;
    const c2 = audience.upsertContact(A, { email: "b@ex.fr" }).contact;
    ev(db, "lms.order_completed", c1, { totalCents: 4900 }); ev(db, "form.submitted", c1); ev(db, "form.submitted", c2);
    assert.equal(scoring.addSuggested(A), 9);
    assert.equal(scoring.addSuggested(A), 0, "pas de doublons");
    const r = scoring.recompute(A);
    assert.deepEqual(r, { events: 3, contacts: 2 });
    assert.equal(db.prepare("SELECT score FROM mk_contacts WHERE id = ?").get(c1.id).score, 120);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_events WHERE name = 'contact.score_level_changed'").get().n, 0, "recalcul : aucun déclenchement");
    assert.throws(() => scoring.saveLevels(A, [{ name: "Un", min: 5 }, { name: "Deux", min: 10 }]), /commence à 0/);
    assert.throws(() => scoring.saveLevels(A, [{ name: "Un", min: 0 }, { name: "Deux", min: 0 }]), /croissants/);
    const lv = scoring.levels(A);
    const saved = scoring.saveLevels(A, [{ id: lv[0].id, name: "Inconnu", min: 0 }, { id: lv[3].id, name: "Prioritaire", min: 100 }]);
    assert.deepEqual(saved.map((l) => [l.name, l.min_score]), [["Inconnu", 0], ["Prioritaire", 100]]);
    assert.equal(saved[1].id, lv[3].id, "un niveau gardé conserve son identifiant (filtres des automatisations)");
    assert.equal(segments.countSegment(A, { op: "and", rules: [{ field: "score", cmp: "gte", value: 100 }] }), 1);
    assert.equal(segments.countSegment(A, { op: "and", rules: [{ field: "score", cmp: "between", value: [10, 30] }] }), 1);
    assert.throws(() => segments.validateDefinition(A, { op: "and", rules: [{ field: "score", cmp: "gte", value: -1 }] }), /Score invalide/);
    assert.ok(auto.TRIGGERS["contact.score_level_changed"] && auto.TRIGGERS["email.clicked"]);
  });
});

describe("vrai serveur", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());

  test("écran : règles proposées, niveaux, recalcul ; score sur la fiche du contact ; filtre des niveaux dans les automatisations", async () => {
    let html = (await boss.get("/marketing/score")).text;
    assert.match(html, /Ajouter les règles proposées/);
    await boss.post("/marketing/score/regles/proposees", {});
    html = (await boss.get("/marketing/score")).text;
    assert.match(html, /Un contact ajoute une formation au panier/);
    const contact = db.prepare("INSERT INTO mk_contacts (organization_id, email) VALUES (1, 'fiche@ex.fr') RETURNING id").get();
    db.prepare("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, metadata, created_at) VALUES (1, 'lms.checkout_started', 'fiche@ex.fr', ?, 'test', ?, '{}', ?)").run(contact.id, Date.now(), Date.now());
    await boss.post("/marketing/score/recalculer", {});
    assert.equal(db.prepare("SELECT score FROM mk_contacts WHERE id = ?").get(contact.id).score, 40);
    const page = (await boss.get(`/marketing/contacts/${contact.id}`)).text;
    assert.match(page, /mk-stat-label">Score<\/span><span class="mk-stat-value">40<\/span><span class="mk-stat-hint">Intéressé/);
    assert.match(page, /\+40<\/strong> Un contact ouvre la page de commande/);
    const created = await boss.post("/marketing/automatisations", { name: "Chaud", kind: "marketing", trigger_event: "contact.score_level_changed" });
    const aid = Number(created.location.match(/(\d+)/)[1]);
    assert.match((await boss.get(`/marketing/automatisations/${aid}`)).text, /"scoreLevels":\[\["\d+","Froid \(à partir de 0 points\)"\]/);
  });
});
