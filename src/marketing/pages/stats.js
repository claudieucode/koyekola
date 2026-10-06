// Tableau de bord « Site Web » : chiffres RÉELS, lus dans le journal des pages (mk_landing_events : visites, clics,
// inscriptions) et dans les tables du moteur. Ce qui n'est pas encore mesuré (sources de trafic, nouveaux et
// visiteurs récurrents) est signalé comme tel par `measured` : jamais de valeur inventée.
// Visiteur : empreinte quotidienne non réversible (sans cookie) → « visiteurs uniques » = visiteurs distincts par jour,
// additionnés sur la période.
const { checkCtx } = require("../audience/shared");

const DAY = 86400000;
const PERIODS = [7, 30, 90];

function dayLabel(ms) {
  return new Date(ms).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

function dashboard(ctx, { days = 30, now = Date.now() } = {}) {
  checkCtx(ctx);
  const period = PERIODS.includes(Number(days)) ? Number(days) : 30;
  const org = ctx.organizationId;
  const one = (sql, ...a) => ctx.db.prepare(sql).get(...a);
  const since = now - period * DAY;

  const counts = {
    sites: one("SELECT COUNT(*) n FROM mk_sites WHERE organization_id = ? AND status = 'active'", org).n,
    pages: one("SELECT COUNT(*) n FROM mk_landing_pages WHERE organization_id = ? AND archived_at IS NULL", org).n,
    published: one("SELECT COUNT(*) n FROM mk_landing_pages WHERE organization_id = ? AND archived_at IS NULL AND status = 'published'", org).n,
    drafts: one("SELECT COUNT(*) n FROM mk_landing_pages WHERE organization_id = ? AND archived_at IS NULL AND draft IS NOT NULL", org).n,
  };
  // Visiteurs uniques : (jour, empreinte) distincts — l'empreinte change chaque jour
  const traffic = one(`SELECT COUNT(*) views, COUNT(DISTINCT visitor || ':' || (occurred_at / ${DAY})) visitors
    FROM mk_landing_events WHERE organization_id = ? AND type = 'view' AND occurred_at >= ?`, org, since);
  const leads = one("SELECT COUNT(*) n FROM mk_landing_events WHERE organization_id = ? AND type = 'signup' AND occurred_at >= ?", org, since).n;
  const clicks = one("SELECT COUNT(*) n FROM mk_landing_events WHERE organization_id = ? AND type = 'click' AND occurred_at >= ?", org, since).n;
  const conversion = traffic.visitors ? Math.round((leads / traffic.visitors) * 1000) / 10 : null;

  // Visiteurs par jour (le plus récent à droite)
  const buckets = new Array(period).fill(0);
  const start = now - period * DAY;
  // Jour de la période (entier : le nombre JavaScript lié à la requête serait sinon divisé en décimal)
  for (const r of ctx.db.prepare(`SELECT CAST((occurred_at - ?) / ${DAY} AS INTEGER) b, COUNT(DISTINCT visitor) n FROM mk_landing_events WHERE organization_id = ? AND type = 'view' AND occurred_at >= ? GROUP BY b`).all(start, org, start)) {
    if (r.b >= 0 && r.b < period) buckets[r.b] += r.n;
  }
  const trend = buckets.map((count, i) => ({ label: dayLabel(start + (i + 1) * DAY), count }));

  // Meilleures pages : visiteurs, inscriptions et conversion sur la période (pages ayant au moins une visite)
  const topPages = ctx.db.prepare(`SELECT p.id, p.name, p.slug, p.status, s.name AS site,
      COUNT(DISTINCT CASE WHEN e.type = 'view' THEN e.visitor || ':' || (e.occurred_at / ${DAY}) END) AS visitors,
      SUM(e.type = 'signup') AS leads, SUM(e.type = 'click') AS clicks
    FROM mk_landing_events e JOIN mk_landing_pages p ON p.id = e.page_id LEFT JOIN mk_sites s ON s.id = p.site_id
    WHERE e.organization_id = ? AND e.occurred_at >= ? GROUP BY p.id HAVING visitors > 0 ORDER BY visitors DESC, leads DESC LIMIT 10`).all(org, since)
    .map((p) => ({ ...p, conversion: p.visitors ? Math.round((p.leads / p.visitors) * 1000) / 10 : null }));

  // Activité récente des pages : publications et modifications réelles (journal d'audit)
  const recent = ctx.db.prepare(`SELECT p.id, p.name, p.status, p.updated_at, p.published_at, p.draft IS NOT NULL AS has_draft FROM mk_landing_pages p
    WHERE p.organization_id = ? AND p.archived_at IS NULL ORDER BY p.updated_at DESC, p.id DESC LIMIT 6`).all(org);

  return {
    period: { days: period, options: PERIODS },
    counts, views: traffic.views, visitors: traffic.visitors, leads, clicks, conversion, trend, topPages, recent,
    // Mesures qui demandent le suivi des visiteurs avec consentement (phase 6) : affichées « non mesuré »
    measured: { sources: false, newVsReturning: false },
  };
}

module.exports = { dashboard, PERIODS };
