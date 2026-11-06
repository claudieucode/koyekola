// Briques de boutique (avis vérifiés + données Google, personnalisation par ligne, liste de souhaits) sur un VRAI serveur.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const HOST = "www.briques-shop.example";
const site = { headers: { "x-forwarded-host": HOST, "User-Agent": "Mozilla/5.0 (test)" } };
let srv, boss, db, siteId, SA;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1].replace(/\\u003c/g, "<").replace(/\\u003e/g, ">").replace(/\\u0026/g, "&")));
const product = async (name, extra = {}) => {
  const r = await boss.post(`${SA}/produits`, { name, type: "simple", status: "published", price: "49,00", manage_stock: "1", stock_qty: "50", requires_shipping: "1", ...extra });
  assert.equal(r.status, 302, String(r.text).slice(0, 200));
  return one("SELECT id, slug FROM mk_shop_products WHERE site_id = ? AND name = ?", siteId, name);
};
const buy = async (cli, items, email = "acheteur@example.test") => {
  for (const it of items) { const r = await cli.post("/boutique/panier/ajouter", { quantity: "1", ...it }, site); assert.equal(r.status, 303, r.location); assert.doesNotMatch(r.location, /erreur/); }
  const page = await cli.get("/boutique/commande?pays=FR", site);
  const idem = page.text.match(/name="idempotency_key" value="([0-9a-f]+)"/)[1];
  const method = page.text.match(/name="shipping_method" value="(\d+)"/)[1];
  const expected = page.text.match(/name="expected_total" value="(\d+)"/)[1];
  const r = await cli.post("/boutique/commande", { email, ship_name: "Ada Lovelace", ship_line1: "1 rue des Tests", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: idem, shipping_method: method, payment_method: "manual", expected_total: expected }, site);
  assert.equal(r.status, 303, String(r.text).slice(0, 300));
  return r.location.replace(/^https?:\/\/[^/]+/, "");
};

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Boutique Briques" })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${siteId}/reglages.json`)).text);
  assert.equal((await boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${HOST}` } } } })).status, 200);
  SA = `/marketing/site-web/sites/${siteId}/boutique`;
  assert.equal((await boss.post(`${SA}/livraison/zones`, { name: "France", countries: "FR" })).status, 302);
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", siteId).id;
  assert.equal((await boss.post(`${SA}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" })).status, 302);
  assert.equal((await boss.post(`${SA}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "BRQ", reviews_enabled: "1", manual_instructions: "Virement" })).status, 302);
  assert.equal((await boss.post(`/marketing/site-web/sites/${siteId}/modules/commerce`, { etat: "activer" })).status, 302);
});
after(async () => { db.close(); await srv.stop(); });

describe("données structurées Google", () => {
  test("fiche produit : Product + Offer + BreadcrumbList, et AUCUNE note tant qu'il n'y a pas d'avis publié", async () => {
    const p = await product("Stylo plume");
    const page = await new Client(srv.base).get(`/boutique/produit/${p.slug}`, site);
    assert.equal(page.status, 200);
    const docs = ld(page.text);
    const prod = docs.find((d) => d["@type"] === "Product");
    assert.ok(prod); assert.equal(prod.offers["@type"], "Offer"); assert.equal(prod.offers.price, "49.00"); assert.equal(prod.offers.priceCurrency, "EUR");
    assert.equal(prod.offers.availability, "https://schema.org/InStock");
    assert.ok(prod.offers.url.startsWith(`https://${HOST}/boutique/produit/`) || prod.offers.url.includes("/boutique/produit/"));
    assert.equal(prod.aggregateRating, undefined); assert.equal(prod.review, undefined);
    const bc = docs.find((d) => d["@type"] === "BreadcrumbList");
    assert.ok(bc); assert.equal(bc.itemListElement.at(-1).name, "Stylo plume"); assert.equal(bc.itemListElement[0].position, 1);
    assert.match(page.text, /Aucun avis pour le moment/);
  });
});

describe("personnalisation par ligne (gravure)", () => {
  test("texte obligatoire, longueur limitée, une ligne par texte, copié sur la commande", async () => {
    const p = await product("Montre gravable");
    const plain = await product("Carnet simple");
    assert.equal((await boss.post(`${SA}/produits/${p.id}/personnalisation`, { enabled: "1", label: "Texte à graver", max_length: "8", required: "1", hint: "Initiales" })).status, 302);
    const fiche = await new Client(srv.base).get(`/boutique/produit/${p.slug}`, site);
    assert.match(fiche.text, /name="custom_text"/); assert.match(fiche.text, /maxlength="8"/);
    const cli = new Client(srv.base);
    const none = await cli.post("/boutique/panier/ajouter", { product_id: p.id, quantity: "1" }, site);
    assert.match(none.location, /erreur=.*obligatoire/);
    const long = await cli.post("/boutique/panier/ajouter", { product_id: p.id, quantity: "1", custom_text: "123456789" }, site);
    assert.match(long.location, /erreur=.*8%20caract/);
    const noPerso = await cli.post("/boutique/panier/ajouter", { product_id: plain.id, quantity: "1", custom_text: "x" }, site);
    assert.match(noPerso.location, /erreur=.*ne%20se%20personnalise/);
    assert.equal((await cli.post("/boutique/panier/ajouter", { product_id: p.id, quantity: "1", custom_text: "A.L." }, site)).status, 303);
    assert.equal((await cli.post("/boutique/panier/ajouter", { product_id: p.id, quantity: "1", custom_text: "A.L." }, site)).location, "/boutique/panier");
    assert.equal((await cli.post("/boutique/panier/ajouter", { product_id: p.id, quantity: "1", custom_text: "B.B." }, site)).status, 303);
    const lines = db.prepare("SELECT custom_text, quantity FROM mk_shop_cart_items WHERE product_id = ? ORDER BY id").all(p.id);
    assert.deepEqual(lines.map((l) => [l.custom_text, l.quantity]), [["A.L.", 2], ["B.B.", 1]]);
    const panier = await cli.get("/boutique/panier", site);
    assert.match(panier.text, /Texte à graver : « A\.L\. »/); assert.match(panier.text, /« B\.B\. »/);
    const done = await buy(cli, []);
    const conf = await cli.get(done, site);
    assert.match(conf.text, /Texte à graver : « B\.B\. »/);
    const items = db.prepare("SELECT custom_text, custom_label FROM mk_shop_order_items WHERE product_id = ? ORDER BY id").all(p.id);
    assert.deepEqual(items.map((i) => i.custom_text), ["A.L.", "B.B."]); assert.equal(items[0].custom_label, "Texte à graver");
    const adm = await boss.get(`${SA}/commandes/${one("SELECT order_id FROM mk_shop_order_items WHERE product_id = ?", p.id).order_id}`);
    assert.match(adm.text, /« A\.L\. »/);
  });
  test("le texte est affiché échappé (pas de balise injectée)", async () => {
    const p = await product("Bague gravable");
    await boss.post(`${SA}/produits/${p.id}/personnalisation`, { enabled: "1", label: "Message", max_length: "40" });
    const cli = new Client(srv.base);
    await cli.post("/boutique/panier/ajouter", { product_id: p.id, quantity: "1", custom_text: "<script>alert(1)</script>Bonjour" }, site);
    const panier = await cli.get("/boutique/panier", site);
    assert.doesNotMatch(panier.text, /<script>alert/);
  });
});

describe("avis vérifiés", () => {
  test("seul un acheteur payé peut donner un avis ; modération ; la note n'apparaît qu'ensuite, partout où il faut", async () => {
    const p = await product("Lampe de bureau");
    const other = await product("Lampe jamais achetée");
    const cli = new Client(srv.base);
    const conf = await buy(cli, [{ product_id: p.id }]);
    const k = conf.match(/k=([0-9a-f]+)/)[1];
    const number = decodeURIComponent(conf.match(/confirmation\/([^?]+)/)[1]);
    const url = `/boutique/avis/${encodeURIComponent(number)}/${p.id}?k=${k}`;
    // commande non payée : refus
    assert.equal((await cli.get(url, site)).status, 403);
    assert.equal((await cli.post(url, { rating: "5", body: "Super" }, site)).status, 422);
    db.prepare("UPDATE mk_shop_orders SET status = 'paid', payment_status = 'paid' WHERE number = ?").run(number);
    // mauvais jeton / produit absent de la commande
    assert.equal((await cli.get(`/boutique/avis/${encodeURIComponent(number)}/${p.id}?k=${"0".repeat(32)}`, site)).status, 404);
    assert.equal((await cli.get(`/boutique/avis/${encodeURIComponent(number)}/${other.id}?k=${k}`, site)).status, 403);
    assert.equal((await cli.post(`/boutique/avis/${encodeURIComponent(number)}/${other.id}?k=${k}`, { rating: "5", body: "x" }, site)).status, 422);
    assert.equal((await new Client(srv.base).get(url, site)).status, 200); // le jeton de la commande suffit pour un invité
    const confPage = await cli.get(conf, site);
    assert.match(confPage.text, /Donner mon avis/);
    // note invalide / vide
    assert.equal((await cli.post(url, { rating: "0", body: "x" }, site)).status, 422);
    assert.equal((await cli.post(url, { rating: "5" }, site)).status, 422);
    // avis valide, HTML retiré, à relire
    const ok = await cli.post(url, { rating: "4", title: "Très <b>bien</b>", body: "Belle lumière <script>x</script>", author_name: "Ada" }, site);
    assert.equal(ok.status, 200); assert.match(ok.text, /après relecture/);
    assert.equal((await cli.post(url, { rating: "5", body: "encore" }, site)).status, 409);
    const row = one("SELECT * FROM mk_shop_reviews WHERE product_id = ?", p.id);
    assert.equal(row.status, "pending"); assert.doesNotMatch(row.title + row.body, /</);
    // invisible tant que non publié
    const before = await new Client(srv.base).get(`/boutique/produit/${p.slug}`, site);
    assert.match(before.text, /Aucun avis pour le moment/);
    assert.equal(ld(before.text).find((d) => d["@type"] === "Product").aggregateRating, undefined);
    // modération (admin)
    assert.match((await boss.get(`${SA}/avis`)).text, /Lampe de bureau/);
    assert.equal((await boss.post(`${SA}/avis/${row.id}/statut`, { statut: "published" })).status, 302);
    const pub = await new Client(srv.base).get(`/boutique/produit/${p.slug}`, site);
    assert.match(pub.text, /Belle lumière/); assert.match(pub.text, /1 avis vérifié/);
    const prod = ld(pub.text).find((d) => d["@type"] === "Product");
    assert.equal(prod.aggregateRating.ratingValue, 4); assert.equal(prod.aggregateRating.reviewCount, 1); assert.equal(prod.review[0].reviewRating.ratingValue, 4);
    const cat = await new Client(srv.base).get("/boutique", site);
    assert.match(cat.text, /sh-rating-mini/);
    // refus → disparaît
    assert.equal((await boss.post(`${SA}/avis/${row.id}/statut`, { statut: "rejected" })).status, 302);
    assert.match((await new Client(srv.base).get(`/boutique/produit/${p.slug}`, site)).text, /Aucun avis pour le moment/);
  });
  test("un autre site ne voit rien de ces avis ni de cette boutique", async () => {
    const r = await new Client(srv.base).get("/boutique", { headers: { "User-Agent": "Mozilla/5.0 (test)" } });
    assert.doesNotMatch(r.text, /Lampe de bureau/);
  });
});

describe("liste de souhaits", () => {
  test("ajouter, lister, retirer ; propre au navigateur ; produit inconnu refusé", async () => {
    const p = await product("Vase en grès");
    const cli = new Client(srv.base);
    assert.match((await cli.get("/boutique/souhaits", site)).text, /Votre liste est vide/);
    assert.match((await cli.get(`/boutique/produit/${p.slug}`, site)).text, /Ajouter à mes souhaits/);
    const add = await cli.post("/boutique/souhaits/ajouter", { product_id: p.id, retour: `/boutique/produit/${p.slug}` }, site);
    assert.equal(add.status, 303); assert.equal(add.location, `/boutique/produit/${p.slug}`);
    assert.match((await cli.get("/boutique/souhaits", site)).text, /Vase en grès/);
    assert.match((await cli.get(`/boutique/produit/${p.slug}`, site)).text, /Retirer de mes souhaits/);
    assert.doesNotMatch((await new Client(srv.base).get("/boutique/souhaits", site)).text, /Vase en grès/);
    const bad = await cli.post("/boutique/souhaits/ajouter", { product_id: "999999" }, site);
    assert.match(bad.location, /erreur=/);
    const evil = await cli.post("/boutique/souhaits/ajouter", { product_id: p.id, retour: "https://evil.example/" }, site);
    assert.equal(evil.location, "/boutique/souhaits");
    assert.equal((await cli.post("/boutique/souhaits/retirer", { product_id: p.id }, site)).status, 303);
    assert.match((await cli.get("/boutique/souhaits", site)).text, /Votre liste est vide/);
  });
});
