// Personnaliser — catégories principales du panneau, dans l'ordre exact de l'interface de référence.
// Source UNIQUE : le serveur l'envoie à l'écran, l'écran ne code aucune liste en dur. Une catégorie sans « ready » n'a pas encore de panneau de réglages
// (elles sont développées une par une) ; passer « ready » à true n'a de sens que lorsque son panneau existe.
module.exports = Object.freeze([
  { id: "global", label: "Global", ready: false },
  { id: "entete", label: "Entête", ready: false },
  { id: "types-de-publication", label: "Types de publication", ready: false },
  { id: "general", label: "Général", ready: false },
  { id: "pied-de-page", label: "Pied de page", ready: false },
  { id: "identite-du-site", label: "Identité du site", ready: false },
  { id: "menus", label: "Menus", ready: false },
  { id: "widgets", label: "Widgets", ready: false },
  { id: "accueil", label: "Réglages de la page d'accueil", ready: false },
  { id: "css-additionnel", label: "CSS additionnel", ready: false },
].map((c) => Object.freeze(c)));
