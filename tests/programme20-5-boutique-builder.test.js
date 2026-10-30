// Programme 20.5 — intégration au Site Builder / Theme Builder : familles « Fiche produit » et « Catalogue » dans le moteur de modèles EXISTANT (même priorité, mêmes conditions),
// modèle d'un autre site jamais appliqué, étiquettes {{product.…}}, éléments de page branchés sur le vrai moteur (isolation, boutique fermée, données manquantes).
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const themeTemplates = require("../src/marketing/pages/themeTemplates");
const dynamic = require("../src/marketing/pages/dynamic");
const nodes = require("../src/marketing/pages/nodes");
const catalog = require("../src/marketing/shop/catalog");
const store = require("../src/marketing/shop/store");
const view = require("../src/marketing/shop/view");

describe("modèles de thème : familles produit", () => {
  let m, ctx, pageA, pageB, pageMain;
  before(() => {
    m = freshMarketing();
    m.db.prepare("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'A'), (1, 'B')").run();
    const ins = m.db.prepare("INSERT INTO mk_landing_pages (organization_id, site_id, name, slug, status, title) VALUES (1, ?, ?, ?, 'published', ?)");
    pageA = Number(ins.run(1, "Modèle produit A", "modele-produit-a", "A").lastInsertRowid);
    pageB = Number(ins.run(2, "Modèle produit B", "modele-produit-b", "B").lastInsertRowid);
    pageMain = Number(ins.run(null, "Modèle produit principal", "modele-produit-p", "P").lastInsertRowid);
    ctx = m.ctx(1);
  });
  test("les familles existent et gardent les conditions et la priorité du moteur", () => {
    assert.ok(themeTemplates.TYPES.product); assert.ok(themeTemplates.TYPES.product_archive);
    assert.deepEqual(themeTemplates.CONDITIONS.product, ["category"]);
    themeTemplates.add(ctx, { type: "product", pageId: pageA });
    themeTemplates.add(ctx, { type: "product", pageId: pageB, category: "Chaises" });
    assert.equal(themeTemplates.pick(ctx, "product", { category: "Chaises" }).id, pageB, "la condition de catégorie l'emporte sur le modèle général");
    assert.equal(themeTemplates.pick(ctx, "product", { category: "Tables" }).id, pageA);
    const why = themeTemplates.explain(ctx, "product", { category: "Chaises" });
    assert.equal(why.winner.pageId, pageB);
  });
  test("avec siteId : seul un modèle dont la page appartient au site s'applique (aucune fuite entre boutiques)", () => {
    assert.equal(themeTemplates.pick(ctx, "product", { category: "Tables", siteId: 1 }).id, pageA);
    assert.equal(themeTemplates.pick(ctx, "product", { category: "Tables", siteId: 3 }), null, "autre site : repli sur l'affichage par défaut");
    assert.equal(themeTemplates.pick(ctx, "product", { category: "Chaises", siteId: 1 }).id, pageA, "le modèle plus précis mais d'un autre site est ignoré");
    assert.equal(themeTemplates.pick(ctx, "product", { category: "Chaises", siteId: null }), null, "le site principal n'utilise pas le modèle d'un site");
    themeTemplates.add(ctx, { type: "product_archive", pageId: pageMain });
    assert.equal(themeTemplates.pick(ctx, "product_archive", { siteId: null }).id, pageMain);
    assert.equal(themeTemplates.pick(ctx, "product_archive", { siteId: 1 }), null);
  });
  test("sans siteId, le comportement historique du blog est inchangé", () => {
    assert.ok(themeTemplates.pick(ctx, "product_archive", {}));
  });
});

describe("étiquettes dynamiques {{product.…}}", () => {
  const scope = { product: view.productScope({ id: 7, name: "Lampe <b>", short_description: "Courte", description: "<p>Longue</p>", priceFromCents: 4500, regularFromCents: 5000, onSale: true, slug: "lampe", image_url: "/uploads/l.png", categories: [{ name: "Maison" }], sku: "L-1", inStock: true }, { currency: "eur" }) };
  test("elles lisent le produit de la boutique, avec repli sur l'ancien alias de formation", () => {
    assert.equal(dynamic.resolveString("{{product.title}}", scope), "Lampe <b>");
    assert.match(dynamic.resolveString("{{product.price}}", scope), /45,00/);
    assert.match(dynamic.resolveString("{{product.regular_price}}", scope), /50,00/);
    assert.equal(dynamic.resolveString("{{product.sku}} {{product.availability}}", scope), "L-1 En stock");
    assert.equal(dynamic.resolveString("{{product.title | fallback: Aucun}}", {}), "Aucun");
    assert.equal(dynamic.resolveString("{{product.title}}", { course: { title: "Formation X" } }), "Formation X", "ancien alias conservé");
    assert.equal(dynamic.resolveString("{{course.title}}", scope), "", "scope.course reste distinct");
  });
  test("le HTML d'un nom de produit est échappé en texte riche", () => {
    assert.equal(dynamic.resolveString("{{product.title}}", scope, { html: true }), "Lampe &lt;b&gt;");
  });
});

describe("éléments de page de la boutique", () => {
  let m, s;
  const env = (siteId, extra = {}) => ({ page: { site_id: siteId }, scope: {}, visitor: { query: {} }, ...extra });
  before(() => {
    m = freshMarketing();
    m.db.prepare("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'A'), (1, 'B')").run();
    s = (siteId) => ({ db: m.db, organizationId: 1, siteId });
    m.db.prepare("INSERT INTO mk_site_modules (site_id, organization_id, module, enabled) VALUES (1, 1, 'commerce', 1), (2, 1, 'commerce', 1)").run();
    for (const id of [1, 2, null]) store.saveSettings(s(id), { enabled: 1, payment_methods: ["manual"] });
    catalog.createProduct(s(1), { name: "Produit A1", price_cents: 1000, status: "published", is_featured: 1 });
    catalog.createProduct(s(1), { name: "Produit A2", price_cents: 2000, sale_price_cents: 1500, status: "published" });
    catalog.createProduct(s(2), { name: "Produit B1", price_cents: 3000, status: "published" });
    catalog.createProduct(s(null), { name: "Produit principal", price_cents: 500, status: "published" });
  });
  const widget = (type) => nodes.CUSTOM_WIDGETS[type];
  test("les cinq éléments sont enregistrés dans le registre commun, groupe e-commerce", () => {
    for (const t of ["shopgrid", "shopbuy", "shopcart", "shopsearch", "shopfilters"]) { assert.ok(widget(t), t); assert.equal(widget(t).group, "commerce"); assert.ok(nodes.NODE_TYPES[t]); assert.ok(nodes.PALETTE[t]); }
  });
  test("la grille ne montre que les produits du site de la page", () => {
    const p = { source: "all", count: 12, orderby: "newest", columns: "3", inStockOnly: false, category: "" };
    const names = (siteId) => widget("shopgrid").data({ db: m.db, organizationId: 1 }, p, env(siteId)).items.map((x) => x.name).sort();
    assert.deepEqual(names(1), ["Produit A1", "Produit A2"]);
    assert.deepEqual(names(2), ["Produit B1"]);
    assert.deepEqual(names(null), ["Produit principal"]);
  });
  test("sources : mis en avant, promotion, suit la page (catégorie et recherche de l'adresse)", () => {
    const base = { count: 12, orderby: "newest", columns: "3", inStockOnly: false, category: "" };
    const run = (over, e) => widget("shopgrid").data({ db: m.db, organizationId: 1 }, { ...base, ...over }, e || env(1)).items.map((x) => x.name);
    assert.deepEqual(run({ source: "featured" }), ["Produit A1"]);
    assert.deepEqual(run({ source: "sale" }), ["Produit A2"]);
    assert.deepEqual(run({ source: "archive" }, env(1, { visitor: { query: { q: "A2" } } })), ["Produit A2"]);
  });
  test("module désactivé ou boutique fermée : aucune donnée, aucune fuite", () => {
    const p = { source: "all", count: 5, orderby: "newest", columns: "3", inStockOnly: false, category: "" };
    m.db.prepare("UPDATE mk_site_modules SET enabled = 0 WHERE site_id = 2").run();
    assert.equal(widget("shopgrid").data({ db: m.db, organizationId: 1 }, p, env(2)).closed, "module");
    assert.deepEqual(widget("shopgrid").data({ db: m.db, organizationId: 1 }, p, env(2)).items, []);
    store.saveSettings(s(1), { enabled: 0 });
    assert.equal(widget("shopgrid").data({ db: m.db, organizationId: 1 }, p, env(1)).closed, "shop");
    assert.equal(widget("shopbuy").data({ db: m.db, organizationId: 1 }, { product: "" }, env(1)).closed, "shop");
    store.saveSettings(s(1), { enabled: 1 });
  });
  test("ajout au panier : produit de la page ou produit nommé ; inconnu, brouillon ou d'un autre site → rien", () => {
    const buy = (p, e) => widget("shopbuy").data({ db: m.db, organizationId: 1 }, { product: "", ...p }, e);
    const a1 = catalog.catalogQuery(s(1), { q: "A1" }).items[0];
    assert.equal(buy({}, env(1, { scope: { product: { id: a1.id } } })).product.name, "Produit A1");
    assert.equal(buy({ product: a1.slug }, env(1)).product.name, "Produit A1");
    assert.equal(buy({ product: a1.slug }, env(null)).product, null, "le slug d'un autre site est inconnu");
    assert.equal(buy({ product: "n-existe-pas" }, env(1)).product, null);
    assert.equal(buy({}, env(null, { scope: { product: { id: a1.id } } })).product, null, "l'identifiant d'un produit d'un autre site est inconnu");
    const draft = catalog.createProduct(s(1), { name: "Brouillon", price_cents: 100 });
    assert.equal(buy({}, env(1, { scope: { product: { id: draft } } })).product, null);
  });
  test("filtres : seulement les catégories du site", () => {
    catalog.saveCategory(s(1), { name: "Cat A" }); catalog.saveCategory(s(2), { name: "Cat B" });
    const d = widget("shopfilters").data({ db: m.db, organizationId: 1 }, {}, env(1));
    assert.deepEqual(d.categories.map((c) => c.name), ["Cat A"]);
  });
  test("réglages hostiles neutralisés par la validation du registre (valeurs par défaut, jamais transmises à la requête)", () => {
    const def = nodes.NODE_TYPES.shopgrid;
    assert.equal(def.props({ source: "'; DROP TABLE x;--", count: 5 }, "t", {}).source, "all");
    assert.ok(def.props({ source: "all", count: 9999 }, "t", {}).count <= 24);
    assert.equal(def.props({ columns: "99" }, "t", {}).columns, "3");
  });
});
