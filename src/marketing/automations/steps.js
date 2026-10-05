// Validation et normalisation des étapes d'un scénario (grammaire fermée : aucune étape « libre »).
// Un champ inconnu est supprimé ; une étape invalide est refusée avec son numéro.
const { MarketingError } = require("../errors");
const { getList } = require("../audience/lists");
const segments = require("../segments");
const templates = require("../templates");
const { STEP_LABELS } = require("../../utils/stepLabels");
const smsRender = require("../sms/render");

const MAX_SMS_BODY = 1600; // même limite que sms/campaigns.js#MAX_BODY (le coût réel se contrôle avant activation)

const MAX_STEPS = 30;
const UNITS = { minutes: 60000, hours: 3600000, days: 86400000 };
const MAX_WAIT_MS = 365 * 86400000;
const CHECKS = ["segment", "opened", "clicked"];
// Champs du contact modifiables par l'action « Mettre à jour un champ » — mêmes champs texte que
// audience/contacts.js#TEXT_FIELDS (jamais l'e-mail ni le statut, qui ne se changent pas ainsi ; jamais
// lms_user_id, un lien technique qui n'a pas sa place dans un scénario). Une propriété personnalisée se vise par
// « property:<clé> » (validée par setContactProperties, qui connaît le type réel de la propriété).
const EDITABLE_FIELDS = ["first_name", "last_name", "phone", "company", "country", "language", "source"];
const PROPERTY_FIELD = /^property:[a-z][a-z0-9_]{0,39}$/;
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

function validateSteps(ctx, steps, kind) {
  if (!Array.isArray(steps)) throw new MarketingError("invalid_automation", "Les étapes doivent être une liste.");
  if (steps.length > MAX_STEPS) throw new MarketingError("invalid_automation", `Trop d'étapes (${MAX_STEPS} au plus).`);
  return steps.map((raw, i) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw bad(i, "objet attendu.");
    switch (raw.type) {
      case "email": {
        const template = Number.isInteger(raw.templateId) ? templates.getTemplate(ctx, raw.templateId) : null;
        if (!template) throw new MarketingError("not_found", `Étape ${i + 1} : modèle introuvable.`);
        if (template.kind !== kind) throw bad(i, kind === "marketing" ? "un scénario marketing utilise un modèle marketing." : "un scénario transactionnel utilise un modèle transactionnel.");
        return withNext({ type: "email", templateId: template.id, trackClicks: raw.trackClicks === undefined ? kind === "marketing" : Boolean(raw.trackClicks) }, raw, i, steps);
      }
      // SMS marketing : envoyé seulement si le contact a un accord SMS prouvé (isSmsSendable, revérifié à l'envoi) ;
      // mention « STOP SMS » ajoutée automatiquement. Réservé aux scénarios marketing (l'accord SMS est un accord marketing).
      case "sms": {
        if (kind !== "marketing") throw bad(i, "l'envoi d'un SMS est réservé aux scénarios marketing (il exige l'accord SMS du contact).");
        const body = typeof raw.body === "string" ? raw.body.replace(/\r\n?/g, "\n").trim() : "";
        if (!body) throw bad(i, "le texte du SMS est vide.");
        if (body.length > MAX_SMS_BODY) throw bad(i, `texte du SMS trop long (${MAX_SMS_BODY} caractères au plus).`);
        const tags = smsRender.unknownTags(body);
        if (tags.length) throw bad(i, `balise de personnalisation inconnue : ${tags.join(", ")}. Utilisez {{prenom}} ou {{nom}}.`);
        return withNext({ type: "sms", body, trackClicks: raw.trackClicks === undefined ? true : Boolean(raw.trackClicks) }, raw, i, steps);
      }
      case "wait": {
        const unit = Object.hasOwn(UNITS, raw.unit) ? raw.unit : null;
        if (!unit || !Number.isInteger(raw.amount) || raw.amount < 1 || raw.amount * UNITS[unit] > MAX_WAIT_MS) throw bad(i, "attente invalide (nombre entier ≥ 1, en minutes, heures ou jours, un an au plus).");
        return withNext({ type: "wait", amount: raw.amount, unit }, raw, i, steps);
      }
      // Attend qu'un événement précis survienne pour CE contact (ex. « a terminé la formation ») ou, à défaut, le
      // délai maximal — jamais une attente indéfinie (un contact ne doit jamais pouvoir rester bloqué pour
      // toujours). Reprend alors la suite comme une attente ordinaire, un seul chemin, aucun embranchement.
      case "wait_for_event": {
        if (typeof raw.event !== "string" || !EVENT_NAME.test(raw.event)) throw bad(i, "nom d'événement invalide (minuscules, chiffres, « _ » et « . », 2 à 64 caractères, commence par une lettre).");
        const unit = Object.hasOwn(UNITS, raw.unit) ? raw.unit : null;
        if (!unit || !Number.isInteger(raw.amount) || raw.amount < 1 || raw.amount * UNITS[unit] > MAX_WAIT_MS) throw bad(i, "délai maximal invalide (nombre entier ≥ 1, en minutes, heures ou jours, un an au plus).");
        return withNext({ type: "wait_for_event", event: raw.event, amount: raw.amount, unit }, raw, i, steps);
      }
      // Tirage aléatoire (pas de donnée du contact) : « A » avec la probabilité indiquée, « B » sinon — utile pour
      // un test A/B simple sur le parcours lui-même (pas seulement sur le contenu d'un e-mail).
      case "split": {
        if (!Number.isInteger(raw.percentage) || raw.percentage < 1 || raw.percentage > 99) throw bad(i, "pourcentage invalide (nombre entier de 1 à 99).");
        const onA = jumpTarget(raw.onA, i, steps.length, "Chemin A");
        const onB = jumpTarget(raw.onB === undefined ? "exit" : raw.onB, i, steps.length, "Chemin B");
        return { type: "split", percentage: raw.percentage, onA, onB };
      }
      // Met à jour un champ du contact (texte du contact ou propriété personnalisée) ; jamais l'e-mail ni le statut.
      case "update_field": {
        const field = typeof raw.field === "string" ? raw.field : "";
        if (!EDITABLE_FIELDS.includes(field) && !PROPERTY_FIELD.test(field)) throw bad(i, "champ invalide (prénom, nom, téléphone, société, pays, langue, source, ou une propriété personnalisée).");
        const value = typeof raw.value === "string" ? raw.value.replace(/\p{Cc}/gu, "").trim() : "";
        if (value.length > 300) throw bad(i, "valeur trop longue (300 caractères au plus).");
        return withNext({ type: "update_field", field, value }, raw, i, steps);
      }
      case "condition": {
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
      }
      case "add_tag": case "remove_tag":
        return withNext({ type: raw.type, tag: tagName(raw.tag, i) }, raw, i, steps);
      case "add_to_list": case "remove_from_list": {
        if (!Number.isInteger(raw.listId) || !getList(ctx, raw.listId)) throw new MarketingError("not_found", `Étape ${i + 1} : liste introuvable.`);
        return withNext({ type: raw.type, listId: raw.listId }, raw, i, steps);
      }
      case "end":
        return { type: "end" };
      default:
        throw bad(i, `type d'étape inconnu « ${String(raw.type).slice(0, 30)} » (email, sms, wait, wait_for_event, condition, split, update_field, add_tag, remove_tag, add_to_list, remove_from_list, end).`);
    }
  });
}

module.exports = { validateSteps, UNITS, MAX_STEPS, CHECKS, STEP_LABELS };
