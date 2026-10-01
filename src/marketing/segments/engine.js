// Moteur de segments : une définition JSON (grammaire FERMÉE) est validée puis compilée en SQL paramétré.
//
//   groupe  := { op: "and" | "or", rules: [ groupe | règle, … ] }   (jamais vide)
//            | { op: "not", rule: groupe | règle }
//   règle   := { field, cmp, value? }
//
// Sécurité : les noms de colonnes viennent d'une table interne (jamais de l'entrée), les valeurs sont TOUJOURS liées (?),
// la profondeur et le nombre de règles sont bornés. Les comparateurs négatifs (≠, ne contient pas, n'a pas…) sont définis
// comme « NON (positif) » : ils incluent donc les contacts qui n'ont pas de valeur. Un segment ne donne AUCUN droit
// d'envoi : l'envoi repasse toujours par compliance.isSendable().
const { MarketingError } = require("../errors");
const { STATUSES } = require("../audience/contacts");

const MAX_DEPTH = 5;
const MAX_NODES = 100;
const MAX_TEXT = 200;
const MAX_LIST = 100;
const MAX_DAYS = 36500;
const MAX_COUNT = 100000;

// Activité KOYEKOLA : uniquement les événements du pont LMS. « course » (identifiant de formation) n'existe que pour ceux
// qui portent une formation. Le montant dépensé est la somme des commandes terminées (en centimes dans les métadonnées).
const EVENT_NAMES = {
  "lms.user_registered": false, "lms.order_completed": true, "lms.course_enrolled": true, "lms.lesson_completed": true,
  "lms.course_completed": true, "lms.review_posted": true, "lms.favorite_added": true,
};
const DAY_MS = 86400000;

const TEXT_COLUMNS = { email: "c.email", first_name: "c.first_name", last_name: "c.last_name", phone: "c.phone", company: "c.company", country: "c.country", language: "c.language", source: "c.source" };
const DATE_COLUMNS = { created_at: "c.created_at", updated_at: "c.updated_at", last_activity_at: "c.last_activity_at", last_open_at: "c.last_open_at", last_click_at: "c.last_click_at", last_campaign_at: "c.last_campaign_at", unsubscribed_at: "c.unsubscribed_at" };

const CMP = {
  text: ["eq", "neq", "contains", "not_contains", "starts_with", "ends_with", "in", "not_in", "is_empty", "not_empty"],
  status: ["eq", "neq", "in", "not_in"],
  date: ["before", "after", "on", "within_days", "older_than_days", "is_empty", "not_empty"],
  lms: ["is_empty", "not_empty"],
  tag: ["has", "not_has"],
  list: ["in_list", "not_in_list"],
  select: ["eq", "neq", "in", "not_in", "is_empty", "not_empty"],
  number: ["eq", "neq", "gt", "gte", "lt", "lte", "between", "is_empty", "not_empty"],
  boolean: ["is_true", "is_false", "is_empty", "not_empty"],
  event: ["happened", "never", "at_least", "within_days", "not_within_days"],
  spent: ["gt", "gte", "lt", "lte", "between", "is_empty", "not_empty"],
};
const NEGATIVE = { neq: "eq", not_contains: "contains", not_in: "in", not_has: "has", not_in_list: "in_list", never: "happened", not_within_days: "within_days" };
const NO_VALUE = new Set(["is_empty", "not_empty", "is_true", "is_false", "happened", "never"]);
const PROPERTY_KEY = /^[a-z][a-z0-9_]{0,39}$/;

const fail = (path, message) => new MarketingError("invalid_segment", `${path ? `${path} : ` : ""}${message}`);
const escapeLike = (text) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

function realDate(text) {
  const m = typeof text === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(text) : null;
  if (!m) return false;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

function checkText(value, path) {
  if (typeof value !== "string" || !value.length) throw fail(path, "Valeur invalide : un texte non vide est attendu.");
  if (value.length > MAX_TEXT) throw fail(path, `Valeur trop longue (${MAX_TEXT} caractères au plus).`);
  return value;
}

function checkList(value, path, item) {
  if (!Array.isArray(value) || !value.length || value.length > MAX_LIST) throw fail(path, `Une liste de 1 à ${MAX_LIST} valeurs est attendue.`);
  return value.map((v) => item(v, path));
}

function checkNumber(value, path) {
  const n = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value.trim().replace(",", ".")) : NaN;
  if (!Number.isFinite(n)) throw fail(path, "Valeur invalide : un nombre est attendu.");
  return n;
}

function checkDays(value, path) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_DAYS) throw fail(path, `Nombre de jours invalide (entier de 0 à ${MAX_DAYS}).`);
  return value;
}

// Conditions sur une expression de colonne. « col » vient d'une table interne, jamais de l'entrée.
function textCondition(col, cmp, value, path, { allowEmpty }) {
  switch (cmp) {
    case "eq": return { sql: `${col} = ? COLLATE NOCASE`, params: [checkText(value, path)] };
    case "contains": return { sql: `${col} LIKE ? ESCAPE '\\'`, params: [`%${escapeLike(checkText(value, path))}%`] };
    case "starts_with": return { sql: `${col} LIKE ? ESCAPE '\\'`, params: [`${escapeLike(checkText(value, path))}%`] };
    case "ends_with": return { sql: `${col} LIKE ? ESCAPE '\\'`, params: [`%${escapeLike(checkText(value, path))}`] };
    case "in": {
      const items = checkList(value, path, checkText);
      return { sql: `${col} COLLATE NOCASE IN (${items.map(() => "?").join(", ")})`, params: items };
    }
    case "is_empty": return allowEmpty ? { sql: `${col} = ''`, params: [] } : null;
    case "not_empty": return allowEmpty ? { sql: `${col} <> ''`, params: [] } : null;
    default: return null;
  }
}

function dateCondition(col, cmp, value, path, today, { nullable }) {
  const day = (n) => new Date(Date.parse(`${today}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10);
  const part = `substr(${col}, 1, 10)`;
  switch (cmp) {
    case "before": case "after": case "on": {
      if (!realDate(value)) throw fail(path, "Valeur invalide : une date AAAA-MM-JJ existante est attendue.");
      return { sql: `${part} ${cmp === "before" ? "<" : cmp === "after" ? ">" : "="} ?`, params: [value] };
    }
    case "within_days": return { sql: `${part} >= ?`, params: [day(checkDays(value, path))] };
    case "older_than_days": return { sql: `${part} < ?`, params: [day(checkDays(value, path))] };
    case "is_empty": return nullable ? { sql: `${col} IS NULL`, params: [] } : null;
    case "not_empty": return nullable ? { sql: `${col} IS NOT NULL`, params: [] } : null;
    default: return null;
  }
}

function createCompiler(ctx) {
  const { db, organizationId } = ctx;
  const nowMs = typeof ctx.now === "function" ? ctx.now() : Date.now();
  const today = new Date(nowMs).toISOString().slice(0, 10);
  const propertyCache = new Map();
  const state = { nodes: 0 };

  function property(key, path) {
    if (!PROPERTY_KEY.test(key)) throw fail(path, `Champ « ${key.slice(0, 40)} » inconnu.`);
    if (!propertyCache.has(key)) propertyCache.set(key, db.prepare("SELECT * FROM mk_property_defs WHERE organization_id = ? AND key = ?").get(organizationId, key) ?? null);
    const def = propertyCache.get(key);
    if (!def) throw fail(path, `Propriété « ${key} » inconnue.`);
    return def;
  }

  function leaf(rule, path) {
    const allowed = new Set(["field", "cmp", "value", "course"]);
    for (const k of Object.keys(rule)) if (!allowed.has(k)) throw fail(path, `Élément inattendu « ${k.slice(0, 30)} » dans la règle.`);
    const { field, cmp, value, course } = rule;
    if (typeof field !== "string" || typeof cmp !== "string") throw fail(path, "Une règle demande un champ et un comparateur.");
    const positive = NEGATIVE[cmp] ?? cmp;
    const negate = Object.hasOwn(NEGATIVE, cmp);
    let kind;
    let def = null;
    if (Object.hasOwn(TEXT_COLUMNS, field)) kind = "text";
    else if (field === "status") kind = "status";
    else if (Object.hasOwn(DATE_COLUMNS, field)) kind = "date";
    else if (field === "lms_user_id") kind = "lms";
    else if (field === "lms_spent") kind = "spent";
    else if (field.startsWith("event:")) {
      if (!Object.hasOwn(EVENT_NAMES, field.slice(6))) throw fail(path, `Événement « ${field.slice(6, 46)} » inconnu (seuls les événements KOYEKOLA sont proposés).`);
      kind = "event";
    }
    else if (field === "tag") kind = "tag";
    else if (field === "list") kind = "list";
    else if (field.startsWith("property:")) {
      def = property(field.slice(9), path);
      kind = def.type === "text" ? "text" : def.type;
    } else throw fail(path, `Champ « ${field.slice(0, 40)} » inconnu.`);

    const comparators = kind === "text" && def ? CMP.text.filter((c) => c !== "is_empty" && c !== "not_empty").concat(["is_empty", "not_empty"]) : CMP[kind];
    if (!comparators.includes(cmp)) throw fail(path, `Comparateur « ${cmp.slice(0, 30)} » non pris en charge pour le champ « ${field.slice(0, 40)} ».`);
    if (NO_VALUE.has(cmp) ? value !== undefined : value === undefined) throw fail(path, NO_VALUE.has(cmp) ? "Ce comparateur n'attend pas de valeur." : "Valeur manquante.");

    if (course !== undefined) {
      if (kind !== "event" || !EVENT_NAMES[field.slice(6)]) throw fail(path, "« course » (formation) n'existe que pour les événements de formation.");
      if (!Number.isInteger(course) || course < 1) throw fail(path, "Formation invalide : un identifiant entier positif est attendu.");
    }
    if (kind === "event") {
      const built = eventCondition(field.slice(6), positive, value, course, path);
      return { sql: negate ? `NOT COALESCE(${built.sql}, 0)` : `COALESCE(${built.sql}, 0)`, params: built.params };
    }
    if (kind === "spent") {
      const built = spentCondition(cmp, value, path);
      return { sql: `COALESCE(${built.sql}, 0)`, params: built.params };
    }

    // Propriété : présence de la valeur (vide = pas de ligne), sinon condition sur la colonne de valeur
    if (def && (cmp === "is_empty" || cmp === "not_empty")) {
      const exists = "EXISTS (SELECT 1 FROM mk_contact_property_values v WHERE v.contact_id = c.id AND v.organization_id = ? AND v.property_id = ?)";
      return { sql: cmp === "is_empty" ? `NOT ${exists}` : exists, params: [organizationId, def.id] };
    }

    let built;
    if (def) {
      const col = { text: "v.value_text", select: "v.value_text", number: "v.value_number", date: "v.value_date", boolean: "v.value_boolean" }[def.type];
      built = propertyCondition(def, col, positive, value, path);
      built = {
        sql: `EXISTS (SELECT 1 FROM mk_contact_property_values v WHERE v.contact_id = c.id AND v.organization_id = ? AND v.property_id = ? AND ${built.sql})`,
        params: [organizationId, def.id, ...built.params],
      };
    } else built = coreCondition(kind, field, positive, value, path);
    return { sql: negate ? `NOT COALESCE(${built.sql}, 0)` : `COALESCE(${built.sql}, 0)`, params: built.params };
  }

  // Nombre d'événements du contact (dans l'organisation), éventuellement pour une formation et/ou depuis N jours
  function eventCondition(name, cmp, value, course, path) {
    const where = ["e.organization_id = ?", "e.contact_id = c.id", "e.name = ?"];
    const params = [organizationId, name];
    if (course !== undefined) {
      where.push(name === "lms.order_completed" ? "EXISTS (SELECT 1 FROM json_each(e.metadata, '$.items') j WHERE json_extract(j.value, '$.courseId') = ?)" : "json_extract(e.metadata, '$.courseId') = ?");
      params.push(course);
    }
    let minimum = 1;
    if (cmp === "within_days") { where.push("e.occurred_at >= ?"); params.push(nowMs - checkDays(value, path) * DAY_MS); }
    if (cmp === "at_least") {
      if (!Number.isInteger(value) || value < 1 || value > MAX_COUNT) throw fail(path, `Nombre invalide (entier de 1 à ${MAX_COUNT}).`);
      minimum = value;
    }
    return { sql: `(SELECT COUNT(*) FROM mk_events e WHERE ${where.join(" AND ")}) >= ?`, params: [...params, minimum] };
  }

  function spentCondition(cmp, value, path) {
    const orders = "e.organization_id = ? AND e.contact_id = c.id AND e.name = 'lms.order_completed'";
    if (cmp === "is_empty") return { sql: `NOT EXISTS (SELECT 1 FROM mk_events e WHERE ${orders})`, params: [organizationId] };
    if (cmp === "not_empty") return { sql: `EXISTS (SELECT 1 FROM mk_events e WHERE ${orders})`, params: [organizationId] };
    const euros = (v) => {
      const n = checkNumber(v, path);
      if (n < 0) throw fail(path, "Montant invalide : un nombre positif est attendu.");
      return Math.round(n * 100);
    };
    const total = `(SELECT COALESCE(SUM(json_extract(e.metadata, '$.totalCents')), 0) FROM mk_events e WHERE ${orders})`;
    if (cmp === "between") {
      const pair = Array.isArray(value) && value.length === 2 ? value.map(euros) : null;
      if (!pair || pair[0] > pair[1]) throw fail(path, "Valeur invalide : deux montants [min, max] sont attendus.");
      return { sql: `${total} BETWEEN ? AND ?`, params: [organizationId, ...pair] };
    }
    return { sql: `${total} ${{ gt: ">", gte: ">=", lt: "<", lte: "<=" }[cmp]} ?`, params: [organizationId, euros(value)] };
  }

  function propertyCondition(def, col, cmp, value, path) {
    if (def.type === "text") return textCondition(col, cmp, value, path, { allowEmpty: false });
    if (def.type === "select") {
      const options = JSON.parse(def.options);
      const one = (v, p) => {
        if (!options.includes(v)) throw fail(p, "Valeur invalide : hors de la liste de la propriété.");
        return v;
      };
      if (cmp === "eq") return { sql: `${col} = ?`, params: [one(value, path)] };
      const items = checkList(value, path, one);
      return { sql: `${col} IN (${items.map(() => "?").join(", ")})`, params: items };
    }
    if (def.type === "number") {
      if (cmp === "between") {
        const pair = Array.isArray(value) && value.length === 2 ? value.map((v) => checkNumber(v, path)) : null;
        if (!pair || pair[0] > pair[1]) throw fail(path, "Valeur invalide : deux nombres [min, max] sont attendus.");
        return { sql: `${col} BETWEEN ? AND ?`, params: pair };
      }
      const op = { eq: "=", gt: ">", gte: ">=", lt: "<", lte: "<=" }[cmp];
      return { sql: `${col} ${op} ?`, params: [checkNumber(value, path)] };
    }
    if (def.type === "boolean") return { sql: `${col} = ?`, params: [cmp === "is_true" ? 1 : 0] };
    return dateCondition(col, cmp, value, path, today, { nullable: false });
  }

  function coreCondition(kind, field, cmp, value, path) {
    if (kind === "text") return textCondition(TEXT_COLUMNS[field], cmp, value, path, { allowEmpty: true });
    if (kind === "date") return dateCondition(DATE_COLUMNS[field], cmp, value, path, today, { nullable: true });
    if (kind === "lms") return { sql: `c.lms_user_id IS ${cmp === "is_empty" ? "" : "NOT "}NULL`, params: [] };
    if (kind === "status") {
      const one = (v, p) => {
        if (!STATUSES.includes(v)) throw fail(p, `Statut inconnu (${STATUSES.join(", ")}).`);
        return v;
      };
      if (cmp === "eq") return { sql: "c.status = ?", params: [one(value, path)] };
      const items = checkList(value, path, one);
      return { sql: `c.status IN (${items.map(() => "?").join(", ")})`, params: items };
    }
    // Étiquette ou liste : par identifiant (entier) ou par nom (texte), toujours dans l'organisation ; introuvable = ne correspond à rien
    const isTag = kind === "tag";
    if (!(Number.isInteger(value) && value > 0) && (typeof value !== "string" || !value.trim() || value.length > MAX_TEXT)) throw fail(path, "Valeur invalide : un identifiant ou un nom est attendu.");
    const table = isTag ? "mk_tags" : "mk_lists";
    const row = Number.isInteger(value)
      ? db.prepare(`SELECT id FROM ${table} WHERE id = ? AND organization_id = ?`).get(value, organizationId)
      : db.prepare(`SELECT id FROM ${table} WHERE name = ? AND organization_id = ?`).get(value.trim(), organizationId);
    if (!row) return { sql: "0 = 1", params: [] };
    return isTag
      ? { sql: "EXISTS (SELECT 1 FROM mk_contact_tags x WHERE x.contact_id = c.id AND x.organization_id = ? AND x.tag_id = ?)", params: [organizationId, row.id] }
      : { sql: "EXISTS (SELECT 1 FROM mk_list_members x WHERE x.contact_id = c.id AND x.organization_id = ? AND x.list_id = ?)", params: [organizationId, row.id] };
  }

  function node(value, depth, path) {
    if (++state.nodes > MAX_NODES) throw fail(path, `Trop de règles (${MAX_NODES} au plus).`);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw fail(path, "Une règle ou un groupe (objet) est attendu.");
    if (value.op === undefined) return leaf(value, path);
    if (depth > MAX_DEPTH) throw fail(path, `Profondeur maximale dépassée (${MAX_DEPTH} niveaux de groupes).`);
    if (value.op === "not") {
      for (const k of Object.keys(value)) if (k !== "op" && k !== "rule") throw fail(path, `Élément inattendu « ${k.slice(0, 30)} » dans la négation.`);
      if (!value.rule || typeof value.rule !== "object" || Array.isArray(value.rule)) throw fail(path, "Une négation contient exactement une règle (ou un groupe) dans « rule ».");
      const inner = node(value.rule, depth + 1, path ? `${path} › négation` : "négation");
      return { sql: `NOT (${inner.sql})`, params: inner.params };
    }
    if (value.op !== "and" && value.op !== "or") throw fail(path, `Opérateur « ${String(value.op).slice(0, 20)} » inconnu (and, or, not).`);
    for (const k of Object.keys(value)) if (k !== "op" && k !== "rules") throw fail(path, `Élément inattendu « ${k.slice(0, 30)} » dans le groupe.`);
    if (!Array.isArray(value.rules) || !value.rules.length) throw fail(path, "Un groupe ne peut pas être vide (un segment vide ne doit jamais signifier « tout le monde »).");
    const parts = value.rules.map((rule, i) => node(rule, depth + 1, path ? `${path} › règle ${i + 1}` : `règle ${i + 1}`));
    return { sql: `(${parts.map((p) => p.sql).join(value.op === "and" ? " AND " : " OR ")})`, params: parts.flatMap((p) => p.params) };
  }

  return (definition) => {
    if (!definition || typeof definition !== "object" || Array.isArray(definition) || definition.op === undefined) throw fail("", "La définition doit être un groupe (op « and » ou « or »).");
    return node(definition, 1, "");
  };
}

// → { where, params } (fragment à placer après « c.organization_id = ? AND », alias de la table : c)
function compile(ctx, definition) {
  const { sql, params } = createCompiler(ctx)(definition);
  return { where: sql, params };
}

module.exports = { compile, MAX_DEPTH, MAX_NODES };
