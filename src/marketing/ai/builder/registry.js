// Registre des capacités RÉELLES du CMS pour le Brief Analyzer et le Site Planner (Programme 21.3). Aucune liste n'est recopiée à la main
// quand le code la porte déjà : sections, éléments, types de pages, gabarits, sources de requête et modules sont LUS dans leurs modules d'origine,
// donc ce registre ne peut pas annoncer un composant qui n'existe plus. Seul l'inventaire des « fonctionnalités métier » est déclaré ici : chacune
// calcule son état (available | partial | unavailable) à partir de ces registres. Une fonctionnalité sans appui réel est « unavailable » : jamais inventée.
const sections = require("../../pages/sections");
const nodes = require("../../pages/nodes");
const pageTypes = require("../../pages/pageTypes");
const templates = require("../../pages/templates");
const query = require("../../pages/query");
const siteModules = require("../../siteModules");

const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const sectionTypes = () => Object.keys(sections.TYPES);
const nodeTypes = () => Object.keys(nodes.NODE_TYPES);
const pageTypeList = () => pageTypes.typeList();
const gabarits = () => templates.TEMPLATES.map((t) => t.key);
const hasSection = (k) => Object.hasOwn(sections.TYPES, k);
const hasNode = (k) => Object.hasOwn(nodes.NODE_TYPES, k);
const hasGabarit = (k) => gabarits().includes(k);
const pageType = (id) => pageTypeList().find((t) => t.id === id) || null;
const hasSource = (k) => query.SOURCES.has(k);

const A = (reason = "") => ({ status: "available", reason });
const P = (reason) => ({ status: "partial", reason });
const U = (reason) => ({ status: "unavailable", reason });
const all = (...c) => c.every(Boolean);

// key → { label, module?, check() → {status, reason}, via: éléments réels utilisés }
const FEATURES = {
  formulaire_contact: { label: "Formulaire de contact", via: ["section:form", "module:formulaires"], check: () => (hasSection("form") ? A() : U("Section « formulaire » absente.")) },
  formulaire_devis: { label: "Demande de devis", via: ["section:form", "gabarit:consultation"], check: () => (hasSection("form") ? A("Le formulaire se configure (champs) dans Formulaires ; le CMS n'a pas de moteur de devis chiffré.") : U("Section « formulaire » absente.")) },
  blog: { label: "Blog", via: ["source:posts", "pageType:blog"], check: () => (all(hasSource("posts"), pageType("blog")) ? A() : U("Blog indisponible.")) },
  newsletter: { label: "Newsletter", via: ["gabarit:newsletter", "section:form"], check: () => (all(hasGabarit("newsletter"), hasSection("form")) ? A("Inscription via formulaire ; l'envoi se fait dans le module Marketing.") : U("Inscription newsletter indisponible.")) },
  galerie: { label: "Galerie d'images", via: ["node:gallery"], check: () => (hasNode("gallery") ? A("Les images viennent de la médiathèque du site (à fournir).") : U("Élément galerie absent.")) },
  carte: { label: "Carte / localisation", via: ["node:map"], check: () => (hasNode("map") ? A() : U("Élément carte absent.")) },
  recherche: { label: "Recherche", via: ["node:search"], check: () => (hasNode("search") ? P("Recherche dans le contenu du CMS (articles, formations) ; pas de recherche filtrée par critères métier.") : U("Élément recherche absent.")) },
  temoignages: { label: "Témoignages", via: ["section:testimonials"], check: () => (hasSection("testimonials") ? A("Uniquement avec des témoignages réels fournis (jamais inventés).") : U("Section témoignages absente.")) },
  faq: { label: "Questions fréquentes", via: ["section:faq"], check: () => (hasSection("faq") ? A() : U("Section FAQ absente.")) },
  tarifs: { label: "Grille de tarifs", via: ["node:pricelist", "gabarit:tarifs"], check: () => (hasGabarit("tarifs") ? A("Prix à fournir par la personne.") : U("Gabarit tarifs absent.")) },
  equipe: { label: "Présentation de l'équipe", via: ["pageType:equipe"], check: () => (pageType("equipe") ? A() : U("Type de page « équipe » absent.")) },
  video: { label: "Vidéo", via: ["section:video"], check: () => (hasSection("video") ? A() : U("Section vidéo absente.")) },
  evenements: { label: "Événements / webinaires", via: ["gabarit:evenement", "gabarit:webinaire"], check: () => (all(hasGabarit("evenement"), hasGabarit("webinaire")) ? A("Pages d'événement ; pas de billetterie.") : U("Gabarits d'événement absents.")) },
  telechargements: { label: "Téléchargements", via: ["gabarit:telechargement"], check: () => (hasGabarit("telechargement") ? A() : U("Gabarit de téléchargement absent.")) },
  catalogue_formations: { label: "Catalogue de formations", module: "lms", via: ["section:course", "node:courselist", "source:courses"], check: () => {
    if (!all(hasSection("course"), hasNode("courselist"), hasSource("courses"))) return U("Éléments de formation absents.");
    return siteModules.MODULES.lms && siteModules.MODULES.lms.ready ? A() : P("Disponible sur le site principal ; sur un site secondaire, le module Formations n'honore pas encore le site.");
  } },
  paiement: { label: "Paiement en ligne", via: ["node:addtocart", "node:cart"], check: () => (all(hasNode("addtocart"), hasNode("cart")) ? P("Paiement des FORMATIONS seulement (Stripe). Pas de paiement de produits ni de moyens locaux (mobile money) dans le CMS.") : U("Panier absent.")) },
  boutique: { label: "Boutique en ligne (produits)", via: ["pageType:boutique"], check: () => { const t = pageType("boutique"); return t && t.needs ? U(`${t.needs} : non fourni par le CMS (le panier ne vend que des formations).`) : U("Boutique de produits absente."); } },
  catalogue_produits: { label: "Catalogue de produits", via: ["pageType:catalogue-produits"], check: () => U("Aucune source de contenu « produits » (sources : " + [...query.SOURCES.keys()].join(", ") + ").") },
  catalogue_biens: { label: "Catalogue de biens (immobilier)", via: ["pageType:portfolio", "node:gallery"], check: () => P("Pas de contenu « biens » ni de recherche par prix : les fiches se créent une à une comme pages, avec galerie. Filtrage non disponible.") },
  reservation: { label: "Réservation en ligne", via: ["pageType:reservation", "gabarit:consultation"], check: () => (nodeTypes().some((k) => /reserv|booking/.test(k)) ? A() : pageType("reservation") && hasSection("form") ? P("Page de DEMANDE de réservation (formulaire) ; pas de calendrier, de créneaux ni de confirmation automatique.") : U("Aucun moteur de réservation dans le CMS.")) },
  espace_membre: { label: "Espace membre", via: ["node:account"], check: () => (hasNode("account") ? P("Compte élève du CMS (formations) ; pas d'espace membre générique.") : U("Aucun espace membre.")) },
  multilingue: { label: "Site multilingue", via: [], check: () => U((pageTypes.NEEDS && pageTypes.NEEDS.multilingue) ? `${pageTypes.NEEDS.multilingue} : non fourni.` : "Site multilingue non fourni.") },
};
const featureKeys = () => Object.keys(FEATURES);
function feature(key) {
  const f = FEATURES[key];
  if (!f) return null;
  const c = f.check();
  return { key, label: f.label, module: f.module || null, via: f.via, status: c.status, reason: c.reason };
}
const features = () => featureKeys().map(feature);

// Module activé pour le site visé ? (null = site principal ou équipe : aucune activation requise)
function moduleEnabled(ctx, module, siteId) {
  if (!module) return true;
  if (siteId === null || siteId === undefined) return true;
  try { return siteModules.isEnabled(ctx.db, ctx.organizationId, siteId, module); } catch { return false; }
}

// Texte injecté dans les prompts : UNIQUEMENT ce qui existe
function promptSpec() {
  return [
    `Types de sections disponibles : ${sectionTypes().join(", ")}.`,
    `Éléments (widgets) disponibles pour une section « layout » : ${nodeTypes().join(", ")}.`,
    `Types de pages : ${pageTypeList().map((t) => t.id).join(", ")}.`,
    "Fonctionnalités métier (clé : état réel dans Kolakisa) :",
    ...features().map((f) => `- ${f.key} : ${f.status}${f.reason ? ` (${f.reason})` : ""}`),
  ].join("\n");
}

module.exports = { norm, sectionTypes, nodeTypes, pageTypeList, pageType, hasSection, hasNode, gabarits, hasGabarit, featureKeys, feature, features, FEATURES, moduleEnabled, promptSpec };
