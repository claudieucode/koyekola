// Centre de gestion : un SECOND formateur ne peut ni lire ni modifier les données du premier (ventes, élèves, codes promo, tickets de support, notifications),
// même en connaissant les identifiants. Les contrôles sont ceux du serveur (requêtes directes, pas l'interface).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

let srv, a, b, courseA, eleve, couponId, ticketId, orderId;
const G = "/formateur/gestion";
const q = (sql, ...x) => { const d = srv.db(); try { return d.prepare(sql).all(...x); } finally { d.close(); } };
const run = (sql, ...x) => { const d = srv.db(); try { return d.prepare(sql).run(...x); } finally { d.close(); } };

before(async () => {
  srv = await startServer();
  a = await loginInstructor(srv);
  courseA = await createCourse(a, srv, { title: "Cours du formateur A", price: 30 });
  eleve = await newStudent(srv);
  await buy(eleve, courseA);
  await a.post(`${G}/ventes/coupons`, { code: "A-SEUL", kind: "percent", value: "10", active: "on" });
  couponId = q("SELECT id FROM coupons WHERE code = 'A-SEUL'")[0].id;
  orderId = q("SELECT id FROM orders ORDER BY id LIMIT 1")[0].id;
  await eleve.post("/support", { course_id: String(courseA.id), subject: "Question", message: "Bonjour, j'ai une question." }).catch(() => {});
  const t = q("SELECT id FROM support_tickets LIMIT 1")[0];
  if (!t) run("INSERT INTO support_tickets (user_id, instructor_id, course_id, subject, status, priority) VALUES (?, ?, ?, 'Question privée', 'open', 'normal')", q("SELECT id FROM users WHERE email = ?", eleve.email)[0].id, courseA.instructor_id, courseA.id);
  ticketId = q("SELECT id FROM support_tickets LIMIT 1")[0].id;
  // second formateur
  const st = await newStudent(srv);
  run("UPDATE users SET role = 'formateur' WHERE email = ?", st.email);
  b = await new Client(srv.base).login(st.email, "MotDePasseEleve123");
  await createCourse(b, srv, { title: "Cours du formateur B", price: 5 });
});
after(async () => { if (srv) await srv.stop(); });

test("ventes, élèves, support : le formateur B ne voit rien du formateur A", async () => {
  for (const [u, secret] of [[`${G}/ventes`, eleve.email], [`${G}/ventes/transactions`, "Cours du formateur A"], [`${G}/ventes/coupons`, "A-SEUL"], [`${G}/eleves`, eleve.email], [`${G}/support`, "Question"]]) {
    const r = await b.get(u);
    assert.equal(r.status, 200, u);
    assert.doesNotMatch(r.text, new RegExp(secret.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${u} laisse voir « ${secret} »`);
  }
});

test("accès direct par identifiant : commande, élève, ticket d'un autre formateur → introuvable", async () => {
  const sid = q("SELECT id FROM users WHERE email = ?", eleve.email)[0].id;
  assert.equal((await b.get(`${G}/ventes/commandes/${orderId}`)).status, 404);
  assert.equal((await b.get(`${G}/eleves/${sid}`)).status, 404);
  assert.equal((await b.get(`${G}/support/${ticketId}`)).status, 404);
});

test("modifications directes refusées : coupon, ticket, priorité ; rien ne change en base", async () => {
  const before = JSON.stringify(q("SELECT * FROM coupons"));
  for (const act of ["desactiver", "supprimer"]) await b.post(`${G}/ventes/coupons/${couponId}/${act}`, {});
  await b.post(`${G}/ventes/coupons/${couponId}`, { code: "PIRATE", kind: "percent", value: "99", active: "on" });
  assert.equal(JSON.stringify(q("SELECT * FROM coupons")), before, "le coupon d'un autre formateur est intact");
  await b.post(`${G}/support/${ticketId}/repondre`, { message: "Je réponds à la place de A" });
  await b.post(`${G}/support/${ticketId}/fermer`, {}); await b.post(`${G}/support/${ticketId}/priorite`, { priority: "high" });
  const t = q("SELECT status, priority FROM support_tickets WHERE id = ?", ticketId)[0];
  assert.equal(t.status, "open"); assert.equal(t.priority, "normal");
  assert.equal(q("SELECT COUNT(*) n FROM support_messages WHERE body LIKE '%à la place de A%'")[0].n, 0);
});

test("notifications : l'état « lu » est propre à chaque formateur", async () => {
  await b.post(`${G}/activite/tout-lu`, {});
  const a1 = await a.get(`${G}/activite?vue=notifications`);
  assert.match(a1.text, /Nouvelle commande/, "A voit toujours ses notifications non lues");
  assert.doesNotMatch((await b.get(`${G}/activite`)).text, /Cours du formateur A/);
});

test("analytics et vue d'ensemble de B : aucun chiffre de A", async () => {
  const home = await b.get(G);
  assert.match(home.text, /0 commande\(s\)/);
  assert.doesNotMatch(home.text, /30,00 €/);
});
