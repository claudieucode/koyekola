// Historique des passages (palier 17) : tous les scénarios à la fois, ou ceux d'UN contact. Lecture seule, paginée, bornée ; respecte l'isolation par site
// (un accès limité à un site ne voit que les scénarios de ce site). Aucune statistique inventée : tout vient de mk_automation_runs / mk_automation_log.
const { checkCtx, siteSql, MarketingError } = require("../audience/shared");
const { STEP_LABELS } = require("../../utils/stepLabels");

const STATUSES = ["running", "completed", "exited", "failed"];
const STATUS_LABELS = Object.freeze({ running: "En cours", completed: "Terminé", exited: "Sorti", failed: "En échec" });
const PAGE_SIZE = 50;
const escapeLike = (t) => t.replace(/[\\%_]/g, (c) => `\\${c}`);
const ymd = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

// État lisible d'un passage : étape en cours / prochaine, date de réveil (attente)
function describeRun(r, now = Date.now()) {
  let steps = [];
  try { steps = JSON.parse(r.steps); } catch { /* étapes illisibles : libellé vide */ }
  const step = steps[r.step_index];
  const waiting = r.status === "running" && r.wake_at > now;
  return {
    id: r.id, automationId: r.automation_id, automation: r.automation_name, version: r.version, contactId: r.contact_id, status: r.status, statusLabel: STATUS_LABELS[r.status],
    enteredAt: r.entered_at, finishedAt: r.finished_at, error: r.last_error || "", attempts: r.attempts,
    state: r.status === "running" ? (waiting ? "waiting" : "due") : r.status,
    nextStep: r.status === "running" && step ? STEP_LABELS[step.type] || step.type : null, nextAt: r.status === "running" ? r.wake_at : null,
  };
}

// Filtres : automationId, status, q (e-mail ou nom du contact), from / to (AAAA-MM-JJ), onlyErrors
function runHistory(ctx, { automationId, status, q, from, to, onlyErrors = false, page = 1, now = Date.now() } = {}) {
  checkCtx(ctx);
  if (status !== undefined && status !== "" && !STATUSES.includes(status)) throw new MarketingError("invalid_field", "État de passage inconnu.");
  const site = siteSql(ctx, "a");
  const where = ["r.organization_id = ?", site.sql];
  const params = [ctx.organizationId, ...site.params];
  if (Number.isInteger(automationId)) { where.push("r.automation_id = ?"); params.push(automationId); }
  if (status) { where.push("r.status = ?"); params.push(status); }
  if (onlyErrors) where.push("r.last_error <> ''");
  const f = ymd(from), t = ymd(to);
  if (f) { where.push("r.entered_at >= ?"); params.push(Date.parse(`${f}T00:00:00Z`)); }
  if (t) { where.push("r.entered_at <= ?"); params.push(Date.parse(`${t}T23:59:59Z`)); }
  if (typeof q === "string" && q.trim()) {
    const like = `%${escapeLike(q.trim().slice(0, 100))}%`;
    where.push("(c.email LIKE ? ESCAPE '\\' OR c.first_name LIKE ? ESCAPE '\\' OR c.last_name LIKE ? ESCAPE '\\')");
    params.push(like, like, like);
  }
  const from_ = "FROM mk_automation_runs r JOIN mk_automations a ON a.id = r.automation_id JOIN mk_contacts c ON c.id = r.contact_id";
  const total = ctx.db.prepare(`SELECT COUNT(*) n ${from_} WHERE ${where.join(" AND ")}`).get(...params).n;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(Number.isInteger(Number(page)) ? Number(page) : 1, 1), pages);
  const rows = ctx.db.prepare(`SELECT r.*, a.name AS automation_name, c.email, c.first_name, c.last_name ${from_} WHERE ${where.join(" AND ")} ORDER BY r.id DESC LIMIT ? OFFSET ?`).all(...params, PAGE_SIZE, (current - 1) * PAGE_SIZE);
  return { rows: rows.map((r) => ({ ...describeRun(r, now), contact: { id: r.contact_id, email: r.email, first_name: r.first_name, last_name: r.last_name } })), total, page: current, pages, pageSize: PAGE_SIZE };
}

// Les scénarios d'un contact (fiche contact) : état, prochaine étape, prochaine exécution
function contactRuns(ctx, contactId, { now = Date.now(), limit = 20 } = {}) {
  checkCtx(ctx);
  const site = siteSql(ctx, "a");
  return ctx.db
    .prepare(`SELECT r.*, a.name AS automation_name FROM mk_automation_runs r JOIN mk_automations a ON a.id = r.automation_id WHERE r.organization_id = ? AND r.contact_id = ? AND ${site.sql} ORDER BY r.id DESC LIMIT ?`)
    .all(ctx.organizationId, contactId, ...site.params, Math.min(Math.max(Number(limit) || 20, 1), 100))
    .map((r) => describeRun(r, now));
}

// Versions publiées d'un scénario (lecture seule)
function listVersions(ctx, automationId) {
  checkCtx(ctx);
  const site = siteSql(ctx, "a");
  return ctx.db
    .prepare(`SELECT v.version, v.published_by, v.published_at, v.steps FROM mk_automation_versions v JOIN mk_automations a ON a.id = v.automation_id WHERE v.organization_id = ? AND v.automation_id = ? AND ${site.sql} ORDER BY v.version DESC`)
    .all(ctx.organizationId, automationId, ...site.params)
    .map((v) => ({ version: v.version, publishedBy: v.published_by, publishedAt: v.published_at, stepCount: JSON.parse(v.steps).length,
      runs: ctx.db.prepare("SELECT COUNT(*) n FROM mk_automation_runs WHERE automation_id = ? AND version = ?").get(automationId, v.version).n }));
}

module.exports = { STATUSES, STATUS_LABELS, runHistory, contactRuns, listVersions, describeRun };
