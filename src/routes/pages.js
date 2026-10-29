// Pages du site géré par le formateur : À propos, FAQ (générale et par formation), Contact + boîte de réception.
const express = require("express");
const db = require("../config/database");
const { requireInstructor } = require("../middlewares/auth");
const { createRateLimiter } = require("../middlewares/security");
const { sendContactNotification, sendContactAcknowledgement } = require("../utils/mailer");
const { UserError } = require("../utils/errors");
const seoPages = require("../seo/pages");
const dashSite = require("../services/dashSite");

const router = express.Router();

// Tout l'espace d'administration de ces pages est réservé au formateur — SAUF l'éditeur d'articles (/formateur/blog), dont le routeur du blog applique sa propre
// barrière (compte créateur, ou rôle autorisé à rédiger selon ses droits : voir requireBlogAccess dans routes/blog.js)
router.use("/formateur", (req, res, next) => (req.path === "/blog" || req.path.startsWith("/blog/") ? next() : requireInstructor(req, res, next)));

// ---------- À propos ----------

const { DEFAULT_ABOUT, DEFAULT_TITLE, parse: parseAbout, stats: aboutStats } = require("../services/aboutPage");
const sitePages = require("../services/sitePages");

const ABOUT_MAX = 20000;
const ABOUT_DESCRIPTION = "KOLAKISA : formations vidéo à suivre à votre rythme, avec quiz, ressources à télécharger et certificat de réussite vérifiable.";

// Le site principal garde site_pages (texte ou blocs) ; chaque autre site a sa page TEXTE dans site_pages_by_site (clé : site_id + adresse) — l'éditeur de blocs de la page reste celui du site principal
function loadAbout(siteId = null) {
  const row = siteId === null ? db.prepare("SELECT * FROM site_pages WHERE slug = 'a-propos'").get() : db.prepare("SELECT * FROM site_pages_by_site WHERE site_id = ? AND slug = 'a-propos'").get(siteId);
  return { content: row && row.content.trim() ? row.content : DEFAULT_ABOUT, custom: Boolean(row && row.content.trim()), description: (row && row.seo_description) || "", raw: row ? row.content : "", html: row && row.content_html && row.content_html.trim() ? row.content_html : "", heading: (row && row.heading) || "" };
}
// Mise en page de la page : contenu en blocs (éditeur de blocs) si la page en a, sinon le texte Markdown d'origine (rien ne change tant que l'éditeur de blocs n'a pas été utilisé)
function aboutLayout(about, { draftHtml = null, draftTitle = null } = {}) {
  const html = draftHtml !== null ? draftHtml : about.html;
  if (!html) return { ...parseAbout(about.content), blocks: false };
  const rendered = require("../services/blog").renderPost({ id: null, content: html, content_format: "html", toc_depth: 3 });
  return { ...sitePages.layoutOf(rendered.html, draftTitle !== null ? draftTitle : about.heading), blocks: true, full: rendered.html };
}

router.get("/a-propos", (req, res) => {
  const about = loadAbout();
  const creator = db.prepare("SELECT username, bio FROM users WHERE role = 'formateur' ORDER BY id LIMIT 1").get();
  const doc = aboutLayout(about);
  const model = { ...doc, title: doc.title || DEFAULT_TITLE, stats: aboutStats(db) };
  const crumbs = [{ name: "Accueil", url: "/" }, { name: "À propos" }];
  // Modèle de thème « Page du site » (Page Builder, Apparence → Templates) : remplace le texte de la page ; sans modèle en ligne, rien ne change
  let contentHtml = "";
  try { contentHtml = doc.blocks ? doc.full : require("../utils/markdown").renderMarkdown(about.content); } catch { contentHtml = ""; }
  require("../marketing/web/themeRender").renderRegion(req, res, db, "static_page", { scope: { post: { title: "À propos", url: "/a-propos", excerpt: about.description || "", image: "", date: null, category: "", author: "", minutes: null, contentHtml } } }, (themeTemplate) => {
    res.render("pages/about", {
      about, creator, crumbs, themeTemplate, model,
      seo: seoPages.staticPage(req, "a-propos", { title: "À propos", description: about.description || ABOUT_DESCRIPTION, type: "AboutPage", crumbs }),
    });
  });
});

// Aperçu d'une page du site depuis l'éditeur de blocs : la page avec sa mise en page, à partir du brouillon (jamais publié)
router.previewPage = (req, res, merged) => {
  const about = loadAbout();
  const creator = db.prepare("SELECT username, bio FROM users WHERE role = 'formateur' ORDER BY id LIMIT 1").get();
  const doc = aboutLayout(about, { draftHtml: merged.content || "", draftTitle: merged.title });
  const model = { ...doc, title: doc.title || DEFAULT_TITLE, stats: aboutStats(db) };
  const crumbs = [{ name: "Accueil", url: "/" }, { name: "À propos" }];
  res.render("pages/about", { about, creator, crumbs, themeTemplate: null, model, seo: { ...seoPages.staticPage(req, "a-propos", { title: "À propos", description: ABOUT_DESCRIPTION, type: "AboutPage", crumbs }), noindex: true } });
};

// Éditeur de blocs de la page : ouvre l'éditeur complet sur la ligne « support » de la page (créée au premier passage à partir du texte actuel)
router.get("/formateur/pages/:slug/blocs", (req, res) => {
  if (!EDITABLE_PAGES[req.params.slug]) return res.status(404).render("error", { message: "Page introuvable." });
  if (dashSite.siteIdOf(req) !== null) return res.status(409).render("error", { message: "L'éditeur de blocs de la page À propos est disponible pour le site principal ; les autres sites utilisent le texte de la page." });
  const post = sitePages.ensureSupport(req.params.slug, req.session.user.id);
  res.redirect(`/formateur/blog/${post.id}/modifier`);
});

// Seule la page « à propos » est modifiable (la liste est fermée : aucune page ne se crée par l'adresse)
const EDITABLE_PAGES = { "a-propos": "À propos" };

router.get("/formateur/pages/:slug", (req, res) => {
  if (!EDITABLE_PAGES[req.params.slug]) return res.status(404).render("error", { message: "Page introuvable." });
  const about = loadAbout(dashSite.siteIdOf(req));
  res.render("instructor/page-form", { blocks: Boolean(about.html), title: EDITABLE_PAGES[req.params.slug], slug: req.params.slug, content: about.raw, description: about.description, saved: req.query.enregistre === "1", error: req.query.erreur || null, defaultText: DEFAULT_ABOUT, defaultTitle: DEFAULT_TITLE, max: ABOUT_MAX });
});

// Retour au texte simple : le site réaffiche le texte Markdown ; le contenu en blocs reste dans l'éditeur (et son historique), rien n'est supprimé
router.post("/formateur/pages/:slug/texte-simple", (req, res) => {
  if (!EDITABLE_PAGES[req.params.slug]) return res.status(404).render("error", { message: "Page introuvable." });
  if (dashSite.siteIdOf(req) !== null) return res.status(409).render("error", { message: "Le contenu en blocs de la page À propos est celui du site principal." });
  db.prepare("UPDATE site_pages SET content_html = '', updated_at = datetime('now') WHERE slug = ?").run(req.params.slug);
  res.redirect(`/formateur/pages/${req.params.slug}?enregistre=1`);
});

router.post("/formateur/pages/:slug", (req, res) => {
  if (!EDITABLE_PAGES[req.params.slug]) return res.status(404).render("error", { message: "Page introuvable." });
  const content = String(req.body.content || "");
  if (content.length > ABOUT_MAX) return res.redirect(`/formateur/pages/${req.params.slug}?erreur=${encodeURIComponent(`Le texte fait ${content.length} caractères : la limite est de ${ABOUT_MAX}. Rien n'a été enregistré ; raccourcissez-le puis réessayez.`)}`);
  const description = String(req.body.seo_description || "").trim().slice(0, 160);
  const siteId = dashSite.siteIdOf(req);
  if (siteId === null) db.prepare(
    `INSERT INTO site_pages (slug, title, content, seo_description, updated_at) VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(slug) DO UPDATE SET content = excluded.content, seo_description = excluded.seo_description, updated_at = excluded.updated_at`
  ).run(req.params.slug, EDITABLE_PAGES[req.params.slug], content, description || null);
  else db.prepare(
    `INSERT INTO site_pages_by_site (site_id, slug, title, content, seo_description, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(site_id, slug) DO UPDATE SET content = excluded.content, seo_description = excluded.seo_description, updated_at = excluded.updated_at`
  ).run(siteId, req.params.slug, EDITABLE_PAGES[req.params.slug], content, description || null);
  require("../services/auditLog").record(req, { action: "page.saved", resourceType: "page", resourceId: req.params.slug, summary: `Page « ${EDITABLE_PAGES[req.params.slug]} » enregistrée` });
  res.redirect(`/formateur/pages/${req.params.slug}?enregistre=1`);
});

// ---------- FAQ ----------
const faqs = require("../services/faqs");

// Cookies et mesure d'audience : ce qui est mesuré, avec ou sans accord, et comment changer d'avis
router.get("/cookies", (req, res) => {
  res.render("pages/cookies", { crumbs: [{ name: "Accueil", url: "/" }, { name: "Cookies" }] });
});

router.get("/faq", (req, res) => {
  const list = faqs.listPublic(null, null); // pages publiques : domaine principal uniquement (MAIN_SITE_ONLY)
  const crumbs = [{ name: "Accueil", url: "/" }, { name: "Questions fréquentes" }];
  res.render("pages/faq", {
    faqs: list, groups: faqs.grouped(list), crumbs,
    seo: seoPages.faqPage(req, list, crumbs),
  });
});

function loadCourseOr404(req, res, courseId) {
  // Toutes les colonnes : l'en-tête commun des pages d'une formation (_course-head) affiche son statut, sa miniature et son lien public
  const course = db.prepare("SELECT * FROM courses WHERE id = ? AND instructor_id = ?").get(Number(courseId), req.session.user.id);
  if (!course) { res.status(404).render("error", { message: "Formation introuvable." }); return course; }
  if (!dashSite.guardObject(req, res, course.site_id, { notFound: "Formation introuvable." })) return null;
  return course;
}

// Administration : une page par périmètre (questions générales, ou celles d'une formation). Messages d'action gardés en session, lus une seule fois.
const faqFlash = (req) => { const f = req.session.faqFlash || null; delete req.session.faqFlash; return f; };
const faqBack = (faq) => (faq && faq.course_id ? `/formateur/cours/${faq.course_id}/faq` : "/formateur/faq");
function renderFaqAdmin(req, res, course, over = {}) {
  res.status(over.status || 200).render("instructor/faq-admin", { faqs: faqs.listAll(course ? course.id : null, dashSite.siteIdOf(req)), course, categories: faqs.categories(dashSite.siteIdOf(req)), flash: faqFlash(req), errors: {}, values: {}, ...over });
}
// Question ciblée : introuvable → 404 ; hors de son périmètre (formation d'un autre formateur) → 404 aussi (aucune information sur son existence)
function loadFaq(req, res) {
  const faq = faqs.get(Number(req.params.id));
  if (!faq || !faqs.canManage(req.session.user, faq)) { res.status(404).render("error", { message: "Question introuvable." }); return null; }
  if (!dashSite.guardObject(req, res, faqs.siteOf(faq), { notFound: "Question introuvable." })) return null;
  return faq;
}

router.get("/formateur/faq", (req, res) => renderFaqAdmin(req, res, null));

router.get("/formateur/cours/:id/faq", (req, res) => {
  const course = loadCourseOr404(req, res, req.params.id);
  if (!course) return;
  renderFaqAdmin(req, res, course);
});

router.post("/formateur/faq/ajouter", (req, res) => {
  let course = null;
  if (String(req.body.course_id || "").trim()) { course = loadCourseOr404(req, res, req.body.course_id); if (!course) return; }
  const r = faqs.create(course ? course.id : null, req.body, course ? (course.site_id ?? null) : dashSite.siteIdOf(req));
  if (r.errors) return renderFaqAdmin(req, res, course, { status: 400, errors: r.errors, values: r.values });
  req.session.faqFlash = { type: "ok", text: "Question ajoutée." };
  res.redirect(course ? `/formateur/cours/${course.id}/faq` : "/formateur/faq");
});

router.get("/formateur/faq/:id(\\d+)/modifier", (req, res) => {
  const faq = loadFaq(req, res); if (!faq) return;
  const course = faq.course_id ? loadCourseOr404(req, res, faq.course_id) : null;
  if (faq.course_id && !course) return;
  res.render("instructor/faq-edit", { faq, course, categories: faqs.categories(faqs.siteOf(faq)), errors: {}, values: faq });
});
router.post("/formateur/faq/:id(\\d+)/modifier", (req, res) => {
  const faq = loadFaq(req, res); if (!faq) return;
  const course = faq.course_id ? loadCourseOr404(req, res, faq.course_id) : null;
  if (faq.course_id && !course) return;
  const r = faqs.update(faq, req.body);
  if (r.errors) return res.status(400).render("instructor/faq-edit", { faq, course, categories: faqs.categories(faqs.siteOf(faq)), errors: r.errors, values: r.values });
  req.session.faqFlash = { type: "ok", text: "Question enregistrée." };
  res.redirect(faqBack(faq));
});
router.post("/formateur/faq/:id(\\d+)/publier", (req, res) => {
  const faq = loadFaq(req, res); if (!faq) return;
  const on = req.body.published !== "0";
  faqs.setPublished(faq, on);
  req.session.faqFlash = { type: "ok", text: on ? "Question publiée." : "Question retirée du site (brouillon)." };
  res.redirect(faqBack(faq));
});
router.post("/formateur/faq/:id(\\d+)/:dir(monter|descendre)", (req, res) => {
  const faq = loadFaq(req, res); if (!faq) return;
  const moved = faqs.move(faq, req.params.dir === "monter" ? "up" : "down");
  req.session.faqFlash = moved ? { type: "ok", text: "Ordre modifié." } : { type: "info", text: "Cette question est déjà " + (req.params.dir === "monter" ? "la première." : "la dernière.") };
  res.redirect(faqBack(faq));
});
router.post("/formateur/faq/:id(\\d+)/supprimer", (req, res) => {
  const faq = loadFaq(req, res); if (!faq) return;
  faqs.remove(faq);
  req.session.faqFlash = { type: "ok", text: "Question supprimée." };
  res.redirect(faqBack(faq));
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

    db.prepare("INSERT INTO contact_messages (name, email, subject, message, site_id) VALUES (?, ?, ?, ?, ?)").run(values.name, values.email, values.subject, values.message, req.kwSite ? req.kwSite.id : null); // site du domaine servi (jamais une valeur du formulaire)
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
// Messages du formulaire de contact : liste paginée + lecture (services/inbox). Ouvrir un message le marque comme lu (« Marquer comme non lu » le rétablit).
// Sans id, rien n'est ouvert ni modifié. Les redirections reconstruisent l'adresse à partir de paramètres validés (jamais d'adresse libre : pas de redirection ouverte).

const inbox = require("../services/inbox");

const inboxState = (src) => ({
  q: String(src.q || "").trim().slice(0, 100),
  unreadOnly: src.filtre === "non-lus",
  page: Math.max(1, Number.parseInt(src.page, 10) || 1),
});
const inboxUrl = (state, id) => {
  const qs = new URLSearchParams();
  if (state.q) qs.set("q", state.q);
  if (state.unreadOnly) qs.set("filtre", "non-lus");
  if (state.page > 1) qs.set("page", String(state.page));
  if (id) qs.set("id", String(id));
  const text = qs.toString();
  return `/formateur/messages${text ? `?${text}` : ""}`;
};

router.get("/formateur/messages", (req, res) => {
  const state = inboxState(req.query);
  const siteId = dashSite.siteIdOf(req);
  let open = null, missing = false;
  if (req.query.id !== undefined) {
    open = inbox.get(req.query.id, siteId);
    if (!open) missing = true;
    else if (!open.read_at) { inbox.markRead(open.id, siteId); open = inbox.get(open.id, siteId); }
  }
  const totals = inbox.counts(siteId);
  // La pastille de la navigation a été calculée avant cette lecture : on la remet à jour pour cette réponse
  if (res.locals.dash) res.locals.dash.unread = totals.unread;
  if (res.locals.appRail) res.locals.appRail.unread = totals.unread;
  // Lien direct vers un message (sans page demandée) : la liste s'ouvre à la page qui le contient
  if (open && req.query.page === undefined) state.page = inbox.pageOf(open.id, { ...state, siteId });
  const result = inbox.list({ ...state, keepId: open ? open.id : 0, siteId });
  res.render("instructor/messages", { result, totals, open, missing, state: { ...state, page: result.page }, replyHref: open ? inbox.replyHref(open) : "", inboxUrl, shortDate: inbox.shortDate });
});

router.post("/formateur/messages/:id/lu", (req, res) => {
  inbox.markRead(req.params.id, dashSite.siteIdOf(req));
  res.redirect(inboxUrl(inboxState(req.body), req.params.id));
});

router.post("/formateur/messages/:id/non-lu", (req, res) => {
  inbox.markUnread(req.params.id, dashSite.siteIdOf(req));
  res.redirect(inboxUrl(inboxState(req.body), req.params.id));
});

router.post("/formateur/messages/:id/supprimer", (req, res) => {
  inbox.remove(req.params.id, dashSite.siteIdOf(req));
  res.redirect(inboxUrl(inboxState(req.body)));
});

module.exports = router;
