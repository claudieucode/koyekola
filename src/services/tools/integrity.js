// Contrôle d'intégrité et données orphelines (palier 13) : LECTURE SEULE. Il détecte les références brisées et les éléments potentiellement
// inutilisés ; rien n'est modifié ni supprimé automatiquement. Seules trois corrections ciblées existent (relations, révisions et historiques
// d'adresses dont la ressource n'existe plus), précédées d'une simulation et d'une confirmation (voir fix()).
const db = require("../../config/database");
const runner = require("./runner");
const runs = require("./runs");

const safe = (fn, fallback) => { try { return fn(); } catch (e) { if (/no such (table|column)/i.test(e.message)) return fallback; throw e; } };
const group = (key, label, rows, extra = {}) => ({ key, label, count: rows.length, examples: rows.slice(0, 8), ...extra });

// Médias de la médiathèque qu'aucun contenu connu ne référence (« potentiellement inutilisés » : un lien saisi à la main peut les utiliser)
function unusedMedia() {
  const all = safe(() => db.prepare("SELECT id, path, name FROM mk_media WHERE deleted_at IS NULL").all(), []);
  if (!all.length) return [];
  const unused = new Map(all.map((m) => [m.path, m]));
  const PATH = /\/uploads\/marketing\/\d+\/(?:site-\d+\/)?(?:\d{4}\/\d{2}\/)?[A-Za-z0-9_.-]+/g;
  const eat = (text) => { if (!text) return; for (const m of String(text).matchAll(PATH)) unused.delete(m[0]); };
  const scan = (sql) => safe(() => { for (const r of db.prepare(sql).iterate()) for (const v of Object.values(r)) eat(v); }, null);
  scan("SELECT content, cover_path, og_image_path, twitter_image_path FROM posts");
  scan("SELECT sections, draft, seo, theme FROM mk_landing_pages");
  scan("SELECT section FROM mk_web_components");
  scan("SELECT settings, tokens FROM mk_sites");
  scan("SELECT blocks FROM mk_templates");
  scan("SELECT content FROM blog_reusable_blocks");
  scan("SELECT og_image_path FROM seo_meta");
  scan("SELECT value FROM seo_settings");
  scan("SELECT thumbnail_path, description FROM courses");
  scan("SELECT data FROM appearance_revisions");
  scan("SELECT draft, published FROM appearance_configs");
  scan("SELECT content FROM appearance_patterns");
  scan("SELECT url, icon FROM nav_items");
  return [...unused.values()];
}

function scan({ quick = false } = {}) {
  const groups = [];
  // 1. Menus qui pointent vers une ressource supprimée ou à la corbeille
  groups.push(group("menu_refs", "Éléments de menu vers une ressource supprimée", safe(() => db.prepare(`
    SELECT i.id, m.id AS menu_id, m.name AS menu, i.label, i.type FROM nav_items i JOIN nav_menus m ON m.id = i.menu_id WHERE i.object_id IS NOT NULL AND (
      (i.type = 'page' AND NOT EXISTS (SELECT 1 FROM mk_landing_pages p WHERE p.id = i.object_id AND p.archived_at IS NULL)) OR
      (i.type = 'article' AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.id = i.object_id AND p.deleted_at IS NULL)) OR
      (i.type IN ('category', 'tag') AND NOT EXISTS (SELECT 1 FROM taxonomy_terms t WHERE t.id = i.object_id)))`).all().map((r) => ({ title: `${r.menu} › ${r.label || r.type}`, href: `/marketing/site-web/navigation/menus/${r.menu_id}` })), []), { help: "Corrigez ou retirez ces éléments dans Navigation." }));
  // 2. Relations de taxonomie vers un contenu qui n'existe plus
  const relRows = safe(() => db.prepare("SELECT r.content_type, r.content_id, r.term_id FROM taxonomy_relations r WHERE r.content_type = 'post' AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.id = r.content_id)").all(), []);
  groups.push(group("taxonomy_relations", "Relations de catégories / étiquettes vers un article supprimé", relRows.map((r) => ({ title: `${r.content_type} n° ${r.content_id} ↔ terme n° ${r.term_id}` })), { fix: "taxonomy_relations", help: "Sans danger à nettoyer : le contenu n'existe plus." }));
  // 3. Révisions d'une page ou d'un article supprimé
  const revRows = safe(() => db.prepare(`SELECT id, content_type, content_id FROM cms_revisions WHERE (content_type = 'page' AND NOT EXISTS (SELECT 1 FROM mk_landing_pages p WHERE p.id = content_id))
    OR (content_type = 'post' AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.id = content_id))`).all(), []);
  groups.push(group("revisions", "Révisions d'une ressource supprimée", revRows.map((r) => ({ title: `${r.content_type} n° ${r.content_id} (révision ${r.id})` })), { fix: "revisions", help: "L'historique d'une ressource définitivement supprimée n'est plus consultable." }));
  // 4. Historique d'adresses : ressource supprimée, ou ancienne adresse reprise par une page vivante
  const histRows = safe(() => db.prepare(`SELECT h.id, h.resource_type, h.old_slug FROM cms_url_history h WHERE
    (h.resource_type = 'page' AND (NOT EXISTS (SELECT 1 FROM mk_landing_pages p WHERE p.id = h.resource_id) OR EXISTS (SELECT 1 FROM mk_landing_pages p WHERE p.slug = h.old_slug)))
    OR (h.resource_type <> 'page' AND NOT EXISTS (SELECT 1 FROM taxonomy_terms t WHERE t.id = h.resource_id))`).all(), []);
  groups.push(group("url_history", "Anciennes adresses sans destination", histRows.map((r) => ({ title: `${r.resource_type} · ${r.old_slug}` })), { fix: "url_history", help: "Ces anciennes adresses ne mènent plus nulle part." }));
  // 5. Commentaires d'un article supprimé
  const comRows = safe(() => db.prepare("SELECT id FROM blog_comments c WHERE COALESCE(c.content_type, 'post') = 'post' AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.id = COALESCE(c.content_id, c.post_id))").all(), []);
  groups.push(group("comments", "Commentaires d'un article supprimé", comRows.map((r) => ({ title: `Commentaire n° ${r.id}` })), { help: "À examiner : un commentaire peut contenir des informations utiles." }));
  // 6. Réglages SEO d'un contenu qui n'existe plus
  const seoRows = safe(() => db.prepare(`SELECT entity_type, entity_key FROM seo_meta WHERE (entity_type = 'blog_category' AND NOT EXISTS (SELECT 1 FROM taxonomy_terms t WHERE t.taxonomy = 'category' AND t.slug = entity_key))
    OR (entity_type = 'blog_tag' AND NOT EXISTS (SELECT 1 FROM taxonomy_terms t WHERE t.taxonomy = 'tag' AND t.slug = entity_key))
    OR (entity_type = 'course' AND NOT EXISTS (SELECT 1 FROM courses c WHERE CAST(c.id AS TEXT) = entity_key))`).all(), []);
  groups.push(group("seo_meta", "Réglages SEO d'un contenu supprimé", seoRows.map((r) => ({ title: `${r.entity_type} · ${r.entity_key}` })), { help: "À retirer depuis l'Espace SEO si le contenu n'existe plus." }));
  // 7. Doublons critiques : adresse d'article reprise par une ancienne adresse d'un autre article
  const dup = safe(() => db.prepare("SELECT h.old_slug FROM post_slug_history h JOIN posts p ON p.slug = h.old_slug WHERE p.id <> h.post_id").all(), []);
  groups.push(group("slug_duplicates", "Adresses d'articles en doublon avec un historique", dup.map((r) => ({ title: r.old_slug })), { help: "Une ancienne adresse masquée par un autre article : la redirection ne fonctionne plus." }));
  // 8. Taxonomies inutilisées
  const unusedTerms = safe(() => db.prepare("SELECT t.id, t.taxonomy, t.name FROM taxonomy_terms t WHERE NOT EXISTS (SELECT 1 FROM taxonomy_relations r WHERE r.term_id = t.id) AND NOT EXISTS (SELECT 1 FROM taxonomy_terms c WHERE c.parent_id = t.id)").all(), []);
  groups.push(group("unused_terms", "Catégories et étiquettes inutilisées", unusedTerms.map((t) => ({ title: `${t.taxonomy === "tag" ? "Étiquette" : "Catégorie"} « ${t.name} »`, href: `/marketing/site-web/articles/${t.taxonomy === "tag" ? "etiquettes" : "categories"}` })), { info: true, help: "Potentiellement inutiles : à supprimer vous-même si besoin." }));
  // 9. Menus sans emplacement
  const menus = safe(() => db.prepare("SELECT m.id, m.name FROM nav_menus m WHERE NOT EXISTS (SELECT 1 FROM nav_locations l WHERE l.menu_id = m.id)").all(), []);
  groups.push(group("unassigned_menus", "Menus sans emplacement", menus.map((m) => ({ title: m.name, href: `/marketing/site-web/navigation/menus/${m.id}` })), { info: true, help: "Menus créés mais affichés nulle part." }));
  // Qualité du contenu : propositions de correction (aucune modification automatique)
  const untitled = safe(() => [
    ...db.prepare("SELECT id, 'Page' AS kind FROM mk_landing_pages WHERE archived_at IS NULL AND kind <> 'step' AND TRIM(COALESCE(name, '')) = ''").all().map((r) => ({ title: `Page n° ${r.id} sans titre`, href: `/marketing/pages/${r.id}` })),
    ...db.prepare("SELECT id FROM posts WHERE deleted_at IS NULL AND TRIM(COALESCE(title, '')) = ''").all().map((r) => ({ title: `Article n° ${r.id} sans titre`, href: `/marketing/site-web/articles?s=${r.id}` })),
  ], []);
  groups.push(group("untitled", "Contenus sans titre", untitled, { help: "Donnez-leur un titre depuis leur éditeur : rien n'est renommé automatiquement." }));
  const noSlug = safe(() => [
    ...db.prepare("SELECT id, name FROM mk_landing_pages WHERE archived_at IS NULL AND kind <> 'step' AND TRIM(COALESCE(slug, '')) = ''").all().map((r) => ({ title: `Page « ${r.name || r.id} » sans adresse`, href: `/marketing/pages/${r.id}` })),
    ...db.prepare("SELECT id, title FROM posts WHERE deleted_at IS NULL AND TRIM(COALESCE(slug, '')) = ''").all().map((r) => ({ title: `Article « ${r.title || r.id} » sans adresse` })),
  ], []);
  groups.push(group("no_slug", "Contenus sans adresse (slug)", noSlug, { help: "Ouvrez le contenu et enregistrez-le : une adresse est proposée d'après son titre." }));
  const dupTitles = safe(() => db.prepare("SELECT title, COUNT(*) n FROM posts WHERE deleted_at IS NULL AND TRIM(COALESCE(title, '')) <> '' GROUP BY LOWER(title) HAVING n > 1 ORDER BY n DESC").all(), []);
  groups.push(group("duplicate_titles", "Articles de même titre", dupTitles.map((r) => ({ title: `« ${r.title} » ×${r.n}` })), { info: true, help: "Deux articles au même titre ne sont pas une erreur, mais peuvent être un doublon." }));
  if (!quick) {
    // 10. Médias inutilisés (lecture de tous les contenus : plus long)
    const media = unusedMedia();
    groups.push(group("unused_media", "Médias potentiellement inutilisés", media.map((m) => ({ title: m.name, href: "/marketing/site-web/medias" })), { info: true, help: "Aucun contenu connu ne les référence ; un lien saisi à la main peut les utiliser. Rien n'est supprimé automatiquement." }));
    // 11. Fichiers présents sans fiche (audit des médias existant)
    try { const a = require("../../config/mediaAudit").auditMedia(db); groups.push(group("orphan_files", "Fichiers sans fiche de médiathèque", Array.from({ length: Math.min(a.orphanFiles, 8) }, (_, i) => ({ title: `Fichier orphelin ${i + 1}` })), { count: a.orphanFiles, info: true, help: "Présents sur le disque mais absents de la médiathèque (version réduite exclue)." })); } catch { /* audit médias indisponible */ }
  }
  const problems = groups.filter((g) => !g.info);
  return { groups, total: problems.reduce((a, g) => a + g.count, 0), potential: groups.filter((g) => g.info).reduce((a, g) => a + g.count, 0), at: new Date().toISOString() };
}

// Corrections ciblées : `dry` = simulation (compte seulement), sinon applique. Chaque clé est une requête précise et bornée.
const FIXES = {
  taxonomy_relations: { sql: "DELETE FROM taxonomy_relations WHERE content_type = 'post' AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.id = taxonomy_relations.content_id)", count: "SELECT COUNT(*) n FROM taxonomy_relations WHERE content_type = 'post' AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.id = taxonomy_relations.content_id)", label: "relations de catégories / étiquettes" },
  revisions: { sql: "DELETE FROM cms_revisions WHERE (content_type = 'page' AND NOT EXISTS (SELECT 1 FROM mk_landing_pages p WHERE p.id = content_id)) OR (content_type = 'post' AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.id = content_id))",
    count: "SELECT COUNT(*) n FROM cms_revisions WHERE (content_type = 'page' AND NOT EXISTS (SELECT 1 FROM mk_landing_pages p WHERE p.id = content_id)) OR (content_type = 'post' AND NOT EXISTS (SELECT 1 FROM posts p WHERE p.id = content_id))", label: "révisions" },
  url_history: { sql: "DELETE FROM cms_url_history WHERE (resource_type = 'page' AND (NOT EXISTS (SELECT 1 FROM mk_landing_pages p WHERE p.id = resource_id) OR EXISTS (SELECT 1 FROM mk_landing_pages p WHERE p.slug = old_slug))) OR (resource_type <> 'page' AND NOT EXISTS (SELECT 1 FROM taxonomy_terms t WHERE t.id = resource_id))",
    count: "SELECT COUNT(*) n FROM cms_url_history WHERE (resource_type = 'page' AND (NOT EXISTS (SELECT 1 FROM mk_landing_pages p WHERE p.id = resource_id) OR EXISTS (SELECT 1 FROM mk_landing_pages p WHERE p.slug = old_slug))) OR (resource_type <> 'page' AND NOT EXISTS (SELECT 1 FROM taxonomy_terms t WHERE t.id = resource_id))", label: "anciennes adresses" },
};
function fix(key, { dry = true } = {}) {
  const f = FIXES[key];
  if (!f) throw new Error("Correction inconnue.");
  const n = db.prepare(f.count).get().n;
  if (!dry && n) db.prepare(f.sql).run();
  return { key, label: f.label, count: n, applied: !dry && n > 0 };
}

runner.register("integrity", async (run, api) => {
  api.setTotal(1);
  api.message("Contrôle d'intégrité en cours…");
  await api.yieldTurn();
  const result = scan({ quick: false });
  api.advance({ done: 1 });
  return { status: "done", report: result, message: result.total ? `${result.total} anomalie(s) détectée(s).` : "Aucune anomalie." };
});
function start(ctx, siteId = null) {
  const run = runs.create({ organizationId: ctx.organizationId, siteId, userId: ctx.userId, kind: "integrity" });
  runner.start(run, "integrity");
  return run;
}

module.exports = { scan, fix, FIXES, start, unusedMedia };
