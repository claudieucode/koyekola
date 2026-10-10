// Diagnostic d'un événement (palier 19) : « que s'est-il passé après cet événement ? » — LECTURE SEULE, limité au site de l'équipe, e-mail masqué, aucun secret.
// Répond à : quels scénarios actifs l'écoutent, lequel aurait démarré (et pourquoi pas), quels passages sont nés de cet événement, quels e-mails en sont partis.
const { MarketingError } = require("../errors");
const { siteSql } = require("../audience/shared");
const { maskEmail } = require("../contactcore");

const SECRET = /pass|token|secret|key|card|cvv|iban|authorization/i;
const safeMetadata = (raw) => {
  let md = {};
  try { md = JSON.parse(raw); } catch { md = {}; }
  return Object.fromEntries(Object.entries(md).filter(([k, v]) => !SECRET.test(k) && v !== null && typeof v !== "object").map(([k, v]) => [k, String(v).slice(0, 200)]));
};

function load(ctx, eventId) {
  const scope = siteSql(ctx, "e");
  const row = Number.isInteger(eventId) ? ctx.db.prepare(`SELECT e.* FROM mk_events e WHERE e.id = ? AND e.organization_id = ? AND ${scope.sql}`).get(eventId, ctx.organizationId, ...scope.params) : null;
  if (!row) throw new MarketingError("not_found", "Événement introuvable.");
  return row;
}

// Pourquoi un scénario actif démarrerait ou non pour cet événement (mêmes règles que engine.onEvent, sans rien écrire)
function verdicts(ctx, row, md) {
  const out = [];
  const autos = ctx.db.prepare(`SELECT DISTINCT a.id, a.name, a.site_id, a.triggers, a.goal_event FROM mk_automations a, json_each(a.triggers) t
    WHERE a.organization_id = ? AND a.status = 'active' AND a.active_steps <> '' AND json_extract(t.value, '$.event') = ?`).all(ctx.organizationId, row.name);
  for (const a of autos) {
    const matched = JSON.parse(a.triggers || "[]").find((t) => t.event === row.name);
    const filter = matched && matched.filter ? matched.filter : {};
    let verdict = "démarrerait", reason = "";
    if (!row.contact_id) { verdict = "ignoré"; reason = "événement sans contact"; }
    else if (filter.key && String(md[filter.key]) !== String(filter.value)) { verdict = "ignoré"; reason = `filtre du déclencheur non satisfait (${filter.key})`; }
    else if (Number.isInteger(a.site_id) && a.site_id !== row.site_id
      && !ctx.db.prepare("SELECT 1 FROM mk_contacts WHERE id = ? AND organization_id = ? AND origin_site_id = ?").get(row.contact_id, ctx.organizationId, a.site_id)
      && !ctx.db.prepare("SELECT 1 FROM mk_events WHERE organization_id = ? AND contact_id = ? AND site_id = ? LIMIT 1").get(ctx.organizationId, row.contact_id, a.site_id)) { verdict = "ignoré"; reason = "le contact n'appartient pas au site de ce scénario"; }
    else if (ctx.db.prepare("SELECT 1 FROM mk_automation_runs WHERE automation_id = ? AND contact_id = ?").get(a.id, row.contact_id)) { verdict = "déjà passé"; reason = "ce contact est déjà passé dans ce scénario (un seul passage)"; }
    out.push({ automationId: a.id, name: a.name, verdict, reason });
  }
  return out;
}

function traceEvent(ctx, eventId) {
  const row = load(ctx, eventId);
  const md = safeMetadata(row.metadata);
  const runs = ctx.db.prepare(`SELECT r.id, r.automation_id, a.name, r.status, r.step_index, r.entered_at, r.finished_at, r.last_error
    FROM mk_automation_runs r JOIN mk_automations a ON a.id = r.automation_id WHERE r.organization_id = ? AND r.trigger_event_id = ? ORDER BY r.id`).all(ctx.organizationId, row.id);
  for (const r of runs) r.log = ctx.db.prepare("SELECT step_index, action, detail, at FROM mk_automation_log WHERE run_id = ? ORDER BY id LIMIT 50").all(r.id);
  const messages = runs.length ? ctx.db.prepare(`SELECT m.id, m.status, m.subject, m.sent_at, m.first_open_at, m.first_click_at, m.unsubscribed_at, m.campaign_id FROM mk_messages m JOIN mk_campaigns c ON c.id = m.campaign_id
    WHERE m.organization_id = ? AND m.contact_id = ? AND c.automation_id IN (${runs.map(() => "?").join(",")}) ORDER BY m.id LIMIT 20`).all(ctx.organizationId, row.contact_id, ...runs.map((r) => r.automation_id)) : [];
  return {
    event: { id: row.id, name: row.name, source: row.source, occurredAt: row.occurred_at, processedAt: row.processed_at, siteId: row.site_id, objectType: row.object_type, objectId: row.object_id, email: maskEmail(row.email || ""), metadata: md },
    matches: verdicts(ctx, row, md), runs, messages,
  };
}

// Simulation : « si cet événement arrivait maintenant, que se passerait-il ? » — n'écrit rien et n'envoie rien
const previewEvent = (ctx, eventId) => { const t = traceEvent(ctx, eventId); return { event: t.event, matches: t.matches, notice: "Simulation : rien n'a été démarré ni envoyé." }; };

module.exports = { traceEvent, previewEvent, safeMetadata };
