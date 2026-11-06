// Motion Studio, lot d : jauge en demi-cercle (aiguille ou arc rempli, zones colorées facultatives). Exécution : public/js/motion-studio/gauge.js
const TONES = [["primary", "Principale"], ["secondary", "Secondaire"], ["accent", "Accent"], ["success", "Succès"], ["warning", "Attention"], ["error", "Erreur"]];
module.exports = {
  type: "motiongauge", template: "motion-gauge", label: "Jauge", group: "advanced", icon: "activity", version: 1, style: "text", status: "operational",
  description: "Une jauge en demi-cercle avec aiguille ou arc, et des zones colorées",
  keywords: "jauge gauge cadran compteur aiguille demi cercle score niveau zones vitesse indicateur animation",
  schema: [
    { key: "label", kind: "text", label: "Libellé (lu par les lecteurs d'écran)", max: 80, required: true, default: "Niveau de satisfaction" },
    { key: "value", kind: "number", label: "Valeur", min: -1000000000, max: 1000000000, default: 68 },
    { key: "min", kind: "number", label: "Minimum de l'échelle", min: -1000000000, max: 1000000000, default: 0 },
    { key: "max", kind: "number", label: "Maximum de l'échelle (supérieur au minimum)", min: -1000000000, max: 1000000000, default: 100 },
    { key: "unit", kind: "text", label: "Unité affichée après la valeur", max: 12, default: "%" },
    { key: "decimals", kind: "select", label: "Décimales affichées", options: [["0", "Aucune"], ["1", "Une"], ["2", "Deux"]], default: "0" },
    { key: "mode", kind: "select", label: "Aspect", options: [["needle", "Aiguille (avec zones)"], ["fill", "Arc rempli"]], default: "needle" },
    { key: "tone", kind: "select", label: "Couleur de l'arc rempli", options: TONES, default: "primary" },
    { key: "showRange", kind: "bool", label: "Afficher le minimum et le maximum", default: true },
    { key: "zones", kind: "items", label: "Zones colorées (de la plus basse à la plus haute ; la valeur « jusqu'à » termine la zone)", min: 0, max: 6,
      default: [{ to: 40, tone: "error", name: "Faible" }, { to: 70, tone: "warning", name: "Moyen" }, { to: 100, tone: "success", name: "Bon" }],
      fields: [
        { key: "to", kind: "number", label: "Jusqu'à (valeur)", min: -1000000000, max: 1000000000, default: 100 },
        { key: "tone", kind: "select", label: "Couleur", options: TONES, default: "success" },
        { key: "name", kind: "text", label: "Nom de la zone (lu et affiché)", max: 40, default: "Zone" },
      ] },
  ],
  validate(p, where) { if (!(p.max > p.min)) throw new Error(`${where} : le maximum de l'échelle doit être supérieur au minimum.`); },
  motion: {
    module: "gauge",
    presets: [["sweep", "Balayage"], ["spring", "Aiguille avec rebond"]],
    defaults: { preset: "sweep", trigger: "viewport", duration: 1400, delay: 0, easing: "smooth" },
    controls: ["preset", "trigger", "duration", "delay", "easing", "repeat"],
  },
};
