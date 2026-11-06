// Motion Studio (lot S) : Séquence d'images au défilement (canvas). Les images de la médiathèque défilent comme un film pendant que la page défile.
// Chargement différé (la première image seule au départ, le reste à l'approche) ; repli sur la première image sans JavaScript, sans canvas ou en mouvement réduit.
module.exports = {
  type: "motionscrollseq", template: "motion-scroll-sequence", label: "Séquence d'images au défilement", group: "advanced", icon: "image", version: 1, style: "box", status: "operational",
  description: "Une suite d'images qui s'enchaîne comme un film quand on fait défiler la page",
  keywords: "sequence images defilement scroll sequence canvas film produit qui tourne frames animation scrollytelling motion",
  schema: [
    { key: "label", kind: "text", label: "Description de la séquence (lue par les lecteurs d'écran)", max: 160, required: true, default: "Séquence d'images" },
    { key: "frames", kind: "items", label: "Images (dans l'ordre de lecture)", min: 1, max: 24, default: [{ image: "" }, { image: "" }, { image: "" }],
      fields: [{ key: "image", kind: "image", label: "Image" }] },
    { key: "title", kind: "text", label: "Titre sur la séquence (facultatif)", max: 100, default: "" },
    { key: "titleTag", kind: "select", label: "Balise du titre", options: [["h2", "Titre 2"], ["h3", "Titre 3"], ["p", "Paragraphe"]], default: "h2" },
    { key: "caption", kind: "text", label: "Légende (facultative)", max: 160, default: "" },
    { key: "fit", kind: "select", label: "Cadrage des images", options: [["contain", "Image entière"], ["cover", "Remplir l'écran (rognage)"]], default: "contain" },
  ],
  complete(p) { const n = p.frames.filter((f) => f.image).length; return n < 2 ? "La séquence d'images demande au moins 2 images pour être publiée." : undefined; },
  motion: {
    module: "scroll-sequence", preview: false,
    controls: [],
    params: [{ key: "length", kind: "number", label: "Durée de défilement (% de la hauteur de la fenêtre)", min: 100, max: 800, default: 300 }],
  },
};
