// Catalogue des formations du LMS, en LECTURE SEULE, pour le bloc « formation » des e-mails. Comme le pont d'événements,
// c'est le seul endroit (avec bridge/) où le module marketing lit les tables du LMS. Un LMS absent ou incomplet donne une liste vide.
const { checkCtx } = require("../audience/shared");
const { effectivePriceSql, nowParams } = require("../../services/pricingSql"); // partie pure : aucun accès à la base à l'import

// Portée de site (Titan XXIII) : une personne limitée à un site (ctx.siteScope, imposé par le serveur) ne voit que les formations de CE site ; l'équipe (sans portée) garde la vue d'ensemble historique.
// ctx.lmsSite (facultatif, ex. site de la page affichée) : null = formations du site principal, identifiant = celles de ce site ; absent = pas de filtre.
function scopeOf(ctx, alias = "courses") {
  const siteId = Number.isInteger(ctx.siteScope) ? ctx.siteScope : ctx.lmsSite !== undefined ? ctx.lmsSite : undefined;
  return siteId === undefined ? { sql: "1", params: [] } : require("../../services/lmsSites").scopeSql(siteId, alias);
}

// Formations publiées proposées dans l'éditeur (identifiant et titre seulement)
function listCourses(ctx) {
  checkCtx(ctx);
  try {
    const sc = scopeOf(ctx);
    return ctx.db.prepare(`SELECT id, title FROM courses WHERE published = 1 AND ${sc.sql} ORDER BY title COLLATE NOCASE LIMIT 300`).all(...sc.params).map((c) => ({ id: c.id, title: c.title }));
  } catch {
    return [];
  }
}

// Une formation publiée, avec de quoi construire l'instantané (titre, sous-titre, prix, adresse de la page et de l'image)
function getCourse(ctx, id) {
  checkCtx(ctx);
  if (!Number.isInteger(id) || id < 1) return null;
  // price_cents = prix à payer MAINTENANT (offre en cours comprise : un e-mail ou une page ne doit jamais afficher un prix
  // différent de celui du site) ; standard_price_cents = prix habituel. Sans table d'offres (base ancienne), prix standard.
  const sc = scopeOf(ctx);
  try {
    return ctx.db.prepare(`SELECT id, title, slug, subtitle, ${effectivePriceSql("courses")} AS price_cents, price_cents AS standard_price_cents, thumbnail_path FROM courses WHERE id = ? AND published = 1 AND ${sc.sql}`).get(...nowParams(), id, ...sc.params) ?? null;
  } catch {
    try {
      return ctx.db.prepare(`SELECT id, title, slug, subtitle, price_cents, price_cents AS standard_price_cents, thumbnail_path FROM courses WHERE id = ? AND published = 1 AND ${sc.sql}`).get(id, ...sc.params) ?? null;
    } catch {
      return null;
    }
  }
}

// Formations publiées pour un élément « Formations du catalogue » (les plus récentes, par titre ou par prix)
function listCourseCards(ctx, { limit = 3, category = "", sort = "recent" } = {}) {
  checkCtx(ctx);
  const order = { recent: "created_at DESC, id DESC", title: "title COLLATE NOCASE", price: "price_cents ASC, title COLLATE NOCASE" }[sort] || "created_at DESC, id DESC";
  const sc = scopeOf(ctx);
  try {
    return ctx.db.prepare(`SELECT id, title, slug, subtitle, price_cents, thumbnail_path FROM courses WHERE published = 1 AND ${sc.sql}${category ? " AND category = ? COLLATE NOCASE" : ""} ORDER BY ${order} LIMIT ?`)
      .all(...sc.params, ...(category ? [category] : []), Math.min(Math.max(limit, 1), 12));
  } catch {
    return [];
  }
}
// Note moyenne et nombre d'avis RÉELS d'une formation (table des avis du LMS) : jamais de valeur inventée
function courseRating(ctx, id) {
  checkCtx(ctx);
  try {
    const r = ctx.db.prepare("SELECT COUNT(*) AS n, AVG(rating) AS avg FROM reviews WHERE course_id = ?").get(id);
    return { count: r.n, average: r.n ? Math.round(r.avg * 10) / 10 : 0 };
  } catch {
    return { count: 0, average: 0 };
  }
}
function countPublished(ctx, what) {
  checkCtx(ctx);
  try {
    if (what === "courses") { const sc = scopeOf(ctx); return ctx.db.prepare(`SELECT COUNT(*) n FROM courses WHERE published = 1 AND ${sc.sql}`).get(...sc.params).n; }
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
        key: `post:${p.id}`, title: p.title, url: `${base}${require("../../services/urls").publicPath("post", p)}`,
        excerpt: String(p.excerpt || "").replace(/\s+/g, " ").trim().slice(0, 300),
        image: p.cover_path ? (/^https?:\/\//i.test(p.cover_path) ? p.cover_path : `${base}${p.cover_path.startsWith("/") ? "" : "/"}${p.cover_path}`) : "",
        date: SQL_DATE(p.published_at),
      }));
  } catch (e) {
    if (/no such table: posts/i.test(String(e.message))) return []; // LMS sans blog
    throw e; // toute autre erreur doit se voir (sinon une campagne RSS « n'a rien à envoyer » sans explication)
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
    const sc = scopeOf(ctx);
    return ctx.db.prepare(`SELECT id, title, slug FROM courses WHERE slug = ? AND published = 1 AND ${sc.sql}`).get(slug, ...sc.params) ?? null;
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


// ---------- Requêtes de boucle (Page Builder : grille « répéter pour chaque … ») ----------
// Articles ou formations PUBLIÉS, avec recherche, catégorie, tri et pagination ; renvoie { items, total }.
// Les valeurs de recherche et de catégorie ne sont jamais concaténées au SQL (paramètres liés).
const likeEsc = (v) => String(v).replace(/[\\%_]/g, (c) => `\\${c}`);
function queryPosts(ctx, { limit = 6, offset = 0, category = "", search = "", sort = "recent" } = {}) {
  checkCtx(ctx);
  const base = String(ctx.baseUrl || "").replace(/\/+$/, "");
  const now = new Date(typeof ctx.now === "function" ? ctx.now() : Date.now()).toISOString().slice(0, 19).replace("T", " ");
  const where = ["published_at IS NOT NULL", "published_at <= ?", "(published = 1 OR status = 'scheduled')"];
  const args = [now];
  if (category) { where.push("category = ? COLLATE NOCASE"); args.push(category); }
  if (search) { where.push("(title LIKE ? ESCAPE '\\' OR excerpt LIKE ? ESCAPE '\\')"); args.push(`%${likeEsc(search)}%`, `%${likeEsc(search)}%`); }
  const order = { recent: "published_at DESC, id DESC", old: "published_at ASC, id ASC", title: "title COLLATE NOCASE" }[sort] || "published_at DESC, id DESC";
  const lim = Math.min(Math.max(Number(limit) || 6, 1), 24), off = Math.max(Number(offset) || 0, 0);
  try {
    const total = ctx.db.prepare(`SELECT COUNT(*) n FROM posts WHERE ${where.join(" AND ")}`).get(...args).n;
    const rows = ctx.db.prepare(`SELECT id, slug, title, excerpt, cover_path, published_at, category, author_id, reading_minutes FROM posts WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...args, lim, off);
    const author = (id) => { try { const u = ctx.db.prepare("SELECT username FROM users WHERE id = ?").get(id); return u ? u.username : ""; } catch { return ""; } };
    return { total, items: rows.map((p) => ({
      title: p.title, url: `${base}${require("../../services/urls").publicPath("post", p)}`, excerpt: String(p.excerpt || "").replace(/\s+/g, " ").trim().slice(0, 300),
      image: p.cover_path ? (/^https?:\/\//i.test(p.cover_path) ? p.cover_path : `${base}${p.cover_path.startsWith("/") ? "" : "/"}${p.cover_path}`) : "",
      date: SQL_DATE(p.published_at), category: p.category || "", author: p.author_id ? author(p.author_id) : "", minutes: p.reading_minutes || null,
    })) };
  } catch {
    return { total: 0, items: [] };
  }
}
function queryCourses(ctx, { limit = 6, offset = 0, category = "", search = "", sort = "recent" } = {}) {
  checkCtx(ctx);
  const sc = scopeOf(ctx);
  const where = ["published = 1", sc.sql];
  const args = [...sc.params];
  if (category) { where.push("category = ? COLLATE NOCASE"); args.push(category); }
  if (search) { where.push("(title LIKE ? ESCAPE '\\' OR subtitle LIKE ? ESCAPE '\\')"); args.push(`%${likeEsc(search)}%`, `%${likeEsc(search)}%`); }
  const order = { recent: "created_at DESC, id DESC", title: "title COLLATE NOCASE", price: "price_cents ASC, title COLLATE NOCASE" }[sort] || "created_at DESC, id DESC";
  const lim = Math.min(Math.max(Number(limit) || 6, 1), 24), off = Math.max(Number(offset) || 0, 0);
  try {
    const total = ctx.db.prepare(`SELECT COUNT(*) n FROM courses WHERE ${where.join(" AND ")}`).get(...args).n;
    const rows = ctx.db.prepare(`SELECT id, title, slug, subtitle, price_cents, thumbnail_path, category, description FROM courses WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...args, lim, off);
    return { total, items: rows };
  } catch {
    return { total: 0, items: [] };
  }
}

module.exports = { queryPosts, queryCourses, courseRating, listCourseCards, countPublished, listCourses, getCourse, getCourseBySlug, courseConversions, userHasOrder, listPosts, blogCategories };
