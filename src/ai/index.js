// KOLAKISA AI CORE : point d'entrée unique des fonctions d'IA. Les modules (futurs générateurs, assistants) appellent `core.execute(actor, requête)` ; ils ne parlent jamais à un fournisseur directement.
// Étapes d'une requête : validation → autorisation → configuration (IA activée pour ce site ?) → routage → pour chaque modèle prévu : quotas + réservation → appel (réessais contrôlés) → contrôle de la réponse
// → journal d'utilisation → réponse normalisée. Les réponses de l'IA sont des DONNÉES NON FIABLES (`trusted: false`) : le noyau ne les exécute ni ne les enregistre dans le site.
// Cohabite avec l'ancien socle src/services/aiCore.js (Anthropic seul, utilisé par le blog et le marketing), qui n'est pas modifié.
const crypto = require("node:crypto");
const { AiError, CODES } = require("./errors");
const { normalizeRequest, checkOutput, estimateTokens } = require("./contracts");
const { createRegistry } = require("./models");
const { createUsage } = require("./usage");
const { createSecurity } = require("./security");
const { createConfig } = require("./config");
const { createLogger } = require("./logging");
const { defaultProviders } = require("./providers");
const router = require("./router");

const RETRY = { max: 1, baseMs: 500 };
const sleepReal = (ms) => new Promise((r) => setTimeout(r, ms));

function createAiCore({ db, settings, providers = null, registry = null, now = Date.now, sleep = sleepReal, logger = null, retries = RETRY.max, credentials = null } = {}) {
  if (!db || !settings) throw new Error("AI Core : base de données et réglages obligatoires.");
  const log = logger || createLogger();
  const reg = registry || createRegistry({ now });
  const prov = providers || defaultProviders({ now, credentials });
  const usage = createUsage({ db, now });
  const security = createSecurity({ db });
  const config = createConfig({ settings, security, registry: reg, providers: prov });
  const modules = new Map();

  // Un module déclare ce qu'il est autorisé à faire. Seuls les modules enregistrés (code du dépôt) peuvent envoyer des instructions système.
  function registerModule(name, { allowSystem = false } = {}) {
    if (!/^[a-z][a-z0-9_-]{1,40}$/.test(name)) throw new Error("Nom de module IA invalide.");
    modules.set(name, { allowSystem });
  }

  async function callWithRetry(ctx, scope, adapterId, model, request, reqLog) {
    let attempt = 0;
    for (;;) {
      attempt += 1;
      try { return { out: await prov.call(ctx, scope, adapterId, model, request), attempts: attempt }; }
      catch (e) {
        const err = e instanceof AiError ? e : new AiError("unknown", e && e.message);
        // Réessai seulement si l'échec est survenu AVANT tout traitement (limite de débit, saturation) : jamais après un délai dépassé, une coupure ou une réponse illisible
        if (err.retryable && !err.possiblyBilled && err.code !== "circuit_open" && attempt <= retries) {
          log.event("warn", "ai.retry", { ...reqLog, code: err.code, attempt });
          await sleep(RETRY.baseMs * 2 ** (attempt - 1));
          continue;
        }
        err.attempts = attempt;
        throw err;
      }
    }
  }

  async function execute(actor, raw) {
    const requestId = crypto.randomUUID();
    const started = now();
    const siteId = raw && raw.siteId !== undefined && raw.siteId !== null ? raw.siteId : null;
    let request;
    try {
      request = normalizeRequest(raw);
      security.authorizeUse(actor, siteId);
      const mod = modules.get(request.module);
      if (!mod) throw new AiError("invalid_request", "Module demandeur non enregistré auprès du Kolakisa AI Core.");
      if (request.system && !mod.allowSystem) throw new AiError("not_authorized", "Ce module n'est pas autorisé à envoyer des instructions système.");
    } catch (e) {
      log.event("warn", "ai.rejected", { requestId, module: raw && typeof raw.module === "string" ? raw.module.slice(0, 40) : undefined, siteId: Number.isInteger(siteId) ? siteId : undefined, code: e.code });
      throw Object.assign(e, { requestId });
    }
    const eff = config.effective(actor.organizationId, siteId);
    if (!eff.enabled) throw Object.assign(new AiError("ai_disabled", "Les fonctions d'IA ne sont pas activées pour ce site."), { requestId });
    const ctx = { organizationId: actor.organizationId, userId: actor.userId ?? null, settings };
    const scope = { siteId };
    let plan;
    try { plan = router.plan({ request, effective: eff, registry: reg, providers: prov }); }
    catch (e) { log.event("warn", "ai.unroutable", { requestId, module: request.module, code: e.code }); throw Object.assign(e, { requestId }); }

    const tried = [];
    let lastError = null;
    for (const step of plan.attempts) {
      const model = reg.get(step.model);
      const reqLog = { requestId, provider: model.provider, model: model.id, module: request.module, task: request.task, siteId, userId: actor.userId, strategy: plan.strategy };
      const reserve = reg.estimateCost(model, request.inputTokensEstimate, request.maxOutputTokens);
      let rowId;
      try {
        rowId = usage.admit({ requestId, idempotencyKey: tried.length === 0 ? request.idempotencyKey : null, organizationId: actor.organizationId, siteId, userId: actor.userId ?? null, module: request.module, task: request.task, provider: model.provider, model: model.id, reserveMicroUsd: reserve, priceStatus: reg.priceStatus(model) });
      } catch (e) {
        log.event("warn", "ai.blocked", { ...reqLog, code: e.code });
        if (tried.length && lastError) break; // un secours bloqué par un quota : on rend l'erreur du principal, jamais une dépense hors limite
        throw Object.assign(e, { requestId, routing: { strategy: plan.strategy, attempts: tried } });
      }
      log.event("info", "ai.start", reqLog);
      try {
        const { out, attempts } = await callWithRetry(ctx, scope, model.provider, model.id, request, reqLog);
        if (out.finishReason === "refused") throw Object.assign(new AiError("refused", "Le fournisseur a refusé de traiter cette demande."), { attempts });
        let checked;
        try { checked = checkOutput(out.content, request); } catch (e) { e.attempts = attempts; throw e; }
        if (out.finishReason === "length" && request.responseFormat.type === "json") throw Object.assign(new AiError("malformed_response", "La réponse a été coupée par la limite de sortie."), { attempts });
        const durationMs = now() - started;
        const fromApi = Boolean(out.usage);
        const inTok = fromApi ? out.usage.inputTokens : request.inputTokensEstimate;
        const outTok = fromApi ? out.usage.outputTokens : estimateTokens(checked.content.length);
        const src = fromApi ? "provider" : "estimated";
        const cost = reg.estimateCost(model, inTok, outTok);
        const priceStatus = reg.priceStatus(model);
        usage.finish(rowId, { status: "succeeded", inputTokens: inTok, outputTokens: outTok, tokensSource: src, costMicroUsd: cost, costKind: cost === null ? "unknown" : "estimated", durationMs, attempts });
        tried.push({ provider: model.provider, model: model.id, outcome: "succeeded", attempts });
        log.event("info", "ai.done", { ...reqLog, status: "succeeded", durationMs, inputTokens: inTok, outputTokens: outTok });
        const warnings = [];
        if (!fromApi) warnings.push("Le fournisseur n'a pas renvoyé le nombre de jetons : valeurs estimées par Kolakisa.");
        if (cost === null) warnings.push("Tarif du modèle inconnu : coût non calculable.");
        else if (priceStatus !== "verified") warnings.push("Tarif du modèle périmé : coût estimé à titre indicatif.");
        if (out.finishReason === "length") warnings.push("La réponse a été coupée par la limite de sortie.");
        return {
          requestId, status: "succeeded", provider: model.provider, model: model.id, trusted: false,
          content: checked.content, contentFormat: checked.contentFormat, data: checked.data,
          finish: { reason: out.finishReason, providerReason: out.providerFinishReason || "", source: "provider" },
          usage: { inputTokens: { value: inTok, source: src }, outputTokens: { value: outTok, source: src } },
          cost: { microUsd: cost, kind: cost === null ? "unknown" : "estimated", source: "computed", priceStatus, priceVerifiedAt: model.pricing ? model.pricing.verifiedAt : null },
          durationMs: { value: durationMs, source: "computed" }, providerRequestId: out.providerRequestId || null,
          routing: { strategy: plan.strategy, attempts: tried, fallbackUsed: step.role === "fallback", skipped: plan.skipped }, warnings,
        };
      } catch (e) {
        const err = e instanceof AiError ? e : new AiError("unknown", e && e.message);
        const billed = err.possiblyBilled;
        usage.finish(rowId, { status: "failed", errorCode: err.code, tokensSource: "unavailable", costMicroUsd: billed ? null : 0, costKind: "unknown", durationMs: now() - started, attempts: err.attempts || 1, counted: billed ? 1 : 0 });
        tried.push({ provider: model.provider, model: model.id, outcome: "failed", code: err.code, attempts: err.attempts || 1 });
        log.event("error", "ai.failed", { ...reqLog, status: "failed", code: err.code, durationMs: now() - started });
        lastError = err;
        // Basculement : seulement après un échec qui n'a rien pu coûter ; sinon on s'arrête (jamais de seconde facturation possible)
        if (billed) break;
      }
    }
    throw Object.assign(lastError, { requestId, routing: { strategy: plan.strategy, attempts: tried, skipped: plan.skipped } });
  }

  // ---- Administration (contrôles de droits dans security) ----
  const assertAdmin = (actor) => security.assertGlobalAdmin(actor);
  const admin = {
    config: { read: (actor) => { assertAdmin(actor); return config.read(actor.organizationId); }, updateGlobal: config.updateGlobal, effective: (orgId, siteId) => config.effective(orgId, siteId) },
    setQuota(actor, q) { assertAdmin(actor); usage.setQuota({ ...q, organizationId: q.scope === "global" ? 0 : actor.organizationId, userId: actor.userId ?? null }); },
    removeQuota(actor, q) { assertAdmin(actor); usage.removeQuota({ ...q, organizationId: actor.organizationId }); },
    listQuotas(actor) { assertAdmin(actor); return usage.listQuotas(actor.organizationId); },
    setPricing(actor, key, pricing) { assertAdmin(actor); return reg.setPricing(key, pricing); },
    registerModel(actor, model) { assertAdmin(actor); return reg.register(model); },
    markModelVerified(actor, key, available) { assertAdmin(actor); return reg.markVerified(key, available); },
    // Vue des fournisseurs : configuré ou non, état du disjoncteur ; jamais une clé
    providers(actor, siteId = null) { assertAdmin(actor); return prov.list().map((p) => ({ ...p, ...prov.status({ organizationId: actor.organizationId, settings }, { siteId }, p.id) })); },
    metrics(actor, since) { assertAdmin(actor); return usage.summary({ organizationId: actor.organizationId, since }); },
    platformMetrics(actor, since) { assertAdmin(actor); return usage.summary({ organizationId: null, since }); },
    recentEvents(actor, n) { assertAdmin(actor); return log.recent(n); },
    trace(actor, requestId) { assertAdmin(actor); return usage.trace(requestId, actor.organizationId); },
  };
  const forSite = {
    // Un administrateur de site voit SA consommation uniquement
    usage(actor, siteId, since) { security.assertSiteAdmin(actor, siteId); return usage.summary({ organizationId: actor.organizationId, siteId, since }); },
    quotas(actor, siteId) {
      security.assertSiteAdmin(actor, siteId);
      return usage.listQuotas(actor.organizationId).filter((q) => q.scope === "global" || q.scope === "organization" || (q.scope === "site" && q.scopeId === String(siteId))).map((q) => ({ scope: q.scope, period: q.period, maxRequests: q.maxRequests, maxCostMicroUsd: q.maxCostMicroUsd }));
    },
    update: config.updateSite,
  };
  return { execute, registerModule, registry: reg, providers: prov, usage, admin, forSite, security, config, log, CODES };
}

let shared = null;
// Instance de production (base et réglages réels). Les tests créent la leur avec createAiCore.
function getAiCore() {
  if (shared) return shared;
  const db = require("../config/database");
  const { createSettings } = require("../marketing/settings");
  shared = createAiCore({ db, settings: createSettings(db, { encryptionKey: process.env.ENCRYPTION_KEY }) });
  return shared;
}
module.exports = { createAiCore, getAiCore, RETRY };
