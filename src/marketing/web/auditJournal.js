// KOLAKISA CMS → Outils → Journal d'activité (écrans) : liste filtrée et paginée, détail d'un événement, export CSV. Lecture seule : aucune route n'écrit dans le journal sauf
// l'événement « audit.exported » (un export est lui-même une opération sensible, donc tracée). Portée : req.mk.ctx (imposée par le serveur) ; un accès limité à un site exige « audit.read ».
const express = require("express");
const journal = require("../auditJournal");
const { recordAudit } = require("../audit");
const { need } = require("./kit");

module.exports = ({ BASE, shell }) => {
  const router = express.Router();
  const PAGE = `${BASE}/logs`;
  // Un accès limité à un site ne lit le journal qu'avec « audit.read » du site (jamais par simple « tools.view »)
  const guard = (req, res, next) => (req.mk.siteOnly && !req.mk.can("audit.read") ? res.status(403).render("error", { message: "Vous n'avez pas la permission d'ouvrir cet écran." }) : next());
  const head = (req) => ({ title: "Journal d'activité", ...shell(req, null, "logs"), noSite: true });

  router.get("/site-web/outils/logs", need("tools.view"), guard, (req, res) => {
    const data = journal.list(req.mk.ctx, req.query);
    const opts = journal.choices(req.mk.ctx);
    const sites = req.mk.siteOnly ? [] : require("../pages").listSites(req.mk.ctx).map((s) => ({ id: s.id, name: s.name }));
    const url = (extra = {}) => { const s = journal.toQuery(data.filters, extra); return `${PAGE}${s ? `?${s}` : ""}`; };
    res.render("marketing/audit-journal", { ...head(req), PAGE, data, opts, sites, LEVELS: journal.LEVELS, url, here: journal.toQuery(data.filters), exportUrl: `${PAGE}/export.csv${journal.toQuery(data.filters) ? `?${journal.toQuery(data.filters)}` : ""}`,
      canExport: req.mk.can("tools.export") || req.mk.can("audit.read"), filtered: Boolean(data.filters.q || data.filters.level || data.filters.category || data.filters.actor || data.filters.site || data.filters.du || data.filters.au) });
  });

  router.get("/site-web/outils/logs/export.csv", need("tools.view"), guard, (req, res) => {
    if (!(req.mk.can("tools.export") || req.mk.can("audit.read"))) return res.status(403).render("error", { message: "Vous n'avez pas la permission d'exporter le journal." });
    const out = journal.csv(req.mk.ctx, req.query);
    // L'export est tracé (qui, combien de lignes, quels filtres) — jamais son contenu
    try { recordAudit(req.mk.ctx.db, { organizationId: req.mk.ctx.organizationId, userId: req.session.user.id, action: "audit.exported", resourceType: "audit", metadata: { rows: out.count, truncated: out.truncated, filters: journal.toQuery(out.filters) }, fallbackSiteId: req.mk.ctx.siteScope }); } catch { /* le journal ne bloque pas */ }
    res.set({ "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="journal-activite-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    res.send(out.text);
  });

  router.get("/site-web/outils/logs/:id(\\d+)", need("tools.view"), guard, (req, res) => {
    const e = journal.get(req.mk.ctx, req.params.id);
    if (!e) return res.status(404).render("error", { message: "Événement introuvable." });
    const filters = journal.normalize(req.query);
    const back = `${PAGE}${journal.toQuery(filters, { page: filters.page > 1 ? filters.page : "" }) ? `?${journal.toQuery(filters, { page: filters.page > 1 ? filters.page : "" })}` : ""}`;
    res.render("marketing/audit-journal-detail", { ...head(req), PAGE, e, back, here: journal.toQuery(filters) });
  });
  return router;
};
