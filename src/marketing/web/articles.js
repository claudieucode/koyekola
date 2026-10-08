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

const BASE = "/marketing/site-web/articles";
const SUBS = { brouillons: "brouillons", programmes: "programmes", publies: "publies", corbeille: "corbeille" };
const isCreator = (req) => Boolean(req.session.user && req.session.user.role === "formateur");
const BLOG_BASE = "/blog"; // adresse publique des articles (une seule constante : le préfixe pourra devenir un réglage)

module.exports = () => {
  const router = express.Router();
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, ...(detail ? { detail } : {}), noReopen: true }; };
  const back = (req) => (/^\/marketing\/site-web\/articles(\/[a-z]+)?(\?[^#\s]*)?$/.test(String(req.body.retour || "")) ? req.body.retour : BASE);
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
    const result = articles.list({ state, q: filters.q, author: filters.auteur, category: filters.categorie, tag: filters.etiquette, period: filters.periode, sort: filters.tri, page: req.query.page });
    const active = state === "toutes" ? "articles" : `articles/${state}`;
    res.render("marketing/articles", {
      title: "Articles", active, state, filters, result, rows: result.rows, authors: articles.authors(), categories: articles.categoryTree(), STATUSES: blog.STATUSES, BLOG_BASE,
      canWrite: req.mk.can("articles.write"), canPublish: req.mk.can("articles.publish"), canDelete: req.mk.can("articles.delete"), isCreator: isCreator(req), cmsPagesJs: true,
    });
  };
  router.get(BASE.replace("/marketing", ""), need("articles.read"), showList("toutes"));
  router.get(/^\/site-web\/articles\/(brouillons|programmes|publies|corbeille)\/?$/, need("articles.read"), (req, res, next) => showList(SUBS[req.params[0]])(req, res, next));

  // ----- Création : titre → vrai article en brouillon → éditeur -----
  router.get("/site-web/articles/ajouter", need("articles.write"), (req, res) => {
    res.render("marketing/article-new", { title: "Nouvel article", active: "articles/ajouter", isCreator: isCreator(req), BASE });
  });
  router.post("/site-web/articles", need("articles.write"), (req, res, next) => {
    if (!isCreator(req)) { flash(req, "error", "La rédaction des articles se fait dans l'éditeur du blog, réservé au compte créateur."); return res.redirect(BASE); }
    try {
      const post = articles.createDraft({ title: req.body.title, userId: req.session.user.id });
      res.redirect(`/formateur/blog/${post.id}/modifier`);
    } catch (error) { fail(req, res, next, BASE, error); }
  });

  // ----- Actions groupées et par article -----
  router.post("/site-web/articles/actions", need("articles.write"), (req, res, next) => {
    const action = String(req.body.action || "");
    const needs = { publier: "articles.publish", depublier: "articles.publish", corbeille: "articles.write", restaurer: "articles.write", supprimer: "articles.delete" }[action];
    if (!needs || !req.mk.can(needs)) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
    try {
      const r = articles.bulk(action, req.body.ids, req.session.user.id, req);
      const n = r.done.length;
      const head = n ? `${n} article${n > 1 ? "s" : ""} ${r.label[n > 1 ? 1 : 0]}.` : "";
      const detail = r.failed.map((f) => `« ${f.title} » : ${f.message}`).join(" · ");
      if (!r.failed.length) flash(req, "ok", head);
      else if (!n) flash(req, "error", "Aucun article n'a pu être traité.", detail);
      else flash(req, "ok", `${head} ${r.failed.length} refusé${r.failed.length > 1 ? "s" : ""}.`, detail);
      res.redirect(back(req));
    } catch (error) { fail(req, res, next, back(req), error); }
  });
  const single = (path, perm, run, okText) => router.post(`/site-web/articles/:id(\\d+)/${path}`, need(perm), (req, res, next) => {
    try {
      const p = run(Number(req.params.id), req.session.user.id, req);
      flash(req, "ok", typeof okText === "function" ? okText(p) : okText);
      res.redirect(back(req));
    } catch (error) { fail(req, res, next, back(req), error); }
  });
  single("dupliquer", "articles.write", articles.duplicate, (p) => `Copie créée en brouillon : « ${p.title} ».`);
  single("corbeille", "articles.write", articles.trash, "Article mis à la corbeille.");
  single("restaurer", "articles.write", articles.restore, "Article restauré en brouillon.");
  single("supprimer", "articles.delete", (id) => articles.purge(id), "Article supprimé définitivement.");
  single("publier", "articles.publish", articles.publish, "Article publié.");
  single("depublier", "articles.publish", articles.unpublish, "Article remis en brouillon.");
  return router;
};
