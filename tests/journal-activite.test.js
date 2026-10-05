// Journal d'activité : les actions sensibles sont tracées (qui, quoi, avant → après, résultat), consultables, en écriture seule.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

const G = "/formateur/gestion";
let srv, prof, course;
const sql = (query, ...args) => { const db = srv.db(); try { return db.prepare(query).all(...args); } finally { db.close(); } };
const entries = (action) => sql("SELECT * FROM audit_log WHERE action = ? ORDER BY id", action).map((r) => ({ ...r, details: JSON.parse(r.details) }));
const count = () => sql("SELECT COUNT(*) n FROM audit_log")[0].n;
const edit = (c, fields) => prof.post(`/formateur/cours/${c.id}/modifier`, { title: c.title, category: "Test", level: "debutant", price: "50", description: "desc", ...fields });

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  course = await createCourse(prof, srv, { title: "Formation Journal", price: 50 });
  course.title = "Formation Journal"; // createCourse ne renvoie pas le titre
});
after(() => srv.stop());

test("création et publication d'une formation sont tracées avec l'auteur", async () => {
  const [created] = entries("course.created");
  assert.equal(created.resource_id, String(course.id));
  assert.equal(created.actor_name, "Prof");
  assert.match(created.summary, /Formation « Formation Journal » créée \(prix 50\.00 €\)/);
  assert.equal(created.result, "ok");
  assert.ok(created.ip);
  assert.equal(entries("course.published").length, 1);
});

test("changement de prix : entrée dédiée avec l'ancien et le nouveau prix ; sans changement, rien n'est journalisé", async () => {
  const before = count();
  await edit(course, { price: "50" }); // rien ne change
  assert.equal(count(), before, "aucune entrée si rien ne change");
  await edit(course, { price: "39,90", title: "Formation Journal" });
  const [price] = entries("course.price_changed");
  assert.deepEqual([price.details.avant_cents, price.details.apres_cents], [5000, 3990]);
  assert.match(price.summary, /50\.00 € → 39\.90 €/);
  await edit(course, { price: "39,90", title: "Formation Journal v2" });
  const upd = entries("course.updated").at(-1);
  assert.deepEqual(upd.details.title, { avant: "Formation Journal", apres: "Formation Journal v2" });
  assert.equal(entries("course.price_changed").length, 1, "le prix n'a pas changé la 2e fois");
  course.title = "Formation Journal v2";
});

test("dépublication, archivage, restauration, duplication", async () => {
  await prof.post(`/formateur/cours/${course.id}/publier`, {}); // la formation est publiée → dépubliée
  assert.equal(entries("course.unpublished").length, 1);
  await prof.post(`/formateur/cours/${course.id}/publier`, {});
  assert.equal(entries("course.published").length, 2);
  await prof.post(`/formateur/cours/${course.id}/archiver`, {});
  await prof.post(`/formateur/cours/${course.id}/restaurer`, {});
  await prof.post(`/formateur/cours/${course.id}/dupliquer`, {});
  for (const a of ["course.archived", "course.restored", "course.duplicated"]) assert.equal(entries(a).length, 1, a);
  await prof.post(`/formateur/cours/${course.id}/publier`, {});
});

test("offres : création, modification, activation, suppression", async () => {
  await prof.post(`/formateur/cours/${course.id}/offres`, { name: "Soldes", price: "20", active: "on" });
  const [c] = entries("offer.created");
  assert.match(c.summary, /Offre « Soldes » créée/);
  assert.equal(c.details.price_cents, 2000);
  const offerId = Number(c.resource_id);
  await prof.post(`/formateur/cours/${course.id}/offres/${offerId}`, { name: "Soldes", price: "25", active: "on" });
  const [u] = entries("offer.updated");
  assert.deepEqual([u.details.avant.price_cents, u.details.price_cents], [2000, 2500]);
  await prof.post(`/formateur/cours/${course.id}/offres/${offerId}/desactiver`, {});
  await prof.post(`/formateur/cours/${course.id}/offres/${offerId}/activer`, {});
  await prof.post(`/formateur/cours/${course.id}/offres/${offerId}/supprimer`, {});
  for (const a of ["offer.deactivated", "offer.activated", "offer.deleted"]) assert.equal(entries(a).length, 1, a);
  const refused = count();
  await prof.post(`/formateur/cours/${course.id}/offres`, { name: "", price: "999" }); // refusée : rien n'est écrit
  assert.equal(count(), refused, "une offre refusée par la validation n'est pas journalisée comme créée");
});

test("codes promo : création, désactivation, suppression", async () => {
  await prof.post(`${G}/ventes/coupons`, { code: "JOURNAL10", kind: "percent", value: "10", active: "on" });
  assert.match(entries("coupon.created")[0].summary, /JOURNAL10 créé \(10 %\)/);
  const id = sql("SELECT id FROM coupons WHERE code = 'JOURNAL10'")[0].id;
  await prof.post(`${G}/ventes/coupons/${id}/desactiver`, {});
  await prof.post(`${G}/ventes/coupons/${id}/supprimer`, {});
  assert.equal(entries("coupon.deactivated").length, 1);
  assert.equal(entries("coupon.deleted").length, 1);
});

test("suppression d'une formation déjà achetée : REFUSÉE et journalisée comme telle", async () => {
  const sold = await createCourse(prof, srv, { title: "Formation Vendue Journal", price: 10 });
  const e = await newStudent(srv);
  await buy(e, sold);
  const r = await prof.post(`/formateur/cours/${sold.id}/supprimer`, {});
  assert.equal(r.status, 409);
  const [x] = entries("course.deleted");
  assert.equal(x.result, "refused");
  const free = await createCourse(prof, srv, { title: "Formation Sans Vente", price: 10 });
  await prof.post(`/formateur/cours/${free.id}/supprimer`, {});
  assert.equal(entries("course.deleted").filter((y) => y.result === "ok").length, 1);
});

test("réglages d'un quiz et révocation d'un certificat sont tracés", async () => {
  const c = await createCourse(prof, srv, { title: "Formation Quiz Journal", price: 0, lessons: [{ title: "L1" }] });
  await prof.post(`/formateur/lecons/${c.lessons[0].id}/quiz`, {});
  const quizId = sql("SELECT id FROM quizzes WHERE lesson_id = ?", c.lessons[0].id)[0].id;
  await prof.post(`/formateur/quiz/${quizId}/parametres`, { title: "Quiz", pass_percentage: "80", max_attempts: "3" });
  const [q] = entries("quiz.updated");
  assert.deepEqual([q.details.avant.pass_percentage, q.details.apres.pass_percentage, q.details.apres.max_attempts], [70, 80, 3]);
  const before = entries("quiz.updated").length;
  await prof.post(`/formateur/quiz/${quizId}/parametres`, { title: "Quiz", pass_percentage: "80", max_attempts: "3" });
  assert.equal(entries("quiz.updated").length, before, "mêmes réglages : pas de nouvelle entrée");

  const e = await newStudent(srv);
  await buy(e, c);
  await e.post(`/apprendre/lecon/${c.lessons[0].id}/terminer`, {});
  const cert = sql("SELECT * FROM certificates ORDER BY id DESC LIMIT 1")[0];
  await prof.post(`${G}/certificats/${cert.id}/revoquer`, { reason: "Triche constatée" });
  const [r] = entries("certificate.revoked");
  assert.equal(r.details.reason, "Triche constatée");
  await prof.post(`${G}/certificats/${cert.id}/retablir`, {});
  assert.equal(entries("certificate.restored").length, 1);
});

test("page Journal : entrées récentes en premier, filtre par type et recherche, pagination, réservée au formateur", async () => {
  const page = (await prof.get(`${G}/journal`)).text;
  assert.match(page, /Journal d(?:'|&#39;)activité/);
  assert.match(page, /Formation « Formation Journal v2 » modifiée/);
  assert.match(page, /lecture seule/);
  const offers = (await prof.get(`${G}/journal?type=offer`)).text;
  assert.match(offers, /Offre « Soldes »/);
  assert.doesNotMatch(offers, /course\.price_changed/);
  const found = (await prof.get(`${G}/journal?q=JOURNAL10`)).text;
  assert.match(found, /JOURNAL10/);
  assert.match((await prof.get(`${G}/journal?q=${encodeURIComponent("%_zzz")}`)).text, /Aucune entrée ne correspond/);
  // pagination : 50 par page
  const db = srv.db();
  const ins = db.prepare("INSERT INTO audit_log (actor_name, action, resource_type, summary) VALUES ('Prof', 'course.updated', 'course', ?)");
  for (let i = 0; i < 120; i++) ins.run(`Entrée de remplissage ${i}`);
  db.close();
  const p1 = (await prof.get(`${G}/journal`)).text;
  const p3 = (await prof.get(`${G}/journal?page=3`)).text;
  assert.match(p1, /Page 1 sur/);
  assert.match(p1, /Entrée de remplissage 119/);
  assert.match(p3, /Page 3 sur/);
  assert.doesNotMatch(p3, /Entrée de remplissage 119/);
  const e = await newStudent(srv);
  assert.notEqual((await e.get(`${G}/journal`)).status, 200);
  assert.equal((await new Client(srv.base).get(`${G}/journal`)).status, 302);
});

test("écriture seule : la base refuse de modifier ou d'effacer une entrée", () => {
  const db = srv.db();
  try {
    assert.throws(() => db.prepare("UPDATE audit_log SET summary = 'falsifié' WHERE id = 1").run(), /écriture seule/);
    assert.throws(() => db.prepare("DELETE FROM audit_log WHERE id = 1").run(), /écriture seule/);
    assert.throws(() => db.exec("DELETE FROM audit_log"), /écriture seule/);
  } finally { db.close(); }
  assert.ok(sql("SELECT COUNT(*) n FROM audit_log")[0].n > 0);
});
