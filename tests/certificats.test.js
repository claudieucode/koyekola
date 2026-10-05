// Certificats : délivrés seulement si le parcours est réellement terminé (quiz réussis compris), une seule fois, avec un code
// public impossible à deviner, une page de vérification publique, un PDF, un historique, et une révocation par le formateur.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

const CODE = /KLK-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}/;
let srv, prof, course, quizId;
const sql = (query, ...args) => { const db = srv.db(); try { return db.prepare(query).all(...args); } finally { db.close(); } };
const certOf = (email) => sql("SELECT c.* FROM certificates c JOIN users u ON u.id = c.user_id WHERE u.email = ?", email);
const lessonId = (i) => course.lessons[i].id;

// Un élève qui possède la formation ; `finish` = termine la leçon 1 puis réussit le quiz de la leçon 2
async function student({ finish = false } = {}) {
  const e = await newStudent(srv);
  await buy(e, course);
  if (finish) {
    await e.post(`/apprendre/lecon/${lessonId(0)}/terminer`, {});
    const q = sql("SELECT q.id, (SELECT o.id FROM quiz_options o WHERE o.question_id = q.id AND o.is_correct = 1) AS good FROM quiz_questions q WHERE q.quiz_id = ?", quizId)[0];
    await e.post(`/apprendre/quiz/${quizId}/soumettre`, { [`q_${q.id}`]: String(q.good) });
  }
  return e;
}

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);
  course = await createCourse(prof, srv, { title: "Formation Certifiante", price: 10, lessons: [{ title: "Leçon 1" }, { title: "Leçon 2 avec quiz" }] });
  await prof.post(`/formateur/lecons/${lessonId(1)}/quiz`, {});
  quizId = sql("SELECT id FROM quizzes WHERE lesson_id = ?", lessonId(1))[0].id;
  await prof.post(`/formateur/quiz/${quizId}/questions`, { question: "2 + 2 ?", option_1: "3", option_2: "4", option_3: "5", correct: "2" });
});
after(() => srv.stop());

test("parcours non terminé : aucun certificat (page, PDF), rien n'est enregistré", async () => {
  const e = await student();
  await e.post(`/apprendre/lecon/${lessonId(0)}/terminer`, {}); // leçon 1 faite, quiz pas réussi
  for (const url of [`/certificat/${course.slug}`, `/certificat/${course.slug}/telecharger`]) assert.equal((await e.get(url)).status, 403, url);
  assert.equal(certOf(e.email).length, 0);
});

test("formation non possédée : refus, même terminée par ailleurs", async () => {
  const e = await newStudent(srv);
  assert.equal((await e.get(`/certificat/${course.slug}`)).status, 403);
  assert.equal((await new Client(srv.base).get(`/certificat/${course.slug}`)).status, 302, "visiteur : connexion");
});

test("parcours terminé (quiz réussi) : certificat délivré avec code, instantané du nom ; un second affichage ne crée pas de doublon", async () => {
  const e = await student({ finish: true });
  const page = await e.get(`/certificat/${course.slug}`);
  assert.equal(page.status, 200);
  const code = page.text.match(CODE)[0];
  assert.match(page.text, /Certificat n° /);
  assert.match(page.text, /\/certificat\/verifier\/KLK-/);
  const rows = certOf(e.email);
  assert.equal(rows.length, 1);
  assert.deepEqual([rows[0].code, rows[0].course_title, rows[0].instructor_name, rows[0].revoked_at], [code, "Formation Certifiante", "Prof", null]);
  assert.match(rows[0].student_name, /^eleve\d+$/);
  await e.get(`/certificat/${course.slug}`);
  await e.get(`/certificat/${course.slug}/telecharger`);
  assert.equal(certOf(e.email).length, 1, "pas de doublon");
  assert.equal(certOf(e.email)[0].code, code, "même code à chaque fois");
});

test("le certificat est délivré dès la fin du parcours, SANS ouvrir la page (historique et automatisations)", async () => {
  const e = await student();
  await e.post(`/apprendre/lecon/${lessonId(0)}/terminer`, {});
  assert.equal(certOf(e.email).length, 0, "quiz pas encore réussi : pas de certificat");
  const q = sql("SELECT q.id, (SELECT o.id FROM quiz_options o WHERE o.question_id = q.id AND o.is_correct = 1) AS good, (SELECT o.id FROM quiz_options o WHERE o.question_id = q.id AND o.is_correct = 0 LIMIT 1) AS bad FROM quiz_questions q WHERE q.quiz_id = ?", quizId)[0];
  await e.post(`/apprendre/quiz/${quizId}/soumettre`, { [`q_${q.id}`]: String(q.bad) });
  assert.equal(certOf(e.email).length, 0, "mauvaise réponse : toujours rien");
  await e.post(`/apprendre/quiz/${quizId}/soumettre`, { [`q_${q.id}`]: String(q.good) });
  assert.equal(certOf(e.email).length, 1, "quiz réussi : certificat enregistré sans avoir ouvert la page");
  assert.match((await e.get("/mes-certificats")).text, CODE);
});

test("PDF : fichier PDF réel, nommé avec le code", async () => {
  const e = await student({ finish: true });
  const r = await e.get(`/certificat/${course.slug}/telecharger`);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "application/pdf");
  assert.match(r.headers.get("content-disposition"), new RegExp(`certificat-${certOf(e.email)[0].code}\\.pdf`));
  assert.ok(r.text.startsWith("%PDF-"), "signature PDF");
});

test("vérification PUBLIQUE : authentique avec nom, formation et dates ; saisie tolérante ; jamais indexée", async () => {
  const e = await student({ finish: true });
  const cert = certOf(e.email)[0];
  const anon = new Client(srv.base);
  const page = await anon.get(`/certificat/verifier/${cert.code}`);
  assert.equal(page.status, 200);
  assert.match(page.text, /Certificat authentique/);
  assert.match(page.text, new RegExp(cert.student_name));
  assert.match(page.text, /Formation Certifiante/);
  assert.match(page.text, /noindex/);
  // minuscules, sans tirets, avec espaces → même certificat
  const loose = cert.code.toLowerCase().replace(/-/g, " ");
  const redirect = await anon.get(`/verifier-certificat?code=${encodeURIComponent(loose)}`);
  assert.equal(redirect.status, 302);
  assert.equal(redirect.location, `/certificat/verifier/${cert.code}`);
  assert.equal((await anon.get("/verifier-certificat")).status, 200, "formulaire de saisie");
});

test("vérification : un numéro inventé ou mal formé n'est JAMAIS présenté comme authentique", async () => {
  const anon = new Client(srv.base);
  const unknown = await anon.get("/certificat/verifier/KLK-ABCD-EFGH-JKMN");
  assert.equal(unknown.status, 404);
  assert.match(unknown.text, /Aucun certificat ne correspond/);
  assert.doesNotMatch(unknown.text, /Certificat authentique/);
  const bad = await anon.get("/verifier-certificat?code=123");
  assert.equal(bad.status, 400);
  assert.match(bad.text, /pas le bon format/);
  assert.equal((await anon.get("/certificat/verifier/n-importe-quoi")).status, 404);
  assert.equal((await anon.get("/certificat/verifier/%27%20OR%201=1--")).status, 404, "injection : simple numéro inconnu");
});

test("historique : l'élève voit SES certificats, pas ceux des autres", async () => {
  const a = await student({ finish: true });
  const b = await student({ finish: true });
  const codeA = certOf(a.email)[0].code, codeB = certOf(b.email)[0].code;
  const pageA = (await a.get("/mes-certificats")).text;
  assert.match(pageA, new RegExp(codeA));
  assert.doesNotMatch(pageA, new RegExp(codeB));
  const empty = await newStudent(srv);
  assert.match((await empty.get("/mes-certificats")).text, /pas encore de certificat/);
  assert.equal((await new Client(srv.base).get("/mes-certificats")).status, 302);
});

test("révocation par le formateur propriétaire : « révoqué » à la vérification, plus de certificat ni de PDF, rétablissement possible", async () => {
  const e = await student({ finish: true });
  const cert = certOf(e.email)[0];
  const G = "/formateur/gestion";
  assert.match((await prof.get(`${G}/eleves/${cert.user_id}`)).text, new RegExp(cert.code), "visible dans la fiche élève");
  const r = await prof.post(`${G}/certificats/${cert.id}/revoquer`, {});
  assert.equal(r.status, 302);
  const verify = await new Client(srv.base).get(`/certificat/verifier/${cert.code}`);
  assert.equal(verify.status, 200);
  assert.match(verify.text, /Certificat révoqué/);
  assert.doesNotMatch(verify.text, /Certificat authentique/);
  for (const url of [`/certificat/${course.slug}`, `/certificat/${course.slug}/telecharger`]) {
    const x = await e.get(url);
    assert.equal(x.status, 403, url);
    assert.match(x.text, /révoqué/);
  }
  assert.equal(certOf(e.email).length, 1, "pas de nouveau certificat à la place");
  await prof.post(`${G}/certificats/${cert.id}/retablir`, {});
  assert.match((await new Client(srv.base).get(`/certificat/verifier/${cert.code}`)).text, /Certificat authentique/);
  assert.equal((await e.get(`/certificat/${course.slug}`)).status, 200);
});

test("révocation : réservée au formateur ; un élève ou un visiteur ne peut ni révoquer ni rétablir", async () => {
  const e = await student({ finish: true });
  const cert = certOf(e.email)[0];
  const other = await student({ finish: true });
  for (const client of [e, other, new Client(srv.base)]) {
    const r = await client.post(`/formateur/gestion/certificats/${cert.id}/revoquer`, {});
    assert.notEqual(r.status, 200);
    assert.equal(sql("SELECT revoked_at FROM certificates WHERE id = ?", cert.id)[0].revoked_at, null);
  }
  assert.equal((await prof.post("/formateur/gestion/certificats/999999/revoquer", {})).status, 404);
});

test("le code est aléatoire : 200 codes générés, tous distincts, jamais séquentiels", () => {
  const { newCode, normalizeCode } = require("../src/services/certificates");
  const codes = new Set(Array.from({ length: 200 }, newCode));
  assert.equal(codes.size, 200);
  for (const c of codes) { assert.match(c, new RegExp(`^${CODE.source}$`)); assert.equal(normalizeCode(c.toLowerCase()), c); }
  assert.equal(normalizeCode("KLK-0000-1111-OOOO"), null, "caractères ambigus refusés");
});

test("limite de vérifications : une rafale depuis une même adresse est freinée (429)", async () => {
  const anon = new Client(srv.base);
  let last = 0;
  for (let i = 0; i < 40; i++) last = (await anon.get("/certificat/verifier/KLK-ABCD-EFGH-JKMN")).status;
  assert.equal(last, 429);
});
