// Tests A/B des pages (Site Web → Tests A/B, et depuis chaque page). La version B se compose dans l'éditeur visuel ;
// les résultats ne désignent un gagnant qu'avec des données suffisantes. Droits : ceux des pages (forms.read / forms.write).
const express = require("express");
const pages = require("../pages");
const abtests = require("../pages/abtests");
const { attempt, need } = require("./kit");

const intOrNull = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);

module.exports = () => {
  const router = express.Router();

  router.get("/site-web/tests-ab", need("forms.read"), (req, res) => {
    res.render("marketing/page-tests", { title: "Tests A/B des pages", active: "pagetests", tests: abtests.listTests(req.mk.ctx), STATUS: abtests.STATUS, GOALS: abtests.GOALS });
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
    });
  });
  router.post("/pages/:id(\\d+)/test-ab", need("forms.write"), (req, res, next) => {
    const page = loadPage(req, res);
    if (!page) return;
    attempt(req, res, next, `/marketing/pages/${page.id}/test-ab`, () => {
      abtests.createTest(req.mk.ctx, page.id, { name: req.body.name, goal: req.body.goal, trafficB: Number(req.body.traffic_b) });
      return "Test créé : la version B est une copie de la page. Modifiez-la dans l'éditeur, puis démarrez le test.";
    });
  });

  const testAction = (path, fn) => router.post(`/tests-ab/:tid(\\d+)${path}`, need("forms.write"), (req, res, next) => {
    const t = abtests.getTest(req.mk.ctx, intOrNull(req.params.tid));
    if (!t) return res.status(404).render("error", { message: "Test introuvable." });
    attempt(req, res, next, `/marketing/pages/${t.page_id}/test-ab?test=${t.id}`, () => fn(req, t));
  });
  testAction("", (req, t) => { abtests.updateTest(req.mk.ctx, t.id, { name: req.body.name, goal: req.body.goal, trafficB: Number(req.body.traffic_b) }); return "Réglages du test enregistrés."; });
  testAction("/demarrer", (req, t) => { abtests.startTest(req.mk.ctx, t.id); return t.status === "stopped" ? "Test repris." : "Test démarré : les visiteurs de la page voient désormais la version A ou la version B."; });
  testAction("/pause", (req, t) => { abtests.stopTest(req.mk.ctx, t.id); return "Test en pause : tous les visiteurs voient de nouveau la version A."; });
  testAction("/terminer", (req, t) => {
    const winner = req.body.winner === "b" ? "b" : "a";
    abtests.decideTest(req.mk.ctx, t.id, winner);
    return winner === "b" ? "Test terminé : la version B a été copiée dans le brouillon de la page. Vérifiez-la puis publiez-la." : "Test terminé : la page garde la version A.";
  });
  testAction("/supprimer", (req, t) => { abtests.deleteTest(req.mk.ctx, t.id); return "Test supprimé."; });
  return router;
};
