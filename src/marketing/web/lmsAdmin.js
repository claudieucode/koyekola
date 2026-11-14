// Espace « Formations » (Kolakisa LMS) INTÉGRÉ au CMS : tableau de bord, formations, étudiants, certificats d'UN site.
// Aucun moteur parallèle : mêmes tables et mêmes services que le LMS existant (voir services/lmsAdminData.js et services/lmsSites.js).
// Le site vient UNIQUEMENT de l'adresse vérifiée par le serveur (res.locals.siteSpace / req.mk.site) ; l'extension doit être activée pour ce site (sinon 403, jamais seulement un menu masqué).
// Droit exigé : lms.manage (administrateur du site au minimum). Désactiver l'extension ferme ces écrans sans toucher aux données.
const express = require("express");
const { need, flashError, flashOk } = require("./kit");
const { recordAudit } = require("../audit");
const siteModules = require("../siteModules");
const data = require("../../services/lmsAdminData");
const { formatPrice, formatAmount } = require("../../utils/format");

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
        try { return handler(req, res, s, next); } catch (error) { return next(error); }
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
  return router;
};
