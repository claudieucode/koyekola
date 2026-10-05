// Offres dans l'achat : panier, paiement, commande et lignes de commande utilisent le prix effectif (offre en cours).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent, createCourse } = require("./helpers");

const G = "/formateur/gestion";
let srv, prof, course;
const sql = (query, ...args) => { const db = srv.db(); try { return db.prepare(query).all(...args); } finally { db.close(); } };
const run = (query, ...args) => { const db = srv.db(); try { return db.prepare(query).run(...args); } finally { db.close(); } };
const day = (offset) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 19).replace("T", " ");
const addOffer = (courseId, price, { name = "Lancement", starts = null, ends = null, active = 1 } = {}) =>
  Number(run("INSERT INTO offers (course_id, instructor_id, name, price_cents, starts_at, ends_at, active) VALUES (?, (SELECT instructor_id FROM courses WHERE id = ?), ?, ?, ?, ?, ?)", courseId, courseId, name, price, starts, ends, active).lastInsertRowid);
const orderOf = (email) => sql("SELECT o.* FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ? ORDER BY o.id DESC", email)[0];
const items = (orderId) => sql("SELECT * FROM order_items WHERE order_id = ?", orderId);
const fresh = async (courseId) => { const e = await newStudent(srv); await e.post(`/panier/ajouter/${courseId}`, {}); return e; };
const hidden = (html) => html.match(/name="expected_total" value="(\d+)"/)?.[1];

before(async () => {
  srv = await startServer(); // sans Stripe : paiement de démonstration
  prof = await loginInstructor(srv);
  course = await createCourse(prof, srv, { title: "Formation Offre Achat", price: 50 });
});
after(() => srv.stop());

test("sans offre : rien ne change (panier, total et commande au prix standard)", async () => {
  const e = await fresh(course.id);
  assert.match((await e.get("/panier")).text, /50,00\s*€/);
  assert.doesNotMatch((await e.get("/commande")).text, /price-old/);
  const r = await e.post("/commande", {});
  assert.equal(r.status, 302);
  const o = orderOf(e.email);
  assert.equal(o.total_cents, 5000);
  const [it] = items(o.id);
  assert.deepEqual([it.price_cents, it.list_price_cents, it.offer_id, it.offer_name], [5000, 5000, null, null]);
});

test("offre en cours : panier et paiement affichent le prix barré, la commande est enregistrée avec l'offre", async () => {
  const offerId = addOffer(course.id, 3000, { name: "Soldes d'automne", ends: day(5) });
  const e = await fresh(course.id);
  const cart = (await e.get("/panier")).text;
  assert.match(cart, /30,00\s*€/);
  assert.match(cart, /class="price-old"/);
  assert.match(cart, /50,00\s*€/);
  const checkout = (await e.get("/commande")).text;
  assert.match(checkout, /class="price-old"/);
  assert.equal(hidden(checkout), "3000");
  const r = await e.post("/commande", { expected_total: "3000", total: "1", price_cents: "1" }); // champs falsifiés ignorés
  assert.equal(r.status, 302);
  const o = orderOf(e.email);
  assert.equal(o.total_cents, 3000);
  const [it] = items(o.id);
  assert.deepEqual([it.price_cents, it.list_price_cents, it.offer_id, it.offer_name], [3000, 5000, offerId, "Soldes d'automne"]);
  assert.ok(sql("SELECT 1 FROM enrollments en JOIN users u ON u.id = en.user_id WHERE u.email = ? AND en.course_id = ?", e.email, course.id).length, "accès ouvert");
  run("DELETE FROM offers");
});

test("offre + code promo : le code s'applique sur le prix de l'offre, remise et offre sont enregistrées", async () => {
  addOffer(course.id, 4000, { name: "Combo" });
  await prof.post(`${G}/ventes/coupons`, { code: "DIX", kind: "percent", value: "10", active: "on" });
  const e = await fresh(course.id);
  await e.post("/commande/code-promo", { code: "DIX" });
  const page = (await e.get("/commande")).text;
  assert.equal(hidden(page), "3600", "40 € − 10 % = 36 €");
  await e.post("/commande", { expected_total: "3600" });
  const o = orderOf(e.email);
  assert.deepEqual([o.total_cents, o.discount_cents, o.coupon_code], [3600, 400, "DIX"]);
  const [it] = items(o.id);
  assert.deepEqual([it.price_cents, it.list_price_cents, it.offer_name], [3600, 5000, "Combo"]);
  run("DELETE FROM offers");
});

test("offre terminée, à venir, désactivée ou plus chère : prix standard", async () => {
  addOffer(course.id, 1000, { ends: day(-1) });
  addOffer(course.id, 1000, { starts: day(3) });
  addOffer(course.id, 1000, { active: 0 });
  addOffer(course.id, 9000);
  const e = await fresh(course.id);
  assert.equal(hidden((await e.get("/commande")).text), "5000");
  await e.post("/commande", {});
  const [it] = items(orderOf(e.email).id);
  assert.deepEqual([it.price_cents, it.offer_id], [5000, null]);
  run("DELETE FROM offers");
});

test("le prix change entre l'affichage et le clic (fin d'offre) : refusé avec un message, rien n'est acheté", async () => {
  const offerId = addOffer(course.id, 2000);
  const e = await fresh(course.id);
  const shown = hidden((await e.get("/commande")).text);
  assert.equal(shown, "2000");
  run("UPDATE offers SET active = 0 WHERE id = ?", offerId); // l'offre s'arrête pendant que le client hésite
  const r = await e.post("/commande", { expected_total: shown });
  assert.equal(r.status, 302);
  assert.equal(r.location, "/commande");
  assert.equal(orderOf(e.email), undefined, "aucune commande");
  const again = await e.get("/commande");
  assert.match(again.text, /prix de votre commande a changé/);
  assert.equal(hidden(again.text), "5000", "le nouveau total est affiché");
  const ok = await e.post("/commande", { expected_total: "5000" });
  assert.equal(ok.status, 302);
  assert.equal(orderOf(e.email).total_cents, 5000);
  run("DELETE FROM offers");
});

test("offre à 0 € : commande gratuite directe, enregistrée avec l'offre", async () => {
  addOffer(course.id, 0, { name: "Gratuite" });
  const e = await fresh(course.id);
  const checkout = (await e.get("/commande")).text;
  assert.match(checkout, /Rien à payer : votre commande est gratuite/);
  await e.post("/commande", { expected_total: "0" });
  const o = orderOf(e.email);
  assert.equal(o.total_cents, 0);
  assert.equal(items(o.id)[0].offer_name, "Gratuite");
  run("DELETE FROM offers");
});

test("les anciennes commandes (sans offre) restent lisibles : colonnes d'offre vides", async () => {
  const old = sql("SELECT COUNT(*) n FROM order_items WHERE offer_id IS NULL AND offer_name IS NULL").at(0).n;
  assert.ok(old >= 1);
});
