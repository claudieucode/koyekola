// Défilement continu (marquee) : une bande de textes qui défile (logos en texte, slogans, annonces). Sans script : animation CSS,
// pause au survol / au clavier / par une case « Pause », immobile si le visiteur demande moins d'animations.
module.exports = {
  type: "marquee", label: "Défilement continu", group: "advanced", icon: "play", version: 1, style: "text", status: "operational",
  description: "Une bande de textes qui défile, avec pause et respect de « réduire les animations »",
  keywords: "marquee defilement continu bande texte annonce bandeau ticker slogan logos texte qui defile",
  schema: [
    { key: "items", kind: "items", label: "Textes", min: 1, max: 12,
      default: [{ text: "Formations en ligne" }, { text: "Accompagnement personnalisé" }, { text: "Communauté active" }],
      fields: [{ key: "text", kind: "text", label: "Texte", max: 80, required: true, default: "Mon texte" }] },
    { key: "speed", kind: "select", label: "Vitesse", options: [["slow", "Lente"], ["normal", "Normale"], ["fast", "Rapide"]], default: "normal" },
    { key: "direction", kind: "select", label: "Sens", options: [["left", "Vers la gauche"], ["right", "Vers la droite"]], default: "left" },
    { key: "separator", kind: "text", label: "Séparateur entre les textes", max: 3, default: "•" },
    { key: "pauseHover", kind: "bool", label: "Pause au survol", default: true },
    { key: "label", kind: "text", label: "Nom de la bande (lecteurs d'écran)", max: 80, default: "Informations défilantes" },
  ],
};
