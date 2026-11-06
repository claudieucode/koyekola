// Motion Studio, lot d : onglets avec transition (indicateur qui glisse, panneau qui apparaît). Complète l'élément « Onglets » sans le remplacer.
// Motif ARIA des onglets créé par public/js/motion-studio/tabs.js ; SANS JavaScript tous les panneaux sont affichés l'un sous l'autre avec leur titre.
module.exports = {
  type: "motiontabs", template: "motion-tabs", label: "Onglets animés", group: "advanced", icon: "layers", version: 1, style: "box", status: "operational",
  description: "Des onglets au clavier et au toucher, avec un indicateur qui glisse et un panneau qui apparaît",
  keywords: "onglets tabs animes transition indicateur panneaux contenu organiser navigation aria clavier",
  schema: [
    { key: "label", kind: "text", label: "Nom de l'ensemble d'onglets (lu par les lecteurs d'écran)", max: 80, required: true, default: "Informations" },
    { key: "items", kind: "items", label: "Onglets", min: 2, max: 8,
      default: [{ title: "Présentation", text: "Le contenu du premier onglet.\n\nUne ligne vide sépare les paragraphes." }, { title: "Détails", text: "Le contenu du deuxième onglet." }, { title: "Avis", text: "Le contenu du troisième onglet." }],
      fields: [
        { key: "title", kind: "text", label: "Titre de l'onglet", max: 40, required: true, default: "Onglet" },
        { key: "text", kind: "textarea", label: "Contenu (une ligne vide sépare les paragraphes)", max: 2000, required: true, default: "Le contenu de l'onglet." },
      ] },
    { key: "start", kind: "number", label: "Onglet ouvert au départ (numéro)", min: 1, max: 8, integer: true, default: 1 },
    { key: "look", kind: "select", label: "Aspect des onglets", options: [["line", "Souligné"], ["pills", "Pastilles"], ["boxed", "Cartes"]], default: "line" },
    { key: "orientation", kind: "select", label: "Disposition", options: [["horizontal", "Onglets en haut"], ["vertical", "Onglets à gauche"]], default: "horizontal" },
  ],
  motion: {
    module: "tabs",
    presets: [["fade", "Fondu"], ["slide", "Glissement"], ["rise", "Montée"], ["scale", "Zoom léger"]],
    defaults: { preset: "slide", duration: 320, easing: "smooth" },
    controls: ["preset", "duration", "easing"],
  },
};
