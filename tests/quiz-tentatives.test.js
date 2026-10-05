// Quiz : nombre maximal de tentatives, appliqué CÔTÉ SERVEUR (pas seulement masqué dans la page).
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

let srv, prof, course, quizId, q;
const sql = (query, ...args) => { const db = srv.db(); try { return db.prepare(query).all(...args); } finally { db.close(); } };
const attempts = (email) => sql("SELECT a.* FROM quiz_attempts a JOIN users u ON u.id = a.user_id WHERE u.email = ? AND a.quiz_id = ?", email, quizId);
const setMax = (value) => prof.post(`/formateur/quiz/${quizId}/parametres`, { title: "Quiz", pass_percentage: "70", max_attempts: value });
const lessonUrl = () => `/apprendre/${course.slug}/${course.lessons[0].id}`;
const answer = (e, good) => e.post(`/apprendre/quiz/${quizId}/soumettre`, { [`q_${q.id}`]: String(good ? q.good : q.bad) });

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  course = await createCourse(prof, srv, { title: "Formation Quiz Tentatives", price: 10, lessons: [{ title: "Leçon quiz" }] });
  await prof.post(`/formateur/lecons/${course.lessons[0].id}/quiz`, {});
  quizId = sql("SELECT id FROM quizzes WHERE lesson_id = ?", course.lessons[0].id)[0].id;
  await prof.post(`/formateur/quiz/${quizId}/questions`, { question: "Capitale de la France ?", option_1: "Lyon", option_2: "Paris", option_3: "Nice", correct: "2" });
  q = sql("SELECT q.id, (SELECT o.id FROM quiz_options o WHERE o.question_id = q.id AND o.is_correct = 1) AS good, (SELECT o.id FROM quiz_options o WHERE o.question_id = q.id AND o.is_correct = 0 ORDER BY o.id LIMIT 1) AS bad FROM quiz_questions q WHERE q.quiz_id = ?", quizId)[0];
});
after(() => srv.stop());

test("réglage : valeur valide enregistrée, vide ou invalide = illimité (jamais de blocage par erreur)", async () => {
  const max = () => sql("SELECT max_attempts FROM quizzes WHERE id = ?", quizId)[0].max_attempts;
  await setMax("3");
  assert.equal(max(), 3);
  for (const bad of ["0", "-2", "abc", "1000", "2.5", ""]) {
    await setMax("3");
    await setMax(bad);
    assert.equal(max(), null, `« ${bad} » → illimité`);
  }
  assert.match((await prof.get(`/formateur/cours/${course.id}/curriculum?lecon=${course.lessons[0].id}`)).text, /name="max_attempts"/);
});

test("2 tentatives max : la 3e n'est PAS corrigée (même en forçant la requête), message clair, compteur exact", async () => {
  await setMax("2");
  const e = await newStudent(srv);
  await buy(e, course);
  assert.match((await e.get(lessonUrl())).text, /Il vous reste <strong>2<\/strong> tentatives/);
  await answer(e, false);
  assert.match((await e.get(lessonUrl())).text, /Il vous reste <strong>1<\/strong> tentative\./);
  await answer(e, false);
  assert.equal(attempts(e.email).length, 2);
  const page = (await e.get(lessonUrl())).text;
  assert.match(page, /utilisé toutes vos tentatives/);
  assert.doesNotMatch(page, /Valider le quiz/, "plus de formulaire");
  const forced = await answer(e, true); // requête envoyée à la main, bonne réponse
  assert.equal(forced.status, 302);
  assert.match(forced.location, /tentatives=epuisees/);
  assert.equal(attempts(e.email).length, 2, "aucune tentative de plus enregistrée");
  assert.equal(attempts(e.email).some((a) => a.passed), false, "pas de réussite obtenue en contournant la limite");
  assert.equal(sql("SELECT COUNT(*) n FROM lesson_progress lp JOIN users u ON u.id = lp.user_id WHERE u.email = ?", e.email)[0].n, 0, "leçon non validée");
});

test("la limite est propre à chaque élève ; une réussite avant la limite valide la leçon", async () => {
  await setMax("2");
  const a = await newStudent(srv), b = await newStudent(srv);
  await buy(a, course); await buy(b, course);
  await answer(a, false); await answer(a, false);
  await answer(b, false);
  assert.equal(attempts(b.email).length, 1, "b n'est pas touché par les tentatives de a");
  await answer(b, true);
  assert.equal(attempts(b.email).filter((x) => x.passed).length, 1);
  assert.equal(sql("SELECT COUNT(*) n FROM lesson_progress lp JOIN users u ON u.id = lp.user_id WHERE u.email = ?", b.email)[0].n, 1);
  assert.match((await b.get(lessonUrl())).text, /déjà réussi/);
});

test("le formateur relève la limite : l'élève bloqué peut de nouveau essayer ; illimité = jamais bloqué", async () => {
  await setMax("1");
  const e = await newStudent(srv);
  await buy(e, course);
  await answer(e, false);
  assert.match((await e.get(lessonUrl())).text, /utilisé toutes vos tentatives/);
  await setMax("3");
  assert.match((await e.get(lessonUrl())).text, /Il vous reste <strong>2<\/strong> tentatives/);
  await setMax("");
  for (let i = 0; i < 4; i++) await answer(e, false);
  assert.equal(attempts(e.email).length, 5);
  await answer(e, true);
  assert.equal(attempts(e.email).filter((x) => x.passed).length, 1, "illimité : on peut toujours réussir");
});

test("sans connexion ou sans la formation : aucune tentative enregistrée", async () => {
  await setMax("2");
  const stranger = await newStudent(srv);
  await answer(stranger, true);
  assert.equal(attempts(stranger.email).length, 0, "formation non possédée");
});

test("dupliquer la formation conserve la limite de tentatives", async () => {
  await setMax("4");
  const r = await prof.post(`/formateur/cours/${course.id}/dupliquer`, {});
  assert.equal(r.status, 302);
  const copy = sql("SELECT qz.max_attempts FROM quizzes qz JOIN lessons l ON l.id = qz.lesson_id JOIN sections s ON s.id = l.section_id JOIN courses c ON c.id = s.course_id WHERE c.id <> ? AND c.title LIKE 'Formation Quiz Tentatives%'", course.id);
  assert.equal(copy.length, 1);
  assert.equal(copy[0].max_attempts, 4);
});
