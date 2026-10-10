// « Parties » stylables des widgets (cibles de style) : pour un widget composé de plusieurs zones visibles (carte, image, date, titre…), le registre
// déclare ici chaque zone, UNE FOIS : son libellé, son sélecteur (écrit par le développeur, jamais saisi par l'auteur), les groupes de réglages
// qu'elle accepte (mêmes groupes que l'onglet Style) et les états proposés. Le moteur de styles est le même que pour la racine du widget :
// mêmes propriétés, mêmes écrans, mêmes validations (grammaire fermée), même CSS généré (nodes.js : pageCss). Un widget absent d'ici garde
// exactement son comportement d'avant. Données enregistrées : node.parts = { <partie>: { styles: { desktop… }, states: { hover… } } }.
//
// groups : { <groupe>: true (tous les réglages du groupe) | [clés] }.  states : états de survol / focus / clic autorisés pour la partie.

const spacingAll = true;
const BOX = { background: true, border: true, spacing: spacingAll, effects: true, size: ["width", "maxWidth", "minHeight", "height"] };
const IMAGE = { size: ["width", "height", "minHeight", "maxHeight"], media: true, border: true, effects: ["opacity", "boxShadow", "shadow", "filter", "transitionDuration"], spacing: spacingAll };
const TEXT = { typography: true, color: ["color"], spacing: spacingAll };
const TEXT_BG = { typography: true, color: ["color"], background: true, border: true, spacing: spacingAll };
const LAYOUT = { layout: ["display", "flexDirection", "flexWrap", "justifyContent", "alignItems", "gap", "rowGap", "columnGap"], spacing: spacingAll, size: ["width", "maxWidth", "minHeight"] };

const part = (label, select, groups, states) => ({ label, select, groups, states: states || [] });

const PARTS = {
  posts: {
    card: part("Carte", ".kw-post-card", BOX, ["hover"]),
    image: part("Image", ".kw-post-card img", IMAGE, ["hover"]),
    body: part("Corps de la carte", ".kw-post-body", { ...LAYOUT, background: true }),
    date: part("Date", ".kw-post-date", TEXT),
    title: part("Titre", ".kw-post-title", TEXT, ["hover"]),
    excerpt: part("Extrait", ".kw-post-excerpt", TEXT),
  },
  courselist: {
    card: part("Carte", ".kw-course-card", BOX, ["hover"]),
    image: part("Image", ".kw-course-card img", IMAGE, ["hover"]),
    body: part("Corps de la carte", ".kw-course-card .kw-post-body", { ...LAYOUT, background: true }),
    title: part("Titre", ".kw-course-card .kw-post-title", TEXT, ["hover"]),
    excerpt: part("Sous-titre", ".kw-course-card .kw-post-excerpt", TEXT),
    price: part("Prix", ".kw-course-price", TEXT),
    button: part("Bouton", ".kw-course-card .kw-button", { ...TEXT_BG, size: ["width"] }, ["hover", "focus"]),
  },
  testimonial: {
    stars: part("Étoiles", ".kw-stars", { typography: ["fontSize", "letterSpacing"], color: ["color"], spacing: spacingAll }),
    quote: part("Citation", ".kw-testimonial-text", TEXT),
    author: part("Auteur", ".kw-testimonial-who strong", TEXT),
    role: part("Fonction", ".kw-testimonial-role", TEXT),
    avatar: part("Photo", ".kw-avatar", { size: ["width", "height"], border: true, effects: ["opacity", "boxShadow"] }),
  },
  pricing: {
    badge: part("Étiquette", ".kw-pricing-badge", TEXT_BG),
    title: part("Nom de l'offre", ".kw-pricing-title", TEXT),
    price: part("Prix", ".kw-pricing-price", TEXT),
    description: part("Description", ".kw-pricing-desc", TEXT),
    features: part("Liste des avantages", ".kw-pricing-features", TEXT),
    button: part("Bouton", ".kw-pricing-cta", { ...TEXT_BG, size: ["width"] }, ["hover", "focus"]),
  },
  accordion: {
    item: part("Question + réponse", ".lp-faq-item", BOX),
    question: part("Question", ".lp-faq-item summary", { ...TEXT_BG }, ["hover", "focus"]),
    answer: part("Réponse", ".lp-faq-answer", { ...TEXT, background: true, border: true }),
  },
  toggle: {
    title: part("Titre", ".kw-toggle-title", TEXT_BG, ["hover", "focus"]),
    body: part("Contenu", ".kw-toggle-body", { ...TEXT, background: true }),
  },
  alert: {
    icon: part("Icône", ".kw-alert-icon", { color: ["color"], spacing: spacingAll }),
    title: part("Titre", ".kw-alert-title", TEXT),
    body: part("Texte", ".kw-alert-body", TEXT),
  },
  timeline: {
    item: part("Étape", ".kw-tl-item", { ...BOX, border: true }),
    date: part("Date", ".kw-tl-date", TEXT),
    title: part("Titre", ".kw-tl-title", TEXT),
    text: part("Texte", ".kw-tl-text", TEXT),
  },
  pricelist: {
    item: part("Ligne", ".kw-pl-item", BOX),
    title: part("Intitulé", ".kw-pl-title", TEXT, ["hover"]),
    price: part("Prix", ".kw-pl-price", TEXT),
    text: part("Description", ".kw-pl-text", TEXT),
  },
  counter: {
    number: part("Nombre", ".kw-counter-num", TEXT),
    label: part("Libellé", ".kw-counter-label", TEXT),
  },
  progress: {
    head: part("Libellé et valeur", ".kw-progress-head", TEXT),
    track: part("Piste", ".kw-progress-track", { background: true, border: true, size: ["height"] }),
    bar: part("Barre", ".kw-progress-bar", { background: true, border: true }),
  },
  flipbox: {
    front: part("Face avant", ".kw-flip-front", { ...BOX, color: ["color"] }),
    back: part("Face arrière", ".kw-flip-back", { ...BOX, color: ["color"] }),
    title: part("Titres", ".kw-flip-title", TEXT),
    text: part("Textes", ".kw-flip-text", TEXT),
  },
  gallery: {
    item: part("Vignette", ".kw-gallery-item", { ...BOX }),
    image: part("Image", ".kw-gallery-item img", IMAGE, ["hover"]),
    caption: part("Légende", ".kw-gallery-item figcaption", TEXT),
  },
  iconbox: {
    media: part("Icône", ".kw-box-media", { color: ["color"], size: ["width", "height"], spacing: spacingAll, background: true, border: true }),
    title: part("Titre", ".kw-box-title", TEXT),
    text: part("Texte", ".kw-box-text", TEXT),
  },
  imagebox: {
    media: part("Image", ".kw-box-media", IMAGE, ["hover"]),
    title: part("Titre", ".kw-box-title", TEXT, ["hover"]),
    text: part("Texte", ".kw-box-text", TEXT),
  },
  signupform: {
    title: part("Titre", ".kw-signup-title", TEXT),
    intro: part("Introduction", ".kw-signup-intro", TEXT),
    button: part("Bouton d'envoi", ".kw-signup-submit", { ...TEXT_BG, size: ["width"] }, ["hover", "focus"]),
  },
};

// Une propriété est-elle permise pour cette partie ? groupOf : clé → groupe (STYLE_PROPS et propriétés composées)
function allows(def, key, groupOf) {
  const g = groupOf(key);
  const spec = g && def.groups[g];
  return spec === true || (Array.isArray(spec) && spec.includes(key));
}
// Description envoyée à l'éditeur (sans le sélecteur CSS : il reste côté serveur)
function spec(type) {
  const defs = PARTS[type];
  return defs ? Object.entries(defs).map(([key, d]) => ({ key, label: d.label, groups: d.groups, states: d.states })) : null;
}

module.exports = { PARTS, allows, spec };
