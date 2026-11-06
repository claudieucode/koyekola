// Personnaliser — catégories principales du panneau, dans l'ordre exact de l'interface de référence (source UNIQUE : le serveur l'envoie à l'écran).
// « panels » : réglages du moteur de styles (services/siteStyles) affichés dans la catégorie ; « view » : panneau spécial (menus, widgets, accueil, liens vers le Theme Builder).
// Un réglage n'est jamais proposé deux fois : chaque panneau du moteur appartient à UNE catégorie.
module.exports = Object.freeze([
  { id: "global", label: "Global", panels: ["couleurs", "palette", "typographie", "boutons"] },
  { id: "entete", label: "Entête", panels: ["en-tete"], view: "themebuilder-header" },
  { id: "types-de-publication", label: "Types de publication", panels: ["single-post"] },
  { id: "general", label: "Général", panels: ["mise-en-page", "arriere-plan", "images", "formulaires", "appareils", "mode-sombre"] },
  { id: "pied-de-page", label: "Pied de page", panels: ["pied"], view: "themebuilder-footer" },
  { id: "identite-du-site", label: "Identité du site", panels: ["identite"] },
  { id: "menus", label: "Menus", panels: [], view: "menus" },
  { id: "widgets", label: "Widgets", panels: [], view: "widgets" },
  { id: "accueil", label: "Réglages de la page d'accueil", panels: [], view: "accueil" },
  { id: "css-additionnel", label: "CSS additionnel", panels: ["css"] },
].map((c) => Object.freeze(c)));
