// Analytics du Site Web (phase 7), calculées UNIQUEMENT sur les visites suivies avec l'accord des visiteurs
// (mk_web_events). Chaque chiffre est un comptage réel ; aucune extrapolation à l'ensemble des visiteurs (ceux qui ont
// refusé ne sont pas comptés ici, et l'écran le dit). Les conclusions (« plus forte perte ») ne sont données qu'au-delà
// d'un échantillon minimal.
const { checkCtx } = require("../audience/shared");

const DAY = 86400000;
const MIN_SAMPLE = 30; // visiteurs au minimum au début d'une étape pour désigner une perte
const pct = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : null);

// Canal d'une visite : source utm, sinon site d'origine, sinon accès direct
const channelOf = (r) => (r.utm_source ? r.utm_source.toLowerCase() : r.referrer ? r.referrer.replace(/^www\./, "") : "Accès direct");

function audience(ctx, { days = 30, now = Date.now() } = {}) {
  checkCtx(ctx);
  const org = ctx.organizationId;
  const since = now - days * DAY;
  const one = (sql, ...a) => ctx.db.prepare(sql).get(...a);
  const visitors = one("SELECT COUNT(DISTINCT visitor_id) n FROM mk_web_events WHERE organization_id = ? AND occurred_at >= ?", org, since).n;
  const sessions = one("SELECT COUNT(*) n FROM mk_web_events WHERE organization_id = ? AND occurred_at >= ? AND type = 'session_start'", org, since).n;
  const pageViews = one("SELECT COUNT(*) n FROM mk_web_events WHERE organization_id = ? AND occurred_at >= ? AND type = 'page_view'", org, since).n;
  // Nouveaux : première visite pendant la période ; récurrents : déjà venus avant
  const nv = one(`SELECT SUM(v.first_seen >= ?) news, SUM(v.first_seen < ?) olds FROM mk_web_visitors v
    WHERE v.organization_id = ? AND v.id IN (SELECT DISTINCT visitor_id FROM mk_web_events WHERE organization_id = ? AND occurred_at >= ?)`, since, since, org, org, since);
  const converted = one("SELECT COUNT(DISTINCT visitor_id) n FROM mk_web_events WHERE organization_id = ? AND occurred_at >= ? AND type = 'form_submit'", org, since).n;

  // Provenance : par visite (début de visite), avec les visiteurs de ce canal qui ont envoyé un formulaire ensuite
  const starts = ctx.db.prepare("SELECT visitor_id, utm_source, referrer, device FROM mk_web_events WHERE organization_id = ? AND occurred_at >= ? AND type = 'session_start'").all(org, since);
  const submitters = new Set(ctx.db.prepare("SELECT DISTINCT visitor_id FROM mk_web_events WHERE organization_id = ? AND occurred_at >= ? AND type = 'form_submit'").all(org, since).map((r) => r.visitor_id));
  const bySource = new Map();
  const byDevice = new Map();
  for (const s of starts) {
    const c = channelOf(s);
    const e = bySource.get(c) || { channel: c, sessions: 0, visitors: new Set(), leads: new Set() };
    e.sessions += 1;
    e.visitors.add(s.visitor_id);
    if (submitters.has(s.visitor_id)) e.leads.add(s.visitor_id);
    bySource.set(c, e);
    const d = s.device || "inconnu";
    byDevice.set(d, (byDevice.get(d) || 0) + 1);
  }
  const sources = [...bySource.values()].map((e) => ({ channel: e.channel, sessions: e.sessions, visitors: e.visitors.size, leads: e.leads.size, conversion: pct(e.leads.size, e.visitors.size) }))
    .sort((a, b) => b.sessions - a.sessions).slice(0, 12);
  const DEVICE_LABEL = { desktop: "Ordinateur", tablet: "Tablette", mobile: "Mobile", inconnu: "Inconnu" };
  const devices = [...byDevice.entries()].map(([d, n]) => ({ device: DEVICE_LABEL[d] || d, sessions: n, share: pct(n, sessions) })).sort((a, b) => b.sessions - a.sessions);
  const topPages = ctx.db.prepare(`SELECT path, COUNT(*) views, COUNT(DISTINCT visitor_id) visitors FROM mk_web_events WHERE organization_id = ? AND occurred_at >= ? AND type = 'page_view'
    GROUP BY path ORDER BY visitors DESC, views DESC LIMIT 10`).all(org, since);
  return {
    period: days, visitors, sessions, pageViews, newVisitors: nv.news || 0, returningVisitors: nv.olds || 0,
    converted, conversion: pct(converted, visitors), sources, devices, topPages,
  };
}

// Entonnoir d'une page : arrivée → chaque section (dans l'ordre de la page en ligne) → formulaire affiché → envoyé.
// Comptage en visiteurs distincts ; « passage » = part des visiteurs de l'étape précédente.
function pageFunnel(ctx, page, { days = 30, now = Date.now() } = {}) {
  checkCtx(ctx);
  const since = now - days * DAY;
  const path = `/p/${page.slug}`;
  const rows = ctx.db.prepare("SELECT visitor_id, type, target FROM mk_web_events WHERE organization_id = ? AND path = ? AND occurred_at >= ?").all(ctx.organizationId, path, since);
  const set = (fn) => new Set(rows.filter(fn).map((r) => r.visitor_id));
  const arrived = set((r) => r.type === "page_view");
  const steps = [{ key: "arrival", label: "Arrivée sur la page", visitors: arrived }];
  const LABEL = { hero: "Bandeau", text: "Texte", image: "Image", list: "Liste", course: "Formation", button: "Bouton", quote: "Citation", form: "Formulaire", features: "Points forts", faq: "Questions fréquentes", cta: "Appel à l'action", video: "Vidéo", testimonials: "Témoignages", divider: "Séparateur", component: "Composant" };
  for (const s of page.sections || []) {
    // La section d'inscription est suivie par « Formulaire affiché » puis « envoyé » (pas d'étape en double)
    if (!s.id || s.hidden || s.type === "divider" || s.type === "form") continue;
    const reached = set((r) => r.type === "section_view" && r.target.endsWith(`:${s.id}`));
    steps.push({ key: s.id, label: s.name || (s.type === "hero" && s.title) || LABEL[s.type] || s.type, visitors: reached });
  }
  if ((page.sections || []).some((s) => s.type === "form")) {
    steps.push({ key: "form_view", label: "Formulaire affiché", visitors: set((r) => r.type === "form_view") });
    steps.push({ key: "form_submit", label: "Formulaire envoyé", visitors: set((r) => r.type === "form_submit") });
  }
  // Une étape ne compte que les visiteurs arrivés sur la page (cohérence de l'entonnoir)
  const out = steps.map((s, i) => {
    const n = [...s.visitors].filter((v) => arrived.has(v)).length;
    return { key: s.key, label: s.label, visitors: n };
  });
  out.forEach((s, i) => { s.fromStart = pct(s.visitors, out[0].visitors); s.passage = i === 0 ? null : pct(s.visitors, out[i - 1].visitors); });
  // Plus forte perte entre deux étapes consécutives, si l'échantillon le permet
  let worst = null;
  for (let i = 1; i < out.length; i++) {
    if (out[i - 1].visitors < MIN_SAMPLE) continue;
    const lost = out[i - 1].visitors - out[i].visitors;
    const rate = pct(lost, out[i - 1].visitors);
    if (rate > 0 && (!worst || rate > worst.rate)) worst = { from: out[i - 1].label, to: out[i].label, lost, rate };
  }
  return { period: days, steps: out, arrived: out[0].visitors, minSample: MIN_SAMPLE, worst, enough: out[0].visitors >= MIN_SAMPLE };
}

module.exports = { audience, pageFunnel, channelOf, MIN_SAMPLE };
