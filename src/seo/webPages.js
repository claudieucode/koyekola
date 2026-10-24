// SEO des pages du CMS (Site Web → Pages, adresse /p/<adresse>) : même moteur que le reste du site (resolver.finalize),
// alimenté par les réglages de la page (colonne seo, versionnée avec le brouillon), du site (mk_sites.settings.seo,
// identity.description, extras.noindex) puis des réglages SEO globaux. Priorité, de la plus forte à la plus faible :
//   réglage de la page → valeur du contenu (titre, description, bandeau) → réglage du site → réglage global.
// Une seule fonction décide de ce qui est publié dans le HTML (head) ; l'analyse et l'aperçu du Page Builder lisent le même résultat.
const db = require("../config/database");
const settings = require("./settings");
const images = require("./images");
const { finalize } = require("./resolver");
const { render } = require("./templates");
const { absoluteUrl, plainText } = require("../utils/seo");
const analyzer = require("../utils/seoAnalyzer");
const urls = require("../services/urls");

const LOCALES = { fr: "fr_FR", en: "en_US", es: "es_ES", pt: "pt_PT", de: "de_DE", it: "it_IT", ar: "ar_AR", sw: "sw_KE" };
const LANGS = { fr: "fr-FR", en: "en", es: "es", pt: "pt", de: "de", it: "it", ar: "ar", sw: "sw" };

const parseSeo = (page) => {
  if (page && page.seo && typeof page.seo === "object") return page.seo;
  try { return JSON.parse((page && page.seo) || "{}") || {}; } catch { return {}; }
};
const siteConf = (site) => (site && site.settings ? site.settings : null);

// Page d'accueil du site (adresse relative), pour le fil d'Ariane
function homeOf(site) {
  if (!site || !site.home_page_id) return null;
  try {
    const row = db.prepare("SELECT id, slug, name, site_id FROM mk_landing_pages WHERE id = ? AND status = 'published' AND archived_at IS NULL").get(site.home_page_id);
    return row ? { id: row.id, path: urls.pageCanonicalPath(row), name: row.name } : null;
  } catch { return null; }
}

// Première image utilisable parmi les candidats : adresse https, ou fichier de la médiathèque qui existe vraiment
function firstImage(candidates) {
  for (const c of candidates) {
    if (!c) continue;
    if (/^https:\/\//i.test(c)) return c;
    if (c.startsWith("/") && images.probe(c).exists) return c;
  }
  return null;
}

const faqsOf = (page) => (page.sections || []).filter((x) => x.type === "faq" && !x.hidden).flatMap((x) => x.items || []).filter((f) => f && f.q && f.a);

// Réglages d'indexation effectifs (utilisés par le HTML, le plan du site et l'analyse)
function indexing(page, site, { preview = false } = {}) {
  const seo = parseSeo(page);
  const sx = siteConf(site);
  const reasons = [];
  if (preview) reasons.push("aperçu (jamais indexé)");
  if (!page.indexable) reasons.push("« Autoriser les moteurs de recherche » est décoché");
  if (seo.noindex) reasons.push("noindex réglé sur la page");
  if (page.funnelNoindex) reasons.push("étape de tunnel réglée « ne pas proposer aux moteurs de recherche »");
  if (sx && sx.extras && sx.extras.noindex) reasons.push("le site entier est réglé en noindex");
  const follow = !seo.nofollow && !(sx && sx.seo && sx.seo.follow === false);
  return { indexable: reasons.length === 0, follow, reasons, blockAll: preview || !page.indexable || Boolean(page.funnelNoindex) || Boolean(sx && sx.extras && sx.extras.noindex) };
}

// Données d'entrée du moteur (format commun `s` de resolver.finalize) pour une page du CMS
function inputs(req, { page, site = null, preview = false }) {
  const st = settings.allFor(site ? site.id : null); // R8 lot 6 : réglages du site de la page, jamais ceux du site principal
  const seo = parseSeo(page);
  const sx = siteConf(site);
  const siteSeo = (sx && sx.seo) || {};
  // Adresse publique propre au site : toutes les adresses absolues (canonical, og:url, JSON-LD) en dépendent
  if (siteSeo.publicUrl) req.seoBase = siteSeo.publicUrl;
  const siteLabel = siteSeo.title || (site && settings.storedFor(site.id).site_name) || (site && site.name) || st.site_name; // nom SEO du site (réglages du site) → nom enregistré dans ses réglages SEO → nom du site
  const pageTitle = page.title || page.name;
  const own = urls.pageCanonicalPath(page); // adresse de référence de la page (racine du domaine du site, sinon /p/<adresse>)
  const ix = indexing(page, site, { preview });
  const s = { siteId: site ? site.id : null, siteName: siteLabel, locale: (site && settings.storedFor(site.id).og_locale) || LOCALES[(sx && sx.extras && sx.extras.language) || "fr"] || st.og_locale }; // langue de partage : réglage explicite du site (rubrique Open Graph) → langue du site → défaut
  // Titre : SEO personnalisé (complet) → titre de la page + nom du site
  if (seo.title) s.rawTitle = seo.title;
  else s.rawTitle = render(st.title_template, { title: pageTitle, sep: st.title_separator, site_name: siteLabel });
  s.description = plainText(seo.description || page.description || (sx && sx.identity && sx.identity.description) || "", 300) || undefined;
  s.canonical = seo.canonical || absoluteUrl(req, own);
  // Robots : bloqué entièrement (aperçu, page ou site non indexables) ; sinon directives réglées sur la page
  // (les balises de partage restent publiées : un lien partagé garde son aperçu même si la page n'est pas indexée)
  if (ix.blockAll) s.robots = "noindex, nofollow";
  else {
    const dirs = [seo.noindex ? "noindex" : "index", ix.follow ? "follow" : "nofollow"];
    if (!seo.noindex) for (const d of ["noarchive", "nosnippet", "noimageindex"]) if (seo[d]) dirs.push(d);
    s.robots = dirs.join(", "); // toujours publié pour les pages du CMS (comme avant le palier 11)
  }
  // Partage : valeurs de la page, sinon titre/description SEO ; image : page → bandeau → image du site → logo → image globale
  if (seo.ogTitle) s.ogTitle = seo.ogTitle;
  if (seo.ogDescription) s.ogDescription = seo.ogDescription;
  if (seo.twitterCard) s.twitterCard = seo.twitterCard;
  const hero = (page.sections || []).find((x) => x.type === "hero" && x.image);
  const imagePath = firstImage([seo.ogImage, hero && hero.image, siteSeo.ogImage, sx && sx.identity && sx.identity.logoUrl]);
  if (imagePath) { s.imagePath = imagePath; s.imageAlt = hero && hero.image === imagePath ? (hero.imageAlt || pageTitle) : pageTitle; }
  // Données structurées : WebPage + fil d'Ariane (site → page) + FAQ réelle ; Organisation et WebSite sont ajoutés par le graphe commun
  const home = homeOf(site);
  const crumbs = home && home.id !== page.id ? [{ name: siteLabel, url: home.path }, { name: pageTitle }] : null;
  const faqs = faqsOf(page);
  const url = s.canonical;
  const faq = faqs.length ? { "@type": "FAQPage", "@id": `${url}#faq`, mainEntity: faqs.map((f) => ({ "@type": "Question", name: plainText(f.q, 300), acceptedAnswer: { "@type": "Answer", text: plainText(f.a, 1000) } })) } : null;
  s.graph = { page: { type: "WebPage", url, name: seo.title || pageTitle, crumbs: crumbs || undefined, inLanguage: LANGS[(sx && sx.extras && sx.extras.language) || "fr"] || "fr-FR", dateModified: page.updated_at ? `${String(page.updated_at).replace(" ", "T").replace(/Z?$/, "Z")}` : undefined, imagePath: imagePath && imagePath.startsWith("/") ? imagePath : undefined }, main: [faq] };
  return { s, ix, siteLabel, own };
}

// Balises finales (title, description, robots, canonical, Open Graph, X, JSON-LD) d'une page du CMS
function head(req, { page, site = null, preview = false }) {
  const { s, ix } = inputs(req, { page, site, preview });
  const h = finalize(req, urls.pageCanonicalPath(page), s, null);
  // Pas de données structurées sur une page que les moteurs ne doivent pas indexer
  if (ix.blockAll || (parseSeo(page).noindex)) h.jsonLd = [];
  return h;
}

// ---------- Analyse (indications, jamais une promesse de classement) ----------
// Chaque contrôle a une règle explicite ; la note résume la part de contrôles réussis (bon = 1, à améliorer = ½, problème = 0).
function analyze(req, { page, site = null, html = "" }) {
  const { s, ix } = inputs(req, { page, site, preview: false });
  const seo = parseSeo(page);
  const h = finalize(req, urls.pageCanonicalPath(page), { ...s, noindex: false }, null);
  const x = analyzer.extract(html);
  const checks = [];
  const add = (group, id, status, label, advice = "") => checks.push({ group, id, status, label, advice });
  const title = h.title;
  const description = s.description || h.description;
  const kw = String(seo.focusKeyword || "").trim();

  // Indexation et robots
  if (ix.indexable) add("index", "index", "good", "La page peut être indexée");
  else add("index", "index", "problem", "Cette page ne sera pas indexée", `Raison : ${ix.reasons.join(" ; ")}. Si c'est voulu, ignorez cet avertissement.`);
  if (!ix.follow) add("index", "follow", "improve", "Les liens de la page ne sont pas suivis (nofollow)", "Les moteurs ne suivront pas les liens de cette page. Vérifiez que c'est voulu.");
  // Titre et description
  if (!seo.title) add("seo", "title", "improve", "Titre SEO non renseigné", `Le titre « ${title} » est composé automatiquement à partir du titre de la page. Un titre SEO dédié vous permet de choisir ce qui s'affiche dans les résultats.`);
  else if (title.length > 60) add("seo", "title", "improve", `Titre SEO un peu long (${title.length} caractères)`, "Les moteurs coupent souvent après 55 à 65 caractères environ (indicatif) : placez l'essentiel au début.");
  else if (title.length < 25) add("seo", "title", "improve", `Titre SEO court (${title.length} caractères)`, "Vous avez de la place pour un titre plus descriptif.");
  else add("seo", "title", "good", `Titre SEO (${title.length} caractères)`);
  if (!description) add("seo", "description", "problem", "Description absente", "Sans description, le moteur choisit lui-même un extrait.");
  else if (!seo.description) add("seo", "description", "improve", "Description SEO non renseignée", "Une description vient de la page ou du site ; une description dédiée est plus précise.");
  else if (description.length > 160) add("seo", "description", "improve", `Description longue (${description.length} caractères)`, "Souvent tronquée au-delà de 150 à 160 caractères (indicatif, selon l'appareil).");
  else if (description.length < 70) add("seo", "description", "improve", `Description courte (${description.length} caractères)`, "Une phrase ou deux qui donnent envie de cliquer suffisent.");
  else add("seo", "description", "good", `Description (${description.length} caractères)`);
  // Canonical
  if (!seo.canonical) add("seo", "canonical", "good", "Adresse canonique : celle de la page");
  else if (h.canonical && !h.canonical.endsWith(urls.pageCanonicalPath(page) === "/" ? "/" : urls.pageCanonicalPath(page))) add("seo", "canonical", "improve", "Adresse canonique vers une autre adresse", "Vous indiquez aux moteurs que l'original est ailleurs : cette page ne sera pas mise en avant.");
  else add("seo", "canonical", "good", "Adresse canonique personnalisée");
  // Partage
  add("social", "og-image", h.image ? "good" : "improve", h.image ? "Image de partage trouvée" : "Pas d'image de partage", h.image ? "" : "Ajoutez une image (idéalement 1200 × 630) : les liens partagés sur les réseaux sont bien plus attrayants avec une image.");
  // Structure
  const h1 = x.headings.filter((y) => y.level === 1).length;
  add("structure", "h1", h1 === 1 ? "good" : h1 === 0 ? "improve" : "improve", h1 === 1 ? "Un seul titre principal (H1)" : h1 === 0 ? "Aucun titre principal (H1)" : `${h1} titres principaux (H1)`, h1 === 1 ? "" : h1 === 0 ? "Un titre principal décrit le sujet de la page ; ajoutez-en un." : "Plusieurs H1 ne bloquent rien mais brouillent la structure : gardez un H1 et passez les autres en H2.");
  let skipped = false;
  let last = 1;
  for (const hd of x.headings) { if (hd.level > last + 1) skipped = true; last = hd.level; }
  add("structure", "hierarchy", skipped ? "improve" : "good", skipped ? "Niveau de titre sauté" : "Hiérarchie des titres", skipped ? "Un H3 devrait suivre un H2, et ainsi de suite." : "");
  const words = analyzer.extract(html).text.split(/\s+/).filter(Boolean).length;
  add("structure", "length", words >= 150 ? "good" : "improve", `Texte de la page : ${words} mots`, words >= 150 ? "" : "Une page très courte donne peu de matière aux moteurs. Ce n'est pas un défaut pour une page volontairement épurée.");
  // Images et liens
  const noAlt = x.images.filter((i) => !i.alt);
  if (x.images.length) add("media", "alt", noAlt.length ? "problem" : "good", noAlt.length ? `${noAlt.length} image${noAlt.length > 1 ? "s" : ""} sans texte alternatif` : `${x.images.length} image${x.images.length > 1 ? "s" : ""} avec texte alternatif`, noAlt.length ? "Décrivez chaque image (utile aux personnes malvoyantes avant tout)." : "");
  const internal = x.links.filter((l) => /^\/(?!\/)/.test(l) || l.startsWith(absoluteUrl(req, "/").replace(/\/$/, "")));
  const external = x.links.filter((l) => /^https?:/i.test(l) && !internal.includes(l));
  add("links", "internal", internal.length ? "good" : "improve", internal.length ? `${internal.length} lien${internal.length > 1 ? "s" : ""} interne${internal.length > 1 ? "s" : ""}` : "Aucun lien interne", internal.length ? "" : "Relier la page aux autres pages du site aide les visiteurs et les moteurs.");
  add("links", "external", "good", `${external.length} lien${external.length > 1 ? "s" : ""} externe${external.length > 1 ? "s" : ""}`);
  // Mot-clé principal (facultatif)
  if (kw) {
    const inText = analyzer.countPhrase(x.text, kw);
    add("keyword", "kw-title", analyzer.countPhrase(title, kw) ? "good" : "improve", "Mot-clé dans le titre SEO", analyzer.countPhrase(title, kw) ? "" : "Si c'est naturel, placez l'expression dans le titre.");
    add("keyword", "kw-description", analyzer.countPhrase(description, kw) ? "good" : "improve", "Mot-clé dans la description", analyzer.countPhrase(description, kw) ? "" : "Mentionnez le sujet dans une phrase naturelle.");
    add("keyword", "kw-text", inText ? "good" : "improve", inText ? `Mot-clé présent dans le texte (${inText} fois)` : "Mot-clé absent du texte", inText ? "" : "Le texte de la page ne mentionne jamais l'expression visée.");
  }
  const summary = { good: 0, improve: 0, problem: 0 };
  checks.forEach((c) => { summary[c.status]++; });
  return {
    checks, summary, score: analyzer.scoreOf({ checks, summary }),
    scoreNote: "Repère interne : part des contrôles ci-dessus qui sont réussis. Ce n'est ni une note officielle ni une prévision de classement.",
    resolved: { title: h.title, description: h.description, canonical: h.canonical, robots: ix.indexable ? (s.robots || "index, follow") : "noindex, nofollow", image: h.image || null, siteName: h.siteName, indexable: ix.indexable, reasons: ix.reasons },
    serp: { title: h.title, url: h.canonical, description: h.description },
  };
}

module.exports = { head, inputs, analyze, indexing, parseSeo, faqsOf };
