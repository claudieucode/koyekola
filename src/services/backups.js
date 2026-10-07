// Sauvegardes : copie automatique quotidienne de la base, et téléchargement (base + fichiers envoyés) pour en garder
// une copie HORS du serveur. Les copies automatiques restent sur le même disque que le site : elles protègent contre
// une erreur ou une donnée abîmée, pas contre la perte du disque — d'où le téléchargement régulier.
const fs = require("fs");
const path = require("path");
const db = require("../config/database");
const { dataDir, uploadsRoot } = require("../config/paths");

const BACKUP_DIR = path.join(dataDir, "backups");
const AUTO_PREFIX = "KOYEKOLA-auto-";
const KEEP_AUTO = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
// Noms acceptés au téléchargement : uniquement des sauvegardes de ce dossier (jamais un chemin)
const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.db$/;

const kindOf = (name) => (name.startsWith(AUTO_PREFIX) ? "auto" : name.startsWith("AVANT-MIGRATION-") ? "migration" : "manuelle");

function list() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  return fs.readdirSync(BACKUP_DIR)
    .filter((name) => SAFE_NAME.test(name))
    .map((name) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, name));
      return { name, kind: kindOf(name), size: stat.size, createdAt: stat.mtime };
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

// Copie cohérente de la base (VACUUM INTO : sûre même pendant des écritures), puis seules les KEEP_AUTO dernières
// copies automatiques sont gardées (les sauvegardes manuelles et d'avant migration ne sont jamais effacées ici)
function createBackup({ auto = true } = {}) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:T.]/g, "-").replace("Z", "");
  const name = `${auto ? AUTO_PREFIX : "KOYEKOLA-"}${stamp}.db`;
  const target = path.join(BACKUP_DIR, name);
  db.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`);
  if (auto) {
    const autos = fs.readdirSync(BACKUP_DIR).filter((f) => f.startsWith(AUTO_PREFIX) && f.endsWith(".db")).sort();
    autos.slice(0, Math.max(0, autos.length - KEEP_AUTO)).forEach((f) => fs.rmSync(path.join(BACKUP_DIR, f), { force: true }));
  }
  return { name, size: fs.statSync(target).size };
}

function pathOf(name) {
  if (!SAFE_NAME.test(String(name || ""))) return null;
  const file = path.join(BACKUP_DIR, name);
  return fs.existsSync(file) ? file : null;
}

const lastAuto = () => list().find((b) => b.kind === "auto") || null;

// Une copie par jour : vérifiée au démarrage (après une minute) puis toutes les heures. Désactivée dans les tests
// (SAUVEGARDE_AUTO=1 la force, 0 la coupe).
function startDailyBackups({ log = console } = {}) {
  const flag = process.env.SAUVEGARDE_AUTO;
  if (flag === "0" || (process.env.NODE_ENV === "test" && flag !== "1")) return null;
  const tick = () => {
    try {
      const last = lastAuto();
      if (last && Date.now() - last.createdAt.getTime() < DAY_MS - 60 * 60 * 1000) return;
      const { name } = createBackup({ auto: true });
      log.log(`[KOLAKISA] Sauvegarde automatique de la base : ${name}`);
    } catch (error) {
      log.error("[KOLAKISA] Sauvegarde automatique impossible :", error.message);
    }
  };
  const first = setTimeout(tick, Number(process.env.SAUVEGARDE_DELAI_MS) || 60 * 1000);
  first.unref();
  const every = setInterval(tick, 60 * 60 * 1000);
  every.unref();
  return { stop: () => { clearTimeout(first); clearInterval(every); } };
}

// ---------- Archive des fichiers envoyés (format tar, sans dépendance) ----------

// Fichiers du dossier des envois, chemins relatifs (les dossiers temporaires et fichiers cachés sont ignorés)
function uploadFiles() {
  if (!fs.existsSync(uploadsRoot)) return [];
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) out.push({ rel: path.relative(uploadsRoot, full).split(path.sep).join("/"), full, size: fs.statSync(full).size });
    }
  };
  walk(uploadsRoot);
  return out;
}

function uploadsSummary() {
  const files = uploadFiles();
  return { count: files.length, size: files.reduce((n, f) => n + f.size, 0) };
}

// Découpe d'un chemin pour l'en-tête tar (ustar) : nom ≤ 100 octets, les dossiers au-delà dans « prefix » (≤ 155).
// null si le chemin ne tient pas dans ce format.
function splitTarName(name) {
  if (Buffer.byteLength(name) <= 100) return { prefix: "", base: name };
  for (let cut = name.indexOf("/"); cut !== -1; cut = name.indexOf("/", cut + 1)) {
    const prefix = name.slice(0, cut);
    const base = name.slice(cut + 1);
    if (Buffer.byteLength(prefix) <= 155 && Buffer.byteLength(base) <= 100) return { prefix, base };
  }
  return null;
}

// En-tête tar (ustar) d'un fichier
function tarHeader(name, size, mtime) {
  const h = Buffer.alloc(512);
  const { prefix, base } = splitTarName(name);
  const put = (str, offset, len) => h.write(str, offset, len, "utf8");
  const oct = (n, len) => n.toString(8).padStart(len - 1, "0") + "\0";
  put(base, 0, 100);
  put(oct(0o644, 8), 100, 8);
  put(oct(0, 8), 108, 8);
  put(oct(0, 8), 116, 8);
  put(oct(size, 12), 124, 12);
  put(oct(Math.floor(mtime / 1000), 12), 136, 12);
  h.fill(" ", 148, 156); // somme de contrôle calculée avec ce champ rempli d'espaces
  put("0", 156, 1);
  put("ustar\0", 257, 6);
  put("00", 263, 2);
  put(prefix, 345, 155);
  let sum = 0;
  for (const byte of h) sum += byte;
  put(sum.toString(8).padStart(6, "0") + "\0 ", 148, 8);
  return h;
}

// Écrit l'archive dans `out` (réponse HTTP), fichier par fichier, sans tout charger en mémoire
async function streamUploadsTar(out) {
  const write = (chunk) => new Promise((resolve, reject) => {
    if (out.destroyed) return reject(new Error("téléchargement interrompu"));
    if (out.write(chunk)) resolve();
    else out.once("drain", resolve);
  });
  for (const file of uploadFiles()) {
    const name = `uploads/${file.rel}`;
    if (!splitTarName(name)) continue; // chemin trop long pour le format tar : ignoré
    let stat;
    try { stat = fs.statSync(file.full); } catch { continue; } // fichier supprimé entre-temps
    await write(tarHeader(name, stat.size, stat.mtimeMs));
    let written = 0;
    // Exactement la taille annoncée dans l'en-tête, même si le fichier grossit pendant la lecture
    if (stat.size > 0) {
      for await (const chunk of fs.createReadStream(file.full, { end: stat.size - 1 })) {
        await write(chunk);
        written += chunk.length;
      }
    }
    if (written < stat.size) await write(Buffer.alloc(stat.size - written)); // fichier raccourci pendant la lecture
    const pad = (512 - (stat.size % 512)) % 512;
    if (pad) await write(Buffer.alloc(pad));
  }
  await write(Buffer.alloc(1024)); // fin d'archive
}

module.exports = { BACKUP_DIR, list, createBackup, pathOf, lastAuto, startDailyBackups, uploadsSummary, streamUploadsTar, tarHeader };
