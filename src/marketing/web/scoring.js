// Audience → Score des contacts : règles (événement → points, plafond), niveaux (froid, intéressé…), répartition réelle,
// contacts les plus engagés, recalcul à partir de l'historique. Droits : contacts.read (lecture), contacts.write.
const express = require("express");
const scoring = require("../scoring");
const { attempt, need } = require("./kit");

module.exports = () => {
  const router = express.Router();

  router.get("/score", need("contacts.read"), (req, res) => {
    const { ctx } = req.mk;
    const events = scoring.ruleEvents();
    // Choix des filtres (mêmes listes réelles que les déclencheurs d'automatisation)
    const pagesList = require("../pages").listPages(ctx);
    const funnelLib = require("../funnels");
    const funnels = funnelLib.listFunnels(ctx).map((f) => funnelLib.getFunnel(ctx, f.id));
    const choices = {
      pages: pagesList.map((p) => [String(p.id), p.name]),
      funnels: funnels.map((f) => [String(f.id), f.name]),
      funnelSteps: funnels.flatMap((f) => f.steps.map((s, i) => [String(s.id), `${f.name} — étape ${i + 1} : ${s.name}`])),
      forms: require("../forms").listForms(ctx).map((f) => [String(f.id), f.name]),
      courses: require("../bridge/catalog").listCourses(ctx).map((c) => [String(c.id), c.title]),
    };
    const label = (r) => {
      const f = events[r.event] && events[r.event].filters[0];
      const list = f && f[2] ? choices[f[2]] || [] : [];
      const hit = list.find((c) => c[0] === r.filter_value);
      return r.filter_value ? `${f ? f[1] : r.filter_key} : ${hit ? hit[1] : `n° ${r.filter_value}`}` : "";
    };
    res.render("marketing/scoring", {
      title: "Score des contacts", active: "scoring", rules: scoring.listRules(ctx).map((r) => ({ ...r, eventLabel: events[r.event] ? events[r.event].label : r.event, filterLabel: label(r) })),
      levels: scoring.levels(ctx), overview: scoring.overview(ctx), events, choices, canWrite: req.mk.can("contacts.write"),
    });
  });
  router.post("/score/regles", need("contacts.write"), (req, res, next) => {
    attempt(req, res, next, "/marketing/score#regles", () => {
      scoring.createRule(req.mk.ctx, { event: req.body.event, filterValue: req.body.filter_value, points: Number(req.body.points), maxTimes: req.body.max_times === "" ? null : Number(req.body.max_times) });
      return "Règle ajoutée : elle compte les actions à venir. « Recalculer » l'applique aussi à l'historique.";
    });
  });
  router.post("/score/regles/proposees", need("contacts.write"), (req, res, next) => {
    attempt(req, res, next, "/marketing/score#regles", () => {
      const n = scoring.addSuggested(req.mk.ctx);
      return n ? `${n} règle(s) proposée(s) ajoutée(s) : modifiez les points selon votre activité.` : "Les règles proposées existent déjà.";
    });
  });
  router.post("/score/regles/:id(\\d+)", need("contacts.write"), (req, res, next) => {
    attempt(req, res, next, "/marketing/score#regles", () => {
      const b = req.body;
      if (b.action === "supprimer") { scoring.deleteRule(req.mk.ctx, Number(req.params.id)); return "Règle supprimée (les points déjà attribués restent ; « Recalculer » les retire)."; }
      if (b.action === "activer" || b.action === "desactiver") { scoring.updateRule(req.mk.ctx, Number(req.params.id), { active: b.action === "activer" }); return b.action === "activer" ? "Règle activée." : "Règle désactivée."; }
      scoring.updateRule(req.mk.ctx, Number(req.params.id), { points: Number(b.points), maxTimes: b.max_times === "" ? null : Number(b.max_times) });
      return "Règle enregistrée.";
    });
  });
  router.post("/score/niveaux", need("contacts.write"), (req, res, next) => {
    attempt(req, res, next, "/marketing/score#niveaux", () => {
      const raw = req.body.levels && typeof req.body.levels === "object" ? Object.keys(req.body.levels).sort((a, b) => Number(a) - Number(b)).map((k) => req.body.levels[k]) : [];
      scoring.saveLevels(req.mk.ctx, raw.map((l) => ({ id: l.id, name: l.name, min: Number(l.min) })));
      return "Niveaux enregistrés.";
    });
  });
  router.post("/score/recalculer", need("contacts.write"), (req, res, next) => {
    attempt(req, res, next, "/marketing/score", () => {
      const r = scoring.recompute(req.mk.ctx);
      return `Scores recalculés à partir de l'historique : ${r.events} événement(s) comptés, ${r.contacts} contact(s) avec un score.`;
    });
  });
  return router;
};
