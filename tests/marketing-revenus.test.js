// Marketing — revenus des e-mails : une commande est attribuée au DERNIER e-mail cliqué dans la fenêtre d'attribution.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, addLmsSchema, T0 } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const sending = require("../src/marketing/sending");
const revenue = require("../src/marketing/revenue");
const abtest = require("../src/marketing/sending/abtest");

const DAY = 86_400_000;
const HUMAN = "Mozilla/5.0 (Macintosh) AppleWebKit Safari";
const PROOF = { source: "form", textShown: "Oui" };
let m, A, B, list, tpl, contacts, provider;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const fake = () => { const sent = []; return { name: "fake", capabilities: {}, sent, async send(msg) { sent.push(msg); return { providerMessageId: `pm-${sent.length}` }; } }; };

// Envoie une campagne à toute la liste et renvoie { camp, messageOf(contact), linkId }
async function sendCampaign(name, { at = T0 } = {}) {
  const camp = sending.createCampaign(A, { name, templateId: tpl.id, targetType: "list", targetId: list.id });
  sending.startCampaign(A, camp.id, {});
  let r; do { r = await sending.dispatchBatch(A, camp.id, { provider, now: at, batchSize: 100 }); } while (!r.done && r.reason === "more");
  const linkId = m.db.prepare("SELECT id FROM mk_links WHERE campaign_id = ?").get(camp.id).id;
  const messageOf = (contact) => m.db.prepare("SELECT * FROM mk_messages WHERE campaign_id = ? AND contact_id = ?").get(camp.id, contact.id);
  return { camp, messageOf, linkId };
}
const click = (sent, contact, at, userAgent = HUMAN) => sending.recordClick(A, { messageId: sent.messageOf(contact).id, linkId: sent.linkId, userAgent, at });
const order = (contact, orderId, amountCents, orderedAt) => revenue.attributeOrder(A, { orderId, contactId: contact.id, amountCents, orderedAt });

beforeEach(() => {
  m = freshMarketing(); A = m.A; B = m.B;
  list = audience.createList(A, { name: "Clients" });
  templates.setOrgAddress(A, "12 rue des Écoles, Paris");
  tpl = templates.createTemplate(A, { name: "Promo", subject: "Promo", blocks: [{ type: "text", markdown: "Découvrez [la formation](https://ex.fr/excel)" }] });
  contacts = ["ana@ex.fr", "ben@ex.fr", "cy@ex.fr", "dan@ex.fr"].map((email) => {
    const { contact } = audience.upsertContact(A, { email });
    compliance.recordConsent(A, contact.id, PROOF);
    audience.addToList(A, list.id, [contact.id]);
    return contact;
  });
  provider = fake();
});

describe("attribution d'une commande", () => {
  test("achat après un clic : attribué à la campagne cliquée, avec le montant et les dates", async () => {
    const s = await sendCampaign("Excel");
    click(s, contacts[0], T0 + 1000);
    const a = order(contacts[0], 501, 4900, T0 + 2 * DAY);
    assert.deepEqual([a.order_id, a.campaign_id, a.amount_cents, a.clicked_at, a.ordered_at, a.automation_id], [501, s.camp.id, 4900, T0 + 1000, T0 + 2 * DAY, null]);
    assert.deepEqual(revenue.campaignRevenue(A, s.camp.id), { orders: 1, cents: 4900 });
  });
  test("le DERNIER clic l'emporte quand l'acheteur a cliqué dans plusieurs e-mails", async () => {
    const first = await sendCampaign("Première");
    const second = await sendCampaign("Seconde");
    click(first, contacts[0], T0 + 1000);
    click(second, contacts[0], T0 + DAY);
    click(first, contacts[0], T0 + 2 * DAY, "Mozilla/5.0 (compatible; Googlebot)"); // robot : ignoré
    assert.equal(order(contacts[0], 1, 1000, T0 + 3 * DAY).campaign_id, second.camp.id);
  });
  test("aucune attribution : sans clic, clic de robot seulement, clic hors fenêtre, clic APRÈS l'achat, achat gratuit", async () => {
    const s = await sendCampaign("Excel");
    assert.equal(order(contacts[0], 1, 1000, T0 + DAY), null, "pas de clic");
    click(s, contacts[1], T0 + 1000, "Mozilla/5.0 (compatible; bingbot)");
    assert.equal(order(contacts[1], 2, 1000, T0 + DAY), null, "robot");
    click(s, contacts[2], T0 + 1000);
    assert.equal(order(contacts[2], 3, 1000, T0 + 1000 + 8 * DAY), null, "8 jours > fenêtre de 7");
    click(s, contacts[3], T0 + 5 * DAY);
    assert.equal(order(contacts[3], 4, 1000, T0 + 4 * DAY), null, "le clic est postérieur à l'achat");
    assert.equal(order(contacts[3], 5, 0, T0 + 6 * DAY), null, "formation gratuite");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_order_attributions").get().n, 0);
  });
  test("une commande n'est attribuée qu'une fois (événement rejoué)", async () => {
    const s = await sendCampaign("Excel");
    click(s, contacts[0], T0 + 1000);
    assert.ok(order(contacts[0], 9, 2000, T0 + DAY));
    assert.equal(order(contacts[0], 9, 2000, T0 + DAY), null);
    assert.deepEqual(revenue.campaignRevenue(A, s.camp.id), { orders: 1, cents: 2000 });
  });
  test("fenêtre d'attribution réglable (1 à 30 jours) ; isolation entre organisations", async () => {
    assert.equal(revenue.getWindowDays(A), 7);
    assert.equal(code(() => revenue.setWindowDays(A, 0)), "invalid_field");
    assert.equal(code(() => revenue.setWindowDays(A, "31")), "invalid_field");
    assert.equal(revenue.setWindowDays(A, "14"), 14);
    assert.equal(revenue.getWindowDays(B), 7, "l'autre organisation garde sa propre fenêtre");
    const s = await sendCampaign("Excel");
    click(s, contacts[0], T0 + 1000);
    assert.ok(order(contacts[0], 1, 1000, T0 + 10 * DAY), "10 jours < 14");
    assert.equal(revenue.attributeOrder(B, { orderId: 2, contactId: contacts[0].id, amountCents: 1000, orderedAt: T0 + DAY }), null, "le contact d'une autre organisation n'existe pas pour B");
  });
  test("e-mail d'une automatisation : la commande est rattachée à l'automatisation", async () => {
    const s = await sendCampaign("Système");
    m.db.exec("INSERT INTO mk_automations (organization_id, name, trigger_event) VALUES (1, 'Bienvenue', 'lms.user_registered')");
    const autoId = m.db.prepare("SELECT id FROM mk_automations WHERE name = 'Bienvenue'").get().id;
    m.db.prepare("UPDATE mk_campaigns SET kind = 'automation', automation_id = ? WHERE id = ?").run(autoId, s.camp.id);
    click(s, contacts[0], T0 + 1000);
    assert.equal(order(contacts[0], 1, 3000, T0 + DAY).automation_id, autoId);
    const o = revenue.revenueOverview(A, { days: 30 });
    assert.deepEqual(o.byAutomation.map((r) => [r.name, r.orders, r.cents]), [["Bienvenue", 1, 3000]]);
    assert.equal(o.byCampaign.length, 0, "pas compté deux fois comme campagne");
  });
});

describe("déclenchement par l'événement de commande du site", () => {
  test("« lms.order_completed » → attribution en arrière-plan ; autres événements ignorés", async () => {
    const s = await sendCampaign("Excel");
    click(s, contacts[0], T0 + 1000);
    m.bus.on("lms.order_completed", revenue.eventHandler({ db: m.db, settings: A.settings }));
    const ev = m.bus.emit({ organizationId: 1, name: "lms.order_completed", email: contacts[0].email, contactId: contacts[0].id, source: "lms", metadata: { orderId: 77, totalCents: 5900 }, idempotencyKey: "order:77", occurredAt: T0 + DAY });
    await m.bus.dispatch(ev.id);
    const other = m.bus.emit({ organizationId: 1, name: "lms.course_enrolled", contactId: contacts[0].id, source: "lms", metadata: { courseId: 1 }, occurredAt: T0 + DAY });
    await m.bus.dispatch(other.id);
    assert.deepEqual(m.db.prepare("SELECT order_id, amount_cents FROM mk_order_attributions").all().map((r) => [r.order_id, r.amount_cents]), [[77, 5900]]);
  });
});

describe("rapports", () => {
  test("rapport de campagne : revenus, commandes, revenu par destinataire", async () => {
    const s = await sendCampaign("Excel");
    click(s, contacts[0], T0 + 1000);
    click(s, contacts[1], T0 + 1000);
    order(contacts[0], 1, 4900, T0 + DAY);
    order(contacts[1], 2, 2900, T0 + DAY);
    const r = sending.campaignStats(A, s.camp.id).revenue;
    assert.deepEqual([r.cents, r.orders, r.perRecipient, r.windowDays], [7800, 2, 1950, 7]);
  });
  test("vue « Revenus » : totaux, part des ventes du site, classement des campagnes, dernières commandes", async () => {
    addLmsSchema(m.db);
    const ms = (t) => new Date(t).toISOString().slice(0, 19).replace("T", " ");
    const now = Date.now();
    m.db.prepare("INSERT INTO orders (user_id, total_cents, created_at) VALUES (1, 4900, ?), (2, 5100, ?), (3, 0, ?)").run(ms(now - DAY), ms(now - DAY), ms(now - DAY));
    const ctx = { ...A, now: () => now };
    const s1 = await sendCampaign("Excel", { at: now - 3 * DAY });
    const s2 = await sendCampaign("Word", { at: now - 3 * DAY });
    click(s1, contacts[0], now - 2 * DAY);
    click(s2, contacts[1], now - 2 * DAY);
    revenue.attributeOrder(ctx, { orderId: 1, contactId: contacts[0].id, amountCents: 4900, orderedAt: now - DAY });
    revenue.attributeOrder(ctx, { orderId: 2, contactId: contacts[1].id, amountCents: 2000, orderedAt: now - DAY });
    revenue.attributeOrder(ctx, { orderId: 3, contactId: contacts[1].id, amountCents: 1000, orderedAt: now - 40 * DAY }); // hors période de 30 j (clic absent de toute façon)
    const o = revenue.revenueOverview(ctx, { days: 30 });
    assert.deepEqual([o.totals.cents, o.totals.orders, o.totals.buyers, o.totals.average], [6900, 2, 2, 3450]);
    assert.deepEqual(o.sales, { orders: 2, cents: 10000 }, "commandes gratuites exclues");
    assert.equal(o.share, 69);
    assert.deepEqual(o.byCampaign.map((r) => [r.name, r.cents, r.orders]), [["Excel", 4900, 1], ["Word", 2000, 1]]);
    assert.deepEqual(o.recent.map((r) => [r.email, r.campaign_name]).sort(), [["ana@ex.fr", "Excel"], ["ben@ex.fr", "Word"]]);
    assert.equal(revenue.revenueOverview(ctx, { days: 999 }).period, 30, "période inconnue → 30 jours");
  });
});

describe("test A/B départagé par les revenus", () => {
  test("la version qui rapporte le plus gagne, même avec moins de clics", async () => {
    for (let i = 0; i < 16; i++) {
      const { contact } = audience.upsertContact(A, { email: `x${i}@ex.fr` });
      compliance.recordConsent(A, contact.id, PROOF);
      audience.addToList(A, list.id, [contact.id]);
    }
    const camp = sending.createCampaign(A, { name: "AB revenus", templateId: tpl.id, targetType: "list", targetId: list.id });
    sending.saveAbTest(A, camp.id, { enabled: true, variants: [{ subject: "A" }, { subject: "B" }], percent: 20, metric: "revenue", waitMinutes: 60 });
    assert.equal(sending.preflight(A, camp.id).ready, true);
    sending.startCampaign(A, camp.id);
    await sending.dispatchBatch(A, camp.id, { provider, now: T0, batchSize: 100 });
    const msgs = m.db.prepare("SELECT * FROM mk_messages WHERE campaign_id = ? ORDER BY variant, id").all(camp.id);
    const linkId = m.db.prepare("SELECT id FROM mk_links WHERE campaign_id = ?").get(camp.id).id;
    const [a1, a2, b1] = [msgs.filter((x) => x.variant === 0)[0], msgs.filter((x) => x.variant === 0)[1], msgs.filter((x) => x.variant === 1)[0]];
    for (const msg of [a1, a2, b1]) sending.recordClick(A, { messageId: msg.id, linkId, userAgent: HUMAN, at: T0 + 1000 });
    revenue.attributeOrder(A, { orderId: 1, contactId: a1.contact_id, amountCents: 1000, orderedAt: T0 + 2000 });
    revenue.attributeOrder(A, { orderId: 2, contactId: b1.contact_id, amountCents: 9900, orderedAt: T0 + 2000 });
    const results = abtest.variantResults(A, sending.getCampaign(A, camp.id));
    assert.deepEqual(results.map((r) => [r.letter, r.clicks, r.revenueCents]), [["A", 2, 1000], ["B", 1, 9900]]);
    assert.equal(abtest.decideWinner(A, camp.id, { now: T0 + 2 * 3600000 }).winner, 1);
  });
  test("critère « revenus » sans suivi des clics : bloqué", () => {
    const camp = sending.createCampaign(A, { name: "Sans clics", templateId: tpl.id, targetType: "list", targetId: list.id, trackClicks: false });
    sending.saveAbTest(A, camp.id, { enabled: true, variants: [{ subject: "A" }, { subject: "B" }], percent: 50, metric: "revenue", waitMinutes: 60 });
    assert.ok(sending.preflight(A, camp.id).errors.some((e) => e.code === "ab_tracking"));
  });
});
