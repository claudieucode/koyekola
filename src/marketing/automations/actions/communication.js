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
  type: "email", category: "communication", label: STEP_LABELS.email, description: "Un modèle de votre bibliothèque", version: 1, status: "available", requires: ["email_provider"],
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

// ---------- Notification à l'équipe ----------
const { enqueue } = require("../../queue/jobs");
const { getContact } = require("../../audience/contacts");
const { memberOf } = require("../notify");
const { BASE_VARIABLES, valuesFor, render, unknownTokens, listText } = require("./variables");

const NOTIFY_VARIABLES = [...BASE_VARIABLES, "contact_url", "scenario"];
const MAX_RECIPIENTS = 5, MAX_SUBJECT = 150, MAX_BODY = 1500;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

defineAction({
  type: "notify_team", category: "communication", label: STEP_LABELS.notify_team, description: "Un e-mail interne à des membres de l'équipe", version: 1, status: "available", requires: ["email_provider"],
  validate({ ctx, raw, i, steps }) {
    const ids = Array.isArray(raw.recipients) ? [...new Set(raw.recipients)] : [];
    if (!ids.length || ids.length > MAX_RECIPIENTS || ids.some((id) => !Number.isInteger(id) || id < 1)) throw bad(i, `choisissez de 1 à ${MAX_RECIPIENTS} membres de l'équipe.`);
    for (const id of ids) if (!memberOf(ctx.db, ctx.organizationId, id)) throw new MarketingError("not_found", `Étape ${i + 1} : un destinataire n'est pas membre de l'équipe (ou n'a pas d'adresse e-mail).`);
    const subject = typeof raw.subject === "string" ? raw.subject.replace(CONTROL, " ").replace(/\s+/g, " ").trim() : "";
    if (!subject) throw bad(i, "l'objet de la notification est vide.");
    if (subject.length > MAX_SUBJECT) throw bad(i, `objet trop long (${MAX_SUBJECT} caractères au plus).`);
    const body = typeof raw.body === "string" ? raw.body.replace(/\r\n?/g, "\n").replace(CONTROL, "").trim() : "";
    if (!body) throw bad(i, "le texte de la notification est vide.");
    if (body.length > MAX_BODY) throw bad(i, `texte trop long (${MAX_BODY} caractères au plus).`);
    for (const [label, text] of [["l'objet", subject], ["le texte", body]]) {
      const unknown = unknownTokens(text, NOTIFY_VARIABLES);
      if (unknown.length) throw bad(i, `variable inconnue dans ${label} : ${unknown.join(", ")}. Variables : ${listText(NOTIFY_VARIABLES)}.`);
    }
    return withNext({ type: "notify_team", recipients: ids, subject, body }, raw, i, steps);
  },
  execute({ ctx, run, automation, index, step, contact }) {
    const fresh = getContact(ctx, contact.id) || contact;
    const base = String(ctx.baseUrl || "").replace(/\/+$/, "");
    const vars = valuesFor({ contact: fresh, run, extra: { contact_url: base ? `${base}/marketing/contacts/${fresh.id}` : "", scenario: automation.name } });
    const subject = render(step.subject, vars).replace(CONTROL, " ").replace(/\s+/g, " ").trim().slice(0, MAX_SUBJECT);
    const text = render(step.body, vars).slice(0, MAX_BODY * 2);
    let planned = 0, already = 0, gone = 0;
    for (const userId of step.recipients) {
      if (!memberOf(ctx.db, ctx.organizationId, userId)) { gone += 1; continue; }
      const key = `notify:${run.id}:${index}:${userId}`;
      const r = enqueue(ctx.db, { organizationId: ctx.organizationId, type: "automation.notify", priority: 5, maxAttempts: 5, payload: { organizationId: ctx.organizationId, userId, subject, text, automationName: automation.name, key }, idempotencyKey: key });
      if (r.duplicate) already += 1; else planned += 1;
    }
    if (!planned && already) return { next: true, log: ["already_done", "notification déjà planifiée par cette étape"] };
    if (!planned) return { next: true, log: ["failed", "aucun destinataire valide (membres retirés de l'équipe ?) : rien envoyé"] };
    return { next: true, log: ["notify_team", `notification planifiée pour ${planned} membre${planned > 1 ? "s" : ""}${gone ? ` (${gone} retiré${gone > 1 ? "s" : ""} de l'équipe)` : ""}`] };
  },
});
