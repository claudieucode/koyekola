// Photos du diaporama de l'accueil : tous les fichiers « nom-1600.jpg » du dossier public/img/accueil.
// Chaque photo peut avoir une version plus légère « nom-800.jpg » (utilisée sur téléphone).
// Pour changer les photos du site : remplacez ou ajoutez des fichiers dans ce dossier, sans toucher au code.
const fs = require("fs");
const path = require("path");

const DEFAULT_DIR = path.join(__dirname, "..", "..", "public", "img", "accueil");
const SAFE_NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]*-1600\.(jpe?g|webp)$/;

function listHeroImages(dir = DEFAULT_DIR, urlBase = "/img/accueil") {
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch {
    return []; // dossier absent : le bandeau s'affiche sans diaporama
  }
  return files
    .filter((f) => SAFE_NAME.test(f))
    .sort()
    .map((f) => {
      const small = f.replace("-1600.", "-800.");
      const src = `${urlBase}/${f}`;
      return { src, srcset: files.includes(small) ? `${urlBase}/${small} 800w, ${src} 1600w` : `${src} 1600w` };
    });
}

module.exports = { listHeroImages };
