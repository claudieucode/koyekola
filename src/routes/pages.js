// Pages du site géré par le formateur : À propos, FAQ (générale et par formation), Contact + boîte de réception.
const express = require("express");
const db = require("../config/database");
const { requireInstructor } = require("../middlewares/auth");
const { createRateLimiter } = require("../middlewares/security");
const { sendContactNotification, sendContactAcknowledgement } = require("../utils/mailer");
const { UserError } = require("../utils/errors");
const seoPages = require("../seo/pages");

const router = express.Router();

// Tout l'espace d'administration de ces pages est réservé au formateur
router.use("/formateur", requireInstructor);

// ---------- À propos ----------

const DEFAULT_ABOUT = `KOLAKISA est une plateforme de formation en ligne : des cours vidéo à suivre à votre rythme, avec des quiz, des ressources à télécharger et un certificat de réussite.

## Notre approche

- Des formations concrètes, construites pour être appliquées tout de suite.
- Un accès illimité à chaque formation achetée, sur ordinateur, tablette et mobile.
- Votre progression est enregistrée : vous reprenez exactement là où vous vous étiez arrêté.`;

const ABOUT_DESCRIPTION = "Découvrez KOLAKISA, la plateforme de formation en ligne : nos formations vidéo, notre approche et la personne qui les conçoit.";

function loadAbout() {
  const row = db.prepare("SELECT * FROM site_pages WHERE slug = 'a-propos'").get();
  return { content: row && row.content.trim() ? row.content : DEFAULT_ABOUT, custom: Boolean(row && row.content.trim()), description: (row && row.seo_description) || "", raw: row ? row.content : "" };
}

router.get("/a-propos", (req, res) => {
  const about = loadAbout();
  const creator = db.prepare("SELECT username, bio FROM users WHERE role = 'formateur' ORDER BY id LIMIT 1").get();
  const crumbs = [{ name: "Accueil", url: "/" }, { name: "À propos" }];
  // Modèle de thème « Page du site » (Page Builder, Apparence → Templates) : remplace le texte de la page ; sans modèle en ligne, rien ne change
  let contentHtml = "";
  try { contentHtml = require("../utils/markdown").renderMarkdown(about.content); } catch { contentHtml = ""; }
  require("../marketing/web/themeRender").renderRegion(req, res, db, "static_page", { scope: { post: { title: "À propos", url: "/a-propos", excerpt: about.description || "", image: "", date: null, category: "", author: "", minutes: null, contentHtml } } }, (themeTemplate) => {
    res.render("pages/about", {
      about, creator, crumbs, themeTemplate,
      seo: seoPages.staticPage(req, "a-propos", { title: "À propos", description: about.description || ABOUT_DESCRIPTION, type: "AboutPage", crumbs }),
    });
  });
});

// Seule la page « à propos » est modifiable (la liste est fermée : aucune page ne se crée par l'adresse)
const EDITABLE_PAGES = { "a-propos": "À propos" };

router.get("/formateur/pages/:slug", (req, res) => {
  if (!EDITABLE_PAGES[req.params.slug]) return res.status(404).render("error", { message: "Page introuvable." });
  const about = loadAbout();
  res.render("instructor/page-form", { title: EDITABLE_PAGES[req.params.slug], slug: req.params.slug, content: about.raw, description: about.description, saved: req.query.enregistre === "1" });
});

router.post("/formateur/pages/:slug", (req, res) => {
  if (!EDITABLE_PAGES[req.params.slug]) return res.status(404).render("error", { message: "Page introuvable." });
  const content = String(req.body.content || "").slice(0, 20000);
  const description = String(req.body.seo_description || "").trim().slice(0, 160);
  db.prepare(
    `INSERT INTO site_pages (slug, title, content, seo_description, updated_at) VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(slug) DO UPDATE SET content = excluded.content, seo_description = excluded.seo_description, updated_at = excluded.updated_at`
  ).run(req.params.slug, EDITABLE_PAGES[req.params.slug], content, description || null);
  res.redirect(`/formateur/pages/${req.params.slug}?enregistre=1`);
});

// ---------- FAQ ----------

const listFaqs = (courseId) =>
  courseId
    ? db.prepare("SELECT * FROM faqs WHERE course_id = ? ORDER BY position, id").all(courseId)
    : db.prepare("SELECT * FROM faqs WHERE course_id IS NULL ORDER BY position, id").all();

// Cookies et mesure d'audience : ce qui est mesuré, avec ou sans accord, et comment changer d'avis
router.get("/cookies", (req, res) => {
  res.render("pages/cookies", { crumbs: [{ name: "Accueil", url: "/" }, { name: "Cookies" }] });
});

router.get("/faq", (req, res) => {
  const faqs = listFaqs(null);
  const crumbs = [{ name: "Accueil", url: "/" }, { name: "Questions fréquentes" }];
  res.render("pages/faq", {
    faqs, crumbs,
    seo: seoPages.faqPage(req, faqs, crumbs),
  });
});

function loadCourseOr404(req, res, courseId) {
  // Toutes les colonnes : l'en-tête commun des pages d'une formation (_course-head) affiche son statut, sa miniature et son lien public
  const course = db.prepare("SELECT * FROM courses WHERE id = ? AND instructor_id = ?").get(Number(courseId), req.session.user.id);
  if (!course) res.status(404).render("error", { message: "Formation introuvable." });
  return course;
}

router.get("/formateur/faq", (req, res) => {
  res.render("instructor/faq-admin", { faqs: listFaqs(null), course: null });
});

router.get("/formateur/cours/:id/faq", (req, res) => {
  const course = loadCourseOr404(req, res, req.params.id);
  if (!course) return;
  res.render("instructor/faq-admin", { faqs: listFaqs(course.id), course });
});

router.post("/formateur/faq/ajouter", (req, res) => {
  const question = String(req.body.question || "").trim();
  const answer = String(req.body.answer || "").trim();
  if (!question || question.length > 300) throw new UserError("La question est obligatoire (300 caractères au plus).");
  if (!answer || answer.length > 5000) throw new UserError("La réponse est obligatoire (5 000 caractères au plus).");

  let courseId = null;
  if (String(req.body.course_id || "").trim()) {
    const course = loadCourseOr404(req, res, req.body.course_id);
    if (!course) return;
    courseId = course.id;
  }
  const next = courseId
    ? db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS n FROM faqs WHERE course_id = ?").get(courseId).n
    : db.prepare("SELECT COALESCE(MAX(position), -1) + 1 AS n FROM faqs WHERE course_id IS NULL").get().n;
  db.prepare("INSERT INTO faqs (course_id, question, answer, position) VALUES (?, ?, ?, ?)").run(courseId, question, answer, next);
  res.redirect(courseId ? `/formateur/cours/${courseId}/faq` : "/formateur/faq");
});

router.post("/formateur/faq/:id/supprimer", (req, res) => {
  const faq = db.prepare("SELECT * FROM faqs WHERE id = ?").get(Number(req.params.id));
  if (!faq) return res.status(404).render("error", { message: "Question introuvable." });
  db.prepare("DELETE FROM faqs WHERE id = ?").run(faq.id);
  res.redirect(faq.course_id ? `/formateur/cours/${faq.course_id}/faq` : "/formateur/faq");
});

// ---------- Contact ----------

// 5 messages acceptés par heure et par adresse IP
const contactLimiter = createRateLimiter(5, 60 * 60 * 1000);
const oneLine = (value, max) => String(value || "").replace(/[\r\n\u2028\u2029]+/g, " ").trim().slice(0, max);
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;

function renderContact(req, res, { status = 200, error = null, values = {} } = {}) {
  const crumbs = [{ name: "Accueil", url: "/" }, { name: "Contact" }];
  res.status(status).render("pages/contact", {
    error, values, sent: req.query.envoye === "1", crumbs,
    seo: seoPages.staticPage(req, "contact", { title: "Contact", description: "Une question sur une formation ? Écrivez-nous : nous répondons à chaque message.", type: "ContactPage", crumbs }),
  });
}

router.get("/contact", (req, res) => renderContact(req, res));

router.post("/contact", async (req, res, next) => {
  try {
    // Champ piège : invisible pour un visiteur, rempli par les robots. On fait comme si tout s'était bien passé.
    if (String(req.body.website || "").trim()) return res.redirect("/contact?envoye=1");

    const values = { name: oneLine(req.body.name, 100), email: oneLine(req.body.email, 200), subject: oneLine(req.body.subject, 150), message: String(req.body.message || "").trim() };
    if (contactLimiter.isLimited(req.ip)) {
      return renderContact(req, res, { status: 429, values, error: "Trop de messages envoyés depuis votre connexion. Réessayez dans une heure." });
    }
    if (!values.name) return renderContact(req, res, { status: 400, values, error: "Indiquez votre nom." });
    if (!EMAIL.test(values.email)) return renderContact(req, res, { status: 400, values, error: "Cette adresse e-mail n'est pas valide." });
    if (values.message.length < 10 || values.message.length > 5000) {
      return renderContact(req, res, { status: 400, values, error: "Votre message doit contenir entre 10 et 5 000 caractères." });
    }

    db.prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)").run(values.name, values.email, values.subject, values.message);
    contactLimiter.hit(req.ip);

    // E-mails mis en file (envoyés en arrière-plan, réessayés en cas d'échec) : le formateur est prévenu, la personne
    // reçoit un accusé de réception. Le message est de toute façon conservé dans « Mon espace ».
    sendContactNotification(db, values);
    sendContactAcknowledgement(db, values);
    res.redirect("/contact?envoye=1");
  } catch (err) {
    next(err);
  }
});

// ---------- Boîte de réception ----------

router.get("/formateur/messages", (req, res) => {
  const messages = db.prepare("SELECT * FROM contact_messages ORDER BY (read_at IS NOT NULL), created_at DESC, id DESC LIMIT 200").all();
  res.render("instructor/messages", { messages });
});

router.post("/formateur/messages/:id/lu", (req, res) => {
  db.prepare("UPDATE contact_messages SET read_at = COALESCE(read_at, datetime('now')) WHERE id = ?").run(Number(req.params.id));
  res.redirect("/formateur/messages");
});

router.post("/formateur/messages/:id/supprimer", (req, res) => {
  db.prepare("DELETE FROM contact_messages WHERE id = ?").run(Number(req.params.id));
  res.redirect("/formateur/messages");
});

module.exports = router;
