// Espace « Formations » (Kolakisa LMS) INTÉGRÉ au CMS : tableau de bord, formations, étudiants, certificats d'UN site.
// Aucun moteur parallèle : mêmes tables et mêmes services que le LMS existant (voir services/lmsAdminData.js et services/lmsSites.js).
// Le site vient UNIQUEMENT de l'adresse vérifiée par le serveur (res.locals.siteSpace / req.mk.site) ; l'extension doit être activée pour ce site (sinon 403, jamais seulement un menu masqué).
// Droit exigé : lms.manage (administrateur du site au minimum). Désactiver l'extension ferme ces écrans sans toucher aux données.
const express = require("express");
const { need, flashError, flashOk } = require("./kit");
const { recordAudit } = require("../audit");
const siteModules = require("../siteModules");
const data = require("../../services/lmsAdminData");
const builder = require("../../services/lmsBuilderData");
const { formatPrice, formatAmount } = require("../../utils/format");
const { paidCheckoutOpen } = require("../../services/payment");
const { stripeEnabled } = require("../../services/payments");

module.exports = () => {
  const router = express.Router({ mergeParams: true });
  const PREFIXES = ["/site-web/sites/:id(\\d+)", "/site-web/principal", "/site-web"]; // site, espace du principal, adresse historique du principal (menu CMS)

  function scopeOf(req, res) {
    const space = res.locals.siteSpace || (req.path.startsWith("/site-web/formations") ? res.locals.principalFrame : null);
    const ok = space && (space.principal ? req.mk.siteId === null : Number.isInteger(space.siteId) && req.mk.site && req.mk.site.id === space.siteId);
    if (!ok) {
      const reason = req.mk.siteContext && !req.mk.siteContext.ok ? req.mk.siteContext.reason : "not_found";
      res.status(reason === "forbidden" ? 403 : 404).render("error", { message: reason === "forbidden" ? "Vous n'avez pas accès à ce site." : "Site introuvable." });
      return null;
    }
    const s = { db: req.mk.ctx.db, organizationId: req.mk.ctx.organizationId, siteId: space.principal ? null : space.siteId };
    if (!siteModules.isEnabled(s.db, s.organizationId, s.siteId, "lms")) {
      res.status(403).render("error", { message: "L'extension « Kolakisa LMS » n'est pas activée pour ce site. Vos formations sont conservées : elles réapparaissent à la réactivation." });
      return null;
    }
    req.lmsSpace = space;
    return s;
  }
  const writable = (space) => space.status !== "archived" && !space.deleted;
  const audit = (req, s, action, id, metadata = {}) => {
    try { recordAudit(s.db, { organizationId: s.organizationId, userId: req.mk.ctx.userId ?? null, action, resourceType: "course", resourceId: String(id ?? ""), metadata, siteId: s.siteId ?? undefined }); } catch { /* la trace ne bloque jamais */ }
  };

  function route(method, tail, handler, { write = false } = {}) {
    for (const P of PREFIXES) {
      router[method](`${P}/formations${tail}`, need("lms.manage"), (req, res, next) => {
        const s = scopeOf(req, res);
        if (!s) return undefined;
        if (write && !writable(req.lmsSpace)) { flashError(req, "Ce site est archivé : ses formations sont en lecture seule."); return res.redirect(`${req.lmsSpace.base}/formations`); }
        try { return handler(req, res, s, next); } catch (error) {
          if (error && error.userMessage) { flashError(req, error.userMessage); return res.redirect(back(req)); } // message lisible (titre manquant, lien vidéo invalide…)
          return next(error);
        }
      });
    }
  }
  const render = (req, res, tpl, title, tab, extra = {}) => res.render(`marketing/formations/${tpl}`, {
    shopAdmin: true, lmsAdmin: true, title, active: "formation", tab, space: req.lmsSpace, base: `${req.lmsSpace.base}/formations`,
    canWrite: writable(req.lmsSpace), price: formatPrice, amount: formatAmount, query: req.query, ...extra,
  });
  const back = (req) => (req.get("referer") && /^https?:\/\/[^/]+\/marketing\//.test(req.get("referer")) ? req.get("referer") : `${req.lmsSpace.base}/formations/liste`);

  route("get", "", (req, res, s) => {
    const ov = data.overview(s.db, s.siteId);
    render(req, res, "tableau", "Formations", "", { ov, recent: data.recentEnrollments(s.db, s.siteId), top: data.topCourses(s.db, s.siteId), edited: data.recentlyEdited(s.db, s.siteId), days: data.enrollmentsByDay(s.db, s.siteId) });
  });
  route("get", "/liste", (req, res, s) => {
    const list = data.listCourses(s.db, s.siteId, { q: req.query.q, status: req.query.statut, sort: req.query.tri, page: req.query.page });
    render(req, res, "liste", "Formations", "liste", { list });
  });
  route("get", "/etudiants", (req, res, s) => {
    const courseId = req.query.formation ? Number.parseInt(req.query.formation, 10) : undefined;
    const list = data.listStudents(s.db, s.siteId, { q: req.query.q, courseId, page: req.query.page });
    render(req, res, "etudiants", "Étudiants", "etudiants", { list, choices: data.siteCourseChoices(s.db, s.siteId), courseId });
  });
  // Publication et paiement : état RÉEL (aucun réglage factice) — l'ouverture du paiement dépend de la plateforme, pas du site.
  route("get", "/parametres", (req, res, s) => {
    const ov = data.overview(s.db, s.siteId);
    render(req, res, "parametres", "Publication et paiement", "parametres", { ov, checkoutOpen: paidCheckoutOpen(), stripeOn: stripeEnabled(), version: require("../../extensions/manifests/lms").version });
  });
  route("get", "/certificats", (req, res, s) => {
    render(req, res, "certificats", "Certificats", "certificats", { list: data.listCertificates(s.db, s.siteId, { q: req.query.q, page: req.query.page }) });
  });

  // Publier / dépublier : le serveur vérifie que la formation appartient à CE site (identifiant d'un autre site : aucun effet, même message qu'une formation absente)
  for (const [tail, value, ok] of [["/:cid(\\d+)/publier", true, "Formation publiée."], ["/:cid(\\d+)/depublier", false, "Formation remise en brouillon."]]) {
    route("post", tail, (req, res, s) => {
      const id = Number(req.params.cid);
      if (!data.setPublished(s.db, s.siteId, id, value)) flashError(req, "Formation introuvable sur ce site.");
      else { audit(req, s, value ? "lms.course.published" : "lms.course.unpublished", id); flashOk(req, ok); }
      res.redirect(back(req));
    }, { write: true });
  }

  // ---------- Constructeur : formation (réglages + programme), chapitres, leçons ----------
  const notFound = (req, res) => res.status(404).render("error", { message: "Formation introuvable sur ce site." });
  const courseUrl = (req, id, q = "") => `${req.lmsSpace.base}/formations/${id}${q}`;
  const userId = (req) => req.mk.ctx.userId ?? req.session.user.id;
  const WR = { write: true };

  route("get", "/nouvelle", (req, res) => render(req, res, "formation", "Nouvelle formation", "liste", { course: null, sections: [], lesson: null, levels: builder.LEVELS }), WR);
  route("post", "/nouvelle", (req, res, s) => {
    const id = builder.createCourse(s.db, s, userId(req), req.body);
    audit(req, s, "lms.course.created", id); flashOk(req, "Formation créée. Ajoutez maintenant vos chapitres et vos leçons.");
    res.redirect(courseUrl(req, id));
  }, WR);
  route("get", "/:cid(\\d+)", (req, res, s) => {
    const course = builder.courseOf(s.db, s.siteId, Number(req.params.cid)); if (!course) return notFound(req, res);
    const sections = builder.curriculum(s.db, course.id);
    render(req, res, "formation", course.title, "liste", { course, sections, lesson: null, levels: builder.LEVELS, sold: s.db.prepare("SELECT (SELECT COUNT(*) FROM enrollments WHERE course_id = ?) + (SELECT COUNT(*) FROM order_items WHERE course_id = ?) n").get(course.id, course.id).n });
  });
  route("post", "/:cid(\\d+)", (req, res, s) => {
    const id = Number(req.params.cid);
    if (!builder.updateCourse(s.db, s.siteId, id, req.body)) return notFound(req, res);
    audit(req, s, "lms.course.updated", id); flashOk(req, "Réglages enregistrés."); res.redirect(courseUrl(req, id));
  }, WR);
  route("post", "/:cid(\\d+)/dupliquer", (req, res, s) => {
    const nid = builder.duplicateCourse(s.db, s, userId(req), Number(req.params.cid)); if (!nid) return notFound(req, res);
    audit(req, s, "lms.course.duplicated", nid, { from: Number(req.params.cid) }); flashOk(req, "Formation dupliquée en brouillon (les fichiers vidéo et pièces jointes ne sont pas copiés)."); res.redirect(courseUrl(req, nid));
  }, WR);
  route("post", "/:cid(\\d+)/supprimer", (req, res, s) => {
    const id = Number(req.params.cid), r = builder.deleteCourse(s.db, s.siteId, id);
    if (!r.ok && r.reason === "not_found") return notFound(req, res);
    if (!r.ok) { flashError(req, "Cette formation a déjà des étudiants ou des ventes : la supprimer effacerait leur accès et votre historique. Dépubliez-la plutôt."); return res.redirect(courseUrl(req, id)); }
    audit(req, s, "lms.course.deleted", id); flashOk(req, "Formation supprimée."); res.redirect(`${req.lmsSpace.base}/formations/liste`);
  }, WR);

  // chapitres
  const done = (req, res, courseId, ok) => { if (ok) flashOk(req, ok); res.redirect(courseUrl(req, courseId)); };
  route("post", "/:cid(\\d+)/chapitres", (req, res, s) => {
    const id = builder.addSection(s.db, s.siteId, Number(req.params.cid), req.body.title); if (!id) return notFound(req, res);
    done(req, res, Number(req.params.cid), "Chapitre ajouté.");
  }, WR);
  route("post", "/chapitres/:sid(\\d+)/renommer", (req, res, s) => { const c = builder.renameSection(s.db, s.siteId, Number(req.params.sid), req.body.title); return c ? done(req, res, c, "Chapitre renommé.") : notFound(req, res); }, WR);
  route("post", "/chapitres/:sid(\\d+)/deplacer", (req, res, s) => { const c = builder.moveSection(s.db, s.siteId, Number(req.params.sid), req.body.direction); return c ? done(req, res, c) : notFound(req, res); }, WR);
  route("post", "/chapitres/:sid(\\d+)/supprimer", (req, res, s) => { const c = builder.deleteSection(s.db, s.siteId, Number(req.params.sid)); return c ? done(req, res, c, "Chapitre supprimé.") : notFound(req, res); }, WR);
  route("post", "/chapitres/:sid(\\d+)/lecons", (req, res, s) => {
    const r = builder.addLesson(s.db, s.siteId, Number(req.params.sid), req.body.title); if (!r) return notFound(req, res);
    flashOk(req, "Leçon ajoutée."); res.redirect(`${req.lmsSpace.base}/formations/${r.courseId}/lecons/${r.id}`);
  }, WR);

  // leçons
  route("get", "/:cid(\\d+)/lecons/:lid(\\d+)", (req, res, s) => {
    const course = builder.courseOf(s.db, s.siteId, Number(req.params.cid)), lesson = builder.lessonOf(s.db, s.siteId, Number(req.params.lid));
    if (!course || !lesson || lesson.course_id !== course.id) return notFound(req, res);
    render(req, res, "lecon", lesson.title, "liste", { course, sections: builder.curriculum(s.db, course.id), lesson, quiz: builder.quizOfLesson(s.db, s.siteId, lesson.id) });
  });
  route("post", "/lecons/:lid(\\d+)", (req, res, s) => {
    const id = Number(req.params.lid), c = builder.updateLesson(s.db, s.siteId, id, req.body); if (!c) return notFound(req, res);
    audit(req, s, "lms.lesson.updated", id); flashOk(req, "Leçon enregistrée."); res.redirect(`${req.lmsSpace.base}/formations/${c}/lecons/${id}`);
  }, WR);
  route("post", "/lecons/:lid(\\d+)/deplacer", (req, res, s) => { const c = builder.moveLesson(s.db, s.siteId, Number(req.params.lid), req.body.direction); return c ? done(req, res, c) : notFound(req, res); }, WR);
  route("post", "/lecons/:lid(\\d+)/supprimer", (req, res, s) => { const c = builder.deleteLesson(s.db, s.siteId, Number(req.params.lid)); return c ? done(req, res, c, "Leçon supprimée.") : notFound(req, res); }, WR);

  // quiz de la leçon
  const lessonUrl = (req, q) => `${req.lmsSpace.base}/formations/${q.course_id}/lecons/${q.lesson_id}`;
  route("post", "/lecons/:lid(\\d+)/quiz", (req, res, s) => {
    const l = builder.createQuiz(s.db, s.siteId, Number(req.params.lid)); if (!l) return notFound(req, res);
    flashOk(req, "Quiz créé. Ajoutez vos questions."); res.redirect(`${req.lmsSpace.base}/formations/${l.course_id}/lecons/${l.id}#quiz`);
  }, WR);
  route("post", "/quiz/:qid(\\d+)", (req, res, s) => { const q = builder.updateQuiz(s.db, s.siteId, Number(req.params.qid), req.body); if (!q) return notFound(req, res); flashOk(req, "Réglages du quiz enregistrés."); res.redirect(lessonUrl(req, q) + "#quiz"); }, WR);
  route("post", "/quiz/:qid(\\d+)/supprimer", (req, res, s) => { const q = builder.deleteQuiz(s.db, s.siteId, Number(req.params.qid)); if (!q) return notFound(req, res); flashOk(req, "Quiz supprimé."); res.redirect(lessonUrl(req, q)); }, WR);
  route("post", "/quiz/:qid(\\d+)/questions", (req, res, s) => {
    const q = builder.addQuestion(s.db, s.siteId, Number(req.params.qid), req.body); if (!q) return notFound(req, res);
    flashOk(req, "Question ajoutée."); res.redirect(lessonUrl(req, q) + "#quiz");
  }, WR);
  route("post", "/questions/:id(\\d+)/supprimer", (req, res, s) => { const q = builder.deleteQuestion(s.db, s.siteId, Number(req.params.id)); if (!q) return notFound(req, res); flashOk(req, "Question supprimée."); res.redirect(lessonUrl(req, q) + "#quiz"); }, WR);

  return router;
};
