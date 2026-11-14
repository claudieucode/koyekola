// Comparateur de produits (service + parcours serveur) sur un VRAI serveur.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const compare = require("../src/marketing/shop/compare");
const { startServer, Client, loginInstructor } = require("./helpers");

const HOST = "www.comparateur-shop.example";
const site = { headers: { "x-forwarded-host": HOST, "User-Agent": "Mozilla/5.0 (test)" } };
let srv, boss, db, siteId, SA;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1].replace(/\\u003c/g, "<").replace(/\\u003e/g, ">").replace(/\\u0026/g, "&")));
const product = async (name, extra = {}) => {
  const r = await boss.post(`${SA}/produits`, { name, type: "simple", status: "published", price: "49,00", manage_stock: "1", stock_qty: "50", requires_shipping: "1", ...extra });
  assert.equal(r.status, 302, String(r.text).slice(0, 200));
  return one("SELECT id, slug FROM mk_shop_products WHERE site_id = ? AND name = ?", siteId, name);
};
before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Boutique Comparateur" })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${siteId}/reglages.json`)).text);
  assert.equal((await boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${HOST}` } } } })).status, 200);
  SA = `/marketing/site-web/sites/${siteId}/boutique`;
  assert.equal((await boss.post(`/marketing/site-web/sites/${siteId}/modules/commerce`, { etat: "activer" })).status, 302);
  assert.equal((await boss.post(`${SA}/livraison/zones`, { name: "France", countries: "FR" })).status, 302);
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", siteId).id;
  assert.equal((await boss.post(`${SA}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" })).status, 302);
  assert.equal((await boss.post(`${SA}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "CMP", reviews_enabled: "1", manual_instructions: "Virement" })).status, 302);
});
after(async () => { db.close(); await srv.stop(); });


describe("service : caractéristiques", () => {
  test("lecture de lignes « Libellé: valeur », limites et erreurs", () => {
    assert.deepEqual(compare.parseSpecs("Poids: 250 g\n\nMatière : <b>coton</b>"), [{ label: "Poids", value: "250 g" }, { label: "Matière", value: "b coton /b" }]);
    assert.throws(() => compare.parseSpecs("sans deux points"), /Libellé: valeur/);
    assert.throws(() => compare.parseSpecs("A: 1\na: 2"), /deux fois/);
    assert.throws(() => compare.parseSpecs(Array.from({ length: 21 }, (_, i) => `L${i}: v`).join("\n")), /20 caractéristiques/);
    assert.deepEqual(compare.parseCookie("3.3.x.5.-1.7.8.9"), [3, 5, 7, 8]);
  });
});

describe("comparateur sur le serveur", () => {
  test("admin : enregistrer des caractéristiques ; refus d'une saisie invalide", async () => {
    const p = await product("Casque Alpha", { price: "100,00", sale_price: "80,00", short_description: "Léger" });
    const r = await boss.post(`${SA}/produits/${p.id}/specifications`, { specs: "Poids: 250 g\nAutonomie: 30 h" });
    assert.equal(r.status, 302);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_product_specs WHERE product_id = ?", p.id).n, 2);
    assert.match((await boss.get(`${SA}/produits/${p.id}`)).text, /Autonomie: 30 h/);
    const bad = await boss.post(`${SA}/produits/${p.id}/specifications`, { specs: "pas de séparateur" });
    assert.notEqual(bad.status, 500);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_product_specs WHERE product_id = ?", p.id).n, 2);
  });

  test("ajouter 2 produits, 5e refusé, page avec specs et différences, JSON, retrait, vider", async () => {
    const a = one("SELECT id, slug FROM mk_shop_products WHERE site_id = ? AND name = 'Casque Alpha'", siteId);
    const b = await product("Casque Beta", { price: "120,00", manage_stock: "1", stock_qty: "0" });
    assert.equal((await boss.post(`${SA}/produits/${b.id}/specifications`, { specs: "Poids: 250 g\nCouleur: Noir" })).status, 302);
    const cli = new Client(srv.base);
    assert.match((await cli.get(`/boutique/produit/${a.slug}`, site)).text, /Comparer ce produit/);
    assert.match((await cli.get("/boutique/comparer", site)).text, /Aucun produit à comparer/);
    for (const x of [a, b]) {
      const r = await cli.post("/boutique/comparer/ajouter", { product_id: x.id, retour: `/boutique/produit/${x.slug}` }, site);
      assert.equal(r.status, 303); assert.equal(r.location, `/boutique/produit/${x.slug}`);
    }
    assert.match((await cli.get(`/boutique/produit/${a.slug}`, site)).text, /Retirer de la comparaison/);
    const page = await cli.get("/boutique/comparer", site);
    assert.equal(page.status, 200);
    for (const t of ["Casque Alpha", "Casque Beta", "Autonomie", "30 h", "Couleur", "Noir", "Rupture de stock", "En stock", 'scope="col"', 'scope="row"']) assert.ok(page.text.includes(t), t);
    // Poids identique => pas de différence ; Couleur / prix / disponibilité => différence
    const row = (label) => page.text.match(new RegExp(`<tr[^>]*>\\s*<th scope="row">${label}[\\s\\S]*?</tr>`))[0];
    assert.doesNotMatch(row("Poids"), /Différence/);
    assert.match(row("Couleur"), /Différence/);
    assert.match(row("Prix"), /Différence/);
    assert.match(row("Disponibilité"), /Différence/);
    assert.match(page.text, /80,00/);
    const json = JSON.parse((await cli.get("/boutique/comparer.json", site)).text);
    assert.equal(json.count, 2); assert.equal(json.products[0].name, "Casque Alpha");
    assert.ok(json.rows.find((r) => r.label === "Couleur" && r.differs));
    // 3e et 4e passent, 5e refusé
    for (const n of ["C3", "C4"]) { const x = await product(n); assert.equal((await cli.post("/boutique/comparer/ajouter", { product_id: x.id }, site)).status, 303); }
    const fifth = await product("C5");
    const refus = await cli.post("/boutique/comparer/ajouter", { product_id: fifth.id }, site);
    assert.match(refus.location, /erreur=/);
    const rj = await cli.request("/boutique/comparer/ajouter", { method: "POST", form: { product_id: fifth.id }, headers: { ...site.headers, accept: "application/json" } });
    assert.equal(rj.status, 422);
    assert.equal(JSON.parse((await cli.get("/boutique/comparer.json", site)).text).count, 4);
    // déjà présent : pas de doublon
    await cli.post("/boutique/comparer/ajouter", { product_id: a.id }, site);
    assert.equal(JSON.parse((await cli.get("/boutique/comparer.json", site)).text).count, 4);
    // retrait puis le 5e passe
    assert.equal((await cli.post("/boutique/comparer/retirer", { product_id: a.id }, site)).status, 303);
    assert.doesNotMatch((await cli.get("/boutique/comparer", site)).text, /Casque Alpha/);
    assert.equal((await cli.post("/boutique/comparer/ajouter", { product_id: fifth.id }, site)).status, 303);
    assert.equal((await cli.post("/boutique/comparer/vider", {}, site)).status, 303);
    assert.match((await cli.get("/boutique/comparer", site)).text, /Aucun produit à comparer/);
  });

  test("produit inconnu / brouillon refusé, retour externe ignoré, HTML échappé, autre navigateur vide", async () => {
    const cli = new Client(srv.base);
    assert.match((await cli.post("/boutique/comparer/ajouter", { product_id: "999999" }, site)).location, /erreur=/);
    const draft = await product("Brouillon", { status: "draft" });
    assert.match((await cli.post("/boutique/comparer/ajouter", { product_id: draft.id }, site)).location, /erreur=/);
    const x = await product("Ecran <i>XL</i>");
    assert.equal((await cli.post("/boutique/comparer/ajouter", { product_id: x.id, retour: "https://evil.example/" }, site)).location, "/boutique/comparer");
    const page = await cli.get("/boutique/comparer", site);
    assert.doesNotMatch(page.text, /Ecran <i>XL/);
    assert.doesNotMatch((await new Client(srv.base).get("/boutique/comparer", site)).text, /Ecran/);
  });

  test("isolation : le cookie ne vaut rien sur un autre site", async () => {
    const x = one("SELECT id FROM mk_shop_products WHERE site_id = ? AND name LIKE 'Ecran%'", siteId);
    const cli = new Client(srv.base);
    await cli.post("/boutique/comparer/ajouter", { product_id: x.id }, site);
    assert.match((await cli.get("/boutique/comparer", site)).text, /Ecran/);
    const other = await cli.get("/boutique/comparer", { headers: { "User-Agent": "Mozilla/5.0 (test)" } });
    assert.doesNotMatch(other.text, /Ecran/);
    const forged = await cli.post("/boutique/comparer/ajouter", { product_id: x.id }, { headers: { "User-Agent": "Mozilla/5.0 (test)" } });
    assert.ok(forged.status === 404 || /erreur=/.test(forged.location || ""), String(forged.status));
  });
});
