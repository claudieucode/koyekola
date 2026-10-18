#!/usr/bin/env node
// Recette R8 (migrations 090 et 091) sur une COPIE de base — jamais sur la base vivante.
//   node scripts/recette-r8-copie.js prerequis <copie.db> --copie-confirmee     (LECTURE SEULE : préconditions et risques)
//   node scripts/recette-r8-copie.js migrer    <copie.db> --copie-confirmee     (applique 090 et 091 à la COPIE, avec la sauvegarde automatique du moteur de migrations)
//   node scripts/recette-r8-copie.js retour    <copie.db> --copie-confirmee     (joue les retours arrière 091 puis 090 sur la COPIE)
// Garde-fous : « --copie-confirmee » obligatoire ; refuse la base vivante de l'application (DATA_DIR / data/…) ; refuse un fichier qui n'existe pas ; ne crée aucune base ; code de sortie ≠ 0 au moindre blocage.
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

// Écritures synchrones : la sortie n'est jamais tronquée par process.exit (tubes asynchrones sous macOS)
const out = (t) => fs.writeSync(1, `${t}\n`);
const err = (t) => fs.writeSync(2, `${t}\n`);
const [cmd, fileArg] = process.argv.slice(2);
const flags = process.argv.slice(4);
const die = (msg, code = 2) => { err(msg); process.exit(code); };
if (!["prerequis", "migrer", "retour"].includes(cmd) || !fileArg) die("Usage : node scripts/recette-r8-copie.js <prerequis|migrer|retour> <copie.db> --copie-confirmee");
if (!flags.includes("--copie-confirmee")) die("Refus : ajoutez --copie-confirmee pour certifier que ce fichier est une COPIE jetable (jamais la base vivante).");
const file = path.resolve(fileArg);
if (!fs.existsSync(file)) die(`Fichier introuvable : ${file}`);
const live = require("../src/config/paths").dbFile;
if (path.resolve(live) === file) die("Refus : c'est la base vivante de l'application. Utilisez scripts/copie-base-audit.js pour en faire une copie.");
// Garde-fous supplémentaires (la base vivante peut se trouver ailleurs que dans DATA_DIR de CE shell) :
//  1. le nom du fichier doit dire que c'est une copie (copie, recette, jetable, essai) ; 2. un fichier -wal / -shm non vide = base ouverte par une application : refus ; 3. le dossier de l'application (DATA_DIR) est interdit.
if (!/(copie|recette|jetable|essai)/i.test(path.basename(file))) die(`Refus : le nom « ${path.basename(file)} » ne désigne pas une copie (attendu : copie, recette, jetable ou essai dans le nom du fichier).`);
for (const ext of ["-wal", "-shm"]) { try { if (fs.statSync(file + ext).size > 0) die(`Refus : ${path.basename(file)}${ext} existe et n'est pas vide — la base est ouverte par une application (base vivante ?).`); } catch (e) { if (e.code !== "ENOENT") throw e; } }
const liveDir = path.resolve(path.dirname(live));
if (file === liveDir || file.startsWith(liveDir + path.sep)) die(`Refus : le fichier est dans le dossier de données de l'application (${liveDir}).`);

const DOWN = path.join(__dirname, "migrations-retour-arriere");
const MIGRATIONS = path.join(__dirname, "..", "src", "marketing", "migrations");
const db = new DatabaseSync(file, { readOnly: cmd === "prerequis" });
const one = (sql, ...a) => db.prepare(sql).get(...a);
const all = (sql, ...a) => db.prepare(sql).all(...a);
const has = (t) => Boolean(one("SELECT 1 x FROM sqlite_master WHERE type='table' AND name = ?", t));
const cols = (t) => (has(t) ? all(`SELECT name FROM pragma_table_info('${t}')`).map((c) => c.name) : []);
const applied = () => (has("schema_migrations") ? all("SELECT version FROM schema_migrations WHERE scope = 'marketing'").map((r) => r.version) : []);

if (cmd === "prerequis") {
  const blocking = [], warnings = [], info = [];
  const integrity = Object.values(one("PRAGMA integrity_check"))[0];
  if (integrity !== "ok") blocking.push(`integrity_check : ${integrity}`);
  const v = applied(); info.push(`migrations marketing appliquées : ${v.length ? v[v.length - 1] : "aucune"} (090 : ${v.includes("090") ? "déjà" : "à faire"} ; 091 : ${v.includes("091") ? "déjà" : "à faire"})`);
  if (!has("mk_sites") || !has("mk_imports")) blocking.push("tables marketing absentes (migrations antérieures non appliquées)");
  if (!v.includes("089") && !v.includes("090")) blocking.push("la migration 089 (R7) doit être appliquée avant 090/091");
  if (!v.includes("090")) {
    if (!has("seo_redirects")) blocking.push("seo_redirects absente : démarrer l'application une fois sur cette base (le code SEO crée ses tables) avant de migrer");
    else if (!cols("seo_redirects").includes("site_id")) blocking.push("seo_redirects sans la colonne site_id (palier 12) : démarrer l'application une fois avant de migrer");
    for (const t of ["seo_404", "seo_changes", "seo_audits", "seo_alerts", "seo_monitor_snapshots"]) if (!has(t)) warnings.push(`${t} absente : sera créée par la migration (base jamais démarrée avec le code SEO ?)`);
    if (has("seo_redirects")) {
      info.push(`redirections : ${one("SELECT COUNT(*) n FROM seo_redirects").n}${cols("seo_redirects").includes("site_id") ? ` (communes : ${one("SELECT COUNT(*) n FROM seo_redirects WHERE site_id IS NULL").n})` : ""}`);
      const orphan = cols("seo_redirects").includes("site_id") ? one("SELECT COUNT(*) n FROM seo_redirects r WHERE r.site_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM mk_sites s WHERE s.id = r.site_id)").n : 0;
      if (orphan) blocking.push(`${orphan} redirection(s) pointent sur un site inexistant (la nouvelle clé étrangère les refuserait)`);
    }
  }
  if (!v.includes("091") && has("mk_imports")) {
    const n = one("SELECT COUNT(*) n FROM mk_imports").n;
    const prouvables = one("SELECT COUNT(*) n FROM mk_imports WHERE json_valid(options) AND json_extract(options, '$.siteId') IS NOT NULL AND EXISTS (SELECT 1 FROM mk_sites s WHERE s.id = CAST(json_extract(mk_imports.options, '$.siteId') AS INTEGER) AND s.organization_id = mk_imports.organization_id)").n;
    info.push(`imports : ${n} (rattachables à un site par leurs options : ${prouvables} ; les autres resteront « équipe »)`);
  }
  info.push(`sites : ${has("mk_sites") ? one("SELECT COUNT(*) n FROM mk_sites").n : 0} ; organisations : ${has("mk_organizations") ? one("SELECT COUNT(*) n FROM mk_organizations").n : 0}`);
  out([...info.map((x) => `  · ${x}`), ...warnings.map((x) => `  ! ${x}`), ...blocking.map((x) => `  ✗ BLOQUANT : ${x}`)].join("\n"));
  out(blocking.length ? "\nRÉSULTAT : NE PAS MIGRER." : "\nRÉSULTAT : préconditions satisfaites (sur cette copie).");
  process.exit(blocking.length ? 1 : 0);
}

if (cmd === "migrer") {
  const { migrate } = require("../src/marketing/db/migrate");
  const before = { redirects: has("seo_redirects") ? one("SELECT COUNT(*) n FROM seo_redirects").n : 0, n404: has("seo_404") ? one("SELECT COUNT(*) n FROM seo_404").n : 0, imports: one("SELECT COUNT(*) n FROM mk_imports").n };
  const r = migrate(db, { dir: MIGRATIONS, dbPath: file, backupDir: path.join(path.dirname(file), "sauvegardes-recette"), log: console });
  const after = { redirects: one("SELECT COUNT(*) n FROM seo_redirects").n, n404: one("SELECT COUNT(*) n FROM seo_404").n, imports: one("SELECT COUNT(*) n FROM mk_imports").n };
  const same = JSON.stringify(before) === JSON.stringify(after);
  out(`Appliquées : ${r.applied.join(", ") || "aucune"} · lignes avant ${JSON.stringify(before)} · après ${JSON.stringify(after)} · ${same ? "identiques" : "ÉCART — ARRÊT"}`);
  process.exit(same ? 0 : 1);
}

// retour
for (const f of ["091_imports_par_site.down.sql", "090_seo_par_site.down.sql"]) {
  const v = f.slice(0, 3);
  if (!applied().includes(v)) { out(`${v} : non appliquée, rien à défaire`); continue; }
  try { db.exec(fs.readFileSync(path.join(DOWN, f), "utf8")); out(`${v} : retour arrière effectué`); } catch (e) { try { db.exec("ROLLBACK"); } catch { /* aucune transaction ouverte */ } die(`${v} : retour arrière REFUSÉ (${e.message}) — rien n'a été modifié pour cette migration`, 1); }
}
