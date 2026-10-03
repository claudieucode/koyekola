// Route « Revenus » : ventes du site attribuées aux e-mails (dernier e-mail cliqué avant l'achat), réglage de la fenêtre.
const express = require("express");
const revenue = require("../revenue");
const { attempt, need } = require("./kit");

module.exports = () => {
  const router = express.Router();

  router.get("/revenus", need("analytics.read"), (req, res) => {
    const overview = revenue.revenueOverview(req.mk.ctx, { days: req.query.periode });
    res.render("marketing/revenue", { title: "Revenus", active: "revenue", overview, canSet: req.mk.can("settings.write"), limits: { min: revenue.MIN_WINDOW, max: revenue.MAX_WINDOW } });
  });

  router.post("/revenus/fenetre", need("settings.write"), (req, res, next) =>
    attempt(req, res, next, "/marketing/revenus#reglage", () => {
      const days = revenue.setWindowDays(req.mk.ctx, req.body.days);
      return `Fenêtre d'attribution : ${days} jour${days > 1 ? "s" : ""}. Elle s'applique aux prochaines commandes (les commandes déjà attribuées ne changent pas).`;
    }));

  return router;
};
