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

const LINK = { typography: true, color: ["color"], background: true, border: true, spacing: spacingAll, effects: ["opacity", "boxShadow", "shadow", "transitionDuration"] };
const DOT = { background: true, size: ["width", "height"], border: true, spacing: spacingAll, effects: ["opacity", "boxShadow", "transitionDuration"] };
const ICON = { color: ["color"], size: ["width", "height"], typography: ["fontSize"], spacing: spacingAll };
const ARROW = { ...LINK, size: ["width", "height"] };

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

  // ---- Deuxième vague : navigation, interactions, carrousels, widgets du site et du CMS ----
  tabs: {
    list: part("Barre d'onglets", ".kw-tab-list", { ...LAYOUT, background: true, border: true }),
    tab: part("Onglet", ".kw-tab-btn", LINK, ["hover", "focus"]),
    panel: part("Contenu d'un onglet", ".kw-tab-panel", { ...BOX, typography: true, color: ["color"] }),
  },
  menu: {
    list: part("Liste", ".kw-menu-list", { ...LAYOUT, background: true, border: true }),
    link: part("Lien", ".kw-menu-link", LINK, ["hover", "focus"]),
    burger: part("Bouton mobile", ".kw-menu-burger", ARROW, ["hover", "focus"]),
  },
  carousel: {
    slide: part("Diapositive", ".kw-carousel-slide", { ...BOX }),
    image: part("Image", ".kw-carousel-slide img", IMAGE),
    arrows: part("Flèches", ".kw-carousel-btn", ARROW, ["hover", "focus"]),
    dots: part("Points", ".kw-carousel-dot", DOT, ["hover"]),
  },
  slides: {
    image: part("Image", ".kw-slide-img", IMAGE),
    veil: part("Voile", ".kw-slide-veil", { background: true }),
    body: part("Bloc de texte", ".kw-slide-body", { ...LAYOUT, background: true }),
    title: part("Titre", ".kw-slide-title", TEXT),
    text: part("Texte", ".kw-slide-text", TEXT),
    button: part("Bouton", ".kw-slide-body .kw-button", LINK, ["hover", "focus"]),
    arrows: part("Flèches", ".kw-carousel-btn", ARROW, ["hover", "focus"]),
    dots: part("Points", ".kw-carousel-dot", DOT, ["hover"]),
  },
  testimonialcarousel: {
    slide: part("Diapositive", ".kw-tcar-slide", { ...BOX }),
    stars: part("Étoiles", ".kw-tcar-stars", { typography: ["fontSize", "letterSpacing"], color: ["color"], spacing: spacingAll }),
    quote: part("Citation", ".kw-tcar-quote", TEXT),
    name: part("Nom", ".kw-tcar-name", TEXT),
    role: part("Fonction", ".kw-tcar-role", TEXT),
    photo: part("Photo", ".kw-tcar-photo", { size: ["width", "height"], border: true, effects: ["opacity", "boxShadow"] }),
    arrows: part("Flèches", ".kw-carousel-btn", ARROW, ["hover", "focus"]),
    dots: part("Points", ".kw-carousel-dot", DOT, ["hover"]),
  },
  mediacarousel: {
    image: part("Image", ".kw-mcar-img", IMAGE),
    caption: part("Légende", ".kw-mcar-slide figcaption", TEXT),
    arrows: part("Flèches", ".kw-carousel-btn", ARROW, ["hover", "focus"]),
    dots: part("Points", ".kw-carousel-dot", DOT, ["hover"]),
  },
  social: { link: part("Icône", ".kw-social-link", { ...LINK, size: ["width", "height"] }, ["hover", "focus"]) },
  sharebuttons: { link: part("Bouton", ".kw-social-link", { ...LINK, size: ["width", "height"] }, ["hover", "focus"]) },
  iconlist: {
    icon: part("Icône", ".kw-iconlist-icon", ICON),
    item: part("Ligne", "li", { ...TEXT, border: true }),
    link: part("Lien", "li a", { typography: true, color: ["color"] }, ["hover", "focus"]),
  },
  modal: {
    open: part("Bouton d'ouverture", ".kw-modal-open", LINK, ["hover", "focus"]),
    head: part("En-tête", ".kw-modal-head", { ...TEXT, background: true, border: true }),
    title: part("Titre", ".kw-modal-title", TEXT),
    body: part("Contenu", ".kw-modal-body", { ...TEXT, background: true }),
    foot: part("Pied", ".kw-modal-foot", { ...TEXT, background: true, border: true }),
    close: part("Bouton fermer", ".kw-modal-close", ARROW, ["hover", "focus"]),
  },
  tooltip: {
    trigger: part("Déclencheur", ".kw-tip-trigger", LINK, ["hover", "focus"]),
    bubble: part("Infobulle", ".kw-tip-bubble", { ...TEXT, background: true, border: true, effects: ["boxShadow", "shadow", "opacity"] }),
  },
  hotspot: {
    dot: part("Point", ".kw-spot-dot", DOT, ["hover"]),
    card: part("Carte", ".kw-spot-card", { ...TEXT, background: true, border: true, effects: ["boxShadow", "shadow"] }),
  },
  account: {
    link: part("Lien du compte", ".kw-account-link", LINK, ["hover", "focus"]),
    cart: part("Lien du panier", ".kw-account-cart", LINK, ["hover", "focus"]),
    count: part("Pastille du panier", ".kw-cart-count", { ...TEXT, background: true, border: true }),
  },
  countdown: {
    unit: part("Bloc de temps", ".kw-countdown-unit", { ...BOX, typography: true, color: ["color"] }),
  },
  rating: {
    title: part("Titre", ".kw-rating-title", TEXT),
    stars: part("Étoiles", ".kw-rating-stars", { typography: ["fontSize", "letterSpacing"], spacing: spacingAll }),
    off: part("Étoiles vides", ".kw-rating-bg", { color: ["color"] }),
    fill: part("Étoiles pleines", ".kw-rating-fill", { color: ["color"] }),
    value: part("Valeur", ".kw-rating-value", TEXT),
  },
  toc: {
    title: part("Titre", ".kw-toc-title", TEXT),
    list: part("Liste", ".kw-toc-list", { ...LAYOUT, typography: true, color: ["color"] }),
    link: part("Lien", ".kw-toc-list a", { typography: true, color: ["color"] }, ["hover", "focus"]),
  },
  readingprogress: {
    bar: part("Barre", ".kw-readbar", { background: true, size: ["height"] }),
    fill: part("Remplissage", ".kw-readbar-fill", { background: true }),
  },
  sitelogo: {
    image: part("Image", ".kw-sitelogo-img", { size: ["width", "height", "maxHeight"], media: true, effects: ["opacity", "filter"] }),
    text: part("Texte", ".kw-sitelogo-text", TEXT),
  },
  cart: {
    title: part("Titre", ".kw-cart-title", TEXT),
    empty: part("Panier vide", ".kw-cart-empty", TEXT),
    line: part("Ligne", ".kw-cart-line", { ...BOX }),
    image: part("Image", ".kw-cart-img", IMAGE),
    name: part("Nom", ".kw-cart-name", TEXT, ["hover"]),
    price: part("Prix", ".kw-cart-price", TEXT),
    total: part("Total", ".kw-cart-total", { ...TEXT, border: true }),
    button: part("Bouton de commande", ".kw-cart-actions .kw-button", LINK, ["hover", "focus"]),
    edit: part("Lien « modifier »", ".kw-cart-edit", { typography: true, color: ["color"] }, ["hover"]),
  },
  minicart: {
    icon: part("Icône", ".kw-mc-icon", ICON),
    label: part("Libellé", ".kw-mc-label", TEXT),
    count: part("Pastille", ".kw-mc-count", { ...TEXT, background: true, border: true }),
  },
  linkinbio: {
    avatar: part("Photo", ".kw-lib-avatar", { size: ["width", "height"], border: true, effects: ["opacity", "boxShadow"] }),
    name: part("Nom", ".kw-lib-name", TEXT),
    bio: part("Texte", ".kw-lib-bio", TEXT),
    link: part("Lien", ".kw-lib-link", LINK, ["hover", "focus"]),
    icon: part("Icône du lien", ".kw-lib-icon", ICON),
  },
  profilecard: {
    photo: part("Photo", ".kw-profile-photo", { size: ["width", "height"], border: true, effects: ["opacity", "boxShadow"] }),
    name: part("Nom", ".kw-profile-name", TEXT),
    role: part("Fonction", ".kw-profile-role", TEXT),
    bio: part("Texte", ".kw-profile-bio", TEXT),
  },
  cta: {
    image: part("Image", ".kw-cta-img", IMAGE, ["hover"]),
    body: part("Contenu", ".kw-cta-body", { ...LAYOUT, background: true }),
    title: part("Titre", ".kw-cta-title", TEXT),
    text: part("Description", ".kw-cta-text", TEXT),
    button: part("Bouton", ".kw-cta-button", LINK, ["hover", "focus"]),
    ribbon: part("Bandeau", ".kw-cta-ribbon", TEXT_BG),
  },
  videoplaylist: {
    stage: part("Lecteur", ".kw-vp-stage", { border: true, effects: ["boxShadow", "opacity"], size: ["width", "maxWidth", "height"] }),
    title: part("Nom de la playlist", ".kw-vp-title", TEXT),
    item: part("Vidéo de la liste", ".kw-vp-item", LINK, ["hover", "focus"]),
  },
  stripebutton: {
    button: part("Bouton", ".kw-pay-btn", { typography: true, color: ["color"], background: true, border: true, effects: ["boxShadow", "opacity", "transitionDuration"], spacing: spacingAll }, ["hover", "focus"]),
    note: part("Mention", ".kw-pay-note", TEXT),
  },
  paypalbutton: {
    button: part("Bouton", ".kw-pay-btn", { typography: true, color: ["color"], background: true, border: true, effects: ["boxShadow", "opacity", "transitionDuration"], spacing: spacingAll }, ["hover", "focus"]),
    note: part("Mention", ".kw-pay-note", TEXT),
  },
  floatingbutton: {
    button: part("Bouton", ".kw-fb-btn", { background: true, border: true, effects: ["boxShadow", "opacity", "transitionDuration"], spacing: spacingAll }, ["hover", "focus"]),
  },
  readmore: {
    intro: part("Début du texte", ".kw-readmore-intro", TEXT),
    body: part("Suite du texte", ".kw-readmore-body", TEXT),
    toggle: part("Lien « lire la suite »", ".kw-readmore-toggle", LINK, ["hover", "focus"]),
  },
  querylist: {
    item: part("Élément", ".kw-ql-item", { ...BOX }),
    thumb: part("Image", ".kw-ql-thumb", IMAGE),
    title: part("Titre de la liste", ".kw-ql-title", TEXT),
    link: part("Titre d'un élément", ".kw-ql-link", { typography: true, color: ["color"], spacing: spacingAll }, ["hover", "focus"]),
    meta: part("Informations", ".kw-ql-meta", TEXT),
    date: part("Date", ".kw-ql-date", TEXT),
    excerpt: part("Extrait", ".kw-ql-excerpt", TEXT),
    count: part("Compteur", ".kw-ql-count", TEXT),
  },
  postmeta: { item: part("Information", ".kw-pm-item", TEXT) },
  postterms: {
    label: part("Libellé", ".kw-pt-label", TEXT),
    term: part("Catégorie / étiquette", ".kw-pt-term", LINK, ["hover", "focus"]),
  },
  postnav: {
    link: part("Lien", ".kw-pn-link", { ...BOX, typography: true, color: ["color"] }, ["hover", "focus"]),
    dir: part("Sens (précédent / suivant)", ".kw-pn-dir", TEXT),
    title: part("Titre", ".kw-pn-title", TEXT),
    image: part("Image", ".kw-pn-link img", IMAGE),
  },
  authorbox: {
    heading: part("Titre", ".kw-ab-heading", TEXT),
    avatar: part("Photo", ".kw-ab-avatar", { size: ["width", "height"], border: true, effects: ["opacity", "boxShadow"] }),
    name: part("Nom", ".kw-ab-name", TEXT),
    bio: part("Texte", ".kw-ab-bio", TEXT),
    link: part("Lien", ".kw-ab-link", { typography: true, color: ["color"] }, ["hover", "focus"]),
  },
  archiveinfo: {
    title: part("Titre", ".kw-ai-title", TEXT),
    desc: part("Description", ".kw-ai-desc", TEXT),
    count: part("Nombre de résultats", ".kw-ai-count", TEXT),
  },
  postcomments: {
    heading: part("Titre", ".kw-pc-heading", TEXT),
    item: part("Commentaire", ".kw-pc-item", { ...BOX }),
    avatar: part("Avatar", ".kw-pc-avatar", { size: ["width", "height"], border: true, effects: ["opacity"] }),
    meta: part("Auteur et date", ".kw-pc-meta", TEXT),
    body: part("Texte", ".kw-pc-body", TEXT),
  },
  cmsmenu: {
    list: part("Liste", ".kw-menu-list", { ...LAYOUT, background: true, border: true }),
    link: part("Lien", ".kw-menu-link", LINK, ["hover", "focus"]),
  },

  // Widgets « élément » dont la racine contient des sous-éléments propres (étape 2 : couverture des 42 types restants, voir KOLAKISA_WIDGET_COVERAGE.md)
  list: { item: part("Élément de la liste", "li", { ...TEXT, background: true, border: true }) },
  quote: {
    text: part("Texte de la citation", "p", TEXT),
    author: part("Auteur", "footer", TEXT),
  },
  code: { numbers: part("Numéros de ligne", ".kw-code-nums", TEXT) },
  audio: {
    caption: part("Légende", "figcaption", TEXT),
    player: part("Lecteur", "audio", { size: ["width", "maxWidth"], border: true, effects: ["opacity", "boxShadow"], spacing: spacingAll }),
  },
  video: {
    frame: part("Cadre du lecteur", ".lp-video-frame", { border: true, effects: ["opacity", "boxShadow", "filter"], size: ["width", "maxWidth"] }),
    file: part("Vidéo (fichier)", "video", { border: true, effects: ["opacity", "boxShadow", "filter"], media: true, size: ["width", "maxWidth"] }),
  },
  table: {
    caption: part("Légende", "caption", TEXT),
    head: part("Cellules d'en-tête", "th", TEXT_BG),
    cell: part("Cellules", "td", TEXT_BG),
    row: part("Lignes du corps", "tbody tr", { background: true, border: true }, ["hover"]),
    footer: part("Cellules du pied", "tfoot td", TEXT_BG),
  },
  search: {
    field: part("Champ", "input", { ...TEXT_BG, size: ["width", "height"], effects: ["boxShadow", "opacity", "transitionDuration"] }, ["hover", "focus"]),
    button: part("Bouton", ".kw-button", { ...TEXT_BG, size: ["width", "height"] }, ["hover", "focus"]),
  },
  breadcrumb: {
    list: part("Liste", ".kw-crumbs", { ...LAYOUT, typography: true }),
    link: part("Liens", ".kw-crumbs a", LINK, ["hover", "focus"]),
    current: part("Page courante", ".kw-crumbs [aria-current=\"page\"]", TEXT),
  },
  catfilter: {
    list: part("Liste", "ul", LAYOUT),
    link: part("Catégories", "a", LINK, ["hover", "focus"]),
    active: part("Catégorie active", "a[aria-current=\"true\"]", LINK, ["hover", "focus"]),
    count: part("Compteur", ".kw-catfilter-n", TEXT),
  },
  course: {
    image: part("Image", "img", IMAGE),
    body: part("Contenu", ".lp-course-body", { ...LAYOUT, background: true }),
    title: part("Titre", "h3", TEXT),
    subtitle: part("Sous-titre", ".lp-course-body p:not(.lp-price)", TEXT),
    price: part("Prix", ".lp-price", TEXT),
    button: part("Bouton", ".lp-btn", { ...TEXT_BG, size: ["width"] }, ["hover", "focus"]),
  },
  addtocart: {
    price: part("Prix", ".kw-buy-price", TEXT),
    button: part("Bouton", ".kw-button", { ...TEXT_BG, size: ["width"] }, ["hover", "focus"]),
  },
  courserating: {
    stars: part("Étoiles", ".kw-stars", { typography: ["fontSize", "letterSpacing"], color: ["color"], spacing: spacingAll }),
    score: part("Note", "strong", TEXT),
    count: part("Nombre d'avis", ".kw-courserating-count", TEXT),
  },
  animatedheading: { word: part("Mot animé", ".kw-rotate", TEXT_BG) },
  sitemap: {
    group: part("Groupe", ".kw-sitemap-group", BOX),
    title: part("Titre du groupe", ".kw-sitemap-title", TEXT),
    list: part("Liste de liens", ".kw-sitemap-list", LAYOUT),
    link: part("Lien", ".kw-sitemap-link", LINK, ["hover", "focus"]),
  },
  facebookembed: { frame: part("Cadre", ".kw-fbe-frame", { border: true, effects: ["opacity", "boxShadow"], size: ["width", "maxWidth", "height"] }) },
  facebookbutton: { frame: part("Bouton", ".kw-fbbtn-frame", { border: true, effects: ["opacity", "boxShadow"], size: ["width", "maxWidth"] }) },
  lottie: { stage: part("Animation", ".kw-lottie-stage", { size: ["width", "maxWidth", "height"], border: true, effects: ["opacity", "boxShadow"] }) },
  map: { frame: part("Carte", ".kw-map-frame", { border: true, effects: ["opacity", "boxShadow", "filter"], size: ["width", "maxWidth", "height", "minHeight"] }) },
  embed: { frame: part("Contenu intégré", ".kw-embed-frame", { border: true, effects: ["opacity", "boxShadow"], size: ["width", "maxWidth"] }) },
  button: { icon: part("Icône", ".kw-btn-icon", ICON) },
  image: {
    picture: part("Image", "img", IMAGE, ["hover"]),
    caption: part("Légende", "figcaption", TEXT),
  },
  smartlink: { button: part("Bouton", ".kw-button", { ...TEXT_BG, size: ["width"] }, ["hover", "focus"]) },
  sitetitle: { link: part("Lien", ".kw-sitetitle-link", LINK, ["hover", "focus"]) },
  // Widgets arrivés sur main après la branche des parties : boutique par site et comparateur / défilement
  beforeafter: {
    stage: part("Zone de comparaison", ".kw-compare-stage", { border: true, effects: ["opacity", "boxShadow"], size: ["width", "maxWidth", "height"] }),
    before: part("Image « avant »", ".kw-compare-before", IMAGE),
    after: part("Image « après »", ".kw-compare-after", IMAGE),
    tag: part("Étiquettes", ".kw-compare-tag", TEXT_BG),
    bar: part("Barre de séparation", ".kw-compare-bar", { background: true, size: ["width"], effects: ["opacity", "boxShadow"] }),
    knob: part("Poignée", ".kw-compare-knob", DOT),
  },
  marquee: {
    item: part("Élément", ".kw-marquee-item", TEXT_BG),
    sep: part("Séparateur", ".kw-marquee-sep", TEXT),
    pause: part("Bouton pause", ".kw-marquee-pause", LINK, ["hover", "focus"]),
  },
  shopgrid: {
    card: part("Carte produit", ".kw-pg-card", BOX, ["hover"]),
    image: part("Image", ".kw-pg-img", IMAGE, ["hover"]),
    name: part("Nom", ".kw-pg-name", TEXT, ["hover"]),
    price: part("Prix", ".kw-pg-price", TEXT),
    old: part("Ancien prix", ".kw-pg-old", TEXT),
    out: part("Mention « épuisé »", ".kw-pg-out", TEXT_BG),
    badge: part("Pastille promo / rupture", ".kw-pg-badge", TEXT_BG),
    category: part("Catégorie", ".kw-pg-cat", TEXT),
    description: part("Description courte", ".kw-pg-desc", TEXT),
    cart: part("Bouton d'ajout au panier", ".kw-pg-cart", { ...TEXT_BG, size: ["width"] }, ["hover", "focus"]),
    pager: part("Pagination", ".kw-pg-pg", { ...TEXT_BG, border: true }, ["hover", "focus"]),
  },
  shopbuy: {
    price: part("Prix", ".kw-pb-price", TEXT),
    old: part("Ancien prix", ".kw-pg-old", TEXT),
    label: part("Libellés", ".kw-pb-lbl", TEXT),
    variant: part("Choix de variante", ".kw-pb-var", { ...TEXT_BG, size: ["width"] }, ["hover", "focus"]),
    qty: part("Quantité", ".kw-pb-qty", { ...TEXT_BG, size: ["width"] }, ["hover", "focus"]),
    button: part("Bouton", ".kw-pb-btn", { ...TEXT_BG, size: ["width"] }, ["hover", "focus"]),
    stock: part("Stock", ".kw-pb-stock", TEXT),
    message: part("Message", ".kw-pb-msg", TEXT),
  },
  shopcart: {
    cart: part("Panier", ".kw-sc-cart", LINK, ["hover", "focus"]),
    badge: part("Pastille", ".kw-sc-badge", { ...TEXT, background: true, border: true }),
    account: part("Compte", ".kw-sc-account", LINK, ["hover", "focus"]),
    checkout: part("Bouton de commande", ".kw-sc-checkout", { ...TEXT_BG, size: ["width"] }, ["hover", "focus"]),
    message: part("Message", ".kw-sc-msg", TEXT),
  },
  shopsearch: {
    label: part("Libellé", ".kw-ss-lbl", TEXT),
    input: part("Champ", ".kw-ss-input", { ...TEXT_BG, size: ["width", "height"] }, ["hover", "focus"]),
    button: part("Bouton", ".kw-pb-btn", { ...TEXT_BG, size: ["width", "height"] }, ["hover", "focus"]),
    message: part("Message", ".kw-ss-msg", TEXT),
  },
  shopfilters: {
    label: part("Libellés", ".kw-sf-lbl", TEXT),
    field: part("Champs", ".kw-sf-f", { ...TEXT_BG, size: ["width"] }, ["hover", "focus"]),
    choice: part("Choix", ".kw-sf-c", TEXT),
    button: part("Bouton", ".kw-pb-btn", { ...TEXT_BG, size: ["width"] }, ["hover", "focus"]),
    message: part("Message", ".kw-sf-msg", TEXT),
  },
  postcontent: {
    h2: part("Intertitres (H2)", "h2", TEXT),
    h3: part("Intertitres (H3)", "h3", TEXT),
    paragraph: part("Paragraphes", "p", TEXT),
    link: part("Liens", "a", LINK, ["hover", "focus"]),
    image: part("Images", "img", IMAGE),
    quote: part("Citations", "blockquote", TEXT_BG),
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

// Contrôle de compatibilité d'un document ENREGISTRÉ (sections déjà normalisées ou brutes) : réglages de parties que la partie n'accepte pas.
// Lecture seule ; sert au script de contrôle des données existantes et aux tests.
function scan(sections, groupOf) {
  const out = [];
  const visit = (list) => {
    for (const n of list || []) {
      if (!n || typeof n !== "object") continue;
      const defs = PARTS[n.type];
      if (defs && n.parts && typeof n.parts === "object") {
        for (const [key, val] of Object.entries(n.parts)) {
          const def = defs[key];
          if (!def) { out.push({ id: n.id, type: n.type, part: key, problem: "partie inconnue" }); continue; }
          for (const [scope, set] of [...Object.entries((val && val.styles) || {}), ...Object.entries((val && val.states) || {})]) {
            if ((val.states || {})[scope] && !def.states.includes(scope)) out.push({ id: n.id, type: n.type, part: key, problem: `état « ${scope} » non proposé` });
            for (const k of Object.keys(set || {})) if (!allows(def, k, groupOf)) out.push({ id: n.id, type: n.type, part: key, prop: k, scope, problem: "réglage non proposé pour cette partie" });
          }
        }
      }
      visit(n.children);
    }
  };
  visit(sections);
  return out;
}

// Widgets volontairement SANS parties : leur racine EST l'unique élément visible (ou leurs enfants sont de vrais nœuds stylables), donc le style de la racine
// couvre tout. Chaque entrée est justifiée ; un nouveau widget doit déclarer des parties OU figurer ici (test de couverture : widgets-parts-couverture.test.js).
const ROOT_ONLY = {
  sidebar: "la racine est l'enveloppe de la zone : les blocs affichés gardent leurs propres styles (widgets.css), réglés dans Apparence → Widgets",
  container: "conteneur : ses enfants sont de vrais nœuds", columns: "conteneur : enfants = nœuds", column: "conteneur : enfants = nœuds", grid: "conteneur : enfants = nœuds",
  stack: "conteneur : enfants = nœuds", group: "conteneur : enfants = nœuds",
  spacer: "élément vide : la racine est l'espace", divider: "la racine est le trait (couleur, épaisseur, style par la racine)",
  heading: "la racine est le titre", text: "la racine est le paragraphe (ses balises internes héritent de la typographie)", badge: "la racine est l'étiquette",
  link: "la racine est le lien", html: "contenu libre signé : pas de structure connue", dyntext: "la racine est le texte dynamique", copyright: "la racine est le paragraphe",
  icon: "la racine est l'icône", menuanchor: "ancre invisible : aucun rendu public", textpath: "texte sur un tracé SVG : propriétés CSS de boîte sans effet sur les sous-éléments SVG",
};

module.exports = { PARTS, ROOT_ONLY, allows, spec, scan };
