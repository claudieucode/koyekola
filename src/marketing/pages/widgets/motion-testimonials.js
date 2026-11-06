// Motion Studio (lot S) : Carrousel de témoignages animé (transitions, flèches, points, glisser, lecture automatique avec pause).
// Sans JavaScript ou en mouvement réduit : tous les témoignages l'un sous l'autre.
module.exports = {
  type: "motiontestimonials", template: "motion-testimonials", label: "Témoignages animés", group: "advanced", icon: "quote", version: 1, style: "box", status: "operational",
  description: "Des témoignages qui changent avec une transition animée, flèches, points et pause",
  keywords: "temoignages animes carrousel avis clients citations transition fondu glissement lecture automatique pause motion testimonial",
  schema: [
    { key: "label", kind: "text", label: "Nom du carrousel (lu par les lecteurs d'écran)", max: 80, required: true, default: "Témoignages" },
    { key: "items", kind: "items", label: "Témoignages", min: 2, max: 12,
      default: [
        { quote: "Écrivez ici ce qu'un client dit de vous, avec ses propres mots.", name: "Prénom Nom", role: "Fonction", photo: "", stars: 5 },
        { quote: "Un deuxième témoignage réel, court et précis.", name: "Prénom Nom", role: "Fonction", photo: "", stars: 5 }],
      fields: [
        { key: "quote", kind: "textarea", label: "Témoignage", max: 400, required: true, default: "Un témoignage." },
        { key: "name", kind: "text", label: "Nom", max: 80, required: true, default: "Prénom Nom" },
        { key: "role", kind: "text", label: "Fonction ou lieu (facultatif)", max: 80, default: "" },
        { key: "photo", kind: "image", label: "Photo (facultative)" },
        { key: "stars", kind: "number", label: "Note affichée (0 = aucune étoile)", min: 0, max: 5, integer: true, default: 0 },
      ] },
    { key: "arrows", kind: "bool", label: "Afficher les flèches", default: true },
    { key: "dots", kind: "bool", label: "Afficher les points", default: true },
  ],
  motion: {
    module: "testimonials", preview: false,
    presets: [["fade", "Fondu"], ["slide", "Glissement"], ["blur", "Netteté progressive"]],
    defaults: { preset: "slide", duration: 500, easing: "smooth" },
    controls: ["preset", "duration", "easing"],
    params: [
      { key: "autoplay", kind: "bool", label: "Lecture automatique (bouton Pause toujours proposé)", default: false },
      { key: "interval", kind: "number", label: "Secondes entre deux témoignages", min: 3, max: 20, default: 6 },
    ],
  },
};
