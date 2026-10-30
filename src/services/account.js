// Données personnelles d'un compte (RGPD) : export complet, et suppression du compte.
// La suppression ANONYMISE le compte au lieu d'effacer sa ligne : les commandes restent dans l'historique des ventes
// (obligation comptable), mais plus rien ne permet d'identifier la personne. Ses contenus personnels (notes, avis,
// commentaires, favoris, préférences) sont effacés, ainsi que son contact marketing et ses sessions.
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../config/database");
const { removeUploadedFile } = require("../utils/uploads");

const DELETED_EMAIL_DOMAIN = "compte-supprime.invalid";

// Lignes d'une requête, sans jamais échouer si une table optionnelle n'existe pas (installation ancienne)
function rows(sql, ...params) {
  try { return db.prepare(sql).all(...params); } catch { return []; }
}

function marketingContactOf(marketing, user) {
  if (!marketing || !marketing.ready) return null;
  return db.prepare("SELECT * FROM mk_contacts WHERE organization_id = ? AND (lms_user_id = ? OR email = lower(trim(?))) ORDER BY lms_user_id IS NULL LIMIT 1").get(marketing.organizationId, user.id, user.email) || null;
}

// Tout ce que le site garde sur ce compte, lisible (JSON)
function exportData(userId, marketing) {
  const user = db.prepare("SELECT id, username, email, role, bio, timezone, avatar_path, created_at FROM users WHERE id = ?").get(userId);
  if (!user) return null;
  const contact = marketingContactOf(marketing, user);
  return {
    exporte_le: new Date().toISOString(),
    compte: user,
    formations_suivies: rows("SELECT c.title AS formation, e.created_at AS inscrit_le FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? ORDER BY e.created_at", userId),
    commandes: rows("SELECT id, total_cents, discount_cents, coupon_code, created_at FROM orders WHERE user_id = ? ORDER BY id", userId).map((o) => ({
      ...o,
      lignes: rows("SELECT c.title AS formation, oi.price_cents, oi.list_price_cents FROM order_items oi LEFT JOIN courses c ON c.id = oi.course_id WHERE oi.order_id = ?", o.id),
    })),
    progression: rows("SELECT c.title AS formation, l.title AS lecon, lp.completed_at FROM lesson_progress lp JOIN lessons l ON l.id = lp.lesson_id JOIN sections s ON s.id = l.section_id JOIN courses c ON c.id = s.course_id WHERE lp.user_id = ?", userId),
    resultats_quiz: rows("SELECT qa.* FROM quiz_attempts qa WHERE qa.user_id = ?", userId),
    notes: rows("SELECT l.title AS lecon, n.* FROM lesson_notes n JOIN lessons l ON l.id = n.lesson_id WHERE n.user_id = ?", userId),
    avis: rows("SELECT c.title AS formation, r.rating, r.comment, r.created_at FROM reviews r JOIN courses c ON c.id = r.course_id WHERE r.user_id = ?", userId),
    commentaires_blog: rows("SELECT p.title AS article, bc.body, bc.created_at FROM blog_comments bc JOIN posts p ON p.id = bc.post_id WHERE bc.user_id = ?", userId),
    favoris: rows("SELECT c.title AS formation FROM favorites f JOIN courses c ON c.id = f.course_id WHERE f.user_id = ?", userId),
    messages_envoyes: rows("SELECT * FROM contact_messages WHERE lower(email) = lower(?)", user.email),
    marketing: contact ? {
      contact: { email: contact.email, prenom: contact.first_name, nom: contact.last_name, telephone: contact.phone, entreprise: contact.company, pays: contact.country, statut: contact.status, cree_le: contact.created_at },
      consentements: rows("SELECT * FROM mk_consents WHERE contact_id = ? ORDER BY id", contact.id).map(({ organization_id, ...c }) => c),
      visites_du_site: rows("SELECT type, path, target, referrer, utm_source, utm_medium, utm_campaign, device, occurred_at FROM mk_web_events WHERE contact_id = ? ORDER BY occurred_at", contact.id),
    } : null,
  };
}

// Le compte du formateur porte les formations, articles et réglages du site : il ne se supprime pas d'ici
const canDelete = (user) => user && user.role === "etudiant";

async function checkPassword(userId, password) {
  const row = db.prepare("SELECT password_hash FROM users WHERE id = ?").get(userId);
  return Boolean(row && typeof password === "string" && password && (await bcrypt.compare(password, row.password_hash)));
}

function deleteAccount(userId, marketing, log = console) {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!canDelete(user)) throw new Error("Ce compte ne peut pas être supprimé ici.");
  const contact = marketingContactOf(marketing, user);
  // Mot de passe inutilisable : le hachage d'un secret aléatoire jamais conservé
  const unusable = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 10);
  // Dernier Super administrateur actif de l'organisation : le compte ne peut pas disparaître sans successeur
  try {
    const owned = db.prepare("SELECT m.organization_id FROM mk_org_members m WHERE m.user_id = ? AND m.role = 'owner'").all(userId);
    for (const o of owned) {
      const others = db.prepare("SELECT COUNT(*) n FROM mk_org_members m JOIN users u ON u.id = m.user_id WHERE m.organization_id = ? AND m.role = 'owner' AND u.status = 'active' AND u.id <> ?").get(o.organization_id, userId).n;
      if (!others) throw new Error("Vous êtes le dernier Super administrateur : nommez-en un autre avant de supprimer ce compte.");
    }
  } catch (error) { if (!/no such table/.test(error.message)) throw error; }
  db.exec("BEGIN IMMEDIATE");
  try {
    // Accès marketing et clés d'API de la personne : retirés avec le compte (sinon une fiche anonymisée resterait « active » dans l'équipe)
    for (const sql of ["DELETE FROM mk_org_members WHERE user_id = ?", "DELETE FROM mk_site_members WHERE user_id = ?", "UPDATE mk_api_keys SET revoked_at = datetime('now') WHERE created_by = ? AND revoked_at IS NULL"]) {
      try { db.prepare(sql).run(userId); } catch (error) { if (!/no such table/.test(error.message)) throw error; }
    }
    for (const table of ["lesson_notes", "reviews", "blog_comments", "favorites", "user_prefs", "password_resets", "lesson_state"]) {
      try { db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).run(userId); } catch (error) { if (!/no such table/.test(error.message)) throw error; }
    }
    db.prepare("DELETE FROM contact_messages WHERE lower(email) = lower(?)").run(user.email);
    db.prepare(`UPDATE users SET username = ?, email = ?, password_hash = ?, bio = '', avatar_path = NULL, timezone = '', deleted_at = datetime('now') WHERE id = ?`)
      .run(`compte-supprime-${userId}`, `supprime-${userId}@${DELETED_EMAIL_DOMAIN}`, unusable, userId);
    db.prepare("DELETE FROM sessions WHERE json_extract(data, '$.user.id') = ?").run(userId);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
  if (user.avatar_path) removeUploadedFile(user.avatar_path, "compte supprimé");
  // Contact marketing effacé (consentements, envois, statistiques personnelles) ; une panne du marketing est signalée
  // dans les journaux mais n'empêche pas la suppression du compte
  if (contact) {
    try {
      const audience = require("../marketing/audience");
      audience.deleteContact({ db, organizationId: marketing.organizationId, userId: null, bus: marketing.bus }, contact.id, { suppress: false });
    } catch (error) {
      log.error("[KOLAKISA] Suppression de compte : contact marketing non effacé :", error.message);
    }
  }
  return true;
}

module.exports = { exportData, deleteAccount, checkPassword, canDelete, DELETED_EMAIL_DOMAIN };
