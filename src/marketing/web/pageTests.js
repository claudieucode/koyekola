// Tests A/B des pages (Site Web → Tests A/B, et depuis chaque page). La version B se compose dans l'éditeur visuel ;
// les résultats ne désignent un gagnant qu'avec des données suffisantes. Droits : ceux des pages (forms.read / forms.write).
const express = require("express");
const pages = require("../pages");
const abtests = require("../pages/abtests");
const { attempt, need } = require("./kit");

// Réglages envoyés par le formulaire : seuls les champs présents sont transmis (le moteur valide tout, rien n'est cru d'avance)
const settingsOf = (req) => {
  const b = req.body || {};
  const out = { name: b.name };
  if (b.goal !== undefined) out.goal = b.goal;
  if (b.traffic_b !== undefined) out.trafficB = Number(b.traffic_b);
  if (b.description !== undefined) out.description = b.description;
  if (b.confidence !== undefined) out.confidence = Number(b.confidence);
  if (b.attribution_days !== undefined) out.attributionDays = Number(b.attribution_days);
  if (b.min_views !== undefined) out.minViews = b.min_views === "" ? "" : Number(b.min_views);
  return out;
};
const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);

module.exports = () => {
  const router = express.Router();

  const STATUS_FILTERS = ["all", "draft", "running", "stopped", "completed", "archived"];
  router.get("/site-web/tests-ab", need("forms.read"), (req, res) => {
    const status = STATUS_FILTERS.includes(req.query.statut) ? req.query.statut : "all";
    const q = String(req.query.q || "").slice(0, 100);
    const sort = ["recent", "name", "status", "views"].includes(req.query.tri) ? req.query.tri : "recent";
    const list = abtests.searchTests(req.mk.ctx, { status, q, sort, page: Number(req.query.page) || 1 });
    res.render("marketing/page-tests", { title: "Tests A/B des pages", active: "pagetests", concluded: abtests.concludedTests(req.mk.ctx), list, tests: list.rows, filters: { status, q, sort }, STATUS_FILTERS, STATUS: abtests.STATUS, GOALS: abtests.GOALS, canWrite: req.mk.can("forms.write") });
  });

  const loadPage = (req, res) => {
    const p = pages.getPage(req.mk.ctx, intOrNull(req.params.id));
    if (!p) res.status(404).render("error", { message: "Page introuvable." });
    return p;
  };
  // Page d'un test : le test ouvert de la page (ou l'écran de création), et l'historique de ses tests
  router.get("/pages/:id(\\d+)/test-ab", need("forms.read"), (req, res) => {
    const page = loadPage(req, res);
    if (!page) return;
    const { ctx } = req.mk;
    const all = abtests.listTests(ctx, { pageId: page.id });
    const chosen = intOrNull(req.query.test);
    const test = (chosen && all.find((t) => t.id === chosen)) || all.find((t) => t.status !== "completed") || null;
    const full = test ? abtests.getTest(ctx, test.id) : null;
    res.render("marketing/page-test", {
      title: `Test A/B — ${page.name}`, active: "pagetests", page, test: full, history: all.filter((t) => !full || t.id !== full.id),
      results: full && full.status !== "draft" ? abtests.results(ctx, full) : null, variantPage: full && full.variant_page_id ? pages.getPage(ctx, full.variant_page_id) : null,
      STATUS: abtests.STATUS, GOALS: abtests.GOALS, canWrite: req.mk.can("forms.write"), MIN_VIEWS: abtests.MIN_VIEWS, MIN_CONVERSIONS: abtests.MIN_CONVERSIONS,
      hasForm: page.published.sections.some((s) => s.type === "form"),
      check: full && (full.status === "draft" || full.status === "stopped") ? abtests.validateStart(ctx, full) : null,
      step: ctx.db.prepare("SELECT s.name, f.id AS funnel_id, f.name AS funnel_name FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id WHERE s.page_id = ? AND s.organization_id = ? LIMIT 1").get(page.id, ctx.organizationId) || null,
    });
  });
  router.post("/pages/:id(\\d+)/test-ab", need("forms.write"), (req, res, next) => {
    const page = loadPage(req, res);
    if (!page) return;
    attempt(req, res, next, `/marketing/pages/${page.id}/test-ab`, () => {
      abtests.createTest(req.mk.ctx, page.id, settingsOf(req));
      return "Test créé : la version B est une copie de la page. Modifiez-la dans l'éditeur, puis démarrez le test.";
    });
  });

  const testAction = (path, fn) => router.post(`/tests-ab/:tid(\\d+)${path}`, need("forms.write"), (req, res, next) => {
    const t = abtests.getTest(req.mk.ctx, intOrNull(req.params.tid));
    if (!t) return res.status(404).render("error", { message: "Test introuvable." });
    attempt(req, res, next, `/marketing/pages/${t.page_id}/test-ab?test=${t.id}`, () => fn(req, t));
  });
  testAction("", (req, t) => { abtests.updateTest(req.mk.ctx, t.id, settingsOf(req)); return "Réglages du test enregistrés."; });
  testAction("/demarrer", (req, t) => { abtests.startTest(req.mk.ctx, t.id); return t.status === "stopped" ? "Test repris." : "Test démarré : les visiteurs de la page voient désormais la version A ou la version B."; });
  testAction("/pause", (req, t) => { abtests.stopTest(req.mk.ctx, t.id); return "Test en pause : tous les visiteurs voient de nouveau la version A."; });
  testAction("/terminer", (req, t) => {
    const winner = req.body.winner;
    abtests.decideTest(req.mk.ctx, t.id, winner);
    return winner === "b" ? "Test terminé : la version B a été copiée dans le brouillon de la page. Vérifiez-la puis publiez-la." : "Test terminé : la page garde la version A.";
  });
  testAction("/supprimer", (req, t) => { abtests.deleteTest(req.mk.ctx, t.id); return "Test supprimé."; });
  testAction("/archiver", (req, t) => { abtests.archiveTest(req.mk.ctx, t.id); return "Test archivé : ses résultats sont conservés."; });
  testAction("/restaurer", (req, t) => { abtests.restoreTest(req.mk.ctx, t.id); return "Test restauré."; });
  return router;
};
