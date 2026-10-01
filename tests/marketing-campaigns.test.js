// Marketing M3a (2/2) — campagnes : audience, contrôle avant envoi, lancement, envoi par lots, conformité à chaque message.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY, T0 } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const segments = require("../src/marketing/segments");
const templates = require("../src/marketing/templates");
const sending = require("../src/marketing/sending");
const config = require("../src/marketing/sending/config");
const { createProvider, SendError } = require("../src/marketing/sending/providers");
const { verifyToken } = require("../src/marketing/security/tokens");
const { createWorker } = require("../src/marketing/queue/worker");

let m, A, B, list, tpl, camp, provider;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const quiet = { log() {}, warn() {}, error() {} };
const PROOF = { source: "form", textShown: "Oui, je veux recevoir la newsletter" };
const count = (t, where = "1=1") => m.db.prepare(`SELECT COUNT(*) n FROM ${t} WHERE ${where}`).get().n;
const add = (email, { consent = true, first_name = "" } = {}) => {
  const { contact } = audience.upsertContact(A, { email, first_name });
  if (consent) compliance.recordConsent(A, contact.id, PROOF);
  audience.addToList(A, list.id, [contact.id]);
  return contact;
};
const recipient = (email) => m.db.prepare("SELECT * FROM mk_campaign_recipients WHERE email = ?").get(email);
const campaignRow = (id = camp.id) => m.db.prepare("SELECT * FROM mk_campaigns WHERE id = ?").get(id);
const start = (over = {}) => sending.startCampaign(A, camp.id, over);
const batch = (over = {}) => sending.dispatchBatch(A, camp.id, { provider, now: T0, ...over });
// Fournisseur programmable : renvoie ou lève selon le destinataire / l'appel
const scripted = (fn) => { const sent = []; return { name: "fake", capabilities: {}, sent, async send(msg) { sent.push(msg); return fn(msg, sent.length); } }; };

beforeEach(() => {
  m = freshMarketing(); A = m.A; B = m.B;
  list = audience.createList(A, { name: "Newsletter" });
  templates.setOrgAddress(A, "12 rue des Écoles\n75005 Paris");
  tpl = templates.createTemplate(A, { name: "Modèle", subject: "Salut {{contact.first_name | default:\"ami\"}}", preheader: "Aperçu", blocks: [{ type: "text", markdown: "Bonjour {{contact.first_name | default:\"ami\"}} [Site](https://ex.fr/a) et [Autre](https://ex.fr/b?x=1&y=2)" }] });
  for (const e of ["a@ex.fr", "b@ex.fr", "c@ex.fr"]) add(e, { first_name: e[0].toUpperCase() });
  camp = sending.createCampaign(A, { name: "Campagne 1", templateId: tpl.id, targetType: "list", targetId: list.id });
  provider = createProvider({ provider: "console" }, { log: quiet });
});

describe("création et modification", () => {
  test("brouillon avec modèle marketing et cible valides ; options de suivi (clics oui, ouvertures non par défaut)", () => {
    assert.deepEqual([camp.status, camp.track_clicks, camp.track_opens, camp.total_recipients], ["draft", 1, 0, 0]);
    assert.deepEqual(sending.listCampaigns(A).map((c) => c.name), ["Campagne 1"]);
  });
  test("refus : nom vide/en double, modèle transactionnel ou inconnu, cible inconnue, catégorie inconnue, éléments d'une autre organisation", () => {
    const base = { name: "X", templateId: tpl.id, targetType: "list", targetId: list.id };
    assert.equal(code(() => sending.createCampaign(A, { ...base, name: "  " })), "invalid_field");
    assert.equal(code(() => sending.createCampaign(A, { ...base, name: "campagne 1" })), "duplicate");
    const tx = templates.createTemplate(A, { name: "Transac", kind: "transactional", subject: "S", blocks: [{ type: "divider" }] });
    assert.equal(code(() => sending.createCampaign(A, { ...base, templateId: tx.id })), "invalid_field");
    assert.equal(code(() => sending.createCampaign(A, { ...base, templateId: 999 })), "not_found");
    assert.equal(code(() => sending.createCampaign(A, { ...base, targetId: 999 })), "not_found");
    assert.equal(code(() => sending.createCampaign(A, { ...base, targetType: "tous" })), "invalid_field");
    assert.equal(code(() => sending.createCampaign(A, { ...base, category: "inconnue" })), "not_found");
    const tb = templates.createTemplate(B, { name: "B", subject: "S", blocks: [{ type: "divider" }] });
    assert.equal(code(() => sending.createCampaign(A, { ...base, templateId: tb.id })), "not_found");
    const lb = audience.createList(B, { name: "LB" });
    assert.equal(code(() => sending.createCampaign(A, { ...base, targetId: lb.id })), "not_found");
  });
  test("modification et suppression : brouillon seulement ; isolation entre organisations", () => {
    assert.equal(sending.updateCampaign(A, camp.id, { name: "Renommée", trackOpens: true }).track_opens, 1);
    assert.equal(code(() => sending.updateCampaign(B, camp.id, { name: "pirate" })), "not_found");
    assert.equal(sending.getCampaign(B, camp.id), null);
    assert.equal(sending.deleteCampaign(B, camp.id), false);
    start();
    assert.equal(code(() => sending.updateCampaign(A, camp.id, { name: "Trop tard" })), "invalid_state");
    assert.equal(code(() => sending.deleteCampaign(A, camp.id)), "invalid_state");
  });
});

describe("audience : seuls les contacts joignables", () => {
  const seed = () => {
    const unknown = add("inconnu@ex.fr", { consent: false });
    const unsub = add("desinscrit@ex.fr"); compliance.unsubscribe(A, unsub.id, { source: "link" });
    const blocked = add("bloque@ex.fr"); compliance.addSuppression(A, { email: "bloque@ex.fr", reason: "bounced" });
    const listOut = add("liste-non@ex.fr"); compliance.unsubscribe(A, listOut.id, { scope: "list", listId: list.id, source: "link" });
    compliance.createCategory(A, { key: "promotions", label: "Promotions" });
    const catOut = add("categorie-non@ex.fr"); compliance.setPreference(A, catOut.id, "promotions", false);
    return { unknown, unsub, blocked, listOut, catOut };
  };
  test("résumé : total ciblé, joignables, répartition des exclus", () => {
    seed();
    const s = sending.audienceSummary(A, { targetType: "list", targetId: list.id });
    assert.equal(s.targetTotal, 8);
    assert.equal(s.sendable, 4, "a, b, c et la personne qui n'a refusé qu'une catégorie");
    assert.equal(s.excluded.total, 4);
    assert.deepEqual([s.excluded.not_subscribed, s.excluded.unsubscribed, s.excluded.blocked, s.excluded.list_unsubscribed], [1, 1, 1, 1]);
    assert.equal(sending.audienceSummary(A, { targetType: "list", targetId: list.id, category: "promotions" }).sendable, 3);
  });
  test("INVARIANT : le calcul en masse donne exactement les contacts que isSendable accepte", () => {
    const s = seed();
    for (const category of [undefined, "promotions"]) {
      const bulk = new Set(sending.sendableContactIds(A, { targetType: "list", targetId: list.id, category }));
      const member = audience.listMembers(A, list.id, { limit: 200 }).rows;
      const expected = new Set(member.filter((c) => compliance.isSendable(A, c.id, { listId: list.id, category }).ok).map((c) => c.id));
      assert.deepEqual([...bulk].sort(), [...expected].sort(), String(category));
    }
    assert.ok(s.unknown.id);
  });
  test("cible « segment » : même règle, jamais plus large que la conformité", () => {
    seed();
    const seg = segments.createSegment(A, { name: "Tous", definition: { op: "or", rules: [{ field: "email", cmp: "contains", value: "@" }] } });
    const s = sending.audienceSummary(A, { targetType: "segment", targetId: seg.id });
    assert.equal(s.targetTotal, 8);
    // 5 et non 4 : la désinscription d'UNE liste ne s'applique qu'aux campagnes ciblant cette liste
    assert.equal(s.sendable, 5);
    assert.equal(s.excluded.list_unsubscribed, 0);
  });
  test("un contact d'une autre organisation n'est jamais dans l'audience", () => {
    audience.upsertContact(B, { email: "b-only@ex.fr" });
    assert.equal(sending.sendableContactIds(A, { targetType: "list", targetId: list.id }).length, 3);
  });
});

describe("contrôle avant envoi", () => {
  const codes = (r, kind) => r[kind].map((x) => x.code);
  test("prêt : modèle complet, audience joignable, jetons et adresse de base valides (le fournisseur console est signalé)", () => {
    const r = sending.preflight(A, camp.id, { workerOn: true });
    assert.equal(r.ready, true);
    assert.deepEqual(r.errors, []);
    assert.ok(codes(r, "warnings").includes("provider_console"));
    assert.equal(r.audience.sendable, 3);
  });
  test("erreurs bloquantes : modèle non prêt, aucun destinataire joignable, jetons ou adresse de base invalides", () => {
    templates.updateTemplate(A, tpl.id, { subject: "" });
    let r = sending.preflight(A, camp.id, {});
    assert.ok(codes(r, "errors").includes("template_not_ready"));
    templates.updateTemplate(A, tpl.id, { subject: "S" });
    const empty = audience.createList(A, { name: "Vide" });
    const c2 = sending.createCampaign(A, { name: "Vide", templateId: tpl.id, targetType: "list", targetId: empty.id });
    assert.ok(codes(sending.preflight(A, c2.id, {}), "errors").includes("no_audience"));
    assert.ok(codes(sending.preflight({ ...A, tokenKey: "" }, camp.id, {}), "errors").includes("token_key"));
    config.saveSendingConfig(A, { provider: "smtp", from: "a@k.test" });
    r = sending.preflight({ ...A, baseUrl: "http://k.test" }, camp.id, { smtpAvailable: true });
    assert.ok(codes(r, "errors").includes("base_url"), "vrai fournisseur : adresse https obligatoire (liens de désinscription)");
    assert.ok(!codes(sending.preflight({ ...A, baseUrl: "https://k.test" }, camp.id, { smtpAvailable: true }), "errors").includes("base_url"));
    assert.ok(codes(sending.preflight(A, camp.id, { smtpAvailable: false }), "errors").includes("provider_incomplete"));
  });
  test("Resend sans clé ou sans expéditeur : refusé ; console avec adresse locale http : accepté", () => {
    config.saveSendingConfig(A, { provider: "resend", from: "a@k.test", apiKey: "re_X" });
    m.db.prepare("DELETE FROM mk_settings WHERE key = 'email.api_key'").run();
    assert.ok(codes(sending.preflight(A, camp.id, {}), "errors").includes("provider_incomplete"));
    config.saveSendingConfig(A, { provider: "console" });
    assert.equal(sending.preflight({ ...A, baseUrl: "http://localhost:3002" }, camp.id, {}).ready, true);
  });
  test("avertissements : adresse postale absente, worker éteint, catégorie de préférences non choisie", () => {
    m.db.prepare("DELETE FROM mk_settings WHERE key = 'org.address'").run();
    const r = sending.preflight(A, camp.id, { workerOn: false });
    for (const w of ["address_missing", "worker_off"]) assert.ok(codes(r, "warnings").includes(w), w);
  });
});

describe("lancement", () => {
  test("contenu FIGÉ, destinataires joignables matérialisés, travail en file, audit", () => {
    add("inconnu@ex.fr", { consent: false });
    const r = start();
    assert.equal(r.recipients, 3);
    const row = campaignRow();
    assert.deepEqual([row.status, row.total_recipients], ["scheduled", 3]);
    assert.equal(JSON.parse(row.snapshot).subject, "Salut {{contact.first_name | default:\"ami\"}}");
    assert.equal(count("mk_campaign_recipients", "status = 'queued'"), 3);
    assert.equal(recipient("inconnu@ex.fr"), undefined, "un contact sans consentement n'est jamais destinataire");
    const job = m.db.prepare("SELECT type, payload, run_at FROM mk_jobs WHERE type = 'campaign.dispatch'").get();
    assert.deepEqual(JSON.parse(job.payload), { organizationId: 1, campaignId: camp.id });
    assert.ok(m.db.prepare("SELECT 1 FROM mk_audit_logs WHERE action = 'campaign.started'").get());
  });
  test("modifier le modèle après le lancement ne change pas ce qui est envoyé", async () => {
    start();
    templates.updateTemplate(A, tpl.id, { subject: "TOUT A CHANGÉ" });
    await batch();
    assert.ok(provider.sent.every((s) => /^Salut /.test(s.subject)));
  });
  test("relancer, lancer sans préparation valide ou programmer dans le passé : refusé", () => {
    start();
    assert.equal(code(() => start()), "invalid_state");
    const c2 = sending.createCampaign(A, { name: "Planifiée", templateId: tpl.id, targetType: "list", targetId: list.id });
    assert.equal(code(() => sending.startCampaign(A, c2.id, { scheduledAt: T0 - 1000, now: T0 })), "invalid_field");
    assert.equal(code(() => sending.startCampaign(A, c2.id, { scheduledAt: T0 + 400 * 86400000, now: T0 })), "invalid_field");
    const empty = audience.createList(A, { name: "Vide" });
    const c3 = sending.createCampaign(A, { name: "Sans public", templateId: tpl.id, targetType: "list", targetId: empty.id });
    assert.equal(code(() => sending.startCampaign(A, c3.id, {})), "preflight_failed");
    assert.equal(campaignRow(c3.id).status, "draft");
  });
  test("programmation : le travail est planifié à l'heure demandée", () => {
    sending.startCampaign(A, camp.id, { scheduledAt: T0 + 3600000, now: T0 });
    assert.equal(m.db.prepare("SELECT run_at FROM mk_jobs WHERE type = 'campaign.dispatch'").get().run_at, T0 + 3600000);
    return batch({ now: T0 }).then((r) => { assert.ok(r.waitMs > 0); assert.equal(provider.sent.length, 0); });
  });
});

describe("envoi par lots", () => {
  test("tout est envoyé : messages personnalisés, en-têtes de désinscription en un clic, compteurs, fin de campagne, événement", async () => {
    start();
    const r = await batch();
    assert.equal(r.done, true);
    assert.equal(provider.sent.length, 3);
    const msg = provider.sent.find((s) => s.to === "a@ex.fr");
    assert.equal(msg.subject, "Salut A");
    assert.match(msg.html, /Bonjour A/);
    assert.match(msg.text, /Bonjour A/);
    assert.equal(msg.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
    const url = msg.headers["List-Unsubscribe"].match(/^<(https:\/\/k\.test\/u\/[^>]+)>$/)[1];
    const token = verifyToken(url.split("/u/")[1], TEST_KEY, { kind: "unsub" });
    assert.equal(token.ok, true);
    assert.equal(token.payload.c, audience.findByEmail(A, "a@ex.fr").id);
    assert.ok(Number.isInteger(token.payload.m), "le jeton identifie aussi le message");
    assert.ok(msg.html.includes(url.replace(/&/g, "&amp;")) || msg.html.includes(url), "le même lien figure dans le pied de page");
    const row = campaignRow();
    assert.deepEqual([row.status, row.sent_count, row.skipped_count, row.failed_count], ["sent", 3, 0, 0]);
    assert.ok(row.finished_at);
    assert.equal(count("mk_messages", "status = 'sent' AND provider_message_id LIKE 'console-%'"), 3);
    assert.equal(count("mk_message_events", "type = 'sent'"), 3);
    assert.equal(count("mk_events", "name = 'campaign.sent'"), 1);
    assert.equal(audience.findByEmail(A, "a@ex.fr").last_campaign_at !== null, true);
  });
  test("idempotence : rappeler l'envoi ne renvoie rien (jamais de doublon)", async () => {
    start();
    await batch(); await batch(); await batch();
    assert.equal(provider.sent.length, 3);
    assert.equal(count("mk_messages"), 3);
  });
  test("CONFORMITÉ À CHAQUE MESSAGE : désinscrit, bloqué ou consentement retiré entre le lancement et l'envoi = rien n'est envoyé", async () => {
    start();
    compliance.unsubscribe(A, audience.findByEmail(A, "a@ex.fr").id, { source: "link" });
    compliance.addSuppression(A, { email: "b@ex.fr", reason: "complained" });
    await batch();
    assert.deepEqual(provider.sent.map((s) => s.to), ["c@ex.fr"]);
    assert.deepEqual([recipient("a@ex.fr").status, recipient("a@ex.fr").reason], ["skipped", "unsubscribed"]);
    assert.deepEqual([recipient("b@ex.fr").status, recipient("b@ex.fr").reason], ["skipped", "suppressed"]);
    const row = campaignRow();
    assert.deepEqual([row.sent_count, row.skipped_count, row.status], [1, 2, "sent"]);
  });
  test("désinscription de LA LISTE ciblée entre-temps : respectée aussi", async () => {
    start();
    compliance.unsubscribe(A, audience.findByEmail(A, "c@ex.fr").id, { scope: "list", listId: list.id, source: "link" });
    await batch();
    assert.equal(recipient("c@ex.fr").reason, "list_unsubscribed");
    assert.equal(provider.sent.length, 2);
  });
  test("débit par minute : envoi limité, attente indiquée, puis reprise quand la fenêtre est passée", async () => {
    config.saveSendingConfig(A, { provider: "console", ratePerMinute: 2 });
    start();
    let r = await batch({ now: T0 });
    assert.equal(provider.sent.length, 2);
    assert.deepEqual([r.done, r.reason], [false, "rate"]);
    assert.ok(r.waitMs > 0 && r.waitMs <= 61000);
    r = await batch({ now: T0 + 30000 });
    assert.equal(provider.sent.length, 2, "encore dans la même minute");
    r = await batch({ now: T0 + 61000 });
    assert.equal(provider.sent.length, 3);
    assert.equal(r.done, true);
  });
  test("plafond quotidien : au-delà, l'envoi attend le lendemain (UTC)", async () => {
    config.saveSendingConfig(A, { provider: "console", dailyLimit: 2 });
    start();
    const r = await batch({ now: T0 });
    assert.equal(provider.sent.length, 2);
    assert.equal(r.reason, "daily");
    const midnight = Math.floor(T0 / 86400000 + 1) * 86400000;
    assert.equal(T0 + r.waitMs, midnight);
    await batch({ now: midnight + 1000 });
    assert.equal(provider.sent.length, 3);
  });
  test("échec temporaire : nouvelle tentative plus tard (attente croissante), puis succès ; abandon après 3 essais", async () => {
    const flaky = scripted((msg, n) => { if (n <= 1) throw new SendError("temporary"); return { providerMessageId: `ok-${n}` }; });
    start();
    let r = await batch({ provider: flaky, now: T0 });
    assert.equal(recipient("a@ex.fr").status, "queued");
    assert.equal(recipient("a@ex.fr").attempts, 1);
    assert.ok(recipient("a@ex.fr").next_attempt_at > T0);
    assert.equal(count("mk_messages", "status = 'sent'"), 2, "les autres destinataires ne sont pas bloqués");
    r = await batch({ provider: flaky, now: T0 + 10 * 60000 });
    assert.equal(recipient("a@ex.fr").status, "sent");
    assert.equal(campaignRow().status, "sent");

    const dead = sending.createCampaign(A, { name: "Toujours en panne", templateId: tpl.id, targetType: "list", targetId: list.id });
    sending.startCampaign(A, dead.id, {});
    const down = scripted(() => { throw new SendError("temporary"); });
    for (let i = 0; i < 4; i++) await sending.dispatchBatch(A, dead.id, { provider: down, now: T0 + i * 3600000 });
    assert.equal(m.db.prepare("SELECT status, reason FROM mk_campaign_recipients WHERE campaign_id = ? AND email = 'a@ex.fr'").get(dead.id).reason, "temporary_exhausted");
    assert.equal(campaignRow(dead.id).status, "sent");
  });
  test("adresse refusée par le serveur : rebond dur → liste de suppression et statut « bounced »", async () => {
    start();
    const p = scripted((msg) => { if (msg.to === "b@ex.fr") throw new SendError("recipient_rejected"); return { providerMessageId: "ok" }; });
    await batch({ provider: p });
    assert.equal(recipient("b@ex.fr").status, "failed");
    assert.equal(audience.findByEmail(A, "b@ex.fr").status, "bounced");
    assert.equal(m.db.prepare("SELECT reason FROM mk_suppressions WHERE email = 'b@ex.fr'").get().reason, "bounced");
    assert.equal(count("mk_message_events", "type = 'bounced'"), 1);
    assert.equal(campaignRow().bounced_count, 1);
  });
  test("refus permanent : échec définitif de ce destinataire seulement", async () => {
    start();
    await batch({ provider: scripted((msg) => { if (msg.to === "a@ex.fr") throw new SendError("permanent"); return { providerMessageId: "ok" }; }) });
    assert.deepEqual([recipient("a@ex.fr").status, recipient("a@ex.fr").reason], ["failed", "permanent"]);
    assert.equal(audience.findByEmail(A, "a@ex.fr").status, "subscribed", "un refus permanent n'est pas un rebond prouvé");
    assert.deepEqual([campaignRow().sent_count, campaignRow().failed_count], [2, 1]);
  });
  test("limitation par le fournisseur : le lot s'arrête, rien n'est perdu, l'attente demandée est respectée", async () => {
    start();
    const p = scripted((msg, n) => { if (n === 2) throw new SendError("rate_limited", { retryAfterMs: 9000 }); return { providerMessageId: `ok-${n}` }; });
    const r = await batch({ provider: p });
    assert.deepEqual([r.done, r.reason, r.waitMs], [false, "provider_rate", 9000]);
    assert.equal(count("mk_campaign_recipients", "status = 'queued'"), 2);
    assert.equal(count("mk_campaign_recipients", "status = 'sending'"), 0);
  });
  test("configuration refusée par le fournisseur : la campagne est mise en pause avec un message, rien n'est perdu", async () => {
    start();
    const r = await batch({ provider: scripted(() => { throw new SendError("config"); }) });
    assert.equal(campaignRow().status, "paused");
    assert.match(campaignRow().error, /configuration|clé|identifiants/i);
    assert.equal(count("mk_campaign_recipients", "status = 'queued'"), 3);
    assert.equal(r.done, false);
  });
  test("erreur imprévue sur un destinataire : ce destinataire échoue, les autres partent", async () => {
    start();
    await batch({ provider: scripted((msg) => { if (msg.to === "a@ex.fr") throw new TypeError("bug"); return { providerMessageId: "ok" }; }) });
    assert.equal(recipient("a@ex.fr").reason, "error");
    assert.equal(count("mk_campaign_recipients", "status = 'sent'"), 2);
  });
  test("envoi interrompu (« sending » resté bloqué) : marqué échoué, JAMAIS renvoyé automatiquement", async () => {
    start();
    m.db.prepare("UPDATE mk_campaign_recipients SET status = 'sending', updated_at = ? WHERE email = 'a@ex.fr'").run(T0 - 20 * 60000);
    await batch();
    assert.deepEqual([recipient("a@ex.fr").status, recipient("a@ex.fr").reason], ["failed", "interrupted"]);
    assert.ok(!provider.sent.some((s) => s.to === "a@ex.fr"));
  });
  test("pause, reprise, annulation", async () => {
    start();
    sending.pauseCampaign(A, camp.id);
    let r = await batch();
    assert.equal(provider.sent.length, 0);
    assert.equal(r.done, false);
    sending.resumeCampaign(A, camp.id);
    await batch();
    assert.equal(provider.sent.length, 3);

    const c2 = sending.createCampaign(A, { name: "À annuler", templateId: tpl.id, targetType: "list", targetId: list.id });
    sending.startCampaign(A, c2.id, {});
    sending.cancelCampaign(A, c2.id);
    assert.equal(campaignRow(c2.id).status, "cancelled");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_campaign_recipients WHERE campaign_id = ? AND status = 'skipped' AND reason = 'cancelled'").get(c2.id).n, 3);
    const before = provider.sent.length;
    await sending.dispatchBatch(A, c2.id, { provider, now: T0 });
    assert.equal(provider.sent.length, before);
    assert.equal(code(() => sending.cancelCampaign(A, camp.id)), "invalid_state", "une campagne terminée ne s'annule pas");
  });
  test("modèle devenu invalide après le lancement : campagne en échec avec message, aucun envoi", async () => {
    start();
    m.db.prepare("UPDATE mk_campaigns SET snapshot = ? WHERE id = ?").run(JSON.stringify({ kind: "marketing", subject: "S", blocks: [{ type: "text", markdown: "{{secret.cle}}" }] }), camp.id);
    await batch();
    assert.equal(campaignRow().status, "failed");
    assert.match(campaignRow().error, /secret\.cle/);
    assert.equal(provider.sent.length, 0);
  });
  test("effacement d'un contact en cours de route : ses lignes disparaissent, les compteurs restent", async () => {
    start();
    await batch();
    audience.deleteContact(A, audience.findByEmail(A, "a@ex.fr").id);
    assert.equal(count("mk_messages"), 2);
    assert.equal(campaignRow().sent_count, 3);
  });
  test("isolation : une autre organisation ne peut ni lancer, ni envoyer, ni voir la campagne", async () => {
    start();
    assert.equal(code(() => sending.pauseCampaign(B, camp.id)), "not_found");
    await assert.rejects(() => sending.dispatchBatch(B, camp.id, { provider, now: T0 }), (e) => e.code === "not_found");
    assert.equal(provider.sent.length, 0);
  });
});

describe("suivi des liens et des ouvertures", () => {
  test("liens réécrits vers /t/c/<jeton> (destination lue en base), désinscription non suivie, texte inchangé", async () => {
    start();
    await batch();
    const msg = provider.sent.find((s) => s.to === "a@ex.fr");
    assert.doesNotMatch(msg.html, /href="https:\/\/ex\.fr\/a"/);
    const tracked = [...msg.html.matchAll(/href="(https:\/\/k\.test\/t\/c\/[^"]+)"/g)].map((x) => x[1]);
    assert.equal(tracked.length, 2);
    const t = verifyToken(tracked[0].split("/t/c/")[1], TEST_KEY, { kind: "click" });
    assert.equal(t.ok, true);
    const link = m.db.prepare("SELECT url FROM mk_links WHERE id = ?").get(t.payload.l);
    assert.match(link.url, /^https:\/\/ex\.fr\//);
    assert.equal(count("mk_links"), 2);
    assert.equal(m.db.prepare("SELECT url FROM mk_links WHERE url LIKE '%x=1%'").get().url, "https://ex.fr/b?x=1&y=2");
    assert.match(msg.html, /href="https:\/\/k\.test\/u\/[^"]+"/, "le lien de désinscription n'est pas réécrit");
    assert.match(msg.text, /https:\/\/ex\.fr\/a/);
    assert.doesNotMatch(msg.html, /\/t\/o\//);
  });
  test("suivi des clics désactivé : liens d'origine ; ouvertures activées : pixel invisible", async () => {
    sending.updateCampaign(A, camp.id, { trackClicks: false, trackOpens: true });
    start();
    await batch();
    const msg = provider.sent[0];
    assert.match(msg.html, /href="https:\/\/ex\.fr\/a"/);
    assert.match(msg.html, /<img src="https:\/\/k\.test\/t\/o\/[^"]+\.gif" width="1" height="1" alt="" style="display:block;border:0"/);
    const token = msg.html.match(/\/t\/o\/([^"]+)\.gif/)[1];
    assert.equal(verifyToken(token, TEST_KEY, { kind: "open" }).ok, true);
    assert.equal(count("mk_links"), 0);
  });
});

describe("via la file de travaux", () => {
  test("le worker exécute l'envoi complet ; reprogramme l'attente quand le débit est atteint", async () => {
    config.saveSendingConfig(A, { provider: "console", ratePerMinute: 2 });
    start();
    const shared = createProvider({ provider: "console" }, { log: quiet });
    let clock = T0;
    const handlers = sending.jobHandlers({ db: m.db, bus: m.bus, settings: A.settings, env: { ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test" }, providerFor: () => shared, now: () => clock, log: quiet });
    const worker = createWorker({ db: m.db, handlers, workerId: "t", log: quiet, now: () => clock });
    await worker.drain();
    assert.equal(shared.sent.length, 2);
    const next = m.db.prepare("SELECT run_at, state FROM mk_jobs WHERE type = 'campaign.dispatch' AND state = 'pending'").get();
    assert.ok(next && next.run_at > T0, "un travail de suite est planifié");
    clock = next.run_at + 1000;
    await worker.drain();
    assert.equal(shared.sent.length, 3);
    assert.equal(campaignRow().status, "sent");
  });
});
