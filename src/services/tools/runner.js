// Exécution des outils (palier 13) au-dessus de la file de travaux EXISTANTE (mk_jobs + worker, src/marketing/queue) : un travail
// « tools.run » exécute une exécution (cms_tool_runs) par petits lots, avec progression réelle et annulation propre entre deux lots.
// Si le worker marketing n'est pas activé (MARKETING_WORKER ≠ on), un worker local réservé au type « tools.run » est lancé à la demande
// (même code, même réservation atomique : une exécution ne tourne jamais deux fois) et s'arrête quand il n'y a plus rien à faire.
const db = require("../../config/database");
const runs = require("./runs");
const jobs = require("../../marketing/queue/jobs");
const { createWorker } = require("../../marketing/queue/worker");

const executors = new Map();
const register = (kind, fn) => executors.set(kind, fn);
let cfg = null;      // { organizationId, bus, settings, env, log }
let local = null;    // worker local (si le worker marketing est inactif)
let idleTimer = null;

const init = (c) => { cfg = { log: console, env: process.env, ...c }; try { recoverStuck({ olderThanMinutes: 0 }); } catch { /* table pas encore créée */ } return module.exports; };
const messageOf = (error) => String((error && error.message) || error || "Erreur").replace(/[\u0000-\u001f]+/g, " ").slice(0, 300);

function ensureLoaded() {
  for (const m of ["exchange", "health", "integrity", "content", "linksScan"]) { try { require(`./${m}`); } catch (error) { if (error.code !== "MODULE_NOT_FOUND") throw error; } }
}

// Contexte des services métier pour CETTE personne et CE site : les droits sont ceux de l'utilisateur qui a lancé l'opération
function ctxFor(run) {
  const access = require("../cmsAccess");
  const perms = run.user_id ? access.effectivePermissions(run.user_id, { organizationId: run.organization_id, siteId: run.site_id }) : new Set();
  const can = (p) => perms.has(p);
  const orgLevel = Boolean(run.user_id && require("../../marketing/organizations").membershipsOf(db, run.user_id).find((m) => m.organization_id === run.organization_id));
  return { orgLevel, db, organizationId: run.organization_id, userId: run.user_id || null, can, perms, bus: cfg && cfg.bus, settings: cfg && cfg.settings, tokenKey: cfg && cfg.env.ENCRYPTION_KEY, baseUrl: cfg && cfg.env.SITE_URL };
}

const tick = () => new Promise((r) => setImmediate(r));

async function execute(runId) {
  ensureLoaded();
  const row = runs.raw(runId);
  if (!row || ["done", "failed", "cancelled", "awaiting"].includes(row.status)) return;
  const fn = executors.get(row.kind);
  if (!fn) { runs.update(row.id, { status: "failed", message: `Outil inconnu : ${row.kind}`, finished_at: new Date().toISOString().slice(0, 19).replace("T", " ") }); return; }
  runs.update(row.id, { status: "running", started_at: row.started_at || new Date().toISOString().slice(0, 19).replace("T", " ") });
  const state = { done: row.done, failed: row.failed, skipped: row.skipped, conflicts: row.conflicts };
  const api = {
    run: row, ctx: ctxFor(row),
    setTotal: (n) => runs.update(row.id, { total: n }),
    // Compteurs cumulés, écrits à chaque lot : la progression affichée est celle du travail réellement effectué
    advance: (delta = {}) => { for (const k of Object.keys(state)) state[k] += Number(delta[k] || 0); runs.update(row.id, state); },
    reset: () => { for (const k of Object.keys(state)) state[k] = 0; runs.update(row.id, state); },
    message: (text) => runs.update(row.id, { message: String(text).slice(0, 300) }),
    cancelled: () => Boolean((runs.raw(row.id) || {}).cancel_requested),
    yieldTurn: tick,
  };
  const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");
  try {
    const out = (await fn(row, api)) || {};
    const status = out.status || "done";
    runs.update(row.id, { status, phase: out.phase ?? row.phase, report: out.report ?? undefined, result: out.result ?? undefined, plan: out.plan ?? undefined, message: out.message ?? null, ...(status === "awaiting" ? {} : { finished_at: now() }) });
  } catch (error) {
    runs.update(row.id, { status: "failed", message: messageOf(error), finished_at: now() });
    if (cfg) cfg.log.error?.(`[KOLAKISA] Outil #${row.id} (${row.kind}) en échec : ${messageOf(error)}`);
  }
}

// Met l'exécution (ou sa phase suivante) dans la file ; la clé d'idempotence évite un double lancement
function start(run, phase = "run") {
  if (!cfg) throw new Error("Outils non initialisés.");
  runs.update(run.id, { status: "queued", cancel_requested: 0 });
  jobs.enqueue(db, { organizationId: cfg.organizationId, type: "tools.run", payload: { runId: run.id }, priority: 3, maxAttempts: 1, idempotencyKey: `tools:${run.id}:${phase}:${Date.now()}` });
  kick();
}

// Opérations restées « en cours » sans travail actif (redémarrage ou arrêt du serveur) : marquées interrompues. Leur rapport partiel reste consultable ;
// un import interrompu peut être annulé. La reprise automatique n'existe pas : relancer repart d'une analyse fraîche (rien n'est dupliqué : les éléments déjà créés sont des conflits).
function recoverStuck({ olderThanMinutes = 3 } = {}) {
  const rows = db.prepare("SELECT id FROM cms_tool_runs WHERE status IN ('running', 'queued') AND COALESCE(started_at, created_at) < datetime('now', ?)").all(`-${olderThanMinutes} minutes`);
  for (const r of rows) {
    const live = db.prepare("SELECT 1 FROM mk_jobs WHERE type = 'tools.run' AND state IN ('pending', 'running') AND payload LIKE ?").get(`%"runId":${r.id}%`);
    if (live) continue;
    runs.update(r.id, { status: "failed", message: "Opération interrompue (arrêt ou redémarrage du serveur). Le rapport partiel indique ce qui a été fait.", finished_at: new Date().toISOString().slice(0, 19).replace("T", " ") });
  }
  return rows.length;
}

const handlers = () => ({ "tools.run": async (payload) => { await execute(Number(payload.runId)); scheduleStop(); } });

function kick() {
  if (!cfg) return;
  if (cfg.env.MARKETING_WORKER === "on" && !local) return; // le worker marketing traitera le travail (même file, même gestionnaire)
  if (!local) {
    local = createWorker({ db, handlers: handlers(), types: ["tools.run"], intervalMs: 150, batchSize: 3, leaseMs: 30 * 60_000, timeoutMs: 25 * 60_000, log: { ...cfg.log, error: (...a) => cfg.log.error?.(...a) } });
    local.start();
  }
  clearTimeout(idleTimer);
}
function scheduleStop() {
  if (!local) return;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    const busy = db.prepare("SELECT 1 FROM mk_jobs WHERE type = 'tools.run' AND state IN ('pending', 'running') LIMIT 1").get();
    if (busy) return scheduleStop();
    const w = local; local = null;
    w.stop().catch(() => {});
  }, 3000);
  idleTimer.unref?.();
}
// Traite immédiatement ce qui est en attente (tests, reprise)
async function drain() { ensureLoaded(); if (local) await local.drain?.(); }

module.exports = { init, recoverStuck, register, start, execute, handlers, kick, drain, ctxFor, messageOf, tick, get config() { return cfg; } };
