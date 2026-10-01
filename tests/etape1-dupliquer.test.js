// Étape 1b : dupliquer une formation (structure, contenus, quiz, fichiers copiés physiquement).
const { test, before, after, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, Client, loginInstructor, newStudent, createCourse, buy } = require("./helpers");

let srv, prof, original, copy, eleve;
const q = (sql, ...a) => {
  const db = srv.db();
  const r = db.prepare(sql).all(...a);
  db.close();
  return r;
};
const one = (sql, ...a) => q(sql, ...a)[0];
const onDisk = (webPath) => fs.existsSync(path.join(srv.dir, "uploads", webPath.replace(/^\/uploads\//, "")));

before(async () => {
  srv = await startServer();
  prof = await loginInstructor(srv);

  // Miniature réelle (PNG factice) : envoyée à la création
  const fd = new FormData();
  Object.entries({ title: "Originale", category: "Business", level: "intermediaire", price: "49", description: "**Description**", objectives: "Objectif A", prerequisites: "Prérequis A", target_audience: "Public A", skills: "Compétence A", intro_video: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }).forEach(([k, v]) => fd.append(k, v));
  fd.append("thumbnail", new Blob([Buffer.alloc(200, 7)], { type: "image/png" }), "cover.png");
  await prof.request("/formateur/cours/nouveau", { method: "POST", multipart: fd });
  const row = one("SELECT id, slug FROM courses WHERE title = 'Originale'");
  original = { ...row };

  await prof.post(`/formateur/cours/${original.id}/sections`, { title: "Chapitre A" });
  await prof.post(`/formateur/cours/${original.id}/sections`, { title: "Chapitre B" });
  const [secA, secB] = q("SELECT id FROM sections WHERE course_id = ? ORDER BY position, id", original.id);
  const lessons = [];
  for (const [sec, title, preview, video] of [[secA, "Leçon 1", true, Buffer.alloc(3000, 1)], [secA, "Leçon 2", false, null], [secB, "Leçon 3", false, Buffer.alloc(2000, 2)]]) {
    await prof.post(`/formateur/sections/${sec.id}/lecons`, { title });
    const l = one("SELECT id FROM lessons WHERE section_id = ? AND title = ?", sec.id, title);
    const f = new FormData();
    f.append("title", title);
    f.append("duration_minutes", "7");
    f.append("description", `Texte de **${title}**`);
    if (preview) f.append("is_preview", "1");
    if (video) f.append("video", new Blob([video], { type: "video/mp4" }), "v.mp4");
    else f.append("video_url", "https://vimeo.com/76979871");
    await prof.request(`/formateur/lecons/${l.id}/modifier`, { method: "POST", multipart: f });
    lessons.push(l.id);
  }
  // pièce jointe (fichier + lien) et quiz sur la leçon 1
  const att = new FormData();
  att.append("title", "Support");
  att.append("attachment", new Blob(["PDF"], { type: "application/pdf" }), "support.pdf");
  await prof.request(`/formateur/lecons/${lessons[0]}/pieces-jointes`, { method: "POST", multipart: att });
  await prof.post(`/formateur/lecons/${lessons[0]}/liens`, { title: "Doc", url: "https://exemple.com/d" });
  await prof.post(`/formateur/lecons/${lessons[0]}/quiz`, {});
  const quiz = one("SELECT id FROM quizzes WHERE lesson_id = ?", lessons[0]);
  await prof.post(`/formateur/quiz/${quiz.id}/parametres`, { title: "Mon quiz", pass_percentage: "80" });
  await prof.post(`/formateur/quiz/${quiz.id}/questions`, { question: "Q1 ?", option_1: "faux", option_2: "vrai", option_3: "", option_4: "", correct: "2" });
  await prof.post(`/formateur/cours/${original.id}/publier`, {});

  // Des ventes et un avis sur l'original : ils ne doivent JAMAIS être copiés
  eleve = await newStudent(srv);
  await buy(eleve, original);
  await eleve.post(`/cours/${original.slug}/avis`, { rating: "5", comment: "Top" });

  const r = await prof.post(`/formateur/cours/${original.id}/dupliquer`, {});
  assert.equal(r.status, 302, "la duplication doit rediriger");
  copy = one("SELECT * FROM courses WHERE id != ? AND title LIKE 'Originale%' ORDER BY id DESC", original.id);
});
after(() => srv.stop());

describe("duplication d'une formation", () => {
  test("une nouvelle formation est créée, en brouillon, avec un titre et une adresse distincts", () => {
    assert.ok(copy, "copie introuvable");
    assert.equal(copy.title, "Originale (copie)");
    assert.notEqual(copy.slug, original.slug);
    assert.equal(copy.published, 0);
    assert.equal(copy.archived, 0);
  });
  test("les informations de la formation sont reprises", () => {
    assert.deepEqual(
      [copy.category, copy.level, copy.price_cents, copy.description, copy.objectives, copy.prerequisites, copy.target_audience, copy.skills, copy.intro_video],
      ["Business", "intermediaire", 4900, "**Description**", "Objectif A", "Prérequis A", "Public A", "Compétence A", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"]
    );
  });
  test("chapitres et leçons sont copiés dans le même ordre, avec leurs réglages", () => {
    const sections = q("SELECT title FROM sections WHERE course_id = ? ORDER BY position, id", copy.id).map((s) => s.title);
    assert.deepEqual(sections, ["Chapitre A", "Chapitre B"]);
    const lessons = q(`SELECT l.title, l.duration_minutes, l.is_preview, l.description, l.video_url FROM lessons l JOIN sections s ON s.id = l.section_id
                        WHERE s.course_id = ? ORDER BY s.position, s.id, l.position, l.id`, copy.id);
    assert.deepEqual(lessons.map((l) => l.title), ["Leçon 1", "Leçon 2", "Leçon 3"]);
    assert.deepEqual(lessons.map((l) => l.is_preview), [1, 0, 0]);
    assert.equal(lessons[0].description, "Texte de **Leçon 1**");
    assert.equal(lessons[1].video_url, "https://vimeo.com/76979871");
    assert.equal(lessons[0].duration_minutes, 7);
  });
  test("quiz copié avec ses questions, ses réponses et la bonne réponse", () => {
    const quiz = one(`SELECT qz.id, qz.title, qz.pass_percentage FROM quizzes qz JOIN lessons l ON l.id = qz.lesson_id JOIN sections s ON s.id = l.section_id WHERE s.course_id = ?`, copy.id);
    assert.deepEqual([quiz.title, quiz.pass_percentage], ["Mon quiz", 80]);
    const opts = q("SELECT o.option_text, o.is_correct FROM quiz_options o JOIN quiz_questions qq ON qq.id = o.question_id WHERE qq.quiz_id = ? ORDER BY o.position", quiz.id);
    assert.deepEqual(opts.map((o) => [o.option_text, o.is_correct]), [["faux", 0], ["vrai", 1]]);
  });
  test("pièces jointes (fichier et lien) copiées", () => {
    const a = q(`SELECT a.kind, a.title, a.url FROM lesson_attachments a JOIN lessons l ON l.id = a.lesson_id JOIN sections s ON s.id = l.section_id WHERE s.course_id = ? ORDER BY a.position, a.id`, copy.id);
    assert.deepEqual(a.map((x) => [x.kind, x.title]), [["file", "Support"], ["link", "Doc"]]);
    assert.equal(a[1].url, "https://exemple.com/d");
  });
  test("ventes, inscriptions et avis de l'original ne sont pas copiés", () => {
    assert.equal(one("SELECT COUNT(*) n FROM enrollments WHERE course_id = ?", copy.id).n, 0);
    assert.equal(one("SELECT COUNT(*) n FROM order_items WHERE course_id = ?", copy.id).n, 0);
    assert.equal(one("SELECT COUNT(*) n FROM reviews WHERE course_id = ?", copy.id).n, 0);
  });
  test("les fichiers sont recopiés sous de nouveaux noms (jamais partagés avec l'original)", () => {
    const files = (courseId) => {
      const t = one("SELECT thumbnail_path p FROM courses WHERE id = ?", courseId).p;
      const v = q("SELECT l.video_path p FROM lessons l JOIN sections s ON s.id = l.section_id WHERE s.course_id = ? AND l.video_path IS NOT NULL", courseId).map((r) => r.p);
      const a = q("SELECT a.path p FROM lesson_attachments a JOIN lessons l ON l.id = a.lesson_id JOIN sections s ON s.id = l.section_id WHERE s.course_id = ? AND a.path IS NOT NULL", courseId).map((r) => r.p);
      return [t, ...v, ...a];
    };
    const orig = files(original.id);
    const dup = files(copy.id);
    assert.equal(dup.length, orig.length);
    assert.ok(orig.length >= 4);
    for (const p of dup) assert.ok(onDisk(p), `fichier copié manquant : ${p}`);
    assert.equal(dup.filter((p) => orig.includes(p)).length, 0, "aucun fichier ne doit être partagé");
  });
  test("supprimer la copie ne touche pas aux fichiers de l'original", async () => {
    const origVideo = one("SELECT l.video_path p FROM lessons l JOIN sections s ON s.id = l.section_id WHERE s.course_id = ? AND l.video_path IS NOT NULL", original.id).p;
    const r = await prof.post(`/formateur/cours/${copy.id}/supprimer`, {});
    assert.equal(r.status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM courses WHERE id = ?", copy.id).n, 0);
    assert.ok(onDisk(origVideo), "la vidéo de l'original doit toujours exister");
    assert.equal((await eleve.get(origVideo)).status, 200, "et rester lisible par ses étudiants");
  });
  test("l'original est inchangé et une 2e duplication reçoit une adresse unique", async () => {
    await prof.post(`/formateur/cours/${original.id}/dupliquer`, {});
    await prof.post(`/formateur/cours/${original.id}/dupliquer`, {});
    const slugs = q("SELECT slug FROM courses WHERE title LIKE 'Originale (copie%'").map((r) => r.slug);
    assert.equal(slugs.length, 2);
    assert.equal(new Set(slugs).size, 2, "adresses uniques");
    assert.equal(one("SELECT published FROM courses WHERE id = ?", original.id).published, 1);
    assert.equal(q("SELECT id FROM sections WHERE course_id = ?", original.id).length, 2);
  });
  test("seul le formateur peut dupliquer", async () => {
    assert.equal((await eleve.post(`/formateur/cours/${original.id}/dupliquer`, {})).status, 403);
    assert.equal((await new Client(srv.base).post(`/formateur/cours/${original.id}/dupliquer`, {})).status, 302); // redirigé vers la connexion
  });
  test("le tableau de bord propose le bouton « Dupliquer »", async () => {
    assert.match((await prof.get("/formateur")).text, new RegExp(`/formateur/cours/${original.id}/dupliquer`));
  });
});
