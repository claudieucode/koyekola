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

// Structure réelle chez Hostinger : …/domains/<site>/hbuilds/<build>/… (« current » pointe vers le dernier build).
// Remonte jusqu'au dossier « hbuilds », puis cherche les dossiers « uploads » des builds précédents (profondeur bornée).
function findHbuilds(start) {
  let dir = start;
  for (let i = 0; i < 6; i++) { if (path.basename(dir) === "hbuilds") return dir; const parent = path.dirname(dir); if (parent === dir) return null; dir = parent; }
  return null;
}
function uploadsDirsUnder(root, maxDepth = 5) {
  const out = [];
  const walk = (dir, depth) => {
    if (depth > maxDepth) return;
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory() || e.name === "node_modules" || e.name.startsWith(".")) continue;
      const full = path.join(dir, e.name);
      if (e.name === "uploads") out.push(full); else walk(full, depth + 1);
    }
  };
  walk(root, 0);
  return out;
}

async function recoverUploads({ log = console.log, uploadsRoot = paths.uploadsRoot, projectRoot = paths.projectRoot, projectUploads = paths.projectUploads } = {}) {
  if (path.resolve(uploadsRoot) === path.resolve(projectUploads)) return { copied: 0, skipped: true };
  // Uniquement sur l'hébergement (builds Hostinger) : jamais sur un poste de développement ni pendant les tests
  // (le dossier du projet y est le stockage réel, il ne doit pas être recopié)
  const hbuilds = findHbuilds(projectRoot);
  if (!findVersionRoot(projectRoot) && !hbuilds) return { copied: 0, skipped: true };
  let copied = 0;
  let sources = 0;
  const realUploads = (() => { try { return fs.realpathSync(uploadsRoot); } catch { return path.resolve(uploadsRoot); } })();
  const all = new Set(candidates({ uploadsRoot, projectRoot, projectUploads }).map((d) => path.resolve(d)));
  if (hbuilds) for (const d of uploadsDirsUnder(hbuilds)) { const r = (() => { try { return fs.realpathSync(d); } catch { return path.resolve(d); } })(); if (r !== realUploads) all.add(r); }
  for (const src of all) {
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
  log(`[médias] Récupération au démarrage : ${copied} fichier(s) recopié(s) dans le dossier conservé, depuis ${sources} ancien(s) dossier(s) de build examiné(s) sur ${all.size}.`);
  return { copied, sources, scanned: all.size };
}

module.exports = { recoverUploads, candidates, findVersionRoot, findHbuilds, uploadsDirsUnder };
