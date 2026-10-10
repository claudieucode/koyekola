// Déclencheurs disponibles (événements du bus) et filtres autorisés. Les libellés sont ceux de l'interface.
// Filtre : [clé, libellé, liste de choix éventuelle] — la liste (pages, tunnels, formulaires…) est fournie par l'éditeur
// à partir des vraies données, pour ne jamais demander un identifiant à saisir à la main.
const TRIGGERS = {
  "lms.user_registered": { label: "Un compte est créé sur KOLAKISA", filters: [] },
  "lms.order_completed": { label: "Une commande est passée", filters: [] },
  "lms.course_enrolled": { label: "Un élève s'inscrit à une formation", filters: [["courseId", "Formation", "courses"]] },
  "lms.lesson_completed": { label: "Un élève termine une leçon", filters: [["courseId", "Formation", "courses"]] },
  "lms.course_progress_10": { label: "Un élève atteint 10 % d'une formation", filters: [["courseId", "Formation", "courses"]] },
  "lms.course_progress_50": { label: "Un élève atteint 50 % d'une formation", filters: [["courseId", "Formation", "courses"]] },
  "lms.course_progress_90": { label: "Un élève atteint 90 % d'une formation", filters: [["courseId", "Formation", "courses"]] },
  "lms.course_completed": { label: "Un élève termine une formation (100 %)", filters: [["courseId", "Formation", "courses"]] },
  "lms.certificate_issued": { label: "Un certificat est délivré", filters: [["courseId", "Formation", "courses"]] },
  "lms.review_posted": { label: "Un avis est publié", filters: [["courseId", "Formation", "courses"]] },
  "lms.favorite_added": { label: "Une formation est mise en favori", filters: [["courseId", "Formation", "courses"]] },
  // E-commerce (phase 11) : contacts connus ayant accepté la mesure d'audience
  "lms.course_viewed": { label: "Un contact consulte la fiche d'une formation", filters: [["courseId", "Formation", "courses"]] },
  "lms.cart_added": { label: "Un contact ajoute une formation au panier", filters: [["courseId", "Formation", "courses"]] },
  "lms.checkout_started": { label: "Un contact ouvre la page de commande", filters: [] },
  // E-mails (phase 13) : premier clic sur un lien, première ouverture (indicative : certaines messageries ouvrent seules)
  "email.clicked": { label: "Un contact clique dans un e-mail", filters: [] },
  "email.opened": { label: "Un contact ouvre un e-mail (indicatif)", filters: [] },
  // Score des contacts (phase 13) : le contact change de niveau (froid, intéressé, chaud…)
  "contact.score_level_changed": { label: "Le score d'un contact change de niveau", filters: [["levelId", "Niveau atteint", "scoreLevels"]] },
  // Contact Core (palier 15) et Email Engine (palier 16) : événements réellement émis, avec un contact identifié
  "user.registered": { label: "Un compte est créé (immédiat, Contact Core)", filters: [] },
  "contact.lifecycle_changed": { label: "Le cycle de vie d'un contact change", filters: [["to", "Étape atteinte (client, membre…)"]] },
  "email.delivered": { label: "Un e-mail est livré", filters: [] },
  "email.bounced": { label: "Un e-mail rebondit", filters: [] },
  "email.complained": { label: "Un contact signale un e-mail comme indésirable", filters: [] },
  "comment.approved": { label: "Un commentaire d'un contact connu est publié", filters: [] },
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
