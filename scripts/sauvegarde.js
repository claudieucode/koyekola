// Sauvegarde de la base de données : `npm run sauvegarde`
// Crée une copie cohérente de la base dans <dossier des données>/backups/ et ne garde que les 14 plus récentes.
// Les vidéos et images (dossier uploads/) ne sont PAS incluses : à télécharger séparément.
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const db = require("../src/config/database");
const { dataDir } = require("../src/config/paths");

const backupDir = path.join(dataDir, "backups");
fs.mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
const target = path.join(backupDir, `KOYEKOLA-${stamp}.db`);

// VACUUM INTO produit une copie propre, même si le site est en train d'écrire dans la base
db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
console.log(`Sauvegarde créée : ${target}`);

const KEEP = 14;
const old = fs
  .readdirSync(backupDir)
  .filter((f) => f.startsWith("KOYEKOLA-") && f.endsWith(".db"))
  .sort()
  .slice(0, -KEEP);
old.forEach((f) => fs.unlinkSync(path.join(backupDir, f)));
if (old.length) console.log(`${old.length} ancienne(s) sauvegarde(s) supprimée(s).`);
