// KOLAKISA CMS → Historique et Corbeille (palier 10). Une seule interface pour l'historique des pages (et modèles), articles, apparence et patterns
// (src/services/revisions.js) et une seule corbeille pour les pages, articles, médias, commentaires et patterns.
// Droits : revisions.view (voir), revisions.restore (restaurer) + le droit d'écriture du contenu ; suppression définitive = le droit « supprimer »
// du contenu (pages.delete, articles.delete, media.delete, comments.delete, appearance.patterns). Un article n'est visible que par qui gère tous les
// articles ou en est l'auteur. Les pages suivent le site de la page (rôles par site du palier 9).
const express = require("express");
const revisions = require("../../services/revisions");
const appearance = require("../../services/appearance");
const articles = require("../../services/articles");
const comments = require("../../services/comments");
const pages = require("../pages");
const landing = require("../landing");
const media = require("../media");
const { MarketingError } = require("../errors");
const { UserError } = require("../../utils/errors");

const BASE = "/marketing/site-web/historique";
const TRASH = "/marketing/site-web/corbeille";
const NEED = { page: { view: "forms.read", write: "forms.write" }, post: { view: "articles.read", write: "articles.write" }, appearance: { view: "appearance.read", write: "appearance.styles" }, pattern: { view: "appearance.read", write: "appearance.patterns" } };
const KINDS_BADGE = { publish: "mk-status-ok", restore: "mk-status-info", before_restore: "mk-status-warn", trash: "mk-status-off", create: "mk-status-info", autosave: "mk-status-warn" };

module.exports = () => {
  const router = express.Router();
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; };
  const deny = (res) => res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });

  // Autorisation commune : droit d'historique + droit du contenu + propriété (articles) ; le site des pages est géré par la barrière d'entrée du CMS
  function authorize(req, res, action = "view") {
    const type = req.params.type, id = Number(req.params.id);
    if (!NEED[type]) { res.status(404).render("error", { message: "Type de contenu inconnu." }); return null; }
    if (!req.mk.can(action === "restore" ? "revisions.restore" : "revisions.view")) { deny(res); return null; }
    if (type === "post" ? !req.mk.can("articles.read") : !req.mk.can(NEED[type][action === "restore" ? "write" : "view"])) { deny(res); return null; }
    const info = revisions.adapter(type).info(req.mk.ctx, id);
    if (!info) { res.status(404).render("error", { message: "Contenu introuvable." }); return null; }
    if (type === "post" && !req.mk.can("articles.write") && !(req.mk.can("articles.edit_own") && info.authorId === req.session.user.id)) { deny(res); return null; }
    return { type, id, info, adapter: revisions.adapter(type) };
  }
  const dayLabel = (at) => {
    if (!at) return "En cours";
    const d = String(at).slice(0, 10), today = new Date().toISOString().slice(0, 10), yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    return d === today ? "Aujourd'hui" : d === yest ? "Hier" : d.split("-").reverse().join("/");
  };

  // ----- Historique d'un contenu -----
  router.get("/site-web/historique/:type/:id(\\d+)", (req, res) => {
    const c = authorize(req, res);
    if (!c) return;
    const h = revisions.history(req.mk.ctx, c.type, c.id, { page: req.query.page, kind: String(req.query.type || "") });
    const groups = [];
    for (const r of h.rows) { const day = dayLabel(r.at); const g = groups[groups.length - 1]; if (g && g.day === day) g.rows.push(r); else groups.push({ day, rows: [r] }); }
    res.render("marketing/history", {
      title: `Historique · ${c.info.title}`, active: c.type === "appearance" ? "apparence" : c.type === "post" ? "articles" : c.type === "pattern" ? "apparence/patterns" : "landing", mode: "list", c, h, groups, KINDS: revisions.KINDS, badge: KINDS_BADGE, BASE,
      canRestore: req.mk.can("revisions.restore") && req.mk.can(NEED[c.type].write) && !c.info.trashed, canDelete: req.mk.can("revisions.delete"), isCreator: req.session.user.role === "formateur", restorable: c.adapter.restorable !== false,
      editUrl: c.adapter.urlOf(c.id), kind: String(req.query.type || ""), historyJs: true,
    });
  });
  router.get("/site-web/historique/:type/:id(\\d+)/version", (req, res, next) => {
    const c = authorize(req, res);
    if (!c) return;
    try {
      const v = c.adapter.get(req.mk.ctx, c.id, String(req.query.ref || ""));
      res.render("marketing/history", { title: `Version · ${c.info.title}`, active: "landing", mode: "version", c, v, KINDS: revisions.KINDS, BASE, previewUrl: previewUrl(c, v.ref), canRestore: req.mk.can("revisions.restore") && req.mk.can(NEED[c.type].write) && !c.info.trashed, isCreator: req.session.user.role === "formateur", restoreUrl: c.adapter.restoreUrl ? c.adapter.restoreUrl(c.id, v.ref) : null });
    } catch (error) { if (!(error instanceof UserError) && !(error instanceof MarketingError)) return next(error); res.status(404).render("error", { message: error.message }); }
  });
  router.get("/site-web/historique/:type/:id(\\d+)/comparer", (req, res, next) => {
    const c = authorize(req, res);
    if (!c) return;
    try {
      const a = String(req.query.a || ""), b = String(req.query.b || "") || (c.type === "page" ? "draft" : c.type === "post" ? "current" : "draft");
      const diff = c.adapter.compare(req.mk.ctx, c.id, a, b);
      res.render("marketing/history", { title: `Comparer · ${c.info.title}`, active: "landing", mode: "compare", c, diff, a, b, BASE, labels: { draft: "Brouillon actuel", live: "Version en ligne", current: "État actuel" } });
    } catch (error) { if (!(error instanceof UserError) && !(error instanceof MarketingError)) return next(error); res.status(404).render("error", { message: error.message }); }
  });
  const previewUrl = (c, ref) => (c.type !== "page" ? null : /^v:(\d+)$/.test(ref) ? `/marketing/pages/${c.id}/versions/${ref.slice(2)}/apercu` : /^r:(\d+)$/.test(ref) ? `/marketing/pages/${c.id}/revisions/${ref.slice(2)}/apercu` : `/marketing/pages/${c.id}/apercu`);

  // ----- Restaurer / supprimer un point d'historique -----
  router.post("/site-web/historique/:type/:id(\\d+)/restaurer", (req, res, next) => {
    const c = authorize(req, res, "restore");
    if (!c) return;
    if (c.adapter.restorable === false) return res.status(400).render("error", { message: "La restauration des articles se fait dans l'éditeur du blog." });
    const back = `${BASE}/${c.type}/${c.id}`;
    try {
      c.adapter.restore(req.mk.ctx, c.id, String(req.body.ref || ""));
      flash(req, "ok", c.type === "page" ? "Version restaurée dans le brouillon de la page (l'état précédent a été conservé dans l'historique). Rien n'est publié tant que vous ne publiez pas." : c.type === "appearance" ? "Version restaurée dans le brouillon de l'apparence (l'état précédent est conservé). Publiez pour l'appliquer au site." : "Version restaurée (l'état précédent est conservé dans l'historique).");
      res.redirect(back);
    } catch (error) {
      if (!(error instanceof UserError) && !(error instanceof MarketingError)) return next(error);
      flash(req, "error", error.message); res.redirect(back);
    }
  });
  router.post("/site-web/historique/:type/:id(\\d+)/supprimer-version", (req, res, next) => {
    const c = authorize(req, res, "restore");
    if (!c) return;
    if (!req.mk.can("revisions.delete")) return deny(res);
    try { revisions.deleteRevision(c.type, c.id, String(req.body.ref || "")); flash(req, "ok", "Point d'historique supprimé."); } catch (error) { if (!(error instanceof UserError)) return next(error); flash(req, "error", error.message); }
    res.redirect(`${BASE}/${c.type}/${c.id}`);
  });

  // ----- Corbeille commune -----
  router.get("/site-web/corbeille", (req, res) => {
    if (!req.mk.can("revisions.view")) return deny(res);
    const type = Object.hasOwn(revisions.TRASH_TYPES, req.query.type) ? String(req.query.type) : "";
    const q = String(req.query.q || "").trim().slice(0, 80);
    const result = revisions.trashList({ type, q, page: req.query.page, ctx: req.mk.ctx });
    const can = (t, k) => req.mk.can(revisions.TRASH_TYPES[t][k]);
    res.render("marketing/trash", { title: "Corbeille", active: "corbeille", result, rows: result.rows, counts: revisions.trashCounts(req.mk.ctx), types: revisions.TRASH_TYPES, type, q, TRASH, siteQ: Number.isInteger(req.mk.ctx.siteFilter) ? `site=${req.mk.ctx.siteFilter}` : req.mk.ctx.siteFilter === "principal" ? "site=principal" : "", can, cmsPagesJs: true,
      canOwn: (row) => row.type !== "post" || req.mk.can("articles.write") || false });
  });
  const reportTrash = (req, label, done, failed) => {
    const n = done.length;
    if (n && !failed.length) flash(req, "ok", `${n} élément${n > 1 ? "s" : ""} ${label}.`);
    else if (n) flash(req, "ok", `${n} élément${n > 1 ? "s" : ""} ${label}. ${failed.length} refusé${failed.length > 1 ? "s" : ""}.`, failed.join(" · "));
    else flash(req, "error", "Aucun élément n'a été traité.", failed.join(" · "));
  };
  router.post("/site-web/corbeille/actions", (req, res, next) => {
    if (!req.mk.can("revisions.view")) return deny(res);
    const action = String(req.body.action || "");
    if (!["restaurer", "supprimer"].includes(action)) return res.status(400).render("error", { message: "Action inconnue." });
    const items = [...new Set([].concat(req.body.items || []).flatMap((x) => String(x).split(",")))].filter((x) => /^[a-z]+:\d{1,9}$/.test(x)).slice(0, 100);
    const back = /^\/marketing\/site-web\/corbeille(\?[^#\s]*)?$/.test(String(req.body.retour || "")) ? req.body.retour : TRASH;
    if (!items.length) { flash(req, "error", "Sélectionnez au moins un élément."); return res.redirect(back); }
    const ctx = req.mk.ctx, uid = req.session.user.id;
    const done = [], failed = [], warns = [];
    for (const item of items) {
      const [type, rawId] = item.split(":"), id = Number(rawId), t = revisions.TRASH_TYPES[type];
      if (!t) { failed.push(`${item} : type inconnu`); continue; }
      if (!req.mk.can(action === "restaurer" ? t.write : t.del)) { failed.push(`${t.label} #${id} : droit insuffisant`); continue; }
      // Périmètre : l'élément doit être dans la corbeille DE CETTE organisation et DE CE site (jamais d'après l'identifiant seul)
      if (!revisions.inTrash(ctx, type, id)) { failed.push(`${t.label} #${id} : introuvable dans la corbeille de ce site`); continue; }
      try {
        if (action === "restaurer") {
          const dep = revisions.dependencies(ctx, type, id);
          if (dep.blocking.length) { failed.push(`${t.label} #${id} : ${dep.blocking.join(" ")}`); continue; }
          if (type === "page") pages.restorePage(ctx, id);
          else if (type === "post") articles.restore(id, uid);
          else if (type === "media") media.restoreMedia(ctx, id);
          else if (type === "comment") { const r = comments.moderate([id], "restore", uid); if (!r.done.length) throw new UserError("déjà restauré"); }
          else if (type === "pattern") appearance.restorePattern(id, uid);
          warns.push(...dep.warnings.map((w) => `${t.label} #${id} : ${w}`));
        } else if (type === "page") landing.deletePage(ctx, id);
        else if (type === "post") articles.purge(id);
        else if (type === "media") media.purgeMedia(ctx, id);
        else if (type === "comment") { const r = comments.moderate([id], "delete", uid); if (!r.done.length) throw new UserError("pas dans la corbeille"); }
        else if (type === "pattern") appearance.purgePattern(id);
        done.push(item);
      } catch (error) {
        if (!(error instanceof UserError) && !(error instanceof MarketingError)) return next(error);
        failed.push(`${t.label} #${id} : ${error.message.replace(/\.$/, "")}`);
      }
    }
    reportTrash(req, action === "restaurer" ? (done.length > 1 ? "restaurés" : "restauré") : (done.length > 1 ? "supprimés définitivement" : "supprimé définitivement"), done, [...failed, ...warns.map((w) => `À vérifier — ${w}`)]);
    if (action === "restaurer" && done.length && warns.length && !failed.length) flash(req, "ok", `${done.length} élément${done.length > 1 ? "s" : ""} restauré${done.length > 1 ? "s" : ""}, avec des points à vérifier.`, warns.join(" · "));
    res.redirect(back);
  });
  return router;
};
