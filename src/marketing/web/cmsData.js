// Données LUES (jamais écrites) par les écrans de KOLAKISA CMS : articles, commentaires, médias, utilisateurs,
// redirections, journal. Chaque lecture s'appuie sur les tables et services qui existent déjà ; si une table manque
// (base ancienne), l'écran affiche un état vide au lieu de planter. Aucune valeur n'est inventée.
const backups = require("../../services/backups");
const orgs = require("../organizations");

const safe = (fn, fallback) => {
  try { return fn(); } catch (e) { if (/no such (table|column)/i.test(e.message)) return fallback; throw e; }
};
const like = (q) => `%${String(q || "").slice(0, 80).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

// ---------- Articles (table posts du blog existant) ----------
const POST_STATES = {
  brouillons: ["draft", "review"],
  programmes: ["scheduled"],
  publies: ["published"],
};
const POST_STATUS = { draft: ["Brouillon", "mk-status-off"], review: ["À relire", "mk-status-warn"], scheduled: ["Programmé", "mk-status-info"], published: ["Publié", "mk-status-ok"], archived: ["Archivé", "mk-status-off"] };

function postCounts(db) {
  return safe(() => {
    const by = Object.fromEntries(db.prepare("SELECT status, COUNT(*) n FROM posts GROUP BY status").all().map((r) => [r.status, r.n]));
    const n = (...k) => k.reduce((s, x) => s + (by[x] || 0), 0);
    return { all: n(...Object.keys(by)), brouillons: n("draft", "review"), programmes: n("scheduled"), publies: n("published") };
  }, { all: 0, brouillons: 0, programmes: 0, publies: 0 });
}
function listPosts(db, { state, q, limit = 500 } = {}) {
  return safe(() => {
    const where = []; const args = [];
    if (state && POST_STATES[state]) { where.push(`p.status IN (${POST_STATES[state].map(() => "?").join(",")})`); args.push(...POST_STATES[state]); }
    if (q) { where.push("p.title LIKE ? ESCAPE '\\'"); args.push(like(q)); }
    return db.prepare(`SELECT p.id, p.slug, p.title, p.status, p.category, p.published_at, p.updated_at, u.username AS author
      FROM posts p LEFT JOIN users u ON u.id = p.author_id ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY p.updated_at DESC, p.id DESC LIMIT ?`).all(...args, limit);
  }, []);
}
function categories(db) {
  return safe(() => db.prepare("SELECT category AS name, COUNT(*) n FROM posts WHERE category <> '' GROUP BY category ORDER BY n DESC, category").all(), []);
}
function tags(db) {
  return safe(() => {
    const count = new Map();
    for (const r of db.prepare("SELECT tags FROM posts WHERE tags <> ''").all()) {
      for (const raw of String(r.tags).split(",")) { const t = raw.replace(/\s+/g, " ").trim(); if (t) count.set(t, (count.get(t) || 0) + 1); }
    }
    return [...count].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n || a.name.localeCompare(b.name, "fr"));
  }, []);
}
function authors(db) {
  return safe(() => db.prepare(`SELECT u.id, u.username, COUNT(p.id) n, SUM(p.status = 'published') published FROM users u JOIN posts p ON p.author_id = u.id GROUP BY u.id ORDER BY n DESC, u.username`).all(), []);
}

// ---------- Commentaires (blog_comments : membres connectés, publication immédiate) ----------
function listComments(db, { q, limit = 500 } = {}) {
  return safe(() => db.prepare(`SELECT c.id, c.body, c.created_at, u.username AS author, p.title AS post_title, p.slug AS post_slug
      FROM blog_comments c JOIN posts p ON p.id = c.post_id JOIN users u ON u.id = c.user_id
      ${q ? "WHERE c.body LIKE ? ESCAPE '\\' OR u.username LIKE ? ESCAPE '\\' OR p.title LIKE ? ESCAPE '\\'" : ""} ORDER BY c.id DESC LIMIT ?`).all(...(q ? [like(q), like(q), like(q)] : []), limit), []);
}
const commentCount = (db) => safe(() => db.prepare("SELECT COUNT(*) n FROM blog_comments").get().n, 0);

// ---------- Utilisateurs de l'équipe (mk_org_members) ----------
const ROLE_LABEL = { owner: "Propriétaire", admin: "Administrateur", editor: "Éditeur", viewer: "Lecteur" };
const ROLE_TEXT = {
  owner: "Tous les droits, y compris la gestion de l'équipe.",
  admin: "Réglages, clés d'API, domaines, envois et code HTML dans les pages.",
  editor: "Crée et modifie pages, formulaires, modèles, campagnes et contacts.",
  viewer: "Consulte tout, ne modifie rien.",
};
function listTeam(ctx, { q } = {}) {
  return safe(() => ctx.db.prepare(`SELECT u.id, u.username, u.email, m.role, m.created_at FROM mk_org_members m JOIN users u ON u.id = m.user_id
      WHERE m.organization_id = ? ${q ? "AND (u.username LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')" : ""} ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'editor' THEN 2 ELSE 3 END, u.username`)
    .all(ctx.organizationId, ...(q ? [like(q), like(q)] : [])), []);
}
const roleMatrix = () => {
  const roles = Object.keys(orgs.ROLE_ORDER).sort((a, b) => orgs.ROLE_ORDER[a] - orgs.ROLE_ORDER[b]);
  return { roles, permissions: Object.entries(orgs.PERMISSIONS).map(([key, min]) => ({ key, min, byRole: Object.fromEntries(roles.map((r) => [r, orgs.can(r, key)])) })) };
};

// ---------- SEO / redirections (tables du moteur SEO existant) ----------
function listRedirects(db, { q } = {}) {
  return safe(() => db.prepare(`SELECT id, source_path, target, status, enabled, hits, last_hit_at, created_at FROM seo_redirects
      ${q ? "WHERE source_path LIKE ? ESCAPE '\\' OR target LIKE ? ESCAPE '\\'" : ""} ORDER BY id DESC LIMIT 500`).all(...(q ? [like(q), like(q)] : [])), []);
}
const list404 = (db) => safe(() => db.prepare("SELECT path, hits_human, hits_bot, last_seen FROM seo_404 WHERE ignored = 0 ORDER BY hits_human DESC, last_seen DESC LIMIT 200").all(), []);
const seoCounts = (db) => ({
  redirects: safe(() => db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE enabled = 1").get().n, 0),
  errors404: safe(() => db.prepare("SELECT COUNT(*) n FROM seo_404 WHERE ignored = 0").get().n, 0),
});
// Métadonnées SEO des pages publiées (colonne seo + titre/description de la page) : ce que le moteur de pages sert réellement
function pagesSeo(ctx) {
  return safe(() => ctx.db.prepare("SELECT id, name, slug, title, description, seo, indexable, status FROM mk_landing_pages WHERE organization_id = ? AND archived_at IS NULL ORDER BY updated_at DESC LIMIT 500").all(ctx.organizationId)
    .map((p) => { let seo = {}; try { seo = JSON.parse(p.seo || "{}"); } catch { /* seo illisible : traité comme vide */ } return { ...p, seoParsed: seo }; }), []);
}

// ---------- Outils : journal d'audit et sauvegardes (lecture seule) ----------
const auditLog = (ctx, limit = 100) => safe(() => ctx.db.prepare(`SELECT l.id, l.action, l.resource_type, l.resource_id, l.created_at, u.username FROM mk_audit_logs l LEFT JOIN users u ON u.id = l.user_id
    WHERE l.organization_id = ? ORDER BY l.id DESC LIMIT ?`).all(ctx.organizationId, limit), []);
const listBackups = () => { try { return backups.list(); } catch { return []; } };

// ---------- Tableau de bord : aperçu réel ----------
function overview(ctx) {
  const db = ctx.db;
  const org = ctx.organizationId;
  return {
    drafts: safe(() => db.prepare("SELECT id, name, updated_at, status FROM mk_landing_pages WHERE organization_id = ? AND archived_at IS NULL AND (status = 'draft' OR draft IS NOT NULL) ORDER BY updated_at DESC LIMIT 5").all(org), []),
    recentPosts: listPosts(db, { limit: 5 }),
    postCounts: postCounts(db),
    recentComments: listComments(db, { limit: 4 }),
    commentCount: commentCount(db),
    activity: auditLog(ctx, 6),
    seo: seoCounts(db),
    archived: safe(() => db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE organization_id = ? AND archived_at IS NOT NULL").get(org).n, 0),
  };
}

module.exports = {
  POST_STATES, POST_STATUS, postCounts, listPosts, categories, tags, authors, listComments, commentCount,
  ROLE_LABEL, ROLE_TEXT, listTeam, roleMatrix, listRedirects, list404, seoCounts, pagesSeo, auditLog, listBackups, overview,
};
