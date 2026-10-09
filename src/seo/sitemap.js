// Plan du site (sitemap.xml) construit depuis la base réelle : uniquement les contenus publiés ET indexables.
// Exclus (avec la raison, visible dans Mon espace → SEO) : noindex, canonical vers une autre adresse, adresses redirigées.
// Images : principale de chaque formation / article, seulement si le fichier existe (extension image:image de Google).
const db = require("../config/database");
const blog = require("../services/blog");
const taxonomy = require("../services/taxonomy");
const settings = require("./settings");
const meta = require("./meta");
const images = require("./images");
const { absoluteUrl, escapeXml, isoDate } = require("../utils/seo");
const { slugify } = require("../utils/format");
const urls = require("../services/urls");

const MAX_URLS = 45000; // sous la limite de 50 000 adresses par fichier

// Réglage d'indexation enregistré pour un contenu (null = automatique)
const metaIndex = (type, key) => { const m = meta.get(type, key); return { index: m.robots_index, canonical: m.canonical_url }; };

// Groupes de sous-plans (sitemap-<groupe>.xml) : extensible, un type de contenu de plus = une ligne ici
const GROUPS = { pages: ["Page", "Page web"], articles: ["Article"], formations: ["Formation"], taxonomies: ["Catégorie d'articles", "Étiquette", "Auteur", "Catégorie de formations"] };
const groupOf = (type) => Object.keys(GROUPS).find((g) => GROUPS[g].includes(type)) || "pages";
const SPLIT_AT = Number(process.env.SITEMAP_SPLIT_AT) > 0 ? Number(process.env.SITEMAP_SPLIT_AT) : 5000; // au-delà, /sitemap.xml devient un index de sous-plans (la limite d'un fichier est de 50 000 adresses)

// hostSite : plan du site d'un domaine propre (seulement ses pages) ; sans lui : plan du site principal (les pages d'un site à domaine propre
// sont listées par le plan de leur domaine : un plan ne liste jamais des adresses d'un autre hôte)
function entries({ hostSite = null } = {}) {
  const st = settings.all();
  const included = [];
  const excluded = [];
  const add = (e, rule) => {
    if (rule && rule.index === 0) return excluded.push({ ...e, reason: "Réglée en noindex" });
    if (rule && rule.canonical) return excluded.push({ ...e, reason: `Canonical vers ${rule.canonical}` });
    included.push(e);
  };
  for (const [key, path] of [["home", "/"], ["catalogue", "/catalogue"], ["a-propos", "/a-propos"], ["faq", "/faq"], ["contact", "/contact"]]) add({ path, type: "Page" }, metaIndex("page", key));
  for (const r of db.prepare("SELECT DISTINCT category FROM courses WHERE published = 1 AND archived = 0 ORDER BY category").all()) add({ path: `/categorie/${slugify(r.category)}`, type: "Catégorie de formations" }, metaIndex("course_category", slugify(r.category)));
  for (const c of db.prepare("SELECT id, slug, updated_at, created_at, thumbnail_path, title FROM courses WHERE published = 1 AND archived = 0 ORDER BY created_at DESC").all()) {
    add({ path: `/cours/${c.slug}`, type: "Formation", lastmod: isoDate(c.updated_at || c.created_at), images: [c.thumbnail_path].filter(Boolean), title: c.title }, metaIndex("course", c.id));
  }
  blog.promoteScheduled();
  add({ path: "/blog", type: "Page" }, metaIndex("page", "blog"));
  for (const t of taxonomy.publicTerms("category")) add({ path: taxonomy.urlOf(t), type: "Catégorie d'articles" }, metaIndex("blog_category", t.slug));
  for (const p of db.prepare("SELECT slug, updated_at, robots_index, canonical_url, cover_path, title FROM posts WHERE published = 1 ORDER BY published_at DESC").all()) {
    const e = { path: `/blog/${p.slug}`, type: "Article", lastmod: isoDate(p.updated_at), images: [p.cover_path].filter(Boolean), title: p.title };
    if (!p.robots_index) excluded.push({ ...e, reason: "Réglé en noindex" });
    else if (p.canonical_url) excluded.push({ ...e, reason: `Canonical vers ${p.canonical_url}` });
    else included.push(e);
  }
  // Pages Site Web / pages d'atterrissage (/p/…) : en ligne, non archivées ; indexées seulement si la page le permet
  // (case « Autoriser les moteurs de recherche ») et sans canonical vers une autre adresse ni noindex dans son SEO
  let webPages = [];
  try {
    webPages = db.prepare("SELECT p.id, p.slug, p.name, p.title, p.indexable, p.seo, p.updated_at, p.site_id, s.settings AS site_settings FROM mk_landing_pages p LEFT JOIN mk_sites s ON s.id = p.site_id AND s.status = 'active' WHERE p.status = 'published' AND p.archived_at IS NULL ORDER BY p.published_at DESC").all();
  } catch (error) {
    if (!/no such (table|column)/.test(error.message)) throw error; // module marketing pas encore migré : aucune page web
  }
  for (const p of webPages) {
    let seo = {};
    try { seo = JSON.parse(p.seo || "{}"); } catch { seo = {}; }
    let siteConf = {};
    try { siteConf = JSON.parse(p.site_settings || "{}"); } catch { siteConf = {}; }
    // Adresse publique propre au site (réglages SEO du site) : l'adresse du plan du site est celle de la page canonique
    const e = { path: urls.pageCanonicalPath(p), type: "Page web", lastmod: isoDate(p.updated_at), title: p.title || p.name, base: (siteConf.seo && siteConf.seo.publicUrl) || undefined, siteId: p.site_id || null };
    if (siteConf.extras && siteConf.extras.noindex) excluded.push({ ...e, reason: "Site réglé en noindex (réglages SEO du site)" });
    else if (!p.indexable || seo.noindex) excluded.push({ ...e, reason: "Page non indexée (réglage de la page)" });
    else if (seo.canonical && !seo.canonical.endsWith(e.path === "/" ? "/" : e.path)) excluded.push({ ...e, reason: `Canonical vers ${seo.canonical}` });
    else included.push(e);
  }
  // Étiquettes et auteurs : seulement si leur indexation est activée dans les Réglages
  const tags = new Map(taxonomy.publicTerms("tag").map((t) => [t.slug, t]));
  for (const slug of tags.keys()) {
    const e = { path: taxonomy.urlOf(tags.get(slug)), type: "Étiquette" };
    const rule = metaIndex("blog_tag", slug);
    if (rule.index === 1 || (rule.index === null && st.index_blog_tags)) add(e, rule); else excluded.push({ ...e, reason: "Étiquettes non indexées (Réglages)" });
  }
  for (const a of db.prepare("SELECT DISTINCT author_id id FROM posts WHERE published = 1 AND author_id IS NOT NULL").all()) {
    const e = { path: `/blog/auteur/${a.id}`, type: "Auteur" };
    const rule = metaIndex("author", a.id);
    if (rule.index === 1 || (rule.index === null && st.index_authors)) add(e, rule); else excluded.push({ ...e, reason: "Auteurs non indexés (Réglages)" });
  }
  // Une adresse redirigée n'a pas sa place dans le plan du site
  const redirected = new Set(db.prepare("SELECT source_path FROM seo_redirects WHERE enabled = 1").all().map((r) => r.source_path));
  const final = [];
  for (const e of included) (redirected.has(e.path) ? excluded.push({ ...e, reason: "Adresse redirigée" }) : final.push(e));
  let kept = final;
  if (hostSite) {
    for (const e of excluded.splice(0)) if (e.siteId === hostSite.id) excluded.push(e);
    kept = final.filter((e) => e.siteId === hostSite.id);
  } else {
    kept = [];
    for (const e of final) (e.base ? excluded.push({ ...e, reason: "Listée dans le plan du site de son domaine" }) : kept.push(e));
  }
  for (const e of kept) e.group = groupOf(e.type);
  return { included: kept.slice(0, MAX_URLS), excluded };
}

const locOf = (req, e) => escapeXml(e.base ? `${e.base.replace(/\/+$/, "")}${e.path === "/" ? "/" : e.path}` : absoluteUrl(req, e.path));
function urlset(req, list) {
  const withImages = list.some((e) => e.images && e.images.length);
  const out = ['<?xml version="1.0" encoding="UTF-8"?>', `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${withImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ""}>`];
  for (const e of list) {
    const imgs = (e.images || []).filter((p) => images.probe(p).exists);
    out.push(`  <url><loc>${locOf(req, e)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}${imgs.map((p) => `<image:image><image:loc>${escapeXml(absoluteUrl(req, p))}</image:loc></image:image>`).join("")}</url>`);
  }
  out.push("</urlset>", "");
  return out.join("\n");
}
// /sitemap.xml : plan simple, ou index de sous-plans quand le site est grand ; /sitemap-<groupe>.xml : un sous-plan (null si le groupe est inconnu)
function xml(req, part = null) {
  const { included } = entries({ hostSite: req.kwSite || null });
  if (part) {
    if (!Object.hasOwn(GROUPS, part)) return null;
    return urlset(req, included.filter((e) => e.group === part));
  }
  if (included.length <= SPLIT_AT) return urlset(req, included);
  const groups = Object.keys(GROUPS).filter((g) => included.some((e) => e.group === g));
  const latest = (g) => included.filter((e) => e.group === g && e.lastmod).map((e) => e.lastmod).sort().pop();
  return ['<?xml version="1.0" encoding="UTF-8"?>', '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...groups.map((g) => `  <sitemap><loc>${escapeXml(absoluteUrl(req, `/sitemap-${g}.xml`))}</loc>${latest(g) ? `<lastmod>${latest(g)}</lastmod>` : ""}</sitemap>`), "</sitemapindex>", ""].join("\n");
}

module.exports = { entries, xml, GROUPS, SPLIT_AT };
