// Consentement et désinscription SMS. Mêmes règles que l'e-mail (compliance/consent.js), appliquées au canal SMS
// SÉPARÉMENT — un abonné e-mail n'est jamais abonné aux SMS par défaut, et inversement :
//  1. Un contact n'est abonné aux SMS que s'il existe une PREUVE (source + texte présenté + numéro + date + IP tronquée).
//  2. Un import, l'API, l'admin ne peuvent jamais réabonner un contact qui a retiré son accord SMS : seule la personne
//     elle-même (formulaire, centre de préférences, inscription, commande) le peut.
//  3. Un numéro en liste de suppression SMS (STOP, numéro invalide, blocage manuel) ne redevient jamais joignable ici.
//  4. isSmsSendable() est la SEULE porte vers l'envoi d'un SMS marketing ; smsSendableSql() en est la version en masse.
const { transaction } = require("../db/tx");
const primarySite = require("../../services/primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire
const { getContact } = require("../audience/contacts");
const { checkCtx, cleanText, audit, emit, MarketingError } = require("../audience/shared");
const { PERSON_SOURCES, truncateIp } = require("../compliance/consent");
const { normalizePhone, E164 } = require("./phone");
const { getSmsConfig } = require("./config");

const SOURCE = /^[a-z][a-z0-9_]{1,29}$/;
const REASONS = new Set(["stop", "invalid", "manual"]);
// La personne elle-même, par SMS : réponse « START » depuis son propre numéro (webhooks.js)
const SMS_PERSON_SOURCES = new Set(["sms_keyword"]);
const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

function checkSource(source) {
  if (typeof source !== "string" || !SOURCE.test(source)) throw new MarketingError("invalid_field", "Source invalide (minuscules, chiffres et « _ », 2 à 30 caractères).");
  return source;
}
function requireContact(ctx, id) {
  const contact = getContact(ctx, id);
  if (!contact) throw new MarketingError("not_found", "Contact introuvable.");
  return contact;
}
const isSuppressedPhone = (ctx, phone) =>
  Boolean(phone && ctx.db.prepare("SELECT 1 FROM mk_sms_suppressions WHERE organization_id = ? AND phone = ?").get(ctx.organizationId, phone));

// Numéro saisi → E.164, avec le pays par défaut des réglages SMS (si le contexte en a)
function toE164(ctx, raw) {
  const defaultCountry = ctx.settings ? getSmsConfig(ctx).defaultCountry : undefined;
  const r = normalizePhone(raw, { defaultCountry });
  if (!r.ok) throw new MarketingError("invalid_phone", r.reason);
  return r.e164;
}

// phone : le numéro qui donne son accord (sinon celui de la fiche du contact)
function recordSmsConsent(ctx, contactId, { phone, source, textShown, ip, formId = null, siteId = null } = {}) {
  checkCtx(ctx);
  checkSource(source);
  const proof = cleanText(textShown, { max: 1000, field: "textShown" });
  if (proof.length < 3) throw new MarketingError("proof_required", "Une preuve est obligatoire : le texte exact présenté à la personne.");
  if (formId !== null && !Number.isInteger(formId)) throw new MarketingError("invalid_field", "formId doit être un entier.");
  const contact = requireContact(ctx, contactId);
  // R7 lot 3 : site où l'accord SMS a été collecté (preuve), quand il est connu. Déterminé par le SERVEUR (site du formulaire, ou site imposé à l'accès limité) ; vérifié comme site de
  // l'organisation, sinon NULL (inconnu / site principal). Les preuves existantes gardent NULL. La liste STOP reste commune à l'organisation (aucun site dans mk_sms_suppressions).
  const collectedAt = Number.isInteger(siteId) && ctx.db.prepare(`SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(ctx.db)}`).get(siteId, ctx.organizationId) ? siteId : null;
  const e164 = toE164(ctx, phone !== undefined && phone !== null && phone !== "" ? phone : contact.phone);
  if (isSuppressedPhone(ctx, e164)) return { ok: false, reason: "suppressed" };
  if (contact.sms_status === "unsubscribed" && !PERSON_SOURCES.has(source) && !SMS_PERSON_SOURCES.has(source)) return { ok: false, reason: "unsubscribed" };
  if (contact.sms_status === "subscribed" && contact.sms_phone === e164) return { ok: true, status: "subscribed", already: true, phone: e164 };

  return transaction(ctx.db, () => {
    const info = ctx.db
      .prepare("INSERT INTO mk_consents (organization_id, contact_id, purpose, action, source, text_shown, ip, form_id, channel_address, site_id) VALUES (?, ?, 'sms', 'granted', ?, ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, contactId, source, proof, truncateIp(ip), formId, e164, collectedAt);
    ctx.db.prepare("UPDATE mk_contacts SET sms_status = 'subscribed', sms_phone = ?, sms_unsubscribed_at = NULL, updated_at = ? WHERE id = ? AND organization_id = ?")
      .run(e164, now(), contactId, ctx.organizationId);
    emit(ctx, "contact.sms_subscribed", { contact, source: "marketing", idempotencyKey: `contact.sms_subscribed:${contactId}:${info.lastInsertRowid}`, metadata: { consentSource: source } });
    audit(ctx, "contact.sms_subscribed", "contact", contactId, { source });
    return { ok: true, status: "subscribed", already: false, phone: e164 };
  });
}

// Retrait de l'accord SMS (lien de désinscription, réponse STOP, équipe). Idempotent. L'e-mail n'est pas touché.
function unsubscribeSms(ctx, contactId, { source } = {}) {
  checkCtx(ctx);
  checkSource(source);
  const contact = requireContact(ctx, contactId);
  if (contact.sms_status === "unsubscribed") return { ok: true, already: true };
  return transaction(ctx.db, () => {
    const info = ctx.db
      .prepare("INSERT INTO mk_consents (organization_id, contact_id, purpose, action, source, text_shown, channel_address) VALUES (?, ?, 'sms', 'withdrawn', ?, '', ?)")
      .run(ctx.organizationId, contactId, source, contact.sms_phone || "");
    ctx.db.prepare("UPDATE mk_contacts SET sms_status = 'unsubscribed', sms_unsubscribed_at = ?, updated_at = ? WHERE id = ? AND organization_id = ?")
      .run(now(), now(), contactId, ctx.organizationId);
    emit(ctx, "contact.sms_unsubscribed", { contact, source: "marketing", idempotencyKey: `contact.sms_unsubscribed:${contactId}:${info.lastInsertRowid}`, metadata: { via: source } });
    audit(ctx, "contact.sms_unsubscribed", "contact", contactId, { source });
    return { ok: true, already: false };
  });
}

// La garde d'envoi SMS. → { ok: true, phone } ou { ok: false, reason }
function isSmsSendable(ctx, contactId) {
  checkCtx(ctx);
  const contact = getContact(ctx, contactId);
  if (!contact) return { ok: false, reason: "not_found" };
  if (contact.record_status !== "active") return { ok: false, reason: "inactive_record" };
  if (contact.sms_status === "unsubscribed") return { ok: false, reason: "unsubscribed" };
  if (contact.sms_status !== "subscribed") return { ok: false, reason: "not_subscribed" };
  if (!E164.test(contact.sms_phone)) return { ok: false, reason: "no_phone" };
  if (isSuppressedPhone(ctx, contact.sms_phone)) return { ok: false, reason: "suppressed" };
  const last = ctx.db
    .prepare("SELECT action, channel_address FROM mk_consents WHERE contact_id = ? AND organization_id = ? AND purpose = 'sms' ORDER BY id DESC LIMIT 1")
    .get(contactId, ctx.organizationId);
  if (!last || last.action !== "granted" || last.channel_address !== contact.sms_phone) return { ok: false, reason: "no_consent" };
  return { ok: true, phone: contact.sms_phone };
}

// Version EN MASSE de isSmsSendable() (segments, audience d'une campagne SMS) : un test vérifie qu'elles concordent.
function smsSendableSql(alias = "c") {
  const a = alias;
  return {
    sql: [
      `${a}.record_status = 'active'`,
      `${a}.sms_status = 'subscribed'`,
      `${a}.sms_phone GLOB '+[1-9]*' AND length(${a}.sms_phone) BETWEEN 9 AND 16 AND substr(${a}.sms_phone, 2) NOT GLOB '*[^0-9]*'`,
      `NOT EXISTS (SELECT 1 FROM mk_sms_suppressions s WHERE s.organization_id = ${a}.organization_id AND s.phone = ${a}.sms_phone)`,
      `(SELECT k.action || '|' || k.channel_address FROM mk_consents k WHERE k.contact_id = ${a}.id AND k.organization_id = ${a}.organization_id AND k.purpose = 'sms' ORDER BY k.id DESC LIMIT 1) = 'granted|' || ${a}.sms_phone`,
    ].join(" AND "),
    params: [],
  };
}

// --- Liste de suppression SMS (par numéro) ---
function addSmsSuppression(ctx, { phone, reason, note = "", source = "admin" } = {}) {
  checkCtx(ctx);
  if (!REASONS.has(reason)) throw new MarketingError("invalid_field", "Motif invalide (stop, invalid ou manual).");
  const e164 = toE164(ctx, phone);
  return transaction(ctx.db, () => {
    const added = ctx.db
      .prepare("INSERT OR IGNORE INTO mk_sms_suppressions (organization_id, phone, reason, note) VALUES (?, ?, ?, ?)")
      .run(ctx.organizationId, e164, reason, cleanText(note, { max: 500, field: "note" })).changes > 0;
    if (!added) return { added: false, phone: e164 };
    // Tout contact abonné avec ce numéro perd son accord SMS (preuve de retrait écrite)
    const holders = ctx.db.prepare("SELECT id FROM mk_contacts WHERE organization_id = ? AND sms_phone = ? AND sms_status = 'subscribed'").all(ctx.organizationId, e164);
    for (const { id } of holders) unsubscribeSms(ctx, id, { source: reason === "stop" ? "sms_stop" : source });
    audit(ctx, "sms_suppression.added", "sms_suppression", null, { reason, contacts: holders.length });
    return { added: true, phone: e164, contacts: holders.length };
  });
}

// Seul un blocage manuel peut être levé ; un STOP ou un numéro invalide ne se lèvent pas (la personne doit se réinscrire
// elle-même, ce qui ne passe pas par ici).
function removeSmsSuppression(ctx, phone) {
  checkCtx(ctx);
  const e164 = toE164(ctx, phone);
  const row = ctx.db.prepare("SELECT * FROM mk_sms_suppressions WHERE organization_id = ? AND phone = ?").get(ctx.organizationId, e164);
  if (!row) return { removed: false };
  if (row.reason !== "manual") throw new MarketingError("not_removable", "Un STOP ou un numéro invalide ne peut pas être levé : ce numéro ne doit plus recevoir de SMS marketing.");
  ctx.db.prepare("DELETE FROM mk_sms_suppressions WHERE id = ? AND organization_id = ?").run(row.id, ctx.organizationId);
  audit(ctx, "sms_suppression.removed", "sms_suppression", null, {});
  return { removed: true };
}

function listSmsSuppressions(ctx, { limit = 100 } = {}) {
  checkCtx(ctx);
  return ctx.db
    .prepare("SELECT id, phone, reason, note, created_at FROM mk_sms_suppressions WHERE organization_id = ? ORDER BY id DESC LIMIT ?")
    .all(ctx.organizationId, Math.min(Math.max(Number(limit) || 100, 1), 500));
}

module.exports = { recordSmsConsent, unsubscribeSms, isSmsSendable, smsSendableSql, addSmsSuppression, removeSmsSuppression, listSmsSuppressions, isSuppressedPhone };
