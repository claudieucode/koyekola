// Webhooks ENTRANTS de Mailchimp. Mailchimp ne signe pas ses webhooks : l'adresse porte un jeton secret par organisation (comparé à temps constant), les événements concernent
// uniquement des audiences connues, et chaque événement est enregistré (charge complète) avant d'être appliqué, de façon idempotente, puis peut être rejoué.
const crypto = require("node:crypto");
const { transaction } = require("../db/tx");
const { MarketingError } = require("../errors");
const { validateEmail } = require("../audience/email");
const contacts = require("../audience/contacts");
const consent = require("../compliance/consent");
const suppression = require("../compliance/suppression");
const { applyRemoteMember, audienceRow } = require("./sync");
const { md5 } = require("./operations");

const TYPES = ["subscribe", "unsubscribe", "profile", "cleaned", "upemail", "campaign"];
const MAX_BODY = 64 * 1024;
const RETENTION_DAYS = 90;
const FORBIDDEN = new Set(["__proto__", "constructor", "prototype"]);
const sqlNow = () => new Date().toISOString().slice(0, 19).replace("T", " ");

// « data[merges][FNAME]=Ana » → { data: { merges: { FNAME: "Ana" } } } (clés dangereuses refusées, profondeur et taille bornées)
function parseForm(raw) {
  const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw || "");
  if (text.length > MAX_BODY) throw new MarketingError("too_large", "Corps trop volumineux.");
  const out = Object.create(null);
  for (const [key, value] of new URLSearchParams(text)) {
    const parts = key.split(/\]\[|\[|\]/).filter((p) => p !== "");
    if (!parts.length || parts.length > 5 || parts.some((p) => FORBIDDEN.has(p) || p.length > 60)) continue;
    let node = out;
    parts.slice(0, -1).forEach((p) => { if (typeof node[p] !== "object" || node[p] === null) node[p] = Object.create(null); node = node[p]; });
    node[parts[parts.length - 1]] = String(value).slice(0, 2000);
  }
  return JSON.parse(JSON.stringify(out));
}

const keyOf = (orgId, p) => crypto.createHash("sha256").update([orgId, p.type, p.fired_at, p.data && p.data.list_id, p.data && (p.data.email || p.data.new_email || p.data.id), p.data && p.data.old_email, p.data && p.data.action].join("|")).digest("hex");

// Enregistre l'événement ; { duplicate: true } si déjà reçu. Ne lève pas pour un type inconnu : il est enregistré « ignored ».
function record(ctx, payload) {
  const type = String(payload.type || "");
  const data = payload.data && typeof payload.data === "object" ? payload.data : {};
  const email = String(data.email || data.new_email || "").toLowerCase().slice(0, 254);
  const dedupe = keyOf(ctx.organizationId, payload);
  const info = ctx.db.prepare(`INSERT OR IGNORE INTO mk_mc_events (organization_id, event_type, audience_remote_id, email, fired_at, payload, dedupe_key, status, detail)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(ctx.organizationId, type.slice(0, 30), String(data.list_id || "").slice(0, 30), email, String(payload.fired_at || "").slice(0, 30), JSON.stringify(payload).slice(0, 16000), dedupe,
    TYPES.includes(type) ? "received" : "ignored", TYPES.includes(type) ? "" : "Type d'événement non géré.");
  if (!info.changes) return { duplicate: true };
  if (Number(info.lastInsertRowid) % 50 === 0) ctx.db.prepare("DELETE FROM mk_mc_events WHERE organization_id = ? AND received_at < datetime('now', ?)").run(ctx.organizationId, `-${RETENTION_DAYS} days`);
  return { duplicate: false, id: Number(info.lastInsertRowid), type };
}

async function pushUnsubscribe(ctx, audienceId, email) {
  const { clientFor } = require("./connection");
  await clientFor(ctx).request("PATCH", `/lists/${audienceId}/members/${md5(email)}`, { body: { status: "unsubscribed" } });
}

// Applique l'événement enregistré → { status: "applied"|"ignored", detail }
async function apply(ctx, payload) {
  const type = String(payload.type || "");
  const data = payload.data || {};
  if (type === "campaign") {
    const id = String(data.id || "");
    if (!/^[A-Za-z0-9]{4,20}$/.test(id)) return { status: "ignored", detail: "Identifiant de campagne invalide." };
    const done = ctx.db.prepare("UPDATE mk_mc_campaigns SET status = ?, subject = CASE WHEN ? <> '' THEN ? ELSE subject END, report_synced_at = NULL, synced_at = ? WHERE organization_id = ? AND remote_id = ?")
      .run(String(data.status || "").slice(0, 20), String(data.subject || "").slice(0, 300), String(data.subject || "").slice(0, 300), sqlNow(), ctx.organizationId, id).changes;
    return done ? { status: "applied", detail: "Statut de campagne mis à jour." } : { status: "ignored", detail: "Campagne inconnue : elle sera lue à la prochaine synchronisation." };
  }
  const audience = audienceRow(ctx, String(data.list_id || ""));
  if (!audience) return { status: "ignored", detail: "Audience inconnue de Kolakisa (synchronisez d'abord les audiences)." };

  if (type === "upemail") {
    const oldE = validateEmail(data.old_email), newE = validateEmail(data.new_email);
    if (!oldE.ok || !newE.ok) return { status: "ignored", detail: "Adresses invalides." };
    const oldContact = contacts.findByEmail(ctx, oldE.email);
    const merges = {}; if (oldContact) { merges.FNAME = oldContact.first_name; merges.LNAME = oldContact.last_name; }
    const r = applyRemoteMember(ctx, audience, { email_address: newE.email, status: "subscribed", merge_fields: merges });
    if (oldContact && !["conflict"].includes(r.action)) consent.unsubscribe(ctx, oldContact.id, { source: "mailchimp" });
    return { status: "applied", detail: "Nouvelle adresse enregistrée ; l'ancienne est désinscrite." };
  }
  const check = validateEmail(data.email);
  if (!check.ok) return { status: "ignored", detail: "Adresse e-mail invalide." };
  const email = check.email;

  if (type === "profile") {
    const c = contacts.findByEmail(ctx, email);
    const m = data.merges || {};
    if (!c) return { status: "ignored", detail: "Contact inconnu de Kolakisa." };
    contacts.updateContact(ctx, c.id, { first_name: String(m.FNAME || "").slice(0, 100), last_name: String(m.LNAME || "").slice(0, 100) });
    return { status: "applied", detail: "Profil mis à jour." };
  }
  if (type === "cleaned") {
    suppression.addSuppression(ctx, { email, reason: data.reason === "abuse" ? "complained" : "bounced", note: `Mailchimp (${String(data.reason || "cleaned").slice(0, 20)})` });
    const c = contacts.findByEmail(ctx, email);
    if (c) ctx.db.prepare(`INSERT INTO mk_mc_members (organization_id, audience_remote_id, contact_id, subscriber_hash, mc_status, synced_at) VALUES (?, ?, ?, ?, 'cleaned', ?)
      ON CONFLICT (organization_id, audience_remote_id, contact_id) DO UPDATE SET mc_status = 'cleaned', synced_at = excluded.synced_at`).run(ctx.organizationId, audience.remote_id, c.id, md5(email), sqlNow());
    return { status: "applied", detail: "Adresse placée en liste de suppression." };
  }
  // subscribe | unsubscribe
  const r = applyRemoteMember(ctx, audience, { email_address: email, status: type === "subscribe" ? "subscribed" : "unsubscribed", merge_fields: data.merges || {} });
  if (r.action === "conflict") {
    try { await pushUnsubscribe(ctx, audience.remote_id, email); return { status: "applied", detail: "Conflit : cette personne est désinscrite ou supprimée dans Kolakisa. Son désabonnement a été renvoyé à Mailchimp." }; }
    catch { return { status: "applied", detail: "Conflit : cette personne est désinscrite ou supprimée dans Kolakisa. Le désabonnement sera renvoyé à Mailchimp à la prochaine synchronisation." }; }
  }
  return { status: "applied", detail: type === "subscribe" ? "Abonnement enregistré." : "Désinscription enregistrée." };
}

async function process(ctx, id) {
  const row = ctx.db.prepare("SELECT * FROM mk_mc_events WHERE organization_id = ? AND id = ?").get(ctx.organizationId, id);
  if (!row) throw new MarketingError("not_found", "Événement introuvable.");
  if (row.status === "ignored" && !TYPES.includes(row.event_type)) return { status: "ignored", detail: row.detail };
  let result;
  try {
    const payload = JSON.parse(row.payload);
    result = await apply(ctx, payload);
  } catch (error) { result = { status: "failed", detail: String(error.message || "Erreur").slice(0, 300) }; }
  ctx.db.prepare("UPDATE mk_mc_events SET status = ?, detail = ?, processed_at = ? WHERE id = ?").run(result.status, result.detail, sqlNow(), id);
  return result;
}

// Réception complète d'une requête déjà authentifiée par jeton
async function receive(ctx, raw) {
  const payload = parseForm(raw);
  if (!payload.type) return { ok: true, ignored: true };
  const rec = record(ctx, payload);
  if (rec.duplicate) return { ok: true, duplicate: true };
  if (!TYPES.includes(rec.type)) return { ok: true, ignored: true };
  const result = await process(ctx, rec.id);
  return { ok: true, id: rec.id, status: result.status };
}

async function replay(ctx, id) {
  const row = ctx.db.prepare("SELECT id FROM mk_mc_events WHERE organization_id = ? AND id = ?").get(ctx.organizationId, id);
  if (!row) throw new MarketingError("not_found", "Événement introuvable.");
  ctx.db.prepare("UPDATE mk_mc_events SET replays = replays + 1 WHERE id = ?").run(id);
  return process(ctx, id);
}

function list(ctx, { afterId = 0, limit = 50, type, status } = {}) {
  const where = ["organization_id = ?"], params = [ctx.organizationId];
  if (Number.isInteger(afterId) && afterId > 0) { where.push("id > ?"); params.push(afterId); }
  if (type && TYPES.includes(type)) { where.push("event_type = ?"); params.push(type); }
  if (status && ["received", "applied", "ignored", "failed"].includes(status)) { where.push("status = ?"); params.push(status); }
  const rows = ctx.db.prepare(`SELECT id, event_type AS type, audience_remote_id AS audience, email, fired_at AS firedAt, status, detail, replays, received_at AS receivedAt, processed_at AS processedAt, payload
    FROM mk_mc_events WHERE ${where.join(" AND ")} ORDER BY id ${afterId ? "ASC" : "DESC"} LIMIT ?`).all(...params, Math.min(Math.max(Number(limit) || 50, 1), 200));
  return rows.map((r) => ({ ...r, payload: (() => { try { return JSON.parse(r.payload); } catch { return {}; } })() }));
}

// Crée (ou retrouve) le webhook Mailchimp d'une audience pointant vers CETTE installation. Sources « user » et « admin » seulement : nos propres écritures par l'API ne reviennent pas en boucle.
async function install(ctx, audienceId, env = process.env) {
  const { clientFor, webhookUrl } = require("./connection");
  const url = webhookUrl(ctx, env);
  if (!url) throw new MarketingError("webhook_url", "Adresse publique indisponible : la variable SITE_URL (HTTPS) doit être définie sur le serveur pour que Mailchimp puisse joindre Kolakisa.");
  if (!audienceRow(ctx, audienceId)) throw new MarketingError("not_found", "Audience inconnue : lancez d'abord une synchronisation.");
  const client = clientFor(ctx);
  const existing = await client.get(`/lists/${audienceId}/webhooks`);
  const mine = (existing.webhooks || []).find((w) => w.url === url);
  const body = { url, events: { subscribe: true, unsubscribe: true, profile: true, cleaned: true, upemail: true, campaign: true }, sources: { user: true, admin: true, api: false } };
  const hook = mine ? await client.patch(`/lists/${audienceId}/webhooks/${mine.id}`, body) : await client.post(`/lists/${audienceId}/webhooks`, body);
  ctx.db.prepare("UPDATE mk_mc_audiences SET webhook_remote_id = ? WHERE organization_id = ? AND remote_id = ?").run(String(hook.id), ctx.organizationId, audienceId);
  return { id: String(hook.id), created: !mine };
}

module.exports = { TYPES, parseForm, record, process, receive, replay, list, install, apply };
