// Motion Studio, lot d : interrupteurs ou cases à cocher animés. Ce sont de VRAIES cases (<input type="checkbox">) écrites par le serveur : clavier, lecteurs d'écran
// (role=switch pour l'interrupteur), et animation en pur CSS, donc aussi sans JavaScript. Le module (switch.js) règle la vitesse et peut mémoriser les choix sur l'appareil.
// Limite honnête : le composant ne pilote pas d'autre élément de la page et n'envoie rien ; il émet l'événement « kwms:change » (utile à un script, invisible autrement).
module.exports = {
  type: "motionswitch", template: "motion-switch", label: "Interrupteurs et cases animés", group: "advanced", icon: "check", version: 1, style: "box", status: "operational",
  description: "Des interrupteurs ou des cases à cocher qui s'animent, avec mémorisation facultative sur l'appareil",
  keywords: "interrupteur toggle switch case a cocher checkbox bascule option preference coche animation formulaire",
  schema: [
    { key: "legend", kind: "text", label: "Titre du groupe (lu par les lecteurs d'écran)", max: 80, required: true, default: "Préférences" },
    { key: "variant", kind: "select", label: "Forme", options: [["switch", "Interrupteurs"], ["checkbox", "Cases à cocher"]], default: "switch" },
    { key: "items", kind: "items", label: "Options", min: 1, max: 10,
      default: [{ label: "Recevoir les nouveautés", hint: "Un e-mail par mois, pas plus.", checked: true }, { label: "Activer les rappels", hint: "", checked: false }],
      fields: [
        { key: "label", kind: "text", label: "Texte de l'option", max: 100, required: true, default: "Option" },
        { key: "hint", kind: "text", label: "Précision sous le texte (facultatif)", max: 140, default: "" },
        { key: "checked", kind: "bool", label: "Activée au départ", default: false },
      ] },
    { key: "showState", kind: "bool", label: "Afficher « Activé / Désactivé » à droite (interrupteurs)", default: true },
    { key: "onText", kind: "text", label: "Texte quand activé", max: 20, default: "Activé" },
    { key: "offText", kind: "text", label: "Texte quand désactivé", max: 20, default: "Désactivé" },
    { key: "remember", kind: "bool", label: "Mémoriser les choix du visiteur sur son appareil", default: false },
    { key: "tone", kind: "select", label: "Couleur", options: [["primary", "Principale"], ["secondary", "Secondaire"], ["accent", "Accent"], ["success", "Succès"], ["warning", "Attention"], ["error", "Erreur"]], default: "primary" },
  ],
  motion: {
    module: "switch",
    presets: [["smooth", "Doux"], ["spring", "Rebond"], ["snap", "Sec"]],
    defaults: { preset: "smooth", duration: 240, easing: "smooth" },
    controls: ["preset", "duration", "easing"],
  },
};
