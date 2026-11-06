// Motion Studio, lot « t » : Bande défilante liée au défilement (Marquee velocity). Une bande de textes qui avance à vitesse constante et ACCÉLÈRE quand on fait défiler
// la page (sens inversé en remontant, légère inclinaison). Distincte du widget « Défilement continu » existant (vitesse fixe en CSS). Sans JavaScript ou en mouvement réduit :
// les textes s'écrivent en liste qui passe à la ligne. Pause au survol / au focus et bouton Pause. Exécution : public/js/motion-studio/marquee-velocity.js.
module.exports = {
  type: "motionmarqueevelocity", template: "motion-marquee-velocity", label: "Bande liée au défilement", group: "advanced", icon: "arrowRightLeft", version: 1, style: "text", status: "operational",
  description: "Une bande de textes qui accélère quand on fait défiler la page",
  keywords: "marquee velocity bande defilante vitesse scroll accelere ticker texte infini bandeau logos slogans inclinaison inertie",
  schema: [
    { key: "items", kind: "items", label: "Textes de la bande", min: 1, max: 12,
      default: [{ text: "Formations" }, { text: "Communauté" }, { text: "Accompagnement" }, { text: "Certificats" }],
      fields: [{ key: "text", kind: "text", label: "Texte", max: 80, required: true, default: "Mon texte" }] },
    { key: "separator", kind: "text", label: "Séparateur entre les textes", max: 3, default: "•" },
    { key: "label", kind: "text", label: "Nom de la bande (lecteurs d'écran)", max: 80, default: "Bandeau défilant" },
  ],
  motion: {
    module: "marquee-velocity",
    defaults: { trigger: "viewport" },
    controls: [],
    preview: false,
    params: [
      { key: "speed", kind: "number", label: "Vitesse de base (px par seconde)", min: 5, max: 600, step: 5, default: 60 },
      { key: "velocity", kind: "number", label: "Effet du défilement de la page (0 = aucun, 10 = fort)", min: 0, max: 10, step: 0.5, default: 3 },
      { key: "direction", kind: "select", label: "Sens de la bande", options: [["left", "Vers la gauche"], ["right", "Vers la droite"]], default: "left" },
      { key: "reverse", kind: "bool", label: "Inverser le sens quand on remonte la page", default: true },
      { key: "skew", kind: "bool", label: "Incliner légèrement pendant le défilement", default: true },
      { key: "pauseHover", kind: "bool", label: "Pause au survol et au clavier", default: true },
    ],
  },
};
