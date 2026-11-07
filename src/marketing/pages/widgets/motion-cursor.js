// Motion Studio, lot « v » : curseur personnalisé. Un point et/ou un anneau suivent la souris sur toute la page (avec inertie), grossissent sur les liens et boutons.
// Souris seulement : désactivé sur écran tactile, avec « réduire les animations » et dans l'éditeur. Le curseur du système reste visible par défaut.
// Un seul curseur par page. Le bloc lui-même n'affiche rien sur la page publiée.
module.exports = {
  type: "motioncursor", template: "motion-cursor", label: "Curseur personnalisé", group: "advanced", icon: "mousePointer", version: 1, style: "box", status: "operational",
  description: "Un curseur qui suit la souris sur toute la page (souris seulement)",
  keywords: "curseur cursor souris suiveur follow point anneau ring inertie survol effet page animation motion",
  schema: [
    { key: "look", kind: "select", label: "Apparence", options: [["dot-ring", "Point et anneau"], ["ring", "Anneau seul"], ["dot", "Point seul"]], default: "dot-ring" },
    { key: "size", kind: "number", label: "Taille de l'anneau (px)", min: 16, max: 96, integer: true, default: 36 },
    { key: "grow", kind: "number", label: "Grossissement sur les liens et boutons (× la taille)", min: 1, max: 3, step: 0.1, default: 1.6 },
    { key: "inertia", kind: "number", label: "Souplesse du suivi (0 = immédiat, 90 = très lent)", min: 0, max: 90, integer: true, default: 70 },
    { key: "blend", kind: "bool", label: "Inverser les couleurs sous le curseur", default: false },
    { key: "hideNative", kind: "bool", label: "Masquer le curseur du système (déconseillé : moins accessible)", default: false },
  ],
  motion: {
    module: "cursor",
    defaults: { duration: 200, easing: "smooth" },
    controls: [],
    preview: false,
  },
};
