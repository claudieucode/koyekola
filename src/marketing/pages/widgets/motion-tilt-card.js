// Motion Studio, lot « v » : carte inclinée en 3D qui suit la souris, avec reflet lumineux. Souris seulement : sur écran tactile ou avec
// « réduire les animations », la carte reste à plat (le contenu, lui, est identique).
module.exports = {
  type: "motiontiltcard", template: "motion-tilt-card", label: "Carte inclinée 3D", group: "advanced", icon: "layers", version: 1, style: "box", status: "operational",
  description: "Une carte qui s'incline vers la souris, avec un reflet lumineux",
  keywords: "carte tilt 3d inclinaison perspective souris survol reflet glare effet profondeur animation motion",
  schema: [
    { key: "image", kind: "image", label: "Image (facultative)" },
    { key: "imageAlt", kind: "text", label: "Description de l'image (vide = décorative)", max: 200, default: "" },
    { key: "title", kind: "text", label: "Titre", max: 120, required: true, default: "Une carte qui prend du relief" },
    { key: "titleTag", kind: "select", label: "Balise du titre", options: [["h2", "Titre 2"], ["h3", "Titre 3"], ["h4", "Titre 4"], ["p", "Paragraphe"]], default: "h3" },
    { key: "text", kind: "textarea", label: "Texte", max: 400, default: "Passez la souris dessus : elle s'incline vers vous." },
    { key: "linkLabel", kind: "text", label: "Texte du lien (vide = pas de lien)", max: 40, default: "" },
    { key: "link", kind: "link", label: "Adresse du lien" },
  ],
  validate(p, at) { if (p.linkLabel && !p.link) throw new Error(`${at} : un lien demande une adresse.`); },
  motion: {
    module: "tilt-card",
    defaults: { duration: 400, easing: "smooth" },
    controls: ["duration", "easing"],
    preview: false,
    params: [
      { key: "maxTilt", kind: "number", label: "Inclinaison maximale (°)", min: 2, max: 25, default: 10 },
      { key: "scale", kind: "number", label: "Agrandissement au survol (1 = aucun)", min: 1, max: 1.15, step: 0.01, default: 1.03 },
      { key: "perspective", kind: "number", label: "Perspective (px, plus petit = plus fort)", min: 400, max: 2000, default: 900 },
      { key: "glare", kind: "bool", label: "Reflet lumineux", default: true },
      { key: "glareStrength", kind: "number", label: "Intensité du reflet (%)", min: 5, max: 80, default: 35 },
      { key: "invert", kind: "bool", label: "Inverser le sens de l'inclinaison", default: false },
    ],
  },
};
