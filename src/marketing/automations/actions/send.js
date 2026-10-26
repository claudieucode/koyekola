// Envoi d'un e-mail ou d'un SMS par une étape de scénario (déplacé tel quel depuis engine.js : aucun changement de
// comportement). Utilisé par les actions « Envoyer un e-mail » et « Envoyer un SMS » du registre (actions/communication.js).
const { transaction } = require("../../db/tx");
const { isSendable } = require("../../compliance/consent");
const { addSuppression } = require("../../compliance/suppression");
const { compileTemplate } = require("../../templates/blocks");
const { allowedFor } = require("../../templates/context");
const { SendError } = require("../../sending/providers/errors");
const { getSendingConfig } = require("../../sending/config");
const { buildMessage } = require("../../sending/builder");
const { capacity } = require("../../sending/dispatch");
const { recordEvent, bump } = require("../../sending/events");
const { isSmsSendable } = require("../../sms/consent");
const { getSmsConfig, createSmsProviderFor } = require("../../sms/config");
const { smsCapacity, processMessage } = require("../../sms/campaigns");

const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 60000;

const compiledCache = new WeakMap();
function compiledFor(ctx, campaign) {
  if (!compiledCache.has(ctx.db)) compiledCache.set(ctx.db, new Map());
  const cache = compiledCache.get(ctx.db);
  if (!cache.has(campaign.id)) {
    if (cache.size >= 200) cache.delete(cache.keys().next().value);
    cache.set(campaign.id, compileTemplate(JSON.parse(campaign.snapshot), { allowed: allowedFor(ctx) }));
  }
  return cache.get(campaign.id);
}

async function sendEmailStep(ctx, { run, automation, step, contact, provider, now, attempts }) {
  const org = ctx.organizationId;
  const transactional = automation.kind === "transactional";
  const campaign = ctx.db.prepare("SELECT * FROM mk_campaigns WHERE id = ? AND organization_id = ? AND automation_id = ?").get(step.campaignId, org, automation.id);
  if (!campaign) return { next: true, log: ["failed", "campagne système introuvable"] };

  if (transactional) {
    if (ctx.db.prepare("SELECT 1 FROM mk_suppressions WHERE organization_id = ? AND email = ?").get(org, contact.email)) return { next: true, log: ["skipped", "suppressed"] };
  } else {
    const check = isSendable(ctx, contact.id);
    if (!check.ok) return { exit: check.reason };
  }

  ctx.db.prepare("INSERT OR IGNORE INTO mk_messages (organization_id, campaign_id, contact_id, email, provider, status) VALUES (?, ?, ?, ?, ?, 'pending')").run(org, campaign.id, contact.id, contact.email, provider.name);
  const message = ctx.db.prepare("SELECT * FROM mk_messages WHERE campaign_id = ? AND contact_id = ?").get(campaign.id, contact.id);
  if (message.status !== "pending") return { next: true, log: ["already_sent", `message ${message.id}`] };
  // Réservé par un appel précédent resté sans réponse (serveur arrêté pendant l'envoi) : on ne sait pas si le message est parti, donc on ne le renvoie JAMAIS (audit B4)
  if (message.claimed_at) {
    ctx.db.prepare("UPDATE mk_messages SET status = 'failed' WHERE id = ? AND status = 'pending'").run(message.id);
    bump(ctx, campaign.id, "failed_count");
    recordEvent(ctx, { messageId: message.id, campaignId: campaign.id, type: "failed", detail: { kind: "interrupted" }, at: now });
    return { next: true, log: ["failed", "interrupted"] };
  }

  const cfg = getSendingConfig(ctx);
  const cap = capacity(ctx, cfg, now, { ignoreDaily: transactional });
  if (cap.allowed <= 0) return { retry: cap.waitMs, attempts };

  const fail = (status, counter, type, detail) =>
    transaction(ctx.db, () => {
      ctx.db.prepare("UPDATE mk_messages SET status = ? WHERE id = ?").run(status, message.id);
      if (status === "bounced") ctx.db.prepare("UPDATE mk_messages SET bounced_at = ? WHERE id = ?").run(now, message.id);
      bump(ctx, campaign.id, counter);
      recordEvent(ctx, { messageId: message.id, campaignId: campaign.id, type, detail, at: now });
    });

  try {
    const linkMap = new Map(ctx.db.prepare("SELECT id, url FROM mk_links WHERE campaign_id = ?").all(campaign.id).map((l) => [l.url, l.id]));
    const built = buildMessage(ctx, { campaign, compiled: compiledFor(ctx, campaign), contact, message, config: cfg, linkMap, event: JSON.parse(run.event_data || "{}"), transactional });
    // Réservation atomique juste avant l'appel : si deux exécutions se croisent, une seule envoie
    if (ctx.db.prepare("UPDATE mk_messages SET claimed_at = ? WHERE id = ? AND status = 'pending' AND claimed_at IS NULL").run(String(now), message.id).changes === 0) return { next: true, log: ["already_sent", `message ${message.id}`] };
    const result = await provider.send(built);
    transaction(ctx.db, () => {
      ctx.db.prepare("UPDATE mk_messages SET status = 'sent', sent_at = ?, provider_message_id = ?, subject = ? WHERE id = ?").run(now, result.providerMessageId, built.subject.slice(0, 300), message.id);
      bump(ctx, campaign.id, "sent_count");
      recordEvent(ctx, { messageId: message.id, campaignId: campaign.id, type: "sent", at: now });
      if (!transactional) ctx.db.prepare("UPDATE mk_contacts SET last_campaign_at = datetime('now') WHERE id = ? AND organization_id = ?").run(contact.id, org);
    });
    return { next: true, log: ["sent", `message ${message.id}`] };
  } catch (error) {
    if (!(error instanceof SendError)) {
      ctx.log?.error?.("[KOLAKISA] Erreur imprévue pendant l'envoi d'un e-mail de scénario :", error && error.message);
      fail("failed", "failed_count", "failed", { kind: "error" });
      return { next: true, log: ["failed", "error"] };
    }
    // Erreur connue du fournisseur : le message n'est PAS parti, la réservation est levée (une reprise reste possible)
    if (error.kind === "temporary" || error.kind === "rate_limited" || error.kind === "config") ctx.db.prepare("UPDATE mk_messages SET claimed_at = NULL WHERE id = ? AND status = 'pending'").run(message.id);
    switch (error.kind) {
      case "temporary": {
        if (attempts + 1 >= MAX_ATTEMPTS) { fail("failed", "failed_count", "failed", { kind: "temporary" }); return { next: true, log: ["failed", "temporary_exhausted"] }; }
        return { retry: RETRY_BASE_MS * 2 ** attempts, attempts: attempts + 1 };
      }
      case "rate_limited": return { retry: error.retryAfterMs ?? 30000, attempts };
      case "config": return { pause: error.message };
      case "recipient_rejected":
        fail("bounced", "bounced_count", "bounced", { via: "smtp", kind: "hard" });
        addSuppression({ ...ctx, audit: false, bus: null }, { email: contact.email, reason: "bounced", note: "Adresse refusée par le serveur du destinataire (scénario)" });
        return { exit: "rejected" };
      default:
        fail("failed", "failed_count", "failed", { kind: "permanent" });
        return { next: true, log: ["failed", "permanent"] };
    }
  }
}

// ---------- Étape « Envoyer un SMS » ----------
// Même chemin que l'envoi d'une campagne SMS (sms/campaigns.js#processMessage) : accord SMS revérifié, heures de silence
// du destinataire, liens courts suivis, mention STOP, longueur facturée, erreurs du fournisseur. Différences voulues :
//  - un contact SANS accord SMS passe simplement l'étape (il reste dans le parcours : ses e-mails continuent) ;
//  - « nuit » chez le destinataire ou plafond atteint : le passage attend (date de réveil), sans compter d'essai ;
//  - un SMS dont l'envoi a été interrompu (serveur arrêté pendant l'appel) n'est JAMAIS renvoyé : il est marqué échoué.
const SMS_STUCK_MS = 10 * 60000;
async function sendSmsStep(ctx, { automation, step, contact, smsProvider, now }) {
  const org = ctx.organizationId;
  const campaign = ctx.db.prepare("SELECT * FROM mk_sms_campaigns WHERE id = ? AND organization_id = ? AND automation_id = ? AND kind = 'automation'").get(step.smsCampaignId, org, automation.id);
  if (!campaign) return { next: true, log: ["failed", "campagne SMS système introuvable"] };
  const bumpC = (column) => ctx.db.prepare(`UPDATE mk_sms_campaigns SET ${column} = ${column} + 1, updated_at = datetime('now') WHERE id = ?`).run(campaign.id);

  let message = ctx.db.prepare("SELECT * FROM mk_sms_messages WHERE campaign_id = ? AND contact_id = ?").get(campaign.id, contact.id);
  if (!message) {
    const check = isSmsSendable(ctx, contact.id);
    if (!check.ok) return { next: true, log: ["skipped", `sms : ${check.reason}`] };
    ctx.db.prepare("INSERT OR IGNORE INTO mk_sms_messages (organization_id, campaign_id, contact_id, phone, updated_at) VALUES (?, ?, ?, ?, ?)").run(org, campaign.id, contact.id, check.phone, now);
    bumpC("total_recipients");
    message = ctx.db.prepare("SELECT * FROM mk_sms_messages WHERE campaign_id = ? AND contact_id = ?").get(campaign.id, contact.id);
  }
  if (message.status === "sending") {
    if (message.updated_at > now - SMS_STUCK_MS) return { retry: SMS_STUCK_MS };
    transaction(ctx.db, () => {
      ctx.db.prepare("UPDATE mk_sms_messages SET status = 'failed', reason = 'interrupted', updated_at = ? WHERE id = ? AND status = 'sending'").run(now, message.id);
      bumpC("failed_count");
    });
    return { next: true, log: ["failed", `sms ${message.id} : interrompu`] };
  }
  if (message.status !== "queued") return { next: true, log: ["already_sent", `sms ${message.id}`] };
  if (message.next_attempt_at && message.next_attempt_at > now) return { retry: message.next_attempt_at - now };

  const cfg = getSmsConfig(ctx);
  const cap = smsCapacity(ctx, cfg, now);
  if (cap.allowed <= 0) return { retry: cap.waitMs };
  let provider;
  try {
    provider = smsProvider ? smsProvider() : createSmsProviderFor(ctx);
  } catch (error) {
    return { pause: `SMS : ${error.message}` };
  }
  if (!ctx.db.prepare("UPDATE mk_sms_messages SET status = 'sending', updated_at = ? WHERE id = ? AND status = 'queued'").run(now, message.id).changes) return { retry: 1000 };
  const links = ctx.db.prepare("SELECT id, url FROM mk_sms_links WHERE campaign_id = ?").all(campaign.id);
  const outcome = await processMessage(ctx, { campaign, message: { ...message, status: "sending" }, cfg, links, provider, now });
  if (typeof outcome === "object") {
    if (outcome.stop.pause) return { pause: `SMS : ${outcome.stop.pause}` };
    return { retry: outcome.stop.waitMs ?? 30000 };
  }
  if (outcome === "deferred" || outcome === "retry") {
    const next = ctx.db.prepare("SELECT next_attempt_at FROM mk_sms_messages WHERE id = ?").get(message.id).next_attempt_at;
    return { retry: Math.max(1000, (next ?? now + 60000) - now) };
  }
  const row = ctx.db.prepare("SELECT reason FROM mk_sms_messages WHERE id = ?").get(message.id);
  return { next: true, log: [outcome, `sms ${message.id}${row && row.reason ? ` : ${row.reason}` : ""}`] };
}

module.exports = { sendEmailStep, sendSmsStep };
