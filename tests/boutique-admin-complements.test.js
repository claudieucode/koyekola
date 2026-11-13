// Compléments d'administration (VRAI serveur) : modifier/supprimer un coupon, livraison offerte, promotion automatique, duplication, générateur de variantes, actions groupées, commande manuelle, notes, fiche client.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (test)"; const H = "www.adm-un.example"; const hh = { headers: { "x-forwarded-host": H, "User-Agent": UA } };
let srv, boss, db, site, base, pid; const one = (sql, ...a) => db.prepare(sql).get(...a);
before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  site = Number(String((await boss.post("/marketing/site-web/sites", { name: "Adm" })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
  await boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${H}` } } } });
  base = `/marketing/site-web/sites/${site}/boutique`;
  await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" });
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", site).id;
  await boss.post(`${base}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "6,00" });
  await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "AD", manual_instructions: "Virement" });
  await boss.post(`/marketing/site-web/sites/${site}/modules/commerce`, { etat: "activer" });
  await boss.post(`${base}/produits`, { name: "Lampe", type: "simple", status: "published", price: "50,00", manage_stock: "1", stock_qty: "20", requires_shipping: "1", sku: "LAMPE" });
  pid = one("SELECT id FROM mk_shop_products WHERE site_id = ?", site).id;
});
after(async () => { db.close(); await srv.stop(); });

const checkout = async (cli, code) => {
  await cli.post("/boutique/panier/ajouter", { product_id: String(pid), quantity: "1" }, hh);
  if (code) await cli.post("/boutique/panier/coupon", { code }, hh);
  const page = await cli.get("/boutique/commande?pays=FR", hh);
  const f = (n) => page.text.match(new RegExp(`name="${n}" value="([^"]+)"`))[1];
  const r = await cli.post("/boutique/commande", { email: "c@example.test", ship_name: "Ada", ship_line1: "1 rue", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: f("idempotency_key"), shipping_method: f("shipping_method"), payment_method: "manual", expected_total: f("expected_total") }, hh);
  assert.equal(r.status, 303, String(r.text).slice(0, 200));
  return one("SELECT * FROM mk_shop_orders WHERE site_id = ? ORDER BY id DESC", site);
};

test("coupons : « livraison offerte seulement », modification (code et utilisations conservés), promotion automatique, suppression d'un coupon utilisé = désactivation", async () => {
  assert.equal((await boss.post(`${base}/coupons`, { code: "PORTOFFERT", kind: "percent", value: "", shipping_only: "1" })).status, 302);
  const ship = one("SELECT * FROM mk_shop_coupons WHERE code = 'PORTOFFERT' AND site_id = ?", site); assert.equal(ship.shipping_only, 1); assert.equal(ship.free_shipping, 1);
  const o1 = await checkout(new Client(srv.base), "PORTOFFERT");
  assert.equal(o1.discount_cents, 0, "aucune remise sur les articles"); assert.equal(o1.shipping_cents, 0, "livraison offerte"); assert.equal(o1.total_cents, 5000);
  assert.equal(one("SELECT used_count n FROM mk_shop_coupons WHERE id = ?", ship.id).n, 1);
  // modification : valeur, code inchangé, compteur conservé
  assert.equal((await boss.post(`${base}/coupons/${ship.id}`, { kind: "percent", value: "10", free_shipping: "1" })).status, 302);
  const mod = one("SELECT * FROM mk_shop_coupons WHERE id = ?", ship.id); assert.equal(mod.code, "PORTOFFERT"); assert.equal(mod.value, 10); assert.equal(mod.shipping_only, 0); assert.equal(mod.used_count, 1);
  assert.match((await boss.get(`${base}/coupons/${ship.id}`)).text, /PORTOFFERT/);
  const o2 = await checkout(new Client(srv.base), "PORTOFFERT");
  assert.equal(o2.discount_cents, 500); assert.equal(o2.shipping_cents, 0); assert.equal(o2.total_cents, 4500);
  // promotion automatique : 20 % dès 40 € sans code
  assert.equal((await boss.post(`${base}/coupons`, { code: "AUTO20", kind: "percent", value: "20", min_subtotal: "40", auto_apply: "1" })).status, 302);
  const o3 = await checkout(new Client(srv.base), null);
  assert.equal(o3.coupon_code, "AUTO20"); assert.equal(o3.discount_cents, 1000); assert.equal(o3.total_cents, 4000 + 600);
  // un code saisi valide a la priorité sur l'automatique
  const o4 = await checkout(new Client(srv.base), "PORTOFFERT"); assert.equal(o4.coupon_code, "PORTOFFERT");
  // suppression : coupon utilisé → désactivé, pas supprimé ; coupon neuf → supprimé
  await boss.post(`${base}/coupons/${ship.id}/supprimer`, {});
  assert.equal(one("SELECT active FROM mk_shop_coupons WHERE id = ?", ship.id).active, 0);
  await boss.post(`${base}/coupons`, { code: "NEUF10", kind: "fixed", value: "5" });
  const neuf = one("SELECT id FROM mk_shop_coupons WHERE code = 'NEUF10' AND site_id = ?", site).id;
  await boss.post(`${base}/coupons/${neuf}/supprimer`, {}); assert.equal(one("SELECT COUNT(*) n FROM mk_shop_coupons WHERE id = ?", neuf).n, 0);
  // l'autre site ne voit pas ce coupon
  assert.equal((await new Client(srv.base).post("/boutique/panier/coupon", { code: "AUTO20" }, { headers: { "x-forwarded-host": "www.autre.example", "User-Agent": UA } })).status !== 200, true);
});

test("duplication : brouillon « Copie de », SKU vidé, stock et catégories conservés ; générateur de variantes", async () => {
  assert.equal((await boss.post(`${base}/produits/${pid}/dupliquer`, {})).status, 302);
  const c = one("SELECT * FROM mk_shop_products WHERE site_id = ? AND name LIKE 'Copie de%'", site);
  assert.ok(c); assert.equal(c.status, "draft"); assert.equal(c.sku, null); assert.equal(c.price_cents, 5000); assert.equal(c.stock_qty, one("SELECT stock_qty n FROM mk_shop_products WHERE id = ?", pid).n, "stock copié tel quel"); assert.notEqual(c.slug, one("SELECT slug FROM mk_shop_products WHERE id = ?", pid).slug);
  await boss.post(`${base}/produits`, { name: "T-shirt", type: "variable", status: "published", price: "20,00", attributes: "Taille: S, M, L\nCouleur: Noir, Blanc" });
  const v = one("SELECT * FROM mk_shop_products WHERE site_id = ? AND name = 'T-shirt'", site);
  const attrs = JSON.parse(v.attributes);
  if (!attrs.length) await boss.post(`${base}/produits/${v.id}`, { name: "T-shirt", type: "variable", status: "published", price: "20,00", attributes: "Taille: S, M, L\nCouleur: Noir, Blanc" });
  assert.equal(JSON.parse(one("SELECT attributes a FROM mk_shop_products WHERE id = ?", v.id).a).length, 2, "attributs enregistrés");
  await boss.post(`${base}/produits/${v.id}/generer-variantes`, { stock: "4", manage_stock: "1" });
  assert.equal(one("SELECT COUNT(*) n FROM mk_shop_variants WHERE product_id = ?", v.id).n, 6, "3 tailles × 2 couleurs");
  await boss.post(`${base}/produits/${v.id}/generer-variantes`, { stock: "4" });
  assert.equal(one("SELECT COUNT(*) n FROM mk_shop_variants WHERE product_id = ?", v.id).n, 6, "idempotent");
  assert.equal(one("SELECT SUM(stock_qty) n FROM mk_shop_variants WHERE product_id = ?", v.id).n, 24);
  await boss.post(`${base}/produits/${v.id}/dupliquer`, {});
  const dup = one("SELECT id FROM mk_shop_products WHERE site_id = ? AND name = 'Copie de T-shirt'", site); assert.equal(one("SELECT COUNT(*) n FROM mk_shop_variants WHERE product_id = ?", dup.id).n, 6);
});

test("actions groupées sur les produits et les commandes ; commande manuelle ; note interne ; fiche client", async () => {
  const ids = db.prepare("SELECT id FROM mk_shop_products WHERE site_id = ? AND name LIKE 'Copie de%'").all(site).map((r) => String(r.id));
  await boss.post(`${base}/produits/lot`, [...ids.map((i) => ["ids", i]), ["action", "published"]]);
  assert.equal(one("SELECT COUNT(*) n FROM mk_shop_products WHERE site_id = ? AND name LIKE 'Copie de%' AND status = 'published'", site).n, ids.length);
  await boss.post(`${base}/produits/lot`, [...ids.map((i) => ["ids", i]), ["action", "delete"]]);
  assert.equal(one("SELECT COUNT(*) n FROM mk_shop_products WHERE site_id = ? AND name LIKE 'Copie de%' AND deleted_at IS NULL", site).n, 0);
  assert.match((await boss.get(`${base}/commandes/nouvelle`)).text, /Nouvelle commande/);
  const r = await boss.post(`${base}/commandes`, { line_1: `${pid}:`, qty_1: "2", email: "tel@example.test", name: "Client Tel", line1: "3 rue du Phone", postal_code: "75002", city: "Paris", country: "FR", shipping_method: String(one("SELECT id FROM mk_shop_shipping_methods WHERE site_id = ?", site).id), note: "commande téléphonique" });
  assert.equal(r.status, 302, String(r.text).slice(0, 300)); assert.match(r.location, /commandes\/\d+/);
  const o = one("SELECT * FROM mk_shop_orders WHERE email = 'tel@example.test'");
  assert.equal(o.payment_method, "manual"); assert.equal(o.status, "pending"); assert.equal(o.coupon_code, "AUTO20", "la promotion automatique s'applique aussi aux commandes saisies à la main"); assert.equal(o.total_cents, 10000 - 2000 + 600);
  assert.equal(one("SELECT stock_qty n FROM mk_shop_products WHERE id = ?", pid).n, 20 - 1 - 1 - 1 - 1 - 2, "stock décompté (4 commandes en ligne + 2 ici)");
  await boss.post(`${base}/commandes/${o.id}/note`, { note: "Client rappelé" });
  assert.ok(one("SELECT 1 FROM mk_shop_order_events WHERE order_id = ? AND kind = 'note' AND note = 'Client rappelé'", o.id));
  const bulk = await boss.post(`${base}/commandes/lot`, [["ids", String(o.id)], ["action", "cancelled"]]);
  assert.equal(bulk.status, 302); assert.equal(one("SELECT status FROM mk_shop_orders WHERE id = ?", o.id).status, "cancelled");
  const cid = one("SELECT id FROM mk_shop_customers WHERE email = 'tel@example.test' AND site_id = ?", site).id;
  const page = await boss.get(`${base}/clients/${cid}`); assert.equal(page.status, 200); assert.match(page.text, /tel@example\.test/); assert.match(page.text, /AD-/);
  const bad = await boss.post(`${base}/commandes`, { line_1: "", email: "x@example.test", name: "X", line1: "1", postal_code: "1", city: "P", country: "FR" });
  assert.equal(bad.status, 302); assert.doesNotMatch(String(bad.location), /commandes\/\d+$/);
});
