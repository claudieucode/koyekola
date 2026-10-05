const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middlewares/auth");
const { lessonAccess, isEnrolled } = require("../services/access");
const { safePath } = require("../utils/safeRedirect");
const { isInlineImage } = require("../utils/attachments");
const { currentSlugFor } = require("../services/slugs");
const { applyEffectivePrices } = require("../services/pricing");
const certificates = require("../services/certificates");
const { buildCertificatePdf } = require("../services/certificatePdf");
const { createRateLimiter } = require("../middlewares/security");
const { siteBase } = require("../utils/seo");

const router = express.Router();

router.get("/mes-cours", requireAuth, (req, res) => {
  const userId = req.session.user.id;
  const courses = db
    .prepare(
      `SELECT courses.*, users.username AS instructor_name,
        (SELECT COUNT(*) FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = courses.id) AS total_lessons,
        (SELECT COUNT(*) FROM lesson_progress
           JOIN lessons ON lessons.id = lesson_progress.lesson_id
           JOIN sections ON sections.id = lessons.section_id
           WHERE sections.course_id = courses.id AND lesson_progress.user_id = ?) AS completed_lessons
       FROM enrollments
       JOIN courses ON courses.id = enrollments.course_id
       JOIN users ON users.id = courses.instructor_id
       WHERE enrollments.user_id = ?
       ORDER BY enrollments.created_at DESC`
    )
    .all(userId, userId);

  // Dernière leçon consultée de chaque formation (pour le bouton « Reprendre »)
  const lastStmt = db.prepare(
    `SELECT lessons.id, lessons.title, lesson_state.updated_at FROM lesson_state
     JOIN lessons ON lessons.id = lesson_state.lesson_id
     JOIN sections ON sections.id = lessons.section_id
     WHERE lesson_state.user_id = ? AND sections.course_id = ?
     ORDER BY lesson_state.updated_at DESC, lesson_state.rowid DESC LIMIT 1`
  );
  courses.forEach((c) => {
    c.pct = c.total_lessons > 0 ? Math.round((c.completed_lessons / c.total_lessons) * 100) : 0;
    c.finished = c.total_lessons > 0 && c.completed_lessons >= c.total_lessons;
    c.resume = lastStmt.get(userId, c.id) || null;
  });
  const inProgress = courses.filter((c) => !c.finished);
  const finished = courses.filter((c) => c.finished);
  // La formation à reprendre en priorité : celle consultée le plus récemment parmi celles en cours
  const resumeCourse = inProgress.filter((c) => c.resume).sort((a, b) => b.resume.updated_at - a.resume.updated_at)[0] || null;

  const favorites = applyEffectivePrices(db
    .prepare(
      `SELECT courses.id, courses.slug, courses.title, courses.price_cents, users.username AS instructor_name
       FROM favorites JOIN courses ON courses.id = favorites.course_id JOIN users ON users.id = courses.instructor_id
       WHERE favorites.user_id = ? AND courses.published = 1
       ORDER BY favorites.created_at DESC, favorites.rowid DESC`
    )
    .all(userId));

  const notes = db
    .prepare(
      `SELECT lesson_notes.content, lessons.id AS lesson_id, lessons.title AS lesson_title, courses.slug, courses.title AS course_title
       FROM lesson_notes
       JOIN lessons ON lessons.id = lesson_notes.lesson_id
       JOIN sections ON sections.id = lessons.section_id
       JOIN courses ON courses.id = sections.course_id
       WHERE lesson_notes.user_id = ?
       ORDER BY lesson_notes.updated_at DESC LIMIT 20`
    )
    .all(userId);

  res.render("my-courses", { courses, inProgress, finished, resumeCourse, favorites, notes });
});

function loadCurriculum(courseId) {
  const sections = db.prepare("SELECT * FROM sections WHERE course_id = ? ORDER BY position, id").all(courseId);
  const lessonsStmt = db.prepare("SELECT * FROM lessons WHERE section_id = ? ORDER BY position, id");
  const flatLessons = [];
  sections.forEach((section) => {
    section.lessons = lessonsStmt.all(section.id);
    flatLessons.push(...section.lessons);
  });
  return { sections, flatLessons };
}

// Ne renvoie jamais la bonne réponse au navigateur avant la correction côté serveur.
function loadQuizForLesson(lessonId) {
  const quiz = db.prepare("SELECT * FROM quizzes WHERE lesson_id = ?").get(lessonId);
  if (!quiz) return null;
  const questions = db.prepare("SELECT id, question, position FROM quiz_questions WHERE quiz_id = ? ORDER BY position, id").all(quiz.id);
  const optionsStmt = db.prepare("SELECT id, option_text, position FROM quiz_options WHERE question_id = ? ORDER BY position, id");
  questions.forEach((q) => (q.options = optionsStmt.all(q.id)));
  quiz.questions = questions;
  return quiz;
}

function isCourseComplete(userId, courseId) {
  const total = db
    .prepare(`SELECT COUNT(*) c FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = ?`)
    .get(courseId).c;
  if (total === 0) return false;
  const completed = db
    .prepare(
      `SELECT COUNT(*) c FROM lesson_progress
       JOIN lessons ON lessons.id = lesson_progress.lesson_id
       JOIN sections ON sections.id = lessons.section_id
       WHERE sections.course_id = ? AND lesson_progress.user_id = ?`
    )
    .get(courseId, userId).c;
  return completed >= total;
}

// Délivre le certificat dès que le parcours est réellement terminé (leçons faites, quiz réussis compris), même si l'élève
// n'ouvre jamais la page du certificat : il est ainsi enregistré, visible dans l'historique et déclenche les automatisations.
// Idempotent ; une panne ici ne doit JAMAIS empêcher d'enregistrer la progression.
function issueCertificateIfComplete(user, courseId) {
  try {
    if (!user || !courseId || !isCourseComplete(user.id, courseId)) return;
    if (!db.prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?").get(user.id, courseId)) return;
    const course = db.prepare("SELECT courses.*, users.username AS instructor_name FROM courses JOIN users ON users.id = courses.instructor_id WHERE courses.id = ?").get(courseId);
    if (!course) return;
    const completion = db.prepare(`SELECT MAX(completed_at) d FROM lesson_progress JOIN lessons ON lessons.id = lesson_progress.lesson_id JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = ? AND lesson_progress.user_id = ?`).get(courseId, user.id);
    certificates.issue({ userId: user.id, userName: user.username, course, completedAt: completion.d });
  } catch (error) {
    console.error(`[KOLAKISA] Certificat non délivré (élève ${user && user.id}, formation ${courseId}) :`, error.message);
  }
}

// Formation renommée : les liens de leçons déjà partagés redirigent (301) vers la nouvelle adresse
function redirectRenamed(req, res) {
  const renamed = currentSlugFor(req.params.slug);
  if (!renamed) return false;
  res.redirect(301, req.originalUrl.replace(`/apprendre/${req.params.slug}`, `/apprendre/${renamed}`));
  return true;
}

router.get("/apprendre/:slug", (req, res) => {
  const course = db.prepare("SELECT * FROM courses WHERE slug = ?").get(req.params.slug);
  if (!course && redirectRenamed(req, res)) return;
  if (!course || lessonAccess(req.session.user, course, null).hidden) {
    return res.status(404).render("error", { message: "Formation introuvable." });
  }
  const { flatLessons } = loadCurriculum(course.id);
  if (!flatLessons.length) return res.status(404).render("error", { message: "Cette formation n'a pas encore de leçons." });

  // Reprise : un élève inscrit retrouve la dernière leçon qu'il a ouverte
  let targetId = flatLessons[0].id;
  const user = req.session.user;
  if (user && isEnrolled(user, course.id)) {
    const last = db
      .prepare(
        `SELECT lesson_state.lesson_id AS id FROM lesson_state
         JOIN lessons ON lessons.id = lesson_state.lesson_id
         JOIN sections ON sections.id = lessons.section_id
         WHERE lesson_state.user_id = ? AND sections.course_id = ?
         ORDER BY lesson_state.updated_at DESC, lesson_state.rowid DESC LIMIT 1`
      )
      .get(user.id, course.id);
    if (last && flatLessons.some((l) => l.id === last.id)) targetId = last.id;
  }
  res.redirect(`/apprendre/${course.slug}/${targetId}`);
});

// Pas de requireAuth ici : un sous-chapitre marqué "aperçu gratuit" doit rester
// consultable par un visiteur non connecté, ou connecté mais n'ayant pas acheté la
// formation. L'accès aux autres sous-chapitres reste vérifié plus bas.
router.get("/apprendre/:slug/:lessonId", (req, res) => {
  const course = db.prepare("SELECT * FROM courses WHERE slug = ?").get(req.params.slug);
  if (!course && redirectRenamed(req, res)) return;
  if (!course) return res.status(404).render("error", { message: "Formation introuvable." });

  const { sections, flatLessons } = loadCurriculum(course.id);
  const lessonId = Number(req.params.lessonId);
  const currentIndex = flatLessons.findIndex((l) => l.id === lessonId);
  if (currentIndex === -1) return res.status(404).render("error", { message: "Leçon introuvable." });
  const currentLesson = flatLessons[currentIndex];

  const currentUser = req.session.user;
  const access = lessonAccess(currentUser, course, currentLesson);
  if (access.hidden) return res.status(404).render("error", { message: "Formation introuvable." });
  const { isOwner, enrolled } = access;

  if (!access.canView) {
    if (!currentUser) return res.redirect(`/connexion?redirect=${encodeURIComponent(req.originalUrl)}`);
    return res.status(403).render("error", { message: "Vous devez posséder cette formation pour accéder à ce contenu." });
  }

  const completedIds = new Set();
  if (currentUser) {
    db.prepare(
      `SELECT lesson_id FROM lesson_progress
       WHERE user_id = ? AND lesson_id IN (
         SELECT lessons.id FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = ?
       )`
    )
      .all(currentUser.id, course.id)
      .forEach((r) => completedIds.add(r.lesson_id));
  }

  // Suivi réservé aux élèves inscrits (ni visiteurs ni formateur) : dernière leçon, position de reprise, note
  const trackProgress = Boolean(currentUser) && enrolled;
  let resumeSeconds = 0;
  let noteContent = "";
  if (trackProgress) {
    db.prepare(
      `INSERT INTO lesson_state (user_id, lesson_id, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET updated_at = excluded.updated_at`
    ).run(currentUser.id, currentLesson.id, Date.now());
    const state = db.prepare("SELECT position_seconds FROM lesson_state WHERE user_id = ? AND lesson_id = ?").get(currentUser.id, currentLesson.id);
    resumeSeconds = Math.floor(state ? state.position_seconds : 0);
    const savedNote = db.prepare("SELECT content FROM lesson_notes WHERE user_id = ? AND lesson_id = ?").get(currentUser.id, currentLesson.id);
    noteContent = savedNote ? savedNote.content : "";
  }

  const quiz = loadQuizForLesson(currentLesson.id);
  const quizPassed =
    quiz && currentUser
      ? Boolean(db.prepare("SELECT 1 FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? AND passed = 1").get(currentUser.id, quiz.id))
      : false;
  const quizAttempts = quiz && currentUser
    ? db.prepare("SELECT COUNT(*) n, MAX(score_percentage) best FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?").get(currentUser.id, quiz.id)
    : { n: 0, best: null };
  const attemptsLeft = quiz && quiz.max_attempts ? Math.max(0, quiz.max_attempts - quizAttempts.n) : null; // null = illimité
  const quizResult = req.query.resultat !== undefined ? { score: Number(req.query.resultat), passed: req.query.reussi === "1" } : null;

  res.render("lesson", {
    course,
    sections,
    currentLesson,
    prevLesson: flatLessons[currentIndex - 1] || null,
    nextLesson: flatLessons[currentIndex + 1] || null,
    completedIds,
    totalLessons: flatLessons.length,
    completedCount: flatLessons.filter((l) => completedIds.has(l.id)).length,
    quiz,
    quizPassed,
    quizResult,
    quizAttempts, attemptsLeft, attemptsExhausted: req.query.tentatives === "epuisees",
    attachments: db.prepare("SELECT * FROM lesson_attachments WHERE lesson_id = ? ORDER BY position, id").all(currentLesson.id).map((a) => ({ ...a, inlineImage: isInlineImage(a.path) })),
    courseComplete: currentUser ? isCourseComplete(currentUser.id, course.id) : false,
    hasFullAccess: isOwner || enrolled,
    trackProgress,
    resumeSeconds,
    noteContent,
  });
});

// ---------- Suivi de lecture et notes (appelés par public/js/player.js) ----------

// Charge la leçon et vérifie que l'élève est inscrit : réponses en JSON
function loadTrackedLesson(req, res, next) {
  const lessonId = Number(req.params.lessonId);
  const lesson = Number.isInteger(lessonId)
    ? db.prepare("SELECT lessons.id, sections.course_id FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE lessons.id = ?").get(lessonId)
    : null;
  if (!lesson) return res.status(404).json({ erreur: "Leçon introuvable." });
  if (!isEnrolled(req.session.user, lesson.course_id)) return res.status(403).json({ erreur: "Réservé aux élèves inscrits." });
  req.trackedLesson = lesson;
  next();
}

const MAX_DURATION_SECONDS = 24 * 3600;
const AUTO_COMPLETE_RATIO = 0.9;

// Enregistre la position dans la vidéo. À 90 % de la durée, la leçon est marquée terminée
// (sauf si elle contient un quiz : il faut alors réussir le quiz).
router.post("/apprendre/lecon/:lessonId/progression", requireAuth, loadTrackedLesson, (req, res) => {
  const { position, duration } = req.body || {};
  const valid = (n) => typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= MAX_DURATION_SECONDS;
  if (!valid(position) || !valid(duration)) return res.status(400).json({ erreur: "Position ou durée invalide." });

  const userId = req.session.user.id;
  const lessonId = req.trackedLesson.id;
  const clamped = duration > 0 ? Math.min(position, duration) : position;

  db.prepare(
    `INSERT INTO lesson_state (user_id, lesson_id, position_seconds, duration_seconds, updated_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET position_seconds = excluded.position_seconds,
       duration_seconds = excluded.duration_seconds, updated_at = excluded.updated_at`
  ).run(userId, lessonId, clamped, duration, Date.now());

  let completed = false;
  const hasQuiz = Boolean(db.prepare("SELECT 1 FROM quizzes WHERE lesson_id = ?").get(lessonId));
  if (duration > 0 && clamped / duration >= AUTO_COMPLETE_RATIO && !hasQuiz) {
    db.prepare("INSERT OR IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)").run(userId, lessonId);
    issueCertificateIfComplete(req.session.user, req.trackedLesson.course_id);
    completed = true;
  }
  res.json({ completed });
});

// Note personnelle (une par élève et par leçon). Une note vide supprime la note.
router.post("/apprendre/lecon/:lessonId/note", requireAuth, loadTrackedLesson, (req, res) => {
  const { content } = req.body || {};
  if (typeof content !== "string" || content.length > 20000) return res.status(400).json({ erreur: "Note invalide." });
  const text = content.trimEnd();
  if (text.length > 10000) return res.status(400).json({ erreur: "Note trop longue (10 000 caractères au plus)." });

  const userId = req.session.user.id;
  const lessonId = req.trackedLesson.id;
  if (!text.trim()) {
    db.prepare("DELETE FROM lesson_notes WHERE user_id = ? AND lesson_id = ?").run(userId, lessonId);
  } else {
    db.prepare(
      `INSERT INTO lesson_notes (user_id, lesson_id, content, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, lesson_id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`
    ).run(userId, lessonId, text, Date.now());
  }
  res.json({ saved: true });
});

router.post("/apprendre/lecon/:lessonId/terminer", requireAuth, (req, res) => {
  const lesson = db
    .prepare(
      `SELECT lessons.*, sections.course_id, courses.slug AS course_slug FROM lessons
       JOIN sections ON sections.id = lessons.section_id
       JOIN courses ON courses.id = sections.course_id
       WHERE lessons.id = ?`
    )
    .get(req.params.lessonId);
  if (!lesson) return res.redirect("/mes-cours");

  const enrolled = db.prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?").get(req.session.user.id, lesson.course_id);
  if (enrolled) {
    db.prepare("INSERT OR IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)").run(req.session.user.id, lesson.id);
    issueCertificateIfComplete(req.session.user, lesson.course_id);
  }

  // `next` vient du formulaire : on n'accepte qu'une page de lecture de ce site
  const fallback = `/apprendre/${lesson.course_slug}/${lesson.id}`;
  const next = safePath(req.body.next, fallback);
  res.redirect(next.startsWith("/apprendre/") ? next : fallback);
});

router.post("/apprendre/quiz/:quizId/soumettre", requireAuth, (req, res) => {
  const quiz = db
    .prepare(
      `SELECT quizzes.*, lessons.id AS lesson_id, sections.course_id, courses.slug AS course_slug
       FROM quizzes
       JOIN lessons ON lessons.id = quizzes.lesson_id
       JOIN sections ON sections.id = lessons.section_id
       JOIN courses ON courses.id = sections.course_id
       WHERE quizzes.id = ?`
    )
    .get(req.params.quizId);
  if (!quiz) return res.redirect("/mes-cours");

  const enrolled = db.prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?").get(req.session.user.id, quiz.course_id);
  if (!enrolled) return res.redirect(`/apprendre/${quiz.course_slug}/${quiz.lesson_id}`);

  // Limite de tentatives (vérifiée ICI, jamais seulement dans la page) : un quiz déjà réussi n'a plus de limite à respecter,
  // un quiz dont les tentatives sont épuisées n'est plus corrigé.
  if (quiz.max_attempts) {
    const alreadyPassed = db.prepare("SELECT 1 FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? AND passed = 1").get(req.session.user.id, quiz.id);
    const used = db.prepare("SELECT COUNT(*) n FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?").get(req.session.user.id, quiz.id).n;
    if (!alreadyPassed && used >= quiz.max_attempts) return res.redirect(`/apprendre/${quiz.course_slug}/${quiz.lesson_id}?tentatives=epuisees`);
  }

  const questions = db.prepare("SELECT id FROM quiz_questions WHERE quiz_id = ?").all(quiz.id);
  let correctCount = 0;
  questions.forEach((q) => {
    const submitted = parseInt(req.body[`q_${q.id}`], 10);
    const correctOption = db.prepare("SELECT id FROM quiz_options WHERE question_id = ? AND is_correct = 1").get(q.id);
    if (correctOption && submitted === correctOption.id) correctCount += 1;
  });
  const score = questions.length ? Math.round((correctCount / questions.length) * 100) : 0;
  const passed = score >= quiz.pass_percentage;

  db.prepare("INSERT INTO quiz_attempts (user_id, quiz_id, score_percentage, passed) VALUES (?, ?, ?, ?)").run(
    req.session.user.id,
    quiz.id,
    score,
    passed ? 1 : 0
  );
  if (passed) {
    db.prepare("INSERT OR IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)").run(req.session.user.id, quiz.lesson_id);
    issueCertificateIfComplete(req.session.user, quiz.course_id);
  }

  res.redirect(`/apprendre/${quiz.course_slug}/${quiz.lesson_id}?resultat=${score}&reussi=${passed ? 1 : 0}`);
});

// ---------- Certificats ----------

// Vérifie que l'élève a droit au certificat (formation possédée, parcours réellement terminé, quiz réussis compris)
// puis le délivre (une seule fois) ou renvoie celui déjà délivré. Répond lui-même en cas de refus → null.
function certificateFor(req, res) {
  const course = db
    .prepare("SELECT courses.*, users.username AS instructor_name FROM courses JOIN users ON users.id = courses.instructor_id WHERE slug = ?")
    .get(req.params.slug);
  if (!course) { res.status(404).render("error", { message: "Formation introuvable." }); return null; }

  const enrolled = db.prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?").get(req.session.user.id, course.id);
  if (!enrolled) { res.status(403).render("error", { message: "Vous devez posséder cette formation pour obtenir un certificat." }); return null; }
  if (!isCourseComplete(req.session.user.id, course.id)) {
    res.status(403).render("error", { message: "Terminez tous les sous-chapitres (et réussissez les quiz) pour obtenir votre certificat." });
    return null;
  }
  const completion = db
    .prepare(
      `SELECT MAX(completed_at) d FROM lesson_progress
       JOIN lessons ON lessons.id = lesson_progress.lesson_id
       JOIN sections ON sections.id = lessons.section_id
       WHERE sections.course_id = ? AND lesson_progress.user_id = ?`
    )
    .get(course.id, req.session.user.id);
  const { certificate } = certificates.issue({ userId: req.session.user.id, userName: req.session.user.username, course, completedAt: completion.d });
  if (certificate.revoked_at) { res.status(403).render("error", { message: "Ce certificat a été révoqué par le formateur. Contactez-le pour en savoir plus." }); return null; }
  return { course, certificate };
}
const verifyUrlOf = (req, certificate) => `${siteBase(req)}/certificat/verifier/${certificate.code}`;

router.get("/certificat/:slug", requireAuth, (req, res) => {
  const ctx = certificateFor(req, res);
  if (!ctx) return;
  res.render("certificate", { course: ctx.course, certificate: ctx.certificate, completedAt: ctx.certificate.completed_at || ctx.certificate.issued_at, verifyUrl: verifyUrlOf(req, ctx.certificate) });
});

router.get("/certificat/:slug/telecharger", requireAuth, (req, res) => {
  const ctx = certificateFor(req, res);
  if (!ctx) return;
  res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="certificat-${ctx.certificate.code}.pdf"`, "Cache-Control": "private, no-store" });
  buildCertificatePdf({ certificate: ctx.certificate, verifyUrl: verifyUrlOf(req, ctx.certificate) }).pipe(res);
});

// Historique de l'élève : tous ses certificats, avec leur état
router.get("/mes-certificats", requireAuth, (req, res) => {
  res.render("my-certificates", { list: certificates.listForUser(req.session.user.id), siteUrl: siteBase(req) });
});

// Vérification PUBLIQUE (sans connexion) : un employeur ou un tiers contrôle l'authenticité d'un certificat avec son code.
// Limitée par adresse IP (le code est de toute façon impossible à deviner) ; jamais indexée.
const verifyLimiter = createRateLimiter(30, 60 * 1000);
router.get("/verifier-certificat", (req, res) => {
  const code = String(req.query.code || "").trim();
  if (!code) return res.render("certificate-verify", { state: "form", certificate: null, code: "" });
  const canonical = certificates.normalizeCode(code);
  if (!canonical) return res.status(400).render("certificate-verify", { state: "invalid", certificate: null, code });
  res.redirect(`/certificat/verifier/${canonical}`);
});
router.get("/certificat/verifier/:code", (req, res) => {
  if (verifyLimiter.isLimited(req.ip)) return res.status(429).render("error", { message: "Trop de vérifications. Réessayez dans une minute." });
  verifyLimiter.hit(req.ip);
  const certificate = certificates.findByCode(req.params.code);
  if (!certificate) return res.status(404).render("certificate-verify", { state: "unknown", certificate: null, code: req.params.code });
  res.render("certificate-verify", { state: certificate.revoked_at ? "revoked" : "valid", certificate, code: certificate.code });
});

module.exports = router;
