// Centre de gestion — Activité et notifications : construites à partir des données réelles (aucun événement fabriqué).
// Chaque élément a une clé stable (« order:12 ») ; son lien est calculé par le serveur à partir de cette clé.
// Notifications = commandes, inscriptions gratuites, nouveaux comptes élèves, messages, avis, commentaires ;
// état « lu » par formateur (activity_reads), « tout marquer comme lu » (activity_state.read_all_before).
// Par défaut, seules les 30 derniers jours comptent comme non lus (un historique ancien n'est pas une notification).
const db = require("../../config/database");
const { paginate, page } = require("./common");

const TYPES = { ventes: "Ventes", eleves: "Élèves", messages: "Messages", avis: "Avis et commentaires", contenu: "Contenu" };

// Toutes les sources, une ligne par événement : key, kind, type, at, title, detail, href, notif
function sourceSql() {
  return `
    SELECT 'order:' || o.id AS key, 'order' AS kind, 'ventes' AS type, o.created_at AS at,
      'Nouvelle commande #' || o.id AS title, u.username || ' · ' || GROUP_CONCAT(c.title, ', ') AS detail,
      '/formateur/gestion/ventes/commandes/' || o.id AS href, 1 AS notif, SUM(oi.price_cents) AS amount
    FROM orders o JOIN users u ON u.id = o.user_id JOIN order_items oi ON oi.order_id = o.id JOIN courses c ON c.id = oi.course_id
    WHERE c.instructor_id = :me GROUP BY o.id
    UNION ALL
    SELECT 'enroll:' || e.id, 'enroll', 'eleves', e.created_at, 'Inscription gratuite', u.username || ' · ' || c.title,
      '/formateur/gestion/eleves/' || u.id, 1, NULL
    FROM enrollments e JOIN users u ON u.id = e.user_id JOIN courses c ON c.id = e.course_id
    WHERE c.instructor_id = :me AND NOT EXISTS (SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.user_id = e.user_id AND oi.course_id = e.course_id)
    UNION ALL
    SELECT 'user:' || u.id, 'user', 'eleves', u.created_at, 'Nouveau compte élève', u.username,
      CASE WHEN EXISTS (SELECT 1 FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = u.id AND c.instructor_id = :me) THEN '/formateur/gestion/eleves/' || u.id END, 1, NULL
    FROM users u WHERE u.role = 'etudiant'
    UNION ALL
    SELECT 'message:' || m.id, 'message', 'messages', m.created_at, 'Nouveau message : ' || CASE WHEN m.subject <> '' THEN m.subject ELSE 'sans objet' END, m.name,
      '/formateur/messages#message-' || m.id, 1, NULL
    FROM contact_messages m
    UNION ALL
    SELECT 'review:' || r.id, 'review', 'avis', r.created_at, 'Nouvel avis ' || r.rating || '/5', u.username || ' · ' || c.title,
      '/cours/' || c.slug || '#avis', 1, NULL
    FROM reviews r JOIN users u ON u.id = r.user_id JOIN courses c ON c.id = r.course_id WHERE c.instructor_id = :me
    UNION ALL
    SELECT 'comment:' || bc.id, 'comment', 'avis', bc.created_at, 'Nouveau commentaire', u.username || ' · ' || p.title,
      '/blog/' || p.slug || '#commentaires', 1, NULL
    FROM blog_comments bc JOIN users u ON u.id = bc.user_id JOIN posts p ON p.id = bc.post_id
    UNION ALL
    SELECT 'post:' || p.id, 'post', 'contenu', p.published_at, 'Article publié', p.title, '/blog/' || p.slug, 0, NULL
    FROM posts p WHERE p.published = 1 AND p.published_at IS NOT NULL
    UNION ALL
    SELECT 'course:' || c.id || ':' || c.updated_at, 'course', 'contenu', c.updated_at, CASE WHEN c.updated_at = c.created_at THEN 'Formation créée' ELSE 'Formation modifiée' END, c.title,
      '/formateur/cours/' || c.id, 0, NULL
    FROM courses c WHERE c.instructor_id = :me`;
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
  return { rows, ...pg, type, view: onlyNotif ? "notifications" : "activite", unreadOnly: query.etat === "non-lu" };
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
    if (a.missing.length) out.push({ level: "error", title: `${a.missing.length} fichier(s) introuvable(s) sur le serveur`, detail: a.missing.slice(0, 3).map((m) => m.where).join(" · "), href: "/formateur/gestion/ressources?source=&type=" });
  } catch { /* audit indisponible : aucune alerte inventée */ }
  const soon = db.prepare("SELECT code, expires_at FROM coupons WHERE instructor_id = ? AND active = 1 AND expires_at IS NOT NULL AND expires_at > datetime('now') AND expires_at <= datetime('now', '+7 days')").all(userId);
  for (const c of soon) out.push({ level: "warning", title: `Le code promo ${c.code} expire bientôt`, href: "/formateur/gestion/ventes/coupons" });
  const empty = db.prepare("SELECT c.id, c.title FROM courses c WHERE c.instructor_id = ? AND c.published = 1 AND NOT EXISTS (SELECT 1 FROM lessons l JOIN sections s ON s.id = l.section_id WHERE s.course_id = c.id)").all(userId);
  for (const c of empty) out.push({ level: "warning", title: `Formation publiée sans leçon : « ${c.title} »`, href: `/formateur/cours/${c.id}/curriculum` });
  return out;
}

module.exports = { feed, unreadCount, item, markRead, markAllRead, alerts, TYPES };
