const express = require("express");
const fs = require("fs");
const db = require("../config/database");
const { requireInstructor } = require("../middlewares/auth");
const lmsSites = require("../services/lmsSites");
const { upload } = require("../middlewares/upload");
const { slugify } = require("../utils/format");
const { parseVideoUrl } = require("../utils/video");
const { UserError } = require("../utils/errors");
const { duplicateCourse } = require("../services/courses");
const offers = require("../services/offers");
const categoriesSvc = require("../services/courseCategories");
const audit = require("../services/auditLog");
const { recordSlugChange } = require("../services/slugs");
const { removeUploadedFile } = require("../utils/uploads");
const { sanitizeRich, normalizeList, editorSources } = require("../utils/richText");
const { cleanLanguage } = require("../utils/format");

const seoStore = require("../seo/store");
const dashSite = require("../services/dashSite");
const siteScope = require("../services/siteScope");
const router = express.Router();
// Uniquement sous /formateur : sinon toute URL inconnue du site était redirigée vers la connexion
router.use("/formateur", requireInstructor);

function loadOwnedCourse(req, res, next) {
  const course = db.prepare("SELECT * FROM courses WHERE id = ?").get(req.params.id);
  if (!course || course.instructor_id !== req.session.user.id) {
    return res.status(404).render("error", { message: "Formation introuvable." });
  }
  if (!dashSite.guardObject(req, res, course.site_id, { notFound: "Formation introuvable." })) return;
  req.course = course;
  next();
}

function loadOwnedSection(req, res, next) {
  const section = db
    .prepare(`SELECT sections.*, courses.site_id AS course_site_id FROM sections JOIN courses ON courses.id = sections.course_id WHERE sections.id = ? AND courses.instructor_id = ?`)
    .get(req.params.sectionId, req.session.user.id);
  if (!section) return res.status(404).render("error", { message: "Chapitre introuvable." });
  if (!dashSite.guardObject(req, res, section.course_site_id, { notFound: "Chapitre introuvable." })) return;
  req.section = section;
  next();
}

function loadOwnedLesson(req, res, next) {
  const lesson = db
    .prepare(
      `SELECT lessons.*, sections.course_id, courses.site_id AS course_site_id FROM lessons
       JOIN sections ON sections.id = lessons.section_id
       JOIN courses ON courses.id = sections.course_id
       WHERE lessons.id = ? AND courses.instructor_id = ?`
    )
    .get(req.params.lessonId, req.session.user.id);
  if (!lesson) return res.status(404).render("error", { message: "Sous-chapitre introuvable." });
  if (!dashSite.guardObject(req, res, lesson.course_site_id, { notFound: "Sous-chapitre introuvable." })) return;
  req.lesson = lesson;
  next();
}

function loadOwnedQuiz(req, res, next) {
  const quiz = db
    .prepare(
      `SELECT quizzes.*, sections.course_id, courses.site_id AS course_site_id FROM quizzes
       JOIN lessons ON lessons.id = quizzes.lesson_id
       JOIN sections ON sections.id = lessons.section_id
       JOIN courses ON courses.id = sections.course_id
       WHERE quizzes.id = ? AND courses.instructor_id = ?`
    )
    .get(req.params.quizId, req.session.user.id);
  if (!quiz) return res.status(404).render("error", { message: "Quiz introuvable." });
  if (!dashSite.guardObject(req, res, quiz.course_site_id, { notFound: "Quiz introuvable." })) return;
  req.quiz = quiz;
  next();
}

// Efface du disque tous les fichiers de ces leçons : vidéos et pièces jointes
// Fichiers (vidéos, pièces jointes) de ces leçons. Relevés AVANT la suppression en base, effacés APRÈS :
// si la suppression en base échoue, aucune fiche ne pointe vers un fichier déjà effacé.
function filesOfLessons(lessonIds) {
  if (!lessonIds.length) return [];
  const marks = lessonIds.map(() => "?").join(",");
  return db.prepare(
    `SELECT video_path AS p FROM lessons WHERE id IN (${marks}) AND video_path IS NOT NULL
     UNION SELECT path FROM lesson_attachments WHERE lesson_id IN (${marks}) AND path IS NOT NULL`
  )
    .all(...lessonIds, ...lessonIds)
    .map((row) => row.p);
}

// Supprime en base (requête `remove`), puis efface les fichiers relevés avant
function deleteThenRemoveFiles(files, remove) {
  remove();
  files.filter(Boolean).forEach((file) => removeUploadedFile(file));
}

// ---------- Tableau de bord ----------

// ---------- « Mon espace » : vue d'ensemble, formations, chapitres, catégories, apparence ----------
const dashboard = require("../services/dashboard");
const coursesOf = (userId, siteId = null) => { const w = siteScope.where(siteId, "courses"); return db
  .prepare(
    `SELECT courses.*,
      (SELECT COUNT(*) FROM enrollments WHERE course_id = courses.id) AS student_count,
      (SELECT COALESCE(SUM(price_cents), 0) FROM order_items WHERE course_id = courses.id) AS revenue_cents,
      (SELECT COUNT(*) FROM order_items WHERE course_id = courses.id) AS sales_count,
      (SELECT COUNT(*) FROM sections WHERE course_id = courses.id) AS section_count,
      (SELECT COUNT(*) FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = courses.id) AS lesson_count
     FROM courses WHERE instructor_id = ?${w.sql} ORDER BY created_at DESC`
  )
  .all(userId, ...w.params); };

router.get("/formateur", (req, res) => {
  const now = new Date();
  const siteId = dashSite.siteIdOf(req);
  const courses = coursesOf(req.session.user.id, siteId);
  const ov = dashboard.overview(req.session.user.id, now, { siteId });
  const dash = res.locals.dash || {};
  const stats = dashboard.stats(req.session.user.id, now, siteId);
  // « À traiter » : uniquement ce qui attend réellement une action (compteurs réels, jamais de valeur de remplissage)
  const todo = [
    { n: dash.unread || 0, one: "message non lu", many: "messages non lus", href: "/formateur/messages", icon: "mail" },
    { n: dash.support || 0, one: "demande de support en attente de réponse", many: "demandes de support en attente de réponse", href: "/formateur/gestion/support", icon: "help" },
    { n: stats.drafts, one: "formation en brouillon", many: "formations en brouillon", href: "/formateur/formations?statut=brouillons", icon: "edit" },
    { n: dash.notifications || 0, one: "nouveauté dans le centre de gestion", many: "nouveautés dans le centre de gestion", href: "/formateur/gestion", icon: "bell" },
  ].filter((t) => t.n > 0);
  const activity = ov.activity.map((e) => ({ ...e, when: dashboard.ago(e.at, now) }));
  res.render("instructor/dashboard", { courses, visible: courses.filter((c) => !c.archived), stats, ov: { ...ov, activity }, todo });
});

const STATUS_FILTERS = { toutes: "Toutes", publiees: "Publiées", brouillons: "Brouillons", archivees: "Archivées" };
router.get("/formateur/formations", (req, res) => {
  const all = coursesOf(req.session.user.id, dashSite.siteIdOf(req));
  const statut = STATUS_FILTERS[req.query.statut] ? req.query.statut : "toutes";
  const q = String(req.query.q || "").trim();
  const match = (c) => ({ toutes: !c.archived, publiees: c.published && !c.archived, brouillons: !c.published && !c.archived, archivees: c.archived })[statut];
  const categorie = String(req.query.categorie || "").slice(0, 80);
  const pool = categorie ? all.filter((c) => c.category === categorie) : all;
  const counts = { toutes: pool.filter((c) => !c.archived).length, publiees: pool.filter((c) => c.published && !c.archived).length, brouillons: pool.filter((c) => !c.published && !c.archived).length, archivees: pool.filter((c) => c.archived).length };
  const courses = all.filter(match).filter((c) => !q || c.title.toLowerCase().includes(q.toLowerCase())).filter((c) => !categorie || c.category === categorie);
  res.render("instructor/courses", { courses, statut, q, categorie, counts, filters: STATUS_FILTERS });
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

// ---------- Offres (prix promo avec dates) : toutes les routes passent par loadOwnedCourse (propriétaire vérifié) ----------
const offersUrl = (course) => `/formateur/cours/${course.id}/offres`;
function renderOffers(req, res, { status = 200, editing = null, form = null, errors = {}, flash = null } = {}) {
  const stored = req.session.offerFlash || null; // message affiché une seule fois après une action
  delete req.session.offerFlash;
  res.status(status).render("instructor/course-hub", {
    course: req.course, tab: "offers", stats: courseStats(req.course.id), offers: offers.listOffers(req.course.id), editing,
    form: form || (editing ? offers.formOf(editing) : { active: 1 }), errors, flash: flash || stored,
  });
}
router.get("/formateur/cours/:id(\\d+)/offres", loadOwnedCourse, (req, res) => {
  const editing = req.query.modifier ? offers.getOffer(req.course.id, Number(req.query.modifier)) : null;
  renderOffers(req, res, { editing });
});
function saveOffer(req, res, current) {
  const v = offers.validateOffer(req.course, req.body || {});
  if (v.errors) {
    return renderOffers(req, res, { status: 400, editing: current, form: { ...req.body, active: req.body.active ? 1 : 0 }, errors: v.errors, flash: { type: "error", text: "L'offre n'a pas été enregistrée : corrigez les champs signalés." } });
  }
  let offerId = current ? current.id : null;
  if (current) offers.updateOffer(req.course.id, current.id, v.values);
  else offerId = offers.createOffer(req.session.user.id, req.course.id, v.values);
  audit.record(req, { action: current ? "offer.updated" : "offer.created", resourceType: "offer", resourceId: offerId, summary: `Offre « ${v.values.name} » ${current ? "modifiée" : "créée"} sur « ${req.course.title} » : ${(v.values.price_cents / 100).toFixed(2)} € (prix standard ${(req.course.price_cents / 100).toFixed(2)} €)`, details: { course_id: req.course.id, price_cents: v.values.price_cents, starts_at: v.values.starts_at, ends_at: v.values.ends_at, active: v.values.active, avant: current ? { price_cents: current.price_cents, starts_at: current.starts_at, ends_at: current.ends_at, active: current.active } : null } });
  req.session.offerFlash = { type: "ok", text: current ? "Offre modifiée." : "Offre créée." };
  res.redirect(offersUrl(req.course));
}
router.post("/formateur/cours/:id(\\d+)/offres", loadOwnedCourse, (req, res) => saveOffer(req, res, null));
function loadOffer(req, res, next) {
  req.offer = offers.getOffer(req.course.id, Number(req.params.offerId)); // limitée à CETTE formation : pas d'accès par simple changement d'identifiant
  if (!req.offer) return res.status(404).render("error", { message: "Offre introuvable." });
  next();
}
router.post("/formateur/cours/:id(\\d+)/offres/:offerId(\\d+)", loadOwnedCourse, loadOffer, (req, res) => saveOffer(req, res, req.offer));
for (const [action, active, text] of [["activer", true, "Offre activée."], ["desactiver", false, "Offre désactivée."]]) {
  router.post(`/formateur/cours/:id(\\d+)/offres/:offerId(\\d+)/${action}`, loadOwnedCourse, loadOffer, (req, res) => {
    offers.setOfferActive(req.course.id, req.offer.id, active);
    audit.record(req, { action: active ? "offer.activated" : "offer.deactivated", resourceType: "offer", resourceId: req.offer.id, summary: `Offre « ${req.offer.name} » ${active ? "activée" : "désactivée"} sur « ${req.course.title} »` });
    req.session.offerFlash = { type: "ok", text };
    res.redirect(offersUrl(req.course));
  });
}
router.post("/formateur/cours/:id(\\d+)/offres/:offerId(\\d+)/supprimer", loadOwnedCourse, loadOffer, (req, res) => {
  offers.deleteOffer(req.course.id, req.offer.id);
  audit.record(req, { action: "offer.deleted", resourceType: "offer", resourceId: req.offer.id, summary: `Offre « ${req.offer.name} » supprimée sur « ${req.course.title} »`, details: { price_cents: req.offer.price_cents } });
  req.session.offerFlash = { type: "ok", text: "Offre supprimée. Les commandes passées gardent leur prix." };
  res.redirect(offersUrl(req.course));
});

router.get("/formateur/chapitres", (req, res) => {
  res.render("instructor/chapters", { courses: coursesOf(req.session.user.id, dashSite.siteIdOf(req)) });
});

// Catégories : liste, recherche, tri, filtres (côté serveur, une seule requête groupée) ; modification = page dédiée avec les conséquences exactes
const CAT_SORTS = { nom: "Nom (A → Z)", formations: "Plus de formations", recentes: "Modifiées récemment" };
const CAT_FILTERS = { toutes: "Toutes", visibles: "Visibles au catalogue", masquees: "Non visibles", verifier: "À vérifier" };
const catUrl = (extra) => `/formateur/categories?${new URLSearchParams(extra).toString()}`; // le site est repris par la session et le champ « site » ; withSite le rend explicite dans les redirections
router.get("/formateur/categories", (req, res) => {
  const all = categoriesSvc.list(req.session.user.id, dashSite.siteIdOf(req));
  const q = String(req.query.q || "").trim().slice(0, 60);
  const sort = CAT_SORTS[req.query.tri] ? req.query.tri : "nom";
  const filter = CAT_FILTERS[req.query.filtre] ? req.query.filtre : "toutes";
  const flagged = (c) => c.sameAddress.length || c.similar.length;
  const counts = { toutes: all.length, visibles: all.filter((c) => c.visible).length, masquees: all.filter((c) => !c.visible).length, verifier: all.filter(flagged).length };
  const needle = categoriesSvc.nearKey(q), plain = q.toLowerCase();
  let rows = all.filter(({ visible }, i) => ({ toutes: true, visibles: visible > 0, masquees: visible === 0, verifier: Boolean(flagged(all[i])) })[filter]);
  if (q) rows = rows.filter((c) => c.name.toLowerCase().includes(plain) || c.slug.includes(slugify(q)) || (needle && categoriesSvc.nearKey(c.name).includes(needle)));
  if (sort === "formations") rows.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "fr"));
  else if (sort === "recentes") rows.sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)) || a.name.localeCompare(b.name, "fr"));
  res.render("instructor/categories", { rows, total: all.length, counts, q, sort, filter, sorts: CAT_SORTS, filters: CAT_FILTERS, catUrl, done: req.query.ok || null, error: req.query.erreur || null });
});
router.get("/formateur/categories/modifier", (req, res) => {
  const name = String(req.query.nom || "");
  const cat = categoriesSvc.impact(req.session.user.id, name, dashSite.siteIdOf(req));
  if (!cat) return res.redirect(`/formateur/categories?erreur=${encodeURIComponent("Cette catégorie n'existe plus parmi vos formations.")}`);
  res.render("instructor/category-edit", { cat, to: String(req.query.vers || cat.name).slice(0, 80), mergeWith: req.query.fusion ? String(req.query.fusion) : null, error: req.query.erreur || null, max: categoriesSvc.MAX });
});
router.post("/formateur/categories/renommer", (req, res) => {
  const from = String(req.body.from || "");
  const to = String(req.body.to || "");
  const back = (extra) => `/formateur/categories/modifier?${new URLSearchParams({ nom: from, vers: to.slice(0, 80), ...extra }).toString()}`;
  const r = categoriesSvc.rename(req, from, to, { merge: req.body.merge === "1" });
  if (r.needsMerge) return res.redirect(back({ fusion: r.target }));
  if (!r.ok) return res.redirect(back({ erreur: r.error }));
  const n = `${r.moved} formation${r.moved > 1 ? "s" : ""}`;
  const text = r.merged ? `« ${r.from} » fusionnée dans « ${r.name} » (${n}).` : `« ${r.from} » renommée en « ${r.name} » (${n}).`;
  res.redirect(catUrl({ ok: text + (r.redirected ? " L'ancienne adresse publique redirige vers la nouvelle." : "") }));
});

router.get("/formateur/apparence", (req, res) => {
  res.render("instructor/appearance", { prefs: dashboard.prefsOf(req.session.user.id), themes: dashboard.THEMES });
});
router.post("/formateur/apparence", express.json({ limit: "4kb" }), (req, res) => {
  res.json({ ok: true, prefs: dashboard.savePrefs(req.session.user.id, req.body || {}) });
});

// ---------- Formation : création / édition ----------

router.get("/formateur/cours/nouveau", (req, res) => {
  res.render("instructor/course-form", { categoryChoices: categoriesSvc.choices(req.session.user.id, (req.course && req.course.category) || "", dashSite.siteIdOf(req)), course: null, error: null, sources: editorSources(null) });
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

// Catégorie choisie dans le formulaire : une existante, ou « Nouvelle catégorie… » (category_new). Champ absent = la catégorie actuelle est conservée
const NEW_CATEGORY = "__nouvelle";
const pickCategory = (userId, body, current, siteId = null) => body.category === undefined && current ? current : categoriesSvc.canonical(userId, body.category === NEW_CATEGORY ? body.category_new : body.category, siteId);
router.post("/formateur/cours/nouveau", upload.single("thumbnail"), (req, res) => {
  if (!dashSite.bodySiteMatches(req, res)) return;
  const { title, subtitle, category, level, price } = req.body;
  const lists = courseListFields(req.body);
  const texts = courseTextFields(req.body, null);
  if (!title || !title.trim()) {
    return res.status(400).render("instructor/course-form", { categoryChoices: categoriesSvc.choices(req.session.user.id, (req.course && req.course.category) || "", dashSite.siteIdOf(req)), course: { ...req.body, ...texts }, error: "Le titre est obligatoire.", sources: editorSources({ ...req.body, ...texts }) });
  }

  const baseSlug = slugify(title) || "formation";
  let slug = baseSlug;
  let suffix = 1;
  while (db.prepare("SELECT id FROM courses WHERE slug = ?").get(slug)) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const priceCents = Math.max(0, Math.round(parseFloat(String(price || "0").replace(",", ".")) * 100)) || 0; // « 39,90 » (virgule française) = 39,90 €
  const thumbnailPath = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;

  const info = db
    .prepare(
      `INSERT INTO courses (instructor_id, title, slug, subtitle, description, objectives, prerequisites, target_audience, skills, rich_text, intro_video, seo_title, seo_description, category, level, price_cents, thumbnail_path, language, site_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.session.user.id, title.trim(), slug, subtitle || "", texts.description,
      texts.objectives, texts.prerequisites, texts.target_audience, texts.skills, texts.rich_text, lists.intro_video, lists.seo_title, lists.seo_description,
      pickCategory(req.session.user.id, req.body, null, dashSite.siteIdOf(req)), level || "debutant", priceCents, thumbnailPath, cleanLanguage(req.body.language), dashSite.siteIdOf(req)
    );

  audit.record(req, { action: "course.created", resourceType: "course", resourceId: info.lastInsertRowid, summary: `Formation « ${title.trim()} » créée (prix ${(priceCents / 100).toFixed(2)} €)`, details: { price_cents: priceCents } });
  res.redirect(`/formateur/cours/${info.lastInsertRowid}/curriculum`);
});

// Site de la formation (Titan XXIII) : la rattacher à un site dont le module « Formations » est activé. Réservé au compte créateur (équipe), le site vient du serveur (liste des sites de l'organisation), jamais d'un identifiant libre.
router.post("/formateur/cours/:id/site", loadOwnedCourse, (req, res) => {
  const marketing = req.app.locals.marketing;
  const siteId = Number(req.body.site_id);
  try {
    if (!marketing || !marketing.ready) throw new Error("Le gestionnaire de sites n'est pas disponible.");
    lmsSites.assignCourse({ db, organizationId: marketing.organizationId, userId: null }, req.course.id, siteId);
    return res.redirect(`/formateur/cours/${req.course.id}/modifier?enregistre=site`);
  } catch (error) {
    return res.status(error.code ? 400 : 500).render("error", { message: error.code ? error.message : "Rattachement impossible pour le moment." });
  }
});

router.get("/formateur/cours/:id/modifier", loadOwnedCourse, (req, res) => {
  const marketing = req.app.locals.marketing;
  const owner = lmsSites.siteOfCourse(db, req.course.id);
  const choices = marketing && marketing.ready ? lmsSites.siteChoices(db, marketing.organizationId) : [];
  const siteInfo = { currentId: owner, currentName: owner ? (choices.find((c) => c.id === owner) || db.prepare("SELECT name FROM mk_sites WHERE id = ?").get(owner) || {}).name || "Site" : null, choices: owner === null ? choices : [] };
  res.render("instructor/course-form", { siteInfo, categoryChoices: categoriesSvc.choices(req.session.user.id, (req.course && req.course.category) || "", dashSite.siteIdOf(req)), course: req.course, error: null, saved: req.query.enregistre === "1", sources: editorSources(req.course) });
});

router.post("/formateur/cours/:id/modifier", loadOwnedCourse, upload.single("thumbnail"), (req, res) => {
  const { title, subtitle, category, level, price } = req.body;
  const lists = courseListFields(req.body);
  const texts = courseTextFields(req.body, req.course);
  if (!title || !title.trim()) {
    return res.status(400).render("instructor/course-form", { categoryChoices: categoriesSvc.choices(req.session.user.id, (req.course && req.course.category) || "", dashSite.siteIdOf(req)), course: { ...req.course, ...req.body, ...texts }, error: "Le titre est obligatoire.", sources: editorSources({ ...req.course, ...req.body, ...texts }) });
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

  const priceCents = Math.max(0, Math.round(parseFloat(String(price || "0").replace(",", ".")) * 100)) || 0; // « 39,90 » (virgule française) = 39,90 €
  let thumbnailPath = req.course.thumbnail_path;
  if (req.file) {
    removeUploadedFile(thumbnailPath);
    thumbnailPath = `/uploads/thumbnails/${req.file.filename}`;
  }

  const newCategory = pickCategory(req.course.instructor_id, req.body, req.course.category, req.course.site_id === undefined ? null : req.course.site_id);
  db.prepare(
    `UPDATE courses SET title = ?, slug = ?, subtitle = ?, description = ?, objectives = ?, prerequisites = ?, target_audience = ?, skills = ?, rich_text = ?, intro_video = ?,
       seo_title = ?, seo_description = ?, category = ?, level = ?, price_cents = ?, thumbnail_path = ?, language = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    title.trim(), newSlug, subtitle || "", texts.description,
    texts.objectives, texts.prerequisites, texts.target_audience, texts.skills, texts.rich_text, lists.intro_video, lists.seo_title, lists.seo_description,
    newCategory, level || "debutant", priceCents, thumbnailPath, cleanLanguage(req.body.language), req.course.id
  );
  recordSlugChange(req.course.id, req.course.slug, newSlug);
  // Journal d'activité : champs modifiés (avant → après) ; un changement de PRIX a sa propre entrée
  const changes = {};
  for (const [field, now] of Object.entries({ title: title.trim(), slug: newSlug, category: newCategory, level: level || "debutant", language: cleanLanguage(req.body.language) })) {
    if ((req.course[field] ?? null) !== now) changes[field] = { avant: req.course[field] ?? null, apres: now };
  }
  if (req.course.price_cents !== priceCents) {
    audit.record(req, { action: "course.price_changed", resourceType: "course", resourceId: req.course.id, summary: `Prix de « ${title.trim()} » : ${(req.course.price_cents / 100).toFixed(2)} € → ${(priceCents / 100).toFixed(2)} €`, details: { avant_cents: req.course.price_cents, apres_cents: priceCents } });
  }
  if (Object.keys(changes).length) audit.record(req, { action: "course.updated", resourceType: "course", resourceId: req.course.id, summary: `Formation « ${title.trim()} » modifiée (${Object.keys(changes).join(", ")})`, details: changes });
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
  if (nextState !== (req.course.published ? 1 : 0)) {
    audit.record(req, { action: nextState ? "course.published" : "course.unpublished", resourceType: "course", resourceId: req.course.id, summary: `Formation « ${req.course.title} » ${nextState ? "publiée" : "dépubliée"}` });
  }
  res.redirect(`/formateur/cours/${req.course.id}/curriculum`);
});

// Dupliquer : copie complète (informations, chapitres, leçons, quiz, pièces jointes, fichiers recopiés),
// en brouillon. Les ventes, inscriptions et avis ne sont jamais copiés.
router.post("/formateur/cours/:id/dupliquer", loadOwnedCourse, (req, res) => {
  const newId = duplicateCourse(req.course.id);
  audit.record(req, { action: "course.duplicated", resourceType: "course", resourceId: newId, summary: `Formation « ${req.course.title} » dupliquée`, details: { source: req.course.id } });
  res.redirect(`/formateur/cours/${newId}/modifier`);
});

// Archiver : la formation quitte le catalogue et ne peut plus être achetée, mais ses étudiants
// gardent leur accès et son historique de ventes est conservé (contrairement à la suppression).
router.post("/formateur/cours/:id/archiver", loadOwnedCourse, (req, res) => {
  db.prepare("UPDATE courses SET published = 0, archived = 1, updated_at = datetime('now') WHERE id = ?").run(req.course.id);
  audit.record(req, { action: "course.archived", resourceType: "course", resourceId: req.course.id, summary: `Formation « ${req.course.title} » archivée` });
  res.redirect("/formateur");
});

// Restaurer : la formation revient en brouillon, jamais publiée d'office
router.post("/formateur/cours/:id/restaurer", loadOwnedCourse, (req, res) => {
  db.prepare("UPDATE courses SET archived = 0, published = 0, updated_at = datetime('now') WHERE id = ?").run(req.course.id);
  audit.record(req, { action: "course.restored", resourceType: "course", resourceId: req.course.id, summary: `Formation « ${req.course.title} » restaurée (en brouillon)` });
  res.redirect("/formateur");
});

router.post("/formateur/cours/:id/supprimer", loadOwnedCourse, (req, res) => {
  // Supprimer une formation déjà vendue effacerait (en cascade) l'accès de ses étudiants ET
  // l'historique des ventes. On la refuse : il faut la dépublier, elle quitte alors le catalogue.
  const sales = db.prepare("SELECT (SELECT COUNT(*) FROM enrollments WHERE course_id = ?) + (SELECT COUNT(*) FROM order_items WHERE course_id = ?) AS n").get(req.course.id, req.course.id).n;
  if (sales > 0) {
    audit.record(req, { action: "course.deleted", resourceType: "course", resourceId: req.course.id, summary: `Suppression refusée : « ${req.course.title} » a déjà été achetée`, result: "refused" });
    return res.status(409).render("error", {
      message: "Cette formation a déjà été achetée : la supprimer effacerait l'accès de vos étudiants et votre historique de ventes. Dépubliez-la plutôt : elle disparaît du catalogue et ses étudiants gardent leur accès.",
    });
  }

  const lessonIds = db
    .prepare("SELECT lessons.id FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = ?")
    .all(req.course.id)
    .map((l) => l.id);
  deleteThenRemoveFiles([req.course.thumbnail_path, ...filesOfLessons(lessonIds)], () => db.prepare("DELETE FROM courses WHERE id = ?").run(req.course.id));
  audit.record(req, { action: "course.deleted", resourceType: "course", resourceId: req.course.id, summary: `Formation « ${req.course.title} » supprimée`, details: { price_cents: req.course.price_cents } });
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

// ---- Structure du programme : titres, ordre et déplacements ----
// Les écrans enrichis (public/js/curriculum.js) appellent ces routes en JSON et mettent la page à jour sans la recharger ;
// sans JavaScript, les mêmes routes répondent par une redirection vers le programme.
const TITLE_MAX = 120;
const wantsJson = (req) => req.is("application/json") || /json/.test(req.get("accept") || "");
// Titre saisi : espaces normalisés, caractères de contrôle retirés, borné à TITLE_MAX caractères. Vide = refusé.
function cleanTitle(value) {
  const sep = String.fromCharCode(0x2028, 0x2029);
  return Array.from(String(value == null ? "" : value)).map((c) => (c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 || sep.includes(c) ? " " : c)).join("").replace(/\s+/g, " ").trim().slice(0, TITLE_MAX);
}
const curriculumUrl = (courseId, lessonId) => `/formateur/cours/${courseId}/curriculum${lessonId ? `?lecon=${lessonId}` : ""}`;
function fail(req, res, courseId, status, message) {
  if (wantsJson(req)) return res.status(status).json({ ok: false, error: message });
  throw new UserError(message);
}
const sectionIdsOf = (courseId) => db.prepare("SELECT id FROM sections WHERE course_id = ? ORDER BY position, id").all(courseId).map((r) => r.id);
// Liste d'identifiants entiers positifs, sans doublon
function idList(value) {
  if (!Array.isArray(value)) return null;
  const ids = value.map((v) => Number(v));
  if (ids.some((n) => !Number.isInteger(n) || n <= 0) || new Set(ids).size !== ids.length) return null;
  return ids;
}
// Tout ou rien : un ordre à moitié écrit (doublons de position, chapitre perdu) n'est jamais laissé en base.
function atomically(work) {
  return (...args) => {
    db.exec("BEGIN IMMEDIATE");
    try { const out = work(...args); db.exec("COMMIT"); return out; } catch (e) { db.exec("ROLLBACK"); throw e; }
  };
}
const writeSectionOrder = atomically((courseId, ids) => {
  const update = db.prepare("UPDATE sections SET position = ? WHERE id = ? AND course_id = ?");
  ids.forEach((id, index) => update.run(index, id, courseId));
});
// Place les leçons `ids` (dans cet ordre) à la fin de la liste d'un chapitre ; renumérote les chapitres d'origine.
const writeLessonOrder = atomically((courseId, sectionId, ids) => {
  const sources = new Set(db.prepare(`SELECT DISTINCT section_id FROM lessons WHERE id IN (${ids.map(() => "?").join(",") || "NULL"})`).all(...ids).map((r) => r.section_id));
  const update = db.prepare("UPDATE lessons SET section_id = ?, position = ? WHERE id = ?");
  ids.forEach((id, index) => update.run(sectionId, index, id));
  sources.delete(sectionId);
  const renumber = db.prepare("UPDATE lessons SET position = ? WHERE id = ?");
  for (const src of sources) db.prepare("SELECT id FROM lessons WHERE section_id = ? ORDER BY position, id").all(src).forEach((l, i) => renumber.run(i, l.id));
});
const lessonsOf = (sectionId) => db.prepare("SELECT id FROM lessons WHERE section_id = ? ORDER BY position, id").all(sectionId).map((l) => l.id);

router.post("/formateur/cours/:id/sections", loadOwnedCourse, (req, res) => {
  const title = cleanTitle(req.body.title);
  if (!title) return fail(req, res, req.course.id, 400, "Le titre du chapitre est obligatoire.");
  const maxPos = db.prepare("SELECT COALESCE(MAX(position), -1) m FROM sections WHERE course_id = ?").get(req.course.id).m;
  const info = db.prepare("INSERT INTO sections (course_id, title, position) VALUES (?, ?, ?)").run(req.course.id, title, maxPos + 1);
  if (wantsJson(req)) return res.status(201).json({ ok: true, id: Number(info.lastInsertRowid), title });
  res.redirect(curriculumUrl(req.course.id));
});

router.post("/formateur/cours/:id/sections/reorder", loadOwnedCourse, (req, res) => {
  const ids = idList(req.body.order);
  const current = sectionIdsOf(req.course.id);
  // L'ordre doit désigner exactement les chapitres de cette formation : un chapitre manquant, en trop ou étranger est refusé
  if (!ids || ids.length !== current.length || !ids.every((id) => current.includes(id))) {
    return fail(req, res, req.course.id, 400, "Ordre refusé : la liste des chapitres ne correspond pas à la formation. Rechargez la page.");
  }
  writeSectionOrder(req.course.id, ids);
  res.json({ ok: true });
});

router.post("/formateur/sections/:sectionId/renommer", loadOwnedSection, (req, res) => {
  const title = cleanTitle(req.body.title);
  if (!title) return fail(req, res, req.section.course_id, 400, "Le titre du chapitre est obligatoire.");
  db.prepare("UPDATE sections SET title = ? WHERE id = ?").run(title, req.section.id);
  if (wantsJson(req)) return res.json({ ok: true, title });
  res.redirect(curriculumUrl(req.section.course_id));
});

// Monte ou descend un chapitre d'un rang (alternative au glisser-déposer : clavier, lecteur d'écran, écran tactile)
router.post("/formateur/sections/:sectionId/deplacer", loadOwnedSection, (req, res) => {
  const dir = req.body.direction === "haut" ? -1 : req.body.direction === "bas" ? 1 : 0;
  if (!dir) return fail(req, res, req.section.course_id, 400, "Direction inconnue.");
  const ids = sectionIdsOf(req.section.course_id);
  const from = ids.indexOf(req.section.id);
  const to = from + dir;
  if (to >= 0 && to < ids.length) {
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    writeSectionOrder(req.section.course_id, ids);
  }
  if (wantsJson(req)) return res.json({ ok: true, order: ids });
  res.redirect(curriculumUrl(req.section.course_id));
});

router.post("/formateur/sections/:sectionId/supprimer", loadOwnedSection, (req, res) => {
  const files = filesOfLessons(db.prepare("SELECT id FROM lessons WHERE section_id = ?").all(req.section.id).map((l) => l.id));
  deleteThenRemoveFiles(files, () => db.prepare("DELETE FROM sections WHERE id = ?").run(req.section.id));
  writeSectionOrder(req.section.course_id, sectionIdsOf(req.section.course_id));
  if (wantsJson(req)) return res.json({ ok: true });
  res.redirect(curriculumUrl(req.section.course_id));
});

router.post("/formateur/sections/:sectionId/lecons", loadOwnedSection, (req, res) => {
  const title = cleanTitle(req.body.title);
  if (!title) return fail(req, res, req.section.course_id, 400, "Le titre du sous-chapitre est obligatoire.");
  const maxPos = db.prepare("SELECT COALESCE(MAX(position), -1) m FROM lessons WHERE section_id = ?").get(req.section.id).m;
  const info = db.prepare(`INSERT INTO lessons (section_id, title, position) VALUES (?, ?, ?)`).run(req.section.id, title, maxPos + 1);
  res.redirect(curriculumUrl(req.section.course_id, info.lastInsertRowid));
});

// Ordre des sous-chapitres d'un chapitre. Un sous-chapitre d'un AUTRE chapitre de la même formation peut y être déposé ;
// un identifiant étranger à la formation est refusé (aucune modification).
router.post("/formateur/sections/:sectionId/lecons/reorder", loadOwnedSection, (req, res) => {
  const ids = idList(req.body.order);
  if (!ids) return fail(req, res, req.section.course_id, 400, "Ordre refusé : liste de sous-chapitres invalide.");
  const inCourse = new Set(db.prepare("SELECT lessons.id FROM lessons JOIN sections ON sections.id = lessons.section_id WHERE sections.course_id = ?").all(req.section.course_id).map((r) => r.id));
  if (!ids.every((id) => inCourse.has(id))) return fail(req, res, req.section.course_id, 400, "Ordre refusé : un sous-chapitre n'appartient pas à cette formation.");
  // Les sous-chapitres déjà présents mais absents de la liste restent à la suite (rien n'est perdu)
  const rest = lessonsOf(req.section.id).filter((id) => !ids.includes(id));
  writeLessonOrder(req.section.course_id, req.section.id, [...ids, ...rest]);
  res.json({ ok: true });
});

// Monte ou descend un sous-chapitre dans son chapitre ; passe au chapitre voisin en bout de liste
router.post("/formateur/lecons/:lessonId/deplacer", loadOwnedLesson, (req, res) => {
  const dir = req.body.direction === "haut" ? -1 : req.body.direction === "bas" ? 1 : 0;
  if (!dir) return fail(req, res, req.lesson.course_id, 400, "Direction inconnue.");
  const sections = sectionIdsOf(req.lesson.course_id);
  const si = sections.indexOf(req.lesson.section_id);
  const list = lessonsOf(req.lesson.section_id);
  const at = list.indexOf(req.lesson.id);
  if (at + dir >= 0 && at + dir < list.length) {
    list.splice(at + dir, 0, list.splice(at, 1)[0]);
    writeLessonOrder(req.lesson.course_id, req.lesson.section_id, list);
  } else if (sections[si + dir] !== undefined) {
    const target = sections[si + dir];
    const targetList = lessonsOf(target);
    if (dir < 0) targetList.push(req.lesson.id); else targetList.unshift(req.lesson.id);
    writeLessonOrder(req.lesson.course_id, target, targetList);
  }
  if (wantsJson(req)) return res.json({ ok: true });
  res.redirect(curriculumUrl(req.lesson.course_id, req.lesson.id));
});

router.post(
  "/formateur/lecons/:lessonId/modifier",
  loadOwnedLesson,
  upload.fields([{ name: "video", maxCount: 1 }]),
  (req, res) => {
    const { description, duration_minutes, video_url } = req.body;
    const title = cleanTitle(req.body.title);
    if (!title) {
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
    ).run(title, description || "", parseInt(duration_minutes, 10) || 0, req.body.is_preview ? 1 : 0, videoPath, videoUrl, req.lesson.id);

    // Changement de chapitre (liste « Chapitre » de l'éditeur) : le sous-chapitre passe à la fin du chapitre choisi, s'il appartient à la même formation
    const targetSection = parseInt(req.body.section_id, 10);
    if (targetSection && targetSection !== req.lesson.section_id && sectionIdsOf(req.lesson.course_id).includes(targetSection)) {
      writeLessonOrder(req.lesson.course_id, targetSection, [...lessonsOf(targetSection), req.lesson.id]);
    }

    res.redirect(`/formateur/cours/${req.lesson.course_id}/curriculum?lecon=${req.lesson.id}&enregistre=1`);
  }
);

router.post("/formateur/lecons/:lessonId/supprimer", loadOwnedLesson, (req, res) => {
  deleteThenRemoveFiles(filesOfLessons([req.lesson.id]), () => db.prepare("DELETE FROM lessons WHERE id = ?").run(req.lesson.id));
  res.redirect(`/formateur/cours/${req.lesson.course_id}/curriculum`);
});

// ---------- Pièces jointes (fichiers et liens) ----------

function loadOwnedAttachment(req, res, next) {
  const attachment = db
    .prepare(
      `SELECT a.*, sections.course_id, courses.site_id AS course_site_id FROM lesson_attachments a
       JOIN lessons ON lessons.id = a.lesson_id
       JOIN sections ON sections.id = lessons.section_id
       JOIN courses ON courses.id = sections.course_id
       WHERE a.id = ? AND courses.instructor_id = ?`
    )
    .get(req.params.attachmentId, req.session.user.id);
  if (!attachment) return res.status(404).render("error", { message: "Pièce jointe introuvable." });
  if (!dashSite.guardObject(req, res, attachment.course_site_id, { notFound: "Pièce jointe introuvable." })) return;
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
  deleteThenRemoveFiles([req.attachment.path], () => db.prepare("DELETE FROM lesson_attachments WHERE id = ?").run(req.attachment.id));
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
  // Tentatives maximales : entier de 1 à 100, vide = illimité (une valeur invalide ne bloque jamais les élèves : illimité)
  const rawMax = String(req.body.max_attempts || "").trim();
  const maxAttempts = /^\d{1,3}$/.test(rawMax) && Number(rawMax) >= 1 && Number(rawMax) <= 100 ? Number(rawMax) : null;
  db.prepare("UPDATE quizzes SET title = ?, pass_percentage = ?, max_attempts = ? WHERE id = ?").run(req.body.title || "Quiz", pass, maxAttempts, req.quiz.id);
  if (pass !== req.quiz.pass_percentage || maxAttempts !== (req.quiz.max_attempts ?? null)) {
    audit.record(req, { action: "quiz.updated", resourceType: "quiz", resourceId: req.quiz.id, summary: `Réglages du quiz « ${req.body.title || "Quiz"} » modifiés (seuil ${pass} %, tentatives ${maxAttempts ?? "illimitées"})`, details: { avant: { pass_percentage: req.quiz.pass_percentage, max_attempts: req.quiz.max_attempts ?? null }, apres: { pass_percentage: pass, max_attempts: maxAttempts } } });
  }
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
      `SELECT quiz_questions.*, quizzes.lesson_id, sections.course_id, courses.site_id AS course_site_id FROM quiz_questions
       JOIN quizzes ON quizzes.id = quiz_questions.quiz_id
       JOIN lessons ON lessons.id = quizzes.lesson_id
       JOIN sections ON sections.id = lessons.section_id
       JOIN courses ON courses.id = sections.course_id
       WHERE quiz_questions.id = ? AND courses.instructor_id = ?`
    )
    .get(req.params.questionId, req.session.user.id);
  if (!question) return res.status(404).render("error", { message: "Question introuvable." });
  if (!dashSite.guardObject(req, res, question.course_site_id, { notFound: "Question introuvable." })) return;

  db.prepare("DELETE FROM quiz_questions WHERE id = ?").run(question.id);
  res.redirect(`/formateur/cours/${question.course_id}/curriculum?lecon=${question.lesson_id}`);
});

module.exports = router;
