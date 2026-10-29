// Espace élève : demandes de support (tickets) et centre de notifications. Réservé aux utilisateurs connectés ;
// chaque ticket et chaque notification est lié au compte dans la requête SQL (voir services/support.js et notifications.js).
const express = require("express");
const db = require("../config/database");
const { requireAuth } = require("../middlewares/auth");
const support = require("../services/support");
const notifications = require("../services/notifications");

const router = express.Router();

const myCourses = (userId) => db.prepare("SELECT c.id, c.title FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? ORDER BY c.title COLLATE NOCASE").all(userId);

const listView = (req, over = {}) => {
  const status = support.STUDENT_STATUSES[req.query.statut] ? req.query.statut : "";
  return { tickets: support.listForUser(req.session.user.id, { status }), counts: support.countsForUser(req.session.user.id), filter: status, courses: myCourses(req.session.user.id), form: {}, errors: {}, statuses: support.STUDENT_STATUSES, ...over };
};
router.get("/support", requireAuth, (req, res) => { res.render("support", listView(req)); });

router.post("/support", requireAuth, (req, res) => {
  const r = support.createTicket(req.session.user, req.body || {}, req.kwSite ? req.kwSite.id : null);
  if (r.errors) return res.status(400).render("support", listView(req, { form: r.values, errors: r.errors, tickets: support.listForUser(req.session.user.id), filter: "" }));
  req.session.supportOk = { id: r.id, text: r.duplicate ? "Cette demande venait déjà d'être envoyée : la voici." : `Demande #${r.id} envoyée. Vous serez prévenu(e) de la réponse dans vos notifications.` };
  res.redirect(`/support/${r.id}`);
});

function loadOwnTicket(req, res, next) {
  const id = Number(req.params.id);
  req.ticket = Number.isInteger(id) ? support.getForUser(req.session.user.id, id) : null;
  if (!req.ticket) return res.status(404).render("error", { message: "Demande introuvable." });
  next();
}
// Messages d'une action (une seule lecture) : réussite, erreur et brouillon du message refusé, pour ne pas le retaper
const takeNotices = (req, ticketId) => { const ok = req.session.supportOk; const n = { ok: ok && (typeof ok === "string" || ok.id === ticketId) ? (ok.text || ok) : null, error: req.session.supportError || null, draft: req.session.supportDraft || "" }; delete req.session.supportOk; delete req.session.supportError; delete req.session.supportDraft; return n; };

router.get("/support/:id(\\d+)", requireAuth, loadOwnTicket, (req, res) => {
  const n = takeNotices(req, req.ticket.id);
  res.render("support-ticket", { ticket: req.ticket, messages: support.messagesOf(req.ticket.id), statuses: support.STUDENT_STATUSES, error: n.error, ok: n.ok, replyDraft: n.draft });
});

router.post("/support/:id(\\d+)/repondre", requireAuth, loadOwnTicket, (req, res) => {
  const r = support.addMessage(req.ticket, req.session.user, req.body.message, { staff: false });
  if (r.error) { req.session.supportError = r.error; req.session.supportDraft = String(req.body.message || "").slice(0, 5000); } else req.session.supportOk = { id: req.ticket.id, text: r.duplicate ? "Ce message venait déjà d'être envoyé." : "Message envoyé." };
  res.redirect(`/support/${req.ticket.id}#reponse`);
});
router.post("/support/:id(\\d+)/fermer", requireAuth, loadOwnTicket, (req, res) => { req.session.supportOk = { id: req.ticket.id, text: support.close(req.ticket.id) ? "Demande marquée comme résolue." : "Cette demande était déjà résolue." }; res.redirect(`/support/${req.ticket.id}`); });
router.post("/support/:id(\\d+)/rouvrir", requireAuth, loadOwnTicket, (req, res) => { req.session.supportOk = { id: req.ticket.id, text: support.reopen(req.ticket.id) ? "Demande rouverte : le formateur la retrouve dans ses demandes en attente." : "Cette demande n'est pas résolue." }; res.redirect(`/support/${req.ticket.id}`); });

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
