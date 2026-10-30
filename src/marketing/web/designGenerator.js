// AI Design Generator (programme 21.5) : écran « Direction artistique » d'un site. Le site vient de l'ADRESSE (/site-web/sites/:id/direction-artistique), vérifié par le service.
// Droits : appearance.read (voir) · appearance.styles (générer, appliquer, annuler — comme le personnalisateur). Écrit dans le BROUILLON du personnalisateur natif ; ne publie jamais.
const express = require("express");
const dg = require("../../designGen");
const tokensLib = require("../pages/tokens");
const { need } = require("./kit");
const { MarketingError } = require("../errors");

module.exports = () => {
  const router = express.Router();
  const W = (id) => `/marketing/site-web/sites/${id}/direction-artistique`;
  const sid = (req) => Number(req.params.id);
  const flash = (req, type, text, detail) => { req.session.mkFlash = { type, text, detail }; };
  const known = (e) => e instanceof MarketingError || (e && typeof e.code === "string" && /^(not_configured|quota|auth|credit|rate|network|api|model|permission|refusal|too_long|bad_json|module_disabled)$/.test(e.code)) || (e && e.name === "UserError");
  const page = (fn) => (req, res, next) => { try { fn(req, res, next); } catch (e) { if (e instanceof MarketingError) return res.status(e.code === "not_found" ? 404 : e.code === "forbidden" ? 403 : 422).render("error", { message: e.message }); next(e); } };
  const can = (req) => (p) => req.mk.can(p);

  router.get("/site-web/sites/:id(\\d+)/direction-artistique", need("appearance.read"), page((req, res) => {
    const ctx = req.mk.ctx, id = sid(req);
    res.set("Cache-Control", "no-store").render("marketing/site-design-generator", { title: "Direction artistique", active: "sites", marketingShell: true, mode: "index", siteId: id, W: W(id), brief: dg.defaultBrief(ctx, id), runs: dg.listRuns(ctx, id), canWrite: req.mk.can("appearance.styles") });
  }));
  router.post("/site-web/sites/:id(\\d+)/direction-artistique/generer", need("appearance.styles"), async (req, res, next) => {
    const ctx = req.mk.ctx, id = sid(req);
    try {
      const run = await dg.generate(ctx, id, { text: req.body.brief, category: req.body.category, sector: req.body.sector, country: req.body.country, lang: req.body.lang }, { useAi: req.body.ia === "oui" });
      flash(req, "ok", "Propositions prêtes : rien n'est modifié sur votre site. Comparez-les, puis appliquez-en une dans le brouillon du personnalisateur.");
      res.redirect(`${W(id)}/${run.id}`);
    } catch (e) { if (!known(e)) return next(e); flash(req, "error", e.message); res.redirect(W(id)); }
  });
  router.get("/site-web/sites/:id(\\d+)/direction-artistique/:rid(\\d+)", need("appearance.read"), page((req, res) => {
    const ctx = req.mk.ctx, id = sid(req);
    const run = dg.getRun(ctx, id, Number(req.params.rid));
    const key = run.proposals.some((p) => p.key === req.query.variante) ? req.query.variante : null;
    res.set("Cache-Control", "no-store").render("marketing/site-design-generator", { title: "Direction artistique", active: "sites", marketingShell: true, mode: "run", siteId: id, W: W(id), run, key, cmp: key ? dg.compare(ctx, id, run.id, key, { can: can(req) }) : null, FONTS: tokensLib.FONTS, canWrite: req.mk.can("appearance.styles"), custom: `/marketing/site-web/personnaliser?site=${id}` });
  }));
  router.post("/site-web/sites/:id(\\d+)/direction-artistique/:rid(\\d+)/appliquer", need("appearance.styles"), (req, res, next) => {
    const ctx = req.mk.ctx, id = sid(req), rid = Number(req.params.rid);
    try {
      const overwrite = req.body.remplacer_tout === "oui" ? "all" : [].concat(req.body.remplacer || []).flatMap((x) => String(x).split(",")).filter(Boolean);
      const r = dg.apply(ctx, id, rid, String(req.body.variante || ""), { overwrite, can: can(req), userId: req.session.user.id });
      flash(req, "ok", `${r.applied} réglage(s) ajoutés au brouillon du personnalisateur${r.protectedKept.length ? `, ${r.protectedKept.length} de vos réglages conservés` : ""}. Rien n'est publié : relisez puis publiez dans le personnalisateur.`);
    } catch (e) { if (!known(e)) return next(e); flash(req, "error", e.message); }
    res.redirect(`${W(id)}/${rid}`);
  });
  router.post("/site-web/sites/:id(\\d+)/direction-artistique/:rid(\\d+)/annuler", need("appearance.styles"), (req, res, next) => {
    const ctx = req.mk.ctx, id = sid(req), rid = Number(req.params.rid);
    try { const r = dg.undo(ctx, id, rid, { can: can(req), userId: req.session.user.id }); flash(req, "ok", `Annulé : le brouillon du personnalisateur est revenu à son état d'avant (${r.restored} réglage(s) en attente).`); }
    catch (e) { if (!known(e)) return next(e); flash(req, "error", e.message); }
    res.redirect(`${W(id)}/${rid}`);
  });
  return router;
};
