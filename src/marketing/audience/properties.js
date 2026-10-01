// Propriétés personnalisées : définition typée par organisation, valeurs validées selon le type.
const { createRepository } = require("../db/repository");
const { transaction } = require("../db/tx");
const { checkCtx, cleanText, audit, MarketingError } = require("./shared");

const TYPES = ["text", "number", "date", "boolean", "select"];
const RESERVED = new Set(["id", "email", "status", "first_name", "last_name", "phone", "company", "country", "language", "source", "lms_user_id", "tags", "lists", "created_at", "updated_at", "organization_id"]);
const KEY = /^[a-z][a-z0-9_]{0,39}$/;
const TRUE = new Set(["true", "1", "oui", "yes", "vrai", "o", "y"]);
const FALSE = new Set(["false", "0", "non", "no", "faux", "n"]);

function defineProperty(ctx, { key, label, type, options = [] } = {}) {
  checkCtx(ctx);
  if (typeof key !== "string" || !KEY.test(key) || RESERVED.has(key)) {
    throw new MarketingError("invalid_property", "Clé invalide : minuscules, chiffres et « _ », commençant par une lettre (40 caractères au plus), et différente des champs standard.");
  }
  if (!TYPES.includes(type)) throw new MarketingError("invalid_property", `Type inconnu (${TYPES.join(", ")}).`);
  const cleanLabel = cleanText(label, { max: 100, field: "label" });
  if (!cleanLabel) throw new MarketingError("invalid_property", "Le libellé est obligatoire.");
  let json = "[]";
  if (type === "select") {
    const list = Array.isArray(options) ? [...new Set(options.map((o) => cleanText(o, { max: 100, field: "option" })).filter(Boolean))] : [];
    if (!list.length || list.length > 50) throw new MarketingError("invalid_property", "Un choix multiple demande de 1 à 50 options.");
    json = JSON.stringify(list);
  }
  const repo = createRepository(ctx.db, ctx.organizationId).table("mk_property_defs");
  if (repo.count({ key }) > 0) throw new MarketingError("duplicate", "Une propriété avec cette clé existe déjà.");
  const row = repo.insert({ key, label: cleanLabel, type, options: json });
  audit(ctx, "property.created", "property", row.id, { key, type });
  return row;
}

const listProperties = (ctx) => (checkCtx(ctx), createRepository(ctx.db, ctx.organizationId).table("mk_property_defs").list({ limit: 200, orderBy: "key" }).rows);

function realDate(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// → colonnes de valeur à écrire ; lève invalid_value si la valeur ne convient pas au type
function coerce(def, raw) {
  const bad = (why) => new MarketingError("invalid_value", `Valeur invalide pour « ${def.key} » : ${why}`);
  const blank = { value_text: null, value_number: null, value_date: null, value_boolean: null };
  if (def.type === "number") {
    const text = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim().replace(",", ".") : "";
    if (!/^-?\d+(\.\d+)?$/.test(text) || !Number.isFinite(Number(text))) throw bad("un nombre est attendu.");
    return { ...blank, value_number: Number(text) };
  }
  if (def.type === "date") {
    const text = typeof raw === "string" ? raw.trim() : "";
    let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    let y, mo, d;
    if (m) [y, mo, d] = [+m[1], +m[2], +m[3]];
    else if ((m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text))) [y, mo, d] = [+m[3], +m[2], +m[1]];
    if (y === undefined || !realDate(y, mo, d)) throw bad("une date AAAA-MM-JJ (ou JJ/MM/AAAA) existante est attendue.");
    return { ...blank, value_date: `${String(y).padStart(4, "0")}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
  }
  if (def.type === "boolean") {
    const text = typeof raw === "boolean" ? String(raw) : typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim().toLowerCase() : "";
    if (TRUE.has(text)) return { ...blank, value_boolean: 1 };
    if (FALSE.has(text)) return { ...blank, value_boolean: 0 };
    throw bad("oui/non attendu.");
  }
  if (typeof raw !== "string") throw bad("un texte est attendu.");
  const text = cleanText(raw, { max: 500, field: def.key });
  if (def.type === "select" && !JSON.parse(def.options).includes(text)) throw bad("valeur hors de la liste autorisée.");
  return { ...blank, value_text: text };
}

const isEmpty = (v) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");

// Écrit plusieurs valeurs d'un coup, ATOMIQUEMENT. Une valeur vide retire la propriété (sauf { skipEmpty } : on ignore).
function setContactProperties(ctx, contactId, values, { skipEmpty = false } = {}) {
  checkCtx(ctx);
  if (!values || typeof values !== "object" || Array.isArray(values)) throw new MarketingError("invalid_field", "Les propriétés doivent être un objet {clé: valeur}.");
  const { db, organizationId } = ctx;
  if (!db.prepare("SELECT 1 FROM mk_contacts WHERE id = ? AND organization_id = ?").get(contactId, organizationId)) throw new MarketingError("not_found", "Contact introuvable.");
  return transaction(db, () => {
    for (const [key, raw] of Object.entries(values)) {
      const def = db.prepare("SELECT * FROM mk_property_defs WHERE organization_id = ? AND key = ?").get(organizationId, key);
      if (!def) throw new MarketingError("unknown_property", `Propriété inconnue : « ${String(key).slice(0, 40)} ».`);
      if (isEmpty(raw)) {
        if (!skipEmpty) db.prepare("DELETE FROM mk_contact_property_values WHERE contact_id = ? AND property_id = ? AND organization_id = ?").run(contactId, def.id, organizationId);
        continue;
      }
      const v = coerce(def, raw);
      db.prepare(
        `INSERT INTO mk_contact_property_values (organization_id, contact_id, property_id, value_text, value_number, value_date, value_boolean)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (contact_id, property_id) DO UPDATE SET value_text = excluded.value_text, value_number = excluded.value_number,
           value_date = excluded.value_date, value_boolean = excluded.value_boolean`
      ).run(organizationId, contactId, def.id, v.value_text, v.value_number, v.value_date, v.value_boolean);
    }
  });
}

// Vérifie des valeurs SANS rien écrire (analyse à blanc d'un import) ; lève la même erreur que setContactProperties
function validatePropertyValues(ctx, values) {
  checkCtx(ctx);
  for (const [key, raw] of Object.entries(values)) {
    const def = ctx.db.prepare("SELECT * FROM mk_property_defs WHERE organization_id = ? AND key = ?").get(ctx.organizationId, key);
    if (!def) throw new MarketingError("unknown_property", `Propriété inconnue : « ${String(key).slice(0, 40)} ».`);
    if (!isEmpty(raw)) coerce(def, raw);
  }
}

function getContactProperties(ctx, contactId) {
  checkCtx(ctx);
  const rows = ctx.db
    .prepare(
      `SELECT d.key, d.type, v.value_text, v.value_number, v.value_date, v.value_boolean FROM mk_contact_property_values v
       JOIN mk_property_defs d ON d.id = v.property_id
       WHERE v.contact_id = ? AND v.organization_id = ? ORDER BY d.key`
    )
    .all(contactId, ctx.organizationId);
  const out = {};
  for (const r of rows) out[r.key] = r.type === "number" ? r.value_number : r.type === "date" ? r.value_date : r.type === "boolean" ? r.value_boolean === 1 : r.value_text;
  return out;
}

// Nombre de contacts pour lesquels chaque propriété est renseignée : Map propertyId → nombre
function propertyUsage(ctx) {
  checkCtx(ctx);
  return new Map(ctx.db.prepare("SELECT property_id, COUNT(DISTINCT contact_id) AS n FROM mk_contact_property_values WHERE organization_id = ? GROUP BY property_id").all(ctx.organizationId).map((r) => [r.property_id, r.n]));
}

module.exports = { propertyUsage, TYPES, defineProperty, listProperties, setContactProperties, validatePropertyValues, getContactProperties };
