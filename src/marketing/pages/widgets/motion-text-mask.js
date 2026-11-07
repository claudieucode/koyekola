// Motion Studio, lot « t » : Texte masqué par une image ou une couleur (background-clip: text). Le texte laisse voir l'image (ou une couleur unie) ;
// l'image défile doucement, ou le remplissage se fait en balayage depuis un contour. Si l'image ne charge pas, la couleur de repli reste visible (jamais un texte invisible).
// Sans JavaScript : le texte rempli est affiché tel quel. Exécution : public/js/motion-studio/text-fx.js (effet « mask »).
const { cssColor, cssUrl } = require("../motionText");
module.exports = {
  type: "motiontextmask", template: "motion-text-mask", label: "Texte masqué par image", group: "advanced", icon: "image", version: 1, style: "text", status: "operational",
  description: "Un grand texte rempli par une image ou une couleur, avec défilement ou balayage",
  keywords: "texte masque image mask clip background clip text decoupe remplissage photo titre geant contour balayage",
  schema: [
    { key: "text", kind: "text", label: "Texte", max: 120, required: true, default: "ÉNERGIE" },
    { key: "tag", kind: "select", label: "Balise HTML", options: [["h1", "Titre 1 (un seul par page)"], ["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"], ["p", "Paragraphe"], ["div", "Bloc (div)"]], default: "h2" },
    { key: "fill", kind: "select", label: "Remplissage", options: [["color", "Couleur unie"], ["image", "Image"]], default: "color" },
    { key: "image", kind: "image", label: "Image (remplissage « Image »)" },
    { key: "color", kind: "color", label: "Couleur (ou couleur de repli sous l'image)", default: "token:primary" },
  ],
  complete(p) { return p.fill === "image" && !p.image ? "choisissez l'image qui remplit le texte (ou passez le remplissage en « Couleur unie »)." : ""; },
  data(ctx, p) {
    const c = cssColor(p.color, "currentColor"), layer = `linear-gradient(${c}, ${c})`;
    const img = p.fill === "image" && p.image ? cssUrl(p.image) : "";
    return { fill: img ? "image" : "color", bg: img ? `${img}, ${layer}` : layer, size: img ? "cover, 100% 100%" : "100% 100%" };
  },
  motion: {
    module: "text-fx",
    presets: [["wipe", "Remplissage en balayage"], ["pan", "Défilement de l'image (en boucle, aller-retour)"]],
    defaults: { preset: "wipe", trigger: "viewport", duration: 1400, delay: 0, easing: "smooth" },
    controls: ["preset", "trigger", "duration", "delay", "easing", "repeat"],
  },
};
