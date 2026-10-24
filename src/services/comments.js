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
    row: (id) => db.prepare("SELECT id, slug, title, published, published_at, comments_enabled FROM posts WHERE id = ?").get(id),
    published: (r) => Boolean(r.published), open: (r) => Boolean(r.comments_enabled),
    url: (r) => `/blog/${r.slug}`, titleOf: (r) => r.title,
  },
};
const registerContent = (type, def) => { CONTENT[type] = def; };

// ---------- Événements (points d'accroche futurs : Contact Core, Emailing, Automation, Analytics) ----------
const events = new EventEmitter();
const emit = (name, payload) => { try { events.emit(name, { event: name, at: new Date().toISOString(), ...payload }); } catch { /* un abonné ne casse jamais l'action */ } };

// ---------- Prévenir l'équipe (palier 23, réglages par site) ----------
// « Un commentaire est en attente de modération » : au plus UN e-mail par tranche de 10 minutes ET PAR SITE, qui annonce le nombre de commentaires en attente (jamais le
// texte : il vient d'un inconnu). « Un nouveau commentaire est publié » : un e-mail par commentaire publié par un visiteur (jamais pour un modérateur qui se répond à lui-même).
// Les deux passent par la file d'envoi existante (échec noté et réessayé : Outils → journal d'envoi) ; chaque événement ne compte que si le réglage DU SITE du contenu l'a activé.
// Destinataire : l'adresse administrative (Paramètres → Général, sinon celle de l'hébergeur). COMMENT_NOTIFY=0 coupe tout. Un échec d'envoi ne gêne jamais l'envoi du commentaire.
const NOTIFY_EVERY_MS = 10 * 60 * 1000;
const lastNotified = new Map();
function recipient() {
  const mailer = require("../utils/mailer");
  let to = "";
  try { to = require("./settings").main().adminEmail; } catch { to = ""; }
  return to || process.env.CONTACT_EMAIL || mailer.fromAddress();
}
events.on("comment.pending", (p) => {
  try {
    if (process.env.COMMENT_NOTIFY === "0") return;
    const site = siteIdOf(p.contentType, p.contentId);
    if (!settingsFor(site).notify_pending) return;
    if (Date.now() - (lastNotified.get(site || 0) || 0) < NOTIFY_EVERY_MS) return;
    const mailer = require("../utils/mailer");
    const to = recipient();
    if (!to) return;
    const waiting = db.prepare(`SELECT COUNT(*) n FROM blog_comments c WHERE c.status = 'pending' AND ${siteFilterSql(site)}`).get().n;
    if (!waiting) return;
    lastNotified.set(site || 0, Date.now());
    require("../utils/outbox").queueMail(db, {
      kind: "comment_pending", to,
      subject: `[KOLAKISA] ${waiting} commentaire${waiting > 1 ? "s" : ""} en attente de modération`,
      text: `${waiting} commentaire${waiting > 1 ? "s attendent" : " attend"} votre modération.\n\nOuvrir la modération : ${mailer.siteUrl()}/marketing/site-web/commentaires/en-attente\n\n(Au plus un e-mail toutes les 10 minutes. Pour couper cette alerte : Paramètres → Commentaires.)`,
    });
  } catch { /* l'alerte ne doit jamais gêner le commentaire */ }
});
events.on("comment.created", (p) => {
  try {
    if (process.env.COMMENT_NOTIFY === "0" || p.status !== "approved" || p.trusted) return;
    const site = siteIdOf(p.contentType, p.contentId);
    if (!settingsFor(site).notify_published) return;
    const to = recipient();
    if (!to) return;
    const def = CONTENT[p.contentType], row = def && def.row(p.contentId);
    const mailer = require("../utils/mailer");
    require("../utils/outbox").queueMail(db, {
      kind: "comment_published", to,
      subject: `[KOLAKISA] Nouveau commentaire sur « ${row ? String(def.titleOf(row)).slice(0, 80) : "un contenu"} »`,
      text: `Un nouveau commentaire vient d'être publié${row ? ` sur « ${def.titleOf(row)} »` : ""}.\n\nLe lire ou le modérer : ${mailer.siteUrl()}/marketing/site-web/commentaires\n\n(Pour couper cet e-mail : Paramètres → Commentaires.)`,
    });
  } catch { /* idem */ }
});

// ---------- Réglages (propres à chaque site) ----------
// Site principal : une ligne JSON dans mk_settings (clé comments.settings, comme avant). Site du CMS : bloc « comments » de mk_sites.settings, créé à la première
// modification depuis les valeurs du site principal (jusque-là le site HÉRITE du principal, comme avant l'arrivée des réglages par site). Les réglages individuels d'un contenu
// (comments_enabled d'un article) priment toujours sur la valeur par défaut et ne sont JAMAIS réécrits par un changement de réglage.
const DEFAULTS = Object.freeze({
  enabled_default: true,    // nouveaux articles : commentaires ouverts
  guests_allowed: false,    // visiteurs sans compte ; faux = « un compte connecté est obligatoire »
  require_name_email: true, // visiteurs : nom et e-mail obligatoires (sinon facultatifs ; un e-mail saisi doit rester valide)
  close_enabled: false, close_days: 14, // fermeture automatique, N jours après la publication de l'article (UTC)
  cookie_consent: false,    // case « mémoriser mon nom et mon e-mail » : le cookie n'est écrit que si elle est cochée
  replies_allowed: true,
  max_depth: 3,             // niveaux de discussion (1 = pas de réponses imbriquées), 1 à 10
  paginate: true, per_page: 20, default_page: "first", order: "oldest", // pagination par commentaires de premier niveau
  notify_published: false, notify_pending: true,
  moderation: "none",       // none | first (auteur sans commentaire approuvé) | all (approbation manuelle) ; « all » l'emporte
  max_links: 2,             // au-delà (strictement plus de N liens), le commentaire attend la modération
  mod_keys: "", block_keys: "", // listes distinctes : modération (en attente) et blocage (indésirable)
  links_allowed: true,      // liens http(s) cliquables (rel nofollow ugc) ; sinon un commentaire avec lien est refusé
  show_avatars: true, avatar_rating: "G", avatar_default: "mystery", avatar_external: false,
});
const AVATAR_DEFAULTS = Object.freeze(["mystery", "blank", "gravatar", "identicon", "wavatar", "monsterid", "retro", "robohash", "initials", "color"]);
const AVATAR_EXTERNAL = Object.freeze(["gravatar", "wavatar", "monsterid", "retro", "robohash"]); // produits par un service tiers (Gravatar) : jamais sans l'accord explicite
const LIST_MAX_LINES = 500, LIST_MAX_LINE = 200;
const SETTING_KEY = "comments.settings";
const orgId = () => (db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get() || {}).id || null;
// Liste de termes : une entrée par ligne, sans doublon, bornée (jamais de liste sans fin : chaque commentaire la parcourt)
function normalizeList(v) {
  const seen = new Set(), out = [];
  for (const raw of String(v || "").replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, LIST_MAX_LINE);
    const key = line.toLowerCase();
    if (line && !seen.has(key)) { seen.add(key); out.push(line); }
    if (out.length >= LIST_MAX_LINES) break;
  }
  return out.join("\n");
}
const clampInt = (v, min, max, fallback) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback; };
function normalizeSettings(s) {
  const d = DEFAULTS, one = (v, list, f) => (list.includes(v) ? v : f), bool = (v, f) => (v === undefined || v === null ? f : Boolean(v));
  return {
    enabled_default: bool(s.enabled_default, d.enabled_default), guests_allowed: bool(s.guests_allowed, d.guests_allowed), require_name_email: bool(s.require_name_email, d.require_name_email),
    close_enabled: bool(s.close_enabled, d.close_enabled), close_days: clampInt(s.close_days, 1, 3650, d.close_days), cookie_consent: bool(s.cookie_consent, d.cookie_consent),
    replies_allowed: bool(s.replies_allowed, d.replies_allowed), max_depth: clampInt(s.max_depth, 1, 10, d.max_depth),
    paginate: bool(s.paginate, d.paginate), per_page: clampInt(s.per_page, 1, 100, d.per_page), default_page: one(s.default_page, ["first", "last"], d.default_page), order: one(s.order, ["oldest", "newest"], d.order),
    notify_published: bool(s.notify_published, d.notify_published), notify_pending: bool(s.notify_pending, d.notify_pending),
    moderation: one(s.moderation, ["none", "first", "all"], d.moderation), max_links: clampInt(s.max_links, 0, 50, d.max_links),
    mod_keys: normalizeList(s.mod_keys), block_keys: normalizeList(s.block_keys), links_allowed: bool(s.links_allowed, d.links_allowed),
    show_avatars: bool(s.show_avatars, d.show_avatars), avatar_rating: one(s.avatar_rating, ["G", "PG", "R", "X"], d.avatar_rating),
    avatar_default: one(s.avatar_default, AVATAR_DEFAULTS, d.avatar_default), avatar_external: bool(s.avatar_external, d.avatar_external),
  };
}
let cache = null;
function mainSettings() {
  if (cache) return cache;
  const org = orgId();
  let saved = {};
  if (org) { try { saved = JSON.parse((db.prepare("SELECT value FROM mk_settings WHERE organization_id = ? AND key = ?").get(org, SETTING_KEY) || {}).value || "{}"); } catch { saved = {}; } }
  cache = normalizeSettings({ ...DEFAULTS, ...saved });
  return cache;
}
// Réglages PROPRES à un site, ou null (il hérite alors du site principal)
function siteOwn(siteId) {
  try {
    const row = db.prepare("SELECT settings FROM mk_sites WHERE id = ?").get(siteId);
    const c = row && JSON.parse(row.settings || "{}").comments;
    return c && typeof c === "object" ? normalizeSettings(c) : null;
  } catch { return null; }
}
const settingsFor = (siteId) => (siteId ? siteOwn(siteId) || mainSettings() : mainSettings());
const settings = (siteId = null) => settingsFor(siteId);
const siteIdOf = (type, contentId) => { try { const r = require("./urls").attachedSite(type, contentId); return r && r.site_id ? r.site_id : null; } catch { return null; } };
const settingsOf = (type, contentId) => settingsFor(siteIdOf(type, contentId));
// Contenus d'un site (SQL) : le site principal = ceux qui ne sont rattachés à aucun site
const siteFilterSql = (siteId) => (siteId ? `EXISTS (SELECT 1 FROM mk_content_sites cs WHERE cs.content_type = c.content_type AND cs.content_id = c.content_id AND cs.site_id = ${Number(siteId)})` : "NOT EXISTS (SELECT 1 FROM mk_content_sites cs WHERE cs.content_type = c.content_type AND cs.content_id = c.content_id AND cs.site_id IS NOT NULL)");
function saveSettings(input) { // site principal
  const org = orgId();
  if (!org) throw new UserError("Aucune organisation.");
  const next = normalizeSettings({ ...mainSettings(), ...input });
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
// Liens comptés pour la modération : adresses http(s):// et « www.… » nues, y compris encodées (%68ttp…) ; chaque adresse compte une fois
const linksIn = (text) => {
  let t = String(text);
  try { t = decodeURIComponent(t.replace(/%(?![0-9a-f]{2})/gi, "%25")); } catch { /* texte non décodable : compté tel quel */ }
  const found = new Set();
  for (const m of t.match(/\b(?:https?:\/\/|www\.)[^\s<>"']+/gi) || []) found.add(m.toLowerCase().replace(/[.,;:!?)\]]+$/, ""));
  return found.size;
};
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

// ---------- Listes de termes : modération et blocage ----------
// Une entrée par ligne : un mot, une adresse e-mail, un domaine ou une adresse IP. Comparaison sans casse ni accents, À L'INTÉRIEUR des mots (« press » trouve « WordPress » :
// risque de faux positifs, à choisir avec soin) ; une adresse IP s'écrit en entier et se compare à l'adresse de l'envoi (jamais stockée : seule son empreinte l'est).
// Champs examinés : texte, nom, e-mail et agent utilisateur de l'envoi (jamais conservé). Retourne l'entrée trouvée ou "".
function matchList(list, fields) {
  const lines = String(list || "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return "";
  const hay = foldText([fields.body, fields.name, fields.email, fields.userAgent].join(" \n "));
  const ip = String(fields.ip || "").trim().toLowerCase().replace(/^::ffff:/, "");
  for (const line of lines) {
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(line) || (line.includes(":") && /^[0-9a-f:]{3,45}$/i.test(line))) { if (ip && ip === line.toLowerCase().replace(/^::ffff:/, "")) return line; continue; }
    const needle = foldText(line);
    if (needle && hay.includes(needle)) return line;
  }
  return "";
}
// Fermeture automatique : N jours après la publication (UTC, calcul serveur) ; sans date de publication, jamais fermé
function closedByAge(content, cfg, now = Date.now()) {
  if (!cfg.close_enabled || !content || !content.published_at) return false;
  const t = Date.parse(String(content.published_at).replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(String(content.published_at)) ? "" : "Z"));
  return Number.isFinite(t) && now - t > cfg.close_days * 86400000;
}

// ---------- Profondeur ----------
function levelOf(commentId) {
  let level = 0, id = commentId;
  for (let i = 0; id && i < 20; i += 1) { level += 1; id = (db.prepare("SELECT parent_id FROM blog_comments WHERE id = ?").get(id) || {}).parent_id; }
  return level;
}

// ---------- Création ----------
// user : membre connecté ({ id, username, email }) ou null (invité) ; trusted : l'auteur peut modérer (publication immédiate)
function create({ type = "post", contentId, parentId = null, user = null, name = "", email = "", body, ip = "", userAgent = "", honeypot = "", trusted = false, bypassClosed = false }) {
  const def = CONTENT[type];
  if (!def) throw new UserError("Ce contenu n'accepte pas de commentaires.");
  const content = def.row(contentId);
  if (!content || !def.published(content)) throw new UserError("Contenu introuvable.");
  if (!bypassClosed && !def.open(content)) throw new UserError("Les commentaires sont fermés sur ce contenu.");
  const cfg = settingsOf(type, contentId);
  if (!bypassClosed && closedByAge(content, cfg)) throw new UserError(`Les commentaires sont fermés : cette publication date de plus de ${cfg.close_days} jours.`);
  if (!user && !cfg.guests_allowed) throw new UserError("Connectez-vous pour commenter.");
  const text = clean(body);
  if (text.length < 2) throw new UserError("Votre commentaire est vide.");
  if (text.length > COMMENT_MAX) throw new UserError(`Votre commentaire dépasse ${COMMENT_MAX} caractères.`);
  let authorName = "", authorEmail = "";
  if (!user) {
    authorName = clean(name).replace(/\s+/g, " ").slice(0, 60);
    authorEmail = String(email || "").trim().toLowerCase().slice(0, 120);
    if (cfg.require_name_email) {
      if (authorName.length < 2) throw new UserError("Indiquez votre nom (2 caractères au moins).");
      if (!EMAIL_RE.test(authorEmail)) throw new UserError("Indiquez une adresse e-mail valide (elle ne sera jamais affichée).");
    } else {
      if (authorName && authorName.length < 2) throw new UserError("Votre nom doit compter 2 caractères au moins (ou laissez-le vide).");
      if (authorEmail && !EMAIL_RE.test(authorEmail)) throw new UserError("Cette adresse e-mail n'est pas valide (ou laissez le champ vide).");
    }
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
    : db.prepare("SELECT id, status FROM blog_comments WHERE content_type = ? AND content_id = ? AND user_id IS NULL AND author_email = ? AND author_name = ? AND body = ? AND status <> 'trash'").get(type, contentId, authorEmail, authorName, text);
  if (twin) return { id: twin.id, status: twin.status, duplicate: true };

  // Statut, par ordre de priorité (la règle la plus sévère gagne) : piège à robots ou liste de blocage → indésirable (jamais publié, restaurable) ; membre de confiance → publié ;
  // liste de modération, approbation manuelle, auteur sans commentaire approuvé, trop de liens → en attente. Un commentaire n'est JAMAIS supprimé automatiquement.
  let status = "approved", reason = "";
  const sample = { body: text, name: authorName || (user ? user.username : ""), email: authorEmail || (user ? user.email : ""), userAgent, ip };
  if (honeypot) { status = "spam"; reason = String(honeypot).slice(0, 20); } // robot détecté (piège ou envoi trop rapide) : conservé comme indésirable, jamais publié
  else if (!trusted && matchList(cfg.block_keys, sample)) { status = "spam"; reason = "blocklist"; }
  else if (!trusted) {
    if (matchList(cfg.mod_keys, sample)) { status = "pending"; reason = "keywords"; }
    else if (cfg.moderation === "all") { status = "pending"; reason = "moderation"; }
    else if (cfg.moderation === "first") {
      // « A déjà un commentaire approuvé » : un membre = son compte ; un visiteur = même e-mail ET même nom (un e-mail seul ne prouve rien : n'importe qui peut l'écrire)
      const known = user ? db.prepare("SELECT 1 FROM blog_comments WHERE user_id = ? AND status = 'approved' LIMIT 1").get(user.id) : authorEmail ? db.prepare("SELECT 1 FROM blog_comments WHERE user_id IS NULL AND author_email = ? AND lower(author_name) = lower(?) AND status = 'approved' LIMIT 1").get(authorEmail, authorName) : null;
      if (!known) { status = "pending"; reason = "first"; }
    }
    if (status === "approved" && links > cfg.max_links) { status = "pending"; reason = "links"; }
  }
  const authorId = user ? user.id : null;
  const info = db.prepare(`INSERT INTO blog_comments (post_id, content_type, content_id, parent_id, user_id, author_name, author_email, ip_hash, body, status, approved_at, approved_by, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${status === "approved" ? "datetime('now')" : "NULL"}, ?, ?)`)
    .run(type === "post" ? contentId : null, type, contentId, parent ? parent.id : null, authorId, authorName, authorEmail, ipHash(ip), text, status, status === "approved" && trusted ? authorId : null, JSON.stringify(reason ? { reason } : {}));
  const id = Number(info.lastInsertRowid);
  if (Date.now() - purgedAt > 3600 * 1000) { purgedAt = Date.now(); purgeOldHashes(); }
  const payload = { commentId: id, contentType: type, contentId: Number(contentId), parentId: parent ? parent.id : null, status, userId: authorId, trusted: Boolean(trusted) };
  emit("comment.created", payload);
  emit(status === "pending" ? "comment.pending" : status === "spam" ? "comment.spam" : "comment.approved", payload);
  if (parent) emit("comment.replied", payload);
  return { id, status, duplicate: false };
}

// ---------- Lecture publique : discussion paginée par commentaires de premier niveau ----------
function nameOf(c) { return c.user_id ? c.username || "Membre supprimé" : c.author_name || "Anonyme"; }
function thread(type, contentId, { page = null } = {}) {
  const cfg = settingsOf(type, contentId);
  const total = db.prepare("SELECT COUNT(*) n FROM blog_comments WHERE content_type = ? AND content_id = ? AND status = 'approved'").get(type, contentId).n;
  const rootsTotal = db.prepare("SELECT COUNT(*) n FROM blog_comments WHERE content_type = ? AND content_id = ? AND status = 'approved' AND parent_id IS NULL").get(type, contentId).n;
  // Pagination par commentaires de PREMIER NIVEAU (leurs réponses suivent leur parent, sur la même page). Sans pagination : tous (1 000 au plus, jamais sans limite).
  const size = cfg.paginate ? cfg.per_page : 1000;
  const pages = cfg.paginate ? Math.max(1, Math.ceil(rootsTotal / size)) : 1;
  const asked = Math.floor(Number(page));
  const current = Number.isFinite(asked) && asked >= 1 ? Math.min(asked, pages) : cfg.default_page === "last" ? pages : 1;
  const dir = cfg.order === "newest" ? "DESC" : "ASC";
  // Racines de la page, puis leurs réponses approuvées (un fil dont un maillon n'est pas approuvé s'arrête à ce maillon)
  const rows = db.prepare(`WITH RECURSIVE roots(id, pos) AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ${dir}, id ${dir}) FROM (SELECT id, created_at FROM blog_comments WHERE content_type = ? AND content_id = ? AND status = 'approved' AND parent_id IS NULL ORDER BY created_at ${dir}, id ${dir} LIMIT ? OFFSET ?)
    ), tree(id, level, pos) AS (
      SELECT id, 1, pos FROM roots
      UNION ALL SELECT c.id, t.level + 1, t.pos FROM blog_comments c JOIN tree t ON c.parent_id = t.id WHERE c.status = 'approved' AND t.level < 20
    )
    SELECT c.id, c.parent_id, c.body, c.created_at, c.user_id, c.author_name, c.author_email, u.username, u.email AS user_email, u.avatar_path, u.role, t.level, t.pos
    FROM tree t JOIN blog_comments c ON c.id = t.id LEFT JOIN users u ON u.id = c.user_id ORDER BY t.pos, t.level, c.created_at, c.id`)
    .all(type, contentId, size, (current - 1) * size);
  const byId = new Map(rows.map((r) => [r.id, { ...r, name: nameOf(r), children: [] }]));
  const roots = [];
  for (const r of byId.values()) { const parent = byId.get(r.parent_id); if (parent) parent.children.push(r); else roots.push(r); }
  // L'e-mail ne quitte jamais le serveur : il sert seulement à l'empreinte de l'avatar (voir services/avatars)
  const avatars = require("./avatars");
  for (const r of byId.values()) { r.avatar = avatars.forComment(r, cfg); delete r.author_email; delete r.user_email; }
  return { roots, total, page: current, pages, rootsTotal, paginate: cfg.paginate, order: cfg.order, maxDepth: cfg.max_depth, repliesAllowed: cfg.replies_allowed, showAvatars: cfg.show_avatars };
}
const count = (type, contentId) => db.prepare("SELECT COUNT(*) n FROM blog_comments WHERE content_type = ? AND content_id = ? AND status = 'approved'").get(type, contentId).n;
const get = (id) => db.prepare("SELECT * FROM blog_comments WHERE id = ?").get(id);

// ---------- Modération ----------
// Chaque action ne compte que les commentaires réellement modifiés (jamais de succès annoncé sans changement)
const ACTIONS = {
  approve: { from: ["pending", "spam", "trash"], event: "comment.approved" },
  unapprove: { from: ["approved"], event: "comment.unapproved" }, // « Désapprouver » : retour en attente de modération (contenu, auteur et fil conservés)
  spam: { from: ["pending", "approved", "trash"], event: "comment.spam" },
  trash: { from: ["pending", "approved", "spam"], event: "comment.deleted" },
  restore: { from: ["spam", "trash"], event: "comment.restored" },
  delete: { from: ["trash"], event: null },
};
function moderate(ids, action, actorId = null, allow = null) {
  const spec = ACTIONS[action];
  if (!spec) throw new UserError("Action inconnue.");
  const done = [], skipped = [];
  for (const id of uniqueIds(ids)) {
    const c = get(id);
    if (!c || (allow && !allow(id))) { skipped.push({ id, why: "introuvable" }); continue; } // allow : portée de site (R6 lot 2) — hors portée = même réponse qu'un commentaire inconnu
    if (!spec.from.includes(c.status)) { skipped.push({ id, why: `déjà ${STATUS_LABELS[c.status].toLowerCase()}` }); continue; }
    const payload = { commentId: c.id, contentType: c.content_type, contentId: c.content_id, parentId: c.parent_id, userId: c.user_id, actorId, from: c.status };
    if (action === "delete") { db.prepare("DELETE FROM blog_comments WHERE id = ?").run(c.id); emit("comment.purged", payload); done.push(id); continue; }
    if (action === "approve") db.prepare("UPDATE blog_comments SET status = 'approved', prev_status = '', deleted_at = NULL, approved_at = datetime('now'), approved_by = ?, updated_at = datetime('now') WHERE id = ?").run(actorId, c.id);
    else if (action === "unapprove") db.prepare("UPDATE blog_comments SET status = 'pending', prev_status = '', approved_at = NULL, approved_by = NULL, updated_at = datetime('now') WHERE id = ?").run(c.id);
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
// Droit à l'effacement (palier 23) : supprime DÉFINITIVEMENT tous les commentaires d'invité écrits avec cette adresse e-mail (le texte peut contenir des données
// personnelles, donc on supprime au lieu de masquer ; les réponses remontent d'un niveau). Les commentaires de membres connectés ne sont pas concernés
// (ils partent avec la suppression du compte). Retourne le nombre supprimé ; l'adresse n'est jamais renvoyée ni journalisée en clair.
function purgeGuest(email) {
  const address = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254) throw new UserError("Saisissez une adresse e-mail valide.");
  const rows = db.prepare("SELECT id, content_type, content_id FROM blog_comments WHERE user_id IS NULL AND lower(author_email) = ?").all(address);
  for (const r of rows) { db.prepare("DELETE FROM blog_comments WHERE id = ?").run(r.id); emit("comment.purged", { commentId: r.id, contentType: r.content_type, contentId: Number(r.content_id) }); }
  return rows.length;
}


// ---------- Modification (modération) ----------
// Champs modifiables : texte ; nom et e-mail d'un INVITÉ seulement (ceux d'un membre viennent de son compte) ; statut parmi en attente / approuvé / indésirable.
// Rien n'est écrit si rien ne change ; la corbeille passe par son action dédiée (réversible), jamais par ce formulaire.
function edit(id, fields = {}, { actorId = null, canEmail = false } = {}) {
  const c = get(id);
  if (!c) throw new UserError("Commentaire introuvable.");
  if (c.status === "trash") throw new UserError("Restaurez ce commentaire avant de le modifier.");
  const next = {}, changed = [];
  if (fields.body !== undefined) {
    const text = clean(fields.body);
    if (text.length < 2) throw new UserError("Le commentaire est vide.");
    if (text.length > COMMENT_MAX) throw new UserError(`Le commentaire dépasse ${COMMENT_MAX} caractères.`);
    if (text !== c.body) { next.body = text; changed.push("texte"); }
  }
  if (!c.user_id) {
    if (fields.author_name !== undefined) {
      const name = clean(fields.author_name).replace(/\s+/g, " ").slice(0, 60);
      if (name.length < 2) throw new UserError("Indiquez le nom de l'auteur (2 caractères au moins).");
      if (name !== c.author_name) { next.author_name = name; changed.push("nom"); }
    }
    if (canEmail && fields.author_email !== undefined) {
      const mail = String(fields.author_email || "").trim().toLowerCase().slice(0, 120);
      if (!EMAIL_RE.test(mail)) throw new UserError("Indiquez une adresse e-mail valide.");
      if (mail !== c.author_email) { next.author_email = mail; changed.push("e-mail"); }
    }
  }
  let statusChange = null;
  if (fields.status !== undefined && fields.status !== "" && fields.status !== c.status) {
    if (!["pending", "approved", "spam"].includes(fields.status)) throw new UserError("Statut inconnu.");
    statusChange = fields.status; changed.push("statut");
  }
  if (!changed.length) return { changed: [], unchanged: true };
  if (Object.keys(next).length) {
    db.prepare(`UPDATE blog_comments SET ${Object.keys(next).map((k) => `${k} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`).run(...Object.values(next), c.id);
  }
  if (statusChange) moderate([c.id], statusChange === "approved" ? "approve" : statusChange === "pending" ? "unapprove" : "spam", actorId);
  emit("comment.edited", { commentId: c.id, contentType: c.content_type, contentId: c.content_id, actorId, fields: changed });
  return { changed, unchanged: false };
}

// ---------- Liste d'administration : recherche, filtres, tri, pagination — tout dans la base ----------
const PERIODS = { "7": "-7 days", "30": "-30 days", "90": "-90 days", "365": "-365 days" };
const SORTS = {
  recent: "c.created_at DESC, c.id DESC", ancien: "c.created_at ASC, c.id ASC",
  auteur: "author COLLATE NOCASE ASC, c.id DESC", "auteur-desc": "author COLLATE NOCASE DESC, c.id DESC",
  contenu: "content_title COLLATE NOCASE ASC, c.id DESC", "contenu-desc": "content_title COLLATE NOCASE DESC, c.id DESC",
};
// Types de commentaires réellement présents : un commentaire de premier niveau, ou une réponse à un autre commentaire (il n'y a ni ping ni rétrolien)
const TYPES = Object.freeze({ commentaire: "Commentaires", reponse: "Réponses" });
// Recherche sans accent ni casse : le texte cherché et les colonnes sont ramenés à la même forme (SQLite ne plie que les lettres ASCII)
const FOLD_FROM = "àâäáãåçéèêëíìîïñóòôöõúùûüýÿÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸ", FOLD_TO = "aaaaaaceeeeiiiinooooouuuuyyaaaaaaceeeeiiiinooooouuuuyy";
const foldText = (v) => String(v || "").normalize("NFC").replace(/\s+/g, " ").trim().split("").map((ch) => { const i = FOLD_FROM.indexOf(ch); return i >= 0 ? FOLD_TO[i] : ch; }).join("").toLowerCase();
const foldSql = (col) => { let e = `COALESCE(${col}, '')`; for (let i = 0; i < FOLD_FROM.length; i += 1) e = `REPLACE(${e}, '${FOLD_FROM[i]}', '${FOLD_TO[i]}')`; return `LOWER(${e})`; };
const like = (s) => `%${String(s).replace(/[\\%_]/g, "\\$&")}%`;
function list({ status = "", q = "", content = "", author = "", period = "", sort = "recent", page = 1, perPage = PER_PAGE_ADMIN, includeEmail = false, scope = null, mine = null, type = "" } = {}) {
  const where = [], args = [];
  if (scope) { where.push(scope.sql); args.push(...scope.params); } // portée de site (R6 lot 2) : seulement les commentaires des articles de ce site
  if (STATUSES.includes(status)) { where.push("c.status = ?"); args.push(status); } else where.push("c.status <> 'trash'"); // « Tous » : tout sauf la corbeille
  const m = /^([a-z_]{1,20}):(\d{1,9})$/.exec(String(content));
  if (m) { where.push("c.content_type = ? AND c.content_id = ?"); args.push(m[1], Number(m[2])); }
  if (Number.isInteger(mine) && mine > 0) { where.push("c.user_id = ?"); args.push(mine); } // « Les miens » : écrits par le compte connecté
  if (type === "commentaire") where.push("c.parent_id IS NULL"); else if (type === "reponse") where.push("c.parent_id IS NOT NULL");
  if (/^\d{1,9}$/.test(String(author))) { where.push("c.user_id = ?"); args.push(Number(author)); }
  else if (author) { where.push("(u.username LIKE ? ESCAPE '\\' OR c.author_name LIKE ? ESCAPE '\\')"); args.push(like(author), like(author)); }
  if (PERIODS[period]) { where.push("c.created_at >= datetime('now', ?)"); args.push(PERIODS[period]); }
  const needle = foldText(q);
  if (needle) {
    const cols = ["c.body", "u.username", "c.author_name", "p.title"].concat(includeEmail ? ["c.author_email", "u.email"] : []);
    where.push(`(${cols.map((col) => `${foldSql(col)} LIKE ? ESCAPE '\\'`).join(" OR ")})`); args.push(...cols.map(() => like(needle)));
  }
  const from = `FROM blog_comments c LEFT JOIN users u ON u.id = c.user_id LEFT JOIN posts p ON c.content_type = 'post' AND p.id = c.content_id LEFT JOIN users ap ON ap.id = c.approved_by LEFT JOIN blog_comments pc ON pc.id = c.parent_id LEFT JOIN users pu ON pu.id = pc.user_id ${where.length ? "WHERE " + where.join(" AND ") : ""}`;
  const total = db.prepare(`SELECT COUNT(*) n ${from}`).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), pages);
  const rows = db.prepare(`SELECT c.id, c.content_type, c.content_id, c.parent_id, c.user_id, c.body, c.status, c.created_at, c.approved_at, c.approved_by, c.author_name, ${includeEmail ? "COALESCE(NULLIF(c.author_email, ''), u.email, '')" : "''"} AS email,
      COALESCE(u.username, NULLIF(c.author_name, ''), 'Anonyme') AS author, p.title AS content_title, p.slug AS content_slug, p.published AS content_published, c.updated_at, c.author_email AS guest_email, u.avatar_path, ap.username AS approver,
      COALESCE(pu.username, NULLIF(pc.author_name, ''), CASE WHEN pc.id IS NOT NULL THEN 'Anonyme' END) AS parent_author,
      (SELECT COUNT(*) FROM blog_comments k WHERE k.content_type = c.content_type AND k.content_id = c.content_id AND k.status = 'approved') AS thread_total,
      (SELECT COUNT(*) FROM blog_comments k WHERE k.content_type = c.content_type AND k.content_id = c.content_id AND k.status = 'pending') AS thread_pending
    ${from} ORDER BY ${SORTS[sort] || SORTS.recent} LIMIT ? OFFSET ?`).all(...args, perPage, (current - 1) * perPage);
  return { rows, total, page: current, pages };
}
// Effectifs par statut (onglets) : une seule requête groupée
function counts(content = "", scope = null, mine = null) {
  const m = /^([a-z_]{1,20}):(\d{1,9})$/.exec(String(content));
  const rows = scope ? db.prepare(`SELECT c.status, COUNT(*) n FROM blog_comments c WHERE ${m ? "c.content_type = ? AND c.content_id = ? AND " : ""}${scope.sql} GROUP BY c.status`).all(...(m ? [m[1], Number(m[2])] : []), ...scope.params) : m ? db.prepare("SELECT status, COUNT(*) n FROM blog_comments WHERE content_type = ? AND content_id = ? GROUP BY status").all(m[1], Number(m[2])) : db.prepare("SELECT status, COUNT(*) n FROM blog_comments GROUP BY status").all();
  const out = { pending: 0, approved: 0, spam: 0, trash: 0 };
  for (const r of rows) out[r.status] = r.n;
  out.all = out.pending + out.approved + out.spam;
  // « Les miens » : mes commentaires hors corbeille, dans la même portée de site et le même filtre de contenu que les autres effectifs
  out.mine = 0;
  if (Number.isInteger(mine) && mine > 0) {
    const w = ["c.user_id = ?", "c.status <> 'trash'"], a = [mine];
    if (m) { w.push("c.content_type = ? AND c.content_id = ?"); a.push(m[1], Number(m[2])); }
    if (scope) { w.push(scope.sql); a.push(...scope.params); }
    out.mine = db.prepare(`SELECT COUNT(*) n FROM blog_comments c WHERE ${w.join(" AND ")}`).get(...a).n;
  }
  return out;
}
// Éléments pour le filtre « contenu » : articles qui ont des commentaires
function commentedContents(limit = 100, scope = null) {
  return db.prepare(`SELECT 'post:' || p.id AS value, p.title AS label FROM posts p WHERE EXISTS (SELECT 1 FROM blog_comments c WHERE c.content_type = 'post' AND c.content_id = p.id)${scope ? " AND " + scope.sql : ""} ORDER BY p.title COLLATE NOCASE LIMIT ?`).all(...(scope ? scope.params : []), limit);
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
  CONTENT, TYPES, registerContent, events, edit, foldText, settings, settingsFor, settingsOf, siteOwn, siteIdOf, normalizeSettings, normalizeList, matchList, closedByAge, AVATAR_DEFAULTS, AVATAR_EXTERNAL, LIST_MAX_LINES, saveSettings, resetCache,
  clean, html, linksIn, ipHash, levelOf, create, thread, count, get, moderate, reply, purge, purgeGuest, list, counts, commentedContents, contentInfo, countsForPosts, uniqueIds,
};
