// Détection des abandons (palier 19) — jamais déduits d'une absence immédiate : il faut un DÉLAI réel sans aucune activité, réglable (Paramètres → Tunnels).
//  - funnel.abandoned : le contact a atteint une étape d'un tunnel actif, ne l'a pas terminé et n'est pas revenu depuis N heures (24 h par défaut). Une fois par contact et par tunnel.
//  - checkout.abandoned : « page de commande ouverte » (lms.checkout_started) sans commande terminée (lms.order_completed) depuis N heures (1 h par défaut). Une fois par ouverture.
// Ces événements sont DÉRIVÉS d'événements réels déjà dans le journal du Contact Core ; le moteur d'automatisation décide ensuite quoi en faire.
// Exécutée par la tâche récurrente du pont (queue existante) ; relançable à la main depuis Événements (diagnostic).
const { emit } = require("../audience/shared");

const HOUR = 3600000;
const DEFAULTS = { funnel: 24, checkout: 1 };
function hoursSetting(ctx, key, fallback) {
  try {
    const row = ctx.db.prepare("SELECT value FROM mk_settings WHERE organization_id = ? AND key = ?").get(ctx.organizationId, `cms.${key}`);
    const n = Number(row && row.value);
    return Number.isInteger(n) && n >= 1 ? n : fallback;
  } catch { return fallback; }
}

function sweep(ctx, { now = Date.now(), funnelHours, checkoutHours, limit = 500 } = {}) {
  if (!ctx.bus) return { funnels: 0, checkouts: 0 };
  const fh = funnelHours ?? hoursSetting(ctx, "funnel_abandon_hours", DEFAULTS.funnel);
  const ch = checkoutHours ?? hoursSetting(ctx, "checkout_abandon_hours", DEFAULTS.checkout);
  const org = ctx.organizationId;
  const out = { funnels: 0, checkouts: 0 };

  // --- Tunnels ---
  const funnels = ctx.db.prepare("SELECT id, name, site_id FROM mk_funnels WHERE organization_id = ? AND status = 'active'").all(org);
  for (const f of funnels) {
    const rows = ctx.db.prepare(`SELECT e.contact_id, MAX(e.occurred_at) AS last
      FROM mk_events e WHERE e.organization_id = ? AND e.name = 'funnel.step_reached' AND json_extract(e.metadata, '$.funnelId') = ? AND e.contact_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM mk_events d WHERE d.organization_id = e.organization_id AND d.contact_id = e.contact_id AND d.name IN ('funnel.completed', 'funnel.abandoned') AND json_extract(d.metadata, '$.funnelId') = json_extract(e.metadata, '$.funnelId'))
      GROUP BY e.contact_id HAVING last < ? LIMIT ?`).all(org, String(f.id), now - fh * HOUR, limit);
    for (const r of rows) {
      const contact = ctx.db.prepare("SELECT id, email FROM mk_contacts WHERE id = ? AND organization_id = ? AND record_status = 'active'").get(r.contact_id, org);
      if (!contact) continue;
      const lastEvent = ctx.db.prepare("SELECT metadata FROM mk_events WHERE organization_id = ? AND contact_id = ? AND name = 'funnel.step_reached' AND json_extract(metadata, '$.funnelId') = ? ORDER BY occurred_at DESC, id DESC LIMIT 1").get(org, contact.id, String(f.id));
      let md = {};
      try { md = JSON.parse(lastEvent.metadata); } catch { md = {}; }
      emit(ctx, "funnel.abandoned", {
        contact, source: "funnel", objectType: "funnel", objectId: f.id, siteId: f.site_id ?? null, idempotencyKey: `funnel.abandoned:${contact.id}:${f.id}`, occurredAt: now,
        metadata: { funnelId: String(f.id), funnelName: f.name, lastStepId: md.stepId || "", lastStepName: md.stepName || "", step: md.step || 0, inactiveHours: fh, lastActivityAt: r.last },
      });
      out.funnels += 1;
    }
  }

  // --- Commande ---
  const started = ctx.db.prepare(`SELECT e.id, e.contact_id, e.occurred_at FROM mk_events e
    WHERE e.organization_id = ? AND e.name = 'lms.checkout_started' AND e.contact_id IS NOT NULL AND e.occurred_at < ? AND e.occurred_at >= ?
      AND NOT EXISTS (SELECT 1 FROM mk_events o WHERE o.organization_id = e.organization_id AND o.contact_id = e.contact_id AND o.name IN ('lms.order_completed', 'purchase.completed') AND o.occurred_at >= e.occurred_at)
      AND NOT EXISTS (SELECT 1 FROM mk_events a WHERE a.organization_id = e.organization_id AND a.contact_id = e.contact_id AND a.name = 'checkout.abandoned' AND json_extract(a.metadata, '$.startedEventId') = e.id)
    ORDER BY e.id LIMIT ?`).all(org, now - ch * HOUR, now - 30 * 86400000, limit);
  for (const e of started) {
    const contact = ctx.db.prepare("SELECT id, email FROM mk_contacts WHERE id = ? AND organization_id = ? AND record_status = 'active'").get(e.contact_id, org);
    if (!contact) continue;
    emit(ctx, "checkout.abandoned", { contact, source: "commerce", idempotencyKey: `checkout.abandoned:${contact.id}:${e.id}`, occurredAt: now, metadata: { startedEventId: e.id, startedAt: e.occurred_at, abandonAfterHours: ch } });
    out.checkouts += 1;
  }
  return out;
}

module.exports = { sweep, DEFAULTS };
