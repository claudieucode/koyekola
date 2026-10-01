// Planification des passages : une clé d'idempotence UNIQUE par planification (jamais réutilisée), sinon un travail
// « déjà fait » masquerait une reprise légitime et le passage resterait bloqué.
const crypto = require("crypto");
const { enqueue } = require("../queue/jobs");

function enqueueRun(db, { organizationId, runId, runAt, tag = "run" }) {
  return enqueue(db, {
    organizationId, type: "automation.run", payload: { organizationId, runId }, runAt, priority: 4, maxAttempts: 5,
    idempotencyKey: `automation:${runId}:${tag}:${runAt}:${crypto.randomBytes(3).toString("hex")}`,
  });
}
module.exports = { enqueueRun };
