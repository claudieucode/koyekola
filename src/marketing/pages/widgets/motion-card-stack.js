// Motion Studio (lot S) : Cartes empilées au défilement (sticky stacking). Chaque carte se colle puis la suivante vient la recouvrir ;
// la carte du dessous rétrécit et s'assombrit. Sans JavaScript ou en mouvement réduit : liste de cartes l'une sous l'autre.
module.exports = {
  type: "motioncardstack", template: "motion-card-stack", label: "Cartes empilées", group: "advanced", icon: "layers", version: 1, style: "box", status: "operational",
  description: "Des cartes qui s'empilent les unes sur les autres pendant le défilement",
  keywords: "cartes empilees pile stack sticky stacking card stack defilement scroll recouvrement empilement motion",
  schema: [
    { key: "cards", kind: "items", label: "Cartes", min: 2, max: 8,
      default: [
        { kicker: "Étape 1", title: "Première carte", text: "Expliquez ici le premier point en une ou deux phrases.", image: "", buttonLabel: "", buttonUrl: "", tone: "surface" },
        { kicker: "Étape 2", title: "Deuxième carte", text: "Elle vient recouvrir la première pendant le défilement.", image: "", buttonLabel: "", buttonUrl: "", tone: "accent" },
        { kicker: "Étape 3", title: "Troisième carte", text: "Et ainsi de suite, jusqu'à la dernière.", image: "", buttonLabel: "", buttonUrl: "", tone: "dark" }],
      fields: [
        { key: "kicker", kind: "text", label: "Petit texte (facultatif)", max: 40, default: "" },
        { key: "title", kind: "text", label: "Titre", max: 100, required: true, default: "Un titre" },
        { key: "text", kind: "textarea", label: "Texte", max: 400, default: "" },
        { key: "image", kind: "image", label: "Image (facultative)" },
        { key: "buttonLabel", kind: "text", label: "Texte du bouton (facultatif)", max: 40, default: "" },
        { key: "buttonUrl", kind: "link", label: "Adresse du bouton" },
        { key: "tone", kind: "select", label: "Couleur de la carte", options: [["surface", "Claire"], ["accent", "Couleur principale"], ["dark", "Sombre"]], default: "surface" },
      ] },
    { key: "titleTag", kind: "select", label: "Balise des titres", options: [["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"]], default: "h3" },
    { key: "height", kind: "number", label: "Hauteur minimale d'une carte (% de la fenêtre)", min: 30, max: 90, integer: true, default: 60 },
  ],
  validate(p, at) { p.cards.forEach((c, i) => { if (c.buttonLabel && !c.buttonUrl) throw new Error(`${at}, carte ${i + 1} : un bouton demande une adresse.`); if (c.buttonUrl && !c.buttonLabel) throw new Error(`${at}, carte ${i + 1} : une adresse de bouton demande son texte.`); }); },
  motion: {
    module: "card-stack", preview: false,
    controls: [],
    params: [
      { key: "top", kind: "number", label: "Distance du haut de la fenêtre (px)", min: 0, max: 200, default: 80 },
      { key: "offset", kind: "number", label: "Décalage visible entre cartes (px)", min: 0, max: 60, default: 24 },
      { key: "shrink", kind: "number", label: "Réduction de la carte du dessous (%)", min: 0, max: 20, default: 5 },
      { key: "dim", kind: "number", label: "Assombrissement de la carte du dessous (%)", min: 0, max: 60, default: 20 },
    ],
  },
};
