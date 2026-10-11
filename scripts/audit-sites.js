#!/usr/bin/env node
// Contrôle d'isolation des sites (palier 2) — LECTURE SEULE. À lancer avant et après une migration, et sur la base de production (copie) :
//   node scripts/audit-sites.js [chemin/vers/KOYEKOLA.db]
// Pour chaque table portant un site : nombre de lignes par site, du site principal (site_id vide), et références orphelines.
// Puis les associations entre sites différents (étape de tunnel, page parente, page d'accueil). Code de sortie 1 s'il y a une anomalie.
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const file = path.resolve(process.argv[2] || path.join(__dirname, "..", "data", "KOYEKOLA.db"));
const db = new DatabaseSync(file, { readOnly: true });
const has = (t) => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t));
const cols = (t) => db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
const TABLES = [
  ["mk_landing_pages", "site_id"], ["mk_web_components", "site_id"], ["mk_funnels", "site_id"], ["mk_lists", "site_id"], ["mk_segments", "site_id"],
  ["mk_templates", "site_id"], ["mk_campaigns", "site_id"], ["mk_automations", "site_id"], ["mk_page_tests", "site_id"], ["mk_web_events", "site_id"],
  ["mk_events", "site_id"], ["mk_conversions", "site_id"], ["mk_contacts", "origin_site_id"], ["nav_menus", "site_id"], ["nav_locations", "site_id"],
  ["appearance_configs", "site_id"], ["appearance_patterns", "site_id"], ["cms_revisions", "site_id"], ["seo_redirects", "site_id"],
];
let anomalies = 0;
const line = (...a) => console.log(...a);
line(`Base : ${file}`);
if (!has("mk_sites")) { line("Aucune table mk_sites : base sans module Site Web."); process.exit(0); }
line(`Sites : ${db.prepare("SELECT COUNT(*) n FROM mk_sites").get().n} (supprimés : ${cols("mk_sites").includes("deleted_at") ? db.prepare("SELECT COUNT(*) n FROM mk_sites WHERE deleted_at IS NOT NULL").get().n : "n/a"})`);
line("\nTable                     total  principal(NULL)  rattachées  orphelines");
for (const [t, c] of TABLES) {
  if (!has(t) || !cols(t).includes(c)) { line(`${t.padEnd(25)} (absente)`); continue; }
  const r = db.prepare(`SELECT COUNT(*) total, SUM(${c} IS NULL) principal, SUM(${c} IS NOT NULL) rattachees,
      SUM(${c} IS NOT NULL AND ${c} NOT IN (SELECT id FROM mk_sites)) orphelines FROM ${t}`).get();
  if (r.orphelines) anomalies += r.orphelines;
  line(`${t.padEnd(25)} ${String(r.total).padStart(5)}  ${String(r.principal || 0).padStart(15)}  ${String(r.rattachees || 0).padStart(10)}  ${String(r.orphelines || 0).padStart(10)}${r.orphelines ? "  ← ANOMALIE" : ""}`);
}
line("\nAssociations entre sites différents :");
const checks = [
  ["étapes de tunnel → page d'un autre site", "mk_funnel_steps", `SELECT COUNT(*) n FROM mk_funnel_steps s JOIN mk_funnels f ON f.id = s.funnel_id JOIN mk_landing_pages p ON p.id = s.page_id WHERE p.site_id IS NOT f.site_id`],
  ["pages dont le parent est d'un autre site", "mk_landing_pages", `SELECT COUNT(*) n FROM mk_landing_pages c JOIN mk_landing_pages p ON p.id = c.parent_id WHERE p.site_id IS NOT c.site_id`],
  ["sites dont la page d'accueil est d'un autre site", "mk_sites", `SELECT COUNT(*) n FROM mk_sites s JOIN mk_landing_pages p ON p.id = s.home_page_id WHERE p.site_id IS NOT s.id`],
  ["pages contenant un composant propre à un autre site", "mk_web_components", `SELECT COUNT(DISTINCT p.id) n FROM mk_landing_pages p JOIN mk_web_components c ON c.site_id IS NOT NULL AND c.site_id IS NOT p.site_id AND (p.sections LIKE '%"componentId":' || c.id || '}%' OR p.sections LIKE '%"componentId":' || c.id || ',%' OR p.draft LIKE '%"componentId":' || c.id || '}%' OR p.draft LIKE '%"componentId":' || c.id || ',%')`],
  ["pages en ligne dans un site archivé ou supprimé", "mk_sites", `SELECT COUNT(*) n FROM mk_landing_pages p JOIN mk_sites s ON s.id = p.site_id WHERE p.status = 'published' AND (s.status <> 'active' OR s.deleted_at IS NOT NULL)`],
];
for (const [label, table, sql] of checks) {
  if (!has(table) || !has("mk_landing_pages")) { line(`  ${label} : (non vérifiable)`); continue; }
  let n = 0;
  try { n = db.prepare(sql).get().n; } catch (e) { line(`  ${label} : (non vérifiable : ${e.message})`); continue; }
  anomalies += n;
  line(`  ${label} : ${n}${n ? "  ← ANOMALIE" : ""}`);
}
line(`\n${anomalies ? `${anomalies} anomalie(s) à examiner (rien n'a été modifié).` : "Aucune anomalie d'isolation détectée."}`);
process.exit(anomalies ? 1 : 0);
