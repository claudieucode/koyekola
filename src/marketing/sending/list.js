// Liste des campagnes pour l'interface : onglets par statut, recherche par nom, tri (liste blanche), pages numérotées.
// Les campagnes « système » des scénarios (kind = automation) n'en font jamais partie.
const { checkCtx } = require("../audience/shared");

// Onglets → statuts réels
const STATUS_GROUPS = {
  draft: ["draft"], scheduled: ["scheduled"], running: ["sending", "paused"], sent: ["sent"], stopped: ["cancelled", "failed"],
};
const SORTS = {
  name: { asc: "c.name COLLATE NOCASE ASC, c.id ASC", desc: "c.name COLLATE NOCASE DESC, c.id ASC", defaultDir: "asc" },
  status: { asc: "c.status ASC, c.id DESC", desc: "c.status DESC, c.id DESC", defaultDir: "asc" },
  created: { asc: "c.created_at ASC, c.id ASC", desc: "c.created_at DESC, c.id DESC", defaultDir: "desc" },
  sent: { asc: "c.sent_count ASC, c.id DESC", desc: "c.sent_count DESC, c.id DESC", defaultDir: "desc" },
  clicks: { asc: "c.unique_click_count ASC, c.id DESC", desc: "c.unique_click_count DESC, c.id DESC", defaultDir: "desc" },
  recipients: { asc: "c.total_recipients ASC, c.id DESC", desc: "c.total_recipients DESC, c.id DESC", defaultDir: "desc" },
};
const PAGE_SIZES = [10, 25, 50];
const DEFAULT_PAGE_SIZE = 25;
const escapeLike = (text) => text.replace(/[\\%_]/g, (ch) => `\\${ch}`);
const pct = (n, d) => (d > 0 ? Math.round((n / d) * 10000) / 100 : null);

function searchCampaigns(ctx, { status, q } = {}, { sort, dir, page, pageSize } = {}) {
  checkCtx(ctx);
  const where = ["c.organization_id = ?", "c.kind = 'campaign'"];
  const params = [ctx.organizationId];
  if (typeof status === "string" && Object.hasOwn(STATUS_GROUPS, status)) {
    where.push(`c.status IN (${STATUS_GROUPS[status].map(() => "?").join(", ")})`);
    params.push(...STATUS_GROUPS[status]);
  }
  if (typeof q === "string" && q.trim()) {
    where.push("c.name LIKE ? ESCAPE '\\'");
    params.push(`%${escapeLike(q.trim().slice(0, 100))}%`);
  }
  const key = typeof sort === "string" && Object.hasOwn(SORTS, sort) ? sort : "created";
  const direction = dir === "asc" || dir === "desc" ? dir : SORTS[key].defaultDir;
  const size = PAGE_SIZES.includes(Number(pageSize)) ? Number(pageSize) : DEFAULT_PAGE_SIZE;
  const total = ctx.db.prepare(`SELECT COUNT(*) AS n FROM mk_campaigns c WHERE ${where.join(" AND ")}`).get(...params).n;
  const pages = Math.max(1, Math.ceil(total / size));
  const wanted = Number.isInteger(Number(page)) ? Number(page) : 1;
  const current = Math.min(Math.max(wanted, 1), pages);
  const rows = ctx.db
    .prepare(
      `SELECT c.id, c.name, c.status, c.total_recipients, c.sent_count, c.unique_click_count, c.unique_open_count, c.track_opens, c.created_at, c.updated_at, c.started_at, c.scheduled_at, c.finished_at, c.target_type, c.target_id,
              (SELECT t.name FROM mk_templates t WHERE t.id = c.template_id AND t.organization_id = c.organization_id) AS template_name,
              CASE c.target_type
                WHEN 'list' THEN (SELECT l.name FROM mk_lists l WHERE l.id = c.target_id AND l.organization_id = c.organization_id)
                ELSE (SELECT s.name FROM mk_segments s WHERE s.id = c.target_id AND s.organization_id = c.organization_id) END AS target_name
       FROM mk_campaigns c WHERE ${where.join(" AND ")} ORDER BY ${SORTS[key][direction]} LIMIT ? OFFSET ?`
    )
    .all(...params, size, (current - 1) * size)
    .map((r) => ({ ...r, clickRate: pct(r.unique_click_count, r.sent_count), openRate: r.track_opens ? pct(r.unique_open_count, r.sent_count) : null }));
  return { rows, total, page: current, pages, pageSize: size, sort: key, dir: direction };
}

// Effectif de chaque onglet
function campaignStatusCounts(ctx) {
  checkCtx(ctx);
  const by = Object.fromEntries(ctx.db.prepare("SELECT status, COUNT(*) n FROM mk_campaigns WHERE organization_id = ? AND kind = 'campaign' GROUP BY status").all(ctx.organizationId).map((r) => [r.status, r.n]));
  const counts = { all: Object.values(by).reduce((a, b) => a + b, 0) };
  for (const [tab, statuses] of Object.entries(STATUS_GROUPS)) counts[tab] = statuses.reduce((sum, s) => sum + (by[s] || 0), 0);
  return counts;
}

module.exports = { STATUS_GROUPS, SORTS, PAGE_SIZES, searchCampaigns, campaignStatusCounts };
