// Contrôles de cohérence technique d'UNE page, pour la qualité éditoriale : indexabilité contradictoire, données structurées qui ne correspondent pas au contenu présent.
// Le calcul du <head>, du sitemap, de robots.txt et des JSON-LD reste celui de src/seo (non dupliqué) ; ici on CONTRÔLE la cohérence, on n'émet aucune balise.
const bad = (sev, code, message) => ({ severity: sev, code, message });
function check(doc, { page = {}, siteNoindex = false } = {}) {
  const out = [], seo = doc.seo || {};
  const noindex = Boolean(seo.noindex) || page.indexable === 0 || page.indexable === false || siteNoindex;
  if (noindex && seo.canonical) out.push(bad("warning", "noindex_with_canonical", "Page en noindex avec une canonical : les deux consignes se contredisent."));
  if (noindex && page.status === "published") out.push(bad("info", "published_not_indexable", "Page publiée mais non indexable (noindex ou indexation désactivée) : elle ne sera pas proposée dans les résultats ni le plan du site."));
  if (seo.canonical && !/^(\/|https:\/\/)/.test(String(seo.canonical))) out.push(bad("error", "canonical_invalid", "Canonical ni chemin du site ni adresse https."));
  const t = seo.schemaType;
  if (t === "FAQPage" && !doc.faq.length) out.push(bad("error", "schema_faq_without_faq", "Données structurées FAQPage sans question/réponse visible sur la page : balisage non conforme au contenu."));
  if (t === "FAQPage" && doc.faq.length) out.push(bad("info", "schema_faq_eligibility", "FAQPage : balisage valide si les questions sont visibles sur la page ; l'affichage enrichi dans Google est limité à certains types de sites (règles de Google susceptibles d'évoluer)."));
  if (t === "Product" && !doc.sections.some((s) => s.type === "product" || s.type === "pricing")) out.push(bad("warning", "schema_product_without_product", "Données structurées Product sans bloc produit ni prix visible : vérifier que le contenu présente réellement un produit."));
  if (t === "Article" && doc.words.length < 150) out.push(bad("warning", "schema_article_short", "Données structurées Article sur un texte très court."));
  if (/^.{0,2}$/.test(String(page.slug || "x"))) out.push(bad("info", "slug_short", "Adresse très courte."));
  return { indexable: !noindex, issues: out };
}
module.exports = { check };
