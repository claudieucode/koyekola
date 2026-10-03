// Rapports SEO téléchargeables (CSV pour un tableur, JSON pour un outil) : construits à la demande depuis la base,
// uniquement avec des données réellement enregistrées. Aucun secret (clés Google) n'est jamais exporté.
const { db } = require("./store");
const audit = require("./audit");
const settings = require("./settings");
const redirects = require("./redirects");
const notfound = require("./notfound");
const sitemap = require("./sitemap");
const integrations = require("./integrations");
const jobs = require("./jobs");
const { BY_ID, SEVERITIES, CATEGORIES } = require("./rules");

const cell = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (header, rows) => `${[header, ...rows].map((r) => r.map(cell).join(",")).join("\n")}\n`;

function auditRows(id, { category = "" } = {}) {
  return audit.issuesOf(id, { category }).map((i) => ({
    gravite: SEVERITIES[i.severity] ? SEVERITIES[i.severity].label : i.severity, categorie: CATEGORIES[i.category] || i.category,
    regle: i.rule_id, probleme: BY_ID[i.rule_id] ? BY_ID[i.rule_id].title : i.rule_id, adresse: i.path, detail: i.detail, corrige_le: i.fixed_at || "",
  }));
}
function auditCsv(id, opts = {}) {
  const rows = auditRows(id, opts);
  return csv(["gravité", "catégorie", "règle", "problème", "adresse", "détail", "corrigé le"], rows.map((r) => Object.values(r)));
}
function notFoundCsv() {
  return csv(["adresse", "visites humaines", "visites de robots", "première fois", "dernière fois", "page d'origine", "ignorée"],
    notfound.list({ filter: "all", limit: 5000 }).concat(notfound.list({ filter: "ignored", limit: 5000 })).map((r) => [r.path, r.hits_human, r.hits_bot, r.first_seen, r.last_seen, r.last_referrer, r.ignored ? "oui" : "non"]));
}
function changesCsv() {
  const rows = db.prepare("SELECT c.*, u.username FROM seo_changes c LEFT JOIN users u ON u.id = c.user_id ORDER BY c.id DESC LIMIT 10000").all();
  return csv(["date (UTC)", "élément", "identifiant", "champ", "avant", "après", "par", "origine"], rows.map((r) => [r.created_at, r.entity_type, r.entity_key, r.field, r.old_value, r.new_value, r.username || "", r.source]));
}
function pagespeedCsv() {
  return csv(["date (UTC)", "adresse", "appareil", "performance", "LCP (ms)", "CLS", "TBT (ms)", "LCP réel (ms)", "INP réel (ms)", "CLS réel", "erreur"],
    integrations.pageSpeedHistory(1000).map((r) => {
      const d = r.data;
      return [r.fetched_at, r.url, r.strategy, d ? d.performance : "", d ? d.lab.lcp : "", d ? d.lab.cls : "", d ? d.lab.tbt : "", d && d.field.lcp ? d.field.lcp.value : "", d && d.field.inp ? d.field.inp.value : "", d && d.field.cls ? d.field.cls.value / 100 : "", r.error || ""];
    }));
}

// Synthèse complète : état réel de chaque partie du SEO, valeurs absentes = null (jamais estimées)
function summary() {
  const last = audit.latest();
  const a = last ? audit.get(last.id) : null;
  const counts = a ? db.prepare("SELECT severity, category, COUNT(*) n FROM seo_issues WHERE audit_id = ? AND fixed_at IS NULL GROUP BY severity, category").all(a.id) : [];
  const map = sitemap.entries();
  const st = settings.all();
  return {
    generated_at: new Date().toISOString(),
    site_url: process.env.SITE_URL || null,
    settings: { site_name: st.site_name, title_template: st.title_template, organization: { type: st.org_type, name: st.org_name, logo: st.org_logo || null, social_profiles: st.social_profiles }, publish_guard: st.publish_guard, index_blog_tags: st.index_blog_tags, index_authors: st.index_authors },
    latest_audit: a ? {
      id: a.id, finished_at: a.finished_at, pages: a.pages, open_issues: counts.reduce((s, c) => s + c.n, 0), scores: a.scores,
      by_severity: counts.reduce((o, c) => ({ ...o, [c.severity]: (o[c.severity] || 0) + c.n }), {}),
      by_category: counts.reduce((o, c) => ({ ...o, [c.category]: (o[c.category] || 0) + c.n }), {}),
    } : null,
    sitemap: { included: map.included.length, excluded: map.excluded.length },
    redirects: { total: redirects.list().length, chains: redirects.chains().length },
    not_found: notfound.stats(),
    integrations: Object.fromEntries(Object.keys(integrations.NAMES).map((n) => { const s = integrations.status(n); return [n, { state: s.state, label: s.label }]; })),
    pagespeed_latest: (integrations.pageSpeedHistory(1).find((r) => r.ok) || {}).data || null,
    jobs: jobs.list().map((j) => ({ name: j.name, frequency: j.frequency, hour_utc: j.hour, last_run_at: j.last_run_at, last_status: j.last_status, last_message: j.last_message, next_run_at: j.next_run_at })),
  };
}

module.exports = { auditRows, auditCsv, notFoundCsv, changesCsv, pagespeedCsv, summary, csv };
