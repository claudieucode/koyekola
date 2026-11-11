// Vingt univers de recherche : ce que l'on cherche (articles, produits, formations, pages du site), les mots de la page et les contenus de secours. Chaque univers est décliné en 5 compositions différentes (recipes.js).
const H = require("./h");
const { cats, popular, refine, mute, card, heading } = H;
const aside = (k, title) => [card(k, [heading(k, "Rubriques", { fontSize: "20px" }), cats(k)]), popular(k, title || "Les plus lus")];
const help = (k) => [card(k, [heading(k, "Besoin d'aide ?", { fontSize: "20px" }), mute(k, "<p>Une question sans réponse ? Écrivez-nous, nous répondons rapidement.</p>"), k.B("Nous contacter", "/contact", "outline", { alignSelf: "flex-start" })]), popular(k, "Questions fréquentes", { mode: "popular" })];
const shop = (k) => [card(k, [heading(k, "Besoin d'un conseil ?", { fontSize: "20px" }), mute(k, "<p>Nos conseils d'achat et guides pratiques.</p>"), k.B("Lire les conseils", "/blog", "outline", { alignSelf: "flex-start" })]), popular(k, "À lire avant d'acheter", { mode: "recent" })];
const U = (key, label, tag, o) => ({ key, label, tag, kind: "posts", sources: ["posts"], labels: { posts: "Articles", pages: "Pages du site", products: "Produits", courses: "Formations" }, ph: "Rechercher…", aside: (k) => aside(k), after: (k) => [refine(k), popular(k, "À lire aussi", { mode: "recent", layout: "cards", count: 3 })], ...o });
const UNIVERS = [
  U("minimaliste", "Recherche minimaliste", "minimaliste", { ph: "Que cherchez-vous ?", opts: { cat: false } }),
  U("corporate", "Recherche corporate", "corporate", { kind: "pages", sources: ["pages", "posts"], ph: "Rechercher une page, une actualité…", labels: { pages: "Pages du site", posts: "Actualités" } }),
  U("institutionnelle", "Recherche institutionnelle", "institutionnel", { kind: "pages", sources: ["pages", "posts"], ph: "Rechercher dans le site…", labels: { pages: "Pages et rubriques", posts: "Communiqués et actualités" } }),
  U("editoriale", "Recherche éditoriale et magazine", "magazine", { ph: "Rechercher un article, une rubrique…", opts: { h: "230px", size: "23px" } }),
  U("journalistique", "Recherche journalistique", "journalisme", { ph: "Rechercher dans les archives…", opts: { cat: true } }),
  U("photo", "Recherche photographique et portfolio", "photographie", { ph: "Rechercher une série, un projet…", opts: { excerpt: false } }),
  U("artistique", "Recherche artistique", "artistique", { ph: "Un mot, une œuvre, un artiste…", opts: { excerpt: false, size: "22px" } }),
  U("technologique", "Recherche technologique et SaaS", "technologie", { kind: "pages", sources: ["pages", "posts"], ph: "Rechercher dans la documentation…", labels: { pages: "Documentation et pages", posts: "Articles" }, aside: help }),
  U("ecommerce", "Recherche e-commerce et catalogue", "e-commerce", { kind: "products", sources: ["products", "posts"], ph: "Rechercher un produit…", labels: { products: "Produits", posts: "Conseils et articles" }, aside: shop, after: (k) => [refine(k, { title: "Pas trouvé ?", text: "Essayez un autre mot ou parcourez le catalogue.", cats: false }), popular(k, "Conseils d'achat", { mode: "recent", layout: "cards", count: 3 })] }),
  U("luxe", "Recherche luxe et mode", "luxe", { kind: "products", sources: ["products", "posts"], ph: "Une pièce, une collection…", labels: { products: "Collection", posts: "Journal" }, aside: shop, opts: { h: "260px" } }),
  U("immobilier", "Recherche immobilier et automobile", "annonces", { ph: "Une ville, un modèle, un mot-clé…", opts: { h: "200px" } }),
  U("voyage", "Recherche voyage et tourisme", "voyage", { ph: "Une destination, une idée de séjour…", opts: { h: "230px" } }),
  U("education", "Recherche éducative et universitaire", "éducation", { kind: "courses", sources: ["courses", "pages"], ph: "Rechercher une formation, un cursus…", labels: { courses: "Formations", pages: "Informations" }, aside: (k) => [card(k, [heading(k, "Catalogue", { fontSize: "20px" }), cats(k, "courses")]), ...help(k).slice(0, 1)] }),
  U("formations", "Recherche formations", "formations", { kind: "courses", sources: ["courses", "posts"], ph: "Rechercher une formation…", labels: { courses: "Formations", posts: "Ressources" }, aside: (k) => [card(k, [heading(k, "Catalogue", { fontSize: "20px" }), cats(k, "courses")]), ...help(k).slice(0, 1)] }),
  U("medicale", "Recherche médicale et scientifique", "santé et science", { ph: "Rechercher un sujet, une pathologie, une étude…", opts: { cat: true } }),
  U("financiere", "Recherche financière et juridique", "finance et droit", { kind: "pages", sources: ["pages", "posts"], ph: "Rechercher une notion, un texte…", labels: { pages: "Pages et textes", posts: "Analyses et actualités" } }),
  U("sportive", "Recherche sportive et événementielle", "sport et événements", { ph: "Un événement, une discipline…", opts: { h: "210px" } }),
  U("gastronomique", "Recherche gastronomique et culturelle", "gastronomie et culture", { ph: "Une recette, un lieu, une exposition…", opts: { h: "220px" } }),
  U("aide", "Centre d'aide et support", "aide", { kind: "pages", sources: ["pages", "posts"], ph: "Décrivez votre problème en quelques mots…", labels: { pages: "Pages d'aide", posts: "Guides et articles" }, aside: help, hint: "Essayez un mot simple : « facture », « mot de passe », « livraison »." }),
  U("communaute", "Recherche communauté et carrières", "communauté", { kind: "pages", sources: ["pages", "posts"], ph: "Rechercher un groupe, une offre, une actualité…", labels: { pages: "Pages et offres", posts: "Actualités" } }),
];
module.exports = { UNIVERS };
