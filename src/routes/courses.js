const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middlewares/auth");
const { lessonAccess } = require("../services/access");
const { parseVideoUrl } = require("../utils/video");
const { slugify, cleanLanguage } = require("../utils/format");
const { absoluteUrl, plainText } = require("../utils/seo");
const { currentSlugFor } = require("../services/slugs");
const { buildProgramPdf } = require("../services/programPdf");
const { courseTexts, htmlText } = require("../utils/richText");
const { listHeroImages } = require("../utils/heroImages");
const { siteBase } = require("../utils/seo");
const seoPages = require("../seo/pages");

const SITE_NAME = "KOLAKISA";

// 150 minutes -> "PT2H30M" (durée au format des données structurées)
function isoDuration(minutes) {
  if (!minutes) return undefined;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h ? h + "H" : ""}${m ? m + "M" : ""}`;
}

const router = express.Router();

const COURSE_SELECT = `
  SELECT courses.*, users.username AS instructor_name,
    (SELECT COUNT(*) FROM enrollments WHERE enrollments.course_id = courses.id) AS student_count,
    (SELECT AVG(rating) FROM reviews WHERE reviews.course_id = courses.id) AS avg_rating,
    (SELECT COUNT(*) FROM reviews WHERE reviews.course_id = courses.id) AS review_count,
    (SELECT COUNT(*) FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = courses.id) AS lesson_count,
    (SELECT COALESCE(SUM(lessons.duration_minutes), 0) FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = courses.id) AS total_minutes
  FROM courses
  JOIN users ON users.id = courses.instructor_id
`;

router.get("/", (req, res) => {
  const featured = db.prepare(`${COURSE_SELECT} WHERE courses.published = 1 ORDER BY student_count DESC, courses.created_at DESC LIMIT 6`).all();
  const recent = db.prepare(`${COURSE_SELECT} WHERE courses.published = 1 ORDER BY courses.created_at DESC LIMIT 8`).all();
  const categories = db.prepare("SELECT category, COUNT(*) AS count FROM courses WHERE published = 1 GROUP BY category ORDER BY count DESC").all();
  const stats = {
    courseCount: db.prepare("SELECT COUNT(*) c FROM courses WHERE published = 1").get().c,
    studentCount: db.prepare("SELECT COUNT(*) c FROM enrollments").get().c,
    lessonCount: db
      .prepare(
        `SELECT COUNT(*) c FROM lessons
         JOIN sections ON sections.id = lessons.section_id
         JOIN courses ON courses.id = sections.course_id
         WHERE courses.published = 1`
      )
      .get().c,
  };
  const creator = db.prepare("SELECT username, bio FROM users WHERE role = 'formateur' ORDER BY id LIMIT 1").get() || null;
  res.render("index", {
    heroImages: listHeroImages(),
    featured, recent, categories, stats, creator,
    seo: seoPages.home(req),
  });
});

router.get("/catalogue", (req, res) => {
  const { q = "", category = "", level = "", sort = "recent" } = req.query;

  // /catalogue?category=X (sans autre filtre) est l'ancienne adresse d'une page catégorie : redirection définitive
  if (category && Object.keys(req.query).length === 1) {
    const exists = db.prepare("SELECT 1 FROM courses WHERE published = 1 AND archived = 0 AND category = ?").get(category);
    if (exists) return res.redirect(301, `/categorie/${slugify(category)}`);
  }
  const conditions = ["courses.published = 1"];
  const params = [];

  if (q) {
    conditions.push("(courses.title LIKE ? OR courses.subtitle LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category) {
    conditions.push("courses.category = ?");
    params.push(category);
  }
  if (level) {
    conditions.push("courses.level = ?");
    params.push(level);
  }

  const orderBy = {
    price_asc: "courses.price_cents ASC",
    price_desc: "courses.price_cents DESC",
    popular: "student_count DESC",
    rating: "avg_rating DESC",
  }[sort] || "courses.created_at DESC";

  const courses = db
    .prepare(`${COURSE_SELECT} WHERE ${conditions.join(" AND ")} ORDER BY ${orderBy}`)
    .all(...params);

  const categories = db.prepare("SELECT DISTINCT category FROM courses WHERE published = 1 ORDER BY category").all();

  const seo = seoPages.catalogue(req);
  // Variantes filtrées ou triées : même titre que le catalogue et adresse canonique /catalogue → non indexées (liens suivis)
  if (q || category || level || sort !== "recent") seo.robots = "noindex, follow";
  res.render("catalogue", {
    courses, categories, filters: { q, category, level, sort },
    seo,
  });
});

// Une page par catégorie (contenu indexable, adresse propre)
router.get("/categorie/:slug", (req, res) => {
  const categories = db.prepare("SELECT DISTINCT category FROM courses WHERE published = 1 AND archived = 0").all().map((r) => r.category);
  const category = categories.find((c) => slugify(c) === req.params.slug);
  if (!category) return res.status(404).render("error", { message: "Catégorie introuvable." });

  const courses = db.prepare(`${COURSE_SELECT} WHERE courses.published = 1 AND courses.category = ? ORDER BY courses.created_at DESC`).all(category);
  const crumbs = [{ name: "Accueil", url: "/" }, { name: "Catalogue", url: "/catalogue" }, { name: category }];
  res.render("category", {
    category, courses, crumbs,
    seo: seoPages.courseCategory(req, category, courses, crumbs),
  });
});

router.get("/cours/:slug", (req, res) => {
  const currentUserId = req.session.user ? req.session.user.id : null;
  const course = db.prepare(`${COURSE_SELECT} WHERE courses.slug = ?`).get(req.params.slug);

  if (!course) {
    // Formation renommée : l'ancienne adresse redirige définitivement vers la nouvelle
    const renamed = currentSlugFor(req.params.slug);
    if (renamed) return res.redirect(301, `/cours/${renamed}`);
    return res.status(404).render("error", { message: "Formation introuvable." });
  }
  // Un brouillon ou une formation archivée n'est visible que par son auteur et par ses étudiants
  if (lessonAccess(req.session.user, course, null).hidden) {
    return res.status(404).render("error", { message: "Formation introuvable." });
  }

  const sections = db.prepare("SELECT * FROM sections WHERE course_id = ? ORDER BY position, id").all(course.id);
  // has_quiz : le sous-chapitre porte un quiz ; type : « quiz », « video » (fichier ou lien) ou « texte » (rien d'autre que le texte)
  const lessonsStmt = db.prepare("SELECT lessons.*, EXISTS(SELECT 1 FROM quizzes WHERE quizzes.lesson_id = lessons.id) AS has_quiz FROM lessons WHERE section_id = ? ORDER BY position, id");
  let totalMinutes = 0;
  sections.forEach((section) => {
    section.lessons = lessonsStmt.all(section.id);
    section.lessons.forEach((l) => {
      l.type = l.has_quiz ? "quiz" : l.video_path || l.video_url ? "video" : "texte";
    });
    section.minutes = section.lessons.reduce((sum, l) => sum + l.duration_minutes, 0);
    totalMinutes += section.minutes;
  });

  const enrolled = currentUserId
    ? Boolean(db.prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?").get(currentUserId, course.id))
    : false;
  const inCart = Boolean((req.session.cart || {})[course.id]);
  const isOwner = currentUserId === course.instructor_id;

  // Avis : 5 d'abord, puis 5 de plus à chaque « Voir plus d'avis » (?avis=10, ?avis=15…). Une valeur invalide donne les 5 premiers.
  const REVIEW_STEP = 5;
  const asked = /^\d{1,3}$/.test(String(req.query.avis || "")) ? Number(req.query.avis) : REVIEW_STEP;
  const reviewLimit = Math.min(Math.max(asked, REVIEW_STEP), 500);
  const reviews = db
    .prepare(
      `SELECT reviews.*, users.username FROM reviews
       JOIN users ON users.id = reviews.user_id
       WHERE course_id = ? ORDER BY created_at DESC, reviews.id DESC LIMIT ?`
    )
    .all(course.id, reviewLimit);
  const myReview = currentUserId ? db.prepare("SELECT * FROM reviews WHERE course_id = ? AND user_id = ?").get(course.id, currentUserId) : null;
  const ratingCounts = Object.fromEntries(db.prepare("SELECT rating, COUNT(*) n FROM reviews WHERE course_id = ? GROUP BY rating").all(course.id).map((r) => [r.rating, r.n]));
  const ratingRows = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: ratingCounts[stars] || 0, pct: course.review_count ? Math.round(((ratingCounts[stars] || 0) / course.review_count) * 100) : 0 }));
  const moreReviewsUrl = course.review_count > reviews.length ? `/cours/${course.slug}?avis=${reviews.length + REVIEW_STEP}#avis` : null;

  // Progression de l'élève inscrit : sous-chapitres terminés (données réelles de lesson_progress)
  const completedIds = new Set(
    enrolled
      ? db
          .prepare(
            `SELECT lesson_progress.lesson_id FROM lesson_progress
             JOIN lessons ON lessons.id = lesson_progress.lesson_id
             JOIN sections ON sections.id = lessons.section_id
             WHERE sections.course_id = ? AND lesson_progress.user_id = ?`
          )
          .all(course.id, currentUserId)
          .map((r) => r.lesson_id)
      : []
  );

  // Le formateur : présentation et chiffres calculés sur toutes ses formations
  const instructor = db
    .prepare(
      `SELECT users.id, users.username, users.bio, users.avatar_path,
         (SELECT COUNT(*) FROM courses c WHERE c.instructor_id = users.id AND c.published = 1 AND c.archived = 0) AS course_count,
         (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.instructor_id = users.id) AS student_count,
         (SELECT AVG(r.rating) FROM reviews r JOIN courses c ON c.id = r.course_id WHERE c.instructor_id = users.id) AS avg_rating,
         (SELECT COUNT(*) FROM reviews r JOIN courses c ON c.id = r.course_id WHERE c.instructor_id = users.id) AS review_count
       FROM users WHERE users.id = ?`
    )
    .get(course.instructor_id);

  // Formations similaires : même catégorie d'abord (les plus suivies en tête), complétées par les plus suivies du catalogue
  const SIMILAR_MAX = 4;
  const similarBase = `${COURSE_SELECT} WHERE courses.published = 1 AND courses.archived = 0 AND courses.id != ?`;
  const similar = db.prepare(`${similarBase} AND courses.category = ? ORDER BY student_count DESC, courses.created_at DESC LIMIT ?`).all(course.id, course.category, SIMILAR_MAX);
  if (similar.length < SIMILAR_MAX) {
    const taken = [course.id, ...similar.map((c) => c.id)];
    const marks = taken.map(() => "?").join(",");
    similar.push(
      ...db
        .prepare(`${COURSE_SELECT} WHERE courses.published = 1 AND courses.archived = 0 AND courses.id NOT IN (${marks}) ORDER BY student_count DESC, courses.created_at DESC LIMIT ?`)
        .all(...taken, SIMILAR_MAX - similar.length)
    );
  }

  const texts = courseTexts(course); // ancien format (Markdown) ou texte riche : même résultat pour la vue
  const lessonCount = sections.reduce((sum, section) => sum + section.lessons.length, 0);
  const progress = { done: completedIds.size, total: lessonCount, pct: lessonCount ? Math.round((completedIds.size / lessonCount) * 100) : 0 };
  // Promesse du résumé : le sous-titre, à défaut le début de la description (texte brut)
  const promise = course.subtitle || (texts.isRich ? htmlText(course.description, 150) : plainText(course.description, 150));

  const faqs = db.prepare("SELECT * FROM faqs WHERE course_id = ? ORDER BY position, id").all(course.id);
  const description = course.seo_description || plainText(course.subtitle || (texts.isRich ? htmlText(course.description, 160) : course.description), 160) || `Formation ${course.title} sur ${SITE_NAME}.`;
  const crumbs = [
    { name: "Accueil", url: "/" },
    { name: "Catalogue", url: "/catalogue" },
    { name: course.category, url: `/categorie/${slugify(course.category)}` },
    { name: course.title },
  ];

  res.render("course-detail", {
    course, sections, totalMinutes, lessonCount, enrolled, inCart, isOwner, reviews, myReview, crumbs, faqs, texts,
    completedIds, progress, promise, instructor, similar, ratingRows, moreReviewsUrl,
    seo: seoPages.course(req, course, { description, crumbs, faqs, timeRequired: isoDuration(totalMinutes), language: cleanLanguage(course.language) }),
    objectives: texts.objectives,
    prerequisites: texts.prerequisites,
    audience: texts.audienceProfiles,
    skills: texts.skills,
    introVideo: parseVideoUrl(course.intro_video),
    isFavorite: currentUserId ? Boolean(db.prepare("SELECT 1 FROM favorites WHERE user_id = ? AND course_id = ?").get(currentUserId, course.id)) : false,
  });
});

// Chapitres et leçons d'une formation, dans l'ordre enregistré (source unique pour le plan et le PDF)
function loadProgram(courseId) {
  const sections = db.prepare("SELECT * FROM sections WHERE course_id = ? ORDER BY position, id").all(courseId);
  const lessonsStmt = db.prepare("SELECT * FROM lessons WHERE section_id = ? ORDER BY position, id");
  sections.forEach((section) => (section.lessons = lessonsStmt.all(section.id)));
  return sections;
}

// Plan du cours affiché dans la fenêtre de la fiche (fragment HTML chargé au clic).
// Mêmes droits de consultation que la fiche ; uniquement des informations descriptives (titres, ordre, durées).
router.get("/cours/:slug/plan", (req, res, next) => {
  try {
    const course = db.prepare("SELECT id, slug, title, published, archived, instructor_id FROM courses WHERE slug = ?").get(req.params.slug);
    if (!course) {
      const renamed = currentSlugFor(req.params.slug);
      if (renamed) return res.redirect(301, `/cours/${renamed}/plan`);
      return res.status(404).render("error", { message: "Formation introuvable." });
    }
    if (lessonAccess(req.session.user, course, null).hidden) return res.status(404).render("error", { message: "Formation introuvable." });

    const sections = loadProgram(course.id);
    const lessonCount = sections.reduce((n, s) => n + s.lessons.length, 0);
    const totalMinutes = sections.reduce((n, s) => n + s.lessons.reduce((m, l) => m + (l.duration_minutes || 0), 0), 0);
    // Un fragment n'a pas à être indexé : le programme complet est déjà dans la page de la formation
    res.set("X-Robots-Tag", "noindex");
    res.render("partials/course-plan", { course, sections, lessonCount, totalMinutes });
  } catch (err) {
    next(err);
  }
});

// Programme de la formation en PDF (mêmes droits de consultation que la fiche : un brouillon n'est pas public)
router.get("/cours/:slug/programme.pdf", (req, res, next) => {
  try {
    const course = db.prepare("SELECT * FROM courses WHERE slug = ?").get(req.params.slug);
    if (!course) {
      const renamed = currentSlugFor(req.params.slug);
      if (renamed) return res.redirect(301, `/cours/${renamed}/programme.pdf`);
      return res.status(404).render("error", { message: "Formation introuvable." });
    }
    if (lessonAccess(req.session.user, course, null).hidden) return res.status(404).render("error", { message: "Formation introuvable." });

    const sections = loadProgram(course.id);
    const texts = courseTexts(course);
    const plain = (items) => items.map((item) => item.text);

    const doc = buildProgramPdf({
      course, sections, siteUrl: siteBase(req), descriptionBlocks: texts.descriptionBlocks,
      lists: { objectives: plain(texts.objectives), prerequisites: plain(texts.prerequisites), audience: texts.audienceProfiles.map((p) => p.description || p.title), skills: plain(texts.skills) },
    });
    // Le slug ne contient que des lettres minuscules, chiffres et tirets : sûr dans un en-tête HTTP
    res.set({ "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="programme-${course.slug}.pdf"` });
    doc.pipe(res);
    doc.end();
  } catch (err) {
    next(err);
  }
});

router.post("/cours/:slug/avis", requireAuth, (req, res) => {
  const course = db.prepare("SELECT * FROM courses WHERE slug = ?").get(req.params.slug);
  if (!course) return res.status(404).render("error", { message: "Formation introuvable." });

  const enrolled = db.prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?").get(req.session.user.id, course.id);
  if (!enrolled) return res.status(403).render("error", { message: "Il faut avoir suivi la formation pour laisser un avis." });

  const rating = Math.min(5, Math.max(1, parseInt(req.body.rating, 10) || 5));
  const comment = (req.body.comment || "").trim();

  db.prepare(
    `INSERT INTO reviews (course_id, user_id, rating, comment) VALUES (?, ?, ?, ?)
     ON CONFLICT(course_id, user_id) DO UPDATE SET rating = excluded.rating, comment = excluded.comment, created_at = datetime('now')`
  ).run(course.id, req.session.user.id, rating, comment);

  res.redirect(`/cours/${course.slug}#avis`);
});

module.exports = router;
