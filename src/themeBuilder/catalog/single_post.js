// Catalogue « Article individuel » : 100 COMPOSITIONS distinctes (23 familles), chacune avec sa propre identité visuelle — catalogue « plat », comme En-tête (voir docs/theme-builder/kolakisa-single-post-library.md).
// Le modèle est rendu AUTOUR d'un article réel : titre {{post.title}} + contenu (postcontent) sont toujours présents ; image à la une par étiquette dynamique ({{post.image}}), jamais d'image factice.
// Aucun lien inventé. Les mises en page sont réparties en 4 lots (single_post/part1..4.js) ; l'audit scripts/audit-article-individuel.js contrôle distinction, grammaire, responsive et contenu dynamique.
const FAMILIES = [
  ["editorial", "Éditorial et revue"], ["magazine", "Magazine et reportage"], ["blog-minimal", "Blog minimaliste"], ["actualites", "Actualités"],
  ["portfolio", "Portfolio et étude de cas"], ["recit", "Récit et storytelling"], ["voyage", "Voyage"], ["cuisine", "Cuisine"], ["lifestyle", "Mode et lifestyle"], ["image-principale", "Image principale"],
  ["technologie", "Technologie"], ["entreprise", "Entreprise"], ["sommaire", "Article avec sommaire"], ["barre-laterale", "Article avec barre latérale"], ["documentation", "Documentation"],
  ["image-pleine", "Image pleine largeur"], ["auteur", "Auteur mis en avant"], ["associes", "Contenus associés"], ["navigation", "Navigation entre articles"], ["partage", "Partage social"],
  ["commentaires", "Commentaires"], ["progression", "Progression de lecture"], ["formats", "Formats spéciaux"],
];
// famille de chaque mise en page : par tranches de chaque lot (l'ordre du lot est celui des familles)
const SPLITS = [
  ["part1", [["editorial", 7], ["magazine", 7], ["blog-minimal", 6], ["actualites", 5]]],
  ["part2", [["portfolio", 4], ["recit", 4], ["voyage", 4], ["cuisine", 3], ["lifestyle", 5], ["image-principale", 5]]],
  ["part3", [["technologie", 5], ["entreprise", 5], ["sommaire", 5], ["barre-laterale", 5], ["documentation", 5]]],
  ["part4", [["image-pleine", 3], ["auteur", 3], ["associes", 3], ["navigation", 3], ["partage", 3], ["commentaires", 3], ["progression", 3], ["formats", 4]]],
];
const layouts = [];
for (const [file, parts] of SPLITS) {
  const list = require(`./single_post/${file}`); let i = 0;
  for (const [family, n] of parts) for (let j = 0; j < n; j += 1, i += 1) layouts.push({ ...list[i], family });
  if (i !== list.length) throw new Error(`single_post/${file} : ${list.length} mises en page, ${i} classées dans une famille`);
}
module.exports = { type: "single_post", kind: "page", flat: true, families: FAMILIES.map(([key, label]) => ({ key, label })), layouts };
