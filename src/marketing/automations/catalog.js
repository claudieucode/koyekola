// Déclencheurs disponibles (événements du bus) et filtres autorisés. Les libellés sont ceux de l'interface.
const TRIGGERS = {
  "lms.user_registered": { label: "Un compte est créé sur KOLAKISA", filters: [] },
  "lms.order_completed": { label: "Une commande est passée", filters: [] },
  "lms.course_enrolled": { label: "Un élève s'inscrit à une formation", filters: [["courseId", "Identifiant de la formation"]] },
  "lms.lesson_completed": { label: "Un élève termine une leçon", filters: [["courseId", "Identifiant de la formation"]] },
  "lms.course_completed": { label: "Un élève termine une formation", filters: [["courseId", "Identifiant de la formation"]] },
  "lms.review_posted": { label: "Un avis est publié", filters: [["courseId", "Identifiant de la formation"]] },
  "lms.favorite_added": { label: "Une formation est mise en favori", filters: [["courseId", "Identifiant de la formation"]] },
  "contact.created": { label: "Un contact est créé", filters: [] },
  "contact.subscribed": { label: "Un contact s'abonne (consentement prouvé)", filters: [] },
  "tag.added": { label: "Une étiquette est ajoutée", filters: [["tag", "Nom de l'étiquette"]] },
  "list.member_added": { label: "Un contact est ajouté à une liste", filters: [["listId", "Identifiant de la liste"]] },
};
module.exports = { TRIGGERS };
