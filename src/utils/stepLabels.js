// Libellés français d'un type d'étape de scénario — module isomorphe (aucune dépendance), partagé par le serveur
// (src/marketing/automations/steps.js : contrôle avant activation, rapport par étape, journal d'un passage) et par
// le client (src/editor/automation-flow.js, bundlé par esbuild) : un seul endroit à tenir à jour.
const STEP_LABELS = { trigger: "Déclencheur", email: "Envoyer un e-mail", sms: "Envoyer un SMS", wait: "Attendre", wait_for_event: "Attendre jusqu'à", wait_until: "Attendre une date ou une heure", condition: "Condition", split: "Tirage aléatoire", update_field: "Mettre à jour un champ", add_tag: "Ajouter une étiquette", remove_tag: "Retirer une étiquette", add_to_list: "Ajouter à une liste", remove_from_list: "Retirer d'une liste", adjust_score: "Modifier le score", add_note: "Ajouter une note", end: "Fin" };
module.exports = { STEP_LABELS };
