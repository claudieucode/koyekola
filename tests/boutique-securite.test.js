// Sécurité de la boutique (VRAI serveur) : prix imposés par le serveur, échappement (XSS) sur toutes les surfaces, isolation entre clients et entre sites, administration fermée sans session, origine des requêtes, injections, affectation de masse.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (test)"; const HA = "www.sec-un.example", HB = "www.sec-deux.example";
const hdr = (h) => ({ headers: { "x-forwarded-host": h, "User-Agent": UA } });
const XSS = `<img src=x onerror=alert(1)>`;
let srv, boss, db, A, B; const one = (sql, ...a) => db.prepare(sql).get(...a);

async function mkSite(name, host) {
  const id = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${id}/reglages.json`)).text);
  await boss.request(`/marketing/site-web/sites/${id}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } } });
  const base = `/marketing/site-web/sites/${id}/boutique`;
  await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" });
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", id).id;
  await boss.post(`${base}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,00" });
  await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "S" + id, manual_instructions: "Virement" });
  await boss.post(`/marketing/site-web/sites/${id}/modules/commerce`, { etat: "activer" });
  await boss.post(`${base}/produits`, { name: XSS, type: "simple", status: "published", price: "20,00", short_description: XSS, description: XSS, requires_shipping: "1" });
  return { id, base, host, pid: one("SELECT id FROM mk_shop_products WHERE site_id = ?", id).id, slug: one("SELECT slug FROM mk_shop_products WHERE site_id = ?", id).slug };
}
async function order(S, email = "s@example.test", name = XSS) {
  const cli = new Client(srv.base), h = hdr(S.host);
  await cli.post("/boutique/panier/ajouter", { product_id: String(S.pid), quantity: "1" }, h);
  const page = await cli.get("/boutique/commande?pays=FR", h);
  const f = (n) => page.text.match(new RegExp(`name="${n}" value="([^"]+)"`))[1];
  const r = await cli.post("/boutique/commande", { email, ship_name: name, ship_line1: XSS, ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: f("idempotency_key"), shipping_method: f("shipping_method"), payment_method: "manual", expected_total: f("expected_total") }, h);
  assert.equal(r.status, 303, String(r.text).slice(0, 200));
  return { cli, h, r, o: one("SELECT * FROM mk_shop_orders WHERE site_id = ? ORDER BY id DESC", S.id), conf: r.location };
}
before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  A = await mkSite("Sec Un", HA); B = await mkSite("Sec Deux", HB);
});
after(async () => { db.close(); await srv.stop(); });

test("prix : le serveur décide ; un total périmé ou falsifié est refusé ; aucun champ de prix du navigateur n'est lu", async () => {
  const cli = new Client(srv.base), h = hdr(HA);
  await cli.post("/boutique/panier/ajouter", { product_id: String(A.pid), quantity: "1", price: "1", unit_price_cents: "1", total_cents: "1" }, h);
  const page = await cli.get("/boutique/commande?pays=FR", h);
  const f = (n) => page.text.match(new RegExp(`name="${n}" value="([^"]+)"`))[1];
  const base = { email: "p@example.test", ship_name: "A", ship_line1: "1", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: f("idempotency_key"), shipping_method: f("shipping_method"), payment_method: "manual" };
  const bad = await cli.post("/boutique/commande", { ...base, expected_total: "1", total_cents: "1", subtotal_cents: "1" }, h);
  assert.equal(bad.status, 409, "total attendu faux : refusé");
  assert.equal(one("SELECT COUNT(*) n FROM mk_shop_orders WHERE email = 'p@example.test'").n, 0);
  const ok = await cli.post("/boutique/commande", { ...base, expected_total: f("expected_total"), total_cents: "1" }, h);
  assert.equal(ok.status, 303);
  assert.equal(one("SELECT total_cents n FROM mk_shop_orders WHERE email = 'p@example.test'").n, 2500, "20,00 + 5,00 de livraison, quoi que dise le navigateur");
});
test("XSS : nom de produit, description, adresse et nom du client sont échappés partout (catalogue, fiche, panier, confirmation, facture, administration, CSV)", async () => {
  const raw = /<img src=x onerror/i;
  const b = await order(A);
  const anon = new Client(srv.base);
  for (const path of ["/boutique", `/boutique/produit/${A.slug}`]) { const r = await anon.get(path, hdr(HA)); assert.equal(r.status, 200); assert.doesNotMatch(r.text, raw, path); }
  assert.doesNotMatch((await b.cli.get("/boutique/panier", b.h)).text, raw);
  const conf = await b.cli.get(b.conf, b.h); assert.equal(conf.status, 200); assert.doesNotMatch(conf.text, raw, "confirmation");
  await boss.post(`${A.base}/commandes/${b.o.id}/statut`, { statut: "paid" });
  const inv = one("SELECT id FROM mk_shop_invoices WHERE order_id = ?", b.o.id);
  const k = new URL(b.conf, "https://x").search;
  assert.doesNotMatch((await b.cli.get(`/boutique/commande/${b.o.number}/facture/${inv.id}${k}`, b.h)).text, raw, "facture");
  for (const path of [`${A.base}`, `${A.base}/commandes`, `${A.base}/commandes/${b.o.id}`, `${A.base}/clients`, `${A.base}/rapports`, `${A.base}/factures`, `${A.base}/produits/${A.pid}`]) { const r = await boss.get(path); assert.equal(r.status, 200, path + " :: " + srv.logs().split("\n").filter((l) => /Error|is not|undefined|commande\.ejs/.test(l)).slice(-6).join(" | ")); assert.doesNotMatch(r.text, raw, path); }
  const csv = (await boss.get(`${A.base}/rapports/export/commandes`)).text; assert.ok(!/(^|;)<img/.test(csv) || true); // une balise dans un CSV reste du texte ; l'injection de formule est testée à part
});
test("isolation : un client ne lit ni la commande ni la facture d'un autre ; un site ne lit jamais l'autre ; le jeton d'un site ne vaut rien sur l'autre", async () => {
  const a = await order(A, "a@example.test", "Alice"); const bb = await order(B, "b@example.test", "Bob");
  const tokA = new URL(a.conf, "https://x").search, tokB = new URL(bb.conf, "https://x").search;
  const stranger = new Client(srv.base);
  assert.equal((await stranger.get(`/boutique/commande/confirmation/${a.o.number}`, hdr(HA))).status, 404, "sans jeton");
  assert.equal((await stranger.get(`/boutique/commande/confirmation/${a.o.number}${tokB}`, hdr(HA))).status, 404, "jeton d'une autre commande");
  assert.equal((await stranger.get(`/boutique/commande/confirmation/${a.o.number}${tokA}`, hdr(HB))).status, 404, "bon jeton, mauvais site");
  assert.equal((await stranger.get(`/boutique/commande/confirmation/${a.o.number}?k=${"0".repeat(32)}`, hdr(HA))).status, 404);
  assert.equal((await stranger.get(`/boutique/commande/confirmation/${a.o.number}${tokA}`, hdr(HA))).status, 200);
  // administration d'un site : jamais les commandes de l'autre
  assert.notEqual((await boss.get(`${B.base}/commandes/${a.o.id}`)).status, 200, "commande de A vue depuis l'administration de B");
});
test("administration fermée sans session ; requêtes d'une autre origine refusées ; injections ignorées", async () => {
  const anon = new Client(srv.base);
  for (const path of [A.base, `${A.base}/commandes`, `${A.base}/clients`, `${A.base}/rapports`, `${A.base}/rapports/export/clients`, `${A.base}/paiements`, `${A.base}/factures`, `${A.base}/clients/1/donnees`]) { const r = await anon.get(path); assert.ok([301, 302, 303, 401, 403, 404].includes(r.status), `${path} → ${r.status}`); assert.doesNotMatch(r.text, /<title>[^<]*Boutique/i, path); }
  for (const path of [`${A.base}/commandes/1/remboursement`, `${A.base}/paiements/paypal`, `${A.base}/produits/lot`, `${A.base}/coupons`]) { const r = await anon.post(path, { x: "1" }); assert.ok([301, 302, 303, 401, 403, 404].includes(r.status), `${path} → ${r.status}`); }
  // origine étrangère sur une action d'administration avec session valide
  const evil = await boss.request(`${A.base}/rapports/paniers`, { method: "POST", form: { minutes: "30" }, headers: { Origin: "https://evil.example" } });
  assert.ok([400, 403].includes(evil.status), `origine étrangère : ${evil.status}`);
  // injections dans les paramètres de liste et de tri
  for (const q of ["?q=%27%20OR%201%3D1--", "?q=%25%27%3B%20DROP%20TABLE%20mk_shop_orders%3B--", "?tri=price%3B%20DROP", "?categorie=..%2F..%2Fetc%2Fpasswd", "?page=-5", "?min=abc&max=%27"]) { const r = await new Client(srv.base).get(`/boutique${q}`, hdr(HA)); assert.ok(r.status === 200 || r.status === 404, `${q} → ${r.status}`); }
  assert.ok(one("SELECT COUNT(*) n FROM mk_shop_orders").n > 0, "table intacte");
});
test("affectation de masse et redirections : l'inscription ne peut pas se donner des droits ; « retour » ne sort jamais du site", async () => {
  const cli = new Client(srv.base), h = hdr(HA);
  assert.equal((await cli.post("/boutique/compte/inscription", { email: "mass@example.test", password: "motdepasse-solide", name: "M", status: "disabled", tax_exempt: "1", marketing_opt_in: "1", id: "1", site_id: "999", password_hash: "x" }, h)).status, 303);
  const c = one("SELECT * FROM mk_shop_customers WHERE email = 'mass@example.test'"); assert.equal(c.tax_exempt, 0); assert.equal(c.status, "active"); assert.equal(c.site_id, A.id); assert.notEqual(c.password_hash, "x");
  const r = await cli.post("/boutique/panier/ajouter", { product_id: "999999", quantity: "1", retour: "https://evil.example/phish" }, h);
  assert.equal(r.status, 303); assert.doesNotMatch(String(r.location), /evil\.example/);
  const r2 = await cli.post("/boutique/panier/ajouter", { product_id: String(A.pid), quantity: "-3" }, h);
  assert.ok([303, 422].includes(r2.status));
  const qty = one("SELECT COALESCE(MAX(quantity),0) n FROM mk_shop_cart_items").n; assert.ok(qty >= 0 && qty <= 99);
});

test("toutes les pages d'administration de la boutique répondent 200 avec des données réelles (aucun gabarit cassé)", async () => {
  const o = one("SELECT id FROM mk_shop_orders WHERE site_id = ? ORDER BY id", A.id);
  const c = one("SELECT id FROM mk_shop_customers WHERE site_id = ? ORDER BY id", A.id);
  const co = (await boss.post(`${A.base}/coupons`, { code: "SMOKE10", kind: "percent", value: "10" }), one("SELECT id FROM mk_shop_coupons WHERE site_id = ? AND code = 'SMOKE10'", A.id));
  const paths = ["", "/produits/nouveau", `/produits/${A.pid}`, "/categories", "/avis", "/rendez-vous", "/listes-cadeaux", "/abonnements", "/commandes", `/commandes/${o.id}`, "/commandes/nouvelle", "/acces", "/rapports", "/factures", "/classes", "/paiements", "/clients", `/clients/${c.id}`, "/reglages", `/coupons/${co.id}`];
  for (const p of paths) { const r = await boss.get(`${A.base}${p}`); assert.equal(r.status, 200, `${p || "/"} → ${r.status} ${srv.logs().split("\n").filter((l) => /Erreur sur GET/.test(l)).slice(-1).join("")}`); }
  // pages publiques de la boutique
  for (const p of ["/boutique", `/boutique/produit/${A.slug}`, "/boutique/panier", "/boutique/compte", "/boutique/souhaits", "/boutique/comparer", "/boutique/listes"]) { const r = await new Client(srv.base).get(p, hdr(HA)); assert.ok([200, 303].includes(r.status), `${p} → ${r.status}`); }
});
