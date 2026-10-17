// Contrôles AVANT reconstruction (R6 lot 5) — LECTURE SEULE, uniquement des NOMBRES et des identifiants techniques (jamais un titre, un nom, un e-mail ou un contenu).
// Rôle : dire si les tables peuvent être reconstruites (unicité des adresses PAR SITE) sans rien perdre ni rien rendre ambigu. Chaque constat porte une gravité :
//   « block » : la reconstruction ne doit pas être lancée tant qu'il existe ; « warn » : à lire, non bloquant.
// Les contenus ambigus sont listés dans `exclusions` : AUCUNE transformation automatique ne doit les toucher (attribution à décider par une personne).
// Il accepte n'importe quelle connexion SQLite (copie d'une sauvegarde ouverte en lecture seule) ; seules des requêtes SELECT sont émises.
const has = (db, t) => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t));
const cols = (db, t) => (has(db, t) ? db.prepare(`PRAGMA table_info("${t}")`).all().map((c) => c.name) : []);
// Normalisation d'une adresse : casse, accents, espaces, barres de fin (c'est ainsi que deux adresses « différentes » se confondraient après reconstruction)
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\/+$/, "").replace(/\s+/g, "-");
const SAMPLE = 8;

function run(db) {
  const findings = [];
  const exclusions = [];
  const add = (code, severity, rows, note, extra = {}) => { if (rows.length) findings.push({ code, severity, count: rows.length, sample: rows.slice(0, SAMPLE), note, ...extra }); };
  const q = (sql, ...a) => { try { return db.prepare(sql).all(...a); } catch (e) { if (/no such (table|column)/i.test(e.message)) return []; throw e; } };
  const site = (v) => (v === null || v === undefined ? 0 : v);
  const exclude = (type, id, reason) => { if (!exclusions.some((e) => e.type === type && e.id === id && e.reason === reason)) exclusions.push({ type, id, reason }); };

  // ---------- 1. Collisions d'adresses APRÈS normalisation (par site pour les tables qui ont déjà un site) ----------
  const groupDup = (rows, keyOf, label) => {
    const g = new Map();
    for (const r of rows) { const k = keyOf(r); g.set(k, [...(g.get(k) || []), r.id]); }
    return [...g.values()].filter((ids) => ids.length > 1);
  };
  const pageDup = groupDup(q("SELECT id, site_id, slug FROM mk_landing_pages"), (r) => `${site(r.site_id)}|${norm(r.slug)}`);
  add("adresses_pages", "block", pageDup.map((ids) => ids.join("=")), "Pages dont l'adresse devient identique après normalisation (casse, accents, barre finale) dans un même site.");
  for (const ids of pageDup) for (const id of ids) exclude("page", id, "adresse en collision après normalisation");
  const postDup = groupDup(q("SELECT id, slug FROM posts"), (r) => norm(r.slug));
  add("adresses_articles", "block", postDup.map((ids) => ids.join("=")), "Articles dont l'adresse se confond après normalisation.");
  for (const ids of postDup) for (const id of ids) exclude("post", id, "adresse en collision après normalisation");
  const termDup = groupDup(q("SELECT id, taxonomy, slug FROM taxonomy_terms"), (r) => `${r.taxonomy}|${norm(r.slug)}`);
  add("adresses_termes", "block", termDup.map((ids) => ids.join("=")), "Termes dont l'adresse se confond après normalisation dans une même taxonomie.");
  for (const ids of termDup) for (const id of ids) exclude("term", id, "adresse en collision après normalisation");
  // Adresses LOGIQUES (lot 1) : une adresse logique égale à l'adresse actuelle d'un AUTRE article du même site rend la résolution ambiguë
  const logical = q(`SELECT cs.content_id AS id, cs.site_id, cs.address FROM mk_content_sites cs JOIN posts p ON p.id = cs.content_id
      WHERE cs.content_type = 'post' AND cs.address IS NOT NULL AND EXISTS (SELECT 1 FROM mk_content_sites o JOIN posts q ON q.id = o.content_id WHERE o.content_type = 'post' AND o.site_id = cs.site_id AND o.content_id <> cs.content_id AND COALESCE(o.address, q.slug) = cs.address)`);
  add("adresses_logiques_ambigues", "block", logical.map((r) => r.id), "Article dont l'adresse logique est déjà l'adresse (logique ou actuelle) d'un autre article du même site.");
  for (const r of logical) exclude("post", r.id, "adresse logique ambiguë dans son site");

  // ---------- 2. Collisions avec l'historique et les redirections ----------
  const histVsLive = q("SELECT h.old_slug AS id FROM post_slug_history h JOIN posts p ON p.slug = h.old_slug WHERE p.id <> h.post_id");
  add("historique_articles_adresse_vivante", "block", histVsLive.map((r) => r.id), "Ancienne adresse d'article égale à l'adresse actuelle d'un autre article.");
  const cmsHist = q(`SELECT h.id FROM cms_url_history h WHERE (h.resource_type = 'page' AND EXISTS (SELECT 1 FROM mk_landing_pages p WHERE p.slug = h.old_slug AND p.id <> h.resource_id))
      OR (h.resource_type <> 'page' AND EXISTS (SELECT 1 FROM taxonomy_terms t WHERE t.taxonomy = h.resource_type AND t.slug = h.old_slug AND t.id <> h.resource_id))`);
  add("historique_cms_adresse_vivante", "block", cmsHist.map((r) => r.id), "Ancienne adresse de page ou de terme égale à l'adresse actuelle d'une autre ressource.");
  const redirDup = groupDup(q("SELECT id, site_id, source_path AS slug FROM seo_redirects"), (r) => `${site(r.site_id)}|${norm(r.slug)}`);
  add("redirections_sources_dupliquees", "block", redirDup.map((ids) => ids.join("=")), "Redirections dont l'adresse source se confond après normalisation dans un même site.");
  for (const ids of redirDup) for (const id of ids) exclude("redirect", id, "source en collision après normalisation");
  const liveAddr = new Set([
    ...q("SELECT slug FROM posts WHERE published = 1").map((r) => `/blog/${r.slug}`),
    ...q("SELECT slug FROM mk_landing_pages WHERE status = 'published' AND archived_at IS NULL").flatMap((r) => [`/p/${r.slug}`, `/${r.slug}`]),
  ]);
  add("redirections_masquent_contenu", "warn", q("SELECT id, source_path FROM seo_redirects WHERE enabled = 1").filter((r) => liveAddr.has(r.source_path)).map((r) => r.id), "Redirection active dont la source est l'adresse d'un contenu en ligne (le contenu est masqué).");
  add("redirections_site_inconnu", "block", q("SELECT r.id FROM seo_redirects r WHERE r.site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mk_sites s WHERE s.id = r.site_id)").map((r) => r.id), "Redirection rattachée à un site qui n'existe plus.");
  const internalTargets = q("SELECT id, target FROM seo_redirects WHERE enabled = 1 AND target LIKE '/%'");
  const postSlugs = new Set(q("SELECT slug FROM posts").map((r) => r.slug)); const pageSlugs = new Set(q("SELECT slug FROM mk_landing_pages").map((r) => r.slug));
  add("redirections_cible_absente", "warn", internalTargets.filter((r) => { const m = /^\/blog\/([^/?#]+)$/.exec(r.target) || null; const p = /^\/p\/([^/?#]+)$/.exec(r.target) || null; return (m && !postSlugs.has(m[1])) || (p && !pageSlugs.has(p[1])); }).map((r) => r.id), "Redirection interne vers un article ou une page qui n'existe plus.");

  // ---------- 3. Références orphelines ----------
  add("relations_sans_terme", "block", q("SELECT r.content_id AS id FROM taxonomy_relations r LEFT JOIN taxonomy_terms t ON t.id = r.term_id WHERE t.id IS NULL").map((r) => r.id), "Relation vers un terme inexistant.");
  add("relations_sans_article", "block", q("SELECT r.content_id AS id FROM taxonomy_relations r LEFT JOIN posts p ON p.id = r.content_id WHERE r.content_type = 'post' AND p.id IS NULL").map((r) => r.id), "Relation depuis un article inexistant.");
  add("commentaires_sans_contenu", "warn", q("SELECT c.id FROM blog_comments c WHERE c.content_type = 'post' AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.id = c.content_id)").map((r) => r.id), "Commentaire dont l'article n'existe plus.");
  add("historique_articles_sans_article", "block", q("SELECT h.old_slug AS id FROM post_slug_history h LEFT JOIN posts p ON p.id = h.post_id WHERE p.id IS NULL").map((r) => r.id), "Ancienne adresse d'un article inexistant.");
  add("rattachements_sans_contenu", "block", q(`SELECT cs.content_id AS id FROM mk_content_sites cs WHERE (cs.content_type = 'post' AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.id = cs.content_id)) OR (cs.content_type = 'term' AND NOT EXISTS (SELECT 1 FROM taxonomy_terms t WHERE t.id = cs.content_id))`).map((r) => r.id), "Rattachement à un site dont le contenu n'existe plus.");
  add("rattachements_site_supprime", "block", q("SELECT cs.content_id AS id FROM mk_content_sites cs JOIN mk_sites s ON s.id = cs.site_id WHERE s.deleted_at IS NOT NULL").map((r) => r.id), "Contenu rattaché à un site supprimé : attribution à décider.");
  for (const r of q("SELECT cs.content_type AS type, cs.content_id AS id FROM mk_content_sites cs JOIN mk_sites s ON s.id = cs.site_id WHERE s.deleted_at IS NOT NULL")) exclude(r.type, r.id, "site supprimé : attribution à décider");
  // Références de menus (type page / article / catégorie / étiquette) vers un objet absent
  const navMissing = q(`SELECT i.id FROM nav_items i WHERE i.object_id IS NOT NULL AND (
      (i.type = 'page' AND NOT EXISTS (SELECT 1 FROM mk_landing_pages p WHERE p.id = i.object_id)) OR (i.type = 'article' AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.id = i.object_id))
      OR (i.type IN ('category', 'tag') AND NOT EXISTS (SELECT 1 FROM taxonomy_terms t WHERE t.id = i.object_id)))`);
  add("menus_reference_absente", "warn", navMissing.map((r) => r.id), "Élément de menu qui désigne un contenu inexistant.");
  // Références SEO (par adresse de terme) vers un terme absent
  add("seo_reference_absente", "warn", q(`SELECT m.rowid AS id FROM seo_meta m WHERE (m.entity_type = 'blog_category' AND NOT EXISTS (SELECT 1 FROM taxonomy_terms t WHERE t.taxonomy = 'category' AND t.slug = m.entity_key))
      OR (m.entity_type = 'blog_tag' AND NOT EXISTS (SELECT 1 FROM taxonomy_terms t WHERE t.taxonomy = 'tag' AND t.slug = m.entity_key))`).map((r) => r.id), "Réglage SEO rattaché à une adresse de terme qui n'existe plus.");

  // ---------- 4. Relations entre sites différents ----------
  const siteOf = (type, id) => { const r = db.prepare("SELECT site_id FROM mk_content_sites WHERE content_type = ? AND content_id = ?").get(type, id); return r ? r.site_id : 0; };
  const cross = has(db, "mk_content_sites") ? q("SELECT r.content_id AS post, r.term_id AS term FROM taxonomy_relations r WHERE r.content_type = 'post'").filter((r) => siteOf("post", r.post) !== siteOf("term", r.term)) : [];
  add("relations_article_terme_entre_sites", "block", cross.map((r) => `${r.post}:${r.term}`), "Article lié à un terme d'un AUTRE site.");
  for (const r of cross) { exclude("post", r.post, "lié à un terme d'un autre site"); exclude("term", r.term, "utilisé par un article d'un autre site"); }
  const multiSite = q(`SELECT r.term_id AS id FROM taxonomy_relations r WHERE r.content_type = 'post' GROUP BY r.term_id`).filter((r) => new Set(q("SELECT content_id FROM taxonomy_relations WHERE content_type = 'post' AND term_id = ?", r.id).map((x) => siteOf("post", x.content_id))).size > 1);
  add("termes_utilises_par_plusieurs_sites", "block", multiSite.map((r) => r.id), "Terme utilisé par des articles de plusieurs sites (taxonomie partagée).");
  for (const r of multiSite) exclude("term", r.id, "taxonomie partagée entre sites : attribution à décider");
  // Contrôles d'isolation déjà établis (audit des sites) : pages ↔ parents, accueil, étapes de tunnel, composants
  try {
    const audit = require("./auditSites").run(db);
    for (const c of audit.checks || []) if (!c.unavailable && c.n > 0) findings.push({ code: `isolation_${c.key}`, severity: "block", count: c.n, sample: [], note: c.label });
  } catch { /* module d'audit indisponible : sans effet sur les autres contrôles */ }
  // Menus d'un site qui désignent un contenu d'un autre site
  const menuCross = has(db, "nav_menus") ? q("SELECT i.id, m.site_id AS menu_site, i.type, i.object_id FROM nav_items i JOIN nav_menus m ON m.id = i.menu_id WHERE i.object_id IS NOT NULL AND i.type IN ('page', 'article', 'category', 'tag')").filter((r) => {
    const owner = r.type === "page" ? (db.prepare("SELECT site_id FROM mk_landing_pages WHERE id = ?").get(r.object_id) || {}).site_id : r.type === "article" ? siteOf("post", r.object_id) : siteOf("term", r.object_id);
    return owner !== undefined && site(owner) !== site(r.menu_site);
  }) : [];
  add("menus_vers_autre_site", "warn", menuCross.map((r) => r.id), "Élément de menu d'un site qui désigne un contenu d'un autre site.");

  // ---------- 5. Médias R5 : fichiers propres à un site utilisés par un contenu d'un autre site ----------
  try {
    const media = require("../marketing/media");
    const org = (db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get() || {}).id;
    if (org && has(db, "mk_media")) { const used = media.crossSiteUsage({ db, organizationId: org, userId: null, audit: false }); add("medias_site_utilises_ailleurs", "warn", used.map((u) => u.media.id), "Fichier propre à un site utilisé par un contenu d'un autre site."); }
  } catch { /* médias non migrés : sans objet */ }

  const blocking = findings.some((f) => f.severity === "block");
  return { blocking, findings, exclusions, totals: { block: findings.filter((f) => f.severity === "block").length, warn: findings.filter((f) => f.severity === "warn").length, excluded: exclusions.length } };
}

module.exports = { run, norm };
