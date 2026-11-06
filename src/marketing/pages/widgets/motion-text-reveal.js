// Motion Studio, lot « t » : Révélation de texte. Même moteur de découpage que « Texte animé » (module split-text, lettres / mots / lignes, texte complet
// lisible sans JavaScript) mais des effets de RÉVÉLATION dédiés : du gris au plein (idéal avec « selon le défilement »), balayage, glissements, rotation, netteté.
// « Texte animé » (motion-split-text) reste inchangé. Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md
module.exports = {
  type: "motionrevealtext", template: "motion-text-reveal", label: "Révélation de texte", group: "advanced", icon: "type", version: 1, style: "text", status: "operational",
  description: "Un texte qui se révèle par lettres, mots ou lignes : du gris au plein, balayage, glissement, rotation",
  keywords: "revelation texte text reveal lettres mots lignes defilement gris plein balayage glissement scroll lecture progressive motion",
  schema: [
    { key: "text", kind: "textarea", label: "Texte (un retour à la ligne force un saut de ligne)", max: 600, required: true, default: "Chaque mot apparaît au rythme de votre lecture" },
    { key: "tag", kind: "select", label: "Balise HTML", options: [["h1", "Titre 1 (un seul par page)"], ["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"], ["p", "Paragraphe"], ["div", "Bloc (div)"]], default: "p" },
    { key: "split", kind: "select", label: "Révéler par", options: [["chars", "Lettres"], ["words", "Mots"], ["lines", "Lignes"]], default: "words" },
  ],
  motion: {
    module: "split-text",
    presets: [["mask-up", "Remontée masquée"], ["dim", "Du gris au plein"], ["fade-up", "Fondu montant"], ["slide-left", "Glissement depuis la gauche"], ["slide-right", "Glissement depuis la droite"], ["rotate", "Rotation"], ["wipe", "Balayage horizontal"], ["blur-in", "Netteté progressive"]],
    defaults: { preset: "mask-up", trigger: "viewport", duration: 800, delay: 0, easing: "smooth", stagger: 50 },
    controls: ["preset", "trigger", "duration", "delay", "easing", "stagger", "repeat", "scrub"],
    params: [{ key: "from", kind: "select", label: "Ordre de la révélation", options: [["start", "Du début"], ["end", "De la fin"], ["center", "Du centre"], ["random", "Au hasard"]], default: "start" }],
  },
};
