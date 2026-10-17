// Audience d'une campagne : contacts de la cible (liste ou segment) ET joignables (règle unique : compliance/sendable.js).
// Ce calcul sert à l'aperçu ET à la matérialisation des destinataires ; chaque message est ENSUITE revérifié par isSendable().
const { MarketingError } = require("../errors");
const { checkCtx } = require("../audience/shared");
const { getList } = require("../audience/lists");
const segments = require("../segments");
const { sendableSql } = require("../compliance/sendable");

function targetClause(ctx, { targetType, targetId }) {
  if (targetType === "list") {
    if (!getList(ctx, targetId)) throw new MarketingError("not_found", "Liste introuvable.");
    return {
      from: "FROM mk_contacts c JOIN mk_list_members m ON m.contact_id = c.id AND m.list_id = ? AND m.organization_id = c.organization_id WHERE c.organization_id = ?",
      params: [targetId, ctx.organizationId], listId: targetId,
    };
  }
  if (targetType === "segment") {
    const segment = segments.getSegment(ctx, targetId);
    if (!segment) throw new MarketingError("not_found", "Segment introuvable.");
    const { sql, params } = segments.selectSql(ctx, segment.definition, { siteId: segment.site_id ?? undefined }); // un segment de site ne vise que les contacts de ce site
    return { from: `FROM mk_contacts c WHERE ${sql}`, params, listId: undefined };
  }
  throw new MarketingError("invalid_field", "La cible d'une campagne est une liste ou un segment.");
}

// « FROM … WHERE … » + params des contacts joignables de la cible
function sendableClause(ctx, target, category) {
  const t = targetClause(ctx, target);
  const s = sendableSql("c", { listId: t.listId, category });
  return { from: `${t.from} AND ${s.sql}`, params: [...t.params, ...s.params], listId: t.listId };
}

function sendableContactIds(ctx, target) {
  checkCtx(ctx);
  const { from, params } = sendableClause(ctx, target, target.category);
  return ctx.db.prepare(`SELECT c.id ${from} ORDER BY c.id`).all(...params).map((r) => r.id);
}

function audienceSummary(ctx, target) {
  checkCtx(ctx);
  const t = targetClause(ctx, target);
  const s = sendableSql("c", { listId: t.listId, category: target.category });
  const targetTotal = ctx.db.prepare(`SELECT COUNT(*) n ${t.from}`).get(...t.params).n;
  const sendable = ctx.db.prepare(`SELECT COUNT(*) n ${t.from} AND ${s.sql}`).get(...t.params, ...s.params).n;
  const listUnsub = t.listId === undefined ? "0" : "EXISTS (SELECT 1 FROM mk_unsubscribes u WHERE u.contact_id = c.id AND u.organization_id = c.organization_id AND u.scope = 'list' AND u.list_id = ?)";
  const rows = ctx.db
    .prepare(
      `SELECT CASE
         WHEN c.status IN ('bounced', 'complained', 'suppressed') OR EXISTS (SELECT 1 FROM mk_suppressions x WHERE x.organization_id = c.organization_id AND x.email = c.email) THEN 'blocked'
         WHEN c.status = 'unsubscribed' THEN 'unsubscribed'
         WHEN c.status = 'unknown' THEN 'not_subscribed'
         WHEN ${listUnsub} THEN 'list_unsubscribed'
         WHEN c.status = 'subscribed' AND (SELECT k.action FROM mk_consents k WHERE k.contact_id = c.id AND k.organization_id = c.organization_id AND k.purpose = 'marketing' ORDER BY k.id DESC LIMIT 1) IS NOT 'granted' THEN 'no_consent'
         ELSE 'category_opted_out' END AS reason, COUNT(*) AS n
       ${t.from} AND NOT (${s.sql}) GROUP BY reason`
    )
    .all(...(t.listId === undefined ? [] : [t.listId]), ...t.params, ...s.params);
  const excluded = { total: 0, not_subscribed: 0, unsubscribed: 0, blocked: 0, list_unsubscribed: 0, category_opted_out: 0, no_consent: 0 };
  for (const r of rows) { excluded[r.reason] = r.n; excluded.total += r.n; }
  return { targetTotal, sendable, excluded };
}

module.exports = { targetClause, sendableClause, sendableContactIds, audienceSummary };
