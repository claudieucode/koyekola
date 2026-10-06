// Catalogue des champs et comparateurs proposés par l'éditeur visuel de segments (libellés français, type de valeur).
// Il ne propose que des combinaisons que le moteur (engine.js) accepte : c'est vérifié par un test d'invariant.
const { listProperties } = require("../audience/properties");
const { listLists } = require("../audience/lists");
const { STATUSES } = require("../audience/contacts");
const { checkCtx } = require("../audience/shared");

const C = (cmp, label, value = "text") => ({ cmp, label, value });
const TEXT = [C("eq", "est"), C("neq", "n'est pas"), C("contains", "contient"), C("not_contains", "ne contient pas"), C("starts_with", "commence par"), C("ends_with", "finit par"),
  C("in", "est l'un de (séparés par des virgules)", "textlist"), C("is_empty", "est vide", "none"), C("not_empty", "est renseigné", "none")];
const DATE = [C("before", "avant le", "date"), C("after", "après le", "date"), C("on", "le", "date"), C("within_days", "dans les N derniers jours", "days"),
  C("older_than_days", "il y a plus de N jours", "days"), C("is_empty", "n'a jamais eu lieu / est vide", "none"), C("not_empty", "a déjà eu lieu / est renseigné", "none")];
const NUMBER = [C("eq", "est égal à", "number"), C("neq", "est différent de", "number"), C("gt", "est supérieur à", "number"), C("gte", "est supérieur ou égal à", "number"),
  C("lt", "est inférieur à", "number"), C("lte", "est inférieur ou égal à", "number"), C("between", "est entre", "range"), C("is_empty", "est vide", "none"), C("not_empty", "est renseigné", "none")];

const EVENT = [C("happened", "a eu lieu au moins une fois", "none"), C("never", "n'a jamais eu lieu", "none"), C("at_least", "a eu lieu au moins N fois", "number"),
  C("within_days", "a eu lieu dans les N derniers jours", "days"), C("not_within_days", "n'a pas eu lieu dans les N derniers jours", "days")];
const SPENT = [C("gt", "est supérieur à", "number"), C("gte", "est supérieur ou égal à", "number"), C("lt", "est inférieur à", "number"), C("lte", "est inférieur ou égal à", "number"),
  C("between", "est entre", "range"), C("is_empty", "n'a jamais acheté", "none"), C("not_empty", "a déjà acheté", "none")];
// Activité KOLAKISA proposée dans les segments : (événement, libellé, porte une formation ?)
const EVENTS = [
  ["lms.user_registered", "Inscription sur KOLAKISA", false], ["lms.order_completed", "Achat (commande passée)", true], ["lms.course_enrolled", "Inscription à une formation", true],
  ["lms.lesson_completed", "Leçon terminée", true], ["lms.course_completed", "Formation terminée", true], ["lms.review_posted", "Avis publié", true], ["lms.favorite_added", "Formation mise en favori", true],
  ["lms.course_progress_10", "Formation suivie à 10 %", true], ["lms.course_progress_50", "Formation suivie à 50 %", true], ["lms.course_progress_90", "Formation suivie à 90 %", true],
  ["lms.course_viewed", "Fiche formation consultée", true], ["lms.cart_added", "Formation ajoutée au panier", true], ["lms.checkout_started", "Page de commande ouverte", false],
  ["email.clicked", "Clic dans un e-mail", false], ["email.opened", "Ouverture d'un e-mail (indicatif)", false],
  ["page.visited", "Page visitée (Site Web, Tunnels)", false], ["funnel.step_reached", "Étape de tunnel atteinte", false], ["funnel.completed", "Tunnel terminé", false],
];
const ACTIVITY_NOTE = "Compté depuis l'activation du pont KOLAKISA : l'activité plus ancienne n'est pas incluse.";

// Formations connues, déduites des ÉVÉNEMENTS déjà reçus (le module marketing ne lit jamais les tables du LMS) :
// le titre le plus récent l'emporte ; les formations d'une commande sont incluses.
function knownCourses(ctx) {
  const rows = ctx.db
    .prepare(
      `SELECT CAST(json_extract(metadata, '$.courseId') AS INTEGER) AS id, json_extract(metadata, '$.title') AS title, occurred_at
       FROM mk_events WHERE organization_id = ? AND name IN ('lms.course_enrolled', 'lms.lesson_completed', 'lms.course_completed', 'lms.review_posted', 'lms.favorite_added', 'lms.course_viewed', 'lms.cart_added', 'lms.course_progress_10', 'lms.course_progress_50', 'lms.course_progress_90') AND json_extract(metadata, '$.courseId') IS NOT NULL
       UNION ALL
       SELECT CAST(json_extract(j.value, '$.courseId') AS INTEGER), json_extract(j.value, '$.title'), e.occurred_at
       FROM mk_events e, json_each(e.metadata, '$.items') j WHERE e.organization_id = ? AND e.name = 'lms.order_completed' AND json_extract(j.value, '$.courseId') IS NOT NULL
       ORDER BY occurred_at DESC LIMIT 5000`
    )
    .all(ctx.organizationId, ctx.organizationId);
  const seen = new Map();
  for (const r of rows) if (Number.isInteger(r.id) && r.id > 0 && !seen.has(r.id)) seen.set(r.id, typeof r.title === "string" && r.title ? r.title : `Formation ${r.id}`);
  return [...seen].map(([id, title]) => ({ id, title })).sort((a, b) => a.id - b.id).slice(0, 200);
}

const CORE_TEXT = [["email", "E-mail"], ["first_name", "Prénom"], ["last_name", "Nom"], ["phone", "Téléphone"], ["company", "Société"], ["country", "Pays"], ["language", "Langue"], ["source", "Source"]];
const CORE_DATES = [["created_at", "Date d'ajout"], ["last_activity_at", "Dernière activité"], ["last_open_at", "Dernière ouverture"], ["last_click_at", "Dernier clic"], ["last_campaign_at", "Dernière campagne reçue"], ["unsubscribed_at", "Date de désinscription"]];

function fieldCatalog(ctx) {
  checkCtx(ctx);
  const fields = [];
  for (const [field, label] of CORE_TEXT) fields.push({ field, label, group: "Contact", kind: "text", cmps: TEXT });
  fields.push({ field: "status", label: "Statut", group: "Contact", kind: "status", options: STATUSES, cmps: [C("eq", "est", "status"), C("neq", "n'est pas", "status")] });
  for (const [field, label] of CORE_DATES) fields.push({ field, label, group: "Dates", kind: "date", cmps: DATE });
  fields.push({ field: "lms_user_id", label: "Compte KOLAKISA", group: "Contact", kind: "lms", cmps: [C("not_empty", "est lié à un compte", "none"), C("is_empty", "n'est pas lié à un compte", "none")] });
  fields.push({ field: "tag", label: "Étiquette", group: "Organisation", kind: "tag", cmps: [C("has", "a l'étiquette"), C("not_has", "n'a pas l'étiquette")] });
  fields.push({ field: "list", label: "Liste", group: "Organisation", kind: "list", lists: listLists(ctx).map((l) => ({ id: l.id, name: l.name })), cmps: [C("in_list", "est dans la liste", "list"), C("not_in_list", "n'est pas dans la liste", "list")] });
  const courses = knownCourses(ctx);
  for (const [name, label, supportsCourse] of EVENTS) {
    fields.push({ field: `event:${name}`, label, group: "Activité KOLAKISA", kind: "event", supportsCourse, courses: supportsCourse ? courses : [], note: ACTIVITY_NOTE, cmps: EVENT });
  }
  fields.push({ field: "lms_spent", label: "Montant dépensé sur KOLAKISA (€)", group: "Achats", kind: "spent", note: ACTIVITY_NOTE, cmps: SPENT });
  fields.push({ field: "score", label: "Score", group: "Contact", kind: "score", note: "Points des règles de score (Audience → Score des contacts).", cmps: SPENT.filter((c) => !["is_empty", "not_empty"].includes(c.cmp)) });
  for (const p of listProperties(ctx)) {
    const field = `property:${p.key}`;
    const group = "Propriétés";
    if (p.type === "text") fields.push({ field, label: p.label, group, kind: "text", cmps: TEXT });
    else if (p.type === "select") fields.push({ field, label: p.label, group, kind: "select", options: JSON.parse(p.options), cmps: [C("eq", "est", "select"), C("neq", "n'est pas", "select"), C("is_empty", "est vide", "none"), C("not_empty", "est renseigné", "none")] });
    else if (p.type === "number") fields.push({ field, label: p.label, group, kind: "number", cmps: NUMBER });
    else if (p.type === "date") fields.push({ field, label: p.label, group, kind: "date", cmps: DATE });
    else fields.push({ field, label: p.label, group, kind: "boolean", cmps: [C("is_true", "est vrai (oui)", "none"), C("is_false", "est faux (non)", "none"), C("is_empty", "est vide", "none"), C("not_empty", "est renseigné", "none")] });
  }
  return fields;
}

// Valeur plausible pour un (champ, comparateur) : sert aux tests et à préremplir l'éditeur
function sampleValue(field, cmp) {
  switch (cmp.value) {
    case "text": return field.kind === "tag" ? "vip" : "exemple";
    case "textlist": return ["exemple", "autre"];
    case "date": return "2027-01-15";
    case "days": return 30;
    case "number": return 10;
    case "range": return [1, 100];
    case "status": return "subscribed";
    case "select": return field.options[0];
    case "list": return field.lists?.[0]?.id ?? 1;
    default: return undefined;
  }
}

module.exports = { fieldCatalog, sampleValue };
