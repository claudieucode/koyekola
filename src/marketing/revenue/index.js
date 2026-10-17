// Revenus des e-mails (comme Mailchimp) : chaque commande du site est attribuée au DERNIER e-mail marketing cliqué par
// l'acheteur (contact) dans la fenêtre d'attribution (7 jours par défaut, réglable de 1 à 30) avant l'achat.
//  - seuls les clics de vraies personnes comptent (les robots — antivirus, aperçus de liens — sont exclus) ;
//  - une commande n'est attribuée qu'une fois (rejouer l'événement ne change rien) ;
//  - les ouvertures ne comptent pas : trop peu fiables (Apple Mail les simule) pour y rattacher de l'argent.
// Déclenché par l'événement « lms.order_completed » émis par le pont LMS (bridge/events.js), donc en arrière-plan.
const { checkCtx, audit } = require("../audience/shared");
const { MarketingError } = require("../errors");
const siteModules = require("../siteModules");
const siteAccess = require("../contactcore/siteAccess");
const { validSite } = require("../audit");

// R7 lot 6.5 — par site : le revenu ATTRIBUÉ à l'e-mail d'un site (campagne ou automatisation du site, relation de confiance côté serveur) est rattaché à ce site ; les commandes, les ventes totales, la fenêtre
// d'attribution et la vue globale restent à l'équipe. Un accès limité à un site ne voit que les attributions de SON site (module « commerce » requis), sans les ventes totales du site principal.
const limited = (ctx) => ctx.siteScope !== undefined && ctx.siteScope !== null;

const DAY = 86_400_000;
const WINDOW_KEY = "revenue.window_days";
const DEFAULT_WINDOW = 7;
const MIN_WINDOW = 1;
const MAX_WINDOW = 30;
const PERIODS = [30, 90, 365];
const DEFAULT_PERIOD = 30;

const nowOf = (ctx) => (typeof ctx.now === "function" ? ctx.now() : Date.now());

function getWindowDays(ctx) {
  const raw = ctx.settings ? ctx.settings.get(ctx.organizationId, WINDOW_KEY, String(DEFAULT_WINDOW)) : String(DEFAULT_WINDOW);
  const n = Number(raw);
  return Number.isInteger(n) && n >= MIN_WINDOW && n <= MAX_WINDOW ? n : DEFAULT_WINDOW;
}

function setWindowDays(ctx, value) {
  checkCtx(ctx);
  if (limited(ctx)) throw new MarketingError("forbidden", "La fenêtre d'attribution est réservée à l'équipe de l'organisation.");
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (!Number.isInteger(n) || n < MIN_WINDOW || n > MAX_WINDOW) throw new MarketingError("invalid_field", `Fenêtre d'attribution : un nombre de jours entre ${MIN_WINDOW} et ${MAX_WINDOW} est attendu.`);
  ctx.settings.set(ctx.organizationId, WINDOW_KEY, String(n));
  audit(ctx, "revenue.window_changed", "organization", ctx.organizationId, { days: n });
  return n;
}

// Dernier clic (humain) du contact sur un e-mail marketing, dans la fenêtre qui précède la commande
function lastClick(ctx, contactId, orderedAt, windowDays) {
  return ctx.db
    .prepare(
      `SELECT e.message_id, e.occurred_at, m.campaign_id, m.variant, c.automation_id,
              COALESCE(c.site_id, (SELECT au.site_id FROM mk_automations au WHERE au.id = c.automation_id AND au.organization_id = e.organization_id)) AS site_id
       FROM mk_message_events e
       JOIN mk_messages m ON m.id = e.message_id AND m.organization_id = e.organization_id
       LEFT JOIN mk_campaigns c ON c.id = m.campaign_id
       WHERE e.organization_id = ? AND m.contact_id = ? AND e.type = 'clicked' AND e.bot = 0
         AND e.occurred_at <= ? AND e.occurred_at >= ?
       ORDER BY e.occurred_at DESC, e.id DESC LIMIT 1`
    )
    .get(ctx.organizationId, contactId, orderedAt, orderedAt - windowDays * DAY);
}

// → la ligne d'attribution créée, ou null (aucun clic dans la fenêtre, montant nul, commande déjà attribuée)
function attributeOrder(ctx, { orderId, contactId, amountCents, orderedAt }) {
  checkCtx(ctx);
  if (!Number.isInteger(orderId) || !Number.isInteger(contactId)) return null;
  const amount = Number.isInteger(amountCents) ? amountCents : 0;
  if (amount <= 0) return null; // formation gratuite : rien à attribuer
  const at = Number.isFinite(orderedAt) ? orderedAt : nowOf(ctx);
  const click = lastClick(ctx, contactId, at, getWindowDays(ctx));
  if (!click) return null;
  const info = ctx.db
    .prepare(
      `INSERT OR IGNORE INTO mk_order_attributions (organization_id, order_id, contact_id, message_id, campaign_id, automation_id, variant, amount_cents, ordered_at, clicked_at, created_at, site_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(ctx.organizationId, orderId, contactId, click.message_id, click.campaign_id, click.automation_id ?? null, click.variant ?? null, amount, at, click.occurred_at, nowOf(ctx), validSite(ctx.db, ctx.organizationId, click.site_id)); // site relu en base depuis la campagne / l'automatisation cliquée
  if (!info.changes) return null;
  return ctx.db.prepare("SELECT * FROM mk_order_attributions WHERE id = ?").get(Number(info.lastInsertRowid));
}

// Gestionnaire du bus d'événements (idempotent : la contrainte UNIQUE empêche toute double attribution)
function eventHandler({ db, settings }) {
  return async (event) => {
    if (!event || event.name !== "lms.order_completed" || !event.contactId) return;
    const m = event.metadata || {};
    attributeOrder({ db, organizationId: event.organizationId, userId: null, settings }, {
      orderId: Number(m.orderId), contactId: event.contactId, amountCents: Number(m.totalCents), orderedAt: event.occurredAt,
    });
  };
}

// Revenus d'une campagne (et par version d'un test A/B)
function campaignRevenue(ctx, campaignId) {
  const r = ctx.db.prepare("SELECT COUNT(*) orders, COALESCE(SUM(amount_cents), 0) cents FROM mk_order_attributions WHERE organization_id = ? AND campaign_id = ?").get(ctx.organizationId, campaignId);
  return { orders: r.orders, cents: r.cents };
}

function automationRevenue(ctx, automationId) {
  const r = ctx.db.prepare("SELECT COUNT(*) orders, COALESCE(SUM(amount_cents), 0) cents FROM mk_order_attributions WHERE organization_id = ? AND automation_id = ?").get(ctx.organizationId, automationId);
  return { orders: r.orders, cents: r.cents };
}

function variantRevenue(ctx, campaignId) {
  const rows = ctx.db.prepare("SELECT variant, COUNT(*) orders, SUM(amount_cents) cents FROM mk_order_attributions WHERE organization_id = ? AND campaign_id = ? AND variant IS NOT NULL GROUP BY variant").all(ctx.organizationId, campaignId);
  return new Map(rows.map((r) => [r.variant, { orders: r.orders, cents: r.cents }]));
}

// Ventes totales du site sur la période (table orders du LMS, en lecture seule) : sert à calculer la part due aux e-mails
function siteSales(ctx, since) {
  try {
    const r = ctx.db.prepare("SELECT COUNT(*) orders, COALESCE(SUM(total_cents), 0) cents FROM orders WHERE total_cents > 0 AND created_at >= datetime(? / 1000, 'unixepoch')").get(since);
    return { orders: r.orders, cents: r.cents };
  } catch {
    return null; // site sans table de commandes (tests du module seul)
  }
}

// Vue « Revenus » : totaux de la période, par campagne, par automatisation, dernières commandes attribuées
function revenueOverview(ctx, { days } = {}) {
  checkCtx(ctx);
  if (limited(ctx)) siteModules.assertEnabled(ctx, "commerce");
  // Accès limité : seulement les attributions de SON site ; ventes totales et part masquées ; acheteurs : seulement ceux que SON site peut lire
  const lim = limited(ctx);
  const SITE = lim ? (Number.isInteger(ctx.siteScope) ? " AND a.site_id = " + ctx.siteScope : " AND 1 = 0") : "";
  const rd = lim ? siteAccess.readSql(ctx, "k") : null;
  const period = PERIODS.includes(Number(days)) ? Number(days) : DEFAULT_PERIOD;
  const now = nowOf(ctx);
  const since = now - period * DAY;
  const org = ctx.organizationId;
  const total = ctx.db.prepare(`SELECT COUNT(*) orders, COALESCE(SUM(amount_cents), 0) cents, COUNT(DISTINCT contact_id) buyers FROM mk_order_attributions a WHERE a.organization_id = ? AND a.ordered_at >= ?${SITE}`).get(org, since);
  const sales = lim ? null : siteSales(ctx, since);
  const byCampaign = ctx.db
    .prepare(
      `SELECT c.id, c.name, c.sent_count, COUNT(a.id) orders, SUM(a.amount_cents) cents
       FROM mk_order_attributions a JOIN mk_campaigns c ON c.id = a.campaign_id AND c.organization_id = a.organization_id
       WHERE a.organization_id = ? AND a.ordered_at >= ? AND a.automation_id IS NULL AND c.kind = 'campaign'${SITE}
       GROUP BY c.id ORDER BY cents DESC, c.id DESC LIMIT 50`
    )
    .all(org, since)
    .map((r) => ({ ...r, perRecipient: r.sent_count > 0 ? Math.round(r.cents / r.sent_count) : null }));
  const byAutomation = ctx.db
    .prepare(
      `SELECT a.automation_id id, COALESCE(au.name, '(automatisation supprimée)') name, COUNT(a.id) orders, SUM(a.amount_cents) cents
       FROM mk_order_attributions a LEFT JOIN mk_automations au ON au.id = a.automation_id AND au.organization_id = a.organization_id
       WHERE a.organization_id = ? AND a.ordered_at >= ? AND a.automation_id IS NOT NULL${SITE}
       GROUP BY a.automation_id ORDER BY cents DESC LIMIT 50`
    )
    .all(org, since);
  const recent = ctx.db
    .prepare(
      `SELECT a.order_id, a.amount_cents, a.ordered_at, a.clicked_at, a.campaign_id, a.automation_id, ct.email,
              c.name campaign_name, c.kind, au.name automation_name${lim ? ", EXISTS (SELECT 1 FROM mk_contacts k WHERE k.id = a.contact_id AND k.organization_id = a.organization_id AND " + rd.sql + ") AS readable" : ""}
       FROM mk_order_attributions a
       LEFT JOIN mk_contacts ct ON ct.id = a.contact_id AND ct.organization_id = a.organization_id
       LEFT JOIN mk_campaigns c ON c.id = a.campaign_id AND c.organization_id = a.organization_id
       LEFT JOIN mk_automations au ON au.id = a.automation_id AND au.organization_id = a.organization_id
       WHERE a.organization_id = ? AND a.ordered_at >= ?${SITE} ORDER BY a.ordered_at DESC, a.id DESC LIMIT 20`
    )
    .all(...(lim ? rd.params : []), org, since)
    .map((r) => (lim && !r.readable ? { ...r, email: null, hidden: true } : r)); // acheteur hors du périmètre de contacts du site : identité masquée, montant conservé
  return {
    period, periods: PERIODS, windowDays: getWindowDays(ctx),
    totals: { cents: total.cents, orders: total.orders, buyers: total.buyers, average: total.orders ? Math.round(total.cents / total.orders) : null },
    sales, share: sales && sales.cents > 0 ? Math.round((total.cents / sales.cents) * 1000) / 10 : null,
    byCampaign, byAutomation, recent,
  };
}

module.exports = {
  WINDOW_KEY, DEFAULT_WINDOW, MIN_WINDOW, MAX_WINDOW, PERIODS,
  getWindowDays, setWindowDays, attributeOrder, eventHandler, campaignRevenue, automationRevenue, variantRevenue, revenueOverview,
};
