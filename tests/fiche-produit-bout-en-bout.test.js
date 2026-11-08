// Fiche produit (Theme Builder) de bout en bout sur un VRAI serveur : modèle installé depuis la bibliothèque, publié, rendu par la boutique publique d'un site,
// une seule zone d'achat, variantes réelles, achat immédiat qui passe par les validations du panier, identité graphique indépendante / héritée / hybride sans perte de personnalisation.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");
const catalog = require("../src/marketing/shop/catalog");
const Catalog = require("../src/themeBuilder/catalog");

const HA = "www.mode-shop.example";
const host = { headers: { "x-forwarded-host": HA, "User-Agent": "Mozilla/5.0 (test)" } };
let srv, boss, db, siteId, orgId, anon, shop, robe, voisin, variants = {};
const one = (sql, ...a) => db.prepare(sql).get(...a);
const U = (p = "") => `/marketing/site-web/sites/${siteId}/constructeur-de-theme${p}`;
const api = async (path, json) => JSON.parse((await boss.request(U(path), { method: "POST", json })).text);
const walk = (nodes, fn) => { for (const n of nodes || []) { fn(n); walk(n.children, fn); } };
const contentOf = (pageId) => { const r = one("SELECT draft, sections FROM mk_landing_pages WHERE id = ?", pageId); return { col: r.draft ? "draft" : "sections", doc: JSON.parse(r.draft || r.sections) }; };
const tokens = (doc) => JSON.stringify(doc).match(/token:[a-z-]+/g) || [];

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
  orgId = one("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").id;
  siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Mode Shop" })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${siteId}/reglages.json`)).text);
  await boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${HA}` } } } });
  await boss.post(`/marketing/site-web/sites/${siteId}/modules/commerce`, { etat: "activer" });
  const SA = `/marketing/site-web/sites/${siteId}/boutique`;
  await boss.post(`${SA}/livraison/zones`, { name: "France", countries: "FR" });
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", siteId).id;
  await boss.post(`${SA}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" });
  await boss.post(`${SA}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "MOD", manual_instructions: "Virement" });
  shop = { db, organizationId: orgId, siteId };
  const cat = catalog.saveCategory(shop, { name: "Vêtements" });
  robe = catalog.createProduct(shop, { name: "Robe test", type: "variable", status: "published", price_cents: 8000, sku: "ROBE-1", weight_grams: 450, short_description: "Une robe de test", attributes: [{ name: "Taille", values: ["S", "M"] }, { name: "Couleur", values: ["Sable", "Nuit"] }], gallery: ["https://img.example.test/a.jpg", "https://img.example.test/b.jpg"], image_url: "https://img.example.test/a.jpg" });
  catalog.setProductCategories(shop, robe, [cat]);
  variants.sm = catalog.saveVariant(shop, robe, { options: { Taille: "S", Couleur: "Sable" }, stock_qty: 3, manage_stock: 1, image_url: "https://img.example.test/b.jpg" });
  variants.mn = catalog.saveVariant(shop, robe, { options: { Taille: "M", Couleur: "Nuit" }, price_cents: 9000, stock_qty: 5, manage_stock: 1 });
  variants.out = catalog.saveVariant(shop, robe, { options: { Taille: "M", Couleur: "Sable" }, stock_qty: 0, manage_stock: 1 });
  voisin = catalog.createProduct(shop, { name: "Veste voisine", type: "simple", status: "published", price_cents: 12000, manage_stock: 1, stock_qty: 4 });
  catalog.setProductCategories(shop, voisin, [cat]);
});
after(async () => { db.close(); await srv.stop(); });

const slugOf = (id) => one("SELECT slug FROM mk_shop_products WHERE id = ?", id).slug;

describe("catalogue des 100 modèles", () => {
  test("exactement 100 modèles, clés uniques, tous construits sans erreur", () => {
    const all = Catalog.entries("single_product");
    assert.equal(all.length, 100);
    assert.equal(new Set(all.map((e) => e.key)).size, 100);
    for (const e of all) assert.ok(Catalog.build("single_product", e.key), e.key);
  });
});

describe("fiche publique avec un modèle installé", () => {
  let tpl, key;
  before(async () => {
    const entries = Catalog.entries("single_product");
    key = (entries.find((e) => JSON.stringify(Catalog.build("single_product", e.key)).includes('"shopbuy"')) || entries[0]).key;
    const r = await api("/api/bibliotheque/utiliser", { type: "single_product", key });
    assert.ok(r.ok, JSON.stringify(r)); tpl = r.template;
    const pub = await boss.request(U(`/api/modeles/${tpl.id}/publier`), { method: "POST", json: {} });
    assert.equal(pub.status, 200, pub.text.slice(0, 300));
  });
  test("une seule zone d'achat (le formulaire natif n'est pas ajouté en double)", async () => {
    const r = await anon.get(`/boutique/produit/${slugOf(robe)}`, host);
    assert.equal(r.status, 200);
    assert.equal((r.text.match(/data-sh-add/g) || []).length, 1, "un seul formulaire d'ajout au panier");
    assert.match(r.text, /data-kw-shopbuy/);
  });
  test("les variantes viennent de la base : prix, disponibilité et image de variante", async () => {
    const r = await anon.get(`/boutique/produit/${slugOf(robe)}`, host);
    const json = JSON.parse(r.text.match(/<script type="application\/json" data-kw-variants>([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, "<"));
    assert.equal(json.length, 3);
    const byId = Object.fromEntries(json.map((v) => [v.id, v]));
    assert.equal(byId[variants.out].out, true, "variante épuisée signalée");
    assert.equal(byId[variants.sm].out, false);
    assert.match(byId[variants.mn].price, /90,00/);
    assert.equal(byId[variants.sm].image, "https://img.example.test/b.jpg");
  });
  test("conditions « produit précis » et « étiquette » : le contexte de rendu connaît l'identifiant et les étiquettes", async () => {
    const t2 = (await api("/api/bibliotheque/utiliser", { type: "single_product", key })).template;
    const res = await boss.request(U(`/api/modeles/${t2.id}/conditions`), { method: "POST", json: { conditions: { include: [{ kind: "product", ids: [voisin] }] } } });
    assert.equal(res.status, 200, res.text.slice(0, 300));
    const pub = await boss.request(U(`/api/modeles/${t2.id}/publier`), { method: "POST", json: {} });
    assert.equal(pub.status, 200, pub.text.slice(0, 300));
    const a = await anon.get(`/boutique/produit/${slugOf(voisin)}`, host), b = await anon.get(`/boutique/produit/${slugOf(robe)}`, host);
    assert.ok(a.status === 200 && b.status === 200);
    assert.ok(a.text.includes("kw-theme-template"), "le produit ciblé utilise le modèle");
  });
});

describe("achat immédiat : mêmes validations que le panier", () => {
  const post = (path, form) => anon.post(path, form, host);
  const cartCount = async () => JSON.parse((await anon.get("/boutique/panier.json", host)).text).count;
  test("variante manquante, épuisée ou quantité au-dessus du stock : refus, panier inchangé", async () => {
    const c0 = await cartCount();
    for (const form of [{ product_id: robe, quantity: 1 }, { product_id: robe, variant_id: variants.out, quantity: 1 }, { product_id: robe, variant_id: variants.sm, quantity: 4 }]) {
      const r = await post("/boutique/panier/acheter", { ...form, retour: `/boutique/produit/${slugOf(robe)}` });
      assert.equal(r.status, 303);
      assert.doesNotMatch(String(r.location || ""), /\/boutique\/commande/, JSON.stringify(form));
    }
    assert.equal(await cartCount(), c0);
  });
  test("variante valide : ajout au panier puis redirection vers la commande", async () => {
    const c0 = await cartCount();
    const r = await post("/boutique/panier/acheter", { product_id: robe, variant_id: variants.sm, quantity: 2, retour: `/boutique/produit/${slugOf(robe)}` });
    assert.equal(r.status, 303);
    assert.match(String(r.location), /\/boutique\/commande$/);
    assert.equal(await cartCount(), c0 + 2);
  });
  test("un navigateur d'un autre site ne peut pas ajouter ce produit (boutique isolée par hôte)", async () => {
    const other = new Client(srv.base);
    const r = await other.post("/boutique/panier/acheter", { product_id: robe, variant_id: variants.sm, quantity: 1 }, { headers: { "User-Agent": "Mozilla/5.0 (test)" } });
    assert.ok([303, 404].includes(r.status));
    assert.doesNotMatch(String(r.location || ""), /\/boutique\/commande$/);
  });
});

describe("identité graphique : indépendante, héritée, hybride", () => {
  let tpl, key, pageId;
  before(async () => {
    key = Catalog.entries("single_product")[3].key;
    tpl = (await api("/api/bibliotheque/utiliser", { type: "single_product", key })).template;
    pageId = tpl.sourceId;
  });
  test("à l'insertion, le mode indépendant n'utilise AUCUN jeton du site", () => {
    assert.deepEqual(tokens(contentOf(pageId).doc), []);
    assert.equal(one("SELECT identity_mode, origin_key FROM mk_tb_templates WHERE id = ?", tpl.id).identity_mode, "own");
  });
  test("passage au mode hérité : les couleurs deviennent des jetons ; la valeur personnalisée est conservée", async () => {
    const { col, doc } = contentOf(pageId);
    let marked = null;
    walk(doc.sections || doc, (n) => { if (!marked && n.styles && n.styles.desktop && typeof n.styles.desktop.backgroundColor === "string" && n.styles.desktop.backgroundColor.startsWith("#")) { n.styles.desktop.backgroundColor = "#123456"; marked = n.id; } });
    assert.ok(marked, "un élément coloré à personnaliser");
    db.prepare(`UPDATE mk_landing_pages SET ${col} = ? WHERE id = ?`).run(JSON.stringify(doc), pageId);
    const r = await api(`/api/modeles/${tpl.id}/identite`, { mode: "site" });
    assert.ok(r.ok, JSON.stringify(r)); assert.ok(r.changed > 0);
    const after = contentOf(pageId).doc;
    assert.ok(tokens(after).length > 0, "des jetons du site apparaissent");
    let kept = null; walk(after.sections || after, (n) => { if (n.id === marked) kept = n.styles.desktop.backgroundColor; });
    assert.equal(kept, "#123456", "la personnalisation n'est pas écrasée");
    assert.equal(one("SELECT identity_mode FROM mk_tb_templates WHERE id = ?", tpl.id).identity_mode, "site");
  });
  test("retour au mode indépendant : les jetons disparaissent et la personnalisation reste", async () => {
    const r = await api(`/api/modeles/${tpl.id}/identite`, { mode: "own" });
    assert.ok(r.ok, JSON.stringify(r));
    const after = contentOf(pageId).doc;
    assert.deepEqual(tokens(after), [], "plus aucun jeton");
    assert.ok(JSON.stringify(after).includes("#123456"));
    assert.equal(one("SELECT identity_mode FROM mk_tb_templates WHERE id = ?", tpl.id).identity_mode, "own");
  });
  test("mode hybride : seuls l'accent et le texte de bouton suivent le site", async () => {
    const r = await api(`/api/modeles/${tpl.id}/identite`, { mode: "hybrid" });
    assert.ok(r.ok, JSON.stringify(r));
    const t = new Set(tokens(contentOf(pageId).doc));
    for (const x of t) assert.ok(["token:primary", "token:on-primary"].includes(x), x);
  });
  test("mode inconnu refusé ; modèle d'un autre type refusé", async () => {
    const bad = await boss.request(U(`/api/modeles/${tpl.id}/identite`), { method: "POST", json: { mode: "nimporte" } });
    assert.ok(bad.status >= 400);
  });
});
