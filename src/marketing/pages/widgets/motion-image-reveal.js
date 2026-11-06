// Motion Studio, lot « v » : révélation d'image par un masque (clip-path) : balayage, iris, rideaux, diagonale.
// Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md. Exécution : public/js/motion-studio/image-reveal.js.
// Sans JavaScript, ou avec « réduire les animations » : l'image est affichée en entier (le masque n'existe que pendant l'animation).
module.exports = {
  type: "motionimagereveal", template: "motion-image-reveal", label: "Révélation d'image", group: "advanced", icon: "image", version: 1, style: "box", status: "operational",
  description: "Une image qui se dévoile par un masque : balayage, iris, rideaux ou diagonale",
  keywords: "image revelation reveal masque clip-path balayage wipe iris rideaux diagonale photo apparition animation motion",
  schema: [
    { key: "image", kind: "image", label: "Image" },
    { key: "alt", kind: "text", label: "Description de l'image (vide = image décorative)", max: 200, default: "" },
    { key: "ratio", kind: "select", label: "Format du cadre", options: [["16-9", "16:9 (large)"], ["4-3", "4:3"], ["3-2", "3:2"], ["1-1", "Carré"], ["3-4", "3:4 (portrait)"], ["21-9", "21:9 (panoramique)"]], default: "16-9" },
    { key: "caption", kind: "text", label: "Légende (facultative)", max: 160, default: "" },
    { key: "link", kind: "link", label: "Lien au clic (facultatif)" },
  ],
  motion: {
    module: "image-reveal",
    presets: [["wipe-left", "Balayage de gauche à droite"], ["wipe-right", "Balayage de droite à gauche"], ["wipe-up", "Balayage de bas en haut"], ["wipe-down", "Balayage de haut en bas"], ["iris", "Iris (cercle qui s'ouvre)"], ["curtains", "Rideaux horizontaux"], ["curtains-v", "Rideaux verticaux"], ["diagonal", "Diagonale"]],
    defaults: { preset: "wipe-left", trigger: "viewport", duration: 1000, delay: 0, easing: "smooth" },
    controls: ["preset", "trigger", "duration", "delay", "easing", "repeat", "scrub"],
    params: [{ key: "zoom", kind: "bool", label: "Léger zoom arrière pendant la révélation", default: true }],
  },
};
