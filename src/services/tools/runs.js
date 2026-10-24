// Opérations d'outils (palier 13) : une « exécution » = un import, un export, une analyse de santé, un contrôle d'intégrité…
// Table cms_tool_runs : état, progression RÉELLE (compteurs mis à jour au rythme du travail), rapport, annulation demandée.
// Les exécutions longues passent par la file de travaux existante (mk_jobs, voir runner.js) : pas de deuxième file.
const db = require("../../config/database");

db.exec(`
  CREATE TABLE IF NOT EXISTS cms_tool_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    organization_id INTEGER NOT NULL,
    site_id INTEGER,
    user_id INTEGER,
    kind TEXT NOT NULL,                       -- import | export | health | integrity | links | content
    status TEXT NOT NULL DEFAULT 'queued',    -- queued | running | awaiting | done | failed | cancelled
    phase TEXT NOT NULL DEFAULT '',           -- analyse | apply (import), scan…
    options TEXT NOT NULL DEFAULT '{}',
    input TEXT,                               -- fichier d'import (JSON), jamais exécuté
    plan TEXT,                                -- décisions de l'analyse (import)
    report TEXT,                              -- rapport final
    result TEXT,                              -- fichier produit (export)
    total INTEGER NOT NULL DEFAULT 0,
    done INTEGER NOT NULL DEFAULT 0,
    failed INTEGER NOT NULL DEFAULT 0,
    skipped INTEGER NOT NULL DEFAULT 0,
    conflicts INTEGER NOT NULL DEFAULT 0,
    message TEXT,
    cancel_requested INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    started_at TEXT,
    finished_at TEXT,
    expires_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_cms_tool_runs_kind ON cms_tool_runs(organization_id, kind, id);
`);

const JSON_COLS = ["options", "plan", "report"];
const parse = (text, fallback) => { try { return text ? JSON.parse(text) : fallback; } catch { return fallback; } };
const shape = (r, { heavy = false } = {}) => {
  if (!r) return null;
  const out = { ...r, options: parse(r.options, {}), plan: heavy ? parse(r.plan, null) : undefined, report: parse(r.report, null) };
  if (!heavy) { delete out.plan; delete out.input; delete out.result; out.hasResult = Boolean(r.has_result); }
  else out.hasResult = Boolean(r.result);
  return out;
};
const LIGHT = "id, organization_id, site_id, user_id, kind, status, phase, options, report, total, done, failed, skipped, conflicts, message, cancel_requested, created_at, started_at, finished_at, expires_at, (result IS NOT NULL) AS has_result";

function create({ organizationId, siteId = null, userId = null, kind, options = {}, input = null, expiresInHours = null }) {
  const info = db.prepare("INSERT INTO cms_tool_runs (organization_id, site_id, user_id, kind, options, input, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(organizationId, siteId, userId, kind, JSON.stringify(options), input, expiresInHours ? new Date(Date.now() + expiresInHours * 3600e3).toISOString().slice(0, 19).replace("T", " ") : null);
  return get(organizationId, Number(info.lastInsertRowid));
}
// Toujours borné à l'organisation : l'identifiant d'une autre organisation n'est jamais lisible (IDOR)
function get(organizationId, id, { heavy = false } = {}) {
  const row = db.prepare(`SELECT ${heavy ? "*" : LIGHT} FROM cms_tool_runs WHERE id = ? AND organization_id = ?`).get(Number(id), organizationId);
  return shape(row, { heavy });
}
// Lecture interne (exécuteur) : colonnes lourdes comprises
const raw = (id) => db.prepare("SELECT * FROM cms_tool_runs WHERE id = ?").get(Number(id));
function update(id, patch) {
  const cols = Object.keys(patch).filter((c) => patch[c] !== undefined);
  if (!cols.length) return;
  db.prepare(`UPDATE cms_tool_runs SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`).run(...cols.map((c) => (JSON_COLS.includes(c) || c === "result") && patch[c] !== null && typeof patch[c] !== "string" ? JSON.stringify(patch[c]) : patch[c]), Number(id));
}
function list(organizationId, kind, { siteId, limit = 20 } = {}) {
  const where = ["organization_id = ?", "kind = ?"];
  const args = [organizationId, kind];
  if (siteId !== undefined) { where.push("site_id IS ?"); args.push(siteId); }
  return db.prepare(`SELECT ${LIGHT} FROM cms_tool_runs WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT ?`).all(...args, limit).map((r) => shape(r));
}
const latest = (organizationId, kind, siteId = null) => list(organizationId, kind, { siteId, limit: 1 })[0] || null;
const requestCancel = (organizationId, id) => db.prepare("UPDATE cms_tool_runs SET cancel_requested = 1 WHERE id = ? AND organization_id = ? AND status IN ('queued', 'running', 'awaiting')").run(Number(id), organizationId).changes > 0;
// Exports expirés et anciennes exécutions : nettoyés (les rapports récents restent consultables)
function purge({ keepDays = 60 } = {}) {
  // Archives d'export (fichiers privés) : supprimées du disque AVANT d'effacer la référence
  try {
    const fs = require("node:fs"), path = require("node:path");
    const dir = path.join(require("../../config/paths").dataDir, "exports");
    for (const r of db.prepare("SELECT id, result FROM cms_tool_runs WHERE result LIKE '@file:%' AND ((expires_at IS NOT NULL AND expires_at < datetime('now')) OR (finished_at IS NOT NULL AND finished_at < datetime('now', ?)))").all(`-${Number(keepDays)} days`)) {
      const name = path.basename(String(r.result).slice(6));
      if (/^export-\d+-[0-9a-f]{16}\.zip$/.test(name)) { try { fs.unlinkSync(path.join(dir, name)); } catch { /* déjà absent */ } }
      db.prepare("UPDATE cms_tool_runs SET result = NULL WHERE id = ?").run(r.id);
    }
  } catch { /* nettoyage des fichiers : sans effet sur la suite */ }
  const a = db.prepare("UPDATE cms_tool_runs SET result = NULL WHERE result IS NOT NULL AND expires_at IS NOT NULL AND expires_at < datetime('now')").run().changes;
  const b = db.prepare("DELETE FROM cms_tool_runs WHERE finished_at IS NOT NULL AND finished_at < datetime('now', ?)").run(`-${Number(keepDays)} days`).changes;
  return { expiredFiles: a, deletedRuns: b };
}

module.exports = { create, get, raw, update, list, latest, requestCancel, purge, parse };
