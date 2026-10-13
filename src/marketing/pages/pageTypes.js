// Registre de couverture des types de pages web (écran « Création guidée » de l'éditeur).
// Quatre notions distinctes, jamais mélangées :
//   A. le TYPE de page (contact, landing page, fiche produit…)  → TYPES (cet inventaire)
//   B. le GABARIT visuel : une composition réelle de sections    → src/marketing/pages/templates.js (seule source des gabarits)
//   C. la structure / le FORMAT du canevas (largeur, marges)     → layoutFormat.js (étape suivante de l'assistant)
// Un type n'est « disponible » que si un gabarit réel le couvre (GABARIT_TYPES) ; sinon il est seulement RÉPERTORIÉ,
// avec la fonctionnalité qui manque quand il en dépend (boutique, espace membre, forum…). Rien n'est simulé.
const templates = require("./templates");

const GROUPS = [
  ["principales", "Pages principales"], ["marketing", "Marketing et conversion"], ["blog", "Blog et publication"], ["portfolio", "Portfolio et création"],
  ["ecommerce", "E-commerce"], ["formation", "Formation et espace membre"], ["entreprise", "Entreprise et services"], ["evenements", "Événements et communauté"], ["autres", "Autres pages"],
];

// Fonctionnalités dont un type dépend et qui ne sont pas (ou pas complètement) dans l'application : indiquées sur le type, jamais contournées
const NEEDS = { boutique: "Boutique en ligne (panier et paiement)", membre: "Espace membre et authentification", forum: "Module forum", annuaire: "Annuaire public", carte: "Carte de lieux", multilingue: "Site multilingue", leçon: "Leçons du module de formation" };

// [id, libellé, fonctionnalité requise (clé de NEEDS) ou ""]
const TYPES = {
  principales: [["accueil", "Page d'accueil"], ["apropos", "À propos"], ["contact", "Contact"], ["services", "Services"], ["entreprise", "Présentation d'entreprise"], ["equipe", "Équipe"], ["partenaires", "Partenaires"], ["temoignages", "Témoignages"], ["faq", "FAQ"], ["mentions", "Mentions légales"], ["confidentialite", "Politique de confidentialité"], ["conditions", "Conditions d'utilisation"], ["remerciement", "Page de remerciement"], ["confirmation", "Page de confirmation"], ["p404", "Page 404"]],
  marketing: [["landing", "Landing page"], ["capture", "Capture de prospects"], ["inscription", "Page d'inscription"], ["lancement-produit", "Lancement de produit"], ["vente", "Page de vente"], ["offre", "Présentation d'offre"], ["comparaison", "Page de comparaison"], ["tarifs", "Page de tarifs"], ["rdv", "Prise de rendez-vous"], ["telechargement", "Page de téléchargement"], ["confirmation-inscription", "Confirmation d'inscription"], ["campagne", "Campagne publicitaire"], ["precommande", "Précommande", "boutique"], ["webinaire", "Webinaire"], ["promotion", "Promotion"], ["compte-a-rebours", "Compte à rebours"], ["transition", "Redirection ou transition"], ["newsletter", "Inscription à une lettre"], ["bientot", "Bientôt disponible"]],
  blog: [["blog", "Blog"], ["archive-articles", "Archive d'articles"], ["article", "Article individuel"], ["categorie", "Catégorie"], ["etiquette", "Étiquette"], ["auteur", "Auteur"], ["recherche", "Recherche"], ["resultats-recherche", "Résultats de recherche"], ["magazine", "Magazine"], ["actualites", "Actualités"], ["communique", "Communiqué de presse"], ["publication", "Publication éditoriale"], ["bibliotheque-ressources", "Bibliothèque de ressources"], ["telechargement-ressource", "Téléchargement de ressource"]],
  portfolio: [["portfolio", "Portfolio"], ["etude-cas", "Étude de cas"], ["projet", "Projet individuel"], ["galerie", "Galerie"], ["photographie", "Photographie"], ["design", "Design graphique"], ["agence", "Agence créative"], ["service-creatif", "Service créatif"], ["profil-pro", "Profil professionnel"], ["cv", "CV en ligne"], ["page-perso", "Page personnelle"]],
  ecommerce: [["boutique", "Boutique", "boutique"], ["catalogue-produits", "Catalogue de produits", "boutique"], ["fiche-produit", "Fiche produit", "boutique"], ["categorie-produits", "Catégorie de produits", "boutique"], ["panier", "Panier", "boutique"], ["souhaits", "Liste de souhaits", "boutique"], ["comparaison-produits", "Comparaison de produits", "boutique"], ["promotions", "Promotions", "boutique"], ["nouveautes", "Nouveautés", "boutique"], ["populaires", "Produits populaires", "boutique"], ["recherche-produits", "Recherche de produits", "boutique"], ["marque", "Page de marque", "boutique"], ["guide-achat", "Guide d'achat"], ["questions-produits", "Questions sur les produits"], ["commande", "Page de commande", "boutique"]],
  formation: [["catalogue-formations", "Catalogue de formations"], ["fiche-formation", "Fiche de formation"], ["presentation-cours", "Présentation d'un cours"], ["inscription-formation", "Inscription à une formation"], ["formateur", "Formateur"], ["lecon", "Leçon", "leçon"], ["tableau-membre", "Tableau de bord membre", "membre"], ["connexion", "Connexion", "membre"], ["inscription-membre", "Inscription membre", "membre"], ["mot-de-passe", "Réinitialisation du mot de passe", "membre"], ["profil-membre", "Profil membre", "membre"], ["compte", "Page de compte", "membre"], ["abonnement", "Abonnement", "boutique"], ["confirmation-formation", "Confirmation d'inscription"]],
  entreprise: [["service", "Service individuel"], ["secteur", "Secteur d'activité"], ["references", "Références clients"], ["recrutement", "Recrutement"], ["offre-emploi", "Offre d'emploi"], ["carrieres", "Carrières"], ["contact-commercial", "Contact commercial"], ["devis", "Demande de devis"], ["reservation", "Réservation"], ["consultation", "Consultation"], ["presentation-projet", "Présentation de projet"], ["rapport", "Rapport"], ["documentation", "Documentation"], ["centre-aide", "Centre d'aide"]],
  evenements: [["evenement", "Événement"], ["inscription-evenement", "Inscription à un événement"], ["programme", "Programme"], ["intervenants", "Intervenants"], ["conference", "Conférence"], ["atelier", "Atelier"], ["association", "Association"], ["communaute", "Communauté"], ["adhesion", "Adhésion"], ["annuaire-membres", "Annuaire", "annuaire"], ["profil-public", "Profil public", "annuaire"], ["forum", "Forum", "forum"]],
  autres: [["application", "Application web"], ["produit-numerique", "Présentation de produit numérique"], ["repertoire", "Répertoire", "annuaire"], ["annuaire-pro", "Annuaire professionnel", "annuaire"], ["carte-lieux", "Carte de lieux", "carte"], ["page-locale", "Page locale"], ["multilingue", "Site multilingue", "multilingue"], ["resultats", "Page de résultats"], ["maintenance", "Page de maintenance"], ["temporaire", "Page temporaire"], ["cookies", "Préférences de cookies"]],
};

// Gabarits réels (clés de templates.js) et types qu'ils couvrent honnêtement. Une clé inconnue de templates.js fait échouer le contrôle (tests).
const GABARIT_TYPES = {
  lead: ["landing", "capture", "inscription"], vente: ["vente", "offre", "landing"], webinaire: ["webinaire", "conference"], formation: ["fiche-formation", "presentation-cours", "inscription-formation"],
  produit: ["produit-numerique", "lancement-produit"], service: ["services", "service", "service-creatif"], newsletter: ["newsletter"], telechargement: ["telechargement", "telechargement-ressource"],
  lancement: ["lancement-produit", "promotion"], bientot: ["bientot", "temporaire"], inscription: ["inscription"], consultation: ["rdv", "consultation", "reservation"],
  merci: ["remerciement", "confirmation", "confirmation-inscription", "confirmation-formation"], evenement: ["evenement", "inscription-evenement", "programme"], apropos: ["apropos", "equipe"],
  contact: ["contact", "contact-commercial", "devis"], portfolio: ["portfolio", "projet", "agence", "design", "photographie"], saas: ["application", "tarifs", "landing"], entreprise: ["entreprise", "accueil", "services", "references"],
};

function typeList() {
  const covered = new Map();
  for (const [key, ids] of Object.entries(GABARIT_TYPES)) for (const id of ids) covered.set(id, [...(covered.get(id) || []), key]);
  const out = [];
  for (const [group, label] of GROUPS) for (const [id, name, needs] of TYPES[group]) out.push({ id, name, group, groupLabel: label, gabarits: covered.get(id) || [], needs: needs ? NEEDS[needs] : "" });
  return out;
}

// Catalogue envoyé à l'éditeur : gabarits réels (avec la forme de leurs sections, pour l'aperçu) et inventaire des types
function catalog(ctx) {
  const types = typeList();
  const gabarits = templates.TEMPLATES.map((t) => {
    let shape = [];
    try { shape = t.build(ctx).filter(Boolean).map((s) => s.type); } catch (e) { shape = []; }
    const ids = GABARIT_TYPES[t.key] || [];
    return { key: t.key, name: t.name, category: t.category, description: t.description, shape, types: types.filter((x) => ids.includes(x.id)).map((x) => x.id), groups: [...new Set(types.filter((x) => ids.includes(x.id)).map((x) => x.group))] };
  });
  return { groups: GROUPS.map(([id, label]) => ({ id, label })), types, gabarits };
}

module.exports = { GROUPS, TYPES, NEEDS, GABARIT_TYPES, typeList, catalog };
