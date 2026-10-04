// Contacts : création/mise à jour, recherche, suppression. Le STATUT d'un contact n'est jamais modifiable ici :
// seul le module de conformité (consentement, désinscription, suppression) le change. Un import, une synchronisation
// ou une saisie manuelle ne peut donc jamais (ré)abonner quelqu'un par accident.
const { createRepository } = require("../db/repository");
const { transaction } = require("../db/tx");
const { validateEmail, normalizeEmail } = require("./email");
const { checkCtx, cleanText, audit, emit, MarketingError } = require("./shared");
const { setContactProperties } = require("./properties");
const { sendableSql } = require("../compliance/sendable");

const STATUSES = ["unknown", "subscribed", "unsubscribed", "bounced", "complained", "suppressed"];
const { isTimeZone } = require("../sending/sendtime");
const TEXT_FIELDS = { first_name: 100, last_name: 100, phone: 40, company: 200, country: 100, language: 20, source: 50 };
const EDITABLE = new Set([...Object.keys(TEXT_FIELDS), "lms_user_id", "timezone"]);
const MAX_PAGE = 200;

function readFields(input, { forCreate }) {
  const out = {};
  for (const [field, max] of Object.entries(TEXT_FIELDS)) {
    if (input[field] !== undefined) out[field] = cleanText(input[field], { max, field });
  }
  // Fuseau horaire IANA (« Africa/Kinshasa ») : sert à l'envoi à l'heure locale ; vide = inconnu
  if (input.timezone !== undefined && input.timezone !== null) {
    const tz = String(input.timezone).trim();
    if (tz && !isTimeZone(tz)) throw new MarketingError("invalid_field", "Fuseau horaire inconnu (exemple : Africa/Kinshasa, Europe/Paris).");
    out.timezone = tz;
  }
  if (input.lms_user_id !== undefined && input.lms_user_id !== null) {
    if (!Number.isInteger(input.lms_user_id) || input.lms_user_id < 1) throw new MarketingError("invalid_field", "lms_user_id doit être un entier positif.");
    out.lms_user_id = input.lms_user_id;
  } else if (forCreate && input.lms_user_id === null) out.lms_user_id = null;
  return out;
}

const isSuppressed = (ctx, email) =>
  Boolean(ctx.db.prepare("SELECT 1 FROM mk_suppressions WHERE organization_id = ? AND email = ?").get(ctx.organizationId, email));

function findByEmail(ctx, email) {
  checkCtx(ctx);
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return ctx.db.prepare("SELECT * FROM mk_contacts WHERE organization_id = ? AND email = ?").get(ctx.organizationId, normalized) ?? null;
}

function getContact(ctx, id) {
  checkCtx(ctx);
  return createRepository(ctx.db, ctx.organizationId).table("mk_contacts").get(id);
}

function requireContact(ctx, id) {
  const contact = getContact(ctx, id);
  if (!contact) throw new MarketingError("not_found", "Contact introuvable.");
  return contact;
}

// Crée le contact, ou complète l'existant (champs vides seulement ; jamais le statut). → { contact, created }
function upsertContact(ctx, input = {}, { failIfExists = false } = {}) {
  checkCtx(ctx);
  const check = validateEmail(input.email);
  if (!check.ok) throw new MarketingError("invalid_email", check.reason);
  const fields = readFields(input, { forCreate: true });
  if (input.properties !== undefined && (input.properties === null || typeof input.properties !== "object")) {
    throw new MarketingError("invalid_field", "Les propriétés doivent être un objet {clé: valeur}.");
  }

  return transaction(ctx.db, () => {
    const repo = createRepository(ctx.db, ctx.organizationId).table("mk_contacts");
    const existing = findByEmail(ctx, check.email);
    if (existing) {
      if (failIfExists) throw new MarketingError("duplicate", "Un contact avec cette adresse existe déjà.");
      const fill = {};
      for (const [k, v] of Object.entries(fields)) if ((existing[k] === "" || existing[k] === null) && v !== "" && v !== null) fill[k] = v;
      if (Object.keys(fill).length) fill.updated_at = new Date().toISOString().slice(0, 19).replace("T", " ");
      const contact = Object.keys(fill).length ? repo.update(existing.id, fill) : existing;
      if (input.properties) setContactProperties({ ...ctx, audit: false }, contact.id, input.properties, { skipEmpty: true });
      return { contact, created: false };
    }
    const contact = repo.insert({ email: check.email, ...fields, status: isSuppressed(ctx, check.email) ? "suppressed" : "unknown" });
    if (input.properties) setContactProperties({ ...ctx, audit: false }, contact.id, input.properties, { skipEmpty: true });
    emit(ctx, "contact.created", { contact, idempotencyKey: `contact.created:${ctx.organizationId}:${contact.id}`, metadata: { source: contact.source } });
    audit(ctx, "contact.created", "contact", contact.id, { source: contact.source });
    return { contact, created: true };
  });
}

const createContact = (ctx, input) => upsertContact(ctx, input, { failIfExists: true }).contact;

function updateContact(ctx, id, patch = {}) {
  checkCtx(ctx);
  for (const key of Object.keys(patch)) {
    if (key === "properties") continue;
    if (!EDITABLE.has(key)) throw new MarketingError("immutable_field", `Le champ « ${key} » ne peut pas être modifié ici (l'e-mail est fixe ; le statut dépend du consentement).`);
  }
  requireContact(ctx, id);
  return transaction(ctx.db, () => {
    const fields = readFields(patch, { forCreate: false });
    const repo = createRepository(ctx.db, ctx.organizationId).table("mk_contacts");
    const contact = repo.update(id, { ...fields, updated_at: new Date().toISOString().slice(0, 19).replace("T", " ") });
    if (patch.properties) setContactProperties({ ...ctx, audit: false }, id, patch.properties);
    audit(ctx, "contact.updated", "contact", id, { fields: Object.keys(patch) });
    return contact;
  });
}

// Effacement (droit à l'effacement) : le contact et tout ce qui le concerne disparaissent. Avec { suppress: true },
// l'adresse reste en liste de suppression pour qu'un réimport ne la rende pas joignable.
function deleteContact(ctx, id, { suppress = false } = {}) {
  checkCtx(ctx);
  const contact = getContact(ctx, id);
  if (!contact) return false;
  return transaction(ctx.db, () => {
    if (suppress) {
      ctx.db.prepare("INSERT OR IGNORE INTO mk_suppressions (organization_id, email, reason) VALUES (?, ?, 'erasure')").run(ctx.organizationId, contact.email);
    }
    const removed = createRepository(ctx.db, ctx.organizationId).table("mk_contacts").remove(id);
    if (removed) audit(ctx, "contact.deleted", "contact", id, { suppress });
    return removed;
  });
}

const escapeLike = (text) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

const DAY_MS = 86_400_000;
const sqlDate = (ms) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");

// « custom » : fragment SQL déjà construit PAR LE SERVEUR (ex. un segment enregistré) — jamais issu d'une entrée utilisateur
function filters(ctx, { status, q, listId, tagId, source, sendable, sinceDays, custom } = {}) {
  const where = ["c.organization_id = ?"];
  const params = [ctx.organizationId];
  if (status !== undefined) {
    if (!STATUSES.includes(status)) throw new MarketingError("invalid_field", "Statut inconnu.");
    where.push("c.status = ?");
    params.push(status);
  }
  if (typeof q === "string" && q.trim()) {
    const like = `%${escapeLike(q.trim().slice(0, 100))}%`;
    where.push("(c.email LIKE ? ESCAPE '\\' OR c.first_name LIKE ? ESCAPE '\\' OR c.last_name LIKE ? ESCAPE '\\' OR c.company LIKE ? ESCAPE '\\')");
    params.push(like, like, like, like);
  }
  if (listId !== undefined) {
    where.push("EXISTS (SELECT 1 FROM mk_list_members m WHERE m.contact_id = c.id AND m.list_id = ? AND m.organization_id = c.organization_id)");
    params.push(Number(listId));
  }
  if (tagId !== undefined) {
    where.push("EXISTS (SELECT 1 FROM mk_contact_tags t WHERE t.contact_id = c.id AND t.tag_id = ? AND t.organization_id = c.organization_id)");
    params.push(Number(tagId));
  }
  if (typeof source === "string" && source.trim()) {
    where.push("c.source = ?");
    params.push(source.trim().slice(0, 50));
  }
  if (sendable === true) {
    const s = sendableSql("c");
    where.push(`(${s.sql})`);
    params.push(...s.params);
  }
  const days = Number(sinceDays);
  if (Number.isInteger(days) && days > 0 && days <= 3650) {
    const now = typeof ctx.now === "function" ? ctx.now() : Date.now();
    where.push("c.created_at >= ?");
    params.push(sqlDate(now - days * DAY_MS));
  }
  if (custom && typeof custom.sql === "string" && Array.isArray(custom.params)) {
    where.push(`(${custom.sql})`);
    params.push(...custom.params);
  }
  return { sql: where.join(" AND "), params };
}

function listContacts(ctx, { limit = 50, afterId, ...criteria } = {}) {
  checkCtx(ctx);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE) throw new MarketingError("invalid_field", `Limite invalide (entre 1 et ${MAX_PAGE}).`);
  const { sql, params } = filters(ctx, criteria);
  const cursor = afterId ? " AND c.id > ?" : "";
  if (afterId) params.push(Number(afterId));
  const rows = ctx.db.prepare(`SELECT c.* FROM mk_contacts c WHERE ${sql}${cursor} ORDER BY c.id ASC LIMIT ?`).all(...params, limit + 1);
  const more = rows.length > limit;
  const page = more ? rows.slice(0, limit) : rows;
  return { rows: page, nextAfterId: more ? page[page.length - 1].id : null };
}

function countContacts(ctx, criteria = {}) {
  checkCtx(ctx);
  const { sql, params } = filters(ctx, criteria);
  return ctx.db.prepare(`SELECT COUNT(*) AS n FROM mk_contacts c WHERE ${sql}`).get(...params).n;
}

// ---------- Recherche paginée et triée (interface) ----------
// Les colonnes de tri viennent d'une liste blanche : rien de ce que l'utilisateur envoie n'est jamais copié dans le SQL.
const SORTS = {
  email: { asc: "c.email COLLATE NOCASE ASC, c.id ASC", desc: "c.email COLLATE NOCASE DESC, c.id ASC", defaultDir: "asc" },
  name: { asc: "(c.last_name = '') ASC, c.last_name COLLATE NOCASE ASC, c.first_name COLLATE NOCASE ASC, c.id ASC", desc: "(c.last_name = '') ASC, c.last_name COLLATE NOCASE DESC, c.first_name COLLATE NOCASE DESC, c.id ASC", defaultDir: "asc" },
  status: { asc: "c.status ASC, c.id ASC", desc: "c.status DESC, c.id ASC", defaultDir: "asc" },
  source: { asc: "c.source COLLATE NOCASE ASC, c.id ASC", desc: "c.source COLLATE NOCASE DESC, c.id ASC", defaultDir: "asc" },
  created: { asc: "c.created_at ASC, c.id ASC", desc: "c.created_at DESC, c.id DESC", defaultDir: "desc" },
  activity: { asc: "c.last_activity_at IS NULL, c.last_activity_at ASC, c.id ASC", desc: "c.last_activity_at IS NULL, c.last_activity_at DESC, c.id ASC", defaultDir: "desc" },
};
const PAGE_SIZES = [25, 50, 100];
const DEFAULT_PAGE_SIZE = 50;

function searchContacts(ctx, criteria = {}, { sort, dir, page, pageSize } = {}) {
  checkCtx(ctx);
  const key = Object.hasOwn(SORTS, sort) ? sort : "created";
  const direction = dir === "asc" || dir === "desc" ? dir : SORTS[key].defaultDir;
  const size = PAGE_SIZES.includes(Number(pageSize)) ? Number(pageSize) : DEFAULT_PAGE_SIZE;
  const { sql, params } = filters(ctx, criteria);
  const total = ctx.db.prepare(`SELECT COUNT(*) AS n FROM mk_contacts c WHERE ${sql}`).get(...params).n;
  const pages = Math.max(1, Math.ceil(total / size));
  const wanted = Number.isInteger(Number(page)) ? Number(page) : 1;
  const current = Math.min(Math.max(wanted, 1), pages);
  const rows = ctx.db.prepare(`SELECT c.* FROM mk_contacts c WHERE ${sql} ORDER BY ${SORTS[key][direction]} LIMIT ? OFFSET ?`).all(...params, size, (current - 1) * size);
  return { rows, total, page: current, pages, pageSize: size, sort: key, dir: direction };
}

module.exports = { SORTS, PAGE_SIZES, filters, searchContacts, STATUSES, upsertContact, createContact, updateContact, deleteContact, getContact, requireContact, findByEmail, listContacts, countContacts };
