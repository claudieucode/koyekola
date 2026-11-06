// Motion Studio, lot « t » : Texte circulaire. Texte posé sur un cercle (SVG natif <textPath>, net à toutes les tailles, rempli avec la couleur du texte) qui tourne
// lentement, avec un texte ou un symbole au centre. Le texte est répété pour remplir le cercle. Lisible sans JavaScript (cercle fixe) ; en mouvement réduit le cercle ne tourne pas.
// Exécution : public/js/motion-studio/text-fx.js (effet « circular »), rotation d'un groupe SVG. Bouton Pause (rotation sans fin).
const R = 80, CIRC = 2 * Math.PI * R;
module.exports = {
  type: "motioncirculartext", template: "motion-circular-text", label: "Texte circulaire", group: "advanced", icon: "annotCircle", version: 1, style: "text", status: "operational",
  description: "Un texte posé sur un cercle qui tourne, avec un symbole au centre",
  keywords: "texte circulaire circular text cercle rond rotation badge sceau tampon textpath svg tournant logo",
  schema: [
    { key: "text", kind: "text", label: "Texte (répété pour remplir le cercle)", max: 60, required: true, default: "Créer · Animer · Publier ·" },
    { key: "center", kind: "text", label: "Texte ou symbole au centre (facultatif)", max: 6, default: "✦" },
    { key: "size", kind: "number", label: "Taille du cercle (px)", min: 120, max: 640, integer: true, default: 260 },
    { key: "fontSize", kind: "number", label: "Taille des lettres", min: 8, max: 28, integer: true, default: 14 },
    { key: "weight", kind: "select", label: "Graisse", options: [["400", "Normale"], ["600", "Demi-grasse"], ["800", "Très grasse"]], default: "600" },
    { key: "startAngle", kind: "number", label: "Angle de départ (degrés)", min: 0, max: 359, integer: true, default: 0 },
  ],
  data(ctx, p) {
    const unit = String(p.text).trim() + " ", per = 0.62 * p.fontSize * Array.from(unit).length;
    const fs = per > CIRC ? Math.max(5, Math.floor((CIRC / (0.62 * Array.from(unit).length)) * 10) / 10) : p.fontSize;
    const reps = Math.max(1, Math.min(12, Math.floor(CIRC / (0.62 * fs * Array.from(unit).length))));
    return { r: R, circ: Math.round(CIRC * 100) / 100, fs, reps, str: unit.repeat(reps).trim() };
  },
  motion: {
    module: "text-fx",
    defaults: { trigger: "viewport", duration: 10000, delay: 0, easing: "linear", iterations: "infinite" },
    controls: ["trigger", "duration", "delay", "easing", "iterations", "repeat"],
    params: [{ key: "turn", kind: "select", label: "Sens de rotation", options: [["cw", "Sens des aiguilles d'une montre"], ["ccw", "Sens inverse"]], default: "cw" }],
  },
};
