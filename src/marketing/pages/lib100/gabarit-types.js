// Programme 100 : types de pages (pageTypes.js) réellement couverts par chaque gabarit de page ajouté (lib100/pages.js). Un identifiant inconnu ou un type qui exige une fonction absente fait échouer le test de cohérence.
module.exports = {
  "hotel-accueil": ["accueil", "page-locale"], "hotel-chambres": ["offre", "service"], "hotel-services": ["services"], "hotel-reservation": ["reservation"], "hotel-acces": ["contact", "page-locale"],
  "sante-accueil": ["accueil", "page-locale"], "sante-soins": ["services"], "sante-equipe": ["equipe", "apropos"], "sante-rdv": ["rdv", "reservation"], "sante-infos-patients": ["centre-aide", "faq"],
  "coaching-accueil": ["accueil", "profil-pro"], "coaching-methode": ["services"], "coaching-offres": ["offre", "tarifs"], "coaching-decouverte": ["rdv", "consultation"],
  "musique-accueil": ["accueil"], "musique-cours": ["presentation-cours"], "musique-tarifs": ["tarifs"], "musique-inscription": ["inscription", "inscription-formation"],
  "archi-accueil": ["accueil", "portfolio"], "archi-projets": ["projet", "galerie"], "archi-processus": ["services"], "archi-devis": ["devis"],
  "juridique-accueil": ["accueil", "profil-pro"], "juridique-domaines": ["services", "secteur"], "juridique-honoraires": ["tarifs"], "juridique-rdv": ["rdv", "consultation"],
  "ferme-accueil": ["accueil", "page-locale"], "ferme-produits": ["offre"], "ferme-paniers": ["offre"], "ferme-visite": ["reservation", "evenement"],
  "mariage-accueil": ["accueil"], "mariage-formules": ["offre", "tarifs"], "mariage-realisations": ["galerie", "portfolio"], "mariage-devis": ["devis"],
  "sport-accueil": ["accueil", "page-locale"], "sport-cours": ["programme"], "sport-abonnements": ["tarifs"], "sport-essai": ["reservation", "inscription"],
  "saasb2b-accueil": ["accueil", "application"], "saasb2b-fonctionnalites": ["application", "produit-numerique"], "saasb2b-tarifs": ["tarifs", "comparaison"], "saasb2b-securite": ["documentation"], "saasb2b-demo": ["rdv", "devis"],
  "btp-accueil": ["accueil"], "btp-services": ["services"], "btp-realisations": ["projet", "references"], "btp-devis": ["devis"],
  "tourisme-accueil": ["accueil", "page-locale"], "tourisme-sejours": ["offre"], "tourisme-itineraire": ["programme"], "tourisme-reservation": ["reservation"],
  "apropos-recit": ["apropos"], equipe: ["equipe"], galerie: ["galerie"], "faq-complete": ["faq", "centre-aide"], confidentialite: ["confidentialite", "cookies"], "merci-confirmation": ["remerciement", "confirmation"], "mentions-legales": ["mentions", "conditions"],
};
