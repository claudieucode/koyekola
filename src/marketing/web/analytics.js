// Route « Analytics » (jalon R7) : vue d'ensemble des envois sur une période, lecture seule ; et rapports comparatifs
// (point 9 de la parité Mailchimp) : filtres dans l'adresse (lien partageable), étiquettes de campagne, rapports
// enregistrés, export CSV.
const express = require("express");
const { getAnalyticsOverview, PERIODS } = require("../analytics");
const compare = require("../analytics/compare");
const engine = require("../analytics/engine");
const { MarketingError } = require("../errors");
const audience = require("../audience");
const segments = require("../segments");
const { attempt, need } = require("./kit");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);
const asArray = (v) => (Array.isArray(v) ? v : v === undefined ? [] : [v]);
// Filtres envoyés par un formulaire POST (champs cachés recopiés de la page) → adresse de retour du rapport
const backTo = (body) => `/marketing/analytics/comparer${body.query && /^[\w%=&.,:+-]*$/.test(body.query) ? `?${body.query}` : ""}`;

module.exports = ({ db }) => {
  const router = express.Router();

  router.get("/analytics", need("analytics.read"), (req, res) => {
    const days = PERIODS.includes(Number(req.query.periode)) ? Number(req.query.periode) : undefined;
    const overview = getAnalyticsOverview(req.mk.ctx, { days });
    res.render("marketing/analytics", { title: "Analytics", active: "analytics", overview });
  });

  // ---------- Tableau de bord central (palier 21) ----------
  const sitesOf = (ctx) => db.prepare("SELECT id, name FROM mk_sites WHERE organization_id = ? ORDER BY name COLLATE NOCASE").all(ctx.organizationId).filter((x) => !Number.isInteger(ctx.siteScope) || x.id === ctx.siteScope);
  const dashParams = (req) => ({ range: req.query.plage, from: req.query.du, to: req.query.au, source: req.query.source, device: req.query.appareil, model: req.query.modele });
  router.get("/analytics/global", need("analytics.read"), (req, res, next) => {
    try {
      const d = engine.dashboard(req.mk.ctx, dashParams(req));
      res.render("marketing/analytics-global", { title: "Tableau de bord Analytics", active: "analytics-global", d, sites: sitesOf(req.mk.ctx), canDefine: req.mk.can("automations.write"), query: req.query, flash: req.query.ok ? String(req.query.ok).slice(0, 120) : "" });
    } catch (error) {
      if (error instanceof MarketingError) return res.status(400).render("error", { message: error.message });
      next(error);
    }
  });
  // Export CSV d'un tableau (mêmes filtres, même portée de site, mêmes droits) — le système d'export des rapports existant (CSV), aucun autre
  const csvCell = (v) => { let t = v === null || v === undefined ? "" : String(v); if (/^[=+\-@\t\r]/.test(t)) t = `'${t}`; return /[",\n;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; };
  router.get("/analytics/global/export", need("analytics.read"), (req, res, next) => {
    try {
      const d = engine.dashboard(req.mk.ctx, dashParams(req));
      const S = d.sections, section = String(req.query.section || "");
      const tables = {
        pages: [["Page", "Type", "Pages vues", "Visiteurs"], (S.traffic.topPages || []).map((r) => [r.path, r.kind, r.pageViews, r.visitors])],
        sources: [["Source", "Campagne", "Sessions"], (S.traffic.sources || []).map((r) => [r.label, r.campaign, r.sessions])],
        produits: [["Formation", "Ventes", "Revenu (centimes)"], ((S.commerce && S.commerce.products) || []).map((r) => [r.title, r.sold, r.cents])],
        tunnels: [["Tunnel", "Entrées", "Terminés", "Abandons", "Conversion %", "Achats", "Revenu (centimes)"], ((S.funnels && S.funnels.rows) || []).map((r) => [r.name, r.entered, r.completed, r.abandoned, r.conversion === null ? "" : r.conversion, r.purchases, r.revenueCents])],
        conversions: [["Conversion", "Événement", "Filtre", "Événements", "Contacts"], ((S.conversions && S.conversions.rows) || []).map((r) => [r.label, r.event, r.filter, r.events, r.contacts])],
        attribution: [["Source", "Campagne", "Commandes", "Revenu (centimes)"], ((S.attribution && S.attribution.rows) || []).map((r) => [r.label, r.campaign, r.orders, r.revenueCents])],
      };
      if (!tables[section]) return res.status(404).render("error", { message: "Tableau inconnu." });
      const [head, rows] = tables[section];
      res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="analytics-${section}-${d.period.fromYmd}_${d.period.toYmd}.csv"`, "Cache-Control": "no-store" });
      res.send(`\ufeff${[head, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n")}\r\n`);
    } catch (error) {
      if (error instanceof MarketingError) return res.status(400).render("error", { message: error.message });
      next(error);
    }
  });
  // Conversions personnalisées : un événement déjà émis + un filtre simple (réservé à qui crée des scénarios, mêmes événements)
  router.post("/analytics/conversions", need("automations.write"), (req, res, next) =>
    attempt(req, res, next, "/marketing/analytics/global", () => {
      engine.createConversion(req.mk.ctx, { name: req.body.nom, event: req.body.evenement, filterKey: req.body.cle, filterValue: req.body.valeur, siteId: req.body.site });
      return "Conversion ajoutée : elle est comptée à partir des événements déjà enregistrés.";
    }));
  router.post("/analytics/conversions/:id/supprimer", need("automations.write"), (req, res, next) =>
    attempt(req, res, next, "/marketing/analytics/global", () => { if (!engine.deleteConversion(req.mk.ctx, req.params.id)) throw new MarketingError("not_found", "Conversion introuvable."); return "Conversion supprimée."; }));

  // ---------- Rapports comparatifs ----------
  const filtersOf = (req) => {
    const saved = intOrNull(req.query.rapport) ? compare.getSavedReport(req.mk.ctx, intOrNull(req.query.rapport)) : null;
    if (saved) return { saved, raw: compare.filtersOfSaved(req.mk.ctx, saved) };
    // « Comparer seulement les cochées » : les filtres en cours voyagent dans « query », la sélection dans « ids »
    if (typeof req.query.query === "string") return { saved: null, raw: { ...Object.fromEntries(new URLSearchParams(req.query.query)), ids: asArray(req.query.ids) } };
    return { saved: null, raw: req.query };
  };
  router.get("/analytics/comparer", need("analytics.read"), (req, res) => {
    const { ctx } = req.mk;
    const { saved, raw } = filtersOf(req);
    if (req.query.rapport && !saved) return res.status(404).render("error", { message: "Rapport introuvable." });
    const report = compare.compareReport(ctx, raw);
    res.render("marketing/analytics-compare", {
      title: saved ? saved.name : "Rapports comparatifs", active: "compare", report, saved, savedReports: compare.listSavedReports(ctx),
      lists: audience.listLists(ctx), segments: segments.listSegments(ctx), CHANNELS: compare.CHANNELS, GROUPS: compare.GROUPS, METRICS: compare.METRICS,
      canWrite: req.mk.can("campaigns.write"),
      // Date d'une campagne dans le fuseau de l'organisation (celui des filtres)
      day: ((f) => (ms) => f.format(new Date(ms)))(new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: report.filters.tz })),
    });
  });
  router.get("/analytics/comparer/export.csv", need("analytics.read"), (req, res) => {
    const { saved, raw } = filtersOf(req);
    const report = compare.compareReport(req.mk.ctx, raw);
    res.set("Content-Type", "text/csv; charset=utf-8");
    res.set("Content-Disposition", `attachment; filename="rapport-comparatif-${report.filters.from}-${report.filters.to}${saved ? `-${saved.id}` : ""}.csv"`);
    res.send(compare.toCsv(report));
  });
  router.post("/analytics/comparer/etiqueter", need("campaigns.write"), (req, res, next) => {
    attempt(req, res, next, backTo(req.body), () => {
      const op = req.body.op === "remove" ? "remove" : "add";
      const n = compare.tagCampaigns(req.mk.ctx, asArray(req.body.ids), req.body.tag, op);
      const tag = String(req.body.tag).trim();
      return op === "remove" ? `Étiquette « ${tag} » retirée de ${n} campagne${n > 1 ? "s" : ""}.` : `Étiquette « ${tag} » ajoutée à ${n} campagne${n > 1 ? "s" : ""}.`;
    });
  });
  router.post("/analytics/comparer/enregistrer", need("campaigns.write"), (req, res, next) => {
    let saved = null;
    attempt(req, res, next, () => (saved ? `/marketing/analytics/comparer?rapport=${saved.id}` : backTo(req.body)), () => {
      const filters = Object.fromEntries(new URLSearchParams(req.body.query || ""));
      saved = compare.saveReport(req.mk.ctx, { name: req.body.name, filters });
      return saved.updated ? "Rapport mis à jour." : "Rapport enregistré : retrouvez-le dans « Rapports enregistrés ».";
    });
  });
  router.post("/analytics/rapports/:id(\\d+)/supprimer", need("campaigns.write"), (req, res, next) => {
    attempt(req, res, next, "/marketing/analytics/comparer", () => {
      const r = compare.deleteSavedReport(req.mk.ctx, Number(req.params.id));
      return `Rapport « ${r.name} » supprimé (les campagnes ne sont pas touchées).`;
    });
  });

  return router;
};
