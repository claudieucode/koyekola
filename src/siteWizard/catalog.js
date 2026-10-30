// Assistant de création de site (programme 20.6) — CATALOGUES purs (aucune base, aucune requête) : catégories de sites, pays/langues/devises, fonctionnalités, étapes.
// Rien n'est inventé : une page ou une fonctionnalité n'est proposée que si elle existe réellement dans Kolakisa (gabarits de pages/templates.js, packs de templateLibrary, modules de siteModules).
// Les pays, langues et devises sont des TABLES : en ajouter un se fait ici seulement. Aucune affirmation de conformité fiscale ou juridique n'est faite.

// Icônes : tracés 24×24 (trait), un seul style pour tout l'assistant
const ICONS = Object.freeze({
  briefcase: "M3 7h18v13H3z M9 7V4h6v3", image: "M3 4h18v16H3z M3 16l5-5 4 4 3-3 6 6", pen: "M4 20l4-1 11-11-3-3L5 16z",
  book: "M4 5h6a2 2 0 012 2v12a2 2 0 00-2-2H4z M20 5h-6a2 2 0 00-2 2v12a2 2 0 012-2h6z", cart: "M3 4h2l2 11h11l2-8H6 M9 20h.01 M17 20h.01",
  fork: "M7 3v8 M4 3v5a3 3 0 006 0V3 M17 3c-2 2-2 6 0 8v10", bed: "M3 18V6 M3 14h18v4 M21 14v-2a3 3 0 00-3-3h-7v5",
  home: "M3 11l9-8 9 8 M5 10v10h14V10", heart: "M12 20s-8-5-8-11a4.5 4.5 0 018-2 4.5 4.5 0 018 2c0 6-8 11-8 11z",
  calendar: "M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4", users: "M9 11a3 3 0 100-6 3 3 0 000 6z M3 20a6 6 0 0112 0 M17 11a3 3 0 000-6 M21 20a6 6 0 00-4-5.6",
  globe: "M12 3a9 9 0 100 18 9 9 0 000-18z M3 12h18 M12 3c3 3 3 15 0 18 M12 3c-3 3-3 15 0 18", grad: "M2 9l10-5 10 5-10 5z M6 11v5c3 2 9 2 12 0v-5",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8z M4 21a8 8 0 0116 0", layers: "M12 3l9 5-9 5-9-5z M3 13l9 5 9-5", grid: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
  spark: "M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z", news: "M4 5h13v14H4z M17 9h3v8a2 2 0 01-2 2 M7 9h7 M7 13h7",
});

// Pages proposées : { key, name, template } — `template` est une clé de gabarit de pages/templates.js, ou null (page vierge). `home` : page d'accueil par défaut.
const P = {
  accueil: (t) => ({ key: "accueil", name: "Accueil", template: t, home: true }),
  apropos: { key: "a-propos", name: "À propos", template: "apropos" },
  contact: { key: "contact", name: "Contact", template: "contact" },
  services: { key: "services", name: "Services", template: "service" },
  realisations: { key: "realisations", name: "Réalisations", template: "portfolio" },
  blog: { key: "blog", name: "Blog", template: null, note: "Page d'introduction ; les articles se gèrent dans Articles." },
  tarifs: { key: "tarifs", name: "Tarifs", template: "tarifs" },
  faq: { key: "faq", name: "Questions fréquentes", template: "faq" },
  temoignages: { key: "temoignages", name: "Témoignages", template: "temoignages" },
};

// Catégories. `siteType` : valeur de pages.SITE_TYPES. `pack` : pack de templateLibrary conseillé (ou null). `modules` : fonctionnalités recommandées (clés de FEATURES).
const CATEGORIES = Object.freeze([
  { key: "vitrine", name: "Site vitrine", icon: "home", siteType: "vitrine", description: "Présenter une activité, ses services et ses coordonnées.", pack: "service-professionnel", pages: [P.accueil("entreprise"), P.apropos, P.services, P.realisations, P.blog, P.contact], modules: ["forms", "seo", "blog"] },
  { key: "entreprise", name: "Site d'entreprise", icon: "briefcase", siteType: "vitrine", description: "Une présence institutionnelle : offre, équipe, actualités, contact.", pack: "entreprise", pages: [P.accueil("entreprise"), P.services, P.apropos, P.blog, P.contact], modules: ["forms", "seo", "blog"] },
  { key: "portfolio", name: "Portfolio", icon: "image", siteType: "vitrine", description: "Montrer ses réalisations et se faire contacter.", pack: "service-professionnel", pages: [P.accueil("portfolio"), P.realisations, P.apropos, P.temoignages, P.contact], modules: ["forms", "seo", "media"] },
  { key: "agence", name: "Agence créative", icon: "spark", siteType: "vitrine", description: "Services, études de cas et équipe d'une agence.", pack: "service-professionnel", pages: [P.accueil("service"), P.services, P.realisations, P.temoignages, P.apropos, P.contact], modules: ["forms", "seo", "media"] },
  { key: "personnel", name: "Site personnel", icon: "user", siteType: "autre", description: "Se présenter, partager son parcours et ses projets.", pack: null, pages: [P.accueil("apropos"), P.realisations, P.blog, P.contact], modules: ["forms", "blog"] },
  { key: "blog", name: "Blog", icon: "pen", siteType: "blog", description: "Publier des articles régulièrement.", pack: null, pages: [P.accueil(null), P.blog, P.apropos, P.contact], modules: ["blog", "seo", "newsletter", "forms"] },
  { key: "magazine", name: "Magazine en ligne", icon: "news", siteType: "blog", description: "Un média : rubriques, articles, lettre d'information.", pack: null, pages: [P.accueil(null), P.blog, P.apropos, P.contact], modules: ["blog", "seo", "newsletter"] },
  { key: "education", name: "Site éducatif", icon: "grad", siteType: "formation", description: "Présenter des enseignements, des enseignants et des inscriptions.", pack: "formation-en-ligne", pages: [P.accueil("formation"), { key: "formations", name: "Formations", template: "formation" }, { key: "enseignants", name: "Enseignants", template: "apropos" }, P.blog, P.contact], modules: ["forms", "seo", "blog", "lms", "users"] },
  { key: "formation", name: "Plateforme de formation", icon: "book", siteType: "formation", description: "Vendre et diffuser des formations en ligne.", pack: "formation-en-ligne", pages: [P.accueil("vente"), { key: "programme", name: "Programme", template: "formation" }, P.tarifs, P.faq, P.apropos, P.contact], modules: ["lms", "commerce", "forms", "seo", "users"] },
  { key: "boutique", name: "Boutique en ligne", icon: "cart", siteType: "boutique", shop: true, description: "Vendre en ligne. Aujourd'hui : vente de formations par carte ; le panier de produits n'existe pas encore.", pack: null, pages: [P.accueil("produit"), { key: "catalogue", name: "Catalogue", template: "formation" }, P.faq, P.contact], modules: ["commerce", "forms", "seo"] },
  { key: "restaurant", name: "Restaurant", icon: "fork", siteType: "vitrine", description: "Carte, horaires, adresse et contact.", pack: null, pages: [P.accueil("service"), { key: "carte", name: "Carte", template: "service" }, P.apropos, P.contact], modules: ["forms", "seo"], gaps: ["Réservation en ligne"] },
  { key: "hotel", name: "Hôtel et hébergement", icon: "bed", siteType: "vitrine", description: "Présenter les chambres, les services et le lieu.", pack: null, pages: [P.accueil("service"), { key: "chambres", name: "Chambres", template: "service" }, P.apropos, P.contact], modules: ["forms", "seo"], gaps: ["Réservation en ligne"] },
  { key: "immobilier", name: "Immobilier", icon: "grid", siteType: "vitrine", description: "Présenter l'agence, ses biens et ses contacts.", pack: null, pages: [P.accueil("service"), { key: "biens", name: "Nos biens", template: "portfolio" }, P.apropos, P.contact], modules: ["forms", "seo"], gaps: ["Fiches de biens dynamiques"] },
  { key: "association", name: "Association", icon: "heart", siteType: "vitrine", description: "Missions, actions, actualités et adhésion.", pack: "entreprise", pages: [P.accueil("entreprise"), { key: "missions", name: "Nos missions", template: "apropos" }, P.blog, { key: "adherer", name: "Nous rejoindre", template: "inscription" }, P.contact], modules: ["forms", "blog", "newsletter"] },
  { key: "organisation", name: "Organisation", icon: "users", siteType: "vitrine", description: "Institution, collectif ou réseau.", pack: "entreprise", pages: [P.accueil("entreprise"), P.apropos, P.blog, P.contact], modules: ["forms", "seo", "blog"] },
  { key: "evenement", name: "Site événementiel", icon: "calendar", siteType: "vitrine", description: "Un événement : programme, inscription, informations pratiques.", pack: "evenement", pages: [P.accueil("evenement"), { key: "inscription", name: "Inscription", template: "webinaire" }, { key: "merci", name: "Merci", template: "merci" }, P.contact], modules: ["forms", "newsletter"] },
  { key: "services", name: "Services professionnels", icon: "layers", siteType: "vitrine", description: "Indépendants, cabinets, consultants : offre, preuves, prise de contact.", pack: "service-professionnel", pages: [P.accueil("service"), P.services, P.temoignages, P.apropos, { key: "rdv", name: "Prendre rendez-vous", template: "consultation" }, P.contact], modules: ["forms", "seo"] },
  { key: "autre", name: "Autres activités", icon: "globe", siteType: "autre", description: "Un point de départ neutre à adapter.", pack: null, pages: [P.accueil(null), P.apropos, P.contact], modules: ["forms"] },
]);

// Fonctionnalités. kind : « inclus » (toujours disponible, rien à activer) · « module » (activable par site : siteModules) · « absent » (n'existe pas : jamais présentée comme disponible).
// deps : dépendances ; needs : intégration externe ou identifiants à fournir par la personne (jamais activée seule) ; permission : droit requis pour agir.
const FEATURES = Object.freeze({
  blog: { label: "Blog", kind: "inclus", use: "Articles, catégories, flux RSS.", link: "/marketing/site-web/articles", permission: "forms.read" },
  forms: { label: "Formulaires", kind: "inclus", use: "Contact, inscription, demande de devis.", link: "/marketing/formulaires", permission: "forms.write" },
  seo: { label: "SEO", kind: "inclus", use: "Titres, descriptions, sitemap, données structurées.", link: "seo", permission: "seo.edit" },
  newsletter: { label: "Newsletter", kind: "inclus", use: "Lettres d'information et séquences.", link: "/marketing/campagnes", permission: "forms.write", needs: "Un domaine d'envoi vérifié pour des envois réels." },
  media: { label: "Médias", kind: "inclus", use: "Médiathèque d'images du site.", link: "/marketing/site-web/medias", permission: "forms.write" },
  users: { label: "Utilisateurs du site", kind: "inclus", use: "Inviter des personnes limitées à ce site.", link: "utilisateurs", permission: "forms.write" },
  analytics: { label: "Statistiques", kind: "inclus", use: "Visites et audience des pages.", link: "/marketing/site-web", permission: "forms.read" },
  sms: { label: "SMS", kind: "module", module: "sms", use: "Campagnes SMS.", needs: "Un fournisseur SMS configuré avec vos identifiants.", permission: "sites.modules" },
  ai: { label: "Intelligence artificielle", kind: "module", module: "ai", use: "Aide à la rédaction.", needs: "Une clé de fournisseur d'IA fournie par vous.", permission: "sites.modules" },
  social: { label: "Réseaux sociaux", kind: "module", module: "social", use: "Publication sur vos comptes.", needs: "L'autorisation de vos comptes (OAuth).", permission: "sites.modules" },
  scoring: { label: "Score des contacts", kind: "module", module: "scoring", use: "Mesurer l'intérêt des contacts.", permission: "sites.modules" },
  commerce: { label: "Commerce (vente de formations)", kind: "module", module: "commerce", use: "Revenus, commandes et paiement par carte des formations.", needs: "Un compte de paiement (Stripe) configuré par l'équipe.", permission: "sites.modules" },
  lms: { label: "Formations en ligne", kind: "module", module: "lms", use: "Cours, leçons, apprenants (catalogue, fiches, panier de formations).", needs: "Un compte de paiement (Stripe) configuré par l'équipe pour vendre.", permission: "sites.modules" },
  reservation: { label: "Réservation", kind: "absent", use: "Prise de réservation en ligne." },
  gallery: { label: "Galerie dédiée", kind: "absent", use: "Module de galerie : utilisez la médiathèque et les widgets d'image." },
  reviews: { label: "Avis clients", kind: "absent", use: "Collecte d'avis : utilisez la page « Témoignages » (contenu saisi à la main)." },
});

// Pays : langue, fuseau (IANA), devise (ISO 4217), format régional. Ajouter un pays = ajouter une ligne. Aucune règle fiscale ici (voir `taxNote`).
const COUNTRIES = Object.freeze({
  FR: { name: "France", lang: "fr", tz: "Europe/Paris", currency: "EUR", locale: "fr-FR" }, BE: { name: "Belgique", lang: "fr", tz: "Europe/Brussels", currency: "EUR", locale: "fr-BE" },
  CH: { name: "Suisse", lang: "fr", tz: "Europe/Zurich", currency: "CHF", locale: "fr-CH" }, LU: { name: "Luxembourg", lang: "fr", tz: "Europe/Luxembourg", currency: "EUR", locale: "fr-LU" },
  CA: { name: "Canada", lang: "fr", tz: "America/Toronto", currency: "CAD", locale: "fr-CA" }, SN: { name: "Sénégal", lang: "fr", tz: "Africa/Dakar", currency: "XOF", locale: "fr-SN" },
  CI: { name: "Côte d'Ivoire", lang: "fr", tz: "Africa/Abidjan", currency: "XOF", locale: "fr-CI" }, CM: { name: "Cameroun", lang: "fr", tz: "Africa/Douala", currency: "XAF", locale: "fr-CM" },
  CD: { name: "RD Congo", lang: "fr", tz: "Africa/Kinshasa", currency: "CDF", locale: "fr-CD" }, MA: { name: "Maroc", lang: "fr", tz: "Africa/Casablanca", currency: "MAD", locale: "fr-MA" },
  DZ: { name: "Algérie", lang: "fr", tz: "Africa/Algiers", currency: "DZD", locale: "fr-DZ" }, TN: { name: "Tunisie", lang: "fr", tz: "Africa/Tunis", currency: "TND", locale: "fr-TN" },
  GB: { name: "Royaume-Uni", lang: "en", tz: "Europe/London", currency: "GBP", locale: "en-GB" }, US: { name: "États-Unis", lang: "en", tz: "America/New_York", currency: "USD", locale: "en-US" },
  DE: { name: "Allemagne", lang: "de", tz: "Europe/Berlin", currency: "EUR", locale: "de-DE" }, ES: { name: "Espagne", lang: "es", tz: "Europe/Madrid", currency: "EUR", locale: "es-ES" },
  IT: { name: "Italie", lang: "it", tz: "Europe/Rome", currency: "EUR", locale: "it-IT" }, PT: { name: "Portugal", lang: "pt", tz: "Europe/Lisbon", currency: "EUR", locale: "pt-PT" },
});
const LANGUAGES = Object.freeze({ fr: "Français", en: "English", es: "Español", de: "Deutsch", it: "Italiano", pt: "Português" });
const CURRENCIES = Object.freeze(["EUR", "CHF", "CAD", "XOF", "XAF", "CDF", "MAD", "DZD", "TND", "GBP", "USD"]);

// Styles graphiques : une ORIENTATION = une palette du moteur (stylePalettes) + deux polices du moteur (tokens.FONTS) — le système de styles existant, pas un second.
const STYLES = Object.freeze([
  { key: "minimaliste", label: "Minimaliste", palette: "ardoise", heading: "figtree", body: "figtree" }, { key: "moderne", label: "Moderne", palette: "ocean", heading: "bricolage", body: "figtree" },
  { key: "corporate", label: "Corporate", palette: "marine", heading: "figtree", body: "figtree" }, { key: "elegant", label: "Élégant", palette: "bordeaux", heading: "georgia", body: "figtree" },
  { key: "creatif", label: "Créatif", palette: "violet", heading: "bricolage", body: "system" }, { key: "editorial", label: "Éditorial", palette: "sable", heading: "georgia", body: "georgia" },
  { key: "ecommerce", label: "E-commerce", palette: "foret", heading: "bricolage", body: "figtree" },
]);

// Étapes : `optional` = peut être ignorée ; `needs` = ce qui doit être fait pour être « terminée ».
const STEPS = Object.freeze([
  { key: "mode", label: "Mode de création", optional: false }, { key: "type", label: "Type de site", optional: false }, { key: "infos", label: "Informations", optional: false },
  { key: "identite", label: "Identité visuelle", optional: true }, { key: "pages", label: "Pages", optional: false }, { key: "contenus", label: "Contenus", optional: true },
  { key: "fonctions", label: "Fonctionnalités", optional: true }, { key: "apercu", label: "Aperçu", optional: true }, { key: "publication", label: "Publication", optional: true },
]);
const STEP_KEYS = STEPS.map((s) => s.key);
const MODES = Object.freeze({ blank: "Site vierge", template: "Modèle professionnel", shop: "Boutique en ligne" });

const byKey = (list, key) => list.find((x) => x.key === key) || null;
module.exports = {
  ICONS, CATEGORIES, FEATURES, COUNTRIES, LANGUAGES, CURRENCIES, STYLES, STEPS, STEP_KEYS, MODES,
  category: (key) => byKey(CATEGORIES, key), style: (key) => byKey(STYLES, key),
};
