// Boutique lot 2 (VRAI serveur, FAUX Stripe local) : pas de seconde session de paiement, expiration des commandes manuelles, limites de rythme.
const http = require("node:http");
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (test)";
const H = "www.lot2-un.example";
const hh = { headers: { "x-forwarded-host": H, "User-Agent": UA } };
let srv, boss, db, base, siteId, fake, pid;
const sessions = new Map(); const posts = [];
const one = (sql, ...a) => db.prepare(sql).get(...a);

function startFake() {
  return new Promise((resolve) => {
    fake = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d));
      req.on("end", () => {
        const send = (st, j) => { res.writeHead(st, { "content-type": "application/json" }); res.end(JSON.stringify(j)); };
        if (req.method === "POST" && req.url === "/v1/checkout/sessions") {
          const p = Object.fromEntries(new URLSearchParams(body)); posts.push(p);
          const id = `cs_fake_${posts.length}`; const s = { id, status: "open", payment_status: "unpaid", url: `https://pay.fake/${id}`, amount_total: Number(p["line_items[0][price_data][unit_amount]"]), cancel: p.cancel_url };
          sessions.set(id, s); return send(200, s);
        }
        if (req.method === "GET" && req.url.startsWith("/v1/checkout/sessions/")) { const s = sessions.get(req.url.split("/").pop()); return s ? send(200, s) : send(404, { error: { message: "inconnue" } }); }
        send(404, { error: { message: "inconnu " + req.url } });
      });
    });
    fake.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${fake.address().port}`));
  });
}
before(async () => {
  const fb = await startFake();
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_WEBHOOK_SECRET: "whsec_fake", STRIPE_API_BASE: fb, SHOP_SWEEP_INTERVAL_MS: "0" });
  boss = await loginInstructor(srv); db = srv.db();
  siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Lot2" })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${siteId}/reglages.json`)).text);
  await boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${H}` } } } });
  base = `/marketing/site-web/sites/${siteId}/boutique`;
  await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" });
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", siteId).id;
  await boss.post(`${base}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" });
  await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual", "stripe"], guest_checkout: "1", order_prefix: "L2", manual_instructions: "Virement" });
  await boss.post(`/marketing/site-web/sites/${siteId}/modules/commerce`, { etat: "activer" });
  await boss.post(`${base}/produits`, { name: "Bol", type: "simple", status: "published", price: "30,00", manage_stock: "1", stock_qty: "500", requires_shipping: "1" });
  pid = one("SELECT id FROM mk_shop_products WHERE site_id = ?", siteId).id;
});
after(async () => { db.close(); await srv.stop(); fake.close(); });

async function order(method) {
  const cli = new Client(srv.base);
  await cli.post("/boutique/panier/ajouter", { product_id: String(pid), quantity: "1" }, hh);
  const page = await cli.get("/boutique/commande?pays=FR", hh);
  const f = (n) => (page.text.match(new RegExp(`name="${n}" value="([^"]+)"`)) || assert.fail(`champ ${n} absent`))[1];
  const r = await cli.post("/boutique/commande", { email: `a${Math.random().toString(36).slice(2, 8)}@example.test`, ship_name: "Ada", ship_line1: "1 rue", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: f("idempotency_key"), shipping_method: f("shipping_method"), payment_method: method, expected_total: f("expected_total") }, hh);
  return { cli, r, order: one("SELECT * FROM mk_shop_orders WHERE site_id = ? ORDER BY id DESC", siteId) };
}

test("« Payer à nouveau » réutilise la session ouverte (pas de second paiement) et constate un paiement déjà fait", async () => {
  const { cli, r, order: o } = await order("stripe");
  assert.equal(r.status, 303); assert.match(r.location, /pay\.fake\/cs_fake_1/);
  assert.equal(posts.length, 1);
  const k = new URL(sessions.get("cs_fake_1").cancel).search; // ?k=…
  const again = await cli.post(`/boutique/commande/${o.number}/payer${k}`, {}, hh);
  assert.equal(again.status, 303); assert.match(again.location, /pay\.fake\/cs_fake_1/, "même page de paiement");
  assert.equal(posts.length, 1, "aucune seconde session créée chez Stripe");
  // Le client a payé entre-temps (côté Stripe) : « Payer à nouveau » ne recrée rien et la commande est constatée payée
  Object.assign(sessions.get("cs_fake_1"), { status: "complete", payment_status: "paid", payment_intent: "pi_x", amount_total: o.total_cents, currency: "eur" });
  const third = await cli.post(`/boutique/commande/${o.number}/payer${k}`, {}, hh);
  assert.equal(third.status, 303); assert.doesNotMatch(third.location, /pay\.fake/);
  assert.equal(posts.length, 1);
  assert.equal(one("SELECT payment_status FROM mk_shop_orders WHERE id = ?", o.id).payment_status, "paid");
});

test("une commande en paiement manuel non réglée expire après 14 jours : annulée et stock rendu ; une récente reste", async () => {
  const stock0 = one("SELECT stock_qty n FROM mk_shop_products WHERE id = ?", pid).n;
  const old = (await order("manual")).order; const recent = (await order("manual")).order;
  assert.equal(one("SELECT stock_qty n FROM mk_shop_products WHERE id = ?", pid).n, stock0 - 2);
  db.prepare("UPDATE mk_shop_orders SET created_at = datetime('now','-15 days') WHERE id = ?").run(old.id);
  await new Client(srv.base).get("/boutique", hh); // déclenche le balayage (intervalle 0 en test)
  assert.equal(one("SELECT status FROM mk_shop_orders WHERE id = ?", old.id).status, "cancelled");
  assert.equal(one("SELECT status FROM mk_shop_orders WHERE id = ?", recent.id).status, "pending");
  assert.equal(one("SELECT stock_qty n FROM mk_shop_products WHERE id = ?", pid).n, stock0 - 1, "le stock de la commande expirée est rendu");
});

test("le rythme d'ajout au panier est limité (429 au-delà de 60 actions par 5 minutes)", async () => {
  const cli = new Client(srv.base); let last;
  for (let i = 0; i < 62; i++) { last = await cli.post("/boutique/panier/ajouter", { product_id: String(pid), quantity: "1" }, hh); if (last.status === 429) break; }
  assert.equal(last.status, 429);
});
