// Centre de gestion : la commande indique l'offre appliquée, les analytics détaillent les ventes par offre.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent, createCourse } = require("./helpers");

const G = "/formateur/gestion";
let srv, prof, course;
const run = (query, ...args) => { const db = srv.db(); try { return db.prepare(query).run(...args); } finally { db.close(); } };
const sql = (query, ...args) => { const db = srv.db(); try { return db.prepare(query).all(...args); } finally { db.close(); } };
const buy = async (price) => {
  const e = await newStudent(srv);
  await e.post(`/panier/ajouter/${course.id}`, {});
  await e.post("/commande", {});
  return sql("SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = ? ORDER BY o.id DESC", e.email)[0].id;
};
// Texte d'une ligne du tableau « Ventes par offre » : « nom | ventes | revenus »
const rowOf = (html, label) => {
  const m = html.match(new RegExp(`<td data-label="Offre">${label}</td><td data-label="Ventes" class="g-num">(\\d+)</td><td data-label="Revenus" class="g-num">([^<]+)</td>`));
  return m ? { sales: Number(m[1]), revenue: m[2].replace(/\s/g, " ").trim() } : null;
};

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  course = await createCourse(prof, srv, { title: "Formation Gestion Offres", price: 50 });
});
after(() => srv.stop());

test("aucune vente avec offre : pas de panneau « Ventes par offre » (rien d'inventé)", async () => {
  await buy();
  const html = (await prof.get(`${G}/analytics?periode=30j`)).text;
  assert.equal(html.includes("Ventes par offre"), false);
});

test("ventes avec et sans offre : le détail de la commande nomme l'offre, les analytics comptent par offre", async () => {
  run("INSERT INTO offers (course_id, instructor_id, name, price_cents) VALUES (?, (SELECT instructor_id FROM courses WHERE id = ?), 'Soldes', 3000)", course.id, course.id);
  const o1 = await buy();
  const o2 = await buy();
  run("DELETE FROM offers"); // l'offre est supprimée : les commandes gardent son nom
  const o3 = await buy(); // au prix standard

  const order = (await prof.get(`${G}/ventes/commandes/${o1}`)).text;
  assert.match(order, /Offre « Soldes »/);
  assert.match(order, /30,00\s*€/);
  assert.equal(/Offre «/.test((await prof.get(`${G}/ventes/commandes/${o3}`)).text), false, "commande au prix standard : pas d'offre");
  void o2;

  const html = (await prof.get(`${G}/analytics?periode=30j`)).text;
  assert.match(html, /Ventes par offre/);
  assert.deepEqual(rowOf(html, "Soldes"), { sales: 2, revenue: "60,00 €" });
  // 2 ventes standards au total : la première (avant l'offre) et la dernière (après sa suppression)
  assert.deepEqual(rowOf(html, "Prix standard \\(sans offre\\)"), { sales: 2, revenue: "100,00 €" });
});

test("accès : les analytics et la commande restent réservés au formateur", async () => {
  const e = await newStudent(srv);
  assert.notEqual((await e.get(`${G}/analytics`)).status, 200);
});

test("sans Stripe : les onglets Transactions et Remboursements disent honnêtement que le paiement est simulé", async () => {
  const tx = (await prof.get(`${G}/ventes/transactions`)).text;
  assert.match(tx, /Aucun prestataire de paiement connecté/);
  assert.match(tx, /simulé/);
  assert.match((await prof.get(`${G}/ventes/remboursements`)).text, /Remboursements indisponibles/);
});
