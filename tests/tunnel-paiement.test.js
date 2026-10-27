// Tunnels — étapes de paiement (bon de commande, order bump, offre complémentaire, offre de repli) de bout en bout :
// vrai serveur, vraie base, FAUX serveur Stripe local et webhooks signés par nous.
// Ce que ces tests prouvent : montants fixés par le serveur, rien n'est accordé avant la confirmation de Stripe, le parcours reprend
// à la bonne étape après le paiement, l'offre de repli est sautée après un upsell accepté, une étape hors tunnel actif n'est pas servie.
// Ce qu'ils NE prouvent PAS : le dialogue avec le vrai Stripe (clés, page de paiement hébergée).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, newStudent, loginInstructor, createCourse } = require("./helpers");

const SECRET = "whsec_tunnel_test";
const M = "/marketing";
let srv, prof, db, fake, fakeBase, A, B, C, D, E, funnelId, step = {};
const stripe = { sessions: new Map(), created: [], counter: 0 };
const one = (sql, ...a) => db.prepare(sql).get(...a);
const count = (sql, ...a) => one(sql, ...a).n;

function startFakeStripe() {
  return new Promise((resolve) => {
    fake = http.createServer((req, res) => {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        const send = (status, json) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(json)); };
        if (req.method === "POST" && req.url === "/v1/checkout/sessions") {
          const params = Object.fromEntries(new URLSearchParams(body));
          const amounts = Object.keys(params).filter((k) => /^line_items\[\d+\]\[price_data\]\[unit_amount\]$/.test(k)).map((k) => Number(params[k]));
          const id = `cs_tunnel_${++stripe.counter}`;
          const session = { id, client_reference_id: params.client_reference_id, amount_total: amounts.reduce((a, b) => a + b, 0), currency: "eur", payment_status: "unpaid", payment_intent: `pi_t${stripe.counter}` };
          stripe.sessions.set(id, session);
          stripe.created.push({ params, amounts });
          return send(200, { id, url: `https://checkout.stripe.test/pay/${id}` });
        }
        const m = req.url.match(/^\/v1\/checkout\/sessions\/(.+)$/);
        if (req.method === "GET" && m && stripe.sessions.has(m[1])) return send(200, stripe.sessions.get(m[1]));
        send(404, { error: { message: "introuvable" } });
      });
    }).listen(0, () => { fakeBase = `http://localhost:${fake.address().port}`; resolve(); });
  });
}
const sign = (payload) => { const t = Math.floor(Date.now() / 1000); return `t=${t},v1=${crypto.createHmac("sha256", SECRET).update(`${t}.${payload}`).digest("hex")}`; };
async function confirmPayment(sessionRow) {
  const session = { ...stripe.sessions.get(sessionRow.stripe_session_id), payment_status: "paid" };
  const payload = JSON.stringify({ id: `evt_${crypto.randomUUID()}`, type: "checkout.session.completed", data: { object: session } });
  const r = await fetch(`${srv.base}/stripe/webhook`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": sign(payload) }, body: payload });
  assert.equal(r.status, 200);
}
const lastSession = (email) => one("SELECT cs.* FROM checkout_sessions cs JOIN users u ON u.id = cs.user_id WHERE u.email = ? ORDER BY cs.id DESC", email);
const orders = (email) => count("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", email);
const slugOf = (course) => one("SELECT slug FROM courses WHERE id = ?", course.id).slug;
const addStep = async (type, name, course) => {
  const r = await prof.post(`${M}/tunnels/${funnelId}/etapes`, { type, name, course_id: String(course.id), source: "nouvelle" });
  assert.equal(r.status, 302, r.text.slice(0, 300));
  return one("SELECT id FROM mk_funnel_steps WHERE funnel_id = ? AND name = ?", funnelId, name).id;
};
const pay = (client, id, extra = {}) => client.post(`/tunnel/offre/${id}/payer`, extra);

before(async () => {
  await startFakeStripe();
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_WEBHOOK_SECRET: SECRET, STRIPE_API_BASE: fakeBase });
  prof = await loginInstructor(srv); db = srv.db();
  A = await createCourse(prof, srv, { title: "Offre principale", price: 50 });
  B = await createCourse(prof, srv, { title: "Offre complémentaire", price: 30 });
  C = await createCourse(prof, srv, { title: "Offre de repli", price: 10 });
  D = await createCourse(prof, srv, { title: "Offre additionnelle", price: 15 });
  E = await createCourse(prof, srv, { title: "Formation finale", price: 5 });
  const made = await prof.post(`${M}/tunnels`, { name: "Tunnel de vente" });
  assert.equal(made.status, 302);
  funnelId = Number(made.location.match(/tunnels\/(\d+)/)[1]);
  step.order = await addStep("order", "Commande", A);
  step.upsell = await addStep("upsell", "Complément", B);
  step.downsell = await addStep("downsell", "Repli", C);
  step.final = await addStep("course", "Fin", E);
});
after(async () => { db.close(); await srv.stop(); fake.close(); });

test("l'écran du tunnel propose les étapes de paiement et l'offre additionnelle", async () => {
  const page = await prof.get(`${M}/tunnels/${funnelId}`);
  assert.match(page.text, /Bon de commande/);
  assert.match(page.text, /Offre complémentaire \(upsell\)/);
  assert.match(page.text, /Offre de repli \(downsell\)/);
  assert.match(page.text, /Offre additionnelle \(order bump\)/);
  assert.equal(one("SELECT type FROM mk_funnel_steps WHERE id = ?", step.order).type, "order");
});

test("sans compte : redirection vers la connexion ; étape inconnue ou qui n'est pas un paiement : introuvable", async () => {
  const anon = await newStudent(srv); // compte neuf, puis déconnecté pour la première vérification
  const r = await fetch(`${srv.base}/tunnel/offre/${step.order}`, { redirect: "manual" });
  assert.equal(r.status, 302);
  assert.match(r.headers.get("location"), /^\/connexion/);
  assert.equal((await anon.get("/tunnel/offre/999999")).status, 404);
  assert.equal((await anon.get(`/tunnel/offre/${step.final}`)).status, 404, "une étape « Formation » n'est pas une offre");
});

test("bon de commande : montant fixé par le serveur, AUCUNE commande ni accès avant la confirmation de Stripe", async () => {
  const e = await newStudent(srv);
  const page = await e.get(`/tunnel/offre/${step.order}`);
  assert.equal(page.status, 200);
  assert.match(page.text, /Offre principale/);
  const before = stripe.created.length;
  const r = await pay(e, step.order, { expected_total: "5000", total: "1", price_cents: "1" }); // champs falsifiés ignorés
  assert.equal(r.status, 303);
  assert.match(r.location, /^https:\/\/checkout\.stripe\.test\/pay\/cs_tunnel_/);
  assert.deepEqual(stripe.created.slice(before)[0].amounts, [5000]);
  const cs = lastSession(e.email);
  assert.equal(cs.status, "pending");
  assert.equal(cs.funnel_step_id, step.order);
  assert.equal(orders(e.email), 0);
  assert.equal(count("SELECT COUNT(*) n FROM enrollments en JOIN users u ON u.id = en.user_id WHERE u.email = ?", e.email), 0);
});

test("prix changé entre l'affichage et le clic : le client revoit le total, aucune page Stripe créée", async () => {
  const e = await newStudent(srv);
  const before = stripe.created.length;
  const r = await pay(e, step.order, { expected_total: "1234" });
  assert.equal(r.status, 302);
  assert.equal(r.location, `/tunnel/offre/${step.order}`);
  assert.equal(stripe.created.length, before);
  assert.match((await e.get(`/tunnel/offre/${step.order}`)).text, /Le prix a changé/);
});

test("order bump : proposé seulement si configuré, ajouté seulement si coché, jamais la formation principale elle-même", async () => {
  const e = await newStudent(srv);
  assert.doesNotMatch((await e.get(`/tunnel/offre/${step.order}`)).text, /id="offer-bump"/, "pas de case sans configuration");
  await prof.post(`${M}/tunnels/${funnelId}/etapes/${step.order}/reglages`, { bumpCourseId: String(A.id), bumpLabel: "x" });
  assert.equal(JSON.parse(one("SELECT settings FROM mk_funnel_steps WHERE id = ?", step.order).settings).bumpCourseId, null, "la formation principale ne peut pas être son propre bump");
  await prof.post(`${M}/tunnels/${funnelId}/etapes/${step.order}/reglages`, { bumpCourseId: String(D.id), bumpLabel: "Ajoutez la formation D" });
  const settings = JSON.parse(one("SELECT settings FROM mk_funnel_steps WHERE id = ?", step.order).settings);
  assert.equal(settings.bumpCourseId, D.id);
  assert.equal(settings.noindex, false, "les autres réglages de l'étape sont conservés");
  const page = await e.get(`/tunnel/offre/${step.order}`);
  assert.match(page.text, /id="offer-bump"/);
  assert.match(page.text, /Ajoutez la formation D/);
  let before = stripe.created.length;
  await pay(e, step.order, { expected_total: "5000" });
  assert.deepEqual(stripe.created.slice(before)[0].amounts, [5000], "case non cochée : seulement l'offre principale");
  before = stripe.created.length;
  await pay(e, step.order, { expected_total: "6500", bump: "on" });
  assert.deepEqual(stripe.created.slice(before)[0].amounts, [5000, 1500]);
  assert.equal(lastSession(e.email).total_cents, 6500);
});

test("parcours complet : commande payée → offre complémentaire → refus → offre de repli → refus → étape finale", async () => {
  const e = await newStudent(srv);
  await pay(e, step.order, { expected_total: "5000" });
  const cs = lastSession(e.email);
  await confirmPayment(cs);
  assert.equal(orders(e.email), 1);
  assert.ok(one("SELECT 1 x FROM enrollments en JOIN users u ON u.id = en.user_id WHERE u.email = ? AND en.course_id = ?", e.email, A.id));
  const back = await e.get(`/commande/retour/${cs.ref}`);
  assert.equal(back.status, 302);
  assert.equal(back.location, `/tunnel/offre/${step.upsell}`, "après le bon de commande : l'offre complémentaire");
  const declined = await e.post(`/tunnel/offre/${step.upsell}/refuser`, {});
  assert.equal(declined.location, `/tunnel/offre/${step.downsell}`, "refus de l'upsell : l'offre de repli");
  assert.equal(orders(e.email), 1, "refuser ne crée aucune commande");
  const declined2 = await e.post(`/tunnel/offre/${step.downsell}/refuser`, {});
  assert.equal(declined2.location, `/cours/${slugOf(E)}`, "refus du repli : étape finale");
  const noRefuse = await e.post(`/tunnel/offre/${step.order}/refuser`, {});
  assert.equal(noRefuse.location, `/tunnel/offre/${step.order}`, "le bon de commande ne se refuse pas");
});

test("offre complémentaire acceptée et payée : l'offre de repli est sautée", async () => {
  const e = await newStudent(srv);
  await pay(e, step.upsell, { expected_total: "3000" });
  const cs = lastSession(e.email);
  assert.equal(cs.funnel_step_id, step.upsell);
  await confirmPayment(cs);
  const back = await e.get(`/commande/retour/${cs.ref}`);
  assert.equal(back.location, `/cours/${slugOf(E)}`);
  // déjà acheté : revenir sur l'offre fait avancer, sans repayer
  const again = await e.get(`/tunnel/offre/${step.upsell}`);
  assert.equal(again.status, 302);
  assert.equal(again.location, `/cours/${slugOf(E)}`);
});

test("code promo sur le bon de commande : remise appliquée par le serveur, code invalide refusé sans page Stripe", async () => {
  await prof.post("/formateur/gestion/ventes/coupons", { code: "TUNNEL20", kind: "percent", value: "20", active: "on" });
  const e = await newStudent(srv);
  let before = stripe.created.length;
  const bad = await pay(e, step.order, { expected_total: "5000", code: "INCONNU" });
  assert.equal(bad.location, `/tunnel/offre/${step.order}`);
  assert.equal(stripe.created.length, before);
  assert.match((await e.get(`/tunnel/offre/${step.order}`)).text, /Code promo inconnu/);
  const ok = await pay(e, step.order, { expected_total: "5000", code: "tunnel20" });
  assert.equal(ok.status, 303);
  assert.deepEqual(stripe.created.slice(before)[0].amounts, [4000], "50 € − 20 %");
  const cs = lastSession(e.email);
  assert.equal(cs.total_cents, 4000); assert.equal(cs.discount_cents, 1000); assert.equal(cs.coupon_code, "TUNNEL20");
  await confirmPayment(cs);
  assert.equal(one("SELECT total_cents t FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ?", e.email).t, 4000);
});

test("un webhook rejoué ne crée pas une deuxième commande", async () => {
  const e = await newStudent(srv);
  await pay(e, step.downsell, { expected_total: "1000" });
  const cs = lastSession(e.email);
  await confirmPayment(cs); await confirmPayment(cs);
  assert.equal(orders(e.email), 1);
});

test("sans clé Stripe, aucun paiement n'est simulé (autre serveur)", async () => {
  const s2 = await startServer({ ENCRYPTION_KEY: TEST_KEY, SMTP_HOST: "" });
  try {
    const p = await loginInstructor(s2); const d2 = s2.db();
    const course = await createCourse(p, s2, { title: "Sans Stripe", price: 40 });
    const made = await p.post(`${M}/tunnels`, { name: "T2" });
    const fid = Number(made.location.match(/tunnels\/(\d+)/)[1]);
    await p.post(`${M}/tunnels/${fid}/etapes`, { type: "order", name: "Commande", course_id: String(course.id), source: "nouvelle" });
    const sid = d2.prepare("SELECT id FROM mk_funnel_steps WHERE funnel_id = ?").get(fid).id;
    const e = await newStudent(s2);
    const page = await e.get(`/tunnel/offre/${sid}`);
    assert.match(page.text, /pas encore ouvert/);
    const r = await e.post(`/tunnel/offre/${sid}/payer`, { expected_total: "4000" });
    assert.ok(r.status >= 400, `refusé (${r.status})`);
    assert.equal(d2.prepare("SELECT COUNT(*) n FROM orders").get().n, 0);
    assert.equal(d2.prepare("SELECT COUNT(*) n FROM checkout_sessions").get().n, 0);
    d2.close();
  } finally { await s2.stop(); }
});

test("tunnel archivé : l'offre n'est plus servie ; un modèle « vente avec bon de commande » crée un vrai bon de commande", async () => {
  const made = await prof.post(`${M}/tunnels`, { name: "Depuis le modèle", template: "vente-commande" });
  assert.equal(made.status, 302, made.text.slice(0, 200));
  const fid = Number(made.location.match(/tunnels\/(\d+)/)[1]);
  const types = db.prepare("SELECT type FROM mk_funnel_steps WHERE funnel_id = ? ORDER BY position").all(fid).map((r) => r.type);
  assert.deepEqual(types, ["sales", "order", "thankyou"]);
  const e = await newStudent(srv);
  const orderId = one("SELECT id FROM mk_funnel_steps WHERE funnel_id = ? AND type = 'order'", fid).id;
  assert.equal((await e.get(`/tunnel/offre/${orderId}`)).status, 200);
  assert.equal((await prof.post(`${M}/tunnels/${fid}/archiver`, {})).status, 302);
  assert.equal((await e.get(`/tunnel/offre/${orderId}`)).status, 404);
});
