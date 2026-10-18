// Contact Core (palier 15) : le point d'entrée UNIQUE des autres modules (CMS, formulaires, inscriptions, commentaires, tunnels,
// e-commerce, e-mailing…) pour identifier un contact et enregistrer ce qui lui arrive. Ce n'est PAS un deuxième système de
// contacts : il s'appuie sur mk_contacts (audience/), mk_consents (compliance/), mk_events (events/) et mk_web_visitors (visitors/).
//
// Règles de fond :
//  - utilisateur ≠ contact : le lien est explicite (mk_contacts.lms_user_id) et refusé si l'adresse du compte diffère ;
//  - contact ≠ consentement : identify() ne change JAMAIS le statut d'abonnement (voir compliance/consent.js, seul à le faire) ;
//  - un événement est un fait historique, enregistré uniquement par recordEvent() (jamais par INSERT direct) ;
//  - fusion = absorption réversible à la main : la fiche absorbée est conservée (jamais supprimée), son historique reste lisible.
const { transaction } = require("../db/tx");
const primarySite = require("../../services/primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire
const siteAccess = require("./siteAccess");
const { MarketingError } = require("../errors");
const { checkCtx, cleanText, audit } = require("../audience/shared");
const { validateEmail } = require("../audience/email");
const contacts = require("../audience/contacts");
const { normalizePhone } = require("../sms/phone");
const visitors = require("../visitors");

// ---------- Vocabulaire (extensible : une étape personnalisée s'ajoute dans le réglage « contacts.lifecycle_stages ») ----------
const LIFECYCLE_STAGES = Object.freeze({
  contact: "Contact", lead: "Prospect", subscriber: "Abonné", member: "Membre", customer: "Client", former_customer: "Ancien client",
});
const RECORD_STATUS_LABELS = Object.freeze({ active: "Active", inactive: "Inactive", archived: "Archivée", merged: "Fusionnée" });
const SOURCES = Object.freeze(["website", "form", "landing_page", "funnel", "checkout", "ecommerce", "import", "manual", "registration", "signup", "comment", "api", "lms", "survey"]);
// Étape de départ selon l'origine (jamais rétrogradée ensuite) : un commentaire ne fait pas d'une personne un « prospect »
const STAGE_BY_SOURCE = Object.freeze({ form: "lead", landing_page: "lead", funnel: "lead", checkout: "lead", ecommerce: "customer", registration: "member", signup: "member", lms: "member" });
const SLUG = /^[a-z][a-z0-9_]{1,30}$/;
const EVENT_NAME = /^[a-z][a-z0-9_.]{1,63}$/;
const OBJECT_TYPE = /^[a-z][a-z0-9_.]{0,39}$/;
const SETTING_STAGES = "contacts.lifecycle_stages";

function customStages(ctx) {
  try {
    const raw = ctx.settings && typeof ctx.settings.get === "function" ? ctx.settings.get(ctx.organizationId, SETTING_STAGES) : null;
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((s) => typeof s === "string" && SLUG.test(s)) : [];
  } catch { return []; }
}
const lifecycleStages = (ctx) => ({ ...Object.fromEntries(customStages(ctx).map((s) => [s, s])), ...LIFECYCLE_STAGES });

function checkStage(ctx, stage) {
  if (typeof stage !== "string" || !Object.hasOwn(lifecycleStages(ctx), stage)) throw new MarketingError("invalid_field", "Étape de cycle de vie inconnue.");
  return stage;
}

function checkSite(ctx, siteId) {
  if (siteId === null || siteId === undefined) return null;
  if (!Number.isInteger(siteId) || siteId < 1) throw new MarketingError("invalid_field", "Site invalide.");
  if (!ctx.db.prepare(`SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(ctx.db)}`).get(siteId, ctx.organizationId)) throw new MarketingError("not_found", "Site introuvable.");
  return siteId;
}

const sqlNow = () => new Date().toISOString().slice(0, 19).replace("T", " ");

// ---------- Identification ----------
// Crée ou retrouve le contact d'une adresse (en suivant les adresses alias d'une fusion), complète ses champs VIDES, relie un compte
// KOLAKISA si l'adresse est la même, rattache les événements orphelins de cette adresse et le visiteur anonyme. Ne touche JAMAIS au consentement.
function identify(ctx, input = {}, { failIfExists = false } = {}) {
  checkCtx(ctx);
  const check = validateEmail(input.email);
  if (!check.ok) throw new MarketingError("invalid_email", check.reason);
  // R7 : pour un accès LIMITÉ à un site, le site d'origine est celui du serveur (ctx.siteScope), jamais celui de l'appelant
  const scoped = Number.isInteger(ctx.siteScope);
  const siteId = checkSite(ctx, scoped ? ctx.siteScope : input.siteId ?? null);
  const source = cleanText(input.source ?? "api", { max: 50, field: "source" }) || "api";
  const sourceDetail = cleanText(input.sourceDetail ?? "", { max: 200, field: "source_detail" });
  const jobTitle = cleanText(input.jobTitle ?? "", { max: 120, field: "job_title" });
  const phoneRaw = input.phone === undefined || input.phone === null ? "" : cleanText(input.phone, { max: 40, field: "phone" });
  const phone = phoneRaw ? normalizePhone(phoneRaw, { defaultCountry: input.defaultCountry }) : null;

  let userId = null;
  if (input.userId !== undefined && input.userId !== null) {
    if (!Number.isInteger(input.userId) || input.userId < 1) throw new MarketingError("invalid_field", "Identifiant de compte invalide.");
    const user = ctx.db.prepare("SELECT id, email FROM users WHERE id = ?").get(input.userId);
    if (!user) throw new MarketingError("not_found", "Compte introuvable.");
    // Le lien utilisateur ↔ contact est explicite ET cohérent : jamais un compte rattaché à la fiche d'une autre adresse
    if (validateEmail(user.email).email !== check.email) throw new MarketingError("user_mismatch", "Ce compte n'a pas la même adresse e-mail que le contact : le lien est refusé.");
    userId = user.id;
  }
  let stage = null;
  if (input.lifecycleStage !== undefined && input.lifecycleStage !== null) stage = checkStage(ctx, input.lifecycleStage);

  return transaction(ctx.db, () => {
    const found = contacts.findByEmail(ctx, check.email);
    // R7 : un accès limité à un site ne complète ni ne modifie QUE les contacts dont l'origine est son site (une simple activité ne suffit pas, un contact sans association non plus).
    // Sinon : AUCUNE écriture (champs, étape, téléphone, compte, événements orphelins) et `withheld: true` — l'appelant ne doit jamais exposer cette fiche ni confirmer son existence.
    if (found && scoped && !siteAccess.canWrite(ctx, found)) {
      if (failIfExists && siteAccess.canRead(ctx, found)) throw new MarketingError("duplicate", "Un contact avec cette adresse existe déjà.");
      return { contact: found, created: false, withheld: true, attachedEvents: 0 };
    }
    if (found && failIfExists) throw new MarketingError("duplicate", "Un contact avec cette adresse existe déjà.");
    const base = { email: check.email, source };
    for (const f of ["first_name", "last_name", "company", "country", "language", "timezone"]) if (input[f] !== undefined) base[f] = input[f];
    if (phoneRaw) base.phone = phoneRaw;
    if (input.properties) base.properties = input.properties;
    // upsertContact complète seulement les champs vides ; l'adresse alias d'une fiche fusionnée mène au maître (pas de doublon)
    let contact, created;
    if (found && found.email !== check.email) { contact = found; created = false; if (base.properties) require("../audience/properties").setContactProperties({ ...ctx, audit: false }, found.id, base.properties, { skipEmpty: true }); }
    else ({ contact, created } = contacts.upsertContact(ctx, { ...base, ...(userId && !(found && found.lms_user_id) ? { lms_user_id: userId } : {}) }));

    const patch = {};
    if (created) {
      patch.lifecycle_stage = stage || STAGE_BY_SOURCE[source] || "contact";
      if (siteId) patch.origin_site_id = siteId;
      patch.source_detail = sourceDetail;
    } else if (stage && contact.lifecycle_stage === "contact") patch.lifecycle_stage = stage;
    if (!created && !contact.source_detail && sourceDetail) patch.source_detail = sourceDetail;
    if (!contact.job_title && jobTitle) patch.job_title = jobTitle;
    if (created && jobTitle) patch.job_title = jobTitle;
    if (phone && phone.ok && (!contact.normalized_phone)) patch.normalized_phone = phone.e164;
    if (userId && contact.lms_user_id === null) {
      const taken = ctx.db.prepare("SELECT id FROM mk_contacts WHERE organization_id = ? AND lms_user_id = ? AND id <> ?").get(ctx.organizationId, userId, contact.id);
      if (!taken) patch.lms_user_id = userId;
    }
    if (Object.keys(patch).length) {
      const sets = Object.keys(patch).map((k) => `${k} = ?`).join(", ");
      ctx.db.prepare(`UPDATE mk_contacts SET ${sets}, updated_at = ? WHERE id = ? AND organization_id = ?`).run(...Object.values(patch), sqlNow(), contact.id, ctx.organizationId);
    }
    // Les événements déjà reçus pour cette adresse (avant que la fiche n'existe) rejoignent la fiche — le journal lui-même n'est pas réécrit
    const attached = ctx.db.prepare("UPDATE mk_events SET contact_id = ? WHERE organization_id = ? AND contact_id IS NULL AND email = ?").run(contact.id, ctx.organizationId, check.email).changes;
    if (input.visitorId) visitors.linkVisitor(ctx.db, ctx.organizationId, String(input.visitorId), contact.id);
    // Lecture directe (le dépôt revérifie le schéma à chaque appel : trop coûteux pour un import de milliers de lignes)
    return { contact: ctx.db.prepare("SELECT * FROM mk_contacts WHERE id = ? AND organization_id = ?").get(contact.id, ctx.organizationId), created, attachedEvents: attached };
  });
}

// ---------- Journal d'événements ----------
// Le SEUL moyen d'écrire un événement. Valide tout, vérifie que le contact et le site appartiennent à l'organisation, puis passe par
// le bus (idempotence, distribution par la file). Un événement sans contact reste valable (visiteur anonyme, adresse seule).
function recordEvent(ctx, { type, contactId = null, email = null, siteId = null, source = "api", objectType = null, objectId = null, actorUserId = null, metadata = {}, idempotencyKey = null, occurredAt } = {}) {
  checkCtx(ctx);
  if (!ctx.bus) throw new MarketingError("unavailable", "Le journal d'événements n'est pas disponible dans ce contexte.");
  if (typeof type !== "string" || !EVENT_NAME.test(type)) throw new MarketingError("invalid_event", "Type d'événement invalide (minuscules, chiffres, « _ » et « . »).");
  if (objectType !== null && (typeof objectType !== "string" || !OBJECT_TYPE.test(objectType))) throw new MarketingError("invalid_event", "Type d'objet invalide.");
  let contact = null;
  if (contactId !== null && contactId !== undefined) {
    contact = contacts.getContact(ctx, contactId);
    if (!contact) throw new MarketingError("not_found", "Contact introuvable.");
  }
  if (!contact && email) contact = contacts.findByEmail(ctx, email);
  checkSite(ctx, siteId);
  if (actorUserId !== null && !ctx.db.prepare("SELECT 1 FROM users WHERE id = ?").get(actorUserId)) throw new MarketingError("not_found", "Auteur introuvable.");
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) throw new MarketingError("invalid_event", "Les données associées doivent être un objet.");
  try {
    const r = ctx.bus.emit({
      organizationId: ctx.organizationId, name: type, email: contact ? contact.email : email || undefined, contactId: contact ? contact.id : null, source,
      metadata, idempotencyKey, occurredAt, siteId, objectType, objectId, actorUserId,
    });
    if (contact) ctx.db.prepare("UPDATE mk_contacts SET last_activity_at = datetime('now') WHERE id = ? AND organization_id = ?").run(contact.id, ctx.organizationId);
    return r;
  } catch (error) {
    if (error instanceof MarketingError) throw error;
    throw new MarketingError("invalid_event", error.message);
  }
}

const mask = (e) => ({
  id: e.id, type: e.name, at: e.occurred_at, source: e.source, siteId: e.site_id, objectType: e.object_type, objectId: e.object_id, actorUserId: e.actor_user_id,
  metadata: (() => { try { return JSON.parse(e.metadata); } catch { return {}; } })(),
});

// Fiche + fiches qu'elle a absorbées : l'historique d'une fusion reste lisible sur le maître
const familyOf = (ctx, contactId) => [contactId, ...ctx.db.prepare("SELECT id FROM mk_contacts WHERE organization_id = ? AND merged_into_id = ?").all(ctx.organizationId, contactId).map((r) => r.id)];

// Journal d'un contact, paginé par curseur (identifiant) : jamais toute la liste d'un coup
function eventsOf(ctx, contactId, { before = null, limit = 30, siteId = null, type = null } = {}) {
  checkCtx(ctx);
  const cap = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const ids = familyOf(ctx, contactId);
  const where = [`organization_id = ?`, `contact_id IN (${ids.map(() => "?").join(",")})`];
  const params = [ctx.organizationId, ...ids];
  if (Number.isInteger(before) && before > 0) { where.push("id < ?"); params.push(before); }
  if (siteId !== null) { where.push("site_id = ?"); params.push(siteId); }
  if (type) { where.push("name = ?"); params.push(String(type).slice(0, 64)); }
  const rows = ctx.db.prepare(`SELECT * FROM mk_events WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT ?`).all(...params, cap + 1);
  const more = rows.length > cap;
  const page = more ? rows.slice(0, cap) : rows;
  return { events: page.map(mask), next: more ? page[page.length - 1].id : null };
}

// ---------- Cycle de vie et état de la fiche ----------
function setLifecycle(ctx, contactId, stage) {
  checkCtx(ctx);
  const contact = contacts.requireContact(ctx, contactId);
  checkStage(ctx, stage);
  if (contact.lifecycle_stage === stage) return contact;
  ctx.db.prepare("UPDATE mk_contacts SET lifecycle_stage = ?, updated_at = ? WHERE id = ? AND organization_id = ?").run(stage, sqlNow(), contactId, ctx.organizationId);
  audit(ctx, "contact.lifecycle_changed", "contact", contactId, { from: contact.lifecycle_stage, to: stage });
  if (ctx.bus) recordEvent(ctx, { type: "contact.lifecycle_changed", contactId, source: "contact_core", actorUserId: ctx.userId ?? null, metadata: { from: contact.lifecycle_stage, to: stage } });
  return contacts.getContact(ctx, contactId);
}

// archived/inactive : la fiche reste intacte mais n'est plus joignable par le marketing ; « active » la rétablit.
function setRecordStatus(ctx, contactId, next) {
  checkCtx(ctx);
  if (!["active", "inactive", "archived"].includes(next)) throw new MarketingError("invalid_field", "État de fiche invalide.");
  const contact = contacts.requireContact(ctx, contactId);
  if (contact.record_status === "merged") throw new MarketingError("merged", "Cette fiche a été fusionnée dans une autre : modifiez la fiche maître.");
  if (contact.record_status === next) return contact;
  ctx.db.prepare("UPDATE mk_contacts SET record_status = ?, archived_at = ?, updated_at = ? WHERE id = ? AND organization_id = ?").run(next, next === "archived" ? sqlNow() : null, sqlNow(), contactId, ctx.organizationId);
  audit(ctx, "contact.record_status", "contact", contactId, { from: contact.record_status, to: next });
  return contacts.getContact(ctx, contactId);
}

// ---------- Doublons ----------
// Détection seulement : rien n'est fusionné automatiquement. « strong » = même numéro normalisé ; « possible » = même nom + même entreprise.
function findDuplicates(ctx, { limit = 50 } = {}) {
  checkCtx(ctx);
  require("./siteAccess").assertTeam(ctx, "La fusion de contacts"); // R7 : équipe de l'organisation seulement
  const cap = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const org = ctx.organizationId;
  const live = "record_status IN ('active', 'inactive')";
  const groups = [];
  const strong = ctx.db.prepare(`SELECT normalized_phone AS k, group_concat(id) AS ids, COUNT(*) n FROM mk_contacts WHERE organization_id = ? AND ${live} AND normalized_phone <> '' GROUP BY normalized_phone HAVING n > 1 ORDER BY n DESC, MIN(id) LIMIT ?`).all(org, cap);
  for (const g of strong) groups.push({ level: "strong", reason: "Même numéro de téléphone", key: g.k, ids: g.ids.split(",").map(Number) });
  const weak = ctx.db.prepare(`SELECT lower(first_name) || ' ' || lower(last_name) || '|' || lower(company) AS k, group_concat(id) AS ids, COUNT(*) n FROM mk_contacts WHERE organization_id = ? AND ${live} AND first_name <> '' AND last_name <> '' AND company <> '' GROUP BY k HAVING n > 1 ORDER BY n DESC, MIN(id) LIMIT ?`).all(org, cap);
  for (const g of weak) groups.push({ level: "possible", reason: "Même nom et même entreprise", key: g.k, ids: g.ids.split(",").map(Number) });
  const out = [];
  for (const g of groups.slice(0, cap)) {
    const rows = ctx.db.prepare(`SELECT id, email, first_name, last_name, company, phone, status, created_at FROM mk_contacts WHERE organization_id = ? AND id IN (${g.ids.map(() => "?").join(",")}) ORDER BY id`).all(org, ...g.ids);
    out.push({ ...g, contacts: rows });
  }
  return out;
}

// ---------- Fusion ----------
const MERGE_FIELDS = ["first_name", "last_name", "phone", "company", "country", "language", "timezone", "job_title", "normalized_phone", "source_detail"];
const RESTRICTIVE = ["suppressed", "complained", "bounced", "unsubscribed"]; // du plus au moins restrictif

function loadPair(ctx, masterId, sourceId) {
  if (!Number.isInteger(masterId) || !Number.isInteger(sourceId) || masterId === sourceId) throw new MarketingError("invalid_field", "Choisissez deux contacts différents.");
  const master = contacts.requireContact(ctx, masterId);
  const source = contacts.requireContact(ctx, sourceId);
  if (master.record_status === "merged" || source.record_status === "merged") throw new MarketingError("merged", "Une de ces fiches a déjà été fusionnée.");
  return { master, source };
}

// Ce qu'une fusion ferait, sans rien écrire (comparaison côte à côte)
function mergePreview(ctx, masterId, sourceId) {
  checkCtx(ctx);
  require("./siteAccess").assertTeam(ctx, "La fusion de contacts"); // R7 : équipe de l'organisation seulement
  const { master, source } = loadPair(ctx, masterId, sourceId);
  const fills = MERGE_FIELDS.filter((f) => !master[f] && source[f]);
  const conflicts = MERGE_FIELDS.filter((f) => master[f] && source[f] && master[f] !== source[f]);
  const count = (sql, ...p) => ctx.db.prepare(sql).get(...p).n;
  return {
    master, source, fills, conflicts,
    tagsToAdd: count("SELECT COUNT(*) n FROM mk_contact_tags t WHERE t.contact_id = ? AND NOT EXISTS (SELECT 1 FROM mk_contact_tags m WHERE m.contact_id = ? AND m.tag_id = t.tag_id)", source.id, master.id),
    listsToAdd: count("SELECT COUNT(*) n FROM mk_list_members t WHERE t.contact_id = ? AND NOT EXISTS (SELECT 1 FROM mk_list_members m WHERE m.contact_id = ? AND m.list_id = t.list_id)", source.id, master.id),
    events: count("SELECT COUNT(*) n FROM mk_events WHERE contact_id = ? AND organization_id = ?", source.id, ctx.organizationId),
    consentProofs: count("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ? AND organization_id = ?", source.id, ctx.organizationId),
    sourceStatus: source.status, masterStatus: master.status,
    statusOutcome: RESTRICTIVE.indexOf(source.status) !== -1 && (RESTRICTIVE.indexOf(master.status) === -1 || RESTRICTIVE.indexOf(source.status) < RESTRICTIVE.indexOf(master.status)) ? source.status : master.status,
  };
}

// Fusionne `source` DANS `master`. Rien n'est supprimé :
//  - champs vides, étiquettes, listes, propriétés vides, notes, événements et visites de la source rejoignent le maître ;
//  - la fiche source devient « merged » (jamais joignable), son e-mail devient un alias du maître ;
//  - les PREUVES de consentement restent sur la fiche source (elles sont en lecture seule) et s'affichent sur le maître ;
//  - le statut d'abonnement du maître ne devient JAMAIS plus permissif ; il devient plus restrictif si la source l'était.
function mergeContacts(ctx, masterId, sourceId) {
  checkCtx(ctx);
  require("./siteAccess").assertTeam(ctx, "La fusion de contacts"); // R7 : équipe de l'organisation seulement
  const { master, source } = loadPair(ctx, masterId, sourceId);
  const org = ctx.organizationId;
  return transaction(ctx.db, () => {
    const preview = mergePreview(ctx, masterId, sourceId);
    const snapshot = { master: { id: master.id, email: master.email, status: master.status }, source: { ...source } };
    const patch = {};
    for (const f of preview.fills) patch[f] = source[f];
    if (master.lifecycle_stage === "contact" && source.lifecycle_stage !== "contact") patch.lifecycle_stage = source.lifecycle_stage;
    if (preview.statusOutcome !== master.status) patch.status = preview.statusOutcome;
    if (master.lms_user_id === null && source.lms_user_id !== null) patch.lms_user_id = source.lms_user_id;
    if (!master.origin_site_id && source.origin_site_id) patch.origin_site_id = source.origin_site_id;
    // L'identifiant de compte est unique par fiche : on le libère sur la source avant de le poser sur le maître
    const tombstone = `fusionne-${source.id}@fusion.invalid`;
    ctx.db.prepare("UPDATE mk_contacts SET email = ?, record_status = 'merged', merged_into_id = ?, lms_user_id = NULL, archived_at = ?, updated_at = ? WHERE id = ? AND organization_id = ?").run(tombstone, master.id, sqlNow(), sqlNow(), source.id, org);
    ctx.db.prepare("INSERT OR IGNORE INTO mk_contact_aliases (organization_id, contact_id, email, reason) VALUES (?, ?, ?, 'merge')").run(org, master.id, source.email);
    ctx.db.prepare("UPDATE mk_contact_aliases SET contact_id = ? WHERE organization_id = ? AND contact_id = ?").run(master.id, org, source.id);
    if (Object.keys(patch).length) {
      const sets = Object.keys(patch).map((k) => `${k} = ?`).join(", ");
      ctx.db.prepare(`UPDATE mk_contacts SET ${sets}, updated_at = ? WHERE id = ? AND organization_id = ?`).run(...Object.values(patch), sqlNow(), master.id, org);
    }
    ctx.db.prepare("INSERT OR IGNORE INTO mk_contact_tags (organization_id, contact_id, tag_id) SELECT organization_id, ?, tag_id FROM mk_contact_tags WHERE contact_id = ?").run(master.id, source.id);
    ctx.db.prepare("INSERT OR IGNORE INTO mk_list_members (organization_id, list_id, contact_id) SELECT organization_id, list_id, ? FROM mk_list_members WHERE contact_id = ?").run(master.id, source.id);
    ctx.db.prepare("INSERT OR IGNORE INTO mk_contact_property_values (organization_id, contact_id, property_id, value_text, value_number, value_date, value_boolean) SELECT organization_id, ?, property_id, value_text, value_number, value_date, value_boolean FROM mk_contact_property_values WHERE contact_id = ?").run(master.id, source.id);
    ctx.db.prepare("UPDATE mk_contact_notes SET contact_id = ? WHERE organization_id = ? AND contact_id = ?").run(master.id, org, source.id);
    ctx.db.prepare("UPDATE mk_events SET contact_id = ? WHERE organization_id = ? AND contact_id = ?").run(master.id, org, source.id);
    ctx.db.prepare("UPDATE mk_web_events SET contact_id = ? WHERE organization_id = ? AND contact_id = ?").run(master.id, org, source.id);
    ctx.db.prepare("UPDATE mk_web_visitors SET contact_id = ? WHERE organization_id = ? AND contact_id = ?").run(master.id, org, source.id);
    ctx.db.prepare("INSERT INTO mk_contact_merges (organization_id, master_id, source_id, merged_by, snapshot) VALUES (?, ?, ?, ?, ?)").run(org, master.id, source.id, ctx.userId ?? null, JSON.stringify(snapshot));
    audit(ctx, "contact.merged", "contact", master.id, { sourceId: source.id });
    if (ctx.bus) recordEvent({ ...ctx, audit: false }, { type: "contact.merged", contactId: master.id, source: "contact_core", actorUserId: ctx.userId ?? null, metadata: { sourceId: source.id } });
    return { master: contacts.getContact(ctx, master.id), absorbedId: source.id, preview };
  });
}

// Preuves de consentement du contact ET des fiches absorbées (lecture seule) : l'historique d'une fusion n'est jamais perdu
function consentProofs(ctx, contactId, { limit = 50 } = {}) {
  checkCtx(ctx);
  const ids = familyOf(ctx, contactId);
  return ctx.db.prepare(`SELECT k.id, k.contact_id, k.purpose, k.action, k.source, k.text_shown, k.created_at FROM mk_consents k WHERE k.organization_id = ? AND k.contact_id IN (${ids.map(() => "?").join(",")}) ORDER BY k.id DESC LIMIT ?`).all(ctx.organizationId, ...ids, Math.min(Number(limit) || 50, 200));
}

// Affichage d'une fiche à une personne SANS le droit « données sensibles » : adresse et numéro masqués (le reste est inchangé)
const { maskPhone } = require("../sms/phone");
function maskEmail(email) {
  const [local, domain] = String(email).split("@");
  return domain ? `${local.slice(0, 1)}•••@${domain}` : "•••";
}
const maskContact = (c) => ({ ...c, email: maskEmail(c.email), phone: c.phone ? "•••" : "", sms_phone: undefined, normalized_phone: c.normalized_phone ? maskPhone(c.normalized_phone) : "" });

module.exports = {
  maskContact, maskEmail,
  LIFECYCLE_STAGES, RECORD_STATUS_LABELS, SOURCES, lifecycleStages,
  identify, recordEvent, eventsOf, familyOf, setLifecycle, setRecordStatus, findDuplicates, mergePreview, mergeContacts, consentProofs,
};
