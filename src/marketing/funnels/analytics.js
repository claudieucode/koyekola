// Statistiques d'un tunnel (phase 8), à partir des seules données réelles :
//  - TOUS les visiteurs (anonymes, sans cookie) : visites et inscriptions de chaque page-étape (mk_landing_events).
//    L'empreinte change chaque jour : un visiteur venu deux jours compte deux fois. Ces chiffres ne permettent pas de
//    suivre une même personne d'une étape à l'autre.
//  - Le PARCOURS d'une étape à l'autre : seulement les visiteurs ayant accepté la mesure d'audience (mk_web_events).
//    Une étape compte les visiteurs qui ont aussi atteint toutes les étapes précédentes.
//  - Les VENTES d'une étape « Formation » : inscriptions et achats réels de cette formation (tables du LMS, via le pont)
//    par les comptes des visiteurs mesurés arrivés jusqu'à l'étape précédente, depuis le début de la période.
// Les conclusions ne sont données qu'au-delà d'un échantillon minimal.
const { checkCtx } = require("../audience/shared");
const { MIN_SAMPLE } = require("../pages/analytics");

const DAY = 86400000;
const pct = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : null);

function funnelReport(ctx, funnel, { days = 30, now = Date.now() } = {}) {
  checkCtx(ctx);
  const since = now - days * DAY;
  const anon = ctx.db.prepare(`SELECT COUNT(DISTINCT CASE WHEN type = 'view' THEN visitor END) visitors, SUM(type = 'signup') signups
    FROM mk_landing_events WHERE page_id = ? AND occurred_at >= ?`);
  const measured = ctx.db.prepare("SELECT DISTINCT visitor_id FROM mk_web_events WHERE organization_id = ? AND type = 'page_view' AND path = ? AND occurred_at >= ?");
  const userOf = ctx.db.prepare("SELECT c.lms_user_id FROM mk_web_visitors v JOIN mk_contacts c ON c.id = v.contact_id WHERE v.id = ? AND c.lms_user_id IS NOT NULL");
  const { courseConversions } = require("../bridge/catalog");
  let cohort = null;
  const steps = funnel.steps.map((s) => {
    const a = s.pageId ? anon.get(s.pageId, since) : null;
    const before = cohort; // visiteurs arrivés jusqu'à l'étape précédente
    const reached = new Set(s.path ? measured.all(ctx.organizationId, s.path, since).map((r) => r.visitor_id) : []);
    cohort = cohort === null ? reached : new Set([...reached].filter((v) => cohort.has(v)));
    const out = { id: s.id, name: s.name, typeLabel: s.typeLabel, anonVisitors: a ? a.visitors : null, signups: a ? a.signups || 0 : null, journey: cohort.size };
    if (["course", "order", "upsell", "downsell"].includes(s.type) && s.courseId) {
      const users = [...(before || reached)].map((v) => (userOf.get(v) || {}).lms_user_id).filter(Number.isInteger);
      out.sales = courseConversions(ctx, { courseId: s.courseId, userIds: users, since });
    }
    return out;
  });
  steps.forEach((s, i) => {
    s.fromStart = steps.length ? pct(s.journey, steps[0].journey) : null;
    s.passage = i === 0 ? null : pct(s.journey, steps[i - 1].journey);
  });
  // Étape la plus faible / la plus performante (passage d'une étape à la suivante), si l'échantillon le permet
  let worst = null, best = null;
  for (let i = 1; i < steps.length; i++) {
    if (steps[i - 1].journey < MIN_SAMPLE) continue;
    const t = { from: steps[i - 1].name, to: steps[i].name, toIndex: i, rate: steps[i].passage, lost: steps[i - 1].journey - steps[i].journey };
    if (!worst || t.rate < worst.rate) worst = t;
    if (!best || t.rate > best.rate) best = t;
  }
  if (worst && best && worst.toIndex === best.toIndex) best = null;
  if (worst && worst.lost === 0) worst = null;
  const entrants = steps.length ? steps[0].anonVisitors : null;
  const sales = steps.filter((s) => s.sales).reduce((t, s) => ({ enrolled: t.enrolled + s.sales.enrolled, buyers: t.buyers + s.sales.buyers, revenueCents: t.revenueCents + s.sales.revenueCents }), { enrolled: 0, buyers: 0, revenueCents: 0 });
  const leads = steps.reduce((n, s) => n + (s.signups || 0), 0);
  return {
    period: days, steps, minSample: MIN_SAMPLE, worst, best,
    entrants, leads, conversion: entrants ? pct(leads, entrants) : null, hasCourse: steps.some((s) => s.sales), sales,
    revenuePerVisitor: steps.length && steps[0].journey && steps.some((s) => s.sales) ? Math.round(sales.revenueCents / steps[0].journey) : null,
    measuredStart: steps.length ? steps[0].journey : 0,
    measuredEnd: steps.length ? steps[steps.length - 1].journey : 0,
    enough: steps.length > 1 && steps[0].journey >= MIN_SAMPLE,
  };
}

// Recommandation formulée à partir de l'étape la plus faible (jamais sans données suffisantes)
function recommendation(report, funnel) {
  const w = report.worst;
  if (!w) return null;
  const lostRate = Math.round((100 - w.rate) * 10) / 10;
  const target = funnel.steps[w.toIndex];
  const prev = funnel.steps[w.toIndex - 1];
  const hint = prev && ["optin", "landing", "webinar", "download"].includes(prev.type)
    ? `la page « ${w.from} » demande une inscription : testez une variante du bandeau et du formulaire (moins de champs, bénéfice plus clair).`
    : `testez une variante du bandeau et du bouton de « ${w.from} » qui mène à « ${target ? target.name : w.to} ».`;
  return `${String(lostRate).replace(".", ",")} % des visiteurs mesurés s'arrêtent entre « ${w.from} » et « ${w.to} » (${w.lost} visiteurs). Piste : ${hint}`;
}

module.exports = { funnelReport, recommendation };
