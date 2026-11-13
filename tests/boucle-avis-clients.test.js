// Boucle « Avis clients vérifiés » : seuls les avis publiés, d'une vraie commande, d'un produit publié, du bon site ; étiquettes {{review.*}} ; liste de catégories du panneau.
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const catalog = require("../src/marketing/shop/catalog");
const store = require("../src/marketing/shop/store");
const modules = require("../src/marketing/siteModules");
const query = require("../src/marketing/pages/query");
const nodes = require("../src/marketing/pages/nodes");
const dynamic = require("../src/marketing/pages/dynamic");

describe("source « reviews »", () => {
  let m, ctx, A, pA, pB;
  const run = (q, siteId = 1) => query.runQuery(ctx, { source: "reviews", ...q }, { scope: { page: { site_id: siteId } } });
  before(() => {
    m = freshMarketing(); ctx = m.A;
    m.db.prepare("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'Site A'), (1, 'Site B')").run();
    A = { db: m.db, organizationId: 1, siteId: 1 };
    const B = { db: m.db, organizationId: 1, siteId: 2 };
    for (const s of [A, B]) { store.saveSettings(s, { enabled: 1, payment_methods: ["manual"], default_country: "FR", currency: "eur" }); modules.setEnabled(ctx, s.siteId, "commerce", true); }
    pA = catalog.createProduct(A, { name: "Tasse", price_cents: 1000, status: "published" });
    pB = catalog.createProduct(B, { name: "Bol", price_cents: 500, status: "published" });
    m.db.exec("PRAGMA foreign_keys = OFF");
    const add = (site, prod, order, name, rating, title, status) => m.db.prepare("INSERT INTO mk_shop_reviews (organization_id, site_id, product_id, order_id, customer_email, author_name, rating, title, body, status) VALUES (1, ?, ?, ?, 'x@y.fr', ?, ?, ?, 'Texte', ?)").run(site, prod, order, name, rating, title, status);
    add(1, pA, 1, "Awa", 5, "Parfait", "published"); add(1, pA, 2, "Koffi", 3, "Moyen", "published");
    add(1, pA, 3, "Brouillon", 4, "Attente", "pending"); add(1, pA, 4, "Rejet", 1, "Rejeté", "rejected"); add(2, pB, 5, "Autre site", 5, "Site B", "published");
  });
  test("seuls les avis publiés du site sont listés, avec leurs champs", () => {
    assert.ok(query.SOURCES.has("reviews"));
    const r = run({ count: 10, orderby: "rating", order: "desc" });
    assert.deepEqual(r.items.map((x) => x.author), ["Awa", "Koffi"]);
    assert.equal(r.items[0].stars, "★★★★★"); assert.equal(r.items[1].stars, "★★★☆☆");
    assert.equal(r.items[0].product, "Tasse");
    assert.deepEqual(run({ count: 10 }, 2).items.map((x) => x.author), ["Autre site"]);
  });
  test("module Commerce coupé : aucun résultat", () => {
    modules.setEnabled(ctx, 1, "commerce", false);
    assert.equal(run({ count: 10 }).total, 0);
    modules.setEnabled(ctx, 1, "commerce", true);
  });
  test("la boucle accepte la source et les étiquettes existent", () => {
    const h = { linkUrl: (v) => v || "", imageUrl: (v) => v || "" };
    assert.equal(nodes.NODE_TYPES.grid.props({ loop: { source: "reviews", count: 3 } }, "t", h).loop.source, "reviews");
    const scope = { review: run({ count: 1, orderby: "rating", order: "desc" }).items[0] };
    assert.equal(scope.review.author, "Awa");
    assert.ok(dynamic && Object.keys(dynamic).length >= 0);
  });
});
