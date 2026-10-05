// Espace élève : demandes de support (tickets) et centre de notifications. Réservé aux utilisateurs connectés ;
// chaque ticket et chaque notification est lié au compte dans la requête SQL (voir services/support.js et notifications.js).
const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middlewares/auth");
const support = require("../services/support");
const notifications = require("../services/notifications");

const router = express.Router();

const myCourses = (userId) => db.prepare("SELECT c.id, c.title FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? ORDER BY c.title COLLATE NOCASE").all(userId);

router.get("/support", requireAuth, (req, res) => {
  res.render("support", { tickets: support.listForUser(req.session.user.id), courses: myCourses(req.session.user.id), form: {}, errors: {}, statuses: support.STATUSES });
});

router.post("/support", requireAuth, (req, res) => {
  const r = support.createTicket(req.session.user, req.body || {});
  if (r.errors) {
    return res.status(400).render("support", { tickets: support.listForUser(req.session.user.id), courses: myCourses(req.session.user.id), form: r.values, errors: r.errors, statuses: support.STATUSES });
  }
  res.redirect(`/support/${r.id}`);
});

function loadOwnTicket(req, res, next) {
  const id = Number(req.params.id);
  req.ticket = Number.isInteger(id) ? support.getForUser(req.session.user.id, id) : null;
  if (!req.ticket) return res.status(404).render("error", { message: "Demande introuvable." });
  next();
}

router.get("/support/:id(\\d+)", requireAuth, loadOwnTicket, (req, res) => {
  res.render("support-ticket", { ticket: req.ticket, messages: support.messagesOf(req.ticket.id), statuses: support.STATUSES, error: req.session.supportError || null, replyDraft: "" , _clear: delete req.session.supportError });
});

router.post("/support/:id(\\d+)/repondre", requireAuth, loadOwnTicket, (req, res) => {
  const r = support.addMessage(req.ticket, req.session.user, req.body.message, { staff: false });
  if (r.error) req.session.supportError = r.error;
  res.redirect(`/support/${req.ticket.id}`);
});
router.post("/support/:id(\\d+)/fermer", requireAuth, loadOwnTicket, (req, res) => { support.close(req.ticket.id); res.redirect(`/support/${req.ticket.id}`); });
router.post("/support/:id(\\d+)/rouvrir", requireAuth, loadOwnTicket, (req, res) => { support.reopen(req.ticket.id); res.redirect(`/support/${req.ticket.id}`); });

// ---------- Notifications ----------
router.get("/notifications", requireAuth, (req, res) => {
  res.render("notifications", { list: notifications.list(req.session.user.id), unread: notifications.unreadCount(req.session.user.id) });
});
// Ouvre la notification : la marque lue puis va vers son lien (adresse interne seulement)
router.post("/notifications/:id(\\d+)/lue", requireAuth, (req, res) => {
  const n = db.prepare("SELECT url FROM notifications WHERE id = ? AND user_id = ?").get(Number(req.params.id), req.session.user.id);
  if (!n) return res.status(404).render("error", { message: "Notification introuvable." });
  notifications.markRead(req.session.user.id, Number(req.params.id));
  res.redirect(notifications.safeUrl(n.url) || "/notifications");
});
router.post("/notifications/tout-lire", requireAuth, (req, res) => { notifications.markAllRead(req.session.user.id); res.redirect("/notifications"); });

module.exports = router;
