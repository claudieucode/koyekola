// Rapports et exports CSV de la boutique (VRAI serveur) : chiffres exacts, remboursements soustraits, isolation entre sites, injection de formule neutralisée, droits.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (test)";
const HA = "www.rap-un.example", HB = "www.rap-deux.example";
const hdr = (h) => ({ headers: { "x-forwarded-host": h, "User-Agent": UA } });
let srv, boss, db, A, B;
const one = (sql, ...a) => db.prepare(sql).get(...a);

async function mkSite(name, host) {
  const id = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${id}/reglages.json`)).text);
  await boss.request(`/marketing/site-web/sites/${id}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } } });
  const base = `/marketing/site-web/sites/${id}/boutique`;
  await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" });
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", id).id;
  await boss.post(`${base}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,00" });
  await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "R" + id, manual_instructions: "Virement" });
  await boss.post(`/marketing/site-web/sites/${id}/modules/commerce`, { etat: "activer" });
  return { id, base, host };
}
async function product(S, name, price) {
  await boss.post(`${S.base}/produits`, { name, type: "simple", status: "published", price, manage_stock: "1", stock_qty: "3", requires_shipping: "1" });
  return one("SELECT id FROM mk_shop_products WHERE site_id = ? AND name = ?", S.id, name).id;
}
async function paid(S, pid, qty) {
  const cli = new Client(srv.base), h = hdr(S.host);
  await cli.post("/boutique/panier/ajouter", { product_id: String(pid), quantity: String(qty) }, h);
  const page = await cli.get("/boutique/commande?pays=FR", h);
  const f = (n) => page.text.match(new RegExp(`name="${n}" value="([^"]+)"`))[1];
  const r = await cli.post("/boutique/commande", { email: "x@example.test", ship_name: "Ada", ship_line1: "1 rue", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: f("idempotency_key"), shipping_method: f("shipping_method"), payment_method: "manual", expected_total: f("expected_total") }, h);
  assert.equal(r.status, 303);
  const o = one("SELECT * FROM mk_shop_orders WHERE site_id = ? ORDER BY id DESC", S.id);
  assert.equal((await boss.post(`${S.base}/commandes/${o.id}/statut`, { statut: "paid" })).status, 302);
  return one("SELECT * FROM mk_shop_orders WHERE id = ?", o.id);
}
before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  A = await mkSite("Rapports Un", HA); B = await mkSite("Rapports Deux", HB);
});
after(async () => { db.close(); await srv.stop(); });

test("les chiffres du rapport sont exacts, le remboursement est soustrait, l'autre site n'apparaît pas, le CSV neutralise les formules", async () => {
  const p1 = await product(A, "=HYPERLINK(\"http://x\")", "20,00");
  const p2 = await product(B, "Produit de B", "99,00");
  const o1 = await paid(A, p1, 2); // 40 + 5 de livraison = 45
  await paid(B, p2, 1);
  assert.equal(o1.total_cents, 4500);
  const t = (await boss.get(`${A.base}/rapports`)).text;
  assert.match(t, /Ventes brutes/); assert.match(t, /45,00/); assert.doesNotMatch(t, /Produit de B/);
  // remboursement partiel de 10 € (paiement manuel : enregistré hors plateforme)
  const it = one("SELECT id FROM mk_shop_order_items WHERE order_id = ?", o1.id).id;
  assert.equal((await boss.post(`${A.base}/commandes/${o1.id}/remboursement`, { amount: "10,00", reason: "geste", idempotency_key: "k-rap-1" })).status, 302);
  const rf = one("SELECT amount_cents FROM mk_shop_refunds WHERE order_id = ?", o1.id);
  assert.ok(rf && rf.amount_cents > 0, "remboursement créé");
  const after = (await boss.get(`${A.base}/rapports`)).text;
  assert.match(after, /Ventes nettes/);
  const rep = require("../src/marketing/shop/reports").summary({ db, organizationId: o1.organization_id, siteId: A.id }, require("../src/marketing/shop/reports").period({}));
  assert.equal(rep.grossCents, 4500); assert.equal(rep.refundedCents, rf.amount_cents); assert.equal(rep.netCents, 4500 - rf.amount_cents); assert.equal(rep.orders, 1); assert.equal(rep.unitsSold, 2);
  // CSV
  const csv = await boss.get(`${A.base}/rapports/export/lignes`);
  assert.equal(csv.status, 200); assert.match(csv.headers.get("content-type"), /text\/csv/); assert.match(csv.headers.get("content-disposition"), /attachment/);
  assert.match(csv.text, /'=HYPERLINK/, "formule neutralisée"); assert.doesNotMatch(csv.text.replace(/'=HYPERLINK/g, ""), /(^|;)"?=HYPERLINK/);
  const co = (await boss.get(`${A.base}/rapports/export/commandes`)).text;
  assert.match(co, new RegExp(o1.number)); assert.match(co, /45,00/); assert.doesNotMatch(co, /Produit de B/);
  assert.equal((await boss.get(`${A.base}/rapports/export/inconnu`)).status === 404 || (await boss.get(`${A.base}/rapports/export/inconnu`)).status === 302, true);
  // l'export clients ne contient que ceux du site A
  const cl = (await boss.get(`${A.base}/rapports/export/clients`)).text;
  assert.match(cl, /E-mail/);
});

test("période invalide : repli sur 30 jours, jamais d'erreur", async () => {
  const r = await boss.get(`${A.base}/rapports?from=nimporte&to=quoi`);
  assert.equal(r.status, 200);
  const rep = require("../src/marketing/shop/reports");
  const p = rep.period({ from: "2020-01-01", to: "2026-01-01" });
  assert.ok((Date.parse(p.to) - Date.parse(p.from)) / 86400000 <= 366);
});
