// KOLAKISA CMS → Apparence → Thèmes : liste des thèmes installés, catalogue / import, détails, aperçu réel, activation, retour au thème précédent et suppression.
// UN écran partagé (comme Articles et Pages) : le site vient de l'adresse vérifiée par le serveur (/sites/<id>/themes → ?site=<id>, ou « ?site= » / champ « site »),
// jamais d'un état global ; sans site choisi, c'est le site principal. Droits : appearance.read (voir) · appearance.styles (installer) · appearance.publish (activer, supprimer).
// Toute écriture est limitée au site de la requête ; un accès limité à un site ne peut agir que sur le sien (contrôlé ici ET par la garde de portée des routes).
const express = require("express");
const themes = require("../../services/themes");
const catalog = require("../themes/catalog");
const library = require("../themes/library");
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
  const base = (req, t, extra) => ({ active: "apparence/themes", BASE, T: t, to: (p, q) => to(t, p, q), siteField: siteField(t), fontStack: tokensLib.fontStackOf, fontName: (id) => { const f = require("../../utils/fontLibrary").byId(id); return f ? f.family : (tokensLib.FONTS && tokensLib.FONTS[id] ? tokensLib.FONTS[id].label : String(id)); }, cmsThemesJs: true, ...caps(req), ...extra });
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

  // ----- Bibliothèque : galerie filtrable (recherche, catégories, styles, état, tri, pagination côté serveur) -----
  const STYLE_LABELS = { minimaliste: "Minimaliste", editorial: "Éditorial", audacieux: "Audacieux", chaleureux: "Chaleureux", sombre: "Sombre", luxe: "Luxe", ludique: "Ludique", technique: "Technique", naturel: "Naturel", classique: "Classique", moderne: "Moderne", geometrique: "Géométrique" };
  const SORTS = { relevance: "Pertinence", name: "Nom (A → Z)", new: "Nouveautés" };
  const STATES = { "": "Tous", installed: "Installés", available: "Disponibles" };
  const galleryQuery = (req) => {
    const q = String(req.query.q || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 80);
    const category = library.CATEGORIES.some((c) => c.key === req.query.categorie) ? String(req.query.categorie) : "";
    const style = Object.hasOwn(STYLE_LABELS, req.query.style) ? String(req.query.style) : "";
    const state = Object.hasOwn(STATES, req.query.etat) ? String(req.query.etat) : "";
    const sort = Object.hasOwn(SORTS, req.query.tri) ? String(req.query.tri) : "relevance";
    return { q, category, style, state, sort, page: Number(req.query.page) || 1 };
  };
  router.get("/site-web/themes", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const f = galleryQuery(req);
    const g = themes.gallery(t.siteId, f);
    const all = themes.installed(t.siteId);
    const st = t.siteId === null ? appearance.state(null) : null;
    const url = (changes = {}) => { const m = { q: f.q, categorie: f.category, style: f.style, etat: f.state, tri: f.sort === "relevance" ? "" : f.sort, page: "", ...changes }; return to(t, "", Object.fromEntries(Object.entries(m).filter(([, v]) => v !== "" && v != null))); };
    const cur = themes.get(t.siteId, g.activeKey);
    const lib = themes.libraryItem(t.siteId, g.activeKey);
    const palette = (x) => ["primary", "secondary", "accent", "background"].map((k) => x.tokens.colors[k]);
    const active = lib ? { ...lib, hasPrevious: Boolean(cur && cur.hasPrevious) } : cur ? { ...cur, categoryLabel: "", previews: null, pages: [], palette: palette(cur), hasDemo: false } : null;
    const model = { ...base(req, t, {}), title: "Thèmes", f, g, url, STYLE_LABELS, SORTS, STATES, CATEGORIES: library.CATEGORIES, all, readOnly: t.readOnly, draftPending: Boolean(st && st.hasDraft), activeTheme: active, hasFilter: Boolean(f.q || f.category || f.style || f.state) };
    res.set("Cache-Control", "no-store");
    if (req.query.fragment === "1") return res.render("marketing/partials/themes-results", model);
    res.render("marketing/themes", model);
  });

  // ----- Importer un paquet de thème (le catalogue Kolakisa est dans la galerie) -----
  router.get("/site-web/themes/ajouter", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    res.render("marketing/themes-add", { ...base(req, t, {}), title: "Importer un paquet de thème", readOnly: t.readOnly, maxKb: catalog.MAX_PACKAGE_BYTES / 1024 });
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
    const key = String(req.params.key);
    const item = KEY.test(key) ? themes.libraryItem(t.siteId, key) : null;
    if (item && item.hasDemo) return res.render("marketing/themes-detail", { ...base(req, t, {}), title: item.name, theme: item, installedRow: themes.get(t.siteId, key), readOnly: t.readOnly, STYLE_LABELS, canDemo: req.mk.can("forms.write") && req.mk.can("appearance.styles") });
    const theme = themeOf(req, res, t); if (!theme) return;
    res.render("marketing/themes-detail-legacy", { ...base(req, t, {}), title: theme.name, theme, readOnly: t.readOnly, previousKey: null });
  });
  // Aperçu d'un thème de la bibliothèque : son site de démonstration COMPLET, isolé (aucun contenu du site n'est lu), page par page, avec choix de l'appareil.
  // « Avec le contenu de mon site » reprend l'aperçu historique (la vraie page du site avec les jetons du thème). Rien n'est enregistré.
  router.get("/site-web/themes/:key/apercu", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const key = String(req.params.key);
    const item = KEY.test(key) ? themes.libraryItem(t.siteId, key) : null;
    if (item && item.hasDemo && req.query.mode !== "site") {
      const pageKey = item.pages.some((p) => p.key === req.query.page) ? String(req.query.page) : item.pages[0].key;
      const qs = t.siteId ? `?site=${t.siteId}` : "";
      res.set("Cache-Control", "no-store");
      return res.render("marketing/themes-preview", { ...base(req, t, {}), title: `Aperçu : ${item.name}`, theme: item, pageKey, frame: `${BASE}/${key}/demo/${pageKey}${qs}`, readOnly: t.readOnly, canDemo: req.mk.can("forms.write") && req.mk.can("appearance.styles") });
    }
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
    res.render("marketing/themes-preview-legacy", { ...base(req, t, {}), title: `Aperçu : ${theme.name}`, theme, readOnly: t.readOnly,
      frame: frame ? `${frame}${frame.includes("?") ? "&" : "?"}kwtheme=${encodeURIComponent(theme.key)}` : null, installed: Boolean(themes.get(t.siteId, theme.key)) });
  });

  // ----- Activer, revenir, supprimer -----
  router.post("/site-web/themes/:key/activer", need("appearance.publish"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    const key = String(req.params.key);
    run(req, res, next, t, "", () => {
      if (!KEY.test(key)) throw new UserError("Thème inconnu.");
      const th = themes.activate(req.mk.ctx, t.siteId, key);
      let extra = "";
      // Pages de démonstration (facultatif, brouillons seulement) : jamais sans le droit de créer des pages
      if (req.body.demo === "1" && library.has(key)) {
        if (!req.mk.can("forms.write")) throw new UserError(`Thème « ${th.name} » activé, mais vous n'avez pas le droit de créer des pages : les pages de démonstration n'ont pas été ajoutées.`);
        const d = themes.installDemo(req.mk.ctx, t.siteId, key, { menu: req.body.menu === "1", can: (p) => req.mk.can(p) });
        extra = ` ${d.pages.length} pages de démonstration ont été ajoutées en brouillon${d.menu ? ` et le menu « ${d.menu.name} » a été créé` : ""}.`;
      }
      return `Thème « ${th.name} » activé sur « ${t.name} » : le site public l'utilise maintenant.${extra}`;
    });
  });
  router.post("/site-web/themes/:key/demo", need("forms.write"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    const key = String(req.params.key);
    run(req, res, next, t, `/${key}/details`, () => {
      if (!KEY.test(key) || !library.has(key)) throw new UserError("Ce thème n'a pas de site de démonstration.");
      if (!req.mk.can("appearance.styles")) throw new UserError("Vous n'avez pas la permission d'effectuer cette action.");
      const d = themes.installDemo(req.mk.ctx, t.siteId, key, { menu: req.body.menu === "1", can: (p) => req.mk.can(p) });
      return `${d.pages.length} pages de démonstration ajoutées à « ${t.name} » en brouillon${d.menu ? ` ; menu « ${d.menu.name} » créé` : ""}. Rien d'existant n'a été modifié ni publié.`;
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
  return router;
};
