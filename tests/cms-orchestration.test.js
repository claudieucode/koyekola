// KOLAKISA CMS — palier 19 : orchestration Tunnel ↔ Contact Core ↔ Automation ↔ Email. Vraie base (vraies migrations), vrai bus, vrais gestionnaires.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, addLmsSchema, quiet, T0, TEST_KEY } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const tracking = require("../src/marketing/sending/tracking");
const bridge = require("../src/marketing/bridge/events");
const auto = require("../src/marketing/automations");
const core = require("../src/marketing/contactcore");
const events = require("../src/marketing/funnels/events");
const abandon = require("../src/marketing/funnels/abandon");

let m, A, db;
const HOUR = 3600000;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const count = (sql, ...a) => one(sql, ...a).n;
async function pump() { for (const e of db.prepare("SELECT id FROM mk_events WHERE processed_at IS NULL ORDER BY id").all()) await m.bus.dispatch(e.id); }
function funnel(name, site = null, n = 3) {
  const f = db.prepare("INSERT INTO mk_funnels (organization_id, name, site_id) VALUES (1, ?, ?)").run(name, site);
  for (let i = 1; i <= n; i++) db.prepare("INSERT INTO mk_funnel_steps (organization_id, funnel_id, position, type, name) VALUES (1, ?, ?, 'landing', ?)").run(f.lastInsertRowid, i, `Étape ${i}`);
  const steps = db.prepare("SELECT s.id, s.name, s.position, s.type, f.id AS funnel_id, f.name AS funnel_name, f.site_id, 1 AS first_position, ? AS last_position FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id WHERE f.id = ? ORDER BY s.position").all(n, f.lastInsertRowid);
  return { id: Number(f.lastInsertRowid), steps };
}
const contact = (email = "a@x.fr") => core.identify(A, { email, source: "form" }).contact;
const live = (over) => { const a = auto.createAutomation(A, { name: "Parcours", kind: "marketing", triggerEvent: "funnel.entered", steps: [{ type: "add_tag", tag: "entre" }], ...over }); auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true }); return a; };

beforeEach(() => { m = freshMarketing(); A = m.A; db = m.db; m.bus.on("*", auto.eventHandler({ db, settings: A.settings, log: quiet })); db.exec("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'Alpha'), (1, 'Bravo')"); });

describe("événements du tunnel", () => {
  test("entrée + étape atteinte + étape précédente terminée, structure standard, idempotents", () => {
    const f = funnel("T1"), c = contact();
    events.emitJourney(A, c, [f.steps[0]], { sessionId: "s1", at: T0 });
    events.emitJourney(A, c, [f.steps[1]], { sessionId: "s1", at: T0 + 1000 });
    events.emitJourney(A, c, [f.steps[1]], { sessionId: "s1", at: T0 + 2000 }); // même visite : aucun doublon
    assert.equal(count("SELECT COUNT(*) n FROM mk_events WHERE name = 'funnel.entered'"), 1);
    assert.equal(count("SELECT COUNT(*) n FROM mk_events WHERE name = 'funnel.step_reached'"), 2);
    assert.equal(count("SELECT COUNT(*) n FROM mk_events WHERE name = 'funnel.step.completed'"), 1);
    const e = one("SELECT * FROM mk_events WHERE name = 'funnel.entered'");
    const md = JSON.parse(e.metadata);
    assert.equal(md.funnelId, String(f.id)); assert.equal(md.stepName, "Étape 1"); assert.equal(e.object_type, "funnel"); assert.equal(e.contact_id, c.id);
  });
  test("sauter une étape n'est pas la terminer", () => {
    const f = funnel("T2"), c = contact();
    events.emitJourney(A, c, [f.steps[2]], { sessionId: "s1" });
    assert.equal(count("SELECT COUNT(*) n FROM mk_events WHERE name = 'funnel.step.completed'"), 0);
    assert.equal(count("SELECT COUNT(*) n FROM mk_events WHERE name = 'funnel.completed'"), 1);
  });
  test("double clic rapide sur un bouton : un seul événement", () => {
    const f = funnel("T3"), c = contact();
    for (let i = 0; i < 5; i++) events.emitCta(A, c, [f.steps[0]], { label: "Je m'inscris", index: 0, destination: "next_step", now: T0 + i * 100 });
    assert.equal(count("SELECT COUNT(*) n FROM mk_events WHERE name = 'funnel.cta.clicked'"), 1);
  });
  test("formulaire envoyé : étape terminée côté serveur", () => {
    const f = funnel("T4"), c = contact();
    events.emitFormCompletion(A, c, [f.steps[0]]); events.emitFormCompletion(A, c, [f.steps[0]]);
    assert.equal(count("SELECT COUNT(*) n FROM mk_events WHERE name = 'funnel.step.completed'"), 1);
  });
  test("attribution : classification et provenance de la première visite", () => {
    assert.equal(events.classify({ utm_medium: "cpc" }).source, "paid");
    assert.equal(events.classify({ utm_medium: "email" }).source, "email");
    assert.equal(events.classify({ referrer: "www.google.com" }).source, "organic");
    assert.equal(events.classify({ referrer: "facebook.com" }).source, "social");
    assert.equal(events.classify({}).source, "direct");
    assert.equal(events.classify({ utm_source: "news" }).source, "campaign");
  });
});

describe("abandon (délai réel, jamais immédiat)", () => {
  test("pas d'abandon avant le délai, un seul après, aucun si terminé", () => {
    const f = funnel("A1"), c = contact(), done = contact("b@x.fr");
    events.emitJourney(A, c, [f.steps[0]], { sessionId: "s1", at: T0 });
    events.emitJourney(A, done, [f.steps[2]], { sessionId: "s2", at: T0 });
    assert.deepEqual(abandon.sweep(A, { now: T0 + 2 * HOUR, funnelHours: 24 }), { funnels: 0, checkouts: 0, carts: 0 });
    assert.equal(abandon.sweep(A, { now: T0 + 25 * HOUR, funnelHours: 24 }).funnels, 1);
    assert.equal(abandon.sweep(A, { now: T0 + 30 * HOUR, funnelHours: 24 }).funnels, 0);
    const e = one("SELECT * FROM mk_events WHERE name = 'funnel.abandoned'");
    assert.equal(e.contact_id, c.id);
  });
  test("le retour du contact repousse l'abandon", () => {
    const f = funnel("A2"), c = contact();
    events.emitJourney(A, c, [f.steps[0]], { sessionId: "s1", at: T0 });
    events.emitJourney(A, c, [f.steps[1]], { sessionId: "s2", at: T0 + 20 * HOUR });
    assert.equal(abandon.sweep(A, { now: T0 + 25 * HOUR, funnelHours: 24 }).funnels, 0);
  });
});

describe("scénarios Tunnel → Automation", () => {
  test("1. entrée dans le tunnel → étiquette ; double événement = un seul passage", async () => {
    const f = funnel("S1"), c = contact(); live();
    events.emitJourney(A, c, [f.steps[0]], { sessionId: "s1" });
    events.emitJourney(A, c, [f.steps[0]], { sessionId: "s9" });
    await pump();
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_runs WHERE contact_id = ?", c.id), 1);
  });
  test("multi-site : un scénario du site A n'agit pas sur le tunnel du site B", async () => {
    const sites = db.prepare("SELECT id FROM mk_sites ORDER BY id").all();
    const f = funnel("S2", sites[1].id), c = contact(); live({ siteId: sites[0].id });
    events.emitJourney(A, c, [f.steps[0]], { sessionId: "s1" });
    await pump();
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_runs"), 0);
  });
  test("objectif atteint : le passage en cours se termine et plus rien ne part", async () => {
    const f = funnel("S3"), c = contact();
    const a = live({ steps: [{ type: "wait", amount: 2, unit: "days" }, { type: "add_tag", tag: "relance" }] });
    auto.setGoalEvent(A, a.id, "purchase.completed");
    events.emitJourney(A, c, [f.steps[0]], { sessionId: "s1" });
    await pump();
    const run = one("SELECT * FROM mk_automation_runs WHERE contact_id = ?", c.id);
    assert.equal(run.status, "running");
    core.recordEvent(A, { contactId: c.id, type: "purchase.completed", source: "commerce" });
    await pump();
    assert.equal(one("SELECT status FROM mk_automation_runs WHERE id = ?", run.id).status, "completed");
    assert.ok(one("SELECT 1 FROM mk_automation_log WHERE run_id = ? AND action = 'goal'", run.id));
  });
  test("objectif invalide refusé", () => {
    const a = live();
    assert.throws(() => auto.setGoalEvent(A, a.id, "Mauvais NOM!"), /invalide/);
    assert.equal(auto.setGoalEvent(A, a.id, "").goal_event, "");
  });
  test("scénario 4. commande abandonnée → déclencheur checkout.abandoned", async () => {
    const c = contact(); live({ triggerEvent: "checkout.abandoned" });
    core.recordEvent(A, { contactId: c.id, type: "lms.checkout_started", source: "lms", occurredAt: T0 });
    assert.equal(abandon.sweep(A, { now: T0 + 30 * 60000, checkoutHours: 1 }).checkouts, 0);
    assert.equal(abandon.sweep(A, { now: T0 + 2 * HOUR, checkoutHours: 1 }).checkouts, 1);
    await pump();
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_runs WHERE contact_id = ?", c.id), 1);
  });
});

// ---------- Chaîne complète avec e-mails réels (fournisseur de capture) ----------
describe("chaînes complètes Tunnel → Automation → Email", () => {
  let tplM, sent, provider, handlers, list;
  const PROOF = { source: "form", textShown: "Oui, je veux recevoir les e-mails", ip: "" };
  const runOf = (c, id) => one("SELECT * FROM mk_automation_runs WHERE contact_id = ?" + (id ? " AND automation_id = ?" : ""), ...(id ? [c.id, id] : [c.id]));
  beforeEach(() => {
    templates.setOrgAddress(A, "12 rue des Écoles, Paris");
    tplM = templates.createTemplate(A, { name: "Suite", kind: "marketing", subject: "Bienvenue dans {{event.funnel_name}}", blocks: [{ type: "text", markdown: "Étape : {{event.funnel_step}}" }] });
    list = audience.createList(A, { name: "Newsletter" });
    sent = [];
    provider = { name: "capture", capabilities: {}, async send(msg) { sent.push(msg); return { providerMessageId: `ok-${sent.length}` }; } };
    handlers = auto.jobHandlers({ db, bus: m.bus, settings: A.settings, providerFor: () => provider, now: () => T0, env: { SITE_URL: "https://k.test", ENCRYPTION_KEY: TEST_KEY }, log: quiet });
  });

  test("2. formulaire → consentement → audience → e-mail de bienvenue avec {{event.funnel_name}} ; l'e-mail porte tunnel + étape + scénario", async () => {
    const f = funnel("Lancement");
    const a = live({ name: "Bienvenue tunnel", triggerEvent: "funnel.step.completed", steps: [{ type: "add_to_list", listId: list.id }, { type: "email", templateId: tplM.id }] });
    const c = contact("lead@x.fr");
    compliance.recordConsent(A, c.id, PROOF);
    events.emitFormCompletion(A, c, [f.steps[0]]);
    await pump();
    const run = runOf(c, a.id);
    assert.ok(run);
    await handlers["automation.run"]({ organizationId: 1, runId: run.id });
    assert.equal(sent.length, 1);
    assert.match(sent[0].subject || "", /Lancement/);
    assert.match(sent[0].html, /Étape 1/);
    // l'ouverture de cet e-mail porte le contexte d'orchestration
    const msg = one("SELECT * FROM mk_messages WHERE contact_id = ?", c.id);
    tracking.recordOpen(A, { messageId: msg.id, userAgent: "Mozilla/5.0" });
    const ev = one("SELECT metadata FROM mk_events WHERE name = 'email.opened'");
    const md = JSON.parse(ev.metadata);
    assert.equal(md.automationId, a.id); assert.equal(md.funnelId, String(f.id)); assert.ok(md.funnelStepId);
  });

  test("consentement : sans accord prouvé, l'e-mail marketing du tunnel NE PART PAS (cas B), et un accord retiré bloque aussi (cas C)", async () => {
    const f = funnel("Sans accord");
    const a = live({ steps: [{ type: "email", templateId: tplM.id }] });
    const sans = contact("sans@x.fr");
    events.emitJourney(A, sans, [f.steps[0]], { sessionId: "s1" });
    await pump();
    await handlers["automation.run"]({ organizationId: 1, runId: runOf(sans, a.id).id });
    assert.equal(sent.length, 0, "aucun e-mail marketing sans consentement");
    // cas A : avec accord, il part
    const avec = contact("avec@x.fr"); compliance.recordConsent(A, avec.id, PROOF);
    events.emitJourney(A, avec, [f.steps[0]], { sessionId: "s2" });
    await pump();
    await handlers["automation.run"]({ organizationId: 1, runId: runOf(avec, a.id).id });
    assert.equal(sent.length, 1);
    // cas C : désinscrit → plus rien (scénario 6)
    const out = contact("out@x.fr"); compliance.recordConsent(A, out.id, PROOF); compliance.unsubscribe(A, out.id, { source: "link" });
    events.emitJourney(A, out, [f.steps[0]], { sessionId: "s3" });
    await pump();
    await handlers["automation.run"]({ organizationId: 1, runId: runOf(out, a.id).id });
    assert.equal(sent.length, 1, "un désinscrit ne reçoit rien");
  });

  test("5. achat réel → purchase.completed (source boutique) → étiquette client ; achat rattaché au dernier tunnel", async () => {
    addLmsSchema(db);
    const f = funnel("Vente");
    const u = Number(db.prepare("INSERT INTO users (username, email) VALUES ('acheteur', 'buyer@x.fr')").run().lastInsertRowid);
    const c = core.identify(A, { email: "buyer@x.fr", source: "form" }).contact;
    const a = live({ triggerEvent: "purchase.completed", steps: [{ type: "add_tag", tag: "client" }] });
    bridge.syncLmsEvents(A, { limit: 100 }); // initialisation : l'historique ne déclenche rien
    events.emitJourney(A, c, [f.steps[1]], { sessionId: "s1", at: Date.now() - 3600000 });
    const course = Number(db.prepare("INSERT INTO courses (title, slug) VALUES ('FCP', 'fcp')").run().lastInsertRowid);
    const o = Number(db.prepare("INSERT INTO orders (user_id, total_cents) VALUES (?, 4900)").run(u).lastInsertRowid);
    db.prepare("INSERT INTO order_items (order_id, course_id, price_cents) VALUES (?, ?, 4900)").run(o, course);
    bridge.syncLmsEvents(A, { limit: 100 }); bridge.syncLmsEvents(A, { limit: 100 });
    assert.equal(count("SELECT COUNT(*) n FROM mk_events WHERE name = 'purchase.completed'"), 1, "une seule fois même relu");
    const md = JSON.parse(one("SELECT metadata FROM mk_events WHERE name = 'purchase.completed'").metadata);
    assert.equal(md.totalCents, 4900); assert.equal(md.funnelId, String(f.id)); assert.equal(md.attribution, "last_funnel_step_30d");
    await pump();
    assert.ok(runOf(c, a.id));
  });

  test("contactJourney lit le parcours réel (étapes, état, provenance)", () => {
    const f = funnel("Parcours"), c = contact("p@x.fr");
    events.emitJourney(A, c, [f.steps[0]], { sessionId: "s1", at: T0 });
    events.emitJourney(A, c, [f.steps[1]], { sessionId: "s1", at: T0 + 1000 });
    const [j] = events.contactJourney(A, c.id);
    assert.equal(j.name, "Parcours"); assert.deepEqual(j.reached, ["Étape 1", "Étape 2"]); assert.equal(j.state, "in_progress");
    assert.deepEqual(events.contactJourney(A, c.id, { siteId: 999 }), []);
  });
});

describe("diagnostic et simulation", () => {
  test("traceEvent : scénarios à l'écoute, passages, aucun secret ; previewEvent n'écrit rien", async () => {
    const f = funnel("Trace"), c = contact("t@x.fr"); const a = live();
    events.emitJourney(A, c, [f.steps[0]], { sessionId: "s1" });
    const id = one("SELECT id FROM mk_events WHERE name = 'funnel.entered'").id;
    const before = count("SELECT COUNT(*) n FROM mk_automation_runs");
    const p = auto.previewEvent(A, id);
    assert.equal(p.matches[0].verdict, "démarrerait"); assert.equal(p.matches[0].automationId, a.id);
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_runs"), before);
    await pump();
    const t = auto.traceEvent(A, id);
    assert.equal(t.runs.length, 1); assert.equal(t.matches[0].verdict, "déjà passé");
    assert.doesNotMatch(JSON.stringify(t), /t@x\.fr/);
    assert.throws(() => auto.traceEvent(m.B, id), /introuvable/);
  });
});
