// Essai de reconstruction (palier 3, livraison 1) — côté application : verrou, dossier temporaire privé, processus séparé, délai maximal, nettoyage garanti.
// L'essai tourne dans un PROCESSUS À PART (la base du site, synchrone, n'est jamais bloquée) avec un environnement vide (aucun secret transmis).
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const SCRIPT = path.join(__dirname, "..", "..", "scripts", "essai-reconstruction.js");
const DEFAULT_TIMEOUT = 180000;
const MAX_OUTPUT = 400 * 1024;

class EssaiError extends Error {}

const rootDefault = () => path.join(require("../config/paths").dataDir, "essais-temporaires");
const leftovers = (root) => (fs.existsSync(root) ? fs.readdirSync(root).filter((f) => f.startsWith("essai-")) : []);

// Verrou : un seul essai à la fois (création de dossier atomique). Un verrou plus vieux que le délai maximal + 1 minute est considéré comme abandonné.
function acquire(root, timeoutMs) {
  const lock = path.join(root, ".verrou");
  for (let attempt = 0; attempt < 2; attempt++) {
    try { fs.mkdirSync(lock); return lock; } catch (error) {
      if (error.code !== "EEXIST") throw error;
      const age = Date.now() - fs.statSync(lock).mtimeMs;
      if (age < timeoutMs + 60000) throw new EssaiError("Un essai est déjà en cours. Réessayez dans quelques minutes.");
      fs.rmSync(lock, { recursive: true, force: true });
    }
  }
  throw new EssaiError("Impossible de verrouiller l'essai.");
}

// file : chemin d'une sauvegarde (déjà validé par l'appelant). Retourne le résultat de l'essai + le compte rendu du nettoyage.
async function runOnFile(file, { root = rootDefault(), timeoutMs = DEFAULT_TIMEOUT, script = SCRIPT } = {}) {
  fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  fs.chmodSync(root, 0o700);
  const lock = acquire(root, timeoutMs);
  let work = null, result, timedOut = false;
  try {
    for (const old of leftovers(root)) fs.rmSync(path.join(root, old), { recursive: true, force: true }); // restes d'un essai interrompu (nous tenons le verrou : aucun essai en cours)
    work = fs.mkdtempSync(path.join(root, "essai-"));
    fs.chmodSync(work, 0o700);
    result = await new Promise((resolve) => {
      let out = "", err = "", settled = false;
      const child = spawn(process.execPath, [script, file, work], { env: { PATH: process.env.PATH || "" }, stdio: ["ignore", "pipe", "pipe"] });
      const done = (value) => { if (!settled) { settled = true; clearTimeout(timer); resolve(value); } };
      const timer = setTimeout(() => { timedOut = true; child.kill("SIGKILL"); }, timeoutMs);
      child.stdout.on("data", (d) => { if (out.length < MAX_OUTPUT) out += d; else child.kill("SIGKILL"); });
      child.stderr.on("data", (d) => { if (err.length < 4000) err += d; });
      child.on("error", (error) => done({ verdict: "erreur", error: `Lancement impossible : ${String(error.message).slice(0, 120)}` }));
      child.on("close", () => {
        if (timedOut) return done({ verdict: "erreur", error: `Délai dépassé (${Math.round(timeoutMs / 1000)} s) : l'essai a été interrompu.` });
        try { done(JSON.parse(out)); } catch { done({ verdict: "erreur", error: "Résultat illisible de l'essai (voir le journal du serveur)." }); }
        if (err.trim()) console.error("[KOLAKISA] Essai de reconstruction (sortie d'erreur) :", err.trim().slice(0, 800));
      });
    });
  } finally {
    // Nettoyage garanti, même après une erreur ou un délai dépassé
    if (work) fs.rmSync(work, { recursive: true, force: true });
    fs.rmSync(lock, { recursive: true, force: true });
  }
  result.cleanup = { workDirRemoved: work ? !fs.existsSync(work) : true, leftovers: leftovers(root).length, lockReleased: !fs.existsSync(lock) };
  return result;
}

async function run(backupName, options) {
  const backups = require("./backups");
  const file = backups.pathOf(backupName);
  if (!file) throw new EssaiError("Sauvegarde introuvable.");
  return runOnFile(file, options);
}

module.exports = { run, runOnFile, EssaiError, rootDefault };
