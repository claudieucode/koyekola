// Motion Studio (lot S) : Menu plein écran animé. Un bouton ouvre un panneau plein écran, les liens arrivent en cascade ; Échap ferme, le focus est piégé.
// Sans JavaScript : la liste de liens s'affiche telle quelle (pas de panneau). Dans l'éditeur : liste affichée (le panneau se teste sur la page publiée).
module.exports = {
  type: "motionfsmenu", template: "motion-fullscreen-menu", label: "Menu plein écran animé", group: "advanced", icon: "menu", version: 1, style: "box", status: "operational",
  description: "Un bouton qui ouvre un menu plein écran, liens en cascade, fermeture par Échap",
  keywords: "menu plein ecran fullscreen menu overlay hamburger navigation liens cascade ouverture animee motion",
  schema: [
    { key: "label", kind: "text", label: "Nom du menu (lu par les lecteurs d'écran)", max: 60, required: true, default: "Menu principal" },
    { key: "buttonLabel", kind: "text", label: "Texte du bouton d'ouverture", max: 24, required: true, default: "Menu" },
    { key: "closeLabel", kind: "text", label: "Texte du bouton de fermeture", max: 24, required: true, default: "Fermer" },
    { key: "links", kind: "items", label: "Liens", min: 2, max: 12,
      default: [{ label: "Accueil", url: "/" }, { label: "Formations", url: "/catalogue" }, { label: "À propos", url: "/" }, { label: "Contact", url: "/" }],
      fields: [
        { key: "label", kind: "text", label: "Texte du lien", max: 60, required: true, default: "Un lien" },
        { key: "url", kind: "link", label: "Adresse", required: true, default: "/" },
      ] },
    { key: "numbers", kind: "bool", label: "Numéroter les liens (01, 02…)", default: true },
    { key: "align", kind: "select", label: "Alignement des liens", options: [["left", "À gauche"], ["center", "Centrés"]], default: "left" },
  ],
  motion: {
    module: "fullscreen-menu", preview: false,
    presets: [["fade", "Fondu"], ["slide-down", "Descente"], ["slide-right", "Glissement latéral"], ["circle", "Cercle qui s'étend"]],
    defaults: { preset: "slide-down", duration: 500, delay: 0, easing: "smooth", stagger: 70 },
    controls: ["preset", "duration", "easing", "stagger"],
    params: [],
  },
};
