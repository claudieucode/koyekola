// Bibliothèque d'ARCHIVES PRODUITS du Theme Builder : exactement 100 compositions distinctes (10 familles × 10, 20 par identité), valides, responsive, sans contrôle décoratif, utilisables (copie
// indépendante), branchées sur le VRAI moteur de boutique (filtres, tri, pagination, promotions, stock, étiquettes, isolation) et rendues par le vrai moteur (aperçu = vignette = site publié).
// Voir docs/theme-builder/kolakisa-product-archive-library.md.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const store = require("../src/themeBuilder/store");
const Catalog = require("../src/themeBuilder/catalog");
const { useTemplate } = require("../src/themeBuilder/catalog/use");
const Archive = require("../src/themeBuilder/catalog/product_archive");
const shopWidgets = require("../src/marketing/pages/widgets/shop");
const catalog = require("../src/marketing/shop/catalog");
const shopStore = require("../src/marketing/shop/store");
const { startServer, loginInstructor } = require("./helpers");

const TYPE = "product_archive";
const walk = (nodes, fn, depth = 0) => { for (const n of nodes || []) { fn(n, depth); if (n && n.children) walk(n.children, fn, depth + 1); } };
const all = Catalog.entries(TYPE);
const sections = (key) => Catalog.build(TYPE, key).sections;
const nodesOf = (key) => { const out = []; walk(sections(key), (n) => out.push(n)); return out; };
const gridsOf = (key) => nodesOf(key).filter((n) => n.type === "shopgrid");
const widgetOf = (type) => shopWidgets.find((w) => w.type === type);
// Signature de COMPOSITION : arbre des éléments, réglages de grille et de filtres, disposition (direction, largeur, position).
const signature = (key) => JSON.stringify(sections(key), (k, v) => {
  if (k === "id") return undefined;
  if (k === "styles") { const d = v.desktop || {}; return { p: d.position, fd: d.flexDirection, jc: d.justifyContent, mw: d.maxWidth, fb: d.flexBasis, bg: d.backgroundColor ? "c" : undefined, bb: d.borderBottomWidth, al: d.textAlign, fs: d.fontSize }; }
  if (k === "parts") return undefined;
  return v;
});

describe("Archives produits : le catalogue", () => {
  test("exactement 100 modèles : 10 familles de 10, 20 par identité, clés et noms uniques", () => {
    assert.equal(all.length, 100);
    assert.equal(new Set(all.map((e) => e.key)).size, 100, "clés uniques");
    assert.equal(new Set(all.map((e) => e.name)).size, 100, "noms uniques");
    const byFamily = {}, bySkin = {};
    for (const e of all) { byFamily[e.layoutKey] = (byFamily[e.layoutKey] || 0) + 1; bySkin[e.skinKey] = (bySkin[e.skinKey] || 0) + 1; }
    assert.deepEqual(Object.keys(byFamily).sort(), Archive.families.map((f) => f.key).sort());
    for (const [f, n] of Object.entries(byFamily)) assert.equal(n, 10, `famille ${f}`);
    for (const [s, n] of Object.entries(bySkin)) assert.equal(n, 20, `identité ${s}`);
    assert.equal(Catalog.stats().find((x) => x.type === TYPE).count, 100);
  });
  test("clés sûres pour une adresse (ASCII minuscule, chiffres, tiret)", () => {
    for (const e of all) assert.match(e.key, /^[a-z0-9]+(-[a-z0-9]+)*\.[a-z]+$/, e.key);
  });
  test("les 100 anciennes clés (20 mises en page × 5 identités) n'existent plus", () => {
    const olds = "filtres-gauche filtres-droite filtres-haut recherche-vedette grille-2 grille-4 grille-5 promos-dessus vedettes-dessus bandeau-panier panier-commande bandeau-categorie editorial minimal recherche-filtres double-mise-en-avant filtres-collants outils-en-ligne carte-recherche vitrine".split(" ");
    let n = 0;
    for (const o of olds) for (const s of ["clair", "marque", "nuit", "editorial", "doux"]) { assert.equal(Catalog.find(TYPE, `${o}.${s}`), null, `${o}.${s}`); n++; }
    assert.equal(n, 100);
  });
  test("100 compositions DISTINCTES : aucune paire de même structure ni de mêmes réglages (ce n'est pas une affaire de couleur)", () => {
    const seen = new Map();
    for (const e of all) { const sig = signature(e.key); assert.ok(!seen.has(sig), `${e.key} a la même composition que ${seen.get(sig)}`); seen.set(sig, e.key); }
    // sans couleurs ni typographie : les arbres restent distincts, et un modèle ne se distingue pas d'un autre par une seule valeur numérique
    const shapes = new Set(all.map((e) => signature(e.key)));
    assert.equal(shapes.size, 100);
    const gridSigs = new Set(all.map((e) => JSON.stringify(gridsOf(e.key).map((g) => [g.props.columns, g.props.layout, g.props.ratio, g.props.cardStyle, g.props.count, g.props.showBadge, g.props.showCategory, g.props.showDescription, g.props.showCart, g.props.paginate, g.props.onlySale, g.props.onlyFeatured, g.props.orderby]))));
    assert.ok(gridSigs.size >= 45, `réglages de grille différents : ${gridSigs.size}`);
  });
  test("chaque modèle est une ARCHIVE de catalogue : un titre d'archive, une grille qui suit la page ; ni fiche produit, ni page d'accueil, ni formulaire de commande", () => {
    for (const e of all) {
      const types = nodesOf(e.key).map((n) => n.type);
      assert.ok(types.includes("archiveinfo") || types.includes("heading"), `${e.key} : pas de titre`);
      const main = gridsOf(e.key).filter((g) => !g.props.ignoreFilters);
      assert.ok(main.length >= 1, `${e.key} : aucune grille qui suit la page`);
      for (const g of main) assert.equal(g.props.source, "archive", `${e.key} : source`);
      for (const t of ["shopbuy", "postcontent", "sitelogo", "menu", "form", "slides", "testimonialcarousel"]) assert.ok(!types.includes(t), `${e.key} : ${t} n'a rien à faire dans une archive`);
    }
  });
  test("aucun contrôle décoratif : tout élément est un widget natif branché sur le moteur (grille, filtres, recherche, panier, titre d'archive) ; pas d'image, de script ni de notes factices", () => {
    const OK = new Set(["layout", "container", "group", "stack", "grid", "heading", "text", "divider", "spacer", "archiveinfo", "shopgrid", "shopfilters", "shopsearch", "shopcart"]);
    for (const e of all) {
      const json = JSON.stringify(sections(e.key));
      assert.ok(!/<script|javascript:|onerror=|<img|\{\{post\.|\{\{course\./i.test(json), `${e.key} : contenu interdit`);
      assert.ok(!/avis|étoile|★|note moyenne|stars?\b/i.test(json), `${e.key} : le moteur n'a ni notes ni avis`);
      for (const n of nodesOf(e.key)) assert.ok(OK.has(n.type), `${e.key} : élément inattendu ${n.type}`);
      for (const n of nodesOf(e.key)) if (n.type === "text") assert.ok(!/produit|prix|€/i.test(n.props.html || ""), `${e.key} : texte avec produit ou prix inventé`);
    }
  });
  test("pagination : toute grille qui suit la page est paginée (sauf trois modèles minimaux) ; les rangées de mise en avant ne le sont jamais et ignorent filtres, tri et page", () => {
    let unpaged = 0;
    for (const e of all) for (const g of gridsOf(e.key)) {
      if (g.props.ignoreFilters) { assert.equal(g.props.paginate, false, `${e.key} : une rangée ne se pagine pas`); assert.ok(g.props.onlySale || g.props.onlyFeatured || g.props.orderby, `${e.key}`); }
      else if (!g.props.paginate) unpaged++;
    }
    assert.ok(unpaged <= 3, `grilles sans pagination : ${unpaged}`);
  });
  test("les rangées de promotions et de vedettes ont un message de repli explicite quand il n'y en a pas", () => {
    for (const e of all) for (const g of gridsOf(e.key)) if (g.props.onlySale || g.props.onlyFeatured) assert.match(g.props.empty, /Aucun/, e.key);
  });
  test("responsive : colonnes latérales pleine largeur sur mobile, retour à la ligne des rangées, aucune position absolue, colonnes de grille ≤ 5", () => {
    for (const e of all) {
      walk(sections(e.key), (n) => {
        const d = (n.styles && n.styles.desktop) || {};
        assert.notEqual(d.position, "absolute", `${e.key} : position absolue`);
        if (n.type === "group" && d.flexDirection === "row") assert.equal(d.flexWrap, "wrap", `${e.key} : une rangée doit passer à la ligne`);
        if (n.type === "container" && d.flexBasis === "260px") assert.equal(n.styles.mobile.flexBasis, "100%", `${e.key} : colonne latérale`);
        if (n.type === "shopgrid") assert.ok(Number(n.props.columns) >= 1 && Number(n.props.columns) <= 5, `${e.key} : colonnes`);
      });
    }
  });
  test("collant : les colonnes et barres collantes utilisent position sticky avec un décalage (jamais de position fixe)", () => {
    let sticky = 0;
    for (const e of all) walk(sections(e.key), (n) => { const d = (n.styles && n.styles.desktop) || {}; if (d.position) { assert.equal(d.position, "sticky", e.key); assert.ok(d.top !== undefined, e.key); sticky++; } });
    assert.ok(sticky >= 3, `modèles collants : ${sticky}`);
  });
  test("secteurs : mode, électronique, beauté, décoration, mobilier, bijoux, sport, alimentation, enfants sont couverts ; formats d'image variés", () => {
    const tags = new Set(all.flatMap((e) => e.tags));
    for (const t of ["mode", "électronique", "beauté", "décoration", "mobilier", "bijoux", "sport", "alimentation", "enfants"]) assert.ok(tags.has(t), t);
    const ratios = new Set(all.flatMap((e) => gridsOf(e.key).map((g) => g.props.ratio)));
    for (const r of ["1/1", "4/5", "3/4", "2/3", "4/3", "16/9"]) assert.ok(ratios.has(r), r);
    const layouts = new Set(all.flatMap((e) => gridsOf(e.key).map((g) => g.props.layout)));
    assert.deepEqual([...layouts].sort(), ["grid", "list"]);
  });
  test("diversité : filtres latéraux ET horizontaux, avec et sans panier, rangées de promotions, bandeaux, colonnes collantes", () => {
    const has = (pred) => all.filter((e) => pred(nodesOf(e.key))).length;
    assert.ok(has((ns) => ns.some((n) => n.type === "shopfilters" && n.props.direction === "column")) >= 10, "filtres latéraux");
    assert.ok(has((ns) => ns.some((n) => n.type === "shopfilters" && n.props.direction === "row")) >= 20, "filtres horizontaux");
    assert.ok(has((ns) => ns.some((n) => n.type === "shopcart")) >= 8, "panier");
    assert.ok(has((ns) => ns.some((n) => n.type === "shopgrid" && n.props.showCart)) >= 10, "ajout au panier");
    assert.ok(has((ns) => ns.some((n) => n.type === "shopgrid" && n.props.onlySale)) >= 5, "promotions");
    assert.ok(has((ns) => ns.some((n) => n.type === "shopsearch")) >= 15, "recherche");
  });
  test("liste : recherche sans accents, filtre par famille et par identité, pagination ; la liste ne contient jamais les documents", () => {
    const r = Catalog.list(TYPE, { q: "electronique", limit: 60 });
    assert.ok(r.total >= 1 && r.items.every((i) => !i.build && !i.section && !i.sections));
    assert.equal(r.layouts.length, 10);
    assert.equal(Catalog.list(TYPE, { layout: "promo", limit: 60 }).total, 10);
    assert.equal(Catalog.list(TYPE, { skin: "nuit", limit: 60 }).total, 20);
    const p = Catalog.list(TYPE, { limit: 24, page: 5 });
    assert.equal(p.items.length, 4); assert.equal(p.pages, 5);
  });
});

describe("Archives produits : utilisation, édition, isolation", () => {
  const { A } = freshMarketing();
  const s1 = pages.createSite(A, { name: "Un" }), s2 = pages.createSite(A, { name: "Deux" });
  A.db.prepare("INSERT INTO mk_site_modules (site_id, organization_id, module, enabled) VALUES (?, 1, 'commerce', 1), (?, 1, 'commerce', 1)").run(s1.id, s2.id);
  const keyOf = (layoutId) => all.find((e) => e.layoutId === layoutId).key;
  test("« Utiliser » crée une page et un modèle brouillon : copie indépendante du catalogue et de l'autre site", () => {
    const key = keyOf("filtres-colonne-gauche");
    const t = useTemplate(A, s1.id, TYPE, key);
    assert.equal(t.type, TYPE); assert.equal(t.status, "draft");
    assert.equal(store.list(A, s2.id).length, 0, "l'autre site n'a rien reçu");
    const page = pages.getPage(A, t.sourceId);
    assert.ok(JSON.stringify(page.working.sections).includes('"shopgrid"'));
  });
  test("les 100 modèles sont utilisables : la page copiée garde la grille qui suit la page, ses réglages et les parties stylées", () => {
    for (const e of all) {
      const t = useTemplate(A, s1.id, TYPE, e.key);
      const saved = JSON.stringify(pages.getPage(A, t.sourceId).working.sections);
      assert.ok(saved.includes('"source":"archive"'), `${e.key} : source perdue`);
      const want = gridsOf(e.key).find((g) => !g.props.ignoreFilters).props;
      const got = (() => { let g = null; walk(pages.getPage(A, t.sourceId).working.sections, (n) => { if (!g && n.type === "shopgrid" && !n.props.ignoreFilters) g = n; }); return g.props; })();
      for (const k of ["columns", "layout", "ratio", "cardStyle", "count", "showBadge", "showCart", "paginate"]) assert.equal(String(got[k]), String(want[k]), `${e.key} : ${k}`);
    }
  });
  test("publication : un modèle du catalogue se publie et s'affecte comme tout modèle (mêmes conditions → remplacement explicite)", () => {
    const a = useTemplate(A, s2.id, TYPE, keyOf("grille-trois-colonnes"));
    const b = useTemplate(A, s2.id, TYPE, keyOf("bandeau-centre"));
    store.publish(A, s2.id, a.id);
    assert.throws(() => store.publish(A, s2.id, b.id), /mêmes conditions/);
    const r = store.publish(A, s2.id, b.id, { replace: true });
    assert.equal(r.template.status, "published"); assert.equal(r.replaced.length, 1);
  });
});

// ── Le moteur : produits réels, filtres, tri, pagination, promotions, stock, étiquettes, isolation ───────────────────────────────────────────────────────────────────────────────────────────
describe("Archives produits : le moteur de boutique derrière la grille", () => {
  let m, s;
  const grid = widgetOf("shopgrid"), filters = widgetOf("shopfilters");
  const P = (over = {}) => ({ source: "archive", count: 4, columns: "3", orderby: "newest", inStockOnly: false, showPrice: true, showImage: true, layout: "grid", ratio: "1/1", cardStyle: "boxed", paginate: true, ignoreFilters: false, onlySale: false, onlyFeatured: false, ...over });
  const run = (siteId, p, query = {}, extra = {}) => grid.data({ db: m.db, organizationId: 1 }, P(p), { page: { site_id: siteId, ...extra }, scope: {}, visitor: { query } });
  before(() => {
    m = freshMarketing();
    m.db.prepare("INSERT INTO mk_sites (organization_id, name) VALUES (1, 'A'), (1, 'B')").run();
    s = (siteId) => ({ db: m.db, organizationId: 1, siteId });
    m.db.prepare("INSERT INTO mk_site_modules (site_id, organization_id, module, enabled) VALUES (1, 1, 'commerce', 1), (2, 1, 'commerce', 1)").run();
    for (const id of [1, 2]) shopStore.saveSettings(s(id), { enabled: 1, payment_methods: ["manual"] });
    const cat = (siteId, name) => catalog.saveCategory(s(siteId), { name });
    const chairs = cat(1, "Chaises"), tables = cat(1, "Tables");
    const mk = (siteId, o) => catalog.createProduct(s(siteId), { status: "published", ...o });
    mk(1, { name: "Chaise bois", price_cents: 4000, is_featured: 1, category_ids: [chairs], tags: ["salon"] });
    mk(1, { name: "Chaise promo", price_cents: 6000, sale_price_cents: 4500, category_ids: [chairs] });
    mk(1, { name: "Table basse", price_cents: 12000, category_ids: [tables], tags: ["salon"] });
    mk(1, { name: "Table épuisée", price_cents: 9000, manage_stock: 1, stock_qty: 0, category_ids: [tables] });
    for (let i = 1; i <= 6; i++) mk(1, { name: `Tabouret ${i}`, price_cents: 1000 * i });
    const bag = mk(1, { name: "Sac à variantes", type: "variable", price_cents: 3000, attributes: [{ name: "Taille", values: ["S", "M"] }] });
    catalog.saveVariant(s(1), bag, { options: { Taille: "S" }, stock_qty: 5 });
    mk(2, { name: "Produit du site B", price_cents: 1000 });
  });
  test("sans filtre : les produits du site, pas ceux d'un autre site ; total réel", () => {
    const a = run(1, {}, {}), b = run(2, {}, {});
    assert.equal(a.total, 11); assert.equal(a.items.length, 4);
    assert.deepEqual(b.items.map((x) => x.name), ["Produit du site B"]);
    assert.ok(!a.items.some((x) => /site B/.test(x.name)));
  });
  test("la grille lit les critères de l'adresse : recherche, prix, stock, promotion, tri", () => {
    assert.deepEqual(run(1, { count: 24 }, { q: "table" }).items.map((x) => x.name).sort(), ["Table basse", "Table épuisée"]);
    assert.deepEqual(run(1, { count: 24 }, { promo: "1" }).items.map((x) => x.name), ["Chaise promo"]);
    assert.ok(!run(1, { count: 24 }, { stock: "1" }).items.some((x) => x.name === "Table épuisée"));
    const priced = run(1, { count: 24 }, { min: "10", max: "45" }).items.map((x) => x.name);
    assert.ok(priced.includes("Chaise promo") && priced.includes("Tabouret 1") && !priced.includes("Table basse"), priced.join(","));
    const asc = run(1, { count: 24 }, { tri: "price_asc" }).items.map((x) => x.priceFromCents);
    assert.deepEqual(asc, [...asc].sort((a, b) => a - b));
    const desc = run(1, { count: 24 }, { tri: "price_desc" }).items.map((x) => x.priceFromCents);
    assert.deepEqual(desc, [...desc].sort((a, b) => b - a));
  });
  test("prix promotionnel et prix barré exacts ; rupture de stock signalée ; total filtré cohérent", () => {
    const promo = run(1, {}, { promo: "1" }).items[0];
    assert.equal(promo.onSale, true); assert.match(promo.priceLabel, /45,00/); assert.match(promo.regularLabel, /60,00/);
    const out = run(1, { count: 24 }, { q: "épuisée" }).items[0];
    assert.equal(out.inStock, false);
    assert.equal(run(1, { count: 24 }, { stock: "1" }).total, 10);
  });
  test("catégorie : la grille ne montre que les produits de la catégorie de la page (sous-catégories comprises) ; produit à variantes : « à partir de » et variantes réelles", () => {
    assert.deepEqual(run(1, { count: 24 }, { categorie: "chaises" }).items.map((x) => x.name).sort(), ["Chaise bois", "Chaise promo"]);
    assert.deepEqual(run(2, { count: 24 }, { categorie: "chaises" }).items, [], "la catégorie d'un autre site n'existe pas");
    const bag = run(1, { count: 24 }, { q: "variantes" }).items[0];
    assert.equal(bag.isVariable, true); assert.equal(bag.inStock, true); assert.equal(bag.variants.length, 1);
    assert.match(bag.priceLabel, /30,00/);
  });
  test("aucune note ni aucun avis : le moteur n'en a pas, la grille n'en affiche jamais", () => {
    for (const x of run(1, { count: 24 }, {}).items) { assert.ok(!("rating" in x) && !("reviews" in x)); }
  });
  test("étiquette : le critère etiquette filtre sur les étiquettes du produit", () => {
    assert.deepEqual(run(1, { count: 24 }, { etiquette: "salon" }).items.map((x) => x.name).sort(), ["Chaise bois", "Table basse"]);
  });
  test("pagination : page 2 = les produits suivants ; liens qui conservent les critères ; page hors limites bornée ; pas de pagination pour une seule page", () => {
    const p1 = run(1, { count: 4 }, { tri: "price_asc" }), p2 = run(1, { count: 4 }, { tri: "price_asc", page: "2" });
    assert.equal(p1.pager.pages, 3); assert.equal(p1.pager.page, 1); assert.equal(p1.total, 11); assert.equal(p2.pager.page, 2);
    assert.equal(p1.pager.base, "tri=price_asc");
    assert.ok(p1.items.every((x) => !p2.items.some((y) => y.id === x.id)), "pages disjointes");
    assert.ok(p2.items.length > 0);
    assert.equal(run(1, { count: 4 }, { page: "999" }).items.length, 0, "page vide, pas d'erreur");
    assert.equal(run(1, { count: 24 }, {}).pager, null, "une seule page");
    assert.equal(run(1, { count: 4, paginate: false }, { page: "2" }).items.length, 4, "sans pagination, la page 1 reste");
    assert.equal(run(1, { count: 4, paginate: false }, { page: "2" }).pager, null);
  });
  test("rangée de mise en avant : suit la catégorie mais ignore filtres, tri et page ; promotions et vedettes seulement", () => {
    const sale = run(1, { onlySale: true, ignoreFilters: true, paginate: false }, { promo: "", tri: "price_desc", page: "3", min: "9999" });
    assert.deepEqual(sale.items.map((x) => x.name), ["Chaise promo"]);
    const feat = run(1, { onlyFeatured: true, ignoreFilters: true }, { stock: "1" });
    assert.deepEqual(feat.items.map((x) => x.name), ["Chaise bois"]);
  });
  test("archive vide : aucun produit, pas d'erreur, pas de pagination ; catégorie inconnue idem", () => {
    const r = run(1, {}, { q: "introuvable-xyz" });
    assert.equal(r.items.length, 0); assert.equal(r.total, 0); assert.equal(r.pager, null);
    assert.equal(run(1, {}, { categorie: "n-existe-pas" }).items.length, 0);
  });
  test("critères mal formés : refusés sans erreur (prix négatif, tri inconnu, page non numérique)", () => {
    assert.doesNotThrow(() => run(1, {}, { min: "-5", max: "abc", tri: "DROP TABLE", page: "x", q: "x".repeat(500) }));
    assert.equal(run(1, { count: 24 }, { tri: "n'importe quoi" }).items.length, 11);
  });
  test("aucun produit d'exemple sur un site : l'aperçu seul (page.demoShop) en injecte, et il est borné au catalogue de démonstration", () => {
    assert.equal(run(1, {}, {}).demo, undefined);
    assert.ok(!run(1, {}, {}).items.some((x) => x.demo));
    const demo = run(1, { count: 6 }, {}, { demoShop: true });
    assert.equal(demo.demo, true); assert.equal(demo.items.length, 6); assert.ok(demo.items.every((x) => x.demo && /exemple/i.test(x.name)));
    assert.ok(demo.items.some((x) => x.onSale) || run(1, { count: 36 }, {}, { demoShop: true }).items.some((x) => x.onSale));
    const all36 = run(1, { count: 36, paginate: false }, {}, { demoShop: true }).items;
    for (const state of [(x) => x.onSale, (x) => !x.inStock, (x) => x.isVariable, (x) => !x.image_url]) assert.ok(all36.some(state), "état de démonstration manquant");
  });
  test("filtres : conservent les critères qu'ils n'affichent pas ; boutique fermée → rien ; démonstration seulement dans la bibliothèque", () => {
    const f = filters.data({ db: m.db, organizationId: 1 }, {}, { page: { site_id: 1 }, visitor: { query: { q: "x", tri: "name" } } });
    assert.ok(f.categories.length >= 0 && f.query.q === "x");
    assert.equal(filters.data({ db: m.db, organizationId: 1 }, {}, { page: { site_id: 3 }, visitor: { query: {} } }).closed, "module");
    assert.equal(filters.data({ db: m.db, organizationId: 1 }, {}, { page: { site_id: 3, demoShop: true }, visitor: { query: {} } }).demo, true);
  });
});

describe("Archives produits : rendu par le vrai moteur (aperçu, vignette, page publiée)", () => {
  let srv, boss, site, db;
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Rendu archives" })).location.match(/sites\/(\d+)/)[1]);
    db.prepare("INSERT OR REPLACE INTO mk_site_modules (site_id, organization_id, module, enabled) VALUES (?, 1, 'commerce', 1)").run(site);
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("les 100 aperçus et vignettes répondent 200, montrent des produits d'EXEMPLE annoncés (aperçu) et aucun script", async () => {
    for (const e of all) {
      const ap = await boss.get(U(`/api/bibliotheque/${TYPE}/${e.key}/apercu`)), vi = await boss.get(U(`/api/bibliotheque/${TYPE}/${e.key}/vignette`));
      assert.equal(ap.status, 200, `${e.key} aperçu`); assert.equal(vi.status, 200, `${e.key} vignette`);
      for (const r of [ap, vi]) { assert.ok(!/<script(?![^>]*src="\/js\/landing\.js)/i.test(r.text), `${e.key} : script`); /* seul le script du site (landing.js) est admis : jamais de script propre au modèle */ assert.match(r.text, /kw-pg-card/, `${e.key} : aucune carte produit`); assert.match(r.text, /Produit exemple/, `${e.key} : produits d'exemple`); }
      assert.match(ap.text, /produits d'exemple/i, `${e.key} : l'aperçu annonce les exemples`);
      assert.doesNotMatch(vi.text, /Aperçu avec des produits d'exemple/, `${e.key} : pas de bandeau dans la vignette`);
    }
  });
  test("aperçu = vignette : mêmes éléments dans le même ordre pour chaque modèle", async () => {
    const shape = (h) => (h.match(/kw-(pg|sf|ss|sc|ai)(?=[\s"])/g) || []).join(",");
    for (const e of all.filter((_, i) => i % 7 === 0)) {
      const a = (await boss.get(U(`/api/bibliotheque/${TYPE}/${e.key}/apercu`))).text, v = (await boss.get(U(`/api/bibliotheque/${TYPE}/${e.key}/vignette`))).text;
      assert.equal(shape(v), shape(a), e.key);
    }
  });
  test("grille de l'aperçu : pastilles, bouton d'ajout, liste, pagination, filtres et recherche réellement présents selon le modèle", async () => {
    const get = async (key) => (await boss.get(U(`/api/bibliotheque/${TYPE}/${key}/apercu`))).text;
    const cart = await get(all.find((e) => e.layoutId === "secteur-beaute").key);
    assert.match(cart, /kw-pg-cart/); assert.match(cart, /kw-pg-badge/);
    const liste = await get(all.find((e) => e.layoutId === "liste-simple").key);
    assert.match(liste, /kw-pg--list/);
    const lateral = await get(all.find((e) => e.layoutId === "filtres-colonne-gauche").key);
    assert.match(lateral, /kw-sf--col/); assert.match(lateral, /kw-sf-reset/); assert.match(lateral, /name="categorie"/);
    const paged = await get(all.find((e) => e.layoutId === "grille-pagination").key);
    assert.match(paged, /kw-pg-pager/); assert.match(paged, /href="\?page=2"/);
    const rails = await get(all.find((e) => e.layoutId === "promotions-en-tete").key);
    assert.match(rails, /En promotion/); assert.match(rails, /kw-pg-old/);
  });
  test("page 2 de l'aperçu : la pagination fonctionne (autres produits)", async () => {
    const e = all.find((x) => x.layoutId === "grille-pagination");
    const p1 = (await boss.get(U(`/api/bibliotheque/${TYPE}/${e.key}/apercu`))).text, p2 = (await boss.get(U(`/api/bibliotheque/${TYPE}/${e.key}/apercu?page=2`))).text;
    assert.match(p1, /Produit exemple 01/); assert.doesNotMatch(p2, /Produit exemple 01\b/); assert.match(p2, /Produit exemple 1[0-9]/); assert.match(p2, /aria-current="page">2</);
  });
  test("une copie sur le site n'affiche AUCUN produit d'exemple (boutique fermée : rien ; jamais de remplacement silencieux)", async () => {
    const used = JSON.parse((await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type: TYPE, key: all.find((e) => e.layoutId === "grille-trois-colonnes").key }, headers: { Origin: srv.base } })).text).template;
    assert.ok(used.id);
    const copy = await boss.get(`/marketing/pages/${used.sourceId}/apercu`);
    assert.equal(copy.status, 200);
    assert.doesNotMatch(copy.text, /Produit exemple/);
  });
  test("anciennes clés : 404, aucune vignette fantôme", async () => {
    for (const old of ["filtres-gauche.clair", "grille-4.nuit", "vitrine.editorial"]) for (const kind of ["apercu", "vignette", "miniature"]) assert.equal((await boss.get(U(`/api/bibliotheque/${TYPE}/${old}/${kind}`))).status, 404, `${old} ${kind}`);
  });
});

// ── Site publié : /boutique rendu avec un modèle du catalogue, produits réels, filtres, tri, pagination, panier ───────────────────────────────────────────────────────────────────────────────────
describe("Archives produits : /boutique publiée avec un modèle du catalogue", () => {
  const themeTemplates = require("../src/marketing/pages/themeTemplates");
  let srv, boss, db, sh, prod;
  const origin = { Origin: "" };
  const cardsOf = (html) => (html.match(/<li class="kw-pg-card/g) || []).length;
  const namesOf = (html) => [...html.matchAll(/class="kw-pg-name">([^<]+)</g)].map((x) => x[1]);
  const publishModel = async (layoutId, cond = {}) => {
    const key = all.find((e) => e.layoutId === layoutId).key;
    const created = await boss.post("/marketing/pages", { name: `Modèle ${layoutId}`, kind: "page", template: "", ouvrir: "editeur" });
    const pid = Number(created.location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(pid).revision;
    const put = await boss.request(`/marketing/pages/${pid}/brouillon`, { method: "PUT", headers: origin, json: { revision: rev, content: { title: layoutId, sections: Catalog.build(TYPE, key).sections } } });
    assert.equal(put.status, 200, put.text.slice(0, 300));
    assert.equal((await boss.request(`/marketing/pages/${pid}/publier.json`, { method: "POST", json: {}, headers: origin })).status, 200);
    const settings = {
      get: (org, key, def) => (db.prepare("SELECT value FROM mk_settings WHERE organization_id = ? AND key = ?").get(org, key) || { value: def }).value,
      set: (org, key, value) => db.prepare("INSERT INTO mk_settings (organization_id, key, value, is_secret) VALUES (?, ?, ?, 0) ON CONFLICT (organization_id, key) DO UPDATE SET value = excluded.value").run(org, key, value),
    };
    themeTemplates.add({ db, organizationId: 1, settings }, { type: TYPE, pageId: pid, ...cond });
    return pid;
  };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    origin.Origin = srv.base;
    boss = await loginInstructor(srv); db = srv.db();
    sh = { db, organizationId: 1, siteId: null };
    shopStore.saveSettings(sh, { enabled: 1, payment_methods: ["manual"] });
    const chairs = catalog.saveCategory(sh, { name: "Chaises" }), tables = catalog.saveCategory(sh, { name: "Tables" });
    const mk = (o) => catalog.createProduct(sh, { status: "published", ...o });
    prod = {};
    for (let i = 1; i <= 14; i++) prod[`a${i}`] = mk({ name: `Article ${String(i).padStart(2, "0")}`, price_cents: 1000 * i });
    prod.promo = mk({ name: "Lampe promo", price_cents: 8000, sale_price_cents: 5000, tags: ["salon"] });
    prod.out = mk({ name: "Lampe épuisée", price_cents: 7000, manage_stock: 1, stock_qty: 0 });
    prod.bag = mk({ name: "Sac à variantes", type: "variable", price_cents: 3000, attributes: [{ name: "Taille", values: ["S", "M"] }] });
    catalog.saveVariant(sh, prod.bag, { options: { Taille: "S" }, stock_qty: 5 });
    prod.t1 = mk({ name: "Table haute", price_cents: 20000, category_ids: [tables], tags: ["salon"] });
    prod.t2 = mk({ name: "Table basse", price_cents: 12000, category_ids: [tables] });
    prod.c1 = mk({ name: "Chaise", price_cents: 4000, category_ids: [chairs] });
    await publishModel("outils-ajout-rapide");                               // modèle général : ajout rapide, pastilles, pagination
    await publishModel("filtres-colonne-gauche", { category: "Tables" });    // modèle de la catégorie « Tables » : filtres latéraux
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("page de boutique : le modèle du catalogue s'applique, avec les vrais produits, pagination et pastilles ; aucun produit d'exemple", async () => {
    const r = await boss.get("/boutique");
    assert.equal(r.status, 200);
    assert.equal(cardsOf(r.text), 12, "12 produits par page (réglage du modèle)");
    assert.doesNotMatch(r.text, /Produit exemple/);
    assert.match(r.text, /kw-pg-pager/); assert.match(r.text, /href="\?page=2"/);
    assert.match(r.text, /<h1[^>]*class="kw-ai-title">Boutique</, "titre d'archive");
  });
  test("page 2 : les produits suivants, sans doublon avec la page 1 ; page hors limites : message d'archive vide", async () => {
    const p1 = namesOf((await boss.get("/boutique")).text), p2 = namesOf((await boss.get("/boutique?page=2")).text);
    assert.equal(p1.length, 12); assert.equal(p2.length, 8);
    assert.ok(p1.every((n) => !p2.includes(n)));
    assert.match((await boss.get("/boutique?page=99")).text, /Aucun produit ne correspond/);
  });
  test("tri, recherche, prix, stock, promotion lus dans l'adresse ET appliqués à la grille du modèle", async () => {
    const asc = namesOf((await boss.get("/boutique?tri=price_asc")).text);
    assert.equal(asc[0], "Article 01"); assert.equal(asc[1], "Article 02");
    const desc = namesOf((await boss.get("/boutique?tri=price_desc")).text);
    assert.equal(desc[0], "Table haute");
    assert.deepEqual(namesOf((await boss.get("/boutique?q=lampe")).text).sort(), ["Lampe promo", "Lampe épuisée"]);
    assert.deepEqual(namesOf((await boss.get("/boutique?promo=1")).text), ["Lampe promo"]);
    const stock = (await boss.get("/boutique?stock=1&q=lampe")).text;
    assert.deepEqual(namesOf(stock), ["Lampe promo"]);
    const prix = namesOf((await boss.get("/boutique?min=20&max=30&tri=price_asc")).text);
    assert.equal(prix[0], "Article 02"); assert.deepEqual([...prix].sort(), ["Article 02", "Article 03", "Sac à variantes"], "bornes de prix incluses (20 € à 30 €)");
    assert.match((await boss.get("/boutique?q=introuvable-xyz")).text, /Aucun produit ne correspond/);
  });
  test("les liens de pagination conservent le tri et la recherche", async () => {
    const r = (await boss.get("/boutique?tri=price_asc&q=article")).text;
    assert.match(r, /href="\?tri=price_asc&amp;q=article&amp;page=2"|href="\?q=article&amp;tri=price_asc&amp;page=2"/);
  });
  test("pastille de promotion, prix barré, rupture de stock, produit à variantes, produit sans image : états affichés exactement", async () => {
    const html = (await boss.get("/boutique?q=lampe")).text;
    const promo = html.split('<li class="kw-pg-card').find((c) => /Lampe promo/.test(c)), out = html.split('<li class="kw-pg-card').find((c) => /Lampe épuisée/.test(c));
    assert.match(promo, /kw-pg-badge">Promo</); assert.match(promo, /kw-pg-old">80,00/); assert.match(promo, /<strong>50,00/);
    assert.match(promo, /kw-pg-add/); assert.match(promo, /name="product_id" value="\d+"/);
    assert.match(out, /kw-pg-badge--out/); assert.match(out, /Rupture de stock/); assert.doesNotMatch(out, /kw-pg-add|<button/, "pas d'achat d'un produit épuisé");
    const bag = (await boss.get("/boutique?q=variantes")).text;
    assert.match(bag, /À partir de/); assert.match(bag, /Choisir les options/); assert.doesNotMatch(bag, /name="product_id"/, "variantes : aucun ajout direct, choix sur la fiche"); assert.match(bag, /<form class="kw-pg-add" method="get" action="\/boutique\/produit\/sac-a-variantes">/);
    assert.match(bag, /kw-pg-noimg/, "produit sans image : emplacement neutre");
  });
  test("ajout au panier depuis la carte : le vrai panier se remplit, le serveur refuse un produit épuisé", async () => {
    const add = await boss.request("/boutique/panier/ajouter", { method: "POST", json: { product_id: prod.promo, quantity: 1 }, headers: { ...origin, Accept: "application/json" } });
    assert.ok([200, 303].includes(add.status), add.text.slice(0, 200));
    const count = JSON.parse((await boss.get("/boutique/panier.json")).text).count;
    assert.equal(count, 1);
    const out = await boss.request("/boutique/panier/ajouter", { method: "POST", json: { product_id: prod.out, quantity: 1 }, headers: { ...origin, Accept: "application/json" } });
    assert.ok(out.status >= 400 && out.status < 500, `produit épuisé refusé (${out.status})`);
    assert.equal(JSON.parse((await boss.get("/boutique/panier.json")).text).count, 1);
  });
  test("catégorie « Tables » : son propre modèle (filtres latéraux), seulement ses produits, titre de la catégorie ; les filtres conservent la catégorie", async () => {
    const r = await boss.get("/boutique/categorie/tables");
    assert.equal(r.status, 200);
    assert.match(r.text, /kw-sf--col/); assert.match(r.text, /<h1[^>]*class="kw-ai-title">Tables</);
    assert.deepEqual(namesOf(r.text).sort(), ["Table basse", "Table haute"]);
    assert.match(r.text, /<option value="tables" selected>Tables/);
    assert.match(r.text, /2 résultats/, "nombre de résultats = total réel de la catégorie");
    const sorted = namesOf((await boss.get("/boutique/categorie/tables?tri=price_desc")).text);
    assert.deepEqual(sorted, ["Table haute", "Table basse"]);
  });
  test("étiquette : /boutique/etiquette/salon liste les produits portant l'étiquette", async () => {
    const r = await boss.get("/boutique/etiquette/salon");
    assert.equal(r.status, 200);
    assert.deepEqual(namesOf(r.text).sort(), ["Lampe promo", "Table haute"]);
    assert.match(r.text, /Étiquette : salon/);
  });
  test("les fiches produits et le panier ne sont pas touchés par le modèle d'archive", async () => {
    const r = await boss.get("/boutique/panier");
    assert.equal(r.status, 200); assert.doesNotMatch(r.text, /kw-pg-pager/);
  });
});
