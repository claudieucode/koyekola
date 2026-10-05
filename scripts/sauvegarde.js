// Sauvegarde complète : `npm run sauvegarde`
// Crée dans <dossier des données>/backups/ :
//  - KOYEKOLA-<date>.db              copie cohérente de la base, vérifiée (PRAGMA integrity_check) ;
//  - KOYEKOLA-uploads-<date>.tar.gz  archive des fichiers envoyés (miniatures, vidéos, ressources, blog, marketing).
// Ne garde que les 14 plus récentes de chaque sorte. Option : --sans-fichiers (base seule, plus rapide).
// L'archive utilise la commande système `tar` (présente sur macOS et Linux).
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { DatabaseSync } = require("node:sqlite");
const db = require("../src/config/database");
const { dataDir, uploadsRoot } = require("../src/config/paths");

const backupDir = path.join(dataDir, "backups");
fs.mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
const target = path.join(backupDir, `KOYEKOLA-${stamp}.db`);

// VACUUM INTO produit une copie propre, même si le site est en train d'écrire dans la base
db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);

// Une sauvegarde jamais relue ne prouve rien : on rouvre la copie et on contrôle son intégrité.
const copy = new DatabaseSync(target, { readOnly: true });
const check = copy.prepare("PRAGMA integrity_check").get();
copy.close();
if (!check || check.integrity_check !== "ok") {
  fs.unlinkSync(target);
  console.error("ÉCHEC : la copie de la base est corrompue, elle a été supprimée. Aucune sauvegarde n'a été créée.");
  process.exit(1);
}
console.log(`Base sauvegardée et vérifiée : ${target}`);

if (!process.argv.includes("--sans-fichiers")) {
  if (!fs.existsSync(uploadsRoot) || !fs.readdirSync(uploadsRoot).length) {
    console.log("Aucun fichier envoyé à archiver.");
  } else {
    const archive = path.join(backupDir, `KOYEKOLA-uploads-${stamp}.tar.gz`);
    const r = spawnSync("tar", ["-czf", archive, "-C", uploadsRoot, "."], { encoding: "utf8" });
    if (r.status !== 0) {
      try { fs.unlinkSync(archive); } catch { /* pas créée */ }
      console.error(`ÉCHEC de l'archive des fichiers (la base, elle, est sauvegardée) : ${r.error ? r.error.message : r.stderr.trim()}`);
      process.exit(1);
    }
    // Relecture de la table des matières : une archive tronquée est détectée tout de suite
    const list = spawnSync("tar", ["-tzf", archive], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    if (list.status !== 0) {
      fs.unlinkSync(archive);
      console.error("ÉCHEC : l'archive des fichiers est illisible, elle a été supprimée.");
      process.exit(1);
    }
    console.log(`Fichiers archivés et vérifiés : ${archive}`);
  }
}

// Rotation : seules les sauvegardes de ce script sont comptées (les « AVANT-MIGRATION-… » et « AVANT-RESTAURATION-… » ne sont jamais supprimées ici)
const KEEP = 14;
const kinds = [/^KOYEKOLA-\d{4}-.*\.db$/, /^KOYEKOLA-uploads-.*\.tar\.gz$/];
let removed = 0;
for (const kind of kinds) {
  const old = fs.readdirSync(backupDir).filter((f) => kind.test(f)).sort().slice(0, -KEEP);
  old.forEach((f) => fs.unlinkSync(path.join(backupDir, f)));
  removed += old.length;
}
if (removed) console.log(`${removed} ancienne(s) sauvegarde(s) supprimée(s).`);
