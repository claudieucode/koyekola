// Motion Studio, lot d : comparaison de données (deux séries côte à côte, avec l'écart calculé). Exécution : public/js/motion-studio/compare.js
const TONES = [["primary", "Principale"], ["secondary", "Secondaire"], ["accent", "Accent"], ["success", "Succès"], ["warning", "Attention"], ["error", "Erreur"]];
module.exports = {
  type: "motioncompare", template: "motion-compare", label: "Comparaison de données", group: "advanced", icon: "arrowRightLeft", version: 1, style: "text", status: "operational",
  description: "Deux séries de chiffres comparées ligne à ligne, avec barres animées et écart calculé",
  keywords: "comparaison comparer donnees avant apres deux series barres ecart evolution pourcentage versus data comparison",
  schema: [
    { key: "title", kind: "text", label: "Titre (facultatif)", max: 120, default: "Résultats : avant et après" },
    { key: "nameA", kind: "text", label: "Nom de la première série", max: 40, required: true, default: "Avant" },
    { key: "nameB", kind: "text", label: "Nom de la deuxième série", max: 40, required: true, default: "Après" },
    { key: "items", kind: "items", label: "Lignes à comparer", min: 1, max: 12,
      default: [{ label: "Visiteurs", a: 1200, b: 1800 }, { label: "Inscriptions", a: 140, b: 260 }, { label: "Ventes", a: 35, b: 31 }],
      fields: [
        { key: "label", kind: "text", label: "Libellé de la ligne", max: 60, required: true, default: "Indicateur" },
        { key: "a", kind: "number", label: "Valeur de la première série (0 ou plus)", min: 0, max: 1000000000, default: 100 },
        { key: "b", kind: "number", label: "Valeur de la deuxième série (0 ou plus)", min: 0, max: 1000000000, default: 150 },
      ] },
    { key: "unit", kind: "text", label: "Unité après les valeurs", max: 10, default: "" },
    { key: "decimals", kind: "select", label: "Décimales affichées", options: [["0", "Aucune"], ["1", "Une"], ["2", "Deux"]], default: "0" },
    { key: "scale", kind: "select", label: "Échelle des barres", options: [["shared", "Commune à toutes les lignes"], ["row", "Propre à chaque ligne"]], default: "shared" },
    { key: "showDelta", kind: "bool", label: "Afficher l'écart en pourcentage", default: true },
    { key: "better", kind: "select", label: "Une hausse est", options: [["up", "Favorable (vert)"], ["down", "Défavorable (rouge)"], ["none", "Neutre"]], default: "up" },
    { key: "toneA", kind: "select", label: "Couleur de la première série", options: TONES, default: "secondary" },
    { key: "toneB", kind: "select", label: "Couleur de la deuxième série", options: TONES, default: "primary" },
  ],
  motion: {
    module: "compare",
    presets: [["grow", "Remplissage"], ["grow-fade", "Remplissage avec fondu"]],
    defaults: { preset: "grow", trigger: "viewport", duration: 1000, delay: 0, easing: "smooth", stagger: 140 },
    controls: ["preset", "trigger", "duration", "delay", "easing", "stagger", "repeat", "scrub"],
  },
};
