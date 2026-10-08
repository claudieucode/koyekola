// Actions « Démarrer un autre scénario » et « Arrêter un autre scénario » : le contact entre dans le scénario ciblé (une seule
// fois, avec ses étapes figées), un scénario inactif ou lui-même ne démarre rien, deux scénarios qui se démarrent l'un l'autre
// s'arrêtent d'eux-mêmes, l'arrêt sort le contact d'un passage en cours, aucun événement n'est émis, l'activation signale une cible inactive.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, T0, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const auto = require("../src/marketing/automations");
const { createProvider } = require("../src/marketing/sending/providers");

let m, A, provider;
const DAY = 86400000;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const contact = (email) => audience.upsertContact(A, { email }).contact;
const event = (name, c) => ({ id: Math.floor(Math.random() * 1e9), organizationId: 1, name, contactId: c.id, email: c.email, metadata: {} });
const make = (name, steps, triggerEvent = "lms.user_registered") => auto.createAutomation(A, { name, kind: "marketing", triggerEvent, steps });
const live = (name, steps, triggerEvent) => { const a = make(name, steps, triggerEvent); auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true }); return a; };
const runs = (c) => m.db.prepare("SELECT r.*, a.name FROM mk_automation_runs r JOIN mk_automations a ON a.id = r.automation_id WHERE r.contact_id = ? ORDER BY r.id").all(c.id);
const runIn = (c, a) => m.db.prepare("SELECT * FROM mk_automation_runs WHERE contact_id = ? AND automation_id = ?").get(c.id, a.id);
const step = (r, now = T0) => auto.runAutomation(A, r.id, { provider, now });
const logs = (r) => m.db.prepare("SELECT action, detail FROM mk_automation_log WHERE run_id = ? ORDER BY id").all(r.id);
const tags = (c) => m.db.prepare("SELECT t.name FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.contact_id = ? ORDER BY t.name").all(c.id).map((r) => r.name);
const events = () => m.db.prepare("SELECT COUNT(*) n FROM mk_events").get().n;
const jobs = () => m.db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE type = 'automation.run'").get().n;

beforeEach(() => { m = freshMarketing(); A = m.A; provider = createProvider({ provider: "console" }, { log: quiet }); });

describe("validation", () => {
  test("scénario cible obligatoire, existant et de la même organisation", () => {
    const b = make("Cible", [{ type: "add_tag", tag: "x" }], "lms.course_enrolled");
    assert.deepEqual(make("Source", [{ type: "start_automation", automationId: b.id, junk: 1 }]).steps, [{ type: "start_automation", automationId: b.id }]);
    assert.equal(code(() => make("S2", [{ type: "start_automation" }])), "invalid_automation");
    assert.equal(code(() => make("S3", [{ type: "stop_automation", automationId: "abc" }])), "invalid_automation");
    assert.equal(code(() => make("S4", [{ type: "start_automation", automationId: 99999 }])), "not_found");
    const other = auto.createAutomation(m.B, { name: "Autre orga", kind: "marketing", triggerEvent: "lms.course_enrolled", steps: [] });
    assert.equal(code(() => make("S5", [{ type: "start_automation", automationId: other.id }])), "not_found", "le scénario d'une autre organisation n'est pas visible");
  });
});

describe("démarrer un autre scénario", () => {
  test("le contact entre dans le scénario ciblé avec ses étapes figées, continue ici, et rien n'est émis", async () => {
    const b = live("Cible", [{ type: "add_tag", tag: "b-passe" }], "lms.course_enrolled");
    const a = live("Source", [{ type: "start_automation", automationId: b.id }, { type: "add_tag", tag: "a-passe" }]);
    const c = contact("go@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    const before = { events: events(), jobs: jobs() };
    await step(runIn(c, a));
    assert.deepEqual(tags(c), ["a-passe"], "la source continue sans attendre la cible");
    const rb = runIn(c, b);
    assert.ok(rb && rb.status === "running", "passage créé dans la cible");
    assert.equal(rb.steps, auto.getAutomation(A, b.id) && m.db.prepare("SELECT active_steps FROM mk_automations WHERE id = ?").get(b.id).active_steps, "étapes figées de la cible");
    assert.equal(jobs(), before.jobs + 1, "un travail planifié pour la cible");
    assert.equal(events(), before.events, "aucun événement émis");
    await step(rb);
    assert.deepEqual(tags(c), ["a-passe", "b-passe"]);
    assert.ok(logs(runIn(c, a)).some((l) => l.action === "start_automation" && /démarré : « Cible »/.test(l.detail)));
  });

  test("rejouer l'étape ne crée pas un second passage (« déjà passé »)", async () => {
    const b = live("Cible", [{ type: "add_tag", tag: "b" }], "lms.course_enrolled");
    const a = live("Source", [{ type: "start_automation", automationId: b.id }]);
    const c = contact("rejeu@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(runIn(c, a));
    m.db.prepare("UPDATE mk_automation_runs SET step_index = 0, status = 'running', finished_at = NULL, wake_at = ? WHERE id = ?").run(T0, runIn(c, a).id);
    await step(runIn(c, a));
    assert.equal(runs(c).filter((r) => r.automation_id === b.id).length, 1);
    assert.ok(logs(runIn(c, a)).some((l) => l.action === "already_in"));
  });

  test("scénario ciblé inactif (brouillon ou en pause) ou lui-même : rien n'est démarré, l'étape est signalée", async () => {
    const draft = make("Brouillon", [{ type: "add_tag", tag: "d" }], "lms.course_enrolled");
    const a = live("Source", [{ type: "start_automation", automationId: draft.id }, { type: "add_tag", tag: "suite" }]);
    const c = contact("inactif@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(runIn(c, a));
    assert.equal(runs(c).length, 1, "aucun passage dans le brouillon");
    assert.ok(logs(runIn(c, a)).some((l) => l.action === "skipped" && /inactif/.test(l.detail)));
    assert.deepEqual(tags(c), ["suite"], "le contact continue");
    // lui-même
    const me = make("Moi", [{ type: "add_tag", tag: "x" }]);
    m.db.prepare("UPDATE mk_automations SET steps = ? WHERE id = ?").run(JSON.stringify([{ type: "start_automation", automationId: me.id }]), me.id);
    auto.activateAutomation(A, me.id, { workerOn: true, smtpAvailable: true });
    const d = contact("moi@ex.fr");
    auto.onEvent(A, event("lms.user_registered", d));
    await step(runIn(d, me));
    assert.ok(logs(runIn(d, me)).some((l) => /ne se démarre pas lui-même/.test(l.detail)));
    assert.equal(runs(d).filter((r) => r.automation_id === me.id).length, 1);
  });

  test("deux scénarios qui se démarrent l'un l'autre s'arrêtent d'eux-mêmes (un seul passage chacun)", async () => {
    const a = make("Alpha", [{ type: "add_tag", tag: "alpha" }]);
    const b = make("Beta", [{ type: "start_automation", automationId: a.id }, { type: "add_tag", tag: "beta" }], "lms.course_enrolled");
    m.db.prepare("UPDATE mk_automations SET steps = ? WHERE id = ?").run(JSON.stringify([{ type: "start_automation", automationId: b.id }, { type: "add_tag", tag: "alpha" }]), a.id);
    auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    auto.activateAutomation(A, b.id, { workerOn: true, smtpAvailable: true });
    const c = contact("boucle@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    for (let i = 0; i < 6; i++) for (const r of runs(c)) if (r.status === "running") await step(r);
    assert.equal(runs(c).length, 2, "un passage dans chaque scénario, pas plus");
    assert.deepEqual(tags(c), ["alpha", "beta"]);
    assert.ok(runs(c).every((r) => r.status === "completed"));
  });

  test("l'activation signale une cible inactive (avertissement) sans bloquer", () => {
    const b = make("Cible", [{ type: "add_tag", tag: "b" }], "lms.course_enrolled");
    const a = make("Source", [{ type: "start_automation", automationId: b.id }]);
    const check = auto.automationPreflight(A, a.id, { workerOn: true, smtpAvailable: true });
    assert.ok(check.warnings.some((w) => w.code === "target_inactive" && /Cible/.test(w.message)));
    assert.deepEqual(check.errors, []);
  });
});

describe("arrêter un autre scénario", () => {
  test("sort le contact d'un passage en cours (journalisé des deux côtés) ; sinon rien ne se passe", async () => {
    const b = live("Cible", [{ type: "wait", amount: 1, unit: "days" }, { type: "add_tag", tag: "ne-doit-pas-arriver" }], "lms.course_enrolled");
    const a = live("Source", [{ type: "stop_automation", automationId: b.id }, { type: "add_tag", tag: "a" }]);
    const c = contact("stop@ex.fr"), d = contact("rien@ex.fr");
    auto.onEvent(A, event("lms.course_enrolled", c));
    await step(runIn(c, b)); // en attente d'un jour
    assert.equal(runIn(c, b).status, "running");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(runIn(c, a));
    assert.equal(runIn(c, b).status, "exited");
    assert.equal(runIn(c, b).last_error, "stopped_by_automation");
    assert.ok(logs(runIn(c, b)).some((l) => l.action === "exited" && /arrêté par le scénario « Source »/.test(l.detail)));
    assert.ok(logs(runIn(c, a)).some((l) => l.action === "stop_automation"));
    // plus rien ne s'exécute dans la cible (le passage n'est plus « en cours »)
    assert.deepEqual((await step(runIn(c, b), T0 + 2 * DAY)), { done: true });
    assert.ok(!tags(c).includes("ne-doit-pas-arriver"));
    // contact qui n'est pas dans la cible
    auto.onEvent(A, event("lms.user_registered", d));
    await step(runIn(d, a));
    assert.ok(logs(runIn(d, a)).some((l) => l.action === "skipped" && /pas en cours/.test(l.detail)));
    assert.deepEqual(tags(d), ["a"], "le contact continue");
  });
});
