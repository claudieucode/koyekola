// Motion Studio (lot S) : Chronologie animée. La ligne se remplit selon le défilement ; les étapes apparaissent une à une.
// Sans JavaScript ou en mouvement réduit : chronologie complète, ligne pleine.
module.exports = {
  type: "motiontimeline", template: "motion-timeline", label: "Chronologie animée", group: "advanced", icon: "layers", version: 1, style: "box", status: "operational",
  description: "Une chronologie dont la ligne se remplit au défilement et dont les étapes apparaissent",
  keywords: "chronologie animee timeline ligne qui se remplit etapes dates historique parcours frise defilement motion",
  schema: [
    { key: "items", kind: "items", label: "Étapes", min: 2, max: 16,
      default: [
        { date: "2022", title: "Le début", text: "Là où tout a commencé." },
        { date: "2023", title: "Un grand pas", text: "Une étape importante franchie." },
        { date: "2024", title: "Aujourd'hui", text: "Où nous en sommes maintenant." }],
      fields: [
        { key: "date", kind: "text", label: "Date ou repère", max: 40, default: "" },
        { key: "title", kind: "text", label: "Titre", max: 100, required: true, default: "Un titre" },
        { key: "text", kind: "textarea", label: "Texte (facultatif)", max: 400, default: "" },
      ] },
    { key: "titleTag", kind: "select", label: "Balise des titres", options: [["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"]], default: "h3" },
    { key: "layout", kind: "select", label: "Disposition", options: [["left", "Ligne à gauche"], ["alternate", "Alternée (écrans larges)"]], default: "left" },
  ],
  motion: {
    module: "steps", preview: true,
    presets: [["fade-up", "Fondu montant"], ["fade", "Fondu"], ["slide", "Glissement latéral"], ["scale", "Zoom doux"]],
    defaults: { preset: "fade-up", trigger: "viewport", duration: 600, delay: 0, easing: "smooth", stagger: 0 },
    controls: ["preset", "trigger", "duration", "delay", "easing", "stagger", "repeat"],
    params: [],
  },
};
