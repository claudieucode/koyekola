// Déclencheurs disponibles (événements du bus) et filtres autorisés. Les libellés sont ceux de l'interface.
// Filtre : [clé, libellé, liste de choix éventuelle] — la liste (pages, tunnels, formulaires…) est fournie par l'éditeur
// à partir des vraies données, pour ne jamais demander un identifiant à saisir à la main.
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
  "contact.sms_subscribed": { label: "Un contact accepte les SMS (accord SMS prouvé)", filters: [] },
  "tag.added": { label: "Une étiquette est ajoutée", filters: [["tag", "Nom de l'étiquette"]] },
  "list.member_added": { label: "Un contact est ajouté à une liste", filters: [["listId", "Identifiant de la liste"]] },
  "form.submitted": { label: "Un formulaire est envoyé", filters: [["formId", "Formulaire", "forms"]] },
  // Site Web et Tunnels (phase 10) : visites des contacts connus ayant accepté la mesure d'audience
  "page.visited": { label: "Un contact visite une page (Site Web, Tunnels)", filters: [["pageId", "Page", "pages"]] },
  "funnel.step_reached": { label: "Un contact atteint une étape d'un tunnel", filters: [["stepId", "Étape", "funnelSteps"]] },
  "funnel.completed": { label: "Un contact atteint la dernière étape d'un tunnel", filters: [["funnelId", "Tunnel", "funnels"]] },
};
module.exports = { TRIGGERS };
