// Outils de référencement : adresses absolues, texte brut pour les descriptions, données structurées (JSON-LD), XML.

// Adresse publique du site : SITE_URL si elle est définie (indispensable en ligne, derrière un proxy),
// sinon celle de la requête en cours (pratique en local).
function siteBase(req) {
  // Adresse propre à un site du CMS (réglages SEO du site), posée sur la requête par le moteur SEO ; sinon SITE_URL
  const configured = String((req && req.seoBase) || process.env.SITE_URL || "").trim().replace(/\/+$/, "");
  return configured || `${req.protocol}://${req.get("host")}`;
}

function absoluteUrl(req, urlPath) {
  const base = siteBase(req);
  if (!urlPath || urlPath === "/") return `${base}/`;
  return /^https?:\/\//i.test(urlPath) ? urlPath : `${base}${urlPath.startsWith("/") ? "" : "/"}${urlPath}`;
}

// Retire la mise en forme Markdown et les retours à la ligne, puis coupe proprement (sur un mot) à `max` caractères.
function plainText(source, max = 160) {
  const text = String(source || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, "")
    .replace(/[*_#>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, "")}…`;
}

// Bloc <script type="application/ld+json"> sûr : « < » est écrit \u003c pour qu'un titre contenant
// « </script> » ne puisse jamais fermer la balise.
function jsonLdTags(objects) {
  return (objects || [])
    .filter(Boolean)
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026")}</script>`)
    .join("\n  ");
}

// items : [{ name, url }] (url absolue) → BreadcrumbList
function breadcrumbLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, item: item.url })),
  };
}

// Liste de questions/réponses -> FAQPage (les réponses sont converties en texte brut)
function faqLd(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: plainText(f.answer, 1000) } })),
  };
}

function escapeXml(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

// "2026-09-19 14:03:11" (UTC, SQLite) → "2026-09-19"
function isoDate(sqliteDate) {
  return String(sqliteDate || "").slice(0, 10);
}

// "2026-09-19 14:03:11" (UTC, SQLite) → "2026-09-19T14:03:11Z"
function isoDateTime(sqliteDate) {
  return String(sqliteDate || "").replace(" ", "T").replace(/Z?$/, "Z");
}

module.exports = { isoDateTime, siteBase, absoluteUrl, plainText, jsonLdTags, breadcrumbLd, faqLd, escapeXml, isoDate };
