// Passerelles de paiement par site (VRAI serveur, FAUX fournisseurs locaux, aucun paiement réel) : identifiants chiffrés, PayPal, Flutterwave (Mobile Money), Stripe aux clés du site, webhooks, remboursement.
const http = require("node:http");
const crypto = require("node:crypto");
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = "Mozilla/5.0 (test)";
const HA = "www.pas-un.example", HB = "www.pas-deux.example";
const hdr = (h, extra = {}) => ({ headers: { "x-forwarded-host": h, "User-Agent": UA, ...extra } });
let srv, boss, db, A, B, fake;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const calls = []; const st = { pp: new Map(), flw: new Map(), stripe: new Map(), flwRefundFail: false };
const send = (res, code, j) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(j)); };

function startFake() {
  return new Promise((resolve) => {
    fake = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d));
      req.on("end", () => {
        const url = req.url; const auth = req.headers.authorization || "";
        calls.push({ method: req.method, url, auth });
        const j = () => { try { return JSON.parse(body); } catch { return {}; } };
        // PayPal
        if (url === "/v1/oauth2/token") return auth === `Basic ${Buffer.from("cid-A:sec-A").toString("base64")}` ? send(res, 200, { access_token: "tokA" }) : send(res, 401, { error_description: "bad creds" });
        if (req.method === "POST" && url === "/v2/checkout/orders") { const b = j(); const id = `PP${st.pp.size + 1}`; st.pp.set(id, { status: "CREATED", amount: b.purchase_units[0].amount, custom: b.purchase_units[0].custom_id, forceAmount: null, returnUrl: b.payment_source.paypal.experience_context.return_url }); return send(res, 200, { id, links: [{ rel: "payer-action", href: `https://paypal.fake/approve/${id}` }] }); }
        let m;
        if ((m = /^\/v2\/checkout\/orders\/(PP\d+)\/capture$/.exec(url))) { const o = st.pp.get(m[1]); o.status = "COMPLETED"; return send(res, 200, ppOut(m[1], o)); }
        if ((m = /^\/v2\/checkout\/orders\/(PP\d+)$/.exec(url))) return send(res, 200, ppOut(m[1], st.pp.get(m[1])));
        if ((m = /^\/v2\/payments\/captures\/(CAP-PP\d+)\/refund$/.exec(url))) return send(res, 200, { id: `RF-${m[1]}` });
        // Flutterwave
        if (req.method === "POST" && url === "/v3/payments") { if (auth !== "Bearer FLWSECK-A") return send(res, 401, { status: "error", message: "bad key" }); const b = j(); st.flw.set(b.tx_ref, { status: "pending", amount: b.amount, currency: b.currency, id: 900 + st.flw.size }); return send(res, 200, { status: "success", data: { link: `https://flw.fake/pay/${b.tx_ref}` } }); }
        if ((m = /^\/v3\/transactions\/verify_by_reference\?tx_ref=(.+)$/.exec(url))) { const ref = decodeURIComponent(m[1]); const t = st.flw.get(ref); return t ? send(res, 200, { status: "success", data: { tx_ref: ref, ...t, status: t.status } }) : send(res, 404, { status: "error", message: "unknown" }); }
        if ((m = /^\/v3\/transactions\/(\d+)\/refund$/.exec(url))) return st.flwRefundFail ? send(res, 500, { status: "error", message: "panne" }) : send(res, 200, { status: "success", data: { id: 777 } });
        // Stripe (clés du site)
        if (req.method === "POST" && url === "/v1/checkout/sessions") { const p = Object.fromEntries(new URLSearchParams(body)); const id = `cs_site_${st.stripe.size + 1}`; st.stripe.set(id, { id, auth, status: "open", payment_status: "unpaid", url: `https://stripe.fake/${id}`, amount_total: Number(p["line_items[0][price_data][unit_amount]"]), currency: p["line_items[0][price_data][currency]"] }); return send(res, 200, st.stripe.get(id)); }
        if ((m = /^\/v1\/checkout\/sessions\/(.+)$/.exec(url))) { const s = st.stripe.get(m[1]); return s ? send(res, 200, s) : send(res, 404, { error: { message: "inconnue" } }); }
        send(res, 404, { error: { message: "inconnu " + url } });
      });
    });
    fake.listen(0, "127.0.0.1", () => resolve(`http://127.0.0.1:${fake.address().port}`));
  });
}
const ppOut = (id, o) => ({ id, status: o.status, purchase_units: [{ custom_id: o.custom, amount: o.amount, payments: o.status === "COMPLETED" ? { captures: [{ id: `CAP-${id}`, status: "COMPLETED", amount: o.forceAmount || o.amount }] } : undefined }] });

async function mkSite(name, host) {
  const id = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${id}/reglages.json`)).text);
  await boss.request(`/marketing/site-web/sites/${id}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } } });
  const base = `/marketing/site-web/sites/${id}/boutique`;
  await boss.post(`${base}/livraison/zones`, { name: "France", countries: "FR" });
  const zid = one("SELECT id FROM mk_shop_shipping_zones WHERE site_id = ?", id).id;
  await boss.post(`${base}/livraison/zones/${zid}/methodes`, { name: "Colis", kind: "flat", cost: "5,00" });
  await boss.post(`${base}/reglages`, { currency: "eur", default_country: "FR", enabled: "1", payment_methods: ["manual", "paypal", "flutterwave", "stripe"], guest_checkout: "1", order_prefix: "G" + id, manual_instructions: "Virement" });
  await boss.post(`/marketing/site-web/sites/${id}/modules/commerce`, { etat: "activer" });
  await boss.post(`${base}/produits`, { name: "Lampe", type: "simple", status: "published", price: "20,00", manage_stock: "1", stock_qty: "100", requires_shipping: "1" });
  return { id, base, host, pid: one("SELECT id FROM mk_shop_products WHERE site_id = ?", id).id };
}
async function order(S, method) {
  const cli = new Client(srv.base), h = hdr(S.host);
  await cli.post("/boutique/panier/ajouter", { product_id: String(S.pid), quantity: "1" }, h);
  const page = await cli.get("/boutique/commande?pays=FR", h);
  const f = (n) => (page.text.match(new RegExp(`name="${n}" value="([^"]+)"`)) || assert.fail(`champ ${n}`))[1];
  const r = await cli.post("/boutique/commande", { email: "p@example.test", ship_name: "Ada", ship_line1: "1 rue", ship_postal_code: "75001", ship_city: "Paris", ship_country: "FR", same_billing: "1", idempotency_key: f("idempotency_key"), shipping_method: f("shipping_method"), payment_method: method, expected_total: f("expected_total") }, h);
  return { cli, h, r, o: one("SELECT * FROM mk_shop_orders WHERE site_id = ? ORDER BY id DESC", S.id) };
}
const ret = (b) => b.cli.get(`/boutique/commande/retour/${b.o.number}?k=${new URL(b.r.location, "https://x").search.replace(/^\?k=/, "") || ""}`, b.h);
const stripeSig = (secret, body) => { const t = Math.floor(Date.now() / 1000); return `t=${t},v1=${crypto.createHmac("sha256", secret).update(`${t}.${body}`).digest("hex")}`; };

before(async () => {
  const fb = await startFake();
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", PAYPAL_API_BASE: fb, FLUTTERWAVE_API_BASE: fb, STRIPE_API_BASE: fb, STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "" });
  boss = await loginInstructor(srv); db = srv.db();
  A = await mkSite("Passerelles Un", HA); B = await mkSite("Passerelles Deux", HB);
});
after(async () => { db.close(); await srv.stop(); fake.close(); });

test("identifiants : enregistrés CHIFFRÉS, jamais ré-affichés ; un champ vide conserve la valeur ; sans identifiants le moyen n'est pas proposé", async () => {
  let page = await boss.get(`${A.base}/paiements`); assert.equal(page.status, 200);
  assert.equal((await boss.post(`${A.base}/paiements/paypal`, { client_id: "cid-A", secret: "sec-A", mode: "live" })).status, 302);
  assert.equal((await boss.post(`${A.base}/paiements/flutterwave`, { secret_key: "FLWSECK-A", webhook_hash: "hash-A" })).status, 302);
  assert.equal((await boss.post(`${A.base}/paiements/stripe`, { secret_key: "sk_site_A", webhook_secret: "whsec_site_A" })).status, 302);
  const raw = db.prepare("SELECT creds FROM mk_shop_gateways WHERE site_id = ?").all(A.id).map((r) => r.creds).join(" ");
  for (const secret of ["sec-A", "FLWSECK-A", "hash-A", "sk_site_A", "whsec_site_A"]) assert.ok(!raw.includes(secret), `${secret} stocké en clair`);
  page = await boss.get(`${A.base}/paiements`);
  for (const secret of ["sec-A", "FLWSECK-A", "hash-A", "sk_site_A", "whsec_site_A"]) assert.ok(!page.text.includes(secret), `${secret} ré-affiché`);
  assert.equal((await boss.post(`${A.base}/paiements/paypal`, { client_id: "cid-A", secret: "", mode: "live" })).status, 302); // secret vide = conservé
  const b = await order(A, "paypal"); assert.equal(b.r.status, 303, "PayPal fonctionne encore : secret conservé");
  const before = (await new Client(srv.base).get("/boutique/commande?pays=FR", hdr(HB))).status; // site B sans panier : redirige
  await new Client(srv.base).post("/boutique/panier/ajouter", { product_id: String(B.pid), quantity: "1" }, hdr(HB));
  const cb = new Client(srv.base); await cb.post("/boutique/panier/ajouter", { product_id: String(B.pid), quantity: "1" }, hdr(HB));
  const pb = await cb.get("/boutique/commande?pays=FR", hdr(HB));
  assert.doesNotMatch(pb.text, /value="paypal"/); assert.doesNotMatch(pb.text, /value="flutterwave"/); assert.doesNotMatch(pb.text, /value="stripe"/); assert.match(pb.text, /value="manual"/);
  assert.equal((await boss.get(`${B.base}/paiements`)).status, 200);
  assert.ok(before !== undefined);
});

test("PayPal : redirection vers l'approbation, paiement confirmé APRÈS capture relue chez PayPal, facture émise ; montant différent = refus", async () => {
  const b = await order(A, "paypal");
  assert.equal(b.r.status, 303); assert.match(b.r.location, /paypal\.fake\/approve\/PP\d+/);
  assert.equal(b.o.payment_status, "pending");
  const ref = one("SELECT provider_ref FROM mk_shop_payments WHERE order_id = ?", b.o.id).provider_ref;
  // Retour sans approbation (status CREATED) : rien n'est confirmé
  const path = (u) => { const x = new URL(u); return x.pathname + x.search; };
  const back = (c, h) => c.get(path(st.pp.get(ref).returnUrl), h);
  await back(b.cli, b.h); assert.equal(one("SELECT payment_status FROM mk_shop_orders WHERE id = ?", b.o.id).payment_status, "pending");
  st.pp.get(ref).status = "APPROVED";
  await back(b.cli, b.h);
  const paid = one("SELECT * FROM mk_shop_orders WHERE id = ?", b.o.id);
  assert.equal(paid.payment_status, "paid"); assert.equal(paid.status, "paid");
  assert.ok(one("SELECT id FROM mk_shop_invoices WHERE order_id = ?", b.o.id), "facture émise");
  assert.equal(one("SELECT provider_intent FROM mk_shop_payments WHERE order_id = ?", b.o.id).provider_intent, `CAP-${ref}`);
  // Montant capturé différent du total : jamais « payée »
  const b2 = await order(A, "paypal"); const ref2 = one("SELECT provider_ref FROM mk_shop_payments WHERE order_id = ?", b2.o.id).provider_ref;
  st.pp.get(ref2).status = "APPROVED"; st.pp.get(ref2).forceAmount = { currency_code: "EUR", value: "1.00" };
  await b2.cli.get(path(st.pp.get(ref2).returnUrl), b2.h);
  assert.notEqual(one("SELECT payment_status FROM mk_shop_orders WHERE id = ?", b2.o.id).payment_status, "paid");
});

test("PayPal : remboursement par l'API du fournisseur ; refus du fournisseur = commande intacte", async () => {
  const o = one("SELECT * FROM mk_shop_orders WHERE site_id = ? AND payment_method = 'paypal' AND payment_status = 'paid' ORDER BY id", A.id);
  assert.equal((await boss.post(`${A.base}/commandes/${o.id}/remboursement`, { amount: "5,00", reason: "geste", idempotency_key: "pp-r1" })).status, 302);
  const r = one("SELECT * FROM mk_shop_refunds WHERE order_id = ?", o.id);
  assert.equal(r.status, "succeeded"); assert.equal(r.provider, "paypal"); assert.match(r.provider_ref, /^RF-CAP-PP/);
  assert.ok(calls.some((c) => c.url.includes("/refund")));
});

test("Flutterwave (Mobile Money) : webhook avec mauvais hash ignoré ; bon hash + relecture chez Flutterwave = payée ; référence inventée ignorée ; rejeu sans effet", async () => {
  const b = await order(A, "flutterwave");
  assert.equal(b.r.status, 303); assert.match(b.r.location, /flw\.fake\/pay\/kw-\d+-/);
  const ref = one("SELECT provider_ref FROM mk_shop_payments WHERE order_id = ?", b.o.id).provider_ref;
  const hook = (hash, tx) => fetch(`${srv.base}/boutique/webhooks/flutterwave`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-host": HA, "user-agent": UA, ...(hash ? { "verif-hash": hash } : {}) }, body: JSON.stringify({ event: "charge.completed", data: { tx_ref: tx } }) });
  st.flw.get(ref).status = "successful";
  assert.equal((await hook("mauvais", ref)).status, 200);
  assert.equal(one("SELECT payment_status FROM mk_shop_orders WHERE id = ?", b.o.id).payment_status, "pending", "mauvais hash : ignoré même si le fournisseur dit « successful »");
  assert.equal((await hook("hash-A", "kw-999999-FAUX")).status, 200);
  assert.equal(one("SELECT payment_status FROM mk_shop_orders WHERE id = ?", b.o.id).payment_status, "pending");
  assert.equal((await hook("hash-A", ref)).status, 200);
  assert.equal(one("SELECT payment_status FROM mk_shop_orders WHERE id = ?", b.o.id).payment_status, "paid");
  assert.equal((await hook("hash-A", ref)).status, 200);
  assert.equal(one("SELECT COUNT(*) n FROM mk_shop_invoices WHERE order_id = ?", b.o.id).n, 1, "rejeu : toujours une seule facture");
  // le site B n'a pas ces identifiants : le même message n'a aucun effet chez lui
  const other = await fetch(`${srv.base}/boutique/webhooks/flutterwave`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-host": HB, "user-agent": UA, "verif-hash": "hash-A" }, body: JSON.stringify({ data: { tx_ref: ref } }) });
  assert.equal(other.status, 200);
});

test("Flutterwave : remboursement refusé par le fournisseur → rien n'est rendu", async () => {
  const o = one("SELECT * FROM mk_shop_orders WHERE site_id = ? AND payment_method = 'flutterwave' AND payment_status = 'paid'", A.id);
  st.flwRefundFail = true;
  await boss.post(`${A.base}/commandes/${o.id}/remboursement`, { amount: "3,00", idempotency_key: "flw-r1" });
  assert.equal(one("SELECT COUNT(*) n FROM mk_shop_refunds WHERE order_id = ? AND status = 'succeeded'", o.id).n, 0);
  assert.equal(one("SELECT status FROM mk_shop_orders WHERE id = ?", o.id).status, "paid");
  st.flwRefundFail = false;
  await boss.post(`${A.base}/commandes/${o.id}/remboursement`, { amount: "3,00", idempotency_key: "flw-r2" });
  assert.equal(one("SELECT COUNT(*) n FROM mk_shop_refunds WHERE order_id = ? AND status = 'succeeded'", o.id).n, 1);
});

test("Stripe aux clés du SITE : la session est créée avec la clé du site ; webhook signé avec le secret du site ; mauvaise signature refusée", async () => {
  const b = await order(A, "stripe");
  assert.equal(b.r.status, 303); assert.match(b.r.location, /stripe\.fake\/cs_site_\d+/);
  const sid = one("SELECT provider_ref FROM mk_shop_payments WHERE order_id = ?", b.o.id).provider_ref;
  assert.equal(st.stripe.get(sid).auth, "Bearer sk_site_A", "clé du site utilisée");
  Object.assign(st.stripe.get(sid), { status: "complete", payment_status: "paid", amount_total: b.o.total_cents, currency: "eur", payment_intent: "pi_x" });
  const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed", data: { object: { id: sid, client_reference_id: `shop:${b.o.id}`, payment_status: "paid", amount_total: b.o.total_cents, currency: "eur", payment_intent: "pi_x" } } });
  const post = (sig) => fetch(`${srv.base}/boutique/webhooks/stripe`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": sig, "x-forwarded-host": HA, "user-agent": UA }, body });
  assert.equal((await post(stripeSig("whsec_autre", body))).status, 400);
  assert.equal(one("SELECT payment_status FROM mk_shop_orders WHERE id = ?", b.o.id).payment_status, "pending");
  assert.equal((await post(stripeSig("whsec_site_A", body))).status, 200);
  assert.equal(one("SELECT payment_status FROM mk_shop_orders WHERE id = ?", b.o.id).payment_status, "paid");
  const noSecret = await fetch(`${srv.base}/boutique/webhooks/stripe`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": stripeSig("whsec_site_A", body), "x-forwarded-host": HB, "user-agent": UA }, body });
  assert.equal(noSecret.status, 404, "site sans secret propre : refus");
});
