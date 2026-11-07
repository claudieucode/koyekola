// Étiquettes dynamiques du Page Builder : `{{post.title}}`, `{{course.price}}`, `{{user.first_name | fallback: ami}}`…
// Un MOTEUR de sources (registerDynamicSource) : chaque source sait lire une valeur dans le contexte d'affichage (« scope » :
// article, formation, visiteur, page, site, date). Les étiquettes sont stockées telles quelles dans le document et résolues
// AU MOMENT DE L'AFFICHAGE (canevas, aperçu, page publiée) : le contenu est toujours celui du moment.
//
// Sécurité (les pages sont servies sur le même domaine que les comptes des élèves) :
//  - une étiquette ne produit jamais de HTML : la valeur est du texte, échappé par le rendu (ou par escapeHtml() dans un texte riche) ;
//  - dans un champ d'adresse ou d'image, la valeur résolue est REVALIDÉE par le validateur d'origine (https://, page du site…),
//    sinon le champ reste vide : une donnée du CMS ne peut pas injecter « javascript: » ;
//  - seules les sources déclarées existent ; une étiquette inconnue donne le repli (ou rien).
const TOKEN = /\{\{\s*([a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+)\s*((?:\|[^{}|]*)*)\}\}/gi;
const PURE = /^\s*\{\{\s*[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+\s*(?:\|[^{}|]*)*\}\}\s*$/i;
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const SOURCES = new Map();
// key : « groupe.nom » ; def : { label, group, kind: "text" | "url" | "image" | "number", resolve(scope) → valeur | null }
function registerDynamicSource(key, def) {
  if (!/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/.test(key)) throw new Error(`Source dynamique « ${key} » : forme « groupe.nom » attendue.`);
  if (!def || typeof def.resolve !== "function" || !def.label) throw new Error(`Source dynamique « ${key} » : libellé et fonction resolve obligatoires.`);
  SOURCES.set(key, { key, kind: "text", group: key.split(".")[0], ...def });
}
const money = (cents) => (Number(cents) ? (Number(cents) / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €" : "Gratuit");
const longDate = (ms) => { const d = new Date(Number(ms)); return Number.isFinite(d.getTime()) ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : ""; };
const shortDate = (ms) => { const d = new Date(Number(ms)); return Number.isFinite(d.getTime()) ? d.toLocaleDateString("fr-FR") : ""; };

// ---- Sources fournies ----
// Article : scope.post = { title, url, excerpt, image, date (ms), author, category, minutes }
const P = (k) => (s) => (s.post && s.post[k] != null && s.post[k] !== "" ? s.post[k] : null);
registerDynamicSource("post.title", { label: "Titre de l'article", resolve: P("title") });
registerDynamicSource("post.excerpt", { label: "Résumé de l'article", resolve: P("excerpt") });
registerDynamicSource("post.url", { label: "Adresse de l'article", kind: "url", resolve: P("url") });
registerDynamicSource("post.image", { label: "Image à la une", kind: "image", resolve: P("image") });
registerDynamicSource("post.date", { label: "Date de publication", resolve: (s) => (s.post && s.post.date ? longDate(s.post.date) : null) });
registerDynamicSource("post.author", { label: "Auteur de l'article", resolve: P("author") });
registerDynamicSource("post.category", { label: "Catégorie de l'article", resolve: P("category") });
registerDynamicSource("post.reading_time", { label: "Temps de lecture", resolve: (s) => (s.post && s.post.minutes ? `${s.post.minutes} min` : null) });
registerDynamicSource("post.seo_title", { label: "Titre SEO de l'article", resolve: (s) => (s.post ? s.post.seoTitle || s.post.title || null : null) });
registerDynamicSource("post.seo_description", { label: "Description SEO de l'article", resolve: (s) => (s.post ? s.post.seoDescription || s.post.excerpt || null : null) });
registerDynamicSource("post.tags", { label: "Étiquettes de l'article", resolve: (s) => (s.post && Array.isArray(s.post.tags) && s.post.tags.length ? s.post.tags.join(", ") : null) });
registerDynamicSource("post.comments", { label: "Nombre de commentaires", resolve: (s) => (s.post && s.post.commentsCount != null ? String(s.post.commentsCount) : null) });
registerDynamicSource("post.views", { label: "Nombre de lectures", resolve: (s) => (s.post && s.post.views ? String(s.post.views) : null) });
registerDynamicSource("post.modified", { label: "Date de mise à jour", resolve: (s) => (s.post && s.post.modified ? longDate(s.post.modified) : null) });
registerDynamicSource("post.category_url", { label: "Adresse de la catégorie", kind: "url", resolve: P("categoryUrl") });
registerDynamicSource("post.author_url", { label: "Adresse de la page de l'auteur", kind: "url", resolve: (s) => (s.post && s.post.authorView ? s.post.authorView.url : null) });
registerDynamicSource("post.author_avatar", { label: "Photo de l'auteur", kind: "image", resolve: (s) => (s.post && s.post.authorView ? s.post.authorView.avatar || null : null) });
registerDynamicSource("post.author_bio", { label: "Présentation de l'auteur", resolve: (s) => (s.post && s.post.authorView ? s.post.authorView.bio || null : null) });
// Auteur (boucle sur les auteurs, ou page d'auteur) : scope.author = { name, bio, avatar, url, postsCount }
const A = (k) => (s) => (s.author && s.author[k] != null && s.author[k] !== "" ? s.author[k] : null);
registerDynamicSource("author.name", { label: "Nom de l'auteur", resolve: A("name") });
registerDynamicSource("author.bio", { label: "Présentation de l'auteur", resolve: A("bio") });
registerDynamicSource("author.avatar", { label: "Photo de l'auteur", kind: "image", resolve: A("avatar") });
registerDynamicSource("author.url", { label: "Page de l'auteur", kind: "url", resolve: A("url") });
registerDynamicSource("author.posts", { label: "Nombre d'articles de l'auteur", resolve: A("postsCount") });
// Catégorie ou étiquette (boucle sur les catégories / étiquettes) : scope.term = { name, url, count }
const T = (k) => (s) => (s.term && s.term[k] != null && s.term[k] !== "" ? s.term[k] : null);
registerDynamicSource("term.name", { label: "Nom de la catégorie ou de l'étiquette", resolve: T("name") });
registerDynamicSource("term.url", { label: "Adresse de la catégorie ou de l'étiquette", kind: "url", resolve: T("url") });
registerDynamicSource("term.count", { label: "Nombre d'articles", resolve: (s) => (s.term && s.term.count != null ? String(s.term.count) : null) });
// Page du site (boucle sur les pages)
registerDynamicSource("page_item.title", { label: "Titre de la page listée", resolve: (s) => (s.page_item && s.page_item.title) || null });
registerDynamicSource("page_item.url", { label: "Adresse de la page listée", kind: "url", resolve: (s) => (s.page_item && s.page_item.url) || null });
// Archive du blog (catégorie, étiquette, auteur, recherche) : scope.archive
const R = (k) => (s) => (s.archive && s.archive[k] != null && s.archive[k] !== "" ? s.archive[k] : null);
registerDynamicSource("archive.title", { label: "Titre de l'archive", resolve: R("title") });
registerDynamicSource("archive.description", { label: "Description de l'archive", resolve: R("description") });
registerDynamicSource("archive.count", { label: "Nombre de résultats", resolve: (s) => (s.archive && s.archive.count != null ? String(s.archive.count) : null) });
registerDynamicSource("archive.search", { label: "Recherche de l'archive", resolve: R("search") });
registerDynamicSource("archive.url", { label: "Adresse de l'archive", kind: "url", resolve: R("url") });
// Formation (« produit » : même source, deux noms) : scope.course = { title, subtitle, priceCents, url, image, category, instructor, description }
// « product » lit d'abord scope.product (produit de la boutique, Programme 20.5), sinon scope.course (compatibilité : l'ancien alias de formation)
for (const group of ["course", "product"]) {
  const src = (s) => (group === "product" && s.product ? s.product : s.course);
  const C = (k) => (s) => { const o = src(s); return o && o[k] != null && o[k] !== "" ? o[k] : null; };
  registerDynamicSource(`${group}.title`, { label: "Titre de la formation", resolve: C("title") });
  registerDynamicSource(`${group}.subtitle`, { label: "Sous-titre de la formation", resolve: C("subtitle") });
  registerDynamicSource(`${group}.description`, { label: "Description de la formation", resolve: C("description") });
  registerDynamicSource(`${group}.price`, { label: "Prix de la formation", resolve: (s) => { const o = src(s); return o ? (o.priceLabel || money(o.priceCents)) : null; } });
  registerDynamicSource(`${group}.url`, { label: "Adresse de la formation", kind: "url", resolve: C("url") });
  registerDynamicSource(`${group}.image`, { label: "Image de la formation", kind: "image", resolve: C("image") });
  registerDynamicSource(`${group}.category`, { label: "Catégorie de la formation", resolve: C("category") });
  registerDynamicSource(`${group}.instructor`, { label: "Formateur", resolve: C("instructor") });
}
// Produit de la boutique : scope.product = { shortDescription, regularCents, sku, availability, cartUrl, ... }
const PR = (k) => (s) => (s.product && s.product[k] != null && s.product[k] !== "" ? s.product[k] : null);
registerDynamicSource("product.short_description", { label: "Description courte du produit", resolve: PR("shortDescription") });
registerDynamicSource("product.regular_price", { label: "Prix normal (avant promotion)", resolve: (s) => (s.product && s.product.regularLabel ? s.product.regularLabel : null) });
registerDynamicSource("product.sku", { label: "Référence (SKU)", resolve: PR("sku") });
registerDynamicSource("product.availability", { label: "Disponibilité du produit", resolve: PR("availability") });
registerDynamicSource("product.cart_url", { label: "Adresse du panier", kind: "url", resolve: PR("cartUrl") });
// Visiteur, page, site, date
registerDynamicSource("user.first_name", { label: "Prénom du visiteur", resolve: (s) => (s.visitor && s.visitor.firstName) || null });
registerDynamicSource("user.logged_in", { label: "Visiteur connecté (oui / non)", resolve: (s) => (s.visitor && s.visitor.loggedIn ? "oui" : "non") });
registerDynamicSource("user.cart_count", { label: "Articles dans le panier", resolve: (s) => String((s.visitor && s.visitor.cartCount) || 0) });
registerDynamicSource("page.title", { label: "Titre de la page", resolve: (s) => (s.page && (s.page.title || s.page.name)) || null });
registerDynamicSource("site.name", { label: "Nom du site", resolve: (s) => (s.site && s.site.name) || null });
registerDynamicSource("site.url", { label: "Adresse de l'accueil du site", kind: "url", resolve: (s) => (s.site && s.site.homeUrl) || null });
registerDynamicSource("date.today", { label: "Date du jour", resolve: (s) => longDate((s.now || new Date()).getTime()) });
registerDynamicSource("date.year", { label: "Année en cours", resolve: (s) => String((s.now || new Date()).getFullYear()) });
registerDynamicSource("site.year", { label: "Année en cours (pour le copyright)", resolve: (s) => String((s.now || new Date()).getFullYear()) });
registerDynamicSource("site.copyright", { label: "Copyright automatique (© année + raison sociale ou nom du site)", resolve: (s) => require("./business").copyrightText(s.business, s.site && s.site.name, s.now) });
registerDynamicSource("site.tagline", { label: "Slogan du site (Données de l'entreprise)", resolve: (s) => (s.business && s.business.profile.tagline) || null });
// Données d'entreprise du site (Paramètres → Données de l'entreprise) : scope.business = { profile (vue publique), tz }. Texte seulement ; l'affichage échappe.
const BZ = () => require("./business");
const BP = (f) => (s) => { const v = s.business ? f(s.business.profile, s) : null; return v === undefined || v === "" ? null : v; };
registerDynamicSource("business.legalname", { label: "Raison sociale", resolve: BP((p) => p.legalName) });
registerDynamicSource("business.tagline", { label: "Slogan", resolve: BP((p) => p.tagline) });
registerDynamicSource("business.address", { label: "Adresse complète", resolve: BP((p) => BZ().addressLine(p.address)) });
registerDynamicSource("business.street", { label: "Adresse : rue", resolve: BP((p) => p.address.street) });
registerDynamicSource("business.postalcode", { label: "Adresse : code postal", resolve: BP((p) => p.address.postalCode) });
registerDynamicSource("business.city", { label: "Adresse : ville", resolve: BP((p) => p.address.city) });
registerDynamicSource("business.country", { label: "Adresse : pays", resolve: BP((p) => p.address.country) });
registerDynamicSource("business.phone", { label: "Téléphone (principal)", resolve: BP((p) => (p.phones[0] || {}).number) });
registerDynamicSource("business.phone2", { label: "Téléphone (second)", resolve: BP((p) => (p.phones[1] || {}).number) });
registerDynamicSource("business.phone_url", { label: "Lien « tel: » du téléphone principal", kind: "url", resolve: BP((p) => BZ().telHref((p.phones[0] || {}).number)) });
registerDynamicSource("business.email", { label: "E-mail de contact", resolve: BP((p) => p.email) });
registerDynamicSource("business.email_url", { label: "Lien « mailto: » de l'e-mail de contact", kind: "url", resolve: BP((p) => BZ().mailHref(p.email)) });
registerDynamicSource("business.hours", { label: "Horaires d'ouverture (résumé)", resolve: BP((p) => BZ().hoursSummary(p.hours)) });
registerDynamicSource("business.open_now", { label: "Ouvert maintenant / fermé (selon le fuseau du site)", resolve: (s) => { const o = s.business ? BZ().openNow(s.business.profile.hours, s.now, s.business.tz) : null; return o ? o.label : null; } });
registerDynamicSource("business.legalform", { label: "Forme juridique", resolve: BP((p) => p.legal.form) });
registerDynamicSource("business.registration", { label: "Immatriculations (SIRET, RCS, TVA…)", resolve: BP((p) => p.legal.registrations.map((r) => `${r.label} ${r.value}`).join(" · ")) });
registerDynamicSource("business.publisher", { label: "Directeur de la publication", resolve: BP((p) => p.legal.publisher) });
registerDynamicSource("business.host", { label: "Hébergeur", resolve: BP((p) => [p.legal.hostName, p.legal.hostAddress].filter(Boolean).join(", ")) });
registerDynamicSource("business.delivery", { label: "Livraison (texte)", resolve: BP((p) => p.delivery.text) });
registerDynamicSource("business.returns", { label: "Retours (texte)", resolve: BP((p) => p.delivery.returns) });
registerDynamicSource("business.notice_url", { label: "Page des mentions légales", kind: "url", resolve: BP((p) => p.legalPages.notice) });
registerDynamicSource("business.privacy_url", { label: "Page de confidentialité", kind: "url", resolve: BP((p) => p.legalPages.privacy) });
registerDynamicSource("business.terms_url", { label: "Page des conditions de vente", kind: "url", resolve: BP((p) => p.legalPages.terms) });
for (let i = 1; i <= 6; i++) registerDynamicSource(`business.custom${i}`, { label: `Champ personnalisé n°${i} (valeur)`, resolve: BP((p) => (p.custom[i - 1] || {}).value) });
// Adresse : paramètre d'URL (?q=…) — texte seulement, borné
registerDynamicSource("query.q", { label: "Recherche saisie (?q=)", resolve: (s) => (s.query && typeof s.query.q === "string" && s.query.q.trim() ? s.query.q.trim().slice(0, 80) : null) });
registerDynamicSource("query.categorie", { label: "Catégorie demandée (?categorie=)", resolve: (s) => (s.query && typeof s.query.categorie === "string" && s.query.categorie.trim() ? s.query.categorie.trim().slice(0, 60) : null) });
registerDynamicSource("query.etiquette", { label: "Étiquette demandée (archive d'étiquette)", resolve: (s) => (s.query && typeof s.query.etiquette === "string" && s.query.etiquette.trim() ? s.query.etiquette.trim().slice(0, 60) : null) });

// ---- Filtres (« | nom: valeur ») ----
const FILTERS = {
  fallback: (v, arg) => (v === null || v === "" ? arg : v),
  upper: (v) => String(v).toUpperCase(),
  lower: (v) => String(v).toLowerCase(),
  capitalize: (v) => { const s = String(v); return s.charAt(0).toUpperCase() + s.slice(1); },
  truncate: (v, arg) => { const n = Math.min(Math.max(parseInt(arg, 10) || 100, 1), 1000), s = String(v); return s.length > n ? `${s.slice(0, n).trimEnd()}…` : s; },
  prefix: (v, arg) => (v === "" ? v : `${arg}${v}`),
  suffix: (v, arg) => (v === "" ? v : `${v}${arg}`),
};
// Argument d'un filtre : « texte » (espaces autour retirés) ou « "texte avec espaces " » entre guillemets doubles (gardés tels quels)
const filterArg = (v) => { const t = v.trim(); const m = t.match(/^"(.*)"$/); return m ? m[1] : t; };
const parseFilters = (raw) => String(raw || "").split("|").map((x) => x.trim()).filter(Boolean).map((x) => { const i = x.indexOf(":"); return i < 0 ? [x.toLowerCase(), ""] : [x.slice(0, i).trim().toLowerCase(), filterArg(x.slice(i + 1))]; }).filter(([name]) => Object.hasOwn(FILTERS, name)).slice(0, 4);

const hasToken = (v) => typeof v === "string" && v.includes("{{") && new RegExp(TOKEN.source, "i").test(v);
const isPureToken = (v) => typeof v === "string" && PURE.test(v);
const escapeHtml = (v) => String(v).replace(/[&"<>']/g, (c) => ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;", "'": "&#39;" })[c]);

// Valeur d'UNE étiquette (« post.title | fallback: Sans titre ») → texte (jamais null)
function valueOf(key, rawFilters, scope) {
  const src = SOURCES.get(String(key).toLowerCase());
  let value = null;
  if (src) { try { value = src.resolve(scope || {}); } catch { value = null; } }
  value = value === null || value === undefined ? "" : String(value);
  const filters = parseFilters(rawFilters);
  // Le repli s'applique d'abord (une valeur vide prend le repli, puis les autres filtres s'appliquent)
  for (const [name, arg] of filters.filter(([n]) => n === "fallback")) value = FILTERS[name](value, arg);
  for (const [name, arg] of filters.filter(([n]) => n !== "fallback")) value = FILTERS[name](value, arg);
  return value;
}
// Texte avec étiquettes → texte résolu. html : la valeur est échappée (texte riche). Une chaîne sans étiquette est rendue telle quelle.
function resolveString(str, scope, { html = false } = {}) {
  if (!hasToken(str)) return str;
  return str.replace(TOKEN, (_, key, filters) => { const v = valueOf(key, filters, scope); return html ? escapeHtml(v) : v; });
}
// Champs dont la valeur est une ADRESSE ou une IMAGE : revalidés par le validateur d'origine après résolution
const URL_KEYS = new Set(["url", "link", "ctaUrl", "href", "poster"]);
const IMAGE_KEYS = new Set(["src", "image", "avatar", "thumbnail"]);
function resolveProps(props, scope, validators = {}) {
  const walk = (value, key) => {
    if (typeof value === "string") {
      if (!hasToken(value)) return value;
      const out = resolveString(value, scope, { html: key === "html" });
      if (URL_KEYS.has(key) || IMAGE_KEYS.has(key)) {
        const check = IMAGE_KEYS.has(key) ? validators.imageUrl : validators.linkUrl;
        if (!check) return "";
        try { return check(out, key) || ""; } catch { return ""; }
      }
      return out;
    }
    if (Array.isArray(value)) return value.map((x) => walk(x, key));
    if (value && typeof value === "object") { const o = {}; for (const [k, v] of Object.entries(value)) o[k] = walk(v, k); return o; }
    return value;
  };
  return walk(props, "");
}
// Le texte d'un nœud contient-il une étiquette ? (l'édition directe est alors refusée dans le canevas : elle écraserait l'étiquette)
function nodeIsDynamic(node) {
  let found = false;
  const look = (v) => { if (found) return; if (typeof v === "string") { if (hasToken(v)) found = true; } else if (Array.isArray(v)) v.forEach(look); else if (v && typeof v === "object") Object.values(v).forEach(look); };
  look(node && node.props);
  return found;
}
// Catalogue des sources pour l'éditeur (sélecteur d'étiquettes)
const GROUP_LABELS = { post: "Article du blog", course: "Formation", product: "Produit (formation)", user: "Visiteur", page: "Page", site: "Site", business: "Entreprise", date: "Date", query: "Adresse (?…)" };
function catalog() {
  return {
    groups: Object.entries(GROUP_LABELS).map(([key, label]) => ({ key, label })),
    sources: [...SOURCES.values()].map((s) => ({ key: s.key, label: s.label, group: s.group, kind: s.kind })),
    filters: Object.keys(FILTERS),
  };
}

module.exports = { registerDynamicSource, resolveString, resolveProps, hasToken, isPureToken, valueOf, nodeIsDynamic, catalog, escapeHtml, money, SOURCES, FILTERS, TOKEN };
