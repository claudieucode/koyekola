// Emplacements des données (base SQLite) et des fichiers envoyés (miniatures, vidéos, ressources).
// Par défaut : les dossiers data/ et uploads/ du projet. En hébergement, on peut les placer
// ailleurs (un dossier qui survit aux redéploiements) avec les variables DATA_DIR et UPLOADS_DIR.
const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..", "..");

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(projectRoot, "data");
const uploadsRoot = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(projectRoot, "uploads");

fs.mkdirSync(dataDir, { recursive: true });
["thumbnails", "videos", "resources", "blog"].forEach((sub) => fs.mkdirSync(path.join(uploadsRoot, sub), { recursive: true }));

const dbFile = path.join(dataDir, "KOYEKOLA.db");

module.exports = { dataDir, uploadsRoot, dbFile };
