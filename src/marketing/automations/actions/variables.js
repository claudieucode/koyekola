// Variables disponibles dans les textes écrits dans une étape (webhook, notification à l'équipe) : le contact et l'événement
// déclencheur du passage — mêmes données que dans les e-mails du scénario. Une variable sans valeur donne une chaîne vide
// (jamais « undefined », jamais le texte de la variable). Les variables sont fermées : toute autre est refusée à l'enregistrement.
const CONTACT_VARS = { email: "email", prenom: "first_name", nom: "last_name", telephone: "phone", societe: "company", pays: "country", score: "score" };
const EVENT_VARS = ["course_title", "course_url", "order_total", "order_id", "lesson_title", "learn_url"];
const BASE_VARIABLES = [...Object.keys(CONTACT_VARS), ...EVENT_VARS.map((v) => `event.${v}`)];
const TOKEN = /\{\{\s*([a-z_.]+)\s*\}\}/g;

// Valeurs réelles pour un contact et un passage ; `extra` : variables propres à une action (ex. contact_url)
function valuesFor({ contact, run, extra = {} }) {
  let eventData = {};
  try { eventData = JSON.parse((run && run.event_data) || "{}"); } catch { eventData = {}; }
  const vars = { ...extra };
  for (const [name, column] of Object.entries(CONTACT_VARS)) vars[name] = contact[column];
  for (const v of EVENT_VARS) vars[`event.${v}`] = eventData[v];
  return vars;
}
const render = (template, vars) => String(template).replace(TOKEN, (m, name) => (Object.hasOwn(vars, name) ? String(vars[name] ?? "") : m));
const unknownTokens = (text, allowed) => [...String(text).matchAll(TOKEN)].map((m) => m[1]).filter((v) => !allowed.includes(v));
const listText = (allowed) => allowed.map((v) => `{{${v}}}`).join(", ");

module.exports = { BASE_VARIABLES, valuesFor, render, unknownTokens, listText, TOKEN };
