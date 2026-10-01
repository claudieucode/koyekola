// Route « Analytics » (jalon R7) : vue d'ensemble des envois sur une période, lecture seule.
const express = require("express");
const { getAnalyticsOverview, PERIODS } = require("../analytics");
const { need } = require("./kit");

module.exports = ({ db }) => {
  const router = express.Router();

  router.get("/analytics", need("analytics.read"), (req, res) => {
    const days = PERIODS.includes(Number(req.query.periode)) ? Number(req.query.periode) : undefined;
    const overview = getAnalyticsOverview(req.mk.ctx, { days });
    res.render("marketing/analytics", { title: "Analytics", active: "analytics", overview });
  });

  return router;
};
