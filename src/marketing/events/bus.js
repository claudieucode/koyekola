// Bus d'événements : « course_purchased », « user_registered »… L'événement est enregistré puis distribué à ses
// gestionnaires PAR LA FILE (jamais dans la requête d'origine), avec reprises en cas d'échec.
//  - emit() écrit l'événement ET son travail de distribution dans une même transaction (SAVEPOINT) : depuis le LMS, dans la
//    transaction d'une commande, tout est validé ou annulé ensemble ;
//  - une clé d'idempotence évite les doublons (webhook reçu deux fois, événement rejoué) ;
//  - un gestionnaire peut être appelé plus d'une fois (reprise après échec partiel) : il DOIT être idempotent.
const jobs = require("../queue/jobs");
const { UnrecoverableError } = require("../queue/worker");

const NAME = /^[a-z][a-z0-9_.]{1,63}$/;
const SOURCE = /^[a-z][a-z0-9_.-]{0,40}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_METADATA = 16384;

const badName = () => new Error("Nom d'événement invalide (minuscules, chiffres, « _ » et « . » ; 2 à 64 caractères, commence par une lettre).");

function createEventBus(db, { log = console, now = Date.now } = {}) {
  const handlers = new Map(); // nom (ou « * ») → [gestionnaires]

  function on(name, handler) {
    if (name !== "*" && !NAME.test(String(name))) throw badName();
    if (typeof handler !== "function") throw new Error("Le gestionnaire d'un événement doit être une fonction.");
    if (!handlers.has(name)) handlers.set(name, []);
    handlers.get(name).push(handler);
  }

  function emit({ organizationId, name, email, contactId = null, source = "api", metadata = {}, idempotencyKey = null, occurredAt } = {}) {
    if (!Number.isInteger(organizationId) || organizationId < 1) throw new Error("Identifiant d'organisation invalide.");
    if (typeof name !== "string" || !NAME.test(name)) throw badName();
    let address = null;
    if (email !== undefined && email !== null && email !== "") {
      address = String(email).trim().toLowerCase();
      if (address.length > 254 || !EMAIL.test(address)) throw new Error("Adresse e-mail invalide.");
    }
    if (typeof source !== "string" || !SOURCE.test(source)) throw new Error("Source d'événement invalide.");
    if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) throw new Error("Métadonnées invalides : un objet est attendu.");
    const json = JSON.stringify(metadata);
    if (json.length > MAX_METADATA) throw new Error("Métadonnées trop volumineuses (16 Ko au plus).");
    if (idempotencyKey !== null && (typeof idempotencyKey !== "string" || !idempotencyKey || idempotencyKey.length > 200)) throw new Error("Clé d'idempotence invalide (1 à 200 caractères).");

    const at = now();
    db.exec("SAVEPOINT mk_emit");
    try {
      const info = db
        .prepare(
          `INSERT OR IGNORE INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, metadata, idempotency_key, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(organizationId, name, address, contactId, source, occurredAt ?? at, json, idempotencyKey, at);
      if (info.changes === 0) {
        const existing = db.prepare("SELECT id FROM mk_events WHERE organization_id = ? AND idempotency_key = ?").get(organizationId, idempotencyKey);
        db.exec("RELEASE mk_emit");
        return { id: existing.id, duplicate: true };
      }
      const id = Number(info.lastInsertRowid);
      jobs.enqueue(db, { organizationId, type: "event.dispatch", payload: { eventId: id }, priority: 4, idempotencyKey: `event:${id}`, now: at });
      db.exec("RELEASE mk_emit");
      return { id, duplicate: false };
    } catch (error) {
      db.exec("ROLLBACK TO mk_emit");
      db.exec("RELEASE mk_emit");
      throw error;
    }
  }

  // Distribue un événement à ses gestionnaires (appelé par la file). Un événement déjà traité n'est jamais redistribué.
  async function dispatch(eventId) {
    const row = db.prepare("SELECT * FROM mk_events WHERE id = ?").get(eventId);
    if (!row) throw new UnrecoverableError(`Événement #${eventId} introuvable.`);
    if (row.processed_at) return;
    const event = {
      id: row.id, organizationId: row.organization_id, name: row.name, email: row.email, contactId: row.contact_id,
      source: row.source, occurredAt: row.occurred_at, metadata: JSON.parse(row.metadata),
    };
    for (const handler of [...(handlers.get(row.name) || []), ...(handlers.get("*") || [])]) await handler(event, { db, log });
    db.prepare("UPDATE mk_events SET processed_at = ? WHERE id = ? AND processed_at IS NULL").run(now(), row.id);
  }

  // Nouvelle distribution d'un événement (action d'un administrateur), uniquement dans son organisation
  function replay(eventId, { organizationId }) {
    const changed = db.prepare("UPDATE mk_events SET processed_at = NULL WHERE id = ? AND organization_id = ?").run(eventId, organizationId).changes;
    if (!changed) return false;
    jobs.enqueue(db, { organizationId, type: "event.dispatch", payload: { eventId }, priority: 4, idempotencyKey: `event:${eventId}:replay:${now()}`, now: now() });
    return true;
  }

  return { on, emit, replay, dispatch, jobHandlers: () => ({ "event.dispatch": ({ eventId }) => dispatch(eventId) }) };
}

module.exports = { createEventBus };
