// KOLAKISA CMS — palier 20 par les vraies routes : webhook Stripe signé (remboursement), fiche commande ↔ contact, panneau Commerce du contact,
// permissions, isolation par site, XSS. Achat réel par le panier (formation gratuite → commande enregistrée), contact relié au compte.
const crypto = require("node:crypto");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

const SECRET = "whsec_palier20";
let srv, boss, db, orgId, siteA, student, studentId, contactId, orderId, siteMember, course;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const M = "/marketing";
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const sign = (payload) => { const t = Math.floor(Date.now() / 1000); return `t=${t},v1=${crypto.createHmac("sha256", SECRET).update(`${t}.${payload}`).digest("hex")}`; };
async function webhook(charge, { badSignature = false } = {}) {
  const payload = JSON.stringify({ id: `evt_${crypto.randomUUID()}`, type: "charge.refunded", data: { object: charge } });
  const r = await fetch(`${srv.base}/stripe/webhook`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": badSignature ? "t=1,v1=00" : sign(payload) }, body: payload });
  return r.status;
}
const charge = (refunds, over = {}) => ({ id: "ch_web", payment_intent: "pi_web", currency: "eur", amount_refunded: refunds.reduce((n, r) => n + r.amount, 0), refunds: { data: refunds.map((r) => ({ status: "succeeded", ...r })) }, ...over });

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", STRIPE_WEBHOOK_SECRET: SECRET });
  boss = await loginInstructor(srv); db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  const r = await boss.post(`${M}/site-web/sites`, { name: "Site Alpha" });
  siteA = Number(String(r.location).match(/sites\/(\d+)/)[1]);
  course = await createCourse(boss, srv, { title: "Formation <b>Commerce</b>", price: 0 });
  student = await newStudent(srv); studentId = idOf(student);
  await buy(student, course);
  orderId = one("SELECT id FROM orders WHERE user_id = ?", studentId).id;
  const u = one("SELECT email FROM users WHERE id = ?", studentId);
  // L'inscription crée déjà la fiche du Contact Core (jamais de doublon) : on la relie au site et au compte
  const existing = one("SELECT id FROM mk_contacts WHERE organization_id = ? AND email = ?", orgId, u.email.toLowerCase());
  contactId = existing ? existing.id : Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, lms_user_id) VALUES (?, ?, 'Eleve', ?)").run(orgId, u.email.toLowerCase(), studentId).lastInsertRowid);
  db.prepare("UPDATE mk_contacts SET lms_user_id = ?, origin_site_id = ? WHERE id = ?").run(studentId, siteA, contactId);
  db.prepare("UPDATE orders SET total_cents = 5000 WHERE id = ?").run(orderId);
  db.prepare("INSERT INTO checkout_sessions (ref, user_id, stripe_session_id, stripe_payment_intent, status, items_json, total_cents, order_id) VALUES ('refweb', ?, 'cs_web', 'pi_web', 'paid', '[]', 5000, ?)").run(studentId, orderId);
  siteMember = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(siteA, idOf(siteMember));
});
after(() => { db.close(); srv.stop(); });

describe("webhook Stripe : remboursement", () => {
  test("signature invalide refusée ; signée acceptée ; rejouée = un seul enregistrement ; paiement inconnu ignoré", async () => {
    assert.equal(await webhook(charge([{ id: "re_w1", amount: 1000 }]), { badSignature: true }), 400);
    assert.equal(one("SELECT COUNT(*) n FROM order_refunds").n, 0);
    assert.equal(await webhook(charge([{ id: "re_w1", amount: 1000 }])), 200);
    assert.equal(await webhook(charge([{ id: "re_w1", amount: 1000 }])), 200);
    assert.equal(one("SELECT COUNT(*) n FROM order_refunds").n, 1);
    assert.equal(await webhook(charge([{ id: "re_x", amount: 500 }], { payment_intent: "pi_inconnu" })), 200);
    assert.equal(one("SELECT COUNT(*) n FROM order_refunds").n, 1);
    // la commande et l'accès ne changent pas : décision de l'équipe, pas d'un webhook
    assert.equal(one("SELECT COUNT(*) n FROM enrollments WHERE user_id = ?", studentId).n, 1);
  });
});

describe("fiche commande ↔ contact", () => {
  test("la commande montre le paiement honnêtement, le remboursement et le lien vers le vrai contact", async () => {
    const t = (await boss.get(`/formateur/gestion/ventes/commandes/${orderId}`)).text;
    assert.match(t, /Voir le contact/);
    assert.match(t, new RegExp(`/marketing/contacts/${contactId}`));
    assert.match(t, /Carte \(Stripe\)/);
    assert.match(t, /Remboursé/);
    assert.doesNotMatch(t, /Simulé/);
  });
});

describe("fiche contact : panneau Commerce", () => {
  test("montre les vraies commandes et le remboursement ; lien vers la vraie fiche commande ; titres échappés", async () => {
    const t = (await boss.get(`${M}/contacts/${contactId}`)).text;
    assert.match(t, /id="commerce"/);
    assert.match(t, new RegExp(`/formateur/gestion/ventes/commandes/${orderId}`));
    assert.match(t, /Formation &lt;b&gt;Commerce&lt;\/b&gt;/);
    assert.doesNotMatch(t, /Formation <b>Commerce/);
    assert.match(t, /10,00/); // remboursé
  });
  test("une personne limitée à un site ne reçoit pas les commandes (non rattachées à un site)", async () => {
    const r = await siteMember.get(`${M}/contacts/${contactId}?site=${siteA}`);
    if (r.status === 200) assert.doesNotMatch(r.text, /id="commerce"/);
  });
  test("contact sans compte relié : aucun panneau Commerce inventé", async () => {
    const id = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email) VALUES (?, 'invite.web@exemple.fr')").run(orgId).lastInsertRowid);
    const t = (await boss.get(`${M}/contacts/${id}`)).text;
    assert.doesNotMatch(t, /id="commerce"/);
  });
});
