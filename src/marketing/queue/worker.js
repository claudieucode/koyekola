// Worker : réserve des lots de travaux et exécute leurs gestionnaires, un à la fois.
//  - traitement par PETITS lots : node:sqlite est synchrone, un long traitement bloquerait les requêtes du site ;
//  - un délai maximal par travail (inférieur au bail) : un gestionnaire bloqué ne peut ni geler le worker ni être
//    exécuté en double par un autre ;
//  - toute erreur est journalisée ET enregistrée sur le travail : rien n'est avalé en silence.
const jobs = require("./jobs");

class UnrecoverableError extends Error {
  constructor(message) {
    super(message);
    this.name = "UnrecoverableError";
  }
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Délai dépassé (${ms} ms)`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function createWorker({
  db, handlers = {}, workerId = `w-${process.pid}-${Math.random().toString(36).slice(2, 8)}`, batchSize = 25, leaseMs = 60_000,
  timeoutMs = 30_000, intervalMs = 1000, now = Date.now, random = Math.random, log = console, types,
} = {}) {
  if (timeoutMs >= leaseMs) throw new Error("Le délai maximal d'un travail doit rester inférieur au bail : sinon un autre worker pourrait reprendre un travail encore en cours.");

  const metrics = { ticks: 0, processed: 0, failed: 0, lastTickAt: null, lastTickMs: null };
  let ticking = false;
  let timer = null;
  let current = null;

  async function run(job) {
    const handler = handlers[job.type];
    try {
      if (!handler) throw new UnrecoverableError(`Type de travail inconnu : ${job.type}`);
      await withTimeout(Promise.resolve().then(() => handler(job.payload, job)), timeoutMs);
      jobs.complete(db, job, { workerId, now: now() });
      metrics.processed++;
      return true;
    } catch (error) {
      const retryable = !(error instanceof UnrecoverableError);
      const outcome = jobs.fail(db, job, error, { workerId, retryable, now: now(), random });
      metrics.failed++;
      log.error(`[KOLAKISA] Travail #${job.id} (${job.type}) en échec, tentative ${job.attempts}/${job.max_attempts} : ${error.message}${outcome.state === "dead" ? " — abandonné (voir le diagnostic)" : ""}`);
      return false;
    }
  }

  async function tick() {
    if (ticking) return { claimed: 0, processed: 0, failed: 0, skipped: true };
    ticking = true;
    const started = performance.now();
    try {
      const batch = jobs.claim(db, { workerId, limit: batchSize, leaseMs, now: now(), types });
      let processed = 0;
      for (const job of batch) if (await run(job)) processed++;
      metrics.ticks++;
      metrics.lastTickAt = now();
      metrics.lastTickMs = Math.round(performance.now() - started);
      return { claimed: batch.length, processed, failed: batch.length - processed };
    } finally {
      ticking = false;
    }
  }

  // Traite tout ce qui est prêt (tests, scripts de reprise)
  async function drain({ maxTicks = 1000 } = {}) {
    for (let i = 0; i < maxTicks; i++) if (!(await tick()).claimed) return;
  }

  function start() {
    if (timer) return;
    timer = setInterval(() => {
      current = tick()
        .catch((error) => log.error("[KOLAKISA] Erreur du worker marketing :", error.message))
        .finally(() => { current = null; });
    }, intervalMs);
    timer.unref?.(); // ne retient jamais l'arrêt du processus
  }

  async function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    if (current) await current;
  }

  return { workerId, tick, drain, start, stop, metrics: () => ({ ...metrics }) };
}

module.exports = { createWorker, UnrecoverableError };
