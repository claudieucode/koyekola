// Validation et normalisation des étapes d'un scénario (grammaire fermée : aucune étape « libre »).
// Un champ inconnu est supprimé ; une étape invalide est refusée avec son numéro.
// Les règles de chaque type d'étape vivent dans le registre des actions (actions/) : ce fichier ne fait que les appliquer.
const { MarketingError } = require("../errors");
const { STEP_LABELS } = require("../../utils/stepLabels");
const { getAction, actionTypes } = require("./actions");
const { UNITS, bad } = require("./actions/shared");
const { CHECKS } = require("./actions/logic");

const MAX_STEPS = 30;

function validateSteps(ctx, steps, kind) {
  if (!Array.isArray(steps)) throw new MarketingError("invalid_automation", "Les étapes doivent être une liste.");
  if (steps.length > MAX_STEPS) throw new MarketingError("invalid_automation", `Trop d'étapes (${MAX_STEPS} au plus).`);
  return steps.map((raw, i) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw bad(i, "objet attendu.");
    const action = getAction(raw.type);
    if (!action) throw bad(i, `type d'étape inconnu « ${String(raw.type).slice(0, 30)} » (${actionTypes().join(", ")}).`);
    return action.validate({ ctx, raw, i, steps, kind });
  });
}

module.exports = { validateSteps, UNITS, MAX_STEPS, CHECKS, STEP_LABELS };
