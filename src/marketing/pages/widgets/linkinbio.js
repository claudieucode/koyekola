// Lien en bio : une page de liens (avatar, nom, présentation, boutons) pour les profils de réseaux sociaux. Chaque lien est compté dans les statistiques.
module.exports = {
  type: "linkinbio", label: "Lien en bio", group: "social", icon: "link", version: 1, style: "box", status: "operational",
  description: "Avatar, nom et une liste de boutons de liens",
  keywords: "lien en bio link in bio linktree profil liens reseaux sociaux instagram tiktok boutons",
  schema: [
    { key: "avatar", kind: "image", label: "Photo ou logo (facultatif)" },
    { key: "name", kind: "text", label: "Nom", max: 80, default: "[Votre nom]" },
    { key: "bio", kind: "textarea", label: "Présentation (facultative)", max: 240, default: "" },
    { key: "links", kind: "items", label: "Liens", min: 1, max: 12, default: [{ label: "Mon site", url: "/", icon: "link", style: "primary" }, { label: "Me contacter", url: "/contact", icon: "", style: "outline" }],
      fields: [
        { key: "label", kind: "text", label: "Texte du bouton", max: 60, required: true, default: "Mon lien" },
        { key: "url", kind: "link", label: "Adresse", required: true, default: "/" },
        { key: "icon", kind: "icon", label: "Icône (facultative)" },
        { key: "style", kind: "select", label: "Style", options: [["primary", "Plein"], ["outline", "Contour"]], default: "primary" },
      ] },
    { key: "align", kind: "select", label: "Alignement", options: [["center", "Centré"], ["left", "À gauche"]], default: "center" },
  ],
};
