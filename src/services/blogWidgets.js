// Données des blocs « dynamiques » d'un article (derniers articles, catégories, étiquettes, archives, calendrier, liste des pages, flux RSS).
// RÈGLE MULTI-SITES : tout est limité au site de l'article rendu (siteContent) : un article d'un site ne liste jamais les articles, catégories,
// étiquettes ou pages d'un autre site. Un article sans site (ou aperçu sans identifiant) ne voit que le site principal.
// Lecture seule ; aucune de ces fonctions n'écrit. Le flux RSS ne fait AUCUNE requête réseau à l'affichage (cache uniquement, voir rssFeeds.js).
const db = require("../config/database");
const siteContent = require("./siteContent");
const taxonomy = require("./taxonomy");
const urls = require("./urls");

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const frDate = (iso) => {
  const d = new Date(String(iso || "").replace(" ", "T") + (String(iso || "").includes("T") || String(iso || "").endsWith("Z") ? "" : "Z"));
  return Number.isNaN(d.getTime()) ? "" : `${d.getUTCDate() === 1 ? "1er" : d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

// Fragment SQL de portée de site pour les articles / termes / pages : 0 = site principal (contenus sans site), n = site n
function siteOfPost(post) {
  if (!post || !Number.isInteger(post.id)) return 0;
  const site = siteContent.siteOf(db, "post", post.id);
  return Number.isInteger(site) && site > 0 ? site : 0;
}

// Formulaires publiés d'un site (liste de l'éditeur) : site = 0 pour le site principal
function listForms(site = 0) {
  try {
    const org = db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get();
    if (!org) return [];
    return db.prepare(`SELECT slug, name FROM mk_forms WHERE organization_id = ? AND status = 'published' AND ${site === 0 ? "site_id IS NULL" : "site_id = ?"} ORDER BY name COLLATE NOCASE LIMIT 100`).all(org.id, ...(site === 0 ? [] : [site]));
  } catch { return []; }
}

function forPost(post, { excerptOf = (p) => p.excerpt || "" } = {}) {
  const site = siteOfPost(post);
  const postScope = siteContent.scopeForSite("post", "posts.id", site);
  const termScope = siteContent.scopeForSite("term", "t.id", site);
  const live = `published = 1 AND deleted_at IS NULL${postScope ? ` AND ${postScope.sql}` : ""}`;
  const args = postScope ? postScope.params : [];
  const urlOfPost = (p) => { try { return urls.publicPath("post", p); } catch { return `/blog/${p.slug}`; } };
  return {
    site,
    latest({ count = 5, category = "" } = {}) {
      const where = [live]; const params = [...args];
      if (category) { where.push("category = ? COLLATE NOCASE"); params.push(category); }
      return db.prepare(`SELECT * FROM posts WHERE ${where.join(" AND ")} AND id != ? ORDER BY published_at DESC, id DESC LIMIT ?`).all(...params, post && post.id ? post.id : 0, Math.min(Math.max(Number(count) || 5, 1), 12))
        .map((p) => ({ title: p.title, url: urlOfPost(p), date: frDate(p.published_at), excerpt: excerptOf(p), image: p.cover_path || "", alt: p.cover_alt || "" }));
    },
    // Derniers commentaires approuvés sur les articles publiés DU MÊME SITE
    comments({ count = 5 } = {}) {
      const sc = siteContent.scopeForSite("post", "p.id", site);
      const rows = db.prepare(`SELECT c.id, c.body, c.created_at, c.author_name, c.user_id, u.username, p.title, p.slug, p.id AS pid, p.published_at FROM blog_comments c
        JOIN posts p ON c.content_type = 'post' AND p.id = c.content_id LEFT JOIN users u ON u.id = c.user_id
        WHERE c.status = 'approved' AND p.published = 1 AND p.deleted_at IS NULL${sc ? ` AND ${sc.sql}` : ""} ORDER BY c.created_at DESC, c.id DESC LIMIT ?`).all(...(sc ? sc.params : []), Math.min(Math.max(Number(count) || 5, 1), 10));
      return rows.map((r) => ({ author: r.user_id ? r.username || "Membre" : r.author_name || "Anonyme", excerpt: String(r.body || "").replace(/\s+/g, " ").trim().slice(0, 90), title: r.title, url: urlOfPost({ id: r.pid, slug: r.slug, title: r.title, published_at: r.published_at }), date: frDate(r.created_at) }));
    },
    // Chemin de l'article : Accueil › Blog › catégorie principale et ses parents › article (le dernier maillon n'est pas un lien)
    // Formulaire publié de Marketing, du MÊME site que l'article : même rendu que sa page publique (/f/<adresse>), mêmes protections (anti-robot, consentement)
    form(slug) {
      try {
        const org = db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get();
        if (!org) return null;
        const forms = require("../marketing/forms");
        const f = forms.getPublishedForm(db, org.id, String(slug || ""));
        if (!f || (f.siteId ?? 0) !== site) return null;
        const ejs = require("ejs");
        const file = require("path").join(__dirname, "..", "..", "views", "marketing-public", "_signup-fields.ejs");
        const fields = ejs.render(require("fs").readFileSync(file, "utf8"), { form: f, fieldCatalog: forms.FIELD_CATALOG, propertyDefs: forms.propertyFieldDefs(db, org.id, f), values: {}, prefix: `bf${f.id}`, formToken: require("../marketing/forms/antispam").issue(), asset: require("../utils/assets").asset, autofocus: false }, { filename: file });
        return `<form class="kb-form-embed" method="post" action="/f/${f.slug}" novalidate${f.fileField && f.fileField.enabled ? ' enctype="multipart/form-data"' : ""}><input type="hidden" name="tz" data-tz>${fields}<button type="submit" class="btn btn-primary">S'inscrire</button></form>`;
      } catch { return null; } // le blog ne dépend jamais du module marketing pour s'afficher
    },
    breadcrumbs({ home = true } = {}) {
      const trail = [];
      if (home) trail.push({ name: "Accueil", url: "/" });
      trail.push({ name: "Blog", url: "/blog" });
      if (post && Number.isInteger(post.id)) {
        const taxonomyService = require("./taxonomy");
        const terms = taxonomyService.termsOf("post", post.id);
        if (terms.primary) {
          for (const a of taxonomyService.ancestors(terms.primary.id)) trail.push({ name: a.name, url: taxonomyService.urlOf(a) });
          trail.push({ name: terms.primary.name, url: terms.primary.url });
        } else if (post.category) trail.push({ name: post.category, url: `${taxonomy.baseOf("category")}/${taxonomy.categorySlugOfName(post.category)}` });
      }
      trail.push({ name: (post && post.title) || "Article", url: "" });
      return trail;
    },
    categories() {
      const rows = db.prepare(`SELECT category, COUNT(*) n FROM posts WHERE ${live} AND category <> '' GROUP BY category COLLATE NOCASE ORDER BY n DESC, category COLLATE NOCASE LIMIT 60`).all(...args);
      return rows.map((r) => ({ name: r.category, count: r.n, url: `${taxonomy.baseOf("category")}/${taxonomy.categorySlugOfName(r.category)}` }));
    },
    tags({ max = 20 } = {}) {
      // Étiquettes de la taxonomie du site, avec le nombre d'articles publiés qui les portent
      const rows = db.prepare(`SELECT t.* , (SELECT COUNT(*) FROM taxonomy_relations r JOIN posts ON posts.id = r.content_id AND r.content_type = 'post' WHERE r.term_id = t.id AND ${live}) AS n
        FROM taxonomy_terms t WHERE t.taxonomy = 'tag'${termScope ? ` AND ${termScope.sql}` : ""} ORDER BY n DESC, t.name COLLATE NOCASE LIMIT ?`).all(...args, ...(termScope ? termScope.params : []), Math.min(Math.max(Number(max) || 20, 5), 50));
      return rows.filter((r) => r.n > 0).map((r) => ({ name: r.name, count: r.n, url: taxonomy.urlOf(r) }));
    },
    archives({ max = 12 } = {}) {
      const rows = db.prepare(`SELECT strftime('%Y-%m', published_at) ym, COUNT(*) n FROM posts WHERE ${live} AND published_at IS NOT NULL GROUP BY ym ORDER BY ym DESC LIMIT ?`).all(...args, Math.min(Math.max(Number(max) || 12, 1), 24));
      return rows.filter((r) => r.ym).map((r) => ({ label: `${MONTHS[Number(r.ym.slice(5, 7)) - 1]} ${r.ym.slice(0, 4)}`, count: r.n, url: `/blog?date=${r.ym}` }));
    },
    // Mois en cours : jours où au moins un article a paru
    calendar(now = new Date()) {
      const y = now.getUTCFullYear(); const m = now.getUTCMonth() + 1;
      const ym = `${y}-${String(m).padStart(2, "0")}`;
      const days = db.prepare(`SELECT CAST(strftime('%d', published_at) AS INTEGER) d, COUNT(*) n FROM posts WHERE ${live} AND strftime('%Y-%m', published_at) = ? GROUP BY d`).all(...args, ym);
      return { year: y, month: m, label: `${MONTHS[m - 1]} ${y}`, ym, days: Object.fromEntries(days.map((r) => [r.d, r.n])) };
    },
    pages() {
      const out = [];
      if (site === 0) for (const [title, url] of [["Accueil", "/"], ["Catalogue", "/catalogue"], ["À propos", "/a-propos"], ["FAQ", "/faq"], ["Contact", "/contact"], ["Blog", "/blog"]]) out.push({ title, url });
      else out.push({ title: "Blog", url: "/blog" });
      try {
        const rows = db.prepare(`SELECT id, slug, name, title, site_id FROM mk_landing_pages WHERE status = 'published' AND archived_at IS NULL AND kind = 'page' AND ${site === 0 ? "site_id IS NULL" : "site_id = ?"} ORDER BY name COLLATE NOCASE LIMIT 60`).all(...(site === 0 ? [] : [site]));
        for (const p of rows) out.push({ title: p.title || p.name, url: urls.pageCanonicalPath(p) });
      } catch (error) { if (!/no such (table|column)/.test(error.message)) throw error; }
      return out;
    },
    feed(url) { return require("./rssFeeds").cached(url); },
  };
}
module.exports = { forPost, listForms, frDate, MONTHS };
