// Articles du CMS (palier 4) : gestion de la liste (recherche, filtres, tri, pagination, compteurs), création, duplication,
// corbeille, publication — au-dessus du blog EXISTANT (table posts, éditeur riche, versions, SEO, programmation) : aucune
// seconde entité « article ». Le contenu s'écrit dans l'éditeur du blog ; ici on le gère.
// Corbeille = suppression douce : l'article reste en base, hors ligne (published = 0, statut « brouillon »), restaurable ;
// il n'est effacé (avec ses versions) qu'à la suppression définitive. Une restauration ne republie jamais d'office.
const db = require("../config/database");
const blog = require("./blog");
const taxonomy = require("./taxonomy");
const seoGuard = require("../seo/guard");
const { UserError } = require("../utils/errors");

const STATES = ["toutes", "publies", "programmes", "brouillons", "corbeille"];
const PER_PAGE = 20;
const SORTS = {
  modifie: "p.updated_at DESC, p.id DESC",
  recent: "p.created_at DESC, p.id DESC",
  ancien: "p.created_at ASC, p.id ASC",
  titre: "p.title COLLATE NOCASE ASC, p.id DESC",
  titre_desc: "p.title COLLATE NOCASE DESC, p.id DESC",
  publie: "(p.published_at IS NULL), p.published_at DESC, p.id DESC",
};
const stateSql = {
  toutes: "p.deleted_at IS NULL",
  publies: "p.deleted_at IS NULL AND p.status = 'published'",
  programmes: "p.deleted_at IS NULL AND p.status = 'scheduled'",
  // « Brouillons » = tout ce qui n'est ni en ligne ni programmé (brouillon, en relecture, archivé) ; le badge de la ligne précise
  brouillons: "p.deleted_at IS NULL AND p.status NOT IN ('published', 'scheduled')",
  corbeille: "p.deleted_at IS NOT NULL",
};
const PERIODS = { 7: 7, 30: 30, 90: 90, annee: null };
const like = (q) => `%${String(q).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");

function counts() {
  const r = db.prepare(`SELECT COALESCE(SUM(deleted_at IS NULL), 0) toutes,
      COALESCE(SUM(deleted_at IS NULL AND status = 'published'), 0) publies,
      COALESCE(SUM(deleted_at IS NULL AND status = 'scheduled'), 0) programmes,
      COALESCE(SUM(deleted_at IS NULL AND status NOT IN ('published', 'scheduled')), 0) brouillons,
      COALESCE(SUM(deleted_at IS NOT NULL), 0) corbeille FROM posts`).get();
  return { toutes: r.toutes, publies: r.publies, programmes: r.programmes, brouillons: r.brouillons, corbeille: r.corbeille };
}

// Liste filtrée, triée et paginée DANS la base ; le contenu complet n'est jamais chargé (seule la recherche le parcourt)
function list({ state = "toutes", q = "", author = "", category = "", tag = "", period = "", sort = "modifie", page = 1, perPage = PER_PAGE } = {}) {
  taxonomy.reconcile();
  blog.promoteScheduled(); // un article programmé dont l'heure est passée devient publié avant toute lecture
  if (!STATES.includes(state)) state = "toutes";
  const where = [stateSql[state]];
  const args = [];
  const needle = String(q || "").trim().slice(0, 100);
  if (needle) { where.push("(p.title LIKE ? ESCAPE '\\' OR p.slug LIKE ? ESCAPE '\\' OR p.excerpt LIKE ? ESCAPE '\\' OR p.content LIKE ? ESCAPE '\\')"); args.push(like(needle), like(needle), like(needle), like(needle)); }
  if (/^\d{1,9}$/.test(String(author))) { where.push("p.author_id = ?"); args.push(Number(author)); }
  // Catégorie : identifiant de terme (ses sous-catégories comprises, catégories secondaires comprises) ; un nom reste accepté (ancienne saisie)
  if (/^\d{1,9}$/.test(String(category))) { const f = taxonomy.contentFilter("post", taxonomy.subtreeIds(Number(category))); where.push(f.sql.replace(/^id /, "p.id ")); args.push(...f.args); }
  else if (String(category).trim()) { where.push("p.category = ? COLLATE NOCASE"); args.push(String(category).trim()); }
  if (/^\d{1,9}$/.test(String(tag))) { const f = taxonomy.contentFilter("post", [Number(tag)]); where.push(f.sql.replace(/^id /, "p.id ")); args.push(...f.args); }
  if (Object.hasOwn(PERIODS, period)) {
    const since = period === "annee" ? `${new Date().getUTCFullYear()}-01-01 00:00:00` : new Date(Date.now() - PERIODS[period] * 864e5).toISOString().slice(0, 19).replace("T", " ");
    where.push("COALESCE(p.published_at, p.created_at) >= ?"); args.push(since);
  }
  const total = db.prepare(`SELECT COUNT(*) n FROM posts p WHERE ${where.join(" AND ")}`).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  const rows = db.prepare(`SELECT p.id, p.slug, p.title, p.excerpt, p.status, p.published, p.published_at, p.created_at, p.updated_at, p.category, p.author_id, p.cover_path, p.cover_alt,
      p.featured_media_id, p.comments_enabled, p.deleted_at, u.username AS author,
      (SELECT t.name FROM taxonomy_relations r JOIN taxonomy_terms t ON t.id = r.term_id WHERE r.content_type = 'post' AND r.content_id = p.id AND r.is_primary = 1 AND t.taxonomy = 'category') AS primary_category
    FROM posts p LEFT JOIN users u ON u.id = p.author_id WHERE ${where.join(" AND ")} ORDER BY ${SORTS[sort] || SORTS.modifie} LIMIT ? OFFSET ?`).all(...args, perPage, (current - 1) * perPage);
  const cc = require("./comments").countsForPosts(rows.map((r) => r.id));
  for (const r of rows) Object.assign(r, { comments_approved: (cc.get(r.id) || {}).approved || 0, comments_pending: (cc.get(r.id) || {}).pending || 0 });
  return { rows, total, page: current, pages, perPage, counts: counts() };
}
const authors = () => db.prepare("SELECT DISTINCT u.id, u.username FROM posts p JOIN users u ON u.id = p.author_id WHERE p.deleted_at IS NULL ORDER BY u.username COLLATE NOCASE").all();
const categoryTree = () => taxonomy.tree("category"); // catégories en arbre (profondeur) pour le filtre

const get = (id) => (Number.isInteger(id) ? db.prepare("SELECT * FROM posts WHERE id = ?").get(id) : null);

// Titre → article en brouillon (identifiant réel), prêt à s'ouvrir dans l'éditeur
function createDraft({ title, userId }) {
  const clean = String(title || "").replace(/[\r\n\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 150);
  if (!clean) throw new UserError("Le titre de l'article est obligatoire.");
  const id = Number(db.prepare("INSERT INTO posts (slug, title, content_format, status, author_id, comments_enabled) VALUES (?, ?, 'html', 'draft', ?, ?)").run(blog.uniqueSlug(clean), clean, userId ?? null, require("./comments").settings().enabled_default ? 1 : 0).lastInsertRowid);
  blog.addRevision(get(id), userId ?? null, "Création de l'article", "create");
  return get(id);
}

// Copie : nouvel identifiant, nouvelle adresse, brouillon, même contenu / image mise en avant / catégorie / étiquettes / réglages ;
// jamais de date de publication, de lectures, de canonique ni de « mis en avant » repris. L'original n'est pas touché.
const COPIED = ["excerpt", "content", "content_format", "cover_path", "cover_alt", "featured_media_id", "category", "subcategory", "tags", "seo_title", "seo_description", "focus_keyword", "secondary_keywords",
  "og_title", "og_description", "og_image_path", "twitter_card", "twitter_title", "twitter_description", "twitter_image_path", "robots_index", "robots_follow", "toc_enabled", "toc_depth", "toc_numbering", "toc_title",
  "language", "schema_type", "comments_enabled", "reading_minutes", "author_id"];
function duplicate(id, userId) {
  const src = get(id);
  if (!src) throw new UserError("Article introuvable.");
  const title = `${src.title} (copie)`.slice(0, 150);
  const cols = { slug: blog.uniqueSlug(title), title, status: "draft", published: 0 };
  for (const k of COPIED) cols[k] = src[k];
  const names = Object.keys(cols);
  const copy = Number(db.prepare(`INSERT INTO posts (${names.join(", ")}) VALUES (${names.map(() => "?").join(", ")})`).run(...names.map((n) => cols[n])).lastInsertRowid);
  const t = taxonomy.termsOf("post", id); // mêmes catégories (dont la principale) et mêmes étiquettes
  taxonomy.setTerms("post", copy, { categoryIds: t.categories.map((c) => c.id), primaryId: t.primary ? t.primary.id : null, tagIds: t.tags.map((x) => x.id) });
  blog.addRevision(get(copy), userId ?? null, `Copie de « ${src.title} »`, "create");
  return get(copy);
}

function trash(id, userId) {
  const p = get(id);
  if (!p) throw new UserError("Article introuvable.");
  if (p.deleted_at) return p;
  db.prepare("UPDATE posts SET deleted_at = datetime('now'), deleted_from_status = ?, deleted_by = ?, published = 0, status = 'draft', updated_at = datetime('now') WHERE id = ?").run(p.status, userId ?? null, id);
  blog.addRevision(get(id), userId ?? null, "Mis à la corbeille", "status");
  return get(id);
}
function restore(id, userId) {
  const p = get(id);
  if (!p) throw new UserError("Article introuvable.");
  if (!p.deleted_at) throw new UserError("Cet article n'est pas dans la corbeille.");
  db.prepare("UPDATE posts SET deleted_at = NULL, deleted_by = NULL, updated_at = datetime('now') WHERE id = ?").run(id); // reste en brouillon : jamais republié d'office
  blog.addRevision(get(id), userId ?? null, "Restauré depuis la corbeille (brouillon)", "status");
  return get(id);
}
// Suppression définitive (depuis la corbeille seulement) : l'article et ses versions (suppression en cascade) ; les images du
// blog qui ne servent plus nulle part sont libérées, celles de la médiathèque du CMS ne sont JAMAIS effacées ici
function purge(id) {
  const p = get(id);
  if (!p) throw new UserError("Article introuvable.");
  if (!p.deleted_at) throw new UserError("Mettez d'abord l'article à la corbeille : il ne peut être supprimé définitivement que depuis la corbeille.");
  const kept = blog.revisionImages(db.prepare("SELECT meta FROM post_revisions WHERE post_id = ?").all(id));
  db.prepare("DELETE FROM posts WHERE id = ?").run(id);
  for (const path of new Set([...["cover_path", "og_image_path", "twitter_image_path"].map((c) => p[c]).filter(Boolean), ...kept])) blog.releaseImage(path);
  return true;
}

// Publier maintenant : mêmes contrôles que l'éditeur (article non vide, contrôle SEO avant publication s'il est activé)
function publish(id, userId, req) {
  const p = get(id);
  if (!p) throw new UserError("Article introuvable.");
  if (p.deleted_at) throw new UserError("L'article est dans la corbeille : restaurez-le d'abord.");
  if (p.status === "published") return p;
  const plain = p.content_format === "html" ? String(p.content || "").replace(/<[^>]*>/g, "").trim() : String(p.content || "").trim();
  if (!plain && !/<(img|div class="kb-)/.test(String(p.content || ""))) throw new UserError("Impossible de publier un article vide : écrivez d'abord son contenu.");
  const check = seoGuard.checkPost({ ...p }, { req, postId: id });
  if (check.blocking) throw new UserError(`Publication bloquée par le contrôle SEO : ${check.critical.join(" ")}`);
  db.prepare("UPDATE posts SET status = 'published', published = 1, published_at = COALESCE(published_at, ?), updated_at = datetime('now') WHERE id = ?").run(now(), id);
  blog.addRevision(get(id), userId ?? null, "Statut : Publié", "publish");
  return get(id);
}
function unpublish(id, userId) {
  const p = get(id);
  if (!p) throw new UserError("Article introuvable.");
  if (p.deleted_at) throw new UserError("L'article est dans la corbeille.");
  if (p.status !== "published" && p.status !== "scheduled") throw new UserError("Cet article n'est pas en ligne.");
  db.prepare("UPDATE posts SET status = 'draft', published = 0, updated_at = datetime('now') WHERE id = ?").run(id);
  blog.addRevision(get(id), userId ?? null, "Statut : Brouillon", "status");
  return get(id);
}

// Participe passé au singulier et au pluriel (« 1 article publié », « 3 articles publiés »)
const ACTIONS = { publier: ["publié", "publiés"], depublier: ["remis en brouillon", "remis en brouillon"], corbeille: ["mis à la corbeille", "mis à la corbeille"], restaurer: ["restauré", "restaurés"], supprimer: ["supprimé définitivement", "supprimés définitivement"] };
// Actions groupées : chaque article est traité à part (un refus n'arrête pas les autres), avec le motif de chaque refus
function bulk(action, ids, userId, req) {
  if (!Object.hasOwn(ACTIONS, action)) throw new UserError("Action inconnue.");
  const list = [...new Set((Array.isArray(ids) ? ids : [ids]).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 200);
  if (!list.length) throw new UserError("Sélectionnez au moins un article.");
  const run = { publier: publish, depublier: unpublish, corbeille: trash, restaurer: restore, supprimer: (id) => purge(id) }[action];
  const done = [], failed = [];
  for (const id of list) {
    const p = get(id);
    try {
      if (!p) throw new UserError("article introuvable");
      run(id, userId, req);
      done.push(id);
    } catch (e) {
      if (!(e instanceof UserError)) throw e;
      failed.push({ id, title: p ? p.title : `#${id}`, message: e.message.replace(/\.$/, "") });
    }
  }
  return { done, failed, label: ACTIONS[action] };
}

module.exports = { STATES, SORTS, PERIODS, PER_PAGE, counts, list, authors, categoryTree, get, createDraft, duplicate, trash, restore, purge, publish, unpublish, bulk, ACTIONS };
