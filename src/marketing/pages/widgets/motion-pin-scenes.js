// Motion Studio (lot S) : Section épinglée à scènes (pinning). La section reste collée à l'écran ; le défilement fait avancer les scènes.
// Durée de défilement réglable (par scène) ; points cliquables et clavier ; sans JavaScript ou en mouvement réduit : scènes l'une sous l'autre.
module.exports = {
  type: "motionpinscenes", template: "motion-pin-scenes", label: "Section épinglée à scènes", group: "advanced", icon: "layers", version: 1, style: "box", status: "operational",
  description: "Une section qui reste collée à l'écran pendant que les scènes se succèdent au défilement",
  keywords: "section epinglee pinning pin scenes scenes defilement scroll colle sticky etapes presentation storytelling motion",
  schema: [
    { key: "label", kind: "text", label: "Nom de la section (lu par les lecteurs d'écran)", max: 80, required: true, default: "Présentation en scènes" },
    { key: "scenes", kind: "items", label: "Scènes", min: 2, max: 8,
      default: [
        { title: "Première scène", text: "Une idée par scène : courte et claire.", image: "", imageAlt: "" },
        { title: "Deuxième scène", text: "Le défilement fait avancer la présentation.", image: "", imageAlt: "" },
        { title: "Troisième scène", text: "La section se libère après la dernière scène.", image: "", imageAlt: "" }],
      fields: [
        { key: "title", kind: "text", label: "Titre", max: 100, required: true, default: "Un titre" },
        { key: "text", kind: "textarea", label: "Texte", max: 400, default: "" },
        { key: "image", kind: "image", label: "Image (facultative)" },
        { key: "imageAlt", kind: "text", label: "Texte de remplacement de l'image (vide = décorative)", max: 200, default: "" },
      ] },
    { key: "titleTag", kind: "select", label: "Balise des titres", options: [["h2", "Titre 2"], ["h3", "Titre 3"]], default: "h2" },
    { key: "showNav", kind: "bool", label: "Afficher les points de navigation et la barre d'avancement", default: true },
  ],
  motion: {
    module: "pin-scenes", preview: false,
    presets: [["fade", "Fondu"], ["rise", "Montée douce"], ["zoom", "Zoom doux"]],
    defaults: { preset: "fade", duration: 600, easing: "smooth" },
    controls: ["preset", "duration", "easing"],
    params: [{ key: "length", kind: "number", label: "Durée de défilement par scène (% de la hauteur de la fenêtre)", min: 40, max: 300, default: 100 }],
  },
};
