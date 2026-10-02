// Campagnes SMS : brouillon → contrôle avant envoi (audience, segments, coût) → lancement → envoi par lots en
// arrière-plan → rapport. Mêmes règles de sûreté que les campagnes e-mail (sending/dispatch.js), chacune testée :
//  - la conformité SMS est revérifiée pour CHAQUE message au moment de l'envoi ;
//  - heures de silence À L'HEURE DU DESTINATAIRE : un message prévu la nuit attend le matin (sans compter comme essai) ;
//  - un envoi interrompu n'est JAMAIS rejoué automatiquement (un SMS en double est payé deux fois) : il est marqué échoué ;
//  - débit par minute et plafond quotidien calculés depuis la base ; un message trop long (segments) n'est pas envoyé ;
//  - numéro refusé → numéro bloqué (invalide) ; numéro désinscrit chez le fournisseur → numéro bloqué (STOP) ;
//    identifiants refusés → campagne en pause avec un message clair.
const crypto = require("crypto");
const { transaction } = require("../db/tx");
const { MarketingError } = require("../errors");
const { checkCtx, cleanText, audit } = require("../audience/shared");
const { getContact } = require("../audience/contacts");
const { targetClause } = require("../sending/audience");
const { enqueue } = require("../queue/jobs");
const { smsSendableSql, isSmsSendable, addSmsSuppression } = require("./consent");
const { getSmsConfig, createSmsProviderFor } = require("./config");
const { SmsSendError } = require("./providers/errors");
const { countryOfE164 } = require("./phone");
const { quietReason, nextAllowedTime } = require("./quiet");
const { smsLength } = require("./text");
const R = require("./render");

const DAY = 86400000;
const MINUTE = 60000;
const MAX_ATTEMPTS = 3;
const STUCK_MS = 10 * MINUTE;
const RETRY_BASE_MS = MINUTE;
const MAX_SCHEDULE_MS = 366 * DAY;
const MAX_BODY = 1600;
const ESTIMATE_LIMIT = 50000;
const bad = (message) => new MarketingError("invalid_field", message);
const intOrNull = (v) => (v === null || v === undefined || v === "" ? null : Number.isInteger(Number(v)) ? Number(v) : NaN);

// ---------- Brouillons ----------
function getSmsCampaign(ctx, id) {
  checkCtx(ctx);
  return Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_sms_campaigns WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) ?? null : null;
}
function requireSmsCampaign(ctx, id) {
  const c = getSmsCampaign(ctx, id);
  if (!c) throw new MarketingError("not_found", "Campagne SMS introuvable.");
  return c;
}

function checkName(name) {
  const value = cleanText(name, { max: 120, field: "name" });
  if (!value) throw bad("Donnez un nom à la campagne (il n'est pas envoyé, il sert à la retrouver).");
  return value;
}

function createSmsCampaign(ctx, { name, body = "", targetType = "all", targetId = null } = {}) {
  checkCtx(ctx);
  const info = ctx.db
    .prepare("INSERT INTO mk_sms_campaigns (organization_id, name, body, target_type, target_id, created_by) VALUES (?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, checkName(name), String(body).slice(0, MAX_BODY), targetType, targetId, ctx.userId ?? null);
  const id = Number(info.lastInsertRowid);
  audit(ctx, "sms_campaign.created", "sms_campaign", id, {});
  return getSmsCampaign(ctx, id);
}

function updateSmsCampaign(ctx, id, patch = {}) {
  const c = requireSmsCampaign(ctx, id);
  if (c.status !== "draft") throw new MarketingError("invalid_state", "Une campagne lancée ne peut plus être modifiée (dupliquez-la).");
  const next = { name: c.name, body: c.body, target_type: c.target_type, target_id: c.target_id, track_clicks: c.track_clicks };
  if (patch.name !== undefined) next.name = checkName(patch.name);
  if (patch.body !== undefined) {
    const body = String(patch.body ?? "").replace(/\r\n?/g, "\n");
    if (body.length > MAX_BODY) throw bad(`Message trop long (${MAX_BODY} caractères au plus).`);
    next.body = body;
  }
  if (patch.targetType !== undefined) {
    if (!["all", "list", "segment"].includes(patch.targetType)) throw bad("Destinataires : tous les abonnés SMS, une liste ou un segment.");
    const targetId = patch.targetType === "all" ? null : intOrNull(patch.targetId);
    if (patch.targetType !== "all") {
      if (!Number.isInteger(targetId)) throw bad("Choisissez la liste ou le segment.");
      targetClause(ctx, { targetType: patch.targetType, targetId }); // lève si introuvable
    }
    next.target_type = patch.targetType;
    next.target_id = targetId;
  }
  if (patch.trackClicks !== undefined) next.track_clicks = patch.trackClicks ? 1 : 0;
  ctx.db
    .prepare("UPDATE mk_sms_campaigns SET name = ?, body = ?, target_type = ?, target_id = ?, track_clicks = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?")
    .run(next.name, next.body, next.target_type, next.target_id, next.track_clicks, id, ctx.organizationId);
  return getSmsCampaign(ctx, id);
}

function duplicateSmsCampaign(ctx, id) {
  const c = requireSmsCampaign(ctx, id);
  const copy = createSmsCampaign(ctx, { name: `${c.name} (copie)`.slice(0, 120), body: c.body, targetType: c.target_type, targetId: c.target_id });
  ctx.db.prepare("UPDATE mk_sms_campaigns SET track_clicks = ? WHERE id = ?").run(c.track_clicks, copy.id);
  return getSmsCampaign(ctx, copy.id);
}

function deleteSmsCampaign(ctx, id) {
  const c = requireSmsCampaign(ctx, id);
  if (!["draft", "cancelled"].includes(c.status)) throw new MarketingError("invalid_state", "Seul un brouillon ou une campagne annulée peut être supprimé (le rapport d'une campagne envoyée est conservé).");
  ctx.db.prepare("DELETE FROM mk_sms_campaigns WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  audit(ctx, "sms_campaign.deleted", "sms_campaign", id, {});
}

const TABS = { draft: ["draft"], scheduled: ["scheduled"], running: ["sending", "paused"], sent: ["sent"], stopped: ["cancelled", "failed"] };
function listSmsCampaigns(ctx, { tab = "" } = {}) {
  checkCtx(ctx);
  const statuses = TABS[tab];
  const where = statuses ? `AND status IN (${statuses.map(() => "?").join(", ")})` : "";
  const rows = ctx.db.prepare(`SELECT * FROM mk_sms_campaigns WHERE organization_id = ? ${where} ORDER BY id DESC LIMIT 200`).all(ctx.organizationId, ...(statuses || []));
  const counts = Object.fromEntries(Object.keys(TABS).map((k) => [k, 0]));
  for (const r of ctx.db.prepare("SELECT status, COUNT(*) n FROM mk_sms_campaigns WHERE organization_id = ? GROUP BY status").all(ctx.organizationId)) {
    for (const [k, list] of Object.entries(TABS)) if (list.includes(r.status)) counts[k] += r.n;
  }
  counts.all = Object.values(counts).reduce((a, b) => a + b, 0);
  return { rows, counts };
}

// ---------- Audience ----------
function audienceFrom(ctx, { targetType, targetId }) {
  if (targetType === "all") return { from: "FROM mk_contacts c WHERE c.organization_id = ?", params: [ctx.organizationId] };
  const t = targetClause(ctx, { targetType, targetId });
  return { from: t.from, params: t.params };
}

function smsAudienceSummary(ctx, target) {
  checkCtx(ctx);
  const t = audienceFrom(ctx, target);
  const s = smsSendableSql("c");
  const targetTotal = ctx.db.prepare(`SELECT COUNT(*) n ${t.from}`).get(...t.params).n;
  const sendable = ctx.db.prepare(`SELECT COUNT(*) n ${t.from} AND ${s.sql}`).get(...t.params).n;
  const rows = ctx.db.prepare(
    `SELECT CASE
       WHEN c.sms_status = 'unsubscribed' THEN 'unsubscribed'
       WHEN c.sms_status <> 'subscribed' THEN 'not_subscribed'
       WHEN EXISTS (SELECT 1 FROM mk_sms_suppressions x WHERE x.organization_id = c.organization_id AND x.phone = c.sms_phone) THEN 'blocked'
       ELSE 'no_consent' END AS reason, COUNT(*) AS n
     ${t.from} AND NOT (${s.sql}) GROUP BY reason`,
  ).all(...t.params);
  const excluded = { total: 0, not_subscribed: 0, unsubscribed: 0, blocked: 0, no_consent: 0 };
  for (const r of rows) { excluded[r.reason] = r.n; excluded.total += r.n; }
  return { targetTotal, sendable, excluded };
}

// ---------- Estimation (segments, coût) et contrôle avant envoi ----------
function priceOf(cfg) {
  const p = Number(cfg.pricePerSegment);
  return cfg.pricePerSegment !== "" && Number.isFinite(p) && p >= 0 ? p : null;
}

function estimateSmsCampaign(ctx, id) {
  const c = requireSmsCampaign(ctx, id);
  const cfg = getSmsConfig(ctx);
  const t = audienceFrom(ctx, { targetType: c.target_type, targetId: c.target_id });
  const s = smsSendableSql("c");
  const contacts = ctx.db.prepare(`SELECT c.first_name, c.last_name ${t.from} AND ${s.sql} ORDER BY c.id LIMIT ${ESTIMATE_LIMIT}`).all(...t.params);
  const opts = { baseUrl: ctx.baseUrl, trackClicks: Boolean(c.track_clicks) };
  let segments = 0, maxSegments = 0, overLimit = 0, unicode = 0;
  for (const contact of contacts) {
    const e = R.estimateFor(c.body, contact, opts);
    segments += e.segments;
    maxSegments = Math.max(maxSegments, e.segments);
    if (e.segments > cfg.maxSegments) overLimit += 1;
    if (e.encoding === "UCS-2") unicode += 1;
  }
  const sample = R.estimateFor(c.body, contacts[0] || { first_name: "Marie", last_name: "Kabila" }, opts);
  const price = priceOf(cfg);
  return {
    recipients: contacts.length, segments, maxSegments, overLimit, unicode, limit: cfg.maxSegments, sample,
    cost: price === null ? null : Math.round(segments * price * 100) / 100, currency: cfg.currency, price,
  };
}

function smsPreflight(ctx, id, { workerOn = process.env.MARKETING_WORKER === "on" } = {}) {
  const c = requireSmsCampaign(ctx, id);
  const cfg = getSmsConfig(ctx);
  const errors = [];
  const warnings = [];
  const add = (list, key, message) => list.push({ key, message });

  if (!c.body.trim()) add(errors, "body", "Le message est vide.");
  const tags = R.unknownTags(c.body);
  if (tags.length) add(errors, "body", `Balise de personnalisation inconnue : ${tags.join(", ")}. Utilisez {{prenom}} ou {{nom}}.`);
  if (!/^https:\/\//.test(String(ctx.baseUrl || ""))) add(errors, "site", "L'adresse publique du site (SITE_URL, en https) n'est pas définie : le lien de désinscription obligatoire ne peut pas être créé.");
  let audienceInfo = null;
  try {
    audienceInfo = smsAudienceSummary(ctx, { targetType: c.target_type, targetId: c.target_id });
    if (!audienceInfo.sendable) add(errors, "audience", "Aucun destinataire joignable par SMS (il faut un accord SMS prouvé et un numéro valide).");
  } catch (error) {
    if (!(error instanceof MarketingError)) throw error;
    add(errors, "audience", "La liste ou le segment choisi n'existe plus.");
  }
  const estimate = audienceInfo && audienceInfo.sendable && c.body.trim() ? estimateSmsCampaign(ctx, id) : null;
  if (estimate && estimate.overLimit) add(errors, "length", `${estimate.overLimit} SMS dépasseraient ${cfg.maxSegments} segment(s) facturé(s) : raccourcissez le message (ou augmentez la limite dans les réglages SMS).`);
  if (estimate && estimate.unicode) add(warnings, "unicode", `Le message contient des caractères spéciaux (${estimate.sample.unsupported.join(" ") || "accents"}) : chaque SMS est limité à 70 caractères au lieu de 160. Le bouton « Remplacer les accents » peut diviser le coût par deux.`);
  if (cfg.provider === "console") add(warnings, "provider", "Fournisseur « console » : aucun SMS ne partira réellement (mode essai).");
  else if (!cfg.sender || !cfg.accountSid || !cfg.authTokenSet) add(errors, "provider", "Réglages Twilio incomplets (expéditeur, identifiant de compte, jeton).");
  if (!workerOn) add(errors, "worker", "Le traitement en arrière-plan est arrêté (MARKETING_WORKER) : aucune campagne ne peut partir.");
  if (estimate && estimate.cost === null) add(warnings, "price", "Renseignez le prix d'un SMS dans les réglages SMS pour voir le coût estimé.");
  if (audienceInfo && audienceInfo.sendable > cfg.dailyLimit) add(warnings, "daily", `Plafond quotidien de ${cfg.dailyLimit} SMS : l'envoi s'étalera sur plusieurs jours.`);
  add(warnings, "quiet", `Heures de silence de ${cfg.quietStart} h à ${cfg.quietEnd} h (à l'heure de chaque destinataire) : les SMS prévus pendant cette plage partiront le matin.`);
  return { ready: errors.length === 0, errors, warnings, audience: audienceInfo, estimate, config: cfg };
}

// ---------- Lancement ----------
const enqueueDispatch = (ctx, campaignId, { runAt, key }) =>
  enqueue(ctx.db, { organizationId: ctx.organizationId, type: "sms.dispatch", payload: { organizationId: ctx.organizationId, campaignId }, runAt, priority: 5, maxAttempts: 5, idempotencyKey: key });

function startSmsCampaign(ctx, id, { scheduledAt, now = Date.now(), workerOn } = {}) {
  checkCtx(ctx);
  const c = requireSmsCampaign(ctx, id);
  if (c.status !== "draft") throw new MarketingError("invalid_state", "Cette campagne a déjà été lancée.");
  if (scheduledAt !== undefined && (!Number.isInteger(scheduledAt) || scheduledAt <= now || scheduledAt > now + MAX_SCHEDULE_MS)) {
    throw bad("La date d'envoi doit être dans le futur (moins d'un an).");
  }
  const check = smsPreflight(ctx, id, workerOn === undefined ? {} : { workerOn });
  if (!check.ready) throw new MarketingError("preflight_failed", check.errors.map((e) => e.message).join(" "));
  const cfg = check.config;
  return transaction(ctx.db, () => {
    if (c.track_clicks) {
      const insert = ctx.db.prepare("INSERT OR IGNORE INTO mk_sms_links (organization_id, campaign_id, url) VALUES (?, ?, ?)");
      for (const url of R.linksIn(c.body)) insert.run(ctx.organizationId, id, url);
    }
    const t = audienceFrom(ctx, { targetType: c.target_type, targetId: c.target_id });
    const s = smsSendableSql("c");
    const recipients = ctx.db
      .prepare(`INSERT OR IGNORE INTO mk_sms_messages (organization_id, campaign_id, contact_id, phone, updated_at) SELECT c.organization_id, ?, c.id, c.sms_phone, ? ${t.from} AND ${s.sql}`)
      .run(id, now, ...t.params).changes;
    ctx.db
      .prepare(`UPDATE mk_sms_campaigns SET status = 'scheduled', sender = ?, price_per_segment = ?, currency = ?, scheduled_at = ?, total_recipients = ?, updated_at = datetime('now')
                WHERE id = ? AND organization_id = ?`)
      .run(cfg.sender || "KOYEKOLA", cfg.pricePerSegment, cfg.currency, scheduledAt ?? null, recipients, id, ctx.organizationId);
    enqueueDispatch(ctx, id, { runAt: scheduledAt ?? now, key: `sms_campaign:${id}:start` });
    audit(ctx, "sms_campaign.started", "sms_campaign", id, { recipients, scheduled: scheduledAt !== undefined });
    return { recipients };
  });
}

// ---------- Liens courts d'un message ----------
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans 0/O, 1/l/I : lisibles s'ils sont recopiés
function randomCode() {
  const bytes = crypto.randomBytes(R.CODE_LENGTH * 2);
  let code = "";
  for (let i = 0; code.length < R.CODE_LENGTH && i < bytes.length; i++) if (bytes[i] < 256 - (256 % ALPHABET.length)) code += ALPHABET[bytes[i] % ALPHABET.length];
  return code.length === R.CODE_LENGTH ? code : randomCode();
}
// Codes du message (réutilisés si le message est réessayé) : { optOut, byLink: Map link_id → code }
function codesFor(ctx, message, links, now) {
  const existing = ctx.db.prepare("SELECT code, link_id, kind FROM mk_sms_short_links WHERE message_id = ?").all(message.id);
  const insert = ctx.db.prepare("INSERT OR IGNORE INTO mk_sms_short_links (code, organization_id, message_id, link_id, kind, created_at) VALUES (?, ?, ?, ?, ?, ?)");
  const create = (linkId, kind) => {
    for (;;) { const code = randomCode(); if (insert.run(code, ctx.organizationId, message.id, linkId, kind, now).changes) return code; }
  };
  const optOut = existing.find((r) => r.kind === "unsubscribe")?.code ?? create(null, "unsubscribe");
  const byLink = new Map();
  for (const link of links) byLink.set(link.id, existing.find((r) => r.link_id === link.id)?.code ?? create(link.id, "link"));
  return { optOut, byLink };
}

// ---------- Capacité (débit et plafond, toutes campagnes SMS de l'organisation) ----------
function smsCapacity(ctx, cfg, now) {
  const dayStart = Math.floor(now / DAY) * DAY;
  const window = ctx.db.prepare("SELECT COUNT(*) n, MIN(sent_at) oldest FROM mk_sms_messages WHERE organization_id = ? AND sent_at > ?").get(ctx.organizationId, now - MINUTE);
  const dayUsed = ctx.db.prepare("SELECT COUNT(*) n FROM mk_sms_messages WHERE organization_id = ? AND sent_at >= ?").get(ctx.organizationId, dayStart).n;
  if (cfg.dailyLimit - dayUsed <= 0) return { allowed: 0, reason: "daily", waitMs: dayStart + DAY - now };
  if (cfg.ratePerMinute - window.n <= 0) return { allowed: 0, reason: "rate", waitMs: Math.max(1000, window.oldest + MINUTE - now) };
  return { allowed: Math.min(cfg.ratePerMinute - window.n, cfg.dailyLimit - dayUsed) };
}

const bumpC = (ctx, id, column, by = 1) => ctx.db.prepare(`UPDATE mk_sms_campaigns SET ${column} = ${column} + ?, updated_at = datetime('now') WHERE id = ?`).run(by, id);

// ---------- Un destinataire ----------
async function processMessage(ctx, { campaign, message, cfg, links, provider, now }) {
  const set = (status, reason = "", extra = {}) =>
    ctx.db.prepare("UPDATE mk_sms_messages SET status = ?, reason = ?, updated_at = ?, attempts = COALESCE(?, attempts), next_attempt_at = ? WHERE id = ?")
      .run(status, reason, now, extra.attempts ?? null, extra.nextAttemptAt ?? null, message.id);
  const fail = (reason, column = "failed_count") => transaction(ctx.db, () => { set("failed", reason); bumpC(ctx, campaign.id, column); });

  const contact = getContact(ctx, message.contact_id);
  if (!contact) { set("skipped", "contact_removed"); bumpC(ctx, campaign.id, "skipped_count"); return "skipped"; }
  const check = isSmsSendable(ctx, contact.id);
  if (!check.ok || check.phone !== message.phone) { set("skipped", check.ok ? "phone_changed" : check.reason); bumpC(ctx, campaign.id, "skipped_count"); return "skipped"; }

  // Heures de silence du destinataire : on attend, sans compter un essai
  const opts = { country: countryOfE164(message.phone), start: cfg.quietStart, end: cfg.quietEnd };
  if (quietReason({ ...opts, at: now })) {
    const next = nextAllowedTime({ ...opts, at: now });
    if (next === null) { fail("quiet_hours"); return "failed"; }
    set("queued", "quiet_hours", { nextAttemptAt: next });
    return "deferred";
  }

  const codes = codesFor(ctx, message, links, now);
  const linkUrls = new Map(links.map((l) => [l.url, R.shortUrl(ctx.baseUrl, codes.byLink.get(l.id))]));
  const body = R.renderSms(campaign.body, contact, { links: linkUrls, optOutUrl: R.shortUrl(ctx.baseUrl, codes.optOut) });
  const length = smsLength(body);
  if (length.segments > cfg.maxSegments) { fail("too_long"); return "failed"; }

  const statusCallback = provider.capabilities.statusCallbacks && /^https:\/\//.test(String(ctx.baseUrl || ""))
    ? `${String(ctx.baseUrl).replace(/\/+$/, "")}/webhooks/sms/twilio/${ctx.organizationId}` : undefined;
  try {
    const result = await provider.send({ from: campaign.sender, to: message.phone, body, statusCallback });
    const segments = result.segments || length.segments;
    transaction(ctx.db, () => {
      ctx.db.prepare("UPDATE mk_sms_messages SET status = 'sent', reason = '', sent_at = ?, provider_message_id = ?, segments = ?, updated_at = ? WHERE id = ?")
        .run(now, result.providerMessageId, segments, now, message.id);
      bumpC(ctx, campaign.id, "sent_count");
      bumpC(ctx, campaign.id, "segments_count", segments);
    });
    return "sent";
  } catch (error) {
    if (!(error instanceof SmsSendError)) {
      ctx.log?.error?.("[KOYEKOLA] Erreur imprévue pendant l'envoi d'un SMS de campagne :", error && error.message);
      fail("error");
      return "failed";
    }
    switch (error.kind) {
      case "temporary": {
        const attempts = message.attempts + 1;
        if (attempts >= MAX_ATTEMPTS) { fail("temporary_exhausted"); return "failed"; }
        set("queued", "", { attempts, nextAttemptAt: now + RETRY_BASE_MS * 2 ** (attempts - 1) });
        return "retry";
      }
      case "recipient_rejected":
        fail("invalid_number");
        addSmsSuppression({ ...ctx, audit: false }, { phone: message.phone, reason: "invalid", note: `Refusé par le fournisseur (code ${error.code ?? "?"})`, source: "provider" });
        return "failed";
      case "opted_out":
        fail("opted_out");
        addSmsSuppression({ ...ctx, audit: false }, { phone: message.phone, reason: "stop", note: "Désinscrit chez le fournisseur (STOP)" });
        return "failed";
      case "rate_limited":
        set("queued");
        return { stop: { reason: "provider_rate", waitMs: error.retryAfterMs ?? 30000 } };
      case "config":
        set("queued");
        return { stop: { reason: "config", pause: error.message } };
      default:
        fail("permanent");
        return "failed";
    }
  }
}

function finalize(ctx, campaign, now) {
  ctx.db.prepare("UPDATE mk_sms_campaigns SET status = 'sent', finished_at = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(now, campaign.id, ctx.organizationId);
  const row = ctx.db.prepare("SELECT sent_count, skipped_count, failed_count, segments_count FROM mk_sms_campaigns WHERE id = ?").get(campaign.id);
  if (ctx.bus) ctx.bus.emit({ organizationId: ctx.organizationId, name: "sms_campaign.sent", source: "marketing", idempotencyKey: `sms_campaign.sent:${campaign.id}`, metadata: { campaignId: campaign.id, ...row } });
  audit(ctx, "sms_campaign.finished", "sms_campaign", campaign.id, row);
}

// ---------- Un lot ----------
async function dispatchSmsBatch(ctx, campaignId, { provider, now = Date.now(), batchSize = 25 } = {}) {
  checkCtx(ctx);
  let campaign = requireSmsCampaign(ctx, campaignId);
  if (campaign.status === "paused") return { done: false, paused: true };
  if (!["scheduled", "sending"].includes(campaign.status)) return { done: campaign.status !== "draft", state: campaign.status };
  if (campaign.status === "scheduled") {
    if (campaign.scheduled_at && campaign.scheduled_at > now) return { done: false, reason: "scheduled", waitMs: campaign.scheduled_at - now };
    ctx.db.prepare("UPDATE mk_sms_campaigns SET status = 'sending', started_at = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(now, campaignId, ctx.organizationId);
    campaign = requireSmsCampaign(ctx, campaignId);
  }

  // Envois interrompus (serveur arrêté pendant l'appel au fournisseur) : échoués, jamais renvoyés d'office
  const stuck = ctx.db.prepare("UPDATE mk_sms_messages SET status = 'failed', reason = 'interrupted', updated_at = ? WHERE campaign_id = ? AND status = 'sending' AND updated_at < ?").run(now, campaignId, now - STUCK_MS).changes;
  if (stuck) bumpC(ctx, campaignId, "failed_count", stuck);

  const cfg = getSmsConfig(ctx);
  const links = ctx.db.prepare("SELECT id, url FROM mk_sms_links WHERE campaign_id = ?").all(campaignId);
  const summary = { sent: 0, skipped: 0, failed: 0, deferred: 0 };
  const cap = smsCapacity(ctx, cfg, now);
  let stop = null;

  if (cap.allowed > 0) {
    const rows = ctx.db
      .prepare("SELECT * FROM mk_sms_messages WHERE campaign_id = ? AND status = 'queued' AND (next_attempt_at IS NULL OR next_attempt_at <= ?) ORDER BY id LIMIT ?")
      .all(campaignId, now, Math.min(cap.allowed, batchSize));
    const claim = ctx.db.prepare("UPDATE mk_sms_messages SET status = 'sending', updated_at = ? WHERE id = ? AND status = 'queued'");
    const claimed = rows.filter((r) => claim.run(now, r.id).changes > 0);
    const release = (from) => { for (const r of claimed.slice(from)) ctx.db.prepare("UPDATE mk_sms_messages SET status = 'queued' WHERE id = ? AND status = 'sending'").run(r.id); };
    for (let i = 0; i < claimed.length; i++) {
      if (ctx.db.prepare("SELECT status FROM mk_sms_campaigns WHERE id = ?").get(campaignId).status !== "sending") { release(i); break; }
      const outcome = await processMessage(ctx, { campaign, message: claimed[i], cfg, links, provider, now });
      if (typeof outcome === "object") { stop = outcome.stop; release(i + 1); break; }
      if (Object.hasOwn(summary, outcome)) summary[outcome]++;
    }
  }

  if (stop && stop.pause) {
    ctx.db.prepare("UPDATE mk_sms_campaigns SET status = 'paused', error = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(stop.pause.slice(0, 500), campaignId, ctx.organizationId);
    audit(ctx, "sms_campaign.paused", "sms_campaign", campaignId, { reason: "config" });
    return { done: false, paused: true, reason: "config", ...summary };
  }
  const current = requireSmsCampaign(ctx, campaignId);
  if (current.status !== "sending") return { done: current.status !== "paused", paused: current.status === "paused", ...summary };
  const left = ctx.db.prepare("SELECT COUNT(*) n, MIN(CASE WHEN status = 'queued' THEN COALESCE(next_attempt_at, 0) END) soonest, SUM(status = 'queued') queued FROM mk_sms_messages WHERE campaign_id = ? AND status IN ('queued', 'sending')").get(campaignId);
  if (left.n === 0) { finalize(ctx, current, now); return { done: true, ...summary }; }
  if (stop) return { done: false, reason: stop.reason, waitMs: stop.waitMs, ...summary };
  if (!left.queued) return { done: false, reason: "in_flight", waitMs: STUCK_MS, ...summary };
  const next = smsCapacity(ctx, cfg, now);
  if (next.allowed <= 0) return { done: false, reason: next.reason, waitMs: next.waitMs, ...summary };
  if (left.soonest > now) return { done: false, reason: "wait", waitMs: left.soonest - now, ...summary };
  return { done: false, reason: "more", waitMs: 0, ...summary };
}

// ---------- Pause, reprise, annulation ----------
function pauseSmsCampaign(ctx, id) {
  const c = requireSmsCampaign(ctx, id);
  if (!["scheduled", "sending"].includes(c.status)) throw new MarketingError("invalid_state", "Seule une campagne programmée ou en cours peut être mise en pause.");
  ctx.db.prepare("UPDATE mk_sms_campaigns SET status = 'paused', updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  audit(ctx, "sms_campaign.paused", "sms_campaign", id, { reason: "manual" });
}
function resumeSmsCampaign(ctx, id, { now = Date.now() } = {}) {
  const c = requireSmsCampaign(ctx, id);
  if (c.status !== "paused") throw new MarketingError("invalid_state", "Seule une campagne en pause peut être reprise.");
  ctx.db.prepare("UPDATE mk_sms_campaigns SET status = ?, error = '', updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(c.started_at ? "sending" : "scheduled", id, ctx.organizationId);
  enqueueDispatch(ctx, id, { runAt: now, key: `sms_campaign:${id}:resume:${now}:${crypto.randomBytes(3).toString("hex")}` });
  audit(ctx, "sms_campaign.resumed", "sms_campaign", id, {});
}
function cancelSmsCampaign(ctx, id, { now = Date.now() } = {}) {
  const c = requireSmsCampaign(ctx, id);
  if (!["scheduled", "sending", "paused"].includes(c.status)) throw new MarketingError("invalid_state", "Cette campagne n'est plus annulable.");
  transaction(ctx.db, () => {
    const skipped = ctx.db.prepare("UPDATE mk_sms_messages SET status = 'skipped', reason = 'cancelled', updated_at = ? WHERE campaign_id = ? AND status = 'queued'").run(now, id).changes;
    if (skipped) bumpC(ctx, id, "skipped_count", skipped);
    ctx.db.prepare("UPDATE mk_sms_campaigns SET status = 'cancelled', finished_at = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(now, id, ctx.organizationId);
    audit(ctx, "sms_campaign.cancelled", "sms_campaign", id, { skipped });
  });
}

// ---------- Rapport ----------
function smsCampaignReport(ctx, id) {
  const c = requireSmsCampaign(ctx, id);
  const pct = (n, d) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);
  const price = Number(c.price_per_segment);
  const reasons = ctx.db.prepare("SELECT status, reason, COUNT(*) n FROM mk_sms_messages WHERE campaign_id = ? AND status IN ('failed', 'skipped', 'undelivered') GROUP BY status, reason ORDER BY n DESC").all(id);
  const links = ctx.db.prepare("SELECT url, click_count FROM mk_sms_links WHERE campaign_id = ? ORDER BY click_count DESC, id").all(id);
  const queued = ctx.db.prepare("SELECT COUNT(*) n, MIN(next_attempt_at) next FROM mk_sms_messages WHERE campaign_id = ? AND status IN ('queued', 'sending')").get(id);
  return {
    campaign: c, queued: queued.n, nextAttemptAt: queued.next,
    rates: { delivery: pct(c.delivered_count, c.sent_count), click: pct(c.click_count, c.sent_count), unsubscribe: pct(c.unsubscribe_count, c.sent_count) },
    cost: c.price_per_segment !== "" && Number.isFinite(price) ? Math.round(c.segments_count * price * 100) / 100 : null,
    reasons, links,
  };
}

function smsRecipients(ctx, id, { limit = 100 } = {}) {
  requireSmsCampaign(ctx, id);
  return ctx.db
    .prepare(`SELECT m.id, m.contact_id, m.phone, m.status, m.reason, m.segments, m.sent_at, m.delivered_at, m.clicked_at, m.unsubscribed_at, c.email, c.first_name, c.last_name
              FROM mk_sms_messages m LEFT JOIN mk_contacts c ON c.id = m.contact_id AND c.organization_id = m.organization_id
              WHERE m.campaign_id = ? ORDER BY m.id LIMIT ?`)
    .all(id, Math.min(Math.max(Number(limit) || 100, 1), 1000));
}

// ---------- Tâche de la file ----------
function smsJobHandlers({ db, bus = null, settings, env = process.env, providerFor, now = Date.now, log = console, budgetMs = 20000 }) {
  return {
    "sms.dispatch": async ({ organizationId, campaignId }) => {
      const ctx = { db, organizationId, userId: null, bus, settings, baseUrl: env.SITE_URL, log, now };
      let provider;
      try {
        provider = providerFor ? providerFor(ctx) : createSmsProviderFor(ctx);
      } catch (error) {
        // Identifiants absents ou effacés depuis le lancement : la campagne passe en pause avec le message, rien n'est perdu
        ctx.db.prepare("UPDATE mk_sms_campaigns SET status = 'paused', error = ?, updated_at = datetime('now') WHERE id = ? AND organization_id = ? AND status IN ('scheduled', 'sending')")
          .run(String(error.message).slice(0, 500), campaignId, organizationId);
        return;
      }
      const started = now();
      for (;;) {
        const r = await dispatchSmsBatch(ctx, campaignId, { provider, now: now() });
        if (r.done || r.paused) return;
        const key = () => `sms_campaign:${campaignId}:tick:${now()}:${crypto.randomBytes(3).toString("hex")}`;
        if (r.waitMs > 0) { enqueueDispatch(ctx, campaignId, { runAt: now() + r.waitMs, key: key() }); return; }
        if (now() - started > budgetMs) { enqueueDispatch(ctx, campaignId, { runAt: now(), key: key() }); return; }
        await new Promise((resolve) => setImmediate(resolve));
      }
    },
  };
}

module.exports = {
  getSmsCampaign, requireSmsCampaign, createSmsCampaign, updateSmsCampaign, duplicateSmsCampaign, deleteSmsCampaign, listSmsCampaigns,
  smsAudienceSummary, estimateSmsCampaign, smsPreflight, startSmsCampaign, dispatchSmsBatch, pauseSmsCampaign, resumeSmsCampaign,
  cancelSmsCampaign, smsCampaignReport, smsRecipients, smsJobHandlers, smsCapacity,
};
