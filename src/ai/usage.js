// AI USAGE MANAGER : journal d'utilisation (table mk_ai_core_usage), quotas (mk_ai_core_quotas), idempotence.
// L'admission d'une requête (contrôle des quotas + réservation + insertion) est SYNCHRONE : dans un seul processus Node, deux requêtes ne peuvent pas s'y croiser.
// Aucun texte envoyé ou reçu n'est stocké. Coût : `cost_kind` = estimated (jetons × tarif du registre) ou unknown ; « confirmed » est réservé à une facture du fournisseur, qu'aucun fournisseur ne fournit par l'API de génération.
const { AiError } = require("./errors");

const DAY = 86400000;
const SCOPES = ["global", "organization", "site", "user", "module"];
const PERIODS = ["day", "month"];
const windowStart = (period, at) => { const d = new Date(at); return period === "day" ? Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) : Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1); };

function createUsage({ db, now = Date.now }) {
  const api = {
    // Quotas qui s'appliquent à une requête (toutes les portées en même temps : la plus stricte l'emporte)
    applicableQuotas(who) {
      const rows = db.prepare("SELECT * FROM mk_ai_core_quotas WHERE (scope = 'global') OR (organization_id = ? AND scope = 'organization') OR (organization_id = ? AND scope = 'site' AND scope_id = ?) OR (organization_id = ? AND scope = 'user' AND scope_id = ?) OR (organization_id = ? AND scope = 'module' AND scope_id = ?)")
        .all(who.organizationId, who.organizationId, String(who.siteId ?? "-"), who.organizationId, String(who.userId ?? "-"), who.organizationId, who.module);
      return rows;
    },
    consumed(q, at = now()) {
      const since = windowStart(q.period, at);
      const where = ["created_at >= ?"], params = [since];
      if (q.scope !== "global") { where.push("organization_id = ?"); params.push(q.organization_id); }
      if (q.scope === "site") { where.push("site_id = ?"); params.push(Number(q.scope_id)); }
      if (q.scope === "user") { where.push("user_id = ?"); params.push(Number(q.scope_id)); }
      if (q.scope === "module") { where.push("module = ?"); params.push(q.scope_id); }
      const r = db.prepare(`SELECT COALESCE(SUM(counted), 0) requests, COALESCE(SUM(counted * COALESCE(cost_micro_usd, reserved_micro_usd)), 0) cost FROM mk_ai_core_usage WHERE ${where.join(" AND ")}`).get(...params);
      return { requests: r.requests, costMicroUsd: r.cost };
    },
    // Admission : idempotence, quotas, réservation. Lève AiError (duplicate_request, quota_exceeded, cost_unverified). Renvoie l'identifiant de ligne.
    admit({ requestId, idempotencyKey, organizationId, siteId, userId, module, task, provider, model, reserveMicroUsd, priceStatus }) {
      const at = now();
      if (idempotencyKey) {
        const prev = db.prepare("SELECT * FROM mk_ai_core_usage WHERE organization_id = ? AND idempotency_key = ?").get(organizationId, idempotencyKey);
        if (prev) {
          if (prev.status === "failed" && prev.counted === 0) db.prepare("UPDATE mk_ai_core_usage SET idempotency_key = NULL WHERE id = ?").run(prev.id);
          else throw new AiError("duplicate_request", `Cette requête a déjà été exécutée (${prev.status === "started" ? "en cours" : prev.status === "succeeded" ? "réussie" : "échouée, facturation possible"}) : elle n'est pas relancée pour éviter une double facturation.`, { originalRequestId: prev.request_id, originalStatus: prev.status });
        }
      }
      const quotas = api.applicableQuotas({ organizationId, siteId, userId, module });
      for (const q of quotas) {
        const used = api.consumed(q, at);
        const label = `${q.scope === "global" ? "de la plateforme" : q.scope === "organization" ? "de l'organisation" : q.scope === "site" ? "du site" : q.scope === "user" ? "de l'utilisateur" : "du module"} (${q.period === "day" ? "jour" : "mois"})`;
        if (q.max_requests !== null && used.requests + 1 > q.max_requests) throw new AiError("quota_exceeded", `Limite ${label} atteinte : ${q.max_requests} requête(s). Rien n'a été envoyé au fournisseur.`, { quota: { scope: q.scope, period: q.period, kind: "requests", limit: q.max_requests, used: used.requests } });
        if (q.max_cost_micro_usd !== null) {
          if (priceStatus !== "verified" || reserveMicroUsd === null) throw new AiError("cost_unverified", `Une limite de coût ${label} est définie, mais le tarif de ce modèle n'est pas vérifié : la requête est refusée plutôt que de dépenser sans contrôle.`, { quota: { scope: q.scope, period: q.period, kind: "cost" } });
          if (used.costMicroUsd + reserveMicroUsd > q.max_cost_micro_usd) throw new AiError("quota_exceeded", `Limite de coût ${label} atteinte (${(q.max_cost_micro_usd / 1e6).toFixed(4)} USD estimés). Rien n'a été envoyé au fournisseur.`, { quota: { scope: q.scope, period: q.period, kind: "cost", limit: q.max_cost_micro_usd, used: used.costMicroUsd } });
        }
      }
      const r = db.prepare("INSERT INTO mk_ai_core_usage (request_id, idempotency_key, organization_id, site_id, user_id, module, task, provider, model, status, reserved_micro_usd, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'started', ?, ?)")
        .run(requestId, idempotencyKey ?? null, organizationId, siteId ?? null, userId ?? null, module, task || "", provider, model, reserveMicroUsd ?? 0, at);
      return Number(r.lastInsertRowid);
    },
    finish(rowId, { status, errorCode = "", inputTokens = null, outputTokens = null, tokensSource = "unavailable", costMicroUsd = null, costKind = "unknown", durationMs = null, attempts = 1, counted = 1 }) {
      db.prepare("UPDATE mk_ai_core_usage SET status = ?, error_code = ?, input_tokens = ?, output_tokens = ?, tokens_source = ?, cost_micro_usd = ?, cost_kind = ?, duration_ms = ?, attempts = ?, counted = ?, reserved_micro_usd = CASE WHEN ? = 0 THEN 0 ELSE reserved_micro_usd END, finished_at = ? WHERE id = ?")
        .run(status, errorCode, inputTokens, outputTokens, tokensSource, costMicroUsd, costKind, durationMs, attempts, counted, counted, now(), rowId);
    },
    // ---- Quotas : écriture réservée à l'administration centrale (contrôlée par l'appelant) ----
    setQuota({ scope, scopeId = "", organizationId = 0, period, maxRequests = null, maxCostMicroUsd = null, userId = null }) {
      if (!SCOPES.includes(scope) || !PERIODS.includes(period)) throw new AiError("invalid_request", "Quota : portée ou période invalide.");
      const nn = (v, l) => { if (v === null || v === undefined || v === "") return null; const n = Number(v); if (!Number.isInteger(n) || n < 0) throw new AiError("invalid_request", `Quota : ${l} invalide.`); return n; };
      const mr = nn(maxRequests, "nombre de requêtes"), mc = nn(maxCostMicroUsd, "coût");
      if (mr === null && mc === null) throw new AiError("invalid_request", "Quota : une limite de requêtes ou de coût est obligatoire.");
      if (scope !== "global" && !organizationId) throw new AiError("invalid_request", "Quota : organisation obligatoire.");
      if (["site", "user", "module"].includes(scope) && !String(scopeId)) throw new AiError("invalid_request", "Quota : identifiant de portée obligatoire.");
      db.prepare("INSERT INTO mk_ai_core_quotas (scope, scope_id, organization_id, period, max_requests, max_cost_micro_usd, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (scope, scope_id, organization_id, period) DO UPDATE SET max_requests = excluded.max_requests, max_cost_micro_usd = excluded.max_cost_micro_usd, updated_by = excluded.updated_by, updated_at = excluded.updated_at")
        .run(scope, String(scopeId), scope === "global" ? 0 : organizationId, period, mr, mc, userId, now());
    },
    removeQuota({ scope, scopeId = "", organizationId = 0, period }) { db.prepare("DELETE FROM mk_ai_core_quotas WHERE scope = ? AND scope_id = ? AND organization_id = ? AND period = ?").run(scope, String(scopeId), scope === "global" ? 0 : organizationId, period); },
    listQuotas(organizationId) {
      return db.prepare("SELECT * FROM mk_ai_core_quotas WHERE scope = 'global' OR organization_id = ? ORDER BY scope, scope_id, period").all(organizationId)
        .map((q) => ({ scope: q.scope, scopeId: q.scope_id, period: q.period, maxRequests: q.max_requests, maxCostMicroUsd: q.max_cost_micro_usd, used: api.consumed(q) }));
    },
    // ---- Consommation et observabilité ----
    // where : { organizationId (obligatoire sauf plateforme), siteId, userId, module, since }
    summary({ organizationId = null, siteId, userId, module, since = now() - 30 * DAY } = {}) {
      const where = ["created_at >= ?"], params = [since];
      if (organizationId !== null) { where.push("organization_id = ?"); params.push(organizationId); }
      if (siteId !== undefined) { where.push("site_id IS ?"); params.push(siteId); }
      if (userId !== undefined) { where.push("user_id = ?"); params.push(userId); }
      if (module) { where.push("module = ?"); params.push(module); }
      const w = where.join(" AND ");
      const total = db.prepare(`SELECT COUNT(*) requests, COALESCE(SUM(status = 'succeeded'), 0) succeeded, COALESCE(SUM(status = 'failed'), 0) failed, COALESCE(SUM(status = 'started'), 0) running,
        AVG(CASE WHEN status = 'succeeded' THEN duration_ms END) avgDurationMs, COALESCE(SUM(input_tokens), 0) inputTokens, COALESCE(SUM(output_tokens), 0) outputTokens,
        COALESCE(SUM(CASE WHEN cost_kind = 'estimated' THEN cost_micro_usd END), 0) estimatedCostMicroUsd, COALESCE(SUM(CASE WHEN cost_kind = 'confirmed' THEN cost_micro_usd END), 0) confirmedCostMicroUsd,
        COALESCE(SUM(status = 'succeeded' AND cost_kind = 'unknown'), 0) unknownCostRequests, COALESCE(SUM(error_code = 'quota_exceeded'), 0) quotaHits FROM mk_ai_core_usage WHERE ${w}`).get(...params);
      const by = (col) => db.prepare(`SELECT ${col} k, COUNT(*) requests, COALESCE(SUM(status = 'failed'), 0) failed, COALESCE(SUM(CASE WHEN cost_kind = 'estimated' THEN cost_micro_usd END), 0) estimatedCostMicroUsd FROM mk_ai_core_usage WHERE ${w} GROUP BY ${col} ORDER BY requests DESC`).all(...params);
      const errors = db.prepare(`SELECT provider, error_code code, COUNT(*) n FROM mk_ai_core_usage WHERE ${w} AND status = 'failed' GROUP BY provider, error_code ORDER BY n DESC`).all(...params);
      return { ...total, byProvider: by("provider"), byModel: by("model"), byModule: by("module"), byUser: by("user_id"), bySite: by("site_id"), errors, costNote: "Coûts estimés (jetons × tarifs du registre). Aucun coût confirmé par la facturation du fournisseur." };
    },
    // Chaîne de corrélation : toutes les lignes d'une requête (tentatives et basculements compris)
    trace(requestId, organizationId) {
      return db.prepare("SELECT request_id, provider, model, status, error_code, attempts, duration_ms, input_tokens, output_tokens, tokens_source, cost_micro_usd, cost_kind, created_at FROM mk_ai_core_usage WHERE request_id = ? AND organization_id = ? ORDER BY id").all(requestId, organizationId);
    },
  };
  return api;
}
module.exports = { createUsage, SCOPES, PERIODS, windowStart };
