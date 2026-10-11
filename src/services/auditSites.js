// Audit d'isolation des sites (palier 2) — LECTURE SEULE, ne produit que des NOMBRES (jamais un nom, un e-mail ou un contenu).
// Utilisé par l'écran Centre de gestion → Sauvegardes → « Audit des sites » et par scripts/audit-sites.js.
// Accepte n'importe quelle connexion SQLite ouverte (sauvegarde ouverte en lecture seule, ou base en service : seules des requêtes SELECT sont émises).
const TABLES = [
  ["mk_landing_pages", "site_id", "Pages"], ["mk_web_components", "site_id", "Composants réutilisables"], ["mk_funnels", "site_id", "Tunnels"], ["mk_lists", "site_id", "Listes de contacts"],
  ["mk_segments", "site_id", "Segments"], ["mk_templates", "site_id", "Modèles d'e-mail"], ["mk_campaigns", "site_id", "Campagnes"], ["mk_automations", "site_id", "Automatisations"],
  ["mk_page_tests", "site_id", "Tests A/B de pages"], ["mk_web_events", "site_id", "Événements de visite"], ["mk_events", "site_id", "Journal d'événements"], ["mk_conversions", "site_id", "Conversions"],
  ["mk_contacts", "origin_site_id", "Contacts (site d'origine)"], ["nav_menus", "site_id", "Menus"], ["nav_locations", "site_id", "Emplacements de menus"],
  ["appearance_configs", "site_id", "Apparence"], ["appearance_patterns", "site_id", "Patterns"], ["cms_revisions", "site_id", "Historique des modifications"], ["seo_redirects", "site_id", "Redirections"],
];
const CHECKS = [
  { key: "step", table: "mk_funnel_steps", label: "Étapes de tunnel qui utilisent la page d'un autre site", fix: "Détacher l'étape du tunnel ou déplacer la page : l'application signale déjà cette étape comme cassée.",
    sql: "SELECT COUNT(*) n FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id JOIN mk_landing_pages p ON p.id = s.page_id WHERE p.site_id IS NOT f.site_id" },
  { key: "parent", table: "mk_landing_pages", label: "Pages dont la page parente est d'un autre site", fix: "Retirer le lien de parenté (page parente vide).",
    sql: "SELECT COUNT(*) n FROM mk_landing_pages c JOIN mk_landing_pages p ON p.id = c.parent_id WHERE p.site_id IS NOT c.site_id" },
  { key: "home", table: "mk_sites", label: "Sites dont la page d'accueil appartient à un autre site", fix: "Retirer la page d'accueil de ce site (à re-choisir ensuite).",
    sql: "SELECT COUNT(*) n FROM mk_sites s JOIN mk_landing_pages p ON p.id = s.home_page_id WHERE p.site_id IS NOT s.id" },
  { key: "component", table: "mk_web_components", label: "Pages qui utilisent un composant réservé à un autre site", fix: "Rendre le composant global, ou retirer ce composant de la page.",
    sql: "SELECT COUNT(DISTINCT p.id) n FROM mk_landing_pages p JOIN mk_web_components c ON c.site_id IS NOT NULL AND c.site_id IS NOT p.site_id AND (p.sections LIKE '%\"componentId\":' || c.id || '}%' OR p.sections LIKE '%\"componentId\":' || c.id || ',%' OR p.draft LIKE '%\"componentId\":' || c.id || '}%' OR p.draft LIKE '%\"componentId\":' || c.id || ',%')" },
  { key: "archived", table: "mk_sites", label: "Pages en ligne dans un site archivé ou supprimé", fix: "Mettre ces pages hors ligne.",
    sql: "SELECT COUNT(*) n FROM mk_landing_pages p JOIN mk_sites s ON s.id = p.site_id WHERE p.status = 'published' AND (s.status <> 'active' OR s.deleted_at IS NOT NULL)" },
];

function run(db) {
  const has = (t) => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t));
  const cols = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
  const out = { ok: true, hasSites: has("mk_sites"), sites: null, tables: [], checks: [], anomalies: 0 };
  if (!out.hasSites) return out;
  const hasDeleted = cols("mk_sites").includes("deleted_at");
  out.sites = {
    total: db.prepare("SELECT COUNT(*) n FROM mk_sites").get().n,
    deleted: hasDeleted ? db.prepare("SELECT COUNT(*) n FROM mk_sites WHERE deleted_at IS NOT NULL").get().n : null,
    archived: db.prepare("SELECT COUNT(*) n FROM mk_sites WHERE status = 'archived'").get().n,
  };
  for (const [t, c, label] of TABLES) {
    if (!has(t) || !cols(t).includes(c)) { out.tables.push({ table: t, label, absent: true }); continue; }
    const r = db.prepare(`SELECT COUNT(*) total, COALESCE(SUM(${c} IS NULL), 0) principal, COALESCE(SUM(${c} IS NOT NULL), 0) rattachees,
      COALESCE(SUM(${c} IS NOT NULL AND ${c} NOT IN (SELECT id FROM mk_sites)), 0) orphelines FROM ${t}`).get();
    out.anomalies += r.orphelines;
    out.tables.push({ table: t, label, total: r.total, principal: r.principal, rattachees: r.rattachees, orphelines: r.orphelines });
  }
  for (const c of CHECKS) {
    if (!has(c.table) || !has("mk_landing_pages") || (c.key === "archived" && !hasDeleted)) { out.checks.push({ key: c.key, label: c.label, fix: c.fix, unavailable: true }); continue; }
    let n = null;
    try { n = db.prepare(c.sql).get().n; } catch { n = null; }
    if (n === null) { out.checks.push({ key: c.key, label: c.label, fix: c.fix, unavailable: true }); continue; }
    out.anomalies += n;
    out.checks.push({ key: c.key, label: c.label, fix: c.fix, n });
  }
  return out;
}

module.exports = { run, TABLES, CHECKS };
