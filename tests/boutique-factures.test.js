// Factures et avoirs numérotés (VRAI serveur) : émission à l'encaissement, numérotation continue par site, avoir sur remboursement, contenu figé, accès client, isolation, échappement.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (test)";
const HA = "www.fac-un.example", HB = "www.fac-deux.example";
const hdr = (h) => ({ headers: { "x-forwarded-host": h, "User-Agent": UA } });
let srv, boss, db, A, B;
const one = (sql, ...a) => db.prepare(sql).get(...a);

async function mkSite(name, host) {
  const id = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${id}/reglages.json`)).text);
  await boss.request(`/marketing/site-web/sites/${id}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } } });
  const base = `/marketing/site-web/sites/${id}/boutique`;
  await boss.post(`/marketing/site-web/sites/${id}/modules/commerce`, { etat: "activer" });
  await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" });
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", id).id;
  await boss.post(`${base}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,00" });
  await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "V" + id, manual_instructions: "Virement" });
  await boss.post(`${base}/produits`, { name: "Théière", type: "simple", status: "published", price: "20,00", manage_stock: "1", stock_qty: "50", requires_shipping: "1" });
  return { id, base, host, pid: one("SELECT id FROM mk_shop_products WHERE site_id = ?", id).id };
}
async function buy(S) {
  const cli = new Client(srv.base), h = hdr(S.host);
  await cli.post("/boutique/panier/ajouter", { product_id: String(S.pid), quantity: "2" }, h);
  const page = await cli.get("/boutique/commande?pays=FR", h);
  const f = (n) => page.text.match(new RegExp(`name="${n}" value="([^"]+)"`))[1];
  const r = await cli.post("/boutique/commande", { email: "client@example.test", ship_name: "Ada <b>X</b>", ship_line1: "1 rue", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: f("idempotency_key"), shipping_method: f("shipping_method"), payment_method: "manual", expected_total: f("expected_total") }, h);
  assert.equal(r.status, 303);
  return { cli, h, order: one("SELECT * FROM mk_shop_orders WHERE site_id = ? ORDER BY id DESC", S.id), conf: r.location };
}
const pay = async (S, o) => assert.equal((await boss.post(`${S.base}/commandes/${o.id}/statut`, { statut: "paid" })).status, 302);
before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  A = await mkSite("Factures Un", HA); B = await mkSite("Factures Deux", HB);
  assert.equal((await boss.post(`${A.base}/factures/vendeur`, { legal_name: "Maison <Alpha> SARL", address: "1 place Test\n75001 Paris", vat_number: "FR123", invoice_prefix: "ab-1" })).status, 302);
});
after(async () => { db.close(); await srv.stop(); });

test("pas de facture avant paiement ; à l'encaissement : une facture numérotée, identique si on rejoue, numéros continus par site", async () => {
  const b1 = await buy(A); assert.equal(one("SELECT COUNT(*) n FROM mk_shop_invoices WHERE order_id = ?", b1.order.id).n, 0);
  await pay(A, b1.order);
  const inv1 = db.prepare("SELECT * FROM mk_shop_invoices WHERE order_id = ?").all(b1.order.id);
  assert.equal(inv1.length, 1); assert.match(inv1[0].number, /^AB1-\d{4}-000001$/); assert.equal(inv1[0].total_cents, 4500);
  await boss.get(`${A.base}/commandes/${b1.order.id}`); await boss.get(`${A.base}/commandes/${b1.order.id}`); // consulter ne recrée rien
  assert.equal(one("SELECT COUNT(*) n FROM mk_shop_invoices WHERE order_id = ?", b1.order.id).n, 1);
  const b2 = await buy(A); await pay(A, b2.order);
  assert.match(one("SELECT number FROM mk_shop_invoices WHERE order_id = ?", b2.order.id).number, /000002$/);
  const bb = await buy(B); await pay(B, bb.order);
  assert.match(one("SELECT number FROM mk_shop_invoices WHERE order_id = ?", bb.order.id).number, /^F-\d{4}-000001$/, "le site B a sa propre série");
});

test("le contenu est figé et échappé ; le vendeur modifié ensuite ne change pas la facture émise", async () => {
  const o = one("SELECT * FROM mk_shop_orders WHERE site_id = ? ORDER BY id", A.id);
  const inv = one("SELECT id FROM mk_shop_invoices WHERE order_id = ?", o.id).id;
  await boss.post(`${A.base}/factures/vendeur`, { legal_name: "Autre nom", address: "ailleurs", invoice_prefix: "ab-1" });
  const html = (await boss.get(`${A.base}/commandes/${o.id}/factures/${inv}`)).text;
  assert.match(html, /Maison &lt;Alpha&gt; SARL/); assert.doesNotMatch(html, /Autre nom/); assert.doesNotMatch(html, /<Alpha>/);
  assert.match(html, /Théière/); assert.match(html, /45,00/);
  const j = (await boss.get(`${A.base}/factures`)).text; assert.match(j, /AB1-/);
});

test("un remboursement réussi émet un avoir numéroté ; le client y accède avec son lien secret, pas sans ; l'autre site n'y accède pas", async () => {
  const b = await buy(A); await pay(A, b.order);
  assert.equal((await boss.post(`${A.base}/commandes/${b.order.id}/remboursement`, { amount: "12,00", reason: "geste", idempotency_key: "k-av-1" })).status, 302);
  const docs = db.prepare("SELECT * FROM mk_shop_invoices WHERE order_id = ? ORDER BY id").all(b.order.id);
  assert.equal(docs.length, 2); assert.equal(docs[1].kind, "credit_note"); assert.match(docs[1].number, /^AVAB1-\d{4}-000001$/); assert.equal(docs[1].total_cents, 1200);
  const k = new URL(b.conf, "https://x").search; // ?k=…
  const conf = await b.cli.get(`/boutique/commande/confirmation/${b.order.number}${k}`, b.h);
  assert.match(conf.text, /Facture AB1-/);
  const pub = await b.cli.get(`/boutique/commande/${b.order.number}/facture/${docs[0].id}${k}`, b.h);
  assert.equal(pub.status, 200); assert.match(pub.text, /Facture n° AB1-/);
  const no = await new Client(srv.base).get(`/boutique/commande/${b.order.number}/facture/${docs[0].id}`, b.h);
  assert.equal(no.status, 404);
  const other = await new Client(srv.base).get(`/boutique/commande/${b.order.number}/facture/${docs[0].id}${k}`, hdr(HB));
  assert.equal(other.status, 404);
  const cross = await boss.get(`${B.base}/commandes/${b.order.id}/factures/${docs[0].id}`);
  assert.ok([302, 404].includes(cross.status) && !/Facture n°/.test(cross.text), "l'autre site ne voit pas la facture");
});
