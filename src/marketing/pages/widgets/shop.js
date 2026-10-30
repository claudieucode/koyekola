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
      { key: "empty", kind: "text", label: "Message s'il n'y a aucun produit", max: 160, default: "Aucun produit pour le moment." },
    ],
    data(ctx, p, env) {
      const sh = shopOf(ctx, env);
      if (sh.closed) return { closed: sh.closed, items: [] };
      const query = (env.visitor && env.visitor.query) || {};
      const q = { perPage: p.count, sort: p.orderby, inStock: p.inStockOnly, page: 1 };
      if (p.source === "featured") q.featured = true;
      else if (p.source === "sale") q.onSale = true;
      else if (p.source === "category") q.category = p.category;
      else if (p.source === "archive") { q.category = typeof query.categorie === "string" ? query.categorie : ""; q.q = typeof query.q === "string" ? query.q.slice(0, 80) : ""; }
      const r = catalog.catalogQuery(sh.s, q);
      return { items: r.items.map((x) => ({ ...x, priceLabel: view.money(x.priceFromCents, sh.settings.currency), regularLabel: view.money(x.regularFromCents, sh.settings.currency) })), total: r.total, base: "/boutique" };
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
    data(ctx, p, env) { const sh = shopOf(ctx, env); return sh.closed ? { closed: sh.closed } : { open: true }; },
  },
  {
    type: "shopsearch", label: "Recherche de produits", group: "commerce", icon: "search", version: 1, style: "box", status: "operational", dependencies: DEP,
    description: "Champ de recherche qui interroge le catalogue de la boutique",
    keywords: "recherche produits boutique catalogue champ search shop",
    schema: [
      { key: "placeholder", kind: "text", label: "Texte d'aide du champ", max: 80, default: "Rechercher un produit…" },
      { key: "button", kind: "text", label: "Texte du bouton", max: 30, required: true, default: "Rechercher" },
    ],
    data(ctx, p, env) { const sh = shopOf(ctx, env); return sh.closed ? { closed: sh.closed } : { open: true }; },
  },
  {
    type: "shopfilters", label: "Filtres de produits", group: "commerce", icon: "filter", version: 1, style: "box", status: "operational", dependencies: DEP,
    description: "Catégorie, prix, stock, promotion et tri : les filtres sont appliqués par le serveur",
    keywords: "filtres produits categorie prix stock promotion tri boutique facettes filters shop",
    schema: [
      bool("showCategory", "Catégorie", true), bool("showPrice", "Prix minimum et maximum", true), bool("showStock", "En stock seulement", true), bool("showSale", "En promotion", true), bool("showSort", "Tri", true),
      { key: "button", kind: "text", label: "Texte du bouton", max: 30, required: true, default: "Filtrer" },
    ],
    data(ctx, p, env) {
      const sh = shopOf(ctx, env);
      if (sh.closed) return { closed: sh.closed };
      return { categories: catalog.listCategories(sh.s).map((c) => ({ slug: c.slug, name: c.name })), query: (env.visitor && env.visitor.query) || {} };
    },
  },
];
