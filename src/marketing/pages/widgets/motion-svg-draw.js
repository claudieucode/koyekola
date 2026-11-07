// Motion Studio, lot « v » : tracé SVG qui se dessine. Une forme prédéfinie (trait, vague, cercle, coche, étoile…) ou un SVG collé, nettoyé par le serveur
// (liste blanche : path, circle, ellipse, line, polyline, polygon, rect, g ; jamais de script, de style, d'image ni de lien). Le tracé est animé par le navigateur
// (stroke-dashoffset, longueur lue par getTotalLength) ; le serveur retire stroke-dasharray, c'est donc le script qui le pose.
const V = require("../motionVisual");
module.exports = {
  type: "motionsvgdraw", template: "motion-svg-draw", label: "Tracé SVG animé", group: "advanced", icon: "edit", version: 1, style: "box", status: "operational",
  description: "Un tracé qui se dessine : forme prédéfinie ou SVG collé (nettoyé)",
  keywords: "svg trace draw dessin ligne forme path stroke dashoffset ecriture signature soulignement coche etoile animation motion",
  schema: [
    { key: "source", kind: "select", label: "Forme", options: [["preset", "Forme prédéfinie"], ["custom", "SVG collé"]], default: "preset" },
    { key: "shape", kind: "select", label: "Forme prédéfinie", options: V.SHAPE_OPTIONS, default: "wave" },
    { key: "svg", kind: "textarea", label: "Code SVG (si « SVG collé » : balises sûres seulement, le reste est retiré)", max: 12000, default: "" },
    { key: "alt", kind: "text", label: "Description (lue par les lecteurs d'écran ; vide = décoratif)", max: 200, default: "" },
    { key: "strokeWidth", kind: "number", label: "Épaisseur du trait", min: 0.5, max: 24, step: 0.5, default: 4 },
    { key: "cap", kind: "select", label: "Extrémités du trait", options: [["round", "Arrondies"], ["butt", "Droites"], ["square", "Carrées"]], default: "round" },
    { key: "width", kind: "number", label: "Largeur maximale (px)", min: 40, max: 1600, integer: true, default: 320 },
    { key: "align", kind: "select", label: "Alignement", options: [["center", "Centré"], ["left", "À gauche"], ["right", "À droite"]], default: "center" },
  ],
  validate(p, at) {
    if (p.source === "custom") {
      const r = V.sanitizeSvg(p.svg);
      if (!r.ok) throw new Error(`${at} : ${r.error}`);
    }
  },
  // Le SVG affiché est TOUJOURS reconstruit au rendu (jamais le texte enregistré tel quel)
  data(ctx, p) { return p.source === "custom" ? V.sanitizeSvg(p.svg) : V.presetSvg(p.shape); },
  motion: {
    module: "svg-draw",
    presets: [["draw", "Tracé du début à la fin"], ["draw-reverse", "Tracé de la fin au début"], ["draw-fill", "Tracé puis remplissage"]],
    defaults: { preset: "draw", trigger: "viewport", duration: 1600, delay: 0, easing: "smooth", stagger: 150 },
    controls: ["preset", "trigger", "duration", "delay", "easing", "stagger", "repeat", "scrub"],
  },
};
