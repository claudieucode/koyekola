// Registre FERMÉ des types de modèles du Theme Builder (programme 23.1). `views` : vues du contexte de résolution auxquelles le type s'applique ; `global` : s'applique à toute vue (en-tête, pied,
// barre latérale) ; `module` : module de site requis (siteModules) ; `legacy` : famille de l'ancien système importée dans ce type.
const VIEWS = Object.freeze(["front", "page", "post", "archive", "search", "not_found", "product", "product_archive"]);
const TYPES = Object.freeze({
  header: { label: "En-tête", group: "global", global: true, legacy: null },
  footer: { label: "Pied de page", group: "global", global: true, legacy: null },
  sidebar: { label: "Barre latérale", group: "global", global: true, legacy: null },
  single_page: { label: "Page individuelle", group: "content", views: ["front", "page"], legacy: "static_page" },
  single_post: { label: "Article individuel", group: "content", views: ["post"], legacy: "single_post" },
  archive: { label: "Archives", group: "content", views: ["archive"], legacy: ["blog_archive", "category_archive", "tag_archive", "author_archive"] },
  search_results: { label: "Résultats de recherche", group: "content", views: ["search"], legacy: "search_results" },
  not_found: { label: "Page 404", group: "content", views: ["not_found"], legacy: "not_found" },
  single_product: { label: "Produit individuel", group: "shop", views: ["product"], module: "commerce", legacy: "product" },
  product_archive: { label: "Archives produits", group: "shop", views: ["product_archive"], module: "commerce", legacy: "product_archive" },
  custom: { label: "Modèle personnalisé", group: "custom", global: true, legacy: null },
});
const GROUPS = Object.freeze({ global: "Structure globale", content: "Pages et contenus", shop: "Boutique", custom: "Modèles personnalisés" });
const has = (k) => Object.hasOwn(TYPES, k);
// Un type s'applique-t-il à cette vue ?
const appliesTo = (type, view) => has(type) && (TYPES[type].global === true || TYPES[type].views.includes(view));
module.exports = { TYPES, GROUPS, VIEWS, has, appliesTo };
