// Page Generator (programme 21.4) — REGISTRE des composants, lu en direct dans le moteur de pages (aucune liste parallèle des types).
// Le format natif d'une page Kolakisa est un tableau `sections` ; chaque type est défini par `pages/sections.js` (TYPES) et validé par son propre normaliseur.
// Ce module ne fait qu'ENRICHIR ces types réels de leurs capacités (catégorie, dépendances, responsive) et en déduire les propriétés autorisées en EXÉCUTANT le normaliseur sur un exemple.
const sections = require("../marketing/pages/sections");
const pageTypes = require("../marketing/pages/pageTypes");

// Capacités par type. Une entrée absente du moteur est ignorée (jamais présentée comme disponible) ; un type du moteur sans entrée ici reste « non mappé » (non utilisé par le générateur).
const CAPS = Object.freeze({
  hero: { category: "Structure", needs: ["titre", "texte secondaire", "bouton", "image"], provides: ["hero"], sample: { title: "T" } },
  text: { category: "Texte", provides: ["texte", "coordonnées"], sample: { markdown: "t" } },
  image: { category: "Images", provides: ["image"], deps: ["image de la médiathèque ou https"], sample: { src: "https://exemple.test/a.jpg", alt: "a" } },
  list: { category: "Texte", provides: ["liste", "étapes"], sample: { items: ["a"] } },
  features: { category: "Cartes", provides: ["cartes", "services", "avantages", "tarifs (cartes)"], responsive: ["columns 2 à 4 (empilées sur mobile par le rendu)"], sample: { items: [{ title: "a", text: "b" }] } },
  faq: { category: "FAQ", provides: ["faq"], sample: { items: [{ q: "a", a: "b" }] } },
  cta: { category: "Boutons", provides: ["appel à l'action"], needs: ["titre", "bouton"], sample: { title: "t", buttonLabel: "b", buttonUrl: "/x" } },
  button: { category: "Boutons", provides: ["bouton"], sample: { label: "b", url: "/x" } },
  quote: { category: "Témoignages", provides: ["citation"], sample: { text: "t" } },
  testimonials: { category: "Témoignages", provides: ["témoignages"], sample: { items: [{ text: "t" }] } },
  form: { category: "Formulaires", provides: ["formulaire"], deps: ["formulaire associé à la page (réglages de la page) avant publication"], sample: {} },
  video: { category: "Vidéos", provides: ["vidéo"], deps: ["adresse YouTube, Vimeo ou fichier en https"], sample: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "t" } },
  course: { category: "Éléments dynamiques", provides: ["formation du catalogue"], deps: ["formation publiée du catalogue"], sample: null },
  divider: { category: "Structure", provides: ["séparateur"], sample: {} },
});
// Catégories demandées par la mission qui n'ont AUCUN composant natif : jamais présentées comme disponibles
const ABSENT = Object.freeze({
  galerie: "Galerie / grille d'images (seul le composant « Image » existe, une image par section)",
  tableau: "Tableau de données", carte: "Carte de lieux", navigation: "Composant de navigation (menus : Apparence → Menus)", articles: "Liste dynamique d'articles",
  produits: "Produits (boutique en ligne : panier et paiement)", tarifs: "Tableau de tarifs (rendu avec des cartes)", icones: "Icônes dans les cartes",
});

const STYLE = sections.STYLE;
let cache = null;
function build() {
  const ctx0 = { db: null, organizationId: 0 };
  const out = {};
  for (const [type, def] of Object.entries(sections.TYPES)) {
    const caps = CAPS[type];
    const entry = { type, label: def.label, builderOnly: Boolean(def.builderOnly), mapped: Boolean(caps), category: caps ? caps.category : (def.builderOnly ? "Page Builder" : "Autre"), provides: caps ? caps.provides : [], deps: caps && caps.deps ? caps.deps : [], responsive: caps && caps.responsive ? caps.responsive : [], properties: null };
    // Propriétés autorisées = celles que le normaliseur RÉEL produit (types, valeurs par défaut incluses) ; section commune : id, name, hidden, locked, hideOn, style, audience, styles, states
    if (caps && caps.sample) {
      try { entry.properties = Object.keys(def.normalize(ctx0, { type, ...caps.sample }, "Section 1", { n: 0, ids: new Set() })); } catch { entry.properties = null; }
    } else if (type === "divider" || type === "form") entry.properties = Object.keys(def.normalize(ctx0, {}, "Section 1"));
    out[type] = entry;
  }
  return out;
}
function components() { return cache || (cache = Object.freeze(build())); }
const COMMON = Object.freeze(["id", "name", "hidden", "locked", "hideOn", "style", "audience", "styles", "states"]);
// Types utilisables par le générateur : réels, non réservés au Page Builder, et connus de CAPS
const usable = () => Object.values(components()).filter((c) => c.mapped && !c.builderOnly).map((c) => c.type);
// Propriétés autorisées pour un type (celles du normaliseur + attributs communs de section). Course : courseId, cta.
function allowedKeys(type) {
  const c = components()[type];
  if (!c) return null;
  const extra = type === "course" ? ["courseId", "cta"] : [];
  return new Set([...(c.properties || []), ...extra, ...COMMON, "type"]);
}
// Types de pages (inventaire réel) et disponibilité : un type qui dépend d'une fonctionnalité absente (NEEDS) n'est pas générable
function pageType(id) {
  const t = pageTypes.typeList().find((x) => x.id === id);
  if (!t) return null;
  return { id: t.id, label: t.label, group: t.group, needs: t.needs || "", available: !t.needs };
}
function snapshot() {
  return { types: Object.values(components()).map((c) => ({ ...c })), absent: { ...ABSENT }, style: STYLE, breakpoints: sections.BREAKPOINTS, maxSections: sections.MAX_SECTIONS };
}
module.exports = { components, usable, allowedKeys, pageType, snapshot, ABSENT, COMMON, STYLE };
