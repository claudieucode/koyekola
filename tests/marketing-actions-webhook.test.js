// Action de scénario « Envoyer vers un webhook » : validation, envoi PLANIFIÉ dans la file (requête POST signée, variables rendues,
// jamais bloquant), une seule fois par étape, webhook en pause / supprimé / sans clé de chiffrement, blocage des adresses privées,
// disponibilité (« connexion requise » sans webhook actif), brouillon.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY, T0, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const auto = require("../src/marketing/automations");
const registry = require("../src/marketing/automations/actions");
const graph = require("../src/marketing/automations/graph");
const endpoints = require("../src/marketing/webhooks/endpoints");
const delivery = require("../src/marketing/webhooks/delivery");
const { createProvider } = require("../src/marketing/sending/providers");

let m, A, provider, hook;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const contact = (email, fields = {}) => audience.upsertContact(A, { email, ...fields }).contact;
const make = (steps) => auto.createAutomation(A, { name: `Scénario ${Math.random()}`, kind: "marketing", triggerEvent: "lms.course_enrolled", steps });
const jobs = () => m.db.prepare("SELECT * FROM mk_jobs WHERE type = 'webhook.deliver' ORDER BY id").all();
const events = () => m.db.prepare("SELECT COUNT(*) n FROM mk_events").get().n;
const event = (c, metadata = {}) => ({ id: Math.floor(Math.random() * 1e9), organizationId: 1, name: "lms.course_enrolled", contactId: c.id, email: c.email, metadata });
const runOf = (c) => m.db.prepare("SELECT * FROM mk_automation_runs WHERE contact_id = ?").get(c.id);
const logs = (run) => m.db.prepare("SELECT action, detail FROM mk_automation_log WHERE run_id = ? ORDER BY id").all(run.id);
const step = (c) => auto.runAutomation(A, runOf(c).id, { provider, now: T0 });
const FIELDS = [{ key: "email_client", value: "{{email}}" }, { key: "prenom", value: "Bonjour {{ prenom }}" }, { key: "formation", value: "{{event.course_title}}" }, { key: "fixe", value: "valeur" }];

beforeEach(() => {
  m = freshMarketing(); A = m.A; provider = createProvider({ provider: "console" }, { log: quiet });
  hook = endpoints.createEndpoint(A, { name: "CRM", url: "https://crm.exemple.com/hook", events: ["lms.order_completed"], encryptionKey: TEST_KEY });
});

describe("validation", () => {
  test("webhook existant de la même organisation ; champs normalisés (nom, doublon, variables, longueur, nombre)", () => {
    assert.deepEqual(make([{ type: "webhook_call", endpointId: hook.id, fields: [{ key: " ville ", value: "  Paris " }], junk: 1 }]).steps, [{ type: "webhook_call", endpointId: hook.id, fields: [{ key: "ville", value: "Paris" }] }]);
    assert.deepEqual(make([{ type: "webhook_call", endpointId: hook.id }]).steps[0].fields, [], "sans champ : le contexte seul est envoyé");
    const bad = (over) => code(() => make([{ type: "webhook_call", endpointId: hook.id, fields: [], ...over }]));
    assert.equal(bad({ endpointId: undefined }), "invalid_automation");
    assert.equal(bad({ endpointId: 99999 }), "not_found");
    const other = endpoints.createEndpoint(m.B, { name: "Autre", url: "https://autre.exemple.com/h", events: ["*"], encryptionKey: TEST_KEY });
    assert.equal(bad({ endpointId: other.id }), "not_found", "le webhook d'une autre organisation n'est pas visible");
    assert.equal(bad({ fields: [{ key: "1abc", value: "x" }] }), "invalid_automation");
    assert.equal(bad({ fields: [{ key: "a b", value: "x" }] }), "invalid_automation");
    assert.equal(bad({ fields: [{ key: "a", value: "1" }, { key: "A", value: "2" }] }), "invalid_automation", "doublon (casse ignorée)");
    assert.equal(bad({ fields: [{ key: "a", value: "{{secret}}" }] }), "invalid_automation", "variable inconnue");
    assert.equal(bad({ fields: [{ key: "a", value: "x".repeat(301) }] }), "invalid_automation");
    assert.equal(bad({ fields: Array.from({ length: 21 }, (_, i) => ({ key: `k${i}`, value: "x" })) }), "invalid_automation");
    assert.equal(bad({ fields: "texte" }), "invalid_automation");
  });
});

describe("envoi", () => {
  async function runStep(c, metadata = { title: "Photoshop avancé" }, steps = [{ type: "webhook_call", endpointId: hook.id, fields: FIELDS }, { type: "add_tag", tag: "suite" }]) {
    const a = make(steps);
    auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    auto.onEvent(A, event(c, metadata));
    await step(c);
    return a;
  }
  const deliverAll = async (fetchImpl) => {
    const handler = delivery.jobHandlers({ db: m.db, env: { ENCRYPTION_KEY: TEST_KEY }, lookup: async () => [{ address: "93.184.216.34", family: 4 }], fetchImpl })["webhook.deliver"];
    for (const j of jobs()) await handler(JSON.parse(j.payload));
  };

  test("la requête planifiée est un POST signé avec le contexte et les champs rendus ; le scénario continue sans attendre", async () => {
    const c = contact("awa@ex.fr", { first_name: "Awa", last_name: "Diallo" });
    const before = events();
    const a = await runStep(c);
    assert.equal(events(), before, "aucun événement émis");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.contact_id = ?").get(c.id).n, 1, "l'étape suivante a été exécutée : le scénario n'attend pas la réponse");
    assert.equal(jobs().length, 1);
    const calls = [];
    await deliverAll(async (url, init) => { calls.push({ url, init }); return { status: 200 }; });
    assert.equal(calls.length, 1);
    const { url, init } = calls[0];
    assert.equal(url, "https://crm.exemple.com/hook");
    assert.equal(init.method, "POST");
    assert.equal(init.headers["X-KOYEKOLA-Event"], "automation.webhook");
    const body = JSON.parse(init.body);
    assert.equal(body.event, "automation.webhook");
    assert.deepEqual(body.data.contact, { id: c.id, email: "awa@ex.fr", first_name: "Awa", last_name: "Diallo" });
    assert.deepEqual(body.data.automation, { id: a.id, name: a.name });
    assert.equal(body.data.step, 1);
    assert.deepEqual(body.data.fields, { email_client: "awa@ex.fr", prenom: "Bonjour Awa", formation: "Photoshop avancé", fixe: "valeur" });
    // Signature HMAC-SHA256 horodatée, vérifiable avec le secret du webhook
    const [t, v1] = init.headers["X-KOYEKOLA-Signature"].split(",").map((x) => x.split("=")[1]);
    assert.equal(v1, delivery.signPayload(init.body, hook.secret, t));
    assert.ok(logs(runOf(c)).some((l) => l.action === "webhook_call" && /envoi planifié vers « CRM »/.test(l.detail)));
  });

  test("rejouer l'étape ne planifie pas un second envoi", async () => {
    const c = contact("rejeu@ex.fr");
    await runStep(c);
    m.db.prepare("UPDATE mk_automation_runs SET step_index = 0, status = 'running', finished_at = NULL, wake_at = ? WHERE contact_id = ?").run(T0, c.id);
    await step(c);
    assert.equal(jobs().length, 1);
    assert.ok(logs(runOf(c)).some((l) => l.action === "already_done"));
  });

  test("variable sans valeur : chaîne vide, jamais « undefined » ni le texte de la variable", async () => {
    const c = contact("vide@ex.fr");
    await runStep(c, {}, [{ type: "webhook_call", endpointId: hook.id, fields: [{ key: "prenom", value: "[{{prenom}}]" }, { key: "formation", value: "[{{event.course_title}}]" }] }]);
    const body = JSON.parse(jobs()[0].payload).metadata;
    assert.deepEqual(body.fields, { prenom: "[]", formation: "[]" });
  });

  test("webhook en pause : rien n'est envoyé (signalé) ; supprimé : signalé ; sans clé de chiffrement : rien n'est envoyé", async () => {
    const c = contact("pause@ex.fr");
    endpoints.setEnabled(A, hook.id, false);
    await runStep(c);
    assert.equal(jobs().length, 0);
    assert.ok(logs(runOf(c)).some((l) => l.action === "skipped" && /en pause/.test(l.detail)));
    const d = contact("suppr@ex.fr");
    endpoints.setEnabled(A, hook.id, true);
    const a = make([{ type: "webhook_call", endpointId: hook.id, fields: [] }, { type: "add_tag", tag: "x" }]);
    auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    m.db.prepare("DELETE FROM mk_webhook_endpoints WHERE id = ?").run(hook.id);
    auto.onEvent(A, event(d));
    await step(d);
    assert.ok(logs(runOf(d)).some((l) => l.action === "failed" && /introuvable/.test(l.detail)));
    assert.equal(jobs().length, 0);
    const e = contact("cle@ex.fr");
    const hook2 = endpoints.createEndpoint(A, { name: "Autre", url: "https://autre.exemple.com/h", events: ["*"], encryptionKey: TEST_KEY });
    const b = make([{ type: "webhook_call", endpointId: hook2.id, fields: [] }]);
    auto.activateAutomation(A, b.id, { workerOn: true, smtpAvailable: true });
    auto.onEvent({ ...A, tokenKey: undefined }, event(e));
    await auto.runAutomation({ ...A, tokenKey: undefined }, runOf(e).id, { provider, now: T0 });
    assert.ok(logs(runOf(e)).some((l) => l.action === "failed" && /ENCRYPTION_KEY/.test(l.detail)));
    assert.equal(jobs().length, 0);
  });

  test("adresse privée : la livraison est refusée (aucune requête), sans reprise", async () => {
    const c = contact("ssrf@ex.fr");
    await runStep(c);
    const handler = delivery.jobHandlers({ db: m.db, env: { ENCRYPTION_KEY: TEST_KEY }, lookup: async () => [{ address: "10.0.0.5", family: 4 }], fetchImpl: async () => { throw new Error("aucune requête ne doit partir"); } })["webhook.deliver"];
    await assert.rejects(() => handler(JSON.parse(jobs()[0].payload)), /privée ou locale/);
  });
});

describe("disponibilité et brouillon", () => {
  test("« connexion requise » sans webhook actif ; disponible avec un webhook actif ; une pause le redevient", () => {
    const state = () => registry.describeActions(A).find((a) => a.type === "webhook_call").availability;
    m.db.prepare("DELETE FROM mk_webhook_endpoints").run();
    assert.equal(state().state, "connection_required");
    assert.match(state().reasons[0].detail, /aucun point d'accès actif/);
    assert.equal(state().reasons[0].fix, "Intégrations → Webhooks");
    const h = endpoints.createEndpoint(A, { name: "Un", url: "https://un.exemple.com/h", events: ["*"], encryptionKey: TEST_KEY });
    assert.equal(state().state, "available");
    endpoints.setEnabled(A, h.id, false);
    assert.equal(state().state, "connection_required");
  });
  test("étape non réglée : brouillon", () => {
    const g = (data) => ({ nodes: [{ id: "trigger", type: "trigger", data: {} }, { id: "n1", type: "webhook_call", data }], edges: [{ id: "e1", source: "trigger", target: "n1" }] });
    assert.deepEqual(graph.incompleteNodes(g({ fields: [] })).map((n) => n.id), ["n1"]);
    assert.deepEqual(graph.incompleteNodes(g({ endpointId: 3, fields: [] })), []);
  });
});
