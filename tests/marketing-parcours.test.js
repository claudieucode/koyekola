// Marketing — parcours tout prêts (point 3 du plan de parité Mailchimp) : chaque parcours disponible crée un vrai
// scénario en brouillon, activable tel quel, qui se déroule réellement ; les parcours impossibles ne se créent jamais.
const { test, describe, beforeEach, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY, T0, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const auto = require("../src/marketing/automations");
const journeys = require("../src/marketing/automations/journeys");
const { createProvider } = require("../src/marketing/sending/providers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const DAY = 86400000;
let m, A, provider;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const runOf = (c) => m.db.prepare("SELECT * FROM mk_automation_runs WHERE contact_id = ?").get(c.id);
const step = (c, now) => auto.runAutomation(A, runOf(c).id, { provider, now });
const event = (name, c, metadata = {}) => ({ id: Math.floor(Math.random() * 1e9), organizationId: 1, name, contactId: c.id, email: c.email, metadata });
// Événement réellement enregistré (utilisé par les conditions « … dans les N derniers jours »)
const recorded = (name, c, at) => m.db.prepare("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, metadata, idempotency_key, created_at) VALUES (1, ?, ?, ?, 'lms', ?, '{}', ?, ?)").run(name, c.email, c.id, at, `t:${Math.random()}`, at);
const contact = (email, consent = false) => {
  const { contact: c } = audience.upsertContact(A, { email, first_name: "Awa" });
  if (consent) compliance.recordConsent(A, c.id, { source: "form", textShown: "Oui" });
  return c;
};
const activate = (key) => { const a = journeys.createJourney(A, key); auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true }); return a; };

describe("parcours : création", () => {
  beforeEach(() => {
    m = freshMarketing(); A = m.A;
    templates.setOrgAddress(A, "12 rue des Écoles, Paris");
    provider = createProvider({ provider: "console" }, { log: quiet });
  });

  test("chaque parcours disponible crée un brouillon complet, ses e-mails prêts, et s'active sans retouche", () => {
    const available = journeys.JOURNEYS.filter((j) => !j.unavailable);
    assert.equal(available.length, 7);
    for (const j of available) {
      const a = journeys.createJourney(A, j.key);
      assert.equal(a.status, "draft", j.key);
      assert.equal(a.kind, j.kind);
      assert.deepEqual(a.triggers.map((t) => t.event), [j.trigger.event]);
      const emails = a.steps.filter((s) => s.type === "email");
      assert.equal(emails.length, j.emails("https://k.test").length);
      for (const s of emails) {
        const t = templates.getTemplate(A, s.templateId);
        assert.equal(t.kind, j.kind, "modèle du même type que le scénario");
        assert.ok(templates.templateReadiness(A, t.id).ready, `${j.key} : e-mail « ${t.name} » prêt`);
        assert.doesNotMatch(JSON.stringify(t.blocks), /exemple\.(fr|invalid)/, "aucun lien d'exemple à remplacer");
      }
      const pre = auto.automationPreflight(A, a.id, { workerOn: true, smtpAvailable: true });
      assert.equal(pre.ready, true, `${j.key} : ${JSON.stringify(pre.errors)}`);
    }
    assert.ok(m.db.prepare("SELECT 1 FROM mk_audit_logs WHERE action = 'automation.journey_created'").get());
  });

  test("créer deux fois le même parcours : copies numérotées, aucun conflit de nom", () => {
    const a1 = journeys.createJourney(A, "suivi-achat");
    const a2 = journeys.createJourney(A, "suivi-achat");
    assert.equal(a1.name, "Parcours · Suivi après achat");
    assert.equal(a2.name, "Parcours · Suivi après achat (2)");
    assert.notDeepEqual(a1.steps[0].templateId, a2.steps[0].templateId, "chaque copie a ses propres e-mails");
  });

  test("parcours indisponibles (donnée non enregistrée par le site) : jamais créés ; clé inconnue refusée", () => {
    for (const key of ["panier-abandonne", "anniversaire", "bienvenue-sms"]) assert.equal(code(() => journeys.createJourney(A, key)), "invalid_state");
    assert.equal(code(() => journeys.createJourney(A, "inexistant")), "not_found");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_automations").get().n, 0);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_templates").get().n, 0, "aucun modèle orphelin");
  });

  test("tout ou rien : si le scénario ne peut pas être créé, aucun modèle n'est laissé", () => {
    m.db.exec("CREATE TRIGGER casse BEFORE INSERT ON mk_automations BEGIN SELECT RAISE(ABORT, 'refus (test)'); END");
    assert.throws(() => journeys.createJourney(A, "bienvenue-abonnes"));
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_templates").get().n, 0);
  });
});

describe("parcours : déroulé réel", () => {
  beforeEach(() => {
    m = freshMarketing(); A = m.A;
    templates.setOrgAddress(A, "12 rue des Écoles, Paris");
    provider = createProvider({ provider: "console" }, { log: quiet });
  });

  test("Suivi après achat : merci tout de suite ; aide au démarrage seulement sans leçon terminée en 3 jours", async () => {
    activate("suivi-achat");
    const order = { orderId: 1024, orderTotal: "49,00 €", items: [{ courseId: 3, title: "Photo" }] };
    const lazy = contact("lazy@ex.fr"); // transactionnel : pas besoin de consentement marketing
    auto.onEvent(A, event("lms.order_completed", lazy, order));
    await step(lazy, T0);
    assert.equal(provider.sent.length, 1);
    assert.match(provider.sent[0].html, /1024/);
    assert.match(provider.sent[0].html, /https:\/\/k\.test\/mes-cours/, "vrai lien vers l'espace élève");
    await step(lazy, T0 + 3 * DAY);
    assert.equal(provider.sent.length, 2, "aucune leçon : e-mail d'aide");
    assert.match(provider.sent[1].subject, /Besoin d'aide/);
    assert.equal(runOf(lazy).status, "completed");

    const active = contact("active@ex.fr");
    auto.onEvent(A, event("lms.order_completed", active, order));
    await step(active, T0);
    recorded("lms.lesson_completed", active, T0 + DAY);
    auto.onEvent(A, event("lms.lesson_completed", active)); // réveil anticipé de « Attendre jusqu'à »
    await step(active, T0 + DAY);
    assert.equal(provider.sent.length, 3, "un seul e-mail pour l'élève actif");
    assert.equal(runOf(active).status, "exited");
  });

  test("Reconquérir les inactifs : démarre sur l'étiquette, « réactivé » si ouvert, sinon « inactif » ; l'étiquette de départ est retirée", async () => {
    activate("reconquete");
    const silent = contact("silent@ex.fr", true);
    audience.tagContact(A, silent.id, "a-relancer");
    auto.onEvent(A, event("tag.added", silent, { tag: "a-relancer" }));
    await step(silent, T0);
    await step(silent, T0 + 5 * DAY);
    await step(silent, T0 + 12 * DAY);
    assert.equal(provider.sent.length, 2);
    assert.deepEqual(audience.tagsOf(A, silent.id).map((t) => t.name).sort(), ["inactif"]);

    const other = contact("other@ex.fr", true);
    auto.onEvent(A, event("tag.added", other, { tag: "autre" }));
    assert.equal(runOf(other), undefined, "seule l'étiquette « a-relancer » déclenche le parcours");
  });

  test("Bienvenue aux nouveaux élèves (marketing) : rien sans consentement ; relance seulement sans inscription", async () => {
    activate("bienvenue-eleves");
    const noConsent = contact("nc@ex.fr");
    auto.onEvent(A, event("lms.user_registered", noConsent));
    await step(noConsent, T0);
    assert.equal(provider.sent.length, 0, "marketing : jamais sans consentement");

    const learner = contact("learner@ex.fr", true);
    auto.onEvent(A, event("lms.user_registered", learner));
    await step(learner, T0);
    recorded("lms.course_enrolled", learner, T0 + DAY);
    await step(learner, T0 + 3 * DAY);
    assert.equal(provider.sent.length, 1, "déjà inscrit à une formation : pas de relance");
    assert.equal(runOf(learner).status, "exited");
  });
});

describe("parcours : pages et droits", () => {
  let srv, boss;
  const member = async (role) => {
    const c = await newStudent(srv);
    const db = srv.db();
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)").run(c.email, role);
    return c;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
  });
  after(() => srv.stop());

  test("galerie : parcours disponibles avec aperçu et bouton ; indisponibles avec la raison, sans bouton", async () => {
    const r = await boss.get("/marketing/automatisations/parcours");
    assert.equal(r.status, 200);
    assert.equal((r.text.match(/Utiliser ce parcours<span/g) || []).length, 7);
    assert.match(r.text, /Panier abandonné/);
    assert.match(r.text, /Pas encore disponible/);
    assert.doesNotMatch(r.text, /action="\/marketing\/automatisations\/parcours\/panier-abandonne"/);
    // Accessible depuis le menu et depuis la page des automatisations
    assert.match((await boss.get("/marketing/automatisations")).text, /href="\/marketing\/automatisations\/parcours"/);
  });

  test("aperçu : déclencheur, étapes et e-mails réels ; 404 si inconnu", async () => {
    const r = await boss.get("/marketing/automatisations/parcours/formation-terminee");
    assert.equal(r.status, 200);
    assert.match(r.text, /Un élève termine une formation/);
    assert.match(r.text, /Étape 3/);
    assert.match(r.text, /Demande d&#39;avis|Demande d'avis/);
    assert.equal((await boss.get("/marketing/automatisations/parcours/inconnu")).status, 404);
  });

  test("« Utiliser ce parcours » : brouillon ouvert dans l'éditeur, rien d'envoyé", async () => {
    const r = await boss.post("/marketing/automatisations/parcours/relance-favori", {});
    assert.equal(r.status, 302);
    assert.match(r.location, /^\/marketing\/automatisations\/\d+$/);
    const page = await boss.get(r.location);
    assert.equal(page.status, 200);
    assert.match(page.text, /Parcours créé en brouillon/);
    const db = srv.db();
    const a = db.prepare("SELECT status, kind FROM mk_automations WHERE name = 'Parcours · Relance après un favori'").get();
    assert.deepEqual([a.status, a.kind], ["draft", "marketing"]);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_messages").get().n, 0);
  });

  test("droits : un lecteur voit la galerie mais ne crée rien ; un élève n'y a pas accès", async () => {
    const viewer = await member("viewer");
    assert.equal((await viewer.get("/marketing/automatisations/parcours")).status, 200);
    assert.doesNotMatch((await viewer.get("/marketing/automatisations/parcours")).text, /Utiliser ce parcours<span/);
    assert.equal((await viewer.post("/marketing/automatisations/parcours/suivi-achat", {})).status, 403);
    const student = await newStudent(srv);
    assert.equal((await student.get("/marketing/automatisations/parcours")).status, 403);
  });
});
