// Motion Studio, lot « v » : fond animé. Un bloc (titre, texte, bouton) posé sur un fond animé : dégradé qui tourne, mesh gradient (taches de couleur qui dérivent)
// ou grain. Aucune image ni bibliothèque : des calques CSS animés par transform. Boucle sans fin : bouton Pause visible (accessibilité) ; « réduire les animations »
// ou sans JavaScript : fond fixe (même rendu, sans mouvement).
module.exports = {
  type: "motionanimatedbg", template: "motion-animated-bg", label: "Fond animé", group: "advanced", icon: "sparkles", version: 1, style: "box", status: "operational",
  description: "Un bloc sur un dégradé animé, un mesh gradient ou un fond granuleux, avec pause",
  keywords: "fond anime arriere plan degrade gradient mesh grain noise bruit aurora vivant bandeau hero animation motion",
  schema: [
    { key: "title", kind: "text", label: "Titre", max: 140, required: true, default: "Un fond qui vit" },
    { key: "titleTag", kind: "select", label: "Balise du titre", options: [["h1", "Titre 1 (un seul par page)"], ["h2", "Titre 2"], ["h3", "Titre 3"], ["p", "Paragraphe"]], default: "h2" },
    { key: "text", kind: "textarea", label: "Texte", max: 400, default: "Des couleurs qui bougent doucement derrière votre message." },
    { key: "buttonLabel", kind: "text", label: "Texte du bouton (vide = pas de bouton)", max: 40, default: "" },
    { key: "link", kind: "link", label: "Adresse du bouton" },
    { key: "color1", kind: "color", label: "Couleur 1", default: "token:primary" },
    { key: "color2", kind: "color", label: "Couleur 2", default: "token:secondary" },
    { key: "color3", kind: "color", label: "Couleur 3", default: "token:accent" },
    { key: "tone", kind: "select", label: "Couleur du texte", options: [["light", "Texte clair (sur fond foncé)"], ["dark", "Texte foncé (sur fond clair)"]], default: "light" },
    { key: "align", kind: "select", label: "Alignement du texte", options: [["center", "Centré"], ["left", "À gauche"]], default: "center" },
    { key: "minHeight", kind: "number", label: "Hauteur minimale (px)", min: 160, max: 900, integer: true, default: 360 },
  ],
  validate(p, at) { if (p.buttonLabel && !p.link) throw new Error(`${at} : un bouton demande une adresse.`); },
  data(ctx, p) { const V = require("../motionVisual"); return { c1: V.cssColor(p.color1) || "var(--kw-primary, #0277b6)", c2: V.cssColor(p.color2) || "var(--kw-secondary, #6d28d9)", c3: V.cssColor(p.color3) || "var(--kw-accent, #db2777)" }; },
  motion: {
    module: "animated-bg",
    presets: [["gradient", "Dégradé animé"], ["mesh", "Mesh gradient"], ["noise", "Grain animé"]],
    defaults: { preset: "gradient", trigger: "viewport", duration: 10000, delay: 0, easing: "linear", iterations: "infinite", direction: "alternate" },
    controls: ["preset", "duration", "easing"],
    params: [
      { key: "grain", kind: "number", label: "Grain (0 = aucun)", min: 0, max: 60, default: 14 },
      { key: "pausable", kind: "bool", label: "Afficher le bouton Pause (recommandé)", default: true },
    ],
  },
};
