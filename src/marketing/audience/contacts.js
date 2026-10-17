// Contacts : création/mise à jour, recherche, suppression. Le STATUT d'un contact n'est jamais modifiable ici :
// seul le module de conformité (consentement, désinscription, suppression) le change. Un import, une synchronisation
// ou une saisie manuelle ne peut donc jamais (ré)abonner quelqu'un par accident.
const { createRepository, prepared } = require("../db/repository");
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
  const direct = prepared(ctx.db, "SELECT * FROM mk_contacts WHERE organization_id = ? AND email = ?").get(ctx.organizationId, normalized);
  if (direct) return direct;
  // Autre adresse d'un contact fusionné (palier 15) : on retrouve la fiche maître
  return prepared(ctx.db, "SELECT c.* FROM mk_contact_aliases a JOIN mk_contacts c ON c.id = a.contact_id WHERE a.organization_id = ? AND a.email = ?").get(ctx.organizationId, normalized) ?? null;
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
      // R7 : un accès limité à un site ne complète que les contacts dont l'origine est son site ; sinon AUCUNE écriture et `withheld: true` (jamais exposer cette fiche ni confirmer son existence)
      if (Number.isInteger(ctx.siteScope)) {
        const access = require("../contactcore/siteAccess");
        if (!access.canWrite(ctx, existing)) {
          if (failIfExists && access.canRead(ctx, existing)) throw new MarketingError("duplicate", "Un contact avec cette adresse existe déjà.");
          return { contact: existing, created: false, withheld: true };
        }
      }
      if (failIfExists) throw new MarketingError("duplicate", "Un contact avec cette adresse existe déjà.");
      const fill = {};
      for (const [k, v] of Object.entries(fields)) if ((existing[k] === "" || existing[k] === null) && v !== "" && v !== null) fill[k] = v;
      if (Object.keys(fill).length) fill.updated_at = new Date().toISOString().slice(0, 19).replace("T", " ");
      const contact = Object.keys(fill).length ? repo.update(existing.id, fill) : existing;
      if (input.properties) setContactProperties({ ...ctx, audit: false }, contact.id, input.properties, { skipEmpty: true });
      return { contact, created: false };
    }
    // R7 : un contact créé par un accès LIMITÉ à un site a ce site pour origine (imposé par le serveur) — c'est ce qui lui en donne ensuite l'écriture
    const origin = Number.isInteger(ctx.siteScope) && ctx.siteScope > 0 ? { origin_site_id: ctx.siteScope } : {};
    const contact = repo.insert({ email: check.email, ...fields, ...origin, status: isSuppressed(ctx, check.email) ? "suppressed" : "unknown" });
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
  // Fichiers envoyés par ses formulaires (dossier protégé uploads/forms/<organisation>/) : relevés AVANT, effacés du
  // disque APRÈS la suppression en base (leurs lignes partent avec le contact, en cascade)
  const { resolveUpload } = require("../../utils/storage");
  const family = [id, ...ctx.db.prepare("SELECT id FROM mk_contacts WHERE organization_id = ? AND merged_into_id = ?").all(ctx.organizationId, id).map((r) => r.id)];
  const files = family.flatMap((cid) => ctx.db.prepare("SELECT path FROM mk_form_files WHERE organization_id = ? AND contact_id = ?").all(ctx.organizationId, cid))
    .map((f) => (f.path.startsWith(`/uploads/forms/${ctx.organizationId}/`) ? resolveUpload(f.path) : null)).filter(Boolean);
  const done = transaction(ctx.db, () => {
    // Contact Core : une fiche maître emporte avec elle les fiches qu'elle avait absorbées (données de la même personne) ;
    // les événements restent dans le journal mais sans identité (contact, e-mail et données associées retirés)
    ctx.db.prepare("DELETE FROM mk_contact_merges WHERE organization_id = ? AND (master_id = ? OR source_id = ?)").run(ctx.organizationId, id, id);
    const absorbed = ctx.db.prepare("SELECT id, email FROM mk_contacts WHERE organization_id = ? AND merged_into_id = ?").all(ctx.organizationId, id);
    for (const old of absorbed) {
      ctx.db.prepare("UPDATE mk_events SET contact_id = NULL, email = NULL, metadata = '{}' WHERE organization_id = ? AND contact_id = ?").run(ctx.organizationId, old.id);
      createRepository(ctx.db, ctx.organizationId).table("mk_contacts").remove(old.id);
    }
    ctx.db.prepare("UPDATE mk_events SET contact_id = NULL, email = NULL, metadata = '{}' WHERE organization_id = ? AND contact_id = ?").run(ctx.organizationId, id);
    // Événements rattachés à l'adresse seule (ex. commentaires d'un invité) : l'adresse et les données associées sont retirées aussi
    for (const address of [contact.email, ...ctx.db.prepare("SELECT email FROM mk_contact_aliases WHERE organization_id = ? AND contact_id = ?").all(ctx.organizationId, id).map((r) => r.email)]) {
      ctx.db.prepare("UPDATE mk_events SET email = NULL, metadata = '{}' WHERE organization_id = ? AND email = ?").run(ctx.organizationId, address);
    }
    if (suppress) {
      const emails = [contact.email, ...ctx.db.prepare("SELECT email FROM mk_contact_aliases WHERE organization_id = ? AND contact_id = ?").all(ctx.organizationId, id).map((r) => r.email)];
      for (const address of emails) ctx.db.prepare("INSERT OR IGNORE INTO mk_suppressions (organization_id, email, reason) VALUES (?, ?, 'erasure')").run(ctx.organizationId, address);
    }
    const removed = createRepository(ctx.db, ctx.organizationId).table("mk_contacts").remove(id);
    if (removed) audit(ctx, "contact.deleted", "contact", id, { suppress });
    return removed;
  });
  if (done) for (const abs of files) require("fs").rmSync(abs, { force: true });
  return done;
}

const escapeLike = (text) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

const DAY_MS = 86_400_000;
const sqlDate = (ms) => new Date(ms).toISOString().slice(0, 19).replace("T", " ");

// « custom » : fragment SQL déjà construit PAR LE SERVEUR (ex. un segment enregistré) — jamais issu d'une entrée utilisateur
const RECORD_STATUSES = ["active", "inactive", "archived", "merged"];
const CONSENT_FILTERS = ["granted", "withdrawn", "none"];
const ymd = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

function filters(ctx, { status, q, listId, tagId, source, sendable, sinceDays, custom, noSensitiveSearch, lifecycle, recordStatus, siteId, consent, createdFrom, createdTo, activeSinceDays, inactiveDays, userLinked } = {}) {
  const where = ["c.organization_id = ?"];
  const params = [ctx.organizationId];
  if (status !== undefined) {
    if (!STATUSES.includes(status)) throw new MarketingError("invalid_field", "Statut inconnu.");
    where.push("c.status = ?");
    params.push(status);
  }
  if (typeof q === "string" && q.trim()) {
    const like = `%${escapeLike(q.trim().slice(0, 100))}%`;
    // Sans le droit « données sensibles » : on ne cherche que dans les noms (sinon la recherche révélerait adresses et numéros)
    if (noSensitiveSearch) { where.push("(c.first_name LIKE ? ESCAPE '\\' OR c.last_name LIKE ? ESCAPE '\\' OR c.company LIKE ? ESCAPE '\\')"); params.push(like, like, like); }
    else {
    const digits = q.replace(/[^\d+]/g, "");
    const phoneLike = digits.replace(/\D/g, "").length >= 4 ? `%${escapeLike(digits.replace(/^\+/, ""))}%` : null;
    where.push(`(c.email LIKE ? ESCAPE '\\' OR c.first_name LIKE ? ESCAPE '\\' OR c.last_name LIKE ? ESCAPE '\\' OR c.company LIKE ? ESCAPE '\\'${phoneLike ? " OR c.normalized_phone LIKE ? ESCAPE '\\' OR c.phone LIKE ? ESCAPE '\\'" : ""})`);
    params.push(like, like, like, like, ...(phoneLike ? [phoneLike, `%${escapeLike(q.trim().slice(0, 100))}%`] : []));
    }
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
  // ----- Contact Core (palier 15) -----
  if (typeof lifecycle === "string" && lifecycle) { where.push("c.lifecycle_stage = ?"); params.push(lifecycle.slice(0, 31)); }
  // « live » = fiches actives ou inactives (le défaut de l'interface) ; sans ce critère, toutes les fiches (compatibilité)
  if (recordStatus === "live") where.push("c.record_status IN ('active', 'inactive')");
  else if (recordStatus !== undefined && recordStatus !== "all") {
    if (!RECORD_STATUSES.includes(recordStatus)) throw new MarketingError("invalid_field", "État de fiche inconnu.");
    where.push("c.record_status = ?"); params.push(recordStatus);
  }
  // R7 : filtre d'affichage par site (équipe) — contacts associés au site (origine ou événement), via mk_contact_sites
  if (siteId !== undefined && siteId !== null) {
    if (!Number.isInteger(Number(siteId)) || Number(siteId) < 1) throw new MarketingError("invalid_field", "Site invalide.");
    where.push("EXISTS (SELECT 1 FROM mk_contact_sites cs WHERE cs.contact_id = c.id AND cs.site_id = ? AND cs.organization_id = c.organization_id)");
    params.push(Number(siteId));
  }
  // R7 : un accès LIMITÉ à un site ne liste que les contacts de son site, quel que soit l'appelant (jamais déduit de l'adresse)
  { const r = require("../contactcore/siteAccess").readSql(ctx, "c"); if (r) { where.push(r.sql); params.push(...r.params); } }
  if (consent !== undefined && consent !== "") {
    if (!CONSENT_FILTERS.includes(consent)) throw new MarketingError("invalid_field", "Filtre de consentement inconnu.");
    const last = "(SELECT k.action FROM mk_consents k WHERE k.contact_id = c.id AND k.organization_id = c.organization_id AND k.purpose = 'marketing' ORDER BY k.id DESC LIMIT 1)";
    where.push(consent === "none" ? `${last} IS NULL` : `${last} = ?`);
    if (consent !== "none") params.push(consent);
  }
  if (ymd(createdFrom)) { where.push("c.created_at >= ?"); params.push(`${createdFrom} 00:00:00`); }
  if (ymd(createdTo)) { where.push("c.created_at <= ?"); params.push(`${createdTo} 23:59:59`); }
  const act = Number(activeSinceDays);
  if (Number.isInteger(act) && act > 0 && act <= 3650) { where.push("c.last_activity_at >= ?"); params.push(sqlDate((typeof ctx.now === "function" ? ctx.now() : Date.now()) - act * DAY_MS)); }
  const idle = Number(inactiveDays);
  if (Number.isInteger(idle) && idle > 0 && idle <= 3650) { where.push("(c.last_activity_at IS NULL OR c.last_activity_at < ?)"); params.push(sqlDate((typeof ctx.now === "function" ? ctx.now() : Date.now()) - idle * DAY_MS)); }
  if (userLinked === true) where.push("c.lms_user_id IS NOT NULL");
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

module.exports = { RECORD_STATUSES, CONSENT_FILTERS, SORTS, PAGE_SIZES, filters, searchContacts, STATUSES, upsertContact, createContact, updateContact, deleteContact, getContact, requireContact, findByEmail, listContacts, countContacts };
