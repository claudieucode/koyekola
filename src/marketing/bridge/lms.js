// Pont KOLAKISA (LMS) → marketing. Sens unique : le LMS alimente le CRM, jamais l'inverse ; aucune table du LMS n'est modifiée.
// Règle de conformité : un compte du LMS n'est PAS un consentement. Les comptes existants deviennent des contacts
// « unknown » (aucun envoi marketing possible) ; seule la case facultative de l'inscription, cochée par la personne,
// crée une preuve de consentement.
const { upsertContact, findByEmail } = require("../audience/contacts");
const { validateEmail } = require("../audience/email");
const { transaction } = require("../db/tx");
const { recordConsent } = require("../compliance/consent");
const { checkCtx, audit } = require("../audience/shared");

// Texte affiché à côté de la case ET enregistré tel quel comme preuve : une seule source pour les deux
const SIGNUP_CONSENT_TEXT = "Je souhaite recevoir par e-mail les actualités, les nouvelles formations et les offres de KOLAKISA. Je peux me désinscrire à tout moment.";

// Comptes du LMS sans contact → contacts « unknown ». Idempotent, borné (les gros sites avancent par paquets).
function syncLmsUsers(ctx, { limit = 5000 } = {}) {
  checkCtx(ctx);
  // Comptes supprimés à la demande de la personne (RGPD, colonne deleted_at du LMS) : jamais recréés comme contacts
  const hasDeleted = ctx.db.prepare("SELECT 1 FROM pragma_table_info('users') WHERE name = 'deleted_at'").get();
  const users = ctx.db
    .prepare(`SELECT u.id, u.username, u.email FROM users u WHERE ${hasDeleted ? "u.deleted_at IS NULL AND " : ""}NOT EXISTS (SELECT 1 FROM mk_contacts c WHERE c.organization_id = ? AND c.lms_user_id = u.id AND c.email = lower(trim(u.email))) ORDER BY u.id LIMIT ?`)
    .all(ctx.organizationId, limit);
  const result = { created: 0, linked: 0, skipped: 0 };
  const rowCtx = { ...ctx, audit: false, bus: null };
  transaction(ctx.db, () => {
    for (const user of users) {
      if (!validateEmail(user.email).ok) { result.skipped++; continue; }
      const existing = findByEmail(ctx, user.email);
      if (existing) {
        // Déjà un contact avec cette adresse : on le relie au compte, sans toucher à son statut ni à ses données
        if (existing.lms_user_id === null) {
          ctx.db.prepare("UPDATE mk_contacts SET lms_user_id = ? WHERE id = ? AND organization_id = ? AND lms_user_id IS NULL").run(user.id, existing.id, ctx.organizationId);
          result.linked++;
        } else result.skipped++;
        continue;
      }
      upsertContact(rowCtx, { email: user.email, first_name: user.username, source: "lms", lms_user_id: user.id });
      result.created++;
    }
    if (result.created || result.linked) audit(ctx, "lms.synced", "contact", null, result);
  });
  return result;
}

// À l'inscription : le compte devient un contact ; la case cochée (et elle seule) enregistre un consentement prouvé
function registerLmsUser(ctx, user, { optIn = false, ip } = {}) {
  checkCtx(ctx);
  return transaction(ctx.db, () => {
    const { contact } = upsertContact(ctx, { email: user.email, first_name: user.username, source: "signup", lms_user_id: user.id });
    let subscribed = false;
    if (optIn) subscribed = recordConsent(ctx, contact.id, { source: "signup", textShown: SIGNUP_CONSENT_TEXT, ip }).ok;
    return { ok: true, contactId: contact.id, subscribed };
  });
}

// Version pour les routes du LMS : une panne du marketing est journalisée mais ne fait JAMAIS échouer l'inscription
function registerLmsUserSafely(marketing, db, user, options = {}, log = console) {
  if (!marketing || !marketing.ready) return { ok: false, skipped: true };
  try {
    return registerLmsUser({ db, organizationId: marketing.organizationId, userId: null, bus: marketing.bus }, user, options);
  } catch (error) {
    log.error("[KOLAKISA] Contact marketing non créé à l'inscription (le compte, lui, est bien créé) :", error.message);
    return { ok: false };
  }
}

module.exports = { SIGNUP_CONSENT_TEXT, syncLmsUsers, registerLmsUser, registerLmsUserSafely };
