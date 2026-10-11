// Moteur de métadonnées : à partir des valeurs automatiques calculées par chaque page (`seo` passé à la vue), des réglages
// SEO du contenu (surcharges) et des réglages du site, produit EXACTEMENT ce que l'en-tête HTML publie. Une seule source :
// l'administration, la base, l'audit et le HTML public lisent tous le résultat de ce moteur.
const settings = require("./settings");
const meta = require("./meta");
const images = require("./images");
const schema = require("./schema");
const { render } = require("./templates");
const { siteBase, absoluteUrl } = require("../utils/seo");

// Applique les surcharges enregistrées d'un contenu sur les valeurs automatiques de la page
function apply(type, key, s) {
  const m = meta.stored(type, key);
  const out = { ...s, entity: { type, key } };
  if (m.seo_title) { out.title = m.seo_title; delete out.rawTitle; }
  if (m.seo_description) out.description = m.seo_description;
  if (m.canonical_url) out.canonical = m.canonical_url;
  if (m.robots_index !== null || m.robots_follow !== null) {
    const index = m.robots_index === null ? !(s.robots || "").includes("noindex") : Boolean(m.robots_index);
    const follow = m.robots_follow === null ? !(s.robots || "").includes("nofollow") : Boolean(m.robots_follow);
    out.robots = index && follow ? null : `${index ? "index" : "noindex"}, ${follow ? "follow" : "nofollow"}`;
  }
  if (m.og_title) out.ogTitle = m.og_title;
  if (m.og_description) out.ogDescription = m.og_description;
  if (m.og_image_path) out.imagePath = m.og_image_path;
  if (m.twitter_card) out.twitterCard = m.twitter_card;
  return out;
}

// Adresse publique d'une image : chemin du site (/uploads/…) ou adresse absolue déjà fournie
function localPath(req, url) {
  if (!url) return null;
  if (url.startsWith("/")) return url;
  const base = siteBase(req);
  return url.startsWith(base + "/") ? url.slice(base.length) : null;
}

// Résultat final pour l'en-tête <head>
function finalize(req, currentPath, s = {}, viewTitle = null) {
  const st = settings.all();
  const pageTitle = s.rawTitle ? null : s.title || viewTitle;
  const title = s.rawTitle || (pageTitle ? render(st.title_template, { title: pageTitle, sep: st.title_separator, site_name: st.site_name }) : `${st.site_name} — Mes formations en ligne`);
  const description = s.description || st.default_description;
  const canonical = s.canonical || absoluteUrl(req, currentPath);
  // Visibilité masquée (Paramètres → Indexation) ou environnement non public : toutes les pages sont « noindex »
  const closed = !require("../middlewares/siteHost").indexingAllowed(req);
  const head = { title, description, noindex: Boolean(s.noindex) || (closed && !(req && req.kwSite)), robots: s.robots || null, canonical, siteName: s.siteName || st.site_name, locale: s.locale || st.og_locale };
  if (head.noindex) return head;
  // Image de partage : celle de la page, sinon l'image par défaut du site ; publiée seulement si le fichier existe vraiment
  const imageSource = s.imagePath || s.image || (st.default_social_image || null);
  let image = null;
  let imageWidth = null;
  let imageHeight = null;
  const path = localPath(req, imageSource);
  if (path) {
    const p = images.probe(path);
    if (p.exists) { image = absoluteUrl(req, path); imageWidth = p.width; imageHeight = p.height; }
  } else if (imageSource && /^https:\/\//i.test(imageSource)) image = imageSource;
  const shareTitle = s.ogTitle || s.rawTitle || pageTitle || st.site_name;
  const shareDescription = s.ogDescription || description;
  let xImage = image;
  if (s.twitterImage) { const tp = localPath(req, s.twitterImage); xImage = tp ? (images.probe(tp).exists ? absoluteUrl(req, tp) : image) : s.twitterImage; }
  Object.assign(head, {
    ogType: s.ogType || "website", ogTitle: shareTitle, ogDescription: shareDescription, ogUrl: s.ogUrl || canonical,
    image, imageWidth, imageHeight, imageAlt: image ? s.imageAlt || null : null,
    twitterCard: s.twitterCard || (xImage ? "summary_large_image" : "summary"), twitterTitle: s.twitterTitle || shareTitle, twitterDescription: s.twitterDescription || shareDescription, twitterImage: xImage,
    publishedTime: s.publishedTime || null, modifiedTime: s.modifiedTime || null, section: s.section || null, tags: s.tags || [],
  });
  // Données structurées : graphe relié (pages du SEO CORE) ou blocs fournis tels quels
  if (s.graph) {
    head.jsonLd = schema.build(req, { page: { ...s.graph.page, name: s.graph.page.name || title, description: s.graph.page.description || description, url: s.graph.page.url || canonical }, main: s.graph.main || [] });
  } else head.jsonLd = s.jsonLd || [];
  return head;
}

module.exports = { apply, finalize, localPath };
