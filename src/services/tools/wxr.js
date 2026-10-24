// Sérialisation WXR (WordPress eXtended RSS 1.2) à partir des ressources de l'export natif : MÊME sélection, MÊMES filtres, MÊME portée de site que le format natif
// (aucun second moteur de lecture). Ce module ne lit pas la base : il met en forme.
//   Pris en charge (compatibles WordPress) : catégories et étiquettes, articles, pages (TEXTE de l'éditeur visuel), commentaires approuvés, médias (références vers les fichiers),
//   menus de navigation (éléments de type page, article, catégorie, étiquette, lien). Auteurs : nom d'affichage seulement.
//   Non pris en charge (conservés UNIQUEMENT dans le format natif kolakisa-site@1) : mise en page de l'éditeur visuel, réglages, redirections, référencement, contacts.
// Confidentialité : aucune adresse e-mail (champs WXR vides), aucune adresse IP, aucun mot de passe : WordPress les accepte vides.
// Dates : `post_date` dans le fuseau du site, `post_date_gmt` en UTC (les dates enregistrées sont en UTC).
const SUPPORTED = ["taxonomies", "articles", "pages", "comments", "media", "menus"];
const NS = 'xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/"';

// Caractères interdits en XML 1.0 retirés ; « ]]> » découpé dans les sections CDATA
// (les paires de substitution — emoji, caractères hors plan de base — sont valides en XML : seuls les substituts isolés sont retirés)
const clean = (v) => String(v ?? "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "");
const esc = (v) => clean(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cdata = (v) => `<![CDATA[${clean(v).replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
const tag = (name, v) => `<${name}>${cdata(v)}</${name}>`;

const pad = (n) => String(n).padStart(2, "0");
const parseUtc = (iso) => { const d = new Date(iso || Date.now()); return Number.isNaN(d.getTime()) ? new Date() : d; };
const gmt = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
function local(d, tz) {
  try {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(d).map((x) => [x.type, x.value]));
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
  } catch { return gmt(d); }
}
const STATUS = { published: "publish", draft: "draft", scheduled: "future", review: "pending", archived: "private" };

// Texte d'une page de l'éditeur visuel : titres et paragraphes trouvés dans les sections (la mise en page n'est pas exportable en WXR)
const TEXT_KEYS = ["heading", "title", "subtitle", "text", "markdown", "body", "description", "label", "quote", "caption"];
function textOfSections(sections) {
  const out = [];
  const walk = (node, depth = 0) => {
    if (!node || depth > 12) return;
    if (Array.isArray(node)) return node.forEach((n) => walk(n, depth + 1));
    if (typeof node !== "object") return;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === "string" && TEXT_KEYS.includes(k) && v.trim()) out.push({ k, v: v.trim() });
      else if (v && typeof v === "object") walk(v, depth + 1);
    }
  };
  walk(sections);
  const seen = new Set();
  return out.filter((t) => { const key = `${t.k}:${t.v}`; if (seen.has(key)) return false; seen.add(key); return true; })
    .map((t) => (/^(heading|title)$/.test(t.k) ? `<h2>${esc(t.v)}</h2>` : `<p>${esc(t.v).replace(/\n+/g, "<br>")}</p>`)).join("\n");
}

function serialize({ resources, site, now = new Date() }) {
  const tz = site.timezone || "Europe/Paris";
  const base = String(site.url || "").replace(/\/+$/, "");
  const r = resources || {};
  const terms = r.taxonomies || [];
  const termByRef = new Map(terms.map((t) => [t.ref, t]));
  const authors = new Map();
  const authorId = (name) => { const n = name || "auteur"; if (!authors.has(n)) authors.set(n, authors.size + 1); return authors.get(n); };
  const numeric = (ref) => Number(String(ref || "").replace(/^\D+/, "")) || 0;
  const out = [];
  out.push('<?xml version="1.0" encoding="UTF-8" ?>');
  out.push(`<!-- generator="KOLAKISA CMS" created="${gmt(now)}" -->`);
  out.push(`<rss version="2.0" ${NS}>`);
  out.push("<channel>");
  out.push(`<title>${esc(site.name)}</title>`, `<link>${esc(base)}</link>`, `<description>${esc(site.description || "")}</description>`, `<pubDate>${now.toUTCString()}</pubDate>`, `<language>${esc(site.language || "fr-FR")}</language>`);
  out.push("<wp:wxr_version>1.2</wp:wxr_version>", `<wp:base_site_url>${esc(base)}</wp:base_site_url>`, `<wp:base_blog_url>${esc(base)}</wp:base_blog_url>`);
  const authorsAt = out.length;
  out.push("<!--AUTEURS-->");
  for (const t of terms.filter((x) => x.taxonomy === "category")) {
    const parent = t.parentRef && termByRef.get(t.parentRef);
    out.push(`<wp:category><wp:term_id>${numeric(t.ref)}</wp:term_id><wp:category_nicename>${cdata(t.slug)}</wp:category_nicename><wp:category_parent>${cdata(parent ? parent.slug : "")}</wp:category_parent><wp:cat_name>${cdata(t.name)}</wp:cat_name><wp:category_description>${cdata(t.description || "")}</wp:category_description></wp:category>`);
  }
  for (const t of terms.filter((x) => x.taxonomy === "tag")) out.push(`<wp:tag><wp:term_id>${numeric(t.ref)}</wp:term_id><wp:tag_slug>${cdata(t.slug)}</wp:tag_slug><wp:tag_name>${cdata(t.name)}</wp:tag_name><wp:tag_description>${cdata(t.description || "")}</wp:tag_description></wp:tag>`);
  for (const m of r.menus || []) out.push(`<wp:term><wp:term_id>${900000 + numeric(m.ref)}</wp:term_id><wp:term_taxonomy>nav_menu</wp:term_taxonomy><wp:term_slug>${cdata(m.slug)}</wp:term_slug><wp:term_parent>${cdata("")}</wp:term_parent><wp:term_name>${cdata(m.name)}</wp:term_name></wp:term>`);

  const itemHead = (o) => {
    const d = parseUtc(o.date);
    return [`<title>${esc(o.title)}</title>`, `<link>${esc(o.link || "")}</link>`, `<pubDate>${d.toUTCString()}</pubDate>`, `<dc:creator>${cdata(o.author || "")}</dc:creator>`, `<guid isPermaLink="false">${esc(o.guid)}</guid>`, "<description></description>"];
  };
  const itemBody = (o) => {
    const d = parseUtc(o.date), m = parseUtc(o.modified || o.date);
    return [`<content:encoded>${cdata(o.content || "")}</content:encoded>`, `<excerpt:encoded>${cdata(o.excerpt || "")}</excerpt:encoded>`, `<wp:post_id>${o.id}</wp:post_id>`,
      tag("wp:post_date", local(d, tz)), tag("wp:post_date_gmt", gmt(d)), tag("wp:post_modified", local(m, tz)), tag("wp:post_modified_gmt", gmt(m)),
      tag("wp:comment_status", o.commentsOpen ? "open" : "closed"), tag("wp:ping_status", "closed"), tag("wp:post_name", o.slug || ""), tag("wp:status", o.status || "publish"),
      `<wp:post_parent>${o.parent || 0}</wp:post_parent>`, `<wp:menu_order>${o.order || 0}</wp:menu_order>`, tag("wp:post_type", o.type), tag("wp:post_password", ""), "<wp:is_sticky>0</wp:is_sticky>"];
  };
  const meta = (k, v) => `<wp:postmeta><wp:meta_key>${cdata(k)}</wp:meta_key><wp:meta_value>${cdata(v)}</wp:meta_value></wp:postmeta>`;

  // Articles (avec leurs commentaires approuvés)
  const commentsOf = new Map();
  for (const c of r.comments || []) { const k = c.contentRef; if (!commentsOf.has(k)) commentsOf.set(k, []); commentsOf.get(k).push(c); }
  const commentXml = (c) => `<wp:comment><wp:comment_id>${numeric(c.ref)}</wp:comment_id><wp:comment_author>${cdata(c.authorName || "Anonyme")}</wp:comment_author><wp:comment_author_email>${cdata("")}</wp:comment_author_email><wp:comment_author_url>${cdata("")}</wp:comment_author_url><wp:comment_author_IP>${cdata("")}</wp:comment_author_IP>`
    + `${tag("wp:comment_date", local(parseUtc(c.createdAt), tz))}${tag("wp:comment_date_gmt", gmt(parseUtc(c.createdAt)))}<wp:comment_content>${cdata(c.body)}</wp:comment_content><wp:comment_approved>${cdata("1")}</wp:comment_approved><wp:comment_type>${cdata("comment")}</wp:comment_type><wp:comment_parent>${numeric(c.parentRef)}</wp:comment_parent><wp:comment_user_id>0</wp:comment_user_id></wp:comment>`;
  const markdown = (text) => { try { return require("../../utils/blogHtml").markdownToEditorHtml(text); } catch { return esc(text).replace(/\n\n/g, "</p><p>"); } };
  for (const a of r.articles || []) {
    const cats = (a.categoryRefs || []).map((x) => termByRef.get(x)).filter(Boolean), tags = (a.tagRefs || []).map((x) => termByRef.get(x)).filter(Boolean);
    const content = a.content_format === "markdown" ? markdown(a.content || "") : a.content || "";
    out.push("<item>", ...itemHead({ title: a.title, link: a.url ? `${base}${a.url}` : "", date: a.publishedAt || a.createdAt, author: a.authorName, guid: `kolakisa-article-${numeric(a.ref)}` }),
      ...itemBody({ id: numeric(a.ref), date: a.publishedAt || a.createdAt, modified: a.updatedAt, content, excerpt: a.excerpt, slug: a.slug, status: STATUS[a.status] || "draft", type: "post", commentsOpen: Boolean(a.comments_enabled) }));
    authorId(a.authorName);
    for (const c of cats) out.push(`<category domain="category" nicename="${esc(c.slug)}">${cdata(c.name)}</category>`);
    for (const t of tags) out.push(`<category domain="post_tag" nicename="${esc(t.slug)}">${cdata(t.name)}</category>`);
    if (a.seo_title) out.push(meta("_yoast_wpseo_title", a.seo_title));
    if (a.seo_description) out.push(meta("_yoast_wpseo_metadesc", a.seo_description));
    if (a.cover_path) out.push(meta("_kolakisa_cover", a.cover_path));
    for (const c of commentsOf.get(a.ref) || []) out.push(commentXml(c));
    out.push("</item>");
  }
  // Pages (texte de l'éditeur visuel ; hiérarchie par identifiant de page parente)
  for (const p of r.pages || []) {
    out.push("<item>", ...itemHead({ title: p.name, link: "", date: p.createdAt || now.toISOString(), author: p.authorName, guid: `kolakisa-page-${numeric(p.ref)}` }),
      ...itemBody({ id: numeric(p.ref) + 100000, date: p.createdAt || now.toISOString(), modified: p.updatedAt, content: textOfSections(p.content && p.content.sections), excerpt: "", slug: p.slug, status: STATUS[p.status] || "draft", type: "page", parent: p.parentRef ? numeric(p.parentRef) + 100000 : 0, commentsOpen: false }));
    authorId(p.authorName);
    out.push(meta("_kolakisa_layout", "editeur-visuel (non exporté en WXR)"));
    out.push("</item>");
  }
  // Médias : références vers les fichiers (les fichiers eux-mêmes sont dans l'archive si elle a été demandée)
  for (const m of r.media || []) {
    out.push("<item>", ...itemHead({ title: m.title || m.name, link: `${base}${m.path}`, date: m.createdAt || now.toISOString(), author: "", guid: `${base}${m.path}` }),
      ...itemBody({ id: numeric(m.ref) + 200000, date: m.createdAt || now.toISOString(), content: m.description || "", excerpt: m.caption || "", slug: String(m.name || "").replace(/\.[a-z0-9]+$/i, ""), status: "inherit", type: "attachment" }),
      `<wp:attachment_url>${cdata(`${base}${m.path}`)}</wp:attachment_url>`, meta("_wp_attached_file", String(m.path || "").replace(/^\/uploads\//, "")));
    if (m.alt) out.push(meta("_wp_attachment_image_alt", m.alt));
    out.push("</item>");
  }
  // Menus : éléments « nav_menu_item »
  let itemId = 300000;
  const objectOf = { page: ["page", "p", 100000], article: ["post", "a", 0], category: ["category", "t", 0], tag: ["post_tag", "t", 0], custom: ["custom", "", 0] };
  for (const m of r.menus || []) {
    const ids = new Map();
    for (const it of m.items || []) ids.set(it.ref, ++itemId);
    for (const it of m.items || []) {
      const [object, , shift] = objectOf[it.type] || objectOf.custom;
      out.push("<item>", ...itemHead({ title: it.label, link: "", date: now.toISOString(), author: "", guid: `kolakisa-menu-item-${numeric(it.ref)}` }),
        ...itemBody({ id: ids.get(it.ref), date: now.toISOString(), content: "", excerpt: "", slug: String(ids.get(it.ref)), status: "publish", type: "nav_menu_item", order: it.position || 0 }),
        `<category domain="nav_menu" nicename="${esc(m.slug)}">${cdata(m.name)}</category>`,
        meta("_menu_item_type", it.type === "custom" ? "custom" : it.type === "category" || it.type === "tag" ? "taxonomy" : "post_type"), meta("_menu_item_menu_item_parent", it.parentRef ? ids.get(it.parentRef) || 0 : 0),
        meta("_menu_item_object_id", it.objectRef ? numeric(it.objectRef) + shift : 0), meta("_menu_item_object", object), meta("_menu_item_target", it.newTab ? "_blank" : ""), meta("_menu_item_url", it.url || ""));
      out.push("</item>");
    }
  }
  out.push("</channel>", "</rss>");
  const authorsXml = [...authors.entries()].map(([name, id]) => `<wp:author><wp:author_id>${id}</wp:author_id><wp:author_login>${cdata(name)}</wp:author_login><wp:author_email>${cdata("")}</wp:author_email><wp:author_display_name>${cdata(name)}</wp:author_display_name><wp:author_first_name>${cdata("")}</wp:author_first_name><wp:author_last_name>${cdata("")}</wp:author_last_name></wp:author>`).join("\n");
  out[authorsAt] = authorsXml;
  return out.join("\n") + "\n";
}

module.exports = { serialize, SUPPORTED, textOfSections, cdata, esc, clean };
