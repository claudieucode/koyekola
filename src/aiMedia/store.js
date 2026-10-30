// AI Media — tables créées à la demande (les migrations sont figées par test) : métadonnées étendues des médias (provenance, licence, tags…), besoins visuels, tâches, emplacements affectés, historique.
// La médiathèque native (mk_media) reste la seule source des fichiers : ces tables ne contiennent AUCUN fichier, seulement des références (media_id) et des métadonnées.
function ensureSchema(db) {
  db.exec(`
  CREATE TABLE IF NOT EXISTS mk_aimedia_meta (
    media_id INTEGER PRIMARY KEY REFERENCES mk_media(id) ON DELETE CASCADE, organization_id INTEGER NOT NULL, site_id INTEGER,
    source TEXT NOT NULL DEFAULT 'user', provider TEXT NOT NULL DEFAULT '', model TEXT NOT NULL DEFAULT '', prompt TEXT NOT NULL DEFAULT '',
    ai_generated INTEGER NOT NULL DEFAULT 0, license TEXT NOT NULL DEFAULT '', license_note TEXT NOT NULL DEFAULT '', author TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]', category TEXT NOT NULL DEFAULT '', caption TEXT NOT NULL DEFAULT '', description TEXT NOT NULL DEFAULT '',
    focal_x REAL, focal_y REAL, task_id INTEGER, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE INDEX IF NOT EXISTS mk_aimedia_meta_site ON mk_aimedia_meta (organization_id, site_id, source);
  CREATE TABLE IF NOT EXISTS mk_aimedia_needs (
    id INTEGER PRIMARY KEY AUTOINCREMENT, organization_id INTEGER NOT NULL, site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE, need_key TEXT NOT NULL,
    page_id INTEGER, page_name TEXT NOT NULL DEFAULT '', section_id TEXT NOT NULL DEFAULT '', widget TEXT NOT NULL DEFAULT '', slot TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '', prompt TEXT NOT NULL DEFAULT '', style TEXT NOT NULL DEFAULT '', format TEXT NOT NULL DEFAULT 'png', ratio TEXT NOT NULL DEFAULT '3:2',
    width INTEGER, height INTEGER, priority INTEGER NOT NULL DEFAULT 5, status TEXT NOT NULL DEFAULT 'needed', reason TEXT NOT NULL DEFAULT '', media_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE (site_id, need_key));
  CREATE TABLE IF NOT EXISTS mk_aimedia_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT, organization_id INTEGER NOT NULL, site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE, user_id INTEGER, need_key TEXT NOT NULL,
    provider TEXT NOT NULL, model TEXT NOT NULL, ratio TEXT NOT NULL, variants INTEGER NOT NULL DEFAULT 1, prompt TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'queued',
    attempts INTEGER NOT NULL DEFAULT 0, error_code TEXT NOT NULL DEFAULT '', error TEXT NOT NULL DEFAULT '', idempotency_key TEXT NOT NULL, media_ids TEXT NOT NULL DEFAULT '[]',
    usage_row INTEGER, est_cost_micro INTEGER, real_cost_micro INTEGER, duration_ms INTEGER, parent_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')), started_at TEXT, finished_at TEXT, UNIQUE (site_id, idempotency_key));
  CREATE INDEX IF NOT EXISTS mk_aimedia_tasks_site ON mk_aimedia_tasks (site_id, id DESC);
  CREATE TABLE IF NOT EXISTS mk_aimedia_slots (
    site_id INTEGER NOT NULL, page_id INTEGER NOT NULL, section_id TEXT NOT NULL, slot TEXT NOT NULL, need_key TEXT NOT NULL, media_id INTEGER, media_path TEXT NOT NULL DEFAULT '',
    set_by TEXT NOT NULL DEFAULT 'ai', set_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (page_id, section_id, slot));
  CREATE TABLE IF NOT EXISTS mk_aimedia_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT, organization_id INTEGER NOT NULL, site_id INTEGER NOT NULL, user_id INTEGER, at TEXT NOT NULL DEFAULT (datetime('now')), op TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT '', model TEXT NOT NULL DEFAULT '', prompt TEXT NOT NULL DEFAULT '', params TEXT NOT NULL DEFAULT '{}', result TEXT NOT NULL DEFAULT '',
    est_cost_micro INTEGER, real_cost_micro INTEGER, duration_ms INTEGER, status TEXT NOT NULL DEFAULT 'ok', error TEXT NOT NULL DEFAULT '', media_id INTEGER, previous_media_id INTEGER,
    need_key TEXT NOT NULL DEFAULT '', page_id INTEGER, task_id INTEGER);
  CREATE INDEX IF NOT EXISTS mk_aimedia_history_site ON mk_aimedia_history (site_id, id DESC);`);
}
const json = (s, d) => { try { const v = JSON.parse(s); return v && typeof v === "object" ? v : d; } catch { return d; } };
function history(ctx, row) {
  ctx.db.prepare("INSERT INTO mk_aimedia_history (organization_id, site_id, user_id, op, provider, model, prompt, params, result, est_cost_micro, real_cost_micro, duration_ms, status, error, media_id, previous_media_id, need_key, page_id, task_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, row.siteId, ctx.userId ?? null, row.op, row.provider || "", row.model || "", row.prompt || "", JSON.stringify(row.params || {}), row.result || "", row.estCost ?? null, row.realCost ?? null, row.durationMs ?? null, row.status || "ok", String(row.error || "").slice(0, 300), row.mediaId ?? null, row.previousMediaId ?? null, row.needKey || "", row.pageId ?? null, row.taskId ?? null);
}
module.exports = { ensureSchema, json, history };
