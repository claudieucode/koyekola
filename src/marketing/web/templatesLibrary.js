// KOLAKISA CMS → Apparence → Templates : bibliothèque de modèles d'UN site (packs de site, gabarits de pages, « Mes modèles »), aperçu réel et importation.
// UN écran partagé : le site vient de l'adresse vérifiée par le serveur (/sites/<id>/templates → ?site=<id>), jamais d'un état global ; sans site choisi, c'est le site principal (équipe seulement).
// Droits : appearance.read (voir, aperçu) · forms.write (importer : crée des pages) · en plus navigation.write (menu) et appearance.styles (brouillon de styles) pour ces options.
// Tout passe par src/services/templateLibrary.js : une seule transaction, un jeton d'idempotence, aucun contenu existant remplacé.
const express = require("express");
const lib = require("../../services/templateLibrary");
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
  const audit = (req, t, action, metadata) => { try { recordAudit(req.mk.ctx.db, { organizationId: req.mk.ctx.organizationId, userId: req.session.user.id, action, resourceType: "site", resourceId: t.siteId, metadata, siteId: t.siteId }); } catch { /* jamais bloquant */ } };
  const library = (req, t) => {
    const ctx = req.mk.ctx, items = [...lib.packs(ctx), ...lib.pageTemplates(ctx), ...lib.mine(ctx, t.siteId)];
    for (const i of items) i.lastImport = lib.lastImport(t.siteId, i.ref);
    return items;
  };

  router.get("/site-web/templates", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const q = t.siteId ? `?site=${t.siteId}` : "", can = (p) => req.mk.can(p);
    const boot = {
      siteId: t.siteId, siteName: t.name, principal: t.principal, readOnly: t.readOnly, query: q, base: BASE, items: library(req, t), history: lib.history(t.siteId),
      can: { import: can("forms.write") && !t.readOnly, menu: can("navigation.write"), styles: can("appearance.styles") },
      links: { editor: "/marketing/pages", pages: t.siteId ? `/marketing/site-web/sites/${t.siteId}/pages` : "/marketing/pages", menus: `/marketing/site-web/navigation${q}`, styles: `/marketing/site-web/styles${q}`, patterns: `/marketing/site-web/patterns${q}` },
    };
    res.set("Cache-Control", "no-store").render("marketing/apparence-templates", { title: "Templates", active: "apparence/templates", T: t, BASE, bootJson: safeJson(boot), templatesJs: true });
  });

  // Aperçu réel d'UNE page du modèle (styles du site de la requête) : rien n'est créé
  router.get("/site-web/templates/apercu", need("appearance.read"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    try {
      const { label, sections } = lib.sectionsOf(req.mk.ctx, t.siteId, req.query.ref, req.query.page ? String(req.query.page) : null);
      renderSections(req, res, { siteId: t.siteId, sections, label: `Modèle « ${label} » — `, title: label });
    } catch (error) { if (error instanceof UserError) return res.status(404).render("error", { message: error.message }); next(error); }
  });

  router.post("/site-web/templates/importer", need("forms.write"), json, (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (t.readOnly) return res.status(409).json({ ok: false, error: "Ce site est archivé ou supprimé : restaurez-le avant d'importer un modèle." });
    const b = req.body && typeof req.body === "object" ? req.body : {};
    try {
      const out = lib.importTemplate(req.mk.ctx, t.siteId, { ref: b.ref, importKey: b.importKey, name: b.name, menu: b.menu === true, styles: b.styles === true, can: (p) => req.mk.can(p), userId: req.session.user.id });
      if (!out.replay) audit(req, t, "template.imported", { ref: String(b.ref), pages: out.pages.length, menu: Boolean(out.menu), styles: out.styles });
      res.set("Cache-Control", "no-store").json({ ok: true, result: out, history: lib.history(t.siteId), items: library(req, t) });
    } catch (error) {
      if (error instanceof UserError) return res.status(422).json({ ok: false, error: error.message });
      if (error instanceof MarketingError) return res.status(error.code === "not_found" ? 404 : error.code === "forbidden" || error.code === "forbidden_widget" ? 403 : error.code === "conflict" || error.code === "duplicate" ? 409 : 422).json({ ok: false, error: error.message });
      next(error);
    }
  });
  return router;
};
module.exports.BASE = BASE;
