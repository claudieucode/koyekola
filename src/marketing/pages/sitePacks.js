// Apparence → Templates : PACKS de site. Un pack est une suite de pages composées de VRAIS gabarits de pages du Page Builder (pages/templates.js : sections natives, modifiables),
// d'un menu qui les relie et d'un style de départ (une palette lisible AA + deux polices du moteur). Un pack ne contient aucun HTML figé, aucune capture d'écran, aucun faux chiffre ni faux témoignage :
// les textes de départ disent quoi écrire (« [chiffre réel] »), comme tous les gabarits. Il ne contient AUCUNE image : les images se choisissent dans la médiathèque du site (aucune image sous licence tierce n'est embarquée).
// Importer un pack ne touche à aucun contenu existant : il ajoute des pages (nouveaux noms, jamais remplacés), un menu (nouveau nom) et un BROUILLON de styles (jamais publié).
const PACKS = Object.freeze([
  { key: "formation-en-ligne", category: "Formation", name: "Formation en ligne", description: "Vendez une formation : page de vente, programme, tarifs, questions fréquentes, présentation de l'équipe et contact.",
    palette: "marine", fonts: { heading: "arial", body: "arial" },
    pages: [{ key: "accueil", name: "Accueil", template: "vente" }, { key: "programme", name: "Programme", template: "formation" }, { key: "tarifs", name: "Tarifs", template: "tarifs" }, { key: "faq", name: "Questions fréquentes", template: "faq" }, { key: "a-propos", name: "À propos", template: "apropos" }, { key: "contact", name: "Contact", template: "contact" }],
    menu: ["accueil", "programme", "tarifs", "faq", "a-propos", "contact"] },
  { key: "service-professionnel", category: "Service", name: "Indépendant et services", description: "Présentez votre activité : accueil, réalisations, témoignages, à propos et prise de contact.",
    palette: "ardoise", fonts: { heading: "arial", body: "arial" },
    pages: [{ key: "accueil", name: "Accueil", template: "service" }, { key: "realisations", name: "Réalisations", template: "portfolio" }, { key: "temoignages", name: "Témoignages", template: "temoignages" }, { key: "a-propos", name: "À propos", template: "apropos" }, { key: "contact", name: "Contact", template: "contact" }],
    menu: ["accueil", "realisations", "temoignages", "a-propos", "contact"] },
  { key: "lancement-produit", category: "Produit", name: "Lancement de produit", description: "Annoncez un produit ou un logiciel : accueil, fonctionnalités, tarifs, questions et contact.",
    palette: "ocean", fonts: { heading: "arial", body: "system" },
    pages: [{ key: "accueil", name: "Accueil", template: "lancement" }, { key: "produit", name: "Produit", template: "saas" }, { key: "tarifs", name: "Tarifs", template: "tarifs" }, { key: "faq", name: "Questions fréquentes", template: "faq" }, { key: "contact", name: "Contact", template: "contact" }],
    menu: ["accueil", "produit", "tarifs", "faq", "contact"] },
  { key: "entreprise", category: "Entreprise", name: "Site d'entreprise", description: "Un site vitrine sobre : présentation, services, à propos et contact.",
    palette: "foret", fonts: { heading: "georgia", body: "arial" },
    pages: [{ key: "accueil", name: "Accueil", template: "entreprise" }, { key: "services", name: "Services", template: "service" }, { key: "a-propos", name: "À propos", template: "apropos" }, { key: "contact", name: "Contact", template: "contact" }],
    menu: ["accueil", "services", "a-propos", "contact"] },
  { key: "evenement", category: "Événement", name: "Événement et webinaire", description: "Un événement : présentation, inscription au webinaire, page de remerciement et contact.",
    palette: "violet", fonts: { heading: "arial", body: "arial" },
    pages: [{ key: "accueil", name: "Événement", template: "evenement" }, { key: "inscription", name: "Inscription", template: "webinaire" }, { key: "merci", name: "Merci", template: "merci" }, { key: "contact", name: "Contact", template: "contact" }],
    menu: ["accueil", "inscription", "contact"] },
]);
module.exports = { PACKS };
