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
  // Formations (Titan XXIII) : celles du site principal dans son plan ; celles d'un site (module « lms » actif) dans le plan de SON domaine, sous son adresse
  const lmsOnSite = require("../services/lmsSites").hasTable(db);
  const publicCourses = db.prepare(`SELECT c.id, c.slug, c.updated_at, c.created_at, c.thumbnail_path, c.title, c.category, ${lmsOnSite ? "cs.site_id" : "NULL"} AS site_id FROM courses c
    ${lmsOnSite ? "LEFT JOIN mk_course_sites cs ON cs.course_id = c.id LEFT JOIN mk_site_modules m ON m.site_id = cs.site_id AND m.module = 'lms' AND m.enabled = 1" : ""}
    WHERE c.published = 1 AND c.archived = 0${lmsOnSite ? " AND (cs.site_id IS NULL OR m.site_id IS NOT NULL)" : ""} ORDER BY c.created_at DESC`).all();
  const courseTag = (siteId) => (siteId ? { siteId, base: urls.siteInfo(siteId).base } : {});
  const seenCat = new Set(), seenCatalogue = new Set();
  for (const c of publicCourses.slice().sort((a, b) => String(a.category).localeCompare(String(b.category)))) {
    const key = `${c.site_id || 0}|${c.category}`;
    if (seenCat.has(key)) continue;
    seenCat.add(key);
    add({ path: `/categorie/${slugify(c.category)}`, type: "Catégorie de formations", ...courseTag(c.site_id) }, c.site_id ? null : metaIndex("course_category", slugify(c.category)));
  }
  for (const c of publicCourses) {
    if (c.site_id && !seenCatalogue.has(c.site_id)) { seenCatalogue.add(c.site_id); add({ path: "/catalogue", type: "Page", ...courseTag(c.site_id) }, null); }
    add({ path: `/cours/${c.slug}`, type: "Formation", lastmod: isoDate(c.updated_at || c.created_at), images: [c.thumbnail_path].filter(Boolean), title: c.title, ...courseTag(c.site_id) }, c.site_id ? null : metaIndex("course", c.id));
  }
  blog.promoteScheduled();
  add({ path: "/blog", type: "Page" }, metaIndex("page", "blog"));
  // Contenus par site (R6 lot 4) : un article ou un terme servi par le domaine de son site est listé dans le plan de CE domaine (siteId + base), sous son adresse logique ;
  // le plan du domaine principal n'en contient aucun (même règle que les pages d'un site à domaine propre)
  const homeOf = (type, id) => urls.publicHomeOf(type, id);
  const siteTag = (home) => (home ? { siteId: home, base: urls.siteInfo(home).base } : {});
  for (const t of taxonomy.publicTerms("category")) { const home = homeOf("term", t.id); add({ path: home ? `${taxonomy.baseOf("category")}/${urls.addressOf("term", t)}` : taxonomy.urlOf(t), type: "Catégorie d'articles", ...siteTag(home) }, metaIndex("blog_category", t.slug)); }
  const blogSites = new Set();
  urls.withBatchCache(() => {
    for (const p of db.prepare(`SELECT ${require("../utils/postColumns").listColumns()} FROM posts WHERE published = 1 AND deleted_at IS NULL ORDER BY published_at DESC`).all()) { // sans le contenu : le plan du site n'en lit pas
      const home = homeOf("post", p.id);
      if (home) blogSites.add(home);
      const e = { path: urls.publicPath("post", p), type: "Article", lastmod: isoDate(p.updated_at), images: [p.cover_path].filter(Boolean), title: p.title, ...siteTag(home) };
      if (!p.robots_index) excluded.push({ ...e, reason: "Réglé en noindex" });
      else if (p.canonical_url) excluded.push({ ...e, reason: `Canonical vers ${p.canonical_url}` });
      else included.push(e);
    }
  });
  for (const id of blogSites) add({ path: "/blog", type: "Page", ...siteTag(id) }, null); // l'accueil du blog de chaque domaine qui a des articles
  // Pages Site Web / pages d'atterrissage (/p/…) : en ligne, non archivées ; indexées seulement si la page le permet
  // (case « Autoriser les moteurs de recherche ») et sans canonical vers une autre adresse ni noindex dans son SEO
  let webPages = [];
  try {
    webPages = db.prepare("SELECT p.id, p.slug, p.name, p.title, p.indexable, p.seo, (SELECT 1 FROM mk_funnel_steps st JOIN mk_funnels f ON f.id = st.funnel_id WHERE st.page_id = p.id AND f.status = 'active' AND json_extract(st.settings, '$.noindex') = 1 LIMIT 1) AS funnel_noindex, p.updated_at, p.site_id, s.settings AS site_settings FROM mk_landing_pages p LEFT JOIN mk_sites s ON s.id = p.site_id AND s.status = 'active' WHERE p.status = 'published' AND p.archived_at IS NULL ORDER BY p.published_at DESC").all();
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
    else if (p.funnel_noindex) excluded.push({ ...e, reason: "Étape de tunnel non proposée aux moteurs de recherche (réglage de l'étape)" });
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
  const authorScope = urls.contentScope("post", "posts.id", null); // pages d'auteur : seulement celles du domaine principal (les articles des domaines de sites n'y figurent pas)
  for (const a of db.prepare(`SELECT DISTINCT author_id id FROM posts WHERE published = 1 AND author_id IS NOT NULL${authorScope ? " AND " + authorScope.sql : ""}`).all(...(authorScope ? authorScope.params : []))) {
    const e = { path: `/blog/auteur/${a.id}`, type: "Auteur" };
    const rule = metaIndex("author", a.id);
    if (rule.index === 1 || (rule.index === null && st.index_authors)) add(e, rule); else excluded.push({ ...e, reason: "Auteurs non indexés (Réglages)" });
  }
  // Une adresse redirigée n'a pas sa place dans le plan du site
  // R8 lot 6 : seules comptent les redirections qui s'appliquent à CET hôte (communes + celles du site du domaine) ; celle d'un autre site n'exclut rien ici
  const redirected = new Set(db.prepare("SELECT source_path FROM seo_redirects WHERE enabled = 1 AND (site_id IS NULL OR site_id = ?)").all(hostSite ? hostSite.id : 0).map((r) => r.source_path));
  const final = [];
  for (const e of included) (redirected.has(e.path) ? excluded.push({ ...e, reason: "Adresse redirigée" }) : final.push(e));
  let kept = final;
  // Visibilité masquée (Paramètres → Indexation) : aucune adresse du site principal n'est proposée aux moteurs
  if (!hostSite && require("../middlewares/siteHost").closedBySetting()) { for (const e of final) excluded.push({ ...e, reason: "Site masqué aux moteurs de recherche (Paramètres → Indexation)" }); final.length = 0; }
  // Page d'accueil choisie dans les réglages : une seule entrée pour « / »
  { const seen = new Set(); for (let i = 0; i < final.length; i++) { const key = `${final[i].base || ""}${final[i].path}`; if (seen.has(key)) final.splice(i--, 1); else seen.add(key); } }
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

// ---------- Plan du site d'UN site (écran SEO du site) ----------
// Réutilise le même calcul que le plan servi : un site à domaine propre a le plan de son domaine ; un site sans domaine est listé dans le plan du domaine principal.
// Dans les deux cas, SEULES les adresses de CE site sont renvoyées (siteId vérifié par l'appelant) : aucune adresse d'un autre site n'est lue ni affichée.
function entriesForSite(siteId) {
  if (!Number.isInteger(siteId)) throw new Error("Plan du site d'un site : site non vérifié.");
  const info = urls.siteInfo(siteId);
  const all = entries({ hostSite: info && info.base ? info : null });
  return { included: all.included.filter((e) => e.siteId === siteId), excluded: all.excluded.filter((e) => e.siteId === siteId), ownDomain: Boolean(info && info.base), base: info && info.base ? info.base : "" };
}
// Contenu XML du plan d'un site (même rendu que /sitemap.xml ; jamais d'index de sous-plans ici : un site reste sous la limite d'un fichier)
function xmlForSite(req, siteId) {
  const { included } = entriesForSite(siteId);
  return urlset(req, included.slice(0, MAX_URLS));
}
// Contrôle d'un document de plan du site : XML bien formé, racine <urlset>, adresses absolues uniques, dates valides, limites du protocole
function validateXml(text) {
  const problems = [];
  const body = String(text || "");
  if (!body.trim()) return { valid: false, urls: 0, problems: ["Le plan du site est vide."] };
  if (Buffer.byteLength(body) > 50 * 1024 * 1024) problems.push("Le fichier dépasse 50 Mo (limite du protocole).");
  const { parseDocument } = require("htmlparser2");
  const DomUtils = require("domutils");
  const doc = parseDocument(body, { xmlMode: true });
  const root = doc.children.find((n) => n.type === "tag");
  if (!root || root.name !== "urlset") return { valid: false, urls: 0, problems: ["La racine du document doit être <urlset>."] };
  const seen = new Set();
  let count = 0;
  for (const u of DomUtils.findAll((n) => n.name === "url", root.children)) {
    count++;
    const loc = DomUtils.textContent(DomUtils.findOne((n) => n.name === "loc", u.children) || { children: [] }).trim();
    if (!/^https?:\/\/[^\s]+$/i.test(loc)) problems.push(`Adresse non absolue ou illisible : « ${loc.slice(0, 80)} ».`);
    else if (loc.length > 2048) problems.push("Une adresse dépasse 2 048 caractères.");
    if (seen.has(loc)) problems.push(`Adresse en double : ${loc.slice(0, 80)}.`);
    seen.add(loc);
    const lm = DomUtils.findOne((n) => n.name === "lastmod", u.children);
    if (lm && !/^\d{4}-\d{2}-\d{2}(T[\d:.+\-Z]+)?$/.test(DomUtils.textContent(lm).trim())) problems.push(`Date de dernière modification invalide pour ${loc.slice(0, 80)}.`);
  }
  if (count > 50000) problems.push("Plus de 50 000 adresses dans un seul fichier.");
  return { valid: problems.length === 0, urls: count, problems: [...new Set(problems)].slice(0, 20) };
}

module.exports = { entries, xml, entriesForSite, xmlForSite, validateXml, GROUPS, SPLIT_AT };
