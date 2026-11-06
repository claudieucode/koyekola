// Motion Studio, lot « t » : Machine à écrire. Phrases multiples éditables (liste), texte fixe avant / après, curseur (barre, bloc, souligné), vitesses d'écriture
// et d'effacement, pause entre phrases. Contenu lisible sans JavaScript (première phrase affichée, les autres lisibles par les lecteurs d'écran).
// Exécution : public/js/motion-studio/text-fx.js (effet « typewriter »). Boucle sans fin : bouton Pause sur la page publiée.
module.exports = {
  type: "motiontypewriter", template: "motion-typewriter", label: "Machine à écrire", group: "advanced", icon: "keyboard", version: 1, style: "text", status: "operational",
  description: "Des phrases qui s'écrivent puis s'effacent avec un curseur clignotant",
  keywords: "machine a ecrire typewriter typing saisie curseur phrases texte qui s ecrit frappe accroche animation",
  schema: [
    { key: "prefix", kind: "text", label: "Texte avant (facultatif)", max: 80, default: "Nous créons" },
    { key: "phrases", kind: "items", label: "Phrases qui s'écrivent", min: 1, max: 8,
      default: [{ text: "des sites rapides" }, { text: "des boutiques claires" }, { text: "des formations vivantes" }],
      fields: [{ key: "text", kind: "text", label: "Phrase", max: 80, required: true, default: "Ma phrase" }] },
    { key: "suffix", kind: "text", label: "Texte après (facultatif)", max: 80, default: "" },
    { key: "tag", kind: "select", label: "Balise HTML", options: [["h1", "Titre 1 (un seul par page)"], ["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"], ["p", "Paragraphe"], ["div", "Bloc (div)"]], default: "h2" },
    { key: "cursor", kind: "select", label: "Curseur", options: [["bar", "Barre"], ["block", "Bloc"], ["underscore", "Souligné"], ["none", "Aucun"]], default: "bar" },
  ],
  motion: {
    module: "text-fx",
    defaults: { trigger: "viewport", delay: 0, iterations: "infinite" },
    controls: ["trigger", "delay", "iterations", "repeat", "scrub"],
    params: [
      { key: "speed", kind: "number", label: "Vitesse d'écriture (ms par lettre)", min: 10, max: 500, step: 5, default: 70 },
      { key: "deleteSpeed", kind: "number", label: "Vitesse d'effacement (ms par lettre)", min: 5, max: 400, step: 5, default: 35 },
      { key: "hold", kind: "number", label: "Pause une fois écrite (ms)", min: 200, max: 20000, step: 100, default: 1600 },
    ],
  },
};
