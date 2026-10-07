// Carte de profil : photo, nom, rôle, présentation, lien (formateur, équipe, intervenant). Premier widget construit
// uniquement avec l'architecture des widgets personnalisés (voir index.js et docs/widgets-personnalises.md).
module.exports = {
  type: "profilecard",
  label: "Carte de profil",
  group: "general",
  icon: "users",
  keywords: "carte profil equipe formateur intervenant membre photo bio auteur",
  version: 1,
  style: "text",
  schema: [
    { key: "photo", kind: "image", label: "Photo (facultative)" },
    { key: "name", kind: "text", label: "Nom", max: 80, required: true, default: "[Nom]" },
    { key: "role", kind: "text", label: "Rôle", max: 80, default: "[Rôle]" },
    { key: "bio", kind: "textarea", label: "Présentation", max: 400, default: "" },
    { key: "link", kind: "link", label: "Lien (facultatif)" },
    { key: "linkLabel", kind: "text", label: "Texte du lien", max: 40, default: "Voir le profil" },
    { key: "align", kind: "select", label: "Alignement", options: [["center", "Centré"], ["left", "À gauche"]], default: "center" },
  ],
};
