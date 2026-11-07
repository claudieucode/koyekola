// Créneaux de livraison (livraison réfrigérée) sur un VRAI serveur : génération, capacité, délai minimum, refus si complet, enregistrement sur la commande.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");
const slotsSvc = require("../src/marketing/shop/deliverySlots");

const HOST = "www.creneaux-shop.example";
const site = { headers: { "x-forwarded-host": HOST, "User-Agent": "Mozilla/5.0 (test)" } };
let srv, boss, db, siteId, SA, s, coldId, plainId, product;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const plusDays = (n) => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); };
const allDays = ["1", "2", "3", "4", "5", "6", "7"];

async function order(cli, { methodId, slot, email = "froid@example.test" }) {
  assert.equal((await cli.post("/boutique/panier/ajouter", { product_id: String(product.id), quantity: "1" }, site)).status, 303);
  const page = await cli.get(`/boutique/commande?pays=FR&livraison=${methodId}`, site);
  const idem = page.text.match(/name="idempotency_key" value="([0-9a-f]+)"/)[1];
  const expected = page.text.match(/name="expected_total" value="(\d+)"/)[1];
  return cli.post("/boutique/commande", { email, ship_name: "Ada", ship_line1: "1 rue des Tests", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: idem, shipping_method: String(methodId), ...(slot ? { delivery_slot: slot } : {}), payment_method: "manual", expected_total: expected }, site);
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Boutique Créneaux" })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${siteId}/reglages.json`)).text);
  assert.equal((await boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${HOST}` } } } })).status, 200);
  SA = `/marketing/site-web/sites/${siteId}/boutique`;
  assert.equal((await boss.post(`${SA}/livraison/zones`, { name: "France", countries: "FR" })).status, 302);
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", siteId).id;
  assert.equal((await boss.post(`${SA}/livraison/zones/${zid}/methodes`, { name: "Colis standard", kind: "flat", cost: "5,90" })).status, 302);
  assert.equal((await boss.post(`${SA}/livraison/zones/${zid}/methodes`, { name: "Livraison réfrigérée", kind: "flat", cost: "9,90", requires_slot: "1" })).status, 302);
  plainId = one("SELECT id FROM mk_shop_shipping_methods WHERE site_id = ? AND name = ?", siteId, "Colis standard").id;
  coldId = one("SELECT id FROM mk_shop_shipping_methods WHERE site_id = ? AND name = ?", siteId, "Livraison réfrigérée").id;
  assert.equal(one("SELECT requires_slot FROM mk_shop_shipping_methods WHERE id = ?", coldId).requires_slot, 1);
  assert.equal(one("SELECT requires_slot FROM mk_shop_shipping_methods WHERE id = ?", plainId).requires_slot, 0);
  assert.equal((await boss.post(`${SA}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: "CRN", manual_instructions: "Virement" })).status, 302);
  assert.equal((await boss.post(`/marketing/site-web/sites/${siteId}/modules/commerce`, { etat: "activer" })).status, 302);
  assert.equal((await boss.post(`${SA}/produits`, { name: "Saumon fumé", type: "simple", status: "published", price: "30,00", manage_stock: "1", stock_qty: "100", requires_shipping: "1" })).status, 302);
  product = one("SELECT id, slug FROM mk_shop_products WHERE site_id = ? AND name = ?", siteId, "Saumon fumé");
  s = { db, organizationId: one("SELECT organization_id AS o FROM mk_shop_shipping_zones WHERE site_id = ?", siteId).o, siteId };
});
after(async () => { db.close(); await srv.stop(); });

describe("créneaux : validation et génération", () => {
  test("l'administration refuse un créneau incohérent", async () => {
    const bad = (extra) => boss.post(`${SA}/creneaux`, { weekdays: allDays, start_time: "10:00", end_time: "12:00", capacity: "2", ...extra });
    for (const extra of [{ weekdays: [] }, { end_time: "09:00" }, { capacity: "0" }, { horizon_days: "500" }, { excluded_dates: "demain" }, { start_time: "" }]) {
      await bad(extra);
    }
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_delivery_slots WHERE site_id = ?", siteId).n, 0);
  });

  test("génération : délai minimum, horizon, jours de semaine et jours exclus respectés", () => {
    const now = new Date(2030, 0, 7, 9, 0); // lundi 7 janvier 2030, 09:00
    const id = slotsSvc.save(s, { label: "Matin", weekdays: ["1", "3"], start_time: "10:00", end_time: "12:00", capacity: "2", min_notice_hours: "24", horizon_days: "10", excluded_dates: "2030-01-14" });
    const days = slotsSvc.available(s, { now });
    // lundi 7 à 10:00 = dans 1 h (< 24 h) refusé ; mercredi 9 ok ; lundi 14 exclu ; mercredi 16 ok ; lundi 21 hors horizon (14 j > 10)
    assert.deepEqual(days.map((d) => d.date), ["2030-01-09", "2030-01-16"]);
    assert.equal(days[0].slots[0].remaining, 2);
    assert.match(days[0].label, /mercredi 9 janvier/);
    // délai de 2 h : le lundi 7 devient impossible (10:00 < 09:00 + 2 h ? non, 11:00 > 10:00) mais avec 1 h il serait possible
    db.prepare("UPDATE mk_shop_delivery_slots SET min_notice_hours = 1 WHERE id = ?").run(id);
    assert.equal(slotsSvc.available(s, { now })[0].date, "2030-01-07");
    db.prepare("UPDATE mk_shop_delivery_slots SET min_notice_hours = 2 WHERE id = ?").run(id);
    assert.equal(slotsSvc.available(s, { now })[0].date, "2030-01-09");
    db.prepare("DELETE FROM mk_shop_delivery_slots WHERE id = ?").run(id);
  });
});

describe("créneaux au tunnel de commande", () => {
  test("la page de commande propose les créneaux libres ; méthode standard : aucun créneau exigé et commande inchangée", async () => {
    assert.equal((await boss.post(`${SA}/creneaux`, { label: "Froid", weekdays: allDays, start_time: "08:00", end_time: "10:00", capacity: "1", min_notice_hours: "0", horizon_days: "7" })).status, 302);
    const slot = one("SELECT * FROM mk_shop_delivery_slots WHERE site_id = ?", siteId);
    assert.ok(slot);
    const cli = new Client(srv.base);
    await cli.post("/boutique/panier/ajouter", { product_id: String(product.id), quantity: "1" }, site);
    const page = await cli.get("/boutique/commande?pays=FR", site);
    assert.equal(page.status, 200);
    assert.match(page.text, /Créneau de livraison/);
    assert.match(page.text, /name="delivery_slot" value="\d+\|\d{4}-\d{2}-\d{2}"/);
    assert.match(page.text, /1 place disponible/);
    assert.doesNotMatch(page.text, /dernier|plus que|vite|urgent/i);
    // méthode sans créneau : accepté sans delivery_slot
    const r = await order(new Client(srv.base), { methodId: plainId, email: "std@example.test" });
    assert.equal(r.status, 303, String(r.text).slice(0, 300));
    const o = one("SELECT * FROM mk_shop_orders WHERE email = ?", "std@example.test");
    assert.equal(o.delivery_date, null); assert.equal(o.delivery_slot_id, null);
  });

  test("méthode froide : créneau exigé, enregistré sur la commande, puis créneau complet refusé", async () => {
    const day = ymd(plusDays(2));
    const slot = one("SELECT id FROM mk_shop_delivery_slots WHERE site_id = ?", siteId);
    // sans créneau : refus
    const none = await order(new Client(srv.base), { methodId: coldId, email: "a@example.test" });
    assert.equal(none.status, 422); assert.match(none.text, /Choisissez un créneau de livraison/);
    // créneau forgé (autre date non proposée, ou id inexistant) : refus
    const forged = await order(new Client(srv.base), { methodId: coldId, slot: `${slot.id}|${ymd(plusDays(40))}`, email: "b@example.test" });
    assert.equal(forged.status, 422); assert.match(forged.text, /plus disponible/);
    assert.equal((await order(new Client(srv.base), { methodId: coldId, slot: `99999|${day}`, email: "b@example.test" })).status, 422);
    // créneau valide
    const ok = await order(new Client(srv.base), { methodId: coldId, slot: `${slot.id}|${day}`, email: "froid@example.test" });
    assert.equal(ok.status, 303, String(ok.text).slice(0, 300));
    const o = one("SELECT * FROM mk_shop_orders WHERE email = ?", "froid@example.test");
    assert.equal(o.delivery_date, day); assert.equal(o.delivery_start, "08:00"); assert.equal(o.delivery_end, "10:00"); assert.equal(o.delivery_slot_id, slot.id);
    // confirmation, admin, e-mail
    const conf = await new Client(srv.base).get(ok.location.replace(/^https?:\/\/[^/]+/, ""), site);
    assert.match(conf.text, /Créneau de livraison/); assert.match(conf.text, /de 08:00 à 10:00/);
    const adm = await boss.get(`${SA}/commandes/${o.id}`);
    assert.match(adm.text, /Créneau de livraison/); assert.match(adm.text, /de 08:00 à 10:00/);
    const mail = db.prepare("SELECT * FROM mk_shop_notifications WHERE order_id = ?").all(o.id);
    assert.ok(mail.length >= 1);
    // capacité 1 atteinte : ce créneau n'est plus proposé et la commande est refusée avec un message
    const days = slotsSvc.available(s);
    assert.ok(!days.find((d) => d.date === day && d.slots.some((c) => c.slotId === slot.id)));
    const full = await order(new Client(srv.base), { methodId: coldId, slot: `${slot.id}|${day}`, email: "c@example.test" });
    assert.equal(full.status, 422); assert.match(full.text, /complet/);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_orders WHERE email = ?", "c@example.test").n, 0);
    // une commande annulée libère la place
    db.prepare("UPDATE mk_shop_orders SET status = 'cancelled' WHERE id = ?").run(o.id);
    assert.ok(slotsSvc.available(s).find((d) => d.date === day));
  });

  test("le corps de l'e-mail mentionne le créneau", () => {
    const body = require("../src/marketing/shop/notify");
    const o = one("SELECT * FROM mk_shop_orders WHERE email = ?", "froid@example.test");
    assert.match(slotsSvc.describe(o), /de 08:00 à 10:00/);
    assert.equal(typeof body.notify, "function");
    const q = db.prepare("SELECT * FROM mk_shop_notifications WHERE order_id = ? AND event = 'order_created'").get(o.id);
    assert.ok(q);
    const mailRow = db.prepare("SELECT body FROM mail_outbox WHERE kind = 'shop_order' AND to_email = ? ORDER BY id DESC LIMIT 1").get("froid@example.test");
    assert.ok(mailRow && /Créneau de livraison : .*de 08:00 à 10:00/.test(mailRow.body), "le créneau figure dans l'e-mail");
  });

  test("créneau inconnu d'une autre boutique : introuvable pour l'admin", async () => {
    const r = await boss.post(`${SA}/creneaux/99999/supprimer`, {});
    assert.notEqual(r.status, 500);
  });
});
