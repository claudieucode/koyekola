// Motion Studio, lot « v » : bouton magnétique. Un VRAI lien (<a href>) qui se rapproche du curseur quand celui-ci passe à proximité, avec les mêmes
// variantes de survol que le bouton animé. Souris seulement : sur écran tactile, au clavier ou avec « réduire les animations », le bouton reste en place.
module.exports = {
  type: "motionmagneticbutton", template: "motion-magnetic-button", label: "Bouton magnétique", group: "advanced", icon: "mousePointer", version: 1, style: "box", status: "operational",
  description: "Un bouton qui est attiré par le curseur quand il s'approche",
  keywords: "bouton magnetique magnetic attire curseur souris proximite hover lien appel action cta animation motion",
  schema: [
    { key: "label", kind: "text", label: "Texte du bouton", max: 60, required: true, default: "Me rejoindre" },
    { key: "link", kind: "link", label: "Adresse du lien", required: true, default: "/" },
    { key: "newTab", kind: "bool", label: "Ouvrir dans un nouvel onglet", default: false },
    { key: "arrow", kind: "select", label: "Flèche", options: [["right", "Flèche vers la droite"], ["up-right", "Flèche en diagonale"], ["none", "Aucune"]], default: "none" },
    { key: "size", kind: "select", label: "Taille", options: [["sm", "Petit"], ["md", "Moyen"], ["lg", "Grand"]], default: "lg" },
    { key: "align", kind: "select", label: "Alignement", options: [["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]], default: "center" },
  ],
  motion: {
    module: "magnetic-button",
    presets: [["fill-slide", "Remplissage glissant"], ["fill-circle", "Remplissage depuis le curseur"], ["underline", "Soulignement"], ["arrow-shift", "Flèche qui avance"], ["lift", "Soulèvement"], ["shine", "Reflet"]],
    defaults: { preset: "fill-circle", duration: 350, easing: "smooth" },
    controls: ["preset", "duration", "easing"],
    preview: false,
    params: [
      { key: "strength", kind: "number", label: "Force d'attraction (%)", min: 5, max: 70, default: 35 },
      { key: "radius", kind: "number", label: "Zone d'attraction autour du bouton (px)", min: 20, max: 300, default: 120 },
      { key: "labelShift", kind: "bool", label: "Le texte bouge un peu plus que le bouton", default: true },
    ],
  },
};
