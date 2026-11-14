// Remboursements réels de la boutique (VRAI serveur, FAUX Stripe local, aucun paiement réel) : partiel/total, remise en stock, idempotence, plafond, refus du fournisseur, isolation entre sites.
const http = require("node:http");
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (test)";
const H1 = "www.remb-un.example";
const H2 = "www.remb-deux.example";
const host = (h) => ({ headers: { "x-forwarded-host": h, "User-Agent": UA } });
const s1 = host(H1); const s2 = host(H2);
let srv, boss, db, A, B, SA, SB, fake;
const refundCalls = []; const fakeState = { fail: false };
const one = (sql, ...a) => db.prepare(sql).get(...a);
const sql = (d) => d.toISOString().slice(0, 19).replace("T", " ");
const when = (ms) => sql(new Date(Date.now() + ms)).replace(" ", "T").slice(0, 16);
const DAY = 86400000;

async function mkSite(name, hostName) {
  const id = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${id}/reglages.json`)).text);
  assert.equal((await boss.request(`/marketing/site-web/sites/${id}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${hostName}` } } } })).status, 200);
  const base = `/marketing/site-web/sites/${id}/boutique`;
  assert.equal((await boss.post(`/marketing/site-web/sites/${id}/modules/commerce`, { etat: "activer" })).status, 302);
  assert.equal((await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" })).status, 302);
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", id).id;
  assert.equal((await boss.post(`${base}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" })).status, 302);
  assert.equal((await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "MB" + id, manual_instructions: "Virement" })).status, 302);
  return { id, base };
}
const product = async (base, siteId, name) => {
  const r = await boss.post(`${base}/produits`, { name, type: "simple", status: "published", price: "30,00", manage_stock: "1", stock_qty: "50", requires_shipping: "1" });
  assert.equal(r.status, 302, String(r.text).slice(0, 200));
  return one("SELECT id, slug FROM mk_shop_products WHERE site_id = ? AND name = ?", siteId, name);
};
const rule = (base, pid, mode) => boss.post(`${base}/acces/regles`, { kind: "product", product_id: String(pid), mode });
const customer = async (host, email) => {
  const c = new Client(srv.base);
  const r = await c.post("/boutique/compte/inscription", { email, password: "motdepasse-solide", name: "Client Test" }, host);
  assert.equal(r.status, 303, String(r.text).slice(0, 200));
  return c;
};
const customerId = (siteId, email) => one("SELECT id FROM mk_shop_customers WHERE site_id = ? AND email = ?", siteId, email).id;
const add = (cli, host, pid) => cli.post("/boutique/panier/ajouter", { product_id: String(pid), quantity: "1" }, host);
const cartCount = (cli) => one("SELECT COUNT(*) n FROM mk_shop_cart_items").n; // sert avant/après
const checkout = async (cli, host, email) => {
  const page = await cli.get("/boutique/commande?pays=FR", host);
  const idem = page.text.match(/name="idempotency_key" value="([0-9a-f]+)"/)[1];
  const method = (page.text.match(/name="shipping_method" value="(\d+)"/) || assert.fail(`pas de méthode de livraison : ${page.status} ${page.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600)}`))[1];
  const expected = page.text.match(/name="expected_total" value="(\d+)"/)[1];
  return cli.post("/boutique/commande", { email, ship_name: "Ada Lovelace", ship_line1: "1 rue des Tests", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: idem, shipping_method: method, payment_method: "manual", expected_total: expected }, host);
};


function startFake() {
  return new Promise((resolve) => {
    fake = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d));
      req.on("end", () => {
        const send = (st, j) => { res.writeHead(st, { "content-type": "application/json" }); res.end(JSON.stringify(j)); };
        if (req.headers.authorization !== "Bearer sk_test_fake") return send(401, { error: { message: "clé invalide" } });
        if (req.method === "GET" && req.url.startsWith("/v1/checkout/sessions/")) return send(200, { id: req.url.split("/").pop(), payment_status: "paid", payment_intent: "pi_fake_1" });
        if (req.method === "POST" && req.url === "/v1/refunds") {
          const p = Object.fromEntries(new URLSearchParams(body));
          refundCalls.push({ ...p, idem: req.headers["idempotency-key"] });
          if (fakeState.fail) return send(500, { error: { message: "panne simulée" } });
          return send(200, { id: `re_fake_${refundCalls.length}`, amount: Number(p.amount) });
        }
        send(404, { error: { message: "inconnu " + req.url } });
      });
    });
    fake.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${fake.address().port}`));
  });
}

before(async () => {
  const fakeBase = await startFake();
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_API_BASE: fakeBase });
  boss = await loginInstructor(srv); db = srv.db();
  A = await mkSite("Boutique Remb Un", H1); B = await mkSite("Boutique Remb Deux", H2);
  SA = A.base; SB = B.base;
});
after(async () => { db.close(); await srv.stop(); fake.close(); });


const stockOf = (pid) => one("SELECT stock_qty FROM mk_shop_products WHERE id = ?", pid).stock_qty;
async function paidOrder(base, siteId, hostH, pid, qty = 2) {
  const buyer = new Client(srv.base);
  await buyer.post("/boutique/panier/ajouter", { product_id: String(pid), quantity: String(qty) }, hostH);
  const r = await checkout(buyer, hostH, `acheteur${Math.random().toString(36).slice(2, 8)}@example.test`);
  assert.equal(r.status, 303, String(r.text).slice(0, 300));
  const order = one("SELECT * FROM mk_shop_orders WHERE site_id = ? ORDER BY id DESC", siteId);
  assert.equal((await boss.post(`${base}/commandes/${order.id}/statut`, { statut: "paid" })).status, 302);
  return one("SELECT * FROM mk_shop_orders WHERE id = ?", order.id);
}
const refund = (base, orderId, body) => boss.post(`${base}/commandes/${orderId}/remboursement`, body);
const item = (orderId) => one("SELECT * FROM mk_shop_order_items WHERE order_id = ?", orderId);

describe("remboursement hors plateforme (paiement manuel)", () => {
  test("partiel par articles avec remise en stock, idempotence, plafond, puis solde = commande remboursée", async () => {
    const p = await product(SA, A.id, "Vase");
    const order = await paidOrder(SA, A.id, s1, p.id, 2);
    const stock0 = stockOf(p.id); // 48 après commande
    const it = item(order.id);
    const key = "cle-partielle-1";
    const r1 = await refund(SA, order.id, { [`qty_${it.id}`]: "1", restock: "1", reason: "Un vase cassé", idempotency_key: key });
    assert.equal(r1.status, 302);
    const rows = db.prepare("SELECT * FROM mk_shop_refunds WHERE order_id = ?").all(order.id);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, "succeeded"); assert.equal(rows[0].provider, "manual"); assert.equal(rows[0].amount_cents, 3000);
    assert.equal(stockOf(p.id), stock0 + 1, "une unité remise en stock");
    assert.equal(one("SELECT status, payment_status FROM mk_shop_orders WHERE id = ?", order.id).status, "paid", "partiel : la commande reste payée");
    // Rejeu avec la même clé : aucun doublon, aucun second retour en stock
    await refund(SA, order.id, { [`qty_${it.id}`]: "1", restock: "1", idempotency_key: key });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_shop_refunds WHERE order_id = ?").get(order.id).n, 1);
    assert.equal(stockOf(p.id), stock0 + 1);
    // Plafond : plus que le reste
    await refund(SA, order.id, { amount: "9999", idempotency_key: "trop" });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_shop_refunds WHERE order_id = ?").get(order.id).n, 1, "montant trop élevé refusé");
    // Une unité déjà remboursée ne l'est pas deux fois
    await refund(SA, order.id, { [`qty_${it.id}`]: "2", idempotency_key: "surplus" });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_shop_refunds WHERE order_id = ?").get(order.id).n, 1, "plus d'unités que commandées refusé");
    // Solde : tout le reste (montant vide)
    await refund(SA, order.id, { restock: "1", idempotency_key: "solde" });
    const o = one("SELECT status, payment_status FROM mk_shop_orders WHERE id = ?", order.id);
    assert.equal(o.status, "refunded"); assert.equal(o.payment_status, "refunded");
    const total = db.prepare("SELECT SUM(amount_cents) n FROM mk_shop_refunds WHERE order_id = ? AND status = 'succeeded'").get(order.id).n;
    assert.equal(total, order.total_cents, "la somme remboursée égale exactement le total");
    assert.equal(stockOf(p.id), stock0 + 2, "tout remis en stock sans double comptage");
  });
});

describe("remboursement Stripe (faux serveur)", () => {
  async function stripeOrder() {
    const p = await product(SA, A.id, "Lampe" + Math.random().toString(36).slice(2, 5));
    const order = await paidOrder(SA, A.id, s1, p.id, 1);
    db.prepare("UPDATE mk_shop_orders SET payment_method = 'stripe' WHERE id = ?").run(order.id);
    db.prepare("INSERT INTO mk_shop_payments (organization_id, site_id, order_id, provider, provider_ref, amount_cents, currency, status) VALUES (?,?,?,?,?,?,?, 'succeeded')").run(order.organization_id, A.id, order.id, "stripe", "cs_fake_1", order.total_cents, order.currency);
    return { order, p };
  }
  test("l'appel part chez Stripe avec montant et clé d'idempotence ; le refus du fournisseur ne change rien", async () => {
    const { order } = await stripeOrder();
    fakeState.fail = true; refundCalls.length = 0;
    await refund(SA, order.id, { amount: "5", idempotency_key: "k-echec" });
    const failed = db.prepare("SELECT * FROM mk_shop_refunds WHERE order_id = ?").all(order.id);
    assert.equal(failed.length, 1); assert.equal(failed[0].status, "failed");
    assert.equal(one("SELECT status FROM mk_shop_orders WHERE id = ?", order.id).status, "paid", "commande inchangée");
    fakeState.fail = false;
    await refund(SA, order.id, { amount: "5", idempotency_key: "k-ok" });
    const ok = db.prepare("SELECT * FROM mk_shop_refunds WHERE order_id = ? AND status = 'succeeded'").all(order.id);
    assert.equal(ok.length, 1, "le montant refusé redevient remboursable");
    assert.match(ok[0].provider_ref, /^re_fake_/);
    const call = refundCalls[refundCalls.length - 1];
    assert.equal(call.payment_intent, "pi_fake_1"); assert.equal(call.amount, "500"); assert.match(call.idem, /^kw-refund-/);
  });
});

describe("isolation", () => {
  test("le site B ne peut pas rembourser une commande du site A", async () => {
    const p = await product(SA, A.id, "Chaise");
    const order = await paidOrder(SA, A.id, s1, p.id, 1);
    await refund(SB, order.id, { idempotency_key: "intrus" });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_shop_refunds WHERE order_id = ?").get(order.id).n, 0);
    assert.equal(one("SELECT status FROM mk_shop_orders WHERE id = ?", order.id).status, "paid");
  });
});
