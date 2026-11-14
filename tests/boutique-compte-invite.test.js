// Sécurité des comptes clients de la boutique (VRAI serveur) : une adresse déjà utilisée par une commande invitée ne s'active pas par simple inscription ; l'activation passe par un lien envoyé à la boîte e-mail.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (test)";
const H1 = "www.compte-invite.example";

const host = (h) => ({ headers: { "x-forwarded-host": h, "User-Agent": UA } });
const s1 = host(H1);
let srv, boss, db, A, SA;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const sql = (d) => d.toISOString().slice(0, 19).replace("T", " ");
const when = (ms) => sql(new Date(Date.now() + ms)).replace(" ", "T").slice(0, 16);
const DAY = 86400000;

async function mkSite(name, hostName) {
  const id = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${id}/reglages.json`)).text);
  assert.equal((await boss.request(`/marketing/site-web/sites/${id}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${hostName}` } } } })).status, 200);
  const base = `/marketing/site-web/sites/${id}/boutique`;
  assert.equal((await boss.post(`/marketing/site-web/sites/${id}/modules/commerce`, { etat: "activer" })).status, 302);
  assert.equal((await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" })).status, 302);
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", id).id;
  assert.equal((await boss.post(`${base}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" })).status, 302);
  assert.equal((await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "MB" + id, manual_instructions: "Virement" })).status, 302);
  return { id, base };
}
const product = async (base, siteId, name) => {
  const r = await boss.post(`${base}/produits`, { name, type: "simple", status: "published", price: "30,00", manage_stock: "1", stock_qty: "50", requires_shipping: "1" });
  assert.equal(r.status, 302, String(r.text).slice(0, 200));
  return one("SELECT id, slug FROM mk_shop_products WHERE site_id = ? AND name = ?", siteId, name);
};
const rule = (base, pid, mode) => boss.post(`${base}/acces/regles`, { kind: "product", product_id: String(pid), mode });
const customer = async (host, email) => {
  const c = new Client(srv.base);
  const r = await c.post("/boutique/compte/inscription", { email, password: "motdepasse-solide", name: "Client Test" }, host);
  assert.equal(r.status, 303, String(r.text).slice(0, 200));
  return c;
};
const customerId = (siteId, email) => one("SELECT id FROM mk_shop_customers WHERE site_id = ? AND email = ?", siteId, email).id;
const add = (cli, host, pid) => cli.post("/boutique/panier/ajouter", { product_id: String(pid), quantity: "1" }, host);
const cartCount = (cli) => one("SELECT COUNT(*) n FROM mk_shop_cart_items").n; // sert avant/après
const checkout = async (cli, host, email) => {
  const page = await cli.get("/boutique/commande?pays=FR", host);
  const idem = page.text.match(/name="idempotency_key" value="([0-9a-f]+)"/)[1];
  const method = (page.text.match(/name="shipping_method" value="(\d+)"/) || assert.fail(`pas de méthode de livraison : ${page.status} ${page.text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 600)}`))[1];
  const expected = page.text.match(/name="expected_total" value="(\d+)"/)[1];
  return cli.post("/boutique/commande", { email, ship_name: "Ada Lovelace", ship_line1: "1 rue des Tests", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: idem, shipping_method: method, payment_method: "manual", expected_total: expected }, host);
};

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  A = await mkSite("Boutique Compte Invite", H1); SA = A.base;
});
after(async () => { db.close(); await srv.stop(); });


describe("compte invité", () => {
  test("l'inscription avec l'adresse d'un client invité n'ouvre aucun accès ; seul le lien reçu par e-mail active le compte", async () => {
    const p = await product(SA, A.id, "Bougie");
    const buyer = new Client(srv.base);
    await add(buyer, s1, p.id);
    const order = await checkout(buyer, s1, "victime@example.test");
    assert.equal(order.status, 303, String(order.text).slice(0, 300));
    const guest = one("SELECT * FROM mk_shop_customers WHERE site_id = ? AND email = ?", A.id, "victime@example.test");
    assert.ok(guest && !guest.password_hash, "client invité sans mot de passe");
    // Attaquant : s'inscrit avec l'adresse de la victime
    const attacker = new Client(srv.base);
    const r = await attacker.post("/boutique/compte/inscription", { email: "victime@example.test", password: "motdepasse-attaquant", name: "Pirate" }, s1);
    assert.equal(r.status, 200, "pas de redirection vers le compte");
    assert.match(r.text, /e-mail vient de vous être envoyé/);
    assert.equal(attacker.cookies.size === 0 || ![...attacker.cookies.keys()].some((k) => /client|session/i.test(k) && attacker.cookies.get(k)), true);
    assert.equal(one("SELECT password_hash FROM mk_shop_customers WHERE id = ?", guest.id).password_hash, null, "le mot de passe de l'attaquant n'a pas été posé");
    const acc = await attacker.get("/boutique/compte", s1);
    assert.doesNotMatch(acc.text, /Bougie/, "aucune commande de la victime visible");
    assert.match(acc.text, /name="password"/, "formulaire de connexion, pas le compte");
    // Le lien est dans l'e-mail destiné à la victime ; la victime choisit son mot de passe
    const mail = db.prepare("SELECT * FROM mail_outbox WHERE to_email = ? ORDER BY id DESC").get("victime@example.test");
    assert.ok(mail, "e-mail d'activation en file");
    const token = String(mail.body).match(/reinitialiser\?t=([0-9a-f]{64})/)[1];
    assert.match(String(mail.body), /https:\/\/www\.compte-invite\.example\/boutique\//, "lien à l'adresse enregistrée du site");
    const victim = new Client(srv.base);
    const done = await victim.post("/boutique/compte/reinitialiser", { t: token, password: "motdepasse-victime-1" }, s1);
    assert.ok([200, 302, 303].includes(done.status));
    const login = await victim.post("/boutique/compte/connexion", { email: "victime@example.test", password: "motdepasse-victime-1" }, s1);
    assert.equal(login.status, 303);
    // L'attaquant ne peut pas se connecter avec son mot de passe
    const bad = await new Client(srv.base).post("/boutique/compte/connexion", { email: "victime@example.test", password: "motdepasse-attaquant" }, s1);
    assert.equal(bad.status, 401);
  });
  test("une adresse inconnue crée toujours le compte immédiatement", async () => {
    const c = await customer(s1, "nouveau@example.test");
    assert.equal((await c.get("/boutique/compte", s1)).status, 200);
  });
});
