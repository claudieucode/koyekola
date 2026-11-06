// Texte animé lettre par lettre (ou mot par mot) : le texte apparaît en cascade en arrivant à l'écran ou au chargement.
// Sans script, le texte est affiché entier ; « réduire les animations » et l'éditeur : texte fixe. Les lecteurs d'écran lisent la phrase entière.
module.exports = {
  type: "splittext", label: "Texte animé (lettre par lettre)", group: "advanced", icon: "type", version: 1, style: "text", status: "operational",
  description: "Un texte qui apparaît lettre par lettre ou mot par mot, avec effet, vitesse et déclencheur au choix",
  keywords: "texte anime lettre par lettre mot par mot split text cascade apparition titre effet reveal typographie animation",
  schema: [
    { key: "text", kind: "text", label: "Texte", max: 160, required: true, default: "Un texte qui apparaît lettre par lettre" },
    { key: "tag", kind: "select", label: "Balise HTML", options: [["h1", "Titre 1"], ["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"], ["p", "Paragraphe"]], default: "h2" },
    { key: "split", kind: "select", label: "Découpage", options: [["letters", "Lettre par lettre"], ["words", "Mot par mot"]], default: "letters" },
    { key: "effect", kind: "select", label: "Effet", options: [["rise", "Montée"], ["fade", "Fondu"], ["blur", "Flou"], ["slide", "Glissement latéral"], ["zoom", "Zoom"]], default: "rise" },
    { key: "stagger", kind: "number", label: "Décalage entre deux éléments (ms)", min: 10, max: 300, integer: true, default: 40 },
    { key: "duration", kind: "number", label: "Durée de chaque élément (ms)", min: 200, max: 1500, integer: true, default: 600 },
    { key: "trigger", kind: "select", label: "Démarrage", options: [["viewport", "En arrivant à l'écran"], ["load", "Au chargement de la page"]], default: "viewport" },
    { key: "align", kind: "select", label: "Alignement", options: [["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]], default: "left" },
  ],
};
