module.exports = {
  id: "kolakisa", name: "Kolakisa", order: 10, kind: "native", version: "1.0",
  description: "Importer un fichier d'export Kolakisa (Outils → Exporter) : pages, articles, catégories, menus, redirections, médias (métadonnées) et réglages d'un autre site Kolakisa.",
  formats: [".json"], mime: ["application/json", "text/plain"],
  supports: ["Pages", "Articles", "Catégories et étiquettes", "Menus", "Redirections", "Métadonnées des médias", "Référencement (SEO)", "Réglages du site"],
  limits: ["Les fichiers médias ne sont pas dans l'export : seules leurs métadonnées le sont.", "Les commentaires ne sont pas importés (confidentialité : ils s'exportent seulement).", "Jamais d'utilisateur, de mot de passe ni de domaine.", "Pages et articles sont créés en brouillon."],
  permissions: ["tools.import"], page: "kolakisa",
};
