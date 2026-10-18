// Route « Webhooks sortants » (/marketing/webhooks, jalon M5 — Intégrations, partie 2) : points d'accès, révélation
// du secret à la demande, liste de livraisons (dans mk_jobs, réutilisé — pas de table dédiée), rejeu d'une livraison abandonnée.
const express = require("express");
const primarySite = require("../../services/primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire
const webhooks = require("../webhooks");
const { retryDead } = require("../queue/jobs");
const { attempt, need, flashError } = require("./kit");
const { MarketingError } = require("../errors");

const DELIVERIES_LIMIT = 30;

// Livraisons récentes d'un point d'accès : lues dans mk_jobs (type 'webhook.deliver'), jamais dupliquées ailleurs
function recentDeliveries(db, organizationId, endpointId) {
  return db
    .prepare(
      `SELECT id, state, attempts, max_attempts, last_error, run_at, created_at, finished_at, json_extract(payload, '$.eventName') AS event_name
       FROM mk_jobs WHERE organization_id = ? AND type = 'webhook.deliver' AND json_extract(payload, '$.endpointId') = ?
       ORDER BY id DESC LIMIT ?`
    )
    .all(organizationId, endpointId, DELIVERIES_LIMIT);
}

// Sites proposables pour limiter la portée (R2) : seulement pour l'équipe de l'organisation ; un accès limité à un site n'a pas le choix (portée imposée par le serveur)
const sitesFor = (db, ctx) => (Number.isInteger(ctx.siteScope) ? [] : db.prepare(`SELECT id, name FROM mk_sites WHERE organization_id = ?${primarySite.excludeSql(db)} AND status = 'active' AND deleted_at IS NULL ORDER BY name`).all(ctx.organizationId));

module.exports = ({ db }) => {
  const router = express.Router();

  router.get("/webhooks", need("webhooks.manage"), (req, res) => {
    res.render("marketing/webhooks", { title: "Webhooks", active: "webhooks", endpoints: webhooks.listEndpoints(req.mk.ctx), events: webhooks.EVENTS, sites: sitesFor(db, req.mk.ctx) });
  });

  router.post("/webhooks", need("webhooks.manage"), (req, res, next) => {
    try {
      const events = Array.isArray(req.body.events) ? req.body.events : req.body.events ? [req.body.events] : [];
      const result = webhooks.createEndpoint(req.mk.ctx, { name: req.body.name, url: req.body.url, events, encryptionKey: process.env.ENCRYPTION_KEY, siteId: req.body.site_id ? Number(req.body.site_id) : null });
      req.session.mkNewWebhookSecret = result; // survit à la redirection ; retiré au premier GET (voir /webhooks/:id)
      res.redirect(`/marketing/webhooks/${result.id}`);
    } catch (error) {
      if (!(error instanceof MarketingError) && !/ENCRYPTION_KEY/.test(error.message)) return next(error);
      flashError(req, error instanceof MarketingError ? error.message : "ENCRYPTION_KEY est absente : impossible de chiffrer le secret du webhook.");
      res.redirect("/marketing/webhooks");
    }
  });

  router.get("/webhooks/:id", need("webhooks.manage"), (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const endpoint = webhooks.getEndpoint(req.mk.ctx, id);
      // Le secret complet n'apparaît qu'après un clic explicite sur « Révéler » (ou juste après la création) — jamais
      // par défaut. Retiré de la session AVANT le rendu (asynchrone) : sinon un rechargement pendant le rendu le montrerait encore.
      let secret = null;
      if (req.session.mkNewWebhookSecret && req.session.mkNewWebhookSecret.id === id) secret = req.session.mkNewWebhookSecret.secret;
      if (req.session.mkRevealSecret && req.session.mkRevealSecret.id === id) secret = req.session.mkRevealSecret.secret;
      delete req.session.mkNewWebhookSecret;
      delete req.session.mkRevealSecret;
      res.render("marketing/webhook", { title: endpoint.name, active: "webhooks", endpoint, events: webhooks.EVENTS, secret, deliveries: recentDeliveries(db, req.mk.ctx.organizationId, id) });
    } catch (error) {
      if (error instanceof MarketingError) return res.status(404).render("error", { message: error.message });
      next(error);
    }
  });

  router.post("/webhooks/:id/secret", need("webhooks.manage"), (req, res, next) => {
    try {
      const id = Number(req.params.id);
      req.session.mkRevealSecret = { id, secret: webhooks.revealSecret(req.mk.ctx, id, { encryptionKey: process.env.ENCRYPTION_KEY }) };
      res.redirect(`/marketing/webhooks/${id}`);
    } catch (error) {
      if (!(error instanceof MarketingError)) return next(error);
      flashError(req, error.message);
      res.redirect("/marketing/webhooks");
    }
  });

  router.post("/webhooks/:id/activer", need("webhooks.manage"), (req, res, next) => {
    attempt(req, res, next, () => `/marketing/webhooks/${req.params.id}`, () => webhooks.setEnabled(req.mk.ctx, Number(req.params.id), true));
  });
  router.post("/webhooks/:id/pause", need("webhooks.manage"), (req, res, next) => {
    attempt(req, res, next, () => `/marketing/webhooks/${req.params.id}`, () => webhooks.setEnabled(req.mk.ctx, Number(req.params.id), false));
  });
  router.post("/webhooks/:id/supprimer", need("webhooks.manage"), (req, res, next) => {
    attempt(req, res, next, "/marketing/webhooks", () => webhooks.deleteEndpoint(req.mk.ctx, Number(req.params.id)));
  });

  router.post("/webhooks/:id/tester", need("webhooks.manage"), (req, res, next) => {
    attempt(req, res, next, () => `/marketing/webhooks/${req.params.id}`, () => {
      webhooks.sendTestEvent(req.mk.ctx, Number(req.params.id));
      return "Événement de test envoyé : son résultat apparaîtra dans « Dernières livraisons » dans quelques instants (si le traitement en arrière-plan est actif).";
    });
  });

  router.post("/webhooks/:id/livraisons/:jobId/rejouer", need("webhooks.manage"), (req, res, next) => {
    attempt(req, res, next, () => `/marketing/webhooks/${req.params.id}`, () => {
      const ok = retryDead(db, Number(req.params.jobId), { organizationId: req.mk.ctx.organizationId });
      if (!ok) throw new MarketingError("not_found", "Cette livraison n'est plus en attente de rejeu (déjà reprise, ou introuvable).");
      return "Livraison remise en file : elle repartira dans les prochaines secondes (si le traitement en arrière-plan est actif).";
    });
  });

  return router;
};
