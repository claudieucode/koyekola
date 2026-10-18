// Consentement, désinscription et garde d'envoi. Règles (chacune est testée) :
//  1. Un contact n'est « subscribed » que s'il existe une PREUVE (source + texte présenté + date + IP tronquée).
//  2. Un import, l'API, l'admin ou une synchronisation ne peut jamais réabonner un désinscrit : seule la personne
//     elle-même (formulaire, centre de préférences, inscription, commande) le peut.
//  3. Une adresse en liste de suppression (rebond dur, plainte, blocage manuel) ne redevient jamais joignable ici.
//  4. isSendable() est la SEULE porte vers l'envoi marketing : il vérifie tout, y compris les incohérences.
const net = require("node:net");
const primarySite = require("../../services/primarySite"); // R9-4 : la ligne dédiée du site principal n'est pas un site ordinaire
const { transaction } = require("../db/tx");
const { getContact } = require("../audience/contacts");
const { checkCtx, cleanText, audit, emit, MarketingError } = require("../audience/shared");
const { signToken, verifyToken } = require("../security/tokens");

const PERSON_SOURCES = new Set(["form", "preference_center", "signup", "checkout"]);
const SOURCE = /^[a-z][a-z0-9_]{1,29}$/;
const BLOCKED = new Set(["bounced", "complained", "suppressed"]);
const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

// On ne garde que le préfixe du réseau : la preuve reste utile, la donnée personnelle est réduite
function truncateIp(ip) {
  if (typeof ip !== "string") return "";
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip.trim());
  const text = mapped ? mapped[1] : ip.trim();
  const family = net.isIP(text);
  if (family === 4) return `${text.split(".").slice(0, 3).join(".")}.0`;
  if (family === 6) {
    const [head, tail = ""] = text.toLowerCase().split("::");
    const left = head ? head.split(":") : [];
    const right = tail ? tail.split(":") : [];
    const hextets = text.includes("::") ? [...left, ...Array(Math.max(8 - left.length - right.length, 0)).fill("0"), ...right] : left;
    return `${hextets.slice(0, 3).map((h) => h.replace(/^0+(?=.)/, "")).join(":")}::`;
  }
  return "";
}

function checkSource(source) {
  if (typeof source !== "string" || !SOURCE.test(source)) throw new MarketingError("invalid_field", "Source invalide (minuscules, chiffres et « _ », 2 à 30 caractères).");
  return source;
}

function requireContact(ctx, id) {
  const contact = getContact(ctx, id);
  if (!contact) throw new MarketingError("not_found", "Contact introuvable.");
  return contact;
}

const isSuppressedEmail = (ctx, email) =>
  Boolean(ctx.db.prepare("SELECT 1 FROM mk_suppressions WHERE organization_id = ? AND email = ?").get(ctx.organizationId, email));

function recordConsent(ctx, contactId, { source, textShown, ip, formId = null, siteId = null } = {}) {
  checkCtx(ctx);
  checkSource(source);
  const proof = cleanText(textShown, { max: 1000, field: "textShown" });
  if (proof.length < 3) throw new MarketingError("proof_required", "Une preuve est obligatoire : le texte exact présenté à la personne.");
  if (formId !== null && !Number.isInteger(formId)) throw new MarketingError("invalid_field", "formId doit être un entier.");
  // R7 : site où le consentement a été collecté (preuve), quand il est connu ; vérifié comme site de l'organisation, sinon ignoré (jamais une valeur du navigateur)
  const collectedAt = Number.isInteger(siteId) && ctx.db.prepare(`SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ?${primarySite.excludeSql(ctx.db)}`).get(siteId, ctx.organizationId) ? siteId : null;
  const contact = requireContact(ctx, contactId);
  if (BLOCKED.has(contact.status) || isSuppressedEmail(ctx, contact.email)) return { ok: false, reason: "suppressed", status: contact.status };
  if (contact.status === "unsubscribed" && !PERSON_SOURCES.has(source)) return { ok: false, reason: "unsubscribed", status: contact.status };
  if (contact.status === "subscribed") return { ok: true, status: "subscribed", already: true };

  return transaction(ctx.db, () => {
    const info = ctx.db
      .prepare("INSERT INTO mk_consents (organization_id, contact_id, purpose, action, source, text_shown, ip, form_id, site_id) VALUES (?, ?, 'marketing', 'granted', ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, contactId, source, proof, truncateIp(ip), formId, collectedAt);
    ctx.db.prepare("UPDATE mk_contacts SET status = 'subscribed', unsubscribed_at = NULL, updated_at = ? WHERE id = ? AND organization_id = ?").run(now(), contactId, ctx.organizationId);
    ctx.db.prepare("DELETE FROM mk_unsubscribes WHERE contact_id = ? AND scope = 'all' AND organization_id = ?").run(contactId, ctx.organizationId);
    emit(ctx, "contact.subscribed", { contact, source: "marketing", idempotencyKey: `contact.subscribed:${contactId}:${info.lastInsertRowid}`, metadata: { consentSource: source } });
    audit(ctx, "contact.subscribed", "contact", contactId, { source });
    return { ok: true, status: "subscribed", already: false };
  });
}

// scope « all » (défaut) ou « list » (une seule liste). Idempotent : redemander ne change rien.
function unsubscribe(ctx, contactId, { scope = "all", listId, source } = {}) {
  checkCtx(ctx);
  checkSource(source);
  if (scope !== "all" && scope !== "list") throw new MarketingError("invalid_field", "Portée inconnue (all ou list).");
  const contact = requireContact(ctx, contactId);
  if (scope === "list") {
    if (!Number.isInteger(listId)) throw new MarketingError("invalid_field", "La liste est obligatoire pour une désinscription par liste.");
    if (!ctx.db.prepare("SELECT 1 FROM mk_lists WHERE id = ? AND organization_id = ?").get(listId, ctx.organizationId)) throw new MarketingError("not_found", "Liste introuvable.");
  }
  return transaction(ctx.db, () => {
    const listValue = scope === "list" ? listId : null;
    const inserted = ctx.db
      .prepare("INSERT OR IGNORE INTO mk_unsubscribes (organization_id, contact_id, scope, list_id, source) VALUES (?, ?, ?, ?, ?)")
      .run(ctx.organizationId, contactId, scope, listValue, source).changes;
    if (!inserted) return { ok: true, already: true };
    ctx.db
      .prepare("INSERT INTO mk_consents (organization_id, contact_id, purpose, action, source, text_shown) VALUES (?, ?, ?, 'withdrawn', ?, '')")
      .run(ctx.organizationId, contactId, scope === "list" ? `list:${listId}` : "marketing", source);
    if (scope === "all") {
      if (contact.status === "unknown" || contact.status === "subscribed") {
        ctx.db.prepare("UPDATE mk_contacts SET status = 'unsubscribed', unsubscribed_at = ?, updated_at = ? WHERE id = ? AND organization_id = ?").run(now(), now(), contactId, ctx.organizationId);
      }
    }
    emit(ctx, "contact.unsubscribed", { contact, source: "marketing", idempotencyKey: `contact.unsubscribed:${contactId}:${scope}:${listValue ?? 0}`, metadata: { scope, listId: listValue, via: source } });
    audit(ctx, "contact.unsubscribed", "contact", contactId, { scope, listId: listValue });
    return { ok: true, already: false };
  });
}

function consentHistory(ctx, contactId, { limit = 100 } = {}) {
  checkCtx(ctx);
  return ctx.db
    .prepare("SELECT id, purpose, action, source, text_shown, ip, created_at FROM mk_consents WHERE contact_id = ? AND organization_id = ? ORDER BY id DESC LIMIT ?")
    .all(contactId, ctx.organizationId, Math.min(Math.max(Number(limit) || 100, 1), 500));
}

// La garde d'envoi. → { ok: true } ou { ok: false, reason }
function isSendable(ctx, contactId, { listId, category } = {}) {
  checkCtx(ctx);
  const contact = getContact(ctx, contactId);
  if (!contact) return { ok: false, reason: "not_found" };
  if (contact.record_status !== "active") return { ok: false, reason: "inactive_record" };
  if (BLOCKED.has(contact.status) || isSuppressedEmail(ctx, contact.email)) return { ok: false, reason: "suppressed" };
  if (contact.status === "unsubscribed") return { ok: false, reason: "unsubscribed" };
  if (contact.status !== "subscribed") return { ok: false, reason: "not_subscribed" };
  const last = ctx.db.prepare("SELECT action FROM mk_consents WHERE contact_id = ? AND organization_id = ? AND purpose = 'marketing' ORDER BY id DESC LIMIT 1").get(contactId, ctx.organizationId);
  if (!last || last.action !== "granted") return { ok: false, reason: "no_consent" };
  if (listId !== undefined && ctx.db.prepare("SELECT 1 FROM mk_unsubscribes WHERE contact_id = ? AND scope = 'list' AND list_id = ? AND organization_id = ?").get(contactId, listId, ctx.organizationId)) {
    return { ok: false, reason: "list_unsubscribed" };
  }
  if (category !== undefined) {
    const pref = ctx.db
      .prepare(
        `SELECT p.subscribed FROM mk_contact_preferences p JOIN mk_preference_categories k ON k.id = p.category_id
         WHERE p.contact_id = ? AND p.organization_id = ? AND k.key = ?`
      )
      .get(contactId, ctx.organizationId, String(category));
    if (pref && pref.subscribed === 0) return { ok: false, reason: "category_opted_out" };
  }
  return { ok: true };
}

// --- Liens signés (dans les e-mails) ---
const unsubscribeToken = (ctx, contactId, key, { listId, messageId } = {}) =>
  signToken({ o: ctx.organizationId, c: contactId, k: "unsub", ...(listId ? { l: listId } : {}), ...(messageId ? { m: messageId } : {}) }, key);
const preferencesToken = (ctx, contactId, key) => signToken({ o: ctx.organizationId, c: contactId, k: "prefs" }, key);

// Appelé par la page publique de désinscription : aucun compte, seul le jeton fait foi. Réponse neutre si le jeton est faux.
function unsubscribeWithToken(db, token, key, { source = "link", bus = null } = {}) {
  const v = verifyToken(token, key, { kind: "unsub" });
  if (!v.ok) return { ok: false };
  const { o, c, l } = v.payload;
  if (!Number.isInteger(o) || !Number.isInteger(c)) return { ok: false };
  const ctx = { db, organizationId: o, userId: null, bus };
  try {
    try {
      return { ...unsubscribe(ctx, c, l ? { scope: "list", listId: l, source } : { source }), contactId: c, organizationId: o };
    } catch (error) {
      // liste supprimée depuis l'envoi : la personne veut clairement ne plus rien recevoir → désinscription globale
      if (l && error.code === "not_found" && getContact(ctx, c)) return { ...unsubscribe(ctx, c, { source }), contactId: c, organizationId: o };
      throw error;
    }
  } catch (error) {
    if (error instanceof MarketingError) return { ok: false };
    throw error;
  }
}

module.exports = { PERSON_SOURCES, truncateIp, recordConsent, unsubscribe, consentHistory, isSendable, unsubscribeToken, preferencesToken, unsubscribeWithToken };
