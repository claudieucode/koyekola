// KOLAKISA CMS — palier 17 : Automation Engine. Le moteur d'exécution existait (passages, journal, attentes, reprises, branches) ; ce fichier prouve la chaîne
// CONTACT CORE → AUTOMATION → EMAIL ENGINE de bout en bout (vraie base, vrai bus, vraie file) et les ajouts : site, versions, simulation, historique.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, quiet, T0, TEST_KEY } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const auto = require("../src/marketing/automations");
const core = require("../src/marketing/contactcore");
const tracking = require("../src/marketing/sending/tracking");
const { createProvider, SendError } = require("../src/marketing/sending/providers");

let m, A, db, tplM, tplT, list, provider, sent, clock;
const DAY = 86400000;
const code = (fn) => { try { fn(); } catch (e) { return e.code || e.message; } return null; };
const one = (sql, ...a) => db.prepare(sql).get(...a);
const count = (sql, ...a) => one(sql, ...a).n;
const PROOF = { source: "form", textShown: "Oui, je veux recevoir les e-mails", ip: "" };
// Fournisseur qui enregistre ce qu'on lui demande d'envoyer (la vraie construction du message a lieu avant)
const capture = () => { sent = []; return { name: "capture", capabilities: {}, sent, async send(msg) { sent.push(msg); return { providerMessageId: `ok-${sent.length}` }; } }; };
// Distribue TOUS les événements en attente aux gestionnaires du bus (comme le worker), dans l'ordre
async function pump() {
  for (const e of db.prepare("SELECT id FROM mk_events WHERE processed_at IS NULL ORDER BY id").all()) await m.bus.dispatch(e.id);
}
const runOf = (c) => one("SELECT * FROM mk_automation_runs WHERE contact_id = ?", c.id);
const step = (c, now = T0) => auto.runAutomation(A, runOf(c).id, { provider, now });
const logs = (run) => db.prepare("SELECT action, detail FROM mk_automation_log WHERE run_id = ? ORDER BY id").all(run.id).map((l) => l.action);
const live = (over) => { const a = auto.createAutomation(A, { name: "Parcours", kind: "marketing", triggerEvent: "contact.subscribed", steps: [{ type: "email", templateId: tplM.id }], ...over }); auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true }); return a; };

beforeEach(() => {
  m = freshMarketing(); A = m.A; db = m.db;
  m.bus.on("*", auto.eventHandler({ db, settings: A.settings, log: quiet }));
  templates.setOrgAddress(A, "12 rue des Écoles, Paris");
  tplM = templates.createTemplate(A, { name: "Suite marketing", kind: "marketing", subject: "La suite", blocks: [{ type: "text", markdown: "Bonjour {{contact.first_name | default:\"ami\"}} [Lien](https://ex.fr/a)" }] });
  tplT = templates.createTemplate(A, { name: "Bienvenue transac", kind: "transactional", subject: "Bienvenue", blocks: [{ type: "text", markdown: "Compte créé." }] });
  list = audience.createList(A, { name: "Newsletter" });
  provider = capture();
  db.exec("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'Alpha'), (1, 'Bravo')");
});

describe("scénario complet : Contact Core → Automation Engine → Email Engine", () => {
  const STEPS = (tpl) => [
    { type: "email", templateId: tpl.id },                                  // 0 : e-mail (Email Engine)
    { type: "wait", amount: 2, unit: "days" },                              // 1 : attente programmée
    { type: "condition", check: "opened", ref: 0, onTrue: 3, onFalse: 4 },  // 2 : e-mail ouvert ?
    { type: "add_tag", tag: "lecteur", next: 5 },                           // 3 : oui
    { type: "add_tag", tag: "froid" },                                      // 4 : non
    { type: "end" },
  ];
  test("abonnement réel → événement du Contact Core → déclencheur → condition → e-mail → attente programmée → reprise → branche → fin → chronologie", async () => {
    const a = live({ name: "Bienvenue newsletter", steps: STEPS(tplM) });
    const c = core.identify(A, { email: "john@x.fr", first_name: "John", source: "form" }).contact;
    // 1-3. le contact s'abonne VRAIMENT : preuve de consentement → événement « contact.subscribed » dans le journal du Contact Core
    assert.equal(compliance.recordConsent(A, c.id, PROOF).ok, true);
    assert.ok(one("SELECT 1 FROM mk_events WHERE name = 'contact.subscribed' AND contact_id = ?", c.id));
    // 4-5. l'Automation Engine détecte le déclencheur et démarre le passage (une seule fois, version figée)
    await pump();
    const run = runOf(c);
    assert.ok(run); assert.equal(run.automation_id, a.id); assert.equal(run.status, "running"); assert.equal(run.version, 1);
    // 7-8. l'Email Engine envoie : le message passe par le fournisseur, il est enregistré, personnalisé, avec désinscription réelle
    // Le vrai gestionnaire de la file (celui du worker) exécute le passage : il programme lui-même le réveil
    clock = T0;
    const handlers = auto.jobHandlers({ db, bus: m.bus, settings: A.settings, providerFor: () => provider, now: () => clock, env: { SITE_URL: "https://k.test", ENCRYPTION_KEY: TEST_KEY }, log: quiet });
    await handlers["automation.run"]({ organizationId: 1, runId: run.id });
    const r1 = { done: false, waitMs: runOf(c).wake_at - T0 };
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, "john@x.fr"); assert.match(sent[0].html, /Bonjour John/);
    assert.match(sent[0].headers["List-Unsubscribe"], /^<https:\/\/k\.test\/.+>$/);
    const msg = one("SELECT * FROM mk_messages WHERE contact_id = ?", c.id);
    assert.equal(msg.status, "sent");
    // 10-11. le délai est RÉELLEMENT programmé (date de réveil + travail planifié), aucun processus ne dort
    assert.equal(r1.done, false); assert.equal(r1.waitMs, 2 * DAY);
    assert.equal(runOf(c).wake_at, T0 + 2 * DAY);
    assert.ok(one("SELECT 1 FROM mk_jobs WHERE type = 'automation.run' AND run_at = ?", T0 + 2 * DAY), "travail planifié à la date de réveil");
    assert.equal(await step(c, T0 + DAY).then((r) => r.waitMs > 0), true, "reprise trop tôt : le passage attend encore");
    // 9. suivi : le contact ouvre l'e-mail → événement « email.opened » dans le journal du Contact Core (objet = campagne système)
    tracking.recordOpen(A, { messageId: msg.id, userAgent: "Mozilla/5.0 (Mac)" });
    assert.ok(one("SELECT 1 FROM mk_events WHERE name = 'email.opened' AND contact_id = ? AND object_type = 'campaign'", c.id));
    // 12-15. reprise après le délai : condition vraie → branche « oui » → étiquette (Contact Core) → fin
    const r3 = await step(c, T0 + 2 * DAY + 1000);
    assert.equal(r3.done, true);
    assert.equal(runOf(c).status, "completed");
    assert.deepEqual(audience.tagsOf(A, c.id).map((t) => t.name), ["lecteur"]);
    assert.deepEqual(logs(runOf(c)), ["sent", "wait", "condition", "add_tag", "completed"]);
    // 16. historique et activité du contact
    const rows = auto.contactRuns(A, c.id, { now: T0 + 3 * DAY });
    assert.equal(rows.length, 1); assert.equal(rows[0].status, "completed"); assert.equal(rows[0].version, 1);
    assert.ok(audience.contactTimeline(A, c.id).some((t) => t.type === "automation"));
  });
  test("branche « non » : e-mail non ouvert → autre chemin", async () => {
    live({ name: "Parcours B", steps: STEPS(tplM) });
    const c = core.identify(A, { email: "froid@x.fr", source: "form" }).contact;
    compliance.recordConsent(A, c.id, PROOF); await pump();
    await step(c); await step(c);
    await step(c, T0 + 2 * DAY + 1);
    assert.deepEqual(audience.tagsOf(A, c.id).map((t) => t.name), ["froid"]);
    assert.equal(runOf(c).status, "completed");
  });
  test("consentement : un contact désinscrit ne reçoit rien et sort du scénario (jamais contourné par l'automatisation)", async () => {
    live({ name: "Marketing strict" });
    const c = core.identify(A, { email: "non@x.fr" }).contact;
    compliance.recordConsent(A, c.id, PROOF); await pump();
    compliance.unsubscribe(A, c.id, { scope: "all", source: "lien" });
    const r = await step(c);
    assert.equal(r.done, true); assert.equal(sent.length, 0);
    assert.equal(runOf(c).status, "exited");
  });
});

describe("déclencheurs, idempotence, sécurité des entrées", () => {
  test("un même événement distribué deux fois, puis rejoué, ne crée qu'un passage et n'envoie qu'un e-mail", async () => {
    live({ name: "Une seule fois" });
    const c = core.identify(A, { email: "idem@x.fr" }).contact;
    compliance.recordConsent(A, c.id, PROOF); await pump();
    const ev = one("SELECT id FROM mk_events WHERE name = 'contact.subscribed'").id;
    await m.bus.dispatch(ev); await m.bus.dispatch(ev); m.bus.replay(ev, { organizationId: 1 }); await pump();
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_runs"), 1);
    await step(c); await step(c).catch(() => {});
    assert.equal(sent.length, 1);
  });
  test("un nouvel événement du même type pour le même contact ne le fait pas entrer une seconde fois", async () => {
    live({ name: "Entrée unique" });
    const c = core.identify(A, { email: "unique@x.fr" }).contact;
    for (let i = 0; i < 3; i++) core.recordEvent(A, { type: "contact.subscribed", contactId: c.id, source: "test", idempotencyKey: `k${i}` });
    await pump();
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_runs WHERE contact_id = ?", c.id), 1);
  });
  test("événement invalide ou sans contact : aucun passage ; événements du Contact Core et de l'Email Engine proposés comme déclencheurs", async () => {
    live({ name: "Garde" });
    core.recordEvent(A, { type: "contact.subscribed", email: "inconnu@x.fr", source: "test" }); // pas de fiche
    await pump();
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_runs"), 0);
    assert.equal(code(() => core.recordEvent(A, { type: "Pas Valide" })), "invalid_event");
    for (const e of ["user.registered", "contact.lifecycle_changed", "email.delivered", "email.bounced", "email.complained", "email.opened", "email.clicked", "form.submitted", "tag.added", "comment.approved"]) assert.ok(auto.TRIGGERS[e], e);
    assert.equal(code(() => auto.createAutomation(A, { name: "X", triggerEvent: "n'importe quoi !", steps: [] })), "invalid_automation");
  });
  test("déclencheur sur une valeur : le filtre est respecté (étape du cycle de vie atteinte)", async () => {
    auto.activateAutomation(A, auto.createAutomation(A, { name: "Client", triggers: [{ event: "contact.lifecycle_changed", filter: { key: "to", value: "customer" } }], kind: "marketing", steps: [{ type: "add_tag", tag: "client" }] }).id, { workerOn: true, smtpAvailable: true });
    const a = core.identify(A, { email: "lc1@x.fr" }).contact, b = core.identify(A, { email: "lc2@x.fr" }).contact;
    const noUser = { ...A, userId: null }; // aucun compte d'équipe dans cette base de test
    core.setLifecycle(noUser, a.id, "lead"); core.setLifecycle(noUser, b.id, "customer");
    await pump();
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_runs WHERE contact_id = ?", a.id), 0);
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_runs WHERE contact_id = ?", b.id), 1);
  });
  test("pas de boucle : les actions d'un scénario n'émettent aucun événement, un contact n'entre qu'une fois", async () => {
    auto.activateAutomation(A, auto.createAutomation(A, { name: "Boucle", kind: "marketing", triggerEvent: "tag.added", steps: [{ type: "add_tag", tag: "x" }] }).id, { workerOn: true, smtpAvailable: true });
    const c = core.identify(A, { email: "boucle@x.fr" }).contact;
    audience.tagContact(A, c.id, "x"); await pump();
    const before = count("SELECT COUNT(*) n FROM mk_events");
    await step(c); await pump();
    assert.equal(count("SELECT COUNT(*) n FROM mk_events"), before, "l'étiquette ajoutée par le scénario n'a émis aucun événement");
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_runs"), 1);
  });
});

describe("erreurs et reprises", () => {
  test("panne temporaire du fournisseur : réessai espacé avec compteur ; au-delà du maximum, échec visible (jamais masqué) et le scénario continue", async () => {
    live({ name: "Fiabilité", steps: [{ type: "email", templateId: tplM.id }, { type: "add_tag", tag: "suite" }] });
    const c = core.identify(A, { email: "panne@x.fr" }).contact;
    compliance.recordConsent(A, c.id, PROOF); await pump();
    provider = { name: "down", capabilities: {}, async send() { throw new SendError("temporary"); } };
    let now = T0;
    const delays = [];
    for (let i = 0; i < 6 && runOf(c).status === "running" && runOf(c).step_index === 0; i++) { const r = await step(c, now); delays.push(r.waitMs); now += r.waitMs || 0; }
    assert.ok(delays[0] > 0 && delays[1] > delays[0], `attente croissante : ${delays}`);
    assert.ok(logs(runOf(c)).includes("failed"), "l'échec est inscrit au journal");
    assert.equal(one("SELECT status FROM mk_messages WHERE contact_id = ?", c.id).status, "failed");
    assert.equal(runOf(c).step_index >= 1, true, "le scénario passe à l'étape suivante");
  });
  test("adresse refusée par le destinataire : protégée (liste de suppression) et le passage s'arrête", async () => {
    live({ name: "Rejet" });
    const c = core.identify(A, { email: "rejet@x.fr" }).contact;
    compliance.recordConsent(A, c.id, PROOF); await pump();
    provider = { name: "rej", capabilities: {}, async send() { throw new SendError("recipient_rejected"); } };
    await step(c);
    assert.equal(runOf(c).status, "exited");
    assert.ok(one("SELECT 1 FROM mk_suppressions WHERE email = 'rejet@x.fr'"));
  });
  test("mauvaise configuration du fournisseur : le scénario est mis en pause avec un message clair (jamais un échec silencieux)", async () => {
    const a = live({ name: "Config" });
    const c = core.identify(A, { email: "cfg@x.fr" }).contact;
    compliance.recordConsent(A, c.id, PROOF); await pump();
    provider = { name: "cfg", capabilities: {}, async send() { throw new SendError("config"); } };
    const r = await step(c);
    assert.equal(r.paused, true);
    assert.equal(one("SELECT status FROM mk_automations WHERE id = ?", a.id).status, "paused");
    assert.ok(one("SELECT error FROM mk_automations WHERE id = ?", a.id).error.length > 0);
  });
});

describe("publication, versions, pause, duplication", () => {
  test("publier = version figée : les contacts déjà entrés gardent leurs étapes ; republier un contenu modifié crée la version suivante", async () => {
    const a = live({ name: "Versionné", steps: [{ type: "add_tag", tag: "v1" }] });
    assert.equal(auto.getAutomation(A, a.id).version, 1);
    const c1 = core.identify(A, { email: "v1@x.fr" }).contact;
    compliance.recordConsent(A, c1.id, PROOF); await pump();
    auto.pauseAutomation(A, a.id);
    auto.updateAutomation(A, a.id, { steps: [{ type: "add_tag", tag: "v2" }] });
    assert.equal(code(() => auto.resumeAutomation(A, a.id)), "invalid_state", "contenu modifié : il faut republier");
    auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    assert.equal(auto.getAutomation(A, a.id).version, 2);
    const c2 = core.identify(A, { email: "v2@x.fr" }).contact;
    compliance.recordConsent(A, c2.id, PROOF); await pump();
    await step(c1); await step(c2);
    assert.deepEqual(audience.tagsOf(A, c1.id).map((t) => t.name), ["v1"], "l'ancien passage exécute SA version");
    assert.deepEqual(audience.tagsOf(A, c2.id).map((t) => t.name), ["v2"]);
    assert.deepEqual([runOf(c1).version, runOf(c2).version], [1, 2]);
    const versions = auto.listVersions(A, a.id);
    assert.deepEqual(versions.map((v) => [v.version, v.runs]), [[2, 1], [1, 1]]);
    assert.throws(() => db.prepare("UPDATE mk_automation_versions SET steps = '[]' WHERE version = 1").run(), /ne se modifie pas/, "une version publiée est immuable");
  });
  test("pause ≠ annulation : les passages en cours sont conservés et reprennent à la reprise", async () => {
    const a = live({ name: "Pause", steps: [{ type: "wait", amount: 1, unit: "days" }, { type: "add_tag", tag: "fini" }] });
    const c = core.identify(A, { email: "pause@x.fr" }).contact;
    compliance.recordConsent(A, c.id, PROOF); await pump();
    await step(c);
    auto.pauseAutomation(A, a.id);
    assert.equal(runOf(c).status, "running", "le passage n'est pas supprimé");
    assert.equal((await step(c, T0 + 2 * DAY)).paused, true, "rien ne s'exécute pendant la pause");
    auto.resumeAutomation(A, a.id, { now: T0 + 2 * DAY });
    await step(c, T0 + 2 * DAY);
    assert.equal(runOf(c).status, "completed");
  });
  test("duplication : nouveau brouillon indépendant, version 0, aucun passage repris", async () => {
    const a = live({ name: "Original" });
    const c = core.identify(A, { email: "dup@x.fr" }).contact;
    compliance.recordConsent(A, c.id, PROOF); await pump();
    const copy = auto.duplicateAutomation(A, a.id);
    assert.equal(copy.status, "draft"); assert.equal(copy.version, 0); assert.notEqual(copy.id, a.id);
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_runs WHERE automation_id = ?", copy.id), 0);
  });
  test("validation avant publication : sans étape, e-mail inexistant, étape non reliée → refus précis", () => {
    const empty = auto.createAutomation(A, { name: "Vide", kind: "marketing", triggerEvent: "contact.created", steps: [] });
    assert.equal(code(() => auto.activateAutomation(A, empty.id, { workerOn: true, smtpAvailable: true })), "preflight_failed");
    const check = auto.automationPreflight(A, empty.id, { workerOn: true, smtpAvailable: true });
    assert.equal(check.ready, false); assert.ok(check.errors.some((e) => e.code === "no_steps"));
    assert.equal(code(() => auto.createAutomation(A, { name: "E", kind: "marketing", triggerEvent: "contact.created", steps: [{ type: "email", templateId: 99999 }] })), "not_found");
    assert.equal(code(() => auto.createAutomation(A, { name: "J", kind: "marketing", triggerEvent: "contact.created", steps: [{ type: "wait", amount: 1, unit: "days", next: 0 }, { type: "end" }] })), "invalid_automation", "aucun saut en arrière : pas de boucle possible");
  });
});

describe("isolation par site", () => {
  const siteAuto = (siteId, name, extra = {}) => auto.createAutomation(A, { name, kind: "marketing", triggerEvent: "contact.created", steps: [{ type: "add_tag", tag: "site" }], siteId, ...extra });
  test("un scénario de site n'accueille que les contacts de ce site ; sans site, tous", async () => {
    for (const a of [siteAuto(1, "Alpha"), siteAuto(null, "Organisation")]) auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    const a = core.identify(A, { email: "a@x.fr", siteId: 1 }).contact, b = core.identify(A, { email: "b@x.fr", siteId: 2 }).contact;
    await pump();
    const runs = (c) => db.prepare("SELECT a.name FROM mk_automation_runs r JOIN mk_automations a ON a.id = r.automation_id WHERE r.contact_id = ? ORDER BY a.name").all(c.id).map((r) => r.name);
    assert.deepEqual(runs(a), ["Alpha", "Organisation"]);
    assert.deepEqual(runs(b), ["Organisation"]);
  });
  test("accès limité à un site : ne voit, ne modifie, ne crée que dans son site ; ressources d'un autre site refusées", () => {
    const x = siteAuto(1, "Alpha seul"), y = siteAuto(2, "Bravo seul"), z = siteAuto(null, "Orga");
    const S1 = { ...A, siteScope: 1 };
    assert.deepEqual(auto.listAutomations(S1).map((r) => r.name), ["Alpha seul"]);
    assert.equal(auto.getAutomation(S1, y.id), null); assert.equal(auto.getAutomation(S1, z.id), null);
    assert.equal(code(() => auto.updateAutomation(S1, y.id, { name: "Piraté" })), "not_found");
    assert.equal(code(() => auto.pauseAutomation(S1, y.id)), "not_found");
    assert.equal(code(() => auto.duplicateAutomation(S1, y.id)), "not_found");
    assert.equal(auto.createAutomation(S1, { name: "Créé en site", kind: "marketing", triggerEvent: "contact.created", steps: [], siteId: 2 }).site_id, 1, "site imposé");
    assert.equal(one("SELECT name FROM mk_automations WHERE id = ?", y.id).name, "Bravo seul");
  });
  test("un scénario de site ne peut utiliser ni l'audience, ni le modèle, ni le scénario d'un autre site", () => {
    const listB = audience.createList(A, { name: "Audience Bravo", siteId: 2 }), listA = audience.createList(A, { name: "Audience Alpha", siteId: 1 });
    const tplB = templates.createTemplate(A, { name: "Modèle Bravo", kind: "marketing", subject: "S", blocks: [{ type: "text", markdown: "x" }], siteId: 2 });
    const other = siteAuto(2, "Autre site");
    assert.match(code(() => siteAuto(1, "X1", { steps: [{ type: "add_to_list", listId: listB.id }] })), /autre site|pas au site|invalid/i);
    assert.ok(siteAuto(1, "X2", { steps: [{ type: "add_to_list", listId: listA.id }] }));
    assert.equal(code(() => siteAuto(1, "X3", { steps: [{ type: "email", templateId: tplB.id }] })), "invalid_automation");
    assert.equal(code(() => siteAuto(1, "X4", { steps: [{ type: "start_automation", automationId: other.id }] })), "invalid_automation");
    assert.ok(siteAuto(1, "X5", { steps: [{ type: "email", templateId: tplM.id }] }), "modèle de l'organisation (sans site) : accepté");
    assert.equal(code(() => auto.updateAutomation(A, siteAuto(1, "X6").id, { steps: [{ type: "add_to_list", listId: listB.id }] })), "invalid_automation");
  });
});

describe("simulation (dry run) : lecture seule", () => {
  test("annonce ce qui serait fait pour un contact réel, évalue les conditions et le consentement, n'écrit RIEN", async () => {
    const a = auto.createAutomation(A, { name: "Simulé", kind: "marketing", triggerEvent: "contact.created", steps: [
      { type: "email", templateId: tplM.id }, { type: "wait", amount: 3, unit: "days" },
      { type: "condition", definition: { op: "and", rules: [{ field: "country", cmp: "eq", value: "FR" }] }, onTrue: 4, onFalse: 5 },
      { type: "add_tag", tag: "x", next: "exit" }, { type: "add_tag", tag: "francais", next: 6 }, { type: "add_tag", tag: "etranger" }, { type: "end" }] });
    const c = core.identify(A, { email: "sim@x.fr", country: "FR" }).contact;
    compliance.recordConsent(A, c.id, PROOF);
    const before = { tags: count("SELECT COUNT(*) n FROM mk_contact_tags"), msgs: count("SELECT COUNT(*) n FROM mk_messages"), runs: count("SELECT COUNT(*) n FROM mk_automation_runs"), ev: count("SELECT COUNT(*) n FROM mk_events"), logs: count("SELECT COUNT(*) n FROM mk_automation_log") };
    const rep = await auto.dryRun(A, a, c.id);
    assert.equal(rep.readOnly, true); assert.equal(rep.status, "completed"); assert.equal(rep.totalWaitMs, 3 * DAY);
    assert.deepEqual(rep.steps.map((s) => s.outcome), ["would_execute", "wait", "branch", "would_execute", "end"]);
    assert.match(rep.steps[0].detail, /joignable/); assert.match(rep.steps[2].detail, /vraie/); assert.match(rep.steps[3].detail, /francais/);
    assert.deepEqual({ tags: count("SELECT COUNT(*) n FROM mk_contact_tags"), msgs: count("SELECT COUNT(*) n FROM mk_messages"), runs: count("SELECT COUNT(*) n FROM mk_automation_runs"), ev: count("SELECT COUNT(*) n FROM mk_events"), logs: count("SELECT COUNT(*) n FROM mk_automation_log") }, before, "aucune écriture");
    assert.equal(sent.length, 0);
    // même scénario pour un contact étranger : l'autre branche
    const d = core.identify(A, { email: "sim2@x.fr", country: "TG" }).contact;
    compliance.recordConsent(A, d.id, PROOF);
    assert.match((await auto.dryRun(A, a, d.id)).steps[3].detail, /etranger/);
  });
  test("contact non joignable : l'e-mail est annoncé comme BLOQUÉ et le contact sortirait du scénario", async () => {
    const a = auto.createAutomation(A, { name: "Bloqué", kind: "marketing", triggerEvent: "contact.created", steps: [{ type: "email", templateId: tplM.id }, { type: "add_tag", tag: "jamais" }] });
    const c = core.identify(A, { email: "bloque@x.fr" }).contact; // pas de consentement
    const rep = await auto.dryRun(A, a, c.id);
    assert.equal(rep.steps[0].outcome, "blocked"); assert.match(rep.steps[0].detail, /NON envoyé/); assert.equal(rep.status, "exited"); assert.equal(rep.steps.length, 1);
    await assert.rejects(() => auto.dryRun(A, a, 999999), /introuvable/);
  });
});

describe("historique et activité d'un contact", () => {
  test("filtres (scénario, état, contact, dates, erreurs), pagination plafonnée, isolation par site", async () => {
    const a1 = live({ name: "H1", steps: [{ type: "wait", amount: 1, unit: "days" }, { type: "add_tag", tag: "h1" }] });
    const a2 = auto.createAutomation(A, { name: "H2", kind: "marketing", triggerEvent: "contact.subscribed", steps: [{ type: "add_tag", tag: "h" }], siteId: 1 });
    auto.activateAutomation(A, a2.id, { workerOn: true, smtpAvailable: true });
    const people = [];
    for (let i = 0; i < 6; i++) { const c = core.identify(A, { email: `h${i}@x.fr`, first_name: `Prénom${i}`, siteId: i % 2 ? 1 : 2 }).contact; compliance.recordConsent(A, c.id, PROOF); people.push(c); }
    await pump();
    for (const c of people) for (const r of db.prepare("SELECT id FROM mk_automation_runs WHERE contact_id = ?").all(c.id)) await auto.runAutomation(A, r.id, { provider, now: T0 });
    db.prepare("UPDATE mk_automation_runs SET last_error = 'panne' WHERE contact_id = ? AND automation_id = ?").run(people[0].id, a1.id);
    const all = auto.runHistory(A, { now: T0 });
    assert.equal(all.total, 9, "6 passages H1 + 3 passages H2 (contacts du site 1 seulement)");
    assert.equal(auto.runHistory(A, { automationId: a2.id }).total, 3);
    assert.equal(auto.runHistory(A, { status: "completed" }).total, 3);
    assert.equal(auto.runHistory(A, { status: "running" }).total, 6);
    assert.equal(auto.runHistory(A, { q: "h3@x.fr" }).rows.map((r) => r.automation).sort().join(), "H1,H2");
    assert.equal(auto.runHistory(A, { onlyErrors: true }).total, 1);
    assert.equal(auto.runHistory(A, { from: "2999-01-01" }).total, 0);
    assert.throws(() => auto.runHistory(A, { status: "pirate" }), /inconnu/);
    assert.equal(auto.runHistory({ ...A, siteScope: 1 }).total, 3, "accès limité à un site : seulement ses scénarios");
    assert.equal(auto.runHistory({ ...A, siteScope: 2 }).total, 0);
    const w = auto.contactRuns(A, people[0].id, { now: T0 }).find((r) => r.automation === "H1");
    assert.equal(w.state, "waiting"); assert.ok(w.nextAt > T0); assert.ok(w.nextStep, "la prochaine étape est annoncée"); assert.equal(w.error, "panne");
    assert.equal(auto.contactRuns({ ...A, siteScope: 2 }, people[1].id).length, 0, "ses scénarios d'un autre site restent invisibles");
  });
  test("5 000 passages : l'historique reste paginé (50 lignes) et rapide", () => {
    const a = auto.createAutomation(A, { name: "Gros", kind: "marketing", triggerEvent: "contact.created", steps: [{ type: "end" }] });
    db.exec("BEGIN");
    const ic = db.prepare("INSERT INTO mk_contacts (organization_id, email) VALUES (1, ?)"), ir = db.prepare("INSERT INTO mk_automation_runs (organization_id, automation_id, contact_id, steps, wake_at, entered_at) VALUES (1, ?, ?, '[]', 0, ?)");
    for (let i = 0; i < 5000; i++) ir.run(a.id, Number(ic.run(`g${i}@bulk.test`).lastInsertRowid), T0 + i);
    db.exec("COMMIT");
    const t = Date.now();
    const h = auto.runHistory(A, { automationId: a.id, page: 40 });
    assert.equal(h.total, 5000); assert.equal(h.rows.length, 50); assert.ok(Date.now() - t < 1500, `${Date.now() - t} ms`);
  });
});
