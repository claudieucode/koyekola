// RGPD (audit L1 / D4) : « Mon compte » — export des données et suppression du compte.
// La suppression anonymise le compte : ventes conservées (sans nom ni e-mail), contenus personnels et contact marketing effacés.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy, INSTRUCTOR } = require("./helpers");

describe("Mon compte : données personnelles", () => {
  let srv, prof, course;
  before(async () => {
    srv = await startServer();
    prof = await loginInstructor(srv);
    course = await createCourse(prof, srv, { title: "Formation RGPD", price: 15 });
  });
  after(() => srv.stop());

  test("page « Mon compte » : informations, liens, réservée aux personnes connectées ; lien dans l'en-tête", async () => {
    const s = await newStudent(srv);
    const page = (await s.get("/mon-compte")).text;
    assert.match(page, /<h1>Mon compte<\/h1>/);
    assert.match(page, new RegExp(s.email.replace(".", "\\.")));
    assert.match(page, /href="\/mon-compte\/mes-donnees\.json"/);
    assert.match(page, /Supprimer définitivement mon compte/);
    assert.match(page, /<meta name="robots" content="noindex, nofollow">/);
    assert.match((await s.get("/catalogue")).text, /class="user-chip" href="\/mon-compte"/);
    const anon = await new Client(srv.base).get("/mon-compte");
    assert.equal(anon.status, 302);
  });

  test("export : un fichier JSON avec le compte, les commandes, les formations… et jamais le mot de passe", async () => {
    const s = await newStudent(srv);
    await buy(s, course);
    const r = await s.get("/mon-compte/mes-donnees.json");
    assert.equal(r.status, 200);
    assert.match(r.headers.get("content-disposition"), /attachment; filename="mes-donnees-kolakisa-/);
    const data = JSON.parse(r.text);
    assert.equal(data.compte.email, s.email);
    assert.equal(data.compte.password_hash, undefined);
    assert.doesNotMatch(r.text, /\$2[aby]\$/, "aucun hachage bcrypt");
    assert.deepEqual(data.formations_suivies.map((f) => f.formation), ["Formation RGPD"]);
    assert.equal(data.commandes.length, 1);
    assert.equal(data.commandes[0].lignes[0].formation, "Formation RGPD");
    assert.equal(data.marketing.contact.email, s.email);
  });

  test("suppression : mot de passe et case obligatoires ; un mauvais mot de passe ne supprime rien", async () => {
    const s = await newStudent(srv);
    let r = await s.post("/mon-compte/supprimer", { password: "MotDePasseEleve123" });
    assert.equal(r.status, 400);
    assert.match(r.text, /Cochez la case/);
    r = await s.post("/mon-compte/supprimer", { password: "faux", confirm: "on" });
    assert.equal(r.status, 400);
    assert.match(r.text, /Mot de passe incorrect/);
    assert.equal((await s.get("/mes-cours")).status, 200, "toujours connecté");
  });

  test("suppression : compte anonymisé, ventes gardées, contenus et contact marketing effacés, toutes les sessions fermées", async () => {
    const s = await newStudent(srv);
    const other = new Client(srv.base);
    await other.login(s.email, "MotDePasseEleve123");
    await buy(s, course);
    const db = srv.db();
    const { id } = db.prepare("SELECT id FROM users WHERE email = ?").get(s.email);
    db.prepare("INSERT INTO favorites (user_id, course_id) VALUES (?, ?)").run(id, course.id);
    db.prepare("INSERT INTO reviews (course_id, user_id, rating, comment) VALUES (?, ?, 5, 'Très bien')").run(course.id, id);
    assert.ok(db.prepare("SELECT 1 FROM mk_contacts WHERE lms_user_id = ?").get(id), "contact marketing présent avant");

    const r = await s.post("/mon-compte/supprimer", { password: "MotDePasseEleve123", confirm: "on" });
    assert.equal(r.status, 200);
    assert.match(r.text, /Votre compte a été supprimé/);
    assert.doesNotMatch(r.text, /class="user-chip"/, "page affichée déconnecté");

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    assert.equal(user.username, `compte-supprime-${id}`);
    assert.equal(user.email, `supprime-${id}@compte-supprime.invalid`);
    assert.ok(user.deleted_at);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM orders WHERE user_id = ?").get(id).n, 1, "vente conservée");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM favorites WHERE user_id = ?").get(id).n, 0);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM reviews WHERE user_id = ?").get(id).n, 0);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE lms_user_id = ? OR email = ?").get(id, s.email).n, 0, "contact marketing effacé");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM sessions WHERE data LIKE ?").get(`%"id":${id},%`).n, 0);
    db.close();

    for (const c of [s, other]) assert.equal((await c.get("/mes-cours")).status, 302, "sessions fermées");
    assert.equal((await new Client(srv.base).post("/connexion", { email: s.email, password: "MotDePasseEleve123" })).status, 400, "plus de connexion possible");
    // L'adresse est libérée : la personne peut recréer un compte
    const again = await new Client(srv.base).post("/inscription", { username: "revenu", email: s.email, password: "MotDePasseEleve123" });
    assert.equal(again.status, 302);
  });

  test("le compte supprimé n'est jamais recréé comme contact marketing (synchronisation des comptes)", () => {
    const db = srv.db();
    const deleted = db.prepare("SELECT id FROM users WHERE deleted_at IS NOT NULL").all();
    assert.ok(deleted.length);
    db.close();
    const { syncLmsUsers } = require("../src/marketing/bridge/lms");
    assert.match(syncLmsUsers.toString(), /deleted_at IS NULL/);
  });

  test("le compte du formateur ne peut pas être supprimé depuis cette page", async () => {
    const page = (await prof.get("/mon-compte")).text;
    assert.doesNotMatch(page, /Supprimer définitivement mon compte/);
    const r = await prof.post("/mon-compte/supprimer", { password: INSTRUCTOR.password, confirm: "on" });
    assert.equal(r.status, 403);
    assert.equal((await prof.get("/formateur")).status, 200);
  });
});
