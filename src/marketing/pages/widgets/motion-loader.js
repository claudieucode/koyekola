// Motion Studio, lot d : indicateurs de chargement (spinner, anneau, points, barres, pulsation) et squelettes (texte, carte, profil, liste).
// Animation CSS en boucle avec un vrai bouton Pause (créé par public/js/motion-studio/loader.js). Mouvement réduit : formes fixes. Exécution : loader.js
const TONES = [["primary", "Principale"], ["secondary", "Secondaire"], ["accent", "Accent"], ["success", "Succès"], ["warning", "Attention"], ["error", "Erreur"]];
module.exports = {
  type: "motionloader", template: "motion-loader", label: "Chargement et squelette", group: "advanced", icon: "clock", version: 1, style: "box", status: "operational",
  description: "Un indicateur de chargement ou un squelette (texte, carte, profil, liste) qui scintille, avec pause",
  keywords: "chargement loader spinner skeleton squelette attente patience points barres pulsation shimmer placeholder loading",
  schema: [
    { key: "variant", kind: "select", label: "Forme", options: [["spinner", "Spinner (cercle qui tourne)"], ["ring", "Anneau pulsé"], ["dots", "Trois points"], ["bars", "Barres"], ["pulse", "Pulsation"], ["skeleton-text", "Squelette : texte"], ["skeleton-card", "Squelette : carte"], ["skeleton-profile", "Squelette : profil"], ["skeleton-list", "Squelette : liste"]], default: "spinner" },
    { key: "label", kind: "text", label: "Texte lu par les lecteurs d'écran (et affiché si demandé)", max: 80, required: true, default: "Chargement en cours" },
    { key: "showLabel", kind: "bool", label: "Afficher ce texte à côté de l'indicateur", default: false },
    { key: "size", kind: "select", label: "Taille (indicateurs ronds)", options: [["sm", "Petite"], ["md", "Moyenne"], ["lg", "Grande"]], default: "md" },
    { key: "lines", kind: "number", label: "Nombre de lignes (squelettes texte, liste)", min: 1, max: 8, integer: true, default: 3 },
    { key: "tone", kind: "select", label: "Couleur", options: TONES, default: "primary" },
    { key: "pausable", kind: "bool", label: "Proposer un bouton Pause (recommandé : l'animation ne s'arrête jamais seule)", default: true },
  ],
  motion: {
    module: "loader",
    defaults: { duration: 1200 },
    controls: ["duration"],
  },
};
