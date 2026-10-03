// Récupération des fichiers envoyés restés dans le dossier du projet ou dans les versions précédentes déployées.
// Contexte : chez Hostinger, chaque déploiement crée un nouveau dossier (hbuilds/versions/<id>/…). Tant que les fichiers
// envoyés étaient rangés dans le dossier du projet, chaque publication les « perdait ». Désormais ils sont rangés dans un
// dossier conservé (voir paths.js) ; au démarrage, on recopie ceux qu'on retrouve encore, sans jamais écraser un fichier
// existant ni rien supprimer. Tâche en arrière-plan : ne retarde pas le démarrage du site.
const fs = require("fs");
const path = require("path");
const paths = require("./paths");

const SUBDIRS = ["thumbnails", "videos", "resources", "blog"];

// Dossiers « uploads » candidats : celui du projet actuel et ceux des versions sœurs (…/versions/<id>/<même chemin>)
function candidates({ uploadsRoot = paths.uploadsRoot, projectRoot = paths.projectRoot, projectUploads = paths.projectUploads } = {}) {
  const out = [projectUploads];
  const versionDir = path.dirname(projectRoot) === projectRoot ? null : findVersionRoot(projectRoot);
  if (versionDir) {
    const versions = path.dirname(versionDir);
    const inner = path.relative(versionDir, projectRoot);
    let entries = [];
    try { entries = fs.readdirSync(versions, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch { entries = []; }
    for (const name of entries) {
      const dir = path.join(versions, name, inner, "uploads");
      if (path.resolve(dir) !== path.resolve(projectUploads)) out.push(dir);
    }
  }
  return out.filter((d) => path.resolve(d) !== path.resolve(uploadsRoot));
}
// Remonte jusqu'au dossier dont le parent s'appelle « versions » (structure Hostinger), sinon null
function findVersionRoot(start) {
  let dir = start;
  for (let i = 0; i < 4; i++) {
    const parent = path.dirname(dir);
    if (path.basename(parent) === "versions") return dir;
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

async function recoverUploads({ log = console.log, uploadsRoot = paths.uploadsRoot, projectRoot = paths.projectRoot, projectUploads = paths.projectUploads } = {}) {
  if (path.resolve(uploadsRoot) === path.resolve(projectUploads)) return { copied: 0, skipped: true };
  let copied = 0;
  let sources = 0;
  for (const src of candidates({ uploadsRoot, projectRoot, projectUploads })) {
    let found = false;
    for (const sub of SUBDIRS) {
      let files = [];
      try { files = await fs.promises.readdir(path.join(src, sub)); } catch { continue; }
      found = true;
      for (const f of files) {
        if (f.startsWith(".")) continue;
        try {
          await fs.promises.mkdir(path.join(uploadsRoot, sub), { recursive: true });
          await fs.promises.copyFile(path.join(src, sub, f), path.join(uploadsRoot, sub, f), fs.constants.COPYFILE_EXCL);
          copied++;
        } catch { /* déjà présent ou illisible : on ne touche à rien */ }
      }
    }
    if (found) sources++;
  }
  if (copied) log(`[KOLAKISA] Fichiers envoyés récupérés dans le dossier conservé : ${copied} (depuis ${sources} ancien(s) dossier(s)).`);
  return { copied, sources };
}

module.exports = { recoverUploads, candidates, findVersionRoot };
