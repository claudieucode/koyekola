// Motion Studio (lot S) : Étapes de processus. Pastilles numérotées reliées par un trait ; chaque étape apparaît puis le trait se trace jusqu'à la suivante.
// Sans JavaScript ou en mouvement réduit : toutes les étapes visibles.
module.exports = {
  type: "motionprocess", template: "motion-process", label: "Étapes de processus", group: "advanced", icon: "layers", version: 1, style: "box", status: "operational",
  description: "Des étapes numérotées reliées par un trait qui se trace",
  keywords: "etapes de processus process steps numerotees comment ca marche parcours etapes liees trait motion",
  schema: [
    { key: "items", kind: "items", label: "Étapes", min: 2, max: 8,
      default: [
        { title: "Vous nous contactez", text: "Un message suffit pour démarrer." },
        { title: "Nous préparons", text: "Nous construisons une proposition sur mesure." },
        { title: "Vous profitez", text: "Le résultat est livré, prêt à l'emploi." }],
      fields: [
        { key: "title", kind: "text", label: "Titre", max: 80, required: true, default: "Un titre" },
        { key: "text", kind: "textarea", label: "Texte (facultatif)", max: 300, default: "" },
      ] },
    { key: "titleTag", kind: "select", label: "Balise des titres", options: [["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"]], default: "h3" },
    { key: "layout", kind: "select", label: "Disposition", options: [["row", "En ligne (écrans larges)"], ["column", "En colonne"]], default: "row" },
  ],
  motion: {
    module: "steps", preview: true,
    presets: [["pop", "Pastille qui apparaît"], ["fade-up", "Fondu montant"], ["fade", "Fondu"]],
    defaults: { preset: "pop", trigger: "viewport", duration: 500, delay: 0, easing: "smooth", stagger: 250 },
    controls: ["preset", "trigger", "duration", "delay", "easing", "stagger", "repeat"],
    params: [],
  },
};
