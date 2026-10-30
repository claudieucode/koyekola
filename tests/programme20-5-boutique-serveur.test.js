// Programme 20.5 — boutique de bout en bout sur un VRAI serveur : administration (principal et site), boutique publique par hôte, panier, commande, paiement Stripe contre un FAUX Stripe local,
// webhooks signés, double soumission, isolation entre boutiques. Aucune transaction réelle, aucun appel externe, base d'essai jetable.
const http = require("node:http");
const crypto = require("node:crypto");
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const WEBHOOK_SECRET = "whsec_test_boutique";
const HA = "www.alpha-shop.example";
let srv, boss, fake, fakeBase, db, siteId, orgId, anon;
const stripe = { sessions: new Map(), counter: 0, down: false };
const site = { headers: { "x-forwarded-host": HA, "User-Agent": "Mozilla/5.0 (test)" } };
const main = { headers: { "User-Agent": "Mozilla/5.0 (test)" } };
const one = (sql, ...a) => db.prepare(sql).get(...a);
const count = (sql, ...a) => one(sql, ...a).n;

function startFakeStripe() {
  return new Promise((resolve) => {
    fake = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d));
      req.on("end", () => {
        const send = (status, json) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(json)); };
        if (req.headers.authorization !== "Bearer sk_test_fake") return send(401, { error: { message: "clé invalide" } });
        if (stripe.down) return send(500, { error: { message: "panne simulée" } });
        if (req.method === "POST" && req.url === "/v1/checkout/sessions") {
          const p = Object.fromEntries(new URLSearchParams(body));
          const id = `cs_shop_${++stripe.counter}`;
          stripe.sessions.set(id, { id, client_reference_id: p.client_reference_id, amount_total: Number(p["line_items[0][price_data][unit_amount]"]) * Number(p["line_items[0][quantity]"]), currency: p["line_items[0][price_data][currency]"], payment_status: "unpaid", payment_intent: `pi_${id}` });
          return send(200, { id, url: `https://checkout.stripe.test/pay/${id}` });
        }
        const m = req.url.match(/^\/v1\/checkout\/sessions\/(.+)$/);
        if (req.method === "GET" && m && stripe.sessions.has(m[1])) return send(200, stripe.sessions.get(m[1]));
        send(404, { error: { message: "introuvable" } });
      });
    }).listen(0, () => { fakeBase = `http://localhost:${fake.address().port}`; resolve(); });
  });
}
const sign = (payload, t = Math.floor(Date.now() / 1000), secret = WEBHOOK_SECRET) => `t=${t},v1=${crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex")}`;
async function webhook(event, { valid = true, host } = {}) {
  const payload = JSON.stringify(event);
  return (await fetch(`${srv.base}/stripe/webhook`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": valid ? sign(payload) : "t=1,v1=00", ...(host ? { "x-forwarded-host": host } : {}) }, body: payload })).status;
}
const address = { email: "acheteur@example.test", ship_name: "Ada Lovelace", ship_line1: "1 rue des Tests", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", payment_method: "stripe" };
const shopOf = (siteId2) => ({ db, organizationId: orgId, siteId: siteId2 });

before(async () => {
  await startFakeStripe();
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, STRIPE_API_BASE: fakeBase });
  boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
  orgId = one("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").id;
  siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Alpha Shop" })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${siteId}/reglages.json`)).text);
  const r = await boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${HA}` } } } });
  assert.equal(r.status, 200);
});
after(async () => { db.close(); await srv.stop(); fake.close(); });

describe("administration", () => {
  test("les écrans de la boutique répondent pour le principal et pour un site", async () => {
    for (const base of ["/marketing/site-web/principal/boutique", `/marketing/site-web/sites/${siteId}/boutique`]) {
      for (const tail of ["", "/commandes", "/clients", "/reglages", "/categories", "/produits/nouveau"]) {
        const r = await boss.get(base + tail);
        assert.equal(r.status, 200, `${base}${tail} -> ${r.status}`);
      }
    }
  });
  test("création d'un produit : rattaché au site de l'ADRESSE, jamais à un site posté", async () => {
    const r = await boss.post(`/marketing/site-web/sites/${siteId}/boutique/produits`, { name: "Chaise Alpha", price: "49,90", status: "published", type: "simple", manage_stock: "1", stock_qty: "10", requires_shipping: "1", weight_grams: "2000", site_id: "999", siteId: "999" });
    assert.equal(r.status, 302, r.text.slice(0, 200));
    const p = one("SELECT * FROM mk_shop_products WHERE name = 'Chaise Alpha'");
    assert.equal(p.site_id, siteId); assert.equal(p.price_cents, 4990); assert.equal(p.stock_qty, 10);
    const r2 = await boss.post("/marketing/site-web/principal/boutique/produits", { name: "Table Principale", price: "100", status: "published", type: "simple", requires_shipping: "1", site_id: String(siteId) });
    assert.equal(r2.status, 302);
    assert.equal(one("SELECT site_id FROM mk_shop_products WHERE name = 'Table Principale'").site_id, null);
  });
  test("un produit d'un site n'est pas modifiable ni lisible par l'adresse d'un autre espace", async () => {
    const p = one("SELECT id FROM mk_shop_products WHERE name = 'Chaise Alpha'");
    assert.equal((await boss.get(`/marketing/site-web/principal/boutique/produits/${p.id}`)).status, 404);
    await boss.post(`/marketing/site-web/principal/boutique/produits/${p.id}`, { name: "PIRATÉ", price: "1" });
    assert.equal(one("SELECT name FROM mk_shop_products WHERE id = ?", p.id).name, "Chaise Alpha");
    await boss.post(`/marketing/site-web/principal/boutique/produits/${p.id}/supprimer`, {});
    assert.equal(one("SELECT deleted_at FROM mk_shop_products WHERE id = ?", p.id).deleted_at, null);
  });
  test("prix promotionnel invalide refusé avec message, rien écrit", async () => {
    const before = count("SELECT COUNT(*) AS n FROM mk_shop_products");
    const r = await boss.post(`/marketing/site-web/sites/${siteId}/boutique/produits`, { name: "Mauvais prix", price: "10", sale_price: "20", type: "simple" });
    assert.equal(r.status, 422);
    assert.equal(count("SELECT COUNT(*) AS n FROM mk_shop_products"), before);
  });
  test("réglages : livraison, taxe, coupon, ouverture et paiement", async () => {
    const SA = `/marketing/site-web/sites/${siteId}/boutique`;
    assert.equal((await boss.post(`${SA}/livraison/zones`, { name: "France", countries: "FR" })).status, 302);
    const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", siteId).id;
    assert.equal((await boss.post(`${SA}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" })).status, 302);
    assert.equal((await boss.post(`${SA}/taxes`, { name: "TVA", country: "FR", rate: "20" })).status, 302);
    assert.equal((await boss.post(`${SA}/coupons`, { code: "BIENVENUE", kind: "percent", value: "10" })).status, 302);
    assert.equal((await boss.post(`${SA}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["stripe", "manual"], tax_enabled: "1", prices_include_tax: "1", guest_checkout: "1", order_prefix: "ALP", manual_instructions: "Virement IBAN FR00 TEST" })).status, 302);
    const st = one("SELECT * FROM mk_shop_settings WHERE site_id = ?", siteId);
    assert.equal(st.enabled, 1); assert.equal(st.order_prefix, "ALP");
    assert.deepEqual(JSON.parse(st.payment_methods).sort(), ["manual", "stripe"]);
    // boutique principale : paramètres propres
    const MP = "/marketing/site-web/principal/boutique";
    await boss.post(`${MP}/livraison/zones`, { name: "Monde", countries: "" });
    const mz = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id IS NULL").id;
    await boss.post(`${MP}/livraison/zones/${mz}/methodes`, { name: "Colis monde", kind: "flat", cost: "9" });
    await boss.post(`${MP}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "PRI" });
    assert.equal(count("SELECT COUNT(*) AS n FROM mk_shop_shipping_zones WHERE site_id = ?", siteId), 1);
    assert.equal(count("SELECT COUNT(*) AS n FROM mk_shop_coupons WHERE site_id IS NULL"), 0);
  });
});

describe("boutique publique : fermée tant que le module n'est pas activé", () => {
  test("module « commerce » désactivé sur le site : 404 neutre, aucune fuite", async () => {
    const r = await anon.get("/boutique", site);
    assert.equal(r.status, 404);
    assert.doesNotMatch(r.text, /Chaise Alpha/);
  });
  test("activation du module par l'équipe", async () => {
    assert.equal((await boss.post(`/marketing/site-web/sites/${siteId}/modules/commerce`, { etat: "activer" })).status, 302);
    assert.equal((await anon.get("/boutique", site)).status, 200);
  });
});

describe("catalogue public isolé par hôte", () => {
  test("chaque hôte ne voit que SES produits", async () => {
    const onSite = (await anon.get("/boutique", site)).text;
    const onMain = (await anon.get("/boutique", main)).text;
    assert.match(onSite, /Chaise Alpha/); assert.doesNotMatch(onSite, /Table Principale/);
    assert.match(onMain, /Table Principale/); assert.doesNotMatch(onMain, /Chaise Alpha/);
  });
  test("fiche produit : trouvée sur son hôte seulement ; brouillon invisible", async () => {
    const slug = one("SELECT slug FROM mk_shop_products WHERE name = 'Chaise Alpha'").slug;
    assert.equal((await anon.get(`/boutique/produit/${slug}`, site)).status, 200);
    assert.equal((await anon.get(`/boutique/produit/${slug}`, main)).status, 404);
    await boss.post(`/marketing/site-web/sites/${siteId}/boutique/produits`, { name: "Secret brouillon", price: "5", type: "simple", status: "draft" });
    const sl = one("SELECT slug FROM mk_shop_products WHERE name = 'Secret brouillon'").slug;
    assert.equal((await anon.get(`/boutique/produit/${sl}`, site)).status, 404);
    assert.doesNotMatch((await anon.get("/boutique?q=Secret", site)).text, /Secret brouillon/);
  });
  test("recherche, tri, filtre de prix et pagination passent par le serveur", async () => {
    const r = await anon.get("/boutique?q=Chaise&tri=price_desc&min=1&max=100&stock=1", site);
    assert.equal(r.status, 200); assert.match(r.text, /Chaise Alpha/);
    assert.doesNotMatch((await anon.get("/boutique?q=Chaise&max=10", site)).text, /Chaise Alpha/);
    assert.equal((await anon.get("/boutique?page=999&min=abc&tri=%27%3B--", site)).status, 200);
  });
  test("injection dans la recherche : échappée", async () => {
    const r = await anon.get("/boutique?q=%3Cscript%3Ealert(1)%3C/script%3E", site);
    assert.equal(r.status, 200); assert.doesNotMatch(r.text, /<script>alert\(1\)/);
  });
});

describe("panier, commande et paiement (Stripe de test)", () => {
  let cli, productId, number, key;
  before(() => { productId = one("SELECT id FROM mk_shop_products WHERE name = 'Chaise Alpha'").id; });
  const add = (c, host, body = {}) => c.post("/boutique/panier/ajouter", { product_id: productId, quantity: "2", ...body }, host);

  test("ajout au panier : prix du navigateur ignoré, cookie HttpOnly, panier recalculé", async () => {
    cli = new Client(srv.base);
    const r = await add(cli, site, { price: "1", price_cents: "1", unit_price: "1", total: "1" });
    assert.equal(r.status, 303);
    assert.match(String(r.headers.get("set-cookie")), /kola_cart=[0-9a-f]{64}.*HttpOnly/i);
    const page = await cli.get("/boutique/panier", site);
    assert.equal(page.status, 200); assert.match(page.text, /99,80/); assert.doesNotMatch(page.text, /2,00/);
  });
  test("quantité absurde, produit inexistant, variante inattendue : refusés", async () => {
    const c = new Client(srv.base);
    const json = { headers: { ...site.headers, accept: "application/json" } };
    assert.equal((await c.post("/boutique/panier/ajouter", { product_id: productId, quantity: "0" }, json)).status, 422);
    assert.equal((await c.post("/boutique/panier/ajouter", { product_id: productId, quantity: "100000" }, json)).status, 422);
    assert.equal((await c.post("/boutique/panier/ajouter", { product_id: "99999", quantity: "1" }, json)).status, 422);
    assert.equal((await c.post("/boutique/panier/ajouter", { product_id: productId, variant_id: "5", quantity: "1" }, json)).status, 422);
    assert.equal((await c.post("/boutique/panier/ajouter", { product_id: productId, quantity: "11" }, json)).status, 422, "stock de 10 dépassé");
  });
  test("le panier persiste (rechargement) et n'existe pas sur un autre hôte", async () => {
    assert.match((await cli.get("/boutique/panier", site)).text, /Chaise Alpha/);
    const crossHost = await cli.get("/boutique/panier", main);
    assert.doesNotMatch(crossHost.text, /Chaise Alpha/, "le jeton du site ne donne pas le panier du principal");
  });
  test("commande par carte : commande « en attente » (jamais payée), montant serveur, redirection Stripe", async () => {
    const page = await cli.get("/boutique/commande?pays=FR", site);
    assert.equal(page.status, 200);
    const idem = String(page.text.match(/name="idempotency_key" value="([0-9a-f]+)"/)[1]);
    const method = String(page.text.match(/name="shipping_method" value="(\d+)"/)[1]);
    const body = { ...address, idempotency_key: idem, shipping_method: method, expected_total: "1", price: "1" };
    const stale = await cli.post("/boutique/commande", body, site);
    assert.equal(stale.status, 409, "total affiché périmé/falsifié");
    assert.equal(count("SELECT COUNT(*) AS n FROM mk_shop_orders WHERE site_id = ?", siteId), 0);
    const expected = String(page.text.match(/name="expected_total" value="(\d+)"/)[1]);
    const r = await cli.post("/boutique/commande", { ...body, expected_total: expected }, site);
    assert.equal(r.status, 303); assert.match(r.location, /^https:\/\/checkout\.stripe\.test\/pay\/cs_shop_/);
    const o = one("SELECT * FROM mk_shop_orders WHERE site_id = ?", siteId);
    number = o.number; key = null;
    assert.match(number, /^ALP-\d{5}$/);
    assert.equal(o.status, "pending"); assert.equal(o.payment_status, "pending"); assert.equal(o.total_cents, 9980 + 590);
    assert.equal(one("SELECT stock_qty FROM mk_shop_products WHERE id = ?", productId).stock_qty, 8, "stock réservé");
    const sess = [...stripe.sessions.values()].at(-1);
    assert.equal(sess.amount_total, o.total_cents); assert.equal(sess.client_reference_id, `shop:${o.id}`); assert.equal(sess.currency, "eur");
    assert.equal(o.tax_cents, Math.round(9980 * 2000 / 12000) + 0);
    // double soumission : même clé → même commande, aucune seconde session
    const sessions = stripe.sessions.size;
    const again = await cli.post("/boutique/commande", { ...body, expected_total: expected }, site);
    assert.equal(again.status, 303); assert.doesNotMatch(again.location, /stripe/);
    assert.equal(count("SELECT COUNT(*) AS n FROM mk_shop_orders WHERE site_id = ?", siteId), 1);
    assert.equal(stripe.sessions.size, sessions);
    assert.equal(one("SELECT stock_qty FROM mk_shop_products WHERE id = ?", productId).stock_qty, 8);
  });
  test("retour du client SANS paiement chez Stripe : la commande reste non payée (une page de succès ne prouve rien)", async () => {
    const o = one("SELECT * FROM mk_shop_orders WHERE number = ?", number);
    const tok = crypto.createHmac("sha256", TEST_KEY).update(`shop-order:${o.id}:${o.number}:${o.created_at}`).digest("hex").slice(0, 32);
    key = tok;
    const r = await cli.get(`/boutique/commande/retour/${number}?k=${tok}`, site);
    assert.equal(r.status, 303);
    assert.equal(one("SELECT payment_status FROM mk_shop_orders WHERE id = ?", o.id).payment_status, "pending");
    const conf = await cli.get(`/boutique/commande/confirmation/${number}?k=${tok}`, site);
    assert.equal(conf.status, 200); assert.match(conf.text, /paiement non confirmé/);
  });
  test("accès à la commande : jeton obligatoire, jamais depuis un autre hôte, jamais deviné", async () => {
    const stranger = new Client(srv.base);
    assert.equal((await stranger.get(`/boutique/commande/confirmation/${number}`, site)).status, 404);
    assert.equal((await stranger.get(`/boutique/commande/confirmation/${number}?k=${"0".repeat(32)}`, site)).status, 404);
    assert.equal((await cli.get(`/boutique/commande/confirmation/${number}?k=${key}`, main)).status, 404, "le même jeton ne vaut rien sur la boutique principale");
  });
  test("webhook sans signature valide : refusé, rien ne change", async () => {
    const o = one("SELECT * FROM mk_shop_orders WHERE number = ?", number);
    const session = { ...[...stripe.sessions.values()].at(-1), payment_status: "paid" };
    assert.equal(await webhook({ id: "evt_bad", type: "checkout.session.completed", data: { object: session } }, { valid: false }), 400);
    assert.equal(one("SELECT payment_status FROM mk_shop_orders WHERE id = ?", o.id).payment_status, "pending");
  });
  test("webhook avec montant falsifié : commande NON payée", async () => {
    const o = one("SELECT * FROM mk_shop_orders WHERE number = ?", number);
    const session = { ...[...stripe.sessions.values()].at(-1), payment_status: "paid", amount_total: 100 };
    assert.equal(await webhook({ id: "evt_amt", type: "checkout.session.completed", data: { object: session } }), 200);
    assert.notEqual(one("SELECT payment_status FROM mk_shop_orders WHERE id = ?", o.id).payment_status, "paid");
  });
  test("webhook valide : commande payée une seule fois, rejouée = sans effet, historique et notifications cohérents", async () => {
    const o = one("SELECT * FROM mk_shop_orders WHERE number = ?", number);
    const session = { ...[...stripe.sessions.values()].at(-1), payment_status: "paid" };
    const ev = { id: "evt_ok", type: "checkout.session.completed", data: { object: session } };
    assert.equal(await webhook(ev, { host: HA }), 200);
    assert.equal(await webhook(ev), 200);
    assert.equal(await webhook({ ...ev, id: "evt_ok2" }), 200);
    const paid = one("SELECT * FROM mk_shop_orders WHERE id = ?", o.id);
    assert.equal(paid.status, "paid"); assert.equal(paid.payment_status, "paid");
    assert.equal(count("SELECT COUNT(*) AS n FROM mk_shop_order_events WHERE order_id = ? AND kind = 'paid'", o.id), 1);
    assert.equal(count("SELECT COUNT(*) AS n FROM mk_shop_notifications WHERE order_id = ? AND event = 'order_paid'", o.id), 1);
    assert.ok(count("SELECT COUNT(*) AS n FROM mail_outbox WHERE kind = 'shop_order'") >= 2, "e-mails mis en file (SMTP absent : ignorés dans la file, jamais « envoyés »)");
    assert.equal(count("SELECT COUNT(*) AS n FROM mk_shop_notifications WHERE status = 'not_configured'") > 0, true);
    const conf = await cli.get(`/boutique/commande/confirmation/${number}?k=${key}`, site);
    assert.match(conf.text, /paiement confirmé/);
  });
  test("remboursement total annoncé par Stripe : commande remboursée", async () => {
    const o = one("SELECT * FROM mk_shop_orders WHERE number = ?", number);
    assert.equal(await webhook({ id: "evt_ref", type: "charge.refunded", data: { object: { payment_intent: `pi_${[...stripe.sessions.keys()].at(-1)}`, amount_refunded: o.total_cents } } }), 200);
    assert.equal(one("SELECT status FROM mk_shop_orders WHERE id = ?", o.id).status, "refunded");
  });
  test("échec de création de la page de paiement : commande restée en attente, message clair, rien de débité", async () => {
    const c = new Client(srv.base);
    await c.post("/boutique/panier/ajouter", { product_id: productId, quantity: "1" }, site);
    const page = await c.get("/boutique/commande?pays=FR", site);
    const expected = String(page.text.match(/name="expected_total" value="(\d+)"/)[1]);
    const method = String(page.text.match(/name="shipping_method" value="(\d+)"/)[1]);
    stripe.down = true;
    const r = await c.post("/boutique/commande", { ...address, shipping_method: method, expected_total: expected, idempotency_key: "panne1" }, site);
    stripe.down = false;
    assert.equal(r.status, 303); assert.match(r.location, /erreur=/);
    const o = one("SELECT * FROM mk_shop_orders WHERE site_id = ? ORDER BY id DESC LIMIT 1", siteId);
    assert.equal(o.payment_status, "failed"); assert.notEqual(o.status, "paid");
  });
  test("paiement manuel : commande en attente, confirmation par l'administrateur autorisé, historique journalisé", async () => {
    const c = new Client(srv.base);
    await c.post("/boutique/panier/ajouter", { product_id: productId, quantity: "1" }, site);
    const page = await c.get("/boutique/commande?pays=FR", site);
    const expected = String(page.text.match(/name="expected_total" value="(\d+)"/)[1]);
    const method = String(page.text.match(/name="shipping_method" value="(\d+)"/)[1]);
    const r = await c.post("/boutique/commande", { ...address, payment_method: "manual", shipping_method: method, expected_total: expected, idempotency_key: "man1" }, site);
    assert.equal(r.status, 303); assert.match(r.location, /\/boutique\/commande\/confirmation\/ALP-/);
    const o = one("SELECT * FROM mk_shop_orders WHERE payment_method = 'manual' AND site_id = ?", siteId);
    assert.equal(o.status, "pending");
    assert.match((await c.get(r.location, site)).text, /Virement IBAN FR00 TEST/);
    const ok = await boss.post(`/marketing/site-web/sites/${siteId}/boutique/commandes/${o.id}/statut`, { statut: "paid", note: "Virement reçu" });
    assert.equal(ok.status, 302);
    assert.equal(one("SELECT status FROM mk_shop_orders WHERE id = ?", o.id).status, "paid");
    assert.equal((await boss.post(`/marketing/site-web/sites/${siteId}/boutique/commandes/${o.id}/statut`, { statut: "completed" })).status, 302);
    assert.equal(one("SELECT status FROM mk_shop_orders WHERE id = ?", o.id).status, "shipped" === "x" ? "" : "paid", "paid → completed est refusé : il faut passer par l'expédition");
    assert.ok(count("SELECT COUNT(*) AS n FROM mk_audit_logs WHERE action = 'shop_order.status_changed'") >= 1);
    // l'ordre de l'espace principal ne peut pas être traité depuis l'adresse du site (et inversement)
    assert.equal((await boss.get(`/marketing/site-web/principal/boutique/commandes/${o.id}`)).status, 404);
  });
});

describe("isolation : la boutique principale n'a aucun accès aux données du site", () => {
  test("commande du principal : impossible d'utiliser le jeton ou la numérotation d'un site", async () => {
    const c = new Client(srv.base);
    const mainProd = one("SELECT id FROM mk_shop_products WHERE name = 'Table Principale'").id;
    await c.post("/boutique/panier/ajouter", { product_id: mainProd, quantity: "1" }, main);
    const page = await c.get("/boutique/commande?pays=FR", main);
    assert.equal(page.status, 200);
    const expected = String(page.text.match(/name="expected_total" value="(\d+)"/)[1]);
    const method = String(page.text.match(/name="shipping_method" value="(\d+)"/)[1]);
    const r = await c.post("/boutique/commande", { ...address, payment_method: "manual", shipping_method: method, expected_total: expected, idempotency_key: "p1" }, main);
    assert.equal(r.status, 303);
    const o = one("SELECT * FROM mk_shop_orders WHERE site_id IS NULL");
    assert.match(o.number, /^PRI-\d{5}$/);
    assert.equal((await c.get(r.location, site)).status, 404, "la commande du principal est introuvable sur l'hôte du site");
    // une commande ne contient jamais un produit d'une autre boutique
    assert.equal(count("SELECT COUNT(*) AS n FROM mk_shop_order_items i JOIN mk_shop_orders o ON o.id = i.order_id JOIN mk_shop_products p ON p.id = i.product_id WHERE IFNULL(o.site_id,0) <> IFNULL(p.site_id,0)"), 0);
  });
  test("ajouter au panier d'un hôte le produit d'un autre hôte est refusé", async () => {
    const c = new Client(srv.base);
    const mainProd = one("SELECT id FROM mk_shop_products WHERE name = 'Table Principale'").id;
    const r = await c.post("/boutique/panier/ajouter", { product_id: mainProd, quantity: "1" }, { headers: { ...site.headers, accept: "application/json" } });
    assert.equal(r.status, 422);
  });
  test("compte client : un compte du principal ne connecte pas sur le site", async () => {
    const c = new Client(srv.base);
    assert.equal((await c.post("/boutique/compte/inscription", { email: "cli@example.test", password: "motdepasse-solide-1", name: "Cli" }, main)).status, 303);
    assert.match((await c.get("/boutique/compte", main)).text, /Mes commandes/);
    const onSite = await c.get("/boutique/compte", site);
    assert.doesNotMatch(onSite.text, /Mes commandes/);
    assert.equal((await new Client(srv.base).post("/boutique/compte/connexion", { email: "cli@example.test", password: "motdepasse-solide-1" }, site)).status, 401);
  });
  test("réinitialisation du mot de passe : réponse identique que le compte existe ou non", async () => {
    const a = await new Client(srv.base).post("/boutique/compte/mot-de-passe-oublie", { email: "cli@example.test" }, main);
    const b = await new Client(srv.base).post("/boutique/compte/mot-de-passe-oublie", { email: "inconnu@example.test" }, main);
    assert.equal(a.status, b.status);
    assert.equal(count("SELECT COUNT(*) AS n FROM mail_outbox WHERE kind = 'shop_reset'"), 1);
  });
});

describe("autorisations", () => {
  test("anonyme : l'administration de la boutique redirige vers la connexion", async () => {
    const r = await new Client(srv.base).get(`/marketing/site-web/sites/${siteId}/boutique`);
    assert.ok([302, 401, 403].includes(r.status));
  });
  test("une seule boutique par hôte inconnu : 421/404, jamais la boutique du principal", async () => {
    const r = await new Client(srv.base).get("/boutique", { headers: { "x-forwarded-host": "inconnu.example", "User-Agent": "Mozilla/5.0 (test)" } });
    assert.ok([404, 421].includes(r.status), String(r.status));
    assert.doesNotMatch(r.text, /Table Principale/);
  });
});
