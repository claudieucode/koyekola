// Motion Studio, lot « v » : lecteur d'animation Lottie amélioré. Lit un fichier .json Lottie ou .lottie (dotLottie) ENVOYÉ DANS LA MÉDIATHÈQUE du site (contrôle de contenu strict
// à l'envoi : voir src/marketing/media/lottie.js). Vitesse, boucle, segment (images de début et de fin), sens, déclencheurs (arrivée à l'écran, chargement, clic, survol, défilement).
// Rendu : lottie_light.min.js (SVG, sans expressions) déjà hébergé avec le site (public/js/vendor), chargé à la demande. Les .lottie sont décompressés par le navigateur (DecompressionStream).
// Sans JavaScript, ou avec « réduire les animations » : image d'attente (facultative) ; la première image de l'animation est affichée quand le script tourne.
const V = require("../motionVisual");
module.exports = {
  type: "motionlottie", template: "motion-lottie-player", label: "Lecteur Lottie", group: "advanced", icon: "play", version: 1, style: "box", status: "operational",
  description: "Une animation Lottie (.json ou .lottie) avec vitesse, boucle, segment et déclencheurs",
  keywords: "lottie dotlottie animation json lecteur vitesse boucle segment declencheur clic survol defilement after effects vectorielle motion",
  dependencies: ["Un fichier .json Lottie ou .lottie envoyé dans Médias (Animations Lottie)"],
  schema: [
    { key: "src", kind: "link", label: "Fichier de l'animation (adresse /uploads/marketing/… du fichier envoyé dans Médias)" },
    { key: "alt", kind: "text", label: "Description de l'animation (lue par les lecteurs d'écran ; vide = décorative)", max: 200, default: "Animation" },
    { key: "poster", kind: "image", label: "Image d'attente (facultative : avant le chargement, sans JavaScript, mouvement réduit)" },
    { key: "caption", kind: "text", label: "Légende (facultative)", max: 160, default: "" },
    { key: "height", kind: "number", label: "Hauteur (px, 0 = selon l'animation)", min: 0, max: 900, integer: true, default: 280 },
    { key: "align", kind: "select", label: "Alignement", options: [["center", "Centré"], ["left", "À gauche"], ["right", "À droite"]], default: "center" },
  ],
  // L'adresse doit être un fichier Lottie de la médiathèque de CETTE organisation (et de ce site) : jamais le fichier d'une autre organisation, jamais une adresse externe
  validate(p, at, h) {
    if (!p.src) return;
    if (!/\.(json|lottie)$/i.test(p.src)) throw new Error(`${at} : l'adresse doit être celle d'un fichier .json ou .lottie.`);
    V.checkMediaPath(p.src, h, at, { type: "lottie" });
  },
  complete(p) { return p.src ? "" : "choisissez le fichier de l'animation (envoyé dans Médias)."; },
  motion: {
    module: "lottie-player",
    defaults: { trigger: "viewport", duration: 700, delay: 0, easing: "linear" },
    controls: ["trigger", "delay", "repeat", "scrub"],
    params: [
      { key: "speed", kind: "number", label: "Vitesse (1 = normale)", min: 0.25, max: 4, step: 0.25, default: 1 },
      { key: "loop", kind: "bool", label: "En boucle", default: false },
      { key: "reverse", kind: "bool", label: "Lire à l'envers", default: false },
      { key: "segStart", kind: "number", label: "Segment : image de début", min: 0, max: 36000, default: 0 },
      { key: "segEnd", kind: "number", label: "Segment : image de fin (0 = jusqu'à la fin)", min: 0, max: 36000, default: 0 },
      { key: "pausable", kind: "bool", label: "Afficher le bouton Pause (boucle)", default: true },
    ],
  },
};
