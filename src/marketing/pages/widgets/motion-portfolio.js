// Motion Studio (lot S) : Grille de portfolio interactive. Filtres par catégorie avec transition animée (les cartes glissent à leur nouvelle place),
// survol de carte. Les filtres existent aussi sans animation (mouvement réduit). Sans JavaScript : toutes les cartes, sans filtre.
// Existant vérifié : la « Galerie » filtre par étiquette sans animation, sans titre ni lien par projet.
module.exports = {
  type: "motionportfolio", template: "motion-portfolio", label: "Portfolio filtrable animé", group: "advanced", icon: "grid", version: 1, style: "box", status: "operational",
  description: "Une grille de projets avec filtres par catégorie animés et survol de carte",
  keywords: "portfolio grille projets filtres categories animes realisations galerie filtrable survol flip layout motion",
  schema: [
    { key: "label", kind: "text", label: "Nom de la grille (lu par les lecteurs d'écran)", max: 80, required: true, default: "Nos réalisations" },
    { key: "items", kind: "items", label: "Projets", min: 2, max: 24,
      default: [
        { title: "Projet un", category: "Web", description: "Une phrase sur le projet.", image: "", imageAlt: "", url: "" },
        { title: "Projet deux", category: "Image de marque", description: "Une phrase sur le projet.", image: "", imageAlt: "", url: "" },
        { title: "Projet trois", category: "Web", description: "Une phrase sur le projet.", image: "", imageAlt: "", url: "" },
        { title: "Projet quatre", category: "Photo", description: "Une phrase sur le projet.", image: "", imageAlt: "", url: "" }],
      fields: [
        { key: "title", kind: "text", label: "Titre", max: 80, required: true, default: "Un projet" },
        { key: "category", kind: "text", label: "Catégorie (sert au filtre)", max: 30, default: "" },
        { key: "description", kind: "text", label: "Description courte (facultative)", max: 120, default: "" },
        { key: "image", kind: "image", label: "Image (facultative)" },
        { key: "imageAlt", kind: "text", label: "Texte de remplacement (vide = décorative)", max: 200, default: "" },
        { key: "url", kind: "link", label: "Lien du projet (facultatif)" },
      ] },
    { key: "allLabel", kind: "text", label: "Texte du filtre « tout »", max: 24, required: true, default: "Tous" },
    { key: "titleTag", kind: "select", label: "Balise des titres", options: [["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"]], default: "h3" },
    { key: "columns", kind: "select", label: "Colonnes (écrans larges)", options: [["2", "2"], ["3", "3"], ["4", "4"]], default: "3" },
    { key: "ratio", kind: "select", label: "Forme des cartes", options: [["landscape", "Paysage (4:3)"], ["square", "Carré"], ["portrait", "Portrait (3:4)"]], default: "landscape" },
  ],
  motion: {
    module: "portfolio-grid", preview: false,
    presets: [["scale", "Zoom doux"], ["fade", "Fondu"], ["rise", "Montée douce"]],
    defaults: { preset: "scale", duration: 450, easing: "smooth", stagger: 40 },
    controls: ["preset", "duration", "easing", "stagger"],
    params: [],
  },
};
