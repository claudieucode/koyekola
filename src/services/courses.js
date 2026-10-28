// Opérations sur une formation entière (utilisées par les routes du formateur).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const db = require("../config/database");
const { uploadsRoot } = require("../config/paths");
const { slugify } = require("../utils/format");

// Copie physique d'un fichier envoyé (miniature, vidéo, pièce jointe) sous un NOUVEAU nom.
// Une copie ne partage jamais un fichier avec l'original : supprimer l'une ne casse pas l'autre.
// Renvoie la nouvelle adresse ("/uploads/videos/…"), ou null si le fichier source n'existe pas.
function copyUploadedFile(webPath) {
  if (!webPath) return null;
  const relative = webPath.replace(/^\/uploads\//, "");
  const source = path.join(uploadsRoot, relative);
  if (!source.startsWith(uploadsRoot + path.sep) || !fs.existsSync(source)) return null;
  const folder = path.dirname(relative);
  const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${path.extname(relative)}`;
  fs.copyFileSync(source, path.join(uploadsRoot, folder, name));
  return `/uploads/${folder}/${name}`;
}

// Titre « X (copie) », « X (copie 2) »… et adresse unique
function uniqueTitleAndSlug(baseTitle) {
  const taken = (title) => db.prepare("SELECT 1 FROM courses WHERE title = ?").get(title);
  let title = `${baseTitle} (copie)`;
  for (let n = 2; taken(title); n += 1) title = `${baseTitle} (copie ${n})`;
  const base = slugify(title) || "formation";
  let slug = base;
  for (let n = 2; db.prepare("SELECT 1 FROM courses WHERE slug = ?").get(slug); n += 1) slug = `${base}-${n}`;
  return { title, slug };
}

// Duplique une formation en brouillon. Tout ou rien : en cas d'erreur, rien n'est créé et les fichiers déjà
// recopiés sont supprimés.
function duplicateCourse(courseId) {
  const source = db.prepare("SELECT * FROM courses WHERE id = ?").get(courseId);
  const copiedFiles = [];
  const copyFile = (webPath) => {
    const copied = copyUploadedFile(webPath);
    if (copied) copiedFiles.push(copied);
    return copied;
  };
  const { title, slug } = uniqueTitleAndSlug(source.title);

  db.exec("BEGIN");
  try {
    const info = db
      .prepare(
        `INSERT INTO courses (instructor_id, title, slug, subtitle, description, objectives, prerequisites, target_audience, skills, intro_video,
                              category, level, price_cents, thumbnail_path, rich_text, language, published, archived, site_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)`
      )
      .run(
        source.instructor_id, title, slug, source.subtitle, source.description, source.objectives, source.prerequisites,
        source.target_audience, source.skills, source.intro_video, source.category, source.level, source.price_cents,
        copyFile(source.thumbnail_path), source.rich_text, source.language, source.site_id ?? null // la copie reste dans le site de l'original
      );
    const newCourseId = Number(info.lastInsertRowid);

    const insertSection = db.prepare("INSERT INTO sections (course_id, title, position) VALUES (?, ?, ?)");
    const insertLesson = db.prepare(
      `INSERT INTO lessons (section_id, title, description, video_path, video_url, duration_minutes, position, is_preview)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertAttachment = db.prepare("INSERT INTO lesson_attachments (lesson_id, kind, title, path, url, position) VALUES (?, ?, ?, ?, ?, ?)");
    const insertQuiz = db.prepare("INSERT INTO quizzes (lesson_id, title, pass_percentage, max_attempts) VALUES (?, ?, ?, ?)");
    const insertQuestion = db.prepare("INSERT INTO quiz_questions (quiz_id, question, position) VALUES (?, ?, ?)");
    const insertOption = db.prepare("INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES (?, ?, ?, ?)");

    for (const section of db.prepare("SELECT * FROM sections WHERE course_id = ? ORDER BY position, id").all(courseId)) {
      const newSectionId = Number(insertSection.run(newCourseId, section.title, section.position).lastInsertRowid);

      for (const lesson of db.prepare("SELECT * FROM lessons WHERE section_id = ? ORDER BY position, id").all(section.id)) {
        const newLessonId = Number(
          insertLesson.run(newSectionId, lesson.title, lesson.description, copyFile(lesson.video_path), lesson.video_url, lesson.duration_minutes, lesson.position, lesson.is_preview).lastInsertRowid
        );

        for (const a of db.prepare("SELECT * FROM lesson_attachments WHERE lesson_id = ? ORDER BY position, id").all(lesson.id)) {
          insertAttachment.run(newLessonId, a.kind, a.title, a.kind === "file" ? copyFile(a.path) : null, a.url, a.position);
        }

        const quiz = db.prepare("SELECT * FROM quizzes WHERE lesson_id = ?").get(lesson.id);
        if (quiz) {
          const newQuizId = Number(insertQuiz.run(newLessonId, quiz.title, quiz.pass_percentage, quiz.max_attempts ?? null).lastInsertRowid);
          for (const q of db.prepare("SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY position, id").all(quiz.id)) {
            const newQuestionId = Number(insertQuestion.run(newQuizId, q.question, q.position).lastInsertRowid);
            for (const o of db.prepare("SELECT * FROM quiz_options WHERE question_id = ? ORDER BY position, id").all(q.id)) {
              insertOption.run(newQuestionId, o.option_text, o.is_correct, o.position);
            }
          }
        }
      }
    }
    db.exec("COMMIT");
    return newCourseId;
  } catch (err) {
    db.exec("ROLLBACK");
    copiedFiles.forEach((webPath) => fs.unlink(path.join(uploadsRoot, webPath.replace(/^\/uploads\//, "")), () => {}));
    throw err;
  }
}

module.exports = { duplicateCourse, copyUploadedFile };
