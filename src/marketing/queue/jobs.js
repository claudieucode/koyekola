// File de travaux (dans SQLite). Garanties :
//  - un travail n'est réservé que par UN worker à la fois (réservation atomique en une seule instruction) ;
//  - un worker qui plante rend ses travaux : son bail expire et un autre worker les reprend (« au moins une fois ») ;
//  - un travail ne peut pas être créé deux fois avec la même clé d'idempotence ;
//  - les échecs sont repris avec un délai croissant, puis abandonnés (« dead ») et gardés pour le diagnostic.
// Conséquence à retenir : un gestionnaire peut être appelé plus d'une fois pour le même travail → il doit être idempotent.
const TYPE = /^[a-z][a-z0-9_.]{1,63}$/;
const MAX_PAYLOAD = 65536;
const MAX_ERROR = 500;
const MAX_CLAIM = 100;

function enqueue(db, { organizationId = null, type, payload = {}, runAt, priority = 5, maxAttempts = 5, idempotencyKey = null, now = Date.now() } = {}) {
  if (typeof type !== "string" || !TYPE.test(type)) throw new Error("Type de travail invalide (minuscules, chiffres, « _ » et « . » ; 2 à 64 caractères).");
  if (!Number.isInteger(priority) || priority < 1 || priority > 9) throw new Error("Priorité invalide (1 à 9).");
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20) throw new Error("Nombre de tentatives invalide (1 à 20).");
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) throw new Error("La charge utile d'un travail doit être un objet.");
  const json = JSON.stringify(payload);
  if (json.length > MAX_PAYLOAD) throw new Error("Charge utile trop volumineuse (64 Ko au plus) : stockez l'identifiant, pas les données.");
  if (idempotencyKey !== null && (typeof idempotencyKey !== "string" || !idempotencyKey || idempotencyKey.length > 200)) throw new Error("Clé d'idempotence invalide (1 à 200 caractères).");

  const info = db
    .prepare(
      `INSERT OR IGNORE INTO mk_jobs (organization_id, type, payload, priority, run_at, max_attempts, idempotency_key, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(organizationId, type, json, priority, runAt ?? now, maxAttempts, idempotencyKey, now, now);
  if (info.changes > 0) return { id: Number(info.lastInsertRowid), duplicate: false };
  const existing = db.prepare("SELECT id FROM mk_jobs WHERE organization_id IS ? AND idempotency_key = ?").get(organizationId, idempotencyKey);
  return { id: existing.id, duplicate: true };
}

function parsePayload(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

// Réserve jusqu'à `limit` travaux prêts (ou dont le bail a expiré). Renvoie les travaux réservés, dans l'ordre d'exécution.
function claim(db, { workerId, limit = 10, leaseMs = 60_000, now = Date.now(), types } = {}) {
  if (!workerId) throw new Error("workerId obligatoire.");
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_CLAIM) throw new Error(`Limite invalide (1 à ${MAX_CLAIM}).`);

  // Un travail abandonné (bail expiré) qui a épuisé ses tentatives est mis de côté au lieu de boucler à l'infini
  db.prepare(
    `UPDATE mk_jobs SET state = 'dead', locked_by = NULL, locked_until = NULL, finished_at = ?, updated_at = ?,
       last_error = COALESCE(last_error, 'travail interrompu') || ' | bail expiré : tentatives épuisées'
     WHERE state = 'running' AND locked_until < ? AND attempts >= max_attempts`
  ).run(now, now, now);

  const typeFilter = types && types.length ? ` AND type IN (${types.map(() => "?").join(", ")})` : "";
  const rows = db
    .prepare(
      `UPDATE mk_jobs SET state = 'running', locked_by = ?, locked_until = ?, attempts = attempts + 1, updated_at = ?
       WHERE id IN (
         SELECT id FROM mk_jobs
         WHERE ((state = 'pending' AND run_at <= ?) OR (state = 'running' AND locked_until < ?))${typeFilter}
         ORDER BY priority, run_at, id LIMIT ?
       ) RETURNING *`
    )
    .all(workerId, now + leaseMs, now, now, now, ...(types || []), limit);
  return rows
    .map((r) => ({ ...r, payload: parsePayload(r.payload) }))
    .sort((a, b) => a.priority - b.priority || a.run_at - b.run_at || a.id - b.id);
}

// Termine un travail. Renvoie false si le worker n'en est plus propriétaire (son bail a expiré et un autre l'a repris).
function complete(db, job, { workerId, now = Date.now() } = {}) {
  return (
    db
      .prepare("UPDATE mk_jobs SET state = 'done', finished_at = ?, updated_at = ?, locked_by = NULL, locked_until = NULL, last_error = NULL WHERE id = ? AND state = 'running' AND locked_by = ?")
      .run(now, now, job.id, workerId).changes > 0
  );
}

// Délai avant nouvelle tentative : 30 s, 1 min, 2 min… plafonné à 1 h, avec ±20 % d'aléa (évite que tout reparte en même temps)
function backoffMs(attempts, { base = 30_000, cap = 3_600_000, random = Math.random } = {}) {
  return Math.round(Math.min(cap, base * 2 ** (attempts - 1)) * (0.8 + 0.4 * random()));
}

// Enregistre un échec : nouvelle tentative plus tard, ou abandon (« dead ») si les tentatives sont épuisées / erreur définitive
function fail(db, job, error, { workerId, retryable = true, now = Date.now(), random = Math.random } = {}) {
  const message = String((error && error.message) || error).slice(0, MAX_ERROR);
  const dead = !retryable || job.attempts >= job.max_attempts;
  const info = dead
    ? db
        .prepare("UPDATE mk_jobs SET state = 'dead', last_error = ?, finished_at = ?, updated_at = ?, locked_by = NULL, locked_until = NULL WHERE id = ? AND state = 'running' AND locked_by = ?")
        .run(message, now, now, job.id, workerId)
    : db
        .prepare("UPDATE mk_jobs SET state = 'pending', last_error = ?, run_at = ?, updated_at = ?, locked_by = NULL, locked_until = NULL WHERE id = ? AND state = 'running' AND locked_by = ?")
        .run(message, now + backoffMs(job.attempts, { random }), now, job.id, workerId);
  if (info.changes === 0) return { state: null, lost: true };
  return { state: dead ? "dead" : "pending" };
}

// Remet en attente un travail abandonné (action d'un administrateur), uniquement dans son organisation
function retryDead(db, id, { organizationId, now = Date.now() } = {}) {
  if (organizationId === undefined) throw new Error("organizationId obligatoire (null pour un travail système).");
  return (
    db
      .prepare("UPDATE mk_jobs SET state = 'pending', attempts = 0, run_at = ?, updated_at = ?, locked_by = NULL, locked_until = NULL, finished_at = NULL WHERE id = ? AND state = 'dead' AND organization_id IS ?")
      .run(now, now, id, organizationId).changes > 0
  );
}

function stats(db, { organizationId, now = Date.now() } = {}) {
  const scoped = organizationId !== undefined;
  const rows = db
    .prepare(`SELECT state, COUNT(*) AS n, MIN(CASE WHEN state = 'pending' THEN run_at END) AS oldest FROM mk_jobs${scoped ? " WHERE organization_id IS ?" : ""} GROUP BY state`)
    .all(...(scoped ? [organizationId] : []));
  const result = { pending: 0, running: 0, done: 0, dead: 0, oldestPendingMs: 0 };
  for (const r of rows) {
    result[r.state] = r.n;
    if (r.state === "pending" && r.oldest !== null) result.oldestPendingMs = Math.max(0, now - r.oldest);
  }
  return result;
}

// Supprime les travaux terminés depuis plus de `olderThanMs` (leur clé d'idempotence redevient utilisable)
function purge(db, { olderThanMs = 30 * 24 * 3600 * 1000, now = Date.now() } = {}) {
  return db.prepare("DELETE FROM mk_jobs WHERE state = 'done' AND finished_at < ?").run(now - olderThanMs).changes;
}

module.exports = { enqueue, claim, complete, fail, retryDead, stats, purge, backoffMs };
