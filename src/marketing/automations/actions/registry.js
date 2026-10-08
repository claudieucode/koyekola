// Registre des actions d'un scénario : LA source de vérité côté serveur (libellé, catégorie, statut, validation,
// exécution). Ajouter une action = écrire sa définition dans un fichier de ce dossier et l'enregistrer dans index.js ;
// ni steps.js (validation) ni engine.js (exécution) n'ont à changer.
//
// Une définition :
//   type         identifiant stocké dans le scénario (« email », « wait »…), minuscules et « _ »
//   category     une des CATEGORIES (même découpage que la palette de l'éditeur)
//   label        libellé français — celui de utils/stepLabels.js (un seul endroit à tenir à jour)
//   description  phrase courte affichée dans la palette
//   version      numéro de version de la définition (monte quand la configuration change)
//   status       « available » (exécutable de bout en bout) ou « future » (jamais proposée à l'insertion)
//   requires     capacités externes nécessaires (ex. « sms_provider ») — informatif pour l'instant
//   validate({ ctx, raw, i, steps, kind })  → étape normalisée, ou lève une MarketingError
//   execute(env)                            → résultat d'exécution (voir RÉSULTATS)
//
// RÉSULTATS d'`execute` (le moteur est seul juge de ce qu'il en fait) :
//   { next: true }               étape suivante          { jump: n }       sauter à l'étape n (vers l'avant)
//   { wait: ms }                 attendre puis reprendre à l'étape suivante
//   { retry: ms, attempts? }     réessayer cette étape plus tard
//   { exit: "raison" }           sortir du scénario      { complete: true } terminer normalement
//   { pause: "message" }         mettre le scénario en pause (configuration cassée)
//   + facultatif : log: [action, détail] écrit au journal du passage avant la suite
const { checkCapability } = require("./capabilities");
const CATEGORIES = ["communication", "temps", "logique", "contact", "fin"];
const STATUSES = ["available", "future"];
const TYPE = /^[a-z][a-z_]{1,30}$/;

const actions = new Map(); // ordre d'enregistrement conservé (sert aussi au message « type inconnu »)

function defineAction(def) {
  if (!def || typeof def !== "object") throw new Error("Définition d'action invalide.");
  if (!TYPE.test(String(def.type))) throw new Error(`Type d'action invalide : « ${def.type} ».`);
  if (actions.has(def.type)) throw new Error(`Action « ${def.type} » déjà enregistrée.`);
  if (!CATEGORIES.includes(def.category)) throw new Error(`Action « ${def.type} » : catégorie inconnue.`);
  if (!STATUSES.includes(def.status)) throw new Error(`Action « ${def.type} » : statut inconnu.`);
  for (const key of ["label", "description"]) if (typeof def[key] !== "string" || !def[key]) throw new Error(`Action « ${def.type} » : « ${key} » obligatoire.`);
  if (!Number.isInteger(def.version) || def.version < 1) throw new Error(`Action « ${def.type} » : version invalide.`);
  if (typeof def.validate !== "function") throw new Error(`Action « ${def.type} » : « validate » obligatoire.`);
  if (typeof def.execute !== "function") throw new Error(`Action « ${def.type} » : « execute » obligatoire.`);
  actions.set(def.type, { requires: [], ...def });
  return def;
}

const getAction = (type) => (typeof type === "string" ? actions.get(type) : undefined);
const listActions = () => [...actions.values()];
const actionTypes = () => [...actions.keys()];

// Disponibilité d'une action pour une organisation, CALCULÉE sur l'état réel (jamais déclarée) :
//   « available »            exécutable de bout en bout maintenant
//   « connection_required »  exécutable une fois la connexion réglée (fournisseur d'e-mails, SMS…) : la raison est donnée
//   « future »               pas encore construite : jamais proposée à l'insertion
function availabilityOf(def, ctx) {
  if (def.status === "future") return { state: "future", reasons: [] };
  const reasons = ctx ? def.requires.map((key) => checkCapability(ctx, key)) : [];
  return { state: reasons.some((r) => !r.ok) ? "connection_required" : "available", reasons };
}

// Version sérialisable (sans fonctions) : de quoi construire la palette depuis le serveur. Avec `ctx` : disponibilité réelle
// de chaque action ; sans : seulement leur identité.
const describeActions = (ctx) => listActions().map((def) => {
  const { type, category, label, description, version, status, requires } = def;
  return { type, category, label, description, version, status, requires, ...(ctx ? { availability: availabilityOf(def, ctx) } : {}) };
});

module.exports = { CATEGORIES, defineAction, getAction, listActions, actionTypes, describeActions, availabilityOf };
