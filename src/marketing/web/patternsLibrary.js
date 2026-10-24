// KOLAKISA CMS → Apparence → Patterns : bibliothèque de compositions réutilisables d'UN site (intégrées + compositions du site), aperçu réel, insertion dans une page,
// enregistrement depuis une page, renommage, duplication, corbeille. UN écran partagé : le site vient de l'adresse vérifiée par le serveur (/sites/<id>/patterns → ?site=<id>),
// jamais d'un état global ; sans site choisi, c'est le site principal (équipe seulement). Tout passe par src/services/patternLibrary.js (aucun second format).
// Droits : appearance.read (voir, aperçu) · appearance.patterns (enregistrer, renommer, dupliquer, supprimer) · forms.write (insérer dans une page : c'est une modification de page).
const express = require("express");
const lib = require("../../services/patternLibrary");
const target = require("./siteTarget");
const { renderSections } = require("./sectionPreview");
const { recordAudit } = require("../audit");
const { MarketingError } = require("../errors");
const { UserError } = require("../../utils/errors");
const { need, safeJson } = require("./kit");

const BASE = "/marketing/site-web/patterns";

module.exports = () => {
  const router = express.Router();
  const json = express.json({ limit: "64kb" });
  const audit = (req, t, action, metadata) => { try { recordAudit(req.mk.ctx.db, { organizationId: req.mk.ctx.organizationId, userId: req.session.user.id, action, resourceType: "site", resourceId: t.siteId, metadata, siteId: t.siteId }); } catch { /* jamais bloquant */ } };
  const fail = (res, next, error) => {
    if (error instanceof UserError) return res.status(422).json({ ok: false, error: error.message });
    if (error instanceof MarketingError) return res.status(error.code === "not_found" ? 404 : error.code === "forbidden" || error.code === "forbidden_widget" ? 403 : error.code === "conflict" ? 409 : 422).json({ ok: false, error: error.message, conflict: error.code === "conflict" });
    return next(error);
  };
  const state = (req, t) => ({ builtin: lib.builtin(req.mk.ctx), mine: lib.mine(t.siteId), trash: lib.trash(t.siteId) });
  const readOnly = (t, res) => { if (t.readOnly) { res.status(409).json({ ok: false, error: "Ce site est archivé ou supprimé : restaurez-le avant de modifier ses patterns." }); return true; } return false; };

  router.get("/site-web/patterns", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const q = t.siteId ? `?site=${t.siteId}` : "";
    const can = (p) => req.mk.can(p);
    const boot = {
      siteId: t.siteId, siteName: t.name, principal: t.principal, readOnly: t.readOnly, query: q, base: BASE,
      ...state(req, t), pages: lib.pagesOf(req.mk.ctx, t.siteId),
      can: { manage: can("appearance.patterns") && !t.readOnly, insert: can("forms.write") && !t.readOnly },
      links: { editor: "/marketing/pages", styles: `/marketing/site-web/styles${q}`, menus: `/marketing/site-web/navigation${q}` },
    };
    const bootJson = safeJson(boot);
    res.set("Cache-Control", "no-store").render("marketing/patterns", { title: "Patterns", active: "apparence/patterns", T: t, BASE, bootJson, patternsJs: true });
  });

  // Aperçu réel (même gabarit que le site, styles du site) : rien n'est enregistré
  router.get("/site-web/patterns/apercu", need("appearance.read"), (req, res, next) => {
    const t = target(req, res); if (!t) return;
    try {
      const { label, sections } = lib.sectionsOf(req.mk.ctx, t.siteId, req.query.ref);
      renderSections(req, res, { siteId: t.siteId, sections, label: `Pattern « ${label} » — `, title: label });
    } catch (error) { if (error instanceof UserError) return res.status(404).render("error", { message: error.message }); next(error); }
  });
  // Sections d'une page du site (pour « enregistrer comme pattern »)
  router.get("/site-web/patterns/pages/:id(\\d+)/sections", need("appearance.read"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    try { const p = lib.pagesOf(req.mk.ctx, t.siteId).find((x) => x.id === Number(req.params.id)); if (!p) return res.status(404).json({ ok: false, error: "Page introuvable pour ce site." }); res.set("Cache-Control", "no-store").json({ ok: true, sections: p.sections }); } catch (error) { fail(res, next, error); }
  });

  const act = (path, perm, run) => router.post(`/site-web/patterns/${path}`, need(perm), json, (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (readOnly(t, res)) return;
    try { const out = run(req, t) || {}; res.set("Cache-Control", "no-store").json({ ok: true, ...state(req, t), ...out }); } catch (error) { fail(res, next, error); }
  });
  const b = (req) => (req.body && typeof req.body === "object" ? req.body : {});
  act("creer", "appearance.patterns", (req, t) => {
    const id = lib.createFromPage(req.mk.ctx, t.siteId, { pageId: b(req).pageId, indexes: b(req).sections, name: b(req).name, description: b(req).description, userId: req.session.user.id });
    audit(req, t, "pattern.created", { id }); return { created: id };
  });
  act("renommer", "appearance.patterns", (req, t) => { lib.rename(t.siteId, Number(b(req).id), { name: b(req).name, description: b(req).description }, req.session.user.id); audit(req, t, "pattern.renamed", { id: Number(b(req).id) }); });
  act("dupliquer", "appearance.patterns", (req, t) => { const id = lib.duplicate(t.siteId, Number(b(req).id), req.session.user.id); audit(req, t, "pattern.duplicated", { id }); return { created: id }; });
  act("supprimer", "appearance.patterns", (req, t) => { lib.trashOne(t.siteId, Number(b(req).id), req.session.user.id); audit(req, t, "pattern.trashed", { id: Number(b(req).id) }); });
  act("restaurer", "appearance.patterns", (req, t) => { lib.restoreOne(t.siteId, Number(b(req).id), req.session.user.id); audit(req, t, "pattern.restored", { id: Number(b(req).id) }); });
  act("purger", "appearance.patterns", (req, t) => { lib.purgeOne(t.siteId, Number(b(req).id)); audit(req, t, "pattern.purged", { id: Number(b(req).id) }); });
  act("inserer", "forms.write", (req, t) => {
    const ctx = req.mk.ctx;
    const r = lib.insert(ctx, t.siteId, { ref: b(req).ref, pageId: b(req).pageId, position: b(req).position, after: b(req).after });
    audit(req, t, "pattern.inserted", { ref: String(b(req).ref), pageId: r.pageId, added: r.added });
    return { inserted: r, pages: lib.pagesOf(ctx, t.siteId) };
  });
  return router;
};
module.exports.BASE = BASE;
