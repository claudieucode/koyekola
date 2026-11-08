// Famille G · Alimentaire et artisanat
module.exports = {
  G01: { sec: ["Valeurs nutritionnelles et allergènes", "Indiquez ici les valeurs nutritionnelles, la liste des ingrédients et les allergènes."], note: ["Allergènes", "Indiquez ici les allergènes."], info: "c t p q b d m", sig: ["warn", "table"] },
  G02: { sec: ["Producteur et origine", "Indiquez ici le producteur, le lieu et le mode de production."], note: ["Le producteur", "Indiquez ici l'histoire du producteur."], info: "e t p q b", sig: ["story", "quote"] },
  G03: { sec: ["Livraison récurrente", "Indiquez ici les fréquences de livraison."], note: ["Fonctionnement de l'abonnement", "Indiquez ici comment modifier ou arrêter l'abonnement."], info: "t p q b d r", sig: ["steps", "faq"], label: "Composer mon panier" },
  G04: { sec: ["Dégustation", "Indiquez ici les notes de dégustation."], note: ["Conservation", "Indiquez ici la conservation."], info: "e T p q b", sig: ["care"], ttl: "50px", label: "Je craque" },
  G05: { sec: ["Profil de dégustation", "Indiquez ici le profil de dégustation (corps, acidité, notes)."], note: ["Préparation", "Indiquez ici la préparation conseillée."], info: "c t p q b m", sig: ["steps", "list"] },
  G06: { sec: ["L'atelier", "Indiquez ici l'histoire de l'atelier."], note: ["Le créateur", "Indiquez ici le parcours du créateur."], info: "e t p q m b", sig: ["quote", "rel:3"], relHead: "Du même atelier" },
  G07: { sec: ["Dimensions", "Indiquez ici les dimensions de la pièce."], note: ["Pièce unique", "Chaque pièce étant faite à la main, indiquez ici les variations possibles."], info: "g t p q b d", sig: ["warn", "care"] },
  G08: { sec: ["Message et délai", "Indiquez ici le délai de commande et le message possible."], note: ["Délai de commande", "Indiquez ici le délai de préparation."], info: "e t p q b m n", sig: ["ship", "faq"], label: "Commander ce gâteau" },
  G09: { sec: ["Composition du coffret", "Indiquez ici le contenu du coffret."], note: ["Contenu du coffret", "Indiquez ici les produits du coffret."], info: "t p b q d m", sig: ["list", "rel:3"], relHead: "Autres idées de cadeau" },
  G10: { sec: ["Labels et circuits courts", "Indiquez ici les labels et la distance de production."], note: ["Labels", "Indiquez ici vos labels."], info: "c t p b q", sig: ["benefits", "faq"], gx: "g" },
};
