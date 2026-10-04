// Suppression d'un fichier envoyé par le formateur (miniature, vidéo, pièce jointe, image d'article).
const fs = require("fs");
const { resolveUpload } = require("./storage");

// relativePath est de la forme "/uploads/videos/xxx.mp4" (valeur stockée en base)
// Toute suppression physique est tracée (MEDIA_DELETED) : on peut toujours savoir quand et pourquoi un fichier a disparu.
// Seul un chemin situé DANS le dossier des envois peut être supprimé (voir storage.resolveUpload : jamais « .. »).
// Renvoie true si un fichier a été effacé ; une vraie erreur d'effacement (droits…) est remontée à l'appelant.
function removeUploadedFile(relativePath, reason = "non précisée") {
  const filePath = resolveUpload(relativePath);
  if (!filePath) return false;
  const existed = fs.existsSync(filePath);
  fs.rmSync(filePath, { force: true });
  if (existed && process.env.NODE_ENV !== "test") console.log(`[médias] MEDIA_DELETED ${relativePath} — raison : ${reason}`);
  return existed;
}

module.exports = { removeUploadedFile };
