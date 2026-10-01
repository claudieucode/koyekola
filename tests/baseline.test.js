// Ce qui fonctionne déjà : ces tests doivent rester verts pendant tout le développement (anti-régression).
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

let srv, prof, course, other;
const VIDEO = Buffer.alloc(4000, 1);

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  course = await createCourse(prof, srv, {
    title: "Formation payante",
    price: 30,
    lessons: [
      { title: "Payante", preview: false, video: VIDEO, resource: { name: "doc.pdf", type: "application/pdf", content: "PDF" } },
      { title: "Aperçu", preview: true, video: VIDEO },
    ],
  });
});
after(() => srv.stop());

describe("pages publiques", () => {
  for (const url of ["/", "/catalogue", "/connexion", "/inscription", "/sante"]) {
    test(`${url} répond 200`, async () => {
      assert.equal((await new Client(srv.base).get(url)).status, 200);
    });
  }
  test("une URL inconnue donne une vraie page 404", async () => {
    const r = await new Client(srv.base).get("/nimporte-quoi");
    assert.equal(r.status, 404);
  });
  test("la fiche d'une formation publiée est visible", async () => {
    const r = await new Client(srv.base).get(`/cours/${course.slug}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /Formation payante/);
  });
});

describe("routes du formateur protégées", () => {
  test("visiteur → redirigé vers la connexion", async () => {
    const r = await new Client(srv.base).get("/formateur");
    assert.equal(r.status, 302);
    assert.match(r.location, /\/connexion/);
  });
  test("étudiant → 403", async () => {
    const eleve = await newStudent(srv);
    assert.equal((await eleve.get("/formateur")).status, 403);
    assert.equal((await eleve.get(`/formateur/cours/${course.id}/curriculum`)).status, 403);
  });
});

describe("accès aux contenus payants", () => {
  let paid, preview, resource, eleve, inscrit;
  before(async () => {
    const db = srv.db();
    paid = db.prepare("SELECT video_path FROM lessons WHERE id = ?").get(course.lessons[0].id).video_path;
    resource = db.prepare("SELECT path FROM lesson_attachments WHERE lesson_id = ?").get(course.lessons[0].id).path;
    preview = db.prepare("SELECT video_path FROM lessons WHERE id = ?").get(course.lessons[1].id).video_path;
    db.close();
    eleve = await newStudent(srv);
    inscrit = await newStudent(srv);
    await buy(inscrit, course);
  });

  test("les fichiers ont bien été enregistrés", () => {
    assert.match(paid, /^\/uploads\/videos\//);
    assert.match(resource, /^\/uploads\/resources\//);
  });
  test("visiteur : vidéo payante 401, aperçu 200", async () => {
    const c = new Client(srv.base);
    assert.equal((await c.get(paid)).status, 401);
    assert.equal((await c.get(preview)).status, 200);
  });
  test("étudiant non inscrit : vidéo et ressource payantes 403", async () => {
    assert.equal((await eleve.get(paid)).status, 403);
    assert.equal((await eleve.get(resource)).status, 403);
  });
  test("étudiant non inscrit : leçon payante 403", async () => {
    assert.equal((await eleve.get(`/apprendre/${course.slug}/${course.lessons[0].id}`)).status, 403);
  });
  test("étudiant inscrit et formateur : accès, avec lecture partielle (Range)", async () => {
    assert.equal((await inscrit.get(paid)).status, 200);
    assert.equal((await prof.get(paid)).status, 200);
    assert.equal((await inscrit.get(paid, { headers: { Range: "bytes=0-99" } })).status, 206);
  });
  test("pas de traversée de dossier", async () => {
    assert.equal((await prof.get("/uploads/videos/..%2F..%2Fdata%2FKOYEKOLA.db")).status, 404);
  });
});

describe("achat", () => {
  test("une commande crée la ligne d'achat et l'inscription", async () => {
    const e = await newStudent(srv);
    const r = await buy(e, course);
    assert.equal(r.status, 302);
    assert.match(r.location, /\/commande\/confirmation\/\d+/);
    const db = srv.db();
    const enr = db.prepare("SELECT COUNT(*) c FROM enrollments WHERE course_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)").get(course.id, e.email);
    const line = db.prepare("SELECT price_cents FROM order_items WHERE course_id = ? ORDER BY id DESC").get(course.id);
    db.close();
    assert.equal(enr.c, 1);
    assert.equal(line.price_cents, 3000, "le prix est celui de la base, jamais celui du navigateur");
  });
  test("racheter une formation déjà possédée ne double pas l'inscription", async () => {
    const e = await newStudent(srv);
    await buy(e, course);
    await e.post(`/panier/ajouter/${course.id}`, {});
    const r = await e.post("/commande", {});
    assert.match(r.location, /\/panier|\/mes-cours|\/commande\/confirmation/);
    const db = srv.db();
    const n = db.prepare("SELECT COUNT(*) c FROM enrollments WHERE course_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)").get(course.id, e.email).c;
    db.close();
    assert.equal(n, 1);
  });
});

describe("quiz", () => {
  test("correction côté serveur, seuil, et progression", async () => {
    const lessonId = course.lessons[0].id;
    await prof.post(`/formateur/lecons/${lessonId}/quiz`, {});
    const db = srv.db();
    const quiz = db.prepare("SELECT id FROM quizzes WHERE lesson_id = ?").get(lessonId);
    await prof.post(`/formateur/quiz/${quiz.id}/questions`, { question: "2+2 ?", option_1: "3", option_2: "4", option_3: "5", option_4: "", correct: "2" });
    const q = db.prepare("SELECT id FROM quiz_questions WHERE quiz_id = ?").get(quiz.id);
    const good = db.prepare("SELECT id FROM quiz_options WHERE question_id = ? AND is_correct = 1").get(q.id).id;
    const bad = db.prepare("SELECT id FROM quiz_options WHERE question_id = ? AND is_correct = 0").get(q.id).id;

    const e = await newStudent(srv);
    await buy(e, course);
    const page = await e.get(`/apprendre/${course.slug}/${lessonId}`);
    assert.equal(page.status, 200);
    assert.doesNotMatch(page.text, /is_correct/, "la bonne réponse ne doit jamais partir vers le navigateur");

    const echec = await e.post(`/apprendre/quiz/${quiz.id}/soumettre`, { [`q_${q.id}`]: String(bad) });
    assert.match(echec.location, /resultat=0&reussi=0/);
    const reussite = await e.post(`/apprendre/quiz/${quiz.id}/soumettre`, { [`q_${q.id}`]: String(good) });
    assert.match(reussite.location, /resultat=100&reussi=1/);
    const done = db.prepare("SELECT COUNT(*) c FROM lesson_progress WHERE lesson_id = ?").get(lessonId).c;
    db.close();
    assert.ok(done >= 1);
  });
});

describe("protections", () => {
  test("formulaire venant d'un autre site → 403", async () => {
    const e = await newStudent(srv);
    const r = await e.post(`/panier/ajouter/${course.id}`, {}, { headers: { Origin: "http://evil.example" } });
    assert.equal(r.status, 403);
  });
  test("en-têtes de sécurité présents, pas de X-Powered-By", async () => {
    const r = await new Client(srv.base).get("/");
    assert.equal(r.headers.get("x-content-type-options"), "nosniff");
    assert.equal(r.headers.get("x-frame-options"), "SAMEORIGIN");
    assert.equal(r.headers.get("x-powered-by"), null);
  });
  test("un visiteur qui parcourt le site ne crée pas de session en base", async () => {
    const before = srv.db().prepare("SELECT COUNT(*) c FROM sessions").get().c;
    const c = new Client(srv.base);
    await c.get("/");
    await c.get("/catalogue");
    assert.equal(srv.db().prepare("SELECT COUNT(*) c FROM sessions").get().c, before);
  });
  // Toujours en dernier : ce test bloque l'adresse IP de test
  test("10 mauvais mots de passe → blocage temporaire (429), même avec le bon mot de passe", async () => {
    const c = new Client(srv.base);
    for (let i = 0; i < 10; i++) assert.equal((await c.post("/connexion", { email: "prof@test.local", password: "faux" + i })).status, 400);
    assert.equal((await c.post("/connexion", { email: "prof@test.local", password: "MotDePasseProf123" })).status, 429);
  });
});
