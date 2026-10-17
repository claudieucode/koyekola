// Site Web et Tunnels — phase 10 : les visites d'un CONTACT CONNU (mesure d'audience acceptée) déclenchent des
// automatisations : page visitée, étape de tunnel atteinte, tunnel terminé. Une seule fois par page et par visite ;
// « tunnel terminé » une seule fois par contact. Visiteur anonyme : aucun déclencheur. Filtres choisis dans des listes
// réelles (pages, étapes, tunnels, formulaires).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const templates = require("../src/marketing/templates");
const auto = require("../src/marketing/automations");
const funnels = require("../src/marketing/funnels");
const { emitVisitEvents } = require("../src/marketing/visitors/triggers");
const { startServer, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";

describe("déclencheurs (sans serveur)", () => {
  test("page visitée, étape atteinte, tunnel terminé : une fois par visite, « terminé » une fois par contact", () => {
    const { db, A } = freshMarketing();
    const f = funnels.createFunnel(A, { name: "Lettre", template: "newsletter" });
    const [s1, s2] = f.steps;
    const { contact } = audience.upsertContact(A, { email: "visite@ex.fr" });
    const names = () => db.prepare("SELECT name, metadata FROM mk_events WHERE contact_id = ? AND name <> 'contact.created' ORDER BY id").all(contact.id).map((e) => [e.name, JSON.parse(e.metadata)]);
    emitVisitEvents(A, { contactId: contact.id, sessionId: "sessionAAAA", pageViews: [{ pageId: s1.pageId }] });
    assert.deepEqual(names().map((e) => e[0]), ["page.visited", "funnel.entered", "funnel.step_reached"]);
    assert.equal(names()[2][1].stepId, String(s1.id));
    emitVisitEvents(A, { contactId: contact.id, sessionId: "sessionAAAA", pageViews: [{ pageId: s1.pageId }] });
    assert.equal(names().length, 3, "même visite : rien de nouveau");
    emitVisitEvents(A, { contactId: contact.id, sessionId: "sessionAAAA", pageViews: [{ pageId: s2.pageId }] });
    assert.deepEqual(names().map((e) => e[0]).slice(3), ["page.visited", "funnel.step_reached", "funnel.step.completed", "funnel.completed"]);
    emitVisitEvents(A, { contactId: contact.id, sessionId: "sessionBBBB", pageViews: [{ pageId: s2.pageId }] });
    assert.equal(names().filter((e) => e[0] === "funnel.completed").length, 1, "tunnel terminé : une seule fois");
    assert.equal(names().filter((e) => e[0] === "page.visited").length, 3, "nouvelle visite : la page compte de nouveau");
    funnels.archiveFunnel(A, f.id);
    emitVisitEvents(A, { contactId: contact.id, sessionId: "sessionCCCC", pageViews: [{ pageId: s1.pageId }] });
    assert.equal(names().filter((e) => e[0] === "funnel.step_reached").length, 3, "tunnel archivé : plus d'étape");
    assert.equal(emitVisitEvents(A, { contactId: 999, sessionId: "sessionDDDD", pageViews: [{ pageId: s1.pageId }] }), 0, "contact inconnu : rien");
  });

  test("automatisation filtrée sur une étape : seul le contact qui atteint CETTE étape entre dans le scénario", () => {
    const { db, A } = freshMarketing();
    templates.setOrgAddress(A, "12 rue des Écoles, Paris");
    const tpl = templates.createTemplate(A, { name: "Merci", kind: "transactional", subject: "Merci", blocks: [{ type: "text", markdown: "Merci de votre visite." }] });
    const f = funnels.createFunnel(A, { name: "Webinaire", template: "webinaire" });
    const [s1, s2] = f.steps;
    assert.ok(auto.TRIGGERS["funnel.step_reached"]);
    const a = auto.createAutomation(A, { name: "Relance étape 2", kind: "transactional", triggerEvent: "funnel.step_reached", triggerFilter: { key: "stepId", value: String(s2.id) }, steps: [{ type: "email", templateId: tpl.id }] });
    auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
    const c1 = audience.upsertContact(A, { email: "un@ex.fr" }).contact;
    const c2 = audience.upsertContact(A, { email: "deux@ex.fr" }).contact;
    emitVisitEvents(A, { contactId: c1.id, sessionId: "sessionAAAA", pageViews: [{ pageId: s1.pageId }] });
    emitVisitEvents(A, { contactId: c2.id, sessionId: "sessionBBBB", pageViews: [{ pageId: s2.pageId }] });
    for (const e of db.prepare("SELECT * FROM mk_events WHERE name = 'funnel.step_reached'").all()) {
      auto.onEvent(A, { id: e.id, organizationId: 1, name: e.name, contactId: e.contact_id, email: e.email, metadata: JSON.parse(e.metadata) });
    }
    const runs = db.prepare("SELECT contact_id FROM mk_automation_runs WHERE automation_id = ?").all(a.id).map((r) => r.contact_id);
    assert.deepEqual(runs, [c2.id]);
  });
});

describe("vrai serveur", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const beacon = (vid, events) => fetch(`${srv.base}/w/e`, { method: "POST", headers: { "Content-Type": "application/json", cookie: `kw_consent=1; kw_vid=${vid}`, "User-Agent": UA, Origin: srv.base }, body: JSON.stringify({ s: "sessionsession", e: events }) });

  test("visite suivie d'un contact connu → événements ; visiteur anonyme → rien ; filtres proposés dans l'éditeur", async () => {
    const id = Number((await boss.post("/marketing/tunnels", { name: "Guide offert", template: "aimant" })).location.match(/(\d+)$/)[1]);
    const pageId = db.prepare("SELECT page_id FROM mk_funnel_steps WHERE funnel_id = ? ORDER BY position").get(id).page_id;
    db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(pageId);
    const slug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(pageId).slug;
    const anon = "d".repeat(32) + "." + String(Date.now() - 1000);
    await beacon(anon, [{ t: "page_view", p: `/p/${slug}` }]);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_events WHERE name = 'page.visited'").get().n, 0, "anonyme : aucun déclencheur");
    const known = "e".repeat(32) + "." + String(Date.now() - 1000);
    await beacon(known, [{ t: "session_start", p: "/" }]);
    const contact = db.prepare("INSERT INTO mk_contacts (organization_id, email) VALUES (1, 'connu@ex.fr') RETURNING id").get();
    db.prepare("UPDATE mk_web_visitors SET contact_id = ? WHERE id = ?").run(contact.id, known);
    await beacon(known, [{ t: "page_view", p: `/p/${slug}` }, { t: "page_view", p: `/p/${slug}` }]);
    const evts = db.prepare("SELECT name FROM mk_events WHERE contact_id = ? AND name <> 'contact.created' ORDER BY id").all(contact.id).map((e) => e.name);
    assert.deepEqual(evts, ["page.visited", "funnel.entered", "funnel.step_reached"]);
    // Éditeur d'automatisation : listes réelles pour les filtres
    const created = await boss.post("/marketing/automatisations", { name: "Visite", kind: "marketing", trigger_event: "page.visited" });
    const aid = Number(created.location.match(/(\d+)/)[1]);
    const html = (await boss.get(`/marketing/automatisations/${aid}`)).text;
    assert.match(html, /"funnelSteps":\[\["\d+","Guide offert — étape 1 : Capture"\]/);
    assert.match(html, /"page.visited":\{"label":"Un contact visite une page \(Site Web, Tunnels\)"/);
    // Le tunnel affiche les scénarios qui le concernent
    const step = db.prepare("SELECT id FROM mk_funnel_steps WHERE funnel_id = ? ORDER BY position").get(id).id;
    db.prepare("UPDATE mk_automations SET triggers = ? WHERE id = ?").run(JSON.stringify([{ event: "funnel.step_reached", filter: { key: "stepId", value: String(step) } }]), aid);
    assert.match((await boss.get(`/marketing/tunnels/${id}`)).text, new RegExp(`href="/marketing/automatisations/${aid}">Visite</a>`));
  });
});
