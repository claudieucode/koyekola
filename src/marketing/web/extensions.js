// Menu « Extensions » : catalogue central, état par site, gestion, historique. Tout est branché sur le moteur (src/extensions) et la vraie base ; aucun interrupteur simulé.
// Réservé à l'équipe de l'organisation (permission `sites.modules` + équipe) : une personne limitée à un site n'y entre jamais. Chaque action est revérifiée côté serveur par le moteur.
const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const primarySite = require("../../services/primarySite");
const registry = require("../../extensions/registry");
const state = require("../../extensions/state");
const activation = require("../../extensions/activation");
const { attempt, need } = require("./kit");
const { MarketingError } = require("../errors");

const BASE = "/marketing/site-web/extensions";
// Logo propre à chaque extension : public/img/extensions/<id>.svg (aucun code à ajouter pour une nouvelle extension : déposer son SVG ; sans fichier, la carte affiche l'initiale sur sa couleur)
const LOGO_DIR = path.join(__dirname, "..", "..", "..", "public", "img", "extensions");
const logoOf = (id) => (fs.existsSync(path.join(LOGO_DIR, `${id}.svg`)) ? `/img/extensions/${id}.svg` : null);
const TABS = [["", "Toutes les extensions"], ["activees", "Activées"], ["desactivees", "Désactivées"], ["gestion", "Gestion"], ["historique", "Historique et activité"]];
const CATEGORY = { commerce: "Commerce", formation: "Formation", communication: "Communication", marketing: "Marketing", ia: "Intelligence artificielle", analyse: "Analyse", contenu: "Contenu", outils: "Outils" };
const ACTION = { enable: "Activée", disable: "Désactivée", refused: "Refusée", failed: "Échec (annulé)", settings: "Paramètre modifié" };

module.exports = () => {
  const router = express.Router();
  const teamOnly = (req, res, next) => (req.mk.siteOnly ? res.status(403).render("error", { message: "Cet écran est réservé à l'équipe de l'organisation." }) : next());
  const guard = [need("sites.modules"), teamOnly];
  const sitesOf = (ctx) => ctx.db.prepare(`SELECT id, name, status FROM mk_sites WHERE organization_id = ? AND deleted_at IS NULL${primarySite.excludeSql(ctx.db)} ORDER BY name COLLATE NOCASE`).all(ctx.organizationId);
  const reg = registry.load();

  // Données communes : sites, site courant, extensions avec leur état pour ce site — UNE seule source de vérité (state.enabledIds → mk_site_modules, clé organisation + site) pour les cinq écrans.
  // `fixed` : espace d'UN site (adresse /sites/N/extensions…, site vérifié par le serveur) — jamais un autre site, pas de sélecteur.
  // Site courant (écran central) : paramètre ?site= validé contre la liste de l'organisation, sinon le dernier site choisi (session), sinon le premier site qui a au moins une extension activée, sinon le premier.
  function currentSite(req, sites, fixed) {
    const ctx = req.mk.ctx;
    if (fixed) return sites.find((s) => s.id === fixed) || null;
    const explicit = sites.find((s) => s.id === Number(req.query.site));
    const remembered = req.session && sites.find((s) => s.id === Number(req.session.mkExtSite));
    const withAny = sites.find((s) => state.enabledIds(ctx.db, ctx.organizationId, s.id).length);
    const site = explicit || remembered || withAny || sites[0] || null;
    if (site && req.session) req.session.mkExtSite = site.id;
    return site;
  }
  function model(req, tab, fixed = null) {
    const ctx = req.mk.ctx;
    const sites = fixed ? sitesOf(ctx).filter((s) => s.id === fixed) : sitesOf(ctx);
    const site = currentSite(req, sites, fixed);
    const on = site ? new Set(state.enabledIds(ctx.db, ctx.organizationId, site.id)) : new Set();
    const counts = new Map(reg.ids.map((id) => [id, 0]));
    const perSite = new Map();
    for (const s of sites) { const ids = state.enabledIds(ctx.db, ctx.organizationId, s.id); perSite.set(s.id, ids.length); for (const id of ids) counts.set(id, (counts.get(id) || 0) + 1); }
    const items = reg.list().map((m) => ({ ...m, logo: logoOf(m.id), categoryLabel: CATEGORY[m.category] || m.category, enabled: on.has(m.id), activeSites: counts.get(m.id) || 0 }));
    const confirmId = reg.has(req.query.confirmer) ? req.query.confirmer : null;
    const confirmPlan = site && confirmId ? activation.plan(ctx, site.id, confirmId, !on.has(confirmId)) : null;
    const root = fixed ? `${space(fixed)}/extensions` : BASE;
    const tally = { all: items.length, on: items.filter((m) => m.enabled).length, off: items.filter((m) => !m.enabled).length };
    const withActive = sites.filter((s) => s.id !== (site && site.id) && perSite.get(s.id)).map((s) => ({ id: s.id, name: s.name, n: perSite.get(s.id) }));
    const tabCount = { "": tally.all, activees: tally.on, desactivees: tally.off };
    return { tab, tally, withActive, tabs: TABS.map(([slug, label]) => ({ slug, label, count: site ? tabCount[slug] : undefined, href: slug ? `${root}/${slug}` : root, current: slug === tab })), sites, site, items, totalSites: fixed ? reg.ids.length && sitesOf(ctx).length : sites.length, confirmId, confirmPlan, CATEGORY, ACTION, BASE: root, inSite: Boolean(fixed), POSTBASE: BASE, loadError: null };
  }
  const space = (id) => `/marketing/site-web/sites/${id}`;
  const render = (req, res, tab, title, extra = {}) => res.render("marketing/extensions", { title, active: tab ? `extensions/${tab}` : "extensions", query: req.query, ...model(req, tab), ...extra });

  // Mêmes écrans à deux adresses : l'administration centrale (choix du site) et l'espace de CHAQUE site (site imposé par l'adresse, vérifié par le serveur).
  const PREFIXES = ["/site-web/extensions", "/site-web/sites/:id(\\d+)/extensions"];
  const fixedSite = (req, res) => {
    if (req.params.id === undefined) return { ok: true, fixed: null };
    const id = Number(req.params.id);
    if (!req.mk.site || req.mk.site.id !== id) { res.status(404).render("error", { message: "Site introuvable." }); return { ok: false }; }
    return { ok: true, fixed: id };
  };
  for (const P of PREFIXES) {
    const page = (tab, title, extra) => (req, res) => {
      const f = fixedSite(req, res); if (!f.ok) return;
      let m;
      try { m = model(req, tab, f.fixed); } catch (e) {
        // Échec de lecture : jamais « 0 sur 0 » — l'écran dit qu'il y a une erreur et propose de réessayer.
        req.log && req.log.error && req.log.error(e);
        return res.status(500).render("marketing/extensions", { title, extUi: true, active: tab ? `extensions/${tab}` : "extensions", query: req.query, tab, tabs: [], sites: [], site: null, items: [], tally: { all: 0, on: 0, off: 0 }, withActive: [], totalSites: 0, confirmId: null, confirmPlan: null, CATEGORY, ACTION, BASE: f.fixed ? `${space(f.fixed)}/extensions` : BASE, inSite: Boolean(f.fixed), POSTBASE: BASE, loadError: "Les extensions n'ont pas pu être lues. Aucune donnée n'a été modifiée.", detail: null, settings: [], dependents: [], registry: reg, events: [], total: 0, filters: {}, lastChanges: {} });
      }
      res.render("marketing/extensions", { title, extUi: true, active: tab ? `extensions/${tab}` : "extensions", query: req.query, ...m, ...(extra ? extra(req, m, f.fixed) : {}) });
    };
    router.get(P, ...guard, page("", "Toutes les extensions"));
    router.get(`${P}/activees`, ...guard, page("activees", "Extensions activées"));
    router.get(`${P}/desactivees`, ...guard, page("desactivees", "Extensions désactivées"));
    router.get(`${P}/gestion`, ...guard, page("gestion", "Gestion des extensions", (req, m) => {
      const detail = reg.has(req.query.extension) ? reg.get(req.query.extension) : null;
      const settings = detail && m.site && detail.settings.length && state.isEnabled(req.mk.ctx.db, req.mk.ctx.organizationId, m.site.id, detail.id) ? activation.getSettings(req.mk.ctx, m.site.id, detail.id) : [];
      return { detail, settings, dependents: detail ? reg.dependentsOf(detail.id) : [], registry: reg, lastChanges: m.site ? activation.lastChanges(req.mk.ctx, m.site.id) : {} };
    }));
    router.get(`${P}/detail/:ext([a-z_]{2,30})`, ...guard, (req, res) => {
      const f = fixedSite(req, res); if (!f.ok) return;
      const m = model(req, "", f.fixed);
      const item = m.items.find((x) => x.id === req.params.ext);
      if (!item) return res.status(404).render("error", { message: "Extension introuvable." });
      const ctx = req.mk.ctx;
      const settings = m.site && item.settings.length && item.enabled ? activation.getSettings(ctx, m.site.id, item.id) : [];
      const events = m.site ? activation.history(ctx, { siteId: m.site.id, extension: item.id, limit: 10 }) : [];
      res.render("marketing/extension-detail", { title: item.name, extUi: true, active: "extensions", query: req.query, ...m, item, settings, events, registry: reg, dependents: reg.dependentsOf(item.id).map((id) => reg.get(id).name) });
    });
    router.get(`${P}/historique`, ...guard, page("historique", "Historique et activité", (req, m, fixed) => {
      const q = req.query;
      const ext = reg.has(q.extension) ? q.extension : null;
      const all = !fixed && (q.site === "tous" || !q.site);
      const action = activation.ACTIONS.includes(q.operation) ? q.operation : null;
      const from = /^\d{4}-\d{2}-\d{2}$/.test(q.du || "") ? q.du : "";
      const to = /^\d{4}-\d{2}-\d{2}$/.test(q.au || "") ? q.au : "";
      const text = String(q.q || "").trim().slice(0, 80);
      const PER = 25;
      const page = Math.max(1, Number.parseInt(q.page, 10) || 1);
      let res0 = { rows: [], total: 0 };
      res0 = activation.historyPage(req.mk.ctx, { siteId: all ? null : (m.site && m.site.id), extension: ext, action, from, to, q: text, limit: PER, offset: (page - 1) * PER });
      const filters = { site: all ? "tous" : (m.site && m.site.id), extension: ext || "", operation: action || "", du: from, au: to, q: text };
      const active = Boolean(ext || action || from || to || text || (!fixed && !all));
      return { events: res0.rows, total: res0.total, page, pages: Math.max(1, Math.ceil(res0.total / PER)), per: PER, filters, filtersActive: active, filterExt: ext, filterAll: all, registry: reg };
    }));
  }

  // Écritures : le moteur revérifie équipe, permission, site de l'organisation, dépendances, conflits, confirmation (désactivation) ; transaction unique.
  router.post("/site-web/extensions/sites/:id(\\d+)/:ext([a-z_]{2,30})/:etat(activer|desactiver)", ...guard, (req, res, next) => {
    const siteId = Number(req.params.id);
    const inSpace = req.body.espace === "1";
    const root = inSpace ? `${space(siteId)}/extensions` : BASE;
    const back = req.body.retour === "catalogue" ? (inSpace ? root : `${root}?site=${siteId}`)
      : req.body.retour === "detail" ? `${root}/detail/${encodeURIComponent(req.params.ext)}${inSpace ? "" : `?site=${siteId}`}`
      : inSpace ? `${root}/gestion?extension=${encodeURIComponent(req.params.ext)}` : `${BASE}/gestion?site=${siteId}&extension=${encodeURIComponent(req.params.ext)}`;
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
    attempt(req, res, next, req.body.espace === "1" ? `${space(siteId)}/extensions/gestion?extension=${encodeURIComponent(req.params.ext)}` : `${BASE}/gestion?site=${siteId}&extension=${encodeURIComponent(req.params.ext)}`, () => {
      const m = reg.get(req.params.ext);
      if (!m) throw new MarketingError("invalid_field", "Extension inconnue.");
      for (const s of m.settings) if (s.key in req.body || s.type === "boolean") activation.setSetting(req.mk.ctx, siteId, m.id, s.key, s.type === "boolean" ? (req.body[s.key] ? "1" : "0") : req.body[s.key]);
      return "Paramètres enregistrés.";
    });
  });
  return router;
};
