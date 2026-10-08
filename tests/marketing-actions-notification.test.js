// Action de scénario « Notifier l'équipe » : e-mail interne envoyé à des MEMBRES de l'organisation (jamais une adresse libre),
// planifié dans la file (le scénario n'attend pas), une seule fois par passage / étape / destinataire, variables rendues, objet
// sans retour à la ligne (pas d'injection d'en-tête), HTML échappé, reprises si le fournisseur est indisponible, disponibilité.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY, T0, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const auto = require("../src/marketing/automations");
const registry = require("../src/marketing/automations/actions");
const graph = require("../src/marketing/automations/graph");
const notify = require("../src/marketing/automations/notify");
const { UnrecoverableError } = require("../src/marketing/queue/worker");
const { SendError } = require("../src/marketing/sending/providers/errors");
const { createProvider } = require("../src/marketing/sending/providers");

let m, A, provider;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const contact = (email, fields = {}) => audience.upsertContact(A, { email, ...fields }).contact;
const make = (steps) => auto.createAutomation(A, { name: `Alerte ${Math.random().toString(36).slice(2, 6)}`, kind: "marketing", triggerEvent: "lms.course_enrolled", steps });
const jobs = () => m.db.prepare("SELECT * FROM mk_jobs WHERE type = 'automation.notify' ORDER BY id").all();
const events = () => m.db.prepare("SELECT COUNT(*) n FROM mk_events").get().n;
const event = (c, metadata = {}) => ({ id: Math.floor(Math.random() * 1e9), organizationId: 1, name: "lms.course_enrolled", contactId: c.id, email: c.email, metadata });
const runOf = (c, a) => m.db.prepare("SELECT * FROM mk_automation_runs WHERE contact_id = ? AND automation_id = ?").get(c.id, a.id);
const logs = (run) => m.db.prepare("SELECT action, detail FROM mk_automation_log WHERE run_id = ? ORDER BY id").all(run.id);
const user = (id, name) => { m.db.prepare("INSERT OR REPLACE INTO users (id, username, email) VALUES (?, ?, ?)").run(id, name, `${name}@equipe.fr`); return id; };
const member = (org, userId, role = "editor") => m.db.prepare("INSERT OR REPLACE INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(org, userId, role);
const SUBJECT = "Nouveau contact : {{prenom}} {{nom}}";
const BODY = "{{prenom}} {{nom}} ({{email}}) s'est inscrit à « {{event.course_title}} ».\nFiche : {{contact_url}}\nScénario : {{scenario}}";

beforeEach(() => {
  m = freshMarketing(); A = m.A; provider = createProvider({ provider: "console" }, { log: quiet });
  member(1, user(11, "awa")); member(1, user(12, "marc")); member(2, user(21, "autre-orga")); user(13, "externe");
});

describe("validation", () => {
  test("destinataires = membres de l'organisation uniquement ; objet et texte contrôlés ; forme normalisée", () => {
    const a = make([{ type: "notify_team", recipients: [11, 12, 11], subject: "  Objet\n avec   saut ", body: " Texte\r\nsur deux lignes ", junk: 1 }]);
    assert.deepEqual(a.steps, [{ type: "notify_team", recipients: [11, 12], subject: "Objet avec saut", body: "Texte\nsur deux lignes" }]);
    const bad = (over) => code(() => make([{ type: "notify_team", recipients: [11], subject: "S", body: "B", ...over }]));
    assert.equal(bad({ recipients: [] }), "invalid_automation");
    assert.equal(bad({ recipients: undefined }), "invalid_automation");
    assert.equal(bad({ recipients: [1, 2, 3, 4, 5, 6].map((n) => 10 + n) }), "invalid_automation", "6 destinataires");
    assert.equal(bad({ recipients: [13] }), "not_found", "un utilisateur hors équipe n'est pas un destinataire");
    assert.equal(bad({ recipients: [21] }), "not_found", "le membre d'une autre organisation non plus");
    assert.equal(bad({ recipients: ["a@b.fr"] }), "invalid_automation", "jamais une adresse libre");
    assert.equal(bad({ subject: "  " }), "invalid_automation");
    assert.equal(bad({ subject: "x".repeat(151) }), "invalid_automation");
    assert.equal(bad({ body: "" }), "invalid_automation");
    assert.equal(bad({ body: "x".repeat(1501) }), "invalid_automation");
    assert.equal(bad({ body: "Bonjour {{mot_de_passe}}" }), "invalid_automation");
    assert.equal(bad({ subject: "{{secret}}" }), "invalid_automation");
  });
});

describe("envoi planifié", () => {
  async function run(c, steps, metadata = { title: "Photoshop avancé", slug: "photoshop-avance" }) {
    const a = make(steps);
    auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    auto.onEvent(A, event(c, metadata));
    await auto.runAutomation(A, runOf(c, a).id, { provider, now: T0 });
    return a;
  }

  test("une notification par destinataire, avec les variables rendues ; le scénario continue sans attendre ; aucun événement", async () => {
    const c = contact("awa.d@ex.fr", { first_name: "Awa", last_name: "Diallo" });
    const before = events();
    const a = await run(c, [{ type: "notify_team", recipients: [11, 12], subject: SUBJECT, body: BODY }, { type: "add_tag", tag: "suite" }]);
    assert.equal(events(), before);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_contact_tags ct WHERE ct.contact_id = ?").get(c.id).n, 1, "l'étape suivante s'est exécutée");
    const list = jobs().map((j) => JSON.parse(j.payload));
    assert.deepEqual(list.map((p) => p.userId).sort(), [11, 12]);
    assert.equal(list[0].subject, "Nouveau contact : Awa Diallo");
    assert.equal(list[0].text, `Awa Diallo (awa.d@ex.fr) s'est inscrit à « Photoshop avancé ».\nFiche : https://k.test/marketing/contacts/${c.id}\nScénario : ${a.name}`);
    assert.ok(logs(runOf(c, a)).some((l) => l.action === "notify_team" && /pour 2 membres/.test(l.detail)));
  });

  test("rejouer l'étape ne planifie rien de plus ; un membre retiré est ignoré ; plus aucun destinataire : signalé", async () => {
    const c = contact("rejeu@ex.fr", { first_name: "R" });
    const a = await run(c, [{ type: "notify_team", recipients: [11], subject: "S", body: "B" }]);
    m.db.prepare("UPDATE mk_automation_runs SET step_index = 0, status = 'running', finished_at = NULL, wake_at = ? WHERE id = ?").run(T0, runOf(c, a).id);
    await auto.runAutomation(A, runOf(c, a).id, { provider, now: T0 });
    assert.equal(jobs().length, 1);
    assert.ok(logs(runOf(c, a)).some((l) => l.action === "already_done"));
    // membre retiré avant l'exécution
    const d = contact("retire@ex.fr");
    const b = make([{ type: "notify_team", recipients: [12], subject: "S", body: "B" }]);
    auto.activateAutomation(A, b.id, { workerOn: true, smtpAvailable: true });
    m.db.prepare("DELETE FROM mk_org_members WHERE user_id = 12").run();
    auto.onEvent(A, event(d));
    await auto.runAutomation(A, runOf(d, b).id, { provider, now: T0 });
    assert.ok(logs(runOf(d, b)).some((l) => l.action === "failed" && /aucun destinataire valide/.test(l.detail)));
    assert.equal(jobs().length, 1);
  });
});

describe("livraison par la file", () => {
  const sent = [];
  const fake = (behaviour) => ({ name: "fake", capabilities: {}, async send(message) { sent.length = 0; sent.push(message); if (behaviour) throw behaviour; return { providerMessageId: "ok" }; } });
  const handler = (behaviour) => notify.jobHandlers({ db: m.db, settings: A.settings, env: { ENCRYPTION_KEY: TEST_KEY }, providerFor: () => fake(behaviour) })["automation.notify"];
  const payload = (over = {}) => ({ organizationId: 1, userId: 11, subject: "Objet", text: "Ligne 1\nLigne 2 <script>alert(1)</script>", automationName: "Alerte <b>", key: "notify:1:0:11", ...over });

  test("le message part vers l'adresse du membre, transactionnel, HTML échappé, signé du nom du scénario", async () => {
    await handler()(payload());
    const msg = sent[0];
    assert.equal(msg.to, "awa@equipe.fr");
    assert.equal(msg.subject, "Objet");
    assert.deepEqual(msg.headers, { "Auto-Submitted": "auto-generated" }, "ni désinscription ni en-tête marketing");
    assert.match(msg.text, /Ligne 1\nLigne 2 <script>alert\(1\)<\/script>[\s\S]*Notification automatique du scénario « Alerte <b> »/);
    assert.ok(!msg.html.includes("<script>") && msg.html.includes("&lt;script&gt;") && msg.html.includes("Ligne 1<br>Ligne 2"));
    assert.ok(!msg.html.includes("<b>"), "le nom du scénario est échappé aussi");
    assert.equal(msg.idempotencyKey, "notify:1:0:11");
  });

  test("fournisseur momentanément indisponible : la file réessaie ; refus définitif ou configuration : abandon sans reprise", async () => {
    await assert.rejects(() => handler(new SendError("temporary"))(payload()), (e) => e instanceof SendError && e.kind === "temporary");
    await assert.rejects(() => handler(new SendError("rate_limited"))(payload()), (e) => e instanceof SendError);
    for (const kind of ["recipient_rejected", "config", "permanent"]) await assert.rejects(() => handler(new SendError(kind))(payload()), (e) => e instanceof UnrecoverableError, kind);
    await assert.rejects(() => handler(new Error("boom"))(payload()), (e) => e instanceof UnrecoverableError);
  });

  test("destinataire devenu étranger à l'équipe : abandon sans envoi", async () => {
    sent.length = 0;
    m.db.prepare("DELETE FROM mk_org_members WHERE user_id = 11").run();
    await assert.rejects(() => handler()(payload()), (e) => e instanceof UnrecoverableError && /plus membre/.test(e.message));
    assert.equal(sent.length, 0);
  });
});

describe("disponibilité et brouillon", () => {
  test("dépend du fournisseur d'e-mails : « connexion requise » tant qu'il n'est pas réglé", () => {
    const s = () => registry.describeActions(A).find((a) => a.type === "notify_team").availability;
    assert.equal(s().state, "connection_required");
    assert.equal(s().reasons[0].fix, "Réglages d'envoi");
    A.settings.set(1, "email.provider", "smtp"); A.settings.set(1, "email.from", "KOLAKISA <a@exemple.fr>");
    assert.equal(s().state, "available");
  });
  test("étape non réglée : brouillon", () => {
    const g = (data) => ({ nodes: [{ id: "trigger", type: "trigger", data: {} }, { id: "n1", type: "notify_team", data }], edges: [{ id: "e1", source: "trigger", target: "n1" }] });
    assert.deepEqual(graph.incompleteNodes(g({ recipients: [], subject: "", body: "" })).map((n) => n.id), ["n1"]);
    assert.deepEqual(graph.incompleteNodes(g({ recipients: [11], subject: "S", body: "" })).map((n) => n.id), ["n1"]);
    assert.deepEqual(graph.incompleteNodes(g({ recipients: [11], subject: "S", body: "B" })), []);
  });
});
