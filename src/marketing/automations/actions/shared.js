// Éléments communs aux définitions d'actions (validation des sauts, durées, noms) — déplacés tels quels depuis steps.js.
const { MarketingError } = require("../../errors");

const UNITS = { minutes: 60000, hours: 3600000, days: 86400000 };
const MAX_WAIT_MS = 365 * 86400000;
// Même motif que celui appliqué par le bus d'événements (events/bus.js#NAME ; dupliqué aussi dans service.js) :
// « Attendre jusqu'à » doit pouvoir viser n'importe quel événement valide, pas seulement le catalogue TRIGGERS fermé.
const EVENT_NAME = /^[a-z][a-z0-9_.]{1,63}$/;
const bad = (i, message) => new MarketingError("invalid_automation", `Étape ${i + 1} : ${message}`);

// « next » (étape suivante), « exit » (sortir du scénario), ou le numéro d'une étape PLUS LOIN dans la liste
// (embranchement) — jamais en arrière : un saut arrière créerait une boucle (un contact pourrait ne jamais en
// sortir), et jamais un texte libre : un embranchement ne peut viser qu'une étape qui existe réellement.
function jumpTarget(value, i, stepsLength, label) {
  if (value === undefined || value === "next" || value === "continue") return "next"; // « continue » : alias historique
  if (value === "exit") return "exit";
  if (Number.isInteger(value) && value > i && value < stepsLength) return value;
  throw bad(i, `« ${label} » invalide (étape suivante, sortie du scénario, ou numéro d'une étape PLUS LOIN dans la liste — jamais en arrière, cela créerait une boucle).`);
}

// Saut explicite FACULTATIF après une étape ordinaire (pas seulement une condition) : nécessaire pour qu'un
// embranchement puisse reconverger n'importe où (l'éditeur graphique le permet). Absent = comportement historique
// inchangé (étape suivante). Ajouté seulement si fourni : ne change rien à la forme des scénarios existants.
function withNext(base, raw, i, steps) {
  if (raw.next === undefined) return base;
  return { ...base, next: jumpTarget(raw.next, i, steps.length, "Ensuite") };
}

function tagName(value, i) {
  const t = typeof value === "string" ? value.replace(/\p{Cc}/gu, "").trim() : "";
  if (!t) throw new MarketingError("invalid_field", `Étape ${i + 1} : le nom de l'étiquette est obligatoire.`);
  if (t.length > 64) throw new MarketingError("invalid_field", `Étape ${i + 1} : nom d'étiquette trop long (64 caractères au plus).`);
  return t;
}

// Durée « nombre entier ≥ 1 + unité », un an au plus (attente et délai maximal)
const validDuration = (raw) => Object.hasOwn(UNITS, raw.unit) && Number.isInteger(raw.amount) && raw.amount >= 1 && raw.amount * UNITS[raw.unit] <= MAX_WAIT_MS;

// Libellé d'une destination de saut pour le journal du passage
const branchLabel = (branch) => (branch === "exit" ? "sortie" : branch === "next" ? "étape suivante" : `étape ${branch + 1}`);

module.exports = { UNITS, MAX_WAIT_MS, EVENT_NAME, bad, jumpTarget, withNext, tagName, validDuration, branchLabel };
