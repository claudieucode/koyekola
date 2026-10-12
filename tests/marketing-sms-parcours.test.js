// SMS dans les formulaires et les parcours (point 8 du plan de parité Mailchimp) :
//  - étape « Envoyer un SMS » d'un scénario : validée, figée à l'activation (campagne SMS système cachée), envoyée par le
//    même chemin que les campagnes SMS (accord revérifié, heures de silence, liens courts, STOP, erreurs du fournisseur) ;
//  - déclencheur « Un contact accepte les SMS » et parcours tout prêt « Bienvenue aux abonnés SMS » ;
//  - case « accepter les SMS » facultative dans un formulaire, avec sa preuve (texte + numéro + formulaire).
// Fournisseur SMS simulé : aucun vrai SMS.
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const auto = require("../src/marketing/automations");
const journeys = require("../src/marketing/automations/journeys");
const forms = require("../src/marketing/forms");
const sms = require("../src/marketing/sms");
const { SmsSendError } = require("../src/marketing/sms/providers/errors");
const { createProvider } = require("../src/marketing/sending/providers");
const { startServer, loginInstructor } = require("./helpers");

const NOON = Date.UTC(2026, 9, 5, 11); // lundi 5 octobre 2026, midi à Kinshasa (UTC+1)
const NIGHT = Date.UTC(2026, 9, 5, 22); // 23 h à Kinshasa : heures de silence (20 h – 8 h par défaut)
const MORNING = Date.UTC(2026, 9, 6, 7); // 8 h à Kinshasa
const DAY = 86400000;
const proof = { source: "form", textShown: "J'accepte de recevoir les SMS de KOLAKISA." };
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };

function fakeSms(fail = () => null) {
  const sent = [];
  let n = 0;
  return {
    name: "fake", capabilities: { statusCallbacks: true }, sent,
    async send(message) { const e = fail(message, sent.length); if (e) throw e; sent.push(message); return { providerMessageId: `SM${++n}` }; },
  };
}

let m, A, mail, fake;
const contact = (email, { phone = "", first_name = "Awa", smsOk = false, emailOk = true } = {}) => {
  const { contact: c } = audience.upsertContact(A, { email, phone, first_name });
  if (emailOk) compliance.recordConsent(A, c.id, { source: "form", textShown: "Oui" });
  if (smsOk) sms.recordSmsConsent(A, c.id, proof);
  return audience.getContact(A, c.id);
};
const runOf = (a, c) => m.db.prepare("SELECT * FROM mk_automation_runs WHERE automation_id = ? AND contact_id = ?").get(a.id, c.id);
const step = (a, c, now = NOON) => auto.runAutomation(A, runOf(a, c).id, { provider: mail, smsProvider: () => fake, now });
const enter = (c, name = "tag.added", metadata = { tag: "go" }) => auto.onEvent(A, { id: Math.floor(Math.random() * 1e9), organizationId: 1, name, contactId: c.id, email: c.email, metadata });
const logOf = (a, c) => m.db.prepare("SELECT action, detail FROM mk_automation_log WHERE run_id = ? ORDER BY id").all(runOf(a, c).id);
const smsScenario = (steps, { kind = "marketing" } = {}) => {
  const a = auto.createAutomation(A, { name: `Scénario ${Math.random()}`, kind, triggers: [{ event: "tag.added", filter: { key: "tag", value: "go" } }], steps });
  return auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true });
};

function fresh() {
  m = freshMarketing();
  A = m.ctx(1, { baseUrl: "https://k.test", now: () => NOON });
  templates.setOrgAddress(A, "12 avenue du Commerce, Kinshasa");
  mail = createProvider({ provider: "console" }, { log: quiet });
  fake = fakeSms();
}

describe("étape « Envoyer un SMS » : validation", () => {
  beforeEach(fresh);

  test("texte obligatoire, balises connues seulement, 1600 caractères au plus, réservée au marketing", () => {
    const mk = (s, kind = "marketing") => code(() => auto.createAutomation(A, { name: `V ${Math.random()}`, kind, triggers: [{ event: "contact.created", filter: {} }], steps: [s] }));
    assert.equal(mk({ type: "sms", body: "   " }), "invalid_automation");
    assert.equal(mk({ type: "sms", body: "Bonjour {{email}}" }), "invalid_automation");
    assert.equal(mk({ type: "sms", body: "a".repeat(1601) }), "invalid_automation");
    assert.equal(mk({ type: "sms", body: "Votre reçu" }, "transactional"), "invalid_automation");
    const a = auto.createAutomation(A, { name: "Ok", kind: "marketing", triggers: [{ event: "contact.created", filter: {} }], steps: [{ type: "sms", body: " Bonjour {{prenom|toi}}\r\n ", junk: 1 }] });
    assert.deepEqual(a.steps, [{ type: "sms", body: "Bonjour {{prenom|toi}}", trackClicks: true }], "champ inconnu supprimé, texte nettoyé");
    assert.equal(auto.STEP_LABELS.sms, "Envoyer un SMS");
  });

  test("contrôle avant activation : réglages SMS, longueur facturée, heures de silence", () => {
    const long = auto.createAutomation(A, { name: "Long", kind: "marketing", triggers: [{ event: "contact.created", filter: {} }], steps: [{ type: "sms", body: "ê".repeat(300) }] });
    const pre = auto.automationPreflight(A, long.id, { workerOn: true });
    assert.equal(pre.ready, false);
    assert.ok(pre.errors.some((e) => e.code === "sms_too_long" && e.step === 0));
    assert.ok(pre.warnings.some((w) => w.code === "sms_provider_console"));
    assert.ok(pre.warnings.some((w) => w.code === "sms_quiet"));
    A.settings.set(1, "sms.provider", "twilio"); // Twilio choisi, mais ni expéditeur, ni compte, ni jeton
    const short = auto.createAutomation(A, { name: "Court", kind: "marketing", triggers: [{ event: "contact.created", filter: {} }], steps: [{ type: "sms", body: "Coucou" }] });
    assert.ok(auto.automationPreflight(A, short.id, { workerOn: true }).errors.some((e) => e.code === "sms_provider_incomplete"));
    const noSite = auto.automationPreflight({ ...A, baseUrl: "" }, short.id, { workerOn: true });
    assert.ok(noSite.errors.some((e) => e.code === "base_url"), "lien STOP impossible sans SITE_URL");
  });
});

describe("étape « Envoyer un SMS » : exécution", () => {
  beforeEach(fresh);

  test("activation : une campagne SMS système figée par étape, jamais listée avec les campagnes SMS", () => {
    const a = smsScenario([{ type: "sms", body: "Bonjour {{prenom}} https://k.test/catalogue" }, { type: "sms", body: "Deux" }]);
    const frozen = JSON.parse(a.active_steps);
    assert.ok(Number.isInteger(frozen[0].smsCampaignId) && frozen[0].smsCampaignId !== frozen[1].smsCampaignId);
    const c = m.db.prepare("SELECT * FROM mk_sms_campaigns WHERE id = ?").get(frozen[0].smsCampaignId);
    assert.deepEqual([c.kind, c.automation_id, c.status, c.body], ["automation", a.id, "sending", "Bonjour {{prenom}} https://k.test/catalogue"]);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_sms_links WHERE campaign_id = ?").get(c.id).n, 1, "lien suivi enregistré");
    assert.equal(sms.listSmsCampaigns(A).rows.length, 0);
    assert.equal(sms.listSmsCampaigns(A).counts.all, 0);
  });

  test("abonné SMS : SMS personnalisé, lien court, mention STOP ; puis la suite du parcours", async () => {
    const a = smsScenario([{ type: "sms", body: "Bonjour {{prenom}}, voir https://k.test/catalogue" }, { type: "add_tag", tag: "sms-ok" }]);
    const c = contact("awa@x.cd", { phone: "0812345671", smsOk: true });
    assert.equal(enter(c), 1);
    const r = await step(a, c);
    assert.equal(r.done, true);
    assert.equal(fake.sent.length, 1);
    assert.equal(fake.sent[0].to, "+243812345671");
    assert.match(fake.sent[0].body, /^Bonjour Awa, voir https:\/\/k\.test\/s\/[A-Za-z0-9]{8}\nSTOP SMS : https:\/\/k\.test\/s\/[A-Za-z0-9]{8}$/);
    assert.equal(fake.sent[0].statusCallback, "https://k.test/webhooks/sms/twilio/1");
    assert.ok(m.db.prepare("SELECT 1 FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE ct.contact_id = ? AND t.name = 'sms-ok'").get(c.id), "étape suivante exécutée");
    const stats = auto.automationStats(A, a.id);
    assert.equal(stats.sms.sent, 1);
    assert.equal(stats.steps[0].sent, 1);
    assert.deepEqual(logOf(a, c)[0].action, "sent");
  });

  test("sans accord SMS : l'étape est passée (rien n'est envoyé) et le contact continue son parcours", async () => {
    const a = smsScenario([{ type: "sms", body: "Coucou" }, { type: "add_tag", tag: "suite" }]);
    const c = contact("paul@x.cd", { phone: "0812345679" });
    enter(c);
    await step(a, c);
    assert.equal(fake.sent.length, 0);
    assert.equal(runOf(a, c).status, "completed");
    assert.deepEqual({ ...logOf(a, c)[0] }, { action: "skipped", detail: "sms : not_subscribed" });
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_sms_messages").get().n, 0);
  });

  test("heures de silence : le passage attend le matin (sans essai compté), puis envoie", async () => {
    const a = smsScenario([{ type: "sms", body: "Bonne nuit ?" }]);
    const c = contact("nuit@x.cd", { phone: "0812345672", smsOk: true });
    enter(c);
    const r = await step(a, c, NIGHT);
    assert.equal(r.done, false);
    assert.equal(r.waitMs, MORNING - NIGHT);
    assert.equal(fake.sent.length, 0);
    assert.equal(runOf(a, c).attempts, 0);
    assert.equal((await step(a, c, MORNING)).done, true);
    assert.equal(fake.sent.length, 1);
  });

  test("rejouer l'étape n'envoie jamais un second SMS ; un envoi interrompu n'est jamais renvoyé", async () => {
    const a = smsScenario([{ type: "sms", body: "Une fois" }, { type: "wait", amount: 1, unit: "days" }]);
    const c = contact("une@x.cd", { phone: "0812345673", smsOk: true });
    enter(c);
    await step(a, c);
    m.db.prepare("UPDATE mk_automation_runs SET step_index = 0, wake_at = 0 WHERE id = ?").run(runOf(a, c).id);
    await step(a, c);
    assert.equal(fake.sent.length, 1);
    assert.ok(logOf(a, c).some((l) => l.action === "already_sent"));

    const c2 = contact("coupe@x.cd", { phone: "0812345674", smsOk: true });
    enter(c2);
    const frozen = JSON.parse(auto.getAutomation(A, a.id).active_steps);
    m.db.prepare("INSERT INTO mk_sms_messages (organization_id, campaign_id, contact_id, phone, status, updated_at) VALUES (1, ?, ?, '+243812345674', 'sending', ?)").run(frozen[0].smsCampaignId, c2.id, NOON - 11 * 60000);
    await step(a, c2);
    assert.equal(fake.sent.length, 1, "aucun renvoi");
    assert.equal(m.db.prepare("SELECT reason FROM mk_sms_messages WHERE contact_id = ?").get(c2.id).reason, "interrupted");
  });

  test("erreur temporaire : nouvel essai plus tard ; identifiants refusés : scénario en pause avec le message", async () => {
    const a = smsScenario([{ type: "sms", body: "Réessai" }]);
    const c = contact("tmp@x.cd", { phone: "0812345675", smsOk: true });
    enter(c);
    fake = fakeSms((msg, i) => (i === 0 && !fake.failedOnce ? ((fake.failedOnce = true), new SmsSendError("temporary", "réseau")) : null));
    const r = await step(a, c);
    assert.equal(r.done, false);
    assert.equal(r.waitMs, 60000);
    assert.equal((await step(a, c, NOON + 60000)).done, true);
    assert.equal(fake.sent.length, 1);

    const b = smsScenario([{ type: "sms", body: "Config" }]);
    const c2 = contact("cfg@x.cd", { phone: "0812345676", smsOk: true });
    enter(c2);
    fake = fakeSms(() => new SmsSendError("config", "Identifiants Twilio refusés."));
    const r2 = await step(b, c2);
    assert.equal(r2.paused, true);
    const after = auto.getAutomation(A, b.id);
    assert.equal(after.status, "paused");
    assert.match(after.error, /^SMS : Identifiants ou réglages du fournisseur de SMS refusés/);
    assert.equal(m.db.prepare("SELECT status FROM mk_sms_messages WHERE contact_id = ?").get(c2.id).status, "queued", "rien de perdu");
  });

  test("suppression du scénario : ses campagnes SMS système (et leurs messages) partent avec lui", async () => {
    const a = smsScenario([{ type: "sms", body: "Bye" }]);
    const c = contact("bye@x.cd", { phone: "0812345677", smsOk: true });
    enter(c);
    await step(a, c);
    auto.pauseAutomation(A, a.id);
    auto.deleteAutomation(A, a.id);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_sms_campaigns").get().n, 0);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_sms_messages").get().n, 0);
  });
});

describe("déclencheur « Un contact accepte les SMS » et parcours « Bienvenue aux abonnés SMS »", () => {
  beforeEach(fresh);

  test("le déclencheur existe ; l'accord SMS émet l'événement", () => {
    assert.ok(auto.TRIGGERS["contact.sms_subscribed"]);
    const c = contact("ev@x.cd", { phone: "0812345678", smsOk: true });
    assert.ok(m.db.prepare("SELECT 1 FROM mk_events WHERE name = 'contact.sms_subscribed' AND contact_id = ?").get(c.id));
  });

  test("parcours tout prêt : créé, activable tel quel, deux SMS à 3 jours d'écart", async () => {
    const draft = journeys.createJourney(A, "bienvenue-sms");
    assert.deepEqual(draft.steps.map((s) => s.type), ["sms", "wait", "sms"]);
    assert.match(draft.steps[2].body, /https:\/\/k\.test\/catalogue/);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_templates").get().n, 0, "aucun modèle d'e-mail créé");
    const a = auto.activateAutomation(A, draft.id, { workerOn: true });
    for (const body of draft.steps.filter((s) => s.type === "sms").map((s) => s.body)) {
      assert.equal(sms.estimateFor(body, { first_name: "Marie-Christine" }, { baseUrl: "https://k.test" }).encoding, "GSM-7", "160 caractères par SMS");
    }
    const c = contact("bienvenue@x.cd", { phone: "0812345680", first_name: "Marie" });
    sms.recordSmsConsent(A, c.id, proof);
    assert.equal(auto.onEvent(A, { id: 1, organizationId: 1, name: "contact.sms_subscribed", contactId: c.id, metadata: {} }), 1);
    const r1 = await step(a, c);
    assert.equal(r1.waitMs, 3 * DAY);
    assert.match(fake.sent[0].body, /^Bonjour Marie, merci d'avoir accepté les SMS de KOLAKISA/);
    assert.equal((await step(a, c, NOON + 3 * DAY)).done, true);
    assert.equal(fake.sent.length, 2);
    assert.match(fake.sent[1].body, /^Marie, envie d'apprendre/);
  });
});

describe("formulaires : case « accepter les SMS »", () => {
  let form;
  beforeEach(() => {
    fresh();
    form = forms.createForm(A, { name: "Lettre", fields: [], consentText: "Je veux la lettre", listId: null });
    forms.setStatus(A, form.id, "published");
  });
  const setSms = (text, extra = {}) => forms.updateForm(A, form.id, { name: "Lettre", fields: extra.fields || [], consentText: "Je veux la lettre", listId: null, smsConsentText: text, doubleOptin: extra.doubleOptin });
  const consentRow = (c) => m.db.prepare("SELECT * FROM mk_consents WHERE contact_id = ? AND purpose = 'sms' ORDER BY id DESC").get(c.id);

  test("texte facultatif (vide = pas de SMS), une vraie phrase sinon ; conservé si absent de l'envoi", () => {
    assert.equal(form.smsConsentText, "");
    assert.equal(code(() => setSms("Oui SMS")), "invalid_field");
    assert.equal(setSms("J'accepte de recevoir des SMS. STOP pour arrêter.").smsConsentText, "J'accepte de recevoir des SMS. STOP pour arrêter.");
    assert.equal(forms.updateForm(A, form.id, { name: "Lettre", fields: [], consentText: "Je veux la lettre", listId: null }).smsConsentText, "J'accepte de recevoir des SMS. STOP pour arrêter.");
    assert.equal(setSms("").smsConsentText, "");
  });

  test("case cochée + numéro : accord SMS enregistré avec sa preuve ; case non cochée : rien", () => {
    setSms("J'accepte de recevoir des SMS de KOLAKISA. STOP pour arrêter.");
    const r = forms.submitForm(A, form.id, { email: "sms@x.cd", consent: "1", sms_consent: "1", sms_phone: "0812 34 56 81", ip: "203.0.113.9" });
    assert.equal(r.ok, true);
    assert.equal(r.sms.ok, true);
    const c = audience.getContact(A, r.contact.id);
    assert.deepEqual([c.sms_status, c.sms_phone], ["subscribed", "+243812345681"]);
    const k = consentRow(c);
    assert.deepEqual([k.source, k.text_shown, k.form_id, k.channel_address, k.ip], ["form", "J'accepte de recevoir des SMS de KOLAKISA. STOP pour arrêter.", form.id, "+243812345681", "203.0.113.0"]);
    assert.equal(sms.isSmsSendable(A, c.id).ok, true);

    const r2 = forms.submitForm(A, form.id, { email: "nosms@x.cd", consent: "1", sms_phone: "0812345682" });
    assert.equal(r2.ok, true);
    assert.equal(audience.getContact(A, r2.contact.id).sms_status, "none");
  });

  test("numéro absent ou invalide : refus AVANT toute création ; champ « Téléphone » du formulaire réutilisé", () => {
    setSms("J'accepte de recevoir des SMS de KOLAKISA.", { fields: ["phone"] });
    assert.equal(forms.submitForm(A, form.id, { email: "a@x.cd", consent: "1", sms_consent: "1" }).reason, "invalid_phone");
    assert.equal(forms.submitForm(A, form.id, { email: "a@x.cd", consent: "1", sms_consent: "1", phone: "abc" }).reason, "invalid_phone");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_contacts").get().n, 0);
    const ok = forms.submitForm(A, form.id, { email: "a@x.cd", consent: "1", sms_consent: "1", phone: "+243 812 345 683" });
    assert.equal(audience.getContact(A, ok.contact.id).sms_phone, "+243812345683");
  });

  test("double confirmation : l'accord SMS n'est enregistré qu'à la confirmation, avec le texte d'origine", () => {
    setSms("J'accepte de recevoir des SMS de KOLAKISA.", { doubleOptin: true });
    const r = forms.submitForm(A, form.id, { email: "dbl@x.cd", consent: "1", sms_consent: "1", sms_phone: "0812345684" });
    assert.equal(r.pending, true);
    assert.equal(consentRow(r.contact), undefined);
    setSms("Texte modifié entre-temps, plus long que dix.", { doubleOptin: true });
    assert.equal(forms.confirmSubscription(A, r.token, { now: NOON + 60 * 1000 }).ok, true);
    const k = consentRow(r.contact);
    assert.equal(k.text_shown, "J'accepte de recevoir des SMS de KOLAKISA.");
    assert.equal(audience.getContact(A, r.contact.id).sms_status, "subscribed");
  });

  test("numéro bloqué (STOP) : l'inscription e-mail réussit, le SMS reste refusé", () => {
    setSms("J'accepte de recevoir des SMS de KOLAKISA.");
    sms.addSmsSuppression(A, { phone: "+243812345685", reason: "stop" });
    const r = forms.submitForm(A, form.id, { email: "stop@x.cd", consent: "1", sms_consent: "1", sms_phone: "0812345685" });
    assert.equal(r.ok, true);
    assert.deepEqual(r.sms, { ok: false, reason: "suppressed" });
    assert.equal(audience.getContact(A, r.contact.id).status, "subscribed");
  });
});

describe("SMS dans les parcours et formulaires — pages web", () => {
  let srv, boss;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
  });
  after(() => srv.stop());
  const sql = (fn) => { const db = srv.db(); try { return fn(db); } finally { db.close(); } };

  test("formulaire : réglage enregistré, case SMS sur la page publique et dans le pop-up, accord enregistré", async () => {
    let r = await boss.post("/marketing/formulaires", { name: "Newsletter SMS", consentText: "Je veux la lettre" });
    const id = Number(/\/marketing\/formulaires\/(\d+)/.exec(r.location)[1]);
    let page = await boss.get(`/marketing/formulaires/${id}`);
    assert.match(page.text, /name="smsConsentText"/);
    r = await boss.post(`/marketing/formulaires/${id}`, { name: "Newsletter SMS", consentText: "Je veux la lettre", smsConsentText: "J'accepte les SMS de KOLAKISA (STOP pour arrêter).", popupEnabled: "1", popupTrigger: "delay", popupTriggerValue: "5", popupFrequencyDays: "7", doubleOptinShown: "1" });
    assert.equal(r.status, 302);
    page = await boss.get(`/marketing/formulaires/${id}`);
    assert.match(page.text, /J&#39;accepte les SMS de KOLAKISA/);
    const slug = /\/f\/([a-z0-9-]+)/.exec(page.text)[1];
    await boss.post(`/marketing/formulaires/${id}/publier`);
    const pub = await boss.get(`/f/${slug}`);
    assert.equal(pub.status, 200);
    assert.match(pub.text, /name="sms_phone"/);
    assert.match(pub.text, /name="sms_consent" value="1">/, "jamais pré-cochée");
    const popup = JSON.parse((await boss.get("/f/popup.json")).text);
    assert.equal(popup.form.smsConsentText, "J'accepte les SMS de KOLAKISA (STOP pour arrêter).");
    assert.equal(popup.form.smsPhoneField, true);
    r = await boss.post(`/f/${slug}`, { ft: srv.formToken(), email: "web-sms@x.cd", consent: "1", sms_consent: "1", sms_phone: "0812345690" });
    assert.equal(r.status, 302, r.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 3000));
    const row = sql((db) => db.prepare("SELECT c.sms_status, k.text_shown FROM mk_contacts c JOIN mk_consents k ON k.contact_id = c.id AND k.purpose = 'sms' WHERE c.email = 'web-sms@x.cd'").get());
    assert.deepEqual({ ...row }, { sms_status: "subscribed", text_shown: "J'accepte les SMS de KOLAKISA (STOP pour arrêter)." });
  });

  test("parcours : « Bienvenue aux abonnés SMS » proposé avec ses SMS ; éditeur avec l'étape SMS et les réglages réels", async () => {
    const lib = await boss.get("/marketing/automatisations/parcours");
    assert.match(lib.text, /action="\/marketing\/automatisations\/parcours\/bienvenue-sms"/);
    const j = await boss.get("/marketing/automatisations/parcours/bienvenue-sms");
    assert.match(j.text, /SMS du parcours/);
    assert.match(j.text, /Un contact accepte les SMS/);
    const r = await boss.post("/marketing/automatisations/parcours/bienvenue-sms");
    const page = await boss.get(r.location);
    assert.equal(page.status, 200);
    assert.match(page.text, /Parcours créé en brouillon avec 2 SMS\./);
    const data = JSON.parse(/<script type="application\/json" id="mk-automation-data">([\s\S]*?)<\/script>/.exec(page.text)[1]);
    assert.deepEqual(data.automation.steps.map((s) => s.type), ["sms", "wait", "sms"]);
    assert.equal(data.sms.maxSegments, 3);
    assert.equal(data.triggers["contact.sms_subscribed"].label, "Un contact accepte les SMS (accord SMS prouvé)");
  });

  test("une campagne SMS système n'est pas accessible depuis les pages des campagnes SMS", async () => {
    const id = sql((db) => db.prepare("INSERT INTO mk_sms_campaigns (organization_id, name, status, kind, automation_id) VALUES (1, 'auto-x', 'sending', 'automation', 999) RETURNING id").get().id);
    assert.equal((await boss.get(`/marketing/sms/campagnes/${id}`)).status, 404);
  });
});
