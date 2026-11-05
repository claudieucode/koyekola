// Outils communs des thèmes de BOUTIQUE (familles « Luxe » et « Boutiques en ligne »).
// Règle d'or : un thème ne réimplémente jamais le commerce. Il CONSOMME le moteur (src/marketing/shop) : les grilles de produits sont le vrai widget « shopgrid »
// (données réelles : prix, promotions, stock), le panier / la commande / le compte sont les pages réelles /boutique/*. Aucun compteur de stock, d'affluence ou de temps n'est écrit ici.
// `seed` crée un catalogue de DÉMONSTRATION dans une boutique (script scripts/boutique-demo.js, tests) — jamais appelé automatiquement sur la boutique d'un client.
const catalog = require("../../shop/catalog");

/* Widget réel : grille de produits. source : featured | sale | newest | archive | category (voir patterns.js) */
const shopgrid = (props = {}) => ({ type: "shopgrid", props: { source: "featured", count: 8, columns: "4", orderby: "featured", showPrice: true, showImage: true, ...props } });
const wrap = (...children) => ({ type: "layout", children });

/* demo = { categories: ["Nom", ...], products: [[nom, indexCategorie, prixEuros, promoEuros|0, attributs|null, mode, étiquettes, descriptionCourte], ...] }
   attributs = { Taille: ["S","M"], Couleur: ["Noir","Ivoire"] } ; mode = "ok" | "rupture" | "partiel" (une combinaison épuisée) | "libre" (stock non géré) */
function seed(s, demo, { userId = null } = {}) {
  const cats = demo.categories.map((name) => catalog.saveCategory(s, { name }));
  const catId = (i) => (typeof cats[i] === "object" && cats[i] ? cats[i].id : cats[i]);
  const out = [];
  demo.products.forEach(([name, ci, price, sale, attrs, mode, tags, short], n) => {
    const base = { name, status: "published", price_cents: Math.round(price * 100), short_description: short || "", description: `<p>${short || name}</p>`, tags: tags || [], is_featured: n % 3 === 0 ? 1 : 0, position: n, manage_stock: mode === "libre" ? 0 : 1, stock_qty: mode === "rupture" ? 0 : 12 };
    if (sale) base.sale_price_cents = Math.round(sale * 100);
    if (attrs) { base.type = "variable"; base.attributes = Object.entries(attrs).map(([k, v]) => ({ name: k, values: v })); }
    const created = catalog.createProduct(s, base, userId);
    const id = typeof created === "object" ? created.id : created;
    if (attrs) {
      const names = Object.keys(attrs);
      let combos = [{}];
      for (const k of names) combos = combos.flatMap((c) => attrs[k].map((v) => ({ ...c, [k]: v })));
      combos.forEach((options, i) => catalog.saveVariant(s, id, { options, manage_stock: mode === "libre" ? 0 : 1, stock_qty: mode === "rupture" || (mode === "partiel" && i % 3 === 1) ? 0 : 8 }));
    }
    catalog.setProductCategories(s, id, [catId(ci)]);
    out.push(id);
  });
  return out;
}
module.exports = { shopgrid, wrap, seed };
