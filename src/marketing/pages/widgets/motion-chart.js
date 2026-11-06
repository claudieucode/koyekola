// Motion Studio, lot d : graphique animé (barres, ligne ou anneau) dessiné en SVG / HTML à partir d'un tableau de données éditable.
// Données accessibles : le tableau est toujours présent dans la page (visible si on le demande, sinon réservé aux lecteurs d'écran). Exécution : public/js/motion-studio/chart.js
const TONES = [["primary", "Principale"], ["secondary", "Secondaire"], ["accent", "Accent"], ["success", "Succès"], ["warning", "Attention"], ["error", "Erreur"]];
module.exports = {
  type: "motionchart", template: "motion-chart", label: "Graphique animé", group: "advanced", icon: "barChart", version: 1, style: "text", status: "operational",
  description: "Un graphique en barres, en ligne ou en anneau qui se dessine, avec son tableau de données",
  keywords: "graphique graphe chart barres histogramme ligne courbe anneau donut camembert secteurs donnees statistiques tableau svg animation",
  schema: [
    { key: "title", kind: "text", label: "Titre du graphique (lu par les lecteurs d'écran)", max: 120, required: true, default: "Ventes par trimestre" },
    { key: "type", kind: "select", label: "Type", options: [["bar", "Barres"], ["line", "Ligne"], ["donut", "Anneau"]], default: "bar" },
    { key: "items", kind: "items", label: "Données (une ligne par valeur)", min: 2, max: 12,
      default: [{ label: "T1", value: 120 }, { label: "T2", value: 180 }, { label: "T3", value: 150 }, { label: "T4", value: 240 }],
      fields: [
        { key: "label", kind: "text", label: "Étiquette", max: 40, required: true, default: "Valeur" },
        { key: "value", kind: "number", label: "Valeur (0 ou plus)", min: 0, max: 1000000000, default: 100 },
      ] },
    { key: "unit", kind: "text", label: "Unité (affichée après les valeurs)", max: 10, default: "" },
    { key: "decimals", kind: "select", label: "Décimales affichées", options: [["0", "Aucune"], ["1", "Une"], ["2", "Deux"]], default: "0" },
    { key: "tone", kind: "select", label: "Couleur (barres et ligne ; l'anneau utilise plusieurs couleurs)", options: TONES, default: "primary" },
    { key: "showValues", kind: "bool", label: "Afficher les valeurs sur le graphique", default: true },
    { key: "showGrid", kind: "bool", label: "Afficher la grille et l'échelle (barres et ligne)", default: true },
    { key: "showTable", kind: "bool", label: "Afficher le tableau de données sous le graphique", default: false },
  ],
  motion: {
    module: "chart",
    presets: [["draw", "Tracé"], ["fade", "Apparition"]],
    defaults: { preset: "draw", trigger: "viewport", duration: 900, delay: 0, easing: "smooth", stagger: 80 },
    controls: ["preset", "trigger", "duration", "delay", "easing", "stagger", "repeat", "scrub"],
  },
};
