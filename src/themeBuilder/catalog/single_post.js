// Catalogue « Article individuel » v2 : 100 COMPOSITIONS éditoriales distinctes en 12 familles (voie B, voir docs/theme-builder/single-post/100_TEMPLATES_DIVERSITY_PLAN.md).
// Le modèle est rendu AUTOUR d'un article réel : titre {{post.title}} + contenu (postcontent) toujours présents ; image par étiquette dynamique ({{post.image}}), jamais d'image factice, aucun lien inventé.
// Les mises en page sont rangées par fichiers de famille (single_post/v2/fNN.js) ; l'audit scripts/audit-article-individuel.js contrôle distinction, grammaire, responsive et contenu dynamique.
const FAMILIES = [
  ["minimaliste", "Blogs minimalistes"], ["magazine", "Magazines professionnels"], ["journal", "Journaux numériques"], ["blog-pro", "Blogs personnels et professionnels"],
  ["technologie", "Technologie et logiciels"], ["education", "Éducation et formation"], ["photographie", "Photographie et création"], ["business", "Business et corporate"],
  ["voyage", "Voyage et lifestyle"], ["sante", "Santé, sport et bien-être"], ["formats", "Formats éditoriaux avancés"], ["creatif", "Expériences visuelles et créatives"],
];
// famille de chaque mise en page : par tranches de chaque fichier (l'ordre du fichier est celui des familles)
const SPLITS = [
  ["f01", [["minimaliste", 8]]], ["f02", [["magazine", 10]]], ["f03", [["journal", 10]]], ["f04", [["blog-pro", 10]]], ["f05", [["technologie", 8]]], ["f06", [["education", 8]]],
  ["f07", [["photographie", 8], ["business", 8]]], ["f09", [["voyage", 6], ["sante", 6], ["formats", 8]]], ["f12", [["creatif", 10]]],
];
const layouts = [];
for (const [file, parts] of SPLITS) {
  const list = require(`./single_post/v2/${file}`); let i = 0;
  for (const [family, n] of parts) for (let j = 0; j < n; j += 1, i += 1) layouts.push({ ...list[i], family });
  if (i !== list.length) throw new Error(`single_post/v2/${file} : ${list.length} mises en page, ${i} classées dans une famille`);
}
module.exports = { type: "single_post", kind: "page", flat: true, families: FAMILIES.map(([key, label]) => ({ key, label })), layouts };
