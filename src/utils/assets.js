// Adresse d'un fichier statique avec un numéro de version dérivé de son contenu :
//   asset("/css/style.css")  →  "/css/style.css?v=1a2b3c4d"
// Tant que le fichier ne change pas, le navigateur le garde un an sans le retélécharger ;
// dès qu'on le modifie, le numéro change et le navigateur récupère la nouvelle version.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PUBLIC_DIR = path.join(__dirname, "..", "..", "public");
const cache = new Map(); // adresse -> { mtimeMs, size, version }

function asset(url) {
  const file = path.join(PUBLIC_DIR, url);
  if (!file.startsWith(PUBLIC_DIR)) return url;
  let stat;
  try {
    stat = fs.statSync(file);
  } catch {
    return url; // fichier inconnu : on ne fabrique pas de version
  }
  const known = cache.get(url);
  if (!known || known.mtimeMs !== stat.mtimeMs || known.size !== stat.size) {
    const version = crypto.createHash("sha1").update(fs.readFileSync(file)).digest("hex").slice(0, 8);
    cache.set(url, { mtimeMs: stat.mtimeMs, size: stat.size, version });
    return `${url}?v=${version}`;
  }
  return `${url}?v=${known.version}`;
}

module.exports = { asset };
