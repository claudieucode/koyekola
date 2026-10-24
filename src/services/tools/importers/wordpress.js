// Importateur WordPress : fichier d'exportation XML « WXR » (versions 1.0 à 1.2) → paquet au format interne (kolakisa-site@1 + sources), analysé puis
// appliqué par le MÊME moteur que l'import natif (exchange.js). Aucun écrit ici : cette étape ne fait que LIRE et CONVERTIR.
// Référence : format WXR de WordPress (https://developer.wordpress.org/ — outil Exporter / Importer WordPress).
const { parseXml, kids, kid, val, raw, fail } = require("./xml");
const { wpContent, toMarkdown, plain } = require("./html");

const MAX_ITEMS = 5000;
const date = (gmt, local) => {
  for (const v of [gmt, local]) {
    if (!v || /^0000/.test(v)) continue;
    const t = Date.parse(`${String(v).replace(" ", "T")}${v === gmt ? "Z" : ""}`);
    if (Number.isFinite(t) && t > Date.parse("1990-01-01") && t < Date.now() + 366 * 864e5) return new Date(t).toISOString();
  }
  return null;
};
const slugOf = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function parseWxr(input) {
  const rss = parseXml(input);
  const channel = rss.name === "rss" ? kid(rss, "channel") : null;
  const version = channel && val(channel, "wp:wxr_version");
  if (!channel || !/^1\.[0-2]$/.test(version || "")) throw fail("Ce fichier n'est pas un export WordPress (WXR) : l'élément « wp:wxr_version » 1.0 à 1.2 est absent. Dans WordPress : Outils → Exporter → « Tout le contenu ».");
  return { channel, version };
}

// → { data, summary } ; data.resources suit le format interne, data.external décrit la source
function convert(input, opts = {}) {
  const { channel, version } = parseWxr(input);
  const warnings = [];
  const ref = (p, n) => `${p}${n}`;
  const counters = { t: 0, a: 0, p: 0, c: 0, m: 0 };
  const taxonomies = [], articles = [], pages = [], comments = [], media = [];
  const termBy = new Map(); // `${taxonomy}:${slug}` → ref
  const authors = [];
  const unknown = { postTypes: {}, statuses: {}, metaKeys: {}, taxonomies: {}, shortcodes: {}, customBlocks: {}, commentTypes: {}, pings: 0, passwordProtected: 0, hierarchy: 0 };

  for (const a of kids(channel, "wp:author")) {
    const login = val(a, "wp:author_login");
    if (login) authors.push({ key: login, name: val(a, "wp:author_display_name") || login, email: val(a, "wp:author_email") || "" });
  }
  const addTerm = (taxonomy, slug, name, parentSlug, description = "") => {
    const key = `${taxonomy}:${slug}`;
    if (!slug || termBy.has(key)) return termBy.get(key) || null;
    const r = ref("t", ++counters.t); termBy.set(key, r);
    taxonomies.push({ ref: r, taxonomy, name: name || slug, slug, description, parentRef: null, _parent: parentSlug || "", sourceKey: `term:${taxonomy}:${slug}` });
    return r;
  };
  for (const c of kids(channel, "wp:category")) addTerm("category", val(c, "wp:category_nicename"), val(c, "wp:cat_name"), val(c, "wp:category_parent"), val(c, "wp:category_description"));
  for (const t of kids(channel, "wp:tag")) addTerm("tag", val(t, "wp:tag_slug"), val(t, "wp:tag_name"), "", val(t, "wp:tag_description"));
  for (const t of kids(channel, "wp:term")) {
    const tax = val(t, "wp:term_taxonomy");
    if (tax === "category") addTerm("category", val(t, "wp:term_slug"), val(t, "wp:term_name"), val(t, "wp:term_parent"));
    else if (tax === "post_tag") addTerm("tag", val(t, "wp:term_slug"), val(t, "wp:term_name"), "");
    else if (tax !== "nav_menu" && tax !== "link_category") unknown.taxonomies[tax] = (unknown.taxonomies[tax] || 0) + 1;
  }

  const items = kids(channel, "item");
  if (items.length > MAX_ITEMS) throw fail(`Trop d'éléments (${items.length}) : ${MAX_ITEMS} au plus par import. Découpez l'export WordPress (Outils → Exporter, par type et par date).`);
  const attachmentBy = new Map(); // post_id source → ref média
  const postRefBy = new Map();    // post_id source → ref article/page
  const pending = [];
  const wantedPosts = [];
  const postIdOf = (it) => val(it, "wp:post_id");

  for (const it of items) {
    const type = val(it, "wp:post_type") || "post";
    const status = val(it, "wp:status") || "publish";
    const sid = postIdOf(it);
    if (type === "attachment") {
      const url = val(it, "wp:attachment_url");
      const r = ref("m", ++counters.m); if (sid) attachmentBy.set(sid, r);
      media.push({ ref: r, remoteUrl: url, name: val(it, "title") || url.split("/").pop() || "fichier", sourceKey: `media:${url || sid}`, parentSource: val(it, "wp:post_parent") });
      continue;
    }
    if (["revision", "nav_menu_item", "custom_css", "customize_changeset", "oembed_cache", "wp_global_styles", "wp_navigation", "wp_template", "wp_template_part", "user_request", "wp_block"].includes(type)) { unknown.postTypes[type] = (unknown.postTypes[type] || 0) + 1; continue; }
    if (type !== "post" && type !== "page") { unknown.postTypes[type] = (unknown.postTypes[type] || 0) + 1; continue; }
    if (["trash", "auto-draft", "inherit"].includes(status)) { unknown.statuses[status] = (unknown.statuses[status] || 0) + 1; continue; }
    const content = wpContent(raw(it, "content:encoded"));
    for (const s of content.shortcodes) unknown.shortcodes[s] = (unknown.shortcodes[s] || 0) + 1;
    for (const s of content.customBlocks) unknown.customBlocks[s] = (unknown.customBlocks[s] || 0) + 1;
    const title = val(it, "title") || (type === "page" ? "Page sans titre" : "Sans titre");
    const slug = slugOf(val(it, "wp:post_name") || title);
    const dt = date(val(it, "wp:post_date_gmt"), val(it, "wp:post_date"));
    const meta = {};
    for (const m of kids(it, "wp:postmeta")) { const k = val(m, "wp:meta_key"); meta[k] = raw(m, "wp:meta_value"); }
    for (const k of Object.keys(meta)) if (!/^_(edit_|wp_|thumbnail_id|yoast_wpseo_(title|metadesc|focuskw)|pingme|encloseme|oembed|wpcom)/.test(k) && !/^(_edit_lock|_edit_last)$/.test(k)) unknown.metaKeys[k] = (unknown.metaKeys[k] || 0) + 1;
    if (val(it, "wp:post_password")) unknown.passwordProtected++;
    const catRefs = [], tagRefs = [];
    for (const c of kids(it, "category")) {
      const dom = c.attribs.domain, nice = c.attribs.nicename || slugOf(c.text);
      if (dom === "category") { const r = addTerm("category", nice, c.text.trim(), ""); if (r) catRefs.push(r); }
      else if (dom === "post_tag") { const r = addTerm("tag", nice, c.text.trim(), ""); if (r) tagRefs.push(r); }
      else if (dom && dom !== "post_format" && dom !== "nav_menu") unknown.taxonomies[dom] = (unknown.taxonomies[dom] || 0) + 1;
    }
    const sourceKey = `post:${sid || val(it, "guid") || slug}`;
    const base = { title: title.slice(0, 150), slug, status, date: dt, sourceKey, sourceStatus: status, sourceUrl: val(it, "link") };
    if (type === "page") {
      const r = ref("p", ++counters.p); if (sid) postRefBy.set(sid, r);
      if (val(it, "wp:post_parent") && val(it, "wp:post_parent") !== "0") unknown.hierarchy++;
      pages.push({ ref: r, name: title.slice(0, 100), slug, kind: "page", indexable: status === "publish", content: { sections: [{ type: "text", markdown: toMarkdown(content.html) || title }], title: title.slice(0, 120), description: plain(raw(it, "excerpt:encoded"), 300) }, date: dt, sourceKey, sourceStatus: status, sourceUrl: base.sourceUrl });
    } else {
      const r = ref("a", ++counters.a); if (sid) postRefBy.set(sid, r);
      articles.push({ ref: r, ...base, content: content.html, content_format: "html", excerpt: plain(raw(it, "excerpt:encoded"), 500), categoryRefs: catRefs, tagRefs, primaryCategoryRef: catRefs[0] || null,
        authorKey: val(it, "dc:creator"), comments_enabled: val(it, "wp:comment_status") === "closed" ? 0 : 1,
        seo_title: (meta._yoast_wpseo_title || "").slice(0, 120) || undefined, seo_description: (meta._yoast_wpseo_metadesc || "").slice(0, 300) || undefined, focus_keyword: (meta._yoast_wpseo_focuskw || "").slice(0, 80) || undefined,
        _thumb: meta._thumbnail_id || "", _sid: sid });
    }
    for (const cm of kids(it, "wp:comment")) pending.push({ cm, owner: sid, isPage: type === "page" });
  }
  // Termes : parents (par adresse), puis rattachement du média « image mise en avant »
  for (const t of taxonomies) { if (t._parent) t.parentRef = termBy.get(`${t.taxonomy}:${t._parent}`) || null; delete t._parent; }
  for (const a of articles) { a.coverMediaRef = a._thumb && attachmentBy.get(a._thumb) || null; delete a._thumb; }
  // Commentaires : seulement ceux des articles (Kolakisa ne commente pas les pages) ; pings et rétroliens ne sont pas des commentaires
  const commentBy = new Map();
  let skippedPageComments = 0;
  for (const { cm, owner, isPage } of pending) {
    const type = val(cm, "wp:comment_type") || "comment";
    if (type !== "comment" && type !== "") { if (type === "pingback" || type === "trackback") unknown.pings++; else unknown.commentTypes[type] = (unknown.commentTypes[type] || 0) + 1; continue; }
    if (isPage) { skippedPageComments++; continue; }
    const ap = val(cm, "wp:comment_approved");
    if (ap === "trash") continue;
    const cid = val(cm, "wp:comment_id");
    const r = ref("c", ++counters.c); if (cid) commentBy.set(cid, r);
    comments.push({ ref: r, articleRef: postRefBy.get(owner) || null, parentSource: val(cm, "wp:comment_parent"), author_name: (val(cm, "wp:comment_author") || "Anonyme").slice(0, 80), author_email: val(cm, "wp:comment_author_email").slice(0, 190),
      date: date(val(cm, "wp:comment_date_gmt"), val(cm, "wp:comment_date")), body: raw(cm, "wp:comment_content"), status: ap === "1" ? "approved" : ap === "spam" ? "spam" : "pending", sourceKey: `comment:${cid || `${owner}:${r}`}` });
  }
  for (const c of comments) { c.parentRef = c.parentSource && c.parentSource !== "0" ? commentBy.get(c.parentSource) || null : null; delete c.parentSource; }
  for (const m of media) { m.articleRef = m.parentSource && postRefBy.get(m.parentSource) || null; delete m.parentSource; }
  for (const a of articles) delete a._sid;

  const topN = (o, n = 8) => Object.entries(o).sort((x, y) => y[1] - x[1]).slice(0, n).map(([k, v]) => ({ name: k, count: v }));
  const total = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  const unsupported = [
    ...(total(unknown.postTypes) ? [{ label: "Types de contenu non pris en charge", count: total(unknown.postTypes), detail: topN(unknown.postTypes) }] : []),
    ...(total(unknown.taxonomies) ? [{ label: "Taxonomies personnalisées (non converties)", count: total(unknown.taxonomies), detail: topN(unknown.taxonomies) }] : []),
    ...(total(unknown.metaKeys) ? [{ label: "Champs personnalisés non convertis (données conservées dans le fichier source seulement)", count: total(unknown.metaKeys), detail: topN(unknown.metaKeys) }] : []),
    ...(total(unknown.shortcodes) ? [{ label: "Codes courts WordPress laissés tels quels dans le texte", count: total(unknown.shortcodes), detail: topN(unknown.shortcodes) }] : []),
    ...(total(unknown.customBlocks) ? [{ label: "Blocs d'extensions absentes (leur contenu HTML est conservé, pas leur mise en forme)", count: total(unknown.customBlocks), detail: topN(unknown.customBlocks) }] : []),
    ...(unknown.pings ? [{ label: "Pings et rétroliens (non importés)", count: unknown.pings }] : []),
    ...(total(unknown.commentTypes) ? [{ label: "Commentaires d'un autre type (non importés)", count: total(unknown.commentTypes), detail: topN(unknown.commentTypes) }] : []),
    ...(skippedPageComments ? [{ label: "Commentaires de pages (Kolakisa ne commente que les articles)", count: skippedPageComments }] : []),
    ...(total(unknown.statuses) ? [{ label: "Éléments à la corbeille ou automatiques (ignorés)", count: total(unknown.statuses) }] : []),
    ...(unknown.passwordProtected ? [{ label: "Contenus protégés par mot de passe (le mot de passe n'est pas importé)", count: unknown.passwordProtected }] : []),
    ...(unknown.hierarchy ? [{ label: "Pages enfants : la hiérarchie n'est pas conservée (Kolakisa n'a pas de pages parentes)", count: unknown.hierarchy }] : []),
  ];
  if (!taxonomies.length && !articles.length && !pages.length) warnings.push("Le fichier ne contient ni article, ni page, ni catégorie exploitable.");
  return {
    data: {
      format: "kolakisa-site@1", external: true,
      source: { platform: "wordpress", siteName: val(channel, "title"), url: val(channel, "link"), version, language: val(channel, "language") },
      resources: { taxonomies, pages, articles, media, comments },
      extras: { authors, unsupported },
    },
    warnings,
  };
}

module.exports = { convert, parseWxr, slugOf };
