// Rapports comparatifs (point 9 de la parité Mailchimp) : les campagnes e-mail et SMS TERMINÉES d'une période, filtrées
// (canal, audience, étiquette de campagne, nom, sélection), comparées côte à côte ou regroupées (mois, jour de la semaine,
// heure d'envoi, audience, étiquette, canal). Lecture seule, sauf les étiquettes de campagne et les rapports enregistrés.
// Règles de calcul (testées) :
//  - un taux de groupe est recalculé sur les SOMMES (jamais une moyenne de taux) ;
//  - ouverture, rebond et plainte n'existent que pour l'e-mail : leur dénominateur est le nombre d'e-mails envoyés ;
//  - pas d'envoi = pas de taux (null, affiché « — »), jamais un faux « 0 % » ;
//  - dates, mois, jours et heures sont ceux du fuseau de l'organisation (réglages d'envoi).
const { checkCtx, cleanText, audit } = require("../audience/shared");
const { MarketingError } = require("../errors");
const { orgTimeZone, zonedToUtc, localYmd, localHour } = require("../sending/sendtime");

const DAY = 86400000;
const MAX_ROWS = 500;
const MAX_TAGS = 5;
const MAX_COMPARE = 50;
const DEFAULT_DAYS = 90;
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const CHANNELS = { all: "E-mail et SMS", email: "E-mail", sms: "SMS" };
const GROUPS = { campaign: "Campagne", month: "Mois", weekday: "Jour de la semaine", hour: "Heure d'envoi", target: "Audience", tag: "Étiquette", channel: "Canal" };
const METRICS = {
  sent: { short: "Envoyés", label: "Envoyés", kind: "count" },
  deliveryRate: { short: "Remise", label: "Taux de remise", kind: "rate" },
  openRate: { short: "Ouverture", label: "Taux d'ouverture", kind: "rate", emailOnly: true },
  clickRate: { short: "Clic", label: "Taux de clic", kind: "rate" },
  clickToOpen: { short: "Clics / ouv.", label: "Clics / ouvertures", kind: "rate", emailOnly: true },
  bounceRate: { short: "Rebond", label: "Taux de rebond", kind: "rate", emailOnly: true, lowerIsBetter: true },
  unsubscribeRate: { short: "Désinscr.", label: "Taux de désinscription", kind: "rate", lowerIsBetter: true },
  complaintRate: { short: "Plainte", label: "Taux de plainte", kind: "rate", emailOnly: true, lowerIsBetter: true },
  revenueCents: { short: "Revenus", label: "Revenus", kind: "money" },
  revenuePerSent: { short: "Par envoi", label: "Revenu par envoi", kind: "money" },
};
const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const bad = (message) => new MarketingError("invalid_field", message);
const nowOf = (ctx) => (typeof ctx.now === "function" ? ctx.now() : Date.now());
const pct = (n, d) => (d > 0 ? Math.round((n / d) * 10000) / 100 : null);
const ymdPlus = (ymd, days) => new Date(Date.UTC(...ymd.split("-").map((v, i) => Number(v) - (i === 1 ? 1 : 0))) + days * DAY).toISOString().slice(0, 10);
const validYmd = (v) => YMD.test(v) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;

// ---------- Étiquettes de campagne ----------
function cleanTag(value) {
  const t = String(value ?? "").replace(/\p{Cc}/gu, "").replace(/\s+/g, " ").trim();
  if (t.length > 40) throw bad("Étiquette de campagne trop longue (40 caractères au plus).");
  return t;
}
const parseTags = (raw) => { try { const v = JSON.parse(raw || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; } };

// keys : ["e:12", "s:3"] ; op : add | remove
function tagCampaigns(ctx, keys, tag, op = "add") {
  checkCtx(ctx);
  const name = cleanTag(tag);
  if (!name) throw bad("Nom de l'étiquette obligatoire.");
  const list = parseKeys(keys);
  if (!list.length) throw bad("Cochez au moins une campagne.");
  let changed = 0;
  for (const { channel, id } of list) {
    const table = channel === "sms" ? "mk_sms_campaigns" : "mk_campaigns";
    const row = ctx.db.prepare(`SELECT report_tags FROM ${table} WHERE id = ? AND organization_id = ? AND kind = 'campaign'`).get(id, ctx.organizationId);
    if (!row) continue;
    const tags = parseTags(row.report_tags);
    const has = tags.some((t) => t.toLowerCase() === name.toLowerCase());
    let next = tags;
    if (op === "remove") { if (!has) continue; next = tags.filter((t) => t.toLowerCase() !== name.toLowerCase()); }
    else { if (has) continue; if (tags.length >= MAX_TAGS) throw bad(`Une campagne porte ${MAX_TAGS} étiquettes au plus.`); next = [...tags, name]; }
    ctx.db.prepare(`UPDATE ${table} SET report_tags = ? WHERE id = ? AND organization_id = ?`).run(JSON.stringify(next), id, ctx.organizationId);
    changed++;
  }
  audit(ctx, op === "remove" ? "campaign.report_tag_removed" : "campaign.report_tag_added", "campaign", null, { tag: name, campaigns: changed });
  return changed;
}

// ---------- Filtres ----------
function parseKeys(raw) {
  const arr = Array.isArray(raw) ? raw : raw === undefined || raw === null || raw === "" ? [] : String(raw).split(",");
  const out = [];
  for (const k of arr) {
    const m = /^(e|s):(\d{1,12})$/.exec(String(k).trim());
    if (m && !out.some((o) => o.key === m[0])) out.push({ key: m[0], channel: m[1] === "s" ? "sms" : "email", id: Number(m[2]) });
  }
  return out.slice(0, MAX_COMPARE);
}

// Filtres saisis (requête ou rapport enregistré) → filtres propres. Jamais d'exception pour une saisie incohérente :
// une valeur invalide revient à sa valeur par défaut (la page reste utilisable), sauf une période inversée (signalée).
function normalizeFilters(ctx, raw = {}) {
  const tz = orgTimeZone(ctx);
  const today = localYmd(nowOf(ctx), tz);
  let to = validYmd(String(raw.to || "")) ? String(raw.to) : today;
  let from = validYmd(String(raw.from || "")) ? String(raw.from) : ymdPlus(to, -(DEFAULT_DAYS - 1));
  let warning = "";
  if (from > to) { [from, to] = [to, from]; warning = "La date de début était après la date de fin : elles ont été inversées."; }
  const channel = Object.hasOwn(CHANNELS, raw.channel) ? raw.channel : "all";
  const target = /^(list|segment):\d{1,12}$|^sms-all$/.test(String(raw.target || "")) ? String(raw.target) : "";
  const groupBy = Object.hasOwn(GROUPS, raw.groupBy) ? raw.groupBy : "campaign";
  const metric = Object.hasOwn(METRICS, raw.metric) ? raw.metric : "clickRate";
  let tag = "";
  try { tag = cleanTag(raw.tag); } catch { tag = ""; }
  const q = String(raw.q ?? "").replace(/\p{Cc}/gu, "").trim().slice(0, 80);
  const ids = parseKeys(raw.ids).map((k) => k.key);
  return { from, to, channel, target, groupBy, metric, tag, q, ids, tz, warning };
}
// Filtres → paramètres d'adresse (lien partageable, rapport enregistré)
function filtersToQuery(f) {
  const p = new URLSearchParams();
  for (const k of ["from", "to", "channel", "target", "groupBy", "metric", "tag", "q"]) if (f[k]) p.set(k, f[k]);
  if (f.ids && f.ids.length) p.set("ids", f.ids.join(","));
  return p.toString();
}

// ---------- Lignes (une par campagne) ----------
function names(ctx, table) {
  return new Map(ctx.db.prepare(`SELECT id, name FROM ${table} WHERE organization_id = ?`).all(ctx.organizationId).map((r) => [r.id, r.name]));
}

function campaignRows(ctx, f) {
  const startMs = zonedToUtc(f.from, 0, 0, f.tz);
  const endMs = zonedToUtc(ymdPlus(f.to, 1), 0, 0, f.tz);
  const lists = names(ctx, "mk_lists");
  const segs = names(ctx, "mk_segments");
  const targetLabel = (type, id) => (type === "all" ? "Tous les abonnés SMS" : type === "list" ? `Liste « ${lists.get(id) ?? "supprimée"} »` : `Segment « ${segs.get(id) ?? "supprimé"} »`);
  const targetKey = (type, id) => (type === "all" ? "sms-all" : `${type}:${id}`);
  const rows = [];

  if (f.channel !== "sms") {
    const revenue = new Map(ctx.db.prepare("SELECT campaign_id, COUNT(*) orders, SUM(amount_cents) cents FROM mk_order_attributions WHERE organization_id = ? AND campaign_id IS NOT NULL GROUP BY campaign_id").all(ctx.organizationId).map((r) => [r.campaign_id, r]));
    const hid = require("../visibility").notHiddenSql(ctx.hiddenSites, "site_id"); // R4 : campagnes des sites dont la personne ne peut pas lire les éléments, exclues
    for (const c of ctx.db
      .prepare(`SELECT * FROM mk_campaigns WHERE organization_id = ? AND kind = 'campaign' AND status = 'sent' AND finished_at >= ? AND finished_at < ? AND ${hid.sql} ORDER BY finished_at DESC LIMIT ?`)
      .all(ctx.organizationId, startMs, endMs, ...hid.params, MAX_ROWS + 1)) {
      const r = revenue.get(c.id) || { orders: 0, cents: 0 };
      rows.push({
        key: `e:${c.id}`, channel: "email", id: c.id, name: c.name, at: c.started_at || c.finished_at, finishedAt: c.finished_at,
        target: targetKey(c.target_type, c.target_id), targetLabel: targetLabel(c.target_type, c.target_id), tags: parseTags(c.report_tags),
        sums: { sent: c.sent_count, emailSent: c.sent_count, delivered: c.delivered_count, opens: c.unique_open_count, clicks: c.unique_click_count, bounced: c.bounced_count, complained: c.complained_count, unsubscribed: c.unsubscribed_count, orders: r.orders, revenueCents: r.cents || 0 },
        link: `/marketing/campagnes/${c.id}`,
      });
    }
  }
  if (f.channel !== "email") {
    for (const c of ctx.db
      .prepare(`SELECT * FROM mk_sms_campaigns WHERE organization_id = ? AND kind = 'campaign' AND status = 'sent' AND finished_at >= ? AND finished_at < ? ORDER BY finished_at DESC LIMIT ?`)
      .all(ctx.organizationId, startMs, endMs, MAX_ROWS + 1)) {
      rows.push({
        key: `s:${c.id}`, channel: "sms", id: c.id, name: c.name, at: c.started_at || c.finished_at, finishedAt: c.finished_at,
        target: targetKey(c.target_type, c.target_id), targetLabel: targetLabel(c.target_type, c.target_id), tags: parseTags(c.report_tags),
        sums: { sent: c.sent_count, emailSent: 0, delivered: c.delivered_count, opens: 0, clicks: c.click_count, bounced: 0, complained: 0, unsubscribed: c.unsubscribe_count, orders: 0, revenueCents: 0, segments: c.segments_count },
        link: `/marketing/sms/campagnes/${c.id}`,
      });
    }
  }
  const qLow = f.q.toLowerCase();
  const filtered = rows
    .filter((r) => !f.target || r.target === f.target)
    .filter((r) => !f.tag || r.tags.some((t) => t.toLowerCase() === f.tag.toLowerCase()))
    .filter((r) => !qLow || r.name.toLowerCase().includes(qLow))
    .sort((a, b) => b.at - a.at || b.key.localeCompare(a.key));
  return { rows: filtered.slice(0, MAX_ROWS), truncated: filtered.length > MAX_ROWS };
}

// Taux d'un ensemble de sommes (une campagne ou un groupe)
function ratesOf(s) {
  return {
    sent: s.sent,
    deliveryRate: pct(s.delivered, s.sent),
    openRate: pct(s.opens, s.emailSent),
    clickRate: pct(s.clicks, s.sent),
    clickToOpen: pct(s.clicks - (s.smsClicks || 0), s.opens),
    bounceRate: pct(s.bounced, s.emailSent),
    unsubscribeRate: pct(s.unsubscribed, s.sent),
    complaintRate: pct(s.complained, s.emailSent),
    revenueCents: s.revenueCents,
    revenuePerSent: s.emailSent > 0 ? Math.round(s.revenueCents / s.emailSent) : null,
  };
}
const ZERO = () => ({ sent: 0, emailSent: 0, delivered: 0, opens: 0, clicks: 0, smsClicks: 0, bounced: 0, complained: 0, unsubscribed: 0, orders: 0, revenueCents: 0, campaigns: 0 });
function add(acc, r) {
  for (const k of ["sent", "emailSent", "delivered", "opens", "clicks", "bounced", "complained", "unsubscribed", "orders", "revenueCents"]) acc[k] += r.sums[k] || 0;
  if (r.channel === "sms") acc.smsClicks += r.sums.clicks;
  acc.campaigns += 1;
  return acc;
}

// Clé(s) et libellé(s) de groupe d'une campagne (une campagne à plusieurs étiquettes compte dans chacune)
function groupsOf(r, by, tz) {
  switch (by) {
    case "month": { const ymd = localYmd(r.at, tz); return [[ymd.slice(0, 7), `${MONTHS[Number(ymd.slice(5, 7)) - 1]} ${ymd.slice(0, 4)}`]]; }
    case "weekday": { const d = (new Date(`${localYmd(r.at, tz)}T00:00:00Z`).getUTCDay() + 6) % 7; return [[String(d), WEEKDAYS[d]]]; }
    case "hour": { const h = localHour(r.at, tz); return [[String(h).padStart(2, "0"), `${h} h – ${(h + 1) % 24} h`]]; }
    case "target": return [[r.target, r.targetLabel]];
    case "channel": return [[r.channel, CHANNELS[r.channel]]];
    case "tag": return r.tags.length ? r.tags.map((t) => [`t:${t.toLowerCase()}`, t]) : [["t:", "Sans étiquette"]];
    default: return [[r.key, r.name]];
  }
}

// Meilleure valeur de chaque taux parmi les lignes (au moins 2 lignes avec une valeur) : mise en avant dans le tableau
function bestOf(lines) {
  const best = {};
  for (const [k, m] of Object.entries(METRICS)) {
    const vals = lines.map((l) => l.metrics[k]).filter((v) => v !== null && v !== undefined);
    if (vals.length < 2 || m.kind === "count") continue;
    const target = m.lowerIsBetter ? Math.min(...vals) : Math.max(...vals);
    if (vals.some((v) => v !== target)) best[k] = target;
  }
  return best;
}

function compareReport(ctx, rawFilters = {}) {
  checkCtx(ctx);
  const f = normalizeFilters(ctx, rawFilters);
  const { rows, truncated } = campaignRows(ctx, f);
  const selected = f.ids.length ? rows.filter((r) => f.ids.includes(r.key)) : rows;
  let lines;
  if (f.groupBy === "campaign") {
    lines = selected.map((r) => ({ key: r.key, label: r.name, channel: r.channel, link: r.link, at: r.at, targetLabel: r.targetLabel, tags: r.tags, campaigns: 1, sums: r.sums, metrics: ratesOf({ ...ZERO(), ...r.sums, smsClicks: r.channel === "sms" ? r.sums.clicks : 0 }) }));
  } else {
    const groups = new Map();
    for (const r of selected) {
      for (const [key, label] of groupsOf(r, f.groupBy, f.tz)) {
        if (!groups.has(key)) groups.set(key, { key, label, acc: ZERO() });
        add(groups.get(key).acc, r);
      }
    }
    lines = [...groups.values()].sort((a, b) => a.key.localeCompare(b.key, "fr", { numeric: true })).map((g) => ({ key: g.key, label: g.label, campaigns: g.acc.campaigns, sums: g.acc, metrics: ratesOf(g.acc) }));
  }
  const total = selected.reduce(add, ZERO());
  return {
    filters: f, query: filtersToQuery(f), rows, truncated, selectedCount: selected.length, lines,
    totals: { campaigns: total.campaigns, sums: total, metrics: ratesOf(total) }, best: bestOf(lines),
    chart: lines.slice(0, 20).map((l) => ({ label: l.label, value: l.metrics[f.metric] })),
    tags: [...new Set(rows.flatMap((r) => r.tags))].sort((a, b) => a.localeCompare(b, "fr")),
    hasEmail: selected.some((r) => r.channel === "email"), hasSms: selected.some((r) => r.channel === "sms"),
  };
}

// ---------- Export CSV (séparateur « ; », cellules neutralisées contre les formules) ----------
function toCsv(report) {
  const cell = (v) => { const s = String(v ?? ""); const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s; return /[";\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe; };
  const rate = (v) => (v === null || v === undefined ? "" : String(v).replace(".", ","));
  const money = (c) => (c === null || c === undefined ? "" : (c / 100).toFixed(2).replace(".", ","));
  const byCampaign = report.filters.groupBy === "campaign";
  const head = [GROUPS[report.filters.groupBy], ...(byCampaign ? ["Canal", "Date", "Audience", "Étiquettes"] : ["Campagnes"]), "Envoyés", "Remis", "Ouvertures uniques", "Clics uniques", "Rebonds", "Désinscriptions", "Plaintes", "Commandes",
    "Taux de remise (%)", "Taux d'ouverture (%)", "Taux de clic (%)", "Clics / ouvertures (%)", "Taux de rebond (%)", "Taux de désinscription (%)", "Taux de plainte (%)", "Revenus (€)", "Revenu par envoi (€)"];
  const lines = report.lines.map((l) => [
    l.label, ...(byCampaign ? [CHANNELS[l.channel], localYmd(l.at, report.filters.tz), l.targetLabel, l.tags.join(", ")] : [l.campaigns]),
    l.sums.sent, l.sums.delivered, l.sums.opens, l.sums.clicks, l.sums.bounced, l.sums.unsubscribed, l.sums.complained, l.sums.orders,
    rate(l.metrics.deliveryRate), rate(l.metrics.openRate), rate(l.metrics.clickRate), rate(l.metrics.clickToOpen), rate(l.metrics.bounceRate), rate(l.metrics.unsubscribeRate), rate(l.metrics.complaintRate), money(l.metrics.revenueCents), money(l.metrics.revenuePerSent),
  ]);
  return "﻿" + [head, ...lines].map((l) => l.map(cell).join(";")).join("\r\n");
}

// ---------- Rapports enregistrés ----------
const DEF_KEYS = ["from", "to", "channel", "target", "groupBy", "metric", "tag", "q", "ids"];
function listSavedReports(ctx) {
  checkCtx(ctx);
  return ctx.db.prepare("SELECT id, name, definition, updated_at FROM mk_saved_reports WHERE organization_id = ? ORDER BY name").all(ctx.organizationId).map((r) => ({ ...r, definition: JSON.parse(r.definition || "{}") }));
}
function getSavedReport(ctx, id) {
  checkCtx(ctx);
  const r = Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_saved_reports WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null;
  return r ? { ...r, definition: JSON.parse(r.definition || "{}") } : null;
}
// Même nom = mise à jour (on ré-enregistre un rapport en le renommant pareil) ; les filtres sont normalisés avant stockage
function saveReport(ctx, { name, filters }) {
  checkCtx(ctx);
  const clean = cleanText(name, { max: 80, field: "name" });
  if (!clean) throw bad("Donnez un nom au rapport.");
  const f = normalizeFilters(ctx, filters);
  const def = Object.fromEntries(DEF_KEYS.map((k) => [k, f[k]]));
  // Période glissante : si la fin est « aujourd'hui », le rapport garde sa DURÉE et se recale à chaque ouverture
  if (f.to === localYmd(nowOf(ctx), f.tz)) { def.rollingDays = Math.round((Date.UTC(...f.to.split("-").map((v, i) => Number(v) - (i === 1 ? 1 : 0))) - Date.UTC(...f.from.split("-").map((v, i) => Number(v) - (i === 1 ? 1 : 0)))) / DAY) + 1; delete def.from; delete def.to; }
  const existing = ctx.db.prepare("SELECT id FROM mk_saved_reports WHERE organization_id = ? AND name = ?").get(ctx.organizationId, clean);
  if (existing) {
    ctx.db.prepare("UPDATE mk_saved_reports SET definition = ?, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(def), existing.id);
    audit(ctx, "report.updated", "report", existing.id, { name: clean });
    return { id: existing.id, updated: true };
  }
  const id = Number(ctx.db.prepare("INSERT INTO mk_saved_reports (organization_id, name, definition, created_by) VALUES (?, ?, ?, ?)").run(ctx.organizationId, clean, JSON.stringify(def), ctx.userId ?? null).lastInsertRowid);
  audit(ctx, "report.created", "report", id, { name: clean });
  return { id, updated: false };
}
// Définition enregistrée → filtres du jour (période glissante recalculée)
function filtersOfSaved(ctx, saved) {
  const d = { ...saved.definition };
  if (Number.isInteger(d.rollingDays) && d.rollingDays > 0) {
    const today = localYmd(nowOf(ctx), orgTimeZone(ctx));
    d.to = today; d.from = ymdPlus(today, -(d.rollingDays - 1));
  }
  return d;
}
function deleteSavedReport(ctx, id) {
  const r = getSavedReport(ctx, id);
  if (!r) throw new MarketingError("not_found", "Rapport introuvable.");
  ctx.db.prepare("DELETE FROM mk_saved_reports WHERE id = ? AND organization_id = ?").run(id, ctx.organizationId);
  audit(ctx, "report.deleted", "report", id, { name: r.name });
  return r;
}

module.exports = {
  CHANNELS, GROUPS, METRICS, MAX_TAGS, MAX_COMPARE, compareReport, normalizeFilters, filtersToQuery, toCsv, tagCampaigns, parseKeys,
  listSavedReports, getSavedReport, saveReport, filtersOfSaved, deleteSavedReport,
};
