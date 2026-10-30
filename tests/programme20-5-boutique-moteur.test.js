// Programme 20.5 — moteur de boutique : calculs, produits, variantes, catalogue, panier, commande, stock, coupons, taxes, livraison, paiement, clients, ISOLATION entre boutiques.
// Base en mémoire avec les vraies migrations ; aucun réseau, aucune transaction réelle.
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const calc = require("../src/marketing/shop/calc");
const catalog = require("../src/marketing/shop/catalog");
const store = require("../src/marketing/shop/store");
const cart = require("../src/marketing/shop/cart");
const orders = require("../src/marketing/shop/orders");
const customers = require("../src/marketing/shop/customers");
const payments = require("../src/marketing/shop/payments");

const rejects = (fn, code) => assert.throws(fn, (e) => (code ? e.code === code : true), code);

describe("calculs purs", () => {
  test("la répartition d'une remise est exacte au centime", () => {
    const parts = calc.allocate(100, [3333, 3333, 3334]);
    assert.equal(parts.reduce((a, b) => a + b, 0), 100);
  });
  test("remise en pourcentage et fixe plafonnées à la base", () => {
    assert.equal(calc.couponAmount({ kind: "percent", value: 10 }, 1999), 200);
    assert.equal(calc.couponAmount({ kind: "fixed", value: 5000 }, 1000), 1000);
  });
  test("taxes comprises : la taxe est extraite, le total ne bouge pas", () => {
    const r = calc.computeTotals({ lines: [{ key: "a", unitCents: 1200, quantity: 1 }], shippingCents: 0, tax: { enabled: true, includesTax: true, lineRuleBp: 2000, ruleName: "TVA" } });
    assert.equal(r.total, 1200); assert.equal(r.tax, 200);
  });
  test("taxes en sus : la taxe s'ajoute", () => {
    const r = calc.computeTotals({ lines: [{ key: "a", unitCents: 1000, quantity: 1 }], shippingCents: 500, tax: { enabled: true, includesTax: false, lineRuleBp: 1000, shippingRuleBp: 1000, ruleName: "T" } });
    assert.equal(r.tax, 150); assert.equal(r.total, 1650);
  });
  test("sans règle fiscale aucune taxe n'est inventée", () => {
    const r = calc.computeTotals({ lines: [{ key: "a", unitCents: 1000, quantity: 2 }], tax: { enabled: false } });
    assert.equal(r.tax, 0); assert.equal(r.total, 2000);
  });
  test("règle de taxe : la plus précise gagne", () => {
    const rules = [{ id: 1, country: "*", rate_bp: 100 }, { id: 2, country: "FR", rate_bp: 2000 }, { id: 3, country: "FR", region: "Corse", rate_bp: 1000 }];
    assert.equal(calc.pickTaxRule(rules, "fr", "Corse").id, 3);
    assert.equal(calc.pickTaxRule(rules, "FR", "Bretagne").id, 2);
    assert.equal(calc.pickTaxRule(rules, "DE", "").id, 1);
  });
  test("zone de livraison : le pays listé l'emporte sur « tous les pays »", () => {
    const zones = [{ id: 1, position: 0, countries: [] }, { id: 2, position: 1, countries: ["FR"] }];
    assert.equal(calc.pickZone(zones, "FR").id, 2);
    assert.equal(calc.pickZone(zones, "BE").id, 1);
    assert.equal(calc.pickZone([{ id: 2, position: 0, countries: ["FR"] }], "BE"), null);
  });
});

describe("boutique", () => {
  let m, A, B, sA, sB, sMain;
  const mkScope = (organizationId, siteId) => ({ db: m.db, organizationId, siteId });
  before(() => {
    m = freshMarketing();
    m.db.prepare("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'Site A'), (1, 'Site B')").run();
    sA = mkScope(1, 1); sB = mkScope(1, 2); sMain = mkScope(1, null);
    for (const s of [sA, sB, sMain]) store.saveSettings(s, { enabled: 1, payment_methods: ["manual"], default_country: "FR", currency: "eur" });
    A = sA; B = sB;
  });

  test("produit simple : création, prix promotionnel, SKU unique par boutique", () => {
    const id = catalog.createProduct(A, { name: "Tasse bleue", price_cents: 1500, sale_price_cents: 1200, sku: "TASSE", status: "published", manage_stock: 1, stock_qty: 5, weight_grams: 300 });
    const p = catalog.productById(A, id);
    assert.equal(p.priceFromCents, 1200); assert.equal(p.regularFromCents, 1500); assert.equal(p.onSale, true);
    rejects(() => catalog.createProduct(A, { name: "Doublon", price_cents: 100, sku: "TASSE" }), "conflict");
    // le même SKU et le même nom sont permis dans une AUTRE boutique
    assert.ok(catalog.createProduct(B, { name: "Tasse bleue", price_cents: 900, sku: "TASSE", status: "published" }));
  });
  test("validations : promo >= prix, prix négatif, type non pris en charge", () => {
    rejects(() => catalog.createProduct(A, { name: "X", price_cents: 100, sale_price_cents: 100 }), "invalid_field");
    rejects(() => catalog.createProduct(A, { name: "X", price_cents: -5 }), "invalid_field");
    rejects(() => catalog.createProduct(A, { name: "X", price_cents: 100, type: "downloadable" }), "invalid_field");
    rejects(() => catalog.createProduct(A, { name: "X", price_cents: 100, type: "grouped" }), "invalid_field");
  });
  test("promotion hors période : le prix normal s'applique", () => {
    const id = catalog.createProduct(A, { name: "Promo finie", price_cents: 1000, sale_price_cents: 500, sale_ends_at: "2020-01-01", status: "published" });
    assert.equal(catalog.productById(A, id).priceFromCents, 1000);
  });
  test("produit variable : variantes, combinaison unique, prix et stock propres", () => {
    const id = catalog.createProduct(A, { name: "T-shirt", type: "variable", price_cents: 2000, status: "published", attributes: [{ name: "Taille", values: ["S", "M"] }] });
    const v1 = catalog.saveVariant(A, id, { options: { Taille: "S" }, stock_qty: 2, sku: "TS-S" });
    catalog.saveVariant(A, id, { options: { Taille: "M" }, price_cents: 2500, stock_qty: 0, sku: "TS-M" });
    rejects(() => catalog.saveVariant(A, id, { options: { Taille: "S" } }), "conflict");
    rejects(() => catalog.saveVariant(A, id, { options: { Taille: "XL" } }), "invalid_field");
    const p = catalog.productById(A, id);
    assert.equal(p.priceFromCents, 2000); assert.equal(p.inStock, true);
    assert.equal(p.variants.length, 2);
    assert.ok(v1);
  });
  test("catalogue : recherche, catégorie, prix, tri, pagination, stock — exécutés en base", () => {
    const cat = catalog.saveCategory(A, { name: "Maison" });
    const sub = catalog.saveCategory(A, { name: "Cuisine", parent_id: cat });
    for (let i = 1; i <= 15; i += 1) catalog.createProduct(A, { name: `Article ${i}`, price_cents: i * 100, status: "published", category_ids: [i % 2 ? sub : cat] });
    const all = catalog.catalogQuery(A, { perPage: 5, sort: "price_asc" });
    assert.ok(all.total >= 15); assert.equal(all.items.length, 5);
    assert.ok(all.items[0].priceFromCents <= all.items[4].priceFromCents);
    assert.equal(catalog.catalogQuery(A, { q: "Article 1" }).items.every((p) => /Article 1/.test(p.name)), true);
    const maison = catalog.catalogQuery(A, { category: "maison", perPage: 48 });
    assert.equal(maison.total, 15); // la catégorie parente inclut ses sous-catégories
    assert.equal(catalog.catalogQuery(A, { category: "cuisine", perPage: 48 }).total, 8);
    const cheap = catalog.catalogQuery(A, { category: "maison", maxPrice: 300, perPage: 48 });
    assert.deepEqual(cheap.items.map((p) => p.priceFromCents).sort((a, b) => a - b), [100, 200, 300]);
    assert.equal(catalog.catalogQuery(A, { onSale: 1 }).items.every((p) => p.onSale), true);
    assert.equal(catalog.catalogQuery(A, { q: "%" }).total, 0); // les jokers sont neutralisés
    assert.equal(catalog.catalogQuery(A, { category: "inconnue" }).total, 0);
  });
  test("catalogue : les produits d'une autre boutique, brouillons et supprimés n'apparaissent jamais", () => {
    const draft = catalog.createProduct(A, { name: "Brouillon secret", price_cents: 100 });
    const gone = catalog.createProduct(A, { name: "Supprimé", price_cents: 100, status: "published" });
    catalog.deleteProduct(A, gone);
    const names = catalog.catalogQuery(A, { perPage: 48, q: "" }).items.map((p) => p.name);
    assert.ok(!names.includes("Brouillon secret")); assert.ok(!names.includes("Supprimé"));
    assert.equal(catalog.catalogQuery(B, { q: "Article" }).total, 0);
    assert.equal(catalog.catalogQuery(sMain, { q: "Tasse" }).total, 0);
    assert.equal(catalog.getProduct(B, draft), null); // lecture croisée par identifiant
    rejects(() => catalog.updateProduct(B, draft, { name: "pirate" }), "not_found");
    rejects(() => catalog.deleteProduct(B, draft), "not_found");
  });

  describe("panier et commande", () => {
    let prod, varProd, vS, c;
    before(() => {
      prod = catalog.createProduct(A, { name: "Lampe", price_cents: 4000, status: "published", manage_stock: 1, stock_qty: 200, weight_grams: 1000 });
      varProd = catalog.createProduct(A, { name: "Veste", type: "variable", price_cents: 8000, status: "published", attributes: [{ name: "Taille", values: ["S", "L"] }] });
      vS = catalog.saveVariant(A, varProd, { options: { Taille: "S" }, stock_qty: 1 });
      catalog.saveVariant(A, varProd, { options: { Taille: "L" }, stock_qty: 0 });
      const z = store.saveZone(A, { name: "France", countries: "FR" });
      store.saveMethod(A, z, { name: "Colissimo", kind: "flat", cost_cents: 590 });
      store.saveMethod(A, z, { name: "Offerte dès 100 €", kind: "free_over", cost_cents: 590, min_subtotal_cents: 10000 });
      store.saveTaxRule(A, { name: "TVA", country: "FR", rate_bp: 2000, applies_to_shipping: 1 });
      store.saveSettings(A, { tax_enabled: 1, prices_include_tax: 1 });
    });
    const fresh = () => { const k = cart.createCart(A); return { token: k.token, row: () => cart.findCart(A, k.token) }; };
    const dest = { country: "FR" };

    test("ajout, fusion des doublons, quantités et variantes validées", () => {
      const k = fresh();
      cart.addItem(A, k.row(), { productId: prod, quantity: 1 });
      cart.addItem(A, k.row(), { productId: prod, quantity: 1 });
      assert.equal(cart.priceCart(A, k.row(), { dest }).lines[0].quantity, 2);
      rejects(() => cart.addItem(A, k.row(), { productId: prod, quantity: 0 }), "invalid_field");
      rejects(() => cart.addItem(A, k.row(), { productId: prod, quantity: 1000 }), "invalid_field");
      const rare = catalog.createProduct(A, { name: "Rare", price_cents: 100, status: "published", manage_stock: 1, stock_qty: 3 });
      rejects(() => cart.addItem(A, k.row(), { productId: rare, quantity: 5 }), "stock");
      rejects(() => cart.addItem(A, k.row(), { productId: varProd, quantity: 1 }), "invalid_field"); // variante obligatoire
      rejects(() => cart.addItem(A, k.row(), { productId: prod, variantId: vS, quantity: 1 }), "invalid_field");
      rejects(() => cart.addItem(A, k.row(), { productId: varProd, variantId: 99999, quantity: 1 }), "invalid_field");
    });
    test("variante en rupture : refusée", () => {
      const k = fresh();
      const L = catalog.listVariants(A, varProd).find((v) => v.options.Taille === "L");
      rejects(() => cart.addItem(A, k.row(), { productId: varProd, variantId: L.id, quantity: 1 }), "stock");
    });
    test("les prix viennent du serveur : totaux, taxes comprises, livraison, remise", () => {
      const k = fresh();
      cart.addItem(A, k.row(), { productId: prod, quantity: 2 });
      const p = cart.priceCart(A, k.row(), { dest });
      assert.equal(p.totals.subtotal, 8000);
      assert.equal(p.shipping.options.length, 1); // « offerte dès 100 € » n'est pas atteinte : 590
      assert.equal(p.shipping.options[0].costCents, 590);
      assert.equal(p.totals.total, 8000 + 590);
      assert.equal(p.totals.tax, Math.round(8000 * 2000 / 12000) + Math.round(590 * 2000 / 12000));
      cart.addItem(A, k.row(), { productId: varProd, variantId: vS, quantity: 1 });
      const q = cart.priceCart(A, k.row(), { dest });
      assert.ok(q.shipping.options.some((o) => o.costCents === 0)); // 160 € : livraison offerte disponible
    });
    test("modifications concurrentes détectées par la version", () => {
      const k = fresh();
      const v0 = k.row().version;
      cart.addItem(A, k.row(), { productId: prod, quantity: 1 });
      rejects(() => cart.addItem(A, k.row(), { productId: prod, quantity: 1, expectedVersion: v0 }), "conflict");
    });
    test("produit retiré de la vente : signalé, commande impossible", () => {
      const k = fresh();
      const tmp = catalog.createProduct(A, { name: "Éphémère", price_cents: 500, status: "published" });
      cart.addItem(A, k.row(), { productId: tmp, quantity: 1 });
      catalog.updateProduct(A, tmp, { status: "draft" });
      const p = cart.priceCart(A, k.row(), { dest });
      assert.equal(p.canCheckout, false); assert.equal(p.issues[0].kind, "unavailable");
    });
    test("un jeton de panier d'une autre boutique est inconnu", () => {
      const k = fresh();
      assert.equal(cart.findCart(B, k.token), null);
      assert.equal(cart.findCart(sMain, k.token), null);
      assert.equal(cart.findCart(A, "x".repeat(64)), null);
    });

    const base = (over = {}) => ({ email: "client@example.test", paymentMethod: "manual", shipping: { name: "Ada", line1: "1 rue X", postal_code: "75001", city: "Paris", country: "FR" }, shippingMethodId: null, ...over });
    test("commande : totaux serveur, stock réservé, historique, panier converti", () => {
      const k = fresh();
      cart.addItem(A, k.row(), { productId: prod, quantity: 2 });
      const before = catalog.getProduct(A, prod).stock_qty;
      const { order, duplicate } = orders.createFromCart(A, k.row(), base({ expectedTotalCents: 8590 }));
      assert.equal(duplicate, false);
      assert.equal(order.total_cents, 8590); assert.equal(order.status, "pending"); assert.equal(order.payment_status, "unpaid");
      assert.equal(catalog.getProduct(A, prod).stock_qty, before - 2);
      assert.equal(orders.orderDetail(A, order).events[0].kind, "created");
      assert.equal(cart.findCart(A, k.token), null); // converti
    });
    test("double soumission : même commande, stock décompté une seule fois", () => {
      const k = fresh();
      cart.addItem(A, k.row(), { productId: prod, quantity: 1 });
      const before = catalog.getProduct(A, prod).stock_qty;
      const row = k.row();
      const first = orders.createFromCart(A, row, base({ idempotencyKey: "abc" }));
      const second = orders.createFromCart(A, row, base({ idempotencyKey: "abc" }));
      const third = orders.createFromCart(A, row, base({ idempotencyKey: "autre" }));
      assert.equal(second.duplicate, true); assert.equal(third.duplicate, true);
      assert.equal(second.order.id, first.order.id);
      assert.equal(catalog.getProduct(A, prod).stock_qty, before - 1);
    });
    test("total affiché périmé : refusé, rien n'est écrit", () => {
      const k = fresh();
      cart.addItem(A, k.row(), { productId: prod, quantity: 1 });
      const n = m.db.prepare("SELECT COUNT(*) AS n FROM mk_shop_orders").get().n;
      const before = catalog.getProduct(A, prod).stock_qty;
      rejects(() => orders.createFromCart(A, k.row(), base({ expectedTotalCents: 1 })), "price_changed");
      assert.equal(m.db.prepare("SELECT COUNT(*) AS n FROM mk_shop_orders").get().n, n);
      assert.equal(catalog.getProduct(A, prod).stock_qty, before);
      assert.equal(k.row().status, "open");
    });
    test("dernier article : un seul acheteur gagne, l'autre est refusé sans commande", () => {
      const solo = catalog.createProduct(A, { name: "Pièce unique", price_cents: 1000, status: "published", manage_stock: 1, stock_qty: 1, requires_shipping: 0 });
      const k1 = fresh(); const k2 = fresh();
      cart.addItem(A, k1.row(), { productId: solo, quantity: 1 });
      cart.addItem(A, k2.row(), { productId: solo, quantity: 1 });
      orders.createFromCart(A, k1.row(), base({ shipping: {} }));
      rejects(() => orders.createFromCart(A, k2.row(), base({ shipping: {} })), "stock");
      assert.equal(catalog.getProduct(A, solo).stock_qty, 0);
      assert.equal(k2.row().status, "open");
    });
    test("produit numérique : aucune livraison exigée", () => {
      const d = catalog.createProduct(A, { name: "Guide PDF", type: "digital", price_cents: 900, status: "published" });
      const k = fresh();
      cart.addItem(A, k.row(), { productId: d, quantity: 1 });
      const p = cart.priceCart(A, k.row(), { dest });
      assert.equal(p.shipping.required, false);
      const { order } = orders.createFromCart(A, k.row(), base({ shipping: {} }));
      assert.equal(order.shipping_cents, 0);
    });
    test("livraison hors zone et méthode falsifiée refusées", () => {
      const k = fresh();
      cart.addItem(A, k.row(), { productId: prod, quantity: 1 });
      rejects(() => orders.createFromCart(A, k.row(), base({ shipping: { name: "X", line1: "1", postal_code: "1", city: "Y", country: "JP" } })), "invalid_field");
      rejects(() => orders.createFromCart(A, k.row(), base({ shippingMethodId: 987654 })), "invalid_field");
    });
    test("moyen de paiement non proposé refusé ; boutique fermée refusée", () => {
      const k = fresh();
      cart.addItem(A, k.row(), { productId: prod, quantity: 1 });
      rejects(() => orders.createFromCart(A, k.row(), base({ paymentMethod: "stripe" })), "invalid_field");
      store.saveSettings(A, { enabled: 0 });
      rejects(() => orders.createFromCart(A, k.row(), base()), "shop_closed");
      store.saveSettings(A, { enabled: 1 });
    });
    test("coupon : pourcentage, minimum, expiration, limite, restriction produit, une seule utilisation décomptée", () => {
      store.saveCoupon(A, { code: "MOINS10", kind: "percent", value: 10, max_uses: 1 });
      store.saveCoupon(A, { code: "GROS", kind: "fixed", value: 500, min_subtotal_cents: 100000 });
      store.saveCoupon(A, { code: "VIEUX", kind: "percent", value: 10, ends_at: "2020-01-01" });
      store.saveCoupon(A, { code: "AUTRE", kind: "percent", value: 10, product_ids: [varProd] });
      const k = fresh();
      cart.addItem(A, k.row(), { productId: prod, quantity: 1 });
      const tryCode = (code) => { cart.setCoupon(A, k.row(), code); return cart.priceCart(A, k.row(), { dest }); };
      assert.ok(tryCode("GROS").couponError); assert.ok(tryCode("VIEUX").couponError); assert.ok(tryCode("AUTRE").couponError); assert.ok(tryCode("INCONNU").couponError);
      const ok = tryCode("moins10");
      assert.equal(ok.couponError, null); assert.equal(ok.totals.discount, 400);
      const { order } = orders.createFromCart(A, k.row(), base());
      assert.equal(order.discount_cents, 400);
      assert.equal(store.couponByCode(A, "MOINS10").used_count, 1);
      const k2 = fresh();
      cart.addItem(A, k2.row(), { productId: prod, quantity: 1 });
      cart.setCoupon(A, k2.row(), "MOINS10");
      assert.match(cart.priceCart(A, k2.row(), { dest }).couponError, /limite/);
      // annulation : le coupon est rendu
      orders.cancelOrder(A, order.id, { actor: "test" });
      assert.equal(store.couponByCode(A, "MOINS10").used_count, 0);
    });
    test("un coupon d'une boutique est inconnu dans une autre", () => {
      assert.equal(store.couponByCode(B, "MOINS10"), null);
      assert.equal(store.couponByCode(sMain, "GROS"), null);
    });

    describe("paiement et cycle de vie", () => {
      const place = (qty = 1, over = {}) => { const k = fresh(); cart.addItem(A, k.row(), { productId: prod, quantity: qty }); return orders.createFromCart(A, k.row(), base(over)).order; };
      test("une commande n'est jamais payée à la création ; la confirmation exige le bon montant", () => {
        const o = place();
        assert.equal(o.payment_status, "unpaid");
        const bad = orders.markPaid(A, o.id, { provider: "stripe", providerRef: "cs_1", amountCents: o.total_cents - 1, currency: "eur" });
        assert.equal(bad.status, "mismatch");
        assert.equal(orders.getOrder(A, o.id).status, "pending");
        const wrongCur = orders.markPaid(A, o.id, { provider: "stripe", providerRef: "cs_1", amountCents: o.total_cents, currency: "usd" });
        assert.equal(wrongCur.status, "mismatch");
        const good = orders.markPaid(A, o.id, { provider: "stripe", providerRef: "cs_1", amountCents: o.total_cents, currency: "eur" });
        assert.equal(good.status, "paid");
        assert.equal(orders.markPaid(A, o.id, { provider: "stripe", providerRef: "cs_1", amountCents: o.total_cents, currency: "eur" }).status, "already");
      });
      test("transitions : règles métier, paiement manuel réservé aux personnes autorisées", () => {
        const o = place();
        rejects(() => orders.changeStatus(A, o.id, "shipped", { actor: "u:1" }), "invalid_transition");
        rejects(() => orders.changeStatus(A, o.id, "paid", { actor: "u:1" }), "forbidden");
        assert.equal(orders.changeStatus(A, o.id, "paid", { actor: "u:1", canMarkPaid: true }).status, "paid");
        assert.equal(orders.changeStatus(A, o.id, "processing", { actor: "u:1" }).status, "processing");
        assert.equal(orders.changeStatus(A, o.id, "shipped", { actor: "u:1", tracking: "TRK1" }).tracking_number, "TRK1");
        assert.equal(orders.changeStatus(A, o.id, "completed", { actor: "u:1" }).status, "completed");
        rejects(() => orders.changeStatus(A, o.id, "cancelled", { actor: "u:1" }), "invalid_transition");
        const kinds = orders.orderDetail(A, orders.getOrder(A, o.id)).events.map((e) => e.to_status).filter(Boolean);
        assert.deepEqual(kinds, ["pending", "paid", "processing", "shipped", "completed"]);
      });
      test("une commande par carte ne peut pas être « marquée payée » à la main", () => {
        store.saveSettings(A, { payment_methods: ["manual", "stripe"] });
        const o = place(1, { paymentMethod: "stripe" });
        rejects(() => orders.changeStatus(A, o.id, "paid", { actor: "u:1", canMarkPaid: true }), "invalid_transition");
        store.saveSettings(A, { payment_methods: ["manual"] });
      });
      test("annulation : le stock est rendu une seule fois", () => {
        const before = catalog.getProduct(A, prod).stock_qty;
        const o = place(2);
        assert.equal(catalog.getProduct(A, prod).stock_qty, before - 2);
        orders.cancelOrder(A, o.id, { actor: "u:1" });
        assert.equal(catalog.getProduct(A, prod).stock_qty, before);
        rejects(() => orders.cancelOrder(A, o.id, { actor: "u:1" }), "invalid_transition");
        assert.equal(catalog.getProduct(A, prod).stock_qty, before);
      });
      test("paiement échoué : commande en échec, annulation et stock rendu sur demande", () => {
        const before = catalog.getProduct(A, prod).stock_qty;
        const o = place();
        orders.markPaymentFailed(A, o.id, { provider: "stripe", providerRef: null, reason: "refusé" });
        assert.equal(orders.getOrder(A, o.id).payment_status, "failed");
        orders.markPaymentFailed(A, o.id, { provider: "stripe", providerRef: null, reason: "expiré", cancel: true });
        assert.equal(orders.getOrder(A, o.id).status, "cancelled");
        assert.equal(catalog.getProduct(A, prod).stock_qty, before);
      });
      test("confirmation tardive après annulation : commande rétablie, stock repris", () => {
        const o = place();
        orders.cancelOrder(A, o.id, { actor: "system" });
        const r = orders.markPaid(A, o.id, { provider: "stripe", providerRef: "cs_late", amountCents: o.total_cents, currency: "eur" });
        assert.equal(r.status, "paid"); assert.equal(r.late, true);
        assert.match(orders.orderDetail(A, orders.getOrder(A, o.id)).events.at(-1).note, /tardive/);
      });
      test("commandes en attente trop anciennes : annulées par expireStale (paiement carte seulement)", () => {
        store.saveSettings(A, { payment_methods: ["manual", "stripe"] });
        const o = place(1, { paymentMethod: "stripe" });
        const man = place(1, { paymentMethod: "manual" });
        m.db.prepare("UPDATE mk_shop_orders SET created_at = datetime('now','-3 hours') WHERE id IN (?,?)").run(o.id, man.id);
        orders.expireStale(A, 60);
        assert.equal(orders.getOrder(A, o.id).status, "cancelled");
        assert.equal(orders.getOrder(A, man.id).status, "pending");
        store.saveSettings(A, { payment_methods: ["manual"] });
      });
      test("webhook Stripe : événement dupliqué ignoré, montant vérifié, remboursement total pris en compte", () => {
        store.saveSettings(A, { payment_methods: ["manual", "stripe"] });
        const o = place(1, { paymentMethod: "stripe" });
        orders.recordPaymentAttempt(A, o, "stripe", "cs_wh1");
        const evt = (id, type, obj) => ({ id, type, data: { object: obj } });
        const session = { id: "cs_wh1", client_reference_id: `shop:${o.id}`, payment_status: "paid", amount_total: o.total_cents, currency: "eur", payment_intent: "pi_wh1" };
        const r1 = payments.handleStripeEvent(m.db, evt("evt_1", "checkout.session.completed", session));
        assert.equal(r1.result.status, "paid");
        assert.equal(payments.handleStripeEvent(m.db, evt("evt_1", "checkout.session.completed", session)).duplicate, true);
        assert.equal(payments.handleStripeEvent(m.db, evt("evt_2", "checkout.session.completed", session)).result.status, "already");
        assert.equal(payments.handleStripeEvent(m.db, evt("evt_x", "checkout.session.completed", { ...session, client_reference_id: "pas-une-boutique" })).handled, false);
        payments.handleStripeEvent(m.db, evt("evt_3", "charge.refunded", { payment_intent: "pi_wh1", amount_refunded: o.total_cents }));
        assert.equal(orders.getOrder(A, o.id).status, "refunded");
        store.saveSettings(A, { payment_methods: ["manual"] });
      });
      test("webhook : montant falsifié → commande NON payée", () => {
        store.saveSettings(A, { payment_methods: ["manual", "stripe"] });
        const o = place(1, { paymentMethod: "stripe" });
        orders.recordPaymentAttempt(A, o, "stripe", "cs_wh2");
        const r = payments.handleStripeEvent(m.db, { id: "evt_m", type: "checkout.session.completed", data: { object: { id: "cs_wh2", client_reference_id: `shop:${o.id}`, payment_status: "paid", amount_total: 1, currency: "eur" } } });
        assert.equal(r.result.status, "mismatch");
        assert.notEqual(orders.getOrder(A, o.id).payment_status, "paid");
        store.saveSettings(A, { payment_methods: ["manual"] });
      });
    });

    describe("isolation des commandes et des clients", () => {
      test("commandes et clients invisibles depuis une autre boutique ou le site principal", () => {
        const k = fresh();
        cart.addItem(A, k.row(), { productId: prod, quantity: 1 });
        const { order } = orders.createFromCart(A, k.row(), base({ customerId: customers.ensureGuest(A, "iso@example.test", "Iso") }));
        assert.equal(orders.getOrder(B, order.id), null);
        assert.equal(orders.getOrder(sMain, order.id), null);
        assert.equal(orders.orderByNumber(B, order.number), null);
        assert.equal(orders.listOrders(B).total, 0);
        rejects(() => orders.changeStatus(B, order.id, "cancelled", { actor: "x" }), "not_found");
        rejects(() => orders.cancelOrder(B, order.id, { actor: "x" }), "not_found");
        assert.equal(customers.byEmail(B, "iso@example.test"), null);
        assert.equal(customers.listCustomers(B).total, 0);
        // autre organisation, même identifiant de site
        assert.equal(orders.getOrder(mkScope(2, 1), order.id), null);
      });
      test("un jeton de session client d'une boutique ne vaut rien dans une autre", () => {
        customers.register(A, { email: "cli@example.test", password: "motdepasse-long-1", name: "Cli" });
        customers.register(B, { email: "cli@example.test", password: "autre-mot-de-passe-2", name: "Cli B" });
        const { token } = customers.login(A, "cli@example.test", "motdepasse-long-1");
        assert.ok(customers.fromSession(A, token));
        assert.equal(customers.fromSession(B, token), null);
        assert.equal(customers.fromSession(sMain, token), null);
        rejects(() => customers.login(B, "cli@example.test", "motdepasse-long-1"), "auth"); // mot de passe de A refusé chez B
      });
      test("compte client : mot de passe court refusé, doublon refusé, réinitialisation à usage unique", () => {
        rejects(() => customers.register(A, { email: "court@example.test", password: "abc" }), "invalid_field");
        rejects(() => customers.register(A, { email: "cli@example.test", password: "motdepasse-long-1" }), "conflict");
        const { token } = customers.login(A, "cli@example.test", "motdepasse-long-1");
        const r = customers.requestReset(A, "cli@example.test");
        assert.equal(customers.requestReset(A, "inconnu@example.test"), null);
        customers.resetPassword(A, r.token, "nouveau-mot-de-passe-3");
        rejects(() => customers.resetPassword(A, r.token, "encore-un-autre-4"), "invalid_token");
        assert.equal(customers.fromSession(A, token), null); // anciennes sessions fermées
        assert.ok(customers.login(A, "cli@example.test", "nouveau-mot-de-passe-3"));
      });
    });
  });

  test("boutique principale (site NULL) et boutiques de sites ne partagent aucune donnée", () => {
    const id = catalog.createProduct(sMain, { name: "Produit principal", price_cents: 100, status: "published" });
    assert.equal(catalog.catalogQuery(A, { q: "Produit principal" }).total, 0);
    assert.equal(catalog.catalogQuery(sMain, { q: "Produit principal" }).total, 1);
    assert.equal(catalog.getProduct(A, id), null);
  });

  test("un moyen de paiement activé mais non configuré n'est jamais proposé (clés absentes)", () => {
    const saved = { k: process.env.STRIPE_SECRET_KEY, w: process.env.STRIPE_WEBHOOK_SECRET };
    delete process.env.STRIPE_SECRET_KEY; delete process.env.STRIPE_WEBHOOK_SECRET;
    try {
      assert.deepEqual(payments.available({ payment_methods: ["stripe", "manual"] }), ["manual"]);
      assert.equal(payments.status({ payment_methods: ["stripe"] }).find((p) => p.key === "stripe").configured, false);
      process.env.STRIPE_SECRET_KEY = "sk_test_x"; process.env.STRIPE_WEBHOOK_SECRET = "whsec_x";
      assert.deepEqual(payments.available({ payment_methods: ["stripe", "manual"] }), ["stripe", "manual"]);
    } finally { if (saved.k === undefined) delete process.env.STRIPE_SECRET_KEY; else process.env.STRIPE_SECRET_KEY = saved.k; if (saved.w === undefined) delete process.env.STRIPE_WEBHOOK_SECRET; else process.env.STRIPE_WEBHOOK_SECRET = saved.w; }
  });
});
