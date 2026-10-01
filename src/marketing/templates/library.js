// Bibliothèque de modèles : regroupement par catégories et aperçu d'un modèle de départ (rendu avec des données d'exemple).
const { MarketingError } = require("../errors");
const { CATEGORIES } = require("./categories");
const { STARTERS } = require("./starters");
const { previewTemplate } = require("./index");

const starterOf = (key) => (typeof key === "string" && Object.hasOwn(STARTERS, key) ? STARTERS[key] : null);

// [{ category: { key, label }, starters: [{ key, label, description, category, kind, blockTypes }] }] : seulement les catégories non vides
function starterLibrary() {
  return CATEGORIES.map((category) => ({
    category,
    starters: Object.entries(STARTERS)
      .filter(([, s]) => s.category === category.key)
      .map(([key, s]) => ({ key, label: s.label, description: s.description, category: s.category, kind: s.template.kind === "transactional" ? "transactional" : "marketing", blockTypes: s.template.blocks.map((b) => b.type) })),
  })).filter((g) => g.starters.length);
}

// Rendu complet (HTML d'e-mail) d'un modèle de départ : rien n'est écrit, aucun jeton réel
function previewStarter(ctx, key) {
  const starter = starterOf(key);
  if (!starter) throw new MarketingError("not_found", "Modèle de départ introuvable.");
  const { html, subject, warnings } = previewTemplate(ctx, { ...starter.template });
  return { html, subject, warnings };
}

module.exports = { CATEGORIES, starterOf, starterLibrary, previewStarter };
