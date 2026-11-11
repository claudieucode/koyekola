// Famille J · Spécialisés. Pas de fonction inexistante : le lien partenaire, le groupé, la précommande… sont décrits par des consignes éditables.
module.exports = {
  J01: { sec: ["Personnalisation", "Indiquez ici les règles de personnalisation."], note: ["Personnalisation", "Ajoutez le texte dans le champ de la fiche d'achat."], info: "e t p q b", sig: ["steps", "warn"] },
  J02: { sec: ["Partenaire", "Indiquez ici le partenaire et le lien d'achat."], note: ["Achat chez le partenaire", "Indiquez ici où acheter."], info: "c t p q b d", sig: ["cta", "faq"] },
  J03: { sec: ["Composition du lot", "Indiquez ici la composition du lot."], note: ["Composition", "Indiquez ici les produits du lot."], info: "t p b q d m", sig: ["list", "rel:3"], relHead: "Produits du même lot" },
  J04: { sec: ["Fréquences et avantages", "Indiquez ici les fréquences et les avantages."], note: ["Avantages", "Indiquez ici les avantages."], info: "e t p q b d R", sig: ["benefits", "faq"] },
  J05: { sec: ["Date annoncée", "Indiquez ici la date annoncée de livraison."], note: ["Précommande", "Indiquez ici l'acompte, la date prévue et les conditions."], info: "g T p q b", sig: ["ship", "steps"], label: "Précommander" },
  J06: { sec: ["Accès réservé", "Indiquez ici l'accès réservé aux membres."], note: ["Accès membres", "Indiquez ici les conditions d'accès."], info: "e t p q m b n", sig: ["cta", "faq"] },
  J07: { sec: ["Créneaux et lieu", "Indiquez ici les créneaux et le lieu."], note: ["Votre réservation", "Indiquez ici le déroulement de la réservation."], info: "c t p q b m", sig: ["steps", "ship"], label: "Réserver" },
  J08: { sec: ["Références", "Indiquez ici les références techniques."], note: ["Demande de devis", "Indiquez ici comment demander un devis."], info: "c t u q d m", sig: ["cta", "specs"] },
  J09: { sec: ["Tarifs dégressifs", "Indiquez ici le tableau des prix par quantité."], note: ["Prix par quantité", "Indiquez ici les paliers."], info: "e t u p q b", sig: ["table", "cta"] },
  J10: { sec: ["Offrir en trois clics", "Indiquez ici les étapes pour offrir."], note: ["Message cadeau", "Indiquez ici comment ajouter un mot."], info: "g t p b q r", sig: ["steps", "rel:3"], relHead: "Autres idées de cadeau", label: "Offrir" },
};
