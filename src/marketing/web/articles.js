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
      mois: /^\d{4}-(0[1-9]|1[0-2])$/.test(String(req.query.mois || "")) ? String(req.query.mois) : "",
    };
    // Tri par colonne (?orderby=titre|auteur|commentaires|date & order=asc|desc), validé côté serveur ; il l'emporte sur l'ancien ?tri=
    if (["titre", "auteur", "commentaires", "date"].includes(req.query.orderby)) filters.tri = req.query.orderby + (req.query.order === "desc" ? "_desc" : "");
    // Nombre d'articles par page : choisi dans « Options de l'écran », mémorisé dans un cookie de l'administration (borné côté serveur)
    const cookiePar = /(?:^|;\s*)mk_ar_par=(\d{1,3})/.exec(req.headers.cookie || "");
    const perPage = articles.clampPerPage(req.query.par || (cookiePar && cookiePar[1]) || articles.PER_PAGE);
    if (req.query.par) res.cookie("mk_ar_par", String(perPage), { path: "/marketing", sameSite: "lax", httpOnly: true, maxAge: 365 * 864e5 });
    const scope = siteContent.scopePredicate(req.mk.ctx, "post", "p.id"), termScope = siteContent.scopePredicate(req.mk.ctx, "term", "t.id"); // portée de site : liste ET effectifs
    const result = articles.list({ state, q: filters.q, author: filters.auteur, category: filters.categorie, tag: filters.etiquette, period: filters.periode, month: filters.mois, sort: filters.tri, page: req.query.page, perPage, scope });
    const active = state === "toutes" ? "articles" : `articles/${state}`;
    res.render("marketing/articles", {
      title: "Articles", active, state, filters, result, rows: result.rows, authors: articles.authors(scope), categories: articles.categoryTree(termScope), tagList: articles.tagList(termScope), months: articles.months(state, scope), perPage, STATUSES: blog.STATUSES, BLOG_BASE,
      canWrite: req.mk.can("articles.write") || req.mk.can("articles.edit_own"), canWriteAll: req.mk.can("articles.write"), me: req.session.user.id, canPublish: req.mk.can("articles.publish"), canDelete: req.mk.can("articles.delete"), isCreator: isCreator(req), cmsPagesJs: true, cmsArticlesJs: true,
    });
  };
  router.get(BASE.replace("/marketing", ""), need("articles.read"), showList("toutes"));
  router.get(/^\/site-web\/articles\/(brouillons|programmes|publies|corbeille)\/?$/, need("articles.read"), (req, res, next) => showList(SUBS[req.params[0]])(req, res, next));

  // ----- Création : titre → vrai article en brouillon → éditeur -----
  router.get("/site-web/articles/ajouter", canCreate, (req, res) => {
    // Ouverture directe de l'éditeur : l'article n'est créé en base qu'au premier enregistrement (dans le site administré)
    const site = siteContent.siteParam(req.mk.ctx);
    res.redirect(`/formateur/blog/nouveau${site ? `?site=${site}` : ""}`);
  });
  router.post("/site-web/articles", canCreate, (req, res, next) => {
    try {
      // Tout ou rien : l'article et son rattachement au site choisi (si l'équipe a choisi un site) sont écrits ensemble
      const post = transaction(req.mk.ctx.db, () => { const p = articles.createDraft({ title: req.body.title, userId: req.session.user.id }); siteContent.adopt(req.mk.ctx, { type: "post", id: p.id }); require("../../services/writing").applyDefaults(p.id, req.mk.ctx); return p; });
      res.redirect(`/formateur/blog/${post.id}/modifier`);
    } catch (error) { fail(req, res, next, BASE, error); }
  });

  // ----- Actions groupées et par article -----
  router.post("/site-web/articles/actions", (req, res, next) => (req.mk.can("articles.write") || req.mk.can("articles.edit_own") ? next() : res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." })), (req, res, next) => {
    const action = String(req.body.action || req.body.action2 || ""); // action2 : la barre du bas du tableau
    const needs = { publier: "articles.publish", depublier: "articles.publish", corbeille: "articles.write", restaurer: "articles.write", supprimer: "articles.delete", categorie: "articles.write", etiquette: "articles.write" }[action];
    const mayDo = ["corbeille", "restaurer", "categorie", "etiquette"].includes(action) ? req.mk.can("articles.write") || req.mk.can("articles.edit_own") : needs && req.mk.can(needs);
    if (!mayDo) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
    try {
      // Sans le droit sur TOUS les articles, seules les actions « corbeille » / « restaurer » sur SES articles passent
      let ids = req.body.ids, refused = 0;
      if (["corbeille", "restaurer", "categorie", "etiquette"].includes(action) && !req.mk.can("articles.write")) {
        const all = [...new Set([].concat(ids || []).flatMap((x) => String(x).split(",")).map(Number).filter((n) => Number.isInteger(n) && n > 0))];
        ids = all.filter((id) => mayManage(req, id)); refused = all.length - ids.length;
        if (!ids.length) throw new UserError("Vous ne pouvez gérer que vos propres articles.");
      }
      // Catégorie / étiquette à ajouter : un terme du site courant, vérifié côté serveur (jamais un terme d'un autre site)
      let extra = null;
      if (["categorie", "etiquette"].includes(action)) {
        const termId = Number(action === "categorie" ? req.body.categorie_id : req.body.etiquette_id);
        if (!Number.isInteger(termId) || !siteContent.allowedContent(req.mk.ctx, "term", termId)) throw new UserError(action === "categorie" ? "Choisissez une catégorie." : "Choisissez une étiquette.");
        extra = { termId };
      }
      const r = articles.bulk(action, ids, req.session.user.id, req, (id) => siteContent.allowedContent(req.mk.ctx, "post", id), extra); // hors portée = « article introuvable », sans aucune écriture
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
  // Modification rapide : titre, adresse, catégories, étiquettes, état (brouillon / publié). Droits : « les siens » ou tous ; publier exige articles.publish.
  router.post("/site-web/articles/:id(\\d+)/modification-rapide", (req, res, next) => {
    if (!mayManage(req, Number(req.params.id))) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'effectuer cette action." });
    const wantsStatus = ["published", "draft"].includes(req.body.status) ? req.body.status : undefined;
    if (wantsStatus && !req.mk.can("articles.publish") && wantsStatus !== (articles.get(Number(req.params.id)) || {}).status && wantsStatus === "published") return res.status(403).render("error", { message: "Vous n'avez pas la permission de publier." });
    next();
  }, (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!siteContent.allowedContent(req.mk.ctx, "post", id)) throw new UserError("Article introuvable.");
      const status = ["published", "draft"].includes(req.body.status) && req.mk.can("articles.publish") ? req.body.status : undefined;
      const p = articles.quickEdit(id, { title: req.body.title, slug: req.body.slug, categoryIds: req.body.categories_present ? [].concat(req.body.categories || []).flatMap((x) => String(x).split(",")) : undefined, tags: req.body.tags_present ? req.body.tags : undefined, status }, req.session.user.id, req, (t) => siteContent.allowedContent(req.mk.ctx, "term", t));
      flash(req, "ok", `« ${p.title} » mis à jour.`);
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
