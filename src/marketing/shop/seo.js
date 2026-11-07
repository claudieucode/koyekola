// Données structurées schema.org (JSON-LD) d'une fiche produit : Product + Offer, BreadcrumbList, et AggregateRating/Review UNIQUEMENT si des avis vérifiés publiés existent.
// Rien n'est inventé : sans avis, aucune note n'est émise ; prix et disponibilité viennent du catalogue.
const abs = (origin, u) => (!u ? undefined : /^https?:\/\//i.test(u) ? u : `${origin}${u.startsWith("/") ? "" : "/"}${u}`);
const plain = (h) => String(h || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

function productLd(product, { origin, base = "/boutique", currency = "eur", reviews = null, shopName = "" } = {}) {
  const url = abs(origin, `${base}/produit/${encodeURIComponent(product.slug)}`);
  const images = [product.image_url, ...(product.gallery || [])].filter(Boolean).map((u) => abs(origin, u));
  const cur = String(currency).toUpperCase();
  const availability = `https://schema.org/${product.inStock ? "InStock" : "OutOfStock"}`;
  const priced = (cents) => (cents / 100).toFixed(2);
  let offers;
  if (product.isVariable && product.variants.length > 1) {
    const prices = product.variants.map((v) => {
      const p = v.price_cents != null ? v.price_cents : product.price_cents;
      return p;
    });
    offers = { "@type": "AggregateOffer", priceCurrency: cur, lowPrice: priced(product.priceFromCents), highPrice: priced(Math.max(product.priceFromCents, ...prices)), offerCount: product.variants.length, availability, url };
  } else {
    offers = { "@type": "Offer", priceCurrency: cur, price: priced(product.priceFromCents), availability, url, itemCondition: "https://schema.org/NewCondition" };
  }
  const ld = { "@context": "https://schema.org", "@type": "Product", name: product.name, url, description: plain(product.short_description || product.description).slice(0, 500) || undefined, sku: product.sku || undefined, image: images.length ? images : undefined, offers };
  if (shopName) ld.brand = { "@type": "Brand", name: shopName };
  if (reviews && reviews.count > 0) {
    ld.aggregateRating = { "@type": "AggregateRating", ratingValue: reviews.average, reviewCount: reviews.count, bestRating: 5, worstRating: 1 };
    ld.review = reviews.items.slice(0, 10).map((r) => ({ "@type": "Review", author: { "@type": "Person", name: r.author_name }, datePublished: String(r.created_at).slice(0, 10), name: r.title || undefined, reviewBody: r.body || undefined, reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 } }));
  }
  return ld;
}
function breadcrumbLd(items, origin) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(origin, it.url) })) };
}
function productBreadcrumb(product, { origin, base = "/boutique", shopName = "Boutique" } = {}) {
  const items = [{ name: shopName, url: base }];
  if (product.categories[0]) items.push({ name: product.categories[0].name, url: `${base}/categorie/${encodeURIComponent(product.categories[0].slug)}` });
  items.push({ name: product.name, url: `${base}/produit/${encodeURIComponent(product.slug)}` });
  return { items, ld: breadcrumbLd(items, origin) };
}
// JSON sûr à placer dans <script type="application/ld+json"> (jamais de "</script>" ni de saut de ligne spécial)
const safeJson = (o) => JSON.stringify(o).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

module.exports = { productLd, breadcrumbLd, productBreadcrumb, safeJson };
