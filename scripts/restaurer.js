// Restauration : `npm run restaurer` (liste les sauvegardes) puis
//   npm run restaurer -- KOYEKOLA-2026-10-05-09-30.db [--fichiers KOYEKOLA-uploads-2026-10-05-09-30.tar.gz] --confirmer
// ARRÊTEZ LE SERVEUR avant de restaurer : remplacer la base d'un site en marche la corromprait.
// Garde-fous : sans --confirmer, rien n'est modifié ; la sauvegarde choisie est vérifiée (integrity_check) ;
// l'état actuel est d'abord copié dans backups/AVANT-RESTAURATION-<date>.db (retour arrière possible).
// Ce script n'ouvre jamais la base via src/config/database.js (cela créerait/migrerait la base avant son remplacement).
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { DatabaseSync } = require("node:sqlite");
const { dataDir, uploadsRoot, dbFile } = require("../src/config/paths");

const backupDir = path.join(dataDir, "backups");
const args = process.argv.slice(2);
const confirm = args.includes("--confirmer");
const filesIdx = args.indexOf("--fichiers");
const archiveName = filesIdx >= 0 ? args[filesIdx + 1] : null;
const dbName = args.find((a, i) => !a.startsWith("--") && (filesIdx < 0 || i !== filesIdx + 1));

const fail = (message) => { console.error(`ÉCHEC : ${message}`); process.exit(1); };
const resolveBackup = (name) => (path.isAbsolute(name) ? name : path.join(backupDir, path.basename(name)));
const mb = (file) => `${(fs.statSync(file).size / 1048576).toFixed(1)} Mo`;

if (!dbName) {
  console.log(`Sauvegardes disponibles dans ${backupDir} :`);
  const files = fs.existsSync(backupDir) ? fs.readdirSync(backupDir).sort().reverse() : [];
  const show = (re, title) => {
    const list = files.filter((f) => re.test(f));
    console.log(`\n${title}`);
    if (!list.length) console.log("  (aucune)");
    list.forEach((f) => console.log(`  ${f}  (${mb(path.join(backupDir, f))})`));
  };
  show(/^KOYEKOLA-(\d{4}|auto-).*\.db$/, "Bases (manuelles et copies automatiques quotidiennes) :");
  show(/^KOYEKOLA-uploads-.*\.tar\.gz$/, "Fichiers envoyés :");
  show(/^AVANT-.*\.db$/, "Copies de sécurité automatiques (avant migration / restauration) :");
  console.log("\nPour restaurer : npm run restaurer -- <base.db> [--fichiers <archive.tar.gz>] --confirmer");
  process.exit(0);
}

const source = resolveBackup(dbName);
if (!fs.existsSync(source)) fail(`sauvegarde introuvable : ${source}`);
let sourceDb;
try {
  sourceDb = new DatabaseSync(source, { readOnly: true });
  const check = sourceDb.prepare("PRAGMA integrity_check").get();
  if (!check || check.integrity_check !== "ok") fail("cette sauvegarde est corrompue, elle ne sera pas restaurée.");
  const tables = sourceDb.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type = 'table' AND name IN ('users','courses','orders')").get();
  if (tables.n !== 3) fail("ce fichier ne ressemble pas à une base KOYEKOLA (tables users, courses, orders absentes).");
} catch (error) {
  fail(`sauvegarde illisible (${error.message}).`);
} finally {
  if (sourceDb) sourceDb.close();
}

let archive = null;
if (archiveName) {
  archive = resolveBackup(archiveName);
  if (!fs.existsSync(archive)) fail(`archive introuvable : ${archive}`);
  const list = spawnSync("tar", ["-tzf", archive], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (list.status !== 0) fail("l'archive des fichiers est illisible.");
  // Un nom absolu ou contenant « .. » écrirait hors du dossier des fichiers
  if (list.stdout.split("\n").some((entry) => entry.startsWith("/") || entry.split("/").includes(".."))) fail("l'archive contient des chemins dangereux, elle est refusée.");
}

console.log(`Base à restaurer : ${source} (${mb(source)}, vérifiée)`);
console.log(archive ? `Fichiers à restaurer : ${archive} (${mb(archive)}, vérifiée) → ${uploadsRoot}` : "Fichiers : non restaurés (ajoutez --fichiers <archive> pour les restaurer).");
if (!confirm) {
  console.log("\nAUCUNE MODIFICATION FAITE. Relancez la même commande avec --confirmer (serveur arrêté) pour restaurer.");
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
if (fs.existsSync(dbFile)) {
  fs.mkdirSync(backupDir, { recursive: true });
  const safety = path.join(backupDir, `AVANT-RESTAURATION-${stamp}.db`);
  const live = new DatabaseSync(dbFile);
  try { live.exec(`VACUUM INTO '${safety.replace(/'/g, "''")}'`); } finally { live.close(); }
  console.log(`État actuel conservé : ${safety}`);
}

// Les fichiers -wal / -shm de l'ancienne base ne doivent pas se mélanger à la base restaurée
for (const suffix of ["-wal", "-shm"]) fs.rmSync(dbFile + suffix, { force: true });
fs.copyFileSync(source, dbFile);
console.log(`Base restaurée : ${dbFile}`);

if (archive) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
  const r = spawnSync("tar", ["-xzf", archive, "-C", uploadsRoot], { encoding: "utf8" });
  if (r.status !== 0) fail(`la base est restaurée mais les fichiers n'ont pas pu l'être : ${r.stderr.trim()}`);
  console.log(`Fichiers restaurés dans ${uploadsRoot} (les fichiers plus récents absents de l'archive sont conservés).`);
}
console.log("\nTerminé. Redémarrez le serveur, puis vérifiez le site.");
