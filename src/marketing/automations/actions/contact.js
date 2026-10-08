// Actions sur le contact : champ, étiquettes, listes. Les actions d'un scénario N'ÉMETTENT AUCUN événement
// (le moteur leur passe un contexte sans bus ni audit) : impossible de chaîner des scénarios en boucle.
const { MarketingError } = require("../../errors");
const { updateContact } = require("../../audience/contacts");
const { setContactProperties } = require("../../audience/properties");
const { tagContact, untagContact } = require("../../audience/tags");
const { getList, addToList, removeFromList } = require("../../audience/lists");
const { STEP_LABELS } = require("../../../utils/stepLabels");
const { defineAction } = require("./registry");
const { bad, withNext, tagName } = require("./shared");

// Champs du contact modifiables par l'action « Mettre à jour un champ » — mêmes champs texte que
// audience/contacts.js#TEXT_FIELDS (jamais l'e-mail ni le statut, qui ne se changent pas ainsi ; jamais
// lms_user_id, un lien technique qui n'a pas sa place dans un scénario). Une propriété personnalisée se vise par
// « property:<clé> » (validée par setContactProperties, qui connaît le type réel de la propriété).
const EDITABLE_FIELDS = ["first_name", "last_name", "phone", "company", "country", "language", "source"];
const PROPERTY_FIELD = /^property:[a-z][a-z0-9_]{0,39}$/;

// Exécute l'écriture ; une erreur métier est notée au journal et le scénario continue (comportement historique)
function attempt(logLabel, run) {
  try { run(); return { next: true, log: [logLabel.action, logLabel.detail] }; }
  catch (error) {
    if (!(error instanceof MarketingError)) throw error;
    return { next: true, log: ["failed", error.message] };
  }
}

defineAction({
  type: "update_field", category: "contact", label: STEP_LABELS.update_field, description: "Prénom, société, propriété…", version: 1, status: "available",
  validate({ raw, i, steps }) {
    const field = typeof raw.field === "string" ? raw.field : "";
    if (!EDITABLE_FIELDS.includes(field) && !PROPERTY_FIELD.test(field)) throw bad(i, "champ invalide (prénom, nom, téléphone, société, pays, langue, source, ou une propriété personnalisée).");
    const value = typeof raw.value === "string" ? raw.value.replace(/\p{Cc}/gu, "").trim() : "";
    if (value.length > 300) throw bad(i, "valeur trop longue (300 caractères au plus).");
    return withNext({ type: "update_field", field, value }, raw, i, steps);
  },
  execute: ({ ctx, step, contact }) => attempt({ action: "update_field", detail: step.field }, () => {
    if (step.field.startsWith("property:")) setContactProperties(ctx, contact.id, { [step.field.slice(9)]: step.value });
    else updateContact(ctx, contact.id, { [step.field]: step.value });
  }),
});

defineAction({
  type: "add_tag", category: "contact", label: STEP_LABELS.add_tag, description: "Étiquette existante ou nouvelle", version: 1, status: "available",
  validate: ({ raw, i, steps }) => withNext({ type: "add_tag", tag: tagName(raw.tag, i) }, raw, i, steps),
  execute: ({ ctx, step, contact }) => attempt({ action: "add_tag", detail: step.tag }, () => tagContact(ctx, contact.id, step.tag)),
});

defineAction({
  type: "remove_tag", category: "contact", label: STEP_LABELS.remove_tag, description: "Retire une étiquette du contact", version: 1, status: "available",
  validate: ({ raw, i, steps }) => withNext({ type: "remove_tag", tag: tagName(raw.tag, i) }, raw, i, steps),
  execute: ({ ctx, step, contact }) => attempt({ action: "remove_tag", detail: step.tag }, () => untagContact(ctx, contact.id, step.tag)),
});

// La liste doit exister au moment de l'enregistrement du scénario
function listStep(type) {
  return ({ ctx, raw, i, steps }) => {
    if (!Number.isInteger(raw.listId) || !getList(ctx, raw.listId)) throw new MarketingError("not_found", `Étape ${i + 1} : liste introuvable.`);
    return withNext({ type, listId: raw.listId }, raw, i, steps);
  };
}

defineAction({
  type: "add_to_list", category: "contact", label: STEP_LABELS.add_to_list, description: "Inscrit le contact à une liste", version: 1, status: "available",
  validate: listStep("add_to_list"),
  execute: ({ ctx, step, contact }) => attempt({ action: "add_to_list", detail: step.listId }, () => addToList(ctx, step.listId, [contact.id])),
});

defineAction({
  type: "remove_from_list", category: "contact", label: STEP_LABELS.remove_from_list, description: "Désinscrit le contact d'une liste", version: 1, status: "available",
  validate: listStep("remove_from_list"),
  execute: ({ ctx, step, contact }) => attempt({ action: "remove_from_list", detail: step.listId }, () => removeFromList(ctx, step.listId, [contact.id])),
});
