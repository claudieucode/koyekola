// KOLAKISA CMS → Commentaires (palier 6) : modération (Tous, En attente, Approuvés, Indésirables, Corbeille), actions réelles
// individuelles et groupées, réponse d'un modérateur, filtre par contenu, et réglages (Paramètres → Commentaires).
// Droits : comments.read (voir), comments.moderate (approuver, indésirable, corbeille, restaurer, répondre), comments.delete
// (suppression définitive), comments.email (voir les e-mails des invités) ; réglages : settings.read / settings.write.
const express = require("express");
const comments = require("../../services/comments");
const { UserError } = require("../../utils/errors");
const { need } = require("./kit");
const siteContent = require("../../services/siteContent");
const db = require("../../config/database");
const { recordAudit } = require("../audit");

const BASE = "/marketing/site-web/commentaires";
const TABS = [["", "Tous", "all"], ["les-miens", "Les miens", "mine"], ["en-attente", "En attente", "pending"], ["approuves", "Approuvés", "approved"], ["indesirables", "Indésirables", "spam"], ["corbeille", "Corbeille", "trash"]];
const STATUS_OF = { "en-attente": "pending", approuves: "approved", indesirables: "spam", corbeille: "trash" };
const ACTIONS = { approuver: ["approve", "comments.moderate"], desapprouver: ["unapprove", "comments.moderate"], indesirable: ["spam", "comments.moderate"], corbeille: ["trash", "comments.moderate"], restaurer: ["restore", "comments.moderate"], supprimer: ["delete", "comments.delete"] };
const DONE = { approve: ["approuvé", "approuvés"], unapprove: ["désapprouvé (remis en attente)", "désapprouvés (remis en attente)"], spam: ["marqué indésirable", "marqués indésirables"], trash: ["mis à la corbeille", "mis à la corbeille"], restore: ["restauré", "restaurés"], delete: ["supprimé définitivement", "supprimés définitivement"] };

module.exports = () => {
  const router = express.Router();
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; };
  const withSite = (req, url) => { const s = siteContent.siteParam(req.mk.ctx); return s && !/[?&]site=/.test(url) ? `${url}${url.includes("?") ? "&" : "?"}site=${s}` : url; };
  // Le commentaire est-il dans la vue courante ? Un accès limité reste dans son site ; l'équipe qui a choisi un site (ou le principal) n'agit que sur ce site.
  // Hors vue = « introuvable », sans écriture ni indice sur l'existence du commentaire.
  const inView = (ctx, id) => { const sc = siteContent.commentPredicate(ctx, "c"); return Boolean(db.prepare(`SELECT 1 FROM blog_comments c WHERE c.id = ?${sc ? " AND " + sc.sql : ""}`).get(Number(id), ...(sc ? sc.params : []))); };
  const back = (req) => withSite(req, /^\/marketing\/site-web\/commentaires(\/[a-z-]+)?(\?[^#\s]*)?$/.test(String(req.body.retour || "")) ? req.body.retour : BASE);

  // ----- Liste -----
  const show = (sub) => (req, res) => {
    const can = (p) => req.mk.can(p);
    const f = {
      q: String(req.query.q || "").trim().slice(0, 100), contenu: /^[a-z_]{1,20}:\d{1,9}$/.test(String(req.query.contenu || "")) ? String(req.query.contenu) : "",
      auteur: String(req.query.auteur || "").trim().slice(0, 60), periode: Object.hasOwn(comments.PERIODS, req.query.periode) ? String(req.query.periode) : "",
      tri: Object.hasOwn(comments.SORTS, req.query.tri) ? req.query.tri : "recent",
      type: Object.hasOwn(comments.TYPES, req.query.type) ? String(req.query.type) : "",
    };
    // Colonnes triables (?orderby=auteur|article|date & order=asc|desc) : liste fermée, ramenée aux tris du service
    const ob = { auteur: ["auteur", "auteur-desc"], article: ["contenu", "contenu-desc"], date: ["ancien", "recent"] }[String(req.query.orderby || "")];
    if (ob) f.tri = ob[String(req.query.order) === "desc" ? 1 : 0];
    const status = STATUS_OF[sub] || "";
    const me = sub === "les-miens" ? req.session.user.id : null;
    const scope = siteContent.commentPredicate(req.mk.ctx, "c"); // portée de site : liste, effectifs et filtre « contenu » ne montrent que les commentaires des articles du site
    const result = comments.list({ status: status || "", q: f.q, content: f.contenu, author: f.auteur, period: f.periode, sort: f.tri, page: req.query.page, includeEmail: can("comments.email"), scope, mine: me, type: f.type });
    const counts = comments.counts(f.contenu, scope, req.session.user.id);
    res.render("marketing/comments", {
      title: "Commentaires", active: sub ? `commentaires/${sub}` : "commentaires", sub, status, tabs: TABS, counts, f, result, rows: result.rows,
      contents: comments.commentedContents(100, siteContent.scopePredicate(req.mk.ctx, "post", "p.id")), focus: f.contenu && siteContent.allowedContent(req.mk.ctx, "post", Number(f.contenu.split(":")[1])) ? comments.contentInfo(...f.contenu.split(":").map((v, i) => (i ? Number(v) : v))) : null,
      TYPES: comments.TYPES, userId: req.session.user.id, canModerate: can("comments.moderate"), canDelete: can("comments.delete"), canEmail: can("comments.email"), cmsPagesJs: true, cmComments: true, STATUS_LABELS: comments.STATUS_LABELS, BASE,
      cfg: comments.settings(),
    });
  };
  router.get("/site-web/commentaires", need("comments.read"), show(""));
  router.get(/^\/site-web\/commentaires\/(les-miens|en-attente|approuves|indesirables|corbeille)\/?$/, need("comments.read"), (req, res, next) => show(req.params[0])(req, res, next));

  // ----- Actions (une seule logique pour un commentaire ou une sélection) -----
  const run = (req, res, next, key, ids) => {
    const spec = ACTIONS[key];
    if (!spec || !req.mk.can(spec[1])) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
    try {
      if (!comments.uniqueIds(ids).length) throw new UserError("Sélectionnez au moins un commentaire.");
      const r = comments.moderate(ids, spec[0], req.session.user.id, (id) => inView(req.mk.ctx, id)); // hors portée = « introuvable », sans écriture
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
  router.post("/site-web/commentaires/actions", need("comments.moderate"), (req, res, next) => run(req, res, next, String(req.body.action || req.body.action2 || ""), req.body.ids));
  router.post("/site-web/commentaires/:id(\\d+)/:action(approuver|desapprouver|indesirable|corbeille|restaurer|supprimer)", need("comments.moderate"), (req, res, next) => run(req, res, next, req.params.action, [req.params.id]));

  // ----- Modification : page complète (« Modifier ») et modification rapide dans la liste — même service, mêmes contrôles -----
  const editFields = (req) => {
    const b = req.body || {}, can = (p) => req.mk.can(p), out = { body: b.body };
    if (b.author_name !== undefined) out.author_name = b.author_name;
    if (b.author_email !== undefined && can("comments.email")) out.author_email = b.author_email;
    if (b.status !== undefined) out.status = b.status;
    return out;
  };
  router.get("/site-web/commentaires/:id(\\d+)/modifier", need("comments.moderate"), (req, res) => {
    if (!inView(req.mk.ctx, req.params.id)) return res.status(404).render("error", { message: "Commentaire introuvable." });
    const c = db.prepare("SELECT c.*, u.username, u.email AS user_email, p.title AS content_title, p.slug AS content_slug FROM blog_comments c LEFT JOIN users u ON u.id = c.user_id LEFT JOIN posts p ON c.content_type = 'post' AND p.id = c.content_id WHERE c.id = ?").get(Number(req.params.id));
    res.render("marketing/comment-edit", { title: "Modifier le commentaire", active: "commentaires", c, BASE, canEmail: req.mk.can("comments.email"), STATUS_LABELS: comments.STATUS_LABELS, COMMENT_MAX: comments.COMMENT_MAX, cmsPagesJs: true });
  });
  router.post("/site-web/commentaires/:id(\\d+)/modifier", need("comments.moderate"), (req, res, next) => {
    const quick = req.body.mode === "rapide";
    try {
      if (!inView(req.mk.ctx, req.params.id)) throw new UserError("Commentaire introuvable.");
      const r = comments.edit(Number(req.params.id), editFields(req), { actorId: req.session.user.id, canEmail: req.mk.can("comments.email") });
      if (r.unchanged) flash(req, "ok", "Aucune modification à enregistrer.");
      else {
        recordAudit(db, { organizationId: req.mk.ctx.organizationId, userId: req.session.user.id, action: "comment.edited", resourceType: "comment", resourceId: Number(req.params.id), siteId: (db.prepare("SELECT cs.site_id FROM blog_comments c JOIN mk_content_sites cs ON cs.content_type = 'post' AND cs.content_id = c.content_id WHERE c.id = ?").get(Number(req.params.id)) || {}).site_id, metadata: { fields: r.changed } });
        flash(req, "ok", `Commentaire modifié (${r.changed.join(", ")}).`);
      }
      res.redirect(quick ? back(req) : withSite(req, `${BASE}/${req.params.id}/modifier`));
    } catch (error) {
      if (!(error instanceof UserError)) return next(error);
      flash(req, "error", error.message); res.redirect(quick ? back(req) : withSite(req, `${BASE}/${req.params.id}/modifier`));
    }
  });

  // ----- Droit à l'effacement : tous les commentaires d'un invité, par son adresse e-mail (définitif, confirmé, journalisé sans l'adresse) -----
  router.post("/site-web/commentaires/effacer-invite", need("comments.email"), (req, res, next) => {
    if (!req.mk.can("comments.delete") || siteContent.restricted(req.mk.ctx)) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." }); // l'effacement d'un invité vaut pour TOUS les sites : équipe de l'organisation seulement
    try {
      if (req.body.confirm !== "1") throw new UserError("Cochez la confirmation : cette suppression est définitive.");
      const n = comments.purgeGuest(req.body.email);
      require("../audit").recordAudit(require("../../config/database"), { organizationId: req.mk.ctx.organizationId, userId: req.session.user.id, action: "comment.guest_erased", resourceType: "comment", metadata: { count: n } });
      flash(req, "ok", n ? `${n} commentaire${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""} définitivement.` : "Aucun commentaire d'invité n'est associé à cette adresse.");
      res.redirect("/marketing/site-web/commentaires");
    } catch (error) {
      if (!(error instanceof UserError)) return next(error);
      flash(req, "error", error.message); res.redirect("/marketing/site-web/commentaires");
    }
  });

  // ----- Réponse d'un modérateur : publiée tout de suite sous son compte -----
  router.post("/site-web/commentaires/:id(\\d+)/repondre", need("comments.moderate"), (req, res, next) => {
    try {
      if (!inView(req.mk.ctx, req.params.id)) throw new UserError("Commentaire introuvable.");
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
