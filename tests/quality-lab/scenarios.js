// Programme 22.1 — laboratoire de qualité : 15 scénarios de RÉFÉRENCE. Les briefs ne changent pas d'un palier à l'autre (comparabilité) ; toutes les données sont fictives.
// `wizard` = catégorie du parcours guidé (catalogue 20.6) ; `design` = brief transmis au générateur de direction artistique ; `expect` = ce qu'un bon site pour ce brief doit contenir.
// `essential` = types de pages sans lesquels le site ne remplit pas son objectif ; `allowed` = types acceptables en plus (tout le reste est signalé comme page peu pertinente).
const BASE_ALLOWED = ["accueil", "contact", "apropos", "faq", "temoignages", "blog"];
const S = (id, label, wizard, brief, design, expect, essential, allowed = [], extra = {}) => ({ id, label, wizard, brief, design, expect, essential, allowed: [...BASE_ALLOWED, ...allowed], ...extra });

const SCENARIOS = [
  S("entreprise", "Site d'entreprise", "entreprise", "Site d'une PME de logistique à Lyon (France) : présenter l'offre de transport et d'entrepôt, l'équipe, les actualités, et recevoir des demandes de contact de la part d'industriels.",
    { text: "entreprise sérieuse, bleu, clair et structuré", category: "entreprise", sector: "logistique", country: "FR", lang: "fr" },
    { siteType: "entreprise", sector: "logistique", country: "FR", lang: "fr", audience: "industriels" }, ["accueil", "services", "contact"], ["services", "equipe", "realisations"]),
  S("immobilier", "Site immobilier", "immobilier", "Agence immobilière à Montréal (Canada) : présenter les biens à vendre et à louer, l'équipe de courtiers, et permettre de prendre rendez-vous pour une visite. Site en français et en anglais.",
    { text: "agence immobilière élégante, rassurante, photos grand format", category: "immobilier", sector: "immobilier", country: "CA", lang: "fr" },
    { siteType: "immobilier", sector: "immobilier", country: "CA", lang: "fr", audience: "acheteurs" }, ["accueil", "immobilier", "contact"], ["immobilier", "equipe"]),
  S("construction", "Site de construction", "services", "Entreprise de construction et de rénovation de bâtiments à Kinshasa (RDC) : services, réalisations, galerie, FAQ et demande de devis.",
    { text: "entreprise sérieuse, robuste, orange et gris foncé", category: "entreprise", sector: "construction", country: "CD", lang: "fr" },
    { siteType: "entreprise", sector: "construction", country: "CD", lang: "fr", audience: "particuliers" }, ["accueil", "services", "realisations", "contact"], ["services", "realisations", "galerie", "tarifs"]),
  S("tech", "Site technologique", "agence", "Start-up de logiciels de gestion de flotte (SaaS) basée à Austin (États-Unis) : expliquer le produit, les fonctionnalités, les tarifs, et obtenir des demandes de démonstration. Site en anglais.",
    { text: "moderne, technologique, sombre avec accent vif", category: "entreprise", sector: "logiciel", country: "US", lang: "en" },
    { siteType: "entreprise", sector: "logiciel", country: "US", lang: "en", audience: "gestionnaires de flotte" }, ["accueil", "services", "tarifs", "contact"], ["services", "tarifs", "realisations", "equipe"]),
  S("photographie", "Site de photographie", "portfolio", "Photographe de mariage et de portrait à Paris : montrer un portfolio en galerie, les offres, et recevoir des demandes de réservation.",
    { text: "épuré, élégant, noir et blanc, photos mises en valeur", category: "portfolio", sector: "photographie", country: "FR", lang: "fr" },
    { siteType: "portfolio", sector: "photographie", country: "FR", lang: "fr", audience: "futurs mariés" }, ["accueil", "galerie", "contact"], ["galerie", "realisations", "tarifs", "services"]),
  S("portfolio", "Portfolio créatif", "portfolio", "Designer graphique indépendante : présenter quelques projets d'identité visuelle, son parcours et un moyen de la contacter.",
    { text: "créatif, audacieux, couleurs vives", category: "portfolio", sector: "design graphique", country: "FR", lang: "fr" },
    { siteType: "portfolio", sector: "design graphique", country: "FR", lang: "fr", audience: "clients" }, ["accueil", "realisations", "contact"], ["realisations", "galerie", "services"]),
  S("institutionnel", "Site institutionnel", "organisation", "Association nationale de protection de l'environnement : missions, actions, actualités, appel à l'adhésion et aux dons. Site en français pour la RDC.",
    { text: "institutionnel, vert, sobre et fiable", category: "association", sector: "environnement", country: "CD", lang: "fr" },
    { siteType: "association", sector: "environnement", country: "CD", lang: "fr", audience: "citoyens" }, ["accueil", "apropos", "contact"], ["apropos", "blog", "equipe"]),
  S("restaurant", "Restaurant", "restaurant", "Restaurant de cuisine congolaise à Bruxelles : la carte, les horaires, l'adresse, la réservation par téléphone ou formulaire.",
    { text: "chaleureux, gourmand, tons chauds", category: "restaurant", sector: "restauration", country: "BE", lang: "fr" },
    { siteType: "restaurant", sector: "restauration", country: "BE", lang: "fr", audience: "clients locaux" }, ["accueil", "services", "contact"], ["services", "galerie"]),
  S("blog", "Blog professionnel", "blog", "Blog d'une consultante en ressources humaines : publier des articles, présenter son expertise et proposer une inscription à la lettre d'information.",
    { text: "éditorial, lisible, sobre", category: "blog", sector: "ressources humaines", country: "FR", lang: "fr" },
    { siteType: "blog", sector: "ressources humaines", country: "FR", lang: "fr", audience: "responsables RH" }, ["accueil", "blog", "apropos", "contact"], ["blog"]),
  S("boutique", "Boutique e-commerce", "boutique", "Boutique en ligne d'articles de maison et de décoration livrés en France : catalogue, fiche produit, panier, paiement sécurisé et conditions de livraison.",
    { text: "boutique claire, rassurante, tons naturels", category: "boutique", sector: "décoration", country: "FR", lang: "fr" },
    { siteType: "boutique", sector: "décoration", country: "FR", lang: "fr", audience: "particuliers" }, ["accueil", "boutique", "panier", "commande", "contact"], ["boutique", "catalogue", "panier", "commande", "fiche-produit", "tarifs"], { shop: true }),
  S("mode", "Boutique de mode", "boutique", "Boutique de vêtements pour femmes à Toronto (Canada), prix en dollars canadiens : collections, tailles, panier et paiement.",
    { text: "mode, tendance, élégant et aéré", category: "boutique", sector: "mode", country: "CA", lang: "fr" },
    { siteType: "boutique", sector: "mode", country: "CA", lang: "fr", audience: "femmes" }, ["accueil", "boutique", "panier", "commande", "contact"], ["boutique", "catalogue", "panier", "commande", "fiche-produit"], { shop: true }),
  S("informatique", "Boutique informatique", "boutique", "Boutique de matériel informatique à Kinshasa : ordinateurs, accessoires, garanties, panier et commande avec livraison.",
    { text: "technologique, fiable, bleu et blanc", category: "boutique", sector: "informatique", country: "CD", lang: "fr" },
    { siteType: "boutique", sector: "informatique", country: "CD", lang: "fr", audience: "particuliers et entreprises" }, ["accueil", "boutique", "panier", "commande", "contact"], ["boutique", "catalogue", "panier", "commande", "fiche-produit", "tarifs"], { shop: true }),
  S("services", "Site de services", "services", "Cabinet de conseil en comptabilité pour petites entreprises à Dakar : services, tarifs, témoignages, prise de rendez-vous.",
    { text: "professionnel, rassurant, vert profond", category: "entreprise", sector: "comptabilité", country: "SN", lang: "fr" },
    { siteType: "services", sector: "comptabilité", country: "SN", lang: "fr", audience: "petites entreprises" }, ["accueil", "services", "contact"], ["services", "tarifs", "temoignages", "equipe"]),
  S("education", "Site éducatif", "education", "École de langues : présenter les cours, les enseignants, les niveaux, et permettre de s'inscrire. Site pour les États-Unis, en anglais.",
    { text: "lumineux, accueillant, bleu et jaune", category: "education", sector: "enseignement", country: "US", lang: "en" },
    { siteType: "formation", sector: "enseignement", country: "US", lang: "en", audience: "étudiants" }, ["accueil", "formation", "contact"], ["formation", "equipe", "tarifs"]),
  S("sante", "Site de santé (contenu contrôlé)", "services", "Cabinet de kinésithérapie à Lille : présenter l'équipe, les spécialités, les horaires et la prise de rendez-vous. Aucune promesse de guérison ni de résultat médical.",
    { text: "apaisant, propre, bleu clair, très lisible", category: "entreprise", sector: "santé", country: "FR", lang: "fr" },
    { siteType: "services", sector: "santé", country: "FR", lang: "fr", audience: "patients" }, ["accueil", "services", "contact"], ["services", "equipe", "tarifs"], { sensitive: true }),
];

// Briefs de test du Brief Analyzer (précis, courts, vagues, incomplets, complexes, contradictoires)
const BRIEF_CASES = [
  { id: "precis", text: SCENARIOS[2].brief, kind: "précis" },
  { id: "court", text: "Un site pour mon restaurant.", kind: "court" },
  { id: "vague", text: "Je veux un beau site moderne qui marche bien.", kind: "vague" },
  { id: "incomplet", text: "Site pour vendre des produits.", kind: "incomplet" },
  { id: "complexe", text: "Plateforme avec boutique de formation en ligne, blog, espace membres, paiement mobile, version anglaise, pour une ONG basée à Goma qui forme des agriculteurs.", kind: "complexe" },
  { id: "contradictoire", text: "Un site minimaliste et très chargé, sombre et très lumineux, sans boutique mais avec un panier.", kind: "contradictoire" },
];
module.exports = { SCENARIOS, BRIEF_CASES };
