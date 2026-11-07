// Motion Studio, lot « t » : Brouillage de texte (Text Scramble). Les lettres défilent au hasard puis se fixent, de gauche à droite ou dans le désordre ;
// plusieurs phrases possibles qui se remplacent. Le texte final est écrit dans la page (lisible sans JavaScript et par les lecteurs d'écran). Les espaces ne bougent pas.
// Exécution : public/js/motion-studio/text-fx.js (effet « scramble »). Le brouillage change les lettres environ 16 fois par seconde, jamais de clignotement de la page.
module.exports = {
  type: "motiontextscramble", template: "motion-text-scramble", label: "Brouillage de texte", group: "advanced", icon: "zap", version: 1, style: "text", status: "operational",
  description: "Des lettres qui défilent au hasard avant de former le texte",
  keywords: "brouillage texte scramble decode hacker matrix lettres aleatoires decryptage glitch survol titre animation",
  schema: [
    { key: "phrases", kind: "items", label: "Textes (un seul, ou plusieurs qui se remplacent)", min: 1, max: 6,
      default: [{ text: "Décodez votre message" }],
      fields: [{ key: "text", kind: "text", label: "Texte", max: 80, required: true, default: "Mon texte" }] },
    { key: "tag", kind: "select", label: "Balise HTML", options: [["h1", "Titre 1 (un seul par page)"], ["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"], ["p", "Paragraphe"], ["div", "Bloc (div)"]], default: "h2" },
  ],
  motion: {
    module: "text-fx",
    defaults: { trigger: "viewport", duration: 1400, delay: 0 },
    controls: ["trigger", "duration", "delay", "iterations", "repeat", "scrub"],
    params: [
      { key: "charset", kind: "select", label: "Caractères du brouillage", options: [["letters", "Lettres"], ["caps", "Majuscules"], ["digits", "Chiffres"], ["symbols", "Symboles"], ["binary", "Binaire (0 et 1)"]], default: "letters" },
      { key: "order", kind: "select", label: "Ordre de fixation", options: [["ltr", "De gauche à droite"], ["random", "Dans le désordre"]], default: "ltr" },
      { key: "hold", kind: "number", label: "Pause entre deux textes (ms)", min: 200, max: 20000, step: 100, default: 1500 },
    ],
  },
};
