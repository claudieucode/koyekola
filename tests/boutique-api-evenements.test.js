// API REST de la boutique + événements vers le bus (VRAI serveur) : portée de la clé, lecture/écriture, aucun mouvement d'argent, isolation entre sites, événements émis une seule fois.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");
const { createApiKey } = require("../src/marketing/api/keys");

const UA = "Mozilla/5.0 (test)";
const HA = "www.api-un.example", HB = "www.api-deux.example";
const hdr = (h) => ({ headers: { "x-forwarded-host": h, "User-Agent": UA } });
let srv, boss, db, A, B, org, keyA, keyAw, keyB;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const api = (key, path, { method = "GET", json } = {}) => fetch(`${srv.base}/api/v1${path}`, { method, headers: { authorization: `Bearer ${key}`, ...(json ? { "content-type": "application/json" } : {}) }, body: json ? JSON.stringify(json) : undefined, signal: AbortSignal.timeout(20000) }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

async function mkSite(name, host) {
  const id = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${id}/reglages.json`)).text);
  await boss.request(`/marketing/site-web/sites/${id}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } } });
  const base = `/marketing/site-web/sites/${id}/boutique`;
  await boss.post(`/marketing/site-web/sites/${id}/modules/commerce`, { etat: "activer" });
  await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" });
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", id).id;
  await boss.post(`${base}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,00" });
  await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "P" + id, manual_instructions: "Virement", low_stock_threshold: "5" });
  await boss.post(`${base}/produits`, { name: "Tasse", type: "simple", status: "published", price: "10,00", manage_stock: "1", stock_qty: "6", requires_shipping: "1" });
  return { id, base, host, pid: one("SELECT id FROM mk_shop_products WHERE site_id = ?", id).id };
}
before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", SHOP_SWEEP_INTERVAL_MS: "0" });
  boss = await loginInstructor(srv); db = srv.db();
  A = await mkSite("API Un", HA); B = await mkSite("API Deux", HB);
  org = one("SELECT id FROM mk_organizations ORDER BY id").id;
  const ctx = { db, organizationId: org, userId: null };
  keyA = createApiKey(ctx, { name: "lecture A", scope: "read", siteId: A.id }).key;
  keyAw = createApiKey(ctx, { name: "ecriture A", scope: "write", siteId: A.id }).key;
  keyB = createApiKey(ctx, { name: "lecture B", scope: "read", siteId: B.id }).key;
});
after(async () => { db.close(); await srv.stop(); });

test("sans clé : 401 ; une clé de site ne voit que sa boutique ; lecture seule refuse l'écriture", async () => {
  assert.equal((await fetch(`${srv.base}/api/v1/shop/products`, { signal: AbortSignal.timeout(20000) })).status, 401);
  const a = await api(keyA, "/shop/products"); assert.equal(a.status, 200); assert.deepEqual(a.body.data.map((p) => p.name), ["Tasse"]);
  const b = await api(keyB, `/shop/products/${A.pid}`); assert.equal(b.status, 404, "produit d'un autre site introuvable");
  assert.equal((await api(keyA, "/shop/products", { method: "POST", json: { name: "X", price_cents: 100 } })).status, 403);
  const c = await api(keyA, "/shop/products?site_id=" + B.id); assert.deepEqual(c.body.data.map((p) => p.id), [A.pid], "site_id ignoré pour une clé de site");
});
test("écriture : créer, modifier, ajuster le stock ; valeurs invalides refusées", async () => {
  const created = await api(keyAw, "/shop/products", { method: "POST", json: { name: "Bol", type: "simple", status: "published", price_cents: 1500, manage_stock: 1, stock_qty: 10 } });
  assert.equal(created.status, 201); assert.equal(created.body.data.price_cents, 1500);
  const id = created.body.data.id;
  assert.equal((await api(keyAw, `/shop/products/${id}`, { method: "PATCH", json: { price_cents: 1800 } })).body.data.price_cents, 1800);
  assert.equal((await api(keyAw, `/shop/products/${id}/stock`, { method: "POST", json: { delta: -3 } })).body.data.stock_qty, 7);
  assert.equal((await api(keyAw, `/shop/products/${id}/stock`, { method: "POST", json: { delta: -50 } })).status, 400);
  assert.equal((await api(keyAw, "/shop/products", { method: "POST", json: { name: "", price_cents: -5 } })).status, 400);
});
test("commande : événements émis une fois ; statuts de traitement par l'API, jamais payer ni rembourser ; stock bas signalé", async () => {
  const cli = new Client(srv.base), h = hdr(HA);
  await cli.post("/boutique/panier/ajouter", { product_id: String(A.pid), quantity: "3" }, h);
  const page = await cli.get("/boutique/commande?pays=FR", h);
  const f = (n) => page.text.match(new RegExp(`name="${n}" value="([^"]+)"`))[1];
  assert.equal((await cli.post("/boutique/commande", { email: "c@example.test", ship_name: "Ada", ship_line1: "1 rue", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: f("idempotency_key"), shipping_method: f("shipping_method"), payment_method: "manual", expected_total: f("expected_total") }, h)).status, 303);
  const o = one("SELECT * FROM mk_shop_orders WHERE site_id = ? ORDER BY id DESC", A.id);
  const list = await api(keyA, "/shop/orders"); assert.equal(list.body.data.length, 1); assert.equal(list.body.data[0].number, o.number);
  const det = await api(keyA, `/shop/orders/${o.id}`); assert.equal(det.body.data.items[0].quantity, 3);
  assert.equal((await api(keyB, `/shop/orders/${o.id}`)).status, 404);
  assert.equal((await api(keyAw, `/shop/orders/${o.id}/status`, { method: "POST", json: { status: "paid" } })).status, 403, "payer par l'API est interdit");
  assert.equal((await api(keyAw, `/shop/orders/${o.id}/status`, { method: "POST", json: { status: "refunded" } })).status, 403);
  assert.equal((await boss.post(`${A.base}/commandes/${o.id}/statut`, { statut: "paid" })).status, 302);
  assert.equal((await api(keyAw, `/shop/orders/${o.id}/status`, { method: "POST", json: { status: "processing" } })).status, 200);
  assert.equal((await api(keyAw, `/shop/orders/${o.id}/status`, { method: "POST", json: { status: "shipped", tracking: "TRK42" } })).body.data.tracking_number, "TRK42");
  assert.equal((await api(keyAw, `/shop/orders/${o.id}/status`, { method: "POST", json: { status: "pending" } })).status, 409, "transition interdite");
  const names = db.prepare("SELECT name, COUNT(*) n FROM mk_events WHERE organization_id = ? AND object_id = ? AND source = 'shop' GROUP BY name").all(org, String(o.id));
  const got = Object.fromEntries(names.map((r) => [r.name, r.n]));
  assert.equal(got["shop.order_created"], 1); assert.equal(got["shop.order_paid"], 1); assert.equal(got["shop.order_shipped"], 1);
  assert.ok(got["shop.order_status_changed"] >= 2);
  assert.ok(one("SELECT 1 FROM mk_events WHERE name = 'shop.stock_low' AND site_id = ?", A.id), "6 → 3 en stock : sous le seuil de 5");
});
test("clients et rapport par l'API ; module désactivé = 403", async () => {
  const c = await api(keyA, "/shop/customers"); assert.equal(c.status, 200); assert.ok(c.body.data.some((x) => x.email === "c@example.test"));
  const r = await api(keyA, "/shop/reports/summary"); assert.equal(r.status, 200); assert.equal(r.body.data.orders, 1);
  await boss.post(`/marketing/site-web/sites/${B.id}/modules/commerce`, { etat: "desactiver" });
  assert.equal((await api(keyB, "/shop/products")).status, 403);
});

test("paniers abandonnés : repérés après inactivité, événement une fois, reprise par lien signé, relance seulement aux comptes si activée", async () => {
  const cli = new Client(srv.base), h = hdr(HA);
  assert.equal((await cli.post("/boutique/compte/inscription", { email: "fidele@example.test", password: "motdepasse-solide", name: "Fidèle" }, h)).status, 303);
  await cli.post("/boutique/panier/ajouter", { product_id: String(A.pid), quantity: "1" }, h);
  const cart = one("SELECT * FROM mk_shop_carts WHERE site_id = ? AND status = 'open' ORDER BY id DESC", A.id);
  await boss.post(`${A.base}/rapports/paniers`, { minutes: "30", reminder: "1" });
  db.prepare("UPDATE mk_shop_carts SET updated_at = datetime('now','-2 hours'), customer_id = (SELECT id FROM mk_shop_customers WHERE email = 'fidele@example.test' AND site_id = ?) WHERE id = ?").run(A.id, cart.id);
  await new Client(srv.base).get("/boutique", h); // déclenche le passage (intervalle 0 en test)
  const row = one("SELECT * FROM mk_shop_carts WHERE id = ?", cart.id);
  assert.ok(row.abandoned_at && row.email === "fidele@example.test");
  assert.equal(one("SELECT COUNT(*) n FROM mk_events WHERE name = 'shop.cart_abandoned' AND object_id = ?", String(cart.id)).n, 1);
  assert.ok(row.reminder_sent_at, "relance mise en file pour un compte");
  assert.match((await boss.get(`${A.base}/rapports`)).text, /fidele@example\.test/);
  const mail = one("SELECT body FROM mail_outbox WHERE to_email = 'fidele@example.test' ORDER BY id DESC");
  const m = String(mail && mail.body).match(/panier\/reprendre\/(\d+-[0-9a-f]{32})/);
  assert.ok(m, "lien de reprise dans le message");
  const back = new Client(srv.base);
  assert.equal((await back.get(`/boutique/panier/reprendre/${m[1]}`, h)).status, 303);
  assert.match((await back.get("/boutique/panier", h)).text, /Tasse/, "le panier est retrouvé dans un autre navigateur");
  assert.equal((await new Client(srv.base).get(`/boutique/panier/reprendre/${cart.id}-${"0".repeat(32)}`, h)).status, 303);
});

test("RGPD : le client exporte ses données, refus d'effacement avec commande en cours, puis effacement (commandes conservées), mot de passe exigé", async () => {
  const cli = new Client(srv.base), h = hdr(HA);
  assert.equal((await cli.post("/boutique/compte/inscription", { email: "rgpd@example.test", password: "motdepasse-solide", name: "Rita" }, h)).status, 303);
  await cli.post("/boutique/panier/ajouter", { product_id: String(A.pid), quantity: "1" }, h);
  const page = await cli.get("/boutique/commande?pays=FR", h);
  const f = (n) => page.text.match(new RegExp(`name="${n}" value="([^"]+)"`))[1];
  assert.equal((await cli.post("/boutique/commande", { email: "rgpd@example.test", ship_name: "Rita", ship_line1: "1 rue", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: f("idempotency_key"), shipping_method: f("shipping_method"), payment_method: "manual", expected_total: f("expected_total") }, h)).status, 303);
  const exp = await cli.get("/boutique/compte/donnees", h);
  assert.equal(exp.status, 200); assert.match(exp.headers.get("content-disposition"), /attachment/);
  const data = JSON.parse(exp.text); assert.equal(data.customer.email, "rgpd@example.test"); assert.equal(data.orders.length, 1); assert.ok(!/password|hash/i.test(exp.text));
  assert.equal((await new Client(srv.base).get("/boutique/compte/donnees", h)).status, 303, "export réservé au client connecté");
  const refused = await cli.post("/boutique/compte/supprimer", { password: "motdepasse-solide" }, h);
  assert.match(decodeURIComponent(refused.location), /en cours/);
  assert.equal((await cli.post("/boutique/compte/supprimer", { password: "mauvais" }, h)).status, 303);
  const o = one("SELECT id FROM mk_shop_orders WHERE email = 'rgpd@example.test'");
  assert.equal((await boss.post(`${A.base}/commandes/${o.id}/statut`, { statut: "cancelled" })).status, 302);
  const ok = await cli.post("/boutique/compte/supprimer", { password: "motdepasse-solide" }, h);
  assert.match(ok.location, /compte=supprime/);
  const c = one("SELECT * FROM mk_shop_customers WHERE id = (SELECT customer_id FROM mk_shop_orders WHERE id = ?)", o.id);
  assert.match(c.email, /^effacé-\d+@invalide\.local$/); assert.equal(c.name, null); assert.equal(c.password_hash, null);
  assert.ok(one("SELECT id FROM mk_shop_orders WHERE id = ?", o.id), "commande conservée");
  assert.equal((await new Client(srv.base).post("/boutique/compte/connexion", { email: "rgpd@example.test", password: "motdepasse-solide" }, h)).status === 303, false, "plus de connexion possible");
});
