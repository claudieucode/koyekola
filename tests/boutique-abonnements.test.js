// Abonnements récurrents sur un VRAI serveur, contre un FAUX Stripe local (STRIPE_API_BASE) et des webhooks signés par nous.
// Ce que ces tests prouvent : formules, souscription (prix et récurrence côté serveur), commande de réassort créée UNE fois par facture,
// échec de paiement, pause / reprise / changement de formule / résiliation en un clic, lien invité signé, isolation entre sites, produit non abonnable inchangé.
// Ce qu'ils NE prouvent PAS : le dialogue avec le VRAI Stripe (formats exacts des objets, Checkout hébergé, règles de facturation réelles).
// Avant toute mise en production : essai complet en MODE TEST Stripe (clés sk_test, webhook configuré, cartes de test).
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const WEBHOOK_SECRET = "whsec_test_abonnements";
const HOST_A = "www.abo-a.example";
const HOST_B = "www.abo-b.example";
const hostA = { headers: { "x-forwarded-host": HOST_A, "User-Agent": "Mozilla/5.0 (test)" } };
const hostB = { headers: { "x-forwarded-host": HOST_B, "User-Agent": "Mozilla/5.0 (test)" } };

let srv, boss, db, fake, fakeBase, siteA, siteB, SA, SB, prodA, prodB, plans = {};
const stripe = { n: 0, products: [], prices: [], sessions: new Map(), subs: new Map(), calls: [], down: false, failUpdates: false };
const one = (sql, ...a) => db.prepare(sql).get(...a);
const all = (sql, ...a) => db.prepare(sql).all(...a);

// ── Faux Stripe ─────────────────────────────────────────────────────────────────────────────
function startFakeStripe() {
  return new Promise((resolve) => {
    fake = http.createServer((req, res) => {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        const send = (status, json) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(json)); };
        if (req.headers.authorization !== "Bearer sk_test_fake") return send(401, { error: { message: "clé invalide" } });
        const params = Object.fromEntries(new URLSearchParams(body));
        stripe.calls.push({ method: req.method, url: req.url, params });
        if (stripe.down) return send(500, { error: { message: "panne simulée" } });
        const id = (p) => `${p}_${++stripe.n}`;
        if (req.method === "POST" && req.url === "/v1/products") { const o = { id: id("prod"), ...params }; stripe.products.push(o); return send(200, o); }
        if (req.method === "POST" && req.url === "/v1/prices") { const o = { id: id("price"), ...params }; stripe.prices.push(o); return send(200, o); }
        if (req.method === "POST" && req.url === "/v1/checkout/sessions") { const o = { id: id("cs"), params, status: "open", payment_status: "unpaid", mode: "subscription", client_reference_id: params.client_reference_id }; stripe.sessions.set(o.id, o); return send(200, { id: o.id, url: `https://checkout.stripe.test/c/${o.id}` }); }
        let m = req.url.match(/^\/v1\/checkout\/sessions\/(.+)$/);
        if (req.method === "GET" && m && stripe.sessions.has(m[1])) { const s = stripe.sessions.get(m[1]); return send(200, { id: s.id, status: s.status, payment_status: s.payment_status, mode: "subscription", subscription: s.subscription, customer: s.customer }); }
        m = req.url.match(/^\/v1\/subscriptions\/(.+)$/);
        if (m && stripe.subs.has(m[1])) {
          const sub = stripe.subs.get(m[1]);
          if (req.method === "GET") return send(200, sub);
          if (stripe.failUpdates) return send(500, { error: { message: "refus simulé" } });
          if (req.method === "DELETE") { sub.status = "canceled"; return send(200, sub); }
          if (params["pause_collection[behavior]"]) sub.pause_collection = { behavior: params["pause_collection[behavior]"] };
          if ("pause_collection" in params && params.pause_collection === "") sub.pause_collection = null;
          if (params.cancel_at_period_end) sub.cancel_at_period_end = params.cancel_at_period_end === "true";
          if (params["items[0][price]"]) sub.items.data[0].price = { id: params["items[0][price]"] };
          return send(200, sub);
        }
        send(404, { error: { message: "introuvable" } });
      });
    }).listen(0, () => { fakeBase = `http://localhost:${fake.address().port}`; resolve(); });
  });
}
const sign = (payload, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${crypto.createHmac("sha256", WEBHOOK_SECRET).update(`${t}.${payload}`).digest("hex")}`;
async function webhook(type, object, { id = `evt_${crypto.randomUUID()}`, signature } = {}) {
  const payload = JSON.stringify({ id, type, data: { object } });
  const r = await fetch(`${srv.base}/stripe/webhook`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": signature ?? sign(payload) }, body: payload });
  return { status: r.status, json: await r.json(), id };
}

// Le client « paie » sur la page Stripe : crée l'abonnement chez le faux Stripe puis envoie les événements, comme le ferait Stripe.
async function customerPays(sessionId, { country = "FR", first = true } = {}) {
  const s = stripe.sessions.get(sessionId);
  const kw = s.params["metadata[kw_sub]"];
  const priceId = s.params["line_items[0][price]"];
  const subId = `sub_${++stripe.n}`;
  const end = Math.floor(Date.now() / 1000) + 30 * 86400;
  const sub = { id: subId, status: "active", customer: `cus_${stripe.n}`, current_period_end: end, cancel_at_period_end: false, pause_collection: null, items: { data: [{ id: `si_${stripe.n}`, price: { id: priceId } }] }, metadata: { kw_sub: kw } };
  stripe.subs.set(subId, sub);
  s.status = "complete"; s.payment_status = "paid"; s.subscription = subId; s.customer = sub.customer;
  const session = { id: s.id, mode: "subscription", client_reference_id: s.client_reference_id, payment_status: "paid", status: "complete", subscription: subId, customer: sub.customer,
    shipping_details: { name: "Ada Lovelace", address: { line1: "1 rue des Tests", postal_code: "75001", city: "Paris", state: "", country } } };
  const ev = { completed: await webhook("checkout.session.completed", session) };
  if (first) ev.invoice = await invoicePaid(sub, `in_${stripe.n}_first`, { reason: "subscription_create" });
  return { sub, subId, ev };
}
const invoiceObject = (sub, invoiceId, amount, reason = "subscription_cycle") => ({ id: invoiceId, subscription: sub.id, customer: sub.customer, currency: "eur", amount_paid: amount, billing_reason: reason, subscription_details: { metadata: sub.metadata },
  lines: { data: [{ period: { start: sub.current_period_end - 30 * 86400, end: sub.current_period_end }, metadata: sub.metadata }] } });
const priceOfSub = (sub) => { const p = stripe.prices.find((x) => x.id === sub.items.data[0].price.id); return Number(p.unit_amount); };
const invoicePaid = (sub, invoiceId, { reason, id } = {}) => webhook("invoice.paid", invoiceObject(sub, invoiceId, priceOfSub(sub), reason), { id });

// ── Mise en place ───────────────────────────────────────────────────────────────────────────
async function makeShop(name, host) {
  const sid = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${sid}/reglages.json`)).text);
  assert.equal((await boss.request(`/marketing/site-web/sites/${sid}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } } })).status, 200);
  const A = `/marketing/site-web/sites/${sid}/boutique`;
  assert.equal((await boss.post(`${A}/livraison/zones`, { name: "France", countries: "FR" })).status, 302);
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", sid).id;
  assert.equal((await boss.post(`${A}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,90" })).status, 302);
  assert.equal((await boss.post(`${A}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual"], guest_checkout: "1", order_prefix: name.slice(0, 3).toUpperCase(), notify_email: "vendeur@example.test", manual_instructions: "Virement" })).status, 302);
  assert.equal((await boss.post(`/marketing/site-web/sites/${sid}/modules/commerce`, { etat: "activer" })).status, 302);
  return { sid, A };
}
const addProduct = async (A, sid, name, extra = {}) => {
  const r = await boss.post(`${A}/produits`, { name, type: "simple", status: "published", price: "34,00", manage_stock: "1", stock_qty: "10", requires_shipping: "1", ...extra });
  assert.equal(r.status, 302, String(r.text).slice(0, 200));
  return one("SELECT id, slug FROM mk_shop_products WHERE site_id = ? AND name = ?", sid, name);
};
const addPlan = async (A, p, fields) => boss.post(`${A}/produits/${p.id}/formules`, { label: "Chaque mois", interval_count: "1", interval_unit: "month", price: "29,90", ...fields });
const orderCount = (sid) => one("SELECT COUNT(*) AS n FROM mk_shop_orders WHERE site_id = ?", sid).n;
const subscribe = (cli, host, p, planId, extra = {}) => cli.post("/boutique/abonnements/souscrire", { product_id: String(p.id), plan_id: String(planId), email: "ada@example.test", ...extra }, host);
const mailsTo = (to) => all("SELECT * FROM mail_outbox WHERE to_email = ? ORDER BY id", to);
const manageLink = (to) => { const m = mailsTo(to).map((x) => x.body).join("\n").match(/\/boutique\/abonnements\/(\d+)\?k=([0-9a-f]{32})/); return m ? { id: m[1], k: m[2] } : null; };

before(async () => {
  await startFakeStripe();
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, STRIPE_API_BASE: fakeBase });
  boss = await loginInstructor(srv); db = srv.db();
  ({ sid: siteA, A: SA } = await makeShop("Abo Alpha", HOST_A));
  ({ sid: siteB, A: SB } = await makeShop("Abo Beta", HOST_B));
  prodA = await addProduct(SA, siteA, "Box du mois");
  prodB = await addProduct(SB, siteB, "Box du mois");
});
after(async () => { db.close(); await srv.stop(); fake.close(); });

describe("désactivée par défaut", () => {
  test("sans formule : fiche inchangée, pas de page d'abonnements, souscription refusée", async () => {
    const cli = new Client(srv.base);
    const fiche = await cli.get(`/boutique/produit/${prodA.slug}`, hostA);
    assert.equal(fiche.status, 200);
    assert.match(fiche.text, /Ajouter au panier/);
    assert.doesNotMatch(fiche.text, /abonnement/i);
    assert.equal((await cli.get("/boutique/abonnements", hostA)).status, 404);
    const r = await subscribe(cli, hostA, prodA, 999);
    assert.equal(r.status, 303); assert.doesNotMatch(r.location, /stripe/);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_subscriptions").n, 0);
    assert.equal(stripe.calls.length, 0, "aucun appel à Stripe");
  });
});

describe("formules (admin)", () => {
  test("validation côté serveur : prix trop bas, remise inexacte, récurrence hors bornes", async () => {
    const before = one("SELECT COUNT(*) AS n FROM mk_shop_sub_plans").n;
    for (const bad of [{ price: "0,10" }, { price: "29,90", discount_percent: "50" }, { interval_count: "0" }, { interval_count: "13" }, { interval_unit: "jour" }, { label: "   " }, { price: "abc" }, { price: "", discount_percent: "" }]) {
      assert.equal((await addPlan(SA, prodA, bad)).status, 302);
    }
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_sub_plans").n, before, "aucune formule invalide enregistrée");
  });
  test("formules valides ; remise calculée depuis la base ; isolation du produit d'un autre site", async () => {
    assert.equal((await addPlan(SA, prodA, {})).status, 302);
    assert.equal((await addPlan(SA, prodA, { label: "Tous les 2 mois", interval_count: "2", price: "", discount_percent: "10" })).status, 302);
    assert.equal((await addPlan(SA, prodA, { label: "Toutes les 4 semaines", interval_count: "4", interval_unit: "week", price: "30,60", discount_percent: "10" })).status, 302);
    const rows = all("SELECT * FROM mk_shop_sub_plans WHERE product_id = ? ORDER BY id", prodA.id);
    assert.equal(rows.length, 3);
    assert.deepEqual(rows.map((r) => r.price_cents), [2990, 3060, 3060]);
    plans = { month: rows[0], bi: rows[1], week4: rows[2] };
    // le vendeur du site A ne peut pas poser une formule sur le produit du site B (même compte, autre boutique)
    const r = await boss.post(`${SA}/produits/${prodB.id}/formules`, { label: "X", interval_count: "1", interval_unit: "month", price: "10" });
    assert.equal(r.status, 302);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_sub_plans WHERE product_id = ?", prodB.id).n, 0);
    const admin = await boss.get(`${SA}/produits/${prodA.id}`);
    assert.match(admin.text, /Abonnement \(récurrent\)/); assert.match(admin.text, /Chaque mois/);
  });
  test("fiche publique : prix et récurrence écrits, achat unique conservé, aucune case ni formule présélectionnée", async () => {
    const fiche = await new Client(srv.base).get(`/boutique/produit/${prodA.slug}`, hostA);
    assert.match(fiche.text, /Ajouter au panier/);
    assert.match(fiche.text, /Chaque mois/); assert.match(fiche.text, /29,90/); assert.match(fiche.text, /chaque mois/);
    assert.match(fiche.text, /tous les 2 mois/); assert.match(fiche.text, /toutes les 4 semaines/);
    assert.match(fiche.text, /remise de 10 %/);
    assert.match(fiche.text, /aucun frais caché/);
    assert.match(fiche.text, /Comment résilier/);
    const sub = fiche.text.slice(fiche.text.indexOf("sh-sub-form"));
    assert.doesNotMatch(sub, /checked|selected/);
    const other = await new Client(srv.base).get(`/boutique/produit/${prodB.slug}`, hostB);
    assert.doesNotMatch(other.text, /Chaque mois/, "l'autre boutique ne voit pas ces formules");
  });
});

let subA; // abonnement invité de la boutique A
describe("souscription et réassort", () => {
  test("souscription : redirection vers Stripe, prix Stripe créé une fois et réutilisé, montant et récurrence fixés par le serveur", async () => {
    const guest = new Client(srv.base);
    // formule d'un autre produit / inexistante / sans e-mail : refus sans appel de paiement
    assert.doesNotMatch((await subscribe(guest, hostA, prodA, 99999)).location, /stripe/);
    assert.doesNotMatch((await subscribe(guest, hostA, prodA, plans.month.id, { email: "pas-un-mail" })).location, /stripe/);
    assert.equal(stripe.sessions.size, 0);
    const r = await subscribe(guest, hostA, prodA, plans.month.id, { price: "1", amount: "1", price_cents: "1" }); // champs « malins » ignorés
    assert.equal(r.status, 303); assert.match(r.location, /^https:\/\/checkout\.stripe\.test\/c\/cs_/);
    const sess = [...stripe.sessions.values()][0];
    assert.equal(sess.params.mode, "subscription");
    assert.equal(sess.params["line_items[0][quantity]"], "1");
    assert.equal(sess.params["shipping_address_collection[allowed_countries][0]"], "FR");
    assert.equal(sess.params.customer_email, "ada@example.test");
    assert.match(sess.params.success_url, /\/boutique\/abonnements\/merci\?s=\d+&k=[0-9a-f]{32}$/);
    const price = stripe.prices.find((p) => p.id === sess.params["line_items[0][price]"]);
    assert.equal(price.unit_amount, "2990"); assert.equal(price["recurring[interval]"], "month"); assert.equal(price["recurring[interval_count]"], "1"); assert.equal(price.currency, "eur");
    subA = one("SELECT * FROM mk_shop_subscriptions WHERE site_id = ?", siteA);
    assert.equal(subA.status, "incomplete"); assert.equal(subA.price_cents, 2990); assert.equal(subA.plan_label, "Chaque mois");
    assert.equal(orderCount(siteA), 0, "aucune commande avant le paiement");
    assert.equal((await new Client(srv.base).get(`/boutique/abonnements/${subA.id}`, hostA)).status, 404, "un abonnement non payé n'est pas gérable");
    // une seconde souscription à la même formule réutilise le prix Stripe
    const pricesBefore = stripe.prices.length;
    await subscribe(new Client(srv.base), hostA, prodA, plans.month.id, { email: "autre@example.test" });
    assert.equal(stripe.prices.length, pricesBefore);
    one("SELECT 1"); db.prepare("UPDATE mk_shop_subscriptions SET status = 'cancelled' WHERE email = 'autre@example.test'").run();
  });

  test("webhook : signature invalide refusée, rien n'est créé", async () => {
    const bad = await webhook("invoice.paid", { id: "in_x", subscription: "sub_x" }, { signature: "t=1,v1=00" });
    assert.equal(bad.status, 400);
    const sess = [...stripe.sessions.values()][0];
    const payload = JSON.stringify({ id: "evt_old", type: "checkout.session.completed", data: { object: { id: sess.id, client_reference_id: `sub:${subA.id}`, mode: "subscription", payment_status: "paid" } } });
    const old = await fetch(`${srv.base}/stripe/webhook`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": sign(payload, 1000) }, body: payload });
    assert.equal(old.status, 400, "message trop ancien");
    assert.equal(one("SELECT status FROM mk_shop_subscriptions WHERE id = ?", subA.id).status, "incomplete");
  });

  test("paiement de la 1re échéance : abonnement actif, UNE commande ; événement rejoué ou facture rejouée = toujours une seule commande", async () => {
    const sess = [...stripe.sessions.values()][0];
    const stockBefore = one("SELECT stock_qty FROM mk_shop_products WHERE id = ?", prodA.id).stock_qty;
    const { sub, ev } = await customerPays(sess.id);
    assert.equal(ev.completed.status, 200); assert.equal(ev.invoice.status, 200);
    const row = one("SELECT * FROM mk_shop_subscriptions WHERE id = ?", subA.id);
    assert.equal(row.status, "active"); assert.equal(row.stripe_subscription_id, sub.id);
    assert.equal(JSON.parse(row.shipping_address).city, "Paris");
    assert.ok(row.current_period_end);
    assert.equal(orderCount(siteA), 1);
    const order = one("SELECT * FROM mk_shop_orders WHERE site_id = ?", siteA);
    assert.equal(order.status, "paid"); assert.equal(order.payment_status, "paid"); assert.equal(order.total_cents, 2990); assert.equal(order.email, "ada@example.test");
    assert.equal(JSON.parse(order.shipping_address).line1, "1 rue des Tests");
    assert.equal(one("SELECT stock_qty FROM mk_shop_products WHERE id = ?", prodA.id).stock_qty, stockBefore - 1);
    // rejeu du MÊME événement
    const again = await invoicePaid(sub, `in_${stripe.n}_first`, { id: ev.invoice.id });
    assert.equal(again.status, 200);
    // même facture sous un AUTRE identifiant d'événement
    const dup = await invoicePaid(sub, `in_${stripe.n}_first`);
    assert.equal(dup.status, 200);
    // le complété rejoué ne renvoie pas de second e-mail de bienvenue
    await webhook("checkout.session.completed", { id: sess.id, mode: "subscription", client_reference_id: `sub:${subA.id}`, payment_status: "paid", subscription: sub.id }, { id: ev.completed.id });
    assert.equal(orderCount(siteA), 1, "toujours une seule commande");
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_sub_orders WHERE subscription_id = ?", subA.id).n, 1);
    assert.equal(one("SELECT stock_qty FROM mk_shop_products WHERE id = ?", prodA.id).stock_qty, stockBefore - 1, "stock décompté une fois");
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_payments WHERE order_id = ?", order.id).n, 1);
    const started = mailsTo("ada@example.test").filter((m) => /abonnement est confirmé/.test(m.subject));
    assert.equal(started.length, 1, "un seul e-mail de bienvenue");
    assert.ok(manageLink("ada@example.test"), "le lien de gestion est dans l'e-mail");
    assert.equal(mailsTo("ada@example.test").filter((m) => /Paiement confirmé/.test(m.subject)).length, 1, "un seul e-mail de commande");
    subA.stripeSub = sub;
  });

  test("renouvellement : une seconde commande de réassort, une seule fois", async () => {
    const sub = subA.stripeSub;
    sub.current_period_end += 30 * 86400;
    const inv = `in_renew_${stripe.n}`;
    const first = await webhook("invoice.paid", invoiceObject(sub, inv, 2990));
    assert.equal(first.status, 200);
    await webhook("invoice.paid", invoiceObject(sub, inv, 2990)); // même facture, autre événement
    assert.equal(orderCount(siteA), 2);
    const kinds = all("SELECT kind FROM mk_shop_sub_orders WHERE subscription_id = ? ORDER BY id", subA.id).map((r) => r.kind);
    assert.deepEqual(kinds, ["first", "renewal"]);
    assert.equal(mailsTo("ada@example.test").filter((m) => /Paiement confirmé/.test(m.subject)).length, 2);
    assert.equal(orderCount(siteB), 0, "aucune commande sur l'autre boutique");
  });

  test("échec de paiement : statut impayé + e-mail une seule fois ; facture payée ensuite : retour à actif", async () => {
    const sub = subA.stripeSub;
    const failed = { ...invoiceObject(sub, "in_failed_1", 2990), amount_paid: 0, hosted_invoice_url: "https://invoice.stripe.test/i/in_failed_1" };
    const evId = "evt_failed_1";
    assert.equal((await webhook("invoice.payment_failed", failed, { id: evId })).status, 200);
    assert.equal(one("SELECT status FROM mk_shop_subscriptions WHERE id = ?", subA.id).status, "past_due");
    await webhook("invoice.payment_failed", failed, { id: evId }); // rejeu
    await webhook("invoice.payment_failed", { ...failed, id: "in_failed_2" }); // 2e tentative de Stripe : pas de 2e e-mail
    const mails = mailsTo("ada@example.test").filter((m) => /non abouti/.test(m.subject));
    assert.equal(mails.length, 1);
    assert.match(mails[0].body, /invoice\.stripe\.test/);
    assert.equal(orderCount(siteA), 2, "un échec ne crée aucune commande");
    const page = await new Client(srv.base).get(`/boutique/abonnements/${subA.id}?k=${manageLink("ada@example.test").k}`, hostA);
    assert.match(page.text, /Paiement en échec/);
    sub.current_period_end += 30 * 86400;
    await webhook("invoice.paid", invoiceObject(sub, "in_after_fail", 2990));
    assert.equal(one("SELECT status FROM mk_shop_subscriptions WHERE id = ?", subA.id).status, "active");
    assert.equal(orderCount(siteA), 3);
  });
});

describe("espace client invité (lien signé)", () => {
  let k;
  const act = (cli, name, form = {}, host = hostA, query = k) => cli.post(`/boutique/abonnements/${subA.id}/${name}?k=${query}`, form, host);
  const stripeCalls = (re) => stripe.calls.filter((c) => re.test(c.url) && c.method !== "GET");
  test("accès : sans lien, mauvais lien ou autre boutique = introuvable ; lien valide = prix, échéance, statut, actions", async () => {
    k = manageLink("ada@example.test").k;
    const cli = new Client(srv.base);
    assert.equal((await cli.get(`/boutique/abonnements/${subA.id}`, hostA)).status, 404);
    assert.equal((await cli.get(`/boutique/abonnements/${subA.id}?k=${"0".repeat(32)}`, hostA)).status, 404);
    assert.equal((await cli.get(`/boutique/abonnements/${subA.id}?k=${k}`, hostB)).status, 404, "isolation : le lien ne marche pas sur l'autre boutique");
    const ok = await cli.get(`/boutique/abonnements/${subA.id}?k=${k}`, hostA);
    assert.equal(ok.status, 200);
    assert.match(ok.text, /Box du mois/); assert.match(ok.text, /29,90/); assert.match(ok.text, /chaque mois/); assert.match(ok.text, /Prochaine échéance/); assert.match(ok.text, /Actif/);
    assert.match(ok.text, /Mettre en pause/); assert.match(ok.text, /Changer de formule/); assert.match(ok.text, /Résilier mon abonnement/);
    assert.doesNotMatch(ok.text, /contactez[- ]nous pour résilier/i);
    const orders = await cli.get(`/boutique/abonnements/${subA.id}?k=${k}`, hostA);
    assert.match(orders.text, /ABO-0000\d/);
  });
  test("pause puis reprise : Stripe est appelé, l'état local suit, e-mails envoyés", async () => {
    const cli = new Client(srv.base);
    const p = await act(cli, "pause");
    assert.equal(p.status, 303);
    assert.equal(one("SELECT status FROM mk_shop_subscriptions WHERE id = ?", subA.id).status, "paused");
    assert.equal(stripeCalls(/subscriptions/).at(-1).params["pause_collection[behavior]"], "void");
    assert.match((await cli.get(`/boutique/abonnements/${subA.id}?k=${k}`, hostA)).text, /En pause/);
    assert.equal((await act(cli, "pause")).status, 303, "une pause répétée ne casse rien");
    const r = await act(cli, "reprise");
    assert.equal(r.status, 303);
    assert.equal(one("SELECT status FROM mk_shop_subscriptions WHERE id = ?", subA.id).status, "active");
    assert.equal(stripeCalls(/subscriptions/).at(-1).params.pause_collection, "");
    assert.equal(mailsTo("ada@example.test").filter((m) => /en pause|reprend/.test(m.subject)).length, 2);
  });
  test("pause refusée par Stripe : l'état local ne change pas", async () => {
    stripe.failUpdates = true;
    const r = await act(new Client(srv.base), "pause");
    stripe.failUpdates = false;
    assert.equal(r.status, 503);
    assert.equal(one("SELECT status FROM mk_shop_subscriptions WHERE id = ?", subA.id).status, "active");
  });
  test("changement de formule : nouveau prix Stripe, sans rattrapage, formule d'un autre produit refusée", async () => {
    const cli = new Client(srv.base);
    const bad = await act(cli, "formule", { plan_id: "99999" });
    assert.equal(bad.status, 422);
    const planOther = (await addPlan(SB, prodB, {}), one("SELECT id FROM mk_shop_sub_plans WHERE product_id = ?", prodB.id).id);
    assert.equal((await act(cli, "formule", { plan_id: String(planOther) })).status, 422, "formule d'une autre boutique refusée");
    assert.equal(one("SELECT plan_id FROM mk_shop_subscriptions WHERE id = ?", subA.id).plan_id, plans.month.id);
    const r = await act(cli, "formule", { plan_id: String(plans.bi.id) });
    assert.equal(r.status, 303);
    const row = one("SELECT * FROM mk_shop_subscriptions WHERE id = ?", subA.id);
    assert.equal(row.plan_id, plans.bi.id); assert.equal(row.price_cents, 3060); assert.equal(row.interval_count, 2);
    const call = stripeCalls(/subscriptions/).at(-1);
    assert.equal(call.params.proration_behavior, "none");
    assert.equal(call.params["items[0][price]"], one("SELECT stripe_price_id AS p FROM mk_shop_sub_plans WHERE id = ?", plans.bi.id).p);
    assert.equal(row.status, "active");
    assert.match((await cli.get(`/boutique/abonnements/${subA.id}?k=${k}`, hostA)).text, /tous les 2 mois/);
  });
  test("RÉSILIATION EN UN CLIC : une seule requête, aucun message dissuasif, e-mail de confirmation, répétition inoffensive", async () => {
    const cli = new Client(srv.base);
    const page = await cli.get(`/boutique/abonnements/${subA.id}?k=${k}`, hostA);
    assert.doesNotMatch(page.text, /êtes-vous sûr|vraiment|contactez/i);
    const callsBefore = stripe.calls.length;
    const r = await act(cli, "resilier");
    assert.equal(r.status, 303); assert.match(r.location, /ok=resilie/);
    assert.equal(stripe.calls.length - callsBefore, 1, "un seul appel Stripe, une seule étape");
    const row = one("SELECT * FROM mk_shop_subscriptions WHERE id = ?", subA.id);
    assert.equal(row.cancel_at_period_end, 1); assert.equal(row.status, "active");
    assert.equal(stripeCalls(/subscriptions/).at(-1).params.cancel_at_period_end, "true");
    const after = await cli.get(r.location, hostA);
    assert.match(after.text, /Résiliation programmée/); assert.match(after.text, /plus aucun prélèvement/);
    assert.doesNotMatch(after.text, /Mettre en pause/);
    const confirm = mailsTo("ada@example.test").filter((m) => /Résiliation .* confirmée/.test(m.subject));
    assert.equal(confirm.length, 1);
    assert.match(confirm[0].body, /Aucun nouveau prélèvement/);
    const again = await act(cli, "resilier");
    assert.equal(again.status, 303); assert.match(again.location, /ok=deja/);
    assert.equal(mailsTo("ada@example.test").filter((m) => /Résiliation .* confirmée/.test(m.subject)).length, 1);
    // fin effective annoncée par Stripe : abonnement résilié, plus de commande
    const sub = subA.stripeSub; sub.status = "canceled";
    const ev = await webhook("customer.subscription.deleted", { ...sub, status: "canceled" });
    assert.equal(ev.status, 200);
    assert.equal(one("SELECT status FROM mk_shop_subscriptions WHERE id = ?", subA.id).status, "cancelled");
    assert.equal((await act(cli, "pause")).status, 422, "plus de pause sur un abonnement résilié");
  });
  test("lien perdu : la demande répond pareil pour toute adresse et n'envoie qu'aux vrais abonnés", async () => {
    const cli = new Client(srv.base);
    const mailsBefore = all("SELECT id FROM mail_outbox").length;
    const unknown = await cli.post("/boutique/abonnements/lien", { email: "inconnu@example.test" }, hostA);
    assert.equal(unknown.status, 303); assert.match(unknown.location, /envoye=1/);
    assert.equal(all("SELECT id FROM mail_outbox").length, mailsBefore);
  });
});

describe("compte client, admin, isolation, pannes", () => {
  let customer, subC;
  test("client connecté : souscrit, voit ses abonnements, un autre client ne voit rien", async () => {
    customer = new Client(srv.base);
    assert.equal((await customer.post("/boutique/compte/inscription", { email: "client@example.test", password: "motdepasse-solide", name: "Client" }, hostA)).status, 303);
    const r = await customer.post("/boutique/abonnements/souscrire", { product_id: String(prodA.id), plan_id: String(plans.week4.id) }, hostA);
    assert.match(r.location, /checkout\.stripe\.test/);
    subC = one("SELECT * FROM mk_shop_subscriptions WHERE email = 'client@example.test'");
    assert.ok(subC.customer_id, "rattaché au compte");
    const sess = [...stripe.sessions.values()].at(-1);
    assert.equal(sess.params.customer_email, "client@example.test");
    const { sub } = await customerPays(sess.id);
    subC.stripeSub = sub;
    const list = await customer.get("/boutique/abonnements", hostA);
    assert.match(list.text, /Box du mois/); assert.match(list.text, /toutes les 4 semaines/); assert.match(list.text, /30,60/);
    assert.match((await customer.get("/boutique/compte", hostA)).text, /Mes abonnements/);
    assert.equal((await customer.get(`/boutique/abonnements/${subC.id}`, hostA)).status, 200, "sans lien, grâce au compte");
    const other = new Client(srv.base);
    assert.equal((await other.post("/boutique/compte/inscription", { email: "autre2@example.test", password: "motdepasse-solide", name: "Autre" }, hostA)).status, 303);
    assert.equal((await other.get(`/boutique/abonnements/${subC.id}`, hostA)).status, 404);
    assert.doesNotMatch((await other.get("/boutique/abonnements", hostA)).text, /Box du mois/);
    assert.equal((await other.post(`/boutique/abonnements/${subC.id}/resilier`, {}, hostA)).status, 404);
    assert.equal(one("SELECT cancel_at_period_end AS c FROM mk_shop_subscriptions WHERE id = ?", subC.id).c, 0);
    // la même personne n'a aucun accès sur l'autre boutique
    assert.equal((await customer.get(`/boutique/abonnements/${subC.id}`, hostB)).status, 404);
  });
  test("résiliation d'un abonnement en pause : arrêt immédiat chez Stripe", async () => {
    assert.equal((await customer.post(`/boutique/abonnements/${subC.id}/pause`, {}, hostA)).status, 303);
    const r = await customer.post(`/boutique/abonnements/${subC.id}/resilier`, {}, hostA);
    assert.equal(r.status, 303);
    assert.equal(stripe.calls.at(-1).method, "DELETE");
    assert.equal(one("SELECT status FROM mk_shop_subscriptions WHERE id = ?", subC.id).status, "cancelled");
  });
  test("admin : liste avec statuts et commandes générées ; annulation vendeur ; autre site intouchable", async () => {
    const list = await boss.get(`${SA}/abonnements`);
    assert.equal(list.status, 200);
    assert.match(list.text, /ada@example\.test/); assert.match(list.text, /client@example\.test/); assert.match(list.text, /ABO-0000/);
    assert.match(list.text, /Résilié/);
    assert.doesNotMatch((await boss.get(`${SB}/abonnements`)).text, /ada@example\.test/, "l'admin de B ne voit pas les abonnements de A");
    // nouvel abonné actif à arrêter côté vendeur
    const r = await subscribe(new Client(srv.base), hostA, prodA, plans.month.id, { email: "vendeur-annule@example.test" });
    const { sub } = await customerPays([...stripe.sessions.values()].at(-1).id);
    const row = one("SELECT * FROM mk_shop_subscriptions WHERE email = 'vendeur-annule@example.test'");
    assert.equal(row.status, "active"); void r;
    // le site B ne peut pas arrêter l'abonnement du site A
    assert.equal((await boss.post(`${SB}/abonnements/${row.id}/annuler`, {})).status, 302);
    assert.equal(one("SELECT status FROM mk_shop_subscriptions WHERE id = ?", row.id).status, "active");
    assert.equal((await boss.post(`${SA}/abonnements/${row.id}/annuler`, {})).status, 302);
    assert.equal(one("SELECT status FROM mk_shop_subscriptions WHERE id = ?", row.id).status, "cancelled");
    assert.equal(stripe.calls.at(-1).method, "DELETE"); assert.match(stripe.calls.at(-1).url, new RegExp(sub.id));
    assert.equal(mailsTo("vendeur-annule@example.test").filter((m) => /arrêté par la boutique/.test(m.subject)).length, 1);
    // l'événement « supprimé » de Stripe qui suit ne renvoie pas un second e-mail
    await webhook("customer.subscription.deleted", { ...sub, status: "canceled" });
    assert.equal(mailsTo("vendeur-annule@example.test").filter((m) => /terminé|arrêté/.test(m.subject)).length, 1);
  });
  test("événements Stripe d'un abonnement inconnu : ignorés sans erreur ; paiement du site A n'affecte jamais le site B", async () => {
    const r = await webhook("invoice.paid", { id: "in_inconnu", subscription: "sub_inconnu", amount_paid: 1000, currency: "eur" });
    assert.equal(r.status, 200);
    assert.equal(orderCount(siteB), 0);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_subscriptions WHERE site_id = ?", siteB).n, 0);
  });
  test("Stripe en panne à la souscription : aucune redirection, aucun abonnement actif laissé derrière", async () => {
    stripe.down = true;
    const before = one("SELECT COUNT(*) AS n FROM mk_shop_subscriptions WHERE status = 'active'").n;
    const r = await subscribe(new Client(srv.base), hostA, prodA, plans.month.id, { email: "panne@example.test" });
    stripe.down = false;
    assert.equal(r.status, 303); assert.doesNotMatch(r.location, /stripe/);
    assert.match(decodeURIComponent(r.location), /momentanément indisponible/);
    assert.equal(one("SELECT status FROM mk_shop_subscriptions WHERE email = 'panne@example.test'").status, "cancelled");
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_subscriptions WHERE status = 'active'").n, before);
  });
  test("produit en rupture ou clés Stripe absentes : aucune offre ; page de retour relit Stripe", async () => {
    const subs = require("../src/marketing/shop/subscriptions");
    const catalog = require("../src/marketing/shop/catalog");
    const s = { db, organizationId: one("SELECT organization_id AS o FROM mk_sites WHERE id = ?", siteA).o, siteId: siteA };
    const product = catalog.productById(s, prodA.id);
    process.env.STRIPE_SECRET_KEY = "sk_test_fake"; process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
    assert.ok(subs.offerFor(s, product));
    assert.equal(subs.offerFor(s, { ...product, inStock: false }), null);
    const saved = process.env.STRIPE_SECRET_KEY; delete process.env.STRIPE_SECRET_KEY;
    assert.equal(subs.offerFor(s, product), null, "sans clés Stripe du serveur : rien n'est proposé");
    process.env.STRIPE_SECRET_KEY = saved;
    // page de retour : sans webhook, l'état est relu chez Stripe (jamais confiance à l'adresse seule)
    await subscribe(new Client(srv.base), hostA, prodA, plans.month.id, { email: "retour@example.test" });
    const row = one("SELECT * FROM mk_shop_subscriptions WHERE email = 'retour@example.test'");
    const sess = stripe.sessions.get(row.stripe_session_id);
    const cli = new Client(srv.base);
    const k = sess.params.success_url.match(/k=([0-9a-f]{32})/)[1]; // le jeton est signé avec la clé du serveur, pas celle du test
    const before = await cli.get(`/boutique/abonnements/merci?s=${row.id}&k=${k}`, hostA);
    assert.match(before.text, /pas encore confirmé/);
    assert.equal((await cli.get(`/boutique/abonnements/merci?s=${row.id}&k=${"1".repeat(32)}`, hostA)).status, 404);
    sess.status = "complete"; sess.payment_status = "paid"; sess.subscription = "sub_retour"; sess.customer = "cus_retour";
    const afterPage = await cli.get(`/boutique/abonnements/merci?s=${row.id}&k=${k}`, hostA);
    assert.match(afterPage.text, /Votre abonnement est en place/);
    assert.equal(one("SELECT status FROM mk_shop_subscriptions WHERE id = ?", row.id).status, "active");
    assert.equal(orderCount(siteA) >= 3, true);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_shop_sub_orders WHERE subscription_id = ?", row.id).n, 0, "la page de retour ne crée jamais de commande : seule une facture payée le fait");
  });
});
