// Catalogue des événements auxquels un webhook sortant peut s'abonner. Reprend exactement les noms déjà émis
// ailleurs dans le module (voir automations/catalog.js pour les déclencheurs d'automatisation, un sous-ensemble
// de cette liste) : aucun nom inventé, un webhook ne peut être averti que d'événements qui existent réellement.
const EVENTS = {
  "lms.user_registered": "Un compte est créé sur KOLAKISA",
  "lms.order_completed": "Une commande est passée",
  "lms.course_enrolled": "Un élève s'inscrit à une formation",
  "lms.lesson_completed": "Un élève termine une leçon",
  "lms.course_progress_10": "Un élève atteint 10 % d'une formation",
  "lms.course_progress_50": "Un élève atteint 50 % d'une formation",
  "lms.course_progress_90": "Un élève atteint 90 % d'une formation",
  "lms.course_completed": "Un élève termine une formation",
  "lms.course_viewed": "Un contact consulte la fiche d'une formation",
  "lms.cart_added": "Un contact ajoute une formation au panier",
  "lms.checkout_started": "Un contact ouvre la page de commande",
  "lms.review_posted": "Un avis est publié",
  "lms.certificate_issued": "Un certificat est délivré",
  "lms.favorite_added": "Une formation est mise en favori",
  "contact.created": "Un contact est créé",
  "email.clicked": "Un contact clique dans un e-mail",
  "email.opened": "Un contact ouvre un e-mail (indicatif)",
  "contact.score_level_changed": "Le score d'un contact change de niveau",
  "contact.subscribed": "Un contact s'abonne (consentement prouvé)",
  "contact.unsubscribed": "Un contact se désinscrit",
  "contact.suppressed": "Une adresse est bloquée (rebond, plainte)",
  "tag.added": "Une étiquette est ajoutée",
  "list.member_added": "Un contact est ajouté à une liste",
  "form.submitted": "Un formulaire est envoyé",
  "page.visited": "Un contact visite une page (Site Web, Tunnels)",
  "funnel.step_reached": "Un contact atteint une étape d'un tunnel",
  "funnel.completed": "Un contact atteint la dernière étape d'un tunnel",
  "funnel.entered": "Un contact entre dans un tunnel",
  "funnel.step.completed": "Un contact termine une étape d'un tunnel",
  "funnel.abandoned": "Un contact abandonne un tunnel",
  "funnel.cta.clicked": "Un contact clique un bouton d'une étape de tunnel",
  "checkout.abandoned": "Un contact abandonne sa commande",
  "purchase.completed": "Un achat est terminé (commande payée)",
  "cart.abandoned": "Un contact abandonne son panier",
  "payment.failed": "Un paiement échoue",
  "refund.completed": "Un remboursement est effectué",
  "order.refunded": "Une commande est remboursée en totalité",
  "order.partially_refunded": "Une commande est remboursée en partie",
  "contacts.imported": "Un import de contacts est terminé",
  "campaign.sent": "Une campagne est terminée",
};

const isKnownEvent = (name) => name === "*" || Object.hasOwn(EVENTS, name);

module.exports = { EVENTS, isKnownEvent };
