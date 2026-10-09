// KOLAKISA CMS → Commentaires (palier 6) : modération (Tous, En attente, Approuvés, Indésirables, Corbeille), actions réelles
// individuelles et groupées, réponse d'un modérateur, filtre par contenu, et réglages (Paramètres → Commentaires).
// Droits : comments.read (voir), comments.moderate (approuver, indésirable, corbeille, restaurer, répondre), comments.delete
// (suppression définitive), comments.email (voir les e-mails des invités) ; réglages : settings.read / settings.write.
const express = require("express");
const comments = require("../../services/comments");
const { UserError } = require("../../utils/errors");
const { need } = require("./kit");

const BASE = "/marketing/site-web/commentaires";
const TABS = [["", "Tous", "all"], ["en-attente", "En attente", "pending"], ["approuves", "Approuvés", "approved"], ["indesirables", "Indésirables", "spam"], ["corbeille", "Corbeille", "trash"]];
const STATUS_OF = { "en-attente": "pending", approuves: "approved", indesirables: "spam", corbeille: "trash" };
const ACTIONS = { approuver: ["approve", "comments.moderate"], indesirable: ["spam", "comments.moderate"], corbeille: ["trash", "comments.moderate"], restaurer: ["restore", "comments.moderate"], supprimer: ["delete", "comments.delete"] };
const DONE = { approve: ["approuvé", "approuvés"], spam: ["marqué indésirable", "marqués indésirables"], trash: ["mis à la corbeille", "mis à la corbeille"], restore: ["restauré", "restaurés"], delete: ["supprimé définitivement", "supprimés définitivement"] };

module.exports = () => {
  const router = express.Router();
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; };
  const back = (req) => (/^\/marketing\/site-web\/commentaires(\/[a-z-]+)?(\?[^#\s]*)?$/.test(String(req.body.retour || "")) ? req.body.retour : BASE);

  // ----- Liste -----
  const show = (sub) => (req, res) => {
    const can = (p) => req.mk.can(p);
    const f = {
      q: String(req.query.q || "").trim().slice(0, 100), contenu: /^[a-z_]{1,20}:\d{1,9}$/.test(String(req.query.contenu || "")) ? String(req.query.contenu) : "",
      auteur: String(req.query.auteur || "").trim().slice(0, 60), periode: Object.hasOwn(comments.PERIODS, req.query.periode) ? String(req.query.periode) : "",
      tri: Object.hasOwn(comments.SORTS, req.query.tri) ? req.query.tri : "recent",
    };
    const status = STATUS_OF[sub] || "";
    const result = comments.list({ status: status || "", q: f.q, content: f.contenu, author: f.auteur, period: f.periode, sort: f.tri, page: req.query.page, includeEmail: can("comments.email") });
    const counts = comments.counts(f.contenu);
    res.render("marketing/comments", {
      title: "Commentaires", active: sub ? `commentaires/${sub}` : "commentaires", sub, status, tabs: TABS, counts, f, result, rows: result.rows,
      contents: comments.commentedContents(), focus: f.contenu ? comments.contentInfo(...f.contenu.split(":").map((v, i) => (i ? Number(v) : v))) : null,
      canModerate: can("comments.moderate"), canDelete: can("comments.delete"), canEmail: can("comments.email"), cmsPagesJs: true, STATUS_LABELS: comments.STATUS_LABELS, BASE,
      cfg: comments.settings(),
    });
  };
  router.get("/site-web/commentaires", need("comments.read"), show(""));
  router.get(/^\/site-web\/commentaires\/(en-attente|approuves|indesirables|corbeille)\/?$/, need("comments.read"), (req, res, next) => show(req.params[0])(req, res, next));

  // ----- Actions (une seule logique pour un commentaire ou une sélection) -----
  const run = (req, res, next, key, ids) => {
    const spec = ACTIONS[key];
    if (!spec || !req.mk.can(spec[1])) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
    try {
      if (!comments.uniqueIds(ids).length) throw new UserError("Sélectionnez au moins un commentaire.");
      const r = comments.moderate(ids, spec[0], req.session.user.id);
      const n = r.done.length, label = DONE[spec[0]][n > 1 ? 1 : 0];
      const detail = r.skipped.map((s) => `#${s.id} : ${s.why}`).join(" · ");
      if (n && !r.skipped.length) flash(req, "ok", `${n} commentaire${n > 1 ? "s" : ""} ${label}.`);
      else if (n) flash(req, "ok", `${n} commentaire${n > 1 ? "s" : ""} ${label}. ${r.skipped.length} ignoré${r.skipped.length > 1 ? "s" : ""}.`, detail);
      else flash(req, "error", "Aucun commentaire n'a été modifié.", detail);
      res.redirect(back(req));
    } catch (error) {
      if (!(error instanceof UserError)) return next(error);
      flash(req, "error", error.message); res.redirect(back(req));
    }
  };
  router.post("/site-web/commentaires/actions", need("comments.moderate"), (req, res, next) => run(req, res, next, String(req.body.action || ""), req.body.ids));
  router.post("/site-web/commentaires/:id(\\d+)/:action(approuver|indesirable|corbeille|restaurer|supprimer)", need("comments.moderate"), (req, res, next) => run(req, res, next, req.params.action, [req.params.id]));

  // ----- Réponse d'un modérateur : publiée tout de suite sous son compte -----
  router.post("/site-web/commentaires/:id(\\d+)/repondre", need("comments.moderate"), (req, res, next) => {
    try {
      const actor = require("../../config/database").prepare("SELECT id, username, email, role FROM users WHERE id = ?").get(req.session.user.id);
      comments.reply(Number(req.params.id), actor, req.body.body, req.ip);
      flash(req, "ok", "Réponse publiée.");
      res.redirect(back(req));
    } catch (error) {
      if (!(error instanceof UserError)) return next(error);
      flash(req, "error", error.message); res.redirect(back(req));
    }
  });

  // Les réglages des commentaires se trouvent dans Paramètres → Commentaires (moteur de réglages, palier 14) : même adresse, même service

  return router;
};
