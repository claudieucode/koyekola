// Migrations versionnées du module marketing.
//
// Règles (pour ne jamais abîmer une base de production) :
//  - les migrations sont des fichiers SQL numérotés (001_nom.sql, 002_nom.sql…), appliqués dans l'ordre ;
//  - chacune est appliquée dans UNE transaction : si elle échoue, rien n'est laissé à moitié fait ;
//  - une migration déjà appliquée ne doit JAMAIS être modifiée (son empreinte est vérifiée) : on en crée une nouvelle ;
//  - avant d'appliquer quoi que ce soit sur une base qui contient déjà des données, une copie de sauvegarde est faite ;
//    si cette copie est impossible, la migration n'est pas appliquée.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const SCOPE = "marketing";
const BACKUP_PREFIX = "AVANT-MIGRATION-"; // distinct de « KOYEKOLA- » pour ne jamais être effacé par `npm run sauvegarde`
const KEEP_BACKUPS = 10;
const FILE_PATTERN = /^(\d{3,})_([a-z0-9_]+)\.sql$/;

const checksumOf = (sql) => crypto.createHash("sha256").update(sql.replace(/\r\n/g, "\n")).digest("hex");

// Liste et valide les fichiers de migration d'un dossier
function listMigrations(dir) {
  if (!fs.existsSync(dir)) throw new Error(`Dossier de migrations introuvable : ${dir}`);
  const migrations = [];
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".sql")) continue;
    const match = file.match(FILE_PATTERN);
    if (!match) throw new Error(`Nom de migration invalide : « ${file} » (attendu : 001_nom_en_minuscules.sql)`);
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    migrations.push({ version: match[1], number: Number(match[1]), name: match[2], file, sql, checksum: checksumOf(sql) });
  }
  const seen = new Set();
  for (const m of migrations) {
    if (seen.has(m.number)) throw new Error(`Deux migrations portent le numéro ${m.version} : un numéro ne peut être utilisé qu'une fois.`);
    seen.add(m.number);
  }
  return migrations.sort((a, b) => a.number - b.number);
}

function hasData(db) {
  try {
    return db.prepare("SELECT COUNT(*) AS n FROM users").get().n > 0;
  } catch {
    return false; // pas encore de table users : installation neuve
  }
}

// Copie cohérente de la base (VACUUM INTO), puis on ne garde que les KEEP_BACKUPS plus récentes de ces sauvegardes
function backupBeforeMigration(db, dbPath, backupDir, lastVersion) {
  try {
    fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:T.]/g, "-").replace("Z", "");
    const target = path.join(backupDir, `${BACKUP_PREFIX}${stamp}-v${lastVersion}.db`);
    db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
    const mine = fs.readdirSync(backupDir).filter((f) => f.startsWith(BACKUP_PREFIX) && f.endsWith(".db")).sort();
    mine.slice(0, Math.max(0, mine.length - KEEP_BACKUPS)).forEach((f) => fs.unlinkSync(path.join(backupDir, f)));
    return target;
  } catch (err) {
    throw new Error(`Sauvegarde préalable impossible (${err.message}) : la migration n'a PAS été appliquée. Libérez de la place ou corrigez le dossier ${backupDir}, puis relancez.`);
  }
}

function migrate(db, { dir, dbPath, backupDir, log = console } = {}) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      scope TEXT NOT NULL,
      version TEXT NOT NULL,
      name TEXT NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (scope, version)
    )
  `);

  const files = listMigrations(dir);
  const done = new Map(db.prepare("SELECT version, checksum FROM schema_migrations WHERE scope = ?").all(SCOPE).map((r) => [r.version, r.checksum]));

  // Ce qui est déjà appliqué doit être intact
  for (const [version, checksum] of done) {
    const file = files.find((f) => f.version === version);
    if (!file) throw new Error(`La migration ${version} est appliquée dans la base mais son fichier est introuvable : ne supprimez jamais une migration appliquée.`);
    if (file.checksum !== checksum) throw new Error(`La migration ${version} (${file.name}) a été modifiée après son application. Ne la modifiez jamais : créez une nouvelle migration.`);
  }

  const pending = files.filter((f) => !done.has(f.version));
  const lastApplied = Math.max(0, ...[...done.keys()].map(Number));
  for (const m of pending) {
    if (m.number < lastApplied) throw new Error(`La migration ${m.version} (${m.name}) est plus ancienne que la dernière appliquée (${String(lastApplied).padStart(3, "0")}) : ordre non respecté. Donnez-lui un numéro plus grand.`);
  }
  if (!pending.length) return { applied: [], backup: null };

  let backup = null;
  if (dbPath && dbPath !== ":memory:" && fs.existsSync(dbPath) && hasData(db)) {
    backup = backupBeforeMigration(db, dbPath, backupDir, pending[pending.length - 1].version);
    log.log(`[KOLAKISA] Sauvegarde avant migration : ${backup}`);
  }

  const applied = [];
  const alreadyApplied = db.prepare("SELECT 1 FROM schema_migrations WHERE scope = ? AND version = ?");
  for (const m of pending) {
    db.exec("BEGIN IMMEDIATE");
    // Deux exemplaires du serveur peuvent démarrer en même temps (redémarrage chez l'hébergeur) : la liste « en attente »
    // lue plus haut peut être périmée. Une fois le verrou d'écriture obtenu, on revérifie : si l'autre exemplaire vient
    // d'appliquer cette migration, on la saute au lieu d'échouer (« table already exists »).
    if (alreadyApplied.get(SCOPE, m.version)) {
      db.exec("COMMIT");
      continue;
    }
    try {
      db.exec(m.sql);
      db.prepare("INSERT INTO schema_migrations (scope, version, name, checksum) VALUES (?, ?, ?, ?)").run(SCOPE, m.version, m.name, m.checksum);
      db.exec("COMMIT");
    } catch (err) {
      try {
        db.exec("ROLLBACK");
      } catch {
        // la transaction est déjà terminée
      }
      throw new Error(`Migration ${m.version} (${m.name}) échouée : ${err.message}. Elle a été annulée, aucune modification partielle n'a été conservée.${backup ? ` Sauvegarde : ${backup}` : ""}`);
    }
    applied.push(m.version);
    log.log(`[KOLAKISA] Migration marketing ${m.version} (${m.name}) appliquée.`);
  }
  return { applied, backup };
}

module.exports = { migrate, listMigrations, BACKUP_PREFIX, SCOPE };
