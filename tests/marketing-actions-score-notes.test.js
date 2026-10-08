// Actions de scénario « Modifier le score » et « Ajouter une note » : validation, exécution, une seule fois par étape,
// score conservé par un recalcul des règles, aucun événement émis (anti-boucle), notes visibles dans la chronologie.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, T0, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const auto = require("../src/marketing/automations");
const scoring = require("../src/marketing/scoring");
const notes = require("../src/marketing/audience/notes");
const timeline = require("../src/marketing/audience/timeline");
const { createProvider } = require("../src/marketing/sending/providers");

let m, A, provider;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const contact = (email) => audience.upsertContact(A, { email }).contact;
const event = (name, c) => ({ id: Math.floor(Math.random() * 1e9), organizationId: 1, name, contactId: c.id, email: c.email, metadata: {} });
const runOf = (c) => m.db.prepare("SELECT * FROM mk_automation_runs WHERE contact_id = ?").get(c.id);
const logs = (run) => m.db.prepare("SELECT step_index, action, detail FROM mk_automation_log WHERE run_id = ? ORDER BY id").all(run.id);
const step = (c) => auto.runAutomation(A, runOf(c).id, { provider, now: T0 });
const make = (steps, name = `S${Math.random()}`) => auto.createAutomation(A, { name, kind: "marketing", triggerEvent: "lms.user_registered", steps });
const live = (steps) => { const a = make(steps); auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true }); return a; };
const scoreOf = (c) => m.db.prepare("SELECT score FROM mk_contacts WHERE id = ?").get(c.id).score;
const events = () => m.db.prepare("SELECT COUNT(*) n FROM mk_events").get().n;
// Rejoue le passage depuis le début (simule une reprise après incident : le moteur ré-exécute les étapes)
const replay = async (c) => { m.db.prepare("UPDATE mk_automation_runs SET step_index = 0, status = 'running', finished_at = NULL, wake_at = ? WHERE contact_id = ?").run(T0, c.id); await step(c); };

beforeEach(() => { m = freshMarketing(); A = m.A; provider = createProvider({ provider: "console" }, { log: quiet }); });

describe("validation", () => {
  test("score : modes et points contrôlés ; forme normalisée sans champ superflu", () => {
    const a = make([{ type: "adjust_score", mode: "add", points: 10, junk: 1 }, { type: "adjust_score", mode: "set", points: 0 }]);
    assert.deepEqual(a.steps, [{ type: "adjust_score", mode: "add", points: 10 }, { type: "adjust_score", mode: "set", points: 0 }]);
    const bad = (s) => code(() => make([s]));
    assert.equal(bad({ type: "adjust_score", mode: "multiplier", points: 2 }), "invalid_automation");
    assert.equal(bad({ type: "adjust_score", mode: "add", points: 0 }), "invalid_automation", "ajouter 0 point n'a aucun sens");
    assert.equal(bad({ type: "adjust_score", mode: "subtract", points: -5 }), "invalid_automation");
    assert.equal(bad({ type: "adjust_score", mode: "add", points: 1.5 }), "invalid_automation");
    assert.equal(bad({ type: "adjust_score", mode: "add", points: 100001 }), "invalid_automation");
    assert.equal(bad({ type: "adjust_score", mode: "add", points: "10" }), "invalid_automation");
  });
  test("note : texte obligatoire et borné", () => {
    assert.deepEqual(make([{ type: "add_note", body: "  Hésitant  " }]).steps, [{ type: "add_note", body: "Hésitant" }]);
    assert.equal(code(() => make([{ type: "add_note", body: "   " }])), "invalid_automation");
    assert.equal(code(() => make([{ type: "add_note", body: "x".repeat(2001) }])), "invalid_automation");
    assert.equal(code(() => make([{ type: "add_note" }])), "invalid_automation");
  });
});

describe("modifier le score", () => {
  test("ajouter, retirer (jamais sous 0) et définir : le score change et chaque étape est journalisée", async () => {
    live([{ type: "adjust_score", mode: "add", points: 30 }, { type: "adjust_score", mode: "subtract", points: 10 }, { type: "adjust_score", mode: "subtract", points: 500 }, { type: "adjust_score", mode: "set", points: 42 }]);
    const c = contact("score@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    assert.equal(scoreOf(c), 42);
    assert.deepEqual(logs(runOf(c)).filter((l) => l.action === "adjust_score").map((l) => l.detail.replace(/ \(score .*\)/, "")), ["ajouter 30 → +30", "retirer 10 → -10", "retirer 500 → -20", "définir 42 → +42"]);
    const rows = m.db.prepare("SELECT points, source, event, rule_id FROM mk_score_log WHERE contact_id = ? ORDER BY id").all(c.id);
    assert.deepEqual(rows.map((r) => r.points), [30, -10, -20, 42], "la différence RÉELLEMENT appliquée est journalisée (le plancher à 0 compte)");
    assert.ok(rows.every((r) => r.source === "automation" && r.event === "automation.score" && r.rule_id === null));
    assert.equal(scoring.contactScore(A, c.id).history[0].label, "Scénario d'automatisation");
  });

  test("reprise : rejouer le passage ne change plus le score (une seule fois par étape)", async () => {
    live([{ type: "adjust_score", mode: "add", points: 25 }]);
    const c = contact("reprise@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    await replay(c); await replay(c);
    assert.equal(scoreOf(c), 25);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_score_log WHERE contact_id = ?").get(c.id).n, 1);
    assert.ok(logs(runOf(c)).some((l) => l.action === "already_done"));
  });

  test("deux scénarios ou deux contacts ne se marchent pas dessus", async () => {
    live([{ type: "adjust_score", mode: "add", points: 5 }]);
    live([{ type: "adjust_score", mode: "add", points: 7 }]);
    const c = contact("a@ex.fr"), d = contact("b@ex.fr");
    for (const x of [c, d]) auto.onEvent(A, event("lms.user_registered", x));
    for (const run of m.db.prepare("SELECT id FROM mk_automation_runs").all()) await auto.runAutomation(A, run.id, { provider, now: T0 });
    assert.equal(scoreOf(c), 12); assert.equal(scoreOf(d), 12);
  });

  test("un recalcul des règles conserve les ajustements des scénarios", async () => {
    scoring.createRule(A, { event: "lms.user_registered", points: 5 });
    live([{ type: "adjust_score", mode: "add", points: 40 }]);
    const c = contact("recalcul@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    assert.equal(scoreOf(c), 40);
    scoring.recompute(A);
    assert.equal(scoreOf(c), 40, "ajustement conservé");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_score_log WHERE contact_id = ? AND source = 'automation'").get(c.id).n, 1);
    scoring.recompute(A);
    assert.equal(scoreOf(c), 40, "recalcul répété : stable");
  });

  test("aucun événement n'est émis (pas de changement de niveau en chaîne)", async () => {
    live([{ type: "adjust_score", mode: "add", points: 500 }]);
    const c = contact("niveau@ex.fr");
    const before = events();
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    assert.equal(events(), before);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_events WHERE name = 'contact.score_level_changed'").get().n, 0);
  });
});

describe("ajouter une note", () => {
  test("la note est écrite sur le contact, tracée, visible dans sa chronologie, une seule fois même si l'étape est rejouée", async () => {
    const a = live([{ type: "add_note", body: "Intéressé par la formation avancée" }]);
    const c = contact("note@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    await replay(c);
    const list = notes.listNotes(A, c.id);
    assert.equal(list.length, 1);
    assert.equal(list[0].body, "Intéressé par la formation avancée");
    assert.equal(list[0].source, "automation");
    assert.equal(list[0].automation_id, a.id);
    const item = timeline.contactTimeline(A, c.id).find((t) => t.type === "note");
    assert.ok(item, "note dans la chronologie");
    assert.match(item.text, /Note \(scénario « .+ »\) : Intéressé par la formation avancée/);
    assert.equal(item.href, `/marketing/automatisations/${a.id}`);
    assert.deepEqual(logs(runOf(c)).filter((l) => l.action === "add_note").map((l) => l.detail), ["note ajoutée"], "tracée dans le journal du passage (les actions d'un scénario n'écrivent pas d'audit)");
    assert.ok(logs(runOf(c)).some((l) => l.action === "already_done"), "reprise : signalée, rien d'ajouté");
  });

  test("les notes ne passent pas d'une organisation à l'autre ; le texte est nettoyé", () => {
    const c = contact("iso@ex.fr");
    assert.equal(notes.addNote(A, c.id, { body: "  a\u0000b  " }).created, true);
    assert.equal(notes.listNotes(A, c.id)[0].body, "ab");
    assert.equal(code(() => notes.addNote(m.B, c.id, { body: "x" })), "not_found", "contact d'une autre organisation");
    assert.deepEqual(notes.listNotes(m.B, c.id), []);
  });

  test("supprimer le contact supprime ses notes", () => {
    const c = contact("rgpd@ex.fr");
    notes.addNote(A, c.id, { body: "à effacer" });
    m.db.exec("PRAGMA foreign_keys = ON");
    m.db.prepare("DELETE FROM mk_contacts WHERE id = ?").run(c.id);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_contact_notes").get().n, 0);
  });
});
