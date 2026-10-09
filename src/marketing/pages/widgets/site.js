// Famille « Site » : widgets dynamiques lus à l'affichage (contenu publié uniquement), tous bâtis sur le moteur de requêtes
// commun (pages/query.js) et le contexte de la page (article courant, archive, visiteur). Mode d'emploi : docs/widgets-personnalises.md.
const query = require("../query");

const MODES = [["recent", "Les plus récents"], ["popular", "Les plus lus"], ["commented", "Les plus commentés"], ["related", "Articles liés (même catégorie ou étiquette)"],
  ["samecategory", "Même catégorie que l'article affiché"], ["sameauthor", "Même auteur que l'article affiché"], ["archive", "Suit l'archive affichée (catégorie, étiquette, auteur)"], ["random", "Au hasard"]];
const SOURCES = [["posts", "Articles"], ["courses", "Formations"], ["pages", "Pages du site"], ["authors", "Auteurs"], ["categories", "Catégories"], ["tags", "Étiquettes"]];

// Requête d'une liste : le mode choisit tri et filtres, uniquement parmi ceux que la source sait faire
function listQuery(p, scope) {
  const q = { source: p.source, count: p.count, tags: p.tags ? p.tags.split(",") : undefined, categories: p.category ? [p.category] : undefined, orderby: "date", order: "desc" };
  const cur = scope && scope.post;
  if (p.source === "posts") {
    if (p.mode === "popular") q.orderby = "views";
    else if (p.mode === "commented") q.orderby = "comments";
    else if (p.mode === "random") q.orderby = "random";
    else if (p.mode === "related") { q.related = "both"; q.excludeCurrent = true; }
    else if (p.mode === "samecategory") { q.related = "category"; q.excludeCurrent = true; }
    else if (p.mode === "sameauthor") { q.author = "current"; q.excludeCurrent = true; }
    else if (p.mode === "archive") q.archive = true;
  } else if (p.source === "courses" || p.source === "pages") {
    if (p.mode === "random" && p.source === "courses") q.orderby = "random";
    if (p.excludeCurrent) q.excludeCurrent = true;
  } else { q.orderby = p.mode === "popular" ? (p.source === "authors" ? "posts" : "count") : "title"; q.order = q.orderby === "title" ? "asc" : "desc"; if (p.mode === "random") q.orderby = "random"; }
  return { q, needsPost: p.source === "posts" && ["related", "samecategory", "sameauthor"].includes(p.mode) && !(cur && cur.id) };
}

const bool = (key, label, def) => ({ key, kind: "bool", label, default: def });
const FAMILY = [
  {
    type: "querylist", label: "Liste dynamique", group: "site", icon: "list", version: 1, style: "text", template: "querylist",
    keywords: "liste dynamique articles recents populaires lus commentes lies auteur categorie archive pages auteurs categories etiquettes nuage formations requete boucle",
    schema: [
      { key: "title", kind: "text", label: "Titre de la liste (facultatif)", max: 80, default: "" },
      { key: "source", kind: "select", label: "Contenu", options: SOURCES, default: "posts" },
      { key: "mode", kind: "select", label: "Sélection (articles) / tri (autres contenus)", options: MODES, default: "recent" },
      { key: "count", kind: "number", label: "Nombre d'éléments", min: 1, max: 24, integer: true, default: 5 },
      { key: "layout", kind: "select", label: "Présentation", options: [["list", "Liste"], ["cards", "Cartes"], ["compact", "Compacte (titres)"], ["inline", "Étiquettes en ligne"], ["slider", "Carrousel (défilement horizontal)"]], default: "list" },
      bool("showImage", "Afficher l'image", true), bool("showExcerpt", "Afficher le résumé", false), bool("showDate", "Afficher la date", true), bool("showMeta", "Afficher l'auteur et la catégorie", false),
      bool("showCount", "Afficher le nombre d'articles (catégories, étiquettes, auteurs)", true),
      { key: "category", kind: "text", label: "Catégorie (facultative, nom exact)", max: 80, default: "" },
      { key: "tags", kind: "text", label: "Étiquettes (séparées par des virgules, facultatif)", max: 200, default: "" },
      bool("excludeCurrent", "Exclure l'élément affiché (formations, pages)", false),
      { key: "empty", kind: "text", label: "Message s'il n'y a rien à afficher", max: 160, default: "Rien à afficher pour le moment." },
    ],
    data(ctx, p, env) {
      const { q, needsPost } = listQuery(p, env.scope);
      if (needsPost) return { items: [], reason: "post" };
      const r = query.runQuery(p.source === "courses" ? ctx : { ...ctx, baseUrl: "" }, q, { scope: env.scope });
      return { items: r.items, reason: r.items.length ? "" : "empty" };
    },
  },
  {
    type: "postmeta", label: "Informations de l'article", group: "site", icon: "info", version: 1, style: "text",
    keywords: "meta article date auteur categorie commentaires lecture vues publie le informations",
    schema: [
      bool("showAuthor", "Auteur", true), bool("showDate", "Date de publication", true), bool("showUpdated", "Date de mise à jour", false), bool("showCategory", "Catégorie", true),
      bool("showReading", "Temps de lecture", true), bool("showComments", "Nombre de commentaires", false), bool("showViews", "Nombre de lectures", false),
      { key: "separator", kind: "select", label: "Séparateur", options: [["dot", "Point ·"], ["bar", "Barre |"], ["none", "Aucun"]], default: "dot" },
      { key: "align", kind: "select", label: "Alignement", options: [["left", "À gauche"], ["center", "Centré"]], default: "left" },
    ],
    data(ctx, p, env) { return { post: env.scope && env.scope.post && env.scope.post.title ? env.scope.post : null }; },
  },
  {
    type: "postterms", label: "Catégorie et étiquettes", group: "site", icon: "tag", version: 1, style: "text",
    keywords: "categorie etiquettes tags termes article taxonomie liens",
    schema: [
      { key: "show", kind: "select", label: "Afficher", options: [["both", "Catégorie et étiquettes"], ["category", "Catégorie"], ["tags", "Étiquettes"]], default: "both" },
      { key: "label", kind: "text", label: "Libellé avant les termes (facultatif)", max: 40, default: "" },
      { key: "look", kind: "select", label: "Style", options: [["pills", "Pastilles"], ["text", "Texte simple"]], default: "pills" },
    ],
    data(ctx, p, env) {
      const post = env.scope && env.scope.post;
      if (!post || !post.title) return { terms: [] };
      const terms = [];
      if (p.show !== "tags" && post.category) terms.push({ name: post.category, url: post.categoryUrl || query.termUrl("category", post.category), kind: "category" });
      if (p.show !== "category") for (const t of (post.tags || []).slice(0, 20)) terms.push({ name: t, url: query.termUrl("tag", t), kind: "tag" });
      return { terms };
    },
  },
  {
    type: "postnav", label: "Article précédent / suivant", group: "site", icon: "arrowRight", version: 1, style: "text",
    keywords: "article precedent suivant navigation entre articles pagination billet",
    schema: [
      { key: "prevLabel", kind: "text", label: "Texte « précédent »", max: 40, default: "Article précédent" },
      { key: "nextLabel", kind: "text", label: "Texte « suivant »", max: 40, default: "Article suivant" },
      bool("sameCategory", "Rester dans la même catégorie", false), bool("showImage", "Afficher l'image", false),
    ],
    data(ctx, p, env) { return query.neighbours(ctx, env.scope && env.scope.post, { sameCategory: p.sameCategory }); },
  },
  {
    type: "authorbox", label: "Boîte auteur", group: "site", icon: "user", version: 1, style: "box",
    keywords: "auteur biographie bio profil redacteur ecrit par avatar photo boite",
    schema: [
      bool("showAvatar", "Photo", true), bool("showBio", "Présentation", true), bool("showLink", "Lien vers les articles de l'auteur", true),
      { key: "linkLabel", kind: "text", label: "Texte du lien", max: 40, default: "Tous ses articles" },
      { key: "heading", kind: "text", label: "Titre au-dessus (facultatif)", max: 60, default: "À propos de l'auteur" },
    ],
    data(ctx, p, env) {
      const sc = env.scope || {};
      const id = (sc.author && sc.author.id) || (sc.archive && sc.archive.type === "author" && sc.archive.id) || (sc.post && sc.post.authorId);
      if (!Number.isInteger(id)) return { author: null };
      const r = query.runQuery({ ...ctx, baseUrl: "" }, { source: "authors", include: [id], count: 1 }, {});
      return { author: r.items[0] || null };
    },
  },
  {
    type: "archiveinfo", label: "En-tête d'archive", group: "site", icon: "type", version: 1, style: "text",
    keywords: "archive titre categorie etiquette auteur recherche resultats description nombre en-tete page liste",
    schema: [
      { key: "tag", kind: "select", label: "Niveau du titre", options: [["h1", "Titre 1"], ["h2", "Titre 2"]], default: "h1" },
      bool("showDescription", "Description", true), bool("showCount", "Nombre de résultats", true),
      { key: "fallback", kind: "text", label: "Titre hors archive (facultatif)", max: 80, default: "Blog" },
    ],
    data(ctx, p, env) { return { archive: (env.scope && env.scope.archive) || null }; },
  },
  {
    type: "postcomments", label: "Commentaires de l'article", group: "site", icon: "quote", version: 1, style: "box",
    keywords: "commentaires article avis discussion repondre formulaire reactions blog",
    schema: [
      { key: "heading", kind: "text", label: "Titre", max: 60, default: "Commentaires" },
    ],
    // Liste lue dans le moteur de commentaires du CMS (approuvés seulement, réponses comprises) ; le formulaire reste celui du blog
    data(ctx, p, env) {
      const post = env.scope && env.scope.post;
      if (!post || !Number.isInteger(post.id) || !post.slug) return { post: null };
      const row = ctx.db.prepare("SELECT comments_enabled, published FROM posts WHERE id = ?").get(post.id);
      if (!row || !row.comments_enabled || !row.published) return { post: null };
      const page = Math.max(1, parseInt(env.visitor && env.visitor.query && env.visitor.query.cpage, 10) || 1);
      const t = require("../../../services/blog").listComments(post.id, { page });
      const clean = (c) => ({ id: c.id, name: c.name, body: String(c.body || "").slice(0, 3000), at: c.created_at, avatar: query.safeImage(c.avatar_path), author: c.role === "formateur", children: (c.children || []).map(clean) });
      return { post, roots: t.roots.map(clean), total: t.total, page: t.page, pages: t.pages, replies: Boolean(t.repliesAllowed), maxDepth: t.maxDepth, open: Boolean(post.commentsOpen) };
    },
  },
  {
    type: "cmsmenu", label: "Menu du CMS", group: "site", icon: "list", version: 1, style: "text",
    keywords: "menu cms navigation en-tete pied de page mobile liens gestion menus emplacement",
    schema: [
      { key: "location", kind: "select", label: "Emplacement du CMS", options: [["header", "Menu de l'en-tête"], ["footer", "Menu du pied de page"], ["mobile", "Menu mobile"], ["name", "Un menu précis (nom ci-dessous)"]], default: "header" },
      { key: "menuName", kind: "text", label: "Nom du menu (si « Un menu précis »)", max: 80, default: "" },
      { key: "label", kind: "text", label: "Nom accessible du menu", max: 60, default: "Menu" },
      bool("vertical", "Disposition verticale", false),
    ],
    // Menus gérés dans le CMS (Navigation) : liens, hiérarchie, visibilité membres / visiteurs et adresses vérifiées par le moteur
    data(ctx, p, env) {
      const nav = require("../../../services/navigation");
      const user = env.visitor && env.visitor.loggedIn ? {} : null;
      let found = null;
      if (p.location === "name") {
        const wanted = String(p.menuName || "").trim().toLowerCase();
        const menu = wanted ? nav.listMenus().find((m) => String(m.name).toLowerCase() === wanted) : null;
        found = menu ? nav.forMenu(menu.id, { user }) : null;
      } else found = nav.forLocation(p.location, { user });
      return { menu: found };
    },
  },
  {
    type: "minicart", label: "Mini-panier", group: "site", icon: "cart", version: 1, style: "text",
    keywords: "panier mini cart achats commandes articles icone compteur boutique",
    schema: [
      { key: "label", kind: "text", label: "Texte (facultatif)", max: 30, default: "Panier" },
      bool("showCount", "Afficher le nombre d'articles", true), bool("hideEmpty", "Masquer quand le panier est vide", false),
    ],
    data(ctx, p, env) { return { count: (env.visitor && env.visitor.cartCount) || 0 }; },
  },
];
module.exports = FAMILY;
