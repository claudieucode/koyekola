// KOLAKISA CMS → Articles (palier 4) : gestion des articles du blog (liste, recherche, filtres, tri, pagination, actions groupées,
// création, duplication, corbeille, publication) au-dessus du blog EXISTANT. L'article s'écrit dans l'éditeur du blog
// (/formateur/blog, réservé au compte créateur) ; ici on le crée, le retrouve et le gère. Droits : articles.read (voir),
// articles.write (créer, dupliquer, corbeille, restaurer), articles.publish (publier, mettre hors ligne), articles.delete
// (supprimer définitivement, depuis la corbeille). Création : compte créateur seulement (l'éditeur lui est réservé).
const express = require("express");
const articles = require("../../services/articles");
const blog = require("../../services/blog");
const { UserError } = require("../../utils/errors");
const { need } = require("./kit");
const siteContent = require("../../services/siteContent");
const { transaction } = require("../db/tx");

const BASE = "/marketing/site-web/articles";
const SUBS = { brouillons: "brouillons", programmes: "programmes", publies: "publies", corbeille: "corbeille" };
// Propriété (palier 9) : « articles.write » = tous les articles ; « articles.edit_own » = seulement les siens (author_id). Les actions plus
// sensibles (publier, supprimer définitivement) gardent leur droit propre, sans variante « les siens ».
const ownerOf = (id) => (require("../../config/database").prepare("SELECT author_id FROM posts WHERE id = ?").get(id) || {}).author_id;
const mayManage = (req, id) => req.mk.can("articles.write") || (req.mk.can("articles.edit_own") && ownerOf(id) === req.session.user.id);
// Peut rédiger : le compte créateur, ou toute personne qui a « articles.write » (tous les articles) ou « articles.edit_own » (les siens) — l'éditeur s'ouvre alors pour elle
const isCreator = (req) => Boolean(req.session.user && (req.session.user.role === "formateur" || req.mk.can("articles.write") || req.mk.can("articles.edit_own")));
const canCreate = (req, res, next) => (req.mk.can("articles.write") || req.mk.can("articles.edit_own") ? next() : res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." }));
const BLOG_BASE = "/blog"; // adresse publique des articles (une seule constante : le préfixe pourra devenir un réglage)

module.exports = () => {
  const router = express.Router();
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; };
  // Retour : adresse demandée si elle est valide, sinon la liste (en conservant le site courant : un accès limité à un site n'entre que par « ?site= »)
  const withSite = (req, url) => { const s = siteContent.siteParam(req.mk.ctx); return s && !/[?&]site=/.test(url) ? `${url}${url.includes("?") ? "&" : "?"}site=${s}` : url; };
  const back = (req) => withSite(req, /^\/marketing\/site-web\/articles(\/[a-z]+)?(\?[^#\s]*)?$/.test(String(req.body.retour || "")) ? req.body.retour : BASE);
  const fail = (req, res, next, to, error) => {
    if (!(error instanceof UserError)) return next(error);
    flash(req, "error", error.message); res.redirect(to);
  };

  // ----- Liste -----
  const showList = (state) => (req, res) => {
    const filters = {
      q: String(req.query.q || "").trim().slice(0, 100), auteur: String(req.query.auteur || ""), categorie: String(req.query.categorie || "").trim().slice(0, 60), etiquette: /^\d{1,9}$/.test(String(req.query.etiquette || "")) ? String(req.query.etiquette) : "",
      periode: Object.hasOwn(articles.PERIODS, req.query.periode) ? String(req.query.periode) : "", tri: Object.hasOwn(articles.SORTS, req.query.tri) ? req.query.tri : "modifie",
    };
    const scope = siteContent.scopePredicate(req.mk.ctx, "post", "p.id"), termScope = siteContent.scopePredicate(req.mk.ctx, "term", "t.id"); // portée de site : liste ET effectifs
    const result = articles.list({ state, q: filters.q, author: filters.auteur, category: filters.categorie, tag: filters.etiquette, period: filters.periode, sort: filters.tri, page: req.query.page, scope });
    const active = state === "toutes" ? "articles" : `articles/${state}`;
    res.render("marketing/articles", {
      title: "Articles", active, state, filters, result, rows: result.rows, authors: articles.authors(scope), categories: articles.categoryTree(termScope), STATUSES: blog.STATUSES, BLOG_BASE,
      canWrite: req.mk.can("articles.write") || req.mk.can("articles.edit_own"), canWriteAll: req.mk.can("articles.write"), me: req.session.user.id, canPublish: req.mk.can("articles.publish"), canDelete: req.mk.can("articles.delete"), isCreator: isCreator(req), cmsPagesJs: true,
    });
  };
  router.get(BASE.replace("/marketing", ""), need("articles.read"), showList("toutes"));
  router.get(/^\/site-web\/articles\/(brouillons|programmes|publies|corbeille)\/?$/, need("articles.read"), (req, res, next) => showList(SUBS[req.params[0]])(req, res, next));

  // ----- Création : titre → vrai article en brouillon → éditeur -----
  router.get("/site-web/articles/ajouter", canCreate, (req, res) => {
    res.render("marketing/article-new", { title: "Nouvel article", active: "articles/ajouter", isCreator: isCreator(req), BASE });
  });
  router.post("/site-web/articles", canCreate, (req, res, next) => {
    try {
      // Tout ou rien : l'article et son rattachement au site choisi (si l'équipe a choisi un site) sont écrits ensemble
      const post = transaction(req.mk.ctx.db, () => { const p = articles.createDraft({ title: req.body.title, userId: req.session.user.id }); siteContent.adopt(req.mk.ctx, { type: "post", id: p.id }); return p; });
      res.redirect(`/formateur/blog/${post.id}/modifier`);
    } catch (error) { fail(req, res, next, BASE, error); }
  });

  // ----- Actions groupées et par article -----
  router.post("/site-web/articles/actions", (req, res, next) => (req.mk.can("articles.write") || req.mk.can("articles.edit_own") ? next() : res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." })), (req, res, next) => {
    const action = String(req.body.action || "");
    const needs = { publier: "articles.publish", depublier: "articles.publish", corbeille: "articles.write", restaurer: "articles.write", supprimer: "articles.delete" }[action];
    const mayDo = ["corbeille", "restaurer"].includes(action) ? req.mk.can("articles.write") || req.mk.can("articles.edit_own") : needs && req.mk.can(needs);
    if (!mayDo) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
    try {
      // Sans le droit sur TOUS les articles, seules les actions « corbeille » / « restaurer » sur SES articles passent
      let ids = req.body.ids, refused = 0;
      if (["corbeille", "restaurer"].includes(action) && !req.mk.can("articles.write")) {
        const all = [...new Set([].concat(ids || []).flatMap((x) => String(x).split(",")).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
        ids = all.filter((id) => mayManage(req, id)); refused = all.length - ids.length;
        if (!ids.length) throw new UserError("Vous ne pouvez gérer que vos propres articles.");
      }
      const r = articles.bulk(action, ids, req.session.user.id, req, (id) => siteContent.allowedContent(req.mk.ctx, "post", id)); // hors portée = « article introuvable », sans aucune écriture
      const n = r.done.length;
      const head = n ? `${n} article${n > 1 ? "s" : ""} ${r.label[n > 1 ? 1 : 0]}.` : "";
      const detail = r.failed.map((f) => `« ${f.title} » : ${f.message}`).join(" · ");
      if (!r.failed.length) flash(req, "ok", head);
      else if (!n) flash(req, "error", "Aucun article n'a pu être traité.", detail);
      else flash(req, "ok", `${head} ${r.failed.length} refusé${r.failed.length > 1 ? "s" : ""}.`, detail);
      res.redirect(back(req));
    } catch (error) { fail(req, res, next, back(req), error); }
  });
  const single = (path, perm, run, okText, own = false) => router.post(`/site-web/articles/:id(\\d+)/${path}`, (req, res, next) => {
    const ok = own ? mayManage(req, Number(req.params.id)) : req.mk.can(perm);
    if (!ok) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
    next();
  }, (req, res, next) => {
    try {
      if (!siteContent.allowedContent(req.mk.ctx, "post", Number(req.params.id))) throw new UserError("Article introuvable."); // défense en profondeur derrière la garde de portée des routes
      const p = run(Number(req.params.id), req.session.user.id, req);
      flash(req, "ok", typeof okText === "function" ? okText(p) : okText);
      res.redirect(back(req));
    } catch (error) { fail(req, res, next, back(req), error); }
  });
  single("dupliquer", "articles.write", articles.duplicate, (p) => `Copie créée en brouillon : « ${p.title} ».`, true);
  single("corbeille", "articles.write", articles.trash, "Article mis à la corbeille.", true);
  single("restaurer", "articles.write", articles.restore, "Article restauré en brouillon.", true);
  single("supprimer", "articles.delete", (id) => articles.purge(id), "Article supprimé définitivement.");
  single("publier", "articles.publish", articles.publish, "Article publié.");
  single("depublier", "articles.publish", articles.unpublish, "Article remis en brouillon.");
  return router;
};
