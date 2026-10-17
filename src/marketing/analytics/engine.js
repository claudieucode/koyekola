// Analytics central (palier 21) — COUCHE DE LECTURE. Elle ne possède aucune donnée métier et ne stocke aucun événement :
//   trafic        → mk_web_events (visites suivies avec l'accord du visiteur)
//   parcours      → mk_events (journal : funnel.*, form.*, contact.*, purchase.*, cart.*…) — idempotent par construction
//   boutique      → orders / order_items / order_refunds (la boutique reste la source de vérité financière)
//   e-mails       → mk_message_events        scénarios → mk_automation_runs        contacts → mk_contacts
// Toutes les lectures respectent la portée de site (ctx.siteScope imposé, ctx.siteFilter d'affichage) et le fuseau du site.
// Règle d'honnêteté : « pas de donnée » (null / noData) n'est JAMAIS affiché comme « 0 ».
const { notHiddenSql } = require("../visibility"); // R4
const { checkCtx } = require("../audience/shared");
const { resolvePeriod, dayBoundaries, dayIndex, sqlUtc, delta, PRESETS } = require("./period");
const { classify } = require("../funnels/events");
const attribution = require("./attribution");

const MAX_ROWS = 400000;
const TOP = 10;
const pct = (n, d) => (d > 0 ? Math.round((n / d) * 10000) / 100 : null);
const has = (ctx, table) => Boolean(ctx.db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table));

// ---------- Portée de site ----------
// siteScope (nombre) : accès limité à CE site, imposé par le serveur. siteFilter : filtre d'affichage de l'équipe de l'organisation.
function scopeOf(ctx) {
  if (Number.isInteger(ctx.siteScope)) return { kind: "site", id: ctx.siteScope, commerce: false };
  if (Number.isInteger(ctx.siteFilter)) return { kind: "site", id: ctx.siteFilter, commerce: false };
  if (ctx.siteFilter === "principal") return { kind: "main", commerce: true };
  return { kind: "all", commerce: true, hidden: ctx.hiddenSites }; // R4 : sites dont la personne ne peut pas lire les statistiques, exclus de l'agrégat de l'organisation
}
function siteClause(scope, expr) {
  if (scope.kind === "site") return { sql: `${expr} = ?`, params: [scope.id] };
  if (scope.kind === "main") return { sql: `${expr} IS NULL`, params: [] };
  return notHiddenSql(scope.hidden, expr);
}

// ---------- Trafic (visites suivies) ----------
function trafficRows(ctx, P, which, filters, scope) {
  const [from, to] = which === "previous" ? [P.prevStart, P.prevEnd] : [P.start, P.end];
  const sc = siteClause(scope, "w.site_id");
  const device = ["mobile", "tablet", "desktop"].includes(filters.device) ? filters.device : "";
  const rows = ctx.db.prepare(`SELECT w.visitor_id, w.session_id, w.type, w.path, w.device, w.occurred_at FROM mk_web_events w
    WHERE w.organization_id = ? AND w.occurred_at >= ? AND w.occurred_at < ? AND ${sc.sql}${device ? " AND w.device = ?" : ""} LIMIT ?`).all(ctx.organizationId, from, to, ...sc.params, ...(device ? [device] : []), MAX_ROWS + 1);
  const truncated = rows.length > MAX_ROWS;
  return { rows: truncated ? rows.slice(0, MAX_ROWS) : rows, truncated };
}
// Provenance par session (session_start) — sert au filtre « source » et au tableau des sources
function sessionSources(ctx, P, which, scope) {
  const [from, to] = which === "previous" ? [P.prevStart, P.prevEnd] : [P.start, P.end];
  const sc = siteClause(scope, "w.site_id");
  const map = new Map();
  for (const r of ctx.db.prepare(`SELECT w.session_id, w.visitor_id, w.utm_source, w.utm_medium, w.utm_campaign, w.referrer FROM mk_web_events w
    WHERE w.organization_id = ? AND w.type = 'session_start' AND w.occurred_at >= ? AND w.occurred_at < ? AND ${sc.sql} LIMIT ?`).all(ctx.organizationId, from, to, ...sc.params, MAX_ROWS)) {
    map.set(`${r.visitor_id}|${r.session_id}`, classify(r));
  }
  return map;
}

function traffic(ctx, P, filters, scope) {
  const everTracked = Boolean(ctx.db.prepare("SELECT 1 FROM mk_web_events WHERE organization_id = ? LIMIT 1").get(ctx.organizationId));
  const compute = (which) => {
    const { rows, truncated } = trafficRows(ctx, P, which, filters, scope);
    const src = filters.source ? sessionSources(ctx, P, which, scope) : null;
    const keep = src ? rows.filter((r) => (src.get(`${r.visitor_id}|${r.session_id}`) || {}).source === filters.source) : rows;
    const visitors = new Set(), sessions = new Set();
    let pageViews = 0;
    for (const r of keep) { visitors.add(r.visitor_id); sessions.add(`${r.visitor_id}|${r.session_id}`); if (r.type === "page_view") pageViews += 1; }
    return { rows: keep, truncated, visitors: visitors.size, sessions: sessions.size, pageViews, events: keep.length };
  };
  const cur = compute("current");
  const prev = compute("previous");
  const noData = cur.events === 0;
  const bounds = dayBoundaries(P);
  const series = bounds.map((b) => ({ ymd: b.ymd, pageViews: 0, _v: new Set(), visitors: 0 }));
  for (const r of cur.rows) {
    if (r.type !== "page_view") continue;
    const i = dayIndex(bounds, P.end, r.occurred_at);
    if (i >= 0) { series[i].pageViews += 1; series[i]._v.add(r.visitor_id); }
  }
  for (const s of series) { s.visitors = s._v.size; delete s._v; }
  const pages = new Map(), devices = new Map();
  for (const r of cur.rows) {
    if (r.type === "page_view") { const g = pages.get(r.path) || { path: r.path, pageViews: 0, _v: new Set() }; g.pageViews += 1; g._v.add(r.visitor_id); pages.set(r.path, g); }
    if (r.type === "session_start") devices.set(r.device || "unknown", (devices.get(r.device || "unknown") || 0) + 1);
  }
  const pageList = [...pages.values()].map((g) => ({ path: g.path, pageViews: g.pageViews, visitors: g._v.size, kind: /^\/blog\//.test(g.path) ? "article" : /^\/cours\//.test(g.path) ? "formation" : /^\/p\//.test(g.path) ? "page marketing" : "page" }))
    .sort((a, b) => b.pageViews - a.pageViews || a.path.localeCompare(b.path));
  const srcMap = sessionSources(ctx, P, "current", scope);
  const sources = new Map();
  for (const [, c] of srcMap) { const k = `${c.source}\u0000${c.campaign || ""}`; const g = sources.get(k) || { source: c.source, label: attribution.SOURCE_LABELS[c.source] || c.source, campaign: c.campaign || "", sessions: 0 }; g.sessions += 1; sources.set(k, g); }
  const deviceLabels = { desktop: "Ordinateur", mobile: "Mobile", tablet: "Tablette", unknown: "Non précisé" };
  return {
    tracked: everTracked, noData,
    kpis: noData ? null : { visitors: cur.visitors, sessions: cur.sessions, pageViews: cur.pageViews, events: cur.events },
    previous: prev.events === 0 ? null : { visitors: prev.visitors, sessions: prev.sessions, pageViews: prev.pageViews, events: prev.events },
    deltas: noData || prev.events === 0 ? null : { visitors: delta(cur.visitors, prev.visitors), sessions: delta(cur.sessions, prev.sessions), pageViews: delta(cur.pageViews, prev.pageViews) },
    series, truncated: cur.truncated,
    topPages: pageList.slice(0, TOP * 2), articles: pageList.filter((p) => p.kind === "article").slice(0, TOP),
    sources: [...sources.values()].sort((a, b) => b.sessions - a.sessions).slice(0, TOP),
    devices: [...devices.entries()].map(([k, n]) => ({ device: k, label: deviceLabels[k] || k, sessions: n })).sort((a, b) => b.sessions - a.sessions),
  };
}

// ---------- Journal d'événements (parcours, formulaires, contacts…) ----------
function ledgerCount(ctx, scope, names, from, to, extra = "", extraParams = []) {
  const sc = siteClause(scope, "e.site_id");
  const ph = names.map(() => "?").join(",");
  return ctx.db.prepare(`SELECT COUNT(*) events, COUNT(DISTINCT e.contact_id) contacts FROM mk_events e WHERE e.organization_id = ? AND e.name IN (${ph}) AND e.occurred_at >= ? AND e.occurred_at < ? AND ${sc.sql}${extra}`)
    .get(ctx.organizationId, ...names, from, to, ...sc.params, ...extraParams);
}

const BUILTIN_CONVERSIONS = [
  { key: "form", label: "Formulaire envoyé", event: "form.submitted" },
  { key: "signup", label: "Inscription au site", event: "lms.user_registered" },
  { key: "subscribe", label: "Abonnement à une audience (consentement)", event: "contact.subscribed" },
  { key: "funnel", label: "Tunnel terminé", event: "funnel.completed" },
  { key: "purchase", label: "Achat", event: "purchase.completed" },
];
// Chaque type de conversion reste SÉPARÉ (jamais additionné dans un seul compteur). Les conversions personnalisées lisent des événements déjà émis.
function conversions(ctx, P, scope) {
  const custom = has(ctx, "mk_conversions") ? ctx.db.prepare("SELECT id, name, event, filter_key, filter_value, site_id FROM mk_conversions WHERE organization_id = ? ORDER BY name COLLATE NOCASE").all(ctx.organizationId)
    .filter((c) => (scope.kind === "all" ? !(scope.hidden || []).includes(c.site_id) : scope.kind === "main" ? c.site_id === null : c.site_id === scope.id || c.site_id === null)) : [];
  const defs = [...BUILTIN_CONVERSIONS.map((c) => ({ ...c, custom: false })), ...custom.map((c) => ({ key: `custom-${c.id}`, id: c.id, label: c.name, event: c.event, filterKey: c.filter_key, filterValue: c.filter_value, custom: true }))];
  const rows = defs.map((d) => {
    const extra = d.filterKey ? " AND CAST(json_extract(e.metadata, '$.' || ?) AS TEXT) = ?" : "";
    const extraParams = d.filterKey ? [d.filterKey, d.filterValue] : [];
    const cur = ledgerCount(ctx, scope, [d.event], P.start, P.end, extra, extraParams);
    const prev = ledgerCount(ctx, scope, [d.event], P.prevStart, P.prevEnd, extra, extraParams);
    return { key: d.key, id: d.id, label: d.label, event: d.event, custom: d.custom, filter: d.filterKey ? `${d.filterKey} = ${d.filterValue}` : "", events: cur.events, contacts: cur.contacts, previous: prev.events, delta: delta(cur.events, prev.events) };
  });
  return { rows, noData: rows.every((r) => r.events === 0) };
}

// ---------- Tunnels ----------
function funnels(ctx, P, scope) {
  const sc = siteClause(scope, "f.site_id");
  const list = ctx.db.prepare(`SELECT f.id, f.name, f.status FROM mk_funnels f WHERE f.organization_id = ? AND ${sc.sql} ORDER BY f.name COLLATE NOCASE LIMIT 50`).all(ctx.organizationId, ...sc.params);
  const count = (name, fid, from = P.start, to = P.end) => ctx.db.prepare(`SELECT COUNT(DISTINCT contact_id) n FROM mk_events WHERE organization_id = ? AND name = ? AND json_extract(metadata, '$.funnelId') = ? AND occurred_at >= ? AND occurred_at < ? AND contact_id IS NOT NULL`).get(ctx.organizationId, name, String(fid), from, to).n;
  const rows = list.map((f) => {
    const steps = ctx.db.prepare("SELECT id, name, position FROM mk_funnel_steps WHERE funnel_id = ? ORDER BY position").all(f.id);
    const entered = count("funnel.entered", f.id);
    const stepRows = steps.map((s) => ({ id: s.id, name: s.name, contacts: ctx.db.prepare("SELECT COUNT(DISTINCT contact_id) n FROM mk_events WHERE organization_id = ? AND name = 'funnel.step_reached' AND json_extract(metadata, '$.stepId') = ? AND occurred_at >= ? AND occurred_at < ? AND contact_id IS NOT NULL").get(ctx.organizationId, String(s.id), P.start, P.end).n }));
    stepRows.forEach((s, i) => { s.fromStart = pct(s.contacts, entered); s.fromPrevious = i === 0 ? pct(s.contacts, entered) : pct(s.contacts, stepRows[i - 1].contacts); });
    const completed = count("funnel.completed", f.id), abandoned = count("funnel.abandoned", f.id);
    const sales = ctx.db.prepare("SELECT COUNT(*) n, COALESCE(SUM(json_extract(metadata, '$.totalCents')), 0) cents FROM mk_events WHERE organization_id = ? AND name = 'purchase.completed' AND json_extract(metadata, '$.funnelId') = ? AND occurred_at >= ? AND occurred_at < ?").get(ctx.organizationId, String(f.id), P.start, P.end);
    return { id: f.id, name: f.name, status: f.status, entered, completed, abandoned, conversion: pct(completed, entered), steps: stepRows, purchases: sales.n, revenueCents: sales.cents, noData: entered === 0 && stepRows.every((s) => s.contacts === 0) };
  });
  return { rows, noData: rows.length === 0 || rows.every((r) => r.noData) };
}

// ---------- Boutique ----------
function commerce(ctx, P, scope) {
  if (!scope.commerce) return { unavailable: "Les commandes de la boutique ne sont pas rattachées à un site : elles ne sont affichées que pour l'ensemble de l'organisation ou le site principal." };
  if (!has(ctx, "orders")) return { unavailable: "La boutique n'est pas disponible dans cette installation." };
  const q = (from, to) => {
    const f = sqlUtc(from), t = sqlUtc(to);
    const o = ctx.db.prepare("SELECT COUNT(*) orders, COUNT(CASE WHEN total_cents > 0 THEN 1 END) paid, COALESCE(SUM(total_cents), 0) gross, COALESCE(SUM(discount_cents), 0) discounts FROM orders WHERE created_at >= ? AND created_at < ?").get(f, t);
    const refunds = has(ctx, "order_refunds") ? ctx.db.prepare("SELECT COUNT(*) n, COALESCE(SUM(amount_cents), 0) cents FROM order_refunds WHERE created_at >= ? AND created_at < ?").get(f, t) : { n: 0, cents: 0 };
    const newC = ctx.db.prepare("SELECT COUNT(*) n FROM (SELECT user_id, MIN(created_at) f FROM orders GROUP BY user_id) WHERE f >= ? AND f < ?").get(f, t).n;
    const buyers = ctx.db.prepare("SELECT COUNT(DISTINCT user_id) n FROM orders WHERE created_at >= ? AND created_at < ?").get(f, t).n;
    return { orders: o.orders, paidOrders: o.paid, grossCents: o.gross, discountCents: o.discounts, refunds: refunds.n, refundCents: refunds.cents, netCents: o.gross - refunds.cents, avgBasketCents: o.paid ? Math.round(o.gross / o.paid) : null, newCustomers: newC, returningCustomers: buyers - newC };
  };
  const cur = q(P.start, P.end), prev = q(P.prevStart, P.prevEnd);
  const noData = cur.orders === 0 && cur.refunds === 0;
  const products = ctx.db.prepare(`SELECT c.id, c.title, COUNT(*) sold, COALESCE(SUM(i.price_cents), 0) cents FROM order_items i JOIN orders o ON o.id = i.order_id JOIN courses c ON c.id = i.course_id
    WHERE o.created_at >= ? AND o.created_at < ? GROUP BY c.id ORDER BY cents DESC, sold DESC LIMIT ?`).all(sqlUtc(P.start), sqlUtc(P.end), TOP);
  const abandoned = ledgerCount(ctx, scope, ["cart.abandoned"], P.start, P.end).contacts;
  const abandonedCheckout = ledgerCount(ctx, scope, ["checkout.abandoned"], P.start, P.end).contacts;
  return {
    noData, kpis: cur, previous: prev,
    deltas: { gross: delta(cur.grossCents, prev.grossCents, "money"), net: delta(cur.netCents, prev.netCents, "money"), orders: delta(cur.orders, prev.orders), avgBasket: delta(cur.avgBasketCents, prev.avgBasketCents, "money"), refunds: delta(cur.refundCents, prev.refundCents, "money") },
    products, abandonedCarts: abandoned, abandonedCheckouts: abandonedCheckout,
    unavailable_metrics: ["Taxes", "Frais de livraison"],
  };
}

// ---------- Contacts ----------
function contacts(ctx, P, scope) {
  const sc = scope.kind === "site" ? { sql: "c.origin_site_id = ?", params: [scope.id] } : scope.kind === "main" ? { sql: "c.origin_site_id IS NULL", params: [] } : notHiddenSql(scope.hidden, "c.origin_site_id");
  const count = (from, to) => ctx.db.prepare(`SELECT COUNT(*) n FROM mk_contacts c WHERE c.organization_id = ? AND c.record_status = 'active' AND c.created_at >= ? AND c.created_at < ? AND ${sc.sql}`).get(ctx.organizationId, sqlUtc(from), sqlUtc(to), ...sc.params).n;
  const created = count(P.start, P.end), before = count(P.prevStart, P.prevEnd);
  const stages = ctx.db.prepare(`SELECT c.lifecycle_stage stage, COUNT(*) n FROM mk_contacts c WHERE c.organization_id = ? AND c.record_status = 'active' AND c.created_at >= ? AND c.created_at < ? AND ${sc.sql} GROUP BY c.lifecycle_stage ORDER BY n DESC`).all(ctx.organizationId, sqlUtc(P.start), sqlUtc(P.end), ...sc.params);
  const customers = ledgerCount(ctx, scope, ["contact.lifecycle_changed"], P.start, P.end, " AND json_extract(e.metadata, '$.to') = 'customer'").contacts;
  return { noData: created === 0 && customers === 0, newContacts: created, delta: delta(created, before), byLifecycle: stages, newCustomers: customers };
}

// ---------- E-mails (journal ajouté seulement de l'Email Engine) ----------
function email(ctx, P, scope) {
  const sc = siteClause(scope, "c.site_id");
  const totals = (from, to) => {
    const rows = ctx.db.prepare(`SELECT me.type, me.bot, COUNT(*) n, COUNT(DISTINCT me.message_id) uniq FROM mk_message_events me JOIN mk_campaigns c ON c.id = me.campaign_id
      WHERE me.organization_id = ? AND me.occurred_at >= ? AND me.occurred_at < ? AND ${sc.sql} GROUP BY me.type, me.bot`).all(ctx.organizationId, from, to, ...sc.params);
    const by = (type, bot) => rows.filter((r) => r.type === type && (bot === undefined || r.bot === bot)).reduce((a, r) => ({ n: a.n + r.n, uniq: a.uniq + r.uniq }), { n: 0, uniq: 0 });
    const sent = by("sent").n, opens = by("opened", 0), clicks = by("clicked", 0);
    return { sent, delivered: by("delivered").n, bounced: by("bounced").n, complained: by("complained").n, unsubscribed: by("unsubscribed").n, uniqueOpens: opens.uniq, uniqueClicks: clicks.uniq,
      rates: { delivery: pct(by("delivered").n, sent), open: pct(opens.uniq, sent), click: pct(clicks.uniq, sent), bounce: pct(by("bounced").n, sent), complaint: pct(by("complained").n, sent), unsubscribe: pct(by("unsubscribed").n, sent) } };
  };
  const cur = totals(P.start, P.end), prev = totals(P.prevStart, P.prevEnd);
  return {
    noData: cur.sent === 0, ...cur, previous: prev,
    deltas: { sent: delta(cur.sent, prev.sent), open: delta(cur.rates.open, prev.rates.open, "rate"), click: delta(cur.rates.click, prev.rates.click, "rate") },
    notes: ["Les ouvertures sont INDICATIVES : Apple Mail (protection de la vie privée) et certains clients pré-chargent les images, d'autres les bloquent. Le clic est plus fiable.", "Ouvertures et clics « uniques » : une fois par message ; les robots sont exclus."],
  };
}

// ---------- Scénarios (agrégation du journal d'exécution, sans le dupliquer) ----------
function automations(ctx, P, scope) {
  const sc = siteClause(scope, "a.site_id");
  const q = (from, to) => {
    const rows = ctx.db.prepare(`SELECT r.status, COUNT(*) n FROM mk_automation_runs r JOIN mk_automations a ON a.id = r.automation_id WHERE r.organization_id = ? AND r.entered_at >= ? AND r.entered_at < ? AND ${sc.sql} GROUP BY r.status`).all(ctx.organizationId, from, to, ...sc.params);
    const n = (s) => (rows.find((r) => r.status === s) || { n: 0 }).n;
    const started = rows.reduce((a, r) => a + r.n, 0);
    return { started, running: n("running"), completed: n("completed"), exited: n("exited"), failed: n("failed") };
  };
  const cur = q(P.start, P.end), prev = q(P.prevStart, P.prevEnd);
  const top = ctx.db.prepare(`SELECT a.id, a.name, COUNT(*) started, SUM(r.status = 'completed') completed, SUM(r.status = 'failed') failed FROM mk_automation_runs r JOIN mk_automations a ON a.id = r.automation_id
    WHERE r.organization_id = ? AND r.entered_at >= ? AND r.entered_at < ? AND ${sc.sql} GROUP BY a.id ORDER BY started DESC LIMIT ?`).all(ctx.organizationId, P.start, P.end, ...sc.params, TOP);
  return { noData: cur.started === 0, ...cur, completionRate: pct(cur.completed, cur.started), failureRate: pct(cur.failed, cur.started), previous: prev, delta: delta(cur.started, prev.started), top };
}

// ---------- Tableau de bord ----------
// Chaque section est calculée à part : une section en erreur est signalée (error), les autres restent affichées — jamais un tableau vide qui masque une panne.
// Tests A/B (palier 22) : lecture seule des expériences du périmètre — le moteur d'A/B reste propriétaire de leurs résultats et de leur verdict
function experiments(ctx, P, scope) {
  const ab = require("../pages/abtests");
  const all = ab.listTests(ctx).filter((t) => !t.archived);
  const active = all.filter((t) => ["running", "stopped"].includes(t.status));
  const endedHere = all.filter((t) => t.status === "completed" && t.stopped_at && Date.parse(`${t.stopped_at.replace(" ", "T")}Z`) >= P.start && Date.parse(`${t.stopped_at.replace(" ", "T")}Z`) < P.end);
  const rows = active.concat(endedHere).slice(0, 10).map((t) => {
    const r = ab.results(ctx, t);
    return { id: t.id, pageId: t.page_id, name: t.name, status: t.status, goal: t.goalKey, exposures: r.exposures.a + r.exposures.b, rateA: r.variants.a.rate, rateB: r.variants.b.rate, verdict: r.verdict.kind, leader: r.verdict.winner || r.verdict.leader || null, anomalies: r.anomalies.filter((x) => x.level !== "info").length };
  });
  return { running: all.filter((t) => t.status === "running").length, paused: all.filter((t) => t.status === "stopped").length, endedInPeriod: endedHere.length, rows, noData: !all.length };
}

function dashboard(ctx, { range, from, to, source, device, model } = {}) {
  checkCtx(ctx);
  const P = resolvePeriod(ctx, { range, from, to });
  const scope = scopeOf(ctx);
  const filters = { source: Object.hasOwn(attribution.SOURCE_LABELS, source) && source !== attribution.UNATTRIBUTED ? source : "", device: ["mobile", "tablet", "desktop"].includes(device) ? device : "" };
  const sections = {};
  const run = (key, fn) => { try { sections[key] = fn(); } catch (error) { console.error(`[KOLAKISA] Analytics (${key}) :`, error.message); sections[key] = { error: "Cette section n'a pas pu être calculée. Réessayez ; le problème est enregistré dans le journal du serveur." }; } };
  run("traffic", () => traffic(ctx, P, filters, scope));
  run("conversions", () => conversions(ctx, P, scope));
  run("funnels", () => funnels(ctx, P, scope));
  run("commerce", () => commerce(ctx, P, scope));
  run("attribution", () => (scope.commerce ? attribution.bySource(ctx, P, { model }) : { unavailable: true }));
  run("contacts", () => contacts(ctx, P, scope));
  run("email", () => email(ctx, P, scope));
  run("automations", () => automations(ctx, P, scope));
  run("experiments", () => experiments(ctx, P, scope));
  const last = ctx.db.prepare("SELECT MAX(occurred_at) t FROM mk_events WHERE organization_id = ?").get(ctx.organizationId).t;
  const lastWeb = ctx.db.prepare("SELECT MAX(occurred_at) t FROM mk_web_events WHERE organization_id = ?").get(ctx.organizationId).t;
  return {
    period: P, presets: PRESETS, filters, scope: scope.kind, sections,
    freshness: { lastEventAt: last || null, lastVisitAt: lastWeb || null, realtime: false, note: "Les chiffres sont calculés à l'ouverture de la page à partir des données enregistrées. Il n'y a pas de temps réel : les événements issus des commandes et des tunnels arrivent avec le délai du pont (environ 30 secondes)." },
  };
}

// ---------- Conversions personnalisées ----------
const EVENT_NAME = /^[a-z][a-z0-9_.]{1,63}$/;
const KEY = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;
function createConversion(ctx, { name, event, filterKey = "", filterValue = "", siteId = null } = {}) {
  checkCtx(ctx);
  const { MarketingError } = require("../errors");
  const label = String(name || "").trim().slice(0, 80);
  if (!label) throw new MarketingError("invalid_field", "Donnez un nom à la conversion.");
  if (!EVENT_NAME.test(String(event || ""))) throw new MarketingError("invalid_field", "Événement invalide (minuscules, chiffres, « _ » et « . »).");
  if (filterKey && (!KEY.test(filterKey) || !String(filterValue).trim())) throw new MarketingError("invalid_field", "Filtre invalide : une clé simple et une valeur sont attendues.");
  const site = Number.isInteger(ctx.siteScope) ? ctx.siteScope : (siteId === null || siteId === "" || siteId === undefined ? null : Number(siteId));
  if (site !== null && !ctx.db.prepare("SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ?").get(site, ctx.organizationId)) throw new MarketingError("not_found", "Site introuvable.");
  try {
    const info = ctx.db.prepare("INSERT INTO mk_conversions (organization_id, site_id, name, event, filter_key, filter_value, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)").run(ctx.organizationId, site, label, event, filterKey, String(filterValue).trim().slice(0, 120), ctx.userId ?? null);
    return Number(info.lastInsertRowid);
  } catch (error) {
    if (/UNIQUE/.test(error.message)) throw new MarketingError("duplicate", "Une conversion porte déjà ce nom.");
    throw error;
  }
}
function deleteConversion(ctx, id) {
  checkCtx(ctx);
  const sc = Number.isInteger(ctx.siteScope) ? " AND site_id = ?" : "";
  return ctx.db.prepare(`DELETE FROM mk_conversions WHERE id = ? AND organization_id = ?${sc}`).run(Number(id), ctx.organizationId, ...(sc ? [ctx.siteScope] : [])).changes > 0;
}

module.exports = { dashboard, experiments, traffic, conversions, funnels, commerce, contacts, email, automations, scopeOf, createConversion, deleteConversion, BUILTIN_CONVERSIONS };
