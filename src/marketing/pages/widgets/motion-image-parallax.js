// Motion Studio, lot « v » : parallaxe d'image. L'image, un peu plus grande que son cadre, glisse plus lentement que la page (animation liée au défilement).
// Repli : sans JavaScript, avec « réduire les animations » ou sur un écran où l'effet est coupé, l'image est fixe, recadrée (object-fit: cover).
module.exports = {
  type: "motionimageparallax", template: "motion-image-parallax", label: "Parallaxe d'image", group: "advanced", icon: "image", version: 1, style: "box", status: "operational",
  description: "Une image qui glisse doucement dans son cadre pendant le défilement de la page",
  keywords: "parallaxe parallax image defilement scroll profondeur arriere plan photo bandeau animation motion",
  schema: [
    { key: "image", kind: "image", label: "Image" },
    { key: "alt", kind: "text", label: "Description de l'image (vide = image décorative)", max: 200, default: "" },
    { key: "ratio", kind: "select", label: "Format du cadre", options: [["16-9", "16:9 (large)"], ["4-3", "4:3"], ["3-2", "3:2"], ["1-1", "Carré"], ["3-4", "3:4 (portrait)"], ["21-9", "21:9 (panoramique)"]], default: "21-9" },
    { key: "caption", kind: "text", label: "Légende (facultative)", max: 160, default: "" },
  ],
  motion: {
    module: "image-parallax",
    defaults: { trigger: "scroll", duration: 1000, easing: "linear" },
    controls: ["scrub"],
    params: [
      { key: "depth", kind: "number", label: "Profondeur du mouvement (%)", min: 3, max: 40, default: 15 },
      { key: "reverse", kind: "bool", label: "Sens inversé (l'image monte au lieu de descendre)", default: false },
    ],
  },
};
