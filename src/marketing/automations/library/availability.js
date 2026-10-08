// Disponibilité d'un parcours : calculée, jamais déclarée. Un parcours n'est « prêt à utiliser » que si sa définition passe
// la validation structurelle ci-dessous (déclencheur réel, étapes de la grammaire du moteur, sauts valides, variables
// disponibles pour ce déclencheur, SMS dans l'alphabet autorisé…) ET que ses dépendances vivantes existent (fournisseur SMS
// réglé, liste choisie, événement envoyé par le site). Une définition invalide ne devient JAMAIS « prête » : elle est
// affichée « non disponible » avec la raison. La création réelle (service.createAutomation, validateSteps) est en plus
// vérifiée par les tests sur chaque parcours.
const { TRIGGERS } = require("../catalog");
const { UNITS, MAX_STEPS } = require("../steps");
const smsRender = require("../../sms/render");
const { checkCapability } = require("../actions/capabilities");

const MAX_WAIT_MS = 365 * 86400000;
const EVENT_NAME = /^[a-z][a-z0-9_.]{1,63}$/;
const MAX_SMS_BODY = 1600;
const LMS_EVENTS = new Set(Object.keys(TRIGGERS).filter((k) => k.startsWith("lms.")));
const EVENT_CMPS = new Set(["happened", "never", "at_least", "within_days", "not_within_days"]);
const COURSE_EVENTS = new Set(["lms.course_enrolled", "lms.lesson_completed", "lms.course_completed", "lms.review_posted", "lms.favorite_added", "lms.course_viewed", "lms.cart_added", "lms.course_progress_10", "lms.course_progress_50", "lms.course_progress_90"]);
const STEP_TYPES = new Set(require("../actions").actionTypes()); // source unique : le registre des actions

// Libellés de statut (interface) : « usable » = peut être créé par « Utiliser ce parcours »
const STATUSES = {
  ready: { label: "Prêt à utiliser", usable: true, tone: "ok" },
  config: { label: "Nécessite une configuration", usable: true, tone: "warn" },
  transactional: { label: "Transactionnel", usable: true, tone: "info" },
  tracking: { label: "Nécessite le suivi des visiteurs", usable: false, tone: "tracking" },
  unavailable: { label: "Non disponible", usable: false, tone: "off" },
};

// Variables « {{event.xxx}} » réellement renseignées selon l'événement déclencheur (voir engine.js#eventData)
function allowedVariables(event) {
  const vars = new Set(["learn_url"]);
  if (COURSE_EVENTS.has(event) || !Object.hasOwn(TRIGGERS, event)) { vars.add("course_title"); vars.add("course_url"); }
  if (event === "lms.lesson_completed") vars.add("lesson_title");
  if (event === "lms.order_completed") { vars.add("order_total"); vars.add("order_id"); }
  return vars;
}

const flat = (value) => JSON.stringify(value);

// Étape suivante de chaque étape (graphe d'exécution) — pour vérifier qu'aucune étape n'est inaccessible
function successors(steps, i) {
  const s = steps[i];
  const next = (v) => (v === "exit" ? [] : v === undefined || v === "next" || v === "continue" ? (i + 1 < steps.length ? [i + 1] : []) : [v]);
  if (s.type === "end") return [];
  if (s.type === "condition") return [...next(s.onTrue), ...next(s.onFalse)];
  if (s.type === "split") return [...next(s.onA), ...next(s.onB)];
  return next(s.next);
}

// Contrôle structurel d'une définition (pure : aucune lecture ni écriture) → liste de problèmes (vide = valide)
function check(j) {
  const problems = [];
  const bad = (text) => problems.push(text);
  const base = "https://exemple.test";
  const steps = j.steps || [];
  const emails = typeof j.emails === "function" ? j.emails(base) : [];
  const texts = typeof j.sms === "function" ? j.sms(base) : [];

  // Déclencheur
  const event = j.trigger && j.trigger.event;
  const known = Object.hasOwn(TRIGGERS, event);
  if (!known && !(typeof event === "string" && EVENT_NAME.test(event))) bad(`déclencheur inconnu « ${event} »`);
  const filter = (j.trigger && j.trigger.filter) || {};
  if (filter.key && !(known && TRIGGERS[event].filters.some(([k]) => k === filter.key))) bad(`filtre « ${filter.key} » non pris en charge par le déclencheur « ${event} »`);
  if (!known && !(j.needs || []).includes("site_event")) bad("un événement personnalisé exige une configuration de l'API (needs « site_event »)");
  if (filter.value === "@liste" && !(j.needs || []).includes("list")) bad("filtre de liste sans paramètre « list »");
  if (filter.value === "@formation" && !(j.needs || []).includes("course")) bad("filtre de formation sans paramètre « course »");
  if ((j.needs || []).includes("course") && !(filter.key === "courseId" && filter.value === "@formation")) bad("paramètre « course » sans filtre de formation sur le déclencheur");

  // Étapes
  if (!steps.length) bad("aucune étape");
  if (steps.length > MAX_STEPS) bad(`trop d'étapes (${MAX_STEPS} au plus)`);
  if (!["marketing", "transactional"].includes(j.kind)) bad("type de scénario invalide");
  const forward = (v, i) => v === undefined || v === "next" || v === "exit" || (Number.isInteger(v) && v > i && v < steps.length);
  steps.forEach((s, i) => {
    const at = `étape ${i + 1}`;
    if (!STEP_TYPES.has(s.type)) return bad(`${at} : type « ${s.type} » inconnu du moteur`);
    if (s.type === "email" && !emails[s.email]) bad(`${at} : e-mail ${s.email} introuvable`);
    if (s.type === "sms") {
      if (j.kind !== "marketing") bad(`${at} : un SMS exige un parcours marketing (accord SMS)`);
      if (!texts[s.sms]) bad(`${at} : SMS ${s.sms} introuvable`);
    }
    if (["wait", "wait_for_event"].includes(s.type)) {
      if (!Object.hasOwn(UNITS, s.unit) || !Number.isInteger(s.amount) || s.amount < 1 || s.amount * UNITS[s.unit] > MAX_WAIT_MS) bad(`${at} : attente invalide`);
    }
    if (s.type === "wait_for_event" && !EVENT_NAME.test(s.event || "")) bad(`${at} : événement attendu invalide`);
    if (s.type === "condition") {
      if (!forward(s.onTrue, i) || !forward(s.onFalse, i)) bad(`${at} : saut vers une étape qui n'existe pas ou en arrière`);
      if (["opened", "clicked"].includes(s.check) && !(Number.isInteger(s.ref) && s.ref < i && steps[s.ref] && steps[s.ref].type === "email")) bad(`${at} : la condition doit viser un e-mail qui la précède`);
      if (s.check === "segment") {
        for (const r of (s.definition && s.definition.rules) || []) {
          const f = String(r.field || "");
          if (r.course !== undefined && !(r.course === "@formation" && (j.needs || []).includes("course") && f.startsWith("event:"))) bad(`${at} : formation d'une règle non pilotée par le paramètre « course »`);
          if (f.startsWith("event:")) {
            if (!LMS_EVENTS.has(f.slice(6))) bad(`${at} : événement « ${f.slice(6)} » absent des segments`);
            if (!EVENT_CMPS.has(r.cmp)) bad(`${at} : comparateur « ${r.cmp} » invalide pour un événement`);
          } else if (!["status", "lms_spent", "tag"].includes(f)) bad(`${at} : champ de segment « ${f} » non pris en charge`);
        }
      }
    }
    if (s.type === "split" && (!forward(s.onA, i) || !forward(s.onB, i))) bad(`${at} : saut invalide`);
    if (s.next !== undefined && !forward(s.next, i)) bad(`${at} : saut invalide`);
    if (["add_tag", "remove_tag"].includes(s.type) && !(typeof s.tag === "string" && s.tag.trim() && s.tag.length <= 64)) bad(`${at} : étiquette invalide`);
    if (["add_to_list", "remove_from_list"].includes(s.type) && s.listId === "@liste" && !(j.needs || []).includes("list")) bad(`${at} : liste sans paramètre « list »`);
  });

  // Aucune étape inaccessible
  if (steps.length && !problems.length) {
    const seen = new Set([0]);
    const queue = [0];
    while (queue.length) for (const n of successors(steps, queue.pop())) if (!seen.has(n)) { seen.add(n); queue.push(n); }
    steps.forEach((_, i) => { if (!seen.has(i)) bad(`étape ${i + 1} : jamais atteinte`); });
  }

  // Contenu : modèles utilisés, variables disponibles, SMS
  const used = new Set(steps.filter((s) => s.type === "email").map((s) => s.email));
  emails.forEach((e, i) => { if (!used.has(i)) bad(`e-mail « ${e.name} » jamais envoyé`); });
  const usedSms = new Set(steps.filter((s) => s.type === "sms").map((s) => s.sms));
  texts.forEach((t, i) => { if (!usedSms.has(i)) bad(`SMS « ${t.name} » jamais envoyé`); });
  const vars = allowedVariables(event);
  for (const e of emails) {
    for (const m of flat([e.subject, e.preheader, e.blocks]).matchAll(/\{\{\s*event\.([a-z_]+)/g)) if (!vars.has(m[1])) bad(`e-mail « ${e.name} » : variable « event.${m[1]} » indisponible pour ce déclencheur`);
    if (e.kind && e.kind !== j.kind) bad(`e-mail « ${e.name} » : type différent de celui du parcours`);
  }
  for (const t of texts) {
    if (!t.body || t.body.length > MAX_SMS_BODY) bad(`SMS « ${t.name} » : texte vide ou trop long`);
    const tags = smsRender.unknownTags(t.body);
    if (tags.length) bad(`SMS « ${t.name} » : balise inconnue ${tags.join(", ")}`);
  }
  return problems;
}

// Dépendances techniques lisibles (aperçu) : { label, ok, detail }
function requirements(j, env) {
  const out = [];
  const event = j.trigger && j.trigger.event;
  const known = Object.hasOwn(TRIGGERS, event);
  out.push({ label: known ? `Déclencheur « ${TRIGGERS[event].label} »` : `Événement personnalisé « ${event} »`, ok: known || null, detail: known ? "émis par KOLAKISA" : "envoyé par votre site à l'API Événements" });
  const steps = j.steps || [];
  if (steps.some((s) => s.type === "email")) out.push({ label: "Modèles d'e-mails", ok: true, detail: `${steps.filter((s) => s.type === "email").length} modèle(s) créé(s) à l'utilisation, modifiables` });
  if (steps.some((s) => s.type === "sms")) out.push({ label: "Fournisseur SMS", ok: env.smsReady, detail: env.smsReady ? "réglé" : "à régler dans SMS → Réglages (sans cela, aucun SMS ne partira)" });
  if (steps.some((s) => s.type === "condition" && ["opened", "clicked"].includes(s.check))) out.push({ label: "Suivi des ouvertures et des clics", ok: true, detail: "actif sur les e-mails du parcours" });
  if (steps.some((s) => s.type === "condition" && s.check === "segment")) out.push({ label: "Segments (conditions)", ok: true, detail: "moteur de segments existant" });
  if (steps.some((s) => ["wait", "wait_for_event"].includes(s.type))) out.push({ label: "Planificateur (worker marketing)", ok: env.workerOn === undefined ? null : env.workerOn, detail: env.workerOn === false ? "arrêté sur ce serveur : le parcours ne s'exécutera pas tant qu'il n'est pas rétabli" : "exécute les attentes et les envois" });
  if ((j.needs || []).includes("list")) out.push({ label: "Liste de contacts", ok: null, detail: "à choisir au moment de l'utilisation" });
  if ((j.needs || []).includes("course")) out.push({ label: "Formation concernée", ok: null, detail: "à choisir au moment de l'utilisation : le parcours ne concerne que cette formation" });
  if ((j.needs || []).includes("site_event")) out.push({ label: "Événement envoyé par votre site", ok: null, detail: j.siteEvent ? j.siteEvent.help : "à envoyer à l'API Événements" });
  return out;
}

// Environnement vivant (une fois par page) : fournisseur SMS réglé ?
function environment(ctx, { workerOn } = {}) {
  return { smsReady: checkCapability(ctx, "sms_provider").ok, workerOn };
}

// → { status, label, usable, problems, missing[], requirements[] }
function evaluate(j, env) {
  const reqs = j.unavailable ? [] : requirements(j, env);
  const done = (status, extra = {}) => ({ status, ...STATUSES[status], problems: [], missing: [], requirements: reqs, ...extra });
  if (j.unavailable) return done(j.blocked === "tracking" ? "tracking" : "unavailable", { missing: [j.unavailable] });
  const problems = check(j);
  if (problems.length) return done("unavailable", { problems, missing: [`Définition invalide : ${problems[0]}`] });
  const needs = j.needs || [];
  const missing = [];
  if (needs.includes("list")) missing.push("Choisir la liste concernée au moment de l'utilisation.");
  if (needs.includes("course")) missing.push("Choisir la formation concernée au moment de l'utilisation.");
  if (needs.includes("site_event")) missing.push(j.siteEvent ? j.siteEvent.help : "Votre site doit envoyer l'événement déclencheur à l'API.");
  if ((j.steps || []).some((s) => s.type === "sms") && !env.smsReady) missing.push("Régler le fournisseur SMS (SMS → Réglages) avant l'activation.");
  if (missing.length) return done("config", { missing });
  return done(j.kind === "transactional" ? "transactional" : "ready");
}

module.exports = { STATUSES, check, evaluate, environment, requirements, allowedVariables, MAX_STEPS };
