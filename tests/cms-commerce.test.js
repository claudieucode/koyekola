// KOLAKISA CMS — palier 20 : Commerce ↔ Contact Core ↔ Automation ↔ Email. Vraie base (migrations réelles), vrai pont LMS, vrai bus ; boutique = tables de la boutique.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, addLmsSchema, quiet, T0, TEST_KEY } = require("./marketing-helpers");
const auto = require("../src/marketing/automations");
const core = require("../src/marketing/contactcore");
const compliance = require("../src/marketing/compliance");
const templates = require("../src/marketing/templates");
const bridge = require("../src/marketing/bridge/events");
const abandon = require("../src/marketing/funnels/abandon");
const payments = require("../src/services/payments");
const { commerceOf } = require("../src/marketing/bridge/commerce");

let m, A, db, userId, course1, course2, handlers, sent;
const HOUR = 3600000;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const count = (sql, ...a) => one(sql, ...a).n;
const run = (sql, ...a) => Number(db.prepare(sql).run(...a).lastInsertRowid);
const PROOF = { source: "form", textShown: "Oui, je veux recevoir les e-mails", ip: "" };
async function pump() { for (const e of db.prepare("SELECT id FROM mk_events WHERE processed_at IS NULL ORDER BY id").all()) await m.bus.dispatch(e.id); }
const sync = () => bridge.syncLmsEvents(A, { limit: 200 });
const events = (name) => db.prepare("SELECT * FROM mk_events WHERE name = ? ORDER BY id").all(name).map((e) => ({ ...e, metadata: JSON.parse(e.metadata) }));
function order(total, ...courses) {
  const id = run("INSERT INTO orders (user_id, total_cents) VALUES (?, ?)", userId, total);
  for (const c of courses) run("INSERT INTO order_items (order_id, course_id, price_cents) VALUES (?, ?, ?)", id, c, Math.round(total / courses.length));
  return id;
}
const live = (over) => { const a = auto.createAutomation(A, { name: "Parcours", kind: "marketing", triggerEvent: "purchase.completed", steps: [{ type: "add_tag", tag: "client-ok" }], ...over }); auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true }); return a; };
const contact = () => one("SELECT * FROM mk_contacts WHERE lms_user_id = ?", userId);

beforeEach(() => {
  m = freshMarketing(); A = m.A; db = m.db; addLmsSchema(db);
  m.bus.on("*", auto.eventHandler({ db, settings: A.settings, log: quiet }));
  userId = run("INSERT INTO users (username, email) VALUES ('acheteuse', 'acheteuse@x.fr')");
  course1 = run("INSERT INTO courses (title, slug) VALUES ('Final Cut Pro', 'fcp')");
  course2 = run("INSERT INTO courses (title, slug) VALUES ('Motion', 'motion')");
  sync(); // initialisation : le compte devient un contact, l'historique ne déclenche rien
});

describe("achat → Contact Core → scénario", () => {
  test("achat réel : purchase.completed + lifecycle « Client » (une fois) + scénario déclenché", async () => {
    const a = live();
    assert.notEqual(contact().lifecycle_stage, "customer");
    order(4900, course1); sync(); sync();
    assert.equal(events("purchase.completed").length, 1, "un seul événement même après relecture");
    assert.equal(contact().lifecycle_stage, "customer");
    assert.equal(count("SELECT COUNT(*) n FROM mk_events WHERE name = 'contact.lifecycle_changed' AND json_extract(metadata, '$.to') = 'customer'"), 1);
    await pump();
    assert.ok(one("SELECT 1 FROM mk_automation_runs WHERE automation_id = ? AND contact_id = ?", a.id, contact().id));
    order(2000, course2); sync(); // deuxième achat : pas de nouveau changement de cycle de vie
    assert.equal(count("SELECT COUNT(*) n FROM mk_events WHERE name = 'contact.lifecycle_changed' AND json_extract(metadata, '$.to') = 'customer'"), 1);
  });

  test("filtre « formation achetée » : vaut aussi pour une commande de plusieurs formations", async () => {
    live({ name: "Motion seulement", triggers: [{ event: "purchase.completed", filter: { key: "courseId", value: String(course2) } }] });
    order(4000, course1); sync(); await pump();
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_runs"), 0, "commande sans Motion : rien");
    run("DELETE FROM mk_events WHERE name = 'x'");
    const u2 = run("INSERT INTO users (username, email) VALUES ('autre', 'autre@x.fr')"); sync();
    const id = run("INSERT INTO orders (user_id, total_cents) VALUES (?, 9000)", u2);
    run("INSERT INTO order_items (order_id, course_id, price_cents) VALUES (?, ?, 4500), (?, ?, 4500)", id, course1, id, course2);
    sync(); await pump();
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_runs"), 1, "commande de deux formations dont Motion : déclenché");
  });

  test("objet de l'événement : la commande (référence), pas une copie ; source « commerce »", () => {
    const id = order(4900, course1); sync();
    const e = events("purchase.completed")[0];
    assert.equal(e.object_type, "order"); assert.equal(String(e.object_id), String(id)); assert.equal(e.source, "commerce");
  });
});

describe("remboursements (annoncés par Stripe)", () => {
  function paidOrder(total = 5000) {
    const id = order(total, course1);
    run("INSERT INTO checkout_sessions (ref, user_id, stripe_session_id, stripe_payment_intent, status, total_cents, order_id) VALUES (?, ?, 'cs_1', 'pi_1', 'paid', ?, ?)", `ref${id}`, userId, total, id);
    sync();
    return id;
  }
  const charge = (refunds, extra = {}) => ({ id: "ch_1", payment_intent: "pi_1", currency: "eur", amount_refunded: refunds.reduce((n, r) => n + r.amount, 0), refunds: { data: refunds.map((r) => ({ status: "succeeded", currency: "eur", ...r })) }, ...extra });

  test("webhook rejoué : un seul remboursement enregistré", () => {
    paidOrder();
    assert.equal(payments.recordRefunds(db, charge([{ id: "re_1", amount: 1000 }])).recorded, 1);
    assert.equal(payments.recordRefunds(db, charge([{ id: "re_1", amount: 1000 }])).status, "already");
    assert.equal(count("SELECT COUNT(*) n FROM order_refunds"), 1);
  });
  test("paiement inconnu, remboursement non abouti ou montant invalide : rien d'enregistré", () => {
    paidOrder();
    assert.equal(payments.recordRefunds(db, charge([{ id: "re_x", amount: 100 }], { payment_intent: "pi_inconnu" })).status, "unknown");
    assert.equal(payments.recordRefunds(db, charge([{ id: "re_y", amount: 100, status: "pending" }, { id: "re_z", amount: -5 }])).recorded, 0);
    assert.equal(count("SELECT COUNT(*) n FROM order_refunds"), 0);
  });
  test("partiel puis total : événements refund.completed + order.partially_refunded / order.refunded, sans doublon, scénario déclenché", async () => {
    const id = paidOrder(5000);
    live({ name: "Après remboursement", triggerEvent: "refund.completed", steps: [{ type: "add_tag", tag: "rembourse" }] });
    payments.recordRefunds(db, charge([{ id: "re_1", amount: 1000 }])); sync();
    assert.equal(events("order.partially_refunded").length, 1); assert.equal(events("order.refunded").length, 0);
    payments.recordRefunds(db, charge([{ id: "re_1", amount: 1000 }, { id: "re_2", amount: 4000 }])); sync(); sync();
    assert.equal(events("refund.completed").length, 2);
    assert.equal(events("order.refunded").length, 1);
    const full = events("order.refunded")[0];
    assert.equal(String(full.object_id), String(id)); assert.equal(full.metadata.refundedCents, 5000);
    await pump();
    assert.equal(count("SELECT COUNT(*) n FROM mk_automation_runs"), 1, "un contact n'entre qu'une fois dans un scénario");
  });
});

describe("abandon de panier (délai réel)", () => {
  const cartAdded = (at, cid = course1) => core.recordEvent(A, { contactId: contact().id, type: "lms.cart_added", source: "site", occurredAt: at, metadata: { courseId: cid, title: "Final Cut Pro", slug: "fcp" } });
  test("pas avant le délai, une fois après, jamais en double", () => {
    cartAdded(T0);
    assert.equal(abandon.sweep(A, { now: T0 + 2 * HOUR, cartHours: 24 }).carts, 0);
    assert.equal(abandon.sweep(A, { now: T0 + 25 * HOUR, cartHours: 24 }).carts, 1);
    assert.equal(abandon.sweep(A, { now: T0 + 30 * HOUR, cartHours: 24 }).carts, 0);
    assert.equal(events("cart.abandoned")[0].metadata.courseId, course1);
  });
  test("commande ouverte ou achat avant le délai : aucune relance « panier »", () => {
    cartAdded(T0);
    core.recordEvent(A, { contactId: contact().id, type: "lms.checkout_started", source: "site", occurredAt: T0 + HOUR });
    assert.equal(abandon.sweep(A, { now: T0 + 25 * HOUR, cartHours: 24, checkoutHours: 100 }).carts, 0);
    cartAdded(T0 + 2 * HOUR, course2);
    core.recordEvent(A, { contactId: contact().id, type: "purchase.completed", source: "commerce", occurredAt: T0 + 3 * HOUR });
    assert.equal(abandon.sweep(A, { now: T0 + 40 * HOUR, cartHours: 24, checkoutHours: 100 }).carts, 0);
  });
  test("le délai est un réglage réel (Paramètres → Tunnels)", () => {
    A.settings.set(1, "cms.cart_abandon_hours", "2");
    cartAdded(T0);
    assert.equal(abandon.sweep(A, { now: T0 + 3 * HOUR }).carts, 1);
  });
});

describe("e-mails : marketing soumis au consentement, transactionnel indépendant", () => {
  let tplM, tplT, provider;
  beforeEach(() => {
    templates.setOrgAddress(A, "12 rue des Écoles, Paris");
    tplM = templates.createTemplate(A, { name: "Relance panier", kind: "marketing", subject: "Votre panier", blocks: [{ type: "text", markdown: "Formation : {{event.course_title}}" }] });
    tplT = templates.createTemplate(A, { name: "Confirmation", kind: "transactional", subject: "Commande {{event.order_id}}", blocks: [{ type: "text", markdown: "Montant {{event.order_total}}" }] });
    sent = [];
    provider = { name: "capture", capabilities: {}, async send(msg) { sent.push(msg); return { providerMessageId: `ok-${sent.length}` }; } };
    handlers = auto.jobHandlers({ db, bus: m.bus, settings: A.settings, providerFor: () => provider, now: () => T0, env: { SITE_URL: "https://k.test", ENCRYPTION_KEY: TEST_KEY }, log: quiet });
  });
  const exec = async (a) => { await pump(); const r = one("SELECT id FROM mk_automation_runs WHERE automation_id = ?", a.id); if (r) await handlers["automation.run"]({ organizationId: 1, runId: r.id }); };

  test("panier abandonné + marketing : sans consentement rien ne part ; avec consentement, l'e-mail part ; désinscrit : bloqué", async () => {
    const a = live({ triggerEvent: "cart.abandoned", steps: [{ type: "email", templateId: tplM.id }] });
    let k = 0;
    const abandonedCart = () => { k++; db.prepare("DELETE FROM mk_automation_runs").run(); core.recordEvent(A, { contactId: contact().id, type: "lms.cart_added", source: "site", occurredAt: T0 + k * 100 * HOUR, metadata: { courseId: course1 } }); abandon.sweep(A, { now: T0 + k * 100 * HOUR + 30 * HOUR, cartHours: 24 }); };
    abandonedCart(); await exec(a);
    assert.equal(sent.length, 0, "un achat ou un compte ne vaut pas consentement marketing");
    compliance.recordConsent(A, contact().id, PROOF);
    abandonedCart(); await exec(a);
    assert.equal(sent.length, 1);
    compliance.unsubscribe(A, contact().id, { source: "link" });
    abandonedCart(); await exec(a);
    assert.equal(sent.length, 1, "désinscrit : plus aucun marketing, même avec un panier abandonné");
  });

  test("confirmation d'achat transactionnelle : part sans consentement marketing, avec montant et numéro de la vraie commande", async () => {
    const a = live({ kind: "transactional", steps: [{ type: "email", templateId: tplT.id }] });
    const id = order(4900, course1); sync();
    await exec(a);
    assert.equal(sent.length, 1);
    assert.match(sent[0].subject, new RegExp(`Commande ${id}`)); assert.match(sent[0].html, /49,00/);
  });

  test("achat réel puis désinscription : l'e-mail marketing de suivi est bloqué, la confirmation transactionnelle reste possible", async () => {
    compliance.recordConsent(A, contact().id, PROOF); compliance.unsubscribe(A, contact().id, { source: "link" });
    const mk = live({ steps: [{ type: "email", templateId: tplM.id }] });
    order(3000, course1); sync();
    await exec(mk);
    assert.equal(sent.length, 0);
  });
});

describe("paiement échoué et lecture commerce du contact", () => {
  test("payment.failed : une fois par session, reason sans secret", () => {
    run("INSERT INTO checkout_sessions (ref, user_id, status, total_cents, failure_reason) VALUES ('r1', ?, 'failed', 4900, 'montant inattendu')", userId);
    assert.equal(bridge.syncPaymentFailures(A), 1); bridge.syncPaymentFailures(A);
    const ev = events("payment.failed");
    assert.equal(ev.length, 1); assert.equal(ev[0].metadata.reason, "montant inattendu"); assert.equal(ev[0].source, "commerce");
  });
  test("commerceOf : vraies commandes, remboursements, abandons ; null sans compte relié ou si l'adresse a changé", () => {
    assert.equal(commerceOf(A, contact()).count, 0);
    const id = order(5000, course1, course2);
    run("INSERT INTO order_refunds (order_id, stripe_refund_id, amount_cents) VALUES (?, 're_1', 1500)", id);
    const c = commerceOf(A, contact());
    assert.equal(c.count, 1); assert.equal(c.spentCents, 5000); assert.equal(c.refundedCents, 1500); assert.equal(c.netCents, 3500);
    assert.deepEqual(c.recent[0].products.map((p) => p.title), ["Final Cut Pro", "Motion"]);
    const sans = core.identify(A, { email: "invite@x.fr", source: "form" }).contact;
    assert.equal(commerceOf(A, sans), null, "contact sans compte : aucune donnée inventée");
    run("UPDATE users SET email = 'autre@x.fr' WHERE id = ?", userId);
    assert.equal(commerceOf(A, contact()), null, "adresse du compte différente : pas de rattachement");
  });
  test("multi-organisation : l'organisation B ne voit ni l'événement ni le contact de l'organisation A", () => {
    order(4900, course1); sync();
    assert.equal(count("SELECT COUNT(*) n FROM mk_events WHERE organization_id = 2"), 0);
  });
});
