// API publique /api/v1 (jalon M5 — Intégrations, partie 1) : authentification par clé (Authorization: Bearer mk_live_…),
// JAMAIS par cookie — donc jamais de vérification d'origine (CSRF) à faire, une clé volée sur un autre site ne sert à
// rien sans être copiée. Réponses JSON homogènes : { data } en succès, { error: { code, message } } en échec.
//
// Extension mobile : overview (tableau de bord), campagnes (lecture + pilotage), listes.
const express = require("express");
const { authenticate } = require("./keys");
const { createRateLimiter } = require("../../middlewares/security");
const audience = require("../audience");
const { MarketingError } = require("../errors");
const sending = require("../sending");
const { getOverview } = require("../overview");

const RATE = 120; // requêtes par minute et par clé
const RATE_WINDOW = 60_000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const STATUS_OF = { invalid_field: 400, invalid_email: 400, duplicate: 409, not_found: 404, invalid_state: 400 };
const fail = (res, status, code, message) => res.status(status).json({ error: { code, message } });
const intId = (v) => (/^\d{1,12}$/.test(String(v ?? "")) ? Number(v) : null);

function createApiRouter({ db }) {
  const router = express.Router();
  const limiter = createRateLimiter(RATE, RATE_WINDOW);

  router.use(express.json({ limit: "256kb" }));

  // Authentification : clé valide et non révoquée requise sur TOUTE l'API (aucune route publique sans clé).
  router.use((req, res, next) => {
    const marketing = req.app.locals.marketing;
    if (!marketing || !marketing.ready) return fail(res, 503, "unavailable", "Le module marketing est indisponible.");
    const header = req.get("authorization") || "";
    const raw = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
    const auth = raw ? authenticate(db, raw) : null;
    if (!auth) return fail(res, 401, "unauthorized", "Clé d'API absente, invalide ou révoquée.");
    if (limiter.isLimited(String(auth.keyId))) {
      res.set("Retry-After", "60");
      return fail(res, 429, "rate_limited", `Trop de requêtes : ${RATE} par minute au plus.`);
    }
    limiter.hit(String(auth.keyId));
    req.mkApi = auth;
    req.mkCtx = { db, organizationId: auth.organizationId, userId: null, bus: marketing.bus, settings: marketing.settings };
    next();
  });

  const needWrite = (req, res, next) => (req.mkApi.scope === "write" ? next() : fail(res, 403, "read_only", "Cette clé est en lecture seule : la portée « write » est requise."));

  // ================================================================
  // Contacts (original)
  // ================================================================

  router.get("/contacts", (req, res, next) => {
    try {
      const after = /^\d+$/.test(String(req.query.after || "")) ? Number(req.query.after) : 0;
      const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT));
      const rows = db
        .prepare("SELECT id, email, status, first_name, last_name, source, created_at FROM mk_contacts WHERE organization_id = ? AND id > ? ORDER BY id ASC LIMIT ?")
        .all(req.mkApi.organizationId, after, limit);
      res.json({ data: rows, next_cursor: rows.length === limit ? rows[rows.length - 1].id : null });
    } catch (error) { next(error); }
  });

  router.get("/contacts/:id", (req, res, next) => {
    try {
      const id = intId(req.params.id);
      const contact = id ? audience.getContact(req.mkCtx, id) : null;
      if (!contact) return fail(res, 404, "not_found", "Contact introuvable.");
      res.json({ data: contact });
    } catch (error) { next(error); }
  });

  router.post("/contacts", needWrite, (req, res, next) => {
    try {
      const { contact, created } = audience.upsertContact(req.mkCtx, req.body || {});
      res.status(created ? 201 : 200).json({ data: contact, created });
    } catch (error) {
      if (error instanceof MarketingError) return fail(res, STATUS_OF[error.code] || 400, error.code, error.message);
      next(error);
    }
  });

  // Événements (alimentent les automatisations)
  router.post("/events", needWrite, (req, res, next) => {
    try {
      const body = req.body || {};
      const idempotencyKey = req.get("idempotency-key") || body.idempotency_key || null;
      let contactId = Number.isInteger(body.contact_id) ? body.contact_id : null;
      if (!contactId && body.email) contactId = audience.findByEmail(req.mkCtx, body.email)?.id ?? null;
      const result = req.mkCtx.bus.emit({
        organizationId: req.mkApi.organizationId, name: body.name, email: body.email, contactId,
        source: "api", metadata: body.metadata || {}, idempotencyKey,
      });
      res.status(result.duplicate ? 200 : 201).json({ data: { id: result.id, duplicate: result.duplicate } });
    } catch (error) {
      res.status(400).json({ error: { code: "invalid_field", message: error.message } });
    }
  });

  // ================================================================
  // Extension mobile — Vue d'ensemble (tableau de bord)
  // ================================================================

  router.get("/overview", (req, res, next) => {
    try {
      const overview = getOverview(req.mkCtx, {
        workerOn: process.env.MARKETING_WORKER === "on",
        smtpAvailable: Boolean(process.env.SMTP_HOST),
        keyOk: Boolean(process.env.ENCRYPTION_KEY),
        can: () => true, // la clé d'API a accès à tout
      });
      res.json({
        data: {
          period: overview.period,
          contacts: overview.contacts,
          campaigns: overview.campaigns,
          automations: overview.automations,
          growth: overview.growth,
          activity: overview.activity.slice(0, 10),
          alerts: overview.alerts,
        },
      });
    } catch (error) { next(error); }
  });

  // ================================================================
  // Extension mobile — Campagnes
  // ================================================================

  // Liste paginée des campagnes
  router.get("/campaigns", (req, res, next) => {
    try {
      const status = typeof req.query.status === "string" && req.query.status ? req.query.status : undefined;
      const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 100) : undefined;
      const page = /^\d+$/.test(String(req.query.page || "")) ? Number(req.query.page) : 1;
      const pageSize = 20;
      const result = sending.searchCampaigns(
        req.mkCtx,
        { ...(status && { status }), ...(q && { q }) },
        { page, pageSize }
      );
      res.json({
        data: result.rows,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        hasMore: result.page * result.pageSize < result.total,
      });
    } catch (error) { next(error); }
  });

  // Fiche d'une campagne + statistiques si envoyée
  router.get("/campaigns/:id", (req, res, next) => {
    try {
      const id = intId(req.params.id);
      const campaign = id ? sending.getCampaign(req.mkCtx, id) : null;
      if (!campaign) return fail(res, 404, "not_found", "Campagne introuvable.");
      let stats = null;
      if (campaign.status !== "draft") {
        try { stats = sending.campaignStats(req.mkCtx, id); } catch { /* pas de stats pour cette campagne */ }
      }
      res.json({ data: { ...campaign, stats } });
    } catch (error) { next(error); }
  });

  // Actions sur une campagne : pause / reprise / annulation
  const campaignAction = (path, fn, label) =>
    router.post(`/campaigns/:id/${path}`, needWrite, (req, res, next) => {
      try {
        const id = intId(req.params.id);
        if (!id) return fail(res, 404, "not_found", "Campagne introuvable.");
        fn(req.mkCtx, id);
        res.json({ data: { ok: true, action: label } });
      } catch (error) {
        if (error instanceof MarketingError) return fail(res, STATUS_OF[error.code] || 400, error.code, error.message);
        next(error);
      }
    });

  campaignAction("pause", sending.pauseCampaign, "pause");
  campaignAction("resume", sending.resumeCampaign, "resume");
  campaignAction("cancel", sending.cancelCampaign, "cancel");

  // ================================================================
  // Extension mobile — Listes d'abonnés
  // ================================================================

  router.get("/lists", (req, res, next) => {
    try {
      const lists = audience.listLists(req.mkCtx);
      res.json({ data: lists });
    } catch (error) { next(error); }
  });

  // ================================================================
  // Erreurs
  // ================================================================

  router.use((req, res) => fail(res, 404, "not_found", "Route d'API inconnue."));
  // eslint-disable-next-line no-unused-vars
  router.use((error, req, res, next) => fail(res, 500, "server_error", "Erreur interne."));

  return router;
}

module.exports = { createApiRouter };
