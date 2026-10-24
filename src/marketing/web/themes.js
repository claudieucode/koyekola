// KOLAKISA CMS → Apparence → Thèmes : liste des thèmes installés, catalogue / import, détails, aperçu réel, activation, retour au thème précédent et suppression.
// UN écran partagé (comme Articles et Pages) : le site vient de l'adresse vérifiée par le serveur (/sites/<id>/themes → ?site=<id>, ou « ?site= » / champ « site »),
// jamais d'un état global ; sans site choisi, c'est le site principal. Droits : appearance.read (voir) · appearance.styles (installer) · appearance.publish (activer, supprimer).
// Toute écriture est limitée au site de la requête ; un accès limité à un site ne peut agir que sur le sien (contrôlé ici ET par la garde de portée des routes).
const express = require("express");
const themes = require("../../services/themes");
const themeFiles = require("../../services/themeFiles");
const catalog = require("../themes/catalog");
const tokensLib = require("../pages/tokens");
const appearance = require("../../services/appearance");
const pages = require("../pages");
const { MarketingError } = require("../errors");
const { UserError } = require("../../utils/errors");
const { need } = require("./kit");

const BASE = "/marketing/site-web/themes";
const KEY = /^[a-z][a-z0-9-]{1,39}$/;

module.exports = () => {
  const router = express.Router();
  const flash = (req, type, text) => { req.session.mkFlash = { type, text, noReopen: true }; };

  const target = require("./siteTarget"); // le site visé : vérifié par le serveur (voir siteTarget.js)
  const to = (t, path = "", query = {}) => {
    const q = new URLSearchParams(); if (t.siteId) q.set("site", String(t.siteId));
    for (const [k, v] of Object.entries(query)) if (v !== "" && v != null) q.set(k, String(v));
    return `${BASE}${path}${q.toString() ? `?${q}` : ""}`;
  };
  const siteField = (t) => (t.siteId ? `<input type="hidden" name="site" value="${t.siteId}">` : "");
  const caps = (req) => ({ canInstall: req.mk.can("appearance.styles"), canActivate: req.mk.can("appearance.publish"), canDelete: req.mk.can("appearance.publish") });
  const base = (req, t, extra) => ({ active: "apparence/themes", BASE, T: t, to: (p, q) => to(t, p, q), siteField: siteField(t), fontStack: tokensLib.fontStackOf, cmsThemesJs: true, ...caps(req), ...extra });
  // Retour : jamais d'adresse libre ; toujours la liste (ou la page demandée de la liste fermée) DU site de la requête
  const done = (req, res, t, type, text, path = "") => { flash(req, type, text); res.redirect(to(t, path)); };
  const run = (req, res, next, t, path, action) => {
    if (t.readOnly) return done(req, res, t, "error", "Ce site est archivé ou supprimé : restaurez-le avant de changer ses thèmes.", path);
    try { const m = action(); done(req, res, t, "ok", m, path); }
    catch (error) {
      if (!(error instanceof UserError) && !(error instanceof MarketingError)) return next(error);
      done(req, res, t, "error", error.message, path);
    }
  };

  // ----- Liste des thèmes installés -----
  router.get("/site-web/themes", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const q = String(req.query.q || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 80);
    const all = themes.installed(t.siteId), list = themes.installed(t.siteId, { q });
    const st = t.siteId === null ? appearance.state(null) : null;
    res.render("marketing/themes", { ...base(req, t, {}), title: "Thèmes", q, all, list, readOnly: t.readOnly, draftPending: Boolean(st && st.hasDraft), activeTheme: all.find((x) => x.state === "active") });
  });

  // ----- Ajouter un thème : catalogue Kolakisa + paquet JSON -----
  router.get("/site-web/themes/ajouter", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const q = String(req.query.q || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 80);
    res.render("marketing/themes-add", { ...base(req, t, {}), title: "Ajouter un thème", q, offers: themes.available(t.siteId, { q }), readOnly: t.readOnly, maxKb: catalog.MAX_PACKAGE_BYTES / 1024 });
  });
  router.post("/site-web/themes/installer", need("appearance.styles"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    const pkg = typeof req.body.package === "string" ? req.body.package : "";
    if (t.readOnly) return done(req, res, t, "error", "Ce site est archivé ou supprimé : restaurez-le avant de changer ses thèmes.", "/ajouter");
    try {
      const theme = typeof req.body.package === "string" ? themes.installPackage(req.mk.ctx, t.siteId, pkg) : themes.installFromCatalog(req.mk.ctx, t.siteId, String(req.body.key || ""));
      done(req, res, t, "ok", `Thème « ${theme.name} » installé sur « ${t.name} ». Prévisualisez-le puis activez-le.`);
    } catch (error) {
      if (!(error instanceof UserError) && !(error instanceof MarketingError)) return next(error);
      done(req, res, t, "error", error.message, "/ajouter");
    }
  });

  // ----- Détails et aperçu -----
  const themeOf = (req, res, t) => {
    const key = String(req.params.key);
    const theme = KEY.test(key) ? themes.get(t.siteId, key) : null;
    if (!theme) { res.status(404).render("error", { message: "Ce thème n'est pas installé sur ce site." }); return null; }
    return theme;
  };
  router.get("/site-web/themes/:key/details", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const theme = themeOf(req, res, t); if (!theme) return;
    res.render("marketing/themes-detail", { ...base(req, t, {}), title: theme.name, theme, readOnly: t.readOnly, previousKey: null });
  });
  // Aperçu : la vraie page du site (sa page d'accueil, ou la première page) est affichée avec les jetons du thème, sans rien enregistrer
  router.get("/site-web/themes/:key/apercu", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const key = String(req.params.key);
    const theme = KEY.test(key) ? (themes.get(t.siteId, key) || themes.available(t.siteId).find((x) => x.key === key) || null) : null;
    if (!theme) return res.status(404).render("error", { message: "Thème introuvable." });
    let frame = null;
    if (t.principal) frame = "/";
    else {
      const list = pages.listPages(req.mk.ctx, { siteId: t.siteId }).filter((p) => p.kind !== "step" && !p.archived_at).sort((a, b) => a.id - b.id);
      const first = list.find((p) => p.id === (t.site && t.site.home_page_id)) || list[0];
      if (first) frame = `/marketing/pages/${first.id}/apercu`;
    }
    res.set("Cache-Control", "no-store");
    res.render("marketing/themes-preview", { ...base(req, t, {}), title: `Aperçu : ${theme.name}`, theme, readOnly: t.readOnly,
      frame: frame ? `${frame}${frame.includes("?") ? "&" : "?"}kwtheme=${encodeURIComponent(theme.key)}` : null, installed: Boolean(themes.get(t.siteId, theme.key)) });
  });

  // ----- Activer, revenir, supprimer -----
  router.post("/site-web/themes/:key/activer", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    const key = String(req.params.key);
    run(req, res, next, t, "", () => {
      if (!KEY.test(key)) throw new UserError("Thème inconnu.");
      const th = themes.activate(req.mk.ctx, t.siteId, key);
      return `Thème « ${th.name} » activé sur « ${t.name} » : le site public l'utilise maintenant.`;
    });
  });
  router.post("/site-web/themes/revenir", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    run(req, res, next, t, "", () => { const th = themes.revert(req.mk.ctx, t.siteId); return `Retour au thème « ${th.name} » : l'apparence précédente de « ${t.name} » est rétablie.`; });
  });
  router.post("/site-web/themes/:key/supprimer", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    const key = String(req.params.key);
    run(req, res, next, t, "", () => {
      if (!KEY.test(key)) throw new UserError("Thème inconnu.");
      const r = themes.remove(req.mk.ctx, t.siteId, key);
      return `Thème « ${r.name} » supprimé de « ${t.name} ». Les pages, médias et réglages du site ne sont pas touchés.`;
    });
  });

  // ----- Éditeur de fichiers des thèmes : fichiers JSON virtuels du manifeste (voir services/themeFiles.js) ; aucun accès au disque -----
  // Lecture : appearance.read · écriture et restauration : appearance.publish (même droit que l'activation d'un thème, qui change le rendu public).
  const jsonErr = (res, status, code, message) => res.status(status).json({ ok: false, error: { code, message } });
  const guard = (req, res, fn) => {
    const t = target(req, res, { json: true }); if (!t) return;
    try { return fn(t); } catch (error) {
      if (error instanceof UserError || error instanceof MarketingError) return jsonErr(res, error.code === "conflit" ? 409 : 422, error.code === "conflit" ? "conflit" : "invalid", error.message);
      console.error("[KOLAKISA] Éditeur de fichiers des thèmes :", error && error.message);
      return jsonErr(res, 500, "server", "Une erreur est survenue. Rien n'a été modifié.");
    }
  };
  const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
  const keyOf = (v) => { const k = str(v, 40); return KEY.test(k) ? k : ""; };
  router.get("/site-web/themes/fichiers", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const all = themes.installed(t.siteId);
    const wanted = keyOf(req.query.theme);
    const chosen = all.find((x) => x.key === wanted) || all.find((x) => x.state === "active") || all[0];
    let tree = null, first = null;
    try { tree = themeFiles.tree(t.siteId, chosen.key); first = themeFiles.read(t.siteId, chosen.key, tree.files.some((f) => f.path === req.query.fichier) ? String(req.query.fichier) : "theme.json"); } catch { /* thème illisible : liste vide */ }
    res.set("Cache-Control", "no-store");
    res.render("marketing/themes-files", { ...base(req, t, { active: "apparence/fichiers" }), title: "Éditeur de fichiers des thèmes", themesList: all, chosen, tree, first, readOnly: t.readOnly, canWrite: req.mk.can("appearance.publish") && !t.readOnly, maxKb: themeFiles.MAX_FILE_BYTES / 1024, codeEditorJs: true });
  });
  router.get("/site-web/themes/fichiers/arbre", need("appearance.read"), (req, res) => guard(req, res, (t) => res.set("Cache-Control", "no-store").json({ ok: true, ...themeFiles.tree(t.siteId, keyOf(req.query.theme)) })));
  router.get("/site-web/themes/fichiers/lire", need("appearance.read"), (req, res) => guard(req, res, (t) => res.set("Cache-Control", "no-store").json({ ok: true, file: themeFiles.read(t.siteId, keyOf(req.query.theme), str(req.query.fichier, 80)), revisions: themeFiles.revisions(t.siteId, keyOf(req.query.theme), str(req.query.fichier, 80)) })));
  router.get("/site-web/themes/fichiers/version", need("appearance.read"), (req, res) => guard(req, res, (t) => res.set("Cache-Control", "no-store").json({ ok: true, revision: themeFiles.revision(t.siteId, keyOf(req.query.theme), str(req.query.fichier, 80), Number(req.query.id)) })));
  router.post("/site-web/themes/fichiers/enregistrer", need("appearance.publish"), (req, res) => guard(req, res, (t) => {
    if (t.readOnly) return jsonErr(res, 422, "invalid", "Ce site est archivé ou supprimé : restaurez-le avant de modifier ses thèmes.");
    const r = themeFiles.write(req.mk.ctx, t.siteId, keyOf(req.body.theme), str(req.body.fichier, 80), req.body.content, str(req.body.etag, 80));
    res.set("Cache-Control", "no-store").json({ ok: true, file: r, revisions: themeFiles.revisions(t.siteId, keyOf(req.body.theme), str(req.body.fichier, 80)), message: r.changed ? "Enregistré : le thème a été mis à jour." : "Aucun changement : le fichier est déjà à jour." });
  }));
  router.post("/site-web/themes/fichiers/restaurer", need("appearance.publish"), (req, res) => guard(req, res, (t) => {
    if (t.readOnly) return jsonErr(res, 422, "invalid", "Ce site est archivé ou supprimé : restaurez-le avant de modifier ses thèmes.");
    const r = themeFiles.restore(req.mk.ctx, t.siteId, keyOf(req.body.theme), str(req.body.fichier, 80), Number(req.body.id), str(req.body.etag, 80));
    res.set("Cache-Control", "no-store").json({ ok: true, file: r, revisions: themeFiles.revisions(t.siteId, keyOf(req.body.theme), str(req.body.fichier, 80)), message: "Version restaurée et enregistrée." });
  }));
  return router;
};
