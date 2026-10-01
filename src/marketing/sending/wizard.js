// Étapes de la création guidée d'une campagne (7) : les quatre premières se remplissent à la création du brouillon,
// les trois dernières (test, contrôle, envoi) se poursuivent sur la page du brouillon. Calcul pur : rien n'est écrit ici.
// Le LANCEMENT reste bloqué par le serveur (dispatch.startCampaign) tant que le contrôle avant envoi a des erreurs.
const STEP_KEYS = ["infos", "audience", "template", "tracking", "test", "check", "send"];
const LABELS = { infos: "Nom", audience: "Destinataires", template: "Modèle", tracking: "Suivi", test: "Test", check: "Contrôle", send: "Envoi" };
const AUDIENCE_ERRORS = ["no_audience", "target_missing"];
const TEMPLATE_ERRORS = ["template_missing", "template_not_ready"];

// campaign : ligne mk_campaigns ; check : résultat de preflight (null si déjà lancée) ; tested : un e-mail de test a été envoyé
function wizardSteps(campaign, { check, tested = false } = {}) {
  const launched = campaign.status !== "draft";
  const errorsOf = (codes) => (check ? check.errors.filter((e) => codes.includes(e.code)) : []);
  const otherErrors = check ? check.errors.filter((e) => ![...AUDIENCE_ERRORS, ...TEMPLATE_ERRORS].includes(e.code)) : [];
  const steps = [];
  const add = (key, state, detail, extra = {}) => steps.push({ key, label: LABELS[key], state: launched ? "done" : state, detail, ...extra });

  add("infos", "done", campaign.name);
  const audienceErrors = errorsOf(AUDIENCE_ERRORS);
  const summary = check && check.audience;
  add("audience", audienceErrors.length ? "error" : "done", audienceErrors.length ? audienceErrors[0].message : summary ? `${summary.sendable} contact${summary.sendable > 1 ? "s" : ""} joignable${summary.sendable > 1 ? "s" : ""} sur ${summary.targetTotal}.` : "");
  const templateErrors = errorsOf(TEMPLATE_ERRORS);
  add("template", templateErrors.length ? "error" : "done", templateErrors.length ? templateErrors[0].message : "Modèle prêt.");
  add("tracking", "done", `${campaign.track_clicks ? "Clics suivis" : "Clics non suivis"} · ${campaign.track_opens ? "ouvertures suivies (indicatif)" : "ouvertures non suivies"}.`);
  add("test", tested ? "done" : "todo", tested ? "Un e-mail de test a été envoyé." : "Facultatif : envoyez-vous un test pour vérifier le rendu.", { optional: true });
  const blocked = Boolean(check) && !check.ready;
  add("check", blocked ? "error" : "done", otherErrors.length ? otherErrors[0].message : blocked ? "Corrigez les étapes précédentes." : check ? "Aucun blocage." : "");
  const ready = Boolean(check && check.ready) && !launched;
  add("send", "todo", ready ? "Prête à être lancée." : launched ? "Campagne lancée." : "Bloqué tant que le contrôle avant envoi a des erreurs.");

  const done = steps.filter((s) => s.state === "done").length;
  const blocking = steps.find((s) => s.state === "error") || steps.find((s) => s.state !== "done" && !s.optional);
  return { steps, done, total: steps.length, percent: Math.round((done / steps.length) * 100), current: launched ? null : blocking ? blocking.key : null, canSend: ready };
}

module.exports = { STEP_KEYS, wizardSteps };
