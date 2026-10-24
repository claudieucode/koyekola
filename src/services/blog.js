// Blog éditorial : lectures des pages publiques (catégories, étiquettes, populaires, récents, similaires, précédent/suivant,
// auteur, carte d'une formation citée) et services de l'éditeur (statuts et programmation, versions, sauvegarde automatique,
// médiathèque, recherche de liens internes, suggestions de maillage).
const db = require("../config/database");
const crypto = require("crypto");
const { removeUploadedFile } = require("../utils/uploads");
const fs = require("fs");
const path = require("path");
const { uploadsRoot } = require("../config/paths");
const { UserError } = require("../utils/errors");
const { slugify, formatPrice } = require("../utils/format");
const { escapeHtml } = require("../utils/markdown");
const { plainText } = require("../utils/seo");
const { renderArticle } = require("../utils/articleMarkdown");
const { renderBlogHtml, blogPlainText } = require("../utils/blogHtml");
const { norm } = require("../utils/seoAnalyzer");
const taxonomy = require("./taxonomy");

// Libellés de l'éditeur de blocs de WordPress (Gutenberg), en français
const STATUSES = { draft: "Brouillon", review: "En attente de relecture", scheduled: "Planifié", published: "Publié", archived: "Archivé" };
// Nombre de révisions gardées par article (les plus récentes) ; BLOG_MAX_REVISIONS=0 : aucune limite
const MAX_REVISIONS = (() => { const n = Number(process.env.BLOG_MAX_REVISIONS); return process.env.BLOG_MAX_REVISIONS !== undefined && Number.isInteger(n) && n >= 0 ? n : 100; })();

const MAX_TAGS = 10;
// Robots (moteurs, aperçus de liens, outils) : leurs visites ne comptent pas comme des lectures
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|java\/|headless|monitor|lighthouse/i;

const textOf = (post) => (post.content_format === "html" ? blogPlainText(post.content) : post.content);
const excerptOf = (post) => post.excerpt || plainText(textOf(post), 160);

// « Vidéo, montage , vidéo » → ["Vidéo", "montage"] (sans doublon, sans vide, 10 au plus, 40 caractères chacune)
function parseTags(text) {
  const seen = new Set();
  const tags = [];
  for (const raw of String(text || "").split(",")) {
    const tag = raw.replace(/\s+/g, " ").trim().slice(0, 40);
    const key = slugify(tag);
    if (!tag || !key || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= MAX_TAGS) break;
  }
  return tags;
}

const card = (p) => ({
  id: p.id, slug: p.slug, title: p.title, summary: excerptOf(p), cover_path: p.cover_path, cover_alt: p.cover_alt, published_at: p.published_at,
  category: p.category, categorySlug: p.category ? taxonomy.categorySlugOfName(p.category) : "", views: p.views,
});

function categories(scope = null) {
  return db
    .prepare(`SELECT category, COUNT(*) n FROM posts WHERE published = 1 AND category <> ''${scope ? " AND " + scope.sql : ""} GROUP BY category COLLATE NOCASE ORDER BY n DESC, category COLLATE NOCASE`)
    .all(...(scope ? scope.params : []))
    .map((r) => ({ name: r.category, slug: taxonomy.categorySlugOfName(r.category), count: r.n }));
}

// Nom réel d'une catégorie à partir de son adresse (« marketing-digital » → « Marketing digital »)
function categoryBySlug(slug) {
  return categories().find((c) => c.slug === slug) || null;
}

// scope : fragment SQL de portée de domaine (urls.contentScope, sur « posts.id ») ; absent = comportement d'origine
function popular(limit = 4, exceptId = 0, scope = null) {
  return db.prepare(`SELECT * FROM posts WHERE published = 1 AND id != ? AND views > 0${scope ? " AND " + scope.sql : ""} ORDER BY views DESC, published_at DESC LIMIT ?`).all(exceptId, ...(scope ? scope.params : []), limit).map(card);
}

function recent(limit = 4, exceptId = 0, scope = null) {
  return db.prepare(`SELECT * FROM posts WHERE published = 1 AND id != ?${scope ? " AND " + scope.sql : ""} ORDER BY published_at DESC, id DESC LIMIT ?`).all(exceptId, ...(scope ? scope.params : []), limit).map(card);
}

// Articles similaires : même catégorie (+3) et étiquettes communes (+2 chacune), puis les plus récents pour compléter
function similar(post, limit = 3, scope = null) {
  const tags = new Set(parseTags(post.tags).map(slugify));
  const category = slugify(post.category || "");
  const scored = db
    .prepare(`SELECT * FROM posts WHERE published = 1 AND id != ?${scope ? " AND " + scope.sql : ""} ORDER BY published_at DESC, id DESC LIMIT 200`)
    .all(post.id, ...(scope ? scope.params : []))
    .map((p) => {
      let score = 0;
      if (category && slugify(p.category || "") === category) score += 3;
      for (const t of parseTags(p.tags)) if (tags.has(slugify(t))) score += 2;
      return { p, score };
    });
  const relevant = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  const rest = scored.filter((s) => s.score === 0);
  return [...relevant, ...rest].slice(0, limit).map((s) => card(s.p));
}

// Précédent = plus ancien, suivant = plus récent (ordre de publication)
function neighbours(post, scope = null) {
  if (!post.published || !post.published_at) return { previous: null, next: null };
  const extra = scope ? " AND " + scope.sql : "", sp = scope ? scope.params : [];
  const previous = db.prepare(`SELECT * FROM posts WHERE published = 1 AND (published_at < ? OR (published_at = ? AND id < ?))${extra} ORDER BY published_at DESC, id DESC LIMIT 1`).get(post.published_at, post.published_at, post.id, ...sp);
  const next = db.prepare(`SELECT * FROM posts WHERE published = 1 AND (published_at > ? OR (published_at = ? AND id > ?))${extra} ORDER BY published_at ASC, id ASC LIMIT 1`).get(post.published_at, post.published_at, post.id, ...sp);
  return { previous: previous ? card(previous) : null, next: next ? card(next) : null };
}

// Auteur : celui choisi pour l'article, sinon le premier formateur (comportement d'origine)
function authorOf(post) {
  const fields = "id, username, bio, avatar_path";
  const chosen = post.author_id ? db.prepare(`SELECT ${fields} FROM users WHERE id = ? AND role = 'formateur'`).get(post.author_id) : null;
  const author = chosen || db.prepare(`SELECT ${fields} FROM users WHERE role = 'formateur' ORDER BY id LIMIT 1`).get();
  if (!author) return null;
  const count = db.prepare("SELECT COUNT(*) n FROM posts WHERE published = 1 AND (author_id = ? OR (author_id IS NULL AND ? = (SELECT MIN(id) FROM users WHERE role = 'formateur')))").get(author.id, author.id).n;
  return { ...author, postCount: count };
}

function instructors() {
  return db.prepare("SELECT id, username FROM users WHERE role = 'formateur' ORDER BY username COLLATE NOCASE").all();
}

// Carte d'une formation citée dans un article par [[formation:adresse]] : seulement si elle est publiée et en vente
function courseCard(slug) {
  const c = db.prepare("SELECT title, slug, subtitle, price_cents, thumbnail_path FROM courses WHERE slug = ? AND published = 1 AND archived = 0").get(slug);
  if (!c) return null;
  const img = c.thumbnail_path ? `<img src="${escapeHtml(c.thumbnail_path)}" alt="" loading="lazy" decoding="async" width="160" height="90">` : "";
  return `<aside class="article-course" aria-label="Formation recommandée">${img}<div class="article-course-body"><p class="article-course-label">Formation recommandée</p>`
    + `<p class="article-course-title"><a href="/cours/${escapeHtml(c.slug)}">${escapeHtml(c.title)}</a></p>`
    + (c.subtitle ? `<p class="article-course-sub">${escapeHtml(c.subtitle)}</p>` : "")
    + `<p class="article-course-price">${escapeHtml(formatPrice(c.price_cents))} · <a href="/cours/${escapeHtml(c.slug)}">Découvrir la formation</a></p></div></aside>`;
}

// Rendu public : Markdown (anciens articles) ou texte riche de l'éditeur
function renderPost(post, { newsletterHtml = null } = {}) {
  const imageSize = (src) => db.prepare("SELECT width, height FROM media WHERE path = ?").get(String(src || ""));
  if (post.content_format === "html") return renderBlogHtml(post.content, { courseCard, newsletterHtml, tocDepth: [2, 3, 4].includes(post.toc_depth) ? post.toc_depth : 3, imageSize, imageVariants, reusableHtml: (id) => require("./reusableBlocks").syncedHtml(id) });
  const r = renderArticle(post.content, { courseCard });
  return { ...r, toc: post.toc_depth === 2 ? r.toc.filter((t) => t.level === 2) : r.toc, faq: [], howto: [], links: [] };
}

// ---------- Statuts et programmation ----------
// Un article programmé dont l'heure est passée devient publié (appelé avant chaque lecture publique du blog)
function promoteScheduled() {
  db.prepare("UPDATE posts SET status = 'published', published = 1 WHERE status = 'scheduled' AND deleted_at IS NULL AND published_at IS NOT NULL AND published_at <= datetime('now')").run();
}

// Adresse d'un article : tirée du titre (ou saisie), rendue unique : « titre », « titre-2 », « titre-3 »… ; les anciennes adresses
// (historique des redirections) ne sont jamais réattribuées à un autre article
function uniqueSlug(title, exceptId = 0) {
  const base = slugify(title).slice(0, 120).replace(/-+$/, "") || "article";
  let slug = base;
  const taken = (s) => db.prepare("SELECT 1 FROM posts WHERE slug = ? AND id != ?").get(s, exceptId) || db.prepare("SELECT 1 FROM post_slug_history WHERE old_slug = ? AND post_id != ?").get(s, exceptId);
  for (let n = 2; taken(slug); n++) slug = `${base}-${n}`;
  return slug;
}

// ---------- Catégories et étiquettes sans doublon ----------
// « marketing digital », « Marketing Digital » et « Marketing  digital » désignent la même catégorie : l'orthographe déjà utilisée gagne
function canonicalCategory(name, exceptId = 0) {
  const clean = String(name || "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!clean) return "";
  const existing = db.prepare("SELECT DISTINCT category FROM posts WHERE category <> '' AND id != ?").all(exceptId).map((r) => r.category).find((c) => slugify(c) === slugify(clean));
  return existing || clean;
}
function canonicalSubcategory(category, name, exceptId = 0) {
  const clean = String(name || "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!clean || !category) return "";
  const existing = db.prepare("SELECT DISTINCT subcategory FROM posts WHERE category = ? COLLATE NOCASE AND subcategory <> '' AND id != ?").all(category, exceptId).map((r) => r.subcategory).find((c) => slugify(c) === slugify(clean));
  return existing || clean;
}
function allTags() {
  const seen = new Map();
  for (const row of db.prepare("SELECT tags FROM posts WHERE tags <> ''").all()) for (const t of parseTags(row.tags)) if (!seen.has(slugify(t))) seen.set(slugify(t), t);
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "fr"));
}
function canonicalTags(text) {
  const known = new Map(allTags().map((t) => [slugify(t), t]));
  return parseTags(text).map((t) => known.get(slugify(t)) || t).join(", ");
}
function subcategories() {
  return db.prepare("SELECT DISTINCT category, subcategory FROM posts WHERE category <> '' AND subcategory <> '' ORDER BY category, subcategory").all();
}

// ---------- Versions (révisions) ----------
// Une révision = l'état complet de l'article APRÈS un enregistrement : contenu, titre, résumé et réglages (meta).
// La plus récente est donc toujours la version actuelle ; un enregistrement sans aucun changement n'en crée pas.
const REVISION_META = ["slug", "status", "published_at", "category", "subcategory", "tags", "author_id", "cover_path", "cover_alt",
  "seo_title", "seo_description", "focus_keyword", "secondary_keywords", "canonical_url", "robots_index", "robots_follow", "schema_type",
  "og_title", "og_description", "og_image_path", "twitter_card", "twitter_title", "twitter_description", "twitter_image_path",
  "reading_minutes", "language", "featured", "toc_enabled", "toc_depth", "toc_numbering", "toc_title", "comments_enabled"];
// Restaurer une révision rend son contenu et ses réglages, mais jamais l'état de publication ni l'adresse (statut, date, slug) :
// restaurer ne met pas un article hors ligne et ne casse pas les liens déjà partagés.
const NOT_RESTORED = new Set(["slug", "status", "published_at"]);
const RESTORED_META = REVISION_META.filter((k) => !NOT_RESTORED.has(k));
const REVISION_KINDS = { create: "Création", save: "Modification manuelle", publish: "Publication", schedule: "Planification", status: "Changement de statut", restore: "Restauration", before_restore: "Avant restauration" };
const metaOf = (post) => Object.fromEntries(REVISION_META.map((k) => [k, post[k] ?? null]));
const revisionFingerprint = (post) => crypto.createHash("sha1").update(JSON.stringify([post.title, post.excerpt || "", post.content || "", post.content_format || "markdown", metaOf(post)])).digest("hex");
// Type d'une révision d'après le changement de statut (publication, planification…), sinon modification manuelle
function revisionKind(before, after) {
  if (!before) return "create";
  if (before.status === after.status) return "save";
  return after.status === "published" ? "publish" : after.status === "scheduled" ? "schedule" : "status";
}
// Enregistre une révision ; renvoie son identifiant, ou null si rien n'a changé depuis la dernière (pas de doublon)
function addRevision(post, userId, note, kind = "save") {
  const fingerprint = revisionFingerprint(post);
  const last = db.prepare("SELECT fingerprint FROM post_revisions WHERE post_id = ? ORDER BY id DESC LIMIT 1").get(post.id);
  if (last && last.fingerprint === fingerprint) return null;
  const info = db.prepare("INSERT INTO post_revisions (post_id, user_id, title, excerpt, content, content_format, note, meta, kind, fingerprint) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(post.id, userId ?? null, post.title, post.excerpt || "", post.content || "", post.content_format || "markdown", String(note || "").slice(0, 300), JSON.stringify(metaOf(post)), Object.hasOwn(REVISION_KINDS, kind) ? kind : "save", fingerprint);
  if (MAX_REVISIONS) {
    const dropped = db.prepare("SELECT meta FROM post_revisions WHERE post_id = ? AND id NOT IN (SELECT id FROM post_revisions WHERE post_id = ? ORDER BY id DESC LIMIT ?)").all(post.id, post.id, MAX_REVISIONS);
    if (dropped.length) {
      db.prepare("DELETE FROM post_revisions WHERE post_id = ? AND id NOT IN (SELECT id FROM post_revisions WHERE post_id = ? ORDER BY id DESC LIMIT ?)").run(post.id, post.id, MAX_REVISIONS);
      for (const p of revisionImages(dropped)) releaseImage(p); // images qui n'étaient plus gardées que pour ces révisions
    }
  }
  if (kind === "publish") require("./writing").sweepSoon(); // notifications de première publication (arrière-plan)
  return Number(info.lastInsertRowid);
}
// Images (couverture, Facebook, X) citées par des révisions
const IMAGE_META = ["cover_path", "og_image_path", "twitter_image_path"];
function revisionImages(rows) {
  const out = new Set();
  for (const r of rows) { let m = {}; try { m = JSON.parse(r.meta || "{}") || {}; } catch { m = {}; } for (const k of IMAGE_META) if (m[k]) out.add(m[k]); }
  return [...out];
}
// ---------- Où une image envoyée est-elle encore citée ? ----------
// TOUT ce qui peut contenir une adresse /uploads/… : article (couverture, partage, texte), révisions (texte et réglages),
// sauvegardes automatiques, blocs réutilisables, corbeille des blocs, pages du site, formations, leçons, FAQ, modèles
// d'e-mails (et leurs versions), campagnes envoyées. Une image citée quelque part n'est JAMAIS supprimée.
// (Les tables absentes — module pas encore initialisé — sont simplement ignorées.)
const likeOf = (p) => `%${String(p).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
const IMAGE_REFERENCES = [
  ["SELECT title AS label FROM posts WHERE cover_path = ?1 OR og_image_path = ?1 OR twitter_image_path = ?1 OR content LIKE ?2 ESCAPE '\\'", (r) => `Article « ${r.label} »`],
  ["SELECT DISTINCT p.title AS label FROM post_revisions r JOIN posts p ON p.id = r.post_id WHERE r.content LIKE ?2 ESCAPE '\\' OR r.meta LIKE ?3 ESCAPE '\\'", (r) => `Révision de « ${r.label} »`],
  ["SELECT DISTINCT COALESCE(p.title, 'nouvel article') AS label FROM post_autosaves a LEFT JOIN posts p ON p.id = a.post_id WHERE a.payload LIKE ?2 ESCAPE '\\' OR a.payload LIKE ?3 ESCAPE '\\'", (r) => `Sauvegarde automatique de « ${r.label} »`],
  ["SELECT name AS label FROM blog_reusable_blocks WHERE content LIKE ?2 ESCAPE '\\' OR content LIKE ?3 ESCAPE '\\'", (r) => `Bloc réutilisable « ${r.label} »`],
  ["SELECT DISTINCT label FROM blog_block_trash WHERE node LIKE ?2 ESCAPE '\\' OR node LIKE ?3 ESCAPE '\\'", (r) => `Corbeille des blocs (${r.label || "bloc"})`],
  ["SELECT title AS label FROM site_pages WHERE content LIKE ?2 ESCAPE '\\'", (r) => `Page « ${r.label} »`],
  ["SELECT title AS label FROM courses WHERE thumbnail_path = ?1 OR description LIKE ?2 ESCAPE '\\'", (r) => `Formation « ${r.label} »`],
  ["SELECT title AS label FROM lessons WHERE description LIKE ?2 ESCAPE '\\'", (r) => `Leçon « ${r.label} »`],
  ["SELECT question AS label FROM faqs WHERE answer LIKE ?2 ESCAPE '\\'", (r) => `FAQ « ${r.label} »`],
  ["SELECT name AS label FROM mk_templates WHERE blocks LIKE ?2 ESCAPE '\\'", (r) => `Modèle d'e-mail « ${r.label} »`],
  ["SELECT DISTINCT t.name AS label FROM mk_template_versions v JOIN mk_templates t ON t.id = v.template_id WHERE v.snapshot LIKE ?2 ESCAPE '\\'", (r) => `Version du modèle d'e-mail « ${r.label} »`],
  ["SELECT name AS label FROM mk_campaigns WHERE snapshot LIKE ?2 ESCAPE '\\'", (r) => `Campagne « ${r.label} »`],
];
function imageReferences(p) {
  if (!p) return [];
  const exact = String(p), like = likeOf(p), likeJson = likeOf(JSON.stringify(String(p)).slice(1, -1)); // texte brut et texte dans du JSON
  const found = [];
  for (const [sql, label] of IMAGE_REFERENCES) {
    let rows = [];
    // ?1 ?2 ?3 → « ? » simples, valeurs données dans l'ordre d'apparition : node:sqlite lie mal les paramètres numérotés
    // sur certaines versions de Node 22 (« column index out of range » → erreur 500 de la médiathèque)
    const args = [];
    const plain = sql.replace(/\?(\d)/g, (_, n) => { args.push([exact, like, likeJson][Number(n) - 1]); return "?"; });
    try { rows = db.prepare(plain).all(...args); } catch (e) { if (!/no such table/i.test(e.message)) throw e; continue; }
    for (const r of rows) found.push(label(r));
  }
  return [...new Set(found)];
}
// Image envoyée qui n'est plus citée nulle part (voir imageReferences) : supprimée du disque et de la médiathèque.
// Tant qu'une révision, une sauvegarde automatique, un bloc ou un e-mail la cite, elle est gardée.
function releaseImage(p) {
  if (!p || imageReferences(p).length) return false;
  // Les fichiers de la médiathèque du CMS lui appartiennent : un article qui change d'image ne les efface jamais
  if (/^\/uploads\/marketing\//.test(String(p))) return false;
  db.prepare("DELETE FROM media WHERE path = ?").run(p);
  removeUploadedFile(p, "image remplacée ou article supprimé, citée nulle part ailleurs");
  return true;
}
// Résumé d'une modification (« Titre modifié · Contenu : +120 mots · Statut : Publié »)
function describeChange(before, after) {
  const parts = [];
  if (!before) return "Création de l'article";
  if (before.title !== after.title) parts.push("Titre modifié");
  if ((before.excerpt || "") !== (after.excerpt || "")) parts.push("Résumé modifié");
  if ((before.content || "") !== (after.content || "")) {
    const count = (p) => (String(textOf(p)).match(/[\p{L}\p{N}’']+/gu) || []).length;
    const delta = count(after) - count(before);
    parts.push(`Contenu modifié${delta ? ` (${delta > 0 ? "+" : ""}${delta} mots)` : ""}`);
  }
  if (before.status !== after.status) parts.push(`Statut : ${STATUSES[after.status] || after.status}`);
  if ((before.seo_title || "") !== (after.seo_title || "") || (before.seo_description || "") !== (after.seo_description || "")) parts.push("Référencement modifié");
  if ((before.category || "") !== (after.category || "") || (before.subcategory || "") !== (after.subcategory || "")) parts.push("Catégorie modifiée");
  if ((before.tags || "") !== (after.tags || "")) parts.push("Étiquettes modifiées");
  if ((before.cover_path || "") !== (after.cover_path || "")) parts.push("Image mise en avant modifiée");
  if (before.slug !== after.slug) parts.push("Adresse modifiée");
  return parts.join(" · ") || "Réglages modifiés";
}
// Révisions d'un article, des plus récentes aux plus anciennes, par pages (before : identifiant de la dernière révision déjà affichée)
function listRevisions(postId, { before = 0, limit = 30 } = {}) {
  const n = Math.min(Math.max(Number(limit) || 30, 1), 100);
  return db.prepare(`SELECT r.id, r.title, r.note, r.kind, r.created_at, r.content_format, u.username AS author FROM post_revisions r LEFT JOIN users u ON u.id = r.user_id
    WHERE r.post_id = ? ${before ? "AND r.id < ?" : ""} ORDER BY r.id DESC LIMIT ?`).all(...[postId, ...(before ? [Number(before)] : []), n])
    .map((r) => ({ ...r, kindLabel: REVISION_KINDS[r.kind] || REVISION_KINDS.save }));
}
const countRevisions = (postId) => db.prepare("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?").get(postId).n;
// Une révision de CET article uniquement (jamais celle d'un autre), réglages décodés
function getRevision(postId, id) {
  if (!Number.isInteger(id) || id <= 0) return null;
  const r = db.prepare("SELECT r.*, u.username AS author FROM post_revisions r LEFT JOIN users u ON u.id = r.user_id WHERE r.post_id = ? AND r.id = ?").get(postId, id);
  if (!r) return null;
  let meta = {};
  try { meta = JSON.parse(r.meta || "{}") || {}; } catch { meta = {}; }
  return { ...r, meta, kindLabel: REVISION_KINDS[r.kind] || REVISION_KINDS.save };
}

// ---------- Sauvegarde automatique ----------
function getAutosave(postId) {
  const row = db.prepare("SELECT payload, saved_at FROM post_autosaves WHERE post_id = ?").get(postId);
  if (!row) return null;
  try { return { data: JSON.parse(row.payload), saved_at: row.saved_at }; } catch { return null; }
}
function setAutosave(postId, userId, data) {
  const payload = JSON.stringify(data).slice(0, 400000);
  db.prepare("INSERT INTO post_autosaves (post_id, user_id, payload, saved_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(post_id) DO UPDATE SET user_id = excluded.user_id, payload = excluded.payload, saved_at = excluded.saved_at").run(postId, userId ?? null, payload);
  return db.prepare("SELECT saved_at FROM post_autosaves WHERE post_id = ?").get(postId).saved_at;
}
const clearAutosave = (postId) => db.prepare("DELETE FROM post_autosaves WHERE post_id = ?").run(postId);

// ---------- Médiathèque ----------
function listMedia({ q = "", kind = "", limit = 60 } = {}) {
  const where = ["1 = 1"];
  const params = [];
  if (["image", "video", "audio"].includes(kind)) { where.push("kind = ?"); params.push(kind); }
  else where.push("kind IN ('image', 'video', 'audio')"); // les documents (PDF, Centre de gestion → Ressources) ne s'insèrent pas comme médias
  if (q) { where.push("(alt LIKE ? OR title LIKE ? OR caption LIKE ? OR path LIKE ?)"); const like = `%${String(q).slice(0, 80)}%`; params.push(like, like, like, like); }
  return db.prepare(`SELECT * FROM media WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT ?`).all(...params, Math.min(200, limit));
}
function addMedia({ path, kind, mime, size, width, height, alt = "", title = "", userId }) {
  const info = db.prepare("INSERT INTO media (path, kind, mime, size, width, height, alt, title, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(path, kind, mime || "", size || 0, width || null, height || null, alt, title, userId ?? null);
  return db.prepare("SELECT * FROM media WHERE id = ?").get(Number(info.lastInsertRowid));
}
const getMedia = (id) => db.prepare("SELECT * FROM media WHERE id = ?").get(id);
const mediaByPath = (p) => db.prepare("SELECT * FROM media WHERE path = ?").get(p);
function updateMedia(id, fields) {
  const one = (v, max) => String(v ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, max);
  db.prepare("UPDATE media SET alt = ?, title = ?, description = ?, caption = ?, credit = ? WHERE id = ?")
    .run(one(fields.alt, 300), one(fields.title, 200), one(fields.description, 1000), one(fields.caption, 300), one(fields.credit, 200), id);
  return getMedia(id);
}
// Articles qui utilisent un fichier (image principale, partage, contenu)
function mediaUsage(p) {
  return db.prepare("SELECT id, title FROM posts WHERE cover_path = ? OR og_image_path = ? OR twitter_image_path = ? OR content LIKE ? ESCAPE '\\'").all(p, p, p, likeOf(p));
}

// ---------- Liens internes : recherche et suggestions ----------
const PAGES = [
  { title: "Accueil", url: "/" }, { title: "Catalogue des formations", url: "/catalogue" }, { title: "Blog", url: "/blog" },
  { title: "Contact", url: "/contact" }, { title: "À propos", url: "/a-propos" },
];
function searchLinks(q, limit = 8) {
  const needle = norm(q);
  const match = (title) => !needle || norm(title).includes(needle);
  const results = [];
  for (const p of db.prepare("SELECT id, title, slug FROM posts WHERE published = 1 ORDER BY published_at DESC LIMIT 300").all()) if (match(p.title)) results.push({ type: "article", label: "Article", title: p.title, url: require("./urls").publicPath("post", p) });
  for (const c of db.prepare("SELECT title, slug FROM courses WHERE published = 1 AND archived = 0 ORDER BY title LIMIT 300").all()) if (match(c.title)) results.push({ type: "formation", label: "Formation", title: c.title, url: `/cours/${c.slug}` });
  for (const c of categories()) if (match(c.name)) results.push({ type: "categorie", label: "Catégorie du blog", title: c.name, url: `/blog/categorie/${c.slug}` });
  for (const p of PAGES) if (match(p.title)) results.push({ type: "page", label: "Page", title: p.title, url: p.url });
  const order = { formation: 0, article: 1, categorie: 2, page: 3 };
  return results.sort((a, b) => order[a.type] - order[b.type]).slice(0, limit);
}

// Mots significatifs d'un titre (sans les petits mots) : « Bien démarrer avec DaVinci Resolve » → davinci, resolve, demarrer
const STOP = new Set("le la les un une des du de d l et ou en au aux a pour par sur dans avec sans vos votre nos notre son sa ses ce cette ces qui que quoi comment pourquoi est sont plus tout tous bien faire".split(" "));
const keywordsOf = (title) => norm(title).split(" ").filter((w) => w.length > 3 && !STOP.has(w));

// Suggestions de liens internes : contenus du site dont les mots importants apparaissent dans le texte. Jamais insérées
// automatiquement : l'éditeur les propose, l'auteur choisit.
function suggestLinks({ text = "", postId = 0, alreadyLinked = [] } = {}) {
  const body = ` ${norm(text)} `;
  const linked = new Set(alreadyLinked);
  const out = [];
  const consider = (type, label, title, url) => {
    if (linked.has(url)) return;
    const kws = keywordsOf(title);
    const hits = kws.filter((k) => body.includes(` ${k} `));
    if (!kws.length || !hits.length) return;
    const score = hits.length / kws.length + (hits.length >= 2 ? 0.5 : 0) + (type === "formation" ? 0.3 : 0);
    if (score >= 0.5) out.push({ type, label, title, url, score: Math.round(score * 100) / 100, reason: `Le texte parle de « ${hits.slice(0, 3).join(", ")} »` });
  };
  for (const c of db.prepare("SELECT title, slug FROM courses WHERE published = 1 AND archived = 0").all()) consider("formation", "Formation", c.title, `/cours/${c.slug}`);
  for (const p of db.prepare("SELECT id, title, slug FROM posts WHERE published = 1 AND id != ?").all(postId)) consider("article", "Article", p.title, require("./urls").publicPath("post", p));
  for (const c of categories()) consider("categorie", "Catégorie", c.name, `/blog/categorie/${c.slug}`);
  if (/ formation| cours| apprendre/.test(body) && !linked.has("/catalogue")) out.push({ type: "page", label: "Page", title: "Catalogue des formations", url: "/catalogue", score: 0.4, reason: "Page importante : l'article parle de formation" });
  return out.sort((a, b) => b.score - a.score).slice(0, 8);
}

// Une lecture : ni le formateur (qui relit), ni un robot
function countView(post, req) {
  if (!post.published) return;
  if (req.session.user && req.session.user.role === "formateur") return;
  if (BOT.test(String(req.get("user-agent") || "")) || !req.get("user-agent")) return;
  db.prepare("UPDATE posts SET views = views + 1 WHERE id = ?").run(post.id);
}

// ---------- Commentaires : moteur générique (src/services/comments.js) ; ces fonctions gardent l'API historique ----------
const comments = require("./comments");
const COMMENT_MAX = comments.COMMENT_MAX;
const listComments = (postId, opts) => comments.thread("post", postId, opts);
const countComments = (postId) => comments.count("post", postId);
const getComment = (id) => comments.get(id);
const deleteComment = (id) => comments.purge(id);

// Versions réduites (WebP) réellement présentes sur le disque pour une image du site : [{ src, w }]
const variantCache = new Map();
function imageVariants(src) {
  const m = /^\/uploads\/thumbnails\/([A-Za-z0-9_-]{1,190})\.(?:png|jpe?g|webp|avif)$/i.exec(String(src || ""));
  if (!m) return [];
  const now = Date.now();
  const hit = variantCache.get(src);
  if (hit && now - hit.at < 60000) return hit.list;
  const list = [480, 960, 1600].filter((w) => fs.existsSync(path.join(uploadsRoot, "thumbnails", `${m[1]}-${w}w.webp`))).map((w) => ({ src: `/uploads/thumbnails/${m[1]}-${w}w.webp`, w }));
  variantCache.set(src, { at: now, list });
  return list;
}

module.exports = {
  imageVariants,
  listComments, countComments, getComment, deleteComment, COMMENT_MAX,
  STATUSES, parseTags, excerptOf, textOf, categories, categoryBySlug, subcategories, allTags, canonicalCategory, canonicalSubcategory, canonicalTags,
  popular, recent, similar, neighbours, authorOf, instructors, courseCard, renderPost, countView, card, promoteScheduled, uniqueSlug,
  addRevision, describeChange, revisionKind, revisionFingerprint, listRevisions, countRevisions, getRevision, metaOf, revisionImages, releaseImage, REVISION_META, RESTORED_META, REVISION_KINDS, MAX_REVISIONS, getAutosave, setAutosave, clearAutosave,
  listMedia, addMedia, getMedia, mediaByPath, updateMedia, mediaUsage, imageReferences, searchLinks, suggestLinks, PAGES,
};
