// Motion Studio : texte animé par lettres, mots ou lignes (composant de RÉFÉRENCE du lot 0 : il valide le contrat des composants).
// Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md. Exécution : public/js/motion-studio/split-text.js (via le runtime kw-motion-studio.js).
// Contenu accessible : la page publiée contient le texte COMPLET en clair ; le script le découpe en gardant une copie lisible par les lecteurs d'écran.
module.exports = {
  type: "motionsplittext", template: "motion-split-text", label: "Texte animé", group: "advanced", icon: "type", version: 1, style: "text", status: "operational",
  description: "Un texte qui se révèle lettre par lettre, mot par mot ou ligne par ligne",
  keywords: "texte anime split text lettres mots lignes revelation apparition titre animation typographie motion",
  schema: [
    { key: "text", kind: "textarea", label: "Texte (une ligne vide ou un retour à la ligne force un saut de ligne)", max: 400, required: true, default: "Des mots qui prennent vie" },
    { key: "tag", kind: "select", label: "Balise HTML", options: [["h1", "Titre 1 (un seul par page)"], ["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"], ["p", "Paragraphe"], ["div", "Bloc (div)"]], default: "h2" },
    { key: "split", kind: "select", label: "Découper par", options: [["chars", "Lettres"], ["words", "Mots"], ["lines", "Lignes"]], default: "words" },
  ],
  motion: {
    module: "split-text",
    presets: [["fade-up", "Fondu montant"], ["fade", "Fondu"], ["blur", "Netteté progressive"], ["mask-up", "Remontée masquée"], ["scale", "Zoom"], ["flip", "Bascule 3D"]],
    defaults: { preset: "fade-up", trigger: "viewport", duration: 700, delay: 0, easing: "smooth", stagger: 40 },
    controls: ["preset", "trigger", "duration", "delay", "easing", "stagger", "repeat", "scrub"],
    params: [{ key: "from", kind: "select", label: "Ordre de la cascade", options: [["start", "Du début"], ["end", "De la fin"], ["center", "Du centre"], ["random", "Au hasard"]], default: "start" }],
  },
};
