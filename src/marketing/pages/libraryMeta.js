// Bibliothèque de modèles : classement des modèles OFFICIELS (programme 20.4) — secteurs (clés de cms_template_sectors, jamais des libellés), type de site, mots-clés de recherche et date d'ajout.
// Une seule table pour tous les types (pack / page / section / component / part) : le contenu reste dans pages/sitePacks.js, templates.js, patterns.js, libraryComponents.js, libraryParts.js.
// sectors vide = modèle générique (utile dans tous les secteurs) : il n'apparaît pas quand on filtre par secteur (pas de faux classement). Un test vérifie que chaque modèle officiel est classé ici.
const OLD = "2026-10-18", NEW = "2026-10-30";
const SEC = { // regroupements de secteurs réutilisés
  formation: ["formation-en-ligne", "centre-formation", "lms"], agence: ["agence-digitale", "marketing", "communication"], creatif: ["portfolio-creatif", "photographie", "graphisme", "video"],
  resto: ["restaurant", "cafe"], editorial: ["blog", "magazine", "actualites", "portail-editorial"], commerce: ["boutique-en-ligne", "produits-numeriques", "catalogue-produits"],
  asso: ["association", "ong", "fondation", "communaute", "organisation-professionnelle"], pro: ["services-professionnels", "conseil"], horaires: ["restaurant", "cafe", "cabinet", "clinique", "bien-etre", "fitness", "hotel"],
};
const SHOP = ["boutique-en-ligne", "catalogue-produits", "mode", "beaute", "electronique", "maison-decoration"]; // gabarits GÉNÉRIQUES de vente de produits : ils conviennent à ces secteurs, sans texte propre à l'un d'eux
const m = (sectors, siteType, keywords, since = OLD) => ({ sectors, siteType, keywords, since });

const META = {
  // Packs de site
  "pack:formation-en-ligne": m(SEC.formation, "formation", ["cours", "école", "élèves", "programme", "vente de formation"]),
  "pack:service-professionnel": m(SEC.pro, "vitrine", ["indépendant", "freelance", "consultant", "réalisations", "témoignages"]),
  "pack:lancement-produit": m(["marketing", "produits-numeriques"], "vitrine", ["saas", "logiciel", "application", "lancement", "fonctionnalités"]),
  "pack:entreprise": m(["corporate", "services-professionnels", "conseil"], "vitrine", ["société", "vitrine", "présentation", "services"]),
  "pack:evenement": m(["evenementiel"], "vitrine", ["webinaire", "conférence", "inscription", "salon"]),
  "pack:agence-digitale": m(SEC.agence, "vitrine", ["agence", "web", "création", "services", "méthode", "clients"], NEW),
  "pack:portfolio-creatif": m(SEC.creatif, "vitrine", ["portfolio", "photographe", "graphiste", "vidéaste", "projets", "galerie"], NEW),
  "pack:restaurant": m(SEC.resto, "vitrine", ["restaurant", "carte", "menu", "réservation", "horaires", "cuisine"], NEW),
  "pack:immobilier": m(["immobilier"], "vitrine", ["agence immobilière", "biens", "annonces", "estimation", "vente", "location"], NEW),
  "pack:blog-magazine": m(SEC.editorial, "blog", ["blog", "magazine", "articles", "éditorial", "lettre"], NEW),
  "pack:boutique-formations": m(SEC.commerce, "boutique", ["boutique", "catalogue", "formations", "vente", "produits numériques"], NEW),
  "pack:association": m(SEC.asso, "vitrine", ["association", "ong", "adhésion", "bénévolat", "missions", "soutien"], NEW),
  // Gabarits de page
  "page:lead": m([], "", ["prospects", "ressource gratuite", "inscription"]), "page:vente": m(["formation-en-ligne", "produits-numeriques"], "formation", ["vente", "offre", "promesse"]),
  "page:webinaire": m(["formation-en-ligne", "evenementiel", "marketing"], "", ["webinaire", "conférence en ligne", "inscription"]), "page:formation": m(SEC.formation, "formation", ["programme", "cours", "élèves"]),
  "page:produit": m(["catalogue-produits", "boutique-en-ligne", "produits-numeriques"], "boutique", ["produit", "caractéristiques", "avantages"]), "page:service": m(SEC.pro, "vitrine", ["prestation", "offre de service"]),
  "page:newsletter": m(SEC.editorial, "blog", ["lettre", "abonnement", "e-mail"]), "page:telechargement": m(["produits-numeriques", "marketing"], "", ["guide", "fichier", "ressource"]),
  "page:lancement": m(["marketing", "produits-numeriques"], "vitrine", ["nouveauté", "annonce"]), "page:bientot": m([], "", ["liste d'attente", "prochainement"]),
  "page:inscription": m([], "", ["formulaire", "inscription"]), "page:consultation": m(["conseil", "cabinet", "coaching-sportif"], "vitrine", ["rendez-vous", "consultation", "échange"]),
  "page:merci": m([], "", ["remerciement", "confirmation"]), "page:evenement": m(["evenementiel"], "vitrine", ["événement", "programme", "lieu"]),
  "page:apropos": m([], "", ["équipe", "histoire", "valeurs", "qui sommes-nous"]), "page:contact": m([], "", ["coordonnées", "formulaire", "joindre"]),
  "page:portfolio": m(SEC.creatif.concat(["agence-digitale"]), "vitrine", ["réalisations", "projets", "cartes"]), "page:saas": m(["marketing"], "vitrine", ["logiciel", "application", "tarifs"]),
  "page:faq": m([], "", ["questions", "aide", "réponses"]), "page:tarifs": m([], "", ["prix", "formules", "abonnement"]), "page:temoignages": m([], "", ["avis", "preuve sociale", "clients"]),
  "page:p404": m([], "", ["erreur", "introuvable", "404"]), "page:entreprise": m(["corporate", "services-professionnels"], "vitrine", ["société", "présentation"]),
  "page:agence-accueil": m(SEC.agence, "vitrine", ["agence", "accueil", "expertises"], NEW), "page:agence-services": m(SEC.agence, "vitrine", ["agence", "services", "devis"], NEW),
  "page:agence-methode": m(SEC.agence, "vitrine", ["méthode", "étapes", "processus"], NEW), "page:portfolio-accueil": m(SEC.creatif, "vitrine", ["portfolio", "accueil", "projets"], NEW),
  "page:resto-accueil": m(SEC.resto, "vitrine", ["restaurant", "accueil", "horaires"], NEW), "page:resto-carte": m(SEC.resto, "vitrine", ["carte", "menu", "plats", "allergènes"], NEW),
  "page:resto-reservation": m(SEC.resto, "vitrine", ["réservation", "table", "formulaire"], NEW), "page:immo-accueil": m(["immobilier"], "vitrine", ["immobilier", "accueil", "biens"], NEW),
  "page:immo-biens": m(["immobilier"], "vitrine", ["biens", "annonces", "cartes"], NEW), "page:immo-estimation": m(["immobilier"], "vitrine", ["estimation", "formulaire", "vendre"], NEW),
  "page:blog-accueil": m(SEC.editorial, "blog", ["blog", "accueil", "articles"], NEW), "page:boutique-accueil": m(SEC.commerce, "boutique", ["boutique", "catalogue", "formations"], NEW),
  "page:asso-accueil": m(SEC.asso, "vitrine", ["association", "mission", "valeurs"], NEW), "page:asso-missions": m(SEC.asso, "vitrine", ["actions", "équipe", "bénévolat"], NEW),
  "page:asso-adhesion": m(SEC.asso, "vitrine", ["adhésion", "cotisation", "formulaire"], NEW), "page:asso-soutenir": m(SEC.asso, "vitrine", ["soutien", "don", "partenaire"], NEW),
  // Sections (patterns)
  "section:hero": m([], "", ["bandeau", "en-tête", "accroche"]), "section:hero-split": m([], "", ["bandeau", "deux colonnes"]), "section:features": m([], "", ["avantages", "cartes"]),
  "section:benefits": m([], "", ["bénéfices", "liste"]), "section:testimonials": m([], "", ["témoignages", "avis"]), "section:pricing": m([], "", ["tarifs", "prix", "offres"]),
  "section:stats": m([], "", ["chiffres", "statistiques"]), "section:faq": m([], "", ["questions", "accordéon"]), "section:cta": m([], "", ["appel à l'action", "bouton"]),
  "section:newsletter": m(SEC.editorial, "blog", ["lettre", "inscription"]), "section:comparison": m([], "", ["tableau", "comparatif"]), "section:cards": m([], "", ["cartes"]),
  "section:bento": m([], "", ["mosaïque"]), "section:cover": m([], "", ["couverture", "dégradé"]), "section:media-text": m([], "", ["image", "texte"]), "section:iconbox": m([], "", ["icônes"]),
  "section:team": m([], "", ["équipe", "personnes"]), "section:steps": m([], "", ["étapes", "chronologie"]), "section:cols-2": m([], "", ["colonnes"]), "section:cols-3": m([], "", ["colonnes"]),
  "section:cols-4": m([], "", ["colonnes"]), "section:courses": m(SEC.formation, "formation", ["formations", "catalogue"]),
  "section:logos": m([], "", ["partenaires", "logos", "références"], NEW), "section:contact-info": m([], "", ["adresse", "téléphone", "e-mail", "accès"], NEW), "section:hours": m(SEC.horaires, "vitrine", ["horaires", "ouverture"], NEW),
  "section:menu-carte": m(SEC.resto, "vitrine", ["carte", "menu", "plats", "prix"], NEW), "section:listings": m(["immobilier"], "vitrine", ["biens", "annonces", "immobilier"], NEW),
  "section:project-grid": m(SEC.creatif.concat(["agence-digitale"]), "vitrine", ["projets", "galerie", "réalisations"], NEW), "section:values": m(SEC.asso, "vitrine", ["valeurs", "missions"], NEW),
  "section:process-4": m([], "", ["méthode", "étapes", "processus"], NEW), "section:services-prices": m(SEC.pro.concat(SEC.agence), "vitrine", ["prestations", "prix", "liste de prix"], NEW),
  "section:quote-large": m([], "", ["citation", "témoignage"], NEW), "section:blog-latest": m(SEC.editorial, "blog", ["articles", "blog", "derniers"], NEW), "section:catalogue-live": m(SEC.commerce.concat(SEC.formation), "boutique", ["catalogue", "formations", "boutique"], NEW),
  "pack:boutique-en-ligne": m(SHOP, "boutique", ["boutique", "e-commerce", "produits", "panier", "catalogue", "vente en ligne"], NEW),
  "page:boutique-produits-accueil": m(SHOP, "boutique", ["boutique", "produits à la une", "promotions"], NEW), "page:boutique-catalogue": m(SHOP, "boutique", ["catalogue", "recherche", "filtres", "produits"], NEW), "page:boutique-livraison": m(SHOP, "boutique", ["livraison", "retours", "paiement"], NEW),
  "section:shop-featured": m(SHOP, "boutique", ["produits à la une", "grille", "boutique"], NEW), "section:shop-sale": m(SHOP, "boutique", ["promotions", "soldes", "boutique"], NEW), "section:shop-search": m(SHOP, "boutique", ["recherche", "filtres", "boutique"], NEW), "section:shop-archive": m(SHOP, "boutique", ["catalogue", "catégorie", "boutique"], NEW),
  "component:barre-boutique": m(SHOP, "boutique", ["recherche", "panier", "boutique"], NEW),
  "part:fiche-produit": m(SHOP, "boutique", ["fiche produit", "prix", "achat", "boutique"], NEW), "part:catalogue-produits": m(SHOP, "boutique", ["catalogue", "catégorie de produits", "boutique"], NEW),
  // Composants
  "component:header-simple": m([], "", ["en-tête", "logo", "menu"], NEW), "component:header-cta": m([], "", ["en-tête", "bouton", "menu"], NEW), "component:footer-simple": m([], "", ["pied de page", "copyright"], NEW),
  "component:footer-colonnes": m([], "", ["pied de page", "colonnes", "contact"], NEW), "component:bandeau-annonce": m([], "", ["annonce", "bandeau"], NEW), "component:carte-service": m([], "", ["carte", "service"], NEW),
  "component:bloc-chiffre": m([], "", ["chiffre", "statistique"], NEW), "component:bandeau-appel": m([], "", ["appel à l'action", "bandeau"], NEW),
  // Modèles du Theme Builder
  "part:article": m(SEC.editorial, "blog", ["article", "billet", "commentaires"], NEW), "part:liste-blog": m(SEC.editorial, "blog", ["liste", "archive", "blog"], NEW), "part:archive-categorie": m(SEC.editorial, "blog", ["catégorie", "archive"], NEW),
  "part:archive-auteur": m(SEC.editorial, "blog", ["auteur", "archive"], NEW), "part:resultats-recherche": m(SEC.editorial, "blog", ["recherche", "résultats"], NEW), "part:page-introuvable": m([], "", ["404", "erreur", "introuvable"], NEW),
};
const SITE_TYPES = ["", "vitrine", "blog", "boutique", "formation", "autre"];
const metaOf = (ref) => META[ref] || null;
module.exports = { META, SEC, metaOf, SITE_TYPES };
