// Famille « Boutique » (Programme 20.5) : éléments du Page Builder branchés sur le VRAI moteur de boutique (src/marketing/shop). Aucun second éditeur ni rendu :
// ce sont des widgets déclaratifs comme les autres. Les données viennent de la boutique du SITE DE LA PAGE (page.site_id, NULL = site principal) et de lui seul.
// Les éléments transactionnels (ajout au panier, panier, recherche, filtres) envoient vers les routes /boutique/… qui recalculent tout côté serveur.
// Si le module « Commerce » n'est pas activé pour le site ou si la boutique est fermée, les éléments n'affichent rien au public (un indice est montré dans l'éditeur).
const catalog = require("../../shop/catalog");
const store = require("../../shop/store");
const siteModules = require("../../siteModules");
const view = require("../../shop/view");

function shopOf(ctx, env) {
  const siteId = env && env.page && Number.isInteger(env.page.site_id) ? env.page.site_id : null;
  const s = { db: ctx.db, organizationId: ctx.organizationId, siteId };
  if (!siteModules.isEnabled(ctx.db, ctx.organizationId, siteId, "commerce")) return { closed: "module" };
  const settings = store.getSettings(s);
  if (!settings.enabled) return { closed: "shop" };
  return { s, settings };
}
const bool = (key, label, def) => ({ key, kind: "bool", label, default: def });
const DEP = ["Module « Commerce » activé pour le site et boutique ouverte (Boutique → Réglages)"];

const SORT_KEYS = ["newest", "featured", "price_asc", "price_desc", "name"];
// Catalogue d'EXEMPLE (aperçu de la bibliothèque du Theme Builder) : 36 produits fictifs, aucun n'existe dans une boutique. Mêmes filtres que le vrai moteur (stock, promotion, tri, page).
const DEMO_CATS = ["Catégorie A", "Catégorie B", "Catégorie C"];
const DEMO = Array.from({ length: 36 }, (_, i) => {
  const n = i + 1, cents = 1900 + n * 410, sale = n % 4 === 0;
  return { id: -n, slug: `exemple-${n}`, name: `Produit exemple ${String(n).padStart(2, "0")}`, short_description: "Description courte du produit d'exemple.", image_url: "", onSale: sale, isVariable: n % 5 === 0, inStock: n % 7 !== 0, featured: n % 3 === 1,
    categories: [{ name: DEMO_CATS[n % 3], slug: `categorie-${["a", "b", "c"][n % 3]}` }], priceFromCents: cents, regularFromCents: sale ? cents + 900 : cents, priceLabel: view.money(cents, "eur"), regularLabel: view.money(sale ? cents + 900 : cents, "eur"), demo: true };
});
function demoCatalog(q) {
  let rows = DEMO.filter((x) => (!q.inStock || x.inStock) && (!q.onSale || x.onSale) && (!q.featured || x.featured) && (!q.category || x.categories.some((c) => c.slug === q.category)) && (!q.q || x.name.toLowerCase().includes(String(q.q).toLowerCase())) && (q.minPrice == null || x.priceFromCents >= q.minPrice) && (q.maxPrice == null || x.priceFromCents <= q.maxPrice));
  if (q.sort === "price_asc") rows = [...rows].sort((a, b) => a.priceFromCents - b.priceFromCents);
  else if (q.sort === "price_desc") rows = [...rows].sort((a, b) => b.priceFromCents - a.priceFromCents);
  else if (q.sort === "name") rows = [...rows].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const per = Math.max(1, q.perPage || 6), pages = Math.ceil(rows.length / per), page = Math.min(Math.max(1, q.page || 1), Math.max(1, pages));
  return { items: rows.slice((page - 1) * per, page * per), total: rows.length, page, pages };
}
const DEMO_CATEGORIES = DEMO_CATS.map((name, i) => ({ slug: `categorie-${["a", "b", "c"][i]}`, name }));

module.exports = [
  {
    type: "shopgrid", label: "Grille de produits", group: "commerce", icon: "grid", version: 1, style: "box", status: "operational", dependencies: DEP,
    description: "Les produits de la boutique de ce site (catalogue, catégorie, promotions, mis en avant)",
    keywords: "produits grille catalogue boutique archive categorie promotions vedette shop product grid archive",
    schema: [
      { key: "title", kind: "text", label: "Titre (facultatif)", max: 80, default: "" },
      { key: "source", kind: "select", label: "Produits à afficher", options: [["all", "Tous les produits"], ["featured", "Produits mis en avant"], ["sale", "Produits en promotion"], ["category", "Une catégorie (adresse ci-dessous)"], ["archive", "Suit la page (catégorie ?categorie= et recherche ?q=)"]], default: "all" },
      { key: "category", kind: "text", label: "Adresse de la catégorie (source « Une catégorie »)", max: 80, default: "" },
      { key: "count", kind: "number", label: "Nombre de produits", min: 1, max: 24, integer: true, default: 6 },
      { key: "columns", kind: "select", label: "Colonnes (ordinateur)", options: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"]], default: "3" },
      { key: "orderby", kind: "select", label: "Tri", options: [["newest", "Nouveautés"], ["featured", "Mis en avant"], ["price_asc", "Prix croissant"], ["price_desc", "Prix décroissant"], ["name", "Nom"]], default: "newest" },
      bool("inStockOnly", "Seulement les produits en stock", false), bool("showPrice", "Afficher le prix", true), bool("showImage", "Afficher l'image", true),
      { key: "layout", kind: "select", label: "Présentation", options: [["grid", "Grille"], ["list", "Liste (image à gauche)"]], default: "grid" },
      { key: "ratio", kind: "select", label: "Format de l'image", options: [["1/1", "Carré"], ["4/5", "Portrait 4:5"], ["3/4", "Portrait 3:4"], ["2/3", "Portrait 2:3"], ["4/3", "Paysage 4:3"], ["16/9", "Large 16:9"]], default: "1/1" },
      { key: "cardStyle", kind: "select", label: "Carte", options: [["boxed", "Encadrée"], ["plain", "Sans cadre"], ["soft", "Fond doux"]], default: "boxed" },
      bool("showBadge", "Pastilles « Promo » et « Rupture de stock »", false), bool("showCategory", "Afficher la catégorie", false), bool("showDescription", "Afficher la description courte", false),
      bool("showCart", "Bouton d'ajout au panier (produits simples) ou « Choisir les options » (produits à variantes)", false),
      { key: "cartLabel", kind: "text", label: "Texte du bouton d'ajout", max: 40, default: "Ajouter au panier" },
      { key: "optionsLabel", kind: "text", label: "Texte du lien des produits à variantes", max: 40, default: "Choisir les options" },
      { key: "badgeLabel", kind: "text", label: "Texte de la pastille de promotion", max: 20, default: "Promo" },
      bool("onlySale", "Seulement les promotions (source « Suit la page »)", false), bool("onlyFeatured", "Seulement les produits mis en avant (source « Suit la page »)", false),
      bool("ignoreFilters", "Ignorer les filtres, le tri et la page du visiteur (garde la catégorie, l'étiquette et la recherche)", false),
      bool("paginate", "Pagination (source « Suit la page » seulement)", false),
      { key: "empty", kind: "text", label: "Message s'il n'y a aucun produit", max: 160, default: "Aucun produit pour le moment." },
    ],
    data(ctx, p, env) {
      const query = (env.visitor && env.visitor.query) || {};
      const str = (v, n = 80) => (typeof v === "string" ? v.slice(0, n) : "");
      const archive = p.source === "archive";
      // Filtres de l'adresse (catégorie, recherche, étiquette, prix, stock, promotion, tri, page) : lus seulement pour la source « Suit la page ». Le serveur les revalide (catalogQuery).
      const euros = (v) => { const n = Number(str(v, 12).replace(",", ".")); return str(v, 12) !== "" && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : undefined; };
      const q = { perPage: p.count, sort: p.orderby, inStock: p.inStockOnly, page: 1 };
      if (p.source === "featured") q.featured = true;
      else if (p.source === "sale") q.onSale = true;
      else if (p.source === "category") q.category = p.category;
      else if (archive) {
        q.category = str(query.categorie); q.q = str(query.q); q.tag = str(query.etiquette, 40);
        if (!p.ignoreFilters) {
          q.minPrice = euros(query.min); q.maxPrice = euros(query.max);
          if (query.stock === "1") q.inStock = true;
          if (query.promo === "1") q.onSale = true;
          if (query.vedette === "1") q.featured = true;
          if (typeof query.tri === "string" && SORT_KEYS.includes(query.tri)) q.sort = query.tri;
          if (p.paginate) q.page = Math.min(500, Math.max(1, Math.floor(Number(query.page)) || 1));
        }
        if (p.onlySale) q.onSale = true;
        if (p.onlyFeatured) q.featured = true;
      }
      const pager = (r) => {
        const keep = new URLSearchParams();
        for (const k of ["categorie", "q", "etiquette", "min", "max", "stock", "promo", "vedette", "tri"]) if (typeof query[k] === "string" && query[k] !== "") keep.set(k, query[k].slice(0, 80));
        return archive && p.paginate && !p.ignoreFilters && r.pages > 1 ? { page: r.page, pages: r.pages, base: keep.toString() } : null;
      };
      // Aperçu de la BIBLIOTHÈQUE uniquement (page.demoShop posé par themeRender.previewDoc) : produits d'exemple annoncés comme tels. Jamais sur un site publié.
      if (env.page && env.page.demoShop === true) { const r = demoCatalog(q); return { items: r.items, total: r.total, base: "/boutique", demo: true, pager: pager(r) }; }
      const sh = shopOf(ctx, env);
      if (sh.closed) return { closed: sh.closed, items: [] };
      const r = catalog.catalogQuery(sh.s, q);
      return { items: r.items.map((x) => ({ ...x, priceLabel: view.money(x.priceFromCents, sh.settings.currency), regularLabel: view.money(x.regularFromCents, sh.settings.currency) })), total: r.total, base: "/boutique", pager: pager(r) };
    },
  },
  {
    type: "shopbuy", label: "Ajouter au panier", group: "commerce", icon: "cart", version: 1, style: "box", status: "operational", dependencies: DEP,
    description: "Variante, quantité et bouton d'achat d'un produit de la boutique : modifie le vrai panier",
    keywords: "ajouter panier acheter bouton produit variante quantite stock boutique add to cart shop",
    schema: [
      { key: "product", kind: "text", label: "Produit (adresse du produit ; vide = le produit de la page)", max: 120, default: "" },
      { key: "label", kind: "text", label: "Texte du bouton", max: 40, required: true, default: "Ajouter au panier" },
      bool("showQuantity", "Afficher la quantité", true), bool("showPrice", "Afficher le prix", true), bool("showStock", "Afficher la disponibilité", true),
      { key: "outLabel", kind: "text", label: "Message en rupture de stock", max: 80, default: "Rupture de stock" },
    ],
    data(ctx, p, env) {
      const sh = shopOf(ctx, env);
      if (sh.closed) return { closed: sh.closed };
      const cur = env.scope && env.scope.product;
      const product = p.product ? catalog.publicProduct(sh.s, p.product) : cur && cur.id ? catalog.productById(sh.s, cur.id) : null;
      if (!product || product.status !== "published") return { product: null };
      return { product: { ...product, priceLabel: view.money(product.priceFromCents, sh.settings.currency), regularLabel: view.money(product.regularFromCents, sh.settings.currency) }, back: `/boutique/produit/${product.slug}` };
    },
  },
  {
    type: "shopcart", label: "Panier, commande et compte", group: "commerce", icon: "cart", version: 1, style: "box", status: "operational", dependencies: DEP,
    description: "Liens vers le panier (avec le nombre d'articles réel), la commande et le compte client de la boutique",
    keywords: "panier commande checkout compte client connexion boutique mini panier cart account",
    schema: [
      { key: "cartLabel", kind: "text", label: "Texte du lien panier", max: 40, required: true, default: "Panier" },
      bool("showCount", "Afficher le nombre d'articles", true),
      { key: "checkoutLabel", kind: "text", label: "Texte du bouton « commander » (vide = aucun)", max: 40, default: "" },
      { key: "accountLabel", kind: "text", label: "Texte du lien compte client (vide = aucun)", max: 40, default: "Mon compte" },
    ],
    data(ctx, p, env) { if (env.page && env.page.demoShop === true) return { open: true, demo: true }; const sh = shopOf(ctx, env); return sh.closed ? { closed: sh.closed } : { open: true }; },
  },
  {
    type: "shopsearch", label: "Recherche de produits", group: "commerce", icon: "search", version: 1, style: "box", status: "operational", dependencies: DEP,
    description: "Champ de recherche qui interroge le catalogue de la boutique",
    keywords: "recherche produits boutique catalogue champ search shop",
    schema: [
      { key: "placeholder", kind: "text", label: "Texte d'aide du champ", max: 80, default: "Rechercher un produit…" },
      { key: "button", kind: "text", label: "Texte du bouton", max: 30, required: true, default: "Rechercher" },
    ],
    data(ctx, p, env) { if (env.page && env.page.demoShop === true) return { open: true, demo: true }; const sh = shopOf(ctx, env); return sh.closed ? { closed: sh.closed } : { open: true }; },
  },
  {
    type: "shopfilters", label: "Filtres de produits", group: "commerce", icon: "filter", version: 1, style: "box", status: "operational", dependencies: DEP,
    description: "Catégorie, prix, stock, promotion et tri : les filtres sont appliqués par le serveur",
    keywords: "filtres produits categorie prix stock promotion tri boutique facettes filters shop",
    schema: [
      bool("showCategory", "Catégorie", true), bool("showPrice", "Prix minimum et maximum", true), bool("showStock", "En stock seulement", true), bool("showSale", "En promotion", true), bool("showSort", "Tri", true),
      { key: "direction", kind: "select", label: "Disposition des champs", options: [["row", "En ligne"], ["column", "En colonne (barre latérale)"]], default: "row" },
      bool("showReset", "Lien « Effacer les filtres »", false),
      { key: "resetLabel", kind: "text", label: "Texte du lien d'effacement", max: 40, default: "Effacer les filtres" },
      { key: "button", kind: "text", label: "Texte du bouton", max: 30, required: true, default: "Filtrer" },
    ],
    data(ctx, p, env) {
      const query = (env.visitor && env.visitor.query) || {};
      if (env.page && env.page.demoShop === true) return { categories: DEMO_CATEGORIES, query, demo: true };
      const sh = shopOf(ctx, env);
      if (sh.closed) return { closed: sh.closed };
      return { categories: catalog.listCategories(sh.s).map((c) => ({ slug: c.slug, name: c.name })), query };
    },
  },
];
