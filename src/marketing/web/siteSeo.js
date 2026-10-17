// R8 lot 6C — SEO dans l'espace d'UN site : réglages SEO du site, redirections du site (lecture et écriture), erreurs 404 du site (lecture).
// Le site vient UNIQUEMENT de l'adresse vérifiée par le serveur (res.locals.siteSpace / req.mk.site) : aucun « site » reçu du navigateur n'est lu.
// Droits réels : seo.view / seo.edit (réglages), redirects.view / create / edit / delete / external (redirections). Les réglages globaux, l'audit, la surveillance, les intégrations,
// les règles et les redirections COMMUNES restent à l'équipe centrale (suite /formateur/seo) : ils n'ont aucune route ici.
const express = require("express");
const { need, flashError, flashOk } = require("./kit");
const nav = require("./cmsNav");
const settings = require("../../seo/settings");
const redirects = require("../../seo/redirects");
const notfound = require("../../seo/notfound");

const BASE = nav.BASE;
// Réglages qu'un site peut modifier depuis son espace (les images passent par les réglages d'identité du site ; les clés restantes de SITE_KEYS sont gérées par l'équipe)
const FORM_KEYS = ["site_name", "title_separator", "title_template", "default_description", "og_locale", "org_type", "org_name", "org_description", "social_profiles", "robots_custom"];

// Le site de la requête : celui de l'adresse, vérifié ; sinon refus (jamais un repli)
function spaceOf(req, res) {
  const space = res.locals.siteSpace;
  if (!space || space.principal || !Number.isInteger(space.siteId) || !req.mk.site || req.mk.site.id !== space.siteId) return null;
  return space;
}
const writable = (space) => space.status !== "archived" && !space.deleted;
const deny = (res, status, message) => res.status(status).render("error", { message });

module.exports = () => {
  const router = express.Router({ mergeParams: true });
  const P = "/site-web/sites/:id(\\d+)";
  // Toutes les routes de ce module exigent un site vérifié ; sinon la même réponse que les autres écrans de l'espace
  router.use(`${P}/(seo|redirections)`, (req, res, next) => {
    const space = spaceOf(req, res);
    if (!space) {
      const reason = req.mk.siteContext && !req.mk.siteContext.ok ? req.mk.siteContext.reason : "not_found";
      return deny(res, reason === "forbidden" ? 403 : 404, reason === "forbidden" ? "Vous n'avez pas accès à ce site." : "Site introuvable.");
    }
    req.seoSpace = space;
    next();
  });
  const back = (req, tail = "") => `${req.seoSpace.base}${tail}`;
  const note = (space) => (writable(space) ? null : "Ce site est archivé : ses réglages sont en lecture seule. Restaurez-le depuis ses réglages pour les modifier.");

  // ---------- Réglages SEO du site ----------
  router.get(`${P}/seo`, need("seo.view"), (req, res) => {
    const space = req.seoSpace;
    const own = settings.storedFor(space.siteId), effective = settings.allFor(space.siteId);
    res.render("marketing/site-seo", { active: "seo", title: "SEO du site", mode: "settings", space, note: note(space), canEdit: req.mk.can("seo.edit") && writable(space),
      fields: FORM_KEYS.map((k) => ({ key: k, ...settings.FIELDS[k], own: Object.hasOwn(own, k), value: Object.hasOwn(own, k) ? own[k] : "", effective: effective[k] })), query: req.query });
  });
  router.post(`${P}/seo`, need("seo.edit"), (req, res) => {
    const space = req.seoSpace;
    if (!writable(space)) { flashError(req, "Ce site est archivé : ses réglages ne peuvent pas être modifiés."); return res.redirect(back(req, "/seo")); }
    const input = {};
    for (const k of FORM_KEYS) {
      if (!Object.hasOwn(req.body, k)) continue;
      const raw = req.body[k];
      input[k] = String(raw ?? "").trim() === "" ? null : raw; // champ vide = retour à la valeur neutre du site
    }
    const r = settings.saveForSite(space.siteId, input, req.session.user.id);
    if (!r.ok) { flashError(req, r.errors.join(" ")); return res.redirect(back(req, "/seo")); }
    flashOk(req, "Réglages SEO du site enregistrés.");
    res.redirect(back(req, "/seo"));
  });

  // ---------- Erreurs 404 du site (lecture) ----------
  router.get(`${P}/seo/404`, need("seo.view"), (req, res) => {
    const space = req.seoSpace;
    const list = notfound.list({ site: space.siteId, filter: req.query.filtre === "human" ? "human" : "all", limit: 200 });
    res.render("marketing/site-seo", { active: "seo/404", title: "Erreurs 404 du site", mode: "notfound", space, note: note(space), list, stats: notfound.stats({ site: space.siteId }), canRedirect: req.mk.can("redirects.create") && writable(space), query: req.query });
  });

  // ---------- Redirections du site ----------
  router.get(`${P}/redirections`, need("redirects.view"), (req, res) => {
    const space = req.seoSpace;
    const q = redirects.queryForSite(space.siteId, { q: String(req.query.q || ""), page: Number(req.query.page) || 1, perPage: 25 });
    res.render("marketing/site-seo", { active: "redirections", title: "Redirections du site", mode: "redirects", space, note: note(space), q, search: String(req.query.q || ""),
      can: { create: req.mk.can("redirects.create") && writable(space), edit: req.mk.can("redirects.edit") && writable(space), delete: req.mk.can("redirects.delete") && writable(space), external: req.mk.can("redirects.external") },
      prefill: String(req.query.source || "").slice(0, 300), query: req.query });
  });
  router.get(`${P}/redirections/export.csv`, need("redirects.view"), (req, res) => {
    res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="redirections-site-${req.seoSpace.siteId}.csv"`, "Cache-Control": "no-store" });
    res.send(`﻿${redirects.exportCsvForSite(req.seoSpace.siteId)}`);
  });
  const isExternal = (t) => redirects.isExternal(t);
  const guardWrite = (req, res, perm) => {
    if (!writable(req.seoSpace)) { flashError(req, "Ce site est archivé : ses redirections ne peuvent pas être modifiées."); res.redirect(back(req, "/redirections")); return false; }
    if (!req.mk.can(perm)) { deny(res, 403, "Vous n'avez pas la permission d'effectuer cette action."); return false; }
    return true;
  };
  const externalOk = (req, res, target) => {
    if (isExternal(target) && !req.mk.can("redirects.external")) { flashError(req, "Rediriger vers un site extérieur demande la permission « redirects.external »."); res.redirect(back(req, "/redirections")); return false; }
    return true;
  };
  router.post(`${P}/redirections`, (req, res) => {
    if (!guardWrite(req, res, "redirects.create") || !externalOk(req, res, req.body.target)) return;
    const r = redirects.createForSite(req.seoSpace.siteId, { source: req.body.source, target: req.body.target, status: req.body.status, note: req.body.note }, req.session.user.id); // le « site » du formulaire n'est jamais lu
    if (!r.ok) flashError(req, r.errors.join(" ")); else flashOk(req, "Redirection créée.");
    res.redirect(back(req, "/redirections"));
  });
  router.post(`${P}/redirections/import`, (req, res) => {
    if (!guardWrite(req, res, "redirects.create")) return;
    const text = String(req.body.csv || "").slice(0, 400000);
    if (!req.mk.can("redirects.external") && /(^|[,;])\s*"?https:\/\//im.test(text.split(/\r?\n/).map((l) => l.split(/[,;]/)[1] || "").join("\n"))) { flashError(req, "Le fichier contient des destinations extérieures : la permission « redirects.external » est nécessaire."); return res.redirect(back(req, "/redirections")); }
    const report = redirects.importCsvForSite(req.seoSpace.siteId, text, req.session.user.id);
    if (report.errors.length) flashError(req, `${report.created} créée(s) ; ${report.errors.length} ligne(s) refusée(s) : ${report.errors.slice(0, 5).join(" ")}`); else flashOk(req, `${report.created} redirection(s) créée(s).`);
    res.redirect(back(req, "/redirections"));
  });
  router.post(`${P}/redirections/:rid(\\d+)`, (req, res) => {
    if (!guardWrite(req, res, "redirects.edit") || !externalOk(req, res, req.body.target)) return;
    const r = redirects.updateForSite(req.seoSpace.siteId, Number(req.params.rid), { source: req.body.source, target: req.body.target, status: req.body.status, note: req.body.note, enabled: req.body.enabled === "1" ? "1" : "0" }, req.session.user.id);
    if (!r.ok) flashError(req, r.errors.join(" ")); else flashOk(req, "Redirection enregistrée.");
    res.redirect(back(req, "/redirections"));
  });
  router.post(`${P}/redirections/:rid(\\d+)/supprimer`, (req, res) => {
    if (!guardWrite(req, res, "redirects.delete")) return;
    if (redirects.removeForSite(req.seoSpace.siteId, Number(req.params.rid), req.session.user.id)) flashOk(req, "Redirection supprimée."); else flashError(req, "Redirection introuvable.");
    res.redirect(back(req, "/redirections"));
  });
  return router;
};
