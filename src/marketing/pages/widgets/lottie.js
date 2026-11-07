// Animation Lottie : une animation vectorielle (fichier .json exporté d'After Effects / LottieFiles) lue par lottie-web (version « light », SVG, sans
// expressions : une animation ne peut pas exécuter de code). La bibliothèque est hébergée avec le site (public/js/vendor) et chargée seulement quand
// l'animation approche de l'écran. « Réduire les animations » : on affiche la première image, sans lecture.
module.exports = {
  type: "lottie", label: "Animation Lottie", group: "advanced", icon: "play", version: 1, style: "box", status: "operational",
  description: "Une animation vectorielle Lottie (fichier .json), lue à l'arrivée à l'écran, au survol ou au clic",
  keywords: "lottie animation json after effects lottiefiles vectorielle svg bodymovin",
  dependencies: ["Adresse d'un fichier .json : https:// (le site qui l'héberge doit autoriser la lecture depuis d'autres sites, comme LottieFiles) ou chemin du site"],
  schema: [
    { key: "src", kind: "link", label: "Adresse du fichier .json de l'animation" },
    { key: "alt", kind: "text", label: "Description de l'animation (lue par les lecteurs d'écran)", max: 160, required: true, default: "Animation" },
    { key: "trigger", kind: "select", label: "Démarrage", options: [["viewport", "En arrivant à l'écran"], ["load", "Au chargement de la page"], ["hover", "Au survol"], ["click", "Au clic"]], default: "viewport" },
    { key: "loop", kind: "bool", label: "En boucle", default: true },
    { key: "speed", kind: "number", label: "Vitesse (1 = normale)", min: 0.25, max: 4, default: 1 },
    { key: "height", kind: "number", label: "Hauteur (px, 0 = selon l'animation)", min: 0, max: 900, integer: true, default: 240 },
    { key: "align", kind: "select", label: "Alignement", options: [["center", "Centré"], ["left", "À gauche"], ["right", "À droite"]], default: "center" },
  ],
  // Brouillon : l'adresse peut être vide (contenu de départ) ; saisie, elle doit viser un fichier .json. La publication exige une adresse (complete).
  validate(p, at, h) {
    if (p.src && !/\.json(\?[^\s"'<>]*)?$/i.test(p.src)) throw new Error(`${at} : l'adresse doit être celle d'un fichier .json (ex. https://assets.exemple.com/animation.json).`);
    // Correctif (lot « v ») : un fichier de la médiathèque doit appartenir à l'organisation et au site de la page (avant : n'importe quelle organisation)
    if (p.src && /^\/uploads\/marketing\//.test(p.src)) require("../motionVisual").checkMediaPath(p.src, h, at, { type: "lottie" });
  },
  complete(p) { return p.src ? "" : "indiquez l'adresse du fichier .json de l'animation."; },
};
