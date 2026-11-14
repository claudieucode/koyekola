// Contrôle d'âge légal sur un VRAI serveur : ajout refusé sans déclaration, accepté avec, case obligatoire à la commande, enregistrement sur la commande.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const HOST = "www.age-shop.example";
const site = { headers: { "x-forwarded-host": HOST, "User-Agent": "Mozilla/5.0 (test)" } };
let srv, boss, db, siteId, SA;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const product = async (name, extra = {}) => {
  const r = await boss.post(`${SA}/produits`, { name, type: "simple", status: "published", price: "12,00", manage_stock: "1", stock_qty: "50", requires_shipping: "1", ...extra });
  assert.equal(r.status, 302, String(r.text).slice(0, 200));
  return one("SELECT id, slug FROM mk_shop_products WHERE site_id = ? AND name = ?", siteId, name);
};
const setAge = async (p, n) => assert.equal((await boss.post(`${SA}/produits/${p.id}/age`, { min_age: String(n) })).status, 302);
// Valeur du cookie d'âge reçu (en-tête Set-Cookie) pour le rejouer
const ageCookie = (r) => { const raw = r.headers.getSetCookie().join(";"); const m = raw.match(/kola_age=([^;]+)/); return m ? m[1] : null; };
const checkout = async (cli, extra = {}) => {
  const page = await cli.get("/boutique/commande?pays=FR", site);
  const idem = page.text.match(/name="idempotency_key" value="([0-9a-f]+)"/)[1];
  const method = page.text.match(/name="shipping_method" value="(\d+)"/)[1];
  const expected = page.text.match(/name="expected_total" value="(\d+)"/)[1];
  const r = await cli.post("/boutique/commande", { email: "majeur@example.test", ship_name: "Ada Lovelace", ship_line1: "1 rue des Tests", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: idem, shipping_method: method, payment_method: "manual", expected_total: expected, ...extra }, site);
  return { page, r };
};

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Boutique Age" })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${siteId}/reglages.json`)).text);
  assert.equal((await boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${HOST}` } } } })).status, 200);
  SA = `/marketing/site-web/sites/${siteId}/boutique`;
  assert.equal((await boss.post(`/marketing/site-web/sites/${siteId}/modules/commerce`, { etat: "activer" })).status, 302);
  assert.equal((await boss.post(`${SA}/livraison/zones`, { name: "France", countries: "FR" })).status, 302);
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", siteId).id;
  assert.equal((await boss.post(`${SA}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" })).status, 302);
  assert.equal((await boss.post(`${SA}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "AGE", manual_instructions: "Virement" })).status, 302);
});
after(async () => { db.close(); await srv.stop(); });

describe("contrôle d'âge", () => {
  test("réglage invalide refusé ; la fiche reste consultable avec l'encadré et le choix", async () => {
    const p = await product("Vin rouge");
    const bad = await boss.post(`${SA}/produits/${p.id}/age`, { min_age: "17" });
    assert.equal(bad.status, 302); // erreur affichée en message, rien n'est enregistré
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_product_age WHERE product_id = ?", p.id).n, 0);
    await setAge(p, 18);
    const fiche = await new Client(srv.base).get(`/boutique/produit/${p.slug}`, site);
    assert.equal(fiche.status, 200);
    assert.match(fiche.text, /réservé aux personnes de 18 ans et plus/);
    assert.match(fiche.text, /Je confirme avoir au moins 18 ans/); assert.match(fiche.text, /Je n(?:'|&#39;)ai pas 18 ans/);
    assert.doesNotMatch(fiche.text, /Ajouter au panier/);
    const cat = await new Client(srv.base).get("/boutique", site);
    assert.equal(cat.status, 200); assert.match(cat.text, /Vin rouge/);
    const adm = await boss.get(`${SA}/produits/${p.id}`);
    assert.match(adm.text, /sans vérification d.identité/);
  });

  test("ajout au panier refusé côté serveur sans déclaration, accepté avec ; cookie signé inutilisable falsifié", async () => {
    const p = await product("Whisky"); await setAge(p, 18);
    const cli = new Client(srv.base);
    const refus = await cli.post("/boutique/panier/ajouter", { product_id: p.id, quantity: "1", retour: `/boutique/produit/${p.slug}` }, site);
    assert.equal(refus.status, 303); assert.match(refus.location, /\/boutique\/age\?p=/);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_cart_items WHERE product_id = ?", p.id).n, 0);
    const json = await cli.post("/boutique/panier/ajouter", { product_id: p.id, quantity: "1" }, { headers: { ...site.headers, accept: "application/json" } });
    assert.equal(json.status, 422); assert.match(json.text, /age_required/);
    // « Je n'ai pas N ans » : aucun cookie, aucun achat
    const non = await cli.post("/boutique/age", { p: p.id, choix: "non" }, site);
    assert.equal(non.status, 200); assert.match(non.text, /ne pouvez pas l.acheter/); assert.equal(ageCookie(non), null);
    // cookie falsifié (âge 21 forgé) : refusé
    const forged = new Client(srv.base);
    const f = await forged.post("/boutique/panier/ajouter", { product_id: p.id, quantity: "1" }, { headers: { ...site.headers, cookie: `kola_age=21.9999999999.${"a".repeat(32)}` } });
    assert.match(f.location, /\/boutique\/age/);
    // déclaration valide
    const oui = await cli.post("/boutique/age", { p: p.id, choix: "oui", retour: `/boutique/produit/${p.slug}` }, site);
    assert.equal(oui.status, 303); assert.equal(oui.location, `/boutique/produit/${p.slug}`);
    assert.match(ageCookie(oui) || "", /^18\./);
    const fiche = await cli.get(`/boutique/produit/${p.slug}`, site);
    assert.match(fiche.text, /Ajouter au panier/);
    const ok = await cli.post("/boutique/panier/ajouter", { product_id: p.id, quantity: "1" }, site);
    assert.equal(ok.status, 303); assert.equal(ok.location, "/boutique/panier");
    assert.equal(one("SELECT SUM(quantity) AS n FROM mk_shop_cart_items WHERE product_id = ?", p.id).n, 1);
    // le cookie d'une autre boutique/âge supérieur n'est pas transposable : 18 ne suffit pas pour un produit 21
    const strong = await product("Rhum 21"); await setAge(strong, 21);
    const r21 = await cli.post("/boutique/panier/ajouter", { product_id: strong.id, quantity: "1" }, site);
    assert.match(r21.location, /\/boutique\/age/);
  });

  test("à la commande : case non précochée exigée côté serveur, puis déclaration enregistrée sur la commande et visible dans l'admin", async () => {
    const p = await product("Bière artisanale"); await setAge(p, 18);
    const cli = new Client(srv.base);
    assert.equal((await cli.post("/boutique/age", { p: p.id, choix: "oui" }, site)).status, 303);
    assert.equal((await cli.post("/boutique/panier/ajouter", { product_id: p.id, quantity: "1" }, site)).status, 303);
    const sans = await checkout(cli);
    assert.match(sans.page.text, /name="age_confirm"/); assert.doesNotMatch(sans.page.text, /name="age_confirm"[^>]*checked/);
    assert.equal(sans.r.status, 422); assert.match(sans.r.text, /au moins 18 ans/);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_order_items WHERE product_id = ?", p.id).n, 0);
    const avec = await checkout(cli, { age_confirm: "1" });
    assert.equal(avec.r.status, 303, String(avec.r.text).slice(0, 200));
    const o = one("SELECT o.id, o.age_confirmed_at, o.age_confirmed_min FROM mk_shop_orders o JOIN mk_shop_order_items i ON i.order_id = o.id WHERE i.product_id = ?", p.id);
    assert.equal(o.age_confirmed_min, 18); assert.match(o.age_confirmed_at, /^\d{4}-\d\d-\d\d /);
    const adm = await boss.get(`${SA}/commandes/${o.id}`);
    assert.match(adm.text, /Contrôle d.âge/); assert.match(adm.text, /au moins 18 ans/);
  });

  test("l'âge d'une catégorie s'applique à ses produits (le plus élevé gagne)", async () => {
    assert.equal((await boss.post(`${SA}/categories`, { name: "Spiritueux" })).status, 302);
    const cid = one("SELECT id FROM mk_shop_categories WHERE site_id = ? AND name = 'Spiritueux'", siteId).id;
    const p = await product("Gin", { category_ids: String(cid) }); await setAge(p, 16);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_product_categories WHERE product_id = ?", p.id).n, 1);
    assert.equal((await boss.post(`${SA}/categories/${cid}/age`, { min_age: "21" })).status, 302);
    const fiche = await new Client(srv.base).get(`/boutique/produit/${p.slug}`, site);
    assert.match(fiche.text, /21 ans et plus/);
    assert.equal((await boss.post(`${SA}/categories/${cid}/age`, { min_age: "0" })).status, 302);
    assert.match((await new Client(srv.base).get(`/boutique/produit/${p.slug}`, site)).text, /16 ans et plus/);
  });

  test("un produit sans âge est inchangé : ajout et commande sans case", async () => {
    const p = await product("Stylo bille");
    const cli = new Client(srv.base);
    const fiche = await cli.get(`/boutique/produit/${p.slug}`, site);
    assert.doesNotMatch(fiche.text, /réservé aux personnes/); assert.match(fiche.text, /Ajouter au panier/);
    assert.equal((await cli.post("/boutique/panier/ajouter", { product_id: p.id, quantity: "1" }, site)).location, "/boutique/panier");
    const c = await checkout(cli);
    assert.doesNotMatch(c.page.text, /name="age_confirm"/);
    assert.equal(c.r.status, 303);
    const o = one("SELECT o.age_confirmed_at, o.age_confirmed_min FROM mk_shop_orders o JOIN mk_shop_order_items i ON i.order_id = o.id WHERE i.product_id = ?", p.id);
    assert.equal(o.age_confirmed_at, null); assert.equal(o.age_confirmed_min, null);
  });
});
