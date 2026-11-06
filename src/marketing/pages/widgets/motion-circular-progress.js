// Motion Studio, lot d : progression circulaire (anneau SVG qui se trace, nombre qui monte). Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md
// Le serveur écrit l'anneau FINAL et la valeur finale (lisibles sans JavaScript) ; public/js/motion-studio/circular.js les anime.
const TONES = [["primary", "Principale"], ["secondary", "Secondaire"], ["accent", "Accent"], ["success", "Succès"], ["warning", "Attention"], ["error", "Erreur"]];
module.exports = {
  type: "motioncircular", template: "motion-circular-progress", label: "Progression circulaire", group: "advanced", icon: "activity", version: 1, style: "text", status: "operational",
  description: "Un anneau qui se trace jusqu'à un pourcentage, avec le nombre qui monte",
  keywords: "progression circulaire anneau cercle pourcentage jauge ring circular progress score taux animation",
  schema: [
    { key: "label", kind: "text", label: "Libellé (lu par les lecteurs d'écran)", max: 80, required: true, default: "Satisfaction clients" },
    { key: "value", kind: "number", label: "Valeur (0 à 100)", min: 0, max: 100, default: 72 },
    { key: "decimals", kind: "select", label: "Décimales affichées", options: [["0", "Aucune"], ["1", "Une"]], default: "0" },
    { key: "unit", kind: "text", label: "Unité affichée après le nombre", max: 8, default: "%" },
    { key: "caption", kind: "text", label: "Texte sous l'anneau (facultatif)", max: 120, default: "" },
    { key: "showValue", kind: "bool", label: "Afficher le nombre au centre", default: true },
    { key: "size", kind: "select", label: "Taille", options: [["sm", "Petite (112 px)"], ["md", "Moyenne (160 px)"], ["lg", "Grande (220 px)"]], default: "md" },
    { key: "thickness", kind: "select", label: "Épaisseur du trait", options: [["thin", "Fine"], ["regular", "Normale"], ["thick", "Épaisse"]], default: "regular" },
    { key: "cap", kind: "select", label: "Extrémité du trait", options: [["round", "Arrondie"], ["butt", "Droite"]], default: "round" },
    { key: "tone", kind: "select", label: "Couleur du trait", options: TONES, default: "primary" },
  ],
  motion: {
    module: "circular",
    presets: [["draw", "Tracé de l'anneau"], ["grow", "Tracé avec apparition"]],
    defaults: { preset: "draw", trigger: "viewport", duration: 1200, delay: 0, easing: "smooth" },
    controls: ["preset", "trigger", "duration", "delay", "easing", "repeat"],
  },
};
