// Appel à l'action (comme « Call to Action » d'Elementor) : une carte avec image, titre, texte et bouton ; habillage « Classique » (image à côté / au-dessus)
// ou « Couverture » (l'image remplit la carte, le texte se pose dessus). Le lien peut couvrir toute la carte ou le seul bouton ; bandeau (ruban) facultatif.
module.exports = {
  type: "cta", label: "Appel à l'action", group: "general", icon: "mousePointer", version: 1, style: "box", status: "operational",
  description: "Image, titre, texte et bouton dans une carte cliquable",
  keywords: "appel action call to action cta carte bouton image couverture ruban banniere promotion offre",
  schema: [
    { key: "skin", kind: "select", label: "Habillage", options: [["classic", "Classique (image et texte)"], ["cover", "Couverture (texte sur l'image)"]], default: "classic" },
    { key: "image", kind: "image", label: "Image (facultative)" },
    { key: "imageAlt", kind: "text", label: "Texte de remplacement de l'image (vide = décorative)", max: 200, default: "" },
    { key: "position", kind: "select", label: "Place de l'image (habillage classique)", options: [["above", "Au-dessus"], ["left", "À gauche"], ["right", "À droite"]], default: "above" },
    { key: "title", kind: "text", label: "Titre", max: 120, required: true, default: "Un titre qui donne envie" },
    { key: "titleTag", kind: "select", label: "Balise du titre", options: [["h2", "H2"], ["h3", "H3"], ["h4", "H4"], ["p", "Paragraphe"]], default: "h3" },
    { key: "text", kind: "textarea", label: "Description", max: 400, default: "Quelques mots pour expliquer l'offre." },
    { key: "buttonLabel", kind: "text", label: "Texte du bouton (vide = pas de bouton)", max: 40, default: "En savoir plus" },
    { key: "link", kind: "link", label: "Lien", default: "/catalogue" },
    { key: "applyOn", kind: "select", label: "Appliquer le lien sur", options: [["button", "Le bouton seul"], ["box", "Toute la carte"]], default: "button" },
    { key: "ribbon", kind: "text", label: "Bandeau (facultatif, ex. « Nouveau »)", max: 24, default: "" },
    { key: "ribbonSide", kind: "select", label: "Côté du bandeau", options: [["right", "Droite"], ["left", "Gauche"]], default: "right" },
    { key: "align", kind: "select", label: "Alignement du texte", options: [["center", "Centré"], ["left", "À gauche"]], default: "center" },
  ],
  validate(p, at) {
    if (p.applyOn === "box" && !p.link) throw new Error(`${at} : « toute la carte » demande un lien.`);
    if (p.buttonLabel && !p.link) throw new Error(`${at} : un bouton demande un lien.`);
  },
};
