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


// Préparation du palier 3 (CMS indépendant par site) — INFORMATIF, jamais compté dans les anomalies, uniquement des NOMBRES.
// Mesure ce qui existe et surtout les cas AMBIGUS : un média ou un formulaire déjà utilisé par plusieurs sites ne peut pas être rattaché à un seul site sans décision.
const KEY = (siteId) => (siteId === null || siteId === undefined ? 0 : Number(siteId)); // 0 = site principal
function classify(ownerSets) {
  const c = { inutilises: 0, principal: 0, un_site: 0, plusieurs: 0 };
  for (const owners of ownerSets) {
    if (!owners.size) c.inutilises++;
    else if (owners.size > 1) c.plusieurs++;
    else if (owners.has(0)) c.principal++;
    else c.un_site++;
  }
  return c;
}
function palier3(db) {
  const has = (t) => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t));
  const cols = (t) => (has(t) ? db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name) : []);
  const count = (sql, ...a) => { try { return db.prepare(sql).get(...a).n; } catch { return null; } };
  const out = { volumes: [], medias: null, formulaires: null, contacts: null, taxonomies: null };
  const vol = (label, table, where = "") => { if (has(table)) out.volumes.push({ label, n: count(`SELECT COUNT(*) n FROM ${table} ${where}`) }); };
  const postCols = cols("posts");
  vol("Articles (tous)", "posts"); if (postCols.includes("deleted_at")) { vol("— dont publiés", "posts", "WHERE deleted_at IS NULL AND status = 'published'"); vol("— dont brouillons", "posts", "WHERE deleted_at IS NULL AND status = 'draft'"); vol("— dont à la corbeille", "posts", "WHERE deleted_at IS NOT NULL"); }
  vol("Catégories et étiquettes", "taxonomy_terms"); vol("Liens article ↔ catégorie/étiquette", "taxonomy_relations"); vol("Commentaires du blog", "blog_comments");
  vol("Médias du blog", "media"); vol("Médias du CMS (hors corbeille)", "mk_media", cols("mk_media").includes("deleted_at") ? "WHERE deleted_at IS NULL" : "");
  vol("Formulaires", "mk_forms"); vol("Fichiers reçus par formulaire", "mk_form_files"); vol("Modèles de pages", "mk_page_templates"); vol("Blocs enregistrés", "mk_saved_blocks"); vol("Blocs réutilisables du blog", "blog_reusable_blocks");
  vol("Contacts", "mk_contacts"); vol("Consentements", "mk_consents"); vol("Métadonnées SEO (par contenu)", "seo_meta"); vol("Réglages SEO globaux", "seo_settings");

  // Qui utilise chaque média ? Texte des pages, composants, modèles d'e-mail, réglages de sites et articles (même recherche que la bibliothèque de médias, mais regroupée par site)
  if (has("mk_media") && has("mk_landing_pages")) {
    const texts = [];
    const add = (rows, f) => { for (const r of rows) texts.push({ owner: f(r), text: Object.values(r).filter((v) => typeof v === "string").join("\n") }); };
    const safeAll = (sql) => { try { return db.prepare(sql).all(); } catch { return []; } };
    add(safeAll("SELECT site_id, sections, draft, seo FROM mk_landing_pages"), (r) => KEY(r.site_id));
    add(safeAll("SELECT site_id, section FROM mk_web_components"), (r) => KEY(r.site_id));
    add(safeAll("SELECT site_id, blocks FROM mk_templates"), (r) => KEY(r.site_id));
    add(safeAll("SELECT id, tokens, settings FROM mk_sites"), (r) => KEY(r.id));
    const articles = safeAll("SELECT content, cover_path, og_image_path, twitter_image_path FROM posts");
    add(articles, () => 0);
    const where = cols("mk_media").includes("deleted_at") ? "WHERE deleted_at IS NULL" : "";
    const medias = safeAll(`SELECT path FROM mk_media ${where}`);
    const sets = medias.map((m) => { const o = new Set(); for (const t of texts) if (t.text.includes(m.path)) o.add(t.owner); return o; });
    out.medias = { total: medias.length, ...classify(sets) };
  }
  // Qui utilise chaque formulaire ? Colonne form_id des pages et références « formId » dans leur contenu
  if (has("mk_forms") && has("mk_landing_pages")) {
    const pages = (() => { try { return db.prepare("SELECT site_id, form_id, sections, draft FROM mk_landing_pages").all(); } catch { return []; } })();
    const forms = db.prepare("SELECT id FROM mk_forms").all();
    const sets = forms.map((f) => {
      const o = new Set();
      const re = new RegExp(`"formId":\\s*"?${f.id}"?(?![0-9])`);
      for (const p of pages) if (p.form_id === f.id || re.test(String(p.sections || "")) || re.test(String(p.draft || ""))) o.add(KEY(p.site_id));
      return o;
    });
    out.formulaires = { total: forms.length, ...classify(sets) };
  }
  // Contacts : origine, et appartenance à des listes de plusieurs sites (cas qui exigent la décision D12)
  if (has("mk_contacts") && cols("mk_contacts").includes("origin_site_id")) {
    const c = { total: count("SELECT COUNT(*) n FROM mk_contacts"), origine_principal: count("SELECT COUNT(*) n FROM mk_contacts WHERE origin_site_id IS NULL"), origine_site: count("SELECT COUNT(*) n FROM mk_contacts WHERE origin_site_id IS NOT NULL") };
    if (has("mk_list_members") && has("mk_lists") && cols("mk_lists").includes("site_id")) {
      c.listes_plusieurs_sites = count("SELECT COUNT(*) n FROM (SELECT m.contact_id FROM mk_list_members m JOIN mk_lists l ON l.id = m.list_id GROUP BY m.contact_id HAVING COUNT(DISTINCT COALESCE(l.site_id, 0)) > 1)");
      c.liste_autre_que_origine = count("SELECT COUNT(DISTINCT m.contact_id) n FROM mk_list_members m JOIN mk_lists l ON l.id = m.list_id JOIN mk_contacts k ON k.id = m.contact_id WHERE COALESCE(l.site_id, 0) <> COALESCE(k.origin_site_id, 0)");
    }
    out.contacts = c;
  }
  // Catégories : liens orphelins (contenu ou terme disparu) — à connaître avant de reconstruire les tables
  if (has("taxonomy_relations") && has("taxonomy_terms")) {
    out.taxonomies = {
      liens_sans_terme: count("SELECT COUNT(*) n FROM taxonomy_relations r LEFT JOIN taxonomy_terms t ON t.id = r.term_id WHERE t.id IS NULL"),
      liens_article_sans_article: has("posts") ? count("SELECT COUNT(*) n FROM taxonomy_relations r LEFT JOIN posts p ON p.id = r.content_id WHERE r.content_type = 'post' AND p.id IS NULL") : null,
      termes_par_type: db.prepare("SELECT taxonomy, COUNT(*) n FROM taxonomy_terms GROUP BY taxonomy ORDER BY taxonomy").all().map((r) => ({ type: r.taxonomy, n: r.n })),
    };
  }
  return out;
}

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
  // Les comptages se recouvrent : un site supprimé est toujours archivé d'abord (pages.deleteSite). On donne donc aussi les parts qui ne se recouvrent pas.
  out.sites.active = db.prepare(`SELECT COUNT(*) n FROM mk_sites WHERE status <> 'archived'${hasDeleted ? " AND deleted_at IS NULL" : ""}`).get().n;
  out.sites.trashed = hasDeleted ? db.prepare("SELECT COUNT(*) n FROM mk_sites WHERE deleted_at IS NOT NULL AND status = 'archived'").get().n : null;
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
  try { out.palier3 = palier3(db); } catch { out.palier3 = null; }
  return out;
}

module.exports = { run, palier3, TABLES, CHECKS };
