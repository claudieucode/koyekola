// Motion Studio, lot « t » : Texte dégradé animé. Texte rempli d'un dégradé (2 à 5 couleurs du design system ou #rrggbb) qui coule ou qu'un reflet traverse
// (background-clip: text). Sans JavaScript ou en mouvement réduit : le dégradé est fixe et le texte reste lisible ; si le navigateur ne sait pas découper le fond
// en texte, la couleur du texte reste celle de la page. Exécution : public/js/motion-studio/text-fx.js (effet « gradient »). Bouton Pause (boucle sans fin).
const { cssColor } = require("../motionText");
module.exports = {
  type: "motiongradienttext", template: "motion-gradient-text", label: "Texte dégradé animé", group: "advanced", icon: "palette", version: 1, style: "text", status: "operational",
  description: "Un texte rempli d'un dégradé qui bouge ou qu'un reflet traverse",
  keywords: "texte degrade anime gradient text couleurs flux reflet shimmer background clip titre colore arc en ciel",
  schema: [
    { key: "text", kind: "text", label: "Texte", max: 200, required: true, default: "Un texte plein de couleurs" },
    { key: "tag", kind: "select", label: "Balise HTML", options: [["h1", "Titre 1 (un seul par page)"], ["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"], ["p", "Paragraphe"], ["div", "Bloc (div)"]], default: "h2" },
    { key: "colors", kind: "items", label: "Couleurs du dégradé (2 à 5)", min: 2, max: 5,
      default: [{ color: "token:primary" }, { color: "token:accent" }, { color: "token:secondary" }],
      fields: [{ key: "color", kind: "color", label: "Couleur", required: true, default: "token:primary" }] },
    { key: "highlight", kind: "color", label: "Couleur du reflet (effet « Reflet qui passe »)" },
  ],
  data(ctx, p) {
    const cs = p.colors.map((c) => cssColor(c.color)).filter(Boolean);
    return { flow: `linear-gradient(90deg, ${[...cs, cs[0]].join(", ")})`, base: `linear-gradient(90deg, ${cs.join(", ")})`, hl: cssColor(p.highlight, "#ffffff") };
  },
  motion: {
    module: "text-fx",
    presets: [["flow", "Dégradé qui coule"], ["shimmer", "Reflet qui passe"]],
    defaults: { preset: "flow", trigger: "viewport", duration: 6000, delay: 0, easing: "linear", iterations: "infinite" },
    controls: ["preset", "trigger", "duration", "delay", "easing", "iterations", "direction", "repeat"],
  },
};
