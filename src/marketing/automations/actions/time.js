// Actions de temps. Aucun processus ne « dort » : le moteur enregistre une date de réveil en base (survit à un redémarrage).
const { STEP_LABELS } = require("../../../utils/stepLabels");
const { defineAction } = require("./registry");
const { UNITS, EVENT_NAME, bad, withNext, validDuration } = require("./shared");

defineAction({
  type: "wait", category: "temps", label: STEP_LABELS.wait, description: "Une durée fixe avant la suite", version: 1, status: "available",
  validate({ raw, i, steps }) {
    if (!validDuration(raw)) throw bad(i, "attente invalide (nombre entier ≥ 1, en minutes, heures ou jours, un an au plus).");
    return withNext({ type: "wait", amount: raw.amount, unit: raw.unit }, raw, i, steps);
  },
  execute: ({ step }) => ({ log: ["wait", `${step.amount} ${step.unit}`], wait: step.amount * UNITS[step.unit] }),
});

// Attend qu'un événement précis survienne pour CE contact (ex. « a terminé la formation ») ou, à défaut, le
// délai maximal — jamais une attente indéfinie (un contact ne doit jamais pouvoir rester bloqué pour
// toujours). Reprend alors la suite comme une attente ordinaire, un seul chemin, aucun embranchement.
// Techniquement une attente ORDINAIRE (même mécanisme de réveil par date) : la seule différence est qu'un
// événement correspondant, s'il arrive avant le délai, la fait AUSSI reprendre plus tôt — voir engine.js#onEvent.
defineAction({
  type: "wait_for_event", category: "temps", label: STEP_LABELS.wait_for_event, description: "Un événement, avec un délai maximal", version: 1, status: "available",
  validate({ raw, i, steps }) {
    if (typeof raw.event !== "string" || !EVENT_NAME.test(raw.event)) throw bad(i, "nom d'événement invalide (minuscules, chiffres, « _ » et « . », 2 à 64 caractères, commence par une lettre).");
    if (!validDuration(raw)) throw bad(i, "délai maximal invalide (nombre entier ≥ 1, en minutes, heures ou jours, un an au plus).");
    return withNext({ type: "wait_for_event", event: raw.event, amount: raw.amount, unit: raw.unit }, raw, i, steps);
  },
  execute: ({ step }) => ({ log: ["wait_for_event", `${step.event} (${step.amount} ${step.unit} au plus)`], wait: step.amount * UNITS[step.unit] }),
});
