// R7 (lot 6.6) — Commerce et domaines de sites : le parcours d'achat (catalogue, panier, commande, paiement, retour du fournisseur, confirmation) reste ENTIÈREMENT sur l'hôte principal ;
// aucun domaine de site ne le sert, même module « commerce » activé, même avec des paramètres de site falsifiés ; le webhook de paiement reste signé et idempotent quel que soit l'hôte ;
// les commandes n'ont pas de site (origine inconnue, jamais inventée). Vrai serveur, faux Stripe local (aucun appel réel), base d'essai jetable.
const http = require("node:http");
const crypto = require("node:crypto");
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");

const WEBHOOK_SECRET = "whsec_test_secret";
const HA = "www.alpha.example";
let srv, boss, fake, fakeBase, db, siteId, student, course, anon;
const stripe = { sessions: new Map(), counter: 0 };
const site = { headers: { "x-forwarded-host": HA, "User-Agent": "Mozilla/5.0 (test)" } };
const main = { headers: { "User-Agent": "Mozilla/5.0 (test)" } };
const one = (sql, ...a) => db.prepare(sql).get(...a);

function startFakeStripe() {
  return new Promise((resolve) => {
    fake = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d));
      req.on("end", () => {
        const send = (status, json) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(json)); };
        if (req.headers.authorization !== "Bearer sk_test_fake") return send(401, { error: { message: "clé invalide" } });
        if (req.method === "POST" && req.url === "/v1/checkout/sessions") {
          const params = Object.fromEntries(new URLSearchParams(body));
          const amounts = Object.keys(params).filter((k) => /^line_items\[\d+\]\[price_data\]\[unit_amount\]$/.test(k)).map((k) => Number(params[k]));
          const id = `cs_test_${++stripe.counter}`;
          stripe.sessions.set(id, { id, client_reference_id: params.client_reference_id, amount_total: amounts.reduce((a, b) => a + b, 0), currency: "eur", payment_status: "unpaid", payment_intent: `pi_${id}`, success_url: params.success_url, cancel_url: params.cancel_url });
          return send(200, { id, url: `https://checkout.stripe.test/pay/${id}` });
        }
        const m = req.url.match(/^\/v1\/checkout\/sessions\/(.+)$/);
        if (req.method === "GET" && m && stripe.sessions.has(m[1])) return send(200, stripe.sessions.get(m[1]));
        send(404, { error: { message: "introuvable" } });
      });
    }).listen(0, () => { fakeBase = `http://localhost:${fake.address().port}`; resolve(); });
  });
}
const sign = (payload, t = Math.floor(Date.now() / 1000)) => `t=${t},v1=${crypto.createHmac("sha256", WEBHOOK_SECRET).update(`${t}.${payload}`).digest("hex")}`;
// Webhook envoyé À UN HÔTE PRÉCIS (en-tête x-forwarded-host) : signature valide ou non
async function webhook(host, session, { valid = true } = {}) {
  const payload = JSON.stringify({ id: `evt_${crypto.randomUUID()}`, type: "checkout.session.completed", data: { object: session } });
  const r = await fetch(`${srv.base}/stripe/webhook`, { method: "POST", headers: { "content-type": "application/json", "stripe-signature": valid ? sign(payload) : "t=1,v1=00", ...(host ? { "x-forwarded-host": host } : {}) }, body: payload });
  return r.status;
}
const count = (sql, ...a) => one(sql, ...a).n;

before(async () => {
  await startFakeStripe();
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", STRIPE_SECRET_KEY: "sk_test_fake", STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, STRIPE_API_BASE: fakeBase });
  boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
  siteId = Number(String((await boss.post("/marketing/site-web/sites", { name: "Alpha" })).location).match(/sites\/(\d+)/)[1]);
  const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${siteId}/reglages.json`)).text);
  const r = await boss.request(`/marketing/site-web/sites/${siteId}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${HA}` } } } });
  assert.equal(r.status, 200);
  course = await createCourse(boss, srv, { title: "Formation Commerce Secrète", price: 50 });
  student = await newStudent(srv);
});
after(async () => { db.close(); await srv.stop(); fake.close(); });

describe("parcours d'achat : entièrement sur l'hôte principal", () => {
  let ref, orderId;
  test("témoin : sur l'hôte principal le parcours fonctionne (panier, commande vers Stripe, webhook signé, confirmation)", async () => {
    assert.equal((await student.get("/panier", main)).status, 200);
    assert.equal((await student.get("/catalogue", main)).status, 200);
    await student.post(`/panier/ajouter/${course.id}`, {}, main);
    const pay = await student.post("/commande", { total: "1", site: siteId, site_id: siteId }, main);
    assert.equal(pay.status, 303); assert.match(pay.location, /^https:\/\/checkout\.stripe\.test\/pay\/cs_test_/);
    const cs = one("SELECT * FROM checkout_sessions ORDER BY id DESC LIMIT 1"); ref = cs.ref;
    assert.equal(cs.total_cents, 5000, "montant fixé par le serveur, champs falsifiés ignorés");
    const session = { ...stripe.sessions.get(cs.stripe_session_id), payment_status: "paid" };
    assert.equal(await webhook(null, session), 200);
    orderId = one("SELECT id FROM orders ORDER BY id DESC LIMIT 1").id;
    assert.equal((await student.get(`/commande/confirmation/${orderId}`, main)).status, 200);
  });
  test("les commandes n'ont AUCUN site : pas de colonne de site, pas de table d'attribution de commande à un site, même après des paramètres falsifiés (origine inconnue, jamais inventée)", () => {
    for (const t of ["orders", "order_items", "checkout_sessions"]) assert.ok(!db.prepare(`PRAGMA table_info(${t})`).all().some((c) => /site|organization/i.test(c.name)), t);
    assert.equal(count("SELECT COUNT(*) n FROM sqlite_master WHERE name LIKE 'mk_order_sites%'"), 0);
  });
  test("sur le domaine d'un site : catalogue, formations, panier, favoris et TOUTE la chaîne de commande sont introuvables (GET et POST), y compris le retour fournisseur et la confirmation d'une VRAIE commande", async () => {
    const before = [count("SELECT COUNT(*) n FROM orders"), count("SELECT COUNT(*) n FROM checkout_sessions"), count("SELECT COUNT(*) n FROM enrollments")];
    const gets = ["/panier", "/catalogue", "/formations", "/favoris", "/commande", `/commande/retour/${ref}`, `/commande/confirmation/${orderId}`, `/cours/${course.slug || "x"}`];
    for (const p of gets) { const r = await student.get(p, site); assert.equal(r.status, 404, `GET ${p} -> ${r.status} ${r.headers.get("location") || ""}`); assert.doesNotMatch(r.text, /Formation Commerce Secrète/); }
    for (const variant of ["/commande/", "/COMMANDE"]) { const v = await student.get(variant, site); assert.ok(v.status === 404 || (v.status === 301 && v.headers.get("location") === "/commande"), `${variant} : au pire une redirection vers l'adresse fermée`); }
    for (const p of [`/panier/ajouter/${course.id}`, "/commande", "/commande/code-promo", `/panier/retirer/${course.id}`]) { const r = await student.post(p, { code: "X", buyNow: "1", site: siteId }, site); assert.equal(r.status, 404, `POST ${p} -> ${r.status}`); }
    assert.deepEqual([count("SELECT COUNT(*) n FROM orders"), count("SELECT COUNT(*) n FROM checkout_sessions"), count("SELECT COUNT(*) n FROM enrollments")], before, "aucune écriture");
    assert.equal((await student.get(`/commande/confirmation/${orderId}`, main)).status, 200, "la confirmation reste servie sur l'hôte principal");
  });
  test("activer le module « commerce » pour le site n'ouvre AUCUN parcours d'achat sur son domaine", async () => {
    assert.equal((await boss.post(`/marketing/site-web/sites/${siteId}/modules/commerce`, { etat: "activer" })).status, 302);
    assert.equal(count("SELECT COUNT(*) n FROM mk_site_modules WHERE site_id = ? AND module = 'commerce' AND enabled = 1", siteId), 1);
    for (const p of ["/panier", "/catalogue", "/commande", `/commande/confirmation/${orderId}`]) assert.equal((await student.get(p, site)).status, 404, p);
    assert.equal((await student.post(`/panier/ajouter/${course.id}`, {}, site)).status, 404);
    assert.equal((await student.post("/commande", {}, site)).status, 404);
    assert.equal((await boss.post(`/marketing/site-web/sites/${siteId}/modules/commerce`, { etat: "desactiver" })).status, 302);
  });
  test("paramètres et en-têtes de site falsifiés sur l'hôte principal : sans effet sur la commande (aucun site n'est lu dans la requête)", async () => {
    const e2 = await newStudent(srv);
    await e2.post(`/panier/ajouter/${course.id}`, {}, main);
    const r = await e2.post(`/commande?site=${siteId}`, { site: siteId, site_id: siteId, siteId, origine: "faux" }, { headers: { ...main.headers, "x-site-id": String(siteId) } });
    assert.equal(r.status, 303);
    const cs = one("SELECT * FROM checkout_sessions ORDER BY id DESC LIMIT 1"); assert.ok(!JSON.stringify(cs).includes(String(`"site`)));
    assert.equal(count("SELECT COUNT(*) n FROM sqlite_master WHERE name LIKE 'mk_order_sites%'"), 0);
  });
  test("webhook de paiement : signature obligatoire sur n'importe quel hôte (principal ou domaine de site) ; une livraison valide rejouée sur un autre hôte ne crée rien de plus", async () => {
    const e3 = await newStudent(srv);
    await e3.post(`/panier/ajouter/${course.id}`, {}, main); await e3.post("/commande", {}, main);
    const cs = one("SELECT * FROM checkout_sessions ORDER BY id DESC LIMIT 1");
    const session = { ...stripe.sessions.get(cs.stripe_session_id), payment_status: "paid" };
    const orders = count("SELECT COUNT(*) n FROM orders");
    assert.deepEqual([await webhook(null, session, { valid: false }), await webhook(HA, session, { valid: false })], [400, 400], "signature invalide refusée partout");
    assert.equal(count("SELECT COUNT(*) n FROM orders"), orders);
    assert.equal(await webhook(HA, session), 200); assert.equal(count("SELECT COUNT(*) n FROM orders"), orders + 1);
    assert.equal(await webhook(null, session), 200); assert.equal(await webhook(HA, session), 200);
    assert.equal(count("SELECT COUNT(*) n FROM orders"), orders + 1, "idempotent : une seule commande");
    assert.equal(count("SELECT COUNT(*) n FROM enrollments e JOIN users u ON u.id = e.user_id WHERE u.id = ?", cs.user_id), 1);
  });
  test("domaine inconnu ou retiré : jamais le parcours d'achat (421 / 404)", async () => {
    for (const p of ["/panier", "/commande", "/catalogue"]) {
      const unknown = await anon.get(p, { headers: { "x-forwarded-host": "inconnu.example", "User-Agent": "Mozilla/5.0 (test)" } });
      assert.ok([404, 421].includes(unknown.status), `${p} ${unknown.status}`);
    }
  });
});
