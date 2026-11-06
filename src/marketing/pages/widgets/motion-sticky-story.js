// Motion Studio (lot S) : Histoire collante (sticky story). Les étapes (texte) défilent d'un côté ; le visuel de l'étape en cours reste collé de l'autre.
// Sans JavaScript, en mouvement réduit ou sur petit écran : chaque étape est suivie de son propre visuel.
module.exports = {
  type: "motionstickystory", template: "motion-sticky-story", label: "Histoire collante", group: "advanced", icon: "layers", version: 1, style: "box", status: "operational",
  description: "Le texte change en défilant pendant qu'un visuel reste collé à côté",
  keywords: "histoire collante sticky story storytelling texte defile visuel fixe etapes scrollytelling chapitres defilement motion",
  schema: [
    { key: "steps", kind: "items", label: "Étapes", min: 2, max: 8,
      default: [
        { kicker: "Chapitre 1", title: "Le point de départ", text: "Racontez la première étape. Le visuel de droite correspond à ce texte.", image: "", imageAlt: "" },
        { kicker: "Chapitre 2", title: "Le déroulé", text: "Quand cette étape arrive au centre de l'écran, le visuel change.", image: "", imageAlt: "" },
        { kicker: "Chapitre 3", title: "Le résultat", text: "Terminez par ce que la personne obtient.", image: "", imageAlt: "" }],
      fields: [
        { key: "kicker", kind: "text", label: "Petit texte (facultatif)", max: 40, default: "" },
        { key: "title", kind: "text", label: "Titre", max: 100, required: true, default: "Un titre" },
        { key: "text", kind: "textarea", label: "Texte", max: 500, default: "" },
        { key: "image", kind: "image", label: "Visuel collé (facultatif : sinon le numéro de l'étape)" },
        { key: "imageAlt", kind: "text", label: "Texte de remplacement du visuel (vide = décoratif)", max: 200, default: "" },
      ] },
    { key: "titleTag", kind: "select", label: "Balise des titres", options: [["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"]], default: "h3" },
    { key: "side", kind: "select", label: "Place du visuel", options: [["right", "À droite"], ["left", "À gauche"]], default: "right" },
    { key: "dimInactive", kind: "bool", label: "Atténuer les étapes qui ne sont pas en cours", default: true },
  ],
  motion: {
    module: "sticky-story", preview: false,
    defaults: { duration: 500, easing: "smooth" },
    controls: ["duration", "easing"],
    params: [{ key: "top", kind: "number", label: "Distance du visuel au haut de la fenêtre (px)", min: 0, max: 200, default: 96 }],
  },
};
