// KOLAKISA CMS → Apparence → Templates : bibliothèque professionnelle de modèles d'UN site (programme 20.4) — recherche, filtres, tri, pagination, détail, aperçu réel, importation (site complet, page, section,
// composant, modèle du Theme Builder), annulation, enregistrement de ses propres modèles, fichiers de modèle, secteurs administrables.
// UN écran partagé : le site vient de l'adresse vérifiée par le serveur (/sites/<id>/templates → ?site=<id>), jamais d'un état global ; sans site choisi, c'est le site principal (équipe seulement).
// Droits (toujours vérifiés ICI, côté serveur, jamais déduits de ce que l'écran affiche) : appearance.read (voir, rechercher, aperçu, détail) · forms.write (importer, annuler, enregistrer, modifier, supprimer, fichiers :
// ce sont des modifications de pages) · navigation.write (menu d'un pack) · appearance.styles (brouillon de styles) · appearance.templates (affecter un modèle de thème) ·
// templates.share (partager avec les sites de l'organisation) · templates.categories (secteurs personnalisés).
// Tout passe par src/services/templateCatalog.js, templateLibrary.js et templateStore.js : une seule transaction par import, un jeton d'idempotence, aucun contenu existant remplacé.
const express = require("express");
const catalog = require("../../services/templateCatalog");
const lib = require("../../services/templateLibrary");
const store = require("../../services/templateStore");
const patternLibrary = require("../../services/patternLibrary");
const target = require("./siteTarget");
const { renderSections } = require("./sectionPreview");
const { recordAudit } = require("../audit");
const { MarketingError } = require("../errors");
const { UserError } = require("../../utils/errors");
const { need, safeJson } = require("./kit");

const BASE = "/marketing/site-web/templates";

module.exports = () => {
  const router = express.Router();
  const json = express.json({ limit: "16kb" });
  const jsonFile = express.json({ limit: "600kb" });
  const audit = (req, t, action, metadata) => { try { recordAudit(req.mk.ctx.db, { organizationId: req.mk.ctx.organizationId, userId: req.session.user.id, action, resourceType: "site", resourceId: t.siteId, metadata, siteId: t.siteId }); } catch { /* jamais bloquant */ } };
  const can = (req) => (p) => req.mk.can(p);
  const body = (req) => (req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {});
  const fail = (res, next, error) => {
    if (error instanceof UserError) return res.status(error.status >= 400 && error.status < 500 && error.status !== 400 ? error.status : 422).json({ ok: false, error: error.message, ...(error.details ? { details: error.details } : {}) });
    if (error instanceof MarketingError) return res.status(error.code === "not_found" ? 404 : error.code === "forbidden" || error.code === "forbidden_widget" ? 403 : error.code === "conflict" || error.code === "duplicate" ? 409 : 422).json({ ok: false, error: error.message });
    return next(error);
  };
  const writable = (t, res, what = "modifier la bibliothèque") => { if (t.readOnly) { res.status(409).json({ ok: false, error: `Ce site est archivé ou supprimé : restaurez-le avant de ${what}.` }); return false; } return true; };
  const withLast = (t, result) => { for (const i of result.items) i.lastImport = lib.lastImport(t.siteId, i.ref); return result; };

  router.get("/site-web/templates", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const q = t.siteId ? `?site=${t.siteId}` : "", has = can(req);
    const initial = withLast(t, catalog.query(req.mk.ctx, t.siteId, { source: "pack", sort: "recent" }, { can: has }));
    const boot = {
      siteId: t.siteId, siteName: t.name, principal: t.principal, readOnly: t.readOnly, query: q, base: BASE, history: lib.history(t.siteId), initial, kinds: catalog.KINDS,
      can: { import: has("forms.write") && !t.readOnly, menu: has("navigation.write"), styles: has("appearance.styles"), assign: has("appearance.templates"), share: has("templates.share"), categories: has("templates.categories") && !t.readOnly },
      links: { editor: "/marketing/pages", pages: t.siteId ? `/marketing/site-web/sites/${t.siteId}/pages` : "/marketing/pages", menus: `/marketing/site-web/navigation${q}`, styles: `/marketing/site-web/styles${q}`, patterns: `/marketing/site-web/patterns${q}`, themeTemplates: "/marketing/site-web/modeles-de-theme" },
    };
    res.set("Cache-Control", "no-store").render("marketing/apparence-templates", { title: "Templates", active: "apparence/templates", T: t, BASE, bootJson: safeJson(boot), templatesJs: true });
  });

  // Recherche, filtres cumulables, tri, pagination : données réelles de la bibliothèque (jamais de compteur inventé)
  router.get("/site-web/templates/catalogue.json", need("appearance.read"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    try { res.set("Cache-Control", "no-store").json({ ok: true, ...withLast(t, catalog.query(req.mk.ctx, t.siteId, req.query, { can: can(req) })) }); } catch (error) { fail(res, next, error); }
  });
  router.get("/site-web/templates/detail.json", need("appearance.read"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    try { res.set("Cache-Control", "no-store").json({ ok: true, item: { ...catalog.detail(req.mk.ctx, t.siteId, String(req.query.ref || ""), { can: can(req) }), lastImport: lib.lastImport(t.siteId, String(req.query.ref || "")) } }); } catch (error) { if (error instanceof UserError) return res.status(404).json({ ok: false, error: error.message }); fail(res, next, error); }
  });
  router.get("/site-web/templates/secteurs.json", need("appearance.read"), (req, res) => {
    const t = target(req, res, { json: true }); if (!t) return;
    res.set("Cache-Control", "no-store").json({ ok: true, families: catalog.families(req.mk.ctx), all: catalog.sectorRows(req.mk.ctx, { all: true }) });
  });
  // Pages du site où une section peut être insérée (le site vient du serveur)
  router.get("/site-web/templates/pages.json", need("forms.write"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    try { res.set("Cache-Control", "no-store").json({ ok: true, pages: patternLibrary.pagesOf(req.mk.ctx, t.siteId).map((p) => ({ id: p.id, name: p.name, status: p.status, sections: p.sections })) }); } catch (error) { fail(res, next, error); }
  });

  // Aperçu réel d'UNE page du modèle (styles du site de la requête) : rien n'est créé, la page affichée est transitoire (jamais une page publiée)
  router.get("/site-web/templates/apercu", need("appearance.read"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    try {
      const { label, sections, tokens } = lib.sectionsOf(req.mk.ctx, t.siteId, req.query.ref, req.query.page ? String(req.query.page) : null);
      renderSections(req, res, { siteId: t.siteId, sections, label: `Modèle « ${label} » — `, title: label, tokens });
    } catch (error) { if (error instanceof UserError) return res.status(404).render("error", { message: error.message }); next(error); }
  });

  // Ce que l'importation ferait, sans rien écrire
  router.post("/site-web/templates/plan", need("forms.write"), json, (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    const b = body(req);
    try { res.set("Cache-Control", "no-store").json({ ok: true, plan: lib.plan(req.mk.ctx, t.siteId, { ref: b.ref, name: b.name, menu: b.menu === true, styles: b.styles === true, assign: b.assign === true, pageId: b.pageId, position: b.position, after: b.after, can: can(req) }) }); } catch (error) { fail(res, next, error); }
  });

  router.post("/site-web/templates/importer", need("forms.write"), json, (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (!writable(t, res, "importer un modèle")) return;
    const b = body(req);
    try {
      const out = lib.importTemplate(req.mk.ctx, t.siteId, { ref: b.ref, importKey: b.importKey, name: b.name, menu: b.menu === true, styles: b.styles === true, assign: b.assign === true, pageId: b.pageId, position: b.position, after: b.after, confirm: b.confirm === true, can: can(req), userId: req.session.user.id });
      if (!out.replay) audit(req, t, "template.imported", { ref: String(b.ref), kind: out.kind, pages: out.pages.length, menu: Boolean(out.menu), styles: out.styles, component: Boolean(out.component), inserted: out.inserted ? out.inserted.added : 0, theme: Boolean(out.theme) });
      res.set("Cache-Control", "no-store").json({ ok: true, result: out, history: lib.history(t.siteId) });
    } catch (error) { fail(res, next, error); }
  });
  router.post("/site-web/templates/annuler", need("forms.write"), json, (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (!writable(t, res, "annuler un import")) return;
    try {
      const out = lib.undoImport(req.mk.ctx, t.siteId, { id: Number(body(req).id), can: can(req), userId: req.session.user.id });
      audit(req, t, "template.import_undone", { importId: out.id, pages: out.pages, sections: out.sections, component: out.component, menu: out.menu });
      res.set("Cache-Control", "no-store").json({ ok: true, result: out, history: lib.history(t.siteId) });
    } catch (error) { fail(res, next, error); }
  });

  // ---------- Enregistrer ses propres modèles ----------
  router.post("/site-web/templates/enregistrer", need("forms.write"), json, (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (!writable(t, res, "enregistrer un modèle")) return;
    const b = body(req);
    try {
      const out = store.saveFromPage(req.mk.ctx, t.siteId, { kind: b.kind, pageId: b.pageId, indexes: b.indexes, name: b.name, description: b.description, category: b.category, replace: b.replace === true, sectors: b.sectors, keywords: b.keywords, language: b.language, siteType: b.siteType, userId: req.session.user.id });
      audit(req, t, "template.saved", { ref: out.ref, kind: out.kind });
      res.set("Cache-Control", "no-store").json({ ok: true, result: out });
    } catch (error) { fail(res, next, error); }
  });
  router.post("/site-web/templates/modifier", need("forms.write"), json, (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (!writable(t, res, "modifier un modèle")) return;
    const b = body(req), { kind, id } = (() => { try { return catalog.parseRef(b.ref); } catch { return {}; } })();
    if (kind !== "mine") return res.status(422).json({ ok: false, error: "Seuls vos modèles de pages peuvent être modifiés ici (les modèles officiels sont en lecture seule)." });
    try {
      const out = store.updateTemplate(req.mk.ctx, t.siteId, { id: Number(id), name: b.name, description: b.description, category: b.category, visibility: b.visibility, sectors: b.sectors, keywords: b.keywords, language: b.language, siteType: b.siteType, userId: req.session.user.id, can: can(req) });
      audit(req, t, "template.updated", { ref: out.ref, visibility: out.visibility });
      res.set("Cache-Control", "no-store").json({ ok: true, result: out });
    } catch (error) { fail(res, next, error); }
  });
  router.post("/site-web/templates/supprimer", need("forms.write"), json, (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (!writable(t, res, "supprimer un modèle")) return;
    try {
      const out = store.deleteTemplate(req.mk.ctx, t.siteId, { ref: body(req).ref, userId: req.session.user.id });
      audit(req, t, "template.deleted", { ref: out.ref });
      res.set("Cache-Control", "no-store").json({ ok: true, result: out });
    } catch (error) { fail(res, next, error); }
  });

  // ---------- Fichiers de modèle ----------
  router.get("/site-web/templates/export.json", need("forms.write"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    try {
      const doc = store.exportTemplate(req.mk.ctx, t.siteId, String(req.query.ref || ""));
      const file = String(doc.name).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "modele";
      res.set({ "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="${file}.kolakisa-template.json"`, "X-Content-Type-Options": "nosniff" }).type("application/json").send(JSON.stringify(doc, null, 2));
    } catch (error) { fail(res, next, error); }
  });
  router.post("/site-web/templates/importer-fichier", need("forms.write"), jsonFile, (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (!writable(t, res, "importer un fichier de modèle")) return;
    try {
      const out = store.importFile(req.mk.ctx, t.siteId, { document: req.body, userId: req.session.user.id, can: can(req) });
      audit(req, t, "template.file_imported", { ref: out.ref, kind: out.kind });
      res.set("Cache-Control", "no-store").json({ ok: true, result: out });
    } catch (error) { fail(res, next, error); }
  });

  // ---------- Secteurs personnalisés de l'organisation (les secteurs officiels sont en lecture seule) ----------
  router.post("/site-web/templates/secteurs", need("templates.categories"), json, (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    const b = body(req);
    try { const out = store.addSector(req.mk.ctx, { label: b.label, familySlug: b.familySlug, familyLabel: b.familyLabel, userId: req.session.user.id }); audit(req, t, "template.sector_added", { slug: out.slug }); res.set("Cache-Control", "no-store").json({ ok: true, sector: out, families: catalog.families(req.mk.ctx) }); } catch (error) { fail(res, next, error); }
  });
  router.post("/site-web/templates/secteurs/modifier", need("templates.categories"), json, (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    const b = body(req);
    try { store.updateSector(req.mk.ctx, { id: Number(b.id), label: b.label, active: b.active === undefined ? undefined : b.active === true }); audit(req, t, "template.sector_updated", { id: Number(b.id) }); res.set("Cache-Control", "no-store").json({ ok: true, families: catalog.families(req.mk.ctx) }); } catch (error) { fail(res, next, error); }
  });
  router.post("/site-web/templates/secteurs/supprimer", need("templates.categories"), json, (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    try { store.deleteSector(req.mk.ctx, { id: Number(body(req).id) }); audit(req, t, "template.sector_deleted", { id: Number(body(req).id) }); res.set("Cache-Control", "no-store").json({ ok: true, families: catalog.families(req.mk.ctx) }); } catch (error) { fail(res, next, error); }
  });
  return router;
};
module.exports.BASE = BASE;
