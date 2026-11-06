// Motion Studio, lot d : notification (toast) animée, déclenchée par un bouton, un délai ou le chargement. Fermable, zone aria-live. Exécution : public/js/motion-studio/toast.js
// Sans JavaScript : le message est affiché en clair dans la page (rien ne se déclenche seul). Dans l'éditeur : aperçu en place (la notification flottante n'est pas lancée).
module.exports = {
  type: "motiontoast", template: "motion-toast", label: "Notification animée", group: "advanced", icon: "bell", version: 1, style: "box", status: "operational",
  description: "Une notification qui apparaît au clic, après un délai ou au chargement, et se ferme",
  keywords: "notification toast message alerte popup confirmation succes erreur info snackbar aria live delai bouton fermer",
  schema: [
    { key: "title", kind: "text", label: "Titre (facultatif)", max: 60, default: "Message envoyé" },
    { key: "message", kind: "textarea", label: "Message", max: 240, required: true, default: "Merci ! Nous vous répondons sous 24 heures." },
    { key: "tone", kind: "select", label: "Type", options: [["info", "Information"], ["success", "Succès"], ["warning", "Attention"], ["error", "Erreur"]], default: "success" },
    { key: "launch", kind: "select", label: "Déclenchement", options: [["click", "Au clic sur un bouton"], ["delay", "Après un délai"], ["load", "Au chargement de la page"]], default: "click" },
    { key: "buttonLabel", kind: "text", label: "Texte du bouton (déclenchement au clic)", max: 40, default: "Afficher la notification" },
    { key: "after", kind: "number", label: "Délai avant l'apparition, en secondes (déclenchement après un délai)", min: 1, max: 120, integer: true, default: 5 },
    { key: "hideAfter", kind: "number", label: "Disparition automatique après (secondes, 0 = reste jusqu'à la fermeture)", min: 0, max: 60, integer: true, default: 6 },
    { key: "placement", kind: "select", label: "Position à l'écran", options: [["bottom-right", "En bas à droite"], ["bottom-left", "En bas à gauche"], ["bottom-center", "En bas au centre"], ["top-right", "En haut à droite"], ["top-left", "En haut à gauche"], ["top-center", "En haut au centre"]], default: "bottom-right" },
  ],
  motion: {
    module: "toast",
    presets: [["slide", "Glissement"], ["fade", "Fondu"], ["pop", "Zoom"]],
    defaults: { preset: "slide", duration: 350, easing: "smooth" },
    controls: ["preset", "duration", "easing"],
  },
};
