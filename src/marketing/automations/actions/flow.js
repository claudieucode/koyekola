// Contrôle du parcours : fin du passage.
const { STEP_LABELS } = require("../../../utils/stepLabels");
const { defineAction } = require("./registry");

defineAction({
  type: "end", category: "fin", label: STEP_LABELS.end, description: "Le passage du contact s'arrête", version: 1, status: "available",
  validate: () => ({ type: "end" }),
  execute: () => ({ complete: true }),
});
