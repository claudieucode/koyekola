// Synchronisation automatique : toutes les heures (MAILCHIMP_SYNC_INTERVAL_MS pour changer, 60 s minimum), pour l'organisation de cette installation si Mailchimp est connecté et la synchronisation activée.
// Indépendant du worker de la file de travaux (qui n'est actif qu'avec MARKETING_WORKER=on) : un verrou en base (running_since) empêche deux synchronisations simultanées.
const { syncAll } = require("./sync");
const connection = require("./connection");

const HOUR = 60 * 60 * 1000;

function intervalOf(env) {
  const n = Number(env.MAILCHIMP_SYNC_INTERVAL_MS);
  return Number.isFinite(n) && n >= (env.NODE_ENV === "test" ? 500 : 60_000) ? n : HOUR;
}

// Une passe (exportée pour les tests) ; ne lève jamais
async function tick({ db, settings, bus, organizationId, env = process.env, log = console }) {
  try {
    const ctx = { db, settings, bus, organizationId, userId: null, env };
    const st = connection.status(ctx);
    if (!st.connected || !st.syncEnabled) return { skipped: true };
    return await syncAll(ctx);
  } catch (error) {
    log.warn?.("[KOLAKISA] Synchronisation Mailchimp :", error.message);
    return { error: error.message };
  }
}

// Démarre le minuteur ; en test, seulement si l'intervalle est demandé explicitement
function start(deps) {
  const env = deps.env || process.env;
  if (env.NODE_ENV === "test" && !env.MAILCHIMP_SYNC_INTERVAL_MS) return null;
  const timer = setInterval(() => { tick(deps); }, intervalOf(env));
  timer.unref();
  return timer;
}

module.exports = { start, tick, intervalOf };
