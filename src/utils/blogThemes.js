// Thèmes du blog : icône (registre d'icônes du site, style plat et linéaire) et courte description pour chaque
// catégorie. Les catégories restent celles des articles publiés : ce fichier ne fait qu'associer une présentation,
// reconnue par mots-clés dans l'adresse de la catégorie (« seo », « marketing-digital », « intelligence-artificielle »…).
const THEMES = [
  { test: /(^|-)(ia|ai|intelligence-artificielle|chatgpt|automatisation)(-|$)/, icon: "bot", description: "Outils et usages de l'intelligence artificielle au quotidien." },
  { test: /design|graphi|(^|-)(ux|ui)(-|$)|creation-visuelle/, icon: "palette", description: "Identité visuelle, mise en page et création graphique." },
  { test: /seo|referencement/, icon: "searchCheck", description: "Être trouvé sur Google : contenus, technique et méthode." },
  { test: /commerce|boutique|vente|shop/, icon: "cart", description: "Créer, lancer et faire grandir une boutique en ligne." },
  { test: /marketing|email|newsletter|reseaux-sociaux|communication/, icon: "mail", description: "Attirer, fidéliser et convertir son audience." },
  { test: /tech|developpement|code|web|programmation|outil/, icon: "braces", description: "Développement web, outils et nouvelles technologies." },
  { test: /formation|apprendre|apprentissage|education|pedagog/, icon: "graduation", description: "Apprendre efficacement et progresser à son rythme." },
  { test: /video|montage|audio|podcast/, icon: "video", description: "Tourner, monter et publier des vidéos de qualité." },
  { test: /actualite|news/, icon: "bell", description: "Les nouveautés de KOLAKISA et de son écosystème." },
];

function themeFor(category) {
  const slug = String(category && category.slug || "");
  const found = THEMES.find((t) => t.test.test(slug));
  return {
    icon: found ? found.icon : "book",
    description: found ? found.description : `Tous nos articles « ${category.name} ».`,
  };
}

module.exports = { themeFor };
