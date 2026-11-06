// Famille « Carrousels » : diaporama (Slides), carrousel de témoignages, carrousel média. Tous réutilisent l'exécution du carrousel du site
// (public/js/landing.js : défilement natif, boutons, points, lecture automatique, boucle) : aucun nouveau script.
const bool = (key, label, def) => ({ key, kind: "bool", label, default: def });
const behaviour = (withHeight, withPerView = true) => [
  { key: "effect", kind: "select", label: "Transition entre les éléments", options: [["slide", "Défilement (glissé)"], ["fade", "Fondu (un seul élément visible)"]], default: "slide" },
  ...(withPerView ? [{ key: "perView", kind: "number", label: "Éléments visibles à la fois (bureau ; 1 sur mobile)", min: 1, max: 4, integer: true, default: 1 }] : []),
  ...(withHeight ? [{ key: "height", kind: "number", label: "Hauteur (px)", min: 200, max: 900, integer: true, default: 460 }] : []),
  bool("dots", "Afficher les points de navigation", true),
  bool("loop", "Reboucler (de la dernière à la première)", false),
  bool("autoplay", "Lecture automatique (à l'arrêt si « réduire les animations »)", false),
  { key: "interval", kind: "number", label: "Secondes entre deux éléments (lecture automatique)", min: 2, max: 20, integer: true, default: 5 },
];
module.exports = [
  {
    type: "slides", label: "Diaporama", group: "general", icon: "image", version: 1, style: "box", template: "slides", status: "operational",
    description: "Diapositives plein cadre : image, titre, texte et bouton",
    keywords: "diaporama slides slider hero bandeau diapositives carrousel image titre bouton",
    schema: [
      { key: "label", kind: "text", label: "Nom du diaporama (lu par les lecteurs d'écran)", max: 80, required: true, default: "Diaporama" },
      { key: "slides", kind: "items", label: "Diapositives", min: 1, max: 8, default: [
        { image: "", title: "Une première diapositive", text: "Une phrase qui explique.", buttonLabel: "En savoir plus", buttonUrl: "/", dark: 45 },
        { image: "", title: "Une deuxième diapositive", text: "Une autre phrase.", buttonLabel: "", buttonUrl: "", dark: 45 }],
        fields: [
          { key: "image", kind: "image", label: "Image de fond (facultative)" },
          { key: "title", kind: "text", label: "Titre", max: 100, required: true, default: "Un titre" },
          { key: "text", kind: "textarea", label: "Texte (facultatif)", max: 240, default: "" },
          { key: "buttonLabel", kind: "text", label: "Texte du bouton (facultatif)", max: 40, default: "" },
          { key: "buttonUrl", kind: "link", label: "Adresse du bouton" },
          { key: "dark", kind: "number", label: "Voile sombre sur l'image (%)", min: 0, max: 80, integer: true, default: 45 },
        ] },
      { key: "align", kind: "select", label: "Alignement du texte", options: [["center", "Centré"], ["left", "À gauche"]], default: "center" },
      { key: "kenBurns", kind: "select", label: "Effet Ken Burns (zoom lent sur l'image)", options: [["none", "Aucun"], ["in", "Zoom avant"], ["out", "Zoom arrière"]], default: "none" },
      ...behaviour(true, false),
    ],
    validate(p, at) { p.slides.forEach((s, i) => { if (s.buttonLabel && !s.buttonUrl) throw new Error(`${at}, diapositive ${i + 1} : un bouton demande une adresse.`); if (s.buttonUrl && !s.buttonLabel) throw new Error(`${at}, diapositive ${i + 1} : une adresse de bouton demande son texte.`); }); },
  },
  {
    type: "testimonialcarousel", label: "Carrousel de témoignages", group: "general", icon: "quote", version: 1, style: "box", template: "testimonialcarousel", status: "operational",
    description: "Plusieurs témoignages qui défilent",
    keywords: "carrousel de temoignages avis clients citations defilant testimonial carousel slider",
    schema: [
      { key: "label", kind: "text", label: "Nom du carrousel (lu par les lecteurs d'écran)", max: 80, required: true, default: "Témoignages" },
      { key: "items", kind: "items", label: "Témoignages", min: 1, max: 12, default: [
        { quote: "Écrivez ici ce qu'un client dit de vous, avec ses propres mots.", name: "Prénom Nom", role: "Fonction", photo: "", stars: 5 },
        { quote: "Un deuxième témoignage réel.", name: "Prénom Nom", role: "Fonction", photo: "", stars: 5 }],
        fields: [
          { key: "quote", kind: "textarea", label: "Témoignage", max: 400, required: true, default: "Un témoignage." },
          { key: "name", kind: "text", label: "Nom", max: 80, required: true, default: "Prénom Nom" },
          { key: "role", kind: "text", label: "Fonction ou lieu (facultatif)", max: 80, default: "" },
          { key: "photo", kind: "image", label: "Photo (facultative)" },
          { key: "stars", kind: "number", label: "Note affichée (0 = aucune étoile)", min: 0, max: 5, integer: true, default: 0 },
        ] },
      ...behaviour(false),
    ],
  },
  {
    type: "mediacarousel", label: "Carrousel média", group: "general", icon: "video", version: 1, style: "box", template: "mediacarousel", status: "operational",
    description: "Images et vidéos YouTube / Vimeo dans un même carrousel",
    keywords: "carrousel media images videos youtube vimeo galerie defilant slider mixte",
    schema: [
      { key: "label", kind: "text", label: "Nom du carrousel (lu par les lecteurs d'écran)", max: 80, required: true, default: "Médias" },
      { key: "items", kind: "items", label: "Médias", min: 1, max: 12, default: [{ kind: "image", image: "", alt: "Décrivez l'image", caption: "", video: "" }],
        fields: [
          { key: "kind", kind: "select", label: "Type", options: [["image", "Image"], ["video", "Vidéo (YouTube ou Vimeo)"]], default: "image" },
          { key: "image", kind: "image", label: "Image" },
          { key: "alt", kind: "text", label: "Texte de remplacement de l'image", max: 160, default: "" },
          { key: "video", kind: "link", label: "Adresse de la vidéo (YouTube ou Vimeo)" },
          { key: "caption", kind: "text", label: "Légende (facultative)", max: 160, default: "" },
        ] },
      ...behaviour(false).filter((f) => f.key !== "height"),
    ],
    // Un média peut être en cours de saisie (brouillon) : seules les adresses de vidéo SAISIES sont contrôlées ici (YouTube ou Vimeo) ;
    // la complétude (image + texte de remplacement, vidéo valide) est exigée à la publication (complete) et à l'affichage (média incomplet ignoré)
    validate(p, at) {
      const { embedOf } = require("../nodes");
      p.items.forEach((it, i) => { if (it.kind === "video" && it.video) { const e = embedOf(it.video); if (!e || !["youtube", "vimeo"].includes(e.provider)) throw new Error(`${at}, média ${i + 1} : adresse YouTube ou Vimeo attendue.`); } });
    },
    complete(p) {
      const { embedOf } = require("../nodes");
      for (let i = 0; i < p.items.length; i++) {
        const it = p.items[i], w = `média ${i + 1}`;
        if (it.kind === "image") { if (!it.image) return `${w} : choisissez une image.`; if (!it.alt) return `${w} : le texte de remplacement de l'image est obligatoire.`; }
        else if (!it.video || !embedOf(it.video)) return `${w} : indiquez l'adresse d'une vidéo YouTube ou Vimeo.`;
      }
      return "";
    },
    data(ctx, p) { const { embedOf } = require("../nodes"); return { embeds: p.items.map((it) => (it.kind === "video" ? (embedOf(it.video) || {}).src || null : null)) }; },
  },
];
