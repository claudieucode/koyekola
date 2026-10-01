// Étape 2 : progression automatique (90 % de la vidéo), reprise, et suivi de la dernière leçon consultée.
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

let srv, prof, course, eleve, autre;
const q = (sql, ...a) => {
  const db = srv.db();
  const r = db.prepare(sql).all(...a);
  db.close();
  return r;
};
const one = (sql, ...a) => q(sql, ...a)[0];
const progress = (client, lessonId, body) => client.postJson(`/apprendre/lecon/${lessonId}/progression`, body);
const lessonUrl = (i) => `/apprendre/${course.slug}/${course.lessons[i].id}`;
const completed = (student, lessonId) =>
  Boolean(one("SELECT 1 x FROM lesson_progress WHERE lesson_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)", lessonId, student.email));

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  course = await createCourse(prof, srv, { title: "Progression", price: 0, lessons: [{ title: "L1" }, { title: "L2" }, { title: "L3 avec quiz" }] });
  await prof.post(`/formateur/lecons/${course.lessons[2].id}/quiz`, {});
  eleve = await newStudent(srv);
  await buy(eleve, course);
  autre = await newStudent(srv);
  await buy(autre, course);
});
after(() => srv.stop());

describe("enregistrement de la position", () => {
  test("la position et la durée sont enregistrées", async () => {
    const r = await progress(eleve, course.lessons[0].id, { position: 30, duration: 100 });
    assert.equal(r.status, 200);
    assert.deepEqual(JSON.parse(r.text), { completed: false });
    const s = one("SELECT position_seconds p, duration_seconds d FROM lesson_state WHERE lesson_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)", course.lessons[0].id, eleve.email);
    assert.deepEqual([s.p, s.d], [30, 100]);
  });
  test("la page de la leçon propose la reprise à cette position", async () => {
    const html = (await eleve.get(lessonUrl(0))).text;
    assert.match(html, /data-lesson-tracker/);
    assert.match(html, /data-resume="30"/);
    assert.match(html, /Reprise à 0:30/);
  });
  test("la position d'un élève n'affecte pas celle d'un autre", async () => {
    const html = (await autre.get(lessonUrl(0))).text;
    assert.match(html, /data-resume="0"/);
  });
  test("une position au-delà de la durée est ramenée à la durée", async () => {
    await progress(autre, course.lessons[1].id, { position: 500, duration: 100 });
    const s = one("SELECT position_seconds p FROM lesson_state WHERE lesson_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)", course.lessons[1].id, autre.email);
    assert.equal(s.p, 100);
  });
  test("valeurs invalides refusées (400) sans rien enregistrer", async () => {
    const before = one("SELECT COUNT(*) n FROM lesson_state").n;
    for (const bad of [{ position: -1, duration: 10 }, { position: "abc", duration: 10 }, { position: 5, duration: -3 }, { position: null, duration: 10 }, { duration: 10 }, { position: 5, duration: 999999999 }, { position: Infinity, duration: 1 }, {}]) {
      const r = await progress(eleve, course.lessons[1].id, bad);
      assert.equal(r.status, 400, JSON.stringify(bad));
    }
    assert.equal(one("SELECT COUNT(*) n FROM lesson_state").n, before);
  });
});

describe("terminée automatiquement à 90 %", () => {
  test("89 % ne termine pas la leçon", async () => {
    const r = await progress(eleve, course.lessons[1].id, { position: 89, duration: 100 });
    assert.equal(JSON.parse(r.text).completed, false);
    assert.equal(completed(eleve, course.lessons[1].id), false);
  });
  test("90 % termine la leçon", async () => {
    const r = await progress(eleve, course.lessons[1].id, { position: 90, duration: 100 });
    assert.equal(JSON.parse(r.text).completed, true);
    assert.equal(completed(eleve, course.lessons[1].id), true);
  });
  test("une leçon terminée le reste, même si l'élève revoit le début", async () => {
    await progress(eleve, course.lessons[1].id, { position: 5, duration: 100 });
    assert.equal(completed(eleve, course.lessons[1].id), true);
  });
  test("sans durée connue (0), aucune fin automatique", async () => {
    const r = await progress(autre, course.lessons[0].id, { position: 50, duration: 0 });
    assert.equal(r.status, 200);
    assert.equal(JSON.parse(r.text).completed, false);
    assert.equal(completed(autre, course.lessons[0].id), false);
  });
  test("une leçon avec quiz n'est JAMAIS terminée automatiquement (il faut réussir le quiz)", async () => {
    const r = await progress(eleve, course.lessons[2].id, { position: 100, duration: 100 });
    assert.equal(JSON.parse(r.text).completed, false);
    assert.equal(completed(eleve, course.lessons[2].id), false);
  });
});

describe("droits", () => {
  test("un étudiant non inscrit reçoit 403", async () => {
    const intrus = await newStudent(srv);
    assert.equal((await progress(intrus, course.lessons[0].id, { position: 10, duration: 100 })).status, 403);
  });
  test("le formateur (non inscrit) ne crée aucune progression", async () => {
    assert.equal((await progress(prof, course.lessons[0].id, { position: 10, duration: 100 })).status, 403);
    const page = (await prof.get(lessonUrl(0))).text;
    assert.doesNotMatch(page, /data-lesson-tracker/, "le suivi n'est actif que pour les inscrits");
  });
  test("un visiteur est renvoyé vers la connexion", async () => {
    const r = await progress(new Client(srv.base), course.lessons[0].id, { position: 10, duration: 100 });
    assert.ok(r.status === 302 || r.status === 401);
  });
  test("une leçon inexistante donne 404", async () => {
    assert.equal((await progress(eleve, 999999, { position: 1, duration: 10 })).status, 404);
  });
  test("une requête venant d'un autre site est refusée", async () => {
    const r = await progress(eleve, course.lessons[0].id, { position: 1, duration: 10 }).catch(() => null);
    const evil = await eleve.postJson(`/apprendre/lecon/${course.lessons[0].id}/progression`, { position: 1, duration: 10 }, { headers: { Origin: "http://evil.example" } });
    assert.equal(evil.status, 403);
    assert.ok(r);
  });
});

describe("reprise : dernière leçon consultée", () => {
  let fresh;
  before(async () => {
    fresh = await newStudent(srv);
    await buy(fresh, course);
  });
  test("sans historique : la formation s'ouvre sur la première leçon", async () => {
    const r = await fresh.get(`/apprendre/${course.slug}`);
    assert.equal(r.location, lessonUrl(0));
  });
  test("ouvrir une leçon la mémorise comme dernière consultée", async () => {
    await fresh.get(lessonUrl(1));
    const r = await fresh.get(`/apprendre/${course.slug}`);
    assert.equal(r.location, lessonUrl(1));
    await fresh.get(lessonUrl(0));
    assert.equal((await fresh.get(`/apprendre/${course.slug}`)).location, lessonUrl(0));
  });
  test("le tableau de bord propose « Reprendre » vers cette leçon", async () => {
    await fresh.get(lessonUrl(1));
    const html = (await fresh.get("/mes-cours")).text;
    assert.match(html, new RegExp(`href="${lessonUrl(1).replace(/\//g, "\\/")}"[^>]*>[^<]*Reprendre`));
    assert.match(html, /L2/);
  });
  test("un visiteur ou le formateur qui consulte une leçon ne laisse aucune trace", async () => {
    const before = one("SELECT COUNT(*) n FROM lesson_state").n;
    await prof.get(lessonUrl(0));
    assert.equal(one("SELECT COUNT(*) n FROM lesson_state").n, before);
  });
});
