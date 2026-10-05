// Offres dans la vitrine : catalogue, accueil, catégorie, fiche formation, favoris, données structurées.
// Le prix affiché est le prix qui sera payé ; le tri par prix suit la même règle.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse } = require("./helpers");

let srv, prof, X, Y;
const run = (query, ...args) => { const db = srv.db(); try { return db.prepare(query).run(...args); } finally { db.close(); } };
const addOffer = (courseId, price, { name = "Soldes", ends = null, starts = null, active = 1 } = {}) =>
  run("INSERT INTO offers (course_id, instructor_id, name, price_cents, starts_at, ends_at, active) VALUES (?, (SELECT instructor_id FROM courses WHERE id = ?), ?, ?, ?, ?, ?)", courseId, courseId, name, price, starts, ends, active);
const iso = (offset) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 19).replace("T", " ");
// Ordre d'apparition des formations dans une page
const order = (html, ...titles) => titles.map((t) => [t, html.indexOf(t)]).sort((a, b) => a[1] - b[1]).map(([t]) => t);
// HTML de la carte d'une formation : de son ouverture (class="course-card") à l'ouverture de la carte suivante
const card = (html, title) => {
  const block = html.split('class="course-card"').find((b) => b.includes(`${title}</h3>`));
  assert.ok(block, `carte « ${title} » introuvable`);
  return block;
};

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  X = await createCourse(prof, srv, { title: "Zeta Formation Chère", price: 50 }); // 50 € (10 € avec offre)
  Y = await createCourse(prof, srv, { title: "Alpha Formation Moyenne", price: 20 }); // 20 €
});
after(() => srv.stop());

test("sans offre : le tri par prix suit les prix standard, aucun prix barré", async () => {
  const anon = new Client(srv.base);
  const asc = (await anon.get("/catalogue?sort=price_asc")).text;
  assert.deepEqual(order(asc, "Zeta Formation Chère", "Alpha Formation Moyenne"), ["Alpha Formation Moyenne", "Zeta Formation Chère"]);
  assert.doesNotMatch(asc, /class="price-old"/);
});

test("offre en cours : prix barré partout (catalogue, accueil, catégorie) et tri par prix EFFECTIF", async () => {
  addOffer(X.id, 1000, { name: "Soldes d'automne", ends: iso(7) });
  const anon = new Client(srv.base);
  for (const url of ["/catalogue", "/", "/categorie/test"]) {
    const html = (await anon.get(url)).text;
    const c = card(html, "Zeta Formation Chère");
    assert.match(c, /10,00\s*€/, `${url} : prix de l'offre`);
    assert.match(c, /class="price-old"[^>]*>(?:<span class="sr-only">[^<]*<\/span>)?50,00\s*€/, `${url} : prix habituel barré`);
  }
  const asc = (await anon.get("/catalogue?sort=price_asc")).text;
  assert.deepEqual(order(asc, "Zeta Formation Chère", "Alpha Formation Moyenne"), ["Zeta Formation Chère", "Alpha Formation Moyenne"], "10 € (offre) avant 20 €");
  const desc = (await anon.get("/catalogue?sort=price_desc")).text;
  assert.deepEqual(order(desc, "Zeta Formation Chère", "Alpha Formation Moyenne"), ["Alpha Formation Moyenne", "Zeta Formation Chère"]);
  assert.doesNotMatch(card(asc, "Alpha Formation Moyenne"), /price-old/, "pas d'offre : pas de prix barré");
});

test("fiche formation : prix de l'offre, prix habituel barré, nom de l'offre et date de fin lisible", async () => {
  const html = (await new Client(srv.base).get(`/cours/${X.slug}`)).text;
  assert.match(html, /<div class="purchase-price[^"]*">\s*10,00\s*€/);
  assert.match(html, /class="price-old"/);
  assert.match(html, /Offre « Soldes d(?:'|&#39;)automne »/);
  assert.match(html, /jusqu(?:'|&#39;)au [^<]*20\d\d inclus/);
  assert.doesNotMatch(html, /Invalid Date/);
});

test("données structurées (SEO) : le prix déclaré est le prix payé", async () => {
  const html = (await new Client(srv.base).get(`/cours/${X.slug}`)).text;
  const prices = [...html.matchAll(/"price"\s*:\s*"?([\d.]+)"?/g)].map((m) => m[1]);
  assert.ok(prices.includes("10.00"), `prix déclaré : ${prices.join(", ")}`);
  assert.ok(!prices.includes("50.00"), "le prix habituel n'est pas déclaré comme prix de vente");
});

test("offre à 0 € : la fiche et la carte affichent « Gratuit »", async () => {
  addOffer(Y.id, 0, { name: "Gratuit un jour" });
  const html = (await new Client(srv.base).get("/catalogue")).text;
  assert.match(card(html, "Alpha Formation Moyenne"), /badge-success">Gratuit</);
  run("DELETE FROM offers WHERE course_id = ?", Y.id);
});

test("favoris de l'élève : prix effectif", async () => {
  const e = await newStudent(srv);
  await e.post(`/favoris/${X.id}`, {});
  const page = (await e.get("/mes-cours")).text;
  assert.match(page, /Zeta Formation Chère/, "la formation est bien dans les favoris affichés");
  assert.match(page, /10,00\s*€/);
});

test("offre terminée, à venir ou désactivée : prix standard, aucun prix barré", async () => {
  run("DELETE FROM offers");
  addOffer(X.id, 1000, { ends: iso(-1) });
  addOffer(X.id, 1000, { starts: iso(4) });
  addOffer(X.id, 1000, { active: 0 });
  const anon = new Client(srv.base);
  const html = (await anon.get("/catalogue")).text;
  assert.match(card(html, "Zeta Formation Chère"), /50,00\s*€/);
  assert.doesNotMatch(card(html, "Zeta Formation Chère"), /price-old/);
  assert.doesNotMatch((await anon.get(`/cours/${X.slug}`)).text, /Offre «/);
});

test("espace formateur : les dates des offres s'affichent correctement (pas « Invalid Date »)", async () => {
  run("DELETE FROM offers");
  addOffer(X.id, 1000, { name: "Datée", starts: iso(-1), ends: iso(9) });
  const html = (await prof.get(`/formateur/cours/${X.id}/offres`)).text;
  assert.match(html, /Du [^<]*20\d\d jusqu(?:'|&#39;)au [^<]*20\d\d inclus/);
  assert.doesNotMatch(html, /Invalid Date/);
});
