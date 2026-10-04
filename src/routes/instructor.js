const express = require("express");
const fs = require("fs");
const db = require("../config/database");
const { requireInstructor } = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");
const { slugify } = require("../utils/format");
const { parseVideoUrl } = require("../utils/video");
const { UserError } = require("../utils/errors");
const { duplicateCourse } = require("../services/courses");
const { recordSlugChange } = require("../services/slugs");
const { removeUploadedFile } = require("../utils/uploads");
const { sanitizeRich, normalizeList, editorSources } = require("../utils/richText");
const { cleanLanguage } = require("../utils/format");

const seoStore = require("../seo/store");
const router = express.Router();
// Uniquement sous /formateur : sinon toute URL inconnue du site était redirigée vers la connexion
router.use("/formateur", requireInstructor);

function loadOwnedCourse(req, res, next) {
  const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(req.params.id);
  if (!course || course.instructor_id !== req.session.user.id) {
    return res.status(404).render("error", { message: "Formation introuvable." });
  }
  req.course = course;
  next();
}

function loadOwnedSection(req, res, next) {
  const section = db
    .prepare(`SELECT sections.* FROM sections JOIN courses ON courses.id = sections.course_id WHERE sections.id = ? AND courses.instructor_id = ?`)
    .get(req.params.sectionId, req.session.user.id);
  if (!section) return res.status(404).render("error", { message: "Chapitre introuvable." });
  req.section = section;
  next();
}

function loadOwnedLesson(req, res, next) {
  const lesson = db
    .prepare(
      `SELECT lessons.*, sections.course_id FROM lessons
       JOIN sections ON sections.id = lessons.section_id
       JOIN courses ON courses.id = sections.course_id
       WHERE lessons.id = ? AND courses.instructor_id = ?`
    )
    .get(req.params.lessonId, req.session.user.id);
  if (!lesson) return res.status(404).render("error", { message: "Sous-chapitre introuvable." });
  req.lesson = lesson;
  next();
}

function loadOwnedQuiz(req, res, next) {
  const quiz = db
    .prepare(
      `SELECT quizzes.*, sections.course_id FROM quizzes
       JOIN lessons ON lessons.id = quizzes.lesson_id
       JOIN sections ON sections.id = lessons.section_id
       JOIN courses ON courses.id = sections.course_id
       WHERE quizzes.id = ? AND courses.instructor_id = ?`
    )
    .get(req.params.quizId, req.session.user.id);
  if (!quiz) return res.status(404).render("error", { message: "Quiz introuvable." });
  req.quiz = quiz;
  next();
}

// Efface du disque tous les fichiers de ces leçons : vidéos et pièces jointes
function removeFilesOfLessons(lessonIds) {
  if (!lessonIds.length) return;
  const marks = lessonIds.map(() => "?").join(",");
  db.prepare(
    `SELECT video_path AS p FROM lessons WHERE id IN (${marks}) AND video_path IS NOT NULL
     UNION SELECT path FROM lesson_attachments WHERE lesson_id IN (${marks}) AND path IS NOT NULL`
  )
    .all(...lessonIds, ...lessonIds)
    .forEach((row) => removeUploadedFile(row.p));
}

// ---------- Tableau de bord ----------

// ---------- « Mon espace » : vue d'ensemble, formations, chapitres, catégories, apparence ----------
const dashboard = require("../services/dashboard");
const coursesOf = (userId) => db
  .prepare(
    `SELECT courses.*,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id) AS student_count,
      (SELECT COALESCE(SUM(price_cents), 0) FROM order_items WHERE course_id = courses.id) AS revenue_cents,
      (SELECT COUNT(*) FROM order_items WHERE course_id = courses.id) AS sales_count,
      (SELECT COUNT(*) FROM sections WHERE course_id = courses.id) AS section_count,
      (SELECT COUNT(*) FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = courses.id) AS lesson_count
     FROM courses WHERE instructor_id = ? ORDER BY created_at DESC`
  )
  .all(userId);

router.get("/formateur", (req, res) => {
  const courses = coursesOf(req.session.user.id);
  const messages = db.prepare("SELECT id, name, subject, created_at, read_at FROM contact_messages ORDER BY id DESC LIMIT 4").all();
  res.render("instructor/dashboard", { courses, recent: courses.filter((c) => !c.archived).slice(0, 3), stats: dashboard.stats(req.session.user.id), messages, unreadMessages: res.locals.dash ? res.locals.dash.unread : 0 });
});

const STATUS_FILTERS = { toutes: "Toutes", publiees: "Publiées", brouillons: "Brouillons", archivees: "Archivées" };
router.get("/formateur/formations", (req, res) => {
  const all = coursesOf(req.session.user.id);
  const statut = STATUS_FILTERS[req.query.statut] ? req.query.statut : "toutes";
  const q = String(req.query.q || "").trim();
  const match = (c) => ({ toutes: !c.archived, publiees: c.published && !c.archived, brouillons: !c.published && !c.archived, archivees: c.archived })[statut];
  const counts = { toutes: all.filter((c) => !c.archived).length, publiees: all.filter((c) => c.published && !c.archived).length, brouillons: all.filter((c) => !c.published && !c.archived).length, archivees: all.filter((c) => c.archived).length };
  const courses = all.filter(match).filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase()));
  res.render("instructor/courses", { courses, statut, q, counts, filters: STATUS_FILTERS });
});

// Gestion d'une formation : vue d'ensemble, étudiants, ventes
const courseStats = (id) => db.prepare(`SELECT
    (SELECT COUNT(*) FROM enrollments WHERE course_id = @id) AS students,
    (SELECT COUNT(*) FROM enrollments WHERE course_id = @id AND created_at >= date('now', 'start of month')) AS students_month,
    (SELECT COALESCE(SUM(price_cents), 0) FROM order_items WHERE course_id = @id) AS revenue_cents,
    (SELECT COUNT(*) FROM order_items WHERE course_id = @id) AS sales,
    (SELECT COUNT(*) FROM sections WHERE course_id = @id) AS sections,
    (SELECT COUNT(*) FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = @id) AS lessons`).get({ id });
const enrollmentsOf = (id, limit = 500) => db.prepare(`SELECT u.username, u.email, e.created_at,
    (SELECT COUNT(*) FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN sections s ON s.id = l.section_id WHERE lp.user_id = u.id AND s.course_id = e.course_id) AS done
  FROM enrollments e JOIN users u ON u.id = e.user_id WHERE e.course_id = ? ORDER BY e.id DESC LIMIT ?`).all(id, limit);
const salesOf = (id, limit = 500) => db.prepare(`SELECT o.id AS order_id, o.created_at, oi.price_cents, u.username FROM order_items oi JOIN orders o ON o.id = oi.order_id JOIN users u ON u.id = o.user_id WHERE oi.course_id = ? ORDER BY o.id DESC LIMIT ?`).all(id, limit);
router.get("/formateur/cours/:id(\\d+)", loadOwnedCourse, (req, res) => {
  res.render("instructor/course-hub", { course: req.course, tab: "overview", stats: courseStats(req.course.id), enrollments: enrollmentsOf(req.course.id, 5), sales: salesOf(req.course.id, 5) });
});
router.get("/formateur/cours/:id(\\d+)/etudiants", loadOwnedCourse, (req, res) => {
  const st = courseStats(req.course.id);
  res.render("instructor/course-hub", { course: req.course, tab: "students", stats: st, enrollments: enrollmentsOf(req.course.id) });
});
router.get("/formateur/cours/:id(\\d+)/ventes", loadOwnedCourse, (req, res) => {
  res.render("instructor/course-hub", { course: req.course, tab: "sales", stats: courseStats(req.course.id), sales: salesOf(req.course.id) });
});

router.get("/formateur/chapitres", (req, res) => {
  res.render("instructor/chapters", { courses: coursesOf(req.session.user.id) });
});

router.get("/formateur/categories", (req, res) => {
  const categories = db.prepare("SELECT category, COUNT(*) AS n, SUM(published) AS pub FROM courses WHERE instructor_id = ? GROUP BY category ORDER BY category COLLATE NOCASE").all(req.session.user.id);
  res.render("instructor/categories", { categories, done: req.query.ok || null, error: req.query.erreur || null });
});
router.post("/formateur/categories/renommer", (req, res) => {
  const from = String(req.body.from || "");
  const to = String(req.body.to || "").trim().replace(/\s+/g, " ");
  if (!to || to.length > 60) return res.redirect(`/formateur/categories?erreur=${encodeURIComponent("Nouveau nom : 1 à 60 caractères.")}`);
  const r = db.prepare("UPDATE courses SET category = ? WHERE instructor_id = ? AND category = ?").run(to, req.session.user.id, from);
  res.redirect(`/formateur/categories?ok=${encodeURIComponent(`« ${from} » renommée en « ${to} » (${r.changes} formation${r.changes > 1 ? "s" : ""}).`)}`);
});

router.get("/formateur/apparence", (req, res) => {
  res.render("instructor/appearance", { prefs: dashboard.prefsOf(req.session.user.id), themes: dashboard.THEMES });
});
router.post("/formateur/apparence", express.json({ limit: "4kb" }), (req, res) => {
  res.json({ ok: true, prefs: dashboard.savePrefs(req.session.user.id, req.body || {}) });
});

// ---------- Formation : création / édition ----------

router.get("/formateur/cours/nouveau", (req, res) => {
  res.render("instructor/course-form", { course: null, error: null, sources: editorSources(null) });
});

// Champs « liste » (un élément par ligne) et vidéo de présentation, communs à la création et à la modification.
// Une liste est nettoyée (lignes vides retirées, 30 éléments de 200 caractères au plus) ;
// un lien de présentation invalide (javascript:, texte quelconque…) est ignoré, jamais enregistré.
function cleanList(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, 30)
    .join("\n");
}
// Les cinq textes de la formation. Envoyés par l'éditeur (rich_text = 1) : HTML assaini par liste blanche, listes normalisées.
// Envoyés par l'ancien formulaire (sans JavaScript, sans indicateur) : texte conservé comme avant. Une formation déjà au format
// riche le reste : son indicateur ne repasse jamais à 0 par un envoi sans indicateur.
function courseTextFields(body, existing) {
  const rich = String(body.rich_text) === "1" || Boolean(existing && existing.rich_text === 1);
  if (rich) {
    return {
      rich_text: 1,
      description: sanitizeRich(body.description),
      objectives: normalizeList(body.objectives),
      prerequisites: normalizeList(body.prerequisites),
      target_audience: normalizeList(body.target_audience),
      skills: normalizeList(body.skills),
    };
  }
  return {
    rich_text: 0,
    description: body.description || "",
    objectives: cleanList(body.objectives),
    prerequisites: cleanList(body.prerequisites),
    target_audience: cleanList(body.target_audience),
    skills: cleanList(body.skills),
  };
}
function courseListFields(body) {
  const intro = body.intro_video && body.intro_video.trim() ? parseVideoUrl(body.intro_video) : null;
  return {
    intro_video: intro ? intro.url : null,
    seo_title: String(body.seo_title || "").trim().slice(0, 70) || null,
    seo_description: String(body.seo_description || "").trim().slice(0, 160) || null,
  };
}

router.post("/formateur/cours/nouveau", upload.single("thumbnail"), (req, res) => {
  const { title, subtitle, category, level, price } = req.body;
  const lists = courseListFields(req.body);
  const texts = courseTextFields(req.body, null);
  if (!title || !title.trim()) {
    return res.status(400).render("instructor/course-form", { course: { ...req.body, ...texts }, error: "Le titre est obligatoire.", sources: editorSources({ ...req.body, ...texts }) });
  }

  const baseSlug = slugify(title) || "formation";
  let slug = baseSlug;
  let suffix = 1;
  while (db.prepare("SELECT id FROM courses WHERE slug = ?").get(slug)) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const priceCents = Math.max(0, Math.round(parseFloat(price || "0") * 100)) || 0;
  const thumbnailPath = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;

  const info = db
    .prepare(
      `INSERT INTO courses (instructor_id, title, slug, subtitle, description, objectives, prerequisites, target_audience, skills, rich_text, intro_video, seo_title, seo_description, category, level, price_cents, thumbnail_path, language)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.session.user.id, title.trim(), slug, subtitle || "", texts.description,
      texts.objectives, texts.prerequisites, texts.target_audience, texts.skills, texts.rich_text, lists.intro_video, lists.seo_title, lists.seo_description,
      category || "Autre", level || "debutant", priceCents, thumbnailPath, cleanLanguage(req.body.language)
    );

  res.redirect(`/formateur/cours/${info.lastInsertRowid}/curriculum`);
});

router.get("/formateur/cours/:id/modifier", loadOwnedCourse, (req, res) => {
  res.render("instructor/course-form", { course: req.course, error: null, saved: req.query.enregistre === "1", sources: editorSources(req.course) });
});

router.post("/formateur/cours/:id/modifier", loadOwnedCourse, upload.single("thumbnail"), (req, res) => {
  const { title, subtitle, category, level, price } = req.body;
  const lists = courseListFields(req.body);
  const texts = courseTextFields(req.body, req.course);
  if (!title || !title.trim()) {
    return res.status(400).render("instructor/course-form", { course: { ...req.course, ...req.body, ...texts }, error: "Le titre est obligatoire.", sources: editorSources({ ...req.course, ...req.body, ...texts }) });
  }

  // Adresse modifiable : un champ vide ou sans lettre conserve l'adresse actuelle ; une adresse déjà utilisée est refusée
  let newSlug = req.course.slug;
  const wanted = slugify(String(req.body.slug || ""));
  if (wanted && wanted !== newSlug) {
    const taken =
      db.prepare("SELECT 1 FROM courses WHERE slug = ? AND id != ?").get(wanted, req.course.id) ||
      db.prepare("SELECT 1 FROM course_slug_history WHERE old_slug = ? AND course_id != ?").get(wanted, req.course.id);
    if (taken) {
      if (req.file) fs.unlink(req.file.path, () => {});
      throw new UserError("Cette adresse est déjà utilisée par une autre formation.");
    }
    newSlug = wanted;
  }

  const priceCents = Math.max(0, Math.round(parseFloat(price || "0") * 100)) || 0;
  let thumbnailPath = req.course.thumbnail_path;
  if (req.file) {
    removeUploadedFile(thumbnailPath);
    thumbnailPath = `/uploads/thumbnails/${req.file.filename}`;
  }

  db.prepare(
    `UPDATE courses SET title = ?, slug = ?, subtitle = ?, description = ?, objectives = ?, prerequisites = ?, target_audience = ?, skills = ?, rich_text = ?, intro_video = ?,
       seo_title = ?, seo_description = ?, category = ?, level = ?, price_cents = ?, thumbnail_path = ?, language = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    title.trim(), newSlug, subtitle || "", texts.description,
    texts.objectives, texts.prerequisites, texts.target_audience, texts.skills, texts.rich_text, lists.intro_video, lists.seo_title, lists.seo_description,
    category || "Autre", level || "debutant", priceCents, thumbnailPath, cleanLanguage(req.body.language), req.course.id
  );
  recordSlugChange(req.course.id, req.course.slug, newSlug);
  // Journal SEO : titre, adresse, titre et description SEO (qui, quand, avant → après)
  const after = { title: title.trim(), slug: newSlug, seo_title: lists.seo_title, seo_description: lists.seo_description };
  for (const field of Object.keys(after)) seoStore.logChange({ entityType: "course", entityKey: String(req.course.id), field, before: req.course[field] ?? null, after: after[field] ?? null, userId: req.session.user.id, source: "editor" });

  res.redirect(`/formateur/cours/${req.course.id}/modifier?enregistre=1`);
});

router.post("/formateur/cours/:id/publier", loadOwnedCourse, (req, res) => {
  const hasContent = db
    .prepare("SELECT COUNT(*) c FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = ?")
    .get(req.course.id).c;
  // Une formation archivée doit d'abord être restaurée : elle ne peut pas être publiée directement
  const nextState = req.course.archived ? 0 : req.course.published ? 0 : hasContent ? 1 : 0;
  db.prepare("UPDATE courses SET published = ? WHERE id = ?").run(nextState, req.course.id);
  res.redirect(`/formateur/cours/${req.course.id}/curriculum`);
});

// Dupliquer : copie complète (informations, chapitres, leçons, quiz, pièces jointes, fichiers recopiés),
// en brouillon. Les ventes, inscriptions et avis ne sont jamais copiés.
router.post("/formateur/cours/:id/dupliquer", loadOwnedCourse, (req, res) => {
  const newId = duplicateCourse(req.course.id);
  res.redirect(`/formateur/cours/${newId}/modifier`);
});

// Archiver : la formation quitte le catalogue et ne peut plus être achetée, mais ses étudiants
// gardent leur accès et son historique de ventes est conservé (contrairement à la suppression).
router.post("/formateur/cours/:id/archiver", loadOwnedCourse, (req, res) => {
  db.prepare("UPDATE courses SET published = 0, archived = 1, updated_at = datetime('now') WHERE id = ?").run(req.course.id);
  res.redirect("/formateur");
});

// Restaurer : la formation revient en brouillon, jamais publiée d'office
router.post("/formateur/cours/:id/restaurer", loadOwnedCourse, (req, res) => {
  db.prepare("UPDATE courses SET archived = 0, published = 0, updated_at = datetime('now') WHERE id = ?").run(req.course.id);
  res.redirect("/formateur");
});

router.post("/formateur/cours/:id/supprimer", loadOwnedCourse, (req, res) => {
  // Supprimer une formation déjà vendue effacerait (en cascade) l'accès de ses étudiants ET
  // l'historique des ventes. On la refuse : il faut la dépublier, elle quitte alors le catalogue.
  const sales = db.prepare("SELECT (SELECT COUNT(*) FROM enrollments WHERE course_id = ?) + (SELECT COUNT(*) FROM order_items WHERE course_id = ?) AS n").get(req.course.id, req.course.id).n;
  if (sales > 0) {
    return res.status(409).render("error", {
      message: "Cette formation a déjà été achetée : la supprimer effacerait l'accès de vos étudiants et votre historique de ventes. Dépubliez-la plutôt : elle disparaît du catalogue et ses étudiants gardent leur accès.",
    });
  }

  removeUploadedFile(req.course.thumbnail_path);
  const lessonIds = db
    .prepare("SELECT lessons.id FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = ?")
    .all(req.course.id)
    .map((l) => l.id);
  removeFilesOfLessons(lessonIds);
  db.prepare("DELETE FROM courses WHERE id = ?").run(req.course.id);
  res.redirect("/formateur");
});

// ---------- Constructeur de formation (chapitres / sous-chapitres) ----------

function loadFullCurriculum(courseId) {
  const sections = db.prepare("SELECT * FROM sections WHERE course_id = ? ORDER BY position, id").all(courseId);
  const lessonsStmt = db.prepare("SELECT * FROM lessons WHERE section_id = ? ORDER BY position, id");
  const quizStmt = db.prepare("SELECT * FROM quizzes WHERE lesson_id = ?");
  sections.forEach((s) => {
    s.lessons = lessonsStmt.all(s.id);
    s.lessons.forEach((l) => (l.quiz = quizStmt.get(l.id) || null));
  });
  return sections;
}

function loadLessonEditorData(lessonId) {
  const lesson = db.prepare("SELECT * FROM lessons WHERE id = ?").get(lessonId);
  if (!lesson) return null;
  const quiz = db.prepare("SELECT * FROM quizzes WHERE lesson_id = ?").get(lessonId);
  if (quiz) {
    const questions = db.prepare("SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY position, id").all(quiz.id);
    const optionsStmt = db.prepare("SELECT * FROM quiz_options WHERE question_id = ? ORDER BY position, id");
    questions.forEach((q) => (q.options = optionsStmt.all(q.id)));
    quiz.questions = questions;
  }
  const attachments = db.prepare("SELECT * FROM lesson_attachments WHERE lesson_id = ? ORDER BY position, id").all(lessonId);
  return { lesson, quiz: quiz || null, attachments };
}

router.get("/formateur/cours/:id/curriculum", loadOwnedCourse, (req, res) => {
  const sections = loadFullCurriculum(req.course.id);
  let selected = null;
  const lessonId = parseInt(req.query.lecon, 10);
  if (lessonId) {
    const belongs = sections.some((s) => s.lessons.some((l) => l.id === lessonId));
    if (belongs) selected = loadLessonEditorData(lessonId);
  }
  res.render("instructor/curriculum", { course: req.course, sections, selected, saved: req.query.enregistre === "1" });
});

router.post("/formateur/cours/:id/sections", loadOwnedCourse, (req, res) => {
  const title = (req.body.title || "").trim();
  if (title) {
    const maxPos = db.prepare("SELECT COALESCE(MAX(position), -1) m FROM sections WHERE course_id = ?").get(req.course.id).m;
    db.prepare("INSERT INTO sections (course_id, title, position) VALUES (?, ?, ?)").run(req.course.id, title, maxPos + 1);
  }
  res.redirect(`/formateur/cours/${req.course.id}/curriculum`);
});

router.post("/formateur/cours/:id/sections/reorder", loadOwnedCourse, (req, res) => {
  const order = Array.isArray(req.body.order) ? req.body.order : [];
  const update = db.prepare("UPDATE sections SET position = ? WHERE id = ? AND course_id = ?");
  order.forEach((sectionId, index) => update.run(index, Number(sectionId), req.course.id));
  res.json({ ok: true });
});

router.post("/formateur/sections/:sectionId/supprimer", loadOwnedSection, (req, res) => {
  removeFilesOfLessons(db.prepare("SELECT id FROM lessons WHERE section_id = ?").all(req.section.id).map((l) => l.id));
  db.prepare("DELETE FROM sections WHERE id = ?").run(req.section.id);
  res.redirect(`/formateur/cours/${req.section.course_id}/curriculum`);
});

router.post("/formateur/sections/:sectionId/lecons", loadOwnedSection, (req, res) => {
  const title = (req.body.title || "").trim();
  if (!title) return res.redirect(`/formateur/cours/${req.section.course_id}/curriculum`);

  const maxPos = db.prepare("SELECT COALESCE(MAX(position), -1) m FROM lessons WHERE section_id = ?").get(req.section.id).m;
  const info = db
    .prepare(`INSERT INTO lessons (section_id, title, position) VALUES (?, ?, ?)`)
    .run(req.section.id, title, maxPos + 1);

  res.redirect(`/formateur/cours/${req.section.course_id}/curriculum?lecon=${info.lastInsertRowid}`);
});

router.post("/formateur/sections/:sectionId/lecons/reorder", loadOwnedSection, (req, res) => {
  const order = Array.isArray(req.body.order) ? req.body.order : [];
  const update = db.prepare(
    `UPDATE lessons SET section_id = ?, position = ? WHERE id = ? AND section_id IN (SELECT id FROM sections WHERE course_id = ?)`
  );
  order.forEach((lessonId, index) => update.run(req.section.id, index, Number(lessonId), req.section.course_id));
  res.json({ ok: true });
});

router.post(
  "/formateur/lecons/:lessonId/modifier",
  loadOwnedLesson,
  upload.fields([{ name: "video", maxCount: 1 }]),
  (req, res) => {
    const { title, description, duration_minutes, video_url } = req.body;
    if (!title || !title.trim()) {
      return res.redirect(`/formateur/cours/${req.lesson.course_id}/curriculum?lecon=${req.lesson.id}`);
    }

    // Un lien vidéo doit être une adresse http(s) valide (jamais javascript:, data:, etc.)
    const wantsUrl = Boolean(video_url && video_url.trim());
    const parsedVideo = wantsUrl ? parseVideoUrl(video_url) : null;
    if (wantsUrl && !parsedVideo) {
      // On supprime les fichiers déjà reçus pour ne pas laisser d'orphelins sur le disque
      Object.values(req.files || {}).flat().forEach((f) => fs.unlink(f.path, () => {}));
      throw new UserError("Lien vidéo invalide : utilisez une adresse https:// (YouTube, Vimeo, fichier .mp4) ou l'identifiant d'une vidéo Bunny Stream.");
    }

    let videoPath = req.lesson.video_path;
    let videoUrl = req.lesson.video_url;
    const videoFile = req.files && req.files.video && req.files.video[0];
    if (videoFile) {
      removeUploadedFile(videoPath);
      videoPath = `/uploads/videos/${videoFile.filename}`;
      videoUrl = null;
    } else if (parsedVideo) {
      removeUploadedFile(videoPath);
      videoPath = null;
      videoUrl = parsedVideo.url;
    } else if (req.body.remove_video) {
      removeUploadedFile(videoPath);
      videoPath = null;
      videoUrl = null;
    }

    db.prepare(
      `UPDATE lessons SET title = ?, description = ?, duration_minutes = ?, is_preview = ?, video_path = ?, video_url = ?
       WHERE id = ?`
    ).run(title.trim(), description || "", parseInt(duration_minutes, 10) || 0, req.body.is_preview ? 1 : 0, videoPath, videoUrl, req.lesson.id);

    res.redirect(`/formateur/cours/${req.lesson.course_id}/curriculum?lecon=${req.lesson.id}&enregistre=1`);
  }
);

router.post("/formateur/lecons/:lessonId/supprimer", loadOwnedLesson, (req, res) => {
  removeFilesOfLessons([req.lesson.id]);
  db.prepare("DELETE FROM lessons WHERE id = ?").run(req.lesson.id);
  res.redirect(`/formateur/cours/${req.lesson.course_id}/curriculum`);
});

// ---------- Pièces jointes (fichiers et liens) ----------

function loadOwnedAttachment(req, res, next) {
  const attachment = db
    .prepare(
      `SELECT a.*, sections.course_id FROM lesson_attachments a
       JOIN lessons ON lessons.id = a.lesson_id
       JOIN sections ON sections.id = lessons.section_id
       JOIN courses ON courses.id = sections.course_id
       WHERE a.id = ? AND courses.instructor_id = ?`
    )
    .get(req.params.attachmentId, req.session.user.id);
  if (!attachment) return res.status(404).render("error", { message: "Pièce jointe introuvable." });
  req.attachment = attachment;
  next();
}

const nextAttachmentPosition = (lessonId) =>
  db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS n FROM lesson_attachments WHERE lesson_id = ?").get(lessonId).n;

// Le formateur propriétaire est vérifié AVANT la réception du fichier (loadOwnedLesson précède upload)
router.post("/formateur/lecons/:lessonId/pieces-jointes", loadOwnedLesson, upload.single("attachment"), (req, res) => {
  if (!req.file) throw new UserError("Choisissez un fichier à ajouter.");
  const title = (req.body.title || "").trim().slice(0, 120) || req.file.originalname.slice(0, 120);
  db.prepare("INSERT INTO lesson_attachments (lesson_id, kind, title, path, position) VALUES (?, 'file', ?, ?, ?)").run(
    req.lesson.id,
    title,
    `/uploads/resources/${req.file.filename}`,
    nextAttachmentPosition(req.lesson.id)
  );
  res.redirect(`/formateur/cours/${req.lesson.course_id}/curriculum?lecon=${req.lesson.id}`);
});

router.post("/formateur/lecons/:lessonId/liens", loadOwnedLesson, (req, res) => {
  let url = null;
  try {
    url = new URL(String(req.body.url || "").trim());
  } catch {
    // adresse illisible : refusée plus bas
  }
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) {
    throw new UserError("Lien invalide : utilisez une adresse commençant par https://");
  }
  const title = (req.body.title || "").trim().slice(0, 120) || url.hostname;
  db.prepare("INSERT INTO lesson_attachments (lesson_id, kind, title, url, position) VALUES (?, 'link', ?, ?, ?)").run(
    req.lesson.id,
    title,
    url.href,
    nextAttachmentPosition(req.lesson.id)
  );
  res.redirect(`/formateur/cours/${req.lesson.course_id}/curriculum?lecon=${req.lesson.id}`);
});

router.post("/formateur/pieces-jointes/:attachmentId/supprimer", loadOwnedAttachment, (req, res) => {
  if (req.attachment.path) removeUploadedFile(req.attachment.path);
  db.prepare("DELETE FROM lesson_attachments WHERE id = ?").run(req.attachment.id);
  res.redirect(`/formateur/cours/${req.attachment.course_id}/curriculum?lecon=${req.attachment.lesson_id}`);
});

// ---------- Quiz ----------

router.post("/formateur/lecons/:lessonId/quiz", loadOwnedLesson, (req, res) => {
  const existing = db.prepare("SELECT id FROM quizzes WHERE lesson_id = ?").get(req.lesson.id);
  if (!existing) {
    db.prepare("INSERT INTO quizzes (lesson_id, title, pass_percentage) VALUES (?, 'Quiz', 70)").run(req.lesson.id);
  }
  res.redirect(`/formateur/cours/${req.lesson.course_id}/curriculum?lecon=${req.lesson.id}`);
});

router.post("/formateur/quiz/:quizId/supprimer", loadOwnedQuiz, (req, res) => {
  const lesson = db.prepare("SELECT id FROM lessons WHERE id = ?").get(req.quiz.lesson_id);
  db.prepare("DELETE FROM quizzes WHERE id = ?").run(req.quiz.id);
  res.redirect(`/formateur/cours/${req.quiz.course_id}/curriculum?lecon=${lesson ? lesson.id : ""}`);
});

router.post("/formateur/quiz/:quizId/parametres", loadOwnedQuiz, (req, res) => {
  const pass = Math.min(100, Math.max(0, parseInt(req.body.pass_percentage, 10) || 70));
  db.prepare("UPDATE quizzes SET title = ?, pass_percentage = ? WHERE id = ?").run(req.body.title || "Quiz", pass, req.quiz.id);
  res.redirect(`/formateur/cours/${req.quiz.course_id}/curriculum?lecon=${req.quiz.lesson_id}`);
});

router.post("/formateur/quiz/:quizId/questions", loadOwnedQuiz, (req, res) => {
  const question = (req.body.question || "").trim();
  const optionTexts = [req.body.option_1, req.body.option_2, req.body.option_3, req.body.option_4].map((o) => (o || "").trim());
  const correctIndex = parseInt(req.body.correct, 10);

  if (question && optionTexts.filter(Boolean).length >= 2 && correctIndex >= 1 && correctIndex <= 4 && optionTexts[correctIndex - 1]) {
    const maxPos = db.prepare("SELECT COALESCE(MAX(position), -1) m FROM quiz_questions WHERE quiz_id = ?").get(req.quiz.id).m;
    const qInfo = db.prepare("INSERT INTO quiz_questions (quiz_id, question, position) VALUES (?, ?, ?)").run(req.quiz.id, question, maxPos + 1);
    const insertOption = db.prepare("INSERT INTO quiz_options (question_id, option_text, is_correct, position) VALUES (?, ?, ?, ?)");
    optionTexts.forEach((text, i) => {
      if (text) insertOption.run(Number(qInfo.lastInsertRowid), text, i + 1 === correctIndex ? 1 : 0, i);
    });
  }

  res.redirect(`/formateur/cours/${req.quiz.course_id}/curriculum?lecon=${req.quiz.lesson_id}`);
});

router.post("/formateur/quiz-questions/:questionId/supprimer", (req, res) => {
  const question = db
    .prepare(
      `SELECT quiz_questions.*, quizzes.lesson_id, sections.course_id FROM quiz_questions
       JOIN quizzes ON quizzes.id = quiz_questions.quiz_id
       JOIN lessons ON lessons.id = quizzes.lesson_id
       JOIN sections ON sections.id = lessons.section_id
       JOIN courses ON courses.id = sections.course_id
       WHERE quiz_questions.id = ? AND courses.instructor_id = ?`
    )
    .get(req.params.questionId, req.session.user.id);
  if (!question) return res.status(404).render("error", { message: "Question introuvable." });

  db.prepare("DELETE FROM quiz_questions WHERE id = ?").run(question.id);
  res.redirect(`/formateur/cours/${question.course_id}/curriculum?lecon=${question.lesson_id}`);
});

module.exports = router;
