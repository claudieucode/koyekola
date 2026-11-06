// Motion Studio (lot S) : Galerie à défilement horizontal piloté par le défilement vertical. Sans JavaScript, en mouvement réduit
// (et sur mobile par défaut) : bande à faire défiler à la main, au doigt ou au clavier.
module.exports = {
  type: "motionhgallery", template: "motion-h-gallery", label: "Galerie à défilement horizontal", group: "advanced", icon: "image", version: 1, style: "box", status: "operational",
  description: "Une bande d'images qui avance latéralement pendant que la page défile vers le bas",
  keywords: "galerie defilement horizontal horizontal scroll piloté par le scroll images bande laterale portfolio motion",
  schema: [
    { key: "label", kind: "text", label: "Nom de la galerie (lu par les lecteurs d'écran)", max: 80, required: true, default: "Galerie" },
    { key: "items", kind: "items", label: "Éléments", min: 2, max: 16,
      default: [
        { image: "", imageAlt: "", title: "Premier projet", caption: "Une courte légende", url: "" },
        { image: "", imageAlt: "", title: "Deuxième projet", caption: "Une courte légende", url: "" },
        { image: "", imageAlt: "", title: "Troisième projet", caption: "Une courte légende", url: "" },
        { image: "", imageAlt: "", title: "Quatrième projet", caption: "Une courte légende", url: "" }],
      fields: [
        { key: "image", kind: "image", label: "Image (facultative : sinon une carte de texte)" },
        { key: "imageAlt", kind: "text", label: "Texte de remplacement (vide = décorative)", max: 200, default: "" },
        { key: "title", kind: "text", label: "Titre", max: 80, required: true, default: "Un titre" },
        { key: "caption", kind: "text", label: "Légende (facultative)", max: 120, default: "" },
        { key: "url", kind: "link", label: "Lien (facultatif)" },
      ] },
    { key: "ratio", kind: "select", label: "Forme des éléments", options: [["landscape", "Paysage (4:3)"], ["square", "Carré"], ["portrait", "Portrait (3:4)"]], default: "landscape" },
    { key: "titleTag", kind: "select", label: "Balise des titres", options: [["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"]], default: "h3" },
    { key: "showProgress", kind: "bool", label: "Afficher la barre d'avancement", default: true },
  ],
  motion: {
    module: "h-gallery", preview: false,
    controls: [],
    params: [
      { key: "pace", kind: "number", label: "Vitesse du défilement latéral (100 = normale, moins = plus rapide)", min: 50, max: 200, default: 100 },
      { key: "pinMobile", kind: "bool", label: "Épingler aussi sur mobile (sinon la bande se fait glisser au doigt)", default: false },
    ],
  },
};
