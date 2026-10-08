// Inventaire des contenus publics du site, lu dans la base réelle : chaque entrée a un type, une clé, un nom et son adresse.
// Utilisé par l'administration SEO, l'audit et le plan du site.
const db = require("../config/database");
const blog = require("../services/blog");
const taxonomy = require("../services/taxonomy");
const meta = require("./meta");
const { slugify } = require("../utils/format");

const PAGE_PATHS = { home: "/", catalogue: "/catalogue", blog: "/blog", "a-propos": "/a-propos", faq: "/faq", contact: "/contact" };

function list() {
  const out = [];
  for (const [key, name] of Object.entries(meta.TYPES.page.keys)) out.push({ type: "page", key, name, path: PAGE_PATHS[key] });
  for (const c of db.prepare("SELECT id, title, slug, published, archived, updated_at FROM courses ORDER BY title COLLATE NOCASE").all()) {
    if (c.published && !c.archived) out.push({ type: "course", key: String(c.id), name: c.title, path: `/cours/${c.slug}`, updatedAt: c.updated_at });
  }
  for (const r of db.prepare("SELECT DISTINCT category FROM courses WHERE published = 1 AND archived = 0 ORDER BY category").all()) out.push({ type: "course_category", key: slugify(r.category), name: r.category, path: `/categorie/${slugify(r.category)}` });
  for (const p of db.prepare("SELECT id, title, slug, updated_at FROM posts WHERE published = 1 ORDER BY published_at DESC").all()) out.push({ type: "post", key: String(p.id), name: p.title, path: `/blog/${p.slug}`, editUrl: `/formateur/blog/${p.id}/modifier`, updatedAt: p.updated_at });
  for (const t of taxonomy.publicTerms("category")) out.push({ type: "blog_category", key: t.slug, name: t.name, path: taxonomy.urlOf(t) });
  for (const t of taxonomy.publicTerms("tag")) out.push({ type: "blog_tag", key: t.slug, name: t.name, path: taxonomy.urlOf(t) });
  for (const a of db.prepare("SELECT DISTINCT u.id, u.username FROM users u JOIN posts p ON (p.author_id = u.id OR (p.author_id IS NULL AND u.id = (SELECT MIN(id) FROM users WHERE role = 'formateur'))) WHERE u.role = 'formateur' AND p.published = 1 ORDER BY u.username").all()) {
    out.push({ type: "author", key: String(a.id), name: a.username, path: `/blog/auteur/${a.id}` });
  }
  return out;
}

// Étiquettes des articles PUBLIÉS uniquement (les autres n'ont pas de page publique)
function publishedTags() {
  const seen = new Map();
  for (const row of db.prepare("SELECT tags FROM posts WHERE published = 1 AND tags <> ''").all()) for (const t of blog.parseTags(row.tags)) if (!seen.has(slugify(t))) seen.set(slugify(t), t);
  return [...seen.values()].sort((a, b) => a.localeCompare(b, "fr"));
}

const LABELS = { page: "Page", course: "Formation", course_category: "Catégorie de formations", post: "Article", blog_category: "Catégorie d'articles", blog_tag: "Étiquette", author: "Auteur" };

function find(type, key) {
  return list().find((e) => e.type === type && e.key === String(key)) || null;
}

module.exports = { list, find, LABELS, PAGE_PATHS };
