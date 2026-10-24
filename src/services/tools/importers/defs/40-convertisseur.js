module.exports = {
  id: "convertisseur", name: "Convertisseur de catégories et d'étiquettes", order: 40, kind: "tool", version: "1.0",
  description: "Convertir des catégories existantes en étiquettes, ou des étiquettes en catégories, de manière sélective. Les articles associés conservent leur lien.",
  formats: [], supports: ["Catégories → étiquettes", "Étiquettes → catégories", "Conservation des associations avec les articles"],
  limits: ["Une catégorie qui a des sous-catégories ne se convertit pas (déplacez-les d'abord).", "Aucun import de fichier : cet outil agit sur le site existant, après aperçu et confirmation."],
  permissions: ["taxonomies.write", "tools.import"], page: "convertisseur",
};
