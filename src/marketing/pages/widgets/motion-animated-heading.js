// Motion Studio, lot « t » : Titre animé (Animated Heading). Un titre en trois temps — texte avant, MOT MIS EN VEDETTE, texte après — où le mot est souligné,
// entouré, barré ou surligné par un tracé qui se dessine. Le tracé est écrit dans la page (visible sans JavaScript) ; le script le dessine puis le restitue.
// Distinct du widget « Titre animé » existant (mots qui défilent / machine à écrire) : ici c'est la mise en valeur d'un mot. Exécution : text-fx.js (effet « heading »).
const { cssColor } = require("../motionText");
module.exports = {
  type: "motionanimatedheading", template: "motion-animated-heading", label: "Titre à mot souligné", group: "advanced", icon: "highlighter", version: 1, style: "text", status: "operational",
  description: "Un titre dont un mot est souligné, entouré, barré ou surligné par un tracé qui se dessine",
  keywords: "titre anime animated heading headline mot souligne entoure cercle surligneur marker trait dessine zigzag vague barre accroche",
  schema: [
    { key: "before", kind: "text", label: "Texte avant", max: 120, default: "Créez des pages" },
    { key: "highlight", kind: "text", label: "Mot mis en vedette", max: 60, required: true, default: "inoubliables" },
    { key: "after", kind: "text", label: "Texte après", max: 120, default: "en quelques clics" },
    { key: "tag", kind: "select", label: "Balise HTML", options: [["h1", "Titre 1 (un seul par page)"], ["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"], ["p", "Paragraphe"], ["div", "Bloc (div)"]], default: "h2" },
    { key: "color", kind: "color", label: "Couleur du tracé (par défaut : celle du texte)" },
    { key: "thickness", kind: "select", label: "Épaisseur du tracé", options: [["thin", "Fine"], ["normal", "Normale"], ["bold", "Épaisse"]], default: "normal" },
  ],
  data(ctx, p) { return { color: cssColor(p.color) }; },
  motion: {
    module: "text-fx",
    presets: [["underline", "Soulignement"], ["double", "Double soulignement"], ["zigzag", "Zigzag"], ["curly", "Vague"], ["circle", "Cercle"], ["strike", "Barré"], ["marker", "Surligneur"]],
    defaults: { preset: "underline", trigger: "viewport", duration: 900, delay: 0, easing: "smooth" },
    controls: ["preset", "trigger", "duration", "delay", "easing", "repeat", "scrub"],
    params: [{ key: "lead", kind: "bool", label: "Faire apparaître le texte avant le tracé", default: true }],
  },
};
