// Catalogue des formations du LMS, en LECTURE SEULE, pour le bloc « formation » des e-mails. Comme le pont d'événements,
// c'est le seul endroit (avec bridge/) où le module marketing lit les tables du LMS. Un LMS absent ou incomplet donne une liste vide.
const { checkCtx } = require("../audience/shared");

// Formations publiées proposées dans l'éditeur (identifiant et titre seulement)
function listCourses(ctx) {
  checkCtx(ctx);
  try {
    return ctx.db.prepare("SELECT id, title FROM courses WHERE published = 1 ORDER BY title COLLATE NOCASE LIMIT 300").all().map((c) => ({ id: c.id, title: c.title }));
  } catch {
    return [];
  }
}

// Une formation publiée, avec de quoi construire l'instantané (titre, sous-titre, prix, adresse de la page et de l'image)
function getCourse(ctx, id) {
  checkCtx(ctx);
  if (!Number.isInteger(id) || id < 1) return null;
  try {
    return ctx.db.prepare("SELECT id, title, slug, subtitle, price_cents, thumbnail_path FROM courses WHERE id = ? AND published = 1").get(id) ?? null;
  } catch {
    return null;
  }
}

// Formations publiées pour un élément « Formations du catalogue » (les plus récentes, par titre ou par prix)
function listCourseCards(ctx, { limit = 3, category = "", sort = "recent" } = {}) {
  checkCtx(ctx);
  const order = { recent: "created_at DESC, id DESC", title: "title COLLATE NOCASE", price: "price_cents ASC, title COLLATE NOCASE" }[sort] || "created_at DESC, id DESC";
  try {
    return ctx.db.prepare(`SELECT id, title, slug, subtitle, price_cents, thumbnail_path FROM courses WHERE published = 1${category ? " AND category = ? COLLATE NOCASE" : ""} ORDER BY ${order} LIMIT ?`)
      .all(...(category ? [category] : []), Math.min(Math.max(limit, 1), 12));
  } catch {
    return [];
  }
}
function countPublished(ctx, what) {
  checkCtx(ctx);
  try {
    if (what === "courses") return ctx.db.prepare("SELECT COUNT(*) n FROM courses WHERE published = 1").get().n;
    if (what === "posts") return ctx.db.prepare("SELECT COUNT(*) n FROM posts WHERE published_at IS NOT NULL AND published_at <= datetime('now') AND (published = 1 OR status = 'scheduled')").get().n;
  } catch { /* table absente */ }
  return 0;
}

// Articles du blog visibles par le public (publiés, ou programmés dont l'heure est passée), du plus récent au plus ancien.
// → [{ key: "post:12", title, url, excerpt, image, date (ms) }] ; un LMS sans blog donne une liste vide.
const SQL_DATE = (v) => { const t = Date.parse(`${String(v).replace(" ", "T")}Z`); return Number.isFinite(t) ? t : null; };
function listPosts(ctx, { since = null, limit = 20, category = "" } = {}) {
  checkCtx(ctx);
  const base = String(ctx.baseUrl || "").replace(/\/+$/, "");
  const now = new Date(typeof ctx.now === "function" ? ctx.now() : Date.now()).toISOString().slice(0, 19).replace("T", " ");
  const where = ["published_at IS NOT NULL", "published_at <= ?", "(published = 1 OR status = 'scheduled')"];
  const args = [now];
  if (since) { where.push("published_at > ?"); args.push(new Date(since).toISOString().slice(0, 19).replace("T", " ")); }
  if (category) { where.push("category = ?"); args.push(category); }
  try {
    return ctx.db.prepare(`SELECT id, slug, title, excerpt, cover_path, published_at FROM posts WHERE ${where.join(" AND ")} ORDER BY published_at DESC, id DESC LIMIT ?`).all(...args, Math.min(Math.max(limit, 1), 50))
      .map((p) => ({
        key: `post:${p.id}`, title: p.title, url: `${base}/blog/${encodeURIComponent(p.slug)}`,
        excerpt: String(p.excerpt || "").replace(/\s+/g, " ").trim().slice(0, 300),
        image: p.cover_path ? (/^https?:\/\//i.test(p.cover_path) ? p.cover_path : `${base}${p.cover_path.startsWith("/") ? "" : "/"}${p.cover_path}`) : "",
        date: SQL_DATE(p.published_at),
      }));
  } catch {
    return [];
  }
}
// Catégories du blog réellement utilisées (filtre d'une campagne RSS)
function blogCategories(ctx) {
  checkCtx(ctx);
  try { return ctx.db.prepare("SELECT category, COUNT(*) n FROM posts WHERE published = 1 GROUP BY category ORDER BY category COLLATE NOCASE").all(); } catch { return []; }
}

// Formation publiée par son adresse (/cours/<adresse>) : fiches formation consultées (suivi des visiteurs)
function getCourseBySlug(ctx, slug) {
  checkCtx(ctx);
  if (typeof slug !== "string" || !/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  try {
    return ctx.db.prepare("SELECT id, title, slug FROM courses WHERE slug = ? AND published = 1").get(slug) ?? null;
  } catch {
    return null;
  }
}

// Ventes réelles d'une formation à un groupe de comptes (contacts d'un tunnel) depuis une date : inscriptions,
// acheteurs et montant payé (prix de la ligne de commande, après la remise appliquée à la commande au prorata)
function courseConversions(ctx, { courseId, userIds, since }) {
  checkCtx(ctx);
  const ids = [...new Set((userIds || []).filter((n) => Number.isInteger(n)))];
  const empty = { enrolled: 0, buyers: 0, revenueCents: 0 };
  if (!ids.length || !Number.isInteger(courseId)) return empty;
  const sinceSql = new Date(since).toISOString().replace("T", " ").slice(0, 19);
  const marks = ids.map(() => "?").join(",");
  try {
    const enrolled = ctx.db.prepare(`SELECT COUNT(*) n FROM enrollments WHERE course_id = ? AND created_at >= ? AND user_id IN (${marks})`).get(courseId, sinceSql, ...ids).n;
    const sales = ctx.db.prepare(`SELECT COUNT(DISTINCT o.user_id) buyers, COALESCE(SUM(i.price_cents), 0) gross,
        COALESCE(SUM(CASE WHEN o.discount_cents > 0 AND sub.total > 0 THEN i.price_cents * o.discount_cents * 1.0 / sub.total ELSE 0 END), 0) discount
      FROM order_items i JOIN orders o ON o.id = i.order_id
      JOIN (SELECT order_id, SUM(price_cents) total FROM order_items GROUP BY order_id) sub ON sub.order_id = o.id
      WHERE i.course_id = ? AND o.created_at >= ? AND o.user_id IN (${marks})`).get(courseId, sinceSql, ...ids);
    return { enrolled, buyers: sales.buyers, revenueCents: Math.max(0, Math.round(sales.gross - sales.discount)) };
  } catch {
    return empty;
  }
}

// Le compte a-t-il déjà passé une commande ? (personnalisation des pages : « clients »)
function userHasOrder(ctx, userId) {
  checkCtx(ctx);
  if (!Number.isInteger(userId)) return false;
  try {
    return Boolean(ctx.db.prepare("SELECT 1 FROM orders WHERE user_id = ? LIMIT 1").get(userId));
  } catch {
    return false;
  }
}

module.exports = { listCourseCards, countPublished, listCourses, getCourse, getCourseBySlug, courseConversions, userHasOrder, listPosts, blogCategories };
