// Parité Elementor, lot 2 (22.8) : source « Produits » du moteur de requêtes (boucle, liste dynamique, produits apparentés).
// Base en mémoire avec les vraies migrations ; mêmes données que la boutique publique ; isolation par site et par ouverture de la boutique.
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const catalog = require("../src/marketing/shop/catalog");
const store = require("../src/marketing/shop/store");
const modules = require("../src/marketing/siteModules");
const query = require("../src/marketing/pages/query");
const nodes = require("../src/marketing/pages/nodes");

describe("22.8 lot 2 · source « Produits »", () => {
  let m, A, B, ctx, catMaison, catCuisine;
  const ids = [];
  const run = (q, env = {}) => query.runQuery(ctx, { source: "products", ...q }, { scope: { page: { site_id: 1 } }, ...env });
  before(() => {
    m = freshMarketing(); ctx = m.A;
    m.db.prepare("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'Site A'), (1, 'Site B')").run();
    A = { db: m.db, organizationId: 1, siteId: 1 }; B = { db: m.db, organizationId: 1, siteId: 2 };
    for (const s of [A, B]) { store.saveSettings(s, { enabled: 1, payment_methods: ["manual"], default_country: "FR", currency: "eur" }); modules.setEnabled(ctx, s.siteId, "commerce", true); }
    catMaison = catalog.saveCategory(A, { name: "Maison" });
    catCuisine = catalog.saveCategory(A, { name: "Cuisine", parent_id: catMaison });
    const mk = (s, name, price, extra = {}) => catalog.createProduct(s, { name, price_cents: price, status: "published", ...extra });
    ids.push(mk(A, "Tasse bleue", 1500, { sale_price_cents: 1200 }), mk(A, "Bol vert", 900), mk(A, "Plateau chêne", 4500), mk(A, "Brouillon", 100, { status: "draft" }), mk(B, "Produit du site B", 700));
    catalog.setProductCategories(A, ids[0], [catCuisine]); catalog.setProductCategories(A, ids[1], [catCuisine]); catalog.setProductCategories(A, ids[2], [catMaison]);
  });

  test("la source existe, est déclarée dans le catalogue de l'éditeur et acceptée par la boucle", () => {
    assert.ok(query.SOURCES.has("products"));
    assert.equal(query.catalog().find((x) => x.key === "products").scopeKey, "product");
    const h = { linkUrl: (v) => v || "", imageUrl: (v) => v || "" };
    const loop = nodes.NODE_TYPES.grid.props({ loop: { source: "products", count: 3, sort: "price" } }, "t", h).loop;
    assert.deepEqual([loop.source, loop.count, loop.sort, loop.empty], ["products", 3, "price", "Aucun produit ne correspond."]);
    assert.equal(nodes.NODE_TYPES.grid.props({ loop: { source: "inconnue" } }, "t", h).loop.source, "posts", "une source inconnue retombe sur les articles");
  });

  test("seuls les produits PUBLIÉS de CE site sont listés (ni brouillon, ni autre site) ; forme identique aux étiquettes {{product.*}}", () => {
    const r = run({ count: 12, orderby: "id", order: "asc" });
    assert.deepEqual(r.items.map((x) => x.title), ["Tasse bleue", "Bol vert", "Plateau chêne"]);
    assert.equal(r.total, 3);
    const t = r.items[0];
    assert.match(t.url, /^\/boutique\/produit\/tasse-bleue/);
    assert.equal(t.priceCents, 1200); assert.ok(t.regularCents === 1500 && /12/.test(t.priceLabel));
    assert.equal(run({ count: 12 }, { scope: { page: { site_id: 2 } } }).items.map((x) => x.title).join(), "Produit du site B");
  });

  test("tri par prix, pagination (nombre et décalage) et recherche", () => {
    assert.deepEqual(run({ count: 12, orderby: "price", order: "asc" }).items.map((x) => x.title), ["Bol vert", "Tasse bleue", "Plateau chêne"]);
    const p2 = run({ count: 2, orderby: "id", order: "asc", pagination: "numbers" }, { pageNo: 2 });
    assert.deepEqual(p2.items.map((x) => x.title), ["Plateau chêne"]); assert.equal(p2.pages, 2);
    assert.deepEqual(run({ count: 12, search: "bol" }).items.map((x) => x.title), ["Bol vert"]);
    assert.equal(run({ count: 12, search: "100%_" }).total, 0, "les jokers SQL sont neutralisés");
  });

  test("catégories : la catégorie parente inclut ses sous-catégories ; une catégorie inconnue ne renvoie rien", () => {
    assert.deepEqual(run({ count: 12, categories: ["Maison"], orderby: "id", order: "asc" }).items.map((x) => x.title), ["Tasse bleue", "Bol vert", "Plateau chêne"]);
    assert.deepEqual(run({ count: 12, categories: ["Cuisine"], orderby: "id", order: "asc" }).items.map((x) => x.title), ["Tasse bleue", "Bol vert"]);
    assert.equal(run({ count: 12, categories: ["Inconnue"] }).total, 0);
  });

  test("produits apparentés : même catégorie que le produit affiché, jamais lui-même ; sans produit courant, rien", () => {
    const cur = { id: ids[0], title: "Tasse bleue" };
    assert.deepEqual(run({ count: 4, related: "category", excludeCurrent: true }, { scope: { page: { site_id: 1 }, product: cur } }).items.map((x) => x.title), ["Bol vert"]);
    assert.equal(run({ count: 4, related: "category" }).total, 0);
  });

  test("boutique fermée ou module Commerce désactivé : aucun résultat, sans erreur ; lecture seule (aucun réglage créé)", () => {
    store.saveSettings(A, { enabled: 0, payment_methods: ["manual"], default_country: "FR", currency: "eur" });
    assert.equal(run({ count: 12 }).total, 0);
    store.saveSettings(A, { enabled: 1, payment_methods: ["manual"], default_country: "FR", currency: "eur" });
    modules.setEnabled(ctx, 1, "commerce", false);
    assert.equal(run({ count: 12 }).total, 0);
    modules.setEnabled(ctx, 1, "commerce", true);
    const before = m.db.prepare("SELECT COUNT(*) n FROM mk_shop_settings").get().n;
    run({ count: 12 }, { scope: { page: { site_id: 99999 } } });
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_shop_settings").get().n, before);
  });
});
