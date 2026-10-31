// Core Web Vitals (programme 22.9) : seuils OFFICIELS et étiquetage de l'origine de chaque métrique.
// Source des seuils : web.dev/articles/vitals — LCP 2,5 s / 4 s, INP 200 ms / 500 ms (INP remplace FID depuis mars 2024), CLS 0,1 / 0,25, évalués au 75ᵉ centile des visites réelles.
// Une valeur n'est JAMAIS présentée sans son origine : « mesure » (relevée), « estimation » (déduite d'une heuristique) ou « indisponible » (aucune donnée).
const VERSION = "web.dev Core Web Vitals — seuils en vigueur depuis mars 2024";
const THRESHOLDS = Object.freeze({
  lcp: Object.freeze({ good: 2500, poor: 4000, unit: "ms", label: "Largest Contentful Paint" }),
  inp: Object.freeze({ good: 200, poor: 500, unit: "ms", label: "Interaction to Next Paint" }),
  cls: Object.freeze({ good: 0.1, poor: 0.25, unit: "", label: "Cumulative Layout Shift" }),
  ttfb: Object.freeze({ good: 800, poor: 1800, unit: "ms", label: "Time to First Byte (indicatif, hors Core Web Vitals)" }),
});
const KINDS = ["mesure", "estimation", "indisponible"];
const ENVS = ["laboratoire", "terrain", "analyse-statique", "serveur"];
function rate(metric, value) {
  const t = THRESHOLDS[metric];
  if (!t || typeof value !== "number" || !Number.isFinite(value)) return "inconnu";
  return value <= t.good ? "bon" : value <= t.poor ? "à améliorer" : "mauvais";
}
// Une métrique étiquetée. `env` : où elle a été prise ; `profile` : appareil/réseau simulés (laboratoire) ; `samples` : nombre de relevés.
function metric(name, value, { kind = "mesure", env = "analyse-statique", source = "", profile = "", samples = null, note = "" } = {}) {
  if (!KINDS.includes(kind)) throw new Error(`kind inconnu : ${kind}`);
  if (!ENVS.includes(env)) throw new Error(`env inconnu : ${env}`);
  const v = kind === "indisponible" || value === null || value === undefined ? null : value;
  return { name, value: v, kind: v === null ? "indisponible" : kind, env, source, ...(profile ? { profile } : {}), ...(samples ? { samples } : {}), ...(THRESHOLDS[name] && v !== null ? { rating: rate(name, v) } : {}), ...(note ? { note } : {}) };
}
module.exports = { VERSION, THRESHOLDS, rate, metric, KINDS, ENVS };
