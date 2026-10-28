// Boîte de réception des messages du formulaire de contact (« Messages » de Mon espace).
// Source unique des requêtes : liste paginée, recherche, filtre « non lus », lecture d'un message. Les messages sont ceux de la table contact_messages
// (niveau plateforme, un seul destinataire : le formateur) : il n'y a ni fil de discussion ni réponse envoyée depuis le site.
const db = require("../config/database");
const { parisToday } = require("./gestion/common");
const siteScope = require("./siteScope");
// Tout est scopé par site (contact_messages.site_id ; NULL = site principal) : un message d'un autre site est « introuvable », jamais lisible ni modifiable.
const SW = (siteId) => siteScope.where(siteId === undefined ? null : siteId);

const PAGE_SIZE = 30;

// Échappe % _ \ pour une recherche LIKE : la saisie est toujours traitée comme du texte, jamais comme un motif
const likeTerm = (q) => `%${String(q).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

// Aperçu d'une ligne : espaces et retours à la ligne ramenés à un seul espace, coupé proprement
function preview(text, max = 120) {
  const flat = String(text || "").replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
}

// Initiales de l'expéditeur (jamais d'image : aucune photo n'existe pour un visiteur du formulaire de contact)
function initials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  const letters = words.length === 1 ? [...words[0]].slice(0, 2) : [[...words[0]][0], [...words[words.length - 1]][0]];
  return letters.join("").toLocaleUpperCase("fr-FR");
}

// Repère de la liste (heure de Paris) : l'heure pour aujourd'hui, « 12 sept. » cette année, « 12/09/2024 » avant
function shortDate(sqlDate, now = new Date()) {
  const d = new Date(`${String(sqlDate).replace(" ", "T")}Z`);
  if (Number.isNaN(d.getTime())) return { text: "", iso: "" };
  const fmt = (o) => new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", ...o }).format(d);
  const day = parisToday(d), today = parisToday(now);
  const text = day === today ? fmt({ hour: "2-digit", minute: "2-digit" }) : day.slice(0, 4) === today.slice(0, 4) ? fmt({ day: "numeric", month: "short" }) : fmt({ day: "2-digit", month: "2-digit", year: "numeric" });
  return { text, iso: d.toISOString() };
}

function counts(siteId = null) {
  const w = SW(siteId);
  const r = db.prepare(`SELECT COUNT(*) AS total, COALESCE(SUM(read_at IS NULL), 0) AS unread FROM contact_messages WHERE 1 = 1${w.sql}`).get(...w.params);
  return { total: r.total, unread: r.unread };
}

// Filtre commun à la liste et au décompte : { where, params }
// keepId : le message ouvert reste dans la liste « non lus » même s'il vient d'être lu (la liste ne bouge pas sous les yeux du lecteur)
function filterOf({ q = "", unreadOnly = false, keepId = 0, siteId = null } = {}) {
  const w = SW(siteId);
  const where = [`1 = 1${w.sql}`], params = [...w.params];
  if (unreadOnly) { where.push("(read_at IS NULL OR id = ?)"); params.push(Number(keepId) || 0); }
  const term = String(q || "").trim().slice(0, 100);
  if (term) {
    where.push("(name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR subject LIKE ? ESCAPE '\\' OR message LIKE ? ESCAPE '\\')");
    params.push(likeTerm(term), likeTerm(term), likeTerm(term), likeTerm(term));
  }
  return { where: where.length ? `WHERE ${where.join(" AND ")}` : "", params, term };
}

// Une page de messages, du plus récent au plus ancien (l'ordre ne dépend plus de l'état « lu » : marquer un message lu ne le déplace pas)
function list({ q = "", unreadOnly = false, page = 1, keepId = 0, siteId = null } = {}) {
  const f = filterOf({ q, unreadOnly, keepId, siteId });
  const total = db.prepare(`SELECT COUNT(*) AS n FROM contact_messages ${f.where}`).get(...f.params).n;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, Number.parseInt(page, 10) || 1), pages);
  const rows = db.prepare(`SELECT id, name, email, subject, message, created_at, read_at FROM contact_messages ${f.where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
    .all(...f.params, PAGE_SIZE, (current - 1) * PAGE_SIZE)
    .map((m) => ({ ...m, preview: preview(m.message), initials: initials(m.name) }));
  return { rows, total, page: current, pages, pageSize: PAGE_SIZE, term: f.term };
}

// Page de la liste (avec ce filtre) qui contient le message : l'ouvrir depuis un lien (activité, notification) montre la liste à la bonne page ; 1 si absent de la liste
function pageOf(id, { q = "", unreadOnly = false, siteId = null } = {}) {
  const m = get(id, siteId);
  if (!m) return 1;
  const f = filterOf({ q, unreadOnly, keepId: m.id, siteId });
  const inList = db.prepare(`SELECT COUNT(*) AS n FROM contact_messages ${f.where ? `${f.where} AND` : "WHERE"} id = ?`).get(...f.params, m.id).n;
  if (!inList) return 1;
  const before = db.prepare(`SELECT COUNT(*) AS n FROM contact_messages ${f.where ? `${f.where} AND` : "WHERE"} (created_at > ? OR (created_at = ? AND id > ?))`).get(...f.params, m.created_at, m.created_at, m.id).n;
  return Math.floor(before / PAGE_SIZE) + 1;
}

function get(id, siteId = null) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 1) return null;
  const w = SW(siteId);
  const m = db.prepare(`SELECT id, name, email, subject, message, created_at, read_at FROM contact_messages WHERE id = ?${w.sql}`).get(n, ...w.params);
  return m ? { ...m, initials: initials(m.name) } : null;
}

const markRead = (id, siteId = null) => { const w = SW(siteId); return db.prepare(`UPDATE contact_messages SET read_at = COALESCE(read_at, datetime('now')) WHERE id = ?${w.sql}`).run(Number(id), ...w.params).changes > 0; };
const markUnread = (id, siteId = null) => { const w = SW(siteId); return db.prepare(`UPDATE contact_messages SET read_at = NULL WHERE id = ?${w.sql}`).run(Number(id), ...w.params).changes > 0; };
const remove = (id, siteId = null) => { const w = SW(siteId); return db.prepare(`DELETE FROM contact_messages WHERE id = ?${w.sql}`).run(Number(id), ...w.params).changes > 0; };

// Lien « Répondre par e-mail » : adresse + objet « Re: … » (sans doublon de « Re: »). Les caractères de contrôle sont retirés.
function replyHref(m) {
  const subject = String(m.subject || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  const objet = subject ? (/^re\s*:/i.test(subject) ? subject : `Re: ${subject}`) : "Re: votre message";
  return `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(objet)}`;
}

module.exports = { PAGE_SIZE, list, get, pageOf, counts, markRead, markUnread, remove, replyHref, preview, initials, shortDate };
