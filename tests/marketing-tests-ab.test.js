// Marketing — tests A/B des campagnes e-mail : réglages, contrôle avant envoi, tirage du groupe de test, envoi du test,
// choix du gagnant (automatique après le délai, ou manuel), envoi du reste de la cible avec la version gagnante.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, T0 } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const sending = require("../src/marketing/sending");
const abtest = require("../src/marketing/sending/abtest");
const { jobHandlers } = require("../src/marketing/sending/dispatch");

let m, A, B, list, tpl, tplB, camp, provider;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const PROOF = { source: "form", textShown: "Oui, je veux recevoir la newsletter" };
const HOUR = 3600000;
const add = (email) => {
  const { contact } = audience.upsertContact(A, { email });
  compliance.recordConsent(A, contact.id, PROOF);
  audience.addToList(A, list.id, [contact.id]);
  return contact;
};
const row = (id = camp.id) => m.db.prepare("SELECT * FROM mk_campaigns WHERE id = ?").get(id);
const recipients = (where = "1=1") => m.db.prepare(`SELECT * FROM mk_campaign_recipients WHERE campaign_id = ? AND ${where} ORDER BY id`).all(camp.id);
const messages = (where = "1=1") => m.db.prepare(`SELECT * FROM mk_messages WHERE campaign_id = ? AND ${where} ORDER BY id`).all(camp.id);
const fake = () => { const sent = []; return { name: "fake", capabilities: {}, sent, async send(msg) { sent.push(msg); return { providerMessageId: `pm-${sent.length}` }; } }; };
const configure = (over = {}) =>
  sending.saveAbTest(A, camp.id, { enabled: true, variants: [{ subject: "Objet A" }, { subject: "Objet B" }], percent: 20, metric: "clicks", waitMinutes: 60, ...over });
// Envoie tout ce qui peut partir maintenant (plusieurs lots si besoin)
const drain = async (now = T0) => { let r; do { r = await sending.dispatchBatch(A, camp.id, { provider, now, batchSize: 100 }); } while (!r.done && !r.paused && r.reason === "more"); return r; };
const click = (messageId) => m.db.prepare("UPDATE mk_messages SET first_click_at = ?, click_count = click_count + 1 WHERE id = ?").run(T0 + 1000, messageId);

beforeEach(() => {
  m = freshMarketing(); A = m.A; B = m.B;
  list = audience.createList(A, { name: "Newsletter" });
  templates.setOrgAddress(A, "12 rue des Écoles\n75005 Paris");
  tpl = templates.createTemplate(A, { name: "Modèle A", subject: "Objet du modèle", blocks: [{ type: "text", markdown: "Version classique [Site](https://ex.fr/a)" }] });
  tplB = templates.createTemplate(A, { name: "Modèle B", subject: "Autre", blocks: [{ type: "text", markdown: "Version courte [Offre](https://ex.fr/offre)" }] });
  for (let i = 1; i <= 20; i++) add(`p${i}@ex.fr`);
  camp = sending.createCampaign(A, { name: "Lancement", templateId: tpl.id, targetType: "list", targetId: list.id });
  provider = fake();
});

describe("réglages du test (brouillon)", () => {
  test("enregistre 2 ou 3 versions, la part testée, le critère et le délai ; une version C vide est ignorée", () => {
    const c = configure({ variants: [{ subject: "Objet A" }, { subject: "Objet B", templateId: tplB.id }, { subject: "" }], percent: 30, metric: "opens", waitMinutes: 240 });
    assert.deepEqual(abtest.variantsOf(c), [{ subject: "Objet A", templateId: null }, { subject: "Objet B", templateId: tplB.id }]);
    assert.deepEqual([c.ab_test_percent, c.ab_metric, c.ab_wait_minutes], [30, "opens", 240]);
    assert.equal(abtest.isAbTest(c), true);
  });
  test("refus : une seule version, objet vide, versions identiques, part/délai hors bornes, critère inconnu, modèle d'une autre organisation", () => {
    assert.equal(code(() => configure({ variants: [{ subject: "Seul" }] })), "invalid_field");
    assert.equal(code(() => configure({ variants: [{ subject: "" }, { subject: "B" }] })), "invalid_field");
    assert.equal(code(() => configure({ variants: [{ subject: "Même" }, { subject: "même" }] })), "invalid_field");
    assert.equal(code(() => configure({ variants: [{ subject: "Même" }, { subject: "Même", templateId: tpl.id }] })), "invalid_field", "même objet, même modèle (celui de la campagne)");
    assert.equal(code(() => configure({ percent: 5 })), "invalid_field");
    assert.equal(code(() => configure({ percent: 60 })), "invalid_field");
    assert.equal(code(() => configure({ waitMinutes: 30 })), "invalid_field");
    assert.equal(code(() => configure({ waitMinutes: 8 * 24 * 60 })), "invalid_field");
    assert.equal(code(() => configure({ metric: "revenus" })), "invalid_field");
    const other = templates.createTemplate(B, { name: "B", subject: "S", blocks: [{ type: "divider" }] });
    assert.equal(code(() => configure({ variants: [{ subject: "A" }, { subject: "B", templateId: other.id }] })), "invalid_field");
    assert.equal(code(() => sending.saveAbTest(B, camp.id, { enabled: false })), "not_found");
  });
  test("désactiver retire le test ; une campagne lancée n'est plus modifiable", () => {
    configure();
    assert.equal(abtest.isAbTest(sending.saveAbTest(A, camp.id, { enabled: false })), false);
    configure();
    sending.startCampaign(A, camp.id);
    assert.equal(code(() => configure()), "invalid_state");
  });
});

describe("contrôle avant envoi", () => {
  test("critère « ouvertures » sans suivi des ouvertures (ou « clics » sans suivi des clics) : bloqué", () => {
    configure({ metric: "opens" });
    assert.ok(sending.preflight(A, camp.id).errors.some((e) => e.code === "ab_tracking"));
    sending.updateCampaign(A, camp.id, { trackOpens: true });
    assert.ok(!sending.preflight(A, camp.id).errors.some((e) => e.code === "ab_tracking"));
    configure({ metric: "clicks" });
    sending.updateCampaign(A, camp.id, { trackClicks: false });
    assert.ok(sending.preflight(A, camp.id).errors.some((e) => e.code === "ab_tracking"));
  });
  test("cible trop petite pour garder un reste après le test : bloqué", () => {
    const small = audience.createList(A, { name: "Petite" });
    const ids = m.db.prepare("SELECT id FROM mk_contacts WHERE organization_id = 1 ORDER BY id LIMIT 4").all().map((r) => r.id);
    audience.addToList(A, small.id, ids);
    sending.updateCampaign(A, camp.id, { targetType: "list", targetId: small.id });
    configure();
    const check = sending.preflight(A, camp.id);
    assert.equal(check.ready, false);
    assert.ok(check.errors.some((e) => e.code === "ab_audience"));
  });
  test("modèle d'une version supprimé : bloqué", () => {
    configure({ variants: [{ subject: "A" }, { subject: "B", templateId: tplB.id }] });
    templates.deleteTemplate(A, tplB.id);
    assert.ok(sending.preflight(A, camp.id).errors.some((e) => e.code === "ab_template"));
  });
});

describe("lancement et envoi du test", () => {
  test("groupe de test tiré au hasard et réparti à parts égales ; le reste attend le gagnant", () => {
    configure(); // 20 % de 20 = 4 → 2 par version
    const r = sending.startCampaign(A, camp.id);
    assert.deepEqual([r.recipients, r.abTest, r.abHeld], [20, 4, 16]);
    assert.equal(recipients("held = 0 AND variant = 0").length, 2);
    assert.equal(recipients("held = 0 AND variant = 1").length, 2);
    assert.equal(recipients("held = 1 AND variant IS NULL").length, 16);
    const stored = abtest.variantsOf(row());
    assert.equal(stored[1].snapshot.subject, "Objet B", "contenu figé par version au lancement");
  });
  test("le tirage n'est pas « les premiers de la liste » (hasard cryptographique)", () => {
    const firsts = new Set();
    for (let i = 0; i < 6; i++) {
      camp = sending.createCampaign(A, { name: `Essai ${i}`, templateId: tpl.id, targetType: "list", targetId: list.id });
      configure();
      sending.startCampaign(A, camp.id);
      firsts.add(recipients("held = 0").map((x) => x.email).sort().join(","));
    }
    assert.ok(firsts.size > 1, "six tirages identiques : la répartition n'est pas aléatoire");
  });
  test("seul le groupe de test part, chacun avec l'objet de SA version ; puis le choix du gagnant est programmé", async () => {
    configure();
    sending.startCampaign(A, camp.id);
    const r = await drain();
    assert.equal(r.abWaiting, true);
    assert.equal(provider.sent.length, 4);
    const subjects = provider.sent.map((msg) => msg.subject).sort();
    assert.deepEqual(subjects, ["Objet A", "Objet A", "Objet B", "Objet B"]);
    assert.deepEqual(messages().map((x) => x.variant).sort(), [0, 0, 1, 1]);
    const c = row();
    assert.equal(c.status, "sending", "pas « envoyée » tant que le reste n'est pas parti");
    assert.equal(c.ab_decide_at, T0 + 60 * 60000);
    const job = m.db.prepare("SELECT * FROM mk_jobs WHERE type = 'campaign.ab_decide'").get();
    assert.ok(job, "tâche de décision programmée");
    assert.equal(job.run_at, T0 + 60 * 60000);
    // Relancer l'envoi ne renvoie rien et ne reprogramme pas
    await drain(T0 + 1000);
    assert.equal(provider.sent.length, 4);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE type = 'campaign.ab_decide'").get().n, 1);
  });
  test("test de contenu : chaque version reçoit le contenu de SON modèle, et les liens des deux sont suivis", async () => {
    configure({ variants: [{ subject: "Objet A" }, { subject: "Objet B", templateId: tplB.id }] });
    sending.startCampaign(A, camp.id);
    await drain();
    const b = provider.sent.find((msg) => msg.subject === "Objet B");
    const a = provider.sent.find((msg) => msg.subject === "Objet A");
    assert.match(b.html, /Version courte/);
    assert.doesNotMatch(b.html, /Version classique/);
    assert.match(a.html, /Version classique/);
    const urls = m.db.prepare("SELECT url FROM mk_links WHERE campaign_id = ? ORDER BY url").all(camp.id).map((l) => l.url);
    assert.deepEqual(urls, ["https://ex.fr/a", "https://ex.fr/offre"]);
  });
});

describe("choix du gagnant", () => {
  const sendTest = async (over) => { configure(over); sending.startCampaign(A, camp.id); await drain(); };

  test("automatique : rien avant la fin du délai ; puis la version au meilleur taux de clics part au reste de la cible", async () => {
    await sendTest();
    for (const msg of messages("variant = 1")) click(msg.id); // B : 100 % de clics, A : 0 %
    assert.deepEqual(abtest.decideWinner(A, camp.id, { now: T0 + 1000 }), { winner: null, waiting: "test" });
    assert.equal(row().ab_winner, null);
    const d = sending.chooseAbWinner; // (manuel, testé plus bas)
    assert.ok(d);
    await jobHandlers({ db: m.db, bus: m.bus, now: () => T0 + HOUR })["campaign.ab_decide"]({ organizationId: 1, campaignId: camp.id });
    const c = row();
    assert.deepEqual([c.ab_winner, c.ab_decided_by], [1, "auto"]);
    assert.equal(recipients("held = 1").length, 0);
    assert.equal(recipients("variant = 1").length, 18, "2 du test + 16 du reste");
    await drain(T0 + HOUR);
    assert.equal(provider.sent.length, 20);
    assert.equal(provider.sent.filter((msg) => msg.subject === "Objet B").length, 18);
    assert.equal(row().status, "sent");
  });
  test("égalité parfaite : départage par l'autre taux, puis la version A (jamais au hasard)", async () => {
    await sendTest();
    assert.equal(abtest.pickWinner(abtest.variantResults(A, row()), "clicks"), 0);
    const [b1] = messages("variant = 1");
    m.db.prepare("UPDATE mk_messages SET first_open_at = ? WHERE id = ?").run(T0, b1.id);
    assert.equal(abtest.pickWinner(abtest.variantResults(A, row()), "clicks"), 1, "clics égaux : B a plus d'ouvertures");
  });
  test("critère « ouvertures »", async () => {
    sending.updateCampaign(A, camp.id, { trackOpens: true });
    await sendTest({ metric: "opens" });
    for (const msg of messages("variant = 0")) m.db.prepare("UPDATE mk_messages SET first_open_at = ? WHERE id = ?").run(T0, msg.id);
    for (const msg of messages("variant = 1")) click(msg.id); // les clics ne comptent pas ici
    assert.equal(abtest.decideWinner(A, camp.id, { now: T0 + HOUR }).winner, 0);
  });
  test("manuel : aucune décision automatique ; l'équipe choisit, une seule fois", async () => {
    await sendTest({ metric: "manual" });
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE type = 'campaign.ab_decide'").get().n, 0);
    assert.deepEqual(abtest.decideWinner(A, camp.id, { now: T0 + 10 * HOUR }), { winner: null, waiting: "manual" });
    assert.equal(code(() => sending.chooseAbWinner(A, camp.id, 5)), "invalid_field");
    assert.equal(code(() => sending.chooseAbWinner(B, camp.id, 0)), "not_found");
    assert.equal(sending.chooseAbWinner(A, camp.id, 0, { now: T0 + 100 }).winner, 0);
    assert.equal(sending.chooseAbWinner(A, camp.id, 1).already, true, "un second choix ne change rien");
    assert.equal(row().ab_decided_by, "manual");
    await drain(T0 + 100);
    assert.equal(provider.sent.filter((msg) => msg.subject === "Objet A").length, 18);
  });
  test("le gagnant peut être choisi à la main avant la fin du délai, même en mode automatique", async () => {
    await sendTest();
    assert.equal(sending.chooseAbWinner(A, camp.id, 1, { now: T0 + 10 }).winner, 1);
    // La tâche programmée arrive ensuite : sans effet
    await jobHandlers({ db: m.db, bus: m.bus, now: () => T0 + HOUR })["campaign.ab_decide"]({ organizationId: 1, campaignId: camp.id });
    assert.deepEqual([row().ab_winner, row().ab_decided_by], [1, "manual"]);
  });
  test("campagne annulée pendant l'attente : le reste n'est jamais envoyé, la tâche de décision s'arrête sans erreur", async () => {
    await sendTest();
    sending.cancelCampaign(A, camp.id, { now: T0 + 10 });
    assert.equal(recipients("held = 1 AND status = 'skipped' AND reason = 'cancelled'").length, 16);
    await jobHandlers({ db: m.db, bus: m.bus, now: () => T0 + HOUR })["campaign.ab_decide"]({ organizationId: 1, campaignId: camp.id });
    assert.equal(row().ab_winner, null);
    assert.equal(code(() => sending.chooseAbWinner(A, camp.id, 0)), "invalid_state");
    await drain(T0 + HOUR);
    assert.equal(provider.sent.length, 4);
  });
  test("un contact désinscrit pendant l'attente ne reçoit pas la version gagnante (conformité revérifiée)", async () => {
    await sendTest();
    const waiting = recipients("held = 1")[0];
    compliance.unsubscribe(A, waiting.contact_id, { source: "link" });
    sending.chooseAbWinner(A, camp.id, 0, { now: T0 + 10 });
    await drain(T0 + 10);
    assert.equal(provider.sent.length, 19);
    assert.equal(recipients(`id = ${waiting.id}`)[0].status, "skipped");
  });
});

describe("rapport, duplication, campagne classique", () => {
  test("résumé du test : phase, résultats par version, gagnant", async () => {
    configure();
    sending.startCampaign(A, camp.id);
    assert.equal(sending.campaignStats(A, camp.id).ab.phase, "testing");
    await drain();
    click(messages("variant = 0")[0].id);
    let ab = sending.campaignStats(A, camp.id).ab;
    assert.equal(ab.phase, "waiting");
    assert.equal(ab.held, 16);
    assert.deepEqual(ab.results.map((r) => [r.letter, r.subject, r.sent, r.clicks, r.clickRate]), [["A", "Objet A", 2, 1, 50], ["B", "Objet B", 2, 0, 0]]);
    sending.chooseAbWinner(A, camp.id, 0);
    ab = sending.campaignStats(A, camp.id).ab;
    assert.deepEqual([ab.phase, ab.winnerLetter, ab.held], ["decided", "A", 0]);
    assert.equal(ab.results[0].winner, true);
  });
  test("dupliquer reprend les versions et les réglages, jamais le gagnant ni le contenu figé", async () => {
    configure({ variants: [{ subject: "Objet A" }, { subject: "Objet B", templateId: tplB.id }], percent: 40, metric: "manual", waitMinutes: 120 });
    sending.startCampaign(A, camp.id);
    assert.equal(code(() => sending.chooseAbWinner(A, camp.id, 1)), "invalid_state", "pas de gagnant avant l'envoi du test");
    await drain();
    sending.chooseAbWinner(A, camp.id, 1);
    const copy = sending.duplicateCampaign(A, camp.id);
    const c = row(copy.id);
    assert.deepEqual(abtest.variantsOf(c), [{ subject: "Objet A", templateId: null }, { subject: "Objet B", templateId: tplB.id }]);
    assert.deepEqual([c.ab_test_percent, c.ab_metric, c.ab_wait_minutes, c.ab_winner, c.status], [40, "manual", 120, null, "draft"]);
  });
  test("une campagne sans test se comporte exactement comme avant", async () => {
    sending.startCampaign(A, camp.id);
    const r = await drain();
    assert.equal(r.done, true);
    assert.equal(provider.sent.length, 20);
    assert.ok(provider.sent.every((msg) => msg.subject === "Objet du modèle"));
    assert.equal(row().status, "sent");
    assert.equal(sending.campaignStats(A, camp.id).ab, null);
    assert.ok(messages().every((x) => x.variant === null));
  });
});
