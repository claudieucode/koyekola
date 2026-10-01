// API publique /api/v1 (jalon M5 — Intégrations, partie 1) : authentification par clé (Authorization: Bearer mk_live_…),
// JAMAIS par cookie — donc jamais de vérification d'origine (CSRF) à faire, une clé volée sur un autre site ne sert à
// rien sans être copiée. Réponses JSON homogènes : { data } en succès, { error: { code, message } } en échec.
const express = require("express");
const { authenticate } = require("./keys");
const { createRateLimiter } = require("../../middlewares/security");
const audience = require("../audience");
const { MarketingError } = require("../errors");

const RATE = 120; // requêtes par minute et par clé
const RATE_WINDOW = 60_000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const STATUS_OF = { invalid_field: 400, invalid_email: 400, duplicate: 409, not_found: 404 };
const fail = (res, status, code, message) => res.status(status).json({ error: { code, message } });

function createApiRouter({ db }) {
  const router = express.Router();
  const limiter = createRateLimiter(RATE, RATE_WINDOW);

  router.use(express.json({ limit: "256kb" }));

  // Authentification : clé valide et non révoquée requise sur TOUTE l'API (aucune route publique sans clé).
  // bus/settings viennent de req.app.locals.marketing, résolu à CHAQUE requête (comme le routeur /marketing) :
  // au moment où ce routeur est construit, initMarketing() n'a pas encore tourné (voir server.js).
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

  // ---------- Contacts ----------
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
      const id = Number(req.params.id);
      const contact = Number.isInteger(id) ? audience.getContact(req.mkCtx, id) : null;
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

  // ---------- Événements (alimentent les automatisations et — à terme — les segments) ----------
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

  router.use((req, res) => fail(res, 404, "not_found", "Route d'API inconnue."));
  // eslint-disable-next-line no-unused-vars
  router.use((error, req, res, next) => fail(res, 500, "server_error", "Erreur interne."));

  return router;
}

module.exports = { createApiRouter };
