// Paiement Stripe : parcours réel contre un FAUX serveur Stripe local (STRIPE_API_BASE) et des webhooks signés par nous.
// Ce que ces tests prouvent : montants fixés par le serveur, commande créée seulement après paiement confirmé et authentifié,
// idempotence, refus des signatures/montants invalides, panne de Stripe sans commande orpheline.
// Ce qu'ils NE prouvent PAS : le dialogue avec le vrai Stripe (clés, page de paiement, webhook configuré) → à vérifier avec une clé de test.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");

const WEBHOOK_SECRET = "whsec_test_secret";
const G = "/formateur/gestion";
let srv, prof, fake, fakeBase, courseA;
const stripe = { sessions: new Map(), created: [], down: false, counter: 0 };

// Faux Stripe : crée des sessions et les relit (comme GET /v1/checkout/sessions/:id)
function startFakeStripe() {
  return new Promise((resolve) => {
    fake = http.createServer((req, res) => {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        const send = (status, json) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(json)); };
        if (req.headers.authorization !== "Bearer sk_test_fake") return send(401, { error: { message: "clé invalide" } });
        if (stripe.down) return send(500, { error: { message: "panne simulée" } });
        if (req.method === "POST" && req.url === "/v1/checkout/sessions") {
          const params = Object.fromEntries(new URLSearchParams(body));
          const amounts = Object.keys(params).filter((k) => /^line_items\[\d+\]\[price_data\]\[unit_amount\]$/.test(k)).map((k) => Number(params[k]));
          const id = `cs_test_${++stripe.counter}`;
          const session = { id, client_reference_id: params.client_reference_id, amount_total: amounts.reduce((a, b) => a + b, 0), currency: params["line_items[0][price_data][currency]"], payment_status: "unpaid", payment_intent: `pi_${stripe.counter}` };
          stripe.sessions.set(id, session);
          stripe.created.push({ params, amounts, session });
          return send(200, { id, url: `https://checkout.stripe.test/pay/${id}` });
        }
        const m = req.url.match(/^\/v1\/checkout\/sessions\/(.+)$/);
        if (req.method === "GET" && m && stripe.sessions.has(m[1])) return send(200, stripe.sessions.get(m[1]));
        send(404, { error: { message: "introuvable" } });
      });
    }).listen(0, () => { fakeBase = `http://localhost:${fake.address().port}`; resolve(); });
  });
}

const sign = (payload, { secret = WEBHOOK_SECRET, t = Math.floor(Date.now() / 1000) } = {}) =>
  `t=${t},v1=${crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex")}`;
async function webhook(type, session, { signature, secret, t } = {}) {
  const payload = JSON.stringify({ id: `evt_${crypto.randomUUID()}`, type, data: { object: session } });
  const r = await fetch(`${srv.base}/stripe/webhook`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": signature ?? sign(payload, { secret, t }) }, body: payload });
  return { status: r.status, json: await r.json() };
}
const count = (sql, ...args) => { const db = srv.db(); try { return db.prepare(sql).get(...args).n; } finally { db.close(); } };
const pending = (userEmail) => {
  const db = srv.db();
  try { return db.prepare("SELECT cs.* FROM checkout_sessions cs JOIN users u ON u.id = cs.user_id WHERE u.email = ? ORDER BY cs.id DESC").get(userEmail); } finally { db.close(); }
};
// Un élève met la formation au panier et clique sur « Payer » : renvoie la réponse et la session Stripe créée
async function startPayment(student, courseIds) {
  for (const id of courseIds) await student.post(`/panier/ajouter/${id}`, {});
  const before = stripe.created.length;
  // Champs « malins » ajoutés au formulaire : ils doivent être ignorés (les montants viennent du serveur)
  const r = await student.post("/commande", { total: "1", price_cents: "1", amount: "1" });
  return { r, created: stripe.created.slice(before) };
}
const paidSession = (cs, extra = {}) => ({ ...stripe.sessions.get(cs.stripe_session_id), payment_status: "paid", ...extra });

before(async () => {
  await startFakeStripe();
  srv = await startServer({ STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, STRIPE_API_BASE: fakeBase });
  prof = await loginInstructor(srv);
  courseA = await createCourse(prof, srv, { title: "Formation Stripe A", price: 50 });
});
after(async () => { await srv.stop(); fake.close(); });

test("la page de paiement annonce Stripe (plus de formulaire de carte factice)", async () => {
  const e = await newStudent(srv);
  await e.post(`/panier/ajouter/${courseA.id}`, {});
  const page = await e.get("/commande");
  assert.match(page.text, /Stripe/);
  assert.doesNotMatch(page.text, /Numéro de carte|simulation/);
});

test("« Payer » : redirection vers Stripe, montant fixé par le serveur, AUCUNE commande ni accès avant paiement", async () => {
  const e = await newStudent(srv);
  await prof.post(`${G}/ventes/coupons`, { code: "PROMO20", kind: "percent", value: "20", active: "on" });
  await e.post(`/panier/ajouter/${courseA.id}`, {});
  await e.post("/commande/code-promo", { code: "PROMO20" });
  const { r, created } = await startPayment(e, []);
  assert.equal(r.status, 303);
  assert.match(r.location, /^https:\/\/checkout\.stripe\.test\/pay\/cs_test_/);
  assert.equal(created.length, 1);
  assert.deepEqual(created[0].amounts, [4000], "50 € − 20 % = 40 €, malgré les champs falsifiés du formulaire");
  assert.equal(created[0].params["line_items[0][price_data][currency]"], "eur");
  assert.equal(created[0].params.mode, "payment");
  assert.equal(created[0].params.customer_email, e.email);
  const cs = pending(e.email);
  assert.equal(cs.status, "pending");
  assert.equal(cs.total_cents, 4000);
  assert.equal(count("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email), 0, "pas de commande avant paiement");
  assert.equal(count("SELECT COUNT(*) n FROM enrollments en JOIN users u ON u.id = en.user_id WHERE u.email = ?", e.email), 0, "pas d'accès avant paiement");
  const noAccess = await e.get("/mes-cours");
  assert.doesNotMatch(noAccess.text, /Formation Stripe A/);
});

test("webhook : signature invalide, ancienne ou absente → refusé, rien n'est accordé", async () => {
  const e = await newStudent(srv);
  await startPayment(e, [courseA.id]);
  const cs = pending(e.email);
  const session = paidSession(cs);
  const wrongSecret = await webhook("checkout.session.completed", session, { secret: "whsec_autre" });
  const old = await webhook("checkout.session.completed", session, { t: Math.floor(Date.now() / 1000) - 3600 });
  const missing = await webhook("checkout.session.completed", session, { signature: "n'importe quoi" });
  assert.deepEqual([wrongSecret.status, old.status, missing.status], [400, 400, 400]);
  assert.equal(count("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email), 0);
  assert.equal(pending(e.email).status, "pending");
});

test("webhook signé : commande, remise, accès et e-mail créés ; un rejeu ne crée rien de plus", async () => {
  const e = await newStudent(srv);
  await e.post(`/panier/ajouter/${courseA.id}`, {});
  await e.post("/commande/code-promo", { code: "PROMO20" });
  await e.post("/commande", {});
  const cs = pending(e.email);
  const session = paidSession(cs);
  const first = await webhook("checkout.session.completed", session);
  assert.equal(first.status, 200);
  const db = srv.db();
  const order = db.prepare("SELECT o.* FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?").get(e.email);
  assert.equal(order.total_cents, 4000);
  assert.equal(order.coupon_code, "PROMO20");
  assert.equal(order.discount_cents, 1000);
  const item = db.prepare("SELECT * FROM order_items WHERE order_id = ?").get(order.id);
  assert.equal(item.price_cents, 4000);
  assert.equal(item.list_price_cents, 5000);
  assert.ok(db.prepare("SELECT 1 FROM enrollments en JOIN users u ON u.id = en.user_id WHERE u.email = ? AND en.course_id = ?").get(e.email, courseA.id), "accès ouvert");
  assert.ok(db.prepare("SELECT 1 FROM mail_outbox WHERE kind = 'purchase' AND to_email = ?").get(e.email), "e-mail d'achat en file");
  const row = db.prepare("SELECT status, order_id, stripe_payment_intent FROM checkout_sessions WHERE ref = ?").get(cs.ref);
  db.close();
  assert.equal(row.status, "paid");
  assert.equal(row.order_id, order.id);
  assert.ok(row.stripe_payment_intent);
  const replay = await webhook("checkout.session.completed", session);
  assert.equal(replay.status, 200);
  assert.equal(count("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email), 1, "pas de doublon");
  assert.match((await e.get("/mes-cours")).text, /Formation Stripe A/);
});

test("webhook : un montant encaissé différent de celui du serveur n'ouvre aucun accès", async () => {
  const e = await newStudent(srv);
  await startPayment(e, [courseA.id]);
  const cs = pending(e.email);
  const r = await webhook("checkout.session.completed", paidSession(cs, { amount_total: 100 }));
  assert.equal(r.status, 200);
  assert.equal(count("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email), 0);
  assert.equal(pending(e.email).status, "failed");
});

test("paiement asynchrone : « completed » non payé n'accorde rien, « async_payment_succeeded » oui", async () => {
  const e = await newStudent(srv);
  await startPayment(e, [courseA.id]);
  const cs = pending(e.email);
  await webhook("checkout.session.completed", { ...paidSession(cs), payment_status: "unpaid" });
  assert.equal(count("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email), 0);
  await webhook("checkout.session.async_payment_succeeded", paidSession(cs));
  assert.equal(count("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email), 1);
});

test("retour du client sans webhook : la session est relue chez Stripe, commande créée une seule fois, panier vidé", async () => {
  const e = await newStudent(srv);
  await startPayment(e, [courseA.id]);
  const cs = pending(e.email);
  const waiting = await e.get(`/commande/retour/${cs.ref}`); // Stripe n'a pas encore confirmé
  assert.equal(waiting.status, 200);
  assert.match(waiting.text, /vérifions votre paiement/);
  assert.equal(count("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email), 0);
  stripe.sessions.get(cs.stripe_session_id).payment_status = "paid";
  const back = await e.get(`/commande/retour/${cs.ref}`);
  assert.equal(back.status, 302);
  assert.match(back.location, /^\/commande\/confirmation\/\d+$/);
  assert.equal((await e.get(back.location)).status, 200);
  await e.get(`/commande/retour/${cs.ref}`); // rechargement de la page
  assert.equal(count("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email), 1);
  assert.match((await e.get("/panier")).text, /vide|Votre panier/i);
});

test("le retour d'un paiement n'est accessible qu'à son propriétaire", async () => {
  const e = await newStudent(srv);
  await startPayment(e, [courseA.id]);
  const cs = pending(e.email);
  const autre = await newStudent(srv);
  assert.equal((await autre.get(`/commande/retour/${cs.ref}`)).status, 404);
  assert.equal((await new Client(srv.base).get(`/commande/retour/${cs.ref}`)).status, 302, "anonyme : renvoyé vers la connexion");
});

test("session expirée : rien n'est accordé, message clair", async () => {
  const e = await newStudent(srv);
  await startPayment(e, [courseA.id]);
  const cs = pending(e.email);
  await webhook("checkout.session.expired", paidSession(cs, { payment_status: "unpaid" }));
  assert.equal(pending(e.email).status, "expired");
  const back = await e.get(`/commande/retour/${cs.ref}`);
  assert.equal(back.status, 402);
  assert.match(back.text, /pas été débité/);
  assert.equal(count("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email), 0);
});

test("Stripe en panne : message clair, aucune commande, le site reste en ligne", async () => {
  const e = await newStudent(srv);
  stripe.down = true;
  try {
    const { r } = await startPayment(e, [courseA.id]);
    assert.equal(r.status, 502);
    assert.match(r.text, /momentanément indisponible/);
    assert.doesNotMatch(r.text, /panne simulée|Stripe 500/);
  } finally { stripe.down = false; }
  assert.equal(pending(e.email).status, "failed");
  assert.equal(count("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email), 0);
  assert.equal((await new Client(srv.base).get("/sante")).status, 200);
});

test("commande gratuite (remise de 100 %) : enregistrée sans passer par Stripe", async () => {
  const gratuit = await createCourse(prof, srv, { title: "Formation offerte par code", price: 30 });
  await prof.post(`${G}/ventes/coupons`, { code: "TOUT100", kind: "percent", value: "100", course_id: String(gratuit.id), active: "on" });
  const e = await newStudent(srv);
  await e.post(`/panier/ajouter/${gratuit.id}`, {});
  await e.post("/commande/code-promo", { code: "TOUT100" });
  const avant = stripe.created.length;
  const r = await e.post("/commande", {});
  assert.equal(r.status, 302);
  assert.match(r.location, /^\/commande\/confirmation\/\d+$/);
  assert.equal(stripe.created.length, avant, "Stripe n'est pas appelé");
  assert.equal(count("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ? AND o.total_cents = 0", e.email), 1);
});

test("offre en cours : Stripe reçoit le prix de l'offre, la commande garde l'offre et le prix standard", async () => {
  const db = srv.db();
  const offerId = Number(db.prepare("INSERT INTO offers (course_id, instructor_id, name, price_cents) VALUES (?, (SELECT instructor_id FROM courses WHERE id = ?), 'Offre Stripe', 3000)").run(courseA.id, courseA.id).lastInsertRowid);
  db.close();
  try {
    const e = await newStudent(srv);
    const { r, created } = await startPayment(e, [courseA.id]);
    assert.equal(r.status, 303);
    assert.deepEqual(created[0].amounts, [3000], "50 € standard, 30 € avec l'offre");
    const cs = pending(e.email);
    assert.equal(cs.total_cents, 3000);
    assert.equal((await webhook("checkout.session.completed", paidSession(cs))).status, 200);
    const d = srv.db();
    const order = d.prepare("SELECT o.id, o.total_cents FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?").get(e.email);
    const item = d.prepare("SELECT price_cents, list_price_cents, offer_id, offer_name FROM order_items WHERE order_id = ?").get(order.id);
    d.close();
    assert.equal(order.total_cents, 3000);
    assert.deepEqual({ ...item }, { price_cents: 3000, list_price_cents: 5000, offer_id: offerId, offer_name: "Offre Stripe" });
  } finally {
    const d = srv.db();
    d.exec("DELETE FROM offers");
    d.close();
  }
});

test("paiement en cours créé AVANT les offres (sans offer_id) : accepté, ligne sans offre", async () => {
  const e = await newStudent(srv);
  await startPayment(e, [courseA.id]);
  const cs = pending(e.email);
  const d = srv.db();
  // Ancien format de session : lignes sans offer_id / offer_name
  d.prepare("UPDATE checkout_sessions SET items_json = ? WHERE ref = ?").run(JSON.stringify([{ course_id: courseA.id, price_cents: cs.total_cents, list_price_cents: 5000 }]), cs.ref);
  d.close();
  assert.equal((await webhook("checkout.session.completed", paidSession(cs))).status, 200);
  const d2 = srv.db();
  const item = d2.prepare("SELECT offer_id, offer_name FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN users u ON u.id = o.user_id WHERE u.email = ?").get(e.email);
  d2.close();
  assert.deepEqual({ ...item }, { offer_id: null, offer_name: null });
});

test("Centre de gestion : l'onglet Transactions liste les vrais paiements Stripe (payé, en attente, échoué), Remboursements renvoie vers Stripe", async () => {
  const ok = await newStudent(srv);
  await startPayment(ok, [courseA.id]);
  const csOk = pending(ok.email);
  await webhook("checkout.session.completed", paidSession(csOk));
  const wait = await newStudent(srv);
  await startPayment(wait, [courseA.id]);
  const bad = await newStudent(srv);
  await startPayment(bad, [courseA.id]);
  await webhook("checkout.session.completed", paidSession(pending(bad.email), { amount_total: 1 })); // montant inattendu : échoué

  const page = (await prof.get(`${G}/ventes/transactions`)).text;
  assert.doesNotMatch(page, /Aucun prestataire de paiement connecté/);
  const rowOf = (email) => page.slice(page.indexOf(email), page.indexOf("</tr>", page.indexOf(email)));
  assert.match(rowOf(ok.email), /Payé/);
  assert.match(rowOf(ok.email), new RegExp(csOk.stripe_payment_intent || "pi_"));
  assert.match(rowOf(wait.email), /En attente/);
  assert.match(rowOf(bad.email), /Échoué/);
  assert.match(rowOf(bad.email), /montant inattendu : à vérifier dans Stripe/);
  assert.match((await prof.get(`${G}/ventes/remboursements`)).text, /Les remboursements se font dans Stripe/);
});
