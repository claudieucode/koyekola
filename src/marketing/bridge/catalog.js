// Catalogue des formations du LMS, en LECTURE SEULE, pour le bloc « formation » des e-mails. Comme le pont d'événements,
// c'est le seul endroit (avec bridge/) où le module marketing lit les tables du LMS. Un LMS absent ou incomplet donne une liste vide.
const { checkCtx } = require("../audience/shared");
const { effectivePriceSql, nowParams } = require("../../services/pricingSql"); // partie pure : aucun accès à la base à l'import

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
  // price_cents = prix à payer MAINTENANT (offre en cours comprise : un e-mail ou une page ne doit jamais afficher un prix
  // différent de celui du site) ; standard_price_cents = prix habituel. Sans table d'offres (base ancienne), prix standard.
  try {
    return ctx.db.prepare(`SELECT id, title, slug, subtitle, ${effectivePriceSql("courses")} AS price_cents, price_cents AS standard_price_cents, thumbnail_path FROM courses WHERE id = ? AND published = 1`).get(...nowParams(), id) ?? null;
  } catch {
    try {
      return ctx.db.prepare("SELECT id, title, slug, subtitle, price_cents, price_cents AS standard_price_cents, thumbnail_path FROM courses WHERE id = ? AND published = 1").get(id) ?? null;
    } catch {
      return null;
    }
  }
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

module.exports = { listCourses, getCourse, listPosts, blogCategories };
