// Motion Studio (lot S) : Carrousel de logos (bande qui défile en boucle). Pause au survol, au clavier et par un bouton ; arrêté en mouvement réduit.
// Sans JavaScript ou en mouvement réduit : grille de logos qui passe à la ligne.
module.exports = {
  type: "motionlogomarquee", template: "motion-logo-marquee", label: "Bande de logos", group: "advanced", icon: "image", version: 1, style: "box", status: "operational",
  description: "Une bande de logos qui défile en boucle, en pause au survol",
  keywords: "logos defilant bande de logos marquee clients partenaires references ils nous font confiance carrousel de logos pause survol motion",
  schema: [
    { key: "label", kind: "text", label: "Nom de la bande (lu par les lecteurs d'écran)", max: 80, required: true, default: "Ils nous font confiance" },
    { key: "logos", kind: "items", label: "Logos", min: 2, max: 24,
      default: [{ name: "Partenaire 1", image: "", url: "" }, { name: "Partenaire 2", image: "", url: "" }, { name: "Partenaire 3", image: "", url: "" }, { name: "Partenaire 4", image: "", url: "" }],
      fields: [
        { key: "name", kind: "text", label: "Nom (texte de remplacement du logo)", max: 60, required: true, default: "Partenaire" },
        { key: "image", kind: "image", label: "Logo (facultatif : sinon le nom s'affiche)" },
        { key: "url", kind: "link", label: "Lien (facultatif)" },
      ] },
    { key: "height", kind: "select", label: "Taille des logos", options: [["32", "Petits"], ["48", "Moyens"], ["64", "Grands"], ["96", "Très grands"]], default: "48" },
    { key: "grayscale", kind: "bool", label: "Logos en niveaux de gris (couleur au survol)", default: false },
    { key: "fade", kind: "bool", label: "Bords qui s'estompent", default: true },
  ],
  motion: {
    module: "logo-marquee", preview: false,
    controls: [],
    params: [
      { key: "speed", kind: "number", label: "Vitesse (px par seconde)", min: 10, max: 300, default: 60 },
      { key: "direction", kind: "select", label: "Sens", options: [["left", "Vers la gauche"], ["right", "Vers la droite"]], default: "left" },
      { key: "pauseHover", kind: "bool", label: "Pause au survol et au clavier", default: true },
    ],
  },
};
