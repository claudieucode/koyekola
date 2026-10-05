// Favoris (par personne) et historique d'utilisation (par organisation) de la bibliothèque. Seules écritures de la
// bibliothèque en dehors de la création d'un parcours : jamais sur les modèles, qui sont des données en lecture seule.
const { checkCtx } = require("../../audience/shared");

function favoriteKeys(ctx) {
  checkCtx(ctx);
  if (!ctx.userId) return new Set();
  return new Set(ctx.db.prepare("SELECT journey_key FROM mk_journey_favorites WHERE organization_id = ? AND user_id = ?").all(ctx.organizationId, ctx.userId).map((r) => r.journey_key));
}

// Bascule le favori ; renvoie l'état final (true = favori)
function toggleFavorite(ctx, key) {
  checkCtx(ctx);
  if (!ctx.userId) return false;
  const has = ctx.db.prepare("SELECT 1 FROM mk_journey_favorites WHERE organization_id = ? AND user_id = ? AND journey_key = ?").get(ctx.organizationId, ctx.userId, key);
  if (has) {
    ctx.db.prepare("DELETE FROM mk_journey_favorites WHERE organization_id = ? AND user_id = ? AND journey_key = ?").run(ctx.organizationId, ctx.userId, key);
    return false;
  }
  ctx.db.prepare("INSERT OR IGNORE INTO mk_journey_favorites (organization_id, user_id, journey_key) VALUES (?, ?, ?)").run(ctx.organizationId, ctx.userId, key);
  return true;
}

function recordUsage(ctx, key, automationId) {
  checkCtx(ctx);
  ctx.db.prepare("INSERT INTO mk_journey_usage (organization_id, journey_key, user_id, automation_id) VALUES (?, ?, ?, ?)").run(ctx.organizationId, key, ctx.userId ?? null, automationId ?? null);
}

// { key → nombre d'utilisations } pour l'organisation
function usageCounts(ctx) {
  checkCtx(ctx);
  return new Map(ctx.db.prepare("SELECT journey_key AS key, COUNT(*) AS n FROM mk_journey_usage WHERE organization_id = ? GROUP BY journey_key").all(ctx.organizationId).map((r) => [r.key, r.n]));
}

// Clés des parcours utilisés récemment (du plus récent au plus ancien, sans doublon)
function recentKeys(ctx, limit = 6) {
  checkCtx(ctx);
  return ctx.db.prepare("SELECT journey_key AS key, MAX(id) AS last FROM mk_journey_usage WHERE organization_id = ? GROUP BY journey_key ORDER BY last DESC LIMIT ?").all(ctx.organizationId, limit).map((r) => r.key);
}

module.exports = { favoriteKeys, toggleFavorite, recordUsage, usageCounts, recentKeys };
