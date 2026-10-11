// KOLAKISA CMS → moteur de commentaires (palier 6). Une seule infrastructure pour tout contenu : un commentaire est rattaché à
// (content_type, content_id) ; les articles sont le premier type enregistré (registerContent en ajoute d'autres : pages, produits…).
// La table est blog_comments (système existant réutilisé) : membres connectés ET invités, réponses (parent_id), statuts réels
// pending / approved / spam / trash, empreinte d'adresse (jamais l'adresse), événements pour le futur Contact Core / Emailing / Automation.
// Le texte d'un commentaire est du TEXTE BRUT : il est stocké tel quel et n'est jamais interprété comme du HTML (échappé à l'affichage).
const crypto = require("crypto");
const EventEmitter = require("events");
const db = require("../config/database");
const { UserError } = require("../utils/errors");

const COMMENT_MAX = 2000;
const STATUSES = Object.freeze(["pending", "approved", "spam", "trash"]);
const STATUS_LABELS = Object.freeze({ pending: "En attente", approved: "Approuvé", spam: "Indésirable", trash: "Corbeille" });
const MAX_LINKS = 3; // au-delà, un commentaire est toujours retenu pour modération (même si la modération est désactivée)
const IP_RETENTION_DAYS = 90; // l'empreinte d'adresse ne sert qu'à limiter les abus : effacée après 90 jours
const PER_PAGE_PUBLIC = 20;
const PER_PAGE_ADMIN = 30;

// ---------- Contenus qui peuvent recevoir des commentaires (registre extensible) ----------
const CONTENT = {
  post: {
    table: "posts", label: "article",
    // Un contenu accepte des commentaires s'il est publié ET que ses commentaires sont ouverts
    row: (id) => db.prepare("SELECT id, slug, title, published, comments_enabled FROM posts WHERE id = ?").get(id),
    published: (r) => Boolean(r.published), open: (r) => Boolean(r.comments_enabled),
    url: (r) => `/blog/${r.slug}`, titleOf: (r) => r.title,
  },
};
const registerContent = (type, def) => { CONTENT[type] = def; };

// ---------- Événements (points d'accroche futurs : Contact Core, Emailing, Automation, Analytics) ----------
const events = new EventEmitter();
const emit = (name, payload) => { try { events.emit(name, { event: name, at: new Date().toISOString(), ...payload }); } catch { /* un abonné ne casse jamais l'action */ } };

// ---------- Prévenir la modération (palier 23) ----------
// Un commentaire « en attente » prévient l'adresse administrative (Paramètres → Général, sinon celle de l'hébergeur) par la file d'envoi existante.
// Au plus UN e-mail par tranche de 10 minutes, qui annonce le nombre total de commentaires en attente (jamais le texte du commentaire : il vient d'un inconnu).
// COMMENT_NOTIFY=0 coupe cette alerte. Un échec d'envoi ne gêne jamais l'envoi du commentaire.
const NOTIFY_EVERY_MS = 10 * 60 * 1000;
let lastNotified = 0;
events.on("comment.pending", () => {
  try {
    if (process.env.COMMENT_NOTIFY === "0" || Date.now() - lastNotified < NOTIFY_EVERY_MS) return;
    const mailer = require("../utils/mailer");
    let to = "";
    try { to = require("./settings").main().adminEmail; } catch { to = ""; }
    to = to || process.env.CONTACT_EMAIL || mailer.fromAddress();
    if (!to) return;
    const waiting = db.prepare("SELECT COUNT(*) n FROM blog_comments WHERE status = 'pending'").get().n;
    if (!waiting) return;
    lastNotified = Date.now();
    require("../utils/outbox").queueMail(db, {
      kind: "comment_pending", to,
      subject: `[KOLAKISA] ${waiting} commentaire${waiting > 1 ? "s" : ""} en attente de modération`,
      text: `${waiting} commentaire${waiting > 1 ? "s attendent" : " attend"} votre modération.\n\nOuvrir la modération : ${mailer.siteUrl()}/marketing/site-web/commentaires/en-attente\n\n(Au plus un e-mail toutes les 10 minutes. Pour couper cette alerte : COMMENT_NOTIFY=0.)`,
    });
  } catch { /* l'alerte ne doit jamais gêner le commentaire */ }
});

// ---------- Réglages (une ligne par clé dans mk_settings, organisation par défaut) ----------
const DEFAULTS = Object.freeze({
  enabled_default: true,   // nouveaux articles : commentaires ouverts
  guests_allowed: false,   // visiteurs sans compte (nom + e-mail)
  moderation: "none",      // none | first | all
  replies_allowed: true,
  max_depth: 3,            // niveaux de discussion (1 = pas de réponses imbriquées)
  links_allowed: true,     // liens http(s) cliquables (rel nofollow ugc) ; sinon un commentaire avec lien est refusé
});
const SETTING_KEY = "comments.settings";
const orgId = () => (db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get() || {}).id || null;
let cache = null;
function settings() {
  if (cache) return cache;
  const org = orgId();
  let saved = {};
  if (org) { try { saved = JSON.parse((db.prepare("SELECT value FROM mk_settings WHERE organization_id = ? AND key = ?").get(org, SETTING_KEY) || {}).value || "{}"); } catch { saved = {}; } }
  cache = normalizeSettings({ ...DEFAULTS, ...saved });
  return cache;
}
function normalizeSettings(s) {
  return {
    enabled_default: Boolean(s.enabled_default), guests_allowed: Boolean(s.guests_allowed),
    moderation: ["none", "first", "all"].includes(s.moderation) ? s.moderation : DEFAULTS.moderation,
    replies_allowed: Boolean(s.replies_allowed), max_depth: Math.min(5, Math.max(1, Math.round(Number(s.max_depth)) || DEFAULTS.max_depth)),
    links_allowed: Boolean(s.links_allowed),
  };
}
function saveSettings(input) {
  const org = orgId();
  if (!org) throw new UserError("Aucune organisation.");
  const next = normalizeSettings({ ...settings(), ...input });
  db.prepare("INSERT INTO mk_settings (organization_id, key, value, is_secret) VALUES (?, ?, ?, 0) ON CONFLICT (organization_id, key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')").run(org, SETTING_KEY, JSON.stringify(next));
  cache = next;
  return next;
}
const resetCache = () => { cache = null; };

// ---------- Texte, liens, empreinte ----------
function clean(text) {
  return String(text || "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
const URL_RE = /\bhttps?:\/\/[^\s<>"']+/gi;
const linksIn = (text) => (String(text).match(URL_RE) || []).length;
const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
// HTML d'un commentaire : TOUT est échappé d'abord ; seules les adresses http(s) deviennent des liens (liste blanche de schémas)
function html(body, { links = true } = {}) {
  const linkify = (line) => escapeHtml(line).replace(/\bhttps?:\/\/[^\s]+/gi, (url) => {
    const trail = (url.match(/(?:&quot;|&#39;|&gt;|[.,;:!?)\]])+$/) || [""])[0];
    const href = url.slice(0, url.length - trail.length);
    if (!links || href.length < 10) return url;
    return `<a href="${href}" rel="nofollow ugc noopener" target="_blank">${href}</a>${trail}`;
  });
  return String(body).split(/\n{2,}/).map((para) => `<p>${para.split("\n").map(linkify).join("<br>")}</p>`).join("");
}
const secret = () => process.env.SESSION_SECRET || "kolakisa-comments";
// Empreinte non réversible de l'adresse (HMAC) : sert à limiter les abus, ne permet pas de retrouver l'adresse
const ipHash = (ip) => (ip ? crypto.createHmac("sha256", secret()).update(String(ip)).digest("hex").slice(0, 32) : "");
function purgeOldHashes() {
  db.prepare(`UPDATE blog_comments SET ip_hash = '' WHERE ip_hash <> '' AND created_at < datetime('now', ?)`).run(`-${IP_RETENTION_DAYS} days`);
}
let purgedAt = 0;
const EMAIL_RE = /^[^\s@<>]{1,64}@[^\s@<>]+\.[^\s@<>]{2,}$/;

// ---------- Profondeur ----------
function levelOf(commentId) {
  let level = 0, id = commentId;
  for (let i = 0; id && i < 20; i += 1) { level += 1; id = (db.prepare("SELECT parent_id FROM blog_comments WHERE id = ?").get(id) || {}).parent_id; }
  return level;
}

// ---------- Création ----------
// user : membre connecté ({ id, username, email }) ou null (invité) ; trusted : l'auteur peut modérer (publication immédiate)
function create({ type = "post", contentId, parentId = null, user = null, name = "", email = "", body, ip = "", honeypot = "", trusted = false, bypassClosed = false }) {
  const def = CONTENT[type];
  if (!def) throw new UserError("Ce contenu n'accepte pas de commentaires.");
  const content = def.row(contentId);
  if (!content || !def.published(content)) throw new UserError("Contenu introuvable.");
  if (!bypassClosed && !def.open(content)) throw new UserError("Les commentaires sont fermés sur ce contenu.");
  const cfg = settings();
  if (!user && !cfg.guests_allowed) throw new UserError("Connectez-vous pour commenter.");
  const text = clean(body);
  if (text.length < 2) throw new UserError("Votre commentaire est vide.");
  if (text.length > COMMENT_MAX) throw new UserError(`Votre commentaire dépasse ${COMMENT_MAX} caractères.`);
  let authorName = "", authorEmail = "";
  if (!user) {
    authorName = clean(name).replace(/\s+/g, " ").slice(0, 60);
    authorEmail = String(email || "").trim().toLowerCase().slice(0, 120);
    if (authorName.length < 2) throw new UserError("Indiquez votre nom (2 caractères au moins).");
    if (!EMAIL_RE.test(authorEmail)) throw new UserError("Indiquez une adresse e-mail valide (elle ne sera jamais affichée).");
  }
  let parent = null;
  if (parentId) {
    parent = db.prepare("SELECT id, status, content_type, content_id FROM blog_comments WHERE id = ?").get(parentId);
    if (!cfg.replies_allowed) throw new UserError("Les réponses sont désactivées.");
    if (!parent || parent.content_type !== type || parent.content_id !== Number(contentId) || parent.status !== "approved") throw new UserError("Le commentaire auquel vous répondez n'existe plus.");
    if (levelOf(parent.id) >= cfg.max_depth) throw new UserError("Ce fil de discussion ne peut pas être prolongé davantage : répondez au commentaire précédent.");
  }
  const links = linksIn(text);
  if (links && !cfg.links_allowed) throw new UserError("Les liens ne sont pas autorisés dans les commentaires.");
  // Même texte déjà envoyé par la même personne sur ce contenu : pas de doublon (double clic, rechargement)
  const twin = user
    ? db.prepare("SELECT id, status FROM blog_comments WHERE content_type = ? AND content_id = ? AND user_id = ? AND body = ? AND status <> 'trash'").get(type, contentId, user.id, text)
    : db.prepare("SELECT id, status FROM blog_comments WHERE content_type = ? AND content_id = ? AND author_email = ? AND body = ? AND status <> 'trash'").get(type, contentId, authorEmail, text);
  if (twin) return { id: twin.id, status: twin.status, duplicate: true };

  // Statut : piège à robots → indésirable ; membre de confiance → publié ; sinon selon le réglage de modération
  let status = "approved", reason = "";
  if (honeypot) { status = "spam"; reason = String(honeypot).slice(0, 20); } // robot détecté (piège ou envoi trop rapide) : conservé comme indésirable, jamais publié
  else if (!trusted) {
    if (cfg.moderation === "all") { status = "pending"; reason = "moderation"; }
    else if (cfg.moderation === "first") {
      const known = user ? db.prepare("SELECT 1 FROM blog_comments WHERE user_id = ? AND status = 'approved' LIMIT 1").get(user.id) : db.prepare("SELECT 1 FROM blog_comments WHERE author_email = ? AND status = 'approved' LIMIT 1").get(authorEmail);
      if (!known) { status = "pending"; reason = "first"; }
    }
    if (status === "approved" && links >= MAX_LINKS) { status = "pending"; reason = "links"; }
  }
  const authorId = user ? user.id : null;
  const info = db.prepare(`INSERT INTO blog_comments (post_id, content_type, content_id, parent_id, user_id, author_name, author_email, ip_hash, body, status, approved_at, approved_by, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${status === "approved" ? "datetime('now')" : "NULL"}, ?, ?)`)
    .run(type === "post" ? contentId : null, type, contentId, parent ? parent.id : null, authorId, authorName, authorEmail, ipHash(ip), text, status, status === "approved" && trusted ? authorId : null, JSON.stringify(reason ? { reason } : {}));
  const id = Number(info.lastInsertRowid);
  if (Date.now() - purgedAt > 3600 * 1000) { purgedAt = Date.now(); purgeOldHashes(); }
  const payload = { commentId: id, contentType: type, contentId: Number(contentId), parentId: parent ? parent.id : null, status, userId: authorId };
  emit("comment.created", payload);
  emit(status === "pending" ? "comment.pending" : status === "spam" ? "comment.spam" : "comment.approved", payload);
  if (parent) emit("comment.replied", payload);
  return { id, status, duplicate: false };
}

// ---------- Lecture publique : discussion paginée par commentaires de premier niveau ----------
function nameOf(c) { return c.user_id ? c.username || "Membre supprimé" : c.author_name || "Anonyme"; }
function thread(type, contentId, { page = 1 } = {}) {
  const total = db.prepare("SELECT COUNT(*) n FROM blog_comments WHERE content_type = ? AND content_id = ? AND status = 'approved'").get(type, contentId).n;
  const rootsTotal = db.prepare("SELECT COUNT(*) n FROM blog_comments WHERE content_type = ? AND content_id = ? AND status = 'approved' AND parent_id IS NULL").get(type, contentId).n;
  const pages = Math.max(1, Math.ceil(rootsTotal / PER_PAGE_PUBLIC));
  const current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), pages);
  // Racines de la page, puis leurs réponses approuvées (un fil dont un maillon n'est pas approuvé s'arrête à ce maillon)
  const rows = db.prepare(`WITH RECURSIVE roots(id) AS (
      SELECT id FROM blog_comments WHERE content_type = ? AND content_id = ? AND status = 'approved' AND parent_id IS NULL ORDER BY created_at, id LIMIT ? OFFSET ?
    ), tree(id, level) AS (
      SELECT id, 1 FROM roots
      UNION ALL SELECT c.id, t.level + 1 FROM blog_comments c JOIN tree t ON c.parent_id = t.id WHERE c.status = 'approved' AND t.level < 20
    )
    SELECT c.id, c.parent_id, c.body, c.created_at, c.user_id, c.author_name, u.username, u.avatar_path, u.role, t.level
    FROM tree t JOIN blog_comments c ON c.id = t.id LEFT JOIN users u ON u.id = c.user_id ORDER BY c.created_at, c.id`)
    .all(type, contentId, PER_PAGE_PUBLIC, (current - 1) * PER_PAGE_PUBLIC);
  const byId = new Map(rows.map((r) => [r.id, { ...r, name: nameOf(r), children: [] }]));
  const roots = [];
  for (const r of byId.values()) { const parent = byId.get(r.parent_id); if (parent) parent.children.push(r); else roots.push(r); }
  return { roots, total, page: current, pages, maxDepth: settings().max_depth, repliesAllowed: settings().replies_allowed };
}
const count = (type, contentId) => db.prepare("SELECT COUNT(*) n FROM blog_comments WHERE content_type = ? AND content_id = ? AND status = 'approved'").get(type, contentId).n;
const get = (id) => db.prepare("SELECT * FROM blog_comments WHERE id = ?").get(id);

// ---------- Modération ----------
// Chaque action ne compte que les commentaires réellement modifiés (jamais de succès annoncé sans changement)
const ACTIONS = {
  approve: { from: ["pending", "spam", "trash"], event: "comment.approved" },
  spam: { from: ["pending", "approved", "trash"], event: "comment.spam" },
  trash: { from: ["pending", "approved", "spam"], event: "comment.deleted" },
  restore: { from: ["spam", "trash"], event: "comment.restored" },
  delete: { from: ["trash"], event: null },
};
function moderate(ids, action, actorId = null) {
  const spec = ACTIONS[action];
  if (!spec) throw new UserError("Action inconnue.");
  const done = [], skipped = [];
  for (const id of uniqueIds(ids)) {
    const c = get(id);
    if (!c) { skipped.push({ id, why: "introuvable" }); continue; }
    if (!spec.from.includes(c.status)) { skipped.push({ id, why: `déjà ${STATUS_LABELS[c.status].toLowerCase()}` }); continue; }
    const payload = { commentId: c.id, contentType: c.content_type, contentId: c.content_id, parentId: c.parent_id, userId: c.user_id, actorId, from: c.status };
    if (action === "delete") { db.prepare("DELETE FROM blog_comments WHERE id = ?").run(c.id); emit("comment.purged", payload); done.push(id); continue; }
    if (action === "approve") db.prepare("UPDATE blog_comments SET status = 'approved', prev_status = '', deleted_at = NULL, approved_at = datetime('now'), approved_by = ?, updated_at = datetime('now') WHERE id = ?").run(actorId, c.id);
    else if (action === "restore") {
      const back = ["pending", "approved"].includes(c.prev_status) ? c.prev_status : "pending";
      db.prepare("UPDATE blog_comments SET status = ?, prev_status = '', deleted_at = NULL, updated_at = datetime('now') WHERE id = ?").run(back, c.id);
      payload.to = back;
    } else db.prepare("UPDATE blog_comments SET status = ?, prev_status = ?, deleted_at = ?, updated_at = datetime('now') WHERE id = ?").run(action === "spam" ? "spam" : "trash", c.status === "trash" ? c.prev_status : c.status, action === "trash" ? new Date().toISOString().replace("T", " ").slice(0, 19) : null, c.id);
    emit(spec.event, payload);
    done.push(id);
  }
  return { done, skipped };
}
// Réponse d'un modérateur depuis l'administration : publiée tout de suite ; le commentaire auquel elle répond est approuvé s'il attendait
function reply(parentId, actor, body, ip = "") {
  const parent = get(parentId);
  if (!parent || parent.status === "trash") throw new UserError("Commentaire introuvable.");
  if (parent.status !== "approved") moderate([parent.id], "approve", actor.id);
  return create({ type: parent.content_type, contentId: parent.content_id, parentId: parent.id, user: actor, body, ip, trusted: true, bypassClosed: true });
}
const uniqueIds = (v) => [...new Set([].concat(v || []).flatMap((x) => String(x).split(",")).map((x) => Number(x)).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 500);
// Suppression par l'auteur d'un commentaire (site public) ou par un formateur : définitive, les réponses remontent d'un niveau
function purge(id) { db.prepare("DELETE FROM blog_comments WHERE id = ?").run(id); }

// ---------- Liste d'administration : recherche, filtres, tri, pagination — tout dans la base ----------
const PERIODS = { "7": "-7 days", "30": "-30 days", "90": "-90 days", "365": "-365 days" };
const SORTS = { recent: "c.created_at DESC, c.id DESC", ancien: "c.created_at ASC, c.id ASC", auteur: "author COLLATE NOCASE ASC, c.id DESC", contenu: "content_title COLLATE NOCASE ASC, c.id DESC" };
const like = (s) => `%${String(s).replace(/[\\%_]/g, "\\$&")}%`;
function list({ status = "", q = "", content = "", author = "", period = "", sort = "recent", page = 1, perPage = PER_PAGE_ADMIN, includeEmail = false } = {}) {
  const where = [], args = [];
  if (STATUSES.includes(status)) { where.push("c.status = ?"); args.push(status); } else where.push("c.status <> 'trash'"); // « Tous » : tout sauf la corbeille
  const m = /^([a-z_]{1,20}):(\d{1,9})$/.exec(String(content));
  if (m) { where.push("c.content_type = ? AND c.content_id = ?"); args.push(m[1], Number(m[2])); }
  if (/^\d{1,9}$/.test(String(author))) { where.push("c.user_id = ?"); args.push(Number(author)); }
  else if (author) { where.push("(u.username LIKE ? ESCAPE '\\' OR c.author_name LIKE ? ESCAPE '\\')"); args.push(like(author), like(author)); }
  if (PERIODS[period]) { where.push("c.created_at >= datetime('now', ?)"); args.push(PERIODS[period]); }
  if (q) {
    const parts = ["c.body LIKE ? ESCAPE '\\'", "u.username LIKE ? ESCAPE '\\'", "c.author_name LIKE ? ESCAPE '\\'", "p.title LIKE ? ESCAPE '\\'"];
    const qa = [like(q), like(q), like(q), like(q)];
    if (includeEmail) { parts.push("c.author_email LIKE ? ESCAPE '\\'", "u.email LIKE ? ESCAPE '\\'"); qa.push(like(q), like(q)); }
    where.push(`(${parts.join(" OR ")})`); args.push(...qa);
  }
  const from = `FROM blog_comments c LEFT JOIN users u ON u.id = c.user_id LEFT JOIN posts p ON c.content_type = 'post' AND p.id = c.content_id LEFT JOIN users ap ON ap.id = c.approved_by ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  const total = db.prepare(`SELECT COUNT(*) n ${from}`).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), pages);
  const rows = db.prepare(`SELECT c.id, c.content_type, c.content_id, c.parent_id, c.user_id, c.body, c.status, c.created_at, c.approved_at, c.approved_by, c.author_name, ${includeEmail ? "COALESCE(NULLIF(c.author_email, ''), u.email, '')" : "''"} AS email,
      COALESCE(u.username, NULLIF(c.author_name, ''), 'Anonyme') AS author, p.title AS content_title, p.slug AS content_slug, ap.username AS approver
    ${from} ORDER BY ${SORTS[sort] || SORTS.recent} LIMIT ? OFFSET ?`).all(...args, perPage, (current - 1) * perPage);
  return { rows, total, page: current, pages };
}
// Effectifs par statut (onglets) : une seule requête groupée
function counts(content = "") {
  const m = /^([a-z_]{1,20}):(\d{1,9})$/.exec(String(content));
  const rows = m ? db.prepare("SELECT status, COUNT(*) n FROM blog_comments WHERE content_type = ? AND content_id = ? GROUP BY status").all(m[1], Number(m[2])) : db.prepare("SELECT status, COUNT(*) n FROM blog_comments GROUP BY status").all();
  const out = { pending: 0, approved: 0, spam: 0, trash: 0 };
  for (const r of rows) out[r.status] = r.n;
  out.all = out.pending + out.approved + out.spam;
  return out;
}
// Éléments pour le filtre « contenu » : articles qui ont des commentaires
function commentedContents(limit = 100) {
  return db.prepare(`SELECT 'post:' || p.id AS value, p.title AS label FROM posts p WHERE EXISTS (SELECT 1 FROM blog_comments c WHERE c.content_type = 'post' AND c.content_id = p.id) ORDER BY p.title COLLATE NOCASE LIMIT ?`).all(limit);
}
function contentInfo(type, id) {
  const def = CONTENT[type];
  const row = def && def.row(id);
  return row ? { title: def.titleOf(row), url: def.url(row), label: def.label } : null;
}
// Compteurs par article pour la liste des articles du CMS : [{ approved, pending }]
function countsForPosts(ids) {
  const out = new Map();
  if (!ids.length) return out;
  const rows = db.prepare(`SELECT content_id, status, COUNT(*) n FROM blog_comments WHERE content_type = 'post' AND content_id IN (${ids.map(() => "?").join(",")}) AND status IN ('approved', 'pending') GROUP BY content_id, status`).all(...ids);
  for (const r of rows) { const o = out.get(r.content_id) || { approved: 0, pending: 0 }; o[r.status] = r.n; out.set(r.content_id, o); }
  return out;
}

module.exports = {
  COMMENT_MAX, STATUSES, STATUS_LABELS, MAX_LINKS, IP_RETENTION_DAYS, PER_PAGE_PUBLIC, PER_PAGE_ADMIN, PERIODS, SORTS, DEFAULTS,
  CONTENT, registerContent, events, settings, saveSettings, resetCache,
  clean, html, linksIn, ipHash, levelOf, create, thread, count, get, moderate, reply, purge, list, counts, commentedContents, contentInfo, countsForPosts, uniqueIds,
};
