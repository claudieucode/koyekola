// Liens courts des SMS (« /s/<code> ») : clic suivi puis redirection, ou page de désinscription.
// Règles (comme l'e-mail, sending/tracking.js) : la destination est lue en base (jamais dans l'adresse reçue : pas de
// redirection ouverte) ; les robots (aperçus de liens des messageries, antivirus) sont ignorés dans les chiffres ;
// une ouverture de la page de désinscription ne désinscrit PAS (seul le bouton le fait).
const { isBot } = require("../sending/tracking");
const { unsubscribeSms } = require("./consent");
const { maskPhone } = require("./phone");

const CODE = /^[a-zA-Z0-9]{8}$/;

// code → { short, message, campaign, link } ou null
function resolveCode(db, code) {
  if (typeof code !== "string" || !CODE.test(code)) return null;
  const short = db.prepare("SELECT * FROM mk_sms_short_links WHERE code = ?").get(code);
  if (!short) return null;
  const message = db.prepare("SELECT * FROM mk_sms_messages WHERE id = ?").get(short.message_id);
  if (!message) return null;
  const link = short.link_id ? db.prepare("SELECT * FROM mk_sms_links WHERE id = ?").get(short.link_id) : null;
  return { short, message, link };
}

// → adresse de destination, ou null si le code n'est pas un lien
function recordSmsClick(db, resolved, { userAgent, at = Date.now() } = {}) {
  const { short, message, link } = resolved;
  if (short.kind !== "link" || !link || !/^https?:\/\//.test(link.url)) return null;
  if (isBot(userAgent)) return link.url;
  db.prepare("INSERT INTO mk_sms_clicks (organization_id, campaign_id, message_id, link_id, created_at) VALUES (?, ?, ?, ?, ?)").run(short.organization_id, message.campaign_id, message.id, link.id, at);
  db.prepare("UPDATE mk_sms_links SET click_count = click_count + 1 WHERE id = ?").run(link.id);
  if (message.clicked_at === null) {
    db.prepare("UPDATE mk_sms_messages SET clicked_at = ? WHERE id = ?").run(at, message.id);
    db.prepare("UPDATE mk_sms_campaigns SET click_count = click_count + 1 WHERE id = ?").run(message.campaign_id);
  }
  db.prepare("UPDATE mk_contacts SET last_click_at = datetime('now'), last_activity_at = datetime('now') WHERE id = ? AND organization_id = ?").run(message.contact_id, short.organization_id);
  return link.url;
}

// Infos pour la page de confirmation (numéro masqué, déjà désinscrit ?)
function optOutInfo(db, resolved) {
  const contact = db.prepare("SELECT sms_status FROM mk_contacts WHERE id = ? AND organization_id = ?").get(resolved.message.contact_id, resolved.short.organization_id);
  return { masked: maskPhone(resolved.message.phone), already: !contact || contact.sms_status === "unsubscribed" };
}

// Bouton « Confirmer » : retrait de l'accord SMS, attribué à la campagne (une seule fois)
function unsubscribeFromCode(db, resolved, { bus = null, at = Date.now() } = {}) {
  const { short, message } = resolved;
  if (short.kind !== "unsubscribe") return { ok: false };
  const ctx = { db, organizationId: short.organization_id, userId: null, bus };
  const contact = db.prepare("SELECT id FROM mk_contacts WHERE id = ? AND organization_id = ?").get(message.contact_id, short.organization_id);
  if (contact) unsubscribeSms(ctx, contact.id, { source: "sms_link" });
  if (message.unsubscribed_at === null) {
    db.prepare("UPDATE mk_sms_messages SET unsubscribed_at = ? WHERE id = ?").run(at, message.id);
    db.prepare("UPDATE mk_sms_campaigns SET unsubscribe_count = unsubscribe_count + 1 WHERE id = ?").run(message.campaign_id);
  }
  return { ok: true };
}

module.exports = { resolveCode, recordSmsClick, optOutInfo, unsubscribeFromCode };
