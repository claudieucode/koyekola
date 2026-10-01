// Route « Clés d'API » (/marketing/api, jalon M5 — Intégrations, partie 1) : créer, lister, révoquer.
const express = require("express");
const { createApiKey, listApiKeys, revokeApiKey } = require("../api/keys");
const { attempt, need, flashError } = require("./kit");
const { MarketingError } = require("../errors");

module.exports = ({ db }) => {
  const router = express.Router();

  router.get("/api", need("api_keys.manage"), (req, res) => {
    // La clé complète n'est affichée qu'une fois : on la retire de la session AVANT de rendre (res.render est
    // asynchrone — la retirer après aurait laissé une fenêtre où un rechargement pendant le rendu la montrerait encore).
    const created = req.session.mkNewKey || null;
    delete req.session.mkNewKey;
    res.render("marketing/api-keys", { title: "Clés d'API", active: "api", keys: listApiKeys(req.mk.ctx), created });
  });

  router.post("/api", need("api_keys.manage"), (req, res, next) => {
    try {
      const result = createApiKey(req.mk.ctx, { name: req.body.name, scope: req.body.scope });
      req.session.mkNewKey = result; // survit à la redirection, effacé par le prochain GET
      res.redirect("/marketing/api");
    } catch (error) {
      if (!(error instanceof MarketingError)) return next(error);
      flashError(req, error.message);
      res.redirect("/marketing/api");
    }
  });

  router.post("/api/:id/revoquer", need("api_keys.manage"), (req, res, next) => {
    attempt(req, res, next, "/marketing/api", () => revokeApiKey(req.mk.ctx, Number(req.params.id)));
  });

  return router;
};
