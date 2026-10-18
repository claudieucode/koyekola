#!/usr/bin/env node
// R9 — analyse d'impact de l'option B (« le site maître devient une ligne ordinaire de mk_sites ») sur une base, en LECTURE SEULE.
//   node scripts/r9-analyse-site-maitre.js <base.db> [--json <sortie.json>]
// Relève : les tables qui portent site_id (avec le nombre de lignes « site maître » = NULL et de lignes de sites), les index uniques écrits avec COALESCE(site_id, 0), les déclencheurs et clés étrangères sur site_id,
// les colonnes site_id NOT NULL, et les risques (collisions d'unicité si le principal reçoit un identifiant, lignes orphelines). N'écrit rien dans la base ; la sortie JSON n'est jamais écrasée.
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const out = (t = "") => fs.writeSync(1, `${t}\n`);
const file = process.argv[2];
if (!file || file.startsWith("--")) { fs.writeSync(2, "Usage : node scripts/r9-analyse-site-maitre.js <base.db> [--json <sortie.json>]\n"); process.exit(2); }
const db = new DatabaseSync(path.resolve(file), { readOnly: true });
const all = (sql, ...a) => db.prepare(sql).all(...a);
const tables = all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map((t) => t.name);
const cols = (t) => all(`PRAGMA table_info("${t}")`);
const report = { tables: [], coalesceIndexes: [], triggers: [], risques: [] };
for (const t of tables) {
  const c = cols(t).find((x) => x.name === "site_id"); if (!c) continue;
  const total = all(`SELECT COUNT(*) n FROM "${t}"`)[0].n, maitre = all(`SELECT COUNT(*) n FROM "${t}" WHERE site_id IS NULL`)[0].n;
  const fk = all(`PRAGMA foreign_key_list("${t}")`).find((f) => f.from === "site_id");
  const orphelines = fk ? all(`SELECT COUNT(*) n FROM "${t}" x WHERE x.site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mk_sites s WHERE s.id = x.site_id)`)[0].n : null;
  const uniques = all(`SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name = ? AND sql LIKE 'CREATE UNIQUE%' AND sql LIKE '%site_id%'`, t);
  report.tables.push({ table: t, lignes: total, siteMaitre: maitre, sitesOrdinaires: total - maitre, notNull: Boolean(c.notnull), fk: fk ? fk.table : null, orphelines, indexUniques: uniques.map((u) => u.name) });
}
for (const i of all("SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND sql LIKE '%COALESCE%site_id%'")) report.coalesceIndexes.push({ table: i.tbl_name, index: i.name, sql: i.sql.replace(/\s+/g, " ").slice(0, 200) });
for (const g of all("SELECT name, tbl_name FROM sqlite_master WHERE type='trigger' AND sql LIKE '%site_id%' ORDER BY tbl_name, name")) report.triggers.push({ table: g.tbl_name, declencheur: g.name });
const withRows = report.tables.filter((t) => t.siteMaitre > 0);
if (report.tables.some((t) => t.notNull)) report.risques.push(`colonnes site_id NOT NULL : ${report.tables.filter((t) => t.notNull).map((t) => t.table).join(", ")} (le principal y est déjà représenté autrement)`);
if (report.coalesceIndexes.length) report.risques.push(`${report.coalesceIndexes.length} index uniques écrits avec COALESCE(site_id, 0) : à reconstruire si NULL disparaît (le 0 deviendrait l'identifiant du principal)`);
if (report.tables.some((t) => t.orphelines)) report.risques.push(`lignes pointant vers un site inexistant : ${report.tables.filter((t) => t.orphelines).map((t) => `${t.table}=${t.orphelines}`).join(", ")}`);
if (!tables.includes("mk_sites")) report.risques.push("table mk_sites absente : migrations marketing non appliquées");
report.resume = { tablesAvecSiteId: report.tables.length, tablesAvecLignesSiteMaitre: withRows.length, lignesSiteMaitre: withRows.reduce((a, t) => a + t.siteMaitre, 0), declencheurs: report.triggers.length, indexCoalesce: report.coalesceIndexes.length };
out(`Tables avec site_id : ${report.resume.tablesAvecSiteId} · dont avec des lignes « site maître » (NULL) : ${report.resume.tablesAvecLignesSiteMaitre} (${report.resume.lignesSiteMaitre} lignes) · déclencheurs sur site_id : ${report.resume.declencheurs} · index COALESCE : ${report.resume.indexCoalesce}`);
out("\nTable".padEnd(34) + "lignes".padStart(8) + "maître".padStart(8) + "sites".padStart(8) + "  FK    uniques");
for (const t of report.tables) out(`${t.table.padEnd(33)}${String(t.lignes).padStart(8)}${String(t.siteMaitre).padStart(8)}${String(t.sitesOrdinaires).padStart(8)}  ${(t.fk ? "oui" : "non").padEnd(5)} ${t.indexUniques.length ? t.indexUniques.join(", ") : "—"}`);
if (report.coalesceIndexes.length) out(`\nIndex COALESCE(site_id, 0) :\n  ${report.coalesceIndexes.map((i) => `${i.table}.${i.index}`).join("\n  ")}`);
out(report.risques.length ? `\nRisques relevés :\n  - ${report.risques.join("\n  - ")}` : "\nAucun risque structurel relevé par cette analyse.");
const jf = process.argv.indexOf("--json");
if (jf > 0) { const dest = path.resolve(process.argv[jf + 1] || ""); if (!process.argv[jf + 1] || fs.existsSync(dest)) { fs.writeSync(2, "Sortie JSON absente ou déjà existante (jamais écrasée).\n"); process.exit(2); } fs.writeFileSync(dest, JSON.stringify(report, null, 1)); out(`\nRapport JSON : ${dest}`); }
db.close();
