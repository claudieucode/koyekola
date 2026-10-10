// Déclencheurs disponibles (événements du bus) et filtres autorisés. Les libellés sont ceux de l'interface.
// Filtre : [clé, libellé, liste de choix éventuelle] — la liste (pages, tunnels, formulaires…) est fournie par l'éditeur
// à partir des vraies données, pour ne jamais demander un identifiant à saisir à la main.
const TRIGGERS = {
  "lms.user_registered": { label: "Un compte est créé sur KOLAKISA", filters: [] },
  "lms.order_completed": { label: "Une commande est passée", filters: [["courseId", "Formation achetée", "courses"]] },
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
  "funnel.entered": { label: "Un contact entre dans un tunnel", filters: [["funnelId", "Tunnel", "funnels"]] },
  "funnel.step_reached": { label: "Un contact atteint une étape d'un tunnel", filters: [["stepId", "Étape", "funnelSteps"]] },
  "funnel.step.completed": { label: "Un contact termine une étape d'un tunnel", filters: [["stepId", "Étape", "funnelSteps"]] },
  "funnel.completed": { label: "Un contact atteint la dernière étape d'un tunnel", filters: [["funnelId", "Tunnel", "funnels"]] },
  "funnel.cta.clicked": { label: "Un contact clique un bouton d'une étape de tunnel", filters: [["stepId", "Étape", "funnelSteps"]] },
  "funnel.abandoned": { label: "Un contact abandonne un tunnel (délai sans activité, réglable)", filters: [["funnelId", "Tunnel", "funnels"]] },
  // Commande (palier 19) : dérivés d'événements réels de la boutique ; la commande reste la source de vérité du paiement
  "checkout.abandoned": { label: "Un contact abandonne sa commande (page ouverte, aucune commande après le délai)", filters: [] },
  "purchase.completed": { label: "Un achat est terminé (commande payée)", filters: [["courseId", "Formation achetée", "courses"]] },
  // Commerce (palier 20)
  "cart.abandoned": { label: "Un contact abandonne son panier (formation ajoutée, aucune commande après le délai)", filters: [["courseId", "Formation", "courses"]] },
  "payment.failed": { label: "Un paiement échoue", filters: [] },
  "refund.completed": { label: "Un remboursement est effectué (Stripe)", filters: [] },
  "order.refunded": { label: "Une commande est remboursée en totalité", filters: [] },
  "order.partially_refunded": { label: "Une commande est remboursée en partie", filters: [] },
};
// D'où vient le déclencheur : affiché dans le scénario (le tunnel produit, le Contact Core conserve, l'automatisation décide)
const SOURCE_LABELS = { cms: "CMS", funnel: "Tunnel", email: "E-mail", commerce: "Boutique", contact: "Contact Core", lms: "KOLAKISA (formations)", site: "Site Web" };
function sourceOf(event) {
  if (/^funnel\./.test(event)) return "funnel";
  if (/^(email|sms)\./.test(event)) return "email";
  if (/^(checkout|purchase|cart|payment|refund|order)\./.test(event) || event === "lms.order_completed" || event === "lms.cart_added" || event === "lms.checkout_started") return "commerce";
  if (/^(contact|tag|list|user|comment)\./.test(event) || event === "form.submitted") return "contact";
  if (/^(page)\./.test(event)) return "site";
  if (/^lms\./.test(event)) return "lms";
  return "contact";
}
// Un filtre de déclencheur correspond-il aux données de l'événement ? « courseId » vaut aussi pour une commande de plusieurs formations (liste « courseIds »)
function filterMatches(md, filter) {
  if (!filter || !filter.key) return true;
  const data = md && typeof md === "object" ? md : {};
  if (String(data[filter.key]) === String(filter.value)) return true;
  return filter.key === "courseId" && Array.isArray(data.courseIds) && data.courseIds.map(String).includes(String(filter.value));
}
module.exports = { TRIGGERS, SOURCE_LABELS, sourceOf, filterMatches };
