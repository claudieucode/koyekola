// Texte sur tracé : un texte qui suit une courbe (SVG natif <textPath> : net à toutes les tailles, lisible par les lecteurs d'écran).
module.exports = {
  type: "textpath", label: "Texte sur un tracé", group: "advanced", icon: "type", version: 1, style: "text", status: "operational",
  description: "Un texte qui suit une courbe, un arc ou un cercle",
  keywords: "texte sur un trace courbe arc cercle vague svg path text path",
  schema: [
    { key: "text", kind: "text", label: "Texte", max: 120, required: true, default: "Un texte qui suit une courbe" },
    { key: "shape", kind: "select", label: "Tracé", options: [["wave", "Vague"], ["arc", "Arc"], ["circle", "Cercle"], ["slope", "Pente"], ["line", "Ligne droite"]], default: "wave" },
    { key: "fontSize", kind: "number", label: "Taille du texte (px)", min: 12, max: 96, integer: true, default: 32 },
    { key: "weight", kind: "select", label: "Graisse", options: [["400", "Normale"], ["700", "Grasse"], ["800", "Très grasse"]], default: "700" },
    { key: "color", kind: "color", label: "Couleur du texte" },
    { key: "showPath", kind: "bool", label: "Afficher le tracé (trait fin)", default: false },
    { key: "link", kind: "link", label: "Lien (facultatif)" },
  ],
};
