// Pont LMS → événements. Le pont LIT les tables du LMS (jamais l'inverse, aucune route du LMS n'est modifiée) avec un curseur par
// table, et émet des événements idempotents (clé « source:identifiant ») : rejouer, redémarrer ou relire ne crée aucun doublon.
//  - la PREMIÈRE lecture pose le curseur au dernier identifiant existant et n'émet RIEN : l'historique du LMS ne déclenche jamais
//    d'automatisation (sinon tous vos anciens élèves recevraient un « bienvenue ») ;
//  - les événements sont distribués par la file (worker), avec reprises, jamais dans la requête du LMS ;
//  - un compte sans contact (adresse invalide) ne bloque rien : l'événement est ignoré, le curseur avance.
const { transaction } = require("../db/tx");
const { normalizeEmail } = require("../audience/email");
const { findByEmail } = require("../audience/contacts");
const { syncLmsUsers } = require("./lms");
const { enqueue } = require("../queue/jobs");

const INTERVAL_MS = 30000;
const SOURCES = ["users", "orders", "enrollments", "lesson_progress", "reviews", "favorites", "certificates"];
const idColumn = (source) => (source === "favorites" ? "rowid" : "id");
const stamp = (text) => { const t = Date.parse(`${String(text).replace(" ", "T")}Z`); return Number.isFinite(t) ? t : Date.now(); };

// Contact d'un compte du LMS : lié par identifiant ET adresse (les identifiants sont réutilisés après un « npm run seed »)
function contactOf(ctx, userId) {
  const user = ctx.db.prepare("SELECT id, email, role FROM users WHERE id = ?").get(userId);
  if (!user) return null;
  const email = normalizeEmail(user.email);
  return ctx.db.prepare("SELECT id, email FROM mk_contacts WHERE organization_id = ? AND lms_user_id = ? AND email = ?").get(ctx.organizationId, user.id, email) ?? findByEmail(ctx, email);
}

function money(cents) {
  return `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

const reader = {
  users: (ctx, cursor, limit) => ctx.db.prepare("SELECT id, id AS user_id, created_at, role FROM users WHERE id > ? ORDER BY id LIMIT ?").all(cursor, limit),
  orders: (ctx, cursor, limit) => ctx.db.prepare("SELECT id, user_id, total_cents, created_at FROM orders WHERE id > ? ORDER BY id LIMIT ?").all(cursor, limit),
  enrollments: (ctx, cursor, limit) =>
    ctx.db.prepare("SELECT e.id, e.user_id, e.course_id, e.created_at, c.title, c.slug FROM enrollments e LEFT JOIN courses c ON c.id = e.course_id WHERE e.id > ? ORDER BY e.id LIMIT ?").all(cursor, limit),
  lesson_progress: (ctx, cursor, limit) =>
    ctx.db
      .prepare(
        `SELECT p.id, p.user_id, p.lesson_id, p.completed_at AS created_at, l.title AS lesson_title, s.course_id, c.title AS course_title, c.slug
         FROM lesson_progress p LEFT JOIN lessons l ON l.id = p.lesson_id LEFT JOIN sections s ON s.id = l.section_id LEFT JOIN courses c ON c.id = s.course_id
         WHERE p.id > ? ORDER BY p.id LIMIT ?`
      )
      .all(cursor, limit),
  reviews: (ctx, cursor, limit) =>
    ctx.db.prepare("SELECT r.id, r.user_id, r.course_id, r.rating, r.created_at, c.title, c.slug FROM reviews r LEFT JOIN courses c ON c.id = r.course_id WHERE r.id > ? ORDER BY r.id LIMIT ?").all(cursor, limit),
  certificates: (ctx, cursor, limit) =>
    ctx.db.prepare("SELECT c.id, c.user_id, c.course_id, c.code, c.issued_at AS created_at, c.course_title AS title, co.slug FROM certificates c LEFT JOIN courses co ON co.id = c.course_id WHERE c.id > ? ORDER BY c.id LIMIT ?").all(cursor, limit),
  favorites: (ctx, cursor, limit) =>
    ctx.db.prepare("SELECT f.rowid AS id, f.user_id, f.course_id, f.created_at, c.title, c.slug FROM favorites f LEFT JOIN courses c ON c.id = f.course_id WHERE f.rowid > ? ORDER BY f.rowid LIMIT ?").all(cursor, limit),
};

// → liste d'événements { name, userId, key, metadata, at } pour une ligne ; plusieurs possibles (commande → commande + …)
function eventsFor(ctx, source, row) {
  const at = stamp(row.created_at);
  switch (source) {
    case "users":
      return row.role === "formateur" ? [] : [{ name: "lms.user_registered", userId: row.user_id, key: `user:${row.id}`, metadata: { userId: row.user_id }, at }];
    case "orders": {
      const items = ctx.db
        .prepare("SELECT i.course_id, i.price_cents, c.title FROM order_items i LEFT JOIN courses c ON c.id = i.course_id WHERE i.order_id = ? ORDER BY i.id LIMIT 10")
        .all(row.id)
        .map((i) => ({ courseId: i.course_id, title: i.title ?? "", priceCents: i.price_cents }));
      const title = items.length === 1 ? items[0].title : items.length > 1 ? `${items.length} formations` : "";
      const slug = items.length === 1 ? ctx.db.prepare("SELECT slug FROM courses WHERE id = ?").get(items[0].courseId)?.slug ?? "" : "";
      return [{ name: "lms.order_completed", userId: row.user_id, key: `order:${row.id}`, at, metadata: { orderId: row.id, totalCents: row.total_cents, orderTotal: money(row.total_cents), items, courseTitle: title, courseSlug: slug } }];
    }
    case "enrollments":
      return [{ name: "lms.course_enrolled", userId: row.user_id, key: `enrollment:${row.id}`, at, metadata: { courseId: row.course_id, title: row.title ?? "", slug: row.slug ?? "" } }];
    case "lesson_progress":
      return [{ name: "lms.lesson_completed", userId: row.user_id, key: `lesson_progress:${row.id}`, at, metadata: { lessonId: row.lesson_id, lessonTitle: row.lesson_title ?? "", courseId: row.course_id, title: row.course_title ?? "", slug: row.slug ?? "" } }];
    case "reviews":
      return [{ name: "lms.review_posted", userId: row.user_id, key: `review:${row.id}`, at, metadata: { courseId: row.course_id, rating: row.rating, title: row.title ?? "", slug: row.slug ?? "" } }];
    case "favorites":
      return [{ name: "lms.favorite_added", userId: row.user_id, key: `favorite:${row.id}`, at, metadata: { courseId: row.course_id, title: row.title ?? "", slug: row.slug ?? "" } }];
    case "certificates":
      return [{ name: "lms.certificate_issued", userId: row.user_id, key: `certificate:${row.id}`, at, metadata: { courseId: row.course_id, title: row.title ?? "", slug: row.slug ?? "", certificateCode: row.code } }];
    default:
      return [];
  }
}

// Formation terminée : DÉRIVÉE (toutes les leçons faites), une seule fois par élève et par formation
function completedCourses(ctx, rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (!r.course_id || seen.has(`${r.user_id}:${r.course_id}`)) continue;
    seen.add(`${r.user_id}:${r.course_id}`);
    const total = ctx.db.prepare("SELECT COUNT(*) n FROM lessons l JOIN sections s ON s.id = l.section_id WHERE s.course_id = ?").get(r.course_id).n;
    const done = ctx.db.prepare("SELECT COUNT(*) n FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id JOIN sections s ON s.id = l.section_id WHERE s.course_id = ? AND p.user_id = ?").get(r.course_id, r.user_id).n;
    if (total > 0 && done >= total) out.push({ name: "lms.course_completed", userId: r.user_id, key: `course_completed:${r.user_id}:${r.course_id}`, at: stamp(r.created_at), metadata: { courseId: r.course_id, title: r.course_title ?? "", slug: r.slug ?? "" } });
  }
  return out;
}

// Progression d'un élève dans une formation : 10 %, 50 % et 90 % des leçons faites (100 % = « formation terminée »).
// Une fois par élève, par formation et par palier ; un saut (ex. 0 → 60 %) émet les paliers franchis (10 et 50).
const MILESTONES = [10, 50, 90];
function progressMilestones(ctx, rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (!r.course_id || seen.has(`${r.user_id}:${r.course_id}`)) continue;
    seen.add(`${r.user_id}:${r.course_id}`);
    const total = ctx.db.prepare("SELECT COUNT(*) n FROM lessons l JOIN sections s ON s.id = l.section_id WHERE s.course_id = ?").get(r.course_id).n;
    if (!total) continue;
    const done = ctx.db.prepare("SELECT COUNT(*) n FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id JOIN sections s ON s.id = l.section_id WHERE s.course_id = ? AND p.user_id = ?").get(r.course_id, r.user_id).n;
    const percent = Math.floor((done / total) * 100);
    for (const m of MILESTONES) {
      if (percent < m) continue;
      out.push({ name: `lms.course_progress_${m}`, userId: r.user_id, key: `course_progress:${r.user_id}:${r.course_id}:${m}`, at: stamp(r.created_at), metadata: { courseId: r.course_id, title: r.course_title ?? "", slug: r.slug ?? "", percent: m } });
    }
  }
  return out;
}

function syncLmsEvents(ctx, { limit = 200 } = {}) {
  const result = { initialized: [], emitted: {}, skipped: {} };
  const base = { ...ctx, userId: null };
  syncLmsUsers(base, { limit: 500 }); // les nouveaux comptes deviennent des contacts (« unknown ») avant leurs événements

  for (const source of SOURCES) {
    const table = source;
    // Table source absente (base du LMS plus ancienne, ou base de test réduite) : cette source est ignorée, jamais une erreur
    if (!ctx.db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table)) continue;
    const col = idColumn(source);
    const max = ctx.db.prepare(`SELECT COALESCE(MAX(${col}), 0) m FROM ${table}`).get().m;
    const cursor = ctx.db.prepare("SELECT last_id FROM mk_bridge_cursors WHERE organization_id = ? AND source = ?").get(ctx.organizationId, source);
    const save = (id) => ctx.db.prepare("INSERT INTO mk_bridge_cursors (organization_id, source, last_id) VALUES (?, ?, ?) ON CONFLICT (organization_id, source) DO UPDATE SET last_id = excluded.last_id, updated_at = datetime('now')").run(ctx.organizationId, source, id);
    if (!cursor) { save(max); result.initialized.push(source); continue; }
    if (cursor.last_id > max) { save(max); continue; } // table réinitialisée (« npm run seed ») : on se recale sans rien rejouer

    const rows = reader[source](ctx, cursor.last_id, limit);
    if (!rows.length) continue;
    transaction(ctx.db, () => {
      let emitted = 0;
      let skipped = 0;
      const list = rows.flatMap((row) => eventsFor(ctx, source, row));
      if (source === "lesson_progress") list.push(...progressMilestones(ctx, rows), ...completedCourses(ctx, rows));
      for (const ev of list) {
        const contact = contactOf(ctx, ev.userId);
        if (!contact) { skipped++; continue; }
        ctx.bus.emit({ organizationId: ctx.organizationId, name: ev.name, email: contact.email, contactId: contact.id, source: "lms", metadata: ev.metadata, idempotencyKey: ev.key, occurredAt: ev.at });
        emitted++;
        // Palier 19 : un achat réel (commande terminée dans le LMS, source de vérité du paiement) devient aussi « purchase.completed » pour le Contact Core et les
        // automatisations, avec le DERNIER tunnel touché avant l'achat (attribution « dernier contact », indicative — pas une preuve de causalité)
        if (ev.name === "lms.order_completed") {
          const touch = ctx.db.prepare("SELECT metadata FROM mk_events WHERE organization_id = ? AND contact_id = ? AND name = 'funnel.step_reached' AND occurred_at <= ? AND occurred_at >= ? ORDER BY occurred_at DESC, id DESC LIMIT 1").get(ctx.organizationId, contact.id, ev.at, ev.at - 30 * 86400000);
          let t = {};
          try { t = touch ? JSON.parse(touch.metadata) : {}; } catch { t = {}; }
          ctx.bus.emit({ organizationId: ctx.organizationId, name: "purchase.completed", email: contact.email, contactId: contact.id, source: "commerce", objectType: "order", objectId: ev.metadata.orderId, idempotencyKey: `purchase.completed:${ev.key}`, occurredAt: ev.at,
            metadata: { orderId: ev.metadata.orderId, totalCents: ev.metadata.totalCents, orderTotal: ev.metadata.orderTotal, items: ev.metadata.items, ...(t.funnelId ? { funnelId: t.funnelId, funnelName: t.funnelName, funnelStepId: t.stepId, funnelStepName: t.stepName, attribution: "last_funnel_step_30d" } : {}) } });
        }
      }
      // une ligne sans événement (formateur, compte sans contact) compte comme « ignorée » pour le rapport
      if (source !== "lesson_progress") skipped = Math.max(0, rows.length - emitted) ;
      if (emitted) result.emitted[source] = emitted;
      if (skipped) result.skipped[source] = skipped;
      save(rows[rows.length - 1].id);
    });
  }
  return result;
}

// ---------- Tâche récurrente (30 s) : les chaînes se fusionnent grâce à la clé d'idempotence par tranche de temps ----------
const bucket = (now) => Math.floor(now / INTERVAL_MS);
function startBridge(db, organizationId, { now = Date.now } = {}) {
  const at = now();
  return enqueue(db, { organizationId, type: "bridge.sync", payload: { organizationId }, runAt: at, priority: 6, maxAttempts: 3, idempotencyKey: `bridge.sync:${organizationId}:${bucket(at)}`, now: at });
}

function jobHandlers({ db, bus, now = Date.now, log = console }) {
  return {
    "bridge.sync": async ({ organizationId }) => {
      try {
        syncLmsEvents({ db, organizationId, userId: null, bus, log }, { limit: 200 });
        // Palier 19 : détection des abandons (tunnel, commande) toutes les 5 minutes au plus, par la MÊME tâche récurrente (aucune seconde planification)
        const nowMs = now();
        const last = db.prepare("SELECT value FROM mk_settings WHERE organization_id = ? AND key = 'internal.funnel_sweep_at'").get(organizationId);
        if (!last || nowMs - Number(last.value) >= 5 * 60000) {
          db.prepare("INSERT INTO mk_settings (organization_id, key, value) VALUES (?, 'internal.funnel_sweep_at', ?) ON CONFLICT (organization_id, key) DO UPDATE SET value = excluded.value").run(organizationId, String(nowMs));
          require("../funnels/abandon").sweep({ db, organizationId, userId: null, bus, audit: false }, { now: nowMs });
        }
      } finally {
        // Toujours reprogrammer, même après une erreur : le pont ne doit jamais s'arrêter en silence
        const next = now() + INTERVAL_MS;
        enqueue(db, { organizationId, type: "bridge.sync", payload: { organizationId }, runAt: next, priority: 6, maxAttempts: 3, idempotencyKey: `bridge.sync:${organizationId}:${bucket(next)}`, now: now() });
      }
    },
  };
}

module.exports = { SOURCES, syncLmsEvents, startBridge, jobHandlers, contactOf };
