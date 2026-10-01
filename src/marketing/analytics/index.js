// Analytics — vue d'ensemble des envois marketing sur une période (jalon R7). Lecture seule, une organisation à la fois.
// Source de vérité : mk_message_events (journal ajouté seulement, jamais modifié) : les totaux ne dépendent pas de
// campagnes encore en cours d'envoi. Même éthique que sending/stats.js : jamais de faux « 0 % » (voir mkh.rate côté vue).
const { checkCtx } = require("../audience/shared");

const DAY = 86_400_000;
const PERIODS = [7, 30, 90];
const DEFAULT_PERIOD = 30;
const TOP_LINKS = 10;
const MAX_CAMPAIGNS = 50;
// Mêmes seuils que sending/stats.js et overview/index.js : une seule définition du « trop », répétée par cohérence.
const BOUNCE_ALERT = 2; // %
const COMPLAINT_ALERT = 0.1; // %
const MIN_FOR_ALERTS = 20;
// Granularité du graphique : quotidienne jusqu'à 30 jours, hebdomadaire au-delà (sinon 90 barres illisibles).
const TREND = { 7: { bucketMs: DAY, count: 7 }, 30: { bucketMs: DAY, count: 30 }, 90: { bucketMs: 7 * DAY, count: 13 } };

const nowOf = (ctx) => (typeof ctx.now === "function" ? ctx.now() : Date.now());
const pct = (n, d) => (d > 0 ? Math.round((n / d) * 10000) / 100 : null);
const periodOf = (days) => (PERIODS.includes(Number(days)) ? Number(days) : DEFAULT_PERIOD);
const dayLabel = (ms) => { const d = new Date(ms); return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`; };

// Totaux d'événements sur la période : count(*) et destinataires distincts par type (bot exclu pour ouvertures/clics,
// comme le fait sending/tracking.js pour les compteurs de campagne).
function totals(ctx, since) {
  const rows = ctx.db
    .prepare("SELECT type, bot, COUNT(*) n, COUNT(DISTINCT message_id) uniq FROM mk_message_events WHERE organization_id = ? AND occurred_at >= ? GROUP BY type, bot")
    .all(ctx.organizationId, since);
  const by = (type, bot) => rows.filter((r) => r.type === type && (bot === undefined || r.bot === bot)).reduce((a, r) => ({ n: a.n + r.n, uniq: a.uniq + r.uniq }), { n: 0, uniq: 0 });
  const sent = by("sent").n;
  const opens = by("opened", 0);
  const clicks = by("clicked", 0);
  const counts = { sent, delivered: by("delivered").n, bounced: by("bounced").n, complained: by("complained").n, unsubscribed: by("unsubscribed").n, opens: opens.n, uniqueOpens: opens.uniq, clicks: clicks.n, uniqueClicks: clicks.uniq };
  const rates = {
    delivery: pct(counts.delivered, sent), bounce: pct(counts.bounced, sent), complaint: pct(counts.complained, sent),
    unsubscribe: pct(counts.unsubscribed, sent), open: pct(opens.uniq, sent), click: pct(clicks.uniq, sent),
  };
  return { counts, rates };
}

// Envois par jour (ou semaine), buckets glissants, le plus récent à droite — même principe que la croissance de l'Accueil.
function trend(ctx, now, days) {
  const { bucketMs, count } = TREND[days];
  const startMs = now - count * bucketMs;
  const buckets = new Array(count).fill(0);
  for (const r of ctx.db.prepare("SELECT occurred_at FROM mk_message_events WHERE organization_id = ? AND type = 'sent' AND occurred_at >= ?").all(ctx.organizationId, startMs)) {
    const b = Math.floor((r.occurred_at - startMs) / bucketMs);
    if (b >= 0 && b < count) buckets[b] += 1;
  }
  return buckets.map((c, i) => ({ label: dayLabel(startMs + (i + 1) * bucketMs), count: c }));
}

// Campagnes terminées dans la période (contenu et destinataires déjà figés au lancement : rien ne bouge après coup).
function campaignsInPeriod(ctx, since, now) {
  const rows = ctx.db
    .prepare(
      `SELECT id, name, status, finished_at, sent_count, unique_open_count, unique_click_count, bounced_count, complained_count, unsubscribed_count
       FROM mk_campaigns WHERE organization_id = ? AND kind = 'campaign' AND finished_at IS NOT NULL AND finished_at >= ? AND finished_at <= ?
       ORDER BY finished_at DESC LIMIT ?`
    )
    .all(ctx.organizationId, since, now, MAX_CAMPAIGNS + 1);
  return {
    truncated: rows.length > MAX_CAMPAIGNS,
    items: rows.slice(0, MAX_CAMPAIGNS).map((c) => ({
      id: c.id, name: c.name, status: c.status, finishedAt: c.finished_at, sent: c.sent_count,
      openRate: pct(c.unique_open_count, c.sent_count), clickRate: pct(c.unique_click_count, c.sent_count),
      bounceRate: pct(c.bounced_count, c.sent_count), complaintRate: pct(c.complained_count, c.sent_count), unsubscribeRate: pct(c.unsubscribed_count, c.sent_count),
    })),
  };
}

// Liens les plus cliqués, toutes campagnes terminées de la période confondues.
function topLinks(ctx, since, now) {
  return ctx.db
    .prepare(
      `SELECT l.url AS url, SUM(l.click_count) AS clicks, SUM(l.unique_click_count) AS uniqueClicks
       FROM mk_links l JOIN mk_campaigns c ON c.id = l.campaign_id
       WHERE l.organization_id = ? AND c.finished_at IS NOT NULL AND c.finished_at >= ? AND c.finished_at <= ?
       GROUP BY l.url HAVING SUM(l.click_count) > 0 ORDER BY uniqueClicks DESC, clicks DESC LIMIT ?`
    )
    .all(ctx.organizationId, since, now, TOP_LINKS);
}

function getAnalyticsOverview(ctx, { days } = {}) {
  checkCtx(ctx);
  const period = periodOf(days);
  const now = nowOf(ctx);
  const since = now - period * DAY;
  const t = totals(ctx, since);
  return {
    period: { days: period, options: PERIODS },
    counts: t.counts,
    rates: t.rates,
    flags: {
      highBounce: t.counts.sent >= MIN_FOR_ALERTS && t.rates.bounce > BOUNCE_ALERT,
      highComplaint: t.counts.sent >= MIN_FOR_ALERTS && t.rates.complaint > COMPLAINT_ALERT,
    },
    trend: trend(ctx, now, period),
    campaigns: campaignsInPeriod(ctx, since, now),
    links: topLinks(ctx, since, now),
    notes: [
      "Les ouvertures sont INDICATIVES : la protection de la vie privée d'Apple Mail et certains clients pré-chargent les images (chiffre gonflé), d'autres bloquent les images (chiffre réduit). Le taux de clic est plus fiable.",
      "Ouvertures et clics « uniques » : une fois par message. Les robots (antivirus, aperçus de liens) sont enregistrés mais exclus de ces chiffres.",
    ],
  };
}

module.exports = { getAnalyticsOverview, PERIODS, DEFAULT_PERIOD };
