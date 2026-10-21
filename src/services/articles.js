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
  // Tri par colonne (clic sur l'en-tête, comme WordPress) : auteur, commentaires approuvés, date affichée (publication, sinon création)
  auteur: "u.username COLLATE NOCASE ASC, p.id DESC",
  auteur_desc: "u.username COLLATE NOCASE DESC, p.id DESC",
  commentaires: "(SELECT COUNT(*) FROM blog_comments c WHERE c.content_type = 'post' AND c.content_id = p.id AND c.status = 'approved') ASC, p.id DESC",
  commentaires_desc: "(SELECT COUNT(*) FROM blog_comments c WHERE c.content_type = 'post' AND c.content_id = p.id AND c.status = 'approved') DESC, p.id DESC",
  date: "COALESCE(p.published_at, p.created_at) ASC, p.id ASC",
  date_desc: "COALESCE(p.published_at, p.created_at) DESC, p.id DESC",
};
const PER_PAGE_MIN = 5, PER_PAGE_MAX = 100;
const clampPerPage = (v) => { const n = Number(v); return Number.isInteger(n) ? Math.min(PER_PAGE_MAX, Math.max(PER_PAGE_MIN, n)) : PER_PAGE; };
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

function counts(scope = null) {
  const r = db.prepare(`SELECT COALESCE(SUM(deleted_at IS NULL), 0) toutes,
      COALESCE(SUM(deleted_at IS NULL AND status = 'published'), 0) publies,
      COALESCE(SUM(deleted_at IS NULL AND status = 'scheduled'), 0) programmes,
      COALESCE(SUM(deleted_at IS NULL AND status NOT IN ('published', 'scheduled')), 0) brouillons,
      COALESCE(SUM(deleted_at IS NOT NULL), 0) corbeille FROM posts p${scope ? " WHERE " + scope.sql : ""}`).get(...(scope ? scope.params : []));
  return { toutes: r.toutes, publies: r.publies, programmes: r.programmes, brouillons: r.brouillons, corbeille: r.corbeille };
}

// Liste filtrée, triée et paginée DANS la base ; le contenu complet n'est jamais chargé (seule la recherche le parcourt)
function list({ state = "toutes", q = "", author = "", category = "", tag = "", period = "", month = "", sort = "modifie", page = 1, perPage = PER_PAGE, scope = null } = {}) {
  perPage = clampPerPage(perPage);
  taxonomy.reconcile();
  blog.promoteScheduled(); // un article programmé dont l'heure est passée devient publié avant toute lecture
  if (!STATES.includes(state)) state = "toutes";
  const where = [stateSql[state]];
  const args = [];
  if (scope) { where.push(scope.sql); args.push(...scope.params); } // portée de site (R6 lot 2)
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
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(String(month))) { where.push("substr(COALESCE(p.published_at, p.created_at), 1, 7) = ?"); args.push(String(month)); } // mois affiché dans la colonne Date
  const total = db.prepare(`SELECT COUNT(*) n FROM posts p WHERE ${where.join(" AND ")}`).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  const rows = db.prepare(`SELECT p.id, p.slug, p.title, p.excerpt, p.status, p.published, p.published_at, p.created_at, p.updated_at, p.category, p.author_id, p.cover_path, p.cover_alt,
      p.featured_media_id, p.comments_enabled, p.deleted_at, u.username AS author,
      (SELECT t.name FROM taxonomy_relations r JOIN taxonomy_terms t ON t.id = r.term_id WHERE r.content_type = 'post' AND r.content_id = p.id AND r.is_primary = 1 AND t.taxonomy = 'category') AS primary_category
    FROM posts p LEFT JOIN users u ON u.id = p.author_id WHERE ${where.join(" AND ")} ORDER BY ${SORTS[sort] || SORTS.modifie} LIMIT ? OFFSET ?`).all(...args, perPage, (current - 1) * perPage);
  const cc = require("./comments").countsForPosts(rows.map((r) => r.id));
  for (const r of rows) Object.assign(r, { comments_approved: (cc.get(r.id) || {}).approved || 0, comments_pending: (cc.get(r.id) || {}).pending || 0 });
  const tagsOf = tagsForPosts(rows.map((r) => r.id)), catsOf = categoriesForPosts(rows.map((r) => r.id));
  for (const r of rows) Object.assign(r, { tags_list: tagsOf.get(r.id) || [], categories_list: catsOf.get(r.id) || [] });
  return { rows, total, page: current, pages, perPage, counts: counts(scope) };
}
// Étiquettes et catégories des articles d'une page, en une requête chacune (jamais une requête par ligne)
function termsForPosts(ids, taxonomy) {
  const map = new Map();
  if (!ids.length) return map;
  const rows = db.prepare(`SELECT r.content_id id, t.id term_id, t.name, t.slug, r.is_primary FROM taxonomy_relations r JOIN taxonomy_terms t ON t.id = r.term_id
    WHERE r.content_type = 'post' AND t.taxonomy = ? AND r.content_id IN (${ids.map(() => "?").join(",")}) ORDER BY r.is_primary DESC, r.position, t.name COLLATE NOCASE`).all(taxonomy, ...ids);
  for (const r of rows) { if (!map.has(r.id)) map.set(r.id, []); map.get(r.id).push({ id: r.term_id, name: r.name, slug: r.slug }); }
  return map;
}
const tagsForPosts = (ids) => termsForPosts(ids, "tag");
const categoriesForPosts = (ids) => termsForPosts(ids, "category");
// Mois disponibles pour le filtre de date (mois de la colonne Date), dans la portée de site et l'état affiché
function months(state = "toutes", scope = null) {
  if (!STATES.includes(state)) state = "toutes";
  return db.prepare(`SELECT substr(COALESCE(p.published_at, p.created_at), 1, 7) ym, COUNT(*) n FROM posts p WHERE ${stateSql[state]}${scope ? " AND " + scope.sql : ""} GROUP BY ym ORDER BY ym DESC`).all(...(scope ? scope.params : [])).filter((r) => r.ym);
}
const authors = (scope = null) => db.prepare(`SELECT DISTINCT u.id, u.username FROM posts p JOIN users u ON u.id = p.author_id WHERE p.deleted_at IS NULL${scope ? " AND " + scope.sql : ""} ORDER BY u.username COLLATE NOCASE`).all(...(scope ? scope.params : []));
const categoryTree = (scope = null) => taxonomy.tree("category", scope); // catégories en arbre (profondeur) pour le filtre
const tagList = (scope = null) => taxonomy.tree("tag", scope); // étiquettes du site (liste à plat) : modification rapide et actions groupées

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

// Import (palier 13) : écrit les champs d'un article importé, VALIDÉS et assainis ; jamais de publication, d'auteur ni de date importés.
// Liste blanche de colonnes ; le contenu passe par l'assainisseur du blog ; une révision « Import » garde l'état précédent.
const IMPORT_TEXT = { excerpt: 500, cover_alt: 200, seo_title: 120, seo_description: 300, focus_keyword: 80, secondary_keywords: 400, og_title: 120, og_description: 300, twitter_title: 120, twitter_description: 300, toc_title: 80 };
const IMPORT_IMG = /^\/uploads\/(?:thumbnails|blog|marketing\/\d{1,9})\/[A-Za-z0-9_.-]{1,200}$/;
function applyImported(id, f, userId) {
  const cur = get(id);
  if (!cur) throw new UserError("Article introuvable.");
  const { sanitizeBlogHtml, markdownToEditorHtml } = require("../utils/blogHtml");
  const cols = {};
  const text = (v, n) => String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, n);
  if (typeof f.title === "string" && f.title.trim()) cols.title = text(f.title, 150).replace(/\s+/g, " ").trim();
  if (typeof f.content === "string") { cols.content = sanitizeBlogHtml(f.content_format === "markdown" ? markdownToEditorHtml(f.content) : f.content).slice(0, 250000); cols.content_format = "html"; }
  const NOT_NULL_TEXT = new Set(["excerpt", "cover_alt", "focus_keyword", "secondary_keywords", "toc_title"]);
  for (const [k, n] of Object.entries(IMPORT_TEXT)) if (Object.hasOwn(f, k)) cols[k] = text(f[k], n) || (NOT_NULL_TEXT.has(k) ? "" : null);
  for (const k of ["cover_path", "og_image_path", "twitter_image_path"]) if (Object.hasOwn(f, k)) cols[k] = typeof f[k] === "string" && IMPORT_IMG.test(f[k]) ? f[k] : null;
  if (Object.hasOwn(f, "canonical_url")) cols.canonical_url = typeof f.canonical_url === "string" && /^https:\/\/[^\s"'<>]{3,300}$/i.test(f.canonical_url) ? f.canonical_url : null;
  if (["summary", "summary_large_image"].includes(f.twitter_card)) cols.twitter_card = f.twitter_card;
  if (typeof f.language === "string" && /^[a-z]{2}$/.test(f.language)) cols.language = f.language;
  if (typeof f.schema_type === "string" && /^[A-Za-z]{1,40}$/.test(f.schema_type)) cols.schema_type = f.schema_type;
  for (const k of ["robots_index", "robots_follow", "toc_enabled", "comments_enabled"]) if (f[k] === 0 || f[k] === 1) cols[k] = f[k];
  if (typeof f.toc_numbering === "string" && /^[a-z0-9]{1,10}$/.test(f.toc_numbering)) cols.toc_numbering = f.toc_numbering;
  for (const [k, max] of [["toc_depth", 4], ["reading_minutes", 600]]) if (Number.isInteger(f[k]) && f[k] >= 0 && f[k] <= max) cols[k] = f[k];
  const names = Object.keys(cols);
  if (!names.length) return cur;
  db.prepare(`UPDATE posts SET ${names.map((n) => `${n} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`).run(...names.map((n) => cols[n]), id);
  blog.addRevision(get(id), userId ?? null, "Import de contenu", "save");
  return get(id);
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

// Modification rapide (comme WordPress) : titre, adresse, catégories, étiquettes et état (brouillon / publié). Même validation que l'éditeur ;
// une nouvelle adresse garde l'ancienne en redirection si l'article était déjà en ligne. Les catégories et étiquettes doivent exister.
function quickEdit(id, { title, slug, categoryIds, tags, status } = {}, userId, req, allowTerm = null) {
  const p = get(id);
  if (!p) throw new UserError("Article introuvable.");
  if (p.deleted_at) throw new UserError("L'article est dans la corbeille : restaurez-le d'abord.");
  const cleanTitle = String(title ?? p.title).replace(/[\r\n\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 150);
  if (!cleanTitle) throw new UserError("Le titre de l'article est obligatoire.");
  const { slugify } = require("../utils/format");
  let newSlug = p.slug;
  if (slug !== undefined && String(slug).trim() && slugify(String(slug)).slice(0, 120).replace(/-+$/, "") !== p.slug) newSlug = blog.uniqueSlug(String(slug), id);
  if (categoryIds !== undefined) for (const t of taxonomy.uniqueIds(categoryIds)) if (allowTerm && !allowTerm(t)) throw new UserError("Catégorie introuvable.");
  transactionSync(() => {
    if (cleanTitle !== p.title || newSlug !== p.slug) {
      if (newSlug !== p.slug && p.published_at) { db.prepare("INSERT OR REPLACE INTO post_slug_history (old_slug, post_id) VALUES (?, ?)").run(p.slug, id); db.prepare("DELETE FROM post_slug_history WHERE old_slug = ?").run(newSlug); }
      db.prepare("UPDATE posts SET title = ?, slug = ?, updated_at = datetime('now') WHERE id = ?").run(cleanTitle, newSlug, id);
    }
    if (categoryIds !== undefined) taxonomy.setTerms("post", id, { categoryIds });
    if (tags !== undefined) taxonomy.assignByNames("post", id, { tags });
  });
  blog.addRevision(get(id), userId ?? null, "Modification rapide", "save");
  if (status === "published" && get(id).status !== "published") publish(id, userId, req);
  else if (status === "draft" && ["published", "scheduled"].includes(get(id).status)) unpublish(id, userId);
  return get(id);
}
const transactionSync = (fn) => require("../marketing/db/tx").transaction(db, fn);

// Participe passé au singulier et au pluriel (« 1 article publié », « 3 articles publiés »)
const ACTIONS = { publier: ["publié", "publiés"], depublier: ["remis en brouillon", "remis en brouillon"], corbeille: ["mis à la corbeille", "mis à la corbeille"], restaurer: ["restauré", "restaurés"], supprimer: ["supprimé définitivement", "supprimés définitivement"] };
// Actions groupées : chaque article est traité à part (un refus n'arrête pas les autres), avec le motif de chaque refus
function bulk(action, ids, userId, req, allow = null, extra = null) {
  if (!Object.hasOwn(ACTIONS, action) && !["categorie", "etiquette"].includes(action)) throw new UserError("Action inconnue.");
  const list = [...new Set([].concat(ids ?? []).flatMap((x) => String(x).split(",")).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 200);
  if (!list.length) throw new UserError("Sélectionnez au moins un article.");
  if (extra && ["categorie", "etiquette"].includes(action)) return bulkTerms(action, list, userId, extra, allow);
  const run = { publier: publish, depublier: unpublish, corbeille: trash, restaurer: restore, supprimer: (id) => purge(id) }[action];
  const done = [], failed = [];
  for (const id of list) {
    const p = get(id);
    try {
      if (!p || (allow && !allow(id))) throw new UserError("article introuvable"); // allow : portée de site (R6 lot 2)
      run(id, userId, req);
      done.push(id);
    } catch (e) {
      if (!(e instanceof UserError)) throw e;
      failed.push({ id, title: p ? p.title : `#${id}`, message: e.message.replace(/\.$/, "") });
    }
  }
  return { done, failed, label: ACTIONS[action] };
}

// Ajout d'une catégorie ou d'une étiquette (déjà existante) à plusieurs articles, sans toucher à leurs autres termes
function bulkTerms(action, list, userId, { termId }, allow) {
  const term = taxonomy.get(Number(termId));
  const kind = action === "categorie" ? "category" : "tag";
  if (!term || term.taxonomy !== kind) throw new UserError(kind === "category" ? "Choisissez une catégorie." : "Choisissez une étiquette.");
  const done = [], failed = [];
  for (const id of list) {
    const p = get(id);
    try {
      if (!p || (allow && !allow(id))) throw new UserError("article introuvable");
      if (p.deleted_at) throw new UserError("article dans la corbeille");
      const t = taxonomy.termsOf("post", id);
      if (kind === "category") { const ids = t.categories.map((c) => c.id); if (!ids.includes(term.id)) taxonomy.setTerms("post", id, { categoryIds: [...ids, term.id], primaryId: t.primary ? t.primary.id : undefined }); }
      else { const ids = t.tags.map((x) => x.id); if (!ids.includes(term.id)) taxonomy.setTerms("post", id, { tagIds: [...ids, term.id] }); }
      blog.addRevision(get(id), userId ?? null, `${kind === "category" ? "Catégorie" : "Étiquette"} ajoutée : ${term.name}`, "save");
      done.push(id);
    } catch (e) {
      if (!(e instanceof UserError)) throw e;
      failed.push({ id, title: p ? p.title : `#${id}`, message: e.message.replace(/\.$/, "") });
    }
  }
  return { done, failed, label: [`reçu « ${term.name} »`, `reçu « ${term.name} »`] };
}

module.exports = { STATES, months, tagList, quickEdit, clampPerPage, PER_PAGE_MIN, PER_PAGE_MAX, SORTS, PERIODS, PER_PAGE, counts, list, authors, categoryTree, get, createDraft, applyImported, duplicate, trash, restore, purge, publish, unpublish, bulk, ACTIONS };
