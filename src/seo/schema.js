// Données structurées (JSON-LD) : un seul graphe cohérent par page, dont les éléments sont reliés par des identifiants (@id).
//   Organisation (#organization) ← éditeur du site (#website) ← page (#webpage) ← contenu principal (formation, article…)
// Une seule Organisation et un seul WebSite par page, jamais contradictoires. Aucune propriété n'est inventée : un champ
// sans donnée réelle (logo, profils sociaux, image…) n'apparaît simplement pas.
const settings = require("./settings");
const local = require("./local");
const images = require("./images");
const { siteBase, absoluteUrl } = require("../utils/seo");

const ids = (req) => {
  const base = siteBase(req);
  return { base, org: `${base}/#organization`, website: `${base}/#website`, logo: `${base}/#logo` };
};

// Image du site → ImageObject avec ses vraies dimensions (si le fichier existe)
function imageObject(req, publicPath, id) {
  if (!publicPath) return null;
  const p = images.probe(publicPath);
  if (!p.exists) return null;
  const node = { "@type": "ImageObject", url: absoluteUrl(req, publicPath) };
  if (id) node["@id"] = id;
  if (p.width && p.height) { node.width = p.width; node.height = p.height; }
  return node;
}

// Référence courte à l'organisation (utilisée comme éditeur / fournisseur)
// R8 lot 6 : l'identité vient du SITE (page ou hôte), jamais des réglages du site principal pour un autre site
const settingsOf = (req, siteId) => settings.allFor(Number.isInteger(siteId) ? siteId : (req && req.kwSite ? req.kwSite.id : null));
function orgRef(req, siteId) {
  const s = settingsOf(req, siteId);
  return { "@type": s.org_type, "@id": ids(req).org, name: s.org_name_effective, url: `${ids(req).base}/` };
}

function organization(req, siteId) {
  const s = settingsOf(req, siteId);
  const node = { ...orgRef(req, siteId) };
  const logo = imageObject(req, s.org_logo, ids(req).logo);
  if (logo) node.logo = logo;
  if (s.org_description) node.description = s.org_description;
  if (s.social_profiles && s.social_profiles.length) node.sameAs = s.social_profiles;
  // SEO local : uniquement des informations saisies par le site (aucune valeur déduite) ; une adresse n'est publiée que complète (rue + ville)
  if (/^\+?[0-9 ().-]{6,30}$/.test(s.org_phone || "")) node.telephone = s.org_phone;
  if (/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(s.org_email || "")) node.email = s.org_email;
  if (s.org_street && s.org_city) {
    node.address = { "@type": "PostalAddress", streetAddress: s.org_street, addressLocality: s.org_city };
    if (s.org_postal_code) node.address.postalCode = s.org_postal_code;
    if (/^[A-Za-z]{2}$/.test(s.org_country || "")) node.address.addressCountry = s.org_country.toUpperCase();
  }
  // Horaires et coordonnées : propriétés d'un lieu, donc publiées seulement pour une organisation de type LocalBusiness
  if (s.org_type === "LocalBusiness") {
    const hours = local.parseHours(s.org_hours).specs;
    if (hours.length) node.openingHoursSpecification = hours;
    const geo = local.parseGeo(s.org_lat, s.org_lng).geo;
    if (geo) node.geo = geo;
  }
  return node;
}

function website(req, { search = true, siteId } = {}) {
  const s = settingsOf(req, siteId);
  const { base, website: id, org } = ids(req);
  const node = { "@type": "WebSite", "@id": id, url: `${base}/`, name: s.site_name, inLanguage: "fr", publisher: { "@id": org } };
  if (search) {
    node.potentialAction = { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: absoluteUrl(req, "/catalogue?q={search_term_string}") }, "query-input": "required name=search_term_string" };
  }
  return node;
}

function breadcrumb(req, url, crumbs) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url ? absoluteUrl(req, c.url) : url })),
  };
}

// page : { url, type, name, description, crumbs, imagePath, inLanguage, datePublished, dateModified } ; main : nœuds du contenu
function build(req, { page, main = [], siteId }) {
  const { website: websiteId } = ids(req);
  const nodes = [organization(req, siteId), website(req, { siteId })];
  const st = settingsOf(req, siteId);
  if (st.org_locations) nodes.push(...local.locationNodes(st.org_locations, { base: ids(req).base, orgId: ids(req).org }));
  const webpage = { "@type": page.type || "WebPage", "@id": `${page.url}#webpage`, url: page.url, name: page.name, isPartOf: { "@id": websiteId }, inLanguage: page.inLanguage || "fr-FR" };
  if (page.description) webpage.description = page.description;
  if (page.datePublished) webpage.datePublished = page.datePublished;
  if (page.dateModified) webpage.dateModified = page.dateModified;
  if (page.mainEntity) webpage.mainEntity = { "@id": page.mainEntity };
  const primary = imageObject(req, page.imagePath, `${page.url}#primaryimage`);
  if (primary) { nodes.push(primary); webpage.primaryImageOfPage = { "@id": primary["@id"] }; }
  if (page.crumbs && page.crumbs.length) { nodes.push(breadcrumb(req, page.url, page.crumbs)); webpage.breadcrumb = { "@id": `${page.url}#breadcrumb` }; }
  nodes.push(webpage);
  for (const n of main.filter(Boolean)) nodes.push(n);
  return [{ "@context": "https://schema.org", "@graph": nodes }];
}

// Contrôle d'un graphe avant publication / audit : JSON valide, types et propriétés obligatoires, références résolues
const REQUIRED = {
  Organization: ["name", "url"], EducationalOrganization: ["name", "url"], WebSite: ["name", "url"], WebPage: ["url", "name"], CollectionPage: ["url", "name"],
  AboutPage: ["url", "name"], ContactPage: ["url", "name"], ProfilePage: ["url", "name"], BreadcrumbList: ["itemListElement"], Course: ["name", "description", "provider"],
  BlogPosting: ["headline", "datePublished", "author"], Article: ["headline", "datePublished", "author"], FAQPage: ["mainEntity"], LocalBusiness: ["name", "address"], HowTo: ["name", "step"], ImageObject: ["url"], Person: ["name"],
};
function validate(blocks) {
  const problems = [];
  let nodes = [];
  try {
    for (const b of blocks || []) { JSON.parse(JSON.stringify(b)); nodes = nodes.concat(b["@graph"] || [b]); }
  } catch { return [{ level: "critical", message: "Données structurées : JSON invalide." }]; }
  const known = new Set(nodes.map((n) => n["@id"]).filter(Boolean));
  const counts = {};
  for (const n of nodes) {
    const type = [].concat(n["@type"])[0];
    counts[type] = (counts[type] || 0) + 1;
    for (const prop of REQUIRED[type] || []) {
      const v = n[prop];
      if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) problems.push({ level: "critical", message: `Données structurées ${type} : propriété « ${prop} » manquante.` });
    }
    const walk = (v) => {
      if (Array.isArray(v)) return v.forEach(walk);
      if (v && typeof v === "object") {
        if (Object.keys(v).length === 1 && v["@id"] && !known.has(v["@id"])) problems.push({ level: "high", message: `Données structurées : référence ${v["@id"]} introuvable dans la page.` });
        for (const [k, x] of Object.entries(v)) if (k !== "@id") walk(x);
      }
    };
    for (const [k, v] of Object.entries(n)) if (k !== "@id") walk(v);
  }
  for (const t of ["Organization", "EducationalOrganization", "WebSite"]) if ((counts[t] || 0) > 1) problems.push({ level: "high", message: `Données structurées : ${counts[t]} nœuds ${t} dans la même page (un seul attendu).` });
  return problems;
}

module.exports = { build, organization, website, orgRef, breadcrumb, imageObject, validate, ids };
