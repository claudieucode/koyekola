// Événements du tunnel (palier 19) — UN SEUL endroit qui produit les événements « funnel.* » vers le bus d'événements existant (journal du Contact Core).
// Le tunnel PRODUIT des événements ; le Contact Core les conserve ; le moteur d'automatisation les écoute ; le moteur d'e-mails exécute. Rien n'est appelé en direct.
// Tous portent la même structure : contact, tunnel (funnelId), étape (stepId), objet (funnel / funnel_step), site, source, métadonnées filtrées.
//  funnel.entered         première étape atteinte par ce contact dans ce tunnel (une fois par contact et par tunnel)
//  funnel.step_reached    étape vue (une fois par étape et par visite) — le « step.viewed » du cahier des charges
//  funnel.step.completed  étape terminée : la suivante est atteinte, ou le formulaire de l'étape est envoyé (une fois par contact et par étape)
//  funnel.completed       dernière étape atteinte (une fois par contact et par tunnel)
//  funnel.cta.clicked     bouton de l'étape cliqué (anti double clic : une fenêtre de 10 s par bouton)
//  funnel.abandoned       aucune activité depuis N heures avant la fin (voir abandon.js ; délai réglable)
// Seuls les événements réellement mesurables existent : pas d'upsell, de downsell ni de paiement dans le tunnel (étapes non fournies).
const { emit } = require("../audience/shared");

// ---------- Attribution : d'où vient le parcours ? (UTM et provenance déjà enregistrés par le suivi des visiteurs ; rien de nouveau n'est collecté) ----------
const SEARCH = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|qwant|baidu|yandex|brave)\./i;
const SOCIAL = /(^|\.)(facebook|instagram|linkedin|twitter|x|t|youtube|tiktok|pinterest|snapchat|reddit|whatsapp)\.(com|co|me)$/i;
function classify({ utm_source = "", utm_medium = "", utm_campaign = "", referrer = "" } = {}) {
  const medium = String(utm_medium).toLowerCase();
  let source = "direct";
  if (/^(cpc|ppc|paid|paidsocial|display|retargeting)$/.test(medium)) source = "paid";
  else if (/^(email|e-mail|newsletter)$/.test(medium) || String(utm_source).toLowerCase() === "email") source = "email";
  else if (medium === "social" || SOCIAL.test(referrer)) source = "social";
  else if (utm_source || utm_campaign) source = "campaign";
  else if (SEARCH.test(referrer)) source = "organic";
  else if (referrer) source = "referral";
  return { source, medium: String(utm_medium).slice(0, 40), campaign: String(utm_campaign).slice(0, 80), ...(utm_source ? { utm: String(utm_source).slice(0, 60) } : {}) };
}
// Provenance de la PREMIÈRE visite connue du contact (jamais inventée : « direct » seulement si une visite sans provenance a bien été enregistrée)
function attributionOf(db, organizationId, contactId) {
  const row = db.prepare("SELECT utm_source, utm_medium, utm_campaign, referrer FROM mk_web_events WHERE organization_id = ? AND contact_id = ? AND type = 'session_start' ORDER BY occurred_at ASC, id ASC LIMIT 1").get(organizationId, contactId);
  return row ? classify(row) : null;
}

// Étapes de tunnels ACTIFS correspondant à une condition (page, ou formation)
function stepsWhere(ctx, condition, value) {
  return ctx.db.prepare(`SELECT s.id, s.name, s.position, s.type, f.id AS funnel_id, f.name AS funnel_name, f.site_id AS site_id,
      (SELECT MIN(x.position) FROM mk_funnel_steps x WHERE x.funnel_id = f.id) AS first_position,
      (SELECT MAX(x.position) FROM mk_funnel_steps x WHERE x.funnel_id = f.id) AS last_position
    FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id WHERE ${condition} AND f.status = 'active' AND f.organization_id = ?`).all(value, ctx.organizationId);
}

const base = (s) => ({ funnelId: String(s.funnel_id), funnelName: s.funnel_name, stepId: String(s.id), stepName: s.name, step: s.position });
const common = (s, object) => (object === "funnel" ? { objectType: "funnel", objectId: s.funnel_id, siteId: s.site_id ?? null } : { objectType: "funnel_step", objectId: s.id, siteId: s.site_id ?? null });

// Parcours d'un contact connu qui atteint des étapes (visite suivie avec son accord, ou rejeu à l'identification)
function emitJourney(ctx, contact, steps, { sessionId, at } = {}) {
  let n = 0;
  const extra = at ? { occurredAt: at } : {};
  for (const s of steps) {
    if (!sessionId) continue;
    const attribution = attributionOf(ctx.db, ctx.organizationId, contact.id);
    emit(ctx, "funnel.entered", { contact, source: "site", ...common(s, "funnel"), ...extra, idempotencyKey: `funnel.entered:${contact.id}:${s.funnel_id}`, metadata: { ...base(s), ...(attribution ? { attribution } : {}) } });
    emit(ctx, "funnel.step_reached", { contact, source: "site", ...common(s), ...extra, idempotencyKey: `funnel.step_reached:${contact.id}:${s.id}:${sessionId}`, metadata: base(s) });
    n += 2;
    // L'étape précédente est TERMINÉE seulement si le contact l'avait bien atteinte (sauter une étape n'est pas la terminer)
    const prev = ctx.db.prepare("SELECT id, name, position FROM mk_funnel_steps WHERE funnel_id = ? AND position < ? ORDER BY position DESC LIMIT 1").get(s.funnel_id, s.position);
    if (prev && ctx.db.prepare("SELECT 1 FROM mk_events WHERE organization_id = ? AND contact_id = ? AND name = 'funnel.step_reached' AND json_extract(metadata, '$.stepId') = ? LIMIT 1").get(ctx.organizationId, contact.id, String(prev.id))) {
      emit(ctx, "funnel.step.completed", { contact, source: "site", ...common({ ...s, id: prev.id }), ...extra, idempotencyKey: `funnel.step.completed:${contact.id}:${prev.id}`, metadata: { ...base({ ...s, id: prev.id, name: prev.name, position: prev.position }), by: "next_step" } });
      n += 1;
    }
    if (s.position === s.last_position) {
      emit(ctx, "funnel.completed", { contact, source: "site", ...common(s, "funnel"), ...extra, idempotencyKey: `funnel.completed:${contact.id}:${s.funnel_id}`, metadata: { funnelId: String(s.funnel_id), funnelName: s.funnel_name } });
      n += 1;
    }
  }
  return n;
}

// Étape terminée par l'envoi de son formulaire : fait établi côté serveur (la personne vient de s'identifier), sans dépendre du suivi des visiteurs
function emitFormCompletion(ctx, contact, steps) {
  let n = 0;
  for (const s of steps) {
    emit(ctx, "funnel.entered", { contact, source: "form", ...common(s, "funnel"), idempotencyKey: `funnel.entered:${contact.id}:${s.funnel_id}`, metadata: base(s) });
    emit(ctx, "funnel.step.completed", { contact, source: "form", ...common(s), idempotencyKey: `funnel.step.completed:${contact.id}:${s.id}`, metadata: { ...base(s), by: "form" } });
    n += 2;
  }
  return n;
}

// Bouton cliqué sur une étape (contact connu). Fenêtre de 10 s par bouton : plusieurs clics rapides ne produisent qu'un événement.
function emitCta(ctx, contact, steps, { label, index, destination, now = Date.now() }) {
  let n = 0;
  for (const s of steps) {
    emit(ctx, "funnel.cta.clicked", { contact, source: "site", ...common(s), idempotencyKey: `funnel.cta.clicked:${contact.id}:${s.id}:${index}:${Math.floor(now / 10000)}`,
      metadata: { ...base(s), cta: String(label || "").slice(0, 80), ctaIndex: index, destination } });
    n += 1;
  }
  return n;
}

// Continuité du parcours : un visiteur anonyme (qui avait accepté la mesure) devient un contact connu ; ses passages passés sur des étapes de tunnels
// deviennent des événements DATÉS de leur vrai moment. Mêmes clés d'idempotence que les événements en direct : jamais de doublon.
function replayVisitor(ctx, visitorId, contactId, { limit = 200, days = 30 } = {}) {
  if (!ctx.bus || !Number.isInteger(contactId)) return 0;
  const contact = ctx.db.prepare("SELECT id, email FROM mk_contacts WHERE id = ? AND organization_id = ?").get(contactId, ctx.organizationId);
  if (!contact) return 0;
  const since = Date.now() - days * 86400000;
  const views = ctx.db.prepare("SELECT page_id, session_id, occurred_at FROM mk_web_events WHERE organization_id = ? AND visitor_id = ? AND type = 'page_view' AND page_id IS NOT NULL AND occurred_at >= ? ORDER BY occurred_at ASC, id ASC LIMIT ?")
    .all(ctx.organizationId, visitorId, since, limit);
  let n = 0;
  for (const v of views) n += emitJourney(ctx, contact, stepsWhere(ctx, "s.page_id = ?", v.page_id), { sessionId: v.session_id, at: v.occurred_at });
  return n;
}

// Parcours d'UN contact dans les tunnels, lu dans son journal réel (palier 19) : pour chaque tunnel, étapes atteintes / terminées, achèvement, abandon.
// `siteId` (accès limité à un site) : seuls les événements de ce site sont lus.
function contactJourney(ctx, contactId, { siteId = null } = {}) {
  const rows = ctx.db.prepare(`SELECT name, metadata, occurred_at FROM mk_events WHERE organization_id = ? AND contact_id = ? AND name LIKE 'funnel.%'${Number.isInteger(siteId) ? " AND site_id = ?" : ""} ORDER BY occurred_at ASC, id ASC LIMIT 500`)
    .all(...[ctx.organizationId, contactId, ...(Number.isInteger(siteId) ? [siteId] : [])]);
  const byFunnel = new Map();
  for (const r of rows) {
    let md = {};
    try { md = JSON.parse(r.metadata); } catch { md = {}; }
    if (!md.funnelId) continue;
    const f = byFunnel.get(md.funnelId) || { funnelId: md.funnelId, name: md.funnelName || "Tunnel", enteredAt: null, reached: new Set(), completedSteps: new Set(), completed: false, abandonedAt: null, lastStep: "", attribution: null, lastAt: 0 };
    if (r.name === "funnel.entered") { f.enteredAt = f.enteredAt || r.occurred_at; if (md.attribution) f.attribution = md.attribution; }
    if (r.name === "funnel.step_reached") { f.reached.add(md.stepName || md.stepId); f.lastStep = md.stepName || f.lastStep; }
    if (r.name === "funnel.step.completed") f.completedSteps.add(md.stepName || md.stepId);
    if (r.name === "funnel.completed") f.completed = true;
    if (r.name === "funnel.abandoned") f.abandonedAt = r.occurred_at;
    f.lastAt = Math.max(f.lastAt, r.occurred_at);
    byFunnel.set(md.funnelId, f);
  }
  return [...byFunnel.values()].map((f) => ({ ...f, reached: [...f.reached], completedSteps: [...f.completedSteps], state: f.completed ? "completed" : f.abandonedAt ? "abandoned" : "in_progress" }));
}

module.exports = { contactJourney, classify, attributionOf, stepsWhere, emitJourney, emitFormCompletion, emitCta, replayVisitor };
