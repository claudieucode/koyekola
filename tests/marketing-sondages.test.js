// Marketing — sondages (point 7 de la parité Mailchimp) : questions validées, réponses rattachées au contact par le
// lien personnel signé des e-mails, étiquettes automatiques, inscription seulement avec case cochée, rapport et export.
const { test, describe, beforeEach, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const sending = require("../src/marketing/sending");
const surveys = require("../src/marketing/surveys");
const { createProvider } = require("../src/marketing/sending/providers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let m, A, sv;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const tagsOf = (id) => audience.tagsOf(A, id).map((t) => t.name).sort();
const QUESTIONS = [
  { type: "range", text: "Satisfaction", required: true, scale: 5, low: "Pas du tout", high: "Tout à fait" },
  { type: "single", text: "Recommanderiez-vous ?", required: false, options: "Oui | ambassadeur\nNon", other: true },
  { type: "multiple", text: "Sujets", required: false, options: "Photo | photo\nVidéo | video\nSon" },
  { type: "longtext", text: "Remarque", required: false },
];
function setup() {
  m = freshMarketing(); A = m.A;
  templates.setOrgAddress(A, "12 rue des Écoles, Paris");
  sv = surveys.createSurvey(A, { name: "Satisfaction" });
  sv = surveys.saveSurvey(A, sv.id, { name: "Satisfaction", slug: "satisfaction", title: "Votre avis", questions: QUESTIONS, askEmail: "optional" });
  surveys.setStatus(A, sv.id, "published");
  sv = surveys.getSurvey(A, sv.id);
}

describe("questions et réponses", () => {
  beforeEach(setup);
  test("validation des questions : 2 réponses au moins, sans doublon ; « Réponse | étiquette » lu", () => {
    assert.equal(code(() => surveys.normalizeQuestion({ type: "single", text: "x", options: "Seule" }, 0)), "invalid_field");
    assert.equal(code(() => surveys.normalizeQuestion({ type: "single", text: "x", options: "Oui\noui" }, 0)), "invalid_field");
    assert.equal(code(() => surveys.normalizeQuestion({ type: "inconnu", text: "x" }, 0)), "invalid_field");
    assert.deepEqual(sv.questions[1].options, [{ label: "Oui", tag: "ambassadeur" }, { label: "Non", tag: "" }]);
  });
  test("réponses : obligatoire, choix, « Autre », échelle hors bornes, texte ; anonymes ajoutées", () => {
    assert.match(surveys.submitResponse(A, sv, { q1: "0" }).error, /obligatoire/);
    assert.match(surveys.submitResponse(A, sv, { q0: "9" }).error, /note invalide/);
    assert.match(surveys.submitResponse(A, sv, { q0: "3", q1: "other" }).error, /précisez/);
    assert.equal(surveys.submitResponse(A, sv, { q0: "4", q1: "other", q1_other: "Peut-être", q2: ["0", "2", "7"], q3: "Très bien" }).ok, true);
    assert.equal(surveys.submitResponse(A, sv, { q0: "2" }).ok, true);
    const r = surveys.results(A, sv.id);
    assert.equal(r.total, 2);
    assert.equal(r.questions[0].average, 3);
    assert.deepEqual(r.questions[1].others, ["Peut-être"]);
    assert.deepEqual(r.questions[2].counts.map((c) => c.n), [1, 0, 1], "option inexistante ignorée");
    assert.equal(r.questions[3].texts[0].text, "Très bien");
  });
  test("adresse donnée : contact créé SANS abonnement ; abonnement + liste seulement si la case est cochée (preuve)", () => {
    const list = audience.createList(A, { name: "Lecteurs" });
    surveys.saveSurvey(A, sv.id, { name: "Satisfaction", slug: "satisfaction", questions: QUESTIONS, askEmail: "optional", listId: list.id, consentText: "Oui, envoyez-moi vos actualités." });
    sv = surveys.getSurvey(A, sv.id);
    surveys.submitResponse(A, sv, { q0: "5", email: "sans-case@ex.fr" });
    assert.equal(audience.findByEmail(A, "sans-case@ex.fr").status, "unknown");
    surveys.submitResponse(A, sv, { q0: "5", email: "avec-case@ex.fr", consent: "1" });
    const c = audience.findByEmail(A, "avec-case@ex.fr");
    assert.equal(c.status, "subscribed");
    assert.ok(m.db.prepare("SELECT 1 FROM mk_list_members WHERE list_id = ? AND contact_id = ?").get(list.id, c.id));
    assert.equal(code(() => surveys.saveSurvey(A, sv.id, { name: "Satisfaction", slug: "satisfaction", questions: QUESTIONS, askEmail: "no", listId: list.id, consentText: "Oui, envoyez-moi vos actualités." })), "invalid_field", "inscription sans adresse impossible");
  });
  test("sondage clos : plus de réponse ; questions figées dès la 1re réponse (intitulés modifiables)", () => {
    surveys.submitResponse(A, sv, { q0: "4" });
    const changed = QUESTIONS.map((q, i) => (i === 1 ? { ...q, options: "Oui\nNon\nPeut-être" } : q));
    assert.equal(code(() => surveys.saveSurvey(A, sv.id, { name: "Satisfaction", slug: "satisfaction", questions: changed })), "invalid_state");
    surveys.saveSurvey(A, sv.id, { name: "Satisfaction", slug: "satisfaction", questions: QUESTIONS.map((q, i) => (i === 0 ? { ...q, text: "Satisfaction globale" } : q)) });
    assert.equal(surveys.getSurvey(A, sv.id).questions[0].text, "Satisfaction globale");
    surveys.setStatus(A, sv.id, "closed");
    assert.match(surveys.submitResponse(A, surveys.getSurvey(A, sv.id), { q0: "3" }).error, /clos/);
  });
});

describe("lien personnel dans les e-mails", () => {
  beforeEach(setup);
  test("une vraie campagne : chaque destinataire reçoit SON lien ; la réponse est rattachée, étiquetée, et remplacée (jamais en double)", async () => {
    const list = audience.createList(A, { name: "Clients" });
    const { contact } = audience.upsertContact(A, { email: "awa@ex.fr" });
    compliance.recordConsent(A, contact.id, { source: "form", textShown: "Oui, je veux recevoir les e-mails" });
    audience.addToList(A, list.id, [contact.id]);
    const tpl = templates.createTemplate(A, { name: "Avis", kind: "marketing", subject: "Votre avis", blocks: [{ type: "survey", surveyId: sv.id, inline: true }] });
    assert.equal(tpl.blocks[0].snapshot.url, "https://k.test/sondage/satisfaction");
    const c = sending.createCampaign(A, { name: "Avis", templateId: tpl.id, targetType: "list", targetId: list.id });
    sending.startCampaign(A, c.id);
    const provider = createProvider({ provider: "console" }, { log: quiet });
    await sending.dispatchBatch(A, c.id, { provider, now: Date.now() });
    const html = provider.sent[0].html;
    const token = (html.match(/\/sondage\/satisfaction\?r=([A-Za-z0-9_.-]+)"/) || [])[1];
    assert.ok(token, "lien personnel présent");
    assert.match(html, new RegExp(`\\/sondage\\/satisfaction\\?r=${token.replace(/\./g, "\\.")}&amp;p=5`), "1re question (échelle) cliquable");
    const who = surveys.contactFromToken(A, token);
    assert.equal(who.id, contact.id);
    assert.equal(surveys.contactFromToken(A, token.slice(0, -2) + "xx"), null, "jeton falsifié refusé");
    assert.equal(surveys.contactFromToken({ ...A, organizationId: 2 }, token), null, "jeton d'une autre organisation refusé");

    surveys.submitResponse(A, sv, { q0: "5", q1: "0", q2: ["0", "1"] }, { contact: who });
    assert.deepEqual(tagsOf(contact.id), ["ambassadeur", "photo", "video"]);
    surveys.submitResponse(A, sv, { q0: "2", q1: "1" }, { contact: who });
    const rows = m.db.prepare("SELECT * FROM mk_survey_responses WHERE contact_id = ?").all(contact.id);
    assert.equal(rows.length, 1, "réponse remplacée");
    assert.equal(JSON.parse(rows[0].answers).q0.value, 2);
    assert.equal(rows[0].source, "email");
  });
  test("rapport : étiqueter les contacts d'une réponse ; export CSV neutralise les formules", () => {
    const { contact } = audience.upsertContact(A, { email: "b@ex.fr" });
    surveys.submitResponse(A, sv, { q0: "4", q1: "1", q3: "=HYPERLINK(\"http://evil\")" }, { contact });
    assert.equal(surveys.tagRespondents(A, sv.id, 1, 1, "detracteur"), 1);
    assert.deepEqual(tagsOf(contact.id), ["detracteur"]);
    const csv = surveys.toCsv(A, sv.id);
    assert.match(csv, /'=HYPERLINK/, "formule désarmée (apostrophe)");
    assert.match(csv, /b@ex\.fr/);
  });
});

describe("pages et droits", () => {
  let srv, boss, db, id;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
  });
  after(() => srv.stop());

  test("créer, ajouter une question, ouvrir ; page publique, réponse pré-remplie depuis l'e-mail, remerciement ; résultats et export", async () => {
    const r = await boss.post("/marketing/sondages", { name: "Après la formation" });
    id = Number(r.location.match(/(\d+)$/)[1]);
    const s = db.prepare("SELECT * FROM mk_surveys WHERE id = ?").get(id);
    assert.equal((await new Client(srv.base).get(`/sondage/${s.slug}`)).status, 404, "brouillon : pas en ligne");
    const q = JSON.parse(s.questions)[0];
    const body = { name: s.name, slug: s.slug, title: s.title, intro: "", thank_you: "Merci !", ask_email: "optional", list_id: "", consent_text: "", action: "add:single",
      "questions[0][type]": q.type, "questions[0][text]": q.text, "questions[0][scale]": "5", "questions[0][low]": q.low, "questions[0][high]": q.high, "questions[0][required]": "on" };
    await boss.post(`/marketing/sondages/${id}`, body);
    assert.equal(JSON.parse(db.prepare("SELECT questions FROM mk_surveys WHERE id = ?").get(id).questions).length, 2);
    await boss.post(`/marketing/sondages/${id}/ouvrir`, {});
    const v = new Client(srv.base);
    const page = await v.get(`/sondage/${s.slug}?p=4`);
    assert.equal(page.status, 200);
    assert.match(page.text, /name="q0" value="4" checked/, "réponse cliquée dans l'e-mail pré-remplie");
    assert.match(page.text, /noindex/);
    const sent = await v.post(`/sondage/${s.slug}`, { q0: "4", q1: "0", email: "visiteur@ex.fr" });
    assert.equal(sent.location, `/sondage/${s.slug}?merci=1`);
    assert.match((await v.get(sent.location)).text, /Merci !/);
    const res = await boss.get(`/marketing/sondages/${id}/resultats`);
    assert.match(res.text, /visiteur@ex\.fr/);
    const csv = await boss.get(`/marketing/sondages/${id}/export.csv`);
    assert.match(csv.headers.get("content-type"), /text\/csv/);
    assert.match(csv.text, /visiteur@ex\.fr/);
  });

  test("droits : élève refusé ; lecteur voit les résultats mais n'exporte ni n'étiquette", async () => {
    assert.equal((await (await newStudent(srv)).get("/marketing/sondages")).status, 403);
    const viewer = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'viewer')").run(viewer.email);
    assert.equal((await viewer.get(`/marketing/sondages/${id}/resultats`)).status, 200);
    assert.equal((await viewer.get(`/marketing/sondages/${id}/export.csv`)).status, 403);
    assert.equal((await viewer.post(`/marketing/sondages/${id}/etiqueter`, { q: "1", o: "0", tag: "x" })).status, 403);
  });
});
