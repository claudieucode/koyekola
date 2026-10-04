// Emplacements des données (base SQLite) et des fichiers envoyés (miniatures, vidéos, ressources).
// Par défaut : les dossiers data/ et uploads/ du projet. En hébergement, on peut les placer
// ailleurs (un dossier qui survit aux redéploiements) avec les variables DATA_DIR et UPLOADS_DIR.
const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..", "..");

const dataDir = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(projectRoot, "data");
// Fichiers envoyés : UPLOADS_DIR si défini ; sinon, si DATA_DIR est défini (dossier conservé chez l'hébergeur),
// à côté de la base dans DATA_DIR/uploads — jamais dans le dossier du projet, effacé à chaque redéploiement.
// UPLOADS_DIR doit être un chemin ABSOLU : une valeur relative (ex. un mot de passe collé par erreur) serait rangée
// dans le dossier de l'application, remplacé à chaque déploiement → tous les fichiers envoyés perdus. Elle est donc
// ignorée (signalée au démarrage, sans jamais afficher sa valeur).
const uploadsEnvIgnored = Boolean(process.env.UPLOADS_DIR) && !path.isAbsolute(process.env.UPLOADS_DIR);
const uploadsEnv = process.env.UPLOADS_DIR && !uploadsEnvIgnored ? process.env.UPLOADS_DIR : "";
const uploadsRoot = uploadsEnv ? path.resolve(uploadsEnv) : process.env.DATA_DIR ? path.join(dataDir, "uploads") : path.join(projectRoot, "uploads");
const projectUploads = path.join(projectRoot, "uploads");

fs.mkdirSync(dataDir, { recursive: true });
["thumbnails", "videos", "resources", "blog", "marketing"].forEach((sub) => fs.mkdirSync(path.join(uploadsRoot, sub), { recursive: true }));

const dbFile = path.join(dataDir, "KOYEKOLA.db");

module.exports = { dataDir, uploadsRoot, dbFile, projectRoot, projectUploads, uploadsEnvIgnored };
