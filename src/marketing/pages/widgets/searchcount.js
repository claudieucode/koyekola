// Nombre de résultats : compte RÉELLEMENT les contenus publiés du site qui correspondent au terme de l'adresse (?q=), pour UNE source (articles, produits, formations, pages) ; contrairement à « En-tête d'archive », il sert aussi pour les produits et les formations.
// Même moteur, mêmes règles (tous les mots, accents ignorés, isolation par site) que les boucles de résultats.
const SOURCES = ["posts", "products", "courses", "pages"];
const NAMES = { posts: ["article", "articles"], products: ["produit", "produits"], courses: ["formation", "formations"], pages: ["page", "pages"] };
module.exports = {
  type: "searchcount", label: "Nombre de résultats", group: "site", icon: "list", version: 1, style: "text", status: "operational",
  description: "Nombre de contenus trouvés pour le terme cherché (articles, produits, formations ou pages)",
  keywords: "nombre resultats compteur recherche trouves articles produits formations pages",
  schema: [
    { key: "source", kind: "select", label: "Compter", options: [["posts", "Articles"], ["products", "Produits"], ["courses", "Formations"], ["pages", "Pages du site"]], default: "posts" },
    { key: "withTerm", kind: "bool", label: "Rappeler le terme cherché", default: true },
  ],
  data(ctx, p, env) {
    const source = SOURCES.includes(p.source) ? p.source : "posts", q = (env.visitor && env.visitor.query) || {};
    const term = typeof q.q === "string" ? q.q.replace(/\s+/g, " ").trim().slice(0, 80) : "";
    let total = 0;
    if (env.visitor && env.visitor.demoResults === true) total = require("../demoResults").loop({ source, count: 24 }, 1, { ...q }).total;
    else if (term) total = env.runQuery({ source, count: 1, search: term, ...(typeof q.categorie === "string" && q.categorie.trim() ? { categories: [q.categorie.trim().slice(0, 80)] } : {}) }, { pageNo: 1 }).total;
    return { total, term, names: NAMES[source] };
  },
};
