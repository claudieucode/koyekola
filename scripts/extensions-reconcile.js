#!/usr/bin/env node
// Réconciliation des extensions par site. DIAGNOSTIC par défaut (lecture seule) ; `--reparer` corrige ce qui est sûr, dans une transaction, et journalise.
//   node scripts/extensions-reconcile.js [chemin/vers/KOYEKOLA.db] [--reparer]
// Contrôles : lignes d'activation vers une extension inconnue du registre, vers un site absent ou supprimé, dont l'organisation ne correspond pas à celle du site,
// et sites actifs sans aucune ligne (normal : « pas de ligne = désactivé », rien à créer — un nouveau site est reconnu par le registre central dès sa création).
// Réparation : supprime UNIQUEMENT des lignes d'activation orphelines (jamais une donnée de boutique ou de formation) et réaligne l'organisation. Aucune extension n'est activée à la place de l'équipe.
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const registry = require("../src/extensions/registry");

const args = process.argv.slice(2);
const repair = args.includes("--reparer");
const file = path.resolve(args.find((a) => !a.startsWith("--")) || path.join(__dirname, "..", "data", "KOYEKOLA.db"));
let db;
try { db = new DatabaseSync(file, repair ? {} : { readOnly: true }); } catch (e) { console.error(`Impossible d'ouvrir la base ${file} : ${e.message}`); process.exit(2); }
const reg = registry.load();
const has = (t) => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t));
if (!has("mk_site_modules") || !has("mk_sites")) { console.log("Base sans module Site Web : rien à vérifier."); process.exit(0); }

const rows = db.prepare("SELECT rowid AS rid, site_id, organization_id, module, enabled FROM mk_site_modules").all();
const sites = new Map(db.prepare("SELECT id, organization_id, deleted_at FROM mk_sites").all().map((s) => [s.id, s]));
const issues = { unknown: [], noSite: [], deletedSite: [], wrongOrg: [] };
for (const r of rows) {
  const s = sites.get(r.site_id);
  if (!reg.has(r.module)) issues.unknown.push(r);
  else if (!s) issues.noSite.push(r);
  else if (s.deleted_at) issues.deletedSite.push(r);
  else if (s.organization_id !== r.organization_id) issues.wrongOrg.push(r);
}
const live = [...sites.values()].filter((s) => !s.deleted_at);
const withRows = new Set(rows.map((r) => r.site_id));
console.log(`Base : ${file}`);
console.log(`Extensions au registre central : ${reg.ids.join(", ")}`);
console.log(`Sites actifs : ${live.length} (dont sans aucune ligne d'activation : ${live.filter((s) => !withRows.has(s.id)).length} — normal, tout est désactivé par défaut)`);
console.log(`Lignes d'activation : ${rows.length}, activées : ${rows.filter((r) => r.enabled === 1).length}`);
const labels = { unknown: "extension inconnue du registre", noSite: "site inexistant", deletedSite: "site supprimé", wrongOrg: "organisation différente de celle du site" };
let total = 0;
for (const [k, list] of Object.entries(issues)) { total += list.length; console.log(`  ${labels[k]} : ${list.length}${list.length ? "  ← ANOMALIE" : ""}`); }
if (!total) { console.log("Aucune anomalie."); process.exit(0); }
if (!repair) { console.log("\nRelancez avec --reparer pour corriger (suppression des lignes orphelines, réalignement de l'organisation)."); process.exit(1); }
db.exec("BEGIN");
try {
  const del = db.prepare("DELETE FROM mk_site_modules WHERE rowid = ?");
  for (const r of [...issues.unknown, ...issues.noSite, ...issues.deletedSite]) del.run(r.rid);
  const fix = db.prepare("UPDATE mk_site_modules SET organization_id = ? WHERE rowid = ?");
  for (const r of issues.wrongOrg) fix.run(sites.get(r.site_id).organization_id, r.rid);
  if (has("mk_extension_events")) try { db.prepare("INSERT INTO mk_extension_events (organization_id, site_id, extension, action, version, user_id, detail) VALUES (?, NULL, 'registre', 'settings', NULL, NULL, ?)").run(1, JSON.stringify({ reconcile: Object.fromEntries(Object.entries(issues).map(([k, v]) => [k, v.length])) })); } catch { /* journal facultatif */ }
  db.exec("COMMIT");
} catch (e) { db.exec("ROLLBACK"); console.error(`Réparation annulée : ${e.message}`); process.exit(2); }
console.log(`\nRéparé : ${total} ligne(s). Aucune donnée de boutique ou de formation touchée.`);
