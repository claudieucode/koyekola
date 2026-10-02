// Campagnes SMS (onglet « SMS ») : texte personnalisé, liens courts, contrôle avant envoi, coût, lancement, envoi par lots
// (heures de silence, reprises, numéros refusés, pause), clics et désinscription par lien, rappels Twilio signés (statut,
// STOP/START/AIDE), pages web. Fournisseur simulé : aucun vrai SMS.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { freshMarketing, TEST_KEY, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const segments = require("../src/marketing/segments");
const sms = require("../src/marketing/sms");
const { SmsSendError } = require("../src/marketing/sms/providers/errors");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const NOON = Date.UTC(2026, 9, 5, 11); // lundi 5 octobre 2026, midi à Kinshasa
const proof = { source: "form", textShown: "J'accepte de recevoir les SMS de KOYEKOLA." };

// Base marketing + abonnés SMS (RD Congo) ; ctx avec l'adresse publique du site
function setup({ subscribers = [["marie@x.cd", "0812345671", "Marie"], ["jean@x.cd", "0812345672", ""]], others = [["paul@x.cd", "0812345679", "Paul"]] } = {}) {
  const m = freshMarketing();
  const A = m.ctx(1, { baseUrl: "https://k.test" });
  const ids = {};
  for (const [email, phone, first_name] of subscribers) {
    const c = audience.upsertContact(A, { email, phone, first_name }).contact;
    sms.recordSmsConsent(A, c.id, proof);
    ids[email] = c.id;
  }
  for (const [email, phone, first_name] of others) ids[email] = audience.upsertContact(A, { email, phone, first_name }).contact.id;
  return { m, A, ids };
}
// Fournisseur simulé : enregistre les SMS ; `fail(message)` peut lever une SmsSendError
function fakeProvider(fail = () => null) {
  const sent = [];
  let n = 0;
  return {
    name: "fake", capabilities: { statusCallbacks: true }, sent,
    async send(message) { const e = fail(message, sent.length); if (e) throw e; sent.push(message); return { providerMessageId: `SM${++n}` }; },
  };
}
const launch = (A, body, opts = {}) => {
  const c = sms.createSmsCampaign(A, { name: "Campagne" });
  sms.updateSmsCampaign(A, c.id, { body, trackClicks: opts.trackClicks ?? true, ...(opts.target || {}) });
  sms.startSmsCampaign(A, c.id, { workerOn: true, now: opts.now ?? NOON });
  return c.id;
};

describe("SMS campagnes — texte d'un SMS", () => {
  test("prénom/nom, valeur de secours, liens courts, mention STOP ajoutée", () => {
    const links = new Map([["https://koyekola.com/excel", "https://k.test/s/AAAAAAAA"]]);
    const text = sms.renderSms("Bonjour {{prenom|ami}} {{nom}}, voir https://koyekola.com/excel.", { first_name: "Marie", last_name: "" }, { links, optOutUrl: "https://k.test/s/BBBBBBBB" });
    assert.equal(text, "Bonjour Marie , voir https://k.test/s/AAAAAAAA.\nSTOP SMS : https://k.test/s/BBBBBBBB");
    assert.equal(sms.renderSms("Salut {{ PRENOM | toi }}", {}, {}), "Salut toi");
  });
  test("balises inconnues détectées (fautes de frappe, accolades orphelines)", () => {
    assert.deepEqual(sms.unknownTags("Bonjour {{prenom}}"), []);
    assert.deepEqual(sms.unknownTags("Bonjour {{email}}"), ["{{email}}"]);
    assert.deepEqual(sms.unknownTags("Bonjour {{prenom"), ["{{…}}"]);
  });
  test("liens détectés sans la ponctuation finale, sans doublon", () => {
    assert.deepEqual(sms.linksIn("Voir https://a.fr/x. Et https://a.fr/x, puis http://b.fr/y?z=1!"), ["https://a.fr/x", "http://b.fr/y?z=1"]);
  });
  test("estimation : comptée sur le texte final (liens courts + mention STOP)", () => {
    const e = sms.estimateFor("Bonjour {{prenom}}", { first_name: "Marie" }, { baseUrl: "https://k.test" });
    assert.equal(e.text, "Bonjour Marie\nSTOP SMS : https://k.test/s/xxxxxxxx");
    assert.deepEqual([e.encoding, e.segments], ["GSM-7", 1]);
  });
});

describe("SMS campagnes — brouillons", () => {
  let A, m;
  before(() => ({ A, m } = setup()));
  test("création, modification, nom obligatoire, message limité à 1600 caractères", () => {
    const c = sms.createSmsCampaign(A, { name: "Rappel" });
    assert.equal(c.status, "draft");
    assert.equal(c.target_type, "all");
    assert.throws(() => sms.updateSmsCampaign(A, c.id, { name: "  " }), /nom/);
    assert.throws(() => sms.updateSmsCampaign(A, c.id, { body: "a".repeat(1601) }), /trop long/);
    assert.equal(sms.updateSmsCampaign(A, c.id, { body: "Coucou" }).body, "Coucou");
  });
  test("cible : liste ou segment existants seulement", () => {
    const c = sms.createSmsCampaign(A, { name: "Cible" });
    assert.throws(() => sms.updateSmsCampaign(A, c.id, { targetType: "list", targetId: 999 }), /introuvable/i);
    assert.throws(() => sms.updateSmsCampaign(A, c.id, { targetType: "list" }), /Choisissez/);
    const list = audience.createList(A, { name: "VIP" });
    assert.equal(sms.updateSmsCampaign(A, c.id, { targetType: "list", targetId: list.id }).target_id, list.id);
  });
  test("dupliquer ; supprimer un brouillon ; isolation entre organisations", () => {
    const c = sms.createSmsCampaign(A, { name: "Original", body: "Texte" });
    const copy = sms.duplicateSmsCampaign(A, c.id);
    assert.deepEqual([copy.name, copy.body, copy.status], ["Original (copie)", "Texte", "draft"]);
    sms.deleteSmsCampaign(A, copy.id);
    assert.equal(sms.getSmsCampaign(A, copy.id), null);
    assert.equal(sms.getSmsCampaign(m.ctx(2), c.id), null);
  });
  test("onglets : compteurs par statut", () => {
    const { counts } = sms.listSmsCampaigns(A);
    assert.ok(counts.draft >= 3);
    assert.equal(counts.all, counts.draft + counts.scheduled + counts.running + counts.sent + counts.stopped);
  });
});

describe("SMS campagnes — contrôle avant envoi et coût", () => {
  test("audience : seuls les abonnés SMS ; exclusions détaillées", () => {
    const { A, ids } = setup();
    sms.unsubscribeSms(A, ids["jean@x.cd"], { source: "link" });
    const s = sms.smsAudienceSummary(A, { targetType: "all" });
    assert.deepEqual([s.targetTotal, s.sendable, s.excluded.unsubscribed, s.excluded.not_subscribed], [3, 1, 1, 1]);
  });
  test("segment et liste : intersection avec les abonnés SMS", () => {
    const { A, ids } = setup();
    const list = audience.createList(A, { name: "Kinshasa" });
    audience.addToList(A, list.id, [ids["marie@x.cd"], ids["paul@x.cd"]]);
    assert.equal(sms.smsAudienceSummary(A, { targetType: "list", targetId: list.id }).sendable, 1);
    const seg = segments.createSegment(A, { name: "Tous", definition: { op: "and", rules: [{ field: "email", cmp: "contains", value: "@x.cd" }] } });
    assert.equal(sms.smsAudienceSummary(A, { targetType: "segment", targetId: seg.id }).sendable, 2);
  });
  test("prêt : segments et coût estimés avec le prix des réglages", () => {
    const { A } = setup();
    sms.saveSmsConfig(A, { pricePerSegment: "0,23", currency: "USD" });
    const c = sms.createSmsCampaign(A, { name: "C" });
    sms.updateSmsCampaign(A, c.id, { body: "Bonjour {{prenom|ami}}, la formation commence lundi." });
    const p = sms.smsPreflight(A, c.id, { workerOn: true });
    assert.equal(p.ready, true, JSON.stringify(p.errors));
    assert.deepEqual([p.estimate.recipients, p.estimate.segments, p.estimate.cost, p.estimate.currency], [2, 2, 0.46, "USD"]);
    assert.ok(p.warnings.some((w) => w.key === "provider")); // mode essai signalé
  });
  test("bloquants : message vide, balise inconnue, pas d'adresse https, aucun destinataire, worker arrêté", () => {
    const { m } = setup({ subscribers: [] });
    const B = m.ctx(1, { baseUrl: "" });
    const c = sms.createSmsCampaign(B, { name: "Vide" });
    let keys = sms.smsPreflight(B, c.id, { workerOn: false }).errors.map((e) => e.key);
    for (const k of ["body", "site", "audience", "worker"]) assert.ok(keys.includes(k), k);
    sms.updateSmsCampaign(B, c.id, { body: "Bonjour {{prénom}}" });
    keys = sms.smsPreflight(B, c.id, { workerOn: true }).errors.map((e) => e.message).join(" ");
    assert.match(keys, /Balise de personnalisation inconnue/);
  });
  test("message trop long (au-delà du plafond de segments) : bloquant ; caractères coûteux : avertissement", () => {
    const { A } = setup();
    const c = sms.createSmsCampaign(A, { name: "Long" });
    sms.updateSmsCampaign(A, c.id, { body: "ê".repeat(250) });
    const p = sms.smsPreflight(A, c.id, { workerOn: true });
    assert.ok(p.errors.some((e) => e.key === "length"));
    assert.ok(p.warnings.some((w) => w.key === "unicode"));
  });
  test("Twilio incomplet : bloquant", () => {
    const { A, m } = setup();
    sms.saveSmsConfig(A, { provider: "twilio", sender: "KOYEKOLA", accountSid: "AC" + "1".repeat(32), authToken: "t" });
    m.db.prepare("DELETE FROM mk_settings WHERE key = 'sms.auth_token'").run();
    const c = sms.createSmsCampaign(A, { name: "T" });
    sms.updateSmsCampaign(A, c.id, { body: "Salut" });
    assert.ok(sms.smsPreflight(A, c.id, { workerOn: true }).errors.some((e) => e.key === "provider"));
  });
});

describe("SMS campagnes — lancement et envoi", () => {
  test("lancement : un message par abonné joignable, liens enregistrés, campagne figée, tâche en file", () => {
    const { A, m } = setup();
    sms.saveSmsConfig(A, { pricePerSegment: "0.1" });
    const id = launch(A, "Voir https://koyekola.com/excel");
    const c = sms.getSmsCampaign(A, id);
    assert.deepEqual([c.status, c.total_recipients, c.sender, c.price_per_segment], ["scheduled", 2, "KOYEKOLA", "0.1"]);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_sms_links WHERE campaign_id = ?").get(id).n, 1);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE type = 'sms.dispatch'").get().n, 1);
    assert.throws(() => sms.updateSmsCampaign(A, id, { body: "x" }), /lancée/);
    assert.throws(() => sms.startSmsCampaign(A, id, { workerOn: true }), /déjà été lancée/);
  });
  test("lancement refusé si le contrôle échoue ; programmation dans le futur uniquement", () => {
    const { A } = setup();
    const c = sms.createSmsCampaign(A, { name: "X" });
    assert.throws(() => sms.startSmsCampaign(A, c.id, { workerOn: true }), (e) => e.code === "preflight_failed");
    sms.updateSmsCampaign(A, c.id, { body: "Salut" });
    assert.throws(() => sms.startSmsCampaign(A, c.id, { workerOn: true, now: NOON, scheduledAt: NOON - 1 }), /futur/);
  });
  test("envoi : texte personnalisé, liens courts uniques, mention STOP, segments et compteurs", async () => {
    const { A, m } = setup();
    const id = launch(A, "Bonjour {{prenom|ami}} : https://koyekola.com/excel");
    const p = fakeProvider();
    const r = await sms.dispatchSmsBatch(A, id, { provider: p, now: NOON });
    assert.deepEqual([r.done, r.sent], [true, 2]);
    assert.match(p.sent[0].body, /^Bonjour Marie : https:\/\/k\.test\/s\/[a-zA-Z0-9]{8}\nSTOP SMS : https:\/\/k\.test\/s\/[a-zA-Z0-9]{8}$/);
    assert.match(p.sent[1].body, /^Bonjour ami : /);
    assert.equal(p.sent[0].to, "+243812345671");
    assert.equal(p.sent[0].statusCallback, "https://k.test/webhooks/sms/twilio/1");
    const codes = m.db.prepare("SELECT code FROM mk_sms_short_links").all().map((r) => r.code);
    assert.equal(new Set(codes).size, 4);
    const c = sms.getSmsCampaign(A, id);
    assert.deepEqual([c.status, c.sent_count, c.segments_count], ["sent", 2, 2]);
  });
  test("heures de silence : à 22 h à Kinshasa, rien ne part ; à 8 h, l'envoi reprend", async () => {
    const { A, m } = setup();
    const night = Date.UTC(2026, 9, 5, 21);
    const id = launch(A, "Salut", { now: night });
    const p = fakeProvider();
    const r = await sms.dispatchSmsBatch(A, id, { provider: p, now: night });
    assert.deepEqual([p.sent.length, r.done, r.deferred, r.waitMs], [0, false, 2, 10 * 3600 * 1000]);
    assert.equal(m.db.prepare("SELECT reason FROM mk_sms_messages LIMIT 1").get().reason, "quiet_hours");
    const morning = Date.UTC(2026, 9, 6, 7);
    assert.equal((await sms.dispatchSmsBatch(A, id, { provider: p, now: morning })).sent, 2);
  });
  test("France : pas d'envoi un dimanche", async () => {
    const { A } = setup({ subscribers: [["fr@x.fr", "+33612345678", "Léa"]], others: [] });
    const sunday = Date.UTC(2026, 9, 4, 12);
    const id = launch(A, "Salut", { now: sunday });
    const p = fakeProvider();
    await sms.dispatchSmsBatch(A, id, { provider: p, now: sunday });
    assert.equal(p.sent.length, 0);
  });
  test("conformité revérifiée à l'envoi : désinscrit entre-temps = non envoyé", async () => {
    const { A, ids } = setup();
    const id = launch(A, "Salut");
    sms.unsubscribeSms(A, ids["jean@x.cd"], { source: "link" });
    const p = fakeProvider();
    const r = await sms.dispatchSmsBatch(A, id, { provider: p, now: NOON });
    assert.deepEqual([r.sent, r.skipped], [1, 1]);
  });
  test("numéro refusé → bloqué (invalide) ; STOP chez le fournisseur → bloqué (STOP)", async () => {
    const { A, m } = setup();
    const id = launch(A, "Salut");
    const p = fakeProvider((msg) => (msg.to.endsWith("71") ? new SmsSendError("recipient_rejected", { code: 21211 }) : new SmsSendError("opted_out", { code: 21610 })));
    const r = await sms.dispatchSmsBatch(A, id, { provider: p, now: NOON });
    assert.deepEqual([r.failed, r.done], [2, true]);
    const rows = m.db.prepare("SELECT phone, reason FROM mk_sms_suppressions ORDER BY phone").all().map((x) => `${x.phone}:${x.reason}`);
    assert.deepEqual(rows, ["+243812345671:invalid", "+243812345672:stop"]);
  });
  test("erreur temporaire : 3 essais espacés, puis échec", async () => {
    const { A } = setup({ others: [], subscribers: [["a@x.cd", "0812345671", "A"]] });
    const id = launch(A, "Salut");
    const p = fakeProvider(() => new SmsSendError("temporary"));
    let r = await sms.dispatchSmsBatch(A, id, { provider: p, now: NOON });
    assert.equal(r.waitMs, 60000);
    r = await sms.dispatchSmsBatch(A, id, { provider: p, now: NOON + 60000 });
    assert.equal(r.waitMs, 120000);
    r = await sms.dispatchSmsBatch(A, id, { provider: p, now: NOON + 180000 });
    assert.deepEqual([r.done, r.failed], [true, 1]);
    assert.equal(sms.getSmsCampaign(A, id).failed_count, 1);
  });
  test("identifiants refusés : campagne en pause avec le message, puis reprise", async () => {
    const { A } = setup();
    const id = launch(A, "Salut");
    const r = await sms.dispatchSmsBatch(A, id, { provider: fakeProvider(() => new SmsSendError("config")), now: NOON });
    assert.equal(r.paused, true);
    assert.match(sms.getSmsCampaign(A, id).error, /Identifiants/);
    sms.resumeSmsCampaign(A, id, { now: NOON });
    assert.equal((await sms.dispatchSmsBatch(A, id, { provider: fakeProvider(), now: NOON })).sent, 2);
  });
  test("plafond quotidien et débit par minute (toutes campagnes confondues)", async () => {
    const { A } = setup();
    sms.saveSmsConfig(A, { dailyLimit: 1 });
    const id = launch(A, "Salut");
    const r = await sms.dispatchSmsBatch(A, id, { provider: fakeProvider(), now: NOON });
    assert.deepEqual([r.sent, r.reason], [1, "daily"]);
    sms.saveSmsConfig(A, { dailyLimit: 500, ratePerMinute: 1 });
    const r2 = await sms.dispatchSmsBatch(A, id, { provider: fakeProvider(), now: NOON + 1000 });
    assert.deepEqual([r2.sent, r2.reason], [0, "rate"]);
  });
  test("envoi interrompu (serveur arrêté pendant l'appel) : jamais renvoyé, marqué échoué", async () => {
    const { A, m } = setup();
    const id = launch(A, "Salut");
    m.db.prepare("UPDATE mk_sms_messages SET status = 'sending', updated_at = ? WHERE campaign_id = ? AND phone LIKE '%71'").run(NOON - 11 * 60000, id);
    m.db.prepare("UPDATE mk_sms_campaigns SET status = 'sending', started_at = ? WHERE id = ?").run(NOON - 11 * 60000, id);
    const p = fakeProvider();
    await sms.dispatchSmsBatch(A, id, { provider: p, now: NOON });
    assert.deepEqual(p.sent.map((x) => x.to), ["+243812345672"]);
    assert.equal(m.db.prepare("SELECT reason FROM mk_sms_messages WHERE phone LIKE '%71'").get().reason, "interrupted");
  });
  test("pause manuelle, annulation : les SMS restants ne partent pas", async () => {
    const { A } = setup();
    const id = launch(A, "Salut");
    sms.pauseSmsCampaign(A, id);
    assert.equal((await sms.dispatchSmsBatch(A, id, { provider: fakeProvider(), now: NOON })).paused, true);
    sms.cancelSmsCampaign(A, id, { now: NOON });
    const c = sms.getSmsCampaign(A, id);
    assert.deepEqual([c.status, c.skipped_count], ["cancelled", 2]);
  });
  test("programmée : attend l'heure prévue", async () => {
    const { A } = setup();
    const c = sms.createSmsCampaign(A, { name: "Plus tard" });
    sms.updateSmsCampaign(A, c.id, { body: "Salut" });
    sms.startSmsCampaign(A, c.id, { workerOn: true, now: NOON, scheduledAt: NOON + 3600000 });
    const r = await sms.dispatchSmsBatch(A, c.id, { provider: fakeProvider(), now: NOON });
    assert.deepEqual([r.reason, r.waitMs], ["scheduled", 3600000]);
  });
  test("tâche de file : enchaîne les lots puis termine", async () => {
    const { A, m } = setup();
    const id = launch(A, "Salut");
    const p = fakeProvider();
    const handlers = sms.smsJobHandlers({ db: m.db, settings: A.settings, env: { SITE_URL: "https://k.test" }, providerFor: () => p, now: () => NOON, log: quiet });
    await handlers["sms.dispatch"]({ organizationId: 1, campaignId: id });
    assert.equal(sms.getSmsCampaign(A, id).status, "sent");
  });
});

describe("SMS campagnes — liens courts : clics et désinscription", () => {
  let A, m, id, codes;
  before(async () => {
    ({ A, m } = setup());
    id = launch(A, "Voir https://koyekola.com/excel");
    await sms.dispatchSmsBatch(A, id, { provider: fakeProvider(), now: NOON });
    codes = m.db.prepare("SELECT s.code, s.kind, msg.phone FROM mk_sms_short_links s JOIN mk_sms_messages msg ON msg.id = s.message_id ORDER BY s.code").all();
  });
  const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
  test("clic : redirige vers l'adresse ENREGISTRÉE, compte une personne une seule fois", () => {
    const link = codes.find((c) => c.kind === "link");
    const r = sms.resolveCode(m.db, link.code);
    assert.equal(sms.recordSmsClick(m.db, r, { userAgent: ua }), "https://koyekola.com/excel");
    sms.recordSmsClick(m.db, sms.resolveCode(m.db, link.code), { userAgent: ua });
    const c = sms.getSmsCampaign(A, id);
    assert.equal(c.click_count, 1);
    assert.equal(m.db.prepare("SELECT click_count FROM mk_sms_links").get().click_count, 2);
  });
  test("robots (aperçus de liens) : redirigés mais non comptés", () => {
    const link = codes.filter((c) => c.kind === "link")[1];
    sms.recordSmsClick(m.db, sms.resolveCode(m.db, link.code), { userAgent: "WhatsApp/2.23 preview bot" });
    assert.equal(sms.getSmsCampaign(A, id).click_count, 1);
  });
  test("codes invalides ou inconnus : rien", () => {
    assert.equal(sms.resolveCode(m.db, "court"), null);
    assert.equal(sms.resolveCode(m.db, "ZZZZZZZZ"), null);
  });
  test("désinscription par lien : accord SMS retiré, comptée une fois pour la campagne", () => {
    const opt = codes.find((c) => c.kind === "unsubscribe");
    const r = sms.resolveCode(m.db, opt.code);
    assert.equal(sms.optOutInfo(m.db, r).already, false);
    sms.unsubscribeFromCode(m.db, r);
    sms.unsubscribeFromCode(m.db, sms.resolveCode(m.db, opt.code));
    assert.equal(sms.getSmsCampaign(A, id).unsubscribe_count, 1);
    const contact = m.db.prepare("SELECT sms_status FROM mk_contacts WHERE sms_phone = ?").get(opt.phone);
    assert.equal(contact.sms_status, "unsubscribed");
    assert.equal(sms.optOutInfo(m.db, sms.resolveCode(m.db, opt.code)).already, true);
  });
});

describe("SMS campagnes — rappels Twilio signés", () => {
  const sign = (url, params, token) => crypto.createHmac("sha1", token).update(url + Object.keys(params).sort().map((k) => k + params[k]).join("")).digest("base64");
  test("signature : valide, puis refusée si un paramètre ou l'adresse change", () => {
    const params = { MessageSid: "SM1", MessageStatus: "delivered" };
    const signature = sign("https://k.test/webhooks/sms/twilio/1", params, "tok");
    assert.equal(sms.verifyTwilioSignature({ url: "https://k.test/webhooks/sms/twilio/1", params, signature, authToken: "tok" }), true);
    assert.equal(sms.verifyTwilioSignature({ url: "https://k.test/webhooks/sms/twilio/1", params: { ...params, MessageStatus: "failed" }, signature, authToken: "tok" }), false);
    assert.equal(sms.verifyTwilioSignature({ url: "https://k.test/webhooks/sms/twilio/2", params, signature, authToken: "tok" }), false);
    assert.equal(sms.verifyTwilioSignature({ url: "https://k.test/x", params, signature: "", authToken: "tok" }), false);
  });
  test("statuts : livré / non livré (numéro inexistant → bloqué), une seule fois", async () => {
    const { A, m } = setup();
    const id = launch(A, "Salut");
    await sms.dispatchSmsBatch(A, id, { provider: fakeProvider(), now: NOON });
    assert.equal(sms.applyTwilioStatus(A, { MessageSid: "SM1", MessageStatus: "delivered" }).applied, true);
    assert.equal(sms.applyTwilioStatus(A, { MessageSid: "SM1", MessageStatus: "delivered" }).applied, false);
    sms.applyTwilioStatus(A, { MessageSid: "SM2", MessageStatus: "undelivered", ErrorCode: "30005" });
    const c = sms.getSmsCampaign(A, id);
    assert.deepEqual([c.delivered_count, c.undelivered_count], [1, 1]);
    assert.equal(m.db.prepare("SELECT reason FROM mk_sms_suppressions").get().reason, "invalid");
    assert.equal(sms.applyTwilioStatus(m.ctx(2), { MessageSid: "SM1", MessageStatus: "delivered" }).applied, false); // autre organisation
  });
  test("SMS entrant STOP / ARRÊT : numéro bloqué + accusé ; START : la personne se réinscrit ; AIDE", () => {
    const { A, ids } = setup();
    let r = sms.handleInboundSms(A, { From: "+243812345671", Body: " arrêt " });
    assert.equal(r.action, "stop");
    assert.equal(sms.isSmsSendable(A, ids["marie@x.cd"]).ok, false);
    assert.equal(sms.smsLength(r.reply).encoding, "GSM-7");
    r = sms.handleInboundSms(A, { From: "+243812345671", Body: "START" });
    assert.equal(r.action, "start");
    assert.equal(sms.isSmsSendable(A, ids["marie@x.cd"]).ok, true);
    assert.equal(sms.handleInboundSms(A, { From: "+243812345671", Body: "Aide" }).action, "help");
    assert.equal(sms.handleInboundSms(A, { From: "+243812345671", Body: "Merci beaucoup" }).action, "none");
  });
  test("START ne lève jamais un blocage manuel ni un numéro invalide", () => {
    const { A, ids } = setup();
    sms.addSmsSuppression(A, { phone: "0812345672", reason: "manual" });
    sms.handleInboundSms(A, { From: "+243812345672", Body: "START" });
    assert.equal(sms.isSmsSendable(A, ids["jean@x.cd"]).ok, false);
  });
  test("réponse TwiML échappée", () => {
    assert.equal(sms.twiml("a<b & \"c\""), '<?xml version="1.0" encoding="UTF-8"?><Response><Message>a&lt;b &amp; &quot;c&quot;</Message></Response>');
    assert.equal(sms.twiml(""), '<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  });
});

describe("SMS campagnes — pages web", () => {
  let srv, boss;
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).get(...a); db.close(); return r; };
  const run = (sql, ...a) => { const db = srv.db(); db.prepare(sql).run(...a); db.close(); };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", MARKETING_WORKER: "" });
    boss = await loginInstructor(srv);
    for (const [email, phone] of [["a@x.cd", "+243812345671"], ["b@x.cd", "+243812345672"]]) {
      run("INSERT INTO mk_contacts (organization_id, email, first_name, sms_status, sms_phone) VALUES (1, ?, 'Marie', 'subscribed', ?)", email, phone);
      run("INSERT INTO mk_consents (organization_id, contact_id, purpose, action, source, text_shown, channel_address) VALUES (1, (SELECT id FROM mk_contacts WHERE email = ?), 'sms', 'granted', 'form', 'Oui', ?)", email, phone);
    }
  });
  after(() => srv.stop());

  test("onglet « SMS » dans le menu : campagnes, abonnés, réglages ; entrée « Campagne SMS » dans « Créer »", async () => {
    const html = (await boss.get("/marketing")).text;
    assert.match(html, /data-mk-group="sms"/);
    for (const href of ["/marketing/sms", "/marketing/sms/abonnes", "/marketing/sms/reglages", "/marketing/sms#nouvelle"]) assert.match(html, new RegExp(`href="${href}"`));
  });
  let id;
  test("créer puis écrire le message ; contrôle avant envoi affiché", async () => {
    const res = await boss.post("/marketing/sms/campagnes", { name: "Ouverture Excel" });
    id = Number(res.location.match(/(\d+)$/)[1]);
    await boss.post(`/marketing/sms/campagnes/${id}`, { name: "Ouverture Excel", target: "all", body: "Bonjour {{prenom}}, inscriptions ouvertes https://koyekola.com/excel", track_clicks: "on" });
    const html = (await boss.get(`/marketing/sms/campagnes/${id}`)).text;
    assert.match(html, /Campagne enregistrée/);
    assert.match(html, /Bonjour Marie, inscriptions ouvertes https:\/\/k\.test\/s\/xxxxxxxx/);
    assert.match(html, /Destinataires joignables<\/span><span class="mk-stat-value">2</);
    assert.match(html, /MARKETING_WORKER/); // worker arrêté : bloquant visible
    assert.match(html, /marketing-sms\.js/);
  });
  test("lancement refusé tant que le contrôle bloque (worker arrêté)", async () => {
    await boss.post(`/marketing/sms/campagnes/${id}/lancer`, { confirm_count: "2", confirm_cost: "on" });
    assert.equal(q("SELECT status FROM mk_sms_campaigns WHERE id = ?", id).status, "draft");
  });
  test("SMS de test en mode essai : rien ne part", async () => {
    await boss.post(`/marketing/sms/campagnes/${id}/test`, { to: "0812345678" });
    assert.match((await boss.get(`/marketing/sms/campagnes/${id}`)).text, /Mode essai : aucun SMS réellement envoyé vers \+243 •••• 5678/);
  });
  test("abonnés SMS : compteurs et numéros masqués", async () => {
    const html = (await boss.get("/marketing/sms/abonnes")).text;
    assert.match(html, /Joignables par SMS<\/span><span class="mk-stat-value">2</);
    assert.match(html, /\+243 •••• 5671/);
    assert.doesNotMatch(html, /812345671/);
  });
  test("rapport d'une campagne envoyée ; lien court public : clic, page STOP (GET sans effet), confirmation", async () => {
    run("UPDATE mk_sms_campaigns SET status = 'sent', sender = 'KOYEKOLA', total_recipients = 1, sent_count = 1 WHERE id = ?", id);
    run("INSERT INTO mk_sms_links (organization_id, campaign_id, url) VALUES (1, ?, 'https://koyekola.com/excel')", id);
    run("INSERT INTO mk_sms_messages (organization_id, campaign_id, contact_id, phone, status, sent_at) VALUES (1, ?, (SELECT id FROM mk_contacts WHERE email = 'a@x.cd'), '+243812345671', 'sent', 1)", id);
    run("INSERT INTO mk_sms_short_links (code, organization_id, message_id, link_id, kind) VALUES ('Lien2345', 1, (SELECT MAX(id) FROM mk_sms_messages), (SELECT MAX(id) FROM mk_sms_links), 'link'), ('Stop2345', 1, (SELECT MAX(id) FROM mk_sms_messages), NULL, 'unsubscribe')");
    assert.match((await boss.get(`/marketing/sms/campagnes/${id}`)).text, /Voir le rapport|Livrés/);
    const visitor = new (require("./helpers").Client)(srv.base);
    const click = await visitor.get("/s/Lien2345", { headers: { "user-agent": "Mozilla/5.0 (Linux; Android 14) Mobile" } });
    assert.deepEqual([click.status, click.location], [302, "https://koyekola.com/excel"]);
    assert.equal(q("SELECT click_count FROM mk_sms_campaigns WHERE id = ?", id).click_count, 1);
    const page = await visitor.get("/s/Stop2345");
    assert.match(page.text, /Ne plus recevoir les SMS de KOYEKOLA au <strong>\+243 •••• 5671/);
    assert.equal(q("SELECT sms_status FROM mk_contacts WHERE email = 'a@x.cd'").sms_status, "subscribed");
    await visitor.post("/s/Stop2345", {}, { headers: { origin: srv.base } });
    assert.equal(q("SELECT sms_status FROM mk_contacts WHERE email = 'a@x.cd'").sms_status, "unsubscribed");
    assert.equal((await visitor.get("/s/Inconnu1")).status, 404);
  });
  test("webhook Twilio : signature exigée ; STOP entrant → numéro bloqué, réponse TwiML", async () => {
    await boss.post("/marketing/sms/reglages", { provider: "console", account_sid: "AC" + "c".repeat(32), auth_token: "jeton-twilio" });
    const params = { From: "+243812345672", Body: "STOP" };
    const url = "https://k.test/webhooks/sms/twilio/1/entrant";
    const signature = crypto.createHmac("sha1", "jeton-twilio").update(url + "Body" + "STOP" + "From" + "+243812345672").digest("base64");
    const post = (sig) => fetch(`${srv.base}/webhooks/sms/twilio/1/entrant`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", "x-twilio-signature": sig }, body: new URLSearchParams(params).toString() });
    assert.equal((await post("faux")).status, 403);
    const ok = await post(signature);
    assert.equal(ok.status, 200);
    assert.match(await ok.text(), /<Message>KOYEKOLA : vous ne recevrez plus nos SMS/);
    assert.equal(q("SELECT reason FROM mk_sms_suppressions WHERE phone = '+243812345672'").reason, "stop");
  });
  test("permissions : un lecteur (viewer) voit les campagnes mais ne peut rien créer ni lancer", async () => {
    const c = await newStudent(srv);
    run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'viewer')", c.email);
    assert.equal((await c.get("/marketing/sms")).status, 200);
    assert.equal((await c.post("/marketing/sms/campagnes", { name: "x" })).status, 403);
    assert.equal((await c.post(`/marketing/sms/campagnes/${id}/lancer`, { confirm_count: "2" })).status, 403);
  });
});
