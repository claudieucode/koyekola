// Programme 22.1 — Laboratoire de qualité : les 15 scénarios de référence (briefs FIXES, entièrement fictifs : aucune donnée commerciale ni personnelle réelle).
//
// IMPORTANT — ce que ces fichiers sont et ne sont pas :
//  - `brief` est le texte qu'une personne taperait. Il ne change jamais d'un palier à l'autre : c'est la référence de comparaison.
//  - `analysis` et `plan` sont des PLANS DE RÉFÉRENCE écrits à la main, servis par un fournisseur d'IA SIMULÉ. Ils remplacent la réponse du modèle de langage
//    (qui exige une clé et coûte de l'argent). Conséquence : le laboratoire mesure le code DÉTERMINISTE en aval (garde-fous du Brief Analyzer et du Planner,
//    Page Generator, Component Mapper, Design Generator, rendu natif, responsive, SEO/accessibilité de base, performance). Il ne mesure PAS l'intelligence du modèle.
//    `run.js --live` (avec une clé et une autorisation explicites) permettrait de remplacer ce simulateur ; il n'a pas été utilisé.
//  - Les scénarios 10 à 12 (boutiques) passent par le constructeur de boutique (21.10) et le moteur natif (20.5).

const fact = (value = "", status = "unknown", evidence = "", confidence = 0.9) => ({ value, status, evidence, confidence });
const sec = (type, purpose, extra = {}) => ({ key: "", type, purpose, description: "", expectedContent: "", widgets: [], importance: "important", requiredData: [], dependsOn: [], origin: "ai", ...extra });
const pg = (key, name, pageType, types, position) => ({ key, name, slug: key, purpose: name, description: "", pageType, priority: "essential", origin: "ai", menu: "main", position, parent: "", relatedTo: [], sections: types.map((t) => (Array.isArray(t) ? sec(t[0], t[1]) : sec(t, name))) });

function build(id, label, { brief, name, siteType = "vitrine", sector, city = "", country = "", lang = "fr", audience = "", goals = ["presenter"], features = [], style = "", pages, shop = false }) {
  const analysis = {
    briefLanguage: lang, name: fact(name, "explicit", name), siteType: fact(siteType, "explicit", siteType === "vitrine" ? "site" : siteType), sector: fact(sector, "explicit", sector), country: fact(country, country ? "inferred" : "unknown", city),
    city: fact(city, city ? "explicit" : "unknown", city), siteLanguage: fact(lang, "assumed"), audience: fact(audience, audience ? "inferred" : "unknown"), tone: fact(), formality: fact(), style: fact(style, style ? "explicit" : "unknown", style), typography: fact(), colors: [],
    secondaryTypes: [], goals: goals.map((g) => ({ key: g, status: "inferred", confidence: 0.8, evidence: "" })), features: features.map((k) => ({ key: k, status: "inferred", confidence: 0.8, evidence: "", reason: "" })), pagesRequested: [], contradictions: [], missing: [],
    questions: [{ topic: "photos", question: "Disposez-vous de photographies à utiliser ?", why: "Elles alimentent les visuels.", blocking: false, choices: ["Oui", "Non"] }],
  };
  const plan = {
    site: { name, description: brief.slice(0, 200) }, pages: pages.map((p, i) => pg(p[0], p[1], p[2], p[3], i + 1)),
    navigation: { main: pages.map((p) => p[0]), secondary: [], footer: [] }, features: [], conversions: [], recommendations: [],
  };
  return { id, label, brief, shop, analysis, plan, designText: `${sector} ${style}`.trim(), country, lang, sector };
}

const SCENARIOS = [
  build("entreprise", "Site d'entreprise", {
    brief: "Site d'entreprise pour Norvalis Conseil, un cabinet de conseil en organisation fictif de 25 personnes basé à Lyon. Présenter l'offre, l'équipe, les références et permettre de prendre contact. Ton sérieux et rassurant.",
    name: "Norvalis Conseil", sector: "conseil en organisation", city: "Lyon", country: "FR", audience: "directions d'entreprises", features: ["formulaire_contact", "equipe"], style: "sérieux et rassurant",
    pages: [["accueil", "Accueil", "accueil", ["hero", "features", "testimonials", "cta"]], ["offre", "Notre offre", "services", ["hero", "features", "faq"]], ["equipe", "L'équipe", "equipe", ["hero", "text"]], ["references", "Références", "references", ["hero", "text"]], ["contact", "Contact", "contact", ["hero", "form"]]],
  }),
  build("immobilier", "Site immobilier", {
    brief: "Site pour l'agence Toit & Horizon, une agence immobilière fictive à Bordeaux. Présenter les biens à vendre et à louer, l'équipe, estimer un bien et contacter l'agence.",
    name: "Toit & Horizon", sector: "immobilier", city: "Bordeaux", country: "FR", audience: "acheteurs, vendeurs et locataires", goals: ["presenter", "contact"], features: ["catalogue_biens", "formulaire_contact"], style: "élégant",
    pages: [["accueil", "Accueil", "accueil", ["hero", "features", "cta"]], ["biens", "Nos biens", "portfolio", ["hero", "image"]], ["estimation", "Estimer mon bien", "contact", ["hero", "form"]], ["agence", "L'agence", "apropos", ["hero", "text", "testimonials"]], ["contact", "Contact", "contact", ["hero", "form"]]],
  }),
  build("construction", "Site de construction", {
    brief: "Site pour BâtiSud, une entreprise de construction et de rénovation fictive à Marseille. Services, réalisations en galerie, FAQ et demande de devis.",
    name: "BâtiSud", sector: "construction", city: "Marseille", country: "FR", audience: "particuliers et professionnels", goals: ["presenter", "devis"], features: ["formulaire_devis", "galerie", "faq"], style: "robuste",
    pages: [["accueil", "Accueil", "accueil", ["hero", "features", "testimonials", "cta"]], ["services", "Services", "services", ["hero", "features", "faq"]], ["realisations", "Réalisations", "portfolio", ["hero", "image", "image"]], ["devis", "Demander un devis", "devis", ["hero", "form"]], ["contact", "Contact", "contact", ["hero", "text"]]],
  }),
  build("tech", "Site technologique", {
    brief: "Site pour Cobalt Labs, une jeune société de logiciels fictive qui édite un outil de suivi de projets pour équipes. Présenter le produit, les fonctionnalités, les tarifs et proposer un essai gratuit.",
    name: "Cobalt Labs", sector: "logiciel", country: "FR", audience: "équipes projet", goals: ["presenter", "conversion"], features: ["tarifs", "formulaire_contact"], style: "moderne et épuré",
    pages: [["accueil", "Accueil", "accueil", ["hero", "features", "video", "cta"]], ["produit", "Le produit", "vente", ["hero", "features", "faq"]], ["tarifs", "Tarifs", "tarifs", ["hero", "features", "faq", "cta"]], ["contact", "Contact", "contact", ["hero", "form"]]],
  }),
  build("photo", "Site de photographie", {
    brief: "Site pour Lumen Atelier, un photographe fictif spécialisé dans le portrait et le mariage, en Belgique. Mettre en valeur les images, présenter les prestations et permettre une demande de réservation.",
    name: "Lumen Atelier", sector: "photographie", country: "BE", audience: "futurs mariés et particuliers", goals: ["presenter", "reservation"], features: ["galerie", "reservation"], style: "sobre, photo plein écran",
    pages: [["accueil", "Accueil", "accueil", ["hero", "image", "cta"]], ["galeries", "Galeries", "galerie", ["hero", "image", "image", "image"]], ["prestations", "Prestations", "services", ["hero", "features"]], ["contact", "Réserver", "contact", ["hero", "form"]]],
  }),
  build("portfolio", "Portfolio créatif", {
    brief: "Portfolio de Ines Marchetti, illustratrice indépendante fictive. Montrer quelques projets, raconter son parcours en quelques lignes et laisser un moyen de la contacter.",
    name: "Ines Marchetti", sector: "illustration", country: "FR", audience: "éditeurs et agences", features: ["galerie"], style: "créatif et coloré",
    pages: [["accueil", "Accueil", "accueil", ["hero", "image", "text"]], ["projets", "Projets", "portfolio", ["hero", "image", "image"]], ["apropos", "À propos", "apropos", ["hero", "text"]], ["contact", "Contact", "contact", ["hero", "form"]]],
  }),
  build("institution", "Site institutionnel", {
    brief: "Site de la Communauté de communes du Val Clair, une collectivité fictive. Informer les habitants : services publics, démarches, actualités, contacts utiles. Accessible à tous.",
    name: "Communauté de communes du Val Clair", sector: "collectivité territoriale", country: "FR", audience: "habitants", goals: ["informer"], features: ["blog", "faq"], style: "institutionnel, accessible",
    pages: [["accueil", "Accueil", "accueil", ["hero", "features", "cta"]], ["services", "Services publics", "services", ["hero", "list", "faq"]], ["demarches", "Démarches", "faq", ["hero", "faq"]], ["actualites", "Actualités", "actualites", ["hero", "text"]], ["contact", "Contact", "contact", ["hero", "text", "form"]]],
  }),
  build("restaurant", "Restaurant", {
    brief: "Site du restaurant Le Figuier, un restaurant méditerranéen fictif à Nice. Présenter la carte, l'ambiance, les horaires et permettre de réserver une table.",
    name: "Le Figuier", sector: "restauration", city: "Nice", country: "FR", audience: "habitants et touristes", goals: ["presenter", "reservation"], features: ["reservation", "galerie"], style: "chaleureux",
    pages: [["accueil", "Accueil", "accueil", ["hero", "text", "image", "cta"]], ["carte", "La carte", "service", ["hero", "list"]], ["galerie", "Ambiance", "galerie", ["hero", "image", "image"]], ["reserver", "Réserver", "reservation", ["hero", "form"]], ["contact", "Infos pratiques", "contact", ["hero", "text"]]],
  }),
  build("blog", "Blog professionnel", {
    brief: "Blog professionnel de Claire Dumas, consultante fictive en gestion du temps. Publier des articles, présenter son approche et proposer une lettre d'information.",
    name: "Claire Dumas", siteType: "blog", sector: "conseil en productivité", country: "FR", audience: "managers", goals: ["informer", "newsletter"], features: ["blog", "newsletter"], style: "éditorial",
    pages: [["accueil", "Accueil", "accueil", ["hero", "text", "cta"]], ["blog", "Le blog", "blog", ["hero", "text"]], ["apropos", "À propos", "apropos", ["hero", "text", "testimonials"]], ["newsletter", "Lettre d'information", "newsletter", ["hero", "form"]]],
  }),
  build("boutique", "Boutique e-commerce", { shop: true, brief: "Boutique en ligne Maison Cèdre, objets de décoration fictifs, avec livraison en France.", name: "Maison Cèdre", siteType: "boutique", sector: "décoration", country: "FR", pages: [["accueil", "Accueil", "accueil", ["hero", "features"]]] }),
  build("mode", "Boutique de mode", { shop: true, brief: "Boutique de mode Fil & Aiguille, vêtements fictifs avec tailles et couleurs.", name: "Fil & Aiguille", siteType: "boutique", sector: "mode", country: "FR", pages: [["accueil", "Accueil", "accueil", ["hero", "features"]]] }),
  build("informatique", "Boutique informatique", { shop: true, brief: "Boutique de matériel informatique PixelPort, accessoires fictifs avec stock.", name: "PixelPort", siteType: "boutique", sector: "matériel informatique", country: "FR", pages: [["accueil", "Accueil", "accueil", ["hero", "features"]]] }),
  build("services", "Site de services", {
    brief: "Site pour ClairNet Services, une entreprise de nettoyage fictive à Lille. Présenter les prestations, les zones d'intervention, un formulaire de demande de devis et une FAQ.",
    name: "ClairNet Services", sector: "nettoyage", city: "Lille", country: "FR", audience: "particuliers et entreprises", goals: ["presenter", "devis"], features: ["formulaire_devis", "faq"], style: "propre et rassurant",
    pages: [["accueil", "Accueil", "accueil", ["hero", "features", "testimonials", "cta"]], ["prestations", "Prestations", "services", ["hero", "features", "faq"]], ["devis", "Devis", "devis", ["hero", "form"]], ["contact", "Contact", "contact", ["hero", "text"]]],
  }),
  build("education", "Site éducatif", {
    brief: "Site de l'Institut Aurore, un petit centre de formation fictif en langues à Montréal. Présenter les cours, les enseignants, les tarifs et les inscriptions.",
    name: "Institut Aurore", siteType: "formation", sector: "formation en langues", city: "Montréal", country: "CA", audience: "adultes en formation", goals: ["presenter", "inscription"], features: ["catalogue_formations", "tarifs"], style: "lumineux",
    pages: [["accueil", "Accueil", "accueil", ["hero", "features", "testimonials", "cta"]], ["cours", "Nos cours", "catalogue-formations", ["hero", "course"]], ["equipe", "Enseignants", "equipe", ["hero", "text"]], ["tarifs", "Tarifs", "tarifs", ["hero", "features", "faq"]], ["contact", "Inscription", "contact", ["hero", "form"]]],
  }),
  build("sante", "Site de santé (contenu contrôlé)", {
    brief: "Site du Cabinet Équilibre, un cabinet de kinésithérapie fictif à Genève. Présenter le cabinet, l'équipe, les horaires et la prise de rendez-vous. Aucune promesse de guérison ni conseil médical.",
    name: "Cabinet Équilibre", sector: "kinésithérapie", city: "Genève", country: "CH", audience: "patients", goals: ["presenter", "rdv"], features: ["reservation", "equipe"], style: "apaisant",
    pages: [["accueil", "Accueil", "accueil", ["hero", "features", "cta"]], ["cabinet", "Le cabinet", "apropos", ["hero", "text"]], ["equipe", "L'équipe", "equipe", ["hero", "text"]], ["rdv", "Rendez-vous", "rdv", ["hero", "form"]], ["infos", "Infos pratiques", "contact", ["hero", "text", "faq"]]],
  }),
];

module.exports = { SCENARIOS, fact, sec, pg };
