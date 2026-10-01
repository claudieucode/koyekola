// Journal des événements d'un message (envoyé, ouvert, cliqué, rebond…). Ajouté seulement ; dedupe_key rend un même
// événement (webhook rejoué) sans effet : recordEvent renvoie false s'il existait déjà, et l'appelant n'incrémente alors rien.
const TYPES = new Set(["sent", "delivered", "opened", "clicked", "bounced", "complained", "unsubscribed", "failed"]);

function recordEvent(ctx, { messageId, campaignId, type, linkId = null, detail = null, dedupeKey = null, bot = false, at = Date.now() }) {
  if (!TYPES.has(type)) throw new Error(`Type d'événement inconnu : ${String(type).slice(0, 30)}`);
  const json = detail ? JSON.stringify(detail).slice(0, 500) : "";
  return (
    ctx.db
      .prepare("INSERT OR IGNORE INTO mk_message_events (organization_id, message_id, campaign_id, type, link_id, detail, dedupe_key, bot, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, messageId, campaignId, type, linkId, json, dedupeKey, bot ? 1 : 0, at).changes > 0
  );
}

// Colonnes de compteur de campagne : liste fermée (jamais de nom de colonne venant de l'extérieur)
const COUNTERS = new Set(["sent_count", "delivered_count", "bounced_count", "complained_count", "failed_count", "skipped_count", "unsubscribed_count", "open_count", "unique_open_count", "click_count", "unique_click_count"]);
function bump(ctx, campaignId, column, n = 1) {
  if (!COUNTERS.has(column)) throw new Error("Compteur inconnu.");
  ctx.db.prepare(`UPDATE mk_campaigns SET ${column} = ${column} + ? WHERE id = ? AND organization_id = ?`).run(n, campaignId, ctx.organizationId);
}

module.exports = { recordEvent, bump };
