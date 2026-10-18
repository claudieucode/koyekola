// R7 (lot 6.0) — Écran d'activation des modules d'un site : ÉQUIPE de l'organisation seulement, permission dédiée `sites.modules`. Une personne limitée à un site, même administrateur de ce site,
// ne peut ni ouvrir cet écran ni modifier l'activation (contrôle d'équipe en plus de la permission). Désactiver ne supprime aucune donnée.
const express = require("express");
const primarySite = require("../../services/primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire
const siteModules = require("../siteModules");
const { attempt, need } = require("./kit");
const { MarketingError } = require("../errors");

module.exports = () => {
  const router = express.Router();
  const teamOnly = (req, res, next) => (req.mk.siteOnly ? res.status(403).render("error", { message: "L'activation des modules est réservée à l'équipe de l'organisation." }) : next());
  const loadSite = (req, res) => {
    const site = req.mk.ctx.db.prepare(`SELECT id, name, deleted_at FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(req.mk.ctx.db)}`).get(Number(req.params.id), req.mk.ctx.organizationId);
    if (!site || site.deleted_at) { res.status(404).render("error", { message: "Site introuvable." }); return null; }
    return site;
  };

  router.get("/site-web/sites/:id(\\d+)/modules", need("sites.modules"), teamOnly, (req, res) => {
    const site = loadSite(req, res);
    if (!site) return;
    res.render("marketing/site-modules", { title: `Modules de ${site.name}`, active: "espace/reglages", site, modules: siteModules.listFor(req.mk.ctx, site.id) });
  });

  router.post("/site-web/sites/:id(\\d+)/modules/:module([a-z_]{2,30})", need("sites.modules"), teamOnly, (req, res, next) => {
    const site = loadSite(req, res);
    if (!site) return;
    attempt(req, res, next, `/marketing/site-web/sites/${site.id}/modules`, () => {
      if (req.body.etat !== "activer" && req.body.etat !== "desactiver") throw new MarketingError("invalid_field", "État demandé inconnu.");
      const enable = req.body.etat === "activer";
      const r = siteModules.setEnabled(req.mk.ctx, site.id, req.params.module, enable);
      const label = siteModules.MODULES[req.params.module] ? siteModules.MODULES[req.params.module].label : req.params.module;
      return r.changed ? (enable ? `Module « ${label} » activé pour ce site.` : `Module « ${label} » désactivé : ses données sont conservées.`) : `Module « ${label} » : aucun changement.`;
    });
  });
  return router;
};
