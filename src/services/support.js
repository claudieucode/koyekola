// Support : tickets des élèves au formateur. Chaque fonction qui lit ou écrit un ticket reçoit l'utilisateur et vérifie
// l'appartenance (élève = auteur ; formateur = destinataire) dans la requête SQL elle-même : changer l'identifiant d'un ticket
// dans l'adresse ne donne jamais accès au ticket d'un autre.
const db = require("../config/database");
const notifications = require("./notifications");

const MAX_OPEN_PER_HOUR = 5; // création de tickets : au plus 5 par heure et par élève (anti-abus)
const PRIORITIES = { low: "Basse", normal: "Normale", high: "Haute" };
const STATUSES = { open: "En attente de réponse", answered: "Répondu", closed: "Clos" };

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
    const id = Number(db.prepare("INSERT INTO support_tickets (user_id, instructor_id, course_id, subject) VALUES (?, ?, ?, ?)").run(user.id, instructorId, courseId, subject).lastInsertRowid);
    db.prepare("INSERT INTO support_messages (ticket_id, author_id, is_staff, body) VALUES (?, ?, 0, ?)").run(id, user.id, message);
    db.exec("COMMIT");
    return { id };
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch { /* déjà annulée */ }
    throw error;
  }
}

const TICKET = `SELECT t.*, u.username AS student_name, u.email AS student_email, c.title AS course_title, c.slug AS course_slug,
  (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id = t.id) AS message_count
  FROM support_tickets t JOIN users u ON u.id = t.user_id LEFT JOIN courses c ON c.id = t.course_id`;

const listForUser = (userId) => db.prepare(`${TICKET} WHERE t.user_id = ? ORDER BY t.updated_at DESC, t.id DESC`).all(userId);
const getForUser = (userId, id) => db.prepare(`${TICKET} WHERE t.id = ? AND t.user_id = ?`).get(id, userId) || null;
const getForInstructor = (instructorId, id) => db.prepare(`${TICKET} WHERE t.id = ? AND t.instructor_id = ?`).get(id, instructorId) || null;
const messagesOf = (ticketId) => db.prepare("SELECT m.*, u.username AS author_name FROM support_messages m LEFT JOIN users u ON u.id = m.author_id WHERE m.ticket_id = ? ORDER BY m.id").all(ticketId);

function listForInstructor(instructorId, { status = "", q = "" } = {}) {
  const where = ["t.instructor_id = ?"], args = [instructorId];
  if (STATUSES[status]) { where.push("t.status = ?"); args.push(status); }
  const text = String(q || "").trim().slice(0, 80);
  if (text) { where.push("(t.subject LIKE ? ESCAPE '\\' OR u.username LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')"); const like = `%${text.replace(/[\\%_]/g, "\\$&")}%`; args.push(like, like, like); }
  // À traiter d'abord : en attente (priorité haute en tête), puis répondus, puis clos
  return db.prepare(`${TICKET} WHERE ${where.join(" AND ")} ORDER BY CASE t.status WHEN 'open' THEN 0 WHEN 'answered' THEN 1 ELSE 2 END,
    CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, t.updated_at DESC, t.id DESC LIMIT 300`).all(...args);
}
const openCount = (instructorId) => db.prepare("SELECT COUNT(*) n FROM support_tickets WHERE instructor_id = ? AND status = 'open'").get(instructorId).n;

// Ajoute un message. L'élève qui écrit rouvre un ticket répondu ou clos ; le formateur qui répond le passe à « répondu »
// et l'élève est prévenu (notification). → { ok } ou { error }
function addMessage(ticket, author, body, { staff }) {
  const text = cleanText(body);
  if (text.length < 1 || text.length > 5000) return { error: "Le message doit faire entre 1 et 5000 caractères." };
  const last = db.prepare("SELECT body, author_id FROM support_messages WHERE ticket_id = ? ORDER BY id DESC LIMIT 1").get(ticket.id);
  if (last && last.author_id === author.id && last.body === text) return { ok: true, duplicate: true }; // double clic : pas de doublon
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("INSERT INTO support_messages (ticket_id, author_id, is_staff, body) VALUES (?, ?, ?, ?)").run(ticket.id, author.id, staff ? 1 : 0, text);
    db.prepare("UPDATE support_tickets SET status = ?, updated_at = datetime('now'), closed_at = NULL WHERE id = ?").run(staff ? "answered" : "open", ticket.id);
    db.exec("COMMIT");
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch { /* déjà annulée */ }
    throw error;
  }
  if (staff) notifications.notify(ticket.user_id, { kind: "support", title: `Réponse à votre demande : ${ticket.subject}`, body: text.slice(0, 200), url: `/support/${ticket.id}` });
  return { ok: true };
}

function close(ticketId) { return db.prepare("UPDATE support_tickets SET status = 'closed', closed_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND status <> 'closed'").run(ticketId).changes === 1; }
function reopen(ticketId) { return db.prepare("UPDATE support_tickets SET status = 'open', closed_at = NULL, updated_at = datetime('now') WHERE id = ? AND status = 'closed'").run(ticketId).changes === 1; }
function setPriority(instructorId, id, priority) {
  if (!PRIORITIES[priority]) return false;
  return db.prepare("UPDATE support_tickets SET priority = ? WHERE id = ? AND instructor_id = ?").run(priority, id, instructorId).changes === 1;
}

module.exports = { PRIORITIES, STATUSES, createTicket, listForUser, getForUser, getForInstructor, messagesOf, listForInstructor, openCount, addMessage, close, reopen, setPriority };
