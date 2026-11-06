// Motion Studio, lot « t » : Texte rotatif. Une phrase dont un mot change : liste de mots éditable, 6 transitions, temps d'affichage réglable.
// La place du mot est celle du plus long (rien ne saute). Contenu lisible sans JavaScript (premier mot) ; tous les mots sont lus par les lecteurs d'écran.
// Exécution : public/js/motion-studio/text-fx.js (effet « rotating »), images-clés WAAPI par mot. Boucle sans fin : bouton Pause sur la page publiée.
module.exports = {
  type: "motionrotatingtext", template: "motion-rotating-text", label: "Texte rotatif", group: "advanced", icon: "shuffle", version: 1, style: "text", status: "operational",
  description: "Une phrase dont un mot change à intervalle régulier (fondu, bascule, zoom, flou)",
  keywords: "texte rotatif rotating text mots qui changent alterne carrousel de mots accroche titre animation remplacement",
  schema: [
    { key: "before", kind: "text", label: "Texte avant", max: 80, default: "Une plateforme pour" },
    { key: "words", kind: "items", label: "Mots qui défilent", min: 2, max: 8,
      default: [{ text: "enseigner" }, { text: "vendre" }, { text: "grandir" }],
      fields: [{ key: "text", kind: "text", label: "Mot ou expression", max: 40, required: true, default: "mot" }] },
    { key: "after", kind: "text", label: "Texte après (facultatif)", max: 80, default: "" },
    { key: "tag", kind: "select", label: "Balise HTML", options: [["h1", "Titre 1 (un seul par page)"], ["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"], ["p", "Paragraphe"], ["div", "Bloc (div)"]], default: "h2" },
  ],
  motion: {
    module: "text-fx",
    presets: [["fade-up", "Fondu montant"], ["fade", "Fondu"], ["flip", "Bascule 3D"], ["blur", "Flou"], ["zoom", "Zoom"], ["slide", "Glissement latéral"]],
    defaults: { preset: "fade-up", trigger: "viewport", duration: 500, delay: 0, easing: "smooth", iterations: "infinite" },
    controls: ["preset", "trigger", "duration", "delay", "easing", "iterations", "repeat"],
    params: [{ key: "hold", kind: "number", label: "Temps d'affichage de chaque mot (ms)", min: 200, max: 20000, step: 100, default: 1800 }],
  },
};
