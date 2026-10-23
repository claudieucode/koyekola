// KOLAKISA CMS → Apparence → Éditeur du site : espace de travail d'UN site (navigateur de pages, parties globales, aperçu par appareil, publication) autour du VRAI Page Builder.
// UN écran partagé : le site vient de l'adresse vérifiée par le serveur (/sites/<id>/editeur-du-site → ?site=<id>), jamais d'un état global ; sans site choisi, c'est le site principal (équipe seulement).
// Aucun second éditeur : le canevas est le Page Builder existant, affiché dans le cadre (?cadre=1), avec son enregistrement automatique, son historique et ses contrôles.
// Droits : appearance.read (voir) · forms.read/forms.write (ouvrir / modifier une page dans le Page Builder) · pages.publish (publier).
const express = require("express");
const lib = require("../../services/siteEditor");
const target = require("./siteTarget");
const { recordAudit } = require("../audit");
const { MarketingError } = require("../errors");
const { UserError } = require("../../utils/errors");
const { need, safeJson } = require("./kit");

const BASE = "/marketing/site-web/editeur-du-site";

module.exports = () => {
  const router = express.Router();
  const json = express.json({ limit: "16kb" });
  const audit = (req, t, action, metadata) => { try { recordAudit(req.mk.ctx.db, { organizationId: req.mk.ctx.organizationId, userId: req.session.user.id, action, resourceType: "site", resourceId: t.siteId, metadata, siteId: t.siteId }); } catch { /* jamais bloquant */ } };
  const state = (req, t) => ({ ...lib.overview(req.mk.ctx, t.siteId), pending: lib.pending(req.mk.ctx, t.siteId) });

  router.get("/site-web/editeur-du-site", need("appearance.read"), (req, res) => {
    const t = target(req, res); if (!t) return;
    const q = t.siteId ? `?site=${t.siteId}` : "", can = (p) => req.mk.can(p);
    const boot = {
      siteId: t.siteId, readOnly: t.readOnly, query: q, base: BASE, ...state(req, t),
      can: { edit: can("forms.write") && !t.readOnly, publish: can("pages.publish") && !t.readOnly },
      urls: { pageEditor: "/marketing/pages", componentEditor: "/marketing/site-web/composants", preview: "/marketing/pages", settings: t.siteId ? `/marketing/site-web/sites/${t.siteId}/reglages` : "/marketing/site-web/parametres" },
      links: { pages: t.siteId ? `/marketing/site-web/sites/${t.siteId}/pages` : "/marketing/pages", menus: `/marketing/site-web/navigation${q}`, styles: `/marketing/site-web/styles${q}`, patterns: `/marketing/site-web/patterns${q}`, templates: `/marketing/site-web/templates${q}`,
        widgets: `/marketing/site-web/widgets${q}`, themes: `/marketing/site-web/themes${q}`, fonts: `/marketing/site-web/polices${q}`, customizer: `/marketing/site-web/personnaliser${q}`, header: t.siteId ? `/marketing/site-web/sites/${t.siteId}/reglages#entete` : "/marketing/site-web/apparence/en-tete", footer: t.siteId ? `/marketing/site-web/sites/${t.siteId}/reglages#entete` : "/marketing/site-web/apparence/pied-de-page" },
    };
    res.set("Cache-Control", "no-store").render("marketing/site-editor", { title: "Éditeur du site", active: "apparence", T: t, BASE, bootJson: safeJson(boot), siteEditorJs: true });
  });
  // État à jour (après une modification ou une publication)
  router.get("/site-web/editeur-du-site/etat", need("appearance.read"), (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    try { res.set("Cache-Control", "no-store").json({ ok: true, ...state(req, t) }); } catch (error) { next(error); }
  });
  router.post("/site-web/editeur-du-site/publier", need("pages.publish"), json, (req, res, next) => {
    const t = target(req, res, { json: true }); if (!t) return;
    if (t.readOnly) return res.status(409).json({ ok: false, error: "Ce site est archivé ou supprimé : restaurez-le avant de publier." });
    try {
      const results = lib.publishPages(req.mk.ctx, t.siteId, req.body && req.body.pageIds);
      audit(req, t, "site_editor.published", { ok: results.filter((r) => r.ok).map((r) => r.id), failed: results.filter((r) => !r.ok).map((r) => r.id) });
      res.set("Cache-Control", "no-store").json({ ok: true, results, ...state(req, t) });
    } catch (error) {
      if (error instanceof UserError) return res.status(422).json({ ok: false, error: error.message });
      if (error instanceof MarketingError) return res.status(error.code === "not_found" ? 404 : error.code === "forbidden" ? 403 : 422).json({ ok: false, error: error.message });
      next(error);
    }
  });
  return router;
};
module.exports.BASE = BASE;
