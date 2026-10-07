// Suivi des clics, ouvertures et désinscriptions attribuées à un message. Règles :
//  - la destination d'un clic est lue dans mk_links (jamais dans le lien reçu) : pas de redirection ouverte ;
//  - les robots (antivirus, aperçus de liens, absence de navigateur) sont ENREGISTRÉS mais n'entrent pas dans les statistiques ;
//  - un message effacé (contact supprimé) n'empêche pas le lien de rediriger.
const { recordEvent, bump } = require("./events");

const BOT = /bot|crawl|spider|preview|scan|curl|wget|python|java\/|headless|monitor|check|fetch|http-?client|go-http|okhttp|libwww|postman/i;
const isBot = (userAgent) => typeof userAgent !== "string" || userAgent.trim() === "" || BOT.test(userAgent);

// Événement sur le bus pour le contact du message (si le module tourne avec son bus ; jamais bloquant)
function emitMessageEvent(ctx, message, name, key, metadata) {
  if (!ctx.bus || !message.contact_id) return;
  try {
    const contact = ctx.db.prepare("SELECT id, email FROM mk_contacts WHERE id = ? AND organization_id = ?").get(message.contact_id, ctx.organizationId);
    if (contact) ctx.bus.emit({ organizationId: ctx.organizationId, name, email: contact.email, contactId: contact.id, source: "marketing", metadata, idempotencyKey: key });
  } catch (error) {
    console.error("[KOLAKISA] Suivi des e-mails (événement) :", error.message);
  }
}

const messageOf = (ctx, id) => (Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_messages WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null);

// → adresse de destination (https) ou null si le lien est inconnu
function recordClick(ctx, { messageId, linkId, userAgent, at = Date.now() }) {
  const link = Number.isInteger(linkId) ? ctx.db.prepare("SELECT id, campaign_id, url FROM mk_links WHERE id = ? AND organization_id = ?").get(linkId, ctx.organizationId) : null;
  if (!link || !/^https:\/\//.test(link.url)) return null;
  const message = messageOf(ctx, messageId);
  if (!message || message.campaign_id !== link.campaign_id) return link.url; // rediriger sans rien attribuer
  const bot = isBot(userAgent);
  const firstForLink = !ctx.db.prepare("SELECT 1 FROM mk_message_events WHERE message_id = ? AND link_id = ? AND type = 'clicked' AND bot = 0").get(message.id, link.id);
  recordEvent(ctx, { messageId: message.id, campaignId: message.campaign_id, type: "clicked", linkId: link.id, bot, at });
  if (bot) return link.url;
  const firstForMessage = message.first_click_at === null;
  ctx.db.prepare("UPDATE mk_messages SET click_count = click_count + 1, first_click_at = COALESCE(first_click_at, ?) WHERE id = ?").run(at, message.id);
  ctx.db.prepare("UPDATE mk_links SET click_count = click_count + 1, unique_click_count = unique_click_count + ? WHERE id = ?").run(firstForLink ? 1 : 0, link.id);
  bump(ctx, message.campaign_id, "click_count");
  if (firstForMessage) bump(ctx, message.campaign_id, "unique_click_count");
  ctx.db.prepare("UPDATE mk_contacts SET last_click_at = datetime('now'), last_activity_at = datetime('now') WHERE id = ? AND organization_id = ?").run(message.contact_id, ctx.organizationId);
  // Premier clic sur ce lien de ce message : événement (déclencheurs, score des contacts, webhooks)
  if (firstForLink) emitMessageEvent(ctx, message, "email.clicked", `email.clicked:${message.id}:${link.id}`, { campaignId: message.campaign_id, url: link.url });
  return link.url;
}

function recordOpen(ctx, { messageId, userAgent, at = Date.now() }) {
  const message = messageOf(ctx, messageId);
  if (!message) return false;
  const bot = isBot(userAgent);
  recordEvent(ctx, { messageId: message.id, campaignId: message.campaign_id, type: "opened", bot, at });
  if (bot) return false;
  ctx.db.prepare("UPDATE mk_messages SET open_count = open_count + 1, first_open_at = COALESCE(first_open_at, ?) WHERE id = ?").run(at, message.id);
  bump(ctx, message.campaign_id, "open_count");
  if (message.first_open_at === null) {
    bump(ctx, message.campaign_id, "unique_open_count");
    emitMessageEvent(ctx, message, "email.opened", `email.opened:${message.id}`, { campaignId: message.campaign_id });
  }
  ctx.db.prepare("UPDATE mk_contacts SET last_open_at = datetime('now'), last_activity_at = datetime('now') WHERE id = ? AND organization_id = ?").run(message.contact_id, ctx.organizationId);
  return true;
}

// Désinscription faite depuis le lien d'UN message : attribuée à sa campagne, une seule fois
function recordUnsubscribe(ctx, { messageId, contactId, at = Date.now() }) {
  const message = messageOf(ctx, messageId);
  if (!message || (contactId !== undefined && message.contact_id !== contactId) || message.unsubscribed_at !== null) return false;
  ctx.db.prepare("UPDATE mk_messages SET unsubscribed_at = ? WHERE id = ?").run(at, message.id);
  bump(ctx, message.campaign_id, "unsubscribed_count");
  recordEvent(ctx, { messageId: message.id, campaignId: message.campaign_id, type: "unsubscribed", dedupeKey: `unsub:${message.id}`, at });
  return true;
}

module.exports = { isBot, recordClick, recordOpen, recordUnsubscribe };
