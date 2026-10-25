// Support : tickets des élèves au formateur. Chaque fonction qui lit ou écrit un ticket reçoit l'utilisateur et vérifie
// l'appartenance (élève = auteur ; formateur = destinataire) dans la requête SQL elle-même : changer l'identifiant d'un ticket
// dans l'adresse ne donne jamais accès au ticket d'un autre.
const db = require("../config/database");
const notifications = require("./notifications");

const MAX_OPEN_PER_HOUR = 5; // création de tickets : au plus 5 par heure et par élève (anti-abus)
const PRIORITIES = { low: "Basse", normal: "Normale", high: "Haute" };
// Libellés selon le point de vue : le même statut n'a pas le même sens pour l'élève (qui attend) et pour le formateur (qui doit répondre)
const STATUSES = { open: "En attente de réponse", answered: "Répondu", closed: "Résolue" }; // vue formateur
const STUDENT_STATUSES = { open: "En attente du formateur", answered: "Réponse reçue", closed: "Résolue" };
const MAX_MESSAGES_PER_HOUR = 30; // réponses : au plus 30 par heure et par compte (anti-abus)
const PER_PAGE = 25;

// Durée écoulée depuis une date SQLite (UTC) : « 12 min », « 3 h », « 2 j »
function ageLabel(iso) {
  const ms = Date.now() - Date.parse(`${String(iso).replace(" ", "T")}Z`);
  if (!Number.isFinite(ms) || ms < 0) return "";
  const m = Math.floor(ms / 60000);
  return m < 1 ? "à l'instant" : m < 60 ? `${m} min` : m < 1440 ? `${Math.floor(m / 60)} h` : `${Math.floor(m / 1440)} j`;
}
const cleanText = (v) => String(v ?? "").replace(/\r\n/g, "\n").trim();

// Formateur destinataire : propriétaire de la formation concernée, sinon le formateur de la plateforme (un seul aujourd'hui)
function defaultInstructor(courseId) {
  const owner = courseId ? db.prepare("SELECT instructor_id FROM courses WHERE id = ?").get(courseId) : null;
  return owner ? owner.instructor_id : (db.prepare("SELECT id FROM users WHERE role = 'formateur' ORDER BY id LIMIT 1").get() || {}).id ?? null;
}

// → { id } ou { errors } (erreurs par champ, en français)
function createTicket(user, input = {}) {
  const errors = {};
  const subject = cleanText(input.subject).replace(/\s+/g, " ");
  const message = cleanText(input.message);
  if (subject.length < 3 || subject.length > 120) errors.subject = "Le sujet doit faire entre 3 et 120 caractères.";
  if (message.length < 10 || message.length > 5000) errors.message = "Décrivez votre demande (10 à 5000 caractères).";
  let courseId = null;
  if (input.course_id) {
    // Seulement une formation que l'élève possède : pas de lien vers une formation quelconque
    const owned = db.prepare("SELECT course_id FROM enrollments WHERE user_id = ? AND course_id = ?").get(user.id, Number(input.course_id));
    if (owned) courseId = owned.course_id; else errors.course_id = "Choisissez une de vos formations, ou aucune.";
  }
  const recent = db.prepare("SELECT COUNT(*) n FROM support_tickets WHERE user_id = ? AND created_at >= datetime('now', '-1 hour')").get(user.id).n;
  if (!Object.keys(errors).length && recent >= MAX_OPEN_PER_HOUR) errors.form = "Vous avez créé beaucoup de demandes en peu de temps. Réessayez dans un moment.";
  if (Object.keys(errors).length) return { errors, values: { subject, message, course_id: input.course_id || "" } };

  const instructorId = defaultInstructor(courseId);
  db.exec("BEGIN IMMEDIATE");
  try {
    // Double clic ou renvoi du formulaire : la même demande envoyée dans les 2 dernières minutes n'est pas créée deux fois
    const twin = db.prepare(`SELECT t.id FROM support_tickets t JOIN support_messages m ON m.ticket_id = t.id AND m.id = (SELECT MIN(id) FROM support_messages WHERE ticket_id = t.id)
      WHERE t.user_id = ? AND t.subject = ? AND m.body = ? AND t.created_at >= datetime('now', '-2 minutes') ORDER BY t.id DESC LIMIT 1`).get(user.id, subject, message);
    if (twin) { db.exec("COMMIT"); return { id: twin.id, duplicate: true }; }
    const id = Number(db.prepare("INSERT INTO support_tickets (user_id, instructor_id, course_id, subject) VALUES (?, ?, ?, ?)").run(user.id, instructorId, courseId, subject).lastInsertRowid);
    db.prepare("INSERT INTO support_messages (ticket_id, author_id, is_staff, body) VALUES (?, ?, 0, ?)").run(id, user.id, message);
    db.exec("COMMIT");
    notifyStaffOfNew(id, user, subject, message, instructorId);
    return { id };
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch { /* déjà annulée */ }
    throw error;
  }
}

const TICKET = `SELECT t.*, u.username AS student_name, u.email AS student_email, c.title AS course_title, c.slug AS course_slug,
  (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id = t.id) AS message_count
  FROM support_tickets t JOIN users u ON u.id = t.user_id LEFT JOIN courses c ON c.id = t.course_id`;

const getForUser = (userId, id) => db.prepare(`${TICKET} WHERE t.id = ? AND t.user_id = ?`).get(id, userId) || null;
const getForInstructor = (instructorId, id) => db.prepare(`${TICKET} WHERE t.id = ? AND t.instructor_id = ?`).get(id, instructorId) || null;
const messagesOf = (ticketId) => db.prepare("SELECT m.*, u.username AS author_name FROM support_messages m LEFT JOIN users u ON u.id = m.author_id WHERE m.ticket_id = ? ORDER BY m.id").all(ticketId);

// Filtres du formateur : statut, recherche (sujet, nom, e-mail), « haute priorité à traiter » ; pagination par page de 25
function instructorWhere(instructorId, { status = "", q = "", urgent = false } = {}) {
  const where = ["t.instructor_id = ?"], args = [instructorId];
  if (STATUSES[status]) { where.push("t.status = ?"); args.push(status); }
  if (urgent) where.push("t.priority = 'high' AND t.status <> 'closed'");
  const text = String(q || "").trim().slice(0, 80);
  if (text) { where.push("(t.subject LIKE ? ESCAPE '\\' OR u.username LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\' OR CAST(t.id AS TEXT) = ?)"); const like = `%${text.replace(/[\\%_]/g, "\\$&")}%`; args.push(like, like, like, text.replace(/^#/, "")); }
  return { sql: where.join(" AND "), args };
}
// À traiter d'abord : en attente (priorité haute en tête, puis la plus ancienne attente), puis répondus (activité récente), puis résolus
function listForInstructor(instructorId, filters = {}, { page = 1 } = {}) {
  const w = instructorWhere(instructorId, filters);
  const total = db.prepare(`SELECT COUNT(*) n FROM support_tickets t JOIN users u ON u.id = t.user_id WHERE ${w.sql}`).get(...w.args).n;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE)), current = Math.min(Math.max(1, Number(page) || 1), pages);
  const rows = db.prepare(`${TICKET} WHERE ${w.sql} ORDER BY CASE t.status WHEN 'open' THEN 0 WHEN 'answered' THEN 1 ELSE 2 END,
    CASE WHEN t.status = 'open' THEN CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END ELSE 0 END,
    CASE WHEN t.status = 'open' THEN t.updated_at END ASC, t.updated_at DESC, t.id DESC LIMIT ? OFFSET ?`).all(...w.args, PER_PAGE, (current - 1) * PER_PAGE);
  rows.forEach((t) => { t.age = ageLabel(t.updated_at); });
  return { rows, total, pages, page: current };
}
// Indicateurs : uniquement des comptages réels des tickets adressés à ce formateur (« total » = tous, « open » = en attente de réponse)
function stats(instructorId) {
  const r = db.prepare(`SELECT COUNT(*) total, COALESCE(SUM(status = 'open'), 0) open, COALESCE(SUM(status = 'answered'), 0) answered, COALESCE(SUM(status = 'closed'), 0) closed,
    COALESCE(SUM(status = 'open' AND priority = 'high'), 0) urgent, MIN(CASE WHEN status = 'open' THEN updated_at END) oldest_open FROM support_tickets WHERE instructor_id = ?`).get(instructorId);
  return { total: r.total, open: r.open, answered: r.answered, closed: r.closed, urgent: r.urgent, oldestOpen: r.oldest_open || null };
}
const openCount = (instructorId) => db.prepare("SELECT COUNT(*) n FROM support_tickets WHERE instructor_id = ? AND status = 'open'").get(instructorId).n;
function listForUser(userId, { status = "" } = {}) {
  const f = STUDENT_STATUSES[status] ? " AND t.status = ?" : "";
  return db.prepare(`${TICKET} WHERE t.user_id = ?${f} ORDER BY CASE t.status WHEN 'answered' THEN 0 WHEN 'open' THEN 1 ELSE 2 END, t.updated_at DESC, t.id DESC LIMIT 100`).all(...(f ? [userId, status] : [userId]));
}
const countsForUser = (userId) => {
  const r = db.prepare("SELECT COUNT(*) total, COALESCE(SUM(status = 'open'), 0) open, COALESCE(SUM(status = 'answered'), 0) answered, COALESCE(SUM(status = 'closed'), 0) closed FROM support_tickets WHERE user_id = ?").get(userId);
  return { all: r.total, open: r.open, answered: r.answered, closed: r.closed };
};

// E-mails de suivi, par la file d'envoi partagée (src/utils/outbox.js : enregistrés, réessayés ; sans serveur SMTP configuré ils restent en file et rien n'est affirmé
// à l'écran). Une panne de la file ne fait jamais échouer le ticket.
function mailSafely(fn) { try { fn(require("../utils/mailer"), db); } catch (error) { console.error("[KOLAKISA] E-mail de support non mis en file :", error.message); } }
function notifyStaffOfNew(ticketId, student, subject, message, instructorId) {
  mailSafely((mailer) => { const to = (db.prepare("SELECT email FROM users WHERE id = ?").get(instructorId) || {}).email; if (to) mailer.sendSupportStaffEmail(db, { to, ticketId, student: student.username, subject, text: message, isReply: false, replyTo: student.email }); });
}

// Ajoute un message. L'élève qui écrit rouvre un ticket répondu ou résolu ; le formateur qui répond le passe à « répondu » (ou « résolue » avec resolve)
// et l'élève est prévenu (notification + e-mail en file). Le formateur ne peut pas écrire dans une demande résolue (il la rouvre d'abord).
// → { ok, duplicate? } ou { error }. Tout se joue dans UNE transaction : deux envois simultanés ne produisent ni doublon ni état incohérent.
function addMessage(ticket, author, body, { staff, resolve = false }) {
  const text = cleanText(body);
  if (text.length < 1 || text.length > 5000) return { error: "Le message doit faire entre 1 et 5000 caractères." };
  let duplicate = false;
  db.exec("BEGIN IMMEDIATE");
  try {
    const fresh = db.prepare("SELECT status FROM support_tickets WHERE id = ?").get(ticket.id);
    if (!fresh) { db.exec("ROLLBACK"); return { error: "Cette demande n'existe plus." }; }
    if (staff && fresh.status === "closed") { db.exec("ROLLBACK"); return { error: "Cette demande est résolue : rouvrez-la avant de répondre." }; }
    const last = db.prepare("SELECT body, author_id FROM support_messages WHERE ticket_id = ? ORDER BY id DESC LIMIT 1").get(ticket.id);
    if (last && last.author_id === author.id && last.body === text) { duplicate = true; db.exec("COMMIT"); } // double clic : pas de doublon
    else {
      const recent = db.prepare("SELECT COUNT(*) n FROM support_messages WHERE author_id = ? AND created_at >= datetime('now', '-1 hour')").get(author.id).n;
      if (recent >= MAX_MESSAGES_PER_HOUR) { db.exec("ROLLBACK"); return { error: "Vous avez envoyé beaucoup de messages en peu de temps. Réessayez dans un moment." }; }
      db.prepare("INSERT INTO support_messages (ticket_id, author_id, is_staff, body) VALUES (?, ?, ?, ?)").run(ticket.id, author.id, staff ? 1 : 0, text);
      const next = staff ? (resolve ? "closed" : "answered") : "open";
      db.prepare("UPDATE support_tickets SET status = ?, updated_at = datetime('now'), closed_at = CASE WHEN ? = 'closed' THEN datetime('now') END WHERE id = ?").run(next, next, ticket.id);
      db.exec("COMMIT");
    }
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch { /* déjà annulée */ }
    throw error;
  }
  if (duplicate) return { ok: true, duplicate: true };
  if (staff) {
    notifications.notify(ticket.user_id, { kind: "support", title: `Réponse à votre demande : ${ticket.subject}`, body: text.slice(0, 200), url: `/support/${ticket.id}` });
    mailSafely((mailer) => { if (ticket.student_email) mailer.sendSupportReplyEmail(db, { to: ticket.student_email, ticketId: ticket.id, subject: ticket.subject, text }); });
  } else if (ticket.instructor_id) {
    mailSafely((mailer) => { const to = (db.prepare("SELECT email FROM users WHERE id = ?").get(ticket.instructor_id) || {}).email; if (to) mailer.sendSupportStaffEmail(db, { to, ticketId: ticket.id, student: author.username, subject: ticket.subject, text, isReply: true, replyTo: author.email }); });
  }
  return { ok: true };
}

function close(ticketId) { return db.prepare("UPDATE support_tickets SET status = 'closed', closed_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND status <> 'closed'").run(ticketId).changes === 1; }
function reopen(ticketId) { return db.prepare("UPDATE support_tickets SET status = 'open', closed_at = NULL, updated_at = datetime('now') WHERE id = ? AND status = 'closed'").run(ticketId).changes === 1; }
function setPriority(instructorId, id, priority) {
  if (!PRIORITIES[priority]) return false;
  return db.prepare("UPDATE support_tickets SET priority = ? WHERE id = ? AND instructor_id = ?").run(priority, id, instructorId).changes === 1;
}

module.exports = { ageLabel, PRIORITIES, STATUSES, STUDENT_STATUSES, PER_PAGE, stats, countsForUser, createTicket, listForUser, getForUser, getForInstructor, messagesOf, listForInstructor, openCount, addMessage, close, reopen, setPriority };
