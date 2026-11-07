// Motion Studio, lot d : carte de métrique (valeur qui monte, variation, mini-courbe). Exécution : public/js/motion-studio/metric.js
const TONES = [["primary", "Principale"], ["secondary", "Secondaire"], ["accent", "Accent"], ["success", "Succès"], ["warning", "Attention"], ["error", "Erreur"]];
const parseSpark = (s) => String(s || "").split(/[\s;,]+/).filter(Boolean);
module.exports = {
  type: "motionmetric", template: "motion-metric-card", label: "Carte de métrique", group: "advanced", icon: "trendingUp", version: 1, style: "box", status: "operational",
  description: "Un chiffre clé qui monte, sa variation et une mini-courbe",
  keywords: "metrique carte chiffre cle kpi indicateur variation tendance evolution sparkline mini courbe statistique valeur metric card",
  schema: [
    { key: "label", kind: "text", label: "Nom de l'indicateur", max: 80, required: true, default: "Chiffre d'affaires" },
    { key: "value", kind: "number", label: "Valeur", min: -1000000000, max: 1000000000, default: 12480 },
    { key: "decimals", kind: "select", label: "Décimales affichées", options: [["0", "Aucune"], ["1", "Une"], ["2", "Deux"]], default: "0" },
    { key: "prefix", kind: "text", label: "Texte avant la valeur (ex. $)", max: 6, default: "" },
    { key: "suffix", kind: "text", label: "Texte après la valeur (ex. €, %)", max: 10, default: "€" },
    { key: "showDelta", kind: "bool", label: "Afficher la variation", default: true },
    { key: "delta", kind: "number", label: "Variation en pourcentage (négative si baisse)", min: -100000, max: 100000, default: 12.4 },
    { key: "deltaLabel", kind: "text", label: "Période de comparaison", max: 40, default: "vs mois dernier" },
    { key: "better", kind: "select", label: "Une hausse est", options: [["up", "Favorable (vert)"], ["down", "Défavorable (rouge)"], ["none", "Neutre"]], default: "up" },
    { key: "spark", kind: "textarea", label: "Mini-courbe : valeurs séparées par des virgules (2 à 24 ; vide = pas de courbe)", max: 300, default: "12, 14, 13, 17, 16, 21, 24" },
    { key: "tone", kind: "select", label: "Couleur de la mini-courbe", options: TONES, default: "primary" },
  ],
  validate(p, where) {
    const parts = parseSpark(p.spark);
    if (!parts.length) return;
    if (parts.length < 2 || parts.length > 24 || parts.some((x) => !Number.isFinite(Number(x)) || Math.abs(Number(x)) > 1e9)) throw new Error(`${where} : la mini-courbe demande 2 à 24 nombres séparés par des virgules (ou rien pour ne pas l'afficher).`);
  },
  motion: {
    module: "metric",
    presets: [["rise", "Montée"], ["fade", "Fondu"], ["pop", "Zoom léger"]],
    defaults: { preset: "rise", trigger: "viewport", duration: 1200, delay: 0, easing: "smooth" },
    controls: ["preset", "trigger", "duration", "delay", "easing", "repeat", "scrub"],
  },
};
