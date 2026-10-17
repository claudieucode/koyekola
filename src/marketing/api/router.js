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
const { isSiteKey, contactInSite, contactOutsideScope, auditDenied } = require("./scope");
const contactsRepo = require("../audience/contacts");
const contactCore = require("../contactcore");

const RATE = 120; // requêtes par minute et par clé
const RATE_WINDOW = 60_000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

const STATUS_OF = { invalid_field: 400, invalid_email: 400, duplicate: 409, not_found: 404, invalid_state: 400, rate_limited: 429 };
const requestsLib = require("../contactcore/requests");
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
    // Portée de site (R2) : posée par le serveur d'après la clé enregistrée, jamais d'après la requête. `siteScope` est le modèle commun des moteurs
    // (listes, campagnes) : il les ramène au site de la clé. Une clé d'organisation n'a pas de `siteScope` : accès historique inchangé.
    req.mkCtx = { db, organizationId: auth.organizationId, userId: null, bus: marketing.bus, settings: marketing.settings, ...(isSiteKey(auth) ? { siteScope: auth.siteId } : {}) };
    next();
  });

  // Refus d'une clé de site hors de sa portée : même réponse quel que soit l'objet (aucune indication sur l'existence d'une ressource d'un autre site), tracé au journal
  const outOfScope = (req, res, reason) => { auditDenied(db, req.mkApi, `${req.method} ${req.baseUrl}${req.path}`.slice(0, 120), reason); return fail(res, 403, "out_of_scope", "Cette clé est limitée à un site : opération refusée hors de ce site."); };
  const needWrite = (req, res, next) => (req.mkApi.scope === "write" ? next() : fail(res, 403, "read_only", "Cette clé est en lecture seule : la portée « write » est requise."));

  // ================================================================
  // Contacts (original)
  // ================================================================

  router.get("/contacts", (req, res, next) => {
    try {
      const after = /^\d+$/.test(String(req.query.after || "")) ? Number(req.query.after) : 0;
      const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT));
      const site = isSiteKey(req.mkApi) ? contactInSite("c", req.mkApi.siteId) : { sql: "1 = 1", params: [] };
      const rows = db
        .prepare(`SELECT c.id, c.email, c.status, c.first_name, c.last_name, c.source, c.created_at FROM mk_contacts c WHERE c.organization_id = ? AND c.id > ? AND ${site.sql} ORDER BY c.id ASC LIMIT ?`)
        .all(req.mkApi.organizationId, after, ...site.params, limit);
      res.json({ data: rows, next_cursor: rows.length === limit ? rows[rows.length - 1].id : null });
    } catch (error) { next(error); }
  });

  router.get("/contacts/:id", (req, res, next) => {
    try {
      const id = intId(req.params.id);
      let contact = id ? audience.getContact(req.mkCtx, id) : null;
      if (contact && contactOutsideScope(db, req.mkApi, { contact })) { auditDenied(db, req.mkApi, "GET /contacts/:id", "contact d'un autre site"); contact = null; } // même réponse qu'un contact inexistant
      if (!contact) return fail(res, 404, "not_found", "Contact introuvable.");
      res.json({ data: contact });
    } catch (error) { next(error); }
  });

  router.post("/contacts", needWrite, (req, res, next) => {
    try {
      let outcome;
      if (isSiteKey(req.mkApi)) {
        // Clé de site : le contact est rattaché au site de la clé (origine), jamais à un autre. R7 : une adresse déjà connue dont l'ORIGINE n'est pas ce site (autre site, activité
        // seulement, historique sans association) n'est NI lue, NI modifiée, NI confirmée : la réponse est la même que pour une création (202, aucune donnée). Seule la mise à jour
        // d'un contact dont l'origine est le site de la clé répond 200 avec la fiche.
        const body = req.body || {};
        const input = {};
        for (const k of ["email", "first_name", "last_name", "company", "country", "language", "timezone", "phone", "properties", "source"]) if (body[k] !== undefined) input[k] = body[k];
        requestsLib.guard(req.mkCtx); // limite de débit par site (429), quel que soit le résultat
        outcome = contactCore.identify(req.mkCtx, { ...input, siteId: req.mkApi.siteId });
        if (outcome.created || outcome.withheld) {
          if (outcome.withheld) { auditDenied(db, req.mkApi, "POST /contacts", "contact hors de la portée d'écriture"); requestsLib.enqueue(req.mkCtx, { email: input.email, source: "api", keyId: req.mkApi.keyId }); } // R7 lot 5 : demande mise en file pour l'équipe
          return res.status(202).json({ data: null, accepted: true });
        }
      } else {
        outcome = audience.upsertContact(req.mkCtx, req.body || {});
      }
      const { contact, created } = outcome;
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
      let eventSite = Number.isInteger(body.site_id) ? body.site_id : null;
      if (isSiteKey(req.mkApi)) {
        // Clé de site : l'événement appartient au site de la clé ; un autre site est refusé (jamais ignoré en silence), un contact d'un autre site n'est ni rattaché ni révélé.
        if (body.site_id !== undefined && body.site_id !== null && Number(body.site_id) !== req.mkApi.siteId) return outOfScope(req, res, "site demandé différent de celui de la clé");
        if (Number.isInteger(body.contact_id) && contactOutsideScope(db, req.mkApi, { contactId: body.contact_id })) { auditDenied(db, req.mkApi, "POST /events", "contact d'un autre site"); return fail(res, 404, "not_found", "Contact introuvable."); }
        // R7 : une adresse connue hors de la portée de la clé n'est ni rattachée ni confirmée : l'événement est enregistré SANS identité (comme pour une adresse inconnue), même réponse
        const byEmail = body.email ? contactsRepo.findByEmail(req.mkCtx, body.email) : null;
        if (byEmail && contactOutsideScope(db, req.mkApi, { contact: byEmail })) { auditDenied(db, req.mkApi, "POST /events", "contact d'un autre site"); body.email = null; }
        eventSite = req.mkApi.siteId;
      }
      // Contact Core (palier 15) : le journal n'est écrit que par recordEvent — contact, site et objet sont vérifiés (aucun identifiant d'une autre organisation)
      const result = require("../contactcore").recordEvent(req.mkCtx, {
        type: body.name, contactId: Number.isInteger(body.contact_id) ? body.contact_id : null, email: body.email || null, siteId: eventSite,
        source: "api", objectType: body.object_type ?? null, objectId: body.object_id ?? null, metadata: body.metadata || {}, idempotencyKey,
      });
      res.status(result.duplicate ? 200 : 201).json({ data: { id: result.id, duplicate: result.duplicate } });
    } catch (error) {
      if (error instanceof MarketingError) return fail(res, STATUS_OF[error.code] || 400, error.code, error.message);
      res.status(400).json({ error: { code: "invalid_field", message: error.message } });
    }
  });

  // ================================================================
  // Extension mobile — Vue d'ensemble (tableau de bord)
  // ================================================================

  router.get("/overview", (req, res, next) => {
    try {
      // Le tableau de bord agrège toute l'organisation (contacts, campagnes, automatisations, activité) : indisponible pour une clé limitée à un site
      if (isSiteKey(req.mkApi)) return outOfScope(req, res, "vue d'ensemble de l'organisation");
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
        try { stats = sending.campaignStats(req.mkCtx, id); } catch (error) { console.error("[KOLAKISA] API : statistiques de campagne indisponibles :", error.message); }
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
