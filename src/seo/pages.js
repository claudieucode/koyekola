// Métadonnées de chaque type de page publique : valeurs automatiques (modèles des Réglages SEO, données réelles du contenu)
// + réglages propres au contenu (surcharges) + graphe de données structurées. Les routes appellent ces fonctions au lieu
// d'écrire leurs balises elles-mêmes : un seul endroit à faire évoluer et à tester.
const settings = require("./settings");
const { apply } = require("./resolver");
const schema = require("./schema");
const images = require("./images");
const { render } = require("./templates");
const { absoluteUrl, plainText } = require("../utils/seo");
const { slugify } = require("../utils/format");

const vars = (extra = {}) => ({ site_name: settings.get("site_name"), ...extra });
const tpl = (key, extra) => render(settings.get(key), vars(extra));
const LOCALES = { fr: "fr_FR", en: "en_US", es: "es_ES", pt: "pt_PT", de: "de_DE", it: "it_IT", ln: "ln_CD" };
const LANGS = { fr: "fr-FR", en: "en", es: "es", pt: "pt", de: "de", it: "it", ln: "ln" };

function home(req) {
  const s = apply("page", "home", { rawTitle: tpl("home_title"), description: tpl("home_description") });
  // Titre de l'accueil personnalisé : complet, sans le modèle des pages
  if (!s.rawTitle && s.title) { s.rawTitle = s.title; delete s.title; }
  s.graph = { page: { type: "WebPage", url: absoluteUrl(req, "/") } };
  return s;
}

function catalogue(req) {
  const s = apply("page", "catalogue", { title: tpl("catalogue_title"), description: tpl("catalogue_description") });
  s.graph = { page: { type: "CollectionPage", url: absoluteUrl(req, "/catalogue"), crumbs: [{ name: "Accueil", url: "/" }, { name: "Catalogue" }] } };
  return s;
}

// Liste réelle de contenus d'une page de catégorie → ItemList (adresses existantes uniquement)
const itemList = (url, items) => (items.length ? { "@type": "ItemList", "@id": `${url}#list`, numberOfItems: items.length, itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, url: it.url, name: it.name })) } : null);

function courseCategory(req, category, courses, crumbs) {
  const slug = slugify(category);
  const n = courses.length;
  const label = n === 1 ? "la formation" : `les ${n} formations`;
  const url = absoluteUrl(req, `/categorie/${slug}`);
  const s = apply("course_category", slug, { title: tpl("course_category_title", { category }), description: tpl("course_category_description", { category, courses: label }) });
  s.graph = { page: { type: "CollectionPage", url, crumbs }, main: [itemList(url, courses.map((c) => ({ url: absoluteUrl(req, `/cours/${c.slug}`), name: c.title })))] };
  return s;
}

// Formation : Course relié à l'organisation ; image, durée, note, prix uniquement s'ils existent réellement
function course(req, c, { description, crumbs, faqs, timeRequired, language }) {
  const url = absoluteUrl(req, `/cours/${c.slug}`);
  const s = apply("course", c.id, { title: c.title, description, imagePath: c.thumbnail_path || null, noindex: !c.published });
  const img = schema.imageObject(req, s.imagePath || c.thumbnail_path, null);
  const courseNode = {
    "@type": "Course", "@id": `${url}#course`, name: c.title, description: s.description || description, url, inLanguage: language,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    provider: schema.orgRef(req),
    educationalLevel: c.level, timeRequired,
    image: img ? img.url : undefined,
    offers: { "@type": "Offer", price: (c.price_cents / 100).toFixed(2), priceCurrency: "EUR", url, availability: "https://schema.org/InStock", category: c.price_cents ? "Paid" : "Free" },
    hasCourseInstance: { "@type": "CourseInstance", courseMode: "online" },
    aggregateRating: c.review_count > 0 ? { "@type": "AggregateRating", ratingValue: Number(c.avg_rating).toFixed(1), reviewCount: c.review_count, bestRating: 5 } : undefined,
  };
  const faqNode = faqs.length ? { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: plainText(f.answer, 1000) } })) } : null;
  s.graph = { page: { type: "WebPage", url, crumbs, imagePath: s.imagePath || c.thumbnail_path, dateModified: c.updated_at ? `${String(c.updated_at).replace(" ", "T")}Z` : undefined }, main: [courseNode, faqNode] };
  return s;
}

function staticPage(req, key, { title, description, type = "WebPage", crumbs, main = [] }) {
  const path = { "a-propos": "/a-propos", faq: "/faq", contact: "/contact" }[key];
  const s = apply("page", key, { title, description });
  s.graph = { page: { type, url: absoluteUrl(req, path), crumbs }, main };
  return s;
}

function faqPage(req, faqs, crumbs) {
  const url = absoluteUrl(req, "/faq");
  const node = faqs.length ? { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: plainText(f.answer, 1000) } })) } : null;
  return staticPage(req, "faq", { title: "Questions fréquentes", description: `Réponses aux questions fréquentes sur les formations ${settings.get("site_name")} : accès, paiement, certificats et fonctionnement.`, crumbs, main: [node] });
}

// Listes du blog : accueil du blog, catégorie, étiquette, auteur
function blogList(req, { filter, page, basePath, heading, crumbs, posts }) {
  const st = settings.all();
  let type = "page";
  let key = "blog";
  let auto;
  if (!filter) auto = { title: tpl("blog_title"), description: tpl("blog_description") };
  else if (filter.type === "category") { type = "blog_category"; key = slugify(filter.name); auto = { title: heading, description: tpl("blog_category_description", { category: filter.name }) }; }
  else if (filter.type === "tag") { type = "blog_tag"; key = filter.slug; auto = { title: tpl("blog_tag_title", { tag: filter.name }), description: tpl("blog_tag_description", { tag: filter.name }) }; }
  else { type = "author"; key = String(filter.id); auto = { title: tpl("author_title", { author: filter.label }), description: tpl("author_description", { author: filter.label }) }; }
  // Étiquettes et auteurs : non indexés par défaut (mêmes articles que les catégories), mais leurs liens restent suivis
  if (filter && ((filter.type === "tag" && !st.index_blog_tags) || (filter.type === "author" && !st.index_authors))) auto.robots = "noindex, follow";
  let s = apply(type, key, auto);
  if (page > 1) s = { ...s, title: `${s.title} (page ${page})` };
  if (!s.canonical || page > 1) s.canonical = absoluteUrl(req, page > 1 ? `${basePath}?page=${page}` : basePath);
  const url = absoluteUrl(req, basePath);
  const main = [itemList(url, posts.map((p) => ({ url: absoluteUrl(req, `/blog/${p.slug}`), name: p.title })))];
  if (filter && filter.type === "author") main.push({ "@type": "Person", "@id": `${schema.ids(req).base}/#/person/${filter.id}`, name: filter.label, url });
  const isAuthor = filter && filter.type === "author";
  s.graph = { page: { type: isAuthor ? "ProfilePage" : "CollectionPage", url: s.canonical, crumbs, mainEntity: isAuthor ? `${schema.ids(req).base}/#/person/${filter.id}` : null }, main };
  return s;
}

module.exports = { home, catalogue, courseCategory, course, staticPage, faqPage, blogList, LOCALES, LANGS, tpl, images };
