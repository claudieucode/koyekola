// Actions sur les données du contact : copier un champ (avec nettoyage), définir une date, calculer un nombre. Écrivent dans les champs
// du contact ou ses propriétés personnalisées en passant par les mêmes fonctions que le reste de KOLAKISA (types et bornes vérifiés :
// une valeur refusée est notée au journal et le scénario continue, comme « Mettre à jour un champ »). Jamais l'e-mail ni le statut.
const { MarketingError } = require("../../errors");
const { getContact, updateContact } = require("../../audience/contacts");
const { getContactProperties, setContactProperties, listProperties } = require("../../audience/properties");
const sendtime = require("../../sending/sendtime");
const { STEP_LABELS } = require("../../../utils/stepLabels");
const { defineAction } = require("./registry");
const { bad, withNext } = require("./shared");

// Champs lisibles / modifiables (mêmes champs texte que update_field : jamais l'e-mail en écriture, jamais lms_user_id)
const READ_FIELDS = ["first_name", "last_name", "email", "phone", "company", "country", "language", "source"];
const WRITE_FIELDS = ["first_name", "last_name", "phone", "company", "country", "language", "source"];
const PROPERTY_REF = /^property:[a-z][a-z0-9_]{0,39}$/;
const TRANSFORMS = ["none", "trim", "lowercase", "uppercase", "capitalize", "digits"];
const OPS = ["set", "add", "subtract", "multiply"];
const MAX_NUMBER = 1e9;

const propDef = (ctx, ref) => listProperties(ctx).find((p) => `property:${p.key}` === ref);
const DAY_MS = 86400000;
const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T12:00:00Z`) + n * DAY_MS).toISOString().slice(0, 10);

// Nettoyage d'un texte : « trim » (espaces), minuscules, majuscules, « Première Lettre » de chaque mot (espaces en trop retirés aussi), « digits » (chiffres et « + » :
// extraire un numéro de téléphone d'un texte)
function transformText(value, transform) {
  const v = String(value);
  if (transform === "trim") return v.replace(/\s+/g, " ").trim();
  if (transform === "lowercase") return v.toLowerCase();
  if (transform === "uppercase") return v.toUpperCase();
  if (transform === "capitalize") return v.replace(/\s+/g, " ").trim().toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  if (transform === "digits") return v.replace(/[^\d+]/g, "");
  return v;
}

function logFailure(error) {
  if (!(error instanceof MarketingError)) throw error;
  return { next: true, log: ["failed", error.message] };
}

defineAction({
  type: "copy_field", category: "contact", label: STEP_LABELS.copy_field, description: "Copie un champ vers un autre, avec nettoyage", version: 1, status: "available",
  validate({ ctx, raw, i, steps }) {
    const readable = (v) => READ_FIELDS.includes(v) || (typeof v === "string" && PROPERTY_REF.test(v) && propDef(ctx, v));
    const writable = (v) => WRITE_FIELDS.includes(v) || (typeof v === "string" && PROPERTY_REF.test(v) && propDef(ctx, v));
    if (!readable(raw.from)) throw bad(i, "champ source invalide (un champ du contact ou une propriété personnalisée existante).");
    if (!writable(raw.to)) throw bad(i, "champ de destination invalide (un champ texte du contact — jamais l'e-mail — ou une propriété personnalisée existante).");
    if (raw.from === raw.to) throw bad(i, "la source et la destination sont identiques.");
    const transform = raw.transform === undefined ? "none" : raw.transform;
    if (!TRANSFORMS.includes(transform)) throw bad(i, "nettoyage inconnu (aucun, espaces, minuscules, majuscules, majuscule à chaque mot, chiffres).");
    return withNext({ type: "copy_field", from: raw.from, to: raw.to, transform }, raw, i, steps);
  },
  execute({ ctx, step, contact }) {
    try {
      const fresh = getContact(ctx, contact.id);
      const props = getContactProperties(ctx, contact.id);
      const source = step.from.startsWith("property:") ? props[step.from.slice(9)] : fresh && fresh[step.from];
      if (source === null || source === undefined || String(source).trim() === "") return { next: true, log: ["skipped", `« ${step.from} » est vide : rien copié`] };
      const value = transformText(typeof source === "boolean" ? (source ? "oui" : "non") : source, step.transform);
      if (step.to.startsWith("property:")) setContactProperties(ctx, contact.id, { [step.to.slice(9)]: value });
      else updateContact(ctx, contact.id, { [step.to]: value });
      return { next: true, log: ["copy_field", `${step.from} → ${step.to}`] };
    } catch (error) { return logFailure(error); }
  },
});

defineAction({
  type: "set_date", category: "contact", label: STEP_LABELS.set_date, description: "Date du jour ou d'un champ date, avec décalage", version: 1, status: "available",
  validate({ ctx, raw, i, steps }) {
    const dateProp = (v) => typeof v === "string" && PROPERTY_REF.test(v) && (propDef(ctx, v) || {}).type === "date";
    if (!dateProp(raw.property)) throw bad(i, "choisissez la propriété de type date à renseigner.");
    const base = raw.base === undefined ? "today" : raw.base;
    if (!["today", "property"].includes(base)) throw bad(i, "point de départ invalide (aujourd'hui ou un autre champ date).");
    if (base === "property" && !dateProp(raw.baseProperty)) throw bad(i, "choisissez le champ date de départ.");
    const offsetDays = raw.offsetDays === undefined ? 0 : raw.offsetDays;
    if (!Number.isInteger(offsetDays) || offsetDays < -3650 || offsetDays > 3650) throw bad(i, "décalage invalide (un nombre entier de jours, de −3650 à 3650).");
    const zone = raw.zone === undefined ? "contact" : raw.zone;
    if (!["contact", "organization"].includes(zone)) throw bad(i, "fuseau horaire invalide (celui du contact ou celui de l'organisation).");
    return withNext({ type: "set_date", property: raw.property, base, ...(base === "property" ? { baseProperty: raw.baseProperty } : {}), offsetDays, zone }, raw, i, steps);
  },
  execute({ ctx, step, contact, now }) {
    try {
      let start;
      if (step.base === "today") {
        const tz = step.zone === "contact" ? sendtime.contactZones(ctx, [contact.id])[contact.id].tz : sendtime.orgTimeZone(ctx);
        start = sendtime.localYmd(now, tz);
      } else {
        start = getContactProperties(ctx, contact.id)[step.baseProperty.slice(9)];
        if (typeof start !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return { next: true, log: ["skipped", `« ${step.baseProperty} » sans date : rien défini`] };
      }
      const result = addDays(start, step.offsetDays);
      setContactProperties(ctx, contact.id, { [step.property.slice(9)]: result });
      return { next: true, log: ["set_date", `${step.property} = ${result}`] };
    } catch (error) { return logFailure(error); }
  },
});

defineAction({
  type: "calculate", category: "contact", label: STEP_LABELS.calculate, description: "Ajoute, retire, multiplie ou définit un nombre", version: 1, status: "available",
  validate({ ctx, raw, i, steps }) {
    if (typeof raw.property !== "string" || !PROPERTY_REF.test(raw.property) || (propDef(ctx, raw.property) || {}).type !== "number") throw bad(i, "choisissez la propriété de type nombre à modifier.");
    if (!OPS.includes(raw.op)) throw bad(i, "opération invalide (définir, ajouter, retirer, multiplier).");
    if (typeof raw.value !== "number" || !Number.isFinite(raw.value) || Math.abs(raw.value) > MAX_NUMBER) throw bad(i, `valeur invalide (un nombre, de −${MAX_NUMBER} à ${MAX_NUMBER}).`);
    return withNext({ type: "calculate", property: raw.property, op: raw.op, value: raw.value }, raw, i, steps);
  },
  execute({ ctx, step, contact }) {
    try {
      const key = step.property.slice(9);
      const current = getContactProperties(ctx, contact.id)[key];
      const base = typeof current === "number" ? current : 0; // propriété vide : comptée comme 0
      const raw = step.op === "set" ? step.value : step.op === "add" ? base + step.value : step.op === "subtract" ? base - step.value : base * step.value;
      const result = Math.round(raw * 1e6) / 1e6;
      if (!Number.isFinite(result) || Math.abs(result) > MAX_NUMBER * 1e3) return { next: true, log: ["failed", "résultat hors bornes : propriété inchangée"] };
      setContactProperties(ctx, contact.id, { [key]: result });
      return { next: true, log: ["calculate", `${step.property} : ${base} → ${result}`] };
    } catch (error) { return logFailure(error); }
  },
});
