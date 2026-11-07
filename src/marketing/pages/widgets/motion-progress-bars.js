// Motion Studio, lot d : barres de progression animées multiples (compétences, objectifs, statistiques). Complète l'élément « Barre de progression » (une seule barre) sans le remplacer.
// Exécution : public/js/motion-studio/bars.js
const TONES = [["primary", "Principale"], ["secondary", "Secondaire"], ["accent", "Accent"], ["success", "Succès"], ["warning", "Attention"], ["error", "Erreur"]];
module.exports = {
  type: "motionbars", template: "motion-progress-bars", label: "Barres de progression animées", group: "advanced", icon: "barChart", version: 1, style: "text", status: "operational",
  description: "Plusieurs barres de progression qui se remplissent en cascade, avec leurs valeurs",
  keywords: "barres progression multiples competences skills objectifs pourcentages liste jauge horizontale animation cascade",
  schema: [
    { key: "items", kind: "items", label: "Barres", min: 1, max: 12,
      default: [{ label: "Design", value: 90, tone: "" }, { label: "Développement", value: 75, tone: "" }, { label: "Marketing", value: 60, tone: "" }],
      fields: [
        { key: "label", kind: "text", label: "Libellé", max: 80, required: true, default: "Compétence" },
        { key: "value", kind: "number", label: "Valeur (0 à 100)", min: 0, max: 100, default: 50 },
        { key: "tone", kind: "select", label: "Couleur de cette barre", options: [["", "Celle de l'ensemble"], ...TONES], default: "" },
      ] },
    { key: "tone", kind: "select", label: "Couleur des barres", options: TONES, default: "primary" },
    { key: "variant", kind: "select", label: "Forme", options: [["round", "Arrondie"], ["square", "Carrée"], ["thin", "Fine"], ["thick", "Épaisse"]], default: "round" },
    { key: "showValue", kind: "bool", label: "Afficher les valeurs", default: true },
    { key: "unit", kind: "text", label: "Unité après la valeur", max: 8, default: "%" },
  ],
  motion: {
    module: "bars",
    presets: [["grow", "Remplissage"], ["grow-fade", "Remplissage avec fondu"]],
    defaults: { preset: "grow", trigger: "viewport", duration: 1000, delay: 0, easing: "smooth", stagger: 120 },
    controls: ["preset", "trigger", "duration", "delay", "easing", "stagger", "repeat", "scrub"],
    params: [{ key: "from", kind: "select", label: "Ordre de la cascade", options: [["start", "De haut en bas"], ["end", "De bas en haut"], ["center", "Du centre"], ["random", "Au hasard"]], default: "start" }],
  },
};
