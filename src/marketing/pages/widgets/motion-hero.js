// Motion Studio (lot S) : Hero animé orchestré. Titre, sous-titre, boutons et visuel entrent en séquence ; fond animé léger (avec pause).
// Contrat : docs/motion-studio/MOTION_STUDIO_COMPONENT_CONTRACT.md. Exécution : public/js/motion-studio/hero.js. Sans JavaScript : tout est visible, fond fixe.
module.exports = {
  type: "motionhero", template: "motion-hero", label: "Hero animé", group: "advanced", icon: "image", version: 1, style: "box", status: "operational",
  description: "Premier écran : titre, sous-titre, boutons et visuel qui entrent en séquence, fond animé léger",
  keywords: "hero animé premier ecran banniere en-tete titre sous-titre boutons visuel sequence orchestree entree fond anime aurore degrade motion",
  schema: [
    { key: "eyebrow", kind: "text", label: "Petit texte au-dessus du titre (facultatif)", max: 60, default: "Nouveau" },
    { key: "title", kind: "text", label: "Titre", max: 140, required: true, default: "Un premier écran qui donne envie" },
    { key: "tag", kind: "select", label: "Balise du titre", options: [["h1", "Titre 1 (un seul par page)"], ["h2", "Titre 2"]], default: "h1" },
    { key: "subtitle", kind: "textarea", label: "Sous-titre (facultatif)", max: 300, default: "Quelques mots pour expliquer ce que vous proposez et à qui." },
    { key: "buttons", kind: "items", label: "Boutons", min: 0, max: 3,
      default: [{ label: "Commencer", url: "/", style: "primary" }, { label: "En savoir plus", url: "/", style: "outline" }],
      fields: [
        { key: "label", kind: "text", label: "Texte du bouton", max: 40, required: true, default: "Mon bouton" },
        { key: "url", kind: "link", label: "Adresse", required: true, default: "/" },
        { key: "style", kind: "select", label: "Aspect", options: [["primary", "Plein"], ["outline", "Contour"]], default: "primary" },
      ] },
    { key: "image", kind: "image", label: "Visuel (facultatif)" },
    { key: "imageAlt", kind: "text", label: "Texte de remplacement du visuel (vide = décoratif)", max: 200, default: "" },
    { key: "layout", kind: "select", label: "Disposition", options: [["split-right", "Texte à gauche, visuel à droite"], ["split-left", "Visuel à gauche, texte à droite"], ["centered", "Centré, visuel dessous"]], default: "split-right" },
    { key: "height", kind: "select", label: "Hauteur", options: [["auto", "Selon le contenu"], ["tall", "Grand écran (70 % de la fenêtre)"], ["full", "Plein écran"]], default: "tall" },
    { key: "bg", kind: "select", label: "Fond animé", options: [["none", "Aucun"], ["aurora", "Aurore (halos qui dérivent)"], ["gradient", "Dégradé qui tourne lentement"]], default: "aurora" },
    { key: "bgSpeed", kind: "select", label: "Vitesse du fond", options: [["slow", "Lente"], ["normal", "Normale"]], default: "slow" },
  ],
  validate(p, at) { p.buttons.forEach((b, i) => { if (!b.label) throw new Error(`${at}, bouton ${i + 1} : texte obligatoire.`); }); },
  motion: {
    module: "hero", preview: true,
    presets: [["fade-up", "Fondu montant"], ["fade", "Fondu"], ["blur", "Netteté progressive"], ["scale", "Zoom doux"], ["slide", "Glissement latéral"]],
    defaults: { preset: "fade-up", trigger: "load", duration: 800, delay: 0, easing: "smooth", stagger: 140 },
    controls: ["preset", "trigger", "duration", "delay", "easing", "stagger", "repeat"],
    params: [],
  },
};
