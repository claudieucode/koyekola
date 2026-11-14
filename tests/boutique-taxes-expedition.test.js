// Classes de taxe, exonération, codes postaux, classes d'expédition (calculs purs + VRAI serveur).
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const calc = require("../src/marketing/shop/calc");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

describe("calculs purs", () => {
  test("codes postaux : motifs, intervalles, jokers", () => {
    assert.equal(calc.postcodeMatches("75*", "75008"), true);
    assert.equal(calc.postcodeMatches("75*", "69001"), false);
    assert.equal(calc.postcodeMatches("13000-13999", "13500"), true);
    assert.equal(calc.postcodeMatches("13000-13999", "14000"), false);
    assert.equal(calc.postcodeMatches("", "x"), true);
    assert.equal(calc.postcodeMatches("75*", ""), false);
  });
  test("règle de taxe : la classe, puis le code postal, puis le pays", () => {
    const rules = [{ id: 1, country: "FR", rate_bp: 2000, tax_class_id: null }, { id: 2, country: "FR", rate_bp: 550, tax_class_id: 7 }, { id: 3, country: "FR", rate_bp: 800, tax_class_id: null, postcode: "20*" }];
    assert.equal(calc.pickTaxRule(rules, "FR", "", "75001", null).id, 1);
    assert.equal(calc.pickTaxRule(rules, "FR", "", "75001", 7).id, 2);
    assert.equal(calc.pickTaxRule(rules, "FR", "", "20000", null).id, 3, "le code postal l'emporte");
    assert.equal(calc.pickTaxRule(rules, "FR", "", "75001", 99), null, "classe sans règle : aucune taxe inventée");
  });
  test("zone : un code postal précis l'emporte ; une zone limitée ne s'applique pas hors de ses codes", () => {
    const zones = [{ id: 1, position: 0, countries: ["FR"], postcodes: "" }, { id: 2, position: 1, countries: ["FR"], postcodes: "20*" }];
    assert.equal(calc.pickZone(zones, "FR", "20100").id, 2);
    assert.equal(calc.pickZone(zones, "FR", "75001").id, 1);
    assert.equal(calc.pickZone([zones[1]], "FR", "75001"), null);
  });
  test("livraison : supplément par classe ajouté une fois par classe ; « gratuite dès » reste gratuite", () => {
    const m = [{ id: 1, name: "Colis", kind: "flat", cost_cents: 500, active: 1, class_costs: { 5: 300 } }, { id: 2, name: "Offert", kind: "free_over", cost_cents: 0, min_subtotal_cents: 1000, active: 1, class_costs: { 5: 300 } }];
    const o = calc.shippingOptions(m, { subtotalCents: 2000, weightGrams: 0, classIds: [5, 5, 9] });
    assert.equal(o.find((x) => x.id === 1).costCents, 800); assert.equal(o.find((x) => x.id === 2).costCents, 0);
  });
  test("taxe par ligne et client exonéré (prix TTC : la taxe contenue est retirée)", () => {
    const lines = [{ key: "a", unitCents: 1200, quantity: 1, taxBp: 2000, taxName: "TVA" }, { key: "b", unitCents: 1055, quantity: 1, taxBp: 550, taxName: "Réduite" }];
    const t = calc.computeTotals({ lines, shippingCents: 0, tax: { enabled: true, includesTax: true } });
    assert.equal(t.tax, 255); assert.equal(t.total, 2255);
    const e = calc.computeTotals({ lines, shippingCents: 0, tax: { enabled: true, includesTax: true, exempt: true } });
    assert.equal(e.tax, 0); assert.equal(e.total, 2255 - 255);
  });
});

const UA = "Mozilla/5.0 (test)"; const H = "www.tax-un.example"; const hh = { headers: { "x-forwarded-host": H, "User-Agent": UA } };
let srv, boss, db, S, pStd, pRed;
const one = (sql, ...a) => db.prepare(sql).get(...a);
describe("serveur", () => {
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const id = Number(String((await boss.post("/marketing/site-web/sites", { name: "Taxes" })).location).match(/sites\/(\d+)/)[1]);
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${id}/reglages.json`)).text);
    await boss.request(`/marketing/site-web/sites/${id}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${H}` } } } });
    const base = `/marketing/site-web/sites/${id}/boutique`; S = { id, base };
    await boss.post(`/marketing/site-web/sites/${id}/modules/commerce`, { etat: "activer" });
    await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" });
    const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", id).id; S.zid = zid;
    await boss.post(`${base}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,00" });
    await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", tax_enabled: "1", prices_include_tax: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "T", manual_instructions: "Virement" });
    await boss.post(`${base}/produits`, { name: "Standard", type: "simple", status: "published", price: "12,00", requires_shipping: "1" });
    await boss.post(`${base}/produits`, { name: "Livre", type: "simple", status: "published", price: "10,55", requires_shipping: "1" });
    pStd = one("SELECT id FROM mk_shop_products WHERE site_id = ? AND name = 'Standard'", id).id; pRed = one("SELECT id FROM mk_shop_products WHERE site_id = ? AND name = 'Livre'", id).id;
    assert.equal((await boss.post(`${base}/classes/tax`, { name: "Réduit" })).status, 302);
    assert.equal((await boss.post(`${base}/classes/shipping`, { name: "Encombrant" })).status, 302);
    S.tc = one("SELECT id FROM mk_shop_tax_classes WHERE site_id = ?", id).id; S.sc = one("SELECT id FROM mk_shop_shipping_classes WHERE site_id = ?", id).id;
    await boss.post(`${base}/taxes`, { name: "TVA", country: "FR", rate: "20" });
    await boss.post(`${base}/taxes`, { name: "TVA réduite", country: "FR", rate: "5,5", tax_class_id: String(S.tc) });
    await boss.post(`${base}/produits/${pRed}/classes`, { tax_class_id: String(S.tc), shipping_class_id: String(S.sc) });
    const mid = one("SELECT id FROM mk_shop_shipping_methods WHERE site_id = ?", id).id;
    await boss.post(`${base}/livraison/methodes/${mid}/classes`, { class_id: String(S.sc), cost: "3,00" });
  });
  after(async () => { db.close(); await srv.stop(); });

  async function order(cli, ids, email = "c@example.test", postal = "75001") {
    for (const p of ids) await cli.post("/boutique/panier/ajouter", { product_id: String(p), quantity: "1" }, hh);
    const page = await cli.get(`/boutique/commande?pays=FR`, hh);
    const f = (n) => (page.text.match(new RegExp(`name="${n}" value="([^"]+)"`)) || assert.fail(`champ ${n}`))[1];
    const r = await cli.post("/boutique/commande", { email, ship_name: "Ada", ship_line1: "1 rue", ship_postal_code: postal, ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: f("idempotency_key"), shipping_method: f("shipping_method"), payment_method: "manual", expected_total: f("expected_total") }, hh);
    assert.equal(r.status, 303, String(r.text).slice(0, 300));
    return one("SELECT * FROM mk_shop_orders WHERE site_id = ? ORDER BY id DESC", S.id);
  }
  test("deux taux sur une même commande, supplément de classe d'expédition, taxes par ligne", async () => {
    const o = await order(new Client(srv.base), [pStd, pRed]);
    assert.equal(o.tax_cents, 255);
    assert.equal(o.shipping_cents, 800, "5,00 + 3,00 de supplément « Encombrant »");
    assert.equal(o.total_cents, 2255 + 800);
    const lines = JSON.parse(o.tax_lines); assert.equal(lines.length, 2);
  });
  test("sans produit de la classe : pas de supplément", async () => {
    const o = await order(new Client(srv.base), [pStd]);
    assert.equal(o.shipping_cents, 500); assert.equal(o.tax_cents, 200);
  });
  test("client connecté exonéré : taxe retirée ; un invité qui tape son e-mail n'est jamais exonéré", async () => {
    const cli = new Client(srv.base);
    assert.equal((await cli.post("/boutique/compte/inscription", { email: "pro@example.test", password: "motdepasse-solide", name: "Pro" }, hh)).status, 303);
    const cid = one("SELECT id FROM mk_shop_customers WHERE site_id = ? AND email = 'pro@example.test'", S.id).id;
    await boss.post(`${S.base}/clients/${cid}/exoneration`, { exempt: "1" });
    const guest = await order(new Client(srv.base), [pStd], "pro@example.test");
    assert.equal(guest.tax_cents, 200, "l'invité paie la taxe");
    const o = await order(cli, [pStd], "pro@example.test");
    assert.equal(o.tax_cents, 0); assert.equal(o.total_cents, 1200 - 200 + 500);
  });
  test("zone limitée à des codes postaux : hors de ces codes, pas de livraison", async () => {
    await boss.post(`${S.base}/livraison/zones/${S.zid}/postcodes`, { postcodes: "20*" });
    const cli = new Client(srv.base); await cli.post("/boutique/panier/ajouter", { product_id: String(pStd), quantity: "1" }, hh);
    const page = await cli.get("/boutique/commande?pays=FR", hh);
    assert.doesNotMatch(page.text, /name="shipping_method" value="\d+"/);
    assert.equal((await boss.post(`${S.base}/livraison/zones/${S.zid}/postcodes`, { postcodes: "20*, @@@" })).status, 302);
    assert.equal(one("SELECT postcodes FROM mk_shop_shipping_zones WHERE id = ?", S.zid).postcodes, "20*", "motif invalide refusé, valeur précédente conservée");
  });
});
