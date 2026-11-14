// Menu « Extensions » : catalogue central, état par site, gestion, historique. Tout est branché sur le moteur (src/extensions) et la vraie base ; aucun interrupteur simulé.
// Réservé à l'équipe de l'organisation (permission `sites.modules` + équipe) : une personne limitée à un site n'y entre jamais. Chaque action est revérifiée côté serveur par le moteur.
const express = require("express");
const primarySite = require("../../services/primarySite");
const registry = require("../../extensions/registry");
const state = require("../../extensions/state");
const activation = require("../../extensions/activation");
const { attempt, need } = require("./kit");
const { MarketingError } = require("../errors");

const BASE = "/marketing/site-web/extensions";
const TABS = [["", "Toutes les extensions"], ["activees", "Activées"], ["desactivees", "Désactivées"], ["gestion", "Gestion"], ["historique", "Historique et activité"]];
const CATEGORY = { commerce: "Commerce", formation: "Formation", communication: "Communication", marketing: "Marketing", ia: "Intelligence artificielle", analyse: "Analyse", contenu: "Contenu", outils: "Outils" };
const ACTION = { enable: "Activée", disable: "Désactivée", refused: "Refusée", failed: "Échec (annulé)", settings: "Paramètre modifié" };

module.exports = () => {
  const router = express.Router();
  const teamOnly = (req, res, next) => (req.mk.siteOnly ? res.status(403).render("error", { message: "Cet écran est réservé à l'équipe de l'organisation." }) : next());
  const guard = [need("sites.modules"), teamOnly];
  const sitesOf = (ctx) => ctx.db.prepare(`SELECT id, name, status FROM mk_sites WHERE organization_id = ? AND deleted_at IS NULL${primarySite.excludeSql(ctx.db)} ORDER BY name COLLATE NOCASE`).all(ctx.organizationId);
  const reg = registry.load();

  // Données communes : sites, site choisi (paramètre validé contre la liste de l'organisation), extensions avec leur état pour ce site
  function model(req, tab) {
    const ctx = req.mk.ctx;
    const sites = sitesOf(ctx);
    const wanted = Number(req.query.site);
    const site = sites.find((s) => s.id === wanted) || sites[0] || null;
    const on = site ? new Set(state.enabledIds(ctx.db, ctx.organizationId, site.id)) : new Set();
    const counts = new Map(reg.ids.map((id) => [id, 0]));
    for (const s of sites) for (const id of state.enabledIds(ctx.db, ctx.organizationId, s.id)) counts.set(id, (counts.get(id) || 0) + 1);
    const items = reg.list().map((m) => ({ ...m, categoryLabel: CATEGORY[m.category] || m.category, enabled: on.has(m.id), activeSites: counts.get(m.id) || 0 }));
    const confirmId = reg.has(req.query.confirmer) ? req.query.confirmer : null;
    const confirmPlan = site && confirmId ? activation.plan(ctx, site.id, confirmId, !on.has(confirmId)) : null;
    return { tab, tabs: TABS.map(([slug, label]) => ({ slug, label, href: slug ? `${BASE}/${slug}` : BASE, current: slug === tab })), sites, site, items, totalSites: sites.length, confirmId, confirmPlan, CATEGORY, ACTION, BASE };
  }
  const render = (req, res, tab, title, extra = {}) => res.render("marketing/extensions", { title, active: tab ? `extensions/${tab}` : "extensions", query: req.query, ...model(req, tab), ...extra });

  router.get("/site-web/extensions", ...guard, (req, res) => render(req, res, "", "Toutes les extensions"));
  router.get("/site-web/extensions/activees", ...guard, (req, res) => render(req, res, "activees", "Extensions activées"));
  router.get("/site-web/extensions/desactivees", ...guard, (req, res) => render(req, res, "desactivees", "Extensions désactivées"));
  router.get("/site-web/extensions/gestion", ...guard, (req, res) => {
    const m = model(req, "gestion");
    const detail = reg.has(req.query.extension) ? reg.get(req.query.extension) : null;
    const settings = detail && m.site && detail.settings.length && state.isEnabled(req.mk.ctx.db, req.mk.ctx.organizationId, m.site.id, detail.id) ? activation.getSettings(req.mk.ctx, m.site.id, detail.id) : [];
    res.render("marketing/extensions", { title: "Gestion des extensions", active: "extensions/gestion", query: req.query, ...m, detail, settings, dependents: detail ? reg.dependentsOf(detail.id) : [], registry: reg });
  });
  router.get("/site-web/extensions/historique", ...guard, (req, res) => {
    const m = model(req, "historique");
    const ext = reg.has(req.query.extension) ? req.query.extension : null;
    const all = req.query.site === "tous" || !req.query.site;
    const events = activation.history(req.mk.ctx, { siteId: all ? null : (m.site && m.site.id), extension: ext, limit: 100 });
    res.render("marketing/extensions", { title: "Historique et activité", active: "extensions/historique", query: req.query, ...m, events, filterExt: ext, filterAll: all, registry: reg });
  });

  // Écritures : le moteur revérifie équipe, permission, site de l'organisation, dépendances, conflits, confirmation (désactivation) ; transaction unique.
  router.post("/site-web/extensions/sites/:id(\\d+)/:ext([a-z_]{2,30})/:etat(activer|desactiver)", ...guard, (req, res, next) => {
    const siteId = Number(req.params.id);
    const back = `${BASE}/gestion?site=${siteId}&extension=${encodeURIComponent(req.params.ext)}`;
    attempt(req, res, next, back, () => {
      const m = reg.get(req.params.ext);
      if (!m) throw new MarketingError("invalid_field", "Extension inconnue.");
      const enable = req.params.etat === "activer";
      const r = enable ? activation.enable(req.mk.ctx, siteId, m.id, { confirm: req.body.confirmer === "1" }) : activation.disable(req.mk.ctx, siteId, m.id, { confirm: req.body.confirmer === "1" });
      if (!r.changed) return `« ${m.name} » : aucun changement.`;
      return enable ? `« ${m.name} » activée pour ce site.` : `« ${m.name} » désactivée : toutes les données sont conservées.`;
    });
  });
  router.post("/site-web/extensions/sites/:id(\\d+)/:ext([a-z_]{2,30})/parametres", ...guard, (req, res, next) => {
    const siteId = Number(req.params.id);
    attempt(req, res, next, `${BASE}/gestion?site=${siteId}&extension=${encodeURIComponent(req.params.ext)}`, () => {
      const m = reg.get(req.params.ext);
      if (!m) throw new MarketingError("invalid_field", "Extension inconnue.");
      for (const s of m.settings) if (s.key in req.body || s.type === "boolean") activation.setSetting(req.mk.ctx, siteId, m.id, s.key, s.type === "boolean" ? (req.body[s.key] ? "1" : "0") : req.body[s.key]);
      return "Paramètres enregistrés.";
    });
  });
  return router;
};
