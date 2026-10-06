// Catalogue des événements auxquels un webhook sortant peut s'abonner. Reprend exactement les noms déjà émis
// ailleurs dans le module (voir automations/catalog.js pour les déclencheurs d'automatisation, un sous-ensemble
// de cette liste) : aucun nom inventé, un webhook ne peut être averti que d'événements qui existent réellement.
const EVENTS = {
  "lms.user_registered": "Un compte est créé sur KOLAKISA",
  "lms.order_completed": "Une commande est passée",
  "lms.course_enrolled": "Un élève s'inscrit à une formation",
  "lms.lesson_completed": "Un élève termine une leçon",
  "lms.course_completed": "Un élève termine une formation",
  "lms.review_posted": "Un avis est publié",
  "lms.favorite_added": "Une formation est mise en favori",
  "contact.created": "Un contact est créé",
  "contact.subscribed": "Un contact s'abonne (consentement prouvé)",
  "contact.unsubscribed": "Un contact se désinscrit",
  "contact.suppressed": "Une adresse est bloquée (rebond, plainte)",
  "tag.added": "Une étiquette est ajoutée",
  "list.member_added": "Un contact est ajouté à une liste",
  "form.submitted": "Un formulaire est envoyé",
  "contacts.imported": "Un import de contacts est terminé",
  "campaign.sent": "Une campagne est terminée",
};

const isKnownEvent = (name) => name === "*" || Object.hasOwn(EVENTS, name);

module.exports = { EVENTS, isKnownEvent };
