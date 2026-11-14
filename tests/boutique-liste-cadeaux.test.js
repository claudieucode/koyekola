// Liste de naissance / de cadeaux sur un VRAI serveur : lien secret, offrir, plafond, comptage seulement après paiement, remboursement, vie privée, isolation entre sites.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const HOST = "www.cadeaux-shop.example";
const HOST2 = "www.cadeaux-autre.example";
const site = { headers: { "x-forwarded-host": HOST, "User-Agent": "Mozilla/5.0 (test)" } };
const site2 = { headers: { "x-forwarded-host": HOST2, "User-Agent": "Mozilla/5.0 (test)" } };
let srv, boss, db, siteId, siteId2, SA, SA2;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const path = (loc) => String(loc).replace(/^https?:\/\/[^/]+/, "");

async function makeShop(name, host) {
  const id = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${id}/reglages.json`)).text);
  assert.equal((await boss.request(`/marketing/site-web/sites/${id}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } } })).status, 200);
  const base = `/marketing/site-web/sites/${id}/boutique`;
  assert.equal((await boss.post(`/marketing/site-web/sites/${id}/modules/commerce`, { etat: "activer" })).status, 302);
  assert.equal((await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" })).status, 302);
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", id).id;
  assert.equal((await boss.post(`${base}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" })).status, 302);
  assert.equal((await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "CAD", manual_instructions: "Virement" })).status, 302);
  return { id, base };
}
const product = async (name, price = "30,00") => {
  const r = await boss.post(`${SA}/produits`, { name, type: "simple", status: "published", price, manage_stock: "1", stock_qty: "50", requires_shipping: "1" });
  assert.equal(r.status, 302, String(r.text).slice(0, 200));
  return one("SELECT id, slug FROM mk_shop_products WHERE site_id = ? AND name = ?", siteId, name);
};
const ADDR = { ship_name: "Léa Martin", ship_line1: "12 impasse Secrète", ship_postal_code: "69001", ship_city: "Lyon", ship_country: "FR" };
const numbers = (html, cls) => [...html.matchAll(new RegExp(`data-sh-${cls}>(\\d+)<`, "g"))].map((m) => Number(m[1]));
// Passage en caisse d'un invité (paiement manuel => commande « en attente », jamais payée toute seule)
const checkout = async (cli, extra = {}, email = "invite@example.test") => {
  const page = await cli.get("/boutique/commande?pays=FR", site);
  const idem = page.text.match(/name="idempotency_key" value="([0-9a-f]+)"/)[1];
  const method = page.text.match(/name="shipping_method" value="(\d+)"/)[1];
  const expected = page.text.match(/name="expected_total" value="(\d+)"/)[1];
  return cli.post("/boutique/commande", { email, ship_name: "Invité Test", ship_line1: "1 rue des Tests", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: idem, shipping_method: method, payment_method: "manual", expected_total: expected, ...extra }, site);
};

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  const a = await makeShop("Boutique Cadeaux", HOST); siteId = a.id; SA = a.base;
  const b = await makeShop("Autre Boutique", HOST2); siteId2 = b.id; SA2 = b.base;
});
after(async () => { db.close(); await srv.stop(); });

let pub, manage, M, list, item, poussette;

describe("liste de cadeaux", () => {
  test("création par un invité : lien public secret + lien de gestion privé", async () => {
    poussette = await product("Poussette", "30,00");
    const cli = new Client(srv.base);
    assert.equal((await cli.get("/boutique/listes", site)).status, 200);
    const bad = await cli.post("/boutique/listes", { title: "" }, site);
    assert.equal(bad.status, 422);
    const half = await cli.post("/boutique/listes", { title: "X", ship_name: "Léa", allow_recipient_delivery: "1" }, site);
    assert.equal(half.status, 422);
    const r = await cli.post("/boutique/listes", { title: "Naissance de <b>Léa</b>", message: "Merci d'avance", owner_email: "lea@example.test", allow_recipient_delivery: "1", ...ADDR }, site);
    assert.equal(r.status, 303);
    manage = path(r.location);
    const m = manage.match(/^\/boutique\/liste\/([0-9a-f]{40})\/gerer\?m=([0-9a-f]{48})/);
    assert.ok(m, manage);
    [, pub, M] = m;
    list = one("SELECT * FROM mk_shop_gift_lists WHERE public_token = ?", pub);
    assert.equal(list.site_id, siteId);
    assert.doesNotMatch(list.manage_token_hash, new RegExp(M)); // le secret de gestion n'est jamais stocké en clair
    assert.equal(list.title.includes("<"), false);
  });
  test("le lien public se devine pas ; la gestion exige le secret", async () => {
    const cli = new Client(srv.base);
    assert.equal((await cli.get(`/boutique/liste/${"0".repeat(40)}`, site)).status, 404);
    assert.equal((await cli.get("/boutique/liste/abc", site)).status, 404);
    assert.equal((await cli.get(`/boutique/liste/${pub}/gerer`, site)).status, 403);
    assert.equal((await cli.get(`/boutique/liste/${pub}/gerer?m=${"1".repeat(48)}`, site)).status, 403);
    assert.equal((await cli.post(`/boutique/liste/${pub}/gerer/article`, { choice: `${poussette.id}:`, wanted: "2" }, site)).status, 403);
    assert.equal((await cli.get(manage, site)).status, 200);
  });
  test("ajouter un article souhaité (quantité 3) ; la page publique montre souhaités / offerts / restants réels", async () => {
    const cli = new Client(srv.base);
    assert.equal((await cli.post(`/boutique/liste/${pub}/gerer/article`, { m: M, choice: `${poussette.id}:`, wanted: "3" }, site)).status, 303);
    assert.equal((await cli.post(`/boutique/liste/${pub}/gerer/article`, { m: M, choice: `${poussette.id}:`, wanted: "0" }, site)).status, 422);
    item = one("SELECT * FROM mk_shop_gift_items WHERE list_id = ?", list.id);
    assert.equal(item.wanted, 3); assert.equal(item.offered, 0);
    const page = await new Client(srv.base).get(`/boutique/liste/${pub}`, site);
    assert.equal(page.status, 200);
    assert.match(page.text, /Poussette/); assert.match(page.text, /Naissance de/);
    assert.deepEqual([numbers(page.text, "wanted"), numbers(page.text, "offered"), numbers(page.text, "remaining")], [[3], [0], [3]]);
    assert.doesNotMatch(page.text, /impasse Secrète|Lyon|69001/); // vie privée : jamais l'adresse du bénéficiaire
    assert.match(page.text, /noindex/);
  });
  test("offrir : la ligne arrive au panier AVEC la référence de liste, mais rien n'est compté avant paiement", async () => {
    const g = new Client(srv.base);
    const r = await g.post(`/boutique/liste/${pub}/offrir`, { item_id: item.id, quantity: "2", from_name: "Tante Zoé", note: "Bienvenue petite Léa" }, site);
    assert.equal(r.location, "/boutique/panier");
    const line = one("SELECT ci.quantity, k.gift_item_id FROM mk_shop_gift_cart_links k JOIN mk_shop_cart_items ci ON ci.id = k.cart_item_id");
    assert.equal(line.quantity, 2); assert.equal(line.gift_item_id, item.id);
    assert.match((await g.get("/boutique/panier", site)).text, /Cadeau pour la liste/);
    assert.equal(one("SELECT offered FROM mk_shop_gift_items WHERE id = ?", item.id).offered, 0);
    // plafond au panier
    const over = await g.post(`/boutique/liste/${pub}/offrir`, { item_id: item.id, quantity: "2" }, site);
    assert.match(over.location, /erreur=.*reste/);
    // un article hors de la liste (id d'une autre liste/inexistant) est refusé
    assert.match((await g.post(`/boutique/liste/${pub}/offrir`, { item_id: "99999", quantity: "1" }, site)).location, /erreur=/);
  });
  test("commande en attente : livraison chez le bénéficiaire SANS révéler l'adresse ; offert reste à 0 tant que non payée", async () => {
    const g = new Client(srv.base);
    await g.post(`/boutique/liste/${pub}/offrir`, { item_id: item.id, quantity: "2", from_name: "Tante Zoé", note: "Bienvenue petite Léa" }, site);
    const cp = await g.get("/boutique/commande?pays=FR", site);
    assert.match(cp.text, /Livrer chez le bénéficiaire/); assert.doesNotMatch(cp.text, /impasse Secrète|Lyon/);
    const r = await checkout(g, { gift_delivery: "recipient" });
    assert.equal(r.status, 303, String(r.text).slice(0, 300));
    const order = one("SELECT * FROM mk_shop_orders WHERE site_id = ? ORDER BY id DESC", siteId);
    assert.equal(order.status, "pending");
    assert.equal(JSON.parse(order.shipping_address).line1, "12 impasse Secrète"); // le vendeur la voit sur la commande
    assert.equal(one("SELECT offered FROM mk_shop_gift_items WHERE id = ?", item.id).offered, 0);
    const conf = await g.get(path(r.location), site);
    assert.doesNotMatch(conf.text, /impasse Secrète|Lyon/); // l'invité ne la voit pas non plus
    const pubPage = await new Client(srv.base).get(`/boutique/liste/${pub}`, site);
    assert.deepEqual([numbers(pubPage.text, "offered"), numbers(pubPage.text, "remaining")], [[0], [3]]);
    assert.match((await boss.get(`${SA}/commandes/${order.id}`)).text, /impasse Secrète/);
    // les 2 unités sont réservées : un autre invité ne peut offrir que la dernière
    const g2 = new Client(srv.base);
    assert.match((await g2.post(`/boutique/liste/${pub}/offrir`, { item_id: item.id, quantity: "2" }, site)).location, /erreur=.*reste/);
    assert.equal((await g2.post(`/boutique/liste/${pub}/offrir`, { item_id: item.id, quantity: "1" }, site)).location, "/boutique/panier");
    // paiement confirmé par le vendeur => seulement maintenant « offert » augmente
    assert.equal((await boss.post(`${SA}/commandes/${order.id}/statut`, { statut: "paid" })).status, 302);
    assert.equal(one("SELECT offered FROM mk_shop_gift_items WHERE id = ?", item.id).offered, 2);
    const after = await new Client(srv.base).get(`/boutique/liste/${pub}`, site);
    assert.deepEqual([numbers(after.text, "wanted"), numbers(after.text, "offered"), numbers(after.text, "remaining")], [[3], [2], [1]]);
    // idempotent : un second « payé » ne recompte pas
    assert.equal((await boss.post(`${SA}/commandes/${order.id}/statut`, { statut: "processing" })).status, 302);
    assert.equal(one("SELECT offered FROM mk_shop_gift_items WHERE id = ?", item.id).offered, 2);
    // le bénéficiaire voit le mot, jamais l'e-mail ni l'adresse de l'invité
    const mp = await new Client(srv.base).get(manage, site);
    assert.match(mp.text, /Tante Zoé/); assert.match(mp.text, /Bienvenue petite Léa/);
    assert.doesNotMatch(mp.text, /invite@example\.test|1 rue des Tests/);
    // le vendeur voit la liste
    const adm = await boss.get(`${SA}/listes-cadeaux`);
    assert.equal(adm.status, 200); assert.match(adm.text, /Naissance de/); assert.match(adm.text, /2 \/ 3/); assert.doesNotMatch(adm.text, /impasse Secrète/);
  });
  test("plafond à la commande : deux invités simultanés, une seule unité restante => une seule commande passe ; annulation libère", async () => {
    const a = new Client(srv.base); const b = new Client(srv.base);
    assert.equal((await a.post(`/boutique/liste/${pub}/offrir`, { item_id: item.id, quantity: "1" }, site)).location, "/boutique/panier");
    assert.equal((await b.post(`/boutique/liste/${pub}/offrir`, { item_id: item.id, quantity: "1" }, site)).location, "/boutique/panier");
    const [ra, rb] = await Promise.all([checkout(a, {}, "a@example.test"), checkout(b, {}, "b@example.test")]);
    const ok = [ra, rb].filter((r) => r.status === 303);
    const ko = [ra, rb].filter((r) => r.status !== 303);
    assert.equal(ok.length, 1); assert.equal(ko.length, 1);
    assert.match(ko[0].text, /déjà été entièrement offert|reste/);
    const pend = one("SELECT * FROM mk_shop_orders WHERE site_id = ? AND email IN ('a@example.test','b@example.test')", siteId);
    // jamais plus que souhaité, même pour l'ancien panier de g2 (1 unité) : bloqué par la commande en attente
    assert.equal(one("SELECT offered FROM mk_shop_gift_items WHERE id = ?", item.id).offered, 2);
    // annulation de la commande en attente => l'unité redevient offrable ; rien n'a jamais été compté
    assert.equal((await boss.post(`${SA}/commandes/${pend.id}/statut`, { statut: "cancelled" })).status, 302);
    assert.equal(one("SELECT offered FROM mk_shop_gift_items WHERE id = ?", item.id).offered, 2);
    const again = new Client(srv.base);
    assert.equal((await again.post(`/boutique/liste/${pub}/offrir`, { item_id: item.id, quantity: "1" }, site)).location, "/boutique/panier");
    const rc = await checkout(again, {}, "c@example.test");
    assert.equal(rc.status, 303);
    const third = one("SELECT * FROM mk_shop_orders WHERE email = 'c@example.test'");
    assert.equal((await boss.post(`${SA}/commandes/${third.id}/statut`, { statut: "paid" })).status, 302);
    let it = one("SELECT * FROM mk_shop_gift_items WHERE id = ?", item.id);
    assert.equal(it.offered, 3); assert.equal(it.wanted, 3);
    const full = await new Client(srv.base).get(`/boutique/liste/${pub}`, site);
    assert.match(full.text, /Offert/); assert.deepEqual(numbers(full.text, "remaining"), [0]);
    assert.match((await new Client(srv.base).post(`/boutique/liste/${pub}/offrir`, { item_id: item.id, quantity: "1" }, site)).location, /erreur=.*enti%C3%A8rement/);
    // remboursement => les unités comptées sont rendues
    assert.equal((await boss.post(`${SA}/commandes/${third.id}/statut`, { statut: "refunded" })).status, 302);
    it = one("SELECT * FROM mk_shop_gift_items WHERE id = ?", item.id);
    assert.equal(it.offered, 2);
    // on ne peut pas descendre le souhaité sous l'offert, ni retirer un article déjà offert
    const cli = new Client(srv.base);
    assert.equal((await cli.post(`/boutique/liste/${pub}/gerer/article/${item.id}`, { m: M, item_id: item.id, wanted: "1" }, site)).status, 422);
    assert.equal((await cli.post(`/boutique/liste/${pub}/gerer/retirer`, { m: M, item_id: item.id }, site)).status, 422);
  });
  test("liste fermée : on ne peut plus offrir", async () => {
    const cli = new Client(srv.base);
    assert.equal((await cli.post(`/boutique/liste/${pub}/gerer/statut`, { m: M, statut: "closed" }, site)).status, 303);
    assert.match((await new Client(srv.base).post(`/boutique/liste/${pub}/offrir`, { item_id: item.id, quantity: "1" }, site)).location, /erreur=.*ferm/);
    assert.match((await new Client(srv.base).get(`/boutique/liste/${pub}`, site)).text, /liste est fermée/);
    assert.equal((await cli.post(`/boutique/liste/${pub}/gerer/statut`, { m: M, statut: "active" }, site)).status, 303);
  });
  test("isolation entre sites : le lien, la gestion et l'admin d'un autre site ne montrent rien", async () => {
    const cli = new Client(srv.base);
    assert.equal((await cli.get(`/boutique/liste/${pub}`, site2)).status, 404);
    assert.equal((await cli.get(`/boutique/liste/${pub}/gerer?m=${M}`, site2)).status, 404);
    assert.equal((await cli.post(`/boutique/liste/${pub}/offrir`, { item_id: item.id, quantity: "1" }, site2)).status, 404);
    assert.doesNotMatch((await boss.get(`${SA2}/listes-cadeaux`)).text, /Naissance de/);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM mk_shop_gift_lists WHERE site_id = ?").get(siteId2).n, 0);
  });
});
