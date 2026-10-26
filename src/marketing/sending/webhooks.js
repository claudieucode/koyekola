// Effets des retours du fournisseur (livré, rebond, plainte). Idempotent : un webhook rejoué (même dedupeKey) n'a aucun effet.
//  - rebond PERMANENT ou plainte → liste de suppression (le contact ne sera plus jamais joint) ;
//  - rebond temporaire → enregistré seulement ;
//  - un « livré » arrivé en retard n'écrase jamais un rebond ou une plainte.
const { transaction } = require("../db/tx");
const { addSuppression } = require("../compliance/suppression");
const { recordEvent, bump } = require("./events");
const { emitMessageEvent } = require("./tracking");
const reputation = require("./reputation");

function applyEvent(ctx, event) {
  if (!event || event.kind === "ignored") return "ignored";
  const message = ctx.db.prepare("SELECT * FROM mk_messages WHERE organization_id = ? AND provider_message_id = ? AND provider_message_id <> ''").get(ctx.organizationId, event.providerMessageId);
  if (!message) return "unknown_message";
  const at = event.at ?? Date.now();

  return transaction(ctx.db, () => {
    const type = event.kind === "delivered" ? "delivered" : event.kind === "bounced" ? "bounced" : "complained";
    if (!recordEvent(ctx, { messageId: message.id, campaignId: message.campaign_id, type, detail: event.kind === "bounced" ? { hard: Boolean(event.hard) } : null, dedupeKey: event.dedupeKey ?? null, at })) return "duplicate";

    if (event.kind === "delivered") {
      if (message.status === "sent" || message.status === "pending") {
        ctx.db.prepare("UPDATE mk_messages SET status = 'delivered', delivered_at = ? WHERE id = ?").run(at, message.id);
        bump(ctx, message.campaign_id, "delivered_count");
      }
    } else if (event.kind === "bounced" && event.hard) {
      if (message.status !== "bounced" && message.status !== "complained") {
        ctx.db.prepare("UPDATE mk_messages SET status = 'bounced', bounced_at = ? WHERE id = ?").run(at, message.id);
        bump(ctx, message.campaign_id, "bounced_count");
      }
      addSuppression({ ...ctx, audit: false }, { email: message.email, reason: "bounced", note: "Rebond permanent signalé par le fournisseur" });
    } else if (event.kind === "complained") {
      if (message.status !== "complained") {
        ctx.db.prepare("UPDATE mk_messages SET status = 'complained', complained_at = ? WHERE id = ?").run(at, message.id);
        bump(ctx, message.campaign_id, "complained_count");
      }
      addSuppression({ ...ctx, audit: false }, { email: message.email, reason: "complained", note: "Plainte signalée par le fournisseur" });
    }
    // Contact Core (palier 16) : livraison, rebond et plainte entrent dans le journal du contact (idempotent : un webhook rejoué n'ajoute rien)
    emitMessageEvent(ctx, message, `email.${type}`, `email.${type}:${message.id}`, { campaignId: message.campaign_id, ...(event.kind === "bounced" ? { hard: Boolean(event.hard) } : {}) });
    if (event.kind === "complained" || (event.kind === "bounced" && event.hard)) reputation.guardCampaign(ctx, message.campaign_id); // plaintes tardives : coupe aussi entre deux lots
    return "applied";
  });
}

module.exports = { applyEvent };
