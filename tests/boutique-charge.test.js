// Charge et concurrence de la boutique (VRAI serveur, FAUX Stripe) : pas de survente sous achats simultanés, double soumission = une seule commande, webhook rejoué en parallèle = un seul paiement, lecture du catalogue sous charge.
const http = require("node:http");
const crypto = require("node:crypto");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (test)";
const hdr = (h) => ({ headers: { "x-forwarded-host": h, "User-Agent": UA } });
const fresh = async (host, extraEnv = {}, stock = "5") => {
  const srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ...extraEnv });
  const boss = await loginInstructor(srv); const db = srv.db();
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const id = Number(String((await boss.post("/marketing/site-web/sites", { name: "Charge" })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${id}/reglages.json`)).text);
  await boss.request(`/marketing/site-web/sites/${id}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } } });
  const base = `/marketing/site-web/sites/${id}/boutique`;
  await boss.post(`/marketing/site-web/sites/${id}/modules/commerce`, { etat: "activer" });
  await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" });
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", id).id;
  await boss.post(`${base}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,00" });
  await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual", "stripe"], guest_checkout: "1", order_prefix: "C", manual_instructions: "Virement" });
  await boss.post(`${base}/produits`, { name: "Rareté", type: "simple", status: "published", price: "10,00", manage_stock: "1", stock_qty: stock, requires_shipping: "1" });
  return { srv, boss, db, one, id, base, h: hdr(host), pid: one("SELECT id FROM mk_shop_products WHERE site_id = ?", id).id, stop: async () => { db.close(); await srv.stop(); } };
};
const buyer = async (S, method = "manual") => {
  const cli = new Client(S.srv.base);
  await cli.post("/boutique/panier/ajouter", { product_id: String(S.pid), quantity: "1" }, S.h);
  const page = await cli.get("/boutique/commande?pays=FR", S.h);
  const m = (n) => (page.text.match(new RegExp(`name="${n}" value="([^"]+)"`)) || [])[1];
  if (!m("idempotency_key")) return { cli, status: 0, note: "pas de formulaire (panier refusé : stock)" };
  const body = { email: `c${Math.random().toString(36).slice(2, 8)}@example.test`, ship_name: "Ada", ship_line1: "1 rue", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: m("idempotency_key"), shipping_method: m("shipping_method"), payment_method: method, expected_total: m("expected_total") };
  return { cli, body, post: () => cli.post("/boutique/commande", body, S.h) };
};

test("survente : 12 acheteurs simultanés pour 5 exemplaires → au plus 5 commandes, stock jamais négatif, les autres refusés proprement", async () => {
  const S = await fresh("www.charge-un.example");
  try {
    const flows = await Promise.all(Array.from({ length: 12 }, () => buyer(S)));
    const results = await Promise.all(flows.map((f) => (f.post ? f.post() : { status: 0 })));
    const created = results.filter((r) => r.status === 303 && /commande\/confirmation/.test(String(r.location))).length;
    const refused = results.filter((r) => r.status !== 303).length;
    const stock = S.one("SELECT stock_qty n FROM mk_shop_products WHERE id = ?", S.pid).n;
    assert.ok(created <= 5, `${created} commandes pour 5 exemplaires`); assert.equal(created, 5, "tout le stock est vendu");
    assert.equal(stock, 0); assert.equal(S.one("SELECT COUNT(*) n FROM mk_shop_orders WHERE site_id = ?", S.id).n, created);
    assert.equal(created + refused, 12);
    assert.equal(S.one("SELECT COUNT(*) n FROM mk_shop_stock_movements WHERE product_id = ? AND reason = 'order'", S.pid).n, created, "un mouvement de stock par commande");
    for (const r of results.filter((x) => x.status !== 303)) assert.ok([409, 422, 0].includes(r.status), `refus inattendu : ${r.status}`);
  } finally { await S.stop(); }
});

test("double soumission : le même formulaire envoyé 8 fois en parallèle crée UNE commande et décompte UN exemplaire", async () => {
  const S = await fresh("www.charge-deux.example", {}, "10");
  try {
    const f = await buyer(S); assert.ok(f.post);
    const rs = await Promise.all(Array.from({ length: 8 }, () => f.post()));
    assert.ok(rs.every((r) => r.status === 303), rs.map((r) => r.status).join());
    assert.equal(S.one("SELECT COUNT(*) n FROM mk_shop_orders WHERE site_id = ?", S.id).n, 1);
    assert.equal(S.one("SELECT stock_qty n FROM mk_shop_products WHERE id = ?", S.pid).n, 9);
  } finally { await S.stop(); }
});

test("webhook Stripe du site rejoué 20 fois en parallèle : un seul paiement, une seule facture, un seul événement « payée »", async () => {
  const sessions = new Map();
  const fake = http.createServer((req, res) => { let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => {
    const send = (c, j) => { res.writeHead(c, { "content-type": "application/json" }); res.end(JSON.stringify(j)); };
    if (req.method === "POST" && req.url === "/v1/checkout/sessions") { const id = `cs_${sessions.size + 1}`; const s = { id, status: "open", payment_status: "unpaid", url: `https://stripe.fake/${id}` }; sessions.set(id, s); return send(200, s); }
    const m = /^\/v1\/checkout\/sessions\/(.+)$/.exec(req.url); if (m && sessions.get(m[1])) return send(200, sessions.get(m[1]));
    send(404, { error: { message: "inconnu" } }); }); });
  await new Promise((r) => fake.listen(0, "127.0.0.1", r));
  const S = await fresh("www.charge-trois.example", { STRIPE_API_BASE: `http://127.0.0.1:${fake.address().port}`, STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "" }, "10");
  try {
    assert.equal((await S.boss.post(`${S.base}/paiements/stripe`, { secret_key: "sk_site", webhook_secret: "whsec_site" })).status, 302);
    const f = await buyer(S, "stripe"); const r = await f.post(); assert.equal(r.status, 303);
    const o = S.one("SELECT * FROM mk_shop_orders WHERE site_id = ?", S.id); const sid = S.one("SELECT provider_ref FROM mk_shop_payments WHERE order_id = ?", o.id).provider_ref;
    const body = JSON.stringify({ id: "evt_load", type: "checkout.session.completed", data: { object: { id: sid, client_reference_id: `shop:${o.id}`, payment_status: "paid", amount_total: o.total_cents, currency: "eur", payment_intent: "pi_1" } } });
    const t = Math.floor(Date.now() / 1000); const sig = `t=${t},v1=${crypto.createHmac("sha256", "whsec_site").update(`${t}.${body}`).digest("hex")}`;
    const rs = await Promise.all(Array.from({ length: 20 }, () => fetch(`${S.srv.base}/boutique/webhooks/stripe`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": sig, "x-forwarded-host": "www.charge-trois.example", "user-agent": UA }, body })));
    assert.ok(rs.every((x) => x.status === 200), rs.map((x) => x.status).join());
    assert.equal(S.one("SELECT payment_status s FROM mk_shop_orders WHERE id = ?", o.id).s, "paid");
    assert.equal(S.one("SELECT COUNT(*) n FROM mk_shop_invoices WHERE order_id = ?", o.id).n, 1);
    assert.equal(S.one("SELECT COUNT(*) n FROM mk_shop_order_events WHERE order_id = ? AND kind = 'paid'", o.id).n, 1);
    assert.equal(S.one("SELECT COUNT(*) n FROM mk_events WHERE name = 'shop.order_paid' AND object_id = ?", String(o.id)).n, 1);
  } finally { await S.stop(); fake.close(); }
});

test("lecture sous charge : 150 requêtes simultanées sur le catalogue et la fiche répondent toutes 200", async () => {
  const S = await fresh("www.charge-quatre.example", {}, "10");
  try {
    const slug = S.one("SELECT slug FROM mk_shop_products WHERE id = ?", S.pid).slug; const t0 = Date.now();
    const rs = await Promise.all(Array.from({ length: 150 }, (_, i) => new Client(S.srv.base).get(i % 2 ? "/boutique" : `/boutique/produit/${slug}`, S.h)));
    assert.ok(rs.every((r) => r.status === 200), [...new Set(rs.map((r) => r.status))].join());
    console.log(`  (150 lectures simultanées en ${Date.now() - t0} ms)`);
  } finally { await S.stop(); }
});
