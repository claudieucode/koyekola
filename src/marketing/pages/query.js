// Moteur de REQUÊTES du Page Builder (« Query Builder ») : UNE seule description d'une requête de contenu, partagée par tous les
// éléments dynamiques (boucle de la grille, listes d'articles, articles liés, récents, populaires, archives, auteurs, catégories…).
// Une SOURCE (articles, formations, pages, auteurs, catégories, étiquettes…) est déclarée avec registerQuerySource : ajouter plus
// tard un type de contenu (produits, événements, membres…) ne demande aucune réécriture des éléments.
//
// Sécurité : seuls les contenus PUBLIÉS sont lus ; chaque réglage est validé et borné ; les valeurs sont toujours passées en
// paramètres SQL (jamais assemblées dans la requête) ; le tri est choisi dans une liste fermée.
const { slugify } = require("../../utils/format");

const MAX_COUNT = 48;
const ORDERS = ["asc", "desc"];
const PAGINATIONS = ["none", "numbers", "prevnext", "both", "more", "infinite"];
const SOURCES = new Map();

const line = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
const ms = (v) => { const t = Date.parse(`${String(v || "").replace(" ", "T")}Z`); return Number.isFinite(t) ? t : null; };
const likeEsc = (v) => String(v).replace(/[\\%_]/g, (c) => `\\${c}`);
const ids = (v) => [...new Set((Array.isArray(v) ? v : []).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 100);
const names = (v, max = 20) => [...new Set((Array.isArray(v) ? v : []).map((x) => line(x, 80)).filter(Boolean))].slice(0, max);
const ymd = (v) => { const s = String(v || "").trim(); return /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(`${s}T00:00:00Z`)) ? s : ""; };

// def : { label, filters: [...], orderby: [...], defaultOrderby, run(ctx, q, env) → { items, total }, scopeKey, kind }
//  filters possibles : include, exclude, categories, tags, author, date, search, related, excludeCurrent
function registerQuerySource(key, def) {
  if (!/^[a-z][a-z_]{1,30}$/.test(key)) throw new Error(`Source de requête « ${key} » : nom invalide.`);
  if (SOURCES.has(key)) throw new Error(`Source de requête « ${key} » déjà déclarée.`);
  if (!def || !def.label || typeof def.run !== "function" || !def.scopeKey || !Array.isArray(def.orderby) || !def.orderby.length) throw new Error(`Source de requête « ${key} » : libellé, run, scopeKey et orderby obligatoires.`);
  SOURCES.set(key, { key, filters: [], defaultOrderby: def.orderby[0], ...def });
}

// Requête brute (venue d'un document) → requête valide. Un réglage que la source ne gère pas est ignoré.
function normalizeQuery(raw = {}) {
  const r = raw && typeof raw === "object" ? raw : {};
  const source = SOURCES.has(r.source) ? r.source : "posts";
  const def = SOURCES.get(source);
  const has = (f) => def.filters.includes(f);
  const q = {
    source,
    count: Math.min(Math.max(parseInt(r.count, 10) || 6, 1), MAX_COUNT),
    offset: Math.min(Math.max(parseInt(r.offset, 10) || 0, 0), 1000),
    orderby: def.orderby.includes(r.orderby) ? r.orderby : def.defaultOrderby,
    order: ORDERS.includes(r.order) ? r.order : (r.orderby === "title" || r.orderby === "author" ? "asc" : "desc"),
    pagination: PAGINATIONS.includes(r.pagination) ? r.pagination : "none",
  };
  if (has("include") && ids(r.include).length) q.include = ids(r.include);
  if (has("exclude") && ids(r.exclude).length) q.exclude = ids(r.exclude);
  if (has("categories") && names(r.categories).length) q.categories = names(r.categories);
  if (has("tags") && names(r.tags).length) q.tags = names(r.tags);
  if (has("author") && (r.author === "current" || Number.isInteger(Number(r.author)) && Number(r.author) > 0)) q.author = r.author === "current" ? "current" : Number(r.author);
  if (has("date")) {
    if (ymd(r.dateAfter)) q.dateAfter = ymd(r.dateAfter);
    if (ymd(r.dateBefore)) q.dateBefore = ymd(r.dateBefore);
    const w = parseInt(r.withinDays, 10); if (Number.isInteger(w) && w >= 1 && w <= 3650) q.withinDays = w;
    const y = parseInt(r.year, 10); if (Number.isInteger(y) && y >= 1990 && y <= 2100) q.year = y;
    const mo = parseInt(r.month, 10); if (Number.isInteger(mo) && mo >= 1 && mo <= 12) q.month = mo;
  }
  if (has("search") && line(r.search, 80)) q.search = line(r.search, 80);
  if (has("related") && ["category", "tags", "both"].includes(r.related)) q.related = r.related;
  if (has("excludeCurrent") && r.excludeCurrent === true) q.excludeCurrent = true;
  if (has("archive") && r.archive === true) q.archive = true;
  if (q.orderby === "random") q.pagination = "none"; // un ordre aléatoire ne se pagine pas (une page 2 serait incohérente)
  return q;
}

// Résultat d'une requête : { items, total, pages, pageNo, perPage } — env : { scope, pageNo }
// scope : contexte courant (post, author, term, query…) pour les filtres « courant » et « liés »
function runQuery(ctx, query, env = {}) {
  const q = normalizeQuery(query);
  const def = SOURCES.get(q.source);
  const pageNo = q.pagination === "none" ? 1 : Math.max(1, Math.min(parseInt(env.pageNo, 10) || 1, 500));
  const offset = q.offset + (pageNo - 1) * q.count;
  let found = { items: [], total: 0 };
  try { found = def.run(ctx, { ...q, offset }, { scope: env.scope || {}, baseUrl: String(ctx.baseUrl || "").replace(/\/+$/, "") }); } catch { found = { items: [], total: 0 }; }
  const total = Math.max(0, found.total - q.offset);
  return { items: found.items, total, pages: Math.max(1, Math.ceil(total / q.count)), pageNo, perPage: q.count, query: q };
}

// Catalogue pour l'éditeur : sources, filtres et tris disponibles
function catalog() {
  return [...SOURCES.values()].map((s) => ({ key: s.key, label: s.label, filters: s.filters, orderby: s.orderby, scopeKey: s.scopeKey }));
}

// ---------- Vues communes ----------
const safeImage = (p, base = "") => {
  const s = String(p || "");
  if (/^\/uploads\/[A-Za-z0-9_\/.-]{1,200}$/.test(s) && !s.includes("..")) return `${base}${s}`;
  return /^https:\/\/[^\s"'<>]{3,400}$/i.test(s) ? s : "";
};
const csv = (v) => String(v || "").split(",").map((t) => t.trim()).filter(Boolean);
const authorView = (u, base = "") => (u ? { id: u.id, name: u.username, bio: u.bio || "", avatar: safeImage(u.avatar_path, base), url: `${base}/blog/auteur/${u.id}` } : null);

// ---------- Source : articles ----------
const POST_ORDER = {
  date: "COALESCE(p.published_at, p.created_at)", modified: "p.updated_at", title: "p.title COLLATE NOCASE", author: "u.username COLLATE NOCASE",
  views: "p.views", comments: "(SELECT COUNT(*) FROM blog_comments bc WHERE bc.post_id = p.id)", random: "RANDOM()", id: "p.id",
};
function postWhere(ctx, q, env) {
  const now = new Date(typeof ctx.now === "function" ? ctx.now() : Date.now()).toISOString().slice(0, 19).replace("T", " ");
  const where = ["p.published_at IS NOT NULL", "p.published_at <= ?", "(p.published = 1 OR p.status = 'scheduled')", "p.deleted_at IS NULL"];
  const args = [now];
  const cur = env.scope.post || null;
  if (q.include) { where.push(`p.id IN (${q.include.map(() => "?").join(",")})`); args.push(...q.include); }
  const exclude = [...(q.exclude || []), ...(q.excludeCurrent && cur && Number.isInteger(cur.id) ? [cur.id] : [])];
  if (exclude.length) { where.push(`p.id NOT IN (${exclude.map(() => "?").join(",")})`); args.push(...exclude); }
  if (q.categories) { where.push(`(${q.categories.map(() => "p.category = ? COLLATE NOCASE").join(" OR ")})`); args.push(...q.categories); }
  if (q.tags) { where.push(`(${q.tags.map(() => "(',' || REPLACE(LOWER(p.tags), ', ', ',') || ',') LIKE ? ESCAPE '\\'").join(" OR ")})`); args.push(...q.tags.map((t) => `%,${likeEsc(t.toLowerCase())},%`)); }
  const authorId = q.author === "current" ? ((env.scope.author && env.scope.author.id) || (cur && cur.authorId) || null) : q.author;
  if (q.author) { where.push("p.author_id = ?"); args.push(Number.isInteger(authorId) ? authorId : -1); }
  // Page d'archive (catégorie, étiquette, auteur) : la liste suit l'archive affichée ; hors archive, aucune restriction
  const ar = q.archive ? env.scope.archive : null;
  if (ar && ar.type === "category") { where.push("p.category = ? COLLATE NOCASE"); args.push(String(ar.name)); }
  if (ar && ar.type === "tag") { where.push("(',' || REPLACE(LOWER(p.tags), ', ', ',') || ',') LIKE ? ESCAPE '\\'"); args.push(`%,${likeEsc(String(ar.name).toLowerCase())},%`); }
  if (ar && ar.type === "author") { where.push("p.author_id = ?"); args.push(Number.isInteger(ar.id) ? ar.id : -1); }
  if (q.dateAfter) { where.push("p.published_at >= ?"); args.push(`${q.dateAfter} 00:00:00`); }
  if (q.dateBefore) { where.push("p.published_at < ?"); args.push(`${q.dateBefore} 23:59:59`); }
  if (q.withinDays) { where.push("p.published_at >= ?"); args.push(new Date(Date.now() - q.withinDays * 86400000).toISOString().slice(0, 19).replace("T", " ")); }
  if (q.year) { where.push("strftime('%Y', p.published_at) = ?"); args.push(String(q.year)); }
  if (q.month) { where.push("strftime('%m', p.published_at) = ?"); args.push(String(q.month).padStart(2, "0")); }
  if (q.search) { const like = `%${likeEsc(q.search)}%`; where.push("(p.title LIKE ? ESCAPE '\\' OR p.excerpt LIKE ? ESCAPE '\\' OR p.content LIKE ? ESCAPE '\\')"); args.push(like, like, like); }
  if (q.related && cur) {
    const parts = [];
    if (q.related !== "tags" && cur.category) { parts.push("p.category = ? COLLATE NOCASE"); args.push(cur.category); }
    if (q.related !== "category") for (const t of (cur.tags || []).slice(0, 10)) { parts.push("(',' || REPLACE(LOWER(p.tags), ', ', ',') || ',') LIKE ? ESCAPE '\\'"); args.push(`%,${likeEsc(String(t).toLowerCase())},%`); }
    where.push(parts.length ? `(${parts.join(" OR ")})` : "0");
    if (cur.id) { where.push("p.id <> ?"); args.push(cur.id); }
  }
  return { where: where.join(" AND "), args };
}
registerQuerySource("posts", {
  label: "Articles du blog", scopeKey: "post", orderby: ["date", "modified", "title", "author", "views", "comments", "random", "id"],
  filters: ["include", "exclude", "categories", "tags", "author", "date", "search", "related", "excludeCurrent", "archive"],
  run(ctx, q, env) {
    const { where, args } = postWhere(ctx, q, env);
    const base = env.baseUrl;
    const total = ctx.db.prepare(`SELECT COUNT(*) n FROM posts p WHERE ${where}`).get(...args).n;
    const order = `${POST_ORDER[q.orderby]} ${q.order === "asc" ? "ASC" : "DESC"}, p.id DESC`;
    const rows = ctx.db.prepare(`SELECT p.id, p.slug, p.title, p.excerpt, p.cover_path, p.cover_alt, p.published_at, p.updated_at, p.category, p.tags, p.author_id, p.reading_minutes, p.views,
        (SELECT COUNT(*) FROM blog_comments bc WHERE bc.post_id = p.id) AS comments_count, p.comments_enabled
      FROM posts p LEFT JOIN users u ON u.id = p.author_id WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`).all(...args, q.count, q.offset);
    const user = ctx.db.prepare("SELECT id, username, bio, avatar_path FROM users WHERE id = ?");
    return { total, items: rows.map((p) => {
      let author = null; try { author = p.author_id ? authorView(user.get(p.author_id), base) : null; } catch { author = null; }
      return { id: p.id, authorId: p.author_id || null, title: p.title, url: `${base}/blog/${encodeURIComponent(p.slug)}`, slug: p.slug, excerpt: String(p.excerpt || "").replace(/\s+/g, " ").trim().slice(0, 300),
        image: safeImage(p.cover_path, base), imageAlt: p.cover_alt || p.title, date: ms(p.published_at), modified: ms(p.updated_at), category: p.category || "", categoryUrl: p.category ? `${base}/blog/categorie/${slugify(p.category)}` : "",
        tags: csv(p.tags), author: author ? author.name : "", authorView: author, minutes: p.reading_minutes || null, views: p.views || 0, commentsCount: p.comments_count || 0, commentsOpen: p.comments_enabled !== 0 };
    }) };
  },
});

// ---------- Source : formations ----------
registerQuerySource("courses", {
  label: "Formations", scopeKey: "course", orderby: ["date", "title", "price", "random", "id"], filters: ["include", "exclude", "categories", "author", "search", "excludeCurrent"],
  run(ctx, q, env) {
    const where = ["c.published = 1", "COALESCE(c.archived, 0) = 0"], args = [];
    const cur = env.scope.course || null;
    if (q.include) { where.push(`c.id IN (${q.include.map(() => "?").join(",")})`); args.push(...q.include); }
    const exclude = [...(q.exclude || []), ...(q.excludeCurrent && cur && Number.isInteger(cur.id) ? [cur.id] : [])];
    if (exclude.length) { where.push(`c.id NOT IN (${exclude.map(() => "?").join(",")})`); args.push(...exclude); }
    if (q.categories) { where.push(`(${q.categories.map(() => "c.category = ? COLLATE NOCASE").join(" OR ")})`); args.push(...q.categories); }
    if (q.author) { const a = q.author === "current" ? (env.scope.author && env.scope.author.id) : q.author; where.push("c.instructor_id = ?"); args.push(Number.isInteger(a) ? a : -1); }
    if (q.search) { const like = `%${likeEsc(q.search)}%`; where.push("(c.title LIKE ? ESCAPE '\\' OR c.subtitle LIKE ? ESCAPE '\\')"); args.push(like, like); }
    const order = { date: "c.created_at", title: "c.title COLLATE NOCASE", price: "c.price_cents", random: "RANDOM()", id: "c.id" }[q.orderby];
    const total = ctx.db.prepare(`SELECT COUNT(*) n FROM courses c WHERE ${where.join(" AND ")}`).get(...args).n;
    const rows = ctx.db.prepare(`SELECT c.id, c.title, c.slug, c.subtitle, c.price_cents, c.thumbnail_path, c.category, c.description FROM courses c WHERE ${where.join(" AND ")} ORDER BY ${order} ${q.order === "asc" ? "ASC" : "DESC"}, c.id DESC LIMIT ? OFFSET ?`).all(...args, q.count, q.offset);
    return { total, items: rows.map((c) => ({ id: c.id, title: c.title, subtitle: c.subtitle || "", priceCents: c.price_cents || 0, url: `/cours/${encodeURIComponent(c.slug)}`, image: safeImage(c.thumbnail_path), category: c.category || "", description: c.description || "" })) };
  },
});

// ---------- Source : pages du site ----------
registerQuerySource("pages", {
  label: "Pages du site", scopeKey: "page_item", orderby: ["date", "modified", "title", "id"], filters: ["include", "exclude", "search", "excludeCurrent"],
  run(ctx, q, env) {
    const where = ["status = 'published'", "kind IN ('page', 'landing')", "archived_at IS NULL", "organization_id = ?"], args = [ctx.organizationId];
    const page = env.scope.page || null;
    const siteId = page && page.site_id ? page.site_id : null;
    if (siteId) { where.push("site_id = ?"); args.push(siteId); }
    if (q.include) { where.push(`id IN (${q.include.map(() => "?").join(",")})`); args.push(...q.include); }
    const exclude = [...(q.exclude || []), ...(q.excludeCurrent && page && Number.isInteger(page.id) ? [page.id] : [])];
    if (exclude.length) { where.push(`id NOT IN (${exclude.map(() => "?").join(",")})`); args.push(...exclude); }
    if (q.search) { where.push("name LIKE ? ESCAPE '\\'"); args.push(`%${likeEsc(q.search)}%`); }
    const order = { date: "COALESCE(published_at, created_at)", modified: "updated_at", title: "name COLLATE NOCASE", id: "id" }[q.orderby];
    const total = ctx.db.prepare(`SELECT COUNT(*) n FROM mk_landing_pages WHERE ${where.join(" AND ")}`).get(...args).n;
    const rows = ctx.db.prepare(`SELECT id, name, slug, published_at, updated_at FROM mk_landing_pages WHERE ${where.join(" AND ")} ORDER BY ${order} ${q.order === "asc" ? "ASC" : "DESC"}, id DESC LIMIT ? OFFSET ?`).all(...args, q.count, q.offset);
    return { total, items: rows.map((p) => ({ id: p.id, title: p.name, url: `/p/${encodeURIComponent(p.slug)}`, date: ms(p.published_at), modified: ms(p.updated_at) })) };
  },
});

// ---------- Source : auteurs (comptes ayant au moins un article publié) ----------
registerQuerySource("authors", {
  label: "Auteurs", scopeKey: "author", orderby: ["title", "posts", "random", "id"], filters: ["include", "exclude", "search"],
  run(ctx, q, env) {
    const where = ["EXISTS (SELECT 1 FROM posts p WHERE p.author_id = u.id AND p.published = 1 AND p.deleted_at IS NULL)"], args = [];
    if (q.include) { where.push(`u.id IN (${q.include.map(() => "?").join(",")})`); args.push(...q.include); }
    if (q.exclude) { where.push(`u.id NOT IN (${q.exclude.map(() => "?").join(",")})`); args.push(...q.exclude); }
    if (q.search) { where.push("u.username LIKE ? ESCAPE '\\'"); args.push(`%${likeEsc(q.search)}%`); }
    const order = { title: "u.username COLLATE NOCASE", posts: "posts_count", random: "RANDOM()", id: "u.id" }[q.orderby];
    const total = ctx.db.prepare(`SELECT COUNT(*) n FROM users u WHERE ${where.join(" AND ")}`).get(...args).n;
    const rows = ctx.db.prepare(`SELECT u.id, u.username, u.bio, u.avatar_path, (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id AND p.published = 1 AND p.deleted_at IS NULL) AS posts_count FROM users u WHERE ${where.join(" AND ")} ORDER BY ${order} ${q.order === "asc" ? "ASC" : "DESC"}, u.id LIMIT ? OFFSET ?`).all(...args, q.count, q.offset);
    return { total, items: rows.map((u) => ({ ...authorView(u, env.baseUrl), postsCount: u.posts_count })) };
  },
});

// ---------- Sources : catégories et étiquettes d'articles ----------
const publicPosts = "published = 1 AND deleted_at IS NULL AND published_at IS NOT NULL";
registerQuerySource("categories", {
  label: "Catégories d'articles", scopeKey: "term", orderby: ["title", "count", "random"], filters: ["search"],
  run(ctx, q, env) {
    const where = ["category IS NOT NULL", "category <> ''", publicPosts], args = [];
    if (q.search) { where.push("category LIKE ? ESCAPE '\\'"); args.push(`%${likeEsc(q.search)}%`); }
    const all = ctx.db.prepare(`SELECT category AS name, COUNT(*) AS n FROM posts WHERE ${where.join(" AND ")} GROUP BY category COLLATE NOCASE`).all(...args);
    const sorted = all.sort((a, b) => (q.orderby === "count" ? a.n - b.n : a.name.localeCompare(b.name, "fr", { sensitivity: "base" })) * (q.order === "asc" ? 1 : -1));
    if (q.orderby === "random") sorted.sort(() => Math.random() - 0.5);
    return { total: sorted.length, items: sorted.slice(q.offset, q.offset + q.count).map((c) => ({ name: c.name, url: `${env.baseUrl}/blog/categorie/${slugify(c.name)}`, count: c.n, taxonomy: "category" })) };
  },
});
registerQuerySource("tags", {
  label: "Étiquettes d'articles", scopeKey: "term", orderby: ["title", "count", "random"], filters: ["search"],
  run(ctx, q, env) {
    const counts = new Map();
    for (const r of ctx.db.prepare(`SELECT tags FROM posts WHERE ${publicPosts} AND tags <> ''`).all()) for (const t of csv(r.tags)) { const k = t.toLowerCase(); const c = counts.get(k) || { name: t, n: 0 }; c.n += 1; counts.set(k, c); }
    let all = [...counts.values()];
    if (q.search) all = all.filter((t) => t.name.toLowerCase().includes(q.search.toLowerCase()));
    all.sort((a, b) => (q.orderby === "count" ? a.n - b.n : a.name.localeCompare(b.name, "fr", { sensitivity: "base" })) * (q.order === "asc" ? 1 : -1));
    if (q.orderby === "random") all.sort(() => Math.random() - 0.5);
    return { total: all.length, items: all.slice(q.offset, q.offset + q.count).map((t) => ({ name: t.name, url: `${env.baseUrl}/blog/etiquette/${slugify(t.name)}`, count: t.n, taxonomy: "tag" })) };
  },
});


// Article précédent / suivant (publiés seulement), dans l'ordre de publication, éventuellement dans la même catégorie
function neighbours(ctx, cur, { sameCategory = false, baseUrl = "" } = {}) {
  if (!cur || !Number.isInteger(cur.id) || !cur.date) return { previous: null, next: null };
  const posts = SOURCES.get("posts");
  const stamp = new Date(cur.date).toISOString().slice(0, 19).replace("T", " ");
  const pick = (dir) => {
    const { where, args } = postWhere(ctx, {}, { scope: {} });
    const cmp = dir === "prev" ? "<" : ">";
    const extra = [`(p.published_at ${cmp} ? OR (p.published_at = ? AND p.id ${cmp} ?))`], more = [stamp, stamp, cur.id];
    if (sameCategory && cur.category) { extra.push("p.category = ? COLLATE NOCASE"); more.push(cur.category); }
    const row = ctx.db.prepare(`SELECT p.id FROM posts p WHERE ${where} AND ${extra.join(" AND ")} ORDER BY p.published_at ${dir === "prev" ? "DESC" : "ASC"}, p.id ${dir === "prev" ? "DESC" : "ASC"} LIMIT 1`).get(...args, ...more);
    if (!row) return null;
    const found = posts.run(ctx, { source: "posts", count: 1, offset: 0, orderby: "id", order: "desc", include: [row.id] }, { scope: {}, baseUrl });
    return found.items[0] || null;
  };
  try { return { previous: pick("prev"), next: pick("next") }; } catch { return { previous: null, next: null }; }
}

module.exports = { neighbours, registerQuerySource, normalizeQuery, runQuery, catalog, SOURCES, PAGINATIONS, MAX_COUNT, authorView, safeImage, csv };
