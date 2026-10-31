// Performance Regression Detector (programme 22.9). Compare deux rapports. Règles :
//  - une métrique n'est comparée que si elle est de même nature (kind), même environnement et, en laboratoire, même profil ;
//  - un seuil relatif ET un plancher absolu doivent être dépassés (une variation insignifiante ne déclenche rien) ;
//  - en laboratoire, la variabilité mesurée (étendue des relevés) doit être dépassée, sinon le constat est « incertain » et ne bloque jamais.
const DEFAULTS = Object.freeze({
  htmlGzipBytes: { rel: 0.2, abs: 5000 }, jsBytes: { rel: 0.1, abs: 10000 }, cssBytes: { rel: 0.15, abs: 8000 }, requests: { rel: 0.2, abs: 4 },
  images: { rel: 0.25, abs: 3 }, domNodes: { rel: 0.2, abs: 150 }, blockingScripts: { rel: 0, abs: 1 }, externalOrigins: { rel: 0, abs: 1 },
  lcp: { rel: 0.15, abs: 200 }, inp: { rel: 0.15, abs: 50 }, cls: { rel: 0.25, abs: 0.02 }, ttfb: { rel: 0.3, abs: 100 },
});
const LAB = new Set(["lcp", "inp", "cls", "ttfb"]);
function compare(before, after, { thresholds = {} } = {}) {
  const T = { ...DEFAULTS, ...thresholds };
  if (!before || !before.metrics || !after || !after.metrics) return { verdict: "indisponible", blocking: false, items: [], skipped: [{ metric: "*", reason: "rapport illisible ou d'un ancien format : comparaison impossible" }], regressions: [], thresholds: T };
  const items = [], skipped = [];
  for (const key of Object.keys(T)) {
    const b = before.metrics[key], a = after.metrics[key];
    if (!b || !a || b.value === null || a.value === null) { skipped.push({ metric: key, reason: "donnée indisponible dans l'un des rapports" }); continue; }
    if (b.kind !== a.kind || b.env !== a.env || (LAB.has(key) && (b.profile || "") !== (a.profile || ""))) { skipped.push({ metric: key, reason: "conditions de mesure différentes : comparaison refusée" }); continue; }
    const delta = a.value - b.value, rel = b.value === 0 ? (delta === 0 ? 0 : Infinity) : delta / b.value;
    if (delta <= 0) { items.push({ metric: key, before: b.value, after: a.value, delta, verdict: delta < 0 ? "amélioration" : "stable" }); continue; }
    const t = T[key];
    const noise = Math.max(b.spread || 0, a.spread || 0);
    const exceeds = delta >= t.abs && rel >= t.rel;
    let verdict = "stable";
    if (exceeds) verdict = LAB.has(key) && Math.min(b.samples || 0, a.samples || 0) < 3 ? "incertain" : LAB.has(key) && delta <= noise ? "incertain" : "régression";
    items.push({ metric: key, before: b.value, after: a.value, delta, relative: rel, verdict, ...(verdict === "incertain" ? { reason: noise ? "variation inférieure à la variabilité mesurée" : "moins de 3 relevés" } : {}) });
  }
  const regressions = items.filter((i) => i.verdict === "régression");
  return { verdict: regressions.length ? "régression" : items.some((i) => i.verdict === "incertain") ? "incertain" : "stable", blocking: false, items, skipped, regressions: regressions.map((r) => r.metric), thresholds: T };
}
module.exports = { compare, DEFAULTS };
