// Motion Studio, lot « t » : Texte cinétique (Kinetic Typography). Des lignes de texte (liste éditable) qui entrent en mouvement : glissement alterné, rebond d'échelle,
// rotation, zoom, ou dérive latérale selon le défilement de la page. Chaque ligne peut être pleine, en contour ou en couleur d'accent. Texte complet lisible sans JavaScript.
// Exécution : public/js/motion-studio/kinetic.js. Animations sur les lignes (opacity / transform / filter), jamais sur la racine.
const { cssColor } = require("../motionText");
module.exports = {
  type: "motionkinetictext", template: "motion-kinetic-text", label: "Texte cinétique", group: "advanced", icon: "activity", version: 1, style: "text", status: "operational",
  description: "Des lignes de texte qui glissent, rebondissent, tournent ou dérivent avec le défilement",
  keywords: "texte cinetique kinetic typography lignes mots qui defilent rotation echelle zoom derive scroll slogan manifeste grand titre animation",
  schema: [
    { key: "lines", kind: "items", label: "Lignes de texte", min: 1, max: 8,
      default: [{ text: "Le mouvement", look: "solid" }, { text: "donne du", look: "outline" }, { text: "caractère", look: "accent" }],
      fields: [
        { key: "text", kind: "text", label: "Ligne", max: 60, required: true, default: "Ma ligne" },
        { key: "look", kind: "select", label: "Aspect", options: [["solid", "Plein"], ["outline", "Contour"], ["accent", "Couleur d'accent"]], default: "solid" },
      ] },
    { key: "tag", kind: "select", label: "Balise HTML", options: [["h1", "Titre 1 (un seul par page)"], ["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"], ["p", "Paragraphe"], ["div", "Bloc (div)"]], default: "h2" },
    { key: "accent", kind: "color", label: "Couleur d'accent", default: "token:primary" },
  ],
  data(ctx, p) { return { accent: cssColor(p.accent, "currentColor") }; },
  motion: {
    module: "kinetic",
    presets: [["slide", "Glissement alterné"], ["pop", "Rebond d'échelle"], ["rotate", "Rotation"], ["zoom", "Zoom depuis l'avant"], ["drift", "Dérive latérale (avec « selon le défilement »)"]],
    defaults: { preset: "slide", trigger: "viewport", duration: 800, delay: 0, easing: "smooth", stagger: 120 },
    controls: ["preset", "trigger", "duration", "delay", "easing", "stagger", "repeat", "scrub"],
    params: [
      { key: "distance", kind: "number", label: "Amplitude du glissement ou de la dérive (%)", min: 5, max: 100, step: 5, default: 30 },
      { key: "from", kind: "select", label: "Ordre des lignes", options: [["start", "Du début"], ["end", "De la fin"], ["center", "Du centre"], ["random", "Au hasard"]], default: "start" },
    ],
  },
};
