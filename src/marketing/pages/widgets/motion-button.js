// Motion Studio, lot « v » : bouton animé. Un VRAI lien (<a href>) : variantes de survol (remplissage glissant, remplissage depuis le curseur, soulignement,
// flèche qui avance, soulèvement, reflet). Les variantes fonctionnent aussi sans JavaScript (CSS) ; au clavier, le focus déclenche le même effet.
module.exports = {
  type: "motionbutton", template: "motion-button", label: "Bouton animé", group: "advanced", icon: "mousePointer", version: 1, style: "box", status: "operational",
  description: "Un bouton-lien avec un effet de survol : remplissage, soulignement, flèche, reflet",
  keywords: "bouton animé survol hover remplissage fill fleche arrow souligne reflet shine lien appel action cta animation motion",
  schema: [
    { key: "label", kind: "text", label: "Texte du bouton", max: 60, required: true, default: "Découvrir" },
    { key: "link", kind: "link", label: "Adresse du lien", required: true, default: "/" },
    { key: "newTab", kind: "bool", label: "Ouvrir dans un nouvel onglet", default: false },
    { key: "arrow", kind: "select", label: "Flèche", options: [["right", "Flèche vers la droite"], ["up-right", "Flèche en diagonale"], ["none", "Aucune"]], default: "right" },
    { key: "size", kind: "select", label: "Taille", options: [["sm", "Petit"], ["md", "Moyen"], ["lg", "Grand"]], default: "md" },
    { key: "block", kind: "bool", label: "Pleine largeur", default: false },
    { key: "align", kind: "select", label: "Alignement", options: [["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]], default: "left" },
  ],
  motion: {
    module: "button",
    presets: [["fill-slide", "Remplissage glissant"], ["fill-circle", "Remplissage depuis le curseur"], ["underline", "Soulignement"], ["arrow-shift", "Flèche qui avance"], ["lift", "Soulèvement"], ["shine", "Reflet"]],
    defaults: { preset: "fill-slide", duration: 350, easing: "smooth" },
    controls: ["preset", "duration", "easing"],
    preview: false,
  },
};
