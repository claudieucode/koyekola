// AI LOGGING : journal technique structuré. Il ne contient JAMAIS le texte des messages ni des réponses, ni une clé : seulement des identifiants,
// des noms (fournisseur, modèle, module), des codes, des durées et des nombres. Chaque ligne porte l'identifiant de corrélation `requestId`.
const { scrub } = require("../services/connectors/errors");
const ALLOWED = new Set(["requestId", "provider", "model", "module", "task", "siteId", "userId", "status", "code", "durationMs", "inputTokens", "outputTokens", "attempt", "strategy", "reason", "circuit"]);
function createLogger({ sink = null, keep = 200 } = {}) {
  const ring = [];
  const out = sink || ((line) => process.stderr.write(`${line}\n`));
  const api = {
    event(level, event, fields = {}) {
      const rec = { ts: new Date().toISOString(), level, event };
      for (const [k, v] of Object.entries(fields)) if (ALLOWED.has(k) && v !== undefined && v !== null) rec[k] = typeof v === "string" ? scrub(v).slice(0, 200) : v;
      ring.push(rec); if (ring.length > keep) ring.shift();
      if (level !== "debug") out(`[KOLAKISA-AI] ${JSON.stringify(rec)}`);
      return rec;
    },
    recent: (n = 50) => ring.slice(-n),
  };
  return api;
}
module.exports = { createLogger };
