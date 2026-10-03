// Blog éditorial : lectures des pages publiques (catégories, étiquettes, populaires, récents, similaires, précédent/suivant,
// auteur, carte d'une formation citée) et services de l'éditeur (statuts et programmation, versions, sauvegarde automatique,
// médiathèque, recherche de liens internes, suggestions de maillage).
const db = require("../config/database");
const { UserError } = require("../utils/errors");
const { slugify, formatPrice } = require("../utils/format");
const { escapeHtml } = require("../utils/markdown");
const { plainText } = require("../utils/seo");
const { renderArticle } = require("../utils/articleMarkdown");
const { renderBlogHtml, blogPlainText } = require("../utils/blogHtml");
const { norm } = require("../utils/seoAnalyzer");

// Libellés de l'éditeur de blocs de WordPress (Gutenberg), en français
const STATUSES = { draft: "Brouillon", review: "En attente de relecture", scheduled: "Planifié", published: "Publié", archived: "Archivé" };
const MAX_REVISIONS = 50;

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
  category: p.category, categorySlug: p.category ? slugify(p.category) : "", views: p.views,
});

function categories() {
  return db
    .prepare("SELECT category, COUNT(*) n FROM posts WHERE published = 1 AND category <> '' GROUP BY category COLLATE NOCASE ORDER BY n DESC, category COLLATE NOCASE")
    .all()
    .map((r) => ({ name: r.category, slug: slugify(r.category), count: r.n }));
}

// Nom réel d'une catégorie à partir de son adresse (« marketing-digital » → « Marketing digital »)
function categoryBySlug(slug) {
  return categories().find((c) => c.slug === slug) || null;
}

function popular(limit = 4, exceptId = 0) {
  return db.prepare("SELECT * FROM posts WHERE published = 1 AND id != ? AND views > 0 ORDER BY views DESC, published_at DESC LIMIT ?").all(exceptId, limit).map(card);
}

function recent(limit = 4, exceptId = 0) {
  return db.prepare("SELECT * FROM posts WHERE published = 1 AND id != ? ORDER BY published_at DESC, id DESC LIMIT ?").all(exceptId, limit).map(card);
}

// Articles similaires : même catégorie (+3) et étiquettes communes (+2 chacune), puis les plus récents pour compléter
function similar(post, limit = 3) {
  const tags = new Set(parseTags(post.tags).map(slugify));
  const category = slugify(post.category || "");
  const scored = db
    .prepare("SELECT * FROM posts WHERE published = 1 AND id != ? ORDER BY published_at DESC, id DESC LIMIT 200")
    .all(post.id)
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
function neighbours(post) {
  if (!post.published || !post.published_at) return { previous: null, next: null };
  const previous = db.prepare("SELECT * FROM posts WHERE published = 1 AND (published_at < ? OR (published_at = ? AND id < ?)) ORDER BY published_at DESC, id DESC LIMIT 1").get(post.published_at, post.published_at, post.id);
  const next = db.prepare("SELECT * FROM posts WHERE published = 1 AND (published_at > ? OR (published_at = ? AND id > ?)) ORDER BY published_at ASC, id ASC LIMIT 1").get(post.published_at, post.published_at, post.id);
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
  if (post.content_format === "html") return renderBlogHtml(post.content, { courseCard, newsletterHtml, tocDepth: post.toc_depth === 2 ? 2 : 3, imageSize });
  const r = renderArticle(post.content, { courseCard });
  return { ...r, toc: post.toc_depth === 2 ? r.toc.filter((t) => t.level === 2) : r.toc, faq: [], howto: [], links: [] };
}

// ---------- Statuts et programmation ----------
// Un article programmé dont l'heure est passée devient publié (appelé avant chaque lecture publique du blog)
function promoteScheduled() {
  db.prepare("UPDATE posts SET status = 'published', published = 1 WHERE status = 'scheduled' AND published_at IS NOT NULL AND published_at <= datetime('now')").run();
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

// ---------- Versions ----------
function addRevision(post, userId, note) {
  db.prepare("INSERT INTO post_revisions (post_id, user_id, title, excerpt, content, content_format, note) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(post.id, userId ?? null, post.title, post.excerpt || "", post.content || "", post.content_format || "markdown", String(note || "").slice(0, 300));
  // On garde les 50 plus récentes
  db.prepare("DELETE FROM post_revisions WHERE post_id = ? AND id NOT IN (SELECT id FROM post_revisions WHERE post_id = ? ORDER BY id DESC LIMIT ?)").run(post.id, post.id, MAX_REVISIONS);
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
  return parts.join(" · ") || "Réglages modifiés";
}
function listRevisions(postId) {
  return db.prepare("SELECT r.id, r.title, r.note, r.created_at, r.content_format, u.username AS author FROM post_revisions r LEFT JOIN users u ON u.id = r.user_id WHERE r.post_id = ? ORDER BY r.id DESC").all(postId);
}
const getRevision = (postId, id) => db.prepare("SELECT * FROM post_revisions WHERE post_id = ? AND id = ?").get(postId, id);

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
  const like = `%${p}%`;
  return db.prepare("SELECT id, title FROM posts WHERE cover_path = ? OR og_image_path = ? OR twitter_image_path = ? OR content LIKE ?").all(p, p, p, like);
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
  for (const p of db.prepare("SELECT title, slug FROM posts WHERE published = 1 ORDER BY published_at DESC LIMIT 300").all()) if (match(p.title)) results.push({ type: "article", label: "Article", title: p.title, url: `/blog/${p.slug}` });
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
  for (const p of db.prepare("SELECT title, slug FROM posts WHERE published = 1 AND id != ?").all(postId)) consider("article", "Article", p.title, `/blog/${p.slug}`);
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

// ---------- Commentaires (membres connectés, texte brut) ----------
const COMMENT_MAX = 2000;
function listComments(postId) {
  return db.prepare(`SELECT c.id, c.body, c.created_at, c.user_id, u.username, u.avatar_path, u.role
    FROM blog_comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.created_at, c.id`).all(postId);
}
function countComments(postId) { return db.prepare("SELECT COUNT(*) n FROM blog_comments WHERE post_id = ?").get(postId).n; }
// Texte nettoyé : espaces superflus retirés, 3 sauts de ligne au plus d'affilée, longueur bornée
function cleanComment(text) {
  return String(text || "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function addComment(postId, userId, text) {
  const body = cleanComment(text);
  if (body.length < 2) throw new UserError("Votre commentaire est vide.");
  if (body.length > COMMENT_MAX) throw new UserError(`Votre commentaire dépasse ${COMMENT_MAX} caractères.`);
  // Même texte déjà publié par la même personne sur cet article : pas de doublon (double clic, rechargement)
  const twin = db.prepare("SELECT id FROM blog_comments WHERE post_id = ? AND user_id = ? AND body = ?").get(postId, userId, body);
  if (twin) return twin.id;
  return Number(db.prepare("INSERT INTO blog_comments (post_id, user_id, body) VALUES (?, ?, ?)").run(postId, userId, body).lastInsertRowid);
}
function getComment(id) { return db.prepare("SELECT * FROM blog_comments WHERE id = ?").get(id); }
function deleteComment(id) { db.prepare("DELETE FROM blog_comments WHERE id = ?").run(id); }

module.exports = {
  listComments, countComments, addComment, getComment, deleteComment, COMMENT_MAX,
  STATUSES, parseTags, excerptOf, textOf, categories, categoryBySlug, subcategories, allTags, canonicalCategory, canonicalSubcategory, canonicalTags,
  popular, recent, similar, neighbours, authorOf, instructors, courseCard, renderPost, countView, card, promoteScheduled,
  addRevision, describeChange, listRevisions, getRevision, getAutosave, setAutosave, clearAutosave,
  listMedia, addMedia, getMedia, mediaByPath, updateMedia, mediaUsage, searchLinks, suggestLinks, PAGES,
};
