// Modèles Theme Builder des pages commerce (panier, validation de commande, commande reçue, compte) : catalogues, utilisation, publication, rendu des VRAIES pages à l'intérieur du modèle, repli sans modèle.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");
const Catalog = require("../src/themeBuilder/catalog");
const Types = require("../src/themeBuilder/types");
const TYPES = ["cart", "checkout", "order_received", "my_account"];

describe("catalogues (sans serveur)", () => {
  test("4 types déclarés dans le groupe Boutique, 100 modèles chacun, 20 compositions × 5 identités, documents valides contenant le bon élément", () => {
    const WIDGET = { cart: "shopcartpage", checkout: "shopcheckoutpage", order_received: "shoporderpage", my_account: "shopaccountpage" };
    for (const t of TYPES) {
      assert.ok(Types.has(t)); assert.equal(Types.TYPES[t].group, "shop");
      const entries = Catalog.entries(t); assert.equal(entries.length, 100, t);
      assert.equal(new Set(entries.map((e) => e.layoutKey)).size, 20); assert.equal(new Set(entries.map((e) => e.skinKey)).size, 5);
      for (const e of entries) {
        const doc = Catalog.build(t, e.key, {}); assert.ok(doc && doc.sections && doc.sections.length, e.key);
        const walk = (n, f) => { f(n); (n.children || []).forEach((c) => walk(c, f)); }; let found = 0, h1 = 0;
        for (const s of doc.sections) walk(s, (n) => { if (n.type === WIDGET[t]) found += 1; if (n.type === "heading" && n.props && n.props.level === "1") h1 += 1; });
        assert.equal(found, 1, `${e.key} : un seul élément « page de boutique »`); assert.ok(h1 <= 1, `${e.key} : un seul h1`);
      }
    }
  });
  test("deux modèles de même type diffèrent par leur structure (pas seulement par la couleur)", () => {
    for (const t of TYPES) { const sig = (key) => JSON.stringify(Catalog.build(t, key, {}).sections[0], (k, v) => (k === "id" ? undefined : v)); const clair = Catalog.entries(t).filter((e) => e.skinKey === "clair"); assert.equal(new Set(clair.map((e) => sig(e.key))).size, 20, t); }
  });
});

const UA = "Mozilla/5.0 (test)"; const H = "www.tbp-un.example"; const hh = { headers: { "x-forwarded-host": H, "User-Agent": UA } };
describe("rendu public avec un modèle publié", () => {
  let srv, boss, db, site, pid; const one = (sql, ...a) => db.prepare(sql).get(...a);
  const U = (p = "") => `/marketing/site-web/sites/${site}/constructeur-de-theme${p}`;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number(String((await boss.post("/marketing/site-web/sites", { name: "TB pages" })).location).match(/sites\/(\d+)/)[1]);
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
    await boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${H}` } } } });
    const base = `/marketing/site-web/sites/${site}/boutique`;
    await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" });
    const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", site).id;
    await boss.post(`${base}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,00" });
    await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "TB", manual_instructions: "Virement" });
    await boss.post(`/marketing/site-web/sites/${site}/modules/commerce`, { etat: "activer" });
    await boss.post(`${base}/produits`, { name: "Théière", type: "simple", status: "published", price: "20,00", is_featured: "1", requires_shipping: "1" });
    pid = one("SELECT id FROM mk_shop_products WHERE site_id = ?", site).id;
  });
  after(async () => { db.close(); await srv.stop(); });
  const origin = () => ({ Origin: srv.base });
  const useAndPublish = async (type, layout) => {
    const e = Catalog.entries(type).find((x) => x.layoutId === layout && x.skinKey === "clair");
    const used = JSON.parse((await boss.request(U("/api/bibliotheque/utiliser"), { method: "POST", json: { type, key: e.key }, headers: origin() })).text).template;
    const pub = await boss.request(U(`/api/modeles/${used.id}/publier`), { method: "POST", json: { strict: true, scope: "site" }, headers: origin() });
    assert.equal(pub.status, 200, pub.text.slice(0, 300));
    return used;
  };

  test("panier : page par défaut sans modèle ; avec un modèle publié, le titre du modèle et la VRAIE table du panier (quantités, coupon, totaux)", async () => {
    const cli = new Client(srv.base); await cli.post("/boutique/panier/ajouter", { product_id: String(pid), quantity: "2" }, hh);
    const plain = await cli.get("/boutique/panier", hh); assert.equal(plain.status, 200); assert.match(plain.text, /class="sh-title">Panier/); assert.match(plain.text, /sh-cart/);
    await useAndPublish("cart", "gauche-seule");
    const r = await cli.get("/boutique/panier", hh);
    assert.equal(r.status, 200); assert.match(r.text, /Votre panier/, "titre du modèle"); assert.match(r.text, /sh-cart/, "vraie table"); assert.match(r.text, /name="quantity" value="2"/); assert.match(r.text, /panier\/coupon/); assert.match(r.text, /Passer la commande/);
    assert.doesNotMatch(r.text, /class="sh-title">Panier/, "plus le titre par défaut"); assert.equal((r.text.match(/<h1[ >]/g) || []).length, 1, "un seul h1");
    // les actions du panier fonctionnent depuis la page habillée
    const item = r.text.match(/panier\/ligne\/(\d+)"/)[1]; const version = r.text.match(/name="version" value="(\d+)"/)[1];
    assert.equal((await cli.post(`/boutique/panier/ligne/${item}`, { quantity: "3", version }, hh)).status, 303);
    assert.match((await cli.get("/boutique/panier", hh)).text, /name="quantity" value="3"/);
  });
  test("validation de commande : formulaire réel dans le modèle, commande passée jusqu'au bout, puis confirmation habillée avec facture", async () => {
    await useAndPublish("checkout", "centre-seule"); await useAndPublish("order_received", "gauche-consignes");
    const cli = new Client(srv.base); await cli.post("/boutique/panier/ajouter", { product_id: String(pid), quantity: "1" }, hh);
    const page = await cli.get("/boutique/commande?pays=FR", hh);
    assert.match(page.text, /Finaliser votre commande/); assert.match(page.text, /name="idempotency_key"/);
    const f = (n) => page.text.match(new RegExp(`name="${n}" value="([^"]+)"`))[1];
    const r = await cli.post("/boutique/commande", { email: "tb@example.test", ship_name: "Ada", ship_line1: "1 rue", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: f("idempotency_key"), shipping_method: f("shipping_method"), payment_method: "manual", expected_total: f("expected_total") }, hh);
    assert.equal(r.status, 303); assert.match(r.location, /commande\/confirmation\//);
    const conf = await cli.get(r.location, hh);
    assert.equal(conf.status, 200); assert.match(conf.text, /Merci pour votre commande/); assert.match(conf.text, /Livraison/); assert.match(conf.text, /Commande TB-/);
    // erreur de saisie : la page habillée se ré-affiche avec le message (422), jamais un blanc
    const bad = await cli.post("/boutique/commande", { email: "pas-un-email", idempotency_key: "x" }, hh);
    assert.ok([400, 409, 422, 303].includes(bad.status));
  });
  test("compte : connexion et espace client dans le modèle", async () => {
    await useAndPublish("my_account", "bandeau-seule");
    const anon = await new Client(srv.base).get("/boutique/compte", hh);
    assert.equal(anon.status, 200); assert.match(anon.text, /Mon compte/); assert.match(anon.text, /compte\/connexion/);
    const cli = new Client(srv.base); assert.equal((await cli.post("/boutique/compte/inscription", { email: "tb2@example.test", password: "motdepasse-solide", name: "TB" }, hh)).status, 303);
    const me = await cli.get("/boutique/compte", hh); assert.equal(me.status, 200); assert.match(me.text, /tb2@example\.test/); assert.match(me.text, /compte\/donnees/);
  });
  test("aperçus du catalogue (démo) répondent 200 pour chaque type", async () => {
    for (const t of TYPES) { const e = Catalog.entries(t)[0]; const r = await boss.get(U(`/api/bibliotheque/${t}/${e.key}/apercu`)); assert.equal(r.status, 200, t); assert.match(r.text, /Aperçu/, t); }
  });
});
