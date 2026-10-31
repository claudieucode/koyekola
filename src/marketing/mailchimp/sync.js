// Synchronisation Mailchimp ↔ Kolakisa. Règles de fond (testées) :
//  1. Kolakisa reste la source des CONSENTEMENTS et des SUPPRESSIONS : le plus restrictif gagne. Une synchronisation ne réabonne jamais une personne désinscrite, rebondie, plaignante ou
//     en liste de suppression côté Kolakisa (même si Mailchimp la dit « subscribed » : on pousse alors le désabonnement vers Mailchimp).
//  2. Pour tout le reste (nom, champs, tags, statut des campagnes, chiffres), Mailchimp fait autorité.
//  3. Un abonné Mailchimp devient « subscribed » ici avec une PREUVE : source « mailchimp » + texte indiquant l'audience d'origine (le consentement a été recueilli par Mailchimp).
//  4. « cleaned » (adresse invalide) → liste de suppression « bounced » ; « unsubscribed » → désinscription ; « pending » → contact sans consentement ; « archived »/« transactional » → ignorés.
//  5. Seules les audiences LIÉES à une liste Kolakisa échangent des contacts ; les autres ne sont que lues (effectif, statistiques).
//  6. Une désinscription de LA liste liée (portée « list ») bloque comme une désinscription générale : la personne n'est ni ajoutée à la liste ni laissée abonnée chez Mailchimp.
//  7. Les contacts nés d'une synchronisation n'émettent PAS les événements « abonné » / « ajouté à la liste » (sinon les séries de bienvenue de Kolakisa partiraient vers des personnes déjà abonnées).
//  8. Une personne effacée chez Kolakisa (droit à l'effacement) n'est jamais réimportée et est supprimée définitivement chez Mailchimp à la synchronisation suivante.
const { transaction } = require("../db/tx");
const { clientFor } = require("./connection");
const { MarketingError } = require("../errors");
const { validateEmail } = require("../audience/email");
const contacts = require("../audience/contacts");
const lists = require("../audience/lists");
const tags = require("../audience/tags");
const consent = require("../compliance/consent");
const suppression = require("../compliance/suppression");
const { md5 } = require("./operations");
const { audit } = require("../audience/shared");
const crypto = require("node:crypto");

const MEMBER_PAGE = 1000;
const MAX_PULL = 50000;
const MAX_PUSH = 2000;
const BATCH = 500;
const STALE_RUN_MINUTES = 30;
const isoUtc = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "+00:00");
const sqlNow = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

const audienceRow = (ctx, remoteId) => ctx.db.prepare("SELECT * FROM mk_mc_audiences WHERE organization_id = ? AND remote_id = ?").get(ctx.organizationId, remoteId);

// ---------- Liaison audience ↔ liste Kolakisa ----------
function linkAudience(ctx, remoteId, { localListId, create = false } = {}) {
  const row = audienceRow(ctx, remoteId);
  if (!row) throw new MarketingError("not_found", "Audience inconnue : lancez d'abord une synchronisation.");
  let listId = localListId;
  if (create) {
    // Nom déjà pris (ancienne liaison défaite, par exemple) : « … (2) », « … (3) »
    const base = `Mailchimp — ${row.name}`.slice(0, 90);
    for (let n = 1; n <= 20 && !Number.isInteger(listId); n++) {
      try { listId = lists.createList(ctx, { name: n === 1 ? base : `${base} (${n})`, description: "Liste liée à une audience Mailchimp." }).id; }
      catch (error) { if (!(error instanceof MarketingError) || error.code !== "duplicate") throw error; }
    }
  }
  if (!Number.isInteger(listId)) throw new MarketingError("invalid_field", "Choisissez une liste Kolakisa ou demandez sa création.");
  lists.requireList(ctx, listId);
  const taken = ctx.db.prepare("SELECT remote_id FROM mk_mc_audiences WHERE organization_id = ? AND local_list_id = ? AND remote_id <> ?").get(ctx.organizationId, listId, remoteId);
  if (taken) throw new MarketingError("already_linked", "Cette liste Kolakisa est déjà liée à une autre audience Mailchimp.");
  ctx.db.prepare("UPDATE mk_mc_audiences SET local_list_id = ?, members_cursor = '' WHERE organization_id = ? AND remote_id = ?").run(listId, ctx.organizationId, remoteId);
  audit(ctx, "mailchimp.audience_linked", "mailchimp", listId, { remoteId });
  return { remoteId, localListId: listId };
}
function unlinkAudience(ctx, remoteId) {
  if (!audienceRow(ctx, remoteId)) throw new MarketingError("not_found", "Audience inconnue.");
  ctx.db.prepare("UPDATE mk_mc_audiences SET local_list_id = NULL, members_cursor = '' WHERE organization_id = ? AND remote_id = ?").run(ctx.organizationId, remoteId);
  audit(ctx, "mailchimp.audience_unlinked", "mailchimp", null, { remoteId });
  return { remoteId };
}

// ---------- Audiences ----------
async function syncAudiences(ctx, client, summary) {
  const { items } = await client.collect("/lists", "lists", { query: { fields: "lists.id,lists.name,lists.stats,total_items" }, pageSize: 100, maxItems: 1000 });
  const upsert = ctx.db.prepare(`INSERT INTO mk_mc_audiences (organization_id, remote_id, name, member_count, unsubscribe_count, cleaned_count, open_rate, click_rate, stats, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (organization_id, remote_id) DO UPDATE SET name = excluded.name, member_count = excluded.member_count, unsubscribe_count = excluded.unsubscribe_count,
    cleaned_count = excluded.cleaned_count, open_rate = excluded.open_rate, click_rate = excluded.click_rate, stats = excluded.stats, synced_at = excluded.synced_at`);
  transaction(ctx.db, () => {
    for (const l of items) {
      const s = l.stats || {};
      upsert.run(ctx.organizationId, String(l.id), String(l.name || "").slice(0, 200), num(s.member_count), num(s.unsubscribe_count), num(s.cleaned_count), num(s.open_rate), num(s.click_rate), JSON.stringify(s).slice(0, 4000), sqlNow());
    }
    const ids = items.map((l) => String(l.id));
    const known = ctx.db.prepare("SELECT remote_id FROM mk_mc_audiences WHERE organization_id = ?").all(ctx.organizationId);
    for (const k of known) if (!ids.includes(k.remote_id)) { ctx.db.prepare("DELETE FROM mk_mc_audiences WHERE organization_id = ? AND remote_id = ?").run(ctx.organizationId, k.remote_id); summary.audiencesRemoved++; }
  });
  summary.audiences = items.length;
}

// ---------- Membres : Mailchimp → Kolakisa ----------
const sha = (email) => crypto.createHash("sha256").update(String(email).toLowerCase()).digest("hex");
const RESTRICTED = ["unsubscribed", "bounced", "complained", "suppressed"];
// Désinscrit de LA liste liée (portée « list »)
const listBlocked = (ctx, contactId, listId) => Boolean(listId && ctx.db.prepare("SELECT 1 FROM mk_unsubscribes WHERE organization_id = ? AND contact_id = ? AND scope = 'list' AND list_id = ?").get(ctx.organizationId, contactId, listId));

// → { action, pushUnsubscribe? } ; ne lève jamais pour un membre mal formé (compté « ignoré »)
function applyRemoteMember(ctx, audience, m) {
  const check = validateEmail(m.email_address);
  if (!check.ok) return { action: "invalid" };
  const email = check.email;
  const status = String(m.status || "");
  if (ctx.db.prepare("SELECT 1 FROM mk_mc_erased WHERE organization_id = ? AND email_hash = ?").get(ctx.organizationId, sha(email))) return { action: "erased", eraseRemote: email };
  const merge = m.merge_fields || {};
  const names = { first_name: String(merge.FNAME || "").slice(0, 100), last_name: String(merge.LNAME || "").slice(0, 100) };
  const quiet = { ...ctx, bus: null }; // création, consentement et ajout à la liste ne déclenchent aucun parcours de bienvenue (règle 7)
  const existing = contacts.findByEmail(ctx, email);
  const origin = `Mailchimp « ${audience.name} »`;
  const mirror = (contact) => ctx.db.prepare(`INSERT INTO mk_mc_members (organization_id, audience_remote_id, contact_id, subscriber_hash, mc_status, synced_at) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (organization_id, audience_remote_id, contact_id) DO UPDATE SET subscriber_hash = excluded.subscriber_hash, mc_status = excluded.mc_status, synced_at = excluded.synced_at`)
    .run(ctx.organizationId, audience.remote_id, contact.id, md5(email), status, sqlNow());

  if (status === "archived" || status === "transactional" || !status) return { action: "skipped" };

  if (status === "cleaned") {
    suppression.addSuppression(ctx, { email, reason: "bounced", note: `Adresse invalide signalée par ${origin} (cleaned)` });
    const c = contacts.findByEmail(ctx, email);
    if (c) mirror(c);
    return { action: "suppressed" };
  }

  const { contact, created } = existing ? { contact: existing, created: false } : contacts.upsertContact(quiet, { email, source: "mailchimp", ...names });
  if (existing) {
    const fill = {};
    for (const [k, v] of Object.entries(names)) if (v && !existing[k]) fill[k] = v;
    if (Object.keys(fill).length) contacts.updateContact(ctx, existing.id, fill);
  }
  for (const t of Array.isArray(m.tags) ? m.tags : []) { const name = String(t && t.name || "").trim(); if (name) { try { tags.tagContact(quiet, contact.id, name); } catch { /* étiquette invalide : ignorée */ } } }

  if (status === "unsubscribed") {
    consent.unsubscribe(ctx, contact.id, { source: "mailchimp" });
    mirror(contact);
    return { action: "unsubscribed", created };
  }
  if (status === "pending") { mirror(contact); return { action: "pending", created }; }

  // subscribed — le plus restrictif gagne
  const fresh = contacts.getContact(ctx, contact.id);
  if (RESTRICTED.includes(fresh.status) || listBlocked(ctx, contact.id, audience.local_list_id)) {
    mirror(fresh);
    return { action: "conflict", pushUnsubscribe: email };
  }
  const result = consent.recordConsent(quiet, contact.id, { source: "mailchimp", textShown: `Abonné dans l'audience ${origin} : consentement recueilli par Mailchimp, importé dans Kolakisa.` });
  if (!result.ok) { mirror(fresh); return { action: "conflict", pushUnsubscribe: email }; }
  if (audience.local_list_id) lists.addToList(quiet, audience.local_list_id, [contact.id]);
  mirror(contact);
  return { action: created ? "created" : "subscribed", created };
}

const tick = () => new Promise((resolve) => setImmediate(resolve)); // rend la main au reste du site entre deux lots (node:sqlite est synchrone)

// Lit les membres modifiés depuis le curseur, du plus ancien au plus récent. → { pushUnsub, eraseRemote, cursor, complete }
async function pullMembers(ctx, client, audience, { full }, summary) {
  const started = Date.now();
  const since = !full && audience.members_cursor ? audience.members_cursor : undefined;
  const { items, truncated } = await client.collect(`/lists/${audience.remote_id}/members`, "members", {
    query: { fields: "members.id,members.email_address,members.status,members.merge_fields,members.tags,members.last_changed,total_items", sort_field: "last_changed", sort_dir: "ASC", ...(since ? { since_last_changed: since } : {}) },
    pageSize: MEMBER_PAGE, maxItems: (ctx.limits && ctx.limits.maxPull) || MAX_PULL, // plafond réglable pour les tests
  });
  const pushUnsub = [], eraseRemote = [];
  for (let i = 0; i < items.length; i += 200) {
    transaction(ctx.db, () => {
      for (const m of items.slice(i, i + 200)) {
        let r;
        try { r = applyRemoteMember(ctx, audience, m); } catch (error) { summary.memberErrors++; if (summary.errors.length < 10) summary.errors.push(`Contact ignoré (${error.code || "erreur"}) : ${String(error.message).slice(0, 120)}`); continue; }
        summary.pulled++;
        if (r.action === "created") summary.created++;
        else if (r.action === "subscribed") summary.subscribed++;
        else if (r.action === "unsubscribed") summary.unsubscribed++;
        else if (r.action === "suppressed") summary.suppressed++;
        else if (r.action === "conflict") summary.conflicts++;
        else summary.skipped++;
        if (r.pushUnsubscribe) pushUnsub.push(r.pushUnsubscribe);
        if (r.eraseRemote) eraseRemote.push(r.eraseRemote);
      }
    });
    await tick();
  }
  // Lecture tronquée (plus de MAX_PULL membres) : le curseur avance jusqu'au dernier membre lu, la synchronisation suivante reprend à cet endroit (rien n'est sauté, rien n'est relu en boucle)
  let cursor;
  if (truncated && items.length) { const last = Date.parse(items[items.length - 1].last_changed); cursor = Number.isFinite(last) ? isoUtc(last - 1000) : undefined; summary.truncated = true; }
  else cursor = isoUtc(started - 60000);
  return { pushUnsub, eraseRemote, cursor, complete: !truncated };
}

// ---------- Membres : Kolakisa → Mailchimp ----------
// → { complete } : faux si le plafond d'envoi a laissé des contacts pour la prochaine passe
async function pushToMailchimp(ctx, client, audience, extraUnsub, summary) {
  const rows = ctx.db.prepare(`SELECT c.id, c.email, c.first_name, c.last_name, c.status, m.mc_status,
      EXISTS (SELECT 1 FROM mk_unsubscribes u WHERE u.organization_id = lm.organization_id AND u.contact_id = c.id AND u.scope = 'list' AND u.list_id = lm.list_id) AS list_unsub
    FROM mk_list_members lm JOIN mk_contacts c ON c.id = lm.contact_id AND c.organization_id = lm.organization_id
    LEFT JOIN mk_mc_members m ON m.organization_id = lm.organization_id AND m.contact_id = c.id AND m.audience_remote_id = ?
    WHERE lm.organization_id = ? AND lm.list_id = ?`).all(audience.remote_id, ctx.organizationId, audience.local_list_id);
  const subscribe = [], unsubscribe = new Map();
  for (const r of rows) {
    const blocked = RESTRICTED.includes(r.status) || Boolean(r.list_unsub);
    if (!blocked && r.status === "subscribed" && !r.mc_status && consent.isSendable(ctx, r.id, { listId: audience.local_list_id }).ok) {
      subscribe.push({ email_address: r.email, status: "subscribed", merge_fields: { ...(r.first_name ? { FNAME: r.first_name } : {}), ...(r.last_name ? { LNAME: r.last_name } : {}) } });
    } else if (blocked && (r.mc_status === "subscribed" || r.mc_status === "pending")) {
      unsubscribe.set(r.email, { email_address: r.email, status: "unsubscribed" });
    }
  }
  for (const email of extraUnsub) unsubscribe.set(email, { email_address: email, status: "unsubscribed" });
  let complete = true;
  const stamp = ctx.db.prepare(`INSERT INTO mk_mc_members (organization_id, audience_remote_id, contact_id, subscriber_hash, mc_status, synced_at) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (organization_id, audience_remote_id, contact_id) DO UPDATE SET mc_status = excluded.mc_status, synced_at = excluded.synced_at`);
  const run = async (members, updateExisting, counterKey) => {
    for (let i = 0; i < Math.min(members.length, MAX_PUSH); i += BATCH) {
      const chunk = members.slice(i, i + BATCH);
      const res = await client.post(`/lists/${audience.remote_id}`, { members: chunk, update_existing: updateExisting, sync_tags: false }, { timeout: 120000 });
      const failed = new Set((res && res.errors || []).map((e) => String(e.email_address || "").toLowerCase()));
      summary[counterKey] += chunk.length - failed.size;
      summary.pushErrors += failed.size;
      for (const e of (res && res.errors || []).slice(0, 5)) if (summary.errors.length < 10) summary.errors.push(`Envoi vers Mailchimp refusé pour une adresse (${String(e.error_code || "erreur")}).`);
      for (const m of chunk) {
        const c = contacts.findByEmail(ctx, m.email_address);
        if (!c) continue;
        // Refus définitif (déjà membre archivé, état de conformité…) : on s'en souvient pour ne pas le retenter à chaque passe et ne pas bloquer les suivants
        stamp.run(ctx.organizationId, audience.remote_id, c.id, md5(m.email_address), failed.has(m.email_address.toLowerCase()) ? "refused" : m.status, sqlNow());
      }
    }
    if (members.length > MAX_PUSH) { summary.truncated = true; complete = false; }
  };
  if (subscribe.length) await run(subscribe, false, "pushedSubscribe");
  if (unsubscribe.size) await run([...unsubscribe.values()], true, "pushedUnsubscribe");
  return { complete };
}

// ---------- Effacement : suppression définitive chez Mailchimp ----------
async function purgeErased(ctx, client, summary) {
  const rows = ctx.db.prepare("SELECT email_hash, mc_hash FROM mk_mc_erased WHERE organization_id = ?").all(ctx.organizationId);
  if (!rows.length) return;
  const audiences = ctx.db.prepare("SELECT remote_id FROM mk_mc_audiences WHERE organization_id = ?").all(ctx.organizationId);
  for (const row of rows) {
    let clean = true;
    for (const a of audiences) {
      try { await client.post(`/lists/${a.remote_id}/members/${row.mc_hash}/actions/delete-permanent`, {}); summary.erased++; }
      catch (error) { if (error.code !== "not_found") { clean = false; if (summary.errors.length < 10) summary.errors.push(`Suppression définitive d'une personne effacée impossible : ${error.message}`); } }
    }
    if (clean) ctx.db.prepare("DELETE FROM mk_mc_erased WHERE organization_id = ? AND email_hash = ?").run(ctx.organizationId, row.email_hash);
  }
}

// ---------- Campagnes ----------
async function syncCampaigns(ctx, client, summary) {
  const { items } = await client.collect("/campaigns", "campaigns", {
    query: { fields: "campaigns.id,campaigns.type,campaigns.status,campaigns.send_time,campaigns.emails_sent,campaigns.settings.title,campaigns.settings.subject_line,campaigns.recipients.list_id,total_items", sort_field: "create_time", sort_dir: "DESC" },
    pageSize: 200, maxItems: 1000,
  });
  const upsert = ctx.db.prepare(`INSERT INTO mk_mc_campaigns (organization_id, remote_id, type, status, title, subject, audience_remote_id, send_time, emails_sent, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (organization_id, remote_id) DO UPDATE SET type = excluded.type, status = excluded.status, title = excluded.title, subject = excluded.subject,
    audience_remote_id = excluded.audience_remote_id, send_time = excluded.send_time, emails_sent = excluded.emails_sent, synced_at = excluded.synced_at`);
  transaction(ctx.db, () => {
    for (const c of items) upsert.run(ctx.organizationId, String(c.id), String(c.type || ""), String(c.status || ""), String(c.settings && c.settings.title || "").slice(0, 200), String(c.settings && c.settings.subject_line || "").slice(0, 300),
      String(c.recipients && c.recipients.list_id || ""), c.send_time || null, num(c.emails_sent), sqlNow());
  });
  summary.campaigns = items.length;
  // Chiffres : campagnes envoyées dans les 7 derniers jours, plus celles dont le rapport n'a jamais été lu
  const due = ctx.db.prepare(`SELECT remote_id FROM mk_mc_campaigns WHERE organization_id = ? AND status = 'sent' AND (report_synced_at IS NULL OR send_time >= datetime('now', '-7 days')) ORDER BY send_time DESC LIMIT 50`).all(ctx.organizationId);
  for (const row of due) {
    try {
      const r = await client.get(`/reports/${row.remote_id}`, { fields: "emails_sent,opens,clicks,bounces,unsubscribed,abuse_reports,ecommerce,send_time" });
      const report = { emailsSent: num(r.emails_sent), opens: num(r.opens && r.opens.unique_opens), openRate: num(r.opens && r.opens.open_rate), clicks: num(r.clicks && r.clicks.unique_clicks), clickRate: num(r.clicks && r.clicks.click_rate),
        hardBounces: num(r.bounces && r.bounces.hard_bounces), softBounces: num(r.bounces && r.bounces.soft_bounces), unsubscribed: num(r.unsubscribed), abuse: num(r.abuse_reports), revenue: num(r.ecommerce && r.ecommerce.total_revenue) };
      ctx.db.prepare("UPDATE mk_mc_campaigns SET report = ?, report_synced_at = ?, emails_sent = ? WHERE organization_id = ? AND remote_id = ?").run(JSON.stringify(report), sqlNow(), report.emailsSent, ctx.organizationId, row.remote_id);
      summary.reports++;
    } catch (error) { if (error.code === "not_found") continue; throw error; }
  }
}

const fresh = () => ({ erased: 0, audiences: 0, audiencesRemoved: 0, campaigns: 0, reports: 0, pulled: 0, created: 0, subscribed: 0, unsubscribed: 0, suppressed: 0, conflicts: 0, skipped: 0, pushedSubscribe: 0, pushedUnsubscribe: 0, pushErrors: 0, memberErrors: 0, truncated: false, errors: [] });

// Synchronisation complète d'une organisation. `full` : relit tous les membres (sinon seulement ceux modifiés depuis la dernière fois).
async function syncAll(ctx, { full = false } = {}) {
  const org = ctx.organizationId;
  const state = ctx.db.prepare("SELECT running_since FROM mk_mc_state WHERE organization_id = ?").get(org);
  if (state && state.running_since && Date.now() - Date.parse(`${state.running_since.replace(" ", "T")}Z`) < STALE_RUN_MINUTES * 60000) return { skipped: "already_running" };
  ctx.db.prepare("INSERT INTO mk_mc_state (organization_id, running_since) VALUES (?, ?) ON CONFLICT (organization_id) DO UPDATE SET running_since = excluded.running_since").run(org, sqlNow());
  const summary = fresh();
  let fatal = "";
  try {
    const client = clientFor(ctx);
    await syncAudiences(ctx, client, summary);
    await purgeErased(ctx, client, summary);
    for (const audience of ctx.db.prepare("SELECT * FROM mk_mc_audiences WHERE organization_id = ? AND local_list_id IS NOT NULL").all(org)) {
      try {
        const pulled = await pullMembers(ctx, client, audience, { full }, summary);
        const pushed = await pushToMailchimp(ctx, client, audienceRow(ctx, audience.remote_id), pulled.pushUnsub, summary);
        // Le curseur n'avance qu'une fois TOUT poussé : un désabonnement non envoyé sera détecté de nouveau à la passe suivante
        if (pushed.complete && pulled.cursor) ctx.db.prepare("UPDATE mk_mc_audiences SET members_cursor = ? WHERE organization_id = ? AND remote_id = ?").run(pulled.cursor, org, audience.remote_id);
      } catch (error) {
        if (error.code === "auth_invalid" || error.code === "not_connected") throw error;
        if (summary.errors.length < 10) summary.errors.push(`Audience « ${audience.name} » : ${error.message}`);
      }
    }
    await syncCampaigns(ctx, client, summary);
  } catch (error) { fatal = error.message; }
  const status = fatal ? "error" : summary.errors.length || summary.memberErrors ? "partial" : "ok";
  ctx.db.prepare(`UPDATE mk_mc_state SET running_since = NULL, last_sync_at = ?, last_sync_status = ?, last_sync_summary = ?, last_error = ? WHERE organization_id = ?`).run(sqlNow(), status, JSON.stringify(summary), fatal.slice(0, 500), org);
  audit(ctx, "mailchimp.synced", "mailchimp", null, { status, pulled: summary.pulled, pushed: summary.pushedSubscribe + summary.pushedUnsubscribe });
  return { status, summary, error: fatal || undefined };
}

function state(ctx) {
  const row = ctx.db.prepare("SELECT * FROM mk_mc_state WHERE organization_id = ?").get(ctx.organizationId);
  if (!row) return { lastSyncAt: null, status: "never", summary: null, error: "", running: false };
  let summary = null; try { summary = JSON.parse(row.last_sync_summary || "{}"); } catch { summary = null; }
  return { lastSyncAt: row.last_sync_at, status: row.last_sync_status || "never", summary, error: row.last_error || "", running: Boolean(row.running_since) };
}

module.exports = { syncAll, state, linkAudience, unlinkAudience, applyRemoteMember, pushToMailchimp, audienceRow, isoUtc, listBlocked, sha, RESTRICTED };
