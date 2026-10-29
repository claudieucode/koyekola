// Pages du site éditées avec l'éditeur de blocs (aujourd'hui : « À propos »).
// Une page n'est PAS un article. Pour disposer de l'éditeur complet (versions, sauvegarde automatique, notes, aperçu), chaque page a une ligne « support » dans posts :
//   - page_key = « a-propos » ; hors ligne (published = 0) ; DANS LA CORBEILLE (deleted_at) : toutes les listes, recherches, exports, flux et plans du site d'articles l'ignorent ;
//   - son contenu est recopié dans site_pages.content_html à chaque enregistrement (c'est CETTE copie que le site public affiche).
// Le texte Markdown d'origine (site_pages.content) n'est jamais supprimé : tant que content_html est vide, la page publique l'utilise comme avant.
const db = require("../config/database");
const { parseDocument } = require("htmlparser2");
const DomUtils = require("domutils");
const { default: render } = require("dom-serializer");
const { sanitizeBlogHtml, markdownToEditorHtml } = require("../utils/blogHtml");
const { UserError } = require("../utils/errors");
const about = require("./aboutPage");

const PAGES = { "a-propos": { label: "À propos", url: "/a-propos", defaultTitle: about.DEFAULT_TITLE, defaultMarkdown: about.DEFAULT_ABOUT } };
const pageOf = (key) => { const p = PAGES[key]; if (!p) throw new UserError("Page introuvable."); return p; };
const rowOf = (key) => db.prepare("SELECT * FROM site_pages WHERE slug = ?").get(key);
const supportOf = (key) => db.prepare("SELECT * FROM posts WHERE page_key = ?").get(key) || null;

// Ligne « support » de la page (créée au premier passage) : contenu de départ = le contenu HTML déjà enregistré, sinon le Markdown actuel converti en blocs
function ensureSupport(key, userId) {
  const meta = pageOf(key);
  const existing = supportOf(key);
  if (existing) return existing;
  const row = rowOf(key);
  const markdown = row && row.content && row.content.trim() ? row.content : meta.defaultMarkdown;
  const start = row && row.content_html && row.content_html.trim() ? row.content_html : markdownToEditorHtml(markdown);
  const title = (row && row.content_html && row.content_html.trim() ? meta.defaultTitle : (about.parse(markdown).title || meta.defaultTitle)).slice(0, 150);
  const slug = `page-${key}`;
  const info = db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, author_id, page_key, deleted_at, deleted_from_status, seo_description) VALUES (?, ?, ?, 'html', 'draft', 0, ?, ?, datetime('now'), 'page', ?)")
    .run(slug, title, start, userId ?? null, key, (row && row.seo_description) || null);
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(Number(info.lastInsertRowid));
  return post;
}

// Enregistrement du support → page publique (appelé à chaque sauvegarde de l'éditeur)
function publish(post) {
  const key = post.page_key;
  const meta = pageOf(key);
  const html = sanitizeBlogHtml(post.content || "");
  db.prepare(`INSERT INTO site_pages (slug, title, content, content_html, heading, seo_description, updated_at) VALUES (?, ?, '', ?, ?, ?, datetime('now'))
    ON CONFLICT(slug) DO UPDATE SET content_html = excluded.content_html, heading = excluded.heading, seo_description = excluded.seo_description, updated_at = excluded.updated_at`).run(key, meta.label, html, String(post.title || "").slice(0, 150), post.seo_description || null);
  return html;
}

// Contenu HTML publié → { title, lead, intro, sections } pour la mise en page de la page (même découpage que le Markdown : premier paragraphe = introduction, un titre H2 = une section)
function layoutOf(renderedHtml, title) {
  const doc = parseDocument(renderedHtml || "");
  const top = doc.children.filter((n) => n.type === "tag" || (n.type === "text" && n.data.trim()));
  const html = (nodes) => render(nodes, { encodeEntities: "utf8" });
  const isH2 = (n) => n.type === "tag" && n.name === "h2";
  let i = 0;
  const lead = top[0] && top[0].type === "tag" && top[0].name === "p" ? (i = 1, html([top[0]])) : "";
  const before = [];
  while (i < top.length && !isH2(top[i])) before.push(top[i++]);
  const sections = [];
  const used = new Set();
  while (i < top.length) {
    const h2 = top[i++];
    const body = [];
    while (i < top.length && !isH2(top[i])) body.push(top[i++]);
    let id = (h2.attribs && h2.attribs.id) || `section-${sections.length + 1}`;
    for (let n = 2; used.has(id); n++) id = `${id}-${n}`;
    used.add(id);
    sections.push({ id, title: DomUtils.textContent(h2).replace(/\s+/g, " ").trim().slice(0, 120), html: html(body) });
  }
  return { title: title || "", lead, intro: html(before), sections };
}

module.exports = { PAGES, pageOf, rowOf, supportOf, ensureSupport, publish, layoutOf };
