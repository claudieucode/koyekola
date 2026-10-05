// Support (tickets) et centre de notifications : parcours élève ↔ formateur, appartenance des données, notifications des modules.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

const G = "/formateur/gestion";
let srv, prof, course;
const sql = (query, ...args) => { const db = srv.db(); try { return db.prepare(query).all(...args); } finally { db.close(); } };
const run = (query, ...args) => { const db = srv.db(); try { return db.prepare(query).run(...args); } finally { db.close(); } };
const userId = (email) => sql("SELECT id FROM users WHERE email = ?", email)[0].id;
const ticketOf = (email) => sql("SELECT t.* FROM support_tickets t JOIN users u ON u.id = t.user_id WHERE u.email = ? ORDER BY t.id DESC", email)[0];
const open = async (e, subject = "Je n'arrive pas à lire la vidéo", message = "La vidéo de la leçon 1 reste noire sur mon téléphone.", extra = {}) => {
  const r = await e.post("/support", { subject, message, ...extra });
  return { r, id: r.status === 302 ? Number(r.location.match(/\/support\/(\d+)/)[1]) : null };
};
const bell = (html) => Number((html.match(/aria-label="Notifications \((\d+) non lue/) || [])[1] || 0);

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  course = await createCourse(prof, srv, { title: "Formation Support", price: 10, lessons: [{ title: "Leçon unique" }] });
});
after(() => srv.stop());

test("l'élève crée une demande : enregistrée, visible dans sa liste et chez le formateur ; l'élève n'est pas prévenu de SA propre demande", async () => {
  const e = await newStudent(srv);
  await buy(e, course);
  const { r, id } = await open(e, "Question sur le paiement", "Mon paiement a été débité deux fois, pouvez-vous vérifier ?", { course_id: String(course.id) });
  assert.equal(r.status, 302);
  const t = ticketOf(e.email);
  assert.deepEqual([t.id, t.status, t.priority, t.course_id, t.instructor_id], [id, "open", "normal", course.id, userId("prof@test.local")]);
  assert.equal(sql("SELECT COUNT(*) n FROM support_messages WHERE ticket_id = ?", id)[0].n, 1);
  assert.match((await e.get("/support")).text, /Question sur le paiement/);
  assert.match((await e.get(`/support/${id}`)).text, /débité deux fois/);
  const staff = (await prof.get(`${G}/support`)).text;
  assert.match(staff, /Question sur le paiement/);
  assert.match(staff, /En attente de réponse/);
});

test("validation : sujet ou message trop courts, formation non possédée → refusés, rien d'enregistré", async () => {
  const e = await newStudent(srv);
  for (const [subject, message, extra, expected] of [
    ["ab", "Un message assez long pour passer.", {}, /Le sujet doit faire/],
    ["Sujet correct", "court", {}, /Décrivez votre demande/],
    ["Sujet correct", "x".repeat(5001), {}, /Décrivez votre demande/],
    ["Sujet correct", "Un message assez long pour passer.", { course_id: String(course.id) }, /Choisissez une de vos formations/], // non possédée
  ]) {
    const { r } = await open(e, subject, message, extra);
    assert.equal(r.status, 400);
    assert.match(r.text, expected);
  }
  assert.equal(ticketOf(e.email), undefined);
  const keep = await e.post("/support", { subject: "ab", message: "Un message assez long pour passer." });
  assert.match(keep.text, /Un message assez long pour passer\./, "le texte saisi est conservé");
});

test("anti-abus : au plus 5 demandes par heure et par élève", async () => {
  const e = await newStudent(srv);
  for (let i = 0; i < 5; i++) assert.equal((await open(e, `Demande numéro ${i}`)).r.status, 302);
  const sixth = await open(e, "Demande de trop");
  assert.equal(sixth.r.status, 400);
  assert.match(sixth.r.text, /beaucoup de demandes/);
});

test("réponse du formateur : statut « répondu », l'élève reçoit une notification (cloche), l'ouvrir la marque lue et mène au ticket", async () => {
  const e = await newStudent(srv);
  const { id } = await open(e, "Besoin d'aide", "Je ne trouve pas mon certificat dans mon compte.");
  assert.equal(bell(await (await e.get("/mes-cours")).text), 0);
  const r = await prof.post(`${G}/support/${id}/repondre`, { message: "Il apparaît dans « Mes certificats » une fois la formation terminée." });
  assert.equal(r.status, 302);
  assert.equal(ticketOf(e.email).status, "answered");
  assert.equal(bell((await e.get("/mes-cours")).text), 1, "cloche : 1 non lue");
  const page = (await e.get("/notifications")).text;
  assert.match(page, /Réponse à votre demande : Besoin d(?:'|&#39;)aide/);
  const n = sql("SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC", userId(e.email))[0];
  assert.equal(n.url, `/support/${id}`);
  const opened = await e.post(`/notifications/${n.id}/lue`, {});
  assert.equal(opened.location, `/support/${id}`);
  assert.equal(bell((await e.get("/mes-cours")).text), 0);
  assert.match((await e.get(`/support/${id}`)).text, /apparaît dans « Mes certificats »/);
});

test("cycle de vie : réponse de l'élève rouvre, clôture, réouverture ; un message d'un ticket clos le rouvre", async () => {
  const e = await newStudent(srv);
  const { id } = await open(e);
  await prof.post(`${G}/support/${id}/repondre`, { message: "Pouvez-vous essayer un autre navigateur ?" });
  assert.equal(ticketOf(e.email).status, "answered");
  await e.post(`/support/${id}/repondre`, { message: "Je viens d'essayer, cela ne change rien." });
  assert.equal(ticketOf(e.email).status, "open", "l'élève répond : en attente du formateur");
  await e.post(`/support/${id}/fermer`, {});
  assert.equal(ticketOf(e.email).status, "closed");
  assert.notEqual(ticketOf(e.email).closed_at, null);
  await e.post(`/support/${id}/rouvrir`, {});
  assert.equal(ticketOf(e.email).status, "open");
  await prof.post(`${G}/support/${id}/fermer`, {});
  assert.equal(ticketOf(e.email).status, "closed");
  await prof.post(`${G}/support/${id}/rouvrir`, {});
  await prof.post(`${G}/support/${id}/priorite`, { priority: "high" });
  assert.equal(ticketOf(e.email).priority, "high");
  await prof.post(`${G}/support/${id}/priorite`, { priority: "urgentissime" });
  assert.equal(ticketOf(e.email).priority, "high", "priorité inconnue refusée");
  assert.equal(sql("SELECT COUNT(*) n FROM support_messages WHERE ticket_id = ?", id)[0].n, 3);
});

test("double clic : le même message envoyé deux fois d'affilée n'est enregistré qu'une fois", async () => {
  const e = await newStudent(srv);
  const { id } = await open(e);
  await e.post(`/support/${id}/repondre`, { message: "Merci de votre aide." });
  await e.post(`/support/${id}/repondre`, { message: "Merci de votre aide." });
  assert.equal(sql("SELECT COUNT(*) n FROM support_messages WHERE ticket_id = ?", id)[0].n, 2);
  await e.post(`/support/${id}/repondre`, { message: "   " });
  assert.equal(sql("SELECT COUNT(*) n FROM support_messages WHERE ticket_id = ?", id)[0].n, 2, "message vide refusé");
});

test("appartenance : un autre élève ne voit, n'écrit ni ne clôt le ticket de quelqu'un d'autre", async () => {
  const a = await newStudent(srv), b = await newStudent(srv);
  const { id } = await open(a, "Ticket privé", "Informations personnelles de l'élève A : voir mon compte.");
  assert.equal((await b.get(`/support/${id}`)).status, 404);
  for (const [path, form] of [["repondre", { message: "Intrusion" }], ["fermer", {}], ["rouvrir", {}]]) assert.equal((await b.post(`/support/${id}/${path}`, form)).status, 404, path);
  assert.doesNotMatch((await b.get("/support")).text, /Ticket privé/);
  assert.equal(sql("SELECT COUNT(*) n FROM support_messages WHERE ticket_id = ?", id)[0].n, 1);
  assert.equal(ticketOf(a.email).status, "open");
  assert.equal((await new Client(srv.base).get(`/support/${id}`)).status, 302, "visiteur : connexion");
});

test("côté formateur : réservé au formateur destinataire ; un élève n'y accède pas ; le ticket d'un autre formateur est introuvable", async () => {
  const e = await newStudent(srv);
  const { id } = await open(e);
  assert.notEqual((await e.get(`${G}/support`)).status, 200);
  assert.notEqual((await e.get(`${G}/support/${id}`)).status, 200);
  assert.notEqual((await e.post(`${G}/support/${id}/repondre`, { message: "Je me fais passer pour le formateur" })).status, 200);
  assert.equal(sql("SELECT COUNT(*) n FROM support_messages WHERE ticket_id = ? AND is_staff = 1", id)[0].n, 0);
  run("UPDATE support_tickets SET instructor_id = 987654 WHERE id = ?", id); // adressé à un autre formateur
  assert.equal((await prof.get(`${G}/support/${id}`)).status, 404);
  assert.equal((await prof.post(`${G}/support/${id}/repondre`, { message: "Pas pour moi" })).status, 404);
  assert.doesNotMatch((await prof.get(`${G}/support`)).text, new RegExp(`/support/${id}"`));
});

test("filtres du formateur : statut et recherche ; les demandes en attente passent avant", async () => {
  const e = await newStudent(srv);
  const old = await open(e, "Ancienne question zzkw", "Un message assez long pour être accepté.");
  const fresh = await open(e, "Nouvelle question zzkw", "Un autre message assez long pour être accepté.");
  await prof.post(`${G}/support/${old.id}/repondre`, { message: "Réponse." });
  const all = (await prof.get(`${G}/support?q=zzkw`)).text;
  assert.ok(all.indexOf("Nouvelle question zzkw") < all.indexOf("Ancienne question zzkw"), "en attente avant répondu");
  const onlyOpen = (await prof.get(`${G}/support?q=zzkw&statut=open`)).text;
  assert.match(onlyOpen, /Nouvelle question zzkw/);
  assert.doesNotMatch(onlyOpen, /Ancienne question zzkw/);
  assert.match((await prof.get(`${G}/support?q=${encodeURIComponent("%_")}`)).text, /Aucune demande ne correspond/, "caractères spéciaux de recherche neutralisés");
  void fresh;
});

test("sécurité : le contenu saisi est affiché échappé (pas de script injecté) ; liens de notification externes refusés", async () => {
  const e = await newStudent(srv);
  const { id } = await open(e, "<script>alert('x')</script> sujet", "<img src=x onerror=alert(1)> message assez long");
  for (const html of [(await e.get(`/support/${id}`)).text, (await e.get("/support")).text, (await prof.get(`${G}/support/${id}`)).text]) {
    assert.doesNotMatch(html, /<script>alert\('x'\)<\/script>/);
    assert.doesNotMatch(html, /<img src=x onerror/);
  }
  const { notify } = require("../src/services/notifications");
  void notify; // la vérification d'URL est testée sur la base du serveur : une URL externe stockée n'est jamais suivie
  const uid = userId(e.email);
  const evil = Number(run("INSERT INTO notifications (user_id, kind, title, url) VALUES (?, 'test', 'Piégée', 'https://evil.example/phish')", uid).lastInsertRowid);
  const r = await e.post(`/notifications/${evil}/lue`, {});
  assert.equal(r.status, 302);
  assert.equal(r.location, "/notifications", "pas de redirection vers un site externe");
  const proto = Number(run("INSERT INTO notifications (user_id, kind, title, url) VALUES (?, 'test', 'Piégée 2', '//evil.example')", uid).lastInsertRowid);
  assert.equal((await e.post(`/notifications/${proto}/lue`, {})).location, "/notifications");
});

test("notifications : propres à chaque compte (impossible de lire ou marquer celles d'un autre)", async () => {
  const a = await newStudent(srv), b = await newStudent(srv);
  const n = Number(run("INSERT INTO notifications (user_id, kind, title) VALUES (?, 'test', 'Secret de A')", userId(a.email)).lastInsertRowid);
  assert.doesNotMatch((await b.get("/notifications")).text, /Secret de A/);
  assert.equal((await b.post(`/notifications/${n}/lue`, {})).status, 404);
  await b.post("/notifications/tout-lire", {});
  assert.equal(sql("SELECT read_at FROM notifications WHERE id = ?", n)[0].read_at, null, "« tout lire » de B ne touche pas A");
  await a.post("/notifications/tout-lire", {});
  assert.notEqual(sql("SELECT read_at FROM notifications WHERE id = ?", n)[0].read_at, null);
  assert.equal((await new Client(srv.base).get("/notifications")).status, 302);
});

test("les autres modules notifient l'élève : commande confirmée, certificat prêt", async () => {
  const e = await newStudent(srv);
  await buy(e, course);
  assert.match((await e.get("/notifications")).text, /Commande n° \d+ confirmée/);
  await e.post(`/apprendre/lecon/${course.lessons[0].id}/terminer`, {}); // seule leçon : parcours terminé
  const page = (await e.get("/notifications")).text;
  assert.match(page, /Votre certificat est prêt : Formation Support/);
  assert.equal(sql("SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND kind = 'certificate'", userId(e.email))[0].n, 1);
  await e.post(`/apprendre/lecon/${course.lessons[0].id}/terminer`, {});
  assert.equal(sql("SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND kind = 'certificate'", userId(e.email))[0].n, 1, "pas de notification en double");
});

test("le formateur ne voit pas la cloche des élèves ; la navigation du Centre de gestion propose Support", async () => {
  const page = (await prof.get(`${G}/support`)).text;
  assert.match(page, /href="\/formateur\/gestion\/support"/);
  assert.doesNotMatch((await prof.get("/")).text, /href="\/notifications"/);
});
