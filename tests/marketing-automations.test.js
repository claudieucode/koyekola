// Marketing M4b — automatisations : validation, activation, déclenchement, moteur d'étapes, sécurité, reprise.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, addLmsSchema, TEST_KEY, T0, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const sending = require("../src/marketing/sending");
const config = require("../src/marketing/sending/config");
const auto = require("../src/marketing/automations");
const bridge = require("../src/marketing/bridge/events");
const { createProvider, SendError } = require("../src/marketing/sending/providers");
const { createWorker } = require("../src/marketing/queue/worker");

let m, A, B, tplT, tplM, list, provider;
const H = 3600000;
const DAY = 86400000;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const count = (t, where = "1=1") => m.db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE ${where}`).get().n;
const scripted = (fn) => { const sent = []; return { name: "fake", capabilities: {}, sent, async send(msg) { sent.push(msg); return fn(msg, sent.length); } }; };
const ok = () => scripted((msg, n) => ({ providerMessageId: `ok-${n}` }));
const PROOF = { source: "form", textShown: "Oui, je veux recevoir les e-mails" };
const contact = (email, { consent = false, first_name = "" } = {}) => {
  const { contact: c } = audience.upsertContact(A, { email, first_name });
  if (consent) compliance.recordConsent(A, c.id, PROOF);
  return c;
};
const event = (name, c, metadata = {}, org = 1) => ({ id: Math.floor(Math.random() * 1e9), organizationId: org, name, contactId: c.id, email: c.email, metadata });
const runOf = (c) => m.db.prepare("SELECT * FROM mk_automation_runs WHERE contact_id = ?").get(c.id);
const logs = (run) => m.db.prepare("SELECT step_index, action, detail FROM mk_automation_log WHERE run_id = ? ORDER BY id").all(run.id);
const step = (c, opts = {}) => auto.runAutomation(A, runOf(c).id, { provider, now: T0, ...opts });
const make = (over = {}) => auto.createAutomation(A, { name: "Bienvenue", kind: "transactional", triggerEvent: "lms.user_registered", steps: [{ type: "email", templateId: tplT.id }], ...over });
const live = (over) => { const a = make(over); auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true }); return a; };

beforeEach(() => {
  m = freshMarketing(); A = m.A; B = m.B;
  templates.setOrgAddress(A, "12 rue des Écoles, Paris");
  tplT = templates.createTemplate(A, { name: "Bienvenue transac", kind: "transactional", subject: "Bienvenue {{contact.first_name | default:\"\"}}", blocks: [{ type: "text", markdown: "Compte créé. {{event.course_title}} {{event.order_total}}" }, { type: "button", label: "Commencer", url: "{{event.course_url}}" }] });
  tplM = templates.createTemplate(A, { name: "Suite marketing", kind: "marketing", subject: "La suite", blocks: [{ type: "text", markdown: "Bonjour {{contact.first_name | default:\"ami\"}} [Lien](https://ex.fr/a)" }] });
  list = audience.createList(A, { name: "Élèves" });
  provider = createProvider({ provider: "console" }, { log: quiet });
});

describe("validation des scénarios", () => {
  test("scénario valide : normalisé, brouillon, audité", () => {
    const a = make({ steps: [{ type: "email", templateId: tplT.id, junk: 1 }, { type: "wait", amount: 2, unit: "days" }, { type: "add_tag", tag: "  Élève  " }, { type: "end" }] });
    assert.equal(a.status, "draft");
    assert.deepEqual(a.steps[0], { type: "email", templateId: tplT.id, trackClicks: false });
    assert.deepEqual(a.steps[2], { type: "add_tag", tag: "Élève" });
    assert.ok(m.db.prepare("SELECT 1 FROM mk_audit_logs WHERE action = 'automation.created'").get());
  });
  test("refus : type d'étape inconnu, attente hors bornes, trop d'étapes, condition invalide, étiquette vide", () => {
    const bad = (steps) => code(() => make({ name: `X${Math.random()}`, steps }));
    assert.equal(bad([{ type: "exec", cmd: "rm" }]), "invalid_automation");
    assert.equal(bad([{ type: "wait", amount: 0, unit: "days" }]), "invalid_automation");
    assert.equal(bad([{ type: "wait", amount: 400, unit: "days" }]), "invalid_automation");
    assert.equal(bad([{ type: "wait", amount: 5, unit: "semaines" }]), "invalid_automation");
    assert.equal(bad(Array.from({ length: 31 }, () => ({ type: "end" }))), "invalid_automation");
    assert.equal(bad([{ type: "condition", definition: { op: "and", rules: [] }, onFalse: "exit" }]), "invalid_segment");
    assert.equal(bad([{ type: "condition", definition: { op: "and", rules: [{ field: "country", cmp: "eq", value: "FR" }] }, onFalse: "peut-être" }]), "invalid_automation");
    assert.equal(bad([{ type: "add_tag", tag: "   " }]), "invalid_field");
    assert.equal(bad("pas une liste"), "invalid_automation");
  });
  test("e-mail : modèle inconnu, d'une autre organisation, ou du mauvais type (transactionnel ↔ marketing)", () => {
    const bad = (templateId, kind) => code(() => make({ name: `Y${Math.random()}`, kind, steps: [{ type: "email", templateId }] }));
    assert.equal(bad(9999, "transactional"), "not_found");
    const tb = templates.createTemplate(B, { name: "B", kind: "transactional", subject: "S", blocks: [{ type: "divider" }] });
    assert.equal(bad(tb.id, "transactional"), "not_found");
    assert.equal(bad(tplM.id, "transactional"), "invalid_automation");
    assert.equal(bad(tplT.id, "marketing"), "invalid_automation");
  });
  test("liste inconnue ou d'une autre organisation refusée", () => {
    const lb = audience.createList(B, { name: "LB" });
    assert.equal(code(() => make({ name: "L1", steps: [{ type: "add_to_list", listId: lb.id }] })), "not_found");
    assert.equal(code(() => make({ name: "L2", steps: [{ type: "add_to_list", listId: 999 }] })), "not_found");
  });
  test("déclencheur : événement connu, ou événement personnalisé bien formé ; filtre limité aux clés prévues", () => {
    assert.ok(make({ name: "T0", kind: "marketing", steps: [{ type: "email", templateId: tplM.id }], triggerEvent: "mon_evenement.special" }), "événement personnalisé hors catalogue mais bien formé : accepté");
    assert.equal(code(() => make({ name: "T1", triggerEvent: "N IMPORTE QUOI !" })), "invalid_automation", "mal formé (espaces, majuscules, ponctuation) : refusé");
    assert.equal(code(() => make({ name: "T2", triggerEvent: "lms.user_registered", triggerFilter: { key: "courseId", value: "1" } })), "invalid_automation");
    assert.ok(make({ name: "T3", triggerEvent: "lms.course_completed", triggerFilter: { key: "courseId", value: "12" } }));
    assert.ok(make({ name: "T4", kind: "marketing", steps: [{ type: "email", templateId: tplM.id }], triggerEvent: "tag.added", triggerFilter: { key: "tag", value: "vip" } }));
    assert.equal(code(() => make({ name: "T5", triggerEvent: "tag.added", triggerFilter: { key: "constructor", value: "x" } })), "invalid_automation");
  });
  test("nom obligatoire et unique ; isolation entre organisations", () => {
    make();
    assert.equal(code(() => make({ name: "bienvenue" })), "duplicate");
    assert.equal(code(() => make({ name: "  " })), "invalid_field");
    assert.equal(auto.listAutomations(B).length, 0);
    assert.equal(auto.getAutomation(B, 1), null);
  });
  test("modification : brouillon ou pause seulement ; l'active doit d'abord être mise en pause", () => {
    const a = live();
    assert.equal(code(() => auto.updateAutomation(A, a.id, { name: "Autre" })), "invalid_state");
    auto.pauseAutomation(A, a.id);
    assert.equal(auto.updateAutomation(A, a.id, { name: "Autre" }).name, "Autre");
    assert.equal(m.db.prepare("SELECT active_steps FROM mk_automations WHERE id = ?").get(a.id).active_steps, "", "les étapes seront figées à la prochaine activation");
  });
});

describe("activation", () => {
  test("contrôle : aucune étape, modèle non prêt, fournisseur incomplet, adresse http, jetons absents", () => {
    const pf = (id, over = {}, ctx = A) => auto.automationPreflight(ctx, id, { workerOn: true, smtpAvailable: true, ...over });
    const empty = make({ name: "Vide", steps: [] });
    assert.ok(pf(empty.id).errors.some((e) => e.code === "no_steps"));
    const a = make({ name: "P", kind: "marketing", steps: [{ type: "email", templateId: tplM.id }] });
    templates.updateTemplate(A, tplM.id, { subject: "" });
    assert.ok(pf(a.id).errors.some((e) => e.code === "template_not_ready"));
    templates.updateTemplate(A, tplM.id, { subject: "S" });
    config.saveSendingConfig(A, { provider: "smtp", from: "a@k.test" });
    assert.ok(pf(a.id, { smtpAvailable: false }).errors.some((e) => e.code === "provider_incomplete"));
    assert.ok(pf(a.id, {}, { ...A, baseUrl: "http://k.test" }).errors.some((e) => e.code === "base_url"));
    assert.ok(pf(a.id, {}, { ...A, tokenKey: "" }).errors.some((e) => e.code === "token_key"));
    assert.equal(pf(a.id).ready, true);
    const tr = make({ name: "T" });
    assert.ok(!pf(tr.id, {}, { ...A, tokenKey: "" }).errors.some((e) => e.code === "token_key"), "le transactionnel n'a pas de lien signé");
  });
  test("avertissements : fournisseur console, worker éteint", () => {
    const a = make();
    const r = auto.automationPreflight(A, a.id, { workerOn: false });
    assert.ok(r.warnings.some((w) => w.code === "provider_console"));
    assert.ok(r.warnings.some((w) => w.code === "worker_off"));
  });
  test("refusée avec les raisons si le contrôle échoue ; réussie : campagnes système créées, étapes figées, invisibles dans la liste des campagnes", () => {
    const bad = make({ name: "Sans étapes", steps: [] });
    assert.equal(code(() => auto.activateAutomation(A, bad.id, { workerOn: true })), "preflight_failed");
    const a = live({ name: "Deux mails", steps: [{ type: "email", templateId: tplT.id }, { type: "wait", amount: 1, unit: "hours" }, { type: "email", templateId: tplT.id }] });
    const row = auto.getAutomation(A, a.id);
    assert.equal(row.status, "active");
    const frozen = JSON.parse(m.db.prepare("SELECT active_steps FROM mk_automations WHERE id = ?").get(a.id).active_steps);
    assert.ok(Number.isInteger(frozen[0].campaignId) && Number.isInteger(frozen[2].campaignId) && frozen[0].campaignId !== frozen[2].campaignId);
    assert.equal(count("mk_campaigns", `kind = 'automation' AND automation_id = ${a.id}`), 2);
    assert.equal(sending.listCampaigns(A).length, 0);
  });
  test("le contenu d'un e-mail est figé à l'activation : modifier le modèle ensuite ne change pas les envois", async () => {
    live();
    const c = contact("nouveau@ex.fr");
    auto.onEvent({ ...A, baseUrl: "https://k.test" }, event("lms.user_registered", c));
    templates.updateTemplate(A, tplT.id, { subject: "CHANGÉ" });
    await step(c);
    assert.ok(!/CHANGÉ/.test(provider.sent[0].subject));
  });
  test("suppression : les campagnes système, les passages et les statistiques disparaissent avec le scénario", () => {
    const a = live();
    const c = contact("x@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    auto.pauseAutomation(A, a.id);
    assert.equal(auto.deleteAutomation(A, a.id), true);
    assert.equal(count("mk_campaigns", "kind = 'automation'"), 0);
    assert.equal(count("mk_automation_runs"), 0);
    assert.equal(auto.deleteAutomation(A, a.id), false);
    assert.equal(code(() => { const b = live({ name: "Encore" }); auto.deleteAutomation(A, b.id); }), "invalid_state", "un scénario actif ne se supprime pas");
  });
});

describe("déclenchement par un événement", () => {
  test("seul un scénario ACTIF dont le déclencheur correspond crée un passage, une seule fois par contact", () => {
    const draft = make({ name: "Brouillon" });
    const active = live({ name: "Actif" });
    const c = contact("a@ex.fr");
    const other = live({ name: "Autre événement", triggerEvent: "lms.order_completed" });
    auto.onEvent(A, event("lms.user_registered", c));
    auto.onEvent(A, event("lms.user_registered", c));
    assert.equal(count("mk_automation_runs", `automation_id = ${active.id}`), 1);
    assert.equal(count("mk_automation_runs", `automation_id = ${draft.id}`), 0);
    assert.equal(count("mk_automation_runs", `automation_id = ${other.id}`), 0);
    assert.equal(count("mk_jobs", "type = 'automation.run'"), 1);
    const c2 = contact("b@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c2));
    assert.equal(count("mk_automation_runs"), 2);
  });
  test("plusieurs déclencheurs (jusqu'à 3) : n'importe lequel démarre le scénario, chacun son propre filtre", () => {
    const a = live({
      name: "Multi", kind: "marketing", steps: [{ type: "email", templateId: tplM.id }], 
      triggerEvent: undefined,
      triggers: [
        { event: "lms.user_registered" },
        { event: "lms.course_completed", filter: { key: "courseId", value: "12" } },
        { event: "demo.custom_event" },
      ],
    });
    const c1 = contact("m1@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c1));
    assert.equal(count("mk_automation_runs", `automation_id = ${a.id}`), 1, "1er déclencheur");
    const c2 = contact("m2@ex.fr");
    auto.onEvent(A, event("lms.course_completed", c2, { courseId: 7 }));
    assert.equal(count("mk_automation_runs", `automation_id = ${a.id}`), 1, "2e déclencheur : mauvais filtre, ignoré");
    auto.onEvent(A, event("lms.course_completed", c2, { courseId: 12 }));
    assert.equal(count("mk_automation_runs", `automation_id = ${a.id}`), 2, "2e déclencheur : bon filtre");
    const c3 = contact("m3@ex.fr");
    auto.onEvent(A, event("demo.custom_event", c3));
    assert.equal(count("mk_automation_runs", `automation_id = ${a.id}`), 3, "3e déclencheur, personnalisé (hors catalogue)");
    // validation : plus de 3, doublon d'événement, tableau vide
    assert.equal(code(() => make({ name: `X${Math.random()}`, triggers: [{ event: "a.b" }, { event: "c.d" }, { event: "e.f" }, { event: "g.h" }] })), "invalid_automation", "4 déclencheurs : refusé");
    assert.equal(code(() => make({ name: `X${Math.random()}`, triggers: [{ event: "a.b" }, { event: "a.b" }] })), "invalid_automation", "même événement deux fois : refusé");
    assert.equal(code(() => make({ name: `X${Math.random()}`, triggers: [] })), "invalid_automation", "aucun déclencheur : refusé");
  });
  test("mise à jour d'un seul déclencheur (compatibilité triggerEvent/triggerFilter) préserve les autres ; mise à jour de la liste complète les remplace tous", () => {
    const a = make({ kind: "marketing", steps: [{ type: "email", templateId: tplM.id }], triggers: [{ event: "lms.user_registered" }, { event: "lms.order_completed" }] });
    auto.updateAutomation(A, a.id, { triggerEvent: "lms.course_enrolled" });
    const reloaded1 = auto.getAutomation(A, a.id);
    assert.deepEqual(reloaded1.triggers.map((t) => t.event), ["lms.course_enrolled", "lms.order_completed"], "seul le 1er a changé");
    auto.updateAutomation(A, a.id, { triggers: [{ event: "tag.added" }] });
    const reloaded2 = auto.getAutomation(A, a.id);
    assert.deepEqual(reloaded2.triggers.map((t) => t.event), ["tag.added"], "liste complète remplacée");
  });
  test("filtre sur une métadonnée : seul l'événement correspondant déclenche", () => {
    live({ name: "Formation 12", triggerEvent: "lms.course_completed", triggerFilter: { key: "courseId", value: "12" } });
    const c = contact("f@ex.fr");
    auto.onEvent(A, event("lms.course_completed", c, { courseId: 7 }));
    assert.equal(count("mk_automation_runs"), 0);
    auto.onEvent(A, event("lms.course_completed", c, { courseId: 12 }));
    assert.equal(count("mk_automation_runs"), 1);
  });
  test("événement sans contact, contact d'une autre organisation, scénario d'une autre organisation : ignorés", () => {
    live();
    auto.onEvent(A, { id: 1, organizationId: 1, name: "lms.user_registered", contactId: null, email: null, metadata: {} });
    auto.onEvent(A, { id: 2, organizationId: 1, name: "lms.user_registered", contactId: 99999, email: "x@ex.fr", metadata: {} });
    const { contact: cb } = audience.upsertContact(B, { email: "b@orga.fr" });
    auto.onEvent(B, event("lms.user_registered", cb, {}, 2));
    assert.equal(count("mk_automation_runs"), 0);
  });
  test("les scénarios en pause ne captent pas les événements (pas de rattrapage automatique)", () => {
    const a = live();
    auto.pauseAutomation(A, a.id);
    auto.onEvent(A, event("lms.user_registered", contact("p@ex.fr")));
    assert.equal(count("mk_automation_runs"), 0);
  });
  test("l'événement de déclenchement alimente les variables du modèle (titre, montant, liens du site)", async () => {
    live({ triggerEvent: "lms.order_completed" });
    const c = contact("v@ex.fr", { first_name: "Vera" });
    auto.onEvent({ ...A, baseUrl: "https://k.test" }, event("lms.order_completed", c, { orderId: 7, orderTotal: "49,00 €", courseTitle: "Final <b>Cut</b>", courseSlug: "final-cut" }));
    await step(c);
    const msg = provider.sent[0];
    assert.match(msg.html, /49,00 €/);
    assert.match(msg.html, /Final &lt;b&gt;Cut&lt;\/b&gt;/);
    assert.match(msg.html, /href="https:\/\/k\.test\/cours\/final-cut"/);
    assert.equal(msg.headers["List-Unsubscribe"], undefined, "un e-mail transactionnel n'a pas de désinscription marketing");
    assert.equal(msg.headers["Auto-Submitted"], "auto-generated");
  });
});

describe("moteur : déroulé d'un scénario", () => {
  test("e-mail → attente d'1 jour → e-mail → étiquette → fin : chaque étape à son heure, reprise après attente", async () => {
    live({ name: "Séquence", kind: "marketing", steps: [{ type: "email", templateId: tplM.id }, { type: "wait", amount: 1, unit: "days" }, { type: "email", templateId: tplM.id }, { type: "add_tag", tag: "Séquence finie" }, { type: "end" }] });
    const c = contact("s@ex.fr", { consent: true, first_name: "Sam" });
    auto.onEvent(A, event("lms.user_registered", c));
    let r = await step(c);
    assert.equal(provider.sent.length, 1);
    assert.deepEqual([r.done, r.waitMs], [false, DAY]);
    assert.equal(runOf(c).status, "running");
    r = await step(c, { now: T0 + DAY - 1000 });
    assert.equal(provider.sent.length, 1, "trop tôt : rien ne bouge");
    assert.ok(r.waitMs > 0);
    r = await step(c, { now: T0 + DAY });
    assert.equal(provider.sent.length, 2);
    assert.equal(r.done, true);
    assert.equal(runOf(c).status, "completed");
    assert.deepEqual(audience.tagsOf(A, c.id).map((t) => t.name), ["Séquence finie"]);
    assert.deepEqual(logs(runOf(c)).map((l) => l.action), ["sent", "wait", "sent", "add_tag", "completed"]);
    assert.match(provider.sent[0].headers["List-Unsubscribe"], /https:\/\/k\.test\/u\//);
  });
  test("chaque étape est enregistrée dans les statistiques de sa campagne système", async () => {
    const a = live({ name: "Stats", kind: "marketing", steps: [{ type: "email", templateId: tplM.id }] });
    const c = contact("t@ex.fr", { consent: true });
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    const s = auto.automationStats(A, a.id);
    assert.deepEqual([s.runs.total, s.runs.completed, s.emails.sent], [1, 1, 1]);
    assert.equal(s.steps[0].sent, 1);
    assert.equal(count("mk_messages", "status = 'sent'"), 1);
  });
  test("condition : sortie (onFalse exit) ou poursuite (continue) ; évaluée à ce moment-là", async () => {
    const seg = { op: "and", rules: [{ field: "tag", cmp: "has", value: "vip" }] };
    live({ name: "Cond exit", steps: [{ type: "condition", definition: seg, onFalse: "exit" }, { type: "email", templateId: tplT.id }] });
    live({ name: "Cond continue", triggerEvent: "lms.order_completed", steps: [{ type: "condition", definition: seg, onFalse: "continue" }, { type: "email", templateId: tplT.id }] });
    const c = contact("c@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    auto.onEvent(A, event("lms.order_completed", c));
    const runs = m.db.prepare("SELECT id, automation_id FROM mk_automation_runs ORDER BY id").all();
    await auto.runAutomation(A, runs[0].id, { provider, now: T0 });
    await auto.runAutomation(A, runs[1].id, { provider, now: T0 });
    assert.equal(provider.sent.length, 1, "seul le scénario « continue » a envoyé");
    assert.equal(m.db.prepare("SELECT status FROM mk_automation_runs WHERE id = ?").get(runs[0].id).status, "exited");
    audience.tagContact(A, c.id, "vip");
    const c2 = contact("c2@ex.fr");
    audience.tagContact(A, c2.id, "vip");
    auto.onEvent(A, event("lms.user_registered", c2));
    await step(c2);
    assert.equal(provider.sent.length, 2);
  });
  test("étiquettes et listes : ajout/retrait exécutés, idempotents, JAMAIS d'événement en cascade (pas de boucle entre scénarios)", async () => {
    live({ name: "Actions", steps: [{ type: "add_tag", tag: "a" }, { type: "add_to_list", listId: list.id }, { type: "remove_tag", tag: "a" }, { type: "add_tag", tag: "b" }, { type: "remove_from_list", listId: list.id }] });
    live({ name: "Écoute tag", kind: "marketing", triggerEvent: "tag.added", steps: [{ type: "add_tag", tag: "boucle" }] });
    const c = contact("act@ex.fr");
    const before = count("mk_events");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    assert.deepEqual(audience.tagsOf(A, c.id).map((t) => t.name), ["b"]);
    assert.equal(audience.listMembers(A, list.id).rows.length, 0);
    assert.equal(count("mk_events"), before, "les actions d'un scénario n'émettent aucun événement");
    assert.equal(count("mk_automation_runs"), 1);
  });
  test("liste supprimée entre-temps : l'étape est consignée en échec, le scénario continue", async () => {
    live({ name: "Liste morte", steps: [{ type: "add_to_list", listId: list.id }, { type: "add_tag", tag: "apres" }] });
    const c = contact("lm@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    audience.deleteList(A, list.id);
    await step(c);
    assert.deepEqual(logs(runOf(c)).map((l) => l.action), ["failed", "add_tag", "completed"]);
  });
  test("contact effacé : ses passages disparaissent avec lui", () => {
    live();
    const c = contact("e@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    audience.deleteContact(A, c.id);
    assert.equal(count("mk_automation_runs"), 0);
  });
  test("split (tirage aléatoire) : branche A ou B selon le pourcentage, jamais de faux hasard non testable", async () => {
    live({ name: "Tirage", steps: [{ type: "split", percentage: 50, onA: 2, onB: 4 }, { type: "end" }, { type: "add_tag", tag: "A" }, { type: "end" }, { type: "add_tag", tag: "B" }] });
    const origRandom = Math.random;
    try {
      Math.random = () => 0.1; // < 50 % → A
      const cA = contact("split-a@ex.fr");
      auto.onEvent(A, event("lms.user_registered", cA));
      await step(cA);
      assert.deepEqual(audience.tagsOf(A, cA.id).map((t) => t.name), ["A"]);
      assert.match(logs(runOf(cA))[0].detail, /50% → A/);

      Math.random = () => 0.9; // >= 50 % → B
      const cB = contact("split-b@ex.fr");
      auto.onEvent(A, event("lms.user_registered", cB));
      await step(cB);
      assert.deepEqual(audience.tagsOf(A, cB.id).map((t) => t.name), ["B"]);
    } finally {
      Math.random = origRandom;
    }
  });
  test("mettre à jour un champ : champ texte du contact et propriété personnalisée ; champ invalide refusé à la validation", async () => {
    audience.defineProperty(A, { key: "niveau", label: "Niveau", type: "text" });
    live({ name: "MAJ champ", steps: [{ type: "update_field", field: "company", value: "Nouvelle société" }, { type: "update_field", field: "property:niveau", value: "avancé" }] });
    const c = contact("maj@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    assert.equal(audience.getContact(A, c.id).company, "Nouvelle société");
    assert.equal(audience.getContactProperties(A, c.id).niveau, "avancé");
    assert.equal(code(() => make({ name: `X${Math.random()}`, steps: [{ type: "update_field", field: "email", value: "x@ex.fr" }] })), "invalid_automation", "l'e-mail ne se change pas par une automatisation");
    assert.equal(code(() => make({ name: `X${Math.random()}`, steps: [{ type: "update_field", field: "status", value: "subscribed" }] })), "invalid_automation", "le statut ne se change pas par une automatisation");
  });
  test("attendre jusqu'à un événement : reprend au délai maximal si rien n'arrive, ou plus tôt si l'événement correspond", async () => {
    live({ name: "Attente élève A", steps: [{ type: "wait_for_event", event: "lms.course_completed", amount: 7, unit: "days" }, { type: "add_tag", tag: "a-continué" }] });
    const cTimeout = contact("timeout@ex.fr");
    auto.onEvent(A, event("lms.user_registered", cTimeout));
    let r = await step(cTimeout);
    assert.deepEqual([r.done, r.waitMs], [false, 7 * DAY]);
    r = await step(cTimeout, { now: T0 + DAY }); // bien avant le délai : rien
    assert.equal(runOf(cTimeout).status, "running");
    assert.deepEqual(audience.tagsOf(A, cTimeout.id).map((t) => t.name), []);
    r = await step(cTimeout, { now: T0 + 7 * DAY }); // délai atteint : reprend quand même
    assert.equal(runOf(cTimeout).status, "completed");
    assert.deepEqual(audience.tagsOf(A, cTimeout.id).map((t) => t.name), ["a-continué"]);

    const cEarly = contact("early@ex.fr");
    auto.onEvent(A, event("lms.user_registered", cEarly));
    await step(cEarly);
    assert.equal(runOf(cEarly).wake_at, T0 + 7 * DAY, "attend le délai maximal tant que rien n'arrive");
    auto.onEvent(A, event("lms.review_posted", cEarly)); // événement SANS rapport : ignoré
    assert.equal(runOf(cEarly).wake_at, T0 + 7 * DAY);
    auto.onEvent(A, event("lms.course_completed", cEarly)); // l'événement attendu : réveil anticipé
    assert.equal(runOf(cEarly).wake_at, T0, "ramené à maintenant, plus besoin d'attendre le délai maximal");
    await step(cEarly, { now: T0 });
    assert.equal(runOf(cEarly).status, "completed");
    assert.deepEqual(audience.tagsOf(A, cEarly.id).map((t) => t.name), ["a-continué"]);
  });
});

describe("conformité dans un scénario", () => {
  test("MARKETING : contact sans consentement → sort du scénario, rien n'est envoyé", async () => {
    live({ name: "M1", kind: "marketing", steps: [{ type: "email", templateId: tplM.id }] });
    const c = contact("inconnu@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    assert.equal(provider.sent.length, 0);
    assert.deepEqual([runOf(c).status, runOf(c).last_error], ["exited", "not_subscribed"]);
  });
  test("MARKETING : désinscription ENTRE deux étapes → le contact sort, aucun envoi ultérieur", async () => {
    live({ name: "M2", kind: "marketing", steps: [{ type: "email", templateId: tplM.id }, { type: "wait", amount: 1, unit: "days" }, { type: "email", templateId: tplM.id }] });
    const c = contact("des@ex.fr", { consent: true });
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    compliance.unsubscribe(A, c.id, { source: "link" });
    await step(c, { now: T0 + DAY });
    assert.equal(provider.sent.length, 1);
    assert.deepEqual([runOf(c).status, runOf(c).last_error], ["exited", "unsubscribed"]);
  });
  test("MARKETING : adresse bloquée → sortie", async () => {
    live({ name: "M3", kind: "marketing", steps: [{ type: "email", templateId: tplM.id }] });
    const c = contact("bl@ex.fr", { consent: true });
    compliance.addSuppression(A, { email: "bl@ex.fr", reason: "complained" });
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    assert.equal(provider.sent.length, 0);
    assert.equal(runOf(c).last_error, "suppressed");
  });
  test("TRANSACTIONNEL : envoyé même sans consentement marketing ni abonnement", async () => {
    live();
    const c = contact("nouvel-eleve@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    assert.equal(provider.sent.length, 1);
    assert.equal(audience.getContact(A, c.id).status, "unknown", "recevoir un e-mail transactionnel ne donne aucun consentement");
  });
  test("TRANSACTIONNEL : même désinscrit du marketing il le reçoit ; mais une adresse en liste de suppression est respectée", async () => {
    live();
    const c1 = contact("des-marketing@ex.fr", { consent: true });
    compliance.unsubscribe(A, c1.id, { source: "link" });
    const c2 = contact("rebond@ex.fr");
    compliance.addSuppression(A, { email: "rebond@ex.fr", reason: "bounced" });
    auto.onEvent(A, event("lms.user_registered", c1));
    auto.onEvent(A, event("lms.user_registered", c2));
    await step(c1); await step(c2);
    assert.deepEqual(provider.sent.map((s) => s.to), ["des-marketing@ex.fr"]);
    assert.ok(logs(runOf(c2)).some((l) => l.action === "skipped" && /suppress/.test(l.detail)));
    assert.equal(runOf(c2).status, "completed");
  });
});

describe("pannes, reprises, garde-fous d'envoi", () => {
  const setup = (over = {}) => { m.db.prepare("UPDATE mk_automations SET status = 'paused'").run(); live({ name: `S${Math.random()}`, ...over }); const c = contact(`c${Math.random().toString(36).slice(2, 6)}@ex.fr`); auto.onEvent(A, event("lms.user_registered", c)); return c; };
  test("échec temporaire : nouvelle tentative plus tard puis succès ; 3 échecs : étape consignée en échec et le scénario continue", async () => {
    const c = setup({ steps: [{ type: "email", templateId: tplT.id }, { type: "add_tag", tag: "apres" }] });
    const flaky = scripted((msg, n) => { if (n <= 1) throw new SendError("temporary"); return { providerMessageId: "ok" }; });
    let r = await step(c, { provider: flaky });
    assert.ok(r.waitMs > 0);
    assert.equal(runOf(c).step_index, 0);
    r = await step(c, { provider: flaky, now: T0 + 10 * 60000 });
    assert.equal(runOf(c).status, "completed");

    const c2 = setup({ steps: [{ type: "email", templateId: tplT.id }, { type: "add_tag", tag: "apres2" }] });
    const down = scripted(() => { throw new SendError("temporary"); });
    for (let i = 0; i < 4; i++) await step(c2, { provider: down, now: T0 + i * H });
    assert.equal(runOf(c2).status, "completed");
    assert.ok(logs(runOf(c2)).some((l) => l.action === "failed"));
    assert.deepEqual(audience.tagsOf(A, c2.id).map((t) => t.name), ["apres2"]);
  });
  test("message réservé par un envoi interrompu : jamais renvoyé, marqué échoué, le scénario continue (audit B4)", async () => {
    const c = setup({ steps: [{ type: "email", templateId: tplT.id }, { type: "add_tag", tag: "apres-crash" }] });
    const campaign = m.db.prepare("SELECT id FROM mk_campaigns WHERE automation_id IS NOT NULL ORDER BY id DESC LIMIT 1").get();
    m.db.prepare("INSERT INTO mk_messages (organization_id, campaign_id, contact_id, email, provider, status, claimed_at) VALUES (1, ?, ?, ?, 'fake', 'pending', '2026-01-01')").run(campaign.id, c.id, c.email);
    const spy = scripted(() => ({ providerMessageId: "ne-doit-pas-partir" }));
    await step(c, { provider: spy });
    assert.equal(spy.sent.length, 0, "aucun renvoi après une interruption");
    assert.equal(m.db.prepare("SELECT status FROM mk_messages WHERE contact_id = ?").get(c.id).status, "failed");
    assert.deepEqual(audience.tagsOf(A, c.id).map((t) => t.name), ["apres-crash"]);
  });
  test("une erreur temporaire lève la réservation : la reprise peut envoyer", async () => {
    const c = setup();
    await step(c, { provider: scripted(() => { throw new SendError("temporary"); }) });
    assert.equal(m.db.prepare("SELECT claimed_at FROM mk_messages WHERE contact_id = ?").get(c.id).claimed_at, null);
    const good = ok();
    await step(c, { provider: good, now: T0 + 10 * 60000 });
    assert.equal(good.sent.length, 1);
  });
  test("adresse refusée : suppression + sortie ; refus permanent : étape échouée puis suite ; limitation : attente demandée", async () => {
    const c = setup();
    await step(c, { provider: scripted(() => { throw new SendError("recipient_rejected"); }) });
    assert.equal(runOf(c).status, "exited");
    assert.equal(audience.getContact(A, c.id).status, "bounced");
    const c2 = setup({ steps: [{ type: "email", templateId: tplT.id }, { type: "add_tag", tag: "z" }] });
    await step(c2, { provider: scripted(() => { throw new SendError("permanent"); }) });
    assert.equal(runOf(c2).status, "completed");
    const c3 = setup();
    const r = await step(c3, { provider: scripted(() => { throw new SendError("rate_limited", { retryAfterMs: 9000 }); }) });
    assert.equal(r.waitMs, 9000);
    assert.equal(runOf(c3).status, "running");
  });
  test("configuration refusée : le scénario est mis en pause avec un message, le passage n'est pas perdu", async () => {
    const a = live({ name: "Config" });
    const c = contact("cfg@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    const r = await step(c, { provider: scripted(() => { throw new SendError("config"); }) });
    assert.equal(r.paused, true);
    assert.equal(auto.getAutomation(A, a.id).status, "paused");
    assert.match(auto.getAutomation(A, a.id).error, /configuration|clé|identifiants/i);
    assert.equal(runOf(c).status, "running");
  });
  test("erreur inattendue sur une étape : consignée, le scénario continue", async () => {
    const c = setup({ steps: [{ type: "email", templateId: tplT.id }, { type: "add_tag", tag: "ok" }] });
    await step(c, { provider: scripted(() => { throw new TypeError("bug"); }) });
    assert.equal(runOf(c).status, "completed");
    assert.ok(logs(runOf(c)).some((l) => l.action === "failed"));
  });
  test("REPRISE après plantage : rejouer une étape déjà envoyée n'envoie rien de plus", async () => {
    const c = setup();
    await step(c);
    assert.equal(provider.sent.length, 1);
    m.db.prepare("UPDATE mk_automation_runs SET status = 'running', step_index = 0, finished_at = NULL WHERE contact_id = ?").run(c.id);
    await step(c);
    assert.equal(provider.sent.length, 1);
    assert.ok(logs(runOf(c)).some((l) => l.action === "already_sent"));
  });
  test("plafond quotidien : le marketing attend le lendemain, le transactionnel n'est jamais bloqué par le plafond", async () => {
    config.saveSendingConfig(A, { provider: "console", dailyLimit: 1 });
    live({ name: "Tr", steps: [{ type: "email", templateId: tplT.id }] });
    live({ name: "Mk", kind: "marketing", triggerEvent: "lms.order_completed", steps: [{ type: "email", templateId: tplM.id }] });
    const a = contact("x1@ex.fr", { consent: true }); const b = contact("x2@ex.fr", { consent: true });
    auto.onEvent(A, event("lms.user_registered", a)); auto.onEvent(A, event("lms.user_registered", b));
    auto.onEvent(A, event("lms.order_completed", contact("m1@ex.fr", { consent: true })));
    await step(a); await step(b);
    assert.equal(provider.sent.length, 2, "deux transactionnels malgré un plafond de 1");
    const mk = contact("m1@ex.fr");
    const r = await step(mk);
    assert.ok(r.waitMs > 0);
    assert.equal(provider.sent.length, 2, "le message marketing attend le lendemain");
  });
  test("pause puis reprise : rien ne bouge en pause, tout reprend ensuite", async () => {
    const a = live({ name: "PR", steps: [{ type: "wait", amount: 1, unit: "hours" }, { type: "email", templateId: tplT.id }] });
    const c = contact("pr@ex.fr");
    auto.onEvent(A, event("lms.user_registered", c));
    await step(c);
    auto.pauseAutomation(A, a.id);
    const r = await step(c, { now: T0 + 2 * H });
    assert.equal(r.paused, true);
    assert.equal(provider.sent.length, 0);
    const before = count("mk_jobs", "type = 'automation.run'");
    auto.resumeAutomation(A, a.id);
    assert.ok(count("mk_jobs", "type = 'automation.run'") > before, "les passages en cours sont relancés");
    await step(c, { now: T0 + 2 * H });
    assert.equal(provider.sent.length, 1);
  });
});

describe("chaîne complète via le worker", () => {
  test("compte créé dans le LMS → pont → événement → scénario → e-mail envoyé", async () => {
    addLmsSchema(m.db);
    const shared = createProvider({ provider: "console" }, { log: quiet });
    const env = { ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test" };
    m.bus.on("*", auto.eventHandler({ db: m.db, settings: A.settings, env, log: quiet }));
    live({ name: "Chaîne" });
    bridge.syncLmsEvents(A); // initialise
    m.db.prepare("INSERT INTO users (username, email, role) VALUES ('nouvelle', 'nouvelle@ex.fr', 'etudiant')").run();
    bridge.syncLmsEvents(A);
    const handlers = { ...m.bus.jobHandlers(), ...auto.jobHandlers({ db: m.db, bus: m.bus, settings: A.settings, env, providerFor: () => shared, now: () => T0 + 5000, log: quiet }) };
    const worker = createWorker({ db: m.db, handlers, workerId: "t", log: quiet, now: () => T0 + 5000 });
    await worker.drain();
    assert.deepEqual(shared.sent.map((s) => s.to), ["nouvelle@ex.fr"]);
    assert.equal(count("mk_automation_runs", "status = 'completed'"), 1);
  });
});

describe("scénario transactionnel : réservé aux événements de service (audit B6)", () => {
  const create = (kind, triggerEvent) => code(() => auto.createAutomation(A, { name: `T${Math.random()}`, kind, triggerEvent, steps: [{ type: "email", templateId: kind === "transactional" ? tplT.id : tplM.id }] }));
  test("événements de service acceptés en transactionnel", () => {
    for (const ev of ["lms.user_registered", "lms.order_completed", "purchase.completed", "lms.certificate_issued", "payment.failed", "order.refunded"]) assert.equal(create("transactional", ev), null, ev);
  });
  test("relance ou promotion refusées en transactionnel, acceptées en marketing", () => {
    for (const ev of ["cart.abandoned", "checkout.abandoned", "lms.favorite_added", "tag.added", "contact.score_level_changed", "funnel.abandoned"]) {
      assert.equal(create("transactional", ev), "invalid_automation", ev);
    }
    assert.equal(create("marketing", "cart.abandoned"), null);
  });
  test("modifier le déclencheur d'un scénario transactionnel vers une relance est refusé", () => {
    const a = make({ name: `Mod${Math.random()}` });
    assert.equal(code(() => auto.updateAutomation(A, a.id, { triggerEvent: "cart.abandoned" })), "invalid_automation");
    assert.equal(code(() => auto.updateAutomation(A, a.id, { triggers: [{ event: "lms.favorite_added", filter: {} }] })), "invalid_automation");
  });
});
