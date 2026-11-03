// Bibliothèque de modèles : modèles du THEME BUILDER officiels (programme 20.4). Un modèle de thème est une PAGE du Page Builder qui devient le modèle d'une famille de pages du site
// (pages/themeTemplates.js : article, liste du blog, archives, recherche, page introuvable, fiche de formation). L'importation crée la page en brouillon ; l'affectation à la famille
// de pages (donc l'effet sur le site public) n'a lieu que si la personne la demande, avec le droit « appearance.templates », et jamais en remplaçant un modèle existant.
const { helpers: { H, T, B, section, grid } } = require("./patterns");

const post = (type, props = {}) => ({ type, props });
const list = (mode, count = 12) => post("querylist", { title: "", source: "posts", mode, count });

const PARTS = [
  { key: "article", themeType: "single_post", category: "Articles", name: "Article du blog", description: "Titre, informations de l'article, contenu, catégories, auteur, article précédent ou suivant et commentaires.",
    build: () => [section([H("{{post.title}}", "1"), post("postmeta"), post("postcontent"), post("postterms"), post("authorbox"), post("postnav"), post("postcomments")], { maxWidth: "820px" })] },
  { key: "liste-blog", themeType: "blog_archive", category: "Archives", name: "Liste du blog", description: "En-tête d'archive et grille des articles paginée, qui suit la catégorie courante.",
    build: () => [section([post("archiveinfo"), list("archive", 12)])] },
  { key: "archive-categorie", themeType: "category_archive", category: "Archives", name: "Archive de catégorie", description: "Titre de la catégorie, description et liste de ses articles.",
    build: () => [section([post("breadcrumb", { items: [{ label: "Accueil", url: "/" }, { label: "Blog", url: "/blog" }, { label: "{{archive.title}}" }], separator: "chevron" }), { type: "stack", children: [post("archiveinfo", { showCount: true })], styles: { desktop: { gap: "8px", paddingTop: "32px", paddingRight: "32px", paddingBottom: "32px", paddingLeft: "32px", borderRadius: "16px", backgroundColor: "token:surface" } } }, { type: "grid", children: [list("archive", 12)], styles: { desktop: { columns: 1 }, mobile: { columns: 1 } } }])] },
  { key: "archive-auteur", themeType: "author_archive", category: "Archives", name: "Page d'un auteur", description: "Boîte auteur et liste de ses articles.",
    build: () => [section([post("archiveinfo"), post("authorbox"), list("archive", 12)])] },
  { key: "resultats-recherche", themeType: "search_results", category: "Recherche", name: "Résultats de recherche", description: "Champ de recherche, rappel de la requête et résultats du blog.",
    build: () => [section([H("Résultats pour « {{query.q}} »", "1"), post("search", { target: "blog" }), post("archiveinfo"), list("archive", 12)])] },
  { key: "page-introuvable", themeType: "not_found", category: "Erreurs", name: "Page introuvable (404)", description: "Message clair, recherche dans le blog et retour à l'accueil.",
    build: () => [section([H("Cette page est introuvable", "1", { textAlign: "center" }), T("<p>Elle a peut-être été déplacée ou supprimée.</p>", { textAlign: "center" }), post("search", { target: "blog" }), B("Retour à l'accueil", "/")], { alignItems: "center", paddingTop: "96px", paddingBottom: "96px" })] },
  { key: "fiche-produit", themeType: "product", category: "Boutique", name: "Fiche produit", description: "Titre, prix, disponibilité et bouton d'achat du produit affiché (étiquettes {{product.…}}), branchés sur la boutique du site.",
    build: () => [section([H("{{product.title}}", "1"), T("<p>{{product.price}} · {{product.availability}}</p>"), post("shopbuy"), T("<p>[Description, matières, entretien : à compléter dans la fiche du produit.]</p>")], { maxWidth: "820px" })] },
  { key: "catalogue-produits", themeType: "product_archive", category: "Boutique", name: "Catalogue de produits", description: "Recherche, filtres et grille qui suit la catégorie et la recherche de l'adresse.",
    build: () => [section([H("Notre catalogue", "1"), post("shopsearch"), post("shopfilters"), post("shopgrid", { source: "archive", count: 12, columns: "3", orderby: "newest" })])] },
];
// Programme 100 : modèles de thème supplémentaires (src/marketing/pages/lib100/parts.js).
PARTS.push(...require("./lib100/parts").entries({ H, T, B, section, grid, post, list }));
for (const p of PARTS) p.build = require("./lib100/fixes").wrap(p.build);
void grid;
const catalog = () => PARTS.map(({ key, themeType, category, name, description }) => ({ key, themeType, category, name, description }));
const buildPart = (key) => { const c = PARTS.find((x) => x.key === key); return c ? JSON.parse(JSON.stringify(c.build())) : null; };
module.exports = { PARTS, catalog, buildPart };
