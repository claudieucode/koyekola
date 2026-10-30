// Page Generator (programme 21.4) : écran « Générateur de pages » d'un site. Le site vient de l'ADRESSE (/site-web/sites/:id/generateur), vérifié par le service ; jamais du plan ni d'un formulaire.
// Droits : forms.read (voir, aperçu) · forms.write (générer, appliquer, annuler). Ne publie jamais. L'IA (optionnelle) passe par ai.call côté serveur.
const express = require("express");
const gen = require("../../pageGen");
const { need } = require("./kit");
const { MarketingError } = require("../errors");
const { renderSections } = require("./sectionPreview");

module.exports = () => {
  const router = express.Router();
  const W = (id) => `/marketing/site-web/sites/${id}/generateur`;
  const sid = (req) => Number(req.params.id);
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, detail }; };
  const known = (e) => e instanceof MarketingError || (e && e.name === "Error" && typeof e.code === "string" && /^(not_configured|quota|auth|credit|rate|network|api|model|permission|refusal|too_long|bad_json)$/.test(e.code));
  const page = (fn) => (req, res, next) => { try { fn(req, res, next); } catch (e) { if (e instanceof MarketingError) return res.status(e.code === "not_found" ? 404 : e.code === "forbidden" ? 403 : 422).render("error", { message: e.message }); next(e); } };

  router.get("/site-web/sites/:id(\\d+)/generateur", need("forms.read"), page((req, res) => {
    const ctx = req.mk.ctx, id = sid(req);
    const plan = gen.planFromWizard(ctx, id);
    res.set("Cache-Control", "no-store").render("marketing/site-generator", { title: "Générateur de pages", active: "sites", marketingShell: true, mode: "index", siteId: id, W: W(id), planJson: JSON.stringify({ version: plan.version, site: plan.site, pages: plan.pages.map((p) => ({ key: p.key, name: p.name, type: p.type, goal: p.goal, sections: p.sections.map((s) => ({ key: s.key, kind: s.kind, title: s.title, text: s.text })) })) }, null, 2), runs: gen.listRuns(ctx, id), registry: gen.registry.snapshot(), canWrite: req.mk.can("forms.write") });
  }));
  router.post("/site-web/sites/:id(\\d+)/generateur/generer", need("forms.write"), async (req, res, next) => {
    const ctx = req.mk.ctx, id = sid(req);
    try {
      let plan;
      try { plan = JSON.parse(String(req.body.plan || "")); } catch { throw new MarketingError("invalid_field", "Le plan n'est pas un JSON valide."); }
      const only = [].concat(req.body.pages || []).flatMap((x) => String(x).split(",")).filter(Boolean);
      const run = await gen.generate(ctx, id, plan, { useAi: req.body.ia === "oui", only: only.length ? only : null });
      flash(req, "ok", "Proposition prête : rien n'est encore enregistré. Examinez-la, puis appliquez-la en brouillon.");
      res.redirect(`${W(id)}/${run.id}`);
    } catch (e) {
      if (!known(e)) return next(e);
      flash(req, "error", e.message); res.redirect(W(id));
    }
  });
  router.get("/site-web/sites/:id(\\d+)/generateur/:rid(\\d+)", need("forms.read"), page((req, res) => {
    const ctx = req.mk.ctx, id = sid(req);
    const run = gen.getRun(ctx, id, Number(req.params.rid));
    res.set("Cache-Control", "no-store").render("marketing/site-generator", { title: "Générateur de pages", active: "sites", marketingShell: true, mode: "run", siteId: id, W: W(id), run, strategies: gen.STRATEGIES, canWrite: req.mk.can("forms.write") });
  }));
  router.get("/site-web/sites/:id(\\d+)/generateur/:rid(\\d+)/apercu", need("forms.read"), page((req, res) => {
    const ctx = req.mk.ctx, id = sid(req);
    const run = gen.getRun(ctx, id, Number(req.params.rid));
    const p = run.result.pages.find((x) => x.key === String(req.query.page));
    if (!p || !p.sections.length) throw new MarketingError("not_found", "Page de la proposition introuvable.");
    renderSections(req, res, { siteId: id, sections: p.sections, label: "Proposition du générateur — rien n'est enregistré. ", title: p.name });
  }));
  router.post("/site-web/sites/:id(\\d+)/generateur/:rid(\\d+)/appliquer", need("forms.write"), (req, res, next) => {
    const ctx = req.mk.ctx, id = sid(req);
    try {
      const run = gen.getRun(ctx, id, Number(req.params.rid));
      const decisions = {};
      for (const p of run.result.pages) { const v = req.body[`strategie_${p.key}`]; if (v) decisions[p.key] = String(v); }
      const out = gen.apply(ctx, id, run.id, decisions, { confirmReplace: req.body.confirmer_remplacement === "oui" });
      flash(req, "ok", `${Object.keys(out).length} page(s) enregistrée(s) en brouillon. Aucune n'est publiée.`);
      res.redirect(`${W(id)}/${run.id}`);
    } catch (e) {
      if (!(e instanceof MarketingError)) return next(e);
      flash(req, "error", e.message); res.redirect(`${W(id)}/${Number(req.params.rid)}`);
    }
  });
  router.post("/site-web/sites/:id(\\d+)/generateur/:rid(\\d+)/annuler", need("forms.write"), (req, res, next) => {
    const ctx = req.mk.ctx, id = sid(req);
    try {
      const report = gen.undo(ctx, id, Number(req.params.rid));
      flash(req, "ok", "Génération annulée.", report.map((r) => `${r.key} : ${r.why}`).join("\n"));
    } catch (e) { if (!(e instanceof MarketingError)) return next(e); flash(req, "error", e.message); }
    res.redirect(`${W(id)}/${Number(req.params.rid)}`);
  });
  return router;
};
