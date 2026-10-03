// Blog éditorial : lectures utilisées par les pages publiques (catégories, étiquettes, populaires, récents, similaires,
// précédent/suivant, auteur, carte d'une formation citée). Lecture seule, sauf le compteur de consultations.
const db = require("../config/database");
const { slugify, formatPrice } = require("../utils/format");
const { escapeHtml } = require("../utils/markdown");
const { plainText } = require("../utils/seo");
const { renderArticle } = require("../utils/articleMarkdown");

const MAX_TAGS = 10;
// Robots (moteurs, aperçus de liens, outils) : leurs visites ne comptent pas comme des lectures
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|curl|wget|python|java\/|headless|monitor|lighthouse/i;

const excerptOf = (post) => post.excerpt || plainText(post.content, 160);

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

const renderPost = (post) => renderArticle(post.content, { courseCard });

// Une lecture : ni le formateur (qui relit), ni un robot
function countView(post, req) {
  if (!post.published) return;
  if (req.session.user && req.session.user.role === "formateur") return;
  if (BOT.test(String(req.get("user-agent") || "")) || !req.get("user-agent")) return;
  db.prepare("UPDATE posts SET views = views + 1 WHERE id = ?").run(post.id);
}

module.exports = { parseTags, excerptOf, categories, categoryBySlug, popular, recent, similar, neighbours, authorOf, instructors, courseCard, renderPost, countView, card };
