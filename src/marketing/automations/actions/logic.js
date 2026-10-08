// Actions de logique : condition (oui / non) et tirage aléatoire (A / B).
const { MarketingError } = require("../../errors");
const segments = require("../../segments");
const { STEP_LABELS } = require("../../../utils/stepLabels");
const { defineAction } = require("./registry");
const { bad, jumpTarget, branchLabel } = require("./shared");

const CHECKS = ["segment", "opened", "clicked"];

// Destination d'un embranchement → résultat d'exécution (« exit » sort, « next » continue, un numéro saute)
const route = (branch, reason, log) => (branch === "exit" ? { log, exit: reason } : branch === "next" ? { log, next: true } : { log, jump: branch });

defineAction({
  type: "condition", category: "logique", label: STEP_LABELS.condition, description: "Deux chemins : oui / non", version: 1, status: "available",
  validate({ ctx, raw, i, steps }) {
    const check = raw.check === undefined ? "segment" : raw.check;
    if (!CHECKS.includes(check)) throw bad(i, "type de condition inconnu (segment, opened, clicked).");
    let extra;
    if (check === "segment") {
      segments.validateDefinition(ctx, raw.definition);
      extra = { definition: raw.definition };
    } else {
      // « L'e-mail de l'étape N a-t-il été ouvert/cliqué ? » : ne peut désigner qu'un envoi déjà passé dans CE scénario
      if (!Number.isInteger(raw.ref) || raw.ref < 0 || raw.ref >= i || !steps[raw.ref] || steps[raw.ref].type !== "email") {
        throw bad(i, "doit désigner une étape « Envoyer un e-mail » qui la précède.");
      }
      extra = { ref: raw.ref };
    }
    const onTrue = jumpTarget(raw.onTrue, i, steps.length, "Si oui");
    const onFalse = jumpTarget(raw.onFalse === undefined ? "exit" : raw.onFalse, i, steps.length, "Sinon");
    return { type: "condition", check, ...extra, onTrue, onFalse };
  },
  execute({ ctx, step, steps, contact }) {
    let ok;
    try {
      if (step.check === "opened" || step.check === "clicked") {
        // L'étape référencée (un envoi d'e-mail PLUS TÔT dans ce même passage) a-t-elle été ouverte/cliquée par ce contact ?
        const refStep = steps[step.ref];
        const message = refStep && refStep.campaignId ? ctx.db.prepare("SELECT open_count, click_count FROM mk_messages WHERE campaign_id = ? AND contact_id = ?").get(refStep.campaignId, contact.id) : null;
        ok = Boolean(message && (step.check === "opened" ? message.open_count > 0 : message.click_count > 0));
      } else {
        ok = segments.matches(ctx, step.definition, contact.id);
      }
    } catch (error) {
      if (!(error instanceof MarketingError)) throw error;
      return { log: ["failed", "condition invalide"], exit: "condition_error" };
    }
    const branch = ok ? step.onTrue : step.onFalse;
    return route(branch, "condition", ["condition", `${ok ? "vraie" : "fausse"} → ${branchLabel(branch)}`]);
  },
});

// Tirage aléatoire (pas de donnée du contact) : « A » avec la probabilité indiquée, « B » sinon — utile pour
// un test A/B simple sur le parcours lui-même (pas seulement sur le contenu d'un e-mail).
defineAction({
  type: "split", category: "logique", label: STEP_LABELS.split, description: "Deux chemins tirés au sort : A / B", version: 1, status: "available",
  validate({ raw, i, steps }) {
    if (!Number.isInteger(raw.percentage) || raw.percentage < 1 || raw.percentage > 99) throw bad(i, "pourcentage invalide (nombre entier de 1 à 99).");
    const onA = jumpTarget(raw.onA, i, steps.length, "Chemin A");
    const onB = jumpTarget(raw.onB === undefined ? "exit" : raw.onB, i, steps.length, "Chemin B");
    return { type: "split", percentage: raw.percentage, onA, onB };
  },
  execute({ step }) {
    const ok = Math.random() * 100 < step.percentage;
    const branch = ok ? step.onA : step.onB;
    return route(branch, "split", ["split", `${step.percentage}% → ${ok ? "A" : "B"} (${branchLabel(branch)})`]);
  },
});

module.exports = { CHECKS };
