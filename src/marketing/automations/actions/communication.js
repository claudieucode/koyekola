// Actions de communication : envoyer un e-mail, envoyer un SMS. Validation déplacée telle quelle depuis steps.js ;
// l'envoi réel est dans send.js (déplacé tel quel depuis engine.js).
const { MarketingError } = require("../../errors");
const templates = require("../../templates");
const smsRender = require("../../sms/render");
const { STEP_LABELS } = require("../../../utils/stepLabels");
const { defineAction } = require("./registry");
const { bad, withNext } = require("./shared");
const { sendEmailStep, sendSmsStep } = require("./send");

const MAX_SMS_BODY = 1600; // même limite que sms/campaigns.js#MAX_BODY (le coût réel se contrôle avant activation)

defineAction({
  type: "email", category: "communication", label: STEP_LABELS.email, description: "Un modèle de votre bibliothèque", version: 1, status: "available",
  validate({ ctx, raw, i, steps, kind }) {
    const template = Number.isInteger(raw.templateId) ? templates.getTemplate(ctx, raw.templateId) : null;
    if (!template) throw new MarketingError("not_found", `Étape ${i + 1} : modèle introuvable.`);
    if (template.kind !== kind) throw bad(i, kind === "marketing" ? "un scénario marketing utilise un modèle marketing." : "un scénario transactionnel utilise un modèle transactionnel.");
    return withNext({ type: "email", templateId: template.id, trackClicks: raw.trackClicks === undefined ? kind === "marketing" : Boolean(raw.trackClicks) }, raw, i, steps);
  },
  execute: ({ ctx, run, automation, step, contact, provider, now, attempts }) => sendEmailStep(ctx, { run, automation, step, contact, provider, now, attempts }),
});

// SMS marketing : envoyé seulement si le contact a un accord SMS prouvé (isSmsSendable, revérifié à l'envoi) ;
// mention « STOP SMS » ajoutée automatiquement. Réservé aux scénarios marketing (l'accord SMS est un accord marketing).
defineAction({
  type: "sms", category: "communication", label: STEP_LABELS.sms, description: "Aux contacts qui ont accepté les SMS", version: 1, status: "available", requires: ["sms_provider"],
  validate({ raw, i, steps, kind }) {
    if (kind !== "marketing") throw bad(i, "l'envoi d'un SMS est réservé aux scénarios marketing (il exige l'accord SMS du contact).");
    const body = typeof raw.body === "string" ? raw.body.replace(/\r\n?/g, "\n").trim() : "";
    if (!body) throw bad(i, "le texte du SMS est vide.");
    if (body.length > MAX_SMS_BODY) throw bad(i, `texte du SMS trop long (${MAX_SMS_BODY} caractères au plus).`);
    const tags = smsRender.unknownTags(body);
    if (tags.length) throw bad(i, `balise de personnalisation inconnue : ${tags.join(", ")}. Utilisez {{prenom}} ou {{nom}}.`);
    return withNext({ type: "sms", body, trackClicks: raw.trackClicks === undefined ? true : Boolean(raw.trackClicks) }, raw, i, steps);
  },
  execute: ({ ctx, automation, step, contact, smsProvider, now }) => sendSmsStep(ctx, { automation, step, contact, smsProvider, now }),
});
