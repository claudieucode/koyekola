// Lancement et envoi par lots d'une campagne.
// Règles de sûreté (chacune testée) :
//  - la conformité est revérifiée pour CHAQUE message au moment de l'envoi (désinscription/blocage entre-temps) ;
//  - un envoi interrompu n'est JAMAIS rejoué automatiquement (pas de doublon silencieux) : il est marqué « échoué » ;
//  - débit par minute et plafond quotidien, calculés depuis la base (valables après un redémarrage et avec plusieurs workers) ;
//  - un destinataire en échec n'arrête pas les autres ; une limitation du fournisseur ralentit ; un refus de configuration met en pause.
const crypto = require("crypto");
const { transaction } = require("../db/tx");
const { MarketingError } = require("../errors");
const { checkCtx, audit } = require("../audience/shared");
const { getContact } = require("../audience/contacts");
const { isSendable } = require("../compliance/consent");
const { addSuppression } = require("../compliance/suppression");
const templates = require("../templates");
const { compileTemplate, renderEmail } = require("../templates/blocks");
const { allowedFor, sampleContext } = require("../templates/context");
const { enqueue } = require("../queue/jobs");
const { SendError } = require("./providers/errors");
const { getSendingConfig, createProviderFor } = require("./config");
const { requireCampaign } = require("./campaigns");
const { sendableClause } = require("./audience");
const { preflight } = require("./preflight");
const { buildMessage } = require("./builder");
const { recordEvent, bump } = require("./events");

const DAY = 86400000;
const MINUTE = 60000;
const MAX_ATTEMPTS = 3;
const STUCK_MS = 10 * MINUTE;
const RETRY_BASE_MS = MINUTE;
const MAX_SCHEDULE_MS = 366 * DAY;

const enqueueDispatch = (ctx, campaignId, { runAt, key }) =>
  enqueue(ctx.db, { organizationId: ctx.organizationId, type: "campaign.dispatch", payload: { organizationId: ctx.organizationId, campaignId }, runAt, priority: 5, maxAttempts: 5, idempotencyKey: key });

function snapshotOf(template) {
  return { kind: template.kind, subject: template.subject, preheader: template.preheader, theme: template.theme, footer: template.footer, blocks: template.blocks };
}

// Liens à suivre : ceux du message rendu avec des données d'exemple (les liens système de l'exemple sont exclus)
function trackedLinks(compiled, ctx) {
  const html = renderEmail(compiled, sampleContext(ctx)).html;
  const urls = new Set();
  for (const m of html.matchAll(/href="(https:\/\/[^"]*)"/g)) {
    const url = m[1].replace(/&amp;/g, "&");
    if (!/^https:\/\/exemple\.invalid\//.test(url)) urls.add(url);
  }
  return [...urls];
}

function startCampaign(ctx, id, { scheduledAt, now = Date.now() } = {}) {
  checkCtx(ctx);
  const campaign = requireCampaign(ctx, id);
  if (campaign.status !== "draft") throw new MarketingError("invalid_state", "Cette campagne a déjà été lancée.");
  if (scheduledAt !== undefined && (!Number.isInteger(scheduledAt) || scheduledAt <= now || scheduledAt > now + MAX_SCHEDULE_MS)) {
    throw new MarketingError("invalid_field", "La date d'envoi doit être dans le futur (moins d'un an).");
  }
  const check = preflight(ctx, id, { workerOn: true });
  if (!check.ready) throw new MarketingError("preflight_failed", check.errors.map((e) => e.message).join(" "));

  const template = templates.getTemplate(ctx, campaign.template_id);
  const snapshot = snapshotOf(template);
  const compiled = compileTemplate(snapshot, { allowed: allowedFor(ctx) });

  return transaction(ctx.db, () => {
    const insertLink = ctx.db.prepare("INSERT OR IGNORE INTO mk_links (organization_id, campaign_id, url) VALUES (?, ?, ?)");
    if (campaign.track_clicks) for (const url of trackedLinks(compiled, ctx)) insertLink.run(ctx.organizationId, id, url);

    const { from, params } = sendableClause(ctx, { targetType: campaign.target_type, targetId: campaign.target_id }, campaign.category);
    const recipients = ctx.db
      .prepare(`INSERT INTO mk_campaign_recipients (organization_id, campaign_id, contact_id, email, updated_at) SELECT c.organization_id, ?, c.id, c.email, ? ${from}`)
      .run(id, now, ...params).changes;
    ctx.db
      .prepare("UPDATE mk_campaigns SET status = 'scheduled', snapshot = ?, scheduled_at = ?, total_recipients = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?")
      .run(JSON.stringify(snapshot), scheduledAt ?? null, recipients, id, ctx.organizationId);
    enqueueDispatch(ctx, id, { runAt: scheduledAt ?? now, key: `campaign:${id}:start` });
    audit(ctx, "campaign.started", "campaign", id, { recipients, scheduled: scheduledAt !== undefined });
    return { recipients };
  });
}

// ---------- Capacité (débit et plafond) ----------
function capacity(ctx, cfg, now, { ignoreDaily = false } = {}) {
  const dayStart = Math.floor(now / DAY) * DAY;
  const window = ctx.db.prepare("SELECT COUNT(*) n, MIN(sent_at) oldest FROM mk_messages WHERE organization_id = ? AND sent_at > ?").get(ctx.organizationId, now - MINUTE);
  const dayUsed = ctx.db.prepare("SELECT COUNT(*) n FROM mk_messages WHERE organization_id = ? AND sent_at >= ?").get(ctx.organizationId, dayStart).n;
  const minuteLeft = cfg.ratePerMinute - window.n;
  const dayLeft = cfg.dailyLimit - dayUsed;
  if (!ignoreDaily && dayLeft <= 0) return { allowed: 0, reason: "daily", waitMs: dayStart + DAY - now };
  if (minuteLeft <= 0) return { allowed: 0, reason: "rate", waitMs: Math.max(1000, window.oldest + MINUTE - now) };
  return { allowed: ignoreDaily ? minuteLeft : Math.min(minuteLeft, dayLeft) };
}

function finalize(ctx, campaign, now) {
  ctx.db.prepare("UPDATE mk_campaigns SET status = 'sent', finished_at = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(now, campaign.id, ctx.organizationId);
  const row = ctx.db.prepare("SELECT sent_count, skipped_count, failed_count, bounced_count FROM mk_campaigns WHERE id = ?").get(campaign.id);
  if (ctx.bus) ctx.bus.emit({ organizationId: ctx.organizationId, name: "campaign.sent", source: "marketing", idempotencyKey: `campaign.sent:${campaign.id}`, metadata: { campaignId: campaign.id, ...row } });
  audit(ctx, "campaign.finished", "campaign", campaign.id, row);
}

// ---------- Un destinataire ----------
async function processRecipient(ctx, { campaign, recipient, compiled, config, linkMap, provider, now }) {
  const id = recipient.id;
  const setRecipient = (status, reason = "", extra = {}) =>
    ctx.db
      .prepare("UPDATE mk_campaign_recipients SET status = ?, reason = ?, updated_at = ?, attempts = COALESCE(?, attempts), next_attempt_at = ? WHERE id = ?")
      .run(status, reason, now, extra.attempts ?? null, extra.nextAttemptAt ?? null, id);

  const contact = getContact(ctx, recipient.contact_id);
  if (!contact) { setRecipient("skipped", "contact_removed"); return "skipped"; }
  const listId = campaign.target_type === "list" ? campaign.target_id : undefined;
  const check = isSendable(ctx, contact.id, { listId, category: campaign.category || undefined });
  if (!check.ok) {
    setRecipient("skipped", check.reason);
    bump(ctx, campaign.id, "skipped_count");
    return "skipped";
  }

  ctx.db.prepare("INSERT OR IGNORE INTO mk_messages (organization_id, campaign_id, contact_id, email, provider, status) VALUES (?, ?, ?, ?, ?, 'pending')").run(ctx.organizationId, campaign.id, contact.id, contact.email, provider.name);
  const message = ctx.db.prepare("SELECT * FROM mk_messages WHERE campaign_id = ? AND contact_id = ?").get(campaign.id, contact.id);

  const fail = (status, reason, counter, eventType, detail) =>
    transaction(ctx.db, () => {
      ctx.db.prepare("UPDATE mk_messages SET status = ? WHERE id = ?").run(status === "bounced" ? "bounced" : "failed", message.id);
      if (status === "bounced") ctx.db.prepare("UPDATE mk_messages SET bounced_at = ? WHERE id = ?").run(now, message.id);
      setRecipient("failed", reason);
      bump(ctx, campaign.id, counter);
      recordEvent(ctx, { messageId: message.id, campaignId: campaign.id, type: eventType, detail, at: now });
    });

  try {
    const built = buildMessage(ctx, { campaign, compiled, contact, message, config, linkMap });
    const result = await provider.send(built);
    transaction(ctx.db, () => {
      ctx.db.prepare("UPDATE mk_messages SET status = 'sent', sent_at = ?, provider_message_id = ?, subject = ? WHERE id = ?").run(now, result.providerMessageId, built.subject.slice(0, 300), message.id);
      setRecipient("sent");
      bump(ctx, campaign.id, "sent_count");
      recordEvent(ctx, { messageId: message.id, campaignId: campaign.id, type: "sent", at: now });
      ctx.db.prepare("UPDATE mk_contacts SET last_campaign_at = datetime('now') WHERE id = ? AND organization_id = ?").run(contact.id, ctx.organizationId);
    });
    return "sent";
  } catch (error) {
    if (!(error instanceof SendError)) {
      ctx.log?.error?.("[KOYEKOLA] Erreur imprévue pendant l'envoi d'un message de campagne :", error && error.message);
      fail("failed", "error", "failed_count", "failed", { kind: "error" });
      return "failed";
    }
    switch (error.kind) {
      case "temporary": {
        const attempts = recipient.attempts + 1;
        if (attempts >= MAX_ATTEMPTS) { fail("failed", "temporary_exhausted", "failed_count", "failed", { kind: "temporary" }); return "failed"; }
        setRecipient("queued", "", { attempts, nextAttemptAt: now + RETRY_BASE_MS * 2 ** (attempts - 1) });
        return "retry";
      }
      case "recipient_rejected":
        fail("bounced", "rejected", "bounced_count", "bounced", { via: "smtp", kind: "hard" });
        addSuppression({ ...ctx, audit: false }, { email: contact.email, reason: "bounced", note: "Adresse refusée par le serveur du destinataire (envoi de campagne)" });
        return "failed";
      case "rate_limited":
        setRecipient("queued");
        return { stop: { reason: "provider_rate", waitMs: error.retryAfterMs ?? 30000 } };
      case "config":
        setRecipient("queued");
        return { stop: { reason: "config", pause: error.message } };
      default:
        fail("failed", "permanent", "failed_count", "failed", { kind: "permanent", status: error.status });
        return "failed";
    }
  }
}

// ---------- Un lot ----------
async function dispatchBatch(ctx, campaignId, { provider, now = Date.now(), batchSize = 25 } = {}) {
  checkCtx(ctx);
  let campaign = requireCampaign(ctx, campaignId);
  if (campaign.status === "paused") return { done: false, paused: true };
  if (!["scheduled", "sending"].includes(campaign.status)) return { done: campaign.status !== "draft", state: campaign.status };
  if (campaign.status === "scheduled") {
    if (campaign.scheduled_at && campaign.scheduled_at > now) return { done: false, reason: "scheduled", waitMs: campaign.scheduled_at - now };
    ctx.db.prepare("UPDATE mk_campaigns SET status = 'sending', started_at = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(now, campaignId, ctx.organizationId);
    campaign = requireCampaign(ctx, campaignId);
  }

  let compiled;
  try {
    compiled = compileTemplate(JSON.parse(campaign.snapshot), { allowed: allowedFor(ctx) });
  } catch (error) {
    if (!(error instanceof MarketingError)) throw error;
    ctx.db.prepare("UPDATE mk_campaigns SET status = 'failed', error = ?, finished_at = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(error.message.slice(0, 500), now, campaignId, ctx.organizationId);
    return { done: true, failed: true };
  }

  // Envois interrompus : marqués échoués, jamais renvoyés d'office (un doublon est pire qu'un échec signalé)
  const stuck = ctx.db.prepare("UPDATE mk_campaign_recipients SET status = 'failed', reason = 'interrupted', updated_at = ? WHERE campaign_id = ? AND status = 'sending' AND updated_at < ?").run(now, campaignId, now - STUCK_MS).changes;
  if (stuck) bump(ctx, campaignId, "failed_count", stuck);

  const cfg = getSendingConfig(ctx);
  const linkMap = new Map(ctx.db.prepare("SELECT id, url FROM mk_links WHERE campaign_id = ?").all(campaignId).map((l) => [l.url, l.id]));
  const summary = { sent: 0, skipped: 0, failed: 0 };
  const cap = capacity(ctx, cfg, now);
  let stop = null;

  if (cap.allowed > 0) {
    const limit = Math.min(cap.allowed, batchSize);
    const rows = ctx.db
      .prepare("SELECT * FROM mk_campaign_recipients WHERE campaign_id = ? AND status = 'queued' AND (next_attempt_at IS NULL OR next_attempt_at <= ?) ORDER BY id LIMIT ?")
      .all(campaignId, now, limit);
    const claim = ctx.db.prepare("UPDATE mk_campaign_recipients SET status = 'sending', updated_at = ? WHERE id = ? AND status = 'queued'");
    const claimed = rows.filter((r) => claim.run(now, r.id).changes > 0);
    const release = (from) => { for (const r of claimed.slice(from)) ctx.db.prepare("UPDATE mk_campaign_recipients SET status = 'queued' WHERE id = ? AND status = 'sending'").run(r.id); };

    for (let i = 0; i < claimed.length; i++) {
      const status = ctx.db.prepare("SELECT status FROM mk_campaigns WHERE id = ?").get(campaignId).status;
      if (status !== "sending") { release(i); break; } // mise en pause ou annulée pendant le lot
      const outcome = await processRecipient(ctx, { campaign, recipient: claimed[i], compiled, config: cfg, linkMap, provider, now });
      if (typeof outcome === "object") { stop = outcome.stop; release(i + 1); break; }
      if (outcome === "sent") summary.sent++; else if (outcome === "skipped") summary.skipped++; else if (outcome === "failed") summary.failed++;
    }
  }

  if (stop && stop.pause) {
    ctx.db.prepare("UPDATE mk_campaigns SET status = 'paused', error = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(stop.pause.slice(0, 500), campaignId, ctx.organizationId);
    audit(ctx, "campaign.paused", "campaign", campaignId, { reason: "config" });
    return { done: false, paused: true, reason: "config", ...summary };
  }

  const current = requireCampaign(ctx, campaignId);
  if (current.status !== "sending") return { done: current.status !== "paused", paused: current.status === "paused", ...summary };
  const left = ctx.db.prepare("SELECT COUNT(*) n, MIN(CASE WHEN status = 'queued' THEN COALESCE(next_attempt_at, 0) END) soonest, SUM(status = 'queued') queued FROM mk_campaign_recipients WHERE campaign_id = ? AND status IN ('queued', 'sending')").get(campaignId);
  if (left.n === 0) { finalize(ctx, current, now); return { done: true, ...summary }; }
  if (stop) return { done: false, reason: stop.reason, waitMs: stop.waitMs, ...summary };
  if (!left.queued) return { done: false, reason: "in_flight", waitMs: STUCK_MS, ...summary };
  const next = capacity(ctx, cfg, now);
  if (next.allowed <= 0) return { done: false, reason: next.reason, waitMs: next.waitMs, ...summary };
  if (left.soonest > now) return { done: false, reason: "retry", waitMs: left.soonest - now, ...summary };
  return { done: false, reason: "more", waitMs: 0, ...summary };
}

// ---------- Pause, reprise, annulation ----------
function pauseCampaign(ctx, id) {
  const c = requireCampaign(ctx, id);
  if (!["scheduled", "sending"].includes(c.status)) throw new MarketingError("invalid_state", "Seule une campagne programmée ou en cours peut être mise en pause.");
  ctx.db.prepare("UPDATE mk_campaigns SET status = 'paused', updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  audit(ctx, "campaign.paused", "campaign", id, { reason: "manual" });
}

function resumeCampaign(ctx, id, { now = Date.now() } = {}) {
  const c = requireCampaign(ctx, id);
  if (c.status !== "paused") throw new MarketingError("invalid_state", "Seule une campagne en pause peut être reprise.");
  ctx.db.prepare("UPDATE mk_campaigns SET status = ?, error = '', updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(c.started_at ? "sending" : "scheduled", id, ctx.organizationId);
  enqueueDispatch(ctx, id, { runAt: now, key: `campaign:${id}:resume:${now}:${crypto.randomBytes(3).toString("hex")}` });
  audit(ctx, "campaign.resumed", "campaign", id, {});
}

function cancelCampaign(ctx, id, { now = Date.now() } = {}) {
  const c = requireCampaign(ctx, id);
  if (!["scheduled", "sending", "paused"].includes(c.status)) throw new MarketingError("invalid_state", "Cette campagne n'est plus annulable.");
  transaction(ctx.db, () => {
    const skipped = ctx.db.prepare("UPDATE mk_campaign_recipients SET status = 'skipped', reason = 'cancelled', updated_at = ? WHERE campaign_id = ? AND status = 'queued'").run(now, id).changes;
    if (skipped) bump(ctx, id, "skipped_count", skipped);
    ctx.db.prepare("UPDATE mk_campaigns SET status = 'cancelled', finished_at = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(now, id, ctx.organizationId);
    audit(ctx, "campaign.cancelled", "campaign", id, { skipped });
  });
}

// ---------- Tâche de la file ----------
function jobHandlers({ db, bus = null, settings, env = process.env, providerFor, now = Date.now, log = console, budgetMs = 20000 }) {
  return {
    "campaign.dispatch": async ({ organizationId, campaignId }) => {
      const ctx = { db, organizationId, userId: null, bus, settings, tokenKey: env.ENCRYPTION_KEY, baseUrl: env.SITE_URL, log, now };
      const provider = providerFor ? providerFor(ctx) : createProviderFor(ctx);
      const started = now();
      for (;;) {
        const r = await dispatchBatch(ctx, campaignId, { provider, now: now() });
        if (r.done || r.paused) return;
        const key = () => `campaign:${campaignId}:tick:${now()}:${crypto.randomBytes(3).toString("hex")}`;
        if (r.waitMs > 0) { enqueueDispatch(ctx, campaignId, { runAt: now() + r.waitMs, key: key() }); return; }
        if (now() - started > budgetMs) { enqueueDispatch(ctx, campaignId, { runAt: now(), key: key() }); return; }
        await new Promise((resolve) => setImmediate(resolve));
      }
    },
  };
}

module.exports = { capacity, trackedLinks, snapshotOf, startCampaign, dispatchBatch, pauseCampaign, resumeCampaign, cancelCampaign, jobHandlers, preflight };
