// Centre de gestion — Activité et notifications : construites à partir des données réelles (aucun événement fabriqué).
// Chaque élément a une clé stable (« order:12 ») ; son lien est calculé par le serveur à partir de cette clé.
// Notifications = commandes, inscriptions gratuites, nouveaux comptes élèves, messages, avis, commentaires ;
// état « lu » par formateur (activity_reads), « tout marquer comme lu » (activity_state.read_all_before).
// Par défaut, seules les 30 derniers jours comptent comme non lus (un historique ancien n'est pas une notification).
const db = require("../../config/database");
const { paginate, page } = require("./common");

const TYPES = { ventes: "Ventes", eleves: "Élèves", messages: "Messages", avis: "Avis et commentaires", contenu: "Contenu" };

// Toutes les sources, une ligne par événement : key, kind, type, at, title, detail, href, notif
const SOURCES = [
  ["Commandes", `
    SELECT 'order:' || o.id AS key, 'order' AS kind, 'ventes' AS type, o.created_at AS at,
      'Nouvelle commande #' || o.id AS title, u.username || ' · ' || GROUP_CONCAT(c.title, ', ') AS detail,
      '/formateur/gestion/ventes/commandes/' || o.id AS href, 1 AS notif, SUM(oi.price_cents) AS amount
    FROM orders o JOIN users u ON u.id = o.user_id JOIN order_items oi ON oi.order_id = o.id JOIN courses c ON c.id = oi.course_id
    WHERE c.instructor_id = :me GROUP BY o.id
    `],
  ["Inscriptions gratuites", `
    SELECT 'enroll:' || e.id AS key, 'enroll' AS kind, 'eleves' AS type, e.created_at AS at, 'Inscription gratuite' AS title, u.username || ' · ' || c.title AS detail,
      '/formateur/gestion/eleves/' || u.id AS href, 1 AS notif, NULL AS amount
    FROM enrollments e JOIN users u ON u.id = e.user_id JOIN courses c ON c.id = e.course_id
    WHERE c.instructor_id = :me AND NOT EXISTS (SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.user_id = e.user_id AND oi.course_id = e.course_id)
    `],
  ["Nouveaux comptes", `
    SELECT 'user:' || u.id AS key, 'user' AS kind, 'eleves' AS type, u.created_at AS at, 'Nouveau compte élève' AS title, u.username AS detail,
      CASE WHEN EXISTS (SELECT 1 FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = u.id AND c.instructor_id = :me) THEN '/formateur/gestion/eleves/' || u.id END AS href, 1 AS notif, NULL AS amount
    FROM users u WHERE u.role = 'etudiant'
    `],
  ["Messages", `
    SELECT 'message:' || m.id AS key, 'message' AS kind, 'messages' AS type, m.created_at AS at, 'Nouveau message : ' || CASE WHEN m.subject <> '' THEN m.subject ELSE 'sans objet' END AS title, m.name AS detail,
      '/formateur/messages?id=' || m.id AS href, 1 AS notif, NULL AS amount
    FROM contact_messages m
    `],
  ["Avis", `
    SELECT 'review:' || r.id AS key, 'review' AS kind, 'avis' AS type, r.created_at AS at, 'Nouvel avis ' || r.rating || '/5' AS title, u.username || ' · ' || c.title AS detail,
      '/cours/' || c.slug || '#avis' AS href, 1 AS notif, NULL AS amount
    FROM reviews r JOIN users u ON u.id = r.user_id JOIN courses c ON c.id = r.course_id WHERE c.instructor_id = :me
    `],
  ["Commentaires", `
    SELECT 'comment:' || bc.id AS key, 'comment' AS kind, 'avis' AS type, bc.created_at AS at, CASE WHEN bc.status = 'pending' THEN 'Commentaire à modérer' ELSE 'Nouveau commentaire' END AS title, COALESCE(u.username, NULLIF(bc.author_name, ''), 'Anonyme') || ' · ' || p.title AS detail,
      CASE WHEN bc.status = 'pending' THEN '/marketing/site-web/commentaires/en-attente' ELSE '/blog/' || p.slug || '#commentaires' END AS href, 1 AS notif, NULL AS amount
    FROM blog_comments bc LEFT JOIN users u ON u.id = bc.user_id JOIN posts p ON p.id = bc.post_id WHERE bc.status IN ('pending', 'approved')
    `],
  ["Articles", `
    SELECT 'post:' || p.id AS key, 'post' AS kind, 'contenu' AS type, p.published_at AS at, 'Article publié' AS title, p.title AS detail, '/blog/' || p.slug AS href, 0 AS notif, NULL AS amount
    FROM posts p WHERE p.published = 1 AND p.published_at IS NOT NULL
    `],
  ["Formations", `
    SELECT 'course:' || c.id || ':' || c.updated_at AS key, 'course' AS kind, 'contenu' AS type, c.updated_at AS at, CASE WHEN c.updated_at = c.created_at THEN 'Formation créée' ELSE 'Formation modifiée' END AS title, c.title AS detail,
      '/formateur/cours/' || c.id AS href, 0 AS notif, NULL AS amount
    FROM courses c WHERE c.instructor_id = :me`],
];
// Seules les sources lisibles sont réunies : une source en échec (table ou colonne absente sur une base ancienne) est
// écartée et signalée, au lieu de rendre toute l'activité indisponible (vérifié à chaque appel : moins d'une milliseconde).
function sources() {
  const ok = [], failed = [];
  for (const src of SOURCES) {
    try { db.prepare(`SELECT * FROM (${src[1]}) LIMIT 0`); ok.push(src); } catch (error) {
      console.error(`[KOLAKISA] Centre de gestion · Activité (${src[0]}) :`, error.message);
      failed.push({ label: src[0], message: error.message });
    }
  }
  return { ok, failed };
}
function sourceSql() {
  const { ok } = sources();
  if (!ok.length) throw new Error("aucune source d'activité lisible");
  return ok.map((x) => x[1]).join("\n    UNION ALL");
}

function readAllBefore(userId) {
  const r = db.prepare("SELECT read_all_before FROM activity_state WHERE user_id = ?").get(userId);
  return r && r.read_all_before ? r.read_all_before : db.prepare("SELECT datetime('now', '-30 days') t").get().t;
}
// Condition « non lu » (paramètres :me, :since)
const UNREAD = "notif = 1 AND at > :since AND key NOT IN (SELECT item_key FROM activity_reads WHERE user_id = :me)";
// node:sqlite refuse les paramètres nommés inutilisés : seuls ceux présents dans la requête sont transmis
const only = (sql, params) => Object.fromEntries(Object.entries(params).filter(([k]) => new RegExp(`:${k}\\b`).test(sql)));
const run = (sql, params, method = "get") => db.prepare(sql)[method](only(sql, params));

function feed(userId, query = {}) {
  const type = TYPES[query.type] ? query.type : "";
  const onlyNotif = query.vue === "notifications";
  const since = readAllBefore(userId);
  const where = ["at IS NOT NULL"];
  if (type) where.push("type = :type");
  if (onlyNotif) where.push("notif = 1");
  if (query.etat === "non-lu") where.push(UNREAD);
  const params = { me: userId, since, ...(type ? { type } : {}) };
  const base = `FROM (${sourceSql()}) WHERE ${where.join(" AND ")}`;
  const total = run(`SELECT COUNT(*) n ${base}`, params).n;
  const pg = paginate(total, page(query), 25);
  const rows = run(`SELECT *, CASE WHEN ${UNREAD} THEN 1 ELSE 0 END AS unread ${base} ORDER BY at DESC, key DESC LIMIT :lim OFFSET :off`, { ...params, lim: pg.limit, off: pg.offset }, "all");
  return { rows, ...pg, type, view: onlyNotif ? "notifications" : "activite", unreadOnly: query.etat === "non-lu", problems: sources().failed };
}

function unreadCount(userId) {
  return run(`SELECT COUNT(*) n FROM (${sourceSql()}) WHERE ${UNREAD}`, { me: userId, since: readAllBefore(userId) }).n;
}

// Élément existant et visible par ce formateur (sinon null) — sert à ouvrir / marquer comme lu en toute sécurité
function item(userId, key) {
  if (!/^[a-z]+:[0-9]+(:[0-9: -]+)?$/.test(String(key || ""))) return null;
  return run(`SELECT * FROM (${sourceSql()}) WHERE key = :key`, { me: userId, key }) || null;
}
function markRead(userId, key) {
  const it = item(userId, key);
  if (!it) return null;
  db.prepare("INSERT OR IGNORE INTO activity_reads (user_id, item_key) VALUES (?, ?)").run(userId, key);
  return it;
}
function markAllRead(userId) {
  db.prepare("INSERT INTO activity_state (user_id, read_all_before) VALUES (?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET read_all_before = excluded.read_all_before").run(userId);
  db.prepare("DELETE FROM activity_reads WHERE user_id = ?").run(userId); // déjà couverts par la date
}

// Alertes calculées (état actuel) : messages non lus, fichiers introuvables, codes promo bientôt expirés, formations
// publiées sans leçon
function alerts(userId) {
  const out = [];
  const unreadMsg = db.prepare("SELECT COUNT(*) n FROM contact_messages WHERE read_at IS NULL").get().n;
  if (unreadMsg) out.push({ level: "info", title: `${unreadMsg} message(s) non lu(s)`, href: "/formateur/messages" });
  try {
    const { auditMedia } = require("../../config/mediaAudit");
    const a = auditMedia(db);
    if (a.missing.length) out.push({ level: "error", title: `${a.missing.length} référence(s) à des fichiers absents du serveur`, detail: a.missing.slice(0, 3).map((m) => m.where).join(" · "), href: "/formateur/gestion/ressources?etat=a-traiter" });
  } catch (error) { console.error("[KOLAKISA] Alertes : contrôle des fichiers indisponible :", error.message); } // aucune alerte inventée
  try {
    const b = require("./health").backupStatus(require("../backups").list(), { auto: process.env.SAUVEGARDE_AUTO !== "0" });
    if (b.level !== "ok") out.push({ level: b.level, title: b.title, detail: b.detail, href: b.href });
  } catch (error) { console.error("[KOLAKISA] Alertes : état des sauvegardes indisponible :", error.message); } // aucune alerte inventée
  const soon = db.prepare("SELECT code, expires_at FROM coupons WHERE instructor_id = ? AND active = 1 AND expires_at IS NOT NULL AND expires_at > datetime('now') AND expires_at <= datetime('now', '+7 days')").all(userId);
  for (const c of soon) out.push({ level: "warning", title: `Le code promo ${c.code} expire bientôt`, href: "/formateur/gestion/ventes/coupons" });
  const empty = db.prepare("SELECT c.id, c.title FROM courses c WHERE c.instructor_id = ? AND c.published = 1 AND NOT EXISTS (SELECT 1 FROM lessons l JOIN sections s ON s.id = l.section_id WHERE s.course_id = c.id)").all(userId);
  for (const c of empty) out.push({ level: "warning", title: `Formation publiée sans leçon : « ${c.title} »`, href: `/formateur/cours/${c.id}/curriculum` });
  return out;
}

module.exports = { feed, unreadCount, item, markRead, markAllRead, alerts, TYPES };
